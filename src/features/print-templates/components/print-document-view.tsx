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
 * Renders a printable document with the company's template.
 *
 * Inline styles only: the same markup is copied into a print frame that has
 * none of the app's CSS (see print-html.ts).
 */

const INK = '#111827';
const MUTED = '#6b7280';
const RULE = '#d1d5db';

function paperWidth(paper: PrintTemplateSettings['paper']): string {
  if (paper === '58mm') return '48mm';
  if (paper === 'a4') return '180mm';
  return '72mm';
}

function baseFont(settings: PrintTemplateSettings): number {
  if (settings.templateId === 'compact' || settings.paper === '58mm') return 11;
  if (settings.paper === 'a4') return 13;
  return 12;
}

function splitLines(text: string): string[] {
  return text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);
}

function useQrDataUrl(value: string, enabled: boolean): string | null {
  const [url, setUrl] = React.useState<string | null>(null);
  React.useEffect(() => {
    if (!enabled || !value) {
      setUrl(null);
      return;
    }
    let alive = true;
    QRCode.toDataURL(value, { margin: 0, width: 160 })
      .then((u) => alive && setUrl(u))
      .catch(() => alive && setUrl(null));
    return () => {
      alive = false;
    };
  }, [value, enabled]);
  return url;
}

function companyInfoLines(company: PrintCompany, settings: PrintTemplateSettings): string[] {
  const h = settings.header;
  const lines: string[] = [];
  if (h.showAddress && (company.address || company.city)) {
    lines.push([company.city, company.address].filter(Boolean).join(' — '));
  }
  if (h.showPhone && company.phone) lines.push(`هاتف: ${company.phone}`);
  if (h.showTaxNumber && company.taxNumber) lines.push(`الرقم الضريبي: ${company.taxNumber}`);
  if (h.showCommercialRegistration && company.commercialRegistrationNo) {
    lines.push(`السجل التجاري: ${company.commercialRegistrationNo}`);
  }
  return [...lines, ...splitLines(h.extraLines)];
}

function Logo({ company, settings, size }: { company: PrintCompany; settings: PrintTemplateSettings; size: number }) {
  if (!settings.header.showLogo || !company.logoUrl) return null;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={resolveUploadUrl(company.logoUrl)}
      alt=""
      style={{ maxHeight: size, maxWidth: size * 2.2, objectFit: 'contain', display: 'block' }}
    />
  );
}

function Rule({ dashed = false, color = RULE }: { dashed?: boolean; color?: string }) {
  return <div style={{ borderTop: `1px ${dashed ? 'dashed' : 'solid'} ${color}`, margin: '6px 0' }} />;
}

function MetaRows({ document: doc }: { document: PrintableDocument }) {
  return (
    <div>
      {doc.meta.map((m) => (
        <div key={m.label} style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
          <span style={{ color: MUTED }}>{m.label}</span>
          <span>{m.value}</span>
        </div>
      ))}
    </div>
  );
}

