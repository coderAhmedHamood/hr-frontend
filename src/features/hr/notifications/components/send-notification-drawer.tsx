'use client';

import * as React from 'react';
import { Bell, FileSignature, Layers2, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { EmployeePicker } from '@/components/ui/employee-picker';
import { FILTER_PERMISSIONS } from '@/features/auth/permissions/filter-permissions';
import { FormField, HRSettingsFormDrawer, MinimalDropdown } from '@/components/ui/shared-dialogs';
import { cn } from '@/shared/utils';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import {
  NOTIFICATION_CATEGORY_FILTER_ORDER,
  NOTIFICATION_CATEGORY_LABELS,
  NOTIFICATION_SEVERITY_LABELS,
} from '@/features/hr/notifications/admin/constants/notification-labels';
import {
  notificationsApi,
  type NotificationCategory,
  type NotificationSeverity,
  type SendNotificationDto,
} from '@/features/hr/notifications/lib/api/notifications';
import {
  cashReceiptVouchersApi,
  type PayrollNotifyDeliveryMode,
} from '@/features/hr/organization/employees/lib/api/cash-receipt-vouchers';
import { payrollPeriodsApi } from '@/features/hr/payroll/lib/api/payroll-periods';
import { hrPayrollSalaryApprovalsQueryHref } from '@/features/hr/payroll/constants/routes';
import {
  deliveryIncludesPayslipNotify,
  deliveryIncludesPdfSign,
  sendCashReceiptSignatureNotification,
  sendPayslipGeneratedNotification,
} from '@/features/hr/payroll/compensation/services/payslip-notification.service';

type SendForm = {
  titleAr: string;
  bodyAr: string;
  category: NotificationCategory;
  severity: NotificationSeverity;
  employeeIds: Set<string>;
  requiresAcknowledgment: boolean;
  actionUrl: string;
  actionLabelAr: string;
  payrollDeliveryMode: PayrollNotifyDeliveryMode;
  payrollPeriodId: string;
};

export type SendNotificationDrawerDefaults = {
  category?: NotificationCategory;
  severity?: NotificationSeverity;
  titleAr?: string;
  bodyAr?: string;
  requiresAcknowledgment?: boolean;
  actionUrl?: string;
  actionLabelAr?: string;
  sourceKind?: string;
  sourceTable?: string;
  sourceId?: string;
};

const BASE_FORM: SendForm = {
  titleAr: '',
  bodyAr: '',
  category: 'announcement',
  severity: 'info',
  employeeIds: new Set(),
  requiresAcknowledgment: false,
  actionUrl: '',
  actionLabelAr: 'عرض التفاصيل',
  payrollDeliveryMode: 'both',
  payrollPeriodId: '',
};

const PAYROLL_DELIVERY_OPTIONS: {
  value: PayrollNotifyDeliveryMode;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
}[] = [
  {
    value: 'notify_only',
    title: 'إشعار فقط',
    description: 'إشعار بمراجعة قسيمة الراتب والموافقة عليها.',
    icon: Bell,
  },
  {
    value: 'pdf_sign',
    title: 'سند راتب للتأكيد',
    description: 'ترقية سند الراتب وإرسال إشعار لفتحه والتأكيد.',
    icon: FileSignature,
  },
  {
    value: 'both',
    title: 'الإثنان معاً',
    description: 'إشعار القسيمة + سند الراتب للتأكيد في خطوة واحدة.',
    icon: Layers2,
  },
];

function resolveAudience(
  employeeIds: Set<string>,
  allEmployeeIds: string[],
  requireSelection: boolean,
): Pick<SendNotificationDto, 'audienceKind' | 'employeeIds'> {
  if (requireSelection) {
    return {
      audienceKind: 'employee',
      employeeIds: [...employeeIds],
    };
  }

  const isAllSelected =
    employeeIds.size === 0
    || (employeeIds.size === allEmployeeIds.length
      && allEmployeeIds.every((id) => employeeIds.has(id)));

  return {
    audienceKind: isAllSelected ? 'company' : 'employee',
    employeeIds: isAllSelected ? undefined : [...employeeIds],
  };
}

export function SendNotificationDrawer({
  open,
  onOpenChange,
  companyId,
  employeeOptions,
  initialEmployeeIds,
  requireSelection = false,
  lockAudienceToEmployees = false,
  defaults,
  title = 'إرسال إشعار جديد',
  description = 'اختر الموظفين المستهدفين ثم أرسل الإشعار.',
  createdBy,
  onSent,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  companyId: string | null | undefined;
  employeeOptions: { id: string; name: string; branchNameAr?: string; departmentNameAr?: string }[];
  initialEmployeeIds?: Set<string>;
  /** When true, at least one employee must be selected (no company-wide send). */
  requireSelection?: boolean;
  /** @deprecated Use requireSelection */
  lockAudienceToEmployees?: boolean;
  defaults?: SendNotificationDrawerDefaults;
  title?: string;
  description?: string;
  createdBy?: string | null;
  onSent?: () => void | Promise<void>;
}) {
  const [form, setForm] = React.useState<SendForm>(BASE_FORM);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [saving, setSaving] = React.useState(false);
  const [periodsLoading, setPeriodsLoading] = React.useState(false);
  const [periodOptions, setPeriodOptions] = React.useState<
    { value: string; label: string; nameAr: string }[]
  >([]);

  const mustSelectEmployees = requireSelection || lockAudienceToEmployees;
  const isPayrollCategory = form.category === 'payroll';
  const needsPayrollPeriod =
    isPayrollCategory
    && (deliveryIncludesPdfSign(form.payrollDeliveryMode)
      || deliveryIncludesPayslipNotify(form.payrollDeliveryMode));

  React.useEffect(() => {
    if (!open) return;
    setForm({
      ...BASE_FORM,
      category: defaults?.category ?? 'announcement',
      severity: defaults?.severity ?? 'info',
      titleAr: defaults?.titleAr ?? '',
      bodyAr: defaults?.bodyAr ?? '',
      employeeIds: new Set(initialEmployeeIds ?? []),
      requiresAcknowledgment: defaults?.requiresAcknowledgment ?? false,
      actionUrl: defaults?.actionUrl ?? '',
      actionLabelAr: defaults?.actionLabelAr ?? 'عرض التفاصيل',
      payrollDeliveryMode: 'both',
      payrollPeriodId: defaults?.sourceId ?? '',
    });
    setFormError(null);
  }, [open, defaults, initialEmployeeIds]);

  React.useEffect(() => {
    if (!open || !companyId || !isPayrollCategory) return;
    let cancelled = false;
    void (async () => {
      setPeriodsLoading(true);
      try {
        const result = await payrollPeriodsApi.list({ companyId, limit: 50 });
        if (cancelled) return;
        const MONTH_NAMES_AR = [
          'يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو',
          'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر',
        ];
        setPeriodOptions(
          (result.items ?? []).map((p) => {
            const nameAr = `${MONTH_NAMES_AR[p.periodMonth - 1] ?? p.periodMonth} ${p.periodYear}`;
            return {
              value: p.id,
              label: nameAr,
              nameAr,
            };
          }),
        );
      } catch {
        if (!cancelled) setPeriodOptions([]);
      } finally {
        if (!cancelled) setPeriodsLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, companyId, isPayrollCategory]);

  const submitSend = async () => {
    if (!companyId) {
      setFormError('تعذر تحديد الشركة');
      return;
    }
    if (!form.titleAr.trim()) {
      setFormError('العنوان مطلوب');
      return;
    }
    if (mustSelectEmployees && form.employeeIds.size === 0) {
      setFormError('اختر موظفاً واحداً على الأقل');
      return;
    }
    if (isPayrollCategory && needsPayrollPeriod && !form.payrollPeriodId) {
      setFormError('اختر فترة الرواتب');
      return;
    }

    const allEmployeeIds = employeeOptions.map((e) => e.id);
    const audience = resolveAudience(form.employeeIds, allEmployeeIds, mustSelectEmployees);
    const targetEmployeeIds =
      audience.employeeIds ??
      (audience.audienceKind === 'company' ? allEmployeeIds : []);

    setSaving(true);
    setFormError(null);
    try {
      if (isPayrollCategory) {
        const periodMeta = periodOptions.find((p) => p.value === form.payrollPeriodId);
        const periodNameAr = periodMeta?.nameAr ?? form.titleAr.trim();

        if (deliveryIncludesPdfSign(form.payrollDeliveryMode)) {
          if (targetEmployeeIds.length === 0) {
            setFormError('لا يوجد موظفون لإصدار سندات الراتب');
            setSaving(false);
            return;
          }
          await cashReceiptVouchersApi.bulkIssueForPayroll({
            companyId,
            payrollPeriodId: form.payrollPeriodId,
            employeeIds: targetEmployeeIds,
            createdBy: createdBy ?? undefined,
          });
          await sendCashReceiptSignatureNotification({
            companyId,
            periodId: form.payrollPeriodId,
            periodNameAr,
            employeeIds: targetEmployeeIds,
            createdBy: createdBy ?? undefined,
          });
        }

        if (deliveryIncludesPayslipNotify(form.payrollDeliveryMode)) {
          if (form.payrollPeriodId && targetEmployeeIds.length > 0) {
            await sendPayslipGeneratedNotification({
              companyId,
              periodId: form.payrollPeriodId,
              periodNameAr,
              employeeIds: targetEmployeeIds,
              createdBy: createdBy ?? undefined,
            });
          } else {
            const dto: SendNotificationDto = {
              companyId,
              category: form.category,
              severity: form.severity,
              titleAr: form.titleAr.trim(),
              bodyAr: form.bodyAr.trim() || null,
              audienceKind: audience.audienceKind,
              employeeIds: audience.employeeIds,
              deliveryChannel: 'in_app',
              sourceKind: defaults?.sourceKind ?? 'payroll_payslip',
              sourceTable: defaults?.sourceTable ?? (form.payrollPeriodId ? 'hr_payroll_periods' : undefined),
              sourceId: defaults?.sourceId ?? (form.payrollPeriodId || undefined),
              requiresAcknowledgment: form.requiresAcknowledgment,
              actionUrl:
                form.actionUrl.trim() ||
                (form.payrollPeriodId
                  ? hrPayrollSalaryApprovalsQueryHref(form.payrollPeriodId)
                  : undefined),
              actionLabelAr: form.actionLabelAr.trim() || undefined,
              createdBy: createdBy ?? undefined,
            };
            await notificationsApi.send(dto);
          }
        }
      } else {
        const dto: SendNotificationDto = {
          companyId,
          category: form.category,
          severity: form.severity,
          titleAr: form.titleAr.trim(),
          bodyAr: form.bodyAr.trim() || null,
          audienceKind: audience.audienceKind,
          employeeIds: audience.employeeIds,
          deliveryChannel: 'in_app',
          sourceKind: defaults?.sourceKind ?? 'manual',
          sourceTable: defaults?.sourceTable,
          sourceId: defaults?.sourceId,
          requiresAcknowledgment: form.requiresAcknowledgment,
          actionUrl: form.actionUrl.trim() || undefined,
          actionLabelAr: form.actionLabelAr.trim() || undefined,
          createdBy: createdBy ?? undefined,
        };
        await notificationsApi.send(dto);
      }

      toast.success('تم إرسال الإشعار');
      onOpenChange(false);
      await onSent?.();
    } catch (e) {
      setFormError(handleApiError(e).displayMessage);
    } finally {
      setSaving(false);
    }
  };

  return (
    <HRSettingsFormDrawer
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      description={description}
      onSave={submitSend}
      saveDisabled={saving}
      saveLabel="إرسال"
      error={formError}
    >
      <FormField label="العنوان *">
        <Input
          value={form.titleAr}
          onChange={(e) => setForm((f) => ({ ...f, titleAr: e.target.value }))}
          placeholder="مثال: إعلان عام للموظفين"
        />
      </FormField>
      <FormField label="المحتوى">
        <textarea
          value={form.bodyAr}
          onChange={(e) => setForm((f) => ({ ...f, bodyAr: e.target.value }))}
          rows={4}
          className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
          placeholder="نص الإشعار..."
        />
      </FormField>
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="التصنيف">
          <MinimalDropdown
            value={form.category}
            options={NOTIFICATION_CATEGORY_FILTER_ORDER.map((c) => ({
              value: c,
              label: NOTIFICATION_CATEGORY_LABELS[c],
            }))}
            onChange={(v) => setForm((f) => ({ ...f, category: v as NotificationCategory }))}
          />
        </FormField>
        <FormField label="الأولوية">
          <MinimalDropdown
            value={form.severity}
            options={(
              Object.entries(NOTIFICATION_SEVERITY_LABELS) as [NotificationSeverity, string][]
            ).map(([value, label]) => ({ value, label }))}
            onChange={(v) => setForm((f) => ({ ...f, severity: v as NotificationSeverity }))}
          />
        </FormField>
      </div>

      {isPayrollCategory ? (
        <div className="space-y-3 rounded-2xl border border-primary/15 bg-linear-to-b from-primary/8 via-primary/4 to-transparent p-3.5">
          <div className="space-y-0.5">
            <p className="text-sm font-semibold text-foreground">طريقة الإرسال — رواتب</p>
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              اختر ماذا يصل للموظف بعد الإرسال. سند التأكيد يعتمد على سندات الراتب المُولَّدة للفترة.
            </p>
          </div>

          <div className="grid gap-2" role="radiogroup" aria-label="طريقة إرسال إشعار الراتب">
            {PAYROLL_DELIVERY_OPTIONS.map((opt) => {
              const selected = form.payrollDeliveryMode === opt.value;
              const Icon = opt.icon;
              return (
                <button
                  key={opt.value}
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={saving}
                  onClick={() =>
                    setForm((f) => ({ ...f, payrollDeliveryMode: opt.value }))
                  }
                  className={cn(
                    'flex w-full items-start gap-3 rounded-xl border px-3 py-3 text-right transition-all duration-200',
                    selected
                      ? 'border-primary/45 bg-primary/10 shadow-soft'
                      : 'border-border/70 bg-background/80 hover:border-primary/25 hover:bg-muted/30',
                  )}
                >
                  <span
                    className={cn(
                      'mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg',
                      selected ? 'bg-primary/15 text-primary' : 'bg-muted text-muted-foreground',
                    )}
                  >
                    <Icon className="h-4 w-4" />
                  </span>
                  <span className="min-w-0 flex-1 space-y-0.5">
                    <span className="block text-sm font-medium text-foreground">{opt.title}</span>
                    <span className="block text-[11px] leading-relaxed text-muted-foreground">
                      {opt.description}
                    </span>
                  </span>
                  <span
                    className={cn(
                      'mt-1 h-4 w-4 shrink-0 rounded-full border-2',
                      selected
                        ? 'border-primary bg-primary shadow-[inset_0_0_0_3px_hsl(var(--background))]'
                        : 'border-muted-foreground/35',
                    )}
                    aria-hidden
                  />
                </button>
              );
            })}
          </div>

          <FormField label="فترة الرواتب *">
            {periodsLoading ? (
              <div className="flex h-10 items-center gap-2 rounded-md border border-input px-3 text-xs text-muted-foreground">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                جاري تحميل الفترات...
              </div>
            ) : (
              <MinimalDropdown
                value={form.payrollPeriodId || ''}
                options={[
                  { value: '', label: '— اختر الفترة —' },
                  ...periodOptions,
                ]}
                onChange={(v) => setForm((f) => ({ ...f, payrollPeriodId: v }))}
              />
            )}
          </FormField>
        </div>
      ) : null}

      <FormField label={`الموظفون${form.employeeIds.size > 0 ? ` (${form.employeeIds.size})` : ''}`}>
        <EmployeePicker
          variant="form"
          selectionMode={mustSelectEmployees ? 'target' : 'filter'}
          employees={employeeOptions}
          selected={form.employeeIds}
          onChange={(employeeIds) => setForm((f) => ({ ...f, employeeIds }))}
          requirePermission={FILTER_PERMISSIONS.employee}
        />
      </FormField>
      <label className="flex cursor-pointer items-center gap-2 text-sm">
        <Checkbox
          checked={form.requiresAcknowledgment}
          onCheckedChange={(v) =>
            setForm((f) => ({ ...f, requiresAcknowledgment: v === true }))
          }
        />
        يتطلب الموافقة من المستلم
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <FormField label="رابط الإجراء (اختياري)">
          <Input
            value={form.actionUrl}
            onChange={(e) => setForm((f) => ({ ...f, actionUrl: e.target.value }))}
            placeholder="/hr/organization/employees"
            dir="ltr"
          />
        </FormField>
        <FormField label="نص الزر">
          <Input
            value={form.actionLabelAr}
            onChange={(e) => setForm((f) => ({ ...f, actionLabelAr: e.target.value }))}
          />
        </FormField>
      </div>
    </HRSettingsFormDrawer>
  );
}
