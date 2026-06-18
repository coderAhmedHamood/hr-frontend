import { isApiSuccessEnvelope } from '@/features/hr/lib/api/types';

describe('isApiSuccessEnvelope', () => {
  it('accepts success payloads without an explicit error field', () => {
    const payload = {
      status: 200,
      message: 'Success',
      data: { items: [{ id: '1' }], pagination: { page: 1, limit: 200, total: 1, totalPages: 1 } },
    };

    expect(isApiSuccessEnvelope(payload)).toBe(true);
  });

  it('accepts success payloads with error: null', () => {
    const payload = {
      status: 200,
      message: 'Success',
      data: { items: [] },
      error: null,
    };

    expect(isApiSuccessEnvelope(payload)).toBe(true);
  });
});
