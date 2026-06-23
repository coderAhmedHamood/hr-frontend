import type { Metadata } from 'next';
import { Toaster } from 'sonner';
import { PublicCareersShell } from '@/features/hr/recruitment/shared/public-careers-client';

export const metadata: Metadata = {
  title: 'الوظائف المتاحة | روز',
  description: 'تصفح الوظائف النشطة وتقدم على المناسب لك',
};

export default function CareersLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <PublicCareersShell>{children}</PublicCareersShell>
      <Toaster richColors position="top-right" dir="rtl" closeButton />
    </>
  );
}
