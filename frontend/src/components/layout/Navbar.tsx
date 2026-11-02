'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import {
  Menu,
  X,
  User as UserIcon,
  LogOut,
  LayoutDashboard,
  ShieldAlert,
  Building2,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export const Navbar: React.FC = () => {
  const pathname = usePathname();
  const { user, isAdmin, logout } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userDropdownOpen, setUserDropdownOpen] = useState(false);

  const navLinks = [
    { label: 'Home', href: '/' },
    { label: 'Apartments', href: '/apartments' },
    { label: 'Take a Tour', href: '/tour' },
    { label: 'Pricing & Add-ons', href: '/pricing' },
    { label: 'About', href: '/about' },
    { label: 'Contact', href: '/contact' },
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-linen bg-sand-100/95 backdrop-blur-md transition-all">
      <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-forest-900 text-sand-50 font-serif font-bold text-xl shadow-sm transition-transform duration-200 group-hover:scale-105">
            Y
          </div>
          <div className="flex flex-col">
            <span className="font-serif text-xl sm:text-2xl font-semibold tracking-tight text-forest-900 leading-none">
              Yahsab
            </span>
            <span className="text-[10px] uppercase tracking-[0.25em] text-terracotta-500 font-bold mt-1">
              Luxury Apartments
            </span>
          </div>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'text-sm font-medium transition-colors hover:text-terracotta-500 relative py-1',
                  isActive ? 'text-forest-900 font-semibold' : 'text-charcoal-700'
                )}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-0 h-0.5 w-full bg-terracotta-500 rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Desktop Actions */}
        <div className="hidden lg:flex items-center gap-4">
          {user ? (
            <div className="relative">
              <button
                onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                className="flex items-center gap-2.5 rounded-xl border border-linen bg-white px-3.5 py-2 text-sm text-forest-900 hover:bg-sand-200 transition-colors shadow-2xs"
              >
                <div className="flex h-7 w-7 items-center justify-center rounded-full bg-sand-300 text-forest-900 font-medium text-xs">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
                <span className="max-w-[120px] truncate font-medium">
                  {user.fullName.split(' ')[0]}
                </span>
              </button>

              {userDropdownOpen && (
                <div className="absolute right-0 mt-2 w-56 rounded-2xl border border-linen bg-white p-2 shadow-modal z-50">
                  <div className="px-3 py-2 border-b border-linen mb-1">
                    <p className="text-xs font-semibold text-charcoal-900 truncate">
                      {user.fullName}
                    </p>
                    <p className="text-[11px] text-charcoal-700 truncate">
                      {user.email}
                    </p>
                  </div>

                  <Link
                    href="/dashboard"
                    onClick={() => setUserDropdownOpen(false)}
                    className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-charcoal-800 hover:bg-sand-200 transition-colors"
                  >
                    <LayoutDashboard className="w-4 h-4 text-terracotta-500" />
                    My Bookings
                  </Link>

                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setUserDropdownOpen(false)}
                      className="flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-charcoal-800 hover:bg-sand-200 transition-colors"
                    >
                      <ShieldAlert className="w-4 h-4 text-amber-600" />
                      Admin Portal
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      setUserDropdownOpen(false);
                      logout();
                    }}
                    className="flex w-full items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium text-red-600 hover:bg-red-50 transition-colors mt-1"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          ) : (
            <Link
              href="/auth/login"
              className="text-sm font-medium text-charcoal-800 hover:text-forest-900 transition-colors px-2 py-1"
            >
              Sign In
            </Link>
          )}

          <Link href="/apartments">
            <Button variant="primary" size="md">
              Book Your Stay
            </Button>
          </Link>
        </div>

        {/* Mobile Hamburger Toggle */}
        <div className="flex items-center gap-3 lg:hidden">
          <Link href="/apartments">
            <Button variant="primary" size="sm">
              Book
            </Button>
          </Link>
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="rounded-xl border border-linen bg-white p-2 text-forest-900 hover:bg-sand-200 transition-colors"
            aria-label="Toggle navigation menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-linen bg-white px-6 py-6 shadow-elevated">
          <nav className="flex flex-col space-y-4">
            {navLinks.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    'text-base font-medium py-1',
                    isActive ? 'text-terracotta-500 font-semibold' : 'text-charcoal-800'
                  )}
                >
                  {link.label}
                </Link>
              );
            })}

            <div className="pt-4 border-t border-linen flex flex-col gap-3">
              {user ? (
                <>
                  <div className="flex items-center gap-3 py-2">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-sand-300 text-forest-900 font-semibold text-sm">
                      {user.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-forest-900">
                        {user.fullName}
                      </p>
                      <p className="text-xs text-charcoal-700">{user.email}</p>
                    </div>
                  </div>

                  <Link
                    href="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="flex items-center gap-2 text-sm font-medium text-forest-900 py-1.5"
                  >
                    <LayoutDashboard className="w-4 h-4 text-terracotta-500" />
                    My Bookings
                  </Link>

                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setMobileMenuOpen(false)}
                      className="flex items-center gap-2 text-sm font-medium text-amber-700 py-1.5"
                    >
                      <ShieldAlert className="w-4 h-4" />
                      Admin Portal
                    </Link>
                  )}

                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logout();
                    }}
                    className="flex items-center gap-2 text-sm font-medium text-red-600 py-1.5 text-left"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                  </button>
                </>
              ) : (
                <div className="flex flex-col gap-2">
                  <Link
                    href="/auth/login"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button variant="outline" size="md" className="w-full">
                      Sign In
                    </Button>
                  </Link>
                  <Link
                    href="/auth/register"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Button variant="primary" size="md" className="w-full">
                      Create Guest Account
                    </Button>
                  </Link>
                </div>
              )}
            </div>
          </nav>
        </div>
      )}
    </header>
  );
};
