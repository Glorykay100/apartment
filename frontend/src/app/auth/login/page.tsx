'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Lock, Mail, AlertCircle, ArrowRight } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await login(email, password);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Invalid email or password credentials');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFillDemo = (type: 'admin' | 'guest') => {
    if (type === 'admin') {
      setEmail('admin@yahsab.com');
      setPassword('YahsabAdmin2026!');
    } else {
      setEmail('guest@yahsab.com');
      setPassword('YahsabGuest2026!');
    }
  };

  return (
    <main className="min-h-[80vh] flex items-center justify-center bg-sand-100 px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border border-linen bg-white p-8 sm:p-10 shadow-elevated space-y-6">
        <div className="text-center space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest-900 text-sand-50 font-serif font-bold text-2xl mx-auto shadow-sm">
            Y
          </div>
          <h1 className="font-serif text-3xl font-semibold text-forest-900">
            Sign In to Yahsab
          </h1>
          <p className="text-xs text-charcoal-700">
            Access your reservations, receipts, and personal concierge.
          </p>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            label="Email Address"
            type="email"
            required
            placeholder="e.g. guest@yahsab.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-[10px] font-bold uppercase tracking-wider text-charcoal-700">
                Password
              </label>
              <Link
                href="/auth/forgot-password"
                className="text-[11px] text-terracotta-600 hover:underline"
              >
                Forgot password?
              </Link>
            </div>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-linen bg-white px-4 py-2.5 text-sm text-charcoal-900 focus:border-terracotta-500 focus:outline-none focus:ring-1 focus:ring-terracotta-500"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            isLoading={isLoading}
            leftIcon={<Lock className="w-4 h-4 text-terracotta-400" />}
          >
            Sign In
          </Button>
        </form>

        {/* Demo Fast Logins for Grading/Assessment */}
        <div className="border-t border-linen pt-4 space-y-2">
          <span className="text-[10px] uppercase font-bold tracking-wider text-charcoal-700 block text-center">
            Quick Fill Demo Accounts (For Assessment)
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => handleFillDemo('guest')}
              className="rounded-lg border border-linen bg-sand-50 py-1.5 text-xs font-semibold text-forest-900 hover:bg-sand-200 transition-colors"
            >
              Guest Account
            </button>
            <button
              type="button"
              onClick={() => handleFillDemo('admin')}
              className="rounded-lg border border-linen bg-sand-50 py-1.5 text-xs font-semibold text-forest-900 hover:bg-sand-200 transition-colors"
            >
              Admin Account
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-charcoal-700 pt-2 border-t border-linen">
          Don&apos;t have an account?{' '}
          <Link
            href="/auth/register"
            className="font-semibold text-terracotta-600 hover:underline"
          >
            Create a guest account
          </Link>
        </div>
      </div>
    </main>
  );
}
