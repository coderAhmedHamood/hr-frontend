import type { ResolvedFeaturesGridSection } from '@/features/ecommerce/storefront/page-builder/domain/page-models';
import { HomepageFeaturesSection } from '@/features/ecommerce/storefront/components/homepage-sections';

export async function FeaturesGridSection({ section }: { section: ResolvedFeaturesGridSection }) {
  const features = section.data.features;
  if (features.length === 0) return null;
  return <HomepageFeaturesSection features={features} />;
}
