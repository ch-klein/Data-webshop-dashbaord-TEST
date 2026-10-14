// dashboard_js/view_shop3.js: Webshop, tabs Voorraad en Betaalmethoden (duurste abonnement).
// Alle onderdelen worden bij het bouwen achter elkaar gezet in een functie-omgeving (zie dashboard.read_js()); de volgorde staat in JS_PARTS.

  // ---------- weergave: Webshop, Voorraad ----------
  // Voorraad is een stand aan het einde van een maand (bestand van de webshop). Naast de verkoop van die maand geeft dat een rekensom: voor hoeveel dagen is het genoeg als de verkoop zo doorgaat.
  function daysIn(ym) { var p = ym.split("-"); return new Date(parseInt(p[0], 10), parseInt(p[1], 10), 0).getDate(); }
  function shopStock(content, k) {
    var al = alignedWith(k, D.stock);
    content.appendChild(note(U.st_intro));
    if (!al.a.length) { content.appendChild(el("p", "muted", U.sh_no_data)); return; }
    if (al.have < al.of) content.appendChild(note(U.parts_note.replace("{n}", al.have).replace("{t}", al.of)));
    var ym = al.a[al.a.length - 1], st = D.stock[ym], sold = D.shop_lines && D.shop_lines[ym] ? D.shop_lines[ym] : {}, days = daysIn(ym);
    var rows = Object.keys(st).map(function (n) { var s = st[n][0], q = sold[n] ? sold[n][0] : 0; return { n: n, s: s, q: q, cover: q > 0 ? s / (q / days) : null }; });
    var out = rows.filter(function (r) { return r.s === 0 && r.q >= 10; }), low = rows.filter(function (r) { return r.s > 0 && r.q >= 10 && r.cover < 14; });
    var kc = el("section", "card"); kc.appendChild(panelHead(U.st_h_kpi.replace("{m}", mname(ym))));
    kc.appendChild(shopKpis(k, [[U.st_k_products, rows.length, null, n0], [U.st_k_out, rows.filter(function (r) { return r.s === 0; }).length, null, n0], [U.st_k_low, low.length, null, n0],
                                [U.st_k_units, rows.reduce(function (a, r) { return a + r.s; }, 0), null, n0]]));
    kc.appendChild(note(U.st_note)); content.appendChild(kc);
    var flags = out.map(function (r) { return U.st_flag_out.replace("{p}", function () { return r.n; }).replace("{n}", n0(r.q)); })
      .concat(low.sort(function (a, b) { return a.cover - b.cover; }).map(function (r) { return U.st_flag_low.replace("{p}", function () { return r.n; }).replace("{s}", n0(r.s)).replace("{d}", n0(Math.floor(r.cover))).replace("{n}", n0(r.q)); }));
    var fc = el("section", "card"); fc.appendChild(panelHead(U.st_h_flags));
    if (flags.length) { var ul = el("ul"); flags.forEach(function (f) { ul.appendChild(el("li", null, f)); }); fc.appendChild(ul); } else fc.appendChild(el("p", "muted", U.st_no_flags));
    fc.appendChild(note(U.st_flag_note)); content.appendChild(fc);
    rows.sort(function (a, b) { return (a.cover === null ? 1e9 + a.s : a.cover) - (b.cover === null ? 1e9 + b.s : b.cover); });
    var tc = el("section", "card"); tc.appendChild(panelHead(U.st_h_table));
    tc.appendChild(pickTable(U.st_th, rows.slice(0, 15).map(function (r) { return { key: r.n, cells: [r.n, n0(r.s), r.q ? n0(r.q) : U.none, r.cover === null ? U.none : n0(Math.floor(r.cover))] }; }), null));
    content.appendChild(tc);
  }

  // ---------- weergave: Webshop, Betaalmethoden ----------
  // Aantallen per methode (bestand van de webshop of de betaalaanbieder): gelukt, mislukt, afgebroken, en eventueel de kosten van de aanbieder.
  function paySum(months) {
    var t = { orders: 0, failed: 0, abandoned: 0, fees: 0, feesKnown: true, methods: {} };
    months.forEach(function (ym) {
      var m = D.payments[ym]; if (!m) return;
      for (var n in m) {
        var r = m[n], x = t.methods[n] = t.methods[n] || { orders: 0, failed: 0, abandoned: 0, fees: 0 };
        x.orders += r[0]; x.failed += r[1]; x.abandoned += r[2]; t.orders += r[0]; t.failed += r[1]; t.abandoned += r[2];
        if (r[3] === null) t.feesKnown = false; else { x.fees += r[3]; t.fees += r[3]; }
      }
    });
    return t;
  }
  function payTries(x) { return x.orders + x.failed + x.abandoned; }
  function payLoss(x) { var a = payTries(x); return a ? (x.failed + x.abandoned) / a * 100 : 0; }
  function shopPayments(content, k) {
    var al = alignedWith(k, D.payments);
    content.appendChild(note(U.py_intro));
    if (!al.a.length) { content.appendChild(el("p", "muted", U.sh_no_data)); return; }
    if (al.have < al.of) content.appendChild(note(U.parts_note.replace("{n}", al.have).replace("{t}", al.of)));
    var A = paySum(al.a), B = al.b ? paySum(al.b) : null, p1 = function (x) { return pct(x, 1); };
    var bOk = B && payTries(B) > 0, per = function (t) { return t.feesKnown && t.orders ? t.fees / t.orders : null; };
    var kc = el("section", "card"); kc.appendChild(panelHead(U.py_h_kpi));
    var list = [[U.py_k_ok, A.orders, B && B.orders, n0], [U.py_k_failed, A.failed, B && B.failed, n0], [U.py_k_abandoned, A.abandoned, B && B.abandoned, n0], [U.py_k_loss, payLoss(A), bOk ? payLoss(B) : null, p1]];
    if (per(A) !== null) list.push([U.py_k_fees, A.fees, B && B.feesKnown ? B.fees : null, eur], [U.py_k_fee_order, per(A), B && per(B) !== null ? per(B) : null, eur]);
    kc.appendChild(shopKpis(k, list)); kc.appendChild(note(U.py_note)); content.appendChild(kc);
    // wat opvalt: een methode met veel meer uitval dan de andere samen, alleen bij genoeg betalingen en een verschil dat niet aan toeval ligt
    var flags = [];
    Object.keys(A.methods).forEach(function (n) {
      var x = A.methods[n], tx = payTries(x), to = payTries(A) - tx; if (tx < 50 || to < 50) return;
      var lx = (x.failed + x.abandoned) / tx, lo = (A.failed + A.abandoned - x.failed - x.abandoned) / to, p = (lx * tx + lo * to) / (tx + to), se = Math.sqrt(p * (1 - p) * (1 / tx + 1 / to));
      if (lx >= 0.10 && lx >= 1.5 * lo && (lx - lo) / (se || 1) >= 3) flags.push(U.py_flag.replace("{m}", function () { return n; }).replace("{a}", pct(lx * 100, 0)).replace("{b}", pct(lo * 100, 0)).replace("{n}", n0(tx)));
    });
    var fc = el("section", "card"); fc.appendChild(panelHead(U.py_h_flags));
    if (flags.length) { var ul = el("ul"); flags.forEach(function (f) { ul.appendChild(el("li", null, f)); }); fc.appendChild(ul); } else fc.appendChild(el("p", "muted", U.py_no_flags));
    fc.appendChild(note(U.py_flag_note)); content.appendChild(fc);
    var tc = el("section", "card"); tc.appendChild(panelHead(U.py_h_table));
    if (isNeon()) { var map = {}; Object.keys(A.methods).forEach(function (n) { map[n] = A.methods[n].orders; }); tc.appendChild(neonRow(shareItems(k, map, A.orders, n0, null))); }
    var names = Object.keys(A.methods).sort(function (x, y) { return A.methods[y].orders - A.methods[x].orders; });
    tc.appendChild(pickTable(U.py_th, names.map(function (n) {
      var x = A.methods[n];
      return { key: n, cells: [n, pct(A.orders ? x.orders / A.orders * 100 : 0, 0), n0(x.orders), n0(x.failed), n0(x.abandoned), p1(payLoss(x)), A.feesKnown && x.orders ? eur(x.fees / x.orders) : U.none] };
    }), null));
    content.appendChild(tc);
    var ch = el("section", "card"); ch.appendChild(panelHead(U.py_h_trend)); content.appendChild(ch);
    ch.appendChild(monthChart(k, "s", function (ym) {
      var m = D.payments[ym]; if (!m) return null;
      var t = { orders: 0, failed: 0, abandoned: 0 }; for (var n in m) { t.orders += m[n][0]; t.failed += m[n][1]; t.abandoned += m[n][2]; }
      return payTries(t) ? payLoss(t) : null;
    }, p1, U.py_h_trend));
  }
