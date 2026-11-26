import { adminRoute, json, parseBody } from '@/lib/api';
import { reorderLinks } from '@/lib/data/links';
import { linkOrderSchema } from '@/lib/schemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const PUT = adminRoute('links:write', async (req, actor) => {
  const { ids } = await parseBody(req, linkOrderSchema);
  await reorderLinks(ids, actor);
  return json({ ok: true });
});
