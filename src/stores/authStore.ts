import { create } from 'zustand';
import type { DbPartner, DbGym } from '@/types/database';

interface AuthState {
  isAuthenticated: boolean;
  isDemoMode: boolean;
  currentPartner: DbPartner | null;
  currentGym: DbGym | null;
  isLoading: boolean;
  setPartner: (partner: DbPartner, gym?: DbGym) => void;
  enableDemoMode: () => void;
  logout: () => void;
}

const DEMO_GYM: DbGym = {
  id: 'demo-gym-001',
  name: 'Paradise Gym (Demo)',
  address: '123 Fitness Street, Near Civil Lines',
  phone: '9876543210',
  email: 'contact@paradisegym.demo',
  gst_number: null,
  logo_url: null,
  timezone: 'Asia/Kolkata',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

const DEMO_PARTNER: DbPartner = {
  id: 'demo-partner-001',
  gym_id: 'demo-gym-001',
  auth_user_id: 'demo-auth-001',
  name: 'Partner (Demo)',
  email: 'partner@paradisegym.demo',
  phone: '9876543210',
  role: 'partner',
  is_active: true,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

export const useAuthStore = create<AuthState>((set) => ({
  isAuthenticated: false,
  isDemoMode: false,
  currentPartner: null,
  currentGym: null,
  isLoading: false,

  setPartner: (partner, gym = DEMO_GYM) =>
    set({
      isAuthenticated: true,
      isDemoMode: false,
      currentPartner: partner,
      currentGym: gym,
      isLoading: false,
    }),

  enableDemoMode: () =>
    set({
      isAuthenticated: true,
      isDemoMode: true,
      currentPartner: DEMO_PARTNER,
      currentGym: DEMO_GYM,
      isLoading: false,
    }),

  logout: () =>
    set({
      isAuthenticated: false,
      isDemoMode: false,
      currentPartner: null,
      currentGym: null,
      isLoading: false,
    }),
}));

