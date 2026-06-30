export type HREmployeeStatus = 'active' | 'probation' | 'suspended';

export type HREmployeeHierarchyRole = 'ceo' | 'executive' | 'gm' | 'dept_head' | 'supervisor' | 'staff';

export interface HREmployeeDirectoryRow {
  id: string;
  bridgeId: string;
  nameAr: string;
  nameEn: string;
  nationalId: string;
  departmentId: string;
  jobTitleAr: string;
  jobTitleEn: string;
  hireDate: string;
  status: HREmployeeStatus;
  email?: string;
  mobile?: string;
  notes?: string;
  reportsToId: string | null;
  hierarchyRole: HREmployeeHierarchyRole;
}

export type HREmployeeDirectoryEntry = HREmployeeDirectoryRow;
