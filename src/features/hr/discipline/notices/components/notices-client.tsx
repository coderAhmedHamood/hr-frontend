'use client';

import * as React from 'react';
import { Trash2, CalendarDays, FileDown, FileSpreadsheet, Plus } from 'lucide-react';
import {
  EntityActionCard,
  EntityActionCardChip,
  EntityActionCardGrid,
  EntityActionCardGridSkeleton,
} from '@/components/ui/entity-action-card';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DatePickerInput } from '@/components/ui/date-picker-input';
import {
  ConfirmationModal, HRSettingsFormDrawer, FormField,
  EmptyState, MinimalDropdown, SearchableDropdown,
} from '@/features/hr/requests/components/shared-ui';
import { useDisciplineNoticesDirectoryModel, type NoticeRecord } from '@/features/hr/discipline/notices/hooks/useDisciplineNoticesDirectoryModel';
import type { HRDisciplineNoticeKind } from '@/features/hr/discipline/lib/types';
import { NOTICE_KIND_LABELS, NOTICE_KIND_FILTER_ORDER } from '@/features/hr/discipline/lib/types';
import type { DateFilterTab } from '@/features/hr/discipline/lib/discipline-date-filter';
import {
  DisciplineFilterToolbar,
  type DisciplineFilterToolbarHandle,
  type DisciplineViewMode,
} from '@/features/hr/discipline/components/discipline-filter-toolbar';
import { useDefaultCompany } from '@/features/hr/organization/hooks/useActiveCompany';
import { PdfPreviewExportDialog } from '@/components/pdf/pdf-preview-export-dialog';
import { GenericRegisterPrintHtml } from '@/components/pdf/print/generic-register-print-html';
import { downloadXlsxFromAoA, type XlsxCell } from '@/shared/export/download-xlsx';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { TableDateCell, TableRowActions, TableRowDetailDialog } from '@/components/ui/table-cells';
import { DisciplineListViewport, DisciplinePaginatedList } from '@/features/hr/discipline/components/discipline-paginated-list';

const KIND_OPTIONS = (Object.entries(NOTICE_KIND_LABELS) as [HRDisciplineNoticeKind, string][]).map(([v, l]) => ({ value: v, label: l }));

type KindFilter = 'all' | HRDisciplineNoticeKind;

interface DraftForm {
  employeeId: string; kind: HRDisciplineNoticeKind; reasonAr: string;
  date: string; linkedCaseId: string; attachmentsNote: string;
}
const EMPTY: DraftForm = { employeeId: '', kind: 'verbal', reasonAr: '', date: '', linkedCaseId: '', attachmentsNote: '' };

