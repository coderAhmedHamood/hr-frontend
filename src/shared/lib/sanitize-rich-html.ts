import DOMPurify from 'isomorphic-dompurify';

const ALLOWED_TAGS = [
  'p',
  'br',
  'strong',
  'b',
  'em',
  'i',
  'u',
  's',
  'h1',
  'h2',
  'h3',
  'h4',
  'ul',
  'ol',
  'li',
  'span',
  'a',
  'blockquote',
];

const ALLOWED_ATTR = ['href', 'target', 'rel', 'style', 'class'];

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

/** Convert legacy plain text into simple HTML paragraphs. */
export function plainTextToHtml(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return '';
  return trimmed
    .split(/\n{2,}/)
    .map((paragraph) => `<p>${escapeHtml(paragraph).replace(/\n/g, '<br>')}</p>`)
    .join('');
}

export function looksLikeHtml(value: string): boolean {
  return /<[a-z][\s\S]*>/i.test(value.trim());
}

/** Normalize stored body (plain or HTML) into editor/display HTML. */
export function normalizeRichHtml(value: string): string {
  if (!value.trim()) return '';
  return looksLikeHtml(value) ? value : plainTextToHtml(value);
}

/** Sanitize HTML for safe rendering while keeping formatting (colors, sizes, headings). */
export function sanitizeRichHtml(html: string): string {
  const normalized = normalizeRichHtml(html);
  if (!normalized) return '';

  return DOMPurify.sanitize(normalized, {
    ALLOWED_TAGS,
    ALLOWED_ATTR,
    ALLOW_DATA_ATTR: false,
    ALLOWED_URI_REGEXP: /^(?:(?:https?|mailto):|\/|#)/i,
  });
}
