'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { APIProvider, APILoadingStatus, useApiLoadingStatus } from '@vis.gl/react-google-maps';
import { publicConfig } from '@/shared/config';
import { cn } from '@/shared/utils';

/** Shape returned to the consumer on every location change (search, current-location, click, drag). */
export interface GoogleLocationValue {
  lat: number;
  lng: number;
  address: string;
}

export interface GoogleLocationPickerProps {
  value: GoogleLocationValue | null;
  onLocationChange: (value: GoogleLocationValue) => void;
  className?: string;
  height?: number;
  /** Fallback map center before a location is picked (defaults to Sana'a, Yemen). */
  defaultCenter?: { lat: number; lng: number };
  defaultZoom?: number;
  /**
   * Advanced Markers require a Map ID (Google Cloud Console → Maps → Map Management).
   * `DEMO_MAP_ID` (Google's own public sandbox id) is a safe default for local development
   * only — set a real Map ID via this prop for production so marker styling/vector maps work.
   */
  mapId?: string;
  /** When false: renders a static, non-interactive map preview (no search, click, or drag). */
  interactive?: boolean;
}

const DEFAULT_CENTER = { lat: 15.3694, lng: 44.191 }; // Sana'a, Yemen
const InnerMap = dynamic(() => import('./google-location-picker-inner'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[16rem] w-full items-center justify-center bg-muted/40 text-sm text-muted-foreground">
      جاري تحميل الخريطة…
    </div>
  ),
});

function LoadStatusGate({ children }: { children: React.ReactNode }) {
  const status = useApiLoadingStatus();

  if (status === APILoadingStatus.FAILED || status === APILoadingStatus.AUTH_FAILURE) {
    return (
      <div className="flex h-64 w-full flex-col items-center justify-center gap-1 rounded-lg border border-destructive/30 bg-destructive/5 p-4 text-center">
        <p className="text-sm font-medium text-destructive">تعذر تحميل خرائط جوجل.</p>
        <p className="text-xs text-muted-foreground">
          {status === APILoadingStatus.AUTH_FAILURE
            ? 'مفتاح API غير صالح أو الخدمات المطلوبة غير مفعّلة على مشروع Google Cloud.'
            : 'تحقق من اتصال الإنترنت وأعد المحاولة.'}
        </p>
      </div>
    );
  }

  return <>{children}</>;
}

export function GoogleLocationPicker({
  value,
  onLocationChange,
  className,
  height = 340,
  defaultCenter = DEFAULT_CENTER,
  defaultZoom = 13,
  mapId = 'DEMO_MAP_ID',
  interactive = true,
}: GoogleLocationPickerProps) {
  const apiKey = publicConfig.googleMapsApiKey;

  if (!apiKey) {
    if (process.env.NODE_ENV !== 'production') {
      console.warn(
        '[GoogleLocationPicker] NEXT_PUBLIC_GOOGLE_MAPS_API_KEY is not set — set it in .env.local. See .env.example.',
      );
    }
    return (
      <div className={cn('flex h-64 w-full items-center justify-center rounded-lg border border-dashed border-border bg-muted/30 p-4 text-center text-sm text-muted-foreground', className)}>
        خرائط جوجل غير مُفعّلة — أضف NEXT_PUBLIC_GOOGLE_MAPS_API_KEY في إعدادات المشروع.
      </div>
    );
  }

  return (
    <div className={cn('w-full min-w-0', className)}>
      <APIProvider apiKey={apiKey} libraries={['places', 'geocoding', 'marker']}>
        <LoadStatusGate>
          <InnerMap
            value={value}
            onChange={onLocationChange}
            mapId={mapId}
            defaultCenter={defaultCenter}
            defaultZoom={defaultZoom}
            height={height}
            interactive={interactive}
          />
        </LoadStatusGate>
      </APIProvider>
    </div>
  );
}
