'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, RotateCcw, Filter, Megaphone, Save, X, GripVertical } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { ListFilterBar } from '@/components/ui/list-filter-bar';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { useSetPageTitle } from '@/components/layouts/page-title-context';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import { PageHeaderPrimaryButton } from '@/components/layouts/page-header-primary-button';
import {
  Dialog, DialogContent, DialogTitle,
} from '@/components/ui/dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { ConfirmationModal } from '@/components/ui/shared-dialogs';
import { ForbiddenState } from '@/components/shared/forbidden-state';
import { Can } from '@/components/shared/can';
import { usePagePermissions } from '@/features/auth/permissions';
import { COMPANY_GUIDELINES_PAGE_PERMISSIONS } from '@/features/hr/guidelines/company-guidelines/permissions';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { DirectoryPagedViews, useServerDirectoryPagination } from '@/components/ui/paged-list';
import { TableRowActions } from '@/components/ui/table-cells';
import { cn } from '@/shared/utils';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { resolveDirectoryLoadFailure } from '@/features/hr/lib/api/directory-load-error';
import {
  ORGANIZATION_ARCHIVE_SCOPE_DEFAULT,
  ORGANIZATION_ARCHIVE_SCOPE_OPTIONS,
  organizationListArchiveQuery,
  type OrganizationArchiveScope,
} from '@/features/hr/organization/lib/archive-scope';
import {
  companyGuidelinesApi,
  type CompanyGuidelineDto,
} from '@/features/hr/guidelines/company-guidelines/lib/api/company-guidelines';

type PublishFilter = 'all' | 'published' | 'draft';
type ViewMode = 'grid' | 'table';

interface DraftForm {
  titleAr: string;
  bodyAr: string;
  points: string[];
  isPublished: boolean;
  sortOrder: number;
}

const EMPTY: DraftForm = {
  titleAr: '',
  bodyAr: '',
  points: [],
  isPublished: false,
  sortOrder: 0,
};

const PUBLISH_FILTER_OPTIONS = [
  { value: 'all', label: 'الكل' },
  { value: 'published', label: 'منشور' },
  { value: 'draft', label: 'مسودة' },
];

function PublishBadge({ isPublished }: { isPublished: boolean }) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium',
        isPublished
          ? 'border-success/30 bg-success/10 text-success'
          : 'border-border bg-muted text-muted-foreground',
      )}
    >
      <span className={cn('h-1.5 w-1.5 rounded-full', isPublished ? 'bg-success' : 'bg-muted-foreground')} />
      {isPublished ? 'منشور' : 'مسودة'}
    </span>
  );
}

