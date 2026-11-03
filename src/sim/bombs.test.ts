import { describe, expect, test } from 'vitest';
import {
  fmtBytes,
  fmtRatio,
  guardedExtract,
  nestedBomb,
  overlapBomb,
} from './bombs';

describe('bomb math', () => {
  test('nested bomb matches the 42.zip shape (42 KB -> ~4.5 PB)', () => {
    // 16^5 copies of a 4.3 GB leaf.
    const b = nestedBomb(5, 16, 4.3 * 1024 ** 3);
    const PB = 1024 ** 5;
    expect(b.unpacked / PB).toBeGreaterThan(4);
    expect(b.unpacked / PB).toBeLessThan(5);
    expect(b.ratio).toBeGreaterThan(1_000_000);
  });

  test('more layers means a bigger explosion', () => {
    const four = nestedBomb(4, 16, 1e6).unpacked;
    const five = nestedBomb(5, 16, 1e6).unpacked;
    expect(five).toBeGreaterThan(four);
  });

  test('the overlap bomb grows super-linearly and respects the reported ceiling', () => {
    const small = overlapBomb(100 * 1024);
    const big = overlapBomb(10 * 1024 * 1024);
    // Doubling input more than doubles the ratio (quadratic output).
    expect(big.ratio).toBeGreaterThan(small.ratio);
    expect(big.ratio).toBeLessThanOrEqual(28_000_000);
  });
});

describe('guarded extractor (the defense)', () => {
  const bomb = nestedBomb(5, 16, 4.3 * 1024 ** 3);

  test('an output-size cap aborts the bomb early', () => {
    const r = guardedExtract(bomb, { maxOutputBytes: 100 * 1024 * 1024, maxRatio: Infinity });
    expect(r.aborted).toBe(true);
    expect(r.fractionExtracted).toBeLessThan(0.01);
    expect(r.reason).toMatch(/cap/);
  });

  test('a ratio cap aborts the bomb early', () => {
    const r = guardedExtract(bomb, { maxOutputBytes: Infinity, maxRatio: 100 });
    expect(r.aborted).toBe(true);
    expect(r.reason).toMatch(/ratio/);
  });

  test('a benign file finishes within limits', () => {
    const benign = { packed: 1000, unpacked: 5000, ratio: 5 };
    const r = guardedExtract(benign, { maxOutputBytes: 1e6, maxRatio: 100 });
    expect(r.aborted).toBe(false);
    expect(r.fractionExtracted).toBe(1);
  });
});

describe('formatting', () => {
  test('fmtBytes scales to petabytes', () => {
    expect(fmtBytes(42 * 1024)).toBe('42 KB');
    expect(fmtBytes(4.5 * 1024 ** 5)).toMatch(/PB$/);
    expect(fmtBytes(0)).toBe('0 B');
  });

  test('fmtRatio groups digits', () => {
    expect(fmtRatio(28_000_000)).toBe('28,000,000:1');
  });
});
