import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { Avatar, initialsOf, tintOf } from './avatar';

describe('initialsOf', () => {
  it.each([
    ['Adaeze Okafor', 'AO'],
    ['Grace Njeri Wanjiru', 'GW'],
    ['Ngozi', 'N'],
    ['  tomás  ferreira ', 'TF'],
    ['李明', '李'],
    ['', '?'],
  ])('%s -> %s', (name, expected) => {
    expect(initialsOf(name)).toBe(expected);
  });
});

describe('tintOf', () => {
  it('is deterministic and within 1-6', () => {
    for (const n of ['Adaeze Okafor', 'Kwabena Mensah', 'Priya Nair']) {
      expect(tintOf(n)).toBe(tintOf(n));
      expect(tintOf(n)).toBeGreaterThanOrEqual(1);
      expect(tintOf(n)).toBeLessThanOrEqual(6);
    }
  });
});

describe('Avatar', () => {
  it('exposes the person name as its accessible name', () => {
    render(<Avatar name="Grace Wanjiru" />);
    expect(screen.getByRole('img', { name: 'Grace Wanjiru' })).toBeInTheDocument();
  });
});
