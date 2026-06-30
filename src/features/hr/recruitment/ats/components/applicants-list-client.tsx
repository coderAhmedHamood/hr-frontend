'use client';

import { useAtsApplicantsListModel } from '@/features/hr/recruitment/ats/hooks/useAtsApplicantsListModel';
import { ApplicantsListViews } from '@/features/hr/recruitment/ats/components/applicants-list-views';

export function ApplicantsListClient() {
  const model = useAtsApplicantsListModel();
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ApplicantsListViews model={model} />
    </div>
  );
}
