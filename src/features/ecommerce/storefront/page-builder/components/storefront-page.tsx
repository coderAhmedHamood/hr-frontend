import type { StorefrontPageView } from '@/features/ecommerce/storefront/page-builder/domain/page-models';
import { SectionRenderer } from '@/features/ecommerce/storefront/page-builder/components/section-renderer';
import { cn } from '@/shared/utils';

type StorefrontPageProps = {
  page: StorefrontPageView;
};

/** Generic CMS page — renders sections[] only; no section-type knowledge. */
export function StorefrontPage({ page }: StorefrontPageProps) {
  const flushTop = page.sections[0]?.type === 'hero-carousel';

  return (
    <div
      className={cn(
        'flex min-w-0 w-full max-w-full flex-col gap-10',
        flushTop && '-mt-4 sm:-mt-6',
      )}
    >
      <h1 className="sr-only">{page.seoTitle}</h1>
      {page.sections.map((section) => (
        <SectionRenderer key={section.id} section={section} />
      ))}
    </div>
  );
}
