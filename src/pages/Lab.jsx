import { useState } from 'react';
import { paperCircuit, logic } from '../lab-logic.js';
import SwarmText from '../components/SwarmText.jsx';

const Seg = ({ value, set, options, label }) => (
  <div className="seg" role="radiogroup" aria-label={label}>
    {options.map(([v, l]) => <button key={String(v)} role="radio" aria-checked={value === v} className={value === v ? 'on' : ''} onClick={() => set(v)}>{l}</button>)}
  </div>
);

// horizontal switch between (x1,y) and (x1+40,y), or vertical when v
function Sw({ x, y, closed, v, label }) {
  const rot = closed ? 0 : -30;
  return (
    <g>
      <line x1={x} y1={y} x2={v ? x : x + 40} y2={v ? y + 40 : y} className="lever" style={{ transform: `rotate(${v ? -rot : rot}deg)`, transformOrigin: `${x}px ${y}px` }} />
      <circle cx={x} cy={y} r="3.5" className="node" /><circle cx={v ? x : x + 40} cy={v ? y + 40 : y} r="3.5" className="node" />
      <text x={v ? x + 14 : x + 20} y={v ? y + 24 : y - 12} className="lbl" textAnchor={v ? 'start' : 'middle'}>{label}</text>
    </g>
  );
}
const Led = ({ x, y, on, label }) => (
  <g transform={`translate(${x} ${y})`}>
    <circle r="15" className={`bulb ${on ? 'on' : ''}`} />
    <text x="22" y="5" className="lbl">{label}</text>
  </g>
);

function PaperCircuit() {
  const [mode, setMode] = useState('parallel');
  const [cells, setCells] = useState(1);
  const [s1, setS1] = useState(true);
  const [s2, setS2] = useState(false);
  const r = paperCircuit({ mode, cells, s1, s2 });
  const live = r.d1 || r.d2;
  return (
    <div className="sheet lab-card span-12">
      <div className="sheet__code"><span>Lab 01 · paper circuit</span><b>{mode} · {r.volts} V</b></div>
      <div className="lab-split">
        <div>
          <h3>Series or parallel?</h3>
          <p>Flip the paper switches. Try series, then parallel. Watch where the current goes.</p>
          <div className="ctrls">
            <Seg label="Circuit" value={mode} set={setMode} options={[['series', 'Series'], ['parallel', 'Parallel']]} />
            <Seg label="Batteries" value={cells} set={setCells} options={[[1, '1 cell · 3 V'], [2, '2 cells · 6 V']]} />
            <div className="seg"><button className={s1 ? 'on' : ''} aria-pressed={s1} onClick={() => setS1(!s1)}>S1 {s1 ? 'closed' : 'open'}</button><button className={s2 ? 'on' : ''} aria-pressed={s2} onClick={() => setS2(!s2)}>S2 {s2 ? 'closed' : 'open'}</button></div>
          </div>
          <p className="readout" aria-live="polite"><span className="mono">{`D1 ${r.d1 ? 'on' : 'off'} · D2 ${r.d2 ? 'on' : 'off'}`}</span>{r.why}</p>
          <p className="challenge">Challenge: can you light both LEDs in series?</p>
        </div>
        <svg viewBox="0 0 420 250" className={`schem ${live ? 'live' : ''}`} role="img" aria-label={`Paper circuit in ${mode}. D1 ${r.d1 ? 'on' : 'off'}, D2 ${r.d2 ? 'on' : 'off'}.`}>
          <rect x="6" y="6" width="408" height="238" rx="10" className="card" />
          <g transform="translate(50 125)">
            <line x1="-16" y1="-6" x2="16" y2="-6" className="cell" /><line x1="-9" y1="6" x2="9" y2="6" className="cell" />
            {cells === 2 && <><line x1="-16" y1="-22" x2="16" y2="-22" className="cell" /><line x1="-9" y1="-10" x2="9" y2="-10" className="cell" /></>}
            <text x="-20" y="34" className="lbl">BT1 {r.volts} V</text>
          </g>
          {mode === 'parallel' ? (
            <>
              <path className="wire" d={`M50 ${cells === 2 ? 103 : 119} V50 H350 M200 50 V70 M200 110 V140 M350 50 V70 M350 110 V140 M200 170 V200 M350 170 V200 M50 131 V200 H350`} />
              <Sw x={200} y={70} v closed={s1} label="S1" />
              <Sw x={350} y={70} v closed={s2} label="S2" />
              <Led x={200} y={155} on={r.d1} label="D1" />
              <Led x={350} y={155} on={r.d2} label="D2" />
            </>
          ) : (
            <>
              <path className="wire" d={`M50 ${cells === 2 ? 103 : 119} V50 H110 M150 50 H200 M230 50 H270 M310 50 H370 V110 M370 140 V200 H50 V131`} />
              <Sw x={110} y={50} closed={s1} label="S1" />
              <Led x={215} y={50} on={r.d1} label="" />
              <text x="215" y="85" className="lbl" textAnchor="middle">D1</text>
              <Sw x={270} y={50} closed={s2} label="S2" />
              <Led x={370} y={125} on={r.d2} label="D2" />
            </>
          )}
        </svg>
      </div>
    </div>
  );
}

