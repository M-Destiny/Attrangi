import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react';
import type { CartLine, Product } from './types';

interface CartCtx {
  lines: CartLine[]; count: number; subtotal: number; open: boolean; setOpen: (o: boolean) => void;
  add: (p: Product, qty?: number) => void; setQty: (id: string, qty: number) => void; remove: (id: string) => void; clear: () => void;
}
const Ctx = createContext<CartCtx>(null!);
export const useCart = () => useContext(Ctx);
const KEY = 'attrangii-cart';

export function CartProvider({ children }: { children: ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>(() => { try { return JSON.parse(localStorage.getItem(KEY) || '[]'); } catch { return []; } });
  const [open, setOpen] = useState(false);
  useEffect(() => { try { localStorage.setItem(KEY, JSON.stringify(lines)); } catch {} }, [lines]);
  const clampQty = (p: Product, q: number) => Math.max(1, Math.min(q, p.stock_level));
  const value = useMemo<CartCtx>(() => ({
    lines, open, setOpen,
    count: lines.reduce((a, l) => a + l.qty, 0),
    subtotal: lines.reduce((a, l) => a + l.qty * l.product.selling_price, 0),
    add: (p, qty = 1) => { if (p.stock_level < 1) return; setLines(ls => {
      const ex = ls.find(l => l.product.id === p.id);
      return ex ? ls.map(l => l.product.id === p.id ? { product: p, qty: clampQty(p, l.qty + qty) } : l) : [...ls, { product: p, qty: clampQty(p, qty) }];
    }); setOpen(true); },
    setQty: (id, qty) => setLines(ls => ls.map(l => l.product.id === id ? { ...l, qty: clampQty(l.product, qty) } : l)),
    remove: id => setLines(ls => ls.filter(l => l.product.id !== id)),
    clear: () => setLines([]),
  }), [lines, open]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
