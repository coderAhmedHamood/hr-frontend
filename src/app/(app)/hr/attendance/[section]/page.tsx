import { notFound } from 'next/navigation';
import {
  ATTENDANCE_SECTION_SLUGS,
  isAttendanceSection,
  type AttendanceSection,
} from '@/features/hr/attendance/lib/types';
import AttendancePage from '@/features/hr/attendance/components/attendance-page';

export function generateStaticParams() {
  return ATTENDANCE_SECTION_SLUGS.map((section) => ({ section }));
}

export default async function HRAttendanceSectionPage({
  params,
}: {
  params: Promise<{ section: string }>;
}) {
  const { section } = await params;
  if (!isAttendanceSection(section)) notFound();
  return <AttendancePage section={section as AttendanceSection} />;
}
