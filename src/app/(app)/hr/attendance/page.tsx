import { redirect } from 'next/navigation';
import { isAttendanceSection } from '@/features/hr/attendance/lib/types';

/** يحوّل الروابط القديمة `?section=` إلى المسار الجديد، ثم الافتراضي «daily». */
export default async function HRAttendanceIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ section?: string | string[] }>;
}) {
  const sp = await searchParams;
  const raw = sp.section;
  const q = Array.isArray(raw) ? raw[0] : raw;
  if (q && isAttendanceSection(q)) {
    redirect(`/hr/attendance/${q}`);
  }
  redirect('/hr/attendance/daily');
}
