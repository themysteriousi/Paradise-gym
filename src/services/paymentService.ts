import { supabase } from '@/lib/supabase';
import { useDemoStore } from '@/stores/demoStore';
import type { DbPayment, PaymentMethod } from '@/types/database';

export interface OutstandingCharge {
  id: string;
  member_id: string;
  amount_paise: number;
  balance_paise: number;
  due_date: string;
}

export interface PaymentSplitInput {
  method: PaymentMethod;
  amount_paise: number;
  reference?: string;
}

export interface FifoAllocationItem {
  chargeId: string;
  allocated_paise: number;
  remaining_balance_paise: number;
}

export interface FifoAllocationResult {
  allocations: FifoAllocationItem[];
  total_allocated_paise: number;
  unallocated_paise: number;
}

export interface RecordPaymentInput {
  gym_id: string;
  member_id: string;
  received_by: string;
  method: PaymentMethod | 'split';
  amount_paise: number;
  reference?: string | null;
  note?: string | null;
  splits?: PaymentSplitInput[];
  charge_id?: string | null; // specific target charge if any
}

export interface PaymentSummary {
  total_paise: number;
  cash_paise: number;
  upi_paise: number;
  card_paise: number;
  other_paise: number;
  count: number;
}

/**
 * Format paise integer into Indian Rupees string (e.g., 150000 -> "₹1,500")
 */
export function formatRupees(paise: number): string {
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: paise % 100 === 0 ? 0 : 2,
  }).format(rupees);
}

/**
 * Parse numeric or string rupees to integer paise safely
 */
export function parseRupeesToPaise(rupees: number | string): number {
  const parsed = typeof rupees === 'string' ? parseFloat(rupees.replace(/,/g, '')) : rupees;
  if (isNaN(parsed) || parsed < 0) return 0;
  return Math.round(parsed * 100);
}

/**
 * Allocate payment against outstanding dues using FIFO (First-In, First-Out).
 * Oldest dues (earliest due_date) are cleared first.
 */
export function calculateFifoAllocation(
  payment_paise: number,
  outstandingCharges: OutstandingCharge[]
): FifoAllocationResult {
  if (payment_paise <= 0 || outstandingCharges.length === 0) {
    return {
      allocations: [],
      total_allocated_paise: 0,
      unallocated_paise: Math.max(0, payment_paise),
    };
  }

  // Sort chronologically by due_date ascending
  const sorted = [...outstandingCharges].sort((a, b) =>
    new Date(a.due_date).getTime() - new Date(b.due_date).getTime()
  );

  let remainingToAllocate = payment_paise;
  const allocations: FifoAllocationItem[] = [];

  for (const charge of sorted) {
    if (remainingToAllocate <= 0) break;
    if (charge.balance_paise <= 0) continue;

    const alloc = Math.min(remainingToAllocate, charge.balance_paise);
    remainingToAllocate -= alloc;

    allocations.push({
      chargeId: charge.id,
      allocated_paise: alloc,
      remaining_balance_paise: charge.balance_paise - alloc,
    });
  }

  return {
    allocations,
    total_allocated_paise: payment_paise - remainingToAllocate,
    unallocated_paise: remainingToAllocate,
  };
}

/**
 * Validate that payment split parts sum exactly to total amount and each part is > 0.
 */
export function validateSplitPayment(
  total_paise: number,
  splits?: PaymentSplitInput[]
): { isValid: boolean; error?: string } {
  if (!splits || splits.length === 0) {
    return { isValid: false, error: 'At least one payment split required' };
  }

  let runningSum = 0;
  for (const s of splits) {
    if (s.amount_paise <= 0) {
      return { isValid: false, error: 'All split amounts must be greater than zero' };
    }
    runningSum += s.amount_paise;
  }

  if (runningSum !== total_paise) {
    return {
      isValid: false,
      error: `Split sum mismatch: splits total ${formatRupees(runningSum)} but payment total is ${formatRupees(total_paise)}`,
    };
  }

  return { isValid: true };
}

/**
 * Record a payment, supporting single methods and multi-method split payments.
 */
