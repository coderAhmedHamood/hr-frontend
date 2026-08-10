'use client';

import { PdfPreviewExportDialog } from '@/components/pdf/pdf-preview-export-dialog';
import { EmployeeLeaveRequestDialog } from '@/features/hr/organization/employees/components/dialogs/employee-leave-request-dialog';
import { useEmployeeProfileModel } from '@/features/hr/organization/employees/hooks/useEmployeeProfileModel';
import { EmployeeProfileShell } from '@/features/hr/organization/employees/components/employee-profile-shell';
import { EmployeePersonalSection } from '@/features/hr/organization/employees/components/sections/employee-personal-section';
import { EmployeeEmploymentSection } from '@/features/hr/organization/employees/components/sections/employee-employment-section';
import { EmployeeAttendanceSection } from '@/features/hr/organization/employees/components/sections/employee-attendance-section';
import { EmployeeLeavesSection } from '@/features/hr/organization/employees/components/sections/employee-leaves-section';
import { EmployeeRequestsSection } from '@/features/hr/organization/employees/components/sections/employee-requests-section';
import { EmployeeViolationsSection } from '@/features/hr/organization/employees/components/sections/employee-violations-section';
import { EmployeeContractsSection } from '@/features/hr/organization/employees/components/sections/employee-contracts-section';
import { EmployeeRoseFormsSection } from '@/features/hr/organization/employees/components/sections/employee-rose-forms-section';
import { EmployeeAttachmentsSection } from '@/features/hr/organization/employees/components/sections/employee-attachments-section';
import { EmployeeActivityLogSection } from '@/features/hr/organization/employees/components/sections/employee-activity-log-section';
import { EmployeePermissionsSection } from '@/features/hr/organization/employees/components/sections/employee-permissions-section';
import { EmployeeSalarySection } from '@/features/hr/organization/employees/components/sections/employee-salary-section';
import type { Employee } from '@/features/hr/organization/employees/types';
import { EmployeeAttachmentUploadDialog } from '@/features/hr/organization/employees/components/dialogs/employee-attachment-upload-dialog';
import { EmployeeAttachmentDetailDialog } from '@/features/hr/organization/employees/components/dialogs/employee-attachment-detail-dialog';
import { EmployeeCreateUserDialog } from '@/features/hr/organization/employees/components/dialogs/employee-create-user-dialog';
import { EmployeeAssignmentDialog } from '@/features/hr/organization/employees/components/dialogs/employee-assignment-dialog';
import { EmployeeAssignmentEditDialog } from '@/features/hr/organization/employees/components/dialogs/employee-assignment-edit-dialog';
import { ConfirmationModal } from '@/components/ui/shared-dialogs';

export function EmployeeProfileBody({ employee, onUpdated }: { employee: Employee; onUpdated?: (updated: Employee) => void }) {
  const model = useEmployeeProfileModel(employee, onUpdated);

  return (
    <div className="flex min-h-0 flex-1 flex-col overflow-hidden">
      <EmployeeProfileShell model={model}>
        {model.activeSection === 'personal' && <EmployeePersonalSection model={model} />}
        {model.activeSection === 'employment' && <EmployeeEmploymentSection model={model} />}
        {model.activeSection === 'attendance' && <EmployeeAttendanceSection model={model} />}
        {model.activeSection === 'leaves' && <EmployeeLeavesSection model={model} />}
        {model.activeSection === 'requests' && <EmployeeRequestsSection model={model} />}
        {model.activeSection === 'violations' && <EmployeeViolationsSection model={model} />}
        {model.activeSection === 'contracts' && <EmployeeContractsSection model={model} />}
        {model.activeSection === 'attachments' && <EmployeeAttachmentsSection model={model} />}
        {model.activeSection === 'rose-forms' && <EmployeeRoseFormsSection model={model} />}
        {model.activeSection === 'activity-log' && <EmployeeActivityLogSection model={model} />}
        {model.hasLinkedUser && model.activeSection === 'permissions' && (
          <EmployeePermissionsSection model={model} />
        )}
        {model.activeSection === 'salary' && <EmployeeSalarySection model={model} />}
      </EmployeeProfileShell>

      <EmployeeCreateUserDialog employee={model.employee} model={model} />
      <EmployeeAssignmentDialog employee={model.employee} model={model} />
      <EmployeeAssignmentEditDialog model={model} />
      <ConfirmationModal
        open={model.deleteAssignmentTarget != null}
        onOpenChange={(o) => !o && model.setDeleteAssignmentTarget(null)}
        onConfirm={() => void model.confirmDeleteAssignment()}
        title="حذف الإسناد"
        description="سيُزال هذا الإسناد من سجل الموظف. لا يمكن التراجع."
        confirmLabel="حذف"
        variant="destructive"
      />

      <PdfPreviewExportDialog
        open={model.hrPdfPreviewOpen}
        onOpenChange={(openNext) => {
          if (!openNext) model.closeHrPdfPreview();
        }}
        title={model.rosePdfPreviewPayload.title}
        fileName={model.rosePdfPreviewPayload.fileName}
        printable={model.rosePdfPreviewPayload.printable}
      />

      <EmployeeAttachmentUploadDialog
        open={model.uploadOpen}
        onOpenChange={model.setUploadOpen}
        employeeName={model.employee.name}
        onUpload={model.uploadAttachment}
        onSuccess={() => void model.reloadAttachments()}
      />

      <EmployeeAttachmentDetailDialog
        attachment={model.detailAttachment}
        onOpenChange={(open) => {
          if (!open) model.setDetailAttachment(null);
        }}
      />

      <EmployeeLeaveRequestDialog
        open={model.leaveRequestOpen}
        onOpenChange={model.setLeaveRequestOpen}
        companyId={model.companyId}
        employeeId={model.employee.id}
        employeeName={model.employee.name}
        leaveTypes={model.leaveTypes}
        leaveRequestTypes={model.leaveRequestTypes}
        presetLeaveTypeId={model.presetLeaveTypeId}
        onSuccess={() => void model.reloadLeaves()}
      />
    </div>
  );
}
