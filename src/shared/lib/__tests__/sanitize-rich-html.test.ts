import { sanitizeRichHtml } from '@/shared/lib/sanitize-rich-html';

describe('sanitizeRichHtml', () => {
  it('keeps editor formatting and drops scripts', () => {
    const safe = sanitizeRichHtml(
      '<p style="text-align: right"><span style="color: #111827; font-size: 20px">عنوان</span></p><script>alert(1)</script>',
    );

    expect(safe).toContain('text-align:right');
    expect(safe).toContain('color:#111827');
    expect(safe).toContain('font-size:20px');
    expect(safe).toContain('عنوان');
    expect(safe).not.toContain('script');
    expect(safe).not.toContain('alert');
  });

  it('drops javascript links', () => {
    const safe = sanitizeRichHtml('<a href="javascript:alert(1)">اضغط</a>');
    expect(safe).not.toContain('javascript:');
    expect(safe).toContain('اضغط');
  });
});
