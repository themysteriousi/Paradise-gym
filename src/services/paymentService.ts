import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { useDemoStore } from '@/stores/demoStore';
import { useAuthStore } from '@/stores/authStore';
import type { DbPayment, DbRefund, PaymentMethod } from '@/types/database';

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

  const isDemoMode = useAuthStore.getState().isDemoMode || !isSupabaseConfigured;

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

        const { data, error } = await supabase.from('payments').insert(records).select('*');
        if (error) throw error;
        if (data) {
          data.forEach((p) => useDemoStore.getState().recordPayment(p as DbPayment));
        }
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
      }).select('*').single();

      if (error) throw error;
      if (data) {
        useDemoStore.getState().recordPayment(data as DbPayment);
      }
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
  const isDemoMode = useAuthStore.getState().isDemoMode || !isSupabaseConfigured;

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

export interface ProcessRefundInput {
  gym_id: string;
  payment_id: string;
  processed_by: string;
  amount_paise: number;
  method: PaymentMethod;
  reason: string;
  reference?: string | null;
}

export interface CorrectPaymentInput {
  payment_id: string;
  corrected_by: string;
  reason: string;
  new_method: PaymentMethod;
  new_amount_paise: number;
  new_reference?: string | null;
  new_note?: string | null;
}

/**
 * Get refunds recorded for a specific payment
 */
export function getRefundsForPayment(paymentId: string): DbRefund[] {
  return useDemoStore.getState().refunds.filter((r) => r.payment_id === paymentId);
}

/**
 * Process a refund non-destructively:
 * Creates a DbRefund record without mutating original payment record.
 */
export async function processRefund(
  input: ProcessRefundInput
): Promise<{ success: boolean; refundId?: string; error?: string }> {
  if (!input.reason || !input.reason.trim()) {
    return { success: false, error: 'Reason is required for refund processing' };
  }

  if (input.amount_paise <= 0) {
    return { success: false, error: 'Refund amount must be greater than zero' };
  }

  const isDemoMode = useAuthStore.getState().isDemoMode || !isSupabaseConfigured;

  if (isDemoMode) {
    const demoStore = useDemoStore.getState();
    const originalPayment = demoStore.payments.find((p) => p.id === input.payment_id);
    if (!originalPayment) {
      return { success: false, error: 'Original payment record not found' };
    }

    // Check existing refunds for this payment
    const existingRefunds = demoStore.refunds.filter((r) => r.payment_id === input.payment_id);
    const totalRefundedSoFar = existingRefunds.reduce((sum, r) => sum + r.amount_paise, 0);

    if (totalRefundedSoFar + input.amount_paise > originalPayment.amount_paise) {
      return {
        success: false,
        error: `Refund amount cannot exceed original payment (${formatRupees(originalPayment.amount_paise)})`,
      };
    }

    const refundRecord: DbRefund = {
      id: `refund-${Date.now()}`,
      gym_id: input.gym_id,
      payment_id: input.payment_id,
      processed_by: input.processed_by,
      amount_paise: input.amount_paise,
      method: input.method,
      reason: input.reason.trim(),
      reference: input.reference || null,
      refunded_at: new Date().toISOString(),
    };

    demoStore.addRefund(refundRecord);
    return { success: true, refundId: refundRecord.id };
  }

  try {
    const { data, error } = await supabase.from('refunds').insert({
      gym_id: input.gym_id,
      payment_id: input.payment_id,
      processed_by: input.processed_by,
      amount_paise: input.amount_paise,
      method: input.method,
      reason: input.reason.trim(),
      reference: input.reference || null,
      refunded_at: new Date().toISOString(),
    }).select('id').single();

    if (error) throw error;
    return { success: true, refundId: data.id };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to process refund' };
  }
}

/**
 * Correct an erroneous payment entry:
 * Flags the original record as superseded/refunded with an audit reason,
 * and creates a new corrected payment linked to original_id.
 */
export async function correctPayment(
  input: CorrectPaymentInput
): Promise<{ success: boolean; newPaymentId?: string; error?: string }> {
  if (!input.reason || !input.reason.trim()) {
    return { success: false, error: 'Audit reason is mandatory for clerical corrections' };
  }

  if (input.new_amount_paise <= 0) {
    return { success: false, error: 'Corrected payment amount must be greater than zero' };
  }

  const isDemoMode = useAuthStore.getState().isDemoMode || !isSupabaseConfigured;

  if (isDemoMode) {
    const demoStore = useDemoStore.getState();
    const original = demoStore.payments.find((p) => p.id === input.payment_id);
    if (!original) {
      return { success: false, error: 'Original payment record not found' };
    }

    const now = new Date().toISOString();

    // 1. Mark original as corrected / superseded
    demoStore.updatePayment(original.id, {
      is_correction: true,
      status: 'refunded',
      corrected_by: input.corrected_by,
      corrected_at: now,
      correction_reason: input.reason.trim(),
    });

    // 2. Create new corrected payment record
    const newRecord: DbPayment = {
      id: `demo-pay-corrected-${Date.now()}`,
      gym_id: original.gym_id,
      member_id: original.member_id,
      received_by: original.received_by,
      method: input.new_method,
      amount_paise: input.new_amount_paise,
      status: 'completed',
      reference: input.new_reference || original.reference,
      note: input.new_note ? `[Corrected] ${input.new_note}` : `[Correction for payment ${original.id}]`,
      paid_at: original.paid_at,
      is_correction: false,
      original_id: original.id,
      corrected_by: null,
      corrected_at: null,
      correction_reason: null,
      created_at: now,
    };

    demoStore.recordPayment(newRecord);
    return { success: true, newPaymentId: newRecord.id };
  }

  try {
    const now = new Date().toISOString();

    // 1. Update original
    const { data: orig, error: origError } = await supabase
      .from('payments')
      .update({
        is_correction: true,
        status: 'refunded',
        corrected_by: input.corrected_by,
        corrected_at: now,
        correction_reason: input.reason.trim(),
      })
      .eq('id', input.payment_id)
      .select('*')
      .single();

    if (origError || !orig) throw origError || new Error('Original payment not found');

    // 2. Insert corrected record
    const { data: newPay, error: newPayError } = await supabase
      .from('payments')
      .insert({
        gym_id: orig.gym_id,
        member_id: orig.member_id,
        received_by: orig.received_by,
        method: input.new_method,
        amount_paise: input.new_amount_paise,
        status: 'completed',
        reference: input.new_reference || orig.reference,
        note: input.new_note ? `[Corrected] ${input.new_note}` : `[Correction for payment ${orig.id}]`,
        paid_at: orig.paid_at,
        original_id: orig.id,
        created_at: now,
      })
      .select('id')
      .single();

    if (newPayError) throw newPayError;
    return { success: true, newPaymentId: newPay.id };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to correct payment' };
  }
}
