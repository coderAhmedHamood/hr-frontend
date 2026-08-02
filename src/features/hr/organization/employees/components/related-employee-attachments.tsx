'use client';

import * as React from 'react';
import Link from 'next/link';
import { Eye, FileText, ImageIcon, Loader2, Paperclip } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { DisplayDate } from '@/components/ui/table-cells';
import { EmployeeAttachmentDetailDialog } from '@/features/hr/organization/employees/components/dialogs/employee-attachment-detail-dialog';
import {
  RELATED_EMPLOYEE_ATTACHMENT_PRESETS,
  employeeAttachmentDocumentTypeLabel,
  type RelatedEmployeeAttachmentPresetId,
} from '@/features/hr/organization/employees/constants/employee-attachment-document-types';
import {
  employeeAttachmentsApi,
  type EmployeeAttachmentDto,
} from '@/features/hr/organization/employees/lib/api/employee-attachments';
import {
  formatAttachmentSize,
  isImageAttachment,
  isPdfAttachment,
} from '@/features/hr/organization/employees/lib/employee-attachments-utils';
import { organizationListArchiveQuery } from '@/features/hr/organization/lib/archive-scope';
import { hrOrganizationRoutes } from '@/features/hr/organization/constants/routes';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { cn } from '@/shared/utils';

function AttachmentIcon({ item }: { item: EmployeeAttachmentDto }) {
  if (isImageAttachment(item.mimeType)) return <ImageIcon className="h-3.5 w-3.5" />;
  if (isPdfAttachment(item.mimeType)) return <FileText className="h-3.5 w-3.5" />;
  return <Paperclip className="h-3.5 w-3.5" />;
}

type Props = {
  employeeId: string | null | undefined;
  companyId?: string | null;
  /** Named domain preset — preferred over raw documentTypes. */
  preset?: RelatedEmployeeAttachmentPresetId;
  documentTypes?: readonly string[];
  libraryGroup?: string;
  title?: string;
  limit?: number;
  className?: string;
};

/**
 * Compact strip for domain detail cards: last N related files from employee-attachments
 * + «عرض الكل» deep-link into the employee profile attachments section.
 */
export function RelatedEmployeeAttachments({
  employeeId,
  companyId: companyIdProp,
  preset,
  documentTypes: documentTypesProp,
  libraryGroup: libraryGroupProp,
  title: titleProp,
  limit = 4,
  className,
}: Props) {
  const defaultCompanyId = useDefaultCompanyId();
  const companyId = companyIdProp ?? defaultCompanyId ?? '';

  const presetConfig = preset ? RELATED_EMPLOYEE_ATTACHMENT_PRESETS[preset] : null;
  const documentTypes = documentTypesProp ?? presetConfig?.documentTypes ?? [];
  const libraryGroup = libraryGroupProp ?? presetConfig?.libraryGroup ?? 'all';
  const title = titleProp ?? presetConfig?.title ?? 'المرفقات المرتبطة';

  const [items, setItems] = React.useState<EmployeeAttachmentDto[]>([]);
  const [total, setTotal] = React.useState(0);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [detail, setDetail] = React.useState<EmployeeAttachmentDto | null>(null);

  const documentTypesKey = documentTypes.join(',');

  React.useEffect(() => {
    if (!employeeId || !companyId) {
      setItems([]);
      setTotal(0);
      return;
    }

    const types = documentTypesKey ? documentTypesKey.split(',') : [];
    let cancelled = false;
    setLoading(true);
    setError(null);

    void employeeAttachmentsApi
      .getAll({
        companyId,
        employeeId,
        page: 1,
        limit,
        ...organizationListArchiveQuery('active'),
        ...(types.length === 1
          ? { documentType: types[0] }
          : types.length > 1
            ? { documentTypes: documentTypesKey }
            : {}),
        sortBy: 'createdAt',
        sortDir: 'DESC',
      })
      .then((res) => {
        if (cancelled) return;
        setItems(res.items);
        setTotal(res.pagination.total);
      })
      .catch(() => {
        if (!cancelled) {
          setItems([]);
          setTotal(0);
          setError('تعذر تحميل المرفقات');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [companyId, documentTypesKey, employeeId, limit]);

  if (!employeeId) return null;

  const viewAllHref = hrOrganizationRoutes.employeeAttachments(employeeId, {
    libraryGroup: libraryGroup !== 'all' ? libraryGroup : undefined,
  });

  return (
    <div className={cn('min-w-0', className)}>
      <div className="mb-2 flex items-center justify-between gap-2">
        <p className="min-w-0 truncate text-xs font-semibold text-foreground">{title}</p>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 shrink-0 gap-1 px-2 text-xs text-primary hover:text-primary"
          asChild
        >
          <Link href={viewAllHref}>عرض الكل</Link>
        </Button>
      </div>

      {loading ? (
        <div className="flex items-center justify-center gap-2 py-4 text-xs text-muted-foreground">
          <Loader2 className="h-3.5 w-3.5 animate-spin" />
          جاري التحميل…
        </div>
      ) : error ? (
        <p className="text-xs text-destructive">{error}</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-muted-foreground">لا توجد مرفقات مرتبطة بعد.</p>
      ) : (
        <>
          <ul className="space-y-2">
            {items.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => setDetail(item)}
                  className="flex w-full min-w-0 items-start gap-2.5 rounded-xl border border-border/70 bg-background px-3 py-2.5 text-start transition-colors hover:border-primary/30 hover:bg-muted/30"
                >
                  <span className="mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-primary/15 bg-primary/8 text-primary">
                    <AttachmentIcon item={item} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-start justify-between gap-2">
                      <span className="min-w-0 flex-1 text-xs font-medium leading-snug text-foreground line-clamp-2">
                        {item.name}
                      </span>
                      <span className="inline-flex shrink-0 items-center gap-1 rounded-md border border-primary/20 bg-primary/5 px-1.5 py-0.5 text-[10px] font-medium text-primary">
                        <Eye className="h-3 w-3" />
                        معاينة
                      </span>
                    </span>
                    <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[10px] text-muted-foreground">
                      <span>{employeeAttachmentDocumentTypeLabel(item.documentType)}</span>
                      <span>{formatAttachmentSize(item.sizeBytes)}</span>
                      <DisplayDate value={item.createdAt} mode="date" />
                    </span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
          {total > items.length ? (
            <p className="mt-1.5 text-[10px] text-muted-foreground tabular-nums">
              عرض {items.length} من {total} — «عرض الكل» للمكتبة الكاملة
            </p>
          ) : null}
        </>
      )}

      <EmployeeAttachmentDetailDialog
        attachment={detail}
        onOpenChange={(open) => {
          if (!open) setDetail(null);
        }}
      />
    </div>
  );
}
