export type CircularAudienceTypeDto =
  | 'all_employees'
  | 'specific_employees'
  | 'departments'
  | 'branches';

export type DisciplineCircularResponseDto = {
  id: string;
  companyId: string;
  titleAr: string | null;
  bodyAr: string;
  issueDate: string;
  audienceType: CircularAudienceTypeDto;
  audienceTargetIds: string[] | null;
  sendOnSave: boolean;
  sentAt: string | null;
  recipientCount: number;
  sentCount: number;
  readCount: number;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type CreateDisciplineCircularDto = {
  companyId: string;
  titleAr?: string | null;
  bodyAr: string;
  issueDate: string;
  audienceType: CircularAudienceTypeDto;
  audienceTargetIds?: string[];
  sendOnSave?: boolean;
  createdBy?: string | null;
};

export type UpdateDisciplineCircularDto = {
  titleAr?: string | null;
  bodyAr?: string;
  issueDate?: string;
  updatedBy?: string | null;
};

export type DisciplineCircularListQuery = {
  page?: number;
  limit?: number;
  companyId?: string;
  sent?: boolean;
  q?: string;
  employeeIds?: string[];
  audience?: CircularAudienceTypeDto;
  dateFrom?: string;
  dateTo?: string;
};

export type DisciplineCircularRecipientListQuery = {
  page?: number;
  limit?: number;
  sent?: boolean;
  read?: boolean;
  unread?: boolean;
};

export type DisciplineCircularRecipientResponseDto = {
  id: string;
  circularId: string;
  employeeId: string;
  sentAt: string | null;
  deliveredAt: string | null;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
};
