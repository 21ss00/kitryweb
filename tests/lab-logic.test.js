// Run: node tests/lab-logic.test.js
import assert from 'node:assert/strict';
import { paperCircuit, logic } from '../src/lab-logic.js';

assert.equal(paperCircuit({ mode: 'series', cells: 1, s1: true, s2: true }).d1, false, '3 V cannot light two LEDs in series');
assert.equal(paperCircuit({ mode: 'series', cells: 2, s1: true, s2: true }).d2, true);
assert.equal(paperCircuit({ mode: 'series', cells: 2, s1: true, s2: false }).d1, false);
const par = paperCircuit({ mode: 'parallel', cells: 1, s1: true, s2: false });
assert.deepEqual([par.d1, par.d2], [true, false]);
assert.equal(logic('series', true, false), false);
assert.equal(logic('parallel', true, false), true);
console.log('lab-logic: all checks passed');
