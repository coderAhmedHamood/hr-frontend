'use client';

import * as React from 'react';
import { AdvancedMarker, Map, useMap } from '@vis.gl/react-google-maps';
import { LocateFixed } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { GooglePlaceAutocompleteInput } from '@/components/ui/google-place-autocomplete-input';
import { useGoogleReverseGeocode } from '@/components/ui/use-google-reverse-geocode';
import { useCurrentGeolocation } from '@/components/ui/use-current-geolocation';
import type { GoogleLocationValue } from '@/components/ui/google-location-picker';
import { cn } from '@/shared/utils';

type Props = {
  value: GoogleLocationValue | null;
  onChange: (value: GoogleLocationValue) => void;
  mapId: string;
  defaultCenter: { lat: number; lng: number };
  defaultZoom: number;
  height: number;
  interactive: boolean;
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

export default function GoogleLocationPickerInner({
  value,
  onChange,
  mapId,
  defaultCenter,
  defaultZoom,
  height,
  interactive,
}: Props) {
  const { reverseGeocode } = useGoogleReverseGeocode();
  const { locate, isLocating, error: geolocationError } = useCurrentGeolocation();

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
    <div className="flex flex-col gap-2">
      {interactive ? (
        <div className="flex flex-col gap-2 sm:flex-row">
          <GooglePlaceAutocompleteInput
            className="flex-1"
            placeholder="ابحث عن عنوان…"
            onPlaceSelect={(place) => void applyPoint(place.lat, place.lng, place.address)}
          />
          <Button
            type="button"
            variant="outline"
            onClick={() => void handleUseCurrentLocation()}
            disabled={isLocating}
            className="shrink-0 gap-2"
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

      <div className="w-full min-w-0 overflow-hidden rounded-lg border border-border" style={{ height }}>
        <Map
          mapId={mapId}
          defaultCenter={defaultCenter}
          defaultZoom={defaultZoom}
          gestureHandling="greedy"
          disableDefaultUI={false}
          streetViewControl={false}
          mapTypeControl={false}
          onClick={(event) => {
            if (!interactive || !event.detail.latLng) return;
            void applyPoint(event.detail.latLng.lat, event.detail.latLng.lng);
          }}
        >
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
      </div>

      {value ? (
        <p className="truncate text-xs text-muted-foreground" dir="auto">
          {value.address || `${value.lat.toFixed(6)}, ${value.lng.toFixed(6)}`}
        </p>
      ) : null}
    </div>
  );
}
