'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { ShieldAlert, Loader2 } from 'lucide-react';

/**
 * Blocking modal that appears when a logged-in user needs to re-accept
 * updated Terms, Privacy, and Refund Policy.
 * Shown on top of any page when the backend says needsReaccept: true.
 */
export const TermsReacceptModal: React.FC = () => {
  const { user, isLoading } = useAuth();
  const [needsReaccept, setNeedsReaccept] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [marketingOptIn, setMarketingOptIn] = useState(false);

  useEffect(() => {
    if (isLoading || !user) return;

    const checkTerms = async () => {
      try {
        const res = await api.get('/consent/terms-status');
        if (res.data?.success && res.data?.data?.needsReaccept) {
          setNeedsReaccept(true);
        }
      } catch {
        // Silently ignore — don't block users if the endpoint fails
      }
    };

    checkTerms();
  }, [isLoading, user]);

  const handleAccept = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      // Accept all three documents
      await Promise.all([
        api.post('/consent/accept', { documentType: 'terms', marketingOptIn }),
        api.post('/consent/accept', { documentType: 'privacy' }),
        api.post('/consent/accept', { documentType: 'refund' }),
      ]);

      setNeedsReaccept(false);
    } catch (err: any) {
      setError(err.message || 'Failed to record consent. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!needsReaccept) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm px-4">
      <div className="w-full max-w-lg rounded-3xl border border-linen bg-white p-8 shadow-modal space-y-6">
        <div className="text-center space-y-3">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-amber-100 text-amber-700 mx-auto">
            <ShieldAlert className="w-7 h-7" />
          </div>
          <h2 className="font-serif text-2xl font-semibold text-forest-900">
            We&apos;ve Updated Our Policies
          </h2>
          <p className="text-sm text-charcoal-700">
            We&apos;ve updated our Terms, Privacy, and Refund Policy to better serve you.
            Please review and accept the updated policies to continue.
          </p>
        </div>

        <div className="space-y-2 rounded-2xl border border-linen bg-sand-50 p-4 text-xs text-charcoal-700">
          <Link href="/terms" target="_blank" rel="noreferrer" className="block font-semibold text-terracotta-600 underline underline-offset-2">
            → Terms and Conditions (v1.0)
          </Link>
          <Link href="/privacy" target="_blank" rel="noreferrer" className="block font-semibold text-terracotta-600 underline underline-offset-2">
            → Privacy Policy (v1.0)
          </Link>
          <Link href="/refund-policy" target="_blank" rel="noreferrer" className="block font-semibold text-terracotta-600 underline underline-offset-2">
            → Refund Policy (v1.0)
          </Link>
        </div>

        <label className="flex items-start gap-2 text-xs text-charcoal-700">
          <input
            type="checkbox"
            checked={marketingOptIn}
            onChange={(e) => setMarketingOptIn(e.target.checked)}
            className="mt-0.5 h-4 w-4"
          />
          <span>Optional: I would like to receive Yahsab updates and special offers by email.</span>
        </label>

        {error && (
          <p className="text-xs text-red-700">{error}</p>
        )}

        <Button
          variant="accent"
          size="lg"
          className="w-full"
          onClick={handleAccept}
          disabled={isSubmitting}
          leftIcon={isSubmitting ? <Loader2 className="w-4 h-4 animate-spin" /> : undefined}
        >
          {isSubmitting ? 'Accepting...' : 'I Accept the Updated Policies'}
        </Button>
      </div>
    </div>
  );
};
