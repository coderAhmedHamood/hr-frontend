import * as React from 'react';
import { ChevronDown, Layers } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/shared/utils';
import {
  permissionActionBadgeVariant,
  permissionActionLabel,
} from '@/features/hr/permissions/constants/permission-actions';
import {
  collectResourceBlocks,
  countActionsInNode,
  type PermissionTreeNode,
} from '@/features/hr/permissions/utils/permission-tree';

type Props = {
  node: PermissionTreeNode;
  expanded: boolean;
  onToggle: () => void;
};

export function PermissionsCatalogModuleCard({ node, expanded, onToggle }: Props) {
  const blocks = React.useMemo(() => collectResourceBlocks(node), [node]);
  const actionCount = countActionsInNode(node);

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={expanded}
        className="flex w-full items-center gap-3 px-4 py-3.5 text-start transition-colors hover:bg-muted/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/30"
      >
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          <Layers className="h-5 w-5" />
        </div>

        <div className="min-w-0 flex-1">
          <h2 className="font-display text-sm font-semibold">{node.nameAr}</h2>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {actionCount} صلاحية · {blocks.length} مورد
          </p>
        </div>

        <div className="flex shrink-0 items-center gap-2">
          <ChevronDown
            className={cn(
              'h-4 w-4 text-muted-foreground transition-transform duration-200',
              expanded && 'rotate-180',
            )}
          />
        </div>
      </button>

      {expanded ? (
        <div className="border-t border-border bg-muted/5 px-4 py-4">
          {blocks.length === 0 ? (
            <p className="text-center text-sm text-muted-foreground">لا توجد صلاحيات في هذا القسم</p>
          ) : (
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
              {blocks.map((block) => (
                <article
                  key={block.id}
                  className="rounded-lg border border-border/70 bg-background p-3 shadow-soft"
                >
                  <div className="mb-2.5">
                    <h3 className="text-sm font-medium">{block.title}</h3>
                    {block.resource ? (
                      <p className="mt-0.5 text-[11px] text-muted-foreground">{block.resource}</p>
                    ) : null}
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {block.actions.map((action) => (
                      <Badge
                        key={action.id}
                        variant={permissionActionBadgeVariant(action.action)}
                        className="text-[10px] font-normal"
                        title={`${permissionActionLabel(action.action)} · ${action.code}`}
                      >
                        {action.nameAr}
                      </Badge>
                    ))}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      ) : null}
    </section>
  );
}
