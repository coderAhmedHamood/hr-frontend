'use client';

import * as React from 'react';
import type { AttendanceCheckInPoint } from '@/features/hr/attendance/lib/types';
import { autosuggestQuery } from '@/components/here-map/components/geocoding';
import type { GeocodingResult } from '@/components/here-map/types/types';
import { CHECKPOINT_GEO_DEBOUNCE_MS, CHECKPOINT_GEO_MIN_QUERY_LEN } from '@/features/hr/attendance/checkpoints/constants/checkpoints-panel';
import { validateCheckpointDraft } from '@/features/hr/attendance/checkpoints/utils/checkpoint-validate';
import { publicConfig } from '@/shared/config';
import { handleApiError } from '@/features/hr/lib/api/global-error-handler';
import { resolveDirectoryLoadFailure } from '@/features/hr/lib/api/directory-load-error';
import { useServerDirectoryPagination } from '@/components/ui/paged-list';
import { checkInPointsApi } from '@/features/hr/attendance/lib/api/check-in-points';
import { useDefaultCompanyId } from '@/features/hr/organization/lib/default-company-id';
import {
  ORGANIZATION_ARCHIVE_SCOPE_DEFAULT,
  organizationListStatusQuery,
  type OrganizationArchiveScope,
} from '@/features/hr/organization/lib/archive-scope';
import {
  createCheckInPoint,
  deleteCheckInPoint,
  mapCheckInPointResponse,
  updateCheckInPoint,
} from '@/features/hr/attendance/checkpoints/services/check-in-points.service';

const r6 = (n: number) => parseFloat(n.toFixed(6));

