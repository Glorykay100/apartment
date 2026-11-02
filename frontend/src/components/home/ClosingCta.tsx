import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { ArrowRight, PhoneCall, ShieldCheck } from 'lucide-react';

export const ClosingCta: React.FC = () => {
  return (
    <section className="relative overflow-hidden bg-forest-950 py-24 text-sand-50">
      {/* Background radial highlight */}
      <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-terracotta-500/10 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -left-32 h-96 w-96 rounded-full bg-forest-800/40 blur-3xl pointer-events-none" />

      <div className="relative z-10 mx-auto max-w-5xl px-4 text-center sm:px-6 lg:px-8">
        <span className="inline-flex items-center gap-2 rounded-full border border-sand-50/20 bg-forest-900/60 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.22em] text-sand-200">
          <ShieldCheck className="w-3.5 h-3.5 text-terracotta-400" />
          Makurdi & Abuja Serviced Stays
        </span>

        <h2 className="mt-6 font-serif text-3xl sm:text-5xl lg:text-6xl font-semibold tracking-tight leading-tight">
          Your Home of Quiet Luxury in Nigeria Awaits.
        </h2>

        <p className="mt-6 max-w-2xl mx-auto text-base sm:text-lg text-sand-200/80 font-light leading-relaxed">
          Book directly with Yahsab for guaranteed best rates, flexible cancellation, and seamless personal service from arrival to departure.
        </p>

        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Link href="/apartments">
            <Button
              variant="accent"
              size="lg"
              className="px-8 shadow-elevated"
              rightIcon={<ArrowRight className="w-4 h-4" />}
            >
              Start Booking Now
            </Button>
          </Link>
          <Link href="/contact">
            <Button
              variant="outline"
              size="lg"
              className="border-sand-50/30 text-sand-50 hover:bg-white/10 hover:border-sand-50/50"
              leftIcon={<PhoneCall className="w-4 h-4 text-terracotta-400" />}
            >
              Speak with Concierge
            </Button>
          </Link>
        </div>
      </div>
    </section>
  );
};
