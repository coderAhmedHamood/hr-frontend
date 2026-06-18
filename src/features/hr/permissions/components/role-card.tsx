import * as React from 'react';
import { Shield, Edit2, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  permissionRoleCssColor,
  permissionRoleSurface,
  coercePermissionRoleColorToken,
} from '@/features/hr/permissions/constants/role-colors';
import type { RoleResponseDto } from '@/features/hr/permissions/lib/api/roles';

type Props = {
  role: RoleResponseDto;
  grantedCount: number;
  totalCount: number;
  onEdit: (role: RoleResponseDto) => void;
  onDelete: (role: RoleResponseDto) => void;
};

export function RoleCard({ role, grantedCount, totalCount, onEdit, onDelete }: Props) {
  const colorToken = coercePermissionRoleColorToken('primary');
  const accent = permissionRoleCssColor(colorToken);
  const accentSoft = permissionRoleSurface(colorToken, 0.08);
  const accentIconBg = permissionRoleSurface(colorToken, 0.12);

  const pct = totalCount > 0 ? Math.round((grantedCount / totalCount) * 100) : 0;
  const displayName = role.nameAr ?? role.name ?? '—';

  return (
    <div
      className="group relative overflow-hidden rounded-xl border border-border bg-card shadow-soft transition-shadow hover:shadow-md"
      style={{ borderTop: `3px solid ${accent}` }}
    >
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity group-hover:opacity-100"
        style={{ background: `linear-gradient(135deg, ${accentSoft} 0%, transparent 55%)` }}
      />
      <div className="relative p-5">
        <div className="flex items-start justify-between">
          <div
            className="flex h-11 w-11 items-center justify-center rounded-xl"
            style={{ background: accentIconBg, color: accent }}
          >
            <Shield className="h-5 w-5" />
          </div>
          {role.isSystem && (
            <Badge variant="subtle" className="text-[10px]">نظامي</Badge>
          )}
        </div>

        <h3 className="mt-3 font-display text-base font-bold">{displayName}</h3>
        <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
          {role.description ?? '—'}
        </p>

        <div className="mt-4">
          <div className="mb-1.5 flex items-center justify-between text-xs text-muted-foreground">
            <span>الصلاحيات المفعّلة</span>
            <span className="font-semibold" style={{ color: accent }}>
              {grantedCount > 0 ? `${pct}%` : '—'}
            </span>
          </div>
          <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${pct}%`, background: accent }}
            />
          </div>
        </div>

        <div className="mt-4 border-t border-border pt-3">
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1 gap-1.5 text-xs"
              onClick={() => onEdit(role)}
            >
              <Edit2 className="h-3 w-3" /> تعديل الصلاحيات
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="border-destructive/30 text-destructive hover:bg-destructive/10"
              onClick={() => onDelete(role)}
              disabled={role.isSystem}
            >
              <Trash2 className="h-3 w-3" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
