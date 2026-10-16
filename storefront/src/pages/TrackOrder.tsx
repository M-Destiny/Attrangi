import { useState, type FormEvent } from 'react';
import { useSearchParams } from 'react-router-dom';
import { trackOrder } from '../lib/api';
import OrderTracking from '../components/OrderTracking';
import type { TrackedOrder } from '../lib/types';

const field = 'mt-1 w-full rounded-lg border border-line px-3 py-2.5 text-base focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30';

export default function TrackOrder() {
  const [sp] = useSearchParams();
  const [invoice, setInvoice] = useState(sp.get('invoice') ?? '');
  const [phone, setPhone] = useState('');
  const [order, setOrder] = useState<TrackedOrder | null>(null);
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setBusy(true); setMsg(''); setOrder(null);
    try {
      const o = await trackOrder(invoice.trim(), phone.replace(/[\s-]/g, '').replace(/^(\+91|0)/, ''));
      if (o) setOrder(o); else setMsg("We couldn't find that order. Please check the order number and phone number.");
    } catch (err) { setMsg(err instanceof Error ? err.message : 'Something went wrong. Please try again.'); }
    setBusy(false);
  }

  return (
    <main className="mx-auto max-w-lg px-4 py-10">
      <h1 className="text-3xl font-bold">Track your order</h1>
      <form onSubmit={submit} className="mt-6 space-y-4">
        <div>
          <label htmlFor="inv" className="text-sm font-medium">Order number</label>
          <input id="inv" required value={invoice} onChange={e => setInvoice(e.target.value)} className={field} />
        </div>
        <div>
          <label htmlFor="ph" className="text-sm font-medium">Phone number</label>
          <input id="ph" required type="tel" inputMode="numeric" autoComplete="tel" value={phone} onChange={e => setPhone(e.target.value)} className={field} />
        </div>
        <button disabled={busy} className="w-full rounded-full bg-brand py-3.5 font-semibold text-white hover:bg-brand-dark disabled:opacity-60">{busy ? 'Checking…' : 'Track order'}</button>
      </form>
      {msg && <p role="alert" className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{msg}</p>}
      {order && (
        <section aria-label="Order status" className="mt-8 rounded-2xl border border-line p-5">
          <div className="flex justify-between text-sm"><span className="font-semibold">{order.invoice_number}</span><span className="text-muted">{new Date(order.issue_date).toLocaleDateString('en-IN', { dateStyle: 'medium' })}</span></div>
          <div className="mt-5"><OrderTracking order={order} /></div>
        </section>
      )}
    </main>
  );
}
