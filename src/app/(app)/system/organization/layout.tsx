'use client';

import * as React from 'react';
import { usePathname } from 'next/navigation';
import { SetPageTitle } from '@/components/layouts/set-page-title';

const PAGES_SECTION_PATH = /^\/system\/organization\/pages(?:\/|$)/;

export default function SystemOrganizationModuleLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isPagesSection = PAGES_SECTION_PATH.test(pathname ?? '');

  if (isPagesSection) {
    return <div className="flex min-h-0 flex-1 flex-col">{children}</div>;
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-6 animate-fade-in">
      <SetPageTitle
        titleAr="إدارة المنظمة"
        descriptionAr="جهات الاتصال، المسميات، الفروع، الأقسام، الشركات، والهيكل التنظيمي"
        iconName="Building2"
      />
      {children}
    </div>
  );
}
