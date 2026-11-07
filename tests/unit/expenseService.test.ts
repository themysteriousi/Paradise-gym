import { describe, it, expect, beforeEach } from 'vitest';
import {
  recordExpense,
  getExpenses,
  getExpenseSummaryByCategory,
  recordPartnerTransaction,
  getPartnerLedgerSummary,
  type RecordExpenseInput,
  type RecordPartnerTxInput,
} from '@/services/expenseService';
import { useDemoStore } from '@/stores/demoStore';

describe('Expense Tracking & Partner Transactions Service', () => {
  beforeEach(() => {
    useDemoStore.getState().resetToDefault();
  });

  describe('Operating Expense Tracking', () => {
    it('records an operating expense with category, date, and amount in paise', async () => {
      const input: RecordExpenseInput = {
        gym_id: 'demo-gym-001',
        recorded_by: 'demo-partner-001',
        category: 'rent',
        description: 'Gym floor monthly lease',
        amount_paise: 5000000, // ₹50,000
        expense_date: '2026-02-01',
        note: 'Paid via RTGS to landlord',
      };

      const result = await recordExpense(input);
      expect(result.success).toBe(true);
      expect(result.expenseId).toBeDefined();

      const expenses = await getExpenses('demo-gym-001');
      const found = expenses.find((e) => e.id === result.expenseId);
      expect(found).toBeDefined();
      expect(found?.category).toBe('rent');
      expect(found?.amount_paise).toBe(5000000);
    });

    it('aggregates expenses by category accurately', async () => {
      await recordExpense({
        gym_id: 'demo-gym-001',
        recorded_by: 'demo-partner-001',
        category: 'utilities',
        description: 'Power bill Jan',
        amount_paise: 1200000, // ₹12,000
        expense_date: '2026-02-05',
      });

      await recordExpense({
        gym_id: 'demo-gym-001',
        recorded_by: 'demo-partner-001',
        category: 'supplies',
        description: 'Housekeeping supplies',
        amount_paise: 300000, // ₹3,000
        expense_date: '2026-02-06',
      });

      await recordExpense({
        gym_id: 'demo-gym-001',
        recorded_by: 'demo-partner-001',
        category: 'utilities',
        description: 'Diesel for generator backup',
        amount_paise: 500000, // ₹5,000
        expense_date: '2026-02-10',
      });

      const expenses = await getExpenses('demo-gym-001');
      const summary = getExpenseSummaryByCategory(expenses);

      // Utilities total = 1200000 + 500000 = 1700000 (₹17,000)
      expect(summary.utilities).toBe(1700000);
      expect(summary.supplies).toBe(300000);
      expect(summary.total_paise).toBe(2000000);
    });

    it('rejects an expense with non-positive amount or missing description', async () => {
      const res1 = await recordExpense({
        gym_id: 'demo-gym-001',
        recorded_by: 'demo-partner-001',
        category: 'maintenance',
        description: '',
        amount_paise: 100000,
        expense_date: '2026-02-01',
      });
      expect(res1.success).toBe(false);
      expect(res1.error).toContain('Description is required');

      const res2 = await recordExpense({
        gym_id: 'demo-gym-001',
        recorded_by: 'demo-partner-001',
        category: 'maintenance',
        description: 'Cable replacement',
        amount_paise: 0,
        expense_date: '2026-02-01',
      });
      expect(res2.success).toBe(false);
      expect(res2.error).toContain('greater than zero');
    });
  });

  describe('Partner Capital & Withdrawals Accounting', () => {
    it('records capital contributions and draws independently of operating expenses', async () => {
      // Initial expense count
      const initialExpenses = await getExpenses('demo-gym-001');

      // Partner 1 deposits ₹2,00,000 initial capital
      const tx1: RecordPartnerTxInput = {
        gym_id: 'demo-gym-001',
        partner_id: 'demo-partner-001',
        type: 'credit',
        amount_paise: 20000000, // ₹2,00,000
        description: 'Initial equipment investment funding',
      };
      const res1 = await recordPartnerTransaction(tx1);
      expect(res1.success).toBe(true);

      // Partner 1 draws ₹25,000 for personal use
      const tx2: RecordPartnerTxInput = {
        gym_id: 'demo-gym-001',
        partner_id: 'demo-partner-001',
        type: 'debit',
        amount_paise: 2500000, // ₹25,000
        description: 'Monthly personal draw',
      };
      const res2 = await recordPartnerTransaction(tx2);
      expect(res2.success).toBe(true);

      // Ensure operating expenses were NOT affected!
      const currentExpenses = await getExpenses('demo-gym-001');
      expect(currentExpenses.length).toBe(initialExpenses.length);

      // Check Partner 1 ledger
      const ledger = getPartnerLedgerSummary('demo-partner-001');
      expect(ledger.total_contributed_paise).toBe(20000000);
      expect(ledger.total_withdrawn_paise).toBe(2500000);
      // Net capital balance = 20000000 - 2500000 = 17500000 (₹1,75,000)
      expect(ledger.net_balance_paise).toBe(17500000);
    });

    it('correctly calculates net capital balance for two distinct partners', async () => {
      // Partner 1 deposits ₹1,00,000
      await recordPartnerTransaction({
        gym_id: 'demo-gym-001',
        partner_id: 'demo-partner-001',
        type: 'credit',
        amount_paise: 10000000,
        description: 'P1 Capital',
      });

      // Partner 2 deposits ₹1,50,000
      await recordPartnerTransaction({
        gym_id: 'demo-gym-001',
        partner_id: 'demo-partner-002',
        type: 'credit',
        amount_paise: 15000000,
        description: 'P2 Capital',
      });

      // Partner 2 draws ₹10,000
      await recordPartnerTransaction({
        gym_id: 'demo-gym-001',
        partner_id: 'demo-partner-002',
        type: 'debit',
        amount_paise: 1000000,
        description: 'P2 Personal Draw',
      });

      const ledger1 = getPartnerLedgerSummary('demo-partner-001');
      const ledger2 = getPartnerLedgerSummary('demo-partner-002');

      expect(ledger1.net_balance_paise).toBe(10000000);
      expect(ledger2.net_balance_paise).toBe(14000000);
    });
  });
});
