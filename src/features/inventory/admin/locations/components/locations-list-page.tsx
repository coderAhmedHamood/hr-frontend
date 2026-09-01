'use client';

import { SetPageTitle } from '@/components/layouts/set-page-title';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import { PageHeaderPrimaryButton } from '@/components/layouts/page-header-primary-button';
import * as React from 'react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { MapPin, Pencil, Plus, Trash2, Warehouse } from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { getInventoryCompanyId } from '@/features/inventory/lib/company-id';
import { useWarehouses } from '@/features/inventory/admin/warehouses/hooks/use-warehouses';
import { useWarehouseLocations } from '@/features/inventory/admin/locations/hooks/use-warehouse-locations';
import { useWarehouseLocationMutations } from '@/features/inventory/admin/locations/hooks/use-warehouse-location-mutations';
import {
  LOCATION_TYPE_OPTIONS,
  REMOVAL_STRATEGY_OPTIONS,
  WAREHOUSE_LOCATION_FORM_DEFAULT_VALUES,
  warehouseLocationFormSchema,
  type WarehouseLocationFormValues,
} from '@/features/inventory/admin/schemas/warehouse-schemas';
import { inventoryAdminRoutes } from '@/features/inventory/admin/constants/routes';
import type { WarehouseLocation, WarehouseLocationType } from '@/features/inventory/domain/types/warehouse';
import { ListFilterBar } from '@/components/ui/list-filter-bar';
import { EntityFilterSearchField } from '@/components/ui/entity-filter-search-field';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { DirectoryPagedViews, DEFAULT_PAGE_SIZE } from '@/components/ui/paged-list';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  dialogMaxHeightClass,
} from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

const NO_PARENT = '__none__';

const TYPE_LABEL: Record<WarehouseLocationType, string> = {
  supplier: 'المورد',
  view: 'افتراضي',
  internal: 'داخلي',
  customer: 'العميل',
  inventory: 'خسارة المخزون',
  production: 'الإنتاج',
  transit: 'العابر',
};

function toFormValues(location: WarehouseLocation): WarehouseLocationFormValues {
  return {
    nameAr: location.nameAr,
    parentLocationId: location.parentLocationId ?? '',
    locationType: location.locationType ?? 'internal',
    storageCategory: location.storageCategory ?? '',
    barcode: location.barcode ?? '',
    replenish: location.replenish ?? false,
    cycleCountFrequencyDays: location.cycleCountFrequencyDays ?? 0,
    lastCountAt: location.lastCountAt ? location.lastCountAt.slice(0, 10) : '',
    nextCountAt: location.nextCountAt ? location.nextCountAt.slice(0, 10) : '',
    removalStrategy: location.removalStrategy ?? 'fifo',
    isActive: location.isActive,
  };
}

