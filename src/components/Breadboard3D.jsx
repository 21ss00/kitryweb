import { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

// Breadboard geometry, in scene units. P is the hole pitch.
const P = 0.3, COLS = 30, CH = 0.42;
const colX = (c) => (c - (COLS - 1) / 2) * P;
const rowZ = (r) => (r < 5 ? CH + (4 - r) * P : -(CH + (r - 5) * P)); // rows a–e above the channel, f–j below
const RAIL = CH + 4 * P + 0.55;
const BOARD = { w: COLS * P + 0.6, d: 2 * (RAIL + P + 0.35), h: 0.5 };

function boardTexture() {
  const s = 128; // px per unit
  const c = document.createElement('canvas');
  c.width = Math.round(BOARD.w * s); c.height = Math.round(BOARD.d * s);
  const g = c.getContext('2d');
  g.fillStyle = '#ffffff'; g.fillRect(0, 0, c.width, c.height);
  const px = (x) => (x + BOARD.w / 2) * s, pz = (z) => (z + BOARD.d / 2) * s;
  const hole = (x, z) => { g.fillStyle = '#0a0a0a'; g.fillRect(px(x) - 8, pz(z) - 8, 16, 16); };
  for (let col = 0; col < COLS; col++) for (let r = 0; r < 10; r++) hole(colX(col), rowZ(r));
  // channel
  g.fillStyle = '#0a0a0a'; g.fillRect(0, pz(-0.12), c.width, 6); g.fillRect(0, pz(0.12) - 6, c.width, 6);
  // power rails: red + blue stripes, holes in groups of 5
  for (const sgn of [1, -1]) {
    for (const [k, col] of [[0, '#0a0a0a'], [1, '#ff7a00']]) {
      const z = sgn * (RAIL + k * P);
      for (let i = 0; i < COLS - 1; i++) if (i % 6 !== 5) hole(colX(i) + P / 2, z);
      g.fillStyle = col; g.fillRect(px(-BOARD.w / 2 + 0.3), pz(z + sgn * 0.24 * (k ? 1 : -1)) - 3, (BOARD.w - 0.6) * s, 6);
    }
  }
  g.fillStyle = '#0a0a0a'; g.font = `700 ${0.16 * s}px IBM Plex Mono, monospace`; g.textAlign = 'center';
  'abcdefghij'.split('').forEach((ch, r) => g.fillText(ch, px(-BOARD.w / 2 + 0.17), pz(rowZ(r)) + 7));
  for (let col = 0; col < COLS; col += 5) g.fillText(String(col + 1), px(colX(col)), pz(rowZ(0) + 0.24));
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

// Minimal look: every part is white, black or the one accent, with toon shading and heavy ink outlines.
const toonRamp = (() => { const t = new THREE.DataTexture(new Uint8Array([150, 215, 255]), 3, 1, THREE.RedFormat); t.minFilter = t.magFilter = THREE.NearestFilter; t.needsUpdate = true; return t; })();
const toon = (color, emissive = 0) => new THREE.MeshToonMaterial({ color, gradientMap: toonRamp, emissive, emissiveIntensity: emissive ? 0.35 : 0 });
const PAPER = toon('#ffffff'), GREY = toon('#d9d6cd'), INK = toon('#141414'), ACCENT = toon('#ff7a00', '#ff7a00');
const mat = (color) => {
  const c = new THREE.Color(color);
  if (c.equals(new THREE.Color('#ff7a00'))) return ACCENT;
  return c.r * 0.3 + c.g * 0.59 + c.b * 0.11 < 0.02 ? INK : PAPER; // linear luminance: near-black stays ink, everything else paper
};
const METAL = GREY, TIN = INK;
const OUTLINE = new THREE.ShaderMaterial({
  side: THREE.BackSide,
  uniforms: { w: { value: 0.028 } },
  vertexShader: `uniform float w; void main() { vec4 p = vec4(position + normal * w, 1.0);
    #ifdef USE_INSTANCING
    p = instanceMatrix * p;
    #endif
    gl_Position = projectionMatrix * modelViewMatrix * p; }`,
  fragmentShader: 'void main() { gl_FragColor = vec4(0.04, 0.04, 0.04, 1.0); }',
});
const EDGE = new THREE.LineBasicMaterial({ color: '#0a0a0a' });
// Inverted-hull silhouette plus crease lines on every mesh.
function ink(root) {
  const meshes = [];
  root.traverse((o) => o.isMesh && meshes.push(o));
  meshes.forEach((m) => {
    const hull = m.isInstancedMesh ? new THREE.InstancedMesh(m.geometry, OUTLINE, m.count) : new THREE.Mesh(m.geometry, OUTLINE);
    if (m.isInstancedMesh) hull.instanceMatrix = m.instanceMatrix;
    m.add(hull);
    if (!m.isInstancedMesh && m.geometry.type !== 'TubeGeometry') m.add(new THREE.LineSegments(new THREE.EdgesGeometry(m.geometry, 35), EDGE));
  });
}

function leg(from, to) {
  const a = new THREE.Vector3(...from), b = new THREE.Vector3(...to);
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.022, 0.022, a.distanceTo(b), 8), TIN);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), b.clone().sub(a).normalize());
  return m;
}

