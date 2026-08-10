import Image from 'next/image';
import { PackageSearch } from 'lucide-react';
import { cn } from '@/shared/utils';

type ProductImageProps = {
  src: string | null;
  alt: string;
  href?: string;
  aspectRatio?: 'square' | '4/3' | '3/4';
  priority?: boolean;
  className?: string;
  imageClassName?: string;
  sizes?: string;
  children?: React.ReactNode;
};

const aspectClasses = {
  square: 'aspect-square',
  '4/3': 'aspect-[4/3]',
  '3/4': 'aspect-[3/4]',
} as const;

export function ProductImage({
  src,
  alt,
  aspectRatio = 'square',
  priority = false,
  className,
  imageClassName,
  sizes = '(min-width: 1280px) 20vw, (min-width: 640px) 25vw, 50vw',
  children,
}: ProductImageProps) {
  return (
    <div
      className={cn(
        'relative w-full overflow-hidden bg-muted',
        aspectClasses[aspectRatio],
        className,
      )}
    >
      {src ? (
        <Image
          src={src}
          alt={alt}
          fill
          unoptimized
          priority={priority}
          sizes={sizes}
          className={cn('object-contain p-3 transition-transform duration-200 group-hover:scale-105', imageClassName)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center text-muted-foreground">
          <PackageSearch className="h-10 w-10" aria-hidden />
        </div>
      )}
      {children}
    </div>
  );
}
