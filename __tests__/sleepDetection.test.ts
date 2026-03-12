import { describe, expect, it } from 'vitest';
import { areEyesClosed, isSleepingFromEyeClosure } from '@/lib/sleepDetection';

describe('sleepDetection', () => {
  it('treats both eyes over threshold as closed', () => {
    expect(areEyesClosed({ leftEyeClosedScore: 0.7, rightEyeClosedScore: 0.8 }, 0.55)).toBe(true);
    expect(areEyesClosed({ leftEyeClosedScore: 0.7, rightEyeClosedScore: 0.4 }, 0.55)).toBe(false);
  });

  it('marks sleeping only after sustained eye closure grace period', () => {
    expect(isSleepingFromEyeClosure(null, 10_000, 2000)).toBe(false);
    expect(isSleepingFromEyeClosure(9_000, 10_500, 2000)).toBe(false);
    expect(isSleepingFromEyeClosure(8_000, 10_500, 2000)).toBe(true);
  });
});
