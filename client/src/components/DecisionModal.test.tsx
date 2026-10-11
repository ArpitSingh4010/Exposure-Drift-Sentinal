import { fireEvent, render, screen } from '@testing-library/react';
import { DecisionModal } from './DecisionModal';

describe('DecisionModal', () => {
  it('requires a note before confirming', () => {
    const onConfirm = vi.fn();
    render(<DecisionModal action="ACCEPT" onCancel={vi.fn()} onConfirm={onConfirm} />);
    const confirm = screen.getByRole('button', { name: 'Confirm' });
    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Note'), { target: { value: 'Reviewed' } });
    expect(confirm).toBeEnabled();
    fireEvent.click(confirm);
    expect(onConfirm).toHaveBeenCalledWith({ action: 'ACCEPT', note: 'Reviewed' });
  });

  it('requires a dismiss reason as well as a note', () => {
    render(<DecisionModal action="DISMISS" onCancel={vi.fn()} onConfirm={vi.fn()} />);
    const confirm = screen.getByRole('button', { name: 'Confirm' });
    fireEvent.change(screen.getByLabelText('Note'), { target: { value: 'Not material' } });
    expect(confirm).toBeDisabled();
    fireEvent.change(screen.getByLabelText('Reason'), { target: { value: 'not_material' } });
    expect(confirm).toBeEnabled();
  });
});