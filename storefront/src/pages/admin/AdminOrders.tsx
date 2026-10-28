import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { RefreshCw, X } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { adminOrders, adminSetStatus, adminUpdateFulfilment } from '../../lib/api';
import { SHIPPING_LABEL, SHIPPING_STEPS, PAYMENT_LABEL, PAYMENT_METHODS } from '../../lib/orderStatus';
import { inr } from '../../lib/format';
import { notifyStatus } from '../../lib/notify';
import type { AdminOrder, ShippingStatus } from '../../lib/types';

const STATUSES = ['unpaid', 'paid', 'partially_paid', 'overdue', 'cancelled'];
const label = (s: string) => s.replace('_', ' ');
const tone: Record<string, string> = {
  unpaid: 'bg-amber-100 text-amber-800', paid: 'bg-green-100 text-green-800',
  partially_paid: 'bg-sky-100 text-sky-800', overdue: 'bg-red-100 text-red-800', cancelled: 'bg-gray-200 text-gray-700',
};
const Badge = ({ s }: { s: string }) => (
  <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold capitalize ${tone[s] ?? 'bg-gray-100'}`}>{PAYMENT_LABEL[s] ?? label(s)}</span>
);
const ShipBadge = ({ s }: { s: ShippingStatus }) => (
  <span className="inline-block rounded-full px-2.5 py-0.5 text-xs font-semibold bg-indigo-50 text-indigo-800">{SHIPPING_LABEL[s] ?? s}</span>
);
const SHIP_ALL = Object.keys(SHIPPING_LABEL) as ShippingStatus[];
const date = (d: string) => new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

export default function AdminOrders() {
  const { session, ready, isStaff, signOut } = useAuth();
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filter, setFilter] = useState('all');
  const [shipFilter, setShipFilter] = useState('all');
  const [q, setQ] = useState('');
  const [openId, setOpenId] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setOrders(await adminOrders()); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to load orders'); }
    finally { setLoading(false); }
  }, []);
  const allowed = ready && !!session && isStaff;
  useEffect(() => { if (allowed) load(); }, [allowed, load]);

  const stats = useMemo(() => ({
    total: orders.length,
    unpaid: orders.filter(o => o.status === 'unpaid').length,
    revenue: orders.filter(o => o.status === 'paid').reduce((a, o) => a + Number(o.total), 0),
    cancelled: orders.filter(o => o.status === 'cancelled').length,
  }), [orders]);

  const shown = useMemo(() => {
    const t = q.trim().toLowerCase();
    return orders.filter(o => (filter === 'all' || o.status === filter) && (shipFilter === 'all' || o.shipping_status === shipFilter) &&
      (!t || o.invoice_number.toLowerCase().includes(t) || o.customer?.name?.toLowerCase().includes(t) || o.customer?.phone?.includes(t)));
  }, [orders, filter, shipFilter, q]);

  if (!ready) return <div className="p-6 max-w-6xl mx-auto animate-pulse space-y-4" aria-busy="true"><div className="h-10 bg-gray-100 rounded" /><div className="h-24 bg-gray-100 rounded" /><div className="h-64 bg-gray-100 rounded" /></div>;
  if (!session || !isStaff) return <Navigate to="/admin/login" replace />;

  const open = orders.find(o => o.id === openId) ?? null;
  const cards = [['Total orders', stats.total], ['Unpaid', stats.unpaid], ['Paid revenue', inr(stats.revenue)], ['Cancelled', stats.cancelled]];

  return (
    <div className="min-h-screen bg-soft">
      <header className="bg-white border-b border-line">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="text-xl font-black mr-auto">Orders</h1>
          <span className="text-sm text-muted truncate max-w-[14rem]">{session.user.email}</span>
          <nav aria-label="Admin" className="flex gap-3 text-sm">
            <Link to="/admin" aria-current="page" className="font-semibold underline underline-offset-4">Orders</Link>
            <Link to="/admin/coupons" className="text-brand-dark hover:underline">Coupons</Link>
          </nav>
          <Link to="/" className="text-sm text-brand-dark hover:underline">Storefront</Link>
          <button onClick={() => signOut()} className="text-sm rounded-lg border border-line px-3 py-1.5 hover:bg-soft">Sign out</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-5">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {cards.map(([k, v]) => (
            <div key={k} className="rounded-xl bg-white border border-line p-4">
              <div className="text-xs text-muted">{k}</div>
              <div className="text-2xl font-bold font-display">{v}</div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div role="group" aria-label="Filter by status" className="flex flex-wrap gap-2 mr-auto">
            {['all', ...STATUSES].map(s => (
              <button key={s} onClick={() => setFilter(s)} aria-pressed={filter === s}
                className={`rounded-full px-3 py-1 text-sm capitalize border ${filter === s ? 'bg-brand text-white border-brand' : 'bg-white border-line hover:border-brand'}`}>{label(s)}</button>
            ))}
          </div>
          <input type="search" aria-label="Search orders" placeholder="Order no, name, phone" value={q} onChange={e => setQ(e.target.value)}
            className="rounded-lg border border-line px-3 py-1.5 text-sm bg-white outline-none focus:border-brand w-full sm:w-60" />
          <button onClick={load} disabled={loading} className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-sm disabled:opacity-60">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
        </div>

        <div role="group" aria-label="Filter by shipping status" className="flex flex-wrap gap-2">
          {['all', ...SHIP_ALL].map(s => (
            <button key={s} onClick={() => setShipFilter(s)} aria-pressed={shipFilter === s}
              className={`rounded-full px-3 py-1 text-sm border ${shipFilter === s ? 'bg-brand text-white border-brand' : 'bg-white border-line hover:border-brand'}`}>{s === 'all' ? 'All shipping' : SHIPPING_LABEL[s as ShippingStatus]}</button>
          ))}
        </div>

        {error && <p role="alert" className="text-sm text-red-700">{error}</p>}

        {loading && !orders.length ? <p className="text-sm text-muted" role="status">Loading orders…</p> :
         !shown.length ? <p className="text-sm text-muted py-8 text-center">No orders match.</p> : (
          <>
            <table className="hidden md:table w-full bg-white rounded-xl border border-line overflow-hidden text-sm">
              <thead className="text-left text-muted bg-soft">
                <tr><th className="p-3">Order</th><th className="p-3">Date</th><th className="p-3">Customer</th><th className="p-3 text-right">Total</th><th className="p-3">Payment</th><th className="p-3">Shipping</th></tr>
              </thead>
              <tbody>
                {shown.map(o => (
                  <tr key={o.id} className="border-t border-line hover:bg-soft">
                    <td className="p-3 font-semibold"><button onClick={() => setOpenId(o.id)} className="text-brand-dark hover:underline focus-visible:underline">{o.invoice_number}</button></td>
                    <td className="p-3">{date(o.issue_date)}</td>
                    <td className="p-3">{o.customer?.name}</td>
                    <td className="p-3 text-right">{inr(o.total)}</td>
                    <td className="p-3"><Badge s={o.status} /></td>
                    <td className="p-3"><ShipBadge s={o.shipping_status} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className="md:hidden space-y-2">
              {shown.map(o => (
                <li key={o.id}>
                  <button onClick={() => setOpenId(o.id)} className="w-full text-left rounded-xl bg-white border border-line p-3 flex justify-between gap-3">
                    <span><span className="block font-semibold">{o.invoice_number}</span><span className="block text-sm text-muted">{o.customer?.name} · {date(o.issue_date)}</span></span>
                    <span className="text-right"><span className="block font-semibold">{inr(o.total)}</span><Badge s={o.status} /><span className="block mt-1"><ShipBadge s={o.shipping_status} /></span></span>
                  </button>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>

      {open && <Detail key={open.id} order={open} onClose={() => setOpenId(null)} onChanged={load} />}
    </div>
  );
}

function Detail({ order, onClose, onChanged }: { order: AdminOrder; onClose: () => void; onChanged: () => Promise<void> }) {
  const [next, setNext] = useState(order.status);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState('');
  const [confirmCancel, setConfirmCancel] = useState(false);
  const c = order.customer;
  const isCancelled = order.status === 'cancelled';
  const cancelling = next === 'cancelled' && order.status !== 'cancelled';

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  async function save(status = next) {
    setSaving(true); setErr('');
    try { await adminSetStatus(order.invoice_number, status); if (c?.email) notifyStatus(order.invoice_number); await onChanged(); }
    catch (e) { setErr(e instanceof Error ? e.message : 'Update failed'); }
    finally { setSaving(false); }
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <aside role="dialog" aria-modal="true" aria-label={`Order ${order.invoice_number}`} onClick={e => e.stopPropagation()}
        className="w-full max-w-md h-full overflow-y-auto bg-white p-5 space-y-5">
        <div className="flex items-start justify-between">
          <div><h2 className="text-lg font-bold">{order.invoice_number}</h2><p className="text-sm text-muted">{date(order.issue_date)}</p></div>
          <button onClick={onClose} aria-label="Close" className="p-1 rounded hover:bg-soft"><X size={18} /></button>
        </div>

        <section className="space-y-2" aria-label="Cancel order">
          {!isCancelled && !confirmCancel && (
            <button onClick={() => setConfirmCancel(true)} className="w-full rounded-lg border border-red-300 py-2.5 text-sm font-semibold text-red-700 hover:bg-red-50">Cancel order</button>
          )}
          {!isCancelled && confirmCancel && (
            <div role="alert" className="rounded-lg bg-red-50 p-3 space-y-2">
              <p className="text-sm text-red-800">Cancel <b>{order.invoice_number}</b>? Its items go back into stock and shipping is set to Cancelled.</p>
              <div className="flex gap-2">
                <button onClick={() => save('cancelled')} disabled={saving} className="flex-1 rounded-lg bg-red-600 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:opacity-60">{saving ? 'Cancelling…' : 'Yes, cancel order'}</button>
                <button onClick={() => setConfirmCancel(false)} disabled={saving} className="flex-1 rounded-lg border border-line py-2 text-sm font-semibold hover:bg-soft">Keep order</button>
              </div>
            </div>
          )}
          {isCancelled && (
            <div className="rounded-lg bg-gray-100 p-3 space-y-2">
              <p className="text-sm text-gray-800">This order is cancelled and its stock was returned.</p>
              <button onClick={() => save('unpaid')} disabled={saving} className="w-full rounded-lg border border-line bg-white py-2 text-sm font-semibold hover:bg-soft disabled:opacity-60">{saving ? 'Reopening…' : 'Reopen order (re-reserves stock)'}</button>
            </div>
          )}
          {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
        </section>

        <section className="text-sm space-y-1">
          <h3 className="font-semibold">Customer</h3>
          <p>{c?.name}</p>
          {c?.phone && <p><a className="text-brand-dark hover:underline" href={`tel:${c.phone}`}>{c.phone}</a></p>}
          {c?.email && <p><a className="text-brand-dark hover:underline break-all" href={`mailto:${c.email}`}>{c.email}</a></p>}
          {c?.address && <p className="text-muted whitespace-pre-line">{c.address}</p>}
        </section>

        <section className="text-sm">
          <h3 className="font-semibold mb-1">Items</h3>
          <ul className="divide-y divide-line">
            {order.items.map((i, n) => (
              <li key={n} className="py-1.5 flex justify-between gap-3"><span>{i.description} × {i.quantity}</span><span>{inr(i.quantity * i.unit_price)}</span></li>
            ))}
          </ul>
          <dl className="pt-2 border-t border-line space-y-1">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{inr(order.subtotal)}</dd></div>
            {Number(order.discount) > 0 && <div className="flex justify-between text-green-700"><dt>Discount{order.coupon_code && ` (${order.coupon_code})`}</dt><dd>-{inr(order.discount)}</dd></div>}
            <div className="flex justify-between"><dt>Shipping</dt><dd>{Number(order.shipping) === 0 ? 'Free' : inr(order.shipping)}</dd></div>
            <div className="flex justify-between font-bold"><dt>Total</dt><dd>{inr(order.total)}</dd></div>
          </dl>
        </section>

        <section className="space-y-2">
          <label htmlFor="status" className="text-sm font-semibold block">Payment status <Badge s={order.status} /></label>
          <select id="status" value={next} onChange={e => { setNext(e.target.value); setErr(''); }} disabled={saving}
            className="w-full rounded-lg border border-line px-3 py-2 text-sm capitalize">
            {STATUSES.map(s => <option key={s} value={s}>{label(s)}</option>)}
          </select>
          <p className="text-xs text-muted">Cancelling restores stock.</p>
          {cancelling && (
            <p role="alert" className="text-sm rounded-lg bg-red-50 text-red-800 p-2">Cancel this order and restore its stock? Press the button below to confirm.</p>
          )}
          {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
          <button onClick={() => save()} disabled={saving || next === order.status}
            className={`w-full rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-60 ${cancelling ? 'bg-red-600 hover:bg-red-700' : 'bg-brand hover:bg-brand-dark'}`}>
            {saving ? 'Saving…' : cancelling ? 'Confirm cancel' : 'Update status'}
          </button>
        </section>

        <Fulfilment order={order} onChanged={onChanged} />
      </aside>
    </div>
  );
}

const field = 'w-full rounded-lg border border-line px-3 py-2 text-sm';
const HTTP = /^https?:\/\//i;

function Fulfilment({ order, onChanged }: { order: AdminOrder; onChanged: () => Promise<void> }) {
  const [f, setF] = useState({
    shipping_status: order.shipping_status, courier: order.courier ?? '', tracking_number: order.tracking_number ?? '',
    tracking_url: order.tracking_url ?? '', payment_method: order.payment_method ?? '', payment_reference: order.payment_reference ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; t: string } | null>(null);
  const hasEmail = !!order.customer?.email;
  const [emailIt, setEmailIt] = useState(true);
  const locked = order.status === 'cancelled';
  const set = (k: keyof typeof f, v: string) => { setF(p => ({ ...p, [k]: v })); setMsg(null); };
  const safeUrl = HTTP.test(order.tracking_url ?? '') ? order.tracking_url : null;

  async function save() {
    const url = f.tracking_url.trim();
    if (url && !HTTP.test(url)) { setMsg({ ok: false, t: 'Tracking link must start with http:// or https://' }); return; }
    setSaving(true); setMsg(null);
    try {
      await adminUpdateFulfilment(order.invoice_number, {
        ...f, courier: f.courier.trim(), tracking_number: f.tracking_number.trim(), tracking_url: url, payment_reference: f.payment_reference.trim(),
      });
      if (hasEmail && emailIt) notifyStatus(order.invoice_number);
      await onChanged();
      setMsg({ ok: true, t: 'Saved.' });
    } catch (e) { setMsg({ ok: false, t: e instanceof Error ? e.message : 'Update failed' }); }
    finally { setSaving(false); }
  }

  return (
    <form onSubmit={e => { e.preventDefault(); save(); }} className="space-y-3 border-t border-line pt-4">
      <h3 className="font-semibold">Shipping &amp; payment</h3>
      <div>
        <label htmlFor="ship" className="text-sm block mb-1">Shipping status</label>
        <select id="ship" value={f.shipping_status} onChange={e => set('shipping_status', e.target.value)} disabled={saving} className={field}>
          {[...SHIPPING_STEPS.map(s => s.key), 'returned', 'cancelled'].map(k => (
            <option key={k} value={k} disabled={locked && k !== 'cancelled'}>{SHIPPING_LABEL[k as ShippingStatus]}</option>
          ))}
        </select>
        {locked && <p className="text-xs text-muted mt-1">Reopen the order (set payment status away from cancelled) to change shipping</p>}
        {!locked && (
          <div className="flex flex-wrap gap-2 mt-2">
            {(['packed', 'shipped', 'delivered'] as const).map(k => (
              <button key={k} type="button" onClick={() => set('shipping_status', k)} disabled={saving}
                className="rounded-full border border-line px-3 py-1 text-xs hover:border-brand">Mark {k}</button>
            ))}
          </div>
        )}
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div><label htmlFor="courier" className="text-sm block mb-1">Courier</label>
          <input id="courier" value={f.courier} onChange={e => set('courier', e.target.value)} disabled={saving} className={field} /></div>
        <div><label htmlFor="trk" className="text-sm block mb-1">Tracking number</label>
          <input id="trk" value={f.tracking_number} onChange={e => set('tracking_number', e.target.value)} disabled={saving} className={field} /></div>
      </div>
      <div>
        <label htmlFor="trkurl" className="text-sm block mb-1">Tracking link</label>
        <input id="trkurl" type="url" placeholder="https://" value={f.tracking_url} onChange={e => set('tracking_url', e.target.value)} disabled={saving} className={field} />
        {safeUrl && <a href={safeUrl} target="_blank" rel="noopener noreferrer" className="text-xs text-brand-dark hover:underline break-all">Open tracking page</a>}
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div><label htmlFor="pm" className="text-sm block mb-1">Payment method</label>
          <select id="pm" value={f.payment_method} onChange={e => set('payment_method', e.target.value)} disabled={saving} className={field}>
            <option value="">—</option>
            {PAYMENT_METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
          </select></div>
        <div><label htmlFor="pref" className="text-sm block mb-1">Payment reference</label>
          <input id="pref" value={f.payment_reference} onChange={e => set('payment_reference', e.target.value)} disabled={saving} className={field} /></div>
      </div>
      <label className={`flex items-center gap-2 text-sm ${hasEmail ? '' : 'text-muted'}`}>
        <input type="checkbox" checked={hasEmail && emailIt} disabled={!hasEmail || saving} onChange={e => setEmailIt(e.target.checked)} />
        Email customer about this update{hasEmail ? '' : ' (no email on file)'}
      </label>
      {msg && <p role={msg.ok ? 'status' : 'alert'} className={`text-sm ${msg.ok ? 'text-green-700' : 'text-red-700'}`}>{msg.t}</p>}
      <button type="submit" disabled={saving} className="w-full rounded-lg py-2.5 text-sm font-semibold text-white bg-brand hover:bg-brand-dark disabled:opacity-60">
        {saving ? 'Saving…' : 'Save shipping & payment'}
      </button>
    </form>
  );
}
