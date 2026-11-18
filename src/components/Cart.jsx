import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { PRODUCTS, EMAIL } from '../data.js';

const CartCtx = createContext(null);
export const useCart = () => useContext(CartCtx);

const load = () => {
  try { return JSON.parse(localStorage.getItem('ck-cart')) || {}; } catch { return {}; }
};

export function CartProvider({ children }) {
  const [items, setItems] = useState(load);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    try { localStorage.setItem('ck-cart', JSON.stringify(items)); } catch { /* storage blocked: cart is session-only */ }
  }, [items]);

  useEffect(() => {
    document.body.classList.toggle('cart-open', open);
    const onKey = (e) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open]);

  const value = useMemo(() => {
    const set = (id, q) => setItems((s) => {
      const n = { ...s };
      if (q <= 0) delete n[id]; else n[id] = Math.min(q, 99);
      return n;
    });
    const lines = PRODUCTS.filter((p) => items[p.id]).map((p) => ({ ...p, qty: items[p.id] }));
    return {
      lines,
      count: lines.reduce((a, l) => a + l.qty, 0),
      total: lines.reduce((a, l) => a + l.qty * l.price, 0),
      add: (id) => { set(id, (items[id] || 0) + 1); setOpen(true); },
      set,
      open,
      setOpen,
    };
  }, [items, open]);

  return (
    <CartCtx.Provider value={value}>
      {children}
      <CartDrawer />
    </CartCtx.Provider>
  );
}

function CartDrawer() {
  const { lines, total, set, open, setOpen } = useCart();
  // No payment backend yet: checkout drafts an order request email to the team.
  const body = lines.map((l) => `${l.qty} × ${l.name} (${l.code}) — $${l.qty * l.price}`).join('\n');
  const href = `mailto:${EMAIL}?subject=${encodeURIComponent('cirKITry shop order request')}&body=${encodeURIComponent(`Hi cirKITry team,\n\nI'd like to order:\n${body}\n\nEstimated total: $${total}\n\nShip to / pickup:\n`)}`;

  return (
    <>
      <div className="drawer-scrim" onClick={() => setOpen(false)} />
      <aside className="drawer" aria-label="Cart" aria-hidden={!open} inert={!open}>
        <header>
          <div>
            <div className="eyebrow">Bill of materials</div>
            <h3>Your cart</h3>
          </div>
          <button className="icon-btn" onClick={() => setOpen(false)} aria-label="Close cart">✕</button>
        </header>
        {lines.length ? (
          <ul className="drawer__list">
            {lines.map((l) => (
              <li key={l.id}>
                <div><strong>{l.name}</strong><br /><small>{l.code} · {l.edition} · {l.cost} per kit</small></div>
                <div className="qty">
                  <button onClick={() => set(l.id, l.qty - 1)} aria-label={`Remove one ${l.name}`}>−</button>
                  <span>{l.qty}</span>
                  <button onClick={() => set(l.id, l.qty + 1)} aria-label={`Add one ${l.name}`}>+</button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="drawer__list drawer__empty">
            <span className="mono" style={{ fontSize: 40 }}>⏚</span>
            Open circuit. Nothing in here yet.
          </div>
        )}
        <footer>
          <div className="total"><span>Parts cost, about</span><strong>${total}</strong></div>
          <a className={`btn btn--primary`} href={lines.length ? href : undefined} aria-disabled={!lines.length} style={{ justifyContent: 'center', pointerEvents: lines.length ? 'auto' : 'none', opacity: lines.length ? 1 : 0.45 }}>
            Send order request <span className="arrow">→</span>
          </a>
          <p className="note">Online payment isn't set up yet. This opens an email to the team with your list, and someone from the team will write back.</p>
        </footer>
      </aside>
    </>
  );
}
