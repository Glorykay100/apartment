import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ArrowRight } from 'lucide-react';

export default function PrivacyPolicyPage() {
  return (
    <main className="min-h-screen bg-sand-100 py-16 sm:py-24">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="mb-10">
          <span className="text-xs font-bold uppercase tracking-[0.22em] text-terracotta-500">
            Privacy
          </span>
          <h1 className="mt-3 font-serif text-4xl sm:text-5xl font-semibold tracking-tight text-forest-900">
            Privacy Policy
          </h1>
          <p className="mt-3 text-sm text-charcoal-700">
            Last updated: November 2026 • Version 1.0 • Nigeria Data Protection Act 2023 aligned
          </p>
        </div>

        <div className="rounded-3xl border border-linen bg-white p-8 sm:p-12 shadow-subtle space-y-8">
          <section className="space-y-4">
            <h2 className="font-serif text-2xl font-semibold text-forest-900">1. Information we collect</h2>
            <p className="text-sm leading-relaxed text-charcoal-700">
              Yahsab collects personal information needed to provide accommodation, confirm bookings, and fulfill payment and support requests. This may include full name, email address, phone number, booking dates, apartment selection, guest count, payment reference, booking notes, IP address, browser information, device identifiers, and cookie preferences.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl font-semibold text-forest-900">2. How we use your information</h2>
            <ul className="list-disc space-y-2 pl-5 text-sm leading-relaxed text-charcoal-700">
              <li>To manage reservations, check-in requests, guest communication, and access support.</li>
              <li>To process payment verification through Paystack and to send confirmation and operational emails.</li>
              <li>To maintain security, prevent fraud, manage disputes, and enforce house rules.</li>
              <li>To meet legal and regulatory requirements, including customer support and safeguarding records.</li>
            </ul>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl font-semibold text-forest-900">3. Information sharing</h2>
            <p className="text-sm leading-relaxed text-charcoal-700">
              We share necessary personal data with Paystack for payment authorization and verification, Brevo for transactional and service emails, Cloudinary for image processing when relevant, and hosting providers or operational support vendors where required. We do not sell personal data.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl font-semibold text-forest-900">4. Retention and security</h2>
            <p className="text-sm leading-relaxed text-charcoal-700">
              We retain booking, payment, and support records for reasonable periods required to operate the business, comply with laws, handle disputes, and satisfy audit needs. We store data using secure hosting, controlled access, and encrypted transport where possible.
            </p>
          </section>

          <section className="space-y-4">
            <h2 className="font-serif text-2xl font-semibold text-forest-900">5. Your rights</h2>
            <p className="text-sm leading-relaxed text-charcoal-700">
              You may ask to access, correct, or delete your personal data, object to certain uses, withdraw consent for marketing communications, or request restrictions on processing. To exercise these rights, contact inquiries@yahsab.com.
            </p>
          </section>
        </div>

        <div className="mt-10 text-center">
          <Link href="/terms">
            <Button variant="primary" size="lg" rightIcon={<ArrowRight className="h-4 w-4" />}>
              Back to terms
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
