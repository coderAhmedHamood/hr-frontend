import { create } from 'zustand';
import type { HRDisciplinePenaltyRecord } from './types';

function uid() { return `pen-${Date.now().toString(36)}-${Math.random().toString(36).slice(2,8)}`; }
function now() { return new Date().toISOString(); }

interface PenaltiesState {
  penalties: HRDisciplinePenaltyRecord[];
  add: (d: Omit<HRDisciplinePenaltyRecord,'id'|'createdAt'>) => void;
  remove: (id: string) => void;
}

export const useHRDisciplinePenaltiesStore = create<PenaltiesState>()((set) => ({
  penalties: [],
  add: (d) => set(s => ({ penalties: [...s.penalties, { ...d, id:uid(), createdAt:now() }] })),
  remove: (id) => set(s => ({ penalties: s.penalties.filter(p => p.id !== id) })),
}));
