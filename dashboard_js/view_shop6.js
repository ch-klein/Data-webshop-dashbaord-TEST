// dashboard_js/view_shop6.js: Webshop, tab Verzending (duurste abonnement).
// Alle onderdelen worden bij het bouwen achter elkaar gezet in een functie-omgeving (zie dashboard.read_js()); de volgorde staat in JS_PARTS.

  // ---------- weergave: Webshop, Verzending ----------
  // Per vervoerder (bestand van de webshop of de vervoerder): pakketten, wat de winkel betaalt, wat klanten betaalden, hoeveel te laat en eventueel de gemiddelde levertijd.
  function shipSum(months) {
    var t = { parcels: 0, cost: 0, charged: 0, late: 0, daySum: 0, daysKnown: true, carriers: {} };
    months.forEach(function (ym) {
      var m = D.shipping[ym]; if (!m) return;
      for (var n in m) {
        var r = m[n], x = t.carriers[n] = t.carriers[n] || { parcels: 0, cost: 0, charged: 0, late: 0, daySum: 0, daysKnown: true };
        x.parcels += r[0]; x.cost += r[1]; x.charged += r[2]; x.late += r[3]; t.parcels += r[0]; t.cost += r[1]; t.charged += r[2]; t.late += r[3];
        if (r[4] === null) { x.daysKnown = false; t.daysKnown = false; } else { x.daySum += r[4] * r[0]; t.daySum += r[4] * r[0]; }
      }
    });
    return t;
  }
  // de netto verzendkosten (kosten min wat klanten betaalden) van de gekozen maanden; null als een maand geen verzendgegevens heeft (voor de winst na kosten)
  function shipNet(months) {
    if (!D.shipping) return null;
    var t = 0;
    for (var i = 0; i < months.length; i++) {
      var m = D.shipping[months[i]]; if (!m) return null;
      for (var n in m) t += m[n][1] - m[n][2];
    }
    return t;
  }
  function shopShipping(content, k) {
    var al = alignedWith(k, D.shipping);
    content.appendChild(note(U.sv_intro));
    if (!al.a.length) { content.appendChild(el("p", "muted", U.sh_no_data)); return; }
    if (al.have < al.of) content.appendChild(note(U.parts_note.replace("{n}", al.have).replace("{t}", al.of)));
    var A = shipSum(al.a), B = al.b ? shipSum(al.b) : null, p1 = function (x) { return pct(x, 1); }, d1 = function (x) { return x.toLocaleString(LOC, { minimumFractionDigits: 1, maximumFractionDigits: 1 }); };
    var per = function (t) { return t && t.parcels ? t.cost / t.parcels : null; }, lateP = function (t) { return t && t.parcels ? t.late / t.parcels * 100 : null; };
    var kc = el("section", "card"); kc.appendChild(panelHead(U.sv_h_kpi));
    var list = [[U.sv_k_parcels, A.parcels, B && B.parcels, n0], [U.sv_k_cost, A.cost, B && B.cost, eur], [U.sv_k_charged, A.charged, B && B.charged, eur], [U.sv_k_result, A.charged - A.cost, B ? B.charged - B.cost : null, eur],
                [U.sv_k_per, per(A), B && per(B) !== null ? per(B) : null, eur], [U.sv_k_late, lateP(A), B && B.parcels ? lateP(B) : null, p1]];
    if (A.daysKnown && A.parcels) list.push([U.sv_k_days, A.daySum / A.parcels, B && B.daysKnown && B.parcels ? B.daySum / B.parcels : null, function (x) { return d1(x) + " " + U.sv_days; }]);
    kc.appendChild(shopKpis(k, list)); kc.appendChild(note(U.sv_note)); content.appendChild(kc);
    // wat opvalt: een vervoerder met veel meer te laat dan de rest samen, alleen bij genoeg pakketten en een verschil dat een toets doorstaat
    var flags = [];
    Object.keys(A.carriers).forEach(function (n) {
      var x = A.carriers[n], tx = x.parcels, to = A.parcels - tx; if (tx < 50 || to < 50) return;
      var lx = x.late / tx, lo = (A.late - x.late) / to, p = (lx * tx + lo * to) / (tx + to), se = Math.sqrt(p * (1 - p) * (1 / tx + 1 / to));
      if (lx >= 0.10 && lx >= 1.5 * lo && (lx - lo) / (se || 1) >= 3) flags.push(U.sv_flag.replace("{c}", function () { return n; }).replace("{a}", pct(lx * 100, 0)).replace("{b}", pct(lo * 100, 0)).replace("{n}", n0(tx)));
    });
    var fc = el("section", "card"); fc.appendChild(panelHead(U.sv_h_flags));
    if (flags.length) { var ul = el("ul"); flags.forEach(function (f) { ul.appendChild(el("li", null, f)); }); fc.appendChild(ul); } else fc.appendChild(el("p", "muted", U.sv_no_flags));
    fc.appendChild(note(U.sv_flag_note)); content.appendChild(fc);
    var tc = el("section", "card"); tc.appendChild(panelHead(U.sv_h_table));
    if (isNeon()) { var map = {}; Object.keys(A.carriers).forEach(function (n) { map[n] = A.carriers[n].parcels; }); tc.appendChild(neonRow(shareItems(k, map, A.parcels, n0, null))); }
    var names = Object.keys(A.carriers).sort(function (x, y) { return A.carriers[y].parcels - A.carriers[x].parcels; });
    tc.appendChild(pickTable(U.sv_th, names.map(function (n) {
      var x = A.carriers[n];
      return { key: n, cells: [n, pct(A.parcels ? x.parcels / A.parcels * 100 : 0, 0), n0(x.parcels), eur(x.cost / x.parcels), p1(x.late / x.parcels * 100), x.daysKnown ? d1(x.daySum / x.parcels) + " " + U.sv_days : U.none] };
    }), null));
    content.appendChild(tc);
    var ch = el("section", "card"); ch.appendChild(panelHead(U.sv_h_trend)); content.appendChild(ch);
    ch.appendChild(monthChart(k, "s", function (ym) {
      var m = D.shipping[ym]; if (!m) return null;
      var p = 0, l = 0; for (var n in m) { p += m[n][0]; l += m[n][3]; }
      return p ? l / p * 100 : null;
    }, p1, U.sv_h_trend));
  }
