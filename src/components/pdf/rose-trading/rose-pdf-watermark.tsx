'use client';

import * as React from 'react';
import { isDefaultPdfLogoSrc } from '@/components/pdf/lib/pdf-company-info';
import { usePdfCompanyLetterhead } from '@/components/pdf/hooks/use-pdf-company-letterhead';

type RosePdfWatermarkProps = {
  logoSrc?: string;
};

/**
 * Light centered logo watermark for Rose PDF pages (print-safe, non-interactive).
 */
export function RosePdfWatermark({ logoSrc: logoSrcProp }: RosePdfWatermarkProps) {
  // The printing company's own logo (none → no watermark), never a fixed one.
  const company = usePdfCompanyLetterhead();
  const companyLogo = company.logoSrc;
  const logoSrc =
    logoSrcProp && !isDefaultPdfLogoSrc(logoSrcProp) ? logoSrcProp : companyLogo;

  // Off in the company settings, or no logo: no background.
  if (!logoSrc || !company.watermarkEnabled) return null;

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
          opacity: company.watermarkOpacity,
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
