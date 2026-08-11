'use client';

import { BellRing, Smartphone } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
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
import { MobileSerialApprovalSettingCard } from '@/features/system/organization/pages/hr/components/mobile-serial-approval-setting-card';
import { useHrCompanySettings } from '@/features/system/organization/pages/hr/hooks/useHrSettings';
import type { HrNotificationKey } from '@/features/system/organization/pages/_shared/constants/notification-groups';
import type { HrCompanySettings } from '@/features/system/organization/pages/_shared/types/settings';

export default function HrSettingsPage() {
  const { data: company } = useActiveCompany();
  const { data: settings, isLoading, isError, error, update, companyId } =
    useHrCompanySettings();

  const handleToggle = async (key: string, value: boolean) => {
    if (!settings) return;
    try {
      await update.mutateAsync({ [key]: value });
      toast.success('تم تحديث الإعداد');
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'settings.hr.update');
      toast.error(displayMessage);
    }
  };

  const handleDeviceAuthChange = async (
    patch: Partial<{
      enforceMobileDeviceSerial: boolean;
      requireAdminApprovalForNewMobileDevice: boolean;
      enforceWebDeviceSerial: boolean;
      requireAdminApprovalForNewWebDevice: boolean;
    }>,
  ) => {
    if (!settings) return;
    try {
      await update.mutateAsync(patch);
      toast.success('تم تحديث الإعداد');
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'settings.hr.update');
      toast.error(displayMessage);
    }
  };

  if (!companyId) {
    return (
      <SettingsPageEmpty message="لا توجد شركة افتراضية — سجّل الدخول أو اختر شركة." />
    );
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
          description="تحكم في إشعارات HR وإلزام/موافقة أجهزة التطبيق والموقع داخل هذه الشركة."
        />
      ) : null}

      <MobileSerialApprovalSettingCard
        values={{
          // Backend default is true when the flag is absent.
          enforceMobileDeviceSerial: settings.enforceMobileDeviceSerial !== false,
          requireAdminApprovalForNewMobileDevice: Boolean(
            settings.requireAdminApprovalForNewMobileDevice,
          ),
          enforceWebDeviceSerial: Boolean(settings.enforceWebDeviceSerial),
          requireAdminApprovalForNewWebDevice: Boolean(
            settings.requireAdminApprovalForNewWebDevice,
          ),
        }}
        disabled={update.isPending}
        onChange={(patch) => void handleDeviceAuthChange(patch)}
      />

      <section className="overflow-hidden rounded-2xl border border-border bg-card shadow-soft">
        <div className="border-b border-border/80 px-4 py-4 sm:px-5">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Smartphone className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold tracking-tight">
                تطبيق الموبايل — الحضور
              </h2>
              <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                سياسات واجهة تسجيل الحضور والانصراف للموظفين على التطبيق.
              </p>
            </div>
          </div>
        </div>
        <div className="px-4 py-4 sm:px-5">
          <div className="flex items-start justify-between gap-3 rounded-xl border border-border/70 bg-card px-3.5 py-3 shadow-soft">
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium leading-tight">
                فرض نوافذ الحضور والانصراف في الموبايل
              </p>
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                عند التفعيل:
                <br />
                • الحضور: يظهر زر «تسجيل الحضور» من (وقت الدخول − beforeStartMinutes)
                حتى (وقت الدخول + graceMinutes). مثال: دخول 8:00 ص، قبل 30 دقيقة،
                سماح 10 دقائق → الزر من 7:30 ص حتى 8:10 ص، ثم يُخفى مع رسالة انتهاء
                النافذة.
                <br />
                • الانصراف: يظهر زر «تسجيل الانصراف» من (وقت الخروج −
                allowedShortageMinutes). مثال: خروج 4:00 م وعجز 15 دقيقة → من 3:45 م.
                <br />
                عند الإيقاف: يعمل التطبيق كما كان سابقاً ويظهر الزر فور كون الحدث
                القادم حضوراً أو انصرافاً.
              </p>
            </div>
            <Switch
              checked={Boolean(settings.hideEarlyCheckoutUntilShortageWindow)}
              disabled={update.isPending}
              onCheckedChange={(v) =>
                void handleToggle('hideEarlyCheckoutUntilShortageWindow', v)
              }
              className="shrink-0"
            />
          </div>
        </div>
      </section>

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
