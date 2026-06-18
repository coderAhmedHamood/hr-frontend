'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Plus, FileText, User, CalendarRange, Coins, ChevronRight } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { EntityFilterToolbar } from '@/components/ui/entity-filter-toolbar';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import { usePageFilters } from '@/components/layouts/filter-panel-context';
import {
  EmptyState,
} from '@/features/hr/requests/components/shared-ui';
import { DirectoryPagedViews, useServerDirectoryPagination } from '@/components/ui/paged-list';
import { fetchAllPaginatedItems } from '@/features/hr/lib/api/client';
import { employeeContractsApi } from '@/features/hr/contracts/lib/contracts-api';
import {
  useHRContractsStore,
  mapEmployeeContractFromApi,
  CONTRACT_STATUS_LABELS,
  CONTRACT_STATUS_COLORS,
  contractNatureLabel,
  workArrangementLabel,
  type HRContractDraft,
  type HRContractLifecycleStatus,
  type HRContractNature,
  type HRContractRecord,
  type HRWorkArrangement,
} from '@/features/hr/contracts/lib/contracts-store';
import { useHRContractTemplatesStore } from '@/features/hr/contracts/lib/contract-templates-store';
import { contractTemplatesApi } from '@/features/hr/contracts/contract-templates/lib/api/contract-templates';
import { applyContractTemplateToForm, computeTemplateEndDate } from '@/features/hr/contracts/employment/utils/apply-contract-template';
import { useHRAllowanceTypesStore } from '@/features/hr/contracts/lib/allowance-types-store';
import { useHRContractArticlesStore } from '@/features/hr/contracts/lib/contract-articles-store';
import { useHREmployeeDirectoryStore } from '@/features/hr/requests/lib/employee-directory-store';
import { cn, formatNumber } from '@/shared/utils';
import { hrContractsRoutes } from '@/features/hr/contracts/constants/routes';
import {
  HR_CONTRACTS_MODE_PARAM,
  type AllowanceLine,
  type EmploymentContractFormValues,
  emptyEmploymentContractForm,
  recordToEmploymentForm,
  cloneEmploymentFormFromContract,
  employmentFormToDraft,
  mergeEssentialArticleIds,
  EMPLOYMENT_STATUS_FILTER_OPTIONS,
  EMPLOYMENT_KIND_FILTER_OPTIONS,
} from '@/features/hr/contracts/employment/utils/employment-contract-form';
import { EmploymentContractTerminateModal as TerminateModal } from '@/features/hr/contracts/employment/components/employment-contract-terminate-modal';
import { EmploymentContractSignatureCard } from '@/features/hr/contracts/employment/components/employment-contract-signature-card';
import { EmploymentContractDetailDialog } from '@/features/hr/contracts/employment/components/employment-contract-detail-dialog';
import { EmploymentContractFormDialog } from '@/features/hr/contracts/employment/components/employment-contract-form-dialog';
import { ContractLeaveTypePickerDialog } from '@/features/hr/contracts/employment/components/contract-leave-type-picker-dialog';
import {
  canActivateEmploymentContract,
  canRecordEmployeeContractAcceptance,
  contractCreditsLeaveDays,
  isTerminatedEmploymentContract,
} from '@/features/hr/contracts/employment/utils/contract-leave-credit';
import { PdfPreviewExportDialog } from '@/components/pdf/pdf-preview-export-dialog';
import { EmploymentContractPrintHtml } from '@/components/pdf/print/employment-contract-print-html';
import { getPdfLogoSrc } from '@/components/pdf/lib/pdf-logo-url';
import { useActiveCompany } from '@/features/hr/organization/hooks/useActiveCompany';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { getDefaultCompanyId, useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { sendEmploymentContractCreatedNotification } from '@/features/hr/contracts/employment/services/contract-created-notification.service';

type FormValues = EmploymentContractFormValues;
const recordToForm = recordToEmploymentForm;
const cloneFormFromContract = cloneEmploymentFormFromContract;
const formToDraft = employmentFormToDraft;

type PanelMode = 'create' | 'edit';
type StatusFilter = 'all' | HRContractLifecycleStatus;
type KindFilter = 'all' | HRContractNature;

export function EmploymentContractsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const modeParam = searchParams.get(HR_CONTRACTS_MODE_PARAM);

  const { data: activeCompany } = useActiveCompany();
  const companyId = useDefaultCompanyId();
  const { add, update, activate, employeeAccept, terminate, archive, createAmendmentDraft } = useHRContractsStore();
  const { templates, fetch: fetchTemplates } = useHRContractTemplatesStore();
  const { items: allowanceTypes, fetch: fetchAllowanceTypes } = useHRAllowanceTypesStore();
  const { articles, fetch: fetchArticles } = useHRContractArticlesStore();
  const { employees: allEmployees, fetch: fetchEmployees } = useHREmployeeDirectoryStore();
  const employees = React.useMemo(() => allEmployees.filter(e => e.status === 'active'), [allEmployees]);

  React.useEffect(() => {
    if (!companyId) return;
    fetchTemplates();
    fetchArticles();
    fetchEmployees();
    fetchAllowanceTypes();
  }, [companyId, fetchTemplates, fetchArticles, fetchEmployees, fetchAllowanceTypes]);

  const essentialArticleIds = React.useMemo(
    () => articles.filter(a => a.isActive && a.isBasic).map(a => a.id),
    [articles],
  );

  const activeArticles = React.useMemo(
    () => [...articles].filter(a => a.isActive).sort((a, b) => {
      if (a.isBasic !== b.isBasic) return a.isBasic ? -1 : 1;
      return a.code.localeCompare(b.code);
    }),
    [articles],
  );

  const empOptions = React.useMemo(() => employees.map(e => ({ value: e.id, label: `${e.nameAr} — ${e.jobTitleAr}` })), [employees]);
  const templateOptions = React.useMemo(
    () => [
      { value: '', label: 'بدون قالب' },
      ...[...templates]
        .filter((t) => t.isActive)
        .sort((a, b) => a.sortOrder - b.sortOrder || a.nameAr.localeCompare(b.nameAr, 'ar'))
        .map((t) => ({ value: t.id, label: t.nameAr })),
    ],
    [templates],
  );
  const [applyingTemplate, setApplyingTemplate] = React.useState(false);
  const allowanceOptions = React.useMemo(() =>
    allowanceTypes.filter(a => a.isActive).map(a => ({ value: a.id, label: `${a.code} — ${a.nameAr}` })),
    [allowanceTypes],
  );

  const { values, setValue } = usePageFilters([
    {
      key: 'status', label: 'الحالة', type: 'select',
      options: EMPLOYMENT_STATUS_FILTER_OPTIONS.map(({ value, label }) => ({ value, label })),
    },
    {
      key: 'kind', label: 'نوع العقد', type: 'select',
      options: EMPLOYMENT_KIND_FILTER_OPTIONS.map(({ value, label }) => ({ value, label })),
    },
  ]);

  const statusFilter = (values.status as StatusFilter) || 'all';
  const kindFilter = (values.kind as KindFilter) || 'all';

  const [selectedEmpIds, setSelectedEmpIds] = React.useState<Set<string>>(new Set());

  const empPickerList = React.useMemo(
    () => allEmployees.map((e) => ({ id: e.id, name: e.nameAr })),
    [allEmployees],
  );

  const selectedEmpKey = React.useMemo(() => [...selectedEmpIds].sort().join(','), [selectedEmpIds]);
  const bulkMode = selectedEmpIds.size > 1;

  const buildListQuery = React.useCallback((page: number, pageSize: number) => ({
    companyId: companyId!,
    page,
    limit: pageSize,
    ...(statusFilter !== 'all' ? { status: statusFilter } : {}),
    ...(kindFilter !== 'all' ? { contractNature: kindFilter } : {}),
    ...(selectedEmpIds.size === 1 ? { employeeId: [...selectedEmpIds][0] } : {}),
  }), [companyId, statusFilter, kindFilter, selectedEmpIds]);

  const loadPage = React.useCallback(async (page: number, pageSize: number) => {
    if (!companyId) return { items: [] as HRContractRecord[], total: 0 };
    try {
      const res = await employeeContractsApi.list(buildListQuery(page, pageSize));
      return { items: res.items.map(mapEmployeeContractFromApi), total: res.pagination.total };
    } catch (err) {
      handleApiError(err, 'contracts.list');
      return { items: [], total: 0 };
    }
  }, [buildListQuery, companyId]);

  const loadBulk = React.useCallback(async () => {
    if (!companyId) return { items: [] as HRContractRecord[], total: 0 };
    try {
      const res = await fetchAllPaginatedItems((page, limit) => employeeContractsApi.list(buildListQuery(page, limit)));
      const scoped = selectedEmpIds.size > 0
        ? res.items.filter((c) => selectedEmpIds.has(c.employeeId))
        : res.items;
      const items = scoped.map(mapEmployeeContractFromApi);
      return { items, total: items.length };
    } catch (err) {
      handleApiError(err, 'contracts.list');
      return { items: [], total: 0 };
    }
  }, [buildListQuery, companyId, selectedEmpIds]);

  const {
    items: filtered,
    loading: listLoading,
    pagination,
    reload: reloadList,
  } = useServerDirectoryPagination<HRContractRecord>(loadPage, {
    enabled: !!companyId,
    bulkMode,
    loadBulk: bulkMode ? loadBulk : undefined,
    resetDeps: [companyId, statusFilter, kindFilter, selectedEmpKey],
  });

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [panelMode, setPanelMode] = React.useState<PanelMode>('create');
  const [detailContractId, setDetailContractId] = React.useState<string | null>(null);
  const [detailRefreshKey, setDetailRefreshKey] = React.useState(0);
  const [selected, setSelected] = React.useState<HRContractRecord | null>(null);
  const [form, setForm] = React.useState<FormValues>(() => emptyEmploymentContractForm());
  const [error, setError] = React.useState<string | null>(null);
  const [terminateId, setTerminateId] = React.useState<string | null>(null);
  const [terminateReason, setTerminateReason] = React.useState('');
  const [leavePicker, setLeavePicker] = React.useState<{
    contractId: string;
    annualLeaveDays: number;
  } | null>(null);
  const [copyFromEmployeeId, setCopyFromEmployeeId] = React.useState('');
  const [copyFromContractId, setCopyFromContractId] = React.useState('');
  const [copySourceContracts, setCopySourceContracts] = React.useState<HRContractRecord[]>([]);

  React.useEffect(() => {
    if (!copyFromEmployeeId || !companyId) {
      setCopySourceContracts([]);
      return;
    }
    void employeeContractsApi
      .list({ companyId, employeeId: copyFromEmployeeId, limit: 200 })
      .then((res) => setCopySourceContracts(res.items.map(mapEmployeeContractFromApi)))
      .catch(() => setCopySourceContracts([]));
  }, [copyFromEmployeeId, companyId]);

  React.useEffect(() => {
    if (drawerOpen && companyId && allowanceTypes.length === 0) {
      void fetchAllowanceTypes();
    }
  }, [drawerOpen, companyId, allowanceTypes.length, fetchAllowanceTypes]);

  const [contractPdfOpen, setContractPdfOpen] = React.useState(false);
  const [contractPrintable, setContractPrintable] = React.useState<React.ReactElement | null>(null);

  const getEmpName = (id: string) => allEmployees.find(e => e.id === id)?.nameAr ?? id;

  React.useEffect(() => {
    if (!contractPdfOpen) setContractPrintable(null);
  }, [contractPdfOpen]);

  const openEmploymentContractPdf = React.useCallback((source?: FormValues, employeeNameOverride?: string) => {
    const values = source ?? form;
    if (!values.employeeId.trim()) {
      toast.error('اختر الموظف أولاً');
      return;
    }
    if (!values.startDate.trim()) {
      toast.error('حدّد تاريخ البداية لاستكمال نص العرض');
      return;
    }
    const empAr = employeeNameOverride ?? getEmpName(values.employeeId);
    const allowanceRows = values.allowanceLines
      .filter((l) => l.allowanceTypeId.trim())
      .map((l) => ({
        labelAr: allowanceTypes.find((a) => a.id === l.allowanceTypeId)?.nameAr ?? l.allowanceTypeId,
        amount: String(l.amount || '0'),
      }));
    const selectedArticles = values.articleIds
      .map((id) => articles.find((a) => a.id === id))
      .filter(Boolean) as typeof articles;

    selectedArticles.sort((a, b) => {
      if (a!.isBasic !== b!.isBasic) return a!.isBasic ? -1 : 1;
      return a!.code.localeCompare(b!.code);
    });

    const artLines = selectedArticles.map((a) => ({
      code: a.code,
      titleAr: a.title,
      bodySnippet:
        `${(a.body || '').replace(/\s+/g, ' ').trim().slice(0, 480)}${(a.body?.length ?? 0) > 480 ? '…' : ''}`,
    }));

    const company = {
      nameAr: activeCompany?.nameAr ?? '',
      nameEn: activeCompany?.nameEn ?? '',
    };

    const printable = (
      <EmploymentContractPrintHtml
        logoSrc={getPdfLogoSrc()}
        company={company}
        employeeNameAr={empAr}
        contractNumber={values.contractNumber.trim() || '—'}
        natureLabelAr={contractNatureLabel(values.contractType)}
        arrangementLabelAr={workArrangementLabel(values.workArrangement)}
        startDate={values.startDate}
        endDate={values.endDate}
        probationDaysLabel={values.probationDays.trim() ? `${values.probationDays} يوم` : 'بدون'}
        annualLeaveDaysLabel={`${values.annualLeaveDays || '—'} يوم`}
        baseSalary={formatNumber(Number(values.baseSalary) || 0)}
        currency={values.currency}
        allowancesNote={values.allowancesNote}
        deductionsNote={values.deductionsNote}
        allowanceRows={allowanceRows}
        articles={artLines}
      />
    );
    setContractPrintable(printable);
    setContractPdfOpen(true);
  }, [
    form,
    allowanceTypes,
    articles,
    activeCompany,
    getEmpName,
  ]);

  const openContractPdfFromRecord = React.useCallback((record: HRContractRecord) => {
    openEmploymentContractPdf(recordToForm(record), record.employeeNameAr || getEmpName(record.employeeId));
  }, [openEmploymentContractPdf, getEmpName]);

  const syncContractInStore = React.useCallback((record: HRContractRecord) => {
    useHRContractsStore.setState((s) => ({
      contracts: s.contracts.some((c) => c.id === record.id)
        ? s.contracts.map((c) => (c.id === record.id ? record : c))
        : [record, ...s.contracts],
    }));
  }, []);

  const copySourceEmpOptions = React.useMemo(() => {
    const ids = new Set(filtered.map(c => c.employeeId));
    return employees.filter(e => ids.has(e.id)).map(e => ({ value: e.id, label: `${e.nameAr} — ${e.jobTitleAr}` }));
  }, [filtered, employees]);

  const copySourceContractOptions = React.useMemo(() => {
    if (!copyFromEmployeeId) return [];
    return [...copySourceContracts]
      .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
      .map(c => ({
        value: c.id,
        label: `${c.contractNumber} · ${contractNatureLabel(c.contractType)} · ${CONTRACT_STATUS_LABELS[c.status]} · ${c.startDate}`,
      }));
  }, [copySourceContracts, copyFromEmployeeId]);

  /* ── URL mode sync ── */
  React.useEffect(() => {
    if (modeParam === 'createContract') {
      const f = emptyEmploymentContractForm(essentialArticleIds);
      setSelected(null); setForm(f); setPanelMode('create'); setError(null);
      setCopyFromEmployeeId(''); setCopyFromContractId('');
      setDrawerOpen(true);
    }
  }, [modeParam, essentialArticleIds]);

  React.useEffect(() => {
    if (!drawerOpen || essentialArticleIds.length === 0) return;
    setForm((f) => {
      const merged = mergeEssentialArticleIds(f.articleIds, essentialArticleIds);
      if (merged.length === f.articleIds.length && essentialArticleIds.every((id) => f.articleIds.includes(id))) {
        return f;
      }
      return { ...f, articleIds: merged };
    });
  }, [essentialArticleIds, drawerOpen]);

  const closeDrawer = () => {
    setDrawerOpen(false);
    setCopyFromEmployeeId('');
    setCopyFromContractId('');
    if (modeParam) {
      router.replace(hrContractsRoutes.employment, { scroll: false });
    }
  };

  const handleApplyCopyFromContract = () => {
    const src = copySourceContracts.find(c => c.id === copyFromContractId);
    if (!src) {
      toast.error('اختر عقد المصدر أولاً');
      return;
    }
    setForm(f => {
      const cloned = cloneFormFromContract(f.employeeId, src);
      return {
        ...cloned,
        articleIds: mergeEssentialArticleIds(cloned.articleIds, essentialArticleIds),
      };
    });
    toast.success('تم نسخ بيانات العقد. راجع الموظف المستهدف والتواريخ ثم احفظ.');
  };

  const openCreate = () => {
    router.push(`${hrContractsRoutes.employment}?${HR_CONTRACTS_MODE_PARAM}=createContract`);
  };

  const activeFilterCount = (kindFilter !== 'all' ? 1 : 0) + (statusFilter !== 'all' ? 1 : 0) + (selectedEmpIds.size > 0 ? 1 : 0);

  usePageHeaderActions(
    () => (
      <div className="flex items-center gap-2">
        <FilterToggleButton activeFilterCount={activeFilterCount} />
        <Button variant="luxe" size="sm" className="h-8 gap-1.5 px-3 text-xs shadow-sm shrink-0" onClick={openCreate}>
          <Plus className="h-3.5 w-3.5" />
          عقد جديد
        </Button>
      </div>
    ),
    [activeFilterCount],
  );

  const openView = (c: HRContractRecord) => {
    if (modeParam) router.replace(hrContractsRoutes.employment, { scroll: false });
    setDetailContractId(c.id);
  };

  const openEditFromDetail = (c: HRContractRecord) => {
    setDetailContractId(null);
    setSelected(c);
    setForm({
      ...recordToForm(c),
      articleIds: mergeEssentialArticleIds(c.articleIds, essentialArticleIds),
    });
    setPanelMode('edit');
    setError(null);
    setDrawerOpen(true);
  };

  const openAmendment = async (c: HRContractRecord) => {
    const res = await createAmendmentDraft(c.id);
    if (!res.ok) { toast.error(res.message); return; }
    const draft = useHRContractsStore.getState().contracts.find(x => x.id === res.id);
    if (draft) {
      setSelected(draft);
      setForm({
        ...recordToForm(draft),
        articleIds: mergeEssentialArticleIds(draft.articleIds, essentialArticleIds),
      });
      setPanelMode('edit');
      setError(null);
      setDrawerOpen(true);
    }
    toast.success('تم إنشاء مسودة التعديل الرسمي.');
  };

  const handleSave = async () => {
    if (!form.employeeId) { setError('اختر الموظف'); return; }
    if (!form.startDate) { setError('تاريخ البداية مطلوب'); return; }
    if (form.contractType === 'fixed_term' && !form.endDate) { setError('تاريخ الانتهاء مطلوب للعقود محددة المدة'); return; }
    const alRaw = form.annualLeaveDays.trim();
    const alNum = parseInt(alRaw, 10);
    if (alRaw === '' || !Number.isFinite(alNum) || alNum < 0 || alNum > 366) {
      setError('أدخل عدداً صحيحاً للإجازات السنوية (0–366 يوماً).');
      return;
    }
    try {
      const payload = {
        ...form,
        articleIds: mergeEssentialArticleIds(form.articleIds, essentialArticleIds),
      };
      if (panelMode === 'create') {
        const { id: contractId, contractNumber } = await add(formToDraft(payload, 'draft'));
        const companyId = getDefaultCompanyId() ?? '';
        const actor = useAuthStore.getState().user?.email ?? undefined;

        let notificationSent = false;
        if (companyId && form.employeeId) {
          try {
            await sendEmploymentContractCreatedNotification({
              companyId,
              contractId,
              employeeId: form.employeeId,
              contractNumber,
              startDate: form.startDate,
              createdBy: actor,
            });
            notificationSent = true;
          } catch (notifErr) {
            const { displayMessage } = handleApiError(notifErr, 'employment-contract.notification');
            toast.error(`تم إنشاء العقد لكن فشل إرسال الإشعار: ${displayMessage}`);
          }
        }

        toast.success(
          notificationSent
            ? `تم إنشاء العقد كمسودة — وتم إرسال إشعار إلى ${getEmpName(form.employeeId)}.`
            : 'تم إنشاء العقد كمسودة.',
        );
      } else if (panelMode === 'edit' && selected) {
        const res = await update(selected.id, formToDraft(payload, selected.status));
        if (!res.ok) { setError(res.message); return; }
      }
      closeDrawer();
      await reloadList();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const runActivate = async (id: string, leaveTypeId?: string) => {
    const res = await activate(id, leaveTypeId);
    if (!res.ok) throw new Error(res.message);
    toast.success('تم تفعيل العقد.');
    setDetailRefreshKey((k) => k + 1);
    await reloadList();
  };

  const runEmployeeAccept = async (id: string) => {
    const res = await employeeAccept(id);
    if (!res.ok) throw new Error(res.message);
    toast.success('تم تسجيل موافقة الموظف على العقد.');
    setDetailRefreshKey((k) => k + 1);
    await reloadList();
  };

  const handleActivate = (contract: HRContractRecord) => {
    if (contractCreditsLeaveDays(contract)) {
      setLeavePicker({
        contractId: contract.id,
        annualLeaveDays: contract.annualLeaveDays ?? 0,
      });
      return;
    }
    void runActivate(contract.id);
  };

  const handleEmployeeAccept = (contract: HRContractRecord) => {
    void runEmployeeAccept(contract.id);
  };

  const handleLeavePickerConfirm = async (leaveTypeId: string) => {
    if (!leavePicker) return;
    await runActivate(leavePicker.contractId, leaveTypeId);
  };

  const handleTerminate = async () => {
    if (!terminateId) return;
    const res = await terminate(terminateId, terminateReason);
    if (!res.ok) toast.error(res.message); else {
      toast.success('تم إنهاء العقد.');
      await reloadList();
    }
    setTerminateId(null); setTerminateReason('');
  };

  const handleArchive = async (id: string) => {
    const res = await archive(id);
    if (!res.ok) toast.error(res.message); else {
      toast.success('تم أرشفة العقد.');
      await reloadList();
    }
  };

  const patch = (p: Partial<FormValues>) => setForm(f => ({ ...f, ...p }));

  const applyTemplate = async (tplId: string) => {
    if (!tplId) {
      patch({ templateId: '' });
      return;
    }
    setApplyingTemplate(true);
    try {
      const template = await contractTemplatesApi.get(tplId);
      patch(
        applyContractTemplateToForm(template, {
          essentialArticleIds,
          startDate: form.startDate,
        }),
      );
      toast.success(`تم تطبيق قالب «${template.nameAr}» على النموذج`);
    } catch (e) {
      toast.error((e as Error).message || 'تعذّر تحميل القالب');
      patch({ templateId: '' });
    } finally {
      setApplyingTemplate(false);
    }
  };

  React.useEffect(() => {
    if (!form.templateId || !form.startDate || !drawerOpen) return;
    const cached = templates.find((t) => t.id === form.templateId);
    if (!cached?.durationMonths) return;
    const end = computeTemplateEndDate(
      form.contractType,
      cached.durationMonths,
      form.startDate,
    );
    if (end && end !== form.endDate) {
      setForm((f) => ({ ...f, endDate: end }));
    }
  }, [form.startDate, form.templateId, form.contractType, form.endDate, templates, panelMode]);

  const updateAllowanceLine = (idx: number, p: Partial<AllowanceLine>) => {
    setForm(f => ({ ...f, allowanceLines: f.allowanceLines.map((l, i) => i === idx ? { ...l, ...p } : l) }));
  };
  const addAllowanceLine = () => setForm(f => ({ ...f, allowanceLines: [...f.allowanceLines, { allowanceTypeId: '', amount: '' }] }));
  const removeAllowanceLine = (idx: number) => setForm(f => ({
    ...f,
    allowanceLines: f.allowanceLines.length <= 1 ? [{ allowanceTypeId: '', amount: '' }] : f.allowanceLines.filter((_, i) => i !== idx),
  }));

  const toggleArticle = (id: string) => {
    if (essentialArticleIds.includes(id)) return;
    setForm(f => ({
      ...f,
      articleIds: f.articleIds.includes(id)
        ? f.articleIds.filter(x => x !== id)
        : mergeEssentialArticleIds([...f.articleIds, id], essentialArticleIds),
    }));
  };

  const employmentStatusOrder = React.useMemo(
    () => EMPLOYMENT_STATUS_FILTER_OPTIONS.filter((o): o is { value: HRContractLifecycleStatus; label: string } => o.value !== 'all').map(o => o.value),
    [],
  );

  const statusCounts = React.useMemo(() => {
    const counts: Record<string, number> = { all: pagination.total };
    for (const s of employmentStatusOrder) {
      counts[s] = filtered.filter(c => c.status === s).length;
    }
    return counts;
  }, [filtered, pagination.total, employmentStatusOrder]);

  useEntityFilterSlot(
    () => (
      <EntityFilterToolbar
        showDateSection={false}
        empPickerEmployees={empPickerList}
        selectedEmpIds={selectedEmpIds}
        onSelectedEmpIdsChange={setSelectedEmpIds}
        statusFilter={statusFilter}
        onStatusFilterChange={(v) => setValue('status', v)}
        statusOrder={employmentStatusOrder}
        statusLabels={CONTRACT_STATUS_LABELS as unknown as Record<string, string>}
        statusCounts={statusCounts}
        onDateBoundsChange={() => {}}
        inlineSelects={[
          {
            id: 'contract-kind',
            value: kindFilter,
            onChange: (v) => setValue('kind', v),
            options: EMPLOYMENT_KIND_FILTER_OPTIONS.map(({ value, label }) => ({ value, label })),
            placeholder: 'نوع العقد',
          },
        ]}
        trailingActions={undefined}
      />
    ),
    [
      statusFilter,
      kindFilter,
      selectedEmpKey,
      statusCounts,
      empPickerList,
      employmentStatusOrder,
    ],
  );

  const ContractActions = ({ c }: { c: HRContractRecord }) => {
    if (isTerminatedEmploymentContract(c)) {
      return (
        <div className="flex items-center gap-1 flex-wrap" onClick={e => e.stopPropagation()}>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleArchive(c.id)}>أرشفة</Button>
        </div>
      );
    }

    return (
      <div className="flex items-center gap-1 flex-wrap" onClick={e => e.stopPropagation()}>
        {canRecordEmployeeContractAcceptance(c) ? (
          <Button
            size="sm"
            variant="ghost"
            className="h-7 text-xs text-primary hover:text-primary"
            onClick={() => handleEmployeeAccept(c)}
          >
            موافقة الموظف
          </Button>
        ) : null}
        {canActivateEmploymentContract(c) ? (
          <Button size="sm" variant="ghost" className="h-7 text-xs text-success hover:text-success" onClick={() => handleActivate(c)}>تفعيل</Button>
        ) : null}
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => openAmendment(c)}>تعديل رسمي</Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs text-destructive hover:text-destructive" onClick={() => { setTerminateId(c.id); setTerminateReason(''); }}>إنهاء</Button>
        <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => handleArchive(c.id)}>أرشفة</Button>
      </div>
    );
  };

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col">
      <SetPageTitle titleAr="عقود العمل" descriptionAr="إدارة دورة حياة عقود العمل الوظيفية." iconName="FileText" />

      {filtered.length === 0 && !listLoading ? (
        <EmptyState icon={FileText} title="لا توجد عقود" description="أنشئ عقد عمل جديداً للبدء." />
      ) : (
        <DirectoryPagedViews
          items={filtered}
          serverPagination={pagination}
          loading={listLoading}
        >
          {(pageItems) => (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {pageItems.map(c => (
            <div
              key={c.id}
              className="rounded-xl border border-border bg-card p-5 shadow-soft space-y-3 flex flex-col cursor-pointer"
              onClick={() => openView(c)}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                    <User className="h-4 w-4" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{getEmpName(c.employeeId)}</p>
                    <p className="font-mono text-[10px] text-muted-foreground">{c.contractNumber}</p>
                  </div>
                </div>
                <Badge variant="outline" className={cn('shrink-0 text-[10px]', CONTRACT_STATUS_COLORS[c.status])}>
                  {CONTRACT_STATUS_LABELS[c.status]}
                </Badge>
              </div>
              <div className="flex flex-wrap gap-1.5">
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                  <FileText className="h-3 w-3 shrink-0" />
                  <span className="min-w-0 leading-tight">
                    {contractNatureLabel(c.contractType)}
                    <span className="text-muted-foreground"> · </span>
                    {workArrangementLabel(c.workArrangement)}
                  </span>
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-mono text-muted-foreground">
                  <CalendarRange className="h-3 w-3" />{c.startDate}
                  <ChevronRight className="h-3 w-3 opacity-40" />
                  {c.endDate}
                </span>
              </div>
              <div className="flex items-center gap-1 text-sm font-bold tabular-nums text-foreground">
                <Coins className="h-3.5 w-3.5 text-gold" />
                {formatNumber(c.baseSalary)}
                <span className="text-[10px] font-normal text-muted-foreground">{c.currency}</span>
              </div>
              <EmploymentContractSignatureCard
                signed={c.employeeSigned}
                rejectionReason={c.rejectionReason}
                contractStatus={c.status}
                variant="compact"
              />
              <div className="mt-auto flex flex-wrap items-center justify-end gap-1 border-t border-border pt-3" onClick={e => e.stopPropagation()}>
                <ContractActions c={c} />
              </div>
            </div>
          ))}
          </div>
          )}
        </DirectoryPagedViews>
      )}

      <EmploymentContractDetailDialog
        contractId={detailContractId}
        open={!!detailContractId}
        onOpenChange={(open) => { if (!open) setDetailContractId(null); }}
        refreshKey={detailRefreshKey}
        onLoaded={syncContractInStore}
        onEditDraft={openEditFromDetail}
        onDownloadPdf={openContractPdfFromRecord}
      />

      <EmploymentContractFormDialog
        open={drawerOpen}
        onOpenChange={(open) => { if (!open) closeDrawer(); }}
        mode={panelMode}
        form={form}
        error={error}
        applyingTemplate={applyingTemplate}
        templateOptions={templateOptions}
        empOptions={empOptions}
        allowanceOptions={allowanceOptions}
        activeArticles={activeArticles}
        essentialArticleIds={essentialArticleIds}
        copyFromEmployeeId={copyFromEmployeeId}
        copyFromContractId={copyFromContractId}
        copySourceEmpOptions={copySourceEmpOptions}
        copySourceContractOptions={copySourceContractOptions}
        getEmpName={getEmpName}
        onSave={() => { void handleSave(); }}
        onPreviewPdf={() => openEmploymentContractPdf()}
        onPatch={patch}
        onApplyTemplate={(id) => { void applyTemplate(id); }}
        onCopyFromEmployeeChange={(id) => { setCopyFromEmployeeId(id); setCopyFromContractId(''); }}
        onCopyFromContractChange={setCopyFromContractId}
        onApplyCopyFromContract={handleApplyCopyFromContract}
        onToggleArticle={toggleArticle}
        onUpdateAllowanceLine={updateAllowanceLine}
        onAddAllowanceLine={addAllowanceLine}
        onRemoveAllowanceLine={removeAllowanceLine}
      />

      <PdfPreviewExportDialog
        open={contractPdfOpen}
        onOpenChange={setContractPdfOpen}
        title="معاينة — عقد العمل الحالي في النموذج"
        fileName={`employment-contract-${(form.contractNumber || 'draft').replace(/[^\w\-]+/g, '_')}.pdf`}
        printable={contractPrintable}
        emptyMessage="تعذر إعداد المعاينة — تحقق من بيانات النموذج."
      />

      {/* Terminate */}
      <TerminateModal
        open={!!terminateId} reason={terminateReason}
        onReasonChange={setTerminateReason}
        onConfirm={handleTerminate}
        onCancel={() => { setTerminateId(null); setTerminateReason(''); }}
      />

      <ContractLeaveTypePickerDialog
        open={leavePicker != null}
        onOpenChange={(open) => { if (!open) setLeavePicker(null); }}
        companyId={companyId}
        title="تفعيل العقد"
        description="اختر نوع الإجازة الذي ستُضاف إليه أيام العقد عند التفعيل."
        annualLeaveDays={leavePicker?.annualLeaveDays}
        confirmLabel="تفعيل العقد"
        onConfirm={handleLeavePickerConfirm}
      />
    </div>
  );
}
