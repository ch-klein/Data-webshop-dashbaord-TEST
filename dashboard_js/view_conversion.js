// dashboard_js/view_conversion.js: Weergave Conversie.
// Alle onderdelen worden bij het bouwen achter elkaar gezet in een functie-omgeving (zie dashboard.read_js()); de volgorde staat in JS_PARTS.

  // ---------- weergave: Conversie ----------
  function rate(c, s) { return s ? c / s * 100 : 0; }
  function ppTxt(x) { return (x >= 0 ? "+" : "\u2212") + Math.abs(x).toLocaleString(LOC, { minimumFractionDigits: 2, maximumFractionDigits: 2 }); }
  // oordeel over het verschil in conversiepercentage (tweeproportietoets, z >= 3); alleen met genoeg gegevens
  function verdict(cA, sA, cB, sB) {
    if (cA + cB < 20 || sA < 100 || sB < 100) return "v_little";
    var p = (cA + cB) / (sA + sB), se = Math.sqrt(p * (1 - p) * (1 / sA + 1 / sB));
    var z = se ? (cA / sA - cB / sB) / se : 0;
    return Math.abs(z) >= 3 ? "v_clear" : "v_chance";
  }
  function convValue(metric) {
    return function (ym) {
      var m = byYm[ym]; if (!m) return null;
      if (metric === "c") return m.c;
      if (metric === "cr") return rate(m.c, m.s);
      if (metric === "r") return m.r;
      if (metric === "aov") return m.c ? m.r / m.c : 0;
      if (metric === "rps") return m.s ? m.r / m.s : 0;
      return m.s;
    };
  }
  function convFmt(metric) {
    return metric === "cr" ? function (v) { return pct(v, 2); } : (metric === "r" || metric === "aov") ? eur : metric === "rps" ? eur2 : n0;
  }
  // tabel per kanaal of apparaat: kolommen sessies, conversies, percentage, vergeleken, verschil in procentpunt, oordeel (en omzet)
  function convItems(title, head, A, B, nameOf, withRev) {
    var card = el("section", "card"); card.appendChild(panelHead(title));
    var names = Object.keys(A).sort(function (x, y) { return A[y][0] - A[x][0]; });
    var rows = names.map(function (n) {
      var a = A[n], b = B ? B[n] : null, ra = rate(a[1], a[0]), cells = [nameOf(n), n0(a[0]), n0(a[1]), pct(ra, 2)];
      if (B) {
        var rb = b ? rate(b[1], b[0]) : null;
        cells.push(rb === null ? U.none : pct(rb, 2), rb === null ? U.none : ppTxt(ra - rb), { t: b ? U[verdict(a[1], a[0], b[1], b[0])] : U.none, cls: "txt" });
      } else cells.push(U.none, U.none, { t: U.none, cls: "txt" });
      if (withRev) cells.push(eur(a[2] || 0));
      return { key: n, cells: cells };
    });
    if (isNeon()) {                                      // Donker: een meter per groep met het conversiepercentage (het midden is gelijk aan de vergelijking, zonder vergelijking gelijk aan het gemiddelde)
      var tS = 0, tC = 0; names.forEach(function (n) { tS += A[n][0]; tC += A[n][1]; });
      card.appendChild(neonRow(names.slice(0, 6).map(function (n) {
        var a = A[n], ra = rate(a[1], a[0]), b = B ? B[n] : null, rb = b ? rate(b[1], b[0]) : null, fill, sub;
        if (rb !== null) { var dd = rb ? (ra - rb) / rb * 100 : 0; fill = 50 + Math.max(-50, Math.min(50, dd / 2)); sub = ppTxt(ra - rb) + " pp"; }
        else { var avg = rate(tC, tS); fill = avg ? Math.min(100, ra / avg * 50) : 0; sub = U.none; }
        return { label: nameOf(n), fill: fill, center: pct(ra, 2), sub: sub };
      })));
    }
    var w = pickTable(head, rows, null); card.appendChild(w); return card;
  }
  function renderConversion(content) {
    var k = ctx();
    content.appendChild(notes(k));
    if (!k.A.s) { content.appendChild(el("p", "muted", U.no_data)); return; }
    var A = k.A, B = k.B, crA = rate(A.c, A.s), crB = B ? rate(B.c, B.s) : null;

    // kerncijfers
    var kc = el("section", "card"); kc.appendChild(panelHead(U.h_conv_kpi));
    var wrap = el("div", "kpis"), list = [[U.kpi.conversions, A.c, B && B.c, n0], [U.kpi.conv_rate, crA, crB, function (x) { return pct(x, 2); }]];
    if (HASREV) {
      list.push([U.kpi.revenue, A.r, B && B.r, eur]);
      if (A.c > 0) list.push([U.kpi.aov, A.r / A.c, B && B.c > 0 ? B.r / B.c : null, eur]);
      if (A.s > 0) list.push([U.kpi.rps, A.r / A.s, B && B.s > 0 ? B.r / B.s : null, eur2]);
    }
    list.forEach(function (row) {
      var card = el("div", "kpi"); card.appendChild(el("div", "l", row[0])); card.appendChild(el("div", "v", row[3](row[1])));
      if (k.c && row[2] !== null && row[2] !== undefined) {
        var d = dlt(row[1], row[2]), line = el("div", "d " + cls(d));
        line.appendChild(el("b", null, sgn(d))); line.appendChild(document.createTextNode(" " + U.vs + " " + k.c.label)); card.appendChild(line);
      }
      addIcon(card, row[0]); wrap.appendChild(card);
    });
    if (isNeon()) {
      var goalOf = {}; goalOf[U.kpi.conversions] = "conversions"; goalOf[U.kpi.revenue] = "revenue";
      wrap = neonRow(list.map(function (row) { return compareItem(k, row[0], row[1], row[2], row[3], goalOf[row[0]]); }));
    }
    kc.appendChild(wrap);
    if (B) kc.appendChild(note(U.verdict_line.replace("{v}", U[verdict(A.c, A.s, B.c, B.s)])));
    kc.appendChild(note(U.verdict_hint)); kc.appendChild(note(U.conv_note));
    content.appendChild(kc);

    // verloop per maand
    var ch = el("section", "card"); ch.appendChild(panelHead(U.h_conv_chart));
    var opts = [["c", U.kpi.conversions], ["cr", U.kpi.conv_rate]];
    if (HASREV) opts.push(["r", U.kpi.revenue], ["aov", U.m_aov], ["rps", U.m_rps]);
    var bar = el("div", "controls"), lab = el("label", "field"); lab.appendChild(el("span", null, U.metric));
    var sel = el("select"); sel.id = "conv-metric"; opts.forEach(function (o) { var op = el("option", null, o[1]); op.value = o[0]; sel.appendChild(op); });
    var cm = hashParams().m; sel.value = opts.some(function (o) { return o[0] === cm; }) ? cm : "cr";
    var holder = el("div"); function draw() { holder.textContent = ""; holder.appendChild(monthChart(k, sel.value, convValue(sel.value), convFmt(sel.value), U.h_conv_chart)); post(); }
    sel.addEventListener("change", draw); lab.appendChild(sel); bar.appendChild(lab); ch.firstChild.querySelector('.tools').insertBefore(bar, ch.firstChild.querySelector('.xbtn')); ch.appendChild(holder); content.appendChild(ch); draw();

    // per maand binnen de periode
    var mc = el("section", "card"); mc.appendChild(panelHead(U.h_conv_months));
    var rows = [];
    k.p.months.forEach(function (ym, i) {
      var m = byYm[ym]; if (!m) return;
      var cmpYm = k.c ? k.c.months[i] : null, cm2 = cmpYm ? byYm[cmpYm] : null;
      rows.push({ key: ym, cells: [mname(ym), n0(m.s), n0(m.c), pct(rate(m.c, m.s), 2), cm2 ? pct(rate(cm2.c, cm2.s), 2) : U.none, HASREV ? eur(m.r) : U.none] });
    });
    rows.push({ total: true, key: "", cells: [U.total || "", n0(A.s), n0(A.c), pct(crA, 2), B ? pct(crB, 2) : U.none, HASREV ? eur(A.r) : U.none] });
    mc.appendChild(pickTable(U.th_conv_months, rows, null)); content.appendChild(mc);

    // per kanaal
    var both = {}; Object.keys(D.channels || {}).forEach(function (ym) { if (D.channel_stats && D.channel_stats[ym]) both[ym] = 1; });
    var al = alignedWith(k, both);
    if (al.a.length) {
      var grab = function (months) {
        var out = {};
        months.forEach(function (ym) {
          var s = D.channels[ym], c = D.channel_stats[ym];
          for (var n in s) { var o = out[n] = out[n] || [0, 0, 0]; o[0] += s[n]; if (c[n]) { o[1] += c[n][0]; o[2] += c[n][1]; } }
        });
        return out;
      };
      var card3 = convItems(U.h_conv_channels, HASREV ? U.th_conv_channels : U.th_conv_channels.slice(0, -1), grab(al.a), al.b ? grab(al.b) : null, function (n) { return n; }, HASREV);
      if (al.have < al.of) card3.insertBefore(note(U.conv_parts.replace("{n}", al.have).replace("{t}", al.of)), card3.children[1]);
      content.appendChild(card3);
    }
    // per apparaat
    if (D.devices) {
      var ad = alignedWith(k, D.devices);
      if (ad.a.length) {
        var dn = function (n) { return U.device_names ? (U.device_names[n] || n) : n; };
        var dsum = function (months) {
          var out = {}; months.forEach(function (ym) { var d = D.devices[ym]; for (var n in d) { var o = out[n] = out[n] || [0, 0, 0]; o[0] += d[n][0]; o[1] += d[n][1]; o[2] += d[n][2] || 0; } }); return out;
        };
        var head = U.th_conv_devices, card4 = convItems(U.h_conv_devices, head, dsum(ad.a), ad.b ? dsum(ad.b) : null, dn, false);
        if (ad.have < ad.of) card4.insertBefore(note(U.conv_parts.replace("{n}", ad.have).replace("{t}", ad.of)), card4.children[1]);
        content.appendChild(card4);
      }
    }
  }
  VIEWS.push({ id: "conversion", icon: "conversion", label: "n_conversion", render: renderConversion });

