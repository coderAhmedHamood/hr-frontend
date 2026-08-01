/// <reference types="google.maps" />
'use client';

import * as React from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';

/**
 * Wraps the (non-deprecated) `google.maps.Geocoder` to resolve a human-readable address
 * from coordinates. Must be used inside an `<APIProvider>` tree so `useMapsLibrary` can
 * lazily load the `geocoding` library.
 */
export function useGoogleReverseGeocode() {
  const geocodingLibrary = useMapsLibrary('geocoding');
  const [geocoder, setGeocoder] = React.useState<google.maps.Geocoder | null>(null);
  const [isGeocoding, setIsGeocoding] = React.useState(false);

  React.useEffect(() => {
    if (!geocodingLibrary) return;
    setGeocoder(new geocodingLibrary.Geocoder());
  }, [geocodingLibrary]);

  const reverseGeocode = React.useCallback(
    async (lat: number, lng: number): Promise<string | null> => {
      if (!geocoder) return null;
      setIsGeocoding(true);
      try {
        const { results } = await geocoder.geocode({ location: { lat, lng } });
        return results[0]?.formatted_address ?? null;
      } catch {
        // Geocoding failures (ZERO_RESULTS, quota, network) shouldn't block picking a point —
        // caller falls back to showing raw coordinates.
        return null;
      } finally {
        setIsGeocoding(false);
      }
    },
    [geocoder],
  );

  return { reverseGeocode, isGeocoding, isReady: Boolean(geocoder) };
}
