import { act, renderHook } from '@testing-library/react';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { useStopwatch } from '@/hooks/useStopwatch';

describe('useStopwatch', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-03-06T00:00:00.000Z'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('advances elapsed time based on timestamps when running', () => {
    const { result } = renderHook(() => useStopwatch({ initialMs: 10_000 }));

    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(2_500);
    });

    expect(result.current.elapsedMs).toBeGreaterThanOrEqual(12_400);
    expect(result.current.elapsedMs).toBeLessThanOrEqual(12_600);
  });

  it('pauses and resumes without losing elapsed progress', () => {
    const { result } = renderHook(() => useStopwatch({ initialMs: 0 }));

    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(1_000);
    });

    act(() => {
      result.current.pause();
    });

    act(() => {
      vi.advanceTimersByTime(2_000);
    });

    act(() => {
      result.current.start();
    });

    act(() => {
      vi.advanceTimersByTime(1_000);
    });

    expect(result.current.elapsedMs).toBeGreaterThanOrEqual(1_900);
    expect(result.current.elapsedMs).toBeLessThanOrEqual(2_100);
  });

  it('respects runGate for integration-style auto mode control', () => {
    const { result } = renderHook(() => useStopwatch({ initialMs: 0 }));

    act(() => {
      result.current.start();
      result.current.setRunGate(false);
    });

    act(() => {
      vi.advanceTimersByTime(2_000);
    });

    expect(result.current.elapsedMs).toBe(0);

    act(() => {
      result.current.setRunGate(true);
    });

    act(() => {
      vi.advanceTimersByTime(1_500);
    });

    expect(result.current.elapsedMs).toBeGreaterThanOrEqual(1_400);
  });
});
