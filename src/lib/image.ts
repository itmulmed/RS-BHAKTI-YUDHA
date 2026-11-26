/** Mengecilkan gambar di browser sebelum diunggah (hemat kuota & ruang penyimpanan). */
export async function resizeImage(
  file: File,
  maxSide: number,
  forceJpeg = false
): Promise<{ blob: Blob; ext: 'png' | 'jpg' }> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height));
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement('canvas');
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Browser tidak mendukung pengolahan gambar.');
  const keepPng = file.type === 'image/png' && !forceJpeg;
  if (!keepPng) {
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
  }
  ctx.drawImage(bitmap, 0, 0, w, h);
  const type = keepPng ? 'image/png' : 'image/jpeg';
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, 0.85));
  if (!blob) throw new Error('Gagal memproses gambar.');
  return { blob, ext: keepPng ? 'png' : 'jpg' };
}
