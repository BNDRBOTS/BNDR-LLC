/* BNDR FACTS — the verified-signal layer.
   A closed registry of cross-checked numbers, each tied to its primary
   source. The relevance engine scores registry entries against the words
   actually on a page and injects only what clears the bar — with the
   citation attached. It cannot cite anything outside this registry, so it
   cannot hallucinate a reference. Add entries only with a primary URL. */
window.BNDRFACTS = (function () {
  "use strict";

  var REGISTRY = [
    {
      id: "judge-50ms",
      value: "50 ms",
      claim: "How fast people judge a site's visual appeal — the verdict forms before a single word gets read.",
      source: "Lindgaard et al., Behaviour & IT (2006)",
      url: "https://doi.org/10.1080/01449290500330448",
      tags: ["first", "impression", "impressions", "judge", "judgment", "appeal", "visual", "instant", "milliseconds", "credible", "credibility", "design", "look", "looks", "aesthetic"]
    },
    {
      id: "credibility-design",
      value: "46.1%",
      claim: "Share of consumers who judged a website's credibility by its visual design — layout, type, color — over anything it actually said.",
      source: "Fogg et al., Stanford Web Credibility Project",
      url: "https://dl.acm.org/doi/10.1145/997078.997097",
      tags: ["credibility", "credible", "trust", "design", "layout", "typography", "type", "color", "visual", "judge", "legitimacy", "professional"]
    },
    {
      id: "mobile-abandon",
      value: "53%",
      claim: "Mobile visits abandoned when a page takes longer than three seconds to load. Slow is invisible.",
      source: "Google, The Need for Mobile Speed",
      url: "https://support.google.com/adsense/answer/7450973",
      tags: ["mobile", "speed", "slow", "fast", "load", "loading", "abandon", "bounce", "seconds", "performance", "phone"]
    },
    {
      id: "expect-2s",
      value: "2s",
      claim: "What one in two mobile users expect a page to load in. Expectations, not aspirations.",
      source: "Google via ARF",
      url: "https://thearf.org/category/news-you-can-use/many-visitors-abandon-mobile-sites-if-load-time-tops-3-seconds-via-mediapost-source-google/",
      tags: ["expect", "expectation", "speed", "load", "loading", "fast", "mobile", "seconds", "performance", "patience"]
    },
    {
      id: "conversion-100ms",
      value: "+8.4%",
      claim: "Conversion lift retail sites measured from a 0.1-second speed improvement. Milliseconds pay for themselves.",
      source: "Deloitte × Google, Milliseconds Make Millions",
      url: "https://web.dev/case-studies/milliseconds-make-millions",
      tags: ["conversion", "convert", "revenue", "sales", "sell", "retail", "speed", "milliseconds", "performance", "lift", "money", "roi"]
    },
    {
      id: "trust-referral",
      value: "88%",
      claim: "People who trust a recommendation from someone they know over any form of advertising. Referrals aren't a channel — they're the channel.",
      source: "Nielsen, Trust in Advertising 2021",
      url: "https://www.nielsen.com/insights/2021/beyond-martech-building-trust-with-consumers-and-engaging-where-sentiment-is-high/",
      tags: ["referral", "referrals", "recommendation", "recommend", "advertising", "marketing", "trust", "word", "mouth", "clients", "channel"]
    },
    {
      id: "disability-1in4",
      value: "1 in 4",
      claim: "U.S. adults living with a disability. The gap is not a niche — it's a quarter of the country.",
      source: "CDC, Disability Impacts All of Us",
      url: "https://www.cdc.gov/disability-and-health/articles-documents/disability-impacts-all-of-us-infographic.html",
      tags: ["disability", "disabled", "accessibility", "accessible", "ada", "marginalized", "gap", "inclusive", "mission", "help", "reset", "quickresets"]
    },
    {
      id: "appeal-trust-health",
      value: "Design → trust",
      claim: "Visual appeal drives whether people trust or reject a site within moments of arrival — measured on real users making real decisions.",
      source: "Sillence et al., CHI 2004",
      url: "https://dl.acm.org/doi/10.1145/985692.985776",
      tags: ["trust", "reject", "appeal", "visual", "decision", "decisions", "first", "impression", "design", "credibility"]
    }
  ];

  var STOP = { the: 1, a: 1, an: 1, and: 1, or: 1, of: 1, to: 1, in: 1, on: 1, is: 1, it: 1, for: 1, with: 1, that: 1, this: 1, you: 1, your: 1 };

  function tokenize(text) {
    var counts = {};
    String(text || "").toLowerCase().replace(/[a-z][a-z'-]+/g, function (w) {
      if (!STOP[w]) counts[w] = (counts[w] || 0) + 1;
      return w;
    });
    return counts;
  }

  /* Score each registry entry against page text. A tag hit counts once per
     distinct tag (log-damped by frequency) so one repeated word can't game
     the ranking. Returns entries sorted by score. */
  function match(text, opts) {
    opts = opts || {};
    var counts = tokenize(text);
    var scored = REGISTRY.map(function (f) {
      var score = 0, hits = [];
      for (var i = 0; i < f.tags.length; i++) {
        var t = f.tags[i];
        if (counts[t]) { score += 1 + Math.log(1 + counts[t]); hits.push(t); }
      }
      return { fact: f, score: score, hits: hits };
    }).filter(function (m) { return m.score >= (opts.threshold == null ? 3.2 : opts.threshold); });
    scored.sort(function (a, b) { return b.score - a.score; });
    return scored.slice(0, opts.limit || 2);
  }

  function byId(id) {
    for (var i = 0; i < REGISTRY.length; i++) if (REGISTRY[i].id === id) return REGISTRY[i];
    return null;
  }

  function signalHtml(f) {
    return '<aside class="signal" role="note">' +
      '<div class="signal-kicker">Verified signal</div>' +
      '<span class="signal-value">' + f.value + "</span>" +
      '<p class="signal-claim">' + f.claim + "</p>" +
      '<a href="' + f.url + '" target="_blank" rel="noopener noreferrer">' + f.source + '<span class="link-arrow" aria-hidden="true"><svg viewBox="0 0 16 16" focusable="false"><path d="M5 3h8v8M13 3 3 13"/></svg></span></a>' +
      "</aside>";
  }

  /* Inject top matches into a rendered article: first signal after the
     opening third, second before the final section. Skips injection if the
     article is too short to carry it. */
  function inject(articleEl, sourceText) {
    var matches = match(sourceText);
    if (!matches.length) return [];
    var blocks = articleEl.querySelectorAll("p, h2, h3");
    if (blocks.length < 4) return [];
    var anchors = [blocks[Math.floor(blocks.length / 3)], blocks[blocks.length - 2]];
    matches.forEach(function (m, i) {
      var host = anchors[i];
      if (!host) return;
      var wrap = document.createElement("div");
      wrap.innerHTML = signalHtml(m.fact);
      host.parentNode.insertBefore(wrap.firstChild, host.nextSibling);
    });
    return matches;
  }

  return { registry: REGISTRY, match: match, byId: byId, inject: inject, signalHtml: signalHtml };
})();
