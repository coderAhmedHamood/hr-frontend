import { Suspense } from 'react';
import { WhatsappPage } from '@/features/ecommerce/admin/cms/whatsapp/components/whatsapp-page';

export default function Page() {
  return (
    <Suspense fallback={<div className="h-64 animate-pulse rounded-2xl bg-muted/40" />}>
      <WhatsappPage />
    </Suspense>
  );
}
