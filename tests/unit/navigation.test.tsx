import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, beforeEach } from 'vitest';
import BottomNav from '@/components/layout/BottomNav';
import { useUiStore } from '@/stores/uiStore';

describe('Bottom Navigation & UI Store', () => {
  beforeEach(() => {
    useUiStore.getState().setActiveTab('dashboard');
  });

  it('renders all 5 core navigation tabs with proper accessible targets', () => {
    render(<BottomNav />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Members')).toBeInTheDocument();
    expect(screen.getByText('Attendance')).toBeInTheDocument();
    expect(screen.getByText('Payments')).toBeInTheDocument();
    expect(screen.getByText('More')).toBeInTheDocument();
  });

  it('updates the active tab in uiStore on click', () => {
    render(<BottomNav />);
    const membersButton = screen.getByRole('button', { name: /Members/i });
    fireEvent.click(membersButton);

    expect(useUiStore.getState().activeTab).toBe('members');
  });

  it('toggles dark and light mode', () => {
    const initialTheme = useUiStore.getState().theme;
    useUiStore.getState().toggleTheme();
    expect(useUiStore.getState().theme).not.toBe(initialTheme);
  });
});