export function CompanyGuidelinesClient() {
  const companyId = useDefaultCompanyId();
  const perms = usePagePermissions(COMPANY_GUIDELINES_PAGE_PERMISSIONS);
  const [apiAccessDenied, setApiAccessDenied] = React.useState(false);
  const accessDenied = !perms.canRead || apiAccessDenied;
  const [listError, setListError] = React.useState<string | null>(null);

  const [layoutView, setLayoutView] = React.useState<ViewMode>('grid');
  const [archiveScope, setArchiveScope] = React.useState<OrganizationArchiveScope>(
    ORGANIZATION_ARCHIVE_SCOPE_DEFAULT,
  );
  const [publishFilter, setPublishFilter] = React.useState<PublishFilter>('all');

  const [drawerOpen, setDrawerOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<DraftForm>(EMPTY);
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [archiveTarget, setArchiveTarget] = React.useState<CompanyGuidelineDto | null>(null);
  const [rowActionId, setRowActionId] = React.useState<string | null>(null);

  const loadPage = React.useCallback(async (page: number, pageSize: number) => {
    if (!companyId) return { items: [] as CompanyGuidelineDto[], total: 0 };
    setListError(null);
    try {
      const res = await companyGuidelinesApi.list({
        companyId,
        page,
        limit: pageSize,
        ...(publishFilter !== 'all' ? { isPublished: publishFilter === 'published' } : {}),
        ...organizationListArchiveQuery(archiveScope),
      });
      const items = [...res.items].sort((a, b) => a.sortOrder - b.sortOrder);
      setApiAccessDenied(false);
      return { items, total: res.pagination.total };
    } catch (err) {
      const failure = resolveDirectoryLoadFailure(err, 'company-guidelines.load');
      setApiAccessDenied(failure.accessDenied);
      setListError(failure.listError);
      return { items: [], total: 0 };
    }
  }, [archiveScope, companyId, publishFilter]);

  const {
    items: guidelines,
    loading: listLoading,
    pagination,
    reload: reloadList,
  } = useServerDirectoryPagination<CompanyGuidelineDto>(loadPage, {
    enabled: !!companyId && perms.canRead,
    resetDeps: [companyId, archiveScope, publishFilter],
  });

  const openCreate = React.useCallback(() => {
    setEditId(null);
    setDraft({ ...EMPTY, sortOrder: guidelines.length });
    setError(null);
    setDrawerOpen(true);
  }, [guidelines.length]);

  const openEdit = React.useCallback((g: CompanyGuidelineDto) => {
    setEditId(g.id);
    setDraft({
      titleAr: g.titleAr,
      bodyAr: g.bodyAr ?? '',
      points: [...g.points],
      isPublished: g.isPublished,
      sortOrder: g.sortOrder,
    });
    setError(null);
    setDrawerOpen(true);
  }, []);

  const patch = <K extends keyof DraftForm>(k: K, v: DraftForm[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const addPoint = () => patch('points', [...draft.points, '']);
  const updatePoint = (idx: number, value: string) =>
    patch('points', draft.points.map((p, i) => (i === idx ? value : p)));
  const removePoint = (idx: number) => patch('points', draft.points.filter((_, i) => i !== idx));

  const handleSave = async () => {
    if (!draft.titleAr.trim()) {
      setError('العنوان مطلوب');
      return;
    }
    if (!companyId) {
      setError('تعذر تحديد الشركة');
      return;
    }
    const points = draft.points.map((p) => p.trim()).filter(Boolean);
    setSaving(true);
    setError(null);
    try {
      if (editId) {
        await companyGuidelinesApi.update(editId, {
          titleAr: draft.titleAr.trim(),
          bodyAr: draft.bodyAr.trim() || null,
          points,
          isPublished: draft.isPublished,
          sortOrder: draft.sortOrder,
        });
        toast.success('تم حفظ التعديلات');
      } else {
        await companyGuidelinesApi.create({
          companyId,
          titleAr: draft.titleAr.trim(),
          bodyAr: draft.bodyAr.trim() || null,
          points,
          isPublished: draft.isPublished,
          sortOrder: draft.sortOrder,
        });
        toast.success('تمت إضافة الإرشاد');
      }
      setDrawerOpen(false);
      await reloadList();
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'company-guidelines.save');
      setError(displayMessage);
    } finally {
      setSaving(false);
    }
  };

  const togglePublished = React.useCallback(async (g: CompanyGuidelineDto, value: boolean) => {
    setRowActionId(g.id);
    try {
      await companyGuidelinesApi.update(g.id, { isPublished: value });
      toast.success(value ? 'تم نشر الإرشاد في تطبيق الجوال' : 'تم إلغاء نشر الإرشاد');
      await reloadList();
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'company-guidelines.publish-toggle');
      toast.error(displayMessage);
    } finally {
      setRowActionId(null);
    }
  }, [reloadList]);

  const handleArchive = React.useCallback(async () => {
    if (!archiveTarget) return;
    setRowActionId(archiveTarget.id);
    try {
      await companyGuidelinesApi.archive(archiveTarget.id);
      toast.success('تمت أرشفة الإرشاد');
      setArchiveTarget(null);
      await reloadList();
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'company-guidelines.archive');
      toast.error(displayMessage);
    } finally {
      setRowActionId(null);
    }
  }, [archiveTarget, reloadList]);

  const handleRestore = React.useCallback(async (g: CompanyGuidelineDto) => {
    setRowActionId(g.id);
    try {
      await companyGuidelinesApi.restore(g.id);
      toast.success('تمت استعادة الإرشاد');
      await reloadList();
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'company-guidelines.restore');
      toast.error(displayMessage);
    } finally {
      setRowActionId(null);
    }
  }, [reloadList]);

  const columns = React.useMemo((): ColumnDef<CompanyGuidelineDto>[] => [
    {
      key: 'title',
      title: 'العنوان',
      className: 'font-medium',
      render: (g) => g.titleAr,
    },
    {
      key: 'points',
      title: 'عدد النقاط',
      className: 'text-muted-foreground',
      render: (g) => g.points.length,
    },
    {
      key: 'published',
      title: 'منشور؟',
      render: (g) => (
        <div onClick={(e) => e.stopPropagation()}>
          <Switch
            checked={g.isPublished}
            disabled={!perms.canUpdate || g.isArchived || rowActionId === g.id}
            onCheckedChange={(v) => void togglePublished(g, v)}
          />
        </div>
      ),
    },
    {
      key: 'sortOrder',
      title: 'الترتيب',
      className: 'text-muted-foreground',
      render: (g) => g.sortOrder,
    },
    {
      key: 'status',
      title: 'الحالة',
      render: (g) => (g.isArchived ? (
        <Badge variant="subtle">مؤرشف</Badge>
      ) : (
        <PublishBadge isPublished={g.isPublished} />
      )),
    },
    {
      key: 'actions',
      title: 'إجراءات',
      isActions: true,
      headerClassName: 'w-28',
      render: (g) => (
        <TableRowActions
          menuItems={[
            ...(perms.canUpdate ? [{
              label: 'تعديل',
              icon: <Pencil className="h-3.5 w-3.5" />,
              onClick: (e: React.MouseEvent) => { e.stopPropagation(); openEdit(g); },
            }] : []),
            ...(g.isArchived
              ? (perms.canUpdate ? [{
                  label: 'استعادة',
                  icon: <RotateCcw className="h-3.5 w-3.5" />,
                  onClick: (e: React.MouseEvent) => { e.stopPropagation(); void handleRestore(g); },
                  separator: true,
                }] : [])
              : (perms.canDelete ? [{
                  label: 'أرشفة',
                  icon: <Trash2 className="h-3.5 w-3.5" />,
                  onClick: (e: React.MouseEvent) => { e.stopPropagation(); setArchiveTarget(g); },
                  destructive: true,
                  separator: true,
                }] : [])),
          ]}
        />
      ),
    },
  ], [handleRestore, openEdit, perms.canDelete, perms.canUpdate, rowActionId, togglePublished]);

  const activeFilterCount = React.useMemo(() => {
    let count = 0;
    if (publishFilter !== 'all') count++;
    if (archiveScope !== 'active') count++;
    return count;
  }, [archiveScope, publishFilter]);

  useSetPageTitle({
    titleAr: 'إرشادات الشركة',
    descriptionAr: 'إرشادات وضوابط تظهر للموظفين في تطبيق الجوال',
    iconName: 'Megaphone',
  });

  usePageHeaderActions(
    () => (
      <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
        <FilterToggleButton activeFilterCount={activeFilterCount} />
        <Can when={perms.canCreate}>
          <PageHeaderPrimaryButton icon={Plus} label="إرشاد جديد" onClick={openCreate}>
            إرشاد جديد
          </PageHeaderPrimaryButton>
        </Can>
      </div>
    ),
    [activeFilterCount, openCreate, perms.canCreate],
  );

  useEntityFilterSlot(
    () => (
      <ListFilterBar
        showDateSection={false}
        showEmployeePicker={false}
        inlineSelects={[
          {
            id: 'publish-status',
            value: publishFilter,
            onChange: (v) => setPublishFilter(v as PublishFilter),
            placeholder: 'حالة النشر',
            options: PUBLISH_FILTER_OPTIONS,
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
          onChange: (v) => setLayoutView(v as ViewMode),
          options: [
            { value: 'grid', label: 'بطاقات', icon: 'layout-grid' },
            { value: 'table', label: 'جدول', icon: 'list' },
          ],
        }}
      />
    ),
    [archiveScope, layoutView, publishFilter],
  );

  if (accessDenied) {
    return <ForbiddenState title="لا تملك صلاحية الوصول إلى إرشادات الشركة" />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {listError ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {listError}
        </div>
      ) : null}

      {!listLoading && guidelines.length === 0 && pagination.total === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border/60 bg-muted/20 py-16 text-center">
          <Filter className="mb-3 h-10 w-10 text-muted-foreground/30" />
          <p className="text-sm text-muted-foreground">لا توجد إرشادات. أضف إرشاداً جديداً أو عدّل الفلاتر</p>
        </div>
      ) : (
        <DirectoryPagedViews items={guidelines} serverPagination={pagination} loading={listLoading}>
          {(pageItems) => (
            layoutView === 'grid' ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
                {pageItems.map((g) => (
                  <div
                    key={g.id}
                    className="flex cursor-pointer flex-col gap-3 rounded-xl border border-border bg-card p-5 shadow-soft"
                    onClick={() => perms.canUpdate && openEdit(g)}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="text-[10px] text-muted-foreground">ترتيب {g.sortOrder}</p>
                        <p className="truncate font-semibold">{g.titleAr}</p>
                      </div>
                      {g.isArchived ? <Badge variant="subtle">مؤرشف</Badge> : <PublishBadge isPublished={g.isPublished} />}
                    </div>
                    {g.bodyAr ? (
                      <p className="line-clamp-2 text-xs text-muted-foreground">{g.bodyAr}</p>
                    ) : null}
                    {g.points.length > 0 ? (
                      <span className="inline-flex w-fit items-center rounded-full bg-muted px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                        {g.points.length} نقطة
                      </span>
                    ) : null}
                    <div className="mt-auto flex items-center justify-between gap-2 border-t border-border pt-3" onClick={(e) => e.stopPropagation()}>
                      <div className="flex items-center gap-2">
                        <Switch
                          checked={g.isPublished}
                          disabled={!perms.canUpdate || g.isArchived || rowActionId === g.id}
                          onCheckedChange={(v) => void togglePublished(g, v)}
                        />
                        <span className="text-[11px] text-muted-foreground">نشر</span>
                      </div>
                      <div className="flex gap-1">
                        {perms.canUpdate ? (
                          <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => openEdit(g)}>
                            <Pencil className="h-3.5 w-3.5" /> تعديل
                          </Button>
                        ) : null}
                        {g.isArchived
                          ? (perms.canUpdate ? (
                              <Button variant="ghost" size="sm" className="gap-1.5" onClick={() => void handleRestore(g)}>
                                <RotateCcw className="h-3.5 w-3.5" />
                              </Button>
                            ) : null)
                          : (perms.canDelete ? (
                              <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => setArchiveTarget(g)}>
                                <Trash2 className="h-3.5 w-3.5" />
                              </Button>
                            ) : null)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <DataTable
                variant="directory"
                alwaysShowTable
                columns={columns}
                data={pageItems}
                keyExtractor={(g) => g.id}
                onRowClick={perms.canUpdate ? openEdit : undefined}
              />
            )
          )}
        </DirectoryPagedViews>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={drawerOpen} onOpenChange={(o) => { if (!o) setDrawerOpen(false); }}>
        <DialogContent
          className="flex w-full max-w-lg flex-col gap-0 overflow-visible border-border p-0"
          hideClose
        >
          <VisuallyHidden.Root>
            <DialogTitle>{editId ? 'تعديل إرشاد' : 'إرشاد جديد'}</DialogTitle>
          </VisuallyHidden.Root>

          <div className="flex shrink-0 items-center justify-between border-b border-border bg-card px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <Megaphone className="h-4.5 w-4.5" />
              </div>
              <div>
                <h2 className="text-base font-semibold leading-tight">
                  {editId ? 'تعديل إرشاد' : 'إرشاد جديد'}
                </h2>
                <p className="text-xs text-muted-foreground">يظهر للموظفين في تطبيق الجوال عند النشر</p>
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

          <div className="flex max-h-[70vh] flex-col gap-5 overflow-y-auto px-5 py-6">
            <div className="flex items-end gap-3">
              <div className="flex-1 space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground">
                  العنوان <span className="text-destructive">*</span>
                </Label>
                <Input
                  value={draft.titleAr}
                  onChange={(e) => patch('titleAr', e.target.value)}
                  placeholder="مثال: سياسة الحضور والانصراف"
                  className="h-10"
                  autoFocus
                />
              </div>
              <div className="flex flex-col items-center gap-1">
                <Switch checked={draft.isPublished} onCheckedChange={(v) => patch('isPublished', v)} />
                <span className="text-[10px] text-muted-foreground">نشر</span>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">النص (اختياري)</Label>
              <Textarea
                value={draft.bodyAr}
                onChange={(e) => patch('bodyAr', e.target.value)}
                placeholder="تفاصيل الإرشاد…"
                rows={3}
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">نقاط تفصيلية (اختياري)</Label>
              <div className="space-y-2">
                {draft.points.map((point, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <GripVertical className="h-4 w-4 shrink-0 text-muted-foreground/40" />
                    <Input
                      value={point}
                      onChange={(e) => updatePoint(idx, e.target.value)}
                      placeholder={`نقطة ${idx + 1}`}
                      className="h-9"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="h-9 w-9 shrink-0 text-muted-foreground hover:text-destructive"
                      onClick={() => removePoint(idx)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" className="gap-1.5" onClick={addPoint}>
                  <Plus className="h-3.5 w-3.5" /> إضافة نقطة
                </Button>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-medium text-muted-foreground">ترتيب العرض</Label>
              <Input
                type="number"
                value={draft.sortOrder}
                onChange={(e) => patch('sortOrder', Number(e.target.value) || 0)}
                className="h-10 w-32"
              />
            </div>

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                {error}
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-border bg-card/80 px-5 py-4 backdrop-blur">
            <div className="flex gap-2">
              <Button variant="luxe" className="flex-1 gap-2" onClick={handleSave} disabled={saving}>
                <Save className="h-4 w-4" />
                {editId ? 'حفظ التعديلات' : 'إضافة الإرشاد'}
              </Button>
              <Button variant="outline" onClick={() => setDrawerOpen(false)}>
                إلغاء
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmationModal
        open={!!archiveTarget}
        onOpenChange={(v) => !v && setArchiveTarget(null)}
        title="أرشفة الإرشاد"
        description={archiveTarget ? `سيتم إخفاء «${archiveTarget.titleAr}» عن تطبيق الجوال ونقله للأرشيف. يمكن استعادته لاحقاً.` : undefined}
        confirmLabel="أرشفة"
        onConfirm={handleArchive}
      />
    </div>
  );
}
