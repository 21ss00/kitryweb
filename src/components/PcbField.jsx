import { useEffect, useRef } from 'react';

// Procedural PCB traces. Copper lights up under the cursor; current pulses run along traces.
// `power` (0–1) scales pulse count and speed, driven by the hero's switch.
const DIRS = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]];

function route(cols, rows, rand) {
  const used = new Uint8Array(cols * rows);
  const traces = [];
  for (let n = 0; n < cols * rows * 0.06; n++) {
    let x = Math.floor(rand() * cols), y = Math.floor(rand() * rows);
    if (used[y * cols + x]) continue;
    let d = Math.floor(rand() * 4) * 2; // start orthogonal
    const pts = [[x, y]];
    used[y * cols + x] = 1;
    const len = 4 + Math.floor(rand() * 18);
    for (let i = 0; i < len; i++) {
      if (rand() < 0.22) d = (d + (rand() < 0.5 ? 1 : 7)) % 8; // 45° bends only
      const nx = x + DIRS[d][0], ny = y + DIRS[d][1];
      if (nx < 0 || ny < 0 || nx >= cols || ny >= rows || used[ny * cols + nx]) break;
      x = nx; y = ny; used[y * cols + x] = 1;
      const last = pts[pts.length - 1];
      if (pts.length > 1) {
        const prev = pts[pts.length - 2];
        if (Math.sign(last[0] - prev[0]) === DIRS[d][0] && Math.sign(last[1] - prev[1]) === DIRS[d][1]) { last[0] = x; last[1] = y; continue; }
      }
      pts.push([x, y]);
    }
    if (pts.length > 1) traces.push(pts);
  }
  return traces;
}

