# Website refresh — saved draft, not deployed

Scope: Get a Website, its calculator, pricing data and checkout availability. Homepage, My Builds, About, shared CSS and original WebGL/router source remain identical to the deployed base.

## Confirmed destination

- GitHub: **BNDRBOTS/BNDR-LLC**, production branch **v4**.
- Railway: **BNDR LLC** / **bndrlabs** / **production**, domain **bndrllc.com**.
- Project: `620fd14b-68b8-40f1-ad9d-fb54e1c3c6e0`; service: `822bb1f3-2214-4c71-9bd7-ce1ce8cd80bb`; environment: `a9a12277-ef13-4d2c-8784-6d9d0afe1cf7`.
- Production base: `0a3940423c7691de26a1f03fcca5231244bd7a08`.
- Draft: [PR #1](https://github.com/BNDRBOTS/BNDR-LLC/pull/1), branch `codex/website-refresh-pricing-2026-09-15`. Not merged.

## Prices and policy

USD. Each package has its own three introductory places. A paid place stays used, including purchases at previous prices. Existing 70%, 60% and 40% discounts apply to the new regular totals.

| Package | Regular | Place 1 | Place 2 | Place 3 | Deposit | Balance |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| BNDR Lander | $1,500 | $450 | $600 | $900 | $750 | $750 |
| BNDR Standard | $3,000 | $900 | $1,200 | $1,800 | $1,500 | $1,500 |
| BNDR Expanded | $4,500 | $1,350 | $1,800 | $2,700 | $2,250 | $2,250 |

Introductory places are paid in full. Regular builds and custom estimates require 50% upfront and 50% before launch or handoff. Hosting stays separate at $75/month; approved additional work stays $75/hour. Calculator extras retain their existing amounts. The former $599 calculator option is retained as a campaign landing page at $1,500.

Keep `website-pricing.json`, its embedded copy, visible prices, calculator, FAQ JSON-LD, `index.md` and `llms-full.txt` synchronized. These agree in this draft.

## Stripe work completed and read back

Verified live account: **BNDR LLC**, `acct_1RFRR3GuY1oGAyYS`. Connector access works; reauthorization is not a blocker.

- Created 15 one-time USD prices and 15 Payment Links on the existing three website products.
- Updated those products' descriptions, regular-price metadata and default prices to $1,500 / $3,000 / $4,500.
- Read back all 15 links: correct amount, product, USD, quantity one, fixed quantity, policy text, no promotion codes or automatic tax. All nine sale links have `restrictions.completed_sessions.limit = 1`.
- Hosting's existing price is $75 with a monthly recurrence; the existing hourly price is $75 one-time. Neither was changed.
- The complete Checkout Sessions list returned 100 records with `has_more=false`; none referenced the 33 old/new website links. No customer data is included here.
- **All 15 newly created links are now inactive for staging**, confirmed by Stripe update responses. Existing website links were left unchanged and remain the live website's checkout destinations. Old price objects were not archived.
- No payments, refunds, subscriptions, invoices or customer messages were created.

The following records already exist; reuse them on resumption. Do not recreate prices, links or inventory.

Regular total price IDs:

- BNDR Lander: `price_1UG02YGuY1oGAyYSFePfVDMg` on `prod_VARDTC10BAGL7I`.
- BNDR Standard: `price_1UG03aGuY1oGAyYSIE9R2POy` on `prod_VAREbYCe0EnD4s`.
- BNDR Expanded: `price_1UG03dGuY1oGAyYSmvQIsrGY` on `prod_VAREvmRTYNRwQi`.

Slot `0` is the regular 50% deposit. `balance` is the final 50%; it deliberately uses the same amount/price as the deposit, with different payment instructions. Slots `1`–`3` are paid-in-full sale places.

| Package | Slot | Amount | Price | Payment Link |
| --- | --- | ---: | --- | --- |
| expanded | balance | $2,250 | `price_1UG03eGuY1oGAyYSpDfHH1mw` | `plink_1UG05qGuY1oGAyYSkhgwJ6kQ`
| expanded | 0 | $2,250 | `price_1UG03eGuY1oGAyYSpDfHH1mw` | `plink_1UG05pGuY1oGAyYSG8xj3WK5`
| expanded | 3 | $2,700 | `price_1UG03gGuY1oGAyYSi8e30YEr` | `plink_1UG05oGuY1oGAyYSTVo4OWh3`
| expanded | 2 | $1,800 | `price_1UG03fGuY1oGAyYSgBvs1bWH` | `plink_1UG05nGuY1oGAyYS9W3jOt9B`
| expanded | 1 | $1,350 | `price_1UG03fGuY1oGAyYSv3idyXkm` | `plink_1UG05mGuY1oGAyYSehk6oC6l`
| standard | balance | $1,500 | `price_1UG03aGuY1oGAyYSxvb7G5LN` | `plink_1UG05lGuY1oGAyYS3crMJWuY`
| standard | 0 | $1,500 | `price_1UG03aGuY1oGAyYSxvb7G5LN` | `plink_1UG05lGuY1oGAyYS0HiHMQb2`
| standard | 3 | $1,800 | `price_1UG03dGuY1oGAyYSvmlNy2g2` | `plink_1UG05kGuY1oGAyYSCiXjm4bt`
| standard | 2 | $1,200 | `price_1UG03cGuY1oGAyYSsiUXW9Di` | `plink_1UG05jGuY1oGAyYSUNVQZZFz`
| standard | 1 | $900 | `price_1UG03bGuY1oGAyYS0IwbfdDK` | `plink_1UG05iGuY1oGAyYSLoyPklme`
| lander | balance | $750 | `price_1UG03WGuY1oGAyYSZph9gN6P` | `plink_1UG05hGuY1oGAyYSbaU765hY`
| lander | 0 | $750 | `price_1UG03WGuY1oGAyYSZph9gN6P` | `plink_1UG05gGuY1oGAyYSN8YT5ZOv`
| lander | 3 | $900 | `price_1UG03ZGuY1oGAyYST6X4UVKS` | `plink_1UG05fGuY1oGAyYSkFHK7trX`
| lander | 2 | $600 | `price_1UG03YGuY1oGAyYSJehSRVrp` | `plink_1UG05eGuY1oGAyYSVSEUP3vB`
| lander | 1 | $450 | `price_1UG03XGuY1oGAyYSZkRPZLVE` | `plink_1UG05dGuY1oGAyYSoIHxTOnw` |

## Server and slot behavior

The Node server serves the existing site and reads Stripe Payment Links plus completed Checkout Sessions. It never creates a charge or mutates Stripe. It uses no database or local sale counter.

- Display data is cached for up to 10 seconds; an open website view refreshes every 15 seconds.
- Checkout rereads Stripe and rejects a changed tier or amount. The customer must review a changed price.
- Paid completion advances only that package. An unpaid completed session holds it as processing. Inactivity alone never counts as a sale.
- Legacy links remain in the catalogue to preserve purchase history. All nine old sale links must be inactive before this server enables the new catalogue. A new place corresponding to a legacy purchase must also stay inactive.
- New metadata uses `bndr_website_revision=2026-09-15`, `bndr_package=lander|standard|expanded`, and `bndr_slot=1|2|3|0`. The twelve required slot records must be unique. Balance links are outside automatic selection.
- Missing credentials, unverified availability, wrong policy/amounts, duplicate records or multiple completed uses disable fixed-package checkout. The custom-estimate form remains available.
- The one-use requirement relies on [Stripe's Payment Link completion limit](https://docs.stripe.com/payment-links/customize#limit-the-number-of-times-a-payment-link-can-be-paid). Concurrent live payments have not been tested. Failed asynchronous payments currently remain held for reconciliation; automatic reopening is not implemented.

## Remaining work, in order

1. **Configure the application credential.** Railway's current rendered variable names contain no `STRIPE_RESTRICTED_KEY`. The Stripe connector does not provide a credential to the deployed server. Add a live restricted key directly to **BNDR LLC / bndrlabs / production / Variables**, with read access to Payment Links, Products/Prices and Checkout Sessions. Never put it in source, a PR or chat. No supported key-creation operation was found in the connector.
2. **Finish visual and runtime checks.** Desktop/mobile rendering, keyboard interaction and reduced-motion behavior remain unverified because browser navigation to the local preview was blocked. Do not report these as passed. Check actual server access to Stripe with the Railway credential; captured or simulated responses do not prove it.
3. **Perform the checkout transition with a fresh purchase check.** Reconcile completed and open legacy sessions, then deactivate superseded website sale/deposit/balance links as part of the release. Preserve already-used places. Activate only the appropriate new links; read back exact policies, prices, one-use limits and current tier. Do not activate new sale links alongside legacy sale inventory.
4. **Deploy and verify.** Merge the reviewed changes to the existing `v4` Railway source, run Node 24 with `npm start`, and verify `/healthz`, `/api/website/pricing`, checkout totals and unchanged homepage/My Builds. Railway supplies `PORT`; the server binds `0.0.0.0`. Production deployment has not been performed.

## Verification already completed

- `npm test`: **19 passing tests**, using simulated Stripe and a real local HTTP server. This is not a live payment/concurrency test.
- `npm run check` and executable inline-script syntax checks passed.
- Byte-for-byte comparisons passed for homepage, My Builds, About, shared CSS and original WebGL/router.
- IDs, labels, retained form fields, all seven calculator steps, four size choices, four extras, seven FAQs, pricing arithmetic and FAQ/JSON-LD consistency were checked.
- CSS scope and brace balance were checked; browser parsing/rendering is unverified.
- Live Stripe amounts, product identities, quantities, policy text, one-use settings, hosting recurrence and hourly amount were read back.
