import {
  apiDownloadToDevice,
  apiRequest,
  type PaginatedResult,
} from '@/features/hr/lib/api/client';

export type DatabaseBackupFormat = 'plain' | 'custom';

export type DatabaseBackupMode = 'local' | 'docker-exec' | 'docker-run' | 'node';

export type DatabaseBackupRecord = {
  id: string;
  companyId: string;
  filePath: string;
  filename: string;
  fileFormat: DatabaseBackupFormat;
  backupMode: DatabaseBackupMode;
  databaseName: string;
  sizeBytes: string;
  requestedByUserId: string | null;
  status: string;
  createdAt: string;
  updatedAt: string;
};

export type DatabaseBackupExportResult = {
  fileName: string;
  recordId: string | null;
  savedTo: string | null;
  backupMode: string | null;
};

function parseExportHeaders(headers: Record<string, string>): Pick<
  DatabaseBackupExportResult,
  'recordId' | 'savedTo' | 'backupMode'
> {
  return {
    recordId: headers['x-backup-record-id'] ?? null,
    savedTo: headers['x-backup-saved-to'] ?? null,
    backupMode: headers['x-backup-mode'] ?? null,
  };
}

export const databaseBackupApi = {
  exportBackup(companyId: string, format: DatabaseBackupFormat = 'plain') {
    return apiDownloadToDevice('/system/database-backup/export', {
      method: 'POST',
      query: { companyId, format },
      defaultFileName: `database-backup-${new Date().toISOString().slice(0, 10)}.sql`,
    }).then(({ fileName, headers }) => ({
      fileName,
      ...parseExportHeaders(headers),
    } satisfies DatabaseBackupExportResult));
  },

  list(companyId: string, query?: { page?: number; limit?: number }) {
    return apiRequest<PaginatedResult<DatabaseBackupRecord>>('/system/database-backup', {
      query: { companyId, ...query },
    });
  },

  downloadById(id: string, companyId: string) {
    return apiDownloadToDevice(`/system/database-backup/${id}/download`, {
      query: { companyId },
      defaultFileName: `database-backup-${id}.sql`,
    }).then(({ fileName }) => fileName);
  },
};
