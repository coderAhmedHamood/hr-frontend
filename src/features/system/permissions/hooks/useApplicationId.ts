'use client';

import { useApplications } from '@/features/system/permissions/hooks/useApplications';

export type UseApplicationIdResult = {
  applicationId: string;
  isLoading: boolean;
};

/**
 * Returns the id of the HR application from the backend.
 * Looks for the application whose code is 'hr' (case-insensitive).
 * Falls back to the first active application if none matches.
 */
export function useApplicationId(): UseApplicationIdResult {
  const { applications, isLoading } = useApplications();

  const hr = applications.find((a) => a.code.toLowerCase() === 'hr')
    ?? applications[0];

  return {
    applicationId: hr?.id ?? '',
    isLoading,
  };
}
