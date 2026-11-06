'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { UserCheck, AlertCircle } from 'lucide-react';

export default function RegisterPage() {
  const router = useRouter();
  const { register } = useAuth();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!termsAccepted) {
      setError('You must agree to the Terms and Conditions and Privacy Policy before creating an account.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      await register({
        fullName,
        email,
        phone,
        password,
      });
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Registration failed. Please check your details.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-[85vh] flex items-center justify-center bg-sand-100 px-4 py-16">
      <div className="w-full max-w-md rounded-3xl border border-linen bg-white p-8 sm:p-10 shadow-elevated space-y-6">
        <div className="text-center space-y-2">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-forest-900 text-sand-50 font-serif font-bold text-2xl mx-auto shadow-sm">
            Y
          </div>
          <h1 className="font-serif text-3xl font-semibold text-forest-900">
            Create Guest Account
          </h1>
          <p className="text-xs text-charcoal-700">
            Join Yahsab for seamless booking, stay history, and verified reviews.
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
            label="Full Legal Name"
            required
            placeholder="e.g. David Iorfa"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />

          <Input
            label="Email Address"
            type="email"
            required
            placeholder="e.g. david@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />

          <Input
            label="Phone Number"
            placeholder="e.g. 08031234567"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-charcoal-700 mb-1.5">
              Password (min 8 chars with uppercase & number)
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

          <div className="space-y-3 rounded-2xl border border-linen bg-sand-50 p-3 text-xs text-charcoal-700">
            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4"
                required
              />
              <span>
                I agree to the{' '}
                <Link href="/terms" target="_blank" rel="noreferrer" className="font-semibold text-terracotta-600 underline underline-offset-2">
                  Terms and Conditions
                </Link>{' '}
                and{' '}
                <Link href="/privacy" target="_blank" rel="noreferrer" className="font-semibold text-terracotta-600 underline underline-offset-2">
                  Privacy Policy
                </Link>
                .
              </span>
            </label>

            <label className="flex items-start gap-2">
              <input
                type="checkbox"
                checked={marketingConsent}
                onChange={(e) => setMarketingConsent(e.target.checked)}
                className="mt-0.5 h-4 w-4"
              />
              <span>Optional: I would like to receive Yahsab updates and special offers by email.</span>
            </label>
          </div>

          <Button
            type="submit"
            variant="accent"
            size="lg"
            className="w-full"
            isLoading={isLoading}
            leftIcon={<UserCheck className="w-4 h-4" />}
          >
            Create Account
          </Button>
        </form>

        <div className="text-center text-xs text-charcoal-700 pt-2 border-t border-linen">
          Already have an account?{' '}
          <Link
            href="/auth/login"
            className="font-semibold text-terracotta-600 hover:underline"
          >
            Sign in
          </Link>
        </div>
      </div>
    </main>
  );
}
