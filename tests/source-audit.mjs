/* BNDR source audit — dependency-free and never loaded by the public site.
   Run from the project root with: node tests/source-audit.mjs */
import fs from "node:fs";
import path from "node:path";
import vm from "node:vm";
import { execFileSync } from "node:child_process";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const publicPages = [
  "404.html", "apps.html", "blog.html", "builder.html", "estimate.html", "index.html",
  "photos.html", "post.html", "privacy.html", "sites.html", "templates.html", "terms.html"
];
const originalArchiveFiles = [
  "404.html", "README.md", "apps.html", "blog.html", "builder.html", "dashboard.html",
  "estimate.html", "index.html", "photos.html", "post.html", "sites.html",
  "css/bndr.css", "js/content.js", "js/dashboard.js", "js/facts.js", "js/md.js", "js/site.js"
];
const failures = [];
let passed = 0;
function assert(condition, message) {
  if (condition) passed++;
  else failures.push(message);
}
function read(file) { return fs.readFileSync(path.join(root, file), "utf8"); }

for (const file of originalArchiveFiles) {
  assert(fs.existsSync(path.join(root, file)), `Original archive file was removed: ${file}`);
}

for (const file of publicPages) {
  const html = read(file);
  const h1Count = (html.match(/<h1\b/gi) || []).length;
  assert(h1Count === 1 || (file === "post.html" && h1Count === 0 && /id="article"/.test(html)), `${file}: expected exactly one static or runtime H1`);
  assert(/<footer class="site-footer" data-site-footer>/.test(html), `${file}: missing shared footer`);
  assert(/assets\/favicon-32\.png/.test(html), `${file}: missing local B favicon`);
  assert(!/r2-uploader-production[^"']+6a9dd45e/.test(html.replace(/<script type="application\/ld\+json">[\s\S]*?<\/script>/g, "")), `${file}: public logo still depends on remote host`);
  assert(!/mailto:/i.test(html), `${file}: static mailto exposure`);
  assert(!/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(html), `${file}: raw email exposure`);
  assert(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(html), `${file}: pictographic emoji found`);

  const refs = [...html.matchAll(/\b(?:href|src)="([^"]+)"/g)].map((match) => match[1]);
  for (const ref of refs) {
    if (/^(?:https?:|#|data:|mailto:)/i.test(ref)) continue;
    const clean = ref.split(/[?#]/)[0];
    if (!clean) continue;
    assert(fs.existsSync(path.join(root, clean)), `${file}: broken local reference ${ref}`);
  }
}

for (const file of ["js/content.js", "js/md.js", "js/facts.js", "js/site.js", "js/dashboard.js"]) {
  try { execFileSync(process.execPath, ["--check", path.join(root, file)], { stdio: "pipe" }); assert(true, ""); }
  catch (error) { assert(false, `${file}: syntax check failed\n${error.stderr || error.message}`); }
}

const allStatic = publicPages.map(read).join("\n") + read("dashboard.html");
assert(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(allStatic), "HTML contains pictographic emoji");
assert(!/↗/.test(allStatic), "HTML contains platform-dependent diagonal arrow glyph");
assert(!/mailto:/i.test(allStatic), "Static HTML contains a mailto address");
assert(!/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i.test(allStatic), "Static HTML contains a raw email address");

const site = read("js/site.js");
const dashboard = read("js/dashboard.js");
const content = read("js/content.js");
const estimate = read("estimate.html");
const dashboardHtml = read("dashboard.html");
assert(/buy\.stripe\.com/.test(site) && /\.gumroad\.com/.test(site), "Checkout allow-list missing Stripe or Gumroad");
assert(/url\.protocol !== "https:" \|\| url\.username \|\| url\.password/.test(site), "Checkout guard does not reject URL credentials");
assert(/!u\.username && !u\.password/.test(site), "Footer URL guard does not reject URL credentials");
assert(/safeNavUrl\(l\.href\)/.test(site) && /safeNavUrl\(s\.link\)/.test(site), "Owner-managed navigation links are not scheme-gated");
assert(/noopener noreferrer/.test(site), "External runtime links missing rel protection");
assert(/id="ik-hp"/.test(site) && /form\.querySelector\("#ik-hp"\)/.test(site), "Estimate honeypot missing or disconnected");
assert(/Date\.now\(\) - ikT0 < 4000/.test(site), "Estimate time trap missing");
assert(/totalCents/.test(site) && /priceCents/.test(site), "Integer-cent estimate math missing");
assert(/id="estimate-service-ld"/.test(estimate) && /estimateSchema\.offers/.test(site), "Estimate schema is not price-synchronized");
assert(/OPERATOR_DURATIONS = \[4 \* 3600, 8 \* 3600, 16 \* 3600, 24 \* 3600\]/.test(dashboard), "Strict operator duration presets missing");
assert(/OPERATOR_GRACE_SECONDS = 600/.test(dashboard), "Ten-minute operator grace missing");
assert(/operatorRevokedNonces/.test(dashboard) && /Cancel this link/.test(dashboard), "Individual operator cancellation missing");
assert(/PBKDF2-SHA256/.test(dashboard) && /iterations: 600000/.test(dashboard), "Current PBKDF2 owner-passphrase work factor missing");
assert(/verifyOwnerPassphrase\(currentPassInput\.value\)/.test(dashboard) && /v\.length < 15/.test(dashboard), "Owner passphrase change lacks re-authentication or minimum length");
assert(/firstSetup/.test(dashboard) && /Create private access/.test(dashboard), "Credential-free first setup flow missing");
assert(!/bndr-owner-2026/.test(content + dashboard + read("dashboard.html")), "Known starter passphrase still ships in the project");
assert(!/mediaField\(bindPath\("meta\.(?:logo|ogImage)"\)/.test(dashboard), "Settings still exposes a misleading static-image upload control");
assert(/templates: \{/.test(content) && /templates\.items/.test(dashboard), "Template content/dashboard integration missing");
assert(/C\.footer && Array\.isArray\(C\.footer\.social\) \? C\.footer\.social : FOOTER_DEFAULT_SOCIAL/.test(site), "Original-content footer fallback missing");
assert(!/[\u{1F300}-\u{1FAFF}\u{2600}-\u{27BF}]/u.test(site + dashboard + read("js/facts.js")), "Runtime code contains pictographic emoji output");
assert(/function lockTitleDot\(node\)/.test(site) && /createTextNode\("\\u2060"\)/.test(site), "Responsive title dots can detach from their preceding word");
assert(!/data-site-footer|js\/site\.js/.test(dashboardHtml), "Dashboard was contaminated by public footer/effect runtime");
assert(/file\.size > 15 \* 1024 \* 1024/.test(dashboard) && /MAXW = 1400, MAXH = 1800/.test(dashboard), "Dashboard image intake limits changed or disappeared");
assert(/out\.length > 750000/.test(dashboard), "Large content.js export warning is missing");

const defaultSocialBlock = (site.match(/var FOOTER_DEFAULT_SOCIAL = \[([\s\S]*?)\n  \];/) || [])[1] || "";
const expectedDefaultOrder = ["linkedin", "github", "instagram", "facebook", "substack", "buymeacoffee", "gumroad", "promptbase"];
const enabledDefaultOrder = [...defaultSocialBlock.matchAll(/id: "([^"]+)", enabled: true/g)].map((match) => match[1]);
assert(JSON.stringify(enabledDefaultOrder) === JSON.stringify(expectedDefaultOrder), "Default footer platforms are missing or out of order");
assert((defaultSocialBlock.match(/enabled: false/g) || []).length === 8, "Expected eight disabled footer presets");
for (const color of ["#0A66C2", "#F0F6FC", "#FEDA75", "#0866FF", "#FF6719", "#FFDD00", "#FF90E8", "#FF8DB3", "#8F78D0"]) {
  assert(site.includes(color), `Footer preset color missing: ${color}`);
}

// content.js must remain executable as a standalone classic script.
const sandbox = { window: {} };
vm.runInNewContext(content, sandbox, { filename: "js/content.js" });
assert(!!sandbox.window.BNDR_CONTENT, "content.js did not create BNDR_CONTENT");
assert(sandbox.window.BNDR_CONTENT.templates.items.length === 0, "Templates should ship in an honest coming-soon state");
assert(sandbox.window.BNDR_CONTENT.nav.links.some((link) => link.href === "templates.html"), "Templates missing from managed navigation");
vm.runInNewContext(read("js/md.js"), sandbox, { filename: "js/md.js" });
const hostileMarkdown = sandbox.window.BNDRMD.render('# Duplicate title\n\n<script>alert(1)</script>\n\n[bad](javascript:alert(1))');
assert(!/<h1|<script/i.test(hostileMarkdown), "Markdown created a second H1 or executable HTML");
assert(/<h2>Duplicate title<\/h2>/.test(hostileMarkdown), "Markdown H1 was not safely demoted");
assert(/href="#"/.test(hostileMarkdown), "Markdown unsafe URL was not neutralized");
assert(/<h3>Nested title<\/h3>/.test(sandbox.window.BNDRMD.renderNested("# Nested title")), "Nested card Markdown did not preserve heading hierarchy");

// ── v3.5.3 hardening: env-based credentials, non-destructive email reset ──
assert(fs.existsSync(path.join(root, "server.mjs")), "server.mjs missing — hardened deployment layer was removed");
const serverSource = read("server.mjs");
try { execFileSync(process.execPath, ["--check", path.join(root, "server.mjs")], { stdio: "pipe" }); assert(true, ""); }
catch (error) { assert(false, `server.mjs: syntax check failed\n${error.stderr || error.message}`); }
assert(/process\.env\.OWNER_PASS_KDF/.test(serverSource), "Server credential must come from the OWNER_PASS_KDF environment variable");
assert(!/"hash"\s*:\s*"[A-Za-z0-9_-]{20,}"/.test(serverSource), "server.mjs contains a hardcoded credential record");
assert(/timingSafeEqual/.test(serverSource), "Server passphrase compare is not constant-time");
assert(/limited\("verify", ip, 8, 15 \* 60 \* 1000\)/.test(serverSource), "Sign-in rate limiting missing");
assert(/limited\("reset", ip, 3, 60 \* 60 \* 1000\)/.test(serverSource), "Reset-email rate limiting missing");
assert(/single use/.test(serverSource) && /10 \* 60 \* 1000/.test(serverSource), "Reset codes must be single-use with a 10-minute expiry");
assert(/BLOCKED_FILES/.test(serverSource) && /\.env/.test(serverSource), "Server must refuse to serve .env and deployment files");
assert(fs.existsSync(path.join(root, ".gitignore")) && /^\.env$/m.test(read(".gitignore")), ".env is not git-ignored");
assert(!fs.existsSync(path.join(root, ".env")), "A real .env file is present — never commit or ship it");
assert(fs.existsSync(path.join(root, ".env.example")), ".env.example template missing");
for (const line of read(".env.example").split(/\r?\n/)) {
  if (!line.trim() || line.trim().startsWith("#")) continue;
  assert(/^[A-Z0-9_]+=$/.test(line.trim()), `.env.example must ship empty values only: ${line}`);
}
const pkg = JSON.parse(read("package.json"));
assert(pkg.scripts && pkg.scripts.start === "node server.mjs", "package.json start script missing — Railway needs it");
assert(/api\/console\/verify/.test(dashboard) && /detectServerAuth/.test(dashboard), "Console server sign-in integration missing");
assert(/api\/console\/reset\/confirm/.test(dashboard) && /Nothing on the site was changed/.test(dashboard), "Non-destructive email reset flow missing from the console");
assert(sandbox.window.BNDR_CONTENT.owner.passHash === null || sandbox.window.BNDR_CONTENT.owner.passHash === undefined, "content.js ships a legacy unsalted passphrase hash — remove it; use the salted record or OWNER_PASS_KDF on the server");
const shippedKdf = sandbox.window.BNDR_CONTENT.owner.passKdf;
assert(!shippedKdf || Number(shippedKdf.iterations) >= 600000, "content.js ships a weak passphrase record (under 600k PBKDF2 rounds)");
const secretScanFiles = [...publicPages, "dashboard.html", "README.md", "CHANGELOG.md", "server.mjs", "package.json",
  "js/content.js", "js/dashboard.js", "js/site.js", "js/md.js", "js/facts.js"]; // this file holds the patterns themselves
const secretPattern = /(sk_live_|sk_test_|AKIA[0-9A-Z]{16}|ghp_[A-Za-z0-9]{20,}|xox[baprs]-|re_[A-Za-z0-9]{16,}|-----BEGIN [A-Z ]*PRIVATE KEY-----|(?:password|passphrase|secret|api_?key)\s*[:=]\s*["'][^"'\n]{8,}["'])/i;
for (const file of secretScanFiles) {
  const hit = read(file).match(secretPattern);
  assert(!hit, `${file}: possible exposed secret — ${hit && hit[0].slice(0, 40)}`);
}

if (failures.length) {
  console.error(`FAIL: ${failures.length} issue(s), ${passed} checks passed`);
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}
console.log(`PASS: ${passed} source, structure, security, and linkage checks`);
