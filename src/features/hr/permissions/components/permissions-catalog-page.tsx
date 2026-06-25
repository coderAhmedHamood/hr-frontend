'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  ChevronUp,
  KeyRound,
  Layers,
  Loader2,
  Search,
  Shield,
} from 'lucide-react';
import { useSetPageTitle } from '@/components/layouts/page-title-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { cn } from '@/shared/utils';
import { usePermissionsCatalog } from '@/features/hr/permissions/hooks/usePermissionsCatalog';
import { PermissionsCatalogModuleCard } from '@/features/hr/permissions/components/permissions-catalog-module-card';
import { HR_PERMISSIONS_ROLES } from '@/features/hr/permissions/constants/routes';
import {
  buildPermissionTree,
  filterPermissionTree,
} from '@/features/hr/permissions/utils/permission-tree';

function CatalogStat({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: number;
}) {
  return (
    <div className="flex items-center gap-3 rounded-xl border border-border bg-card px-4 py-3 shadow-soft">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-[11px] text-muted-foreground">{label}</p>
        <p className="number-ar font-display text-lg font-bold leading-tight">{value}</p>
      </div>
    </div>
  );
}

export function PermissionsCatalogPage() {
  useSetPageTitle({
    titleAr: 'الصلاحيات',
    descriptionAr: 'دليل صلاحيات نظام الموارد البشرية',
    iconName: 'Shield',
  });

  const { data, isLoading, isError } = usePermissionsCatalog();
  const permissions = data?.items ?? [];

  const tree = React.useMemo(() => buildPermissionTree(permissions), [permissions]);
  const [search, setSearch] = React.useState('');
  const filteredTree = React.useMemo(
    () => filterPermissionTree(tree, search),
    [tree, search],
  );

  const [expandedIds, setExpandedIds] = React.useState<Set<string>>(new Set());
  const hasInitializedExpanded = React.useRef(false);

  React.useEffect(() => {
    if (tree.length > 0 && !hasInitializedExpanded.current) {
      setExpandedIds(new Set(tree.map((node) => node.id)));
      hasInitializedExpanded.current = true;
    }
  }, [tree]);

  const actionCount = permissions.filter((p) => p.nodeType === 'ACTION').length;
  const groupCount = permissions.filter((p) => p.nodeType === 'GROUP').length;
  const moduleCount = tree.length;

  function toggleModule(id: string) {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function expandAll() {
    setExpandedIds(new Set(filteredTree.map((node) => node.id)));
  }

  function collapseAll() {
    setExpandedIds(new Set());
  }

  const allExpanded = filteredTree.length > 0 && filteredTree.every((node) => expandedIds.has(node.id));

  return (
    <div className="space-y-5 animate-fade-in">
      {isError ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          تعذّر تحميل قائمة الصلاحيات. تأكد من تسجيل الدخول وأن الـ API يعمل.
        </div>
      ) : null}

      <div className="w-full max-w-sm rounded-xl border border-border bg-card p-2.5 shadow-soft">
        <div className="relative">
          <Search className="pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="بحث بالاسم، المورد، أو نوع الصلاحية…"
            className="h-9 ps-8 text-sm"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="flex h-56 items-center justify-center rounded-xl border border-border bg-card shadow-soft">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : filteredTree.length === 0 ? (
        <div
          className={cn(
            'flex h-40 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border bg-card/50 text-sm text-muted-foreground',
          )}
        >
          <KeyRound className="h-8 w-8 opacity-40" />
          {search.trim() ? 'لا توجد نتائج مطابقة للبحث' : 'لا توجد صلاحيات مسجّلة في النظام'}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredTree.map((node) => (
            <PermissionsCatalogModuleCard
              key={node.id}
              node={node}
              expanded={expandedIds.has(node.id)}
              onToggle={() => toggleModule(node.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
