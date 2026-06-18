"use client";

import { useEffect, useRef, useState, useCallback, type RefObject } from "react";
import { geocodeQuery } from "./geocoding";
import { publicConfig } from '@/shared/config';
import { SEARCH_DEBOUNCE_MS, FLY_ZOOM_OUT_LEVEL, FLY_DESTINATION_ZOOM } from "../constants/constants";
import type { CitySearchState, GeocodingResult } from "../types/types";

// ─────────────────────────────────────────────────────────────────────────────
// useCitySearch — debounced geocoding + animated fly-to
// ─────────────────────────────────────────────────────────────────────────────

export function useCitySearch(mapRef: RefObject<H.Map | null>): CitySearchState {
  const [searchQuery,        setSearchQuery       ] = useState("");
  const [searchResults,      setSearchResults     ] = useState<GeocodingResult[]>([]);
  const [isSearching,        setIsSearching       ] = useState(false);
  const [searchErrorMessage, setSearchErrorMessage] = useState<string | null>(null);
  const [flyingToLabel,      setFlyingToLabel     ] = useState<string | null>(null);

  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSearchInput = useCallback((query: string) => {
    setSearchQuery(query);
    setSearchResults([]);
    setSearchErrorMessage(null);

    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    if (query.trim().length < 2) return;

    debounceTimerRef.current = setTimeout(async () => {
      setIsSearching(true);
      try {
        const apiKey = publicConfig.hereApiKey;
        const results = await geocodeQuery(query, apiKey);
        setSearchResults(results);
        if (results.length === 0) setSearchErrorMessage("لا توجد نتائج.");
      } catch {
        setSearchErrorMessage("فشل البحث. تحقق من الاتصال.");
      } finally {
        setIsSearching(false);
      }
    }, SEARCH_DEBOUNCE_MS);
  }, []);

  /**
   * Animates the map from its current position to a search result in 3 phases:
   *   Phase 1  (immediate)  – zoom out to FLY_ZOOM_OUT_LEVEL
   *   Phase 2  (700 ms)     – pan to destination at mid-zoom
   *   Phase 3  (1 400 ms)   – zoom into destination at FLY_DESTINATION_ZOOM
   */
  const flyToLocation = useCallback(
    (result: GeocodingResult) => {
      const map = mapRef.current;
      if (!map) return;

      setSearchResults([]);
      setSearchQuery(result.title);
      setFlyingToLabel(result.title);

      const destination: H.geo.IPoint = {
        lat: result.latitude,
        lng: result.longitude,
      };

      map.setZoom(Math.min(map.getZoom(), FLY_ZOOM_OUT_LEVEL), true);

      setTimeout(() => {
        map.setCenter(destination, true);
      }, 700);

      setTimeout(() => {
        try {
          map.getViewModel().setLookAtData(
            { position: destination, zoom: FLY_DESTINATION_ZOOM },
            true,
          );
        } catch {
          map.setCenter(destination, true);
          map.setZoom(FLY_DESTINATION_ZOOM, true);
        }
        setTimeout(() => setFlyingToLabel(null), 800);
      }, 1_400);
    },
    [mapRef],
  );

  return {
    searchQuery,
    searchResults,
    isSearching,
    searchErrorMessage,
    flyingToLabel,
    handleSearchInput,
    flyToLocation,
  };
}
