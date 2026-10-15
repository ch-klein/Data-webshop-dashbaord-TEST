// dashboard_js/view_shop5.js: Webshop, tab Prijzen (duurste abonnement).
// Alle onderdelen worden bij het bouwen achter elkaar gezet in een functie-omgeving (zie dashboard.read_js()); de volgorde staat in JS_PARTS.

  // ---------- weergave: Webshop, Prijzen ----------
  // De gemiddelde verkoopprijs per product per maand = omzet (zonder btw, na korting) gedeeld door het aantal stuks, uit de orderregels. Dat is geen prijslijst: een verandering kan een prijswijziging zijn,
  // maar ook een kortingsactie of een andere mix van varianten. Een verandering telt pas als de nieuwe prijs minstens twee maanden gelijk blijft; een korting van een maand telt dus niet.
  var PZ_MIN_ITEMS = 5, PZ_CHANGE = 0.05, PZ_BASE = 3, PZ_NEW = 2, PZ_STABLE_BASE = 0.03, PZ_STABLE_NEW = 0.025, PZ_MAX_EVENTS = 8, PZ_TOP = 15;
  function pzIdx(ym) { return parseInt(ym.slice(0, 4), 10) * 12 + parseInt(ym.slice(5), 10) - 1; }
  function pzMedian(a) { var s = a.slice().sort(function (x, y) { return x - y; }), n = s.length; return n % 2 ? s[(n - 1) / 2] : (s[n / 2 - 1] + s[n / 2]) / 2; }
  // rows: [{ym, price, items}] op volgorde van maand; geeft de gevonden veranderingen [{ym, from, to, change, before, after}]
  function priceEvents(rows) {
    var out = [], skip = 0;
    for (var t = PZ_BASE; t + PZ_NEW <= rows.length; t++) {
      if (t < skip) continue;
      var win = rows.slice(t - PZ_BASE, t + PZ_NEW), ok = true, i;
      for (i = 1; i < win.length; i++) if (pzIdx(win[i].ym) - pzIdx(win[i - 1].ym) !== 1) ok = false;       // alleen aaneengesloten maanden
      if (!ok) continue;
      var base = win.slice(0, PZ_BASE), nw = win.slice(PZ_BASE), pb = pzMedian(base.map(function (r) { return r.price; })), pn = pzMedian(nw.map(function (r) { return r.price; }));
      if (!(pb > 0) || !(pn > 0)) continue;
      var stable = base.every(function (r) { return Math.abs(r.price / pb - 1) <= PZ_STABLE_BASE; }) && nw.every(function (r) { return Math.abs(r.price / pn - 1) <= PZ_STABLE_NEW; });
      var ch = pn / pb - 1;
      if (!stable || Math.abs(ch) < PZ_CHANGE) continue;
      out.push({ ym: rows[t].ym, from: pb, to: pn, change: ch, before: seasonMean(base.map(function (r) { return r.items; })), after: seasonMean(nw.map(function (r) { return r.items; })) });
      skip = t + PZ_BASE;                                                                                    // geen tweede melding voor dezelfde verandering
    }
    return out;
  }
  function pzAgg(months) {
    var out = {};
    months.forEach(function (ym) { var l = D.shop_lines[ym]; for (var n in l) { var o = out[n] = out[n] || { items: 0, rev: 0 }; o.items += l[n][0]; o.rev += l[n][1]; } });
    return out;
  }
  function shopPrices(content, k) {
    content.appendChild(note(U.pz_intro));
    var al = alignedWith(k, D.shop_lines);
    if (!al.a.length) { content.appendChild(el("p", "muted", U.sh_no_data)); return; }
    var A = pzAgg(al.a), B = al.b ? pzAgg(al.b) : null, p1 = function (x) { return eur(x); };
    var names = Object.keys(A).filter(function (n) { return A[n].items > 0; }).sort(function (x, y) { return A[y].rev - A[x].rev; }).slice(0, PZ_TOP);
    // veranderingen over alle maanden in het archief
    var series = {}, tot = {};
    Object.keys(D.shop_lines).sort().forEach(function (ym) {
      var l = D.shop_lines[ym]; for (var n in l) if (l[n][0] >= PZ_MIN_ITEMS) { (series[n] = series[n] || []).push({ ym: ym, price: l[n][1] / l[n][0], items: l[n][0] }); tot[n] = (tot[n] || 0) + l[n][1]; }
    });
    var events = [];
    Object.keys(series).sort(function (x, y) { return tot[y] - tot[x]; }).slice(0, PZ_TOP).forEach(function (n) { priceEvents(series[n]).forEach(function (e) { e.name = n; events.push(e); }); });
    events.sort(function (x, y) { return x.ym < y.ym ? 1 : x.ym > y.ym ? -1 : 0; });
    var fc = el("section", "card"); fc.appendChild(panelHead(U.pz_h_events)); content.appendChild(fc);
    if (events.length) {
      var ul = el("ul");
      events.slice(0, PZ_MAX_EVENTS).forEach(function (e) {
        ul.appendChild(el("li", null, U.pz_flag.replace("{p}", function () { return e.name; }).replace("{m}", mname(e.ym)).replace("{a}", p1(e.from)).replace("{b}", p1(e.to)).replace("{x}", sgn(e.change * 100))
          .replace("{n1}", n0(e.before)).replace("{n2}", n0(e.after)).replace("{y}", sgn((e.after / e.before - 1) * 100))));
      });
      fc.appendChild(ul);
    } else fc.appendChild(el("p", "muted", U.pz_no_events));
    fc.appendChild(note(U.pz_note));
    var tc = el("section", "card"); tc.appendChild(panelHead(U.pz_h_table)); content.appendChild(tc);
    var price = function (o) { return o && o.items ? o.rev / o.items : null; };
    tc.appendChild(pickTable(B ? U.pz_th_cmp : U.pz_th, names.map(function (n) {
      var a = price(A[n]), b = B ? price(B[n]) : null;
      var cells = [n, eur(a)];
      if (B) cells.push(b === null ? U.none : eur(b), b === null ? U.none : sgn((a / b - 1) * 100));
      cells.push(n0(A[n].items)); if (B) cells.push(B[n] ? n0(B[n].items) : U.none);
      return { key: n, cells: cells };
    }), null));
    tc.appendChild(note(U.pz_table_note));
  }
