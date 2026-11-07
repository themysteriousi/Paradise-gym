import { describe, it, expect, beforeEach } from 'vitest';
import {
  processMemberCheckIn,
  getTodaysAttendanceLog,
  checkRecentCheckIn,
} from '@/services/attendanceService';
import { useDemoStore } from '@/stores/demoStore';
import { generateMemberQrToken } from '@/services/qrService';

describe('Attendance Service & Check-In Workflow', () => {
  beforeEach(() => {
    useDemoStore.getState().resetToDefault();
  });

  const memberId = 'demo-member-1';

  it('records attendance check-in via QR scan and adds to today log', async () => {
    // Generate valid token
    const tokenRecord = await generateMemberQrToken({
      gym_id: 'demo-gym-001',
      member_id: memberId,
    });

    const result = await processMemberCheckIn({
      gym_id: 'demo-gym-001',
      tokenString: tokenRecord.token,
      method: 'qr_scan',
    });

    expect(result.success).toBe(true);
    expect(result.member).toBeDefined();
    expect(result.attendanceRecord).toBeDefined();
    expect(result.attendanceRecord?.method).toBe('qr_scan');

    const todaysLog = getTodaysAttendanceLog();
    const found = todaysLog.find((a) => a.id === result.attendanceRecord?.id);
    expect(found).toBeDefined();
  });

  it('records attendance check-in manually by member ID', async () => {
    const result = await processMemberCheckIn({
      gym_id: 'demo-gym-001',
      member_id: 'demo-member-2',
      method: 'manual',
      checked_in_by: 'demo-partner-001',
      note: 'Forgot phone at home',
    });

    expect(result.success).toBe(true);
    expect(result.member?.id).toBe('demo-member-2');
    expect(result.attendanceRecord?.method).toBe('manual');
    expect(result.attendanceRecord?.note).toBe('Forgot phone at home');
  });

  it('detects and flags rapid re-scan within 15 minutes', async () => {
    // First check-in
    await processMemberCheckIn({
      gym_id: 'demo-gym-001',
      member_id: memberId,
      method: 'qr_scan',
    });

    // Check recent
    const recent = checkRecentCheckIn(memberId, 15);
    expect(recent.hasRecent).toBe(true);
    expect(recent.minutesAgo).toBeLessThan(1);

    // Second check-in within window returns warning flag
    const secondResult = await processMemberCheckIn({
      gym_id: 'demo-gym-001',
      member_id: memberId,
      method: 'qr_scan',
    });

    expect(secondResult.success).toBe(true);
    expect(secondResult.isDuplicateWarning).toBe(true);
  });

  it('flags membership status warnings (e.g. pending dues or expired status)', async () => {
    // Member 18 is expired in demo dataset
    const expiredMemberId = 'demo-member-19'; // 19th member in demoDataService
    const result = await processMemberCheckIn({
      gym_id: 'demo-gym-001',
      member_id: expiredMemberId,
      method: 'manual',
    });

    expect(result.success).toBe(true);
    // Even if expired, check-in records but returns status warning
    expect(result.statusWarning).toBeDefined();
  });
});

