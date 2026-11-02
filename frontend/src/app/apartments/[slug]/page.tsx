'use client';

import React, { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Apartment } from '@/types';
import { api } from '@/lib/api';
import { formatNaira } from '@/lib/utils';
import { GalleryCollage } from '@/components/apartments/GalleryCollage';
import { BookingSidebar } from '@/components/apartments/BookingSidebar';
import { ApartmentCard } from '@/components/apartments/ApartmentCard';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';
import {
  Bed,
  Bath,
  Users,
  Maximize2,
  Star,
  MapPin,
  Clock,
  ShieldCheck,
  Check,
  ArrowLeft,
  Zap,
  Wifi,
  Sparkles,
  Droplets,
  Share2,
} from 'lucide-react';

export default function ApartmentDetailPage() {
  const params = useParams();
  const router = useRouter();
  const slug = params?.slug as string;

  const [apartment, setApartment] = useState<Apartment | null>(null);
  const [similar, setSimilar] = useState<Apartment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const fetchApartment = async () => {
      setIsLoading(true);
      try {
        const res = await api.get(`/apartments/${slug}`);
        if (res.data?.success && res.data?.data) {
          setApartment(res.data.data.apartment);
          setSimilar(res.data.data.similar || []);
        }
      } catch (err: any) {
        setError(err.message || 'Failed to load apartment details');
      } finally {
        setIsLoading(false);
      }
    };
    if (slug) fetchApartment();
  }, [slug]);

  const handleShare = () => {
    if (typeof window !== 'undefined') {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  if (isLoading) {
    return (
      <main className="min-h-screen bg-sand-100 py-12">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-[480px] w-full rounded-3xl" />
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-8 space-y-6">
              <Skeleton className="h-10 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-40 w-full" />
            </div>
            <div className="lg:col-span-4">
              <Skeleton className="h-96 w-full rounded-3xl" />
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (error || !apartment) {
    return (
      <main className="min-h-screen bg-sand-100 py-24 text-center">
        <div className="mx-auto max-w-md rounded-3xl border border-linen bg-white p-10 shadow-subtle space-y-4">
          <h2 className="font-serif text-2xl font-semibold text-forest-900">
            Residence Not Found
          </h2>
          <p className="text-xs text-charcoal-700">
            {error || 'The requested apartment could not be located.'}
          </p>
          <Link href="/apartments">
            <Button variant="primary" size="md">
              Browse All Apartments
            </Button>
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-sand-100 py-8 sm:py-12">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 space-y-8">
        {/* Top Breadcrumb & Share */}
        <div className="flex items-center justify-between">
          <Link
            href="/apartments"
            className="inline-flex items-center gap-2 text-xs font-semibold text-charcoal-700 hover:text-forest-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-terracotta-500" />
            Back to Residences
          </Link>

          <button
            onClick={handleShare}
            className="flex items-center gap-1.5 rounded-xl border border-linen bg-white px-3.5 py-1.5 text-xs font-semibold text-charcoal-700 hover:bg-sand-200 transition-colors shadow-2xs"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copied ? 'Link Copied!' : 'Share Residence'}</span>
          </button>
        </div>

        {/* Gallery Collage */}
        <GalleryCollage images={apartment.images} title={apartment.title} />

        {/* Header Details */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start pt-4">
          {/* Main Info Column */}
          <div className="lg:col-span-8 space-y-10">
            <div>
              <div className="flex flex-wrap items-center gap-2 mb-2">
                <Badge variant="default" size="sm">
                  <MapPin className="w-3 h-3 text-terracotta-500 mr-1" />
                  {apartment.city}, {apartment.state}
                </Badge>
                {apartment.isFeatured && (
                  <Badge variant="accent" size="sm">
                    Signature Unit
                  </Badge>
                )}
                <span className="flex items-center gap-1 text-xs font-semibold text-forest-900 ml-auto">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  {apartment.rating ? apartment.rating.toFixed(1) : '5.0'}
                  <span className="text-charcoal-700 font-normal">
                    ({apartment.reviewCount || 1} verified stay)
                  </span>
                </span>
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-forest-900 leading-[1.15]">
                {apartment.title}
              </h1>

              <p className="mt-2 text-sm text-charcoal-700 font-medium">
                {apartment.address}
              </p>

              {/* Specs Bar */}
              <div className="mt-6 flex flex-wrap items-center gap-6 rounded-2xl border border-linen bg-white p-4 text-xs text-charcoal-700 shadow-2xs">
                <span className="flex items-center gap-2">
                  <Bed className="w-4 h-4 text-forest-900" />
                  <strong className="text-forest-900">{apartment.bedrooms}</strong>{' '}
                  {apartment.bedrooms === 1 ? 'Bedroom' : 'Bedrooms'}
                </span>
                <span className="flex items-center gap-2">
                  <Bath className="w-4 h-4 text-forest-900" />
                  <strong className="text-forest-900">{apartment.bathrooms}</strong>{' '}
                  {apartment.bathrooms === 1 ? 'Bath' : 'Baths'}
                </span>
                <span className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-forest-900" />
                  Up to <strong className="text-forest-900">{apartment.maxGuests}</strong>{' '}
                  Guests
                </span>
                {apartment.sqft && (
                  <span className="flex items-center gap-2">
                    <Maximize2 className="w-4 h-4 text-forest-900" />
                    <strong className="text-forest-900">{apartment.sqft}</strong> sq ft
                  </span>
                )}
              </div>
            </div>

            {/* Description */}
            <div className="space-y-4 border-t border-linen pt-8">
              <span className="text-xs font-bold uppercase tracking-[0.22em] text-terracotta-500">
                The Space & Architecture
              </span>
              <p className="font-serif text-xl font-medium text-forest-900 leading-snug">
                {apartment.headline}
              </p>
              <div className="text-sm text-charcoal-700 leading-relaxed font-light space-y-4">
                <p>{apartment.description}</p>
              </div>
            </div>

            {/* Amenities Grid */}
            <div className="border-t border-linen pt-8 space-y-6">
              <span className="text-xs font-bold uppercase tracking-[0.22em] text-terracotta-500">
                Included Amenities
              </span>
              <h3 className="font-serif text-2xl font-semibold text-forest-900">
                Crafted for Complete Self-Reliance
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {apartment.amenities?.map((amenity) => (
                  <div
                    key={amenity.id}
                    className="flex items-center gap-3 rounded-xl border border-linen bg-white p-3.5 shadow-2xs"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-sand-200 text-forest-900">
                      <Sparkles className="w-4 h-4 text-terracotta-500" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-forest-900 block">
                        {amenity.name}
                      </span>
                      <span className="text-[10px] text-charcoal-700 uppercase tracking-wider">
                        {amenity.category}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* House Rules & Schedule */}
            <div className="border-t border-linen pt-8 space-y-6">
              <span className="text-xs font-bold uppercase tracking-[0.22em] text-terracotta-500">
                Resident Protocols
              </span>
              <h3 className="font-serif text-2xl font-semibold text-forest-900">
                House Rules & Check-In Schedule
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-linen bg-white p-5 shadow-2xs">
                  <div className="flex items-center gap-2 text-forest-900 font-semibold text-xs mb-2">
                    <Clock className="w-4 h-4 text-terracotta-500" />
                    Check-in: {apartment.checkInTime} WAT
                  </div>
                  <p className="text-xs text-charcoal-700 leading-relaxed">
                    Digital keypad code delivered via email and WhatsApp 2 hours prior to arrival. Early bag drop allowed upon request.
                  </p>
                </div>

                <div className="rounded-2xl border border-linen bg-white p-5 shadow-2xs">
                  <div className="flex items-center gap-2 text-forest-900 font-semibold text-xs mb-2">
                    <Clock className="w-4 h-4 text-terracotta-500" />
                    Check-out: {apartment.checkOutTime} WAT
                  </div>
                  <p className="text-xs text-charcoal-700 leading-relaxed">
                    Late check-out subject to same-day maid schedule. Please contact concierge for confirmation.
                  </p>
                </div>
              </div>

              <div className="rounded-2xl border border-linen bg-sand-50/70 p-5 space-y-2.5">
                <p className="text-xs font-bold uppercase tracking-wider text-charcoal-700 mb-2">
                  Key Rules to Note:
                </p>
                {apartment.houseRules?.map((rule, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-charcoal-800">
                    <Check className="w-3.5 h-3.5 text-forest-900 shrink-0 mt-0.5" />
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Verified Reviews Section */}
            <div className="border-t border-linen pt-8 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-xs font-bold uppercase tracking-[0.22em] text-terracotta-500">
                    Social Proof
                  </span>
                  <h3 className="font-serif text-2xl font-semibold text-forest-900 mt-1">
                    Verified Guest Experiences
                  </h3>
                </div>

                <div className="flex items-center gap-1.5 rounded-xl border border-linen bg-white px-3 py-1.5 text-sm font-bold text-forest-900">
                  <Star className="w-4 h-4 text-amber-400 fill-amber-400" />
                  {apartment.rating ? apartment.rating.toFixed(1) : '5.0'} / 5.0
                </div>
              </div>

              {apartment.reviews && apartment.reviews.length > 0 ? (
                <div className="space-y-4">
                  {apartment.reviews.map((rev) => (
                    <div
                      key={rev.id}
                      className="rounded-2xl border border-linen bg-white p-6 shadow-2xs space-y-3"
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sand-200 text-forest-900 font-bold text-xs">
                            {rev.user?.fullName?.charAt(0) || 'G'}
                          </div>
                          <div>
                            <h4 className="text-xs font-bold text-forest-900">
                              {rev.user?.fullName || 'Verified Guest'}
                            </h4>
                            <p className="text-[11px] text-charcoal-700">
                              Verified stay • {new Date(rev.createdAt).toLocaleDateString('en-GB', { month: 'short', year: 'numeric' })}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: rev.rating }).map((_, i) => (
                            <Star key={i} className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                          ))}
                        </div>
                      </div>

                      <p className="text-xs text-charcoal-700 leading-relaxed font-light">
                        &ldquo;{rev.comment}&rdquo;
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="rounded-2xl border border-linen bg-sand-50 p-6 text-center text-xs text-charcoal-700">
                  Be the first guest to leave a verified review after completing your stay at this residence.
                </div>
              )}
            </div>
          </div>

          {/* Sticky Booking Sidebar Column */}
          <div className="lg:col-span-4">
            <BookingSidebar apartment={apartment} />
          </div>
        </div>

        {/* Similar Residences Carousel / Grid */}
        {similar.length > 0 && (
          <div className="border-t border-linen pt-16 mt-16 space-y-6">
            <div className="flex items-end justify-between">
              <div>
                <span className="text-xs font-bold uppercase tracking-[0.22em] text-terracotta-500">
                  More Options
                </span>
                <h3 className="font-serif text-2xl sm:text-3xl font-semibold text-forest-900 mt-1">
                  Similar Residences in {apartment.city}
                </h3>
              </div>
              <Link href="/apartments">
                <Button variant="outline" size="sm">
                  View All
                </Button>
              </Link>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {similar.map((simApt) => (
                <Link
                  key={simApt.id}
                  href={`/apartments/${simApt.slug}`}
                  className="group rounded-2xl border border-linen bg-white p-4 shadow-2xs hover:shadow-elevated transition-all"
                >
                  <div className="relative h-44 w-full rounded-xl overflow-hidden bg-sand-200">
                    <Image
                      src={simApt.images?.[0]?.url || 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=600&q=80'}
                      alt={simApt.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <h4 className="mt-3 font-serif text-base font-semibold text-forest-900 group-hover:text-terracotta-600 transition-colors">
                    {simApt.title}
                  </h4>
                  <div className="mt-1 flex items-center justify-between text-xs text-charcoal-700">
                    <span>{simApt.bedrooms} Bed • {simApt.city}</span>
                    <strong className="text-forest-900">{formatNaira(simApt.basePricePerNight)}/night</strong>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Sticky Booking Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden border-t border-linen bg-white/95 px-5 py-3 backdrop-blur-md shadow-modal flex items-center justify-between">
        <div>
          <span className="text-[10px] text-charcoal-700 block">Total from</span>
          <div className="font-serif text-lg font-bold text-forest-900">
            {formatNaira(apartment.basePricePerNight)}
            <span className="text-xs font-sans font-normal text-charcoal-700 ml-1">
              / night
            </span>
          </div>
        </div>

        <Button
          variant="accent"
          size="md"
          onClick={() => {
            window.scrollTo({ top: 400, behavior: 'smooth' });
          }}
        >
          Reserve Dates
        </Button>
      </div>
    </main>
  );
}
