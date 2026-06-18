export interface ActivityItem {
  id: string;
  type: 'request' | 'attendance' | 'employee' | 'payroll' | 'system';
  title: string;
  description: string;
  user: string;
  userAvatar: string;
  timestamp: string;
  icon: string;
}
