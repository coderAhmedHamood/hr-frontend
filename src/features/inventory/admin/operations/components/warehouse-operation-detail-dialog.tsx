'use client';

import * as React from 'react';
import { ArrowDown, Check, Plus, Trash2, Undo2, X } from 'lucide-react';
import { toast } from 'sonner';
import { getInventoryCompanyId } from '@/features/inventory/lib/company-id';
import { useInventoryCompanySettings } from '@/features/inventory/admin/notifications/hooks/use-inventory-settings';
import { PartnerSinglePicker } from '@/features/contacts/admin/partners/components/partner-single-picker';
import { useWarehouseLocations } from '@/features/inventory/admin/locations/hooks/use-warehouse-locations';
import { useWarehouses } from '@/features/inventory/admin/warehouses/hooks/use-warehouses';
import { useQuery } from '@tanstack/react-query';
import { useWarehouseOperationMutations } from '@/features/inventory/admin/operations/hooks/use-warehouse-operation-mutations';
import { useOpenOperationProductReservations } from '@/features/inventory/admin/operations/hooks/use-open-operation-product-reservations';
import { warehouseOperationsApi } from '@/features/inventory/admin/operations/lib/api/warehouse-operations';
import { warehouseOperationsQueryKeys } from '@/features/inventory/admin/hooks/query-keys';
import { operationNeedsFullLinesFetch } from '@/features/inventory/admin/operations/lib/operation-list-line-totals';
import { inventoryStockService } from '@/features/inventory/services/inventory-stock.service';
import {
  collectStockShortages,
  formatStockShortageMessage,
  maxQuantityForLine,
  readAvailableAtSourceLine,
} from '@/features/inventory/admin/operations/lib/validate-operation-stock';
import { WAREHOUSE_OPERATION_KIND_META } from '@/features/inventory/domain/constants/warehouse-operation-kinds';
import {
  WAREHOUSE_OPERATION_FLOW_STEPS,
  WAREHOUSE_OPERATION_KIND_LABELS_AR,
  WAREHOUSE_OPERATION_STATUS_LABELS_AR,
} from '@/features/inventory/domain/constants/warehouse-operation-status';
import type {
  WarehouseOperation,
  WarehouseOperationLine,
  WarehouseOperationStatus,
} from '@/features/inventory/domain/types/warehouse';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogTitle,
  dialogShellBodyClass,
  dialogShellContentClass,
  dialogShellHeaderClass,
} from '@/components/ui/dialog';
import { ProductSinglePicker } from '@/features/ecommerce/admin/products/components/product-single-picker';
import { FlexibleQuantityInput } from '@/features/inventory/admin/operations/components/flexible-quantity-input';
import {
  LocationChip,
  WarehouseChip,
} from '@/features/inventory/admin/operations/components/inventory-chips';
import {
  emptyOperationLineDraft,
  hasDuplicateOperationLineProducts,
  newOperationLineDraftId,
  operationLinesToDrafts,
  supportsMultiProductLines,
  pickerUsesSourceLocationStock,
} from '@/features/inventory/admin/operations/lib/operation-line-draft';
import { OperationLineVariantSelect } from '@/features/inventory/admin/operations/components/operation-line-variant-select';
import type { ProductVariant } from '@/features/ecommerce/domain/types/product';
import { OperationUnitCostInput } from '@/features/inventory/admin/operations/components/operation-unit-cost-input';
import { fetchActiveProductVariants } from '@/features/inventory/admin/operations/lib/fetch-active-product-variants';
import { formatVariantCompactLabel } from '@/features/inventory/admin/operations/lib/variant-display-label';
import { OPERATION_FORM_TAB_TRIGGER } from '@/features/inventory/admin/operations/components/operation-form-ui';
import {
  filterOperationFromLocations,
  filterOperationToLocations,
} from '@/features/inventory/admin/operations/lib/operation-location-filters';
import { cn } from '@/shared/utils';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  operation: WarehouseOperation | null;
};

function formatLineQuantity(value: number): string {
  if (!Number.isFinite(value)) return '—';
  return Number.isInteger(value) ? String(value) : String(Math.round(value * 1000) / 1000);
}

function lineUnitCostNumber(unitCost?: string): number | null {
  const raw = unitCost?.trim();
  if (!raw) return null;
  const value = Number(raw);
  return Number.isFinite(value) ? value : null;
}

function formatLineMoney(value: number, decimals: number): string {
  if (!Number.isFinite(value)) return '—';
  return `${value.toFixed(decimals)} ر.ي`;
}

function OperationLineVariantReadout({
  companyId,
  productId,
  productName,
  variantId,
}: {
  companyId: string;
  productId: string;
  productName: string;
  variantId?: string;
}) {
  const { data, isLoading } = useQuery({
    queryKey: ['inventory', 'operation-line-variant-label', companyId, productId],
    queryFn: async () => {
      try {
        return await fetchActiveProductVariants(companyId, productId);
      } catch {
        return [];
      }
    },
    enabled: Boolean(companyId && productId && variantId),
    staleTime: 5 * 60_000,
  });

  if (!productId) return <span className="text-muted-foreground">—</span>;
  if (!variantId) return <span>المنتج الأساسي</span>;
  if (isLoading) return <span className="text-muted-foreground">…</span>;

  const variant = data?.find((row) => row.id === variantId);
  const label = variant ? formatVariantCompactLabel(variant, productName) : '';
  return <span>{label || 'متغير'}</span>;
}

