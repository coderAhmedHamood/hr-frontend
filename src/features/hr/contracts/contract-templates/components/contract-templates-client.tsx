'use client';

import * as React from 'react';
import {
  Plus, Pencil, Trash2, AlertTriangle, Loader2, FileStack, Coins, BookOpen,
} from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/shared/utils';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog';
import { useSetPageTitle } from '@/components/layouts/page-title-context';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { EntityFilterToolbar } from '@/components/ui/entity-filter-toolbar';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { contractTemplatesApi } from '@/features/hr/contracts/contract-templates/lib/api/contract-templates';
import type { ContractTemplateDto } from '@/features/hr/contracts/contract-templates/types/contract-template';
import {
  TEMPLATE_CONTRACT_NATURE_LABELS,
  TEMPLATE_WORK_ARRANGEMENT_LABELS,
} from '@/features/hr/contracts/contract-templates/constants/contract-template-options';
import { ContractTemplateFormDialog } from '@/features/hr/contracts/contract-templates/dialogs/contract-template-form-dialog';
import { DirectoryPagedViews, useServerDirectoryPagination } from '@/components/ui/paged-list';
import {
  ORGANIZATION_ARCHIVE_SCOPE_DEFAULT,
  ORGANIZATION_ARCHIVE_SCOPE_OPTIONS,
  payrollListArchiveQuery,
  type OrganizationArchiveScope,
} from '@/features/hr/organization/lib/archive-scope';

function fmtSalary(amount: string | null | undefined, currency: string): string {
  if (!amount) return '—';
  const n = parseFloat(amount);
  if (Number.isNaN(n)) return '—';
  return `${n.toLocaleString('ar-SA')} ${currency}`;
}

function totalAllowances(lines: ContractTemplateDto['allowanceLines']): number {
  return (lines ?? []).reduce((sum, l) => sum + (parseFloat(l.amount) || 0), 0);
}

