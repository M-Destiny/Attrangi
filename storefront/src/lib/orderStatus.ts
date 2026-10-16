import type { ShippingStatus } from './types';

/** Forward path shown as a timeline. 'returned' / 'cancelled' are terminal side-states. */
export const SHIPPING_STEPS: { key: ShippingStatus; label: string }[] = [
  { key: 'pending', label: 'Order placed' }, { key: 'packed', label: 'Packed' }, { key: 'shipped', label: 'Shipped' },
  { key: 'out_for_delivery', label: 'Out for delivery' }, { key: 'delivered', label: 'Delivered' },
];
export const SHIPPING_LABEL: Record<ShippingStatus, string> = {
  pending: 'Order placed', packed: 'Packed', shipped: 'Shipped', out_for_delivery: 'Out for delivery',
  delivered: 'Delivered', returned: 'Returned', cancelled: 'Cancelled',
};
export const PAYMENT_LABEL: Record<string, string> = {
  unpaid: 'Unpaid', paid: 'Paid', partially_paid: 'Partially paid', overdue: 'Overdue', cancelled: 'Cancelled',
};
export const PAYMENT_METHODS: { value: string; label: string }[] = [
  { value: 'upi', label: 'UPI' }, { value: 'bank_transfer', label: 'Bank transfer' }, { value: 'cash', label: 'Cash' },
  { value: 'card', label: 'Card' }, { value: 'other', label: 'Other' },
];
export const paymentMethodLabel = (v: string | null) => PAYMENT_METHODS.find(m => m.value === v)?.label ?? v ?? '';
