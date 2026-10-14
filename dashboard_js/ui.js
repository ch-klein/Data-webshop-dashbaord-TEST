// dashboard_js/ui.js: Gedeelde bouwstenen: pictogrammen, paneelkop met uitklapknop, tegels en de maandgrafiek.
// Alle onderdelen worden bij het bouwen achter elkaar gezet in een functie-omgeving (zie dashboard.read_js()); de volgorde staat in JS_PARTS.

  // ---------- pictogrammen (eigen, zonder externe bestanden) ----------
  var ICONS = {
    overview: "M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z", analytics: "M4 20V10M10 20V4M16 20v-7M22 20H2",
    conversion: "M3 4h2l2.4 11h10.2L20 7H6.2M9 20.5a.5.5 0 1 0 0-.01M17 20.5a.5.5 0 1 0 0-.01", keywords: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14zM21 21l-5-5",
    pages: "M6 2h8l5 5v15H6zM14 2v6h5", forecast: "M3 17l6-6 4 4 8-9M15 6h6v6",
    users: "M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8M22 21v-2a4 4 0 0 0-3-3.9M16 3.1a4 4 0 0 1 0 7.8",
    cart: "M3 4h2l2.4 11h10.2L20 7H6.2M9 20.5a.5.5 0 1 0 0-.01M17 20.5a.5.5 0 1 0 0-.01", percent: "M19 5L5 19M7 9a2 2 0 1 0 0-4 2 2 0 0 0 0 4zM17 19a2 2 0 1 0 0-4 2 2 0 0 0 0 4z",
    euro: "M18 7a6 6 0 1 0 0 10M4 10h10M4 14h10", receipt: "M5 3h14v18l-3-2-2 2-2-2-2 2-2-2-3 2zM9 8h6M9 12h6", menu: "M3 6h18M3 12h18M3 18h18",
    expand: "M4 14v6h6M20 10V4h-6M4 20l7-7M20 4l-7 7", close: "M6 6l12 12M18 6L6 18", chevron: "M6 9l6 6 6-6", home: "M3 11l9-8 9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1z",
    pacing: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 6v6l4 2",
    actions: "M9 11l3 3L22 4M21 12v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11",
    signals: "M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0",
    insights: "M9 18h6M10 22h4M12 2a7 7 0 0 0-4 12.7c.6.5 1 1.2 1 2V17h6v-.3c0-.8.4-1.5 1-2A7 7 0 0 0 12 2z",
    sliders: "M4 6h10M18 6h2M4 12h4M12 12h8M4 18h12M20 18h0"
  };
  function icon(name, size) {
    var s = svg("svg", { viewBox: "0 0 24 24", width: size || 20, height: size || 20, fill: "none", stroke: "currentColor", "stroke-width": 1.8, "stroke-linecap": "round", "stroke-linejoin": "round", "aria-hidden": "true", focusable: "false" });
    s.appendChild(svg("path", { d: ICONS[name] || ICONS.overview })); return s;
  }
  var KPI_ICON = null;
  function addIcon(card, label) {
    if (!KPI_ICON) {
      KPI_ICON = {}; KPI_ICON[U.kpi.sessions] = "users"; KPI_ICON[U.kpi.users] = "users"; KPI_ICON[U.kpi.conversions] = "cart"; KPI_ICON[U.kpi.conv_rate] = "percent";
      KPI_ICON[U.kpi.revenue] = "euro"; KPI_ICON[U.kpi.aov] = "receipt"; KPI_ICON[U.kpi.rps] = "receipt";
    }
    var span = el("span", "ic"); span.appendChild(icon(KPI_ICON[label] || "analytics", 26)); card.appendChild(span);
  }
  // uitgeklapt paneel = dialoog: focus erin, Tab blijft erin, Esc sluit, focus gaat terug naar de knop
  function setExpanded(card, b, on, title) {
    card.classList.toggle("expanded", on); document.body.classList.toggle("noscroll", on);
    b.setAttribute("aria-expanded", on ? "true" : "false"); b.setAttribute("aria-label", on ? U.collapse : U.expand); b.title = on ? U.collapse : U.expand;
    if (on) { card.setAttribute("role", "dialog"); card.setAttribute("aria-modal", "true"); card.setAttribute("aria-label", title); }
    else { card.removeAttribute("role"); card.removeAttribute("aria-modal"); card.removeAttribute("aria-label"); }
    b.focus(); post();
  }
  function focusables(root) {
    return Array.prototype.filter.call(root.querySelectorAll("button, select, input, a[href], [tabindex]"), function (x) { return !x.disabled && x.tabIndex >= 0 && x.offsetParent !== null; });
  }
  // kop van een paneel: titel links, rechts eventueel besturing en altijd de uitklapknop
  function panelHead(title, controls) {
    var d = el("div", "ph"); d.appendChild(el("h2", null, title));
    var tools = el("div", "tools");
    if (controls) tools.appendChild(controls);
    var b = el("button", "xbtn"); b.type = "button"; b.setAttribute("aria-label", U.expand); b.setAttribute("aria-expanded", "false"); b.title = U.expand; b.appendChild(icon("expand", 16));
    b.addEventListener("click", function () { var card = d.parentNode; setExpanded(card, b, !card.classList.contains("expanded"), title); });
    d.addEventListener("keydown", function () { /* de val staat op het hele paneel, zie hieronder */ });
    tools.appendChild(b); d.appendChild(tools);
    setTimeout(function () {
      var card = d.parentNode;
      if (card && !card._trap) {
        card._trap = true;
        card.addEventListener("keydown", function (e) {
          if (e.key !== "Tab" || !card.classList.contains("expanded")) return;
          var f = focusables(card); if (!f.length) return;
          var first = f[0], last = f[f.length - 1];
          if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
          else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
        });
      }
    }, 0);
    return d;
  }
  document.addEventListener("keydown", function (e) {
    if (e.key !== "Escape") return;
    var open = document.querySelector(".card.expanded");
    if (open) { var x = open.querySelector(".xbtn"); setExpanded(open, x, false, ""); return; }
    if (typeof closeMenu === "function") closeMenu();
  });
  function ctx() {
    var p = currentPeriod(), c = comparePeriod(p), al = align(p, c);
    var A = agg(al.a), B = al.b ? agg(al.b) : null;
    return { p: p, c: c, al: al, A: A, B: B, single: al.a.length === 1 && (!al.b || al.b.length === 1) };
  }
  function notes(k) {
    var box = el("div", "notes");
    if (k.al.haveA < k.al.total) box.appendChild(note(U.partial.replace("{n}", k.al.haveA).replace("{t}", k.al.total)));
    var noCmp = S.cmp !== "none" && (!k.c || !k.al.a.length);                    // vergelijking gekozen, maar geen enkele maand is in beide periodes aanwezig
    if (k.c && k.al.a.length && k.al.a.length < k.al.haveA) box.appendChild(note(U.cmp_partial.replace("{n}", k.al.a.length)));
    if (noCmp) box.appendChild(note(U.cmp_none_found));
    var seen = {};
    (k.al.a || []).concat(k.al.b || []).forEach(function (m) {                // maanden waarvan de controles iets afkeurden
      if (D.quality && D.quality[m] && !seen[m]) { seen[m] = 1; box.appendChild(el("div", "warn", U.quality_warn.replace("{m}", mname(m)).replace("{t}", D.quality[m].join("; ")))); }
    });
    return box;
  }
  var HASREV = false;
  function monthValue(ym, metric) {
    var m = byYm[ym]; if (!m) return null;
    if (metric === "cr") return m.s ? m.c / m.s * 100 : 0;
    return m[metric];
  }
  function fmtMetric(metric, v) { return metric === "r" ? eur(v) : metric === "cr" ? pct(v, 2) : n0(v); }

  function kpiCards(k) {
    var wrap = el("div", "kpis"), A = k.A, B = k.B;
    var list = [["s", U.kpi.sessions, A.s, B && B.s, n0]];
    if (k.single) list.push(["u", U.kpi.users, A.u, B && B.u, n0]);
    list.push(["c", U.kpi.conversions, A.c, B && B.c, n0]);
    list.push(["cr", U.kpi.conv_rate, A.s ? A.c / A.s * 100 : 0, B && (B.s ? B.c / B.s * 100 : 0), function (x) { return pct(x, 2); }]);
    if (HASREV) {
      list.push(["r", U.kpi.revenue, A.r, B && B.r, eur]);
      if (A.c > 0) list.push(["aov", U.kpi.aov, A.r / A.c, B && B.c > 0 ? B.r / B.c : null, eur]);
      if (A.s > 0) list.push(["rps", U.kpi.rps, A.r / A.s, B && B.s > 0 ? B.r / B.s : null, function (x) { return eur2(x); }]);
    }
    list.forEach(function (row) {
      var card = el("div", "kpi");
      card.appendChild(el("div", "l", row[1]));
      card.appendChild(el("div", "v", row[4](row[2])));
      if (k.c && row[3] !== null && row[3] !== undefined) {
        var d = dlt(row[2], row[3]), line = el("div", "d " + cls(d));
        line.appendChild(el("b", null, sgn(d)));
        line.appendChild(document.createTextNode(" " + U.vs + " " + k.c.label));
        card.appendChild(line);
      }
      addIcon(card, row[1]); wrap.appendChild(card);
    });
    return wrap;
  }
  function eur2(x) { return (D.lang === "nl" ? "€ " : "€") + x.toLocaleString(LOC, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }

  // staafgrafiek per maand; gekozen periode en vergelijking gemarkeerd. valueFn(ym) geeft een getal of null (geen gegevens)
  function monthChart(k, metric, valueFn, fmt, label) {
    if (D.styles && S.style !== "standaard") return styledMonthChart(k, metric, valueFn, fmt, label);
    valueFn = valueFn || function (ym) { return monthValue(ym, metric); };
    fmt = fmt || function (v) { return fmtMetric(metric, v); };
    var box = el("div", "chart");
    var sel = {}, cmpSet = {};
    k.al.a.forEach(function (m) { sel[m] = 1; });
    (k.al.b || []).forEach(function (m) { cmpSet[m] = 1; });
    var first = Math.max(0, HAVE.length - 24);
    HAVE.forEach(function (ym, i) { if ((sel[ym] || cmpSet[ym]) && i < first) first = i; });
    var list = HAVE.slice(first);
    var W = 640, H = 190, pad = 22, vals = list.map(function (ym) { var v = valueFn(ym); return v === null || v === undefined ? 0 : v; });
    var top = Math.max.apply(null, vals.concat([1])), low = Math.min.apply(null, vals.concat([0])), slot = (W - 10) / list.length;
    var ph = H - pad - 16, base = H - pad - (0 - low) / (top - low) * ph;                       // negatieve waarden (winst): nul staat tussen het minimum en het maximum
    var g = svg("svg", { viewBox: "0 0 " + W + " " + H, width: "100%", role: "img",
                         "aria-label": (label || U.h_trend) + ": " + mname(list[0]) + " \u2013 " + mname(list[list.length - 1]) + ", max " + fmt(top) + (low < 0 ? ", min " + fmt(low) : "") });
    list.forEach(function (ym, i) {
      var v = vals[i], h = Math.abs(v) / (top - low) * ph, c = sel[ym] ? "bar sel" : cmpSet[ym] ? "bar cmp" : "bar";
      var r = svg("rect", { x: 5 + i * slot + slot * 0.12, y: v < 0 ? base : base - h, width: slot * 0.76, height: Math.max(h, 1), rx: 2, "class": c, "data-ym": ym });
      var t = svg("title", {}); t.textContent = mname(ym) + ": " + fmt(v); r.appendChild(t); g.appendChild(r);
      if (list.length <= 14 || i % 3 === 0 || ym.slice(5) === "01") {
        var tx = svg("text", { x: 5 + i * slot + slot / 2, y: H - 6, "text-anchor": "middle", "class": "axis" });
        tx.textContent = mshort(ym) + (ym.slice(5) === "01" || i === 0 ? " " + ym.slice(2, 4) : ""); g.appendChild(tx);
      }
    });
    if (low < 0) g.appendChild(svg("line", { x1: 5, x2: W - 5, y1: base, y2: base, "class": "grid" }));
    var mx = svg("text", { x: 4, y: 12, "class": "axis" }); mx.textContent = "max " + fmt(top) + (low < 0 ? ", min " + fmt(low) : ""); g.appendChild(mx);
    box.appendChild(g);
    var lg = el("div", "legend");
    [["sw sel", U.legend_sel + (k.p ? ": " + k.p.label : "")], ["sw cmp", k.c ? U.legend_cmp + ": " + k.c.label : null], ["sw", U.legend_other]].forEach(function (x) {
      if (!x[1]) return; var i = el("span", "lg"); i.appendChild(el("i", x[0])); i.appendChild(document.createTextNode(" " + x[1])); lg.appendChild(i);
    });
    box.appendChild(lg);
    return box;
  }

