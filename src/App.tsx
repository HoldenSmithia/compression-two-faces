import { BombLab } from './components/BombLab';
import { CrimeLab } from './components/CrimeLab';
import { Defenses } from './components/Defenses';
import { Hero } from './components/Hero';
import { LZ77Lab } from './components/LZ77Lab';
import { Quiz } from './components/Quiz';
import { Timeline } from './components/Timeline';

export default function App() {
  return (
    <>
      <div className="scanlines" aria-hidden />
      <main className="wrap">
        <Hero />
        <LZ77Lab />
        <CrimeLab />
        <BombLab />
        <Defenses />
        <Timeline />
        <section className="section moral">
          <blockquote>
            “Compression leaks information about the plaintext … in the size of the compressor output.”
            <cite>— John Kelsey, “Compression and Information Leakage of Plaintext,” FSE 2002</cite>
          </blockquote>
        </section>
        <Quiz />
        <footer className="footer">
          <p>
            A teaching visualization for CprE/SE 4210, Module 5 (Algorithmic Complexity &amp; Side-Channel Attacks).
            Everything here is a browser-only simulation: no real site is attacked, no archive is produced, and nothing
            here is an attack tool.
          </p>
          <p>
            Further reading:{' '}
            <a href="https://doi.org/10.1007/3-540-45661-9_21">Kelsey (FSE 2002)</a> ·{' '}
            <a href="https://breachattack.com/">BREACH</a> ·{' '}
            <a href="https://www.usenix.org/conference/woot19/presentation/fifield">Fifield, “A better zip bomb”</a> ·{' '}
            <a href="https://cwe.mitre.org/data/definitions/409.html">CWE-409</a>
          </p>
        </footer>
      </main>
    </>
  );
}