export function ContractTemplatesClient() {
  useSetPageTitle({
    titleAr: 'قوالب العقود',
    descriptionAr: 'قوالب جاهزة لإنشاء عقود العمل — الراتب والبدلات والإعدادات الافتراضية.',
    iconName: 'FileStack',
  });

  const companyId = useDefaultCompanyId() ?? '';

  const [archiveScope, setArchiveScope] = React.useState<OrganizationArchiveScope>(
    ORGANIZATION_ARCHIVE_SCOPE_DEFAULT,
  );
  const [error, setError] = React.useState<string | null>(null);

  const loadPage = React.useCallback(async (page: number, pageSize: number) => {
    if (!companyId) return { items: [] as ContractTemplateDto[], total: 0 };
    setError(null);
    try {
      const res = await contractTemplatesApi.list({
        companyId,
        page,
        limit: pageSize,
        ...payrollListArchiveQuery(),
      });
      const items = [...res.items].sort(
        (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0) || a.nameAr.localeCompare(b.nameAr, 'ar'),
      );
      return { items, total: res.pagination.total };
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'contract-templates.load');
      setError(displayMessage);
      return { items: [], total: 0 };
    }
  }, [companyId, archiveScope]);

  const {
    items,
    loading,
    pagination,
    reload: load,
  } = useServerDirectoryPagination<ContractTemplateDto>(loadPage, {
    enabled: !!companyId,
    resetDeps: [companyId, archiveScope],
  });

  const [formOpen, setFormOpen] = React.useState(false);
  const [editItem, setEditItem] = React.useState<ContractTemplateDto | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<ContractTemplateDto | null>(null);
  const [deleting, setDeleting] = React.useState(false);

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      await contractTemplatesApi.delete(deleteTarget.id);
      toast.success('تم حذف قالب العقد');
      setDeleteTarget(null);
      await load();
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'contract-templates.delete');
      toast.error(displayMessage);
    } finally {
      setDeleting(false);
    }
  };

  usePageHeaderActions(
    () => (
      <div className="flex items-center gap-2">
        <Button
          variant="luxe"
          size="sm"
          className="h-8 gap-1.5 px-3 text-xs"
          onClick={() => { setEditItem(null); setFormOpen(true); }}
        >
          <Plus className="h-3.5 w-3.5" /> قالب جديد
        </Button>
      </div>
    ),
    [],
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
      />
    ),
    [archiveScope],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-5">
      {error ? (
        <div className="flex items-center gap-2 rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          <AlertTriangle className="h-4 w-4 shrink-0" /> {error}
        </div>
      ) : !loading && items.length === 0 && pagination.total === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-border py-20 text-center">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <FileStack className="h-7 w-7" />
          </div>
          <p className="font-display text-base font-semibold">لا توجد قوالب عقود بعد</p>
          <p className="text-sm text-muted-foreground">أنشئ أول قالب لتسريع إعداد عقود الموظفين</p>
          <Button
            variant="luxe"
            size="sm"
            className="mt-1 gap-1.5"
            onClick={() => { setEditItem(null); setFormOpen(true); }}
          >
            <Plus className="h-3.5 w-3.5" /> قالب جديد
          </Button>
        </div>
      ) : (
        <DirectoryPagedViews items={items} serverPagination={pagination} loading={loading}>
          {(pageItems) => (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {pageItems.map((item) => {
            const allowanceTotal = totalAllowances(item.allowanceLines);
            const nature = TEMPLATE_CONTRACT_NATURE_LABELS[item.defaultContractNature as keyof typeof TEMPLATE_CONTRACT_NATURE_LABELS] ?? item.defaultContractNature;
            const arrangement = TEMPLATE_WORK_ARRANGEMENT_LABELS[item.defaultWorkArrangement as keyof typeof TEMPLATE_WORK_ARRANGEMENT_LABELS] ?? item.defaultWorkArrangement;
            return (
              <div
                key={item.id}
                className="group relative flex flex-col overflow-hidden rounded-xl border border-border bg-card shadow-sm transition-all duration-150 hover:shadow-md hover:-translate-y-px"
              >
                {/* top accent */}
                <div className="h-0.5 w-full shrink-0 bg-gradient-to-r from-primary/40 via-primary to-primary/40" />

                <div className="flex flex-1 flex-col gap-3 p-4">
                  {/* Row 1: icon · name · status */}
                  <div className="flex items-start gap-2.5">
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <FileStack className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold leading-tight transition-colors group-hover:text-primary">
                        {item.nameAr}
                      </p>
                      <p className="font-mono text-[10px] text-muted-foreground/70" dir="ltr">{item.code}</p>
                    </div>
                    <Badge variant={item.isActive ? 'success' : 'secondary'} className="shrink-0 text-[9px] px-1.5 py-px">
                      {item.isActive ? 'نشط' : 'موقوف'}
                    </Badge>
                  </div>

                  {/* Row 2: nature + arrangement badges */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <Badge variant="subtle" className="text-[10px]">{nature}</Badge>
                    <Badge variant="outline" className="text-[10px]">{arrangement}</Badge>
                    {item.durationMonths && (
                      <Badge variant="outline" className="text-[10px]">{item.durationMonths} شهر</Badge>
                    )}
                  </div>

                  {/* Row 3: salary + allowances inline */}
                  <div className="flex items-center justify-between rounded-lg bg-muted/30 px-3 py-2">
                    <div className="text-center">
                      <p className="text-[9px] text-muted-foreground">الراتب</p>
                      <p className="font-mono text-xs font-bold text-primary">{fmtSalary(item.suggestedBaseSalary, item.currency)}</p>
                    </div>
                    <div className="h-6 w-px bg-border/60" />
                    <div className="text-center">
                      <p className="text-[9px] text-muted-foreground">البدلات</p>
                      <p className="font-mono text-xs font-bold">
                        {allowanceTotal > 0 ? `${allowanceTotal.toLocaleString('ar-SA')} ${item.currency}` : '—'}
                      </p>
                    </div>
                    <div className="h-6 w-px bg-border/60" />
                    <div className="text-center">
                      <p className="text-[9px] text-muted-foreground">التجربة</p>
                      <p className="text-xs font-bold">{item.defaultProbationDays ?? '—'} <span className="font-normal text-muted-foreground">يوم</span></p>
                    </div>
                  </div>

                  {/* Row 4: counters */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className={cn(
                      'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium',
                      item.allowanceLines?.length ? 'border-primary/30 bg-primary/5 text-primary' : 'border-border text-muted-foreground',
                    )}>
                      <Coins className="h-2.5 w-2.5" />
                      {item.allowanceLines?.length ?? 0} بدل
                    </span>
                    <span className={cn(
                      'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium',
                      item.articles?.length ? 'border-primary/30 bg-primary/5 text-primary' : 'border-border text-muted-foreground',
                    )}>
                      <BookOpen className="h-2.5 w-2.5" />
                      {item.articles?.length ?? 0} مادة
                    </span>
                    {item.defaultAnnualLeaveDays != null && (
                      <span className="inline-flex items-center rounded-full border border-border px-2 py-0.5 text-[10px] text-muted-foreground">
                        إجازة {item.defaultAnnualLeaveDays} يوم
                      </span>
                    )}
                  </div>

                  {/* description / hint if any */}
                  {(item.descriptionAr || item.allowancesHint) && (
                    <p className="  text-[10px] text-muted-foreground">
                      {item.descriptionAr || item.allowancesHint}
                    </p>
                  )}
                </div>

                {/* actions footer */}
                <div className="flex items-center gap-1 border-t border-border/50 bg-muted/10 px-3 py-2">
                  <Button
                    variant="ghost" size="sm" type="button"
                    className="h-7 gap-1 px-2 text-xs"
                    onClick={() => { setEditItem(item); setFormOpen(true); }}
                  >
                    <Pencil className="h-3 w-3" /> تعديل
                  </Button>
                  <Button
                    variant="ghost" size="sm" type="button"
                    className="h-7 gap-1 px-2 text-xs text-destructive hover:bg-destructive/10 hover:text-destructive"
                    onClick={() => setDeleteTarget(item)}
                  >
                    <Trash2 className="h-3 w-3" /> حذف
                  </Button>
                </div>
              </div>
            );
          })}
        </div>
          )}
        </DirectoryPagedViews>
      )}

      <ContractTemplateFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        editItem={editItem}
        companyId={companyId}
        onSaved={load}
      />

      <Dialog open={!!deleteTarget} onOpenChange={(v) => !v && setDeleteTarget(null)}>
        <DialogContent className="max-w-sm border-border" dir="rtl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> حذف قالب العقد
            </DialogTitle>
            <DialogDescription>
              هل أنت متأكد من حذف «{deleteTarget?.nameAr}»؟ لا يمكن التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="destructive" onClick={handleDelete} disabled={deleting} className="gap-2">
              {deleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              <Trash2 className="h-4 w-4" /> حذف
            </Button>
            <Button variant="outline" onClick={() => setDeleteTarget(null)}>إلغاء</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
