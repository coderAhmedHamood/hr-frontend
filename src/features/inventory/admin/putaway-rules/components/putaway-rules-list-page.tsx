'use client';

import { SetPageTitle } from '@/components/layouts/set-page-title';
import * as React from 'react';
import { useSearchParams } from 'next/navigation';
import { Plus } from 'lucide-react';
import { getInventoryCompanyId } from '@/features/inventory/lib/company-id';
import { useCategories } from '@/features/ecommerce/admin/categories/hooks/use-categories';
import { useProducts } from '@/features/ecommerce/admin/products/hooks/use-products';
import { useWarehouses } from '@/features/inventory/admin/warehouses/hooks/use-warehouses';
import {
  usePutawayLocationOptions,
  usePutawayRuleMutations,
  usePutawayRules,
} from '@/features/inventory/admin/putaway-rules/hooks/use-putaway-rules';
import { PACKAGING_TYPE_OPTIONS } from '@/features/ecommerce/admin/products/schemas/product-schema';
import type { PackagingType } from '@/features/ecommerce/domain/types/product';
import type { PutawayAppliesTo } from '@/features/inventory/domain/types/putaway-rule';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  dialogShellBodyClass,
  dialogShellContentClass,
  dialogShellHeaderClass,
} from '@/components/ui/dialog';
import { cn } from '@/shared/utils';

const NONE = '__none__';
const ALL_WAREHOUSES = '__all__';

type Draft = {
  warehouseId: string;
  arriveLocationId: string;
  appliesTo: PutawayAppliesTo;
  productId: string;
  categoryId: string;
  packagingType: PackagingType | '';
  storeLocationId: string;
  subLocationId: string;
  sequence: number;
};

const EMPTY: Draft = {
  warehouseId: '',
  arriveLocationId: '',
  appliesTo: 'all',
  productId: '',
  categoryId: '',
  packagingType: '',
  storeLocationId: '',
  subLocationId: '',
  sequence: 10,
};

const APPLIES_LABEL: Record<PutawayAppliesTo, string> = {
  all: 'كافة المنتجات',
  product: 'منتج محدد',
  category: 'فئة منتجات',
};

/** Arrival: supplier counterpart or internal receiving/stock. */
function isArriveLocation(type: string) {
  return type === 'supplier' || type === 'internal';
}

/** Destination: physical stock only. */
function isStoreLocation(type: string) {
  return type === 'internal';
}

