'use client';

import * as React from 'react';
import { Database, Download, Loader2, RefreshCw } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { DataTable, type ColumnDef } from '@/components/ui/data-table';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import {
  databaseBackupApi,
  type DatabaseBackupRecord,
} from '@/features/system/lib/api/database-backup';
import { formatDisplayDateTime } from '@/shared/utils';

function formatBytes(sizeBytes: string): string {
  const n = Number(sizeBytes);
  if (!Number.isFinite(n) || n < 0) return '—';
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  if (n < 1024 * 1024 * 1024) return `${(n / (1024 * 1024)).toFixed(1)} MB`;
  return `${(n / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function DatabaseBackupSection() {
  const companyId = useDefaultCompanyId();
  const [exporting, setExporting] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [records, setRecords] = React.useState<DatabaseBackupRecord[]>([]);
  const [downloadingId, setDownloadingId] = React.useState<string | null>(null);

  const loadRecords = React.useCallback(async () => {
    if (!companyId) {
      setRecords([]);
      return;
    }
    setLoading(true);
    try {
      const res = await databaseBackupApi.list(companyId, { page: 1, limit: 50 });
      setRecords(res.items);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'system.database-backup.list');
      toast.error(displayMessage);
      setRecords([]);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  React.useEffect(() => {
    void loadRecords();
  }, [loadRecords]);

  const handleExport = async () => {
    if (!companyId) {
      toast.error('لا توجد شركة محددة — اختر الشركة أولاً.');
      return;
    }
    setExporting(true);
    try {
      const result = await databaseBackupApi.exportBackup(companyId, 'plain');
      toast.success(
        result.savedTo
          ? `تم حفظ النسخة على السيرفر وتنزيلها: ${result.fileName}`
          : `تم تنزيل النسخة الاحتياطية: ${result.fileName}`,
      );
      await loadRecords();
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'system.database-backup.export');
      toast.error(displayMessage);
    } finally {
      setExporting(false);
    }
  };

  const handleDownload = React.useCallback(async (record: DatabaseBackupRecord) => {
    if (!companyId) return;
    setDownloadingId(record.id);
    try {
      const fileName = await databaseBackupApi.downloadById(record.id, companyId);
      toast.success(`تم تنزيل: ${fileName}`);
    } catch (err) {
      const { displayMessage } = handleApiError(err, 'system.database-backup.download');
      toast.error(displayMessage);
    } finally {
      setDownloadingId(null);
    }
  }, [companyId]);

  const columns = React.useMemo((): ColumnDef<DatabaseBackupRecord>[] => [
    {
      key: 'filename',
      title: 'اسم الملف',
      className: 'font-medium',
      render: (r) => r.filename,
    },
    {
      key: 'size',
      title: 'الحجم',
      className: 'text-muted-foreground tabular-nums',
      render: (r) => formatBytes(r.sizeBytes),
    },
    {
      key: 'createdAt',
      title: 'تاريخ الإنشاء',
      className: 'text-muted-foreground',
      render: (r) => formatDisplayDateTime(r.createdAt),
    },
    {
      key: 'filePath',
      title: 'المسار على السيرفر',
      className: 'max-w-[12rem] truncate text-[11px] text-muted-foreground font-mono',
      render: (r) => (
        <span title={r.filePath} dir="ltr" className="block truncate">
          {r.filePath}
        </span>
      ),
    },
    {
      key: 'actions',
      title: 'إجراءات',
      isActions: true,
      isInteractive: true,
      render: (r) => (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 text-xs"
          disabled={downloadingId === r.id}
          onClick={() => void handleDownload(r)}
        >
          {downloadingId === r.id ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Download className="h-3.5 w-3.5" />
          )}
          تنزيل
        </Button>
      ),
    },
  ], [downloadingId, handleDownload]);

  return (
    <section className="overflow-hidden rounded-xl border border-border bg-card shadow-soft">
      <div className="border-b border-border/80 px-4 py-4 sm:px-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <Database className="h-4 w-4" />
            </div>
            <div>
              <h3 className="font-display text-sm font-semibold sm:text-base">النسخ الاحتياطي لقاعدة البيانات</h3>
              <p className="mt-0.5 text-xs text-muted-foreground">
                إنشاء نسخة SQL، حفظها على السيرفر ضمن مجلد الشركة، وتسجيل المسار في قاعدة البيانات.
              </p>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-1.5"
              onClick={() => void loadRecords()}
              disabled={loading || !companyId}
            >
              <RefreshCw className={loading ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'} />
              تحديث
            </Button>
            <Button
              type="button"
              variant="luxe"
              size="sm"
              className="gap-1.5"
              onClick={() => void handleExport()}
              disabled={exporting || !companyId}
            >
              {exporting ? (
                <>
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  جاري التصدير…
                </>
              ) : (
                <>
                  <Download className="h-3.5 w-3.5" />
                  نسخة احتياطية جديدة
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      <div className="space-y-4 p-4 sm:p-5">
        {!companyId ? (
          <p className="text-sm text-muted-foreground">لا توجد شركة محددة — اختر الشركة لعرض النسخ الاحتياطية.</p>
        ) : (
          <>
            <p className="text-xs leading-relaxed text-muted-foreground">
              تُحفظ الملفات في مجلد خاص بالشركة على السيرفر، ويُسجَّل مسار كل نسخة في قاعدة البيانات
              مرتبطاً بالشركة الحالية.
            </p>
            <DataTable
              columns={columns}
              data={records}
              keyExtractor={(r) => r.id}
              loading={loading}
              emptyText="لا توجد نسخ احتياطية محفوظة لهذه الشركة بعد."
            />
          </>
        )}
      </div>
    </section>
  );
}
