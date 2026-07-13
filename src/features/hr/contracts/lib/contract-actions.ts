import type {
  ApiEmployeeContract,
  EmployeeContractActionsDto,
} from '@/features/hr/contracts/lib/contracts-api';

export type ContractUiActions = EmployeeContractActionsDto;

type ActionsSource = {
  status: string;
  employeeSigned?: boolean | null;
  actions?: EmployeeContractActionsDto | null;
};

/** Fallback إذا غاب `actions` من الاستجابة — يطابق قواعد دورة حياة العقد. */
export function deriveContractActions(contract: ActionsSource): ContractUiActions {
  const pending = contract.status === 'pending_signature';
  const draft = contract.status === 'draft';
  const active = contract.status === 'active';
  const signed = Boolean(contract.employeeSigned);

  return {
    canEditTerms: draft || (pending && !signed),
    canSendToEmployee: draft || (pending && !signed),
    canEmployeeDecide: pending && !signed,
    canActivate: pending && signed,
    canCancel: false,
    canClose: active,
  };
}

export function resolveContractActions(contract: ActionsSource): ContractUiActions {
  const actions = contract.actions ?? deriveContractActions(contract);
  return { ...actions, canCancel: false };
}
