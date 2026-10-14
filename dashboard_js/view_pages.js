// dashboard_js/view_pages.js: Weergave Pagina's.
// Alle onderdelen worden bij het bouwen achter elkaar gezet in een functie-omgeving (zie dashboard.read_js()); de volgorde staat in JS_PARTS.

  // ---------- weergave: Pagina's (bestemmingspagina's met conversie) ----------
  function poissonCdf(k, lam) {
    if (lam <= 0) return 1;
    var term = Math.exp(-lam), tot = term;
    for (var i = 1; i <= k; i++) { term *= lam / i; tot += term; }
    return Math.min(1, tot);
  }
  function pagesSum(months) {
    var out = {};
    months.forEach(function (ym) { (D.pages[ym] || []).forEach(function (r) { var o = out[r[0]] = out[r[0]] || [0, 0]; o[0] += r[1]; o[1] += r[2] || 0; }); });
    return out;
  }
  function renderPages(content) {
    var k = ctx();
    content.appendChild(notes(k));
    var pa = alignedWith(k, D.pages), card = el("section", "card");
    card.appendChild(panelHead(U.h_pages));
    content.appendChild(card);
    if (!pa.a.length) { card.appendChild(el("p", "muted", U.no_parts)); return; }
    if (pa.have < pa.of) card.appendChild(note(U.parts_note.replace("{n}", pa.have).replace("{t}", pa.of)));
    card.appendChild(note(U.pages_hint));
    var A = pagesSum(pa.a), B = pa.b ? pagesSum(pa.b) : null, totalSessions = agg(pa.a).s;
    var ls = 0, lc = 0; Object.keys(A).forEach(function (p) { ls += A[p][0]; lc += A[p][1]; });
    var siteCr = ls ? lc / ls : 0;
    var names = Object.keys(A).sort(function (x, y) { return A[y][0] - A[x][0]; }).slice(0, 15);
    var rows = names.map(function (p) {
      var a = A[p], b = B ? B[p] : null, d = b ? dlt(a[0], b[0]) : null, move = "";
      if (b && Math.max(a[0], b[0]) >= 50 && b[0] && Math.abs(d) >= 15 && Math.abs(a[0] - b[0]) >= 3.5 * Math.sqrt(a[0] + b[0])) move = d > 0 ? U.p_more : U.p_less;
      var exp = a[0] * siteCr, low = a[0] >= 50 && exp >= 8 && a[1] < 0.5 * exp && poissonCdf(a[1], exp) < 0.05;
      return { key: p, cells: [p, n0(a[0]), pct(totalSessions ? a[0] / totalSessions * 100 : 0, 1),
                               !B ? U.none : (b ? { t: sgn(d), cls: "num " + cls(d) } : { t: U.kw_new, cls: "num new" }), { t: move, cls: "txt" },
                               n0(a[1]), pct(a[0] ? a[1] / a[0] * 100 : 0, 2), { t: low ? U.page_low : "", cls: "txt" }] };
    });
    if (isNeon()) {                                      // Donker: een meter per pagina met het aandeel in de sessies
      var map = {}, prevMap = B ? {} : null; names.forEach(function (p) { map[p] = A[p][0]; if (B && B[p]) prevMap[p] = B[p][0]; });
      card.appendChild(neonRow(shareItems(k, map, totalSessions, n0, prevMap)));
    }
    var detail = el("div");
    card.appendChild(pickTable(U.th_pages, rows, function (key, tr) {
      Array.prototype.forEach.call(card.querySelectorAll("tr.pick.on"), function (x) { x.classList.remove("on"); }); tr.classList.add("on");
      trendDetail(detail, k, U.h_item_trend.replace("{name}", key), function (ym) {
        if (!D.pages[ym]) return null; var r = D.pages[ym].filter(function (x) { return x[0] === key; })[0]; return r ? r[1] : 0;
      }, n0);
    }));
    card.appendChild(detail);
    openItem(card, S.item);
    card.appendChild(note(U.page_note));
  }
  VIEWS.push({ id: "pages", label: "n_pages", icon: "pages", render: renderPages, needs: function () { return !!D.pages; } });

