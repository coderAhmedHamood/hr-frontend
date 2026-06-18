'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutGrid, Link2, MapPin, CalendarRange, ClipboardList } from 'lucide-react';
import { cn } from '@/shared/utils';
import { isAttendanceSection, type AttendanceSection } from '@/features/hr/attendance/lib/types';

const SECTIONS: { id: AttendanceSection; label: string; icon: React.ElementType }[] = [
  { id: 'daily', label: 'الحضور اليومي', icon: CalendarRange },
  { id: 'templates', label: 'قوالب الشفت', icon: LayoutGrid },
  { id: 'assignment', label: 'ربط الشيفتات بالموظفين', icon: ClipboardList },
  { id: 'checkpoints', label: 'نقاط التسجيل', icon: MapPin },
  { id: 'checkpoint-links', label: 'ربط النقاط', icon: Link2 },
];

export function AttendanceSectionNav() {
  const pathname = usePathname();
  const segment = pathname.split('/').filter(Boolean).pop() ?? '';
  const current: AttendanceSection = isAttendanceSection(segment) ? segment : 'daily';

  return (
    <nav className="flex flex-wrap gap-2" aria-label="أقسام الحضور">
      {SECTIONS.map(({ id, label, icon: Icon }) => {
        const active = current === id;
        return (
          <Link
            key={id}
            href={`/hr/attendance/${id}`}
            scroll={false}
            className={cn(
              'inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-all',
              active
                ? 'border-primary bg-primary text-primary-foreground shadow-soft'
                : 'border-border bg-background text-muted-foreground hover:border-primary/40 hover:bg-accent/60 hover:text-foreground',
            )}
          >
            <Icon className="h-4 w-4 shrink-0 opacity-90" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
