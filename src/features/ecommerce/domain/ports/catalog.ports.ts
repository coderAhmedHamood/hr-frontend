/**
 * Admin / CMS catalog ports — bilingual domain records + CRUD.
 * Storefront read ports live under storefront/domain (localized Storefront* models).
 */
import type { PaginatedResult } from '@/features/ecommerce/domain/types/common';
import type {
  Brand,
  BrandListQuery,
  CreateBrandInput,
  UpdateBrandInput,
} from '@/features/ecommerce/domain/types/brand';
import type {
  Category,
  CategoryListQuery,
  CreateCategoryInput,
  UpdateCategoryInput,
} from '@/features/ecommerce/domain/types/category';
import type {
  CreateProductInput,
  Product,
  ProductListQuery,
  UpdateProductInput,
} from '@/features/ecommerce/domain/types/product';

export type AdminProductsPort = {
  getAll(query: ProductListQuery): Promise<PaginatedResult<Product>>;
  getById(companyId: string, id: string): Promise<Product | null>;
  getBySlug(companyId: string, slug: string): Promise<Product | null>;
  create(input: CreateProductInput): Promise<Product>;
  update(companyId: string, id: string, patch: UpdateProductInput): Promise<Product | null>;
  remove(companyId: string, id: string): Promise<boolean>;
  duplicate(companyId: string, id: string): Promise<Product | null>;
  archive(companyId: string, id: string): Promise<Product | null>;
  unarchive(companyId: string, id: string): Promise<Product | null>;
  bulkUpdateStatus(companyId: string, ids: string[], status: Product['status']): Promise<Product[]>;
  bulkRemove(companyId: string, ids: string[]): Promise<number>;
};

export type AdminCategoriesPort = {
  getAll(query: CategoryListQuery): Promise<PaginatedResult<Category>>;
  getById(companyId: string, id: string): Promise<Category | null>;
  getBySlug(companyId: string, slug: string): Promise<Category | null>;
  create(input: CreateCategoryInput): Promise<Category>;
  update(companyId: string, id: string, patch: UpdateCategoryInput): Promise<Category | null>;
  remove(companyId: string, id: string): Promise<boolean>;
};

export type AdminBrandsPort = {
  getAll(query: BrandListQuery): Promise<PaginatedResult<Brand>>;
  getById(companyId: string, id: string): Promise<Brand | null>;
  getBySlug(companyId: string, slug: string): Promise<Brand | null>;
  create(input: CreateBrandInput): Promise<Brand>;
  update(companyId: string, id: string, patch: UpdateBrandInput): Promise<Brand | null>;
  remove(companyId: string, id: string): Promise<boolean>;
};