function statusBadgeVariant(
  status: WarehouseOperationStatus,
): 'subtle' | 'warning' | 'success' | 'destructive' {
  if (status === 'ready') return 'warning';
  if (status === 'done') return 'success';
  if (status === 'cancelled') return 'destructive';
  return 'subtle';
}

function OperationStatusStepper({ status }: { status: WarehouseOperationStatus }) {
  const cancelled = status === 'cancelled';
  const currentIndex = cancelled ? -1 : WAREHOUSE_OPERATION_FLOW_STEPS.indexOf(status);

  return (
    <div className="flex flex-wrap items-center gap-1" role="list" aria-label="مراحل المستند">
      {WAREHOUSE_OPERATION_FLOW_STEPS.map((step, index) => {
        const active = !cancelled && index === currentIndex;
        const passed = !cancelled && index < currentIndex;
        return (
          <div
            key={step}
            role="listitem"
            className={cn(
              'inv-stepper-item relative flex items-center justify-center px-4 py-2 text-xs font-semibold',
              index === 0 ? 'rounded-s-md' : '',
              index === WAREHOUSE_OPERATION_FLOW_STEPS.length - 1 ? 'rounded-e-md' : '',
              active
                ? 'bg-primary text-primary-foreground'
                : passed
                  ? 'bg-primary/15 text-primary'
                  : 'bg-muted text-muted-foreground',
            )}
          >
            {WAREHOUSE_OPERATION_STATUS_LABELS_AR[step]}
            {index < WAREHOUSE_OPERATION_FLOW_STEPS.length - 1 ? (
              <span
                aria-hidden
                className={cn(
                  'absolute -end-1.5 top-1/2 z-10 h-3 w-3 -translate-y-1/2 rotate-45 border-e border-t',
                  active
                    ? 'border-primary bg-primary'
                    : passed
                      ? 'border-primary/30 bg-primary/15'
                      : 'border-border bg-muted',
                )}
              />
            ) : null}
          </div>
        );
      })}
      {cancelled ? (
        <Badge variant="destructive" className="ms-2">
          ملغى
        </Badge>
      ) : null}
    </div>
  );
}

