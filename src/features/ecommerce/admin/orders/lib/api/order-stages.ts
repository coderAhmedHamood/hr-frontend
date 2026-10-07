import { apiRequest } from '@/shared/api/client';
import type { OrderStatus } from '@/features/ecommerce/domain/types/order';

/** Statuses an order is worked on in, each with a handler (order stages). */
export type OrderStage = Extract<OrderStatus, 'pending' | 'confirmed' | 'processing' | 'shipped'>;

export const ORDER_STAGES: readonly OrderStage[] = ['pending', 'confirmed', 'processing', 'shipped'];

export type OrderStageAutoAssign = 'none' | 'user' | 'balanced';

export type OrderStageSettingView = {
  stage: OrderStage;
  labelAr: string;
  permissionCode: string;
  autoAssign: OrderStageAutoAssign;
  userId: string | null;
  userNameAr: string | null;
  /** Whether the set user still holds the stage (null: no user set). */
  userEligible: boolean | null;
  /** Users holding the stage now; 0 leaves its orders stuck once stages are on. */
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
  stages: OrderStage[];
  canCancel: boolean;
  canRefund: boolean;
  canRollback: boolean;
  canAssign: boolean;
  /** May pick who handles the order (assign anyone / the next stage's handler). */
  canChooseHandler: boolean;
};

export type OrderStageHandler = {
  id: string;
  nameAr: string;
  email: string | null;
  /** Open orders assigned to them now. */
  openOrders: number;
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

  handlers: (companyId: string, stage: OrderStage) =>
    apiRequest<OrderStageHandler[]>(`${base(companyId)}/handlers`, {
      throwOnError: true,
      query: { stage },
    }),
};
