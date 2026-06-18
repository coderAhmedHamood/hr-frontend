'use client';

import { useSetPageTitle } from '@/components/layouts/page-title-context';
import { OrganizationTreeNode } from '@/features/hr/organization/chart/components/organization-tree-node';
import { EmptyState } from '@/features/hr/requests/components/shared-ui';
import { useOrganizationTreeModel } from '@/features/hr/organization/chart/hooks/useOrganizationTreeModel';

export default function OrganizationChartPage() {
  useSetPageTitle({ titleAr: 'خريطة المنظمة', descriptionAr: 'استكشف هيكل الشركة التفاعلي', iconName: 'Building2' });
  const { tree, expanded, toggle, loading, error } = useOrganizationTreeModel();

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative overflow-auto rounded-lg border border-border bg-card p-6 shadow-soft">
        <div className="absolute inset-0 dotted-bg opacity-30" />
        <div className="relative">
          {loading ? (
            <div className="py-12 text-center text-sm text-muted-foreground">جاري التحميل…</div>
          ) : error ? (
            <EmptyState title="تعذر تحميل الهيكل التنظيمي" description={error} />
          ) : (
            <OrganizationTreeNode node={tree} expanded={expanded} onToggle={toggle} level={0} />
          )}
        </div>
      </div>
    </div>
  );
}
