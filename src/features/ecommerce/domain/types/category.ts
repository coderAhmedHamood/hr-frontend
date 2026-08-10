import type { MediaItem, SeoFields, Slugged, TenantScoped } from '@/features/ecommerce/domain/types/common';
import type { WarehouseRemovalStrategy } from '@/features/inventory/domain/types/warehouse';

/** How stock packages are reserved when fulfilling from this category. */
export type CategoryPackageReservation = 'full' | 'partial';

export type CategoryLogistics = {
  /** Free-text notes for inventory routes (purchase/receipt/delivery). */
  routesNote?: string;
  removalStrategy?: WarehouseRemovalStrategy;
  packageReservation?: CategoryPackageReservation;
};

export type Category = TenantScoped &
  Slugged & {
    id: string;
    nameAr: string;
    nameEn?: string;
    description?: string;
    image?: MediaItem;
    parentId?: string | null;
    /** Brand IDs shown in storefront mega menu for this (usually root) category. */
    featuredBrandIds?: string[];
    seo: SeoFields;
    displayOrder: number;
    isActive: boolean;
    /**
     * Legacy optional payload. Inventory policy is configured via putaway rules /
     * locations — not edited on the category form.
     */
    logistics?: CategoryLogistics;
    createdAt: string;
    updatedAt: string;
  };

export type CategoryListQuery = {
  companyId: string;
  search?: string;
  parentId?: string | null;
  page?: number;
  limit?: number;
};

export type CreateCategoryInput = Omit<Category, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateCategoryInput = Partial<CreateCategoryInput>;
