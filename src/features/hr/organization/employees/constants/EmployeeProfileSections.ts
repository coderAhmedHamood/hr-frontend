import {
  User,
  Briefcase,
  Clock,
  Calendar,
  FileText,
  AlertTriangle,
  FileSignature,
  FileStack,
  History,
  Shield,
  Receipt,
  Paperclip,
} from 'lucide-react';

export const EMPLOYEE_PROFILE_SECTIONS = [
  { id: 'personal', label: 'البيانات الشخصية', icon: User },
  { id: 'employment', label: 'بيانات التوظيف', icon: Briefcase },
  { id: 'attendance', label: 'الحضور والانصراف', icon: Clock },
  { id: 'leaves', label: 'الإجازات', icon: Calendar },
  { id: 'requests', label: 'الطلبات', icon: FileText },
  { id: 'violations', label: 'المخالفات', icon: AlertTriangle },
  { id: 'contracts', label: 'العقود', icon: FileSignature },
  { id: 'attachments', label: 'المرفقات', icon: Paperclip },
  { id: 'rose-forms', label: 'النماذج الرسمية', icon: FileStack },
  { id: 'activity-log', label: 'سجل التغييرات', icon: History },
  { id: 'permissions', label: 'صلاحيات الموظف', icon: Shield },
  { id: 'salary', label: 'كشوف الرواتب', icon: Receipt },
] as const;

export type EmployeeProfileSectionId = (typeof EMPLOYEE_PROFILE_SECTIONS)[number]['id'];
