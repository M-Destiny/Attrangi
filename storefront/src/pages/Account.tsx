import { useEffect, useState } from 'react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { ChevronDown } from 'lucide-react';
import OrderTracking, { payTone } from '../components/OrderTracking';
import { PAYMENT_LABEL, SHIPPING_LABEL } from '../lib/orderStatus';
import { useAuth } from '../lib/auth';
import { getMyAccount } from '../lib/api';
import { inr } from '../lib/format';
import type { AccountData, TrackedOrder } from '../lib/types';

const ring = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand';

function OrderRow({ o }: { o: TrackedOrder }) {
  const [open, setOpen] = useState(false);
  const id = `ord-${o.invoice_number}`;
  return (
    <li className="rounded-2xl border border-line">
      <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen(v => !v)}
        className={`flex w-full items-center gap-3 rounded-2xl p-4 text-left ${ring}`}>
        <span className="min-w-0 flex-1">
          <span className="block font-semibold">{o.invoice_number}</span>
          <span className="block text-sm text-muted">{new Date(o.issue_date).toLocaleDateString('en-IN', { dateStyle: 'medium' })} · {o.items.length} item{o.items.length === 1 ? '' : 's'}</span>
        </span>
        <span className="flex flex-col items-end gap-1 sm:flex-row">
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${payTone(o.status)}`}>{PAYMENT_LABEL[o.status] ?? o.status}</span>
          <span className="rounded-full bg-soft px-2.5 py-0.5 text-xs font-semibold text-brand-dark">{SHIPPING_LABEL[o.shipping_status] ?? o.shipping_status}</span>
        </span>
        <span className="font-semibold">{inr(o.total)}</span>
        <ChevronDown size={18} aria-hidden className={`shrink-0 transition-transform ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div id={id} className="border-t border-line p-4">
          <OrderTracking order={o} />
          <Link to={`/track?invoice=${encodeURIComponent(o.invoice_number)}`} className={`mt-3 inline-block rounded text-sm text-muted underline hover:text-brand-dark ${ring}`}>Track on order page</Link>
        </div>
      )}
    </li>
  );
}

export default function Account() {
  const { session, ready, isStaff, signOut } = useAuth();
  const nav = useNavigate();
  const [data, setData] = useState<AccountData | null>(null);
  const [err, setErr] = useState('');
  const uid = session?.user.id;

  useEffect(() => {
    if (!uid) return;
    let live = true;
    getMyAccount().then(d => live && setData(d)).catch(e => live && setErr(e instanceof Error ? e.message : 'Could not load your account.'));
    return () => { live = false; };
  }, [uid]);

  if (!ready) return (
    <main aria-busy="true" className="mx-auto max-w-2xl animate-pulse space-y-4 px-4 py-10">
      <div className="h-8 w-40 rounded bg-soft" /><div className="h-28 rounded-2xl bg-soft" /><div className="h-20 rounded-2xl bg-soft" />
    </main>
  );
  if (!session) return <Navigate to="/login?next=/account" replace />;

  const u = session.user, c = data?.customer;
  const name = (u.user_metadata?.full_name as string | undefined) || c?.name || '';
  const orders = data?.orders ?? [];

  return (
    <main className="mx-auto max-w-2xl px-4 py-10">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-3xl font-bold">My account</h1>
        <button onClick={async () => { await signOut(); nav('/'); }} className={`rounded-full border border-line px-4 py-2 text-sm font-semibold hover:bg-soft ${ring}`}>Sign out</button>
      </div>
      <section aria-label="Profile" className="mt-6 rounded-2xl border border-line p-5">
        <dl className="space-y-2 text-sm">
          {name && <div><dt className="text-muted">Name</dt><dd className="font-medium">{name}</dd></div>}
          <div><dt className="text-muted">Email</dt><dd className="font-medium break-all">{u.email}</dd></div>
          {c?.phone && <div><dt className="text-muted">Phone</dt><dd className="font-medium">{c.phone}</dd></div>}
          {c?.address && <div><dt className="text-muted">Address</dt><dd className="font-medium whitespace-pre-line">{c.address}</dd></div>}
        </dl>
        {isStaff && <Link to="/admin" className={`mt-4 inline-block rounded text-sm font-semibold text-brand-dark underline ${ring}`}>Go to admin</Link>}
      </section>
      <h2 className="mt-8 text-xl font-bold">Your orders</h2>
      {err && <p role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</p>}
      {!data && !err ? <div aria-busy="true" className="mt-3 h-20 animate-pulse rounded-2xl bg-soft" />
        : !orders.length && !err ? (
          <p className="mt-3 text-muted">No orders yet. <Link to="/shop" className="font-semibold text-brand-dark underline">Start shopping</Link></p>
        ) : (
          <ul className="mt-3 space-y-3">{orders.map(o => <OrderRow key={o.invoice_number} o={o} />)}</ul>
        )}
    </main>
  );
}