function StackedLines({ document: doc }: { document: PrintableDocument }) {
  return (
    <div>
      {doc.lines.map((line, i) => (
        <div key={i} style={{ padding: '3px 0' }}>
          <div style={{ fontWeight: 600 }}>{line.name}</div>
          {line.detail ? <div style={{ color: MUTED, fontSize: '0.9em' }}>{line.detail}</div> : null}
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ color: MUTED }}>
              {line.quantity} × {line.unitPrice}
            </span>
            <span>{line.total}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

function CompactLines({ document: doc }: { document: PrintableDocument }) {
  return (
    <div>
      {doc.lines.map((line, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 6 }}>
          <span>
            {line.quantity}× {line.name}
          </span>
          <span style={{ whiteSpace: 'nowrap' }}>{line.total}</span>
        </div>
      ))}
    </div>
  );
}

function TableLines({ document: doc, bordered }: { document: PrintableDocument; bordered: boolean }) {
  const cell: React.CSSProperties = {
    padding: '3px 4px',
    border: bordered ? `1px solid ${RULE}` : undefined,
    borderBottom: bordered ? undefined : `1px solid ${RULE}`,
    textAlign: 'right',
    verticalAlign: 'top',
  };
  return (
    <table style={{ width: '100%', borderCollapse: 'collapse' }}>
      <thead>
        <tr style={{ background: bordered ? '#f3f4f6' : undefined }}>
          <th style={cell}>الصنف</th>
          <th style={{ ...cell, width: '14%' }}>الكمية</th>
          <th style={{ ...cell, width: '22%' }}>السعر</th>
          <th style={{ ...cell, width: '24%' }}>الإجمالي</th>
        </tr>
      </thead>
      <tbody>
        {doc.lines.map((line, i) => (
          <tr key={i}>
            <td style={cell}>
              {line.name}
              {line.detail ? <div style={{ color: MUTED, fontSize: '0.9em' }}>{line.detail}</div> : null}
            </td>
            <td style={cell}>{line.quantity}</td>
            <td style={cell}>{line.unitPrice}</td>
            <td style={cell}>{line.total}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}

function Totals({ document: doc, accent }: { document: PrintableDocument; accent?: string }) {
  return (
    <div>
      {doc.totals.map((t) => (
        <div
          key={t.label}
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            fontWeight: t.emphasize ? 700 : 400,
            fontSize: t.emphasize ? '1.2em' : undefined,
            color: t.emphasize && accent ? accent : undefined,
            padding: t.emphasize ? '3px 0' : undefined,
          }}
        >
          <span>{t.label}</span>
          <span>{t.value}</span>
        </div>
      ))}
    </div>
  );
}

function Payments({ document: doc }: { document: PrintableDocument }) {
  if (doc.payments.length === 0) return null;
  return (
    <div>
      {doc.payments.map((p, i) => (
        <div key={i} style={{ display: 'flex', justifyContent: 'space-between', color: MUTED }}>
          <span>{p.label}</span>
          <span>{p.value}</span>
        </div>
      ))}
    </div>
  );
}

function Footer({
  document: doc,
  settings,
  qr,
  boxed,
}: {
  document: PrintableDocument;
  settings: PrintTemplateSettings;
  qr: string | null;
  boxed?: boolean;
}) {
  const lines = splitLines(settings.footer.text);
  return (
    <div
      style={{
        textAlign: 'center',
        marginTop: 8,
        padding: boxed ? 6 : undefined,
        border: boxed ? `1px solid ${RULE}` : undefined,
        borderRadius: boxed ? 6 : undefined,
      }}
    >
      {doc.note ? <div style={{ marginBottom: 4 }}>{doc.note}</div> : null}
      {lines.map((l) => (
        <div key={l}>{l}</div>
      ))}
      {qr ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={qr} alt="" style={{ width: 72, height: 72, margin: '6px auto 0', display: 'block' }} />
      ) : null}
      {doc.copyLabel ? <div style={{ marginTop: 4, fontWeight: 700 }}>{doc.copyLabel}</div> : null}
    </div>
  );
}

export function PrintDocumentView({
  document: doc,
  company,
  settings,
}: {
  document: PrintableDocument;
  company: PrintCompany;
  settings: PrintTemplateSettings;
}) {
  const qr = useQrDataUrl(doc.number, settings.footer.showDocumentQr);
  const accent = company.primaryColor || '#1f5f8b';
  const info = companyInfoLines(company, settings);
  const name = settings.header.showCompanyName ? company.nameAr : null;

  const root: React.CSSProperties = {
    width: paperWidth(settings.paper),
    color: INK,
    background: '#ffffff',
    fontFamily: 'Tahoma, "Segoe UI", Arial, sans-serif',
    fontSize: baseFont(settings),
    lineHeight: 1.45,
    direction: 'rtl',
    padding: settings.paper === 'a4' ? '6mm' : '3mm',
    boxSizing: 'border-box',
  };

  const title = (
    <div style={{ textAlign: 'center', margin: '4px 0' }}>
      <div style={{ fontWeight: 700, fontSize: '1.1em' }}>{doc.title}</div>
      <div style={{ color: MUTED }}>
        {doc.number} · {doc.issuedAt}
      </div>
    </div>
  );

  switch (settings.templateId) {
    case 'modern':
      return (
        <div style={root} data-template={settings.templateId}>
          <div style={{ background: accent, color: '#fff', borderRadius: 6, padding: 8, textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
              <Logo company={company} settings={settings} size={40} />
            </div>
            {name ? <div style={{ fontWeight: 700, fontSize: '1.2em' }}>{name}</div> : null}
            {info.map((l) => (
              <div key={l} style={{ opacity: 0.9, fontSize: '0.92em' }}>
                {l}
              </div>
            ))}
          </div>
          {title}
          <MetaRows document={doc} />
          <Rule />
          <StackedLines document={doc} />
          <Rule />
          <div style={{ background: '#f3f4f6', borderRadius: 6, padding: 6 }}>
            <Totals document={doc} accent={accent} />
          </div>
          <div style={{ marginTop: 4 }}>
            <Payments document={doc} />
          </div>
          <Footer document={doc} settings={settings} qr={qr} />
        </div>
      );

    case 'compact':
      return (
        <div style={root} data-template={settings.templateId}>
          <div style={{ textAlign: 'center' }}>
            {name ? <div style={{ fontWeight: 700 }}>{name}</div> : null}
            {info.slice(0, 2).map((l) => (
              <div key={l}>{l}</div>
            ))}
          </div>
          <Rule dashed />
          <div style={{ display: 'flex', justifyContent: 'space-between' }}>
            <span>{doc.number}</span>
            <span>{doc.issuedAt}</span>
          </div>
          <Rule dashed />
          <CompactLines document={doc} />
          <Rule dashed />
          <Totals document={doc} />
          <Payments document={doc} />
          <Footer document={doc} settings={settings} qr={qr} />
        </div>
      );

    case 'formal':
      return (
        <div style={root} data-template={settings.templateId}>
          <div style={{ border: `1px solid ${INK}`, padding: 6 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <div>
                {name ? <div style={{ fontWeight: 700, fontSize: '1.15em' }}>{name}</div> : null}
                {company.nameEn && settings.header.showCompanyName ? (
                  <div style={{ color: MUTED, direction: 'ltr', textAlign: 'right' }}>{company.nameEn}</div>
                ) : null}
              </div>
              <Logo company={company} settings={settings} size={44} />
            </div>
            {info.length > 0 ? (
              <table style={{ width: '100%', borderCollapse: 'collapse', marginTop: 4 }}>
                <tbody>
                  {info.map((l) => (
                    <tr key={l}>
                      <td style={{ borderTop: `1px solid ${RULE}`, padding: '2px 0' }}>{l}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            ) : null}
          </div>
          <div style={{ textAlign: 'center', fontWeight: 700, margin: '6px 0', fontSize: '1.1em' }}>{doc.title}</div>
          <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: 6 }}>
            <tbody>
              {[{ label: 'رقم المستند', value: doc.number }, { label: 'التاريخ', value: doc.issuedAt }, ...doc.meta].map((m) => (
                <tr key={m.label}>
                  <td style={{ border: `1px solid ${RULE}`, padding: '2px 4px', color: MUTED, width: '40%' }}>{m.label}</td>
                  <td style={{ border: `1px solid ${RULE}`, padding: '2px 4px' }}>{m.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <TableLines document={doc} bordered />
          <div style={{ border: `1px solid ${RULE}`, borderTop: 'none', padding: 4 }}>
            <Totals document={doc} />
          </div>
          <div style={{ marginTop: 4 }}>
            <Payments document={doc} />
          </div>
          <Footer document={doc} settings={settings} qr={qr} />
        </div>
      );

    case 'elegant':
      return (
        <div style={root} data-template={settings.templateId}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
            <div>
              {name ? <div style={{ fontWeight: 700, fontSize: '1.2em', letterSpacing: 0.3 }}>{name}</div> : null}
              {info.map((l) => (
                <div key={l} style={{ color: MUTED, fontSize: '0.92em' }}>
                  {l}
                </div>
              ))}
            </div>
            <Logo company={company} settings={settings} size={48} />
          </div>
          <Rule color={accent} />
          {title}
          <MetaRows document={doc} />
          <Rule />
          <TableLines document={doc} bordered={false} />
          <div style={{ marginTop: 6 }}>
            <Totals document={doc} accent={accent} />
          </div>
          <Rule />
          <Payments document={doc} />
          <Footer document={doc} settings={settings} qr={qr} boxed />
        </div>
      );

    case 'classic':
    default:
      return (
        <div style={root} data-template={settings.templateId}>
          <div style={{ textAlign: 'center' }}>
            <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 4 }}>
              <Logo company={company} settings={settings} size={48} />
            </div>
            {name ? <div style={{ fontWeight: 700, fontSize: '1.15em' }}>{name}</div> : null}
            {info.map((l) => (
              <div key={l} style={{ color: MUTED }}>
                {l}
              </div>
            ))}
          </div>
          <Rule dashed />
          {title}
          <MetaRows document={doc} />
          <Rule dashed />
          <StackedLines document={doc} />
          <Rule dashed />
          <Totals document={doc} />
          <Rule dashed />
          <Payments document={doc} />
          <Footer document={doc} settings={settings} qr={qr} />
        </div>
      );
  }
}
