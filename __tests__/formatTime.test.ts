import { describe, expect, it } from 'vitest';
import { formatTime } from '@/lib/formatTime';

describe('formatTime', () => {
  it('formats milliseconds as HH:MM:SS', () => {
    expect(formatTime(0)).toBe('00:00:00');
    expect(formatTime(65_000)).toBe('00:01:05');
    expect(formatTime(3_661_000)).toBe('01:01:01');
  });

  it('clamps negative values to zero', () => {
    expect(formatTime(-100)).toBe('00:00:00');
  });
});
