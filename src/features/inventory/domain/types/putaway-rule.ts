import type { TenantScoped } from '@/features/ecommerce/domain/types/common';
import type { PackagingType } from '@/features/ecommerce/domain/types/product';

/**
 * What the putaway rule applies to.
 * - product: one SKU (highest priority when matching)
 * - category: all products in a catalog category
 * - all: warehouse default / catch-all
 */
export type PutawayAppliesTo = 'product' | 'category' | 'all';

/**
 * Putaway rule for warehouse ops:
 * When goods arrive at `arriveLocationId`, move them to `storeLocationId`
 * (optionally a more specific `subLocationId`).
 *
 * Kept lean on purpose — no storage-category engine, no package-capacity rules.
 */
export type PutawayRule = TenantScoped & {
  id: string;
  warehouseId: string;
  /** Where the goods show up (e.g. Vendors counterpart or WH/Stock). */
  arriveLocationId: string;
  appliesTo: PutawayAppliesTo;
  productId?: string | null;
  categoryId?: string | null;
  /** Optional packaging filter; null/undefined = any packaging. */
  packagingType?: PackagingType | null;
  /** Primary internal destination. */
  storeLocationId: string;
  /** Optional child of store (e.g. aisle/shelf under WH/Stock). */
  subLocationId?: string | null;
  /** Lower number = higher priority within the same appliesTo specificity. */
  sequence: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type PutawayRuleListQuery = {
  companyId: string;
  search?: string;
  productId?: string;
  categoryId?: string;
  warehouseId?: string;
  page?: number;
  limit?: number;
};

export type CreatePutawayRuleInput = Omit<PutawayRule, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdatePutawayRuleInput = Partial<CreatePutawayRuleInput>;

export type PutawayMatchContext = {
  warehouseId: string;
  arriveLocationId: string;
  productId?: string | null;
  categoryId?: string | null;
  packagingType?: PackagingType | null;
};

export type PutawayLocationOption = {
  id: string;
  warehouseId: string;
  warehouseNameAr: string;
  nameAr: string;
  code: string;
  locationType: string;
  parentLocationId?: string | null;
  isActive: boolean;
};
