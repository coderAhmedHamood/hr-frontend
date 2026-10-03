import { resolveUploadUrl, uploadResponseToStoredPath } from '@/shared/resolve-upload-url';

describe('resolveUploadUrl', () => {
  it('keeps the signature of a protected absolute upload URL', () => {
    const url = resolveUploadUrl('https://api.example.com/uploads/documents/a.pdf?exp=1&sig=abc');
    expect(url.endsWith('/uploads/documents/a.pdf?exp=1&sig=abc')).toBe(true);
  });

  it('keeps the signature of a relative upload path', () => {
    const url = resolveUploadUrl('/uploads/documents/a.pdf?exp=1&sig=abc');
    expect(url.endsWith('/uploads/documents/a.pdf?exp=1&sig=abc')).toBe(true);
  });

  it('leaves public upload paths unchanged apart from the API base', () => {
    expect(resolveUploadUrl('/uploads/products/p.png').endsWith('/uploads/products/p.png')).toBe(true);
  });
});

describe('uploadResponseToStoredPath', () => {
  it('stores a stable path (the backend strips signatures on save)', () => {
    const stored = uploadResponseToStoredPath({
      url: 'https://api.example.com/uploads/documents/a.pdf?exp=1&sig=abc',
      path: 'uploads/documents/a.pdf',
    });
    expect(stored.startsWith('/uploads/documents/a.pdf')).toBe(true);
  });
});
