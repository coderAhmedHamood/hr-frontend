'use client';

import { AccountingWorkspaceListViews } from '@/features/accounting/workspaces/components/accounting-workspace-list-views';
import type { AccountingWorkspaceConfig } from '@/features/accounting/workspaces/constants/accounting-workspaces';
import { AccountingWorkspaceDetailDialog } from '@/features/accounting/workspaces/dialogs/accounting-workspace-detail-dialog';
import { useAccountingWorkspaceModel } from '@/features/accounting/workspaces/hooks/useAccountingWorkspaceModel';

export function AccountingWorkspacePage({ config }: { config: AccountingWorkspaceConfig }) {
  const model = useAccountingWorkspaceModel(config);

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <AccountingWorkspaceListViews model={model} />
      <AccountingWorkspaceDetailDialog
        row={model.selectedRow}
        model={model}
        onOpenChange={(open) => {
          if (!open) model.setSelectedRow(null);
        }}
      />
    </div>
  );
}
