import { describe, it, expect, beforeEach } from 'vitest';
import {
  generateProfitAndLossStatement,
  calculatePaymentMethodBreakdown,
  type FinancialPeriod,
} from '@/services/financialReportService';
import { useDemoStore } from '@/stores/demoStore';
import type { DbPayment, DbExpense, DbRefund } from '@/types/database';

describe('Financial Reporting & P&L Service', () => {
  beforeEach(() => {
    useDemoStore.getState().resetToDefault();
  });

  it('calculates Net Collections and Estimated Operating Profit accurately', () => {
    const payments: DbPayment[] = [
      {
        id: 'p1',
        gym_id: 'demo-gym-001',
        member_id: 'm1',
        received_by: 'demo-partner-001',
        method: 'upi',
        amount_paise: 5000000, // ₹50,000
        status: 'completed',
        reference: 'UPI1',
        note: null,
        paid_at: '2026-02-10T10:00:00Z',
        is_correction: false,
        original_id: null,
        corrected_by: null,
        corrected_at: null,
        correction_reason: null,
        created_at: '2026-02-10T10:00:00Z',
      },
      {
        id: 'p2',
        gym_id: 'demo-gym-001',
        member_id: 'm2',
        received_by: 'demo-partner-001',
        method: 'cash',
        amount_paise: 3000000, // ₹30,000
        status: 'completed',
        reference: null,
        note: null,
        paid_at: '2026-02-12T10:00:00Z',
        is_correction: false,
        original_id: null,
        corrected_by: null,
        corrected_at: null,
        correction_reason: null,
        created_at: '2026-02-12T10:00:00Z',
      },
    ];

    const refunds: DbRefund[] = [
      {
        id: 'ref1',
        gym_id: 'demo-gym-001',
        payment_id: 'p1',
        processed_by: 'demo-partner-001',
        amount_paise: 500000, // ₹5,000 refund
        method: 'upi',
        reason: 'Partial cancellation',
        reference: null,
        refunded_at: '2026-02-15T10:00:00Z',
      },
    ];

    const expenses: DbExpense[] = [
      {
        id: 'exp1',
        gym_id: 'demo-gym-001',
        recorded_by: 'demo-partner-001',
        category: 'rent',
        description: 'Gym Rent',
        amount_paise: 4000000, // ₹40,000 rent
        expense_date: '2026-02-01',
        receipt_url: null,
        note: null,
        created_at: '2026-02-01T10:00:00Z',
        updated_at: '2026-02-01T10:00:00Z',
      },
      {
        id: 'exp2',
        gym_id: 'demo-gym-001',
        recorded_by: 'demo-partner-001',
        category: 'utilities',
        description: 'Power Bill',
        amount_paise: 1000000, // ₹10,000 electricity
        expense_date: '2026-02-05',
        receipt_url: null,
        note: null,
        created_at: '2026-02-05T10:00:00Z',
        updated_at: '2026-02-05T10:00:00Z',
      },
    ];

    const period: FinancialPeriod = {
      startDate: '2026-02-01',
      endDate: '2026-02-28',
    };

    const pnl = generateProfitAndLossStatement(payments, refunds, expenses, period);

    // Gross Collections: 50,000 + 30,000 = 80,000 (8000000 paise)
    expect(pnl.gross_collections_paise).toBe(8000000);

    // Total Refunds: 5,000 (500000 paise)
    expect(pnl.total_refunds_paise).toBe(500000);

    // Net Collections: 80,000 - 5,000 = 75,000 (7500000 paise)
    expect(pnl.net_collections_paise).toBe(7500000);

    // Total Expenses: 40,000 + 10,000 = 50,000 (5000000 paise)
    expect(pnl.total_expenses_paise).toBe(5000000);

    // Estimated Profit: 75,000 - 50,000 = 25,000 (2500000 paise)
    expect(pnl.estimated_profit_paise).toBe(2500000);

    // Partner Equal 50/50 split: ₹12,500 each (1250000 paise)
    expect(pnl.partner_share_paise).toBe(1250000);
  });

  it('computes accurate payment method breakdown with percentage shares', () => {
    const payments: DbPayment[] = [
      {
        id: 'p1',
        gym_id: 'demo-gym-001',
        member_id: 'm1',
        received_by: 'demo-partner-001',
        method: 'upi',
        amount_paise: 600000, // ₹6,000 (60%)
        status: 'completed',
        reference: null,
        note: null,
        paid_at: '2026-02-10T10:00:00Z',
        is_correction: false,
        original_id: null,
        corrected_by: null,
        corrected_at: null,
        correction_reason: null,
        created_at: '2026-02-10T10:00:00Z',
      },
      {
        id: 'p2',
        gym_id: 'demo-gym-001',
        member_id: 'm2',
        received_by: 'demo-partner-001',
        method: 'cash',
        amount_paise: 400000, // ₹4,000 (40%)
        status: 'completed',
        reference: null,
        note: null,
        paid_at: '2026-02-11T10:00:00Z',
        is_correction: false,
        original_id: null,
        corrected_by: null,
        corrected_at: null,
        correction_reason: null,
        created_at: '2026-02-11T10:00:00Z',
      },
    ];

    const breakdown = calculatePaymentMethodBreakdown(payments);

    expect(breakdown.total_paise).toBe(1000000);
    expect(breakdown.upi.amount_paise).toBe(600000);
    expect(breakdown.upi.percentage).toBe(60);
    expect(breakdown.cash.amount_paise).toBe(400000);
    expect(breakdown.cash.percentage).toBe(40);
  });
});

