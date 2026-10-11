import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it } from 'vitest';
import { Button } from '../button/button';
import { Dialog, DialogContent, DialogTrigger } from './dialog';

function Example() {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>Open</Button>
      </DialogTrigger>
      <DialogContent title="Delete this reflection?" description="It cannot be undone." closeLabel="Close" />
    </Dialog>
  );
}

describe('Dialog', () => {
  it('opens with a labelled dialog, closes on Escape and returns focus to the trigger', async () => {
    render(<Example />);
    const trigger = screen.getByRole('button', { name: 'Open' });
    await userEvent.click(trigger);
    const dialog = screen.getByRole('dialog', { name: 'Delete this reflection?' });
    expect(dialog).toHaveAccessibleDescription('It cannot be undone.');
    await userEvent.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(trigger).toHaveFocus();
  });
});
