import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Minus, Plus, ShoppingBag, Trash2, X } from 'lucide-react';
import { useCart } from '../lib/cart';
import { inr } from '../lib/format';

const FREE_SHIP_MIN = 1500;
const ring = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand';

export default function CartDrawer() {
  const { open, setOpen, lines, setQty, remove, subtotal } = useCart();
  const nav = useNavigate();
  useEffect(() => {
    if (!open) return;
    const h = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false);
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [open, setOpen]);

  return (
    <div className={`fixed inset-0 z-50 ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
      <div onClick={() => setOpen(false)} className={`absolute inset-0 bg-black/40 transition-opacity ${open ? 'opacity-100' : 'opacity-0'}`} />
      <aside role="dialog" aria-modal="true" aria-label="Shopping cart" inert={!open}
        className={`absolute right-0 top-0 flex h-full w-full max-w-md flex-col bg-white shadow-xl transition-transform duration-300 ${open ? 'translate-x-0' : 'translate-x-full'}`}>
        <header className="flex items-center justify-between border-b border-line p-4">
          <h2 className="text-lg font-bold">Your cart</h2>
          <button onClick={() => setOpen(false)} aria-label="Close cart" className={`rounded-full p-2 hover:bg-soft ${ring}`}><X size={20} /></button>
        </header>
        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 p-6 text-center text-muted">
            <ShoppingBag size={40} className="text-brand" aria-hidden />
            <p>Your cart is empty.</p>
            <button onClick={() => { setOpen(false); nav('/shop'); }} className={`rounded-full bg-brand px-5 py-2 font-semibold text-white hover:bg-brand-dark ${ring}`}>Start shopping</button>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y divide-line overflow-y-auto px-4">
              {lines.map(({ product: p, qty }) => (
                <li key={p.id} className="flex gap-3 py-4">
                  {p.image_url
                    ? <img src={p.image_url} alt="" className="h-16 w-16 rounded-lg object-cover" />
                    : <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-brand/15 font-display font-black text-brand" aria-hidden>{p.name.slice(0, 2).toUpperCase()}</div>}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold">{p.name}</p>
                    <p className="text-sm text-muted">{inr(p.selling_price)}</p>
                    <div className="mt-2 inline-flex items-center rounded-full border border-line">
                      <button onClick={() => qty > 1 ? setQty(p.id, qty - 1) : remove(p.id)} aria-label={`Decrease quantity of ${p.name}`} className={`p-1.5 ${ring}`}><Minus size={14} /></button>
                      <span className="w-8 text-center text-sm" aria-live="polite">{qty}</span>
                      <button onClick={() => setQty(p.id, qty + 1)} disabled={qty >= p.stock_level} aria-label={`Increase quantity of ${p.name}`} className={`p-1.5 disabled:opacity-30 ${ring}`}><Plus size={14} /></button>
                    </div>
                  </div>
                  <div className="flex flex-col items-end justify-between">
                    <button onClick={() => remove(p.id)} aria-label={`Remove ${p.name}`} className={`rounded p-1 text-muted hover:text-brand-dark ${ring}`}><Trash2 size={16} /></button>
                    <span className="text-sm font-semibold">{inr(p.selling_price * qty)}</span>
                  </div>
                </li>
              ))}
            </ul>
            <footer className="border-t border-line p-4">
              <p className="mb-2 text-sm text-muted">{subtotal >= FREE_SHIP_MIN ? 'You get free shipping' : `Add ${inr(FREE_SHIP_MIN - subtotal)} more for free shipping`}</p>
              <div className="mb-3 flex justify-between font-bold"><span>Subtotal</span><span>{inr(subtotal)}</span></div>
              <button onClick={() => { setOpen(false); nav('/checkout'); }} className={`w-full rounded-full bg-brand py-3 font-bold text-white hover:bg-brand-dark ${ring}`}>Checkout</button>
            </footer>
          </>
        )}
      </aside>
    </div>
  );
}
