import { Link } from 'react-router-dom';
import { LESSONS } from '../data.js';
import SwarmText from '../components/SwarmText.jsx';

export default function Learn() {
  return (
    <>
      <header className="page-hero">
        <SwarmText text="?!" />
        <div className="wrap">
          <span className="eyebrow">Free activities · 3 lessons</span>
          <h1>Start with <em>a pencil.</em></h1>
          <p className="lead">Lessons and activities to try at home or in class. All free, with materials you already have.</p>
        </div>
      </header>
      <section className="section">
        <div className="wrap">
          <ol className="timeline">
            {LESSONS.map((l) => (
              <li key={l.n} className="timeline__item reveal">
                <span className="timeline__node mono">{l.n}</span>
                <article className="sheet">
                  <div className="sheet__code"><span>Lesson {l.n} of 3</span><b>{l.kind}</b></div>
                  <h3>{l.title}</h3>
                  <p>{l.body}</p>
                  <ol className="lesson-steps">{l.points.map((p) => <li key={p}>{p}</li>)}</ol>
                </article>
              </li>
            ))}
          </ol>
          <div className="sheet reveal learn-cta">
            <div>
              <h3>Ready to flip a switch?</h3>
              <p>Lessons 1 and 2 have interactive versions you can flip and test.</p>
            </div>
            <Link className="btn btn--primary" to="/lab">Try a circuit <span className="arrow">→</span></Link>
          </div>
        </div>
      </section>
    </>
  );
}
