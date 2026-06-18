'use client';

import * as React from 'react';
import { Plus, Trash2, ChevronUp, ChevronDown, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MinimalDropdown, SearchableDropdown } from '@/features/hr/requests/components/shared-ui';
import type { HRApprovalStage, HRApprovalStageMode } from '@/features/hr/requests/lib/types';
import { useHREmployeeDirectoryStore } from '@/features/hr/requests/lib/employee-directory-store';
import { cn } from '@/shared/utils';

function uid() { return `stage-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`; }

const MODE_OPTIONS: { value: HRApprovalStageMode; label: string; sub: string }[] = [
  { value: 'sequential', label: 'تسلسلي', sub: 'واحد بعد الآخر' },
  { value: 'parallel', label: 'متوازٍ', sub: 'جميعهم في آنٍ واحد' },
  { value: 'any_one', label: 'موافقة أحد المعتمدين', sub: 'يكفي أن يوافق واحد من القائمة' },
  { value: 'optional', label: 'اختياري', sub: 'لا يوقف السلسلة' },
];

interface StageRowProps {
  stage: HRApprovalStage;
  index: number;
  total: number;
  onChange: (s: HRApprovalStage) => void;
  onRemove: () => void;
  onMove: (dir: 'up' | 'down') => void;
}

function StageRow({ stage, index, total, onChange, onRemove, onMove }: StageRowProps) {
  const { activeEmployees } = useHREmployeeDirectoryStore();
  const empOptions = activeEmployees.map(e => ({ value: e.id, label: e.nameAr, sub: e.jobTitleAr }));

  const addApprover = (id: string) => {
    if (!id || stage.approverEmployeeIds.includes(id)) return;
    onChange({ ...stage, approverEmployeeIds: [...stage.approverEmployeeIds, id] });
  };

  const removeApprover = (id: string) => onChange({ ...stage, approverEmployeeIds: stage.approverEmployeeIds.filter(a => a !== id) });

  const available = empOptions.filter(o => !stage.approverEmployeeIds.includes(o.value));

  return (
    <div className="rounded-xl border-2 border-border bg-card p-4 space-y-3">
      <div className="flex items-center gap-2">
        <div className="flex flex-col gap-0.5 shrink-0">
          <button type="button" disabled={index === 0} onClick={() => onMove('up')} className="disabled:opacity-30 hover:text-primary"><ChevronUp className="h-3.5 w-3.5" /></button>
          <button type="button" disabled={index === total - 1} onClick={() => onMove('down')} className="disabled:opacity-30 hover:text-primary"><ChevronDown className="h-3.5 w-3.5" /></button>
        </div>
        <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary/10 text-[11px] font-bold text-primary">{index + 1}</span>
        <div className="flex-1">
          <MinimalDropdown
            value={stage.mode}
            onChange={v => onChange({ ...stage, mode: v as HRApprovalStageMode })}
            options={MODE_OPTIONS}
          />
        </div>
        {stage.mode === 'optional' && (
          <div className="flex items-center gap-1.5">
            <Label className="text-xs text-muted-foreground whitespace-nowrap">مهلة (ساعة)</Label>
            <Input
              type="number"
              min={0}
              className="h-8 w-20 text-xs"
              value={stage.optionalTimeoutHours ?? ''}
              onChange={e => onChange({ ...stage, optionalTimeoutHours: e.target.value ? Number(e.target.value) : undefined })}
            />
          </div>
        )}
        <Button variant="ghost" size="icon" type="button" className="h-8 w-8 shrink-0 text-destructive hover:text-destructive" onClick={onRemove}>
          <Trash2 className="h-3.5 w-3.5" />
        </Button>
      </div>

      {/* Approvers */}
      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5">
          {stage.approverEmployeeIds.map(id => {
            const emp = activeEmployees.find(e => e.id === id);
            return (
              <span key={id} className="inline-flex items-center gap-1 rounded-full border border-border bg-muted/60 px-2.5 py-0.5 text-xs font-medium">
                {emp?.nameAr ?? id}
                <button type="button" onClick={() => removeApprover(id)} className="hover:text-destructive"><X className="h-3 w-3" /></button>
              </span>
            );
          })}
        </div>
        <SearchableDropdown
          value=""
          onChange={addApprover}
          options={available}
          placeholder="إضافة معتمد…"
          allowClear={false}
        />
      </div>

      {/* Parallel count rule */}
      {stage.mode === 'parallel' && stage.approverEmployeeIds.length > 1 && (
        <div className="flex items-center gap-2 border-t border-border/50 pt-2">
          <Label className="text-xs text-muted-foreground">القاعدة</Label>
          <MinimalDropdown
            value={stage.parallelRule?.kind ?? 'all'}
            onChange={v => onChange({ ...stage, parallelRule: v === 'all' ? { kind: 'all' } : { kind: 'count', required: 1 } })}
            options={[{ value: 'all', label: 'جميعهم' }, { value: 'count', label: 'عدد محدد' }]}
          />
          {stage.parallelRule?.kind === 'count' && (
            <Input
              type="number"
              min={1}
              max={stage.approverEmployeeIds.length}
              className="h-8 w-20 text-xs"
              value={stage.parallelRule.required ?? 1}
              onChange={e => onChange({ ...stage, parallelRule: { kind: 'count', required: Number(e.target.value) } })}
            />
          )}
        </div>
      )}
    </div>
  );
}

interface Props {
  stages: HRApprovalStage[];
  onChange: (stages: HRApprovalStage[]) => void;
}

export function HRRequestApprovalFlowEditor({ stages, onChange }: Props) {
  const add = () => onChange([...stages, { id: uid(), sortOrder: stages.length + 1, mode: 'sequential', approverEmployeeIds: [] }]);

  const update = (idx: number, s: HRApprovalStage) => {
    const next = [...stages];
    next[idx] = s;
    onChange(next);
  };

  const remove = (idx: number) => onChange(stages.filter((_, i) => i !== idx).map((s, i) => ({ ...s, sortOrder: i + 1 })));

  const move = (idx: number, dir: 'up' | 'down') => {
    const next = [...stages];
    const swap = dir === 'up' ? idx - 1 : idx + 1;
    if (swap < 0 || swap >= next.length) return;
    [next[idx], next[swap]] = [next[swap]!, next[idx]!];
    onChange(next.map((s, i) => ({ ...s, sortOrder: i + 1 })));
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm font-semibold">مراحل الموافقة <span className="text-muted-foreground font-normal">({stages.length})</span></p>
        <Button variant="outline" size="sm" type="button" className="gap-1.5" onClick={add}>
          <Plus className="h-4 w-4" /> إضافة مرحلة
        </Button>
      </div>
      {stages.length === 0 && (
        <div className="rounded-xl border-2 border-dashed border-border py-6 text-center text-sm text-muted-foreground">
          لا توجد مراحل موافقة. الطلبات ستُعتمد تلقائياً.
        </div>
      )}
      <div className="space-y-2">
        {stages.map((s, i) => (
          <StageRow key={s.id} stage={s} index={i} total={stages.length} onChange={upd => update(i, upd)} onRemove={() => remove(i)} onMove={dir => move(i, dir)} />
        ))}
      </div>
    </div>
  );
}
