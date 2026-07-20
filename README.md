# BNDR site v3.5 — complete owner guide

This is the complete BNDR website. It is plain HTML, CSS, and JavaScript. There is no build step, framework, database, package manager, or server application.

## First deployment

1. On a private computer, open `dashboard.html`.
2. Create a unique passphrase of at least 15 characters in the one-time setup screen. No shared starter password ships in this release.
3. Open **Settings** and export `content.js`.
4. Replace `js/content.js` with that export before uploading anything. Do not deploy the credential-free distributable first.
5. Keep every folder and file in its current position and upload the project to the web root.
6. Open the live HTTPS versions of Home, Templates, Estimate, Privacy, Terms, and Dashboard.
7. Send one real test estimate. FormSubmit emails the owner a one-time activation link after the first submission; approve it once.
8. Test any Stripe or Gumroad checkout in a private browser window before announcing it.

HTTPS is required for the strongest browser security, signed professional access, and Google sign-in inside the dashboard.

## Important files

| File | Purpose |
|---|---|
| `index.html` | Home page |
| `sites.html` | Custom website showcase |
| `templates.html` | Previewable site templates and hosted purchase links |
| `apps.html` | App gallery and purchases |
| `photos.html` | Photo gallery and licenses |
| `blog.html` | Blog index |
| `post.html` | Individual post selected by `?p=post-slug` |
| `builder.html` | Builder, work board, and mission |
| `estimate.html` | Price calculator and contact form |
| `privacy.html`, `terms.html` | Legal pages |
| `404.html` | Not-found page |
| `dashboard.html` | Owner and temporary-professional console; never receives the public footer |
| `js/content.js` | Single source of truth for owner-editable content |
| `js/site.js` | Public rendering, forms, purchases, footer, cursor, orb, and interactions |
| `js/dashboard.js` | Editing, autosave, preview, export, Analytics, and access controls |
| `js/md.js` | Safe Markdown renderer |
| `js/facts.js` | Hand-verified source registry used by articles |
| `css/bndr.css` | Public and explicitly scoped dashboard styles |
| `assets/bndr-logo.png` | Local full logo |
| `assets/favicon-32.png`, `assets/apple-touch-icon.png`, `assets/favicon.ico` | B-only browser and device icons |
| `tests/source-audit.mjs` | Dependency-free source, security, and link audit |
| `CHANGELOG.md` | Complete release and verification record |

## Owner sign-in and passphrase

The discreet **◇ Owner** link in every public footer opens `dashboard.html`.

To change the deployed passphrase later:

1. Open **Settings → Owner passphrase**.
2. Enter the current passphrase.
3. Enter a new 15–256 character passphrase.
4. Select **Set new passphrase**.
5. Export and deploy the new `content.js`.
6. Log out and confirm the new phrase works.

New passphrases must be 15–256 characters, require the current passphrase before a change, and are stored as uniquely salted PBKDF2-HMAC-SHA256 records with 600,000 rounds. Older `content.js` files with the previous SHA-256 field or an earlier PBKDF2 work factor still open; the next deliberate passphrase change migrates them automatically.

This remains a static-site gate. It prevents ordinary access but cannot equal server-side identity because the browser must receive the verification record. If the host offers password protection, an identity gateway, or access rules, protect `dashboard.html` there too. Never store passwords, API secrets, full card data, medical data, or private client records in this console.

## Edit, preview, and publish

1. Edit a field in the appropriate dashboard pane.
2. The draft autosaves in that browser.
3. Select **Preview** and switch between 1440 and 390 to inspect the actual draft page.
4. Select **Save draft** before leaving when an immediate save is useful.
5. Select **Publish → export content.js**.
6. Replace the live `js/content.js` and deploy.
7. Reload the changed public page in a private window.

Publishing downloads a file; it does not upload by itself. Drafts live only in the current browser. Use **Settings → Download draft backup** before clearing browser data or changing computers. **Restore from backup** loads that JSON later.

