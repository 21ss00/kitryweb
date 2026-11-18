import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';

// Site-wide small effects, all driven by one pointer listener and one rAF loop:
// probe cursor, click sparks, card tilt + sheen, scrambling nav labels, scroll trace, route-change scan.
const GLYPHS = '01<>/\\=+*#%ΩµΔ';
const SCRAMBLE = '.nav a, .nav__learn, .link, .eyebrow';

function scramble(el) {
  if (el.dataset.scrambling) return;
  const leaf = [...el.childNodes].filter((n) => n.nodeType === 3 && n.textContent.trim()).pop();
  if (!leaf) return;
  const text = leaf.textContent;
  el.dataset.scrambling = '1';
  let f = 0;
  const tick = () => {
    f++;
    leaf.textContent = text.split('').map((ch, i) => (ch === ' ' || i < f / 1.6 ? ch : GLYPHS[(Math.random() * GLYPHS.length) | 0])).join('');
    if (f / 1.6 < text.length) requestAnimationFrame(tick);
    else { leaf.textContent = text; delete el.dataset.scrambling; }
  };
  tick();
}

export default function Fx() {
  const ring = useRef(null), dot = useRef(null), bar = useRef(null), sparks = useRef(null), wipe = useRef(null), field = useRef(null);
  const { pathname } = useLocation();

  useEffect(() => {
    const w = wipe.current;
    w.classList.remove('go'); void w.offsetWidth; w.classList.add('go');
  }, [pathname]);

  useEffect(() => {
    const fine = matchMedia('(pointer: fine)').matches;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    document.documentElement.classList.toggle('has-probe', fine && !reduce);
    const c = sparks.current, g = c.getContext('2d');
    const fc = field.current, fg = fc.getContext('2d');
    let t = 0, glow = 0;
    let dpr = 1, ps = [], raf = 0, card = null;
    const m = { x: -100, y: -100 }, r = { x: -100, y: -100 };
    const size = () => { dpr = Math.min(devicePixelRatio, 2); c.width = fc.width = innerWidth * dpr; c.height = fc.height = innerHeight * dpr; };
    size();

    const loop = () => {
      r.x += (m.x - r.x) * 0.2; r.y += (m.y - r.y) * 0.2;
      ring.current.style.transform = `translate(${r.x}px, ${r.y}px)`;
      dot.current.style.transform = `translate(${m.x}px, ${m.y}px)`;
      const max = document.documentElement.scrollHeight - innerHeight;
      bar.current.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
      // dot field: a faint grid that drifts with the page and wakes up blue around the cursor
      t += 0.016;
      glow += ((m.x > 0 ? 1 : 0) - glow) * 0.05;
      fg.setTransform(dpr, 0, 0, dpr, 0, 0); fg.clearRect(0, 0, innerWidth, innerHeight);
      const S = 30, oy = -((scrollY * 0.35) % S), R = 200;
      const hero = document.querySelector('.hero'), top = hero ? Math.max(0, hero.getBoundingClientRect().bottom) : 0;
      for (let y = oy; y < innerHeight + S; y += S) for (let x = S / 2; x < innerWidth; x += S) {
        if (y < top) continue;
        const dx = x - r.x, dy = y - r.y, d = Math.sqrt(dx * dx + dy * dy);
        const k = d < R ? (1 - d / R) ** 2 * glow : 0;
        const wave = reduce ? 0 : (Math.sin(t * 0.8 + x * 0.012 + y * 0.009) + 1) * 0.03;
        const px = x + (d > 0 ? (dx / d) * k * 7 : 0), py = y + (d > 0 ? (dy / d) * k * 7 : 0);
        fg.fillStyle = k > 0.02 ? `rgba(125,180,255,${0.12 + k * 0.7})` : `rgba(160,156,148,${0.07 + wave})`;
        const sz = 1.2 + k * 1.8;
        fg.fillRect(px - sz / 2, py - sz / 2, sz, sz);
      }
      g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, innerWidth, innerHeight);
      ps = ps.filter((p) => (p.life -= 1 / 40) > 0);
      ps.forEach((p) => {
        p.vy += 0.18; p.vx *= 0.97; p.x += p.vx; p.y += p.vy;
        g.strokeStyle = `rgba(${p.c},${p.life})`; g.lineWidth = 1.6;
        g.beginPath(); g.moveTo(p.x, p.y); g.lineTo(p.x - p.vx * 2.2, p.y - p.vy * 2.2); g.stroke();
      });
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);

    const onMove = (e) => {
      m.x = e.clientX; m.y = e.clientY;
      const t = e.target instanceof Element ? e.target : null;
      ring.current.classList.toggle('hot', !!t?.closest('a,button,[role=tab],summary,input,select,textarea,label,canvas'));
      // tilt the drawing sheet under the cursor; skip big ones like forms and lab panels
      const next = t?.closest('.sheet');
      if (card && card !== next) { card.style.removeProperty('--ang'); card.classList.remove('tilting'); }
      card = next && next.offsetWidth < 640 && !next.parentElement?.classList.contains('socket') && !reduce ? next : null; // shop keys press instead of tilting
      if (card) {
        const b = card.getBoundingClientRect(), x = (e.clientX - b.left) / b.width, y = (e.clientY - b.top) / b.height;
        card.classList.add('tilting');
        card.style.setProperty('--mx', `${x * 100}%`); card.style.setProperty('--my', `${y * 100}%`);
        card.style.setProperty('--ax', (0.5 - y).toFixed(3)); card.style.setProperty('--ay', (x - 0.5).toFixed(3));
        card.style.setProperty('--ang', `${Math.hypot(x - 0.5, y - 0.5) * 9}deg`);
      }
    };
    const onDown = (e) => {
      if (reduce) return;
      for (let i = 0; i < 14; i++) {
        const a = Math.random() * Math.PI * 2, v = 2 + Math.random() * 4.5;
        ps.push({ x: e.clientX, y: e.clientY, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 2, life: 1, c: i % 3 ? '255,148,51' : '125,180,255' });
      }
    };
    const onOver = (e) => { const el = e.target instanceof Element && e.target.closest(SCRAMBLE); if (el && !reduce) scramble(el); };
    const onLeaveDoc = () => { m.x = m.y = -100; };

    addEventListener('pointermove', onMove, { passive: true });
    addEventListener('pointerdown', onDown, { passive: true });
    addEventListener('resize', size);
    document.addEventListener('pointerover', onOver);
    document.documentElement.addEventListener('pointerleave', onLeaveDoc);
    return () => {
      cancelAnimationFrame(raf);
      removeEventListener('pointermove', onMove); removeEventListener('pointerdown', onDown); removeEventListener('resize', size);
      document.removeEventListener('pointerover', onOver); document.documentElement.removeEventListener('pointerleave', onLeaveDoc);
    };
  }, []);

  return (
    <>
      <canvas ref={field} className="fx-field" aria-hidden="true" />
      <div ref={bar} className="fx-bar" aria-hidden="true" />
      <div ref={ring} className="fx-ring" aria-hidden="true"><i /></div>
      <div ref={dot} className="fx-dot" aria-hidden="true" />
      <canvas ref={sparks} className="fx-sparks" aria-hidden="true" />
      <div ref={wipe} className="fx-wipe" aria-hidden="true" />
      <div className="fx-grain" aria-hidden="true" />
    </>
  );
}

// Footer readout: local time and a supply voltage that drifts like a real meter.
export function Readout() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const id = setInterval(() => setNow(new Date()), 1000); return () => clearInterval(id); }, []);
  const v = (3.3 + Math.sin(now.getTime() / 4000) * 0.012 + (now.getSeconds() % 7) * 0.001).toFixed(3);
  return (
    <span className="readout-live mono">
      <i className="led" /> SYS OK · {now.toLocaleTimeString([], { hour12: false })} · VCC {v} V
    </span>
  );
}
