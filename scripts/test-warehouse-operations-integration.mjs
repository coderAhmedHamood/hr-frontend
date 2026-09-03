/**
 * Smoke test: warehouse operations create/list (no `reference` in POST body).
 * Covers product-page flows: replenishment, receipt, issue, internal + list by product.
 *
 * Usage: node scripts/test-warehouse-operations-integration.mjs [email] [password]
 */
const BASE = process.env.BACKEND_URL ?? 'http://localhost:3000';
const EMAIL = process.argv[2] ?? process.env.SYSTEM_ADMIN_EMAIL ?? 'admin@test.com';
const PASSWORD = process.argv[3] ?? process.env.SYSTEM_ADMIN_PASSWORD ?? 'Admin123!';

/** @typedef {{ name: string; ok: boolean; status?: number; detail?: string }} Result */

/** @type {Result[]} */
const results = [];
const createdOperationIds = [];

function pass(name, extra = {}) {
  results.push({ name, ok: true, ...extra });
  console.log(`✅ ${name}`);
}

function fail(name, detail, extra = {}) {
  results.push({ name, ok: false, detail, ...extra });
  console.log(`❌ ${name} — ${detail}`);
}

async function request(path, { method = 'GET', token, body, query } = {}) {
  const url = new URL(path, BASE);
  if (query) {
    for (const [k, v] of Object.entries(query)) {
      if (v !== undefined && v !== null) url.searchParams.set(k, String(v));
    }
  }
  const headers = { Accept: 'application/json' };
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers['Content-Type'] = 'application/json';

  const res = await fetch(url, {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  let payload = null;
  const text = await res.text();
  try {
    payload = text ? JSON.parse(text) : null;
  } catch {
    payload = text;
  }

  const data = payload?.data ?? payload;
  return { status: res.status, ok: res.ok, payload, data };
}

function unwrapItems(data) {
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data)) return data;
  return [];
}

async function createOperation(token, ctx, kind, lineExtra = {}) {
  const body = {
    companyId: ctx.companyId,
    warehouseId: ctx.warehouseId,
    kind,
    status: 'draft',
    occurredAt: new Date().toISOString(),
    sourceDocument:
      kind === 'replenishment' || kind === 'receipt'
        ? 'تجديد المخزون يدويًا'
        : kind === 'issue'
          ? 'صرف مخزون يدوي'
          : 'حركة داخلية يدوية',
    notes: `integration-test ${kind}`,
  };

  const opRes = await request('/inventory/warehouse-operations', {
    method: 'POST',
    token,
    body,
  });

  if (!opRes.ok) {
    return { ok: false, status: opRes.status, detail: JSON.stringify(opRes.payload)?.slice(0, 300) };
  }

  const op = opRes.data;
  if (!op?.id) {
    return { ok: false, detail: 'missing operation id' };
  }
  if (!op.reference || typeof op.reference !== 'string') {
    return { ok: false, detail: 'server did not assign reference' };
  }

  const lineBody = {
    operationId: op.id,
    productId: ctx.productId,
    productName: ctx.productName,
    sku: ctx.productSku ?? null,
    demandQuantity: 1,
    quantity: 1,
    variantId: null,
    fromLocationId: kind === 'issue' || kind === 'internal' ? ctx.locationId : null,
    toLocationId: kind === 'receipt' || kind === 'replenishment' || kind === 'internal' ? ctx.locationId : null,
    notes: null,
    ...lineExtra,
  };

  const lineRes = await request('/inventory/warehouse-operation-lines', {
    method: 'POST',
    token,
    body: lineBody,
  });

  if (!lineRes.ok) {
    return {
      ok: false,
      status: lineRes.status,
      detail: `line POST failed: ${JSON.stringify(lineRes.payload)?.slice(0, 200)}`,
    };
  }

  createdOperationIds.push(op.id);
  return { ok: true, op };
}

