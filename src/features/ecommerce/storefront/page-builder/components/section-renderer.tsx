import type { ResolvedSection } from '@/features/ecommerce/storefront/page-builder/domain/page-models';
import { SectionShell } from '@/features/ecommerce/storefront/page-builder/components/section-shell';
import { renderSectionComponent } from '@/features/ecommerce/storefront/page-builder/lib/section-registry';

export function SectionRenderer({ section }: { section: ResolvedSection }) {
  const content = renderSectionComponent(section);
  if (!content) return null;

  return (
    <SectionShell id={section.id} theme={section.style.theme} visibility={section.style.visibility}>
      {content}
    </SectionShell>
  );
}
