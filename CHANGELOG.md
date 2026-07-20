# BNDR v3.5 changelog and audit record

Release date: July 19, 2026  
Baseline: fully audited BNDR v3.4 tree derived from the supplied `bndr-v3.3.zip`

## v3.5.2 — five amendments (July 20, 2026)

Scope: exactly the five reported items plus their direct downstream requirements. Nothing else touched.

1. **Headline period wrapping to the next line** — `.title-dot` was `display: inline-block`; browsers may break lines around atomic inline boxes even across a WORD JOINER, which let a period start a line by itself. Now plain `inline`, so the joiner glue holds and every period stays beside its word.
2. **Sphere still flat in deployment** — the v3.5.1 orb amendment (rotation removal) shipped under the same `?v=3.5.1` cache-buster as the first v3.5.1 build, so a cached copy of the earlier rotating `site.js` could keep serving the flat "blade" render. All css/js references on all thirteen pages now carry `?v=3.5.2`; current code contains no rotate transforms on the orb and renders a perfect circle at all times.
3. **Owner console preview snapping to Home** — every autosave refreshed the preview iframe at the route chosen in the route selector, which defaults to Home; editing the Builder pane therefore appeared to "revert to the home page." Each editing pane now maps to its public page (Copy→Home, Builder→Builder, Blog→Blog, Galleries→Sites, Footer→Home, Intake→Estimate) and the preview follows the pane on tab switch. Manual route selection still works and is preserved across autosaves.
4. **Console spacing system** — a `body.dash`-scoped override applies one 4px grid (8 / 12 / 16 / 24 / 48) to every margin, padding, and gap across the top bar, tabs, panes, fields, markdown splits, item cards, lists, actions, preview chrome, settings sections, gate, and toast. Spacing only: no color, size, type, hierarchy, logic, or responsive behavior changed, and the public site is untouched (shared classes are overridden only under `body.dash`).
5. **No passphrase recovery path** — the gate now shows "Forgot passphrase? Reset owner access." A typed `RESET` confirmation keeps all pages and drafts, clears the credential record, signing keys, and issued temporary-access links, and reopens first-run setup for a new passphrase. The PBKDF2 hash is one-way by design, so a reset is the only honest recovery; re-publish `content.js` afterward so the new credential deploys.
6. **Builder page voice** — `builder.title`, `builder.introMd`, and `builder.ctaMd` rewritten in plain first person without the third-person self-praise. No other copy fields changed.

## v3.5.1 — surgical five-fix pass (July 19, 2026)

Scope: exactly five requested defects plus their direct downstream requirements. Nothing else touched.

1. **See-more pill underside.** The green line under the home “See more” pills (and their green hover wash) came from the `.prose a` link accent outranking `.btn`. All three now inherit a magenta accent via `.prose a.btn`. Color only; every other effect untouched.
2. **Orb restored to a true sphere.** Replaced the irregular morphing inner blob (irregular border-radius, multiply blend, 135° linear gradient, 0.55s border-radius transition — the source of the flat, laggy, glitchy read) with a perfectly circular, fully blended radial-gradient paint mass clipped by the orb’s own circle. Grip/pull/throw physics, elastic spring return, and the tracked under-shadow are preserved and now run on **all devices**: the orb is visible on mobile with its own bounded play area, touch drag/throw is enabled, and the phone gyroscope rolls the orb while it’s on screen (iOS motion permission requested on first touch). Shadow and collision radii now derive from the rendered size. Amended in-pass: every rotation channel was removed from the orb visual — rotateX/rotateY tilted the flat circle into a disc (“breathmint”), and rotateZ plus gradient/highlight rotation swung the color anchors around (“glitch shifts”). The element now only translates and scales; hue positions are fixed; motion reads through travel, elastic scale, paint slosh, and the tracked shadow.
3. **Desktop hint.** The drag hint now reads “Click and Hold to Throw”, sits symmetrically centered beneath the orb with an upward nudge, and appears on fine-pointer devices only.
4. **Browser-tab icon.** Rebuilt the favicon set from the actual B mark isolated from `bndr-logo.png` by connected-component analysis (the italic B and N overlap horizontally, so the old crop was off-center). The glyph is now mathematically centered on the plasma tile (margins symmetric within 2 px, verified programmatically). Regenerated 256/180/32 px PNGs and the ICO.
5. **Cursor.** Smaller and distinctive: 5 px magenta core, 18 px machined ring, and a magenta satellite arc in constant slow orbit that tightens to 26 px and spins ~3× faster over interactive targets. Same palette; fine pointers only, Reduce Motion silent.
6. **Headline overlap.** The outlined “answer back” glyphs no longer touch or cross: letter tracking raised (0.005em → 0.06em) and the hard 3px/4px offset duplicate drop-shadow — the source of the stroke lines crossing the “e” — removed, keeping only the soft depth shadow.