export function useCheckpointsPanelModel() {
  const companyId = useDefaultCompanyId();
  const [archiveScope, setArchiveScope] = React.useState<OrganizationArchiveScope>(
    ORGANIZATION_ARCHIVE_SCOPE_DEFAULT,
  );
  const [listError, setListError] = React.useState<string | null>(null);
  const [apiAccessDenied, setApiAccessDenied] = React.useState(false);
  const [open, setOpen] = React.useState(false);
  const [draft, setDraft] = React.useState<AttendanceCheckInPoint | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [geoQuery, setGeoQuery] = React.useState('');
  const justPickedRef = React.useRef(false);
  const [geoLoading, setGeoLoading] = React.useState(false);
  const [geoError, setGeoError] = React.useState<string | null>(null);
  const [geoSuggestions, setGeoSuggestions] = React.useState<GeocodingResult[]>([]);
  const draftRef = React.useRef(draft);
  React.useEffect(() => { draftRef.current = draft; }, [draft]);

  const loadPage = React.useCallback(async (page: number, pageSize: number) => {
    if (!companyId) return { items: [] as AttendanceCheckInPoint[], total: 0 };
    setListError(null);
    try {
      const res = await checkInPointsApi.getAll({
        companyId,
        page,
        limit: pageSize,
        ...organizationListStatusQuery(archiveScope),
      });
      const items = res.items.map(mapCheckInPointResponse);
      setApiAccessDenied(false);
      return { items, total: res.pagination.total };
    } catch (err) {
      const failure = resolveDirectoryLoadFailure(err, 'check-in-points.load');
      setApiAccessDenied(failure.accessDenied);
      setListError(failure.listError);
      return { items: [], total: 0 };
    }
  }, [companyId, archiveScope]);

  const {
    items: checkpoints,
    loading,
    pagination,
    reload,
  } = useServerDirectoryPagination<AttendanceCheckInPoint>(loadPage, {
    enabled: !!companyId,
    resetDeps: [companyId, archiveScope],
  });

  const openCreate = React.useCallback(() => {
    setDraft({
      id: '',
      nameAr: '',
      nameEn: '',
      latitude: 24.713600,
      longitude: 46.675300,
      radiusMeters: 100,
      isActive: true,
    });
    setError(null);
    setGeoQuery('');
    setGeoError(null);
    setGeoSuggestions([]);
    setOpen(true);
  }, []);

  const openEdit = React.useCallback((c: AttendanceCheckInPoint) => {
    setDraft({ ...c, latitude: r6(c.latitude), longitude: r6(c.longitude) });
    setError(null);
    setGeoQuery('');
    setGeoError(null);
    setGeoSuggestions([]);
    setOpen(true);
  }, []);

  const pickSuggestion = React.useCallback((row: GeocodingResult) => {
    justPickedRef.current = true;
    setDraft((d) => {
      if (!d) return d;
      if (!Number.isFinite(row.latitude) || !Number.isFinite(row.longitude)) return d;
      return { ...d, latitude: r6(row.latitude), longitude: r6(row.longitude) };
    });
    setGeoQuery(row.title);
    setGeoSuggestions([]);
    setGeoError(null);
  }, []);

  React.useEffect(() => {
    if (!open) {
      setGeoSuggestions([]);
      setGeoLoading(false);
      setGeoError(null);
      return;
    }
    if (justPickedRef.current) {
      justPickedRef.current = false;
      return;
    }
    const q = geoQuery.trim();
    if (q.length < CHECKPOINT_GEO_MIN_QUERY_LEN) {
      setGeoSuggestions([]);
      setGeoError(null);
      setGeoLoading(false);
      return;
    }

    const ac = new AbortController();
    setGeoLoading(true);
    setGeoError(null);

    const timer = window.setTimeout(async () => {
      try {
        if (!publicConfig.hereApiKey) {
          setGeoError('مفتاح HERE API غير مُعرّف.');
          setGeoLoading(false);
          return;
        }
        const center = draftRef.current ? { lat: draftRef.current.latitude, lng: draftRef.current.longitude } : { lat: 24.7136, lng: 46.6753 };
        const rows = await autosuggestQuery(q, publicConfig.hereApiKey, center, 8);
        if (ac.signal.aborted) return;
        setGeoSuggestions(rows);
        if (rows.length === 0) setGeoError('لم يُعثر على نتائج.');
        else setGeoError(null);
      } catch (e) {
        if (ac.signal.aborted || (e as Error).name === 'AbortError') return;
        setGeoSuggestions([]);
        setGeoError('تعذر البحث. تحقق من الاتصال بالإنترنت.');
      } finally {
        if (!ac.signal.aborted) setGeoLoading(false);
      }
    }, CHECKPOINT_GEO_DEBOUNCE_MS);

    return () => {
      window.clearTimeout(timer);
      ac.abort();
    };
  }, [geoQuery, open]);

  const save = React.useCallback(async () => {
    if (!draft) return;
    const err = validateCheckpointDraft(draft);
    if (err) {
      setError(err);
      return;
    }
    if (!companyId) {
      setError('تعذر تحديد الشركة');
      return;
    }
    setError(null);
    const nameAr = draft.nameAr.trim();
    try {
      if (draft.id) {
        await updateCheckInPoint(draft.id, {
          nameAr,
          nameEn: nameAr,
          latitude: draft.latitude,
          longitude: draft.longitude,
          radiusMeters: draft.radiusMeters,
          isActive: draft.isActive,
        });
      } else {
        await createCheckInPoint({
          companyId,
          nameAr,
          nameEn: nameAr,
          latitude: draft.latitude,
          longitude: draft.longitude,
          radiusMeters: draft.radiusMeters,
          isActive: draft.isActive,
        });
      }
      await reload();
      setOpen(false);
      setDraft(null);
    } catch (apiErr) {
      const { displayMessage } = handleApiError(apiErr, 'check-in-points.save');
      setError(displayMessage);
    }
  }, [companyId, draft, reload]);

  const removeCheckpoint = React.useCallback(
    async (id: string) => {
      try {
        await deleteCheckInPoint(id);
        await reload();
      } catch (apiErr) {
        const { displayMessage } = handleApiError(apiErr, 'check-in-points.delete');
        setError(displayMessage);
      }
    },
    [reload],
  );

  const selectedPoint = selected ? checkpoints.find((p) => p.id === selected) ?? null : null;

  React.useEffect(() => {
    if (selected && !checkpoints.some((p) => p.id === selected)) setSelected(null);
  }, [checkpoints, selected]);

  return {
    checkpoints,
    loading,
    pagination,
    listError,
    accessDenied: apiAccessDenied,
    removeCheckpoint,
    open,
    setOpen,
    draft,
    setDraft,
    error,
    setError,
    selected,
    setSelected,
    geoQuery,
    setGeoQuery,
    geoLoading,
    geoError,
    geoSuggestions,
    pickSuggestion,
    openCreate,
    openEdit,
    save,
    selectedPoint,
    setGeoSuggestions,
    archiveScope,
    setArchiveScope,
  };
}

export type CheckpointsPanelModel = ReturnType<typeof useCheckpointsPanelModel>;
