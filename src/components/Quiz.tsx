import { useState } from 'react';
import { Section } from './ui';

interface Q {
  q: string;
  options: string[];
  answer: number;
  why: string;
}

const QUESTIONS: Q[] = [
  {
    q: 'In a CRIME-style attack, what does the attacker actually measure?',
    options: [
      'The decrypted plaintext of the response',
      'The compressed size (length) of the encrypted message',
      'The server’s private TLS key',
      'The CPU time spent compressing',
    ],
    answer: 1,
    why: 'Encryption hides the byte values but not the count. A correct guess compresses smaller, so size alone leaks the secret.',
  },
  {
    q: 'Why does a correct guess make the message compress to a smaller size?',
    options: [
      'Correct characters use fewer bits in ASCII',
      'The guess matches the secret, so LZ77 replaces it with one back-reference',
      'The encryption key shrinks',
      'The server strips correct guesses before sending',
    ],
    answer: 1,
    why: 'When the attacker’s reflected guess matches the secret, the two copies collapse into a single back-reference, dropping the output size.',
  },
  {
    q: 'BREACH improved on CRIME by targeting what?',
    options: [
      'Compressed HTTP responses instead of TLS-level compression',
      'The DNS resolver',
      'Password hashing',
      'The zip file format',
    ],
    answer: 0,
    why: 'CRIME was killed by disabling TLS compression. BREACH attacks HTTP response bodies, so that fix doesn’t help — you need masking or separation.',
  },
  {
    q: 'A decompression (zip) bomb is primarily an attack on…',
    options: [
      'Confidentiality (it reads secrets)',
      'Integrity (it rewrites files)',
      'Availability (it exhausts memory/disk)',
      'Authentication (it forges logins)',
    ],
    answer: 2,
    why: 'It’s an algorithmic-complexity / resource-exhaustion attack (CWE-409): tiny input, enormous output, denial of service.',
  },
  {
    q: 'What is the most reliable defense against a decompression bomb?',
    options: [
      'Trust the archive’s declared uncompressed size',
      'Cap total output and expansion ratio, aborting early',
      'Use a longer encryption key',
      'Compress the file a second time',
    ],
    answer: 1,
    why: 'Never trust declared sizes. A guarded, streaming extractor that enforces output and ratio limits stops the bomb long before it lands.',
  },
];

export function Quiz() {
  return (
    <Section id="quiz" kicker="Check yourself" title="Five questions">
      <div className="quiz">
        {QUESTIONS.map((q, i) => (
          <QuizItem key={i} q={q} n={i + 1} />
        ))}
      </div>
    </Section>
  );
}

function QuizItem({ q, n }: { q: Q; n: number }) {
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;

  return (
    <div className="quiz-item">
      <p className="quiz-q">
        <span className="quiz-n">{n}</span>
        {q.q}
      </p>
      <div className="quiz-options">
        {q.options.map((opt, i) => {
          const isAnswer = i === q.answer;
          const cls = !answered
            ? ''
            : isAnswer
              ? 'correct'
              : i === picked
                ? 'wrong'
                : 'dim';
          return (
            <button
              key={i}
              className={`quiz-opt ${cls}`}
              onClick={() => !answered && setPicked(i)}
              disabled={answered}
            >
              {opt}
            </button>
          );
        })}
      </div>
      {answered && (
        <p className={`quiz-why ${picked === q.answer ? 'ok' : 'bad'}`}>
          {picked === q.answer ? '✓ ' : '✗ '}
          {q.why}
        </p>
      )}
    </div>
  );
}
