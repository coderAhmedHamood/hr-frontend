'use client';

import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { SettingsPageEmpty } from '@/features/hr/organization/pages/_shared/components/settings-page-states';
import { CompanySettingsTab } from '@/features/hr/organization/pages/hr/components/company-settings-tab';

export default function CompanySettingsPage() {
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
