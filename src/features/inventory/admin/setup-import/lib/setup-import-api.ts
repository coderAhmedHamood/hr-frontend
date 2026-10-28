import { apiDownloadToDevice, apiFormRequest, apiRequest } from '@/shared/api/client';

/**
 * The inventory setup import (`/inventory/setup/company/:companyId`): one
 * file holds warehouses, locations, units, categories, products and the
 * opening balance. A file is uploaded and checked (nothing saved), its
 * columns and unknown values decided, then saved in one transaction — or
 * cancelled later while none of its documents is posted. Types mirror
 * `inventory-setup.service.ts` and `engine/import.types.ts`.
 */
export type SetupEntityKey = 'warehouses' | 'locations' | 'uoms' | 'categories' | 'products' | 'opening';

export type SetupBatchStatus = 'invalid' | 'validated' | 'committing' | 'committed' | 'failed' | 'cancelled';

export type SetupIssue = {
  level: 'error' | 'warning';
  code: string;
  sheet: string;
  row: number | null;
  column: string | null;
  field: string | null;
  value: string | null;
  expected: string | null;
  message: string;
  fix: string | null;
};

export type SetupIssueGroup = {
  level: 'error' | 'warning';
  code: string;
  message: string;
  fix: string | null;
  count: number;
  samples: string[];
};

export type SetupColumnReport = {
  index: number;
  letter: string;
  header: string;
  field: string | null;
  confidence: number;
  matchedBy: 'name' | 'similar' | 'content' | 'user' | null;
  suggestion: { field: string; confidence: number } | null;
  samples: string[];
};

export type SetupSheetReport = {
  name: string;
  entity: SetupEntityKey | null;
  headerRow: number | null;
  rowCount: number;
  skippedRows: number;
  columns: SetupColumnReport[];
  missingRequired: string[];
  ignoredColumns: string[];
};

/** A value of a reference column (unit, category, warehouse…) the system does not know. */
export type SetupUnresolvedValue = {
  entity: 'uoms' | 'categories' | 'warehouses' | 'locations' | 'branches';
  value: string;
  rows: number;
  suggestion: { code: string; nameAr: string } | null;
};

export type SetupValueDecision =
  | { action: 'map'; code: string }
  | { action: 'create'; nameAr?: string; factor?: number }
  | { action: 'error' };

export type SetupOpeningWarehouse = {
  warehouseCode: string;
  warehouseNameAr: string;
  lines: number;
  totalQuantity: number;
  totalValue: number | null;
  existingOpenings: string[];
};

export type SetupSummary = {
  rows: number;
  errorRows: number;
  errors: number;
  warnings: number;
  entities: Partial<Record<SetupEntityKey, { create: number; update: number; unchanged: number }>>;
  productUomLines: number;
  opening: SetupOpeningWarehouse[];
  issueGroups: SetupIssueGroup[];
  unresolvedValues: SetupUnresolvedValue[];
  valuationCurrency: string;
  costingActive: boolean;
};

export type SetupImportOptions = {
  entity?: SetupEntityKey;
  /** Column → field per sheet name (header text); null ignores the column. */
  mapping?: Record<string, Record<string, string | null>>;
  /** Per reference entity, per value as written in the file. */
  valueMapping?: Partial<Record<SetupUnresolvedValue['entity'], Record<string, SetupValueDecision>>>;
  /** Warehouse for opening rows of a sheet without a warehouse column. */
  warehouseCode?: string;
  mergeDuplicates?: boolean;
  dateFormat?: 'DMY' | 'MDY';
};

export type SetupBatch = {
  id: string;
  status: SetupBatchStatus;
  fileName: string;
  options: SetupImportOptions;
  sheets: SetupSheetReport[] | null;
  summary: SetupSummary | null;
  errorCount: number;
  warningCount: number;
  issues: SetupIssue[];
  issuesTotal: number;
  result: {
    operationIds: string[];
    operationReferences: string[];
    created: Partial<Record<SetupEntityKey, string[]>>;
    kept?: string[];
  } | null;
  progress: { stage: 'validating' | 'saving'; done: number; total: number } | null;
  failureMessage: string | null;
  createdAt: string;
  committedAt: string | null;
  cancelledAt: string | null;
};

export type SetupBatchListItem = {
  id: string;
  status: SetupBatchStatus;
  fileName: string;
  rows: number;
  errorCount: number;
  warningCount: number;
  entities: SetupSummary['entities'];
  operationReferences: string[];
  createdAt: string;
  committedAt: string | null;
  cancelledAt: string | null;
};

export type SetupSchemaField = { key: string; labelAr: string; required: boolean; requiredWhen?: string; helpAr: string };
export type SetupSchemaEntity = { key: SetupEntityKey; labelAr: string; order: number; fields: SetupSchemaField[] };

const base = (companyId: string) => `/inventory/setup/company/${companyId}`;

export const setupImportApi = {
  schema(companyId: string) {
    return apiRequest<{ version: number; entities: SetupSchemaEntity[] }>(`${base(companyId)}/schema`, {
      throwOnError: true,
    });
  },

  downloadTemplate(companyId: string, format: 'xlsx' | 'csv', entity?: SetupEntityKey) {
    return apiDownloadToDevice(`${base(companyId)}/template`, {
      query: { format, entity },
      defaultFileName: format === 'csv' ? `inventory-${entity ?? 'products'}-template.csv` : 'inventory-setup-template.xlsx',
    });
  },

  upload(companyId: string, file: File, options: SetupImportOptions = {}) {
    const form = new FormData();
    form.append('file', file);
    form.append('options', JSON.stringify(options));
    return apiFormRequest<SetupBatch>(`${base(companyId)}/imports`, form);
  },

  revalidate(companyId: string, batchId: string, options: SetupImportOptions) {
    return apiRequest<SetupBatch>(`${base(companyId)}/imports/${batchId}/validate`, {
      method: 'POST',
      body: { options },
      throwOnError: true,
    });
  },

  get(companyId: string, batchId: string) {
    return apiRequest<SetupBatch>(`${base(companyId)}/imports/${batchId}`, { throwOnError: true });
  },

  /** 200 when saved, 202 while saving in the background (poll `get`). */
  commit(companyId: string, batchId: string, confirmDuplicate = false) {
    return apiRequest<SetupBatch>(`${base(companyId)}/imports/${batchId}/commit`, {
      method: 'POST',
      body: confirmDuplicate ? { confirmDuplicate: true } : {},
      throwOnError: true,
    });
  },

  cancel(companyId: string, batchId: string) {
    return apiRequest<SetupBatch>(`${base(companyId)}/imports/${batchId}/cancel`, {
      method: 'POST',
      throwOnError: true,
    });
  },

  list(companyId: string, page = 1) {
    return apiRequest<{ items: SetupBatchListItem[]; pagination: { total: number } }>(`${base(companyId)}/imports`, {
      query: { page, limit: 20 },
      throwOnError: true,
    });
  },
};
