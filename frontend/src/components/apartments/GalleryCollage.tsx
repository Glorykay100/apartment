'use client';

import React, { useState } from 'react';
import Image from 'next/image';
import { ApartmentImage } from '@/types';
import { Modal } from '@/components/ui/Modal';
import { Grid, ChevronLeft, ChevronRight } from 'lucide-react';

interface GalleryCollageProps {
  images: ApartmentImage[];
  title: string;
}

export const GalleryCollage: React.FC<GalleryCollageProps> = ({ images, title }) => {
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [activePhotoIndex, setActivePhotoIndex] = useState(0);

  if (!images || images.length === 0) return null;

  const primaryImage = images[0];
  const sideImages = images.slice(1, 4);

  const openLightbox = (index: number) => {
    setActivePhotoIndex(index);
    setLightboxOpen(true);
  };

  const nextPhoto = () => {
    setActivePhotoIndex((prev) => (prev + 1) % images.length);
  };

  const prevPhoto = () => {
    setActivePhotoIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="relative">
      <div className="grid grid-cols-1 md:grid-cols-12 gap-3 h-[420px] sm:h-[480px] lg:h-[540px] rounded-3xl overflow-hidden border border-linen">
        {/* Main Photo */}
        <div
          onClick={() => openLightbox(0)}
          className={`relative overflow-hidden cursor-pointer bg-sand-200 group ${
            sideImages.length > 0 ? 'md:col-span-8' : 'md:col-span-12'
          }`}
        >
          <Image
            src={primaryImage.url}
            alt={primaryImage.caption || title}
            fill
            priority
            className="object-cover transition-transform duration-500 ease-out group-hover:scale-102"
          />
          {primaryImage.caption && (
            <div className="absolute bottom-4 left-4 rounded-lg bg-forest-950/70 px-3 py-1.5 text-xs text-sand-50 backdrop-blur-xs">
              {primaryImage.caption}
            </div>
          )}
        </div>

        {/* Side Stack */}
        {sideImages.length > 0 && (
          <div className="hidden md:grid md:col-span-4 grid-rows-2 gap-3">
            {sideImages.slice(0, 2).map((img, idx) => (
              <div
                key={img.id || idx}
                onClick={() => openLightbox(idx + 1)}
                className="relative overflow-hidden cursor-pointer bg-sand-200 group"
              >
                <Image
                  src={img.url}
                  alt={img.caption || title}
                  fill
                  className="object-cover transition-transform duration-500 ease-out group-hover:scale-105"
                />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Button to view all photos */}
      <button
        onClick={() => openLightbox(0)}
        className="absolute bottom-5 right-5 flex items-center gap-2 rounded-xl bg-forest-900/90 hover:bg-forest-900 text-sand-50 px-4 py-2 text-xs font-semibold backdrop-blur-md shadow-modal transition-transform duration-200 hover:scale-105"
      >
        <Grid className="w-4 h-4 text-terracotta-400" />
        <span>View all {images.length} photos</span>
      </button>

      {/* Fullscreen Lightbox Modal */}
      {lightboxOpen && (
        <Modal
          isOpen={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          title={`${title} (${activePhotoIndex + 1} of ${images.length})`}
          description={images[activePhotoIndex]?.caption || ''}
          maxWidth="2xl"
        >
          <div className="relative h-[480px] w-full overflow-hidden rounded-xl bg-forest-950">
            <Image
              src={images[activePhotoIndex]?.url}
              alt={images[activePhotoIndex]?.caption || title}
              fill
              className="object-contain"
            />

            {/* Lightbox Prev / Next */}
            {images.length > 1 && (
              <>
                <button
                  onClick={prevPhoto}
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-forest-900/80 p-2 text-sand-50 hover:bg-forest-900 transition-colors"
                  aria-label="Previous photo"
                >
                  <ChevronLeft className="w-5 h-5" />
                </button>
                <button
                  onClick={nextPhoto}
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-forest-900/80 p-2 text-sand-50 hover:bg-forest-900 transition-colors"
                  aria-label="Next photo"
                >
                  <ChevronRight className="w-5 h-5" />
                </button>
              </>
            )}
          </div>

          {/* Thumbnail row below */}
          <div className="mt-4 flex items-center gap-2 overflow-x-auto pb-2">
            {images.map((img, idx) => (
              <button
                key={img.id || idx}
                onClick={() => setActivePhotoIndex(idx)}
                className={`relative h-16 w-20 shrink-0 overflow-hidden rounded-lg border-2 transition-all ${
                  idx === activePhotoIndex
                    ? 'border-terracotta-500 scale-105'
                    : 'border-transparent opacity-60 hover:opacity-100'
                }`}
              >
                <Image src={img.url} alt="" fill className="object-cover" />
              </button>
            ))}
          </div>
        </Modal>
      )}
    </div>
  );
};
