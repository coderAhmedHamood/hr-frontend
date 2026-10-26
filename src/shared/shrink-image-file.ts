/** Longest side kept for a store logo (header shows it at 40px). */
export const STORE_LOGO_MAX_EDGE = 160;

/** Longest side kept for the browser-tab icon. */
export const FAVICON_MAX_EDGE = 64;

/** Company logo is also the admin favicon and the printed letterhead. */
export const COMPANY_LOGO_MAX_EDGE = 512;

export function fittedSize(
  width: number,
  height: number,
  maxEdge: number,
): { width: number; height: number } {
  const longest = Math.max(width, height, 1);
  if (longest <= maxEdge) return { width, height };
  const scale = maxEdge / longest;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/**
 * Shrink an image so a logo or icon is not a multi-megabyte download.
 * Already-small WebP files are left as they are. SVG is not rasterized.
 */
export function isSvgFile(file: File): boolean {
  return file.type === 'image/svg+xml' || file.name.toLowerCase().endsWith('.svg');
}

export async function shrinkImageFile(file: File, maxEdge: number): Promise<File> {
  if (isSvgFile(file) || !file.type.startsWith('image/')) return file;
  if (typeof createImageBitmap !== 'function') return file;

  const bitmap = await createImageBitmap(file);
  try {
    const size = fittedSize(bitmap.width, bitmap.height, maxEdge);
    const alreadySmall =
      size.width === bitmap.width &&
      size.height === bitmap.height &&
      file.type === 'image/webp' &&
      file.size <= 80 * 1024;
    if (alreadySmall) return file;

    const canvas = document.createElement('canvas');
    canvas.width = size.width;
    canvas.height = size.height;
    const ctx = canvas.getContext('2d');
    if (!ctx) return file;
    ctx.drawImage(bitmap, 0, 0, size.width, size.height);

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((result) => resolve(result), 'image/webp', 0.82);
    });
    if (!blob) return file;
    if (blob.size >= file.size && size.width === bitmap.width && size.height === bitmap.height) {
      return file;
    }
    const base = file.name.replace(/\.[^.]+$/, '') || 'image';
    return new File([blob], `${base}.webp`, { type: 'image/webp' });
  } finally {
    bitmap.close();
  }
}
