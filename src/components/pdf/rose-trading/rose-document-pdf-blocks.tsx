'use client';

import * as React from 'react';
import { sanitizePdfText } from '@/components/pdf/lib/sanitize-pdf-text';
import {
  LOCALE_META,
  pickLocalized,
  resolveActiveLocales,
  documentRootLocale,
} from '@/features/hr/organization/employees/lib/rose-document-templates/localized-text';
import type {
  DocumentLocale,
  LocalizedText,
  RoseDocumentBlock,
  RoseDocumentLanguage,
  RoseFieldRow,
} from '@/features/hr/organization/employees/lib/rose-document-templates/types';

export const ROSE_DOCUMENT_PAGE_STYLE: React.CSSProperties = {
  position: 'relative',
  width: '210mm',
  maxWidth: '100%',
  margin: '0 auto',
  boxSizing: 'border-box',
  backgroundColor: '#ffffff',
  padding: '28px 24px 44px',
  fontFamily: 'Arial, Helvetica, sans-serif',
  color: '#111',
  display: 'flex',
  flexDirection: 'column',
  overflow: 'hidden',
};

const BODY_TEXT: React.CSSProperties = {
  fontSize: 12,
  lineHeight: 1.85,
};

function chunkPairs<T>(items: T[]): [T | undefined, T | undefined][] {
  const pairs: [T | undefined, T | undefined][] = [];
  for (let i = 0; i < items.length; i += 2) {
    pairs.push([items[i], items[i + 1]]);
  }
  return pairs;
}

function localeParagraphStyle(locale: DocumentLocale, extra?: React.CSSProperties): React.CSSProperties {
  const meta = LOCALE_META[locale];
  return {
    ...BODY_TEXT,
    textAlign: meta.textAlign,
    ...extra,
  };
}

export function RoseDocumentTitle({
  language,
  text,
  variant = 'boxed',
}: {
  language: RoseDocumentLanguage;
  text: LocalizedText;
  variant?: 'boxed' | 'underlined';
}) {
  const locales = resolveActiveLocales(language);

  if (variant === 'underlined') {
    return (
      <div
        dir="rtl"
        style={{
          fontSize: 16,
          fontWeight: 700,
          textAlign: 'center',
          marginBottom: 16,
          textDecoration: 'underline',
        }}
      >
        {locales.map((locale, index) => (
          <React.Fragment key={locale}>
            {index > 0 ? (
              <div style={{ margin: '4px 0', fontSize: 10, color: '#64748b' }}>—</div>
            ) : null}
            <div dir={LOCALE_META[locale].dir} lang={locale}>
              {sanitizePdfText(pickLocalized(text, locale))}
            </div>
          </React.Fragment>
        ))}
      </div>
    );
  }

  return (
    <div
      dir="rtl"
      style={{
        border: '1px solid #111',
        padding: '8px 16px',
        fontSize: 13,
        fontWeight: 700,
        textAlign: 'center',
        marginBottom: 16,
        width: '60%',
        marginInline: 'auto',
      }}
    >
      {locales.map((locale, index) => (
        <React.Fragment key={locale}>
          {index > 0 ? (
            <div style={{ margin: '4px 0', fontSize: 10, color: '#64748b' }}>—</div>
          ) : null}
          <div dir={LOCALE_META[locale].dir} lang={locale} style={locale === 'en' ? { fontSize: 12 } : undefined}>
            {sanitizePdfText(pickLocalized(text, locale))}
          </div>
        </React.Fragment>
      ))}
    </div>
  );
}

export function RoseDocumentFieldGrid({
  locale,
  rows,
}: {
  locale: DocumentLocale;
  rows: RoseFieldRow[];
}) {
  const meta = LOCALE_META[locale];
  const pairs = chunkPairs(rows);

  return (
    <div
      dir={meta.dir}
      lang={meta.lang}
      style={{ border: '1px solid #111', fontSize: 11, marginBottom: 16 }}
    >
      {pairs.map(([left, right], rowIdx) => (
        <div
          key={rowIdx}
          style={{
            display: 'flex',
            flexDirection: 'row',
            borderBottom: rowIdx < pairs.length - 1 ? '1px solid #111' : undefined,
          }}
        >
          {[left, right].map((slot, colIdx) => {
            if (!slot) {
              return (
                <div
                  key={colIdx}
                  style={{
                    width: '50%',
                    borderInlineEnd: colIdx === 0 ? '1px solid #111' : undefined,
                  }}
                />
              );
            }
            return (
              <div
                key={colIdx}
                style={{
                  width: '50%',
                  display: 'flex',
                  flexDirection: 'row',
                  borderInlineEnd: colIdx === 0 ? '1px solid #111' : undefined,
                }}
              >
                <div
                  style={{
                    width: '42%',
                    borderInlineEnd: '1px solid #111',
                    padding: '6px 8px',
                    fontWeight: 700,
                    textAlign: meta.textAlign,
                  }}
                >
                  {sanitizePdfText(slot.label)}
                </div>
                <div style={{ flex: 1, padding: '6px 8px', textAlign: meta.textAlign }} dir={meta.dir}>
                  {sanitizePdfText(slot.value)}
                </div>
              </div>
            );
          })}
        </div>
      ))}
    </div>
  );
}

