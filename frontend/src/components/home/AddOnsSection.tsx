import React from 'react';
import { Car, UtensilsCrossed, Sparkles, Shirt, Check } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export const AddOnsSection: React.FC = () => {
  const addOns = [
    {
      title: 'Airport Chauffeur Transfer',
      price: '₦15,000',
      period: 'per trip',
      description:
        'Punctual airport pickup or drop-off in a clean, air-conditioned executive sedan or SUV with dedicated luggage handling.',
      icon: Car,
      features: ['Flight delay tracking', 'Meet & greet with nameboard', 'Chilled bottled water on board'],
    },
    {
      title: 'Private In-House Gourmet Chef',
      price: '₦25,000',
      period: 'per day + groceries',
      description:
        'A dedicated culinary specialist preparing fresh, bespoke Nigerian and continental dishes right in your apartment kitchen.',
      icon: UtensilsCrossed,
      features: ['Custom meal planning', 'Fresh local market sourcing', 'Post-meal kitchen sanitization'],
    },
    {
      title: 'Daily Turn-Down & Housekeeping',
      price: '₦5,000',
      period: 'per day',
      description:
        'Meticulous daily cleaning, fresh Egyptian cotton bedlinen change, towel replacement, and organic aromatherapy misting.',
      icon: Sparkles,
      features: ['Daily surface disinfection', 'Bed making & trash clearance', 'Fresh bathroom toiletries'],
    },
    {
      title: 'Express Laundry & Pressing',
      price: '₦8,000',
      period: 'per basket (up to 12 items)',
      description:
        'Same-day garment washing, tumble drying, and crisp steam ironing returned neatly folded or hung in garment bags.',
      icon: Shirt,
      features: ['Same-day return available', 'Delicate fabric care', 'Steam pressed and bagged'],
    },
  ];

  return (
    <section className="py-24 bg-sand-200/60 border-b border-linen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-[0.22em] text-terracotta-500">
              Personalized Hospitality
            </span>
            <h2 className="mt-3 font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-forest-900">
              Bespoke Add-Ons to Elevate Your Stay.
            </h2>
            <p className="mt-3 text-base text-charcoal-700 leading-relaxed font-light">
              Tailor your booking with our curated concierge services. Add them conveniently during checkout or request anytime through your host.
            </p>
          </div>

          <Link href="/pricing#add-ons">
            <Button variant="outline" size="md">
              View Pricing Details
            </Button>
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {addOns.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="flex flex-col justify-between rounded-2xl border border-linen bg-white p-6 transition-all duration-300 hover:shadow-elevated"
              >
                <div>
                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-forest-900 text-terracotta-400 mb-5">
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-serif text-lg font-semibold text-forest-900">
                    {item.title}
                  </h3>
                  <div className="mt-2 flex items-baseline gap-1">
                    <span className="font-serif text-2xl font-bold text-terracotta-600">
                      {item.price}
                    </span>
                    <span className="text-xs text-charcoal-700">{item.period}</span>
                  </div>
                  <p className="mt-3 text-xs text-charcoal-700 leading-relaxed">
                    {item.description}
                  </p>

                  <ul className="mt-4 space-y-2 border-t border-linen pt-4 text-xs text-charcoal-700">
                    {item.features.map((feat) => (
                      <li key={feat} className="flex items-center gap-2">
                        <Check className="h-3.5 w-3.5 text-forest-900 shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-6 pt-2">
                  <Link href="/apartments">
                    <Button variant="outline" size="sm" className="w-full">
                      Select with Stay
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
