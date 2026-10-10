/**
 * Expense receipts: uploaded to the company's files on the server
 * (`POST /expenses/attachments`, stored under `/uploads/receipts`), then
 * listed in the expense. Shown through their signed URL.
 */
import { apiFormRequest } from '@/shared/api/client';
import { resolveUploadUrl } from '@/shared/resolve-upload-url';
import type { AttachmentMeta } from '../domain/types';

export const MAX_FILE_BYTES = 5 * 1024 * 1024;
export const MAX_FILES_PER_EXPENSE = 5;
export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

/** Checks a file against the limits; the Arabic reason when refused. */
export function checkFile(file: File, alreadyAttached: number): string | null {
  if (alreadyAttached >= MAX_FILES_PER_EXPENSE) return `الحد ${MAX_FILES_PER_EXPENSE} مرفقات لكل مصروف`;
  if (!ACCEPTED_TYPES.includes(file.type)) return 'الأنواع المقبولة: صور JPG/PNG/WebP أو PDF';
  if (file.size > MAX_FILE_BYTES) return 'الحد الأقصى للملف 5 ميغابايت';
  return null;
}

/** Uploads one receipt for the company; its metadata for the expense. */
export async function uploadReceipt(companyId: string, file: File): Promise<AttachmentMeta> {
  const form = new FormData();
  form.append('file', file);
  const res = await apiFormRequest<{ url: string; name: string; type: string; size: number }>(
    `/expenses/attachments?companyId=${encodeURIComponent(companyId)}`,
    form,
  );
  return {
    id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `att-${Date.now()}`,
    name: res.name || file.name,
    type: res.type || file.type,
    size: res.size ?? file.size,
    url: res.url,
  };
}

/** Where to open a receipt (null for sample receipts, which have no file). */
export function attachmentHref(attachment: AttachmentMeta): string | null {
  return attachment.url ? resolveUploadUrl(attachment.url) : null;
}
