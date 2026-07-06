'use client';

import { Plus, AlertTriangle, CheckCircle2, XCircle } from 'lucide-react';
import {
  EntityActionCard,
  EntityActionCardChip,
  EntityActionCardGrid,
} from '@/components/ui/entity-action-card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import {
  ConfirmationModal, HRSettingsFormDrawer, FormField,
  EmptyState, ActiveBadge, MinimalDropdown,
} from '@/components/ui/shared-dialogs';
import { ForbiddenState } from '@/components/shared/forbidden-state';
import { useViolationTypesDirectoryModel } from '@/features/hr/discipline/violation-types/hooks/useViolationTypesDirectoryModel';
import { DisciplineListViewport, DisciplinePaginatedList } from '@/features/hr/discipline/components/discipline-paginated-list';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import type { HRViolationDeductionKind } from '@/features/hr/discipline/lib/types';
import { DEDUCTION_KIND_LABELS } from '@/features/hr/discipline/lib/types';
import { cn } from '@/shared/utils';

const DEDUCTION_KIND_OPTIONS = (Object.entries(DEDUCTION_KIND_LABELS) as [HRViolationDeductionKind, string][]).map(([v, l]) => ({ value: v, label: l }));

export function ViolationTypesClient() {
  const m = useViolationTypesDirectoryModel();

  usePageHeaderActions(
    () => (
      <Button variant="luxe" size="sm" className="h-8 gap-1.5 px-3 text-xs shadow-sm shrink-0" onClick={m.openCreate} disabled={m.loading}>
        <Plus className="h-3.5 w-3.5" />
        إضافة نوع
      </Button>
    ),
    [m.loading, m.openCreate],
  );

  if (m.accessDenied) {
    return <ForbiddenState title="لا تملك صلاحية الوصول لأنواع المخالفات" />;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      {m.listError ? (
        <p className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-2.5 text-sm text-destructive whitespace-pre-wrap">{m.listError}</p>
      ) : null}

      <DisciplineListViewport>
      {m.loading ? (
        <p className="text-sm text-muted-foreground py-8 text-center">جاري التحميل...</p>
      ) : m.types.length === 0 && !m.loading ? (
        <EmptyState icon={AlertTriangle} title="لا توجد أنواع مخالفات" />
      ) : (
        <DisciplinePaginatedList pagination={m.pagination}>
          <EntityActionCardGrid>
            {m.types.map((t) => (
            <EntityActionCard
              key={t.id}
              title={t?.nameAr ?? '—'}
              status={{ label: t.isActive ? 'نشط' : 'غير نشط', tone: t.isActive ? 'approved' : 'muted' }}
              description={t.hasDeduction ? `يحتاج مخالفة: ${DEDUCTION_KIND_LABELS[t.deductionKind]} (${t.deductionValue})` : undefined}
              chips={
                <>
                  <EntityActionCardChip className={cn(t.needsWarning ? 'border-warning/30 bg-warning/10 text-warning' : '')}>
                    {t.needsWarning ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />} إنذار
                  </EntityActionCardChip>
                  <EntityActionCardChip className={cn(t.needsInvestigation ? 'border-primary/30 bg-primary/10 text-primary' : '')}>
                    {t.needsInvestigation ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />} تحقيق
                  </EntityActionCardChip>
                </>
              }
              onClick={() => m.openEdit(t)}
              onEdit={() => m.openEdit(t)}
              onDelete={() => m.setDeleteId(t.id)}
            />
            ))}
          </EntityActionCardGrid>
        </DisciplinePaginatedList>
      )}
      </DisciplineListViewport>

      <HRSettingsFormDrawer
        open={m.drawerOpen}
        onOpenChange={m.setDrawerOpen}
        title={m.editId ? 'تعديل نوع مخالفة' : 'إضافة نوع مخالفة'}
        size="lg"
        onSave={() => void m.handleSave()}
        error={m.formError}
      >
        <div className="grid gap-4 sm:grid-cols-2">
          <FormField label="الاسم" required span2>
            <Input value={m.draft.nameAr} onChange={e => m.set({ nameAr: e.target.value })} placeholder="أدخل الاسم…" />
          </FormField>
        </div>

        <div className="space-y-3 rounded-xl border border-border p-4">
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">متطلبات</p>
          <div className="flex items-center justify-between">
            <span className="text-sm">يحتاج إنذار</span>
            <Switch checked={m.draft.needsWarning} onCheckedChange={v => m.set({ needsWarning: v })} />
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">يحتاج تحقيق</span>
            <Switch checked={m.draft.needsInvestigation} onCheckedChange={v => m.set({ needsInvestigation: v })} />
          </div>
          <div className="border-t border-border pt-3">
            <div className="flex items-center justify-between gap-3">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">يحتاج مخالفة</p>
              <Switch checked={m.draft.hasDeduction} onCheckedChange={v => m.set({ hasDeduction: v })} />
            </div>
            {m.draft.hasDeduction && (
              <div className="mt-3 grid gap-3 sm:grid-cols-2">
                <FormField label="نوع الاستقطاع">
                  <MinimalDropdown
                    value={m.draft.deductionKind}
                    onChange={v => m.set({ deductionKind: v as HRViolationDeductionKind })}
                    options={DEDUCTION_KIND_OPTIONS.filter(o => o.value !== 'none')}
                  />
                </FormField>
                <FormField label="القيمة">
                  <Input type="number" min={0} value={m.draft.deductionValue} onChange={e => m.set({ deductionValue: Number(e.target.value) })} />
                </FormField>
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between rounded-xl border border-border p-4">
          <span className="text-sm font-medium">الحالة (نشط)</span>
          <Switch checked={m.draft.isActive} onCheckedChange={v => m.set({ isActive: v })} />
        </div>
      </HRSettingsFormDrawer>

      <ConfirmationModal
        open={!!m.deleteId}
        onOpenChange={v => !v && m.setDeleteId(null)}
        onConfirm={() => void m.handleDelete()}
        title="حذف نوع المخالفة"
        description="هذا الإجراء لا يمكن التراجع عنه. هل أنت متأكد؟"
      />
    </div>
  );
}
