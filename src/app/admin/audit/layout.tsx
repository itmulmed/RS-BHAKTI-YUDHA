import { requirePage } from '@/lib/auth/require-page';

export default async function AuditLayout({ children }: { children: React.ReactNode }) {
  await requirePage('audit:read');
  return <>{children}</>;
}
