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
  function esc(s) {
    return String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }
  function fill(s, vars) {
    for (var k in vars) s = s.split("{" + k + "}").join(vars[k]);
    return s;
  }
  function count(n) {
    return n >= 1000 ? (Math.round(n / 100) / 10) + "K" : String(n);
  }
  /* Marks go on the raw text and each piece is escaped once, so a term can
     never match inside markup written here. */
  function mark(text, ts) {
    var parts = ts.map(function (t) { return t.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); });
    if (!parts.length) return esc(text);
    var re = new RegExp("(" + parts.join("|") + ")", "gi");
    return String(text).split(re).map(function (p, i) { return i % 2 ? "<mark>" + esc(p) + "</mark>" : esc(p); }).join("");
  }
  var expanded = {}; // facet key -> how many values are shown
  var finding = {};  // facet key -> the facet's own search text

  function facetHtml(f, matched) {
    var body;
    if (f.range) {
      var ranges = dateRanges(state.min || state.max ? results(withChange(function (s) { s.min = 0; s.max = 0; })) : matched);
      body =
        '<form class="is-range" data-range>' +
        '<label>' + esc(T.start) + ' <input type="number" name="min" inputmode="numeric" value="' + (state.min || "") + '"></label>' +
        '<label>' + esc(T.end) + ' <input type="number" name="max" inputmode="numeric" value="' + (state.max || "") + '"></label>' +
        '<button type="submit">' + esc(T.apply) + '</button></form>' +
        '<ul class="is-values">' +
        ranges.map(function (r) {
          var on = state.min === r.min && state.max === r.max;
          return '<li><a href="' + esc(toUrl(withChange(function (s) { s.min = r.min; s.max = r.max; s.page = 1; }))) + '" data-range-min="' + r.min + '" data-range-max="' + r.max + '"' + (on ? ' aria-current="true"' : "") + '>' +
            '<span class="is-label">' + r.min + " - " + r.max + '</span><span class="is-count">' + count(r.n) + "</span></a></li>";
        }).join("") +
        "</ul>";
    } else {
      // Counts over the results WITHOUT this facet's own selection, so a
      // reader can see what else the facet offers; selected values on top.
      var base = results(withChange(function (s) { delete s.filters[f.key]; }));
      var all = facetCounts(f.key, base);
      var chosen = state.filters[f.key] || [];
      var needle = (finding[f.key] || "").toLowerCase();
      var list = all.filter(function (x) { return !needle || valueLabel(f.key, x.v).toLowerCase().indexOf(needle) >= 0; });
      list.sort(function (a, b) { return (chosen.indexOf(b.v) >= 0) - (chosen.indexOf(a.v) >= 0); });
      if (!all.length) return "";
      var shown = expanded[f.key] || f.show;
      body =
        '<ul class="is-values">' +
        list.slice(0, shown).map(function (x) {
          var on = chosen.indexOf(x.v) >= 0;
          var next = withChange(function (s) {
            var cur = s.filters[f.key] || [];
            s.filters[f.key] = on ? cur.filter(function (v) { return v !== x.v; }) : cur.concat([x.v]);
            if (!s.filters[f.key].length) delete s.filters[f.key];
            s.page = 1;
          });
          return '<li><a href="' + esc(toUrl(next)) + '" data-facet="' + esc(f.key) + '" data-value="' + esc(x.v) + '"' + (on ? ' aria-current="true"' : "") + ' dir="auto">' +
            '<span class="is-check" aria-hidden="true">' + (on ? "&#x2611;" : "&#x2610;") + '</span>' +
            '<span class="is-label">' + esc(valueLabel(f.key, x.v)) + '</span><span class="is-count">' + count(x.n) + "</span></a></li>";
        }).join("") +
        "</ul>" +
        '<div class="is-more">' +
        (list.length > shown ? '<button type="button" data-more="' + esc(f.key) + '">' + esc(T.showMore) + "</button>" : "") +
        (shown > f.show ? '<button type="button" data-less="' + esc(f.key) + '">' + esc(T.showLess) + "</button>" : "") +
        "</div>" +
        (f.find ? '<input type="search" class="is-find" data-find="' + esc(f.key) + '" placeholder="' + esc(f.find) + '" aria-label="' + esc(f.find) + '" value="' + esc(finding[f.key] || "") + '">' : "");
    }
    return '<details class="is-facet" open><summary>' + esc(f.label) + "</summary>" + body + "</details>";
  }

  function cardHtml(r, ts) {
    var it = r.it;
    var dates = [
      it.govdoc ? esc(it.govdoc) : "",
      it.issued ? esc(fill(T.published, { date: it.issued })) : "",
      it.accessioned ? esc(fill(T.accepted, { date: it.accessioned })) : "",
      it.available ? esc(fill(T.availableOnline, { date: it.available })) : "",
    ].filter(Boolean).join(", ");
    var by = it.authors.length ? mark(it.authors.join("; "), ts) : '<span class="none">' + esc(T.noAuthor) + "</span>";
    var la = it.lang ? ' lang="' + esc(it.lang) + '"' : "";
    var long = it.abstract.length > 260;
    return '<li class="is-card">' +
      '<div class="is-cover">' + it.cover + "</div>" +
      '<div class="is-body">' +
      '<a class="is-title" href="' + esc(it.href) + '" dir="auto"' + la + ">" + mark(it.title, ts) + "</a>" +
      '<p class="is-by" dir="auto">' + by + (dates ? " (" + dates + ")" : "") + "</p>" +
      (it.abstract
        ? '<p class="is-abs' + (long ? " clamp" : "") + '" dir="auto"' + la + ">" + mark(it.abstract, ts) + "</p>" +
          (long ? '<button type="button" class="is-toggle" aria-expanded="false">' + esc(T.showMore) + "</button>" : "")
        : "") +
      "</div></li>";
  }

  function pagesHtml(total) {
    var last = Math.max(1, Math.ceil(total / state.rpp));
    if (last === 1) return "";
    var p = state.page;
    var want = {};
    [1, last].forEach(function (n) { want[n] = true; });
    for (var n = Math.max(1, p - 4); n <= Math.min(last, p + 5); n++) want[n] = true;
    var nums = Object.keys(want).map(Number).sort(function (a, b) { return a - b; });
    function link(n, text, label, disabled) {
      if (disabled) return '<li class="disabled"><span aria-hidden="true">' + text + "</span></li>";
      var cur = n === p;
      return '<li' + (cur ? ' class="active"' : "") + '><a href="' + esc(toUrl(withChange(function (s) { s.page = n; }))) + '" data-page="' + n + '"' +
        (cur ? ' aria-current="page"' : "") + (label ? ' aria-label="' + esc(label) + '"' : "") + ">" + text + "</a></li>";
    }
    var out = [link(p - 1, "&laquo;", T.prev, p === 1)];
    var prev = 0;
    nums.forEach(function (n) {
      if (prev && n - prev > 1) out.push('<li class="disabled"><span>…</span></li>');
      out.push(link(n, String(n)));
      prev = n;
    });
    out.push(link(p + 1, "&raquo;", T.next, p === last));
    return '<nav aria-label="' + esc(T.pagination) + '"><ul class="is-pages">' + out.join("") + "</ul></nav>";
  }

  function chipsHtml() {
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
    if (!chips.length) return "";
    return '<div class="is-chips">' + chips.map(function (c) {
      return '<a class="is-chip" href="' + esc(c.url) + '" data-nav aria-label="' + esc(fill(T.remove, { value: c.label })) + '" dir="auto">' + esc(c.label) + ' <span aria-hidden="true">&times;</span></a>';
    }).join("") +
      '<a class="is-chip is-reset" href="' + esc(toUrl(withChange(function (s) { s.filters = {}; s.min = 0; s.max = 0; s.page = 1; }))) + '" data-nav>' + esc(T.reset) + "</a></div>";
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
    els.facets.innerHTML = FACETS.map(function (f) { return facetHtml(f, matched); }).join("");
    els.chips.innerHTML = chipsHtml();
    els.status.textContent = total
      ? fill(T.showing, { from: String(from + 1), to: String(from + shown.length), total: String(total) })
      : "";
    els.list.className = "is-results is-" + state.view;
    els.list.innerHTML = shown.map(function (r) { return cardHtml(r, ts); }).join("");
    els.pages.innerHTML = pagesHtml(total);
    els.empty.hidden = total > 0;
    var lookup = els.empty.querySelector("a");
    if (lookup) {
      lookup.href = lookup.getAttribute("data-base") + encodeURIComponent(state.query);
      lookup.textContent = lookup.getAttribute("data-template").split("{q}").join(state.query);
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
  sortSel.innerHTML = SORTS.map(function (o) { return '<option value="' + o.sf + "," + o.sd + '">' + esc(o.label) + "</option>"; }).join("");
  sortSel.addEventListener("change", function () {
    var v = sortSel.value.split(",");
    go(withChange(function (s) { s.sf = v[0]; s.sd = v[1]; s.page = 1; }), true);
  });
  var rppSel = document.getElementById("is-rpp");
  rppSel.innerHTML = PER_PAGE.map(function (n) { return '<option value="' + n + '">' + n + "</option>"; }).join("");
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
