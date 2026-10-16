import { useCallback, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { Plus, RefreshCw, X } from 'lucide-react';
import { useAuth } from '../../lib/auth';
import { adminCoupons, saveCoupon, deleteCoupon } from '../../lib/api';
import { inr } from '../../lib/format';
import type { Coupon, CouponInput } from '../../lib/types';

const fmtDate = (d: string) => new Date(d).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
const discount = (c: Coupon) => (c.type === 'percent' ? `${c.value}%` : `${inr(c.value)} off`);
const validity = (c: Coupon) => `${c.starts_at ? fmtDate(c.starts_at) : 'Any time'} → ${c.expires_at ? fmtDate(c.expires_at) : 'No expiry'}`;
const usage = (c: Coupon) => `${c.used ?? 0} / ${c.max_uses ?? '∞'}`;
const toInput = (iso: string | null) => {
  if (!iso) return '';
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
};
const toIso = (v: string) => (v ? new Date(v).toISOString() : null);
const toInputRow = (c: Coupon): CouponInput => ({
  id: c.id, code: c.code, type: c.type, value: c.value, min_order: c.min_order, starts_at: c.starts_at,
  expires_at: c.expires_at, max_uses: c.max_uses, one_per_customer: c.one_per_customer, active: c.active,
});

export default function AdminCoupons() {
  const { session, ready, isStaff, signOut } = useAuth();
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [form, setForm] = useState<Coupon | 'new' | null>(null);
  const [confirmId, setConfirmId] = useState<string | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [rowErr, setRowErr] = useState('');

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try { setCoupons(await adminCoupons()); }
    catch (e) { setError(e instanceof Error ? e.message : 'Failed to load coupons'); }
    finally { setLoading(false); }
  }, []);
  const allowed = ready && !!session && isStaff;
  useEffect(() => { if (allowed) load(); }, [allowed, load]);

  if (!ready) return <div className="p-6 max-w-6xl mx-auto animate-pulse space-y-4" aria-busy="true"><div className="h-10 bg-gray-100 rounded" /><div className="h-24 bg-gray-100 rounded" /><div className="h-64 bg-gray-100 rounded" /></div>;
  if (!session || !isStaff) return <Navigate to="/admin/login" replace />;

  async function act(id: string, fn: () => Promise<void>) {
    setBusyId(id); setRowErr('');
    try { await fn(); setConfirmId(null); await load(); }
    catch (e) { setRowErr(e instanceof Error ? e.message : 'Action failed'); }
    finally { setBusyId(null); }
  }
  const toggle = (c: Coupon) => act(c.id, () => saveCoupon({ ...toInputRow(c), active: !c.active }));

  const Actions = ({ c }: { c: Coupon }) => (
    <div className="flex items-center gap-2 flex-wrap">
      <button onClick={() => setForm(c)} className="text-sm text-brand-dark hover:underline">Edit</button>
      {confirmId === c.id ? (
        <span className="inline-flex items-center gap-2 text-sm">
          <span>Delete?</span>
          <button onClick={() => act(c.id, () => deleteCoupon(c.id))} disabled={busyId === c.id} className="rounded bg-red-600 text-white px-2 py-0.5 disabled:opacity-60">Yes</button>
          <button onClick={() => setConfirmId(null)} className="rounded border border-line px-2 py-0.5">No</button>
        </span>
      ) : <button onClick={() => setConfirmId(c.id)} className="text-sm text-red-700 hover:underline">Delete</button>}
    </div>
  );
  const Toggle = ({ c }: { c: Coupon }) => (
    <button role="switch" aria-checked={c.active} aria-label={`${c.code} active`} disabled={busyId === c.id} onClick={() => toggle(c)}
      className={`relative h-6 w-11 rounded-full transition-colors disabled:opacity-60 ${c.active ? 'bg-brand' : 'bg-gray-300'}`}>
      <span className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white transition-transform ${c.active ? 'translate-x-5' : ''}`} />
    </button>
  );

  return (
    <div className="min-h-screen bg-soft">
      <header className="bg-white border-b border-line">
        <div className="max-w-6xl mx-auto px-4 py-3 flex flex-wrap items-center gap-x-4 gap-y-2">
          <h1 className="text-xl font-black mr-auto">Coupons</h1>
          <nav aria-label="Admin" className="flex gap-3 text-sm">
            <Link to="/admin" className="text-brand-dark hover:underline">Orders</Link>
            <Link to="/admin/coupons" aria-current="page" className="font-semibold underline">Coupons</Link>
          </nav>
          <span className="text-sm text-muted truncate max-w-[14rem]">{session.user.email}</span>
          <Link to="/" className="text-sm text-brand-dark hover:underline">Storefront</Link>
          <button onClick={() => signOut()} className="text-sm rounded-lg border border-line px-3 py-1.5 hover:bg-soft">Sign out</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-6 space-y-5">
        <div className="flex items-center gap-2 justify-end">
          <button onClick={load} disabled={loading} className="inline-flex items-center gap-1.5 rounded-lg border border-line bg-white px-3 py-1.5 text-sm disabled:opacity-60">
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          <button onClick={() => setForm('new')} className="inline-flex items-center gap-1.5 rounded-lg bg-brand hover:bg-brand-dark text-white px-3 py-1.5 text-sm font-semibold">
            <Plus size={14} /> New coupon
          </button>
        </div>

        {error && (
          <div role="alert" className="text-sm text-red-700 flex items-center gap-3">
            {error} <button onClick={load} className="rounded border border-line bg-white px-2 py-0.5 text-ink">Retry</button>
          </div>
        )}
        {rowErr && <p role="alert" className="text-sm text-red-700">{rowErr}</p>}

        {loading && !coupons.length && !error ? (
          <div className="animate-pulse space-y-2" role="status" aria-label="Loading coupons">{[0, 1, 2].map(i => <div key={i} className="h-14 bg-gray-100 rounded-xl" />)}</div>
        ) : !coupons.length ? (
          !error && <p className="text-sm text-muted py-8 text-center">No coupons yet. Create your first one.</p>
        ) : (
          <>
            <table className="hidden md:table w-full bg-white rounded-xl border border-line overflow-hidden text-sm">
              <thead className="text-left text-muted bg-soft">
                <tr><th className="p-3">Code</th><th className="p-3">Discount</th><th className="p-3">Min order</th><th className="p-3">Validity</th><th className="p-3">Used</th><th className="p-3">1/customer</th><th className="p-3">Active</th><th className="p-3">Actions</th></tr>
              </thead>
              <tbody>
                {coupons.map(c => (
                  <tr key={c.id} className="border-t border-line align-top">
                    <td className="p-3 font-mono font-semibold">{c.code}</td>
                    <td className="p-3">{discount(c)}</td>
                    <td className="p-3">{inr(c.min_order)}</td>
                    <td className="p-3 text-muted">{validity(c)}</td>
                    <td className="p-3">{usage(c)}</td>
                    <td className="p-3">{c.one_per_customer ? 'Yes' : 'No'}</td>
                    <td className="p-3"><Toggle c={c} /></td>
                    <td className="p-3"><Actions c={c} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
            <ul className="md:hidden space-y-2">
              {coupons.map(c => (
                <li key={c.id} className="rounded-xl bg-white border border-line p-3 space-y-2 text-sm">
                  <div className="flex items-center justify-between gap-3">
                    <span className="font-mono font-semibold">{c.code}</span>
                    <Toggle c={c} />
                  </div>
                  <p>{discount(c)} · min {inr(c.min_order)}</p>
                  <p className="text-muted">{validity(c)}</p>
                  <p className="text-muted">Used {usage(c)} · {c.one_per_customer ? 'One per customer' : 'Repeat use allowed'}</p>
                  <Actions c={c} />
                </li>
              ))}
            </ul>
          </>
        )}
      </main>

      {form && <CouponForm key={form === 'new' ? 'new' : form.id} coupon={form === 'new' ? null : form} onClose={() => setForm(null)} onSaved={async () => { setForm(null); await load(); }} />}
    </div>
  );
}

function CouponForm({ coupon, onClose, onSaved }: { coupon: Coupon | null; onClose: () => void; onSaved: () => Promise<void> }) {
  const [code, setCode] = useState(coupon?.code ?? '');
  const [type, setType] = useState<'percent' | 'flat'>(coupon?.type ?? 'percent');
  const [value, setValue] = useState(coupon ? String(coupon.value) : '');
  const [minOrder, setMinOrder] = useState(String(coupon?.min_order ?? 0));
  const [starts, setStarts] = useState(toInput(coupon?.starts_at ?? null));
  const [expires, setExpires] = useState(toInput(coupon?.expires_at ?? null));
  const [maxUses, setMaxUses] = useState(coupon?.max_uses != null ? String(coupon.max_uses) : '');
  const [once, setOnce] = useState(coupon?.one_per_customer ?? true);
  const [active, setActive] = useState(coupon?.active ?? true);
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [serverErr, setServerErr] = useState('');
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const h = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    const er: Record<string, string> = {};
    const v = Number(value), m = Number(minOrder);
    if (!/^[A-Z0-9_-]{3,32}$/.test(code)) er.code = '3-32 characters: A-Z, 0-9, _ or -';
    if (!(v > 0)) er.value = 'Must be greater than 0';
    else if (type === 'percent' && v > 100) er.value = 'Percent cannot exceed 100';
    if (minOrder === '' || !(m >= 0)) er.min = 'Must be 0 or more';
    if (starts && expires && new Date(expires) <= new Date(starts)) er.expires = 'Expiry must be after start';
    if (maxUses !== '' && !(Number.isInteger(Number(maxUses)) && Number(maxUses) > 0)) er.max = 'Must be a whole number above 0';
    setErrs(er); setServerErr('');
    if (Object.keys(er).length) return;
    setSaving(true);
    try {
      await saveCoupon({
        ...(coupon ? { id: coupon.id } : {}), code, type, value: v, min_order: m, starts_at: toIso(starts), expires_at: toIso(expires),
        max_uses: maxUses === '' ? null : Number(maxUses), one_per_customer: once, active,
      });
      await onSaved();
    } catch (x) { setServerErr(x instanceof Error ? x.message : 'Save failed'); setSaving(false); }
  }

  const inp = (k: string) => `w-full rounded-lg border px-3 py-2 text-sm bg-white outline-none focus:border-brand ${errs[k] ? 'border-red-500' : 'border-line'}`;
  const Err = ({ k }: { k: string }) => errs[k] ? <p id={`e-${k}`} role="alert" className="text-xs text-red-700 mt-1">{errs[k]}</p> : null;
  const aria = (k: string) => ({ 'aria-invalid': !!errs[k], 'aria-describedby': errs[k] ? `e-${k}` : undefined });

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40" onClick={onClose}>
      <form noValidate onSubmit={submit} role="dialog" aria-modal="true" aria-label={coupon ? `Edit ${coupon.code}` : 'New coupon'} onClick={e => e.stopPropagation()}
        className="w-full max-w-md h-full overflow-y-auto bg-white p-5 space-y-4">
        <div className="flex items-start justify-between">
          <h2 className="text-lg font-bold">{coupon ? 'Edit coupon' : 'New coupon'}</h2>
          <button type="button" onClick={onClose} aria-label="Close" className="p-1 rounded hover:bg-soft"><X size={18} /></button>
        </div>

        <div>
          <label htmlFor="cp-code" className="text-sm font-semibold block mb-1">Code</label>
          <input id="cp-code" autoFocus value={code} maxLength={32} onChange={e => setCode(e.target.value.toUpperCase())} className={`${inp('code')} font-mono`} {...aria('code')} />
          <Err k="code" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="cp-type" className="text-sm font-semibold block mb-1">Type</label>
            <select id="cp-type" value={type} onChange={e => setType(e.target.value as 'percent' | 'flat')} className={inp('type')}>
              <option value="percent">Percent (%)</option><option value="flat">Flat (₹)</option>
            </select>
          </div>
          <div>
            <label htmlFor="cp-value" className="text-sm font-semibold block mb-1">Value</label>
            <input id="cp-value" type="number" inputMode="decimal" min="0" step="any" value={value} onChange={e => setValue(e.target.value)} className={inp('value')} {...aria('value')} />
            <Err k="value" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label htmlFor="cp-min" className="text-sm font-semibold block mb-1">Min order (₹)</label>
            <input id="cp-min" type="number" inputMode="decimal" min="0" step="any" value={minOrder} onChange={e => setMinOrder(e.target.value)} className={inp('min')} {...aria('min')} />
            <Err k="min" />
          </div>
          <div>
            <label htmlFor="cp-max" className="text-sm font-semibold block mb-1">Max uses</label>
            <input id="cp-max" type="number" inputMode="numeric" min="1" step="1" placeholder="Unlimited" value={maxUses} onChange={e => setMaxUses(e.target.value)} className={inp('max')} {...aria('max')} />
            <Err k="max" />
          </div>
        </div>

        <div>
          <label htmlFor="cp-start" className="text-sm font-semibold block mb-1">Starts at</label>
          <input id="cp-start" type="datetime-local" value={starts} onChange={e => setStarts(e.target.value)} className={inp('starts')} />
        </div>
        <div>
          <label htmlFor="cp-exp" className="text-sm font-semibold block mb-1">Expires at</label>
          <input id="cp-exp" type="datetime-local" value={expires} onChange={e => setExpires(e.target.value)} className={inp('expires')} {...aria('expires')} />
          <Err k="expires" />
        </div>

        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={once} onChange={e => setOnce(e.target.checked)} /> One use per customer</label>
        <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={active} onChange={e => setActive(e.target.checked)} /> Active</label>

        {serverErr && <p role="alert" className="text-sm text-red-700">{serverErr}</p>}
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-lg border border-line py-2.5 text-sm">Cancel</button>
          <button type="submit" disabled={saving} className="flex-1 rounded-lg bg-brand hover:bg-brand-dark text-white py-2.5 text-sm font-semibold disabled:opacity-60">{saving ? 'Saving…' : 'Save coupon'}</button>
        </div>
      </form>
    </div>
  );
}
