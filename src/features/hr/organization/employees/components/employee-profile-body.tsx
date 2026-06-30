'use client';

import { PdfPreviewExportDialog } from '@/components/pdf/pdf-preview-export-dialog';
import { EmployeeLeaveRequestDialog } from '@/features/hr/organization/employees/components/dialogs/employee-leave-request-dialog';
import { useEmployeeProfileModel } from '@/features/hr/organization/employees/hooks/useEmployeeProfileModel';
import { EmployeeProfileShell } from '@/features/hr/organization/employees/components/employee-profile-shell';
import { EmployeePersonalSection } from '@/features/hr/organization/employees/components/sections/employee-personal-section';
import { EmployeeEmploymentSection } from '@/features/hr/organization/employees/components/sections/employee-employment-section';
import { EmployeeFinancialSection } from '@/features/hr/organization/employees/components/sections/employee-financial-section';
import { EmployeeAttendanceSection } from '@/features/hr/organization/employees/components/sections/employee-attendance-section';
import { EmployeeLeavesSection } from '@/features/hr/organization/employees/components/sections/employee-leaves-section';
import { EmployeeRequestsSection } from '@/features/hr/organization/employees/components/sections/employee-requests-section';
import { EmployeeViolationsSection } from '@/features/hr/organization/employees/components/sections/employee-violations-section';
import { EmployeeContractsSection } from '@/features/hr/organization/employees/components/sections/employee-contracts-section';
import { EmployeeRoseFormsSection } from '@/features/hr/organization/employees/components/sections/employee-rose-forms-section';
import { EmployeeActivityLogSection } from '@/features/hr/organization/employees/components/sections/employee-activity-log-section';
import { EmployeePermissionsSection } from '@/features/hr/organization/employees/components/sections/employee-permissions-section';
import { EmployeeSalarySection } from '@/features/hr/organization/employees/components/sections/employee-salary-section';
import type { Employee } from '@/features/hr/organization/employees/types';
import { EmployeeHrPdfPrepDialog } from '@/features/hr/organization/employees/components/dialogs/employee-hr-pdf-prep-dialog';
import { EmployeeResignationPdfPrepDialog } from '@/features/hr/organization/employees/components/dialogs/employee-resignation-pdf-prep-dialog';
import { EmployeeClearancePdfPrepDialog } from '@/features/hr/organization/employees/components/dialogs/employee-clearance-pdf-prep-dialog';
import { EmployeeSettlementPdfPrepDialog } from '@/features/hr/organization/employees/components/dialogs/employee-settlement-pdf-prep-dialog';
import { EmployeeExperiencePdfPrepDialog } from '@/features/hr/organization/employees/components/dialogs/employee-experience-pdf-prep-dialog';
import { RoseFormsTemplateSettingsDialog } from '@/features/hr/organization/employees/components/dialogs/rose-forms-template-settings-dialog';
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
        {model.activeSection === 'financial' && <EmployeeFinancialSection model={model} />}
        {model.activeSection === 'attendance' && <EmployeeAttendanceSection model={model} />}
        {model.activeSection === 'leaves' && <EmployeeLeavesSection model={model} />}
        {model.activeSection === 'requests' && <EmployeeRequestsSection model={model} />}
        {model.activeSection === 'violations' && <EmployeeViolationsSection model={model} />}
        {model.activeSection === 'contracts' && <EmployeeContractsSection model={model} />}
        {model.activeSection === 'rose-forms' && <EmployeeRoseFormsSection model={model} />}
        {model.activeSection === 'activity-log' && <EmployeeActivityLogSection model={model} />}
        {model.activeSection === 'permissions' && <EmployeePermissionsSection model={model} />}
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

      <EmployeeHrPdfPrepDialog
        open={model.hrPdfPrepKind != null}
        prepKind={model.hrPdfPrepKind}
        employee={model.employee}
        onCancel={model.cancelHrPdfPrep}
        onApplyCashReceipt={({ receipt }) =>
          model.applyHrPdfPrepResult('cash-receipt', {}, receipt)
        }
      />

      <EmployeeResignationPdfPrepDialog
        open={model.resignationPrepOpen}
        employee={model.employee}
        branchNameAr={model.rosePdfBranchNameAr}
        departmentNameAr={model.rosePdfDepartmentNameAr}
        companyNameAr={model.rosePdfCompanyNameAr}
        companyNameEn={model.rosePdfCompanyNameEn}
        onCancel={model.cancelResignationPrep}
        onApply={model.applyResignationWizard}
        onOpenTemplateSettings={() => model.openRoseTemplateSettings('resignation')}
      />

      <EmployeeClearancePdfPrepDialog
        open={model.clearancePrepOpen}
        employee={model.employee}
        branchNameAr={model.rosePdfBranchNameAr}
        departmentNameAr={model.rosePdfDepartmentNameAr}
        companyNameAr={model.rosePdfCompanyNameAr}
        companyNameEn={model.rosePdfCompanyNameEn}
        onCancel={model.cancelClearancePrep}
        onApply={model.applyClearanceWizard}
        onOpenTemplateSettings={() => model.openRoseTemplateSettings('clearance')}
      />

      <EmployeeSettlementPdfPrepDialog
        open={model.settlementPrepOpen}
        employee={model.employee}
        branchNameAr={model.rosePdfBranchNameAr}
        departmentNameAr={model.rosePdfDepartmentNameAr}
        companyNameAr={model.rosePdfCompanyNameAr}
        companyNameEn={model.rosePdfCompanyNameEn}
        onCancel={model.cancelSettlementPrep}
        onApply={model.applySettlementWizard}
        onOpenTemplateSettings={() => model.openRoseTemplateSettings('settlement')}
      />

      <EmployeeExperiencePdfPrepDialog
        open={model.experiencePrepOpen}
        employee={model.employee}
        branchNameAr={model.rosePdfBranchNameAr}
        departmentNameAr={model.rosePdfDepartmentNameAr}
        companyNameAr={model.rosePdfCompanyNameAr}
        companyNameEn={model.rosePdfCompanyNameEn}
        onCancel={model.cancelExperiencePrep}
        onApply={model.applyExperienceWizard}
        onOpenTemplateSettings={() => model.openRoseTemplateSettings('experience')}
      />

      <RoseFormsTemplateSettingsDialog
        open={model.roseTemplateSettingsOpen}
        onOpenChange={model.setRoseTemplateSettingsOpen}
        initialTab={model.roseTemplateSettingsTab}
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
