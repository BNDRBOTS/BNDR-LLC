import test from 'node:test';
import assert from 'node:assert/strict';
import { once } from 'node:events';
import { catalog, createPricingService, createServer, paymentPolicy, stripeReader } from '../website-server.mjs';

export function stripeFixture() {
  const links = [], items = new Map(), sessions = new Map();
  for (const pkg of catalog.packages) for (const tier of [1, 2, 3, 0]) {
    const id = `plink_${pkg.id}${tier}`;
    const amount = tier === 0 ? pkg.deposit : pkg.sale[tier - 1];
    links.push({ id, url: `https://buy.stripe.com/${pkg.id}${tier}`, livemode: true, active: true,
      metadata: { bndr_website_revision: catalog.revision, bndr_package: pkg.id, bndr_slot: String(tier) },
      restrictions: tier ? { completed_sessions: { limit: 1 } } : null,
      custom_text: { submit: { message: paymentPolicy(pkg, tier) } }
    });
    items.set(id, [{ quantity: 1, price: { unit_amount: amount * 100, currency: 'usd', recurring: null, product: pkg.stripeProduct } }]);
    sessions.set(id, []);
  }
  for (const pkg of catalog.packages) for (const old of pkg.legacySaleLinks) {
    const id = `plink_legacy${pkg.id}${old.tier}`;
    links.push({ id, url: old.url, active: false, livemode: true, metadata: {} });
    sessions.set(id, []);
    items.set(id, [{ quantity: 1, price: { unit_amount: old.amount * 100, currency: 'usd', product: pkg.stripeProduct } }]);
  }
  const read = async (path, params) => {
    if (path === 'payment_links') return { data: structuredClone(links), has_more: false };
    if (path.endsWith('/line_items')) return { data: structuredClone(items.get(path.split('/')[1])), has_more: false };
    if (path === 'checkout/sessions') return { data: structuredClone(sessions.get(params.payment_link)), has_more: false };
    throw new Error(`Unexpected fixture request: ${path}`);
  };
  const complete = (id, paymentStatus = 'paid') => {
    const link = links.find(link => link.id === id);
    link.active = false;
    sessions.get(id).push({ id: `cs_${id}`, amount_total: items.get(id)[0].price.unit_amount, currency: 'usd', mode: 'payment', payment_status: paymentStatus });
  };
  return { links, items, sessions, read, complete };
}

test('normal prices, sale percentages and half deposits stay congruent', () => {
  assert.deepEqual(catalog.packages.map(pkg => pkg.regular), [1500, 3000, 4500]);
  for (const pkg of catalog.packages) {
    assert.equal(pkg.deposit * 2, pkg.regular);
    assert.deepEqual(pkg.sale, catalog.discountPercentages.map(discount => pkg.regular * (100 - discount) / 100));
  }
});

test('a purchase advances only its own package, then reaches normal pricing', async () => {
  const f = stripeFixture(), service = createPricingService(f.read);
  assert.deepEqual((await service.get()).packages.map(pkg => pkg.tier), [1, 1, 1]);
  f.complete('plink_lander1');
  let result = await service.get({ fresh: true });
  assert.deepEqual(result.packages.map(pkg => pkg.tier), [2, 1, 1]);
  assert.equal(result.packages[0].amount, 600);
  f.complete('plink_lander2');
  assert.equal((await service.get({ fresh: true })).packages[0].amount, 900);
  f.complete('plink_lander3');
  result = await service.get({ fresh: true });
  assert.deepEqual(result.packages.map(pkg => pkg.tier), [0, 1, 1]);
  assert.equal(result.packages[0].amount, 750);
  assert.equal(result.packages[0].regular, 1500);
  assert.equal(result.packages[0].remaining, 750);
  assert.deepEqual(result.packages[0].consumed, [1, 2, 3]);
});

test('pending payment holds its place without advancing or affecting other packages', async () => {
  const f = stripeFixture(); f.complete('plink_standard1', 'unpaid');
  const result = await createPricingService(f.read).get();
  assert.equal(result.packages[1].tier, 1);
  assert.equal(result.packages[1].status, 'processing');
  assert.deepEqual(result.packages[1].consumed, []);
  assert.equal(result.packages[0].status, 'available');
});

