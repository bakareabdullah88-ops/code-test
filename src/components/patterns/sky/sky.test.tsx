import { describe, expect, it } from 'vitest';
import { render } from '@testing-library/react';
import { Sky, daypartFor } from './sky';

describe('daypartFor', () => {
  it('maps hours to the three day parts, with late night counted as evening', () => {
    expect(daypartFor(4)).toBe('morning');
    expect(daypartFor(11)).toBe('morning');
    expect(daypartFor(12)).toBe('afternoon');
    expect(daypartFor(16)).toBe('afternoon');
    expect(daypartFor(17)).toBe('evening');
    expect(daypartFor(0)).toBe('evening');
    expect(daypartFor(3)).toBe('evening');
  });
});

describe('Sky', () => {
  it('is hidden from assistive tech and sets the day part on the document', () => {
    const { container } = render(<Sky />);
    expect(container.firstElementChild?.getAttribute('aria-hidden')).toBe('true');
    expect(['morning', 'afternoon', 'evening']).toContain(document.documentElement.dataset.daypart);
  });
});
