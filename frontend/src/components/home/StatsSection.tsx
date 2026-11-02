import React from 'react';
import { Home, Zap, Clock, Star } from 'lucide-react';

export const StatsSection: React.FC = () => {
  const stats = [
    {
      label: 'Curated Residences',
      value: '8+',
      subtext: 'Boutique units across Makurdi & Abuja',
      icon: Home,
    },
    {
      label: 'Guaranteed Power',
      value: '100%',
      subtext: 'Dual solar inverters & silent backup gens',
      icon: Zap,
    },
    {
      label: 'Seamless Check-In',
      value: '14:00',
      subtext: 'Biometric keyless access & early bag drop',
      icon: Clock,
    },
    {
      label: 'Guest Rating',
      value: '4.9 ★',
      subtext: 'Based on verified guest stay reviews',
      icon: Star,
    },
  ];

  return (
    <section className="relative border-b border-linen bg-white py-16 sm:py-20">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 divide-y sm:divide-y-0 sm:divide-x divide-linen">
          {stats.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.label}
                className={`flex flex-col items-center sm:items-start text-center sm:text-left ${
                  idx !== 0 ? 'pt-6 sm:pt-0 sm:pl-8 lg:pl-10' : ''
                }`}
              >
                <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sand-200 text-terracotta-500 mb-4">
                  <Icon className="h-5 w-5" />
                </div>
                <div className="font-serif text-3xl sm:text-4xl font-bold tracking-tight text-forest-900">
                  {stat.value}
                </div>
                <div className="mt-1 text-sm font-semibold text-charcoal-900">
                  {stat.label}
                </div>
                <p className="mt-1 text-xs text-charcoal-700 leading-relaxed max-w-[200px]">
                  {stat.subtext}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
