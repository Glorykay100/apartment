'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { api } from '@/lib/api';
import {
  MapPin,
  Phone,
  Mail,
  Clock,
  MessageSquare,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    subject: '',
    message: '',
  });

  const [isLoading, setIsLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      await api.post('/contact', formData);
      setSuccess(true);
      setFormData({
        name: '',
        email: '',
        phone: '',
        subject: '',
        message: '',
      });
    } catch (err: any) {
      setError(err.message || 'Failed to send message. Please try again or reach out on WhatsApp.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-sand-100 py-16 sm:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="max-w-2xl mb-16">
          <span className="text-xs font-bold uppercase tracking-[0.22em] text-terracotta-500">
            Concierge & Inquiries
          </span>
          <h1 className="mt-3 font-serif text-4xl sm:text-5xl font-semibold tracking-tight text-forest-900">
            We Are Here to Assist Your Stay.
          </h1>
          <p className="mt-4 text-base text-charcoal-700 leading-relaxed font-light">
            Have questions about an upcoming reservation, special dates, corporate group lodging, or private chef services? Reach out directly to our reservations team.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
          {/* Contact Details Card */}
          <div className="lg:col-span-5 rounded-3xl border border-linen bg-white p-8 sm:p-10 shadow-subtle space-y-8">
            <div>
              <h3 className="font-serif text-2xl font-semibold text-forest-900">
                Direct Host Channels
              </h3>
              <p className="mt-2 text-xs text-charcoal-700 leading-relaxed">
                Our hospitality managers respond within minutes during working hours (WAT, UTC+1).
              </p>
            </div>

            <div className="space-y-6 text-sm text-charcoal-800">
              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sand-200 text-terracotta-500">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-forest-900">Makurdi Office & Residences</h4>
                  <p className="text-xs text-charcoal-700 mt-1 leading-relaxed">
                    Plot 14, River Benue Crescent, Old GRA, Makurdi, Benue State
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sand-200 text-terracotta-500">
                  <MapPin className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-forest-900">Abuja Office</h4>
                  <p className="text-xs text-charcoal-700 mt-1 leading-relaxed">
                    Plot 418, Diplomatic Hillway, Guzape, Abuja, FCT
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sand-200 text-terracotta-500">
                  <Phone className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-forest-900">Telephone & WhatsApp</h4>
                  <p className="text-xs text-charcoal-700 mt-1">
                    +234 (0) 803 123 4567 • Available 24/7 for in-house guests
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sand-200 text-terracotta-500">
                  <Mail className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-forest-900">Email Inquiries</h4>
                  <p className="text-xs text-charcoal-700 mt-1">
                    reservations@yahsab.com
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-4">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sand-200 text-terracotta-500">
                  <Clock className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="font-semibold text-forest-900">Concierge Desk Hours</h4>
                  <p className="text-xs text-charcoal-700 mt-1">
                    Daily: 07:00 – 22:00 WAT (Night emergency manager on call)
                  </p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t border-linen">
              <a
                href="https://wa.me/2348031234567?text=Hello%20Yahsab%20Apartments,%20I%20would%20like%20to%20make%20an%20inquiry"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full"
              >
                <Button
                  variant="outline"
                  size="md"
                  className="w-full text-emerald-800 border-emerald-300 hover:bg-emerald-50"
                  leftIcon={<MessageSquare className="w-4 h-4 text-emerald-600" />}
                >
                  Chat with Concierge on WhatsApp
                </Button>
              </a>
            </div>
          </div>

          {/* Form */}
          <div className="lg:col-span-7 rounded-3xl border border-linen bg-white p-8 sm:p-10 shadow-subtle">
            <h3 className="font-serif text-2xl font-semibold text-forest-900 mb-2">
              Send a Direct Message
            </h3>
            <p className="text-xs text-charcoal-700 mb-8">
              Fill out this form and our reservations coordinator will reply via email or phone within 2 hours.
            </p>

            {success ? (
              <div className="rounded-2xl border border-emerald-200 bg-emerald-50/80 p-8 text-center space-y-3">
                <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
                <h4 className="font-serif text-xl font-semibold text-emerald-900">
                  Message Sent Successfully
                </h4>
                <p className="text-xs text-emerald-700 max-w-md mx-auto leading-relaxed">
                  Thank you for reaching out to Yahsab. We have received your inquiry and our guest relation team will respond shortly.
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setSuccess(false)}
                  className="mt-4"
                >
                  Send Another Inquiry
                </Button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {error && (
                  <div className="flex items-center gap-2.5 rounded-xl border border-red-200 bg-red-50 p-4 text-xs text-red-700">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Input
                    label="Full Name"
                    required
                    placeholder="e.g. David Iorfa"
                    value={formData.name}
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                  />

                  <Input
                    label="Email Address"
                    type="email"
                    required
                    placeholder="e.g. david@example.com"
                    value={formData.email}
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Input
                    label="Phone / WhatsApp Number"
                    placeholder="e.g. 08031234567"
                    value={formData.phone}
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                  />

                  <Input
                    label="Subject"
                    required
                    placeholder="e.g. Booking inquiry for Makurdi Penthouse"
                    value={formData.subject}
                    onChange={(e) =>
                      setFormData({ ...formData, subject: e.target.value })
                    }
                  />
                </div>

                <Textarea
                  label="Message / Requirements"
                  required
                  rows={5}
                  placeholder="Tell us about your travel dates, preferred apartment, or special requests (e.g. airport pickup, early check-in)..."
                  value={formData.message}
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                />

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  className="w-full sm:w-auto px-8"
                  isLoading={isLoading}
                >
                  Submit Inquiry
                </Button>
              </form>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
