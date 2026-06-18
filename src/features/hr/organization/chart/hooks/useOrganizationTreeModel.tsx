'use client';

import * as React from 'react';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import type { BranchResponseDto } from '@/features/hr/organization/lib/api/branches';
import type { CompanyResponseDto } from '@/features/hr/organization/lib/api/companies';
import type { DepartmentResponseDto } from '@/features/hr/organization/lib/api/departments';
import { buildOrganizationTree } from '@/features/hr/organization/chart/utils/build-organization-tree';
import { loadOrganizationChartData } from '@/features/hr/organization/chart/services/organization-chart.service';

export function useOrganizationTreeModel() {
  const [companies, setCompanies] = React.useState<CompanyResponseDto[]>([]);
  const [branches, setBranches] = React.useState<BranchResponseDto[]>([]);
  const [departments, setDepartments] = React.useState<DepartmentResponseDto[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const tree = React.useMemo(
    () => buildOrganizationTree({ companies, branches, departments }),
    [companies, branches, departments],
  );

  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    const next = new Set<string>();
    if (tree.id) next.add(tree.id);
    branches.forEach((b) => next.add(b.id));
    setExpanded(next);
  }, [branches, tree.id]);

  React.useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await loadOrganizationChartData();
        if (!active) return;
        setCompanies(data.companies);
        setBranches(data.branches);
        setDepartments(data.departments);
      } catch (err) {
        if (!active) return;
        const { displayMessage } = handleApiError(err, 'organization-chart.load');
        setError(displayMessage);
      } finally {
        if (active) setLoading(false);
      }
    };
    void load();
    return () => {
      active = false;
    };
  }, []);

  const toggle = React.useCallback((id: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  return { tree, expanded, toggle, loading, error };
}
