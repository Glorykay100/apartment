'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Apartment } from '@/types';
import { api } from '@/lib/api';
import { formatNaira } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Skeleton } from '@/components/ui/Skeleton';
import { Users, Bed, Bath, Star, ArrowRight, MapPin } from 'lucide-react';

const FALLBACK_FEATURED_APARTMENTS: Apartment[] = [
  {
    id: 'fallback-1',
    slug: 'the-benue-terrace-penthouse',
    title: 'The Benue Terrace Penthouse',
    headline: 'Panoramic river views and private terrace living in Makurdi.',
    description: 'A refined penthouse with a wrap-around terrace and premium city views.',
    address: 'Plot 14, River Benue Crescent, Old GRA',
    city: 'Makurdi',
    state: 'Benue',
    basePricePerNight: 85000,
    cleaningFee: 8000,
    serviceFeeRate: 0.05,
    bedrooms: 3,
    bathrooms: 3,
    maxGuests: 6,
    sqft: 2200,
    isFeatured: true,
    isPublished: true,
    checkInTime: '14:00',
    checkOutTime: '11:00',
    houseRules: ['No smoking indoors', 'Quiet hours after 10 PM'],
    images: [
      {
        id: 'fallback-1-image',
        apartmentId: 'fallback-1',
        url: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=80',
        caption: 'Terrace lounge with a panoramic river view',
        isPrimary: true,
        order: 0,
      },
    ],
    amenities: [],
    rating: 4.9,
    reviewCount: 28,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'fallback-2',
    slug: 'high-level-executive-suite',
    title: 'High-Level Executive Suite',
    headline: 'Minimalist comfort designed for smart business travel and stays.',
    description: 'Executive living with Starlink connectivity, smart lighting, and city convenience.',
    address: '22 Kashim Ibrahim Road, High-Level',
    city: 'Makurdi',
    state: 'Benue',
    basePricePerNight: 35000,
    cleaningFee: 4000,
    serviceFeeRate: 0.05,
    bedrooms: 1,
    bathrooms: 1,
    maxGuests: 2,
    sqft: 650,
    isFeatured: true,
    isPublished: true,
    checkInTime: '13:00',
    checkOutTime: '11:00',
    houseRules: ['Quiet residential environment', 'Valid ID required'],
    images: [
      {
        id: 'fallback-2-image',
        apartmentId: 'fallback-2',
        url: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1400&q=80',
        caption: 'Executive suite bedroom and lounge',
        isPrimary: true,
        order: 0,
      },
    ],
    amenities: [],
    rating: 4.8,
    reviewCount: 19,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'fallback-3',
    slug: 'judges-quarters-garden-villa',
    title: 'Judges Quarters Garden Villa',
    headline: 'A secluded coastal-inspired villa wrapped in tropical greenery.',
    description: 'Private garden villa with shaded patio, quiet surroundings, and refined interior finishes.',
    address: '8 Judges Quarters Road, Makurdi',
    city: 'Makurdi',
    state: 'Benue',
    basePricePerNight: 56000,
    cleaningFee: 5500,
    serviceFeeRate: 0.05,
    bedrooms: 2,
    bathrooms: 2,
    maxGuests: 4,
    sqft: 1500,
    isFeatured: true,
    isPublished: true,
    checkInTime: '14:00',
    checkOutTime: '11:00',
    houseRules: ['No parties after 9 PM', 'Private outdoor patio use only'],
    images: [
      {
        id: 'fallback-3-image',
        apartmentId: 'fallback-3',
        url: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1400&q=80',
        caption: 'Garden villa entrance with private patio',
        isPrimary: true,
        order: 0,
      },
    ],
    amenities: [],
    rating: 4.7,
    reviewCount: 15,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
] as Apartment[];

export const FeaturedListings: React.FC = () => {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await api.get('/apartments/featured');
        const fetchedApartments = res.data?.data?.apartments;

        if (Array.isArray(fetchedApartments) && fetchedApartments.length > 0) {
          setApartments(fetchedApartments);
          return;
        }

        setApartments(FALLBACK_FEATURED_APARTMENTS);
      } catch (err) {
        console.error('Error loading featured apartments:', err);
        setApartments(FALLBACK_FEATURED_APARTMENTS);
      } finally {
        setIsLoading(false);
      }
    };
    fetchFeatured();
  }, []);

  return (
    <section className="py-24 bg-sand-100 border-b border-linen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-16 gap-6">
          <div className="max-w-2xl">
            <span className="text-xs font-bold uppercase tracking-[0.22em] text-terracotta-500">
              Signature Residences
            </span>
            <h2 className="mt-3 font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-forest-900 leading-tight">
              Curated Short-Lets Designed for Architectural Serenity.
            </h2>
            <p className="mt-3 text-base text-charcoal-700 leading-relaxed font-light">
              Every Yahsab property is personally inspected, equipped with high-efficiency climate control, high-speed Starlink broadband, and round-the-clock power security.
            </p>
          </div>

          <Link href="/apartments" className="shrink-0">
            <Button
              variant="outline"
              size="md"
              rightIcon={<ArrowRight className="w-4 h-4 text-terracotta-500" />}
            >
              Browse All Units
            </Button>
          </Link>
        </div>

        {/* Listings Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map((n) => (
              <div
                key={n}
                className="overflow-hidden rounded-2xl border border-linen bg-white p-4 space-y-4"
              >
                <Skeleton className="h-64 w-full rounded-xl" />
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="flex justify-between pt-4 border-t border-linen">
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-8 w-24 rounded-lg" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {apartments.slice(0, 6).map((apt) => {
              const primaryImage =
                apt.images?.find((img) => img.isPrimary)?.url ||
                apt.images?.[0]?.url ||
                'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80';

              return (
                <div
                  key={apt.id}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-linen bg-white transition-all duration-300 hover:shadow-elevated hover:border-linen-dark"
                >
                  {/* Photo Container */}
                  <div className="relative h-64 w-full overflow-hidden bg-sand-200">
                    <Image
                      src={primaryImage}
                      alt={apt.title}
                      fill
                      className="object-cover object-center transition-transform duration-500 ease-out group-hover:scale-105"
                    />
                    <div className="absolute top-4 left-4 flex gap-2">
                      <Badge variant="default" size="sm" className="bg-white/90 font-semibold backdrop-blur-xs">
                        <MapPin className="w-3 h-3 text-terracotta-500 mr-1" />
                        {apt.city}
                      </Badge>
                      {apt.isFeatured && (
                        <Badge variant="accent" size="sm">
                          Featured
                        </Badge>
                      )}
                    </div>

                    <div className="absolute bottom-4 right-4">
                      <span className="rounded-lg bg-forest-950/80 px-2.5 py-1 text-xs font-semibold text-sand-50 backdrop-blur-xs flex items-center gap-1">
                        <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                        {apt.rating ? apt.rating.toFixed(1) : '5.0'}
                      </span>
                    </div>
                  </div>

                  {/* Body Content */}
                  <div className="p-6 flex-1 flex flex-col justify-between">
                    <div>
                      <h3 className="font-serif text-xl font-semibold text-forest-900 group-hover:text-terracotta-600 transition-colors">
                        {apt.title}
                      </h3>
                      <p className="mt-1.5 text-xs text-charcoal-700 line-clamp-2 leading-relaxed">
                        {apt.headline}
                      </p>

                      {/* Specs */}
                      <div className="mt-4 flex items-center gap-4 text-xs text-charcoal-700 border-y border-linen/80 py-3">
                        <span className="flex items-center gap-1.5">
                          <Bed className="w-4 h-4 text-forest-800" />
                          {apt.bedrooms} {apt.bedrooms === 1 ? 'Bed' : 'Beds'}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Bath className="w-4 h-4 text-forest-800" />
                          {apt.bathrooms} {apt.bathrooms === 1 ? 'Bath' : 'Baths'}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Users className="w-4 h-4 text-forest-800" />
                          Up to {apt.maxGuests} Guests
                        </span>
                      </div>
                    </div>

                    {/* Price & Action */}
                    <div className="mt-6 flex items-center justify-between">
                      <div>
                        <span className="text-xs text-charcoal-700">Nightly from</span>
                        <div className="font-serif text-xl font-bold text-forest-900">
                          {formatNaira(apt.basePricePerNight)}
                          <span className="text-xs font-sans font-normal text-charcoal-700 ml-1">
                            / night
                          </span>
                        </div>
                      </div>

                      <Link href={`/apartments/${apt.slug}`}>
                        <Button variant="primary" size="sm">
                          View Details
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
