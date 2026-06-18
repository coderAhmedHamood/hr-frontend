export function linkedCompanyIdSet(companyIds: string[]): Set<string> {
  return new Set(companyIds.filter(Boolean));
}

/** Returns the first candidate that exists in the user's linked companies. */
export function pickLinkedCompanyId(
  candidates: Array<string | null | undefined>,
  linkedCompanyIds: Set<string>,
): string | null {
  for (const id of candidates) {
    if (id && linkedCompanyIds.has(id)) return id;
  }
  return null;
}
