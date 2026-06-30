'use client';

import * as React from 'react';
import { CheckCircle2, Clock3, XCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TableRowActions } from '@/components/ui/table-cells';
import { getRequestApprovalUiState } from '@/features/hr/requests/lib/request-approver-states';
import type { ApproverStatesSnapshot } from '@/shared/approval/types';
import { cn } from '@/shared/utils';

export type ApprovalUiState = {
  showActions: boolean;
  canAct: boolean;
  reasonAr: string | null;
};

export type GetApprovalUiStateFn = (
  states: ApproverStatesSnapshot | null | undefined,
  employeeId: string | null | undefined,
) => ApprovalUiState;

function WaitingNote({ reason }: { reason: string }) {
  return (
    <p className="flex items-start gap-1 text-[10px] leading-snug text-muted-foreground">
      <Clock3 className="mt-0.5 h-3 w-3 shrink-0" />
      <span>{reason}</span>
    </p>
  );
}

/** Table cell: approve/reject when it is the user&apos;s turn; disabled + note when sequential wait applies. */
export function ApprovalActionCell({
  states,
  currentEmployeeId,
  onApprove,
  onReject,
  getUiState,
  fallback,
  className,
}: {
  states: ApproverStatesSnapshot | null | undefined;
  currentEmployeeId: string | null | undefined;
  onApprove: () => void;
  onReject: () => void;
  getUiState: GetApprovalUiStateFn;
  fallback?: React.ReactNode;
  className?: string;
}) {
  const ui = getUiState(states, currentEmployeeId);

  if (!ui.showActions) {
    return fallback ? <>{fallback}</> : <span className="text-xs text-muted-foreground">—</span>;
  }

  return (
    <div className={cn('min-w-[7rem] space-y-1', className)}>
      <TableRowActions
        primaryActions={[
          {
            label: 'موافقة',
            variant: 'success',
            icon: <CheckCircle2 className="h-3.5 w-3.5" />,
            disabled: !ui.canAct,
            onClick: () => { if (ui.canAct) onApprove(); },
          },
          {
            label: 'رفض',
            variant: 'destructive',
            icon: <XCircle className="h-3.5 w-3.5" />,
            disabled: !ui.canAct,
            onClick: () => { if (ui.canAct) onReject(); },
          },
        ]}
        menuItems={[]}
      />
      {!ui.canAct && ui.reasonAr ? <WaitingNote reason={ui.reasonAr} /> : null}
    </div>
  );
}

/** Inline approve/reject buttons for cards and dialogs. */
export function ApprovalActionButtons({
  states,
  currentEmployeeId,
  onApprove,
  onReject,
  getUiState,
  compact = false,
  className,
}: {
  states: ApproverStatesSnapshot | null | undefined;
  currentEmployeeId: string | null | undefined;
  onApprove: () => void;
  onReject: () => void;
  getUiState: GetApprovalUiStateFn;
  compact?: boolean;
  className?: string;
}) {
  const ui = getUiState(states, currentEmployeeId);
  if (!ui.showActions) return null;

  const btnClass = compact ? 'h-7 flex-1 text-xs' : 'flex-1 gap-1.5 text-xs';

  return (
    <div className={cn('space-y-1.5', className)} onClick={(e) => e.stopPropagation()}>
      <div className="flex gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!ui.canAct}
          className={cn(btnClass, 'text-success border-success/30 hover:bg-success/10')}
          onClick={() => { if (ui.canAct) onApprove(); }}
        >
          <CheckCircle2 className="h-3.5 w-3.5 me-1" />
          موافقة
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!ui.canAct}
          className={cn(btnClass, 'text-destructive border-destructive/30 hover:bg-destructive/10')}
          onClick={() => { if (ui.canAct) onReject(); }}
        >
          <XCircle className="h-3.5 w-3.5 me-1" />
          رفض
        </Button>
      </div>
      {!ui.canAct && ui.reasonAr ? <WaitingNote reason={ui.reasonAr} /> : null}
    </div>
  );
}

export function RequestApprovalActionCell(
  props: Omit<React.ComponentProps<typeof ApprovalActionCell>, 'getUiState'>,
) {
  return <ApprovalActionCell {...props} getUiState={getRequestApprovalUiState} />;
}

export function RequestApprovalActionButtons(
  props: Omit<React.ComponentProps<typeof ApprovalActionButtons>, 'getUiState'>,
) {
  return <ApprovalActionButtons {...props} getUiState={getRequestApprovalUiState} />;
}
