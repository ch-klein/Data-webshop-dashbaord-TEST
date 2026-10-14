// dashboard_js/view_analytics.js: Weergave Analytics (kanalen en apparaten).
// Alle onderdelen worden bij het bouwen achter elkaar gezet in een functie-omgeving (zie dashboard.read_js()); de volgorde staat in JS_PARTS.

  // ---------- weergave: Analytics (kanalen en apparaten) ----------
  function renderAnalytics(content) {
    var k = ctx();
    content.appendChild(notes(k));
    if (!k.A.s) { content.appendChild(el("p", "muted", U.no_data)); return; }

    // ----- kanalen -----
    var ch = alignedWith(k, D.channels || {}), cs = D.channel_stats || {};
    var card = el("section", "card"); card.appendChild(panelHead(U.h_channels));
    if (!ch.a.length) card.appendChild(el("p", "muted", U.no_parts));
    else {
      if (ch.have < ch.of) card.appendChild(note(U.parts_note.replace("{n}", ch.have).replace("{t}", ch.of)));
      var A = sumBy(ch.a, function (ym) { var o = {}, d = D.channels[ym]; for (var n in d) o[n] = [d[n]]; return o; });
      var B = ch.b ? sumBy(ch.b, function (ym) { var o = {}, d = D.channels[ym]; for (var n in d) o[n] = [d[n]]; return o; }) : null;
      var CA = sumBy(ch.a, function (ym) { return cs[ym]; });
      var totA = 0, totB = 0, convA = 0, revA = 0;
      Object.keys(A).forEach(function (n) { totA += A[n][0]; }); if (B) Object.keys(B).forEach(function (n) { totB += B[n][0]; });
      var names = Object.keys(A).concat(B ? Object.keys(B) : []).filter(function (n, i, arr) { return arr.indexOf(n) === i; })
        .sort(function (x, y) { return (A[y] ? A[y][0] : 0) - (A[x] ? A[x][0] : 0); });
      var rows = names.map(function (n) {
        var a = A[n] ? A[n][0] : 0, b = B ? (B[n] ? B[n][0] : 0) : null, d = b === null ? null : dlt(a, b), c = CA[n];
        if (c) { convA += c[0]; revA += c[1]; }
        return { key: n, cells: [n, n0(a), pct(totA ? a / totA * 100 : 0, 0), { t: sgn(d), cls: "num " + cls(d) }, c ? n0(c[0]) : U.none, c && HASREV ? eur(c[1]) : U.none] };
      });
      var totD = B ? dlt(totA, totB) : null;
      rows.push({ total: true, key: "", cells: [U.total, n0(totA), pct(100, 0), { t: sgn(totD), cls: "num " + cls(totD) }, Object.keys(CA).length ? n0(convA) : U.none, Object.keys(CA).length && HASREV ? eur(revA) : U.none] });
      var detail = el("div");
      card.appendChild(note(U.channel_hint));
      card.appendChild(pickTable(U.th_channel, rows, function (key, tr) {
        Array.prototype.forEach.call(card.querySelectorAll("tr.pick.on"), function (x) { x.classList.remove("on"); }); tr.classList.add("on");
        trendDetail(detail, k, U.h_item_trend.replace("{name}", key), function (ym) { var d = D.channels[ym]; return d ? (d[key] || 0) : null; }, n0);
      }));
      card.appendChild(detail);
      openItem(card, S.item);
      shareBlock(card, k, { id: "ch-share", nameOf: function (n) { return n; }, top: 5, metrics: groupMetrics(!!D.channel_stats), store: function (key) {
        if (key === "s") return D.channels;
        var o = {}; Object.keys(D.channel_stats).forEach(function (ym) { o[ym] = {}; for (var n in D.channel_stats[ym]) o[ym][n] = D.channel_stats[ym][n][key === "c" ? 0 : 1]; }); return o;
      } });
    }
    content.appendChild(card);

    // ----- apparaten -----
    if (D.devices) {
      var dv = alignedWith(k, D.devices), card2 = el("section", "card"); card2.appendChild(panelHead(U.h_devices));
      if (!dv.a.length) card2.appendChild(el("p", "muted", U.no_parts));
      else {
        if (dv.have < dv.of) card2.appendChild(note(U.parts_note.replace("{n}", dv.have).replace("{t}", dv.of)));
        var DA = sumBy(dv.a, function (ym) { return D.devices[ym]; }), DB = dv.b ? sumBy(dv.b, function (ym) { return D.devices[ym]; }) : null;
        var ta = 0, tb = 0; Object.keys(DA).forEach(function (n) { ta += DA[n][0]; }); if (DB) Object.keys(DB).forEach(function (n) { tb += DB[n][0]; });
        var dn = function (n) { return U.device_names[n] || n; };
        var dnames = Object.keys(DA).sort(function (x, y) { return DA[y][0] - DA[x][0]; });
        var drows = dnames.map(function (n) {
          var cmpShare = DB && DB[n] && tb ? pct(DB[n][0] / tb * 100, 0) : U.none;
          return { key: n, cells: [dn(n), n0(DA[n][0]), pct(ta ? DA[n][0] / ta * 100 : 0, 0), cmpShare, pct(DA[n][0] ? DA[n][1] / DA[n][0] * 100 : 0, 2)] };
        });
        var detail2 = el("div");
        card2.appendChild(note(U.channel_hint));
        card2.appendChild(pickTable(U.th_device, drows, function (key, tr) {
          Array.prototype.forEach.call(card2.querySelectorAll("tr.pick.on"), function (x) { x.classList.remove("on"); }); tr.classList.add("on");
          trendDetail(detail2, k, U.h_item_trend.replace("{name}", dn(key)), function (ym) { var d = D.devices[ym]; return d ? (d[key] ? d[key][0] : 0) : null; }, n0);
        }));
        card2.appendChild(detail2);
        openItem(card2, S.item);
        shareBlock(card2, k, { id: "dv-share", nameOf: dn, top: 3, metrics: groupMetrics(true), store: function (key) {
          var idx = key === "s" ? 0 : (key === "c" ? 1 : 2), o = {};
          Object.keys(D.devices).forEach(function (ym) { o[ym] = {}; for (var n in D.devices[ym]) o[ym][n] = D.devices[ym][n][idx]; }); return o;
        } });
      }
      content.appendChild(card2);
    }
  }
  VIEWS.push({ id: "analytics", icon: "analytics", label: "n_analytics", render: renderAnalytics });

