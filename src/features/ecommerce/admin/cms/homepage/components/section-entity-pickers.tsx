'use client';

import * as React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Check, Search, X } from 'lucide-react';
import { getStorefrontCompanyId } from '@/features/ecommerce/storefront/lib/storefront-company';
import {
  listCatalogPickerCategories,
  listCatalogPickerProducts,
  listMediaLibraryImages,
  type CatalogPickerCategory,
  type CatalogPickerProduct,
} from '@/features/ecommerce/admin/cms/homepage/lib/catalog-picker-actions';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { cn } from '@/shared/utils';
import { toast } from 'sonner';
import { uploadsApi } from '@/features/hr/lib/api/uploads';
import { resolveUploadUrl, uploadResponseToStoredPath } from '@/shared/resolve-upload-url';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';

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

/** Lets the admin upload or choose an image instead of typing a URL. */
export function ImagePicker({
  value,
  onChange,
  clearable = true,
}: {
  value: string | null | undefined;
  onChange: (url: string | null) => void;
  clearable?: boolean;
}) {
  const companyId = getStorefrontCompanyId();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [open, setOpen] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const { data = [], isLoading } = useQuery({
    queryKey: ['cms-media-picker', 'images', companyId],
    queryFn: () => listMediaLibraryImages(companyId),
    enabled: Boolean(companyId) && open,
  });

  const previewSrc = value ? resolveUploadUrl(value) : '';

  async function handleFileChange(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !file.type.startsWith('image/')) return;
    setUploading(true);
    try {
      const uploaded = await uploadsApi.upload('image', file);
      onChange(uploadResponseToStoredPath(uploaded));
    } catch (error) {
      handleApiError(error);
      toast.error('تعذر رفع الصورة');
    } finally {
      setUploading(false);
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border border-border p-2">
        {previewSrc ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={previewSrc} alt="" className="h-14 w-24 shrink-0 rounded-lg object-cover" />
        ) : (
          <span className="flex h-14 w-24 shrink-0 items-center justify-center rounded-lg bg-muted text-[10px] text-muted-foreground">
            بلا صورة
          </span>
        )}
        <div className="flex flex-wrap gap-2">
          <Button
            type="button"
            size="sm"
            variant="outline"
            disabled={uploading}
            onClick={() => fileInputRef.current?.click()}
          >
            {uploading ? 'جاري الرفع…' : 'رفع صورة'}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => setOpen((prev) => !prev)}>
            اختيار من الصور
          </Button>
          {clearable && value ? (
            <Button type="button" size="sm" variant="ghost" onClick={() => onChange(null)}>
              إزالة
            </Button>
          ) : null}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => void handleFileChange(e)}
        />
      </div>

      {open ? (
        <div className="space-y-2 rounded-xl border border-border p-3">
          <div className="flex items-center justify-between">
            <Label className="text-xs font-medium">مكتبة الصور</Label>
            <Button type="button" size="icon" variant="ghost" className="h-7 w-7" onClick={() => setOpen(false)}>
              <X className="h-3.5 w-3.5" />
            </Button>
          </div>
          {isLoading ? (
            <p className="px-2 py-3 text-xs text-muted-foreground">جاري التحميل…</p>
          ) : data.length === 0 ? (
            <p className="px-2 py-3 text-xs text-muted-foreground">
              لا تتوفر صور في المكتبة — استخدم «رفع صورة» لإضافة صورة الآن.
            </p>
          ) : (
            <div className="grid max-h-64 grid-cols-2 gap-2 overflow-y-auto sm:grid-cols-4">
              {data.map((image) => (
                <button
                  key={image.id}
                  type="button"
                  onClick={() => {
                    onChange(image.url);
                    setOpen(false);
                  }}
                  className={cn(
                    'relative overflow-hidden rounded-lg border-2 transition-colors',
                    image.url === value ? 'border-primary' : 'border-transparent hover:border-primary/40',
                  )}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={image.url} alt={image.alt ?? ''} className="aspect-square w-full object-cover" />
                  {image.url === value ? (
                    <span className="absolute inset-0 flex items-center justify-center bg-primary/20">
                      <Check className="h-4 w-4 text-primary" />
                    </span>
                  ) : null}
                </button>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </div>
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