test('a place purchased at the old price remains consumed after repricing', async () => {
  const f = stripeFixture();
  f.complete('plink_legacylander1');
  f.links.find(link => link.id === 'plink_lander1').active = false;
  const result = await createPricingService(f.read).get();
  assert.equal(result.packages[0].tier, 2);
  assert.deepEqual(result.packages[0].consumed, [1]);
  assert.equal(result.packages[1].tier, 1);
});

for (const [name, mutate] of [
  ['missing one-use restriction', f => { f.links[0].restrictions = null; }],
  ['two-use restriction', f => { f.links[0].restrictions.completed_sessions.limit = 2; }],
  ['wrong Stripe amount', f => { f.items.get('plink_lander1')[0].price.unit_amount = 75000; }],
  ['wrong product', f => { f.items.get('plink_lander1')[0].price.product = 'prod_wrong'; }],
  ['recurring sale price', f => { f.items.get('plink_lander1')[0].price.recurring = { interval: 'month' }; }],
  ['wrong payment wording', f => { f.links[0].custom_text.submit.message = 'Pay 50%'; }],
  ['unused inactive link', f => { f.links[0].active = false; }],
  ['multiple completed uses', f => { f.complete('plink_lander1'); f.complete('plink_lander1'); }],
  ['duplicate slot records', f => { f.links.push(structuredClone(f.links[0])); }],
  ['additional coupon discounts', f => { f.links[0].allow_promotion_codes = true; }],
  ['test-mode link in live catalogue', f => { f.links[0].livemode = false; }],
  ['old checkout link still active', f => { f.links.find(link => link.id === 'plink_legacylander1').active = true; }],
  ['old purchased place offered again', f => { f.complete('plink_legacylander1'); }]
]) test(`checkout blocks ${name}`, async () => {
  const f = stripeFixture(); mutate(f);
  await assert.rejects(createPricingService(f.read).get(), { name: 'PricingUnavailable' });
});

test('missing Stripe credential fails before any network request', async () => {
  let requested = false;
  const read = stripeReader('', async () => { requested = true; });
  await assert.rejects(read('payment_links'), { name: 'PricingUnavailable' });
  assert.equal(requested, false);
});

test('production server serves actual files, protects internal files and rechecks a stale checkout', async t => {
  const f = stripeFixture();
  const server = createServer({ service: createPricingService(f.read) });
  server.listen(0, '127.0.0.1'); await once(server, 'listening');
  t.after(() => new Promise(resolve => server.close(resolve)));
  const base = `http://127.0.0.1:${server.address().port}`;
  assert.equal((await fetch(`${base}/healthz`)).status, 200);
  for (const path of ['/', '/website.css', '/website.js', '/index.md', '/llms-full.txt']) {
    const response = await fetch(base + path);
    assert.equal(response.status, 200, path);
    assert.ok((await response.text()).length > 100, path);
  }
  for (const path of ['/.env', '/.git/config', '/.verification/original-index.html', '/website-pricing.json']) assert.equal((await fetch(base + path)).status, 404);
  const before = await (await fetch(`${base}/api/website/pricing`)).json();
  assert.equal(before.packages[0].tier, 1);
  assert.ok(!JSON.stringify(before).includes('buy.stripe.com'));
  f.complete('plink_lander1');
  const post = body => fetch(`${base}/api/website/checkout`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const stale = await post({ package: 'lander', tier: 1, amount: 450 });
  assert.equal(stale.status, 409);
  assert.equal((await stale.json()).pricing.packages[0].tier, 2);
  assert.equal((await post({ package: 'lander', tier: 2, amount: 1 })).status, 409);
  const accepted = await post({ package: 'lander', tier: 2, amount: 600 });
  assert.equal(accepted.status, 200);
  assert.equal((await accepted.json()).url, 'https://buy.stripe.com/lander2');
});
