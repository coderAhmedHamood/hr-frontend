'use client';

import { BellRing } from 'lucide-react';
import { toast } from 'sonner';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { useActiveCompany } from '@/features/hr/organization/hooks/useActiveCompany';
import { HR_NOTIFICATION_GROUPS } from '@/features/system/organization/pages/_shared/constants/notification-groups';
import { NotificationTogglesCard } from '@/features/system/organization/pages/_shared/components/notification-toggles-card';
import { SettingsCompanyBanner } from '@/features/system/organization/pages/_shared/components/settings-company-banner';
import {
  SettingsPageEmpty,
  SettingsPageError,
  SettingsPageLoading,
} from '@/features/system/organization/pages/_shared/components/settings-page-states';
import { useHrCompanySettings } from '@/features/system/organization/pages/hr/hooks/useHrSettings';
import type { HrNotificationKey } from '@/features/system/organization/pages/_shared/constants/notification-groups';
import type { HrCompanySettings } from '@/features/system/organization/pages/_shared/types/settings';

export default function HrSettingsPage() {
  const { data: company } = useActiveCompany();
  const { data: settings, isLoading, isError, error, update, companyId } = useHrCompanySettings();

  const handleToggle = async (key: string, value: boolean) => {
    if (!settings) return;
    try {
      await update.mutateAsync({ [key as HrNotificationKey]: value });
      toast.success('تم تحديث الإعداد');
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'settings.hr.update');
      toast.error(displayMessage);
    }
  };

  if (!companyId) {
    return <SettingsPageEmpty message="لا توجد شركة افتراضية — سجّل الدخول أو اختر شركة." />;
  }

  if (isLoading) {
    return <SettingsPageLoading />;
  }

  if (isError || !settings) {
    const { displayMessage } = handleApiError(error, 'settings.hr.get');
    return <SettingsPageError message={displayMessage} />;
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      {company ? (
        <SettingsCompanyBanner
          eyebrow="الموارد البشرية"
          icon={BellRing}
          companyName={company.nameAr}
          description="تحكم في الإشعارات المرسلة لأحداث HR داخل هذه الشركة."
        />
      ) : null}
      <NotificationTogglesCard
        title="إشعارات الموارد البشرية"
        description="تحكم في الإشعارات المرسلة لأحداث HR: الانضباط، الرواتب، الحضور، الطلبات، والعقود."
        groups={HR_NOTIFICATION_GROUPS}
        values={settings as Pick<HrCompanySettings, HrNotificationKey>}
        disabled={update.isPending}
        masterDisabled={!settings.notificationsEnabled}
        onToggle={(key, value) => void handleToggle(key, value)}
      />
    </div>
  );
}
