import { render, screen } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import App from '@/App';
import { useAuthStore } from '@/stores/authStore';

describe('Paradise Gym App Root & Auth Flow', () => {
  beforeEach(async () => {
    await useAuthStore.getState().logout();
  });

  it('renders the login screen with Google and credentials when unauthenticated', () => {
    render(<App />);
    expect(screen.getAllByText(/Paradise Gym/i).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Continue with Google/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign in/i })).toBeInTheDocument();
    // Confirm Demo Mode button is completely removed
    expect(screen.queryByRole('button', { name: /demo mode/i })).not.toBeInTheDocument();
  });

  it('renders the application shell when partner is authenticated', () => {
    useAuthStore.getState().setPartner({
      id: 'partner-test-1',
      gym_id: 'gym-test-1',
      auth_user_id: 'auth-test-1',
      name: 'Om Chauhan',
      email: 'om@paradisegym.com',
      phone: '9999999999',
      role: 'partner',
      is_active: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    });

    render(<App />);
    expect(screen.getAllByText(/Om Chauhan/i).length).toBeGreaterThan(0);
    // Confirm demo badge is NOT rendered
    expect(screen.queryByText(/^demo$/i)).not.toBeInTheDocument();
  });
});