Downstream: cache-busted every page’s CSS/JS to `?v=3.5.1` and favicon links to `?v=351`. Full `tests/source-audit.mjs` suite and `node --check` on all scripts pass; desktop and mobile renders verified by screenshot.

## Visual system

- Rebuilt the outlined **answer back** treatment with independent glyph spacing, translucent fill, a fine ink stroke, and restrained multi-plane depth. The old negative-spacing overlap no longer lets adjacent glyph strokes collide.
- Standardized every period in public H1 and lead-title text as the same magenta signal with a restrained haze. Runtime titles, including all three periods in the Builder H1, receive the same treatment after content binding.
- Prevented a responsive title period from wrapping onto a line by itself by attaching its visual span to the preceding word with an invisible Unicode WORD JOINER. This repaired the one defect found during the live Builder-page render pass without changing visible copy or spacing.
- Replaced the full-wordmark browser icon with an exact B-only crop from the supplied logo, fitted to a rounded plasma tile. Added 32 px, 180 px, 256 px, and ICO variants.
- Switched visible page logos from the external R2 URL to the existing optimized local logo. Schema image URLs remain valid external identity references.
- Replaced platform-dependent diagonal-arrow glyphs with a small code-drawn SVG on public source links and previews. Removed all pictographic emoji output and removed dashboard instructions that invited emoji icons.
- Added a restrained fine-pointer cursor: magenta core, delayed machined ring, interactive expansion, explicit native text/default cursors over form controls, and no touch or Reduce Motion activation.
- Converted the mobile navigation pill into a single inertial horizontal rail. Labels do not shrink or clip, and the new Templates link fits without crushing the dock.
- Removed the heavy lift/pop treatment from the four home value buttons. Their new hairline light pass changes border, tracking, and reflected light without a block fill or exaggerated bounce.
- Fixed Builder Mission spacing by removing long-form top-heading space from the first heading and balancing panel padding.
- Added settings-pane rhythm and responsive access-ledger spacing in the dashboard without adding public footer/effect styles to Dashboard.

## Orb depth and physics

- Extended the orb from two-dimensional position/rotation to x/y/z position, velocity, spring, and collision state.
- Added full rotateX/rotateY/rotateZ response from drag velocity, depth velocity, edge impacts, and throw direction.
- Added a foreground-depth threshold where lateral and vertical boundaries expand. At pronounced foreground depth the orb moves in front of the copy collision plane, then returns through a three-axis home spring.
- Added z-axis limits, damping, restitution, and a small tangential recovery term that prevents low-energy compound-corner lock.
- Added pointer-derived depth while dragging and a speed-derived foreground impulse on release.
- Added contained paint mass with velocity-opposed slosh, deformation, highlight counter-rotation, stronger internal contrast, and a tracked shadow that responds to speed, vertical lift, and depth.
- Preserved visibility and tab-state suspension, fixed-step integration, drag hint behavior, touch fallback, and complete Reduce Motion silence.

## Estimate

- Found and corrected the root visual failure: generated Estimate controls had no component CSS and were rendering as browser-default buttons and fields.
- Rebuilt the page as a calm two-column estimator at desktop and a single-column sequence on mobile. Each question is a separate glass panel; options have clear state signals, consistent spacing, and 44+ px targets.
- Kept all seven questions, all original choices, all default base prices, all add-on prices, delivery copy, FormSubmit logic, direct-email fallback, honeypot, and four-second timing trap.
- Moved arithmetic to integer cents, normalized formatted legacy inputs, rejected negative/invalid values, and used the same total for the display, submitted project summary, subject, and GA lead value.
- Synchronized Estimate JSON-LD offers from the live dashboard-managed sizes and prices so search metadata cannot silently drift after a price edit.
- Exhaustively tested all 64 default size/add-on combinations.

## Templates and hosted purchases

- Added `templates.html` with full metadata, canonical, one H1, shared navigation/footer, filters, live/image previews, coming-soon state, and purchase flow.
- Added optional `templates` content data: formatted lead, formatted coming-soon message, categories, and items.
- Added complete Templates editing inside **Galleries + templates**: title, category, Markdown description, price, live preview URL, optional image upload, and checkout URL.
- Added Templates to static navigation, managed navigation defaults, footer links, dashboard preview, per-page SEO editor, and sitemap generation.
- Restricted all app, photo, and template checkout buttons to HTTPS Stripe Payment Links/Checkout or Gumroad product/store URLs. Unsafe, malformed, scripted, credential-bearing, or unrelated links never become public checkout controls.
- Kept the direct order fallback for items without an approved checkout. Hosted checkout opens with `noopener noreferrer` and emits a non-PII `begin_checkout` GA event.
- Updated Privacy and Terms payment language to name the actual allow-listed providers.

