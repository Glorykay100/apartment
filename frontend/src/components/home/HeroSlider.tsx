'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { ChevronLeft, ChevronRight, Calendar, Users, MapPin, Search } from 'lucide-react';

interface Slide {
  id: number;
  tagline: string;
  headline: string;
  subheadline: string;
  ctaText: string;
  ctaLink: string;
  image: string;
}

const slides: Slide[] = [
  {
    id: 1,
    tagline: 'Refined Hospitality in Makurdi & Abuja',
    headline: 'Thoughtful Living, Crafted for the Discerning Guest.',
    subheadline:
      'Experience Nigeria’s premier serviced short-lets with guaranteed 24/7 dual solar power, Starlink gigabit speed, and bespoke concierge care.',
    ctaText: 'Explore Residences',
    ctaLink: '/apartments',
    image:
      'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=2000&q=85',
  },
  {
    id: 2,
    tagline: 'River Benue Signature Collection',
    headline: 'Panoramic Terrace Views over the River Benue.',
    subheadline:
      'Unwind in our Old GRA Makurdi penthouses featuring wraparound timber balconies, artisan terracotta accents, and peaceful water sunsets.',
    ctaText: 'View Riverview Penthouses',
    ctaLink: '/apartments?city=Makurdi',
    image:
      'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?auto=format&fit=crop&w=2000&q=85',
  },
  {
    id: 3,
    tagline: 'Abuja Diplomatic Sanctuaries',
    headline: 'Hillside Serenity in Guzape & Wuse II.',
    subheadline:
      'Architectural luxury with private infinity pool access, marble bathrooms, acoustic double glazing, and 24/7 biometric perimeter security.',
    ctaText: 'Explore Abuja Suites',
    ctaLink: '/apartments?city=Abuja',
    image:
      'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=2000&q=85',
  },
];

