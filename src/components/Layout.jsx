import { useEffect, useRef, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { NAV, LEARN, EMAIL } from '../data.js';
import { useCart } from './Cart.jsx';
import Fx, { Readout } from './Fx.jsx';

// Resistor colour code, one band per digit.
const BAND = ['#111', '#7a4a1f', '#e5322d', '#ff7a00', '#f5d000', '#2fae4a', '#2a6cff', '#8e44ad', '#888', '#f4f4f4'];

export default function Layout() {
  const { pathname, hash } = useLocation();
  const [menu, setMenu] = useState(false);
  const { count, setOpen } = useCart();
  const mainRef = useRef(null);

  useEffect(() => {
    setMenu(false);
    if (hash) requestAnimationFrame(() => document.getElementById(hash.slice(1))?.scrollIntoView());
    else window.scrollTo(0, 0);
  }, [pathname, hash]);

  useEffect(() => { document.body.classList.toggle('menu-open', menu); }, [menu]);

  // Fade sections in as they enter; watches for lazily rendered pages too.
  useEffect(() => {
    const io = new IntersectionObserver((es) => es.forEach((e) => e.isIntersecting && (e.target.classList.add('in'), io.unobserve(e.target))), { rootMargin: '0px 0px -8% 0px' });
    const scan = () => mainRef.current?.querySelectorAll('.reveal:not(.in)').forEach((el) => io.observe(el));
    scan();
    const mo = new MutationObserver(scan);
    mo.observe(mainRef.current, { childList: true, subtree: true });
    return () => { io.disconnect(); mo.disconnect(); };
  }, []);

  const year = String(new Date().getFullYear());

  return (
    <>
      <a className="skip" href="#main">Skip to content</a>
      <Fx />
      <header className="header">
        <div className="wrap header__in">
          <Link to="/" className="brand" aria-label="cirKITry home"><img src={`${import.meta.env.BASE_URL}logo.svg`} alt="cirKITry" width="80" height="30" /></Link>
          <nav className="nav" aria-label="Main">
            <ul>
              {NAV.map(([to, label]) => (
                <li key={to}><NavLink to={to} end={to === '/'}>{label}</NavLink></li>
              ))}
            </ul>
            <NavLink to={LEARN[0]} className="nav__learn"><span className="nav__learn-dot" />{LEARN[1]}</NavLink>
          </nav>
          <div className="header__end">
            <button className="cart-btn" onClick={() => setOpen(true)} aria-label={`Cart, ${count} items`}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M3 4h2l2.4 11h11L21 7H6.2" /><circle cx="9" cy="20" r="1.4" /><circle cx="18" cy="20" r="1.4" /></svg>
              {count > 0 && <span className="count">{count}</span>}
            </button>
            <Link className="btn btn--primary book" to="/get-involved#book">Book a workshop <span className="arrow">→</span></Link>
            <button className="menu-btn" aria-label="Menu" aria-expanded={menu} onClick={() => setMenu((m) => !m)}><span /><span /><span /></button>
          </div>
        </div>
      </header>

      <main id="main" ref={mainRef}>
        <Outlet />
      </main>

      <footer className="footer">
        <div className="wrap">
          <div className="footer__word" aria-hidden="true">cir<span>KIT</span>ry</div>
          <div className="footer__top">
            <div className="footer__brand">
              <p>A student-run nonprofit bringing hands-on electronics to elementary and middle school makers.</p>
              <p><a className="link" href={`mailto:${EMAIL}`}>{EMAIL}</a></p>
            </div>
            <div>
              <h4>Explore</h4>
              <ul>{[NAV[1], LEARN, NAV[2]].map(([to, l]) => <li key={to}><Link to={to}>{l}</Link></li>)}</ul>
            </div>
            <div>
              <h4>Organization</h4>
              <ul>{NAV.slice(3).map(([to, l]) => <li key={to}><Link to={to}>{l}</Link></li>)}</ul>
            </div>
            <div>
              <h4>Take part</h4>
              <ul>
                <li><Link to="/get-involved#book">Book a workshop</Link></li>
                <li><Link to="/get-involved#donate">Donate</Link></li>
                <li><Link to="/get-involved#volunteer">Volunteer</Link></li>
                <li><Link to="/about#faq">FAQ</Link></li>
              </ul>
            </div>
          </div>
          <div className="footer__bottom">
            <span>© {year} cirKITry · 3–5 V DC only, never wall power.</span>
            <Readout />
            <span className="resistor" title={`Resistor bands: ${year.split('').join('-')}`}>
              <span className="lead-wire" />
              <span className="body">{year.split('').map((d, i) => <span key={i} className="band" style={{ background: BAND[+d] }} />)}</span>
              <span className="lead-wire" />
            </span>
          </div>
        </div>
      </footer>
    </>
  );
}
