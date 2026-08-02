'use client';

import * as React from 'react';
import { PRODUCT_STATUS_OPTIONS } from '@/features/ecommerce/domain/constants/product-status';
import { STOCK_STATUS_OPTIONS } from '@/features/ecommerce/domain/constants/stock-status';
import type { Category } from '@/features/ecommerce/domain/types/category';
import type { Brand } from '@/features/ecommerce/domain/types/brand';
import type { ProductListQuery } from '@/features/ecommerce/domain/types/product';
import {
  categoryFilterLabel,
  sortCategoriesAsTree,
} from '@/features/ecommerce/admin/categories/lib/category-tree';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '@/components/ui/select';

const ALL_VALUE = '__all__';

export type ProductFilters = Pick<ProductListQuery, 'categoryId' | 'brandId' | 'status' | 'stockStatus' | 'sort' | 'sortDirection'>;

const SORT_OPTIONS: { value: NonNullable<ProductListQuery['sort']>; labelAr: string }[] = [
  { value: 'name', labelAr: 'الاسم' },
  { value: 'price', labelAr: 'السعر' },
  { value: 'stock', labelAr: 'الكمية' },
  { value: 'createdAt', labelAr: 'تاريخ الإضافة' },
  { value: 'updatedAt', labelAr: 'آخر تحديث' },
];

function FilterSelect({
  ariaLabel,
  placeholder,
  value,
  onChange,
  options,
}: {
  ariaLabel: string;
  placeholder: string;
  value: string | undefined;
  onChange: (value: string | undefined) => void;
  options: { value: string; labelAr: string }[];
}) {
  return (
    <Select value={value ?? ALL_VALUE} onValueChange={(next) => onChange(next === ALL_VALUE ? undefined : next)}>
      <SelectTrigger aria-label={ariaLabel} className="w-full sm:w-auto">
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_VALUE}>{placeholder}</SelectItem>
        {options.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.labelAr}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

type Props = {
  filters: ProductFilters;
  onChange: (next: Partial<ProductFilters>) => void;
  categories: Category[] | undefined;
  brands: Brand[] | undefined;
};

export function ProductFiltersBar({ filters, onChange, categories, brands }: Props) {
  const byId = React.useMemo(
    () => new Map((categories ?? []).map((category) => [category.id, category])),
    [categories],
  );
  const categoryOptions = React.useMemo(() => {
    const ordered = sortCategoriesAsTree(categories ?? []);
    return ordered.map((category) => ({
      value: category.id,
      labelAr: categoryFilterLabel(category, byId),
    }));
  }, [categories, byId]);

  return (
    <div className="flex flex-wrap gap-2">
      <FilterSelect
        ariaLabel="التصنيف"
        placeholder="كل التصنيفات"
        value={filters.categoryId}
        onChange={(value) => onChange({ categoryId: value })}
        options={categoryOptions}
      />
      <FilterSelect
        ariaLabel="العلامة التجارية"
        placeholder="كل العلامات التجارية"
        value={filters.brandId}
        onChange={(value) => onChange({ brandId: value })}
        options={(brands ?? []).map((brand) => ({ value: brand.id, labelAr: brand.nameAr }))}
      />
      <FilterSelect
        ariaLabel="الحالة"
        placeholder="كل الحالات"
        value={filters.status}
        onChange={(value) => onChange({ status: value as ProductFilters['status'] })}
        options={PRODUCT_STATUS_OPTIONS}
      />
      <FilterSelect
        ariaLabel="حالة التوفر"
        placeholder="كل حالات التوفر"
        value={filters.stockStatus}
        onChange={(value) => onChange({ stockStatus: value as ProductFilters['stockStatus'] })}
        options={STOCK_STATUS_OPTIONS}
      />
      <FilterSelect
        ariaLabel="الترتيب حسب"
        placeholder="الترتيب الافتراضي"
        value={filters.sort}
        onChange={(value) => onChange({ sort: value as ProductFilters['sort'], sortDirection: filters.sortDirection ?? 'asc' })}
        options={SORT_OPTIONS}
      />
    </div>
  );
}
