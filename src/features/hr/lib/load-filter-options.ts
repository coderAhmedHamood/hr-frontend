/**
 * Loads filter reference data (branches, departments, employees, ...) without
 * ever failing the caller. A denied/failed filter load must not block the
 * main list from rendering — see useDepartmentsDirectoryModel for the bug
 * this replaces (branches 403 used to throw inside the same try/catch as the
 * departments load, blanking the whole page).
 */
export async function loadFilterOptions<T>(options: {
  loader: () => Promise<T>;
  fallback?: () => T;
}): Promise<T | null> {
  const { loader, fallback } = options;
  try {
    return await loader();
  } catch {
    return fallback ? fallback() : null;
  }
}

/** Runs several independent filter loaders and returns only the ones that succeeded. */
export async function loadFilterOptionsAll<T extends Record<string, () => Promise<unknown>>>(
  loaders: T,
): Promise<{ [K in keyof T]?: Awaited<ReturnType<T[K]>> }> {
  const keys = Object.keys(loaders) as (keyof T)[];
  const settled = await Promise.allSettled(keys.map((key) => loaders[key]()));
  const result: Partial<Record<keyof T, unknown>> = {};
  settled.forEach((res, i) => {
    if (res.status === 'fulfilled') {
      result[keys[i]] = res.value;
    }
  });
  return result as { [K in keyof T]?: Awaited<ReturnType<T[K]>> };
}
