// BNDR owner console — gate, editors, live preview, publish pipeline.
// Draft lives in localStorage (bndr.draft.v3). Publish exports content.js.
(function () {
  "use strict";

  var MD = window.BNDRMD;
  var FACTS = window.BNDRFACTS;
  var SHIP = window.BNDR_CONTENT || {};
  var DRAFT_KEY = "bndr.draft.v3";
  var AUTH_KEY = "bndr.auth.v3";
  var OPERATOR_AUTH_KEY = "bndr.operator.auth.v1";
  var SIGNING_KEY = "bndr.operator.signing.v1";
  var ISSUED_LINKS_KEY = "bndr.operator.issued.v2";
  var OPERATOR_GRACE_SECONDS = 600;
  var OPERATOR_DURATIONS = [4 * 3600, 8 * 3600, 16 * 3600, 24 * 3600];
  var CURRENT_ROLE = "owner";
  var CURRENT_SCOPES = [];
  var CURRENT_OPERATOR = null;
  var OPERATOR_BASELINE = null;
  var OPERATOR_EXPIRY_TIMER = 0;
  var OPERATOR_REVOCATION_TIMER = 0;
  var SCOPE_DEFS = [
    { id: "copy", label: "Site copy" },
    { id: "builder", label: "Builder page" },
    { id: "blog", label: "Blog" },
    { id: "galleries", label: "Galleries" },
    { id: "footer", label: "Footer" },
    { id: "intake", label: "Intake" },
    { id: "analytics", label: "Analytics" },
    { id: "seo", label: "SEO" },
    { id: "settings", label: "Site settings" }
  ];
  var FOOTER_DEFAULTS = [
    { id: "linkedin", label: "LinkedIn", enabled: true, url: "https://www.linkedin.com/in/bndrtech/" },
    { id: "github", label: "GitHub", enabled: true, url: "https://github.com/bndrbots" },
    { id: "instagram", label: "Instagram", enabled: true, url: "https://www.instagram.com/bndrllc" },
    { id: "facebook", label: "Facebook", enabled: true, url: "https://www.facebook.com/BNDRLLC" },
    { id: "substack", label: "Substack", enabled: true, url: "https://substack.com/@bndrllc" },
    { id: "buymeacoffee", label: "Buy Me a Coffee", enabled: true, url: "https://buymeacoffee.com/bndr" },
    { id: "gumroad", label: "Gumroad", enabled: true, url: "https://bndrllc.gumroad.com" },
    { id: "promptbase", label: "PromptBase", enabled: true, url: "https://promptbase.com/profile/bndrllc" },
    { id: "x", label: "X / Twitter", enabled: false, url: "" },
    { id: "youtube", label: "YouTube", enabled: false, url: "" },
    { id: "tiktok", label: "TikTok", enabled: false, url: "" },
    { id: "discord", label: "Discord", enabled: false, url: "" },
    { id: "etsy", label: "Etsy", enabled: false, url: "" },
    { id: "patreon", label: "Patreon", enabled: false, url: "" },
    { id: "threads", label: "Threads", enabled: false, url: "" },
    { id: "dribbble", label: "Dribbble", enabled: false, url: "" }
  ];

  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  // ── sha256: WebCrypto when available, pure-JS fallback for file:// ──
  function sha256(str) {
    if (window.crypto && crypto.subtle && crypto.subtle.digest) {
      return crypto.subtle.digest("SHA-256", new TextEncoder().encode(str)).then(function (buf) {
        return Array.prototype.map.call(new Uint8Array(buf), function (b) {
          return ("0" + b.toString(16)).slice(-2);
        }).join("");
      }).catch(function () { return sha256js(str); });
    }
    return Promise.resolve(sha256js(str));
  }
  function sha256js(ascii) {
    function rr(v, a) { return (v >>> a) | (v << (32 - a)); }
    var mathPow = Math.pow, maxWord = mathPow(2, 32), result = "";
    var words = [], asciiBitLength = ascii.length * 8;
    var hash = sha256js.h = sha256js.h || [];
    var k = sha256js.k = sha256js.k || [];
    var primeCounter = k.length;
    var isComposite = {};
    for (var candidate = 2; primeCounter < 64; candidate++) {
      if (!isComposite[candidate]) {
        for (var i2 = 0; i2 < 313; i2 += candidate) isComposite[i2] = candidate;
        hash[primeCounter] = (mathPow(candidate, 0.5) * maxWord) | 0;
        k[primeCounter++] = (mathPow(candidate, 1 / 3) * maxWord) | 0;
      }
    }
    ascii += "\x80";
    while ((ascii.length % 64) - 56) ascii += "\x00";
    for (var i = 0; i < ascii.length; i++) {
      var j = ascii.charCodeAt(i);
      if (j >> 8) return "";
      words[i >> 2] |= j << (((3 - i) % 4) * 8);
    }
    words[words.length] = (asciiBitLength / maxWord) | 0;
    words[words.length] = asciiBitLength;
    for (var jj = 0; jj < words.length;) {
      var w = words.slice(jj, (jj += 16));
      var oldHash = hash.slice(0, 8);
      for (var ii = 0; ii < 64; ii++) {
        var w15 = w[ii - 15], w2 = w[ii - 2];
        var a = hash[0], e = hash[4];
        var temp1 = hash[7] +
          (rr(e, 6) ^ rr(e, 11) ^ rr(e, 25)) +
          ((e & hash[5]) ^ (~e & hash[6])) + k[ii] +
          (w[ii] = ii < 16 ? w[ii] : (w[ii - 16] +
            (rr(w15, 7) ^ rr(w15, 18) ^ (w15 >>> 3)) + w[ii - 7] +
            (rr(w2, 17) ^ rr(w2, 19) ^ (w2 >>> 10))) | 0);
        var temp2 = (rr(a, 2) ^ rr(a, 13) ^ rr(a, 22)) +
          ((a & hash[1]) ^ (a & hash[2]) ^ (hash[1] & hash[2]));
        hash = [(temp1 + temp2) | 0].concat(hash);
        hash[4] = (hash[4] + temp1) | 0;
      }
      for (var iii = 0; iii < 8; iii++) hash[iii] = (hash[iii] + oldHash[iii]) | 0;
    }
    for (var iv = 0; iv < 8; iv++) {
      for (var jv = 3; jv + 1; jv--) {
        var b2 = (hash[iv] >> (jv * 8)) & 255;
        result += (b2 < 16 ? 0 : "") + b2.toString(16);
      }
    }
    return result;
  }

  /* New owner passphrases use a salted, deliberately expensive derivation.
     The legacy SHA-256 verifier remains read-only for older content.js files;
     the next passphrase change migrates the owner record automatically. */
  function pbkdf2Hash(passphrase, salt, iterations) {
    if (!(window.crypto && crypto.subtle && window.TextEncoder)) return Promise.reject(new Error("Secure passphrase derivation needs a modern browser."));
    return crypto.subtle.importKey("raw", new TextEncoder().encode(passphrase), "PBKDF2", false, ["deriveBits"])
      .then(function (key) {
        return crypto.subtle.deriveBits({ name: "PBKDF2", salt: b64uToBytes(salt), iterations: iterations, hash: "SHA-256" }, key, 256);
      }).then(bytesToB64u);
  }
  function newPassphraseRecord(passphrase) {
    var salt = new Uint8Array(16);
    crypto.getRandomValues(salt);
    var record = { algorithm: "PBKDF2-SHA256", iterations: 600000, salt: bytesToB64u(salt), hash: "" };
    return pbkdf2Hash(passphrase, record.salt, record.iterations).then(function (hash) { record.hash = hash; return record; });
  }
  function verifyOwnerPassphrase(passphrase) {
    var owner = W.owner || SHIP.owner || {};
    var record = owner.passKdf;
    if (record && record.algorithm === "PBKDF2-SHA256" && record.salt && record.hash && Number(record.iterations) >= 100000) {
      return pbkdf2Hash(passphrase, record.salt, Number(record.iterations)).then(function (hash) { return hash === record.hash; });
    }
    return sha256(passphrase).then(function (hash) { return hash === owner.passHash; });
  }

  // ── signed temporary operator access (ECDSA P-256, native WebCrypto) ──
  function bytesToB64u(value) {
    var bytes = value instanceof Uint8Array ? value : new Uint8Array(value);
    var binary = "";
    for (var i = 0; i < bytes.length; i += 0x8000) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + 0x8000));
    }
    return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }
  function b64uToBytes(value) {
    var s = String(value || "").replace(/-/g, "+").replace(/_/g, "/");
    while (s.length % 4) s += "=";
    var binary = atob(s), out = new Uint8Array(binary.length);
    for (var i = 0; i < binary.length; i++) out[i] = binary.charCodeAt(i);
    return out;
  }
  function jsonToB64u(value) { return bytesToB64u(new TextEncoder().encode(JSON.stringify(value))); }
  function b64uToJson(value) { return JSON.parse(new TextDecoder().decode(b64uToBytes(value))); }
  function cryptoReady() { return !!(window.crypto && crypto.subtle && window.TextEncoder && window.TextDecoder); }
  function normalizeOperatorCode(value) {
    var raw = String(value || "").trim();
    if (!raw) return "";
    if (raw.indexOf("#") > -1 || /^https?:/i.test(raw)) {
      try {
        var url = new URL(raw, location.href);
        raw = new URLSearchParams(url.hash.replace(/^#/, "")).get("access") || raw;
      } catch (e) { /* use pasted text as-is */ }
    }
    return raw.replace(/^access=/, "").trim();
  }
  function validScopes(scopes) {
    var allowed = SCOPE_DEFS.map(function (s) { return s.id; });
    return (Array.isArray(scopes) ? scopes : []).filter(function (s, i, all) {
      return allowed.indexOf(s) > -1 && all.indexOf(s) === i;
    });
  }
  function revokedNonces(source) {
    var values = source && source.owner && source.owner.operatorRevokedNonces;
    return Array.isArray(values) ? values.filter(function (x) { return typeof x === "string" && /^[A-Za-z0-9_-]{12,64}$/.test(x); }) : [];
  }
  function durationIsAllowed(payload) {
    if (!payload || !payload.iat || !payload.exp) return false;
    return OPERATOR_DURATIONS.indexOf(payload.exp - payload.iat) > -1;
  }
  function verifyOperatorCode(value) {
    if (!cryptoReady()) return Promise.reject(new Error("Secure temporary access needs a modern HTTPS browser."));
    var token = normalizeOperatorCode(value);
    var parts = token.split(".");
    if (parts.length !== 3 || parts[0] !== "v1") return Promise.reject(new Error("That access code is not valid."));
    var payload;
    try { payload = b64uToJson(parts[1]); } catch (e) { return Promise.reject(new Error("That access code is not valid.")); }
    var publicJwk = SHIP.owner && SHIP.owner.operatorPublicKey;
    if (!publicJwk) return Promise.reject(new Error("Temporary access has not been activated on this deployment."));
    return crypto.subtle.importKey("jwk", publicJwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["verify"])
      .then(function (key) {
        return crypto.subtle.verify({ name: "ECDSA", hash: "SHA-256" }, key, b64uToBytes(parts[2]), new TextEncoder().encode(parts[1]));
      }).then(function (ok) {
        if (!ok) throw new Error("That access code is not valid.");
        var now = Math.floor(Date.now() / 1000);
        if (!payload || payload.v !== 1 || !durationIsAllowed(payload)) throw new Error("That access code has an invalid time scope.");
        if (payload.iat > now + 120 || payload.exp + OPERATOR_GRACE_SECONDS <= now) throw new Error("That access code has expired.");
        if (payload.exp > now + 24 * 3600 + 120) throw new Error("That access code has an invalid expiry.");
        if (!payload.nonce || revokedNonces(SHIP).indexOf(payload.nonce) > -1) throw new Error("That access code has been cancelled.");
        payload.scopes = validScopes(payload.scopes);
        if (!payload.scopes.length) throw new Error("That access code has no assigned work areas.");
        return { token: token, payload: payload };
      });
  }
  function createOperatorCode(privateJwk, scopes, seconds) {
    if (!cryptoReady()) return Promise.reject(new Error("Secure temporary access needs a modern HTTPS browser."));
    if (OPERATOR_DURATIONS.indexOf(seconds) === -1) return Promise.reject(new Error("Choose a supported 4, 8, 16, or 24-hour limit."));
    var nonce = new Uint8Array(12);
    crypto.getRandomValues(nonce);
    var issuedAt = Math.floor(Date.now() / 1000);
    var payload = {
      v: 1,
      iat: issuedAt,
      exp: issuedAt + seconds,
      scopes: validScopes(scopes),
      nonce: bytesToB64u(nonce)
    };
    if (!payload.scopes.length) return Promise.reject(new Error("Select at least one work area."));
    var encoded = jsonToB64u(payload);
    return crypto.subtle.importKey("jwk", privateJwk, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"])
      .then(function (key) { return crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, key, new TextEncoder().encode(encoded)); })
      .then(function (sig) { return { token: "v1." + encoded + "." + bytesToB64u(sig), payload: payload }; });
  }
  function getSigningKey() {
    try { return JSON.parse(localStorage.getItem(SIGNING_KEY) || "null"); } catch (e) { return null; }
  }
  function publicKeysMatch(a, b) {
    return !!(a && b && a.kty === b.kty && a.crv === b.crv && a.x === b.x && a.y === b.y);
  }

  // ── working copy ──
  var W;
  try {
    var saved = localStorage.getItem(DRAFT_KEY);
    W = saved ? JSON.parse(saved) : clone(SHIP);
  } catch (e) { W = clone(SHIP); }

  function get(path) {
    var cur = W, parts = path.split(".");
    for (var i = 0; i < parts.length; i++) { if (cur == null) return undefined; cur = cur[parts[i]]; }
    return cur;
  }
  function set(path, value) {
    var cur = W, parts = path.split(".");
    for (var i = 0; i < parts.length - 1; i++) {
      if (cur[parts[i]] == null) cur[parts[i]] = {};
      cur = cur[parts[i]];
    }
    cur[parts[parts.length - 1]] = value;
  }

  var ROOT_SCOPE = {
    hero: "copy", home: "copy", pricing: "copy", faq: "copy",
    builder: "builder", blog: "blog",
    photos: "galleries", apps: "galleries", sites: "galleries", templates: "galleries",
    footer: "footer", intake: "intake", analytics: "analytics", seo: "seo",
    meta: "settings", nav: "settings"
  };
  function enforceScopeBoundary() {
    if (CURRENT_ROLE !== "operator" || !OPERATOR_BASELINE) return;
    Object.keys(ROOT_SCOPE).forEach(function (root) {
      if (CURRENT_SCOPES.indexOf(ROOT_SCOPE[root]) > -1) return;
      if (OPERATOR_BASELINE[root] === undefined) delete W[root];
      else W[root] = clone(OPERATOR_BASELINE[root]);
    });
    /* Credential and revocation state is owner-only regardless of scopes. */
    W.owner = clone(OPERATOR_BASELINE.owner || SHIP.owner || {});
  }
  function operatorIsActive() {
    return CURRENT_ROLE !== "operator" || (CURRENT_OPERATOR && Math.floor(Date.now() / 1000) < CURRENT_OPERATOR.exp + OPERATOR_GRACE_SECONDS);
  }
  function endOperatorSession() {
    try { sessionStorage.removeItem(OPERATOR_AUTH_KEY); } catch (e) {}
    clearTimeout(OPERATOR_EXPIRY_TIMER);
    clearInterval(OPERATOR_REVOCATION_TIMER);
    location.replace(location.pathname + location.search);
  }
  function scheduleOperatorExpiry() {
    if (CURRENT_ROLE !== "operator" || !CURRENT_OPERATOR) return;
    clearTimeout(OPERATOR_EXPIRY_TIMER);
    var delay = Math.max(0, (CURRENT_OPERATOR.exp + OPERATOR_GRACE_SECONDS) * 1000 - Date.now());
    OPERATOR_EXPIRY_TIMER = setTimeout(endOperatorSession, Math.min(delay, 2147480000));
  }
  function pollOperatorRevocation() {
    if (CURRENT_ROLE !== "operator" || !CURRENT_OPERATOR || document.hidden) return;
    fetch("js/content.js?operator-check=" + Date.now(), { cache: "no-store", credentials: "same-origin" })
      .then(function (response) { if (!response.ok) throw new Error("unavailable"); return response.text(); })
      .then(function (source) {
        var revokedMatch = source.match(/["']?operatorRevokedNonces["']?\s*:\s*(\[[^\]]*\])/);
        if (revokedMatch) {
          try { if (JSON.parse(revokedMatch[1]).indexOf(CURRENT_OPERATOR.nonce) > -1) { endOperatorSession(); return; } } catch (e) {}
        }
        var keyMatch = source.match(/["']?operatorPublicKey["']?\s*:\s*(null|\{[^}]*\})/);
        if (keyMatch) {
          try {
            var liveKey = keyMatch[1] === "null" ? null : JSON.parse(keyMatch[1]);
            if (!publicKeysMatch(liveKey, SHIP.owner && SHIP.owner.operatorPublicKey)) endOperatorSession();
          } catch (e2) { /* a hand-formatted file is checked again next cycle */ }
        }
      }).catch(function () { /* offline/local preview: signed expiry still enforces */ });
  }
  function startOperatorEnforcement() {
    scheduleOperatorExpiry();
    pollOperatorRevocation();
    clearInterval(OPERATOR_REVOCATION_TIMER);
    OPERATOR_REVOCATION_TIMER = setInterval(pollOperatorRevocation, 60000);
    document.addEventListener("visibilitychange", function () {
      if (!operatorIsActive()) endOperatorSession();
      else if (!document.hidden) pollOperatorRevocation();
    });
  }

  function issuedLinks() {
    try {
      var data = JSON.parse(localStorage.getItem(ISSUED_LINKS_KEY) || "[]");
      return Array.isArray(data) ? data : [];
    } catch (e) { return []; }
  }
  function saveIssuedLinks(list) {
    try { localStorage.setItem(ISSUED_LINKS_KEY, JSON.stringify(list.slice(-80))); } catch (e) {}
  }

  // ── toast ──
  var toastTimer = null;
  function toast(msg) {
    var t = $("#toast");
    t.textContent = msg;
    t.classList.add("show");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove("show"); }, 2200);
  }

  // ── save / autosave ──
  function saveDraft(quiet) {
    if (!operatorIsActive()) { endOperatorSession(); return false; }
    enforceScopeBoundary();
    try {
      localStorage.setItem(DRAFT_KEY, JSON.stringify(W));
      if (!quiet) toast("Draft saved — preview updated");
      refreshPreview();
      return true;
    } catch (e) { toast("Could not save draft (storage blocked)"); }
    return false;
  }
  var saveTimer = null;
  function queueSave() {
    if (!operatorIsActive()) { endOperatorSession(); return; }
    clearTimeout(saveTimer);
    saveTimer = setTimeout(function () { saveDraft(true); }, 700);
  }

  // ── preview pane ──
  var ROUTES = [
    { label: "Home", file: "index.html" },
    { label: "Sites", file: "sites.html" },
    { label: "Apps", file: "apps.html" },
    { label: "Photos", file: "photos.html" },
    { label: "Blog", file: "blog.html" },
    { label: "Post (first)", file: "post" },
    { label: "Builder", file: "builder.html" },
    { label: "Templates", file: "templates.html" },
    { label: "Estimate", file: "estimate.html" },
    { label: "Privacy", file: "privacy.html" },
    { label: "Terms", file: "terms.html" }
  ];
  function previewUrl() {
    var sel = $("#pv-route");
    var file = sel ? sel.value : "index.html";
    if (file === "post") {
      var posts = get("blog.posts") || [];
      var slug = posts.length ? posts[0].slug : "";
      return "post.html?p=" + encodeURIComponent(slug) + "&draft=1&_ts=" + Date.now();
    }
    return file + "?draft=1&_ts=" + Date.now();
  }
  function refreshPreview() {
    var f = $("#pv-frame");
    if (f) f.src = previewUrl();
  }
  function wirePreview() {
    var sel = $("#pv-route");
    ROUTES.forEach(function (r) {
      var o = el("option", null, r.label);
      o.value = r.file;
      sel.appendChild(o);
    });
    sel.addEventListener("change", refreshPreview);
    $("#pv-reload").addEventListener("click", refreshPreview);
    $$(".pv-size button").forEach(function (b) {
      b.addEventListener("click", function () {
        $$(".pv-size button").forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on");
        $("#pv-stage").classList.toggle("narrow", b.getAttribute("data-w") === "390");
      });
    });
    $("#pv-toggle").addEventListener("click", function () {
      $("#dash-preview").classList.toggle("mobile-show");
    });
    refreshPreview();
  }

  // ── field builders ──
  function textField(label, path, opts) {
    opts = opts || {};
    var f = el("div", "field");
    f.innerHTML = "<label>" + MD.esc(label) + "</label>";
    var input = el(opts.textarea ? "textarea" : "input");
    if (!opts.textarea) input.type = "text";
    input.value = get(path) == null ? "" : String(get(path));
    input.addEventListener("input", function () {
      set(path, input.value);
      queueSave();
      if (opts.onInput) opts.onInput(input.value);
    });
    f.appendChild(input);
    return f;
  }
  function mdField(label, path, opts) {
    opts = opts || {};
    var f = el("div", "field");
    f.innerHTML = "<label>" + MD.esc(label) + ' <span class="md-badge">MD</span></label>';
    var split = el("div", "md-split");
    var ta = el("textarea");
    if (opts.tall) ta.className = "tall";
    ta.value = get(path) == null ? "" : String(get(path));
    var pv = el("div", "md-preview");
    function paintPv() {
      pv.innerHTML = '<div class="prose">' + MD.render(ta.value) + "</div>";
      if (MD.mathUpgrade) MD.mathUpgrade(pv);
    }
    paintPv();
    ta.addEventListener("input", function () {
      set(path, ta.value);
      paintPv();
      queueSave();
      if (opts.onInput) opts.onInput(ta.value);
    });
    split.appendChild(ta);
    split.appendChild(pv);
    f.appendChild(split);
    return f;
  }
  function linesField(label, path) {
    var f = el("div", "field");
    f.innerHTML = "<label>" + MD.esc(label) + " (one per line)</label>";
    var ta = el("textarea");
    ta.value = (get(path) || []).join("\n");
    ta.addEventListener("input", function () {
      set(path, ta.value.split("\n").map(function (s) { return s.trim(); }).filter(Boolean));
      queueSave();
    });
    f.appendChild(ta);
    return f;
  }
  function selectField(label, path, options) {
    var f = el("div", "field");
    f.innerHTML = "<label>" + MD.esc(label) + "</label>";
    var sel = el("select");
    options.forEach(function (o) {
      var op = el("option", null, MD.esc(o));
      op.value = o;
      sel.appendChild(op);
    });
    sel.value = get(path) || options[0];
    sel.addEventListener("change", function () { set(path, sel.value); queueSave(); });
    f.appendChild(sel);
    return f;
  }

  // ── generic list editor ──
  // spec: { path, label, itemLabel(item), blank(), fields(item, idx, card) -> [nodes] }
  function listEditor(spec) {
    var wrap = el("div", "item-list");
    function redraw() {
      wrap.innerHTML = "";
      var arr = get(spec.path) || [];
      arr.forEach(function (item, idx) {
        var card = el("details", "item-card");
        var sum = el("summary");
        sum.innerHTML = '<span class="mini">' + (idx + 1) + '</span><span class="grow"></span>';
        var grow = $(".grow", sum);
        grow.textContent = spec.itemLabel(item) || "(untitled)";
        var del = el("button", "row-del", "REMOVE");
        del.addEventListener("click", function (e) {
          e.preventDefault();
          arr.splice(idx, 1);
          set(spec.path, arr);
          queueSave();
          redraw();
        });
        sum.appendChild(del);
        card.appendChild(sum);
        var fields = el("div", "item-fields");
        spec.fields(item, idx, {
          syncLabel: function () { grow.textContent = spec.itemLabel(item) || "(untitled)"; }
        }).forEach(function (n) { fields.appendChild(n); });
        card.appendChild(fields);
        wrap.appendChild(card);
      });
      var add = el("button", "dash-btn", "+ Add");
      add.addEventListener("click", function () {
        arr.push(spec.blank());
        set(spec.path, arr);
        queueSave();
        redraw();
        var cards = $$(".item-card", wrap);
        if (cards.length) cards[cards.length - 1].open = true;
      });
      wrap.appendChild(add);
    }
    redraw();
    return wrap;
  }

  // item field helper bound to an object property (not a W path)
  function objField(obj, key, label, opts) {
    opts = opts || {};
    var f = el("div", "field");
    f.innerHTML = "<label>" + MD.esc(label) + (opts.md ? ' <span class="md-badge">MD</span>' : "") + "</label>";
    var input;
    if (opts.md) {
      var split = el("div", "md-split");
      input = el("textarea");
      if (opts.tall) input.className = "tall";
      input.value = obj[key] == null ? "" : String(obj[key]);
      var pv = el("div", "md-preview");
      function paintPv() {
        pv.innerHTML = '<div class="prose">' + MD.render(input.value) + "</div>";
        if (MD.mathUpgrade) MD.mathUpgrade(pv);
      }
      paintPv();
      input.addEventListener("input", function () {
        obj[key] = input.value;
        paintPv();
        queueSave();
        if (opts.onInput) opts.onInput(input.value);
      });
      split.appendChild(input);
      split.appendChild(pv);
      f.appendChild(split);
      if (opts.insertImage) {
        var tools = el("div", "dash-actions");
        var insBtn = el("button", "dash-btn", "Insert image…");
        insBtn.type = "button";
        insBtn.addEventListener("click", function () {
          pickImage(function (dataUrl, name) {
            var mdImg = "\n\n![" + (name || "image") + "](" + dataUrl + ")\n\n";
            var pos = input.selectionStart != null ? input.selectionStart : input.value.length;
            input.value = input.value.slice(0, pos) + mdImg + input.value.slice(pos);
            obj[key] = input.value;
            paintPv();
            queueSave();
            if (opts.onInput) opts.onInput(input.value);
          });
        });
        tools.appendChild(insBtn);
        f.appendChild(tools);
      }
      return f;
    }
    input = el(opts.textarea ? "textarea" : "input");
    if (!opts.textarea) input.type = "text";
    input.value = obj[key] == null ? "" : String(obj[key]);
    input.addEventListener("input", function () {
      obj[key] = input.value;
      queueSave();
      if (opts.onInput) opts.onInput(input.value);
    });
    f.appendChild(input);
    return f;
  }
  function objSelect(obj, key, label, options) {
    var f = el("div", "field");
    f.innerHTML = "<label>" + MD.esc(label) + "</label>";
    var sel = el("select");
    options.forEach(function (o) {
      var op = el("option", null, MD.esc(o));
      op.value = o;
      sel.appendChild(op);
    });
    if (obj[key]) sel.value = obj[key];
    sel.addEventListener("change", function () { obj[key] = sel.value; queueSave(); });
    f.appendChild(sel);
    return f;
  }

  var VIBES = ["plasma", "magenta", "cyan", "amber", "violet"];

  // ── image intake: file → downscaled data URL stored in content ──
  function pickImage(cb) {
    var inp = el("input");
    inp.type = "file";
    inp.accept = "image/*";
    inp.style.display = "none";
    document.body.appendChild(inp);
    inp.addEventListener("change", function () {
      var file = inp.files && inp.files[0];
      inp.remove();
      if (!file) return;
      if (file.size > 15 * 1024 * 1024) { toast("Use an image under 15 MB, or paste a hosted image URL"); return; }
      var reader = new FileReader();
      reader.onload = function () {
        var img = new Image();
        img.onload = function () {
          /* Preserve only genuinely small transparent marks. Gallery previews
             otherwise get compressed because one embedded file is downloaded
             with content.js on every public page. */
          if (file.type === "image/png" && file.size < 120000 && img.naturalWidth <= 800 && img.naturalHeight <= 800) {
            cb(reader.result, file.name.replace(/\.[a-z0-9]+$/i, ""));
            toast("Image embedded (" + Math.round(reader.result.length / 1024) + " KB stored in content)");
            return;
          }
          var MAXW = 1400, MAXH = 1800;
          var scale = Math.min(1, MAXW / img.naturalWidth, MAXH / img.naturalHeight);
          var canvas = document.createElement("canvas");
          canvas.width = Math.max(1, Math.round(img.naturalWidth * scale));
          canvas.height = Math.max(1, Math.round(img.naturalHeight * scale));
          canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
          var out;
          try { out = canvas.toDataURL("image/webp", 0.80); } catch (e) { out = null; }
          if (!out || out.indexOf("data:image/webp") !== 0) out = canvas.toDataURL("image/jpeg", 0.82);
          cb(out, file.name.replace(/\.[a-z0-9]+$/i, ""));
          var storedKb = Math.round(out.length / 1024);
          toast(storedKb > 240
            ? "Large embedded preview (" + storedKb + " KB) — a hosted image URL will keep every page lighter"
            : "Image embedded (" + storedKb + " KB stored in content)");
        };
        img.onerror = function () { toast("That file could not be read as an image"); };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
    inp.click();
  }

  // ── media control: preview / upload / replace / remove / fallback ──
  function bindObj(obj, key) { return { get: function () { return obj[key]; }, set: function (v) { obj[key] = v; } }; }
  function bindPath(path) { return { get: function () { return get(path); }, set: function (v) { set(path, v); } }; }
  function mediaField(bind, label, opts) {
    opts = opts || {};
    var f = el("div", "field");
    f.innerHTML = "<label>" + MD.esc(label) + "</label>";
    var ctl = el("div", "media-ctl");
    var thumb = el("div", "media-thumb");
    thumb.title = "Click to toggle a larger preview";
    thumb.addEventListener("click", function () { thumb.classList.toggle("big"); });
    var input = el("input");
    input.type = "text";
    input.placeholder = opts.placeholder || "https:// image URL — or upload below";
    input.value = bind.get() == null ? "" : String(bind.get());
    var btns = el("div", "dash-actions");
    var up = el("button", "dash-btn", "Upload");
    up.type = "button";
    var rm = el("button", "dash-btn danger", "Remove");
    rm.type = "button";
    function sync() {
      var v = bind.get();
      if (v) {
        thumb.style.backgroundImage = "url('" + String(v).replace(/'/g, "%27") + "')";
        thumb.textContent = "";
        up.textContent = "Replace";
        rm.style.display = "";
      } else {
        thumb.style.backgroundImage = "none";
        thumb.textContent = opts.fallbackNote || "DEFAULT VISUAL";
        up.textContent = "Upload";
        rm.style.display = "none";
      }
    }
    input.addEventListener("input", function () { bind.set(input.value.trim()); sync(); queueSave(); });
    up.addEventListener("click", function () {
      pickImage(function (dataUrl) { bind.set(dataUrl); input.value = dataUrl; sync(); queueSave(); });
    });
    rm.addEventListener("click", function () { bind.set(""); input.value = ""; sync(); queueSave(); });
    btns.appendChild(up);
    btns.appendChild(rm);
    var right = el("div", "media-right");
    right.appendChild(input);
    right.appendChild(btns);
    ctl.appendChild(thumb);
    ctl.appendChild(right);
    f.appendChild(ctl);
    sync();
    return f;
  }

  // ── PANE: site copy ──
  function paneCopy() {
    var p = $("#pane-copy");
    p.appendChild(el("p", "dash-hint", "Everything here renders as formatted content on the live site. Markdown fields show a live preview beside the editor — what you see there is what ships."));
    p.appendChild(mdField("Hero description", "hero.descMd"));
    p.appendChild(linesField("Hero value chips", "hero.values"));
    p.appendChild(el("h2", null, "Verified numbers (home proof strip)"));
    p.appendChild(el("p", "dash-hint", "Pick which registry facts render as proof cards on the home page. The registry itself lives in the SEO pane."));
    var pfWrap = el("div", "item-list");
    FACTS.registry.forEach(function (fact) {
      var row = el("label", "item-card");
      row.style.cssText = "display:flex;align-items:center;gap:12px;cursor:pointer;padding:16px";
      var cb = el("input");
      cb.type = "checkbox";
      cb.checked = (get("home.proofFacts") || []).indexOf(fact.id) > -1;
      cb.addEventListener("change", function () {
        var list = (get("home.proofFacts") || []).slice();
        if (cb.checked) { if (list.indexOf(fact.id) === -1) list.push(fact.id); }
        else list = list.filter(function (x) { return x !== fact.id; });
        set("home.proofFacts", list);
        queueSave();
      });
      row.appendChild(cb);
      row.appendChild(el("span", null, "<b>" + MD.esc(fact.value) + "</b> — " + MD.esc(fact.claim)));
      pfWrap.appendChild(row);
    });
    p.appendChild(pfWrap);
    p.appendChild(el("h2", null, "Home sections"));
    p.appendChild(listEditor({
      path: "home.sections",
      itemLabel: function (s) { return s.title; },
      blank: function () { return { badge: "", title: "New section", bodyMd: "", link: "", linkLabel: "" }; },
      fields: function (s, i, card) {
        return [
          objField(s, "badge", "Badge (small pill above the title — optional)"),
          objField(s, "title", "Title", { onInput: card.syncLabel }),
          objField(s, "bodyMd", "Body", { md: true }),
          objField(s, "link", "Link (optional — e.g. sites.html)"),
          objField(s, "linkLabel", "Link label")
        ];
      }
    }));
    p.appendChild(el("h2", null, "Pricing"));
    p.appendChild(mdField("Pricing lead", "pricing.leadMd"));
    p.appendChild(listEditor({
      path: "pricing.tiers",
      itemLabel: function (t) { return t.title + " — " + t.price; },
      blank: function () { return { title: "New tier", price: "$0", note: "" }; },
      fields: function (t, i, card) {
        return [
          objField(t, "title", "Tier name", { onInput: card.syncLabel }),
          objField(t, "price", "Price", { onInput: card.syncLabel }),
          objField(t, "note", "Note")
        ];
      }
    }));
    p.appendChild(mdField("Pricing footnote", "pricing.footnoteMd"));
    p.appendChild(el("h2", null, "FAQ"));
    p.appendChild(listEditor({
      path: "faq",
      itemLabel: function (f) { return f.q; },
      blank: function () { return { q: "New question?", aMd: "" }; },
      fields: function (f, i, card) {
        return [
          objField(f, "q", "Question", { onInput: card.syncLabel }),
          objField(f, "aMd", "Answer", { md: true })
        ];
      }
    }));
  }

  // ── PANE: builder ──
  function paneBuilder() {
    var p = $("#pane-builder");
    p.appendChild(el("p", "dash-hint", "The builder page is a build board, not a resume. Keep 'In Motion' honest — if it shipped, move it."));
    p.appendChild(textField("Kicker", "builder.kicker"));
    p.appendChild(textField("Title", "builder.title"));
    p.appendChild(mdField("Intro", "builder.introMd"));
    [["shipped", "Shipped"], ["motion", "In Motion"], ["next", "Up Next"]].forEach(function (pair) {
      p.appendChild(el("h2", null, pair[1]));
      p.appendChild(listEditor({
        path: "builder." + pair[0],
        itemLabel: function (x) { return MD.plain(x.name || x.nameMd || "New item"); },
        blank: function () { return { name: "New item", note: "" }; },
        fields: function (x, i, card) {
          return [
            objField(x, "name", "Name", { md: true, onInput: card.syncLabel }),
            objField(x, "note", "Note", { md: true })
          ];
        }
      }));
    });
    p.appendChild(el("h2", null, "Mission"));
    p.appendChild(mdField("Mission", "builder.missionMd", { tall: true }));
    p.appendChild(mdField("Contact CTA", "builder.ctaMd"));
  }

  // ── PANE: blog ──
  function factsAuditNode(post) {
    var box = el("div");
    function audit() {
      var matches = FACTS.match((post.title || "") + " " + (post.descMd || "") + " " + (post.bodyMd || ""), { limit: 2 });
      box.innerHTML = "";
      var lbl = el("div", "field");
      lbl.innerHTML = "<label>Verified-facts audit — what will inject on publish</label>";
      box.appendChild(lbl);
      if (!matches.length) {
        box.appendChild(el("div", "fact-match", '<span class="fm-score">NO VERIFIED SIGNALS MATCHED</span><p>No fact in the registry clears the relevance bar for this post. Nothing will be injected — the system never pads.</p>'));
        return;
      }
      matches.forEach(function (m) {
        box.appendChild(el("div", "fact-match",
          '<span class="fm-score">WILL INJECT · relevance ' + m.score.toFixed(1) + "</span>" +
          "<b>" + MD.esc(m.fact.value) + "</b> — " + MD.esc(m.fact.claim) +
          "<p>" + MD.esc(m.fact.source) + "</p>"));
      });
    }
    audit();
    box._audit = audit;
    return box;
  }
  function paneBlog() {
    var p = $("#pane-blog");
    p.appendChild(el("p", "dash-hint", "Posts are written in full markdown — headings, lists, quotes, fenced ``` code blocks, inline images, and uploads via Insert image. Math renders too: $$ … $$ on its own line for display math, \\( … \\) inline (KaTeX loads only when a post uses it; raw TeX stays visible if it can't). The verified-facts layer scans each post and injects only registry-verified, cited stats — it cannot invent a reference. The audit below each post shows exactly what will appear."));
    p.appendChild(mdField("Blog lead", "blog.leadMd"));
    p.appendChild(listEditor({
      path: "blog.posts",
      itemLabel: function (x) { return x.title; },
      blank: function () {
        return { title: "New post", slug: "new-post-" + Date.now().toString(36), date: new Date().toISOString().slice(0, 10), tags: [], descMd: "", bodyMd: "" };
      },
      fields: function (post, i, card) {
        post.tagsText = (post.tags || []).join(", ");
        var auditBox = factsAuditNode(post);
        function reAudit() { auditBox._audit(); }
        var tagField = objField(post, "tagsText", "Tags (comma separated)");
        $("input", tagField).addEventListener("input", function (e) {
          post.tags = e.target.value.split(",").map(function (s) { return s.trim(); }).filter(Boolean);
          queueSave();
        });
        return [
          objField(post, "title", "Title", { onInput: function () { card.syncLabel(); reAudit(); } }),
          objField(post, "slug", "Slug (URL: post.html?p=slug)"),
          objField(post, "date", "Date (YYYY-MM-DD)"),
          tagField,
          objField(post, "descMd", "Description (SEO + card)", { md: true, onInput: reAudit }),
          objField(post, "bodyMd", "Body", { md: true, tall: true, insertImage: true, onInput: reAudit }),
          auditBox
        ];
      }
    }));
  }

  // ── PANE: galleries ──
  function slugId(s) {
    return String(s || "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || ("cat-" + Date.now().toString(36));
  }
  function catTitleOf(c) { return c.title || c.name || ""; }
  function catEditor(catsPath) {
    return listEditor({
      path: catsPath,
      itemLabel: function (c) { return (catTitleOf(c) || "(untitled)") + " · " + (c.vibe || "plasma"); },
      blank: function () { return { id: "", title: "New category", vibe: "plasma" }; },
      fields: function (c, i, card) {
        /* migrate legacy drafts that stored `name`; freeze the id once created
           so renaming a category never orphans the items filed under it */
        if (c.name && !c.title) { c.title = c.name; delete c.name; }
        if (!c.id) c.id = slugId(c.title);
        return [
          objField(c, "title", "Category name", { onInput: card.syncLabel }),
          objSelect(c, "vibe", "Vibe (accent + geometry shift)", VIBES)
        ];
      }
    });
  }
  function firstCatId(catsPath) {
    var cats = get(catsPath) || [];
    return cats.length ? cats[0].id : "";
  }
  function catSelect(obj, key, label, catsPath) {
    var f = el("div", "field");
    f.innerHTML = "<label>" + MD.esc(label) + "</label>";
    var sel = el("select");
    var cats = get(catsPath) || [];
    cats.forEach(function (c) {
      var op = el("option", null, MD.esc(catTitleOf(c) || c.id));
      op.value = c.id;
      sel.appendChild(op);
    });
    if (obj[key]) {
      /* legacy drafts stored the category title — map it back to the id */
      var isId = cats.some(function (c) { return c.id === obj[key]; });
      if (!isId) {
        cats.forEach(function (c) { if (catTitleOf(c) === obj[key]) obj[key] = c.id; });
      }
      sel.value = obj[key];
    }
    sel.addEventListener("change", function () { obj[key] = sel.value; queueSave(); });
    f.appendChild(sel);
    return f;
  }
  function checkoutField(obj) {
    var f = el("div", "field");
    f.innerHTML = "<label>Hosted checkout URL (Stripe or Gumroad)</label>";
    var input = el("input");
    input.type = "url";
    input.placeholder = "https://buy.stripe.com/… or https://yourname.gumroad.com/l/…";
    input.value = obj.paymentLink || "";
    var hint = el("p", "field-validation");
    function validate() {
      var value = input.value.trim();
      var okay = false, provider = "";
      if (!value) { hint.textContent = "Optional. Empty keeps the direct email purchase path."; input.classList.remove("invalid"); return; }
      try {
        var url = new URL(value);
        var host = url.hostname.toLowerCase();
        if (!url.username && !url.password && url.protocol === "https:" && (host === "buy.stripe.com" || host === "checkout.stripe.com")) { okay = true; provider = "Stripe"; }
        if (!url.username && !url.password && url.protocol === "https:" && (host === "gumroad.com" || host === "www.gumroad.com" || host === "gum.co" || /\.gumroad\.com$/.test(host))) { okay = true; provider = "Gumroad"; }
      } catch (e) {}
      input.classList.toggle("invalid", !okay);
      hint.textContent = okay ? provider + " hosted checkout recognized." : "Blocked on the public site: use an HTTPS Stripe Payment Link or Gumroad product URL.";
    }
    input.addEventListener("input", function () { obj.paymentLink = input.value.trim(); validate(); queueSave(); });
    validate();
    f.appendChild(input);
    f.appendChild(hint);
    return f;
  }

  // ── auto-categorization: word overlap between the item and each
  // category (its title + the items already filed there). Deterministic,
  // explainable, and always manually overridable via the select. ──
  var CAT_STOP = { the: 1, a: 1, an: 1, and: 1, or: 1, of: 1, to: 1, in: 1, on: 1, is: 1, it: 1, for: 1, with: 1, that: 1, this: 1, you: 1, your: 1, "new": 1, from: 1, at: 1, by: 1 };
  function catTokens(text) {
    var out = {};
    String(text || "").toLowerCase().replace(/[a-z][a-z'-]+/g, function (w) {
      /* light stemming so "tool" matches "Tools", "invoice" matches "invoices" */
      if (w.length > 3 && w.slice(-1) === "s" && w.slice(-2) !== "ss") w = w.slice(0, -1);
      if (!CAT_STOP[w]) out[w] = (out[w] || 0) + 1;
      return w;
    });
    return out;
  }
  function itemText(it) {
    return [it.title, it.descMd, it.noteMd, it.note, it.url, it.icon].filter(Boolean).join(" ");
  }
  function suggestCategory(item, catsPath, itemsPath) {
    var cats = get(catsPath) || [];
    var items = get(itemsPath) || [];
    if (!cats.length) return null;
    var itTok = catTokens(itemText(item));
    var best = null, bestScore = 0;
    cats.forEach(function (c) {
      var corpus = catTitleOf(c) + " " + c.id;
      items.forEach(function (other) {
        if (other !== item && other.cat === c.id) corpus += " " + itemText(other);
      });
      var cTok = catTokens(corpus);
      var score = 0;
      for (var w in itTok) {
        if (cTok[w]) score += (1 + Math.log(1 + Math.min(itTok[w], cTok[w]))) * (catTitleOf(c).toLowerCase().indexOf(w) > -1 ? 2 : 1);
      }
      if (score > bestScore) { bestScore = score; best = c.id; }
    });
    return bestScore >= 2 ? best : null;
  }
  function catControls(item, catsPath, itemsPath) {
    var field = catSelect(item, "cat", "Category", catsPath);
    var auto = el("button", "dash-btn", "Auto-categorize");
    auto.type = "button";
    auto.style.marginTop = "8px";
    auto.addEventListener("click", function () {
      var pick = suggestCategory(item, catsPath, itemsPath);
      if (!pick) { toast("No confident match — set the category manually"); return; }
      item.cat = pick;
      $("select", field).value = pick;
      queueSave();
      var t = pick;
      (get(catsPath) || []).forEach(function (c) { if (c.id === pick) t = catTitleOf(c) || pick; });
      toast("Filed under “" + t + "”");
    });
    field.appendChild(auto);
    return field;
  }
  function bulkAuto(catsPath, itemsPath, label) {
    var wrap = el("div", "dash-actions");
    var b = el("button", "dash-btn", "Auto-categorize " + label);
    b.type = "button";
    b.addEventListener("click", function () {
      var items = get(itemsPath) || [];
      var moved = 0;
      items.forEach(function (it) {
        var pick = suggestCategory(it, catsPath, itemsPath);
        if (pick && pick !== it.cat) { it.cat = pick; moved++; }
      });
      queueSave();
      paneGalleries();
      toast(moved ? moved + " item(s) re-filed — review below" : "Everything already sits in its best category");
    });
    wrap.appendChild(b);
    return wrap;
  }
  function paneGalleries() {
    var p = $("#pane-galleries");
    p.innerHTML = "";
    p.appendChild(el("p", "dash-hint", "Each category carries a vibe — pick one and the live site re-tunes its accent and geometry when a visitor filters to it. Every item can carry an uploaded image or logo; leave it empty and the site's uniform default visual is used. Icons are optional. Auto-categorize files items by their wording — always overridable via the Category select. Payment link is optional: with one, buyers get a checkout button; without, purchase falls back to a prefilled email."));

    p.appendChild(el("h2", null, "Photos"));
    p.appendChild(mdField("Photos lead", "photos.leadMd"));
    p.appendChild(catEditor("photos.categories"));
    p.appendChild(bulkAuto("photos.categories", "photos.items", "all photos"));
    p.appendChild(listEditor({
      path: "photos.items",
      itemLabel: function (x) { return (x.icon ? x.icon + " " : "") + x.title; },
      blank: function () { return { title: "New photo", cat: firstCatId("photos.categories"), descMd: "", price: "$100", frame: "square", img: "", icon: "", paymentLink: "" }; },
      fields: function (x, i, card) {
        /* migrate legacy console field names to what the site renders */
        if (x.src && !x.img) { x.img = x.src; delete x.src; }
        if (x.note && !x.descMd) { x.descMd = x.note; delete x.note; }
        return [
          objField(x, "title", "Title", { onInput: card.syncLabel }),
          catControls(x, "photos.categories", "photos.items"),
          mediaField(bindObj(x, "img"), "Image", { fallbackNote: "DEFAULT VISUAL — uniform dark tile with the title" }),
          objField(x, "icon", "Short text mark (optional)", { onInput: card.syncLabel }),
          objField(x, "descMd", "Description", { md: true }),
          objField(x, "price", "Price"),
          objSelect(x, "frame", "Frame", ["square", "tall", "wide"]),
          checkoutField(x)
        ];
      }
    }));

    p.appendChild(el("h2", null, "Apps"));
    p.appendChild(mdField("Apps lead", "apps.leadMd"));
    p.appendChild(catEditor("apps.categories"));
    p.appendChild(bulkAuto("apps.categories", "apps.items", "all apps"));
    p.appendChild(listEditor({
      path: "apps.items",
      itemLabel: function (x) { return (x.icon ? x.icon + " " : "") + x.title; },
      blank: function () { return { title: "New app", cat: firstCatId("apps.categories"), descMd: "", price: "$25", url: "", img: "", icon: "", paymentLink: "" }; },
      fields: function (x, i, card) {
        if (x.note && !x.descMd) { x.descMd = x.note; delete x.note; }
        return [
          objField(x, "title", "Title", { onInput: card.syncLabel }),
          catControls(x, "apps.categories", "apps.items"),
          mediaField(bindObj(x, "img"), "Custom image / logo", { fallbackNote: "DEFAULT VISUAL — category gradient tile" }),
          objField(x, "icon", "Short text mark (optional)", { onInput: card.syncLabel }),
          objField(x, "descMd", "Description", { md: true }),
          objField(x, "price", "Price"),
          objField(x, "url", "Live URL"),
          checkoutField(x)
        ];
      }
    }));

    p.appendChild(el("h2", null, "Sites"));
    p.appendChild(mdField("Sites lead", "sites.leadMd"));
    p.appendChild(catEditor("sites.categories"));
    p.appendChild(bulkAuto("sites.categories", "sites.items", "all sites"));
    p.appendChild(listEditor({
      path: "sites.items",
      itemLabel: function (x) { return (x.icon ? x.icon + " " : "") + x.title; },
      blank: function () { return { title: "New site", cat: firstCatId("sites.categories"), noteMd: "", url: "", icon: "" }; },
      fields: function (x, i, card) {
        if (x.note && !x.noteMd) { x.noteMd = x.note; delete x.note; }
        return [
          objField(x, "title", "Title", { onInput: card.syncLabel }),
          catControls(x, "sites.categories", "sites.items"),
          objField(x, "icon", "Short text mark (optional)", { onInput: card.syncLabel }),
          objField(x, "noteMd", "Note", { md: true }),
          objField(x, "url", "Live URL (the showcase embeds this as the live preview)")
        ];
      }
    }));

    p.appendChild(el("h2", null, "Templates"));
    p.appendChild(el("p", "dash-hint", "Add a live preview URL, an image, or both. The public template page uses the same showcase rhythm as Sites and exposes checkout only when the URL is a recognized Stripe or Gumroad hosted page."));
    if (!get("templates")) set("templates", { leadMd: "", comingSoonMd: "", categories: [], items: [] });
    p.appendChild(mdField("Templates lead", "templates.leadMd"));
    p.appendChild(mdField("Coming-soon message", "templates.comingSoonMd"));
    p.appendChild(catEditor("templates.categories"));
    p.appendChild(bulkAuto("templates.categories", "templates.items", "all templates"));
    p.appendChild(listEditor({
      path: "templates.items",
      itemLabel: function (x) { return x.title; },
      blank: function () { return { title: "New template", cat: firstCatId("templates.categories"), descMd: "", price: "$0", previewUrl: "", imageUrl: "", paymentLink: "" }; },
      fields: function (x, i, card) {
        return [
          objField(x, "title", "Title", { onInput: card.syncLabel }),
          catControls(x, "templates.categories", "templates.items"),
          objField(x, "descMd", "Description", { md: true }),
          objField(x, "price", "Price"),
          objField(x, "previewUrl", "Live preview URL"),
          mediaField(bindObj(x, "imageUrl"), "Preview image (optional)", { fallbackNote: "LIVE PREVIEW OR DESIGNED FALLBACK" }),
          checkoutField(x)
        ];
      }
    }));
  }

  // ── PANE: footer ──
  function footerPreset(id) {
    for (var i = 0; i < FOOTER_DEFAULTS.length; i++) if (FOOTER_DEFAULTS[i].id === id) return FOOTER_DEFAULTS[i];
    return null;
  }
  function ensureFooterSocials() {
    var existing = get("footer.social");
    var hadField = Array.isArray(existing);
    var out = [];
    (hadField ? existing : FOOTER_DEFAULTS).forEach(function (item) {
      var preset = item && footerPreset(item.id);
      if (!preset || out.some(function (x) { return x.id === item.id; })) return;
      out.push({ id: item.id, enabled: item.enabled === true, url: item.url == null ? "" : String(item.url) });
    });
    FOOTER_DEFAULTS.forEach(function (preset) {
      if (out.some(function (x) { return x.id === preset.id; })) return;
      out.push({ id: preset.id, enabled: hadField ? false : preset.enabled, url: hadField ? "" : preset.url });
    });
    set("footer.social", out);
    return out;
  }
  function paneFooter() {
    var p = $("#pane-footer");
    p.innerHTML = "";
    p.appendChild(el("p", "dash-hint", "Turn platform icons on or off, edit their destinations, and set their order. The official SVG marks, brand colors, BNDR logo, legal links, layout, and glass-shine effect stay protected in code."));
    var list = el("div", "social-admin-list");
    function redraw() {
      list.innerHTML = "";
      var items = ensureFooterSocials();
      items.forEach(function (item, index) {
        var preset = footerPreset(item.id);
        var row = el("div", "social-admin-row");
        var name = el("label", "social-admin-name");
        var toggle = el("input");
        toggle.type = "checkbox";
        toggle.checked = item.enabled === true;
        toggle.setAttribute("aria-label", "Enable " + preset.label);
        name.appendChild(toggle);
        name.appendChild(el("span", null, MD.esc(preset.label)));
        var url = el("input", "social-admin-url");
        url.type = "url";
        url.inputMode = "url";
        url.placeholder = "https://";
        url.value = item.url || "";
        url.setAttribute("aria-label", preset.label + " URL");
        var moves = el("div", "social-admin-move");
        var up = el("button", "dash-btn", "↑");
        var down = el("button", "dash-btn", "↓");
        up.type = down.type = "button";
        up.title = "Move " + preset.label + " earlier";
        down.title = "Move " + preset.label + " later";
        up.disabled = index === 0;
        down.disabled = index === items.length - 1;
        toggle.addEventListener("change", function () {
          item.enabled = toggle.checked;
          if (item.enabled && !item.url && preset.url) { item.url = preset.url; url.value = item.url; }
          queueSave();
        });
        url.addEventListener("input", function () { item.url = url.value.trim(); queueSave(); });
        up.addEventListener("click", function () {
          if (!index) return;
          items.splice(index - 1, 0, items.splice(index, 1)[0]);
          set("footer.social", items); queueSave(); redraw();
        });
        down.addEventListener("click", function () {
          if (index >= items.length - 1) return;
          items.splice(index + 1, 0, items.splice(index, 1)[0]);
          set("footer.social", items); queueSave(); redraw();
        });
        moves.appendChild(up); moves.appendChild(down);
        row.appendChild(name); row.appendChild(url); row.appendChild(moves);
        list.appendChild(row);
      });
    }
    redraw();
    p.appendChild(list);
    p.appendChild(el("p", "dash-hint", "An enabled platform with an empty or non-HTTPS URL stays hidden on the public site. This prevents dead or unsafe links from rendering."));
  }

  // ── PANE: SEO ──
  function download(name, mime, text) {
    var a = el("a");
    a.href = URL.createObjectURL(new Blob([text], { type: mime }));
    a.download = name;
    document.body.appendChild(a);
    a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 400);
  }
  function genSitemap() {
    var base = get("meta.baseUrl") || "https://bndrllc.com";
    var today = new Date().toISOString().slice(0, 10);
    var urls = ["index.html", "sites.html", "apps.html", "photos.html", "blog.html", "builder.html", "templates.html", "estimate.html"].map(function (f) {
      return "  <url><loc>" + base + "/" + f + "</loc><lastmod>" + today + "</lastmod></url>";
    });
    (get("blog.posts") || []).forEach(function (p) {
      urls.push("  <url><loc>" + base + "/post.html?p=" + encodeURIComponent(p.slug) + "</loc><lastmod>" + p.date + "</lastmod></url>");
    });
    return '<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n' + urls.join("\n") + "\n</urlset>\n";
  }
  function genRss() {
    var base = get("meta.baseUrl") || "https://bndrllc.com";
    var items = (get("blog.posts") || []).slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; }).map(function (p) {
      return "  <item>\n    <title>" + MD.esc(p.title) + "</title>\n    <link>" + base + "/post.html?p=" + encodeURIComponent(p.slug) + "</link>\n    <guid isPermaLink=\"true\">" + base + "/post.html?p=" + encodeURIComponent(p.slug) + "</guid>\n    <pubDate>" + new Date(p.date + "T12:00:00Z").toUTCString() + "</pubDate>\n    <description>" + MD.esc(MD.plain(p.descMd, 300)) + "</description>\n  </item>";
    });
    return '<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n<channel>\n  <title>BNDR LLC — Field Notes</title>\n  <link>' + base + "/blog.html</link>\n  <description>Field notes on design, speed, and the psychology of the click.</description>\n" + items.join("\n") + "\n</channel>\n</rss>\n";
  }
  function genRobots() {
    var base = get("meta.baseUrl") || "https://bndrllc.com";
    return "User-agent: *\nAllow: /\nDisallow: /dashboard.html\n\nSitemap: " + base + "/sitemap.xml\n";
  }
  // ── intake / estimator ──
  function paneIntake() {
    var p = $("#pane-intake");
    p.innerHTML = "";
    var IKDEF = {
      leadMd: "Tap through a few options and the number updates live. Flat pricing, known before you say yes — no sales call, no email chain, no surprises.",
      endpoint: "",
      successMd: "**Got it — it's in my inbox.** You'll hear back from me directly, usually same day. No secretary, no queue, no drip campaign.",
      hostingNote: "Flat build price. Hosting is $99/mo separate — covered in the FAQ below.",
      businessTypes: ["Home services / trades", "Med spa / salon / aesthetics", "Law / professional practice", "Restaurant / food", "Local shop / retail", "Personal brand / creative", "Something else"],
      needs: ["Brand-new site — nothing exists yet", "Redesign — my current site embarrasses me", "Landing page for a campaign or launch", "Not sure — tell me what I need"],
      sizes: [{ label: "Launch Site Special", detail: "One sharp page, fast", price: 599 }, { label: "One-Page Lander™", detail: "A single page engineered to convert", price: 2500 }, { label: "Three-Page Custom™", detail: "Home, work, contact — the full pitch", price: 4500 }, { label: "Small Business Site™", detail: "The complete presence", price: 6500 }],
      addons: [{ label: "Blog / field notes", price: 500 }, { label: "Photo or work gallery", price: 400 }, { label: "Copywriting help", price: 450 }, { label: "Logo / brand touch-up", price: 600 }],
      timelines: ["ASAP", "Within a month", "This quarter", "Just looking"],
      budgets: ["Under $1k", "$1k – $3k", "$3k – $6k", "$6k+", "Not sure yet"]
    };
    if (!get("intake")) set("intake", clone((SHIP && SHIP.intake) || IKDEF));
    var ik = get("intake");
    Object.keys(IKDEF).forEach(function (k) { if (ik[k] == null) ik[k] = clone(IKDEF[k]); });
    p.appendChild(el("p", "dash-hint", "Everything on estimate.html — the questions, the options, the flat prices, the reply copy, and where submissions get delivered."));

    p.appendChild(el("h2", null, "Delivery"));
    p.appendChild(el("p", "dash-hint", "Leave the endpoint empty to use FormSubmit (free, no account): submissions land in your Settings email as a clean table. The very first submission triggers a one-time activation email from formsubmit.co — click the link in it once and you're live, so do a test submission yourself right after deploying. If the service is ever down, visitors automatically get a one-tap email fallback — no lead is lost either way. To switch services later, paste any other form endpoint URL here."));
    p.appendChild(textField("Form endpoint override (optional)", "intake.endpoint"));
    p.appendChild(mdField("Success message (after send)", "intake.successMd"));

    p.appendChild(el("h2", null, "Page copy"));
    p.appendChild(mdField("Lead paragraph", "intake.leadMd"));
    p.appendChild(textField("Price bar note", "intake.hostingNote"));

    p.appendChild(el("h2", null, "Questions"));
    p.appendChild(linesField("Business types", "intake.businessTypes"));
    p.appendChild(linesField("Needs", "intake.needs"));
    p.appendChild(linesField("Timelines", "intake.timelines"));
    p.appendChild(linesField("Budget ranges", "intake.budgets"));

    function priceField(obj, key, label) {
      var f = el("div", "field");
      f.innerHTML = "<label>" + MD.esc(label) + "</label>";
      var input = el("input");
      input.type = "number"; input.min = "0"; input.step = "1";
      input.value = obj[key] == null ? "" : obj[key];
      input.addEventListener("input", function () { obj[key] = Number(input.value) || 0; queueSave(); });
      f.appendChild(input);
      return f;
    }
    p.appendChild(el("h2", null, "Sizes — the flat prices"));
    p.appendChild(listEditor({
      path: "intake.sizes",
      itemLabel: function (s) { return (s.label || "Size") + " — $" + (Number(s.price) || 0); },
      blank: function () { return { label: "New size", detail: "", price: 0 }; },
      fields: function (s, i, card) {
        return [
          objField(s, "label", "Label", { onInput: card.syncLabel }),
          objField(s, "detail", "One-line detail"),
          priceField(s, "price", "Price (USD)")
        ];
      }
    }));
    p.appendChild(el("h2", null, "Add-ons"));
    p.appendChild(listEditor({
      path: "intake.addons",
      itemLabel: function (a) { return (a.label || "Add-on") + " — +$" + (Number(a.price) || 0); },
      blank: function () { return { label: "New add-on", price: 0 }; },
      fields: function (a, i, card) {
        return [
          objField(a, "label", "Label", { onInput: card.syncLabel }),
          priceField(a, "price", "Price (USD)")
        ];
      }
    }));
  }

  // ── analytics (GA4, owner-side OAuth — data flows Google → this browser tab only) ──
  function paneAnalytics() {
    var p = $("#pane-analytics");
    p.innerHTML = "";
    var GA_TOKEN = null, GA_TIMER = null, GIS_READY = null;
    p.appendChild(el("p", "dash-hint", "Live numbers straight from your Google Analytics. You sign in with Google right here; data flows Google → this browser tab and is stored nowhere else. No password, no server, nothing to maintain."));

    var setup = el("details", "item-card");
    setup.open = !get("analytics.gaClientId");
    setup.innerHTML = '<summary><span class="grow">One-time Google setup (≈3 minutes, done once, free)</span></summary>';
    var steps = el("ol", "ga-steps");
    steps.innerHTML =
      '<li><b>Enable two APIs</b> — sign into Google with the same account that owns your Analytics, then open each link and hit the blue <b>Enable</b> button: <a href="https://console.cloud.google.com/apis/library/analyticsdata.googleapis.com" target="_blank" rel="noopener">Analytics Data API (open)</a> · <a href="https://console.cloud.google.com/apis/library/analyticsadmin.googleapis.com" target="_blank" rel="noopener">Analytics Admin API (open)</a> (the second one lets this pane auto-find your property so you never touch an ID).</li>' +
      '<li><b>Create the key</b> — open <a href="https://console.cloud.google.com/apis/credentials/oauthclient" target="_blank" rel="noopener">Create OAuth client ID</a> → Application type: <b>Web application</b> → under <b>Authorized JavaScript origins</b> click Add URI and paste <code class="ga-origin"></code> <button type="button" class="dash-btn ga-copy-origin">Copy</button> → Create. (If Google first says “Configure consent screen”: choose <b>External</b>, enter just an app name + your email, save, then repeat this step.)</li>' +
      '<li><b>Paste the Client ID below</b> (the long string ending in <code>.apps.googleusercontent.com</code>) and hit Connect. Done forever. The Client ID is public by design — it only works from your own domain, so it\'s safe to publish.</li>';
    setup.appendChild(steps);
    p.appendChild(setup);
    var originCode = setup.querySelector(".ga-origin");
    if (originCode) originCode.textContent = location.origin;
    var copyBtn = setup.querySelector(".ga-copy-origin");
    if (copyBtn) copyBtn.addEventListener("click", function () {
      try { navigator.clipboard.writeText(location.origin).then(function () { toast("Origin copied — paste it in Google's form"); }); }
      catch (e) { toast(location.origin); }
    });
    p.appendChild(el("p", "dash-hint", "Heads-up for later: Google needs the origin above to match where this console runs. When the site is live on your real domain, add that domain as a second origin in the same Google form (one more paste, same place)."));

    p.appendChild(textField("OAuth Client ID", "analytics.gaClientId"));

    var act = el("div", "dash-actions");
    var connectBtn = el("button", "dash-btn primary", "Connect Google Analytics");
    act.appendChild(connectBtn);
    p.appendChild(act);
    var status = el("p", "dash-hint", "Not connected yet.");
    p.appendChild(status);
    var propHost = el("div");
    p.appendChild(propHost);
    var charts = el("div", "ga-grid");
    p.appendChild(charts);

    function say(msg) { status.textContent = msg; }
    function loadGis() {
      if (window.google && window.google.accounts && window.google.accounts.oauth2) return Promise.resolve();
      if (GIS_READY) return GIS_READY;
      GIS_READY = new Promise(function (res, rej) {
        var s = document.createElement("script");
        s.src = "https://accounts.google.com/gsi/client";
        s.onload = res;
        s.onerror = function () { GIS_READY = null; rej(new Error("Couldn't load Google sign-in — check your connection and try again.")); };
        document.head.appendChild(s);
      });
      return GIS_READY;
    }
    function gaFetch(url, body) {
      return fetch(url, {
        method: body ? "POST" : "GET",
        headers: { Authorization: "Bearer " + GA_TOKEN, "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined
      }).then(function (r) {
        if (!r.ok) { var e = new Error("HTTP " + r.status); e.status = r.status; throw e; }
        return r.json();
      });
    }
    function gaError(e) {
      if (e && e.status === 401) { GA_TOKEN = null; connectBtn.textContent = "Connect Google Analytics"; say("Google session expired — hit Connect again (one click, no password)."); }
      else if (e && e.status === 403) { say("Google said 403. Usually one of the two APIs from step 1 isn't enabled yet (enable it, wait ~1 minute, retry) — or this Google account can't see that Analytics property."); }
      else if (e && e.status === 429) { say("Google rate limit — wait a minute, then refresh again."); }
      else { say("Couldn't reach Google Analytics (" + ((e && e.message) || "network") + "). Check your connection and try again."); }
    }
    function connect() {
      var cid = (get("analytics.gaClientId") || "").trim();
      if (!cid) { say("Paste your Client ID first (step 2 above)."); return; }
      say("Opening Google sign-in…");
      loadGis().then(function () {
        var tc = window.google.accounts.oauth2.initTokenClient({
          client_id: cid,
          scope: "https://www.googleapis.com/auth/analytics.readonly",
          callback: function (resp) {
            if (resp && resp.access_token) { GA_TOKEN = resp.access_token; connectBtn.textContent = "Refresh data"; afterToken(); }
            else say("Google didn't hand back a session — try Connect again.");
          },
          error_callback: function (err) { say("Sign-in window closed or blocked" + (err && err.type ? " (" + err.type + ")" : "") + " — allow the popup and try again."); }
        });
        tc.requestAccessToken();
      }).catch(function (e) { say(e.message); });
    }
    function showManualProp(note) {
      propHost.innerHTML = "";
      propHost.appendChild(el("p", "dash-hint", note + " Find yours in Google Analytics → Admin (gear, bottom-left) → Property settings → Property ID (a number)."));
      var f = el("div", "field");
      f.innerHTML = "<label>GA4 Property ID (numbers only)</label>";
      var input = el("input"); input.type = "text"; input.value = get("analytics.gaPropertyId") || "";
      f.appendChild(input);
      var b = el("button", "dash-btn primary", "Use this property");
      b.addEventListener("click", function () {
        var v = input.value.replace(/\D/g, "");
        if (!v) { say("That property ID needs to be a number."); return; }
        set("analytics.gaPropertyId", v); queueSave();
        loadReports(v);
      });
      propHost.appendChild(f);
      var a2 = el("div", "dash-actions"); a2.appendChild(b); propHost.appendChild(a2);
    }
    function afterToken() {
      var pid = (get("analytics.gaPropertyId") || "").trim();
      if (pid) { loadReports(pid); return; }
      say("Connected — finding your Analytics properties…");
      gaFetch("https://analyticsadmin.googleapis.com/v1beta/accountSummaries?pageSize=200")
        .then(function (d) {
          var props = [];
          (d.accountSummaries || []).forEach(function (a) {
            (a.propertySummaries || []).forEach(function (ps) {
              props.push({ id: String(ps.property || "").replace("properties/", ""), name: (ps.displayName || "Property") + " — " + (a.displayName || "") });
            });
          });
          if (!props.length) { showManualProp("Connected, but this Google account shows no GA4 properties."); return; }
          if (props.length === 1) { set("analytics.gaPropertyId", props[0].id); queueSave(); loadReports(props[0].id); return; }
          propHost.innerHTML = "";
          var f = el("div", "field");
          f.innerHTML = "<label>Pick your property</label>";
          var sel = el("select");
          props.forEach(function (pr) { var o = el("option"); o.value = pr.id; o.textContent = pr.name + " (" + pr.id + ")"; sel.appendChild(o); });
          f.appendChild(sel);
          propHost.appendChild(f);
          var b = el("button", "dash-btn primary", "Use this property");
          b.addEventListener("click", function () { set("analytics.gaPropertyId", sel.value); queueSave(); loadReports(sel.value); });
          var a2 = el("div", "dash-actions"); a2.appendChild(b); propHost.appendChild(a2);
        })
        .catch(function (e) {
          if (e && e.status === 401) { gaError(e); return; }
          showManualProp("Auto-discovery needs the Analytics Admin API from step 1 — or just type the property ID once.");
        });
    }
    function drawLine(cv, vals) {
      var dpr = window.devicePixelRatio || 1;
      var w = cv.clientWidth || 600, h = cv.clientHeight || 190;
      cv.width = w * dpr; cv.height = h * dpr;
      var ctx = cv.getContext("2d");
      ctx.scale(dpr, dpr);
      var max = Math.max.apply(null, vals.concat([1]));
      var padL = 6, padR = 6, padT = 10, padB = 8;
      var iw = w - padL - padR, ih = h - padT - padB;
      ctx.strokeStyle = "rgba(255,255,255,0.10)";
      ctx.lineWidth = 1;
      [0.25, 0.5, 0.75].forEach(function (g) {
        ctx.beginPath(); ctx.moveTo(padL, padT + ih * g); ctx.lineTo(padL + iw, padT + ih * g); ctx.stroke();
      });
      function x(i) { return padL + (vals.length < 2 ? iw / 2 : (iw * i) / (vals.length - 1)); }
      function y(v) { return padT + ih - (ih * v) / max; }
      ctx.beginPath();
      vals.forEach(function (v, i) { if (i === 0) ctx.moveTo(x(i), y(v)); else ctx.lineTo(x(i), y(v)); });
      ctx.strokeStyle = "#ccff00"; ctx.lineWidth = 2; ctx.stroke();
      ctx.lineTo(x(vals.length - 1), padT + ih); ctx.lineTo(x(0), padT + ih); ctx.closePath();
      ctx.fillStyle = "rgba(204,255,0,0.10)"; ctx.fill();
    }
    function renderCharts(pid, daily, pages, rt) {
      charts.innerHTML = "";
      var rows = daily.rows || [];
      var vals = rows.map(function (r) { return Number(r.metricValues[0].value) || 0; });
      var totalUsers = vals.reduce(function (a, b) { return a + b; }, 0);
      var rtN = rt.rows && rt.rows[0] ? rt.rows[0].metricValues[0].value : "0";
      var c1 = el("div", "ga-card");
      c1.innerHTML = "<h3>Right now — active visitors</h3>";
      var num = el("div", "ga-num", "");
      num.id = "ga-rt"; num.textContent = rtN;
      c1.appendChild(num);
      c1.appendChild(el("p", "dash-hint", "Auto-refreshes every 60 seconds while this tab is open. Property " + pid + "."));
      var c2 = el("div", "ga-card");
      c2.innerHTML = "<h3>Visitors — last 28 days (" + totalUsers + " total)</h3>";
      var cv = el("canvas", "ga-chart");
      c2.appendChild(cv);
      if (rows.length) {
        var d0 = rows[0].dimensionValues[0].value, d1 = rows[rows.length - 1].dimensionValues[0].value;
        var fd = function (s) { return s.slice(4, 6) + "/" + s.slice(6, 8); };
        var lab = el("div", "ga-row", "");
        lab.style.border = "0";
        lab.innerHTML = '<span class="ga-path">' + fd(d0) + "</span><span>" + fd(d1) + "</span>";
        c2.appendChild(lab);
      }
      var c3 = el("div", "ga-card span2");
      c3.innerHTML = "<h3>Top pages — last 28 days</h3>";
      var prow = pages.rows || [];
      if (!prow.length) c3.appendChild(el("p", "dash-hint", "No traffic recorded yet — give it a day."));
      var maxPv = prow.length ? Number(prow[0].metricValues[0].value) || 1 : 1;
      prow.forEach(function (r) {
        var path = r.dimensionValues[0].value, n = Number(r.metricValues[0].value) || 0;
        var row = el("div", "ga-row");
        var bar = el("span", "ga-bar");
        bar.style.width = Math.max(2, Math.round((n / maxPv) * 40)) + "%";
        row.appendChild(el("span", "ga-path", MD.esc(path)));
        row.appendChild(bar);
        row.appendChild(el("b", null, String(n)));
        c3.appendChild(row);
      });
      charts.appendChild(c1); charts.appendChild(c2); charts.appendChild(c3);
      requestAnimationFrame(function () { drawLine(cv, vals.length ? vals : [0, 0]); });
    }
    function loadReports(pid) {
      propHost.innerHTML = "";
      say("Pulling live numbers…");
      if (GA_TIMER) { clearInterval(GA_TIMER); GA_TIMER = null; }
      var base = "https://analyticsdata.googleapis.com/v1beta/properties/" + pid;
      Promise.all([
        gaFetch(base + ":runReport", { dateRanges: [{ startDate: "28daysAgo", endDate: "today" }], dimensions: [{ name: "date" }], metrics: [{ name: "activeUsers" }], orderBys: [{ dimension: { dimensionName: "date" } }] }),
        gaFetch(base + ":runReport", { dateRanges: [{ startDate: "28daysAgo", endDate: "today" }], dimensions: [{ name: "pagePath" }], metrics: [{ name: "screenPageViews" }], orderBys: [{ metric: { metricName: "screenPageViews" }, desc: true }], limit: "8" }),
        gaFetch(base + ":runRealtimeReport", { metrics: [{ name: "activeUsers" }] })
      ]).then(function (res) {
        renderCharts(pid, res[0], res[1], res[2]);
        var chg = el("button", "dash-btn", "Switch property");
        chg.addEventListener("click", function () { set("analytics.gaPropertyId", ""); queueSave(); afterToken(); });
        var a3 = el("div", "dash-actions"); a3.appendChild(chg); propHost.appendChild(a3);
        say("Live.");
        GA_TIMER = setInterval(function () {
          if (!GA_TOKEN) { clearInterval(GA_TIMER); GA_TIMER = null; return; }
          gaFetch(base + ":runRealtimeReport", { metrics: [{ name: "activeUsers" }] }).then(function (r2) {
            var n2 = r2.rows && r2.rows[0] ? r2.rows[0].metricValues[0].value : "0";
            var elx = document.getElementById("ga-rt");
            if (elx) elx.textContent = n2;
          }).catch(function (e2) { if (e2 && e2.status === 401) { GA_TOKEN = null; } });
        }, 60000);
      }).catch(gaError);
    }
    connectBtn.addEventListener("click", function () {
      if (GA_TOKEN) { afterToken(); } else { connect(); }
    });

    p.appendChild(el("h2", null, "Monitoring and email alerts"));
    var monitor = el("div", "operator-note ga-monitor-note");
    monitor.innerHTML =
      '<p><b>Traffic and conversion problems:</b> GA4 Custom Insights can email you when traffic, conversions, or another Analytics metric crosses a threshold or behaves unusually. This is configured once in Analytics and adds no code or load to this site.</p>' +
      '<p><a href="https://support.google.com/analytics/answer/9443595" target="_blank" rel="noopener noreferrer">Open Google’s Custom Insights instructions</a></p>' +
      '<p><b>Checkout activity:</b> enable successful-payment notifications in your Stripe Dashboard or Gumroad account. Those providers already know whether a payment completed; this static site does not duplicate or store payment data.</p>' +
      '<p><b>Boundary:</b> Google Analytics can detect site-traffic and tracked-event anomalies. It cannot confirm that a separate app’s email-delivery system is healthy; that would require the app or email provider to expose monitoring.</p>';
    p.appendChild(monitor);
  }

  function paneSeo() {
    var p = $("#pane-seo");
    p.appendChild(el("p", "dash-hint", "Generate the SEO artifacts and drop them next to index.html when you deploy. They're built from current draft content — posts included."));
    var actions = el("div", "dash-actions");
    var out = el("pre", "seo-out", "Output appears here.");
    [
      ["sitemap.xml", "application/xml", genSitemap],
      ["rss.xml", "application/rss+xml", genRss],
      ["robots.txt", "text/plain", genRobots]
    ].forEach(function (spec) {
      var b = el("button", "dash-btn", "Generate " + spec[0]);
      b.addEventListener("click", function () {
        var txt = spec[2]();
        out.textContent = txt;
        download(spec[0], spec[1], txt);
        toast(spec[0] + " downloaded");
      });
      actions.appendChild(b);
    });
    p.appendChild(actions);
    p.appendChild(out);

    p.appendChild(el("h2", null, "Per-page titles & descriptions"));
    p.appendChild(el("p", "dash-hint", "Overrides applied at render time. Leave a field empty to keep the page's built-in tag. Post pages keep their per-post SEO."));
    if (!get("seo")) set("seo", {});
    var seoObj = get("seo");
    if (!seoObj.pages) seoObj.pages = {};
    [
      ["index.html", "Home"], ["sites.html", "Sites"], ["apps.html", "Apps"],
      ["photos.html", "Photos"], ["blog.html", "Blog"], ["builder.html", "Builder"],
      ["templates.html", "Templates"], ["estimate.html", "Estimate"]
    ].forEach(function (pg) {
      if (!seoObj.pages[pg[0]]) seoObj.pages[pg[0]] = { title: "", description: "" };
      var card = el("details", "item-card");
      card.innerHTML = '<summary><span class="grow">' + pg[1] + " — " + pg[0] + "</span></summary>";
      var fields = el("div", "item-fields");
      fields.appendChild(objField(seoObj.pages[pg[0]], "title", "Title tag override"));
      fields.appendChild(objField(seoObj.pages[pg[0]], "description", "Meta description override", { textarea: true }));
      card.appendChild(fields);
      p.appendChild(card);
    });

    p.appendChild(el("h2", null, "Verified facts registry"));
    p.appendChild(el("p", "dash-hint", "The complete closed registry the SEO layer can cite from. Adding a fact requires editing js/facts.js by hand and verifying the source yourself — by design, so a citation can never be hallucinated."));
    FACTS.registry.forEach(function (f) {
      p.appendChild(el("div", "fact-match",
        '<span class="fm-score">' + MD.esc(f.id) + "</span>" +
        "<b>" + MD.esc(f.value) + "</b> — " + MD.esc(f.claim) +
        '<p><a href="' + MD.esc(f.url) + '" target="_blank" rel="noopener noreferrer">' + MD.esc(f.source) + " (open)</a></p>"));
    });
  }

  // ── PANE: settings ──
  function paneSettings() {
    var p = $("#pane-settings");
    p.innerHTML = "";
    p.appendChild(el("h2", null, "Site meta"));
    p.appendChild(textField("Site name", "meta.siteName"));
    p.appendChild(textField("Base URL", "meta.baseUrl"));
    p.appendChild(textField("Contact email", "meta.email"));
    p.appendChild(textField("Publisher logo URL (blog schema only)", "meta.logo"));
    p.appendChild(el("p", "dash-hint", "The visible BNDR logo and static social-share image stay code-managed so this pane never promises a change that social crawlers cannot read from content.js."));

    p.appendChild(el("h2", null, "Navigation"));
    p.appendChild(el("p", "dash-hint", "Order and labels of the pill nav on every page. The Contact button stays pinned at the end."));
    if (!get("nav")) set("nav", {});
    var navObj = get("nav");
    if (!navObj.links || !navObj.links.length) {
      navObj.links = [
        { label: "Home", href: "index.html" },
        { label: "Sites", href: "sites.html" },
        { label: "Apps", href: "apps.html" },
        { label: "Photos", href: "photos.html" },
        { label: "Blog", href: "blog.html" },
        { label: "Builder", href: "builder.html" },
        { label: "Templates", href: "templates.html" },
        { label: "Estimate", href: "estimate.html" }
      ];
    }
    p.appendChild(listEditor({
      path: "nav.links",
      itemLabel: function (l) { return l.label + " → " + l.href; },
      blank: function () { return { label: "New link", href: "index.html" }; },
      fields: function (l, i, card) {
        return [
          objField(l, "label", "Label", { onInput: card.syncLabel }),
          objField(l, "href", "Href (e.g. sites.html or https://…)", { onInput: card.syncLabel })
        ];
      }
    }));

    if (CURRENT_ROLE !== "owner") {
      p.appendChild(el("p", "operator-note", "Temporary access can edit the assigned site settings above. Owner passphrase, access-key controls, backups, restore, draft reset, and logout controls remain owner-only."));
      return;
    }

    p.appendChild(el("h2", null, "Owner passphrase"));
    p.appendChild(el("p", "dash-hint", "Changes the passphrase in the draft. Publish + deploy for it to take effect on the live console."));
    var passField = el("div", "field");
    passField.innerHTML = "<label>Current passphrase</label>";
    var currentPassInput = el("input");
    currentPassInput.type = "password";
    currentPassInput.autocomplete = "current-password";
    currentPassInput.maxLength = 256;
    passField.appendChild(currentPassInput);
    var newPassLabel = el("label", null, "New passphrase (15–256 characters)");
    newPassLabel.style.marginTop = "12px";
    passField.appendChild(newPassLabel);
    var passInput = el("input");
    passInput.type = "password";
    passInput.autocomplete = "new-password";
    passInput.maxLength = 256;
    passField.appendChild(passInput);
    p.appendChild(passField);
    var passBtn = el("button", "dash-btn primary", "Set new passphrase");
    passBtn.addEventListener("click", function () {
      var v = passInput.value;
      if (v.length < 15) { toast("Use at least 15 characters — a short multi-word passphrase works well"); return; }
      verifyOwnerPassphrase(currentPassInput.value).then(function (okay) {
        if (!okay) throw new Error("Current passphrase is not correct");
        return newPassphraseRecord(v);
      }).then(function (record) {
        if (!W.owner) W.owner = {};
        set("owner.passKdf", record);
        delete W.owner.passHash;
        saveDraft();
        currentPassInput.value = "";
        passInput.value = "";
        toast("Passphrase updated in draft — publish to ship it");
      }).catch(function (e) { toast(e.message || "Could not secure the new passphrase"); });
    });
    var act1 = el("div", "dash-actions");
    act1.appendChild(passBtn);
    p.appendChild(act1);

    p.appendChild(el("h2", null, "Temporary professional access"));
    p.appendChild(el("p", "dash-hint", "Create signed links that expire automatically and expose only the work areas you select. The signing key stays in this browser; content.js receives only the public verification key. Links use a URL fragment, so the access code is not sent to the web host or Google Analytics."));
    var publicKey = get("owner.operatorPublicKey");
    var privateKey = getSigningKey();
    var privateMatches = publicKeysMatch(privateKey, publicKey);
    var deployedReady = publicKeysMatch(SHIP.owner && SHIP.owner.operatorPublicKey, publicKey);
    var keyState = el("p", "operator-note");
    if (!publicKey) keyState.textContent = "No operator key exists yet. Create one, then publish and deploy content.js once before issuing links.";
    else if (!privateMatches) keyState.textContent = "This browser does not hold the private half of the deployed key. Regenerate the key here and deploy the new content.js to revoke old links and restore link creation.";
    else if (!deployedReady) keyState.textContent = "The key is ready in this draft. Publish and deploy content.js, then reload this console. Link creation unlocks only after the public key is live.";
    else keyState.textContent = "Signing key active. Existing links remain valid only until their own expiry, or until you regenerate this key and deploy the replacement.";
    p.appendChild(keyState);

    var keyActions = el("div", "dash-actions");
    var keyBtn = el("button", "dash-btn", publicKey ? "Regenerate access key" : "Create access key");
    keyBtn.type = "button";
    keyBtn.addEventListener("click", function () {
      if (!cryptoReady()) { toast("WebCrypto is unavailable — use the deployed site over HTTPS"); return; }
      if (publicKey && !confirm("Regenerating and deploying a new key revokes every existing operator link. Continue?")) return;
      crypto.subtle.generateKey({ name: "ECDSA", namedCurve: "P-256" }, true, ["sign", "verify"])
        .then(function (pair) {
          return Promise.all([crypto.subtle.exportKey("jwk", pair.publicKey), crypto.subtle.exportKey("jwk", pair.privateKey)]);
        }).then(function (keys) {
          if (!W.owner) W.owner = {};
          set("owner.operatorPublicKey", keys[0]);
          set("owner.operatorRevokedNonces", []);
          localStorage.setItem(SIGNING_KEY, JSON.stringify(keys[1]));
          saveIssuedLinks([]);
          saveDraft(true);
          paneSettings();
          toast("Access key created — publish and deploy content.js");
        }).catch(function () { toast("The browser could not create the access key"); });
    });
    keyActions.appendChild(keyBtn);
    p.appendChild(keyActions);

    if (publicKey && privateMatches && deployedReady) {
      var expiryField = el("div", "field");
      expiryField.innerHTML = "<label>Link lifetime</label>";
      var expiry = el("select");
      [
        ["4 hours", 14400], ["8 hours", 28800], ["16 hours", 57600], ["24 hours", 86400]
      ].forEach(function (x) {
        var op = el("option", null, x[0]); op.value = x[1]; if (x[1] === 28800) op.selected = true; expiry.appendChild(op);
      });
      expiryField.appendChild(expiry);
      p.appendChild(expiryField);
      var scopeLabel = el("div", "field");
      scopeLabel.innerHTML = "<label>Allowed work areas</label>";
      var scopeGrid = el("div", "access-scope-grid");
      SCOPE_DEFS.forEach(function (scope) {
        var lab = el("label", "access-scope");
        var cb = el("input"); cb.type = "checkbox"; cb.value = scope.id;
        cb.checked = ["copy", "builder", "blog", "galleries", "footer", "intake"].indexOf(scope.id) > -1;
        lab.appendChild(cb); lab.appendChild(el("span", null, MD.esc(scope.label))); scopeGrid.appendChild(lab);
      });
      scopeLabel.appendChild(scopeGrid);
      p.appendChild(scopeLabel);
      var outputField = el("div", "field");
      outputField.innerHTML = "<label>Generated private link</label>";
      var accessOut = el("textarea", "access-output");
      accessOut.readOnly = true;
      accessOut.placeholder = "Generate a link, then send it only to the intended professional.";
      outputField.appendChild(accessOut);
      p.appendChild(outputField);
      var accessActions = el("div", "dash-actions");
      var makeLink = el("button", "dash-btn primary", "Generate expiring link");
      var copyLink = el("button", "dash-btn", "Copy link");
      makeLink.type = copyLink.type = "button";
      makeLink.addEventListener("click", function () {
        var selected = $$("input:checked", scopeGrid).map(function (n) { return n.value; });
        createOperatorCode(privateKey, selected, Number(expiry.value)).then(function (issued) {
          var base = location.href.split("#")[0];
          accessOut.value = base + "#access=" + issued.token;
          var ledger = issuedLinks();
          ledger.push({ nonce: issued.payload.nonce, iat: issued.payload.iat, exp: issued.payload.exp, scopes: issued.payload.scopes, cancelled: false });
          saveIssuedLinks(ledger);
          toast("Temporary access link generated");
        }).catch(function (e) { toast(e.message || "Could not generate the link"); });
      });
      copyLink.addEventListener("click", function () {
        if (!accessOut.value) { toast("Generate a link first"); return; }
        function copied() { toast("Private link copied"); }
        if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(accessOut.value).then(copied).catch(function () { accessOut.select(); document.execCommand("copy"); copied(); });
        else { accessOut.select(); document.execCommand("copy"); copied(); }
      });
      accessActions.appendChild(makeLink); accessActions.appendChild(copyLink); p.appendChild(accessActions);
      p.appendChild(el("p", "dash-hint", "Only the selected panes are shown, and disallowed content roots are restored before every save or export. The allotted window is enforced to the second, followed by a silent 10-minute grace period; the console then ends the session. Because this is a static site, deploy content.js after a cancellation so open consoles can observe it on their 60-second revocation check."));
    }

    if (publicKey) {
      p.appendChild(el("h2", null, "Issued access links"));
      p.appendChild(el("p", "dash-hint", "Cancel one link without regenerating the signing key. Only the random link identifier, scopes, and expiry are retained in this browser — never the private URL or signature."));
      var records = issuedLinks().slice().reverse();
      var deployedRevoked = revokedNonces(W);
      var ledgerHost = el("div", "issued-access-list");
      if (!records.length) ledgerHost.appendChild(el("p", "operator-note", "No links have been issued from this browser with the current key."));
      records.forEach(function (record) {
        var row = el("div", "issued-access-row");
        var isRevoked = record.cancelled || deployedRevoked.indexOf(record.nonce) > -1;
        var expired = record.exp + OPERATOR_GRACE_SECONDS <= Math.floor(Date.now() / 1000);
        var state = isRevoked ? "Cancelled" : expired ? "Expired" : "Active";
        var meta = el("div", "issued-access-meta");
        meta.innerHTML = '<b>' + state + '</b><span>' + new Date(record.exp * 1000).toLocaleString() + ' · ' + MD.esc((record.scopes || []).join(", ")) + '</span><code>' + MD.esc(String(record.nonce || "").slice(0, 12)) + "…</code>";
        row.appendChild(meta);
        if (!isRevoked && !expired) {
          var revoke = el("button", "dash-btn danger", "Cancel this link");
          revoke.type = "button";
          revoke.addEventListener("click", function () {
            if (!confirm("Cancel this one access link? Publish and deploy content.js immediately afterward.")) return;
            var list = revokedNonces(W);
            if (list.indexOf(record.nonce) === -1) list.push(record.nonce);
            set("owner.operatorRevokedNonces", list.slice(-200));
            var allRecords = issuedLinks();
            allRecords.forEach(function (x) { if (x.nonce === record.nonce) x.cancelled = true; });
            saveIssuedLinks(allRecords);
            saveDraft(true);
            paneSettings();
            toast("Link cancelled in draft — publish and deploy now");
          });
          row.appendChild(revoke);
        }
        ledgerHost.appendChild(row);
      });
      p.appendChild(ledgerHost);
    }

    p.appendChild(el("h2", null, "Danger zone"));
    var act2 = el("div", "dash-actions");
    var discard = el("button", "dash-btn danger", "Discard draft — revert to shipped");
    discard.addEventListener("click", function () {
      if (!confirm("Throw away every unpublished edit and reload from the shipped content.js?")) return;
      try { localStorage.removeItem(DRAFT_KEY); } catch (e) {}
      location.reload();
    });
    var logout = el("button", "dash-btn", "Log out");
    logout.addEventListener("click", function () {
      try { sessionStorage.removeItem(AUTH_KEY); } catch (e) {}
      location.reload();
    });
    var backup = el("button", "dash-btn", "Download draft backup (.json)");
    backup.addEventListener("click", function () {
      download("bndr-draft-backup-" + new Date().toISOString().slice(0, 10) + ".json", "application/json", JSON.stringify(W, null, 2));
      toast("Backup downloaded — keep it somewhere safe");
    });
    var restoreInput = el("input");
    restoreInput.type = "file"; restoreInput.accept = ".json,application/json"; restoreInput.style.display = "none";
    restoreInput.addEventListener("change", function () {
      var f = restoreInput.files && restoreInput.files[0];
      if (!f) return;
      var rd = new FileReader();
      rd.onload = function () {
        try {
          var data = JSON.parse(rd.result);
          if (!data || typeof data !== "object" || !data.meta) throw new Error("bad");
          localStorage.setItem(DRAFT_KEY, JSON.stringify(data));
          location.reload();
        } catch (e) { toast("That file isn't a BNDR draft backup"); }
      };
      rd.readAsText(f);
    });
    var restore = el("button", "dash-btn", "Restore from backup");
    restore.addEventListener("click", function () { restoreInput.click(); });
    act2.appendChild(backup);
    act2.appendChild(restore);
    act2.appendChild(discard);
    act2.appendChild(logout);
    p.appendChild(act2);
    p.appendChild(restoreInput);
  }

  // ── publish ──
  function exportContentJs() {
    if (!operatorIsActive()) { endOperatorSession(); return ""; }
    enforceScopeBoundary();
    var out = clone(W);
    // strip editor-only bridges
    (out.blog && out.blog.posts || []).forEach(function (p) { delete p.tagsText; });
    var header =
      "// BNDR content \u2014 single source of truth for every editable word on the site.\n" +
      "// Published from the owner console on " + new Date().toISOString() + "\n" +
      "// Markdown fields end in \"Md\" and render through js/md.js.\n";
    return header + "window.BNDR_CONTENT = " + JSON.stringify(out, null, 2) + ";\n";
  }

  // ── tabs ──
  /* Each editing pane previews its own public page, so an edit made on
     the Builder pane is seen on builder.html instead of the preview
     snapping back to Home on every autosave refresh. */
  var PANE_ROUTES = { copy: "index.html", builder: "builder.html", blog: "blog.html", galleries: "sites.html", footer: "index.html", intake: "estimate.html" };
  function syncPreviewRoute(paneId) {
    var route = PANE_ROUTES[paneId];
    var sel = $("#pv-route");
    if (!route || !sel || sel.value === route) return;
    sel.value = route;
    refreshPreview();
  }
  function wireTabs() {
    $$(".dash-tabs button").forEach(function (b) {
      b.addEventListener("click", function () {
        $$(".dash-tabs button").forEach(function (x) { x.classList.remove("on"); });
        $$(".dash-pane").forEach(function (x) { x.classList.remove("on"); });
        b.classList.add("on");
        var pane = $("#pane-" + b.getAttribute("data-pane"));
        if (pane) pane.classList.add("on");
        syncPreviewRoute(b.getAttribute("data-pane"));
      });
    });
  }

  function applyAccessScope() {
    if (CURRENT_ROLE === "owner") return;
    var first = null;
    $$(".dash-tabs button").forEach(function (b) {
      var id = b.getAttribute("data-pane");
      var allowed = CURRENT_SCOPES.indexOf(id) > -1;
      b.hidden = !allowed;
      b.classList.remove("on");
      var pane = $("#pane-" + id);
      if (pane) pane.classList.remove("on");
      if (allowed && !first) first = { button: b, pane: pane };
    });
    if (first) { first.button.classList.add("on"); if (first.pane) first.pane.classList.add("on"); }
  }

  // ── gate ──
  function openConsole(role, scopes, payload) {
    CURRENT_ROLE = role || "owner";
    CURRENT_SCOPES = CURRENT_ROLE === "owner" ? SCOPE_DEFS.map(function (s) { return s.id; }) : validScopes(scopes);
    CURRENT_OPERATOR = CURRENT_ROLE === "operator" ? payload : null;
    OPERATOR_BASELINE = CURRENT_ROLE === "operator" ? clone(W) : null;
    $("#gate").style.display = "none";
    $("#dash-shell").classList.add("on");
    var badge = $("#access-badge");
    if (CURRENT_ROLE === "operator") {
      var hours = Math.max(1, Math.ceil((payload.exp * 1000 - Date.now()) / 3600000));
      badge.textContent = "Temporary · " + hours + "h window";
      badge.classList.add("on");
    }
    paneCopy();
    paneBuilder();
    paneBlog();
    paneGalleries();
    paneFooter();
    paneIntake();
    paneAnalytics();
    paneSeo();
    paneSettings();
    wireTabs();
    wirePreview();
    applyAccessScope();
    if (CURRENT_ROLE === "operator") startOperatorEnforcement();
    $("#btn-save").addEventListener("click", function () { saveDraft(); });
    $("#btn-publish").addEventListener("click", function () {
      if (!saveDraft(true)) return;
      var out = exportContentJs();
      if (!out) return;
      var kb = Math.round(out.length / 1024);
      if (out.length > 750000 && !confirm("Heads up: content.js is " + kb + " KB — embedded images now add noticeable mobile cost because every page loads this file. Use hosted image URLs where practical. Publish anyway?")) return;
      var rot = (out.match(/dropboxusercontent\.com/g) || []).length;
      download("content.js", "text/javascript", out);
      toast("content.js exported — replace js/content.js and deploy" + (rot ? " · " + rot + " Dropbox-hosted image link" + (rot > 1 ? "s" : "") + " in content — Dropbox links can rot; consider re-uploading those images in Galleries/Settings" : ""));
    });
  }

  function boot() {
    var authed = false;
    try { authed = sessionStorage.getItem(AUTH_KEY) === "1"; } catch (e) {}
    if (authed) { openConsole("owner"); return; }
    var ownerRecord = (W && W.owner) || (SHIP && SHIP.owner) || {};
    var firstSetup = !(ownerRecord.passKdf && ownerRecord.passKdf.hash) && !ownerRecord.passHash;
    if (firstSetup) {
      $("#gate-copy").textContent = "Create the private owner passphrase before this site is deployed.";
      $("#gate-pass").placeholder = "New passphrase — 15 characters minimum";
      $("#gate-pass").autocomplete = "new-password";
      $("#gate-submit").textContent = "Create private access →";
      $(".gate-divider").style.display = "none";
      $("#operator-form").style.display = "none";
    }
    /* Owner recovery. The passphrase hash is one-way by design, so the
       honest path is a confirmed reset: pages and drafts are kept while
       credentials, signing keys, and issued access links are cleared,
       then first-run setup opens. Anyone with this browser profile
       could already clear the same storage by hand, so this discloses
       no additional power. */
    var resetBtn = $("#gate-reset");
    if (resetBtn) {
      if (firstSetup) resetBtn.style.display = "none";
      resetBtn.addEventListener("click", function () {
        var word = prompt("Reset owner access?\n\nYour pages and drafts are kept. The passphrase, temporary access links, and signing keys are cleared, and you will create a new passphrase right away. Re-publish content.js afterward so the new passphrase deploys.\n\nType RESET to continue.");
        if (word === null) return;
        if (word.trim() !== "RESET") { $("#gate-err").textContent = "Reset cancelled — type RESET exactly to confirm."; return; }
        if (!W.owner) W.owner = {};
        delete W.owner.passKdf;
        delete W.owner.passHash;
        delete W.owner.operatorPublicKey;
        delete W.owner.operatorRevokedNonces;
        try { localStorage.removeItem(SIGNING_KEY); } catch (e1) {}
        try { localStorage.removeItem(ISSUED_LINKS_KEY); } catch (e2) {}
        try { sessionStorage.removeItem(AUTH_KEY); } catch (e3) {}
        try { sessionStorage.removeItem(OPERATOR_AUTH_KEY); } catch (e4) {}
        try { localStorage.setItem(DRAFT_KEY, JSON.stringify(W)); } catch (e5) {}
        location.reload();
      });
    }
    function acceptOperator(value, remember) {
      return verifyOperatorCode(value).then(function (result) {
        if (remember) {
          try { sessionStorage.setItem(OPERATOR_AUTH_KEY, result.token); } catch (e) {}
        }
        if (location.hash) history.replaceState(null, "", location.pathname + location.search);
        openConsole("operator", result.payload.scopes, result.payload);
        return true;
      });
    }
    var hashToken = new URLSearchParams(location.hash.replace(/^#/, "")).get("access");
    var storedOperator = "";
    try { storedOperator = sessionStorage.getItem(OPERATOR_AUTH_KEY) || ""; } catch (e2) {}
    if (hashToken || storedOperator) {
      acceptOperator(hashToken || storedOperator, true).catch(function (err) {
        try { sessionStorage.removeItem(OPERATOR_AUTH_KEY); } catch (e3) {}
        $("#operator-err").textContent = err.message || "That access code could not be verified.";
      });
    }
    var form = $("#gate-form");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      var pass = $("#gate-pass").value;
      if (firstSetup) {
        if (pass.length < 15) { $("#gate-err").textContent = "Use at least 15 characters — a short multi-word passphrase works well."; return; }
        newPassphraseRecord(pass).then(function (record) {
          if (!W.owner) W.owner = {};
          W.owner.passKdf = record;
          delete W.owner.passHash;
          localStorage.setItem(DRAFT_KEY, JSON.stringify(W));
          try { sessionStorage.setItem(AUTH_KEY, "1"); } catch (e2) {}
          openConsole("owner");
          toast("Private access created in this draft — export content.js before deploying");
        }).catch(function () { $("#gate-err").textContent = "Secure setup needs a modern HTTPS browser."; });
        return;
      }
      verifyOwnerPassphrase(pass).then(function (okay) {
        if (okay) {
          try { sessionStorage.setItem(AUTH_KEY, "1"); } catch (e2) {}
          try { sessionStorage.removeItem(OPERATOR_AUTH_KEY); } catch (e3) {}
          openConsole("owner");
        } else {
          var err = $("#gate-err");
          err.textContent = "Not it. Try again.";
          form.classList.remove("shake");
          void form.offsetWidth;
          form.classList.add("shake");
        }
      }).catch(function () { $("#gate-err").textContent = "Secure sign-in is unavailable in this browser."; });
    });
    var operatorForm = $("#operator-form");
    operatorForm.addEventListener("submit", function (e) {
      e.preventDefault();
      var field = $("#operator-code");
      var err = $("#operator-err");
      err.textContent = "Checking…";
      acceptOperator(field.value, true).catch(function (problem) {
        err.textContent = problem.message || "That access code could not be verified.";
        operatorForm.classList.remove("shake");
        void operatorForm.offsetWidth;
        operatorForm.classList.add("shake");
      });
    });
  }

  boot();
})();
