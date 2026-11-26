import 'server-only';
import bcrypt from 'bcryptjs';

// Hash pembanding saat email tidak ditemukan, agar waktu respons tidak membocorkan keberadaan akun.
let dummyHash: Promise<string> | undefined;

export async function verifyPassword(password: string, hash: string | undefined): Promise<boolean> {
  dummyHash ??= bcrypt.hash('bukan-kata-sandi-siapa-pun', 12);
  const ok = await bcrypt.compare(password, hash ?? (await dummyHash));
  return Boolean(hash) && ok;
}
