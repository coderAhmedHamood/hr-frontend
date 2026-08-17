'use client';

import * as React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import type { RoleResponseDto } from '@/features/system/permissions/lib/api/roles';
import type { SystemOwnerCompanyApplication } from '@/features/system-owner/lib/api/system-owner';

type Props = {
  roles: RoleResponseDto[];
  applications?: SystemOwnerCompanyApplication[];
  selectedIds: string[];
  onChange: (next: string[]) => void;
  isLoading?: boolean;
  emptyHint?: string;
};

function appLabel(
  role: RoleResponseDto,
  applications: SystemOwnerCompanyApplication[] | undefined,
) {
  if (!role.applicationId) return 'عام';
  const match = applications?.find(
    (app) => app.applicationId === role.applicationId || app.id === role.applicationId,
  );
  return match?.nameAr || 'تطبيق';
}

export function CompanyUserRolePicker({
  roles,
  applications,
  selectedIds,
  onChange,
  isLoading,
  emptyHint = 'لا توجد أدوار لهذه الشركة بعد.',
}: Props) {
  const selected = React.useMemo(() => new Set(selectedIds), [selectedIds]);

  const groups = React.useMemo(() => {
    const map = new Map<string, { label: string; roles: RoleResponseDto[] }>();
    for (const role of roles) {
      const key = role.applicationId ?? 'general';
      const current = map.get(key);
      if (current) {
        current.roles.push(role);
        continue;
      }
      map.set(key, { label: appLabel(role, applications), roles: [role] });
    }
    return [...map.values()];
  }, [roles, applications]);

  function toggle(roleId: string, checked: boolean) {
    if (checked) {
      onChange([...selectedIds, roleId]);
      return;
    }
    onChange(selectedIds.filter((id) => id !== roleId));
  }

  if (isLoading) {
    return <p className="text-xs text-muted-foreground">جاري تحميل الأدوار…</p>;
  }

  if (roles.length === 0) {
    return <p className="text-xs text-muted-foreground">{emptyHint}</p>;
  }

  return (
    <div className="so-user-role-list space-y-3 rounded-xl border border-border p-2">
      {groups.map((group) => (
        <div key={group.label} className="space-y-1">
          <p className="px-1 text-[11px] font-medium text-muted-foreground">{group.label}</p>
          {group.roles.map((role) => {
            const checked = selected.has(role.id);
            return (
              <label
                key={role.id}
                className="flex cursor-pointer items-start gap-2 rounded-lg px-2 py-1.5 hover:bg-muted/50"
              >
                <Checkbox
                  checked={checked}
                  onCheckedChange={(value) => toggle(role.id, value === true)}
                  className="mt-0.5"
                />
                <span className="min-w-0">
                  <span className="block text-sm leading-snug">{role.nameAr || role.code}</span>
                  {role.description ? (
                    <span className="block text-[11px] text-muted-foreground">{role.description}</span>
                  ) : null}
                </span>
              </label>
            );
          })}
        </div>
      ))}
    </div>
  );
}
