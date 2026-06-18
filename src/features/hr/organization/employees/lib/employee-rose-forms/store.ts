import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { genId } from '@/features/hr/attendance/lib/utils';
import { repairUtf8MojibakeDeep } from '@/components/pdf/lib/repair-utf8-mojibake';
import type {
  RoseClearanceRecord,
  RoseEmployeeFormBucket,
  RoseExperienceRecord,
  RoseResignationRecord,
  RoseSettlementRecord,
} from './types';

const STORAGE_KEY = 'rose-hr-employee-rose-forms-v1';

/** Repair mojibake in any string field of a record (in-place copy). */
function repairRecordStrings<T>(obj: T): T {
  if (!obj || typeof obj !== 'object') return obj;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      out[key] = repairUtf8MojibakeDeep(value);
    } else {
      out[key] = value;
    }
  }
  return out as T;
}

/** Repair entire bucket (called when rehydrating from storage). */
function repairBucket(bucket: RoseEmployeeFormBucket): RoseEmployeeFormBucket {
  return {
    resignations: bucket.resignations.map(repairRecordStrings<RoseResignationRecord>),
    clearances: bucket.clearances.map(repairRecordStrings<RoseClearanceRecord>),
    settlements: bucket.settlements.map(repairRecordStrings<RoseSettlementRecord>),
    experiences: bucket.experiences.map(repairRecordStrings<RoseExperienceRecord>),
  };
}

function nowIso() {
  return new Date().toISOString();
}

/** Stable empty bucket for `getBucket` + setters’ `??` fallback (new object each time breaks React subscribe snapshot). */
const EMPTY_BUCKET: RoseEmployeeFormBucket = {
  resignations: [],
  clearances: [],
  settlements: [],
  experiences: [],
};

type State = {
  buckets: Record<string, RoseEmployeeFormBucket>;
  _hasHydrated: boolean;
  getBucket: (employeeId: string) => RoseEmployeeFormBucket;
  /** إجمالي عدد النماذج المحفوظة لموظف */
  totalCountFor: (employeeId: string) => number;
  /** إشارة اكتمال استعادة التخزين (لتجنب hydration mismatch) */
  hasHydrated: () => boolean;
  /** انهاء الـ hydration وإصلاح البيانات المخزنة */
  finishHydration: () => void;

  addResignation: (employeeId: string, input: Omit<RoseResignationRecord, 'id' | 'employeeId' | 'createdAt' | 'updatedAt'>) => string;
  updateResignation: (employeeId: string, id: string, patch: Partial<Omit<RoseResignationRecord, 'id' | 'employeeId' | 'createdAt'>>) => void;
  removeResignation: (employeeId: string, id: string) => void;

  addClearance: (employeeId: string, input: Omit<RoseClearanceRecord, 'id' | 'employeeId' | 'createdAt' | 'updatedAt'>) => string;
  updateClearance: (employeeId: string, id: string, patch: Partial<Omit<RoseClearanceRecord, 'id' | 'employeeId' | 'createdAt'>>) => void;
  removeClearance: (employeeId: string, id: string) => void;

  addSettlement: (employeeId: string, input: Omit<RoseSettlementRecord, 'id' | 'employeeId' | 'createdAt' | 'updatedAt'>) => string;
  updateSettlement: (employeeId: string, id: string, patch: Partial<Omit<RoseSettlementRecord, 'id' | 'employeeId' | 'createdAt'>>) => void;
  removeSettlement: (employeeId: string, id: string) => void;

  addExperience: (employeeId: string, input: Omit<RoseExperienceRecord, 'id' | 'employeeId' | 'createdAt' | 'updatedAt'>) => string;
  updateExperience: (employeeId: string, id: string, patch: Partial<Omit<RoseExperienceRecord, 'id' | 'employeeId' | 'createdAt'>>) => void;
  removeExperience: (employeeId: string, id: string) => void;
};

