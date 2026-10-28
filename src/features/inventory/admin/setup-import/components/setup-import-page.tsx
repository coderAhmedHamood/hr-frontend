'use client';

import * as React from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  AlertTriangle,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Loader2,
  RefreshCw,
  Undo2,
  Upload,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCan } from '@/features/auth/hooks/use-can';
import { getInventoryCompanyId } from '@/features/inventory/lib/company-id';
import { ApiError } from '@/shared/api/client';
import { cn, formatDateTime } from '@/shared/utils';
import {
  setupImportApi,
  type SetupBatch,
  type SetupEntityKey,
  type SetupImportOptions,
  type SetupSchemaEntity,
  type SetupSheetReport,
  type SetupUnresolvedValue,
  type SetupValueDecision,
} from '../lib/setup-import-api';

const READ = 'inv.setup.read';
const IMPORT = 'inv.setup.import';
const SKIP = '__skip__';

const ENTITY_LABEL: Record<SetupEntityKey, string> = {
  warehouses: 'المستودعات',
  locations: 'المواقع',
  uoms: 'وحدات القياس',
  categories: 'الفئات',
  products: 'الأصناف',
  opening: 'الرصيد الافتتاحي',
};

const REF_LABEL: Record<SetupUnresolvedValue['entity'], string> = {
  uoms: 'وحدة',
  categories: 'فئة',
  warehouses: 'مستودع',
  locations: 'موقع',
  branches: 'فرع',
};

const STATUS_LABEL: Record<SetupBatch['status'], { label: string; variant: 'success' | 'warning' | 'destructive' | 'subtle' }> = {
  invalid: { label: 'فيه أخطاء', variant: 'destructive' },
  validated: { label: 'جاهز للحفظ', variant: 'warning' },
  committing: { label: 'يُحفظ…', variant: 'warning' },
  committed: { label: 'محفوظ', variant: 'success' },
  failed: { label: 'فشل الحفظ', variant: 'destructive' },
  cancelled: { label: 'ملغى', variant: 'subtle' },
};

/** Branches cannot be created from a file (they are the company's structure). */
const CREATABLE = new Set<SetupUnresolvedValue['entity']>(['uoms', 'categories', 'warehouses', 'locations']);

const errorCode = (error: unknown): string | null => {
  if (!(error instanceof ApiError)) return null;
  const payload = error.payload as { error?: { code?: string }; code?: string } | null;
  return payload?.error?.code ?? payload?.code ?? null;
};

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Inventory data import (2026-10-29): one Excel file (or a CSV per sheet)
 * with warehouses, locations, units, categories, products and the opening
 * balance. The server reads and checks it without saving; here the user
 * fixes the columns, decides each value the system does not know (link it,
 * create it, or keep it an error), then saves everything in one transaction.
 * A saved import can be cancelled while none of its documents is posted.
 */
