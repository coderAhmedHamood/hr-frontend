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
  const status = (dto.status as string) === 'posted' ? 'done' : dto.status;
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

async function fetchLinesForOperations(
  companyId: string,
  operationIds: string[],
): Promise<Map<string, WarehouseOperationLine[]>> {
  const map = new Map<string, WarehouseOperationLine[]>();
  if (operationIds.length === 0) return map;

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

async function fetchLinesByOperationId(operationId: string): Promise<WarehouseOperationLine[]> {
  const result = await apiRequest<PaginatedResult<OperationLineDto>>(
    '/inventory/warehouse-operation-lines',
    {
      query: {
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
  nextLines: WarehouseOperationLine[],
): Promise<WarehouseOperationLine[]> {
  const existing = await fetchLinesByOperationId(operationId);
  const existingById = new Map(existing.map((line) => [line.id, line]));
  const keepIds = new Set(nextLines.map((line) => line.id).filter((id) => existingById.has(id)));

  for (const line of existing) {
    if (!keepIds.has(line.id)) {
      await apiRequest<void>(`/inventory/warehouse-operation-lines/${line.id}`, { method: 'DELETE' });
    }
  }

  const synced: WarehouseOperationLine[] = [];
  for (const line of nextLines) {
    if (existingById.has(line.id)) {
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

export const warehouseOperationsApi: AdminWarehouseOperationsPort = {
  async getAll(query: WarehouseOperationListQuery) {
    const result = await apiRequest<PaginatedResult<OperationDto>>('/inventory/warehouse-operations', {
      query: {
        companyId: query.companyId,
        warehouseId: query.warehouseId,
        kind: query.kind,
        status: query.status,
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

  async getById(_companyId, id) {
    try {
      const dto = await apiRequest<OperationDto>(`/inventory/warehouse-operations/${id}`);
      if (!dto?.id) return null;
      const lines = await fetchLinesByOperationId(id);
      return mapOperation(dto, lines);
    } catch {
      return null;
    }
  },

  async create(input: CreateWarehouseOperationInput) {
    assertLinesLinkedToProduct(input.lines);
    const dto = await apiRequest<OperationDto>('/inventory/warehouse-operations', {
      method: 'POST',
      body: {
        companyId: input.companyId,
        warehouseId: input.warehouseId,
        destinationWarehouseId: input.destinationWarehouseId ?? null,
        kind: input.kind,
        reference: input.reference || null,
        status: input.status,
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

    const operation = mapOperation(dto, lines);
    if (operation.status === 'done') {
      await (await stockService()).applyDoneOperation(operation);
    }
    return operation;
  },

  async update(companyId, id, patch: UpdateWarehouseOperationInput) {
    if (patch.lines) {
      assertLinesLinkedToProduct(patch.lines);
    }

    const before = await this.getById(companyId, id);
    if (!before) return null;

    const headerPatch: Record<string, unknown> = {};
    if (patch.destinationWarehouseId !== undefined) {
      headerPatch.destinationWarehouseId = patch.destinationWarehouseId ?? null;
    }
    if (patch.kind !== undefined) headerPatch.kind = patch.kind;
    if (patch.reference !== undefined) headerPatch.reference = patch.reference;
    if (patch.status !== undefined) headerPatch.status = patch.status;
    if (patch.occurredAt !== undefined) headerPatch.occurredAt = patch.occurredAt;
    if (patch.notes !== undefined) headerPatch.notes = patch.notes ?? null;
    if (patch.partnerName !== undefined) headerPatch.partnerName = patch.partnerName ?? null;
    if (patch.sourceDocument !== undefined) {
      headerPatch.sourceDocument = patch.sourceDocument ?? null;
    }

    let dto: OperationDto = before as unknown as OperationDto;
    if (Object.keys(headerPatch).length > 0) {
      dto = await apiRequest<OperationDto>(`/inventory/warehouse-operations/${id}`, {
        method: 'PATCH',
        body: headerPatch,
      });
    }

    const lines = patch.lines ? await syncLines(id, patch.lines) : before.lines;
    const normalized = mapOperation(dto, lines);

    const wasDone = before.status === 'done';
    const nowDone = normalized.status === 'done';
    const stock = await stockService();

    if (!wasDone && nowDone) {
      await stock.applyDoneOperation(normalized);
    }
    if (wasDone && !nowDone) {
      await stock.reverseDoneOperation(before);
    }

    return normalized;
  },

  async remove(_companyId, id) {
    await apiRequest<void>(`/inventory/warehouse-operations/${id}`, { method: 'DELETE' });
    return true;
  },
};
