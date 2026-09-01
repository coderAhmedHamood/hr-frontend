import { apiRequest, type PaginatedResult } from '@/features/hr/lib/api/client';
import { toNumber } from '@/features/inventory/lib/api/numbers';
import type {
  CreateWarehouseOperationInput,
  UpdateWarehouseOperationInput,
  WarehouseOperation,
  WarehouseOperationLine,
  WarehouseOperationListQuery,
} from '@/features/inventory/domain/types/warehouse';
import type { AdminWarehouseOperationsPort } from '@/features/inventory/domain/ports/inventory.ports';

type OperationDto = Omit<WarehouseOperation, 'lines'> & {
  codeNumber?: number;
  isArchived?: boolean;
  archivedAt?: string | null;
  createdBy?: string | null;
  updatedBy?: string | null;
};

type OperationLineDto = Omit<WarehouseOperationLine, 'demandQuantity' | 'quantity'> & {
  operationId: string;
  companyId: string;
  demandQuantity: string | number;
  quantity: string | number;
  sortOrder?: number;
  isArchived?: boolean;
  archivedAt?: string | null;
};

async function stockService() {
  const mod = await import('@/features/inventory/services/inventory-stock.service');
  return mod.inventoryStockService;
}

function assertLinesLinkedToProduct(
  lines: CreateWarehouseOperationInput['lines'] | WarehouseOperation['lines'],
): void {
  const missing = lines.filter((line) => !line.productId?.trim());
  if (missing.length > 0) {
    throw new Error('كل بند في مستند المخزون يجب أن يرتبط بمنتج (productId).');
  }
}

function mapLine(dto: OperationLineDto): WarehouseOperationLine {
  return {
    id: dto.id,
    productName: dto.productName,
    sku: dto.sku ?? undefined,
    productId: dto.productId,
    variantId: dto.variantId ?? undefined,
    demandQuantity: toNumber(dto.demandQuantity),
    quantity: toNumber(dto.quantity),
    fromLocationId: dto.fromLocationId ?? undefined,
    toLocationId: dto.toLocationId ?? undefined,
    notes: dto.notes ?? undefined,
  };
}

function mapOperation(dto: OperationDto, lines: WarehouseOperationLine[]): WarehouseOperation {
  const raw = String(dto.status ?? '').trim().toLowerCase();
  const status =
    raw === 'posted' || raw === 'done' || raw === 'validated'
      ? 'done'
      : (dto.status as WarehouseOperation['status']);
  return {
    id: dto.id,
    companyId: dto.companyId,
    warehouseId: dto.warehouseId,
    kind: dto.kind,
    reference: dto.reference,
    status,
    occurredAt: dto.occurredAt,
    notes: dto.notes ?? undefined,
    partnerName: dto.partnerName ?? undefined,
    sourceDocument: dto.sourceDocument ?? undefined,
    destinationWarehouseId: dto.destinationWarehouseId ?? undefined,
    lines,
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
  };
}

function isLockedOperationStatus(status: string | null | undefined): boolean {
  const raw = String(status ?? '').trim().toLowerCase();
  return raw === 'done' || raw === 'posted' || raw === 'validated';
}

async function fetchLinesForOperations(
  companyId: string,
  operationIds: string[],
): Promise<Map<string, WarehouseOperationLine[]>> {
  const map = new Map<string, WarehouseOperationLine[]>();
  if (operationIds.length === 0) return map;

  // Few operations: fetch by operationId (avoids dumping the whole company line table).
  if (operationIds.length <= 8) {
    await Promise.all(
      operationIds.map(async (operationId) => {
        map.set(operationId, await fetchLinesByOperationId(operationId, companyId));
      }),
    );
    return map;
  }

  const result = await apiRequest<PaginatedResult<OperationLineDto>>(
    '/inventory/warehouse-operation-lines',
    {
      query: {
        companyId,
        page: 1,
        limit: 500,
        archiveScope: 'active',
      },
    },
  );

  const idSet = new Set(operationIds);
  for (const dto of result.items ?? []) {
    if (!idSet.has(dto.operationId)) continue;
    const list = map.get(dto.operationId) ?? [];
    list.push(mapLine(dto));
    map.set(dto.operationId, list);
  }
  return map;
}

async function fetchLinesByOperationId(
  operationId: string,
  companyId: string,
): Promise<WarehouseOperationLine[]> {
  const result = await apiRequest<PaginatedResult<OperationLineDto>>(
    '/inventory/warehouse-operation-lines',
    {
      query: {
        companyId,
        operationId,
        page: 1,
        limit: 500,
        archiveScope: 'active',
      },
    },
  );
  return (result.items ?? []).map(mapLine);
}

