import type { OrderStagesContext } from '@/features/ecommerce/admin/orders/lib/api/order-stages';
import {
  canAssignAnyone,
  canTakeOrder,
  isViewOnlyOrder,
  moveBlockReason,
  orderMoveNeedsInput,
  stageScopeOf,
  visibleOrderStatuses,
  workBlockReason,
} from '@/features/ecommerce/admin/orders/lib/order-stage-access';

const ME = 'user-me';
const OTHER = 'user-other';

function ctx(over: Partial<OrderStagesContext> = {}): OrderStagesContext {
  return {
    enabled: true,
    assigneeOnly: false,
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
    expect(workBlockReason(c, { status: 'confirmed', assignedUserId: null })).toMatch(/ليست لديك صلاحية على مرحلة/);
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

  it('a view-only stage shows its orders but blocks moves, taking and editing', () => {
    const c = ctx({ stages: ['pending'], stageScopes: { pending: 'queue' }, viewStages: ['processing'] });
    const order = { status: 'processing' as const, assignedUserId: null };
    expect(isViewOnlyOrder(c, order)).toBe(true);
    expect(workBlockReason(c, order)).toMatch(/عرض فقط/);
    expect(moveBlockReason(c, order, 'shipped')).toMatch(/عرض فقط/);
    expect(canTakeOrder(c, order)).toBe(false);
    expect(isViewOnlyOrder(c, { status: 'pending', assignedUserId: null })).toBe(false);
    // Who edits every order is never view-only.
    expect(isViewOnlyOrder({ ...c, canUpdate: true }, order)).toBe(false);
  });

  it('a stage user sees the columns of the stages granted only; who reads all sees all', () => {
    const all = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as const;
    const c = ctx({ stages: ['confirmed', 'pending'], viewStages: ['shipped'] });
    expect(visibleOrderStatuses(c, all)).toEqual(['pending', 'confirmed', 'shipped']);
    expect(visibleOrderStatuses({ ...c, canReadAll: true }, all)).toEqual([...all]);
    expect(visibleOrderStatuses({ ...c, enabled: false }, all)).toEqual([...all]);
    expect(visibleOrderStatuses(null, all)).toBeNull();
  });
});

describe('orderMoveNeedsInput (one tap unless input is needed)', () => {
  const cod = { paymentMethod: 'cash_on_delivery' as const, paymentStatus: 'pending' as const };
  it('forward and back moves go in one tap', () => {
    expect(orderMoveNeedsInput({ status: 'pending', ...cod }, 'confirmed')).toBe(false);
    expect(orderMoveNeedsInput({ status: 'processing', ...cod }, 'confirmed')).toBe(false);
    expect(orderMoveNeedsInput({ status: 'processing', ...cod }, 'shipped')).toBe(false);
  });
  it('cancel and refund always ask', () => {
    expect(orderMoveNeedsInput({ status: 'pending', ...cod }, 'cancelled')).toBe(true);
    expect(orderMoveNeedsInput({ status: 'delivered', ...cod, paymentStatus: 'paid' }, 'refunded')).toBe(true);
  });
  it('delivering cash on delivery asks only while not collected', () => {
    expect(orderMoveNeedsInput({ status: 'shipped', ...cod }, 'delivered')).toBe(true);
    expect(orderMoveNeedsInput({ status: 'shipped', ...cod, paymentStatus: 'paid' }, 'delivered')).toBe(false);
    expect(
      orderMoveNeedsInput({ status: 'shipped', paymentMethod: 'bank', paymentStatus: 'paid' }, 'delivered'),
    ).toBe(false);
  });
});
