'use client';

import * as React from 'react';
import { Plus, Pencil, Trash2, X, ChevronUp, ChevronDown, Save, ClipboardCheck } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { EntityFilterToolbar } from '@/components/ui/entity-filter-toolbar';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { useSetPageTitle } from '@/components/layouts/page-title-context';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { FilterToggleButton } from '@/components/layouts/filter-toggle-button';
import { ArchiveScopeToggleButton } from '@/components/layouts/archive-scope-toggle-button';
import {
  ConfirmationModal, FormField,
  EmptyState, ActiveBadge, SearchableDropdown, MinimalDropdown,
} from '@/features/hr/requests/components/shared-ui';
import { MultiSelect, type MultiSelectOption } from '@/components/ui/multi-select';
import { useApprovalAssignmentModel } from '@/features/hr/requests/approval-assignment/hooks/useApprovalAssignmentModel';
import type { RequestApprovalMode } from '@/features/hr/requests/approval-assignment/hooks/useApprovalAssignmentModel';
import { DirectoryPagedViews } from '@/components/ui/paged-list';
import {
  ORGANIZATION_ARCHIVE_SCOPE_OPTIONS,
  type OrganizationArchiveScope,
} from '@/features/hr/organization/lib/archive-scope';
import { cn } from '@/shared/utils';

const MODE_OPTIONS: { value: RequestApprovalMode; label: string }[] = [
  { value: 'sequential', label: 'تسلسلي' },
  { value: 'parallel', label: 'متوازٍ' },
  { value: 'any_one', label: 'موافقة أحد المعتمدين' },
  { value: 'optional', label: 'اختياري' },
];

function modeLabelAr(mode: RequestApprovalMode): string {
  return MODE_OPTIONS.find((o) => o.value === mode)?.label ?? mode;
}

interface DraftForm {
  linkedIds: string[];
  approverIds: string[];
  approvalMode: RequestApprovalMode;
  isActive: boolean;
}

function buildNameAr(linkedIds: string[], requestTypes: { id: string; nameAr: string }[]): string {
  const names = linkedIds.map((id) => requestTypes.find((r) => r.id === id)?.nameAr ?? id);
  const joined = names.join(' · ');
  return joined.length <= 140 ? joined : `${joined.slice(0, 137)}…`;
}

