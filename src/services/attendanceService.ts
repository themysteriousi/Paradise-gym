import { supabase } from '@/lib/supabase';
import { useDemoStore } from '@/stores/demoStore';
import { validateQrToken } from './qrService';
import type { DbAttendance, DbMember, AttendanceMethod } from '@/types/database';

export interface ProcessCheckInInput {
  gym_id: string;
  tokenString?: string;
  member_id?: string;
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
  const isDemoMode = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder');
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
  }

  if (!member) {
    return { success: false, error: 'Member identity could not be verified' };
  }

  // 2. Check for rapid duplicate check-in (within 15 minutes)
  const recent = checkRecentCheckIn(member.id, 15);
  const isDuplicateWarning = recent.hasRecent;

  // 3. Status and Dues warnings
  let statusWarning: string | undefined;
  if (member.status === 'expired') {
    statusWarning = 'Membership is EXPIRED. Please renew.';
  } else if (member.status === 'paused') {
    statusWarning = 'Membership is PAUSED.';
  }

  const hasOutstandingDues =
    member.notes?.includes('Pending') || member.id === 'demo-member-1';

  // 4. Record attendance
  const now = new Date().toISOString();
  const recordId = `att-${Date.now()}`;

  const attendanceRecord: DbAttendance = {
    id: recordId,
    gym_id: input.gym_id,
    member_id: member.id,
    membership_id: 'plan-monthly',
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
    };
  }

  try {
    const { data, error } = await supabase
      .from('attendance')
      .insert({
        gym_id: input.gym_id,
        member_id: member.id,
        membership_id: attendanceRecord.membership_id,
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

