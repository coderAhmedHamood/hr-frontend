import type { AtsFormField } from '@/features/hr/recruitment/lib/ats/types';
import { isCoreFormField } from '@/features/hr/recruitment/lib/ats/submit-application-payload';

/** Core applicant fields (name + residency) vs supplemental job questions. */
export function splitApplicantFormFields(fields: AtsFormField[]) {
  const explicitCore = fields.filter((f) => f.isCore === true);
  if (explicitCore.length > 0) {
    const identityFields = [...explicitCore].sort(
      (a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0),
    );
    const supplementalFields = fields.filter((f) => !f.isCore);
    return { identityFields, supplementalFields };
  }

  const identityFields = fields.filter(isCoreFormField);
  const supplementalFields = fields.filter((f) => !isCoreFormField(f));
  return { identityFields, supplementalFields };
}
