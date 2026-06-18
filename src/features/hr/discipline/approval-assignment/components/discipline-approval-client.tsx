'use client';

import * as React from 'react';
import { Plus, X, ChevronUp, ChevronDown } from 'lucide-react';
import {
  EntityActionCard,
  EntityActionCardGrid,
  EntityActionCardGridSkeleton,
} from '@/components/ui/entity-action-card';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import {
  ConfirmationModal, HRSettingsFormDrawer, FormField,
  EmptyState, ActiveBadge, SearchableDropdown, MinimalDropdown,
} from '@/features/hr/requests/components/shared-ui';
import { MultiSelect, type MultiSelectOption } from '@/components/ui/multi-select';
import { useDisciplineApprovalTemplatesModel } from '../hooks/useDisciplineApprovalTemplatesModel';
import { DisciplineListViewport, DisciplinePaginatedList } from '@/features/hr/discipline/components/discipline-paginated-list';
import type { ApprovalMode } from '../hooks/useDisciplineApprovalTemplatesModel';
import { cn } from '@/shared/utils';

const MODE_OPTIONS: { value: ApprovalMode; label: string }[] = [
  { value: 'sequential', label: 'تسلسلي' },
  { value: 'parallel', label: 'متوازٍ' },
  { value: 'any_one', label: 'موافقة أحد المعتمدين' },
  { value: 'optional', label: 'اختياري' },
];

function modeLabelAr(mode: ApprovalMode): string {
  return MODE_OPTIONS.find((o) => o.value === mode)?.label ?? mode;
}

interface DraftForm {
  linkedIds: string[];
  approverIds: string[];
  approvalMode: ApprovalMode;
  isActive: boolean;
}

function buildNameAr(linkedIds: string[], violationTypes: { id: string; nameAr: string }[]): string {
  const names = linkedIds.map((id) => violationTypes.find((v) => v.id === id)?.nameAr ?? id);
  const joined = names.join(' · ');
  return joined.length <= 140 ? joined : `${joined.slice(0, 137)}…`;
}

