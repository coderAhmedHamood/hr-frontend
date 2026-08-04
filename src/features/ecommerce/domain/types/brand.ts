import type { MediaItem, SeoFields, Slugged, TenantScoped } from '@/features/ecommerce/domain/types/common';

export type Brand = TenantScoped & Slugged & {
  id: string;
  nameAr: string;
  nameEn?: string;
  description?: string;
  logo?: MediaItem;
  websiteUrl?: string;
  seo: SeoFields;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export type BrandListQuery = {
  companyId: string;
  search?: string;
  page?: number;
  limit?: number;
};

export type CreateBrandInput = Omit<Brand, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateBrandInput = Partial<CreateBrandInput>;