function LogicGate() {
  const [wiring, setWiring] = useState('series');
  const [a, setA] = useState(true);
  const [b, setB] = useState(false);
  const lamp = logic(wiring, a, b);
  const rows = [[false, false], [false, true], [true, false], [true, true]];
  return (
    <div className="sheet lab-card span-12">
      <div className="sheet__code"><span>Lab 02 · think like a switch</span><b>{wiring === 'series' ? 'AND' : 'OR'}</b></div>
      <h3>Two switches, one lamp.</h3>
      <p>In series both must close (AND). Side by side, either one will do (OR).</p>
      <div className="ctrls">
        <Seg label="Wiring" value={wiring} set={setWiring} options={[['series', 'One after another'], ['parallel', 'Side by side']]} />
        <div className="seg"><button className={a ? 'on' : ''} aria-pressed={a} onClick={() => setA(!a)}>A {a ? 'closed' : 'open'}</button><button className={b ? 'on' : ''} aria-pressed={b} onClick={() => setB(!b)}>B {b ? 'closed' : 'open'}</button></div>
      </div>
      <table className="truth">
        <thead><tr><th>A · S1</th><th>B · S2</th><th>Lamp DS1</th></tr></thead>
        <tbody>{rows.map(([x, y]) => (
          <tr key={`${x}${y}`} className={x === a && y === b ? 'now' : ''}><td>{x ? 'closed' : 'open'}</td><td>{y ? 'closed' : 'open'}</td><td className={logic(wiring, x, y) ? 'hot' : ''}>{logic(wiring, x, y) ? 'on' : 'off'}</td></tr>
        ))}</tbody>
      </table>
      <p className="readout" aria-live="polite"><span className="mono">DS1 {lamp ? 'on' : 'off'}</span>{wiring === 'series' ? 'Series works like AND.' : 'Parallel works like OR.'}</p>
    </div>
  );
}

export default function Lab() {
  return (
    <>
      <header className="page-hero">
        <SwarmText text="ON" />
        <div className="wrap">
          <span className="eyebrow">The lab · no parts needed</span>
          <h1>Try it before <em>you build it.</em></h1>
          <p className="lead">Two quick experiments from our free lessons. Predict first, then flip the switch and check.</p>
        </div>
      </header>
      <section className="section">
        <div className="wrap grid">
          <PaperCircuit />
          <LogicGate />
        </div>
        <p className="wrap safety-note">These are drawings. For a physical build, use an age-appropriate, low-voltage kit with an adult. Never use a wall outlet or connect a battery’s terminals directly together.</p>
      </section>
    </>
  );
}
