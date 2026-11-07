import { create } from 'zustand';
import type { DbMember, DbMembershipPlan, DbPayment, DbAttendance, DbRefund } from '@/types/database';
import { generateDemoDataset } from '@/services/demoDataService';

interface DemoState {
  members: DbMember[];
  plans: DbMembershipPlan[];
  payments: DbPayment[];
  refunds: DbRefund[];
  attendance: DbAttendance[];
  addMember: (member: DbMember) => void;
  recordAttendance: (attendance: DbAttendance) => void;
  recordPayment: (payment: DbPayment) => void;
  updatePayment: (id: string, updates: Partial<DbPayment>) => void;
  addRefund: (refund: DbRefund) => void;
  resetToDefault: () => void;
}

const initialData = generateDemoDataset();

export const useDemoStore = create<DemoState>((set) => ({
  members: initialData.members,
  plans: initialData.plans,
  payments: initialData.payments,
  refunds: [],
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

  resetToDefault: () => {
    const refreshed = generateDemoDataset();
    set({
      members: refreshed.members,
      plans: refreshed.plans,
      payments: refreshed.payments,
      refunds: [],
      attendance: refreshed.attendance,
    });
  },
}));

