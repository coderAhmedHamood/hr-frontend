import { Toaster } from 'sonner';
import { PublicCareersShell } from '@/features/hr/recruitment/shared/public-careers-client';

export default function PublicApplyLayout({ children }: { children: React.ReactNode }) {
  return (
    <PublicCareersShell>
      {children}
      <Toaster richColors position="top-right" dir="rtl" closeButton />
    </PublicCareersShell>
  );
}
