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
      <SetPageTitle titleAr="إعدادات إشعارات المخازن" iconName="Bell" />
      {company ? (
        <SettingsCompanyBanner
          eyebrow="المخازن"
          icon={BellRing}
          companyName={company.nameAr}
          description="تحكم في إشعارات المخازن: تنبيهات المخزون، حركات المستودع، وخصم البيع. المستلمون = من يملك inv.notifications.read ضمن نطاق الفرع (ليس broadcast لكل الشركة)."
        />
      ) : null}

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
