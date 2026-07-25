/* BNDR MD — compact, XSS-safe markdown renderer.
   Escapes all HTML first, then rebuilds a strict whitelist of blocks.
   Supports: section headings h2-h4, bold, italic, strike, inline code, fenced code,
   links, images, ul/ol, blockquote, hr, paragraphs, <br> via two spaces. */
window.BNDRMD = (function () {
  "use strict";

  function esc(s) {
    return String(s)
      .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  }

  function safeUrl(u) {
    var t = String(u || "").trim();
    if (/^(https?:|mailto:|tel:|#|\/)/i.test(t) && !/^javascript:/i.test(t)) return t;
    return "#";
  }

  function inline(s) {
    // images first: ![alt](src)
    s = s.replace(/!\[([^\]]*)\]\(([^)\s]+)(?:\s+&quot;[^&]*&quot;)?\)/g, function (_, alt, src) {
      return '<img src="' + safeUrl(src) + '" alt="' + alt + '" loading="lazy" decoding="async">';
    });
    // links: [text](href)
    s = s.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, function (_, txt, href) {
      var u = safeUrl(href);
      var ext = /^https?:/i.test(u) ? ' target="_blank" rel="noopener noreferrer"' : "";
      return '<a href="' + u + '"' + ext + ">" + txt + "</a>";
    });
    // inline math: \( ... \) — upgraded by KaTeX when present, raw TeX otherwise
    s = s.replace(/\\\((.+?)\\\)/g, function (_, tex) {
      return '<span class="bndr-math">' + tex + "</span>";
    });
    s = s.replace(/`([^`]+)`/g, "<code>$1</code>");
    s = s.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
    s = s.replace(/(^|[\s(])\*([^*\n]+)\*/g, "$1<em>$2</em>");
    s = s.replace(/~~([^~]+)~~/g, "<del>$1</del>");
    s = s.replace(/ {2}\n/g, "<br>\n");
    return s;
  }

  function render(md) {
    if (md == null) return "";
    var src = esc(String(md).replace(/\r\n?/g, "\n"));
    var lines = src.split("\n");
    var out = [];
    var i = 0;

    function flushList(buf, ordered) {
      out.push((ordered ? "<ol>" : "<ul>") + buf.map(function (li) { return "<li>" + inline(li) + "</li>"; }).join("") + (ordered ? "</ol>" : "</ul>"));
    }

    while (i < lines.length) {
      var line = lines[i];

      if (/^\s*$/.test(line)) { i++; continue; }

      // fenced code
      var fence = line.match(/^```(\w*)\s*$/);
      if (fence) {
        var code = [];
        i++;
        while (i < lines.length && !/^```\s*$/.test(lines[i])) { code.push(lines[i]); i++; }
        i++;
        out.push("<pre><code" + (fence[1] ? ' class="lang-' + fence[1] + '"' : "") + ">" + code.join("\n") + "</code></pre>");
        continue;
      }

      // display math — $$ ... $$ on one line, or a fenced $$ block
      var mOne = line.match(/^\$\$(.+)\$\$\s*$/);
      if (mOne && mOne[1].trim()) {
        out.push('<div class="bndr-math bndr-math-block">' + mOne[1].trim() + "</div>");
        i++;
        continue;
      }
      if (/^\$\$\s*$/.test(line)) {
        var tex = [];
        i++;
        while (i < lines.length && !/^\$\$\s*$/.test(lines[i])) { tex.push(lines[i]); i++; }
        i++;
        out.push('<div class="bndr-math bndr-math-block">' + tex.join("\n") + "</div>");
        continue;
      }

      // hr
      if (/^(-{3,}|\*{3,})\s*$/.test(line)) { out.push("<hr>"); i++; continue; }

      // heading
      var h = line.match(/^(#{1,4})\s+(.*)$/);
      /* Every public page owns its single H1. A Markdown `#` is therefore
         safely demoted to H2 instead of creating a second document title. */
      if (h) { var lv = Math.max(2, h[1].length); out.push("<h" + lv + ">" + inline(h[2]) + "</h" + lv + ">"); i++; continue; }

      // blockquote
      if (/^&gt;\s?/.test(line)) {
        var q = [];
        while (i < lines.length && /^&gt;\s?/.test(lines[i])) { q.push(lines[i].replace(/^&gt;\s?/, "")); i++; }
        out.push("<blockquote>" + inline(q.join("<br>")) + "</blockquote>");
        continue;
      }

      // ul
      if (/^\s*[-*]\s+/.test(line)) {
        var ub = [];
        while (i < lines.length && /^\s*[-*]\s+/.test(lines[i])) { ub.push(lines[i].replace(/^\s*[-*]\s+/, "")); i++; }
        flushList(ub, false);
        continue;
      }

      // ol
      if (/^\s*\d+\.\s+/.test(line)) {
        var ob = [];
        while (i < lines.length && /^\s*\d+\.\s+/.test(lines[i])) { ob.push(lines[i].replace(/^\s*\d+\.\s+/, "")); i++; }
        flushList(ob, true);
        continue;
      }

      // paragraph — swallow until blank / block start
      var p = [line];
      i++;
      while (i < lines.length && !/^\s*$/.test(lines[i]) && !/^(#{1,4}\s|&gt;|```|\s*[-*]\s|\s*\d+\.\s|-{3,}\s*$)/.test(lines[i])) {
        p.push(lines[i]); i++;
      }
      out.push("<p>" + inline(p.join("\n")) + "</p>");
    }

    return out.join("\n");
  }

  /* Card and listing copy sits beneath an existing H2 title. Preserve the
     complete Markdown feature set while shifting owner-authored headings one
     level down so formatted summaries never break the page outline. */
  function renderNested(md) {
    return render(md).replace(/<(\/?)h([234])>/g, function (_, slash, level) {
      return "<" + slash + "h" + Math.min(4, Number(level) + 1) + ">";
    });
  }

  // strip markdown to plain text (for meta descriptions)
  function plain(md, max) {
    var t = String(md || "")
      .replace(/```[\s\S]*?```/g, " ")
      .replace(/\$\$[\s\S]*?\$\$/g, " ")
      .replace(/\\\((.+?)\\\)/g, "$1")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/[#>*_`~-]+/g, " ")
      .replace(/\s+/g, " ").trim();
    if (max && t.length > max) t = t.slice(0, max - 1).replace(/\s+\S*$/, "") + "…";
    return t;
  }

  /* upgrade .bndr-math nodes with KaTeX. The library loads once, lazily,
     and only when a page actually contains math. If it cannot load
     (offline, CDN blocked), the raw TeX stays visible — nothing breaks. */
  var mathLoading = false;
  function mathUpgrade(root) {
    var nodes = (root || document).querySelectorAll(".bndr-math:not(.math-done)");
    if (!nodes.length) return;
    function paint() {
      if (!window.katex) return;
      Array.prototype.forEach.call((root || document).querySelectorAll(".bndr-math:not(.math-done)"), function (n) {
        try {
          window.katex.render(n.textContent, n, {
            displayMode: n.classList.contains("bndr-math-block"),
            throwOnError: false
          });
          n.classList.add("math-done");
        } catch (e) { /* leave raw TeX visible */ }
      });
    }
    if (window.katex) { paint(); return; }
    document.addEventListener("bndr:katex", paint);
    if (!mathLoading) {
      mathLoading = true;
      var css = document.createElement("link");
      css.rel = "stylesheet";
      css.href = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.css";
      document.head.appendChild(css);
      var s = document.createElement("script");
      s.src = "https://cdn.jsdelivr.net/npm/katex@0.16.11/dist/katex.min.js";
      s.onload = function () { document.dispatchEvent(new CustomEvent("bndr:katex")); };
      document.head.appendChild(s);
    }
  }

  return { render: render, renderNested: renderNested, plain: plain, esc: esc, mathUpgrade: mathUpgrade };
})();
