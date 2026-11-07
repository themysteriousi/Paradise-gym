import { describe, it, expect, beforeEach } from 'vitest';
import {
  calculateFifoAllocation,
  validateSplitPayment,
  recordPayment,
  getPaymentSummary,
  type OutstandingCharge,
  type PaymentSplitInput
} from '@/services/paymentService';
import { useDemoStore } from '@/stores/demoStore';

describe('Payment Service & FIFO Allocation', () => {
  beforeEach(() => {
    useDemoStore.getState().resetToDefault();
  });

  describe('FIFO Charge Allocation', () => {
    it('allocates payment to oldest charge first until cleared, then subsequent charges', () => {
      const outstanding: OutstandingCharge[] = [
        { id: 'charge-1', member_id: 'm1', amount_paise: 100000, balance_paise: 100000, due_date: '2026-01-01' },
        { id: 'charge-2', member_id: 'm1', amount_paise: 150000, balance_paise: 150000, due_date: '2026-02-01' },
        { id: 'charge-3', member_id: 'm1', amount_paise: 50000, balance_paise: 50000, due_date: '2026-03-01' },
      ];

      // Pay ₹1,800 (180,000 paise)
      const allocation = calculateFifoAllocation(180000, outstanding);

      expect(allocation.allocations).toHaveLength(2);
      // Charge 1 fully cleared (100000 paise)
      expect(allocation.allocations[0]).toEqual({
        chargeId: 'charge-1',
        allocated_paise: 100000,
        remaining_balance_paise: 0,
      });
      // Charge 2 partially cleared (80000 paise allocated, 70000 left)
      expect(allocation.allocations[1]).toEqual({
        chargeId: 'charge-2',
        allocated_paise: 80000,
        remaining_balance_paise: 70000,
      });
      // Charge 3 untouched
      expect(allocation.unallocated_paise).toBe(0);
      expect(allocation.total_allocated_paise).toBe(180000);
    });

    it('handles exact payment clearing all charges', () => {
      const outstanding: OutstandingCharge[] = [
        { id: 'charge-1', member_id: 'm1', amount_paise: 100000, balance_paise: 100000, due_date: '2026-01-01' },
        { id: 'charge-2', member_id: 'm1', amount_paise: 50000, balance_paise: 50000, due_date: '2026-02-01' },
      ];

      const allocation = calculateFifoAllocation(150000, outstanding);

      expect(allocation.allocations).toHaveLength(2);
      expect(allocation.allocations[0].remaining_balance_paise).toBe(0);
      expect(allocation.allocations[1].remaining_balance_paise).toBe(0);
      expect(allocation.unallocated_paise).toBe(0);
    });

    it('returns unallocated surplus when payment exceeds all outstanding dues', () => {
      const outstanding: OutstandingCharge[] = [
        { id: 'charge-1', member_id: 'm1', amount_paise: 100000, balance_paise: 100000, due_date: '2026-01-01' },
      ];

      // Pay ₹1,500 for a ₹1,000 due -> ₹500 unallocated credit
      const allocation = calculateFifoAllocation(150000, outstanding);

      expect(allocation.allocations).toHaveLength(1);
      expect(allocation.allocations[0].allocated_paise).toBe(100000);
      expect(allocation.unallocated_paise).toBe(50000);
      expect(allocation.total_allocated_paise).toBe(100000);
    });

    it('returns zero allocations when there are no outstanding charges', () => {
      const allocation = calculateFifoAllocation(50000, []);
      expect(allocation.allocations).toHaveLength(0);
      expect(allocation.unallocated_paise).toBe(50000);
    });
  });

  describe('Split Payment Validation', () => {
    it('validates matching splits correctly', () => {
      const splits: PaymentSplitInput[] = [
        { method: 'cash', amount_paise: 50000 },
        { method: 'upi', amount_paise: 150000, reference: 'UPI123456' },
      ];

      const validation = validateSplitPayment(200000, splits);
      expect(validation.isValid).toBe(true);
      expect(validation.error).toBeUndefined();
    });

    it('rejects splits that do not sum up to total amount', () => {
      const splits: PaymentSplitInput[] = [
        { method: 'cash', amount_paise: 50000 },
        { method: 'upi', amount_paise: 100000 },
      ];

      const validation = validateSplitPayment(200000, splits);
      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('mismatch');
    });

    it('rejects splits with zero or negative amounts', () => {
      const splits: PaymentSplitInput[] = [
        { method: 'cash', amount_paise: 0 },
        { method: 'upi', amount_paise: 200000 },
      ];

      const validation = validateSplitPayment(200000, splits);
      expect(validation.isValid).toBe(false);
      expect(validation.error).toContain('greater than zero');
    });
  });

  describe('Payment Recording & Summaries', () => {
    it('records a single payment in demo store and updates list', async () => {
      const initialCount = useDemoStore.getState().payments.length;

      const result = await recordPayment({
        gym_id: 'demo-gym-001',
        member_id: 'demo-member-1',
        received_by: 'demo-partner-001',
        method: 'upi',
        amount_paise: 150000,
        reference: 'UPI-TEST-001',
        note: 'Monthly renewal payment',
      });

      expect(result.success).toBe(true);
      expect(result.paymentId).toBeDefined();

      const updatedPayments = useDemoStore.getState().payments;
      expect(updatedPayments.length).toBe(initialCount + 1);
      expect(updatedPayments[0].amount_paise).toBe(150000);
      expect(updatedPayments[0].method).toBe('upi');
    });

    it('records a split payment by creating corresponding payment records with shared note/link', async () => {
      const initialCount = useDemoStore.getState().payments.length;

      const result = await recordPayment({
        gym_id: 'demo-gym-001',
        member_id: 'demo-member-2',
        received_by: 'demo-partner-001',
        method: 'split',
        amount_paise: 200000,
        splits: [
          { method: 'cash', amount_paise: 50000 },
          { method: 'upi', amount_paise: 150000, reference: 'UPI-SPLIT-99' },
        ],
        note: 'Split quarterly payment',
      });

      expect(result.success).toBe(true);
      const updatedPayments = useDemoStore.getState().payments;
      // Added 2 split payment records
      expect(updatedPayments.length).toBe(initialCount + 2);
    });

    it('computes accurate payment summary breakdown by method', () => {
      const payments = useDemoStore.getState().payments;
      const summary = getPaymentSummary(payments);

      expect(summary.total_paise).toBeGreaterThan(0);
      expect(summary.cash_paise + summary.upi_paise + summary.other_paise).toBe(summary.total_paise);
      expect(summary.count).toBe(payments.length);
    });
  });
});
