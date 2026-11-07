import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useAuthStore } from '@/stores/authStore';
import { useDemoStore } from '@/stores/demoStore';
import type { DbGymClosure, DbMembershipExtension, DbMembership } from '@/types/database';

export interface CreateClosureInput {
  gym_id: string;
  created_by: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;   // YYYY-MM-DD
  reason: string;
  auto_extend: boolean;
}

export interface CreateClosureResult {
  success: boolean;
  closure?: DbGymClosure;
  affectedMembersCount: number;
  extensionsCount: number;
  error?: string;
}

/**
 * Calculate inclusive closure days between start and end date (YYYY-MM-DD)
 */
export function calculateClosureDays(startDate: string, endDate: string): number {
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(start.getTime()) || isNaN(end.getTime())) {
    throw new Error('Invalid date format provided');
  }

  // Compare calendar days ignoring time of day
  const startUtc = Date.UTC(start.getFullYear(), start.getMonth(), start.getDate());
  const endUtc = Date.UTC(end.getFullYear(), end.getMonth(), end.getDate());

  if (endUtc < startUtc) {
    throw new Error('End date cannot be before start date');
  }

  const diffMs = endUtc - startUtc;
  const days = Math.round(diffMs / (1000 * 60 * 60 * 24)) + 1;
  return days;
}

/**
 * Extends an existing ISO end date string by a given number of days
 */
export function calculateExtendedEndDate(currentEndDateIso: string, daysToAdd: number): string {
  const date = new Date(currentEndDateIso);
  if (isNaN(date.getTime())) {
    throw new Error('Invalid current end date');
  }
  date.setDate(date.getDate() + daysToAdd);
  return date.toISOString();
}

/**
 * Fetch all gym closure records
 */
export async function getGymClosures(gymId: string): Promise<DbGymClosure[]> {
  const isDemo = useAuthStore.getState().isDemoMode || !isSupabaseConfigured;

  if (isDemo) {
    return useDemoStore
      .getState()
      .closures.filter((c) => c.gym_id === gymId)
      .sort((a, b) => new Date(b.start_date).getTime() - new Date(a.start_date).getTime());
  }

  const { data, error } = await supabase
    .from('gym_closures')
    .select('*')
    .eq('gym_id', gymId)
    .order('start_date', { ascending: false });

  if (error) {
    console.error('Error fetching gym closures:', error);
    return [];
  }

  return (data || []) as DbGymClosure[];
}

/**
 * Fetch membership extension audit records
 */
export async function getMembershipExtensions(
  gymId: string
): Promise<DbMembershipExtension[]> {
  const isDemo = useAuthStore.getState().isDemoMode || !isSupabaseConfigured;

  if (isDemo) {
    return useDemoStore
      .getState()
      .extensions.filter((e) => e.gym_id === gymId)
      .sort((a, b) => new Date(b.extended_at).getTime() - new Date(a.extended_at).getTime());
  }

  const { data, error } = await supabase
    .from('membership_extensions')
    .select('*')
    .eq('gym_id', gymId)
    .order('extended_at', { ascending: false });

  if (error) {
    console.error('Error fetching membership extensions:', error);
    return [];
  }

  return (data || []) as DbMembershipExtension[];
}

/**
 * Record a gym closure and optionally auto-extend all active memberships
 */
export async function createGymClosure(
  input: CreateClosureInput
): Promise<CreateClosureResult> {
  if (!input.reason || !input.reason.trim()) {
    return {
      success: false,
      affectedMembersCount: 0,
      extensionsCount: 0,
      error: 'Closure reason is required',
    };
  }

  let daysAdded = 0;
  try {
    daysAdded = calculateClosureDays(input.start_date, input.end_date);
  } catch (err: unknown) {
    return {
      success: false,
      affectedMembersCount: 0,
      extensionsCount: 0,
      error: err instanceof Error ? err.message : 'Invalid closure dates',
    };
  }

  const isDemo = useAuthStore.getState().isDemoMode || !isSupabaseConfigured;
  const now = new Date().toISOString();
  const closureId = isDemo ? `demo-closure-${Date.now()}` : crypto.randomUUID();

  const closure: DbGymClosure = {
    id: closureId,
    gym_id: input.gym_id,
    created_by: input.created_by,
    start_date: input.start_date,
    end_date: input.end_date,
    reason: input.reason.trim(),
    auto_extend: input.auto_extend,
    created_at: now,
  };

  if (isDemo) {
    useDemoStore.getState().addClosure(closure);

    let extendedCount = 0;
    if (input.auto_extend && daysAdded > 0) {
      const demoState = useDemoStore.getState();
      const startDateUtc = new Date(input.start_date).toISOString().slice(0, 10);

      // Active memberships that end on or after closure start
      const eligible = demoState.memberships.filter(
        (m) => m.gym_id === input.gym_id && m.status === 'active' && m.end_date.slice(0, 10) >= startDateUtc
      );

      for (const m of eligible) {
        const newEndDate = calculateExtendedEndDate(m.end_date, daysAdded);
        demoState.updateMembership(m.id, {
          end_date: newEndDate,
          updated_at: now,
        });

        const extRecord: DbMembershipExtension = {
          id: `demo-ext-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
          membership_id: m.id,
          gym_id: input.gym_id,
          extended_by_id: input.created_by,
          days_added: daysAdded,
          reason: `Closure: ${input.reason.trim()}`,
          previous_end: m.end_date,
          new_end: newEndDate,
          extended_at: now,
        };
        demoState.addExtension(extRecord);
        extendedCount++;
      }

      return {
        success: true,
        closure,
        affectedMembersCount: eligible.length,
        extensionsCount: extendedCount,
      };
    }

    return {
      success: true,
      closure,
      affectedMembersCount: 0,
      extensionsCount: 0,
    };
  }

  // Live Supabase flow
  const { data: closureData, error: closureError } = await supabase
    .from('gym_closures')
    .insert({
      id: closure.id,
      gym_id: closure.gym_id,
      created_by: closure.created_by,
      start_date: closure.start_date,
      end_date: closure.end_date,
      reason: closure.reason,
      auto_extend: closure.auto_extend,
    })
    .select()
    .single();

  if (closureError) {
    return {
      success: false,
      affectedMembersCount: 0,
      extensionsCount: 0,
      error: closureError.message,
    };
  }

  let extendedCount = 0;
  let eligibleCount = 0;

  if (input.auto_extend && daysAdded > 0) {
    // Fetch active memberships
    const { data: memberships, error: memError } = await supabase
      .from('memberships')
      .select('*')
      .eq('gym_id', input.gym_id)
      .eq('status', 'active')
      .gte('end_date', input.start_date);

    if (!memError && memberships && memberships.length > 0) {
      eligibleCount = memberships.length;
      for (const m of (memberships as DbMembership[])) {
        const newEndDate = calculateExtendedEndDate(m.end_date, daysAdded);
        
        await supabase
          .from('memberships')
          .update({ end_date: newEndDate, updated_at: now })
          .eq('id', m.id);

        await supabase.from('membership_extensions').insert({
          membership_id: m.id,
          gym_id: input.gym_id,
          extended_by_id: input.created_by,
          days_added: daysAdded,
          reason: `Closure: ${input.reason.trim()}`,
          previous_end: m.end_date,
          new_end: newEndDate,
          extended_at: now,
        });

        extendedCount++;
      }
    }
  }

  return {
    success: true,
    closure: closureData as DbGymClosure,
    affectedMembersCount: eligibleCount,
    extensionsCount: extendedCount,
  };
}

