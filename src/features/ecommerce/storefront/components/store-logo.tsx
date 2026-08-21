'use client';

import * as React from 'react';
import Image from 'next/image';
import { Link } from '@/i18n/navigation';
import { cn } from '@/shared/utils';

type StoreLogoProps = {
  name: string;
  logoUrl: string | null;
  className?: string;
  showName?: boolean;
};

/** Store identity logo from CMS branding — falls back to initial if image fails. */
export function StoreLogo({ name, logoUrl, className, showName = true }: StoreLogoProps) {
  const [failed, setFailed] = React.useState(false);
  const showImage = Boolean(logoUrl) && !failed;

  return (
    <Link
      href="/store"
      prefetch={false}
      aria-label={name}
      className={cn(
        'flex shrink-0 items-center gap-2.5 font-arabic-display text-base font-bold tracking-tight text-foreground sm:text-lg',
        className,
      )}
    >
      {showImage ? (
        <Image
          src={logoUrl!}
          alt={name}
          width={40}
          height={40}
          unoptimized
          className="h-10 w-10 rounded-lg object-contain"
          onError={() => setFailed(true)}
        />
      ) : (
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-base font-black text-secondary-foreground shadow-soft">
          {name.charAt(0)}
        </span>
      )}
      {showName ? <span className="hidden lg:inline">{name}</span> : null}
    </Link>
  );
}
