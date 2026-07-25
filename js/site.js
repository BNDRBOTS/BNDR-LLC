/* BNDR site runtime — rendering, vibes, galleries, purchase, motion.
   No frameworks. Content comes from js/content.js (window.BNDR_CONTENT),
   markdown renders via js/md.js, verified facts via js/facts.js.
   Draft mode: dashboard saves to localStorage; any page opened with
   ?draft=1 renders the draft instead of the shipped content. */
(function () {
  "use strict";

  var MD = window.BNDRMD;
  var FACTS = window.BNDRFACTS;

  /* ── content + draft overlay ──────────────────────────────── */
  var C = window.BNDR_CONTENT || {};
  var isDraft = /[?&]draft=1/.test(location.search);
  if (isDraft) {
    try {
      var d = localStorage.getItem("bndr.draft.v3");
      if (d) C = JSON.parse(d);
    } catch (e) { /* storage blocked — ship content renders */ }
  }
  window.BNDR_LIVE = C;

  function get(path, fallback) {
    var cur = C;
    var parts = path.split(".");
    for (var i = 0; i < parts.length; i++) {
      if (cur == null) return fallback;
      cur = cur[parts[i]];
    }
    return cur == null ? fallback : cur;
  }

  function el(tag, cls, html) {
    var n = document.createElement(tag);
    if (cls) n.className = cls;
    if (html != null) n.innerHTML = html;
    return n;
  }

  /* One code-native arrow everywhere prevents mobile browsers from replacing
     the old diagonal-arrow character with a colored emoji glyph. */
  function linkArrow() {
    return '<span class="link-arrow" aria-hidden="true"><svg viewBox="0 0 16 16" focusable="false"><path d="M5 3h8v8M13 3 3 13"/></svg></span>';
  }

  /* Hosted checkout is deliberately allow-listed. A typo or pasted unrelated
     URL can never become a purchase button on the public site. */
  function paymentLinkInfo(value) {
    try {
      var url = new URL(String(value || ""));
      var host = url.hostname.toLowerCase();
      if (url.protocol !== "https:" || url.username || url.password) return null;
      if (host === "buy.stripe.com" || host === "checkout.stripe.com") return { url: url.href, provider: "Stripe" };
      if (host === "gumroad.com" || host === "www.gumroad.com" || host === "gum.co" || /\.gumroad\.com$/.test(host)) return { url: url.href, provider: "Gumroad" };
    } catch (e) { /* invalid URL: no checkout control is rendered */ }
    return null;
  }

  function safePublicUrl(value) {
    try {
      var url = new URL(String(value || ""), location.href);
      return url.protocol === "https:" && !url.username && !url.password ? url.href : "";
    } catch (e) { return ""; }
  }
  function safeNavUrl(value) {
    var raw = String(value || "").trim();
    if (/^(?:(?:[A-Za-z0-9_-]+\/)*[A-Za-z0-9_-]+\.html)(?:[?#][^\s]*)?$/.test(raw)) return raw;
    return safePublicUrl(raw);
  }
  function safeImageUrl(value) {
    var raw = String(value || "").trim();
    if (/^data:image\/(?:png|jpeg|webp|gif);base64,[a-z0-9+/=]+$/i.test(raw)) return raw;
    return safePublicUrl(raw);
  }

  var noticeTimer = 0;
  function siteNotice(message) {
    var n = document.querySelector(".site-notice");
    if (!n) {
      n = el("div", "site-notice");
      n.setAttribute("role", "status");
      n.setAttribute("aria-live", "polite");
      document.body.appendChild(n);
    }
    n.textContent = message;
    n.classList.add("on");
    clearTimeout(noticeTimer);
    noticeTimer = setTimeout(function () { n.classList.remove("on"); }, 2600);
  }

  function withDraft(href) {
    if (!isDraft) return href;
    return href + (href.indexOf("?") > -1 ? "&" : "?") + "draft=1";
  }

  /* ── finished site footer ─────────────────────────────────────
     Brand marks and colors are code presets, never editable copy.
     content.js controls only platform order, enabled state, and URL. */
  // The supplied logo is kept local so the footer never waits on a third-party host.
  var FOOTER_LOGO = "assets/bndr-logo.png";
  var FOOTER_DEFAULT_SOCIAL = [
    { id: "linkedin", enabled: true, url: "https://www.linkedin.com/in/bndrtech/" },
    { id: "github", enabled: true, url: "https://github.com/bndrbots" },
    { id: "instagram", enabled: true, url: "https://www.instagram.com/bndrllc" },
    { id: "facebook", enabled: true, url: "https://www.facebook.com/BNDRLLC" },
    { id: "substack", enabled: true, url: "https://substack.com/@bndrllc" },
    { id: "buymeacoffee", enabled: true, url: "https://buymeacoffee.com/bndr" },
    { id: "gumroad", enabled: true, url: "https://bndrllc.gumroad.com" },
    { id: "promptbase", enabled: true, url: "https://promptbase.com/profile/bndrllc" },
    { id: "x", enabled: false, url: "" },
    { id: "youtube", enabled: false, url: "" },
    { id: "tiktok", enabled: false, url: "" },
    { id: "discord", enabled: false, url: "" },
    { id: "etsy", enabled: false, url: "" },
    { id: "patreon", enabled: false, url: "" },
    { id: "threads", enabled: false, url: "" },
    { id: "dribbble", enabled: false, url: "" }
  ];
  var FOOTER_PRESETS = {
    linkedin: { label: "LinkedIn", color: "#0A66C2", mark: '<path d="M20.45 20.45h-3.56v-5.57c0-1.33-.03-3.04-1.86-3.04-1.86 0-2.15 1.45-2.15 2.94v5.67H9.32V8.98h3.42v1.57h.05c.48-.9 1.64-1.85 3.37-1.85 3.6 0 4.27 2.37 4.27 5.46v6.29zM5.3 7.41a2.07 2.07 0 1 1 0-4.13 2.07 2.07 0 0 1 0 4.13zM7.08 20.45H3.52V8.98h3.56v11.47zM22.22 0H1.78C.8 0 0 .78 0 1.75v20.5C0 23.22.8 24 1.78 24h20.44c.98 0 1.78-.78 1.78-1.75V1.75C24 .78 23.2 0 22.22 0z"/>' },
    github: { label: "GitHub", color: "#F0F6FC", mark: '<path d="M12 .3A12 12 0 0 0 8.2 23.68c.6.11.82-.26.82-.58l-.02-2.04c-3.34.72-4.04-1.61-4.04-1.61-.55-1.39-1.34-1.76-1.34-1.76-1.09-.74.08-.73.08-.73 1.21.08 1.84 1.24 1.84 1.24 1.07 1.83 2.81 1.3 3.5 1 .11-.78.42-1.31.76-1.61-2.67-.3-5.47-1.33-5.47-5.93 0-1.31.47-2.38 1.24-3.22-.14-.3-.54-1.52.1-3.18 0 0 1.01-.32 3.3 1.23a11.5 11.5 0 0 1 6 0c2.28-1.55 3.29-1.23 3.29-1.23.64 1.66.24 2.88.12 3.18.76.84 1.23 1.91 1.23 3.22 0 4.61-2.81 5.63-5.48 5.92.42.36.81 1.1.81 2.22l-.02 3.29c0 .31.21.69.83.57A12 12 0 0 0 12 .3z"/>' },
    instagram: { label: "Instagram", color: "url(#bndr-instagram-gradient)", mark: '<defs><linearGradient id="bndr-instagram-gradient" x1="2" y1="22" x2="22" y2="2" gradientUnits="userSpaceOnUse"><stop stop-color="#FEDA75"/><stop offset=".26" stop-color="#FA7E1E"/><stop offset=".52" stop-color="#D62976"/><stop offset=".76" stop-color="#962FBF"/><stop offset="1" stop-color="#4F5BD5"/></linearGradient></defs><path d="M7 2h10a5 5 0 0 1 5 5v10a5 5 0 0 1-5 5H7a5 5 0 0 1-5-5V7a5 5 0 0 1 5-5zm0 2a3 3 0 0 0-3 3v10a3 3 0 0 0 3 3h10a3 3 0 0 0 3-3V7a3 3 0 0 0-3-3H7zm10.5 1.5a1.25 1.25 0 1 1 0 2.5 1.25 1.25 0 0 1 0-2.5zM12 7a5 5 0 1 1 0 10 5 5 0 0 1 0-10zm0 2a3 3 0 1 0 0 6 3 3 0 0 0 0-6z"/>' },
    facebook: { label: "Facebook", color: "#0866FF", mark: '<path d="M9.1 23.69v-7.98H6.63v-3.67H9.1v-1.58c0-4.08 1.85-5.98 5.86-5.98.4 0 .95.04 1.47.11.51.06.89.13 1.14.19v3.33a8.6 8.6 0 0 0-.65-.04l-.74-.01c-.7 0-1.26.1-1.67.31-.3.15-.53.36-.68.62-.26.42-.38 1-.38 1.75v1.3h3.92l-.67 3.67h-3.25v8.24A12 12 0 1 0 9.1 23.69z"/>' },
    substack: { label: "Substack", color: "#FF6719", mark: '<path d="M22.54 8.24H1.46V5.41h21.08v2.83zM1.46 10.81V24L12 18.11 22.54 24V10.81H1.46zM22.54 0H1.46v2.84h21.08V0z"/>' },
    buymeacoffee: { label: "Buy Me a Coffee", color: "#FFDD00", mark: '<path d="M4 5h13.7l-.34 3H19a3 3 0 0 1 0 6h-2.3l-.5 4.6A3.8 3.8 0 0 1 12.42 22H8.58a3.8 3.8 0 0 1-3.78-3.4L3.3 5H4zm12.47 7H19a1 1 0 0 0 0-2h-2.3l-.23 2zM5.53 7l1.28 11.38A1.8 1.8 0 0 0 8.6 20h3.8a1.8 1.8 0 0 0 1.79-1.62L15.47 7H5.53zM6 1.5C7.45.5 9.38 0 11.8 0c2.32 0 4.4.5 6.2 1.5-.12 1.1-1.22 1.88-2.28 1.55A13.6 13.6 0 0 0 11.8 2.5c-1.46 0-2.69.18-3.68.53C7.06 3.4 6.1 2.6 6 1.5z"/>' },
    gumroad: { label: "Gumroad", color: "#FF90E8", mark: '<path d="M12 0a12 12 0 1 0 0 24 12 12 0 0 0 0-24zm0 5.12c4.48 0 6 3.03 6.06 4.74h-3.24c-.07-.96-.9-2.4-2.9-2.4-2.13 0-3.51 1.85-3.51 4.12 0 2.27 1.38 4.13 3.51 4.13 1.93 0 2.76-1.51 3.11-3.03h-3.11v-1.24h6.51v6.33h-2.85v-3.99c-.21 1.44-1.1 4.27-4.62 4.27s-5.58-2.82-5.58-6.33c0-3.65 2.27-6.6 6.62-6.6z"/>' },
    promptbase: { label: "PromptBase", color: "url(#bndr-promptbase-gradient)", mark: '<defs><linearGradient id="bndr-promptbase-gradient" x1="2" y1="21" x2="22" y2="3" gradientUnits="userSpaceOnUse"><stop stop-color="#FF8DB3"/><stop offset=".18" stop-color="#FFAD7D"/><stop offset=".34" stop-color="#F4DF86"/><stop offset=".51" stop-color="#9EE5B1"/><stop offset=".68" stop-color="#71C9C1"/><stop offset=".84" stop-color="#62A4CE"/><stop offset="1" stop-color="#8F78D0"/></linearGradient></defs><path d="M10.7 2.1A5.8 5.8 0 0 0 5 7a4.7 4.7 0 0 0-1.8 7.9A4.9 4.9 0 0 0 8 21.8h2.7v-5H8.8v-1.7h1.9v-2.2H7.5v-1.8h3.2V8.9H8.9V7.2h1.8V2.1zm2.6 0v5.1h1.8v1.7h-1.8v2.2h3.2v1.8h-3.2v2.2h1.9v1.7h-1.9v5H16a4.9 4.9 0 0 0 4.8-6.9A4.7 4.7 0 0 0 19 7a5.8 5.8 0 0 0-5.7-4.9z"/>' },
    x: { label: "X", color: "#FFFFFF", mark: '<path d="M14.23 10.16 22.98 0h-2.07l-7.6 8.82L7.25 0h-7l9.17 13.34L.26 24h2.07l8.02-9.32L16.75 24h6.99l-9.51-13.84zm-2.83 3.3-.93-1.33L3.08 1.56h3.18l5.96 8.53.93 1.33 7.75 11.09h-3.18L11.4 13.46z"/>' },
    youtube: { label: "YouTube", color: "#FF0000", mark: '<path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.55 12 3.55 12 3.55s-7.5 0-9.38.5A3.02 3.02 0 0 0 .5 6.19C0 8.07 0 12 0 12s0 3.93.5 5.81a3.02 3.02 0 0 0 2.12 2.14c1.88.5 9.38.5 9.38.5s7.5 0 9.38-.5a3.02 3.02 0 0 0 2.12-2.14C24 15.93 24 12 24 12s0-3.93-.5-5.81zM9.55 15.57V8.43L15.82 12l-6.27 3.57z"/>' },
    tiktok: { label: "TikTok", color: "#25F4EE", mark: '<path d="M12.53.02h3.91a5.88 5.88 0 0 0 5.99 5.94v4.03a10 10 0 0 1-5.82-1.9l-.02 8.75a7.5 7.5 0 1 1-6.27-7.76v4.44a3.33 3.33 0 1 0 2.11 3.93c.1-1.79.06-3.57.07-5.36l.03-12.07z"/>' },
    discord: { label: "Discord", color: "#5865F2", mark: '<path d="M20.32 4.37a19.8 19.8 0 0 0-4.89-1.52c-.21.38-.44.87-.61 1.25a20.6 20.6 0 0 0-5.49 0c-.16-.39-.4-.87-.62-1.25a19.7 19.7 0 0 0-4.88 1.52C.53 9.05-.32 13.58.1 18.06a20 20 0 0 0 6 3.03c.46-.63.87-1.3 1.22-2a12.3 12.3 0 0 1-1.87-.89l.36-.29a14 14 0 0 0 12.06 0l.37.29c-.6.34-1.22.64-1.87.89.36.7.77 1.36 1.23 2a20 20 0 0 0 6-3.03c.5-5.18-.84-9.67-3.55-13.66zM8.02 15.33c-1.18 0-2.16-1.09-2.16-2.42s.96-2.42 2.16-2.42c1.21 0 2.18 1.1 2.16 2.42 0 1.33-.96 2.42-2.16 2.42zm7.97 0c-1.18 0-2.15-1.09-2.15-2.42s.95-2.42 2.15-2.42c1.21 0 2.18 1.1 2.16 2.42 0 1.33-.95 2.42-2.16 2.42z"/>' },
    etsy: { label: "Etsy", color: "#F16521", mark: '<path d="M8.56 2.45c0-.33.03-.52.59-.52h7.46c1.3 0 2.02 1.11 2.54 3.19l.42 1.67h1.27L21.27 0s-3.2.36-5.09.36H6.64L1.52.2v1.37l1.73.33c1.21.24 1.5.5 1.6 1.6 0 0 .11 3.27.11 8.64l-.09 8.61c0 .97-.39 1.33-1.59 1.57l-1.72.33V24l5.13-.17h8.55c1.93 0 6.39.17 6.39.17.1-1.17.75-6.48.85-7.06h-1.2L20 19.85c-1 2.28-2.48 2.44-4.11 2.44h-4.91c-1.63 0-2.42-.64-2.42-2.05V12.8s3.62 0 4.79.1c.91.06 1.46.32 1.76 1.6l.39 1.69h1.41l-.09-4.28.19-4.3h-1.39l-.45 1.89c-.28 1.24-.48 1.47-1.75 1.6-1.67.17-4.82.14-4.82.14V2.45h-.04z"/>' },
    patreon: { label: "Patreon", color: "#FF424D", mark: '<path d="M22.96 7.21c0-3.06-2.39-5.58-5.19-6.48-3.48-1.13-8.06-.96-11.39.6-4.02 1.9-5.29 6.06-5.33 10.21C1 14.95 1.35 23.94 6.42 24c3.76.05 4.32-4.8 6.06-7.14 1.24-1.66 2.84-2.13 4.8-2.62 3.38-.83 5.68-3.5 5.68-7.03z"/>' },
    threads: { label: "Threads", color: "#FFFFFF", mark: '<path d="M12.19 24c-3.59-.02-6.34-1.2-8.19-3.51C2.35 18.44 1.5 15.59 1.47 12 1.5 8.42 2.35 5.57 4 3.51 5.85 1.2 8.6.02 12.18 0c2.75.02 5.05.73 6.84 2.1 1.67 1.29 2.85 3.13 3.51 5.47l-2.04.56c-1.11-3.96-3.9-5.98-8.3-6.01-2.91.02-5.11.94-6.54 2.72C4.31 6.5 3.62 8.91 3.59 12c.03 3.09.72 5.5 2.06 7.16 1.43 1.79 3.63 2.7 6.54 2.72 2.62-.02 4.36-.63 5.8-2.04 1.65-1.62 1.62-3.6 1.09-4.8a3.8 3.8 0 0 0-1.64-1.75c-.19 1.35-.62 2.44-1.28 3.27-.89 1.1-2.14 1.7-3.73 1.79-1.2.06-2.36-.22-3.26-.8a3.67 3.67 0 0 1-1.75-2.97c-.07-1.19.41-2.28 1.33-3.08.88-.76 2.12-1.2 3.58-1.29 1.02-.06 2.03 0 3.02.14-.13-.74-.38-1.33-.75-1.75-.52-.59-1.31-.89-2.36-.89-.84 0-1.99.23-2.72 1.32L7.73 7.85c.98-1.46 2.57-2.26 4.48-2.26 3.24.02 5.14 1.97 5.33 5.39 1.66.7 2.89 1.8 3.48 3.21.8 1.82.87 4.79-1.55 7.16-1.85 1.81-4.09 2.63-7.28 2.65zm1-11.69c-.24 0-.49.01-.74.02-1.84.1-2.98.95-2.92 2.14.07 1.26 1.45 1.84 2.79 1.77 1.22-.07 2.82-.55 3.08-3.71-.73-.15-1.47-.22-2.21-.22z"/>' },
    dribbble: { label: "Dribbble", color: "#EA4C89", mark: '<path d="M12 24a12 12 0 1 1 0-24 12 12 0 0 1 0 24zm10.12-10.36c-.35-.11-3.17-.95-6.38-.44 1.34 3.69 1.89 6.69 1.99 7.31a10.26 10.26 0 0 0 4.39-6.87zm-6.11 7.81c-.16-.9-.75-4.03-2.2-7.77l-.06.02c-5.79 2.01-7.86 6.02-8.04 6.4A10.19 10.19 0 0 0 12 22.27c1.42 0 2.77-.29 4.01-.82zM4.39 18.87c.23-.4 3.04-5.06 8.33-6.77l.4-.12c-.26-.58-.54-1.16-.83-1.74C7.17 11.78 2.21 11.71 1.76 11.7v.31c0 2.64 1 5.04 2.63 6.86zM1.97 9.92c.46.01 4.68.03 9.47-1.25-1.7-3.02-3.53-5.56-3.8-5.93a10.27 10.27 0 0 0-5.67 7.18zM9.6 2.05c.28.38 2.14 2.91 3.82 6 3.65-1.37 5.19-3.44 5.37-3.7A10.2 10.2 0 0 0 9.6 2.05zm10.34 3.48c-.22.29-1.94 2.5-5.73 4.04.24.49.47.99.68 1.49l.22.53c3.41-.43 6.8.26 7.14.33a10.2 10.2 0 0 0-2.31-6.39z"/>' }
  };

  function cleanSocialUrl(value) {
    try {
      var u = new URL(String(value || ""), location.href);
      return u.protocol === "https:" && !u.username && !u.password ? u.href : "";
    } catch (e) { return ""; }
  }

  function renderSiteFooter() {
    var host = document.querySelector(".site-footer");
    if (!host) return;
    host.innerHTML =
      '<div class="container site-footer-shell">' +
        '<div class="site-footer-identity">' +
          '<a class="site-footer-logo" href="index.html" aria-label="BNDR — home"><img src="' + FOOTER_LOGO + '" alt="BNDR LLC" decoding="async" loading="lazy" /></a>' +
          '<p>Designed, built, and shipped direct from Phoenix.</p>' +
        '</div>' +
        '<div class="site-footer-connect"><span class="site-footer-kicker">Find BNDR</span><nav class="site-footer-socials" aria-label="BNDR on other platforms"></nav></div>' +
        '<nav class="site-footer-links" aria-label="Footer navigation">' +
          '<a href="sites.html">Sites</a><a href="apps.html">Apps</a><a href="photos.html">Photos</a><a href="blog.html">Blog</a>' +
          '<a href="builder.html">Builder</a><a href="templates.html">Templates</a><a href="estimate.html">Estimate</a><a href="privacy.html">Privacy</a><a href="terms.html">Terms</a>' +
        '</nav>' +
        '<div class="site-footer-meta"><span class="phx-clock" id="phx-clock">PHX · AZ</span><span>© ' + new Date().getFullYear() + ' BNDR LLC</span><a class="site-footer-owner" href="dashboard.html" aria-label="Owner console"><span aria-hidden="true">◇</span> Owner</a></div>' +
      '</div>';

    var logo = host.querySelector(".site-footer-logo img");
    logo.addEventListener("error", function () {
      var word = el("span", "site-footer-word", "BNDR<sup>™</sup>");
      logo.parentNode.replaceChild(word, logo);
    });

    var socialHost = host.querySelector(".site-footer-socials");
    var config = C.footer && Array.isArray(C.footer.social) ? C.footer.social : FOOTER_DEFAULT_SOCIAL;
    config.forEach(function (item, index) {
      var preset = item && FOOTER_PRESETS[item.id];
      var href = item && item.enabled ? cleanSocialUrl(item.url) : "";
      if (!preset || !href) return;
      var a = el("a", "site-footer-social");
      a.href = href;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.setAttribute("aria-label", preset.label + " — opens in a new tab");
      a.style.setProperty("--brand", preset.color);
      a.style.setProperty("--glint-delay", ((index * 2.15) % 13).toFixed(2) + "s");
      a.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + preset.mark + "</svg>";
      a.addEventListener("pointerdown", function () {
        a.classList.remove("is-glinting");
        void a.offsetWidth;
        a.classList.add("is-glinting");
        setTimeout(function () { a.classList.remove("is-glinting"); }, 900);
      });
      socialHost.appendChild(a);
    });
  }

  renderSiteFooter();

  /* ── data-md / data-text bindings ────────────────────────────── */
  document.querySelectorAll("[data-md]").forEach(function (n) {
    var v = get(n.getAttribute("data-md"));
    if (v != null) n.innerHTML = MD.render(v);
  });
  document.querySelectorAll("[data-text]").forEach(function (n) {
    var v = get(n.getAttribute("data-text"));
    if (v != null) n.textContent = MD.plain(v);
  });

  /* keep internal nav inside draft mode */
  if (isDraft) {
    document.querySelectorAll('a[href$=".html"], a[href^="post.html"]').forEach(function (a) {
      if (a.host === location.host) a.href = withDraft(a.getAttribute("href"));
    });
  }

  /* ── hero value chips ──────────────────────────────────────── */
  var heroVals = document.getElementById("hero-values");
  if (heroVals) {
    var hvList = get("hero.values");
    if (hvList && hvList.length) {
      heroVals.innerHTML = "";
      hvList.forEach(function (v) {
        var li = document.createElement("li");
        li.textContent = v;
        heroVals.appendChild(li);
      });
    }
  }

  /* ── nav current state ──────────────────────────────────────── */
  var here = location.pathname.split("/").pop() || "index.html";

  /* nav: console-managed when content carries nav.links */
  var navHost = document.querySelector(".nav-pill");
  var navLinks = C.nav && C.nav.links;
  if (navHost && navLinks && navLinks.length) {
    var navCta = navHost.querySelector(".nav-cta");
    navHost.innerHTML = "";
    navLinks.forEach(function (l) {
      var href = l && safeNavUrl(l.href);
      if (!l || !l.label || !href) return;
      var a = document.createElement("a");
      a.href = href;
      a.textContent = l.label;
      navHost.appendChild(a);
    });
    if (navCta) navHost.appendChild(navCta);
  }

  /* per-page SEO overrides: console-managed when present */
  var seoPage = C.seo && C.seo.pages && C.seo.pages[here];
  if (seoPage) {
    if (seoPage.title) document.title = seoPage.title;
    if (seoPage.description) {
      var mdesc = document.querySelector('meta[name="description"]');
      if (mdesc) mdesc.setAttribute("content", seoPage.description);
    }
  }

  document.querySelectorAll(".nav-pill a").forEach(function (a) {
    var target = a.getAttribute("href").split("?")[0];
    if (target === here || (here === "post.html" && target === "blog.html")) a.setAttribute("aria-current", "page");
  });

  /* ── reveals ─────────────────────────────────────────────────── */
  var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  function armReveals(scope) {
    var nodes = (scope || document).querySelectorAll(".io:not(.in)");
    if (reduced || !("IntersectionObserver" in window)) {
      nodes.forEach(function (n) { n.classList.add("in"); });
      return;
    }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("in"); io.unobserve(en.target); }
      });
    }, { rootMargin: "0px 0px -8% 0px" });
    nodes.forEach(function (n) { io.observe(n); });
  }

  /* ── count-up ───────────────────────────────────────────────── */
  function armCounters() {
    var vals = document.querySelectorAll(".proof-value[data-final]");
    if (!vals.length) return;
    function run(nEl) {
      var final = nEl.getAttribute("data-final");
      var num = parseFloat(final.replace(/[^0-9.]/g, ""));
      if (reduced || isNaN(num)) { nEl.textContent = final; return; }
      var t0 = null, dur = 1100;
      var prefix = final.match(/^[^0-9]*/)[0];
      var suffix = final.replace(/^[^0-9]*[0-9.]+/, "");
      var dec = (final.match(/\.(\d+)/) || [, ""])[1].length;
      function step(ts) {
        if (!t0) t0 = ts;
        var p = Math.min(1, (ts - t0) / dur);
        var eased = 1 - Math.pow(1 - p, 4);
        nEl.textContent = prefix + (num * eased).toFixed(dec) + suffix;
        if (p < 1) requestAnimationFrame(step); else nEl.textContent = final;
      }
      requestAnimationFrame(step);
    }
    if (!("IntersectionObserver" in window)) { vals.forEach(function (v) { v.textContent = v.getAttribute("data-final"); }); return; }
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } });
    }, { threshold: 0.4 });
    vals.forEach(function (v) { io.observe(v); });
  }

  /* ── vibe engine ────────────────────────────────────────────── */
  function setVibe(v) { document.body.setAttribute("data-vibe", v || "plasma"); }

  /* ── immersive modal ────────────────────────────────────────── */
  var imm = null, lastFocus = null;
  function immersive() {
    if (imm) return imm;
    imm = el("div", "immersive");
    imm.setAttribute("role", "dialog");
    imm.setAttribute("aria-modal", "true");
    imm.innerHTML =
      '<div class="immersive-bar">' +
      '<span class="dock-label">LIVE</span>' +
      '<span class="dock-title"></span>' +
      '<a class="imm-open" target="_blank" rel="noopener noreferrer">Open full' + linkArrow() + "</a>" +
      '<button class="immersive-close" aria-label="Close preview">×</button>' +
      "</div>" +
      '<div class="immersive-stage"></div>';
    document.body.appendChild(imm);
    imm.querySelector(".immersive-close").addEventListener("click", closeImmersive);
    imm.addEventListener("click", function (e) { if (e.target === imm) closeImmersive(); });
    return imm;
  }
  function openImmersive(opts) {
    lastFocus = document.activeElement;
    var m = immersive();
    m.querySelector(".dock-title").textContent = opts.title || "";
    var openLink = m.querySelector(".imm-open");
    if (opts.url) { openLink.style.display = ""; openLink.href = opts.url; } else { openLink.style.display = "none"; }
    var stage = m.querySelector(".immersive-stage");
    stage.innerHTML = '<div class="stage-fallback">LOADING…</div>';
    if (opts.img) {
      var im = new Image();
      im.src = opts.img; im.alt = opts.title || "";
      im.onload = function () { stage.innerHTML = ""; stage.appendChild(im); };
      im.onerror = function () { stage.querySelector(".stage-fallback").textContent = "IMAGE UNAVAILABLE"; };
    } else if (opts.url) {
      var fr = document.createElement("iframe");
      fr.title = (opts.title || "Preview") + " — live preview";
      fr.loading = "eager";
      fr.addEventListener("load", function () { var f = stage.querySelector(".stage-fallback"); if (f) f.remove(); });
      fr.src = opts.url;
      stage.appendChild(fr);
      setTimeout(function () { var f = stage.querySelector(".stage-fallback"); if (f) f.textContent = "PREVIEW BLOCKED BY ITS HOST — USE OPEN FULL"; }, 4000);
    }
    m.classList.add("open");
    document.documentElement.style.overflow = "hidden";
    m.querySelector(".immersive-close").focus();
  }
  function closeImmersive() {
    if (!imm) return;
    imm.classList.remove("open");
    imm.querySelector(".immersive-stage").innerHTML = "";
    document.documentElement.style.overflow = "";
    if (lastFocus) lastFocus.focus();
  }
  document.addEventListener("keydown", function (e) {
    if (e.key === "Escape") { closeImmersive(); closePurchase(); }
  });

  /* ── purchase flow ───────────────────────────────────────────── */
  var purch = null;
  function purchase() {
    if (purch) return purch;
    purch = el("div", "purchase");
    purch.setAttribute("role", "dialog");
    purch.setAttribute("aria-modal", "true");
    purch.innerHTML =
      '<div class="purchase-sheet">' +
      '<div class="purchase-kicker"></div>' +
      '<h3 class="purchase-title"></h3>' +
      '<div class="purchase-price"></div>' +
      '<p class="purchase-note"></p>' +
      '<div class="purchase-actions"></div>' +
      '<button class="purchase-close">CLOSE</button>' +
      "</div>";
    document.body.appendChild(purch);
    purch.querySelector(".purchase-close").addEventListener("click", closePurchase);
    purch.addEventListener("click", function (e) { if (e.target === purch) closePurchase(); });
    return purch;
  }
  function closePurchase() { if (purch) { purch.classList.remove("open"); document.documentElement.style.overflow = ""; } }
  function openPurchase(item, kind) {
    var p = purchase();
    var email = get("meta.email", "bndr.labs@gmail.com");
    var payment = paymentLinkInfo(item.paymentLink);
    var isPhoto = kind === "photo";
    var isTemplate = kind === "template";
    p.querySelector(".purchase-kicker").textContent = isPhoto ? "License this photograph" : isTemplate ? "Purchase this template" : "Own this build";
    p.querySelector(".purchase-title").textContent = item.title;
    finishTitleDots(p.querySelector(".purchase-title"));
    p.querySelector(".purchase-price").textContent = item.price || "Priced per use";
    p.querySelector(".purchase-note").textContent = isPhoto
      ? "Full-resolution file, licensed direct from the maker. Delivered to your inbox after checkout — no stock house in the middle."
      : isTemplate
        ? "A complete, editable site build with its included code and assets. Checkout stays on the configured Stripe or Gumroad hosted page."
        : "You get the complete build — code and assets, owned unconditionally, same contract as every BNDR site.";
    var actions = p.querySelector(".purchase-actions");
    actions.innerHTML = "";
    if (payment) {
      var pay = el("a", "btn btn-acc", "Checkout with " + payment.provider + " →");
      pay.href = payment.url; pay.target = "_blank"; pay.rel = "noopener noreferrer";
      pay.addEventListener("click", function () {
        siteNotice("Opening secure " + payment.provider + " checkout");
        if (window.gtag) {
          try { window.gtag("event", "begin_checkout", { item_name: item.title, payment_provider: payment.provider }); } catch (e) {}
        }
      });
      actions.appendChild(pay);
    }
    if (item.paymentLink && !payment) siteNotice("That checkout link was blocked — use the direct order option instead");
    var kindLabel = isPhoto ? "PHOTO" : isTemplate ? "TEMPLATE" : "APP";
    var subject = encodeURIComponent("[BNDR " + kindLabel + "] " + item.title);
    var body = encodeURIComponent("I want to " + (isPhoto ? "license" : "buy") + " \"" + item.title + "\" (" + (item.price || "quote") + ").\n\nName:\nIntended use:");
    var mail = el("a", "btn " + (payment ? "btn-ghost" : "btn-ink"), payment ? "Order by email" : "Order by email →");
    mail.href = "mailto:" + email + "?subject=" + subject + "&body=" + body;
    actions.appendChild(mail);
    p.classList.add("open");
    document.documentElement.style.overflow = "hidden";
  }

  /* ── chips + filter ──────────────────────────────────────────── */
  function buildChips(host, cats, onPick) {
    host.innerHTML = "";
    var all = el("button", "chip", "All");
    all.setAttribute("aria-pressed", "true");
    host.appendChild(all);
    var buttons = [all];
    cats.forEach(function (c) {
      var b = el("button", "chip", c.title);
      b.setAttribute("aria-pressed", "false");
      b.dataset.cat = c.id;
      host.appendChild(b);
      buttons.push(b);
    });
    host.addEventListener("click", function (e) {
      var b = e.target.closest(".chip");
      if (!b) return;
      buttons.forEach(function (x) { x.setAttribute("aria-pressed", String(x === b)); });
      var cat = b.dataset.cat || null;
      var vibe = null;
      if (cat) cats.forEach(function (c) { if (c.id === cat) vibe = c.vibe; });
      setVibe(vibe);
      onPick(cat);
    });
  }

  /* ── PAGE: home ─────────────────────────────────────────────── */
  var proofGrid = document.getElementById("proof-grid");
  if (proofGrid && FACTS) {
    get("home.proofFacts", []).forEach(function (id) {
      var f = FACTS.byId(id);
      if (!f) return;
      var card = el("article", "proof-card");
      card.innerHTML =
        '<div class="proof-value" data-final="' + MD.esc(f.value) + '">' + MD.esc(f.value) + "</div>" +
        '<p class="proof-label">' + MD.esc(f.claim) + "</p>" +
        '<a class="proof-src" href="' + f.url + '" target="_blank" rel="noopener noreferrer">' + MD.esc(f.source) + linkArrow() + "</a>";
      proofGrid.appendChild(card);
    });
    armCounters();
  }

  var homeSections = document.getElementById("home-sections");
  if (homeSections) {
    get("home.sections", []).forEach(function (s, i) {
      var sectionLink = safeNavUrl(s.link);
      var row = el("div", "glass-panel grid-2 io" + (i % 2 ? " d1" : ""));
      row.style.marginBottom = "16px";
      row.innerHTML =
        "<div>" + (s.badge ? "<div class=\"badge\">" + MD.esc(s.badge) + "</div>" : "") + "<h2 class=\"lead\">" + MD.esc(s.title) + "</h2></div>" +
        '<div class="prose">' + MD.render(s.bodyMd) +
        (sectionLink ? '<p style="margin-top:20px"><a class="btn btn-ghost" href="' + MD.esc(sectionLink) + '">' + MD.esc(s.linkLabel || "See more") + " →</a></p>" : "") +
        "</div>";
      homeSections.appendChild(row);
    });
  }

  var tiersHost = document.getElementById("pricing-tiers");
  if (tiersHost) {
    get("pricing.tiers", []).forEach(function (t) {
      var card = el("article", "proof-card");
      card.innerHTML = '<p class="proof-label" style="flex:0">' + MD.esc(t.title) + '</p><div class="proof-value">' + MD.esc(t.price) + "</div>";
      tiersHost.appendChild(card);
    });
  }

  var faqHost = document.getElementById("faq-list");
  if (faqHost) {
    get("faq", []).forEach(function (f) {
      var d = el("details", "item-card");
      d.style.cssText = "border:1px solid var(--line);background:var(--glass);color:var(--void);border-radius:14px;padding:16px 18px;margin-bottom:10px";
      d.innerHTML = "<summary style='font-weight:800;cursor:pointer;min-height:32px;display:flex;align-items:center'>" + MD.esc(f.q) + '</summary><div class="prose" style="margin-top:12px;font-size:15px">' + MD.render(f.aMd) + "</div>";
      faqHost.appendChild(d);
    });
  }

  /* ── PAGE: photos ────────────────────────────────────────────── */
  var photoGrid = document.getElementById("photo-grid");
  if (photoGrid) {
    var pcats = get("photos.categories", []);
    var pitems = get("photos.items", []);
    function renderPhotos(cat) {
      photoGrid.querySelectorAll(".card").forEach(function (c) {
        c.classList.toggle("is-hidden", !!cat && c.dataset.cat !== cat);
      });
    }
    pitems.forEach(function (it) {
      var catTitle = "";
      pcats.forEach(function (c) { if (c.id === it.cat) catTitle = c.title || c.name || ""; });
      var imgUrl = safeImageUrl(it.img || it.src || "").replace(/'/g, "%27");
      var pIcon = it.icon ? '<span class="card-icon">' + MD.esc(it.icon) + "</span>" : "";
      var card = el("article", "card io");
      card.dataset.cat = it.cat;
      card.dataset.frame = it.frame || "square";
      card.innerHTML =
        '<div class="card-media" role="img" aria-label="' + MD.esc(it.title) + '"' + (imgUrl ? ' style="background-image:url(\'' + imgUrl + "')\"" : "") + "></div>" +
        '<div class="card-body">' +
        '<span class="card-kicker">' + pIcon + MD.esc(catTitle) + "</span>" +
        '<h2 class="card-title">' + MD.esc(it.title) + "</h2>" +
        '<div class="card-note prose">' + MD.renderNested(it.descMd || it.note || "") + "</div>" +
        '<div class="card-row"><span class="price-tag">' + MD.esc(it.price || "") + '</span><button class="buy-btn">License →</button></div>' +
        "</div>";
      var pMedia = card.querySelector(".card-media");
      function photoDefault() {
        pMedia.style.backgroundImage = "none";
        pMedia.classList.add("media-default");
        pMedia.innerHTML = '<span class="media-default-title">' + MD.esc(it.title) + "</span>";
      }
      if (imgUrl) {
        var pProbe = new Image();
        pProbe.onerror = photoDefault;
        pProbe.src = imgUrl;
      } else { photoDefault(); }
      pMedia.addEventListener("click", function () { if (imgUrl) openImmersive({ title: it.title, img: imgUrl }); });
      card.querySelector(".buy-btn").addEventListener("click", function (e) { e.stopPropagation(); openPurchase(it, "photo"); });
      photoGrid.appendChild(card);
    });
    buildChips(document.getElementById("photo-chips"), pcats, renderPhotos);
  }

  /* ── PAGE: apps ──────────────��───────────────────────────────── */
  var appGrid = document.getElementById("app-grid");
  if (appGrid) {
    var acats = get("apps.categories", []);
    var aitems = get("apps.items", []);
    var GRADS = {
      calm: "linear-gradient(135deg,#0a2a30 0%,#0a0a0b 70%)",
      play: "linear-gradient(135deg,#33001a 0%,#0a0a0b 70%)",
      tools: "linear-gradient(135deg,#26330a 0%,#0a0a0b 70%)"
    };
    aitems.forEach(function (it) {
      var catTitle = "";
      acats.forEach(function (c) { if (c.id === it.cat) catTitle = c.title || c.name || ""; });
      var aIcon = it.icon ? '<span class="card-icon">' + MD.esc(it.icon) + "</span>" : "";
      var aImg = safeImageUrl(it.img || "").replace(/'/g, "%27");
      var aUrl = safePublicUrl(it.url);
      var defaultTile =
        '<div class="card-media" style="aspect-ratio:16/9;background:' + (GRADS[it.cat] || GRADS.tools) + ';display:flex;align-items:center;justify-content:center">' +
        '<span style="font-weight:900;font-style:italic;font-size:26px;color:var(--bone);opacity:0.9;padding:0 18px;text-align:center">' + MD.esc(it.title) + "</span></div>";
      var card = el("article", "card io");
      card.dataset.cat = it.cat;
      card.innerHTML =
        (aImg
          ? '<div class="card-media" role="img" aria-label="' + MD.esc(it.title) + '" style="aspect-ratio:16/9;background-image:url(\'' + aImg + "')\"></div>"
          : defaultTile) +
        '<div class="card-body">' +
        '<span class="card-kicker">' + aIcon + MD.esc(catTitle) + "</span>" +
        '<h2 class="card-title">' + MD.esc(it.title) + "</h2>" +
        '<div class="card-note prose">' + MD.renderNested(it.descMd || it.note || "") + "</div>" +
        '<div class="card-row"><span class="price-tag">' + MD.esc(it.price || "Live demo") + '</span>' +
        '<span style="display:flex;gap:8px"><button class="buy-btn run-btn" style="background:transparent;color:var(--bone);border:1px solid rgba(255,255,255,0.3)">Run it</button>' +
        '<button class="buy-btn own-btn">Own it</button></span></div>' +
        "</div>";
      if (aImg) {
        var aProbe = new Image();
        aProbe.onerror = function () {
          var m = card.querySelector(".card-media");
          var wrap = document.createElement("div");
          wrap.innerHTML = defaultTile;
          m.parentNode.replaceChild(wrap.firstChild, m);
        };
        aProbe.src = aImg;
      }
      card.querySelector(".run-btn").disabled = !aUrl;
      card.querySelector(".run-btn").addEventListener("click", function (e) { e.stopPropagation(); if (aUrl) openImmersive({ title: it.title, url: aUrl }); });
      card.querySelector(".own-btn").addEventListener("click", function (e) { e.stopPropagation(); openPurchase(it, "app"); });
      card.addEventListener("click", function () { if (aUrl) openImmersive({ title: it.title, url: aUrl }); });
      appGrid.appendChild(card);
    });
    buildChips(document.getElementById("app-chips"), acats, function (cat) {
      appGrid.querySelectorAll(".card").forEach(function (c) {
        c.classList.toggle("is-hidden", !!cat && c.dataset.cat !== cat);
      });
    });
  }

  /* ── PAGE: sites ─────────────────────────────────────────────── */
  var siteList = document.getElementById("site-list");
  if (siteList) {
    var scats = get("sites.categories", []);
    var sitems = get("sites.items", []);
    /* live previews on every width; the designed cover holds the frame
       and persists only when the embed fails to load */
    sitems.forEach(function (it) {
      var siteUrl = safePublicUrl(it.url);
      if (!siteUrl) return;
      var catTitle = "";
      scats.forEach(function (c) { if (c.id === it.cat) catTitle = c.title || c.name || ""; });
      var row = el("article", "show-row io");
      row.dataset.cat = it.cat;
      row.innerHTML =
        '<div class="show-meta">' +
        '<span class="card-kicker" style="color:var(--magenta)">' + MD.esc(catTitle) + "</span>" +
        '<h2 class="show-title">' + MD.esc(it.title) + "</h2>" +
        '<div class="show-note prose">' + MD.renderNested(it.noteMd || it.note || "") + "</div>" +
        '<div class="show-actions"><button class="btn btn-ink imm-btn">Immerse</button>' +
        '<a class="btn btn-ghost" href="' + MD.esc(siteUrl) + '" target="_blank" rel="noopener noreferrer">Visit' + linkArrow() + "</a></div>" +
        "</div>" +
        '<div class="show-frame" data-url="' + MD.esc(siteUrl) + '">' +
        '<div class="show-cover"><span class="cover-mono">' + MD.esc((it.title || "?").charAt(0)) + '</span><span class="cover-name">' + MD.esc(it.title) + '</span><span class="cover-state">LOADING PREVIEW…</span></div>' +
        "</div>";
      row.querySelector(".imm-btn").addEventListener("click", function (e) { e.stopPropagation(); openImmersive({ title: it.title, url: siteUrl }); });
      row.querySelector(".show-frame").addEventListener("click", function () { openImmersive({ title: it.title, url: siteUrl }); });
      siteList.appendChild(row);
    });
    /* lazy-load live previews when scrolled into view (all widths) */
    function armFrame(host) {
      var url = host.getAttribute("data-url");
      var probeOk = false, probeFailed = false, frameLoaded = false, settled = false;
      function showPlaceholder() {
        if (settled) return;
        settled = true;
        host.classList.remove("loaded");
        var st = host.querySelector(".cover-state");
        if (st) st.textContent = "PREVIEW UNAVAILABLE — TAP TO OPEN";
      }
      function showPreview() {
        if (settled) return;
        settled = true;
        host.classList.add("loaded");
      }
      /* the iframe load event fires even for browser error pages, so
         reachability is probed separately; both must succeed before the
         cover fades. no-cors keeps this working for cross-origin sites. */
      var settle = setTimeout(showPlaceholder, 8000);
      function maybeReveal() {
        if (probeOk && frameLoaded) { clearTimeout(settle); showPreview(); }
      }
      try {
        var ctrl = "AbortController" in window ? new AbortController() : null;
        var probeTimer = setTimeout(function () { if (ctrl) ctrl.abort(); }, 7500);
        fetch(url, { mode: "no-cors", signal: ctrl ? ctrl.signal : undefined }).then(
          function () { clearTimeout(probeTimer); probeOk = true; maybeReveal(); },
          function () { clearTimeout(probeTimer); probeFailed = true; clearTimeout(settle); showPlaceholder(); }
        );
      } catch (e) {
        probeOk = true; /* ancient browser without fetch: fall back to load-event only */
      }
      var fr = document.createElement("iframe");
      fr.loading = "lazy";
      fr.title = "Live site preview";
      fr.tabIndex = -1;
      fr.addEventListener("load", function () {
        frameLoaded = true;
        maybeReveal();
      });
      fr.src = url;
      host.insertBefore(fr, host.firstChild);
    }
    if ("IntersectionObserver" in window) {
      var fio = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) {
          if (!en.isIntersecting) return;
          armFrame(en.target);
          fio.unobserve(en.target);
        });
      }, { rootMargin: "200px" });
      siteList.querySelectorAll(".show-frame").forEach(function (f) { fio.observe(f); });
    } else {
      siteList.querySelectorAll(".show-frame").forEach(armFrame);
    }
    buildChips(document.getElementById("site-chips"), scats, function (cat) {
      siteList.querySelectorAll(".show-row").forEach(function (r) {
        r.classList.toggle("is-hidden", !!cat && r.dataset.cat !== cat);
      });
    });
  }

  /* ── PAGE: purchasable site templates ─────────────────────────
     Uses the same row/preview architecture as Sites. The storefront remains
     useful with zero items, and checkout appears only for approved hosted
     Stripe or Gumroad links. */
  var templateList = document.getElementById("template-list");
  if (templateList) {
    var tcats = get("templates.categories", []);
    var titems = get("templates.items", []);
    if (!titems.length) {
      var empty = el("div", "template-empty glass-panel io in");
      empty.innerHTML = '<span class="template-empty-mark" aria-hidden="true">B</span><div><h2 class="lead">The template rail is being machined<span class="title-dot">.</span></h2><div class="prose sub">' + MD.render(get("templates.comingSoonMd", "The first release is coming soon. Every template will be previewable before purchase and delivered through a hosted checkout.")) + "</div></div>";
      templateList.appendChild(empty);
    } else {
      titems.forEach(function (it) {
        var previewUrl = safePublicUrl(it.previewUrl || it.url);
        var imageUrl = safeImageUrl(it.imageUrl || it.img);
        var catTitle = "Template";
        tcats.forEach(function (c) { if (c.id === it.cat) catTitle = c.title || c.name || catTitle; });
        var row = el("article", "show-row template-row io");
        row.dataset.cat = it.cat || "";
        row.innerHTML =
          '<div class="show-meta">' +
            '<span class="card-kicker" style="color:var(--magenta)">' + MD.esc(catTitle) + "</span>" +
            '<h2 class="show-title">' + MD.esc(it.title || "Untitled template") + "</h2>" +
            '<div class="show-note prose">' + MD.renderNested(it.descMd || it.noteMd || "") + "</div>" +
            '<div class="template-price">' + MD.esc(it.price || "Price coming soon") + "</div>" +
            '<div class="show-actions"><button class="btn btn-ink template-preview"' + (previewUrl || imageUrl ? "" : " disabled") + ">Preview</button>" +
            '<button class="btn btn-acc template-buy">Purchase</button></div>' +
          "</div>" +
          '<div class="show-frame template-frame">' +
            '<div class="show-cover"><span class="cover-mono">' + MD.esc((it.title || "B").charAt(0)) + '</span><span class="cover-name">' + MD.esc(it.title || "Template") + '</span><span class="cover-state">' + (imageUrl ? "LOADING IMAGE…" : previewUrl ? "LOADING PREVIEW…" : "PREVIEW COMING SOON") + "</span></div>" +
          "</div>";
        var frame = row.querySelector(".template-frame");
        if (imageUrl) {
          var img = new Image();
          img.alt = (it.title || "Template") + " preview";
          img.loading = "lazy";
          img.addEventListener("load", function () { frame.classList.add("loaded"); });
          img.addEventListener("error", function () { var state = frame.querySelector(".cover-state"); if (state) state.textContent = "IMAGE UNAVAILABLE"; });
          img.src = imageUrl;
          frame.insertBefore(img, frame.firstChild);
        } else if (previewUrl) {
          var iframe = document.createElement("iframe");
          iframe.loading = "lazy";
          iframe.title = (it.title || "Template") + " live preview";
          iframe.tabIndex = -1;
          iframe.addEventListener("load", function () { frame.classList.add("loaded"); });
          iframe.src = previewUrl;
          frame.insertBefore(iframe, frame.firstChild);
        }
        function previewTemplate() {
          if (imageUrl) openImmersive({ title: it.title, img: imageUrl, url: previewUrl });
          else if (previewUrl) openImmersive({ title: it.title, url: previewUrl });
        }
        row.querySelector(".template-preview").addEventListener("click", previewTemplate);
        frame.addEventListener("click", previewTemplate);
        row.querySelector(".template-buy").addEventListener("click", function () { openPurchase(it, "template"); });
        templateList.appendChild(row);
      });
      buildChips(document.getElementById("template-chips"), tcats, function (cat) {
        templateList.querySelectorAll(".template-row").forEach(function (row) {
          row.classList.toggle("is-hidden", !!cat && row.dataset.cat !== cat);
        });
      });
    }
  }

  /* ── PAGE: blog index ────────────────────────────────────────── */
  var postList = document.getElementById("post-list");
  if (postList) {
    var posts = get("blog.posts", []).slice().sort(function (a, b) { return a.date < b.date ? 1 : -1; });
    posts.forEach(function (p) {
      var a = el("a", "post-item io");
      a.href = withDraft("post.html?p=" + encodeURIComponent(p.slug));
      a.innerHTML =
        '<span class="post-date">' + MD.esc(p.date) + "</span>" +
        "<h2>" + MD.esc(p.title) + "</h2>" +
        '<div class="post-summary prose">' + MD.renderNested(p.descMd) + "</div>" +
        '<div class="post-tags">' + (p.tags || []).map(function (t) { return "<span>" + MD.esc(t) + "</span>"; }).join("") + "</div>";
      postList.appendChild(a);
    });
  }

  /* ── PAGE: post ──────────────────────────────────────────────── */
  var articleHost = document.getElementById("article");
  if (articleHost) {
    var slug = new URLSearchParams(location.search).get("p");
    var post = null;
    get("blog.posts", []).forEach(function (p) { if (p.slug === slug) post = p; });
    if (!post) {
      articleHost.innerHTML = '<div class="article-head"><h1>Not found.</h1><p class="sub">That post doesn\'t exist — or it hasn\'t shipped yet.</p><p style="margin-top:20px"><a class="btn btn-ink" href="blog.html">← All posts</a></p></div>';
    } else {
      var base = safePublicUrl(get("meta.baseUrl", "")) || "https://bndrllc.com/";
      base = base.replace(/\/$/, "");
      var desc = MD.plain(post.descMd, 158);
      document.title = post.title + " — " + get("meta.siteName", "BNDR LLC");
      function setMeta(sel, attr, val) {
        var n = document.querySelector(sel);
        if (n) n.setAttribute(attr, val);
      }
      setMeta('meta[name="description"]', "content", desc);
      setMeta('meta[property="og:title"]', "content", post.title);
      setMeta('meta[property="og:description"]', "content", desc);
      setMeta('meta[property="og:url"]', "content", base + "/post.html?p=" + post.slug);
      setMeta('link[rel="canonical"]', "href", base + "/post.html?p=" + post.slug);
      articleHost.innerHTML =
        '<div class="article-head io in">' +
        '<span class="post-date">' + MD.esc(post.date) + " · " + (post.tags || []).map(MD.esc).join(" · ") + "</span>" +
        "<h1>" + MD.esc(post.title) + "</h1>" +
        '<p class="sub">' + MD.plain(post.descMd) + "</p></div>" +
        '<div class="prose" id="article-body">' + MD.render(post.bodyMd) + "</div>" +
        '<p style="margin-top:44px"><a class="btn btn-ghost" href="' + withDraft("blog.html") + '">← All posts</a></p>';
      /* verified-facts layer — registry-only citations */
      if (FACTS) FACTS.inject(document.getElementById("article-body"), post.title + " " + post.descMd + " " + post.bodyMd);
      /* JSON-LD */
      var ld = document.createElement("script");
      ld.type = "application/ld+json";
      ld.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "BlogPosting",
        headline: post.title,
        datePublished: post.date,
        description: desc,
        author: { "@type": "Person", name: "Scott", worksFor: { "@type": "Organization", name: "BNDR LLC" } },
        publisher: { "@type": "Organization", name: "BNDR LLC", logo: { "@type": "ImageObject", url: safeImageUrl(get("meta.logo", "")) } },
        mainEntityOfPage: base + "/post.html?p=" + post.slug
      });
      document.head.appendChild(ld);
    }
  }

  /* PAGE: estimate — tap-through intake + live flat-price quote.
     Config lives in content.intake (console-editable); hardcoded defaults
     below keep the page functional even with an older content.js. */
  var intakeRoot = document.getElementById("intake-root");
  if (intakeRoot) {
    var IK = get("intake", {}) || {};
    var IKD = {
      businessTypes: ["Home services / trades", "Med spa / salon / aesthetics", "Law / professional practice", "Restaurant / food", "Local shop / retail", "Personal brand / creative", "Something else"],
      needs: ["Brand-new site — nothing exists yet", "Redesign — my current site embarrasses me", "Landing page for a campaign or launch", "Not sure — tell me what I need"],
      sizes: [{ label: "Launch Site Special", detail: "One sharp page, fast", price: 599 }, { label: "One-Page Lander™", detail: "A single page engineered to convert", price: 2500 }, { label: "Three-Page Custom™", detail: "Home, work, contact — the full pitch", price: 4500 }, { label: "Small Business Site™", detail: "The complete presence", price: 6500 }],
      addons: [{ label: "Blog / field notes", price: 500 }, { label: "Photo or work gallery", price: 400 }, { label: "Copywriting help", price: 450 }, { label: "Logo / brand touch-up", price: 600 }],
      timelines: ["ASAP", "Within a month", "This quarter", "Just looking"],
      budgets: ["Under $1k", "$1k – $3k", "$3k – $6k", "$6k+", "Not sure yet"],
      hostingNote: "Flat build price. Hosting is $99/mo separate — covered in the FAQ below.",
      successMd: "**Got it — it's in my inbox.** You'll hear back from me directly, usually same day."
    };
    var ikGet = function (key) {
      var v = IK[key];
      if (v == null) return IKD[key];
      if (Array.isArray(v) && !v.length) return IKD[key];
      if (typeof v === "string" && !v.trim()) return IKD[key];
      return v;
    };
    var estimateLd = document.getElementById("estimate-service-ld");
    if (estimateLd) {
      try {
        var estimateSchema = JSON.parse(estimateLd.textContent);
        estimateSchema.offers = ikGet("sizes").map(function (size) {
          return { "@type": "Offer", name: size.label || "Website build", price: String(Number(size.price) || 0), priceCurrency: "USD" };
        });
        estimateLd.textContent = JSON.stringify(estimateSchema);
      } catch (e) { /* built-in schema remains valid if an owner hand-edited it */ }
    }
    var pick = { biz: null, need: null, size: null, addons: [], timeline: null, budget: null };
    var ikT0 = Date.now();
    function priceCents(n) {
      var value = typeof n === "string" ? Number(n.replace(/[$,\s]/g, "")) : Number(n);
      return Number.isFinite(value) && value >= 0 ? Math.round(value * 100) : 0;
    }
    function moneyFromCents(cents) {
      var whole = cents / 100;
      return "$" + whole.toLocaleString("en-US", { minimumFractionDigits: cents % 100 ? 2 : 0, maximumFractionDigits: 2 });
    }
    function money(n) { return moneyFromCents(priceCents(n)); }
    function totalCents() {
      var sizes = ikGet("sizes"), addons = ikGet("addons");
      var t = pick.size != null && sizes[pick.size] ? priceCents(sizes[pick.size].price) : 0;
      pick.addons.forEach(function (i) { if (addons[i]) t += priceCents(addons[i].price); });
      return t;
    }
    function total() { return totalCents() / 100; }
    function stepNode(num, title, sub) {
      var s = el("div", "intake-step io");
      s.innerHTML = '<h2><span class="step-num">' + String(num).padStart(2, "0") + "</span><span>" + MD.esc(title) + "</span></h2>" + (sub ? '<p class="step-sub">' + MD.esc(sub) + "</p>" : "");
      return s;
    }
    function optGroup(host, list, opts) {
      var grid = el("div", "opt-grid");
      grid.setAttribute("role", "group");
      list.forEach(function (item, i) {
        var label = typeof item === "string" ? item : (item.label || "");
        var b = el("button", "opt");
        b.type = "button";
        b.setAttribute("aria-pressed", "false");
        b.innerHTML = MD.esc(label) +
          (typeof item !== "string" && item.detail ? '<span class="opt-price" style="opacity:0.6;font-weight:600">' + MD.esc(item.detail) + "</span>" : "") +
          (typeof item !== "string" && item.price != null ? '<span class="opt-price">' + (opts.plus ? "+ " : "") + money(item.price) + "</span>" : "");
        b.addEventListener("click", function () {
          if (opts.multi) {
            b.setAttribute("aria-pressed", String(b.getAttribute("aria-pressed") !== "true"));
          } else {
            grid.querySelectorAll(".opt").forEach(function (x) { x.setAttribute("aria-pressed", "false"); });
            b.setAttribute("aria-pressed", "true");
          }
          opts.onPick(i, b.getAttribute("aria-pressed") === "true");
        });
        grid.appendChild(b);
      });
      host.appendChild(grid);
      return grid;
    }
    function summaryText() {
      var sizes = ikGet("sizes"), addons = ikGet("addons");
      return [
        "Business type: " + (pick.biz != null ? ikGet("businessTypes")[pick.biz] : "—"),
        "Need: " + (pick.need != null ? ikGet("needs")[pick.need] : "—"),
        "Size: " + (pick.size != null ? sizes[pick.size].label + " (" + money(sizes[pick.size].price) + ")" : "—"),
        "Add-ons: " + (pick.addons.length ? pick.addons.map(function (i) { return addons[i].label + " (+" + money(addons[i].price) + ")"; }).join(", ") : "none"),
        "Timeline: " + (pick.timeline != null ? ikGet("timelines")[pick.timeline] : "—"),
        "Budget comfort: " + (pick.budget != null ? ikGet("budgets")[pick.budget] : "—"),
        "Estimate shown: " + (pick.size != null ? moneyFromCents(totalCents()) : "not locked")
      ].join("\n");
    }
    var s1 = stepNode(1, "What kind of business?", "This tunes the advice you get back — nothing else.");
    optGroup(s1, ikGet("businessTypes"), { onPick: function (i) { pick.biz = i; } });
    var s2 = stepNode(2, "What do you need?");
    optGroup(s2, ikGet("needs"), { onPick: function (i) { pick.need = i; } });
    var s3 = stepNode(3, "Pick a size", "Flat prices — the number you see is the number you pay.");
    optGroup(s3, ikGet("sizes"), { onPick: function (i) { pick.size = i; recalc(); } });
    var s4 = stepNode(4, "Add-ons", "Optional. Tap any that apply.");
    optGroup(s4, ikGet("addons"), { multi: true, plus: true, onPick: function (i, on) {
      var at = pick.addons.indexOf(i);
      if (on && at === -1) pick.addons.push(i);
      if (!on && at > -1) pick.addons.splice(at, 1);
      recalc();
    } });
    var s5 = stepNode(5, "When do you want it live?");
    optGroup(s5, ikGet("timelines"), { onPick: function (i) { pick.timeline = i; } });
    var s6 = stepNode(6, "Budget comfort zone", "So the recommendation fits reality — nothing is gated on it.");
    optGroup(s6, ikGet("budgets"), { onPick: function (i) { pick.budget = i; } });
    var quote = el("div", "intake-quote");
    quote.innerHTML = '<div><span class="q-label">Your flat price</span><span class="q-value" id="ik-total">Choose a size</span></div><span class="q-note">' + MD.esc(ikGet("hostingNote")) + "</span>";
    function recalc() {
      quote.querySelector("#ik-total").textContent = pick.size == null ? "Choose a size" : moneyFromCents(totalCents());
    }
    var form = el("form", "intake-form io");
    form.setAttribute("novalidate", "novalidate");
    form.innerHTML =
      '<div class="if-grid">' +
      '<div class="intake-field"><label for="ik-name">Name *</label><input id="ik-name" name="name" maxlength="120" autocomplete="name" required /></div>' +
      '<div class="intake-field"><label for="ik-biz">Business name</label><input id="ik-biz" name="business" maxlength="160" autocomplete="organization" /></div>' +
      '<div class="intake-field"><label for="ik-email">Email *</label><input id="ik-email" name="email" type="email" maxlength="200" autocomplete="email" required /></div>' +
      '<div class="intake-field"><label for="ik-phone">Phone (optional)</label><input id="ik-phone" name="phone" type="tel" maxlength="40" autocomplete="tel" /></div>' +
      "</div>" +
      '<div class="intake-field"><label for="ik-notes">Anything else? (optional)</label><textarea id="ik-notes" name="notes" rows="3" maxlength="900"></textarea></div>' +
      '<div class="hp-wrap" aria-hidden="true"><label for="ik-hp">Leave this field empty</label><input id="ik-hp" name="_honey" type="text" tabindex="-1" autocomplete="off" /></div>' +
      '<button class="btn btn-ink" type="submit" style="font-size:16px;padding:16px 28px">Send it — get your reply direct →</button>' +
      '<p class="step-sub" style="margin-top:10px">No spam, no list, no drip campaign. This goes straight to the builder\'s inbox and nowhere else.</p>';
    var statusHost = el("div");
    form.appendChild(statusHost);
    var sending = false;
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (sending) return;
      function status(cls, html) {
        statusHost.innerHTML = '<div class="intake-status ' + cls + '">' + html + "</div>";
        if (statusHost.scrollIntoView) statusHost.scrollIntoView({ block: "nearest" });
      }
      var name = form.querySelector("#ik-name").value.trim();
      var email = form.querySelector("#ik-email").value.trim();
      /* honeypot: bots see success, nothing sends */
      if (form.querySelector("#ik-hp").value) { status("ok", MD.render(ikGet("successMd"))); return; }
      /* time trap: a real visitor taps options for longer than this */
      if (Date.now() - ikT0 < 4000) { status("err", "That was superhumanly fast — take one more look, then hit send again."); return; }
      if (!name) { status("err", "Your name is the one thing I actually need — add it and hit send."); return; }
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { status("err", "That email doesn't look deliverable — double-check it and hit send."); return; }
      var btn = form.querySelector('button[type="submit"]');
      sending = true; btn.disabled = true; btn.textContent = "Sending…";
      var ownerEmail = get("meta.email", "bndr.labs@gmail.com");
      var endpoint = (IK.endpoint || "").trim() || "https://formsubmit.co/ajax/" + ownerEmail;
      var payload = {
        _subject: "[BNDR ESTIMATE] " + name + " — " + (pick.size != null ? moneyFromCents(totalCents()) : "no size picked"),
        _template: "table",
        _captcha: "false",
        name: name,
        business: form.querySelector("#ik-biz").value.trim(),
        email: email,
        phone: form.querySelector("#ik-phone").value.trim(),
        project: summaryText(),
        notes: form.querySelector("#ik-notes").value.trim(),
        page: location.href.split("?")[0]
      };
      function fallback() {
        var mail = "mailto:" + ownerEmail + "?subject=" + encodeURIComponent(payload._subject) +
          "&body=" + encodeURIComponent(summaryText() + "\n\nName: " + name + "\nBusiness: " + payload.business + "\nEmail: " + email + "\nPhone: " + payload.phone + "\nNotes: " + payload.notes);
        status("err", 'The form service didn\'t answer, but nothing is lost — <a href="' + mail + '">send the same details by email in one tap →</a>');
        sending = false; btn.disabled = false; btn.textContent = "Send it — get your reply direct →";
      }
      try {
        fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json", "Accept": "application/json" }, body: JSON.stringify(payload) })
          .then(function (r) { if (!r.ok) throw new Error("HTTP " + r.status); return r.json().catch(function () { return {}; }); })
          .then(function () {
            status("ok", MD.render(ikGet("successMd")));
            form.querySelectorAll("input,textarea,button").forEach(function (n) { n.disabled = true; });
            if (window.gtag) { try { window.gtag("event", "generate_lead", { currency: "USD", value: pick.size != null ? total() : 0 }); } catch (e2) {} }
          })
          .catch(fallback);
      } catch (e3) { fallback(); }
    });
    var s7 = stepNode(7, "Where do I send the reply?", "That's the whole form — the reply comes from the person who builds it.");
    s7.appendChild(form);
    var layout = el("div", "intake-layout");
    var questions = el("div", "intake-question-list");
    var result = el("aside", "intake-result");
    result.setAttribute("aria-label", "Estimate and reply details");
    [s1, s2, s3, s4, s5, s6].forEach(function (n) { questions.appendChild(n); });
    result.appendChild(quote);
    result.appendChild(s7);
    layout.appendChild(questions);
    layout.appendChild(result);
    intakeRoot.appendChild(layout);
    /* FAQPage structured data — built from the same console-managed FAQ the page shows */
    var faqLd = get("faq", []);
    if (faqLd.length) {
      var ldf = document.createElement("script");
      ldf.type = "application/ld+json";
      ldf.textContent = JSON.stringify({
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: faqLd.map(function (f) {
          return { "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: MD.plain(f.aMd) } };
        })
      });
      document.head.appendChild(ldf);
    }
  }

  /* ── PAGE: builder ──────────────────────────────────────────── */
  var pulse = document.getElementById("pulse-grid");
  if (pulse) {
    var cols = [
      { key: "shipped", label: "Shipped", state: "shipped" },
      { key: "motion", label: "In motion", state: "motion" },
      { key: "next", label: "Next", state: "next" }
    ];
    cols.forEach(function (cdef, i) {
      var col = el("div", "pulse-col io d" + (i + 1));
      col.dataset.state = cdef.state;
      col.innerHTML = "<h3><i></i>" + cdef.label + "</h3>";
      get("builder." + cdef.key, []).forEach(function (item) {
        var d = el("div", "pulse-item");
        d.innerHTML = '<div class="pulse-name">' + MD.render(item.nameMd || item.name || "") + '</div><div class="pulse-note prose">' + MD.render(item.noteMd || item.note || "") + "</div>";
        col.appendChild(d);
      });
      pulse.appendChild(col);
    });
  }

  /* ── contact links ──────────────────────────────────────────── */
  document.querySelectorAll("[data-mailto]").forEach(function (a) {
    a.href = "mailto:" + get("meta.email", "bndr.labs@gmail.com") + "?subject=" + encodeURIComponent(a.getAttribute("data-mailto"));
  });

  /* ── PHX clock ──────────────────────────────────────────────── */
  var clock = document.getElementById("phx-clock");
  if (clock) {
    function tick() {
      try {
        clock.textContent = "PHX " + new Intl.DateTimeFormat("en-US", { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false, timeZone: "America/Phoenix" }).format(new Date());
      } catch (e) { clock.textContent = "PHX · AZ"; }
    }
    tick();
    setInterval(tick, 1000);
  }

  /* ═══════════ v3.3 — physical layer ═══════════
     Tactile feedback stays fine-pointer; orb physics runs on every
     device — reduced-motion keeps the shipped calm behavior. */
  var finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  if (finePointer && !reduced) (function () {

    /* ── tactile: tap ink on pills + buttons ── */
    document.addEventListener("pointerdown", function (e) {
      if (e.pointerType === "touch") return;
      var host = e.target.closest(".btn, .buy-btn, .chip, .opt, .nav-pill a");
      if (!host) return;
      var r = host.getBoundingClientRect();
      var d = Math.max(r.width, r.height) * 2.2;
      var ink = el("span", "tap-ripple");
      ink.style.width = ink.style.height = d + "px";
      ink.style.left = (e.clientX - r.left - d / 2) + "px";
      ink.style.top = (e.clientY - r.top - d / 2) + "px";
      host.appendChild(ink);
      ink.addEventListener("animationend", function () { ink.remove(); });
    }, { passive: true });

    /* toggle pop — chips and estimator options answer the tap */
    document.addEventListener("click", function (e) {
      var t = e.target.closest(".chip");
      if (!t) return;
      t.classList.remove("tap-pop");
      void t.offsetWidth; /* restart the keyframe */
      t.classList.add("tap-pop");
    });

    /* ── tactile: cursor-tracked glare + spring tilt on cards ── */
    var glareSel = ".card, .proof-card, .post-item, .show-row";
    var tiltEl = null, tiltPt = null, tiltRaf = 0;
    function tiltFrame() {
      tiltRaf = 0;
      if (!tiltEl || !tiltPt) return;
      var r = tiltEl.getBoundingClientRect();
      if (!r.width || !r.height) return;
      var px = Math.min(1, Math.max(0, (tiltPt.x - r.left) / r.width));
      var py = Math.min(1, Math.max(0, (tiltPt.y - r.top) / r.height));
      tiltEl.style.setProperty("--mx", (px * 100).toFixed(1) + "%");
      tiltEl.style.setProperty("--my", (py * 100).toFixed(1) + "%");
      var isCard = tiltEl.classList.contains("card");
      if (isCard || tiltEl.classList.contains("proof-card")) {
        var lift = isCard ? -6 : -4;
        var rx = ((0.5 - py) * 4.5).toFixed(2);
        var ry = ((px - 0.5) * 5.5).toFixed(2);
        tiltEl.style.transform = "perspective(900px) translateY(" + lift + "px) rotateX(" + rx + "deg) rotateY(" + ry + "deg)";
      }
    }
    function releaseTilt() {
      if (!tiltEl) return;
      tiltEl.classList.remove("is-tilt");
      tiltEl.style.transform = "";
      tiltEl = null;
      tiltPt = null;
    }
    document.addEventListener("pointerover", function (e) {
      var c = e.target.closest ? e.target.closest(glareSel) : null;
      if (!c || c === tiltEl) return;
      releaseTilt();
      tiltEl = c;
      c.classList.add("is-tilt");
    });
    document.addEventListener("pointermove", function (e) {
      if (!tiltEl) return;
      tiltPt = { x: e.clientX, y: e.clientY };
      if (!tiltRaf) tiltRaf = requestAnimationFrame(tiltFrame);
    }, { passive: true });
    document.addEventListener("pointerout", function (e) {
      if (!tiltEl) return;
      if (e.relatedTarget && tiltEl.contains(e.relatedTarget)) return;
      if (tiltEl === e.target || tiltEl.contains(e.target)) releaseTilt();
    });

  })();

  /* ── orb: a physical object (home hero only) — every device ── */
  if (!reduced) (function () {
    var wrap = document.querySelector(".hero .orb-wrap");
    var orb = wrap ? wrap.querySelector(".orb") : null;
    if (orb) (function () {
      var R = 150;          /* layout radius — the orb is 300px */
      var RC = 128;         /* collision radius — the plasma edge is soft */
      var textBlock = wrap.nextElementSibling;
      var homeX = 0, homeY = 0, maxX = 0, maxY = 0;
      var minX = R - 40, minY = 34;
      var obstacles = [];
      var pos = { x: 0, y: 0, z: 0 }, vel = { x: 0, y: 0, z: 0 };
      var rotation = { x: 0, y: 0, z: 0 };
      var spin = { x: 0, y: 0, z: 0 };
      var t0 = performance.now();
      var seeded = false, holding = false, running = false, inView = false;
      var rafId = 0, lastT = 0, accT = 0, dragPt = null;
      var grab = { dx: 0, dy: 0, startY: 0, startZ: 0 };
      var K = 0.0025, KZ = 0.0032, REST = 0.57;
      var gyro = { x: 0, y: 0 };

      function clamp(value, low, high) { return Math.max(low, Math.min(high, value)); }

      var shadow = el("div", "orb-shadow");
      wrap.insertBefore(shadow, orb);
      wrap.classList.add("orb-live");

      function inkRect(node, wr) {
        var rng = document.createRange();
        rng.selectNodeContents(node);
        var b = rng.getBoundingClientRect();
        if (!b.width) return null;
        return { l: b.left - wr.left, t: b.top - wr.top, r: b.right - wr.left, b: b.bottom - wr.top };
      }
      function childRect(box, wr, sel) {
        var b = box.getBoundingClientRect();
        if (!b.width) return null;
        var right = b.left;
        box.querySelectorAll(sel).forEach(function (n) { right = Math.max(right, n.getBoundingClientRect().right); });
        return { l: b.left - wr.left, t: b.top - wr.top, r: right - wr.left, b: b.bottom - wr.top };
      }
      function measure() {
        if (!wrap.clientWidth || wrap.offsetParent === null) { seeded = false; return false; }
        R = orb.offsetWidth / 2 || R;
        RC = R * 0.853;
        shadow.style.width = Math.round(R * 1.533) + "px";
        shadow.style.height = Math.round(R * 0.293) + "px";
        var narrow = window.innerWidth < 880;
        minX = narrow ? R * 0.5 : R - 40;
        minY = narrow ? 6 : 34;
        homeX = orb.offsetLeft + R;
        homeY = orb.offsetTop + R;
        maxX = wrap.clientWidth - R + (narrow ? R * 0.5 : 44);
        maxY = narrow ? wrap.clientHeight - R * 0.5 : homeY + 30;
        obstacles = [];
        var wr = wrap.getBoundingClientRect();
        if (textBlock && !narrow) {
          var tb = textBlock.getBoundingClientRect();
          if (tb.height) maxY = tb.bottom - wr.top - RC - 20;
          var h1 = textBlock.querySelector("h1");
          var desc = textBlock.querySelector(".hero-desc");
          var o;
          if (h1 && (o = inkRect(h1, wr))) obstacles.push(o);
          if (desc && (o = inkRect(desc, wr))) obstacles.push(o);
          var vals = textBlock.querySelector(".hero-values");
          if (vals && (o = childRect(vals, wr, "li"))) obstacles.push(o);
          var cta = textBlock.querySelector(".hero-cta");
          if (cta && (o = childRect(cta, wr, ".btn"))) obstacles.push(o);
        }
        return true;
      }
      function remeasure() {
        var wasSeeded = seeded, ox = homeX, oy = homeY;
        if (!measure()) return;
        if (wasSeeded) {
          pos.x += homeX - ox;
          pos.y += homeY - oy;
        } else {
          pos.x = homeX; pos.y = homeY;
          pos.z = 0;
          vel.x = vel.y = vel.z = 0;
          rotation.x = rotation.y = rotation.z = 0;
          spin.x = spin.y = spin.z = 0;
          t0 = performance.now();
          seeded = true;
        }
      }

      /* organic idle wander — biased up + sideways, eased in from rest */
      function driftTarget(t) {
        var s = t - t0;
        var a = Math.min(1, s / 5000);
        return {
          x: homeX + a * (26 * Math.sin(s * 0.00023) + 9 * Math.sin(s * 0.00052 + 1.7)),
          y: homeY + a * (-12 + 16 * Math.sin(s * 0.00017 + 0.6) + 6 * Math.sin(s * 0.00047 + 3.1)),
          z: a * (18 * Math.sin(s * 0.00019 + 2.2) + 7 * Math.sin(s * 0.00041))
        };
      }

      function collide(hard) {
        /* Moving toward the viewer gives the orb more room than its original
           layout cell. It can escape the visual box, then the 3D home spring
           draws it back without teleporting or pinning it to an edge. */
        var depthOpen = Math.max(0, pos.z - 60);
        var bx0 = minX - depthOpen * 0.48;
        var bx1 = maxX + depthOpen * 0.48;
        var by0 = minY - depthOpen * 0.32;
        var by1 = maxY + depthOpen * 0.36;
        if (pos.x < bx0) { pos.x = bx0; if (vel.x < 0) vel.x *= -REST; spin.y += Math.abs(vel.x) * 0.025; }
        if (pos.x > bx1) { pos.x = bx1; if (vel.x > 0) vel.x *= -REST; spin.y -= Math.abs(vel.x) * 0.025; }
        if (pos.y < by0) { pos.y = by0; if (vel.y < 0) vel.y *= -REST; spin.x -= Math.abs(vel.y) * 0.025; }
        if (pos.y > by1) { pos.y = by1; if (vel.y > 0) vel.y *= -REST; spin.x += Math.abs(vel.y) * 0.025; }
        if (pos.z < -150) { pos.z = -150; if (vel.z < 0) vel.z *= -0.5; }
        if (pos.z > 235) { pos.z = 235; if (vel.z > 0) vel.z *= -0.5; }
        var collisionRadius = RC * clamp(1 + pos.z / 1000, 0.86, 1.24);
        /* At pronounced foreground depth the orb is deliberately in front of
           the copy plane, so copy-plane collisions no longer trap it. */
        if (pos.z > 112) return;
        for (var i = 0; i < obstacles.length; i++) {
          var o = obstacles[i];
          var cx = Math.max(o.l + 6, Math.min(pos.x, o.r - 6));
          var cy = Math.max(o.t + 6, Math.min(pos.y, o.b - 6));
          var dx = pos.x - cx, dy = pos.y - cy;
          var d2 = dx * dx + dy * dy;
          if (d2 >= collisionRadius * collisionRadius) continue;
          var nx, ny, pen;
          if (d2 < 0.0001) {
            /* center swallowed by the rect — escape via the nearest edge */
            var eL = pos.x - o.l, eR = o.r - pos.x, eT = pos.y - o.t, eB = o.b - pos.y;
            var m = Math.min(eL, eR, eT, eB);
            nx = m === eL ? -1 : m === eR ? 1 : 0;
            ny = nx ? 0 : (m === eT ? -1 : 1);
            pen = collisionRadius + m;
          } else {
            var d = Math.sqrt(d2);
            nx = dx / d; ny = dy / d;
            pen = collisionRadius - d;
          }
          var push = hard ? pen : Math.min(pen, Math.max(1.5, pen * 0.3));
          pos.x += nx * push;
          pos.y += ny * push;
          var vn = vel.x * nx + vel.y * ny;
          if (vn < 0) { vel.x -= (1 + REST) * vn * nx; vel.y -= (1 + REST) * vn * ny; }
        }
      }

      function step(t) {
        if (holding && dragPt) {
          var tx = dragPt.x + grab.dx, ty = dragPt.y + grab.dy;
          var tz = clamp(grab.startZ + (grab.startY - dragPt.y) * 0.34, -82, 126);
          vel.x = (tx - pos.x) * 0.55;
          vel.y = (ty - pos.y) * 0.55;
          vel.z = (tz - pos.z) * 0.34;
          pos.x += vel.x;
          pos.y += vel.y;
          pos.z += vel.z;
          spin.x = spin.x * 0.74 + vel.y * 0.018;
          spin.y = spin.y * 0.74 - vel.x * 0.018;
          spin.z = spin.z * 0.76 + (vel.x - vel.y) * 0.006;
          rotation.x += spin.x; rotation.y += spin.y; rotation.z += spin.z;
          collide(true);
          return;
        }
        var target = driftTarget(t);
        var sp = Math.hypot(vel.x, vel.y, vel.z);
        vel.x += (target.x - pos.x) * K;
        vel.y += (target.y - pos.y) * K;
        vel.z += (target.z - pos.z) * KZ;
        vel.x += gyro.x * 0.6;
        vel.y += gyro.y * 0.6;
        var fr = sp > 5 ? 0.988 : 0.94; /* glide fast, settle slow */
        vel.x *= fr;
        vel.y *= fr;
        vel.z *= sp > 5 ? 0.985 : 0.92;
        pos.x += vel.x;
        pos.y += vel.y;
        pos.z += vel.z;
        spin.x = (spin.x + vel.y * 0.0032 - vel.z * 0.0008) * 0.986;
        spin.y = (spin.y - vel.x * 0.0032 + vel.z * 0.0011) * 0.986;
        spin.z = (spin.z + (vel.x - vel.y) * 0.0009) * 0.984;
        rotation.x += spin.x;
        rotation.y += spin.y;
        rotation.z += spin.z;
        collide(false);
        /* A vanishingly small tangential bias prevents a low-energy throw from
           numerically resting in a compound corner before home gravity wins. */
        if (sp < 0.045 && Math.hypot(pos.x - homeX, pos.y - homeY, pos.z) > 45) {
          vel.x += (homeY - pos.y) * 0.00008;
          vel.y -= (homeX - pos.x) * 0.00008;
        }
      }

      function render(t) {
        var sc = (holding ? 1.025 : 1) * clamp(1 + pos.z / 1250, 0.9, 1.18);
        /* No rotateX/rotateY/rotateZ: tilting a flat circle in perspective
           renders an ellipse. A sphere's silhouette is rotation-invariant,
           so the element only translates and scales. */
        orb.style.transform = "translate3d(" + (pos.x - homeX).toFixed(2) + "px," + (pos.y - homeY).toFixed(2) + "px," + pos.z.toFixed(2) + "px) scale(" + sc.toFixed(4) + ")";
        var fluidX = clamp(-vel.x * 1.18, -28, 28);
        var fluidY = clamp(-vel.y * 1.18 + vel.z * 0.3, -28, 28);
        orb.style.setProperty("--fluid-x", fluidX.toFixed(2) + "px");
        orb.style.setProperty("--fluid-y", fluidY.toFixed(2) + "px");
        orb.style.setProperty("--fluid-scale", clamp(1 + Math.hypot(vel.x, vel.y, vel.z) / 190, 1, 1.16).toFixed(3));
        /* shadow: rides under the orb, stretches with speed, thins with lift */
        var sp = Math.hypot(vel.x, vel.y, vel.z);
        var liftN = clamp(((homeY - pos.y) + Math.max(0, pos.z) * 0.52) / 300, 0, 1);
        var s2 = 1 - liftN * 0.43 + (holding ? 0.05 : 0);
        var sx = s2 * (1 + Math.min(0.35, sp * 0.02));
        shadow.style.transform = "translate3d(" + (pos.x - R * 0.767 + vel.x * 0.45).toFixed(2) + "px," + (pos.y + R * 0.61 - Math.max(0, pos.z) * 0.08).toFixed(2) + "px,0) scale(" + sx.toFixed(3) + "," + s2.toFixed(3) + ")";
        shadow.style.opacity = (0.47 * s2 + (holding ? 0.07 : 0)).toFixed(3);
      }

      function loop(t) {
        rafId = running ? requestAnimationFrame(loop) : 0;
        if (!seeded) return;
        var dt = Math.min(64, t - (lastT || t));
        lastT = t;
        accT += dt;
        while (accT >= 16.6) { step(t); accT -= 16.6; }
        render(t);
      }
      function setRunning(on) {
        on = on && inView && !document.hidden;
        if (on === running) return;
        running = on;
        lastT = 0;
        accT = 0;
        if (on && !rafId) rafId = requestAnimationFrame(loop);
      }
      if ("IntersectionObserver" in window) {
        new IntersectionObserver(function (en) {
          inView = en[0].isIntersecting;
          setRunning(true);
        }, { rootMargin: "120px" }).observe(wrap);
      } else { inView = true; setRunning(true); }
      document.addEventListener("visibilitychange", function () { setRunning(true); });

      /* grab / drag / throw */
      var trail = [];
      orb.addEventListener("pointerdown", function (e) {
        if (!seeded) return;
        holding = true;
        orb.classList.add("is-held");
        try { orb.setPointerCapture(e.pointerId); } catch (err) { /* no capture, drag still works */ }
        var wr = wrap.getBoundingClientRect();
        dragPt = { x: e.clientX - wr.left, y: e.clientY - wr.top };
        grab.dx = pos.x - dragPt.x;
        grab.dy = pos.y - dragPt.y;
        grab.startY = dragPt.y;
        grab.startZ = pos.z;
        trail = [{ t: performance.now(), x: dragPt.x, y: dragPt.y, z: pos.z }];
        hintDone();
        e.preventDefault();
      });
      orb.addEventListener("pointermove", function (e) {
        if (!holding) return;
        var wr = wrap.getBoundingClientRect();
        dragPt = { x: e.clientX - wr.left, y: e.clientY - wr.top };
        var now = performance.now();
        var trailZ = clamp(grab.startZ + (grab.startY - dragPt.y) * 0.34, -82, 126);
        trail.push({ t: now, x: dragPt.x, y: dragPt.y, z: trailZ });
        while (trail.length > 2 && now - trail[0].t > 120) trail.shift();
      });
      function release() {
        if (!holding) return;
        holding = false;
        orb.classList.remove("is-held");
        dragPt = null;
        /* flick velocity from the last ~120ms of pointer travel — truer
           to a fast throw than the follow-lag velocity alone */
        if (trail.length > 1) {
          var a = trail[0], b = trail[trail.length - 1];
          var dt = b.t - a.t;
          if (dt >= 2) {
            var fx = (b.x - a.x) / dt * 16.7;
            var fy = (b.y - a.y) / dt * 16.7;
            var fz = (b.z - a.z) / dt * 16.7;
            if (Math.hypot(fx, fy, fz) > Math.hypot(vel.x, vel.y, vel.z)) { vel.x = fx; vel.y = fy; vel.z = fz; }
          }
        }
        trail = [];
        vel.x *= 1.15; vel.y *= 1.15; /* let the throw carry */
        var planar = Math.hypot(vel.x, vel.y);
        vel.z += Math.min(17, planar * 0.34); /* a firm flick comes toward you */
        spin.x += vel.y * 0.045;
        spin.y -= vel.x * 0.045;
        spin.z += (vel.x - vel.y) * 0.018;
        var sp = Math.hypot(vel.x, vel.y, vel.z);
        if (sp > 49) { vel.x *= 49 / sp; vel.y *= 49 / sp; vel.z *= 49 / sp; }
      }
      orb.addEventListener("pointerup", release);
      orb.addEventListener("pointercancel", release);

      /* ── gyroscope roll — the phone's tilt steers the orb on screen ── */
      if (window.matchMedia("(hover: none), (pointer: coarse)").matches) (function () {
        function onTilt(e) {
          if (e.gamma == null || e.beta == null) return;
          gyro.x = clamp(e.gamma, -30, 30) / 30;
          gyro.y = clamp(e.beta - 42, -30, 30) / 30;
        }
        function arm() { window.addEventListener("deviceorientation", onTilt, true); }
        if (typeof DeviceOrientationEvent !== "undefined" && typeof DeviceOrientationEvent.requestPermission === "function") {
          /* iOS grants motion only after a user gesture */
          var ask = function () {
            DeviceOrientationEvent.requestPermission().then(function (s) { if (s === "granted") arm(); }).catch(function () { /* denied — touch drag still works */ });
          };
          window.addEventListener("touchend", ask, { once: true, passive: true });
        } else arm();
      })();

      /* ── drag hint — quiet micro-label invitation ── */
      var HKEY = "bndr.orbHint.v351";
      var hint = null, seen = false;
      try { seen = sessionStorage.getItem(HKEY) === "1"; } catch (e) { /* storage blocked — show it */ }
      if (!seen && finePointer) {
        hint = el("div", "orb-hint",
          '<span class="orb-hint-breath"><span class="orb-hint-arrow">↑</span><span class="orb-hint-label">Click and Hold to Throw</span></span>');
        wrap.appendChild(hint);
        window.addEventListener("scroll", function () {
          if (hint) hint.classList.toggle("is-away", window.scrollY > 70);
        }, { passive: true });
      }
      function hintDone() {
        if (!hint) return;
        try { sessionStorage.setItem(HKEY, "1"); } catch (e) { /* fine — hides this page-view only */ }
        var h = hint;
        hint = null;
        h.classList.add("is-away");
        setTimeout(function () { h.remove(); }, 750);
      }

      /* first layout, then re-measure once webfonts settle the headline */
      remeasure();
      if (document.fonts && document.fonts.ready) document.fonts.ready.then(remeasure);
      window.addEventListener("load", remeasure);
      var rzT;
      window.addEventListener("resize", function () {
        clearTimeout(rzT);
        rzT = setTimeout(remeasure, 140);
      });
    })();
  })();

  /* Unify final display punctuation after both static and dynamic titles have
     rendered. Only existing trailing periods are touched; copy is unchanged. */
  function lockTitleDot(node) {
    if (!node || !node.parentNode) return;
    var previous = node.previousSibling;
    if (previous && previous.nodeType === 3 && previous.nodeValue.slice(-1) === "\u2060") return;
    /* WORD JOINER is invisible but keeps the signal attached to its word at
       responsive line breaks. It avoids wrapping the glowing period alone. */
    node.parentNode.insertBefore(document.createTextNode("\u2060"), node);
  }
  function finishTitleDots(node) {
    if (!node) return;
    if (node.nodeType === 1 && node.classList.contains("title-dot")) {
      lockTitleDot(node);
      return;
    }
    if (node.nodeType === 3) {
      if (node.nodeValue.indexOf(".") === -1) return;
      var parts = node.nodeValue.split(".");
      var fragment = document.createDocumentFragment();
      parts.forEach(function (part, index) {
        if (part) fragment.appendChild(document.createTextNode(part));
        if (index < parts.length - 1) {
          fragment.appendChild(document.createTextNode("\u2060"));
          fragment.appendChild(el("span", "title-dot", "."));
        }
      });
      node.parentNode.replaceChild(fragment, node);
      return;
    }
    if (node.nodeType !== 1) return;
    if (node.textContent.trim() === "." && node.children.length === 0) {
      node.classList.add("title-dot");
      node.removeAttribute("style");
      lockTitleDot(node);
      return;
    }
    Array.prototype.slice.call(node.childNodes).forEach(finishTitleDots);
  }
  /* All visible public heading levels share the same sentence-period signal.
     Dashboard does not load this runtime, so its editing UI remains untouched. */
  document.querySelectorAll("h1, h2, h3, h4, .card-title, .show-title").forEach(finishTitleDots);

  /* Fine-pointer cursor: two tiny DOM nodes, one animation frame, zero assets.
     Inputs retain the native text cursor and touch/reduced-motion skip it. */
  if (finePointer && !reduced) (function armCursor() {
    var dot = el("span", "bndr-cursor-dot");
    var ring = el("span", "bndr-cursor-ring");
    dot.setAttribute("aria-hidden", "true");
    ring.setAttribute("aria-hidden", "true");
    document.body.appendChild(ring);
    document.body.appendChild(dot);
    var x = -50, y = -50, rx = -50, ry = -50, active = false, frame = 0;
    function draw() {
      frame = 0;
      rx += (x - rx) * 0.2;
      ry += (y - ry) * 0.2;
      dot.style.transform = "translate3d(" + x + "px," + y + "px,0) translate(-50%,-50%)";
      ring.style.transform = "translate3d(" + rx + "px," + ry + "px,0) translate(-50%,-50%)";
      if (active && (Math.abs(x - rx) > 0.08 || Math.abs(y - ry) > 0.08)) frame = requestAnimationFrame(draw);
    }
    document.addEventListener("pointermove", function (e) {
      if (e.pointerType === "touch") return;
      x = e.clientX; y = e.clientY; active = true;
      document.body.classList.add("cursor-ready");
      var nativeTarget = e.target.closest && e.target.closest("input, textarea, select, [contenteditable='true']");
      var action = e.target.closest && e.target.closest("a, button, .card, .show-frame, .orb");
      dot.classList.toggle("is-native", !!nativeTarget);
      ring.classList.toggle("is-native", !!nativeTarget);
      ring.classList.toggle("is-action", !!action && !nativeTarget);
      if (!frame) frame = requestAnimationFrame(draw);
    }, { passive: true });
    document.addEventListener("pointerleave", function () { active = false; document.body.classList.remove("cursor-ready"); });
    window.addEventListener("blur", function () { active = false; document.body.classList.remove("cursor-ready"); });
  })();

  /* math upgrade: no-op unless the page carries math */
  if (MD.mathUpgrade) MD.mathUpgrade(document);

  armReveals();
})();
