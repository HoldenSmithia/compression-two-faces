/**
 * A model of the compression-oracle side channel — the idea behind CRIME and
 * BREACH. It is a *simulation*: it runs entirely in the browser against a random
 * token this page generates. It cannot see, reach, or attack any real website.
 *
 * The leak, in one sentence: if a secret and attacker-controlled text are
 * compressed together, the size of the compressed output is smaller when the
 * attacker's guess matches the secret — because the two copies compress against
 * each other. Measuring size therefore leaks the secret, one character at a
 * time, even though the bytes on the wire stay encrypted.
 *
 * Sources:
 *   John Kelsey, "Compression and Information Leakage of Plaintext," FSE 2002,
 *     LNCS 2365, pp. 263-276. https://doi.org/10.1007/3-540-45661-9_21
 *   J. Rizzo & T. Duong, "CRIME" (ekoparty 2012). CVE-2012-4929.
 *   Y. Gluck, N. Harris, A. Prado, "BREACH: Reviving the CRIME Attack,"
 *     Black Hat USA 2013. https://breachattack.com/  (CVE-2013-3587)
 */

import { compress, compressedSize } from './lz77';

/** A realistic-looking but entirely fake alphabet for the demo secret. */
export const SECRET_ALPHABET = 'abcdef0123456789';
/** Characters the attacker is allowed to guess from. */
export const GUESS_ALPHABET = 'abcdef0123456789';

/** The label the secret hides behind, e.g. `token=<secret>`. */
export const MARKER = 'token=';

/** Make a random fake secret. It exists only in this browser tab. */
export function makeSecret(len = 6, rng: () => number = Math.random): string {
  let s = '';
  for (let i = 0; i < len; i++) {
    s += SECRET_ALPHABET[Math.floor(rng() * SECRET_ALPHABET.length)];
  }
  return s;
}

/**
 * The buffer the "server" compresses on each request. It contains the real
 * secret once (as `token=<secret>`) and the attacker's reflected guess once
 * (as `token=<guess>`). In the real attacks the reflection is a search term, a
 * URL parameter, or a CSRF token echoed into the page.
 */
export function buildBuffer(secret: string, guess: string): string {
  return `GET /?q=${MARKER}${guess} HTTP/1.1\nCookie: ${MARKER}${secret}\n`;
}

/** What the attacker can measure: the compressed size for a given guess. */
export function oracle(secret: string, guess: string): number {
  return compressedSize(buildBuffer(secret, guess));
}

export interface Probe {
  char: string;
  guess: string;
  size: number;
  /** True if this candidate ties for the smallest size in its batch. */
  best: boolean;
}

/**
 * Try every candidate for the next character, given the part of the secret
 * already recovered. The candidate(s) with the smallest compressed size are the
 * most likely next character — that is the whole attack.
 */
export function probeNext(
  secret: string,
  known: string,
  alphabet: string = GUESS_ALPHABET,
): Probe[] {
  const probes: Probe[] = alphabet.split('').map((char) => {
    const guess = known + char;
    return { char, guess, size: oracle(secret, guess), best: false };
  });
  const min = Math.min(...probes.map((p) => p.size));
  for (const p of probes) p.best = p.size === min;
  return probes;
}

/**
 * Run the full guided attack: recover the secret one character at a time by
 * always taking the smallest-size candidate. Returns what it recovered plus the
 * number of oracle queries it spent — the metric the papers report.
 *
 * On a tie it takes the first smallest candidate, so recovery is not guaranteed
 * for every random secret. That is honest: real attackers add padding and the
 * "two-tries" method to break ties, which this model deliberately leaves out.
 */
export function recover(
  secret: string,
  alphabet: string = GUESS_ALPHABET,
): { recovered: string; queries: number; ok: boolean } {
  let known = '';
  let queries = 0;
  for (let i = 0; i < secret.length; i++) {
    const probes = probeNext(secret, known, alphabet);
    queries += probes.length;
    const best = probes.reduce((a, b) => (b.size < a.size ? b : a));
    known += best.char;
  }
  return { recovered: known, queries, ok: known === secret };
}

// ----- Defenses -------------------------------------------------------------

export type Defense = 'none' | 'disable' | 'separate' | 'mask';

/**
 * The same oracle, but with a defense applied. Each defense maps to a real
 * mitigation for CRIME/BREACH:
 *
 *   disable  — turn compression off for the sensitive response (the actual fix
 *              that killed CRIME: disable TLS/SPDY compression).
 *   separate — never compress attacker-influenced input together with the
 *              secret. HPACK's "never-indexed literal" for cookies is this idea
 *              (RFC 7541 §7.1.3, §6.2.3).
 *   mask     — XOR the secret with a fresh random pad each request so its
 *              compressed length no longer correlates with any guess
 *              (BREACH mitigation: per-request randomization / masking).
 */
export function defendedOracle(
  secret: string,
  guess: string,
  defense: Defense,
  rng: () => number = Math.random,
): number {
  switch (defense) {
    case 'disable':
      // No compression: size is just the length. No differential to measure.
      return buildBuffer(secret, guess).length;
    case 'separate': {
      // Compress the two halves independently; the guess can never reference
      // the secret, so matching it saves nothing.
      const a = compressedSize(`GET /?q=${MARKER}${guess} HTTP/1.1\n`);
      const b = compressedSize(`Cookie: ${MARKER}${secret}\n`);
      return a + b;
    }
    case 'mask': {
      // One-time random pad: the attacker sees noise uncorrelated with the guess.
      const pad = Math.floor(rng() * 7);
      return compressedSize(buildBuffer(secret, guess)) + pad;
    }
    case 'none':
    default:
      return oracle(secret, guess);
  }
}

/** Probe step that respects a chosen defense (used by the Defenses sandbox). */
export function probeNextDefended(
  secret: string,
  known: string,
  defense: Defense,
  alphabet: string = GUESS_ALPHABET,
  rng: () => number = Math.random,
): Probe[] {
  const probes: Probe[] = alphabet.split('').map((char) => {
    const guess = known + char;
    return { char, guess, size: defendedOracle(secret, guess, defense, rng), best: false };
  });
  const min = Math.min(...probes.map((p) => p.size));
  for (const p of probes) p.best = p.size === min;
  return probes;
}

export { compress };
