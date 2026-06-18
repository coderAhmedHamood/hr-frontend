'use client';

import * as React from 'react';
import { sanitizePdfText } from '@/components/pdf/lib/sanitize-pdf-text';
import { ROSE_TRADING_EST } from '@/components/pdf/lib/rose-trading-est';

/** Letterhead accent — warm gold (print-safe) */
const LETTERHEAD_GOLD = '#b8933e';

export type RoseTradingLetterheadPrintProps = {
  logoSrc?: string;
  /** Defaults to Rose Trading Arabic name */
  companyNameAr?: string;
  /** Defaults to Rose Trading English name */
  companyNameEn?: string;
  /** س.ت / C.R — defaults from `ROSE_TRADING_EST` */
  commercialReg?: string;
};

/**
 * Print letterhead: **English (physical left)** · logo center · **Arabic (physical right)**.
 * Outer row uses `dir="ltr"` so layout stays correct inside RTL document roots.
 */
export function RoseTradingLetterheadPrint({
  logoSrc,
  companyNameAr,
  companyNameEn,
  commercialReg,
}: RoseTradingLetterheadPrintProps) {
  const nameAr = sanitizePdfText(companyNameAr ?? ROSE_TRADING_EST.nameAr);
  const nameEn = sanitizePdfText(companyNameEn ?? ROSE_TRADING_EST.nameEn);
  const cr = (commercialReg ?? ROSE_TRADING_EST.crNumber).trim();

  return (
    <div style={{ marginBottom: 16, paddingBottom: 12, borderBottom: `2px solid ${LETTERHEAD_GOLD}` }}>
      <div
        dir="ltr"
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
          minHeight: 72,
        }}
      >
        {/* Physical left — English */}
        <div
          style={{
            flex: '1 1 0',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start',
          }}
        >
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: '#111111',
              letterSpacing: 0.6,
              textTransform: 'uppercase',
              textAlign: 'left',
              lineHeight: 1.25,
              fontFamily: 'Arial, Helvetica, sans-serif',
            }}
          >
            {nameEn}
          </div>
          <div
            style={{
              fontSize: 9,
              color: '#111111',
              marginTop: 4,
              textAlign: 'left',
              fontFamily: 'Arial, Helvetica, sans-serif',
            }}
            dir="ltr"
          >
            {`C.R: ${cr}`}
          </div>
        </div>

        {/* Center — logo */}
        <div
          style={{
            flex: '0 0 auto',
            width: 88,
            height: 72,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {logoSrc ? (
            // eslint-disable-next-line @next/next/no-img-element -- html2canvas / print capture
            <img
              src={logoSrc}
              alt=""
              width={72}
              height={72}
              style={{ objectFit: 'contain', maxWidth: '100%', maxHeight: '100%' }}
            />
          ) : null}
        </div>

        {/* Physical right — Arabic: column + dir=rtl → align stretch + textAlign right = flush to page end */}
        <div
          dir="rtl"
          lang="ar"
          style={{
            flex: '1 1 0',
            minWidth: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'stretch',
          }}
        >
          <div
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: '#111111',
              textAlign: 'right',
              lineHeight: 1.25,
              fontFamily: 'Arial, Helvetica, sans-serif',
              width: '100%',
            }}
          >
            {nameAr}
          </div>
          <div
            dir="rtl"
            lang="ar"
            style={{
              marginTop: 4,
              fontSize: 9,
              color: '#111111',
              fontFamily: 'Arial, Helvetica, sans-serif',
              width: '100%',
              textAlign: 'right',
              lineHeight: 1.35,
            }}
          >
            <span>س.ت</span>
            {'\u00a0'}
            <span dir="ltr" style={{ unicodeBidi: 'embed' }}>
              {cr}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
