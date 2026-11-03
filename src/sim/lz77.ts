/**
 * A tiny, readable model of LZ77 — the 1977 sliding-window algorithm that sits
 * underneath DEFLATE (zip, gzip, zlib, PNG, HTTP compression).
 *
 *   Jacob Ziv & Abraham Lempel, "A Universal Algorithm for Sequential Data
 *   Compression," IEEE Trans. Information Theory 23(3), 1977, pp. 337-343.
 *   https://doi.org/10.1109/TIT.1977.1055714
 *
 * This is NOT a real compressor. It keeps the one property that makes the whole
 * module make sense: the size of the output depends on how much the input
 * repeats itself. That single fact is what powers compression-oracle attacks
 * (see crime.ts) and decompression bombs (see bombs.ts).
 *
 * Everything here runs in the browser on text the learner typed, or on a random
 * token this page made up. Nothing is sent anywhere.
 */

export interface Token {
  /** A single uncompressed character. */
  literal?: string;
  /** Back-reference: copy `len` chars from `dist` positions earlier. */
  dist?: number;
  len?: number;
}

export interface CompressResult {
  tokens: Token[];
  /** Modeled compressed size, in "symbols". */
  size: number;
  /** Original length, for ratio display. */
  rawSize: number;
  input: string;
}

/** DEFLATE only emits a back-reference when it saves space: 3 chars or more. */
export const MIN_MATCH = 3;
/** Longest run DEFLATE can encode in one back-reference. */
export const MAX_MATCH = 258;

// Costs are a deliberate simplification of DEFLATE's Huffman-coded output.
// A literal costs one symbol; a back-reference costs two (a distance and a
// length). The exact numbers do not matter — only that a back-reference is a
// fixed, small cost no matter how many characters it copies. That is why a long
// repeated run collapses to almost nothing.
export const LITERAL_COST = 1;
export const REF_COST = 2;

/**
 * Greedy longest-match LZ77 over a sliding window.
 *
 * Matches are allowed to overlap the current position (run-length style): a
 * thousand identical bytes become one back-reference of length ~1000. This is
 * real DEFLATE behavior and it is exactly how a few bytes can inflate into
 * gigabytes.
 */
export function compress(input: string, windowSize = 32768): CompressResult {
  const tokens: Token[] = [];
  let i = 0;

  while (i < input.length) {
    let bestLen = 0;
    let bestDist = 0;
    const start = Math.max(0, i - windowSize);

    for (let j = start; j < i; j++) {
      let len = 0;
      while (
        i + len < input.length &&
        len < MAX_MATCH &&
        input[j + len] === input[i + len]
      ) {
        len++;
      }
      if (len > bestLen) {
        bestLen = len;
        bestDist = i - j;
      }
    }

    if (bestLen >= MIN_MATCH) {
      tokens.push({ dist: bestDist, len: bestLen });
      i += bestLen;
    } else {
      tokens.push({ literal: input[i] });
      i += 1;
    }
  }

  const size = tokens.reduce(
    (s, t) => s + (t.literal !== undefined ? LITERAL_COST : REF_COST),
    0,
  );
  return { tokens, size, rawSize: input.length, input };
}

/** Just the modeled compressed size — the number an attacker gets to see. */
export function compressedSize(input: string): number {
  return compress(input).size;
}

/** Compression ratio (raw / compressed), guarding against divide-by-zero. */
export function ratio(result: CompressResult): number {
  return result.size === 0 ? 0 : result.rawSize / result.size;
}
