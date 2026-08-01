'use client';

import * as React from 'react';

export type GeolocationCoords = {
  lat: number;
  lng: number;
};

export type GeolocationErrorReason = 'unsupported' | 'permission-denied' | 'position-unavailable' | 'timeout' | 'unknown';

/**
 * Thin wrapper around `navigator.geolocation` exposing an imperative `locate()` call
 * plus loading/error state — kept UI-agnostic so any "use my location" button can reuse it.
 */
export function useCurrentGeolocation() {
  const [isLocating, setIsLocating] = React.useState(false);
  const [error, setError] = React.useState<GeolocationErrorReason | null>(null);

  const locate = React.useCallback((): Promise<GeolocationCoords> => {
    setError(null);

    if (typeof navigator === 'undefined' || !navigator.geolocation) {
      setError('unsupported');
      return Promise.reject(new Error('unsupported'));
    }

    setIsLocating(true);
    return new Promise<GeolocationCoords>((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setIsLocating(false);
          resolve({ lat: position.coords.latitude, lng: position.coords.longitude });
        },
        (positionError) => {
          setIsLocating(false);
          const reason: GeolocationErrorReason =
            positionError.code === positionError.PERMISSION_DENIED
              ? 'permission-denied'
              : positionError.code === positionError.POSITION_UNAVAILABLE
                ? 'position-unavailable'
                : positionError.code === positionError.TIMEOUT
                  ? 'timeout'
                  : 'unknown';
          setError(reason);
          reject(new Error(reason));
        },
        // High accuracy first; 10s timeout avoids hanging indefinitely on a slow GPS fix.
        { enableHighAccuracy: true, timeout: 10_000, maximumAge: 0 },
      );
    });
  }, []);

  return { locate, isLocating, error };
}
