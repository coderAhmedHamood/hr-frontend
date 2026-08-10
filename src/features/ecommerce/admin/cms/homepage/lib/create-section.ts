import { getSectionDefinition } from '@/features/ecommerce/storefront/page-builder/lib/section-definition-registry';
import type { SectionRecord } from '@/features/ecommerce/storefront/page-builder/domain/section-types';
import type { SectionType } from '@/features/ecommerce/storefront/page-builder/domain/section-types';

function nextOrder(existing: SectionRecord[]): number {
  if (existing.length === 0) return 10;
  return Math.max(...existing.map((section) => section.order)) + 10;
}

/** Builds a new section record from its SectionDefinition defaults. */
export function createSectionFromDefinition(type: SectionType, existing: SectionRecord[]): SectionRecord {
  const definition = getSectionDefinition(type);
  const now = new Date().toISOString();
  const base = {
    id: crypto.randomUUID(),
    type,
    status: 'draft' as const,
    enabled: true,
    order: nextOrder(existing),
    revision: 1,
    createdAt: now,
    updatedAt: now,
    publishedAt: null,
    createdBy: null,
    updatedBy: null,
    ...definition.defaultConfiguration,
  };

  return base as SectionRecord;
}

export function reorderSections(sections: SectionRecord[]): SectionRecord[] {
  return [...sections]
    .sort((a, b) => a.order - b.order)
    .map((section, index) => ({
      ...section,
      order: (index + 1) * 10,
      updatedAt: new Date().toISOString(),
    }));
}
