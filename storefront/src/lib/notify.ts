import { supabase } from './supabase';

/** Fire-and-forget email triggers. Never throw, never block the UI. */
const post = (body: object, token?: string) =>
  fetch('/api/notify', { method: 'POST', headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) }, body: JSON.stringify(body), keepalive: true }).catch(() => {});

export function notifyNewOrder(invoice_number: string, phone: string): void {
  void post({ type: 'new_order', invoice_number, phone });
}
export function notifyStatus(invoice_number: string): void {
  void supabase.auth.getSession().then(({ data }) => {
    const t = data.session?.access_token;
    if (t) void post({ type: 'status', invoice_number }, t);
  }).catch(() => {});
}
