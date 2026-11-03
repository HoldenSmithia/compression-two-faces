import { describe, expect, test } from 'vitest';
import {
  defendedOracle,
  makeSecret,
  oracle,
  probeNext,
  probeNextDefended,
  recover,
} from './crime';

describe('compression-oracle model', () => {
  test('the correct guess compresses at least as small as any wrong guess', () => {
    const secret = 'cafe42';
    const correct = oracle(secret, 'c');
    for (const wrong of ['a', 'b', 'd', '9', '0']) {
      expect(correct).toBeLessThanOrEqual(oracle(secret, wrong));
    }
  });

  test('the next correct character is always among the smallest-size probes', () => {
    const secret = 'cafe42';
    let known = '';
    for (let i = 0; i < secret.length; i++) {
      const probes = probeNext(secret, known);
      const next = secret[i];
      const hit = probes.find((p) => p.char === next);
      expect(hit?.best).toBe(true);
      known += next;
    }
  });

  test('the guided attack recovers a chosen secret', () => {
    const result = recover('cafe42');
    expect(result.ok).toBe(true);
    expect(result.recovered).toBe('cafe42');
    expect(result.queries).toBe(6 * 16); // 6 chars x 16-symbol alphabet
  });

  test('makeSecret is deterministic under a seeded RNG', () => {
    // A small linear-congruential generator, re-seeded identically each time.
    const seeded = () => {
      let n = 42;
      return () => (n = (n * 1664525 + 1013904223) % 2 ** 32) / 2 ** 32;
    };
    expect(makeSecret(6, seeded())).toBe(makeSecret(6, seeded()));
  });

  test('recovery succeeds for the large majority of random secrets', () => {
    // Honest about the model's limit: greedy recovery can stall on ties, exactly
    // why real attacks add padding. It should still win most of the time.
    let wins = 0;
    const trials = 60;
    for (let i = 0; i < trials; i++) {
      const secret = makeSecret(6);
      if (recover(secret).ok) wins++;
    }
    expect(wins / trials).toBeGreaterThan(0.6);
  });
});

describe('defenses', () => {
  const secret = 'cafe42';

  test('disabling compression removes the differential', () => {
    const sizes = 'abcdef0123456789'
      .split('')
      .map((c) => defendedOracle(secret, c, 'disable'));
    expect(new Set(sizes).size).toBe(1); // every guess looks identical
  });

  test('separating attacker input from the secret removes the differential', () => {
    const sizes = 'abcdef0123456789'
      .split('')
      .map((c) => defendedOracle(secret, c, 'separate'));
    expect(new Set(sizes).size).toBe(1);
  });

  test('a defended probe no longer uniquely fingers the correct character', () => {
    // With compression disabled, the "best" set is the whole alphabet (a tie),
    // so the attacker learns nothing.
    const probes = probeNextDefended(secret, '', 'disable');
    expect(probes.every((p) => p.best)).toBe(true);
  });
});
