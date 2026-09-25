/**
 * Client-side compression: longest edge ≤ 1024px, JPEG q≈0.8. Re-encoding via
 * canvas drops all EXIF (including GPS). createImageBitmap applies the EXIF
 * orientation so the output is upright.
 */
export async function compressImage(file: Blob, maxEdge = 1024, quality = 0.8): Promise<{ base64: string; dataUrl: string }> {
  const bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas not supported");
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close();
  const dataUrl = canvas.toDataURL("image/jpeg", quality);
  return { dataUrl, base64: dataUrl.slice(dataUrl.indexOf(",") + 1) };
}

/** Triggers a download of the original photo, e.g. meal-20260925-1330.jpg. */
export function downloadOriginal(file: Blob, now = new Date()) {
  const p = (n: number) => String(n).padStart(2, "0");
  const name = `meal-${now.getFullYear()}${p(now.getMonth() + 1)}${p(now.getDate())}-${p(now.getHours())}${p(now.getMinutes())}.jpg`;
  const url = URL.createObjectURL(file);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}
