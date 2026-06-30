'use client';

import * as React from 'react';
import { RoseTradingLetterheadPrint } from '@/components/pdf/print/rose-trading-letterhead-print';
import {
  ROSE_DOCUMENT_PAGE_STYLE,
  RoseDocumentBlockView,
  RoseDocumentTitle,
  roseDocumentRootAttrs,
} from '@/components/pdf/rose-trading/rose-document-pdf-blocks';
import type { RoseDocumentPrintModel } from '@/features/hr/organization/employees/lib/rose-document-templates/types';

export type RoseDocumentTemplatePrintHtmlProps = RoseDocumentPrintModel & {
  logoSrc?: string;
};

/** @deprecated Use RoseDocumentTemplatePrintHtml */
export type RoseResignationTemplatePrintHtmlProps = RoseDocumentTemplatePrintHtmlProps;

export const RoseDocumentTemplatePrintHtml = React.forwardRef<
  HTMLDivElement,
  RoseDocumentTemplatePrintHtmlProps
>(function RoseDocumentTemplatePrintHtml(props, ref) {
  const { language, companyNameAr, companyNameEn, blocks } = props;

  const titleBlock = blocks.find((b) => b.type === 'title');
  const contentBlocks = blocks.filter((b) => b.type !== 'title');
  const root = roseDocumentRootAttrs(language);

  return (
    <div ref={ref} dir={root.dir} lang={root.lang} style={ROSE_DOCUMENT_PAGE_STYLE}>
      <RoseTradingLetterheadPrint
        companyNameAr={companyNameAr}
        companyNameEn={companyNameEn}
      />

      {titleBlock?.type === 'title' ? (
        <RoseDocumentTitle
          language={language}
          text={titleBlock.text}
          variant={titleBlock.variant}
        />
      ) : null}

      {contentBlocks.map((block, index) => (
        <RoseDocumentBlockView
          key={`${block.type}-${'locale' in block ? block.locale : 'shared'}-${index}`}
          block={block}
        />
      ))}
    </div>
  );
});

export const RoseResignationTemplatePrintHtml = RoseDocumentTemplatePrintHtml;
