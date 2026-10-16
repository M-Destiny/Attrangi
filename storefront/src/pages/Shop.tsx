import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search } from 'lucide-react';
import { getProducts } from '../lib/api';
import type { Product } from '../lib/types';
import ProductCard from '../components/ProductCard';

const chip = (on: boolean) =>
  `rounded-full border px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-brand ${
    on ? 'border-brand bg-brand text-white' : 'border-line bg-white text-ink hover:border-brand'}`;

export default function Shop() {
  const [params, setParams] = useSearchParams();
  const [products, setProducts] = useState<Product[] | null>(null);
  const [error, setError] = useState('');
  const [sort, setSort] = useState('newest');
  const [inStock, setInStock] = useState(false);
  const category = params.get('category') ?? '';
  const q = params.get('q') ?? '';

  useEffect(() => {
    getProducts().then(setProducts).catch(e => setError(e?.message || 'Could not load products'));
  }, []);

  const setParam = (k: string, v: string) =>
    setParams(p => { const n = new URLSearchParams(p); v ? n.set(k, v) : n.delete(k); return n; }, { replace: true });

  const categories = useMemo(() => [...new Set((products ?? []).map(p => p.category).filter(Boolean) as string[])].sort(), [products]);

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    const list = (products ?? []).filter(p =>
      (!category || p.category === category) && (!inStock || p.stock_level > 0) &&
      (!t || [p.name, p.brand, p.sku, p.category].some(s => s?.toLowerCase().includes(t))));
    if (sort === 'low') list.sort((a, b) => a.selling_price - b.selling_price);
    if (sort === 'high') list.sort((a, b) => b.selling_price - a.selling_price);
    return list;
  }, [products, category, q, sort, inStock]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <h1 className="text-3xl font-black sm:text-4xl">Shop</h1>

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <label className="relative flex-1">
          <span className="sr-only">Search products</span>
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted" aria-hidden />
          <input type="search" value={q} onChange={e => setParam('q', e.target.value)} placeholder="Search products…"
            className="w-full rounded-full border border-line bg-white py-2.5 pl-10 pr-4 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30" />
        </label>
        <label className="flex items-center gap-2 text-sm">
          <span className="sr-only sm:not-sr-only text-muted">Sort</span>
          <select value={sort} onChange={e => setSort(e.target.value)}
            className="rounded-full border border-line bg-white px-4 py-2.5 text-sm focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30">
            <option value="newest">Newest</option>
            <option value="low">Price: low to high</option>
            <option value="high">Price: high to low</option>
          </select>
        </label>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2" role="group" aria-label="Category">
        <button className={chip(!category)} aria-pressed={!category} onClick={() => setParam('category', '')}>All</button>
        {categories.map(c => (
          <button key={c} className={chip(category === c)} aria-pressed={category === c} onClick={() => setParam('category', c)}>{c}</button>
        ))}
        <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm">
          <input type="checkbox" checked={inStock} onChange={e => setInStock(e.target.checked)} className="size-4 accent-brand" />
          In stock only
        </label>
      </div>

      {error ? (
        <p role="alert" className="mt-10 rounded-2xl bg-soft p-8 text-center text-muted">Something went wrong: {error}</p>
      ) : !products ? (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4" aria-busy="true" aria-label="Loading products">
          {Array.from({ length: 8 }, (_, i) => (
            <div key={i} className="animate-pulse">
              <div className="aspect-square rounded-2xl bg-soft" />
              <div className="mt-3 h-4 w-3/4 rounded bg-soft" />
              <div className="mt-2 h-4 w-1/3 rounded bg-soft" />
            </div>
          ))}
        </div>
      ) : (
        <>
          <p className="mt-6 text-sm text-muted" aria-live="polite">{shown.length} {shown.length === 1 ? 'product' : 'products'}</p>
          {shown.length ? (
            <div className="mt-4 grid grid-cols-2 gap-4 sm:gap-6 md:grid-cols-3 lg:grid-cols-4">
              {shown.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          ) : (
            <div className="mt-6 rounded-2xl bg-soft p-10 text-center">
              <p className="font-display text-lg font-bold">No products found</p>
              <p className="mt-1 text-sm text-muted">Try a different search or category.</p>
              <button className="mt-4 rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white hover:bg-brand-dark"
                onClick={() => { setParams({}, { replace: true }); setInStock(false); }}>Clear filters</button>
            </div>
          )}
        </>
      )}
    </main>
  );
}
