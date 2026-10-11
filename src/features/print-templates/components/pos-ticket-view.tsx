'use client';

import * as React from 'react';
import QRCode from 'qrcode';
import { resolveUploadUrl } from '@/shared/resolve-upload-url';
import type {
  PrintCompany,
  PrintableDocument,
  PrintTemplateSettings,
} from '@/features/print-templates/domain/types';

/**
 * The only thermal document: a narrow POS ticket. It does not inherit the
 * official A4 layout.
 */

const INK = '#111827';
const MUTED = '#4b5563';

function useQr(value: string, enabled: boolean): string | null {
  const [url, setUrl] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!enabled || !value) {
      setUrl(null);
      return;
    }
    let alive = true;
    QRCode.toDataURL(value, { margin: 1, width: 280 })
      .then((next) => alive && setUrl(next))
      .catch(() => alive && setUrl(null));
    return () => {
      alive = false;
    };
  }, [value, enabled]);
  return url;
}

export function PosTicketView({
  document: doc,
  company,
  settings,
}: {
  document: PrintableDocument;
  company: PrintCompany;
  settings: PrintTemplateSettings;
}) {
  const qr = useQr(doc.number, settings.footer.showDocumentQr);
  const width = settings.paper === '58mm' ? '52mm' : '72mm';
  const cashier = doc.meta.find((item) => item.label === 'الكاشير')?.value;
  const details = lines(settings.header.extraLines);

  return (
    <div
      data-template="pos-ticket"
      style={{
        width,
        boxSizing: 'border-box',
        background: '#fff',
        color: INK,
        fontFamily: 'Tahoma, "Segoe UI", Arial, sans-serif',
        fontSize: settings.paper === '58mm' ? 11 : 12,
        lineHeight: 1.4,
        direction: 'rtl',
        padding: '4mm 3mm',
        textAlign: 'center',
      }}
    >
      {settings.header.showLogo && company.logoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={resolveUploadUrl(company.logoUrl)}
          alt=""
          style={{ maxHeight: 42, maxWidth: '70%', objectFit: 'contain', margin: '0 auto 8px', display: 'block' }}
        />
      ) : null}
      {settings.header.showCompanyName ? (
        <div style={{ fontWeight: 700, fontSize: '1.05em' }}>{company.nameAr}</div>
      ) : null}
      {qr ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={qr} alt="" style={{ width: 132, height: 132, margin: '10px auto', display: 'block' }} />
      ) : null}
      <div style={{ fontWeight: 700 }}>{doc.number}</div>
      <div style={{ color: MUTED }}>{doc.issuedAt}</div>
      {cashier ? <div style={{ marginTop: 2 }}>الكاشير: {cashier}</div> : null}
      <div style={{ fontWeight: 800, fontSize: '1.35em', marginTop: 10 }}>{doc.title}</div>

      <div style={{ textAlign: 'right', marginTop: 10 }}>
        {doc.lines.map((line, index) => (
          <div key={`${line.name}-${index}`} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, padding: '3px 0' }}>
            <span>
              <b>{line.quantity}</b> {line.name}
              {line.detail || line.unitPrice ? (
                <span style={{ display: 'block', color: MUTED, fontSize: '0.86em' }}>
                  {[line.unitPrice ? `${line.unitPrice} / الوحدة` : '', line.detail].filter(Boolean).join(' · ')}
                </span>
              ) : null}
            </span>
            <span style={{ whiteSpace: 'nowrap' }}>{line.total ?? line.quantity}</span>
          </div>
        ))}
      </div>

      <div style={{ borderTop: `1px dashed ${INK}`, margin: '8px 0' }} />
      {doc.totals.map((total) => (
        <div key={total.label} style={{ display: 'flex', justifyContent: 'space-between', fontWeight: total.emphasize ? 800 : 400 }}>
          <span>{total.label}</span>
          <span>{total.value}</span>
        </div>
      ))}
      {doc.payments.map((payment) => (
        <div key={payment.label} style={{ display: 'flex', justifyContent: 'space-between', color: MUTED }}>
          <span>{payment.label}</span>
          <span>{payment.value}</span>
        </div>
      ))}
      {doc.note ? <div style={{ marginTop: 8 }}>{doc.note}</div> : null}
      {lines(settings.footer.text).map((line) => (
        <div key={line} style={{ marginTop: 4 }}>{line}</div>
      ))}
      {details.map((line) => (
        <div key={line} style={{ color: MUTED }}>{line}</div>
      ))}
      {doc.copyLabel ? <div style={{ marginTop: 6, fontWeight: 700 }}>{doc.copyLabel}</div> : null}
    </div>
  );
}

function lines(text: string): string[] {
  return text.split('\n').map((line) => line.trim()).filter(Boolean);
}
