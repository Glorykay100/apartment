'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import { Apartment } from '@/types';
import { api } from '@/lib/api';
import { ApartmentCard } from '@/components/apartments/ApartmentCard';
import { ApartmentFilters } from '@/components/apartments/ApartmentFilters';
import { Skeleton } from '@/components/ui/Skeleton';
import { Button } from '@/components/ui/Button';
import { Building2, RotateCcw } from 'lucide-react';

const FALLBACK_APARTMENTS: Apartment[] = [
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
    headline: 'A secluded garden villa wrapped in tropical greenery.',
    description: 'Private garden villa with a shaded patio and quiet surroundings.',
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
  {
    id: 'fallback-4',
    slug: 'wuse-ii-diplomatic-residence',
    title: 'Wuse II Diplomatic Residence',
    headline: 'A polished urban retreat in the heart of Abuja.',
    description: 'Prestige city apartment with designer interiors and quiet luxury.',
    address: '24 Adetokunbo Ademola Crescent, Wuse II',
    city: 'Abuja',
    state: 'FCT',
    basePricePerNight: 76000,
    cleaningFee: 7000,
    serviceFeeRate: 0.05,
    bedrooms: 2,
    bathrooms: 2,
    maxGuests: 4,
    sqft: 1800,
    isFeatured: true,
    isPublished: true,
    checkInTime: '15:00',
    checkOutTime: '11:00',
    houseRules: ['No smoking indoors', 'Check-in with valid ID'],
    images: [
      {
        id: 'fallback-4-image',
        apartmentId: 'fallback-4',
        url: 'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=1400&q=80',
        caption: 'Urban residence with luxe finishes',
        isPrimary: true,
        order: 0,
      },
    ],
    amenities: [],
    rating: 4.9,
    reviewCount: 30,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
] as Apartment[];

function ApartmentsCatalog() {
  const searchParams = useSearchParams();

  const [apartments, setApartments] = useState<Apartment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [totalCount, setTotalCount] = useState(0);

  const [filters, setFilters] = useState({
    search: '',
    city: searchParams.get('city') || 'all',
    bedrooms: searchParams.get('bedrooms') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    sort: 'newest',
  });

  const fetchApartments = async () => {
    setIsLoading(true);
    try {
      const query = new URLSearchParams();
      if (filters.city && filters.city !== 'all') query.set('city', filters.city);
      if (filters.bedrooms) query.set('bedrooms', filters.bedrooms);
      if (filters.maxPrice) query.set('maxPrice', filters.maxPrice);
      if (filters.sort) query.set('sort', filters.sort);
      query.set('limit', '20');

      const res = await api.get(`/apartments?${query.toString()}`);
      const responseApartments = res.data?.data?.apartments;

      if (Array.isArray(responseApartments) && responseApartments.length > 0) {
        let list: Apartment[] = responseApartments;

        // In-memory keyword search filtering for instant responsiveness
        if (filters.search) {
          const q = filters.search.toLowerCase();
          list = list.filter(
            (apt) =>
              apt.title.toLowerCase().includes(q) ||
              apt.headline.toLowerCase().includes(q) ||
              apt.address.toLowerCase().includes(q) ||
              apt.city.toLowerCase().includes(q)
          );
        }

        setApartments(list);
        setTotalCount(list.length);
        return;
      }

      setApartments(FALLBACK_APARTMENTS);
      setTotalCount(FALLBACK_APARTMENTS.length);
    } catch (err) {
      console.error('Error fetching apartments:', err);
      setApartments(FALLBACK_APARTMENTS);
      setTotalCount(FALLBACK_APARTMENTS.length);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchApartments();
  }, [filters.city, filters.bedrooms, filters.maxPrice, filters.sort, filters.search]);

  const handleReset = () => {
    setFilters({
      search: '',
      city: 'all',
      bedrooms: '',
      maxPrice: '',
      sort: 'newest',
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      {/* Page Header */}
      <div className="max-w-2xl mb-10">
        <span className="text-xs font-bold uppercase tracking-[0.22em] text-terracotta-500">
          Residences & Short-Lets
        </span>
        <h1 className="mt-2 font-serif text-3xl sm:text-4xl lg:text-5xl font-semibold tracking-tight text-forest-900">
          Explore All Yahsab Residences
        </h1>
        <p className="mt-3 text-sm sm:text-base text-charcoal-700 leading-relaxed font-light">
          Serviced apartments in Makurdi and Abuja featuring guaranteed 24/7 solar electricity, treated water systems, and Starlink gigabit speed.
        </p>
      </div>

      {/* Filter Bar */}
      <ApartmentFilters
        filters={filters}
        onChange={setFilters}
        onReset={handleReset}
        totalResults={totalCount}
      />

      {/* Grid or Skeleton */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map((n) => (
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
      ) : apartments.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {apartments.map((apartment) => (
            <ApartmentCard key={apartment.id} apartment={apartment} />
          ))}
        </div>
      ) : (
        <div className="rounded-3xl border border-linen bg-white p-12 text-center max-w-lg mx-auto space-y-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sand-200 text-charcoal-700 mx-auto">
            <Building2 className="w-6 h-6" />
          </div>
          <h3 className="font-serif text-2xl font-semibold text-forest-900">
            No matching residences found
          </h3>
          <p className="text-xs text-charcoal-700 leading-relaxed">
            We couldn’t find any apartments matching your specific filter criteria. Try adjusting your price budget or clearing the filters.
          </p>
          <Button variant="outline" size="md" onClick={handleReset} leftIcon={<RotateCcw className="w-4 h-4" />}>
            Reset Filters
          </Button>
        </div>
      )}
    </div>
  );
}

export default function ApartmentsPage() {
  return (
    <main className="min-h-screen bg-sand-100 py-12 sm:py-16">
      <Suspense
        fallback={
          <div className="mx-auto max-w-7xl px-4 py-12">
            <Skeleton className="h-10 w-48 mb-8" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((n) => (
                <Skeleton key={n} className="h-80 w-full rounded-2xl" />
              ))}
            </div>
          </div>
        }
      >
        <ApartmentsCatalog />
      </Suspense>
    </main>
  );
}