## Dashboard content and Markdown

- Made every Builder work-board name and note a Markdown editor with live preview; public cards render formatted HTML instead of exposing Markdown syntax.
- Prevented owner Markdown from creating a second page H1: a Markdown `#` is rendered as H2 while H2-H4 keep their logical levels.
- Applied gallery, template, and blog-card Markdown as real formatted public content instead of flattening it to plain text. Nested headings shift below each H2 card title, fixing the former H1-to-H3 gallery outline gap without changing the card design.
- Kept Builder kicker/title, introduction, all three work columns, Mission, and CTA owner-editable.
- Added Stripe/Gumroad recognition feedback beside app, photo, and template checkout fields; credential-bearing URLs are rejected in both the editor and public renderer.
- Added Templates to preview routing and versioned public CSS/JS references so a newly deployed visual system cannot be masked by an old browser cache.
- Kept the content architecture honest: posts are dynamic `post.html?p=slug` entries; apps/photos/sites/templates are collection entries; an unrelated standalone route still requires a complete HTML page and metadata.
- Removed misleading dashboard uploads for the code-managed visible logo/static share image, relabeled the live publisher-logo URL to its actual blog-schema role, and scheme-gated owner-managed navigation/home links.

## Owner and professional access

- Replaced newly set owner passphrases with uniquely salted PBKDF2-HMAC-SHA256 at the current 600,000-iteration work factor. New values require 15–256 characters and confirmation of the current passphrase. Legacy SHA-256 and earlier PBKDF2 content remain readable until the next deliberate passphrase change.
- Removed the known distributable starter password. A private one-time setup creates the first salted credential in the local draft and explicitly requires `content.js` export before deployment; old configured content files still sign in normally.
- Restricted new professional access to exactly 4, 8, 16, or 24 hours.
- Added signed issued-at time, allowed-duration validation, maximum-expiry validation, random nonce validation, and existing ECDSA P-256 signature verification.
- Added a silent 600-second grace after the allotted endpoint. A timer removes the operator session exactly at grace end; visibility changes and every save/export recheck the deadline.
- Added scope-root enforcement before every save and export. Content outside assigned scopes is restored to the draft state captured when the professional entered. Owner credential and cancellation data is always restored.
- Added a local issuance ledger that stores only nonce, scopes, issued time, expiry, and cancellation state—never the reusable private token.
- Added individual **Cancel this link** controls. Deployment places that nonce in `owner.operatorRevokedNonces`; other links keep working.
- Added a visible-tab deployed-content check every 60 seconds so an open professional console observes individual cancellation or a regenerated public key.
- Kept full-key regeneration as the cancel-all control.
- Preserved the URL-fragment design: private operator tokens are not sent to the web host or Google Analytics.

## Notifications and Analytics

- Added small accessible public notices only for meaningful checkout redirects and blocked checkout configuration.
- Preserved in-place Estimate status and dashboard live toasts.
- Added a dashboard guide to GA4 Custom Insights for no-code traffic/conversion anomaly emails, with an explicit boundary that Analytics cannot monitor an unrelated app's email-delivery service.
- Documented Stripe/Gumroad successful-payment notification ownership rather than adding a false client-side payment monitor.

## Footer, legal, and exposure

- Added the shared footer to `404.html`; Dashboard remains the only page intentionally without it.
- Preserved the eight default platform fallbacks and all 16 dashboard presets.
- Rechecked enabled marks against the platforms' current first-party assets. The PromptBase mark now carries the complete pink/orange/yellow/mint/teal/blue/violet spectrum visible in its live 2026 logo; GitHub uses the official high-contrast light treatment on the dark footer.
- Re-ran dashboard footer export round-trip: changed LinkedIn, disabled two platforms, exported real `content.js`, loaded the result, and observed six enabled icons plus the changed URL.
- Re-ran original-content fallback with the footer field removed and observed all eight defaults.
- Confirmed no raw email address or static `mailto:` exists in any HTML file.
- Preserved runtime contact assembly, FormSubmit endpoint, payload, fallback, timing trap, and honeypot.

## Performance

- No public framework, library, icon font, WebGL, purchase SDK, or build step was added.
- Public CSS is 74,769 bytes / about 16.3 KB gzip.
- Public runtime JavaScript is 86,422 bytes / about 25.9 KB gzip.
- The complete uncompressed project, including owner documentation and the audit script, is about 476 KiB before ZIP compression.
- The custom cursor uses two elements and one short-lived animation loop. Orb animation remains visibility-gated. Templates reuse existing card, preview, Markdown, and purchase architecture.
- The 32 px favicon is 890 bytes; moving the visible logo local removes a public third-party image dependency.
- Dashboard preview uploads reject files above 15 MB, preserve only small/low-dimension transparent PNG marks, and cap other images at 1,400 × 1,800 px before WebP compression (JPEG fallback). Large individual previews get a hosted-URL prompt, and export warns at 750 KB because `content.js` is shared by every page.

