import * as React from 'react';
import { SetPageTitle } from '@/components/layouts/set-page-title';

export default function RecruitmentLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <SetPageTitle titleAr="التوظيف" descriptionAr="إدارة نماذج التوظيف والمتقدمين" iconName="Users" />
      {children}
    </div>
  );
}
