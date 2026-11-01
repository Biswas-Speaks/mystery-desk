import { Link } from 'react-router-dom';
import {
  ArrowRight,
  FileSearch,
  ScanSearch,
  Fingerprint,
  Check,
  LockKeyhole,
  Lightbulb,
  FolderOpen,
  CornerDownRight,
} from 'lucide-react';
export default function HomePage() {
  return (
    <>
      <section className="hero page">
        <div className="hero-copy">
          <div className="pill">
            <span className="dot" /> YOUR NEXT CASE IS UNWRITTEN
          </div>
          <h1>
            Every detail
            <br />
            tells a story.
            <br />
            <span>Find the truth.</span>
          </h1>
          <p className="hero-description">
            A missing heirloom. A suspicious alibi. A room full of secrets. Turn your imagination
            into an original mystery—and put your detective instincts to the test.
          </p>
          <Link className="button hero-button" to="/create">
            Start investigation <ArrowRight size={19} />
          </Link>
          <div className="hero-notes">
            <span>
              <Check size={15} /> No sign-up needed
            </span>
            <span>
              <Check size={15} /> A new case, every time
            </span>
          </div>
        </div>
        <div className="case-art" aria-label="Illustrated fictional detective case file">
          <div className="art-grid" />
          <div className="art-top">
            <span>THE INVESTIGATION DESK</span>
            <span>EST. 2026</span>
          </div>
          <div className="folder-back" />
          <div className="case-paper">
            <div className="row">
              <span className="file-label">MYSTERY ROOM / CASE FILE</span>
              <Fingerprint size={28} />
            </div>
            <div className="file-divider" />
            <span className="eyebrow">CLASSIFICATION: UNSOLVED</span>
            <h2>
              The curious case
              <br />
              of what happened.
            </h2>
            <div className="paper-lines">
              <i />
              <i />
              <i />
            </div>
            <div className="paper-evidence">
              <FileSearch size={30} />
              <div>
                <strong>Every clue matters.</strong>
                <span>Look closer. Connect the dots.</span>
              </div>
            </div>
            <div className="file-divider" />
            <div className="row">
              <span className="file-label">FICTIONAL / AI-GENERATED</span>
              <span className="stamp">OPEN CASE</span>
            </div>
          </div>
          <div className="art-tag">
            <span className="tag-icon">
              <ScanSearch size={23} />
            </span>
            <div>
              <strong>One mystery. Your instincts.</strong>
              <span>The answer is waiting to be found.</span>
            </div>
          </div>
          <div className="art-bottom">
            <CornerDownRight size={18} /> FOLLOW THE EVIDENCE.
          </div>
        </div>
      </section>
      <section className="trust-strip">
        <span>
          <FolderOpen size={19} /> Original, AI-crafted cases
        </span>
        <span>
          <ScanSearch size={19} /> Evidence worth a closer look
        </span>
        <span>
          <LockKeyhole size={19} /> One final accusation
        </span>
      </section>
      <section className="page how-section" id="how-to-play">
        <div className="section-heading">
          <div>
            <span className="eyebrow teal">THE METHOD</span>
            <h2>A curious mind is all you need.</h2>
          </div>
          <p>
            From the first question to the final reveal.
            <br />
            Here’s how your investigation unfolds.
          </p>
        </div>
        <div className="steps">
          {[
            {
              Icon: FileSearch,
              title: 'Set the scene',
              text: 'Write a short premise and choose your difficulty. We’ll build an original case around your idea.',
            },
            {
              Icon: ScanSearch,
              title: 'Follow the evidence',
              text: 'Examine the evidence, weigh the alibis, and collect the clues. Ask for a hint if you need a nudge.',
            },
            {
              Icon: Lightbulb,
              title: 'Make your accusation',
              text: 'Connect the details and name your suspect. Uncover the truth and see how your deduction scores.',
            },
          ].map(({ Icon, title, text }, i) => (
            <article key={title}>
              <div className="step-top">
                <span className="step-icon">
                  <Icon size={23} />
                </span>
                <span>0{i + 1}</span>
              </div>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </section>
    </>
  );
}
