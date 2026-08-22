'use client';

import { BellRing } from 'lucide-react';
import { toast } from 'sonner';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { useAuthStore } from '@/features/auth/lib/auth-store';
import { useCan } from '@/features/auth/hooks/use-can';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { useActiveCompany } from '@/features/hr/organization/hooks/useActiveCompany';
import {
  CONTACTS_NOTIFICATION_GROUPS,
  type ContactsNotificationKey,
} from '@/features/contacts/admin/notifications/constants/notification-groups';
import { useContactsCompanySettings } from '@/features/contacts/admin/notifications/hooks/use-contacts-settings';
import type { ContactsCompanySettings } from '@/features/contacts/admin/notifications/lib/api/contacts-settings';
import { NotificationTogglesCard } from '@/features/system/organization/pages/_shared/components/notification-toggles-card';
import { SettingsCompanyBanner } from '@/features/system/organization/pages/_shared/components/settings-company-banner';
import {
  SettingsPageEmpty,
  SettingsPageError,
  SettingsPageLoading,
} from '@/features/system/organization/pages/_shared/components/settings-page-states';
import { useModuleEnablementContext } from '@/features/auth/hooks/use-system-owner';
import { isModuleEnabledFor } from '@/shared/modules/registry';

export function ContactsSettingsPage() {
  const can = useCan();
  const canRead = can('cnt.settings.read') || can('hr.notifications.read');
  const canUpdate = can('cnt.settings.update') || can('hr.notifications.update');

  const activeCompanyId = useAuthStore((s) => s.activeCompanyId);
  const { companyId: moduleCompanyId, ...moduleContext } = useModuleEnablementContext();
  const contactsEnabled = isModuleEnabledFor(
    'contacts',
    activeCompanyId ?? moduleCompanyId,
    moduleContext,
  );

  const { data: company } = useActiveCompany();
  const { data: settings, isLoading, isError, error, update, companyId } =
    useContactsCompanySettings();

  const handleToggle = async (key: string, value: boolean) => {
    if (!settings || !canUpdate) return;
    try {
      await update.mutateAsync({ [key]: value });
      toast.success('تم تحديث الإعداد');
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'settings.contacts.update');
      toast.error(displayMessage);
    }
  };

  if (!contactsEnabled) {
    return (
      <SettingsPageEmpty message="تطبيق جهات الاتصال غير مفعّل لهذه الشركة — لا تظهر إعدادات الإشعارات." />
    );
  }

  if (!canRead) {
    return <SettingsPageEmpty message="ليس لديك صلاحية عرض إعدادات إشعارات جهات الاتصال." />;
  }

  if (!companyId) {
    return <SettingsPageEmpty message="لا توجد شركة افتراضية — سجّل الدخول أو اختر شركة." />;
  }

  if (isLoading) {
    return <SettingsPageLoading />;
  }

  if (isError || !settings) {
    const { displayMessage } = handleApiError(error, 'settings.contacts.get');
    return <SettingsPageError message={displayMessage} />;
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <SetPageTitle titleAr="إعدادات إشعارات جهات الاتصال" iconName="Bell" />
      {company ? (
        <SettingsCompanyBanner
          eyebrow="جهات الاتصال"
          icon={BellRing}
          companyName={company.nameAr}
          description="تحكم في إشعارات الشركاء: الإنشاء، التسجيل، تغيير الحالة، وأنشطة CRM."
        />
      ) : null}

      <NotificationTogglesCard
        title="إشعارات جهات الاتصال"
        description="إعدادات مستقلة عن الموارد البشرية — تُطبَّق على أحداث الشركاء فقط."
        groups={CONTACTS_NOTIFICATION_GROUPS}
        values={settings as Pick<ContactsCompanySettings, ContactsNotificationKey>}
        disabled={update.isPending || !canUpdate}
        masterDisabled={!settings.notificationsEnabled}
        onToggle={(key, value) => void handleToggle(key, value)}
      />
    </div>
  );
}