export function ApprovalAssignmentClient() {
  const {
    templates, requestTypes, employees, loading, listError, pagination,
    archiveScope, setArchiveScope,
    createTemplate, updateTemplate, deleteTemplate,
  } = useApprovalAssignmentModel();

  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editId, setEditId] = React.useState<string | null>(null);
  const [draft, setDraft] = React.useState<DraftForm>(() => ({
    linkedIds: [],
    approverIds: [],
    approvalMode: 'sequential',
    isActive: true,
  }));
  const [error, setError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const [dialogContentEl, setDialogContentEl] = React.useState<HTMLElement | null>(null);

  const filtered = templates;

  const usedRequestTypeIds = React.useMemo(() => {
    const set = new Set<string>();
    for (const tpl of templates) {
      if (tpl.id === editId) continue;
      for (const rt of tpl.requestTypes) set.add(rt.requestTypeId);
    }
    return set;
  }, [templates, editId]);

  const requestMultiOptions = React.useMemo((): MultiSelectOption[] =>
    requestTypes
      .filter((rt) => rt.isActive || draft.linkedIds.includes(rt.id))
      .map((rt) => ({
        value: rt.id,
        label: rt.nameAr,
        subtitle: rt.requestCategory,
        disabled: usedRequestTypeIds.has(rt.id) && !draft.linkedIds.includes(rt.id),
      })),
    [requestTypes, usedRequestTypeIds, draft.linkedIds],
  );

  const patch = <K extends keyof DraftForm>(k: K, v: DraftForm[K]) =>
    setDraft((d) => ({ ...d, [k]: v }));

  const moveLinked = (index: number, delta: number) => {
    setDraft((d) => {
      const arr = [...d.linkedIds];
      const j = index + delta;
      if (j < 0 || j >= arr.length) return d;
      [arr[index], arr[j]] = [arr[j]!, arr[index]!];
      return { ...d, linkedIds: arr };
    });
  };

  const openCreate = React.useCallback(() => {
    setEditId(null);
    setDraft({ linkedIds: [], approverIds: [], approvalMode: 'sequential', isActive: true });
    setError(null);
    setDialogOpen(true);
  }, []);

  const archiveFilterInlineSelects = React.useMemo(
    () => [
      {
        id: 'archive',
        value: archiveScope,
        onChange: (v: string) => setArchiveScope(v as OrganizationArchiveScope),
        placeholder: 'العرض',
        options: ORGANIZATION_ARCHIVE_SCOPE_OPTIONS.map((o) => ({ value: o.value, label: o.label })),
      },
    ],
    [archiveScope, setArchiveScope],
  );

  const openEdit = (t: typeof templates[number]) => {
    setEditId(t.id);
    setDraft({
      linkedIds: t.requestTypes
        .map((rt) => rt.requestTypeId)
        .filter((id) => requestTypes.some((rt) => rt.id === id)),
      approverIds: [...t.approvers].sort((a, b) => a.sortOrder - b.sortOrder).map((a) => a.employeeId),
      approvalMode: t.approvalMode,
      isActive: t.isActive,
    });
    setError(null);
    setDialogOpen(true);
  };

  const handleSave = async () => {
    const linked = [...new Set(draft.linkedIds.filter(Boolean))];
    if (linked.length === 0) { setError('اختر نوع طلب واحداً على الأقل'); return; }
    if (draft.approverIds.length === 0) { setError('أضف معتمداً واحداً على الأقل'); return; }
    const nameAr = buildNameAr(linked, requestTypes);
    setSaving(true);
    setError(null);
    try {
      const requestTypesPayload = linked.map((id, i) => ({ requestTypeId: id, sortOrder: i }));
      const approversPayload = draft.approverIds.map((id, i) => ({ employeeId: id, sortOrder: i }));
      if (editId) {
        await updateTemplate(editId, { nameAr, isActive: draft.isActive, approvalMode: draft.approvalMode, requestTypes: requestTypesPayload, approvers: approversPayload });
        toast.success('تم تحديث الإسناد');
      } else {
        await createTemplate({ nameAr, isActive: draft.isActive, approvalMode: draft.approvalMode, requestTypes: requestTypesPayload, approvers: approversPayload });
        toast.success('تم إنشاء الإسناد');
      }
      setDialogOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'حدث خطأ');
    } finally {
      setSaving(false);
    }
  };

  useSetPageTitle({ titleAr: 'إسناد الموافقات', descriptionAr: 'ربط أنواع الطلبات بمعتمدين', iconName: 'ClipboardCheck' });

  usePageHeaderActions(
    () => (
      <div className="flex items-center gap-2">
        <ArchiveScopeToggleButton scope={archiveScope} onScopeChange={setArchiveScope} />
        <FilterToggleButton activeFilterCount={archiveScope !== 'active' ? 1 : 0} />
        <Button variant="luxe" size="sm" className="h-8 gap-2" onClick={openCreate}>
          <Plus className="h-4 w-4" /> إسناد جديد
        </Button>
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
        inlineSelects={archiveFilterInlineSelects}
        onDateBoundsChange={() => {}}
      />
    ),
    [archiveFilterInlineSelects],
  );

  if (loading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-48 animate-pulse rounded-xl border border-border bg-muted/30" />
        ))}
      </div>
    );
  }

  if (listError) {
    return <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{listError}</div>;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {templates.length === 0 && !loading ? (
        <EmptyState title="لا توجد إسنادات" description="اربط أنواع الطلبات بمعتمدين." />
      ) : (
        <DirectoryPagedViews
          items={filtered}
          serverPagination={pagination}
          loading={loading}
        >
          {(pageItems) => (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {pageItems.map((t) => (
            <div key={t.id} className="rounded-xl border border-border bg-card p-5 shadow-soft space-y-3 flex flex-col">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 space-y-2 flex-1">
                  <ol className="list-decimal space-y-1 pr-4 text-sm marker:text-muted-foreground">
                    {[...t.requestTypes].sort((a, b) => a.sortOrder - b.sortOrder).map((rt) => (
                      <li key={rt.id} className="font-medium leading-snug">{rt.requestTypeNameAr}</li>
                    ))}
                  </ol>
                  {t.requestTypes.length === 0 && <p className="text-xs text-muted-foreground">لا أنواع طلبات مرتبطة</p>}
                </div>
                <ActiveBadge active={t.isActive} />
              </div>
              <div className="rounded-lg border border-border/70 bg-muted/25 p-3 space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {modeLabelAr(t.approvalMode)}
                </p>
                {t.approvers.length > 0 ? (
                  <p className="mt-1 text-[11px] leading-relaxed text-foreground">
                    {[...t.approvers].sort((a, b) => a.sortOrder - b.sortOrder).map((a) => a.employeeNameAr).join('، ')}
                  </p>
                ) : (
                  <p className="mt-1 text-[11px] text-warning dark:text-warning">لا معتمدين معيّنين في هذا الإسناد</p>
                )}
              </div>
              <div className="mt-auto flex gap-1 border-t border-border pt-3">
                <Button variant="ghost" size="sm" className="gap-1.5 flex-1" onClick={() => openEdit(t)}>
                  <Pencil className="h-3.5 w-3.5" /> تعديل
                </Button>
                <Button variant="ghost" size="sm" className="gap-1.5 text-destructive hover:text-destructive" onClick={() => setDeleteId(t.id)}>
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          ))}
        </div>
          )}
        </DirectoryPagedViews>
      )}

      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) setDialogOpen(false); }}>
        <DialogContent
          className="flex h-[92vh] max-h-[92vh] w-[96vw] max-w-2xl flex-col gap-0 overflow-hidden border-border p-0"
          hideClose
          ref={(el) => setDialogContentEl(el)}
        >
          <VisuallyHidden.Root>
            <DialogTitle>{editId ? 'تعديل إسناد الموافقات' : 'إسناد موافقات جديد'}</DialogTitle>
          </VisuallyHidden.Root>

          <div className="flex shrink-0 items-center justify-between border-b border-border bg-card px-5 py-4">
            <div className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                <ClipboardCheck className="h-4.5 w-4.5" />
              </div>
              <div>
                <h2 className="text-base font-semibold leading-tight">
                  {editId ? 'تعديل إسناد الموافقات' : 'إسناد موافقات جديد'}
                </h2>
                <p className="text-xs text-muted-foreground">اربط أنواع الطلبات بمعتمدين</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={draft.isActive ? 'default' : 'secondary'} className="text-xs">
                {draft.isActive ? 'نشط' : 'موقوف'}
              </Badge>
              <Button type="button" variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => setDialogOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3">
              <div>
                <p className="text-sm font-medium">تفعيل الإسناد</p>
                <p className="text-xs text-muted-foreground">يمكن إيقافه مؤقتاً دون حذفه</p>
              </div>
              <Switch checked={draft.isActive} onCheckedChange={(v) => patch('isActive', v)} />
            </div>

            <FormField label="أنواع الطلبات" required>
              <MultiSelect
                options={requestMultiOptions}
                value={draft.linkedIds}
                onChange={(next) => patch('linkedIds', next)}
                placeholder="اختر نوعاً أو أكثر…"
                searchPlaceholder="بحث في أنواع الطلبات…"
                emptyMessage="لا توجد أنواع مطابقة"
                selectAllLabel="تحديد الكل المتاح"
                deselectAllLabel="إلغاء التحديد"
                listMaxHeight="min(260px,40vh)"
                popoverPortalContainer={dialogContentEl}
              />
            </FormField>

            {draft.linkedIds.length > 0 && (
              <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-3">
                <p className="text-xs font-semibold text-muted-foreground">ترتيب العرض في البطاقة</p>
                <ul className="space-y-1.5">
                  {draft.linkedIds.map((id, idx) => (
                    <li key={id} className="flex items-center gap-2 rounded-md border border-border/60 bg-background px-2 py-1.5 text-sm">
                      <span className={cn('flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary')}>{idx + 1}</span>
                      <span className="min-w-0 flex-1 truncate font-medium">
                        {requestTypes.find((r) => r.id === id)?.nameAr ?? id}
                      </span>
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" disabled={idx === 0} onClick={() => moveLinked(idx, -1)} aria-label="أعلى">
                        <ChevronUp className="h-4 w-4" />
                      </Button>
                      <Button type="button" variant="ghost" size="icon" className="h-7 w-7 shrink-0" disabled={idx === draft.linkedIds.length - 1} onClick={() => moveLinked(idx, 1)} aria-label="أسفل">
                        <ChevronDown className="h-4 w-4" />
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <FormField label="نمط الاعتماد" required>
              <MinimalDropdown value={draft.approvalMode} onChange={(v) => patch('approvalMode', v as RequestApprovalMode)} options={MODE_OPTIONS} />
            </FormField>

            <FormField label="المعتمدون" required>
              <div className="space-y-2">
                <div className="flex flex-wrap gap-1.5">
                  {draft.approverIds.map((empId, idx) => {
                    const emp = employees.find((e) => e.id === empId);
                    return (
                      <span key={empId} className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                        <span className="text-[10px] opacity-60">{idx + 1}</span>
                        {emp?.nameAr ?? empId}
                        <button type="button" onClick={() => patch('approverIds', draft.approverIds.filter((x) => x !== empId))}>
                          <X className="h-3 w-3 hover:text-destructive" />
                        </button>
                      </span>
                    );
                  })}
                </div>
                <SearchableDropdown
                  value=""
                  onChange={(id) => {
                    if (!id || draft.approverIds.includes(id)) return;
                    patch('approverIds', [...draft.approverIds, id]);
                  }}
                  options={employees.filter((e) => !draft.approverIds.includes(e.id)).map((e) => ({ value: e.id, label: e.nameAr, sub: '' }))}
                  placeholder="إضافة معتمد…"
                />
              </div>
            </FormField>

            {error && (
              <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">{error}</div>
            )}
          </div>

          <div className="shrink-0 border-t border-border bg-card/80 px-5 py-4 backdrop-blur">
            <div className="flex gap-2">
              <Button variant="luxe" className="flex-1 gap-2" onClick={() => void handleSave()} disabled={saving}>
                <Save className="h-4 w-4" />
                {editId ? 'حفظ التعديلات' : 'إنشاء الإسناد'}
              </Button>
              <Button variant="outline" onClick={() => setDialogOpen(false)}>إلغاء</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmationModal
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        title="حذف الإسناد"
        onConfirm={async () => {
          if (!deleteId) return;
          try { await deleteTemplate(deleteId); toast.success('تم الحذف'); }
          catch { toast.error('فشل الحذف'); }
          finally { setDeleteId(null); }
        }}
      />
    </div>
  );
}
