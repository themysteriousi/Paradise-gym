import { create } from 'zustand';
import type {
  DbMember,
  DbMembershipPlan,
  DbPayment,
  DbAttendance,
  DbRefund,
  DbExpense,
  DbPartnerTransaction,
  DbQrToken,
} from '@/types/database';
import { generateDemoDataset } from '@/services/demoDataService';

interface DemoState {
  members: DbMember[];
  plans: DbMembershipPlan[];
  payments: DbPayment[];
  refunds: DbRefund[];
  expenses: DbExpense[];
  partnerTransactions: DbPartnerTransaction[];
  qrTokens: DbQrToken[];
  attendance: DbAttendance[];
  addMember: (member: DbMember) => void;
  recordAttendance: (attendance: DbAttendance) => void;
  recordPayment: (payment: DbPayment) => void;
  updatePayment: (id: string, updates: Partial<DbPayment>) => void;
  addRefund: (refund: DbRefund) => void;
  addExpense: (expense: DbExpense) => void;
  addPartnerTransaction: (tx: DbPartnerTransaction) => void;
  addQrToken: (token: DbQrToken) => void;
  revokeQrTokensForMember: (memberId: string, revokedBy?: string) => void;
  revokeQrTokenByString: (tokenString: string, revokedBy: string) => void;
  resetToDefault: () => void;
}

const initialData = generateDemoDataset();

export const useDemoStore = create<DemoState>((set) => ({
  members: initialData.members,
  plans: initialData.plans,
  payments: initialData.payments,
  refunds: [],
  expenses: [],
  partnerTransactions: [],
  qrTokens: [],
  attendance: initialData.attendance,

  addMember: (member) =>
    set((state) => ({ members: [member, ...state.members] })),

  recordAttendance: (att) =>
    set((state) => ({ attendance: [att, ...state.attendance] })),

  recordPayment: (pay) =>
    set((state) => ({ payments: [pay, ...state.payments] })),

  updatePayment: (id, updates) =>
    set((state) => ({
      payments: state.payments.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    })),

  addRefund: (refund) =>
    set((state) => ({ refunds: [refund, ...state.refunds] })),

  addExpense: (expense) =>
    set((state) => ({ expenses: [expense, ...state.expenses] })),

  addPartnerTransaction: (tx) =>
    set((state) => ({ partnerTransactions: [tx, ...state.partnerTransactions] })),

  addQrToken: (token) =>
    set((state) => ({ qrTokens: [token, ...state.qrTokens] })),

  revokeQrTokensForMember: (memberId, revokedBy) =>
    set((state) => ({
      qrTokens: state.qrTokens.map((t) =>
        t.member_id === memberId && t.revoked_at === null
          ? {
              ...t,
              revoked_at: new Date().toISOString(),
              revoked_by: revokedBy || 'system',
            }
          : t
      ),
    })),

  revokeQrTokenByString: (tokenString, revokedBy) =>
    set((state) => ({
      qrTokens: state.qrTokens.map((t) =>
        t.token === tokenString
          ? {
              ...t,
              revoked_at: new Date().toISOString(),
              revoked_by: revokedBy,
            }
          : t
      ),
    })),

  resetToDefault: () => {
    const refreshed = generateDemoDataset();
    set({
      members: refreshed.members,
      plans: refreshed.plans,
      payments: refreshed.payments,
      refunds: [],
      expenses: [],
      partnerTransactions: [],
      qrTokens: [],
      attendance: refreshed.attendance,
    });
  },
}));

