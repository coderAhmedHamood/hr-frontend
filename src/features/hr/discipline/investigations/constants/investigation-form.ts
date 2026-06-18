import type { HRInvestigationRecommendation, HRInvestigationResult } from '@/features/hr/discipline/lib/types';
import {
  INVESTIGATION_DEDUCTION_TYPE_LABELS,
  INVESTIGATION_RECOMMENDATION_LABELS,
  INVESTIGATION_RESULT_LABELS,
} from '@/features/hr/discipline/lib/types';

export type InvestigationRecommendationFilter = 'all' | HRInvestigationRecommendation;

export type InvestigationResultsDraftForm = {
  investigationDate: string;
  investigatorEmployeeId: string;
  employeeStatement: string;
  witnessStatement: string;
  result: 'proven' | 'not_proven';
  recommendationType: InvestigationRecommendationFilter;
  deductionType: 'days' | 'hours' | 'fixed_amount';
  deductionValue: string;
};

export const INVESTIGATION_RESULTS_EMPTY: InvestigationResultsDraftForm = {
  investigationDate: '',
  investigatorEmployeeId: '',
  employeeStatement: '',
  witnessStatement: '',
  result: 'proven',
  recommendationType: 'all',
  deductionType: 'days',
  deductionValue: '',
};

export const INVESTIGATION_RESULT_SUBMIT_OPTIONS = (
  Object.entries(INVESTIGATION_RESULT_LABELS) as [HRInvestigationResult, string][]
)
  .filter(([value]) => value !== 'pending')
  .map(([value, label]) => ({ value, label }));

export const INVESTIGATION_RECOMMENDATION_OPTIONS = [
  { value: 'all', label: 'بدون توصية' },
  ...Object.entries(INVESTIGATION_RECOMMENDATION_LABELS).map(([value, label]) => ({
    value,
    label,
  })),
];

export const INVESTIGATION_DEDUCTION_TYPE_OPTIONS = Object.entries(INVESTIGATION_DEDUCTION_TYPE_LABELS).map(
  ([value, label]) => ({ value, label }),
);
