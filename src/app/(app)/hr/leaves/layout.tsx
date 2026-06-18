import * as React from 'react';
import { SetPageTitle } from '@/components/layouts/set-page-title';

export default function LeavesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="space-y-6 animate-fade-in">
      <SetPageTitle titleAr="إجازات الموظفين" descriptionAr="إدارة طلبات الإجازات والعطل الرسمية والإعدادات" iconName="CalendarDays" />
      {children}
    </div>
  );
}