export function PutawayRulesListPage() {
  const companyId = getInventoryCompanyId();
  const searchParams = useSearchParams();
  const categoryIdFilter = searchParams.get('categoryId') ?? '';
  const productIdFilter = searchParams.get('productId') ?? '';
  const warehouseIdFilter = searchParams.get('warehouseId') ?? '';

  const [search, setSearch] = React.useState('');
  const [warehouseFilter, setWarehouseFilter] = React.useState(warehouseIdFilter);
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<Draft>(() => ({
    ...EMPTY,
    warehouseId: warehouseIdFilter,
    categoryId: categoryIdFilter,
    productId: productIdFilter,
    appliesTo: productIdFilter ? 'product' : categoryIdFilter ? 'category' : 'all',
  }));

  React.useEffect(() => {
    setWarehouseFilter(warehouseIdFilter);
  }, [warehouseIdFilter]);

  React.useEffect(() => {
    setDraft((prev) => ({
      ...prev,
      warehouseId: warehouseIdFilter || prev.warehouseId,
      categoryId: categoryIdFilter || prev.categoryId,
      productId: productIdFilter || prev.productId,
      appliesTo: productIdFilter
        ? 'product'
        : categoryIdFilter
          ? 'category'
          : prev.appliesTo,
    }));
  }, [categoryIdFilter, productIdFilter, warehouseIdFilter]);

  const { data, isLoading } = usePutawayRules({
    companyId,
    categoryId: categoryIdFilter || undefined,
    productId: productIdFilter || undefined,
    warehouseId: warehouseFilter || undefined,
    limit: 200,
  });
  const { data: locations = [] } = usePutawayLocationOptions(companyId);
  const { data: productsData } = useProducts({ companyId, limit: 200 });
  const { data: categoriesData } = useCategories({ companyId, limit: 200 });
  const { data: warehousesData } = useWarehouses({ companyId, limit: 200 });
  const { create, remove } = usePutawayRuleMutations(companyId);

  const products = productsData?.items ?? [];
  const categories = categoriesData?.items ?? [];
  const warehouses = warehousesData?.items ?? [];

  const locationLabel = (id: string) => {
    const found = locations.find((item) => item.id === id);
    return found ? `${found.warehouseNameAr} / ${found.nameAr}` : '—';
  };

  const productLabel = (id?: string | null) =>
    id ? products.find((p) => p.id === id)?.nameAr ?? id : '—';
  const categoryLabel = (id?: string | null) =>
    id ? categories.find((c) => c.id === id)?.nameAr ?? id : '—';
  const packagingLabel = (value?: PackagingType | null) =>
    value ? PACKAGING_TYPE_OPTIONS.find((o) => o.value === value)?.labelAr ?? value : 'أي طرد';

  const draftWarehouseId =
    draft.warehouseId ||
    locations.find((item) => item.id === draft.arriveLocationId)?.warehouseId ||
    '';

  const arriveOptions = locations.filter(
    (loc) =>
      isArriveLocation(loc.locationType) &&
      (!draftWarehouseId || loc.warehouseId === draftWarehouseId),
  );
  const storeOptions = locations.filter(
    (loc) =>
      isStoreLocation(loc.locationType) &&
      (!draftWarehouseId || loc.warehouseId === draftWarehouseId),
  );
  const subOptions = locations.filter(
    (loc) =>
      isStoreLocation(loc.locationType) &&
      loc.parentLocationId === draft.storeLocationId &&
      loc.id !== draft.storeLocationId,
  );

  const filtered = (data?.items ?? []).filter((rule) => {
    if (!search.trim()) return true;
    const hay = [
      productLabel(rule.productId),
      categoryLabel(rule.categoryId),
      locationLabel(rule.arriveLocationId),
      locationLabel(rule.storeLocationId),
      packagingLabel(rule.packagingType),
      APPLIES_LABEL[rule.appliesTo],
    ]
      .join(' ')
      .toLowerCase();
    return hay.includes(search.trim().toLowerCase());
  });

  const canSave =
    Boolean(draft.arriveLocationId) &&
    Boolean(draft.storeLocationId) &&
    (draft.appliesTo === 'all' ||
      (draft.appliesTo === 'product' && draft.productId) ||
      (draft.appliesTo === 'category' && draft.categoryId));

  async function onCreate() {
    if (!canSave) return;
    const arrive = locations.find((item) => item.id === draft.arriveLocationId);
    if (!arrive) return;

    await create.mutateAsync({
      companyId,
      warehouseId: arrive.warehouseId,
      arriveLocationId: draft.arriveLocationId,
      appliesTo: draft.appliesTo,
      productId: draft.appliesTo === 'product' ? draft.productId : null,
      categoryId: draft.appliesTo === 'category' ? draft.categoryId : null,
      packagingType: draft.packagingType || null,
      storeLocationId: draft.storeLocationId,
      subLocationId: draft.subLocationId || null,
      sequence: draft.sequence || 10,
      isActive: true,
    });

    setDraft({
      ...EMPTY,
      warehouseId: warehouseFilter,
      categoryId: categoryIdFilter,
      productId: productIdFilter,
      appliesTo: productIdFilter ? 'product' : categoryIdFilter ? 'category' : 'all',
    });
    setOpen(false);
  }

  function openCreate() {
    setDraft({
      ...EMPTY,
      warehouseId: warehouseFilter,
      categoryId: categoryIdFilter,
      productId: productIdFilter,
      appliesTo: productIdFilter ? 'product' : categoryIdFilter ? 'category' : 'all',
    });
    setOpen(true);
  }

  function appliesDisplay(rule: (typeof filtered)[number]) {
    if (rule.appliesTo === 'product') return productLabel(rule.productId);
    if (rule.appliesTo === 'category') return categoryLabel(rule.categoryId);
    return 'كافة المنتجات';
  }

  return (
    <div className="flex flex-col gap-5">
      <SetPageTitle titleAr="قواعد التخزين" iconName="MapPinned" />

      <div className="flex flex-wrap items-center gap-2">
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="بحث…"
          className="max-w-md"
        />
        <Select
          value={warehouseFilter || ALL_WAREHOUSES}
          onValueChange={(value) => setWarehouseFilter(value === ALL_WAREHOUSES ? '' : value)}
        >
          <SelectTrigger className="w-full sm:w-56" aria-label="تصفية بالمستودع">
            <SelectValue placeholder="كل المستودعات" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value={ALL_WAREHOUSES}>كل المستودعات</SelectItem>
            {warehouses.map((warehouse) => (
              <SelectItem key={warehouse.id} value={warehouse.id}>
                {warehouse.nameAr}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {(productIdFilter || categoryIdFilter) && (
          <span className="text-xs text-muted-foreground">
            {productIdFilter
              ? `مصفّى حسب المنتج: ${productLabel(productIdFilter)}`
              : `مصفّى حسب الفئة: ${categoryLabel(categoryIdFilter)}`}
          </span>
        )}
        <Button type="button" className="ms-auto" onClick={openCreate}>
          <Plus className="me-1 h-4 w-4" />
          جديد
        </Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border bg-card">
        <table className="w-full min-w-[960px] text-sm">
          <thead className="border-b border-border bg-muted/40 text-muted-foreground">
            <tr>
              <th className="px-3 py-2.5 text-start font-medium">عندما يصل المنتج</th>
              <th className="px-3 py-2.5 text-start font-medium">ينطبق على</th>
              <th className="px-3 py-2.5 text-start font-medium">نوع الطرد</th>
              <th className="px-3 py-2.5 text-start font-medium">التخزين في</th>
              <th className="px-3 py-2.5 text-start font-medium">الموقع الفرعي</th>
              <th className="px-3 py-2.5 text-start font-medium">الأولوية</th>
              <th className="px-3 py-2.5" />
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td colSpan={7} className="px-3 py-8 text-muted-foreground">
                  جاري التحميل…
                </td>
              </tr>
            ) : null}
            {filtered.map((rule) => (
              <tr key={rule.id} className="border-b border-border last:border-0 hover:bg-muted/20">
                <td className="px-3 py-2.5">{locationLabel(rule.arriveLocationId)}</td>
                <td className="px-3 py-2.5">
                  <div className="flex flex-col">
                    <span className="text-xs text-muted-foreground">{APPLIES_LABEL[rule.appliesTo]}</span>
                    <span>{appliesDisplay(rule)}</span>
                  </div>
                </td>
                <td className="px-3 py-2.5">{packagingLabel(rule.packagingType)}</td>
                <td className="px-3 py-2.5">{locationLabel(rule.storeLocationId)}</td>
                <td className="px-3 py-2.5">
                  {rule.subLocationId ? locationLabel(rule.subLocationId) : '—'}
                </td>
                <td className="px-3 py-2.5 tabular-nums">{rule.sequence ?? 10}</td>
                <td className="px-3 py-2.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="ghost"
                    className="text-destructive"
                    onClick={() => void remove.mutateAsync(rule.id)}
                  >
                    حذف
                  </Button>
                </td>
              </tr>
            ))}
            {!isLoading && filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-3 py-10 text-center text-muted-foreground">
                  لا توجد قواعد. أضف قاعدة افتراضية (كافة المنتجات → WH/Stock) لكل مستودع.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className={cn(dialogShellContentClass, 'max-w-xl sm:max-w-xl')}>
          <div className={dialogShellHeaderClass}>
            <DialogTitle className="text-base font-semibold">قاعدة تخزين جديدة</DialogTitle>
          </div>
          <div className={cn(dialogShellBodyClass, 'space-y-4')}>
            <p className="text-xs text-muted-foreground">
              المنطق: وصول من المورد/المخزون → تخزين في موقع داخلي (وموقع فرعي اختياري تحتّه).
            </p>

            <div className="space-y-1.5">
              <Label>المستودع</Label>
              <Select
                value={draft.warehouseId || NONE}
                onValueChange={(value) =>
                  setDraft((prev) => ({
                    ...prev,
                    warehouseId: value === NONE ? '' : value,
                    arriveLocationId: '',
                    storeLocationId: '',
                    subLocationId: '',
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="اختر المستودع" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>—</SelectItem>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.nameAr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label>عندما يصل المنتج</Label>
              <Select
                value={draft.arriveLocationId || undefined}
                onValueChange={(value) => {
                  const loc = locations.find((item) => item.id === value);
                  setDraft((prev) => ({
                    ...prev,
                    arriveLocationId: value,
                    warehouseId: loc?.warehouseId ?? prev.warehouseId,
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="المورد أو موقع الاستلام" />
                </SelectTrigger>
                <SelectContent>
                  {arriveOptions.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.nameAr} ({loc.code})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 rounded-xl border border-border p-3">
              <p className="text-sm font-semibold">ينطبق على</p>
              <Select
                value={draft.appliesTo}
                onValueChange={(value) =>
                  setDraft((prev) => ({
                    ...prev,
                    appliesTo: value as PutawayAppliesTo,
                    productId: value === 'product' ? prev.productId : '',
                    categoryId: value === 'category' ? prev.categoryId : '',
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">كافة المنتجات (افتراضي المستودع)</SelectItem>
                  <SelectItem value="category">فئة منتجات</SelectItem>
                  <SelectItem value="product">منتج محدد</SelectItem>
                </SelectContent>
              </Select>

              {draft.appliesTo === 'product' ? (
                <Select
                  value={draft.productId || undefined}
                  onValueChange={(value) => setDraft((prev) => ({ ...prev, productId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر المنتج" />
                  </SelectTrigger>
                  <SelectContent>
                    {products.map((product) => (
                      <SelectItem key={product.id} value={product.id}>
                        {product.nameAr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}

              {draft.appliesTo === 'category' ? (
                <Select
                  value={draft.categoryId || undefined}
                  onValueChange={(value) => setDraft((prev) => ({ ...prev, categoryId: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختر الفئة" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.nameAr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label>نوع الطرد (اختياري)</Label>
              <Select
                value={draft.packagingType || NONE}
                onValueChange={(value) =>
                  setDraft((prev) => ({
                    ...prev,
                    packagingType: value === NONE ? '' : (value as PackagingType),
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="أي طرد" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE}>أي طرد</SelectItem>
                  {PACKAGING_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.labelAr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 rounded-xl border border-border p-3">
              <p className="text-sm font-semibold">الوجهة</p>
              <div className="space-y-1.5">
                <Label>التخزين في</Label>
                <Select
                  value={draft.storeLocationId || undefined}
                  onValueChange={(value) =>
                    setDraft((prev) => ({ ...prev, storeLocationId: value, subLocationId: '' }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="موقع داخلي مثل WH/Stock" />
                  </SelectTrigger>
                  <SelectContent>
                    {storeOptions.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.nameAr} ({loc.code})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>الموقع الفرعي</Label>
                <Select
                  value={draft.subLocationId || NONE}
                  onValueChange={(value) =>
                    setDraft((prev) => ({ ...prev, subLocationId: value === NONE ? '' : value }))
                  }
                  disabled={!draft.storeLocationId}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="اختياري — رف/ممر تحت الموقع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>بدون (التخزين في الموقع أعلاه)</SelectItem>
                    {subOptions.map((loc) => (
                      <SelectItem key={loc.id} value={loc.id}>
                        {loc.nameAr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {draft.storeLocationId && subOptions.length === 0 ? (
                  <p className="text-xs text-muted-foreground">
                    لا توجد مواقع فرعية تحت هذا الموقع. أضف رفّاً تحت WH/Stock من صفحة المواقع.
                  </p>
                ) : null}
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="putaway-seq">الأولوية (رقم أصغر = أعلى)</Label>
              <Input
                id="putaway-seq"
                type="number"
                min={1}
                dir="ltr"
                className="max-w-[8rem]"
                value={draft.sequence}
                onChange={(event) =>
                  setDraft((prev) => ({ ...prev, sequence: Number(event.target.value) || 10 }))
                }
              />
            </div>
          </div>
          <DialogFooter className="shrink-0 gap-2 border-t border-border px-6 py-4 sm:justify-start">
            <Button type="button" disabled={create.isPending || !canSave} onClick={() => void onCreate()}>
              حفظ
            </Button>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
