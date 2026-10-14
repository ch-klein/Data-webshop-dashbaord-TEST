// dashboard_js/view_styles.js: Kiesbare weergave "Kaarten": cijfertegels met vorig jaar en vier grafieken met realisatie, vorig jaar en doel.
// Alle onderdelen worden bij het bouwen achter elkaar gezet in een functie-omgeving (zie dashboard.read_js()); de volgorde staat in JS_PARTS.

  // ---------- weergave: Kaarten (Overzicht) ----------
  function sgn1(x) { return (x >= 0 ? "+" : "−") + pct(Math.abs(x), 1); }
  // de laatste 12 maanden tot en met de laatste maand van de gekozen periode (alleen maanden die in het archief staan)
  function lastMonths(k, n) {
    var end = k.p.months[k.p.months.length - 1], i = HAVE.indexOf(end);
    if (i < 0) i = HAVE.length - 1;
    return HAVE.slice(Math.max(0, i - n + 1), i + 1);
  }
  function cardTile(def, k) {
    var a = def.get(k.A), b = k.B ? def.get(k.B) : null, tile = el("div", "pbi-tile");
    tile.appendChild(el("div", "l", def.label));
    var d = b ? dlt(a, b) : null, v = el("div", "v " + (d === null ? "" : (d >= 0 ? "pos" : "neg")), def.fmt(a));
    tile.appendChild(v);
    if (k.c && b !== null && b !== undefined) {
      var line = el("div", "d"); line.appendChild(document.createTextNode(k.c.label + ": " + def.fmt(b)));
      if (d !== null) { var s = el("span", cls(d), " (" + (d >= 0 ? "▲ " : "▼ ") + sgn1(d) + ")"); line.appendChild(s); }
      tile.appendChild(line);
    }
    return tile;
  }
  function cardChart(def, k) {
    var card = el("section", "card"), kind = "bars", holder = el("div");
    var lab = el("label", "field"); lab.appendChild(el("span", null, U.pbi_type));
    var sel = el("select"); [["bars", U.pbi_bars], ["lines", U.pbi_lines]].forEach(function (o) { var op = el("option", null, o[1]); op.value = o[0]; sel.appendChild(op); });
    lab.appendChild(sel);
    card.appendChild(panelHead(def.label, lab));
    function draw() {
      holder.textContent = "";
      var months = lastMonths(k, 12), val = function (ym) { return monthValue(ym, def.key); };
      var series = [{ name: U.pbi_real, values: months.map(val) }, { name: U.pbi_prev, values: months.map(function (ym) { return val(shift(ym, -12)); }) }];
      if (D.goals && D.goals[def.goal]) series.push({ name: U.pbi_goal, dash: true, values: months.map(function () { return D.goals[def.goal]; }) });
      holder.appendChild(seriesChart(months, series, def.fmt, function (v) { return compact(v, def.money); }, kind, def.label));
      post();
    }
    sel.addEventListener("change", function () { kind = sel.value; draw(); });
    card.appendChild(holder); draw();
    return card;
  }
  function overviewDefs() {
    var defs = [{ key: "s", label: U.kpi.sessions, get: function (t) { return t.s; }, fmt: n0, goal: "sessions" },
                { key: "c", label: U.kpi.conversions, get: function (t) { return t.c; }, fmt: n0, goal: "conversions" }];
    if (HASREV) defs.push({ key: "r", label: U.kpi.revenue, get: function (t) { return t.r; }, fmt: eur, money: true, goal: "revenue" });
    defs.push({ key: "cr", label: U.kpi.conv_rate, get: function (t) { return t.s ? t.c / t.s * 100 : 0; }, fmt: function (x) { return pct(x, 2); } });
    return defs;
  }
  function renderCardsOverview(content, k) {
    content.appendChild(notes(k));
    if (!k.A.s && !k.A.c) { content.appendChild(el("p", "muted", U.no_data)); return; }
    var defs = overviewDefs();
    var tiles = el("div", "pbi-tiles");
    defs.forEach(function (d) { tiles.appendChild(cardTile(d, k)); });
    content.appendChild(tiles);
    content.appendChild(note(U.pbi_note.replace("{m}", mname(lastMonths(k, 12)[lastMonths(k, 12).length - 1]))));
    var grid = el("div", "pbi-grid");
    defs.forEach(function (d) { grid.appendChild(cardChart(d, k)); });
    content.appendChild(grid);
  }

  // ---------- weergave: Lijnen (licht en rustig): tegels, een grote vloeiende lijn en twee staafgrafieken ----------
  function monthsFor(k, n, valueFn) {
    var months = lastMonths(k, n);
    return { months: months, values: months.map(valueFn) };
  }
  function renderLinesOverview(content, k) {
    content.appendChild(notes(k));
    if (!k.A.s && !k.A.c) { content.appendChild(el("p", "muted", U.no_data)); return; }
    var defs = overviewDefs(), tiles = el("div", "pbi-tiles lt");
    defs.forEach(function (d) { tiles.appendChild(cardTile(d, k)); });
    content.appendChild(tiles);
    var card = el("section", "card"), holder = el("div"), cur = defs.filter(function (d) { return d.key === S.metric; })[0] || defs[0];
    var lab = el("label", "field"); lab.appendChild(el("span", null, U.metric));
    var sel = el("select"); defs.forEach(function (d) { var op = el("option", null, d.label); op.value = d.key; sel.appendChild(op); }); sel.value = cur.key; lab.appendChild(sel);
    card.appendChild(panelHead(U.h_trend, lab));
    function draw() {
      var d = defs.filter(function (x) { return x.key === sel.value; })[0], m = monthsFor(k, 24, function (ym) { return monthValue(ym, d.key); });
      holder.textContent = ""; holder.appendChild(seriesChart(m.months, [{ name: d.label, values: m.values }], d.fmt, function (v) { return compact(v, d.money); }, "smooth", d.label, { w: 1000, h: 300 })); post();
    }
    sel.addEventListener("change", function () { S.metric = sel.value; draw(); });
    card.appendChild(holder); content.appendChild(card); draw();
    var two = el("div", "pbi-grid");
    defs.slice(0, 2).forEach(function (d) {
      var c2 = el("section", "card"); c2.appendChild(panelHead(d.label));
      var m = monthsFor(k, 12, function (ym) { return monthValue(ym, d.key); });
      c2.appendChild(seriesChart(m.months, [{ name: d.label, values: m.values }], d.fmt, function (v) { return compact(v, d.money); }, "bars", d.label)); two.appendChild(c2);
    });
    content.appendChild(two);
  }

  // ---------- weergave: Donker: meters, ring en vloeiende vlakken ----------
  function renderNeonOverview(content, k) {
    content.appendChild(notes(k));
    if (!k.A.s && !k.A.c) { content.appendChild(el("p", "muted", U.no_data)); return; }
    var defs = overviewDefs(), gcard = el("section", "card"), row = el("div", "neon-gauges");
    gcard.appendChild(panelHead(U.nx_h_gauges));
    defs.forEach(function (d) {
      var a = d.get(k.A), goal = D.goals && d.goal ? D.goals[d.goal] : null, b = k.B ? d.get(k.B) : null, fill = 0, sub = "";
      if (goal) { var r = a / (goal * k.al.a.length) * 100; fill = r; sub = pct(r, 0) + " " + U.nx_of_goal; }
      else if (b) { var dd = dlt(a, b); fill = dd === null ? 0 : 50 + Math.max(-50, Math.min(50, dd / 2)); sub = dd === null ? "" : sgn1(dd) + " " + U.vs + " " + k.c.label; }
      var box = el("div", "gbox"); box.appendChild(el("div", "gl", d.label)); box.appendChild(gauge(fill, d.fmt(a), sub, d.label)); row.appendChild(box);
    });
    gcard.appendChild(row); gcard.appendChild(note(U.nx_note)); content.appendChild(gcard);
    var grid = el("div", "pbi-grid");
    if (D.channels) {
      var ch = alignedWith(k, D.channels), c1 = el("section", "card"); c1.appendChild(panelHead(U.h_channels));
      var sums = sumBy(ch.a, function (ym) { var o = {}, d = D.channels[ym]; for (var n in d) o[n] = [d[n]]; return o; });
      var names = Object.keys(sums).sort(function (x, y) { return sums[y][0] - sums[x][0]; }), parts = names.slice(0, 4).map(function (n) { return { name: n, value: sums[n][0] }; });
      var rest = 0; names.slice(4).forEach(function (n) { rest += sums[n][0]; }); if (rest) parts.push({ name: U.other, value: rest });
      if (parts.length) c1.appendChild(donut(parts, U.h_channels)); else c1.appendChild(el("p", "muted", U.no_parts));
      grid.appendChild(c1);
    }
    var c2 = el("section", "card"), cur = defs.filter(function (d) { return d.key === S.metric; })[0] || defs[0];
    c2.appendChild(panelHead(cur.label));
    var m = monthsFor(k, 12, function (ym) { return monthValue(ym, cur.key); });
    c2.appendChild(seriesChart(m.months, [{ name: cur.label, values: m.values }], cur.fmt, function (v) { return compact(v, cur.money); }, "smooth", cur.label)); grid.appendChild(c2);
    content.appendChild(grid);
    var rows = [], title = U.nx_h_top;
    if (D.pages) {
      var pa = alignedWith(k, D.pages), P = pagesSum(pa.a);
      Object.keys(P).sort(function (x, y) { return P[y][0] - P[x][0]; }).slice(0, 6).forEach(function (p) { rows.push({ label: p, value: P[p][0], text: n0(P[p][0]) }); });
      title = U.h_pages;
    } else if (D.channel_stats && D.channels) {
      var cs = alignedWith(k, D.channel_stats), S2 = sumBy(cs.a, function (ym) { var o = {}, d = D.channels[ym] || {}; for (var n in d) o[n] = [d[n], ((D.channel_stats[ym] || {})[n] || [0])[0]]; return o; });
      Object.keys(S2).sort(function (x, y) { return S2[y][0] - S2[x][0]; }).slice(0, 6).forEach(function (n) { var r = S2[n][0] ? S2[n][1] / S2[n][0] * 100 : 0; rows.push({ label: n, value: r, text: pct(r, 2) }); });
      title = U.nx_h_conv_channel;
    }
    if (rows.length) { var c3 = el("section", "card"); c3.appendChild(panelHead(title)); c3.appendChild(hbars(rows)); content.appendChild(c3); }
  }

  // weergave Donker: een meter per groep (kanaal, apparaat, land...) met het aandeel in de gekozen periode en het verschil met de vergelijking
  function groupGauges(k, store, nameOf, top, md) {
    function sums(months) { var o = {}; (months || []).forEach(function (ym) { var d = store[ym] || {}; for (var n in d) o[n] = (o[n] || 0) + d[n]; }); return o; }
    var A = sums(k.al.a), B = k.al.b ? sums(k.al.b) : null, total = 0, box = el("div");
    for (var n0k in A) total += A[n0k];
    var names = Object.keys(A).sort(function (x, y) { return A[y] - A[x]; }).slice(0, top);
    if (!names.length || !total) { box.appendChild(el("p", "muted", U.no_parts)); return box; }
    var row = el("div", "neon-gauges" + (names.length > 4 ? " cols3" : ""));
    names.forEach(function (n) {
      var share = A[n] / total * 100, sub = md.fmt(A[n]);
      if (B && B[n]) sub += " · " + sgn(dlt(A[n], B[n])) + " " + U.vs + " " + k.c.label;
      var g = el("div", "gbox"); g.appendChild(el("div", "gl", nameOf(n))); g.appendChild(gauge(share, pct(share, 0), sub, nameOf(n))); row.appendChild(g);
    });
    box.appendChild(row); box.appendChild(note(U.ch_meters_note));
    return box;
  }

  // ---------- Donker: overal meters ----------
  function isNeon() { return !!D.styles && S.style === "donker"; }
  // rij meters: items [{label, fill (0 tot 100), center, sub}]
  function neonRow(items) {
    var row = el("div", "neon-gauges" + (items.length > 1 && items.length < 7 && items.length !== 4 ? " cols3" : ""));
    items.forEach(function (it) { var g = el("div", "gbox"); g.appendChild(el("div", "gl", it.label)); g.appendChild(gauge(it.fill, it.center, it.sub, it.label)); row.appendChild(g); });
    return row;
  }
  // meter voor een waarde tegenover de vergelijking (het midden is gelijk) of, als daar een doel voor is, tegenover het doel van de periode
  function compareItem(k, label, a, b, fmt, goalKey) {
    var goal = D.goals && goalKey ? D.goals[goalKey] : null, fill = 0, sub = "";
    if (goal) { var r = a / (goal * k.al.a.length) * 100; fill = r; sub = pct(r, 0) + " " + U.nx_of_goal; }
    else if (b !== null && b !== undefined && k.c) { var dd = dlt(a, b); fill = dd === null ? 0 : 50 + Math.max(-50, Math.min(50, dd / 2)); sub = dd === null ? "" : sgn1(dd) + " " + U.vs + " " + k.c.label; }
    return { label: label, fill: fill, center: fmt(a), sub: sub };
  }
  // aandeel van elke groep in het totaal (de grootste 6); map: naam -> getal, prev: dezelfde met de vergelijking of null
  function shareItems(k, map, total, fmt, prev, nameOf) {
    var names = Object.keys(map).sort(function (x, y) { return map[y] - map[x]; }).slice(0, 6);
    return names.map(function (n) {
      var share = total ? map[n] / total * 100 : 0, sub = fmt(map[n]);
      if (prev && prev[n] && k.c) sub += " \u00b7 " + sgn(dlt(map[n], prev[n])) + " " + U.vs + " " + k.c.label;
      return { label: nameOf ? nameOf(n) : n, fill: share, center: pct(share, 0), sub: sub };
    });
  }
