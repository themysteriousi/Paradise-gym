import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import type { DbPartner, DbGym } from '@/types/database';
import { supabase, isSupabaseConfigured } from '@/lib/supabase';
import { dataSyncService } from '@/services/dataSyncService';

interface AuthState {
  isAuthenticated: boolean;
  isDemoMode: boolean;
  currentPartner: DbPartner | null;
  currentGym: DbGym | null;
  isLoading: boolean;
  isInitialized: boolean;
  setPartner: (partner: DbPartner, gym?: DbGym) => void;
  enableDemoMode: () => void;
  logout: () => Promise<void>;
  initializeAuth: () => Promise<void>;
}

export const DEFAULT_GYM: DbGym = {
  id: '00000000-0000-0000-0000-000000000001',
  name: 'Paradise Gym',
  address: '123 Fitness Street, Near Civil Lines',
  phone: '9876543210',
  email: 'contact@paradisegym.com',
  gst_number: null,
  logo_url: null,
  timezone: 'Asia/Kolkata',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
};

async function resolvePartnerAndGym(user: {
  id: string;
  email?: string | null;
  phone?: string | null;
  user_metadata?: Record<string, unknown>;
}): Promise<{ partner: DbPartner; gym: DbGym }> {
  let partner: DbPartner | null = null;

  try {
    const { data: partnerByAuth } = await supabase
      .from('partners')
      .select('*')
      .eq('auth_user_id', user.id)
      .maybeSingle();

    if (partnerByAuth) {
      partner = partnerByAuth;
    } else if (user.email) {
      const { data: partnerByEmail } = await supabase
        .from('partners')
        .select('*')
        .eq('email', user.email)
        .maybeSingle();

      if (partnerByEmail) {
        try {
          await supabase
            .from('partners')
            .update({ auth_user_id: user.id })
            .eq('id', partnerByEmail.id);
        } catch (_) {
          // Ignore update error if RLS restricts update
        }
        partner = { ...partnerByEmail, auth_user_id: user.id };
      }
    }
  } catch (err) {
    console.warn('Error querying partner from database:', err);
  }

  const fallbackDisplayName =
    (user.user_metadata?.full_name as string) ||
    (user.user_metadata?.name as string) ||
    user.email?.split('@')[0] ||
    'Partner';

  // Check if an existing gym row exists in Supabase
  let existingGymId = DEFAULT_GYM.id;
  try {
    const { data: gymRow } = await supabase.from('gym').select('id').limit(1).maybeSingle();
    if (gymRow?.id) {
      existingGymId = gymRow.id;
    }
  } catch (_) {}

  const fallbackGymId = existingGymId;
  const fallbackPartnerId = user.id;

  const fallbackPartner: DbPartner = {
    id: fallbackPartnerId,
    gym_id: fallbackGymId,
    auth_user_id: user.id,
    name: fallbackDisplayName,
    email: user.email || 'partner@paradisegym.com',
    phone: user.phone || null,
    role: 'partner',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  // If partner does not exist yet (e.g. first-time Google sign-in)
  if (!partner) {
    partner = fallbackPartner;

    // Attempt to persist default gym & partner if permitted
    try {
      const { data: newGym } = await supabase
        .from('gym')
        .insert({
          id: fallbackGymId,
          name: 'Paradise Gym',
          email: user.email || null,
        })
        .select()
        .maybeSingle();

      const gymId = newGym?.id || fallbackGymId;
      partner.gym_id = gymId;

      const { data: newPartner } = await supabase
        .from('partners')
        .insert({
          id: fallbackPartnerId,
          gym_id: gymId,
          auth_user_id: user.id,
          name: fallbackDisplayName,
          email: user.email,
        })
        .select()
        .maybeSingle();

      if (newPartner) {
        partner = newPartner;
      }
    } catch (_) {
      // Retain in-memory partner profile if table inserts restricted
    }
  }

  const activePartner: DbPartner = partner || fallbackPartner;

  let gym: DbGym | null = null;
  if (activePartner.gym_id) {
    try {
      const { data: gymRecord } = await supabase
        .from('gym')
        .select('*')
        .eq('id', activePartner.gym_id)
        .maybeSingle();
      gym = gymRecord;
    } catch (_) {
      // Fallback below
    }
  }

  const resolvedGym: DbGym = gym || {
    id: activePartner.gym_id,
    name: 'Paradise Gym',
    address: null,
    phone: null,
    email: activePartner.email,
    gst_number: null,
    logo_url: null,
    timezone: 'Asia/Kolkata',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  return { partner: activePartner, gym: resolvedGym };
}

let authListenerAttached = false;

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      isAuthenticated: false,
      isDemoMode: false,
      currentPartner: null,
      currentGym: null,
      isLoading: false,
      isInitialized: false,

      setPartner: (partner, gym) => {
        const resolvedGym =
          gym && gym.id === partner.gym_id
            ? gym
            : {
                ...DEFAULT_GYM,
                id: partner.gym_id,
                name: gym?.name || DEFAULT_GYM.name,
              };

        // Sync live data from Supabase into store
        if (partner.gym_id) {
          dataSyncService.syncGymData(partner.gym_id).catch(() => {});
        }

        set({
          isAuthenticated: true,
          isDemoMode: false,
          currentPartner: partner,
          currentGym: resolvedGym,
          isLoading: false,
          isInitialized: true,
        });
      },

      enableDemoMode: () =>
        set({
          isAuthenticated: true,
          isDemoMode: true,
          currentPartner: {
            id: 'test-partner-001',
            gym_id: 'test-gym-001',
            auth_user_id: 'test-auth-001',
            name: 'Partner',
            email: 'partner@paradisegym.com',
            phone: '9876543210',
            role: 'partner',
            is_active: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          },
          currentGym: DEFAULT_GYM,
          isLoading: false,
          isInitialized: true,
        }),

      logout: async () => {
        if (isSupabaseConfigured) {
          try {
            await supabase.auth.signOut();
          } catch (err) {
            console.warn('Supabase signOut error:', err);
          }
        }
        set({
          isAuthenticated: false,
          isDemoMode: false,
          currentPartner: null,
          currentGym: null,
          isLoading: false,
          isInitialized: true,
        });
      },

      initializeAuth: async () => {
        if (!isSupabaseConfigured) {
          if (get().isAuthenticated) {
            set({ isLoading: false, isInitialized: true });
            return;
          }
          set({
            isAuthenticated: false,
            isDemoMode: false,
            currentPartner: null,
            currentGym: null,
            isLoading: false,
            isInitialized: true,
          });
          return;
        }

        if (!authListenerAttached) {
          authListenerAttached = true;
          supabase.auth.onAuthStateChange(async (event, session) => {
            if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
              if (session?.user) {
                const { partner, gym } = await resolvePartnerAndGym(session.user);
                get().setPartner(partner, gym);
              }
            } else if (event === 'SIGNED_OUT') {
              set({
                isAuthenticated: false,
                isDemoMode: false,
                currentPartner: null,
                currentGym: null,
                isLoading: false,
                isInitialized: true,
              });
            }
          });
        }

        // Active session check
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const { partner, gym } = await resolvePartnerAndGym(session.user);
            get().setPartner(partner, gym);
          } else {
            set({
              isAuthenticated: false,
              isDemoMode: false,
              currentPartner: null,
              currentGym: null,
              isLoading: false,
              isInitialized: true,
            });
          }
        } catch (err) {
          console.error('Session retrieval error:', err);
          set({
            isAuthenticated: false,
            isDemoMode: false,
            isLoading: false,
            isInitialized: true,
          });
        }
      },
    }),
    {
      name: 'paradise_gym_auth_storage',
      storage: createJSONStorage(() => {
        if (typeof window !== 'undefined' && window.localStorage) {
          return window.localStorage;
        }
        return {
          getItem: () => null,
          setItem: () => {},
          removeItem: () => {},
        };
      }),
      partialize: (state) => ({
        isAuthenticated: state.isAuthenticated,
        currentPartner: state.currentPartner,
        currentGym: state.currentGym,
      }),
      onRehydrateStorage: () => (state) => {
        // If state was previously demo mode or mock partner, purge it immediately
        if (
          state &&
          (state.currentPartner?.id?.startsWith('demo-') ||
            (state as { isDemoMode?: boolean }).isDemoMode)
        ) {
          state.isAuthenticated = false;
          state.isDemoMode = false;
          state.currentPartner = null;
          state.currentGym = null;
          if (typeof window !== 'undefined') {
            try {
              localStorage.removeItem('paradise_gym_demo_storage');
            } catch (_) {}
          }
        }
      },
    }
  )
);
