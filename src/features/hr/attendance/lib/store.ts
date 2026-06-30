export type { AssignmentBatchItem, AttendanceStore } from '@/features/hr/attendance/types/store';

import { create } from 'zustand';
import { normalizeShiftTemplate } from './defaults';
import type { AttendanceStore } from '@/features/hr/attendance/types/store';
import type {
  AssignmentTargetType,
  AttendanceCheckInPoint,
  AttendanceCheckInPointLink,
  AttendanceDaySummary,
  AttendanceEvent,
  ShiftAssignment,
  ShiftTemplate,
} from '@/features/hr/attendance/types/domain';
import { genId } from './utils';



export const useAttendanceStore = create<AttendanceStore>()((set) => ({
  shiftTemplates: [],
  assignments: [],
  events: [],
  daySummaries: [],
  checkpoints: [],
  checkpointLinks: [],

  upsertTemplate: (t) => {
    const normalized = normalizeShiftTemplate(t);
    set((s) => ({
      shiftTemplates: s.shiftTemplates.some((x) => x.id === normalized.id)
        ? s.shiftTemplates.map((x) => (x.id === normalized.id ? normalized : x))
        : [...s.shiftTemplates, normalized],
    }));
  },

  removeTemplate: (id) =>
    set((s) => ({
      shiftTemplates: s.shiftTemplates.filter((x) => x.id !== id),
      assignments: s.assignments.filter((a) => a.templateId !== id),
    })),

  addAssignmentBatch: ({ templateId, effectiveFrom, items, openShiftHours }) => {
    const batchId = genId('batch');
    const rows: ShiftAssignment[] = items.map((it) => ({
      id: genId('asg'),
      templateId,
      ...(openShiftHours !== undefined && { openShiftHours }),
      targetType: it.targetType,
      targetId: it.targetId,
      targetLabel: it.targetLabel,
      effectiveFrom,
      batchId,
    }));
    set((s) => ({ assignments: [...rows, ...s.assignments] }));
  },

  removeAssignment: (id) => set((s) => ({ assignments: s.assignments.filter((a) => a.id !== id) })),

  removeAssignmentBatch: (batchId) =>
    set((s) => ({ assignments: s.assignments.filter((a) => a.batchId !== batchId) })),

  addEvent: (e) =>
    set((s) => ({
      events: [{ ...e, id: e.id ?? genId('ev') } as AttendanceEvent, ...s.events],
    })),

  removeEvent: (id) => set((s) => ({ events: s.events.filter((x) => x.id !== id) })),

  upsertDaySummary: (summary) =>
    set((s) => ({
      daySummaries: s.daySummaries.some((x) => x.id === summary.id)
        ? s.daySummaries.map((x) => (x.id === summary.id ? summary : x))
        : [...s.daySummaries, summary],
    })),

  removeDaySummary: (id) => set((s) => ({ daySummaries: s.daySummaries.filter((x) => x.id !== id) })),

  upsertCheckpoint: (c) =>
    set((s) => ({
      checkpoints: s.checkpoints.some((x) => x.id === c.id)
        ? s.checkpoints.map((x) => (x.id === c.id ? c : x))
        : [...s.checkpoints, c],
    })),

  removeCheckpoint: (id) =>
    set((s) => ({
      checkpoints: s.checkpoints.filter((x) => x.id !== id),
      checkpointLinks: s.checkpointLinks.filter((l) => l.checkInPointId !== id),
    })),

  addCheckpointLinkBatch: ({ effectiveFrom, pairs }) => {
    const batchId = genId('batch');
    const rows: AttendanceCheckInPointLink[] = pairs.map((p) => ({
      id: genId('lnk'),
      employeeId: p.employeeId,
      checkInPointId: p.checkInPointId,
      batchId,
      effectiveFrom,
      linkActive: true,
    }));
    set((s) => ({ checkpointLinks: [...rows, ...s.checkpointLinks] }));
  },

  removeCheckpointLink: (id) => set((s) => ({ checkpointLinks: s.checkpointLinks.filter((l) => l.id !== id) })),

  removeCheckpointLinkBatch: (batchId) =>
    set((s) => ({ checkpointLinks: s.checkpointLinks.filter((l) => l.batchId !== batchId) })),
}));
