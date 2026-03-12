export type EyeClosureState = {
  leftEyeClosedScore: number;
  rightEyeClosedScore: number;
};

export function areEyesClosed(state: EyeClosureState, threshold: number): boolean {
  return state.leftEyeClosedScore >= threshold && state.rightEyeClosedScore >= threshold;
}

export function isSleepingFromEyeClosure(
  eyesClosedSinceAt: number | null,
  nowMs: number,
  sleepGraceMs: number
): boolean {
  if (eyesClosedSinceAt === null) {
    return false;
  }

  return nowMs - eyesClosedSinceAt >= sleepGraceMs;
}
