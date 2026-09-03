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
import { useProduct } from '@/features/ecommerce/admin/products/hooks/use-products';
import { ProductSinglePicker } from '@/features/ecommerce/admin/products/components/product-single-picker';
import { WarehouseOperationLinesEditor } from '@/features/inventory/admin/operations/components/warehouse-operation-lines-editor';
import { FlexibleQuantityInput } from '@/features/inventory/admin/operations/components/flexible-quantity-input';
import {
  LocationRouteChips,
  ProductQuantityChips,
  QuantityChip,
  WarehouseChip,
  WarehouseRouteChips,
} from '@/features/inventory/admin/operations/components/inventory-chips';
import { inventoryStockService } from '@/features/inventory/services/inventory-stock.service';
import {
  collectStockShortages,
  formatStockShortageMessage,
} from '@/features/inventory/admin/operations/lib/validate-operation-stock';
import {
  emptyOperationLineDraft,
  hasDuplicateOperationLineProducts,
  operationLineDraftsToLines,
  supportsMultiProductLines,
  type OperationLineDraft,
} from '@/features/inventory/admin/operations/lib/operation-line-draft';
import { toast } from 'sonner';
import { formatDateTime } from '@/shared/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ListToolbar } from '@/components/ui/list-toolbar';
import { DataTable, AppPagination, type ColumnDef } from '@/components/ui/data-table';
import { DirectoryPagedViews, DEFAULT_PAGE_SIZE } from '@/components/ui/paged-list';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import { PageHeaderPrimaryButton } from '@/components/layouts/page-header-primary-button';
import { ListFilterBar } from '@/components/ui/list-filter-bar';
import { EntityFilterSearchField } from '@/components/ui/entity-filter-search-field';
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

