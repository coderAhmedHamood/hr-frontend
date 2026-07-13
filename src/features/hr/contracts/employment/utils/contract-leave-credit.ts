import type { HRContractRecord } from '@/features/hr/contracts/lib/contracts-store';
import {
  resolveContractActions,
} from '@/features/hr/contracts/lib/contract-actions';

export {
  deriveContractActions,
  resolveContractActions,
  type ContractUiActions,
} from '@/features/hr/contracts/lib/contract-actions';

export function contractCreditsLeaveDays(contract: Pick<HRContractRecord, 'annualLeaveDays'>): boolean {
  return (contract.annualLeaveDays ?? 0) > 0;
}

/** @deprecated استخدم `actions.canEmployeeDecide` */
export function canRecordEmployeeContractAcceptance(
  contract: Pick<HRContractRecord, 'status' | 'employeeSigned' | 'actions'>,
): boolean {
  return resolveContractActions(contract).canEmployeeDecide;
}

/** @deprecated استخدم `actions.canActivate` */
export function canActivateEmploymentContract(
  contract: Pick<HRContractRecord, 'status' | 'employeeSigned' | 'actions'>,
): boolean {
  return resolveContractActions(contract).canActivate;
}

export function isTerminatedEmploymentContract(
  contract: Pick<HRContractRecord, 'status'>,
): boolean {
  return contract.status === 'terminated';
}
