import { useMemo, useState } from 'react';
import { type Defense, makeSecret, probeNextDefended } from '../sim/crime';
import {
  fmtBytes,
  fmtRatio,
  guardedExtract,
  nestedBomb,
  type GuardResult,
} from '../sim/bombs';
import { Bar, Callout, Pill, Section } from './ui';

const DEFENSES: { id: Defense; name: string; blurb: string }[] = [
  {
    id: 'none',
    name: 'No defense',
    blurb: 'Attacker input and the secret are compressed together. The leak is wide open.',
  },
  {
    id: 'disable',
    name: 'Disable compression',
    blurb: 'The actual fix that killed CRIME: turn compression off for sensitive responses.',
  },
  {
    id: 'separate',
    name: 'Separate the secret',
    blurb: 'Never compress attacker-influenced data together with secrets. (HPACK never-indexed literals, RFC 7541.)',
  },
  {
    id: 'mask',
    name: 'Random masking',
    blurb: 'Add a fresh random pad each request so size no longer tracks the guess. (BREACH mitigation.)',
  },
];

export function Defenses() {
  return (
    <Section
      id="defenses"
      kicker="Stage 4 · fighting back"
      title={
        <>
          Shutting it <span className="accent">down</span>
        </>
      }
    >
      <div className="prose">
        <p>
          Both attacks come from the same root — <strong>output size depends on input</strong> — so the defenses
          rhyme. For the side channel, break the link between the secret and the measurable size. For the bomb, stop
          trusting declared sizes and cap what you’ll produce. Toggle each one and watch the attack from the stage
          above stop working.
        </p>
      </div>

      <CrimeDefense />
      <BombDefense />

      <Callout tone="safe">
        The pattern underneath every fix: <b>make the observable uncorrelated with the secret</b>, or{' '}
        <b>refuse to do unbounded work on untrusted input</b>. That’s the whole module in one line.
      </Callout>
    </Section>
  );
}

function CrimeDefense() {
  const [defense, setDefense] = useState<Defense>('none');
  const [secret] = useState(() => makeSecret(6));
  const active = DEFENSES.find((d) => d.id === defense)!;

  // Probe the first character under the chosen defense. A flat set of bars means
  // the attacker can't tell the correct character apart — the leak is closed.
  const probes = useMemo(
    () => probeNextDefended(secret, '', defense),
    [secret, defense],
  );
  const sizes = probes.map((p) => p.size);
  const maxSize = Math.max(1, ...sizes);
  const minSize = Math.min(...sizes);
  const leaking = maxSize !== minSize;

  return (
    <div className="lab defense-lab">
      <h3 className="defense-title">🛡️ Defend the compression oracle (Stage 2)</h3>
      <div className="toolbar seg wrap">
        {DEFENSES.map((d) => (
          <button
            key={d.id}
            className={`btn ${defense === d.id ? 'btn-primary' : ''}`}
            onClick={() => setDefense(d.id)}
          >
            {d.name}
          </button>
        ))}
      </div>

      <p className="defense-blurb">{active.blurb}</p>

      <div className="probe-grid defense-grid">
        {probes.map((p) => (
          <div key={p.char} className={`probe static ${leaking && p.best ? 'probe-best' : ''}`}>
            <span className="probe-char">{p.char}</span>
            <Bar
              frac={maxSize === minSize ? 0.5 : (p.size - (minSize - 1)) / (maxSize - (minSize - 1))}
              tone={leaking && p.best ? 'green' : 'blue'}
              highlight={leaking && p.best}
            />
            <span className="probe-size">{p.size}</span>
          </div>
        ))}
      </div>

      {leaking ? (
        <Callout tone="warn">
          <b>Still leaking.</b> One bar is shorter than the rest, so the attacker can read the next character straight
          off the sizes.
        </Callout>
      ) : (
        <Callout tone="win">
          <b>Leak closed.</b> Every candidate compresses to the same size — the attacker learns nothing from the
          oracle. <Pill tone="ok">{active.name}</Pill>
        </Callout>
      )}
    </div>
  );
}

function BombDefense() {
  const [maxOutMB, setMaxOutMB] = useState(100);
  const [maxRatio, setMaxRatio] = useState(100);
  const bomb = useMemo(() => nestedBomb(5, 16, 4.3 * 1024 ** 3), []); // 42.zip-scale

  const result: GuardResult = useMemo(
    () =>
      guardedExtract(bomb, {
        maxOutputBytes: maxOutMB * 1024 * 1024,
        maxRatio,
      }),
    [bomb, maxOutMB, maxRatio],
  );

  return (
    <div className="lab defense-lab">
      <h3 className="defense-title">🛡️ Defend the extractor (Stage 3)</h3>
      <p className="defense-blurb">
        A guarded, streaming extractor checks running totals and bails out early — it never trusts the archive’s
        declared size. Feed it a 42.zip-scale bomb ({fmtBytes(bomb.unpacked)} if fully extracted) and set the limits.
      </p>

      <div className="sliders">
        <label className="slider">
          <span className="slider-label">
            Max output before abort<b>{fmtBytes(maxOutMB * 1024 * 1024)}</b>
          </span>
          <input
            type="range"
            min={10}
            max={2000}
            step={10}
            value={maxOutMB}
            onChange={(e) => setMaxOutMB(Number(e.target.value))}
          />
        </label>
        <label className="slider">
          <span className="slider-label">
            Max expansion ratio<b>{fmtRatio(maxRatio)}</b>
          </span>
          <input
            type="range"
            min={5}
            max={2000}
            step={5}
            value={maxRatio}
            onChange={(e) => setMaxRatio(Number(e.target.value))}
          />
        </label>
      </div>

      <div className="extractor">
        <Bar
          frac={result.fractionExtracted}
          tone={result.aborted ? 'green' : 'red'}
          label={
            result.aborted
              ? `aborted after ${fmtBytes(result.bytesWritten)} (${(result.fractionExtracted * 100).toExponential(1)}% of the bomb)`
              : `wrote the whole thing: ${fmtBytes(result.bytesWritten)}`
          }
        />
      </div>

      {result.aborted ? (
        <Callout tone="win">
          <b>Bomb defused.</b> The extractor stopped because {result.reason}. Only a sliver of the payload ever
          touched the disk.
        </Callout>
      ) : (
        <Callout tone="warn">
          <b>No limit hit.</b> With these settings the extractor would keep going — crank the caps down to stop it.
        </Callout>
      )}
    </div>
  );
}
