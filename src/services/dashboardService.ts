import { useDemoStore } from '@/stores/demoStore';
import { formatRupees } from './paymentService';
import type { DbMember } from '@/types/database';

export interface DashboardMetrics {
  active_members_count: number;
  todays_checkins_count: number;
  todays_collections_paise: number;
  expiring_soon_count: number;
  pending_dues_paise: number;
  total_members_count: number;
}

export interface ExpiringMemberInfo {
  member: DbMember;
  daysRemaining: number;
  planName: string;
  expiryDate: string;
}

export interface DashboardActivityItem {
  id: string;
  type: 'attendance' | 'payment' | 'registration';
  title: string;
  subtitle: string;
  amount_paise?: number;
  timestamp: string;
  iconType: 'checkin' | 'payment' | 'member';
}

/**
 * Compute real-time operational dashboard numbers
 */
export function computeDashboardMetrics(): DashboardMetrics {
  const store = useDemoStore.getState();
  const now = new Date();
  const startOfDay = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  ).getTime();

  // Active members
  const activeMembers = store.members.filter((m) => m.status === 'active');

  // Today's check-ins
  const todaysCheckins = store.attendance.filter(
    (a) => new Date(a.checked_in_at).getTime() >= startOfDay
  );

  // Today's collections
  const todaysCollections = store.payments
    .filter(
      (p) =>
        p.status === 'completed' &&
        new Date(p.paid_at).getTime() >= startOfDay
    )
    .reduce((sum, p) => sum + p.amount_paise, 0);

  // Pending dues (members with notes containing 'Pending')
  const pendingDues = store.members
    .filter((m) => m.notes?.includes('Pending') || m.id === 'demo-member-1')
    .reduce((sum) => sum + 100000, 0); // ₹1,000 each demo due

  // Expiring soon (within 7 days)
  const expiringSoon = getExpiringMemberships(7);

  return {
    active_members_count: activeMembers.length,
    todays_checkins_count: todaysCheckins.length,
    todays_collections_paise: todaysCollections,
    expiring_soon_count: expiringSoon.length,
    pending_dues_paise: pendingDues,
    total_members_count: store.members.length,
  };
}

/**
 * Find memberships expiring within the specified days threshold
 */
export function getExpiringMemberships(daysThreshold = 7): ExpiringMemberInfo[] {
  const store = useDemoStore.getState();
  const now = new Date();
  const result: ExpiringMemberInfo[] = [];

  // In demo dataset, members with join_date calculate dynamic expiry
  store.members.forEach((member, i) => {
    if (member.status !== 'active') return;

    // Simulate expiry dates: some expiring in 2 days, 5 days
    if (i % 6 === 0 || i === 3) {
      const daysLeft = i === 3 ? 2 : 5;
      const expDate = new Date(now.getTime() + daysLeft * 86400000);
      result.push({
        member,
        daysRemaining: daysLeft,
        planName: i % 2 === 0 ? 'Monthly Standard' : 'Quarterly Value',
        expiryDate: expDate.toISOString().slice(0, 10),
      });
    }
  });

  return result.filter((item) => item.daysRemaining <= daysThreshold);
}

/**
 * Generate a combined chronological activity stream
 */
export function getRecentActivityFeed(limit = 10): DashboardActivityItem[] {
  const store = useDemoStore.getState();
  const items: DashboardActivityItem[] = [];

  const memberMap = new Map(store.members.map((m) => [m.id, m]));

  // 1. Attendance check-ins
  store.attendance.forEach((att) => {
    const member = memberMap.get(att.member_id);
    items.push({
      id: att.id,
      type: 'attendance',
      title: `${member?.full_name || 'Member'} Checked In`,
      subtitle: att.method === 'qr_scan' ? 'Scanned Digital QR Pass' : 'Manual Desk Entry',
      timestamp: att.checked_in_at,
      iconType: 'checkin',
    });
  });

  // 2. Payments collected
  store.payments.forEach((pay) => {
    if (pay.status !== 'completed') return;
    const member = memberMap.get(pay.member_id);
    items.push({
      id: pay.id,
      type: 'payment',
      title: `Collected ${formatRupees(pay.amount_paise)}`,
      subtitle: `${member?.full_name || 'Member'} • ${pay.method.toUpperCase()}`,
      amount_paise: pay.amount_paise,
      timestamp: pay.paid_at,
      iconType: 'payment',
    });
  });

  // Sort chronological descending (newest first)
  items.sort(
    (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );

  return items.slice(0, limit);
}

