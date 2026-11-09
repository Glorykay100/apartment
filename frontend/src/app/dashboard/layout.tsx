import { requireAuth } from '@/components/auth/RequireAuth';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  await requireAuth('/dashboard');
  return children;
}
