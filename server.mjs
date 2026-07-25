// BNDR hardened static server — zero dependencies, built for Railway (or any Node host).
//
// What this adds on top of the plain static site:
//   1. Credentials live in environment variables (or a git-ignored .env file),
//      never in the repo and never inside content.js served to browsers.
//   2. Passphrase verification happens on the server (rate limited, constant
//      time), so no verification record is shipped for offline brute force.
//   3. A non-destructive owner reset: a one-time code is emailed to the owner
//      address; pages, drafts, signing keys, and issued links are untouched.
//   4. Security headers on every response.
//
// The site itself is unchanged: if these variables are absent, dashboard.js
// falls back to the original static gate automatically.
//
// Environment variables (see .env.example):
//   PORT             — provided by Railway automatically.
//   OWNER_PASS_KDF   — JSON PBKDF2 record from Settings → Owner passphrase.
//   OWNER_EMAIL      — where one-time reset codes are sent.
//   RESEND_API_KEY   — optional; uses api.resend.com for reset email.
//   RESET_EMAIL_FROM — optional Resend sender, e.g. "BNDR <console@yourdomain>".
//   SESSION_SECRET   — optional; random per boot when unset.

import crypto from "node:crypto";
import fs from "node:fs";
import http from "node:http";
import path from "node:path";

const ROOT = path.dirname(new URL(import.meta.url).pathname);

// ── .env loader (local development convenience; Railway injects real env) ──
function loadDotEnv() {
  const file = path.join(ROOT, ".env");
  if (!fs.existsSync(file)) return;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/);
    if (!match || line.trim().startsWith("#")) continue;
    const value = match[2].replace(/^"(.*)"$/, "$1").replace(/^'(.*)'$/, "$1");
    if (process.env[match[1]] === undefined) process.env[match[1]] = value;
  }
}
loadDotEnv();

const PORT = Number(process.env.PORT) || 3000;
const OWNER_EMAIL = String(process.env.OWNER_EMAIL || "").trim();
const RESEND_API_KEY = String(process.env.RESEND_API_KEY || "").trim();
const RESET_EMAIL_FROM = String(process.env.RESET_EMAIL_FROM || "BNDR Console <onboarding@resend.dev>").trim();
const SESSION_SECRET = process.env.SESSION_SECRET || crypto.randomBytes(32).toString("hex");

function parseKdfRecord(raw) {
  try {
    const record = JSON.parse(raw);
    if (
      record && record.algorithm === "PBKDF2-SHA256" &&
      typeof record.salt === "string" && typeof record.hash === "string" &&
      Number(record.iterations) >= 100000
    ) return record;
  } catch (error) { /* reported below */ }
  return null;
}
const OWNER_KDF = parseKdfRecord(process.env.OWNER_PASS_KDF || "");
if (process.env.OWNER_PASS_KDF && !OWNER_KDF) {
  console.error("OWNER_PASS_KDF is set but not a valid PBKDF2 record — falling back to the static gate.");
}

// ── KDF verification, byte-identical to the browser implementation ──
function b64uToBuffer(value) {
  let s = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
  while (s.length % 4) s += "=";
  return Buffer.from(s, "base64");
}
function bufferToB64u(buffer) {
  return buffer.toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}
function verifyPassphrase(passphrase) {
  return new Promise((resolve) => {
    if (!OWNER_KDF || typeof passphrase !== "string" || !passphrase || passphrase.length > 256) return resolve(false);
    crypto.pbkdf2(passphrase, b64uToBuffer(OWNER_KDF.salt), Number(OWNER_KDF.iterations), 32, "sha256", (error, derived) => {
      if (error) return resolve(false);
      const expected = b64uToBuffer(OWNER_KDF.hash);
      resolve(expected.length === derived.length && crypto.timingSafeEqual(derived, expected));
    });
  });
}

