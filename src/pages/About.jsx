import { Link } from 'react-router-dom';
import HalftoneReveal from '../reactbits/HalftoneReveal.jsx';
import { PATHS, STEPS } from '../data.js';

// Answers drawn only from what the current site states.
const FAQ = [
  ['What ages do you work with?', 'Elementary and middle school. Paper circuits for grades 2–4, switches and motion on a breadboard for 4–6, and an Arduino track for grades 7–8.'],
  ['Is it safe?', 'Low voltage only: coin cells, AA packs and USB, 3 to 5 volts. Never wall power. Real components, sized for small hands and short sessions.'],
  ['Do you collect information about kids?', 'No. Our forms are for adults. We never ask for student names or details.'],
  ['Where do workshops happen?', 'At your school, library or community space.'],
  ['Who runs cirKITry?', 'Students, as a nonprofit.'],
  ['Are the activities really free?', 'Yes. Every activity on this site is free, with materials you can find at home or school.'],
]

export default function About() {
  return (
    <>
      <header className="page-hero about-hero">
        <div className="wrap grid">
          <div className="span-5">
            <span className="eyebrow">About cirKITry</span>
            <h1>A space to try, <em>build, and discover.</em></h1>
            <p className="lead">We help young people discover electronics by getting their hands on it.</p>
          </div>
          <div className="span-7 halftone-frame">
            <HalftoneReveal src={`${import.meta.env.BASE_URL}halftone.svg`} mode="mono" shape="dot" cellSize={9} inkColor="#ff7a00" paperColor="#07090c" accentColor="#0a7cff" revealRadius={170} invert={false} contrast={1.2} wander />
            <span className="halftone-hint mono">Move over the print</span>
          </div>
        </div>
      </header>

      <section className="section">
        <div className="wrap grid">
          {[
            ['01', 'What we do', 'cirKITry provides electronics education for elementary and middle-school students through workshops, libraries, school partnerships, and free learning resources.'],
            ['02', 'Why electronics', 'A light. A switch. A moving motor. Electronics makes invisible ideas visible, and gives students a way to ask better questions about the world around them.'],
            ['03', 'How we teach', 'We start with a question, explore an idea, and build something to test it. A first attempt is part of the process. So is the moment a connection makes sense.'],
          ].map(([n, t, b]) => (
            <div key={n} className="sheet span-4 reveal pop" style={{ '--d': +n }}>
              <div className="sheet__code"><span>Principle</span><b>{n}</b></div>
              <h3>{t}</h3>
              <p>{b}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="section start" id="start" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <span className="eyebrow">Start here</span>
          <h2 className="h2 reveal fill" style={{ margin: '18px 0 36px' }}>Pick the one that sounds like you.</h2>
          <ol className="rows">
            {PATHS.map((p, i) => (
              <li key={p.who} className="reveal pop" style={{ '--d': i }}>
                <Link to={p.to} className="row">
                  <span className="row__n mono">0{i + 1}</span>
                  <span className="row__t">{p.title}</span>
                  <span className="row__b">{p.body}</span>
                  <span className="row__go mono">{p.cta} →</span>
                </Link>
              </li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section book" id="booking">
        <div className="wrap grid">
          <div className="span-5">
            <span className="eyebrow">How booking works</span>
            <h2 className="h2" style={{ marginTop: 18 }}>Bring a workshop to your school or library.</h2>
            <Link className="btn btn--ink" to="/get-involved#book" style={{ marginTop: 32 }}>Send a request <span className="arrow">→</span></Link>
          </div>
          <ol className="span-7 steps">
            {STEPS.map(([t, b], i) => (
              <li key={t} className="reveal pop" style={{ '--d': i }}><span className="step-n">0{i + 1}</span><div><strong>{t}</strong><p>{b}</p></div></li>
            ))}
          </ol>
        </div>
      </section>

      <section className="section" id="faq">
        <div className="wrap grid">
          <div className="span-4 reveal">
            <span className="eyebrow">FAQ</span>
            <h2 className="h2" style={{ marginTop: 16 }}>Questions parents and teachers ask.</h2>
            <p style={{ marginTop: 20 }}><Link className="link" to="/get-involved#book">Ask us something else →</Link></p>
          </div>
          <div className="span-8 faq reveal">
            {FAQ.map(([q, a]) => (
              <details key={q}>
                <summary>{q}<span className="mono" aria-hidden="true">+</span></summary>
                <p>{a}</p>
              </details>
            ))}
          </div>
        </div>
      </section>
    </>
  );
}
