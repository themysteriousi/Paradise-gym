import { describe, it, expect, beforeEach } from 'vitest';
import { useAuthStore } from '@/stores/authStore';

describe('Auth Store (Zustand)', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it('initializes with unauthenticated state', () => {
    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(false);
    expect(state.currentPartner).toBeNull();
    expect(state.isDemoMode).toBe(false);
  });

  it('logs in as a partner successfully', () => {
    const mockPartner = {
      id: 'partner-1',
      gym_id: 'gym-1',
      auth_user_id: 'auth-user-1',
      name: 'Om Chauhan',
      email: 'om@paradisegym.com',
      phone: '9999999999',
      role: 'partner',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    useAuthStore.getState().setPartner(mockPartner);

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.currentPartner?.name).toBe('Om Chauhan');
    expect(state.isDemoMode).toBe(false);
  });

  it('supports activating instant demo mode', () => {
    useAuthStore.getState().enableDemoMode();

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.isDemoMode).toBe(true);
    expect(state.currentPartner?.name).toContain('Partner');
  });

  it('resets state on logout', () => {
    useAuthStore.getState().enableDemoMode();
    expect(useAuthStore.getState().isAuthenticated).toBe(true);

    useAuthStore.getState().logout();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().currentPartner).toBeNull();
  });
});

