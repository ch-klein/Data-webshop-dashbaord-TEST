// dashboard_js/view_shop.js: Weergave Webshop: bestellingen, retouren en klanten uit de gegevens van de webshop zelf (uitwisselbestand, zie shop_import.py).
// Alle onderdelen worden bij het bouwen achter elkaar gezet in een functie-omgeving (zie dashboard.read_js()); de volgorde staat in JS_PARTS.

  // ---------- weergave: Webshop ----------
  var SHOP_TAB = "orders";
  function shopSum(months) {
    var t = { orders: 0, revenue: 0, vat: 0, shipping: 0, discount: 0, cancelled: 0, refunded: 0, refund_orders: 0, "new": 0, returning: 0, unknown: 0 };
    months.forEach(function (ym) { var m = D.shop[ym]; if (!m) return; for (var key in t) t[key] += m[key] || 0; });
    return t;
  }
  function shopHasReturns() { var f = Object.keys(D.shop || {})[0]; return !!f && D.shop[f].refunded !== undefined; }
  function shopDiv(a, b, scale) { return b ? a / b * (scale || 1) : 0; }
  // cijferkaarten (of in Donker meters); list: [label, waarde, waarde bij de vergelijking of null, opmaak]
  function shopKpis(k, list) {
    if (isNeon()) return neonRow(list.map(function (r) { return compareItem(k, r[0], r[1], r[2], r[3], null); }));
    var wrap = el("div", "kpis");
    list.forEach(function (row) {
      var card = el("div", "kpi"); card.appendChild(el("div", "l", row[0])); card.appendChild(el("div", "v", row[3](row[1])));
      if (k.c && row[2] !== null && row[2] !== undefined) {
        var d = dlt(row[1], row[2]), line = el("div", "d " + cls(d));
        line.appendChild(el("b", null, sgn(d))); line.appendChild(document.createTextNode(" " + U.vs + " " + k.c.label)); card.appendChild(line);
      }
      wrap.appendChild(card);
    });
    return wrap;
  }
  function shopTrend(card, k, defs) {
    var holder = el("div"), bar = el("div", "controls"), lab = el("label", "field"), sel = el("select");
    lab.appendChild(el("span", null, U.sh_metric));
    defs.forEach(function (d) { var o = el("option", null, d.label); o.value = d.key; sel.appendChild(o); });
    function draw() {
      var d = defs.filter(function (x) { return x.key === sel.value; })[0];
      holder.textContent = ""; holder.appendChild(monthChart(k, "s", function (ym) { var m = D.shop[ym]; return m ? d.value(m) : null; }, d.fmt, d.label)); post();
    }
    sel.addEventListener("change", draw); lab.appendChild(sel); bar.appendChild(lab);
    card.firstChild.querySelector(".tools").insertBefore(bar, card.firstChild.querySelector(".xbtn")); card.appendChild(holder); draw();
  }
  function shopOrders(content, k, al, A, B) {
    content.appendChild(note(U.sh_orders_intro));
    var kc = el("section", "card"); kc.appendChild(panelHead(U.sh_h_kpi));
    var aov = function (t) { return shopDiv(t.revenue, t.orders); };
    kc.appendChild(shopKpis(k, [[U.sh_k_orders, A.orders, B && B.orders, n0], [U.sh_k_revenue, A.revenue, B && B.revenue, eur], [U.sh_k_aov, aov(A), B && B.orders ? aov(B) : null, eur],
                                [U.sh_k_ship, A.shipping, B && B.shipping, eur], [U.sh_k_disc, A.discount, B && B.discount, eur], [U.sh_k_cancel, A.cancelled, B && B.cancelled, n0]]));
    content.appendChild(kc);
    // tegenover Analytics
    var vc = el("section", "card"); vc.appendChild(panelHead(U.sh_h_vs));
    var gc = 0, gr = 0; al.a.forEach(function (ym) { gc += byYm[ym] ? byYm[ym].c : 0; gr += byYm[ym] ? byYm[ym].r : 0; });
    if (!gc) vc.appendChild(el("p", "muted", U.sh_vs_none));
    else {
      var head = [U.metric].concat(U.sh_vs_th.slice(1));
      if (isNeon()) vc.appendChild(neonRow([{ label: U.sh_vs_orders, fill: shopDiv(gc, A.orders, 100), center: pct(shopDiv(gc, A.orders, 100), 0), sub: n0(gc) + " / " + n0(A.orders) },
                                            { label: U.sh_vs_revenue, fill: shopDiv(gr, A.revenue, 100), center: pct(shopDiv(gr, A.revenue, 100), 0), sub: eur(gr) + " / " + eur(A.revenue) }]));
      vc.appendChild(pickTable(head, [{ key: "o", cells: [U.sh_vs_orders, n0(A.orders), n0(gc), pct(shopDiv(gc, A.orders, 100), 0)] },
                                      { key: "r", cells: [U.sh_vs_revenue, eur(A.revenue), eur(gr), pct(shopDiv(gr, A.revenue, 100), 0)] }], null));
    }
    vc.appendChild(note(U.sh_vs_note)); content.appendChild(vc);
    // verloop en maandtabel
    var ch = el("section", "card"); ch.appendChild(panelHead(U.sh_h_trend)); content.appendChild(ch);
    shopTrend(ch, k, [{ key: "o", label: U.sh_k_orders, value: function (m) { return m.orders; }, fmt: n0 }, { key: "r", label: U.sh_k_revenue, value: function (m) { return m.revenue; }, fmt: eur },
                      { key: "a", label: U.sh_k_aov, value: function (m) { return shopDiv(m.revenue, m.orders); }, fmt: eur }]);
    var mc = el("section", "card"); mc.appendChild(panelHead(U.sh_h_months));
    mc.appendChild(pickTable(U.sh_months_th, al.a.map(function (ym) {
      var m = D.shop[ym], g = byYm[ym];
      return { key: ym, cells: [mname(ym), n0(m.orders), eur(m.revenue), eur(shopDiv(m.revenue, m.orders)), g ? n0(g.c) : U.none] };
    }), null)); content.appendChild(mc);
  }
  function shopReturns(content, k, al, A, B) {
    content.appendChild(note(U.sh_returns_intro));
    var kc = el("section", "card"); kc.appendChild(panelHead(U.sh_h_returns));
    var rate = function (t) { return shopDiv(t.refunded, t.revenue, 100); }, cr = function (t) { return shopDiv(t.cancelled, t.orders + t.cancelled, 100); }, ro = function (t) { return shopDiv(t.refund_orders, t.orders, 100); };
    var p1 = function (x) { return pct(x, 1); };
    kc.appendChild(shopKpis(k, [[U.sh_r_refunded, A.refunded, B && B.refunded, eur], [U.sh_r_rate, rate(A), B && B.revenue ? rate(B) : null, p1], [U.sh_r_orders, ro(A), B && B.orders ? ro(B) : null, p1],
                                [U.sh_r_net, A.revenue - A.refunded, B && B.revenue - B.refunded, eur], [U.sh_r_cancel_rate, cr(A), B && (B.orders + B.cancelled) ? cr(B) : null, p1]]));
    var recent = al.a.some(function (ym) { return HAVE.indexOf(ym) >= HAVE.length - 2; });
    if (recent) kc.appendChild(note(U.sh_prelim));
    content.appendChild(kc);
    var ch = el("section", "card"); ch.appendChild(panelHead(U.sh_h_trend)); content.appendChild(ch);
    shopTrend(ch, k, [{ key: "r", label: U.sh_r_rate, value: function (m) { return shopDiv(m.refunded, m.revenue, 100); }, fmt: p1 },
                      { key: "f", label: U.sh_r_refunded, value: function (m) { return m.refunded; }, fmt: eur },
                      { key: "n", label: U.sh_r_net, value: function (m) { return m.revenue - m.refunded; }, fmt: eur }]);
    var mc = el("section", "card"); mc.appendChild(panelHead(U.sh_h_returns_months));
    mc.appendChild(pickTable(U.sh_returns_th, al.a.map(function (ym) {
      var m = D.shop[ym];
      return { key: ym, cells: [mname(ym), eur(m.revenue), eur(m.refunded), p1(shopDiv(m.refunded, m.revenue, 100)), eur(m.revenue - m.refunded), n0(m.cancelled)] };
    }), null)); content.appendChild(mc);
  }
  function shopCustomers(content, k, al, A, B) {
    content.appendChild(note(U.sh_customers_intro));
    var card = el("section", "card"); card.appendChild(panelHead(U.sh_h_customers)); content.appendChild(card);
    if (!(A["new"] + A.returning)) { card.appendChild(el("p", "muted", U.sh_c_none)); return; }
    var share = function (t) { return shopDiv(t.returning, t["new"] + t.returning, 100); };
    card.appendChild(shopKpis(k, [[U.sh_c_new, A["new"], B && B["new"], n0], [U.sh_c_ret, A.returning, B && B.returning, n0], [U.sh_c_unknown, A.unknown, B && B.unknown, n0]]));
    var parts = [{ name: U.sh_c_new, value: A["new"] }, { name: U.sh_c_ret, value: A.returning }];
    if (A.unknown) parts.push({ name: U.sh_c_unknown, value: A.unknown });
    if (isNeon()) { var map = {}; parts.forEach(function (p) { map[p.name] = p.value; }); card.appendChild(neonRow(shareItems(k, map, A.orders, n0, null))); }
    else card.appendChild(donut(parts, U.sh_h_customers));
    card.appendChild(note(pct(share(A), 0) + " " + U.sh_c_share + " " + U.sh_c_ret.toLowerCase()));
    card.appendChild(pickTable(U.sh_customers_th, al.a.map(function (ym) {
      var m = D.shop[ym];
      return { key: ym, cells: [mname(ym), n0(m["new"] || 0), n0(m.returning || 0), n0(m.unknown || 0), pct(shopDiv(m.returning || 0, (m["new"] || 0) + (m.returning || 0), 100), 0)] };
    }), null));
    card.appendChild(note(U.sh_c_note));
  }
  // bestelstappen: hoeveel unieke bezoekers kwamen van product bekeken tot gekocht, en waar vallen ze af
  var FUNNEL = ["view_item", "add_to_cart", "begin_checkout", "purchase"];
  function funnelSum(months, grp, name) {
    var t = { view_item: 0, add_to_cart: 0, begin_checkout: 0, purchase: 0 };
    months.forEach(function (ym) {
      var m = D.funnel[ym], st = m ? (grp ? (m[grp] || {})[name] : m.steps) : null;
      if (st) FUNNEL.forEach(function (k) { t[k] += st[k] || 0; });
    });
    return t;
  }
  function funnelRate(t, i) { return i === 0 ? 100 : shopDiv(t[FUNNEL[i]], t[FUNNEL[i - 1]], 100); }
  function funnelTable(card, k, al, grp) {
    var names = {}, cmpNames = {};
    al.a.forEach(function (ym) { var g = (D.funnel[ym] || {})[grp] || {}; for (var n in g) names[n] = (names[n] || 0) + g[n].view_item; });
    var list = Object.keys(names).sort(function (x, y) { return names[y] - names[x]; });
    if (!list.length) return;
    card.appendChild(pickTable(U.fn_grp_th[grp], list.map(function (n) {
      var t = funnelSum(al.a, grp, n);
      return { key: n, cells: [grp === "by_device" ? (U.device_names && U.device_names[n] ? U.device_names[n] : n) : n, n0(t.view_item), pct(funnelRate(t, 1), 1), pct(funnelRate(t, 2), 1), pct(funnelRate(t, 3), 1), pct(shopDiv(t.purchase, t.view_item, 100), 2)] };
    }), null));
  }
  function shopFunnel(content, k) {
    var al = alignedWith(k, D.funnel);
    content.appendChild(note(U.fn_intro));
    if (!al.a.length) { content.appendChild(el("p", "muted", U.sh_no_data)); return; }
    if (al.have < al.of) content.appendChild(note(U.parts_note.replace("{n}", al.have).replace("{t}", al.of)));
    var A = funnelSum(al.a), B = al.b ? funnelSum(al.b) : null, p1 = function (x) { return pct(x, 1); };
    var missing = FUNNEL.filter(function (s) { return !A[s]; });
    if (missing.length) { var w = el("section", "card"); w.appendChild(panelHead(U.fn_h_missing)); w.appendChild(note(U.fn_missing.replace("{s}", missing.map(function (s) { return U.fn_steps[s]; }).join(", ")))); content.appendChild(w); return; }
    var kc = el("section", "card"); kc.appendChild(panelHead(U.fn_h_kpi));
    var rate = function (t, i) { return t.view_item ? funnelRate(t, i) : 0; };
    kc.appendChild(shopKpis(k, [[U.fn_r1, rate(A, 1), B && B.view_item ? rate(B, 1) : null, p1], [U.fn_r2, rate(A, 2), B && B.add_to_cart ? rate(B, 2) : null, p1],
                                [U.fn_r3, rate(A, 3), B && B.begin_checkout ? rate(B, 3) : null, p1], [U.fn_rall, shopDiv(A.purchase, A.view_item, 100), B && B.view_item ? shopDiv(B.purchase, B.view_item, 100) : null, function (x) { return pct(x, 2); }]]));
    var worst = 1, i;
    for (i = 2; i <= 3; i++) if (funnelRate(A, i) < funnelRate(A, worst)) worst = i;
    kc.appendChild(note(U.fn_biggest.replace("{a}", U.fn_steps[FUNNEL[worst - 1]]).replace("{b}", U.fn_steps[FUNNEL[worst]]).replace("{p}", pct(100 - funnelRate(A, worst), 0))));
    content.appendChild(kc);
    var vc = el("section", "card"); vc.appendChild(panelHead(U.fn_h_steps));
    vc.appendChild(hbars(FUNNEL.map(function (s, j) { return { label: U.fn_steps[s], value: A[s], text: n0(A[s]) + (j ? " (" + pct(funnelRate(A, j), 0) + ")" : "") }; })));
    vc.appendChild(pickTable(U.fn_th, FUNNEL.map(function (s, j) {
      var cmp = !B || !j ? U.none : pct(funnelRate(B, j), 1), diff = !B || !j ? U.none : ppDiff(funnelRate(A, j) - funnelRate(B, j)),
          ver = !B || !j ? U.none : U[verdict(A[s], A[FUNNEL[j - 1]], B[s], B[FUNNEL[j - 1]])];
      return { key: s, cells: [U.fn_steps[s], n0(A[s]), j ? pct(funnelRate(A, j), 1) : U.none, cmp, diff, { t: ver, cls: "txt" }] };
    }), null));
    vc.appendChild(note(U.fn_note)); content.appendChild(vc);
    var gc = el("section", "card"); gc.appendChild(panelHead(U.fn_h_dev)); funnelTable(gc, k, al, "by_device"); if (gc.children.length > 1) content.appendChild(gc);
    var cc = el("section", "card"); cc.appendChild(panelHead(U.fn_h_chan)); funnelTable(cc, k, al, "by_channel"); if (cc.children.length > 1) content.appendChild(cc);
    var tc = el("section", "card"); tc.appendChild(panelHead(U.fn_h_trend)); content.appendChild(tc);
    tc.appendChild(monthChart(k, "s", function (ym) { var m = D.funnel[ym]; return m && m.steps.view_item ? m.steps.purchase / m.steps.view_item * 100 : null; }, function (x) { return pct(x, 2); }, U.fn_h_trend));
  }
  function ppDiff(x) { return (x >= 0 ? "+" : "\u2212") + Math.abs(x).toLocaleString(LOC, { minimumFractionDigits: 1, maximumFractionDigits: 1 }); }
  // winst per product: orderregels en inkoopprijzen van de klant; alleen brutowinst, en alleen over de omzet waarvan de inkoopprijs bekend is
  function profitSum(months) {
    var t = { rev: 0, known: 0, cost: 0, ads: 0, prod: {} };
    months.forEach(function (ym) {
      var m = D.shop_profit.months[ym]; if (!m) return;
      t.rev += m.rev; t.known += m.known; t.cost += m.cost;
      if (D.ads && D.ads[ym]) t.ads += D.ads[ym].t[0];
      m.rows.forEach(function (r) { var p = t.prod[r[0]] = t.prod[r[0]] || { items: 0, rev: 0, cost: 0, unknown: 0 }; p.items += r[1]; p.rev += r[2]; if (r[3] === null) p.unknown += r[2]; else p.cost += r[3]; });
    });
    return t;
  }
  function shopProfit(content, k) {
    var P = D.shop_profit, al = alignedWith(k, P.months);
    content.appendChild(note(U.pr_intro));
    if (!al.a.length) { content.appendChild(el("p", "muted", U.sh_no_data)); return; }
    if (al.have < al.of) content.appendChild(note(U.parts_note.replace("{n}", al.have).replace("{t}", al.of)));
    var A = profitSum(al.a), B = al.b ? profitSum(al.b) : null, p1 = function (x) { return pct(x, 1); };
    var margin = function (t) { return shopDiv(t.known - t.cost, t.known, 100); }, cover = function (t) { return shopDiv(t.known, t.rev, 100); };
    var cov = cover(A);
    var names = Object.keys(A.prod).sort(function (x, y) { return A.prod[y].rev - A.prod[x].rev; });
    if (!P.prices || !A.known) {
      var c0 = el("section", "card"); c0.appendChild(panelHead(U.pr_h_none)); c0.appendChild(note(U.pr_none)); content.appendChild(c0);
    } else {
      var kc = el("section", "card"); kc.appendChild(panelHead(U.pr_h_kpi));
      var list = [[U.pr_k_profit, A.known - A.cost, B && B.known - B.cost, eur], [U.pr_k_margin, margin(A), B && B.known ? margin(B) : null, p1], [U.pr_k_cover, cov, B && B.rev ? cover(B) : null, function (x) { return pct(x, 0); }]];
      var adsOk = A.ads > 0 && cov >= 90;
      if (adsOk) list.push([U.pr_k_after_ads, A.known - A.cost - A.ads, B && B.ads > 0 ? B.known - B.cost - B.ads : null, eur]);
      kc.appendChild(shopKpis(k, list));
      kc.appendChild(note(U.pr_scope));
      if (A.ads > 0 && !adsOk) kc.appendChild(note(U.pr_ads_cover));
      if (cov < 100) kc.appendChild(note(U.pr_cover_note.replace("{p}", pct(cov, 0))));
      content.appendChild(kc);
      // per kanaal: break-even rendement en winst na advertentie, met de gemiddelde marge van de hele shop als aanname
      if (adsOk && D.ads && D.channel_stats) {
        var cc = el("section", "card"); cc.appendChild(panelHead(U.pr_h_channels));
        var cost = {}, rev = {}, mg = margin(A) / 100;
        al.a.forEach(function (ym) {
          var a = D.ads[ym] ? D.ads[ym].c : {}, cs = D.channel_stats[ym] || {};
          for (var ch in a) { cost[ch] = (cost[ch] || 0) + a[ch][0]; rev[ch] = (rev[ch] || 0) + (cs[ch] ? cs[ch][1] : 0); }
        });
        var chans = Object.keys(cost).filter(function (ch) { return cost[ch] > 0; }).sort(function (x, y) { return cost[y] - cost[x]; });
        if (chans.length && mg > 0) {
          cc.appendChild(pickTable(U.pr_ch_th, chans.map(function (ch) {
            var roas = cost[ch] ? rev[ch] / cost[ch] : 0, net = rev[ch] * mg - cost[ch];
            return { key: ch, cells: [ch, eur(cost[ch]), eur(rev[ch]), roas.toLocaleString(LOC, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "\u00d7",
                                      (1 / mg).toLocaleString(LOC, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "\u00d7", { t: (net >= 0 ? "" : "\u2212") + eur(Math.abs(net)), cls: "num " + (net >= 0 ? "pos" : "neg") }] };
          }), null));
          cc.appendChild(note(U.pr_ch_note)); content.appendChild(cc);
        }
      }
      var tc = el("section", "card"); tc.appendChild(panelHead(U.pr_h_trend)); content.appendChild(tc);
      var holder = el("div"); tc.appendChild(holder);
      holder.appendChild(monthChart(k, "s", function (ym) { var m = P.months[ym]; return m && m.known ? (m.known - m.cost) / m.known * 100 : null; }, p1, U.pr_h_trend));
    }
    var pc = el("section", "card"); pc.appendChild(panelHead(U.pr_h_products));
    pc.appendChild(pickTable(U.pr_prod_th, names.slice(0, 15).map(function (n) {
      var p = A.prod[n], known = p.unknown === 0;
      return { key: n, cells: [n, n0(p.items), eur(p.rev), known ? eur(p.cost) : U.none, known ? eur(p.rev - p.cost) : U.none, known ? p1(shopDiv(p.rev - p.cost, p.rev, 100)) : { t: U.pr_no_price, cls: "txt" }] };
    }), null));
    var missing = names.filter(function (n) { return A.prod[n].unknown > 0; });
    if (missing.length) pc.appendChild(note((missing.length === 1 ? U.pr_missing_1 : U.pr_missing.replace("{n}", missing.length)) + " " + missing.slice(0, 5).join(", ")));
    content.appendChild(pc);
  }
  function renderShop(content) {
    var k = ctx();
    content.appendChild(notes(k));
    var tabs = [];
    if (D.shop) tabs.push("orders");
    if (D.funnel) tabs.push("funnel");
    if (D.product_funnel || D.shop_lines) tabs.push("products");
    if (D.coupons) tabs.push("coupons");
    if (D.shop && shopHasReturns()) tabs.push("returns", "customers");
    if (D.shop_profit) tabs.push("profit");
    if (tabs.indexOf(SHOP_TAB) < 0) SHOP_TAB = tabs[0];
    if (tabs.length > 1) {
      var bar = el("div", "subtabs");
      tabs.forEach(function (t) {
        var b = el("button", "pill" + (SHOP_TAB === t ? " on" : ""), U.sh_tabs[t]); b.type = "button"; b.setAttribute("data-shop", t);
        if (SHOP_TAB === t) b.setAttribute("aria-current", "true");
        b.addEventListener("click", function () { SHOP_TAB = t; renderContent(); });
        bar.appendChild(b);
      });
      content.appendChild(bar);
    }
    if (SHOP_TAB === "profit") { shopProfit(content, k); return; }
    if (SHOP_TAB === "funnel") { shopFunnel(content, k); return; }
    if (SHOP_TAB === "products") { shopProducts(content, k); return; }
    if (SHOP_TAB === "coupons") { shopCoupons(content, k); return; }
    var al = alignedWith(k, D.shop);
    if (!al.a.length) { content.appendChild(el("p", "muted", U.sh_no_data)); return; }
    if (al.have < al.of) content.appendChild(note(U.parts_note.replace("{n}", al.have).replace("{t}", al.of)));
    var A = shopSum(al.a), B = al.b ? shopSum(al.b) : null;
    if (SHOP_TAB === "returns") shopReturns(content, k, al, A, B);
    else if (SHOP_TAB === "customers") shopCustomers(content, k, al, A, B);
    else shopOrders(content, k, al, A, B);
  }
  VIEWS.push({ id: "shop", icon: "cart", label: "n_shop", render: renderShop, needs: function () { return !!D.shop || !!D.shop_profit || !!D.funnel || !!D.product_funnel || !!D.shop_lines || !!D.coupons; } });
