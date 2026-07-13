'use client';

import * as React from 'react';
import { Loader2, LocateFixed, MapPin, Save, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import * as VisuallyHidden from '@radix-ui/react-visually-hidden';
import { MapPicker } from '@/components/ui/map-picker';
import type { AttendanceCheckInPoint } from '@/features/hr/attendance/lib/types';
import { cn } from '@/shared/utils';
import type { CheckpointsPanelModel } from '@/features/hr/attendance/checkpoints/hooks/useCheckpointsPanelModel';

export function CheckpointsEditDialog({
  model,
  checkpoints,
}: {
  model: CheckpointsPanelModel;
  checkpoints: AttendanceCheckInPoint[];
}) {
  const {
    open,
    setOpen,
    draft,
    setDraft,
    error,
    geoQuery,
    setGeoQuery,
    geoLoading,
    geoError,
    geoSuggestions,
    pickSuggestion,
    save,
    setGeoSuggestions,
  } = model;

  const isEditing = !!draft && checkpoints.some((c) => c.id === draft.id);

  // Measure the map panel so Leaflet gets a real pixel height
  const mapPanelRef = React.useRef<HTMLDivElement>(null);
  const [mapHeight, setMapHeight] = React.useState(600);
  React.useEffect(() => {
    const el = mapPanelRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => {
      const h = entry.contentRect.height;
      if (h > 0) setMapHeight(h);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {/* Full-screen-ish dialog, two-column on md+ */}
      <DialogContent
        className="flex h-[92vh] max-h-[92vh] w-[96vw] max-w-6xl flex-col gap-0 overflow-hidden border-border p-0"
        dir="rtl"
        hideClose
      >
        <VisuallyHidden.Root>
          <DialogTitle>{isEditing ? 'تعديل نقطة التسجيل' : 'نقطة تسجيل جديدة'}</DialogTitle>
        </VisuallyHidden.Root>
        {/* ── Top bar ─────────────────────────────────────────────────── */}
        <div className="flex shrink-0 items-center justify-between border-b border-border bg-card px-5 py-3.5">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <MapPin className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-base font-semibold leading-tight">
                {isEditing ? 'تعديل نقطة التسجيل' : 'نقطة تسجيل جديدة'}
              </h2>
              <p className="text-xs text-muted-foreground">
                ابحث عن الموقع أو انقر على الخريطة لتحديده
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {draft?.isActive !== undefined && (
              <Badge variant={draft.isActive ? 'default' : 'secondary'} className="text-xs">
                {draft.isActive ? 'نشط' : 'معطّل'}
              </Badge>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 text-muted-foreground"
              onClick={() => setOpen(false)}
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        {/* ── Body: form (left) + map (right) ─────────────────────────── */}
        {draft && (
          <div className="flex min-h-0 flex-1 flex-col md:flex-row">

            {/* Form panel — right side in RTL */}
            <div className="order-2 flex w-full shrink-0 flex-col overflow-y-auto border-t border-border md:order-1 md:w-[min(100%,22rem)] md:border-s md:border-t-0 lg:w-96">
              <div className="flex flex-1 flex-col gap-5 p-5">

                {/* Geo search */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">البحث عن عنوان</Label>
                  <div className="relative">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Input
                          value={geoQuery}
                          onChange={(e) => setGeoQuery(e.target.value)}
                          autoComplete="off"
                          placeholder="اسم المكان أو الشارع أو الرمز البريدي…"
                          className={cn('h-10 pe-9', geoLoading && 'opacity-70')}
                          dir="rtl"
                        />
                        {geoLoading && (
                          <Loader2 className="pointer-events-none absolute end-3 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-muted-foreground" />
                        )}
                      </div>
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        className="h-10 w-10 shrink-0"
                        title="استخدام موقعي الحالي"
                        onClick={() => {
                          if (!navigator.geolocation) return;
                          navigator.geolocation.getCurrentPosition(
                            (pos) => {
                              setDraft((d) =>
                                d
                                  ? { ...d, latitude: parseFloat(pos.coords.latitude.toFixed(6)), longitude: parseFloat(pos.coords.longitude.toFixed(6)) }
                                  : d,
                              );
                              setGeoSuggestions([]);
                            },
                            undefined,
                            { timeout: 8000 },
                          );
                        }}
                      >
                        <LocateFixed className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Suggestions dropdown */}
                    {geoSuggestions.length > 0 && (
                      <ul className="absolute z-50 mt-1 w-full overflow-auto rounded-lg border border-border bg-popover py-1 text-sm shadow-lg max-h-52">
                        {geoSuggestions.map((s, i) => (
                          <li key={`${s.latitude}-${s.longitude}-${i}`}>
                            <button
                              type="button"
                              className="flex w-full items-start gap-2 px-3 py-2 text-right transition-colors hover:bg-accent"
                              onMouseDown={(e) => {
                                e.preventDefault();
                                pickSuggestion(s);
                              }}
                            >
                              <MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                              <span className="min-w-0 flex-1 text-xs leading-snug">{s.title}</span>
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {geoError && <p className="text-xs text-destructive">{geoError}</p>}
                </div>

                {/* Name */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">اسم النقطة</Label>
                  <Input
                    value={draft.nameAr}
                    onChange={(e) => setDraft({ ...draft, nameAr: e.target.value })}
                    placeholder="مثال: مقر الشركة الرئيسي"
                    className="h-10"
                  />
                </div>

                {/* Coordinates — synced from map; manual override available */}
                <div className="space-y-1.5">
                  <Label className="text-xs font-medium text-muted-foreground">الإحداثيات</Label>
                  <p className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 font-mono text-[11px] tabular-nums text-muted-foreground" dir="ltr">
                    {draft.latitude.toFixed(6)}, {draft.longitude.toFixed(6)}
                  </p>
                  <details className="group rounded-lg border border-border/50 bg-muted/10">
                    <summary className="cursor-pointer px-3 py-2 text-[11px] text-muted-foreground transition-colors hover:text-foreground">
                      تعديل يدوي للإحداثيات
                    </summary>
                    <div className="grid grid-cols-2 gap-2 border-t border-border/40 p-3 pt-2">
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">خط العرض</Label>
                        <Input
                          type="text"
                          inputMode="decimal"
                          dir="ltr"
                          className="h-9 font-mono text-xs"
                          value={draft.latitude.toFixed(6)}
                          onChange={(e) => {
                            const n = parseFloat(e.target.value);
                            if (Number.isFinite(n)) setDraft({ ...draft, latitude: parseFloat(n.toFixed(6)) });
                          }}
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-[10px] text-muted-foreground">خط الطول</Label>
                        <Input
                          type="text"
                          inputMode="decimal"
                          dir="ltr"
                          className="h-9 font-mono text-xs"
                          value={draft.longitude.toFixed(6)}
                          onChange={(e) => {
                            const n = parseFloat(e.target.value);
                            if (Number.isFinite(n)) setDraft({ ...draft, longitude: parseFloat(n.toFixed(6)) });
                          }}
                        />
                      </div>
                    </div>
                  </details>
                </div>

                {/* Radius */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <Label className="text-xs font-medium text-muted-foreground">نطاق القبول</Label>
                    <span className="text-xs font-semibold text-primary">{draft.radiusMeters} م</span>
                  </div>
                  <input
                    type="range"
                    min={10}
                    max={2000}
                    step={10}
                    value={draft.radiusMeters}
                    onChange={(e) => setDraft({ ...draft, radiusMeters: Number(e.target.value) })}
                    className="w-full cursor-pointer accent-primary"
                  />
                  <div className="flex justify-between text-[10px] text-muted-foreground">
                    <span>10 م</span>
                    <span>2000 م</span>
                  </div>
                </div>

                {/* Active toggle */}
                <div className="flex items-center justify-between rounded-xl border border-border bg-muted/20 px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">تفعيل النقطة</p>
                    <p className="text-xs text-muted-foreground">يمكن إيقاف النقطة مؤقتاً دون حذفها</p>
                  </div>
                  <Switch
                    checked={draft.isActive}
                    onCheckedChange={(v) => setDraft({ ...draft, isActive: v })}
                  />
                </div>

                {error && (
                  <div className="rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm text-destructive">
                    {error}
                  </div>
                )}
              </div>

              {/* Save / Cancel — sticky at bottom of left panel */}
              <div className="shrink-0 border-t border-border bg-card/80 p-4 backdrop-blur">
                <div className="flex gap-2">
                  <Button variant="luxe" className="flex-1 gap-2" onClick={save}>
                    <Save className="h-4 w-4" />
                    حفظ النقطة
                  </Button>
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    إلغاء
                  </Button>
                </div>
              </div>
            </div>

            {/* Map — left side in RTL; shown first on mobile */}
            <div
              ref={mapPanelRef}
              className="relative order-1 min-h-[42vh] shrink-0 overflow-hidden bg-muted/10 md:order-2 md:min-h-0 md:min-w-0 md:flex-1"
            >
              <MapPicker
                height={mapHeight}
                className="h-full min-h-[42vh] rounded-none border-0 shadow-none md:min-h-0"
                value={{
                  latitude: draft.latitude,
                  longitude: draft.longitude,
                  radiusMeters: draft.radiusMeters,
                }}
                onChange={(v) =>
                  setDraft({
                    ...draft,
                    latitude: parseFloat(v.latitude.toFixed(6)),
                    longitude: parseFloat(v.longitude.toFixed(6)),
                  })
                }
                interactive
              />
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
