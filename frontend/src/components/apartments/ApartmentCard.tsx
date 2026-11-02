'use client';

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Apartment } from '@/types';
import { formatNaira } from '@/lib/utils';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Bed, Bath, Users, Star, MapPin, Zap, Wifi } from 'lucide-react';

interface ApartmentCardProps {
  apartment: Apartment;
}

export const ApartmentCard: React.FC<ApartmentCardProps> = ({ apartment }) => {
  const primaryImage =
    apartment.images?.find((img) => img.isPrimary)?.url ||
    apartment.images?.[0]?.url ||
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=800&q=80';

  return (
    <div className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-linen bg-white transition-all duration-300 hover:shadow-elevated hover:border-linen-dark">
      {/* Thumbnail */}
      <Link href={`/apartments/${apartment.slug}`} className="block relative h-64 w-full overflow-hidden bg-sand-200">
        <Image
          src={primaryImage}
          alt={apartment.title}
          fill
          className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
        />
        <div className="absolute top-4 left-4 flex gap-2">
          <Badge variant="default" size="sm" className="bg-white/95 font-semibold backdrop-blur-xs">
            <MapPin className="w-3 h-3 text-terracotta-500 mr-1" />
            {apartment.city}
          </Badge>
          {apartment.isFeatured && (
            <Badge variant="accent" size="sm">
              Featured
            </Badge>
          )}
        </div>

        <div className="absolute bottom-4 right-4">
          <span className="rounded-lg bg-forest-950/85 px-2.5 py-1 text-xs font-semibold text-sand-50 backdrop-blur-xs flex items-center gap-1 shadow-sm">
            <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
            {apartment.rating ? apartment.rating.toFixed(1) : '5.0'}
          </span>
        </div>
      </Link>

      {/* Details */}
      <div className="p-6 flex-1 flex flex-col justify-between">
        <div>
          <div className="text-[11px] font-bold uppercase tracking-wider text-charcoal-700">
            {apartment.address}
          </div>

          <Link href={`/apartments/${apartment.slug}`}>
            <h3 className="mt-1 font-serif text-xl font-semibold text-forest-900 group-hover:text-terracotta-600 transition-colors">
              {apartment.title}
            </h3>
          </Link>

          <p className="mt-2 text-xs text-charcoal-700 line-clamp-2 leading-relaxed">
            {apartment.headline}
          </p>

          {/* Quick amenity tags */}
          <div className="mt-3 flex items-center gap-2 text-[11px] text-charcoal-700">
            <span className="flex items-center gap-1 bg-sand-200/70 px-2 py-0.5 rounded-md">
              <Zap className="w-3 h-3 text-forest-900" /> 24/7 Solar
            </span>
            <span className="flex items-center gap-1 bg-sand-200/70 px-2 py-0.5 rounded-md">
              <Wifi className="w-3 h-3 text-forest-900" /> Starlink
            </span>
          </div>

          {/* Specs */}
          <div className="mt-4 flex items-center gap-4 text-xs text-charcoal-700 border-t border-linen pt-3">
            <span className="flex items-center gap-1.5">
              <Bed className="w-4 h-4 text-forest-800" />
              {apartment.bedrooms} {apartment.bedrooms === 1 ? 'Bed' : 'Beds'}
            </span>
            <span className="flex items-center gap-1.5">
              <Bath className="w-4 h-4 text-forest-800" />
              {apartment.bathrooms} {apartment.bathrooms === 1 ? 'Bath' : 'Baths'}
            </span>
            <span className="flex items-center gap-1.5">
              <Users className="w-4 h-4 text-forest-800" />
              {apartment.maxGuests} Guests
            </span>
          </div>
        </div>

        {/* Pricing & CTA */}
        <div className="mt-6 flex items-center justify-between border-t border-linen/80 pt-4">
          <div>
            <span className="text-[11px] text-charcoal-700 block">Nightly rate</span>
            <div className="font-serif text-xl font-bold text-forest-900">
              {formatNaira(apartment.basePricePerNight)}
              <span className="text-xs font-sans font-normal text-charcoal-700 ml-1">
                / night
              </span>
            </div>
          </div>

          <Link href={`/apartments/${apartment.slug}`}>
            <Button variant="primary" size="sm">
              Reserve
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