// ── in-memory rate limiting (per IP; resets on redeploy, which is fine) ──
const buckets = new Map();
function limited(kind, ip, max, windowMs) {
  const now = Date.now();
  const key = `${kind}:${ip}`;
  const hits = (buckets.get(key) || []).filter((t) => now - t < windowMs);
  if (hits.length >= max) { buckets.set(key, hits); return true; }
  hits.push(now);
  buckets.set(key, hits);
  if (buckets.size > 5000) buckets.clear();
  return false;
}

// ── one-time reset codes (single use, 10-minute expiry) ──
let resetCode = null; // { hash, expires }
function issueResetCode() {
  const code = String(crypto.randomInt(10000000, 100000000)); // 8 digits
  resetCode = { hash: crypto.createHmac("sha256", SESSION_SECRET).update(code).digest(), expires: Date.now() + 10 * 60 * 1000 };
  return code;
}
function consumeResetCode(code) {
  if (!resetCode || Date.now() > resetCode.expires) { resetCode = null; return false; }
  const candidate = crypto.createHmac("sha256", SESSION_SECRET).update(String(code || "").trim()).digest();
  const okay = candidate.length === resetCode.hash.length && crypto.timingSafeEqual(candidate, resetCode.hash);
  if (okay) resetCode = null; // single use
  return okay;
}

