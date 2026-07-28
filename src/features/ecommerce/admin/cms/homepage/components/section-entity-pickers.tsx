'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, Search, X } from 'lucide-react';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import {
  listCatalogPickerCategories,
  listCatalogPickerProducts,
  type CatalogPickerCategory,
  type CatalogPickerProduct,
} from '@/features/ecommerce/admin/cms/homepage/lib/catalog-picker-actions';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/shared/utils';

function matchesSearch(haystack: string, query: string): boolean {
  return haystack.toLowerCase().includes(query.trim().toLowerCase());
}

export function CategorySinglePicker({
  value,
  onChange,
  placeholder = 'اختر تصنيفًا…',
}: {
  value: string | null | undefined;
  onChange: (categoryId: string | null) => void;
  placeholder?: string;
}) {
  const companyId = getStorefrontCompanyId();
  const [search, setSearch] = React.useState('');
  const { data = [], isLoading } = useQuery({
    queryKey: ['cms-catalog-picker', 'categories', companyId],
    queryFn: () => listCatalogPickerCategories(companyId),
    enabled: Boolean(companyId),
  });

  const selected = data.find((item) => item.id === value) ?? null;
  const filtered = data.filter(
    (item) =>
      !search.trim() ||
      matchesSearch(item.nameAr, search) ||
      matchesSearch(item.slug, search) ||
      matchesSearch(item.nameEn ?? '', search),
  );

  return (
    <div className="space-y-2">
      {selected ? (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-primary/30 bg-primary/5 px-3 py-2">
          <div className="min-w-0">
            <p className="truncate text-sm font-medium">{selected.nameAr}</p>
            <p className="truncate text-[11px] text-muted-foreground" dir="ltr">
              {selected.slug}
            </p>
          </div>
          <Button type="button" size="icon" variant="ghost" className="h-8 w-8" onClick={() => onChange(null)}>
            <X className="h-3.5 w-3.5" />
          </Button>
        </div>
      ) : null}

      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder={placeholder}
          className="h-10 ps-9"
        />
      </div>

      <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-border p-1">
        {isLoading ? (
          <p className="px-2 py-3 text-xs text-muted-foreground">جاري التحميل…</p>
        ) : filtered.length === 0 ? (
          <p className="px-2 py-3 text-xs text-muted-foreground">لا توجد تصنيفات مطابقة.</p>
        ) : (
          filtered.map((item) => (
            <CategoryOptionRow
              key={item.id}
              item={item}
              selected={item.id === value}
              onSelect={() => onChange(item.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function CategoryOptionRow({
  item,
  selected,
  onSelect,
}: {
  item: CatalogPickerCategory;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-2 rounded-lg px-2 py-2 text-start transition-colors',
        selected ? 'bg-primary/10 text-primary' : 'hover:bg-muted/60',
      )}
    >
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{item.nameAr}</span>
        <span className="block truncate text-[11px] text-muted-foreground" dir="ltr">
          {item.slug}
        </span>
      </span>
      {selected ? <Check className="h-3.5 w-3.5 shrink-0" /> : null}
    </button>
  );
}

export function CategoryMultiPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const companyId = getStorefrontCompanyId();
  const [search, setSearch] = React.useState('');
  const { data = [], isLoading } = useQuery({
    queryKey: ['cms-catalog-picker', 'categories', companyId],
    queryFn: () => listCatalogPickerCategories(companyId),
    enabled: Boolean(companyId),
  });

  const selectedSet = new Set(value);
  const filtered = data.filter(
    (item) =>
      !search.trim() ||
      matchesSearch(item.nameAr, search) ||
      matchesSearch(item.slug, search),
  );

  function toggle(id: string) {
    if (selectedSet.has(id)) onChange(value.filter((item) => item !== id));
    else onChange([...value, id]);
  }

  return (
    <div className="space-y-2">
      {value.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {value.map((id) => {
            const item = data.find((row) => row.id === id);
            return (
              <Badge key={id} variant="secondary" className="gap-1 pe-1">
                {item?.nameAr ?? id.slice(0, 8)}
                <button type="button" className="rounded-full p-0.5 hover:bg-muted" onClick={() => toggle(id)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      ) : null}

      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="ابحث عن تصنيفات…"
          className="h-10 ps-9"
        />
      </div>

      <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-border p-1">
        {isLoading ? (
          <p className="px-2 py-3 text-xs text-muted-foreground">جاري التحميل…</p>
        ) : (
          filtered.map((item) => (
            <CategoryOptionRow
              key={item.id}
              item={item}
              selected={selectedSet.has(item.id)}
              onSelect={() => toggle(item.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

export function ProductMultiPicker({
  value,
  onChange,
}: {
  value: string[];
  onChange: (ids: string[]) => void;
}) {
  const companyId = getStorefrontCompanyId();
  const [search, setSearch] = React.useState('');
  const { data = [], isLoading } = useQuery({
    queryKey: ['cms-catalog-picker', 'products', companyId],
    queryFn: () => listCatalogPickerProducts(companyId),
    enabled: Boolean(companyId),
  });

  const selectedSet = new Set(value);
  const filtered = data.filter(
    (item) =>
      !search.trim() ||
      matchesSearch(item.nameAr, search) ||
      matchesSearch(item.sku, search) ||
      matchesSearch(item.nameEn ?? '', search),
  );

  function toggle(id: string) {
    if (selectedSet.has(id)) onChange(value.filter((item) => item !== id));
    else onChange([...value, id]);
  }

  return (
    <div className="space-y-2">
      {value.length > 0 ? (
        <div className="flex flex-wrap gap-1.5">
          {value.map((id) => {
            const item = data.find((row) => row.id === id);
            return (
              <Badge key={id} variant="secondary" className="gap-1 pe-1">
                {item?.nameAr ?? id.slice(0, 8)}
                <button type="button" className="rounded-full p-0.5 hover:bg-muted" onClick={() => toggle(id)}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            );
          })}
        </div>
      ) : (
        <p className="text-[11px] text-muted-foreground">اختر منتجاتًا لعرضها في هذا السكشن.</p>
      )}

      <div className="relative">
        <Search className="pointer-events-none absolute start-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="ابحث بالاسم أو SKU…"
          className="h-10 ps-9"
        />
      </div>

      <div className="max-h-56 space-y-1 overflow-y-auto rounded-xl border border-border p-1">
        {isLoading ? (
          <p className="px-2 py-3 text-xs text-muted-foreground">جاري التحميل…</p>
        ) : filtered.length === 0 ? (
          <p className="px-2 py-3 text-xs text-muted-foreground">لا توجد منتجات مطابقة.</p>
        ) : (
          filtered.map((item) => (
            <ProductOptionRow
              key={item.id}
              item={item}
              selected={selectedSet.has(item.id)}
              onSelect={() => toggle(item.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

function ProductOptionRow({
  item,
  selected,
  onSelect,
}: {
  item: CatalogPickerProduct;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      className={cn(
        'flex w-full items-center gap-2 rounded-lg px-2 py-2 text-start transition-colors',
        selected ? 'bg-primary/10 text-primary' : 'hover:bg-muted/60',
      )}
    >
      {item.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.imageUrl} alt="" className="h-9 w-9 shrink-0 rounded-lg object-cover" />
      ) : (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-muted text-[10px] text-muted-foreground">
          img
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium">{item.nameAr}</span>
        <span className="block truncate text-[11px] text-muted-foreground" dir="ltr">
          {item.sku} · {item.priceAmount} {item.priceCurrency}
        </span>
      </span>
      {selected ? <Check className="h-3.5 w-3.5 shrink-0" /> : null}
    </button>
  );
}

const KNOWN_TAGS = ['best-seller', 'deals', 'wholesale', 'skincare', 'tools'] as const;

export function TagPicker({
  value,
  onChange,
  allowClear = false,
}: {
  value: string;
  onChange: (tag: string) => void;
  allowClear?: boolean;
}) {
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-1.5">
        {KNOWN_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() => onChange(tag)}
            className={cn(
              'rounded-full border px-2.5 py-1 text-xs transition-colors',
              value === tag
                ? 'border-primary bg-primary/10 font-medium text-primary'
                : 'border-border text-muted-foreground hover:border-primary/40',
            )}
          >
            {tag}
          </button>
        ))}
        {allowClear && value ? (
          <button
            type="button"
            onClick={() => onChange('')}
            className="rounded-full border border-border px-2.5 py-1 text-xs text-muted-foreground"
          >
            مسح
          </button>
        ) : null}
      </div>
      <Input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="أو اكتب وسمًا مخصصًا"
        dir="ltr"
        className="h-10"
      />
    </div>
  );
}
