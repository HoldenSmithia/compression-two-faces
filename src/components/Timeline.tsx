import { Section } from './ui';

interface Event {
  year: string;
  title: string;
  kind: 'build' | 'attack' | 'defense';
  body: string;
  href: string;
  cite: string;
}

const EVENTS: Event[] = [
  {
    year: '1977',
    title: 'LZ77 is published',
    kind: 'build',
    body: 'Ziv & Lempel describe the sliding-window algorithm that becomes the heart of DEFLATE — and of both attacks here.',
    href: 'https://doi.org/10.1109/TIT.1977.1055714',
    cite: 'IEEE Trans. Information Theory 23(3)',
  },
  {
    year: '2002',
    title: 'Compression leaks plaintext',
    kind: 'attack',
    body: 'John Kelsey shows that a compressor’s output size reveals information about its input — the seed of every compression-oracle attack.',
    href: 'https://doi.org/10.1007/3-540-45661-9_21',
    cite: 'Kelsey, FSE 2002, LNCS 2365',
  },
  {
    year: '2012',
    title: 'CRIME',
    kind: 'attack',
    body: 'Rizzo & Duong turn Kelsey’s idea into a working attack on TLS/SPDY compression, stealing session cookies. The fix: disable TLS compression.',
    href: 'https://en.wikipedia.org/wiki/CRIME',
    cite: 'ekoparty 2012 · CVE-2012-4929',
  },
  {
    year: '2013',
    title: 'BREACH (and TIME)',
    kind: 'attack',
    body: 'Gluck, Harris & Prado attack compressed HTTP responses instead of the TLS layer, so disabling TLS compression no longer saves you.',
    href: 'https://breachattack.com/',
    cite: 'Black Hat USA 2013 · CVE-2013-3587',
  },
  {
    year: '2015',
    title: 'HPACK never-indexed literals',
    kind: 'defense',
    body: 'HTTP/2’s header compression is designed with CRIME in mind: sensitive fields can be marked so intermediaries never compress them against guessable data.',
    href: 'https://www.rfc-editor.org/rfc/rfc7541#section-7.1.3',
    cite: 'RFC 7541 §7.1.3',
  },
  {
    year: '2016',
    title: 'HEIST',
    kind: 'attack',
    body: 'Vanhoef & Van Goethem measure encrypted response sizes from pure JavaScript via TCP windows — no man-in-the-middle needed, reviving BREACH in the browser.',
    href: 'https://www.blackhat.com/us-16/briefings.html#heist-http-encrypted-information-can-be-stolen-through-tcp-windows',
    cite: 'Black Hat USA 2016 · CVE-2016-7152',
  },
  {
    year: '2019',
    title: 'A better zip bomb',
    kind: 'attack',
    body: 'David Fifield builds a non-recursive bomb that expands in one pass past a 28-million-to-one ratio, beating DEFLATE’s per-stream ceiling. ClamAV was among the vulnerable.',
    href: 'https://www.usenix.org/conference/woot19/presentation/fifield',
    cite: 'USENIX WOOT 2019',
  },
];

export function Timeline() {
  return (
    <Section id="timeline" kicker="Then &amp; now" title="A short history of squeezing things too hard">
      <ol className="timeline">
        {EVENTS.map((e) => (
          <li key={e.year} className={`tl-item tl-${e.kind}`}>
            <div className="tl-year">{e.year}</div>
            <div className="tl-body">
              <div className="tl-top">
                <h3>{e.title}</h3>
                <span className={`tl-tag tl-tag-${e.kind}`}>{e.kind}</span>
              </div>
              <p>{e.body}</p>
              <a href={e.href} target="_blank" rel="noreferrer noopener">
                {e.cite} ↗
              </a>
            </div>
          </li>
        ))}
      </ol>
    </Section>
  );
}
