import { translateStoreStockMessage } from '@/shared/api/store-stock-messages';

describe('translateStoreStockMessage', () => {
  it('translates the switching refusals (enable / resume with open local orders, no warehouse)', () => {
    const enable = translateStoreStockMessage(
      "2 open order(s) took the store's own quantity: ship or cancel them before enabling the store–inventory link (they would never be issued from inventory)",
    );
    expect(enable).toContain('لا يمكن تفعيل ربط المتجر بالمخازن: 2');
    const resume = translateStoreStockMessage(
      "1 open order(s) took the store's own quantity: ship or cancel them before resuming the store–inventory link (they would never be issued from inventory)",
    );
    expect(resume).toContain('لا يمكن استئناف البيع من المخازن: 1');
    expect(
      translateStoreStockMessage(
        "Choose the store's warehouse in the store–inventory link settings before enabling it",
      ),
    ).toContain('اختر مستودع المتجر');
  });

  it('leaves other messages alone', () => {
    expect(translateStoreStockMessage('Nothing to return from this endpoint')).toBeNull();
    expect(translateStoreStockMessage('')).toBeNull();
  });
});
