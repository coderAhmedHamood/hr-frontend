import type { AtsFormField } from '@/features/hr/recruitment/lib/ats/types';
import type { SubmitRecruitmentApplicationDto } from '@/features/hr/recruitment/lib/api/types';

export type CoreApplicationFieldKey = 'applicantName' | 'residencyNumber';

/** Maps a core form field to the top-level JSON property expected by the API. */
export function resolveCorePayloadKey(field: AtsFormField): CoreApplicationFieldKey | null {
  if (field.coreKey) return field.coreKey;
  if (field.isCore !== true) {
    const label = field.label.trim();
    if (/إقامة|residency/i.test(label)) return 'residencyNumber';
    if (/اسم|name/i.test(label) && !/إقامة|residency/i.test(label)) return 'applicantName';
    return null;
  }
  const label = field.label.trim();
  if (/إقامة|residency/i.test(label)) return 'residencyNumber';
  return 'applicantName';
}

export function isCoreFormField(field: AtsFormField): boolean {
  return field.isCore === true || resolveCorePayloadKey(field) !== null;
}

/**
 * Builds POST /public/recruitment/jobs/{slug}/apply body.
 * Core fields (name, residency) go top-level; supplemental fields use answers[fieldId].
 */
export function buildSubmitApplicationPayload(
  fields: AtsFormField[],
  values: Record<string, string>,
  extras?: { cvFileName?: string | null; cvFileBase64?: string | null },
): SubmitRecruitmentApplicationDto {
  let applicantName = '';
  let residencyNumber = '';
  const answers: Record<string, string> = {};

  for (const field of fields) {
    if (field.type === 'file') continue;
    const val = (values[field.id] ?? '').trim();
    const coreKey = resolveCorePayloadKey(field);
    if (coreKey === 'applicantName') {
      applicantName = val;
      continue;
    }
    if (coreKey === 'residencyNumber') {
      residencyNumber = val;
      continue;
    }
    if (val) answers[field.id] = val;
  }

  return {
    applicantName,
    residencyNumber,
    answers,
    cvFileName: extras?.cvFileName ?? null,
    cvFileBase64: extras?.cvFileBase64 ?? null,
  };
}

/** Read display value for a form field (core fields prefer top-level applicant props). */
export function getApplicantFieldValue(
  applicant: { applicantName?: string | null; residencyNumber?: string | null; answers: Record<string, string | undefined> },
  field: AtsFormField,
): string | undefined {
  const coreKey = resolveCorePayloadKey(field);
  if (coreKey === 'applicantName') return applicant.applicantName ?? applicant.answers[field.id];
  if (coreKey === 'residencyNumber') return applicant.residencyNumber ?? applicant.answers[field.id];
  return applicant.answers[field.id];
}
