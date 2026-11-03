import { useEffect, useState } from 'react';

const LINES = [
  '$ echo "compression makes things smaller."',
  'compression makes things smaller.',
  '$ # so how does it leak your cookies...',
  '$ # ...and blow up a server with 42 KB?',
  '$ ls -la bomb.zip',
  '-rw-r--r--  1 attacker  staff   42K  bomb.zip',
  '$ unzip -l bomb.zip | tail -1',
  '  4,503,599,627,370,496 bytes  (4.5 PB)',
];

export function Hero() {
  const [shown, setShown] = useState(0);
  const [chars, setChars] = useState(0);

  useEffect(() => {
    if (shown >= LINES.length) return;
    const line = LINES[shown];
    const t = setTimeout(
      () => {
        if (chars < line.length) setChars((c) => c + 1);
        else {
          setShown((s) => s + 1);
          setChars(0);
        }
      },
      chars < line.length ? 22 : 520,
    );
    return () => clearTimeout(t);
  }, [shown, chars]);

  return (
    <header className="hero">
      <div className="hero-copy">
        <p className="eyebrow">CprE / SE 4210 · Module 5 · Algorithmic Complexity &amp; Side Channels</p>
        <h1>
          The Two Faces of <span className="glitch" data-text="Compression">Compression</span>
        </h1>
        <p className="lede">
          The same trick that shrinks your downloads has a dark side. Squeeze two things together and the
          <em> size</em> of the result can leak a secret — that's <strong>CRIME</strong>. Squeeze a mountain of
          repetition into a few kilobytes and you get a <strong>zip bomb</strong> that can flatten a server.
          Play with both below, then watch the defenses shut them down.
        </p>
        <nav className="stage-nav">
          <a href="#lz77">
            <b>1</b> How compression sees repetition
          </a>
          <a href="#crime">
            <b>2</b> CRIME: size leaks secrets
          </a>
          <a href="#bomb">
            <b>3</b> Zip bombs: tiny in, huge out
          </a>
          <a href="#defenses">
            <b>4</b> Shutting it down
          </a>
        </nav>
        <p className="safe-note">
          🛡️ Everything here is a <strong>simulation that runs only in your browser</strong>. The “secret” is a random
          token this page invents; no real website is touched, and no archive file is produced. It’s a teaching model,
          not an attack tool.
        </p>
      </div>
      <div className="crt" aria-label="Animated terminal: a 42 KB file that unzips to 4.5 petabytes">
        <div className="crt-inner">
          {LINES.slice(0, shown).map((l, i) => (
            <div key={i} className={l.includes('PB') ? 'crt-root' : l.startsWith('$ #') ? 'muted' : ''}>
              {l}
            </div>
          ))}
          {shown < LINES.length && (
            <div className={LINES[shown].startsWith('$ #') ? 'muted' : ''}>
              {LINES[shown].slice(0, chars)}
              <span className="caret" />
            </div>
          )}
          {shown >= LINES.length && <div className="crt-punch">…from 42 KB.</div>}
        </div>
      </div>
    </header>
  );
}
