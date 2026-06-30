'use client';

import { useAtsPipelineBoardModel } from '@/features/hr/recruitment/ats/hooks/useAtsPipelineBoardModel';
import { PipelineBoardViews } from '@/features/hr/recruitment/ats/components/pipeline-board-views';

export function PipelineBoardClient() {
  const model = useAtsPipelineBoardModel();
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <PipelineBoardViews model={model} />
    </div>
  );
}
