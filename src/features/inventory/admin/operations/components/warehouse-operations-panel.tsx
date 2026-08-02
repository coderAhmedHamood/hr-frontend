'use client';

import * as React from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Plus, Trash2 } from 'lucide-react';
import { getInventoryCompanyId } from '@/features/inventory/lib/company-id';
import { useWarehouseLocations } from '@/features/inventory/admin/locations/hooks/use-warehouse-locations';
import { useWarehouseOperations } from '@/features/inventory/admin/operations/hooks/use-warehouse-operations';
import { useWarehouseOperationMutations } from '@/features/inventory/admin/operations/hooks/use-warehouse-operation-mutations';
import { WarehouseOperationDetailDialog } from '@/features/inventory/admin/operations/components/warehouse-operation-detail-dialog';
import {
  WAREHOUSE_OPERATION_FORM_DEFAULT_VALUES,
  warehouseOperationFormSchema,
  type WarehouseOperationFormValues,
} from '@/features/inventory/admin/schemas/warehouse-schemas';
import { WAREHOUSE_OPERATION_KIND_META } from '@/features/inventory/domain/constants/warehouse-operation-kinds';
import { WAREHOUSE_OPERATION_STATUS_LABELS_AR } from '@/features/inventory/domain/constants/warehouse-operation-status';
import type {
  WarehouseOperation,
  WarehouseOperationKind,
  WarehouseOperationStatus,
} from '@/features/inventory/domain/types/warehouse';
import { useWarehouses } from '@/features/inventory/admin/warehouses/hooks/use-warehouses';
import { useProducts } from '@/features/ecommerce/admin/products/hooks/use-products';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ListToolbar } from '@/components/ui/list-toolbar';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  dialogMaxHeightClass,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

function statusBadgeVariant(
  status: WarehouseOperationStatus,
): 'subtle' | 'warning' | 'success' | 'destructive' {
  if (status === 'ready') return 'warning';
  if (status === 'done') return 'success';
  if (status === 'cancelled') return 'destructive';
  return 'subtle';
}

type Props = {
  /** عند الحذف: قائمة على مستوى المخزون (كل المستودعات) مع اختيار المستودع عند الإنشاء */
  warehouseId?: string;
  kind: WarehouseOperationKind;
  /** فلاتر المستودع/الحالة لصفحات المخزون المستقلة */
  enableInventoryFilters?: boolean;
};

