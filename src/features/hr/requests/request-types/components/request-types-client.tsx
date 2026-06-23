'use client';

import * as React from 'react';
import { Plus, Pencil, Trash2, Filter, ListChecks, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { EntityFilterToolbar } from '@/components/ui/entity-filter-toolbar';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { useSetPageTitle } from '@/components/layouts/page-title-context';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import { ArchiveScopeToggleButton } from '@/components/layouts/archive-scope-toggle-button';
import {
  Dialog, DialogContent, DialogTitle,
} from '@/components/ui/dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  ConfirmationModal,
  ActiveBadge,
} from '@/features/hr/requests/components/shared-ui';
import { useHRConfigurationStore } from '@/features/hr/requests/lib/configuration-store';
import type { HRRequestTypeEntity, HRRequestTypeCategory } from '@/features/hr/requests/lib/types';
import {
  HR_REQUEST_TYPE_ALL_DEPARTMENTS_ID,
  HR_REQUEST_TYPE_CATEGORIES,
  HR_REQUEST_TYPE_CATEGORY_LABELS_AR,
} from '@/features/hr/requests/lib/types';
import { cn } from '@/shared/utils';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { DirectoryPagedViews, useServerDirectoryPagination } from '@/components/ui/paged-list';
import { requestTypesApi } from '@/features/hr/requests/lib/api/request-types';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import {
  ORGANIZATION_ARCHIVE_SCOPE_DEFAULT,
  ORGANIZATION_ARCHIVE_SCOPE_OPTIONS,
  organizationListStatusQuery,
  type OrganizationArchiveScope,
} from '@/features/hr/organization/lib/archive-scope';
import { mapApiRequestType } from '@/features/hr/requests/lib/configuration-store';
import { TableRowActions } from '@/components/ui/table-cells';

interface DraftForm {
  requestCategory: HRRequestTypeCategory;
  nameAr: string;
  sortOrder: number;
  isActive: boolean;
}

const EMPTY: DraftForm = {
  requestCategory: 'attendance',
  nameAr: '',
  sortOrder: 1,
  isActive: true,
};

const CATEGORY_DROPDOWN_OPTIONS = HR_REQUEST_TYPE_CATEGORIES.map((c) => ({
  value: c,
  label: HR_REQUEST_TYPE_CATEGORY_LABELS_AR[c],
}));

const CATEGORY_FILTER_OPTIONS = [
  { value: 'all', label: 'كل التصنيفات' },
  ...CATEGORY_DROPDOWN_OPTIONS,
];

