// dashboard_js/view_insights2.js: Inzichten, vervolg (advertenties, wijzigingen op de site, interne zoektermen).
// Alle onderdelen worden bij het bouwen achter elkaar gezet in een functie-omgeving (zie dashboard.read_js()); de volgorde staat in JS_PARTS.

  function insightAds(content, k) {
    if (!D.ads) return;
    var aa = alignedWith(k, D.ads), card = el("section", "card"); card.appendChild(panelHead(U.in_h_ads)); content.appendChild(card);
    if (!aa.a.length) { card.appendChild(el("p", "muted", U.no_parts)); return; }
    function sum(months) {
      var o = { cost: 0, clicks: 0, ch: {} };
      months.forEach(function (ym) {
        var d = D.ads[ym]; if (!d) return;
        o.cost += d.t[0]; o.clicks += d.t[1];
        for (var c in d.c) { var x = o.ch[c] = o.ch[c] || [0, 0, 0, 0]; x[0] += d.c[c][0]; x[1] += d.c[c][1]; var s = (D.channel_stats[ym] || {})[c]; if (s) { x[2] += s[0]; x[3] += s[1]; } }
      });
      return o;
    }
    var A = sum(aa.a), B = aa.b ? sum(aa.b) : null, names = Object.keys(A.ch).sort(function (x, y) { return A.ch[y][0] - A.ch[x][0]; }), warn = [];
    if (!A.cost) { card.appendChild(el("p", "muted", U.no_data)); return; }
    card.appendChild(note(U.in_ads_hint));
    function row(name, cost, prevCost, clicks, conv, rev, key) {
      var d = prevCost ? dlt(cost, prevCost) : null, roas = rev && cost ? rev / cost : null;
      if (key && cost >= 100 && conv >= 10 && HASREV && roas !== null && roas < 1) warn.push(name);
      return { key: key || "", total: !key, cells: [name, eur(cost), !B ? U.none : { t: sgn(d), cls: "num " + (d === null ? "" : (d > 0 ? "neg" : "pos")) }, n0(clicks), clicks ? eur2(cost / clicks) : U.none,
                                                    conv === null ? U.none : n0(conv), conv ? eur(cost / conv) : U.none, HASREV && rev !== null ? eur(rev) : U.none, roas !== null && HASREV ? roas.toLocaleString(LOC, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "×" : U.none] };
    }
    var rows = names.map(function (n) { var a = A.ch[n], b = B && B.ch[n] ? B.ch[n][0] : null; return row(n, a[0], b, a[1], a[2], a[3], n); });
    var tc = 0, tr = 0, cv = 0; names.forEach(function (n) { tc += A.ch[n][2]; tr += A.ch[n][3]; });
    rows.push(row(U.total, A.cost, B ? B.cost : null, A.clicks, names.length ? tc : null, names.length ? tr : null, ""));
    card.appendChild(pickTable(U.in_th_ads, rows, null));
    if (warn.length) card.appendChild(note(U.in_ads_warn.replace("{names}", warn.join(", "))));
    card.appendChild(note(U.in_ads_note));
  }
  function insightChanges(content, k) {
    if (!D.changes) return;
    var inPeriod = D.changes.filter(function (c) { return k.p.months.indexOf(c.date.slice(0, 7)) >= 0; });
    var card = el("section", "card"); card.appendChild(panelHead(U.in_h_changes)); content.appendChild(card);
    if (!inPeriod.length) { card.appendChild(el("p", "muted", U.in_changes_none)); return; }
    card.appendChild(note(U.in_changes_hint));
    function rate(ym) { var m = byYm[ym]; return m && m.s ? m.c / m.s * 100 : null; }
    var rows = inPeriod.map(function (c) {
      var ym = c.date.slice(0, 7), before = rate(shift(ym, -1)), now = rate(ym), d = before !== null && now !== null ? now - before : null;
      return { key: c.date + c.text, cells: [c.date.slice(8) + " " + mname(ym), c.text, before === null ? U.none : pct(before, 2), now === null ? U.none : pct(now, 2),
                                             d === null ? U.none : { t: (d >= 0 ? "+" : "−") + pct(Math.abs(d), 2).replace("%", "") + " " + U.in_pp, cls: "num" }] };
    });
    card.appendChild(pickTable(U.in_th_changes, rows, null));
    card.appendChild(note(U.in_changes_note));
  }
  function insightSiteSearch(content, k) {
    if (!D.site_search) return;
    var sa = alignedWith(k, D.site_search), card = el("section", "card"); card.appendChild(panelHead(U.in_h_search)); content.appendChild(card);
    if (!sa.a.length) { card.appendChild(el("p", "muted", U.no_parts)); return; }
    var A = sumBy(sa.a, function (ym) { return D.site_search[ym]; }), B = sa.b ? sumBy(sa.b, function (ym) { return D.site_search[ym]; }) : null;
    var names = Object.keys(A).sort(function (x, y) { return A[y][0] - A[x][0]; }).slice(0, 10);
    if (!names.length) { card.appendChild(el("p", "muted", U.no_data)); return; }
    card.appendChild(note(U.in_search_hint));
    var rows = names.map(function (n) {
      var a = A[n], d = B && B[n] ? dlt(a[0], B[n][0]) : null;
      return { key: n, cells: [n, n0(a[0]), !B ? U.none : (B[n] ? { t: sgn(d), cls: "num " + cls(d) } : { t: U.kw_new, cls: "num new" }), n0(a[1]), pct(a[0] ? a[1] / a[0] * 100 : 0, 2)] };
    });
    card.appendChild(pickTable(U.in_th_search, rows, null));
    card.appendChild(note(U.in_search_note));
  }
