"use client";

import { useEffect, useRef, useState, type RefObject } from "react";
import { publicConfig } from '@/shared/config';
import { loadHereMapsSdk } from "./here-loader";
import { RIYADH_CENTER, INITIAL_ZOOM } from "../constants/constants";
import type { HereMapRefs, HereMapState } from "../types/types";

// ─────────────────────────────────────────────────────────────────────────────
// useHereMap — loads SDK, initialises map, exposes stable refs
// ─────────────────────────────────────────────────────────────────────────────

export function useHereMap(
  containerRef: RefObject<HTMLDivElement | null>,
): HereMapRefs & HereMapState {
  const mapRef = useRef<H.Map | null>(null);
  const behaviorRef = useRef<H.mapevents.Behavior | null>(null);
  const finalGroupRef = useRef<H.map.Group | null>(null);
  const previewGroupRef = useRef<H.map.Group | null>(null);
  const pinGroupRef = useRef<H.map.Group | null>(null);

  const [isMapReady, setIsMapReady] = useState(false);
  const [mapLoadError, setMapLoadError] = useState<string | null>(null);

  useEffect(() => {
    loadHereMapsSdk()
      .then(() => setIsMapReady(true))
      .catch((error: Error) => setMapLoadError(error.message));
  }, []);

  useEffect(() => {
    if (!isMapReady || !containerRef.current || mapRef.current) return;
    if (typeof window === "undefined" || !window.H) return;
    if (!(window.H as any).service?.Platform) {
      setMapLoadError("HERE Maps service not ready. Please refresh the page.");
      return;
    }

    const H = window.H;
    const apiKey = publicConfig.hereApiKey;
    if (!apiKey) {
      setMapLoadError(
        "مفتاح HERE API غير مُعرّف. أضف NEXT_PUBLIC_HERE_API_KEY في .env.local ثم أعد تشغيل خادم التطوير.",
      );
      return;
    }
    const platform = new H.service.Platform({ apikey: apiKey });

    const defaultLayers = platform.createDefaultLayers({ lg: "ara" }) as unknown as {
      vector: { normal: { map: H.map.layer.Layer } };
    };

    const map = new H.Map(
      containerRef.current,
      defaultLayers.vector.normal.map,
      {
        zoom: INITIAL_ZOOM,
        center: RIYADH_CENTER,
        pixelRatio: 1,
      },
    );
    mapRef.current = map;

    const resizeObserver = new ResizeObserver(() => map.getViewPort().resize());
    resizeObserver.observe(containerRef.current!);

    const mapEvents = new H.mapevents.MapEvents(map);
    behaviorRef.current = new H.mapevents.Behavior(mapEvents);

    H.ui.UI.createDefault(map, defaultLayers as unknown as H.service.DefaultLayers);

    const finalGroup = new H.map.Group();
    const previewGroup = new H.map.Group();
    const pinGroup = new H.map.Group();
    [finalGroup, previewGroup, pinGroup].forEach((group) => map.addObject(group));
    finalGroupRef.current = finalGroup;
    previewGroupRef.current = previewGroup;
    pinGroupRef.current = pinGroup;

    return () => {
      resizeObserver.disconnect();
      finalGroupRef.current = null;
      previewGroupRef.current = null;
      pinGroupRef.current = null;
      behaviorRef.current = null;
      map.dispose();
      mapRef.current = null;
    };
  }, [isMapReady, containerRef]);

  return {
    mapRef, behaviorRef, finalGroupRef, previewGroupRef, pinGroupRef,
    containerRef,
    isMapReady, mapLoadError,
  };
}
