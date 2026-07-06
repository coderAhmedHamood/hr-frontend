'use client';

import { Building2, Users, ChevronDown, ChevronLeft, Network } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import type { OrganizationTreeNode } from '@/features/system/organization/chart/types/organization-tree';
import { getInitials, cn } from '@/shared/utils';

export function OrganizationTreeNode({
  node,
  expanded,
  onToggle,
  level,
}: {
  node: OrganizationTreeNode;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  level: number;
}) {
  const isOpen = expanded.has(node.id);
  const hasChildren = node.children && node.children.length > 0;

  const containerStyle = {
    borderColor: node.color ? `${node.color}40` : undefined,
    background: level > 0 ? `${node.color}08` : undefined,
  };

  return (
    <div className="relative" style={{ marginRight: level > 0 ? '2rem' : 0 }}>
      <div
        role={hasChildren ? 'button' : undefined}
        tabIndex={hasChildren ? 0 : undefined}
        onClick={() => hasChildren && onToggle(node.id)}
        onKeyDown={(e) => {
          if (!hasChildren) return;
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onToggle(node.id);
          }
        }}
        className={cn(
          'group relative inline-flex min-w-[280px] items-center gap-3 rounded-lg border bg-card p-3 shadow-soft transition-all hover:shadow-elevated',
          level === 0 && 'border-gold/40 bg-gradient-to-l from-primary to-primary-700 text-primary-foreground shadow-elevated',
          hasChildren && 'cursor-pointer select-none',
        )}
        style={level > 0 ? containerStyle : undefined}
      >
        {node.type === 'employee' ? (
          <Avatar className="h-10 w-10 shrink-0">
            <AvatarImage src={node.avatar} />
            <AvatarFallback>{getInitials(node.name)}</AvatarFallback>
          </Avatar>
        ) : (
          <div
            className={cn(
              'flex h-10 w-10 shrink-0 items-center justify-center rounded-md',
              level === 0 ? 'bg-gold/20 text-gold' : 'bg-primary/10 text-primary',
            )}
            style={level > 0 && node.color ? { background: `${node.color}20`, color: node.color } : undefined}
          >
            {node.type === 'company' ? (
              <Building2 className="h-5 w-5" />
            ) : node.type === 'branch' ? (
              <Network className="h-5 w-5" />
            ) : (
              <Users className="h-5 w-5" />
            )}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className={cn('truncate text-sm font-semibold', level === 0 && 'text-primary-foreground')}>
            {node.name}
          </p>
          <p className={cn('truncate text-xs', level === 0 ? 'text-primary-foreground/70' : 'text-muted-foreground')}>
            {node.meta}
          </p>
        </div>
        {hasChildren && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onToggle(node.id);
            }}
            className={cn(
              'flex h-7 w-7 shrink-0 items-center justify-center rounded-md transition-colors',
              level === 0
                ? 'bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20'
                : 'hover:bg-muted',
            )}
            aria-label={isOpen ? 'طي' : 'توسيع'}
          >
            {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
          </button>
        )}
      </div>

      {hasChildren && isOpen && (
        <div className="relative mr-6 mt-3 space-y-3 border-r-2 border-dashed border-border pr-4">
          {node.children!.map((child) => (
            <OrganizationTreeNode
              key={child.id}
              node={child}
              expanded={expanded}
              onToggle={onToggle}
              level={level + 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}
