'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { createSupabaseBrowserClient } from '@/lib/supabase/client';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Mail, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsSending(true);
    setSuccess(null);
    setError(null);

    try {
      const { error: resetError } = await createSupabaseBrowserClient().auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/auth/reset-password`,
      });
      if (resetError) throw resetError;
      setSuccess('We have sent password reset instructions to your email address if an account matches this profile.');
      setEmail('');
    } catch (err: any) {
      setError(err.message || 'Unable to send reset instructions right now.');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <main className="min-h-[80vh] flex items-center justify-center bg-sand-100 px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border border-linen bg-white p-8 shadow-elevated">
        <div className="mb-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-forest-900 text-sand-50 font-serif text-2xl font-bold">
            Y
          </div>
          <h1 className="mt-4 font-serif text-3xl font-semibold text-forest-900">
            Reset your password
          </h1>
          <p className="mt-2 text-xs text-charcoal-700">
            Enter the email linked to your Yahsab account.
          </p>
        </div>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-red-200 bg-red-50 p-3 text-xs text-red-700">
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 flex items-start gap-2 rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs text-emerald-700">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <span>{success}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-charcoal-700">
              Email address
            </label>
            <input
              type="email"
              required
              placeholder="you@example.com"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="w-full rounded-xl border border-linen bg-white px-4 py-2.5 text-sm text-charcoal-900 placeholder:text-charcoal-700/50 focus:border-terracotta-500 focus:outline-none focus:ring-1 focus:ring-terracotta-500"
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            size="lg"
            className="w-full"
            isLoading={isSending}
            leftIcon={<Mail className="h-4 w-4" />}
          >
            Send reset link
          </Button>
        </form>

        <div className="mt-6 border-t border-linen pt-4 text-center text-xs text-charcoal-700">
          <Link href="/auth/login" className="inline-flex items-center gap-1 font-semibold text-terracotta-600 hover:underline">
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
