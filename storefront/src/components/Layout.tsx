import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation } from 'react-router-dom';
import { Menu, ShoppingBag, User, X } from 'lucide-react';
import { useCart } from '../lib/cart';
import { useAuth } from '../lib/auth';
import CartDrawer from './CartDrawer';

const ring = 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand';
const links = [{ to: '/shop', label: 'Shop' }, { to: '/track', label: 'Track Order' }];
const navCls = ({ isActive }: { isActive: boolean }) => `rounded px-1 py-1 font-semibold hover:text-brand-dark ${ring} ${isActive ? 'text-brand-dark' : ''}`;

export default function Layout() {
  const { count, setOpen } = useCart();
  const { session } = useAuth();
  const first = ((session?.user.user_metadata?.full_name as string | undefined) ?? '').trim().split(/\s+/)[0];
  const [menu, setMenu] = useState(false);
  const { pathname } = useLocation();
  useEffect(() => { setMenu(false); window.scrollTo(0, 0); }, [pathname]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link to="/" aria-label="Attrangii home" className={`flex items-center gap-2 rounded ${ring}`}>
            <img src="/logo.png" alt="" className="h-9 w-auto" />
            <span className="font-display text-xl font-black text-brand">Attrangii</span>
          </Link>
          <nav aria-label="Main" className="hidden items-center gap-6 md:flex">
            {links.map(l => <NavLink key={l.to} {...l} className={navCls}>{l.label}</NavLink>)}
          </nav>
          <div className="flex items-center gap-1">
            <button onClick={() => setOpen(true)} aria-label={`Open cart, ${count} items`} className={`relative rounded-full p-2 hover:bg-soft ${ring}`}>
              <ShoppingBag size={22} />
              {count > 0 && <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand px-1 text-xs font-bold text-white">{count}</span>}
            </button>
            <Link to={session ? '/account' : '/login'} aria-label={session ? 'My account' : 'Sign in'} className={`flex items-center gap-1.5 rounded-full p-2 hover:bg-soft ${ring}`}>
              <User size={22} />
              <span className="hidden text-sm font-semibold md:inline">{session ? first || 'Account' : 'Sign in'}</span>
            </Link>
            <button onClick={() => setMenu(m => !m)} aria-label={menu ? 'Close menu' : 'Open menu'} aria-expanded={menu} className={`rounded-full p-2 hover:bg-soft md:hidden ${ring}`}>
              {menu ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
        {menu && (
          <nav aria-label="Mobile" className="flex flex-col gap-3 border-t border-line px-4 py-4 md:hidden">
            {links.map(l => <NavLink key={l.to} {...l} className={navCls}>{l.label}</NavLink>)}
            <NavLink to={session ? '/account' : '/login'} className={navCls}>{session ? 'My account' : 'Sign in'}</NavLink>
          </nav>
        )}
      </header>
      <main className="flex-1"><Outlet /></main>
      <footer className="mt-16 border-t border-line bg-soft">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-8 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="font-display text-lg font-black text-brand">Attrangii</p>
          </div>
          <nav aria-label="Footer" className="flex gap-4">
            {links.map(l => <Link key={l.to} to={l.to} className={`rounded hover:text-brand-dark ${ring}`}>{l.label}</Link>)}
          </nav>
          <p>&copy; {new Date().getFullYear()} Attrangii</p>
        </div>
        <p className="pb-6 text-center text-xs font-bold uppercase tracking-widest text-muted opacity-60 transition-opacity hover:opacity-100">
          Made with <span aria-label="love" role="img">❤️</span> by{' '}
          <a href="https://github.com/M-Destiny" target="_blank" rel="noopener noreferrer" className={`rounded text-brand-dark underline decoration-brand/30 underline-offset-4 ${ring}`}>Destiny</a>
        </p>
      </footer>
      <CartDrawer />
    </div>
  );
}
