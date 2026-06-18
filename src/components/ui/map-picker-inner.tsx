'use client';

import * as React from 'react';
import { publicConfig } from '@/shared/config';
import { loadHereMapsSdk } from '@/components/here-map/components/here-loader';
import { LocateFixed, Loader2 } from 'lucide-react';
import { Button } from './button';
import type { MapPickerValue } from './map-picker';

// HERE Maps types are loaded at runtime via CDN; use `any` to avoid missing @types/heremaps.
 
type AnyH = any;

interface Props {
  value: MapPickerValue;
  onChange: (v: MapPickerValue) => void;
  height: number;
  interactive: boolean;
  showRadius?: boolean;
}

export default function MapPickerInner({ value, onChange, interactive, showRadius = true }: Props) {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const mapRef       = React.useRef<AnyH>(null);
  const markerRef    = React.useRef<AnyH>(null);
  const circleRef    = React.useRef<AnyH>(null);
  const behaviorRef  = React.useRef<AnyH>(null);

  const [isReady,  setIsReady ] = React.useState(false);
  const [error,    setError   ] = React.useState<string | null>(null);
  const [locating, setLocating] = React.useState(false);

  const valueRef    = React.useRef(value);
  valueRef.current  = value;
  const onChangeRef = React.useRef(onChange);
  onChangeRef.current = onChange;

  // ── Load HERE Maps SDK ────────────────────────────────────────────────────
  React.useEffect(() => {
    loadHereMapsSdk()
      .then(() => setIsReady(true))
      .catch((e: Error) => setError(e.message));
  }, []);

  // ── Initialise map ────────────────────────────────────────────────────────
  React.useEffect(() => {
    if (!isReady || !containerRef.current || mapRef.current) return;
    const win = window as AnyH;
    if (!win.H?.service?.Platform) return;

    const H       = win.H;
    const apiKey = publicConfig.hereApiKey;
    if (!apiKey) {
      setError('مفتاح HERE API غير مُعرّف. أضف NEXT_PUBLIC_HERE_API_KEY في .env.local ثم أعد تشغيل الخادم.');
      return;
    }

    const platform = new H.service.Platform({ apikey: apiKey });
    const layers   = platform.createDefaultLayers({ lg: 'ara' });

    const map = new H.Map(containerRef.current, layers.vector.normal.map, {
      zoom: 16,
      center: { lat: value.latitude, lng: value.longitude },
      pixelRatio: window.devicePixelRatio || 1,
    });
    mapRef.current = map;

    const mapEvents = new H.mapevents.MapEvents(map);
    const behavior  = new H.mapevents.Behavior(mapEvents);
    behaviorRef.current = behavior;

    // Draggable marker
    const marker = new H.map.Marker(
      { lat: value.latitude, lng: value.longitude },
      { volatility: interactive },
    );
    if (interactive) marker.draggable = true;
    map.addObject(marker);
    markerRef.current = marker;

    // Acceptance radius circle (only when showRadius is enabled)
    if (showRadius) {
      const circle = new H.map.Circle(
        { lat: value.latitude, lng: value.longitude },
        value.radiusMeters,
        { style: { fillColor: 'rgba(37,99,235,0.12)', strokeColor: '#2563eb', lineWidth: 2 } },
      );
      map.addObject(circle);
      circleRef.current = circle;
    }

    if (interactive) {
      // Marker drag
      map.addEventListener('dragstart', (e: AnyH) => {
        if (e.target === marker) behavior.disable();
      });
      map.addEventListener('drag', (e: AnyH) => {
        if (e.target !== marker) return;
        const coord = map.screenToGeo(e.currentPointer.viewportX, e.currentPointer.viewportY);
        if (coord) marker.setGeometry(coord);
      });
      map.addEventListener('dragend', (e: AnyH) => {
        if (e.target !== marker) return;
        behavior.enable();
        const pos = marker.getGeometry();
        onChangeRef.current({ ...valueRef.current, latitude: pos.lat, longitude: pos.lng });
      });

      // Tap-to-move
      map.addEventListener('tap', (e: AnyH) => {
        if (e.target === marker) return;
        const coord = map.screenToGeo(e.currentPointer.viewportX, e.currentPointer.viewportY);
        if (!coord) return;
        onChangeRef.current({ ...valueRef.current, latitude: coord.lat, longitude: coord.lng });
      });
    }

    // Keep tiles correct inside dialogs / resizable containers
    const ro = new ResizeObserver(() => map.getViewPort()?.resize());
    ro.observe(containerRef.current!);

    return () => {
      ro.disconnect();
      map.dispose();
      mapRef.current      = null;
      markerRef.current   = null;
      circleRef.current   = null;
      behaviorRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isReady, interactive]);

  // ── Sync marker + circle position when coordinates change ────────────────
  React.useEffect(() => {
    const map    = mapRef.current;
    const marker = markerRef.current;
    if (!map || !marker) return;
    const pos = { lat: value.latitude, lng: value.longitude };
    marker.setGeometry(pos);
    circleRef.current?.setCenter(pos);
    map.setCenter(pos, true);
  }, [value.latitude, value.longitude]);

  // ── Sync circle radius when radius changes ────────────────────────────────
  React.useEffect(() => {
    circleRef.current?.setRadius(value.radiusMeters);
  }, [value.radiusMeters]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const locateMe = () => {
    if (!navigator.geolocation) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      ({ coords }) => {
        setLocating(false);
        onChange({ ...value, latitude: coords.latitude, longitude: coords.longitude });
        mapRef.current?.setCenter({ lat: coords.latitude, lng: coords.longitude }, true);
        mapRef.current?.setZoom(17, true);
      },
      () => setLocating(false),
      { timeout: 8000 },
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  if (error) {
    return (
      <div className="flex h-full items-center justify-center bg-muted/30 p-4 text-center text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (!isReady) {
    return (
      <div className="flex h-full items-center justify-center gap-2 bg-muted/20 text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        جاري تحميل الخريطة…
      </div>
    );
  }

  return (
    <div className="relative isolate h-full w-full overflow-hidden">
      {/* HERE Maps canvas */}
      <div ref={containerRef} className="absolute inset-0" style={{ userSelect: 'none' }} />

      {/* Coords badge — top end */}
      <div
        className="absolute end-3 top-3 z-10 rounded-md border border-border bg-card/90 px-2 py-1 font-mono text-[10px] text-muted-foreground backdrop-blur-sm"
        dir="ltr"
      >
        {value.latitude.toFixed(6)}, {value.longitude.toFixed(6)}
      </div>

      {interactive && (
        <>
          {/* My location button — top start */}
          <Button
            type="button"
            variant="outline"
            size="icon"
            className="absolute start-3 top-3 z-10 h-8 w-8 rounded-lg bg-card/95 shadow-md backdrop-blur-sm"
            onClick={locateMe}
            disabled={locating}
            title="موقعي الحالي"
          >
            {locating
              ? <Loader2 className="h-4 w-4 animate-spin" />
              : <LocateFixed className="h-4 w-4" />}
          </Button>

          {/* Hint — below location button */}
          <div className="absolute start-3 top-14 z-10 max-w-[min(15rem,calc(100%-1.5rem))] rounded-md border border-border bg-card/90 px-2 py-1 text-[10px] text-muted-foreground backdrop-blur-sm">
            انقر لتحديد الموقع · اسحب الدبوس
          </div>
        </>
      )}
    </div>
  );
}
