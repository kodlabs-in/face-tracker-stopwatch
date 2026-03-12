import { describe, expect, it } from 'vitest';
import { isPasswordValid, normalizePassword } from '@/lib/parentalControl';

describe('parentalControl', () => {
  it('normalizes surrounding whitespace', () => {
    expect(normalizePassword('  1234  ')).toBe('1234');
  });

  it('validates only exact password matches', () => {
    expect(isPasswordValid(' 1234 ', '1234')).toBe(true);
    expect(isPasswordValid('12345', '1234')).toBe(false);
    expect(isPasswordValid('anything', '')).toBe(false);
  });
});
