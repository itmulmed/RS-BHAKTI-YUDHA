import 'server-only';
import { redirect } from 'next/navigation';
import { can, type Permission } from './roles';
import { getSession } from './session';

export async function requirePage(permission: Permission) {
  const session = await getSession();
  if (!session) redirect('/login');
  if (!session.role || !can(session.role, permission)) redirect('/admin');
}
