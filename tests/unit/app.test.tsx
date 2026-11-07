import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import App from '@/App';
import { useAuthStore } from '@/stores/authStore';

describe('Paradise Gym App Root & Auth Flow', () => {
  beforeEach(() => {
    useAuthStore.getState().logout();
  });

  it('renders the login screen when unauthenticated', () => {
    render(<App />);
    expect(screen.getByText(/Partner & Owner Management Portal/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
  });

  it('transitions to dashboard when clicking instant demo mode', () => {
    render(<App />);
    const demoButton = screen.getByRole('button', { name: /Launch Instant Demo Mode/i });
    fireEvent.click(demoButton);

    expect(screen.getByText(/Today's Operations/i)).toBeInTheDocument();
    expect(screen.getAllByText(/DEMO/i).length).toBeGreaterThan(0);
  });
});
