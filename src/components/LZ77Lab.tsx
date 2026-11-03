import { useMemo, useState } from 'react';
import { compress, ratio, type Token } from '../sim/lz77';
import { Bar, Callout, Pill, Section } from './ui';

const PRESETS: { label: string; text: string }[] = [
  { label: 'Random junk', text: 'q7-Zx!92@Lp#aK8%' },
  { label: 'One repeated word', text: 'fish fish fish fish fish fish' },
  { label: 'A long run', text: 'A'.repeat(40) },
  { label: 'Real-ish HTML', text: '<li>item</li><li>item</li><li>item</li>' },
];

export function LZ77Lab() {
  const [text, setText] = useState(PRESETS[1].text);
  const result = useMemo(() => compress(text), [text]);
  const literals = result.tokens.filter((t) => t.literal !== undefined).length;
  const refs = result.tokens.length - literals;
  const r = ratio(result);
  const savedFrac = result.rawSize === 0 ? 0 : 1 - result.size / result.rawSize;

  return (
    <Section
      id="lz77"
      kicker="Warm-up"
      title={
        <>
          How a compressor sees <span className="accent">repetition</span>
        </>
      }
    >
      <div className="prose">
        <p>
          DEFLATE — the algorithm inside zip, gzip, PNG and HTTP compression — is built on{' '}
          <strong>LZ77</strong> (Ziv &amp; Lempel, 1977). Its one move: when it meets text it has{' '}
          <em>seen before</em>, it replaces the repeat with a short <b>back-reference</b> — “copy N characters from
          D back” — instead of spelling it out again.
        </p>
        <p>
          Type below and watch it work. The punch line for the rest of this page:{' '}
          <strong>the more your text repeats, the smaller the output</strong>. Output size is a window into content.
        </p>
      </div>

      <div className="lab">
        <div className="toolbar">
          {PRESETS.map((p) => (
            <button key={p.label} className="btn" onClick={() => setText(p.text)}>
              {p.label}
            </button>
          ))}
        </div>

        <textarea
          className="code-input"
          value={text}
          spellCheck={false}
          rows={2}
          onChange={(e) => setText(e.target.value)}
          aria-label="Text to compress"
        />

        <div className="token-view" aria-label="Tokenized output">
          {result.tokens.map((t, i) => (
            <TokenChip key={i} t={t} />
          ))}
        </div>

        <div className="stat-row">
          <Stat label="Raw size" value={`${result.rawSize}`} unit="chars" />
          <Stat label="Compressed" value={`${result.size}`} unit="symbols" tone="green" />
          <Stat label="Ratio" value={r.toFixed(1)} unit=":1" tone="green" />
          <div className="stat-pills">
            <Pill tone="muted">{literals} literals</Pill>{' '}
            <Pill tone="ok">{refs} back-refs</Pill>
          </div>
        </div>

        <Bar
          frac={savedFrac}
          tone={savedFrac > 0.3 ? 'green' : 'amber'}
          label={`${Math.round(savedFrac * 100)}% smaller`}
        />
      </div>

      <Callout tone="info">
        Notice the two extremes. <b>Random junk</b> barely shrinks — nothing repeats, so almost every character is a
        literal. <b>A long run</b> of one character collapses to a single back-reference. Hold onto that: it’s the
        seed of both attacks on this page.
      </Callout>
    </Section>
  );
}

function TokenChip({ t }: { t: Token }) {
  if (t.literal !== undefined) {
    const shown = t.literal === ' ' ? '␣' : t.literal === '\n' ? '⏎' : t.literal;
    return <span className="tok tok-lit">{shown}</span>;
  }
  return (
    <span className="tok tok-ref" title={`copy ${t.len} chars from ${t.dist} back`}>
      ←{t.dist},{t.len}
    </span>
  );
}

function Stat({
  label,
  value,
  unit,
  tone,
}: {
  label: string;
  value: string;
  unit?: string;
  tone?: 'green';
}) {
  return (
    <div className="stat">
      <span className="stat-label">{label}</span>
      <span className={`stat-value ${tone === 'green' ? 'stat-green' : ''}`}>
        {value}
        {unit && <span className="stat-unit"> {unit}</span>}
      </span>
    </div>
  );
}