export function RequestTypesClient() {
  const companyId = useDefaultCompanyId();
  const { departments, addRequestType, updateRequestType, deleteRequestType, fetchDepartments } = useHRConfigurationStore();

  React.useEffect(() => { fetchDepartments(); }, [fetchDepartments]);

  const [layoutView, setLayoutView] = React.useState<'grid' | 'table'>('grid');
  const [archiveScope, setArchiveScope] = React.useState<OrganizationArchiveScope>(
    ORGANIZATION_ARCHIVE_SCOPE_DEFAULT,
  );
  const [categoryFilter, setCategoryFilter] = React.useState<string>('all');
  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<DraftForm>(EMPTY);
  const [error, setError] = React.useState<string | null>(null);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);

  const loadPage = React.useCallback(async (page: number, pageSize: number) => {
    if (!companyId) return { items: [] as HRRequestTypeEntity[], total: 0 };
    try {
      const res = await requestTypesApi.list({
        companyId,
        page,
        limit: pageSize,
        ...(categoryFilter !== 'all' ? { requestCategory: categoryFilter } : {}),
        ...organizationListStatusQuery(archiveScope),
      });
      const items = res.items.map(mapApiRequestType).sort((a, b) => a.sortOrder - b.sortOrder);
      return { items, total: res.pagination.total };
    } catch {
      return { items: [], total: 0 };
    }
  }, [archiveScope, categoryFilter, companyId]);

  const {
    items: requestTypes,
    loading: listLoading,
    pagination,
    reload: reloadList,
  } = useServerDirectoryPagination<HRRequestTypeEntity>(loadPage, {
    enabled: !!companyId,
    resetDeps: [companyId, categoryFilter, archiveScope, layoutView],
  });

  const activeDepts = departments.filter(d => d.isActive);

  const filtered = requestTypes;

  const openCreate = React.useCallback(() => {
    setEditId(null);
    setDraft({ ...EMPTY, sortOrder: requestTypes.length + 1 });
    setError(null);
    setDrawerOpen(true);
  }, [requestTypes.length]);

  const openEdit = (rt: HRRequestTypeEntity) => {
    setEditId(rt.id);
    setDraft({
      requestCategory: rt.requestCategory,
      nameAr: rt.nameAr,
      sortOrder: rt.sortOrder,
      isActive: rt.isActive,
    });
    setError(null);
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    if (!draft.nameAr.trim()) { setError('اسم نوع الطلب مطلوب'); return; }
    const base = {
      departmentId: HR_REQUEST_TYPE_ALL_DEPARTMENTS_ID,
      nameAr: draft.nameAr.trim(),
      nameEn: draft.nameAr.trim(),
      sortOrder: draft.sortOrder,
      isActive: draft.isActive,
      requestCategory: draft.requestCategory,
    };
    try {
      if (editId) {
        const existing = requestTypes.find(r => r.id === editId);
        await updateRequestType(editId, { ...base, subtypes: existing?.subtypes ?? [] });
      } else {
        await addRequestType({
          ...base,
          subtypes: [],
          approvalAssignmentTemplateId: null,
          approvalStages: [],
        });
      }
      setDrawerOpen(false);
      await reloadList();
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const patch = <K extends keyof DraftForm>(k: K, v: DraftForm[K]) => setDraft(d => ({ ...d, [k]: v }));

  const getDeptLabel = (id: string) => {
    if (id === HR_REQUEST_TYPE_ALL_DEPARTMENTS_ID) return 'جميع الأقسام';
    return activeDepts.find(d => d.id === id)?.nameAr ?? '—';
  };

  const columns = React.useMemo((): ColumnDef<HRRequestTypeEntity>[] => [
    {
      key: 'department',
      title: 'القسم',
      className: 'text-muted-foreground',
      render: (rt) => getDeptLabel(rt.departmentId),
    },
    {
      key: 'name',
      title: 'النوع',
      className: 'font-medium',
      render: (rt) => rt.nameAr,
    },
    {
      key: 'category',
      title: 'التصنيف',
      className: 'text-muted-foreground',
      render: (rt) => HR_REQUEST_TYPE_CATEGORY_LABELS_AR[rt.requestCategory],
    },
    {
      key: 'status',
      title: 'الحالة',
      render: (rt) => <ActiveBadge active={rt.isActive} />,
    },
    {
      key: 'actions',
      title: 'إجراءات',
      isActions: true,
      headerClassName: 'w-28',
      render: (rt) => (
        <TableRowActions
          menuItems={[
            { label: 'تعديل', icon: <Pencil className="h-3.5 w-3.5" />, onClick: (e) => { e.stopPropagation(); openEdit(rt); } },
            { label: 'حذف', icon: <Trash2 className="h-3.5 w-3.5" />, onClick: (e) => { e.stopPropagation(); setDeleteId(rt.id); }, destructive: true, separator: true },
          ]}
        />
      ),
    },
  ], [activeDepts]);

  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (categoryFilter !== 'all') count++;
    if (archiveScope !== 'active') count++;
    return count;
  }, [archiveScope, categoryFilter]);

  useSetPageTitle({ titleAr: 'أنواع الطلبات', descriptionAr: 'تصنيفات ونماذج طلبات الموارد البشرية', iconName: 'ListChecks' });

  usePageHeaderActions(
    () => (
      <div className="flex items-center gap-2">
        <ArchiveScopeToggleButton scope={archiveScope} onScopeChange={setArchiveScope} />
        <FilterToggleButton activeFilterCount={activeFilterCount} />
        <Button variant="luxe" size="sm" className="h-8 gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" /> نوع جديد
        </Button>
      </div>
    ),
    [activeFilterCount, archiveScope, openCreate],
  );

  useEntityFilterSlot(
    () => (
      <EntityFilterToolbar
        showDateSection={false}
        showEmployeePicker={false}
        inlineSelects={[
          {
            id: 'request-category',
            value: categoryFilter,
            onChange: setCategoryFilter,
            placeholder: 'التصنيف',
            options: CATEGORY_FILTER_OPTIONS,
            className: 'min-w-[10.5rem]',
          },
          {
            id: 'archive',
            value: archiveScope,
            onChange: (v) => setArchiveScope(v as OrganizationArchiveScope),
            placeholder: 'العرض',
            options: ORGANIZATION_ARCHIVE_SCOPE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
          },
        ]}
        onDateBoundsChange={() => {}}
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
    [
      archiveScope,
      categoryFilter,
      layoutView,
    ],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">

      {!listLoading && filtered.length === 0 && pagination.total === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-16 text-center">
          <Filter className="mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">لا توجد أنواع. أضف نوعاً جديداً أو عدّل الفلاتر</p>
        </div>
      ) : (
        <DirectoryPagedViews items={filtered} serverPagination={pagination} loading={listLoading}>
          {(pageItems) => (
            layoutView === 'grid' ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {pageItems.map(rt => {
              return (
                <div
                  key={rt.id}
                  className="rounded-xl border border-border bg-card p-5 shadow-soft space-y-3 flex flex-col cursor-pointer"
                  onClick={() => openEdit(rt)}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-[10px] text-muted-foreground truncate">{getDeptLabel(rt.departmentId)}</p>
                      <p className="font-semibold truncate">{rt.nameAr}</p>
                    </div>
                    <ActiveBadge active={rt.isActive} />
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    <span
                      className={cn(
                        'inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-medium',
                        rt.requestCategory === 'attendance' && 'bg-primary/15 text-primary',
                        rt.requestCategory === 'advance' && 'bg-gold/15 text-gold',
                      )}
                    >
                      {HR_REQUEST_TYPE_CATEGORY_LABELS_AR[rt.requestCategory]}
                    </span>
                    <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                      {rt.approvalStages?.length ?? 0} مرحلة
                    </span>
                  </div>
                  <div className="mt-auto flex gap-1 border-t border-border pt-3" onClick={e => e.stopPropagation()}>
                    <Button variant="ghost" size="sm" className="gap-1.5 flex-1" onClick={() => openEdit(rt)}>
                      <Pencil className="h-3.5 w-3.5" /> تعديل
                    </Button>
                    <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => setDeleteId(rt.id)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
            ) : (
        <DataTable
          variant="directory"
          alwaysShowTable
          columns={columns}
          data={pageItems}
          keyExtractor={(rt) => rt.id}
          onRowClick={openEdit}
        />
            )
          )}
        </DirectoryPagedViews>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={drawerOpen} onOpenChange={(o) => { if (!o) setDrawerOpen(false); }}>
        <DialogContent
          className="flex w-full max-w-md flex-col gap-0 overflow-hidden border-border p-0"
          hideClose
        >
          <VisuallyHidden.Root>
            <DialogTitle>{editId ? 'تعديل نوع الطلب' : 'نوع طلب جديد'}</DialogTitle>
          </VisuallyHidden.Root>

          {/* Header */}
          <div className="flex shrink-0 items-center justify-between border-b border-border bg-card px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ListChecks className="h-4.5 w-4.5" />
              </div>
              <div>
                <h2 className="text-base font-semibold leading-tight">
                  {editId ? 'تعديل نوع الطلب' : 'نوع طلب جديد'}
                </h2>
                <p className="text-xs text-muted-foreground">ينطبق على جميع الأقسام</p>
              </div>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={() => setDrawerOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Body */}
          <div className="flex flex-col gap-5 px-5 py-6">

            {/* Name + Active toggle in one row */}
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  الاسم <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={draft.nameAr}
                  onChange={(e) => patch('nameAr', e.target.value)}
                  placeholder="مثال: طلب إجازة سنوية"
                  className="h-10"
                  autoFocus
                />
              </div>
                <Switch checked={draft.isActive} onCheckedChange={(v) => patch('isActive', v)} />
            </div>

            {/* Category */}
            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">
                التصنيف <span className="text-destructive">*</span>
              </Label>
              <Select
                value={draft.requestCategory}
                onValueChange={(v) => patch('requestCategory', v as HRRequestTypeCategory)}
              >
                <SelectTrigger className="h-10">
                  <SelectValue placeholder="اختر التصنيف…" />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORY_DROPDOWN_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="shrink-0 border-t border-border bg-card/80 px-5 py-4 backdrop-blur">
            <div className="flex gap-2">
              <Button variant="luxe" className="flex-1 gap-2" onClick={handleSave}>
                <Save className="h-4 w-4" />
                {editId ? 'حفظ التعديلات' : 'إضافة النوع'}
              </Button>
              <Button variant="outline" onClick={() => setDrawerOpen(false)}>
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmationModal open={!!deleteId} onOpenChange={v => !v && setDeleteId(null)} title="حذف نوع الطلب" onConfirm={async () => { if (deleteId) { await deleteRequestType(deleteId); setDeleteId(null); await reloadList(); } }} />
    </div>
  );
}
