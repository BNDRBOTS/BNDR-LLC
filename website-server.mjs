import http from 'node:http';
import { readFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const root = new URL('./', import.meta.url);
export const catalog = JSON.parse(await readFile(new URL('website-pricing.json', root), 'utf8'));

export class PricingUnavailable extends Error {
  constructor(message = 'Current availability could not be confirmed. Please try again shortly.') {
    super(message);
    this.name = 'PricingUnavailable';
  }
}

export function stripeReader(key, fetcher = fetch) {
  return async (path, parameters = {}) => {
    if (!key) throw new PricingUnavailable();
    const url = new URL(`https://api.stripe.com/v1/${path}`);
    for (const [name, value] of Object.entries(parameters)) url.searchParams.set(name, String(value));
    const response = await fetcher(url, {
      headers: { Authorization: `Bearer ${key}`, 'Stripe-Version': '2026-07-29.dahlia' },
      signal: AbortSignal.timeout(10000)
    });
    if (!response.ok) throw new PricingUnavailable();
    return response.json();
  };
}

async function listAll(read, path, parameters = {}) {
  const records = [];
  let cursor;
  for (let page = 0; page < 100; page++) {
    const result = await read(path, { ...parameters, limit: 100, ...(cursor ? { starting_after: cursor } : {}) });
    if (!Array.isArray(result.data)) throw new PricingUnavailable();
    records.push(...result.data);
    if (!result.has_more) return records;
    const next = result.data.at(-1)?.id;
    if (!next || next === cursor) throw new PricingUnavailable();
    cursor = next;
  }
  throw new PricingUnavailable();
}

export function paymentPolicy(pkg, tier) {
  return tier === 0
    ? `${pkg.name}: $${pkg.regular.toLocaleString('en-US')} total. $${pkg.deposit.toLocaleString('en-US')} (50%) due now; $${pkg.deposit.toLocaleString('en-US')} before launch or handoff. Managed Hosting + Care is separate at $75/month.`
    : `${pkg.name}: introductory place ${tier}, $${pkg.sale[tier - 1].toLocaleString('en-US')} paid in full. One purchase for this place. Managed Hosting + Care is separate at $75/month.`;
}

export function createPricingService(read, clock = Date.now) {
  let cache;
  let fetchedAt = 0;
  let pending;

  async function inspectLink(link, pkg, tier, allLinks) {
    const amount = tier === 0 ? pkg.deposit : pkg.sale[tier - 1];
    if (!link || !/^plink_/.test(link.id) || !/^https:\/\/buy\.stripe\.com\/[A-Za-z0-9]+$/.test(link.url || '')) throw new PricingUnavailable();
    if (link.livemode !== true || link.allow_promotion_codes || link.optional_items?.length || link.automatic_tax?.enabled) throw new PricingUnavailable();
    if (link.custom_text?.submit?.message !== paymentPolicy(pkg, tier)) throw new PricingUnavailable();
    if (tier > 0 && link.restrictions?.completed_sessions?.limit !== 1) throw new PricingUnavailable();
    if (tier === 0 && link.restrictions?.completed_sessions?.limit != null) throw new PricingUnavailable();
    const items = await listAll(read, `payment_links/${link.id}/line_items`);
    const item = items[0];
    const price = item?.price;
    const product = typeof price?.product === 'string' ? price.product : price?.product?.id;
    if (items.length !== 1 || item.quantity !== 1 || item.adjustable_quantity?.enabled || price?.unit_amount !== amount * 100 || price.currency !== catalog.currency || price.recurring || product !== pkg.stripeProduct) throw new PricingUnavailable();
    if (tier === 0) return { tier, amount, active: link.active, url: link.url, state: 'regular' };
    const legacy = pkg.legacySaleLinks.find(slot => slot.tier === tier);
    const oldLinks = allLinks.filter(item => item.url === legacy.url);
    if (oldLinks.length !== 1 || oldLinks[0].active) throw new PricingUnavailable();
    const priorSessions = await listAll(read, 'checkout/sessions', { payment_link: oldLinks[0].id, status: 'complete' });
    if (priorSessions.some(session => session.amount_total !== legacy.amount * 100 || session.currency !== catalog.currency || session.mode !== 'payment')) throw new PricingUnavailable();
    const sessions = await listAll(read, 'checkout/sessions', { payment_link: link.id, status: 'complete' });
    if (priorSessions.length && (link.active || sessions.length)) throw new PricingUnavailable();
    if (priorSessions.length) return { tier, amount, active: false, url: link.url, state: priorSessions.some(session => session.payment_status === 'paid') ? 'paid' : 'processing' };
    if (sessions.length > 1) throw new PricingUnavailable();
    const completed = sessions[0];
    if (completed && (completed.amount_total !== amount * 100 || completed.currency !== catalog.currency || completed.mode !== 'payment')) throw new PricingUnavailable();
    const state = !completed ? 'available' : completed.payment_status === 'paid' ? 'paid' : 'processing';
    return { tier, amount, active: link.active, url: link.url, state };
  }

  async function inspect() {
    const all = await listAll(read, 'payment_links');
    const links = all.filter(link => link.metadata?.bndr_website_revision === catalog.revision);
    const packages = await Promise.all(catalog.packages.map(async pkg => {
      const packageLinks = links.filter(link => link.metadata?.bndr_package === pkg.id);
      const states = [];
      for (const tier of [1, 2, 3, 0]) {
        const matches = packageLinks.filter(link => link.metadata?.bndr_slot === String(tier));
        if (matches.length !== 1) throw new PricingUnavailable();
        states.push(await inspectLink(matches[0], pkg, tier, all));
      }
      // Purchased slots are never recreated or inferred from an inactive URL.
      const current = states.find(state => state.state !== 'paid');
      if (!current || (current.state !== 'processing' && !current.active)) throw new PricingUnavailable();
      return {
        id: pkg.id, name: pkg.name, regular: pkg.regular, deposit: pkg.deposit,
        tier: current.tier, amount: current.amount, status: current.state,
        remaining: current.tier === 0 ? pkg.deposit : 0,
        consumed: states.filter(state => state.state === 'paid').map(state => state.tier),
        policy: paymentPolicy(pkg, current.tier), checkoutUrl: current.url
      };
    }));
    return { revision: catalog.revision, currency: catalog.currency, checkedAt: new Date(clock()).toISOString(), packages };
  }

  return {
    async get({ fresh = false } = {}) {
      if (!fresh && cache && clock() - fetchedAt < 10000) return cache;
      if (!fresh && pending) return pending;
      const request = inspect().then(result => { cache = result; fetchedAt = clock(); return result; });
      if (!fresh) pending = request;
      try { return await request; }
      finally { if (pending === request) pending = undefined; }
    }
  };
}

export function publicPricing(snapshot) {
  return { ...snapshot, packages: snapshot.packages.map(({ checkoutUrl, ...pkg }) => pkg) };
}

const staticFiles = new Map([
  ['/', ['index.html', 'text/html; charset=utf-8']],
  ...['index.html', 'website.css', 'website.js', 'index.md', 'llms.txt', 'llms-full.txt', 'robots.txt', 'sitemap.xml'].map(file => [
    `/${file}`, [file, file.endsWith('.css') ? 'text/css; charset=utf-8' : file.endsWith('.js') ? 'text/javascript; charset=utf-8' : file.endsWith('.html') ? 'text/html; charset=utf-8' : file.endsWith('.xml') ? 'application/xml' : 'text/plain; charset=utf-8']
  ])
]);

export function createServer({ service = createPricingService(stripeReader(process.env.STRIPE_RESTRICTED_KEY)) } = {}) {
  return http.createServer(async (request, response) => {
    const sendJSON = (status, value) => {
      response.writeHead(status, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      response.end(JSON.stringify(value));
    };
    try {
      const url = new URL(request.url, 'http://localhost');
      if (request.method === 'GET' && url.pathname === '/healthz') return sendJSON(200, { status: 'ok' });
      if (request.method === 'GET' && url.pathname === '/api/website/pricing') return sendJSON(200, publicPricing(await service.get()));
      if (request.method === 'POST' && url.pathname === '/api/website/checkout') {
        if (!/^application\/json\b/.test(request.headers['content-type'] || '')) return sendJSON(415, { error: 'Expected JSON.' });
        let body = '';
        for await (const chunk of request) {
          body += chunk;
          if (Buffer.byteLength(body) > 1024) return sendJSON(413, { error: 'Request too large.' });
        }
        let input;
        try { input = JSON.parse(body); } catch { return sendJSON(400, { error: 'Invalid request.' }); }
        if (!catalog.packages.some(pkg => pkg.id === input.package)) return sendJSON(400, { error: 'Choose a package.' });
        // Refresh at checkout: cached display data never authorizes a charge.
        const snapshot = await service.get({ fresh: true });
        const pkg = snapshot.packages.find(pkg => pkg.id === input.package);
        if (pkg.status === 'processing') return sendJSON(409, { error: 'A payment for this place is processing. Please check back shortly.', pricing: publicPricing(snapshot) });
        if (input.tier !== pkg.tier || input.amount !== pkg.amount) return sendJSON(409, { error: 'Availability has changed. Review the updated price before continuing.', pricing: publicPricing(snapshot) });
        return sendJSON(200, { url: pkg.checkoutUrl, package: pkg.id, tier: pkg.tier, amount: pkg.amount });
      }
      const resource = staticFiles.get(url.pathname);
      if (resource && ['GET', 'HEAD'].includes(request.method)) {
        const data = await readFile(new URL(resource[0], root));
        response.writeHead(200, { 'Content-Type': resource[1], 'Content-Length': data.length, 'Cache-Control': 'no-cache', 'X-Content-Type-Options': 'nosniff' });
        return response.end(request.method === 'HEAD' ? undefined : data);
      }
      sendJSON(404, { error: 'Not found.' });
    } catch {
      sendJSON(503, { error: 'Current availability could not be confirmed. Please try again shortly.' });
    }
  });
}

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  const port = Number(process.env.PORT || 8080);
  const server = createServer();
  server.listen(port, '0.0.0.0', () => console.log(`BNDR website listening on port ${port}`));
  for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => server.close(() => process.exit(0)));
}
