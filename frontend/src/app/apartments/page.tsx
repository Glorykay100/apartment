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
      if (res.data?.success && res.data?.data) {
        let list: Apartment[] = res.data.data.apartments;

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
      }
    } catch (err) {
      console.error('Error fetching apartments:', err);
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
