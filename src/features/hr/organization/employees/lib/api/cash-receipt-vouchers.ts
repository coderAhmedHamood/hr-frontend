import {
  apiDownloadRequest,
  apiDownloadToDevice,
  apiRequest,
  type PaginatedResult,
} from '@/features/hr/lib/api/client';

export type CashReceiptVoucherStatus = 'draft' | 'issued' | 'revoked';

export type CashReceiptEmployeeSignatureStatus = 'none' | 'pending' | 'signed';

export type CashReceiptSignatureMethod = 'drawn' | 'upload';

/** Delivery mode after third payroll review / payroll notification. */
export type PayrollNotifyDeliveryMode = 'notify_only' | 'pdf_sign' | 'both';

/** Matches backend `CashReceiptPurpose` enum. */
export type CashReceiptVoucherPurpose =
  | 'salary'
  | 'transport_allowance'
  | 'overtime'
  | 'inventory_shortage'
  | 'cash_withdrawal'
  | 'other';

export const CASH_RECEIPT_VOUCHER_PURPOSE_LABELS: Record<CashReceiptVoucherPurpose, string> = {
  salary: 'راتب شهر',
  transport_allowance: 'بدل مواصلات شهر',
  overtime: 'بدل إضافي',
  inventory_shortage: 'بدل تحمل عجز مخزون شهر',
  cash_withdrawal: 'سحب نقدي يخصم من الراتب',
  other: 'أخرى',
};

/** Purposes that require month + year on the form and API. */
export const CASH_RECEIPT_PURPOSES_NEEDING_PERIOD: ReadonlySet<CashReceiptVoucherPurpose> = new Set([
  'salary',
  'transport_allowance',
  'overtime',
  'inventory_shortage',
  'cash_withdrawal',
]);

export type CashReceiptVoucherDto = {
  id: string;
  companyId: string;
  employeeId: string;
  recipientNameAr: string | null;
  institutionNameAr: string | null;
  branchNameAr: string | null;
  issuedByEmployeeId: string | null;
  issuedByEmployeeNameAr: string | null;
  payrollPeriodId: string | null;
  voucherNumber: string;
  amount: string | number;
  amountInWords: string | null;
  purpose: CashReceiptVoucherPurpose | string;
  purposeMonth: number | null;
  purposeYear: number | null;
  overtimeDays: number | null;
  otherDescription: string | null;
  signatureName: string | null;
  receiptDate: string;
  branchManagerSignatureName: string | null;
  hrAffairsSignatureName: string | null;
  generalSupervisorSignatureName: string | null;
  financialManagerSignatureName: string | null;
  status: CashReceiptVoucherStatus | string;
  employeeSignatureStatus: CashReceiptEmployeeSignatureStatus | string;
  signatureMethod: CashReceiptSignatureMethod | string | null;
  signedAttachmentId: string | null;
  signatureImageUrl: string | null;
  employeeSignedAt: string | null;
  notes: string | null;
  attachments: unknown[] | null;
  issuedAt: string | null;
  revokedAt: string | null;
  revokedReason: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy: string | null;
  updatedBy: string | null;
};

export type CreateCashReceiptVoucherDto = {
  companyId: string;
  employeeId: string;
  issuedByEmployeeId?: string | null;
  voucherNumber: string;
  receiptDate: string;
  amount: number;
  amountInWords: string;
  purpose: CashReceiptVoucherPurpose | string;
  purposeMonth?: number | null;
  purposeYear?: number | null;
  overtimeDays?: number | null;
  otherDescription?: string | null;
  branchNameAr?: string | null;
  institutionNameAr?: string | null;
  signatureName?: string | null;
  branchManagerSignatureName?: string | null;
  hrAffairsSignatureName?: string | null;
  generalSupervisorSignatureName?: string | null;
  financialManagerSignatureName?: string | null;
  notes?: string | null;
  attachments?: unknown[] | null;
  createdBy?: string | null;
};

export type CashReceiptVoucherListParams = {
  page?: number;
  limit?: number;
  companyId?: string;
  employeeId?: string;
  issuedByEmployeeId?: string;
  payrollPeriodId?: string;
  status?: string;
  employeeSignatureStatus?: string;
  purpose?: string;
  voucherNumber?: string;
  receiptDateFrom?: string;
  receiptDateTo?: string;
};

export type BulkIssueCashReceiptsForPayrollDto = {
  companyId: string;
  payrollPeriodId: string;
  employeeIds?: string[];
  createdBy?: string | null;
};

export type BulkIssueCashReceiptsResult = {
  created: number;
  skipped: number;
  items: CashReceiptVoucherDto[];
};

export type EmployeeSignCashReceiptDto = {
  employeeId: string;
  method: CashReceiptSignatureMethod;
  signedAttachmentId?: string;
  signatureImageUrl?: string;
  updatedBy?: string | null;
};

export const cashReceiptVouchersApi = {
  getAll(query?: CashReceiptVoucherListParams) {
    return apiRequest<PaginatedResult<CashReceiptVoucherDto>>('/hr/cash-receipt-vouchers', {
      query,
    });
  },

  getById(id: string) {
    return apiRequest<CashReceiptVoucherDto>(`/hr/cash-receipt-vouchers/${id}`);
  },

  create(payload: CreateCashReceiptVoucherDto) {
    return apiRequest<CashReceiptVoucherDto>('/hr/cash-receipt-vouchers', {
      method: 'POST',
      body: payload,
    });
  },

  bulkIssueForPayroll(payload: BulkIssueCashReceiptsForPayrollDto) {
    return apiRequest<BulkIssueCashReceiptsResult>(
      '/hr/cash-receipt-vouchers/bulk-issue-for-payroll',
      { method: 'POST', body: payload },
    );
  },

  getPendingForEmployee(
    employeeId: string,
    query?: { companyId?: string; payrollPeriodId?: string },
  ) {
    return apiRequest<CashReceiptVoucherDto[]>(
      `/hr/cash-receipt-vouchers/employee/${employeeId}/pending-signature`,
      { query },
    );
  },

  employeeSign(id: string, payload: EmployeeSignCashReceiptDto) {
    return apiRequest<CashReceiptVoucherDto>(
      `/hr/cash-receipt-vouchers/${id}/employee-sign`,
      { method: 'POST', body: payload },
    );
  },

  /** Official PDF generated on-demand from backend snapshot (binary). */
  getPdf(id: string) {
    return apiDownloadRequest(`/hr/cash-receipt-vouchers/${id}/pdf`, {
      defaultFileName: `cash-receipt-${id}.pdf`,
    });
  },

  downloadPdf(id: string, fileName?: string) {
    return apiDownloadToDevice(`/hr/cash-receipt-vouchers/${id}/pdf`, {
      defaultFileName: fileName ?? `cash-receipt-${id}.pdf`,
    });
  },

  sendToEmployee(
    id: string,
    payload?: { issuedByEmployeeId?: string; updatedBy?: string | null },
  ) {
    return apiRequest<CashReceiptVoucherDto>(
      `/hr/cash-receipt-vouchers/${id}/send-to-employee`,
      { method: 'POST', body: payload ?? {} },
    );
  },
};
