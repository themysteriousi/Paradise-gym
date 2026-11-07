import type { DbMembership, DbMembershipPlan } from '@/types/database';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useDemoStore } from '@/stores/demoStore';

export interface CreateMembershipInput {
  gymId: string;
  memberId: string;
  planId: string;
  pricePaise: number;
  startDate: Date;
  durationDays: number;
  partnerId: string;
  paidPaise?: number;
}

// In-memory demo memberships
let demoMemberships: DbMembership[] = [];

export const membershipService = {
  calculateExpiryDate(startDate: Date, durationDays: number): Date {
    const expiry = new Date(startDate.getTime());
    expiry.setDate(expiry.getDate() + durationDays);
    return expiry;
  },

  calculateRenewalExpiry(currentEndDate: Date, renewalDate: Date, durationDays: number): Date {
    // If current membership is still active in the future, extend from current end date
    const baseDate = currentEndDate.getTime() > renewalDate.getTime() ? currentEndDate : renewalDate;
    const nextExpiry = new Date(baseDate.getTime());
    nextExpiry.setDate(nextExpiry.getDate() + durationDays);
    return nextExpiry;
  },

  async getPlans(gymId: string): Promise<DbMembershipPlan[]> {
    const isDemo = useAuthStore.getState().isDemoMode || !isSupabaseConfigured;

    if (isDemo) {
      return useDemoStore.getState().plans.filter((p) => p.gym_id === gymId);
    }

    const { data, error } = await supabase
      .from('membership_plans')
      .select('*')
      .eq('gym_id', gymId)
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return (data || []) as DbMembershipPlan[];
  },

  async createMembership(input: CreateMembershipInput): Promise<DbMembership> {
    const isDemo = useAuthStore.getState().isDemoMode || !isSupabaseConfigured;
    const now = new Date().toISOString();
    const expiry = this.calculateExpiryDate(input.startDate, input.durationDays);

    const paid = input.paidPaise || 0;
    const balance = input.pricePaise - paid;

    const record: DbMembership = {
      id: isDemo ? `demo-ms-${Date.now()}` : crypto.randomUUID(),
      gym_id: input.gymId,
      member_id: input.memberId,
      plan_id: input.planId,
      status: 'active',
      start_date: input.startDate.toISOString(),
      end_date: expiry.toISOString(),
      price_paise: input.pricePaise,
      paid_paise: paid,
      balance_paise: balance,
      paused_at: null,
      paused_by: null,
      cancelled_at: null,
      cancelled_by: null,
      cancel_reason: null,
      created_at: now,
      updated_at: now,
    };

    if (isDemo) {
      demoMemberships.push(record);
      return record;
    }

    const { data, error } = await supabase
      .from('memberships')
      .insert({
        gym_id: record.gym_id,
        member_id: record.member_id,
        plan_id: record.plan_id,
        status: record.status,
        start_date: record.start_date,
        end_date: record.end_date,
        price_paise: record.price_paise,
        paid_paise: record.paid_paise,
      })
      .select()
      .single();

    if (error) throw error;
    return data as DbMembership;
  },

  async getMemberActiveMembership(memberId: string): Promise<DbMembership | null> {
    const isDemo = useAuthStore.getState().isDemoMode || !isSupabaseConfigured;

    if (isDemo) {
      return (
        demoMemberships
          .filter((m) => m.member_id === memberId && m.status === 'active')
          .sort((a, b) => new Date(b.end_date).getTime() - new Date(a.end_date).getTime())[0] || null
      );
    }

    const { data, error } = await supabase
      .from('memberships')
      .select('*')
      .eq('member_id', memberId)
      .eq('status', 'active')
      .order('end_date', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error) throw error;
    return data as DbMembership | null;
  },

  _resetDemo() {
    demoMemberships = [];
  },
};
