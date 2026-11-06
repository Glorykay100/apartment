'use client';

import React, { useState } from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';

interface FaqItem {
  question: string;
  answer: string;
}

const faqs: FaqItem[] = [
  {
    question: 'How does the booking and payment process work?',
    answer:
      'Select your desired dates and guest count on any apartment page. Our system calculates the exact transparent quote (nightly rate + cleaning fee + 5% service fee). You can pay seamlessly in Nigerian Naira (₦) using Paystack (debit card, bank transfer, or USSD). You immediately receive an official email confirmation and booking reference.',
  },
  {
    question: 'What is the Yahsab cancellation and refund policy?',
    answer:
      'All bookings are final and non-refundable once payment is confirmed unless Yahsab grants a written exception at its sole discretion. Guests may cancel to release dates, but no automatic refund is issued.',
  },
  {
    question: 'Are 24/7 power and high-speed internet truly guaranteed in Makurdi?',
    answer:
      'Yes, unconditionally. Central Nigeria occasionally experiences grid interruptions, so every single Yahsab residence is engineered with an industrial hybrid solar inverter bank and an automated silent diesel generator. Our Starlink satellite dishes provide gigabit low-latency internet suitable for video calls, trading, and engineering workflows.',
  },
  {
    question: 'What are the check-in and check-out procedures?',
    answer:
      'Standard check-in is from 14:00 (2:00 PM) WAT, and check-out is by 11:00 AM WAT. We offer smart keyless door locks so you can check in at your convenience without waiting for keys. If you arrive early, our on-site security can safely hold your luggage while you relax or explore.',
  },
  {
    question: 'Can I host a birthday party, photo shoot, or social event?',
    answer:
      'To maintain serenity, privacy, and safety for all residents, loud parties, club events, and unauthorized commercial video shoots are strictly prohibited. Intimate dinners or corporate meetings must comply with registered guest limits. For media productions, please contact our management team in advance for bespoke permits.',
  },
];

export const FaqAccordion: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <section className="py-24 bg-white border-b border-linen">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <span className="text-xs font-bold uppercase tracking-[0.22em] text-terracotta-500">
            Clear Answers
          </span>
          <h2 className="mt-3 font-serif text-3xl sm:text-4xl font-semibold tracking-tight text-forest-900">
            Frequently Asked Questions
          </h2>
          <p className="mt-3 text-base text-charcoal-700 leading-relaxed font-light">
            Everything you need to know about our reservation guidelines, amenities, and house policies.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index;
            return (
              <div
                key={faq.question}
                className="overflow-hidden rounded-2xl border border-linen bg-sand-50/50 transition-colors"
              >
                <button
                  onClick={() => toggle(index)}
                  className="flex w-full items-center justify-between p-6 text-left transition-colors hover:bg-sand-100"
                  aria-expanded={isOpen}
                >
                  <span className="font-serif text-lg font-semibold text-forest-900 pr-4">
                    {faq.question}
                  </span>
                  <div
                    className={cn(
                      'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-linen bg-white transition-transform duration-200',
                      isOpen && 'rotate-180 bg-sand-200'
                    )}
                  >
                    <ChevronDown className="h-4 w-4 text-forest-900" />
                  </div>
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 text-sm text-charcoal-700 leading-relaxed border-t border-linen/60 pt-4 bg-white">
                    {faq.answer}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
