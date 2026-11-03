<!-- DRAFT written from the build session. Rewrite it in your own words and fill in the [bracketed] parts before submitting. -->

# Reflection

## What I built

For Module 5 I built an interactive site about the **two faces of compression**. The same algorithm (LZ77 / DEFLATE) that makes files smaller causes two very different attacks: the **CRIME/BREACH** compression-oracle side channel, where the *size* of compressed output leaks a secret, and **zip bombs**, where a tiny file expands into petabytes. I picked this because it connects both halves of the module — side channels *and* algorithmic complexity — through one idea: compressed size depends on content.

## How it deepened my understanding

The CRIME lab is what made it click for me. In class, "compression leaks information" sounded abstract. Building a lab where I actually recover a secret by always picking the character that compresses smallest made the mechanism concrete: when my guessed text matches the hidden cookie, LZ77 merges the two copies into one back-reference and the size drops by one. I never decrypt anything — I read the answer off the *lengths*. Writing the model also taught me why the real attacks need padding and the "two-tries" trick: my greedy version fails when two characters tie on size, which I turned into one of the unit tests.

The zip-bomb side reframed "denial of service" for me. I had thought of DoS as flooding with traffic, but a decompression bomb is the opposite — one small, cheap request that does disproportionate damage (the asymmetric effort-vs-effect idea from the slides). Modeling 42.zip (42 KB → 4.5 PB) and David Fifield's non-recursive bomb (over 28,000,000:1) next to a *guarded extractor* showed me the real lesson: you can't reliably "detect" a bomb, so the defense is to never trust a declared size and to cap output and ratio.

The defenses stage tied both together. CRIME and zip bombs have the same root, so the fixes rhyme: break the correlation between the secret and the observable (disable compression, separate the secret, randomize/mask), or refuse to do unbounded work on untrusted input. [Add one sentence about which part surprised you most.]

## Workflow

1. **Research first, with citations.** I read about each attack and pinned down primary sources — Kelsey (FSE 2002), CRIME (CVE-2012-4929), BREACH (Black Hat 2013), Fifield (USENIX WOOT 2019), the LZ77 paper, RFC 7541, and CWE-409 — so the timeline and claims are backed by real references, not just the slides.
2. **Model first, UI second.** All the logic lives in three small files (`src/sim/lz77.ts`, `crime.ts`, `bombs.ts`) with unit tests that check the page's claims *before* any UI existed — e.g. the correct guess is always among the smallest probes, and the guarded extractor aborts a 42.zip-scale bomb after a sliver of output. Testing the logic first caught a tie-handling issue early.
3. **Safe by construction.** I kept it a pure simulation: a random in-browser secret, a toy compressor, and bomb *math* only — the page never generates an archive or touches a real server. [Note anything you double-checked here.]
4. **AI-assisted development.** I used Claude Code to scaffold the Vite + React + TypeScript project and write the components, describing the labs and interactivity I wanted. I verified the result by running the test suite (all passing) and a strict type-checked production build.
5. **Review.** I went through each lab and checked it against the sources — especially the dates and ratios in the timeline and the 42.zip / Fifield figures. [Describe anything you changed or pushed back on.]

## Takeaway

A feature and a vulnerability can be the same line of code seen from two directions. Compression is useful *because* output size depends on content — and that exact property is what leaks secrets and what lets a bomb explode. Good defenses don't fight the feature; they cut the link between what an attacker can observe (or submit) and the work the system is willing to do.
