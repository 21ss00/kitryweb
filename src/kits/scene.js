// The workshop-kit box viewer from the kits page, adapted to live inside a container
// instead of owning the whole window. Ported from cirkity/src/main.js.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { KITS } from './data.js';
import { P } from './parts.js';
import * as TX from './textures.js';

const W = 7, H = 1.5, D = 5, T = 0.14, SP = 10, FLOOR_Y = -H / 2 + T, LID_OPEN = -2.0;
const damp = (dt, k) => 1 - Math.exp(-k * dt);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const easeBack = (t) => { const c = 1.9; return 1 + (c + 1) * Math.pow(t - 1, 3) + c * Math.pow(t - 1, 2); };

export function createKitScene(canvas, { onChange, onHover }) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = 1.1;
  renderer.shadowMap.enabled = true;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x121212); scene.fog = new THREE.Fog(0x121212, 18, 50);
  const pmrem = new THREE.PMREMGenerator(renderer);
  scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = 0.45;
  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 120);

  const key = new THREE.DirectionalLight(0xffffff, 2.1);
  key.position.set(3, 12, 8); key.castShadow = true; key.shadow.mapSize.set(2048, 2048);
  Object.assign(key.shadow.camera, { left: -8, right: 8, top: 7, bottom: -7, near: 1, far: 30 });
  key.shadow.bias = -0.0004; key.shadow.normalBias = 0.02; scene.add(key);
  scene.add(new THREE.HemisphereLight(0xdfe6ff, 0x141416, 0.5));
  const rimA = new THREE.PointLight(0xfff0dc, 70, 40, 2); rimA.position.set(-9, 3, 5); scene.add(rimA);
  const rimB = new THREE.PointLight(0xa9b8ff, 35, 40, 2); rimB.position.set(9, 4, -4); scene.add(rimB);

  const floor = new THREE.Mesh(new THREE.PlaneGeometry(160, 160).rotateX(-Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0x161616, roughness: 0.85, metalness: 0.1 }));
  floor.position.y = -3.4; floor.receiveShadow = true; scene.add(floor);
  const glow = new THREE.Mesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ map: TX.glowTex(), color: 0xff7a00, transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, opacity: 0.16 }));
  glow.scale.set(22, 1, 15); glow.position.y = -3.38; scene.add(glow);

  const rail = new THREE.Group(); scene.add(rail);
  const padTexture = TX.padTex();
  const bodyMat = () => new THREE.MeshStandardMaterial({ color: 0x1c1d21, roughness: 0.55, metalness: 0.25 });

  function makeUnit(kit, i) {
    const holder = new THREE.Group(); holder.position.x = i * SP; rail.add(holder);
    const tilt = new THREE.Group(); holder.add(tilt);
    const shell = new THREE.Group(); tilt.add(shell);
    const body = bodyMat();
    const frontMat = new THREE.MeshStandardMaterial({ map: TX.frontTex(kit, i), roughness: 0.4, metalness: 0.3 });
    const lidTop = new THREE.MeshStandardMaterial({ map: TX.lidTex(kit, i, KITS.length), roughness: 0.5, metalness: 0.1, emissive: 0xffffff, emissiveIntensity: 0 });
    lidTop.emissiveMap = lidTop.map;
    const lidIn = body.clone(), floorMat = body.clone();
    lidIn.metalness = 0.05; lidIn.roughness = 0.8; floorMat.color.set(0xffffff); floorMat.metalness = 0.05; floorMat.roughness = 0.85;
    const wall = (geo, mats, x, y, z) => { const m = new THREE.Mesh(geo, mats); m.position.set(x, y, z); m.castShadow = m.receiveShadow = true; shell.add(m); return m; };
    wall(new THREE.BoxGeometry(W, H - T, T), [body, body, body, body, frontMat, body], 0, T / 2, D / 2 - T / 2);
    wall(new THREE.BoxGeometry(W, H - T, T), body, 0, T / 2, -D / 2 + T / 2);
    [-1, 1].forEach((s) => wall(new THREE.BoxGeometry(T, H - T, D - 2 * T), body, s * (W / 2 - T / 2), T / 2, 0));
    wall(new THREE.BoxGeometry(W, T, D), [body, body, floorMat, body, body, body], 0, -H / 2 + T / 2, 0);
    const lidPivot = new THREE.Group(); lidPivot.position.set(0, H / 2, -D / 2 - 0.06); shell.add(lidPivot);
    const lid = new THREE.Mesh(new THREE.BoxGeometry(W + 0.12, 0.18, D + 0.12), [body, body, lidTop, lidIn, body, body]);
    lid.position.set(0, 0.09, (D + 0.12) / 2); lid.castShadow = lid.receiveShadow = true; lidPivot.add(lid);
    const partsG = new THREE.Group(); partsG.visible = false; tilt.add(partsG);
    return { kit, i, accent: new THREE.Color(kit.accent), holder, tilt, shell, lidPivot, lidTop, lidIn, floorMat, frontMat, partsG, parts: null, scale: i === 0 ? 1 : 0.68, lidA: 0, glow: 0, pk: 0 };
  }

  function ensureParts(u) {
    if (u.parts) return;
    u.floorMat.map = TX.floorTex(); u.floorMat.needsUpdate = true;
    u.lidIn.map = TX.lidInnerTex(u.kit); u.lidIn.needsUpdate = true;
    const n = u.kit.parts.length, rows = Math.ceil(n / 4), cols = Math.ceil(n / rows);
    const iw = W - 2 * T - 0.35, id = D - 2 * T - 0.35, cw = iw / cols, ch = id / rows;
    u.parts = u.kit.parts.map((def, idx) => {
      const raw = P[def.t](...def.a), box = new THREE.Box3().setFromObject(raw), size = box.getSize(new THREE.Vector3()), c = box.getCenter(new THREE.Vector3());
      raw.position.set(-c.x, -box.min.y, -c.z);
      const wrap = new THREE.Group(); wrap.add(raw);
      wrap.scale.setScalar(Math.min((cw * 0.74) / Math.max(size.x, 0.01), (ch * 0.74) / Math.max(size.z, 0.01), 1.25 / Math.max(size.y, 0.01), 2.4));
      const holder = new THREE.Group(); holder.add(wrap);
      const row = Math.floor(idx / cols), inRow = Math.min(cols, n - row * cols), col = idx % cols;
      holder.position.set(-iw / 2 + cw * (col + 0.5) + ((cols - inRow) * cw) / 2, FLOOR_Y, -id / 2 + ch * (row + 0.5));
      holder.scale.setScalar(0.001);
      const pad = new THREE.Mesh(new THREE.PlaneGeometry(cw * 0.94, ch * 0.94).rotateX(-Math.PI / 2), new THREE.MeshBasicMaterial({ map: padTexture, color: 0x1e1f23, transparent: true, depthWrite: false }));
      pad.position.set(holder.position.x, FLOOR_Y + 0.006, holder.position.z); u.partsG.add(pad);
      const mats = new Set();
      raw.traverse((o) => { if (o.isMesh) { o.castShadow = o.receiveShadow = true; o.userData.part = idx; if (o.material.emissive) mats.add(o.material); } });
      mats.forEach((m) => { m.userData.e0 = m.emissive.clone(); m.userData.i0 = m.emissiveIntensity; });
      holder.userData.part = idx; u.partsG.add(holder);
      return { holder, wrap, pad, mats: [...mats], h: 0, sway: idx * 1.3 };
    });
  }

  const units = KITS.map(makeUnit);
  let cur = 0, opened = false, hoverList = -1, hovPart = -1, hovBox = false, railX = 0, yaw = 0, raf = 0, visible = true, alive = true, lastHov = -2;
  const pointer = new THREE.Vector2(0, 0), ray = new THREE.Raycaster(), accentNow = new THREE.Color(KITS[0].accent);
  const emit = () => onChange({ cur, opened });

  const api = {
    goTo(i) { const n = clamp(i, 0, KITS.length - 1); if (n === cur || opened) return; cur = n; emit(); },
    open() { if (opened) return; const u = units[cur]; ensureParts(u); u.partsG.visible = true; opened = true; yaw = 0; emit(); },
    close() { if (!opened) return; opened = false; hoverList = -1; hovPart = -1; emit(); },
    hoverList(i) { hoverList = i; },
    get state() { return { cur, opened }; },
  };

  function pick() {
    const u = units[cur];
    if (!opened) { hovBox = ray.intersectObject(u.shell, true).length > 0; hovPart = -1; return; }
    hovBox = false; hovPart = -1;
    const hit = ray.intersectObjects(u.parts.map((p) => p.holder), true)[0];
    if (hit && u.partsG.visible && u.pk > 0.3) hovPart = hit.object.userData.part;
  }

  let drag = null;
  const toNdc = (e) => { const r = canvas.getBoundingClientRect(); pointer.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1); };
  const onMove = (e) => {
    toNdc(e);
    onHover(null, e.clientX, e.clientY);
    if (drag) {
      if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) > 6) drag.moved = true;
      if (opened && drag.moved) yaw = clamp(yaw + (e.clientX - drag.lx) * 0.006, -1.1, 1.1);
      drag.lx = e.clientX;
    }
  };
  const onDown = (e) => { drag = { x: e.clientX, y: e.clientY, lx: e.clientX, moved: false }; };
  const onUp = (e) => {
    const d = drag; drag = null; if (!d) return;
    toNdc(e); ray.setFromCamera(pointer, camera); pick();
    const dx = e.clientX - d.x;
    if (!opened && Math.abs(dx) > 70) api.goTo(cur + (dx < 0 ? 1 : -1));
    else if (!d.moved && !opened && hovBox) api.open();
  };
  const onLeave = () => { pointer.set(0, 0); drag = null; onHover(null); };
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointerleave', onLeave);

  const resize = () => {
    const { width, height } = canvas.parentElement.getBoundingClientRect();
    renderer.setSize(width, height, false); camera.aspect = width / height; camera.updateProjectionMatrix();
  };
  const ro = new ResizeObserver(resize); ro.observe(canvas.parentElement); resize();

  let tPrev = performance.now(), tAcc = 0;
  const camPos = new THREE.Vector3(0, 2, 13), camLook = new THREE.Vector3(), tmpP = new THREE.Vector3(), tmpL = new THREE.Vector3();

  function frame() {
    const now = performance.now(), dt = Math.min((now - tPrev) / 1000, 0.05); tPrev = now; tAcc += dt; const t = tAcc;
    railX += (-cur * SP - railX) * damp(dt, 5); rail.position.x = railX;
    accentNow.lerp(units[cur].accent, damp(dt, 4)); glow.material.color.copy(accentNow);
    ray.setFromCamera(pointer, camera); pick();

    units.forEach((u, i) => {
      const act = i === cur, sc = act ? 1 : opened ? 0 : 0.68;
      u.scale += (sc - u.scale) * damp(dt, 6); u.holder.scale.setScalar(Math.max(u.scale, 0.001)); u.holder.visible = u.scale > 0.03;
      if (!u.holder.visible) return;
      const openA = act && opened;
      u.holder.position.y += ((act ? (openA ? 0 : 1.05) : 0.5) + Math.sin(t * 0.9 + i * 1.7) * (openA ? 0.03 : 0.14) - u.holder.position.y) * damp(dt, 5);
      const ty = openA ? yaw : Math.sin(t * 0.45 + i) * 0.3 + (act ? pointer.x * 0.28 : 0);
      const tx = openA ? 0 : 0.5 + (act ? -pointer.y * 0.12 : 0);
      u.tilt.rotation.y += (ty - u.tilt.rotation.y) * damp(dt, 5);
      u.tilt.rotation.x += (tx - u.tilt.rotation.x) * damp(dt, 5);
      u.lidA += ((openA ? LID_OPEN : 0) - u.lidA) * damp(dt, openA ? 4.2 : 6); u.lidPivot.rotation.x = u.lidA;
      u.glow += ((act && !opened && hovBox ? 1 : 0) - u.glow) * damp(dt, 8); u.lidTop.emissiveIntensity = 0.18 * u.glow;
      const ready = openA && u.lidA < -0.9;
      u.pk = clamp(u.pk + (ready ? dt : -dt * 3), 0, 3);
      if (u.parts) {
        if (!openA && u.pk <= 0) u.partsG.visible = false;
        const hv = openA ? (hoverList >= 0 ? hoverList : hovPart) : -1;
        u.parts.forEach((p, idx) => {
          const e = easeBack(clamp((u.pk - idx * 0.07) / 0.55, 0, 1));
          p.h += ((idx === hv ? 1 : 0) - p.h) * damp(dt, 12);
          p.holder.scale.setScalar(Math.max(e, 0.001));
          p.holder.position.y = FLOOR_Y + (1 - Math.min(e, 1)) * 0.8 + p.h * 0.32;
          p.wrap.rotation.y = Math.sin(t * 0.6 + p.sway) * 0.22 + p.h * Math.sin(t * 1.6) * 0.25;
          p.pad.material.color.set(0x1e1f23).lerp(u.accent, p.h * 0.55);
          p.mats.forEach((m) => { m.emissive.copy(m.userData.e0).lerp(u.accent, p.h * 0.5); m.emissiveIntensity = m.userData.i0 + p.h * 0.12; });
        });
      }
    });

    const hv = opened ? hovPart : -1;
    if (hv !== lastHov) { lastHov = hv; onHover(hv >= 0 ? units[cur].kit.parts[hv] : null, null, null, hv); }
    canvas.style.cursor = drag && drag.moved ? 'grabbing' : hovBox || hovPart >= 0 ? 'pointer' : opened ? 'grab' : 'default';

    const asp = camera.aspect, fit = Math.max(1, 18 / asp / 14.5);
    const sx = asp > 1.3 ? -2.2 : 0;
    const cp = opened ? tmpP.set(-sx, 10.6, 8.6) : tmpP.set(0, 2.6, 14.5);
    cp.multiplyScalar(opened ? Math.max(1, 9 / (asp * 8.5)) : fit);
    cp.x += pointer.x * 0.7; cp.y += pointer.y * 0.4;
    const cl = opened ? tmpL.set(-sx, asp > 1.3 ? -0.2 : -2.2, 0.2) : tmpL.set(0, -0.2, 0);
    camPos.lerp(cp, damp(dt, 3)); camLook.lerp(cl, damp(dt, 3));
    camera.position.copy(camPos); camera.lookAt(camLook);
    renderer.render(scene, camera);
    raf = visible && alive ? requestAnimationFrame(frame) : 0;
  }

  const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible && !raf && alive) { tPrev = performance.now(); raf = requestAnimationFrame(frame); } });
  io.observe(canvas);

  // Static product shots: each closed box from the front, rendered once with a fixed camera.
  api.snapshots = (w = 640, h = 480) => {
    const off = new THREE.WebGLRenderTarget(w, h, { samples: 4, colorSpace: THREE.SRGBColorSpace });
    const cam = new THREE.PerspectiveCamera(30, w / h, 0.1, 100);
    const c = document.createElement('canvas'); c.width = w; c.height = h;
    const g = c.getContext('2d'), px = new Uint8Array(w * h * 4), img = g.createImageData(w, h);
    const saved = units.map((u) => [u.holder.visible, u.holder.scale.x, u.tilt.rotation.x, u.tilt.rotation.y, u.holder.position.y]);
    const out = units.map((u, i) => {
      units.forEach((o) => (o.holder.visible = o === u));
      u.holder.scale.setScalar(1); u.tilt.rotation.set(0.42, -0.5, 0); u.holder.position.y = 0;
      rail.updateMatrixWorld(true);
      const wp = u.holder.getWorldPosition(new THREE.Vector3());
      cam.position.set(wp.x + 0.6, wp.y + 3.4, wp.z + 13.2); cam.lookAt(wp.x, wp.y - 0.3, wp.z);
      renderer.setRenderTarget(off); renderer.render(scene, cam);
      renderer.readRenderTargetPixels(off, 0, 0, w, h, px);
      for (let y = 0; y < h; y++) img.data.set(px.subarray((h - 1 - y) * w * 4, (h - y) * w * 4), y * w * 4); // flip rows
      g.putImageData(img, 0, 0);
      return c.toDataURL('image/webp', 0.86);
    });
    renderer.setRenderTarget(null); off.dispose();
    units.forEach((u, i) => { const s = saved[i]; u.holder.visible = s[0]; u.holder.scale.setScalar(s[1]); u.tilt.rotation.x = s[2]; u.tilt.rotation.y = s[3]; u.holder.position.y = s[4]; });
    return out;
  };

  // Rebuild box art once the site fonts are in, then start.
  api.ready = Promise.race([Promise.all([document.fonts.load('900 100px "Mona Sans"'), document.fonts.load('500 20px "IBM Plex Mono"')]), new Promise((r) => setTimeout(r, 2500))])
    .catch(() => {})
    .then(() => {
      if (!alive) return;
      units.forEach((u, i) => { u.lidTop.map = u.lidTop.emissiveMap = TX.lidTex(u.kit, i, KITS.length); u.frontMat.map = TX.frontTex(u.kit, i); u.lidTop.needsUpdate = u.frontMat.needsUpdate = true; });
      raf = requestAnimationFrame(frame);
    });

  api.dispose = () => {
    alive = false; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
    canvas.removeEventListener('pointermove', onMove); canvas.removeEventListener('pointerdown', onDown);
    canvas.removeEventListener('pointerup', onUp); canvas.removeEventListener('pointerleave', onLeave);
    scene.traverse((o) => { o.geometry?.dispose(); [].concat(o.material || []).forEach((m) => { m.map?.dispose(); m.dispose(); }); });
    pmrem.dispose(); renderer.dispose();
  };
  return api;
}
