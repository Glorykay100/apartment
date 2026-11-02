'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Modal } from '@/components/ui/Modal';
import { ArrowRight, Eye, MapPin } from 'lucide-react';
import { cn } from '@/lib/utils';

interface GalleryItem {
  id: number;
  category: 'Living' | 'Bedrooms' | 'Kitchen' | 'Exterior';
  title: string;
  location: string;
  image: string;
}

const gallery: GalleryItem[] = [
  {
    id: 1,
    category: 'Living',
    title: 'The Benue Terrace Penthouse Living Lounge',
    location: 'Old GRA, Makurdi',
    image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1600&q=85',
  },
  {
    id: 2,
    category: 'Bedrooms',
    title: 'Master En-Suite with Super-King Bed',
    location: 'Old GRA, Makurdi',
    image: 'https://images.unsplash.com/photo-1616594039964-ae9021a400a0?auto=format&fit=crop&w=1600&q=85',
  },
  {
    id: 3,
    category: 'Kitchen',
    title: 'Granite Chef Kitchen with Breakfast Bar',
    location: 'Old GRA, Makurdi',
    image: 'https://images.unsplash.com/photo-1600566753376-12c8ab7fb75b?auto=format&fit=crop&w=1600&q=85',
  },
  {
    id: 4,
    category: 'Exterior',
    title: 'Hillside Terrace & Infinity Pool View',
    location: 'Guzape, Abuja',
    image: 'https://images.unsplash.com/photo-1512917774080-9991f1c4c750?auto=format&fit=crop&w=1600&q=85',
  },
  {
    id: 5,
    category: 'Living',
    title: 'High-Level Executive Work & Lounge Space',
    location: 'High-Level, Makurdi',
    image: 'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=1600&q=85',
  },
  {
    id: 6,
    category: 'Bedrooms',
    title: 'Minimalist Garden Villa Guest Suite',
    location: 'Judges Quarters, Makurdi',
    image: 'https://images.unsplash.com/photo-1540518614846-7ede433c4ef0?auto=format&fit=crop&w=1600&q=85',
  },
  {
    id: 7,
    category: 'Exterior',
    title: 'Private Garden Pavilion & Shaded Porch',
    location: 'Judges Quarters, Makurdi',
    image: 'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1600&q=85',
  },
  {
    id: 8,
    category: 'Living',
    title: 'Wuse II Contemporary Diplomatic Lounge',
    location: 'Wuse II, Abuja',
    image: 'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1600&q=85',
  },
];

export default function TourPage() {
  const [activeTab, setActiveTab] = useState<string>('All');
  const [selectedImage, setSelectedImage] = useState<GalleryItem | null>(null);

  const categories = ['All', 'Living', 'Bedrooms', 'Kitchen', 'Exterior'];

  const filteredItems =
    activeTab === 'All'
      ? gallery
      : gallery.filter((item) => item.category === activeTab);

  return (
    <main className="min-h-screen bg-sand-100 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-2xl mb-12">
          <span className="text-xs font-bold uppercase tracking-[0.22em] text-terracotta-500">
            Visual Walkthrough
          </span>
          <h1 className="mt-3 font-serif text-4xl sm:text-5xl font-semibold tracking-tight text-forest-900">
            Take a Visual Tour of Yahsab.
          </h1>
          <p className="mt-4 text-base text-charcoal-700 leading-relaxed font-light">
            Explore the interior finishes, serene river terraces, master suites, and chef kitchens across our Makurdi and Abuja residences.
          </p>
        </div>

        {/* Filter Tabs */}
        <div className="flex flex-wrap items-center gap-2 mb-10 border-b border-linen pb-4">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setActiveTab(cat)}
              className={cn(
                'rounded-xl px-5 py-2 text-xs font-semibold tracking-wide transition-all duration-200',
                activeTab === cat
                  ? 'bg-forest-900 text-sand-50 shadow-sm'
                  : 'bg-white text-charcoal-700 hover:bg-sand-200 border border-linen'
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Gallery Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredItems.map((item) => (
            <div
              key={item.id}
              onClick={() => setSelectedImage(item)}
              className="group relative h-80 overflow-hidden rounded-2xl border border-linen bg-sand-200 shadow-sm cursor-pointer transition-all duration-300 hover:shadow-elevated"
            >
              <Image
                src={item.image}
                alt={item.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-forest-950/80 via-transparent to-transparent opacity-90 transition-opacity" />

              <div className="absolute top-4 right-4 rounded-full bg-forest-950/60 p-2 text-sand-50 backdrop-blur-xs opacity-0 group-hover:opacity-100 transition-opacity">
                <Eye className="w-4 h-4" />
              </div>

              <div className="absolute bottom-4 left-4 right-4 text-sand-50">
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold tracking-wider uppercase text-terracotta-300">
                  <MapPin className="w-3 h-3" />
                  {item.location}
                </span>
                <h3 className="font-serif text-lg font-medium text-white mt-1 leading-snug">
                  {item.title}
                </h3>
              </div>
            </div>
          ))}
        </div>

        {/* Bottom CTA */}
        <div className="mt-20 rounded-3xl border border-linen bg-white p-8 sm:p-12 text-center max-w-3xl mx-auto shadow-subtle">
          <h2 className="font-serif text-3xl font-semibold text-forest-900">
            Ready to Experience Yahsab in Person?
          </h2>
          <p className="mt-3 text-sm text-charcoal-700 max-w-xl mx-auto">
            Book directly through our platform for verified availability and seamless Paystack checkout.
          </p>
          <div className="mt-8 flex justify-center gap-4">
            <Link href="/apartments">
              <Button
                variant="primary"
                size="lg"
                rightIcon={<ArrowRight className="w-4 h-4 text-terracotta-400" />}
              >
                Browse All Apartments
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* Lightbox Modal */}
      {selectedImage && (
        <Modal
          isOpen={!!selectedImage}
          onClose={() => setSelectedImage(null)}
          title={selectedImage.title}
          description={selectedImage.location}
          maxWidth="2xl"
        >
          <div className="relative h-96 w-full overflow-hidden rounded-xl bg-sand-200">
            <Image
              src={selectedImage.image}
              alt={selectedImage.title}
              fill
              className="object-cover"
            />
          </div>
          <div className="mt-6 flex justify-end gap-3">
            <Link href="/apartments">
              <Button variant="accent" size="sm">
                Check Dates for this Property
              </Button>
            </Link>
          </div>
        </Modal>
      )}
    </main>
  );
}
