'use client';

import React from 'react';
import { Button } from '@/components/ui/Button';
import { Search, RotateCcw, SlidersHorizontal } from 'lucide-react';

interface FiltersState {
  search: string;
  city: string;
  bedrooms: string;
  maxPrice: string;
  sort: string;
}

interface ApartmentFiltersProps {
  filters: FiltersState;
  onChange: (filters: FiltersState) => void;
  onReset: () => void;
  totalResults: number;
}

export const ApartmentFilters: React.FC<ApartmentFiltersProps> = ({
  filters,
  onChange,
  onReset,
  totalResults,
}) => {
  return (
    <div className="rounded-2xl border border-linen bg-white p-5 sm:p-6 shadow-subtle mb-10">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-4 pb-4 border-b border-linen">
        <div className="flex items-center gap-2">
          <SlidersHorizontal className="w-5 h-5 text-terracotta-500" />
          <h2 className="font-serif text-lg font-semibold text-forest-900">
            Filter Residences
          </h2>
          <span className="text-xs text-charcoal-700 bg-sand-200 px-2.5 py-0.5 rounded-full ml-2">
            {totalResults} {totalResults === 1 ? 'unit available' : 'units available'}
          </span>
        </div>

        <button
          onClick={onReset}
          className="flex items-center gap-1.5 text-xs font-semibold text-terracotta-600 hover:text-terracotta-700 transition-colors self-start lg:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Reset Filters
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
        {/* Keyword Search */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-charcoal-700 mb-1.5">
            Search Name/Area
          </label>
          <div className="relative">
            <input
              type="text"
              placeholder="e.g. Penthouse, GRA..."
              value={filters.search}
              onChange={(e) => onChange({ ...filters, search: e.target.value })}
              className="w-full rounded-xl border border-linen bg-sand-50/50 px-3.5 py-2 text-xs text-charcoal-900 placeholder:text-charcoal-700/50 focus:border-terracotta-500 focus:outline-none"
            />
          </div>
        </div>

        {/* City Filter */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-charcoal-700 mb-1.5">
            Destination
          </label>
          <select
            value={filters.city}
            onChange={(e) => onChange({ ...filters, city: e.target.value })}
            className="w-full rounded-xl border border-linen bg-sand-50/50 px-3 py-2 text-xs font-medium text-forest-900 focus:border-terracotta-500 focus:outline-none cursor-pointer"
          >
            <option value="all">All Cities</option>
            <option value="Makurdi">Makurdi (Benue)</option>
            <option value="Abuja">Abuja (FCT)</option>
          </select>
        </div>

        {/* Bedrooms Filter */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-charcoal-700 mb-1.5">
            Bedrooms
          </label>
          <select
            value={filters.bedrooms}
            onChange={(e) => onChange({ ...filters, bedrooms: e.target.value })}
            className="w-full rounded-xl border border-linen bg-sand-50/50 px-3 py-2 text-xs font-medium text-forest-900 focus:border-terracotta-500 focus:outline-none cursor-pointer"
          >
            <option value="">Any Bedrooms</option>
            <option value="1">1 Bedroom (Studio)</option>
            <option value="2">2 Bedrooms</option>
            <option value="3">3+ Bedrooms</option>
          </select>
        </div>

        {/* Max Price Filter */}
        <div>
          <label className="block text-[11px] font-bold uppercase tracking-wider text-charcoal-700 mb-1.5">
            Budget Ceiling
          </label>
          <select
            value={filters.maxPrice}
            onChange={(e) => onChange({ ...filters, maxPrice: e.target.value })}
            className="w-full rounded-xl border border-linen bg-sand-50/50 px-3 py-2 text-xs font-medium text-forest-900 focus:border-terracotta-500 focus:outline-none cursor-pointer"
          >
            <option value="">Any Nightly Rate</option>
            <option value="40000">Up to ₦40,000 / night</option>
            <option value="60000">Up to ₦60,000 / night</option>
            <option value="100000">Up to ₦100,000 / night</option>
          </select>
        </div>

        {/* Sort */}
        <div className="sm:col-span-2 md:col-span-4 lg:col-span-1">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-charcoal-700 mb-1.5">
            Sort Order
          </label>
          <select
            value={filters.sort}
            onChange={(e) => onChange({ ...filters, sort: e.target.value })}
            className="w-full rounded-xl border border-linen bg-sand-50/50 px-3 py-2 text-xs font-medium text-forest-900 focus:border-terracotta-500 focus:outline-none cursor-pointer"
          >
            <option value="newest">Featured & Newest</option>
            <option value="price_asc">Price: Low to High</option>
            <option value="price_desc">Price: High to Low</option>
          </select>
        </div>
      </div>
    </div>
  );
};
