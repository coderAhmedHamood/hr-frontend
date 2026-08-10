import { storefrontPageRepository } from '@/features/ecommerce/storefront/page-builder/lib/repositories/page-repository';

describe('storefrontPageRepository admin writes', () => {
  it('returns a raw PageRecord for admin CMS', async () => {
    const record = await storefrontPageRepository.getRecordByPageType('demo-company', 'homepage');
    expect(record).not.toBeNull();
    expect(record?.pageType).toBe('homepage');
    expect(record?.displayName.ar).toBeTruthy();
    expect(record?.sections.length).toBeGreaterThan(0);
  });

  it('persists section enable toggles for storefront reads', async () => {
    const record = await storefrontPageRepository.getRecordByPageType('demo-company', 'homepage');
    expect(record).not.toBeNull();
    if (!record) return;

    const firstId = record.sections[0].id;
    const updated = {
      ...record,
      sections: record.sections.map((section, index) =>
        index === 0 ? { ...section, enabled: false } : section,
      ),
    };

    const saved = await storefrontPageRepository.saveRecord(updated);
    expect(saved.sections.find((section) => section.id === firstId)?.enabled).toBe(false);

    const mapped = await storefrontPageRepository.getByPageType('demo-company', 'homepage', 'ar');
    // Disabled sections may still be in record; mapper filters by published+enabled in page-mapper.
    // Assert the raw record stays in sync.
    const reloaded = await storefrontPageRepository.getRecordByPageType('demo-company', 'homepage');
    expect(reloaded?.sections.find((section) => section.id === firstId)?.enabled).toBe(false);
    expect(mapped).not.toBeNull();

    // Restore for other tests
    await storefrontPageRepository.saveRecord({
      ...saved,
      sections: saved.sections.map((section) =>
        section.id === firstId ? { ...section, enabled: true } : section,
      ),
    });
  });
});
