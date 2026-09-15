# Website refresh — draft, not deployed

Scope: the Get a Website view, its calculator, pricing data and checkout availability. The homepage, My Builds, About, shared CSS and original WebGL/router script are unchanged.

Railway confirmed `bndrllc.com` belongs to project **BNDR LLC**, service **bndrlabs**, production environment, repository **BNDRBOTS/BNDR-LLC**, branch **v4**. The verified deployed base is `0a3940423c7691de26a1f03fcca5231244bd7a08`.

## Pricing

USD. Each package has its own three introductory places. A paid place stays used, including purchases made at the previous prices. The 70%, 60% and 40% discounts are retained against the new regular totals.

| Package | Regular total | Place 1 | Place 2 | Place 3 | Regular deposit | Regular balance |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| BNDR Lander | $1,500 | $450 | $600 | $900 | $750 | $750 |
| BNDR Standard | $3,000 | $900 | $1,200 | $1,800 | $1,500 | $1,500 |
| BNDR Expanded | $4,500 | $1,350 | $1,800 | $2,700 | $2,250 | $2,250 |

Introductory places are paid in full. Regular builds and custom estimates are 50% upfront and 50% before launch or handoff. Hosting remains separate at $75/month; approved additional work remains $75/hour. Calculator extras retain their previous amounts. The old $599 calculator option is retained as a campaign landing page at the new one-page regular price.

`website-pricing.json` supplies the server catalogue. Its embedded copy in `index.html`, visible prices, calculator values, FAQ JSON-LD, `index.md` and `llms-full.txt` have been checked for consistency. Keep these representations synchronized when repricing.

## Checkout behavior

The new Node server serves the existing site and reads Stripe Payment Links and completed Checkout Sessions. It does not create a charge or modify Stripe. No database or local sale counter is used.

- Display availability is cached for up to 10 seconds. The open page refreshes every 15 seconds.
- Each checkout request checks Stripe again and rejects a changed tier or amount. Customers must review the new price; there is no silent increase.
- Every sale link must have `restrictions.completed_sessions.limit = 1`. Stripe's limit, rather than an in-memory application lock, is intended to enforce the single use. See [Stripe's Payment Link limits](https://docs.stripe.com/payment-links/customize#limit-the-number-of-times-a-payment-link-can-be-paid).
- A paid session advances only its package. A completed but unpaid session holds that package while payment is processing. An inactive link alone is never treated as evidence of a purchase.
- The old sale links are retained in the catalogue for purchase-history checks. They must be inactive before the new catalogue becomes available. A previously purchased place must have its corresponding new link inactive too.
- Missing credentials, mismatched prices or policy, multiple completed uses, duplicate slot links, or unverified availability disable fixed-package checkout. The custom-estimate form remains available.

## Remaining deployment work

The Stripe connector requested reauthentication. No account data or live Stripe changes have been verified. No production credentials have been configured, and this draft has not been deployed.

1. Reconnect the intended BNDR live Stripe account. Inspect the existing products, prices, Payment Links, completed sessions and open sessions before changing them. Reconcile any pending or duplicate historical purchases; do not reset already used places.
2. Create the new one-time USD prices on the existing website products, including regular totals and the deposit/sale amounts above. Stripe price amounts are immutable; preserve past payments and subscriptions. Update relevant website product descriptions/default prices and retire superseded checkout links after checking open sessions. Leave the hosting subscription and hourly service unchanged after confirming they match the stated $75 amounts.
3. Configure exactly one new Payment Link per package and slot. Metadata: `bndr_website_revision=2026-09-15`, `bndr_package=lander|standard|expanded`, `bndr_slot=1|2|3|0`. Slot `0` is the normal 50% deposit; slots `1`–`3` are the full introductory price. New links must use quantity 1, no adjustable quantity or extra items, and the exact `custom_text.submit.message` returned by `paymentPolicy()` in `website-server.mjs`. Sales require the one-completion limit; normal deposits have no such limit. Confirm the real tax and discount configuration before enabling the catalogue; unexpected additions are rejected by the current validator.
4. Keep every old sale link inactive. Keep a new sale link inactive if its legacy place has already been purchased or has an unresolved completed payment. Configure all other new links, then read them back. The server requires all twelve slot records and validates their amounts, product identities, policy text and limits.
5. Add a live restricted Stripe key as `STRIPE_RESTRICTED_KEY` in the Railway production service, with read access to Payment Links, Products/Prices and Checkout Sessions. Add the secret directly in Railway; never put it in source, a pull request or chat. The current service had no environment variables when inspected.
6. Verify real Stripe responses, simultaneous attempts to use a single place, already-open legacy sessions, and delayed-payment success/failure handling. Failed asynchronous payments currently remain held for reconciliation; automatic reopening is not implemented. Check this against the account's actual enabled payment methods before release.
7. Render the actual changed page at desktop and mobile sizes. Check selection, contact form, calculator, keyboard focus and reduced motion. Local browser navigation was denied in this session, so this visual/interaction gate remains unverified.
8. Deploy the reviewed commit through the existing `v4` Railway service with Node 24 and `npm start`. Railway provides `PORT`; the server binds `0.0.0.0`. Check `/healthz`, `/api/website/pricing`, correct checkout totals, and the unchanged homepage/My Builds after deployment. Preserve the existing deployment until these configuration and validation gates are satisfied.

## Verification performed

- `npm test`: 19 passing tests. These use simulated Stripe responses and a real local HTTP server; they do not prove a live Stripe payment or concurrency result.
- `npm run check`: both new JavaScript files parse.
- All executable inline scripts in `index.html` passed `node --check`.
- Source comparison confirmed the protected sections and original shared CSS/WebGL/router are identical to the deployed base.
- HTML IDs/labels, retained form fields, seven calculator steps, four size options, four extras, seven FAQs, pricing arithmetic and FAQ/JSON-LD agreement were checked.
- New CSS selector scope and brace balance were checked. Browser acceptance, appearance, animation and interactive behavior remain unverified.

No form submission, Stripe charge, refund, subscription change or production deployment was performed as part of these checks.
