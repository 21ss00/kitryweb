// Site content, taken from the current cirKITry site and the workshop kit list.
export const EMAIL = 'cirkitrynpo@gmail.com';

export const NAV = [
  ['/', 'Home'],
  ['/programs', 'Programs'],
  ['/shop', 'Shop'],
  ['/team', 'Team'],
  ['/about', 'About'],
  ['/get-involved', 'Get involved'],
];
// Learn sits apart from the main tabs. The Lab has no tab: it's reached through "Try a circuit".
export const LEARN = ['/learn', 'Free lessons'];

export const PATHS = [
  { who: 'teacher', title: "I'm a teacher", body: 'Hands-on circuit workshops for elementary and middle school classrooms.', cta: 'See workshops', to: '/programs' },
  { who: 'librarian', title: "I'm a librarian", body: 'Bring a hands-on electronics program to your branch.', cta: 'Plan a library program', to: '/programs#LB-01' },
  { who: 'parent', title: "I'm a parent", body: 'Free activities to try at home, starting with a pencil and paper.', cta: 'Free activities', to: '/learn' },
  { who: 'student', title: "I'm a student", body: 'Draw your first circuit and find out what a switch really does.', cta: 'Try a circuit', to: '/lab' },
];

export const SAFETY = [
  { code: 'V', title: 'Low voltage only', body: 'Coin cells, AA packs and USB: 3 to 5 volts. Never wall power.', value: '3–5 V DC' },
  { code: 'P', title: 'Built for real hands', body: 'Real components kids can hold and test, sized for small hands and short sessions.', value: 'Real parts' },
  { code: 'D', title: 'No student data', body: 'Our forms are for adults. We never ask for student names or details.', value: 'Adults only' },
  { code: '$', title: 'Free to try', body: 'Every activity on this site is free, with materials you can find at home or school.', value: '$0' },
];

export const PROGRAMS = [
  {
    code: 'WS-01', title: 'Hands-on workshops', body: 'Kids build and test working circuits with real components.',
    specs: [['Format', 'In person'], ['Grades', 'Elementary + middle school'], ['Builds', 'Low-cost circuits, like copper tape'], ['Arduino track', 'Grades 7–8 · Arduino, wires, motors, LEDs'], ['Run by', 'Student-run nonprofit']],
    cta: 'Book a workshop',
  },
  {
    code: 'LB-01', title: 'Library programs', body: 'A new kind of story time. Make your library a place to discover how things work.',
    specs: [['Format', 'At your library · community spaces'], ['Audience', 'Young learners + families'], ['Run by', 'Student-run nonprofit']],
    cta: 'Bring us to your library',
  },
  {
    code: 'SC-01', title: 'School partnerships', body: 'Connect classroom ideas to things students can hold, build, and understand.',
    specs: [['Format', 'At your school · school collaboration'], ['Grades', 'Elementary + middle school'], ['Run by', 'Student-run nonprofit']],
    cta: 'Become a partner',
  },
];

export const LEVELS = [
  { code: 'CK-01', title: 'Paper circuits', grades: 'Grades 2–4', body: 'Copper tape, a coin cell and an LED on a card. The first time a light turns on because you built the path.', bom: ['W1 · Copper tape', 'BT1 · CR2032 coin cell', 'D1 · LED', 'S1 · Paper switch'], spec: ['3 V', 'coin cell', 'no tools'], builds: 'A light-up card' },
  { code: 'LK-02', title: 'Switches & motion', grades: 'Grades 4–6', body: 'A breadboard, switches, a buzzer and a small DC motor. Make it beep, spin and stop on command.', bom: ['BB1 · Breadboard', 'BT1 · 2 × AA battery pack', 'S1 · Push switch', 'BZ1 · Buzzer', 'M1 · DC motor'], spec: ['3 V', '2 × AA', 'breadboard'], builds: 'A buzzer alarm and a spinner' },
  { code: 'AK-03', title: 'Code the circuit', grades: 'Grades 7–8', body: 'An Arduino board, LEDs, a resistor and a servo. Write a few lines of code and the circuit does what you tell it.', bom: ['U1 · Arduino Uno', 'D1–3, R1–3 · LEDs + 220 Ω resistors', 'M1 · Servo motor', 'W1 · Jumper wires', 'J1 · USB cable'], spec: ['5 V', 'USB', 'Arduino IDE'], builds: 'A traffic light and a moving pointer' },
];

export const STEPS = [
  ['Send a request', 'Tell us about your group, your space and what you would like to build.'],
  ['We reply and plan it with you', 'Someone from our team writes back to talk through the details and shape a session that fits your group.'],
  ['Build day', 'Hands on parts. Your group builds a circuit, tests it and finds out what comes next.'],
];

export const LESSONS = [
  { n: 1, kind: 'Beginner lesson', title: 'Meet the circuit', body: 'Why does a light turn on? Follow the path and find out.', points: ['A circuit is a complete path for electric current.', 'Draw a battery and a lamp. Connect them with two lines.', 'Trace the loop with your finger. A gap means an open circuit.'] },
  { n: 2, kind: 'Try it on paper', title: 'Think like a switch', body: 'One small gap can change everything. Explore open and closed circuits.', points: ["A switch doesn't make electricity. It controls the path.", 'Two switches in a row work like AND. Side by side, like OR.', 'Invent a light signal: one flash for "hello", two for "ready".'] },
  { n: 3, kind: "Builder's notebook", title: 'A little troubleshooting', body: "When it doesn't work yet, your next question is your best tool.", points: ['Write what it should do, then what it actually does.', 'With power off, follow every connection. Check LED direction.', 'Change one thing, then test again. Write down what changed.'] },
];

// Shop: the eight workshop kits from the kits page, at their listed cost per kit.
import { KITS } from './kits/data.js';
export { KITS };
export const PRODUCTS = KITS.map((k, i) => ({
  id: `kit${i + 1}`, i, code: `KIT-${String(i + 1).padStart(2, '0')}`, name: k.name, edition: k.edition,
  grades: k.band, cost: k.cost, price: parseFloat(k.cost.match(/[\d.]+/)[0]), concept: k.concept, count: k.parts.length,
}));

// Team profiles aren't published yet, so the cards are placeholders drawn from the parts kids use.
export const TEAM = [
  { part: 'U1', art: 'chip', preset: 'cosmos', foil: '#ffb36b' },
  { part: 'D1', art: 'led', preset: 'bursts', foil: '#ff9433' },
  { part: 'R1', art: 'resistor', preset: 'rainbow', foil: '#e2e6ec' },
  { part: 'M1', art: 'motor', preset: 'shards', foil: '#6fb0ff' },
  { part: 'BT1', art: 'battery', preset: 'stars', foil: '#e0a15a' },
  { part: 'J1', art: 'join', preset: 'glitter', foil: '#ffffff', join: true },
];
