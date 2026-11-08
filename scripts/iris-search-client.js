/*
 * The replica's search page, in the browser (issue #196).
 *
 * Inlined into site/search.html by gen-iris-pages.ts, which puts two JSON
 * blocks beside it: #iris-search-data (one record per held item, read from
 * its Dublin Core record) and #iris-search-strings (the page's words in its
 * language).
 *
 * THE FACET CATEGORIES ARE FIXED, THEIR VALUES ARE NOT. Every value and every
 * count is computed here from the items the current query and filters match,
 * as DSpace Discovery does, so nothing a reader sees in a facet was typed by
 * hand. The URL parameters are IRIS's own (query, f.<facet>=<value>,equals,
 * f.dateIssued.min/max, spc.page, spc.sf, spc.sd, spc.rpp), so a search
 * copied from iris.who.int works here with its host changed.
 */
(function () {
  "use strict";
  var items = JSON.parse(document.getElementById("iris-search-data").textContent);
  var T = JSON.parse(document.getElementById("iris-search-strings").textContent);
  var root = document.getElementById("iris-search");
  if (!root) return;

  /* The facets, in IRIS's order. `show` is how many values a facet lists
     before "Show more", as the capture shows them. */
  var FACETS = [
    { key: "author", label: T.author, find: T.findAuthor, show: 5 },
    { key: "mesh", label: T.subject, find: T.findSubject, show: 5 },
    { key: "dateIssued", label: T.dateIssued, range: true },
    { key: "has_content_in_original_bundle", label: T.hasFiles, show: 2 },
    { key: "publisher", label: T.publisher, find: T.findPublisher, show: 10 },
    { key: "subject", label: T.subject, find: T.findSubject, show: 5 },
    { key: "series", label: T.series, find: T.findSeries, show: 10 },
    { key: "itemtype", label: T.type, find: T.findType, show: 10 },
  ];
  var SORTS = [
    { sf: "score", sd: "DESC", label: T.sortRelevant },
    { sf: "dc.title", sd: "ASC", label: T.sortTitle },
    { sf: "dc.date.issued", sd: "DESC", label: T.sortIssued },
    { sf: "dc.date.accessioned", sd: "DESC", label: T.sortAccessioned },
    { sf: "dc.date.available", sd: "DESC", label: T.sortAvailable },
  ];
  var PER_PAGE = [1, 5, 10, 20, 40, 60, 80, 100];

  /* Values a facet holds for one item. Has files is a yes/no. */
  function valuesOf(it, key) {
    if (key === "has_content_in_original_bundle") return [it.hasFiles ? "true" : "false"];
    return it.f[key] || [];
  }
  function valueLabel(key, v) {
    if (key === "has_content_in_original_bundle") return v === "true" ? T.yes : T.no;
    return v;
  }

  // ── State, read from and written to the URL ──────────────────────────────
  var state;
  function readUrl(search) {
    var p = new URLSearchParams(search === undefined ? window.location.search : search);
    var s = {
      query: (p.get("query") || p.get("q") || "").trim(),
      filters: {},
      min: parseInt(p.get("f.dateIssued.min") || "", 10) || 0,
      max: parseInt(p.get("f.dateIssued.max") || "", 10) || 0,
      page: Math.max(1, parseInt(p.get("spc.page") || "1", 10) || 1),
      sf: p.get("spc.sf") || "score",
      sd: (p.get("spc.sd") || "").toUpperCase(),
      rpp: parseInt(p.get("spc.rpp") || "10", 10) || 10,
      view: p.get("view") === "grid" ? "grid" : "list",
    };
    FACETS.forEach(function (f) {
      if (f.range) return;
      var vals = p.getAll("f." + f.key).map(function (v) { return v.replace(/,(equals|authority)$/, ""); });
      if (vals.length) s.filters[f.key] = vals;
    });
    var sort = SORTS.filter(function (o) { return o.sf === s.sf; })[0] || SORTS[0];
    s.sf = sort.sf;
    if (s.sd !== "ASC" && s.sd !== "DESC") s.sd = sort.sd;
    if (PER_PAGE.indexOf(s.rpp) < 0) s.rpp = 10;
    return s;
  }
  function toUrl(s) {
    var p = new URLSearchParams();
    if (s.query) p.set("query", s.query);
    FACETS.forEach(function (f) {
      (s.filters[f.key] || []).forEach(function (v) { p.append("f." + f.key, v + ",equals"); });
    });
    if (s.min) p.set("f.dateIssued.min", String(s.min));
    if (s.max) p.set("f.dateIssued.max", String(s.max));
    if (s.sf !== "score") { p.set("spc.sf", s.sf); p.set("spc.sd", s.sd); }
    if (s.rpp !== 10) p.set("spc.rpp", String(s.rpp));
    if (s.view === "grid") p.set("view", "grid");
    p.set("spc.page", String(s.page));
    return "?" + p.toString();
  }
  function go(next, push) {
    state = next;
    var url = toUrl(state);
    try {
      if (push) history.pushState(null, "", url);
      else history.replaceState(null, "", url);
    } catch (e) { /* a file:// page may refuse; the page still renders */ }
    render();
  }
  function withChange(change) {
    var s = JSON.parse(JSON.stringify(state));
    change(s);
    return s;
  }

  // ── Matching and scoring ─────────────────────────────────────────────────
  function terms(q) {
    return q.toLowerCase().split(/\s+/).filter(Boolean);
  }
  /* Every term must appear somewhere. A hit in the title counts most, then
     authors and subjects, then the abstract: a stated weighting, not DSpace's
     Solr score, which this page has no way to reproduce. */
  function score(it, ts) {
    var s = 0;
    for (var i = 0; i < ts.length; i++) {
      var t = ts[i];
      if (it.text.indexOf(t) < 0) return -1;
      if (it.titleLc.indexOf(t) >= 0) s += 5;
      if (it.facetLc.indexOf(t) >= 0) s += 2;
      if (it.abstractLc.indexOf(t) >= 0) s += 1;
    }
    return s;
  }
  function passes(it, s, skipKey) {
    for (var k in s.filters) {
      if (k === skipKey) continue;
      var want = s.filters[k];
      var have = valuesOf(it, k);
      for (var i = 0; i < want.length; i++) if (have.indexOf(want[i]) < 0) return false;
    }
    if (skipKey !== "dateIssued") {
      if (s.min && !(it.year && it.year >= s.min)) return false;
      if (s.max && !(it.year && it.year <= s.max)) return false;
    }
    return true;
  }
  function results(s) {
    var ts = terms(s.query);
    var out = [];
    for (var i = 0; i < items.length; i++) {
      var sc = score(items[i], ts);
      if (sc < 0 || !passes(items[i], s)) continue;
      out.push({ it: items[i], score: sc });
    }
    var dir = s.sd === "ASC" ? 1 : -1;
    var key = { "dc.title": "title", "dc.date.issued": "issued", "dc.date.accessioned": "accessioned", "dc.date.available": "available" }[s.sf];
    out.sort(function (a, b) {
      if (!key) {
        if (b.score !== a.score) return b.score - a.score;
        return (b.it.accessioned || "").localeCompare(a.it.accessioned || "");
      }
      var x = a.it[key] || "", y = b.it[key] || "";
      // An item with no value goes last whichever way the sort runs.
      if (!x !== !y) return x ? -1 : 1;
      var c = key === "title" ? x.localeCompare(y, document.documentElement.lang || "en") : x.localeCompare(y);
      return c * dir || a.it.title.localeCompare(b.it.title);
    });
    return out;
  }

  /* A facet's values and counts over the current results. */
  function facetCounts(key, matched) {
    var counts = {};
    matched.forEach(function (r) {
      valuesOf(r.it, key).forEach(function (v) { counts[v] = (counts[v] || 0) + 1; });
    });
    return Object.keys(counts)
      .map(function (v) { return { v: v, n: counts[v] }; })
      .sort(function (a, b) { return b.n - a.n || a.v.localeCompare(b.v); });
  }
  /* Date ranges from the years present, at most ten, on a round gap, as
     Discovery draws them (1920 - 1959, 1960 - 1999, …). */
  function dateRanges(matched) {
    var years = matched.map(function (r) { return r.it.year; }).filter(Boolean);
    if (!years.length) return [];
    var lo = Math.min.apply(null, years), hi = Math.max.apply(null, years);
    var gaps = [1, 2, 5, 10, 20, 25, 40, 50, 100, 200, 500];
    var gap = gaps[gaps.length - 1];
    for (var g = 0; g < gaps.length; g++) {
      if (Math.floor(hi / gaps[g]) - Math.floor(lo / gaps[g]) + 1 <= 10) { gap = gaps[g]; break; }
    }
    var out = [];
    for (var start = Math.floor(lo / gap) * gap; start <= hi; start += gap) {
      var a = Math.max(start, lo), b = Math.min(start + gap - 1, hi);
      var n = years.filter(function (y) { return y >= a && y <= b; }).length;
      if (n) out.push({ min: a, max: b, n: n });
    }
    return out;
  }

  // ── Drawing ──────────────────────────────────────────────────────────────
  //
  // Every node is built with createElement and every string goes in with
  // createTextNode or setAttribute, so no value from the URL, a search box
  // or the data is ever parsed as HTML.
  function h(tag, attrs) {
    var el = document.createElement(tag);
    for (var k in attrs || {}) {
      if (attrs[k] === undefined || attrs[k] === null || attrs[k] === false) continue;
      if (k === "text") el.textContent = attrs[k];
      else el.setAttribute(k, attrs[k] === true ? "" : String(attrs[k]));
    }
    for (var i = 2; i < arguments.length; i++) add(el, arguments[i]);
    return el;
  }
  function add(el, child) {
    if (child === undefined || child === null || child === false) return;
    if (Array.isArray(child)) { child.forEach(function (c) { add(el, c); }); return; }
    el.appendChild(child instanceof Node ? child : document.createTextNode(String(child)));
  }
  function fill(s, vars) {
    for (var k in vars) s = s.split("{" + k + "}").join(vars[k]);
    return s;
  }
  function count(n) {
    return n >= 1000 ? (Math.round(n / 100) / 10) + "K" : String(n);
  }
  /* The text with each query term wrapped in <mark>, as text nodes. */
  function mark(text, ts) {
    var frag = document.createDocumentFragment();
    var parts = ts.map(function (t) { return t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); });
    if (!parts.length) { frag.appendChild(document.createTextNode(text)); return frag; }
    String(text).split(new RegExp("(" + parts.join("|") + ")", "gi")).forEach(function (p, i) {
      frag.appendChild(i % 2 ? h("mark", { text: p }) : document.createTextNode(p));
    });
    return frag;
  }
  /* Only a relative path or an https URL is used as a link target. */
  function safeHref(u) {
    return typeof u === "string" && (/^https:\/\//i.test(u) || !/^[a-z][a-z0-9+.-]*:/i.test(u.trim())) ? u : "#";
  }
  /* The cover cell the generator described: an image, or a placeholder. */
  function coverNode(c) {
    if (c && c.src) {
      return h("a", { href: safeHref(c.href) }, h("img", { src: safeHref(c.src), width: c.w, height: c.h, alt: c.alt, loading: "lazy" }));
    }
    var lines = String((c && c.text) || "").split("\n");
    var span = h("span", { class: "nocover", title: c && c.title });
    lines.forEach(function (l, i) { if (i) span.appendChild(h("br")); span.appendChild(document.createTextNode(l)); });
    return span;
  }
  var expanded = {}; // facet key -> how many values are shown
  var finding = {};  // facet key -> the facet's own search text

  function facetNode(f, matched) {
    var body = [];
    if (f.range) {
      var ranges = dateRanges(state.min || state.max ? results(withChange(function (s) { s.min = 0; s.max = 0; })) : matched);
      body.push(h("form", { class: "is-range", "data-range": true },
        h("label", {}, T.start + " ", h("input", { type: "number", name: "min", inputmode: "numeric", value: state.min || "" })),
        h("label", {}, T.end + " ", h("input", { type: "number", name: "max", inputmode: "numeric", value: state.max || "" })),
        h("button", { type: "submit", text: T.apply })));
      body.push(h("ul", { class: "is-values" }, ranges.map(function (r) {
        var on = state.min === r.min && state.max === r.max;
        return h("li", {}, h("a", {
          href: toUrl(withChange(function (s) { s.min = r.min; s.max = r.max; s.page = 1; })),
          "data-range-min": r.min, "data-range-max": r.max, "aria-current": on ? "true" : null,
        }, h("span", { class: "is-label", text: r.min + " - " + r.max }), h("span", { class: "is-count", text: count(r.n) })));
      })));
    } else {
      // Counts over the results WITHOUT this facet's own selection, so a
      // reader can see what else the facet offers; selected values on top.
      var all = facetCounts(f.key, results(withChange(function (s) { delete s.filters[f.key]; })));
      if (!all.length) return null;
      var chosen = state.filters[f.key] || [];
      var needle = (finding[f.key] || "").toLowerCase();
      var list = all.filter(function (x) { return !needle || valueLabel(f.key, x.v).toLowerCase().indexOf(needle) >= 0; });
      list.sort(function (a, b) { return (chosen.indexOf(b.v) >= 0) - (chosen.indexOf(a.v) >= 0); });
      var shown = expanded[f.key] || f.show;
      body.push(h("ul", { class: "is-values" }, list.slice(0, shown).map(function (x) {
        var on = chosen.indexOf(x.v) >= 0;
        var next = withChange(function (s) {
          var cur = s.filters[f.key] || [];
          s.filters[f.key] = on ? cur.filter(function (v) { return v !== x.v; }) : cur.concat([x.v]);
          if (!s.filters[f.key].length) delete s.filters[f.key];
          s.page = 1;
        });
        return h("li", {}, h("a", { href: toUrl(next), "data-facet": f.key, "aria-current": on ? "true" : null, dir: "auto" },
          h("span", { class: "is-check", "aria-hidden": "true", text: on ? "☑" : "☐" }),
          h("span", { class: "is-label", text: valueLabel(f.key, x.v) }),
          h("span", { class: "is-count", text: count(x.n) })));
      })));
      body.push(h("div", { class: "is-more" },
        list.length > shown ? h("button", { type: "button", "data-more": f.key, text: T.showMore }) : null,
        shown > f.show ? h("button", { type: "button", "data-less": f.key, text: T.showLess }) : null));
      if (f.find) {
        body.push(h("input", { type: "search", class: "is-find", "data-find": f.key, placeholder: f.find, "aria-label": f.find, value: finding[f.key] || "" }));
      }
    }
    return h("details", { class: "is-facet", open: true }, h("summary", { text: f.label }), body);
  }

  function cardNode(r, ts) {
    var it = r.it;
    var dates = [
      it.govdoc || "",
      it.issued ? fill(T.published, { date: it.issued }) : "",
      it.accessioned ? fill(T.accepted, { date: it.accessioned }) : "",
      it.available ? fill(T.availableOnline, { date: it.available }) : "",
    ].filter(Boolean).join(", ");
    var long = it.abstract.length > 260;
    return h("li", { class: "is-card" },
      h("div", { class: "is-cover" }, coverNode(it.cover)),
      h("div", { class: "is-body" },
        h("a", { class: "is-title", href: safeHref(it.href), dir: "auto", lang: it.lang }, mark(it.title, ts)),
        h("p", { class: "is-by", dir: "auto" },
          it.authors.length ? mark(it.authors.join("; "), ts) : h("span", { class: "none", text: T.noAuthor }),
          dates ? " (" + dates + ")" : null),
        it.abstract ? h("p", { class: "is-abs" + (long ? " clamp" : ""), dir: "auto", lang: it.lang }, mark(it.abstract, ts)) : null,
        it.abstract && long ? h("button", { type: "button", class: "is-toggle", "aria-expanded": "false", text: T.showMore }) : null));
  }

  function pagesNode(total) {
    var last = Math.max(1, Math.ceil(total / state.rpp));
    if (last === 1) return null;
    var p = state.page;
    var want = {};
    want[1] = want[last] = true;
    for (var n = Math.max(1, p - 4); n <= Math.min(last, p + 5); n++) want[n] = true;
    var nums = Object.keys(want).map(Number).sort(function (a, b) { return a - b; });
    function link(n, text, label, disabled) {
      if (disabled) return h("li", { class: "disabled" }, h("span", { "aria-hidden": "true", text: text }));
      var cur = n === p;
      return h("li", { class: cur ? "active" : null }, h("a", {
        href: toUrl(withChange(function (s) { s.page = n; })), "data-page": n,
        "aria-current": cur ? "page" : null, "aria-label": label, text: text,
      }));
    }
    var out = [link(p - 1, "«", T.prev, p === 1)];
    var prev = 0;
    nums.forEach(function (n) {
      if (prev && n - prev > 1) out.push(h("li", { class: "disabled" }, h("span", { text: "…" })));
      out.push(link(n, String(n)));
      prev = n;
    });
    out.push(link(p + 1, "»", T.next, p === last));
    return h("nav", { "aria-label": T.pagination }, h("ul", { class: "is-pages" }, out));
  }

  function chipsNode() {
    var chips = [];
    FACETS.forEach(function (f) {
      (state.filters[f.key] || []).forEach(function (v) {
        chips.push({ label: f.label + ": " + valueLabel(f.key, v), url: toUrl(withChange(function (s) {
          s.filters[f.key] = s.filters[f.key].filter(function (x) { return x !== v; });
          if (!s.filters[f.key].length) delete s.filters[f.key];
          s.page = 1;
        })) });
      });
    });
    if (state.min || state.max) {
      chips.push({ label: T.dateIssued + ": " + (state.min || "…") + " - " + (state.max || "…"), url: toUrl(withChange(function (s) { s.min = 0; s.max = 0; s.page = 1; })) });
    }
    if (!chips.length) return null;
    return h("div", { class: "is-chips" },
      chips.map(function (c) {
        return h("a", { class: "is-chip", href: c.url, "data-nav": true, "aria-label": fill(T.remove, { value: c.label }), dir: "auto" },
          c.label + " ", h("span", { "aria-hidden": "true", text: "×" }));
      }),
      h("a", { class: "is-chip is-reset", href: toUrl(withChange(function (s) { s.filters = {}; s.min = 0; s.max = 0; s.page = 1; })), "data-nav": true, text: T.reset }));
  }

  var els = {
    form: document.getElementById("iris-search-form"),
    input: document.getElementById("iris-search-input"),
    facets: document.getElementById("is-facets"),
    settings: document.getElementById("is-settings"),
    chips: document.getElementById("is-chips"),
    status: document.getElementById("is-status"),
    list: document.getElementById("is-results"),
    pages: document.getElementById("is-pages"),
    empty: document.getElementById("is-empty"),
    views: root.querySelectorAll("[data-view]"),
  };

  function render() {
    var matched = results(state);
    var total = matched.length;
    var last = Math.max(1, Math.ceil(total / state.rpp));
    if (state.page > last) state.page = last;
    var from = (state.page - 1) * state.rpp;
    var shown = matched.slice(from, from + state.rpp);
    var ts = terms(state.query);

    if (els.input && document.activeElement !== els.input) els.input.value = state.query;
    els.facets.replaceChildren();
    FACETS.forEach(function (f) { add(els.facets, facetNode(f, matched)); });
    els.chips.replaceChildren();
    add(els.chips, chipsNode());
    els.status.textContent = total
      ? fill(T.showing, { from: String(from + 1), to: String(from + shown.length), total: String(total) })
      : "";
    els.list.className = "is-results is-" + state.view;
    els.list.replaceChildren();
    shown.forEach(function (r) { els.list.appendChild(cardNode(r, ts)); });
    els.pages.replaceChildren();
    add(els.pages, pagesNode(total));
    els.empty.hidden = total > 0;
    var lookup = els.empty.querySelector("a");
    if (lookup) {
      // The page wrote the link's target; only its q parameter changes here.
      var target = new URL(lookup.getAttribute("href"), location.href);
      target.searchParams.set("q", state.query);
      lookup.href = target.href;
      lookup.textContent = T.lookupTemplate.split("{q}").join(state.query);
    }
    for (var i = 0; i < els.views.length; i++) {
      els.views[i].setAttribute("aria-pressed", String(els.views[i].getAttribute("data-view") === state.view));
    }
    var sortSel = document.getElementById("is-sort");
    if (sortSel) sortSel.value = state.sf + "," + state.sd;
    var rppSel = document.getElementById("is-rpp");
    if (rppSel) rppSel.value = String(state.rpp);
  }

  // ── Wiring ───────────────────────────────────────────────────────────────
  els.form.addEventListener("submit", function (e) {
    e.preventDefault();
    var q = els.input.value.trim();
    go(withChange(function (s) { s.query = q; s.page = 1; }), true);
  });
  var sortSel = document.getElementById("is-sort");
  SORTS.forEach(function (o) { sortSel.appendChild(h("option", { value: o.sf + "," + o.sd, text: o.label })); });
  sortSel.addEventListener("change", function () {
    var v = sortSel.value.split(",");
    go(withChange(function (s) { s.sf = v[0]; s.sd = v[1]; s.page = 1; }), true);
  });
  var rppSel = document.getElementById("is-rpp");
  PER_PAGE.forEach(function (n) { rppSel.appendChild(h("option", { value: n, text: String(n) })); });
  rppSel.addEventListener("change", function () {
    var n = parseInt(rppSel.value, 10);
    go(withChange(function (s) { s.rpp = n; s.page = 1; }), true);
  });
  for (var v = 0; v < els.views.length; v++) {
    els.views[v].addEventListener("click", function (e) {
      var view = e.currentTarget.getAttribute("data-view");
      go(withChange(function (s) { s.view = view; }), false);
    });
  }

  /* Links carry real URLs (so they open in a new tab and can be copied);
     a plain click is handled here without reloading the page. */
  root.addEventListener("click", function (e) {
    var a = e.target.closest ? e.target.closest("a") : null;
    if (a && root.contains(a) && (a.hasAttribute("data-facet") || a.hasAttribute("data-range-min") || a.hasAttribute("data-page") || a.hasAttribute("data-nav"))) {
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.button !== 0) return;
      e.preventDefault();
      go(readFrom(a.getAttribute("href")), true);
      if (a.hasAttribute("data-page")) els.status.scrollIntoView({ block: "start" });
      return;
    }
    var b = e.target.closest ? e.target.closest("button") : null;
    if (!b) return;
    if (b.hasAttribute("data-more")) {
      var k = b.getAttribute("data-more");
      var f = FACETS.filter(function (x) { return x.key === k; })[0];
      expanded[k] = (expanded[k] || f.show) + f.show;
      render();
    } else if (b.hasAttribute("data-less")) {
      delete expanded[b.getAttribute("data-less")];
      render();
    } else if (b.classList.contains("is-toggle")) {
      var abs = b.previousElementSibling;
      var open = abs.classList.toggle("clamp") === false;
      b.textContent = open ? T.showLess : T.showMore;
      b.setAttribute("aria-expanded", String(open));
    }
  });
  root.addEventListener("submit", function (e) {
    if (!e.target.hasAttribute("data-range")) return;
    e.preventDefault();
    var min = parseInt(e.target.elements.min.value, 10) || 0;
    var max = parseInt(e.target.elements.max.value, 10) || 0;
    if (min && max && min > max) { var t = min; min = max; max = t; }
    go(withChange(function (s) { s.min = min; s.max = max; s.page = 1; }), true);
  });
  root.addEventListener("input", function (e) {
    var k = e.target.getAttribute && e.target.getAttribute("data-find");
    if (!k) return;
    finding[k] = e.target.value;
    var pos = e.target.selectionStart;
    render();
    var again = root.querySelector('[data-find="' + k + '"]');
    if (again) { again.focus(); try { again.setSelectionRange(pos, pos); } catch (x) {} }
  });
  function readFrom(href) {
    var i = href.indexOf("?");
    return readUrl(i < 0 ? "" : href.slice(i));
  }
  window.addEventListener("popstate", function () { state = readUrl(); render(); });

  state = readUrl();
  render();
})();
