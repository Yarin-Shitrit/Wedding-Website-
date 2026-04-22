// Client-side image compression. Returns a JPEG data URL
// resized so the longer side is <= maxEdge, quality 0.82.
export async function compressImage(
  file: File,
  maxEdge = 1600,
  quality = 0.82
): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const w = Math.round(bitmap.width * scale);
  const h = Math.round(bitmap.height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = w;
  canvas.height = h;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("no canvas ctx");
  ctx.drawImage(bitmap, 0, 0, w, h);
  return canvas.toDataURL("image/jpeg", quality);
}

// Server-side validator for data URLs we accept into the DB.
// Keeps payload bounded so we don't blow up Postgres rows.
const MAX_BYTES = 3 * 1024 * 1024; // 3MB per image
export function validateDataUrl(s: unknown): string | null {
  if (typeof s !== "string") return null;
  if (!s.startsWith("data:image/")) return null;
  if (s.length > MAX_BYTES) return null;
  return s;
}