async function sendResetEmail(code) {
  const subject = "BNDR Owner Console — one-time reset code";
  const text =
    `Your one-time reset code is: ${code}\n\n` +
    "It expires in 10 minutes and works once. Entering it opens the console " +
    "without changing anything on the site; set a new passphrase in Settings right away.\n\n" +
    "If you did not request this, you can ignore it — the passphrase was not changed.";
  if (RESEND_API_KEY) {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${RESEND_API_KEY}` },
      body: JSON.stringify({ from: RESET_EMAIL_FROM, to: [OWNER_EMAIL], subject, text })
    });
    if (!response.ok) throw new Error(`Email provider responded ${response.status}`);
    return;
  }
  // Keyless fallback: FormSubmit, the relay the estimate form already uses.
  // The owner address must have been activated with FormSubmit once.
  const response = await fetch("https://formsubmit.co/ajax/" + encodeURIComponent(OWNER_EMAIL), {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ _subject: subject, message: text })
  });
  if (!response.ok) throw new Error(`Email relay responded ${response.status}`);
}

// ── tiny http helpers ──
function clientIp(req) {
  const forwarded = String(req.headers["x-forwarded-for"] || "").split(",")[0].trim();
  return forwarded || req.socket.remoteAddress || "unknown";
}
function sendJson(res, status, body) {
  const payload = JSON.stringify(body);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" });
  res.end(payload);
}
function readJsonBody(req) {
  return new Promise((resolve) => {
    let raw = "";
    req.on("data", (chunk) => {
      raw += chunk;
      if (raw.length > 4096) { resolve(null); req.destroy(); }
    });
    req.on("end", () => {
      try { resolve(JSON.parse(raw || "{}")); } catch (error) { resolve(null); }
    });
    req.on("error", () => resolve(null));
  });
}

const MIME = {
  ".html": "text/html; charset=utf-8", ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8", ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json", ".png": "image/png", ".jpg": "image/jpeg", ".jpeg": "image/jpeg",
  ".webp": "image/webp", ".svg": "image/svg+xml", ".ico": "image/x-icon", ".txt": "text/plain; charset=utf-8",
  ".xml": "application/xml", ".woff": "font/woff", ".woff2": "font/woff2", ".pdf": "application/pdf"
};
const BLOCKED_FILES = new Set([".env", ".env.example", "server.mjs", "package.json", "Procfile", ".gitignore"]);

async function handleApi(req, res, pathname) {
  const ip = clientIp(req);
  if (pathname === "/api/console/config" && req.method === "GET") {
    return sendJson(res, 200, { serverAuth: !!OWNER_KDF, resetEmail: !!(OWNER_KDF && OWNER_EMAIL) });
  }
  if (req.method !== "POST") return sendJson(res, 405, { ok: false, error: "Method not allowed." });
  if (!OWNER_KDF) return sendJson(res, 404, { ok: false, error: "Server sign-in is not configured." });
  const body = await readJsonBody(req);
  if (pathname === "/api/console/verify") {
    if (limited("verify", ip, 8, 15 * 60 * 1000)) return sendJson(res, 429, { ok: false, error: "Too many attempts — wait a few minutes." });
    const okay = await verifyPassphrase(body && body.passphrase);
    return sendJson(res, okay ? 200 : 401, okay ? { ok: true } : { ok: false, error: "Not it." });
  }
  if (pathname === "/api/console/reset") {
    if (!OWNER_EMAIL) return sendJson(res, 400, { ok: false, error: "OWNER_EMAIL is not configured on the server." });
    if (limited("reset", ip, 3, 60 * 60 * 1000)) return sendJson(res, 429, { ok: false, error: "Too many reset requests — try again later." });
    try {
      await sendResetEmail(issueResetCode());
      return sendJson(res, 200, { ok: true });
    } catch (error) {
      resetCode = null;
      console.error("Reset email failed:", error.message);
      return sendJson(res, 502, { ok: false, error: "The reset email could not be sent — check the email settings on the server." });
    }
  }
  if (pathname === "/api/console/reset/confirm") {
    if (limited("confirm", ip, 8, 15 * 60 * 1000)) return sendJson(res, 429, { ok: false, error: "Too many attempts — wait a few minutes." });
    const okay = consumeResetCode(body && body.code);
    return sendJson(res, okay ? 200 : 401, okay ? { ok: true } : { ok: false, error: "That code is wrong, expired, or already used." });
  }
  return sendJson(res, 404, { ok: false, error: "Unknown endpoint." });
}

function serveStatic(req, res, pathname) {
  let clean = decodeURIComponent(pathname);
  if (clean === "/") clean = "/index.html";
  const file = path.normalize(path.join(ROOT, clean));
  const name = path.basename(file);
  if (!file.startsWith(ROOT) || name.startsWith(".") || BLOCKED_FILES.has(name) || file.includes(`${path.sep}tests${path.sep}`)) {
    res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end("Not found");
  }
  fs.stat(file, (error, stat) => {
    if (error || !stat.isFile()) {
      const notFound = path.join(ROOT, "404.html");
      res.writeHead(404, { "Content-Type": "text/html; charset=utf-8" });
      return fs.existsSync(notFound) ? fs.createReadStream(notFound).pipe(res) : res.end("Not found");
    }
    const type = MIME[path.extname(file).toLowerCase()] || "application/octet-stream";
    const cache = /\.(?:png|jpe?g|webp|ico|woff2?)$/i.test(file) ? "public, max-age=86400" : "no-cache";
    res.writeHead(200, { "Content-Type": type, "Content-Length": stat.size, "Cache-Control": cache });
    if (req.method === "HEAD") return res.end();
    fs.createReadStream(file).pipe(res);
  });
}

const server = http.createServer((req, res) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("X-Frame-Options", "SAMEORIGIN");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.setHeader("Strict-Transport-Security", "max-age=31536000");
  let pathname = "/";
  try { pathname = new URL(req.url, "http://localhost").pathname; } catch (error) { /* keep "/" */ }
  if (pathname.startsWith("/api/")) {
    handleApi(req, res, pathname).catch(() => sendJson(res, 500, { ok: false, error: "Server error." }));
    return;
  }
  if (req.method !== "GET" && req.method !== "HEAD") {
    res.writeHead(405, { "Content-Type": "text/plain; charset=utf-8" });
    return res.end("Method not allowed");
  }
  serveStatic(req, res, pathname);
});

server.listen(PORT, () => {
  console.log(`BNDR site listening on :${PORT}`);
  console.log(`Owner console sign-in: ${OWNER_KDF ? "server-verified (OWNER_PASS_KDF)" : "static gate (no OWNER_PASS_KDF set)"}`);
  console.log(`Reset email: ${OWNER_KDF && OWNER_EMAIL ? OWNER_EMAIL + (RESEND_API_KEY ? " via Resend" : " via FormSubmit") : "not configured"}`);
});

export { parseKdfRecord, verifyPassphrase }; // exercised by tests/source-audit.mjs
