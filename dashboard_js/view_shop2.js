// dashboard_js/view_shop2.js: Webshop, tab Producten: bekeken, in winkelwagen en gekocht per product, met omzet, retouren en marge waar die bekend zijn.
// Alle onderdelen worden bij het bouwen achter elkaar gezet in een functie-omgeving (zie dashboard.read_js()); de volgorde staat in JS_PARTS.

  // ---------- weergave: Webshop, Producten ----------
  function productSum(months) {
    var t = {};
    function get(name) { var key = name.toLowerCase(); return t[key] = t[key] || { name: name, v: 0, c: 0, b: 0, items: 0, rev: 0, ref: 0, hasFunnel: false, hasLines: false, mrev: 0, mcost: 0 }; }
    months.forEach(function (ym) {
      var pf = D.product_funnel ? D.product_funnel[ym] : null, sl = D.shop_lines ? D.shop_lines[ym] : null, sp = D.shop_profit ? D.shop_profit.months[ym] : null;
      if (pf) for (var n in pf) { var p = get(n); p.v += pf[n][0]; p.c += pf[n][1]; p.b += pf[n][2]; p.hasFunnel = true; }
      if (sl) for (var m in sl) { var q = get(m); q.items += sl[m][0]; q.rev += sl[m][1]; q.ref += sl[m][2]; q.hasLines = true; }
      if (sp) sp.rows.forEach(function (r) { if (r[3] !== null) { var z = get(r[0]); z.mrev += r[2]; z.mcost += r[3]; } });
    });
    return t;
  }
  function productFlags(list) {
    var V = 0, C = 0, R = 0, F = 0, out = [];
    list.forEach(function (p) { if (p.hasFunnel) { V += p.v; C += p.c; } if (p.hasLines) { R += p.rev; F += p.ref; } });
    var avgCart = V ? C / V : 0, avgRet = R ? F / R : 0;
    list.forEach(function (p) {
      var exp = p.v * avgCart;
      if (p.hasFunnel && p.v >= 100 && exp >= 8 && p.c < 0.5 * exp && poissonCdf(p.c, exp) < 0.05) out.push({ sev: 0, text: U.pd_flag_low.replace("{name}", p.name).replace("{v}", n0(p.v)).replace("{r}", pct(p.c / p.v * 100, 1)).replace("{a}", pct(avgCart * 100, 1)) });
      var rate = p.rev ? p.ref / p.rev : 0;
      if (p.hasLines && p.items >= 20 && avgRet > 0 && rate >= Math.max(2 * avgRet, avgRet + 0.05)) out.push({ sev: 1, text: U.pd_flag_ret.replace("{name}", p.name).replace("{r}", pct(rate * 100, 1)).replace("{a}", pct(avgRet * 100, 1)) });
    });
    return { items: out, avgCart: avgCart };
  }
  function shopProducts(content, k) {
    var store = {}; Object.keys(D.product_funnel || {}).forEach(function (ym) { store[ym] = 1; }); Object.keys(D.shop_lines || {}).forEach(function (ym) { store[ym] = 1; });
    var al = alignedWith(k, store);
    content.appendChild(note(U.pd_intro));
    if (!al.a.length) { content.appendChild(el("p", "muted", U.pd_no_data)); return; }
    if (al.have < al.of) content.appendChild(note(U.parts_note.replace("{n}", al.have).replace("{t}", al.of)));
    var sum = productSum(al.a), list = Object.keys(sum).map(function (key) { return sum[key]; });
    list.sort(function (x, y) { return (y.v || y.rev) - (x.v || x.rev); });
    var flags = productFlags(list), card = el("section", "card"); card.appendChild(panelHead(U.pd_h_table)); content.appendChild(card);
    if (isNeon()) {
      var top = list.filter(function (p) { return p.hasFunnel && p.v > 0; }).slice(0, 6);
      card.appendChild(neonRow(top.map(function (p) {
        var rate = p.c / p.v * 100;
        return { label: p.name, fill: flags.avgCart ? Math.min(100, rate / (flags.avgCart * 100) * 50) : 0, center: pct(rate, 1), sub: U.pd_gauge_sub.replace("{v}", n0(p.v)) };
      })));
    }
    var holder = el("div"), dash = U.none;
    card.appendChild(pickTable(U.pd_th, list.slice(0, 20).map(function (p) {
      var rr = p.rev ? p.ref / p.rev * 100 : null, mg = p.mrev ? (p.mrev - p.mcost) / p.mrev * 100 : null;
      return { key: p.name.toLowerCase(), cells: [p.name, p.hasFunnel ? n0(p.v) : dash, p.hasFunnel ? n0(p.c) : dash, p.hasFunnel ? n0(p.b) : dash, p.hasFunnel && p.v ? pct(p.c / p.v * 100, 1) : dash,
                                                  p.hasFunnel && p.c ? pct(p.b / p.c * 100, 1) : dash, p.hasLines ? eur(p.rev) : dash, rr === null || !p.hasLines ? dash : pct(rr, 1), mg === null ? dash : pct(mg, 1)] };
    }), function (key, tr) {
      Array.prototype.forEach.call(card.querySelectorAll("tr.pick.on"), function (x) { x.classList.remove("on"); }); tr.classList.add("on");
      var name = sum[key].name;
      trendDetail(holder, k, U.pd_h_trend + name, function (ym) {
        var pf = D.product_funnel ? D.product_funnel[ym] : null; if (!pf) return null;
        for (var n in pf) if (n.toLowerCase() === key) return pf[n][2];
        return 0;
      }, n0);
    }));
    card.appendChild(note(U.pd_trend_hint)); card.appendChild(holder);
    var fc = el("section", "card"); fc.appendChild(panelHead(U.pd_h_flags));
    if (flags.items.length) { var ul = el("ul"); flags.items.slice(0, 8).forEach(function (f) { ul.appendChild(el("li", null, f.text)); }); fc.appendChild(ul); }
    else fc.appendChild(el("p", "muted", U.pd_no_flags));
    fc.appendChild(note(U.pd_flag_note)); content.appendChild(fc);
  }
