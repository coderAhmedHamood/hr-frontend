import {
  applyActiveCompanyHeader,
  registerActiveCompanySource,
} from '@/shared/api/request-context';

const A = '11111111-1111-4111-8111-111111111111';
const B = '22222222-2222-4222-8222-222222222222';

describe('X-Company-Id for staff requests', () => {
  afterEach(() => registerActiveCompanySource(null));

  it('adds the active company when the request names none', () => {
    registerActiveCompanySource(() => A);
    const headers: Record<string, string> = {};
    applyActiveCompanyHeader(headers, { query: { page: 1 } });
    expect(headers['X-Company-Id']).toBe(A);
  });

  it('does not add it when the request names a company (query, body or form)', () => {
    registerActiveCompanySource(() => A);
    for (const request of [
      { query: { companyId: B } },
      { body: { companyId: B, name: 'x' } },
      { body: (() => { const f = new FormData(); f.append('companyId', B); return f; })() },
    ]) {
      const headers: Record<string, string> = {};
      applyActiveCompanyHeader(headers, request);
      expect(headers['X-Company-Id']).toBeUndefined();
    }
  });

  it('adds nothing without a source or an active company', () => {
    const headers: Record<string, string> = {};
    applyActiveCompanyHeader(headers, {});
    registerActiveCompanySource(() => null);
    applyActiveCompanyHeader(headers, {});
    expect(headers).toEqual({});
  });

  it('a form without companyId gets the header', () => {
    registerActiveCompanySource(() => A);
    const headers: Record<string, string> = {};
    const form = new FormData();
    form.append('file', new Blob(['x']), 'x.pdf');
    applyActiveCompanyHeader(headers, { body: form });
    expect(headers['X-Company-Id']).toBe(A);
  });
});
