/**
 * One-shot: force store settings + all inventory products to YER.
 * Usage:
 *   $env:TOKEN='<staff jwt>'; $env:CID='13088934-0436-4529-b64d-97bafd05c9c3'; node scripts/force-store-currency-yer.mjs
 */
const BASE = process.env.BASE || 'http://localhost:3000';
const CID = process.env.CID || '13088934-0436-4529-b64d-97bafd05c9c3';
const TOKEN = process.env.TOKEN || '';

if (!TOKEN) {
  console.error('Missing TOKEN env (staff JWT)');
  process.exit(1);
}

async function api(method, path, body) {
  const res = await fetch(BASE + path, {
    method,
    headers: {
      Accept: 'application/json',
      Authorization: `Bearer ${TOKEN}`,
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let json = null;
  try {
    json = text ? JSON.parse(text) : null;
  } catch {
    json = { raw: text.slice(0, 300) };
  }
  if (!res.ok) {
    const msg = json?.message || json?.error?.message || res.statusText;
    throw new Error(`${method} ${path} → ${res.status}: ${msg}`);
  }
  return json?.data ?? json;
}

(async () => {
  console.log('1) PATCH store currency → YER');
  await api('PATCH', `/store-admin/companies/${CID}/settings`, { currencyCode: 'YER' });

  console.log('2) List products (admin)');
  const page = await api('GET', `/inventory/products?companyId=${CID}&page=1&limit=200&archiveScope=all`);
  const items = page?.items || [];
  console.log(`   found ${items.length} products (total=${page?.pagination?.total ?? '?'})`);

  let ok = 0;
  let fail = 0;
  for (const p of items) {
    const id = p.id;
    try {
      const body = {
        priceCurrency: 'YER',
      };
      if (p.priceAmount != null) body.priceAmount = p.priceAmount;
      if (p.costPriceAmount != null) {
        body.costPriceAmount = p.costPriceAmount;
        body.costPriceCurrency = 'YER';
      }
      if (p.compareAtPriceAmount != null) {
        body.compareAtPriceAmount = p.compareAtPriceAmount;
        body.compareAtPriceCurrency = 'YER';
      }
      await api('PATCH', `/inventory/products/${id}/full`, body);
      ok += 1;
      process.stdout.write('.');
    } catch (e) {
      fail += 1;
      console.log(`\nFAIL ${id} ${p.slug || ''}: ${e.message}`);
    }
  }

  console.log(`\n3) Done. updated=${ok} failed=${fail}`);

  const check = await fetch(
    `${BASE}/public/inventory/products?companyId=${CID}&page=1&limit=50`,
  ).then((r) => r.json());
  const currencies = {};
  for (const item of check?.data?.items || []) {
    currencies[item.priceCurrency] = (currencies[item.priceCurrency] || 0) + 1;
  }
  console.log('public currencies sample:', currencies);

  const yer = (check?.data?.items || []).find((x) => x.priceCurrency === 'YER');
  if (yer) {
    const res = await fetch(`${BASE}/public/store/orders`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Idempotency-Key': `yer-fix-${Date.now()}`,
      },
      body: JSON.stringify({
        companyId: CID,
        paymentMethod: 'cash_on_delivery',
        locale: 'ar',
        address: {
          fullName: 'Currency Fix Probe',
          phone: '777111222',
          city: 'صنعاء',
          district: 'test',
          street: 'test',
        },
        items: [{ productId: yer.id, quantity: 1 }],
      }),
    });
    const j = await res.json();
    console.log(
      'place-order smoke:',
      res.status,
      j.message || j.error?.message,
      j.data?.orderNumber || '',
    );
  } else {
    console.log('place-order smoke: skipped (no YER product)');
  }
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
