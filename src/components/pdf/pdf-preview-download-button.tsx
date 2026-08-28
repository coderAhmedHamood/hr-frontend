'use client';

import * as React from 'react';
import { FileDown, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

type PdfPreviewDownloadButtonProps = {
  onClick: () => void;
  disabled?: boolean;
  loading?: boolean;
};

/** Primary PDF action used on employee document detail dialogs (contracts, notices, …). */
export function PdfPreviewDownloadButton({
  onClick,
  disabled,
  loading,
}: PdfPreviewDownloadButtonProps) {
  return (
    <Button
      type="button"
      variant="luxe"
      size="sm"
      className="h-9 gap-1.5 text-xs"
      disabled={disabled || loading}
      onClick={onClick}
    >
      {loading ? (
        <Loader2 className="h-3.5 w-3.5 shrink-0 animate-spin" />
      ) : (
        <FileDown className="h-3.5 w-3.5 shrink-0" />
      )}
      {loading ? 'جاري التحميل…' : 'معاينة / تنزيل PDF'}
    </Button>
  );
}