export const useEmployeeRoseFormsStore = create<State>()(
  persist(
    (set, get) => ({
      buckets: {},
      _hasHydrated: false,

      getBucket: (employeeId) => {
        return get().buckets[employeeId] ?? EMPTY_BUCKET;
      },

      hasHydrated: () => get()._hasHydrated,

      finishHydration: () => {
        // Repair any mojibake in stored data and mark as hydrated
        set((s) => {
          const repairedBuckets: Record<string, RoseEmployeeFormBucket> = {};
          for (const [employeeId, bucket] of Object.entries(s.buckets)) {
            repairedBuckets[employeeId] = repairBucket(bucket);
          }
          return { buckets: repairedBuckets, _hasHydrated: true };
        });
      },

      totalCountFor: (employeeId) => {
        const b = get().buckets[employeeId];
        if (!b) return 0;
        return b.resignations.length + b.clearances.length + b.settlements.length + b.experiences.length;
      },

      addResignation: (employeeId, input) => {
        const id = genId('rose-res');
        const t = nowIso();
        const row: RoseResignationRecord = repairRecordStrings<RoseResignationRecord>({
          ...input,
          id,
          employeeId,
          createdAt: t,
          updatedAt: t,
        });
        set((s) => {
          const prev = s.buckets[employeeId] ?? EMPTY_BUCKET;
          return {
            buckets: {
              ...s.buckets,
              [employeeId]: { ...prev, resignations: [row, ...prev.resignations] },
            },
          };
        });
        return id;
      },
      updateResignation: (employeeId, id, patch) => {
        set((s) => {
          const prev = s.buckets[employeeId] ?? EMPTY_BUCKET;
          return {
            buckets: {
              ...s.buckets,
              [employeeId]: {
                ...prev,
                resignations: prev.resignations.map((r) =>
                  r.id === id ? { ...r, ...patch, updatedAt: nowIso() } : r,
                ),
              },
            },
          };
        });
      },
      removeResignation: (employeeId, id) => {
        set((s) => {
          const prev = s.buckets[employeeId] ?? EMPTY_BUCKET;
          return {
            buckets: {
              ...s.buckets,
              [employeeId]: { ...prev, resignations: prev.resignations.filter((r) => r.id !== id) },
            },
          };
        });
      },

      addClearance: (employeeId, input) => {
        const id = genId('rose-clr');
        const t = nowIso();
        const row: RoseClearanceRecord = repairRecordStrings<RoseClearanceRecord>({ ...input, id, employeeId, createdAt: t, updatedAt: t });
        set((s) => {
          const prev = s.buckets[employeeId] ?? EMPTY_BUCKET;
          return {
            buckets: {
              ...s.buckets,
              [employeeId]: { ...prev, clearances: [row, ...prev.clearances] },
            },
          };
        });
        return id;
      },
      updateClearance: (employeeId, id, patch) => {
        set((s) => {
          const prev = s.buckets[employeeId] ?? EMPTY_BUCKET;
          return {
            buckets: {
              ...s.buckets,
              [employeeId]: {
                ...prev,
                clearances: prev.clearances.map((r) =>
                  r.id === id ? { ...r, ...patch, updatedAt: nowIso() } : r,
                ),
              },
            },
          };
        });
      },
      removeClearance: (employeeId, id) => {
        set((s) => {
          const prev = s.buckets[employeeId] ?? EMPTY_BUCKET;
          return {
            buckets: {
              ...s.buckets,
              [employeeId]: { ...prev, clearances: prev.clearances.filter((r) => r.id !== id) },
            },
          };
        });
      },

      addSettlement: (employeeId, input) => {
        const id = genId('rose-set');
        const t = nowIso();
        const row: RoseSettlementRecord = { ...input, id, employeeId, createdAt: t, updatedAt: t };
        set((s) => {
          const prev = s.buckets[employeeId] ?? EMPTY_BUCKET;
          return {
            buckets: {
              ...s.buckets,
              [employeeId]: { ...prev, settlements: [row, ...prev.settlements] },
            },
          };
        });
        return id;
      },
      updateSettlement: (employeeId, id, patch) => {
        set((s) => {
          const prev = s.buckets[employeeId] ?? EMPTY_BUCKET;
          return {
            buckets: {
              ...s.buckets,
              [employeeId]: {
                ...prev,
                settlements: prev.settlements.map((r) =>
                  r.id === id ? { ...r, ...patch, updatedAt: nowIso() } : r,
                ),
              },
            },
          };
        });
      },
      removeSettlement: (employeeId, id) => {
        set((s) => {
          const prev = s.buckets[employeeId] ?? EMPTY_BUCKET;
          return {
            buckets: {
              ...s.buckets,
              [employeeId]: { ...prev, settlements: prev.settlements.filter((r) => r.id !== id) },
            },
          };
        });
      },

      addExperience: (employeeId, input) => {
        const id = genId('rose-exp');
        const t = nowIso();
        const row: RoseExperienceRecord = { ...input, id, employeeId, createdAt: t, updatedAt: t };
        set((s) => {
          const prev = s.buckets[employeeId] ?? EMPTY_BUCKET;
          return {
            buckets: {
              ...s.buckets,
              [employeeId]: { ...prev, experiences: [row, ...prev.experiences] },
            },
          };
        });
        return id;
      },
      updateExperience: (employeeId, id, patch) => {
        set((s) => {
          const prev = s.buckets[employeeId] ?? EMPTY_BUCKET;
          return {
            buckets: {
              ...s.buckets,
              [employeeId]: {
                ...prev,
                experiences: prev.experiences.map((r) =>
                  r.id === id ? { ...r, ...patch, updatedAt: nowIso() } : r,
                ),
              },
            },
          };
        });
      },
      removeExperience: (employeeId, id) => {
        set((s) => {
          const prev = s.buckets[employeeId] ?? EMPTY_BUCKET;
          return {
            buckets: {
              ...s.buckets,
              [employeeId]: { ...prev, experiences: prev.experiences.filter((r) => r.id !== id) },
            },
          };
        });
      },
    }),
    {
      name: STORAGE_KEY,
      storage: createJSONStorage(() => localStorage),
      version: 1,
      onRehydrateStorage: (state) => {
        // Note: Cannot call setState here due to initialization order.
        // Hydration is handled via useEffect in components.
        void state;
      },
    },
  ),
);
