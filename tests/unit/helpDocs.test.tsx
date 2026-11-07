import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import HelpPage from '@/pages/more/HelpPage';

describe('HelpPage Component', () => {
  it('renders help page header and instructions', () => {
    render(<HelpPage />);
    expect(screen.getByText(/Partner Help & Operational Guides/i)).toBeInTheDocument();
  });

  it('toggles accordion sections open and closed', () => {
    render(<HelpPage />);
    
    // First section is open by default
    expect(screen.getByText(/Morning Opening/i)).toBeInTheDocument();

    // Click to toggle second section
    const memberOnboardingBtn = screen.getByRole('button', { name: /Member Self-Registration & Digital Cards/i });
    fireEvent.click(memberOnboardingBtn);

    expect(screen.getByText(/New members can register themselves by scanning/i)).toBeInTheDocument();
  });
});

