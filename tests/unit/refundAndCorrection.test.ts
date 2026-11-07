import { describe, it, expect, beforeEach } from 'vitest';
import {
  processRefund,
  correctPayment,
  getRefundsForPayment,
  type ProcessRefundInput,
  type CorrectPaymentInput,
} from '@/services/paymentService';
import { useDemoStore } from '@/stores/demoStore';
import type { DbPayment } from '@/types/database';

describe('Refunds & Payment Corrections (Audit Integrity)', () => {
  beforeEach(() => {
    useDemoStore.getState().resetToDefault();
  });

  const samplePayment: DbPayment = {
    id: 'demo-payment-test-100',
    gym_id: 'demo-gym-001',
    member_id: 'demo-member-1',
    received_by: 'demo-partner-001',
    method: 'upi',
    amount_paise: 380000, // ₹3,800
    status: 'completed',
    reference: 'UPI-SAMPLE-100',
    note: 'Quarterly membership',
    paid_at: new Date().toISOString(),
    is_correction: false,
    original_id: null,
    corrected_by: null,
    corrected_at: null,
    correction_reason: null,
    created_at: new Date().toISOString(),
  };

  describe('Refund Processing', () => {
    it('creates a non-destructive refund record without deleting the original payment', async () => {
      useDemoStore.getState().recordPayment(samplePayment);
      const originalCount = useDemoStore.getState().payments.length;

      const refundInput: ProcessRefundInput = {
        gym_id: samplePayment.gym_id,
        payment_id: samplePayment.id,
        processed_by: 'demo-partner-001',
        amount_paise: 100000, // Partial refund ₹1,000
        method: 'upi',
        reason: 'Member relocated to another state',
      };

      const result = await processRefund(refundInput);
      expect(result.success).toBe(true);
      expect(result.refundId).toBeDefined();

      // Original payment is preserved in payments store
      const payments = useDemoStore.getState().payments;
      const foundOriginal = payments.find((p) => p.id === samplePayment.id);
      expect(foundOriginal).toBeDefined();
      expect(foundOriginal?.amount_paise).toBe(380000);
      expect(payments.length).toBe(originalCount); // Original remains untouched

      // Check refunds collection
      const refunds = getRefundsForPayment(samplePayment.id);
      expect(refunds).toHaveLength(1);
      expect(refunds[0].amount_paise).toBe(100000);
      expect(refunds[0].reason).toBe('Member relocated to another state');
    });

    it('rejects refund if amount exceeds original payment amount', async () => {
      useDemoStore.getState().recordPayment(samplePayment);

      const refundInput: ProcessRefundInput = {
        gym_id: samplePayment.gym_id,
        payment_id: samplePayment.id,
        processed_by: 'demo-partner-001',
        amount_paise: 500000, // ₹5,000 > ₹3,800 original
        method: 'upi',
        reason: 'Excess refund attempt',
      };

      const result = await processRefund(refundInput);
      expect(result.success).toBe(false);
      expect(result.error).toContain('cannot exceed original payment');
    });

    it('rejects refund if reason is blank', async () => {
      useDemoStore.getState().recordPayment(samplePayment);

      const refundInput: ProcessRefundInput = {
        gym_id: samplePayment.gym_id,
        payment_id: samplePayment.id,
        processed_by: 'demo-partner-001',
        amount_paise: 100000,
        method: 'cash',
        reason: '   ',
      };

      const result = await processRefund(refundInput);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Reason is required');
    });
  });

  describe('Payment Clerical Corrections', () => {
    it('applies correction by flagging original and creating linked corrected payment with audit reason', async () => {
      useDemoStore.getState().recordPayment(samplePayment);

      const correctionInput: CorrectPaymentInput = {
        payment_id: samplePayment.id,
        corrected_by: 'demo-partner-002',
        reason: 'Clerical typo: entered as UPI but member paid Cash',
        new_method: 'cash',
        new_amount_paise: 380000,
        new_reference: 'CASH-CORRECTED',
        new_note: 'Corrected payment method',
      };

      const result = await correctPayment(correctionInput);
      expect(result.success).toBe(true);
      expect(result.newPaymentId).toBeDefined();

      const payments = useDemoStore.getState().payments;
      const original = payments.find((p) => p.id === samplePayment.id);
      expect(original?.is_correction).toBe(true);
      expect(original?.correction_reason).toBe('Clerical typo: entered as UPI but member paid Cash');
      expect(original?.corrected_by).toBe('demo-partner-002');
      expect(original?.status).toBe('refunded'); // Original superseded

      const correctedRecord = payments.find((p) => p.id === result.newPaymentId);
      expect(correctedRecord).toBeDefined();
      expect(correctedRecord?.method).toBe('cash');
      expect(correctedRecord?.original_id).toBe(samplePayment.id);
      expect(correctedRecord?.status).toBe('completed');
    });

    it('rejects correction if mandatory reason is missing', async () => {
      useDemoStore.getState().recordPayment(samplePayment);

      const correctionInput: CorrectPaymentInput = {
        payment_id: samplePayment.id,
        corrected_by: 'demo-partner-002',
        reason: '',
        new_method: 'cash',
        new_amount_paise: 380000,
      };

      const result = await correctPayment(correctionInput);
      expect(result.success).toBe(false);
      expect(result.error).toContain('Audit reason is mandatory');
    });
  });
});
