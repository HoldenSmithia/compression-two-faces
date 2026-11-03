/**
 * The *other* face of compression: decompression bombs ("zip bombs"). A tiny
 * compressed file that expands into a huge one, exhausting memory or disk —
 * an algorithmic-complexity (AC-space) denial of service.
 *
 * This module is ONLY arithmetic and the facts needed to explain the idea and
 * its defenses. It does NOT build a zip file, and there is nothing here that
 * produces or helps produce a malicious archive. It is the math on a slide,
 * made interactive, next to the mitigations that stop it.
 *
 * Sources / figures:
 *   "42.zip": 42 KB -> 4.5 PB via 5 nested layers of 16, each leaf 4.3 GB
 *     (widely documented; see e.g. the module slides and unforgettable.dk).
 *   David Fifield, "A better zip bomb," USENIX WOOT 2019 — a *non-recursive*
 *     bomb that expands in one pass, ratio > 28 million:1
 *     (~10 MB -> 281 TB, ~46 MB -> 4.5 PB with Zip64).
 *     https://www.usenix.org/conference/woot19/presentation/fifield
 *   DEFLATE's practical per-stream ceiling is about 1032:1.
 *   Weakness class: CWE-409, Improper Handling of Highly Compressed Data.
 *     https://cwe.mitre.org/data/definitions/409.html
 */

/** DEFLATE compresses a single stream of repeated bytes by at most ~1032:1. */
export const DEFLATE_RATIO = 1032;

export interface BombModel {
  /** Compressed size on disk, in bytes. */
  packed: number;
  /** Total size after a full decompression, in bytes. */
  unpacked: number;
  /** unpacked / packed. */
  ratio: number;
}

/**
 * A classic *nested* (recursive) bomb like 42.zip: `layers` levels, each archive
 * holding `fanout` copies of the next level, with a single highly-compressible
 * leaf file of `leafBytes` at the bottom.
 *
 * Unpacked total (if something fully extracts every layer):
 *   fanout^layers * leafBytes
 * Packed size is roughly the leaf's compressed size times a small container
 * overhead per layer — approximated here for the meter, not to the byte.
 */
export function nestedBomb(
  layers: number,
  fanout: number,
  leafBytes: number,
): BombModel {
  const unpacked = Math.pow(fanout, layers) * leafBytes;
  // Leaf compresses near the DEFLATE ceiling; nesting re-compresses already
  // compressed data, so outer layers barely shrink. Model the packed size as
  // the leaf's packed size plus tiny per-copy directory overhead.
  const leafPacked = leafBytes / DEFLATE_RATIO;
  const overheadPerEntry = 64; // bytes of zip directory metadata, approx.
  let packed = leafPacked;
  for (let l = 0; l < layers; l++) packed += overheadPerEntry * fanout;
  const ratio = unpacked / packed;
  return { packed, unpacked, ratio };
}

/**
 * Fifield's *non-recursive* bomb (WOOT '19). Many file headers in one archive
 * all point into a single shared, overlapping compressed "kernel", so output
 * grows with the square of input and blows past the 1032:1 per-stream limit in
 * a single decompression pass.
 *
 * We model only the published behavior: output scales quadratically with the
 * packed size, anchored to the paper's data point (~42 KB packed -> ~5.4 GB,
 * scaling up to the headline 28-million:1 at format limits).
 */
export function overlapBomb(packedBytes: number): BombModel {
  // Anchor: the paper's smallest example is ~42 KB -> ~5.5 GB (~130k:1), and the
  // ratio climbs with size toward ~28e6 at ~10 MB. Model ratio as proportional
  // to packed size (quadratic output) and clamp to the reported maximum.
  const anchorPacked = 42 * 1024;
  const anchorRatio = 130000;
  const ratio = Math.min(28_000_000, (anchorRatio * packedBytes) / anchorPacked);
  const unpacked = packedBytes * ratio;
  return { packed: packedBytes, unpacked, ratio };
}

/** The two canonical real-world examples, for the explainer cards. */
export const KNOWN_BOMBS = {
  fortyTwoZip: {
    name: '42.zip',
    packed: 42 * 1024,
    unpacked: 4.5 * Math.pow(1024, 5), // 4.5 PB
    layers: 5,
    fanout: 16,
    note: 'Five nested layers of 16 archives; each leaf is a 4.3 GB file.',
  },
  fifield: {
    name: 'Fifield non-recursive',
    packed: 10 * 1024 * 1024,
    unpacked: 281 * Math.pow(1024, 4), // 281 TB
    ratio: 28_000_000,
    note: 'Expands fully in one pass; ratio over 28 million to 1 (WOOT 2019).',
  },
} as const;

// ----- Defense: a guarded extractor -----------------------------------------

export interface GuardConfig {
  /** Stop once this many output bytes have been written. */
  maxOutputBytes: number;
  /** Stop if observed output/input ratio exceeds this. */
  maxRatio: number;
}

export interface GuardResult {
  aborted: boolean;
  reason: string;
  bytesWritten: number;
  /** Fraction of the bomb's output that escaped before the guard tripped. */
  fractionExtracted: number;
}

/**
 * Simulate a *streaming* extractor that enforces limits — the real defense from
 * the slides and CWE-409: cap total output, cap the expansion ratio, and stop
 * early instead of trusting the header's declared sizes.
 *
 * It "extracts" in chunks and checks the running totals, so it trips long before
 * the full bomb lands. No actual decompression happens; we just walk the math.
 */
export function guardedExtract(bomb: BombModel, cfg: GuardConfig): GuardResult {
  const chunk = Math.max(1, Math.floor(bomb.unpacked / 1000));
  let written = 0;
  while (written < bomb.unpacked) {
    written = Math.min(bomb.unpacked, written + chunk);
    if (written > cfg.maxOutputBytes) {
      return abort(`output exceeded the ${fmtBytes(cfg.maxOutputBytes)} cap`, cfg.maxOutputBytes, bomb);
    }
    const observedRatio = written / bomb.packed;
    if (observedRatio > cfg.maxRatio) {
      return abort(`expansion ratio passed ${cfg.maxRatio.toLocaleString()}:1`, written, bomb);
    }
  }
  return {
    aborted: false,
    reason: 'extraction finished within limits',
    bytesWritten: written,
    fractionExtracted: 1,
  };
}

function abort(reason: string, written: number, bomb: BombModel): GuardResult {
  return {
    aborted: true,
    reason,
    bytesWritten: written,
    fractionExtracted: bomb.unpacked === 0 ? 0 : written / bomb.unpacked,
  };
}

// ----- Formatting helpers ---------------------------------------------------

const UNITS = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB'];

/** Human-readable byte size, e.g. 4.5 PB. Handles the astronomical cases. */
export function fmtBytes(n: number): string {
  if (n < 1) return '0 B';
  const i = Math.min(UNITS.length - 1, Math.floor(Math.log(n) / Math.log(1024)));
  const v = n / Math.pow(1024, i);
  const digits = v >= 100 || i === 0 || Number.isInteger(v) ? 0 : 1;
  return `${v.toFixed(digits)} ${UNITS[i]}`;
}

/** Compact ratio label, e.g. "28,000,000:1". */
export function fmtRatio(r: number): string {
  return `${Math.round(r).toLocaleString()}:1`;
}
