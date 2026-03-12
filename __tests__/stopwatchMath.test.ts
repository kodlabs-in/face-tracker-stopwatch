import { describe, expect, it } from 'vitest';
import { calculateElapsedMs } from '@/lib/stopwatchMath';

describe('calculateElapsedMs', () => {
  it('adds elapsed runtime to base elapsed value', () => {
    expect(calculateElapsedMs(10_000, 1_000, 3_500)).toBe(12_500);
  });

  it('never returns less than base elapsed', () => {
    expect(calculateElapsedMs(5_000, 2_000, 1_000)).toBe(5_000);
  });
});
