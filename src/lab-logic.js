// Pure logic behind the Lab page widgets (tested in lab-logic.test.js).
export const LED_V = 2; // a red LED needs about 2 V

export function paperCircuit({ mode, cells, s1, s2 }) {
  const volts = cells * 3;
  if (mode === 'parallel') {
    const why = !s1 && !s2 ? 'Both branches are open, so no current can flow.'
      : s1 && s2 ? `Each LED gets the full ${volts} V across its own branch, more than the ~2 V a red LED needs.`
      : `${s1 ? 'S1' : 'S2'} closes its branch. ${s1 ? 'D2' : 'D1'}’s branch is still open.`;
    return { volts, d1: s1, d2: s2, why };
  }
  const closed = s1 && s2;
  const enough = volts >= 2 * LED_V;
  const lit = closed && enough;
  const why = !closed ? 'In series there is one path. Any open switch breaks the whole loop.'
    : !enough ? `The loop is closed, but ${volts} V split across two LEDs is about ${volts / 2} V each. Not enough. Try 2 cells.`
    : `${volts} V across two LEDs in a row gives each about ${volts / 2} V. Both light.`;
  return { volts, d1: lit, d2: lit, why };
}

export const logic = (wiring, a, b) => (wiring === 'series' ? a && b : a || b);