export function WarehouseOperationsPanel({ warehouseId, kind, enableInventoryFilters = false }: Props) {
  const meta = WAREHOUSE_OPERATION_KIND_META[kind];
  const isCountLike = kind === 'physical_count' || kind === 'adjustment';
  const scopedToWarehouse = Boolean(warehouseId);
  const showFilters = enableInventoryFilters || !scopedToWarehouse;
  const companyId = getInventoryCompanyId();
  const [searchInput, setSearchInput] = React.useState('');
  const [search, setSearch] = React.useState('');
  const [filterWarehouseId, setFilterWarehouseId] = React.useState<string>('all');
  const [filterStatus, setFilterStatus] = React.useState<WarehouseOperationStatus | 'all'>('all');
  const [open, setOpen] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [toDelete, setToDelete] = React.useState<WarehouseOperation | null>(null);

  React.useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput.trim()), 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  const listWarehouseId = scopedToWarehouse
    ? warehouseId
    : filterWarehouseId !== 'all'
      ? filterWarehouseId
      : undefined;

  const { data, isLoading, isError } = useWarehouseOperations({
    companyId,
    warehouseId: listWarehouseId,
    kind,
    status: filterStatus !== 'all' ? filterStatus : undefined,
    search: search || undefined,
    page: 1,
    limit: 100,
  });
  const { data: warehousesData } = useWarehouses({ companyId, limit: 100 });
  const allWarehouses = warehousesData?.items ?? [];
  const { data: productsData } = useProducts({ companyId, limit: 200, status: 'active' });
  const catalogProducts = productsData?.items ?? [];

  const form = useForm<WarehouseOperationFormValues>({
    resolver: zodResolver(warehouseOperationFormSchema),
    defaultValues: WAREHOUSE_OPERATION_FORM_DEFAULT_VALUES,
  });
  const destinationWarehouseId = form.watch('destinationWarehouseId');
  const formWarehouseId = form.watch('sourceWarehouseId');
  const effectiveWarehouseId = warehouseId || formWarehouseId || '';

  const warehousesForDest = allWarehouses.filter((item) => item.id !== effectiveWarehouseId);

  const { data: locationsData } = useWarehouseLocations({
    companyId,
    warehouseId: scopedToWarehouse ? warehouseId : effectiveWarehouseId || undefined,
    page: 1,
    limit: 200,
  });
  const locations = locationsData?.items ?? [];

  const { data: allLocationsData } = useWarehouseLocations({
    companyId: scopedToWarehouse ? '' : companyId,
    page: 1,
    limit: 500,
  });

  const { data: destLocationsData } = useWarehouseLocations({
    companyId,
    warehouseId: destinationWarehouseId || undefined,
    page: 1,
    limit: 200,
  });
  const destLocations = destLocationsData?.items ?? [];
  const toLocations = meta.needsDestWarehouse ? destLocations : locations;

  const locationNameById = React.useMemo(() => {
    const source = scopedToWarehouse
      ? [...locations, ...destLocations]
      : (allLocationsData?.items ?? []);
    return new Map(source.map((location) => [location.id, location.nameAr]));
  }, [scopedToWarehouse, locations, destLocations, allLocationsData?.items]);

  const warehouseNameById = React.useMemo(
    () => new Map(allWarehouses.map((item) => [item.id, item.nameAr])),
    [allWarehouses],
  );

  const items = data?.items ?? [];
  const selectedOperation = selectedId ? (items.find((item) => item.id === selectedId) ?? null) : null;

  const { create, remove } = useWarehouseOperationMutations(effectiveWarehouseId || 'global', kind);

  React.useEffect(() => {
    if (!open) return;
    const defaultWh = warehouseId || allWarehouses[0]?.id || '';
    form.reset({
      ...WAREHOUSE_OPERATION_FORM_DEFAULT_VALUES,
      occurredAt: new Date().toISOString().slice(0, 16),
      reference: `${meta.refPrefix}/${Date.now().toString().slice(-5)}`,
      quantity: isCountLike ? 0 : 1,
      theoreticalQuantity: isCountLike ? 0 : undefined,
      sourceWarehouseId: defaultWh,
      sourceDocument:
        kind === 'replenishment'
          ? 'تجديد المخزون يدويًا'
          : kind === 'purchase'
            ? 'أمر شراء'
            : '',
    });
  }, [open, form, meta.refPrefix, isCountLike, kind, warehouseId, allWarehouses]);

  const onSubmit = async (values: WarehouseOperationFormValues) => {
    if (!companyId) return;
    const sourceWh = warehouseId || values.sourceWarehouseId;
    if (!sourceWh) return;
    if (meta.needsDestWarehouse && !values.destinationWarehouseId) return;
    const qty = values.quantity;
    const theoretical = values.theoreticalQuantity ?? qty;
    if (!values.productId?.trim()) return;
    await create.mutateAsync({
      companyId,
      warehouseId: sourceWh,
      kind,
      reference: values.reference?.trim() || `${meta.refPrefix}/${Date.now().toString().slice(-5)}`,
      status: 'draft',
      occurredAt: new Date(values.occurredAt).toISOString(),
      notes: values.notes?.trim() || undefined,
      partnerName: values.partnerName?.trim() || undefined,
      sourceDocument: values.sourceDocument?.trim() || undefined,
      destinationWarehouseId: values.destinationWarehouseId || undefined,
      lines: [
        {
          id: `opl-${Math.random().toString(36).slice(2, 8)}`,
          productId: values.productId.trim(),
          productName: values.productName.trim(),
          sku: values.sku?.trim() || undefined,
          demandQuantity: isCountLike ? theoretical : qty,
          quantity: qty,
          fromLocationId: values.fromLocationId || undefined,
          toLocationId: values.toLocationId || undefined,
        },
      ],
    });
    setOpen(false);
  };

  const columns: ColumnDef<WarehouseOperation>[] = [
    {
      key: 'reference',
      title: 'المرجع',
      render: (row) => (
        <div className="flex flex-col">
          <span className="font-medium" dir="ltr">
            {row.reference || '—'}
          </span>
          <span className="text-xs text-muted-foreground">
            {new Date(row.occurredAt).toLocaleString('ar-SA')}
          </span>
        </div>
      ),
    },
    ...(!scopedToWarehouse
      ? [
          {
            key: 'warehouse',
            title: 'المستودع',
            render: (row: WarehouseOperation) => (
              <span className="text-sm">{warehouseNameById.get(row.warehouseId) ?? '—'}</span>
            ),
          } satisfies ColumnDef<WarehouseOperation>,
        ]
      : []),
    {
      key: 'partner',
      title: kind === 'issue' ? 'التسليم إلى' : kind === 'receipt' || kind === 'purchase' || kind === 'replenishment' ? 'الاستلام من' : 'الطرف',
      render: (row) => (
        <div className="flex flex-col">
          <span className="text-sm">{row.partnerName || '—'}</span>
          {row.sourceDocument ? (
            <span className="text-xs text-muted-foreground">{row.sourceDocument}</span>
          ) : null}
        </div>
      ),
    },
    {
      key: 'lines',
      title: 'البنود',
      render: (row) => (
        <span className="text-sm text-muted-foreground">
          {row.lines
            .map((line) => `${line.productName} × ${line.demandQuantity ?? line.quantity}`)
            .join('، ')}
        </span>
      ),
    },
    {
      key: 'qty',
      title: 'الكمية',
      render: (row) => {
        const total = row.lines.reduce((sum, line) => sum + (line.demandQuantity ?? line.quantity), 0);
        return (
          <span className="font-medium tabular-nums" dir="ltr">
            {total}
          </span>
        );
      },
    },
    {
      key: 'locations',
      title: 'المواقع',
      render: (row) => {
        const line = row.lines[0];
        if (!line) return '—';
        const from = line.fromLocationId ? locationNameById.get(line.fromLocationId) ?? '—' : null;
        const to = line.toLocationId ? locationNameById.get(line.toLocationId) ?? '—' : null;
        if (from && to) return <span className="text-sm">{from} ← {to}</span>;
        if (from) return <span className="text-sm">من: {from}</span>;
        if (to) return <span className="text-sm">إلى: {to}</span>;
        return '—';
      },
    },
    {
      key: 'status',
      title: 'الحالة',
      render: (row) => (
        <Badge variant={statusBadgeVariant(row.status)}>
          {WAREHOUSE_OPERATION_STATUS_LABELS_AR[row.status]}
        </Badge>
      ),
    },
    {
      key: 'actions',
      title: '',
      isActions: true,
      render: (row) => (
        <Button variant="ghost" size="icon" aria-label="حذف المستند" onClick={() => setToDelete(row)}>
          <Trash2 className="h-4 w-4 text-destructive" />
        </Button>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <ListToolbar
          searchValue={searchInput}
          onSearchChange={setSearchInput}
          searchPlaceholder="ابحث بالمرجع أو المنتج…"
          filters={
            showFilters ? (
              <div className="flex flex-wrap items-center gap-2">
                <Select value={filterWarehouseId} onValueChange={setFilterWarehouseId}>
                  <SelectTrigger className="h-10 w-[160px]" aria-label="تصفية المستودع">
                    <SelectValue placeholder="المستودع" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل المستودعات</SelectItem>
                    {allWarehouses.map((warehouse) => (
                      <SelectItem key={warehouse.id} value={warehouse.id}>
                        {warehouse.nameAr}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Select
                  value={filterStatus}
                  onValueChange={(value) => setFilterStatus(value as WarehouseOperationStatus | 'all')}
                >
                  <SelectTrigger className="h-10 w-[140px]" aria-label="تصفية الحالة">
                    <SelectValue placeholder="الحالة" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">كل الحالات</SelectItem>
                    {(Object.keys(WAREHOUSE_OPERATION_STATUS_LABELS_AR) as WarehouseOperationStatus[]).map(
                      (status) => (
                        <SelectItem key={status} value={status}>
                          {WAREHOUSE_OPERATION_STATUS_LABELS_AR[status]}
                        </SelectItem>
                      ),
                    )}
                  </SelectContent>
                </Select>
              </div>
            ) : undefined
          }
          actions={
            <Button onClick={() => setOpen(true)} disabled={!companyId || allWarehouses.length === 0}>
              <Plus className="h-4 w-4" />
              {meta.createLabel}
            </Button>
          }
        />
      </div>

      {isError ? <p className="text-sm text-destructive">تعذر تحميل {meta.title}.</p> : null}

      <DataTable
        columns={columns}
        data={items}
        keyExtractor={(row) => row.id}
        loading={isLoading}
        emptyText={meta.empty}
        onRowClick={(row) => setSelectedId(row.id)}
      />

      <WarehouseOperationDetailDialog
        open={Boolean(selectedId)}
        onOpenChange={(next) => {
          if (!next) setSelectedId(null);
        }}
        operation={selectedOperation}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className={`${dialogMaxHeightClass} max-w-lg overflow-y-auto`}>
          <DialogHeader>
            <DialogTitle>{meta.createLabel}</DialogTitle>
            <DialogDescription>
              يُنشأ المستند كمسودة، ثم يُحدَّد كجاهز ويُصدَّق من شاشة التفاصيل.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void form.handleSubmit(onSubmit)(e);
            }}
            className="space-y-4"
          >
            {!scopedToWarehouse ? (
              <div className="space-y-1.5">
                <Label>المستودع</Label>
                <Controller
                  control={form.control}
                  name="sourceWarehouseId"
                  render={({ field }) => (
                    <Select
                      value={field.value || undefined}
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue('fromLocationId', '');
                        form.setValue('toLocationId', '');
                        form.setValue('destinationWarehouseId', '');
                      }}
                    >
                      <SelectTrigger aria-label="المستودع">
                        <SelectValue placeholder="اختر مستودعًا" />
                      </SelectTrigger>
                      <SelectContent>
                        {allWarehouses.map((warehouse) => (
                          <SelectItem key={warehouse.id} value={warehouse.id}>
                            {warehouse.nameAr}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="op-ref">المرجع (اختياري)</Label>
                <Input id="op-ref" dir="ltr" {...form.register('reference')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="op-date">التاريخ</Label>
                <Input id="op-date" type="datetime-local" dir="ltr" {...form.register('occurredAt')} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="op-partner">
                  {kind === 'issue'
                    ? 'التسليم إلى'
                    : kind === 'receipt' || kind === 'purchase' || kind === 'replenishment'
                      ? 'الاستلام من'
                      : 'الطرف'}
                </Label>
                <Input id="op-partner" {...form.register('partnerName')} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="op-source">المستند المصدر</Label>
                <Input id="op-source" {...form.register('sourceDocument')} placeholder="اختياري" />
              </div>
            </div>

            {meta.needsDestWarehouse ? (
              <div className="space-y-1.5">
                <Label>المستودع الوجهة</Label>
                <Controller
                  control={form.control}
                  name="destinationWarehouseId"
                  render={({ field }) => (
                    <Select
                      value={field.value || undefined}
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue('toLocationId', '');
                      }}
                      disabled={!effectiveWarehouseId}
                    >
                      <SelectTrigger aria-label="المستودع الوجهة">
                        <SelectValue placeholder="اختر مستودعًا" />
                      </SelectTrigger>
                      <SelectContent>
                        {warehousesForDest.map((warehouse) => (
                          <SelectItem key={warehouse.id} value={warehouse.id}>
                            {warehouse.nameAr}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>المنتج</Label>
                <Controller
                  control={form.control}
                  name="productId"
                  render={({ field }) => (
                    <Select
                      value={field.value || undefined}
                      onValueChange={(value) => {
                        field.onChange(value);
                        const product = catalogProducts.find((item) => item.id === value);
                        form.setValue('productName', product?.nameAr ?? '');
                        form.setValue('sku', product?.sku ?? '');
                      }}
                    >
                      <SelectTrigger aria-label="المنتج">
                        <SelectValue placeholder="اختر منتجًا من الكتالوج" />
                      </SelectTrigger>
                      <SelectContent>
                        {catalogProducts.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.nameAr}
                            {product.sku ? ` (${product.sku})` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
                {form.formState.errors.productId ? (
                  <p className="text-xs text-destructive">{form.formState.errors.productId.message}</p>
                ) : null}
              </div>
              {isCountLike ? (
                <div className="space-y-1.5">
                  <Label htmlFor="op-theo">الكمية النظامية</Label>
                  <Input
                    id="op-theo"
                    type="number"
                    min={0}
                    step={1}
                    dir="ltr"
                    {...form.register('theoreticalQuantity', { valueAsNumber: true })}
                  />
                </div>
              ) : (
                <div className="space-y-1.5">
                  <Label htmlFor="op-qty">الكمية</Label>
                  <Input
                    id="op-qty"
                    type="number"
                    min={0}
                    step={1}
                    dir="ltr"
                    {...form.register('quantity', { valueAsNumber: true })}
                  />
                  {form.formState.errors.quantity ? (
                    <p className="text-xs text-destructive">{form.formState.errors.quantity.message}</p>
                  ) : null}
                </div>
              )}
            </div>

            {isCountLike ? (
              <div className="space-y-1.5">
                <Label htmlFor="op-counted">الكمية المعدودة</Label>
                <Input
                  id="op-counted"
                  type="number"
                  min={0}
                  step={1}
                  dir="ltr"
                  {...form.register('quantity', { valueAsNumber: true })}
                />
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="op-sku">رمز المنتج (SKU)</Label>
              <Input id="op-sku" dir="ltr" {...form.register('sku')} />
            </div>

            {meta.needsFrom ? (
              <div className="space-y-1.5">
                <Label htmlFor="op-from">من موقع</Label>
                <Controller
                  control={form.control}
                  name="fromLocationId"
                  render={({ field }) => (
                    <Select
                      value={field.value || undefined}
                      onValueChange={field.onChange}
                      disabled={!effectiveWarehouseId}
                    >
                      <SelectTrigger id="op-from" aria-label="من موقع">
                        <SelectValue placeholder="اختر موقعًا" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.nameAr}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            ) : null}

            {meta.needsTo ? (
              <div className="space-y-1.5">
                <Label htmlFor="op-to">{meta.needsDestWarehouse ? 'إلى موقع (في المستودع الوجهة)' : 'إلى موقع'}</Label>
                <Controller
                  control={form.control}
                  name="toLocationId"
                  render={({ field }) => (
                    <Select
                      value={field.value || undefined}
                      onValueChange={field.onChange}
                      disabled={
                        meta.needsDestWarehouse
                          ? !destinationWarehouseId
                          : !effectiveWarehouseId
                      }
                    >
                      <SelectTrigger id="op-to" aria-label="إلى موقع">
                        <SelectValue placeholder="اختر موقعًا" />
                      </SelectTrigger>
                      <SelectContent>
                        {toLocations.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.nameAr}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            ) : null}

            <div className="space-y-1.5">
              <Label htmlFor="op-notes">ملاحظات</Label>
              <Textarea id="op-notes" className="min-h-[72px] resize-none" {...form.register('notes')} />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setOpen(false)} disabled={create.isPending}>
                إلغاء
              </Button>
              <Button
                type="submit"
                disabled={create.isPending || !companyId || !effectiveWarehouseId}
              >
                {create.isPending ? 'جاري الحفظ…' : 'إنشاء مسودة'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={Boolean(toDelete)} onOpenChange={(openDialog) => !openDialog && setToDelete(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>حذف المستند؟</DialogTitle>
            <DialogDescription>حذف «{toDelete?.reference}» نهائيًا من هذه القائمة.</DialogDescription>
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
