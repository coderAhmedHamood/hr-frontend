'use client';

import { MapPin, Navigation2, Pencil, Plus, Radio, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { MapPicker } from '@/components/ui/map-picker';
import { cn } from '@/shared/utils';
import { useCheckpointsPanelModel } from '@/features/hr/attendance/checkpoints/hooks/useCheckpointsPanelModel';
import { DirectoryPagedViews } from '@/components/ui/paged-list';
import { usePageHeaderActions } from '@/components/layouts/page-header-actions-context';
import { EmptyStateCard } from '@/components/shared/empty-state-card';
import { CheckpointsEditDialog } from '@/features/hr/attendance/checkpoints/components/checkpoints-edit-dialog';

export function CheckpointsPanel() {
  const model = useCheckpointsPanelModel();
  const { checkpoints, pagination, loading, removeCheckpoint, selected, setSelected, openCreate, openEdit, selectedPoint } = model;

  usePageHeaderActions(
    () => (
      <Button variant="luxe" size="sm" className="h-8 gap-1.5 px-3 text-xs shrink-0" type="button" onClick={openCreate}>
        <Plus className="h-3.5 w-3.5" />
        نقطة جديدة
      </Button>
    ),
    [openCreate],
  );

  return (
    <div className="flex min-h-0 flex-1 flex-col gap-4">

      <div className="space-y-3 shrink-0">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          النقاط (<span className="number-ar">{pagination.total}</span>)
        </p>

        {!loading && checkpoints.length === 0 && pagination.total === 0 ? (
          <EmptyStateCard icon={MapPin} title="لا توجد نقاط بعد" size="compact" />
        ) : (
          <DirectoryPagedViews items={checkpoints} serverPagination={pagination} loading={loading}>
            {(pageItems) => (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {pageItems.map((p) => (
            <div
              key={p.id}
              role="button"
              tabIndex={0}
              onClick={() => setSelected((cur) => (cur === p.id ? null : p.id))}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  setSelected((cur) => (cur === p.id ? null : p.id));
                }
              }}
              className={cn(
                'group relative cursor-pointer overflow-hidden rounded-xl border bg-card shadow-soft outline-none transition-all hover:-translate-y-0.5 hover:shadow-elevated focus-visible:ring-2 focus-visible:ring-ring',
                selected === p.id ? 'border-primary/50 bg-primary/5 ring-1 ring-primary/20' : 'border-border',
              )}
            >
              <div className="absolute -end-8 -top-8 h-24 w-24 rounded-full bg-primary opacity-0 blur-2xl transition-opacity group-hover:opacity-10" />

              <div className="relative p-5">
                <div className="mb-4 flex items-start justify-between">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-xl',
                      p.isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground/60',
                    )}
                  >
                    <MapPin className="h-5 w-5" />
                  </div>
                  <span
                    className={cn(
                      'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-[10px] font-medium',
                      p.isActive
                        ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-400'
                        : 'border-border bg-muted text-muted-foreground',
                    )}
                  >
                    <span className={cn('h-1.5 w-1.5 rounded-full', p.isActive ? 'bg-emerald-500' : 'bg-muted-foreground')} />
                    {p.isActive ? 'نشط' : 'موقوف'}
                  </span>
                </div>

                <h3 className="mb-3 truncate font-display text-base font-bold leading-snug transition-colors group-hover:text-primary">
                  {p.nameAr}
                </h3>

                <div className="mb-4 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Navigation2 className="h-3 w-3 shrink-0" />
                    <span className="truncate font-mono" dir="ltr">
                      {p.latitude.toFixed(4)}, {p.longitude.toFixed(4)}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                    <Radio className="h-3 w-3 shrink-0" />
                    <span>
                      نطاق القبول: <span className="font-mono font-medium text-foreground">{p.radiusMeters}</span> م
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1 border-t border-border/60 pt-2" onClick={(e) => e.stopPropagation()}>
                  <Button variant="ghost" size="sm" type="button" className="h-7 gap-1 px-2 text-xs" onClick={() => openEdit(p)}>
                    <Pencil className="h-3 w-3" /> تعديل
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    type="button"
                    className="h-7 gap-1 px-2 text-xs text-destructive hover:text-destructive"
                    onClick={() => {
                      if (window.confirm('حذف النقطة؟')) removeCheckpoint(p.id);
                    }}
                  >
                    <Trash2 className="h-3 w-3" /> حذف
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
            )}
          </DirectoryPagedViews>
        )}

        {checkpoints.length > 0 && !selectedPoint ? (
          <EmptyStateCard
            size="compact"
            title="انقر على بطاقة لعرض تفاصيل النقطة والموقع على الخريطة."
          />
        ) : null}

        {selectedPoint ? (
          <div className="space-y-4 rounded-xl p-4 shadow-soft">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-lg font-semibold">{selectedPoint.nameAr}</h3>
                  <Badge variant={selectedPoint.isActive ? 'success' : 'secondary'} className="shrink-0">
                    {selectedPoint.isActive ? 'نشط' : 'موقوف'}
                  </Badge>
                </div>
              </div>
              <div className="flex shrink-0 gap-2">
                <Button variant="outline" size="sm" type="button" className="gap-1.5" onClick={() => openEdit(selectedPoint)}>
                  <Pencil className="h-3.5 w-3.5" />
                  تعديل
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  className="gap-1.5 text-destructive hover:text-destructive"
                  onClick={() => {
                    if (window.confirm('حذف النقطة؟')) {
                      removeCheckpoint(selectedPoint.id);
                      setSelected(null);
                    }
                  }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  حذف
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-y border-border py-3 text-sm">
              <span className="inline-flex items-center gap-1.5 text-muted-foreground">
                <Radio className="h-3.5 w-3.5 shrink-0" />
                نطاق القبول:{' '}
                <span className="number-ar font-mono font-medium text-foreground">{selectedPoint.radiusMeters}</span> م
              </span>
              <span className="inline-flex items-center gap-1.5 font-mono text-muted-foreground" dir="ltr">
                <Navigation2 className="h-3.5 w-3.5 shrink-0" />
                {selectedPoint.latitude.toFixed(5)}, {selectedPoint.longitude.toFixed(5)}
              </span>
            </div>

            <div>
              <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">الموقع</p>
              <MapPicker
                height={320}
                value={{
                  latitude: selectedPoint.latitude,
                  longitude: selectedPoint.longitude,
                  radiusMeters: selectedPoint.radiusMeters,
                }}
                onChange={() => {}}
                interactive={false}
              />
            </div>
          </div>
        ) : null}
      </div>

      <CheckpointsEditDialog model={model} checkpoints={checkpoints} />
    </div>
  );
}
