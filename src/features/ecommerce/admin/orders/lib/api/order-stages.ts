import { apiRequest } from '@/shared/api/client';
import type { OrderStatus } from '@/features/ecommerce/domain/types/order';

/** Statuses an order is worked on in, each with a handler (order stages). */
export type OrderStage = Extract<OrderStatus, 'pending' | 'confirmed' | 'processing' | 'shipped'>;

export const ORDER_STAGES: readonly OrderStage[] = ['pending', 'confirmed', 'processing', 'shipped'];

export type OrderStageAutoAssign = 'none' | 'user' | 'balanced';

/**
 * What a user who works on a stage sees of it: their orders only; plus the
 * stage's unassigned orders (which they take); or every order of the stage.
 */
export type OrderStageScope = 'assigned' | 'queue' | 'all';

export const ORDER_STAGE_SCOPE_LABELS: Record<OrderStageScope, string> = {
  queue: 'طلباته + غير المسندة',
  assigned: 'المسندة إليه فقط',
  all: 'كل طلبات المرحلة',
};

/** A user's grant on a stage: works on it, or only views it. */
export type OrderStageAccess = 'work' | 'view';

/** How a user who works on a stage receives its new orders. */
export type OrderStageReceive = 'none' | 'fixed' | 'auto';

export const ORDER_STAGE_RECEIVE_LABELS: Record<OrderStageReceive, string> = {
  none: 'بدون إسناد',
  fixed: 'مستخدم محدد',
  auto: 'توزيع تلقائي',
};

/** The order actions that are not a stage (user permissions). */
export type OrderStageAction = 'cancel' | 'refund' | 'rollback' | 'assign';

export const ORDER_STAGE_ACTION_LABELS: Record<OrderStageAction, string> = {
  cancel: 'إلغاء',
  refund: 'استرداد',
  rollback: 'إرجاع لمرحلة سابقة',
  assign: 'إسناد لأي مستخدم',
};

export type OrderStageMemberView = {
  userId: string;
  nameAr: string | null;
  scope: OrderStageScope;
  access: OrderStageAccess;
  receive: OrderStageReceive;
  /** False when their permissions no longer open the orders. */
  canOpenOrders: boolean;
  /** Open orders they hold in this stage now. */
  openOrders: number;
};

/** A company user who may be given a stage. */
export type OrderStageCandidate = {
  id: string;
  nameAr: string;
  email: string | null;
  /** Their permissions open the orders already (else given with the first stage). */
  canOpenOrders?: boolean;
};

export type OrderStageSettingView = {
  stage: OrderStage;
  labelAr: string;
  autoAssign: OrderStageAutoAssign;
  userId: string | null;
  userNameAr: string | null;
  userEligible: boolean | null;
  /** Who has the stage (work or view). */
  members: OrderStageMemberView[];
  /** Users who work on it and can open the orders; 0 leaves its orders stuck once stages are on. */
  handlersCount: number;
};

export type OrderStageUserView = {
  userId: string;
  nameAr: string | null;
  canOpenOrders: boolean;
  actions: Record<OrderStageAction, boolean>;
};

export type OrderStagesSettings = {
  enabled: boolean;
  assigneeOnly: boolean;
  /** The store setting payment rules depend on (read-only here). */
  cashOnDeliveryEnabled: boolean;
  stages: OrderStageSettingView[];
  users: OrderStageUserView[];
  /** Orders that went back to their stage queue with the last save. */
  released?: Array<{ stage: OrderStage; labelAr: string; userId: string; nameAr: string | null; orders: number }>;
};

export type SaveOrderStagesSettingsInput = {
  enabled?: boolean;
  assigneeOnly?: boolean;
  stages?: Array<{
    stage: OrderStage;
    /** Replaces the stage's grants (omitted: unchanged). */
    members?: Array<{
      userId: string;
      access: OrderStageAccess;
      scope?: OrderStageScope;
      receive: OrderStageReceive;
    }>;
  }>;
  /** Order actions per user (only the changed ones). */
  users?: Array<{ userId: string; actions: Partial<Record<OrderStageAction, boolean>> }>;
};

/** What the signed-in user may do on orders (for the order screens). */
export type OrderStagesContext = {
  enabled: boolean;
  assigneeOnly: boolean;
  userId: string;
  canReadAll: boolean;
  canUpdate: boolean;
  /** The stages they work on. */
  stages: OrderStage[];
  /** The stages they only view (every order, no change). */
  viewStages?: OrderStage[];
  /** Their scope in each stage they work on. */
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
