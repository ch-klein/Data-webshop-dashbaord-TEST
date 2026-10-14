// dashboard_js/view_forecast.js: Weergave Verwachting.
// Alle onderdelen worden bij het bouwen achter elkaar gezet in een functie-omgeving (zie dashboard.read_js()); de volgorde staat in JS_PARTS.

  // ---------- weergave: Verwachting (max) ----------
  function renderForecast(content) {
    var f = D.forecast, fmt = { sessions: n0, conversions: n0, revenue: eur };
    var card = el("section", "card"); card.appendChild(panelHead(U.fc_h.replace("{m}", mname(f.target)))); content.appendChild(card);
    if (isNeon()) {                                      // Donker: een meter per meetwaarde, het midden is gelijk aan deze maand
      card.appendChild(neonRow(f.rows.map(function (r) {
        var dd = r.last ? (r.pred - r.last) / r.last * 100 : 0;
        return { label: f.ui.metric[r.metric], fill: 50 + Math.max(-50, Math.min(50, dd / 2)), center: fmt[r.metric](r.pred), sub: sgn1(dd) + " " + U.nx_vs_now };
      })));
    }
    card.appendChild(pickTable(f.ui.th_fc, f.rows.map(function (r) {
      return { key: r.metric, cells: [f.ui.metric[r.metric], fmt[r.metric](r.last), { t: fmt[r.metric](r.pred), cls: "num strong" }, fmt[r.metric](r.lo) + " – " + fmt[r.metric](r.hi), { t: f.ui.method[r.method], cls: "txt" }] };
    }), null));
    // grafiek: sessies per maand + de verwachting met marge
    var sess = f.rows.filter(function (r) { return r.metric === "sessions"; })[0];
    if (sess) {
      var list = HAVE.slice(-24), vals = list.map(function (ym) { return byYm[ym].s; });
      var top = Math.max.apply(null, vals.concat([sess.hi, 1])), W = 640, H = 190, pad = 22, slot = (W - 10) / (list.length + 1);
      var g = svg("svg", { viewBox: "0 0 " + W + " " + H, width: "100%", role: "img", "aria-label": U.fc_chart });
      var Y = function (v) { return H - pad - v / top * (H - pad - 16); };
      list.forEach(function (ym, i) {
        var r = svg("rect", { x: 5 + i * slot + slot * 0.12, y: Y(vals[i]), width: slot * 0.76, height: Math.max(H - pad - Y(vals[i]), 1), rx: 2, "class": "bar" });
        var t = svg("title", {}); t.textContent = mname(ym) + ": " + n0(vals[i]); r.appendChild(t); g.appendChild(r);
        if (i % 3 === 0 || ym.slice(5) === "01") { var tx = svg("text", { x: 5 + i * slot + slot / 2, y: H - 6, "text-anchor": "middle", "class": "axis" }); tx.textContent = mshort(ym) + " " + ym.slice(2, 4); g.appendChild(tx); }
      });
      var xi = list.length, cx = 5 + xi * slot + slot / 2;
      var fr = svg("rect", { x: 5 + xi * slot + slot * 0.12, y: Y(sess.pred), width: slot * 0.76, height: Math.max(H - pad - Y(sess.pred), 1), rx: 2, "class": "bar fc" });
      var ft = svg("title", {}); ft.textContent = mname(f.target) + ": " + n0(sess.pred) + " (" + n0(sess.lo) + " – " + n0(sess.hi) + ")"; fr.appendChild(ft); g.appendChild(fr);
      g.appendChild(svg("line", { x1: cx, x2: cx, y1: Y(sess.hi), y2: Y(sess.lo), "class": "whisker" }));
      [sess.hi, sess.lo].forEach(function (v) { g.appendChild(svg("line", { x1: cx - 6, x2: cx + 6, y1: Y(v), y2: Y(v), "class": "whisker" })); });
      var tx2 = svg("text", { x: cx, y: H - 6, "text-anchor": "middle", "class": "axis" }); tx2.textContent = mshort(f.target); g.appendChild(tx2);
      var mx = svg("text", { x: 4, y: 12, "class": "axis" }); mx.textContent = "max " + n0(top); g.appendChild(mx);
      var box = el("div", "chart"); box.appendChild(g);
      var lg = el("div", "legend");
      [["sw", U.legend_other], ["sw fc", U.fc_label], ["sw wh", U.fc_range]].forEach(function (x) { var i = el("span", "lg"); i.appendChild(el("i", x[0])); i.appendChild(document.createTextNode(" " + x[1])); lg.appendChild(i); });
      box.appendChild(lg); card.appendChild(box);
    }
    var sc = el("section", "card"); sc.appendChild(panelHead(f.ui.h_score)); content.appendChild(sc);
    sc.appendChild(pickTable(f.ui.th_score, f.score.map(function (x) {
      var key = x.inside === null ? "na" : (x.inside ? "yes" : "no");
      return { key: x.target, cells: [mname(x.target), n0(x.pred), x.lo === null ? U.none : n0(x.lo) + " – " + n0(x.hi), n0(x.actual),
                { t: (x.err >= 0 ? "+" : "−") + pct(Math.abs(x.err) * 100, 0), cls: "num" }, { t: f.ui.inside[key], cls: "num " + (key === "yes" ? "pos" : key === "no" ? "neg" : "") },
                { t: f.ui.origin[x.origin], cls: "txt" }] };
    }), null));
    if (f.sentences && f.sentences.length) { var ul = el("ul"); f.sentences.forEach(function (s) { ul.appendChild(el("li", null, s)); }); sc.appendChild(ul); }
    f.notes.forEach(function (n) { sc.appendChild(note(n.replace(/<[^>]+>/g, ""))); });
  }
  VIEWS.push({ id: "forecast", label: "n_forecast", icon: "forecast", render: renderForecast, needs: function () { return !!D.forecast; } });



