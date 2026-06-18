/** Legacy mock/list shapes for organization directory UIs (pre-API or display-only). */

export interface Branch {
  id: string;
  name: string;
  nameEn: string;
  city: string;
  employeesCount: number;
  manager: string;
}

export interface Department {
  id: string;
  name: string;
  branchId: string;
  managerId: string;
  employeesCount: number;
  color: string;
}
