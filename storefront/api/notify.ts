// Vercel serverless: order emails via Resend. Never trusts client content/recipients:
// everything is re-read from Supabase (new_order: one-time claim by invoice+phone; status: staff JWT only).
declare const process: { env: Record<string, string | undefined> };
interface Req { method?: string; body?: unknown; headers: Record<string, string | string[] | undefined> }
interface Res { status(n: number): Res; json(b: unknown): void }
type Item = { description: string; quantity: number; unit_price: number };
export type Order = {
  invoice_number: string; status: string; subtotal: number; discount: number; shipping: number; total: number; coupon_code: string | null;
  shipping_status: string; courier: string | null; tracking_number: string | null; tracking_url: string | null; items: Item[];
};
export type Cust = { name: string; email: string | null; phone: string; address: string };
type Mail = { subject: string; html: string; text: string };

const env = (k: string, d = '') => process.env[k] || d;
/** Free text (name/address) comes from an anonymous checkout form, so it is untrusted: strip control chars and links, collapse whitespace, cap length. */
export const clean = (v: unknown, max: number) => String(v ?? '').replace(/[\u0000-\u001f\u007f]+/g, ' ').replace(/(https?:\/\/|www\.)\S+/gi, '[link removed]').replace(/\s+/g, ' ').trim().slice(0, max);
const SITE = () => env('SITE_URL', 'https://attrangii-store.vercel.app').replace(/\/+$/, '');
export const esc = (v: unknown) => String(v ?? '').replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));
const inr = (n: number) => '₹' + Number(n || 0).toLocaleString('en-IN', { maximumFractionDigits: 2 });
const label = (s: string) => (s || '').replace(/_/g, ' ').replace(/^./, c => c.toUpperCase());
const EMAIL = /^[^\s@<>"',;]{1,64}@[^\s@<>"',;]{1,255}\.[^\s@<>"',;]{2,}$/;
const safeHttp = (u: string | null) => (u && /^https?:\/\//i.test(u) && u.length < 500 ? u : null);
const trackUrl = (inv: string) => `${SITE()}/track?invoice=${encodeURIComponent(inv)}`;

const row = (a: string, b: string, bold = false) =>
  `<tr><td style="padding:4px 0;color:#555;${bold ? 'font-weight:bold;color:#222;' : ''}">${a}</td><td align="right" style="padding:4px 0;${bold ? 'font-weight:bold;' : ''}">${b}</td></tr>`;

function itemsHtml(o: Order) {
  const rows = o.items.map(i => `<tr><td style="padding:8px 0;border-bottom:1px solid #eee">${esc(i.description)}<br><span style="color:#888;font-size:12px">Qty ${esc(i.quantity)} × ${esc(inr(i.unit_price))}</span></td><td align="right" style="padding:8px 0;border-bottom:1px solid #eee">${esc(inr(i.quantity * i.unit_price))}</td></tr>`).join('');
  const tot = row('Subtotal', esc(inr(o.subtotal)))
    + (o.discount > 0 ? row(`Coupon${o.coupon_code ? ' (' + esc(o.coupon_code) + ')' : ''}`, '-' + esc(inr(o.discount))) : '')
    + row('Shipping', o.shipping > 0 ? esc(inr(o.shipping)) : 'Free') + row('Total', esc(inr(o.total)), true);
  return `<table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px">${rows}</table><table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin-top:8px">${tot}</table>`;
}
function itemsText(o: Order) {
  return [...o.items.map(i => `- ${i.description} x${i.quantity} @ ${inr(i.unit_price)}`), `Subtotal: ${inr(o.subtotal)}`,
    ...(o.discount > 0 ? [`Coupon${o.coupon_code ? ' (' + o.coupon_code + ')' : ''}: -${inr(o.discount)}`] : []),
    `Shipping: ${o.shipping > 0 ? inr(o.shipping) : 'Free'}`, `Total: ${inr(o.total)}`].join('\n');
}
/** Branded shell: header, title, body (callers pass already-escaped HTML), optional button. */
function shell(title: string, body: string, btn?: { href: string; text: string }) {
  const b = btn ? `<p style="margin:24px 0 0;text-align:center"><a href="${esc(btn.href)}" style="background:#E87AAE;color:#fff;text-decoration:none;font-weight:bold;padding:12px 24px;border-radius:8px;display:inline-block">${esc(btn.text)}</a></p>` : '';
  return `<!doctype html><html><body style="margin:0;background:#f6f6f8;font-family:Arial,Helvetica,sans-serif;color:#222"><table width="100%" cellpadding="0" cellspacing="0"><tr><td align="center" style="padding:16px"><table width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#fff;border-radius:12px;overflow:hidden"><tr><td style="background:#E87AAE;padding:18px 24px;color:#fff;font-size:22px;font-weight:bold">Attrangii</td></tr><tr><td height="4" style="background:#F4D21F;font-size:0;line-height:0">&nbsp;</td></tr><tr><td style="padding:24px"><h1 style="margin:0 0 12px;font-size:20px;color:#5FA8C9">${esc(title)}</h1>${body}${b}</td></tr></table></td></tr></table></body></html>`;
}
const p = (s: string) => `<p style="margin:0 0 12px;font-size:14px;line-height:1.5">${s}</p>`;

export function ownerMail(o: Order, c: Cust): Mail {
  const link = `${SITE()}/admin`;
  const html = shell(`New order ${o.invoice_number}`,
    p(`<b>${esc(c.name)}</b><br>${esc(c.phone)}${c.email ? '<br>' + esc(c.email) : ''}<br>${esc(c.address)}`) + itemsHtml(o), { href: link, text: 'Open admin' });
  const text = `New order ${o.invoice_number}\n${c.name}\n${c.phone}\n${c.email ?? ''}\n${c.address}\n\n${itemsText(o)}\n\nAdmin: ${link}`;
  return { subject: `New order ${o.invoice_number} - ${inr(o.total)}`, html, text };
}
export function confirmMail(o: Order, c: Cust): Mail {
  const link = trackUrl(o.invoice_number);
  const html = shell(`Thank you, ${c.name}!`,
    p(`We have received your order <b>${esc(o.invoice_number)}</b>. We will update you as it ships.`) + itemsHtml(o)
    + p(`<br>Delivering to:<br>${esc(c.address)}`), { href: link, text: 'Track your order' });
  const text = `Thank you, ${c.name}! We received your order ${o.invoice_number}.\n\n${itemsText(o)}\n\nDelivering to: ${c.address}\nTrack: ${link}`;
  return { subject: `Order confirmed: ${o.invoice_number}`, html, text };
}
export function statusMail(o: Order, c: Cust): Mail {
  const link = trackUrl(o.invoice_number);
  const cancelled = o.status === 'cancelled';
  const tu = safeHttp(o.tracking_url);
  const lines = cancelled ? [] : [['Payment', label(o.status)], ['Shipping', label(o.shipping_status)],
    ...(o.courier ? [['Courier', o.courier]] : []), ...(o.tracking_number ? [['Tracking number', o.tracking_number]] : [])];
  const html = shell(cancelled ? `Order ${o.invoice_number} was cancelled` : `Update on order ${o.invoice_number}`,
    p(`Hi ${esc(c.name)},`) + (cancelled ? p('Your order has been cancelled. If you did not expect this, please contact us.')
      : `<table width="100%" cellpadding="0" cellspacing="0" style="font-size:14px;margin-bottom:12px">${lines.map(([a, b]) => row(esc(a), esc(b))).join('')}</table>`
        + (tu ? p(`<a href="${esc(tu)}" style="color:#5FA8C9">Courier tracking page</a>`) : '')), { href: link, text: 'Track your order' });
  const text = `Hi ${c.name},\n${cancelled ? `Your order ${o.invoice_number} was cancelled.` : `Update on order ${o.invoice_number}:\n` + lines.map(l => `${l[0]}: ${l[1]}`).join('\n') + (tu ? `\nCourier tracking: ${tu}` : '')}\n\nTrack: ${link}`;
  return { subject: cancelled ? `Order ${o.invoice_number} cancelled` : `Order ${o.invoice_number}: ${label(o.shipping_status)}`, html, text };
}

async function send(to: string, m: Mail) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST', headers: { Authorization: `Bearer ${env('RESEND_API_KEY')}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: env('FROM_EMAIL', 'Attrangii <onboarding@resend.dev>'), to: [to], subject: m.subject, html: m.html, text: m.text }),
  });
  return r.ok;
}
async function rpc(fn: string, args: object, token?: string) {
  const key = env('VITE_SUPABASE_ANON_KEY');
  const r = await fetch(`${env('VITE_SUPABASE_URL').replace(/\/+$/, '')}/rest/v1/rpc/${fn}`, {
    method: 'POST', headers: { apikey: key, Authorization: `Bearer ${token || key}`, 'Content-Type': 'application/json' }, body: JSON.stringify(args),
  });
  return r.ok ? { ok: true as const, data: await r.json() } : { ok: false as const, status: r.status };
}

