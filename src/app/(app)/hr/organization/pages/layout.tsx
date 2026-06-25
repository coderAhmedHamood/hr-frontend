import * as React from 'react';
import { SetPageTitle } from '@/components/layouts/set-page-title';

export default function OrganizationPagesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <SetPageTitle titleAr="الإعدادات" descriptionAr="إعدادات الموارد البشرية والنظام" iconName="Settings" />
      {children}
    </div>
  );
}
