import { ApiError, type PaginatedResult } from '@/features/hr/lib/api/client';
import { isApiErrorEnvelope, isApiSuccessEnvelope } from '@/features/hr/lib/api/types';
import type { RecruitmentJob } from '@/features/hr/recruitment/lib/api/types';

function unwrapData<T>(payload: unknown): T {
  if (payload && typeof payload === 'object' && isApiSuccessEnvelope(payload)) {
    return payload.data as T;
  }
  return payload as T;
}

/** Public careers list via Next.js BFF (works before backend adds GET /public/recruitment/jobs). */
export async function fetchPublicCareersJobs(search?: string): Promise<PaginatedResult<RecruitmentJob>> {
  const params = new URLSearchParams({ limit: '100' });
  if (search?.trim()) params.set('search', search.trim());

  const response = await fetch(`/api/public/recruitment/jobs?${params}`, {
    credentials: 'include',
  });

  let payload: unknown = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const envelope = payload && isApiErrorEnvelope(payload) ? payload : null;
    throw new ApiError(envelope, response.status, payload);
  }

  return unwrapData<PaginatedResult<RecruitmentJob>>(payload);
}
