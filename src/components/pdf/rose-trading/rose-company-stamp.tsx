'use client';

import * as React from 'react';
import { COMPANY_STAMP_LABEL_AR } from '@/components/pdf/lib/company-stamp';
import { usePdfCompanyLetterhead } from '@/components/pdf/hooks/use-pdf-company-letterhead';

export type RoseCompanyStampProps = {
  /** Override the stamp image; defaults to the company's uploaded stamp. */
  stampSrc?: string;
  /** Deprecated compatibility prop; no caption is rendered. */
  labelAr?: string | null;
  /** Stamp width in px — defaults to the shared 150px. */
  width?: number;
  /**
   * Secondary caption sizing for slots that already carry a heading
   * (contract party columns, bordered signature cells).
   */
  compact?: boolean;
  /** Align the block inside its container (defaults to centered). */
  align?: 'center' | 'start';
};

/**
 * Establishment stamp image for Rose print/PDF templates.
 * Visual parity with the backend `buildCompanyStampHtml` — no caption is
 * rendered, or a dotted slot is shown when the asset is missing.
 */
export function RoseCompanyStamp({
  stampSrc: stampSrcProp,
  width = 150,
  compact = false,
  align = 'center',
}: RoseCompanyStampProps) {
  const letterhead = usePdfCompanyLetterhead();
  const stampSrc = stampSrcProp || letterhead.stampSrc;

  return (
    <div
      dir="rtl"
      lang="ar"
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: align === 'start' ? 'flex-start' : 'center',
        gap: 6,
        marginTop: compact ? 10 : 0,
        textAlign: 'center',
        pageBreakInside: 'avoid',
        breakInside: 'avoid',
      }}
    >
      {stampSrc ? (
        // eslint-disable-next-line @next/next/no-img-element -- html2canvas / print capture
        <img
          src={stampSrc}
          alt={COMPANY_STAMP_LABEL_AR}
          style={{
            display: 'block',
            width,
            maxWidth: '100%',
            height: 'auto',
            objectFit: 'contain',
            opacity: 0.92,
          }}
        />
      ) : (
        <div
          style={{
            borderBottom: '1px dotted #333',
            width,
            minHeight: 1,
            marginTop: 26,
          }}
        />
      )}
    </div>
  );
}
