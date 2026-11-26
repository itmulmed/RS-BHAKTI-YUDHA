import { adminRoute, HttpError, json, parseBody } from '@/lib/api';
import { deleteLink, updateLink } from '@/lib/data/links';
import { linkUpdateSchema } from '@/lib/schemas';
import { isUuid } from '@/lib/validators';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function linkId(params: Record<string, string>): string {
  if (!isUuid(params.id)) throw new HttpError(404, 'Tautan tidak ditemukan.');
  return params.id;
}

export const PATCH = adminRoute('links:write', async (req, actor, { params }) => {
  const id = linkId(params);
  const input = await parseBody(req, linkUpdateSchema);
  return json({ link: await updateLink(id, input, actor) });
});

export const DELETE = adminRoute('links:write', async (_req, actor, { params }) => {
  await deleteLink(linkId(params), actor);
  return json({ ok: true });
});
