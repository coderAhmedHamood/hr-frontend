import * as React from 'react';
import { redirect } from 'next/navigation';
import { PutawayRulesListPage } from '@/features/inventory/admin/putaway-rules/components/putaway-rules-list-page';
import { PUTAWAY_RULES_ENABLED } from '@/features/inventory/admin/putaway-rules/lib/putaway-feature';

export default function Page() {
  // Hidden while nothing applies the rules: a direct link goes back quietly.
  if (!PUTAWAY_RULES_ENABLED) redirect('/inventory');
  return (
    <React.Suspense fallback={null}>
      <PutawayRulesListPage />
    </React.Suspense>
  );
}