export function DisciplineApprovalClient() {
  const { templates, violationTypes, employees, loading, listError, pagination, createTemplate, updateTemplate, deleteTemplate } =
    useDisciplineApprovalTemplatesModel();

  const [drawerOpen, setDrawerOpen] = React.useState(false);
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
  const [drawerContentEl, setDrawerContentEl] = React.useState<HTMLElement | null>(null);

  const usedViolationTypeIds = React.useMemo(() => {
    const set = new Set<string>();
    for (const tpl of templates) {
      if (tpl.id === editId) continue;
      for (const vt of tpl.violationTypes) set.add(vt.violationTypeId);
    }
    return set;
  }, [templates, editId]);

  const violationMultiOptions = React.useMemo((): MultiSelectOption[] =>
    violationTypes
      .filter((vt) => vt.isActive || draft.linkedIds.includes(vt.id))
      .map((vt) => ({
        value: vt.id,
        label: vt.nameAr,
        disabled: usedViolationTypeIds.has(vt.id) && !draft.linkedIds.includes(vt.id),
      })),
    [violationTypes, usedViolationTypeIds, draft.linkedIds],
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

  const openCreate = () => {
    setEditId(null);
    setDraft({ linkedIds: [], approverIds: [], approvalMode: 'sequential', isActive: true });
    setError(null);
    setDrawerOpen(true);
  };

  const openEdit = (t: typeof templates[number]) => {
    setEditId(t.id);
    setDraft({
      linkedIds: t.violationTypes.map((vt) => vt.violationTypeId),
      approverIds: [...t.approvers].sort((a, b) => a.sortOrder - b.sortOrder).map((a) => a.employeeId),
      approvalMode: t.approvalMode,
      isActive: t.isActive,
    });
    setError(null);
    setDrawerOpen(true);
  };

  const handleSave = async () => {
    const linked = [...new Set(draft.linkedIds.filter(Boolean))];
    if (linked.length === 0) { setError('اختر نوع مخالفة واحداً على الأقل'); return; }
    if (draft.approverIds.length === 0) { setError('أضف معتمداً واحداً على الأقل'); return; }
    const nameAr = buildNameAr(linked, violationTypes);
    setSaving(true);
    setError(null);
    try {
      const violationTypesPayload = linked.map((id, i) => ({ violationTypeId: id, sortOrder: i }));
      const approversPayload = draft.approverIds.map((id, i) => ({ employeeId: id, sortOrder: i }));
      if (editId) {
        await updateTemplate(editId, { nameAr, isActive: draft.isActive, approvalMode: draft.approvalMode, violationTypes: violationTypesPayload, approvers: approversPayload });
        toast.success('تم تحديث الإسناد');
      } else {
        await createTemplate({ nameAr, isActive: draft.isActive, approvalMode: draft.approvalMode, violationTypes: violationTypesPayload, approvers: approversPayload });
        toast.success('تم إنشاء الإسناد');
      }
      setDrawerOpen(false);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'حدث خطأ');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <EntityActionCardGridSkeleton count={4} />;
  }

  if (listError) {
    return <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{listError}</div>;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <div className="flex justify-end shrink-0">
        <Button variant="luxe" size="sm" onClick={openCreate}>
          <Plus className="h-4 w-4 ml-1" />إسناد جديد
        </Button>
      </div>

      <DisciplineListViewport>
      {templates.length === 0 ? (
        <EmptyState title="لا توجد إسنادات" description="اربط أنواع المخالفات بمعتمدين." />
      ) : (
        <DisciplinePaginatedList pagination={pagination}>
          <EntityActionCardGrid>
            {templates.map((t) => (
            <EntityActionCard
              key={t.id}
              title={t.violationTypes.length > 0 ? t.violationTypes[0]?.violationTypeNameAr ?? 'إسناد موافقات' : 'إسناد موافقات'}
              subtitle={t.violationTypes.length > 1 ? `+${t.violationTypes.length - 1} أنواع أخرى` : undefined}
              status={{ label: t.isActive ? 'نشط' : 'غير نشط', tone: t.isActive ? 'approved' : 'muted' }}
              onClick={() => openEdit(t)}
              onEdit={() => openEdit(t)}
              onDelete={() => setDeleteId(t.id)}
            >
              {t.violationTypes.length > 0 ? (
                <ol className="list-decimal space-y-1 pr-4 text-sm marker:text-muted-foreground">
                  {t.violationTypes.sort((a, b) => a.sortOrder - b.sortOrder).map((vt) => (
                    <li key={vt.id} className="font-medium leading-snug">{vt.violationTypeNameAr}</li>
                  ))}
                </ol>
              ) : (
                <p className="text-xs text-muted-foreground">لا أنواع مرتبطة</p>
              )}
              <div className="rounded-lg border border-border/70 bg-muted/25 p-3 space-y-2">
                <p className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  {modeLabelAr(t.approvalMode)}
                </p>
                {t.approvers.length > 0 ? (
                  <p className="text-[11px] leading-relaxed text-foreground">
                    {[...t.approvers].sort((a, b) => a.sortOrder - b.sortOrder).map((a) => a.employeeNameAr).join('، ')}
                  </p>
                ) : (
                  <p className="text-[11px] text-warning">لا معتمدين في هذا الإسناد</p>
                )}
              </div>
            </EntityActionCard>
            ))}
          </EntityActionCardGrid>
        </DisciplinePaginatedList>
      )}
      </DisciplineListViewport>

      <HRSettingsFormDrawer
        open={drawerOpen}
        onOpenChange={setDrawerOpen}
        title={editId ? 'تعديل إسناد الموافقات' : 'إسناد موافقات جديد'}
        size="lg"
        onSave={handleSave}
        saveDisabled={saving}
        error={error}
        contentRef={setDrawerContentEl}
      >
        <FormField label="أنواع المخالفات" required>
          <MultiSelect
            options={violationMultiOptions}
            value={draft.linkedIds}
            onChange={(next) => patch('linkedIds', next)}
            placeholder="اختر نوعاً أو أكثر…"
            searchPlaceholder="بحث في أنواع المخالفات…"
            emptyMessage="لا توجد أنواع مطابقة"
            selectAllLabel="تحديد الكل المتاح"
            deselectAllLabel="إلغاء التحديد"
            listMaxHeight="min(260px,40vh)"
            popoverPortalContainer={drawerContentEl}
          />
        </FormField>

        {draft.linkedIds.length > 0 && (
          <div className="space-y-2 rounded-xl border border-border bg-muted/20 p-3">
            <p className="text-xs font-semibold text-muted-foreground">ترتيب العرض في البطاقة</p>
            <ul className="space-y-1.5">
              {draft.linkedIds.map((id, idx) => (
                <li key={id} className="flex items-center gap-2 rounded-md border border-border/60 bg-background px-2 py-1.5 text-sm">
                  <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">{idx + 1}</span>
                  <span className="min-w-0 flex-1 truncate font-medium">
                    {violationTypes.find((v) => v.id === id)?.nameAr ?? id}
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
          <MinimalDropdown value={draft.approvalMode} onChange={(v) => patch('approvalMode', v as ApprovalMode)} options={MODE_OPTIONS} />
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

        <div className="flex items-center justify-between rounded-xl border border-border p-4">
          <span className="text-sm">نشط</span>
          <Switch checked={draft.isActive} onCheckedChange={(v) => patch('isActive', v)} />
        </div>
      </HRSettingsFormDrawer>

      <ConfirmationModal
        open={!!deleteId}
        onOpenChange={(v) => !v && setDeleteId(null)}
        onConfirm={async () => {
          if (!deleteId) return;
          try { await deleteTemplate(deleteId); toast.success('تم الحذف'); }
          catch { toast.error('فشل الحذف'); }
          finally { setDeleteId(null); }
        }}
        title="حذف الإسناد"
      />
    </div>
  );
}
