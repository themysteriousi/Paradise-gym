import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useDemoStore } from '@/stores/demoStore';
import { DEFAULT_GYM } from '@/stores/authStore';
import { validateQrToken } from './qrService';
import { membershipService } from './membershipService';
import type { DbAttendance, DbMember, DbMembership, AttendanceMethod } from '@/types/database';

function toValidGymUuid(gymId?: string | null): string {
  if (!gymId) return DEFAULT_GYM.id;
  const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(gymId);
  return isUuid ? gymId : DEFAULT_GYM.id;
}

export interface ProcessCheckInInput {
  gym_id: string;
  tokenString?: string;
  member_id?: string;
  phone?: string;
  method: AttendanceMethod;
  checked_in_by?: string | null;
  device_id?: string | null;
  note?: string | null;
}

export interface CheckInResult {
  success: boolean;
  member?: DbMember;
  attendanceRecord?: DbAttendance;
  isDuplicateWarning?: boolean;
  statusWarning?: string;
  hasOutstandingDues?: boolean;
  planName?: string;
  daysRemaining?: number;
  error?: string;
}

export interface RecentCheckInStatus {
  hasRecent: boolean;
  minutesAgo?: number;
  lastCheckedInAt?: string;
}

/**
 * Check if member checked in recently within threshold minutes (e.g. 15 mins)
 */
export function checkRecentCheckIn(
  memberId: string,
  thresholdMinutes = 15
): RecentCheckInStatus {
  const attendance = useDemoStore.getState().attendance;
  const now = new Date().getTime();

  const memberRecords = attendance
    .filter((a) => a.member_id === memberId)
    .sort(
      (a, b) =>
        new Date(b.checked_in_at).getTime() - new Date(a.checked_in_at).getTime()
    );

  if (memberRecords.length === 0) {
    return { hasRecent: false };
  }

  const latest = memberRecords[0];
  const diffMinutes =
    (now - new Date(latest.checked_in_at).getTime()) / (1000 * 60);

  if (diffMinutes <= thresholdMinutes) {
    return {
      hasRecent: true,
      minutesAgo: Math.max(0, Math.round(diffMinutes)),
      lastCheckedInAt: latest.checked_in_at,
    };
  }

  return { hasRecent: false };
}

/**
 * Process member check-in from QR scan or manual desk lookup
 */
