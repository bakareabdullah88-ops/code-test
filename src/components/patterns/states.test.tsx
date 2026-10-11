import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { expectNoA11yViolations } from '@/test/a11y';
import { EmptyState } from './empty-state/empty-state';
import { ErrorState } from './error-state/error-state';
import { OfflineBanner } from './offline-banner/offline-banner';
import { Notice } from './notice/notice';

describe('state patterns', () => {
  it('EmptyState has a heading and renders its single action', async () => {
    const { container } = render(<EmptyState title="Your journal is ready" description="Reflections are kept here." action={<button>Write</button>} />);
    expect(screen.getByRole('heading', { name: 'Your journal is ready' })).toBeInTheDocument();
    await expectNoA11yViolations(container);
  });

  it('ErrorState announces itself, retries, and hides the request id behind a disclosure', async () => {
    const onRetry = vi.fn();
    const { container } = render(
      <ErrorState title="Didn't load" description="Try again." retryLabel="Try again" onRetry={onRetry} details={{ label: 'Show details', requestId: 'req_123' }} />,
    );
    expect(screen.getByRole('alert')).toBeInTheDocument();
    await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
    expect(onRetry).toHaveBeenCalledOnce();
    expect(screen.getByText('req_123')).not.toBeVisible();
    await expectNoA11yViolations(container);
  });

  it('OfflineBanner is a polite status', () => {
    render(<OfflineBanner message="You're offline." />);
    expect(screen.getByRole('status')).toHaveTextContent("You're offline.");
  });

  it('Notice pairs tone with an icon and only danger is an alert', () => {
    const { rerender } = render(<Notice tone="info">Hello</Notice>);
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    rerender(<Notice tone="danger">Broken</Notice>);
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
