'use client';

import { useSetPageTitle } from '@/components/layouts/page-title-context';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { SettingsPageEmpty } from '@/features/system/organization/pages/_shared/components/settings-page-states';
import { CompanySettingsTab } from '@/features/system/organization/pages/hr/components/company-settings-tab';

export default function CompanySettingsPage() {
  useSetPageTitle({
    titleAr: 'إعدادات الشركة',
    descriptionAr: 'الهوية، الألوان، والبيانات الأساسية للشركة',
    iconName: 'Landmark',
  });
  const companyId = useDefaultCompanyId();

  if (!companyId) {
    return (
      <div className="space-y-4 sm:space-y-5">
        <SettingsPageEmpty message="لا توجد شركة افتراضية — سجّل الدخول أو اختر شركة." />
      </div>
    );
  }

  return (
    <div className="space-y-4 sm:space-y-5">
      <CompanySettingsTab />
    </div>
  );
}
