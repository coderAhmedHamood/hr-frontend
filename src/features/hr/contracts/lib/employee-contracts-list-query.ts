import type {
  ContractNature,
  WorkArrangement,
} from '@/features/hr/contracts/contract-templates/types/contract-template';

/** EmployeeContractStatus — send these values literally in the query. */
export const CONTRACT_STATUS = [
  'draft',
  'pending_signature',
  'active',
  'expired',
  'terminated',
  'superseded',
  'cancelled',
] as const;

export type ContractStatus = (typeof CONTRACT_STATUS)[number];

/** ContractNature */
export const CONTRACT_NATURE = [
  'indefinite',
  'fixed_term',
  'project_based',
] as const satisfies readonly ContractNature[];

/** WorkArrangement */
export const WORK_ARRANGEMENT = [
  'full_time',
  'part_time',
  'remote',
  'hybrid',
] as const satisfies readonly WorkArrangement[];

export type EmployeeContractsListQuery = {
  companyId?: string;
  employeeId?: string;
  /** Unique ids — serialized as comma-separated (`id1,id2`). */
  employeeIds?: string[];
  branchId?: string;
  contractTemplateId?: string;
  status?: ContractStatus;
  /**
   * `true` = drafts only · `false` = every status except draft.
   * Do not send with `status` unless compatible (e.g. both mean draft).
   */
  isDraft?: boolean;
  contractNature?: ContractNature;
  workArrangement?: WorkArrangement;
  /** Partial case-insensitive match (ILIKE %value%). */
  contractNumber?: string;
  page?: number;
  limit?: number;
};

export type EmployeeContractsListFilters = {
  companyId: string;
  page: number;
  limit: number;
  status?: ContractStatus | 'all';
  /** `draft` → isDraft=true · `undraft` → isDraft=false · only when status is `all`. */
  draftMode?: 'all' | 'draft' | 'undraft';
  contractNature?: ContractNature | 'all';
  workArrangement?: WorkArrangement | 'all';
  contractNumber?: string;
  employeeId?: string;
  employeeIds?: Iterable<string>;
  branchId?: string;
  contractTemplateId?: string;
};

/**
 * Builds GET /payroll/contracts query params (all optional filters AND together).
 * Prefer `status` over `isDraft` when both would be set — never send incompatible pairs.
 */
export function buildEmployeeContractsListQuery(
  filters: EmployeeContractsListFilters,
): EmployeeContractsListQuery {
  const status = filters.status && filters.status !== 'all' ? filters.status : undefined;
  const draftMode = filters.draftMode && filters.draftMode !== 'all' ? filters.draftMode : undefined;

  let isDraft: boolean | undefined;
  if (!status && draftMode === 'draft') isDraft = true;
  else if (!status && draftMode === 'undraft') isDraft = false;
  // Compatible duplicate only when caller explicitly wants both — we skip: status alone is enough.

  const employeeIds = filters.employeeIds
    ? [...new Set([...filters.employeeIds].filter(Boolean))]
    : undefined;

  const contractNumber = filters.contractNumber?.trim() || undefined;

  return {
    companyId: filters.companyId || undefined,
    page: filters.page,
    limit: filters.limit,
    ...(filters.employeeId ? { employeeId: filters.employeeId } : {}),
    ...(employeeIds && employeeIds.length > 0 ? { employeeIds } : {}),
    ...(filters.branchId ? { branchId: filters.branchId } : {}),
    ...(filters.contractTemplateId ? { contractTemplateId: filters.contractTemplateId } : {}),
    ...(status ? { status } : {}),
    ...(isDraft !== undefined ? { isDraft } : {}),
    ...(filters.contractNature && filters.contractNature !== 'all'
      ? { contractNature: filters.contractNature }
      : {}),
    ...(filters.workArrangement && filters.workArrangement !== 'all'
      ? { workArrangement: filters.workArrangement }
      : {}),
    ...(contractNumber ? { contractNumber } : {}),
  };
}
