import { lazy, Suspense, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import PcbField from '../components/PcbField.jsx';
import { SAFETY } from '../data.js';

const Breadboard3D = lazy(() => import('../components/Breadboard3D.jsx'));

const TP = ({ n }) => <span className="tp" aria-hidden="true"><i /><b>TP{n}</b></span>;

function PowerSwitch({ on, setOn }) {
  return (
    <button className={`power ${on ? 'on' : ''}`} onClick={() => setOn((v) => !v)} aria-pressed={on}>
      <svg viewBox="0 0 220 120" aria-hidden="true">
        <path className="loop" d="M30 30 H95 M135 30 H190 V95 H30 Z" />
        <line x1="22" y1="56" x2="38" y2="56" className="cell" /><line x1="16" y1="68" x2="44" y2="68" className="cell" />
        <line x1="95" y1="30" x2="135" y2="30" className="lever" style={{ transform: `rotate(${on ? 0 : -30}deg)`, transformOrigin: '95px 30px' }} />
        <circle cx="95" cy="30" r="4" className="node" /><circle cx="135" cy="30" r="4" className="node" />
        <circle cx="190" cy="62" r="13" className="bulb" />
      </svg>
      <span className="power__label">
        <span className="mono">S1 · {on ? 'closed' : 'open'}</span>
        <strong>{on ? 'Circuit closed' : 'Close the circuit'}</strong>
      </span>
    </button>
  );
}

// Counts up from 0 the first time it scrolls into view.
function Count({ to }) {
  const ref = useRef(null);
  const [n, setN] = useState(0);
  useEffect(() => {
    const io = new IntersectionObserver(([e]) => {
      if (!e.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const step = (now) => { const k = Math.min(1, (now - t0) / 1100); setN(Math.round(to * (1 - (1 - k) ** 3))); if (k < 1) requestAnimationFrame(step); };
      requestAnimationFrame(step);
    }, { threshold: 0.6 });
    io.observe(ref.current);
    return () => io.disconnect();
  }, [to]);
  return <span ref={ref}>{n}</span>;
}

export default function Home() {
  const [on, setOn] = useState(false);
  const circuitRef = useRef(null);

  useEffect(() => {
    const el = circuitRef.current;
    const tps = [...el.querySelectorAll('.tp')];
    const onScroll = () => {
      const r = el.getBoundingClientRect();
      const y = innerHeight * 0.62 - r.top;
      el.style.setProperty('--fill', `${Math.max(0, Math.min(r.height, y))}px`);
      tps.forEach((t) => t.classList.toggle('live', t.getBoundingClientRect().top - r.top < y));
    };
    onScroll();
    addEventListener('scroll', onScroll, { passive: true });
    addEventListener('resize', onScroll);
    return () => { removeEventListener('scroll', onScroll); removeEventListener('resize', onScroll); };
  }, []);

  return (
    <>
      <section className={`hero ${on ? 'is-on' : ''}`}>
        <PcbField power={on ? 1 : 0} className="hero__pcb" />
        <div className="wrap hero__in">
          <div className="hero__copy">
            <span className="eyebrow pop" style={{ '--d': 0 }}>A student-run nonprofit</span>
            <h1 className="hero__title">
              <span className="build" style={{ '--d': 1 }}>Make</span>{' '}
              <span className="build whatif" style={{ '--d': 2 }}>what&nbsp;if</span>{' '}
              <span className="build hot" style={{ '--d': 3 }}>work.</span>
            </h1>
            <p className="lead pop" style={{ '--d': 5 }}>Hands-on electronics for elementary and middle school makers. Real parts, at your school, library or community space.</p>
            <div className="hero__cta pop" style={{ '--d': 6 }}>
              <Link className="btn btn--primary" to="/get-involved#book">Book a workshop <span className="arrow">→</span></Link>
              <Link className="btn btn--blue" to="/lab">Try a circuit</Link>
            </div>
            <div className="pop" style={{ '--d': 7 }}><PowerSwitch on={on} setOn={setOn} /></div>
          </div>
          <div className="hero__board">
            <Suspense fallback={<div className="bb__stage bb--bare" />}><Breadboard3D bare /></Suspense>
          </div>
        </div>
      </section>

      <div className="circuit" ref={circuitRef}>
        <span className="circuit__head" aria-hidden="true" />

        <section className="section statement" aria-labelledby="what-h">
          <TP n={1} />
          <div className="wrap">
            <span className="eyebrow" id="what-h">What we do</span>
            <p className="statement__text reveal fill-words">
              We bring <mark>hands-on electronics</mark> to elementary and middle school kids through <mark>workshops</mark>, <mark>library programs</mark>, <mark>school partnerships</mark> and <mark>free activities</mark>. A light. A switch. A moving motor. <em>Electronics makes invisible ideas visible.</em>
            </p>
            <dl className="tally reveal">
              <div className="pop" style={{ '--d': 1 }}><dt>Programs</dt><dd><Count to={3} /></dd></div>
              <div className="pop" style={{ '--d': 2 }}><dt>Workshop kits</dt><dd><Count to={8} /></dd></div>
              <div className="pop" style={{ '--d': 3 }}><dt>Grades</dt><dd>K–<Count to={8} /></dd></div>
              <div className="pop" style={{ '--d': 4 }}><dt>Volts, max</dt><dd><Count to={5} /></dd></div>
            </dl>
            <div className="statement__more reveal">
              <Link className="link" to="/programs">See the programs →</Link>
              <Link className="link" to="/about">More about us →</Link>
            </div>
          </div>
        </section>

        <section className="section parents" aria-labelledby="safe-h">
          <TP n={2} />
          <div className="wrap">
            <span className="eyebrow">Safety and privacy</span>
            <h2 id="safe-h" className="h2 reveal fill" style={{ margin: '18px 0 48px' }}>What parents ask first.</h2>
            <div className="specsheet reveal">
              {SAFETY.map((s, i) => (
                <div key={s.title} className="pop" style={{ '--d': i + 1 }}>
                  <strong className="specsheet__v">{s.value}</strong>
                  <h3>{s.title}</h3>
                  <p>{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>
    </>
  );
}
