import { Check, X } from 'lucide-react';
import { inr } from '../lib/format';
import { PAYMENT_LABEL, SHIPPING_LABEL, SHIPPING_STEPS, paymentMethodLabel } from '../lib/orderStatus';
import type { TrackedOrder } from '../lib/types';

export const payTone = (s: string) => s === 'paid' ? 'bg-green-100 text-green-800' : s === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-soft text-brand-dark';

export default function OrderTracking({ order: o }: { order: TrackedOrder }) {
  const terminal = o.shipping_status === 'returned' || o.shipping_status === 'cancelled';
  const cur = SHIPPING_STEPS.findIndex(s => s.key === o.shipping_status);
  const safeUrl = o.tracking_url && /^https?:\/\//i.test(o.tracking_url) ? o.tracking_url : null;
  const hasShipment = o.courier || o.tracking_number || safeUrl;

  return (
    <div className="space-y-5">
      {terminal ? (
        <p role="status" className="flex items-center gap-2 rounded-lg bg-red-50 p-3 text-sm font-semibold text-red-700">
          <X size={16} aria-hidden /> {SHIPPING_LABEL[o.shipping_status]}
        </p>
      ) : (
        <ol aria-label="Shipping progress" className="flex">
          {SHIPPING_STEPS.map((s, i) => {
            const done = i <= cur;
            return (
              <li key={s.key} aria-current={i === cur ? 'step' : undefined} className="flex flex-1 flex-col items-center text-center text-xs sm:text-sm">
                <span className={`flex h-8 w-8 items-center justify-center rounded-full ${done ? 'bg-brand text-white' : 'bg-line text-muted'}`}>
                  {done ? <Check size={16} aria-hidden /> : i + 1}
                </span>
                <span className={`mt-1 ${i === cur ? 'font-bold' : done ? 'font-medium' : 'text-muted'}`}>{s.label}</span>
                <span className="sr-only">{i < cur ? ' (completed)' : i === cur ? ' (current)' : ' (upcoming)'}</span>
              </li>
            );
          })}
        </ol>
      )}

      {hasShipment && (
        <dl className="space-y-1 rounded-lg bg-soft p-3 text-sm">
          {o.courier && <div className="flex justify-between gap-3"><dt className="text-muted">Courier</dt><dd className="font-medium">{o.courier}</dd></div>}
          {o.tracking_number && <div className="flex justify-between gap-3"><dt className="text-muted">Tracking no.</dt><dd className="break-all font-medium">{o.tracking_number}</dd></div>}
          {safeUrl && <a href={safeUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block font-semibold text-brand-dark underline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand">Track shipment<span className="sr-only"> (opens in new tab)</span></a>}
        </dl>
      )}

      <p className="flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted">Payment</span>
        <span className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${payTone(o.status)}`}>{PAYMENT_LABEL[o.status] ?? o.status}</span>
        {o.payment_method && <span className="text-muted">via {paymentMethodLabel(o.payment_method)}</span>}
      </p>

      <div>
        <ul className="divide-y divide-line border-y border-line">
          {o.items.map((it, i) => (
            <li key={i} className="flex justify-between gap-3 py-2 text-sm"><span>{it.description} × {it.quantity}</span><span>{inr(it.unit_price * it.quantity)}</span></li>
          ))}
        </ul>
        <dl className="mt-3 space-y-1 text-sm">
          <div className="flex justify-between"><dt className="text-muted">Subtotal</dt><dd>{inr(o.subtotal)}</dd></div>
          {o.discount > 0 && <div className="flex justify-between text-green-700"><dt>Discount{o.coupon_code ? ` (${o.coupon_code})` : ''}</dt><dd>−{inr(o.discount)}</dd></div>}
          <div className="flex justify-between"><dt className="text-muted">Shipping</dt><dd>{o.shipping === 0 ? 'Free' : inr(o.shipping)}</dd></div>
          <div className="flex justify-between border-t border-line pt-2 font-bold"><dt>Total</dt><dd>{inr(o.total)}</dd></div>
        </dl>
      </div>
    </div>
  );
}