async function createLine(operationId: string, line: WarehouseOperationLine): Promise<WarehouseOperationLine> {
  const dto = await apiRequest<OperationLineDto>('/inventory/warehouse-operation-lines', {
    method: 'POST',
    body: {
      operationId,
      productId: line.productId,
      variantId: line.variantId ?? null,
      productName: line.productName,
      sku: line.sku ?? null,
      demandQuantity: line.demandQuantity ?? line.quantity,
      quantity: line.quantity,
      fromLocationId: line.fromLocationId ?? null,
      toLocationId: line.toLocationId ?? null,
      notes: line.notes ?? null,
    },
  });
  return mapLine(dto);
}

async function syncLines(
  operationId: string,
  companyId: string,
  nextLines: WarehouseOperationLine[],
): Promise<WarehouseOperationLine[]> {
  const existing = await fetchLinesByOperationId(operationId, companyId);
  const existingById = new Map(existing.map((line) => [line.id, line]));
  const keepIds = new Set(nextLines.map((line) => line.id).filter((id) => existingById.has(id)));

  for (const line of existing) {
    if (!keepIds.has(line.id)) {
      await apiRequest<void>(`/inventory/warehouse-operation-lines/${line.id}`, { method: 'DELETE' });
    }
  }

  const synced: WarehouseOperationLine[] = [];
  for (const line of nextLines) {
    const prev = existingById.get(line.id);
    if (prev) {
      if (isLineUnchanged(prev, line)) {
        synced.push(prev);
        continue;
      }
      const dto = await apiRequest<OperationLineDto>(
        `/inventory/warehouse-operation-lines/${line.id}`,
        {
          method: 'PATCH',
          body: {
            productId: line.productId,
            variantId: line.variantId ?? null,
            productName: line.productName,
            sku: line.sku ?? null,
            demandQuantity: line.demandQuantity ?? line.quantity,
            quantity: line.quantity,
            fromLocationId: line.fromLocationId ?? null,
            toLocationId: line.toLocationId ?? null,
            notes: line.notes ?? null,
          },
        },
      );
      synced.push(mapLine(dto));
    } else {
      synced.push(await createLine(operationId, line));
    }
  }
  return synced;
}

function isLineUnchanged(prev: WarehouseOperationLine, next: WarehouseOperationLine): boolean {
  return (
    prev.productId === next.productId &&
    (prev.variantId ?? null) === (next.variantId ?? null) &&
    prev.productName === next.productName &&
    (prev.sku ?? null) === (next.sku ?? null) &&
    Number(prev.demandQuantity ?? prev.quantity) === Number(next.demandQuantity ?? next.quantity) &&
    Number(prev.quantity) === Number(next.quantity) &&
    (prev.fromLocationId ?? null) === (next.fromLocationId ?? null) &&
    (prev.toLocationId ?? null) === (next.toLocationId ?? null) &&
    (prev.notes ?? null) === (next.notes ?? null)
  );
}

