import type { Metadata } from 'next';
import './globals.css';
import { AuthProvider } from '@/context/AuthContext';
import { Navbar } from '@/components/layout/Navbar';
import { Footer } from '@/components/layout/Footer';
import { CookieConsent } from '@/components/layout/CookieConsent';

export const metadata: Metadata = {
  title: 'Yahsab Luxury Apartments & Suites | Makurdi & Abuja, Nigeria',
  description:
    'Experience refined comfort and rooted Nigerian hospitality. Premium serviced short-let apartments in Makurdi and Abuja with guaranteed 24/7 dual solar power, Starlink internet, and personalized concierge.',
  icons: {
    icon: '/icon.svg',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-sand-100 text-charcoal-900 antialiased selection:bg-terracotta-500 selection:text-white flex flex-col justify-between">
        <AuthProvider>
          <Navbar />
          <div className="flex-1">{children}</div>
          <Footer />
          <CookieConsent />
        </AuthProvider>
      </body>
    </html>
  );
}
