'use client';

import * as React from 'react';
import { Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { MultiSelect, type MultiSelectOption } from '@/components/ui/multi-select';
import type { UserRolesPermissionsModel } from '@/components/shared/permissions/use-user-roles-permissions-model';
import { cn } from '@/shared/utils';

type Props = {
  model: Pick<
    UserRolesPermissionsModel,
    | 'allRoles'
    | 'assignedRoles'
    | 'assignedRoleIds'
    | 'rolesAssignLoading'
    | 'isSyncingRoles'
    | 'handleAssignedRolesChange'
    | 'hasLinkedUser'
    | 'rolePermissions'
    | 'extraAllowPermissions'
    | 'overlayMap'
  >;
  disabled?: boolean;
  rolesSelectId?: string;
  compact?: boolean;
  hideSummary?: boolean;
  summaryClassName?: string;
};

export function RolesAssignmentEditor({
  model,
  disabled = false,
  rolesSelectId = 'user-roles-add',
  compact = false,
  hideSummary = false,
  summaryClassName,
}: Props) {
  const canEdit = model.hasLinkedUser && !disabled;
  const deniedCount = [...model.overlayMap.values()].filter((o) => o.effect === 'DENY').length;

  const roleOptions = React.useMemo(
    (): MultiSelectOption[] =>
      model.allRoles.map((role) => ({
        value: role.id,
        label: role.nameAr,
        subtitle: role.description ?? undefined,
      })),
    [model.allRoles],
  );

  return (
    <div className={cn('grid gap-4', !hideSummary && !compact && 'lg:grid-cols-2')}>
      <div className="space-y-3">
        <MultiSelect
          id={rolesSelectId}
          label="الأدوار المعيّنة"
          options={roleOptions}
          value={model.assignedRoleIds}
          onChange={model.handleAssignedRolesChange}
          deferCommit
          applyLabel="حفظ الأدوار"
          placeholder={model.rolesAssignLoading ? 'جاري تحميل الأدوار…' : 'اختر الأدوار…'}
          searchPlaceholder="بحث في الأدوار…"
          emptyMessage="لا توجد أدوار"
          selectAllLabel="تحديد الكل"
          deselectAllLabel="إلغاء الكل"
          listMaxHeight="min(280px,45vh)"
          disabled={!canEdit || model.rolesAssignLoading || model.isSyncingRoles}
          triggerClassName="h-10 rounded-xl bg-background"
        />

        {model.isSyncingRoles ? (
          <p className="text-xs text-muted-foreground">جاري حفظ الأدوار…</p>
        ) : (
          <p className="text-xs text-muted-foreground">اختر الأدوار ثم اضغط «حفظ الأدوار» لتطبيق التغييرات.</p>
        )}

        {model.assignedRoles.length > 0 ? (
          <div className="flex flex-wrap gap-1.5">
            {model.assignedRoles.map((role) => (
              <Badge key={role.assignmentId} variant="secondary" className="text-[11px] font-normal">
                {role.nameAr}
              </Badge>
            ))}
          </div>
        ) : canEdit ? (
          <p className="text-xs text-muted-foreground">لم يُعيَّن أي دور بعد.</p>
        ) : null}
      </div>

      {!hideSummary ? (
        <div className={cn('rounded-xl border border-border/70 bg-muted/20 p-4', summaryClassName)}>
          <p className="mb-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">ملخص</p>
          <div className="space-y-2 text-sm">
            <p className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" />
              <span>
                {model.assignedRoles.length > 0
                  ? `${model.assignedRoles.length} ${model.assignedRoles.length === 1 ? 'دور' : 'أدوار'}`
                  : 'لا أدوار'}
              </span>
            </p>
            <p>
              {model.rolePermissions.length > 0
                ? `${model.rolePermissions.length} صلاحية من الأدوار`
                : 'لا صلاحيات من الأدوار'}
              {model.extraAllowPermissions.length > 0 ? (
                <span className="text-success">
                  {' '}
                  + {model.extraAllowPermissions.length} إضافية
                </span>
              ) : null}
            </p>
            {deniedCount > 0 ? (
              <p className="text-xs text-amber-600 dark:text-amber-400">{deniedCount} صلاحية محجوبة</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
