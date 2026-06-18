'use client';

import * as React from 'react';
import { Trash2, CalendarDays, FileDown, FileSpreadsheet, Plus, ClipboardCheck } from 'lucide-react';
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
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import {
  ConfirmationModal, HRSettingsFormDrawer, FormField,
  EmptyState, MinimalDropdown, SearchableDropdown,
} from '@/features/hr/requests/components/shared-ui';
import { useDisciplineInvestigationsDirectoryModel } from '@/features/hr/discipline/investigations/hooks/useDisciplineInvestigationsDirectoryModel';
import type {
  HRInvestigationRecommendation,
  HRInvestigationResult,
} from '@/features/hr/discipline/lib/types';
import {
  INVESTIGATION_DEDUCTION_TYPE_LABELS,
  INVESTIGATION_RECOMMENDATION_LABELS,
  INVESTIGATION_RESULT_LABELS,
  INVESTIGATION_RESULT_FILTER_ORDER,
} from '@/features/hr/discipline/lib/types';
import {
  canMutateInvestigationRecord,
} from '@/features/hr/discipline/investigations/services/discipline-investigations.service';
import { InvestigationResultsFormFields } from '@/features/hr/discipline/investigations/components/investigation-results-form-fields';
import {
  INVESTIGATION_RESULTS_EMPTY,
  type InvestigationResultsDraftForm,
} from '@/features/hr/discipline/investigations/constants/investigation-form';
import {
  buildSubmitInvestigationResultsDto,
  validateInvestigationResultsDraft,
} from '@/features/hr/discipline/investigations/services/submit-violation-investigation';
import type { DateFilterTab } from '@/features/hr/discipline/lib/discipline-date-filter';
import {
  DisciplineFilterToolbar,
  type DisciplineFilterToolbarHandle,
  type DisciplineViewMode,
} from '@/features/hr/discipline/components/discipline-filter-toolbar';
import { PdfPreviewExportDialog } from '@/components/pdf/pdf-preview-export-dialog';
import { GenericRegisterPrintHtml } from '@/components/pdf/print/generic-register-print-html';
import { downloadXlsxFromAoA, type XlsxCell } from '@/shared/export/download-xlsx';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { TableDateCell, TableRowActions, TableRowDetailDialog } from '@/components/ui/table-cells';
import { DisciplineListViewport, DisciplinePaginatedList } from '@/features/hr/discipline/components/discipline-paginated-list';
import type { HRDisciplineInvestigationRecord } from '@/features/hr/discipline/lib/types';

type ResultFilter = 'all' | HRInvestigationResult;

type RecommendationFilter = 'all' | HRInvestigationRecommendation;

interface OpenDraftForm {
  caseId: string;
  caseNumber: string;
  employeeId: string;
  employeeNameAr: string;
  investigatorEmployeeId: string;
  investigatorName: string;
  date: string;
}

const OPEN_EMPTY: OpenDraftForm = {
  caseId: '',
  caseNumber: '',
  employeeId: '',
  employeeNameAr: '',
  investigatorEmployeeId: '',
  investigatorName: '',
  date: '',
};

