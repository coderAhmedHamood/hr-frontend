import type { HRDepartmentEntity } from './types';
import type { HREmployeeDirectoryRow } from './employee-directory-store';

// ─── Department tree helpers ──────────────────────────────────────────────────

export interface DeptTreeNode {
  dept: HRDepartmentEntity;
  depth: number;
  children: DeptTreeNode[];
}

export function buildDepartmentForest(depts: HRDepartmentEntity[]): DeptTreeNode[] {
  const map = new Map<string, DeptTreeNode>();
  depts.forEach(d => map.set(d.id, { dept: d, depth: 0, children: [] }));
  const roots: DeptTreeNode[] = [];
  depts.forEach(d => {
    const node = map.get(d.id)!;
    if (!d.parentId || !map.has(d.parentId)) {
      roots.push(node);
    } else {
      map.get(d.parentId)!.children.push(node);
    }
  });
  function setDepth(nodes: DeptTreeNode[], depth: number) {
    nodes.forEach(n => { n.depth = depth; setDepth(n.children, depth + 1); });
  }
  setDepth(roots, 0);
  return roots;
}

export function flattenDepartmentsTree(forest: DeptTreeNode[]): DeptTreeNode[] {
  const result: DeptTreeNode[] = [];
  function walk(nodes: DeptTreeNode[]) {
    nodes.forEach(n => { result.push(n); walk(n.children); });
  }
  walk(forest);
  return result;
}

export function getDescendantDepartmentIds(depts: HRDepartmentEntity[], id: string): string[] {
  const children = depts.filter(d => d.parentId === id).map(d => d.id);
  return [...children, ...children.flatMap(cid => getDescendantDepartmentIds(depts, cid))];
}

export function departmentDepth(depts: HRDepartmentEntity[], id: string): number {
  const dept = depts.find(d => d.id === id);
  if (!dept || !dept.parentId) return 0;
  return 1 + departmentDepth(depts, dept.parentId);
}

// ─── Employee tree helpers ────────────────────────────────────────────────────

export interface EmpTreeNode {
  emp: HREmployeeDirectoryRow;
  children: EmpTreeNode[];
  expanded: boolean;
}

export function buildEmployeeForest(employees: HREmployeeDirectoryRow[]): EmpTreeNode[] {
  const map = new Map<string, EmpTreeNode>();
  employees.forEach(e => map.set(e.id, { emp: e, children: [], expanded: true }));
  const roots: EmpTreeNode[] = [];
  employees.forEach(e => {
    const node = map.get(e.id)!;
    if (!e.reportsToId || !map.has(e.reportsToId)) {
      roots.push(node);
    } else {
      map.get(e.reportsToId)!.children.push(node);
    }
  });
  return roots;
}

// ─── Labels ───────────────────────────────────────────────────────────────────

export const HIERARCHY_ROLE_LABELS: Record<string, string> = {
  ceo: 'الرئيس التنفيذي', executive: 'تنفيذي', gm: 'مدير عام',
  dept_head: 'رئيس قسم', supervisor: 'مشرف', staff: 'موظف',
};

export const STATUS_LABELS: Record<string, string> = {
  active: 'نشط', probation: 'تحت التجربة', suspended: 'موقوف',
};

export const STATUS_COLORS: Record<string, string> = {
  active: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  probation: 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400',
  suspended: 'border-border bg-muted text-muted-foreground',
};
