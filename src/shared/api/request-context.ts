/**
 * Company a staff request acts in (`X-Company-Id`), supplied by the session
 * owner (the auth store registers it) so `shared/api` does not depend on it.
 *
 * Sent only when it adds information and cannot narrow a request by mistake:
 * - a staff user who belongs to more than one company (with one company the
 *   backend already knows it), not the platform owner (whose console names
 *   other companies on purpose);
 * - the request names no company itself (`companyId` in query or body). The
 *   backend then requires the permission in the active company, and still
 *   checks every loaded row against the permission in the row's company.
 */
export type ActiveCompanySource = () => string | null;

let source: ActiveCompanySource | null = null;

export function registerActiveCompanySource(fn: ActiveCompanySource | null): void {
  source = fn;
}

const COMPANY_HEADER = 'X-Company-Id';

function namesCompany(value: unknown): boolean {
  if (typeof FormData !== 'undefined' && value instanceof FormData) {
    const id = value.get('companyId');
    return typeof id === 'string' && id !== '';
  }
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const id = (value as Record<string, unknown>).companyId;
  return typeof id === 'string' && id !== '';
}

/** Adds `X-Company-Id` to `headers` when the rules above allow it. */
export function applyActiveCompanyHeader(
  headers: Record<string, string>,
  request: { query?: unknown; body?: unknown },
): void {
  if (typeof window === 'undefined' || !source) return;
  if (namesCompany(request.query) || namesCompany(request.body)) return;
  const companyId = source();
  if (companyId) headers[COMPANY_HEADER] = companyId;
}
