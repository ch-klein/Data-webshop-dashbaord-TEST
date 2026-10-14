// dashboard_js/shared.js: Gedeelde bouwstenen voor tabellen en verloopdetails: uitgelijnde maanden, gestapelde grafiek, aanklikbare tabel.
// Alle onderdelen worden bij het bouwen achter elkaar gezet in een functie-omgeving (zie dashboard.read_js()); de volgorde staat in JS_PARTS.

  // posities waar de gegevens in beide periodes bestaan (of alleen in de gekozen periode zonder vergelijking)
  function alignedWith(k, store) {
    var a = [], b = [], n = k.al.a.length;
    for (var i = 0; i < n; i++) {
      var okA = !!store[k.al.a[i]], okB = k.al.b ? !!store[k.al.b[i]] : true;
      if (okA && okB) { a.push(k.al.a[i]); if (k.al.b) b.push(k.al.b[i]); }
    }
    return { a: a, b: k.al.b ? b : null, have: k.al.a.filter(function (m) { return !!store[m]; }).length, of: k.al.a.length };
  }
  function sumBy(months, getter) {
    var out = {};
    months.forEach(function (ym) { var d = getter(ym) || {}; for (var key in d) { var v = d[key]; out[key] = out[key] || [0, 0, 0]; for (var j = 0; j < v.length; j++) out[key][j] += v[j]; } });
    return out;
  }
  function stacked(k, store, nameOf, top) {
    var first = Math.max(0, HAVE.length - 24), sel = {}, cmpSet = {};
    k.al.a.forEach(function (m) { sel[m] = 1; }); (k.al.b || []).forEach(function (m) { cmpSet[m] = 1; });
    HAVE.forEach(function (ym, i) { if ((sel[ym] || cmpSet[ym]) && i < first) first = i; });
    var list = HAVE.slice(first), totals = {};
    list.forEach(function (ym) { var d = store[ym] || {}; for (var key in d) totals[key] = (totals[key] || 0) + d[key]; });
    var names = Object.keys(totals).sort(function (x, y) { return totals[y] - totals[x]; }), keep = names.slice(0, top), box = el("div", "chart");
    var W = 640, H = 170, pad = 26, slot = (W - 10) / list.length, g = svg("svg", { viewBox: "0 0 " + W + " " + H, width: "100%", role: "img", "aria-label": U.h_share });
    list.forEach(function (ym, i) {
      var d = store[ym]; if (!d) return;
      var sum = 0; for (var key in d) sum += d[key]; if (!sum) return;
      var y = H - pad, other = sum;
      keep.forEach(function (name, j) {
        var v = d[name] || 0; other -= v; if (!v) return;
        var h = v / sum * (H - pad - 6); y -= h;
        var r = svg("rect", { x: 5 + i * slot + slot * 0.12, y: y, width: slot * 0.76, height: h, "class": "s" + j, "data-ym": ym, "data-name": name });
        var t = svg("title", {}); t.textContent = mname(ym) + " \u00b7 " + nameOf(name) + ": " + pct(v / sum * 100, 0); r.appendChild(t); g.appendChild(r);
      });
      if (other > 0.5) {
        var h2 = other / sum * (H - pad - 6); y -= h2;
        var r2 = svg("rect", { x: 5 + i * slot + slot * 0.12, y: y, width: slot * 0.76, height: h2, "class": "s" + Math.min(keep.length, 5) });
        var t2 = svg("title", {}); t2.textContent = mname(ym) + " \u00b7 " + U.other + ": " + pct(other / sum * 100, 0); r2.appendChild(t2); g.appendChild(r2);
      }
      if (sel[ym] || cmpSet[ym]) g.appendChild(svg("rect", { x: 5 + i * slot + slot * 0.12, y: H - pad + 4, width: slot * 0.76, height: 4, "class": "mk " + (sel[ym] ? "sel" : "cmp"), "data-ym": ym }));
      if (list.length <= 14 || i % 3 === 0 || ym.slice(5) === "01") {
        var tx = svg("text", { x: 5 + i * slot + slot / 2, y: H - 6, "text-anchor": "middle", "class": "axis" });
        tx.textContent = mshort(ym) + (ym.slice(5) === "01" || i === 0 ? " " + ym.slice(2, 4) : ""); g.appendChild(tx);
      }
    });
    box.appendChild(g);
    var lg = el("div", "legend");
    keep.forEach(function (name, j) { var i = el("span", "lg"); i.appendChild(el("i", "sw s" + j)); i.appendChild(document.createTextNode(" " + nameOf(name))); lg.appendChild(i); });
    if (names.length > keep.length) { var o = el("span", "lg"); o.appendChild(el("i", "sw s" + Math.min(keep.length, 5))); o.appendChild(document.createTextNode(" " + U.other)); lg.appendChild(o); }
    box.appendChild(lg);
    return box;
  }
  // tabel met rijen waarop je kunt klikken; geeft de rij-elementen terug
  function pickTable(head, rows, onPick) {
    var t = el("table"), thead = el("thead"), hr = el("tr");
    head.forEach(function (h) { var th = el("th", null, h); th.setAttribute("scope", "col"); hr.appendChild(th); });
    thead.appendChild(hr); t.appendChild(thead);
    var tbody = el("tbody");
    rows.forEach(function (r) {
      var clickable = !r.total && !!onPick;
      var tr = el("tr", r.total ? "total" : (clickable ? "pick" : "")); tr.setAttribute("data-key", r.key || "");
      r.cells.forEach(function (c, i) {
        var text = c && c.t !== undefined ? c.t : c, cl = (c && c.cls) || (i >= 1 ? "num" : "");
        if (i === 0) {                                   // eerste cel = rijkop; bij een aanklikbare rij met een echte knop (toetsenbord en schermlezer)
          var th = el("th", cl); th.setAttribute("scope", "row");
          if (clickable) { var btn = el("button", "rowbtn", text); btn.type = "button"; th.appendChild(btn); }
          else if (c && c.sr) th.appendChild(el("span", "sr", text));                  // rijkop die er niet staat maar wel voorgelezen wordt (vervolgregel van dezelfde groep)
          else th.textContent = text;
          tr.appendChild(th);
        } else tr.appendChild(el("td", cl, text));
      });
      if (clickable) tr.addEventListener("click", function () { onPick(r.key, tr); });
      tbody.appendChild(tr);
    });
    t.appendChild(tbody);
    var w = el("div", "scroll"); w.appendChild(t);
    if (!onPick) { w.tabIndex = 0; w.setAttribute("role", "region"); w.setAttribute("aria-label", head.join(", ")); }     // een tabel zonder aanklikbare rijen die breder kan zijn dan het scherm: met het toetsenbord te scrollen
    return w;
  }
  function openItem(card, key) {
    if (!key) return;
    Array.prototype.forEach.call(card.querySelectorAll("tr.pick"), function (tr) { if (tr.getAttribute("data-key") === key) tr.click(); });
  }
  function trendDetail(holder, k, title, valueFn, fmt) {
    holder.textContent = "";
    var head = el("div", "detail"); head.appendChild(el("h3", null, title));
    holder.appendChild(head); holder.appendChild(monthChart(k, "s", valueFn, fmt, title));
    var b = el("button", "close", U.close); b.type = "button"; b.addEventListener("click", function () { holder.textContent = ""; post(); });
    holder.appendChild(b); post();
  }


  // aandeel of verloop per groep (kanaal, apparaat) als lijnen of staven naast elkaar
  function groupSeriesChart(k, store, nameOf, top, kind, md) {
    var months = lastMonths(k, kind === "bars" ? 12 : 24), totals = {};
    months.forEach(function (ym) { var d = store[ym] || {}; for (var n in d) totals[n] = (totals[n] || 0) + d[n]; });
    var names = Object.keys(totals).sort(function (x, y) { return totals[y] - totals[x]; }).slice(0, kind === "bars" ? Math.min(top, 3) : top);
    var series = names.map(function (n) { return { name: nameOf(n), values: months.map(function (ym) { return store[ym] ? (store[ym][n] || 0) : null; }) }; });
    return seriesChart(months, series, md.fmt, function (v) { return compact(v, md.money); }, kind, md.label, { w: 960, h: 300 });
  }
  // keuze van meetwaarde (sessies, conversies, omzet) en soort grafiek (aandeel, lijnen, staven) boven een grafiek per groep
  // cfg: {id, nameOf, top, metrics: [{key, label, fmt, money}], store(metricKey) -> {ym: {naam: getal}}}
  function shareBlock(card, k, cfg) {
    var holder = el("div"), bar = el("div", "controls"), title = el("h3");
    var ms = el("select"); ms.id = cfg.id + "-metric";
    cfg.metrics.forEach(function (d) { var o = el("option", null, d.label); o.value = d.key; ms.appendChild(o); });
    if (cfg.metrics.length > 1) { var ml = el("label", "field"); ml.appendChild(el("span", null, U.metric)); ml.appendChild(ms); bar.appendChild(ml); }
    var ts = el("select"); ts.id = cfg.id + "-type";
    var typeOpts = [["stacked", U.ch_stacked], ["lines", U.ch_lines], ["bars", U.ch_bars]];
    var neon = !!D.styles && S.style === "donker";
    if (neon) typeOpts.unshift(["meters", U.ch_meters]);
    typeOpts.forEach(function (o) { var op = el("option", null, o[1]); op.value = o[0]; ts.appendChild(op); });
    ts.value = neon ? "meters" : (D.styles && S.style === "lijnen" ? "lines" : "stacked");
    var tl = el("label", "field"); tl.appendChild(el("span", null, U.ch_type)); tl.appendChild(ts); bar.appendChild(tl);
    function draw() {
      var md = cfg.metrics.filter(function (x) { return x.key === ms.value; })[0] || cfg.metrics[0], low = md.label.toLowerCase();
      title.textContent = ts.value === "meters" ? U.h_meters_m.replace("{m}", low) : ts.value === "stacked" ? (md.key === "s" ? U.h_share : U.h_share_m.replace("{m}", low)) : U.h_trend_m.replace("{m}", low);
      holder.textContent = "";
      var store = cfg.store(md.key);
      holder.appendChild(ts.value === "meters" ? groupGauges(k, store, cfg.nameOf, Math.min(cfg.top, 6), md) : ts.value === "stacked" ? stacked(k, store, cfg.nameOf, cfg.top) : groupSeriesChart(k, store, cfg.nameOf, cfg.top, ts.value, md));
      post();
    }
    ms.addEventListener("change", draw); ts.addEventListener("change", draw);
    card.appendChild(bar); card.appendChild(title); card.appendChild(holder); draw();
  }
  function groupMetrics(hasConv) {
    var out = [{ key: "s", label: U.kpi.sessions, fmt: n0 }];
    if (hasConv) out.push({ key: "c", label: U.kpi.conversions, fmt: n0 });
    if (hasConv && HASREV) out.push({ key: "r", label: U.kpi.revenue, fmt: eur, money: true });
    return out;
  }
