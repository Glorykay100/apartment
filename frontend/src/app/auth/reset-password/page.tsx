'use client';

import React, { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import { AlertCircle, CheckCircle2, Lock } from 'lucide-react';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error: updateError } = await createSupabaseBrowserClient().auth.updateUser({ password });
      if (updateError) throw updateError;
      setSuccess(true);
      setTimeout(() => router.push('/auth/login'), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to reset password. The link may have expired.');
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-[85vh] flex items-center justify-center bg-sand-100 px-4 py-16">
        <div className="w-full max-w-md rounded-3xl border border-linen bg-white p-8 sm:p-10 shadow-elevated space-y-6 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-700 mx-auto">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h1 className="font-serif text-2xl font-semibold text-forest-900">Password Reset</h1>
          <p className="text-xs text-charcoal-700">
            Your password has been successfully reset. Redirecting to login...
          </p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-[85vh] flex items-center justify-center bg-sand-100 px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border border-linen bg-white p-8 sm:p-10 shadow-elevated space-y-6">
        <div className="text-center space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest-900 text-sand-50 font-serif font-bold text-2xl mx-auto shadow-sm">
            Y
          </div>
          <h1 className="font-serif text-2xl font-semibold text-forest-900">Set New Password</h1>
          <p className="text-xs text-charcoal-700">Enter your new password below.</p>
        </div>

        {error && (
          <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3.5 text-xs text-red-700">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-charcoal-700 mb-1.5">
              New Password (min 8 chars with uppercase & number)
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-linen bg-white px-4 py-2.5 text-sm text-charcoal-900 focus:border-terracotta-500 focus:outline-none focus:ring-1 focus:ring-terracotta-500"
            />
          </div>
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-charcoal-700 mb-1.5">
              Confirm New Password
            </label>
            <input
              type="password"
              required
              placeholder="••••••••"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full rounded-xl border border-linen bg-white px-4 py-2.5 text-sm text-charcoal-900 focus:border-terracotta-500 focus:outline-none focus:ring-1 focus:ring-terracotta-500"
            />
          </div>
          <Button type="submit" variant="accent" size="lg" className="w-full" isLoading={isLoading} leftIcon={<Lock className="w-4 h-4" />}>
            Reset Password
          </Button>
        </form>
      </div>
    </main>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <main className="min-h-[85vh] flex items-center justify-center bg-sand-100 px-4 py-16">
          <div className="w-full max-w-md rounded-3xl border border-linen bg-white p-8 sm:p-10 shadow-elevated space-y-6">
            <Skeleton className="h-12 w-12 rounded-2xl mx-auto" />
            <Skeleton className="h-8 w-48 mx-auto" />
            <Skeleton className="h-64 w-full rounded-2xl" />
          </div>
        </main>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
