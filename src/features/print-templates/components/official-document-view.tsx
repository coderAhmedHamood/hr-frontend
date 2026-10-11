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
 * The one official A4 sheet. Layout and table style come from the company
 * identity; the title, rows and signatures come from the document.
 */

const INK = '#1f2937';
const MUTED = '#6b7280';
const LINE = '#e5e7eb';

function accentOf(company: PrintCompany): string {
  return /^#[0-9a-f]{6}$/i.test(company.primaryColor ?? '') ? company.primaryColor! : '#6d4c9a';
}

function softOf(company: PrintCompany): string {
  return /^#[0-9a-f]{6}$/i.test(company.secondaryColor ?? '') ? company.secondaryColor! : '#ece8f3';
}

function linesOf(text: string): string[] {
  return text.split('\n').map((line) => line.trim()).filter(Boolean);
}

function useQr(value: string, enabled: boolean): string | null {
  const [url, setUrl] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!enabled || !value) {
      setUrl(null);
      return;
    }
    let alive = true;
    QRCode.toDataURL(value, { margin: 0, width: 140 })
      .then((next) => alive && setUrl(next))
      .catch(() => alive && setUrl(null));
    return () => {
      alive = false;
    };
  }, [value, enabled]);
  return url;
}

function Logo({ company, light = false }: { company: PrintCompany; light?: boolean }) {
  if (company.logoUrl) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={resolveUploadUrl(company.logoUrl)}
        alt=""
        style={{ maxHeight: 54, maxWidth: 150, objectFit: 'contain', display: 'block' }}
      />
    );
  }
  return (
    <div style={{ fontWeight: 700, fontSize: 18, color: light ? '#fff' : accentOf(company) }}>
      {company.nameAr}
    </div>
  );
}

