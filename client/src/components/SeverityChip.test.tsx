import { render, screen } from '@testing-library/react';
import { SeverityChip } from './SeverityChip';

describe('SeverityChip', () => {
  it('renders the severity label', () => {
    render(<SeverityChip severity="HIGH" />);
    expect(screen.getByText('HIGH')).toBeInTheDocument();
  });
});