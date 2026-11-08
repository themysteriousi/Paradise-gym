import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useDemoStore } from '@/stores/demoStore';
import type {
  DbMember,
  DbMembership,
  DbMembershipPlan,
  DbPayment,
  DbAttendance,
  DbExpense,
  DbGymClosure,
} from '@/types/database';

export const dataSyncService = {
  /**
   * Synchronize all live data for the active gym from Supabase into the application store
   */
  async syncGymData(gymId: string): Promise<void> {
    if (!isSupabaseConfigured || !gymId) {
      return;
    }

    try {
      // Clear any leftover demo mock data before loading live records
      useDemoStore.getState().clearForLiveMode();

      // Parallel fetch of gym records from Supabase
      const [
        membersRes,
        paymentsRes,
        attendanceRes,
        plansRes,
        membershipsRes,
        expensesRes,
        closuresRes,
      ] = await Promise.all([
        supabase.from('members').select('*').eq('gym_id', gymId).order('created_at', { ascending: false }),
        supabase.from('payments').select('*').eq('gym_id', gymId).order('paid_at', { ascending: false }),
        supabase.from('attendance').select('*').eq('gym_id', gymId).order('checked_in_at', { ascending: false }),
        supabase.from('membership_plans').select('*').eq('gym_id', gymId).order('price_paise', { ascending: true }),
        supabase.from('memberships').select('*').eq('gym_id', gymId).order('created_at', { ascending: false }),
        supabase.from('expenses').select('*').eq('gym_id', gymId).order('expense_date', { ascending: false }),
        supabase.from('gym_closures').select('*').eq('gym_id', gymId).order('start_date', { ascending: false }),
      ]);

      const members = (membersRes.data || []) as DbMember[];
      const payments = (paymentsRes.data || []) as DbPayment[];
      const attendance = (attendanceRes.data || []) as DbAttendance[];
      const plans = (plansRes.data || []) as DbMembershipPlan[];
      const memberships = (membershipsRes.data || []) as DbMembership[];
      const expenses = (expensesRes.data || []) as DbExpense[];
      const closures = (closuresRes.data || []) as DbGymClosure[];

      useDemoStore.setState({
        members,
        payments,
        attendance,
        plans,
        memberships,
        expenses,
        closures,
      });
    } catch (err) {
      console.error('Failed to sync gym data from Supabase:', err);
    }
  },
};

