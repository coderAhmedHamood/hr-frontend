import type {
  AssignmentTargetType,
  ShiftTemplate,
  ShiftAssignment,
  AttendanceEvent,
  AttendanceDaySummary,
  AttendanceCheckInPoint,
  AttendanceCheckInPointLink,
} from './domain';

export type AssignmentBatchItem = {
  targetType: AssignmentTargetType;
  targetId: string;
  targetLabel: string;
};

export type AttendanceStore = {
  shiftTemplates: ShiftTemplate[];
  assignments: ShiftAssignment[];
  events: AttendanceEvent[];
  daySummaries: AttendanceDaySummary[];
  checkpoints: AttendanceCheckInPoint[];
  checkpointLinks: AttendanceCheckInPointLink[];
  upsertTemplate: (t: ShiftTemplate) => void;
  removeTemplate: (id: string) => void;
  addAssignmentBatch: (args: {
    templateId: string;
    effectiveFrom: string;
    items: AssignmentBatchItem[];
    openShiftHours?: number;
  }) => void;
  removeAssignment: (id: string) => void;
  removeAssignmentBatch: (batchId: string) => void;
  addEvent: (e: Omit<AttendanceEvent, 'id'> & { id?: string }) => void;
  removeEvent: (id: string) => void;
  upsertDaySummary: (s: AttendanceDaySummary) => void;
  removeDaySummary: (id: string) => void;
  upsertCheckpoint: (c: AttendanceCheckInPoint) => void;
  removeCheckpoint: (id: string) => void;
  addCheckpointLinkBatch: (args: {
    effectiveFrom?: string;
    pairs: { employeeId: string; checkInPointId: string }[];
  }) => void;
  removeCheckpointLink: (id: string) => void;
  removeCheckpointLinkBatch: (batchId: string) => void;
};