async function main() {
  console.log(`\n📦 Warehouse operations integration test → ${BASE}\n`);

  const login = await request('/auth/login', {
    method: 'POST',
    body: {
      email: EMAIL,
      password: PASSWORD,
      loginChannel: 'web',
      mobileSerialNumber: 'warehouse-ops-test-script',
    },
  });

  if (!login.ok) {
    fail('auth.login', `HTTP ${login.status}`);
    printSummary();
    process.exit(1);
  }

  const token = login.data?.access_token ?? login.payload?.access_token ?? '';
  if (!token) {
    fail('auth.login', 'no access_token');
    printSummary();
    process.exit(1);
  }
  pass('auth.login');

  const me = await request('/auth/me', { token });
  let companyId =
    me.data?.companyId ??
    me.data?.companies?.[0]?.id ??
    process.env.NEXT_PUBLIC_STOREFRONT_COMPANY_ID;

  if (!companyId) {
    const companiesRes = await request('/companies', { token, query: { limit: 20 } });
    const companies = unwrapItems(companiesRes.data);
    for (const company of companies) {
      const whRes = await request('/inventory/warehouses', {
        token,
        query: { companyId: company.id, limit: 1, archiveScope: 'active' },
      });
      if (unwrapItems(whRes.data).length > 0) {
        companyId = company.id;
        break;
      }
    }
    if (!companyId && companies[0]?.id) companyId = companies[0].id;
  }

  // Prefer storefront tenant when seeded (matches product admin pages).
  if (process.env.NEXT_PUBLIC_STOREFRONT_COMPANY_ID) {
    const whCheck = await request('/inventory/warehouses', {
      token,
      query: {
        companyId: process.env.NEXT_PUBLIC_STOREFRONT_COMPANY_ID,
        limit: 1,
        archiveScope: 'active',
      },
    });
    if (unwrapItems(whCheck.data).length > 0) {
      companyId = process.env.NEXT_PUBLIC_STOREFRONT_COMPANY_ID;
    }
  }

  if (!companyId) {
    fail('resolve.companyId', 'could not resolve company');
    printSummary();
    process.exit(1);
  }
  pass('resolve.companyId', { detail: companyId });

  const warehousesRes = await request('/inventory/warehouses', {
    token,
    query: { companyId, limit: 5, archiveScope: 'active' },
  });
  const warehouse = unwrapItems(warehousesRes.data)[0];
  if (!warehouse?.id) {
    fail('resolve.warehouse', 'no warehouse found');
    printSummary();
    process.exit(1);
  }
  pass('resolve.warehouse', { detail: warehouse.nameAr ?? warehouse.id });

  const locationsRes = await request('/inventory/warehouse-locations', {
    token,
    query: { companyId, warehouseId: warehouse.id, limit: 20, archiveScope: 'active' },
  });
  const location =
    unwrapItems(locationsRes.data).find((item) => item.isActive !== false) ??
    unwrapItems(locationsRes.data)[0];
  if (!location?.id) {
    fail('resolve.location', 'no location in warehouse');
    printSummary();
    process.exit(1);
  }
  pass('resolve.location', { detail: location.nameAr ?? location.id });

  const productsRes = await request('/inventory/products', {
    token,
    query: { companyId, limit: 5, archiveScope: 'active' },
  });
  const product = unwrapItems(productsRes.data)[0];
  if (!product?.id) {
    fail('resolve.product', 'no catalog product');
    printSummary();
    process.exit(1);
  }
  pass('resolve.product', { detail: product.nameAr ?? product.id });

  const ctx = {
    companyId,
    warehouseId: warehouse.id,
    locationId: location.id,
    productId: product.id,
    productName: product.nameAr ?? 'منتج اختبار',
    productSku: product.sku ?? null,
  };

  // Negative: sending reference must fail (confirms backend contract).
  const bad = await request('/inventory/warehouse-operations', {
    method: 'POST',
    token,
    body: {
      companyId,
      warehouseId: warehouse.id,
      kind: 'replenishment',
      reference: 'SHOULD-FAIL',
      status: 'draft',
    },
  });
  if (bad.status === 400 && String(bad.payload?.message ?? '').includes('reference')) {
    pass('contract.reject-reference-in-body');
  } else {
    fail('contract.reject-reference-in-body', `expected 400, got ${bad.status}`);
  }

  const kinds = ['replenishment', 'receipt', 'issue', 'internal'];
  for (const kind of kinds) {
    const result = await createOperation(token, ctx, kind);
    if (!result.ok) {
      fail(`create.${kind}`, result.detail ?? 'unknown', { status: result.status });
      continue;
    }
    pass(`create.${kind}`, { detail: result.op.reference });
  }

  const listRes = await request('/inventory/warehouse-operations', {
    token,
    query: { companyId, limit: 100, archiveScope: 'active' },
  });
  if (!listRes.ok) {
    fail('list.operations', `HTTP ${listRes.status}`);
  } else {
    const listed = unwrapItems(listRes.data);
    const withProduct = listed.filter((op) => createdOperationIds.includes(op.id));
    if (withProduct.length >= kinds.length) {
      pass('list.operations', { detail: `${withProduct.length} created ops visible` });
    } else {
      fail(
        'list.operations',
        `only ${withProduct.length}/${createdOperationIds.length} created ops in list`,
      );
    }
  }

  // Product-scoped filter (frontend product dialogs use productId on lines).
  let productScopedCount = 0;
  for (const opId of createdOperationIds) {
    const linesRes = await request('/inventory/warehouse-operation-lines', {
      token,
      query: { companyId, operationId: opId, limit: 50 },
    });
    const lines = unwrapItems(linesRes.data);
    if (lines.some((line) => line.productId === ctx.productId)) productScopedCount += 1;
  }
  if (productScopedCount === createdOperationIds.length) {
    pass('lines.product-link', { detail: `${productScopedCount} ops linked to product` });
  } else {
    fail('lines.product-link', `${productScopedCount}/${createdOperationIds.length} linked`);
  }

  printSummary();
  process.exit(results.some((r) => !r.ok) ? 1 : 0);
}

function printSummary() {
  const ok = results.filter((r) => r.ok).length;
  const bad = results.filter((r) => !r.ok).length;
  console.log(`\n── Summary: ${ok} passed, ${bad} failed ──\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
