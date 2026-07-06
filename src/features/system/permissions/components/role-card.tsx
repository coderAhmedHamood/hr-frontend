import * as React from 'react';
import { Shield, Trash2 } from 'lucide-react';
import { cn } from '@/shared/utils';
import {
  permissionRoleIconClasses,
  coercePermissionRoleColorToken,
} from '@/features/system/permissions/constants/role-colors';
import type { RoleResponseDto } from '@/features/system/permissions/lib/api/roles';

type Props = {
  role: RoleResponseDto;
  grantedCount: number;
  onEdit: (role: RoleResponseDto) => void;
  onDelete: (role: RoleResponseDto) => void;
};

export function RoleCard({ role, grantedCount, onEdit, onDelete }: Props) {
  const colorToken = coercePermissionRoleColorToken('primary');
  const iconClasses = permissionRoleIconClasses(colorToken);
  const displayName = role.nameAr ?? role.name ?? '—';

  function handleDeleteClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.preventDefault();
    event.stopPropagation();
    if (!role.isSystem) {
      onDelete(role);
    }
  }

  return (
    <div className="group relative rounded-lg border border-border bg-card shadow-soft transition-all hover:border-primary/25 hover:shadow-md">
      <button
        type="button"
        onClick={() => onEdit(role)}
        className="flex w-full items-center gap-3 p-3 pe-11 text-start transition-colors hover:bg-primary/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-primary/40"
      >
        <div
          className={cn(
            'flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors group-hover:scale-[1.02]',
            iconClasses.bg,
            iconClasses.text,
          )}
        >
          <Shield className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-sm font-semibold">{displayName}</h3>
        
          </div>
          {role.description ? (
            <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{role.description}</p>
          ) : null}
          {grantedCount > 0 ? (
            <p className={cn('mt-1 text-[10px] font-medium', iconClasses.text)}>
              {grantedCount} صلاحية مفعّلة
            </p>
          ) : null}
        </div>
      </button>

      {!role.isSystem ? (
        <button
          type="button"
          aria-label={`حذف ${displayName}`}
          onClick={handleDeleteClick}
          className="absolute end-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg border border-border/80 bg-background text-muted-foreground shadow-soft transition-colors hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40"
        >
          <Trash2 className="pointer-events-none h-4 w-4 shrink-0" />
        </button>
      ) : null}
    </div>
  );
}
