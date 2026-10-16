import { useState, type FormEvent } from 'react';
import { Link, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../lib/auth';

const field = 'mt-1 w-full rounded-lg border border-line px-3 py-2.5 text-base focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/30 aria-[invalid=true]:border-red-500';

export default function Login() {
  const { session, ready, signIn, signUp } = useAuth();
  const nav = useNavigate();
  const [sp] = useSearchParams();
  const rawNext = sp.get('next') ?? '';
  const next = rawNext.startsWith('/') && !rawNext.startsWith('//') ? rawNext : '/account';
  const [mode, setMode] = useState<'in' | 'up'>('in');
  const [f, setF] = useState({ name: '', email: '', password: '' });
  const [errs, setErrs] = useState<Record<string, string>>({});
  const [serverErr, setServerErr] = useState('');
  const [confirm, setConfirm] = useState(false);
  const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) => setF(s => ({ ...s, [k]: e.target.value }));

  if (ready && session) return <Navigate to={next} replace />;

  function switchMode(m: 'in' | 'up') { setMode(m); setErrs({}); setServerErr(''); setConfirm(false); }

  async function submit(e: FormEvent) {
    e.preventDefault();
    const v: Record<string, string> = {};
    if (mode === 'up' && !f.name.trim()) v.name = 'Please enter your name';
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) v.email = 'Enter a valid email address';
    if (f.password.length < 8) v.password = 'Password must be at least 8 characters';
    setErrs(v); setServerErr('');
    if (Object.keys(v).length) return;
    setBusy(true);
    try {
      if (mode === 'in') { await signIn(f.email.trim(), f.password); nav(next, { replace: true }); return; }
      const r = await signUp(f.name.trim(), f.email.trim(), f.password);
      if (r.needsConfirm) setConfirm(true); else nav(next, { replace: true });
    } catch (err) {
      setServerErr(err instanceof Error ? err.message : 'Something went wrong. Please try again.');
    }
    setBusy(false);
  }

  const input = (k: keyof typeof f, label: string, opts: React.InputHTMLAttributes<HTMLInputElement>) => (
    <div>
      <label htmlFor={k} className="text-sm font-medium">{label}</label>
      <input id={k} required value={f[k]} onChange={set(k)} aria-invalid={!!errs[k]} aria-describedby={errs[k] ? `${k}-e` : undefined} className={field} {...opts} />
      {errs[k] && <p id={`${k}-e`} className="mt-1 text-sm text-red-600">{errs[k]}</p>}
    </div>
  );
  const tab = (m: 'in' | 'up', label: string) => (
    <button type="button" role="tab" aria-selected={mode === m} onClick={() => switchMode(m)}
      className={`flex-1 rounded-full py-2 text-sm font-semibold ${mode === m ? 'bg-brand text-white' : 'text-muted hover:text-brand-dark'}`}>{label}</button>
  );

  return (
    <main className="mx-auto max-w-md px-4 py-10">
      <h1 className="text-3xl font-bold">{mode === 'in' ? 'Sign in' : 'Create account'}</h1>
      <div role="tablist" aria-label="Account" className="mt-6 flex gap-1 rounded-full bg-soft p-1">
        {tab('in', 'Sign in')}{tab('up', 'Create account')}
      </div>
      {confirm ? (
        <p role="status" className="mt-6 rounded-lg bg-soft p-4 text-sm">Check your email to confirm your account, then sign in.</p>
      ) : (
        <form onSubmit={submit} noValidate className="mt-6 space-y-4">
          {mode === 'up' && input('name', 'Full name', { autoComplete: 'name' })}
          {input('email', 'Email', { type: 'email', autoComplete: 'email' })}
          {input('password', 'Password', { type: 'password', autoComplete: mode === 'in' ? 'current-password' : 'new-password' })}
          {serverErr && <p role="alert" className="rounded-lg bg-red-50 p-3 text-sm text-red-700">{serverErr}</p>}
          <button disabled={busy} className="w-full rounded-full bg-brand py-3.5 font-semibold text-white hover:bg-brand-dark disabled:opacity-60">
            {busy ? 'Please wait…' : mode === 'in' ? 'Sign in' : 'Create account'}
          </button>
        </form>
      )}
      <p className="mt-8 text-center text-xs text-muted">Staff? <Link to="/admin/login" className="underline hover:text-brand-dark">Admin login</Link></p>
    </main>
  );
}
