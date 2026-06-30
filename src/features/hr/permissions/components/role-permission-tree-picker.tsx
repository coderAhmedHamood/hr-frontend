'use client';

import * as React from 'react';
import { Check, ChevronDown, ChevronLeft } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { cn } from '@/shared/utils';
import type { PermissionResponseDto } from '@/features/hr/permissions/lib/api/permissions';
import {
  buildPermissionTree,
  collectActionIdsFromNode,
  type PermissionTreeNode,
} from '@/features/hr/permissions/utils/permission-tree';

import {
  permissionActionLabel,
} from '@/features/hr/permissions/constants/permission-actions';

type RowProps = {
  node: PermissionTreeNode;
  depth?: number;
  selectedSet: Set<string>;
  onToggle: (ids: string[], grant: boolean) => void;
};

function PermissionPickerRow({
  node,
  depth = 0,
  selectedSet,
  onToggle,
}: RowProps) {
  const [open, setOpen] = React.useState(depth < 2);
  const isGroup = node.nodeType === 'GROUP';
  const hasChildren = node.children.length > 0;
  const actionIds = React.useMemo(() => collectActionIdsFromNode(node), [node]);

  const grantedCount = actionIds.filter((id) => selectedSet.has(id)).length;
  const allGranted = actionIds.length > 0 && grantedCount === actionIds.length;
  const someGranted = grantedCount > 0 && !allGranted;

  return (
    <div className="select-none">
      <div
        className={cn(
          'flex items-center gap-2 rounded-lg px-2 py-2 text-sm transition-colors',
          isGroup ? 'font-medium text-foreground' : 'text-foreground/90 hover:bg-muted/40',
          node.nodeType === 'ACTION' && selectedSet.has(node.id) && 'bg-primary/5',
        )}
        style={{ paddingInlineStart: `${depth * 1.1 + 0.5}rem` }}
      >
        {hasChildren ? (
          <button
            type="button"
            onClick={() => setOpen((v) => !v)}
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
            aria-label={open ? 'طي' : 'توسيع'}
          >
            {open ? <ChevronDown className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
        ) : (
          <span className="inline-block h-6 w-6 shrink-0" />
        )}

        {node.nodeType === 'ACTION' ? (
          <button
            type="button"
            onClick={() => onToggle([node.id], !selectedSet.has(node.id))}
            className={cn(
              'flex h-5 w-5 shrink-0 items-center justify-center rounded-md border-2 transition-all',
              selectedSet.has(node.id)
                ? 'border-primary bg-primary'
                : 'border-border/60 bg-background hover:border-primary/50',
            )}
            aria-label={node.nameAr}
          >
            {selectedSet.has(node.id) && (
              <Check className="h-3 w-3 text-primary-foreground" />
            )}
          </button>
        ) : (
          <Switch
            checked={allGranted}
            onCheckedChange={(checked) => onToggle(actionIds, checked)}
            disabled={actionIds.length === 0}
            className={cn('origin-center shrink-0 scale-75', someGranted && 'opacity-80')}
          />
        )}

        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <span className="truncate">{node.nameAr}</span>
          {node.nodeType === 'ACTION' && node.action && (
            <Badge variant="subtle" className="text-[10px]">
              {permissionActionLabel(node.action)}
            </Badge>
          )}
          {node.resource && (
            <code className="text-[10px] text-muted-foreground">{node.resource}</code>
          )}
        </div>

        {isGroup && actionIds.length > 0 && (
          <span className="shrink-0 text-[10px] text-muted-foreground number-ar">
            {grantedCount}/{actionIds.length}
          </span>
        )}
      </div>

      {open && hasChildren && (
        <div>
          {node.children.map((child) => (
            <PermissionPickerRow
              key={child.id}
              node={child}
              depth={depth + 1}
              selectedSet={selectedSet}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}

type Props = {
  permissions: PermissionResponseDto[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
};

export function RolePermissionTreePicker({
  permissions,
  selectedIds,
  onChange,
}: Props) {
  const tree = React.useMemo(() => buildPermissionTree(permissions), [permissions]);
  const selectedSet = React.useMemo(() => new Set(selectedIds), [selectedIds]);
  const allActionIds = React.useMemo(
    () => permissions.filter((p) => p.nodeType === 'ACTION').map((p) => p.id),
    [permissions],
  );
  const isAllSelected = allActionIds.length > 0 && allActionIds.every((id) => selectedSet.has(id));

  function toggleIds(ids: string[], grant: boolean) {
    const next = new Set(selectedIds);
    for (const id of ids) {
      if (grant) next.add(id);
      else next.delete(id);
    }
    onChange([...next]);
  }

  function toggleAll() {
    onChange(isAllSelected ? [] : allActionIds);
  }

  if (permissions.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center rounded-xl border border-dashed border-border text-sm text-muted-foreground">
        لا توجد صلاحيات
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">
          <span className="number-ar font-semibold text-foreground">{allActionIds.length}</span> صلاحية
        </span>
        <div className="flex items-center gap-2.5">
          <span className="text-xs text-muted-foreground">تفعيل الكل</span>
          <Switch checked={isAllSelected} onCheckedChange={toggleAll} />
        </div>
      </div>

      <div className="max-h-[min(52vh,28rem)] overflow-y-auto rounded-xl border border-border p-2">
        {tree.map((node) => (
          <PermissionPickerRow
            key={node.id}
            node={node}
            selectedSet={selectedSet}
            onToggle={toggleIds}
          />
        ))}
      </div>
    </div>
  );
}
