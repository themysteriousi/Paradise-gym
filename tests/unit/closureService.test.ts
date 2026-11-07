import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateClosureDays,
  createGymClosure,
  getGymClosures,
  getMembershipExtensions,
  calculateExtendedEndDate,
} from '@/services/closureService';
import { useDemoStore } from '@/stores/demoStore';
import { useAuthStore } from '@/stores/authStore';
import type { DbMembership } from '@/types/database';

describe('closureService', () => {
  const gymId = 'demo-gym-001';
  const partnerId = 'demo-partner-001';

  beforeEach(() => {
    useAuthStore.setState({ isDemoMode: true });
    useDemoStore.getState().resetToDefault();
  });

  describe('calculateClosureDays', () => {
    it('calculates 1 day for single-day closure', () => {
      const days = calculateClosureDays('2026-11-10', '2026-11-10');
      expect(days).toBe(1);
    });

    it('calculates 3 days for 3-day inclusive closure', () => {
      const days = calculateClosureDays('2026-11-10', '2026-11-12');
      expect(days).toBe(3);
    });

    it('calculates 7 days for a 1-week closure', () => {
      const days = calculateClosureDays('2026-10-01', '2026-10-07');
      expect(days).toBe(7);
    });

    it('throws or returns 0/error for inverted dates', () => {
      expect(() => calculateClosureDays('2026-11-15', '2026-11-10')).toThrow(
        /end date cannot be before start date/i
      );
    });
  });

  describe('calculateExtendedEndDate', () => {
    it('shifts ISO date string by N days', () => {
      const original = '2026-11-20T00:00:00.000Z';
      const extended = calculateExtendedEndDate(original, 5);
      const diffDays = Math.round(
        (new Date(extended).getTime() - new Date(original).getTime()) / (1000 * 60 * 60 * 24)
      );
      expect(diffDays).toBe(5);
    });
  });

  describe('createGymClosure with auto_extend', () => {
    it('creates closure record without extending memberships when auto_extend is false', async () => {
      const result = await createGymClosure({
        gym_id: gymId,
        created_by: partnerId,
        start_date: '2026-12-25',
        end_date: '2026-12-26',
        reason: 'Christmas Maintenance',
        auto_extend: false,
      });

      expect(result.success).toBe(true);
      expect(result.closure).toBeDefined();
      expect(result.closure?.reason).toBe('Christmas Maintenance');
      expect(result.affectedMembersCount).toBe(0);
      expect(result.extensionsCount).toBe(0);

      const closures = await getGymClosures(gymId);
      expect(closures.some((c) => c.reason === 'Christmas Maintenance')).toBe(true);
    });

    it('creates closure and automatically extends active memberships when auto_extend is true', async () => {
      // Seed a test membership expiring 2026-12-30
      const initialEndDate = '2026-12-30T23:59:59.000Z';
      const testMembership: DbMembership = {
        id: 'test-mem-closure-01',
        gym_id: gymId,
        member_id: 'demo-member-1',
        plan_id: 'plan-monthly',
        status: 'active',
        start_date: '2026-11-01T00:00:00.000Z',
        end_date: initialEndDate,
        price_paise: 150000,
        paid_paise: 150000,
        balance_paise: 0,
        paused_at: null,
        paused_by: null,
        cancelled_at: null,
        cancelled_by: null,
        cancel_reason: null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      };

      // Ensure membership is registered in demo store
      useDemoStore.getState().addMembership?.(testMembership);

      // Create a 3-day closure: 2026-12-10 to 2026-12-12
      const result = await createGymClosure({
        gym_id: gymId,
        created_by: partnerId,
        start_date: '2026-12-10',
        end_date: '2026-12-12',
        reason: 'Diwali Gym Floor Renovation',
        auto_extend: true,
      });

      expect(result.success).toBe(true);
      expect(result.closure?.reason).toBe('Diwali Gym Floor Renovation');
      expect(result.closure?.auto_extend).toBe(true);
      expect(result.extensionsCount).toBeGreaterThanOrEqual(1);

      // Verify extension audit records
      const extensions = await getMembershipExtensions(gymId);
      const ext = extensions.find((e) => e.membership_id === 'test-mem-closure-01');
      expect(ext).toBeDefined();
      expect(ext?.days_added).toBe(3);
      expect(ext?.previous_end).toBe(initialEndDate);
    });
  });
});

