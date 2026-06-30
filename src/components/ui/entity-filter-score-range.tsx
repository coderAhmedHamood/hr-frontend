'use client';

import * as React from 'react';
import { Star } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { cn } from '@/shared/utils';

type Props = {
  min: string;
  max: string;
  onMinChange: (value: string) => void;
  onMaxChange: (value: string) => void;
  className?: string;
};

/** Min/max score inputs for `ListFilterBar` `beforeEmployeePicker` / `trailingActions`. */
export function EntityFilterScoreRange({
  min,
  max,
  onMinChange,
  onMaxChange,
  className,
}: Props) {
  return (
    <div className={cn('flex shrink-0 items-center gap-1.5', className)}>
      <div className="relative w-[5.5rem]">
        <Star className="absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-gold" />
        <Input
          type="number"
          min={0}
          max={100}
          placeholder="نقاط ≥"
          value={min}
          onChange={(e) => onMinChange(e.target.value)}
          className="h-8 pr-7 text-xs"
        />
      </div>
      <div className="relative w-[5.5rem]">
        <Star className="absolute right-2 top-1/2 h-3 w-3 -translate-y-1/2 text-muted-foreground" />
        <Input
          type="number"
          min={0}
          max={100}
          placeholder="نقاط ≤"
          value={max}
          onChange={(e) => onMaxChange(e.target.value)}
          className="h-8 pr-7 text-xs"
        />
      </div>
    </div>
  );
}
