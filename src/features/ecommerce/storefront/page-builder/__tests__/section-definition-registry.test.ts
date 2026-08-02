import {
  getAllSectionDefinitions,
  getSectionDefinition,
  SECTION_DEFINITION_REGISTRY,
} from '@/features/ecommerce/storefront/page-builder/lib/section-definition-registry';
import { SECTION_TYPES } from '@/features/ecommerce/storefront/page-builder/domain/section-types';
import homepagePageSeed from '@/features/ecommerce/storefront/page-builder/lib/mock/pages/homepage.json';
import { pageRecordSchema } from '@/features/ecommerce/storefront/page-builder/schemas/page.schema';

const SECTION_METADATA_STUB = {
  id: '3fa85f64-5717-4562-b3fc-2c963f66afa6',
  status: 'draft' as const,
  enabled: true,
  order: 0,
  revision: 1,
  createdAt: '2026-01-01T00:00:00.000Z',
  updatedAt: '2026-01-01T00:00:00.000Z',
  publishedAt: null,
  createdBy: null,
  updatedBy: null,
};

describe('Section Definition Registry', () => {
  it('registers a definition for every section type', () => {
    for (const type of SECTION_TYPES) {
      expect(SECTION_DEFINITION_REGISTRY[type]).toBeDefined();
      expect(getSectionDefinition(type).type).toBe(type);
    }
  });

  it('exposes seven section definitions in catalog order', () => {
    expect(getAllSectionDefinitions()).toHaveLength(SECTION_TYPES.length);
  });

  it('uses default layout values from supportedLayouts', () => {
    for (const type of SECTION_TYPES) {
      const definition = getSectionDefinition(type);
      const layout = (definition.defaultConfiguration.style as { layout: string }).layout;
      expect(definition.supportedLayouts).toContain(layout);
    }
  });

  it('declares unique field paths per section', () => {
    for (const type of SECTION_TYPES) {
      const paths = getSectionDefinition(type).fields.map((field) => field.path);
      expect(new Set(paths).size).toBe(paths.length);
    }
  });

  it('validates default configuration merged with section metadata', () => {
    for (const type of SECTION_TYPES) {
      const definition = getSectionDefinition(type);
      const payload = {
        ...SECTION_METADATA_STUB,
        type: definition.type,
        ...definition.defaultConfiguration,
      };

      expect(() => definition.validationSchema.parse(payload)).not.toThrow();
    }
  });

  it('maps componentKey to section type', () => {
    for (const type of SECTION_TYPES) {
      const definition = getSectionDefinition(type);
      expect(definition.componentKey).toBe(type);
      expect(definition.id).toBe(type);
    }
  });

  it('validates homepage mock page JSON against pageRecordSchema', () => {
    expect(() => pageRecordSchema.parse(homepagePageSeed)).not.toThrow();
  });
});
