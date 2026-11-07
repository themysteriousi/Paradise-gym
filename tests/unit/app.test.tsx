import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import App from '@/App';

describe('Paradise Gym App Root', () => {
  it('renders the Paradise Gym brand and main navigation shell', () => {
    render(<App />);
    expect(screen.getByText(/Paradise Gym/i)).toBeInTheDocument();
  });
});
