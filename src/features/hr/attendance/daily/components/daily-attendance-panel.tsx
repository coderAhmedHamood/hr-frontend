'use client';

import * as React from 'react';
import { PdfPreviewExportDialog } from '@/components/pdf/pdf-preview-export-dialog';
import { useDailyAttendanceModel } from '@/features/hr/attendance/daily/hooks/useDailyAttendanceModel';
import { DailySmartTimeline } from '@/features/hr/attendance/daily/components/daily-smart-timeline';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import { RegisterEventComboDialog } from '@/features/hr/attendance/daily/components/daily-one-day-view';
import { RecomputeDaySummariesDialog } from '@/features/hr/attendance/daily/dialogs/recompute-day-summaries-dialog';

export function DailyAttendancePanel() {
  const model = useDailyAttendanceModel();
  const companyId = useDefaultCompanyId() ?? '';

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">
      <PdfPreviewExportDialog
        open={model.pdfOpen}
        onOpenChange={model.setPdfOpen}
        title="معاينة تصدير الحضور"
        fileName={model.attendancePdfFileName}
        printable={model.attendancePrintable}
      />

      {companyId ? (
        <RecomputeDaySummariesDialog
          open={model.recomputeOpen}
          onOpenChange={model.setRecomputeOpen}
          companyId={companyId}
          defaultFrom={model.dateBounds.from}
          defaultTo={model.dateBounds.to}
          filterEmployeeIds={model.selectedEmpIds}
          allEmployees={model.allEmployees}
          onSuccess={model.refreshAfterRecompute}
        />
      ) : null}

      {companyId && model.dates.length > 0 && (
        <RegisterEventComboDialog
          open={model.registerOpen}
          onOpenChange={model.setRegisterOpen}
          allEmployees={model.allEmployees}
          workDate={model.dates[0]!}
          companyId={companyId}
          availableDates={model.dates.length > 1 ? model.dates : undefined}
          onCreated={model.refreshAfterRecompute}
        />
      )}

      <DailySmartTimeline
        className="min-h-0 flex-1"
        summaries={model.denseForView}
        events={model.eventsForView}
        dates={model.dates}
        viewMode={model.viewMode}
        allEmployees={model.allEmployees}
      />
    </div>
  );
}
