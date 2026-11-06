import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ArrowRight } from 'lucide-react';

export default function CookiePolicyPage() {
  return (
    <main className="min-h-screen bg-sand-100 py-16 sm:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <span className="text-xs font-bold uppercase tracking-[0.22em] text-terracotta-500">
            Cookies
          </span>
          <h1 className="mt-3 font-serif text-4xl sm:text-5xl font-semibold tracking-tight text-forest-900">
            Cookie Policy
          </h1>
          <p className="mt-3 text-sm text-charcoal-700">
            Last updated: November 2026 • Version 1.0
          </p>
        </div>

        <div className="rounded-3xl border border-linen bg-white p-8 sm:p-12 shadow-subtle space-y-8">
          <section className="space-y-4">
            <h2 className="font-serif text-2xl font-semibold text-forest-900">1. Necessary cookies</h2>
            <ul className="space-y-2 list-disc pl-5 text-sm leading-relaxed text-charcoal-700">
              <li><strong>yahsab_session</strong> — keeps your logged-in state secure during your booking session.</li>
              <li><strong>yahsab_cookie_consent</strong> — stores your cookie preferences and consent choice.</li>
              <li><strong>token</strong> — session authentication cookie for authenticated requests.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl font-semibold text-forest-900">2. Preference cookies</h2>
            <ul className="space-y-2 list-disc pl-5 text-sm leading-relaxed text-charcoal-700">
              <li><strong>yahsab_theme</strong> — remembers display preferences if any theme option is enabled.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl font-semibold text-forest-900">3. Analytics and marketing cookies</h2>
            <p className="text-sm leading-relaxed text-charcoal-700">
              These cookies are not activated until you provide consent. They help us understand site usage, improve the booking journey, and evaluate the effectiveness of campaigns. No analytical or marketing scripts are loaded before consent is given.
            </p>
          </section>
        </div>

        <div className="mt-10 text-center">
          <Link href="/privacy">
            <Button variant="primary" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
              View privacy policy
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
