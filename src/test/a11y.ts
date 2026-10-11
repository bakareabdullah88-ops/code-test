import { axe } from 'jest-axe';
import { expect } from 'vitest';

export async function expectNoA11yViolations(container: Element) {
  expect(await axe(container)).toHaveNoViolations();
}
