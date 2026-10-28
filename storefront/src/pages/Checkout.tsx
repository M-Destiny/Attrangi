import { useEffect, useState, type FormEvent } from 'react';
import type { Quote } from '../lib/types';
import { useAuth } from '../lib/auth';
import { Link, useNavigate } from 'react-router-dom';
import { Minus, Plus, Trash2 } from 'lucide-react';
import { useCart } from '../lib/cart';
import { getMyAccount, placeOrder, quoteOrder } from '../lib/api';
import { inr } from '../lib/format';
import { notifyNewOrder } from '../lib/notify';

const field = 'mt-1 w-full rounded-lg border border-line px-3 py-2.5 text-base focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 aria-[invalid=true]:border-red-500';
const cleanPhone = (p: string) => p.replace(/[\s-]/g, '').replace(/^(\+91|0)/, '');

export default function Checkout() {
  const { lines, subtotal, setQty, remove, clear } = useCart();
  const nav = useNavigate();
  const [f, setF] = useState({ name: '', phone: '', email: '', address: '' });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [serverErr, setServerErr] = useState('');
  const [busy, setBusy] = useState(false);
  const { session } = useAuth();
  const uid = session?.user.id, mail = session?.user.email ?? '';
  // prefill once per user; only fills fields still empty
  useEffect(() => {
    if (!uid) return;
    let live = true;
    getMyAccount().then(({ customer: c }) => live && setF(s => ({
      name: s.name || c?.name || '', phone: s.phone || c?.phone || '',
      email: s.email || c?.email || mail, address: s.address || c?.address || '',
    }))).catch(() => live && setF(s => ({ ...s, email: s.email || mail })));
    return () => { live = false; };
  }, [uid, mail]);
  const [code, setCode] = useState(''), [codeIn, setCodeIn] = useState('');
  const [q, setQ] = useState<Quote | null>(null);
  const qPhone = cleanPhone(f.phone);
  const phoneOk = /^[6-9]\d{9}$/.test(qPhone) ? qPhone : '';
  // debounced re-quote; cleanup flag drops stale responses
  useEffect(() => {
    if (!lines.length) return;
    let live = true;
    const t = setTimeout(() => {
      quoteOrder(lines, code, phoneOk).then(r => live && setQ(r)).catch(() => live && setQ(null));
    }, 400);
    return () => { live = false; clearTimeout(t); };
  }, [lines, code, phoneOk]);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF(s => ({ ...s, [k]: e.target.value }));

  if (!lines.length) return (
    <main className="mx-auto max-w-md px-4 py-20 text-center">
      <h1 className="text-2xl font-bold">Your cart is empty</h1>
      <Link to="/shop" className="mt-6 inline-block rounded-full bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark">Continue shopping</Link>
    </main>
  );

  async function submit(e: FormEvent) {
    e.preventDefault();
    const phone = cleanPhone(f.phone), v: Record<string, string> = {};
    if (!f.name.trim()) v.name = 'Please enter your name';
    if (!/^[6-9]\d{9}$/.test(phone)) v.phone = 'Enter a valid 10-digit mobile number';
    if (f.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) v.email = 'Enter a valid email address';
    if (!f.address.trim()) v.address = 'Please enter your delivery address';
    setErrs(v); setServerErr('');
    if (Object.keys(v).length) return;
    setBusy(true);
    try {
      const r = await placeOrder({ name: f.name.trim(), phone, email: f.email.trim(), address: f.address.trim() }, lines, q?.coupon_code ?? undefined);
      notifyNewOrder(r.invoice_number, phone);
      clear();
      nav(`/order/${r.invoice_number}`, { state: { ...r, phone } });
    } catch (err) {
      setServerErr(err instanceof Error ? err.message : 'Could not place order. Please try again.');
      setBusy(false);
    }
  }

  const input = (k: keyof typeof f, label: string, opts: React.InputHTMLAttributes<HTMLInputElement> = {}, req = true) => (
    <div>
      <label htmlFor={k} className="text-sm font-medium">{label}{req && <span aria-hidden className="text-brand-dark"> *</span>}</label>
      <input id={k} value={f[k]} onChange={set(k)} required={req} aria-invalid={!!errs[k]} aria-describedby={errs[k] ? `${k}-e` : undefined} className={field} {...opts} />
      {errs[k] && <p id={`${k}-e`} className="mt-1 text-sm text-red-600">{errs[k]}</p>}
    </div>
  );

  return (
    <main className="mx-auto max-w-5xl px-4 py-8">
      <h1 className="text-3xl font-bold">Checkout</h1>
      <div className="mt-6 grid gap-8 md:grid-cols-[1fr_380px]">
        <form onSubmit={submit} noValidate className="order-2 space-y-4 md:order-1">
          {input('name', 'Full name', { autoComplete: 'name' })}
          {input('phone', 'Mobile number', { type: 'tel', inputMode: 'numeric', autoComplete: 'tel', placeholder: '10-digit mobile' })}
          {input('email', 'Email (optional)', { type: 'email', autoComplete: 'email' }, false)}
          <div>
            <label htmlFor="address" className="text-sm font-medium">Delivery address<span aria-hidden className="text-brand-dark"> *</span></label>
            <textarea id="address" rows={3} value={f.address} onChange={set('address')} required aria-invalid={!!errs.address} aria-describedby={errs.address ? 'address-e' : undefined} autoComplete="street-address" className={field} />
            {errs.address && <p id="address-e" className="mt-1 text-sm text-red-600">{errs.address}</p>}
          </div>
          {serverErr && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{serverErr}</p>}
          <button disabled={busy} className="w-full rounded-full bg-brand py-3.5 font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
            {busy ? 'Placing order…' : `Place order · ${inr(q?.total ?? subtotal)}`}
          </button>
        </form>
        <section aria-label="Order summary" className="order-1 h-fit rounded-2xl border border-line p-4 md:order-2">
          <h2 className="text-lg font-bold">Order summary</h2>
          <ul className="mt-3 divide-y divide-line">
            {lines.map(({ product: p, qty }) => (
              <li key={p.id} className="flex gap-3 py-3">
                {p.image_url ? <img src={p.image_url} alt="" className="h-16 w-16 rounded-lg object-cover" /> : <div className="h-16 w-16 rounded-lg bg-soft" />}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">{p.name}</p>
                  <p className="text-sm text-muted">{inr(p.selling_price)}</p>
                  <div className="mt-1 flex items-center gap-2">
                    <button type="button" aria-label={`Decrease quantity of ${p.name}`} disabled={qty <= 1} onClick={() => setQty(p.id, qty - 1)} className="rounded border border-line p-1 disabled:opacity-40"><Minus size={14} /></button>
                    <span aria-live="polite" className="w-6 text-center text-sm">{qty}</span>
                    <button type="button" aria-label={`Increase quantity of ${p.name}`} disabled={qty >= p.stock_level} onClick={() => setQty(p.id, qty + 1)} className="rounded border border-line p-1 disabled:opacity-40"><Plus size={14} /></button>
                    <button type="button" aria-label={`Remove ${p.name}`} onClick={() => remove(p.id)} className="ml-auto p-1 text-muted hover:text-red-600"><Trash2 size={16} /></button>
                  </div>
                </div>
                <p className="text-sm font-semibold">{inr(p.selling_price * qty)}</p>
              </li>
            ))}
          </ul>
          <details open={!!code} className="mt-2 border-t border-line pt-3">
            <summary className="cursor-pointer text-sm font-medium">Have a coupon?</summary>
            {q?.coupon_code ? (
              <p className="mt-2 flex items-center justify-between text-sm">
                <span>Applied: <b>{q.coupon_code}</b></span>
                <button type="button" onClick={() => { setCode(''); setCodeIn(''); }} className="text-brand-dark underline">Remove</button>
              </p>
            ) : (
              <div className="mt-2 flex gap-2">
                <label htmlFor="coupon" className="sr-only">Coupon code</label>
                <input id="coupon" value={codeIn} onChange={e => setCodeIn(e.target.value.toUpperCase())} autoComplete="off" aria-invalid={!!q?.coupon_error} aria-describedby={q?.coupon_error ? 'coupon-e' : undefined}
                  onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); setCode(codeIn.trim()); } }} className="min-w-0 flex-1 rounded-lg border border-line px-3 py-2 text-sm uppercase focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30" />
                <button type="button" disabled={!codeIn.trim()} onClick={() => setCode(codeIn.trim())} className="rounded-lg border border-line px-4 text-sm font-semibold hover:bg-soft disabled:opacity-50">Apply</button>
              </div>
            )}
            {q?.coupon_error && <p id="coupon-e" role="alert" className="mt-1 text-sm text-red-600">{q.coupon_error}</p>}
          </details>
          <dl className="mt-3 space-y-1 border-t border-line pt-3 text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{inr(q?.subtotal ?? subtotal)}</dd></div>
            {!!q?.discount && <div className="flex justify-between text-green-700"><dt>Coupon discount{q.coupon_code && ` (${q.coupon_code})`}</dt><dd>-{inr(q.discount)}</dd></div>}
            {q && <div className="flex justify-between"><dt>Shipping</dt><dd>{q.shipping > 0 ? inr(q.shipping) : 'Free'}</dd></div>}
            <div className="flex justify-between border-t border-line pt-2 text-base font-bold"><dt>Total</dt><dd>{inr(q?.total ?? subtotal)}</dd></div>
          </dl>
          {q && q.shipping > 0 && <p className="mt-2 text-sm text-muted">Add {inr(Math.max(0, q.free_shipping_threshold - (q.subtotal - q.discount)))} more for free shipping</p>}
        </section>
      </div>
    </main>
  );
}
