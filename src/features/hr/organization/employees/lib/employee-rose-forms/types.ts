/** نماذج مؤسسة روز للتجارة — سجل لكل موظف مع دعم تعدد النسخ (عودة للعمل ثم فصل جديد، إلخ). */

export type RoseTradingFormTab = 'resignation' | 'clearance' | 'settlement' | 'experience';

export interface RoseResignationRecord {
  id: string;
  employeeId: string;
  documentDate: string;
  effectiveResignationDate: string;
  reasonAr: string;
  notesAr: string;
  approvedByAr: string;
  /** رقم مرجعي داخلي اختياري */
  referenceNo: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoseClearanceRecord {
  id: string;
  employeeId: string;
  documentDate: string;
  lastWorkingDay: string;
  financeClearAr: string;
  hrClearAr: string;
  itClearAr: string;
  adminClearAr: string;
  notesAr: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoseSettlementRecord {
  id: string;
  employeeId: string;
  documentDate: string;
  settlementPeriodAr: string;
  salaryAndRightsAr: string;
  deductionsAr: string;
  netAmountAr: string;
  declarationAr: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoseExperienceRecord {
  id: string;
  employeeId: string;
  documentDate: string;
  serviceFrom: string;
  serviceTo: string;
  jobTitleAr: string;
  dutiesSummaryAr: string;
  certificatePurposeAr: string;
  issuedToAr: string;
  createdAt: string;
  updatedAt: string;
}

export interface RoseEmployeeFormBucket {
  resignations: RoseResignationRecord[];
  clearances: RoseClearanceRecord[];
  settlements: RoseSettlementRecord[];
  experiences: RoseExperienceRecord[];
}

export const ROSE_TRADING_COMPANY_AR_DEFAULT = 'مؤسسة روز للتجارة';

export const ROSE_FORM_TAB_LABELS: Record<RoseTradingFormTab, string> = {
  resignation: 'نموذج استقالة',
  clearance: 'نموذج إخلاء طرف',
  settlement: 'مخالصة نهائية',
  experience: 'شهادة خبرة',
};
