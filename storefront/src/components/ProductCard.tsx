import { Link } from 'react-router-dom';
import { Minus, Plus } from 'lucide-react';
import { useCart } from '../lib/cart';
import { inr } from '../lib/format';
import type { Product } from '../lib/types';

export default function ProductCard({ product: p }: { product: Product }) {
  const { add, lines, setQty, remove } = useCart();
  const out = p.stock_level < 1;
  const inCart = lines.find(l => l.product.id === p.id)?.qty ?? 0;
  const initials = p.name.split(/\s+/).slice(0, 2).map(w => w[0]).join('').toUpperCase();
  return (
    <article className="group relative flex flex-col">
      <Link to={`/product/${p.id}`} className="block rounded-2xl focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">
        <div className="relative aspect-square overflow-hidden rounded-2xl bg-soft">
          {p.image_url ? (
            <img src={p.image_url} alt={p.name} loading="lazy" className={`h-full w-full object-cover transition duration-300 group-hover:scale-105 ${out ? 'opacity-60' : ''}`} />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-brand/15 font-display text-4xl font-black text-brand" aria-hidden>{initials}</div>
          )}
          {(out || p.stock_level <= 5) && (
            <span className={`absolute left-2 top-2 rounded-full px-2.5 py-1 text-xs font-semibold ${out ? 'bg-ink text-white' : 'bg-sun text-ink'}`}>
              {out ? 'Out of stock' : `Only ${p.stock_level} left`}
            </span>
          )}
        </div>
        <div className="mt-3 pr-12">
          {p.category && <p className="text-xs uppercase tracking-wide text-muted">{p.category}</p>}
          <h3 className="line-clamp-2 text-sm font-bold">{p.name}</h3>
          <p className="mt-1 font-semibold text-brand-dark">{inr(p.selling_price)}</p>
        </div>
      </Link>
      {inCart > 0 ? (
        <div role="group" aria-label={`${p.name} quantity in cart`} className="absolute bottom-0 right-0 flex h-9 items-center rounded-full bg-brand text-white shadow">
          <button type="button" onClick={() => (inCart > 1 ? setQty(p.id, inCart - 1) : remove(p.id))} aria-label={inCart > 1 ? `Remove one ${p.name}` : `Remove ${p.name} from cart`}
            className="flex h-9 w-8 items-center justify-center rounded-full hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"><Minus size={16} aria-hidden /></button>
          <span className="min-w-5 text-center text-sm font-bold" aria-live="polite">{inCart}</span>
          <button type="button" disabled={inCart >= p.stock_level} onClick={() => add(p)} aria-label={`Add one more ${p.name}`}
            className="flex h-9 w-8 items-center justify-center rounded-full hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:opacity-40"><Plus size={16} aria-hidden /></button>
        </div>
      ) : (
        <button
          type="button" disabled={out} onClick={() => add(p)} aria-label={out ? `${p.name} is out of stock` : `Add ${p.name} to cart`}
          className="absolute bottom-0 right-0 flex h-10 w-10 items-center justify-center rounded-full bg-brand text-white transition hover:bg-brand-dark focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:bg-line disabled:text-muted"
        >
          <Plus size={20} aria-hidden />
        </button>
      )}
    </article>
  );
}
