'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';

const COOKIE_NAME = 'yahsab_cookie_consent';

type ConsentPrefs = {
  necessary: true;
  analytics: boolean;
  marketing: boolean;
};

const defaultPrefs: ConsentPrefs = {
  necessary: true,
  analytics: false,
  marketing: false,
};

const readConsent = (): ConsentPrefs | null => {
  if (typeof document === 'undefined') return null;

  const cookieValue = document.cookie
    .split('; ')
    .find((entry) => entry.startsWith(`${COOKIE_NAME}=`));

  if (!cookieValue) return null;

  try {
    const parsed = JSON.parse(decodeURIComponent(cookieValue.split('=')[1]));
    return {
      necessary: true,
      analytics: Boolean(parsed.analytics),
      marketing: Boolean(parsed.marketing),
    };
  } catch {
    return null;
  }
};

const writeConsent = (prefs: ConsentPrefs) => {
  if (typeof document === 'undefined') return;
  const payload = encodeURIComponent(JSON.stringify(prefs));
  document.cookie = `${COOKIE_NAME}=${payload}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
};

export const CookieConsent: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPrefs>(defaultPrefs);
  const [showPreferences, setShowPreferences] = useState(false);

  useEffect(() => {
    const stored = readConsent();
    if (stored) {
      setPreferences(stored);
    } else {
      setIsOpen(true);
    }
  }, []);

  const save = (next: ConsentPrefs) => {
    setPreferences(next);
    writeConsent(next);
    setIsOpen(false);
    setShowPreferences(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 px-4 pb-4">
      <div className="mx-auto max-w-6xl rounded-3xl border border-linen bg-white p-5 shadow-elevated">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="text-xs font-bold uppercase tracking-[0.22em] text-charcoal-700">
              Your privacy choices
            </p>
            <h3 className="mt-2 font-serif text-2xl font-semibold text-forest-900">
              We use cookies to protect your booking experience.
            </h3>
            <p className="mt-2 text-sm text-charcoal-700">
              Necessary cookies keep the site secure and functional. Optional analytics and marketing cookies only run after you consent.
              <Link href="/cookies" className="ml-1 font-semibold text-terracotta-600 underline underline-offset-2">
                View cookie details
              </Link>
            </p>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row">
            <Button variant="outline" size="md" onClick={() => save({ ...defaultPrefs, analytics: false, marketing: false })}>
              Reject non-essential
            </Button>
            <Button variant="primary" size="md" onClick={() => save({ ...defaultPrefs, analytics: true, marketing: true })}>
              Accept all
            </Button>
          </div>
        </div>

        {showPreferences && (
          <div className="mt-5 rounded-2xl border border-linen bg-sand-50 p-4">
            <div className="space-y-3">
              <label className="flex items-center justify-between gap-4 rounded-xl border border-linen bg-white px-3 py-2 text-sm text-charcoal-800">
                <span>Analytics cookies</span>
                <input
                  type="checkbox"
                  checked={preferences.analytics}
                  onChange={(e) => setPreferences({ ...preferences, analytics: e.target.checked })}
                  className="h-4 w-4"
                />
              </label>
              <label className="flex items-center justify-between gap-4 rounded-xl border border-linen bg-white px-3 py-2 text-sm text-charcoal-800">
                <span>Marketing cookies</span>
                <input
                  type="checkbox"
                  checked={preferences.marketing}
                  onChange={(e) => setPreferences({ ...preferences, marketing: e.target.checked })}
                  className="h-4 w-4"
                />
              </label>
            </div>

            <div className="mt-4 flex justify-end">
              <Button
                variant="primary"
                size="sm"
                onClick={() => save({ necessary: true, analytics: preferences.analytics, marketing: preferences.marketing })}
              >
                Save preferences
              </Button>
            </div>
          </div>
        )}

        <div className="mt-4 flex justify-end">
          <button
            type="button"
            onClick={() => setShowPreferences((current) => !current)}
            className="text-xs font-semibold text-terracotta-600 underline underline-offset-2"
          >
            {showPreferences ? 'Hide preferences' : 'Manage preferences'}
          </button>
        </div>
      </div>
    </div>
  );
};
