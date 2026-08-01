/// <reference types="google.maps" />
'use client';

import * as React from 'react';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { Search } from 'lucide-react';
import { cn } from '@/shared/utils';

export type PlaceAutocompleteSelection = {
  lat: number;
  lng: number;
  address: string;
  viewport: google.maps.LatLngBounds | null;
};

type Props = {
  onPlaceSelect: (place: PlaceAutocompleteSelection) => void;
  placeholder?: string;
  className?: string;
};

/**
 * `google.maps.places.Autocomplete` was deprecated for new customers on 2025-03-01 in favor
 * of the web-component-based `PlaceAutocompleteElement`. @vis.gl/react-google-maps has no
 * ready-made wrapper for it yet, so we mount the custom element imperatively via a ref and
 * bridge its `gmp-select` event back into React state.
 */
export function GooglePlaceAutocompleteInput({ onPlaceSelect, placeholder, className }: Props) {
  const placesLibrary = useMapsLibrary('places');
  const containerRef = React.useRef<HTMLDivElement>(null);
  const elementRef = React.useRef<google.maps.places.PlaceAutocompleteElement | null>(null);

  // Keep the latest callback in a ref so the effect below can stay scoped to `[placesLibrary]`
  // — recreating the web component on every parent render would drop the user's typed query.
  const onPlaceSelectRef = React.useRef(onPlaceSelect);
  onPlaceSelectRef.current = onPlaceSelect;

  React.useEffect(() => {
    if (!placesLibrary || !containerRef.current) return;

    const autocompleteElement = new placesLibrary.PlaceAutocompleteElement({});
    autocompleteElement.className = 'w-full';
    containerRef.current.appendChild(autocompleteElement);
    elementRef.current = autocompleteElement;

    async function handleSelect(event: Event) {
      const placePrediction = (event as unknown as { placePrediction: google.maps.places.PlacePrediction }).placePrediction;
      if (!placePrediction) return;

      const place = placePrediction.toPlace();
      await place.fetchFields({ fields: ['location', 'formattedAddress', 'viewport'] });

      if (!place.location) return;
      onPlaceSelectRef.current({
        lat: place.location.lat(),
        lng: place.location.lng(),
        address: place.formattedAddress ?? '',
        viewport: place.viewport ?? null,
      });
    }

    autocompleteElement.addEventListener('gmp-select', handleSelect);

    return () => {
      autocompleteElement.removeEventListener('gmp-select', handleSelect);
      autocompleteElement.remove();
      elementRef.current = null;
    };
  }, [placesLibrary]);

  return (
    <div
      className={cn(
        'flex items-center gap-2 rounded-md border border-input bg-background px-3 focus-within:ring-2 focus-within:ring-ring',
        className,
      )}
    >
      <Search className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden />
      <div ref={containerRef} className="min-w-0 flex-1 py-1" data-placeholder={placeholder} />
    </div>
  );
}
