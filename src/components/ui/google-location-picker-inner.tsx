'use client';

import * as React from 'react';
import { AdvancedMarker, Map, useMap } from '@vis.gl/react-google-maps';
import { LocateFixed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GooglePlaceAutocompleteInput } from '@/components/ui/google-place-autocomplete-input';
import { useGoogleReverseGeocode } from '@/components/ui/use-google-reverse-geocode';
import { useCurrentGeolocation } from '@/components/ui/use-current-geolocation';
import type { GoogleLocationValue } from '@/components/ui/google-location-picker';
import { markGoogleMapsBillingDisabled } from '@/components/ui/google-maps-runtime';
import { cn } from '@/shared/utils';

type Props = {
  value: GoogleLocationValue | null;
  onChange: (value: GoogleLocationValue) => void;
  mapId: string;
  defaultCenter: { lat: number; lng: number };
  defaultZoom: number;
  height: number;
  interactive: boolean;
  onRuntimeError?: () => void;
};

/** Recenters/pans the map imperatively whenever the marker position changes from outside a drag gesture. */
function MapRecenter({ position }: { position: { lat: number; lng: number } | null }) {
  const map = useMap();
  const lastAppliedRef = React.useRef<string | null>(null);

  React.useEffect(() => {
    if (!map || !position) return;
    const key = `${position.lat},${position.lng}`;
    if (lastAppliedRef.current === key) return;
    lastAppliedRef.current = key;
    map.panTo(position);
  }, [map, position]);

  return null;
}

/** Hide fullscreen + camera controls (cameraControl isn't tracked by @vis.gl setOptions whitelist). */
function MapUiControls() {
  const map = useMap();

  React.useEffect(() => {
    if (!map) return;
    map.setOptions({
      fullscreenControl: false,
      cameraControl: false,
      rotateControl: false,
      streetViewControl: false,
      mapTypeControl: false,
    });
  }, [map]);

  return null;
}

export default function GoogleLocationPickerInner({
  value,
  onChange,
  mapId,
  defaultCenter,
  defaultZoom,
  height,
  interactive,
  onRuntimeError,
}: Props) {
  const { reverseGeocode } = useGoogleReverseGeocode();
  const { locate, isLocating, error: geolocationError } = useCurrentGeolocation();
  const mapContainerRef = React.useRef<HTMLDivElement>(null);
  const [hasRuntimeMapError, setHasRuntimeMapError] = React.useState(false);
  const onRuntimeErrorRef = React.useRef(onRuntimeError);
  onRuntimeErrorRef.current = onRuntimeError;

  // The JS API renders billing/config errors (e.g. BillingNotEnabledMapError) as a raw,
  // unstyled "This page can't load Google Maps correctly" dialog injected directly into the
  // map div — there's no React-level callback for it. A MutationObserver watching for
  // Google's `.gm-err-container` node is the documented workaround so we can unmount Maps
  // and stop further console/API noise for the rest of the session.
  React.useEffect(() => {
    const container = mapContainerRef.current;
    if (!container) return;

    const fail = () => {
      markGoogleMapsBillingDisabled();
      setHasRuntimeMapError(true);
      onRuntimeErrorRef.current?.();
    };

    if (container.querySelector('.gm-err-container')) {
      fail();
      return;
    }

    const observer = new MutationObserver(() => {
      if (container.querySelector('.gm-err-container')) {
        fail();
        observer.disconnect();
      }
    });
    observer.observe(container, { childList: true, subtree: true });
    return () => observer.disconnect();
  }, []);

  const position = value ? { lat: value.lat, lng: value.lng } : defaultCenter;

  const applyPoint = React.useCallback(
    async (lat: number, lng: number, knownAddress?: string) => {
      // Show the point immediately; backfill the address once the Geocoder resolves so the
      // marker never feels laggy while waiting on a network round-trip.
      onChange({ lat, lng, address: knownAddress ?? value?.address ?? '' });
      if (knownAddress) return;
      const address = await reverseGeocode(lat, lng);
      if (address) onChange({ lat, lng, address });
    },
    [onChange, reverseGeocode, value?.address],
  );

  async function handleUseCurrentLocation() {
    try {
      const coords = await locate();
      await applyPoint(coords.lat, coords.lng);
    } catch {
      // Error state is surfaced via `geolocationError` below — nothing else to do here.
    }
  }

  return (
    <div className="flex flex-col gap-3">
      {interactive ? (
        <div className="flex flex-col gap-2.5">
          <GooglePlaceAutocompleteInput
            className="w-full"
            placeholder="ابحث عن عنوان…"
            onPlaceSelect={(place) => void applyPoint(place.lat, place.lng, place.address)}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleUseCurrentLocation()}
            disabled={isLocating}
            className="h-11 w-full gap-2 rounded-xl border-border bg-background text-sm font-medium hover:bg-muted/40 sm:w-auto sm:self-start"
          >
            <LocateFixed className={cn('h-4 w-4', isLocating && 'animate-pulse')} aria-hidden />
            {isLocating ? 'جاري تحديد الموقع…' : 'استخدم موقعي الحالي'}
          </Button>
        </div>
      ) : null}

      {geolocationError ? (
        <p className="text-xs text-destructive">
          {geolocationError === 'permission-denied'
            ? 'تم رفض إذن الوصول للموقع. فعّله من إعدادات المتصفح للاستخدام.'
            : 'تعذر تحديد موقعك الحالي. حاول مجددًا أو اختر الموقع يدويًا على الخريطة.'}
        </p>
      ) : null}

      <div
        ref={mapContainerRef}
        className="relative w-full min-w-0 overflow-hidden rounded-xl border border-border bg-muted/20"
        style={{ height }}
      >
        {hasRuntimeMapError ? (
          <div className="flex h-full w-full flex-col items-center justify-center gap-1 bg-muted/40 p-4 text-center">
            <p className="text-sm font-medium text-foreground">تعذر تحميل خريطة جوجل.</p>
            <p className="text-xs text-muted-foreground">
              يمكنك متابعة إدخال العنوان يدوياً في الحقول أعلاه.
            </p>
          </div>
        ) : (
          <Map
            mapId={mapId}
            defaultCenter={defaultCenter}
            defaultZoom={defaultZoom}
            gestureHandling="greedy"
            zoomControl
            streetViewControl={false}
            mapTypeControl={false}
            fullscreenControl={false}
            rotateControl={false}
            onClick={(event) => {
              if (!interactive || !event.detail.latLng) return;
              void applyPoint(event.detail.latLng.lat, event.detail.latLng.lng);
            }}
          >
            <MapUiControls />
            <MapRecenter position={value ? position : null} />
            <AdvancedMarker
              position={position}
              draggable={interactive}
              onDragEnd={(event) => {
                const latLng = event.latLng;
                if (!latLng) return;
                void applyPoint(latLng.lat(), latLng.lng());
              }}
            />
          </Map>
        )}
      </div>

      {value ? (
        <p className="truncate text-xs leading-relaxed text-muted-foreground" dir="auto">
          {value.address || `${value.lat.toFixed(6)}, ${value.lng.toFixed(6)}`}
        </p>
      ) : null}
    </div>
  );
}
