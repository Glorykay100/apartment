import { requireAuth } from '@/components/auth/RequireAuth';

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  await requireAuth('/admin');
  return children;
}
