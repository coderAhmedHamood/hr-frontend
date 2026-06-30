'use client';

import * as React from 'react';
import Link from 'next/link';
import {
  ChevronDown,
  ChevronUp,
  KeyRound,
  Loader2,
  Plus,
  Search,
} from 'lucide-react';
import { useSetPageTitle } from '@/components/layouts/page-title-context';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { useEntityFilterSlot } from '@/components/layouts/entity-filter-slot-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ListFilterBar } from '@/components/ui/list-filter-bar';
import { cn } from '@/shared/utils';
import { usePermissionsCatalog } from '@/features/hr/permissions/hooks/usePermissionsCatalog';
import { PermissionsCatalogModuleCard } from '@/features/hr/permissions/components/permissions-catalog-module-card';
import { HR_PERMISSIONS_ROLES } from '@/features/hr/permissions/constants/routes';
import {
  buildPermissionTree,
  filterPermissionTree,
} from '@/features/hr/permissions/utils/permission-tree';

export function PermissionsCatalogPage() {
  useSetPageTitle({
    titleAr: 'الصلاحيات',
    descriptionAr: 'دليل صلاحيات النظام — جميع التطبيقات',
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

  usePageHeaderActions(
    () => (
      <Button
        variant="luxe"
        size="sm"
        className="h-8 gap-1.5 px-3 text-xs shadow-sm shrink-0"
        asChild
      >
        <Link href={HR_PERMISSIONS_ROLES}>
          <Plus className="h-3.5 w-3.5" />
          إضافة دور
        </Link>
      </Button>
    ),
    [],
  );

  const searchFilter = (
    <div className="relative w-full min-w-[12rem] max-w-sm">
      <Search className="pointer-events-none absolute start-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="بحث بالاسم، المورد، أو نوع الصلاحية…"
        className="h-8 ps-8 text-xs"
      />
    </div>
  );

  useEntityFilterSlot(
    () => (
      <ListFilterBar
        showDateSection={false}
        showStatusSection={false}
        leadingFilters={searchFilter}
        onDateBoundsChange={() => {}}
      />
    ),
    [search],
  );

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
    <div className="flex min-h-0 flex-1 flex-col gap-4 animate-fade-in">
      {isError ? (
        <div className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm text-destructive">
          تعذّر تحميل قائمة الصلاحيات. تأكد من تسجيل الدخول وأن الـ API يعمل.
        </div>
      ) : null}

      {!isLoading && filteredTree.length > 0 ? (
        <div className="flex flex-wrap items-center justify-end gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-7 gap-1 px-2.5 text-[11px]"
            onClick={allExpanded ? collapseAll : expandAll}
          >
            {allExpanded ? (
              <>
                <ChevronUp className="h-3.5 w-3.5" />
                طي الكل
              </>
            ) : (
              <>
                <ChevronDown className="h-3.5 w-3.5" />
                توسيع الكل
              </>
            )}
          </Button>
        </div>
      ) : null}

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
