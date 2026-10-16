import { useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { Check, Copy, CheckCircle2 } from 'lucide-react';
import { inr } from '../lib/format';

export default function OrderSuccess() {
  const { invoice = '' } = useParams();
  const st = (useLocation().state ?? {}) as { subtotal?: number; discount?: number; shipping?: number; total?: number; phone?: string };
  const [copied, setCopied] = useState(false);
  const copy = () => navigator.clipboard?.writeText(invoice).then(() => { setCopied(true); setTimeout(() => setCopied(false), 2000); }, () => {});

  return (
    <main className="mx-auto max-w-md px-4 py-16 text-center">
      <CheckCircle2 className="mx-auto text-brand" size={56} aria-hidden />
      <h1 className="mt-4 text-3xl font-bold">Thank you! Order placed</h1>
      <div className="mt-6 rounded-2xl bg-soft p-5">
        <p className="text-sm text-muted">Order number</p>
        <p className="mt-1 flex items-center justify-center gap-2 font-display text-xl font-bold">
          {invoice}
          <button onClick={copy} aria-label="Copy order number" className="rounded p-1.5 text-muted hover:bg-white">
            {copied ? <Check size={18} /> : <Copy size={18} />}
          </button>
          <span role="status" className="sr-only">{copied ? 'Copied' : ''}</span>
        </p>
        {st.subtotal != null && st.total != null ? (
          <dl className="mt-3 space-y-1 text-left text-sm">
            <div className="flex justify-between"><dt>Subtotal</dt><dd>{inr(st.subtotal)}</dd></div>
            {!!st.discount && <div className="flex justify-between"><dt>Discount</dt><dd>-{inr(st.discount)}</dd></div>}
            <div className="flex justify-between"><dt>Shipping</dt><dd>{st.shipping ? inr(st.shipping) : 'Free'}</dd></div>
            <div className="flex justify-between border-t border-line pt-2 text-lg font-semibold"><dt>Total</dt><dd>{inr(st.total)}</dd></div>
          </dl>
        ) : st.total != null && <p className="mt-3 text-lg font-semibold">{inr(st.total)}</p>}
      </div>
      <p className="mt-4 text-sm text-muted">We'll contact you shortly to confirm your order. Keep your order number and phone number to track your order.</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Link to={`/track?invoice=${encodeURIComponent(invoice)}`} className="rounded-full bg-brand px-6 py-3 font-semibold text-white hover:bg-brand-dark">Track order</Link>
        <Link to="/shop" className="rounded-full border border-line px-6 py-3 font-semibold hover:bg-soft">Continue shopping</Link>
      </div>
    </main>
  );
}
