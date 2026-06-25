export interface HrCompanySettings {
  id: string;
  companyId: string;
  notificationsEnabled: boolean;
  notifyDisciplineViolationCreated: boolean;
  notifyDisciplineViolationApproved: boolean;
  notifyDisciplineCircularCreated: boolean;
  notifyDisciplineNoticeCreated: boolean;
  notifyDisciplineAppealCreated: boolean;
  notifyDisciplineInvestigationCreated: boolean;
  notifyDisciplineInvestigationCompleted: boolean;
  notifyDisciplineApprovalAssignmentCreated: boolean;
  notifyPayrollPeriodCreated: boolean;
  notifyPayrollPeriodClosed: boolean;
  notifyPayslipCreated: boolean;
  notifyPayslipPendingEmployeeAcceptance: boolean;
  notifyAttendanceCheckIn: boolean;
  notifyAttendanceCheckOut: boolean;
  notifyShiftAssignmentLinked: boolean;
  notifyCheckInPointLinked: boolean;
  notifyLeaveBalanceCredited: boolean;
  notifyLeaveRequestApproved: boolean;
  notifyAdvanceRequestApproved: boolean;
  notifyCorrectionRequestApproved: boolean;
  notifyRequestApprovalAssignmentCreated: boolean;
  notifyContractSentForApproval: boolean;
  notifyEmployeeAssignedToCompany: boolean;
  notifyEmployeeAssignedToBranch: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
  updatedBy?: string | null;
}

export type UpdateHrCompanySettingsDto = Partial<
  Omit<HrCompanySettings, 'id' | 'companyId' | 'createdAt' | 'updatedAt' | 'createdBy' | 'updatedBy'>
>;

export interface OrganizationCompanySettings {
  id: string;
  companyId: string;
  emailEnabled: boolean;
  smtpHost: string | null;
  smtpPort: number | null;
  smtpSecure: boolean;
  smtpUsername: string | null;
  smtpPasswordConfigured: boolean;
  smtpFromEmail: string | null;
  smtpFromName: string | null;
  notifyUserCreated: boolean;
  notifyUserAssignedToCompany: boolean;
  notifyUserAssignedToBranch: boolean;
  createdAt: string;
  updatedAt: string;
  createdBy?: string | null;
  updatedBy?: string | null;
  hrSettings?: HrCompanySettings;
}

export type UpdateOrganizationCompanySettingsDto = {
  emailEnabled?: boolean;
  smtpHost?: string | null;
  smtpPort?: number | null;
  smtpSecure?: boolean;
  smtpUsername?: string | null;
  smtpPassword?: string | null;
  smtpFromEmail?: string | null;
  smtpFromName?: string | null;
  notifyUserCreated?: boolean;
  notifyUserAssignedToCompany?: boolean;
  notifyUserAssignedToBranch?: boolean;
};
