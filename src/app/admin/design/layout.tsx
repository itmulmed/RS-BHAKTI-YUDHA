import { requirePage } from '@/lib/auth/require-page';

export default async function DesignLayout({ children }: { children: React.ReactNode }) {
  await requirePage('settings:write');
  return <>{children}</>;
}