The visible BNDR logo and static social-share image are intentionally code-managed. The Settings logo URL is clearly limited to blog publisher schema; the dashboard does not claim that a `content.js` edit can replace static crawler metadata.

Markdown fields show an **MD** badge and a live formatted preview. Builder introduction, board item names and notes, mission, CTA, blog fields, gallery descriptions, Templates copy, and other long-form fields render formatting on the public site. The public page never prints Markdown symbols. A Markdown `#` heading is safely rendered as H2 in full sections and H3 inside a card because the page and card already own their titles.

## Add daily posts, work, apps, photos, or templates

- **Blog:** select **Blog → Add**. Each post uses the existing `post.html?p=slug` route, so daily posts do not require new HTML files.
- **Apps, photos, and sites:** select **Galleries + templates**, add an item, choose its category, and publish. These are entries on their existing pages, not separate files.
- **Templates:** use the Templates section in **Galleries + templates**. Add title, formatted description, price, category, live preview URL, optional preview image, and optional hosted checkout.
- **Pricing:** edit Estimate sizes and add-ons under **Intake**. The displayed total, submitted summary, GA lead value, and Estimate structured data all use the same prices.

Uploaded previews are limited to 15 MB at intake, reduced to at most 1,400 × 1,800 px, and embedded in `content.js`; only genuinely small transparent marks pass through unchanged. A hosted HTTPS image URL is better for a large catalog because embedded image bytes are downloaded on every page. The dashboard warns at 750 KB before exporting an unusually heavy `content.js`; it never silently lowers image quality after export.

An unrelated standalone page still requires an HTML file with its own title, description, canonical, H1, navigation, and footer. The dashboard does not pretend a generic content entry is a complete SEO-ready page. Copy the nearest existing page only when a genuinely new route is needed, then add it to navigation, preview routes, and the SEO generator.

## Templates and purchases

`templates.html` ships with an honest coming-soon state. It becomes a storefront as soon as Templates items are added and published.

Purchases support only these hosted HTTPS destinations:

- Stripe Payment Links on `buy.stripe.com` or Stripe Checkout on `checkout.stripe.com`.
- Gumroad product URLs on `gumroad.com`, `gum.co`, or a `*.gumroad.com` store.

The dashboard identifies a recognized provider while typing. An unrelated, insecure, malformed, or script URL is blocked on the public site and the direct order path remains available. Checkout opens in a protected new tab with `noopener noreferrer`. BNDR never receives or stores a complete card number through this site.

The same purchase guard applies to apps, photos, and templates. For payment notifications, enable successful-payment emails in Stripe or Gumroad; those providers know whether the payment completed. Automated delivery or fulfillment would require provider webhooks and a server, so this static release does not fake it.

## Estimate form

The Estimate page keeps the original seven questions and every original option.

- Size plus selected add-ons is calculated in integer cents, preventing floating-point drift.
- Formatted legacy values such as `$2,500` are normalized safely.
- The same result appears on screen, in the form summary, in the GA lead event, and in structured data.
- The hidden honeypot and four-second timing check remain active.
- Empty endpoint means FormSubmit. A failed relay produces the existing one-tap direct-email fallback.
- The owner address is assembled at runtime from `content.js`; no static HTML contains a raw address or `mailto:` link.

To change providers, paste a full form endpoint under **Intake**, publish, and perform a real delivery test.

## Temporary professional access

Professional links are signed with ECDSA P-256. The private signing key stays in the owner browser; `content.js` receives only the public verification key. The private code appears after `#` in the link, so it is not sent to the host or Google Analytics.

One-time setup:

1. Open **Settings → Temporary professional access**.
2. Select **Create access key**.
3. Export, deploy, and reload `content.js` before generating a link.

Issue a link:

1. Choose exactly 4, 8, 16, or 24 hours.
2. Select only the required work areas.
3. Generate and copy the private link.
4. Send it only to the intended professional.

Enforcement:

