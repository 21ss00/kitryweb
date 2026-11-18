import { useEffect, useRef } from 'react';

// Particles swarm in from the edges and build `text`. The cursor scatters them; they rebuild.
// Click to blow the whole thing apart and watch it reassemble.
const BLUE = [79, 157, 255], ORANGE = [255, 122, 0], PAPER = [236, 232, 223];

export default function SwarmText({ text, className = '', align = 'right' }) {
  const ref = useRef(null);

  useEffect(() => {
    const canvas = ref.current, ctx = canvas.getContext('2d');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let W = 0, H = 0, dpr = 1, ps = [], raf = 0, visible = true, alive = true, t = 0;
    const mouse = { x: -1e4, y: -1e4 };

    const build = () => {
      const r = canvas.getBoundingClientRect();
      if (r.width < 2 || r.height < 2) return; // detached or hidden: keep the last layout
      W = Math.round(r.width); H = Math.round(r.height); dpr = Math.min(devicePixelRatio, 2);
      canvas.width = W * dpr; canvas.height = H * dpr;
      const gap = W < 640 ? 5 : 7;
      const off = document.createElement('canvas'); off.width = W; off.height = H;
      const g = off.getContext('2d', { willReadFrequently: true });
      let size = H * 0.92;
      g.font = `800 ${size}px "Mona Sans", sans-serif`;
      const maxW = W * (W < 640 ? 0.9 : 0.5);
      const tw = g.measureText(text).width;
      if (tw > maxW) { size *= maxW / tw; g.font = `800 ${size}px "Mona Sans", sans-serif`; }
      g.textBaseline = 'middle'; g.textAlign = align;
      g.fillText(text, align === 'right' ? W - Math.max(16, W * 0.04) : W / 2, H * 0.56);
      const data = g.getImageData(0, 0, W, H).data;
      const old = ps;
      ps = [];
      for (let y = 0; y < H; y += gap) for (let x = 0; x < W; x += gap) {
        if (data[(y * W + x) * 4 + 3] < 128) continue;
        const prev = old[ps.length];
        const edge = Math.random() * 4 | 0;
        const sx = prev ? prev.x : edge === 0 ? -20 : edge === 1 ? W + 20 : Math.random() * W;
        const sy = prev ? prev.y : edge === 2 ? -20 : edge === 3 ? H + 20 : Math.random() * H;
        const h = (x * 13 + y * 7) % 11;
        ps.push({ x: reduce ? x : sx, y: reduce ? y : sy, vx: 0, vy: 0, tx: x, ty: y, c: h < 2 ? ORANGE : h < 3 ? PAPER : BLUE, d: Math.random() * 0.9, s: 1.4 + Math.random() * 1.4 });
      }
    };

    let last = performance.now();
    const step = (p) => {
        if (t > p.d) { // staggered start so the shape builds up rather than snapping in
          p.vx += (p.tx - p.x) * 0.045; p.vy += (p.ty - p.y) * 0.045;
        }
        const dx = p.x - mouse.x, dy = p.y - mouse.y, d2 = dx * dx + dy * dy;
        if (d2 < 12000) { const f = (1 - d2 / 12000) * 3.2 / Math.sqrt(d2 + 1); p.vx += dx * f; p.vy += dy * f; }
        p.vx *= 0.82; p.vy *= 0.82;
        p.x += p.vx + Math.sin(t * 2 + p.tx) * 0.12; p.y += p.vy + Math.cos(t * 2 + p.ty) * 0.12;
    };
    const frame = (now) => {
      // fixed 60 Hz physics steps, so slow or throttled frames still settle on time
      const n = Math.min(8, Math.max(1, Math.round((now - last) / 16.7))); last = now;
      for (let k = 0; k < n; k++) { t += 1 / 60; ps.forEach(step); }
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, W, H);
      for (const p of ps) {
        const sp = Math.min(1, Math.hypot(p.vx, p.vy) / 6);
        const [r, g, b] = p.c;
        ctx.fillStyle = `rgba(${r},${g},${b},${0.55 + sp * 0.45})`;
        ctx.fillRect(p.x, p.y, p.s + sp * 2, p.s);
      }
      raf = visible && alive ? requestAnimationFrame(frame) : 0;
    };

    const start = () => { if (!raf && alive && visible) raf = requestAnimationFrame(frame); };
    const onMove = (e) => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; };
    const onLeave = () => { mouse.x = mouse.y = -1e4; };
    const onClick = (e) => {
      const r = canvas.getBoundingClientRect();
      if (e.clientY < r.top || e.clientY > r.bottom || e.target.closest('a,button,input,select,textarea')) return;
      const cx = e.clientX - r.left, cy = e.clientY - r.top;
      ps.forEach((p) => { const a = Math.atan2(p.y - cy, p.x - cx); const f = 18 + Math.random() * 30; p.vx += Math.cos(a) * f; p.vy += Math.sin(a) * f; });
    };

    document.fonts.ready.then(() => { if (alive) { build(); start(); } });
    const ro = new ResizeObserver(() => ps.length && build()); ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; start(); }); io.observe(canvas);
    const host = canvas.parentElement;
    host.addEventListener('pointermove', onMove);
    host.addEventListener('pointerleave', onLeave);
    host.addEventListener('click', onClick);
    return () => {
      alive = false; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
      host.removeEventListener('pointermove', onMove); host.removeEventListener('pointerleave', onLeave); host.removeEventListener('click', onClick);
    };
  }, [text, align]);

  return <canvas ref={ref} className={`swarm ${className}`} aria-hidden="true" />;
}
