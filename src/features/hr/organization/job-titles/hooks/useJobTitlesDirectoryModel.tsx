'use client';

import * as React from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSetPageTitle } from '@/components/layouts/page-title-context';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import { ArchiveScopeToggleButton } from '@/components/layouts/archive-scope-toggle-button';
import { EntityFilterToolbar } from '@/components/ui/entity-filter-toolbar';
import { PermissionGate } from '@/components/shared/permission-gate';
import { toast } from 'sonner';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { useDefaultCompany } from '@/features/hr/organization/hooks/useActiveCompany';
import { jobTitlesApi, type CreateJobTitleDto, type JobTitleResponseDto, type UpdateJobTitleDto } from '@/features/hr/organization/lib/api/jobTitles';
import {
  ORGANIZATION_ARCHIVE_SCOPE_DEFAULT,
  ORGANIZATION_ARCHIVE_SCOPE_OPTIONS,
  organizationListStatusQuery,
  type OrganizationArchiveScope,
} from '@/features/hr/organization/lib/archive-scope';
import { useServerDirectoryPagination } from '@/components/ui/paged-list';
import {
  createJobTitle,
  deleteJobTitle,
  updateJobTitle,
  type JobTitleTemplateRecord,
} from '@/features/hr/organization/job-titles/services/job-titles.service';
import { generateEntityCode } from '@/features/hr/requests/lib/types';
import {
  JOB_TITLE_EMPTY_FORM,
  type JobTitleDraftForm,
} from '@/features/hr/organization/job-titles/constants/job-titles-directory';

