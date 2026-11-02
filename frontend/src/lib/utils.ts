import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNaira(amount: number): string {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
    maximumFractionDigits: 0,
  })
    .format(amount)
    .replace('NGN', '₦');
}

export function formatDateRange(checkIn: Date | string, checkOut: Date | string): string {
  const start = new Date(checkIn);
  const end = new Date(checkOut);
  return `${start.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  })} – ${end.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })}`;
}
