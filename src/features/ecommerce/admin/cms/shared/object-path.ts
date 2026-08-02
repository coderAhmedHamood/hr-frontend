/** Read a nested value by dot-path (`content.title.ar`). */
export function getValueAtPath(source: unknown, path: string): unknown {
  const segments = path.split('.').filter(Boolean);
  let current: unknown = source;
  for (const segment of segments) {
    if (current === null || current === undefined || typeof current !== 'object') {
      return undefined;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return current;
}

/** Immutable set by dot-path. Creates intermediate objects as needed. */
export function setValueAtPath<T extends Record<string, unknown>>(source: T, path: string, value: unknown): T {
  const segments = path.split('.').filter(Boolean);
  if (segments.length === 0) return source;

  const root: Record<string, unknown> = { ...source };
  let cursor: Record<string, unknown> = root;

  for (let index = 0; index < segments.length - 1; index += 1) {
    const key = segments[index];
    const existing = cursor[key];
    const next =
      existing !== null && typeof existing === 'object' && !Array.isArray(existing)
        ? { ...(existing as Record<string, unknown>) }
        : {};
    cursor[key] = next;
    cursor = next;
  }

  cursor[segments[segments.length - 1]] = value;
  return root as T;
}
