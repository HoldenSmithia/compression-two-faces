import { describe, expect, test } from 'vitest';
import { compress, compressedSize, MAX_MATCH, ratio } from './lz77';

describe('toy LZ77', () => {
  test('a run of identical characters collapses to about one back-reference', () => {
    const r = compress('a'.repeat(100));
    // One literal to seed the run, then a single overlapping back-reference.
    expect(r.tokens.filter((t) => t.dist !== undefined).length).toBeLessThanOrEqual(2);
    expect(r.size).toBeLessThan(10);
    expect(ratio(r)).toBeGreaterThan(10);
  });

  test('random-looking text barely compresses', () => {
    const r = compress('q7-Zx!92@Lp#');
    // Nothing repeats, so (almost) every character is a literal.
    expect(r.size).toBeGreaterThanOrEqual(r.rawSize - 1);
  });

  test('repetition lowers the compressed size', () => {
    const unique = compressedSize('abcdefghij');
    const repeated = compressedSize('abcabcabca');
    expect(repeated).toBeLessThan(unique);
  });

  test('a back-reference never encodes more than MAX_MATCH characters', () => {
    const r = compress('x'.repeat(1000));
    for (const t of r.tokens) {
      if (t.len !== undefined) expect(t.len).toBeLessThanOrEqual(MAX_MATCH);
    }
  });
});
