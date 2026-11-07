import type { DbPayment, DbExpense, DbRefund } from '@/types/database';

export interface FinancialPeriod {
  startDate: string; // YYYY-MM-DD
  endDate: string;   // YYYY-MM-DD
}

export interface ProfitAndLossStatement {
  gross_collections_paise: number;
  total_refunds_paise: number;
  net_collections_paise: number;
  total_expenses_paise: number;
  estimated_profit_paise: number;
  partner_share_paise: number;
  expense_breakdown: Record<string, number>;
  period: FinancialPeriod;
}

export interface PaymentMethodShare {
  amount_paise: number;
  count: number;
  percentage: number;
}

export interface PaymentMethodBreakdown {
  total_paise: number;
  total_count: number;
  cash: PaymentMethodShare;
  upi: PaymentMethodShare;
  card: PaymentMethodShare;
  other: PaymentMethodShare;
}

/**
 * Filter items by date range (inclusive)
 */
function isDateWithinPeriod(dateIso: string, period: FinancialPeriod): boolean {
  const d = dateIso.slice(0, 10);
  return d >= period.startDate && d <= period.endDate;
}

/**
 * Generate comprehensive P&L Statement for gym operations
 */
export function generateProfitAndLossStatement(
  payments: DbPayment[],
  refunds: DbRefund[],
  expenses: DbExpense[],
  period: FinancialPeriod
): ProfitAndLossStatement {
  // 1. Filter payments in period
  const periodPayments = payments.filter(
    (p) => p.status === 'completed' && isDateWithinPeriod(p.paid_at, period)
  );
  const gross_collections_paise = periodPayments.reduce((sum, p) => sum + p.amount_paise, 0);

  // 2. Filter refunds in period
  const periodRefunds = refunds.filter((r) => isDateWithinPeriod(r.refunded_at, period));
  const total_refunds_paise = periodRefunds.reduce((sum, r) => sum + r.amount_paise, 0);

  // 3. Net collections
  const net_collections_paise = Math.max(0, gross_collections_paise - total_refunds_paise);

  // 4. Operating Expenses
  const periodExpenses = expenses.filter((e) => isDateWithinPeriod(e.expense_date, period));
  let total_expenses_paise = 0;
  const expense_breakdown: Record<string, number> = {};

  for (const exp of periodExpenses) {
    total_expenses_paise += exp.amount_paise;
    expense_breakdown[exp.category] = (expense_breakdown[exp.category] || 0) + exp.amount_paise;
  }

  // 5. Estimated Operating Profit & Partner 50/50 Share
  const estimated_profit_paise = net_collections_paise - total_expenses_paise;
  const partner_share_paise = Math.round(estimated_profit_paise / 2);

  return {
    gross_collections_paise,
    total_refunds_paise,
    net_collections_paise,
    total_expenses_paise,
    estimated_profit_paise,
    partner_share_paise,
    expense_breakdown,
    period,
  };
}

/**
 * Compute breakdown of collections by method with percentages
 */
export function calculatePaymentMethodBreakdown(payments: DbPayment[]): PaymentMethodBreakdown {
  const valid = payments.filter((p) => p.status === 'completed');
  const total_paise = valid.reduce((sum, p) => sum + p.amount_paise, 0);
  const total_count = valid.length;

  const result: PaymentMethodBreakdown = {
    total_paise,
    total_count,
    cash: { amount_paise: 0, count: 0, percentage: 0 },
    upi: { amount_paise: 0, count: 0, percentage: 0 },
    card: { amount_paise: 0, count: 0, percentage: 0 },
    other: { amount_paise: 0, count: 0, percentage: 0 },
  };

  for (const p of valid) {
    if (p.method === 'cash') {
      result.cash.amount_paise += p.amount_paise;
      result.cash.count += 1;
    } else if (p.method === 'upi') {
      result.upi.amount_paise += p.amount_paise;
      result.upi.count += 1;
    } else if (p.method === 'card') {
      result.card.amount_paise += p.amount_paise;
      result.card.count += 1;
    } else {
      result.other.amount_paise += p.amount_paise;
      result.other.count += 1;
    }
  }

  if (total_paise > 0) {
    result.cash.percentage = Math.round((result.cash.amount_paise / total_paise) * 100);
    result.upi.percentage = Math.round((result.upi.amount_paise / total_paise) * 100);
    result.card.percentage = Math.round((result.card.amount_paise / total_paise) * 100);
    result.other.percentage = Math.round((result.other.amount_paise / total_paise) * 100);
  }

  return result;
}

/**
 * Standard date periods for accounting
 */
export function getPresetPeriod(
  preset: 'this_month' | 'last_month' | 'this_quarter' | 'this_year' | 'all'
): FinancialPeriod {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth(); // 0-indexed

  if (preset === 'this_month') {
    const firstDay = new Date(year, month, 1).toISOString().slice(0, 10);
    const lastDay = new Date(year, month + 1, 0).toISOString().slice(0, 10);
    return { startDate: firstDay, endDate: lastDay };
  }

  if (preset === 'last_month') {
    const firstDay = new Date(year, month - 1, 1).toISOString().slice(0, 10);
    const lastDay = new Date(year, month, 0).toISOString().slice(0, 10);
    return { startDate: firstDay, endDate: lastDay };
  }

  if (preset === 'this_quarter') {
    const qStartMonth = Math.floor(month / 3) * 3;
    const firstDay = new Date(year, qStartMonth, 1).toISOString().slice(0, 10);
    const lastDay = new Date(year, qStartMonth + 3, 0).toISOString().slice(0, 10);
    return { startDate: firstDay, endDate: lastDay };
  }

  if (preset === 'this_year') {
    return {
      startDate: `${year}-01-01`,
      endDate: `${year}-12-31`,
    };
  }

  // All time
  return {
    startDate: '2020-01-01',
    endDate: '2099-12-31',
  };
}