export function recordPayment(input: RecordPaymentInput): Promise<{ success: boolean; paymentId?: string; error?: string }> {
  // If split payment, validate
  if (input.method === 'split') {
    const validation = validateSplitPayment(input.amount_paise, input.splits);
    if (!validation.isValid) {
      return Promise.resolve({ success: false, error: validation.error });
    }
  }

  const isDemoMode = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder');

  if (isDemoMode) {
    const demoStore = useDemoStore.getState();
    const now = new Date().toISOString();

    if (input.method === 'split' && input.splits) {
      const splitGroupId = `split-grp-${Date.now()}`;
      input.splits.forEach((split, index) => {
        const paymentRecord: DbPayment = {
          id: `demo-pay-${Date.now()}-${index}`,
          gym_id: input.gym_id,
          member_id: input.member_id,
          received_by: input.received_by,
          method: split.method,
          amount_paise: split.amount_paise,
          status: 'completed',
          reference: split.reference || `SPLIT-${splitGroupId}-${index + 1}`,
          note: input.note ? `[Part ${index + 1}/${input.splits?.length}] ${input.note}` : `Part ${index + 1}/${input.splits?.length}`,
          paid_at: now,
          is_correction: false,
          original_id: null,
          corrected_by: null,
          corrected_at: null,
          correction_reason: null,
          created_at: now,
        };
        demoStore.recordPayment(paymentRecord);
      });
      return Promise.resolve({ success: true, paymentId: splitGroupId });
    }

    const singleRecord: DbPayment = {
      id: `demo-pay-${Date.now()}`,
      gym_id: input.gym_id,
      member_id: input.member_id,
      received_by: input.received_by,
      method: input.method as PaymentMethod,
      amount_paise: input.amount_paise,
      status: 'completed',
      reference: input.reference || null,
      note: input.note || null,
      paid_at: now,
      is_correction: false,
      original_id: null,
      corrected_by: null,
      corrected_at: null,
      correction_reason: null,
      created_at: now,
    };

    demoStore.recordPayment(singleRecord);
    return Promise.resolve({ success: true, paymentId: singleRecord.id });
  }

  return (async () => {
    try {
      const now = new Date().toISOString();

      if (input.method === 'split' && input.splits) {
        const splitGroupId = `split-${Date.now()}`;
        const records = input.splits.map((split, index) => ({
          gym_id: input.gym_id,
          member_id: input.member_id,
          received_by: input.received_by,
          method: split.method,
          amount_paise: split.amount_paise,
          status: 'completed' as const,
          reference: split.reference || `SPLIT-${splitGroupId}-${index + 1}`,
          note: input.note ? `[Part ${index + 1}/${input.splits?.length}] ${input.note}` : `Part ${index + 1}/${input.splits?.length}`,
          paid_at: now,
        }));

        const { data, error } = await supabase.from('payments').insert(records).select('id');
        if (error) throw error;
        return { success: true, paymentId: data?.[0]?.id };
      }

      const { data, error } = await supabase.from('payments').insert({
        gym_id: input.gym_id,
        member_id: input.member_id,
        received_by: input.received_by,
        method: input.method as PaymentMethod,
        amount_paise: input.amount_paise,
        status: 'completed',
        reference: input.reference || null,
        note: input.note || null,
        paid_at: now,
      }).select('id').single();

      if (error) throw error;
      return { success: true, paymentId: data.id };
    } catch (err: unknown) {
      return { success: false, error: err instanceof Error ? err.message : 'Failed to record payment' };
    }
  })();
}

/**
 * Calculate payment breakdown and totals
 */
export function getPaymentSummary(payments: DbPayment[]): PaymentSummary {
  let total_paise = 0;
  let cash_paise = 0;
  let upi_paise = 0;
  let card_paise = 0;
  let other_paise = 0;

  for (const p of payments) {
    if (p.status !== 'completed') continue;
    total_paise += p.amount_paise;
    if (p.method === 'cash') cash_paise += p.amount_paise;
    else if (p.method === 'upi') upi_paise += p.amount_paise;
    else if (p.method === 'card') card_paise += p.amount_paise;
    else other_paise += p.amount_paise;
  }

  return {
    total_paise,
    cash_paise,
    upi_paise,
    card_paise,
    other_paise,
    count: payments.filter((p) => p.status === 'completed').length,
  };
}

/**
 * Fetch payments for a gym
 */
export async function getPayments(gymId: string): Promise<DbPayment[]> {
  const isDemoMode = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder');

  if (isDemoMode) {
    return useDemoStore.getState().payments;
  }

  const { data, error } = await supabase
    .from('payments')
    .select('*')
    .eq('gym_id', gymId)
    .order('paid_at', { ascending: false });

  if (error) throw error;
  return data || [];
}
