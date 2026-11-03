import { useMemo, useState } from 'react';
import {
  DEFLATE_RATIO,
  fmtBytes,
  fmtRatio,
  KNOWN_BOMBS,
  nestedBomb,
  overlapBomb,
  type BombModel,
} from '../sim/bombs';
import { Bar, Callout, Pill, Section } from './ui';

type Mode = 'nested' | 'overlap';

export function BombLab() {
  const [mode, setMode] = useState<Mode>('nested');
  const [layers, setLayers] = useState(5);
  const [fanout, setFanout] = useState(16);
  const [leafMB, setLeafMB] = useState(4096); // 4 GB leaf, like 42.zip
  const [overlapKB, setOverlapKB] = useState(42);

  const bomb: BombModel = useMemo(() => {
    if (mode === 'nested') return nestedBomb(layers, fanout, leafMB * 1024 * 1024);
    return overlapBomb(overlapKB * 1024);
  }, [mode, layers, fanout, leafMB, overlapKB]);

  // Log-scale meter: map the ratio onto 0..1 across 1:1 .. 100,000,000:1.
  const logFrac = Math.min(1, Math.log10(Math.max(1, bomb.ratio)) / 8);

  return (
    <Section
      id="bomb"
      kicker="Attack 2 · the loud one"
      title={
        <>
          Zip bombs: <span className="accent">tiny</span> in, <span className="accent2">astronomical</span> out
        </>
      }
    >
      <div className="prose">
        <p>
          Flip compression around. If a long run of one byte collapses to a single back-reference (Stage 1), then a
          single back-reference can <em>expand</em> into a long run. Stack that up and a few kilobytes become
          petabytes — an <strong>algorithmic-complexity</strong> attack on space (<Pill tone="warn">CWE-409</Pill>).
          Point it at anything that auto-extracts uploads, scans attachments, or renders images, and it exhausts
          memory or disk.
        </p>
        <p className="muted small">
          The sliders below compute sizes only. <strong>This page never builds an archive</strong> — it’s the math
          from the slide, made interactive, so you can see where the defenses (Stage&nbsp;4) have to bite.
        </p>
      </div>

      <div className="lab bomb-lab">
        <div className="toolbar seg">
          <button
            className={`btn ${mode === 'nested' ? 'btn-primary' : ''}`}
            onClick={() => setMode('nested')}
          >
            Nested (42.zip style)
          </button>
          <button
            className={`btn ${mode === 'overlap' ? 'btn-primary' : ''}`}
            onClick={() => setMode('overlap')}
          >
            Non-recursive (Fifield 2019)
          </button>
        </div>

        {mode === 'nested' ? (
          <div className="sliders">
            <Slider
              label="Nesting layers"
              value={layers}
              min={1}
              max={6}
              onChange={setLayers}
              fmt={(v) => `${v}`}
            />
            <Slider
              label="Archives per layer (fan-out)"
              value={fanout}
              min={1}
              max={16}
              onChange={setFanout}
              fmt={(v) => `${v}`}
            />
            <Slider
              label="Leaf file size"
              value={leafMB}
              min={64}
              max={4096}
              step={64}
              onChange={setLeafMB}
              fmt={(v) => fmtBytes(v * 1024 * 1024)}
            />
          </div>
        ) : (
          <div className="sliders">
            <Slider
              label="Archive size on disk"
              value={overlapKB}
              min={10}
              max={10240}
              step={10}
              onChange={setOverlapKB}
              fmt={(v) => fmtBytes(v * 1024)}
            />
            <p className="muted small slider-aside">
              Fifield’s construction overlaps many file entries onto one shared compressed kernel, so output grows with
              the <em>square</em> of the input and blows past DEFLATE’s per-stream ceiling of ~{DEFLATE_RATIO}:1 in a
              single pass. The slider shows that scaling; the highest reported ratio is ~28,000,000:1.
            </p>
          </div>
        )}

        <div className="bomb-readout">
          <div className="bomb-sizes">
            <div className="bomb-size">
              <span className="bomb-size-label">On disk</span>
              <span className="bomb-size-val small-val">{fmtBytes(bomb.packed)}</span>
            </div>
            <span className="bomb-arrow">→</span>
            <div className="bomb-size">
              <span className="bomb-size-label">After decompression</span>
              <span className="bomb-size-val danger-val">{fmtBytes(bomb.unpacked)}</span>
            </div>
          </div>
          <div className="bomb-ratio">
            <span>expansion ratio</span>
            <strong>{fmtRatio(bomb.ratio)}</strong>
          </div>
          <Bar frac={logFrac} tone="red" label="log scale · 1:1 → 100,000,000:1" />
        </div>

        <div className="known-bombs">
          <KnownCard
            name={KNOWN_BOMBS.fortyTwoZip.name}
            packed={KNOWN_BOMBS.fortyTwoZip.packed}
            unpacked={KNOWN_BOMBS.fortyTwoZip.unpacked}
            note={KNOWN_BOMBS.fortyTwoZip.note}
          />
          <KnownCard
            name={KNOWN_BOMBS.fifield.name}
            packed={KNOWN_BOMBS.fifield.packed}
            unpacked={KNOWN_BOMBS.fifield.unpacked}
            note={KNOWN_BOMBS.fifield.note}
          />
        </div>
      </div>

      <Callout tone="info">
        The headline <b>42.zip</b> is 42 KB and unpacks to 4.5 PB through five nested layers of sixteen. In 2019 David
        Fifield showed you don’t even need nesting: a single-pass archive can top a <b>28-million-to-one</b> ratio. The
        fix isn’t “detect bombs” — it’s to never trust a file’s declared size. On to the defenses.
      </Callout>
    </Section>
  );
}

function KnownCard({
  name,
  packed,
  unpacked,
  note,
}: {
  name: string;
  packed: number;
  unpacked: number;
  note: string;
}) {
  return (
    <div className="known-card">
      <div className="known-head">{name}</div>
      <div className="known-sizes">
        {fmtBytes(packed)} <span className="bomb-arrow small">→</span>{' '}
        <strong className="danger-val">{fmtBytes(unpacked)}</strong>
      </div>
      <p className="muted small">{note}</p>
    </div>
  );
}

function Slider({
  label,
  value,
  min,
  max,
  step = 1,
  onChange,
  fmt,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  onChange: (v: number) => void;
  fmt: (v: number) => string;
}) {
  return (
    <label className="slider">
      <span className="slider-label">
        {label}
        <b>{fmt(value)}</b>
      </span>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}
