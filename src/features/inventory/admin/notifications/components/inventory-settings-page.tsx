'use client';

import { BellRing } from 'lucide-react';
import { toast } from 'sonner';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { useCan } from '@/features/auth/hooks/use-can';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { useActiveCompany } from '@/features/hr/organization/hooks/useActiveCompany';
import {
  INVENTORY_NOTIFICATION_GROUPS,
  type InventoryNotificationKey,
} from '@/features/inventory/admin/notifications/constants/notification-groups';
import { useInventoryCompanySettings } from '@/features/inventory/admin/notifications/hooks/use-inventory-settings';
import type { InventoryCompanySettings } from '@/features/inventory/admin/notifications/lib/api/inventory-settings';
import { NotificationTogglesCard } from '@/features/system/organization/pages/_shared/components/notification-toggles-card';
import { SettingsCompanyBanner } from '@/features/system/organization/pages/_shared/components/settings-company-banner';
import {
  SettingsPageEmpty,
  SettingsPageError,
  SettingsPageLoading,
} from '@/features/system/organization/pages/_shared/components/settings-page-states';
import { useModuleEnablementContext } from '@/features/auth/hooks/use-system-owner';
import { isModuleEnabledFor } from '@/shared/modules/registry';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

export function InventorySettingsPage() {
  const can = useCan();
  const canRead = can('inv.settings.read');
  const canUpdate = can('inv.settings.update');

  const activeCompanyId = useAuthStore((s) => s.activeCompanyId);
  const { companyId: moduleCompanyId, ...moduleContext } = useModuleEnablementContext();
  const inventoryEnabled = isModuleEnabledFor(
    'inventory',
    activeCompanyId ?? moduleCompanyId,
    moduleContext,
  );

  const { data: company } = useActiveCompany();
  const { data: settings, isLoading, isError, error, update, companyId } =
    useInventoryCompanySettings();

  const handleToggle = async (key: string, value: boolean) => {
    if (!settings || !canUpdate) return;
    try {
      await update.mutateAsync({ [key]: value });
      toast.success('تم تحديث الإعداد');
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'settings.inventory.update');
      toast.error(displayMessage);
    }
  };

  const handleBatchStrategy = async (
    value: InventoryCompanySettings['batchAllocationStrategy'],
  ) => {
    if (!settings || !canUpdate) return;
    try {
      await update.mutateAsync({ batchAllocationStrategy: value });
      toast.success('تم تحديث استراتيجية استهلاك الدفعات');
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'settings.inventory.update');
      toast.error(displayMessage);
    }
  };

  if (!inventoryEnabled) {
    return (
      <SettingsPageEmpty message="تطبيق المخازن غير مفعّل لهذه الشركة — لا تظهر إعدادات الإشعارات." />
    );
  }

  if (!canRead) {
    return <SettingsPageEmpty message="ليس لديك صلاحية عرض إعدادات إشعارات المخازن." />;
  }

  if (!companyId) {
    return <SettingsPageEmpty message="لا توجد شركة افتراضية — سجّل الدخول أو اختر شركة." />;
  }

  if (isLoading) {
    return <SettingsPageLoading />;
  }

  if (isError || !settings) {
    const { displayMessage } = handleApiError(error, 'settings.inventory.get');
    return <SettingsPageError message={displayMessage} />;
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <SetPageTitle titleAr="إعدادات المخازن" iconName="Bell" />
      {company ? (
        <SettingsCompanyBanner
          eyebrow="المخازن"
          icon={BellRing}
          companyName={company.nameAr}
          description="تحكم في إشعارات المخازن: تنبيهات المخزون، حركات المستودع، وخصم البيع. المستلمون = من يملك inv.notifications.read ضمن نطاق الفرع (ليس broadcast لكل الشركة)."
        />
      ) : null}

      <section className="rounded-xl border border-border bg-card p-4 sm:p-5">
        <div className="space-y-1">
          <h2 className="font-semibold">إدارة دفعات المخزون</h2>
          <p className="text-sm text-muted-foreground">
            تحدد ترتيب الدفعات عند الصرف والتحويل والنقص في الجرد داخل الموقع المختار.
          </p>
        </div>
        <div className="mt-4 max-w-md space-y-1.5">
          <Label htmlFor="batch-allocation-strategy">استراتيجية استهلاك الدفعات</Label>
          <Select
            value={settings.batchAllocationStrategy}
            disabled={update.isPending || !canUpdate}
            onValueChange={(value) =>
              void handleBatchStrategy(
                value as InventoryCompanySettings['batchAllocationStrategy'],
              )
            }
          >
            <SelectTrigger id="batch-allocation-strategy">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="fifo">FIFO — الأقدم دخولًا أولًا</SelectItem>
              <SelectItem value="lifo">LIFO — الأحدث دخولًا أولًا</SelectItem>
              <SelectItem value="fefo">FEFO — الأقرب انتهاءً أولًا</SelectItem>
            </SelectContent>
          </Select>
          {settings.batchAllocationStrategy === 'fefo' ? (
            <p className="text-xs text-muted-foreground">
              الدفعات بلا تاريخ صلاحية تُستهلك بعد الدفعات المؤرخة، وبترتيب FIFO ثابت.
            </p>
          ) : null}
        </div>
      </section>

      <NotificationTogglesCard
        title="إشعارات المخازن"
        description="إعدادات مستقلة عن الموارد البشرية — تُطبَّق على أحداث المخزون والمستودعات فقط."
        groups={INVENTORY_NOTIFICATION_GROUPS}
        values={settings as Pick<InventoryCompanySettings, InventoryNotificationKey>}
        disabled={update.isPending || !canUpdate}
        masterDisabled={!settings.notificationsEnabled}
        onToggle={(key, value) => void handleToggle(key, value)}
      />
    </div>
  );
}
