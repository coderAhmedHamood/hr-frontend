'use client';

import * as React from 'react';
import { Plus, Clock, AlertTriangle, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  dialogFormFooterClass,
} from '@/components/ui/dialog';
import { EmptyStateCard } from '@/components/shared/empty-state-card';
import { defaultShiftPeriod, normalizeShiftTemplate } from '@/features/hr/attendance/lib/defaults';
import type { ShiftTemplate, WeekDayIndex } from '@/features/hr/attendance/lib/types';
import { genId } from '@/features/hr/attendance/lib/utils';
import { ShiftTemplateCard } from '@/features/hr/attendance/templates/components/shift-template-card';
import { ShiftTemplateDialogForm } from '@/features/hr/attendance/templates/components/shift-template-dialog-form';
import { DEFAULT_REST } from '@/features/hr/attendance/templates/constants/shift-templates-ui';
import {
  cloneTemplate,
  validateTemplate,
} from '@/features/hr/attendance/templates/utils/shift-template-helpers';
import { shiftTemplatesApi, type ShiftTemplateResponseDto } from '@/features/hr/attendance/lib/api/shift-templates';
import { formatApiErrorForDisplay } from '@/features/hr/lib/api/global-error-handler';
import { companiesApi } from '@/features/hr/lib/api/companies';
import { getDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import {
  ORGANIZATION_ARCHIVE_SCOPE_DEFAULT,
  organizationListStatusQuery,
  type OrganizationArchiveScope,
} from '@/features/hr/organization/lib/archive-scope';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { DirectoryPagedViews, useServerDirectoryPagination } from '@/components/ui/paged-list';

function dtoToLocal(dto: ShiftTemplateResponseDto): ShiftTemplate {
  return {
    id: dto.id,
    nameAr: dto.nameAr,
    nameEn: dto.nameEn ?? '',
    colorHex: dto.colorHex,
    effectiveFrom: dto.effectiveFrom,
    isActive: dto.isActive,
    weekDays: dto.weekDays.map((wd) => ({
      day: wd.day as WeekDayIndex,
      isRest: wd.isRest,
      periods: wd.periods.map((p) => ({
        id: p.id ?? genId('per'),
        startTime: p.startTime,
        endTime: p.endTime,
        breakEnabled: p.breakEnabled,
        breakStart: p.breakStart ?? '',
        breakEnd: p.breakEnd ?? '',
        flexibilityEnabled: p.flexibilityEnabled,
        flexibilityMinutes: p.flexibilityMinutes ?? 0,
        checkIn: {
          beforeStartMinutes: p.checkIn.beforeStartMinutes,
          graceMinutes: p.checkIn.graceMinutes,
          afterStartMinutes: p.checkIn.afterStartMinutes,
        },
        checkOut: {
          beforeEndMinutes: p.checkOut.beforeEndMinutes,
          allowedShortageMinutes: p.checkOut.allowedShortageMinutes,
          afterEndMinutes: p.checkOut.afterEndMinutes,
        },
        checkOutNotRequired: p.checkOutNotRequired,
        autoOvertime: p.autoOvertime,
        strictMode: p.strictMode,
        strictPenaltyWarning: p.strictPenaltyWarning,
        strictPenaltyBalanceEnabled: p.strictPenaltyBalanceEnabled,
        strictPenaltyBalanceDays: p.strictPenaltyBalanceDays,
      })),
    })),
  };
}

export function ShiftTemplatesPanel() {
  const [companyId, setCompanyId] = React.useState('');
  const [archiveScope, setArchiveScope] = React.useState<OrganizationArchiveScope>(
    ORGANIZATION_ARCHIVE_SCOPE_DEFAULT,
  );
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<ShiftTemplate | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = React.useState<ShiftTemplate | null>(null);
  const [deleting, setDeleting] = React.useState(false);
  const [deleteError, setDeleteError] = React.useState<string | null>(null);

  const loadPage = React.useCallback(async (page: number, pageSize: number) => {
    try {
      const res = await shiftTemplatesApi.getAll({
        ...(companyId ? { companyId, page, limit: pageSize } : { page, limit: pageSize }),
        ...organizationListStatusQuery(archiveScope),
      });
      return { items: res.items.map(dtoToLocal), total: res.pagination.total };
    } catch {
      return { items: [] as ShiftTemplate[], total: 0 };
    }
  }, [companyId, archiveScope]);

  const {
    items: shiftTemplates,
    loading,
    pagination,
    reload,
  } = useServerDirectoryPagination<ShiftTemplate>(loadPage, {
    enabled: !!companyId,
    resetDeps: [companyId, archiveScope],
  });

  React.useEffect(() => {
    setCompanyId(getDefaultCompanyId() ?? '');
  }, []);

  const buildDefault = (): ShiftTemplate => {
    const per = defaultShiftPeriod(genId('per'));
    return {
      id: genId('tpl'),
      nameAr: '',
      nameEn: '',
      colorHex: '#0f766e',
      effectiveFrom: new Date().toISOString().slice(0, 10),
      isActive: true,
      weekDays: ([6, 0, 1, 2, 3, 4, 5] as WeekDayIndex[]).map((day) => ({
        day,
        isRest: DEFAULT_REST.includes(day),
        periods: DEFAULT_REST.includes(day) ? [] : [{ ...per, id: genId('per') }],
      })),
    };
  };

  const openCreate = React.useCallback(() => {
    setDraft(buildDefault());
    setError(null);
    setOpen(true);
  // buildDefault is a stable inner fn; its deps are stable constants + companyId
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [companyId]);

  const openEdit = React.useCallback((t: ShiftTemplate) => {
    setDraft(normalizeShiftTemplate(cloneTemplate(t)));
    setError(null);
    setOpen(true);
  }, []);

  const isEdit = !!draft && shiftTemplates.some((x) => x.id === draft.id);

  const save = async () => {
    if (!draft) return;
    const err = validateTemplate(draft);
    if (err) { setError(err); return; }

    const weekDays = draft.weekDays.map((wd) => ({
      day: wd.day,
      isRest: wd.isRest,
      periods: wd.periods.map((p) => ({
        startTime: p.startTime,
        endTime: p.endTime,
        breakEnabled: p.breakEnabled,
        breakStart: p.breakStart || null,
        breakEnd: p.breakEnd || null,
        flexibilityEnabled: p.flexibilityEnabled,
        flexibilityMinutes: p.flexibilityMinutes || null,
        checkIn: {
          beforeStartMinutes: p.checkIn.beforeStartMinutes,
          graceMinutes: p.checkIn.graceMinutes,
          afterStartMinutes: p.checkIn.afterStartMinutes,
        },
        checkOut: {
          beforeEndMinutes: p.checkOut.beforeEndMinutes,
          allowedShortageMinutes: p.checkOut.allowedShortageMinutes,
          afterEndMinutes: p.checkOut.afterEndMinutes,
        },
        checkOutNotRequired: p.checkOutNotRequired,
        autoOvertime: p.autoOvertime,
        strictMode: p.strictMode,
        strictPenaltyWarning: p.strictPenaltyWarning,
        strictPenaltyBalanceEnabled: p.strictPenaltyBalanceEnabled,
        strictPenaltyBalanceDays: p.strictPenaltyBalanceDays,
      })),
    }));

    try {
      if (isEdit) {
        await shiftTemplatesApi.update(draft.id, {
          nameAr: draft.nameAr, nameEn: draft.nameEn,
          colorHex: draft.colorHex, effectiveFrom: draft.effectiveFrom,
          isActive: draft.isActive, weekDays,
        });
      } else {
        await shiftTemplatesApi.create({
          companyId, nameAr: draft.nameAr, nameEn: draft.nameEn,
          colorHex: draft.colorHex, effectiveFrom: draft.effectiveFrom,
          isActive: draft.isActive, weekDays,
        });
      }
      await reload();
      setOpen(false);
      setDraft(null);
    } catch (e) {
      setError(formatApiErrorForDisplay(e));
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError(null);
    try {
      await shiftTemplatesApi.remove(deleteTarget.id);
      await reload();
      setDeleteTarget(null);
    } catch (e) {
      setDeleteError(formatApiErrorForDisplay(e));
    } finally {
      setDeleting(false);
    }
  };

  usePageHeaderActions(
    () => (
      <div className="flex shrink-0 flex-nowrap items-center gap-1.5 sm:gap-2">
        <Button variant="luxe" size="sm" className="h-8 gap-1.5 px-3 text-xs shrink-0" type="button" onClick={openCreate}>
          <Plus className="h-3.5 w-3.5" /> قالب جديد
        </Button>
      </div>
    ),
    [openCreate],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">

      {loading && shiftTemplates.length === 0 ? null : shiftTemplates.length === 0 && !loading ? (
        <EmptyStateCard
          icon={Clock}
          title="لا توجد قوالب بعد"
          description="أضف قالباً جديداً لتحديد أوقات الدوام"
        />
      ) : (
        <DirectoryPagedViews items={shiftTemplates} serverPagination={pagination} loading={loading}>
          {(pageItems) => (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {pageItems.map((t) => (
            <ShiftTemplateCard
              key={t.id}
              t={t}
              onEdit={() => openEdit(t)}
              onDelete={() => {
                setDeleteError(null);
                setDeleteTarget(t);
              }}
            />
          ))}
        </div>
          )}
        </DirectoryPagedViews>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="flex max-h-[92vh] w-full max-w-2xl flex-col overflow-visible border-border p-0">
          <div className="shrink-0 border-b border-border px-6 py-5">
            <DialogHeader>
              <DialogTitle className="font-display text-xl">
                {isEdit ? 'تعديل القالب' : 'قالب دوام جديد'}
              </DialogTitle>
              <DialogDescription>
                حدد أيام العمل ثم أدخل أوقات الدوام — تُطبَّق تلقائياً على جميع الأيام المحددة.
              </DialogDescription>
            </DialogHeader>
          </div>

          {draft && (
            <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
              <ShiftTemplateDialogForm draft={draft} setDraft={setDraft} />
              {error && (
                <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                  {error}
                </div>
              )}
            </div>
          )}

          <DialogFooter className={dialogFormFooterClass}>
            <Button variant="luxe" type="button" onClick={() => void save()}>
              حفظ القالب
            </Button>
            <Button variant="outline" type="button" onClick={() => setOpen(false)}>
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!deleteTarget}
        onOpenChange={(v) => {
          if (!v && !deleting) {
            setDeleteTarget(null);
            setDeleteError(null);
          }
        }}
      >
        <DialogContent className="max-w-sm border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display text-base">
              <AlertTriangle className="h-4 w-4 text-destructive" />
              حذف قالب الدوام
            </DialogTitle>
            <DialogDescription className="leading-relaxed">
              هل أنت متأكد من حذف القالب{' '}
              <span className="font-semibold text-foreground">{deleteTarget?.nameAr}</span>؟ لا يمكن
              التراجع عن هذا الإجراء.
            </DialogDescription>
          </DialogHeader>
          {deleteError && (
            <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {deleteError}
            </div>
          )}
          <DialogFooter className="pt-2">
            <Button variant="destructive" onClick={() => void confirmDelete()} disabled={deleting} className="gap-2">
              {deleting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
              حذف
            </Button>
            <Button variant="outline" onClick={() => setDeleteTarget(null)} disabled={deleting}>
              إلغاء
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
