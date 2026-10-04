export const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

/** True when the id is a real DB UUID (not a client draft key like `pval-…`). */
export function isPersistedId(id: string | undefined): boolean {
  return Boolean(id && UUID_RE.test(id));
}
