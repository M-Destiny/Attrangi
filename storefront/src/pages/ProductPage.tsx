import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ChevronRight, Minus, Plus } from 'lucide-react';
import { getProduct, getProducts } from '../lib/api';
import { useCart } from '../lib/cart';
import { inr } from '../lib/format';
import type { Product } from '../lib/types';
import Gallery from '../components/Gallery';
import ProductCard from '../components/ProductCard';

export default function ProductPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { add } = useCart();
  const [product, setProduct] = useState<Product | null | undefined>(undefined); // undefined = loading
  const [related, setRelated] = useState<Product[]>([]);
  const [error, setError] = useState('');
  const [qty, setQty] = useState(1);

  useEffect(() => {
    let live = true;
    setProduct(undefined); setError(''); setQty(1); setRelated([]);
    getProduct(id).then(p => {
      if (!live) return;
      setProduct(p);
      if (p?.category) getProducts().then(all => live &&
        setRelated(all.filter(x => x.category === p.category && x.id !== p.id).slice(0, 4))).catch(() => {});
    }).catch(e => live && setError(e?.message || 'Could not load product'));
    window.scrollTo(0, 0);
    return () => { live = false; };
  }, [id]);

  if (error) return <p role="alert" className="mx-auto max-w-xl p-12 text-center text-muted">Something went wrong: {error}</p>;
  if (product === undefined) return (
    <div className="mx-auto grid max-w-6xl animate-pulse gap-8 px-4 py-8 md:grid-cols-2" aria-busy="true">
      <div className="aspect-square rounded-3xl bg-soft" />
      <div className="space-y-4"><div className="h-8 w-2/3 rounded bg-soft" /><div className="h-6 w-1/4 rounded bg-soft" /><div className="h-12 rounded bg-soft" /></div>
    </div>
  );
  if (!product) return (
    <div className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="text-3xl font-black">Product not found</h1>
      <p className="mt-2 text-muted">It may have been removed or the link is wrong.</p>
      <Link to="/shop" className="mt-6 inline-block rounded-full bg-brand px-6 py-2.5 font-semibold text-white hover:bg-brand-dark">Back to shop</Link>
    </div>
  );

  const stock = product.stock_level;
  const out = stock < 1;
  const step = (d: number) => setQty(q => Math.max(1, Math.min(stock, q + d)));
  const btn = 'rounded-full px-6 py-3 font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand disabled:cursor-not-allowed disabled:opacity-50';

  return (
    <main className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-10">
      <nav aria-label="Breadcrumb" className="mb-6 flex items-center gap-1 text-sm text-muted">
        <Link to="/shop" className="hover:text-brand-dark">Shop</Link>
        <ChevronRight className="size-4" aria-hidden />
        <span className="truncate text-ink" aria-current="page">{product.name}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2 md:gap-12">
        <Gallery key={product.id} name={product.name} images={product.images?.length ? product.images : product.image_url ? [product.image_url] : []} />

        <div>
          {product.brand && <p className="text-sm font-semibold uppercase tracking-wide text-sky">{product.brand}</p>}
          <h1 className="mt-1 text-3xl font-black sm:text-4xl">{product.name}</h1>
          <p className="mt-4 font-display text-3xl font-bold">{inr(product.selling_price)}</p>
          <p className={`mt-2 text-sm font-medium ${out ? 'text-red-600' : stock <= 5 ? 'text-orange-600' : 'text-green-700'}`}>
            {out ? 'Out of stock' : stock <= 5 ? `Only ${stock} left` : 'In stock'}
          </p>

          {!out && (
            <div className="mt-6 flex items-center gap-3">
              <span id="qty-label" className="text-sm font-medium">Quantity</span>
              <div className="flex items-center rounded-full border border-line" role="group" aria-labelledby="qty-label">
                <button aria-label="Decrease quantity" disabled={qty <= 1} onClick={() => step(-1)} className="grid size-10 place-items-center rounded-full hover:bg-soft disabled:opacity-40"><Minus className="size-4" /></button>
                <output aria-live="polite" className="w-10 text-center font-semibold">{qty}</output>
                <button aria-label="Increase quantity" disabled={qty >= stock} onClick={() => step(1)} className="grid size-10 place-items-center rounded-full hover:bg-soft disabled:opacity-40"><Plus className="size-4" /></button>
              </div>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <button disabled={out} onClick={() => add(product, qty)} className={`${btn} bg-brand text-white hover:bg-brand-dark`}>{out ? 'Sold out' : 'Add to cart'}</button>
            <button disabled={out} onClick={() => { add(product, qty); navigate('/checkout'); }} className={`${btn} border-2 border-ink text-ink hover:bg-ink hover:text-white`}>Buy now</button>
          </div>

          <dl className="mt-8 grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 border-t border-line pt-6 text-sm">
            <dt className="text-muted">SKU</dt><dd>{product.sku}</dd>
            {product.category && <><dt className="text-muted">Category</dt><dd><Link className="hover:text-brand-dark" to={`/shop?category=${encodeURIComponent(product.category)}`}>{product.category}</Link></dd></>}
          </dl>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-16" aria-labelledby="related">
          <h2 id="related" className="text-2xl font-black">You may also like</h2>
          <div className="mt-6 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-4">
            {related.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>
      )}
    </main>
  );
}
