import { useEffect, useRef, useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';

const ring = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand';
const arrowBtn = `absolute top-1/2 grid size-10 -translate-y-1/2 place-items-center rounded-full bg-white/90 text-ink shadow hover:bg-white ${ring}`;

// Remount with key={product.id} to reset to the first image.
export default function Gallery({ images, name }: { images: string[]; name: string }) {
  const [i, setI] = useState(0);
  const [open, setOpen] = useState(false);
  const [bad, setBad] = useState<Set<string>>(new Set());
  const opener = useRef<HTMLButtonElement>(null);
  const closeBtn = useRef<HTMLButtonElement>(null);
  const thumbs = useRef<(HTMLButtonElement | null)[]>([]);
  const n = images.length;
  const go = (d: number) => setI(c => (c + d + n) % n);
  const src = images[i];
  const placeholder = (
    <div className="grid size-full place-items-center font-display text-6xl font-black text-brand/40" role="img" aria-label="No image available">{name.charAt(0)}</div>
  );

  useEffect(() => { thumbs.current[i]?.scrollIntoView?.({ block: 'nearest', inline: 'center', behavior: 'smooth' }); }, [i]);

  useEffect(() => {
    if (!open) return;
    closeBtn.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
      else if (n > 1 && e.key === 'ArrowLeft') go(-1);
      else if (n > 1 && e.key === 'ArrowRight') go(1);
      else if (e.key === 'Tab') { e.preventDefault(); closeBtn.current?.focus(); } // ponytail: only focusable is Close/nav; trap on Close
    };
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; opener.current?.focus(); };
  }); // eslint-disable-line react-hooks/exhaustive-deps

  if (n === 0 || bad.has(src)) return <div className="aspect-square overflow-hidden rounded-3xl bg-soft">{placeholder}</div>;
  const onError = () => setBad(s => new Set(s).add(src));

  return (
    <div
      role="group" aria-roledescription="carousel" aria-label={`${name} images`} tabIndex={0}
      onKeyDown={e => { if (n > 1 && e.key === 'ArrowLeft') { e.preventDefault(); go(-1); } else if (n > 1 && e.key === 'ArrowRight') { e.preventDefault(); go(1); } }}
      className={`rounded-3xl ${ring}`}
    >
      <div className="relative aspect-square overflow-hidden rounded-3xl bg-soft">
        <button ref={opener} onClick={() => setOpen(true)} aria-label="Open image full screen" className={`size-full cursor-zoom-in ${ring}`}>
          <img key={src} src={src} alt={`${name} (image ${i + 1} of ${n})`} onError={onError} className="size-full object-contain" />
        </button>
        {n > 1 && <>
          <button onClick={() => go(-1)} aria-label="Previous image" className={`${arrowBtn} left-2`}><ChevronLeft className="size-5" /></button>
          <button onClick={() => go(1)} aria-label="Next image" className={`${arrowBtn} right-2`}><ChevronRight className="size-5" /></button>
        </>}
      </div>

      {n > 1 && (
        <div className="mt-3 flex snap-x gap-2 overflow-x-auto p-1 [scrollbar-width:thin]">
          {images.map((u, k) => (
            <button
              key={u} ref={el => { thumbs.current[k] = el; }} onClick={() => setI(k)}
              aria-label={`Show image ${k + 1} of ${n}`} aria-current={k === i ? 'true' : undefined}
              className={`size-16 shrink-0 snap-start overflow-hidden rounded-xl bg-soft sm:size-20 ${k === i ? 'ring-2 ring-brand' : 'opacity-70 hover:opacity-100'} ${ring}`}
            >
              {bad.has(u) ? <span className="grid size-full place-items-center text-xs text-muted" aria-hidden>?</span>
                : <img src={u} alt="" loading="lazy" decoding="async" onError={() => setBad(s => new Set(s).add(u))} className="size-full object-cover" />}
            </button>
          ))}
        </div>
      )}

      {open && (
        <div role="dialog" aria-modal="true" aria-label={`${name} image viewer`} onClick={() => setOpen(false)}
          className="fixed inset-0 z-50 grid place-items-center bg-black/90 p-4">
          <button ref={closeBtn} onClick={() => setOpen(false)} aria-label="Close" className={`absolute right-4 top-4 grid size-10 place-items-center rounded-full bg-white/90 text-ink ${ring}`}><X className="size-5" /></button>
          <img src={src} alt={`${name} (image ${i + 1} of ${n})`} onClick={e => e.stopPropagation()} onError={onError} className="max-h-full max-w-full object-contain" />
          {n > 1 && <>
            <button onClick={e => { e.stopPropagation(); go(-1); }} aria-label="Previous image" className={`${arrowBtn} left-4`}><ChevronLeft className="size-5" /></button>
            <button onClick={e => { e.stopPropagation(); go(1); }} aria-label="Next image" className={`${arrowBtn} right-4`}><ChevronRight className="size-5" /></button>
          </>}
        </div>
      )}
    </div>
  );
}
