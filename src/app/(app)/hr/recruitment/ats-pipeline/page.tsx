import { Suspense } from 'react';
import { PipelineBoardClient } from '@/features/hr/recruitment/ats/components/pipeline-board-client';

export default function AtsPipelinePage() {
  return (
    <Suspense fallback={null}>
      <PipelineBoardClient />
    </Suspense>
  );
}
