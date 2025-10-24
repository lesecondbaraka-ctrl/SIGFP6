import React from 'react';
import { render, screen } from '@testing-library/react';
import TresorerieModule from '../TresorerieModule';

// Basic smoke test to ensure component renders without crashing
describe('TresorerieModule', () => {
  it('renders header and tabs', () => {
    render(<TresorerieModule />);
    expect(screen.getByText(/Module Trésorerie/i)).toBeInTheDocument();
    expect(screen.getByRole('tablist')).toBeInTheDocument();
  });
});
