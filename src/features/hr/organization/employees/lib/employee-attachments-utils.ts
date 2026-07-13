export function formatAttachmentSize(bytes: number | null | undefined): string {
  if (bytes == null || !Number.isFinite(bytes) || bytes < 0) return '—';
  if (bytes < 1024) return `${bytes} بايت`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} ك.ب`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} م.ب`;
}

export function parseAttachmentTagsInput(value: string): string[] {
  return value
    .split(/[,،]/)
    .map((tag) => tag.trim())
    .filter(Boolean);
}

export function isImageAttachment(mimeType: string | null | undefined): boolean {
  return !!mimeType?.startsWith('image/');
}

export function isPdfAttachment(mimeType: string | null | undefined): boolean {
  return mimeType === 'application/pdf';
}

export function normalizeAttachmentTags(tags: string[] | string | null | undefined): string[] {
  if (Array.isArray(tags)) return tags.filter(Boolean);
  if (typeof tags === 'string' && tags.trim()) {
    return parseAttachmentTagsInput(tags);
  }
  return [];
}
