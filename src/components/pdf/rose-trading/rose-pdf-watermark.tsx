'use client';

import * as React from 'react';
import { getPdfLogoSrc } from '@/components/pdf/lib/pdf-logo-url';

type RosePdfWatermarkProps = {
  logoSrc?: string;
};

/**
 * Light centered logo watermark for Rose PDF pages (print-safe, non-interactive).
 */
export function RosePdfWatermark({ logoSrc: logoSrcProp }: RosePdfWatermarkProps) {
  const [logoSrc, setLogoSrc] = React.useState<string | undefined>(logoSrcProp);
  React.useEffect(() => {
    if (logoSrcProp) setLogoSrc(logoSrcProp);
    else setLogoSrc(getPdfLogoSrc());
  }, [logoSrcProp]);

  if (!logoSrc) return null;

  return (
    <div
      aria-hidden
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        pointerEvents: 'none',
        zIndex: 0,
        overflow: 'hidden',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={logoSrc}
        alt=""
        style={{
          width: '62%',
          maxWidth: 460,
          height: 'auto',
          objectFit: 'contain',
          opacity: 0.1,
          filter: 'grayscale(15%) sepia(45%) brightness(1.35) contrast(0.9)',
        }}
      />
    </div>
  );
}

/** Shared page root styles for Rose printable forms (with watermark layer). */
export const ROSE_PDF_PAGE_ROOT_STYLE: React.CSSProperties = {
  position: 'relative',
  width: '210mm',
  maxWidth: '100%',
  margin: '0 auto',
  boxSizing: 'border-box',
  backgroundColor: '#ffffff',
  overflow: 'hidden',
};

export const ROSE_PDF_CONTENT_STYLE: React.CSSProperties = {
  position: 'relative',
  zIndex: 1,
};
