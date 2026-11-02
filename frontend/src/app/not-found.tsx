import React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Home, ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <main className="flex min-h-[70vh] flex-col items-center justify-center p-6 text-center bg-sand-100">
      <div className="max-w-md rounded-3xl border border-linen bg-white p-10 sm:p-12 shadow-subtle space-y-5">
        <span className="text-xs font-bold uppercase tracking-[0.22em] text-terracotta-500">
          Page Not Located
        </span>
        <div className="font-serif text-6xl font-bold text-forest-900">
          404
        </div>
        <h1 className="font-serif text-2xl font-semibold text-forest-900">
          Residence or Page Unavailable
        </h1>
        <p className="text-sm text-charcoal-700 leading-relaxed font-light">
          The page you are trying to visit may have been moved, renamed, or is temporarily out of service.
        </p>

        <div className="pt-4 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link href="/" className="w-full sm:w-auto">
            <Button
              variant="primary"
              size="md"
              className="w-full sm:w-auto"
              leftIcon={<Home className="w-4 h-4" />}
            >
              Return Home
            </Button>
          </Link>
          <Link href="/apartments" className="w-full sm:w-auto">
            <Button
              variant="outline"
              size="md"
              className="w-full sm:w-auto"
              leftIcon={<ArrowLeft className="w-4 h-4" />}
            >
              Browse Apartments
            </Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
