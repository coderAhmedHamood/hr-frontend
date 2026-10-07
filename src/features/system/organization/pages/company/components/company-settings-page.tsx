'use client';

import { useSetPageTitle } from '@/components/layouts/page-title-context';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { PrintTemplatesSettings } from '@/features/print-templates/components/print-templates-settings';
import { SettingsPageEmpty } from '@/features/system/organization/pages/_shared/components/settings-page-states';
import { CompanySettingsTab } from '@/features/system/organization/pages/hr/components/company-settings-tab';

export default function CompanySettingsPage() {
  useSetPageTitle({
    titleAr: 'إعدادات الشركة',
    descriptionAr: 'الهوية، الألوان، البيانات الأساسية، وقوالب الطباعة',
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
    <Tabs defaultValue="basic" className="space-y-4 sm:space-y-5">
      <TabsList>
        <TabsTrigger value="basic">البيانات الأساسية</TabsTrigger>
        <TabsTrigger value="print">قوالب الطباعة</TabsTrigger>
      </TabsList>
      <TabsContent value="basic">
        <CompanySettingsTab />
      </TabsContent>
      <TabsContent value="print">
        <PrintTemplatesSettings />
      </TabsContent>
    </Tabs>
  );
}
