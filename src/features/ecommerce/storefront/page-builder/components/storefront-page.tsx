import type { StorefrontPageView } from '@/features/ecommerce/storefront/page-builder/domain/page-models';
import { SectionRenderer } from '@/features/ecommerce/storefront/page-builder/components/section-renderer';

type StorefrontPageProps = {
  page: StorefrontPageView;
};

/** Generic CMS page — renders sections[] only; no section-type knowledge. */
export async function StorefrontPage({ page }: StorefrontPageProps) {
  const renderedSections = await Promise.all(
    page.sections.map((section) => <SectionRenderer key={section.id} section={section} />),
  );

  return (
    <div className="flex min-w-0 w-full max-w-full flex-col gap-10">
      <h1 className="sr-only">{page.seoTitle}</h1>
      {renderedSections}
    </div>
  );
}
