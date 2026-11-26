import { adminRoute, json } from '@/lib/api';
import { listAudit } from '@/lib/data/audit';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = adminRoute('audit:read', async () => json({ rows: await listAudit(100) }));
