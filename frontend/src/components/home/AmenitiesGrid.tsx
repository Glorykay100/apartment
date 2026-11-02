import React from 'react';
import {
  Zap,
  Wifi,
  Droplets,
  KeyRound,
  Utensils,
  Briefcase,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';

export const AmenitiesGrid: React.FC = () => {
  const amenities = [
    {
      title: '24/7 Solar & Silent Gen Power',
      description:
        'Dual pure sine-wave solar inverters backed automatically by sound-insulated generators. Guaranteed zero power cuts or flickering.',
      icon: Zap,
    },
    {
      title: 'Starlink Gigabit Low-Latency WiFi',
      description:
        'Dedicated high-speed satellite broadband engineered for zoom conferences, remote tech teams, streaming, and large uploads.',
      icon: Wifi,
    },
    {
      title: 'Treated Central Water Filtration',
      description:
        'Multi-stage filtration and UV purification supplying safe, crystal-clear water with consistent high-pressure booster pumps.',
      icon: Droplets,
    },
    {
      title: 'Smart Keyless Biometric Entry',
      description:
        'Personalized digital PIN and RFID cards for effortless self-check-in at any hour, paired with 24/7 manned security perimeters.',
      icon: KeyRound,
    },
    {
      title: 'Fully Appointed Chef Kitchens',
      description:
        'Granite countertops, gas hobs, microwave ovens, cookware, blenders, and fine chinaware for wholesome home-cooked meals.',
      icon: Utensils,
    },
    {
      title: 'Dedicated Ergonomic Workspaces',
      description:
        'Solid timber desks, orthopedic mesh seating, multi-plug extension hubs, and warm task lighting designed for high productivity.',
      icon: Briefcase,
    },
  ];

  return (
    <section className="py-24 bg-white border-b border-linen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <span className="text-xs font-bold uppercase tracking-[0.22em] text-terracotta-500">
            Uncompromising Standards
          </span>
          <h2 className="mt-3 font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-forest-900">
            Engineered for Modern Living in Nigeria.
          </h2>
          <p className="mt-4 text-base text-charcoal-700 leading-relaxed font-light">
            We eliminate the everyday frictions of power, water, and connectivity so you can focus entirely on your work, rest, and loved ones.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {amenities.map((item) => {
            const Icon = item.icon;
            return (
              <div
                key={item.title}
                className="rounded-2xl border border-linen bg-sand-50/50 p-8 transition-all duration-300 hover:border-terracotta-500/40 hover:bg-white hover:shadow-subtle"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-forest-900 text-terracotta-400 mb-6">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="font-serif text-xl font-semibold text-forest-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-sm text-charcoal-700 leading-relaxed">
                  {item.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
