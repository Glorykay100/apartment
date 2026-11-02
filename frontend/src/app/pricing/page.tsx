import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Check, ArrowRight, ShieldCheck, Zap, Wifi } from 'lucide-react';
import { AddOnsSection } from '@/components/home/AddOnsSection';

export default function PricingPage() {
  const tiers = [
    {
      name: 'Executive Studio Tier',
      tagline: 'Ideal for solo travelers, business consultants & short work trips',
      price: '₦28,000 – ₦35,000',
      period: 'per night',
      popular: false,
      features: [
        '1 Queen or King bed (max 2 guests)',
        'Dedicated ergonomic workstation & desk',
        '24/7 Solar & silent diesel power backup',
        'Starlink gigabit WiFi connection',
        'Streamlined kitchenette & refrigerator',
        '65" 4K Smart TV with Netflix',
        'Biometric keyless door lock',
        'Fixed ₦3,500 – ₦4,000 cleaning fee per stay',
      ],
      ctaText: 'View Studios',
      link: '/apartments?bedrooms=1',
    },
    {
      name: 'Garden & Heritage Residence',
      tagline: 'Best for couples, small families & long-term consultants',
      price: '₦42,000 – ₦55,000',
      period: 'per night',
      popular: true,
      features: [
        '2 En-suite bedrooms (up to 4 guests)',
        'Spacious living room & separate dining area',
        'Full chef kitchen with gas hob & oven',
        'In-unit automatic washing machine',
        '24/7 Solar & generator power guarantee',
        'Private garden porch or shaded balcony',
        'Starlink gigabit low-latency broadband',
        'Fixed ₦5,000 – ₦6,000 cleaning fee per stay',
      ],
      ctaText: 'View 2-Bed Residences',
      link: '/apartments?bedrooms=2',
    },
    {
      name: 'Signature Penthouse & Villa',
      tagline: 'Executive luxury, diplomatic delegations & family vacations',
      price: '₦85,000 – ₦125,000',
      period: 'per night',
      popular: false,
      features: [
        '3 Luxurious en-suite bedrooms (up to 6 guests)',
        'Panoramic river or city sunset views',
        'Wrap-around terrace or private pool access',
        'Bespoke oak & marble kitchen island',
        'In-unit washer & dryer laundry station',
        'Master soaking tub & rain shower',
        'Priority airport transfer reservation',
        'Fixed ₦8,000 – ₦10,000 cleaning fee per stay',
      ],
      ctaText: 'View Penthouses',
      link: '/apartments?bedrooms=3',
    },
  ];

  return (
    <main className="min-h-screen bg-sand-100 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-[0.22em] text-terracotta-500">
            Clear & Honest Rates
          </span>
          <h1 className="mt-3 font-serif text-4xl sm:text-5xl font-semibold tracking-tight text-forest-900">
            Transparent Pricing, Zero Hidden Surcharges.
          </h1>
          <p className="mt-4 text-base text-charcoal-700 leading-relaxed font-light">
            All rates are charged in Nigerian Naira (₦). Every booking includes 24/7 solar electricity, treated water, Starlink broadband, and secure parking.
          </p>
        </div>

        {/* Pricing Tiers Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-stretch">
          {tiers.map((tier) => (
            <div
              key={tier.name}
              className={`relative flex flex-col justify-between rounded-3xl border p-8 transition-all duration-300 ${
                tier.popular
                  ? 'border-terracotta-500 bg-white shadow-elevated ring-1 ring-terracotta-500'
                  : 'border-linen bg-white/80 shadow-subtle hover:shadow-elevated'
              }`}
            >
              {tier.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2">
                  <Badge variant="accent" size="sm" className="px-4 py-1">
                    Most Popular Choice
                  </Badge>
                </div>
              )}

              <div>
                <h3 className="font-serif text-2xl font-semibold text-forest-900">
                  {tier.name}
                </h3>
                <p className="mt-2 text-xs text-charcoal-700 min-h-[32px]">
                  {tier.tagline}
                </p>

                <div className="mt-6 border-b border-linen pb-6">
                  <div className="font-serif text-3xl sm:text-4xl font-bold text-forest-900">
                    {tier.price}
                  </div>
                  <span className="text-xs text-charcoal-700 font-sans mt-1 block">
                    {tier.period}
                  </span>
                </div>

                {/* Features checklist */}
                <ul className="mt-6 space-y-3 text-xs text-charcoal-800 leading-relaxed">
                  {tier.features.map((feat) => (
                    <li key={feat} className="flex items-start gap-2.5">
                      <div className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full bg-sand-200 text-forest-900 mt-0.5">
                        <Check className="h-3 w-3" />
                      </div>
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="mt-8 pt-6 border-t border-linen">
                <Link href={tier.link} className="w-full">
                  <Button
                    variant={tier.popular ? 'accent' : 'outline'}
                    size="md"
                    className="w-full"
                    rightIcon={<ArrowRight className="w-4 h-4" />}
                  >
                    {tier.ctaText}
                  </Button>
                </Link>
              </div>
            </div>
          ))}
        </div>

        {/* Long-Stay Savings Banner */}
        <div className="mt-16 rounded-3xl border border-linen bg-forest-900 text-sand-50 p-8 sm:p-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
            <div className="md:col-span-2 space-y-2">
              <span className="text-xs font-bold uppercase tracking-[0.22em] text-terracotta-400">
                Extended Stay Benefits
              </span>
              <h3 className="font-serif text-2xl sm:text-3xl font-semibold">
                Special Rates for Weekly & Monthly Residences.
              </h3>
              <p className="text-sm text-sand-200 font-light leading-relaxed">
                Enjoy automatic discounts for prolonged stays: 10% discount applied automatically on 7+ nights, and 20% discount on 30+ nights. Ideal for corporate relocations and project consultants.
              </p>
            </div>
            <div className="text-left md:text-right">
              <Link href="/apartments">
                <Button variant="accent" size="lg">
                  Check Extended Dates
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Add-on Pricing Section */}
      <div id="add-ons" className="mt-20">
        <AddOnsSection />
      </div>
    </main>
  );
}
