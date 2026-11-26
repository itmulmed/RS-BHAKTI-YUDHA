import { adminRoute, json, parseBody } from '@/lib/api';
import { createLink, listLinks } from '@/lib/data/links';
import { linkCreateSchema } from '@/lib/schemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = adminRoute('dashboard:read', async () => json({ links: await listLinks() }));

export const POST = adminRoute('links:write', async (req, actor) => {
  const input = await parseBody(req, linkCreateSchema);
  return json({ link: await createLink(input, actor) }, 201);
});
