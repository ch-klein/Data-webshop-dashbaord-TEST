// dashboard_js/view_insights.js: Weergave Inzichten (doelen, kanaalkwaliteit, nieuw/terugkerend, land, pagina's, merk tegenover niet-merk, snelheid).
// Alle onderdelen worden bij het bouwen achter elkaar gezet in een functie-omgeving (zie dashboard.read_js()); de volgorde staat in JS_PARTS.

  // ---------- weergave: Inzichten ----------
  // kanaal tegenover de rest: alleen "duidelijk beter/slechter" bij genoeg bezoek en conversies en een tweeproportietoets met z >= 3
  function channelVerdict(s1, c1, s2, c2) {
    if (s1 < 200 || s2 < 200 || c1 + c2 < 20) return "";
    var p1 = c1 / s1, p2 = c2 / s2, p = (c1 + c2) / (s1 + s2), se = Math.sqrt(p * (1 - p) * (1 / s1 + 1 / s2));
    if (!se || !p2 || !p1) return "";
    var z = (p1 - p2) / se, ratio = p1 / p2;
    if (z >= 3 && ratio >= 1.5) return U.in_better;
    if (z <= -3 && ratio <= 0.67) return U.in_worse;
    return "";
  }
  function insightChannels(content, k) {
    if (!D.channel_stats || !D.channels) return;
    var al = alignedWith(k, D.channel_stats), card = el("section", "card"); card.appendChild(panelHead(U.in_h_channels)); content.appendChild(card);
    var months = al.a.filter(function (ym) { return !!D.channels[ym]; });
    if (!months.length) { card.appendChild(el("p", "muted", U.no_parts)); return; }
    var S_ = {}, C_ = {}, ts = 0, tc = 0;
    months.forEach(function (ym) {
      for (var n in D.channels[ym]) { S_[n] = (S_[n] || 0) + D.channels[ym][n]; ts += D.channels[ym][n]; }
      for (var m in D.channel_stats[ym]) { C_[m] = (C_[m] || 0) + D.channel_stats[ym][m][0]; tc += D.channel_stats[ym][m][0]; }
    });
    var names = Object.keys(S_).sort(function (x, y) { return S_[y] - S_[x]; });
    if (!ts) { card.appendChild(el("p", "muted", U.no_data)); return; }
    card.appendChild(note(U.in_channels_hint));
    var rows = names.map(function (n) {
      var s1 = S_[n], c1 = C_[n] || 0;
      return { key: n, cells: [n, n0(s1), pct(s1 / ts * 100, 0), tc ? n0(c1) : U.none, tc ? pct(c1 / tc * 100, 0) : U.none,
                               pct(s1 ? c1 / s1 * 100 : 0, 2), { t: tc ? channelVerdict(s1, c1, ts - s1, tc - c1) : "", cls: "txt" }] };
    });
    if (isNeon()) card.appendChild(neonRow(shareItems(k, S_, ts, n0, null)));
    card.appendChild(pickTable(U.in_th_channels, rows, null));
    if (S_[names[0]] / ts >= 0.6) card.appendChild(note(U.in_depend.replace("{name}", function () { return names[0]; }).replace("{p}", function () { return pct(S_[names[0]] / ts * 100, 0); })));
    card.appendChild(note(U.in_channels_note));
  }
  function insightPages(content, k) {
    if (!D.pages) return;
    var pa = alignedWith(k, D.pages), card = el("section", "card"); card.appendChild(panelHead(U.in_h_pages)); content.appendChild(card);
    if (!pa.a.length) { card.appendChild(el("p", "muted", U.no_parts)); return; }
    var A = pagesSum(pa.a), tot = agg(pa.a);
    var names = Object.keys(A).sort(function (x, y) { return A[y][0] - A[x][0]; }).slice(0, 5);
    if (!names.length || !tot.s) { card.appendChild(el("p", "muted", U.no_data)); return; }
    var ss = 0, cc = 0;
    var rows = names.map(function (p) {
      ss += A[p][0]; cc += A[p][1];
      return { key: p, cells: [p, n0(A[p][0]), pct(A[p][0] / tot.s * 100, 0), n0(A[p][1]), tot.c ? pct(A[p][1] / tot.c * 100, 0) : U.none] };
    });
    rows.push({ total: true, key: "", cells: [U.in_top5, n0(ss), pct(ss / tot.s * 100, 0), n0(cc), tot.c ? pct(cc / tot.c * 100, 0) : U.none] });
    card.appendChild(pickTable(U.in_th_pages, rows, null));
    if (ss / tot.s >= 0.5) card.appendChild(note(U.in_concentrated.replace("{p}", function () { return pct(ss / tot.s * 100, 0); })));
    card.appendChild(note(U.in_pages_note));
  }
  function isBrand(q) {
    var s = q.toLowerCase();
    return D.brand_terms.some(function (t) { return s.indexOf(t) >= 0; });
  }
  function brandSums(months) {
    var o = { b: [0, 0], n: [0, 0] };
    months.forEach(function (ym) { (D.queries[ym] || []).forEach(function (r) { var t = o[isBrand(r[0]) ? "b" : "n"]; t[0] += r[1]; t[1] += r[3]; }); });
    return o;
  }
  function insightBrand(content, k) {
    if (!D.queries || !D.brand_terms || !D.brand_terms.length) return;
    var qa = alignedWith(k, D.queries), card = el("section", "card"); card.appendChild(panelHead(U.in_h_brand)); content.appendChild(card);
    if (!qa.a.length) { card.appendChild(el("p", "muted", U.no_parts)); return; }
    var A = brandSums(qa.a), B = qa.b ? brandSums(qa.b) : null, ta = A.b[0] + A.n[0];
    card.appendChild(note(U.in_brand_hint.replace("{terms}", D.brand_terms.join(", "))));
    function row(key, name) {
      var a = A[key], b = B ? B[key] : null, d = b ? dlt(a[0], b[0]) : null;
      return { key: key, cells: [name, n0(a[0]), pct(ta ? a[0] / ta * 100 : 0, 0), !B ? U.none : { t: sgn(d), cls: "num " + cls(d) }, n0(a[1])] };
    }
    card.appendChild(pickTable(U.in_th_brand, [row("b", U.in_brand), row("n", U.in_nonbrand)], null));
    if (B) {
      var a = A.n[0], b = B.n[0], d = dlt(a, b);
      if (b && Math.max(a, b) >= 50 && Math.abs(d) >= 15 && Math.abs(a - b) >= 3.5 * Math.sqrt(a + b)) card.appendChild(note((d > 0 ? U.in_nb_up : U.in_nb_down).replace("{p}", function () { return pct(Math.abs(d), 0); })));
    }
    card.appendChild(note(U.in_brand_note));
  }
  function insightGoals(content, k) {
    if (!D.goals) return;
    var card = el("section", "card"); card.appendChild(panelHead(U.in_h_goals)); content.appendChild(card);
    var n = k.al.a.length;
    if (!n) { card.appendChild(el("p", "muted", U.no_data)); return; }
    card.appendChild(note(U.in_goals_hint.replace("{n}", n)));
    var defs = [["sessions", "s", U.kpi.sessions, n0], ["conversions", "c", U.kpi.conversions, n0], ["revenue", "r", U.kpi.revenue, eur]], rows = [];
    defs.forEach(function (d) {
      var g = D.goals[d[0]]; if (!g || (d[1] === "r" && !HASREV)) return;
      var target = g * n, actual = k.A[d[1]], ratio = actual / target * 100;
      rows.push({ key: d[0], cells: [d[2], d[3](g), d[3](target), d[3](actual), { t: pct(ratio, 0), cls: "num " + (ratio >= 100 ? "pos" : "neg") },
                                     { t: ratio >= 100 ? U.in_goal_met : U.in_goal_open.replace("{p}", function () { return pct(100 - ratio, 0); }), cls: "txt" }] });
    });
    if (!rows.length) { card.appendChild(el("p", "muted", U.no_data)); return; }
    if (isNeon()) {
      card.appendChild(neonRow(defs.filter(function (d) { return D.goals[d[0]] && !(d[1] === "r" && !HASREV); }).map(function (d) {
        var ratio = k.A[d[1]] / (D.goals[d[0]] * n) * 100;
        return { label: d[2], fill: ratio, center: pct(ratio, 0), sub: d[3](k.A[d[1]]) + " / " + d[3](D.goals[d[0]] * n) };
      })));
    }
    card.appendChild(pickTable(U.in_th_goals, rows, null));
    card.appendChild(note(U.in_goals_note));
  }
  function insightAudience(content, k) {
    if (!D.audience) return;
    var au = alignedWith(k, D.audience), card = el("section", "card"); card.appendChild(panelHead(U.in_h_audience)); content.appendChild(card);
    if (!au.a.length) { card.appendChild(el("p", "muted", U.no_parts)); return; }
    var A = sumBy(au.a, function (ym) { return D.audience[ym]; }), B = au.b ? sumBy(au.b, function (ym) { return D.audience[ym]; }) : null;
    var kinds = ["new", "returning"].filter(function (x) { return A[x]; }), ts = 0;
    kinds.forEach(function (x) { ts += A[x][0]; });
    if (!ts || kinds.length < 2) { card.appendChild(el("p", "muted", U.no_data)); return; }
    card.appendChild(note(U.in_audience_hint));
    var rows = kinds.map(function (x) {
      var a = A[x], o = A[x === "new" ? "returning" : "new"], d = B && B[x] ? dlt(a[0], B[x][0]) : null;
      return { key: x, cells: [U.in_kind[x], n0(a[0]), pct(a[0] / ts * 100, 0), !B ? U.none : { t: sgn(d), cls: "num " + cls(d) }, n0(a[1]), pct(a[0] ? a[1] / a[0] * 100 : 0, 2),
                               { t: channelVerdict(a[0], a[1], o[0], o[1]), cls: "txt" }] };
    });
    if (isNeon()) { var am = {}; kinds.forEach(function (x) { am[x] = A[x][0]; }); card.appendChild(neonRow(shareItems(k, am, ts, n0, null, function (x) { return U.in_kind[x]; }))); }
    card.appendChild(pickTable(U.in_th_audience, rows, null));
    card.appendChild(note(U.in_audience_note));
  }
  function insightGeo(content, k) {
    if (!D.geo) return;
    var ge = alignedWith(k, D.geo), card = el("section", "card"); card.appendChild(panelHead(U.in_h_geo)); content.appendChild(card);
    if (!ge.a.length) { card.appendChild(el("p", "muted", U.no_parts)); return; }
    var A = sumBy(ge.a, function (ym) { return D.geo[ym]; }), B = ge.b ? sumBy(ge.b, function (ym) { return D.geo[ym]; }) : null, tot = 0;
    var names = Object.keys(A).sort(function (x, y) { return A[y][0] - A[x][0]; });
    names.forEach(function (n) { tot += A[n][0]; });
    var total = 0; ge.a.forEach(function (ym) { total += byYm[ym] ? byYm[ym].s : 0; });
    if (!total) { card.appendChild(el("p", "muted", U.no_data)); return; }
    card.appendChild(note(U.in_geo_hint.replace("{n}", names.length)));
    var rows = names.slice(0, 10).map(function (n) {
      var a = A[n], d = B && B[n] ? dlt(a[0], B[n][0]) : null;
      return { key: n, cells: [n, n0(a[0]), pct(a[0] / total * 100, 0), !B ? U.none : (B[n] ? { t: sgn(d), cls: "num " + cls(d) } : { t: U.kw_new, cls: "num new" }), n0(a[1]), pct(a[0] ? a[1] / a[0] * 100 : 0, 2)] };
    });
    if (isNeon()) { var gm = {}, gp = B ? {} : null; names.forEach(function (n) { gm[n] = A[n][0]; if (B && B[n]) gp[n] = B[n][0]; }); card.appendChild(neonRow(shareItems(k, gm, total, n0, gp))); }
    card.appendChild(pickTable(U.in_th_geo, rows, null));
    if (names.length && A[names[0]][0] / total < 0.5) card.appendChild(note(U.in_geo_spread));
    card.appendChild(note(U.in_geo_note));
  }
  var SPEED_LIMITS = { lcp: [2500, 4000], inp: [200, 500], cls: [0.1, 0.25] };
  function speedCell(metric, v) {
    if (v === undefined || v === null) return U.none;
    var l = SPEED_LIMITS[metric], word = v <= l[0] ? U.in_sp_good : (v <= l[1] ? U.in_sp_mid : U.in_sp_bad);
    var text = metric === "lcp" ? (v / 1000).toLocaleString(LOC, { maximumFractionDigits: 1 }) + " s" : (metric === "inp" ? n0(v) + " ms" : v.toLocaleString(LOC, { minimumFractionDigits: 2, maximumFractionDigits: 2 }));
    return { t: text + " · " + word, cls: "num " + (v <= l[0] ? "pos" : (v <= l[1] ? "" : "neg")) };
  }
  function insightSpeed(content, k) {
    if (!D.speed) return;
    var months = k.al.a.filter(function (ym) { return !!D.speed[ym]; }).slice(-6), card = el("section", "card"); card.appendChild(panelHead(U.in_h_speed)); content.appendChild(card);
    if (!months.length) { card.appendChild(el("p", "muted", U.no_parts)); return; }
    card.appendChild(note(U.in_speed_hint));
    var rows = [];
    months.forEach(function (ym) {
      ["phone", "desktop"].forEach(function (dev) {
        var r = D.speed[ym][dev]; if (!r) return;
        rows.push({ key: ym + dev, cells: [mname(ym), U.device_names[dev === "phone" ? "mobile" : "desktop"] || dev, speedCell("lcp", r.lcp), speedCell("inp", r.inp), speedCell("cls", r.cls)] });
      });
    });
    card.appendChild(pickTable(U.in_th_speed, rows, null));
    card.appendChild(note(U.in_speed_note));
  }
  function insightProducts(content, k) {
    if (!D.products) return;
    var pr = alignedWith(k, D.products), card = el("section", "card"); card.appendChild(panelHead(U.in_h_products)); content.appendChild(card);
    if (!pr.a.length) { card.appendChild(el("p", "muted", U.no_parts)); return; }
    var A = sumBy(pr.a, function (ym) { return D.products[ym]; }), B = pr.b ? sumBy(pr.b, function (ym) { return D.products[ym]; }) : null, tot = 0;
    var names = Object.keys(A).sort(function (x, y) { return A[y][1] - A[x][1]; });
    names.forEach(function (n) { tot += A[n][1]; });
    if (!tot) { card.appendChild(el("p", "muted", U.no_data)); return; }
    card.appendChild(note(U.in_products_hint));
    var top3 = 0;
    var rows = names.slice(0, 10).map(function (n, i) {
      var a = A[n], d = B && B[n] ? dlt(a[1], B[n][1]) : null;
      if (i < 3) top3 += a[1];
      return { key: n, cells: [n, n0(a[0]), eur(a[1]), pct(a[1] / tot * 100, 0), !B ? U.none : (B[n] ? { t: sgn(d), cls: "num " + cls(d) } : { t: U.kw_new, cls: "num new" })] };
    });
    card.appendChild(pickTable(U.in_th_products, rows, null));
    if (names.length > 3 && top3 / tot >= 0.5) card.appendChild(note(U.in_prod_concentrated.replace("{p}", function () { return pct(top3 / tot * 100, 0); })));
    card.appendChild(note(U.in_products_note));
  }
  var DAY_ORDER = ["1", "2", "3", "4", "5", "6", "0"];
  function insightWeekday(content, k) {
    if (!D.weekday) return;
    var wa = alignedWith(k, D.weekday), card = el("section", "card"); card.appendChild(panelHead(U.in_h_weekday)); content.appendChild(card);
    if (!wa.a.length) { card.appendChild(el("p", "muted", U.no_parts)); return; }
    var A = sumBy(wa.a, function (ym) { return D.weekday[ym]; }), ts = 0, tc = 0;
    DAY_ORDER.forEach(function (d) { if (A[d]) { ts += A[d][0]; tc += A[d][1]; } });
    if (!ts) { card.appendChild(el("p", "muted", U.no_data)); return; }
    card.appendChild(note(U.in_weekday_hint));
    var rows = DAY_ORDER.filter(function (d) { return A[d]; }).map(function (d) {
      var a = A[d];
      return { key: d, cells: [U.in_days[d], n0(a[0]), pct(a[0] / ts * 100, 0), n0(a[1]), pct(a[0] ? a[1] / a[0] * 100 : 0, 2), { t: channelVerdict(a[0], a[1], ts - a[0], tc - a[1]), cls: "txt" }] };
    });
    if (isNeon()) { var wm = {}; DAY_ORDER.forEach(function (d) { if (A[d]) wm[d] = A[d][0]; }); card.appendChild(neonRow(shareItems(k, wm, ts, n0, null, function (d) { return U.in_days[d]; }))); }
    card.appendChild(pickTable(U.in_th_weekday, rows, null));
    card.appendChild(note(U.in_weekday_note));
  }
  function insightEngagement(content, k) {
    if (!D.engagement) return;
    var ea = alignedWith(k, D.engagement), card = el("section", "card"); card.appendChild(panelHead(U.in_h_engagement)); content.appendChild(card);
    if (!ea.a.length) { card.appendChild(el("p", "muted", U.no_parts)); return; }
    var A = sumBy(ea.a, function (ym) { return D.engagement[ym]; }), names = Object.keys(A).sort(function (x, y) { return A[y][0] - A[x][0]; }), ts = 0, te = 0, tsec = 0;
    names.forEach(function (n) { ts += A[n][0]; te += A[n][1]; tsec += A[n][2]; });
    if (!ts) { card.appendChild(el("p", "muted", U.no_data)); return; }
    card.appendChild(note(U.in_engagement_hint));
    var low = null;
    var rows = names.map(function (n) {
      var a = A[n], rate = a[0] ? a[1] / a[0] : 0, others = ts - a[0] ? (te - a[1]) / (ts - a[0]) : 0, se = Math.sqrt(rate * (1 - rate) / Math.max(1, a[0]));
      if (a[0] >= 200 && others - rate >= 0.15 && (others - rate) / (se || 1) >= 3 && (!low || rate < low[1])) low = [n, rate];
      return { key: n, cells: [n, n0(a[0]), pct(rate * 100, 0), a[1] ? n0(a[2] / a[1]) + " s" : U.none] };
    });
    rows.push({ total: true, key: "", cells: [U.total, n0(ts), pct(te / ts * 100, 0), te ? n0(tsec / te) + " s" : U.none] });
    card.appendChild(pickTable(U.in_th_engagement, rows, null));
    if (low) card.appendChild(note(U.in_low_engagement.replace("{name}", function () { return low[0]; }).replace("{p}", function () { return pct(low[1] * 100, 0); })));
    card.appendChild(note(U.in_engagement_note));
  }
  function renderInsights(content) {
    var k = ctx();
    content.appendChild(notes(k));
    if (!k.A.s && !k.A.c) { content.appendChild(el("p", "muted", U.no_data)); return; }
    content.appendChild(note(U.in_intro));
    insightGoals(content, k); insightChannels(content, k); insightAudience(content, k); insightGlobe(content, k); insightGeo(content, k); insightWeekday(content, k); insightPages(content, k); insightProducts(content, k); insightEngagement(content, k); insightAds(content, k); insightSiteSearch(content, k); insightChanges(content, k); insightBrand(content, k); insightSpeed(content, k);
  }
  VIEWS.push({ id: "insights", icon: "insights", label: "n_insights", render: renderInsights, needs: function () { return !!D.insights; } });