- The signature, issued time, allowed duration, expiry, random nonce, and scopes are verified before entry.
- Only assigned panes are shown. Before every save or export, content roots outside those scopes are restored to the starting draft.
- The allotted window ends at its exact time. A silent ten-minute grace allows an in-progress action to finish; the console then removes the session and returns to sign-in.
- Visibility changes and every save/export recheck expiry. Open operator consoles check deployed cancellation data every 60 seconds while visible.
- Owner credentials and cancellation state are always outside operator scope.

Cancel one link:

1. Open **Settings → Issued access links**.
2. Select **Cancel this link** beside the correct record.
3. Export and deploy `content.js` immediately.

That adds only the link's random nonce to the deployed deny-list. Other links keep working. Regenerating the access key still cancels every link after the replacement `content.js` is deployed.

The issuance list is local to the browser that created the links and stores no reusable token. Clearing that browser's storage removes the private signing key and its local issuance list. The deployed deny-list remains in `content.js`.

Static-site scope is strong client-side enforcement for trusted professional work, not a server authorization wall. Use host-level identity when the dashboard itself must be confidential.

## Footer

Open **Footer** to toggle, edit, and reorder platform links.

- Live defaults: LinkedIn, GitHub, Instagram, Facebook, Substack, Buy Me a Coffee, Gumroad, and PromptBase.
- Ready but disabled: X/Twitter, YouTube, TikTok, Discord, Etsy, Patreon, Threads, and Dribbble.
- Marks, official brand colors, legal links, logo, layout, and the glass glint are protected in code.
- Old `content.js` files without a footer section render the eight defaults automatically.

Every public page, including 404, uses the shared footer. `dashboard.html` intentionally does not.

## Google Analytics and email alerts

Public pages use GA4 measurement ID `G-KY0GGGZZTG` through `gtag.js`. To change it, replace both occurrences in each tagged page: Home, Sites, Templates, Apps, Photos, Blog, Post, Builder, Estimate, Privacy, and Terms. Never add Analytics to Dashboard.

The dashboard **Analytics** pane is a private, read-only viewer:

1. Enable the Analytics Data API and Analytics Admin API in Google Cloud.
2. Create a **Web application** OAuth client.
3. Add the exact live origin shown in the pane as an Authorized JavaScript origin.
4. Paste the public OAuth Client ID, publish `content.js`, and connect with the Google account that owns the property.

The Google access token stays in the current browser tab and never enters `content.js`.

For no-code email warnings, create GA4 **Custom Insights** for unusual traffic, missing conversions, or chosen metric thresholds and enable email delivery: <https://support.google.com/analytics/answer/9443595>. Analytics can detect tracked traffic and event problems. It cannot confirm that an unrelated app's email-delivery system works; that requires monitoring from that app or email provider.

## UI notices, motion, and accessibility

- Checkout redirects and blocked checkout links use a small accessible status notice.
- Form success and failure stay inside the form; dashboard actions use the existing live toast.
- The custom cursor appears only for fine pointers, disappears over text-entry controls, and never loads an asset.
- Touch devices retain the native cursor and gestures.
- Reduced Motion disables the cursor, orb physics, glints, sweeps, and transitions through the existing motion rule.
- The orb's 3D physics run only while its hero is visible and the tab is active.

## Safe maintenance checklist

Before every deployment:

1. Back up the live folder and current dashboard draft.
2. Replace only intentional files.
3. Run `node tests/source-audit.mjs` from the project root if Node is available; Node is for the audit only and is not needed by the site.
4. Test all public pages at phone and desktop widths.
5. Confirm no horizontal overflow or browser-console errors.
6. Confirm the footer, PHX clock, legal links, favicon, navigation rail, and source arrows.
7. Test one Estimate calculation and one real delivery.
8. Test each active Stripe or Gumroad checkout.
9. Confirm owner sign-in and any active 4/8/16/24-hour link.
10. Turn on Reduce Motion and confirm the site remains calm and complete.

There is no dependency installation, build command, or deployment script required for the website.