export function SetupImportPage() {
  const companyId = getInventoryCompanyId();
  const can = useCan();
  const canRead = can(READ);
  const canImport = can(IMPORT);
  const queryClient = useQueryClient();

  const [batch, setBatch] = React.useState<SetupBatch | null>(null);
  const [options, setOptions] = React.useState<SetupImportOptions>({});
  const [busy, setBusy] = React.useState<'upload' | 'check' | 'commit' | 'cancel' | null>(null);
  const [csvEntity, setCsvEntity] = React.useState<SetupEntityKey>('products');
  const inputRef = React.useRef<HTMLInputElement>(null);

  const schema = useQuery({
    queryKey: ['inventory', 'setup', 'schema', companyId],
    queryFn: () => setupImportApi.schema(companyId),
    enabled: Boolean(companyId) && canRead,
    staleTime: Infinity,
  });
  const history = useQuery({
    queryKey: ['inventory', 'setup', 'imports', companyId],
    queryFn: () => setupImportApi.list(companyId),
    enabled: Boolean(companyId) && canRead,
  });
  const entities = React.useMemo(
    () => new Map((schema.data?.entities ?? []).map((e) => [e.key, e])),
    [schema.data],
  );

  async function upload(file: File | null) {
    if (!file || !companyId) return;
    setBusy('upload');
    setBatch(null);
    setOptions({});
    try {
      setBatch(await setupImportApi.upload(companyId, file));
      void queryClient.invalidateQueries({ queryKey: ['inventory', 'setup', 'imports', companyId] });
    } catch {
      // The API client already showed why (an unreadable file, the size…).
    } finally {
      setBusy(null);
      if (inputRef.current) inputRef.current.value = '';
    }
  }

  async function recheck(next: SetupImportOptions) {
    if (!batch) return;
    setOptions(next);
    setBusy('check');
    try {
      setBatch(await setupImportApi.revalidate(companyId, batch.id, next));
    } catch {
      // shown by the API client
    } finally {
      setBusy(null);
    }
  }

  function changeColumn(sheet: SetupSheetReport, header: string, field: string) {
    const sheetMapping = { ...(options.mapping?.[sheet.name] ?? {}) };
    sheetMapping[header] = field === SKIP ? null : field;
    void recheck({ ...options, mapping: { ...options.mapping, [sheet.name]: sheetMapping } });
  }

  function decide(value: SetupUnresolvedValue, decision: SetupValueDecision | null) {
    const forEntity = { ...(options.valueMapping?.[value.entity] ?? {}) };
    if (decision) forEntity[value.value] = decision;
    else delete forEntity[value.value];
    void recheck({ ...options, valueMapping: { ...options.valueMapping, [value.entity]: forEntity } });
  }

  /** One choice for every unknown value: link to the suggestion, create it, or keep it an error. */
  function decideAll(mode: 'suggestion' | 'create' | 'error') {
    const values = batch?.summary?.unresolvedValues ?? [];
    const valueMapping: NonNullable<SetupImportOptions['valueMapping']> = { ...options.valueMapping };
    for (const value of values) {
      let decision: SetupValueDecision | null = null;
      if (mode === 'error') decision = { action: 'error' };
      else if (mode === 'create' && CREATABLE.has(value.entity)) decision = { action: 'create' };
      else if (mode === 'suggestion' && value.suggestion) decision = { action: 'map', code: value.suggestion.code };
      if (!decision) continue;
      valueMapping[value.entity] = { ...(valueMapping[value.entity] ?? {}), [value.value]: decision };
    }
    void recheck({ ...options, valueMapping });
  }

  async function commit(confirmDuplicate = false) {
    if (!batch) return;
    setBusy('commit');
    try {
      let saved = await setupImportApi.commit(companyId, batch.id, confirmDuplicate);
      // A big file is saved in the background: follow it.
      for (let i = 0; i < 600 && saved.status === 'committing'; i += 1) {
        setBatch(saved);
        await sleep(1000);
        saved = await setupImportApi.get(companyId, batch.id);
      }
      setBatch(saved);
      if (saved.status === 'committed') toast.success('تم حفظ الاستيراد');
      else if (saved.status === 'failed') toast.error(saved.failureMessage ?? 'تعذّر الحفظ؛ لم يُحفظ شيء.');
      void queryClient.invalidateQueries({ queryKey: ['inventory', 'setup', 'imports', companyId] });
    } catch (error) {
      if (errorCode(error) === 'INVENTORY_OPENING_EXISTS') {
        if (window.confirm('لمستودع في الملف رصيد افتتاحي من قبل. حفظ رصيد افتتاحي آخر له؟')) {
          setBusy(null);
          await commit(true);
          return;
        }
      }
    } finally {
      setBusy(null);
    }
  }

  async function cancel(batchId: string) {
    if (!window.confirm('إلغاء هذا الاستيراد؟ يُؤرشف ما أنشأه، ويُعاد ما عدّله كما كان. لا يُلغى إذا رُحّل أحد مستنداته.')) {
      return;
    }
    setBusy('cancel');
    try {
      const cancelled = await setupImportApi.cancel(companyId, batchId);
      if (batch?.id === batchId) setBatch(cancelled);
      toast.success('أُلغي الاستيراد');
      void queryClient.invalidateQueries({ queryKey: ['inventory', 'setup', 'imports', companyId] });
    } catch {
      // shown by the API client
    } finally {
      setBusy(null);
    }
  }

  if (!canRead) {
    return (
      <>
        <SetPageTitle titleAr="استيراد بيانات المخازن" iconName="FileSpreadsheet" />
        <p className="text-sm text-muted-foreground">ليست لديك صلاحية استيراد بيانات المخازن.</p>
      </>
    );
  }

  const summary = batch?.summary ?? null;
  const unresolved = summary?.unresolvedValues ?? [];
  const working = busy !== null;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-4">
      <SetPageTitle
        titleAr="استيراد بيانات المخازن"
        descriptionAr="ملف واحد: المستودعات والمواقع والوحدات والفئات والأصناف والرصيد الافتتاحي."
        iconName="FileSpreadsheet"
      />

      {/* 1 — template and file */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">١. القالب والملف</CardTitle>
          <CardDescription>
            حمّل القالب واملأ ما تحتاجه من أوراقه (اترك الباقي فارغاً)، أو ارفع ملفك كما هو وطابق أعمدته. الرمز الموجود
            يُحدَّث، والجديد يُنشأ. لا يُحفظ شيء قبل الضغط على «حفظ الاستيراد».
          </CardDescription>
        </CardHeader>
        <CardContent className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center gap-2">
            <Button variant="outline" size="sm" onClick={() => void setupImportApi.downloadTemplate(companyId, 'xlsx')}>
              <Download className="h-4 w-4" />
              قالب Excel (كل الأوراق)
            </Button>
            <div className="flex items-center gap-1.5">
              <Select value={csvEntity} onValueChange={(v) => setCsvEntity(v as SetupEntityKey)}>
                <SelectTrigger className="h-9 w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {(Object.keys(ENTITY_LABEL) as SetupEntityKey[]).map((key) => (
                    <SelectItem key={key} value={key}>
                      {ENTITY_LABEL[key]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={() => void setupImportApi.downloadTemplate(companyId, 'csv', csvEntity)}
              >
                <Download className="h-4 w-4" />
                CSV
              </Button>
            </div>
          </div>

          {canImport ? (
            <label
              className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border p-6 text-center transition-colors hover:bg-muted/40"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                void upload(e.dataTransfer.files?.[0] ?? null);
              }}
            >
              {busy === 'upload' ? (
                <Loader2 className="h-7 w-7 animate-spin text-primary" />
              ) : (
                <Upload className="h-7 w-7 text-muted-foreground" />
              )}
              <span className="text-sm font-medium">
                {busy === 'upload' ? 'جارٍ قراءة الملف وفحصه…' : 'اختر ملف Excel أو CSV أو اسحبه هنا'}
              </span>
              <span className="text-xs text-muted-foreground">حتى 15 ميغابايت</span>
              <input
                ref={inputRef}
                type="file"
                accept=".xlsx,.csv,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
                className="sr-only"
                disabled={working}
                onChange={(e) => void upload(e.target.files?.[0] ?? null)}
              />
            </label>
          ) : (
            <p className="text-sm text-muted-foreground">لا تملك صلاحية رفع ملفات الاستيراد.</p>
          )}
        </CardContent>
      </Card>

      {batch ? (
        <>
          <div className="flex flex-wrap items-center gap-2 text-sm">
            <FileSpreadsheet className="h-4 w-4 text-primary" />
            <span className="font-medium">{batch.fileName}</span>
            <Badge variant={STATUS_LABEL[batch.status].variant}>{STATUS_LABEL[batch.status].label}</Badge>
            {busy === 'check' ? (
              <span className="flex items-center gap-1 text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                إعادة الفحص…
              </span>
            ) : null}
          </div>

          {batch.status === 'committed' || batch.status === 'cancelled' ? (
            <BatchResult batch={batch} onCancel={() => void cancel(batch.id)} cancelling={busy === 'cancel'} />
          ) : (
            <>
              {/* 2 — sheets and columns */}
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base">٢. الأوراق والأعمدة</CardTitle>
                  <CardDescription>
                    لكل ورقة نوعها، ولكل عمود الحقل الذي يقابله. «تخمين» يعني اسماً مشابهاً: تأكد منه.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-5">
                  {(batch.sheets ?? []).map((sheet) => (
                    <SheetColumns
                      key={sheet.name}
                      sheet={sheet}
                      def={sheet.entity ? entities.get(sheet.entity) : undefined}
                      disabled={working}
                      onChange={(header, field) => changeColumn(sheet, header, field)}
                    />
                  ))}
                </CardContent>
              </Card>

              {/* 3 — unknown values: link, create or error */}
              {unresolved.length ? (
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base">٣. قيم غير موجودة في النظام</CardTitle>
                    <CardDescription>
                      لكل قيمة اختر: ربطها بالموجود المقترح، أو إنشاؤها وربطها، أو إبقاؤها خطأ تصحّحه في الملف.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-3">
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" disabled={working} onClick={() => decideAll('suggestion')}>
                        ربط الكل بالمقترح
                      </Button>
                      <Button size="sm" variant="outline" disabled={working} onClick={() => decideAll('create')}>
                        إنشاء الكل وربطه
                      </Button>
                      <Button size="sm" variant="ghost" disabled={working} onClick={() => decideAll('error')}>
                        إبقاء الكل أخطاء
                      </Button>
                    </div>
                    <div className="divide-y divide-border/60 rounded-xl border border-border/60">
                      {unresolved.map((value) => (
                        <UnresolvedRow
                          key={`${value.entity}|${value.value}`}
                          value={value}
                          decision={options.valueMapping?.[value.entity]?.[value.value] ?? null}
                          disabled={working}
                          onDecide={(decision) => decide(value, decision)}
                        />
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              {/* 4 — review */}
              {summary ? <Review summary={summary} batch={batch} /> : null}

              {/* 5 — save */}
              <Card>
                <CardContent className="flex flex-col gap-3 pt-6 sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm text-muted-foreground">
                    يُحفظ الملف كله أو لا شيء. الرصيد الافتتاحي يُحفظ مسودات لكل مستودع، ويُرحَّل بعدها من صفحة الرصيد
                    الافتتاحي.
                  </p>
                  <div className="flex shrink-0 gap-2">
                    <Button variant="outline" disabled={working} onClick={() => void recheck(options)}>
                      <RefreshCw className="h-4 w-4" />
                      إعادة الفحص
                    </Button>
                    <Button disabled={working || batch.status !== 'validated' || !canImport} onClick={() => void commit()}>
                      {busy === 'commit' ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                      حفظ الاستيراد
                    </Button>
                  </div>
                </CardContent>
                {batch.status === 'committing' && batch.progress ? (
                  <p className="px-6 pb-4 text-xs text-muted-foreground">
                    يُحفظ: {batch.progress.done} من {batch.progress.total}
                  </p>
                ) : null}
                {batch.status === 'invalid' ? (
                  <p className="px-6 pb-4 text-xs text-destructive">
                    صحّح الأخطاء (في الملف، أو بمطابقة الأعمدة والقيم أعلاه) ليُتاح الحفظ.
                  </p>
                ) : null}
              </Card>
            </>
          )}
        </>
      ) : null}

      <History
        items={history.data?.items ?? []}
        loading={history.isLoading}
        canImport={canImport}
        busy={working}
        onOpen={async (id) => setBatch(await setupImportApi.get(companyId, id))}
        onCancel={(id) => void cancel(id)}
      />
    </div>
  );
}

function SheetColumns({
  sheet,
  def,
  disabled,
  onChange,
}: {
  sheet: SetupSheetReport;
  def: SetupSchemaEntity | undefined;
  disabled: boolean;
  onChange: (header: string, field: string) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-sm font-medium">
        {sheet.entity ? ENTITY_LABEL[sheet.entity] : 'غير معروفة'}
        <span className="ms-2 text-xs font-normal text-muted-foreground">
          ورقة «{sheet.name}» — {sheet.rowCount} سطر
          {sheet.headerRow ? `، العناوين في السطر ${sheet.headerRow}` : ''}
        </span>
      </p>
      {def ? (
        <div className="divide-y divide-border/60 rounded-xl border border-border/60">
          {sheet.columns
            .filter((c) => c.header)
            .map((column) => (
              <div key={column.index} className="flex flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium">
                    <span className="me-1 text-xs text-muted-foreground" dir="ltr">
                      {column.letter}
                    </span>
                    {column.header}
                  </p>
                  <p className="truncate text-xs text-muted-foreground" dir="auto">
                    {column.samples.join(' · ') || '—'}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  {column.field && column.confidence < 1 ? <Badge variant="warning">تخمين</Badge> : null}
                  {!column.field && column.suggestion ? (
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-8 text-xs"
                      disabled={disabled}
                      onClick={() => onChange(column.header, column.suggestion!.field)}
                    >
                      اقتراح: {def.fields.find((f) => f.key === column.suggestion!.field)?.labelAr}
                    </Button>
                  ) : null}
                  <Select
                    value={column.field ?? SKIP}
                    disabled={disabled}
                    onValueChange={(value) => onChange(column.header, value)}
                  >
                    <SelectTrigger className={cn('h-9 w-full sm:w-52', !column.field && 'text-muted-foreground')}>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value={SKIP}>لا يُستورد</SelectItem>
                      {def.fields.map((field) => (
                        <SelectItem key={field.key} value={field.key}>
                          {field.labelAr}
                          {field.required ? ' *' : ''}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          لم يُعرف نوع هذه الورقة؛ تُركت. سمِّها باسم نوعها (مثل «الأصناف») أو استعمل القالب.
        </p>
      )}
      {sheet.missingRequired.length && def ? (
        <p className="text-xs text-destructive">
          حقول مطلوبة بلا عمود:{' '}
          {sheet.missingRequired.map((key) => def.fields.find((f) => f.key === key)?.labelAr ?? key).join('، ')}
        </p>
      ) : null}
    </div>
  );
}

function UnresolvedRow({
  value,
  decision,
  disabled,
  onDecide,
}: {
  value: SetupUnresolvedValue;
  decision: SetupValueDecision | null;
  disabled: boolean;
  onDecide: (decision: SetupValueDecision | null) => void;
}) {
  const current = !decision
    ? 'none'
    : decision.action === 'map'
      ? 'map'
      : decision.action === 'create'
        ? 'create'
        : 'error';
  return (
    <div className="flex flex-col gap-2 px-3 py-2 sm:flex-row sm:items-center">
      <div className="min-w-0 flex-1">
        <p className="text-sm">
          <span className="text-muted-foreground">{REF_LABEL[value.entity]}: </span>
          <span className="font-medium">«{value.value}»</span>
          <span className="ms-2 text-xs text-muted-foreground">{value.rows} سطر</span>
        </p>
        {value.suggestion ? (
          <p className="text-xs text-muted-foreground">
            المقترح: {value.suggestion.nameAr} ({value.suggestion.code})
          </p>
        ) : null}
      </div>
      <Select
        value={current}
        disabled={disabled}
        onValueChange={(next) => {
          if (next === 'map' && value.suggestion) onDecide({ action: 'map', code: value.suggestion.code });
          else if (next === 'create') onDecide({ action: 'create' });
          else if (next === 'error') onDecide({ action: 'error' });
          else onDecide(null);
        }}
      >
        <SelectTrigger className="h-9 w-full sm:w-56">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="none">لم يُقرَّر (خطأ)</SelectItem>
          {value.suggestion ? <SelectItem value="map">ربط بـ «{value.suggestion.nameAr}»</SelectItem> : null}
          {CREATABLE.has(value.entity) ? <SelectItem value="create">إنشاء وربط</SelectItem> : null}
          <SelectItem value="error">خطأ يُصحَّح في الملف</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

function Review({ summary, batch }: { summary: NonNullable<SetupBatch['summary']>; batch: SetupBatch }) {
  const entityKeys = (Object.keys(summary.entities) as SetupEntityKey[]).filter((key) => summary.entities[key]);
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">٤. المراجعة</CardTitle>
        <CardDescription>
          {summary.rows} سطر — {summary.errors} خطأ، {summary.warnings} تنبيه.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {entityKeys.length ? (
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {entityKeys.map((key) => {
              const counts = summary.entities[key]!;
              return (
                <div key={key} className="rounded-lg border border-border bg-muted/30 px-3 py-2">
                  <p className="text-xs text-muted-foreground">{ENTITY_LABEL[key]}</p>
                  <p className="text-sm tabular-nums">
                    <span className="font-semibold">{counts.create}</span> جديد ·{' '}
                    <span className="font-semibold">{counts.update}</span> يُحدَّث
                    {counts.unchanged ? ` · ${counts.unchanged} بلا تغيير` : ''}
                  </p>
                </div>
              );
            })}
          </div>
        ) : null}

        {summary.opening.length ? (
          <div className="flex flex-col gap-1.5">
            <p className="text-sm font-medium">الرصيد الافتتاحي لكل مستودع</p>
            {summary.opening.map((o) => (
              <div key={o.warehouseCode} className="rounded-lg border border-border/60 px-3 py-2 text-sm">
                <span className="font-medium">{o.warehouseNameAr}</span>
                <span className="ms-2 text-muted-foreground tabular-nums">
                  {o.lines} سطر · كمية {o.totalQuantity.toLocaleString('en-US')}
                  {o.totalValue != null
                    ? ` · قيمة ${o.totalValue.toLocaleString('en-US', { maximumFractionDigits: 2 })} ${summary.valuationCurrency}`
                    : ''}
                </span>
                {o.existingOpenings.length ? (
                  <p className="mt-1 flex items-center gap-1 text-xs text-warning">
                    <AlertTriangle className="h-3.5 w-3.5" />
                    للمستودع رصيد افتتاحي من قبل: {o.existingOpenings.join('، ')}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        {summary.issueGroups.length ? (
          <ul className="flex max-h-[28rem] flex-col divide-y divide-border/60 overflow-y-auto rounded-xl border border-border/60">
            {[...summary.issueGroups]
              .sort((a, b) => (a.level === b.level ? 0 : a.level === 'error' ? -1 : 1))
              .map((group) => (
                <li key={`${group.level}|${group.code}|${group.message}`} className="flex gap-3 px-3 py-2 text-sm">
                  {group.level === 'error' ? (
                    <XCircle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
                  ) : (
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-warning" />
                  )}
                  <div className="min-w-0 flex-1">
                    <p>
                      {group.message}
                      <span className="ms-2 text-xs text-muted-foreground">({group.count})</span>
                    </p>
                    {group.fix ? <p className="text-xs text-muted-foreground">{group.fix}</p> : null}
                    {group.samples.length ? (
                      <p className="text-xs text-muted-foreground" dir="ltr">
                        {group.samples.join('  ')}
                      </p>
                    ) : null}
                  </div>
                </li>
              ))}
          </ul>
        ) : batch.status === 'validated' ? (
          <p className="flex items-center gap-2 text-sm text-success">
            <CheckCircle2 className="h-4 w-4" />
            لا أخطاء ولا تنبيهات.
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}

function BatchResult({ batch, onCancel, cancelling }: { batch: SetupBatch; onCancel: () => void; cancelling: boolean }) {
  const created = batch.result?.created ?? {};
  const createdKeys = (Object.keys(created) as SetupEntityKey[]).filter((key) => created[key]?.length);
  return (
    <Card className={batch.status === 'committed' ? 'border-success/30' : undefined}>
      <CardContent className="flex flex-col gap-3 pt-6">
        <p className="flex items-center gap-2 font-medium">
          {batch.status === 'committed' ? (
            <CheckCircle2 className="h-5 w-5 text-success" />
          ) : (
            <Undo2 className="h-5 w-5 text-muted-foreground" />
          )}
          {batch.status === 'committed' ? 'تم حفظ الاستيراد' : 'أُلغي هذا الاستيراد'}
        </p>
        {createdKeys.length ? (
          <p className="text-sm text-muted-foreground">
            أُنشئ: {createdKeys.map((key) => `${created[key]!.length} ${ENTITY_LABEL[key]}`).join('، ')}.
          </p>
        ) : null}
        {batch.result?.operationReferences.length ? (
          <p className="text-sm text-muted-foreground">
            مسودات الرصيد الافتتاحي: <span dir="ltr">{batch.result.operationReferences.join('، ')}</span> — رحّلها من
            صفحة الرصيد الافتتاحي.
          </p>
        ) : null}
        {batch.result?.kept?.length ? (
          <p className="text-xs text-muted-foreground">
            بقي {batch.result.kept.length} سجل لأن شيئاً آخر صار يستعمله.
          </p>
        ) : null}
        {batch.status === 'committed' ? (
          <div>
            <Button variant="outline" size="sm" disabled={cancelling} onClick={onCancel}>
              {cancelling ? <Loader2 className="h-4 w-4 animate-spin" /> : <Undo2 className="h-4 w-4" />}
              إلغاء هذا الاستيراد
            </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function History({
  items,
  loading,
  canImport,
  busy,
  onOpen,
  onCancel,
}: {
  items: Array<{
    id: string;
    status: SetupBatch['status'];
    fileName: string;
    rows: number;
    errorCount: number;
    createdAt: string;
    operationReferences: string[];
  }>;
  loading: boolean;
  canImport: boolean;
  busy: boolean;
  onOpen: (id: string) => void;
  onCancel: (id: string) => void;
}) {
  if (loading || items.length === 0) return null;
  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">الاستيرادات السابقة</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border/60 rounded-xl border border-border/60">
          {items.map((item) => (
            <li key={item.id} className="flex flex-col gap-2 px-3 py-2 text-sm sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="truncate font-medium">{item.fileName}</p>
                <p className="text-xs text-muted-foreground">
                  <span dir="ltr">{formatDateTime(item.createdAt)}</span> · {item.rows} سطر
                  {item.errorCount ? ` · ${item.errorCount} خطأ` : ''}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant={STATUS_LABEL[item.status].variant}>{STATUS_LABEL[item.status].label}</Badge>
                <Button size="sm" variant="ghost" onClick={() => onOpen(item.id)}>
                  فتح
                </Button>
                {canImport && item.status === 'committed' ? (
                  <Button size="sm" variant="ghost" disabled={busy} onClick={() => onCancel(item.id)}>
                    إلغاء
                  </Button>
                ) : null}
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
