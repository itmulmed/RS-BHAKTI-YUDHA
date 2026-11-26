export const ROLES = ['admin', 'editor'] as const;
export type Role = (typeof ROLES)[number];

export type Permission =
  | 'dashboard:read'
  | 'links:write'
  | 'settings:write'
  | 'audit:read';

const PERMISSIONS: Record<Role, readonly Permission[]> = {
  // Akses penuh
  admin: ['dashboard:read', 'links:write', 'settings:write', 'audit:read'],
  // Mengelola tautan dan melihat statistik
  editor: ['dashboard:read', 'links:write'],
};

export function isRole(value: unknown): value is Role {
  return typeof value === 'string' && (ROLES as readonly string[]).includes(value);
}

export function can(role: Role, permission: Permission): boolean {
  return PERMISSIONS[role].includes(permission);
}
