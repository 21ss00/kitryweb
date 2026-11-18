import { useEffect, useRef, useState } from 'react';
import { PRODUCTS, KITS } from '../data.js';
import { useCart } from '../components/Cart.jsx';
import { createKitScene } from '../kits/scene.js';
import SwarmText from '../components/SwarmText.jsx';

const BANDS = ['All', 'K–2', '3–5', '6–8'];

export default function Shop() {
  const canvasRef = useRef(null);
  const viewRef = useRef(null);
  const sceneRef = useRef(null);
  const tipRef = useRef(null);
  const [state, setState] = useState({ cur: 0, opened: false });
  const [shots, setShots] = useState([]);
  const [hover, setHover] = useState(-1);
  const [band, setBand] = useState('All');
  const { add } = useCart();

  useEffect(() => {
    const s = createKitScene(canvasRef.current, {
      onChange: setState,
      onHover: (part, x, y, idx) => {
        const tip = tipRef.current; if (!tip) return;
        if (x != null) { tip.style.transform = `translate(${x + 16}px, ${y + 14}px)`; return; }
        if (idx !== undefined) setHover(idx ?? -1);
        tip.classList.toggle('show', !!part);
        if (part) tip.textContent = `${part.n} · ${part.q}`;
      },
    });
    sceneRef.current = s;
    s.ready.then(() => setShots(s.snapshots()));
    return () => s.dispose();
  }, []);

  const k = KITS[state.cur], p = PRODUCTS[state.cur];
  const s = sceneRef.current;
  const onKey = (e) => {
    if (e.key === 'ArrowRight') s?.goTo(state.cur + 1);
    else if (e.key === 'ArrowLeft') s?.goTo(state.cur - 1);
    else if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); state.opened ? s?.close() : s?.open(); }
    else if (e.key === 'Escape') s?.close();
  };
  const show = (i) => { s?.close(); s?.goTo(i); viewRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }); };
  const list = PRODUCTS.filter((x) => band === 'All' || x.grades === band);

  return (
    <>
      <header className="page-hero">
        <SwarmText text="02" />
        <div className="wrap">
          <span className="eyebrow">Shop · workshop kits</span>
          <h1>Take the kit <em>home.</em></h1>
          <p className="lead">These are the eight kits we bring to workshops. Open a box to see every part inside, then add the ones you want. Prices are the cost per kit.</p>
        </div>
      </header>

      <section className="section" style={{ paddingTop: 'clamp(40px, 5vw, 72px)' }}>
        <div className="wrap">
          <div ref={viewRef} className={`kitview ${state.opened ? 'open' : ''}`}>
            <div className="kitview__stage" tabIndex={0} onKeyDown={onKey} aria-label={`3D kit box: ${k.name}. Arrow keys change kit, Enter opens the box.`}>
              <canvas ref={canvasRef} />
              {!state.opened && <span className="kitview__hint">Click the box to open · drag or ← → for the next kit</span>}
              <button className="btn kitview__close" onClick={() => s?.close()}>← Close box</button>
            <aside className="kitview__parts" aria-hidden={!state.opened}>
              <div className="sheet__code" style={{ margin: '0 -16px 8px', padding: '10px 16px' }}><span>In the box</span><b>{k.parts.length} items</b></div>
              <ol>
                {k.parts.map((part, i) => (
                  <li key={part.n + i} className={hover === i ? 'on' : ''} onMouseEnter={() => s?.hoverList(i)} onMouseLeave={() => s?.hoverList(-1)}>
                    <span>{String(i + 1).padStart(2, '0')}</span>{part.n}<em>{part.q}</em>
                  </li>
                ))}
              </ol>
            </aside>
            </div>
            <div className="kitview__bar">
              <div className="kitview__idx">{String(state.cur + 1).padStart(2, '0')}<span>/ {String(KITS.length).padStart(2, '0')}</span></div>
              <div className="kitview__name"><h3>{k.name}</h3><p>{k.edition}</p></div>
              <dl className="kitview__meta">
                <div><dt>Grades</dt><dd>{k.band}</dd></div>
                <div><dt>Cost per kit</dt><dd>{k.cost}</dd></div>
                <div><dt>Concepts</dt><dd>{k.concept}</dd></div>
              </dl>
              <div className="kitview__actions">
                <button className="icon-btn" disabled={state.opened || state.cur === 0} onClick={() => s?.goTo(state.cur - 1)} aria-label="Previous kit">←</button>
                <button className="icon-btn" disabled={state.opened || state.cur === KITS.length - 1} onClick={() => s?.goTo(state.cur + 1)} aria-label="Next kit">→</button>
                <button className="btn btn--primary" onClick={() => add(p.id)}>Add <span className="arrow">+</span></button>
              </div>
            </div>
          </div>

          <div className="filters" role="tablist" aria-label="Grades">
            {BANDS.map((b) => (
              <button key={b} role="tab" aria-selected={band === b} className={band === b ? 'on' : ''} onClick={() => setBand(b)}>
                {b === 'All' ? 'All kits' : `Grades ${b}`}<span className="mono">{b === 'All' ? PRODUCTS.length : PRODUCTS.filter((x) => x.grades === b).length}</span>
              </button>
            ))}
          </div>

          <div className="grid baseplate">
            {list.map((x, n) => (
              <div key={x.id} className="socket span-3" style={{ '--i': n }}>
              <article className="sheet product">
                <div className="sheet__code"><span>Grades {x.grades}</span><b>{x.code}</b></div>
                <button className="product__img" onClick={() => show(x.i)} aria-label={`Open ${x.name} in the 3D viewer`} style={{ border: 0, padding: 0 }}>
                  {shots[x.i] ? <img src={shots[x.i]} alt="" /> : <span className="mono" style={{ color: 'var(--muted)', fontSize: 12 }}>LOADING BOX…</span>}
                </button>
                <h3>{x.name}</h3>
                <p className="mono" style={{ fontSize: 'var(--fs-xs)', textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--orange-ink)' }}>{x.edition}</p>
                <p>{x.concept}</p>
                <div className="product__buy">
                  <span className="price">{x.cost}<small>per kit · {x.count} parts</small></span>
                  <button className="btn btn--primary" onClick={() => add(x.id)}>Add <span className="arrow">+</span></button>
                </div>
              </article>
              </div>
            ))}
          </div>
          <p className="safety-note">Online payment isn't set up yet. Checkout sends your list to the team by email.</p>
        </div>
      </section>
      <div ref={tipRef} className="kitview__tip" aria-hidden="true" />
    </>
  );
}
