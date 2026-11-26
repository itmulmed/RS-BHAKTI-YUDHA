import { adminRoute, json, parseBody } from '@/lib/api';
import { getSettings, updateSettings } from '@/lib/data/settings';
import { settingsSchema } from '@/lib/schemas';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

export const GET = adminRoute('dashboard:read', async () => json({ settings: await getSettings() }));

export const PUT = adminRoute('settings:write', async (req, actor) => {
  const input = await parseBody(req, settingsSchema);
  return json({ settings: await updateSettings(input, actor) });
});