export function RoseDocumentParagraphs({
  locale,
  lines,
  spacing = 'normal',
}: {
  locale: DocumentLocale;
  lines: string[];
  spacing?: 'normal' | 'compact';
}) {
  const meta = LOCALE_META[locale];
  return (
    <div dir={meta.dir} lang={meta.lang}>
      {lines.map((line, index) => (
        <p
          key={index}
          style={localeParagraphStyle(
            locale,
            index === 0
              ? { marginBottom: spacing === 'compact' ? 6 : 12, marginTop: index > 0 && spacing === 'compact' ? 6 : 0 }
              : { marginTop: 6 },
          )}
        >
          {sanitizePdfText(line)}
        </p>
      ))}
    </div>
  );
}

export function RoseDocumentReasons({
  locale,
  heading,
  lines,
}: {
  locale: DocumentLocale;
  heading: string;
  lines: string[];
}) {
  const meta = LOCALE_META[locale];
  return (
    <div
      dir={meta.dir}
      lang={meta.lang}
      style={{
        border: '1px solid #111',
        padding: '10px 12px',
        fontSize: 12,
        lineHeight: 1.85,
        textAlign: meta.textAlign,
        marginBottom: 16,
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 6 }}>{sanitizePdfText(heading)}</div>
      {lines.map((line, index) => (
        <div key={index}>–{sanitizePdfText(line)}</div>
      ))}
    </div>
  );
}

export function RoseDocumentSignatureFooter({
  locale,
  applicantLabel,
  applicantName,
  signatureLabel,
  dateLabel,
  dateGregorian,
}: {
  locale: DocumentLocale;
  applicantLabel: string;
  applicantName: string;
  signatureLabel: string;
  dateLabel: string;
  dateGregorian: string;
}) {
  const meta = LOCALE_META[locale];
  const rows = [
    { label: applicantLabel, value: applicantName, ltrValue: false },
    { label: signatureLabel, value: '.....................................................................', ltrValue: false },
    { label: dateLabel, value: dateGregorian, ltrValue: true },
  ];

  return (
    <div
      dir={meta.dir}
      lang={meta.lang}
      style={{ marginTop: 24, border: '1px solid #111', fontSize: 11 }}
    >
      {rows.map((row, index) => (
        <div
          key={row.label}
          style={{
            display: 'flex',
            flexDirection: 'row',
            borderBottom: index < rows.length - 1 ? '1px solid #111' : undefined,
          }}
        >
          <div
            style={{
              width: '35%',
              borderInlineEnd: '1px solid #111',
              padding: '6px 8px',
              fontWeight: 700,
              textAlign: meta.textAlign,
              fontSize: 10.5,
            }}
          >
            {sanitizePdfText(row.label)}
          </div>
          <div style={{ flex: 1, padding: '6px 8px', textAlign: meta.textAlign, fontSize: 10.5 }}>
            {row.ltrValue ? <span dir="ltr">{sanitizePdfText(row.value)}</span> : sanitizePdfText(row.value)}
          </div>
        </div>
      ))}
    </div>
  );
}

export function RoseDocumentLabeledRows({
  locale,
  rows,
}: {
  locale: DocumentLocale;
  rows: RoseFieldRow[];
}) {
  const meta = LOCALE_META[locale];
  return (
    <div dir={meta.dir} lang={meta.lang}>
      {rows.map((row) => (
        <div
          key={row.label}
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-end',
            gap: 8,
            marginBottom: 8,
            borderBottom: '0.5px solid #ccc',
            paddingBottom: 4,
          }}
        >
          <span style={{ fontWeight: 700, fontSize: 10, minWidth: 90, textAlign: meta.textAlign }}>
            {sanitizePdfText(row.label)}
          </span>
          <span
            dir={row.label.includes('ID') || row.label.includes('هوية') ? 'ltr' : meta.dir}
            style={{ flex: 1, fontSize: 10, textAlign: meta.textAlign }}
          >
            {sanitizePdfText(row.value)}
          </span>
        </div>
      ))}
    </div>
  );
}

