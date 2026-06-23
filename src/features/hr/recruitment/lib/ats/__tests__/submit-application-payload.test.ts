import { describe, expect, it } from '@jest/globals';
import type { AtsFormField } from '@/features/hr/recruitment/lib/ats/types';
import { buildSubmitApplicationPayload } from '@/features/hr/recruitment/lib/ats/submit-application-payload';

const fields: AtsFormField[] = [
  { id: 'core-name', type: 'text', label: 'الاسم', required: true, isCore: true, coreKey: 'applicantName' },
  { id: 'core-res', type: 'text', label: 'رقم الإقامة', required: true, isCore: true, coreKey: 'residencyNumber' },
  { id: 'extra-1', type: 'text', label: 'سنوات الخبرة', required: false, isCore: false },
];

describe('buildSubmitApplicationPayload', () => {
  it('sends core fields top-level and supplemental fields in answers', () => {
    const payload = buildSubmitApplicationPayload(fields, {
      'core-name': 'أحمد',
      'core-res': '2123456789',
      'extra-1': '5',
    });

    expect(payload.applicantName).toBe('أحمد');
    expect(payload.residencyNumber).toBe('2123456789');
    expect(payload.answers).toEqual({ 'extra-1': '5' });
    expect(payload.answers['core-name']).toBeUndefined();
    expect(payload.answers['core-res']).toBeUndefined();
  });
});
