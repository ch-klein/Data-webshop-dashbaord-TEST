// dashboard_js/charts.js: Eigen grafieken zonder externe bibliotheek: groepen staven en lijnen met meerdere reeksen en een duidelijke as.
// Alle onderdelen worden bij het bouwen achter elkaar gezet in een functie-omgeving (zie dashboard.read_js()); de volgorde staat in JS_PARTS.

  // ---------- grafieken met meerdere reeksen ----------
  var GAUGES = 0;
  // korte getallen voor de as: 1.200 wordt 1,2K, 2.500.000 wordt 2,5 mln
  function compact(v, money) {
    var a = Math.abs(v), t;
    if (a >= 1e6) t = (v / 1e6).toLocaleString(LOC, { maximumFractionDigits: 1 }) + (D.lang === "nl" ? " mln" : "M");
    else if (a >= 1e4) t = n0(v / 1e3) + "K";
    else if (a >= 1e3) t = (v / 1e3).toLocaleString(LOC, { maximumFractionDigits: 1 }) + "K";
    else t = v.toLocaleString(LOC, { maximumFractionDigits: a < 10 ? 1 : 0 });
    return (money ? (D.lang === "nl" ? "€ " : "€") : "") + t;
  }
  function niceMax(v) {
    if (!(v > 0)) return 1;
    var p = Math.pow(10, Math.floor(Math.log(v) / Math.LN10)), f = v / p;
    return (f <= 1 ? 1 : f <= 2 ? 2 : f <= 2.5 ? 2.5 : f <= 5 ? 5 : 10) * p;
  }
  // vloeiende lijn door de punten (Catmull-Rom naar Bezier); een punt blijft nooit buiten de grafiek
  function smoothPath(pts) {
    if (pts.length < 3) return pts.map(function (p, i) { return (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" ");
    var d = "M" + pts[0][0].toFixed(1) + " " + pts[0][1].toFixed(1);
    for (var i = 0; i < pts.length - 1; i++) {
      var p0 = pts[i - 1] || pts[i], p1 = pts[i], p2 = pts[i + 1], p3 = pts[i + 2] || p2;
      d += " C" + (p1[0] + (p2[0] - p0[0]) / 6).toFixed(1) + " " + (p1[1] + (p2[1] - p0[1]) / 6).toFixed(1) + " " + (p2[0] - (p3[0] - p1[0]) / 6).toFixed(1) + " " + (p2[1] - (p3[1] - p1[1]) / 6).toFixed(1) + " " + p2[0].toFixed(1) + " " + p2[1].toFixed(1);
    }
    return d;
  }
  // meter (halve cirkel): waarde 0 tot 100 (daarboven blijft de meter vol); tekst in het midden
  function gauge(pctValue, center, sub, label) {
    var v = Math.max(0, Math.min(100, pctValue)), g = svg("svg", { viewBox: "0 0 200 120", width: "100%", role: "img", "aria-label": label + ": " + center + (sub ? ", " + sub : "") });
    var arc = "M20 100 A80 80 0 0 1 180 100", gid = "gg" + (GAUGES = (typeof GAUGES === "number" ? GAUGES : 0) + 1);
    var defs = svg("defs", {}), lgr = svg("linearGradient", { id: gid, x1: "0", y1: "0", x2: "1", y2: "0" });
    lgr.appendChild(svg("stop", { offset: "0", "class": "gs0" })); lgr.appendChild(svg("stop", { offset: "1", "class": "gs1" })); defs.appendChild(lgr); g.appendChild(defs);
    g.appendChild(svg("path", { d: arc, "class": "g-track", pathLength: 100 }));
    var val = svg("path", { d: arc, "class": "g-val", pathLength: 100, "stroke-dasharray": v + " 100" });
    val.style.setProperty("--grad", "url(#" + gid + ")");                // via de browser zelf: een style-kenmerk in de tekst zou door de beveiligingsregel worden geblokkeerd
    g.appendChild(val);
    var t = svg("text", { x: 100, y: 92, "text-anchor": "middle", "class": "g-num" }); t.textContent = center; g.appendChild(t);
    if (sub) { var s = svg("text", { x: 100, y: 112, "text-anchor": "middle", "class": "g-sub" }); s.textContent = sub; g.appendChild(s); }
    return g;
  }
  // ring: delen [{name, value}] met legenda; de eerste vier krijgen de reekskleuren, de rest "overig"
  function donut(parts, label) {
    var total = parts.reduce(function (t, p) { return t + p.value; }, 0), box = el("div", "donut"), g = svg("svg", { viewBox: "0 0 120 120", width: "100%", role: "img", "aria-label": label });
    var start = 0;
    parts.forEach(function (p, i) {
      var len = total ? p.value / total * 100 : 0;
      var c = svg("circle", { cx: 60, cy: 60, r: 42, "class": "dn d" + Math.min(i, 4), pathLength: 100, "stroke-dasharray": len.toFixed(2) + " " + (100 - len).toFixed(2), "stroke-dashoffset": (-start).toFixed(2), transform: "rotate(-90 60 60)" });
      var tt = svg("title", {}); tt.textContent = p.name + ": " + pct(len, 0); c.appendChild(tt); g.appendChild(c); start += len;
    });
    box.appendChild(g);
    var lg = el("div", "legend");
    parts.forEach(function (p, i) { var s = el("span", "lg"); s.appendChild(el("i", "sw d" + Math.min(i, 4))); s.appendChild(document.createTextNode(" " + p.name + " " + pct(total ? p.value / total * 100 : 0, 0))); lg.appendChild(s); });
    box.appendChild(lg);
    return box;
  }
  // horizontale balken: rijen [{label, value, text}]; de langste is 100%
  function hbars(rows) {
    var box = el("div", "hbars"), mx = Math.max.apply(null, rows.map(function (r) { return r.value; }).concat([1]));
    rows.forEach(function (r) {
      var row = el("div", "hb"); row.appendChild(el("span", "hb-l", r.label));
      var bar = el("span", "hb-t"), fill = el("span", "hb-f"); fill.style.width = Math.max(2, r.value / mx * 100) + "%"; bar.appendChild(fill); row.appendChild(bar);
      row.appendChild(el("span", "hb-v", r.text)); box.appendChild(row);
    });
    return box;
  }
  // labels: maanden (JJJJ-MM); series: [{name, values: [getal of null]}] (de eerste reeks is de "echte" waarde); kind: "bars" of "lines"
  // fmt(v) geeft de tekst voor een waarde (tooltip), axis(v) de korte tekst voor de as
  function seriesChart(labels, series, fmt, axis, kind, title, size) {
    var W = size ? size.w : 640, H = size ? size.h : 230, L = 58, R = 10, T = 12, B = 26, iw = W - L - R, ih = H - T - B, n = labels.length;
    var all = [0, 1];
    series.forEach(function (s) { s.values.forEach(function (v) { if (v !== null && v !== undefined && isFinite(v)) all.push(v); }); });
    var mx = niceMax(Math.max.apply(null, all)), slot = iw / Math.max(n, 1);
    var g = svg("svg", { viewBox: "0 0 " + W + " " + H, width: "100%", role: "img",
                         "aria-label": title + ": " + mname(labels[0]) + " – " + mname(labels[n - 1]) + ", max " + fmt(Math.max.apply(null, all)) });
    function y(v) { return T + ih - Math.min(v, mx) / mx * ih; }
    [0, 0.5, 1].forEach(function (f) {
      var yy = y(mx * f);
      g.appendChild(svg("line", { x1: L, x2: W - R, y1: yy, y2: yy, "class": "grid" }));
      var t = svg("text", { x: L - 6, y: yy + 4, "text-anchor": "end", "class": "axis ax2" }); t.textContent = axis(mx * f); g.appendChild(t);
    });
    labels.forEach(function (ym, i) {
      if (n > 12 && i % 3 !== 0) return;
      var t = svg("text", { x: L + slot * (i + 0.5), y: H - 8, "text-anchor": "middle", "class": "axis ax2" });
      t.textContent = mshort(ym) + (ym.slice(5) === "01" || i === 0 ? " " + ym.slice(2, 4) : ""); g.appendChild(t);
    });
    if (kind === "lines" || kind === "smooth") {
      series.forEach(function (s, si) {
        var pts = [], dots = [];
        s.values.forEach(function (v, i) {
          if (v === null || v === undefined) { if (pts.length) { dots.push(pts); pts = []; } return; }
          pts.push([L + slot * (i + 0.5), y(v), v, i]);
        });
        if (pts.length) dots.push(pts);
        dots.forEach(function (run) {
          var d = kind === "smooth" ? smoothPath(run) : run.map(function (p, i) { return (i ? "L" : "M") + p[0].toFixed(1) + " " + p[1].toFixed(1); }).join(" ");
          if (kind === "smooth" && si === 0 && run.length > 1) g.appendChild(svg("path", { d: d + " L" + run[run.length - 1][0].toFixed(1) + " " + y(0) + " L" + run[0][0].toFixed(1) + " " + y(0) + " Z", "class": "area" }));
          g.appendChild(svg("path", { d: d, "class": "ln l" + si + (s.dash ? " dash" : "") }));
          run.forEach(function (p) {
            var c = svg("circle", { cx: p[0], cy: p[1], r: 3, "class": "dot l" + si });
            var tt = svg("title", {}); tt.textContent = s.name + " · " + mname(labels[p[3]]) + ": " + fmt(p[2]); c.appendChild(tt); g.appendChild(c);
          });
        });
      });
    } else {
      var ns = series.length, gw = slot * 0.8, bw = gw / ns;
      series.forEach(function (s, si) {
        s.values.forEach(function (v, i) {
          if (v === null || v === undefined || !(v > 0)) return;
          var h = ih - (y(v) - T), r = svg("rect", { x: L + slot * i + slot * 0.1 + bw * si, y: y(v), width: Math.max(bw - 1, 1), height: Math.max(h, 1), "class": "bar g" + si });
          var tt = svg("title", {}); tt.textContent = s.name + " · " + mname(labels[i]) + ": " + fmt(v); r.appendChild(tt); g.appendChild(r);
        });
      });
    }
    var box = el("div", "chart"); box.appendChild(g);
    var lg = el("div", "legend");
    series.forEach(function (s, si) { var i = el("span", "lg"); i.appendChild(el("i", "sw g" + si)); i.appendChild(document.createTextNode(" " + s.name)); lg.appendChild(i); });
    box.appendChild(lg);
    return box;
  }

  // grafiek per maand in de gekozen weergave: Kaarten = staven, Lijnen en Donker = vloeiende lijn met vlak
  function styledMonthChart(k, metric, valueFn, fmt, label) {
    valueFn = valueFn || function (ym) { return monthValue(ym, metric); };
    fmt = fmt || function (v) { return fmtMetric(metric, v); };
    var months = lastMonths(k, 24), money = metric === "r" || metric === "aov" || metric === "rps", name = label || U.h_trend;
    return seriesChart(months, [{ name: name, values: months.map(valueFn) }], fmt, function (v) { return compact(v, money); }, S.style === "kaarten" ? "bars" : "smooth", name, { w: 900, h: 280 });
  }
