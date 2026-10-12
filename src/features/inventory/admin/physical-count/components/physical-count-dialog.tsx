'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Download, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { ApiError } from '@/features/hr/lib/api/client';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { warehouseOperationsQueryKeys } from '@/features/inventory/admin/hooks/query-keys';
import { useWarehouseLocations } from '@/features/inventory/admin/locations/hooks/use-warehouse-locations';
import { warehouseOperationsApi } from '@/features/inventory/admin/operations/lib/api/warehouse-operations';
import { useWarehouses } from '@/features/inventory/admin/warehouses/hooks/use-warehouses';
import { getInventoryCompanyId } from '@/features/inventory/lib/company-id';
import type { WarehouseOperation } from '@/features/inventory/domain/types/warehouse';
import {
  downloadCountSheet,
  parseCountResults,
  startPhysicalCount,
  submitCountResults,
  type CountSheetIssue,
} from '@/features/inventory/admin/physical-count/lib/count-sheet';

const ALL_LOCATIONS = '__all__';

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

export function PhysicalCountDialog({ open, onOpenChange }: Props) {
  const companyId = getInventoryCompanyId();
  const queryClient = useQueryClient();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const uploadTarget = React.useRef<WarehouseOperation | null>(null);
  const [warehouseId, setWarehouseId] = React.useState('');
  const [locationId, setLocationId] = React.useState(ALL_LOCATIONS);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [issues, setIssues] = React.useState<CountSheetIssue[]>([]);

  const { data: warehousesData } = useWarehouses(
    { companyId, limit: 200 },
    { enabled: open && Boolean(companyId) },
  );
  const warehouses = React.useMemo(() => warehousesData?.items ?? [], [warehousesData?.items]);
  const warehouseName = (id: string) => warehouses.find((w) => w.id === id)?.nameAr ?? '';
  const { data: locationsData } = useWarehouseLocations(
    { companyId, warehouseId: warehouseId || undefined, page: 1, limit: 500 },
    { enabled: open && Boolean(warehouseId) },
  );
  const stockLocations = (locationsData?.items ?? []).filter(
    (loc) => loc.locationType === 'internal' && loc.isActive !== false,
  );

  const openCounts = useQuery({
    queryKey: [...warehouseOperationsQueryKeys.root(companyId), 'open-counts'],
    queryFn: () =>
      warehouseOperationsApi.getAll({
        companyId,
        kind: 'physical_count',
        status: 'ready',
        all: true,
        limit: 200,
      }),
    enabled: open && Boolean(companyId),
  });

  React.useEffect(() => {
    if (!open) return;
    setBusy(null);
    setIssues([]);
  }, [open]);

  React.useEffect(() => {
    if (open && !warehouseId && warehouses[0]) setWarehouseId(warehouses[0].id);
  }, [open, warehouseId, warehouses]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: warehouseOperationsQueryKeys.root(companyId) });

  async function run(message: string, task: () => Promise<void>) {
    setBusy(message);
    setIssues([]);
    try {
      await task();
    } catch (error) {
      // apiRequest already shows the server message.
      if (!(error instanceof ApiError)) {
        toast.error(error instanceof Error ? error.message : 'تعذّر تنفيذ العملية.');
      }
    } finally {
      setBusy(null);
    }
  }

  const onStart = () =>
    run('جارٍ بدء الجرد…', async () => {
      const result = await startPhysicalCount({
        companyId,
        warehouseId,
        locationId: locationId === ALL_LOCATIONS ? undefined : locationId,
      });
      await refresh();
      toast.success(`بدأ الجرد ${result.reference} (${result.lines} بنداً). الحركات على هذه الأصناف موقوفة حتى التصديق.`);
      await downloadCountSheet({ companyId, warehouseId, operationId: result.id, reference: result.reference });
    });

  const onDownload = (operation: WarehouseOperation) =>
    run('تجهيز ورقة الجرد…', () =>
      downloadCountSheet({
        companyId,
        warehouseId: operation.warehouseId,
        operationId: operation.id,
        reference: operation.reference,
      }),
    );

  const onFile = (file: File | undefined) => {
    const operation = uploadTarget.current;
    if (fileRef.current) fileRef.current.value = '';
    if (!file || !operation) return;
    void run('قراءة نتيجة الجرد…', async () => {
      const parsed = await parseCountResults({ companyId, warehouseId: operation.warehouseId, file });
      if (parsed.issues.length > 0) {
        setIssues(parsed.issues);
        return;
      }
      if (parsed.lines.length === 0) {
        toast.error('لا توجد كميات معدودة في الملف.');
        return;
      }
      const result = await submitCountResults(operation.id, parsed.lines);
      await refresh();
      toast.success(
        `حُدّث ${result.updated} بنداً${result.added ? ` وأُضيف ${result.added}` : ''}${
          parsed.skipped ? `، و${parsed.skipped} صفاً لم يُعدّ بقي على الكمية النظامية` : ''
        }. راجع المستند ${operation.reference} ثم صدّقه لترحيل الفروقات.`,
      );
    });
  };

  const counts = openCounts.data?.items ?? [];

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>جرد مستودع</DialogTitle>
          <DialogDescription>
            يملأ النظام البنود من الرصيد الحالي ويوقف الحركات على هذه الأصناف. اطبع ورقة الجرد (بدون الكمية النظامية)،
            ثم ارفعها بعد العدّ، وصدّق المستند لترحيل الفروقات.
          </DialogDescription>
        </DialogHeader>

        <section className="space-y-3 rounded-lg border p-3">
          <h3 className="text-sm font-semibold">بدء جرد جديد</h3>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label>المستودع</Label>
              <Select
                value={warehouseId}
                onValueChange={(value) => {
                  setWarehouseId(value);
                  setLocationId(ALL_LOCATIONS);
                }}
                disabled={Boolean(busy)}
              >
                <SelectTrigger aria-label="المستودع">
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
              <Label>الموقع</Label>
              <Select value={locationId} onValueChange={setLocationId} disabled={Boolean(busy) || !warehouseId}>
                <SelectTrigger aria-label="الموقع">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL_LOCATIONS}>كل مواقع التخزين</SelectItem>
                  {stockLocations.map((loc) => (
                    <SelectItem key={loc.id} value={loc.id}>
                      {loc.code ? `${loc.code} — ${loc.nameAr}` : loc.nameAr}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button type="button" onClick={() => void onStart()} disabled={!warehouseId || Boolean(busy)}>
            بدء الجرد وتنزيل الورقة
          </Button>
        </section>

        <section className="space-y-2">
          <h3 className="text-sm font-semibold">جرد قيد التنفيذ</h3>
          <input
            ref={fileRef}
            type="file"
            accept=".xlsx,.xls,.csv"
            className="hidden"
            onChange={(event) => onFile(event.target.files?.[0])}
          />
          {counts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              {openCounts.isLoading ? 'جارٍ التحميل…' : 'لا يوجد جرد مفتوح.'}
            </p>
          ) : (
            <ul className="max-h-60 divide-y overflow-y-auto rounded-lg border">
              {counts.map((operation) => (
                <li key={operation.id} className="flex flex-wrap items-center justify-between gap-2 p-2 text-sm">
                  <span>
                    <span className="font-medium">{operation.reference}</span>
                    <span className="text-muted-foreground">
                      {' '}
                      — {warehouseName(operation.warehouseId)} · {operation.lineCount ?? operation.lines.length} بند
                    </span>
                  </span>
                  <span className="flex gap-1">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => void onDownload(operation)}
                      disabled={Boolean(busy)}
                    >
                      <Download className="size-4" />
                      ورقة الجرد
                    </Button>
                    <Button
                      type="button"
                      size="sm"
                      onClick={() => {
                        uploadTarget.current = operation;
                        fileRef.current?.click();
                      }}
                      disabled={Boolean(busy)}
                    >
                      <Upload className="size-4" />
                      رفع النتيجة
                    </Button>
                  </span>
                </li>
              ))}
            </ul>
          )}
        </section>

        {busy ? <p className="text-sm font-medium">{busy}</p> : null}

        {issues.length > 0 ? (
          <div className="max-h-48 overflow-y-auto rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">
            <p className="mb-1 font-medium text-destructive">لم يُحفظ شيء. صحّح هذه الصفوف ثم أعد رفع الملف:</p>
            <ul className="space-y-0.5">
              {issues.map((issue, index) => (
                <li key={`${issue.rowNumber}-${index}`}>
                  {issue.rowNumber > 0 ? `الصف ${issue.rowNumber}: ` : ''}
                  {issue.message}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