export async function processMemberCheckIn(
  input: ProcessCheckInInput
): Promise<CheckInResult> {
  let member: DbMember | undefined;

  // 1. Resolve Member
  if (input.tokenString) {
    const valRes = await validateQrToken(input.tokenString);
    if (!valRes.isValid || !valRes.member) {
      return { success: false, error: valRes.error || 'Invalid QR token' };
    }
    member = valRes.member;
  } else if (input.member_id) {
    // Check local store first
    member = useDemoStore
      .getState()
      .members.find((m) => m.id === input.member_id);

    if (!member && isSupabaseConfigured) {
      try {
        const timeoutPromise = new Promise<{ data: null; error: Error }>((_, reject) =>
          setTimeout(() => reject(new Error('Supabase member lookup timed out')), 3500)
        );
        const queryPromise = supabase
          .from('members')
          .select('*')
          .eq('id', input.member_id)
          .single();

        const { data, error } = (await Promise.race([queryPromise, timeoutPromise])) as {
          data: DbMember | null;
          error: unknown;
        };
        if (!error && data) {
          member = data;
          useDemoStore.getState().addMember(data);
        }
      } catch (_) {}
    }

    if (!member) {
      return { success: false, error: 'Member profile not found.' };
    }
  } else if (input.phone) {
    let cleanPhone = input.phone.trim().replace(/\D/g, '');
    if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      cleanPhone = cleanPhone.slice(2);
    } else if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.slice(1);
    }

    // Try high-speed SECURITY DEFINER RPC first if Supabase is connected
    if (isSupabaseConfigured && input.method === 'kiosk') {
      try {
        const rpcTargetGym = toValidGymUuid(input.gym_id);
        const timeoutPromise = new Promise<{ data: null; error: Error }>((_, reject) =>
          setTimeout(() => reject(new Error('RPC timeout')), 3500)
        );
        const rpcPromise = supabase.rpc('kiosk_check_in', {
          p_gym_id: rpcTargetGym,
          p_phone: cleanPhone,
        });

        const { data: rpcData, error: rpcError } = (await Promise.race([
          rpcPromise,
          timeoutPromise,
        ])) as { data: any; error: any };

        if (!rpcError && rpcData) {
          if (rpcData.success) {
            const memberObj: DbMember = {
              id: rpcData.member.id,
              gym_id: input.gym_id,
              full_name: rpcData.member.full_name,
              phone: rpcData.member.phone,
              email: null,
              date_of_birth: null,
              gender: null,
              address: null,
              emergency_contact: null,
              photo_url: null,
              status: rpcData.member.status || 'active',
              join_date: new Date().toISOString().slice(0, 10),
              notes: null,
              archived_at: null,
              archived_by: null,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };

            useDemoStore.getState().recordAttendance({
              id: `att-cloud-${Date.now()}`,
              gym_id: input.gym_id,
              member_id: memberObj.id,
              membership_id: 'cloud-membership',
              method: 'kiosk',
              checked_in_at: rpcData.checkedInAt || new Date().toISOString(),
              checked_in_by: null,
              device_id: null,
              note: 'Wall QR Self-Checkin',
              is_correction: false,
              original_id: null,
              corrected_by: null,
              corrected_at: null,
              correction_reason: null,
            });

            return {
              success: true,
              member: memberObj,
              planName: rpcData.planName,
              daysRemaining: rpcData.daysRemaining,
              isDuplicateWarning: rpcData.isDuplicateWarning,
            };
          } else {
            return {
              success: false,
              error: rpcData.error || 'Check-in failed.',
            };
          }
        }
      } catch (_) {
        // Fallback to local and direct lookup below
      }
    }

    // Step A: Check local store for any member with this phone
    const localMember = useDemoStore.getState().members.find((m) => {
      const mPhone = (m.phone || '').trim().replace(/\D/g, '');
      return (
        mPhone === cleanPhone ||
        mPhone.endsWith(cleanPhone) ||
        cleanPhone.endsWith(mPhone)
      );
    });

    if (localMember) {
      if (localMember.status === 'archived') {
        return {
          success: false,
          error: 'Your membership profile is currently archived / inactive. Please contact the front desk to reactivate your pass.',
        };
      }
      member = localMember;
    }

    // Step B: If not in local store, query Supabase with safety timeout
    if (!member && isSupabaseConfigured) {
      try {
        const timeoutPromise = new Promise<{ data: null; error: Error }>((_, reject) =>
          setTimeout(() => reject(new Error('Supabase query timeout')), 3500)
        );
        const queryPromise = supabase
          .from('members')
          .select('*')
          .eq('phone', cleanPhone)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        const { data, error } = (await Promise.race([queryPromise, timeoutPromise])) as {
          data: DbMember | null;
          error: unknown;
        };

        if (!error && data) {
          if (data.status === 'archived') {
            return {
              success: false,
              error: 'Your membership profile is currently archived / inactive. Please contact the front desk to reactivate your pass.',
            };
          }
          member = data;
          useDemoStore.getState().addMember(data);
        }
      } catch (err) {
        console.warn('Supabase member lookup timed out or failed:', err);
      }
    }

    if (!member) {
      return {
        success: false,
        error: `Member not found with mobile number ${cleanPhone}. Please register at the desk.`,
      };
    }
  }

  if (!member) {
    return { success: false, error: 'Member identity could not be verified' };
  }

  if (member.status === 'archived') {
    return {
      success: false,
      error: 'Your membership profile is currently archived / inactive. Please contact the front desk to reactivate your pass.',
    };
  }

  // 2. Check for rapid duplicate check-in (within 15 minutes)
  const recent = checkRecentCheckIn(member.id, 15);
  const isDuplicateWarning = recent.hasRecent;

  // 3. Status and Dues warnings based on real membership data
  let activeMs: DbMembership | null = null;
  try {
    const msPromise = membershipService.getMemberActiveMembership(member.id);
    const msTimeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 2500));
    activeMs = await Promise.race([msPromise, msTimeout]);
  } catch (_) {
    activeMs = null;
  }

  const membershipId = activeMs?.id || null;

  let planName = 'Active Member';
  let daysRemaining: number | undefined;

  if (activeMs) {
    try {
      const plans = await membershipService.getPlans(input.gym_id);
      const plan = plans.find((p) => p.id === activeMs?.plan_id);
      if (plan) planName = plan.name;
    } catch (_) {}

    const expDate = new Date(activeMs.end_date);
    const diff = expDate.getTime() - Date.now();
    daysRemaining = Math.max(0, Math.ceil(diff / 86400000));
  }

  let statusWarning: string | undefined;
  if (!activeMs) {
    statusWarning = undefined;
  } else if (new Date(activeMs.end_date).getTime() < Date.now()) {
    statusWarning = `Membership expired on ${new Date(activeMs.end_date).toLocaleDateString('en-IN')}. Please renew.`;
  } else if (activeMs.status === 'paused') {
    statusWarning = 'Membership is PAUSED.';
  }

  const hasOutstandingDues = activeMs ? (activeMs.balance_paise || 0) > 0 : false;

  // 4. Record attendance
  const now = new Date().toISOString();
  const recordId = `att-${Date.now()}`;

  const attendanceRecord: DbAttendance = {
    id: recordId,
    gym_id: input.gym_id,
    member_id: member.id,
    membership_id: membershipId || 'unassigned',
    method: input.method,
    checked_in_at: now,
    checked_in_by: input.checked_in_by || null,
    device_id: input.device_id || null,
    note: input.note || null,
    is_correction: false,
    original_id: null,
    corrected_by: null,
    corrected_at: null,
    correction_reason: null,
  };

  // Always record locally so desk terminal updates instantly
  useDemoStore.getState().recordAttendance(attendanceRecord);

  // If Supabase is configured, record in Supabase in background
  if (isSupabaseConfigured && !input.gym_id.startsWith('demo-')) {
    void (async () => {
      try {
        const { error } = await supabase.from('attendance').insert({
          gym_id: toValidGymUuid(input.gym_id),
          member_id: member.id,
          membership_id: membershipId && !membershipId.startsWith('demo-') ? membershipId : null,
          method: input.method,
          checked_in_at: now,
          checked_in_by: input.checked_in_by || null,
          device_id: input.device_id || null,
          note: input.note || null,
        });
        if (error) {
          console.warn('Supabase attendance insert error:', error.message || error);
        }
      } catch (err) {
        console.warn('Supabase attendance insert exception:', err);
      }
    })();
  }

  return {
    success: true,
    member,
    attendanceRecord,
    isDuplicateWarning,
    statusWarning,
    hasOutstandingDues,
    planName,
    daysRemaining,
  };
}