export function NoticesClient() {
  const hook = useDisciplineNoticesDirectoryModel();
  const { employees, cases, loading, listError, createNotice, deleteNotice, setListFilters, items, pagination, filteredItems, dateFilteredItems, sourceNotices } = hook;

  const { data: defaultCompany } = useDefaultCompany();
  const companyNameAr = defaultCompany?.nameAr ?? '';
  const companyNameEn = defaultCompany?.nameEn ?? '';

  const [selectedEmpIds, setSelectedEmpIds] = React.useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = React.useState<DisciplineViewMode>('cards');
  const [kindFilter, setKindFilter] = React.useState<KindFilter>('all');
  const [dateBounds, setDateBounds] = React.useState({ from: '', to: '' });
  const [dateMeta, setDateMeta] = React.useState<{ tab: DateFilterTab; hasRestriction: boolean }>({ tab: 'all', hasRestriction: false });
  const filterToolbarRef = React.useRef<DisciplineFilterToolbarHandle>(null);
  const onDateBoundsChange = React.useCallback((b: { from: string; to: string }) => { setDateBounds(b); }, []);
  const onDateFilterMetaChange = React.useCallback((m: { tab: DateFilterTab; hasRestriction: boolean }) => { setDateMeta(m); }, []);

  const empPickerList = React.useMemo(
    () => employees.map((e) => ({ id: e.id, name: e.nameAr })),
    [employees],
  );

  React.useEffect(() => {
    setListFilters({
      selectedEmpIds: [...selectedEmpIds],
      kindFilter,
      dateFrom: dateBounds.from,
      dateTo: dateBounds.to,
    });
  }, [selectedEmpIds, kindFilter, dateBounds.from, dateBounds.to, setListFilters]);

  const listFiltered = filteredItems;
  const filtered = dateFilteredItems;
  const searchFiltered = sourceNotices;

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<DraftForm>(EMPTY);
  const [saving, setSaving] = React.useState(false);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [pdfOpen, setPdfOpen] = React.useState(false);
  const [detailRow, setDetailRow] = React.useState<NoticeRecord | null>(null);

  const empOptions = employees.map(e => ({ value: e.id, label: e.nameAr }));
  const caseOptions = cases.map(c => ({ value: c.id, label: c.caseNumber, sub: c.employeeNameAr }));

  const statusCounts = React.useMemo(() => {
    const counts: Record<string, number> = { all: filtered.length };
    for (const k of NOTICE_KIND_FILTER_ORDER) counts[k] = 0;
    for (const n of filtered) counts[n.kind] = (counts[n.kind] ?? 0) + 1;
    return counts;
  }, [filtered]);

  const dateRangeActive = dateMeta.hasRestriction;

  const activeFilterCount = (selectedEmpIds.size > 0 ? 1 : 0) + (kindFilter !== 'all' ? 1 : 0) + (dateMeta.hasRestriction ? 1 : 0);

  usePageHeaderActions(
    () => (
      <div className="flex items-center gap-2">
        <FilterToggleButton activeFilterCount={activeFilterCount} />
        <Button variant="luxe" size="sm" className="h-8 gap-1.5 px-3 text-xs shadow-sm shrink-0"
          onClick={() => setDrawerOpen(true)}>
          <Plus className="h-3.5 w-3.5" />
          إضافة إنذار
        </Button>
      </div>
    ),
    [activeFilterCount],
  );

  const noticesFilterSummary = React.useMemo(() => {
    const parts: string[] = [];
    parts.push(selectedEmpIds.size === 0 ? 'الموظفون: الكل' : `الموظفون: ${selectedEmpIds.size} محدد`);
    parts.push(`نوع الإنذار: ${kindFilter === 'all' ? 'الكل' : NOTICE_KIND_LABELS[kindFilter]}`);
    parts.push(`التاريخ: ${dateBounds.from || dateBounds.to ? `${dateBounds.from || '…'} — ${dateBounds.to || '…'}` : 'كل الفترات'}`);
    return parts.join(' · ');
  }, [selectedEmpIds.size, kindFilter, dateBounds.from, dateBounds.to]);

  const noticesPdfRows = React.useMemo(
    () => listFiltered.map((n) => [n.employeeNameAr, n.date, NOTICE_KIND_LABELS[n.kind], n.reasonAr, n.attachmentsNote || '—']),
    [listFiltered],
  );

  const printable = React.useMemo(
    () =>
      noticesPdfRows.length === 0 ? null : (
        <GenericRegisterPrintHtml
          companyNameAr={companyNameAr}
          companyNameEn={companyNameEn}
          titleAr="سجل الإنذارات"
          filterSummary={noticesFilterSummary}
          headers={['الموظف', 'التاريخ', 'النوع', 'السبب', 'المرفقات']}
          rows={noticesPdfRows}
          landscape
        />
      ),
    [noticesPdfRows, noticesFilterSummary],
  );

  const handleExportNoticesExcel = React.useCallback(async () => {
    if (listFiltered.length === 0) { toast.error('لا توجد إنذارات للتصدير ضمن الفلاتر الحالية.'); return; }
    const rows: XlsxCell[][] = [
      ['الموظف', 'التاريخ', 'النوع', 'السبب', 'المرفقات'],
      ...listFiltered.map((n) => [n.employeeNameAr, n.date, NOTICE_KIND_LABELS[n.kind], n.reasonAr, n.attachmentsNote || '—']),
    ];
    await downloadXlsxFromAoA('discipline-notices.xlsx', 'الإنذارات', rows);
    toast.success('تم تنزيل ملف Excel.');
  }, [listFiltered]);

  const set = (patch: Partial<DraftForm>) => setDraft(d => ({ ...d, ...patch }));

  const columns = React.useMemo((): ColumnDef<NoticeRecord>[] => [
    {
      key: 'employee',
      title: 'الموظف',
      headerClassName: 'whitespace-nowrap',
      className: 'max-w-[12rem] truncate font-medium',
      render: (n) => n.employeeNameAr,
    },
    {
      key: 'kind',
      title: 'نوع الإنذار',
      headerClassName: 'whitespace-nowrap',
      className: 'whitespace-nowrap text-xs',
      render: (n) => NOTICE_KIND_LABELS[n.kind],
    },
    {
      key: 'date',
      title: 'التاريخ',
      headerClassName: 'whitespace-nowrap',
      className: 'whitespace-nowrap font-mono text-xs tabular-nums',
      render: (n) => <TableDateCell value={n.date} />,
    },
    {
      key: 'reason',
      title: 'السبب',
      className: 'max-w-[20rem] truncate text-xs text-muted-foreground',
      render: (n) => n.reasonAr,
    },
    {
      key: 'actions',
      title: 'إجراءات',
      isActions: true,
      headerClassName: 'whitespace-nowrap',
      render: (n) => (
        <TableRowActions
          menuItems={[
            {
              label: 'حذف',
              onClick: () => setDeleteId(n.id),
              icon: <Trash2 className="h-3.5 w-3.5" />,
              destructive: true,
            },
          ]}
        />
      ),
    },
  ], []);

  const handleSave = async () => {
    setFormError(null);
    if (!draft.employeeId) { setFormError('الموظف مطلوب'); return; }
    if (!draft.reasonAr.trim()) { setFormError('السبب مطلوب'); return; }
    if (!draft.date) { setFormError('التاريخ مطلوب'); return; }
    setSaving(true);
    try {
      await createNotice({
        employeeId: draft.employeeId,
        kind: draft.kind,
        reasonAr: draft.reasonAr,
        date: draft.date,
        linkedCaseId: draft.linkedCaseId || null,
        attachmentsNote: draft.attachmentsNote || null,
      });
      toast.success('تم إضافة الإنذار');
      setDrawerOpen(false);
      setDraft(EMPTY);
    } catch {
      setFormError('حدث خطأ أثناء الحفظ');
    } finally {
      setSaving(false);
    }
  };

  useEntityFilterSlot(
    () => (
      <DisciplineFilterToolbar
        ref={filterToolbarRef}
        showPrimaryAction={false}
        primaryActionLabel="إضافة إنذار"
        onPrimaryAction={() => { setDraft(EMPTY); setFormError(null); setDrawerOpen(true); }}
        toolbarExtraTrailing={(
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => { if (noticesPdfRows.length === 0) { toast.error('لا توجد إنذارات للتصدير ضمن الفلاتر الحالية.'); return; } setPdfOpen(true); }}
            >
              <FileDown className="h-3.5 w-3.5" />
              PDF
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => void handleExportNoticesExcel()}>
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Excel
            </Button>
          </>
        )}
        empPickerEmployees={empPickerList}
        selectedEmpIds={selectedEmpIds}
        onSelectedEmpIdsChange={setSelectedEmpIds}
        statusFilter={kindFilter}
        onStatusFilterChange={(v) => setKindFilter(v as KindFilter)}
        statusOrder={NOTICE_KIND_FILTER_ORDER}
        statusLabels={NOTICE_KIND_LABELS as unknown as Record<string, string>}
        statusCounts={statusCounts}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onDateBoundsChange={onDateBoundsChange}
        onDateFilterMetaChange={onDateFilterMetaChange}
      />
    ),
    [empPickerList, selectedEmpIds, kindFilter, statusCounts, viewMode, listFiltered, onDateBoundsChange, onDateFilterMetaChange],
  );

  if (loading) {
    return <EntityActionCardGridSkeleton count={6} />;
  }

  if (listError) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/5 p-6 text-center text-sm text-destructive">
        {listError}
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <PdfPreviewExportDialog open={pdfOpen} onOpenChange={setPdfOpen} title="معاينة تصدير الإنذارات" fileName="discipline-notices.pdf" printable={printable} />

      <DisciplineListViewport>
      {searchFiltered.length === 0 ? (
        <EmptyState title="لا توجد إنذارات مطابقة للبحث أو الموظفين المحددين." />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-14 text-center">
          <p className="text-sm text-muted-foreground">
            {dateMeta.tab === 'today' ? 'لا توجد إنذارات بتاريخ اليوم ضمن النتائج الحالية.'
              : dateMeta.tab === 'week' ? 'لا توجد إنذارات ضمن هذا الأسبوع ضمن النتائج الحالية.'
              : dateMeta.tab === 'month' ? 'لا توجد إنذارات ضمن هذا الشهر ضمن النتائج الحالية.'
              : dateMeta.tab === 'custom' && dateRangeActive ? 'لا توجد إنذارات ضمن نطاق التاريخ المخصص مع عوامل البحث الحالية.'
              : 'لا توجد إنذارات ضمن النتائج الحالية.'}
          </p>
          {dateRangeActive ? (
            <Button variant="link" size="sm" className="mt-2 text-xs" onClick={() => filterToolbarRef.current?.resetDateFilter()}>عرض كل الفترات</Button>
          ) : null}
        </div>
      ) : listFiltered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-14 text-center">
          <p className="text-sm text-muted-foreground">لا توجد إنذارات من نوع «{kindFilter === 'all' ? '' : NOTICE_KIND_LABELS[kindFilter]}» مع عوامل البحث الحالية.</p>
          <Button variant="link" size="sm" className="mt-2 text-xs" onClick={() => filterToolbarRef.current?.resetStatusFilter()}>عرض الكل</Button>
        </div>
      ) : (
        <DisciplinePaginatedList pagination={pagination}>
          {viewMode === 'cards' ? (
          <EntityActionCardGrid>
            {items.map((n) => (
            <EntityActionCard
              key={n.id}
              title={n.employeeNameAr ?? '—'}
              status={{ label: NOTICE_KIND_LABELS[n.kind], tone: 'primary' }}
              chips={
                <EntityActionCardChip className="font-mono tabular-nums">
                  <span className="inline-flex items-center gap-1" dir="ltr">
                    <CalendarDays className="h-3 w-3 shrink-0" />
                    {n.date}
                  </span>
                </EntityActionCardChip>
              }
              description={n.reasonAr}
              onClick={() => setDetailRow(n)}
              onDelete={() => setDeleteId(n.id)}
            />
            ))}
          </EntityActionCardGrid>
          ) : (
          <DataTable
            variant="directory"
            alwaysShowTable
            tableClassName="min-w-[640px]"
            columns={columns}
            data={items}
            keyExtractor={(n) => n.id}
            onRowClick={(n) => setDetailRow(n)}
          />
          )}
        </DisciplinePaginatedList>
      )}
      </DisciplineListViewport>

      <HRSettingsFormDrawer open={drawerOpen} onOpenChange={setDrawerOpen} title="إضافة إنذار" size="lg" onSave={() => void handleSave()} saveDisabled={saving} error={formError}>
        <FormField label="الموظف" required>
          <SearchableDropdown value={draft.employeeId} onChange={v => set({ employeeId: v })} options={empOptions} placeholder="اختر الموظف…" />
        </FormField>
        <FormField label="نوع الإنذار" required>
          <MinimalDropdown value={draft.kind} onChange={v => set({ kind: v as HRDisciplineNoticeKind })} options={KIND_OPTIONS} />
        </FormField>
        <FormField label="السبب" required>
          <textarea value={draft.reasonAr} onChange={e => set({ reasonAr: e.target.value })} placeholder="اكتب سبب الإنذار…" className="flex min-h-[80px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" />
        </FormField>
        <FormField label="التاريخ" required>
          <DatePickerInput value={draft.date} onChange={(ymd) => set({ date: ymd })} />
        </FormField>
        <FormField label="ربط بمخالفة">
          <SearchableDropdown value={draft.linkedCaseId} onChange={v => set({ linkedCaseId: v })} options={caseOptions} placeholder="اختر مخالفة (اختياري)…" allowClear />
        </FormField>
        <FormField label="ملاحظة المرفقات">
          <Input value={draft.attachmentsNote} onChange={e => set({ attachmentsNote: e.target.value })} placeholder="وصف المرفقات…" />
        </FormField>
      </HRSettingsFormDrawer>

      <ConfirmationModal
        open={!!deleteId}
        onOpenChange={v => !v && setDeleteId(null)}
        onConfirm={async () => {
          if (deleteId) {
            try { await deleteNotice(deleteId); toast.success('تم الحذف'); } catch { toast.error('فشل الحذف'); }
            setDeleteId(null);
          }
        }}
        title="حذف الإنذار"
      />

      <TableRowDetailDialog
        open={detailRow != null}
        onOpenChange={(o) => !o && setDetailRow(null)}
        title="تفاصيل الإنذار"
        fields={detailRow ? [
          { label: 'الموظف', value: detailRow.employeeNameAr },
          { label: 'نوع الإنذار', value: NOTICE_KIND_LABELS[detailRow.kind] },
          { label: 'التاريخ', value: <TableDateCell value={detailRow.date} /> },
          { label: 'السبب', value: detailRow.reasonAr },
          { label: 'مخالفة مرتبطة', value: detailRow.linkedCaseNumber ?? '—' },
          { label: 'ملاحظة المرفقات', value: detailRow.attachmentsNote ?? '—' },
          { label: 'أُنشئ', value: <TableDateCell value={detailRow.createdAt} mode="datetime" /> },
        ] : []}
      />
    </div>
  );
}