export function OfficialDocumentView({
  document: doc,
  company,
  settings,
}: {
  document: PrintableDocument;
  company: PrintCompany;
  settings: PrintTemplateSettings;
}) {
  const accent = accentOf(company);
  const soft = softOf(company);
  const qr = useQr(doc.number, settings.footer.showDocumentQr);
  const stock = doc.columns === 'stock';
  const units = stock && doc.lines.some((line) => line.unit);
  const wave = settings.layout === 'wave';
  const boxed = settings.layout === 'boxed' || settings.tableStyle === 'boxed';
  const striped = settings.layout === 'striped' || settings.tableStyle === 'striped';
  const bubble = settings.tableStyle === 'bubble';
  const headerFill = settings.tableStyle === 'light' || settings.tableStyle === 'bubble' || wave;
  const address = [
    settings.header.showAddress ? [company.address, company.city, company.country].filter(Boolean).join('، ') : '',
    settings.header.showPhone && company.phone ? company.phone : '',
    settings.header.showTaxNumber && company.taxNumber ? `الرقم الضريبي: ${company.taxNumber}` : '',
    settings.header.showCommercialRegistration && company.commercialRegistrationNo
      ? `السجل التجاري: ${company.commercialRegistrationNo}`
      : '',
    ...linesOf(settings.header.extraLines),
  ].filter(Boolean);
  const contacts = [
    company.email,
    company.website,
    settings.header.showPhone ? company.phone : '',
  ].filter(Boolean);
  const signatures = settings.footer.showSignatures !== false ? (doc.signatures ?? []) : [];

  const cell = (header = false): React.CSSProperties => ({
    padding: '7px 8px',
    textAlign: 'right',
    verticalAlign: 'top',
    border: boxed ? `1px solid ${LINE}` : undefined,
    borderBottom: boxed ? undefined : `1px solid ${LINE}`,
    color: header && headerFill ? '#fff' : INK,
    fontWeight: header ? 700 : 400,
    fontSize: header ? 12 : 13,
  });

  return (
    <div
      data-template={`official-${settings.layout}-${settings.tableStyle}`}
      style={{
        width: '190mm',
        minHeight: '260mm',
        boxSizing: 'border-box',
        background: '#fff',
        color: INK,
        fontFamily: 'Tahoma, "Segoe UI", Arial, sans-serif',
        fontSize: 13,
        lineHeight: 1.45,
        direction: 'rtl',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <header
        style={{
          background: wave ? accent : '#fff',
          color: wave ? '#fff' : INK,
          borderBottomLeftRadius: wave ? '80px 28px' : 0,
          borderBottomRightRadius: wave ? '80px 28px' : 0,
          padding: wave ? '18px 16mm 28px' : '12mm 14mm 0',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 16 }}>
          <div style={{ fontSize: 11, lineHeight: 1.6, color: wave ? 'rgba(255,255,255,0.92)' : MUTED }}>
            {address.map((line) => (
              <div key={line}>{line}</div>
            ))}
          </div>
          {settings.header.showLogo ? <Logo company={company} light={wave} /> : null}
        </div>
      </header>

      <div style={{ padding: '8mm 14mm 0', flex: 1 }}>
        {settings.header.showCompanyName ? (
          <div style={{ fontWeight: 700, fontSize: 16 }}>{company.nameAr}</div>
        ) : null}
        {settings.slogan ? <div style={{ color: MUTED, marginTop: 2 }}>{settings.slogan}</div> : null}

        <div style={{ textAlign: 'center', margin: '18px 0 14px' }}>
          <div style={{ fontSize: 22, fontWeight: 700 }}>
            {doc.title} {doc.number}
          </div>
          <div style={{ color: MUTED, marginTop: 2 }}>{doc.issuedAt}</div>
        </div>

        {doc.meta.length > 0 ? (
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: '1fr 1fr',
              gap: '4px 18px',
              marginBottom: 14,
              padding: boxed ? 8 : 0,
              border: boxed ? `1px solid ${LINE}` : undefined,
            }}
          >
            {doc.meta.map((item) => (
              <div key={item.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <span style={{ color: MUTED }}>{item.label}</span>
                <span>{item.value}</span>
              </div>
            ))}
          </div>
        ) : null}

        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ background: headerFill ? accent : striped ? soft : '#fff' }}>
              <th style={{ ...cell(true), width: '8%' }}>#</th>
              <th style={cell(true)}>الصنف</th>
              <th style={{ ...cell(true), width: '14%' }}>الكمية</th>
              {stock ? (
                <>
                  {units ? <th style={{ ...cell(true), width: '12%' }}>الوحدة</th> : null}
                  <th style={{ ...cell(true), width: '24%' }}>الموقع</th>
                </>
              ) : (
                <>
                  <th style={{ ...cell(true), width: '16%' }}>السعر</th>
                  <th style={{ ...cell(true), width: '18%' }}>الإجمالي</th>
                </>
              )}
            </tr>
          </thead>
          <tbody>
            {doc.lines.map((line, index) => (
              <tr key={`${line.name}-${index}`} style={{ background: striped && index % 2 === 0 ? soft : '#fff' }}>
                <td style={cell()}>{index + 1}</td>
                <td style={cell()}>
                  {line.name}
                  {line.detail ? <div style={{ color: MUTED, fontSize: 11 }}>{line.detail}</div> : null}
                </td>
                <td style={cell()}>{line.quantity}</td>
                {stock ? (
                  <>
                    {units ? <td style={cell()}>{line.unit ?? ''}</td> : null}
                    <td style={cell()}>{line.location ?? ''}</td>
                  </>
                ) : (
                  <>
                    <td style={cell()}>{line.unitPrice}</td>
                    <td style={cell()}>{line.total}</td>
                  </>
                )}
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: 10, marginRight: 'auto', width: '46%' }}>
          {doc.totals.map((total) => (
            <div
              key={total.label}
              style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '3px 0' }}
            >
              <span>{total.label}</span>
              {total.emphasize && (bubble || headerFill) ? (
                <span
                  style={{
                    background: accent,
                    color: '#fff',
                    borderRadius: bubble ? 999 : 4,
                    padding: '2px 10px',
                    fontWeight: 700,
                  }}
                >
                  {total.value}
                </span>
              ) : (
                <span style={{ fontWeight: total.emphasize ? 700 : 400 }}>{total.value}</span>
              )}
            </div>
          ))}
          {doc.payments.map((payment) => (
            <div
              key={payment.label}
              style={{ display: 'flex', justifyContent: 'space-between', gap: 12, color: MUTED, padding: '2px 0' }}
            >
              <span>{payment.label}</span>
              <span>{payment.value}</span>
            </div>
          ))}
        </div>

        {doc.note ? <p style={{ marginTop: 16 }}>{doc.note}</p> : null}
        {doc.copyLabel ? <p style={{ marginTop: 8, fontWeight: 700 }}>{doc.copyLabel}</p> : null}

        {signatures.length > 0 ? (
          <div style={{ display: 'flex', gap: 18, marginTop: 28 }}>
            {signatures.map((label) => (
              <div key={label} style={{ flex: 1, textAlign: 'center' }}>
                <div style={{ borderBottom: `1px solid ${INK}`, height: 36 }} />
                <div style={{ color: MUTED, marginTop: 4 }}>{label}</div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      <footer
        style={{
          marginTop: 24,
          background: wave ? soft : '#fff',
          borderTopLeftRadius: wave ? '80px 28px' : 0,
          borderTopRightRadius: wave ? '80px 28px' : 0,
          padding: wave ? '22px 14mm 12px' : '8px 14mm 12px',
          textAlign: 'center',
          color: MUTED,
          fontSize: 11,
        }}
      >
        {linesOf(settings.footer.text).map((line) => (
          <div key={line}>{line}</div>
        ))}
        {contacts.length > 0 ? <div>{contacts.join(' · ')}</div> : null}
        {qr ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={qr} alt="" style={{ width: 58, height: 58, margin: '8px auto 0', display: 'block' }} />
        ) : null}
      </footer>
    </div>
  );
}