/**
 * Get attendance check-ins recorded today (local calendar day)
 */
export function getTodaysAttendanceLog(): DbAttendance[] {
  const attendance = useDemoStore.getState().attendance;
  const now = new Date();
  const startOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();

  return attendance
    .filter((a) => new Date(a.checked_in_at).getTime() >= startOfDay)
    .sort(
      (a, b) =>
        new Date(b.checked_in_at).getTime() - new Date(a.checked_in_at).getTime()
    );
}

/**
 * Sync today's attendance logs from Supabase cloud into local store
 */
export async function syncTodaysAttendanceFromCloud(gymId?: string): Promise<DbAttendance[]> {
  if (!isSupabaseConfigured) return getTodaysAttendanceLog();

  try {
    const now = new Date();
    const startOfDay = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate()
    ).toISOString();

    const targetGymId = toValidGymUuid(gymId);
    const { data, error } = await supabase
      .from('attendance')
      .select('*')
      .or(`gym_id.eq.${targetGymId},gym_id.eq.${DEFAULT_GYM.id}`)
      .gte('checked_in_at', startOfDay)
      .order('checked_in_at', { ascending: false });

    if (!error && data) {
      const store = useDemoStore.getState();
      const map = new Map<string, DbAttendance>();
      for (const a of store.attendance) map.set(a.id, a);
      for (const a of data) map.set(a.id, a as DbAttendance);
      useDemoStore.setState({ attendance: Array.from(map.values()) });
    }
  } catch (err) {
    console.warn('Could not sync cloud attendance:', err);
  }

  return getTodaysAttendanceLog();
}

