import { Link } from 'react-router-dom';
import { PROGRAMS, LEVELS } from '../data.js';
import SwarmText from '../components/SwarmText.jsx';

export default function Programs() {
  return (
    <>
      <header className="page-hero">
        <SwarmText text="01" />
        <div className="wrap">
          <span className="eyebrow">Index · 3 sheets</span>
          <h1>Programs, <em>by the datasheet.</em></h1>
          <p className="lead">Hands-on electronics for young learners, wherever your community comes together. Pick a format, then see what kids build at each grade.</p>
        </div>
      </header>

      <section className="section">
        <div className="wrap grid baseplate">
          {PROGRAMS.map((p, i) => (
            <div key={p.code} className="socket span-4 reveal" style={{ '--i': i }}>
            <article id={p.code} className="sheet">
              <span className="notch" />
              <div className="sheet__code"><span>Part code</span><b>{p.code}</b></div>
              <h3>{p.title}</h3>
              <p>{p.body}</p>
              <dl className="specs">{p.specs.map(([k, v]) => <div key={k}><dt>{k}</dt><dd>{v}</dd></div>)}</dl>
              <Link className="btn btn--primary" style={{ marginTop: 'auto', alignSelf: 'flex-start' }} to="/get-involved#book">{p.cta} <span className="arrow">→</span></Link>
            </article>
            </div>
          ))}
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="section-head reveal">
            <span className="eyebrow">What kids build, by grade</span>
            <h2 className="h2">Three levels, one idea: every circuit is a path.</h2>
            <p className="lead">Kids start where they are and climb.</p>
          </div>
          <ol className="ladder">
            {LEVELS.map((l, i) => (
              <li key={l.code} className="ladder__row reveal">
                <span className="ladder__node mono">{String(i + 1).padStart(2, '0')}</span>
                <div className="socket ladder__sheet">
                <div className="sheet">
                  <div className="sheet__code"><span>{l.grades}</span><b>{l.code}</b></div>
                  <div className="ladder__body">
                    <div>
                      <h3>{l.title}</h3>
                      <p>{l.body}</p>
                      <div className="chips">{l.spec.map((s) => <span key={s} className="chip">{s}</span>)}</div>
                      <p className="ladder__builds"><span className="mono">Builds →</span> {l.builds}</p>
                    </div>
                    <div className="bom">
                      <div className="bom__h mono">Bill of materials · {l.bom.length} parts</div>
                      <ol>{l.bom.map((b) => { const [ref, name] = b.split(' · '); return <li key={b}><span className="mono">{ref}</span>{name}</li>; })}</ol>
                    </div>
                  </div>
                </div>
                </div>
              </li>
            ))}
          </ol>
          <div className="reveal" style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginTop: 40 }}>
            <Link className="btn btn--primary" to="/get-involved#book">Book a workshop <span className="arrow">→</span></Link>
            <Link className="btn" to="/shop">Get a kit for home</Link>
          </div>
        </div>
      </section>
    </>
  );
}
