export function normalizePassword(value: string): string {
  return value.trim();
}

export function isPasswordValid(input: string, expected: string): boolean {
  const provided = normalizePassword(input);
  const target = normalizePassword(expected);

  if (!target) {
    return false;
  }

  return provided === target;
}
