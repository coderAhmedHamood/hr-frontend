export interface HRLeaveTypeRecord {
  id: string;
  code: string;
  nameAr: string;
  nameEn: string;
  paid: boolean;
  deductsFromBalance: boolean;
  requiresApproval: boolean;
  maxDaysPerRequest: number | null;
  sortOrder: number;
  isActive: boolean;
  updatedAt: string;
}
