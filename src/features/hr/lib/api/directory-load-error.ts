import { ApiError } from '@/features/hr/lib/api/client';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';

export function isForbiddenApiError(error: unknown): error is ApiError {
  return error instanceof ApiError && error.status === 403;
}

export type DirectoryLoadFailure = {
  /** Main list endpoint returned 403 — show ForbiddenState, not raw backend message. */
  accessDenied: boolean;
  listError: string | null;
};

/** Classifies a directory/list load failure for page vs filter handling. */
export function resolveDirectoryLoadFailure(
  error: unknown,
  context?: string,
): DirectoryLoadFailure {
  if (isForbiddenApiError(error)) {
    return { accessDenied: true, listError: null };
  }
  const { displayMessage } = handleApiError(error, context);
  return { accessDenied: false, listError: displayMessage };
}