export default function PcbField({ power = 0, className = '' }) {
  const ref = useRef(null);
  const powerRef = useRef(power);
  powerRef.current = power;

  useEffect(() => {
    const canvas = ref.current, ctx = canvas.getContext('2d');
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    const G = 24;
    let W, H, dpr, traces, lengths, dim, lit, tmp, far, pulses = [], raf = 0, visible = true;
    const par = { x: 0, y: 0 }; // smoothed cursor offset for parallax between the two trace layers
    const mouse = { x: -999, y: -999, r: 0 };
    let seed = 7; const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);

    const paint = (g, stroke, pad, w) => {
      g.lineCap = 'round'; g.lineJoin = 'round';
      traces.forEach((t) => {
        g.strokeStyle = stroke; g.lineWidth = w;
        g.beginPath(); t.forEach(([x, y], i) => (i ? g.lineTo(x * G, y * G) : g.moveTo(x * G, y * G))); g.stroke();
        for (const [x, y] of [t[0], t[t.length - 1]]) { g.fillStyle = pad; g.beginPath(); g.arc(x * G, y * G, 3.4, 0, 7); g.fill(); g.fillStyle = '#07090c'; g.beginPath(); g.arc(x * G, y * G, 1.4, 0, 7); g.fill(); }
      });
    };
    const layer = () => { const c = document.createElement('canvas'); c.width = W * dpr; c.height = H * dpr; const g = c.getContext('2d'); g.scale(dpr, dpr); return [c, g]; };

    const build = () => {
      const r = canvas.getBoundingClientRect();
      W = r.width; H = r.height; dpr = Math.min(devicePixelRatio, 2);
      canvas.width = W * dpr; canvas.height = H * dpr;
      seed = 7;
      traces = route(Math.ceil(W / G) + 1, Math.ceil(H / G) + 1, rand);
      lengths = traces.map((t) => t.slice(1).reduce((a, p, i) => a + Math.hypot(p[0] - t[i][0], p[1] - t[i][1]) * G, 0));
      let g;
      [dim, g] = layer(); paint(g, '#1b232d', '#26313d', 1.6);
      [lit, g] = layer(); paint(g, '#e0a15a', '#ffb36b', 1.8);
      [tmp] = layer();
      // far layer: a finer, bluer board sitting behind, shifted against the cursor for depth
      const FG = 13, fc = Math.ceil(W / FG) + 4, fr = Math.ceil(H / FG) + 4;
      seed = 91;
      const ft = route(fc, fr, rand);
      [far, g] = layer();
      g.lineCap = 'round'; g.lineJoin = 'round'; g.lineWidth = 1; g.strokeStyle = '#0f1824';
      ft.forEach((t) => { g.beginPath(); t.forEach(([x, y], i) => (i ? g.lineTo(x * FG - 26, y * FG - 26) : g.moveTo(x * FG - 26, y * FG - 26))); g.stroke(); });
      g.fillStyle = '#132235';
      ft.forEach((t) => { const [x, y] = t[t.length - 1]; g.fillRect(x * FG - 27.5, y * FG - 27.5, 3, 3); });
      pulses = [];
    };

    const at = (t, d) => { // point at distance d along trace t
      for (let i = 1; i < t.length; i++) {
        const [ax, ay] = t[i - 1], [bx, by] = t[i];
        const L = Math.hypot(bx - ax, by - ay) * G;
        if (d <= L) return [(ax + (bx - ax) * (d / L)) * G, (ay + (by - ay) * (d / L)) * G];
        d -= L;
      }
      const [x, y] = t[t.length - 1]; return [x * G, y * G];
    };

    const frame = () => {
      const p = powerRef.current;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const on = mouse.x > -500;
      par.x += ((on ? mouse.x / W - 0.5 : 0) - par.x) * 0.05;
      par.y += ((on ? mouse.y / H - 0.5 : 0) - par.y) * 0.05;
      const fx = -par.x * 22 * dpr, fy = -par.y * 16 * dpr, nx = par.x * 8 * dpr, ny = par.y * 6 * dpr;
      ctx.drawImage(far, fx, fy);
      ctx.drawImage(dim, nx, ny);
      // copper under the cursor
      mouse.r += ((mouse.x > -500 ? 190 : 0) - mouse.r) * 0.12;
      if (mouse.r > 2) {
        const g = tmp.getContext('2d');
        g.setTransform(1, 0, 0, 1, 0, 0); g.globalCompositeOperation = 'source-over'; g.clearRect(0, 0, tmp.width, tmp.height);
        const grad = g.createRadialGradient(mouse.x * dpr, mouse.y * dpr, 0, mouse.x * dpr, mouse.y * dpr, mouse.r * dpr);
        grad.addColorStop(0, 'rgba(0,0,0,0.95)'); grad.addColorStop(1, 'rgba(0,0,0,0)');
        g.fillStyle = grad; g.fillRect(0, 0, tmp.width, tmp.height);
        g.globalCompositeOperation = 'source-in'; g.drawImage(lit, 0, 0);
        ctx.drawImage(tmp, nx, ny);
      }
      // current pulses
      ctx.translate(nx, ny);
      ctx.scale(dpr, dpr);
      const want = reduce ? 0 : Math.round(6 + p * 34);
      while (pulses.length < want && traces.length) { const i = Math.floor(Math.random() * traces.length); if (lengths[i] > 80) pulses.push({ i, d: 0, v: 90 + Math.random() * 120, c: Math.random() < 0.5 ? [61, 139, 255, "#cfe2ff"] : [255, 122, 0, "#ffd2a6"] }); }
      pulses = pulses.filter((q) => q.d < lengths[q.i] + 40);
      if (pulses.length > want) pulses.length = want;
      ctx.lineCap = 'round';
      pulses.forEach((q) => {
        q.d += q.v * (0.6 + p * 1.2) / 60;
        const t = traces[q.i];
        for (let k = 0; k < 6; k++) {
          const d = q.d - k * 6; if (d < 0 || d > lengths[q.i]) continue;
          const [x, y] = at(t, d);
          ctx.fillStyle = k ? `rgba(${q.c[0]},${q.c[1]},${q.c[2]},${0.5 - k * 0.08})` : q.c[3];
          ctx.beginPath(); ctx.arc(x, y, k ? 2.2 : 2.6, 0, 7); ctx.fill();
        }
      });
      raf = visible ? requestAnimationFrame(frame) : 0;
    };

    build();
    const ro = new ResizeObserver(build); ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf) raf = requestAnimationFrame(frame); });
    io.observe(canvas);
    const onMove = (e) => { const r = canvas.getBoundingClientRect(); mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top; };
    const onLeave = () => { mouse.x = mouse.y = -999; };
    window.addEventListener('pointermove', onMove, { passive: true });
    document.addEventListener('pointerleave', onLeave);
    return () => { cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); window.removeEventListener('pointermove', onMove); document.removeEventListener('pointerleave', onLeave); };
  }, []);

  return <canvas ref={ref} className={className} aria-hidden="true" />;
}
