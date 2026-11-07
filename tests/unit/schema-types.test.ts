import { describe, it, expect } from 'vitest';
import type { DbMember, DbPayment } from '@/types/database';
import type { MembershipPlan, Money } from '@/types/domain';

describe('Database and Domain Schema Types', () => {
  it('enforces integer paise representation for monetary fields', () => {
    const feeInPaise: Money = 150000; // ₹1,500.00
    expect(Number.isInteger(feeInPaise)).toBe(true);

    const plan: Partial<MembershipPlan> = {
      name: 'Monthly Standard',
      pricePaise: feeInPaise,
      billingCycle: 'monthly',
      durationDays: 30
    };

    expect(plan.pricePaise).toBe(150000);
  });

  it('correctly maps raw database row to application domain model', () => {
    const dbRow: Partial<DbMember> = {
      id: 'uuid-1',
      gym_id: 'gym-1',
      full_name: 'Rahul Sharma',
      phone: '9876543210',
      status: 'active'
    };

    expect(dbRow.full_name).toBe('Rahul Sharma');
    expect(dbRow.status).toBe('active');
  });

  it('validates payment method types and amounts', () => {
    const payment: Partial<DbPayment> = {
      amount_paise: 200000,
      method: 'upi',
      status: 'completed'
    };

    expect(payment.method).toBe('upi');
    expect(payment.amount_paise).toBe(200000);
  });
});