export const HeroSlider: React.FC = () => {
  const router = useRouter();
  const [current, setCurrent] = useState(0);
  const [selectedCity, setSelectedCity] = useState('all');
  const [guests, setGuests] = useState('1');

  // Auto advance slides every 7 seconds
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % slides.length);
    }, 7000);
    return () => clearInterval(timer);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = new URLSearchParams();
    if (selectedCity !== 'all') query.set('city', selectedCity);
    if (guests) query.set('guests', guests);
    router.push(`/apartments?${query.toString()}`);
  };

  const currentSlide = slides[current];

  return (
    <div className="relative h-[85vh] min-h-[600px] max-h-[850px] w-full overflow-hidden bg-forest-950">
      {/* Background Slides */}
      {slides.map((slide, idx) => (
        <div
          key={slide.id}
          className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${
            idx === current ? 'opacity-100 z-10' : 'opacity-0 z-0'
          }`}
        >
          <Image
            src={slide.image}
            alt={slide.headline}
            fill
            priority={idx === 0}
            className="object-cover object-center scale-105 transition-transform duration-10000 ease-out"
          />
          {/* Subtle multi-layer gradient for editorial contrast */}
          <div className="absolute inset-0 bg-gradient-to-t from-forest-950 via-forest-950/40 to-forest-950/20" />
          <div className="absolute inset-0 bg-black/25" />
        </div>
      ))}

      {/* Slide Content */}
      <div className="relative z-20 mx-auto flex h-full max-w-7xl flex-col justify-end px-4 pb-28 pt-20 sm:px-6 lg:px-8">
        <div className="max-w-3xl space-y-4">
          <span className="inline-flex items-center gap-2 rounded-full border border-sand-50/20 bg-forest-900/60 px-3.5 py-1 text-xs font-bold uppercase tracking-[0.22em] text-sand-50 backdrop-blur-md">
            <span className="h-1.5 w-1.5 rounded-full bg-terracotta-400" />
            {currentSlide.tagline}
          </span>

          <h1 className="font-serif text-3xl sm:text-5xl lg:text-6xl font-semibold tracking-tight text-sand-50 leading-[1.12]">
            {currentSlide.headline}
          </h1>

          <p className="text-base sm:text-lg text-sand-200/90 leading-relaxed max-w-2xl font-light">
            {currentSlide.subheadline}
          </p>

          <div className="pt-2 flex flex-wrap items-center gap-4">
            <Link href={currentSlide.ctaLink}>
              <Button variant="accent" size="lg" className="rounded-xl px-8">
                {currentSlide.ctaText}
              </Button>
            </Link>
            <Link href="/tour">
              <Button
                variant="outline"
                size="lg"
                className="rounded-xl border-sand-50/30 text-sand-50 hover:bg-white/10 hover:border-sand-50/50"
              >
                View Virtual Tour
              </Button>
            </Link>
          </div>
        </div>

        {/* Quick Search Floating Bar */}
        <div className="mt-8 rounded-2xl border border-sand-50/15 bg-white/95 p-3 sm:p-4 backdrop-blur-md shadow-modal">
          <form
            onSubmit={handleSearch}
            className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 gap-3 items-center"
          >
            {/* Destination */}
            <div className="flex items-center gap-3 px-3 py-2 border-b sm:border-b-0 sm:border-r border-linen">
              <MapPin className="h-5 w-5 text-terracotta-500 shrink-0" />
              <div className="w-full text-left">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-charcoal-700">
                  Location
                </label>
                <select
                  value={selectedCity}
                  onChange={(e) => setSelectedCity(e.target.value)}
                  className="w-full bg-transparent text-sm font-semibold text-forest-900 focus:outline-none cursor-pointer"
                >
                  <option value="all">All Locations (Makurdi & Abuja)</option>
                  <option value="Makurdi">Makurdi, Benue State</option>
                  <option value="Abuja">Abuja, FCT</option>
                </select>
              </div>
            </div>

            {/* Stay Dates */}
            <div className="flex items-center gap-3 px-3 py-2 border-b sm:border-b-0 sm:border-r border-linen">
              <Calendar className="h-5 w-5 text-terracotta-500 shrink-0" />
              <div className="text-left">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-charcoal-700">
                  Dates
                </label>
                <span className="text-sm font-medium text-forest-900 cursor-pointer">
                  Select Check-in & Check-out
                </span>
              </div>
            </div>

            {/* Guests */}
            <div className="flex items-center gap-3 px-3 py-2 border-b md:border-b-0 md:border-r border-linen">
              <Users className="h-5 w-5 text-terracotta-500 shrink-0" />
              <div className="w-full text-left">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-charcoal-700">
                  Guests
                </label>
                <select
                  value={guests}
                  onChange={(e) => setGuests(e.target.value)}
                  className="w-full bg-transparent text-sm font-semibold text-forest-900 focus:outline-none cursor-pointer"
                >
                  <option value="1">1 Guest</option>
                  <option value="2">2 Guests</option>
                  <option value="4">3 - 4 Guests</option>
                  <option value="6">5 - 6 Guests</option>
                </select>
              </div>
            </div>

            {/* Submit */}
            <div className="sm:col-span-3 md:col-span-1">
              <Button
                type="submit"
                variant="primary"
                size="md"
                className="w-full py-3.5"
                leftIcon={<Search className="w-4 h-4" />}
              >
                Search Units
              </Button>
            </div>
          </form>
        </div>
      </div>

      {/* Navigation Arrows & Dots */}
      <div className="absolute bottom-6 right-8 z-20 hidden sm:flex items-center gap-3">
        <button
          onClick={() => setCurrent((prev) => (prev - 1 + slides.length) % slides.length)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-sand-50/20 bg-forest-950/60 text-sand-50 backdrop-blur-xs transition-colors hover:bg-forest-900"
          aria-label="Previous slide"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-2 px-2">
          {slides.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`h-2 transition-all duration-300 rounded-full ${
                i === current ? 'w-8 bg-terracotta-500' : 'w-2 bg-sand-50/40'
              }`}
              aria-label={`Go to slide ${i + 1}`}
            />
          ))}
        </div>

        <button
          onClick={() => setCurrent((prev) => (prev + 1) % slides.length)}
          className="flex h-10 w-10 items-center justify-center rounded-full border border-sand-50/20 bg-forest-950/60 text-sand-50 backdrop-blur-xs transition-colors hover:bg-forest-900"
          aria-label="Next slide"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
};
