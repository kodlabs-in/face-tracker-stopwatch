import { describe, expect, it } from 'vitest';
import { msToTimeParts, parseTimeInput } from '@/lib/parseTimeInput';

describe('parseTimeInput', () => {
  it('parses time parts into milliseconds', () => {
    expect(parseTimeInput({ hours: '01', minutes: '02', seconds: '03' })).toBe(3_723_000);
  });

  it('clamps invalid ranges', () => {
    expect(parseTimeInput({ hours: '999', minutes: '99', seconds: '99' })).toBe(359_999_000);
  });

  it('handles non-numeric values', () => {
    expect(parseTimeInput({ hours: 'aa', minutes: '-', seconds: '' })).toBe(0);
  });
});

describe('msToTimeParts', () => {
  it('converts milliseconds to padded fields', () => {
    expect(msToTimeParts(3_723_000)).toEqual({ hours: '01', minutes: '02', seconds: '03' });
  });
});
