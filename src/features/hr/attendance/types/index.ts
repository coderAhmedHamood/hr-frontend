export type AttendanceStatus = 'present' | 'absent' | 'late' | 'early-leave' | 'on-leave';

export interface Shift {
  id: string;
  name: string;
  periods: { start: string; end: string; label: string }[];
  graceMinutes: number;
  color: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string;
  checkIn: string | null;
  checkOut: string | null;
  status: AttendanceStatus;
  lateMinutes: number;
  earlyLeaveMinutes: number;
  shiftId: string;
  geoPointId?: string;
  notes?: string;
}

export interface GeoPoint {
  id: string;
  name: string;
  lat: number;
  lng: number;
  radius: number;
  branchId: string;
  assignedEmployees: string[];
}