export const warehouseOperationsApi: AdminWarehouseOperationsPort = {
  async getAll(query: WarehouseOperationListQuery) {
    if (!query.companyId?.trim()) {
      throw new Error('companyId مطلوب لقائمة عمليات المستودع.');
    }
    const result = await apiRequest<PaginatedResult<OperationDto>>('/inventory/warehouse-operations', {
      query: {
        companyId: query.companyId,
        warehouseId: query.warehouseId,
        kind: query.kind,
        status: query.status,
        occurredAtFrom: query.occurredAtFrom,
        occurredAtTo: query.occurredAtTo,
        search: query.search,
        page: query.page ?? 1,
        limit: query.limit ?? 200,
        archiveScope: 'active',
      },
    });

    let items = result.items ?? [];
    if (query.productId) {
      const lineMap = await fetchLinesForOperations(
        query.companyId,
        items.map((item) => item.id),
      );
      items = items.filter((item) =>
        (lineMap.get(item.id) ?? []).some((line) => line.productId === query.productId),
      );
      return {
        items: items.map((item) => mapOperation(item, lineMap.get(item.id) ?? [])),
        pagination: {
          ...result.pagination,
          total: items.length,
          totalPages: 1,
        },
      };
    }

    const lineMap = await fetchLinesForOperations(
      query.companyId,
      items.map((item) => item.id),
    );
    return {
      items: items.map((item) => mapOperation(item, lineMap.get(item.id) ?? [])),
      pagination: result.pagination,
    };
  },

  async getById(companyId, id) {
    try {
      const dto = await apiRequest<OperationDto>(`/inventory/warehouse-operations/${id}`);
      if (!dto?.id) return null;
      const lines = await fetchLinesByOperationId(id, companyId || dto.companyId);
      return mapOperation(dto, lines);
    } catch {
      return null;
    }
  },

  async create(input: CreateWarehouseOperationInput) {
    assertLinesLinkedToProduct(input.lines);
    // Backend blocks line POST when status is done/cancelled — create as draft first,
    // then promote after lines exist (same pattern as the validate UI).
    const requestedStatus = input.status;
    const createStatus = requestedStatus === 'done' || requestedStatus === 'cancelled'
      ? 'draft'
      : requestedStatus;

    const dto = await apiRequest<OperationDto>('/inventory/warehouse-operations', {
      method: 'POST',
      body: {
        companyId: input.companyId,
        warehouseId: input.warehouseId,
        destinationWarehouseId: input.destinationWarehouseId ?? null,
        kind: input.kind,
        status: createStatus,
        occurredAt: input.occurredAt,
        notes: input.notes ?? null,
        partnerName: input.partnerName ?? null,
        sourceDocument: input.sourceDocument ?? null,
      },
    });

    const lines: WarehouseOperationLine[] = [];
    for (const line of input.lines) {
      lines.push(
        await createLine(dto.id, {
          ...line,
          demandQuantity: line.demandQuantity ?? line.quantity,
        }),
      );
    }

    if (requestedStatus === 'done' || requestedStatus === 'cancelled') {
      const updated = await this.update(input.companyId, dto.id, {
        status: requestedStatus,
      });
      if (!updated) {
        throw new Error('تعذر تصديق مستند المخزون بعد إنشاء البنود.');
      }
      return updated;
    }

    return mapOperation(dto, lines);
  },

  async update(companyId, id, patch: UpdateWarehouseOperationInput) {
    if (patch.lines) {
      assertLinesLinkedToProduct(patch.lines);
    }

    // Read raw DTO first so a locked server status cannot be missed by mapping quirks.
    let rawDto: OperationDto;
    try {
      rawDto = await apiRequest<OperationDto>(`/inventory/warehouse-operations/${id}`);
    } catch {
      throw new Error('تعذر قراءة حالة العملية من الخادم.');
    }
    if (!rawDto?.id) {
      throw new Error('العملية غير موجودة.');
    }

    const locked = isLockedOperationStatus(rawDto.status);
    if (locked) {
      // Preferred undo path: done → ready (backend reverses ledger + quantityCache).
      if (patch.status === 'ready' && !patch.lines) {
        return warehouseOperationsApi.undo(companyId, id);
      }
      if (patch.status === 'cancelled') {
        throw new Error(
          'لا يمكن إلغاء عملية منتهية (done → cancelled). استخدم التراجع عن التصديق أولاً.',
        );
      }
      throw new Error(
        'لا يمكن تعديل عملية منتهية (done). للتراجع استخدم «تراجع عن التصديق» (POST …/undo).',
      );
    }

    const linesBefore = await fetchLinesByOperationId(id, companyId || rawDto.companyId);
    const before = mapOperation(rawDto, linesBefore);

    const headerPatch: Record<string, unknown> = {};
    if (patch.destinationWarehouseId !== undefined) {
      headerPatch.destinationWarehouseId = patch.destinationWarehouseId ?? null;
    }
    if (patch.kind !== undefined) headerPatch.kind = patch.kind;
    if (patch.status !== undefined) headerPatch.status = patch.status;
    if (patch.occurredAt !== undefined) headerPatch.occurredAt = patch.occurredAt;
    if (patch.notes !== undefined) headerPatch.notes = patch.notes ?? null;
    if (patch.partnerName !== undefined) headerPatch.partnerName = patch.partnerName ?? null;
    if (patch.sourceDocument !== undefined) {
      headerPatch.sourceDocument = patch.sourceDocument ?? null;
    }

    // Sync lines BEFORE locking the operation (`done` / `cancelled`). Backend rejects
    // line PATCH once status is done — that was causing false "done" + 400 on validate.
    const linesEditable = before.status === 'draft' || before.status === 'ready';
    let lines = before.lines;
    if (patch.lines) {
      if (!linesEditable) {
        throw new Error(
          `لا يمكن تعديل بنود عملية بحالة "${before.status}". احفظ البنود قبل التصديق.`,
        );
      }
      lines = await syncLines(id, companyId || rawDto.companyId, patch.lines);
    }

    let dto: OperationDto = rawDto;
    if (Object.keys(headerPatch).length > 0) {
      dto = await apiRequest<OperationDto>(`/inventory/warehouse-operations/${id}`, {
        method: 'PATCH',
        body: headerPatch,
      });
    }

    const normalized = mapOperation(dto, lines);

    // Validate → done: apply stock client-side (ledger + cache). Undo uses backend POST …/undo.
    if (normalized.status === 'done') {
      const stock = await stockService();
      await stock.applyDoneOperation(normalized);
    }

    return normalized;
  },

  async undo(companyId, id) {
    const dto = await apiRequest<OperationDto>(`/inventory/warehouse-operations/${id}/undo`, {
      method: 'POST',
    });
    const lines = await fetchLinesByOperationId(id, companyId || dto.companyId);
    // Backend writes reverse ledger rows and refreshes quantityCache; do not reverse again client-side.
    return mapOperation(dto, lines);
  },

  async remove(_companyId, id) {
    await apiRequest<void>(`/inventory/warehouse-operations/${id}`, { method: 'DELETE' });
    return true;
  },
};
