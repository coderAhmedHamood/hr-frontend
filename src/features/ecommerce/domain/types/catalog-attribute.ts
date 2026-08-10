import type { TenantScoped } from '@/features/ecommerce/domain/types/common';

/** How attribute options are shown on the product form / storefront. */
export type AttributeDisplayType = 'radio' | 'pills' | 'select' | 'color' | 'image' | 'multi';

/**
 * When variants are generated from attribute values:
 * - always: create variant combinations immediately
 * - dynamic: create when selected/ordered
 * - never: attribute only (no SKU matrix)
 */
export type VariantCreationMode = 'always' | 'dynamic' | 'never';

/**
 * One selectable value under a catalog attribute.
 * Visual fields depend on `displayType` of the parent attribute:
 * - color → colorHex (+ optional imageUrl for swatch photo)
 * - image → imageUrl
 * - others → name / freeText / price only
 */
export type CatalogAttributeValue = {
  id: string;
  nameAr: string;
  /** Free text / description shown on storefront or admin. */
  freeText?: string;
  /** Default extra price for this value (storefront surcharge hint). */
  defaultExtraPrice?: number;
  /** Hex color for displayType=color (e.g. #ef4444). */
  colorHex?: string;
  /** Image URL for displayType=image or optional color swatch photo. */
  imageUrl?: string;
  /**
   * @deprecated Prefer colorHex / imageUrl. Kept for older mock/API payloads.
   */
  extra?: string;
};

/** Master attribute definition — configured once, reused on products. */
export type CatalogAttribute = TenantScoped & {
  id: string;
  nameAr: string;
  displayType: AttributeDisplayType;
  createVariant: VariantCreationMode;
  values: CatalogAttributeValue[];
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type CatalogAttributeListQuery = {
  companyId: string;
  search?: string;
  page?: number;
  limit?: number;
};

export type CreateCatalogAttributeInput = Omit<CatalogAttribute, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateCatalogAttributeInput = Partial<CreateCatalogAttributeInput>;

/** Normalize legacy `extra` into colorHex / imageUrl for storefront use. */
export function normalizeAttributeValue(
  value: CatalogAttributeValue,
  displayType?: AttributeDisplayType,
): CatalogAttributeValue {
  const extra = value.extra?.trim();
  let colorHex = value.colorHex?.trim() || undefined;
  let imageUrl = value.imageUrl?.trim() || undefined;

  if (extra && !colorHex && !imageUrl) {
    if (extra.startsWith('#') || (displayType === 'color' && /^[0-9a-fA-F]{3,8}$/.test(extra))) {
      colorHex = extra.startsWith('#') ? extra : `#${extra}`;
    } else if (/^https?:\/\//i.test(extra) || extra.startsWith('/')) {
      imageUrl = extra;
    } else if (displayType === 'color') {
      colorHex = extra.startsWith('#') ? extra : `#${extra}`;
    } else if (displayType === 'image') {
      imageUrl = extra;
    }
  }

  return {
    id: value.id,
    nameAr: value.nameAr,
    freeText: value.freeText,
    defaultExtraPrice: value.defaultExtraPrice,
    colorHex,
    imageUrl,
  };
}
