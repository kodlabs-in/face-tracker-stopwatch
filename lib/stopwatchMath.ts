export function calculateElapsedMs(baseElapsedMs: number, startedAtMs: number, nowMs: number): number {
  return Math.max(baseElapsedMs, baseElapsedMs + Math.max(0, nowMs - startedAtMs));
}
