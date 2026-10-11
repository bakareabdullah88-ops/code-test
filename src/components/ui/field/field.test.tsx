import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { expectNoA11yViolations } from '@/test/a11y';
import { Input } from '../input/input';
import { Field } from './field';

describe('Field', () => {
  it('labels the control and wires description and error in order', () => {
    render(
      <Field label="Email" description="We never share it." error="Enter an email address." required>
        {(p) => <Input {...p} />}
      </Field>,
    );
    const input = screen.getByLabelText(/Email/);
    expect(input).toHaveAttribute('aria-invalid', 'true');
    expect(input).toHaveAttribute('aria-required', 'true');
    expect(input).toHaveAccessibleDescription('We never share it. Enter an email address.');
  });

  it('is not marked invalid without an error', async () => {
    const { container } = render(<Field label="Name">{(p) => <Input {...p} />}</Field>);
    expect(screen.getByLabelText('Name')).not.toHaveAttribute('aria-invalid');
    await expectNoA11yViolations(container);
  });
});
