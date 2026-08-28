/** Parsed block from circular body text (entered in DB / form). */
export type CircularBodyBlock =
  | { type: 'para'; text: string }
  | { type: 'bullet'; text: string; hollow: boolean }
  | { type: 'numbered'; text: string; label: string }
  | { type: 'section'; text: string };

const SOLID_BULLET = /^[-*•]\s+(.+)$/;
const HOLLOW_BULLET = /^[○◦oO]\s+(.+)$/;
const NUMBERED = /^(\d+[\.\-\)])\s+(.+)$/;
const SECTION = /^#{1,2}\s+(.+)$/;

/**
 * Turns free-form Arabic body text into layout blocks.
 * Conventions (optional, for lists like the paper form):
 * - `- item` or `• item` → solid bullet
 * - `○ item` → hollow bullet
 * - `1. item` → numbered line
 * - `## عنوان` → underlined section title
 */
export function parseCircularBodyBlocks(bodyAr: string): CircularBodyBlock[] {
  const trimmed = bodyAr.trim();
  if (!trimmed) return [];

  const blocks: CircularBodyBlock[] = [];
  for (const rawLine of trimmed.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line) continue;

    const section = SECTION.exec(line);
    if (section) {
      blocks.push({ type: 'section', text: section[1].trim() });
      continue;
    }

    const hollow = HOLLOW_BULLET.exec(line);
    if (hollow) {
      blocks.push({ type: 'bullet', text: hollow[1].trim(), hollow: true });
      continue;
    }

    const solid = SOLID_BULLET.exec(line);
    if (solid) {
      blocks.push({ type: 'bullet', text: solid[1].trim(), hollow: false });
      continue;
    }

    const numbered = NUMBERED.exec(line);
    if (numbered) {
      blocks.push({
        type: 'numbered',
        label: numbered[1].trim(),
        text: numbered[2].trim(),
      });
      continue;
    }

    blocks.push({ type: 'para', text: line });
  }

  return blocks;
}
