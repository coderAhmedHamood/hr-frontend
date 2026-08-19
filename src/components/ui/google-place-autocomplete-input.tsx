/// <reference types="google.maps" />
'use client';

import * as React from 'react';
import { useLocale } from 'next-intl';
import { useMapsLibrary } from '@vis.gl/react-google-maps';
import { Search } from 'lucide-react';
import { Input } from '@/components/ui/input';
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

type SuggestionRow = {
  key: string;
  label: string;
  prediction: google.maps.places.PlacePrediction;
};

/**
 * Custom-styled place search using Places Autocomplete Data API.
 * Avoids `PlaceAutocompleteElement` (closed shadow DOM / nested borders we can't restyle).
 */
export function GooglePlaceAutocompleteInput({ onPlaceSelect, placeholder, className }: Props) {
  const locale = useLocale();
  const language = locale.startsWith('ar') ? 'ar' : 'en';
  const placesLibrary = useMapsLibrary('places');
  const rootRef = React.useRef<HTMLDivElement>(null);
  const sessionTokenRef = React.useRef<google.maps.places.AutocompleteSessionToken | null>(null);
  const onPlaceSelectRef = React.useRef(onPlaceSelect);
  onPlaceSelectRef.current = onPlaceSelect;

  const [query, setQuery] = React.useState('');
  const [rows, setRows] = React.useState<SuggestionRow[]>([]);
  const [open, setOpen] = React.useState(false);
  const [activeIndex, setActiveIndex] = React.useState(-1);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
        setActiveIndex(-1);
      }
    }
    document.addEventListener('mousedown', handlePointerDown);
    return () => document.removeEventListener('mousedown', handlePointerDown);
  }, []);

  React.useEffect(() => {
    if (!placesLibrary) return;

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      setRows([]);
      setOpen(false);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    const timer = window.setTimeout(async () => {
      try {
        if (!sessionTokenRef.current) {
          sessionTokenRef.current = new placesLibrary.AutocompleteSessionToken();
        }

        const { suggestions } = await placesLibrary.AutocompleteSuggestion.fetchAutocompleteSuggestions({
          input: trimmed,
          sessionToken: sessionTokenRef.current,
          language,
          region: 'ye',
        });

        if (cancelled) return;

        const nextRows: SuggestionRow[] = suggestions
          .map((suggestion, index) => {
            const prediction = suggestion.placePrediction;
            if (!prediction) return null;
            return {
              key: `${prediction.placeId ?? prediction.text?.toString() ?? 'row'}-${index}`,
              label: prediction.text?.toString() ?? '',
              prediction,
            };
          })
          .filter((row): row is SuggestionRow => Boolean(row?.label));

        setRows(nextRows);
        setOpen(nextRows.length > 0);
        setActiveIndex(-1);
      } catch {
        if (!cancelled) {
          setRows([]);
          setOpen(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }, 280);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [placesLibrary, query, language]);

  async function selectRow(row: SuggestionRow) {
    try {
      const place = row.prediction.toPlace();
      await place.fetchFields({ fields: ['location', 'formattedAddress', 'viewport'] });
      if (!place.location) return;

      const address = place.formattedAddress ?? row.label;
      setQuery(address);
      setOpen(false);
      setRows([]);
      setActiveIndex(-1);
      sessionTokenRef.current = null;

      onPlaceSelectRef.current({
        lat: place.location.lat(),
        lng: place.location.lng(),
        address,
        viewport: place.viewport ?? null,
      });
    } catch {
      // Keep the typed query; user can retry another suggestion.
    }
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    if (!open || rows.length === 0) return;

    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIndex((index) => (index + 1) % rows.length);
      return;
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIndex((index) => (index <= 0 ? rows.length - 1 : index - 1));
      return;
    }
    if (event.key === 'Enter' && activeIndex >= 0) {
      event.preventDefault();
      void selectRow(rows[activeIndex]);
      return;
    }
    if (event.key === 'Escape') {
      setOpen(false);
      setActiveIndex(-1);
    }
  }

  return (
    <div ref={rootRef} className={cn('relative w-full min-w-0', className)}>
      <div className="relative">
        <Search
          className="pointer-events-none absolute start-3 top-1/2 z-[1] h-4 w-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden
        />
        <Input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onFocus={() => {
            if (rows.length > 0) setOpen(true);
          }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          autoComplete="off"
          role="combobox"
          aria-expanded={open}
          aria-autocomplete="list"
          aria-controls="google-place-suggestions"
          className="h-12 min-h-12 rounded-xl pe-3 ps-10 text-base leading-normal sm:text-sm"
        />
      </div>

      {open && rows.length > 0 ? (
        <ul
          id="google-place-suggestions"
          role="listbox"
          className="absolute inset-x-0 top-[calc(100%+0.35rem)] z-30 max-h-60 overflow-auto rounded-xl border border-border bg-popover py-1 text-sm shadow-elevated"
        >
          {rows.map((row, index) => (
            <li key={row.key} role="option" aria-selected={index === activeIndex}>
              <button
                type="button"
                className={cn(
                  'flex w-full px-3 py-2.5 text-start text-foreground transition-colors hover:bg-muted/60',
                  index === activeIndex && 'bg-muted/60',
                )}
                onMouseDown={(event) => event.preventDefault()}
                onClick={() => void selectRow(row)}
              >
                <span className="line-clamp-2" dir="auto">
                  {row.label}
                </span>
              </button>
            </li>
          ))}
        </ul>
      ) : null}

      {loading && query.trim().length >= 2 && !open ? (
        <p className="mt-1 text-[11px] text-muted-foreground">جاري البحث…</p>
      ) : null}
    </div>
  );
}
