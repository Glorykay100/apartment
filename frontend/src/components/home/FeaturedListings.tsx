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

export const FeaturedListings: React.FC = () => {
  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchFeatured = async () => {
      try {
        const res = await api.get('/apartments/featured');
        if (res.data?.success && res.data?.data?.apartments) {
          setApartments(res.data.data.apartments);
        }
      } catch (err) {
        console.error('Error loading featured apartments:', err);
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
