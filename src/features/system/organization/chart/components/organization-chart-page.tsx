'use client';

import { useSetPageTitle } from '@/components/layouts/page-title-context';
import { OrganizationTreeNode } from '@/features/system/organization/chart/components/organization-tree-node';
import { EmptyState } from '@/components/ui/shared-dialogs';
import { useOrganizationTreeModel } from '@/features/system/organization/chart/hooks/useOrganizationTreeModel';

export default function OrganizationChartPage() {
  useSetPageTitle({ titleAr: 'خريطة المنظمة', descriptionAr: 'استكشف هيكل الشركة التفاعلي', iconName: 'Building2' });
  const { tree, expanded, toggle, loading, error } = useOrganizationTreeModel();

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="sys-chart-scroll relative overflow-auto rounded-lg border border-border bg-card p-4 shadow-soft sm:p-6">
        <div className="absolute inset-0 dotted-bg opacity-30" />
        <div className="relative min-w-0">
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
