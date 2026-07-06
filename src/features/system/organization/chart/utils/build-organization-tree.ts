import type { BranchResponseDto } from '@/features/hr/organization/lib/api/branches';
import type { CompanyResponseDto } from '@/features/hr/organization/lib/api/companies';
import type { DepartmentResponseDto } from '@/features/hr/organization/lib/api/departments';
import type { OrganizationTreeNode } from '@/features/system/organization/chart/types/organization-tree';

type BuildTreeInput = {
  companies: CompanyResponseDto[];
  branches: BranchResponseDto[];
  departments: DepartmentResponseDto[];
};

function buildDepartmentTree(departments: DepartmentResponseDto[]): OrganizationTreeNode[] {
  const map = new Map<string, OrganizationTreeNode>();
  departments.forEach((dept) => {
    map.set(dept.id, {
      id: dept.id,
      name: dept.nameAr,
      type: 'department',
      meta: '',
      children: [],
    });
  });

  const roots: OrganizationTreeNode[] = [];
  departments.forEach((dept) => {
    const node = map.get(dept.id)!;
    const parentId = dept.parentDepartmentId;
    if (parentId && map.has(parentId)) {
      map.get(parentId)!.children!.push(node);
    } else {
      roots.push(node);
    }
  });

  const sortNodes = (nodes: OrganizationTreeNode[]) => {
    nodes.sort((a, b) => a.name.localeCompare(b.name, 'ar'));
    nodes.forEach((child) => {
      if (child.children && child.children.length > 0) {
        sortNodes(child.children);
      }
    });
  };
  sortNodes(roots);
  return roots;
}

export function buildOrganizationTree({ companies, branches, departments }: BuildTreeInput): OrganizationTreeNode {
  if (companies.length === 0) {
    return { id: 'company', name: 'الشركة', type: 'company', meta: '', children: [] };
  }

  const buildCompanyNode = (company: CompanyResponseDto): OrganizationTreeNode => {
    const branchNodes = branches
      .filter((branch) => branch.companyId === company.id)
      .map((branch) => ({
        id: branch.id,
        name: branch.nameAr,
        type: 'branch' as const,
        meta: branch.city ?? '',
        children: buildDepartmentTree(departments.filter((dept) => dept.branchId === branch.id)),
      }));

    return {
      id: company.id,
      name: company.nameAr,
      type: 'company',
      meta: '',
      children: branchNodes,
    };
  };

  if (companies.length === 1) {
    return buildCompanyNode(companies[0]!);
  }

  return {
    id: 'companies-root',
    name: 'الشركات',
    type: 'company',
    meta: '',
    children: companies.map(buildCompanyNode),
  };
}
