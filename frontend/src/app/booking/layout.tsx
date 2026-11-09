import { requireAuth } from '@/components/auth/RequireAuth';

export default async function BookingLayout({ children }: { children: React.ReactNode }) {
  await requireAuth('/booking/checkout');
  return children;
}
