import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { STOREFRONT_MAIN_FULL_BLEED_CLASS } from '@/features/ecommerce/storefront/components/catalog/layout-classes';
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
  const imageBlock = (
    <div
      className={cn(
        'relative w-full overflow-hidden bg-muted',
        layout === 'split' ? 'aspect-[16/9] md:aspect-[21/9]' : 'aspect-[21/7] min-h-[120px] sm:min-h-[160px]',
        layout === 'contained' && 'rounded-xl',
        layout === 'full-bleed' && 'rounded-none',
      )}
    >
      <picture>
        {mobileImageUrl ? <source media="(max-width: 767px)" srcSet={mobileImageUrl} /> : null}
        <Image
          src={imageUrl}
          alt={alt}
          fill
          unoptimized
          className="object-cover transition-transform duration-300 hover:scale-[1.02]"
          sizes="(min-width: 1024px) 1400px, 100vw"
        />
      </picture>
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
