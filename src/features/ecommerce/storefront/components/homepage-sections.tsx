import { Headphones, Shield, Sparkles, Truck } from 'lucide-react';
import { getTranslations } from 'next-intl/server';
import type { StorefrontHomepageFeature } from '@/features/ecommerce/storefront/domain/storefront-models';

const FEATURE_ICONS = {
  truck: Truck,
  shield: Shield,
  sparkles: Sparkles,
  headphones: Headphones,
} as const;

export async function HomepageFeaturesSection({ features }: { features: StorefrontHomepageFeature[] }) {
  const t = await getTranslations('storefront');

  if (features.length === 0) return null;

  return (
    <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4" aria-label={t('a11y.storeFeatures')}>
      {features.map((feature) => {
        const Icon = FEATURE_ICONS[feature.icon];
        return (
          <div
            key={feature.id}
            className="rounded-xl border border-border bg-card p-5 shadow-soft transition-shadow hover:shadow-elevated"
          >
            <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Icon className="h-5 w-5" aria-hidden />
            </div>
            <h2 className="text-sm font-semibold text-foreground">{feature.title}</h2>
            <p className="mt-1.5 text-xs leading-relaxed text-muted-foreground">{feature.description}</p>
          </div>
        );
      })}
    </section>
  );
}
