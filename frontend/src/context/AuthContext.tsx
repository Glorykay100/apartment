'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Role } from '@/types';
import { api } from '@/lib/api';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (payload: { fullName: string; email: string; password: string; phone?: string }) => Promise<boolean>;
  loginWithGoogle: (next?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);
const getSupabase = () => {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    throw new Error('Supabase Auth is not configured for this environment.');
  }
  return createSupabaseBrowserClient();
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshUser = async () => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    const { data: { session } } = await getSupabase().auth.getSession();
    if (!session) {
      setUser(null);
      setIsLoading(false);
      return;
    }
    try {
      const res = await api.get('/auth/me');
      setUser(res.data?.data?.user ?? null);
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      setIsLoading(false);
      return;
    }
    void refreshUser();
    const { data: { subscription } } = getSupabase().auth.onAuthStateChange(() => {
      // Supabase recommends deferring API work outside its auth callback.
      setTimeout(() => { void refreshUser(); }, 0);
    });
    return () => subscription.unsubscribe();
  }, []);

  const login = async (email: string, password: string) => {
    const { error } = await getSupabase().auth.signInWithPassword({ email, password });
    if (error) throw error;
    await refreshUser();
  };

  const register = async (payload: { fullName: string; email: string; password: string; phone?: string }) => {
    const { data, error } = await getSupabase().auth.signUp({
      email: payload.email,
      password: payload.password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback?next=/dashboard`,
        data: { full_name: payload.fullName, phone: payload.phone || '' },
      },
    });
    if (error) throw error;
    if (data.session) await refreshUser();
    return !data.session;
  };

  const loginWithGoogle = async (next = '/dashboard') => {
    const safeNext = next.startsWith('/') && !next.startsWith('//') ? next : '/dashboard';
    const callback = new URL('/auth/callback', window.location.origin);
    callback.searchParams.set('next', safeNext);
    const { error } = await getSupabase().auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: callback.toString(), queryParams: { access_type: 'offline', prompt: 'select_account' } },
    });
    if (error) throw error;
  };

  const logout = async () => {
    await getSupabase().auth.signOut();
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, isAdmin: user?.role === ('ADMIN' as Role), login, register, loginWithGoogle, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
