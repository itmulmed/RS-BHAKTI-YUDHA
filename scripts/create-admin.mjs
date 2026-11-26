// Membuat admin baru atau mengganti kata sandi/peran admin. Hanya bisa dijalankan
// oleh orang yang memegang MONGODB_URI. Tidak ada registrasi lewat web.
import { randomUUID } from 'node:crypto';
import { createInterface } from 'node:readline/promises';
import bcrypt from 'bcryptjs';
import { connect, ensureIndexes } from './shared.mjs';

async function ask(question) {
  const rl = createInterface({ input: process.stdin, output: process.stdout });
  const answer = await rl.question(question);
  rl.close();
  return answer.trim();
}

/** Input tersembunyi: kata sandi tidak tampil dan tidak tersimpan di riwayat terminal. */
function askHidden(question) {
  return new Promise((resolve) => {
    const { stdin, stdout } = process;
    let value = '';
    stdout.write(question);
    stdin.setRawMode(true);
    stdin.setEncoding('utf8');
    stdin.resume();
    const onData = (chunk) => {
      for (const ch of chunk) {
        if (ch === '\r' || ch === '\n') {
          stdin.off('data', onData);
          stdin.setRawMode(false);
          stdin.pause();
          stdout.write('\n');
          return resolve(value);
        }
        if (ch === '\u0003') process.exit(130);
        if (ch === '\u007f' || ch === '\b') value = value.slice(0, -1);
        else value += ch;
      }
    };
    stdin.on('data', onData);
  });
}

if (!process.stdin.isTTY) {
  console.error('Jalankan perintah ini langsung di terminal.');
  process.exit(1);
}

const { client, db } = await connect();
try {
  await ensureIndexes(db);
  const email = (await ask('Email admin: ')).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('Email tidak valid.');

  const users = db.collection('users');
  const existing = await users.findOne({ email });
  if (existing) {
    const yes = await ask('Akun sudah ada. Ganti kata sandi dan perannya? (y/N): ');
    if (yes.toLowerCase() !== 'y') process.exit(0);
  }

  const name = existing?.name || (await ask('Nama: ')) || email;
  const role = (await ask('Peran [admin/editor] (admin): ')).toLowerCase() || 'admin';
  if (!['admin', 'editor'].includes(role)) throw new Error('Peran harus admin atau editor.');

  const password = await askHidden('Kata sandi (min. 12 karakter): ');
  if (password.length < 12) throw new Error('Kata sandi minimal 12 karakter.');
  if (Buffer.byteLength(password) > 72) throw new Error('Kata sandi maksimal 72 byte.');
  if ((await askHidden('Ulangi kata sandi: ')) !== password) throw new Error('Kata sandi tidak sama.');

  const now = new Date();
  const userId = existing?._id ?? randomUUID();
  const password_hash = await bcrypt.hash(password, 12);

  if (existing) {
    await users.updateOne(
      { _id: userId },
      { $set: { password_hash, is_active: true, updated_at: now }, $inc: { session_version: 1 } }
    );
  } else {
    await users.insertOne({
      _id: userId, email, name, password_hash, is_active: true,
      session_version: 1, created_at: now, updated_at: now,
    });
  }
  await db.collection('admins').updateOne(
    { user_id: userId },
    { $set: { role }, $setOnInsert: { _id: randomUUID(), created_at: now } },
    { upsert: true }
  );
  console.log(`Berhasil: ${email} (${role}) siap digunakan.`);
} catch (error) {
  console.error(`Gagal: ${error.message}`);
  process.exitCode = 1;
} finally {
  await client.close();
}
