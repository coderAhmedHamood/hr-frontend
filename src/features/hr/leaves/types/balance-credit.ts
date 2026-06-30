export interface LeaveBalanceCreditRequest {
  id: string;
  employeeId: string;
  employeeNameAr: string;
  leaveTypeId: string;
  leaveTypeNameAr: string;
  daysAdded: number;
  reasonAr: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  decidedAt?: string;
}

export type BalanceCreditEmployeeOption = {
  id: string;
  name: string;
  branchId?: string;
  departmentId?: string;
};

export type BalanceCreditFilterOption = {
  value: string;
  label: string;
};