## Verification completed

- `node --check`: all five JavaScript files passed.
- HTML parser: all 13 documents passed.
- CSS Tree parse: 559 rules passed with no syntax error.
- Static duplicate-ID scan: all 13 documents passed.
- Dependency-free project audit: 356 source, structure, local-reference, heading, Markdown-safety, exposure, security-marker, and linkage checks passed.
- Runtime DOM audit: 210 checks passed, including:
  - 12 public routes initialized at 390 and 1440 modes (24 route/viewport initializations) with no runtime exception.
  - eight footer defaults on every public route and both viewport modes;
  - seven Estimate questions and 28 choices;
  - all 64 price combinations plus formatted/negative input cases;
  - FormSubmit payload/success path and zero-request honeypot path;
  - Templates empty state, real item, approved Stripe checkout, blocked script URL, and blocked credential-bearing checkout URL;
  - deterministic orb drag/throw with finite three-axis transforms, slosh variables, and shadow tracking;
  - Reduce Motion preventing both orb physics and the custom cursor;
  - title-dot, Builder Markdown, gallery formatting, and nested heading hierarchy;
  - first-owner setup; signed 4/8/16/24-hour tokens; unsupported-duration rejection; grace second 599 acceptance; grace second 600 rejection; nonce cancellation; scope restoration; owner-field restoration; and PBKDF2 accept/reject;
  - footer dashboard export round-trip and original-content fallback.

- Vercel-hosted Chromium pass: all 12 public routes rendered at exact 390 px and 1,440 px iframe widths (24 route/viewport renders), with zero console errors, internal horizontal overflow, broken images, missing footers, missing legal links, undersized social targets, or H1-count failures.
- Opened a real dynamic article from the Blog index at both widths and confirmed one H1, a complete footer, and no overflow. This additionally verifies the `post.html?p=slug` route that a bare `post.html` URL cannot represent.
- Exercised the Estimate UI by keyboard as well as runtime tests: selecting the $4,500 build, $500 blog add-on, and $450 copywriting add-on produced $5,450 while retaining all three pressed states.
- Created first-owner access in the isolated preview, opened the full dashboard at 390 px and 1,440 px, and verified its content editor, live Markdown preview, Settings pane, and professional-access setup without horizontal overflow.
- The live pass found one orphanable title period on Builder at a responsive line break. The root cause was repaired with an invisible word joiner, then locked into the source audit so it cannot regress.

## Files added

- `templates.html`
- `assets/favicon-32.png`
- `assets/favicon-256.png`
- `assets/apple-touch-icon.png`
- `assets/favicon.ico`
- `tests/source-audit.mjs`

## Files changed

- `404.html` — local favicon/logo, shared footer, versioned assets.
- `index.html` — local favicon/logo, Templates nav, outlined-title signal, accurate custom-work metadata, versioned assets.
- `sites.html`, `apps.html`, `photos.html`, `blog.html`, `post.html` — local favicon/logo, Templates nav, versioned assets.
- `builder.html` — local favicon/logo, Templates nav, Builder/Mission component scopes, versioned assets.
- `estimate.html` — local favicon/logo, Templates nav, dynamic schema identifier, versioned assets.
- `privacy.html`, `terms.html` — local favicon/logo, Templates nav, accurate checkout language, versioned assets.
- `dashboard.html` — local favicon, Galleries + templates label, versioned assets.
- `css/bndr.css` — title, favicon-adjacent UI, navigation, Estimate, Templates, cursor, orb material, Builder spacing, and dashboard access/settings styles.
- `js/content.js` — v3.5, PBKDF2 migration field, cancellation list, managed navigation, Templates schema.
- `js/site.js` — title signals, arrows, URL/payment guards, notices, Templates, Estimate math/schema/layout, Builder Markdown, cursor, and 3D orb.
- `js/dashboard.js` — Templates editor, purchase validation, Markdown fields, performance-bounded image intake, preview/SEO routes, Analytics guidance, PBKDF2, strict scoped access, cancellation ledger, and export enforcement.
- `js/facts.js` — custom SVG source arrow.
- `js/md.js` — single-H1-safe Markdown heading rendering.
- `README.md` — complete v3.5 owner/operator guide.
- `CHANGELOG.md` — this record.

## Confirmed unchanged

- `assets/bndr-logo.png`

All original v3.4 pages and core scripts remain present. Changes are limited to the requested title/icon/spacing/effect/Estimate/orb/purchase/Templates/dashboard/access/notification work and their direct navigation, metadata, legal, documentation, and verification requirements.
