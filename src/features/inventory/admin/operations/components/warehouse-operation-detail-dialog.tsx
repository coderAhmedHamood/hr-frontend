'use client';

import * as React from 'react';
import { ArrowDown, Check, Plus, Trash2, Undo2, X } from 'lucide-react';
import { toast } from 'sonner';
import { getInventoryCompanyId } from '@/features/inventory/lib/company-id';
import { useWarehouseLocations } from '@/features/inventory/admin/locations/hooks/use-warehouse-locations';
import { useWarehouses } from '@/features/inventory/admin/warehouses/hooks/use-warehouses';
import { useWarehouseOperationMutations } from '@/features/inventory/admin/operations/hooks/use-warehouse-operation-mutations';
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
} from '@/features/inventory/admin/operations/lib/operation-line-draft';
import { cn } from '@/shared/utils';

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  operation: WarehouseOperation | null;
};

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
  const kind = operation?.kind ?? 'receipt';
  const { update, undo } = useWarehouseOperationMutations(operation?.warehouseId ?? '', kind);
  const { data: locationsData } = useWarehouseLocations({
    companyId,
    warehouseId: operation?.warehouseId,
    page: 1,
    limit: 500,
  });
  // Transfers land in another warehouse, so its locations are needed both for the
  // receiving picker and to name the destination instead of printing a raw id.
  const destinationWarehouseId = operation?.destinationWarehouseId ?? '';
  const { data: destLocationsData } = useWarehouseLocations(
    {
      companyId,
      warehouseId: destinationWarehouseId || undefined,
      page: 1,
      limit: 500,
    },
    { enabled: Boolean(destinationWarehouseId) },
  );
  const { data: warehousesData } = useWarehouses({ companyId, limit: 100 });
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

  const [lines, setLines] = React.useState<WarehouseOperationLine[]>([]);
  const [notes, setNotes] = React.useState('');
  const [partnerName, setPartnerName] = React.useState('');
  const [sourceDocument, setSourceDocument] = React.useState('');
  const [occurredAt, setOccurredAt] = React.useState('');
  const [status, setStatus] = React.useState<WarehouseOperationStatus>('draft');
  const [tab, setTab] = React.useState('operations');
  const [headerFromLocationId, setHeaderFromLocationId] = React.useState('');
  const [headerToLocationId, setHeaderToLocationId] = React.useState('');
  const [availableByLineId, setAvailableByLineId] = React.useState<Record<string, number>>({});
  const loadedOperationIdRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!open || !operation) return;
    const switched = loadedOperationIdRef.current !== operation.id;
    loadedOperationIdRef.current = operation.id;

    setLines(
      operation.lines.map((line) => ({
        ...line,
        demandQuantity: line.demandQuantity ?? line.quantity,
        quantity: line.quantity,
      })),
    );
    setNotes(operation.notes ?? '');
    setPartnerName(operation.partnerName ?? '');
    setSourceDocument(operation.sourceDocument ?? '');
    setOccurredAt(operation.occurredAt.slice(0, 16));
    // Avoid flicker from stale list props:
    // - after validate: local done must not regress to ready
    // - after undo: local ready must not jump back to done
    setStatus((prev) => {
      if (switched) return operation.status;
      const incoming = operation.status;
      if (incoming === 'cancelled' || prev === 'cancelled') return incoming;
      if (prev === 'done' && (incoming === 'ready' || incoming === 'draft')) return prev;
      if (prev === 'ready' && incoming === 'done') return prev;
      return incoming;
    });
    setTab('operations');
    const first = operation.lines[0];
    setHeaderFromLocationId(first?.fromLocationId ?? '');
    setHeaderToLocationId(first?.toLocationId ?? '');
  }, [open, operation]);

  React.useEffect(() => {
    if (!open) loadedOperationIdRef.current = null;
  }, [open]);

  const stockEffect = WAREHOUSE_OPERATION_KIND_META[kind].stockEffect;
  const checksSourceStock =
    stockEffect === 'outbound' || stockEffect === 'move' || stockEffect === 'transfer';

  React.useEffect(() => {
    if (!open || !operation || !companyId || !checksSourceStock) {
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
  }, [open, operation, companyId, kind, lines, headerFromLocationId, checksSourceStock]);

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

  async function assertStockBeforeSave(nextLines: WarehouseOperationLine[] = lines): Promise<boolean> {
    if (!operation || !checksSourceStock) return true;
    const issues = await collectStockShortages({
      companyId: operation.companyId,
      warehouseId: operation.warehouseId,
      kind,
      destinationWarehouseId: operation.destinationWarehouseId,
      lines: nextLines,
    });
    if (issues.length === 0) return true;
    toast.error(formatStockShortageMessage(issues[0]!));
    return false;
  }

  function normalizeMultiProductLines(): WarehouseOperationLine[] | null {
    if (hasDuplicateOperationLineProducts(operationLinesToDrafts(lines))) {
      toast.error('لا يمكن تكرار نفس المنتج في أكثر من سطر.');
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
    if (normalized.length === 0) {
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
          return { ...line, productId: '', productName: '', sku: undefined };
        }
        return {
          ...line,
          productId: product.id,
          productName: product.nameAr,
          sku: product.sku,
        };
      }),
    );
  }

  if (!operation) return null;

  const editable = status === 'draft' || status === 'ready';
  const qtyEditable = status === 'draft' || status === 'ready';
  const multiProductMode = supportsMultiProductLines(kind);
  const canEditProducts = editable && status === 'draft' && multiProductMode;
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
    destinationWarehouseId && destinationWarehouseId !== operation.warehouseId,
  );
  const sourceWarehouseName = warehouseName(operation.warehouseId);
  const targetWarehouseName = crossWarehouse
    ? warehouseName(destinationWarehouseId)
    : sourceWarehouseName;
  const fromFieldLabel = meta.stockEffect === 'move' ? 'الموقع الحالي' : 'موقع الصرف';
  const toFieldLabel =
    meta.stockEffect === 'move'
      ? 'الموقع الجديد'
      : meta.stockEffect === 'adjust_set'
        ? 'موقع المخزون'
        : 'موقع الاستلام';

  const destinationLine = lines[0] ?? operation.lines[0];

  async function savePatch(
    patch: Partial<WarehouseOperation> & { lines?: WarehouseOperation['lines'] },
    successMessage: string,
    options?: { includeLines?: boolean },
  ) {
    if (!companyId || !operation) return;
    const includeLines = options?.includeLines === true || patch.lines !== undefined;

    // Backend locks fully validated ops — use undoValidation for done → ready.
    if (status === 'done' || operation.status === 'done') {
      toast.error('لا يمكن تعديل مستند منتهٍ. استخدم «تراجع عن التصديق» أولاً.');
      return;
    }

    try {
      const updated = await update.mutateAsync({
        companyId,
        id: operation.id,
        patch: {
          ...patch,
          ...(includeLines ? { lines: patch.lines ?? lines } : {}),
          notes: notes.trim() || undefined,
          partnerName: partnerName.trim() || undefined,
          sourceDocument: sourceDocument.trim() || undefined,
          occurredAt: occurredAt ? new Date(occurredAt).toISOString() : operation.occurredAt,
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
    if (!companyId || !operation) return;
    if (status !== 'done' && operation.status !== 'done') {
      toast.error('التراجع متاح فقط للمستندات المصدّقة (done).');
      return;
    }
    try {
      const updated = await undo.mutateAsync({ companyId, id: operation.id });
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
    if (status === 'done' || operation?.status === 'done') {
      toast.error('لا يمكن إلغاء مستند منتهٍ. استخدم التراجع عن التصديق أولاً.');
      return;
    }
    await savePatch({ status: 'cancelled' }, 'تم إلغاء المستند');
  }

  async function fillTheoreticalFromStock() {
    if (!companyId || !operation) return;
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
      const normalized = normalizeMultiProductLines();
      if (!normalized) return;
      linesToSave = normalized;
    }
    if (!(await assertStockBeforeSave(linesToSave))) return;
    await savePatch({ status, lines: linesToSave }, 'تم حفظ التعديلات');
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(dialogShellContentClass, 'max-w-4xl sm:max-w-4xl')}>
        <div className={dialogShellHeaderClass}>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1">
              <DialogTitle className="flex flex-wrap items-center gap-2 text-base font-semibold">
                <span dir="ltr">{operation.reference || 'بدون مرجع'}</span>
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
                <Input
                  value={partnerName}
                  onChange={(e) => setPartnerName(e.target.value)}
                  disabled={!editable}
                  placeholder="اختياري"
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
                            {locations.map((location) => (
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
                            {destinationLocations.map((location) => (
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

          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="h-auto w-full justify-start gap-0 rounded-none border-b border-border bg-transparent p-0">
              <TabsTrigger
                value="operations"
                className="rounded-none border-b-2 border-transparent px-3 py-2.5 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                العمليات
              </TabsTrigger>
              <TabsTrigger
                value="notes"
                className="rounded-none border-b-2 border-transparent px-3 py-2.5 data-[state=active]:border-primary data-[state=active]:bg-transparent data-[state=active]:shadow-none"
              >
                الملاحظات
              </TabsTrigger>
            </TabsList>

            <TabsContent value="operations" className="mt-3 space-y-2">
              {canEditProducts ? (
                <div className="flex justify-end">
                  <Button type="button" variant="outline" size="sm" disabled={isSaving} onClick={addProductLine}>
                    <Plus className="me-1 h-3.5 w-3.5" />
                    إضافة صنف
                  </Button>
                </div>
              ) : null}
              <div className="overflow-hidden rounded-lg border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/30 text-muted-foreground">
                      <th className="px-3 py-2.5 text-start font-medium">المنتج</th>
                      <th className="px-3 py-2.5 text-start font-medium">الطلب</th>
                      <th className="px-3 py-2.5 text-start font-medium">الكمية</th>
                      <th className="px-3 py-2.5 text-start font-medium">الوحدة</th>
                      {canEditProducts ? <th className="w-10 px-2 py-2.5" /> : null}
                    </tr>
                  </thead>
                  <tbody>
                    {lines.map((line) => {
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

                      return (
                      <tr key={line.id} className="border-b border-border last:border-0 align-top">
                        <td className="px-3 py-2.5">
                          {canEditProducts ? (
                            <>
                              <ProductSinglePicker
                                companyId={companyId ?? ''}
                                value={line.productId}
                                status="active"
                                disabled={isSaving}
                                placeholder="ابحث عن منتج…"
                                onChange={(productId) => {
                                  if (!productId) applyLineProduct(line.id, null);
                                }}
                                onProductSelect={(product) => applyLineProduct(line.id, product)}
                              />
                              {line.sku ? (
                                <div className="mt-1 text-xs text-muted-foreground" dir="ltr">
                                  {line.sku}
                                </div>
                              ) : null}
                            </>
                          ) : (
                            <>
                              <div className="font-medium">{line.productName}</div>
                              {line.sku ? (
                                <div className="text-xs text-muted-foreground" dir="ltr">
                                  {line.sku}
                                </div>
                              ) : null}
                              <div className="mt-0.5 text-xs text-muted-foreground">
                                {line.variantId ? 'متغير' : 'المنتج الأساسي'}
                              </div>
                            </>
                          )}
                        </td>
                        <td className="px-3 py-2.5">
                          <FlexibleQuantityInput
                            className="h-8 w-24"
                            value={line.demandQuantity ?? 0}
                            max={maxQty}
                            disabled={!editable || status === 'ready'}
                            onChange={(value) => {
                              applyLineQuantity(line.id, 'demandQuantity', value);
                            }}
                          />
                          {checksSourceStock && available != null ? (
                            <p className="mt-1 text-[11px] text-muted-foreground">
                              المتاح في الموقع: {available}
                            </p>
                          ) : null}
                        </td>
                        <td className="px-3 py-2.5">
                          <FlexibleQuantityInput
                            className="h-8 w-24"
                            value={line.quantity}
                            max={maxQty}
                            disabled={!qtyEditable}
                            onChange={(value) => {
                              applyLineQuantity(line.id, 'quantity', value);
                            }}
                          />
                        </td>
                        <td className="px-3 py-2.5 text-muted-foreground">الوحدات</td>
                        {canEditProducts ? (
                          <td className="px-2 py-2.5">
                            <Button
                              type="button"
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8"
                              disabled={isSaving || lines.length <= 1}
                              aria-label="حذف السطر"
                              onClick={() => removeProductLine(line.id)}
                            >
                              <Trash2 className="h-4 w-4 text-destructive" />
                            </Button>
                          </td>
                        ) : null}
                      </tr>
                      );
                    })}
                  </tbody>
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
