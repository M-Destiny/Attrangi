import { useEffect, useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../lib/auth';

export default function AdminLogin() {
  const { session, ready, isStaff, signIn, signOut } = useAuth();
  const nav = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => { if (ready && session && isStaff) nav('/admin', { replace: true }); }, [ready, session, isStaff, nav]);

  async function submit(e: FormEvent) {
    e.preventDefault();
    setError(''); setBusy(true);
    try { await signIn(email.trim(), password); }
    catch (err) { setError(err instanceof Error ? err.message : 'Sign in failed'); }
    finally { setBusy(false); }
  }

  const noAccess = ready && session && !isStaff;
  const input = 'w-full rounded-lg border border-line px-3 py-2.5 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/30';

  return (
    <main className="min-h-screen bg-soft flex items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white border border-line p-6 shadow-sm">
        <h1 className="text-2xl font-black text-brand">Attrangii</h1>
        <p className="text-sm text-muted mb-5">Admin sign in</p>

        {session && !ready ? (
          <p className="text-sm text-muted" role="status">Checking access…</p>
        ) : noAccess ? (
          <div role="alert" className="space-y-3">
            <p className="text-sm text-red-700">This account does not have admin access.</p>
            <button onClick={() => signOut()} className="w-full rounded-lg bg-ink text-white py-2.5 text-sm font-semibold">Sign out</button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4" noValidate>
            <div>
              <label htmlFor="email" className="block text-sm font-medium mb-1">Email</label>
              <input id="email" type="email" autoComplete="username" required value={email} onChange={e => setEmail(e.target.value)} className={input} disabled={busy} />
            </div>
            <div>
              <label htmlFor="pw" className="block text-sm font-medium mb-1">Password</label>
              <input id="pw" type="password" autoComplete="current-password" required value={password} onChange={e => setPassword(e.target.value)} className={input} disabled={busy} />
            </div>
            {error && <p role="alert" className="text-sm text-red-700">{error}</p>}
            <button type="submit" disabled={busy || !email || !password} className="w-full rounded-lg bg-brand hover:bg-brand-dark text-white py-2.5 text-sm font-semibold disabled:opacity-60">
              {busy ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        )}
        <Link to="/" className="block mt-5 text-center text-xs text-muted hover:text-ink">← Back to store</Link>
      </div>
    </main>
  );
}