export function WarehouseOperationDetailDialog({ open, onOpenChange, operation }: Props) {
  const companyId = getInventoryCompanyId();
  const { data: inventorySettings } = useInventoryCompanySettings();
  const costDisplayDecimals = inventorySettings?.costDisplayDecimals ?? 2;
  const kind = operation?.kind ?? 'receipt';
  const { update, undo } = useWarehouseOperationMutations(operation?.warehouseId ?? '', kind);
  const destinationWarehouseId = operation?.destinationWarehouseId ?? '';

  const { data: locationsData } = useWarehouseLocations(
    {
      companyId,
      warehouseId: operation?.warehouseId,
      page: 1,
      limit: 200,
    },
    { enabled: open && Boolean(companyId && operation?.warehouseId) },
  );
  // Transfers land in another warehouse, so its locations are needed both for the
  // receiving picker and to name the destination instead of printing a raw id.
  const { data: destLocationsData } = useWarehouseLocations(
    {
      companyId,
      warehouseId: destinationWarehouseId || undefined,
      page: 1,
      limit: 200,
    },
    { enabled: open && Boolean(destinationWarehouseId) },
  );
  const { data: warehousesData } = useWarehouses(
    { companyId, limit: 100 },
    { enabled: open && Boolean(companyId) },
  );

  const { data: openProductReservations } = useOpenOperationProductReservations({
    companyId,
    warehouseId: operation?.warehouseId ?? '',
    kind: operation?.kind ?? kind,
    enabled:
      open &&
      Boolean(companyId && operation?.warehouseId && operation?.kind) &&
      supportsMultiProductLines(operation.kind),
  });

  const reservedProductIdsOtherDocs = React.useMemo(() => {
    const ref = operation?.reference ?? '';
    if (!ref) return [];
    return (openProductReservations ?? [])
      .filter((row) => row.operationReference !== ref)
      .map((row) => row.productId);
  }, [openProductReservations, operation?.reference]);

  const needsFullLines = open && operationNeedsFullLinesFetch(operation);
  const { data: fullOperation } = useQuery({
    queryKey: warehouseOperationsQueryKeys.detail(companyId, operation?.id ?? ''),
    queryFn: () => warehouseOperationsApi.getById(companyId, operation!.id),
    enabled: Boolean(companyId && operation?.id && needsFullLines),
  });
  const documentOperation = fullOperation ?? operation;
  const warehouseName = React.useMemo(() => {
    const map = new Map((warehousesData?.items ?? []).map((item) => [item.id, item.nameAr]));
    return (id?: string) => (id ? (map.get(id) ?? null) : null);
  }, [warehousesData?.items]);
  const locations = React.useMemo(
    () => (locationsData?.items ?? []).filter((item) => item.isActive),
    [locationsData?.items],
  );
  const destinationLocations = React.useMemo(
    () =>
      destinationWarehouseId
        ? (destLocationsData?.items ?? []).filter((item) => item.isActive)
        : locations,
    [destinationWarehouseId, destLocationsData?.items, locations],
  );
  const locationName = React.useMemo(() => {
    const map = new Map(
      [...locations, ...destinationLocations].map((item) => [item.id, item.nameAr || item.code]),
    );
    return (id?: string) => (id ? (map.get(id) ?? id) : '—');
  }, [locations, destinationLocations]);

  const formatLocationOption = React.useCallback(
    (id: string) => {
      const loc =
        locations.find((item) => item.id === id) ??
        destinationLocations.find((item) => item.id === id);
      if (!loc) return id;
      return `${loc.nameAr || loc.code} · ${loc.code}`;
    },
    [locations, destinationLocations],
  );

  const [headerFromLocationId, setHeaderFromLocationId] = React.useState('');
  const [headerToLocationId, setHeaderToLocationId] = React.useState('');

  const fromLocationOptions = React.useMemo(
    () => filterOperationFromLocations(kind, locations, headerToLocationId || undefined),
    [kind, locations, headerToLocationId],
  );
  const toLocationOptions = React.useMemo(
    () => filterOperationToLocations(kind, destinationLocations, headerFromLocationId || undefined),
    [kind, destinationLocations, headerFromLocationId],
  );

  const [lines, setLines] = React.useState<WarehouseOperationLine[]>([]);
  const [notes, setNotes] = React.useState('');
  const [partnerId, setPartnerId] = React.useState('');
  const [partnerName, setPartnerName] = React.useState('');
  const [sourceDocument, setSourceDocument] = React.useState('');
  const [occurredAt, setOccurredAt] = React.useState('');
  const [status, setStatus] = React.useState<WarehouseOperationStatus>('draft');
  const [tab, setTab] = React.useState('operations');
  const [availableByLineId, setAvailableByLineId] = React.useState<Record<string, number>>({});
  const loadedOperationIdRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!open || !documentOperation) return;
    if (needsFullLines && !fullOperation) return;
    const switched = loadedOperationIdRef.current !== documentOperation.id;
    loadedOperationIdRef.current = documentOperation.id;

    setLines(
      documentOperation.lines.map((line) => ({
        ...line,
        demandQuantity: line.demandQuantity ?? line.quantity,
        quantity: line.quantity,
      })),
    );
    setNotes(documentOperation.notes ?? '');
    setPartnerId(documentOperation.partnerId ?? '');
    setPartnerName(documentOperation.partnerName ?? '');
    setSourceDocument(documentOperation.sourceDocument ?? '');
    setOccurredAt(documentOperation.occurredAt.slice(0, 16));
    // Avoid flicker from stale list props:
    // - after validate: local done must not regress to ready
    // - after undo: local ready must not jump back to done
    setStatus((prev) => {
      if (switched) return documentOperation.status;
      const incoming = documentOperation.status;
      if (incoming === 'cancelled' || prev === 'cancelled') return incoming;
      if (prev === 'done' && (incoming === 'ready' || incoming === 'draft')) return prev;
      if (prev === 'ready' && incoming === 'done') return prev;
      return incoming;
    });
    setTab('operations');
    const first = documentOperation.lines[0];
    setHeaderFromLocationId(first?.fromLocationId ?? '');
    setHeaderToLocationId(first?.toLocationId ?? '');
  }, [open, documentOperation, needsFullLines, fullOperation]);

  React.useEffect(() => {
    if (!open) loadedOperationIdRef.current = null;
  }, [open]);

  const stockEffect = WAREHOUSE_OPERATION_KIND_META[kind].stockEffect;
  const checksSourceStock =
    stockEffect === 'outbound' || stockEffect === 'move' || stockEffect === 'transfer';

  React.useEffect(() => {
    if (!open || !documentOperation || !companyId || !checksSourceStock) {
      setAvailableByLineId({});
      return;
    }

    let cancelled = false;
    void (async () => {
      const next: Record<string, number> = {};
      await Promise.all(
        lines.map(async (line) => {
          const available = await readAvailableAtSourceLine({
            companyId,
            kind,
            line,
            fromLocationId: headerFromLocationId || undefined,
          });
          if (available != null) next[line.id] = available;
        }),
      );
      if (!cancelled) setAvailableByLineId(next);
    })();

    return () => {
      cancelled = true;
    };
  }, [open, documentOperation, companyId, kind, lines, headerFromLocationId, checksSourceStock]);

  function applyLineQuantity(
    lineId: string,
    field: 'demandQuantity' | 'quantity',
    nextValue: number,
  ) {
    const value = Math.max(0, nextValue);
    setLines((prev) =>
      prev.map((item) => {
        if (item.id !== lineId) return item;
        if (field === 'demandQuantity') {
          return {
            ...item,
            demandQuantity: value,
            quantity: status === 'draft' ? value : item.quantity,
          };
        }
        return { ...item, quantity: value };
      }),
    );
  }

  function applyLineUnitCost(lineId: string, nextValue: string) {
    setLines((prev) =>
      prev.map((item) => (item.id === lineId ? { ...item, unitCost: nextValue } : item)),
    );
  }

  async function assertStockBeforeSave(nextLines: WarehouseOperationLine[] = lines): Promise<boolean> {
    if (!documentOperation || !checksSourceStock) return true;
    const issues = await collectStockShortages({
      companyId: documentOperation.companyId,
      warehouseId: documentOperation.warehouseId,
      kind,
      destinationWarehouseId: documentOperation.destinationWarehouseId,
      lines: nextLines,
    });
    if (issues.length === 0) return true;
    toast.error(formatStockShortageMessage(issues[0]!));
    return false;
  }

  function normalizeMultiProductLines(options?: {
    allowEmpty?: boolean;
  }): WarehouseOperationLine[] | null {
    if (hasDuplicateOperationLineProducts(operationLinesToDrafts(lines))) {
      toast.error('لا يمكن تكرار نفس المنتج/المتغير في أكثر من سطر.');
      return null;
    }
    const hasIncomplete = lines.some(
      (line) => !line.productId?.trim() && ((line.demandQuantity ?? 0) > 0 || line.quantity > 0),
    );
    if (hasIncomplete) {
      toast.error('اختر منتجًا لكل سطر يحتوي على كمية.');
      return null;
    }
    const normalized = lines
      .filter(
        (line) => line.productId?.trim() && ((line.demandQuantity ?? 0) > 0 || line.quantity > 0),
      )
      .map((line) => ({
        ...line,
        productId: line.productId.trim(),
        fromLocationId: headerFromLocationId || line.fromLocationId,
        toLocationId: headerToLocationId || line.toLocationId,
      }));
    if (normalized.length === 0 && !options?.allowEmpty) {
      toast.error('أضف صنفًا واحدًا على الأقل مع كمية أكبر من صفر.');
      return null;
    }
    return normalized;
  }

  function addProductLine() {
    setLines((prev) => [
      ...prev,
      {
        id: newOperationLineDraftId(),
        productId: '',
        productName: '',
        sku: undefined,
        demandQuantity: 0,
        quantity: 0,
        fromLocationId: headerFromLocationId || undefined,
        toLocationId: headerToLocationId || undefined,
        unitCost: undefined,
      },
    ]);
  }

  function removeProductLine(lineId: string) {
    setLines((prev) => {
      const next = prev.filter((line) => line.id !== lineId);
      if (next.length > 0) return next;
      const blank = emptyOperationLineDraft();
      return [
        {
          id: blank.id,
          productId: '',
          productName: '',
          sku: undefined,
          demandQuantity: 0,
          quantity: 0,
          fromLocationId: headerFromLocationId || undefined,
          toLocationId: headerToLocationId || undefined,
        },
      ];
    });
  }

  function applyLineProduct(
    lineId: string,
    product: { id: string; nameAr: string; sku?: string } | null,
  ) {
    setLines((prev) =>
      prev.map((line) => {
        if (line.id !== lineId) return line;
        if (!product) {
          return {
            ...line,
            productId: '',
            productName: '',
            variantId: undefined,
            sku: undefined,
            demandQuantity: 0,
            quantity: 0,
          };
        }
        return {
          ...line,
          productId: product.id,
          productName: product.nameAr,
          variantId: undefined,
          sku: product.sku,
        };
      }),
    );
  }

  function applyLineVariant(
    lineId: string,
    variantId: string | undefined,
    variant?: ProductVariant,
  ) {
    setLines((prev) =>
      prev.map((line) => {
        if (line.id !== lineId) return line;
        if (!variantId || !variant) {
          return { ...line, variantId: undefined };
        }
        return {
          ...line,
          variantId: variant.id,
          sku: variant.sku || line.sku,
        };
      }),
    );
  }

  if (!documentOperation) return null;

  const editable = status === 'draft' || status === 'ready';
  const qtyEditable = status === 'draft' || status === 'ready';
  const multiProductMode = supportsMultiProductLines(kind);
  const canEditProducts = editable && status === 'draft' && multiProductMode;
  const isCountLike = kind === 'physical_count' || kind === 'adjustment';
  const showDemandColumn = !isCountLike;
  const showCostColumns = stockEffect === 'inbound';
  const lineColumnCount =
    5 + (showDemandColumn ? 1 : 0) + (showCostColumns ? 2 : 0) + (canEditProducts ? 1 : 0);
  const pricedLines = lines.filter((line) => line.productId?.trim());
  const demandTotal = pricedLines.reduce(
    (sum, line) => sum + (line.demandQuantity ?? line.quantity),
    0,
  );
  const executedTotal = pricedLines.reduce((sum, line) => sum + line.quantity, 0);
  const moneyTotal = pricedLines.reduce((sum, line) => {
    const unitCost = lineUnitCostNumber(line.unitCost);
    return unitCost == null ? sum : sum + unitCost * line.quantity;
  }, 0);
  const isSaving = update.isPending || undo.isPending;
  const meta = WAREHOUSE_OPERATION_KIND_META[kind];
  const needsFrom = meta.needsFrom;
  const needsTo = meta.needsTo;

  const destinationLabel = (() => {
    if (meta.stockEffect === 'inbound') return 'موقع الاستلام';
    if (meta.stockEffect === 'adjust_set') return 'موقع المخزون';
    if (meta.stockEffect === 'outbound') return 'موقع الصرف';
    if (meta.stockEffect === 'transfer') return 'مسار الحركة بين المستودعات';
    if (meta.stockEffect === 'move') return 'مسار الحركة بين المواقع';
    return 'المواقع';
  })();

  // Each side of the route names its warehouse, so a same-named location on both
  // ends (WH/Stock → WH/Stock) still reads unambiguously.
  const crossWarehouse = Boolean(
    destinationWarehouseId && destinationWarehouseId !== documentOperation.warehouseId,
  );
  const sourceWarehouseName = warehouseName(documentOperation.warehouseId);
  const targetWarehouseName = crossWarehouse
    ? warehouseName(destinationWarehouseId)
    : sourceWarehouseName;
  const fromFieldLabel =
    kind === 'issue'
      ? 'موقع المخزون (من)'
      : meta.stockEffect === 'move'
        ? 'الموقع الحالي'
        : 'موقع الصرف';
  const toFieldLabel =
    kind === 'issue'
      ? 'موقع العميل (إلى)'
      : meta.stockEffect === 'move'
        ? 'الموقع الجديد'
        : meta.stockEffect === 'adjust_set'
          ? 'موقع المخزون'
          : 'موقع الاستلام';

  const destinationLine = lines[0] ?? documentOperation.lines[0];

  async function savePatch(
    patch: Partial<WarehouseOperation> & { lines?: WarehouseOperation['lines'] },
    successMessage: string,
    options?: { includeLines?: boolean },
  ) {
    if (!companyId || !documentOperation) return;
    const includeLines = options?.includeLines === true || patch.lines !== undefined;

    // Backend locks fully validated ops — use undoValidation for done → ready.
    if (status === 'done' || documentOperation.status === 'done') {
      toast.error('لا يمكن تعديل مستند منتهٍ. استخدم «تراجع عن التصديق» أولاً.');
      return;
    }

    try {
      const updated = await update.mutateAsync({
        companyId,
        id: documentOperation.id,
        patch: {
          ...patch,
          ...(includeLines ? { lines: patch.lines ?? lines } : {}),
          notes: notes.trim() || undefined,
          partnerId: partnerId.trim() || null,
          partnerName: partnerName.trim() || undefined,
          sourceDocument: sourceDocument.trim() || undefined,
          occurredAt: occurredAt ? new Date(occurredAt).toISOString() : documentOperation.occurredAt,
        },
      });
      if (!updated) {
        toast.error('تعذر تحديث المستند.');
        return;
      }
      setStatus(updated.status);
      setLines(updated.lines.map((line) => ({ ...line })));
      setHeaderFromLocationId(updated.lines[0]?.fromLocationId ?? '');
      setHeaderToLocationId(updated.lines[0]?.toLocationId ?? '');
      toast.success(successMessage);
    } catch {
      // ApiError already toasted in useWarehouseOperationMutations.onError
    }
  }

  async function markReady() {
    if (multiProductMode) {
      const normalized = normalizeMultiProductLines();
      if (!normalized) return;
      if (!(await assertStockBeforeSave(normalized))) return;
      await savePatch({ status: 'ready', lines: normalized }, 'تم تحديد المستند كجاهز');
      return;
    }
    if (!(await assertStockBeforeSave())) return;
    // Header only — avoid rewriting lines on every status change.
    await savePatch({ status: 'ready' }, 'تم تحديد المستند كجاهز');
  }

  async function validate() {
    const isCountLike = kind === 'physical_count' || kind === 'adjustment';
    let linesToValidate = lines;
    if (multiProductMode) {
      const normalized = normalizeMultiProductLines();
      if (!normalized) return;
      linesToValidate = normalized;
    }
    const invalid = linesToValidate.some(
      (line) => line.quantity < 0 || (!isCountLike && line.demandQuantity <= 0),
    );
    if (invalid) {
      toast.error('تحقق من كميات البنود قبل التصديق.');
      return;
    }
    if (!(await assertStockBeforeSave(linesToValidate))) return;
    await savePatch({ status: 'done', lines: linesToValidate }, 'تم تصديق المستند');
  }

  async function undoValidation() {
    if (!companyId || !documentOperation) return;
    if (status !== 'done' && documentOperation.status !== 'done') {
      toast.error('التراجع متاح فقط للمستندات المصدّقة (done).');
      return;
    }
    try {
      const updated = await undo.mutateAsync({ companyId, id: documentOperation.id });
      setStatus(updated.status);
      setLines(updated.lines.map((line) => ({ ...line })));
      setHeaderFromLocationId(updated.lines[0]?.fromLocationId ?? '');
      setHeaderToLocationId(updated.lines[0]?.toLocationId ?? '');
      toast.success('تم التراجع عن التصديق — المستند جاهز للتعديل');
    } catch {
      // ApiError already toasted in useWarehouseOperationMutations.onError
    }
  }

  async function cancelOperation() {
    if (status === 'done' || documentOperation.status === 'done') {
      toast.error('لا يمكن إلغاء مستند منتهٍ. استخدم التراجع عن التصديق أولاً.');
      return;
    }
    await savePatch({ status: 'cancelled' }, 'تم إلغاء المستند');
  }

  async function fillTheoreticalFromStock() {
    if (!companyId || !documentOperation) return;
    const isCountLike = kind === 'physical_count' || kind === 'adjustment';
    if (!isCountLike || !editable) return;

    try {
      const next = await Promise.all(
        lines.map(async (line) => {
          if (!line.productId || !line.toLocationId) return line;
          const theoretical = await inventoryStockService.getQuantityAtLocation(
            companyId,
            line.productId,
            line.toLocationId,
            line.variantId,
          );
          return { ...line, demandQuantity: theoretical };
        }),
      );
      setLines(next);
      toast.success('تم تعبئة الكمية النظامية من مخزون المواقع');
    } catch {
      toast.error('تعذر قراءة رصيد المواقع');
    }
  }

  async function saveDraftChanges() {
    let linesToSave = lines;
    if (multiProductMode) {
      // An unfinished draft may intentionally contain no products. Readying or
      // validating it still requires at least one complete line.
      const normalized = normalizeMultiProductLines({ allowEmpty: status === 'draft' });
      if (!normalized) return;
      linesToSave = normalized;
    }
    if (!(await assertStockBeforeSave(linesToSave))) return;
    await savePatch({ status, lines: linesToSave }, 'تم حفظ التعديلات');
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(dialogShellContentClass, 'max-w-6xl sm:max-w-6xl')}>
        <div className={dialogShellHeaderClass}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <DialogTitle className="flex flex-wrap items-center gap-2 text-base font-semibold">
                <span dir="ltr">{documentOperation.reference || 'بدون مرجع'}</span>
                <Badge variant={statusBadgeVariant(status)}>
                  {WAREHOUSE_OPERATION_STATUS_LABELS_AR[status]}
                </Badge>
              </DialogTitle>
              <p className="text-xs text-muted-foreground">
                {WAREHOUSE_OPERATION_KIND_LABELS_AR[kind]} · متابعة ومعالجة المستند
              </p>
            </div>
            <OperationStatusStepper status={status} />
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            {status === 'draft' ? (
              <Button type="button" size="sm" disabled={isSaving} onClick={() => void markReady()}>
                <Check className="h-4 w-4" />
                تحديد كجاهز
              </Button>
            ) : null}
            {status === 'ready' ? (
              <Button type="button" size="sm" disabled={isSaving} onClick={() => void validate()}>
                <Check className="h-4 w-4" />
                تصديق
              </Button>
            ) : null}
            {status === 'done' ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isSaving}
                onClick={() => void undoValidation()}
              >
                <Undo2 className="h-4 w-4" />
                تراجع عن التصديق
              </Button>
            ) : null}
            {editable ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isSaving}
                onClick={() => void saveDraftChanges()}
              >
                حفظ
              </Button>
            ) : null}
            {status !== 'done' && status !== 'cancelled' ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isSaving}
                onClick={() => void cancelOperation()}
              >
                <X className="h-4 w-4" />
                إلغاء
              </Button>
            ) : null}
            {(kind === 'physical_count' || kind === 'adjustment') && editable ? (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={isSaving}
                onClick={() => void fillTheoreticalFromStock()}
              >
                تعبئة النظامي من المخزون
              </Button>
            ) : null}
          </div>
        </div>

        <div className={cn(dialogShellBodyClass, 'space-y-5')}>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label>
                  {kind === 'issue' ? 'الصرف إلى' : kind === 'receipt' ? 'الاستلام من' : 'الطرف'}
                </Label>
                <PartnerSinglePicker
                  companyId={companyId}
                  value={partnerId}
                  onChange={setPartnerId}
                  onPartnerSelect={(partner) => setPartnerName(partner.displayName)}
                  disabled={!editable}
                  deferSearchUntilOpen
                  placeholder="اختر جهة اتصال (اختياري)"
                />
                <Input
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  disabled={!editable || Boolean(partnerId)}
                  placeholder="أو اكتب اسمًا يدويًا إن لم تجد جهة الاتصال"
                  className="mt-1.5"
                />
              </div>
              <div className="space-y-1.5">
                <Label>نوع العملية</Label>
                <Input value={WAREHOUSE_OPERATION_KIND_LABELS_AR[kind]} disabled />
              </div>
              <div className="space-y-1.5">
                <Label>{destinationLabel}</Label>
                <div className="space-y-2 rounded-md border border-input bg-muted/20 p-2.5">
                  {needsFrom ? (
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-medium text-muted-foreground">من</span>
                        <WarehouseChip name={sourceWarehouseName} />
                      </div>
                      {editable ? (
                        <Select
                          value={headerFromLocationId || ''}
                          onValueChange={(value) => {
                            setHeaderFromLocationId(value);
                            setLines((prev) =>
                              prev.map((line) => ({
                                ...line,
                                fromLocationId: value || undefined,
                                ...(needsTo
                                  ? { toLocationId: headerToLocationId || line.toLocationId }
                                  : {}),
                              })),
                            );
                          }}
                        >
                          <SelectTrigger aria-label={fromFieldLabel}>
                            <SelectValue placeholder={`اختر ${fromFieldLabel}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {fromLocationOptions.map((location) => (
                              <SelectItem key={location.id} value={location.id}>
                                {formatLocationOption(location.id)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <LocationChip
                          name={locationName(destinationLine?.fromLocationId)}
                          label={fromFieldLabel}
                        />
                      )}
                    </div>
                  ) : null}

                  {needsFrom && needsTo ? (
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <ArrowDown aria-hidden className="h-3.5 w-3.5 shrink-0" />
                      <span aria-hidden className="h-px flex-1 bg-border" />
                    </div>
                  ) : null}

                  {needsTo ? (
                    <div className="space-y-1.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="text-xs font-medium text-muted-foreground">إلى</span>
                        <WarehouseChip name={targetWarehouseName} />
                      </div>
                      {editable ? (
                        <Select
                          value={headerToLocationId || ''}
                          onValueChange={(value) => {
                            setHeaderToLocationId(value);
                            setLines((prev) =>
                              prev.map((line) => ({
                                ...line,
                                toLocationId: value || undefined,
                                ...(needsFrom
                                  ? { fromLocationId: headerFromLocationId || line.fromLocationId }
                                  : {}),
                              })),
                            );
                          }}
                        >
                          <SelectTrigger aria-label={toFieldLabel}>
                            <SelectValue placeholder={`اختر ${toFieldLabel}`} />
                          </SelectTrigger>
                          <SelectContent>
                            {toLocationOptions.map((location) => (
                              <SelectItem key={location.id} value={location.id}>
                                {formatLocationOption(location.id)}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      ) : (
                        <LocationChip
                          name={locationName(destinationLine?.toLocationId)}
                          label={toFieldLabel}
                        />
                      )}
                    </div>
                  ) : null}
                </div>
              </div>
            </div>
            <div className="space-y-3">
              <div className="space-y-1.5">
                <Label htmlFor="op-detail-date">التاريخ المجدول</Label>
                <Input
                  id="op-detail-date"
                  type="datetime-local"
                  dir="ltr"
                  value={occurredAt}
                  onChange={(e) => setOccurredAt(e.target.value)}
                  disabled={!editable}
                />
              </div>
              <div className="space-y-1.5">
                <Label>المستند المصدر</Label>
                <Input
                  value={sourceDocument}
                  onChange={(e) => setSourceDocument(e.target.value)}
                  disabled={!editable}
                  placeholder="مثال: تجديد المخزون يدويًا"
                />
              </div>
            </div>
          </div>

          <Tabs value={tab} onValueChange={setTab} dir="rtl" className="space-y-3">
            <TabsList className="sto-tabs-scroll h-auto w-full justify-start rounded-2xl border border-border/80 bg-muted/40 p-1">
              <TabsTrigger value="operations" className={OPERATION_FORM_TAB_TRIGGER}>
                الأصناف
              </TabsTrigger>
              <TabsTrigger value="notes" className={OPERATION_FORM_TAB_TRIGGER}>
                الملاحظات
              </TabsTrigger>
            </TabsList>

            <TabsContent value="operations" className="mt-3 space-y-3">
              <div className="flex items-center justify-between gap-2">
                <p className="text-xs text-muted-foreground">
                  {pricedLines.length} {pricedLines.length === 1 ? 'صنف' : 'أصناف'}
                </p>
                {canEditProducts ? (
                  <Button type="button" variant="outline" size="sm" disabled={isSaving} onClick={addProductLine}>
                    <Plus className="me-1 h-3.5 w-3.5" />
                    إضافة صنف
                  </Button>
                ) : null}
              </div>
              <div className="overflow-x-auto rounded-xl border border-border bg-card">
                <table className="w-full min-w-[52rem] border-collapse text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/40 text-xs text-muted-foreground">
                      <th scope="col" className="w-12 px-3 py-2.5 text-center font-medium">
                        #
                      </th>
                      <th scope="col" className="min-w-[14rem] px-3 py-2.5 text-start font-medium">
                        المنتج
                      </th>
                      <th scope="col" className="min-w-[9rem] px-3 py-2.5 text-start font-medium">
                        المتغير
                      </th>
                      {showDemandColumn ? (
                        <th scope="col" className="min-w-[7rem] px-3 py-2.5 text-center font-medium">
                          كمية الطلب
                        </th>
                      ) : null}
                      <th scope="col" className="min-w-[7.5rem] px-3 py-2.5 text-center font-medium">
                        {isCountLike ? 'الكمية المعدودة' : 'الكمية المُنفَّذة'}
                      </th>
                      <th scope="col" className="min-w-[5rem] px-3 py-2.5 text-center font-medium">
                        الوحدة
                      </th>
                      {showCostColumns ? (
                        <th scope="col" className="min-w-[8.5rem] px-3 py-2.5 text-center font-medium">
                          تكلفة الشراء
                        </th>
                      ) : null}
                      {showCostColumns ? (
                        <th scope="col" className="min-w-[8rem] px-3 py-2.5 text-center font-medium">
                          الإجمالي
                        </th>
                      ) : null}
                      {canEditProducts ? <th scope="col" className="w-12 px-2 py-2.5" /> : null}
                    </tr>
                  </thead>
                  <tbody>
                    {lines.length === 0 ? (
                      <tr>
                        <td
                          colSpan={lineColumnCount}
                          className="px-3 py-8 text-center text-sm text-muted-foreground"
                        >
                          لا توجد أصناف في هذا المستند.
                        </td>
                      </tr>
                    ) : (
                      lines.map((line, index) => {
                        const available = availableByLineId[line.id];
                        const maxQty =
                          checksSourceStock && available != null
                            ? maxQuantityForLine({
                                lines,
                                lineId: line.id,
                                availableAtLocation: available,
                                fromLocationId: headerFromLocationId || undefined,
                              })
                            : null;
                        const demand = line.demandQuantity ?? line.quantity;
                        const gap = demand - line.quantity;
                        const unitCost = lineUnitCostNumber(line.unitCost);
                        const lineTotal = unitCost == null ? null : unitCost * line.quantity;

                        return (
                          <tr
                            key={line.id}
                            className="border-b border-border align-top last:border-0 even:bg-muted/20"
                          >
                            <td className="px-3 py-3 text-center text-xs tabular-nums text-muted-foreground">
                              {index + 1}
                            </td>
                            <td className="px-3 py-3">
                              {canEditProducts ? (
                                <div className="space-y-1">
                                  <ProductSinglePicker
                                    companyId={companyId ?? ''}
                                    value={line.productId}
                                    status="active"
                                    disabled={isSaving}
                                    excludeIds={reservedProductIdsOtherDocs}
                                    sourceLocationId={
                                      pickerUsesSourceLocationStock(kind)
                                        ? headerFromLocationId || undefined
                                        : undefined
                                    }
                                    placeholder={
                                      pickerUsesSourceLocationStock(kind) && !headerFromLocationId
                                        ? 'حدّد موقع الصرف أولًا…'
                                        : 'ابحث عن منتج…'
                                    }
                                    onChange={(productId) => {
                                      if (!productId) applyLineProduct(line.id, null);
                                    }}
                                    onProductSelect={(product) => applyLineProduct(line.id, product)}
                                  />
                                  {line.sku ? (
                                    <p className="text-[11px] text-muted-foreground" dir="ltr">
                                      {line.sku}
                                    </p>
                                  ) : null}
                                </div>
                              ) : (
                                <div className="min-w-0">
                                  <p className="font-medium leading-snug text-foreground">
                                    {line.productName || '—'}
                                  </p>
                                  {line.sku ? (
                                    <p className="mt-0.5 text-[11px] text-muted-foreground" dir="ltr">
                                      {line.sku}
                                    </p>
                                  ) : null}
                                </div>
                              )}
                            </td>
                            <td className="px-3 py-3">
                              {canEditProducts && line.productId ? (
                                <OperationLineVariantSelect
                                  companyId={companyId ?? ''}
                                  productId={line.productId}
                                  catalogProductName={line.productName}
                                  variantId={line.variantId}
                                  disabled={isSaving}
                                  onChange={(nextId, variant) =>
                                    applyLineVariant(line.id, nextId, variant)
                                  }
                                />
                              ) : (
                                <p className="text-sm leading-snug text-foreground">
                                  <OperationLineVariantReadout
                                    companyId={companyId ?? ''}
                                    productId={line.productId}
                                    productName={line.productName}
                                    variantId={line.variantId}
                                  />
                                </p>
                              )}
                            </td>
                            {showDemandColumn ? (
                              <td className="px-3 py-3 text-center">
                                {editable && status !== 'ready' ? (
                                  <FlexibleQuantityInput
                                    className="mx-auto h-9 w-full max-w-[7rem] text-center"
                                    value={demand}
                                    max={maxQty}
                                    disabled={!editable || status === 'ready' || isSaving}
                                    aria-label="كمية الطلب"
                                    onChange={(value) =>
                                      applyLineQuantity(line.id, 'demandQuantity', value)
                                    }
                                  />
                                ) : (
                                  <p className="font-semibold tabular-nums">{formatLineQuantity(demand)}</p>
                                )}
                                {checksSourceStock && available != null ? (
                                  <p className="mt-1 text-[11px] text-muted-foreground">
                                    المتاح {formatLineQuantity(available)}
                                  </p>
                                ) : null}
                              </td>
                            ) : null}
                            <td className="px-3 py-3 text-center">
                              {qtyEditable ? (
                                <FlexibleQuantityInput
                                  className="mx-auto h-9 w-full max-w-[7rem] text-center"
                                  value={line.quantity}
                                  max={maxQty}
                                  disabled={!qtyEditable || isSaving}
                                  aria-label={isCountLike ? 'الكمية المعدودة' : 'الكمية المنفذة'}
                                  onChange={(value) => applyLineQuantity(line.id, 'quantity', value)}
                                />
                              ) : (
                                <p className="font-semibold tabular-nums">
                                  {formatLineQuantity(line.quantity)}
                                </p>
                              )}
                              {showDemandColumn && Math.abs(gap) >= 1e-9 ? (
                                <p
                                  className={cn(
                                    'mt-1 text-[11px]',
                                    gap > 0
                                      ? 'text-amber-700 dark:text-amber-400'
                                      : 'text-sky-700 dark:text-sky-400',
                                  )}
                                >
                                  {gap > 0
                                    ? `ناقص ${formatLineQuantity(gap)}`
                                    : `زائد ${formatLineQuantity(Math.abs(gap))}`}
                                </p>
                              ) : null}
                            </td>
                            <td className="px-3 py-3 text-center text-sm text-foreground">وحدات</td>
                            {showCostColumns ? (
                              <td className="px-3 py-3">
                                {canEditProducts ? (
                                  <OperationUnitCostInput
                                    value={line.unitCost ?? ''}
                                    disabled={isSaving || !line.productId}
                                    showRequiredHint={Boolean(line.productId)}
                                    onChange={(raw) => applyLineUnitCost(line.id, raw)}
                                  />
                                ) : (
                                  <p className="text-center font-semibold tabular-nums">
                                    {unitCost == null
                                      ? '—'
                                      : formatLineMoney(unitCost, costDisplayDecimals)}
                                  </p>
                                )}
                              </td>
                            ) : null}
                            {showCostColumns ? (
                              <td className="px-3 py-3 text-center font-semibold tabular-nums">
                                {lineTotal == null
                                  ? '—'
                                  : formatLineMoney(lineTotal, costDisplayDecimals)}
                              </td>
                            ) : null}
                            {canEditProducts ? (
                              <td className="px-2 py-3">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8"
                                  disabled={isSaving}
                                  aria-label="حذف السطر"
                                  onClick={() => removeProductLine(line.id)}
                                >
                                  <Trash2 className="h-4 w-4 text-destructive" />
                                </Button>
                              </td>
                            ) : null}
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                  {pricedLines.length > 0 ? (
                    <tfoot>
                      <tr className="border-t border-border bg-muted/30 text-sm font-semibold">
                        <td colSpan={3} className="px-3 py-2.5 text-start">
                          الإجمالي
                        </td>
                        {showDemandColumn ? (
                          <td className="px-3 py-2.5 text-center tabular-nums">
                            {formatLineQuantity(demandTotal)}
                          </td>
                        ) : null}
                        <td className="px-3 py-2.5 text-center tabular-nums">
                          {formatLineQuantity(executedTotal)}
                        </td>
                        <td />
                        {showCostColumns ? <td /> : null}
                        {showCostColumns ? (
                          <td className="px-3 py-2.5 text-center tabular-nums">
                            {formatLineMoney(moneyTotal, costDisplayDecimals)}
                          </td>
                        ) : null}
                        {canEditProducts ? <td /> : null}
                      </tr>
                    </tfoot>
                  ) : null}
                </table>
              </div>
            </TabsContent>

            <TabsContent value="notes" className="mt-3">
              <Textarea
                className="min-h-[120px] resize-none"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                disabled={!editable}
                placeholder="ملاحظات داخلية حول هذا المستند…"
              />
            </TabsContent>
          </Tabs>
        </div>

        <DialogFooter className="shrink-0 gap-2 border-t border-border px-6 py-4 sm:justify-start">
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isSaving}>
            إغلاق
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
