import type { ContractStatus, ContractType } from '@/features/hr/contracts/types';

export const CP_LINKS_ALL_DEPARTMENTS = 'all';

export const CONTRACT_STATUS_AR: Record<ContractStatus, string> = {
  active: 'نشط على رأس العمل ساري التوظيف',
  suspended: 'موقوف معلق إيقاف',
  ended: 'منتهي انتهاء',
};

export const CONTRACT_TYPE_AR: Record<ContractType, string> = {
  permanent: 'دائم',
  temporary: 'مؤقت',
  'part-time': 'دوام جزئي',
  contract: 'عقد عمل',
};
