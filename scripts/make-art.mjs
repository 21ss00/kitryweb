// Generates the Holo Card art (public/team/*.svg) and the halftone poster (public/halftone.svg).
// Run: node scripts/make-art.mjs
import { writeFileSync, mkdirSync } from 'node:fs';
import { TEAM } from '../src/data.js';

const W = 630, H = 880;
const ART = {
  chip: `<rect x="175" y="300" width="280" height="200" rx="14" fill="#15181d" stroke="#3d4a5a" stroke-width="3"/>
    ${[0, 1, 2, 3, 4, 5].map((i) => `<rect x="${200 + i * 44}" y="268" width="20" height="34" fill="#c9ccd2"/><rect x="${200 + i * 44}" y="498" width="20" height="34" fill="#c9ccd2"/>`).join('')}
    <circle cx="205" cy="330" r="9" fill="#2a3542"/><text x="315" y="414" fill="#ff9433" font-family="IBM Plex Mono, monospace" font-size="44" font-weight="600" text-anchor="middle">U1</text>`,
  led: `<defs><radialGradient id="g" cx="50%" cy="40%"><stop offset="0" stop-color="#ffd2a6"/><stop offset=".35" stop-color="#ff7a00"/><stop offset="1" stop-color="#ff7a00" stop-opacity="0"/></radialGradient></defs>
    <circle cx="315" cy="360" r="210" fill="url(#g)" opacity=".55"/>
    <path d="M245 470 V330 a70 70 0 0 1 140 0 V470 Z" fill="#ff5a2a"/><rect x="230" y="462" width="170" height="22" rx="4" fill="#ff5a2a"/>
    <rect x="270" y="484" width="10" height="150" fill="#c9ccd2"/><rect x="350" y="484" width="10" height="120" fill="#c9ccd2"/>`,
  resistor: `<rect x="60" y="396" width="510" height="10" fill="#c9ccd2"/><rect x="165" y="330" width="300" height="140" rx="66" fill="#d9c39b"/>
    ${[['#e5322d', 215], ['#e5322d', 262], ['#7a4a1f', 309], ['#d4af37', 400]].map(([c, x]) => `<rect x="${x}" y="330" width="26" height="140" fill="${c}"/>`).join('')}`,
  motor: `<rect x="215" y="270" width="200" height="290" rx="22" fill="#b9bec6"/><rect x="215" y="520" width="200" height="40" rx="10" fill="#2b2f36"/>
    <rect x="305" y="210" width="20" height="64" fill="#c9ccd2"/>
    ${[0, 120, 240].map((a) => `<ellipse cx="315" cy="150" rx="120" ry="26" fill="#0a7cff" transform="rotate(${a} 315 205) translate(0 0)" opacity=".9"/>`).join('')}<circle cx="315" cy="205" r="18" fill="#e9eef4"/>`,
  battery: `<rect x="200" y="250" width="230" height="350" rx="26" fill="#1f6f43"/><rect x="275" y="222" width="80" height="32" rx="8" fill="#c9ccd2"/>
    <rect x="200" y="250" width="230" height="110" rx="26" fill="#2fae4a"/><text x="315" y="480" fill="#e9eef4" font-family="IBM Plex Mono, monospace" font-size="72" font-weight="600" text-anchor="middle">+3V</text>`,
  join: `<circle cx="315" cy="390" r="150" fill="none" stroke="#ff7a00" stroke-width="10" stroke-dasharray="22 18"/>
    <path d="M315 320 V460 M245 390 H385" stroke="#e9eef4" stroke-width="18" stroke-linecap="round"/>`,
};

const traces = (seed) => {
  let s = seed, out = '';
  const r = () => ((s = (s * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 14; i++) {
    const x = Math.round(r() * 20) * 30, y = Math.round(r() * 28) * 30, dx = (r() < 0.5 ? 1 : -1) * 90, dy = 90;
    out += `<path d="M${x} ${y} h${dx} l${dy / 2} ${dy / 2} v90" fill="none" stroke="#263241" stroke-width="4"/><circle cx="${x}" cy="${y}" r="7" fill="#2a3542"/>`;
  }
  return out;
};

mkdirSync('public/team', { recursive: true });
TEAM.forEach((m, i) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}">
  <rect width="${W}" height="${H}" fill="#0c1015"/>${traces(11 + i * 97)}
  <rect x="24" y="24" width="${W - 48}" height="${H - 48}" rx="18" fill="none" stroke="${m.foil}" stroke-opacity=".5" stroke-width="3"/>
  <text x="56" y="92" fill="#93a2b4" font-family="IBM Plex Mono, monospace" font-size="26" letter-spacing="4">CIRKITRY · ${m.part}</text>
  ${ART[m.art]}
  <rect x="24" y="${H - 220}" width="${W - 48}" height="196" fill="#07090c" opacity=".88"/>
  <text x="56" y="${H - 140}" fill="#e9eef4" font-family="Mona Sans, Arial, sans-serif" font-size="52" font-weight="800">${m.join ? 'Join the team' : 'cirKITry team'}</text>
  <text x="56" y="${H - 84}" fill="${m.art === 'join' ? '#ff9433' : '#93a2b4'}" font-family="IBM Plex Mono, monospace" font-size="26">${m.art === 'join' ? 'WE’RE RECRUITING →' : 'PROFILE COMING SOON'}</text>
</svg>`;
  writeFileSync(`public/team/${m.art}.svg`, svg);
});

// Halftone poster: soft tonal shapes read best as dots.
writeFileSync('public/halftone.svg', `<svg xmlns="http://www.w3.org/2000/svg" width="1600" height="1000" viewBox="0 0 1600 1000">
  <defs>
    <radialGradient id="glow" cx="62%" cy="44%" r="55%"><stop offset="0" stop-color="#fff"/><stop offset=".28" stop-color="#bbb"/><stop offset="1" stop-color="#000"/></radialGradient>
    <linearGradient id="dome" x1="0" x2="1"><stop offset="0" stop-color="#555"/><stop offset=".45" stop-color="#fff"/><stop offset="1" stop-color="#333"/></linearGradient>
    <linearGradient id="hand" x1="0" y1="1" x2="0" y2="0"><stop offset="0" stop-color="#111"/><stop offset="1" stop-color="#6a6a6a"/></linearGradient>
  </defs>
  <rect width="1600" height="1000" fill="url(#glow)"/>
  <path d="M900 640 V400 a110 110 0 0 1 220 0 V640 Z" fill="url(#dome)"/><rect x="876" y="630" width="268" height="34" rx="6" fill="#ccc"/>
  <rect x="950" y="664" width="16" height="340" fill="#888"/><rect x="1056" y="664" width="16" height="280" fill="#888"/>
  <path d="M0 1000 C 160 820 330 760 520 800 C 640 825 760 790 870 760 L 940 790 C 820 860 700 900 600 930 L 560 1000 Z" fill="url(#hand)"/>
  <g font-family="Mona Sans, Arial Black, sans-serif" font-weight="900" fill="#fff"><text x="90" y="300" font-size="210">WHAT</text><text x="90" y="500" font-size="210">IF?</text></g>
</svg>`);
console.log('art written');
