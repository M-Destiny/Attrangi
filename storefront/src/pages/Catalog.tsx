import { useCallback, useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { ChevronLeft, ChevronRight, Download, Minimize2, X, ZoomIn } from 'lucide-react';

const PAGES = 89;
const PDF_URL = '/attrangii-products-catalogue.pdf';
const src = (n: number) => `/catalogue/page-${String(n).padStart(2, '0')}.jpg`;
const ring = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand';
const clamp = (n: number) => Math.min(PAGES, Math.max(1, n));

export default function Catalog() {
  const [params, setParams] = useSearchParams();
  const initial = clamp(Number(params.get('page')) || 1);
  const [current, setCurrent] = useState(initial);
  const [zoomPage, setZoomPage] = useState<number | null>(null);
  const [failed, setFailed] = useState<Set<number>>(new Set());
  const refs = useRef<(HTMLElement | null)[]>([]);

  const goTo = useCallback((n: number, smooth = true) => {
    refs.current[clamp(n)]?.scrollIntoView({ behavior: smooth ? 'smooth' : 'auto', block: 'start' });
  }, []);

  // Open at ?page=N once the page stack exists.
  useEffect(() => { if (initial > 1) requestAnimationFrame(() => goTo(initial, false)); }, [initial, goTo]);

  // Track which page crosses the middle of the screen.
  useEffect(() => {
    const io = new IntersectionObserver(es => {
      for (const e of es) if (e.isIntersecting) setCurrent(Number((e.target as HTMLElement).dataset.page));
    }, { rootMargin: '-45% 0px -45% 0px' });
    refs.current.forEach(el => el && io.observe(el));
    return () => io.disconnect();
  }, []);

  // Keep the URL shareable without adding history entries.
  useEffect(() => {
    const t = setTimeout(() => setParams(current > 1 ? { page: String(current) } : {}, { replace: true }), 300);
    return () => clearTimeout(t);
  }, [current, setParams]);

  return (
    <div className="pb-24">
      <section className="bg-soft">
        <div className="mx-auto max-w-3xl px-4 py-8 text-center">
          <h1 className="text-3xl font-black sm:text-4xl">Product catalogue</h1>
          <p className="mx-auto mt-2 max-w-md text-muted">Browse everything we have, page by page. Tap a page to zoom in.</p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <a href={PDF_URL} download className={`inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 font-semibold text-white hover:bg-brand-dark ${ring}`}>
              <Download className="size-4" aria-hidden /> Download PDF
            </a>
            <Link to="/shop" className={`rounded-full border-2 border-ink px-5 py-2 font-semibold hover:bg-ink hover:text-white ${ring}`}>Shop online</Link>
          </div>
        </div>
      </section>

      <ol className="mx-auto mt-6 flex max-w-xl flex-col gap-4 px-3 sm:gap-6">
        {Array.from({ length: PAGES }, (_, i) => i + 1).map(n => (
          <li key={n} ref={el => { refs.current[n] = el; }} data-page={n} className="scroll-mt-20">
            <button type="button" onClick={() => setZoomPage(n)} aria-label={`Open page ${n} of ${PAGES} full screen`}
              className={`group relative block w-full overflow-hidden rounded-2xl bg-soft shadow-sm ${ring}`} style={{ aspectRatio: '4 / 5' }}>
              {failed.has(n)
                ? <span className="grid size-full place-items-center p-4 text-sm text-muted">Couldn't load page {n}. Tap to retry.</span>
                : <img src={src(n)} alt={`Catalogue page ${n}`} width={900} height={1125} loading={n <= 2 ? 'eager' : 'lazy'} decoding="async"
                    onError={() => setFailed(s => new Set(s).add(n))} className="size-full object-cover" />}
              <span className="absolute right-2 top-2 grid size-8 place-items-center rounded-full bg-white/90 text-ink opacity-0 shadow transition group-hover:opacity-100 group-focus-visible:opacity-100"><ZoomIn className="size-4" aria-hidden /></span>
            </button>
          </li>
        ))}
      </ol>

      <nav aria-label="Catalogue pages" className="fixed inset-x-0 bottom-3 z-30 mx-auto flex w-fit max-w-[calc(100%-1.5rem)] items-center gap-1 rounded-full bg-ink/90 p-1.5 text-white shadow-lg backdrop-blur">
        <button type="button" onClick={() => goTo(current - 1)} disabled={current <= 1} aria-label="Previous page" className={`grid size-10 place-items-center rounded-full hover:bg-white/15 disabled:opacity-40 ${ring}`}><ChevronLeft className="size-5" /></button>
        <label className="flex items-center gap-2 px-1 text-sm font-semibold">
          <span className="sr-only">Jump to page</span>
          <select value={current} onChange={e => goTo(Number(e.target.value))} className="rounded-full bg-white/15 py-2 pl-3 pr-2 text-sm font-semibold text-white outline-none focus-visible:ring-2 focus-visible:ring-white">
            {Array.from({ length: PAGES }, (_, i) => i + 1).map(n => <option key={n} value={n} className="text-ink">Page {n}</option>)}
          </select>
          <span aria-hidden className="pr-1 text-white/70">/ {PAGES}</span>
        </label>
        <button type="button" onClick={() => goTo(current + 1)} disabled={current >= PAGES} aria-label="Next page" className={`grid size-10 place-items-center rounded-full hover:bg-white/15 disabled:opacity-40 ${ring}`}><ChevronRight className="size-5" /></button>
      </nav>

      {zoomPage !== null && <Viewer page={zoomPage} onPage={setZoomPage} onClose={() => { goTo(zoomPage, false); setZoomPage(null); }} />}
    </div>
  );
}

function Viewer({ page, onPage, onClose }: { page: number; onPage: (n: number) => void; onClose: () => void }) {
  const [zoomed, setZoomed] = useState(false);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const touchX = useRef<number | null>(null);
  const go = useCallback((d: number) => { setZoomed(false); onPage(clamp(page + d)); }, [page, onPage]);

  useEffect(() => {
    closeBtn.current?.focus();
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const h = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
      else if (e.key === 'ArrowLeft') go(-1);
      else if (e.key === 'ArrowRight') go(1);
    };
    window.addEventListener('keydown', h);
    return () => { window.removeEventListener('keydown', h); document.body.style.overflow = prevOverflow; };
  }, [go, onClose]);

  // Preload neighbours so swiping feels instant.
  useEffect(() => { [page - 1, page + 1].filter(n => n >= 1 && n <= PAGES).forEach(n => { new Image().src = src(n); }); }, [page]);

  return (
    <div role="dialog" aria-modal="true" aria-label={`Catalogue page ${page} of ${PAGES}`} className="fixed inset-0 z-50 flex flex-col bg-black/95">
      <div className="flex items-center justify-between px-3 py-2 text-white">
        <span className="text-sm font-semibold">Page {page} / {PAGES}</span>
        <div className="flex gap-1">
          <button type="button" onClick={() => setZoomed(z => !z)} aria-label={zoomed ? 'Fit to screen' : 'Zoom in'} className="grid size-10 place-items-center rounded-full hover:bg-white/15">{zoomed ? <Minimize2 className="size-5" /> : <ZoomIn className="size-5" />}</button>
          <button ref={closeBtn} type="button" onClick={onClose} aria-label="Close" className="grid size-10 place-items-center rounded-full hover:bg-white/15"><X className="size-5" /></button>
        </div>
      </div>
      <div className="relative min-h-0 flex-1 overflow-auto"
        style={{ touchAction: zoomed ? 'pan-x pan-y' : 'pan-y pinch-zoom' }}
        onTouchStart={e => { touchX.current = e.touches[0].clientX; }}
        onTouchEnd={e => {
          if (zoomed || touchX.current === null) return;
          const dx = e.changedTouches[0].clientX - touchX.current; touchX.current = null;
          if (Math.abs(dx) > 60) go(dx < 0 ? 1 : -1);
        }}>
        <div className={`mx-auto flex min-h-full items-center justify-center ${zoomed ? 'w-[220%] max-w-none sm:w-[160%]' : 'w-full'}`}>
          <img src={src(page)} alt={`Catalogue page ${page}`} className={zoomed ? 'w-full' : 'max-h-full max-w-full object-contain'} style={zoomed ? undefined : { maxHeight: 'calc(100dvh - 3.5rem)' }} />
        </div>
        {!zoomed && page > 1 && <button type="button" onClick={() => go(-1)} aria-label="Previous page" className="absolute left-2 top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-white/20 text-white hover:bg-white/30 sm:grid"><ChevronLeft /></button>}
        {!zoomed && page < PAGES && <button type="button" onClick={() => go(1)} aria-label="Next page" className="absolute right-2 top-1/2 hidden size-11 -translate-y-1/2 place-items-center rounded-full bg-white/20 text-white hover:bg-white/30 sm:grid"><ChevronRight /></button>}
      </div>
    </div>
  );
}
