'use client';

import * as React from 'react';
import { useSetPageTitle } from '@/components/layouts/page-title-context';
import { ShiftTemplatesPanel } from '@/features/hr/attendance/templates/components/shift-templates-panel';
import { AssignmentsPanel } from '@/features/hr/attendance/assignment/components/assignments-panel';
import { DailyAttendancePanel } from '@/features/hr/attendance/daily/components/daily-attendance-panel';
import { CheckpointsPanel } from '@/features/hr/attendance/checkpoints/components/checkpoints-panel';
import { CheckpointLinksPanel } from '@/features/hr/attendance/checkpoint-links/components/checkpoint-links-panel';
import { AttendanceEventsPanel } from '@/features/hr/attendance/events/components/attendance-events-panel';
import type { AttendanceSection } from '@/features/hr/attendance/lib/types';

const SECTION_COPY: Record<AttendanceSection, { title: string; desc: string }> = {
  templates: { title: 'قوالب الشفت', desc: 'تعريف الجداول الأسبوعية والفترات والنوافذ.' },
  assignment: { title: 'ربط الشيفتات بالموظفين', desc: 'ربط الشيفتات بالموظفين أو الأقسام أو الفروع.' },
  daily: { title: 'الحضور اليومي', desc: 'متابعة السجلات ضمن نطاق زمني.' },
  checkpoints: { title: 'نقاط التسجيل', desc: 'إدارة المواقع الجغرافية المعتمدة للتسجيل.' },
  'checkpoint-links': { title: 'ربط النقاط بالموظفين  ', desc: 'ربط الموظفين بنقاط محددة' },
  events:             { title: 'الأحداث', desc: 'سجلات الحضور والانصراف والاستراحات.' },
};

export default function AttendancePage({ section }: { section: AttendanceSection }) {
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  const copy = SECTION_COPY[section];
  useSetPageTitle({ titleAr: 'إدارة الحضور', descriptionAr: copy.desc, iconName: 'Clock' });

  if (!mounted) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-24 rounded-lg bg-muted/40" />
        <div className="h-12 rounded-full bg-muted/30" />
        <div className="h-96 rounded-lg bg-muted/30" />
      </div>
    );
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col animate-fade-in">
      {section === 'templates' && <ShiftTemplatesPanel />}
      {section === 'assignment' && <AssignmentsPanel />}
      {section === 'daily' && <DailyAttendancePanel />}
      {section === 'checkpoints' && <CheckpointsPanel />}
      {section === 'checkpoint-links' && <CheckpointLinksPanel />}
      {section === 'events' && <AttendanceEventsPanel />}
    </div>
  );
}