export function InvestigationsClient() {
  const m = useDisciplineInvestigationsDirectoryModel();
  const { setListFilters, items, pagination, filteredItems, sourceInvestigations, dateFilteredItems } = m;

  const [selectedEmpIds, setSelectedEmpIds] = React.useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = React.useState<DisciplineViewMode>('cards');
  const [resultFilter, setResultFilter] = React.useState<ResultFilter>('all');
  const [recommendationFilter, setRecommendationFilter] = React.useState<RecommendationFilter>('all');
  const [dateBounds, setDateBounds] = React.useState({ from: '', to: '' });
  const [dateMeta, setDateMeta] = React.useState<{ tab: DateFilterTab; hasRestriction: boolean }>({ tab: 'all', hasRestriction: false });
  const filterToolbarRef = React.useRef<DisciplineFilterToolbarHandle>(null);
  const onDateBoundsChange = React.useCallback((b: { from: string; to: string }) => { setDateBounds(b); }, []);
  const onDateFilterMetaChange = React.useCallback((m: { tab: DateFilterTab; hasRestriction: boolean }) => { setDateMeta(m); }, []);

  const empPickerList = React.useMemo(
    () => m.employees.map((e) => ({ id: e.id, name: e.nameAr })),
    [m.employees],
  );

  React.useEffect(() => {
    setListFilters({
      selectedEmpIds: [...selectedEmpIds],
      resultFilter,
      recommendationFilter,
      dateFrom: dateBounds.from,
      dateTo: dateBounds.to,
    });
  }, [selectedEmpIds, resultFilter, recommendationFilter, dateBounds.from, dateBounds.to, setListFilters]);

  const listFiltered = filteredItems;
  const filtered = dateFilteredItems;
  const searchFiltered = sourceInvestigations;
  const [openDraft, setOpenDraft] = React.useState<OpenDraftForm>(OPEN_EMPTY);
  const [openFormError, setOpenFormError] = React.useState<string | null>(null);
  const [resultsTarget, setResultsTarget] = React.useState<HRDisciplineInvestigationRecord | null>(null);
  const [resultsDraft, setResultsDraft] = React.useState<InvestigationResultsDraftForm>(INVESTIGATION_RESULTS_EMPTY);
  const [resultsFormError, setResultsFormError] = React.useState<string | null>(null);
  const [resultsSaving, setResultsSaving] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [pdfOpen, setPdfOpen] = React.useState(false);
  const [detailRow, setDetailRow] = React.useState<HRDisciplineInvestigationRecord | null>(null);

  const [openDrawerOpen, setOpenDrawerOpen] = React.useState(false);

  const caseOptions = m.cases.map(c => ({ value: c.id, label: c.caseNumber, sub: c.employeeNameAr }));
  const investigatorOptions = m.employees.map((e) => ({ value: e.id, label: e.nameAr }));

  const statusCounts = React.useMemo(() => {
    const counts: Record<string, number> = { all: sourceInvestigations.length };
    for (const r of INVESTIGATION_RESULT_FILTER_ORDER) counts[r] = 0;
    for (const i of sourceInvestigations) counts[i.result] = (counts[i.result] ?? 0) + 1;
    return counts;
  }, [sourceInvestigations]);

  const dateRangeActive = dateMeta.hasRestriction;

  const activeFilterCount = (selectedEmpIds.size > 0 ? 1 : 0) + (resultFilter !== 'all' ? 1 : 0) + (recommendationFilter !== 'all' ? 1 : 0) + (dateMeta.hasRestriction ? 1 : 0);

  usePageHeaderActions(
    () => (
      <div className="flex items-center gap-2">
        <FilterToggleButton activeFilterCount={activeFilterCount} />
        <Button variant="luxe" size="sm" className="h-8 gap-1.5 px-3 text-xs shadow-sm shrink-0"
          onClick={() => { setOpenDraft({ ...OPEN_EMPTY, date: new Date().toISOString().slice(0, 10) }); setOpenFormError(null); setOpenDrawerOpen(true); }}>
          <Plus className="h-3.5 w-3.5" />
          فتح تحقيق
        </Button>
      </div>
    ),
    [activeFilterCount],
  );

  const investigationsFilterSummary = React.useMemo(() => {
    const parts: string[] = [];
    parts.push(selectedEmpIds.size === 0 ? 'الموظفون: الكل' : `الموظفون: ${selectedEmpIds.size} محدد`);
    parts.push(`النتيجة: ${resultFilter === 'all' ? 'الكل' : INVESTIGATION_RESULT_LABELS[resultFilter]}`);
    if (recommendationFilter !== 'all') {
      parts.push(`التوصية: ${INVESTIGATION_RECOMMENDATION_LABELS[recommendationFilter]}`);
    }
    parts.push(`التاريخ: ${dateBounds.from || dateBounds.to ? `${dateBounds.from || '…'} — ${dateBounds.to || '…'}` : 'كل الفترات'}`);
    return parts.join(' · ');
  }, [selectedEmpIds.size, resultFilter, recommendationFilter, dateBounds.from, dateBounds.to]);

  const investigationsPdfRows = React.useMemo(
    () =>
      listFiltered.map((inv) => [
        inv.caseNumber,
        inv.employeeNameAr,
        inv.investigatorName,
        inv.date,
        INVESTIGATION_RESULT_LABELS[inv.result],
        inv.recommendation,
      ]),
    [listFiltered],
  );

  const printable = React.useMemo(
    () =>
      investigationsPdfRows.length === 0 ? null : (
        <GenericRegisterPrintHtml
          companyNameAr={m.company?.nameAr ?? '—'}
          companyNameEn={m.company?.nameEn ?? m.company?.nameAr ?? '—'}
          titleAr="سجل التحقيقات"
          filterSummary={investigationsFilterSummary}
          headers={['رقم القضية', 'الموظف', 'المحقق', 'التاريخ', 'النتيجة', 'التوصية']}
          rows={investigationsPdfRows}
          landscape
        />
      ),
    [investigationsPdfRows, investigationsFilterSummary, m.company],
  );

  const handleExportInvestigationsExcel = React.useCallback(async () => {
    if (listFiltered.length === 0) {
      toast.error('لا توجد تحقيقات للتصدير ضمن الفلاتر الحالية.');
      return;
    }
    const header: XlsxCell[] = ['رقم القضية', 'الموظف', 'المحقق', 'التاريخ', 'النتيجة', 'التوصية'];
    const rows: XlsxCell[][] = [
      header,
      ...listFiltered.map((inv) => [
        inv.caseNumber,
        inv.employeeNameAr,
        inv.investigatorName,
        inv.date,
        INVESTIGATION_RESULT_LABELS[inv.result],
        inv.recommendation,
      ]),
    ];
    await downloadXlsxFromAoA('discipline-investigations.xlsx', 'التحقيقات', rows);
    toast.success('تم تنزيل ملف Excel.');
  }, [listFiltered]);

  const setOpen = (patch: Partial<OpenDraftForm>) => setOpenDraft((d) => ({ ...d, ...patch }));
  const setResults = (patch: Partial<InvestigationResultsDraftForm>) => setResultsDraft((d) => ({ ...d, ...patch }));

  const openResultsDrawer = React.useCallback((inv: HRDisciplineInvestigationRecord) => {
    setResultsTarget(inv);
    setResultsDraft({
      investigationDate: inv.date,
      investigatorEmployeeId: inv.investigatorEmployeeId ?? '',
      employeeStatement: inv.employeeStatement ?? '',
      witnessStatement: inv.witnessStatement ?? '',
      result: 'proven',
      recommendationType: 'all',
      deductionType: 'days',
      deductionValue: '',
    });
    setResultsFormError(null);
  }, []);

  const columns = React.useMemo((): ColumnDef<HRDisciplineInvestigationRecord>[] => [
    {
      key: 'caseNumber',
      title: 'المخالفة',
      headerClassName: 'whitespace-nowrap',
      className: 'font-mono text-xs font-medium tabular-nums text-muted-foreground',
      render: (inv) => <span dir="ltr">{inv.caseNumber}</span>,
    },
    {
      key: 'employee',
      title: 'الموظف',
      headerClassName: 'whitespace-nowrap',
      className: 'max-w-[10rem] truncate font-medium',
      render: (inv) => inv.employeeNameAr,
    },
    {
      key: 'investigator',
      title: 'المحقق',
      headerClassName: 'whitespace-nowrap',
      className: 'max-w-[9rem] truncate text-xs',
      render: (inv) => inv.investigatorName,
    },
    {
      key: 'date',
      title: 'التاريخ',
      headerClassName: 'whitespace-nowrap',
      className: 'whitespace-nowrap font-mono text-xs tabular-nums',
      render: (inv) => <TableDateCell value={inv.date} />,
    },
    {
      key: 'result',
      title: 'النتيجة',
      headerClassName: 'whitespace-nowrap',
      className: 'whitespace-nowrap text-xs',
      render: (inv) => INVESTIGATION_RESULT_LABELS[inv.result],
    },
    {
      key: 'recommendation',
      title: 'التوصية',
      headerClassName: 'whitespace-nowrap',
      className: 'whitespace-nowrap text-xs',
      render: (inv) => inv.recommendationType ? INVESTIGATION_RECOMMENDATION_LABELS[inv.recommendationType] : '—',
    },
    {
      key: 'deductionType',
      title: 'نوع الاستقطاع',
      headerClassName: 'whitespace-nowrap',
      className: 'whitespace-nowrap text-xs text-muted-foreground',
      render: (inv) => inv.deductionType ? INVESTIGATION_DEDUCTION_TYPE_LABELS[inv.deductionType] : '—',
    },
    {
      key: 'deductionValue',
      title: 'قيمة الاستقطاع',
      headerClassName: 'whitespace-nowrap',
      className: 'whitespace-nowrap font-mono text-xs tabular-nums text-muted-foreground',
      render: (inv) => <span dir="ltr">{inv.deductionValue != null ? inv.deductionValue : '—'}</span>,
    },
    {
      key: 'employeeStatement',
      title: 'أقوال الموظف',
      headerClassName: 'whitespace-nowrap',
      className: 'max-w-[14rem] text-xs text-muted-foreground',
      render: (inv) => (
        <span className="line-clamp-2" title={inv.employeeStatement || undefined}>{inv.employeeStatement || '—'}</span>
      ),
    },
    {
      key: 'witnessStatement',
      title: 'أقوال الشهود',
      headerClassName: 'whitespace-nowrap',
      className: 'max-w-[14rem] text-xs text-muted-foreground',
      render: (inv) => (
        <span className="line-clamp-2" title={inv.witnessStatement || undefined}>{inv.witnessStatement || '—'}</span>
      ),
    },
    {
      key: 'actions',
      title: 'إجراءات',
      isActions: true,
      headerClassName: 'whitespace-nowrap',
      render: (inv) => (
        canMutateInvestigationRecord(inv.result) ? (
          <TableRowActions
            primaryActions={[
              {
                label: 'إدخال النتائج',
                variant: 'primary',
                icon: <ClipboardCheck className="h-3.5 w-3.5" />,
                onClick: () => openResultsDrawer(inv),
              },
            ]}
            menuItems={[
              {
                label: 'حذف',
                onClick: () => setDeleteId(inv.id),
                icon: <Trash2 className="h-3.5 w-3.5" />,
                destructive: true,
                separator: true,
              },
            ]}
          />
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )
      ),
    },
  ], [openResultsDrawer]);

  const handleCaseSelect = (caseId: string) => {
    const c = m.cases.find(x => x.id === caseId);
    if (!c) { setOpen({ caseId: '', caseNumber: '', employeeId: '', employeeNameAr: '' }); return; }
    setOpen({ caseId: c.id, caseNumber: c.caseNumber, employeeId: c.employeeId, employeeNameAr: c.employeeNameAr });
  };

  const handleOpenSave = async () => {
    setOpenFormError(null);
    if (!openDraft.caseId) { setOpenFormError('المخالفة مطلوبة'); return; }
    if (!openDraft.investigatorEmployeeId) { setOpenFormError('المحقق مطلوب'); return; }
    if (!openDraft.date) { setOpenFormError('التاريخ مطلوب'); return; }
    if (!m.companyId) { setOpenFormError('تعذر تحديد الشركة'); return; }

    try {
      await m.openInvestigation({
        companyId: m.companyId,
        violationRecordId: openDraft.caseId,
        investigatorEmployeeId: openDraft.investigatorEmployeeId,
        investigationDate: openDraft.date,
      });
      toast.success('تم فتح التحقيق — أدخل النتائج من بطاقة التحقيق');
      setOpenDrawerOpen(false);
      setOpenDraft(OPEN_EMPTY);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'discipline-investigations.open');
      setOpenFormError(displayMessage);
    }
  };

  const handleResultsSave = async () => {
    if (!resultsTarget) return;
    setResultsFormError(null);

    const mergedDraft: InvestigationResultsDraftForm = {
      ...resultsDraft,
      investigatorEmployeeId:
        resultsDraft.investigatorEmployeeId || resultsTarget.investigatorEmployeeId || '',
    };

    const validationError = validateInvestigationResultsDraft(mergedDraft, {
      requireInvestigationDate: false,
    });
    if (validationError) {
      setResultsFormError(validationError);
      return;
    }

    setResultsSaving(true);
    try {
      await m.submitResults(resultsTarget.id, buildSubmitInvestigationResultsDto(mergedDraft));
      toast.success('تم إدخال نتائج التحقيق');
      setResultsTarget(null);
      setResultsDraft(INVESTIGATION_RESULTS_EMPTY);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'discipline-investigations.submit-results');
      setResultsFormError(displayMessage);
    } finally {
      setResultsSaving(false);
    }
  };

  useEntityFilterSlot(
    () => (
      <DisciplineFilterToolbar
        ref={filterToolbarRef}
        showPrimaryAction={false}
        primaryActionLabel="فتح تحقيق"
        onPrimaryAction={() => { setOpenDraft({ ...OPEN_EMPTY, date: new Date().toISOString().slice(0, 10) }); setOpenFormError(null); setOpenDrawerOpen(true); }}
        toolbarExtraTrailing={(
          <>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="h-8 gap-1.5 text-xs"
              onClick={() => {
                if (investigationsPdfRows.length === 0) {
                  toast.error('لا توجد تحقيقات للتصدير ضمن الفلاتر الحالية.');
                  return;
                }
                setPdfOpen(true);
              }}
            >
              <FileDown className="h-3.5 w-3.5" />
              PDF
            </Button>
            <Button type="button" variant="outline" size="sm" className="h-8 gap-1.5 text-xs" onClick={() => void handleExportInvestigationsExcel()}>
              <FileSpreadsheet className="h-3.5 w-3.5" />
              Excel
            </Button>
          </>
        )}
        empPickerEmployees={empPickerList}
        selectedEmpIds={selectedEmpIds}
        onSelectedEmpIdsChange={setSelectedEmpIds}
        statusFilter={resultFilter}
        onStatusFilterChange={(v) => setResultFilter(v as ResultFilter)}
        statusOrder={INVESTIGATION_RESULT_FILTER_ORDER}
        statusLabels={INVESTIGATION_RESULT_LABELS as unknown as Record<string, string>}
        statusCounts={statusCounts}
        moreFilters={[
          {
            id: 'recommendation',
            value: recommendationFilter,
            onChange: (v) => setRecommendationFilter(v as RecommendationFilter),
            placeholder: 'التوصية',
            options: [
              { value: 'all', label: 'كل التوصيات' },
              ...Object.entries(INVESTIGATION_RECOMMENDATION_LABELS).map(([value, label]) => ({ value, label })),
            ],
          },
        ]}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onDateBoundsChange={onDateBoundsChange}
        onDateFilterMetaChange={onDateFilterMetaChange}
      />
    ),
    [
      empPickerList,
      selectedEmpIds,
      resultFilter,
      recommendationFilter,
      statusCounts,
      viewMode,
      investigationsPdfRows.length,
      onDateBoundsChange,
      onDateFilterMetaChange,
      handleExportInvestigationsExcel,
    ],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <PdfPreviewExportDialog
        open={pdfOpen}
        onOpenChange={setPdfOpen}
        title="معاينة تصدير التحقيقات"
        fileName="discipline-investigations.pdf"
        printable={printable}
      />

      {m.listError ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive whitespace-pre-wrap">
          {m.listError}
        </p>
      ) : null}

      <DisciplineListViewport>
      {m.loading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">جاري التحميل...</p>
      ) : searchFiltered.length === 0 ? (
        <EmptyState title="لا توجد تحقيقات مطابقة للبحث أو الموظفين المحددين." />
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-14 text-center">
          <p className="text-sm text-muted-foreground">
            {dateMeta.tab === 'today'
              ? 'لا توجد تحقيقات بتاريخ اليوم ضمن النتائج الحالية.'
              : dateMeta.tab === 'week'
                ? 'لا توجد تحقيقات ضمن هذا الأسبوع ضمن النتائج الحالية.'
                : dateMeta.tab === 'month'
                  ? 'لا توجد تحقيقات ضمن هذا الشهر ضمن النتائج الحالية.'
                  : dateMeta.tab === 'custom' && dateRangeActive
                    ? 'لا توجد تحقيقات ضمن نطاق التاريخ المخصص مع عوامل البحث الحالية.'
                    : 'لا توجد تحقيقات ضمن النتائج الحالية.'}
          </p>
          {dateRangeActive ? (
            <Button variant="link" size="sm" className="mt-2 text-xs" onClick={() => filterToolbarRef.current?.resetDateFilter()}>
              عرض كل الفترات
            </Button>
          ) : null}
        </div>
      ) : listFiltered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-14 text-center">
          <p className="text-sm text-muted-foreground">
            لا توجد تحقيقات بنتيجة «{resultFilter === 'all' ? '' : INVESTIGATION_RESULT_LABELS[resultFilter]}» مع عوامل البحث الحالية.
          </p>
          <Button variant="link" size="sm" className="mt-2 text-xs" onClick={() => filterToolbarRef.current?.resetStatusFilter()}>
            عرض الكل
          </Button>
        </div>
      ) : (
        <DisciplinePaginatedList pagination={pagination}>
          {viewMode === 'cards' ? (
          <EntityActionCardGrid>
            {items.map((inv) => (
            <EntityActionCard
              key={inv.id}
              reference={inv.caseNumber}
              title={inv.employeeNameAr ?? '—'}
              status={{ label: INVESTIGATION_RESULT_LABELS[inv.result], tone: inv.result === 'pending' ? 'pending' : 'info' }}
              chips={
                <>
                  <EntityActionCardChip>المحقق: {inv.investigatorName ?? '—'}</EntityActionCardChip>
                  <EntityActionCardChip className="font-mono tabular-nums">
                    <span className="inline-flex items-center gap-1" dir="ltr">
                      <CalendarDays className="h-3 w-3 shrink-0" />
                      {inv.date}
                    </span>
                  </EntityActionCardChip>
                </>
              }
              onClick={() => setDetailRow(inv)}
              onDelete={canMutateInvestigationRecord(inv.result) ? () => setDeleteId(inv.id) : undefined}
              extraFooter={
                canMutateInvestigationRecord(inv.result) ? (
                  <Button
                    variant="secondary"
                    size="sm"
                    className="h-7 w-full gap-1.5 text-xs"
                    type="button"
                    onClick={(e) => { e.stopPropagation(); openResultsDrawer(inv); }}
                  >
                    <ClipboardCheck className="h-3.5 w-3.5" />
                    إدخال النتائج
                  </Button>
                ) : undefined
              }
            >
              {inv.employeeStatement?.trim() ? (
                <div className="space-y-0.5">
                  <p className="text-[10px] font-medium text-muted-foreground/80">أقوال الموظف</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground text-right" title={inv.employeeStatement}>
                    {inv.employeeStatement}
                  </p>
                </div>
              ) : null}
              {inv.witnessStatement?.trim() ? (
                <div className="space-y-0.5">
                  <p className="text-[10px] font-medium text-muted-foreground/80">أقوال الشهود</p>
                  <p className="line-clamp-2 text-xs text-muted-foreground text-right" title={inv.witnessStatement}>
                    {inv.witnessStatement}
                  </p>
                </div>
              ) : null}
              {inv.recommendationType === 'deduction' ? (
                <div className="space-y-0.5 text-xs text-muted-foreground">
                  <p>التوصية: {INVESTIGATION_RECOMMENDATION_LABELS.deduction}</p>
                  {inv.deductionType ? <p>نوع الاستقطاع: {INVESTIGATION_DEDUCTION_TYPE_LABELS[inv.deductionType]}</p> : null}
                  {inv.deductionValue != null ? (
                    <p className="font-mono tabular-nums" dir="ltr">قيمة الاستقطاع: {inv.deductionValue}</p>
                  ) : null}
                </div>
              ) : inv.recommendationType === 'warning' ? (
                <p className="text-xs text-muted-foreground">التوصية: {INVESTIGATION_RECOMMENDATION_LABELS.warning}</p>
              ) : null}
            </EntityActionCard>
            ))}
          </EntityActionCardGrid>
          ) : (
          <DataTable
            variant="directory"
            alwaysShowTable
            tableClassName="min-w-[720px]"
            columns={columns}
            data={items}
            keyExtractor={(inv) => inv.id}
            onRowClick={(inv) => setDetailRow(inv)}
          />
          )}
        </DisciplinePaginatedList>
      )}
      </DisciplineListViewport>

      <HRSettingsFormDrawer
        open={openDrawerOpen}
        onOpenChange={setOpenDrawerOpen}
        title="فتح تحقيق"
        size="lg"
        onSave={() => void handleOpenSave()}
        error={openFormError}
      >
        <p className="text-xs text-muted-foreground">
          يُفتح التحقيق بحالة «قيد التحقيق». بعد الحفظ استخدم «إدخال النتائج» لإرسال النتيجة والتوصية إلى النظام.
        </p>
        <FormField label="المخالفة" required>
          <SearchableDropdown value={openDraft.caseId} onChange={handleCaseSelect} options={caseOptions} placeholder="اختر المخالفة…" />
        </FormField>
        {openDraft.employeeNameAr ? (
          <div className="rounded-lg bg-muted/40 px-3 py-2 text-sm"><span className="text-muted-foreground">الموظف: </span>{openDraft.employeeNameAr}</div>
        ) : null}
        <FormField label="المحقق" required>
          <SearchableDropdown
            value={openDraft.investigatorEmployeeId}
            onChange={(v) => {
              const selected = m.employees.find((emp) => emp.id === v);
              setOpen({
                investigatorEmployeeId: v,
                investigatorName: selected?.nameAr ?? '',
              });
            }}
            options={investigatorOptions}
            placeholder="اختر المحقق…"
          />
        </FormField>
        <FormField label="تاريخ التحقيق" required>
          <DatePickerInput value={openDraft.date} onChange={(ymd) => setOpen({ date: ymd })} />
        </FormField>
      </HRSettingsFormDrawer>

      <HRSettingsFormDrawer
        open={resultsTarget != null}
        onOpenChange={(o) => { if (!o) { setResultsTarget(null); setResultsDraft(INVESTIGATION_RESULTS_EMPTY); setResultsFormError(null); } }}
        title={resultsTarget ? `إدخال نتائج التحقيق — ${resultsTarget.caseNumber}` : 'إدخال نتائج التحقيق'}
        size="lg"
        onSave={() => void handleResultsSave()}
        saveDisabled={resultsSaving}
        error={resultsFormError}
      >
        {resultsTarget ? (
          <div className="rounded-lg bg-muted/40 px-3 py-2 text-sm">
            <span className="text-muted-foreground">الموظف: </span>{resultsTarget.employeeNameAr ?? '—'}
          </div>
        ) : null}
        <InvestigationResultsFormFields
          draft={resultsDraft}
          onChange={setResults}
          investigatorOptions={investigatorOptions}
          showInvestigationDate={false}
        />
      </HRSettingsFormDrawer>

      <ConfirmationModal
        open={!!deleteId}
        onOpenChange={v => !v && setDeleteId(null)}
        onConfirm={() => {
          if (!deleteId) return;
          void (async () => {
            try {
              await m.remove(deleteId);
              toast.success('تم الحذف');
              setDeleteId(null);
            } catch (err) {
              const { displayMessage } = handleApiError(err, 'discipline-investigations.delete');
              toast.error(displayMessage);
            }
          })();
        }}
        title="حذف التحقيق"
      />

      <TableRowDetailDialog
        open={detailRow != null}
        onOpenChange={(o) => !o && setDetailRow(null)}
        title="تفاصيل التحقيق"
        fields={detailRow ? [
          { label: 'المخالفة', value: detailRow.caseNumber },
          { label: 'الموظف', value: detailRow.employeeNameAr },
          { label: 'المحقق', value: detailRow.investigatorName },
          { label: 'التاريخ', value: <TableDateCell value={detailRow.date} /> },
          { label: 'النتيجة', value: INVESTIGATION_RESULT_LABELS[detailRow.result] },
          { label: 'التوصية', value: detailRow.recommendationType ? INVESTIGATION_RECOMMENDATION_LABELS[detailRow.recommendationType] : '—' },
          { label: 'نوع الاستقطاع', value: detailRow.deductionType ? INVESTIGATION_DEDUCTION_TYPE_LABELS[detailRow.deductionType] : '—' },
          { label: 'قيمة الاستقطاع', value: detailRow.deductionValue != null ? detailRow.deductionValue : '—' },
          { label: 'أقوال الموظف', value: detailRow.employeeStatement || '—' },
          { label: 'أقوال الشهود', value: detailRow.witnessStatement || '—' },
        ] : []}
      />
    </div>
  );
}
