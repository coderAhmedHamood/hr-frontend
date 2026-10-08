/**
 * Expense attachments in IndexedDB (this browser only), keyed by the data
 * scope (company + user) and the attachment id. Limits keep the prototype
 * within browser quotas.
 */
export const MAX_FILE_BYTES = 2 * 1024 * 1024;
export const MAX_FILES_PER_EXPENSE = 5;
export const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

const DB_NAME = 'erp-expenses-files';
const STORE = 'files';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('المتصفح لا يدعم حفظ المرفقات'));
      return;
    }
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => request.result.createObjectStore(STORE);
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('تعذر فتح مخزن المرفقات'));
  });
}

async function run<T>(mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T>): Promise<T> {
  const db = await openDb();
  return new Promise<T>((resolve, reject) => {
    const tx = db.transaction(STORE, mode);
    const request = fn(tx.objectStore(STORE));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('تعذر الوصول إلى المرفقات'));
    tx.oncomplete = () => db.close();
  });
}

const fileKey = (scope: string, id: string) => `${scope}|${id}`;

/** Checks a file against the limits; the Arabic reason when refused. */
export function checkFile(file: File, alreadyAttached: number): string | null {
  if (alreadyAttached >= MAX_FILES_PER_EXPENSE) return `الحد ${MAX_FILES_PER_EXPENSE} مرفقات لكل مصروف`;
  if (!ACCEPTED_TYPES.includes(file.type)) return 'الأنواع المقبولة: صور JPG/PNG/WebP أو PDF';
  if (file.size > MAX_FILE_BYTES) return 'الحد الأقصى للملف 2 ميغابايت';
  return null;
}

export async function putFile(scope: string, id: string, file: Blob): Promise<void> {
  await run('readwrite', (store) => store.put(file, fileKey(scope, id)));
}

export async function getFile(scope: string, id: string): Promise<Blob | null> {
  const value = await run<Blob | undefined>('readonly', (store) => store.get(fileKey(scope, id)) as IDBRequest<Blob | undefined>);
  return value ?? null;
}

export async function deleteFile(scope: string, id: string): Promise<void> {
  await run('readwrite', (store) => store.delete(fileKey(scope, id)));
}

/** Removes every file of a scope (reset / start empty). */
export async function clearScopeFiles(scope: string): Promise<void> {
  const range = IDBKeyRange.bound(`${scope}|`, `${scope}|￿`);
  await run('readwrite', (store) => store.delete(range));
}
