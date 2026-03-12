'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { calculateElapsedMs } from '@/lib/stopwatchMath';

type UseStopwatchOptions = {
  initialMs?: number;
  tickMs?: number;
  nowProvider?: () => number;
};

export type UseStopwatchReturn = {
  isRunning: boolean;
  elapsedMs: number;
  initialMs: number;
  manualIntentRunning: boolean;
  runGate: boolean;
  setRunGate: (next: boolean) => void;
  setInitialMs: (next: number) => void;
  start: () => void;
  pause: () => void;
  reset: () => void;
};

export function useStopwatch(options: UseStopwatchOptions = {}): UseStopwatchReturn {
  const { initialMs: initialValue = 0, tickMs = 100, nowProvider = Date.now } = options;

  const [initialMs, setInitialMsState] = useState(initialValue);
  const [elapsedMs, setElapsedMs] = useState(initialValue);
  const [manualIntentRunning, setManualIntentRunning] = useState(false);
  const [runGate, setRunGate] = useState(true);
  const [isRunning, setIsRunning] = useState(false);

  const startAtRef = useRef<number | null>(null);
  const baseElapsedRef = useRef<number>(initialValue);
  const intervalRef = useRef<number | null>(null);

  const stopTicker = useCallback(() => {
    if (intervalRef.current !== null) {
      window.clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  const applyRunningState = useCallback(
    (nextRunning: boolean) => {
      if (nextRunning === isRunning) {
        return;
      }

      if (nextRunning) {
        const now = nowProvider();
        startAtRef.current = now;
        baseElapsedRef.current = elapsedMs;
        setIsRunning(true);

        stopTicker();
        intervalRef.current = window.setInterval(() => {
          if (startAtRef.current === null) {
            return;
          }

          setElapsedMs(calculateElapsedMs(baseElapsedRef.current, startAtRef.current, nowProvider()));
        }, tickMs);

        return;
      }

      if (startAtRef.current !== null) {
        const now = nowProvider();
        const nextElapsed = calculateElapsedMs(baseElapsedRef.current, startAtRef.current, now);
        baseElapsedRef.current = nextElapsed;
        setElapsedMs(nextElapsed);
      }

      startAtRef.current = null;
      setIsRunning(false);
      stopTicker();
    },
    [elapsedMs, isRunning, nowProvider, stopTicker, tickMs]
  );

  const shouldRun = useMemo(() => manualIntentRunning && runGate, [manualIntentRunning, runGate]);

  useEffect(() => {
    applyRunningState(shouldRun);
  }, [applyRunningState, shouldRun]);

  useEffect(() => {
    return () => {
      stopTicker();
    };
  }, [stopTicker]);

  const setInitialMs = useCallback(
    (next: number) => {
      const safe = Math.max(0, next);
      setInitialMsState(safe);

      if (!isRunning) {
        setElapsedMs(safe);
        baseElapsedRef.current = safe;
      }
    },
    [isRunning]
  );

  const start = useCallback(() => {
    setManualIntentRunning(true);
  }, []);

  const pause = useCallback(() => {
    setManualIntentRunning(false);
  }, []);

  const reset = useCallback(() => {
    setManualIntentRunning(false);
    setElapsedMs(initialMs);
    baseElapsedRef.current = initialMs;
    startAtRef.current = null;
    stopTicker();
    setIsRunning(false);
  }, [initialMs, stopTicker]);

  return {
    isRunning,
    elapsedMs,
    initialMs,
    manualIntentRunning,
    runGate,
    setRunGate,
    setInitialMs,
    start,
    pause,
    reset
  };
}