export function RoseDocumentTextBox({
  locale,
  heading,
  content,
}: {
  locale: DocumentLocale;
  heading: string;
  content: string;
}) {
  const meta = LOCALE_META[locale];
  return (
    <div dir={meta.dir} lang={meta.lang}>
      <div style={{ fontWeight: 700, fontSize: 11, marginTop: 10, marginBottom: 6, textAlign: meta.textAlign }}>
        {sanitizePdfText(heading)}
      </div>
      <div
        style={{
          border: '1px solid #bbb',
          borderRadius: 4,
          padding: 10,
          marginTop: 8,
          backgroundColor: '#fafafa',
          fontSize: 10,
          lineHeight: 1.65,
          textAlign: meta.textAlign,
          color: '#222',
        }}
      >
        {sanitizePdfText(content)}
      </div>
    </div>
  );
}

export function RoseDocumentInlineSignatureFooter({
  locale,
  nameLabel,
  name,
  dateLabel,
  dateGregorian,
  signatureLabel,
}: {
  locale: DocumentLocale;
  nameLabel: string;
  name: string;
  dateLabel: string;
  dateGregorian: string;
  signatureLabel: string;
}) {
  const meta = LOCALE_META[locale];
  const cols = [
    { label: nameLabel, value: name, lat: false },
    { label: dateLabel, value: dateGregorian, lat: true },
    { label: signatureLabel, value: '', lat: false },
  ];

  return (
    <div
      dir={meta.dir}
      lang={meta.lang}
      style={{
        paddingTop: 20,
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        gap: 12,
      }}
    >
      {cols.map((col) => (
        <div key={col.label} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <span style={{ fontSize: 9, marginBottom: 28, textAlign: 'center' }}>{sanitizePdfText(col.label)}</span>
          {col.value ? (
            <span
              style={{
                marginBottom: 8,
                fontSize: col.lat ? 9 : 10,
                color: col.lat ? '#444' : '#222',
                textAlign: 'center',
                ...(col.lat ? { direction: 'ltr' as const } : {}),
              }}
            >
              {sanitizePdfText(col.value)}
            </span>
          ) : (
            <div style={{ marginBottom: 8, minHeight: 9 }} />
          )}
          <div style={{ width: '100%', maxWidth: 140, height: 1, backgroundColor: '#000' }} />
        </div>
      ))}
    </div>
  );
}

export function RoseDocumentManagerSignature({
  locale,
  title,
}: {
  locale: DocumentLocale;
  title: string;
}) {
  const meta = LOCALE_META[locale];
  return (
    <div
      dir={meta.dir}
      lang={meta.lang}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', marginTop: 32 }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, textAlign: 'center' }}>{sanitizePdfText(title)}</div>
      <div style={{ width: 220, height: 1, backgroundColor: '#000', marginTop: 8 }} />
      <div style={{ marginTop: 4, fontSize: 10, color: '#64748b', textAlign: 'center' }}>
        ............................................
      </div>
    </div>
  );
}

function RoseDocumentSpacer({ size = 'md' }: { size?: 'sm' | 'md' | 'lg' }) {
  const heights = { sm: 12, md: 24, lg: 48 };
  return <div style={{ height: heights[size] }} aria-hidden />;
}

export function RoseDocumentBlockView({ block }: { block: RoseDocumentBlock }) {
  switch (block.type) {
    case 'title':
      return null;
    case 'field_grid':
      return <RoseDocumentFieldGrid locale={block.locale} rows={block.rows} />;
    case 'labeled_rows':
      return <RoseDocumentLabeledRows locale={block.locale} rows={block.rows} />;
    case 'paragraphs':
      return (
        <RoseDocumentParagraphs
          locale={block.locale}
          lines={block.lines}
          spacing={block.spacing}
        />
      );
    case 'reasons':
      return (
        <RoseDocumentReasons
          locale={block.locale}
          heading={block.heading}
          lines={block.lines}
        />
      );
    case 'text_box':
      return (
        <RoseDocumentTextBox
          locale={block.locale}
          heading={block.heading}
          content={block.content}
        />
      );
    case 'signature_footer':
      return (
        <RoseDocumentSignatureFooter
          locale={block.locale}
          applicantLabel={block.applicantLabel}
          applicantName={block.applicantName}
          signatureLabel={block.signatureLabel}
          dateLabel={block.dateLabel}
          dateGregorian={block.dateGregorian}
        />
      );
    case 'inline_signature_footer':
      return (
        <RoseDocumentInlineSignatureFooter
          locale={block.locale}
          nameLabel={block.nameLabel}
          name={block.name}
          dateLabel={block.dateLabel}
          dateGregorian={block.dateGregorian}
          signatureLabel={block.signatureLabel}
        />
      );
    case 'manager_signature':
      return <RoseDocumentManagerSignature locale={block.locale} title={block.title} />;
    case 'spacer':
      return <RoseDocumentSpacer size={block.size} />;
    default:
      return null;
  }
}

export function roseDocumentRootAttrs(language: RoseDocumentLanguage) {
  const locale = documentRootLocale(language);
  const meta = LOCALE_META[locale];
  return { dir: meta.dir, lang: meta.lang };
}
