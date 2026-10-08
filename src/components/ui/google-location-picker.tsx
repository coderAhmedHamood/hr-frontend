'use client';

import * as React from 'react';
import dynamic from 'next/dynamic';
import { useLocale } from 'next-intl';
import { APIProvider, APILoadingStatus, useApiLoadingStatus } from '@vis.gl/react-google-maps';
import {
  isGoogleMapsBillingDisabled,
  markGoogleMapsBillingDisabled,
  suppressGoogleMapsBillingConsoleErrors,
} from '@/components/ui/google-maps-runtime';
import { publicConfig } from '@/shared/config';
import { cn } from '@/shared/utils';
import type { StorefrontLocale } from '@/i18n/routing';

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
  /** Fallback map center before a location is picked (defaults to the region's capital). */
  defaultCenter?: { lat: number; lng: number };
  /**
   * The store's country (ISO code, e.g. YE): map results, place search and the
   * default center stay in it.
   */
  region?: string;
  defaultZoom?: number;
  /**
   * Advanced Markers require a Map ID (Google Cloud Console → Maps → Map Management).
   * Defaults to `NEXT_PUBLIC_GOOGLE_MAPS_MAP_ID`, else `DEMO_MAP_ID` (Google's public
   * sandbox id, for local development only).
   */
  mapId?: string;
  /** When false: renders a static, non-interactive map preview (no search, click, or drag). */
  interactive?: boolean;
}

/** Capital of each store country: the map's center before a location is picked. */
const REGION_CENTERS: Record<string, { lat: number; lng: number }> = {
  YE: { lat: 15.3694, lng: 44.191 }, // Sana'a
  SA: { lat: 24.7136, lng: 46.6753 }, // Riyadh
  AE: { lat: 24.4539, lng: 54.3773 }, // Abu Dhabi
  OM: { lat: 23.588, lng: 58.3829 }, // Muscat
  KW: { lat: 29.3759, lng: 47.9774 }, // Kuwait City
  QA: { lat: 25.2854, lng: 51.531 }, // Doha
  BH: { lat: 26.2285, lng: 50.586 }, // Manama
  EG: { lat: 30.0444, lng: 31.2357 }, // Cairo
  JO: { lat: 31.9454, lng: 35.9284 }, // Amman
};
const DEFAULT_REGION = 'YE';
const InnerMap = dynamic(() => import('./google-location-picker-inner'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full min-h-[16rem] w-full items-center justify-center bg-muted/40 text-sm text-muted-foreground">
      جاري تحميل الخريطة…
    </div>
  ),
});

function MapsUnavailableFallback({
  className,
  height = 280,
}: {
  className?: string;
  height?: number;
}) {
  return (
    <div
      className={cn(
        'flex w-full flex-col items-center justify-center gap-1 rounded-xl border border-dashed border-border bg-muted/30 p-4 text-center',
        className,
      )}
      style={{ minHeight: height }}
    >
      <p className="text-sm font-medium text-foreground">الخريطة غير متاحة حالياً</p>
      <p className="max-w-sm text-xs leading-relaxed text-muted-foreground">
        يمكنك إكمال العنوان يدوياً في الحقول أعلاه. فعّل الفوترة على مشروع Google Cloud لتفعيل الخريطة.
      </p>
    </div>
  );
}

function LoadStatusGate({
  children,
  onFatal,
}: {
  children: React.ReactNode;
  onFatal: () => void;
}) {
  const status = useApiLoadingStatus();

  React.useEffect(() => {
    if (status === APILoadingStatus.FAILED || status === APILoadingStatus.AUTH_FAILURE) {
      markGoogleMapsBillingDisabled();
      onFatal();
    }
  }, [status, onFatal]);

  if (status === APILoadingStatus.FAILED || status === APILoadingStatus.AUTH_FAILURE) {
    return null;
  }

  return <>{children}</>;
}

/** Maps JS API loads language once per script tag — remount provider when locale changes. */
function mapsLanguageFromLocale(locale: string): string {
  return locale.startsWith('ar') ? 'ar' : 'en';
}

export function GoogleLocationPicker({
  value,
  onLocationChange,
  className,
  height = 340,
  defaultCenter,
  region = DEFAULT_REGION,
  defaultZoom = 13,
  mapId = publicConfig.googleMapsMapId || 'DEMO_MAP_ID',
  interactive = true,
}: GoogleLocationPickerProps) {
  const regionCode = (region || DEFAULT_REGION).toUpperCase();
  const center = defaultCenter ?? REGION_CENTERS[regionCode] ?? REGION_CENTERS[DEFAULT_REGION];
  const locale = useLocale() as StorefrontLocale;
  const language = mapsLanguageFromLocale(locale);
  const apiKey = publicConfig.googleMapsApiKey;
  const [mapsUnavailable, setMapsUnavailable] = React.useState(() => isGoogleMapsBillingDisabled());

  React.useLayoutEffect(() => {
    if (mapsUnavailable || !apiKey) return;
    return suppressGoogleMapsBillingConsoleErrors();
  }, [mapsUnavailable, apiKey]);

  const handleMapsFatal = React.useCallback(() => {
    markGoogleMapsBillingDisabled();
    setMapsUnavailable(true);
  }, []);

  if (!apiKey) {
    return <MapsUnavailableFallback className={className} height={height} />;
  }

  if (mapsUnavailable) {
    return <MapsUnavailableFallback className={className} height={height} />;
  }

  return (
    <div className={cn('w-full min-w-0', className)}>
      <APIProvider
        key={`gmaps-${language}`}
        apiKey={apiKey}
        language={language}
        region={regionCode}
        libraries={['places', 'geocoding', 'marker']}
      >
        <LoadStatusGate onFatal={handleMapsFatal}>
          <InnerMap
            value={value}
            onChange={onLocationChange}
            mapId={mapId}
            defaultCenter={center}
            region={regionCode}
            defaultZoom={defaultZoom}
            height={height}
            interactive={interactive}
            onRuntimeError={handleMapsFatal}
          />
        </LoadStatusGate>
      </APIProvider>
    </div>
  );
}
