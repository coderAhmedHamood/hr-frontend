'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { cn } from '@/shared/utils';

export interface MapPickerValue {
  latitude: number;
  longitude: number;
  radiusMeters: number;
}

export interface MapPickerProps {
  value: MapPickerValue;
  onChange: (v: MapPickerValue) => void;
  className?: string;
  height?: number;
  minRadius?: number;
  maxRadius?: number;
  /** When false: read-only map (no click-to-move, no radius overlay, marker not draggable). */
  interactive?: boolean;
  /** When false: hides the acceptance-radius circle and slider. Default true. */
  showRadius?: boolean;
}

const InnerMap = dynamic(() => import('./map-picker-inner'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center bg-muted/40 text-sm text-muted-foreground">
      جاري تحميل الخريطة…
    </div>
  ),
});

export function MapPicker({
  value,
  onChange,
  className,
  height = 340,
  minRadius = 10,
  maxRadius = 2000,
  interactive = true,
  showRadius = true,
}: MapPickerProps) {
  return (
    <div
      className={cn('w-full min-w-0 overflow-hidden rounded-lg border border-border shadow-soft', className)}
      style={{ height }}
    >
      <InnerMap
        value={value}
        onChange={onChange}
        height={height}
        interactive={interactive}
        showRadius={showRadius}
      />
    </div>
  );
}
