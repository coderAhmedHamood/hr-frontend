import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';

/** Outbox / delivery state — mirrors the backend `EmailMessageStatus` enum. */
export type EmailMessageStatus =
  | 'pending'
  | 'sending'
  | 'sent'
  | 'failed'
  | 'skipped'
  | 'cancelled';

export type EmailMessageResponseDto = {
  id: string;
  companyId: string;
  userId: string | null;
  userEmail: string | null;
  templateId: string | null;
  notificationId: string | null;
  eventCode: string | null;
  toEmail: string;
  subject: string;
  status: EmailMessageStatus;
  skipReason: string | null;
  sentAt: string | null;
  failedAt: string | null;
  errorMessage: string | null;
  retryCount: number;
  sourceKind: string | null;
  triggeredByUserId: string | null;
  triggeredByName: string | null;
  createdAt: string;
};

export type EmailMessageListQuery = {
  companyId: string;
  page?: number;
  limit?: number;
  status?: EmailMessageStatus | '';
  eventCode?: string;
  /** Searches the recipient email and the subject (contains, case-insensitive). */
  q?: string;
  dateFrom?: string;
  dateTo?: string;
};

export type SendDirectEmailDto = {
  companyId: string;
  userIds: string[];
  subject: string;
  bodyHtml?: string;
  bodyText?: string;
};

export type SendDirectEmailResultStatus =
  | 'sent'
  | 'failed'
  | 'skipped'
  | 'no_email'
  | 'not_in_company'
  | 'not_found';

export type SendDirectEmailResultItem = {
  userId: string;
  email: string | null;
  status: SendDirectEmailResultStatus;
  detail: string | null;
};

export type SendDirectEmailResponse = {
  results: SendDirectEmailResultItem[];
  sentCount: number;
  failedCount: number;
  skippedCount: number;
};

export const emailMessagesApi = {
  list(query: EmailMessageListQuery) {
    return apiRequest<PaginatedResult<EmailMessageResponseDto>>('/system/email/messages', {
      query,
    });
  },
  resend(id: string) {
    return apiRequest<EmailMessageResponseDto>(`/system/email/messages/${id}/send`, {
      method: 'POST',
    });
  },
  sendDirect(dto: SendDirectEmailDto) {
    return apiRequest<SendDirectEmailResponse>('/system/email/send-direct', {
      method: 'POST',
      body: dto,
    });
  },
};
