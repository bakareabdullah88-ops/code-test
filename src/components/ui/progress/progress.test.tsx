import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '@/test/a11y';
import { Progress, ProgressThread } from './progress';

describe('Progress', () => {
  it('exposes a spoken value', () => {
    render(<Progress value={37} label="Pathway progress" valueText="3 of 8 lessons" />);
    expect(screen.getByRole('progressbar', { name: 'Pathway progress' })).toHaveAttribute('aria-valuetext', '3 of 8 lessons');
  });
});

describe('ProgressThread', () => {
  it('reads as an ordered list with state per step and marks the current one', async () => {
    const { container } = render(
      <ProgressThread
        steps={[
          { id: 'a', label: 'Welcome', state: 'done', stateLabel: 'Done' },
          { id: 'b', label: 'Grace', state: 'current', stateLabel: 'Current' },
          { id: 'c', label: 'Faith', state: 'todo', stateLabel: 'Not started' },
        ]}
      />,
    );
    expect(screen.getAllByRole('listitem')).toHaveLength(3);
    expect(screen.getByText('Grace: Current')).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });
});
