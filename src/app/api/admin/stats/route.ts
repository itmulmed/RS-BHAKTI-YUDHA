import { adminRoute, json } from '@/lib/api';
import { getStats } from '@/lib/data/stats';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = adminRoute('dashboard:read', async () => json({ stats: await getStats() }));
