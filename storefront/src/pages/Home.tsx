import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { getProducts } from '../lib/api';
import type { Product } from '../lib/types';
import ProductCard from '../components/ProductCard';

const tints = ['bg-brand/15', 'bg-sky/20', 'bg-sun/30'];
const ring = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand';

export default function Home() {
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState(false);
  const [tries, setTries] = useState(0);
  useEffect(() => {
    setError(false);
    getProducts().then(setProducts).catch(() => setError(true));
  }, [tries]);
  const cats = useMemo(() => [...new Set((products ?? []).map(p => p.category).filter(Boolean))] as string[], [products]);

  return (
    <>
      <section className="bg-soft">
        <div className="mx-auto max-w-6xl px-4 py-16 text-center sm:py-24">
          <h1 className="text-4xl font-black sm:text-6xl">Add a splash of <span className="text-brand">color</span> to everything</h1>
          <p className="mx-auto mt-4 max-w-xl text-muted">Playful, one-of-a-kind finds to wear, gift and collect.</p>
          <Link to="/shop" className={`mt-8 inline-block rounded-full bg-brand px-8 py-3 font-bold text-white hover:bg-brand-dark ${ring}`}>Shop now</Link>
        </div>
      </section>

      <div className="mx-auto max-w-6xl px-4">
        {error ? (
          <div role="alert" className="py-16 text-center">
            <p className="mb-4">We couldn't load products right now.</p>
            <button onClick={() => setTries(t => t + 1)} className={`rounded-full bg-brand px-6 py-2 font-semibold text-white ${ring}`}>Try again</button>
          </div>
        ) : !products ? (
          <div className="grid grid-cols-2 gap-4 py-12 md:grid-cols-4" aria-busy="true" aria-label="Loading products">
            {Array.from({ length: 8 }, (_, i) => <div key={i} className="aspect-square animate-pulse rounded-2xl bg-line" />)}
          </div>
        ) : (
          <>
            {cats.length > 0 && (
              <section aria-labelledby="cats" className="py-12">
                <h2 id="cats" className="mb-6 text-2xl font-black">Shop by category</h2>
                <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                  {cats.map((c, i) => (
                    <Link key={c} to={`/shop?category=${encodeURIComponent(c)}`} className={`flex h-28 items-center justify-center rounded-2xl p-4 text-center font-display text-lg font-bold transition hover:-translate-y-0.5 hover:shadow-md ${tints[i % 3]} ${ring}`}>{c}</Link>
                  ))}
                </div>
              </section>
            )}
            <section aria-labelledby="new" className="py-8">
              <div className="mb-6 flex items-end justify-between">
                <h2 id="new" className="text-2xl font-black">All products <span className="text-base font-semibold text-muted">({products.length})</span></h2>
                <Link to="/shop" className={`rounded text-sm font-semibold text-brand-dark hover:underline ${ring}`}>Browse &amp; filter</Link>
              </div>
              {products.length === 0 ? <p className="text-muted">New products coming soon.</p> : (
                <div className="grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-4">
                  {products.map(p => <ProductCard key={p.id} product={p} />)}
                </div>
              )}
            </section>
          </>
        )}

      </div>
    </>
  );
}