export function LocationsListPage() {
  const companyId = getInventoryCompanyId();
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const warehouseIdFilter = searchParams.get('warehouseId') ?? '';
  const search = searchParams.get('q') ?? '';
  const page = Math.max(1, Number(searchParams.get('page')) || 1);
  const pageSize = Number(searchParams.get('pageSize')) || DEFAULT_PAGE_SIZE;

  const [searchInput, setSearchInput] = React.useState(search);
  const [formWarehouseId, setFormWarehouseId] = React.useState(warehouseIdFilter);
  const [formState, setFormState] = React.useState<{ open: boolean; location: WarehouseLocation | null }>({
    open: false,
    location: null,
  });
  const [toDelete, setToDelete] = React.useState<WarehouseLocation | null>(null);

  function updateParams(next: {
    q?: string;
    warehouseId?: string;
    page?: number;
    pageSize?: number;
  }) {
    const params = new URLSearchParams(searchParams.toString());
    if (next.q !== undefined) {
      if (next.q) params.set('q', next.q);
      else params.delete('q');
    }
    if (next.warehouseId !== undefined) {
      if (next.warehouseId) params.set('warehouseId', next.warehouseId);
      else params.delete('warehouseId');
    }
    if (next.page !== undefined) {
      if (next.page > 1) params.set('page', String(next.page));
      else params.delete('page');
    }
    if (next.pageSize !== undefined) {
      if (next.pageSize !== DEFAULT_PAGE_SIZE) params.set('pageSize', String(next.pageSize));
      else params.delete('pageSize');
    }
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }

  const searchRef = React.useRef(search);
  const updateParamsRef = React.useRef(updateParams);
  searchRef.current = search;
  updateParamsRef.current = updateParams;

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      if (searchInput.trim() !== searchRef.current) {
        updateParamsRef.current({ q: searchInput.trim(), page: 1 });
      }
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const { data: warehousesData } = useWarehouses({ companyId, limit: 200 });
  const warehouses = warehousesData?.items ?? [];
  const warehouseNameById = React.useMemo(
    () => new Map(warehouses.map((warehouse) => [warehouse.id, warehouse.nameAr])),
    [warehouses],
  );

  const resolveWarehouseName = React.useCallback(
    (location: WarehouseLocation) =>
      location.warehouseNameAr?.trim() ||
      warehouseNameById.get(location.warehouseId)?.trim() ||
      '—',
    [warehouseNameById],
  );

  const { data, isLoading, isError } = useWarehouseLocations({
    companyId,
    warehouseId: warehouseIdFilter || undefined,
    search: search || undefined,
    page,
    limit: pageSize,
  });
  const { create, update, remove } = useWarehouseLocationMutations();
  const locations = data?.items ?? [];

  // Parent picker needs a broader location set than the current page.
  const { data: allLocationsData } = useWarehouseLocations({
    companyId,
    warehouseId: formWarehouseId || warehouseIdFilter || undefined,
    page: 1,
    limit: 500,
  });
  const allLocationsForParents = allLocationsData?.items ?? locations;

  const parentOptions = allLocationsForParents.filter(
    (location) =>
      location.id !== formState.location?.id &&
      (!formWarehouseId || location.warehouseId === formWarehouseId),
  );
  const nameById = React.useMemo(
    () => new Map(allLocationsForParents.map((location) => [location.id, location.nameAr])),
    [allLocationsForParents],
  );

  const form = useForm<WarehouseLocationFormValues>({
    resolver: zodResolver(warehouseLocationFormSchema),
    defaultValues: WAREHOUSE_LOCATION_FORM_DEFAULT_VALUES,
  });

  React.useEffect(() => {
    if (!formState.open) return;
    form.reset(formState.location ? toFormValues(formState.location) : WAREHOUSE_LOCATION_FORM_DEFAULT_VALUES);
    setFormWarehouseId(formState.location?.warehouseId ?? warehouseIdFilter);
  }, [formState, form, warehouseIdFilter]);

  usePageHeaderActions(
    () => (
      <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
        <FilterToggleButton />
        {warehouseIdFilter ? (
          <Button
            variant="outline"
            size="sm"
            className="h-8"
            onClick={() => router.push(inventoryAdminRoutes.warehouseDetail(warehouseIdFilter))}
          >
            <Warehouse className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">المستودع</span>
          </Button>
        ) : null}
        <PageHeaderPrimaryButton
          icon={Plus}
          label="إضافة موقع"
          disabled={!companyId || warehouses.length === 0}
          onClick={() => setFormState({ open: true, location: null })}
        >
          إضافة موقع
        </PageHeaderPrimaryButton>
      </div>
    ),
    [warehouseIdFilter, companyId, warehouses.length, router],
  );

  useEntityFilterSlot(
    () => (
      <ListFilterBar
        showDateSection={false}
        showStatusSection={false}
        showEmployeePicker={false}
        leadingFilters={
          <EntityFilterSearchField
            value={searchInput}
            onChange={setSearchInput}
            placeholder="ابحث في المواقع…"
          />
        }
        inlineSelects={[
          {
            id: 'warehouse',
            value: warehouseIdFilter || 'all',
            onChange: (value) => updateParams({ warehouseId: value === 'all' ? '' : value, page: 1 }),
            placeholder: 'كل المستودعات',
            options: [
              { value: 'all', label: 'كل المستودعات' },
              ...warehouses.map((warehouse) => ({ value: warehouse.id, label: warehouse.nameAr })),
            ],
          },
        ]}
      />
    ),
    [searchInput, warehouseIdFilter, warehouses],
  );

  const isSaving = create.isPending || update.isPending;
  const selectedWarehouseName = warehouseIdFilter
    ? warehouseNameById.get(warehouseIdFilter)
    : undefined;
  const selectedType = form.watch('locationType');
  const typeHint = LOCATION_TYPE_OPTIONS.find((option) => option.value === selectedType)?.hint;
  const isSystemLocation = Boolean(formState.location?.isSystem);

  const onSubmit = async (values: WarehouseLocationFormValues) => {
    if (!companyId) return;
    const targetWarehouseId = formState.location?.warehouseId || formWarehouseId;
    if (!targetWarehouseId) return;

    const code =
      formState.location?.code ??
      values.nameAr
        .trim()
        .replace(/\s+/g, '-')
        .slice(0, 32);

    const payload = {
      companyId,
      warehouseId: targetWarehouseId,
      code,
      nameAr: values.nameAr.trim(),
      parentLocationId: values.parentLocationId || null,
      locationType: values.locationType,
      storageCategory: values.storageCategory?.trim() || undefined,
      barcode: values.barcode?.trim() || undefined,
      replenish: values.replenish,
      cycleCountFrequencyDays: values.cycleCountFrequencyDays,
      lastCountAt: values.lastCountAt ? new Date(values.lastCountAt).toISOString() : undefined,
      nextCountAt: values.nextCountAt ? new Date(values.nextCountAt).toISOString() : undefined,
      removalStrategy: values.removalStrategy,
      isActive: values.isActive,
      isSystem: formState.location?.isSystem ?? false,
    };

    if (formState.location) {
      await update.mutateAsync({ companyId, id: formState.location.id, patch: payload });
    } else {
      await create.mutateAsync(payload);
    }
    setFormState({ open: false, location: null });
  };

  const columns: ColumnDef<WarehouseLocation>[] = [
    {
      key: 'location',
      title: 'الموقع',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-medium">{row.nameAr}</span>
          <span className="text-xs text-muted-foreground" dir="ltr">
            {row.code}
          </span>
        </div>
      ),
    },
    {
      key: 'warehouse',
      title: 'المستودع',
      render: (row) => (
        <button
          type="button"
          className="text-sm text-primary hover:underline"
          onClick={() => router.push(inventoryAdminRoutes.warehouseDetail(row.warehouseId))}
        >
          {resolveWarehouseName(row)}
        </button>
      ),
    },
    {
      key: 'parent',
      title: 'الموقع الرئيسي',
      hideOnMobile: true,
      render: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.parentLocationId ? (nameById.get(row.parentLocationId) ?? '—') : '—'}
        </span>
      ),
    },
    {
      key: 'type',
      title: 'النوع',
      render: (row) => <Badge variant="subtle">{TYPE_LABEL[row.locationType] ?? row.locationType}</Badge>,
    },
    {
      key: 'system',
      title: '',
      render: (row) => (row.isSystem ? <Badge variant="outline">تلقائي</Badge> : null),
    },
    {
      key: 'actions',
      title: '',
      isActions: true,
      render: (row) => (
        <>
          <Button
            variant="ghost"
            size="icon"
            aria-label="تعديل الموقع"
            onClick={() => setFormState({ open: true, location: row })}
          >
            <Pencil className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            aria-label="حذف الموقع"
            disabled={Boolean(row.isSystem)}
            onClick={() => setToDelete(row)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-5">
      <SetPageTitle titleAr="المواقع" iconName="MapPin" />

      {isError ? <p className="text-sm text-destructive">تعذر تحميل المواقع.</p> : null}

      <DirectoryPagedViews
        items={locations}
        loading={isLoading}
        serverPagination={
          data
            ? {
                page,
                pageSize,
                total: data.pagination.total,
                totalPages: Math.max(1, Math.ceil(data.pagination.total / pageSize)),
                setPage: (nextPage) => updateParams({ page: nextPage }),
                setPageSize: (size) => updateParams({ pageSize: size, page: 1 }),
              }
            : undefined
        }
      >
        {(rowsPage) => (
          <DataTable
            variant="directory"
            className="inv-table-host"
            columns={columns}
            data={rowsPage}
            keyExtractor={(row) => row.id}
            loading={isLoading}
            emptyText={
              warehouseIdFilter ? 'لا توجد مواقع لهذا المستودع بعد.' : 'لا توجد مواقع بعد. أضف موقعًا أو أنشئ مستودعًا.'
            }
            mobileCard={(row) => (
              <div className="flex flex-col gap-2.5">
                <div className="flex items-start gap-3">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-primary-100 text-primary">
                    <MapPin className="h-[18px] w-[18px]" />
                  </span>
                  <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                    <span className="truncate font-display text-[13.5px] font-bold leading-snug" dir="ltr">
                      {row.code}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {row.nameAr} · {TYPE_LABEL[row.locationType] ?? row.locationType}
                    </span>
                  </div>
                  {row.isSystem ? (
                    <Badge variant="outline" className="shrink-0 text-[10px]">تلقائي</Badge>
                  ) : null}
                </div>

                <button
                  type="button"
                  className="flex items-center gap-1.5 ps-13 text-xs text-primary"
                  onClick={() => router.push(inventoryAdminRoutes.warehouseDetail(row.warehouseId))}
                >
                  <Warehouse className="h-3.5 w-3.5 shrink-0" />
                  <span className="truncate">{resolveWarehouseName(row)}</span>
                </button>

                <div className="flex items-center justify-end gap-1 border-t border-border/60 pt-2">
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="تعديل الموقع"
                    onClick={() => setFormState({ open: true, location: row })}
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    aria-label="حذف الموقع"
                    disabled={Boolean(row.isSystem)}
                    onClick={() => setToDelete(row)}
                  >
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            )}
          />
        )}
      </DirectoryPagedViews>

      <Dialog
        open={formState.open}
        onOpenChange={(open) => setFormState((s) => ({ ...s, open, location: open ? s.location : null }))}
      >
        <DialogContent className={`${dialogMaxHeightClass} max-w-xl overflow-y-auto`}>
          <DialogHeader>
            <DialogTitle>{formState.location ? 'تعديل الموقع' : 'إضافة موقع'}</DialogTitle>
            <DialogDescription>
              عرّف الاسم والموقع الرئيسي ونوع الموقع وخيارات التخزين واللوجستيات.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void form.handleSubmit(onSubmit)(e);
            }}
            className="space-y-5"
          >
            <div className="space-y-1.5">
              <Label htmlFor="loc-warehouse">المستودع</Label>
              <Select
                value={formWarehouseId || undefined}
                onValueChange={setFormWarehouseId}
                disabled={Boolean(formState.location)}
              >
                <SelectTrigger id="loc-warehouse" aria-label="المستودع">
                  <SelectValue placeholder="اختر المستودع" />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((warehouse) => (
                    <SelectItem key={warehouse.id} value={warehouse.id}>
                      {warehouse.nameAr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="loc-name">اسم الموقع</Label>
              <Input
                id="loc-name"
                placeholder="مثال: Shelf 1 / رف 1"
                disabled={isSystemLocation}
                {...form.register('nameAr')}
              />
              {form.formState.errors.nameAr ? (
                <p className="text-xs text-destructive">{form.formState.errors.nameAr.message}</p>
              ) : null}
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="loc-parent">الموقع الرئيسي</Label>
              <Controller
                control={form.control}
                name="parentLocationId"
                render={({ field }) => (
                  <Select
                    value={field.value || NO_PARENT}
                    onValueChange={(value) => field.onChange(value === NO_PARENT ? '' : value)}
                    disabled={isSystemLocation}
                  >
                    <SelectTrigger id="loc-parent" aria-label="الموقع الرئيسي">
                      <SelectValue placeholder="مثال: Aisle 1" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={NO_PARENT}>بدون موقع رئيسي</SelectItem>
                      {parentOptions.map((location) => (
                        <SelectItem key={location.id} value={location.id}>
                          {location.nameAr}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="space-y-3 rounded-xl border border-border p-3">
              <p className="text-sm font-semibold">معلومات إضافية</p>

              <div className="space-y-1.5">
                <Label htmlFor="loc-type">نوع الموقع</Label>
                <Controller
                  control={form.control}
                  name="locationType"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange} disabled={isSystemLocation}>
                      <SelectTrigger id="loc-type" aria-label="نوع الموقع">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {LOCATION_TYPE_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {typeHint ? <p className="text-xs text-muted-foreground">{typeHint}</p> : null}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor="loc-category">فئة التخزين</Label>
                  <Input id="loc-category" placeholder="اختياري" {...form.register('storageCategory')} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="loc-barcode">باركود</Label>
                  <Input id="loc-barcode" dir="ltr" {...form.register('barcode')} />
                </div>
              </div>

              <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
                <div>
                  <p className="text-sm font-medium">تجديد المخزون</p>
                  <p className="text-xs text-muted-foreground">اقتراح إعادة التعبئة لهذا الموقع</p>
                </div>
                <Controller
                  control={form.control}
                  name="replenish"
                  render={({ field }) => (
                    <Switch checked={field.value} onCheckedChange={field.onChange} aria-label="تجديد المخزون" />
                  )}
                />
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-border p-3">
              <p className="text-sm font-semibold">العد الدوري</p>
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="space-y-1.5">
                  <Label htmlFor="loc-freq">تواتر المخزون (أيام)</Label>
                  <Input
                    id="loc-freq"
                    type="number"
                    min={0}
                    dir="ltr"
                    {...form.register('cycleCountFrequencyDays', { valueAsNumber: true })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="loc-last-count">آخر عملية جرد</Label>
                  <Input id="loc-last-count" type="date" dir="ltr" {...form.register('lastCountAt')} />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="loc-next-count">المتوقع التالي</Label>
                  <Input id="loc-next-count" type="date" dir="ltr" {...form.register('nextCountAt')} />
                </div>
              </div>
            </div>

            <div className="space-y-3 rounded-xl border border-border p-3">
              <p className="text-sm font-semibold">اللوجستيات</p>
              <div className="space-y-1.5">
                <Label htmlFor="loc-removal">استراتيجية الإزالة</Label>
                <Controller
                  control={form.control}
                  name="removalStrategy"
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger id="loc-removal" aria-label="استراتيجية الإزالة">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {REMOVAL_STRATEGY_OPTIONS.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
              <p className="text-sm font-medium">مفعّل</p>
              <Controller
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} aria-label="مفعّل" />
                )}
              />
            </div>

            {isSystemLocation ? (
              <p className="text-xs text-muted-foreground">
                موقع تلقائي للمستودع — الاسم والنوع والموقع الرئيسي ثابتة. يمكن تعديل باقي الإعدادات.
              </p>
            ) : null}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setFormState({ open: false, location: null })}
                disabled={isSaving}
              >
                إلغاء
              </Button>
              <Button type="submit" disabled={isSaving || !companyId || !formWarehouseId}>
                {isSaving ? 'جاري الحفظ…' : 'حفظ'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(toDelete)} onOpenChange={(open) => !open && setToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>حذف الموقع؟</DialogTitle>
            <DialogDescription>حذف «{toDelete?.nameAr}».</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setToDelete(null)} disabled={remove.isPending}>
              إلغاء
            </Button>
            <Button
              variant="destructive"
              disabled={!toDelete || remove.isPending}
              onClick={() => {
                if (!toDelete || !companyId) return;
                void remove.mutateAsync({ companyId, id: toDelete.id }).then(() => setToDelete(null));
              }}
            >
              {remove.isPending ? 'جاري الحذف…' : 'حذف'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
