(() => {
  'use strict';
  const view = document.getElementById('website');
  const configNode = document.getElementById('website-pricing-config');
  if (!view || !configNode || view.dataset.websiteReady) return;
  view.dataset.websiteReady = 'true';
  const config = JSON.parse(configNode.textContent);
  const form = view.querySelector('#quick-pick-contact-form');
  const cards = [...view.querySelectorAll('[data-package].quick-plan')];
  const availability = view.querySelector('#website-pricing-status');
  const status = view.querySelector('#quick-contact-status');
  const summaryName = view.querySelector('#quick-pick-summary-name');
  const summaryDetail = view.querySelector('#quick-pick-summary-detail');
  const submit = form.querySelector('[type="submit"]');
  const money = value => '$' + Number(value).toLocaleString('en-US', { maximumFractionDigits: 0 });
  const reducedMotion = matchMedia('(prefers-reduced-motion: reduce)');
  let snapshot = null;
  let selectedId = null;
  let fetching = null;
  let sending = false;
  let lastCheck = 0;

  function showStatus(message, state = '') {
    status.dataset.state = state;
    status.textContent = message;
  }

  function renderSummary() {
    const selected = snapshot?.packages.find(pkg => pkg.id === selectedId);
    if (!selected) return;
    const pkg = config.packages.find(pkg => pkg.id === selectedId);
    summaryName.textContent = pkg.name;
    summaryDetail.textContent = `${pkg.pages} ${pkg.pages === 1 ? 'page' : 'pages'} · ${pkg.revisions} ${pkg.revisions === 1 ? 'revision' : 'revisions'} · ${selected.policy}`;
  }

  function renderPricing(next) {
    if (next.revision !== config.revision || !Array.isArray(next.packages)) throw new Error('Pricing revision mismatch.');
    for (const pkg of config.packages) {
      const state = next.packages.find(item => item.id === pkg.id);
      if (!state || state.regular !== pkg.regular || state.deposit !== pkg.deposit || ![0, 1, 2, 3].includes(state.tier) || state.amount !== (state.tier === 0 ? pkg.deposit : pkg.sale[state.tier - 1])) throw new Error('Pricing does not match the displayed package.');
    }
    snapshot = next;
    for (const card of cards) {
      const pkg = config.packages.find(pkg => pkg.id === card.dataset.package);
      const state = next.packages.find(pkg => pkg.id === card.dataset.package);
      const normal = state.tier === 0;
      card.querySelector('.quick-price-current').textContent = money(normal ? pkg.regular : state.amount);
      card.querySelector('.quick-price-regular').textContent = normal ? 'Regular package total' : `Regular total ${money(pkg.regular)}`;
      card.querySelector('.quick-price-caption').textContent = state.status === 'processing'
        ? 'This place has a payment processing. Please check back shortly.'
        : normal ? `${money(pkg.deposit)} to start · ${money(pkg.deposit)} before launch or handoff`
        : `Place ${state.tier} · ${config.discountPercentages[state.tier - 1]}% off · paid in full`;
      card.querySelector('[data-quick-select]').disabled = state.status === 'processing';
      card.querySelectorAll('[data-sale-tier]').forEach(row => {
        const tier = row.dataset.saleTier === 'regular' ? 0 : Number(row.dataset.saleTier);
        const consumed = tier > 0 && state.consumed.includes(tier);
        row.hidden = consumed;
        row.dataset.consumed = String(consumed);
        row.classList.toggle('is-current', tier === state.tier);
      });
    }
    availability.textContent = 'Introductory places are confirmed by completed payment. Each package advances separately.';
    renderSummary();
    submit.disabled = sending || !selectedId || next.packages.find(pkg => pkg.id === selectedId)?.status === 'processing';
  }

  function blockPricing() {
    snapshot = null;
    cards.forEach(card => {
      card.querySelector('[data-quick-select]').disabled = true;
      card.querySelector('.quick-price-caption').textContent = 'Availability is temporarily unconfirmed.';
    });
    submit.disabled = true;
    availability.textContent = 'Current availability could not be confirmed. Please try again shortly, or use the custom estimate below to discuss your project.';
  }

  async function refresh({ force = false } = {}) {
    if (fetching) return fetching;
    if (!force && snapshot && Date.now() - lastCheck < 10000) return;
    fetching = (async () => {
      try {
        const response = await fetch('/api/website/pricing', { cache: 'no-store', signal: AbortSignal.timeout(15000) });
        if (!response.ok) throw new Error('Availability unavailable.');
        renderPricing(await response.json());
        lastCheck = Date.now();
      } catch { blockPricing(); }
      finally { fetching = null; }
    })();
    return fetching;
  }

  function selectCard(card) {
    const state = snapshot?.packages.find(pkg => pkg.id === card.dataset.package);
    if (!state || state.status === 'processing') return;
    selectedId = card.dataset.package;
    cards.forEach(item => {
      const selected = item === card;
      item.classList.toggle('is-selected', selected);
      const button = item.querySelector('[data-quick-select]');
      button.setAttribute('aria-pressed', String(selected));
      button.textContent = selected ? 'Selected' : `Select ${item.dataset.quickPlan} →`;
    });
    renderSummary();
    showStatus('');
    form.classList.add('is-open');
    submit.disabled = false;
    form.scrollIntoView({ behavior: reducedMotion.matches ? 'auto' : 'smooth', block: 'nearest' });
    requestAnimationFrame(() => form.querySelector('#quick-name').focus({ preventScroll: true }));
  }

  cards.forEach(card => {
    card.querySelector('[data-quick-select]').addEventListener('click', () => selectCard(card));
    card.addEventListener('pointermove', event => {
      if (reducedMotion.matches || event.pointerType === 'touch') return;
      const rect = card.getBoundingClientRect();
      card.style.setProperty('--plan-light-x', `${Math.round((event.clientX - rect.left) / rect.width * 100)}%`);
      card.style.setProperty('--plan-light-y', `${Math.round((event.clientY - rect.top) / rect.height * 100)}%`);
    }, { passive: true });
  });

  async function checkoutFor(selected) {
    const response = await fetch('/api/website/checkout', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ package: selected.id, tier: selected.tier, amount: selected.amount }),
      signal: AbortSignal.timeout(15000)
    });
    const result = await response.json();
    if (response.status === 409 && result.pricing) renderPricing(result.pricing);
    if (!response.ok) throw new Error(result.error || 'Checkout could not be confirmed. Please try again.');
    if (!/^https:\/\/buy\.stripe\.com\/[A-Za-z0-9]+$/.test(result.url || '')) throw new Error('Checkout could not be confirmed. Please try again.');
    return result;
  }

  function emailFallback(payload) {
    showStatus('The form could not be sent. You can send these details by email instead.');
    const link = document.createElement('a');
    const body = Object.entries(payload).filter(([key]) => !key.startsWith('_')).map(([key, value]) => `${key}: ${value}`).join('\n');
    link.href = `mailto:bndr.labs@gmail.com?subject=${encodeURIComponent(payload._subject)}&body=${encodeURIComponent(body)}`;
    link.textContent = ' Send project details by email →';
    status.append(link);
  }

  form.addEventListener('submit', async event => {
    event.preventDefault();
    if (sending) return;
    const selected = snapshot?.packages.find(pkg => pkg.id === selectedId);
    if (!selected) return showStatus('Choose a package after availability has been confirmed.');
    if (form.querySelector('#quick-hp').value) return;
    if (!form.reportValidity()) return;
    const fields = Object.fromEntries(new FormData(form));
    const payload = {
      _subject: `[BNDR WEBSITE] ${selected.name} — ${money(selected.amount)}`,
      _template: 'table', _captcha: 'false',
      name: fields.name.trim(), email: fields.email.trim(), business: fields.business.trim(), phone: fields.phone.trim(), notes: fields.notes.trim(),
      plan: selected.name, regular_total: money(selected.regular), amount_due_now: money(selected.amount),
      payment_policy: selected.policy, introductory_place: selected.tier || 'Regular 50% deposit',
      remaining_balance: money(selected.remaining), managed_hosting_care: '$75/month separate', additional_work: '$75/hour with approval'
    };
    sending = true;
    submit.disabled = true;
    submit.textContent = 'Confirming availability…';
    showStatus('');
    try {
      await checkoutFor(selected);
      submit.textContent = 'Sending your details…';
      let delivery;
      try {
        const response = await fetch('https://formsubmit.co/ajax/bndr.labs@gmail.com', {
          method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify(payload), signal: AbortSignal.timeout(15000)
        });
        delivery = await response.json();
        if (!response.ok || ![true, 'true'].includes(delivery.success)) throw new Error('Delivery failed.');
      } catch { emailFallback(payload); return; }
      // A sale may complete while the contact request is being sent. Check again.
      await checkoutFor(selected);
      showStatus('Your details have been sent. Continue to Stripe to review and complete payment.', 'ok');
      const link = document.createElement('button');
      link.type = 'button';
      link.className = 'website-checkout';
      link.textContent = `Continue to Stripe · ${money(selected.amount)} →`;
      link.addEventListener('click', async () => {
        link.disabled = true;
        try { const current = await checkoutFor(selected); window.location.assign(current.url); }
        catch (error) { showStatus(error.message); }
        finally { link.disabled = false; }
      });
      status.append(link);
    } catch (error) { showStatus(error.message); }
    finally {
      sending = false;
      submit.disabled = !snapshot || snapshot.packages.find(pkg => pkg.id === selectedId)?.status === 'processing';
      submit.textContent = 'Send details & continue →';
    }
  });

  // Website-only recovery when the existing WebGL module cannot initialize.
  // On browsers where the original router works, it remains solely responsible.
  function initializeWebsiteRouteFallback() {
    if (history.state && Object.prototype.hasOwnProperty.call(history.state, 'view')) return;
    const home = document.getElementById('home');
    const render = () => {
      const open = location.hash === '#website';
      view.classList.toggle('open', open);
      view.setAttribute('aria-hidden', String(!open));
      if (home) home.inert = open;
    };
    document.querySelectorAll('[data-open="website"]').forEach(link => link.addEventListener('click', () => { if (location.hash === '#website') render(); }));
    view.querySelector('[data-close]').addEventListener('click', () => {
      history.pushState(null, '', location.pathname + location.search);
      render();
      document.querySelector('[data-open="website"]')?.focus();
    });
    addEventListener('hashchange', render);
    addEventListener('popstate', render);
    addEventListener('keydown', event => { if (event.key === 'Escape' && view.classList.contains('open')) view.querySelector('[data-close]').click(); });
    render();
  }
  if (document.readyState === 'complete') initializeWebsiteRouteFallback();
  else addEventListener('load', initializeWebsiteRouteFallback, { once: true });

  const onVisibility = () => { if (view.classList.contains('open') && !document.hidden) refresh(); };
  new MutationObserver(onVisibility).observe(view, { attributes: true, attributeFilter: ['class'] });
  addEventListener('pageshow', () => { if (view.classList.contains('open')) refresh({ force: true }); });
  document.addEventListener('visibilitychange', onVisibility);
  setInterval(onVisibility, 15000);
  onVisibility();
})();
