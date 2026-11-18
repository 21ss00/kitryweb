import { Link } from 'react-router-dom';
import HoloCard from '../reactbits/HoloCard.jsx';
import { TEAM, EMAIL } from '../data.js';
import SwarmText from '../components/SwarmText.jsx';

export default function Team() {
  return (
    <>
      <header className="page-hero">
        <SwarmText text="03" />
        <div className="wrap">
          <span className="eyebrow">Meet the team</span>
          <h1>The people <em>behind the parts.</em></h1>
          <p className="lead">The students and volunteers who build every cirKITry workshop. Full profiles are on their way. Until then, tilt a card.</p>
        </div>
      </header>
      <section className="section">
        <div className="wrap team-grid">
          {TEAM.map((m) => {
            const card = <HoloCard image={`${import.meta.env.BASE_URL}team/${m.art}.svg`} alt={m.join ? 'Join the team card' : 'Team profile coming soon'} preset={m.preset} foilColor={m.foil} width={280} intensity={0.75} />;
            return (
              <figure key={m.part} className="team-card reveal">
                {m.join ? <Link to="/get-involved#volunteer" aria-label="Volunteer with us">{card}</Link> : card}
                <figcaption><b>{m.part}</b>{m.join ? 'Join the team' : 'Profile on its way'}</figcaption>
              </figure>
            );
          })}
        </div>
      </section>
      <section className="section" style={{ paddingTop: 0 }}>
        <div className="wrap">
          <div className="sheet learn-cta reveal">
            <div>
              <h3>Get in touch with the team</h3>
              <p>Questions about a workshop, a partnership, or joining the team? A team member will get back to you.</p>
            </div>
            <a className="btn btn--primary" href={`mailto:${EMAIL}`}>{EMAIL}</a>
          </div>
        </div>
      </section>
    </>
  );
}
