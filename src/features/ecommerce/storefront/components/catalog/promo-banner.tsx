import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { STOREFRONT_MAIN_FULL_BLEED_CLASS } from '@/features/ecommerce/storefront/components/catalog/layout-classes';
import { resolveStorefrontImageSrc } from '@/features/ecommerce/storefront/lib/resolve-storefront-image-src';
import { cn } from '@/shared/utils';

type PromoBannerProps = {
  imageUrl: string;
  mobileImageUrl?: string | null;
  alt: string;
  href: `/store${string}`;
  target?: '_self' | '_blank';
  layout?: 'contained' | 'full-bleed' | 'split';
  className?: string;
};

export function PromoBanner({
  imageUrl,
  mobileImageUrl,
  alt,
  href,
  target = '_self',
  layout = 'contained',
  className,
}: PromoBannerProps) {
  const mobileSrc = resolveStorefrontImageSrc(mobileImageUrl);
  const desktopSrc = resolveStorefrontImageSrc(imageUrl) ?? mobileSrc;

  if (!desktopSrc && !mobileSrc) return null;

  const imageBlock = (
    <div
      className={cn(
        'relative w-full overflow-hidden bg-muted',
        layout === 'split' ? 'aspect-[16/9] md:aspect-[21/9]' : 'aspect-[21/7] min-h-[120px] sm:min-h-[160px]',
        layout === 'contained' && 'rounded-xl',
        layout === 'full-bleed' && 'rounded-none',
      )}
    >
      {mobileSrc && mobileSrc !== desktopSrc ? (
        <Image
          src={mobileSrc}
          alt={alt}
          fill
          unoptimized
          className="object-cover transition-transform duration-300 hover:scale-[1.02] md:hidden"
          sizes="(min-width: 1024px) 1400px, 100vw"
        />
      ) : null}
      {desktopSrc ? (
        <Image
          src={desktopSrc}
          alt={alt}
          fill
          unoptimized
          className={cn(
            'object-cover transition-transform duration-300 hover:scale-[1.02]',
            mobileSrc && mobileSrc !== desktopSrc && 'hidden md:block',
          )}
          sizes="(min-width: 1024px) 1400px, 100vw"
        />
      ) : null}
    </div>
  );

  const wrapperClass = cn(
    'block w-full max-w-full min-w-0',
    layout === 'full-bleed' && STOREFRONT_MAIN_FULL_BLEED_CLASS,
    className,
  );

  if (target === '_blank') {
    return (
      <a href={href} target="_blank" rel="noopener noreferrer" className={wrapperClass}>
        {imageBlock}
      </a>
    );
  }

  return (
    <Link href={href} prefetch={false} className={wrapperClass}>
      {imageBlock}
    </Link>
  );
}
