import { BANNER_DEFINITION } from '@/features/ecommerce/storefront/page-builder/definitions/banner.definition';
import { BRAND_SLIDER_DEFINITION } from '@/features/ecommerce/storefront/page-builder/definitions/brand-slider.definition';
import { CATEGORY_GRID_DEFINITION } from '@/features/ecommerce/storefront/page-builder/definitions/category-grid.definition';
import { FEATURES_GRID_DEFINITION } from '@/features/ecommerce/storefront/page-builder/definitions/features-grid.definition';
import { FLASH_SALE_DEFINITION } from '@/features/ecommerce/storefront/page-builder/definitions/flash-sale.definition';
import { HERO_CAROUSEL_DEFINITION } from '@/features/ecommerce/storefront/page-builder/definitions/hero-carousel.definition';
import { PRODUCT_CAROUSEL_DEFINITION } from '@/features/ecommerce/storefront/page-builder/definitions/product-carousel.definition';
import type { SectionDefinition, SectionDefinitionCatalog } from '@/features/ecommerce/storefront/page-builder/domain/section-definition';
import { SECTION_TYPES, type SectionType } from '@/features/ecommerce/storefront/page-builder/domain/section-types';

export const SECTION_DEFINITIONS: SectionDefinition[] = [
  HERO_CAROUSEL_DEFINITION,
  CATEGORY_GRID_DEFINITION,
  PRODUCT_CAROUSEL_DEFINITION,
  FLASH_SALE_DEFINITION,
  FEATURES_GRID_DEFINITION,
  BRAND_SLIDER_DEFINITION,
  BANNER_DEFINITION,
];

export const SECTION_DEFINITION_REGISTRY: Record<SectionType, SectionDefinition> = Object.fromEntries(
  SECTION_DEFINITIONS.map((definition) => [definition.type, definition]),
) as Record<SectionType, SectionDefinition>;

export function getSectionDefinition<T extends SectionType>(type: T): SectionDefinition<T> {
  return SECTION_DEFINITION_REGISTRY[type] as SectionDefinition<T>;
}

export function getAllSectionDefinitions(): SectionDefinition[] {
  return SECTION_DEFINITIONS;
}

export function getSectionDefinitionCatalog(): SectionDefinitionCatalog {
  return {
    schemaVersion: 1,
    sections: SECTION_DEFINITIONS,
  };
}

/** JSON-serializable manifest for admin API / backend contract handoff (excludes Zod runtime objects). */
export function getSectionDefinitionManifest() {
  return {
    schemaVersion: 1,
    sections: SECTION_DEFINITIONS.map((definition) => ({
      id: definition.id,
      type: definition.type,
      displayName: definition.displayName,
      description: definition.description,
      icon: definition.icon,
      category: definition.category,
      componentKey: definition.componentKey,
      validationSchemaId: definition.validationSchemaId,
      configurationSchemaId: definition.configurationSchemaId,
      defaultConfiguration: definition.defaultConfiguration,
      supportedLayouts: definition.supportedLayouts,
      supportedThemes: definition.supportedThemes,
      supportedDataSources: definition.supportedDataSources,
      supportedLocales: definition.supportedLocales,
      supportedDevices: definition.supportedDevices,
      capabilities: definition.capabilities,
      fields: definition.fields,
    })),
  };
}

export function assertSectionDefinitionRegistryComplete(): void {
  for (const type of SECTION_TYPES) {
    if (!SECTION_DEFINITION_REGISTRY[type]) {
      throw new Error(`Missing section definition for type: ${type}`);
    }
  }
}

assertSectionDefinitionRegistryComplete();
