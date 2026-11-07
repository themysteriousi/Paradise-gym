import { create } from 'zustand';
import type {
  DbMember,
  DbMembership,
  DbMembershipPlan,
  DbPayment,
  DbAttendance,
  DbRefund,
  DbExpense,
  DbPartnerTransaction,
  DbQrToken,
  DbGymClosure,
  DbMembershipExtension,
} from '@/types/database';
import { generateDemoDataset } from '@/services/demoDataService';

interface DemoState {
  members: DbMember[];
  memberships: DbMembership[];
  plans: DbMembershipPlan[];
  payments: DbPayment[];
  refunds: DbRefund[];
  expenses: DbExpense[];
  partnerTransactions: DbPartnerTransaction[];
  qrTokens: DbQrToken[];
  attendance: DbAttendance[];
  closures: DbGymClosure[];
  extensions: DbMembershipExtension[];
  addMember: (member: DbMember) => void;
  addMembership: (membership: DbMembership) => void;
  updateMembership: (id: string, updates: Partial<DbMembership>) => void;
  recordAttendance: (attendance: DbAttendance) => void;
  recordPayment: (payment: DbPayment) => void;
  updatePayment: (id: string, updates: Partial<DbPayment>) => void;
  addRefund: (refund: DbRefund) => void;
  addExpense: (expense: DbExpense) => void;
  addPartnerTransaction: (tx: DbPartnerTransaction) => void;
  addQrToken: (token: DbQrToken) => void;
  revokeQrTokensForMember: (memberId: string, revokedBy?: string) => void;
  revokeQrTokenByString: (tokenString: string, revokedBy: string) => void;
  addClosure: (closure: DbGymClosure) => void;
  addExtension: (extension: DbMembershipExtension) => void;
  resetToDefault: () => void;
  clearForLiveMode: () => void;
}

const initialData = generateDemoDataset();

export const useDemoStore = create<DemoState>((set) => ({
  members: initialData.members,
  memberships: initialData.memberships,
  plans: initialData.plans,
  payments: initialData.payments,
  refunds: [],
  expenses: [],
  partnerTransactions: [],
  qrTokens: [],
  attendance: initialData.attendance,
  closures: [],
  extensions: [],

  addMember: (member) =>
    set((state) => ({ members: [member, ...state.members] })),

  addMembership: (membership) =>
    set((state) => ({ memberships: [membership, ...state.memberships] })),

  updateMembership: (id, updates) =>
    set((state) => ({
      memberships: state.memberships.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    })),

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

  addClosure: (closure) =>
    set((state) => ({ closures: [closure, ...state.closures] })),

  addExtension: (extension) =>
    set((state) => ({ extensions: [extension, ...state.extensions] })),

  resetToDefault: () => {
    const refreshed = generateDemoDataset();
    set({
      members: refreshed.members,
      memberships: refreshed.memberships,
      plans: refreshed.plans,
      payments: refreshed.payments,
      refunds: [],
      expenses: [],
      partnerTransactions: [],
      qrTokens: [],
      attendance: refreshed.attendance,
      closures: [],
      extensions: [],
    });
  },

  clearForLiveMode: () => {
    set({
      members: [],
      memberships: [],
      plans: [],
      payments: [],
      refunds: [],
      expenses: [],
      partnerTransactions: [],
      qrTokens: [],
      attendance: [],
      closures: [],
      extensions: [],
    });
  },
}));
