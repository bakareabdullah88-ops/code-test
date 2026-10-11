import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '@/test/a11y';
import { Button } from './button';

describe('Button', () => {
  it('fires onClick and defaults to type=button', async () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Send feedback</Button>);
    const btn = screen.getByRole('button', { name: 'Send feedback' });
    expect(btn).toHaveAttribute('type', 'button');
    await userEvent.click(btn);
    expect(onClick).toHaveBeenCalledOnce();
  });

  it('is disabled and busy while loading, and does not fire', async () => {
    const onClick = vi.fn();
    render(<Button loading onClick={onClick}>Send feedback</Button>);
    const btn = screen.getByRole('button', { name: 'Send feedback' });
    expect(btn).toBeDisabled();
    expect(btn).toHaveAttribute('aria-busy', 'true');
    await userEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it('renders as a link with asChild', () => {
    render(<Button asChild><a href="https://example.org/today">Today</a></Button>);
    expect(screen.getByRole('link', { name: 'Today' })).toHaveAttribute("href", "https://example.org/today");
  });

  it('has no accessibility violations', async () => {
    const { container } = render(<Button variant="danger">Delete reflection</Button>);
    await expectNoA11yViolations(container);
  });
});
