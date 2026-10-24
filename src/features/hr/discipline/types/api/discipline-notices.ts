export type DisciplineNoticeResponseDto = {
  id: string;
  companyId: string;
  employeeId: string;
  employeeNameAr: string;
  noticeKind: string;
  reasonAr: string;
  noticeDate: string;
  violationRecordId: string | null;
  linkedViolationRecordNumber: string | null;
  attachmentsNote: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type CreateDisciplineNoticeDto = {
  companyId: string;
  employeeId: string;
  noticeKind: string;
  reasonAr: string;
  noticeDate: string;
  violationRecordId?: string | null;
  linkedViolationRecordNumber?: string | null;
  attachmentsNote?: string | null;
  createdBy?: string | null;
};

export type DisciplineNoticeListQuery = {
  /** Employee status filter (empty status = active); absent = every status. */
  employeeStatus?: 'active' | 'suspended' | 'ended';
  page?: number;
  limit?: number;
  companyId?: string;
  employeeId?: string;
  employeeIds?: string[];
  violationRecordId?: string;
  noticeKind?: string;
  noticeKinds?: string[];
  dateFrom?: string;
  dateTo?: string;
};
