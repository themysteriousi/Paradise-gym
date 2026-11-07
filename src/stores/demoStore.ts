import { create } from 'zustand';
import type { DbMember, DbMembershipPlan, DbPayment, DbAttendance } from '@/types/database';
import { generateDemoDataset } from '@/services/demoDataService';

interface DemoState {
  members: DbMember[];
  plans: DbMembershipPlan[];
  payments: DbPayment[];
  attendance: DbAttendance[];
  addMember: (member: DbMember) => void;
  recordAttendance: (attendance: DbAttendance) => void;
  recordPayment: (payment: DbPayment) => void;
  resetToDefault: () => void;
}

const initialData = generateDemoDataset();

export const useDemoStore = create<DemoState>((set) => ({
  members: initialData.members,
  plans: initialData.plans,
  payments: initialData.payments,
  attendance: initialData.attendance,

  addMember: (member) =>
    set((state) => ({ members: [member, ...state.members] })),

  recordAttendance: (att) =>
    set((state) => ({ attendance: [att, ...state.attendance] })),

  recordPayment: (pay) =>
    set((state) => ({ payments: [pay, ...state.payments] })),

  resetToDefault: () => {
    const refreshed = generateDemoDataset();
    set({
      members: refreshed.members,
      plans: refreshed.plans,
      payments: refreshed.payments,
      attendance: refreshed.attendance,
    });
  },
}));
