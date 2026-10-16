import type { OrderStagesContext } from '@/features/ecommerce/admin/orders/lib/api/order-stages';
import {
  canAssignAnyone,
  canTakeOrder,
  moveBlockReason,
  stageScopeOf,
  workBlockReason,
} from '@/features/ecommerce/admin/orders/lib/order-stage-access';

const ME = 'user-me';
const OTHER = 'user-other';

function ctx(over: Partial<OrderStagesContext> = {}): OrderStagesContext {
  return {
    enabled: true,
    assigneeOnly: false,
    requirePaymentBeforeShipping: false,
    userId: ME,
    canReadAll: false,
    canUpdate: false,
    stages: [],
    stageScopes: {},
    isSupervisor: false,
    canCancel: false,
    canRefund: false,
    canRollback: false,
    canAssign: false,
    canChooseHandler: false,
    ...over,
  };
}

describe('order-stage-access (the screens mirror the backend rules)', () => {
  it('a non-member is told to ask the supervisor', () => {
    const c = ctx({ stages: ['pending'], stageScopes: { pending: 'all' } });
    expect(workBlockReason(c, { status: 'confirmed', assignedUserId: null })).toMatch(/لست من أعضاء/);
    expect(workBlockReason(c, { status: 'pending', assignedUserId: null })).toBeNull();
  });

  it('scope "assigned" works only on orders assigned to the user', () => {
    const c = ctx({ stages: ['shipped'], stageScopes: { shipped: 'assigned' } });
    expect(workBlockReason(c, { status: 'shipped', assignedUserId: ME })).toBeNull();
    expect(workBlockReason(c, { status: 'shipped', assignedUserId: null })).toMatch(/المسندة إليك فقط/);
    expect(workBlockReason(c, { status: 'shipped', assignedUserId: OTHER })).toMatch(/المسندة إليك فقط/);
    expect(canTakeOrder(c, { status: 'shipped', assignedUserId: null })).toBe(false);
  });

  it('scopes "queue" and "all" may take an unassigned order, never an assigned one', () => {
    for (const scope of ['queue', 'all'] as const) {
      const c = ctx({ stages: ['confirmed'], stageScopes: { confirmed: scope } });
      expect(canTakeOrder(c, { status: 'confirmed', assignedUserId: null })).toBe(true);
      expect(canTakeOrder(c, { status: 'confirmed', assignedUserId: OTHER })).toBe(false);
      expect(canTakeOrder(c, { status: 'processing', assignedUserId: null })).toBe(false);
    }
  });

  it('only the supervisor reassigns once stages are on; choosing the next handler does not grant it', () => {
    expect(canAssignAnyone(ctx({ canChooseHandler: true }))).toBe(false);
    expect(canAssignAnyone(ctx({ canAssign: true, isSupervisor: true }))).toBe(true);
    // Stages off: who may edit orders assigns, as before.
    expect(canAssignAnyone(ctx({ enabled: false, canUpdate: true }))).toBe(true);
  });

  it('the supervisor works on any stage and order', () => {
    const c = ctx({ isSupervisor: true, canAssign: true });
    expect(workBlockReason(c, { status: 'processing', assignedUserId: OTHER })).toBeNull();
    expect(canTakeOrder(c, { status: 'processing', assignedUserId: null })).toBe(true);
  });

  it('assignee-only blocks another member’s order', () => {
    const c = ctx({ assigneeOnly: true, stages: ['confirmed'], stageScopes: { confirmed: 'all' } });
    expect(workBlockReason(c, { status: 'confirmed', assignedUserId: OTHER })).toMatch(/مسند إلى مستخدم آخر/);
  });

  it('cancel, refund and rollback stay role permissions', () => {
    const c = ctx({ stages: ['confirmed'], stageScopes: { confirmed: 'all' } });
    const order = { status: 'confirmed' as const, assignedUserId: null };
    expect(moveBlockReason(c, order, 'cancelled')).toMatch(/إلغاء/);
    expect(moveBlockReason(c, order, 'pending')).toMatch(/إرجاع/);
    expect(moveBlockReason(c, order, 'processing')).toBeNull();
    expect(moveBlockReason({ ...c, canCancel: true }, order, 'cancelled')).toBeNull();
  });

  it('stages off: edit permission decides', () => {
    const order = { status: 'confirmed' as const, assignedUserId: null };
    expect(workBlockReason(ctx({ enabled: false }), order)).toMatch(/تعديل الطلبات/);
    expect(workBlockReason(ctx({ enabled: false, canUpdate: true }), order)).toBeNull();
  });

  it('an older context without scopes falls back to the queue scope for member stages', () => {
    const c = ctx({ stages: ['pending'], stageScopes: undefined });
    expect(stageScopeOf(c, 'pending')).toBe('queue');
    expect(stageScopeOf(c, 'shipped')).toBeNull();
  });
});