/** Matches inventory-stock-mode-contract.md */
type StockLineMode = 'product' | 'variants';

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
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(DEFAULT_PAGE_SIZE);
  const [filterWarehouseId, setFilterWarehouseId] = React.useState<string>('all');
  const [filterStatus, setFilterStatus] = React.useState<WarehouseOperationStatus | 'all'>('all');
  const [open, setOpen] = React.useState(false);
  const [selectedId, setSelectedId] = React.useState<string | null>(null);
  const [toDelete, setToDelete] = React.useState<WarehouseOperation | null>(null);
  const [stockMode, setStockMode] = React.useState<StockLineMode>('product');
  const [variantQuantities, setVariantQuantities] = React.useState<Record<string, number>>({});
  const multiProductMode = supportsMultiProductLines(kind);
  const checksSourceStock =
    meta.stockEffect === 'outbound' || meta.stockEffect === 'move' || meta.stockEffect === 'transfer';
  const [lineDrafts, setLineDrafts] = React.useState<OperationLineDraft[]>([emptyOperationLineDraft()]);

  React.useEffect(() => {
    const timeout = setTimeout(() => {
      setSearch(searchInput.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  React.useEffect(() => {
    setPage(1);
  }, [filterWarehouseId, filterStatus, kind, warehouseId]);

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
    page,
    limit: pageSize,
  });
  const { data: warehousesData } = useWarehouses({ companyId, limit: 100 });
  const allWarehouses = warehousesData?.items ?? [];
  const items = data?.items ?? [];
  const total = data?.pagination.total ?? 0;
  const form = useForm<WarehouseOperationFormValues>({
    resolver: zodResolver(warehouseOperationFormSchema),
    defaultValues: WAREHOUSE_OPERATION_FORM_DEFAULT_VALUES,
  });
  const destinationWarehouseId = form.watch('destinationWarehouseId');
  const formWarehouseId = form.watch('sourceWarehouseId');
  const selectedProductId = form.watch('productId');
  const fromLocationId = form.watch('fromLocationId');
  const toLocationId = form.watch('toLocationId');
  const effectiveWarehouseId = warehouseId || formWarehouseId || '';
  const locationsReady =
    (!meta.needsFrom || Boolean(fromLocationId)) &&
    (!meta.needsTo || Boolean(toLocationId)) &&
    (!meta.needsDestWarehouse || Boolean(destinationWarehouseId));

  const { data: selectedProduct, isLoading: isLoadingSelectedProduct } = useProduct(
    companyId,
    selectedProductId || null,
    { enabled: open && Boolean(selectedProductId) },
  );
  const activeVariants = React.useMemo(
    () => (selectedProduct?.variants ?? []).filter((variant) => variant.isActive !== false),
    [selectedProduct?.variants],
  );
  const hasActiveVariants = activeVariants.length > 0;

  // Single-product outbound docs: on-hand at the chosen source location caps the
  // quantity, so an over-available draft can never be created in the first place.
  const [sourceAvailable, setSourceAvailable] = React.useState<number | null>(null);
  const [variantAvailable, setVariantAvailable] = React.useState<Record<string, number>>({});
  const tracksSourceAvailability = checksSourceStock && !multiProductMode;

  React.useEffect(() => {
    if (
      !open ||
      !companyId ||
      !tracksSourceAvailability ||
      !fromLocationId ||
      !selectedProductId
    ) {
      setSourceAvailable(null);
      setVariantAvailable({});
      return;
    }

    let cancelled = false;
    void (async () => {
      try {
        const base = await inventoryStockService.getQuantityAtLocation(
          companyId,
          selectedProductId,
          fromLocationId,
        );
        const perVariant: Record<string, number> = {};
        await Promise.all(
          activeVariants.map(async (variant) => {
            const qty = await inventoryStockService.getQuantityAtLocation(
              companyId,
              selectedProductId,
              fromLocationId,
              variant.id,
            );
            perVariant[variant.id] = Math.max(0, qty);
          }),
        );
        if (cancelled) return;
        setSourceAvailable(Math.max(0, base));
        setVariantAvailable(perVariant);
      } catch {
        if (cancelled) return;
        setSourceAvailable(null);
        setVariantAvailable({});
        toast.error('تعذر قراءة رصيد المنتج في الموقع المحدد.');
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    open,
    companyId,
    tracksSourceAvailability,
    fromLocationId,
    selectedProductId,
    activeVariants,
  ]);

  // Products already sitting in an unvalidated document of this kind — cannot be picked again.
  const { data: openOperationsData } = useWarehouseOperations(
    {
      companyId,
      warehouseId: effectiveWarehouseId || undefined,
      kind,
      page: 1,
      limit: 500,
    },
    { enabled: open && Boolean(companyId && effectiveWarehouseId) },
  );

  const takenProductIds = React.useMemo(() => {
    const taken = new Map<string, string>();
    for (const operation of openOperationsData?.items ?? []) {
      if (operation.status !== 'draft' && operation.status !== 'ready') continue;
      for (const line of operation.lines) {
        if (line.productId) taken.set(line.productId, operation.reference);
      }
    }
    return taken;
  }, [openOperationsData?.items]);

  const takenProductIdList = React.useMemo(() => Array.from(takenProductIds.keys()), [takenProductIds]);

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

  const selectedOperation = selectedId ? (items.find((item) => item.id === selectedId) ?? null) : null;

  const { create, remove } = useWarehouseOperationMutations(effectiveWarehouseId || 'global', kind);

  // Standalone inventory pages (kind pages) get the shared topbar add-button + collapsible
  // filter bar pattern; the warehouse-detail embedded tab keeps its original inline toolbar
  // untouched so this change stays scoped to the standalone pages only.
  usePageHeaderActions(
    () =>
      scopedToWarehouse ? null : (
        <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
          <FilterToggleButton />
          <PageHeaderPrimaryButton
            icon={Plus}
            label={meta.createLabel}
            onClick={() => setOpen(true)}
            disabled={!companyId || allWarehouses.length === 0}
          >
            {meta.createLabel}
          </PageHeaderPrimaryButton>
        </div>
      ),
    [scopedToWarehouse, meta.createLabel, companyId, allWarehouses.length],
  );

  useEntityFilterSlot(
    () =>
      scopedToWarehouse ? null : (
        <ListFilterBar
          showDateSection={false}
          showStatusSection={false}
          showEmployeePicker={false}
          leadingFilters={
            <EntityFilterSearchField
              value={searchInput}
              onChange={setSearchInput}
              placeholder="ابحث بالمرجع أو المنتج…"
            />
          }
          inlineSelects={[
            {
              id: 'warehouse',
              value: filterWarehouseId,
              onChange: setFilterWarehouseId,
              placeholder: 'كل المستودعات',
              options: [
                { value: 'all', label: 'كل المستودعات' },
                ...allWarehouses.map((warehouse) => ({ value: warehouse.id, label: warehouse.nameAr })),
              ],
            },
            {
              id: 'status',
              value: filterStatus,
              onChange: (value) => setFilterStatus(value as WarehouseOperationStatus | 'all'),
              placeholder: 'كل الحالات',
              options: [
                { value: 'all', label: 'كل الحالات' },
                ...(Object.keys(WAREHOUSE_OPERATION_STATUS_LABELS_AR) as WarehouseOperationStatus[]).map((status) => ({
                  value: status,
                  label: WAREHOUSE_OPERATION_STATUS_LABELS_AR[status],
                })),
              ],
            },
          ]}
        />
      ),
    [scopedToWarehouse, searchInput, filterWarehouseId, filterStatus, allWarehouses],
  );

  React.useEffect(() => {
    if (!open) return;
    const defaultWh = warehouseId || allWarehouses[0]?.id || '';
    setStockMode('product');
    setVariantQuantities({});
    setLineDrafts([emptyOperationLineDraft()]);
    form.reset({
      ...WAREHOUSE_OPERATION_FORM_DEFAULT_VALUES,
      occurredAt: new Date().toISOString().slice(0, 16),
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
  }, [open, form, isCountLike, kind, warehouseId, allWarehouses]);

  React.useEffect(() => {
    if (!open || !selectedProductId) return;
    if (!selectedProduct || selectedProduct.id !== selectedProductId) return;
    const variants = (selectedProduct.variants ?? []).filter((variant) => variant.isActive !== false);
    if (variants.length > 0) {
      setStockMode('variants');
      setVariantQuantities(Object.fromEntries(variants.map((variant) => [variant.id, 0])));
    } else {
      setStockMode('product');
      setVariantQuantities({});
    }
    form.setValue('productName', selectedProduct.nameAr);
    form.setValue('sku', selectedProduct.sku);
  }, [open, selectedProductId, selectedProduct, form]);

  function applyStockMode(mode: StockLineMode) {
    setStockMode(mode);
    if (mode === 'variants') {
      setVariantQuantities(Object.fromEntries(activeVariants.map((variant) => [variant.id, 0])));
    } else {
      setVariantQuantities({});
      if (!isCountLike && form.getValues('quantity') <= 0) {
        form.setValue('quantity', 1);
      }
    }
  }

  const onSubmit = async (values: WarehouseOperationFormValues) => {
    if (!companyId) return;
    const sourceWh = warehouseId || values.sourceWarehouseId;
    if (!sourceWh) return;
    if (meta.needsDestWarehouse && !values.destinationWarehouseId) return;

    if (meta.needsFrom && !values.fromLocationId?.trim()) {
      toast.error('اختر موقع المصدر قبل إضافة المنتجات.');
      return;
    }
    if (meta.needsTo && !values.toLocationId?.trim()) {
      toast.error('اختر موقع الوجهة قبل إضافة المنتجات.');
      return;
    }

    const lineLocations = {
      fromLocationId: values.fromLocationId || undefined,
      toLocationId: values.toLocationId || undefined,
    };

    if (multiProductMode) {
      if (hasDuplicateOperationLineProducts(lineDrafts)) {
        toast.error('لا يمكن تكرار نفس المنتج في أكثر من سطر.');
        return;
      }
      const lines = operationLineDraftsToLines(lineDrafts, lineLocations);
      if (lines.length === 0) {
        toast.error('أضف صنفًا واحدًا على الأقل مع كمية أكبر من صفر.');
        return;
      }
      if (
        meta.stockEffect === 'move' &&
        lineLocations.fromLocationId &&
        lineLocations.toLocationId &&
        lineLocations.fromLocationId === lineLocations.toLocationId
      ) {
        toast.error('اختر موقعين مختلفين داخل نفس المستودع.');
        return;
      }
      if (checksSourceStock && lineLocations.fromLocationId) {
        const issues = await collectStockShortages({
          companyId,
          warehouseId: sourceWh,
          kind,
          destinationWarehouseId: values.destinationWarehouseId || undefined,
          lines,
        });
        if (issues.length > 0) {
          toast.error(formatStockShortageMessage(issues[0]!));
          return;
        }
      }
      await create.mutateAsync({
        companyId,
        warehouseId: sourceWh,
        kind,
        status: 'draft',
        occurredAt: new Date(values.occurredAt).toISOString(),
        notes: values.notes?.trim() || undefined,
        partnerName: values.partnerName?.trim() || undefined,
        sourceDocument: values.sourceDocument?.trim() || undefined,
        destinationWarehouseId: values.destinationWarehouseId || undefined,
        lines,
      });
      setOpen(false);
      return;
    }

    if (!values.productId?.trim()) return;

    const duplicateReference = takenProductIds.get(values.productId.trim());
    if (duplicateReference) {
      toast.error(
        `هذا المنتج مضاف بالفعل في مستند ${meta.labelAr} «${duplicateReference}» غير المصدَّق. عدّل ذلك المستند بدل إنشاء مستند مكرر.`,
      );
      return;
    }

    const qty = values.quantity;
    const theoretical = values.theoreticalQuantity ?? qty;
    const useVariants = hasActiveVariants && stockMode === 'variants';
    const lines = useVariants
      ? activeVariants
          .filter((variant) => (variantQuantities[variant.id] ?? 0) > 0)
          .map((variant) => {
            const lineQty = variantQuantities[variant.id] ?? 0;
            return {
              id: `opl-${Math.random().toString(36).slice(2, 8)}`,
              productId: values.productId.trim(),
              variantId: variant.id,
              productName: variant.nameAr,
              sku: variant.sku || values.sku?.trim() || undefined,
              demandQuantity: isCountLike ? theoretical : lineQty,
              quantity: lineQty,
              ...lineLocations,
            };
          })
      : [
          {
            id: `opl-${Math.random().toString(36).slice(2, 8)}`,
            productId: values.productId.trim(),
            variantId: undefined,
            productName: values.productName.trim() || 'المنتج الأساسي',
            sku: values.sku?.trim() || undefined,
            demandQuantity: isCountLike ? theoretical : qty,
            quantity: qty,
            ...lineLocations,
          },
        ];

    if (lines.length === 0 || lines.every((line) => line.quantity <= 0 && !isCountLike)) {
      toast.error(
        useVariants
          ? 'أدخل كمية لمتغير واحد على الأقل.'
          : 'أدخل كمية للمنتج.',
      );
      return;
    }

    if (checksSourceStock && lineLocations.fromLocationId) {
      const issues = await collectStockShortages({
        companyId,
        warehouseId: sourceWh,
        kind,
        destinationWarehouseId: values.destinationWarehouseId || undefined,
        lines,
      });
      if (issues.length > 0) {
        toast.error(formatStockShortageMessage(issues[0]!));
        return;
      }
    }

    await create.mutateAsync({
      companyId,
      warehouseId: sourceWh,
      kind,
      status: 'draft',
      occurredAt: new Date(values.occurredAt).toISOString(),
      notes: values.notes?.trim() || undefined,
      partnerName: values.partnerName?.trim() || undefined,
      sourceDocument: values.sourceDocument?.trim() || undefined,
      destinationWarehouseId: values.destinationWarehouseId || undefined,
      lines,
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
            {formatDateTime(row.occurredAt)}
          </span>
        </div>
      ),
    },
    ...(!scopedToWarehouse
      ? [
          {
            key: 'warehouse',
            title: meta.needsDestWarehouse ? 'المستودعات' : 'المستودع',
            render: (row: WarehouseOperation) =>
              row.destinationWarehouseId && row.destinationWarehouseId !== row.warehouseId ? (
                <WarehouseRouteChips
                  from={warehouseNameById.get(row.warehouseId)}
                  to={warehouseNameById.get(row.destinationWarehouseId)}
                />
              ) : (
                <WarehouseChip name={warehouseNameById.get(row.warehouseId)} />
              ),
          } satisfies ColumnDef<WarehouseOperation>,
        ]
      : []),
    {
      key: 'partner',
      title: kind === 'issue' ? 'الصرف إلى' : kind === 'receipt' || kind === 'purchase' || kind === 'replenishment' ? 'الاستلام من' : 'الطرف',
      hideOnMobile: true,
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
      hideOnMobile: true,
      render: (row) => (
        <ProductQuantityChips
          lines={row.lines.map((line) => ({
            id: line.id,
            productName: line.productName,
            quantity: line.demandQuantity ?? line.quantity,
            sku: line.sku,
          }))}
        />
      ),
    },
    {
      key: 'qty',
      title: 'الكمية',
      render: (row) => {
        const total = row.lines.reduce((sum, line) => sum + (line.demandQuantity ?? line.quantity), 0);
        return <QuantityChip value={total} />;
      },
    },
    {
      key: 'locations',
      title: 'المواقع',
      hideOnMobile: true,
      render: (row) => {
        const line = row.lines[0];
        if (!line) return <span className="text-sm text-muted-foreground">—</span>;
        return (
          <LocationRouteChips
            from={line.fromLocationId ? locationNameById.get(line.fromLocationId) ?? '—' : null}
            to={line.toLocationId ? locationNameById.get(line.toLocationId) ?? '—' : null}
          />
        );
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

  const dialogs = (
    <>
      <WarehouseOperationDetailDialog
        open={Boolean(selectedId)}
        onOpenChange={(next) => {
          if (!next) setSelectedId(null);
        }}
        operation={selectedOperation}
      />

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className={`${dialogMaxHeightClass} ${multiProductMode ? 'max-w-2xl' : 'max-w-lg'} overflow-y-auto`}>
          <DialogHeader>
            <DialogTitle>{meta.createLabel}</DialogTitle>
            <DialogDescription>
              يُنشأ المستند كمسودة، ثم يُحدَّد كجاهز ويُصدَّق من شاشة التفاصيل.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (multiProductMode) {
                void onSubmit(form.getValues());
                return;
              }
              void form.handleSubmit(onSubmit)(e);
            }}
            className="space-y-4"
          >
            <div className="space-y-1">
              <h3 className="text-sm font-semibold text-foreground">المستودعات والمواقع</h3>
              <p className="text-xs text-muted-foreground">
                حدّد مصدر ووجهة الحركة أولًا قبل اختيار المنتجات.
              </p>
            </div>

            {!scopedToWarehouse ? (
              <div className="space-y-1.5">
                <Label>{meta.needsDestWarehouse ? 'مستودع الصرف (المصدر)' : 'المستودع'}</Label>
                <Controller
                  control={form.control}
                  name="sourceWarehouseId"
                  render={({ field }) => (
                    <Select
                      value={field.value || ''}
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue('fromLocationId', '');
                        form.setValue('productId', '');
                        form.setValue('productName', '');
                        form.setValue('sku', '');
                        setLineDrafts([emptyOperationLineDraft()]);
                        setStockMode('product');
                        setVariantQuantities({});
                        if (!meta.needsDestWarehouse) {
                          form.setValue('toLocationId', '');
                        } else if (form.getValues('destinationWarehouseId') === value) {
                          // A warehouse cannot transfer to itself.
                          form.setValue('destinationWarehouseId', '');
                          form.setValue('toLocationId', '');
                        }
                      }}
                    >
                      <SelectTrigger aria-label={meta.needsDestWarehouse ? 'مستودع الصرف' : 'المستودع'}>
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
            ) : (
              <div className="space-y-1.5">
                <Label>{meta.needsDestWarehouse ? 'مستودع الصرف (المصدر)' : 'المستودع'}</Label>
                <Input
                  value={warehouseNameById.get(warehouseId ?? '') ?? '—'}
                  disabled
                />
              </div>
            )}

            {meta.needsFrom ? (
              <div className="space-y-1.5">
                <Label htmlFor="op-from">
                  {kind === 'transfer'
                    ? 'موقع الصرف (المصدر)'
                    : kind === 'issue'
                      ? 'موقع الصرف'
                      : meta.stockEffect === 'move'
                        ? 'الموقع الحالي (من)'
                        : 'الموقع المصدر'}
                </Label>
                <Controller
                  control={form.control}
                  name="fromLocationId"
                  render={({ field }) => (
                    <Select
                      value={field.value || ''}
                      onValueChange={(value) => {
                        field.onChange(value);
                        if (multiProductMode) {
                          setLineDrafts([emptyOperationLineDraft()]);
                        } else {
                          form.setValue('productId', '');
                          form.setValue('productName', '');
                          form.setValue('sku', '');
                          setStockMode('product');
                          setVariantQuantities({});
                        }
                      }}
                      disabled={!effectiveWarehouseId}
                    >
                      <SelectTrigger id="op-from" aria-label="من موقع">
                        <SelectValue placeholder="اختر موقع المصدر أولًا" />
                      </SelectTrigger>
                      <SelectContent>
                        {locations.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.nameAr || location.code}
                            {location.code ? ` · ${location.code}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            ) : null}

            {meta.needsDestWarehouse ? (
              <div className="space-y-1.5">
                <Label>المستودع الوجهة</Label>
                <Controller
                  control={form.control}
                  name="destinationWarehouseId"
                  render={({ field }) => (
                    <Select
                      value={field.value || ''}
                      onValueChange={(value) => {
                        field.onChange(value);
                        form.setValue('toLocationId', '');
                      }}
                    >
                      <SelectTrigger aria-label="المستودع الوجهة">
                        <SelectValue placeholder="اختر المستودع الوجهة" />
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

            {meta.needsTo ? (
              <div className="space-y-1.5">
                <Label htmlFor="op-to">
                  {meta.needsDestWarehouse
                    ? 'موقع الاستلام (الوجهة)'
                    : meta.stockEffect === 'inbound'
                      ? 'موقع الاستلام'
                      : meta.stockEffect === 'adjust_set'
                        ? 'موقع المخزون'
                        : meta.stockEffect === 'move'
                          ? 'الموقع الجديد (إلى)'
                          : 'الموقع الوجهة'}
                </Label>
                <Controller
                  control={form.control}
                  name="toLocationId"
                  render={({ field }) => (
                    <Select
                      value={field.value || ''}
                      onValueChange={(value) => {
                        field.onChange(value);
                        // Availability is read at the source location, so picking a
                        // destination keeps the products. Inbound/count docs have no
                        // source: there this field *is* the stock reference.
                        if (meta.needsFrom) return;
                        if (multiProductMode) {
                          setLineDrafts([emptyOperationLineDraft()]);
                        } else {
                          form.setValue('productId', '');
                          form.setValue('productName', '');
                          form.setValue('sku', '');
                          setStockMode('product');
                          setVariantQuantities({});
                        }
                      }}
                      disabled={
                        meta.needsDestWarehouse
                          ? !destinationWarehouseId
                          : !effectiveWarehouseId
                      }
                    >
                      <SelectTrigger id="op-to" aria-label="إلى موقع">
                        <SelectValue
                          placeholder={
                            meta.needsDestWarehouse && !destinationWarehouseId
                              ? 'اختر المستودع الوجهة أولًا'
                              : 'اختر موقع الوجهة'
                          }
                        />
                      </SelectTrigger>
                      <SelectContent>
                        {toLocations.map((location) => (
                          <SelectItem key={location.id} value={location.id}>
                            {location.nameAr || location.code}
                            {location.code ? ` · ${location.code}` : ''}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            ) : null}

            {!locationsReady && (meta.needsFrom || meta.needsTo) ? (
              <p className="rounded-lg border border-dashed border-border bg-muted/20 px-3 py-2 text-xs text-muted-foreground">
                حدّد المواقع أعلاه أولًا، ثم اختر المنتجات.
              </p>
            ) : null}

            <div className="space-y-1 border-t border-border pt-4">
              <h3 className="text-sm font-semibold text-foreground">المنتجات والكميات</h3>
              <p className="text-xs text-muted-foreground">
                اختر المنتجات بعد اكتمال تحديد المستودعات والمواقع.
              </p>
            </div>

            {multiProductMode ? (
              <WarehouseOperationLinesEditor
                companyId={companyId}
                lines={lineDrafts}
                onChange={setLineDrafts}
                fromLocationId={fromLocationId || undefined}
                checksSourceStock={checksSourceStock}
                disabled={!locationsReady}
              />
            ) : (
              <div className="inv-form-grid">
                <div className="space-y-1.5">
                  <Label>المنتج</Label>
                  <Controller
                    control={form.control}
                    name="productId"
                    render={({ field }) => (
                      <ProductSinglePicker
                        companyId={companyId}
                        value={field.value ?? ''}
                        status="active"
                        excludeIds={takenProductIdList}
                        disabled={!locationsReady}
                        placeholder={
                          locationsReady
                            ? 'ابحث عن منتج من الكتالوج…'
                            : 'حدّد المواقع أولًا…'
                        }
                        onChange={field.onChange}
                        onProductSelect={(product) => {
                          form.setValue('productName', product.nameAr ?? '');
                          form.setValue('sku', product.sku ?? '');
                          setStockMode('product');
                          setVariantQuantities({});
                        }}
                      />
                    )}
                  />
                  {form.formState.errors.productId ? (
                    <p className="text-xs text-destructive">{form.formState.errors.productId.message}</p>
                  ) : null}
                  {selectedProductId && isLoadingSelectedProduct ? (
                    <p className="text-xs text-muted-foreground">جاري تحميل المتغيرات…</p>
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
                      disabled={!locationsReady}
                      {...form.register('theoreticalQuantity', { valueAsNumber: true })}
                    />
                  </div>
                ) : stockMode === 'product' || !hasActiveVariants ? (
                  <div className="space-y-1.5">
                    <Label htmlFor="op-qty">الكمية</Label>
                    <Controller
                      control={form.control}
                      name="quantity"
                      render={({ field }) => (
                        <FlexibleQuantityInput
                          id="op-qty"
                          className="w-full"
                          value={field.value ?? 0}
                          max={tracksSourceAvailability ? sourceAvailable : null}
                          disabled={!locationsReady || !selectedProductId}
                          onChange={field.onChange}
                        />
                      )}
                    />
                    {tracksSourceAvailability && sourceAvailable != null ? (
                      <p className="text-xs text-muted-foreground">
                        المتاح في الموقع: {sourceAvailable}
                      </p>
                    ) : null}
                    {form.formState.errors.quantity ? (
                      <p className="text-xs text-destructive">{form.formState.errors.quantity.message}</p>
                    ) : null}
                  </div>
                ) : (
                  <div className="space-y-1.5">
                    <Label>الكمية</Label>
                    <p className="pt-2 text-xs text-muted-foreground">أدخل الكميات أسفل لكل متغير</p>
                  </div>
                )}
              </div>
            )}

            {!multiProductMode && hasActiveVariants ? (
              <div className="space-y-1.5">
                <Label>نطاق الكمية</Label>
                <Select
                  value={stockMode}
                  onValueChange={(value) => applyStockMode(value as StockLineMode)}
                  disabled={!locationsReady}
                >
                  <SelectTrigger aria-label="نطاق الكمية">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="product">المنتج الأساسي فقط</SelectItem>
                    <SelectItem value="variants">حسب المتغيرات</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-xs text-muted-foreground">
                  لا يمكن مزج الوضعين في نفس الطلب لنفس المنتج.
                </p>
              </div>
            ) : null}

            {!multiProductMode && hasActiveVariants && stockMode === 'variants' ? (
              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-muted-foreground">
                      <th className="px-3 py-2 text-start font-medium">المتغير</th>
                      <th className="px-3 py-2 text-start font-medium">الكمية</th>
                      {tracksSourceAvailability ? (
                        <th className="px-3 py-2 text-start font-medium">المتاح في الموقع</th>
                      ) : null}
                    </tr>
                  </thead>
                  <tbody>
                    {activeVariants.map((variant) => (
                      <tr key={variant.id} className="border-b border-border last:border-0">
                        <td className="px-3 py-2">
                          <div className="font-medium">{variant.nameAr}</div>
                          <div className="text-xs text-muted-foreground" dir="ltr">
                            {variant.sku}
                          </div>
                        </td>
                        <td className="px-3 py-2">
                          <FlexibleQuantityInput
                            className="h-8 w-28"
                            value={variantQuantities[variant.id] ?? 0}
                            max={tracksSourceAvailability ? (variantAvailable[variant.id] ?? null) : null}
                            disabled={!locationsReady}
                            onChange={(nextQty) => {
                              setVariantQuantities((prev) => ({ ...prev, [variant.id]: nextQty }));
                            }}
                          />
                        </td>
                        {tracksSourceAvailability ? (
                          <td className="px-3 py-2 text-xs text-muted-foreground tabular-nums" dir="ltr">
                            {variantAvailable[variant.id] ?? '—'}
                          </td>
                        ) : null}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}

            {isCountLike ? (
              <div className="space-y-1.5">
                <Label htmlFor="op-counted">الكمية المعدودة</Label>
                <Input
                  id="op-counted"
                  type="number"
                  min={0}
                  step={1}
                  dir="ltr"
                  disabled={!locationsReady}
                  {...form.register('quantity', { valueAsNumber: true })}
                />
              </div>
            ) : null}

            {!multiProductMode ? (
              <div className="space-y-1.5">
                <Label htmlFor="op-sku">رمز المنتج (SKU)</Label>
                <Input
                  id="op-sku"
                  dir="ltr"
                  {...form.register('sku')}
                  disabled={!locationsReady || (hasActiveVariants && stockMode === 'variants')}
                />
                {stockMode === 'product' && hasActiveVariants ? (
                  <p className="text-xs text-muted-foreground">سيُرسل السطر بدون متغير (variantId = null).</p>
                ) : null}
              </div>
            ) : null}

            <div className="space-y-1 border-t border-border pt-4">
              <h3 className="text-sm font-semibold text-foreground">تفاصيل المستند</h3>
              <p className="text-xs text-muted-foreground">
                أكمل البيانات الإضافية بعد تحديد حركة المخزون.
              </p>
            </div>

            <div className="inv-form-grid">
              <div className="space-y-1.5">
                <Label htmlFor="op-date">التاريخ</Label>
                <Input id="op-date" type="datetime-local" dir="ltr" {...form.register('occurredAt')} />
              </div>
            </div>

            <div className="inv-form-grid">
              <div className="space-y-1.5">
                <Label htmlFor="op-partner">
                  {kind === 'issue'
                    ? 'الصرف إلى'
                    : kind === 'receipt' || kind === 'purchase' || kind === 'replenishment'
                      ? 'الاستلام من'
                      : 'الطرف'}
                </Label>
                <Input id="op-partner" {...form.register('partnerName')} placeholder="اختياري" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="op-source">المستند المصدر</Label>
                <Input id="op-source" {...form.register('sourceDocument')} placeholder="اختياري" />
              </div>
            </div>

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
    </>
  );

  if (scopedToWarehouse) {
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
                    <SelectTrigger className="inv-filter-select h-10" aria-label="تصفية المستودع">
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
                    <SelectTrigger className="inv-filter-select-sm h-10" aria-label="تصفية الحالة">
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
          className="inv-table-host"
          columns={columns}
          data={items}
          keyExtractor={(row) => row.id}
          loading={isLoading}
          emptyText={meta.empty}
          onRowClick={(row) => setSelectedId(row.id)}
        />

        {data ? (
          <AppPagination
            page={page}
            pageSize={pageSize}
            total={total}
            onPageChange={setPage}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        ) : null}

        {dialogs}
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {isError ? <p className="text-sm text-destructive">تعذر تحميل {meta.title}.</p> : null}

      <DirectoryPagedViews
        items={items}
        loading={isLoading}
        serverPagination={{
          page,
          pageSize,
          total,
          totalPages: Math.max(1, Math.ceil(total / pageSize)),
          setPage,
          setPageSize: (size) => {
            setPageSize(size);
            setPage(1);
          },
        }}
      >
        {(pageItems) => (
          <DataTable
            variant="directory"
            className="inv-table-host"
            columns={columns}
            data={pageItems}
            keyExtractor={(row) => row.id}
            loading={isLoading}
            emptyText={meta.empty}
            onRowClick={(row) => setSelectedId(row.id)}
          />
        )}
      </DirectoryPagedViews>

      {dialogs}
    </div>
  );
}
