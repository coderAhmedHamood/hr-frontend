export interface HRDepartmentEntity {
  id: string;
  parentId?: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
}

export type HRRequestFieldKind =
  | 'text' | 'textarea' | 'number' | 'date' | 'time' | 'datetime'
  | 'checkbox' | 'checkbox_group' | 'radio_group' | 'email';

export interface HRRequestFieldOption {
  id: string;
  labelAr: string;
}

export interface HRRequestFieldDefinition {
  id: string;
  labelAr: string;
  labelEn?: string;
  kind: HRRequestFieldKind;
  required?: boolean;
  placeholder?: string;
  options?: HRRequestFieldOption[];
  sortOrder: number;
}

export interface HRRequestTemplateEntity {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  isUniversalDefault?: boolean;
  formFields: HRRequestFieldDefinition[];
}

export type HRApprovalStageMode = 'sequential' | 'parallel' | 'optional' | 'any_one';

export interface HRApprovalParallelRule {
  kind: 'all' | 'count';
  required?: number;
}

export interface HRApprovalStage {
  id: string;
  sortOrder: number;
  mode: HRApprovalStageMode;
  approverEmployeeIds: string[];
  parallelRule?: HRApprovalParallelRule;
  optionalTimeoutHours?: number;
}

export interface HRRequestSubtype {
  id: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
}

export const HR_REQUEST_TYPE_CATEGORIES = ['attendance', 'advance'] as const;
export type HRRequestTypeCategory = (typeof HR_REQUEST_TYPE_CATEGORIES)[number];

export interface HRRequestTypeEntity {
  id: string;
  departmentId: string;
  nameAr: string;
  nameEn: string;
  slug: string;
  sortOrder: number;
  isActive: boolean;
  subtypes: HRRequestSubtype[];
  /** تصنيف الطلب ضمن الحضور أو السلف */
  requestCategory: HRRequestTypeCategory;
  /** قالب «إسناد الموافقات» المرتبط — يُعرض في طلب جديد ويُنسخ إلى لقطة مسار الموافقة */
  approvalAssignmentTemplateId?: string | null;
  approvalStages?: HRApprovalStage[];
}

export type HRSubmissionApprovalStageState = 'pending' | 'approved' | 'rejected';

export interface HRSubmissionApprovalStageSnapshot {
  stageId: string;
  mode: HRApprovalStageMode;
  /** مطابق لترتيب `approverNamesAr` — لتحديد من يملك زر الموافقة/الرفض */
  approverEmployeeIds: string[];
  approverNamesAr: string[];
  state: HRSubmissionApprovalStageState;
}

export interface HRSubmissionApprovalSnapshot {
  assignmentTemplateId: string;
  assignmentTemplateNameAr: string;
  stages: HRSubmissionApprovalStageSnapshot[];
}

export interface HRRequestSubmissionRecord {
  id: string;
  createdAt: string;
  employeeId: string;
  employeeNameAr: string;
  employeeNameEn: string;
  requestTypeId: string;
  requestTypeNameAr: string;
  requestTypeNameEn: string;
  departmentId: string;
  departmentNameAr: string;
  departmentNameEn: string;
  templateId: string | null;
  fieldValues: Record<string, unknown>;
  /** مسار الموافقات (من قالب إسناد الموافقات) وحالة كل مرحلة */
  approvalSnapshot?: HRSubmissionApprovalSnapshot | null;
}

export interface HRApprovalTemplateStage {
  id: string;
  sortOrder: number;
  mode: HRApprovalStageMode;
  approvers: { employeeId: string; mandatory: boolean }[];
  parallelRule?: HRApprovalParallelRule;
  optionalTimeoutHours?: number;
}

export type HRDisciplineApprovalAssignmentLinkKind = 'violation' | 'request';

export interface HRApprovalAssignmentTemplate {
  id: string;
  nameAr: string;
  description?: string;
  isActive: boolean;
  stages: HRApprovalTemplateStage[];
  createdAt: string;
  updatedAt: string;
  /** @deprecated يُفضَّل assignmentLinkedIds — يُحفظ أول عنصر للمخالفات للتوافق مع بيانات قديمة */
  violationTypeId?: string | null;
  assignmentLinkKind?: HRDisciplineApprovalAssignmentLinkKind | null;
  /** معرفات الأنواع بنفس ترتيب العرض (مخالفات أو طلبات حسب assignmentLinkKind) */
  assignmentLinkedIds?: string[];
  /** صفحة إسناد موافقات الطلبات: أنواع الطلبات المشمولة في قالب واحد */
  hrRequestAssignmentLinkedIds?: string[];
}