// Each part: build() returns a Group in board space; ex is its offset when fully exploded.
function buildParts() {
  const parts = [];
  const add = (ref, name, g, ex, label = 0.6) => { g.userData = { base: g.position.clone(), ex: new THREE.Vector3(...ex), ref, name, label: new THREE.Vector3(...(Array.isArray(label) ? label : [0, label, 0])) }; parts.push(g); };
  const corner = (y) => [-BOARD.w / 2 + 0.4, y, BOARD.d / 2];
  const top = BOARD.h / 2;

  // breadboard shell
  const tex = boardTexture();
  const white = PAPER;
  const shell = new THREE.Group();
  shell.add(new THREE.Mesh(new THREE.BoxGeometry(BOARD.w, BOARD.h, BOARD.d), [white, white, mat('#fff', { map: tex, roughness: 0.75 }), white, white, white]));
  add('BB1', 'Breadboard shell', shell, [0, 0, 0], [BOARD.w / 2 - 0.6, 0.25, BOARD.d / 2]);
  shell.children[0].material = [white, white, new THREE.MeshToonMaterial({ map: tex, gradientMap: toonRamp }), white, white, white];

  // spring clips: one 5-hole strip per column per side, plus long rail strips
  const clips = new THREE.Group();
  const strip = new THREE.BoxGeometry(0.14, 0.24, 4 * P + 0.18);
  const inst = new THREE.InstancedMesh(strip, METAL, COLS * 2);
  const m4 = new THREE.Matrix4();
  for (let col = 0, i = 0; col < COLS; col++) for (const s of [1, -1]) inst.setMatrixAt(i++, m4.makeTranslation(colX(col), 0, s * (CH + 2 * P)));
  clips.add(inst);
  for (const s of [1, -1]) for (const k of [0, 1]) {
    const r = new THREE.Mesh(new THREE.BoxGeometry(BOARD.w - 0.7, 0.2, 0.14), METAL);
    r.position.z = s * (RAIL + k * P); clips.add(r);
  }
  clips.position.y = 0;
  add('—', 'Spring clips (the hidden wires)', clips, [0, -1.9, 0], [-BOARD.w / 2 + 0.6, 0.1, CH + 4 * P]);

  const backing = new THREE.Mesh(new THREE.BoxGeometry(BOARD.w - 0.05, 0.06, BOARD.d - 0.05), mat('#e9d9a6', { roughness: 0.9 }));
  backing.position.y = -top - 0.03;
  const bg = new THREE.Group(); bg.add(backing);
  add('—', 'Adhesive backing', bg, [0, -3.5, 0], corner(-top));

  // push button straddling the channel
  const btn = new THREE.Group();
  btn.add(new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.32, 0.9), mat('#1c1d20', { roughness: 0.5 })));
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.2, 24), PAPER);
  cap.position.y = 0.25; btn.add(cap);
  for (const x of [-0.3, 0.3]) for (const z of [-CH, CH]) btn.add(leg([x, -0.1, z * 0.9], [x, -0.45, z]));
  btn.position.set(colX(5) + P / 2, top + 0.17, 0);
  add('S1', 'Push switch', btn, [-0.6, 3.6, 0.4]);

  // resistor lying across columns 9–13
  const res = new THREE.Group();
  const body = new THREE.Mesh(new THREE.CapsuleGeometry(0.13, 0.5, 6, 20), mat('#d9c39b'));
  body.rotation.z = Math.PI / 2; res.add(body);
  [['#e5322d', -0.2], ['#e5322d', -0.08], ['#7a4a1f', 0.04], ['#d4af37', 0.2]].forEach(([c, x]) => {
    const b = new THREE.Mesh(new THREE.CylinderGeometry(0.138, 0.138, 0.05, 20), INK);
    b.rotation.z = Math.PI / 2; b.position.x = x; res.add(b);
  });
  res.add(leg([-0.38, 0, 0], [-0.6, 0, 0]), leg([-0.6, 0, 0], [-0.6, -0.45, 0]), leg([0.38, 0, 0], [0.6, 0, 0]), leg([0.6, 0, 0], [0.6, -0.45, 0]));
  res.position.set(colX(11), top + 0.32, rowZ(2));
  add('R1', 'Resistor · 220 Ω', res, [0, 4.4, 0.8]);

  // LED
  const led = new THREE.Group();
  const lensMat = ACCENT;
  const dome = new THREE.Mesh(new THREE.CapsuleGeometry(0.17, 0.28, 8, 24), lensMat);
  dome.position.y = 0.55; led.add(dome);
  const rim = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.06, 24), lensMat); rim.position.y = 0.38; led.add(rim);
  led.add(leg([-P / 2, 0.38, 0], [-P / 2, -0.1, 0]), leg([P / 2, 0.38, 0], [P / 2, -0.1, 0]));
  led.position.set(colX(15) + P / 2, top, rowZ(1));
  add('D1', 'LED · red', led, [0.3, 3.9, 0.2], 1.05);

  // buzzer
  const bz = new THREE.Group();
  const can = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.55, 0.45, 40), mat('#151618', { roughness: 0.55 }));
  can.position.y = 0.23; bz.add(can);
  const hole = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.02, 16), mat('#000')); hole.position.y = 0.46; bz.add(hole);
  bz.position.set(colX(20), top, rowZ(7));
  add('BZ1', 'Buzzer', bz, [0.5, 3.4, -0.9], 0.75);

  // DC motor with a little fan
  const mot = new THREE.Group();
  const housing = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.9, 32), METAL);
  housing.position.y = 0.45; mot.add(housing);
  const endcap = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.12, 32), mat('#2b2f36')); endcap.position.y = 0.06; mot.add(endcap);
  const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.3, 12), METAL); shaft.position.y = 1.05; mot.add(shaft);
  const fan = new THREE.Group(); fan.position.y = 1.18; fan.name = 'fan';
  for (let i = 0; i < 3; i++) {
    const blade = new THREE.Mesh(new THREE.BoxGeometry(0.75, 0.03, 0.2), mat('#0a7cff', { roughness: 0.35 }));
    blade.position.x = 0.36; const pivot = new THREE.Group(); pivot.rotation.y = (i * Math.PI * 2) / 3; blade.rotation.x = 0.4; pivot.add(blade); fan.add(pivot);
  }
  mot.add(fan);
  mot.position.set(colX(25), top, rowZ(2));
  add('M1', 'DC motor', mot, [1.2, 3.8, 0.6], 1.45);

  // battery pack, off the board
  const bat = new THREE.Group();
  const tray = new THREE.Mesh(new THREE.BoxGeometry(1.25, 0.32, 2.9), mat('#17181b', { roughness: 0.6 }));
  bat.add(tray);
  for (const x of [-0.3, 0.3]) {
    const cell = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 2.5, 28), mat('#1f6f43', { roughness: 0.35, metalness: 0.2 }));
    cell.rotation.x = Math.PI / 2; cell.position.set(x, 0.22, 0); bat.add(cell);
    const nub = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.08, 16), METAL); nub.rotation.x = Math.PI / 2; nub.position.set(x, 0.22, x < 0 ? 1.28 : -1.28); bat.add(nub);
  }
  bat.position.set(-BOARD.w / 2 - 1.15, -0.09, 0);
  add('BT1', '2 × AA · 3 V', bat, [-2.2, 1.6, 0], 0.6);

  // jumper wires: arcs between holes
  const wires = new THREE.Group();
  const jump = (x1, z1, x2, z2, color, h = 0.55) => {
    const y = top;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(x1, y - 0.3, z1), new THREE.Vector3(x1, y + h * 0.7, z1),
      new THREE.Vector3((x1 + x2) / 2, y + h, (z1 + z2) / 2),
      new THREE.Vector3(x2, y + h * 0.7, z2), new THREE.Vector3(x2, y - 0.3, z2),
    ]);
    wires.add(new THREE.Mesh(new THREE.TubeGeometry(curve, 40, 0.045, 8), mat(color, { roughness: 0.4 })));
  };
  jump(colX(1) + P / 2, RAIL, colX(4), rowZ(0), '#e5322d');
  jump(colX(7), rowZ(9), colX(9), rowZ(1) - 0.0, '#f5d000', 0.8);
  jump(colX(13), rowZ(3), colX(15), rowZ(3), '#2fae4a', 0.35);
  jump(colX(16), rowZ(0), colX(16) + 0.15, RAIL + P, '#111', 0.4);
  jump(colX(20), rowZ(9), colX(24), rowZ(4), '#ff7a00', 0.9);
  jump(colX(26), rowZ(0), colX(27) + P / 2, RAIL + P, '#2a6cff', 0.5);
  // battery leads into the rails
  const lead = (z, color) => {
    const x0 = -BOARD.w / 2 - 0.55, x1 = colX(0) + P / 2;
    const c = new THREE.CatmullRomCurve3([new THREE.Vector3(x0, 0.1, z * 0.3), new THREE.Vector3(x0 + 0.4, 0.7, z), new THREE.Vector3(x1, top + 0.4, z), new THREE.Vector3(x1, top - 0.3, z)]);
    wires.add(new THREE.Mesh(new THREE.TubeGeometry(c, 30, 0.05, 8), mat(color)));
  };
  lead(RAIL, '#e5322d'); lead(RAIL + P, '#151515');
  add('W1–8', 'Jumper wires', wires, [0, 2.2, 0], [colX(22), top + 0.9, rowZ(7)]);

  return parts;
}

