import type { HRContractRecord } from '@/features/hr/contracts/lib/contracts-store';

export function contractCreditsLeaveDays(contract: Pick<HRContractRecord, 'annualLeaveDays'>): boolean {
  return (contract.annualLeaveDays ?? 0) > 0;
}

export function canRecordEmployeeContractAcceptance(
  contract: Pick<HRContractRecord, 'status' | 'employeeSigned'>,
): boolean {
  return (
    !contract.employeeSigned &&
    (contract.status === 'draft' || contract.status === 'pending_signature')
  );
}

export function canActivateEmploymentContract(
  contract: Pick<HRContractRecord, 'status' | 'employeeSigned'>,
): boolean {
  return (
    contract.employeeSigned &&
    (contract.status === 'draft' || contract.status === 'pending_signature')
  );
}

export function isTerminatedEmploymentContract(
  contract: Pick<HRContractRecord, 'status'>,
): boolean {
  return contract.status === 'terminated';
}
