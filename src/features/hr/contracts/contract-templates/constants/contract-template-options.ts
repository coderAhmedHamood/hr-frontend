import type { ContractNature, WorkArrangement } from '@/features/hr/contracts/contract-templates/types/contract-template';

/** قيم مطابقة لـ backend WorkArrangement enum (create-employee-contract.dto) */
export const TEMPLATE_WORK_ARRANGEMENT_LABELS: Record<WorkArrangement, string> = {
  full_time: 'دوام كامل',
  part_time: 'دوام جزئي',
  remote: 'عن بُعد',
  hybrid: 'هجين (مختلط)',
};

/** قيم مطابقة لـ backend ContractNature enum (create-employee-contract.dto) */
export const TEMPLATE_CONTRACT_NATURE_LABELS: Record<ContractNature, string> = {
  indefinite: 'غير محدد المدة',
  fixed_term: 'محدد المدة',
  project_based: 'عقد إنجاز / مشروع',
};

export const CONTRACT_NATURE_DROPDOWN_OPTIONS: { value: ContractNature; label: string }[] = (
  Object.entries(TEMPLATE_CONTRACT_NATURE_LABELS) as [ContractNature, string][]
).map(([value, label]) => ({ value, label }));

export const WORK_ARRANGEMENT_DROPDOWN_OPTIONS: { value: WorkArrangement; label: string }[] = (
  Object.entries(TEMPLATE_WORK_ARRANGEMENT_LABELS) as [WorkArrangement, string][]
).map(([value, label]) => ({ value, label }));
