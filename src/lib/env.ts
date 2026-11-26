import 'server-only';

export function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Environment variable ${name} belum diisi.`);
  return value;
}

export function authSecret(): string {
  const secret = requireEnv('AUTH_SECRET');
  if (secret.length < 32) throw new Error('AUTH_SECRET minimal 32 karakter.');
  return secret;
}
