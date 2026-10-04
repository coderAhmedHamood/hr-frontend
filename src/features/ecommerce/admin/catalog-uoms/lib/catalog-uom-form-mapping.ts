import type { CatalogUom } from '@/features/ecommerce/admin/catalog-uoms/lib/api/catalog-uoms';
import type { CatalogUomFormValues } from '@/features/ecommerce/admin/catalog-uoms/schemas/catalog-uom-schema';

export function catalogUomToFormValues(row: CatalogUom): CatalogUomFormValues {
  return {
    nameAr: row.nameAr,
    nameEn: row.nameEn ?? '',
    code: row.code,
    uneceCode: row.uneceCode ?? '',
    packagingType: row.packagingType,
    category: row.category,
    displayOrder: row.displayOrder,
    isActive: row.isActive,
  };
}

export function formValuesToCreatePayload(values: CatalogUomFormValues, companyId: string) {
  return {
    companyId,
    nameAr: values.nameAr,
    nameEn: values.nameEn?.trim() || null,
    code: values.code?.trim() || undefined,
    uneceCode: values.uneceCode?.trim() || null,
    packagingType: values.packagingType,
    category: values.category,
  };
}

export function formValuesToUpdatePayload(values: CatalogUomFormValues) {
  return {
    nameAr: values.nameAr,
    nameEn: values.nameEn?.trim() || null,
    code: values.code?.trim() || undefined,
    uneceCode: values.uneceCode?.trim() || null,
    packagingType: values.packagingType,
    category: values.category,
    displayOrder: values.displayOrder,
    isActive: values.isActive,
  };
}
