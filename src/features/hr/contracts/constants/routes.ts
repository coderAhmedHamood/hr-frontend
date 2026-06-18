export const HR_CONTRACTS_BASE = '/hr/contracts' as const;

export function hrContractsSectionHref(segment: string): string {
  return `${HR_CONTRACTS_BASE}/${segment}`;
}

export const hrContractsRoutes = {
  root: HR_CONTRACTS_BASE,
  employment: hrContractsSectionHref('employment'),
  articles: hrContractsSectionHref('articles'),
  employeeAdvances: hrContractsSectionHref('employee-advances'),
  allowanceTypes: hrContractsSectionHref('allowance-types'),
  contractTemplates: hrContractsSectionHref('contract-templates'),
} as const;
