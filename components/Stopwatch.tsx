'use client';

import { ChangeEvent, useEffect, useState } from 'react';
import { formatTime } from '@/lib/formatTime';
import { msToTimeParts, parseTimeInput } from '@/lib/parseTimeInput';
import { InfoHint } from '@/components/InfoHint';

type StopwatchProps = {
  elapsedMs: number;
  initialMs: number;
  isRunning: boolean;
  onInitialMsChange: (next: number) => void;
  onStart: () => void;
  onPause: () => void;
  onReset: () => void;
};

export function Stopwatch({
  elapsedMs,
  initialMs,
  isRunning,
  onInitialMsChange,
  onStart,
  onPause,
  onReset
}: StopwatchProps) {
  const [parts, setParts] = useState(msToTimeParts(initialMs));

  useEffect(() => {
    if (!isRunning) {
      setParts(msToTimeParts(initialMs));
    }
  }, [initialMs, isRunning]);

  const handlePartChange = (key: keyof typeof parts) => (event: ChangeEvent<HTMLInputElement>) => {
    const digits = event.target.value.replace(/\D/g, '').slice(0, 2);
    const nextParts = { ...parts, [key]: digits };
    setParts(nextParts);
    onInitialMsChange(parseTimeInput(nextParts));
  };

  return (
    <section className="card stopwatch-card">
      <h2 className="section-title">
        Stopwatch
        <InfoHint
          label="Stopwatch info"
          text="Set your start time and control focus manually. In auto mode, timer runs only when you are present and awake."
        />
      </h2>
      <p className="time-display" aria-live="polite">
        {formatTime(elapsedMs)}
      </p>

      <div className="time-inputs">
        <label>
          Hours
          <input
            inputMode="numeric"
            pattern="[0-9]*"
            value={parts.hours}
            onChange={handlePartChange('hours')}
            disabled={isRunning}
          />
        </label>
        <label>
          Minutes
          <input
            inputMode="numeric"
            pattern="[0-9]*"
            value={parts.minutes}
            onChange={handlePartChange('minutes')}
            disabled={isRunning}
          />
        </label>
        <label>
          Seconds
          <input
            inputMode="numeric"
            pattern="[0-9]*"
            value={parts.seconds}
            onChange={handlePartChange('seconds')}
            disabled={isRunning}
          />
        </label>
      </div>

      <div className="button-row">
        <button type="button" onClick={isRunning ? onPause : onStart}>
          {isRunning ? 'Pause' : 'Start'}
        </button>
        <button type="button" onClick={onReset}>
          Reset
        </button>
      </div>
    </section>
  );
}