export default function Breadboard3D({ bare = false }) {
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const labelsRef = useRef([]);
  const target = useRef(0);
  const [explode, setExplode] = useState(0);
  const [labels, setLabels] = useState([]);

  useEffect(() => {
    const stage = stageRef.current, canvas = canvasRef.current;
    const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(32, 1, 0.1, 100);
    const key = new THREE.DirectionalLight('#ffffff', 2.2); key.position.set(-5, 9, 6); scene.add(key);
    scene.add(new THREE.AmbientLight('#ffffff', 1.1));

    const root = new THREE.Group(); scene.add(root);
    const parts = buildParts();
    parts.forEach((p) => { ink(p); root.add(p); });
    setLabels(parts.map((p) => p.userData));

    const resize = () => {
      const { width, height } = stage.getBoundingClientRect();
      renderer.setSize(width, height, false);
      cam.aspect = width / height; cam.updateProjectionMatrix();
    };
    resize();
    const ro = new ResizeObserver(resize); ro.observe(stage);

    let e = 0, tilt = 0, tiltT = 0, raf = 0, visible = true, last = performance.now(), intro = 0;
    const t0 = performance.now();
    const v = new THREE.Vector3();
    const ease = (t) => t * t * (3 - 2 * t);
    const backOut = (t) => 1 + 2.2 * (t - 1) ** 3 + 1.2 * (t - 1) ** 2;
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    // Build-in: every part starts scattered and spinning, then swarms onto the board one after another.
    parts.forEach((p, i) => {
      const a = (i / parts.length) * Math.PI * 2 + 0.6;
      p.userData.scatter = new THREE.Vector3(Math.cos(a) * 9, 5 + (i % 3) * 2.5, Math.sin(a) * 6);
      p.userData.spin = new THREE.Euler((i % 2 ? 1 : -1) * 2.4, 3.1, (i % 3) - 1);
    });
    const frame = (now) => {
      const dt = Math.min((now - last) / 1000, 0.05); last = now;
      intro = reduce ? 9 : (now - t0) / 1000;
      e += (target.current - e) * (1 - Math.exp(-dt * 6));
      tilt += (tiltT - tilt) * (1 - Math.exp(-dt * 4));
      parts.forEach((p, i) => {
        const k = ease(Math.min(1, Math.max(0, e * 1.25 - (i % 5) * 0.05)));
        const s = 1 - backOut(Math.min(1, Math.max(0, (intro - 0.15 - i * 0.16) / 0.9)));
        p.position.copy(p.userData.base).addScaledVector(p.userData.ex, k).addScaledVector(p.userData.scatter, Math.max(0, s));
        p.rotation.set(p.userData.spin.x * s, p.userData.spin.y * s, p.userData.spin.z * s);
      });
      const fan = root.getObjectByName('fan'); if (fan) fan.rotation.y += dt * (2 + e * 18);
      root.rotation.y = -0.35 + tilt * 0.35 + e * 0.25;
      root.position.x = e * 0.9;
      const narrow = cam.aspect < 1.1;
      const dist = (narrow ? 21 : 19) + e * (narrow ? 7 : 6.5);
      cam.position.set(0, dist * 0.5, dist * 0.87);
      cam.lookAt(0, e * 0.7, 0);
      renderer.render(scene, cam);
      // project labels
      const { width, height } = stage.getBoundingClientRect();
      parts.forEach((p, i) => {
        const el = labelsRef.current[i]; if (!el) return;
        v.copy(p.userData.label); p.localToWorld(v); v.project(cam);
        el.style.transform = `translate(${(v.x * 0.5 + 0.5) * width}px, ${(-v.y * 0.5 + 0.5) * height}px)`;
        el.style.opacity = String(Math.max(0, Math.min(1, (e - 0.35) * 2.5)));
      });
      setExplode((x) => (Math.abs(x - e) > 0.01 ? e : x));
      raf = visible ? requestAnimationFrame(frame) : 0;
    };
    const io = new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible && !raf) { last = performance.now(); raf = requestAnimationFrame(frame); } });
    io.observe(stage);

    // cursor across the stage drives the explode: left edge assembled, right edge fully apart
    const onMove = (ev) => {
      const r = stage.getBoundingClientRect();
      if (ev.clientY < r.top - 80 || ev.clientY > r.bottom + 80) return;
      target.current = Math.max(0, Math.min(1, (ev.clientX - r.left - r.width * 0.15) / (r.width * 0.7)));
      tiltT = ((ev.clientY - r.top) / r.height - 0.5) * -0.6;
    };
    window.addEventListener('pointermove', onMove, { passive: true });

    return () => {
      cancelAnimationFrame(raf); io.disconnect(); ro.disconnect();
      window.removeEventListener('pointermove', onMove);
      scene.traverse((o) => { o.geometry?.dispose(); [].concat(o.material || []).forEach((m) => { m.map?.dispose(); m.dispose(); }); });
      renderer.dispose();
    };
  }, []);

  return (
    <div className={`bb ${bare ? "bb--bare" : ""}`}>
      <div className="bb__stage" ref={stageRef}>
        <canvas ref={canvasRef} aria-label="3D breadboard circuit. Move your cursor right to pull it apart." role="img" />
        {labels.map((l, i) => (
          <div key={i} className="bb__label" ref={(el) => (labelsRef.current[i] = el)}>
            <span className="mono">{l.ref}</span>{l.name}
          </div>
        ))}
      </div>
      <div className="bb__controls">
        <span className="mono">Assembled</span>
        <input type="range" min="0" max="100" value={Math.round(explode * 100)} aria-label="Explode the breadboard" onChange={(ev) => (target.current = ev.target.value / 100)} />
        <span className="mono">Exploded</span>
      </div>
    </div>
  );
}
