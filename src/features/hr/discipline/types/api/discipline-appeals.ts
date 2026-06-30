export type AppealChannelDto = 'in_person' | 'written' | 'email' | 'phone' | 'system';

export type AppealStatusDto = 'pending' | 'under_review' | 'accepted' | 'rejected' | 'withdrawn';

export type DisciplineAppealResponseDto = {
  id: string;
  companyId: string;
  violationRecordId: string;
  linkedViolationRecordNumber: string;
  subjectEmployeeId: string;
  appealDate: string;
  groundsAr: string;
  status: AppealStatusDto;
  channel: AppealChannelDto | null;
  responseNote: string | null;
  decidedAt: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type CreateDisciplineAppealDto = {
  companyId: string;
  violationRecordId?: string;
  linkedViolationRecordNumber?: string;
  appealDate: string;
  groundsAr: string;
  channel?: AppealChannelDto;
  status?: AppealStatusDto;
  createdBy?: string | null;
};

export type UpdateDisciplineAppealDto = {
  appealDate?: string;
  groundsAr?: string;
  channel?: AppealChannelDto | null;
  responseNote?: string | null;
  updatedBy?: string | null;
};

export type ProcessDisciplineAppealDecisionDto = {
  status: Exclude<AppealStatusDto, 'pending'>;
  responseNote?: string | null;
  decidedBy?: string | null;
};

export type DisciplineAppealListQuery = {
  page?: number;
  limit?: number;
  companyId?: string;
  violationRecordId?: string;
  subjectEmployeeId?: string;
  status?: AppealStatusDto;
};
