import type { DepartmentResponseDto } from '@/features/hr/organization/lib/api/departments';
import type { HRDepartmentEntity } from '@/features/hr/requests/lib/types';
import { slugify } from '@/features/hr/requests/lib/types';

export type DepartmentDraftForm = {
  companyId: string;
  branchId: string;
  nameAr: string;
  parentId: string;
  sortOrder: number;
  isActive: boolean;
};

export type DepartmentRecord = HRDepartmentEntity & {
  companyId: string;
  branchId: string;
  code: string;
  description: string | null;
  managerEmployeeId: string | null;
  levelNo: number;
};

export const DEPARTMENT_EMPTY_FORM: DepartmentDraftForm = {
  companyId: '',
  branchId: '',
  nameAr: '',
  parentId: '',
  sortOrder: 1,
  isActive: true,
};

export function mapDepartmentResponse(dept: DepartmentResponseDto, index: number): DepartmentRecord {
  return {
    id: dept.id,
    parentId: dept.parentDepartmentId ?? undefined,
    nameAr: dept.nameAr,
    nameEn: dept.nameEn ?? '',
    slug: slugify(dept.nameAr),
    sortOrder: index + 1,
    isActive: dept.isActive,
    companyId: dept.companyId,
    branchId: dept.branchId,
    code: dept.code,
    description: dept.description,
    managerEmployeeId: dept.managerEmployeeId,
    levelNo: dept.levelNo,
  };
}
