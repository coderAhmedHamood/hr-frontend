'use client';

import { toast } from 'sonner';
import { Card, CardContent } from '@/components/ui/card';
import { useActiveCompany } from '@/features/hr/organization/hooks/useActiveCompany';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { HR_NOTIFICATION_GROUPS } from '@/features/hr/settings/constants/notification-groups';
import { NotificationTogglesCard } from '@/features/hr/settings/components/notification-toggles-card';
import { SettingsNav } from '@/features/hr/settings/components/settings-nav';
import { useHrCompanySettings } from '@/features/hr/settings/hooks/useHrSettings';
import type { HrNotificationKey } from '@/features/hr/settings/constants/notification-groups';
import type { HrCompanySettings } from '@/features/hr/settings/lib/api/types';

export function HrSettingsClient() {
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
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-muted-foreground">
          لا توجد شركة افتراضية — سجّل الدخول أو اختر شركة.
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return <div className="py-12 text-center text-sm text-muted-foreground">جاري التحميل…</div>;
  }

  if (isError || !settings) {
    const { displayMessage } = handleApiError(error, 'settings.hr.get');
    return (
      <Card>
        <CardContent className="py-12 text-center text-sm text-destructive">{displayMessage}</CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <SettingsNav />

      <div className="rounded-xl border border-border/60 bg-muted/20 px-4 py-3 text-sm">
        <p className="font-medium">{company?.nameAr ?? 'الشركة الحالية'}</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          إعدادات إشعارات الموارد البشرية لهذه الشركة — التغيير يُطبَّق مباشرة.
        </p>
      </div>

      <NotificationTogglesCard
        title="إشعارات الموارد البشرية"
        description="تحكم في الإشعارات المرسلة لأحداث HR (انضباط، رواتب، حضور، طلبات، عقود)."
        groups={HR_NOTIFICATION_GROUPS}
        values={settings as Pick<HrCompanySettings, HrNotificationKey>}
        disabled={update.isPending}
        masterDisabled={!settings.notificationsEnabled}
        onToggle={(key, value) => void handleToggle(key, value)}
      />
    </div>
  );
}