const INV = /^WEB-[A-Za-z0-9-]{1,40}$/;
export default async function handler(req: Req, res: Res) {
  try {
    if (req.method !== 'POST') return res.status(405).json({ ok: false, error: 'method not allowed' });
    if (!env('RESEND_API_KEY') || !env('OWNER_EMAIL') || !env('VITE_SUPABASE_URL') || !env('VITE_SUPABASE_ANON_KEY'))
      return res.status(200).json({ ok: false, error: 'email not configured' });
    let b: any = req.body; if (typeof b === 'string') b = JSON.parse(b);
    const inv = typeof b?.invoice_number === 'string' ? b.invoice_number.trim().toUpperCase() : '';
    if (!INV.test(inv)) return res.status(400).json({ ok: false, error: 'bad request' });

    if (b.type === 'new_order') {
      const phone = typeof b.phone === 'string' ? b.phone.trim() : '';
      if (!phone || phone.length > 30) return res.status(400).json({ ok: false, error: 'bad request' });
      const r = await rpc('claim_order_notification', { p_invoice_number: inv, p_phone: phone });
      if (!r.ok) return res.status(502).json({ ok: false, error: 'failed' });
      if (!r.data) return res.status(200).json({ ok: true, skipped: true });
      const { order, customer, recent_for_email } = r.data as { order: Order; customer: Cust; recent_for_email?: number };
      const sent = [await send(env('OWNER_EMAIL'), ownerMail(order, { ...customer, name: clean(customer.name, 120), address: clean(customer.address, 400) }))];
      // Anyone can type any email at checkout, so cap confirmations per recipient (anti-spam) and only send sanitised text.
      if (customer.email && EMAIL.test(customer.email) && (recent_for_email ?? 0) <= 3)
        sent.push(await send(customer.email, confirmMail(order, { ...customer, name: clean(customer.name, 60), address: clean(customer.address, 200) })));
      return res.status(200).json({ ok: true, sent: sent.filter(Boolean).length });
    }
    if (b.type === 'status') {
      const auth = String(req.headers.authorization ?? '');
      const token = auth.startsWith('Bearer ') ? auth.slice(7).trim() : '';
      if (!token || token.length > 4000) return res.status(401).json({ ok: false, error: 'unauthorised' });
      const r = await rpc('admin_orders', {}, token);
      if (!r.ok) return res.status(401).json({ ok: false, error: 'unauthorised' });
      const o = (r.data as (Order & { customer: Cust })[]).find(x => x.invoice_number === inv);
      if (!o) return res.status(404).json({ ok: false, error: 'not found' });
      if (!o.customer?.email || !EMAIL.test(o.customer.email)) return res.status(200).json({ ok: true, skipped: true });
      return res.status(200).json({ ok: true, sent: (await send(o.customer.email, statusMail(o, { ...o.customer, name: clean(o.customer.name, 60), address: clean(o.customer.address, 200) }))) ? 1 : 0 });
    }
    return res.status(400).json({ ok: false, error: 'bad request' });
  } catch {
    return res.status(500).json({ ok: false, error: 'failed' });
  }
}
