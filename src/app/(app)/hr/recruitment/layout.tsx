import * as React from 'react';
import { SetPageTitle } from '@/components/layouts/set-page-title';
import { ClearRecruitmentLegacyStorage } from '@/features/hr/recruitment/components/clear-recruitment-legacy-storage';

export default function RecruitmentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <ClearRecruitmentLegacyStorage />
      <SetPageTitle titleAr="التوظيف" descriptionAr="إدارة الوظائف، المتقدمين، ومسار التوظيف" iconName="Users" />
      {children}
    </div>
  );
}
