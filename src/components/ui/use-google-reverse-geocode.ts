/// <reference types="google.maps" />
'use client';

import * as React from 'react';
import { useLocale } from 'next-intl';
import { useMapsLibrary } from '@vis.gl/react-google-maps';

let geocodingUnavailable = false;

function geocodeLooksBillingBlocked(error: unknown): boolean {
  const text =
    error instanceof Error
      ? `${error.name} ${error.message}`
      : typeof error === 'string'
        ? error
        : String(error ?? '');
  const lower = text.toLowerCase();
  return (
    lower.includes('request_denied') ||
    lower.includes('billing') ||
    lower.includes('gmp-get-started')
  );
}

/**
 * Wraps the (non-deprecated) `google.maps.Geocoder` to resolve a human-readable address
 * from coordinates. Must be used inside an `<APIProvider>` tree so `useMapsLibrary` can
 * lazily load the `geocoding` library.
 */
export function useGoogleReverseGeocode() {
  const locale = useLocale();
  const language = locale.startsWith('ar') ? 'ar' : 'en';
  const geocodingLibrary = useMapsLibrary('geocoding');
  const [geocoder, setGeocoder] = React.useState<google.maps.Geocoder | null>(null);
  const [isGeocoding, setIsGeocoding] = React.useState(false);

  React.useEffect(() => {
    if (!geocodingLibrary) return;
    setGeocoder(new geocodingLibrary.Geocoder());
  }, [geocodingLibrary]);

  const reverseGeocode = React.useCallback(
    async (lat: number, lng: number): Promise<string | null> => {
      if (!geocoder || geocodingUnavailable) return null;
      setIsGeocoding(true);
      try {
        const { results } = await geocoder.geocode({
          location: { lat, lng },
          language,
        });
        return results[0]?.formatted_address ?? null;
      } catch (error) {
        if (geocodeLooksBillingBlocked(error)) {
          geocodingUnavailable = true;
        }
        // Geocoding failures shouldn't block picking a point — show raw coordinates.
        return null;
      } finally {
        setIsGeocoding(false);
      }
    },
    [geocoder, language],
  );

  return { reverseGeocode, isGeocoding, isReady: Boolean(geocoder) };
}
