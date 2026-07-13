'use client';

import { Download, ExternalLink, FileText, ImageIcon } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { DisplayDate } from '@/components/ui/table-cells';
import { resolveUploadUrl } from '@/shared/resolve-upload-url';
import {
  employeeAttachmentDocumentTypeLabel,
  employeeAttachmentUploadCategoryLabel,
} from '@/features/hr/organization/employees/constants/employee-attachment-document-types';
import {
  formatAttachmentSize,
  isImageAttachment,
  isPdfAttachment,
} from '@/features/hr/organization/employees/lib/employee-attachments-utils';
import type { EmployeeAttachmentDto } from '@/features/hr/organization/employees/lib/api/employee-attachments';

type Props = {
  attachment: EmployeeAttachmentDto | null;
  onOpenChange: (open: boolean) => void;
};

export function EmployeeAttachmentDetailDialog({ attachment, onOpenChange }: Props) {
  const open = attachment != null;
  const fileUrl = attachment ? resolveUploadUrl(attachment.url) : '';
  const tags = attachment?.tags ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg border-border" dir="rtl">
        {attachment ? (
          <>
            <DialogHeader>
              <DialogTitle className="font-display">{attachment.name}</DialogTitle>
              <DialogDescription className="text-xs">
                {attachment.originalFileName}
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-1">
              {isImageAttachment(attachment.mimeType) ? (
                <div className="overflow-hidden rounded-xl border border-border bg-muted/20">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={fileUrl}
                    alt={attachment.name}
                    className="max-h-64 w-full object-contain"
                  />
                </div>
              ) : (
                <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-4 py-5">
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
                    {isPdfAttachment(attachment.mimeType) ? (
                      <FileText className="h-6 w-6" />
                    ) : (
                      <ImageIcon className="h-6 w-6" />
                    )}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{attachment.originalFileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {employeeAttachmentUploadCategoryLabel(attachment.uploadCategory)}
                      {' · '}
                      {formatAttachmentSize(attachment.sizeBytes)}
                    </p>
                  </div>
                </div>
              )}

              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-[11px] text-muted-foreground">نوع المستند</p>
                  <p className="font-medium">{employeeAttachmentDocumentTypeLabel(attachment.documentType)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">الحجم</p>
                  <p className="font-medium">{formatAttachmentSize(attachment.sizeBytes)}</p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">تاريخ الرفع</p>
                  <p className="font-medium">
                    <DisplayDate value={attachment.createdAt} mode="datetime" />
                  </p>
                </div>
                <div>
                  <p className="text-[11px] text-muted-foreground">الحالة</p>
                  <Badge variant={attachment.isArchived ? 'secondary' : 'success'} className="text-[10px]">
                    {attachment.isArchived ? 'مؤرشف' : 'نشط'}
                  </Badge>
                </div>
              </div>

              {attachment.description ? (
                <div>
                  <p className="text-[11px] text-muted-foreground">الوصف</p>
                  <p className="mt-1 text-sm leading-relaxed text-foreground/90">{attachment.description}</p>
                </div>
              ) : null}

              {tags.length > 0 ? (
                <div className="flex flex-wrap gap-1.5">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="subtle" className="text-[10px]">
                      {tag}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>

            <DialogFooter className="gap-2 sm:justify-start">
              <Button variant="luxe" size="sm" className="gap-1.5" asChild>
                <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-3.5 w-3.5" />
                  فتح الملف
                </a>
              </Button>
              <Button variant="outline" size="sm" className="gap-1.5" asChild>
                <a href={fileUrl} download={attachment.originalFileName}>
                  <Download className="h-3.5 w-3.5" />
                  تحميل
                </a>
              </Button>
            </DialogFooter>
          </>
        ) : null}
      </DialogContent>
    </Dialog>
  );
}
