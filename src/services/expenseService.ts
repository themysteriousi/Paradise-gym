import { supabase } from '@/lib/supabase';
import { useDemoStore } from '@/stores/demoStore';
import type {
  DbExpense,
  DbPartnerTransaction,
  ExpenseCategory,
  TransactionType,
} from '@/types/database';

export interface RecordExpenseInput {
  gym_id: string;
  recorded_by: string;
  category: ExpenseCategory;
  description: string;
  amount_paise: number;
  expense_date: string;
  receipt_url?: string | null;
  note?: string | null;
}

export interface RecordPartnerTxInput {
  gym_id: string;
  partner_id: string;
  type: TransactionType;
  amount_paise: number;
  description: string;
  reference_id?: string | null;
}

export interface ExpenseCategorySummary {
  rent: number;
  salary: number;
  utilities: number;
  equipment: number;
  maintenance: number;
  marketing: number;
  supplies: number;
  other: number;
  total_paise: number;
}

export interface PartnerLedgerSummary {
  partner_id: string;
  total_contributed_paise: number;
  total_withdrawn_paise: number;
  net_balance_paise: number;
}

/**
 * Record an operating expense
 */
export async function recordExpense(
  input: RecordExpenseInput
): Promise<{ success: boolean; expenseId?: string; error?: string }> {
  if (!input.description || !input.description.trim()) {
    return { success: false, error: 'Description is required' };
  }

  if (input.amount_paise <= 0) {
    return { success: false, error: 'Expense amount must be greater than zero' };
  }

  const isDemoMode = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder');

  if (isDemoMode) {
    const now = new Date().toISOString();
    const expenseRecord: DbExpense = {
      id: `expense-${Date.now()}`,
      gym_id: input.gym_id,
      recorded_by: input.recorded_by,
      category: input.category,
      description: input.description.trim(),
      amount_paise: input.amount_paise,
      expense_date: input.expense_date,
      receipt_url: input.receipt_url || null,
      note: input.note || null,
      created_at: now,
      updated_at: now,
    };

    useDemoStore.getState().addExpense(expenseRecord);
    return { success: true, expenseId: expenseRecord.id };
  }

  try {
    const { data, error } = await supabase
      .from('expenses')
      .insert({
        gym_id: input.gym_id,
        recorded_by: input.recorded_by,
        category: input.category,
        description: input.description.trim(),
        amount_paise: input.amount_paise,
        expense_date: input.expense_date,
        receipt_url: input.receipt_url || null,
        note: input.note || null,
      })
      .select('id')
      .single();

    if (error) throw error;
    return { success: true, expenseId: data.id };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to record expense' };
  }
}

/**
 * Retrieve all operating expenses for gym
 */
export async function getExpenses(gymId: string): Promise<DbExpense[]> {
  const isDemoMode = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder');

  if (isDemoMode) {
    return useDemoStore.getState().expenses;
  }

  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .eq('gym_id', gymId)
    .order('expense_date', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Aggregate expenses by category
 */
export function getExpenseSummaryByCategory(expenses: DbExpense[]): ExpenseCategorySummary {
  const summary: ExpenseCategorySummary = {
    rent: 0,
    salary: 0,
    utilities: 0,
    equipment: 0,
    maintenance: 0,
    marketing: 0,
    supplies: 0,
    other: 0,
    total_paise: 0,
  };

  for (const exp of expenses) {
    summary.total_paise += exp.amount_paise;
    if (exp.category in summary) {
      summary[exp.category as keyof Omit<ExpenseCategorySummary, 'total_paise'>] += exp.amount_paise;
    } else {
      summary.other += exp.amount_paise;
    }
  }

  return summary;
}

/**
 * Record a Partner Capital contribution or Personal Drawing
 * (Completely separated from ordinary operating expenses)
 */
export async function recordPartnerTransaction(
  input: RecordPartnerTxInput
): Promise<{ success: boolean; txId?: string; error?: string }> {
  if (!input.description || !input.description.trim()) {
    return { success: false, error: 'Transaction description is required' };
  }

  if (input.amount_paise <= 0) {
    return { success: false, error: 'Transaction amount must be greater than zero' };
  }

  const isDemoMode = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder');

  if (isDemoMode) {
    const txRecord: DbPartnerTransaction = {
      id: `partner-tx-${Date.now()}`,
      gym_id: input.gym_id,
      partner_id: input.partner_id,
      type: input.type,
      amount_paise: input.amount_paise,
      description: input.description.trim(),
      reference_id: input.reference_id || null,
      transaction_at: new Date().toISOString(),
    };

    useDemoStore.getState().addPartnerTransaction(txRecord);
    return { success: true, txId: txRecord.id };
  }

  try {
    const { data, error } = await supabase
      .from('partner_transactions')
      .insert({
        gym_id: input.gym_id,
        partner_id: input.partner_id,
        type: input.type,
        amount_paise: input.amount_paise,
        description: input.description.trim(),
        reference_id: input.reference_id || null,
        transaction_at: new Date().toISOString(),
      })
      .select('id')
      .single();

    if (error) throw error;
    return { success: true, txId: data.id };
  } catch (err: unknown) {
    return { success: false, error: err instanceof Error ? err.message : 'Failed to record partner transaction' };
  }
}

/**
 * Retrieve all partner transactions
 */
export async function getPartnerTransactions(gymId: string): Promise<DbPartnerTransaction[]> {
  const isDemoMode = !import.meta.env.VITE_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL.includes('placeholder');

  if (isDemoMode) {
    return useDemoStore.getState().partnerTransactions;
  }

  const { data, error } = await supabase
    .from('partner_transactions')
    .select('*')
    .eq('gym_id', gymId)
    .order('transaction_at', { ascending: false });

  if (error) throw error;
  return data || [];
}

/**
 * Calculate net capital contribution, withdrawals, and current equity for a partner
 */
export function getPartnerLedgerSummary(partnerId: string): PartnerLedgerSummary {
  const transactions = useDemoStore
    .getState()
    .partnerTransactions.filter((tx) => tx.partner_id === partnerId);

  let total_contributed_paise = 0;
  let total_withdrawn_paise = 0;

  for (const tx of transactions) {
    if (tx.type === 'credit') {
      total_contributed_paise += tx.amount_paise;
    } else if (tx.type === 'debit') {
      total_withdrawn_paise += tx.amount_paise;
    }
  }

  return {
    partner_id: partnerId,
    total_contributed_paise,
    total_withdrawn_paise,
    net_balance_paise: total_contributed_paise - total_withdrawn_paise,
  };
}
