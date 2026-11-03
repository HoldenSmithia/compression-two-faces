import { type ReactNode } from 'react';

export function Section({
  id,
  kicker,
  title,
  children,
}: {
  id: string;
  kicker: string;
  title: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="section">
      <header className="section-head">
        <span className="kicker">{kicker}</span>
        <h2>{title}</h2>
      </header>
      {children}
    </section>
  );
}

export function Callout({
  children,
  tone = 'info',
}: {
  children: ReactNode;
  tone?: 'info' | 'warn' | 'win' | 'safe';
}) {
  return <div className={`callout callout-${tone}`}>{children}</div>;
}

export function Pill({
  tone,
  children,
}: {
  tone: 'ok' | 'bad' | 'muted' | 'warn';
  children: ReactNode;
}) {
  return <span className={`pill pill-${tone}`}>{children}</span>;
}

/** A labelled horizontal bar. `frac` is 0..1; `tone` colours it. */
export function Bar({
  frac,
  tone = 'blue',
  label,
  highlight = false,
}: {
  frac: number;
  tone?: 'blue' | 'green' | 'red' | 'amber';
  label?: ReactNode;
  highlight?: boolean;
}) {
  const pct = Math.max(0, Math.min(1, frac)) * 100;
  return (
    <div className={`bar ${highlight ? 'bar-hot' : ''}`}>
      <div className={`bar-fill bar-${tone}`} style={{ width: `${pct}%` }} />
      {label !== undefined && <span className="bar-label">{label}</span>}
    </div>
  );
}
