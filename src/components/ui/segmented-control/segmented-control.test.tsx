import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '@/test/a11y';
import { SegmentedControl } from './segmented-control';

const options = [{ value: 'a', label: 'Pathways' }, { value: 'b', label: 'Timeline' }];

describe('SegmentedControl', () => {
  it('changes value on click and never deselects', async () => {
    const onChange = vi.fn();
    render(<SegmentedControl label="View" value="a" onValueChange={onChange} options={options} />);
    await userEvent.click(screen.getByRole('radio', { name: 'Timeline' }));
    expect(onChange).toHaveBeenCalledWith('b');
    await userEvent.click(screen.getByRole('radio', { name: 'Pathways' }));
    expect(onChange).not.toHaveBeenCalledWith('');
  });

  it('is a labelled radio group with no violations', async () => {
    const { container } = render(<SegmentedControl label="View" value="a" onValueChange={() => {}} options={options} />);
    expect(screen.getByRole('radiogroup', { name: 'View' })).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });
});