export function useJobTitlesDirectoryModel() {
  useSetPageTitle({
    titleAr: 'المسميات الوظيفية',
    descriptionAr: 'قوالب المسميات الاستخدام عند إنشاء موظف جديد — يمكن ربط قسم افتراضي اقتراحياً.',
    iconName: 'Briefcase',
  });

  const defaultCompanyId = useDefaultCompanyId();
  const { data: defaultCompany } = useDefaultCompany();

  const [templates, setTemplates] = React.useState<JobTitleTemplateRecord[]>([]);
  const [listError, setListError] = React.useState<string | null>(null);
  const [archiveScope, setArchiveScope] = React.useState<OrganizationArchiveScope>(
    ORGANIZATION_ARCHIVE_SCOPE_DEFAULT,
  );
  const [layoutView, setLayoutView] = React.useState<'grid' | 'table'>('table');
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [form, setForm] = React.useState<JobTitleDraftForm>(JOB_TITLE_EMPTY_FORM);
  const [error, setError] = React.useState<string | null>(null);
  const [confirmId, setConfirmId] = React.useState<string | null>(null);
  const [viewRow, setViewRow] = React.useState<JobTitleTemplateRecord | null>(null);

  const companyLabel = React.useCallback(
    (companyId: string) =>
      defaultCompany?.nameAr
      ?? defaultCompany?.code
      ?? companyId.slice(0, 8),
    [defaultCompany],
  );

  function mapTemplateRow(row: JobTitleResponseDto, index: number, page: number, pageSize: number): JobTitleTemplateRecord {
    return {
      id: row.id,
      companyId: row.companyId,
      code: row.code,
      titleAr: row.nameAr,
      titleEn: row.nameEn,
      descriptionAr: row.description ?? undefined,
      isActive: row.isActive,
      notes: row.notes,
      sortOrder: (page - 1) * pageSize + index + 1,
      updatedAt: row.updatedAt,
    };
  }

  const loadPage = React.useCallback(async (page: number, pageSize: number) => {
    if (!defaultCompanyId) return { items: [] as JobTitleTemplateRecord[], total: 0 };
    try {
      const res = await jobTitlesApi.getAll({
        companyId: defaultCompanyId,
        page,
        limit: pageSize,
        ...organizationListStatusQuery(archiveScope),
      });
      setListError(null);
      const items = res.items.map((row, index) => mapTemplateRow(row, index, page, pageSize));
      setTemplates(items);
      return { items, total: res.pagination.total };
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'job-titles.load');
      setListError(displayMessage);
      return { items: [], total: 0 };
    }
  }, [defaultCompanyId, archiveScope]);

  const {
    items: pagedTemplates,
    loading,
    pagination,
    reload: reloadList,
  } = useServerDirectoryPagination<JobTitleTemplateRecord>(loadPage, {
    enabled: !!defaultCompanyId,
    resetDeps: [defaultCompanyId, layoutView, archiveScope],
  });

  const patch = React.useCallback((p: Partial<JobTitleDraftForm>) => {
    setForm((f) => ({ ...f, ...p }));
  }, []);

  const openCreate = React.useCallback(() => {
    setEditId(null);
    setForm({
      ...JOB_TITLE_EMPTY_FORM,
      companyId: defaultCompanyId ?? '',
    });
    setError(null);
    setDrawerOpen(true);
  }, [defaultCompanyId]);

  const openEdit = React.useCallback((row: JobTitleTemplateRecord) => {
    setEditId(row.id);
    setForm({
      companyId: row.companyId,
      titleAr: row.titleAr,
      titleEn: row.titleEn ?? '',
      descriptionAr: row.descriptionAr ?? '',
      isActive: row.isActive,
    });
    setError(null);
    setDrawerOpen(true);
  }, []);

  const handleSave = React.useCallback(async () => {
    const titleAr = form.titleAr.trim();
    const companyId = defaultCompanyId ?? form.companyId;

    if (!titleAr) {
      setError('المسمى الوظيفي مطلوب');
      return;
    }
    if (!companyId) {
      setError('لم يتم تحديد الشركة الافتراضية. سجّل الدخول مرة أخرى.');
      return;
    }

    const descriptionAr = form.descriptionAr.trim() || undefined;

    try {
      if (editId) {
        const payload: UpdateJobTitleDto = {
          nameAr: titleAr,
          description: descriptionAr ?? null,
          isActive: form.isActive,
        };
        await updateJobTitle(editId, payload);
      } else {
        const payload: CreateJobTitleDto = {
          companyId,
          code: generateEntityCode(titleAr, 'job'),
          nameAr: titleAr,
          description: descriptionAr ?? null,
          isActive: true,
        };
        await createJobTitle(payload);
      }
      await reloadList();
      setDrawerOpen(false);
      setError(null);
      toast.success(editId ? 'تم تحديث القالب' : 'تمت إضافة القالب');
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'job-titles.save');
      setError(displayMessage);
    }
  }, [defaultCompanyId, editId, form.companyId, form.descriptionAr, form.isActive, form.titleAr, reloadList]);

  const handleDelete = React.useCallback(async () => {
    if (!confirmId) return;
    try {
      await deleteJobTitle(confirmId);
      await reloadList();
      setConfirmId(null);
      toast.success('تم حذف القالب');
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'job-titles.delete');
      setError(displayMessage);
    }
  }, [confirmId, reloadList]);

  usePageHeaderActions(
    () => (
      <div className="flex items-center gap-2">
        <ArchiveScopeToggleButton scope={archiveScope} onScopeChange={setArchiveScope} />
        <FilterToggleButton />
        <PermissionGate permission="hr.employees.create">
          <Button variant="luxe" size="sm" className="h-8 gap-2" onClick={openCreate}>
            <Plus className="h-4 w-4" /> قالب جديد
          </Button>
        </PermissionGate>
      </div>
    ),
    [archiveScope, openCreate],
  );

  useEntityFilterSlot(
    () => (
      <EntityFilterToolbar
        showDateSection={false}
        showStatusSection={false}
        showEmployeePicker={false}
        onDateBoundsChange={() => {}}
        inlineSelects={[
          {
            id: 'archive',
            value: archiveScope,
            onChange: (v) => setArchiveScope(v as OrganizationArchiveScope),
            placeholder: 'العرض',
            options: ORGANIZATION_ARCHIVE_SCOPE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
          },
        ]}
        dataView={{
          value: layoutView,
          onChange: (v) => setLayoutView(v as 'grid' | 'table'),
          options: [
            { value: 'table', label: 'جدول', icon: 'list' },
            { value: 'grid', label: 'شبكة', icon: 'layout-grid' },
          ],
        }}
      />
    ),
    [archiveScope, layoutView],
  );

  return {
    templates: pagedTemplates,
    loading,
    pagination,
    listError,
    layoutView,
    drawerOpen,
    setDrawerOpen,
    editId,
    form,
    patch,
    error,
    confirmId,
    setConfirmId,
    viewRow,
    setViewRow,
    openCreate,
    openEdit,
    handleSave,
    handleDelete,
    companyLabel,
  };
}

export type JobTitlesDirectoryModel = ReturnType<typeof useJobTitlesDirectoryModel>;
