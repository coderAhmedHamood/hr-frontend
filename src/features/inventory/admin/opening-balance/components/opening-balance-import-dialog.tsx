'use client';

import * as React from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { Download, FileSpreadsheet, Upload } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
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
import { useWarehouses } from '@/features/inventory/admin/warehouses/hooks/use-warehouses';
import { getInventoryCompanyId } from '@/features/inventory/lib/company-id';
import {
  downloadOpeningSheetTemplate,
  parseOpeningSheet,
  type OpeningSheetIssue,
} from '@/features/inventory/admin/opening-balance/lib/opening-sheet';
import {
  OpeningExistsError,
  planOpeningImport,
  runOpeningImport,
  type OpeningPlan,
} from '@/features/inventory/admin/opening-balance/lib/opening-import';

type Props = { open: boolean; onOpenChange: (open: boolean) => void };

export function OpeningBalanceImportDialog({ open, onOpenChange }: Props) {
  const companyId = getInventoryCompanyId();
  const queryClient = useQueryClient();
  const fileRef = React.useRef<HTMLInputElement>(null);
  const [warehouseId, setWarehouseId] = React.useState('');
  const [fileName, setFileName] = React.useState('');
  const [plan, setPlan] = React.useState<OpeningPlan | null>(null);
  const [sheetIssues, setSheetIssues] = React.useState<OpeningSheetIssue[]>([]);
  const [busy, setBusy] = React.useState<string | null>(null);
  const [duplicateWarning, setDuplicateWarning] = React.useState<string | null>(null);

  const { data: warehousesData } = useWarehouses(
    { companyId, limit: 200 },
    { enabled: open && Boolean(companyId) },
  );
  const warehouses = React.useMemo(() => warehousesData?.items ?? [], [warehousesData?.items]);
  const { data: locationsData } = useWarehouseLocations(
    { companyId, warehouseId: warehouseId || undefined, page: 1, limit: 500 },
    { enabled: open && Boolean(warehouseId) },
  );

  React.useEffect(() => {
    if (!open) return;
    setFileName('');
    setPlan(null);
    setSheetIssues([]);
    setBusy(null);
    setDuplicateWarning(null);
  }, [open]);

  React.useEffect(() => {
    if (open && !warehouseId && warehouses[0]) setWarehouseId(warehouses[0].id);
  }, [open, warehouseId, warehouses]);

  const issues = [...sheetIssues, ...(plan?.issues ?? [])].sort((a, b) => a.rowNumber - b.rowNumber);
  const canImport = Boolean(plan && plan.lines.length > 0 && issues.length === 0 && !busy);

  async function onFile(file: File | undefined) {
    if (!file || !warehouseId) return;
    setFileName(file.name);
    setPlan(null);
    setDuplicateWarning(null);
    setBusy('قراءة الملف ومطابقة الأصناف…');
    try {
      const sheet = await parseOpeningSheet(file);
      setSheetIssues(sheet.issues);
      if (sheet.rows.length > 0) {
        setPlan(
          await planOpeningImport({
            companyId,
            rows: sheet.rows,
            locations: locationsData?.items ?? [],
          }),
        );
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'تعذّرت قراءة الملف.');
    } finally {
      setBusy(null);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  async function onImport(confirmDuplicate = false) {
    if (!plan) return;
    setBusy('جارٍ إنشاء الأصناف ومستند الرصيد الافتتاحي…');
    setDuplicateWarning(null);
    try {
      const result = await runOpeningImport({
        companyId,
        warehouseId,
        plan,
        sourceDocument: `استيراد: ${fileName}`,
        confirmDuplicate,
      });
      await queryClient.invalidateQueries({ queryKey: warehouseOperationsQueryKeys.root(companyId) });
      toast.success(
        `أُنشئ المستند ${result.reference} كمسودة${
          result.createdProducts ? ` وأُضيف ${result.createdProducts} صنفاً جديداً` : ''
        }. راجعه ثم صدّقه ليدخل المخزون.`,
      );
      onOpenChange(false);
    } catch (error) {
      if (error instanceof OpeningExistsError) setDuplicateWarning(error.message);
      else toast.error(error instanceof Error ? error.message : 'تعذّر الاستيراد.');
    } finally {
      setBusy(null);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => !busy && onOpenChange(next)}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>استيراد الرصيد الافتتاحي من Excel</DialogTitle>
          <DialogDescription>
            يُنشئ الأصناف غير الموجودة كمسودات (لا تظهر في المتجر ولا نقطة البيع حتى تكمل بياناتها وتنشرها)، ثم
            مستند رصيد افتتاحي كمسودة. لا يتغيّر المخزون حتى تصدّق المستند.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label>المستودع</Label>
            <Select
              value={warehouseId}
              onValueChange={(value) => {
                setWarehouseId(value);
                setPlan(null);
                setSheetIssues([]);
                setFileName('');
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

          <div className="flex flex-wrap items-center gap-2">
            <input
              ref={fileRef}
              type="file"
              accept=".xlsx,.xls,.csv"
              className="hidden"
              onChange={(event) => void onFile(event.target.files?.[0])}
            />
            <Button
              type="button"
              onClick={() => fileRef.current?.click()}
              disabled={!warehouseId || !locationsData || Boolean(busy)}
            >
              <Upload className="size-4" />
              اختر ملف Excel
            </Button>
            <Button type="button" variant="outline" onClick={() => void downloadOpeningSheetTemplate()}>
              <Download className="size-4" />
              تنزيل القالب
            </Button>
            {fileName ? (
              <span className="flex items-center gap-1 text-sm text-muted-foreground">
                <FileSpreadsheet className="size-4" />
                {fileName}
              </span>
            ) : null}
          </div>

          <p className="text-xs text-muted-foreground">
            الأعمدة: رمز الصنف، اسم الصنف، الباركود، الكمية، تكلفة الوحدة، سعر البيع، الموقع. يُطابَق الصنف بالرمز ثم
            الباركود ثم الاسم. الموقع اختياري (رمزه أو اسمه)، وبدونه يدخل المخزون إلى موقع المخزون الرئيسي.
          </p>

          {busy ? <p className="text-sm font-medium">{busy}</p> : null}

          {plan ? (
            <div className="grid grid-cols-3 gap-2 text-center">
              <Stat label="بنود المستند" value={plan.lines.length} />
              <Stat label="أصناف موجودة" value={plan.existingCount} />
              <Stat label="أصناف ستُنشأ" value={plan.newProductCount} />
            </div>
          ) : null}

          {duplicateWarning ? (
            <div className="space-y-2 rounded-lg border border-amber-500/40 bg-amber-500/10 p-3 text-sm">
              <p>{duplicateWarning}</p>
              <p className="text-muted-foreground">
                الاستمرار يُنشئ مستند رصيد افتتاحي آخر لهذا المستودع، وتصديق الاثنين يضاعف الكميات.
              </p>
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={() => void onImport(true)}
                disabled={Boolean(busy)}
              >
                استيراد رغم ذلك
              </Button>
            </div>
          ) : null}

          {issues.length > 0 ? (
            <div className="max-h-48 overflow-y-auto rounded-lg border border-destructive/40 bg-destructive/5 p-3 text-sm">
              <p className="mb-1 font-medium text-destructive">صحّح هذه الصفوف في الملف ثم أعد اختياره:</p>
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
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={Boolean(busy)}>
            إلغاء
          </Button>
          <Button type="button" onClick={() => void onImport()} disabled={!canImport || Boolean(duplicateWarning)}>
            استيراد
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-lg border bg-muted/20 p-2">
      <div className="text-lg font-semibold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  );
}
