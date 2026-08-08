import { compressPaymentProofToDataUrl } from '@/features/ecommerce/domain/lib/payment-proofs';
import type { CreateStoreOrderAttachmentInput } from '@/features/ecommerce/domain/types/order';

/** Backend caps attachments uploaded with a single order at 20. */
export const MAX_ORDER_ATTACHMENTS = 20;
/** Original file size cap (per file) before encoding. */
export const MAX_ORDER_ATTACHMENT_BYTES = 5 * 1024 * 1024;
/** File picker accept list — images + PDF cover the common receipt/ID cases. */
export const ORDER_ATTACHMENT_ACCEPT = 'image/*,application/pdf';

export function isImageMime(mime?: string | null): boolean {
  return Boolean(mime && mime.startsWith('image/'));
}

/** Human-readable size from a bigint-as-string or number. */
export function formatAttachmentSize(bytes: string | number | null | undefined): string {
  const value = typeof bytes === 'string' ? Number(bytes) : bytes;
  if (!value || !Number.isFinite(value) || value <= 0) return '';
  const units = ['B', 'KB', 'MB', 'GB'];
  let size = value;
  let unit = 0;
  while (size >= 1024 && unit < units.length - 1) {
    size /= 1024;
    unit += 1;
  }
  const rounded = size >= 10 || unit === 0 ? Math.round(size) : Math.round(size * 10) / 10;
  return `${rounded} ${units[unit]}`;
}

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error ?? new Error('READ_FAILED'));
    reader.readAsDataURL(file);
  });
}

/**
 * Convert a picked file into the attachment payload the order API expects.
 * There is no separate upload endpoint in the frontend, so the file is embedded
 * as a data URL (images are compressed like payment proofs; other types read as-is)
 * and sent through `fileUrl`.
 */
export async function fileToOrderAttachment(
  file: File,
  label?: string | null,
): Promise<CreateStoreOrderAttachmentInput> {
  const isImage = file.type.startsWith('image/');
  const fileUrl = isImage
    ? await compressPaymentProofToDataUrl(file)
    : await readFileAsDataUrl(file);
  const trimmedLabel = label?.trim();
  return {
    fileName: file.name.slice(0, 255),
    fileUrl,
    mimeType: file.type || null,
    sizeBytes: file.size || null,
    label: trimmedLabel ? trimmedLabel.slice(0, 120) : null,
  };
}
