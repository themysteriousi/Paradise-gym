import { describe, it, expect, beforeEach } from 'vitest';
import {
  computeDashboardMetrics,
  getExpiringMemberships,
  getRecentActivityFeed,
} from '@/services/dashboardService';
import { useDemoStore } from '@/stores/demoStore';

describe('Operational Dashboard Service', () => {
  beforeEach(() => {
    useDemoStore.getState().resetToDefault();
  });

  it('computes accurate operational KPI metrics from store data', () => {
    const metrics = computeDashboardMetrics();

    expect(metrics.active_members_count).toBeGreaterThan(0);
    expect(metrics.todays_checkins_count).toBeGreaterThanOrEqual(0);
    expect(metrics.todays_collections_paise).toBeGreaterThanOrEqual(0);
    expect(metrics.expiring_soon_count).toBeGreaterThanOrEqual(0);
    expect(metrics.pending_dues_paise).toBeGreaterThan(0);
  });

  it('identifies memberships expiring within the next 7 days', () => {
    const expiring = getExpiringMemberships(7);
    expect(Array.isArray(expiring)).toBe(true);
    // Each expiring item has member details and daysRemaining <= 7
    expiring.forEach((item) => {
      expect(item.daysRemaining).toBeLessThanOrEqual(7);
      expect(item.member).toBeDefined();
    });
  });

  it('generates a unified chronological activity feed combining check-ins and collections', () => {
    const feed = getRecentActivityFeed(10);
    expect(feed.length).toBeGreaterThan(0);
    expect(feed.length).toBeLessThanOrEqual(10);

    // Verify chronological order (newest first)
    for (let i = 0; i < feed.length - 1; i++) {
      const t1 = new Date(feed[i].timestamp).getTime();
      const t2 = new Date(feed[i + 1].timestamp).getTime();
      expect(t1).toBeGreaterThanOrEqual(t2);
    }
  });
});

