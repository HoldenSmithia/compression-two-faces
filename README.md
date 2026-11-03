# The Two Faces of Compression

An interactive teaching module for **CprE/SE 4210, Module 5 (Algorithmic Complexity & Side-Channel Attacks)**. It's a static React + TypeScript web app about the double-edged nature of data compression:

- **CRIME / BREACH** — a *compression-oracle side channel*. When a secret and attacker-controlled text are compressed together, the **size** of the output leaks the secret, one character at a time, even under encryption.
- **Zip bombs** — a *decompression bomb* (algorithmic-complexity attack on space, [CWE-409](https://cwe.mitre.org/data/definitions/409.html)). A few kilobytes expand into petabytes and exhaust memory or disk.

Both come from the same fact — *the size of compressed output depends on its content* — so the same page can attack with it and then defend against it.

> **This is a safe simulation.** Everything runs only in your browser. The "secret" is a random token the page invents; no real website is ever touched, and **no archive file is produced or downloadable**. The "compressor" is a small, readable TypeScript model of LZ77, not a real codec. Nothing here is an attack tool.

## What's inside

| Section | Concept | What you can do |
|---|---|---|
| **1 · Warm-up: LZ77** | Compression replaces repeated text with back-references; output size tracks repetition. | Type any text and watch it tokenize into literals and back-references in real time. Compare random junk (no shrink) with a long run (collapses to one reference). |
| **2 · CRIME** | A compression oracle: a correct guess makes the combined message compress smaller. | **You play the attacker.** You can't read the cookie, only measure compressed size. Pick the shortest-size character six times to recover a secret you never saw — or hit **Auto-solve** and watch it leak. |
| **3 · Zip bombs** | Tiny input, astronomical output. | Sliders for a nested bomb (42.zip style: layers × fan-out × leaf size) and for Fifield's non-recursive bomb. Watch the expansion ratio climb on a log-scale meter, next to the two real-world examples. |
| **4 · Fighting back** | Break the link between the secret and the observable; refuse unbounded work. | Toggle CRIME defenses (disable compression / separate the secret / random masking) and watch the leak flatten to nothing. Set output and ratio caps on a guarded extractor and watch a 42.zip-scale bomb abort early. |
| **Then & now** | Real history. | A clickable timeline: LZ77 (1977), Kelsey (2002), CRIME (2012), BREACH/TIME (2013), HPACK (2015), HEIST (2016), Fifield (2019). |
| **Quiz** | Review | Five questions with explanations. |

## Run it locally

Requires Node 18+.

```bash
npm install
npm run dev        # http://localhost:5173
npm test           # unit tests for the LZ77, CRIME-oracle and bomb models
npm run build      # static site in dist/
```

## How the simulation works

All the logic lives in three small, tested files in [`src/sim/`](src/sim/):

- [`lz77.ts`](src/sim/lz77.ts) — a greedy longest-match LZ77 model. It keeps the one property that matters: **output size depends on how much the input repeats.** A back-reference is a fixed small cost no matter how many characters it copies, which is why a long run collapses to almost nothing.
- [`crime.ts`](src/sim/crime.ts) — the compression oracle. `oracle(secret, guess)` compresses the attacker's reflected guess and the secret in one buffer and returns the size. `probeNext()` tries every candidate for the next character; the smallest size wins. `defendedOracle()` applies each real mitigation.
- [`bombs.ts`](src/sim/bombs.ts) — **arithmetic only.** `nestedBomb()` and `overlapBomb()` compute packed/unpacked sizes and ratios; `guardedExtract()` simulates a streaming extractor that enforces output/ratio limits and aborts early. It never builds a file.

The tests in [`src/sim/*.test.ts`](src/sim/) check the claims the page makes — e.g. the correct guess is always among the smallest-size probes, greedy recovery wins for most random secrets (and honestly fails on ties, which is *why* real attacks add padding), the nested bomb matches the 42.zip shape, and the guarded extractor aborts a bomb after a sliver of output.

## Project structure

```
src/
  sim/          lz77.ts, crime.ts, bombs.ts + tests
  components/   Hero, LZ77Lab, CrimeLab, BombLab, Defenses, Timeline, Quiz, ui
  App.tsx       page layout
  styles.css    terminal / CRT theme (plain CSS, no UI libraries)
```

## Deploying

`dist/` is a fully static site and `vite.config.ts` uses a relative `base`, so it serves from any path. A GitHub Actions workflow ([`.github/workflows/deploy.yml`](.github/workflows/deploy.yml)) tests, builds and publishes to **GitHub Pages** on every push to `main` (Settings → Pages → Source: GitHub Actions).

## References

- John Kelsey, "Compression and Information Leakage of Plaintext," *FSE 2002*, LNCS 2365, pp. 263–276. [doi:10.1007/3-540-45661-9_21](https://doi.org/10.1007/3-540-45661-9_21)
- Juliano Rizzo & Thai Duong, **CRIME**, ekoparty 2012. [CVE-2012-4929](https://nvd.nist.gov/vuln/detail/CVE-2012-4929) · [overview](https://en.wikipedia.org/wiki/CRIME)
- Yoel Gluck, Neal Harris & Angelo Prado, "BREACH: Reviving the CRIME Attack," *Black Hat USA 2013*. [breachattack.com](https://breachattack.com/) · [CVE-2013-3587](https://nvd.nist.gov/vuln/detail/CVE-2013-3587)
- Mathy Vanhoef & Tom Van Goethem, **HEIST**, *Black Hat USA 2016*. [CVE-2016-7152](https://nvd.nist.gov/vuln/detail/CVE-2016-7152)
- David Fifield, "A better zip bomb," *USENIX WOOT 2019*. [usenix.org](https://www.usenix.org/conference/woot19/presentation/fifield)
- Jacob Ziv & Abraham Lempel, "A Universal Algorithm for Sequential Data Compression," *IEEE Trans. Information Theory* 23(3), 1977. [doi:10.1109/TIT.1977.1055714](https://doi.org/10.1109/TIT.1977.1055714)
- R. Peon & H. Ruellan, "HPACK: Header Compression for HTTP/2," [RFC 7541](https://www.rfc-editor.org/rfc/rfc7541) (see §7.1 security considerations).
- MITRE, [CWE-409: Improper Handling of Highly Compressed Data (Data Amplification)](https://cwe.mitre.org/data/definitions/409.html).

## Use of AI

This app was built with help from an AI coding assistant (Claude Code). See [`reflection.md`](reflection.md) for the workflow.
