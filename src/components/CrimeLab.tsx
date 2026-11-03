import { useMemo, useState } from 'react';
import { GUESS_ALPHABET, makeSecret, MARKER, probeNext, type Probe } from '../sim/crime';
import { Bar, Callout, Section } from './ui';

export function CrimeLab() {
  const [secret, setSecret] = useState(() => makeSecret(6));
  const [known, setKnown] = useState('');
  const [queries, setQueries] = useState(0);
  const [reveal, setReveal] = useState(false);
  const [autoRunning, setAutoRunning] = useState(false);

  const done = known.length >= secret.length;
  const probes = useMemo<Probe[]>(
    () => (done ? [] : probeNext(secret, known)),
    [secret, known, done],
  );
  const sizes = probes.map((p) => p.size);
  const maxSize = Math.max(1, ...sizes);
  const minSize = Math.min(...sizes, Infinity);

  function pick(char: string) {
    if (done) return;
    setKnown((k) => k + char);
    setQueries((q) => q + GUESS_ALPHABET.length);
  }

  function pickSmallest() {
    if (done || probes.length === 0) return;
    const best = probes.reduce((a, b) => (b.size < a.size ? b : a));
    pick(best.char);
  }

  async function autoSolve() {
    if (autoRunning) return;
    setAutoRunning(true);
    let k = known;
    let q = queries;
    while (k.length < secret.length) {
      const batch = probeNext(secret, k);
      const best = batch.reduce((a, b) => (b.size < a.size ? b : a));
      k += best.char;
      q += GUESS_ALPHABET.length;
      setKnown(k);
      setQueries(q);
      await sleep(260);
    }
    setAutoRunning(false);
  }

  function newSecret() {
    setSecret(makeSecret(6));
    setKnown('');
    setQueries(0);
    setAutoRunning(false);
  }

  function restart() {
    setKnown('');
    setQueries(0);
    setAutoRunning(false);
  }

  const recoveredRight = done && known === secret;
  const maskedSecret = reveal ? secret : maskSecret(secret, known);
  const previewGuess = known + (done ? '' : '▮');

  return (
    <Section
      id="crime"
      kicker="Attack 1 · the quiet one"
      title={
        <>
          CRIME: the <span className="accent">size</span> of ciphertext leaks its contents
        </>
      }
    >
      <div className="prose">
        <p>
          Here’s the unsettling part. Encryption hides <em>what</em> the bytes are, but not{' '}
          <em>how many</em> there are. If a server compresses the attacker’s input and a secret{' '}
          <strong>together</strong>, then sends it encrypted, a correct guess makes the whole thing compress a little
          smaller — because the guess now matches the secret and the two collapse into one back-reference.
        </p>
        <p>
          <strong>You are the attacker.</strong> You can’t read the cookie, but you can measure the compressed size of
          each request. Find the character that makes it <b>smallest</b>. Do it six times and the secret is yours — a
          password you never saw.
        </p>
      </div>

      <div className="lab crime-lab">
        <div className="server-panel">
          <div className="panel-title">
            <span>What the server compresses &amp; encrypts each request</span>
            <label className="toggle small">
              <input type="checkbox" checked={reveal} onChange={(e) => setReveal(e.target.checked)} />
              <span className="toggle-track" />
              Teacher view
            </label>
          </div>
          <pre className="buffer">
            <span className="buf-dim">GET /?q={MARKER}</span>
            <span className="buf-guess">{previewGuess}</span>
            <span className="buf-dim"> HTTP/1.1{'\n'}Cookie: {MARKER}</span>
            <span className={reveal ? 'buf-secret-shown' : 'buf-secret'}>{maskedSecret}</span>
            <span className="buf-dim">{'\n'}</span>
          </pre>
          <p className="buffer-note">
            🔒 You only ever learn the <b>compressed length</b> of this (the box lengths below). The cookie stays
            hidden{reveal ? ' — except you flipped on teacher view' : ''}.
          </p>
        </div>

        {!done && (
          <>
            <div className="attack-head">
              <span>
                Recovered so far: <code className="recovered">{known || '∅'}</code>
              </span>
              <span className="muted">
                Pick the character with the <b>shortest</b> bar — that’s the leak.
              </span>
            </div>

            <div className="probe-grid">
              {probes.map((p) => (
                <button
                  key={p.char}
                  className={`probe ${p.best ? 'probe-best' : ''}`}
                  onClick={() => pick(p.char)}
                  disabled={autoRunning}
                >
                  <span className="probe-char">{p.char}</span>
                  <Bar
                    frac={(p.size - (minSize - 1)) / (maxSize - (minSize - 1))}
                    tone={p.best ? 'green' : 'blue'}
                    highlight={p.best}
                  />
                  <span className="probe-size">{p.size}</span>
                </button>
              ))}
            </div>

            <div className="toolbar">
              <button className="btn btn-primary" onClick={pickSmallest} disabled={autoRunning}>
                ⬇ Take the smallest
              </button>
              <button className="btn" onClick={autoSolve} disabled={autoRunning}>
                {autoRunning ? '⏳ Leaking…' : '⚡ Auto-solve'}
              </button>
              <button className="btn btn-ghost" onClick={restart} disabled={autoRunning || !known}>
                Restart this secret
              </button>
              <span className="query-count">queries: {queries}</span>
            </div>
          </>
        )}

        {done && (
          <div className="result-panel">
            {recoveredRight ? (
              <Callout tone="win">
                <b>Recovered the secret: <code className="recovered big">{known}</code></b>
                <br />
                You never decrypted anything. You guessed {queries} times and read the answer off the{' '}
                <em>sizes</em>. That’s a compression oracle.
              </Callout>
            ) : (
              <Callout tone="warn">
                Greedy guessing landed on <code className="recovered">{known}</code>, but the secret was{' '}
                <code className="recovered">{secret}</code>. A size <b>tie</b> threw it off — which is exactly why the
                real attacks add padding and the “two-tries” trick. Try a new secret.
              </Callout>
            )}
            <div className="toolbar">
              <button className="btn btn-primary" onClick={newSecret}>
                🎲 New secret
              </button>
              <span className="query-count">queries: {queries}</span>
            </div>
          </div>
        )}

        {!done && (
          <div className="toolbar end">
            <button className="btn btn-ghost" onClick={newSecret} disabled={autoRunning}>
              🎲 New secret
            </button>
          </div>
        )}
      </div>

      <Callout tone="info">
        This is real history. <b>CRIME</b> (Rizzo &amp; Duong, 2012) broke TLS/SPDY compression this way;{' '}
        <b>BREACH</b> (Gluck, Harris &amp; Prado, 2013) did it to compressed HTTP <em>responses</em>, so it works even
        with TLS compression off. Both trace back to John Kelsey’s 2002 observation that{' '}
        <q>compression leaks information about the plaintext in the size of the output.</q> We’ll disarm it in
        Stage&nbsp;4.
      </Callout>
    </Section>
  );
}

function maskSecret(secret: string, known: string): string {
  return secret
    .split('')
    .map((c, i) => (i < known.length ? c : '•'))
    .join('');
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}
