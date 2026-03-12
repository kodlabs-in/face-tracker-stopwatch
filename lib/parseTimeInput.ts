export type TimeParts = {
  hours: string;
  minutes: string;
  seconds: string;
};

const clamp = (value: number, min: number, max: number): number => Math.min(max, Math.max(min, value));

const parsePart = (value: string, max: number): number => {
  const numeric = Number.parseInt(value, 10);
  if (Number.isNaN(numeric)) {
    return 0;
  }

  return clamp(numeric, 0, max);
};

export function parseTimeInput(parts: TimeParts): number {
  const hours = parsePart(parts.hours, 99);
  const minutes = parsePart(parts.minutes, 59);
  const seconds = parsePart(parts.seconds, 59);

  return ((hours * 60 + minutes) * 60 + seconds) * 1000;
}

export function msToTimeParts(ms: number): TimeParts {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600)
    .toString()
    .padStart(2, '0');
  const minutes = Math.floor((totalSeconds % 3600) / 60)
    .toString()
    .padStart(2, '0');
  const seconds = (totalSeconds % 60).toString().padStart(2, '0');

  return { hours, minutes, seconds };
}
