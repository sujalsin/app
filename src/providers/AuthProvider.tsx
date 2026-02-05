import { supabase } from '@/services/supabaseClient';
import { useUserStore } from '@/store/useStore';
import { Session, User } from '@supabase/supabase-js';
import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';

interface AuthContextValue {
  session: Session | null;
  user: User | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }): React.JSX.Element {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { setCredits, setTier } = useUserStore();

  const ensureProfile = async (u: User | null) => {
    if (!u) return;
    const { data, error } = await supabase.from('profiles').select('id, credits_remaining, tier').eq('id', u.id).single();
    if (error) {
      // If not found, create with defaults (3 free credits)
      await supabase.from('profiles').upsert({
        id: u.id,
        email: u.email,
        tier: 'free',
        credits_remaining: 3,
        credits_reset_date: new Date().toISOString(),
        total_generations: 0
      });
      setCredits(3);
      setTier('free');
    } else if (data) {
      setCredits(data.credits_remaining);
      setTier(data.tier);
    }
  };

  useEffect(() => {
    const bootstrap = async () => {
      const { data, error } = await supabase.auth.getSession();
      if (!error) {
        setSession(data.session);
        setUser(data.session?.user ?? null);
        await ensureProfile(data.session?.user ?? null);
      }
      setIsLoading(false);
    };

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);
      void ensureProfile(newSession?.user ?? null);
    });

    void bootstrap();
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    const { data: { user: authedUser } } = await supabase.auth.getUser();
    await ensureProfile(authedUser ?? null);
    return {};
  };

  const signUp = async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) return { error: error.message };
    await ensureProfile(data.user ?? null);
    return {};
  };

  const signOut = async () => {
    await supabase.auth.signOut();
  };

  const value = useMemo(
    () => ({
      session,
      user,
      isLoading,
      signIn,
      signUp,
      signOut,
    }),
    [session, user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
