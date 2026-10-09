import sanitizeHtml from 'sanitize-html';

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

const COLOR = [
  /^#(?:[0-9a-f]{3}|[0-9a-f]{6}|[0-9a-f]{8})$/i,
  /^rgb\(\s*(?:\d{1,3}\s*,\s*){2}\d{1,3}\s*\)$/i,
  /^rgba\(\s*(?:\d{1,3}\s*,\s*){3}(?:0|1|0?\.\d+)\s*\)$/i,
];

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

/**
 * Sanitize HTML for safe rendering while keeping formatting (colors, sizes, headings).
 * Uses a parser with no DOM (no jsdom). jsdom crashes the production standalone
 * image because Next does not ship its default-stylesheet.css, and every server
 * action that imported it answered 500.
 */
export function sanitizeRichHtml(html: string): string {
  const normalized = normalizeRichHtml(html);
  if (!normalized) return '';

  return sanitizeHtml(normalized, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      a: ['href', 'target', 'rel'],
      '*': ['class', 'style'],
    },
    allowedStyles: {
      '*': {
        color: COLOR,
        'background-color': COLOR,
        'font-size': [/^\d+(?:\.\d+)?(?:px|em|rem|%)$/],
        'text-align': [/^(?:left|right|center|justify)$/],
        'font-weight': [/^(?:normal|bold|[1-9]00)$/],
        'text-decoration': [/^(?:none|underline|line-through)$/],
      },
    },
    allowedSchemes: ['http', 'https', 'mailto'],
    allowProtocolRelative: false,
    disallowedTagsMode: 'discard',
  });
}
