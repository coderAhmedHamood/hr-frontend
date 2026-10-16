import { apiRequest } from '@/shared/api/client';
import type { OrderStatus } from '@/features/ecommerce/domain/types/order';

/** Statuses an order is worked on in, each with a handler (order stages). */
export type OrderStage = Extract<OrderStatus, 'pending' | 'confirmed' | 'processing' | 'shipped'>;

export const ORDER_STAGES: readonly OrderStage[] = ['pending', 'confirmed', 'processing', 'shipped'];

export type OrderStageAutoAssign = 'none' | 'user' | 'balanced';

/**
 * What a stage member sees of the stage: their orders only; plus the
 * stage's unassigned orders (which they take); or every order of the stage.
 */
export type OrderStageScope = 'assigned' | 'queue' | 'all';

export const ORDER_STAGE_SCOPE_LABELS: Record<OrderStageScope, string> = {
  assigned: 'المسندة إليه فقط',
  queue: 'المسندة إليه + غير المسندة',
  all: 'كل طلبات المرحلة',
};

export type OrderStageMemberView = {
  userId: string;
  nameAr: string | null;
  scope: OrderStageScope;
  /** False when their roles no longer open the orders (sta.order-stages.work). */
  canOpenOrders: boolean;
};

/** A user who may be made a stage member. */
export type OrderStageCandidate = { id: string; nameAr: string; email: string | null };

export type OrderStageSettingView = {
  stage: OrderStage;
  labelAr: string;
  autoAssign: OrderStageAutoAssign;
  userId: string | null;
  userNameAr: string | null;
  /** Whether the set user still handles the stage (null: no user set). */
  userEligible: boolean | null;
  /** Who handles the stage, with their scope. */
  members: OrderStageMemberView[];
  /** Members who can open the orders; 0 leaves its orders stuck once stages are on. */
  handlersCount: number;
};

export type OrderStagesSettings = {
  enabled: boolean;
  assigneeOnly: boolean;
  requirePaymentBeforeShipping: boolean;
  stages: OrderStageSettingView[];
};

export type SaveOrderStagesSettingsInput = {
  enabled?: boolean;
  assigneeOnly?: boolean;
  requirePaymentBeforeShipping?: boolean;
  stages?: Array<{
    stage: OrderStage;
    autoAssign: OrderStageAutoAssign;
    userId?: string | null;
    /** Replaces the stage's members (omitted: unchanged). */
    members?: Array<{ userId: string; scope: OrderStageScope }>;
  }>;
};

/** What the signed-in user may do on orders (for the order screens). */
export type OrderStagesContext = {
  enabled: boolean;
  assigneeOnly: boolean;
  requirePaymentBeforeShipping: boolean;
  userId: string;
  canReadAll: boolean;
  canUpdate: boolean;
  /** The stages they are a member of. */
  stages: OrderStage[];
  /** Their scope in each of those stages. */
  stageScopes?: Partial<Record<OrderStage, OrderStageScope>>;
  /** May work on any stage (holds the assign permission). */
  isSupervisor?: boolean;
  canCancel: boolean;
  canRefund: boolean;
  canRollback: boolean;
  canAssign: boolean;
  /** May pick the next stage's handler when moving an order (whoever may move it). */
  canChooseHandler: boolean;
};

export type OrderStageHandler = {
  id: string;
  nameAr: string;
  email: string | null;
  /** Open orders assigned to them now. */
  openOrders: number;
  /** Their scope in the stage (null: not a member). */
  scope?: OrderStageScope | null;
};

const base = (companyId: string) => `/store-admin/companies/${companyId}/order-stages`;

export const orderStagesApi = {
  settings: (companyId: string) =>
    apiRequest<OrderStagesSettings>(`${base(companyId)}/settings`, {
      throwOnError: true,
    }),

  saveSettings: (companyId: string, input: SaveOrderStagesSettingsInput) =>
    apiRequest<OrderStagesSettings>(`${base(companyId)}/settings`, {
      method: 'PUT',
      throwOnError: true,
      body: input,
    }),

  context: (companyId: string) =>
    apiRequest<OrderStagesContext>(`${base(companyId)}/context`, {
      throwOnError: true,
      silent: true,
    }),

  candidates: (companyId: string) =>
    apiRequest<OrderStageCandidate[]>(`${base(companyId)}/candidates`, {
      throwOnError: true,
    }),

  handlers: (companyId: string, stage: OrderStage) =>
    apiRequest<OrderStageHandler[]>(`${base(companyId)}/handlers`, {
      throwOnError: true,
      query: { stage },
    }),
};
