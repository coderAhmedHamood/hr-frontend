/** Archive filter for organization directory list APIs. */
export type OrganizationArchiveScope = 'active' | 'archived' | 'all';

export const ORGANIZATION_ARCHIVE_SCOPE_DEFAULT: OrganizationArchiveScope = 'active';

export const ORGANIZATION_ARCHIVE_SCOPE_OPTIONS: readonly {
  value: OrganizationArchiveScope;
  label: string;
}[] = [
  { value: 'active', label: 'غير مؤرشف' },
  { value: 'archived', label: 'مؤرشف' },
  { value: 'all', label: 'الكل' },
];

export type OrganizationListArchiveQuery = {
  archiveScope?: OrganizationArchiveScope;
};

/** @deprecated Use OrganizationListArchiveQuery */
export type OrganizationListStatusQuery = OrganizationListArchiveQuery;

export function organizationListArchiveQuery(
  scope: OrganizationArchiveScope = ORGANIZATION_ARCHIVE_SCOPE_DEFAULT,
): OrganizationListArchiveQuery {
  return { archiveScope: scope };
}

/** Pickers and reference loads — non-archived only. */
export function organizationActiveListArchiveQuery(): OrganizationListArchiveQuery {
  return { archiveScope: 'active' };
}

/**
 * Payroll list endpoints (contract-articles, contracts, …) do not accept `archiveScope` yet.
 * Omit the query param and rely on the server default (non-archived).
 */
export function payrollListArchiveQuery(): OrganizationListArchiveQuery {
  return {};
}

/** Client-side archive filter when the API omits archive fields on items. */
export function filterRowsByArchiveScope<T extends { isArchived?: boolean }>(
  rows: T[],
  scope: OrganizationArchiveScope,
): T[] {
  if (scope === 'all') return rows;
  if (scope === 'archived') return rows.filter((r) => r.isArchived === true);
  return rows.filter((r) => !r.isArchived);
}

/** @deprecated Use organizationListArchiveQuery */
export function organizationListStatusQuery(
  scope: OrganizationArchiveScope = ORGANIZATION_ARCHIVE_SCOPE_DEFAULT,
): OrganizationListArchiveQuery {
  return organizationListArchiveQuery(scope);
}

/** @deprecated Use organizationActiveListArchiveQuery */
export function organizationActiveListStatusQuery(): OrganizationListArchiveQuery {
  return organizationActiveListArchiveQuery();
}
