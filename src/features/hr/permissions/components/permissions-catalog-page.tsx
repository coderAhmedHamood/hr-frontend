'use client';

import * as React from 'react';
import { ChevronDown, ChevronLeft, FolderTree, Loader2 } from 'lucide-react';
import { useSetPageTitle } from '@/components/layouts/page-title-context';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/shared/utils';
import { usePermissions } from '@/features/hr/permissions/hooks/usePermissions';
import { useApplicationId } from '@/features/hr/permissions/hooks/useApplicationId';
import type { PermissionResponseDto } from '@/features/hr/permissions/lib/api/permissions';
import {
  buildPermissionTree,
  type PermissionTreeNode,
} from '@/features/hr/permissions/utils/permission-tree';

const ACTION_AR: Record<string, string> = {
  read: 'عرض',
  create: 'إنشاء',
  update: 'تعديل',
  delete: 'حذف',
  approve: 'موافقة',
  export: 'تصدير',
};

function PermissionTreeRow({ node, depth = 0 }: { node: PermissionTreeNode; depth?: number }) {
  const [open, setOpen] = React.useState(depth < 2);
  const isGroup = node.nodeType === 'GROUP';
  const hasChildren = node.children.length > 0;

  return (
    <div className="select-none">
      <div
        className={cn(
          'flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors',
          isGroup ? 'font-medium text-foreground' : 'text-foreground/80 hover:bg-muted/40',
        )}
        style={{ paddingInlineStart: `${depth * 1.25 + 0.75}rem` }}
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

        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-2">
          <span className="truncate">{node.nameAr}</span>
          {node.nodeType === 'ACTION' && node.action && (
            <Badge variant="subtle" className="text-[10px]">
              {ACTION_AR[node.action] ?? node.action}
            </Badge>
          )}
          {node.resource && (
            <code className="text-[10px] text-muted-foreground">{node.resource}</code>
          )}
        </div>

        <code className="hidden shrink-0 text-[10px] text-muted-foreground sm:inline">{node.code}</code>
      </div>

      {open && hasChildren && (
        <div>
          {node.children.map((child) => (
            <PermissionTreeRow key={child.id} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function PermissionsCatalogPage() {
  useSetPageTitle({
    titleAr: 'الصلاحيات',
    descriptionAr: 'دليل صلاحيات نظام الموارد البشرية',
    iconName: 'Shield',
  });

  const { applicationId: appFromApi } = useApplicationId();
  const { data, isLoading, isError } = usePermissions(appFromApi);
  const permissions = data?.items ?? [];
  const actionCount = permissions.filter((p) => p.nodeType === 'ACTION').length;
  const tree = React.useMemo(() => buildPermissionTree(permissions), [permissions]);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="font-display text-2xl font-bold tracking-tight">الصلاحيات</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          قائمة صلاحيات التطبيق من الخادم — لربطها بالأدوار انتقل إلى{' '}
          <span className="font-medium text-foreground">الأدوار</span>
        </p>
      </div>

      {isError && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          تعذّر تحميل قائمة الصلاحيات. تأكد من تسجيل الدخول وأن الـ API يعمل.
        </div>
      )}

      <div className="rounded-xl border border-border bg-card shadow-soft">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border px-4 py-3">
          <div className="flex items-center gap-2 text-sm font-medium">
            <FolderTree className="h-4 w-4 text-primary" />
            شجرة الصلاحيات
          </div>
          <div className="flex items-center gap-3 text-xs text-muted-foreground">
            <span>
              <span className="number-ar font-semibold text-foreground">{actionCount}</span> صلاحية فعلية
            </span>
            <span>
              <span className="number-ar font-semibold text-foreground">{permissions.length}</span> عنصراً
            </span>
          </div>
        </div>

        {isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : permissions.length === 0 ? (
          <div className="flex h-32 items-center justify-center text-sm text-muted-foreground">
            لا توجد صلاحيات مسجّلة في النظام
          </div>
        ) : (
          <div className="max-h-[calc(100vh-16rem)] overflow-y-auto p-2">
            {tree.map((node) => (
              <PermissionTreeRow key={node.id} node={node} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
