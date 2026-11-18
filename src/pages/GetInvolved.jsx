import { useState } from 'react';
import { STEPS, EMAIL } from '../data.js';
import SwarmText from '../components/SwarmText.jsx';

const WAYS = [
  { id: 'donate', code: 'GV-01', title: 'Donate', body: 'Help make hands-on electronics learning possible. Online giving isn’t set up yet, so send us a note and we’ll talk.', purpose: 'Ask about donating' },
  { id: 'host', code: 'WS-01', title: 'Host a workshop', body: 'Bring a session to your school, library or community space.', purpose: 'Request a workshop' },
  { id: 'partner', code: 'SC-01', title: 'Partner with us', body: 'Schools and organizations that want something ongoing.', purpose: 'Discuss a partnership' },
  { id: 'volunteer', code: 'VL-01', title: 'Volunteer', body: 'Students who like building things and explaining them. Join the team.', purpose: 'Volunteer with us' },
];
const PURPOSES = ['Ask a question', 'Learn about a program', 'Request a workshop', 'Discuss a partnership', 'Volunteer with us', 'Ask about donating'];

export default function GetInvolved() {
  const [form, setForm] = useState({ name: '', email: '', org: '', purpose: 'Request a workshop', message: '' });
  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const pick = (purpose) => { setForm((f) => ({ ...f, purpose })); document.getElementById('book')?.scrollIntoView({ behavior: 'smooth' }); };

  // No backend: submit drafts an email to the team.
  const submit = (e) => {
    e.preventDefault();
    const body = `${form.message}\n\n— ${form.name}${form.org ? `, ${form.org}` : ''}\n${form.email}`;
    location.href = `mailto:${EMAIL}?subject=${encodeURIComponent(`${form.purpose} — cirKITry`)}&body=${encodeURIComponent(body)}`;
  };

  return (
    <>
      <header className="page-hero">
        <SwarmText text="04" />
        <div className="wrap">
          <span className="eyebrow">Get involved</span>
          <h1>Close the loop <em>with us.</em></h1>
          <p className="lead">Donate, host a workshop, partner with us or volunteer. Every one of these ends with kids holding real parts.</p>
        </div>
      </header>

      <section className="section">
        <div className="wrap grid">
          {WAYS.map((w) => (
            <div key={w.id} id={w.id} className="sheet span-3 reveal">
              <span className="notch" />
              <div className="sheet__code"><span>Way in</span><b>{w.code}</b></div>
              <h3>{w.title}</h3>
              <p>{w.body}</p>
              <button className="btn" style={{ marginTop: 'auto', alignSelf: 'flex-start' }} onClick={() => pick(w.purpose)}>Get started <span className="arrow">→</span></button>
            </div>
          ))}
        </div>
      </section>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap grid">
          <div className="span-5 reveal">
            <span className="eyebrow">How booking works</span>
            <h2 className="h2" style={{ margin: '16px 0 32px' }}>From first message to build day.</h2>
            <ol className="steps steps--stack">
              {STEPS.map(([t, b], i) => <li key={t}><span className="mono step-n">0{i + 1}</span><div><strong>{t}</strong><p>{b}</p></div></li>)}
            </ol>
            <div className="sheet events">
              <div className="sheet__code"><span>Events</span><b>Calendar</b></div>
              <p>Nothing on the calendar right now. Want a workshop at your school or library? Use the form.</p>
            </div>
          </div>

          <form id="book" className="span-7 sheet form reveal" onSubmit={submit}>
            <span className="notch" />
            <div className="sheet__code"><span>Request form</span><b>{form.purpose}</b></div>
            <h3>Tell us what you have in mind.</h3>
            <p>For workshop requests, include your location, the age group, and what you'd like to explore.</p>
            <div className="form__row">
              <label>Name *<input required value={form.name} onChange={set('name')} autoComplete="name" /></label>
              <label>Email *<input required type="email" value={form.email} onChange={set('email')} autoComplete="email" /></label>
            </div>
            <label>School or organization <span className="opt">(optional)</span><input value={form.org} onChange={set('org')} autoComplete="organization" /></label>
            <label>I'd like to…
              <select value={form.purpose} onChange={set('purpose')}>{PURPOSES.map((p) => <option key={p}>{p}</option>)}</select>
            </label>
            <label>Message *<textarea required rows="5" value={form.message} onChange={set('message')} /></label>
            <p className="opt">Please don't include sensitive student information. Sending opens your email app with this message filled in.</p>
            <button className="btn btn--primary" type="submit" style={{ alignSelf: 'flex-start' }}>Send message <span className="arrow">→</span></button>
          </form>
        </div>
      </section>
    </>
  );
}
