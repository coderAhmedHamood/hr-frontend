import { getValueAtPath, setValueAtPath } from '@/features/ecommerce/admin/cms/shared/object-path';

describe('object-path', () => {
  it('reads nested paths', () => {
    expect(getValueAtPath({ content: { title: { ar: 'مرحبا' } } }, 'content.title.ar')).toBe('مرحبا');
  });

  it('returns undefined for missing paths', () => {
    expect(getValueAtPath({ content: {} }, 'content.title.ar')).toBeUndefined();
  });

  it('sets nested paths immutably', () => {
    const source = { content: { title: { ar: 'a', en: 'b' } } };
    const next = setValueAtPath(source, 'content.title.en', 'hello');
    expect(next.content.title.en).toBe('hello');
    expect(source.content.title.en).toBe('b');
  });
});
