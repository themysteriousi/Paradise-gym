import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useDemoStore } from '@/stores/demoStore';
import { useAuthStore } from '@/stores/authStore';
import { validateQrToken } from './qrService';
import { membershipService } from './membershipService';
import type { DbAttendance, DbMember, AttendanceMethod } from '@/types/database';

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
  const isDemoMode =
    useAuthStore.getState().isDemoMode ||
    !isSupabaseConfigured ||
    input.gym_id === 'demo-gym-001' ||
    input.gym_id.startsWith('demo-');
  let member: DbMember | undefined;

  // 1. Resolve Member
  if (input.tokenString) {
    const valRes = await validateQrToken(input.tokenString);
    if (!valRes.isValid || !valRes.member) {
      return { success: false, error: valRes.error || 'Invalid QR token' };
    }
    member = valRes.member;
  } else if (input.member_id) {
    if (isDemoMode) {
      member = useDemoStore
        .getState()
        .members.find((m) => m.id === input.member_id);
    } else {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('id', input.member_id)
        .single();
      if (error || !data) {
        return { success: false, error: 'Member not found' };
      }
      member = data;
    }
  } else if (input.phone) {
    let cleanPhone = input.phone.trim().replace(/\D/g, '');
    if (cleanPhone.length === 12 && cleanPhone.startsWith('91')) {
      cleanPhone = cleanPhone.slice(2);
    } else if (cleanPhone.length === 11 && cleanPhone.startsWith('0')) {
      cleanPhone = cleanPhone.slice(1);
    }

    if (isDemoMode) {
      member = useDemoStore
        .getState()
        .members.find((m) => {
          const mPhone = m.phone.trim().replace(/\D/g, '');
          return (
            (mPhone === cleanPhone || mPhone.endsWith(cleanPhone) || cleanPhone.endsWith(mPhone)) &&
            m.status !== 'archived'
          );
        });
      if (!member) {
        return {
          success: false,
          error: `Member not found with mobile number ${cleanPhone}. Please register at the desk.`,
        };
      }
    } else {
      const { data, error } = await supabase
        .from('members')
        .select('*')
        .eq('gym_id', input.gym_id)
        .eq('phone', cleanPhone)
        .neq('status', 'archived')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        return { success: false, error: 'Member not found with this mobile number. Please register at the desk.' };
      }
      member = data;
    }
  }

  if (!member) {
    return { success: false, error: 'Member identity could not be verified' };
  }

  // 2. Check for rapid duplicate check-in (within 15 minutes)
  const recent = checkRecentCheckIn(member.id, 15);
  const isDuplicateWarning = recent.hasRecent;

  // 3. Status and Dues warnings based on real membership data
  const activeMs = await membershipService.getMemberActiveMembership(member.id);
  const membershipId = activeMs?.id || null;

  let planName = 'No Active Plan';
  let daysRemaining: number | undefined;

  if (activeMs) {
    const plans = await membershipService.getPlans(input.gym_id);
    const plan = plans.find((p) => p.id === activeMs.plan_id);
    if (plan) planName = plan.name;

    const expDate = new Date(activeMs.end_date);
    const diff = expDate.getTime() - Date.now();
    daysRemaining = Math.max(0, Math.ceil(diff / 86400000));
  }

  let statusWarning: string | undefined;
  if (!activeMs) {
    statusWarning = 'No active membership plan on file.';
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

  if (isDemoMode) {
    useDemoStore.getState().recordAttendance(attendanceRecord);
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

  try {
    const { data, error } = await supabase
      .from('attendance')
      .insert({
        gym_id: input.gym_id,
        member_id: member.id,
        membership_id: membershipId,
        method: input.method,
        checked_in_at: now,
        checked_in_by: input.checked_in_by || null,
        device_id: input.device_id || null,
        note: input.note || null,
      })
      .select('*')
      .single();

    if (error) throw error;

    return {
      success: true,
      member,
      attendanceRecord: data,
      isDuplicateWarning,
      statusWarning,
      hasOutstandingDues,
      planName,
      daysRemaining,
    };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to record attendance',
    };
  }
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

