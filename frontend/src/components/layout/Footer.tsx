import React from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  Zap,
  Phone,
  Mail,
  MapPin,
  Clock,
  ArrowRight,
} from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-linen bg-sand-200 text-charcoal-900 transition-colors">
      {/* Upper Hospitality Highlights */}
      <div className="border-b border-linen/80 py-10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-forest-900 text-sand-50">
                <Zap className="h-6 w-6 text-terracotta-400" />
              </div>
              <div>
                <h4 className="font-serif text-lg font-semibold text-forest-900">
                  Uninterrupted Power Guarantee
                </h4>
                <p className="mt-1 text-sm text-charcoal-700 leading-relaxed">
                  24/7 dedicated dual solar inverters backed by silent diesel generators across all Makurdi and Abuja residences.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-forest-900 text-sand-50">
                <ShieldCheck className="h-6 w-6 text-terracotta-400" />
              </div>
              <div>
                <h4 className="font-serif text-lg font-semibold text-forest-900">
                  Biometric Privacy & Security
                </h4>
                <p className="mt-1 text-sm text-charcoal-700 leading-relaxed">
                  Smart keyless door locks, 24/7 uniformed perimeter surveillance, and strictly monitored access gates.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-forest-900 text-sand-50">
                <Clock className="h-6 w-6 text-terracotta-400" />
              </div>
              <div>
                <h4 className="font-serif text-lg font-semibold text-forest-900">
                  On-Demand Dedicated Concierge
                </h4>
                <p className="mt-1 text-sm text-charcoal-700 leading-relaxed">
                  Private airport transfers, professional in-house chef catering, and daily housekeeping arranged promptly.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Content */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10">
          {/* Brand Column */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-900 text-sand-50 font-serif font-bold text-xl">
                Y
              </div>
              <div>
                <span className="font-serif text-2xl font-semibold tracking-tight text-forest-900">
                  Yahsab
                </span>
                <span className="block text-[10px] uppercase tracking-[0.25em] text-terracotta-500 font-bold">
                  Luxury Apartments & Suites
                </span>
              </div>
            </div>

            <p className="text-sm text-charcoal-700 leading-relaxed max-w-sm">
              Refined short-let residences and serviced apartments in central Nigeria. Crafted for business executives, visiting families, and travelers who value silence, architecture, and warm hospitality.
            </p>

            <div className="pt-2 flex items-center gap-3 text-xs text-charcoal-700">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-600 animate-pulse" />
              <span>Reservations team active • WAT (UTC+1)</span>
            </div>
          </div>

          {/* Navigation Links */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-forest-900">
              Explore
            </p>
            <ul className="space-y-2.5 text-sm text-charcoal-700">
              <li>
                <Link href="/" className="hover:text-terracotta-500 transition-colors">
                  Home
                </Link>
              </li>
              <li>
                <Link href="/apartments" className="hover:text-terracotta-500 transition-colors">
                  All Apartments
                </Link>
              </li>
              <li>
                <Link href="/tour" className="hover:text-terracotta-500 transition-colors">
                  Take a Tour
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-terracotta-500 transition-colors">
                  Rates & Pricing
                </Link>
              </li>
              <li>
                <Link href="/about" className="hover:text-terracotta-500 transition-colors">
                  About Yahsab
                </Link>
              </li>
            </ul>
          </div>

          {/* Policies & Legal */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-forest-900">
              Policies
            </p>
            <ul className="space-y-2.5 text-sm text-charcoal-700">
              <li>
                <Link href="/terms#cancellation" className="hover:text-terracotta-500 transition-colors">
                  Cancellation Policy
                </Link>
              </li>
              <li>
                <Link href="/terms#house-rules" className="hover:text-terracotta-500 transition-colors">
                  House Rules & Quiet Hours
                </Link>
              </li>
              <li>
                <Link href="/terms#check-in" className="hover:text-terracotta-500 transition-colors">
                  Check-in Guidelines
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-terracotta-500 transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/contact" className="hover:text-terracotta-500 transition-colors">
                  Frequently Asked Questions
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact Details */}
          <div className="space-y-3">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-forest-900">
              Direct Contact
            </p>
            <div className="space-y-3 text-sm text-charcoal-700">
              <div className="flex items-start gap-2.5">
                <MapPin className="w-4 h-4 text-terracotta-500 shrink-0 mt-0.5" />
                <span>Plot 14, River Benue Crescent, Old GRA, Makurdi</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-terracotta-500 shrink-0" />
                <span>+234 (0) 803 123 4567</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-terracotta-500 shrink-0" />
                <span>reservations@yahsab.com</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-12 border-t border-linen pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-charcoal-700 gap-4">
          <p>© {new Date().getFullYear()} Yahsab Luxury Apartments & Suites. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Currency: <span className="font-semibold text-forest-900">Nigerian Naira (₦)</span> • Timezone: <span className="font-semibold text-forest-900">Africa/Lagos</span>
          </p>
        </div>
      </div>
    </footer>
  );
};
