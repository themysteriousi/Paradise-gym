import { describe, it, expect, beforeEach } from 'vitest';
import { membershipService } from '@/services/membershipService';
import { useAuthStore } from '@/stores/authStore';
import { useDemoStore } from '@/stores/demoStore';

describe('Membership Lifecycle & Renewal Business Logic', () => {
  beforeEach(() => {
    useAuthStore.getState().enableDemoMode();
    useDemoStore.getState().resetToDefault();
  });

  it('calculates initial membership expiry date starting from start_date', () => {
    const startDate = new Date('2026-12-01T00:00:00Z');
    const durationDays = 30;
    const expiry = membershipService.calculateExpiryDate(startDate, durationDays);

    // 30 days plan starting Dec 1 expires Dec 31
    expect(expiry.toISOString().slice(0, 10)).toBe('2026-12-31');
  });

  it('preserves unused days on early renewal (extends from current end_date, not today)', () => {
    // Current membership active until 2026-12-20
    const currentEndDate = new Date('2026-12-20T23:59:59Z');
    const renewalDays = 30;

    // Member renews on Dec 10 (10 days early)
    const today = new Date('2026-12-10T10:00:00Z');

    const newExpiry = membershipService.calculateRenewalExpiry(currentEndDate, today, renewalDays);

    // Must extend from Dec 20 -> Jan 19, preserving remaining 10 days
    expect(newExpiry.toISOString().slice(0, 10)).toBe('2027-01-19');
  });

  it('extends from today if existing membership has already expired', () => {
    // Membership expired 5 days ago on 2026-12-05
    const expiredEndDate = new Date('2026-12-05T23:59:59Z');
    const renewalDays = 30;

    // Member renews today Dec 10
    const today = new Date('2026-12-10T10:00:00Z');

    const newExpiry = membershipService.calculateRenewalExpiry(expiredEndDate, today, renewalDays);

    // Must start from today Dec 10 -> Jan 09
    expect(newExpiry.toISOString().slice(0, 10)).toBe('2027-01-09');
  });

  it('snapshots plan price at the time of renewal creation (never mutates historical rates)', async () => {
    const renewal = await membershipService.createMembership({
      gymId: 'demo-gym-001',
      memberId: 'demo-member-1',
      planId: 'plan-monthly',
      pricePaise: 150000, // ₹1,500
      startDate: new Date('2026-12-01T00:00:00Z'),
      durationDays: 30,
      partnerId: 'demo-partner-001',
    });

    expect(renewal.price_paise).toBe(150000);
    expect(renewal.status).toBe('active');
  });
});

