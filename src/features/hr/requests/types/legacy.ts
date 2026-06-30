export type RequestStatus = 'pending' | 'approved' | 'rejected' | 'in-review';
export type RequestType =
  | 'leave'
  | 'permission'
  | 'advance'
  | 'salary-letter'
  | 'equipment'
  | 'attendance-correction';

export interface Request {
  id: string;
  requestNumber: string;
  employeeId: string;
  type: RequestType;
  title: string;
  description: string;
  status: RequestStatus;
  submittedAt: string;
  fromDate?: string;
  toDate?: string;
  amount?: number;
  daysCount?: number;
  timeline: {
    id: string;
    action: string;
    by: string;
    byRole: string;
    at: string;
    note?: string;
  }[];
  attachments?: string[];
}
