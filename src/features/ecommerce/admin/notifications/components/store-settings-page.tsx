'use client';

import { BellRing } from 'lucide-react';
import { toast } from 'sonner';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { useCan } from '@/features/auth/hooks/use-can';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { useActiveCompany } from '@/features/hr/organization/hooks/useActiveCompany';
import {
  STORE_NOTIFICATION_GROUPS,
  type StoreNotificationKey,
} from '@/features/ecommerce/admin/notifications/constants/notification-groups';
import { useStoreCompanySettings } from '@/features/ecommerce/admin/notifications/hooks/use-store-settings';
import type { StoreCompanySettings } from '@/features/ecommerce/admin/notifications/lib/api/store-settings';
import { NotificationTogglesCard } from '@/features/system/organization/pages/_shared/components/notification-toggles-card';
import { SettingsCompanyBanner } from '@/features/system/organization/pages/_shared/components/settings-company-banner';
import {
  SettingsPageEmpty,
  SettingsPageError,
  SettingsPageLoading,
} from '@/features/system/organization/pages/_shared/components/settings-page-states';
import { useModuleEnablementContext } from '@/features/auth/hooks/use-system-owner';
import { isModuleEnabledFor } from '@/shared/modules/registry';

export function StoreSettingsPage() {
  const can = useCan();
  const canRead = can('sta.settings.read') || can('hr.notifications.read');
  const canUpdate = can('sta.settings.update') || can('hr.notifications.update');

  const activeCompanyId = useAuthStore((s) => s.activeCompanyId);
  const { companyId: moduleCompanyId, ...moduleContext } = useModuleEnablementContext();
  const storeEnabled = isModuleEnabledFor(
    'ecommerce',
    activeCompanyId ?? moduleCompanyId,
    moduleContext,
  );

  const { data: company } = useActiveCompany();
  const { data: settings, isLoading, isError, error, update, companyId } =
    useStoreCompanySettings();

  const handleToggle = async (key: string, value: boolean) => {
    if (!settings || !canUpdate) return;
    try {
      await update.mutateAsync({ [key]: value });
      toast.success('تم تحديث الإعداد');
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'settings.store.update');
      toast.error(displayMessage);
    }
  };

  if (!storeEnabled) {
    return (
      <SettingsPageEmpty message="تطبيق المتجر غير مفعّل لهذه الشركة — لا تظهر إعدادات الإشعارات." />
    );
  }

  if (!canRead) {
    return <SettingsPageEmpty message="ليس لديك صلاحية عرض إعدادات إشعارات المتجر." />;
  }

  if (!companyId) {
    return <SettingsPageEmpty message="لا توجد شركة افتراضية — سجّل الدخول أو اختر شركة." />;
  }

  if (isLoading) {
    return <SettingsPageLoading />;
  }

  if (isError || !settings) {
    const { displayMessage } = handleApiError(error, 'settings.store.get');
    return <SettingsPageError message={displayMessage} />;
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <SetPageTitle titleAr="إعدادات إشعارات المتجر" iconName="Bell" />
      {company ? (
        <SettingsCompanyBanner
          eyebrow="المتجر"
          icon={BellRing}
          companyName={company.nameAr}
          description="تحكم في إشعارات الطلبات، الدفع، ورسائل التواصل — منفصلة عن إعدادات هوية المتجر."
        />
      ) : null}

      <NotificationTogglesCard
        title="إشعارات المتجر"
        description="إعدادات مستقلة عن الموارد البشرية — تُطبَّق على أحداث الطلبات ورسائل التواصل فقط."
        groups={STORE_NOTIFICATION_GROUPS}
        values={settings as Pick<StoreCompanySettings, StoreNotificationKey>}
        disabled={update.isPending || !canUpdate}
        masterDisabled={!settings.notificationsEnabled}
        onToggle={(key, value) => void handleToggle(key, value)}
      />
    </div>
  );
}
