import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import type { Session } from '@supabase/supabase-js';
import { supabase } from './supabase';

interface AuthCtx {
  session: Session | null;
  /** false until the initial session + role lookup finished */
  ready: boolean;
  /** profile.role: 'customer' for shop accounts; anything else (admin/manager/staff) = CRM staff */
  role: string | null;
  isStaff: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (fullName: string, email: string, password: string) => Promise<{ needsConfirm: boolean }>;
  signOut: () => Promise<void>;
}
const Ctx = createContext<AuthCtx>(null!);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [role, setRole] = useState<string | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    let live = true;
    if (!session) { setRole(null); setReady(true); return; }
    setReady(false);
    supabase.from('profiles').select('role').eq('id', session.user.id).maybeSingle()
      .then(({ data }) => { if (live) { setRole(data?.role ?? 'customer'); setReady(true); } });
    return () => { live = false; };
  }, [session?.user.id]);

  const value: AuthCtx = {
    session, ready, role, isStaff: !!role && role !== 'customer',
    signIn: async (email, password) => { const { error } = await supabase.auth.signInWithPassword({ email, password }); if (error) throw new Error(error.message); },
    signUp: async (fullName, email, password) => {
      const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName } } });
      if (error) throw new Error(error.message);
      return { needsConfirm: !data.session };
    },
    signOut: async () => { await supabase.auth.signOut(); },
  };
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
