/** Normalize legacy single URL + array field into a clean unique list. */
export function resolvePaymentProofUrls(input: {
  paymentProofUrls?: string[] | null;
  paymentProofUrl?: string | null;
}): string[] {
  const fromArray = (input.paymentProofUrls ?? [])
    .map((url) => url?.trim())
    .filter((url): url is string => Boolean(url));
  if (fromArray.length > 0) {
    return Array.from(new Set(fromArray));
  }
  const single = input.paymentProofUrl?.trim();
  return single ? [single] : [];
}

/** UI limit before compression (original file). */
export const MAX_PAYMENT_PROOF_FILES = 1;
export const MAX_PAYMENT_PROOF_BYTES = 4 * 1024 * 1024;

/**
 * Compress an image for JSON order payloads.
 * Nest rejects large bodies ("request entity too large") when base64 proofs are huge.
 * Target ~120KB data URL.
 */
export async function compressPaymentProofToDataUrl(file: File): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const maxEdge = 1280;
  const scale = Math.min(1, maxEdge / Math.max(bitmap.width, bitmap.height));
  const width = Math.max(1, Math.round(bitmap.width * scale));
  const height = Math.max(1, Math.round(bitmap.height * scale));

  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    bitmap.close();
    throw new Error('CANVAS_UNSUPPORTED');
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  let quality = 0.72;
  let dataUrl = canvas.toDataURL('image/jpeg', quality);
  const maxDataUrlChars = 160_000; // ~120KB binary + base64 overhead
  while (dataUrl.length > maxDataUrlChars && quality > 0.35) {
    quality -= 0.1;
    dataUrl = canvas.toDataURL('image/jpeg', quality);
  }
  return dataUrl;
}
