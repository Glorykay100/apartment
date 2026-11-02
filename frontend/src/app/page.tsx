import React from 'react';
import { HeroSlider } from '@/components/home/HeroSlider';
import { StatsSection } from '@/components/home/StatsSection';
import { FeaturedListings } from '@/components/home/FeaturedListings';
import { AmenitiesGrid } from '@/components/home/AmenitiesGrid';
import { AddOnsSection } from '@/components/home/AddOnsSection';
import { FaqAccordion } from '@/components/home/FaqAccordion';
import { ClosingCta } from '@/components/home/ClosingCta';

export default function HomePage() {
  return (
    <main className="min-h-screen">
      <HeroSlider />
      <StatsSection />
      <FeaturedListings />
      <AmenitiesGrid />
      <AddOnsSection />
      <FaqAccordion />
      <ClosingCta />
    </main>
  );
}
