'use client';

import * as React from 'react';
import { toast } from 'sonner';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import { EmployeePicker } from '@/components/ui/employee-picker';
import { FormField, HRSettingsFormDrawer, MinimalDropdown } from '@/components/ui/shared-dialogs';
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

type SendForm = {
  titleAr: string;
  bodyAr: string;
  category: NotificationCategory;
  severity: NotificationSeverity;
  employeeIds: Set<string>;
  requiresAcknowledgment: boolean;
  actionUrl: string;
  actionLabelAr: string;
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
};

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

  const mustSelectEmployees = requireSelection || lockAudienceToEmployees;

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
    });
    setFormError(null);
  }, [open, defaults, initialEmployeeIds]);

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

    const allEmployeeIds = employeeOptions.map((e) => e.id);
    const audience = resolveAudience(form.employeeIds, allEmployeeIds, mustSelectEmployees);

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

    setSaving(true);
    setFormError(null);
    try {
      await notificationsApi.send(dto);
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
      <FormField label={`الموظفون${form.employeeIds.size > 0 ? ` (${form.employeeIds.size})` : ''}`}>
        <EmployeePicker
          variant="form"
          selectionMode={mustSelectEmployees ? 'target' : 'filter'}
          employees={employeeOptions}
          selected={form.employeeIds}
          onChange={(employeeIds) => setForm((f) => ({ ...f, employeeIds }))}
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
            placeholder="/hr/dashboard"
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
