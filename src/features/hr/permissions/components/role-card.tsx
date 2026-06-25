import * as React from 'react';
import { Shield, Trash2 } from 'lucide-react';
import {
  permissionRoleCssColor,
  permissionRoleSurface,
  coercePermissionRoleColorToken,
} from '@/features/hr/permissions/constants/role-colors';
import type { RoleResponseDto } from '@/features/hr/permissions/lib/api/roles';

type Props = {
  role: RoleResponseDto;
  grantedCount: number;
  onEdit: (role: RoleResponseDto) => void;
  onDelete: (role: RoleResponseDto) => void;
};

export function RoleCard({ role, grantedCount, onEdit, onDelete }: Props) {
  const colorToken = coercePermissionRoleColorToken('primary');
  const accent = permissionRoleCssColor(colorToken);
  const accentSoft = permissionRoleSurface(colorToken, 0.1);
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
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg transition-colors group-hover:scale-[1.02]"
          style={{ background: accentSoft, color: accent }}
        >
          <Shield className="h-4 w-4" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-display text-sm font-semibold">{displayName}</h3>
            {role.isSystem ? (
              <span className="rounded bg-muted px-1.5 py-0.5 text-[9px] font-medium text-muted-foreground">
                نظامي
              </span>
            ) : null}
          </div>
          {role.description ? (
            <p className="mt-0.5 text-[11px] leading-relaxed text-muted-foreground">{role.description}</p>
          ) : null}
          {grantedCount > 0 ? (
            <p className="mt-1 text-[10px] font-medium" style={{ color: accent }}>
              {grantedCount} صلاحية مفعّلة
            </p>
          ) : null}
        </div>
      </button>

      <button
        type="button"
        aria-label={role.isSystem ? `لا يمكن حذف ${displayName}` : `حذف ${displayName}`}
        title={role.isSystem ? 'لا يمكن حذف الأدوار النظامية' : undefined}
        disabled={role.isSystem}
        onClick={handleDeleteClick}
        className="absolute end-2 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-lg border border-border/80 bg-background text-muted-foreground shadow-soft transition-colors hover:border-destructive/50 hover:bg-destructive/10 hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-destructive/40 disabled:cursor-not-allowed disabled:border-border/50 disabled:bg-muted/30 disabled:text-muted-foreground/50 disabled:hover:border-border/50 disabled:hover:bg-muted/30 disabled:hover:text-muted-foreground/50"
      >
        <Trash2 className="pointer-events-none h-4 w-4 shrink-0" />
      </button>
    </div>
  );
}
