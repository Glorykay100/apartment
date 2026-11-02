import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Yahsab Luxury Apartments & Suites | Makurdi & Abuja',
  description:
    'Experience refined comfort and rooted Nigerian hospitality. Premium serviced short-let apartments with 24/7 solar power, Starlink internet, and personalized concierge.',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-sand-100 text-charcoal-900 antialiased selection:bg-terracotta-500 selection:text-white">
        {children}
      </body>
    </html>
  );
}
