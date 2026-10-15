// dashboard_js/view_shop4.js: Webshop, tab Seizoen (duurste abonnement).
// Alle onderdelen worden bij het bouwen achter elkaar gezet in een functie-omgeving (zie dashboard.read_js()); de volgorde staat in JS_PARTS.

  // ---------- weergave: Webshop, Seizoen ----------
  // Wanneer verkoopt wat: per kalendermaand hoeveel er gemiddeld wordt verkocht tegenover een gemiddelde maand (1,0 = gemiddeld), over alle maanden in het archief.
  // Het zegt wat er in het verleden gebeurde en voorspelt niets.
  var SEASON_MIN_MONTHS = 24, SEASON_PRODUCT_MONTHS = 18, SEASON_PEAK = 1.5, SEASON_YEAR = 1.2, SEASON_MIN_ITEMS = 100, SEASON_TOP = 10;
  function seasonMean(a) { return a.reduce(function (s, x) { return s + x; }, 0) / a.length; }
  // series: {ym: waarde}. Geeft {idx: [12 x index of null], n: [12 x aantal waarnemingen], peak: {m, idx, n} of null, total, months}
  function seasonOf(series, minTotal) {
    var by = [], perYear = {}, all = [], i;
    for (i = 0; i < 12; i++) by.push([]);
    Object.keys(series).forEach(function (ym) {
      var v = series[ym], m = parseInt(ym.slice(5), 10) - 1, y = ym.slice(0, 4);
      by[m].push({ y: y, v: v }); all.push(v); (perYear[y] = perYear[y] || []).push(v);
    });
    var total = all.reduce(function (s, x) { return s + x; }, 0), avg = all.length ? total / all.length : 0;
    if (!all.length || !(avg > 0)) return null;
    var idx = by.map(function (o) { return o.length ? seasonMean(o.map(function (x) { return x.v; })) / avg : null; });
    var peak = null;
    idx.forEach(function (x, m) {
      if (x === null || by[m].length < 2 || x < SEASON_PEAK || total < minTotal || (peak && x <= peak.idx)) return;
      var checked = by[m].filter(function (o) { return perYear[o.y].length >= 6; });                       // alleen jaren met minstens zes maanden gegevens
      if (checked.length >= 2 && checked.every(function (o) { return o.v >= SEASON_YEAR * seasonMean(perYear[o.y]); })) peak = { m: m, idx: x, n: checked.length };
    });
    return { idx: idx, n: by.map(function (o) { return o.length; }), peak: peak, total: total, months: all.length };
  }
  function seasonRows() {
    var rows = [];
    if (D.shop) {
      var o = {}; Object.keys(D.shop).forEach(function (ym) { o[ym] = D.shop[ym].orders; });
      var s0 = seasonOf(o, 2 * SEASON_MIN_ITEMS); if (s0) rows.push({ name: U.sn_all, s: s0 });
    }
    var items = {}, tot = {};
    Object.keys(D.shop_lines || {}).sort().forEach(function (ym) {
      var l = D.shop_lines[ym]; for (var n in l) { (items[n] = items[n] || {})[ym] = l[n][0]; tot[n] = (tot[n] || 0) + l[n][0]; }
    });
    Object.keys(items).filter(function (n) { return Object.keys(items[n]).length >= SEASON_PRODUCT_MONTHS; })
      .sort(function (a, b) { return tot[b] - tot[a]; }).slice(0, SEASON_TOP).forEach(function (n) {
        var s = seasonOf(items[n], SEASON_MIN_ITEMS); if (s) rows.push({ name: n, s: s });
      });
    return rows;
  }
  function shopSeason(content, k) {
    content.appendChild(note(U.sn_intro));
    var months = Object.keys(D.shop_lines || D.shop || {}).length;
    if (months < SEASON_MIN_MONTHS) { content.appendChild(el("p", "muted", U.sn_few.replace("{n}", months))); return; }
    var rows = seasonRows();
    if (!rows.length) { content.appendChild(el("p", "muted", U.sh_no_data)); return; }
    var fc = el("section", "card"); fc.appendChild(panelHead(U.sn_h_flags));
    var flags = rows.filter(function (r) { return r.s.peak; }).map(function (r) {
      var p = r.s.peak;
      return U.sn_flag.replace("{p}", function () { return r.name; }).replace("{m}", D.month_names[p.m]).replace("{x}", p.idx.toLocaleString(LOC, { minimumFractionDigits: 1, maximumFractionDigits: 1 })).replace("{n}", p.n);
    });
    if (flags.length) { var ul = el("ul"); flags.forEach(function (f) { ul.appendChild(el("li", null, f)); }); fc.appendChild(ul); } else fc.appendChild(el("p", "muted", U.sn_no_flags));
    fc.appendChild(note(U.sn_flag_note)); content.appendChild(fc);
    var tc = el("section", "card"); tc.appendChild(panelHead(U.sn_h_table));
    var head = [U.sn_th_first]; for (var i = 1; i <= 12; i++) head.push(mshort("2001-" + (i < 10 ? "0" : "") + i));
    tc.appendChild(pickTable(head, rows.map(function (r) {
      return { key: r.name, cells: [r.name].concat(r.s.idx.map(function (x) { return x === null ? U.none : { t: x.toLocaleString(LOC, { minimumFractionDigits: 1, maximumFractionDigits: 1 }), cls: x >= SEASON_PEAK ? "num strong" : "num" }; })) };
    }), null));
    tc.appendChild(note(U.sn_note)); content.appendChild(tc);
  }

  // ---------- weergave: Webshop, Winst: rendement per advertentiekanaal tegenover break-even ----------
  // Break-even rendement = 1 / marge: de omzet per euro advertentie die nodig is om inkoop en advertentie te dekken. De marge is de gemiddelde brutomarge van de hele shop in de gekozen periode
  // (per kanaal kan die verschillen); omzet en bestellingen per kanaal komen uit Analytics.
  var CH_MIN_COST = 100, CH_MIN_CONV = 10;
  function chFmt1(x) { return x.toLocaleString(LOC, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "\u00d7"; }
  function shopChannels(content, al, mg) {
    if (!D.ads || !D.channel_stats || !(mg > 0)) return;
    var cost = {}, rev = {}, conv = {}, be = 1 / mg;
    al.a.forEach(function (ym) {
      var a = D.ads[ym] ? D.ads[ym].c : {}, cs = D.channel_stats[ym] || {};
      for (var ch in a) { cost[ch] = (cost[ch] || 0) + a[ch][0]; rev[ch] = (rev[ch] || 0) + (cs[ch] ? cs[ch][1] : 0); conv[ch] = (conv[ch] || 0) + (cs[ch] ? cs[ch][0] : 0); }
    });
    var chans = Object.keys(cost).filter(function (c) { return cost[c] > 0; }).sort(function (x, y) { return cost[y] - cost[x]; });
    if (!chans.length) return;
    var card = el("section", "card"); card.appendChild(panelHead(U.pr_h_channels)); content.appendChild(card);
    var below = [], none = [];
    card.appendChild(pickTable(U.pr_ch_th, chans.map(function (ch) {
      var roas = rev[ch] / cost[ch], net = rev[ch] * mg - cost[ch], status;
      if (!conv[ch] && !rev[ch]) { status = U.pr_ch_none; if (cost[ch] >= CH_MIN_COST) none.push(ch); }
      else if (roas >= be) status = U.pr_ch_above;
      else { status = U.pr_ch_below; if (cost[ch] >= CH_MIN_COST && conv[ch] >= CH_MIN_CONV) below.push({ c: ch, roas: roas, cost: cost[ch] }); }
      return { key: ch, cells: [ch, eur(cost[ch]), eur(rev[ch]), chFmt1(roas), chFmt1(be), conv[ch] ? eur(cost[ch] / conv[ch]) : U.none, conv[ch] ? eur(rev[ch] / conv[ch] * mg) : U.none,
                                { t: (net >= 0 ? "" : "\u2212") + eur(Math.abs(net)), cls: "num " + (net >= 0 ? "pos" : "neg") }, { t: status, cls: "txt" }] };
    }), null));
    var flags = below.map(function (b) { return U.pr_ch_flag.replace("{c}", function () { return b.c; }).replace("{r}", chFmt1(b.roas)).replace("{b}", chFmt1(be)).replace("{k}", eur(b.cost)); })
      .concat(none.map(function (c) { return U.pr_ch_flag0.replace("{c}", function () { return c; }).replace("{k}", eur(cost[c])); }));
    card.appendChild(el("h3", null, U.pr_h_ch_flags));
    if (flags.length) { var ul = el("ul"); flags.forEach(function (f) { ul.appendChild(el("li", null, f)); }); card.appendChild(ul); } else card.appendChild(el("p", "muted", U.pr_ch_no_flags));
    // per maand: de advertentiekosten en de omzet uit Analytics van de betaalde kanalen
    var months = al.a.filter(function (ym) { return D.ads[ym] && D.ads[ym].t[0] > 0; });
    if (months.length > 1) {
      card.appendChild(el("h3", null, U.pr_h_ch_months));
      card.appendChild(pickTable(U.pr_ch_months_th, months.map(function (ym) {
        var c = D.ads[ym].t[0], cs = D.channel_stats[ym] || {}, r = 0; for (var ch in D.ads[ym].c) r += cs[ch] ? cs[ch][1] : 0;
        var ro = r / c;
        return { key: ym, cells: [mname(ym), eur(c), eur(r), chFmt1(ro), { t: r === 0 ? U.pr_ch_none : ro >= be ? U.pr_ch_above : U.pr_ch_below, cls: "txt" }] };
      }), null));
    }
    card.appendChild(note(U.pr_ch_note));
    card.appendChild(note(U.pr_ch_flag_note));
  }
