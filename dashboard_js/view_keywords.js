// dashboard_js/view_keywords.js: Weergave Zoekwoorden.
// Alle onderdelen worden bij het bouwen achter elkaar gezet in een functie-omgeving (zie dashboard.read_js()); de volgorde staat in JS_PARTS.

  // ---------- weergave: Zoekwoorden ----------
  var KW_TABS = ["now", "past", "move", "chances", "season", "ideas", "lookup"];
  var STOP = { de: 1, het: 1, een: 1, in: 1, op: 1, van: 1, voor: 1, met: 1, en: 1, te: 1, the: 1, a: 1, of: 1, for: 1, and: 1, to: 1, on: 1 };
  // vaste lijst met 'intentiewoorden'; een woord telt pas als het ook echt in jullie eigen zoektermen voorkomt
  var MODS = {
    kopen: "after", bestellen: "after", goedkoop: "before", goedkope: "before", beste: "before", prijs: "after", prijzen: "after", kosten: "after",
    reparatie: "after", repareren: "after", onderhoud: "after", tips: "after", vergelijken: "after", vergelijking: "after", aanbieding: "after",
    aanbiedingen: "after", review: "after", reviews: "after", ervaringen: "after", online: "after", winkel: "after", webshop: "after", advies: "after",
    buy: "before", cheap: "before", best: "before", price: "after", prices: "after", cost: "after", repair: "after", maintenance: "after",
    compare: "before", comparison: "after", deals: "after", shop: "after", store: "after", advice: "after"
  };
  function tokens(term) { return String(term).toLowerCase().split(/[^\p{L}\p{N}]+/u).filter(function (t) { return t; }); }
  function termKey(term) { return tokens(term).sort().join(" "); }

  // zoektermen over een lijst maanden: {term: {k, i, pw}} met pw = positie gewogen naar vertoningen
  function qAgg(months) {
    var out = {};
    months.forEach(function (ym) {
      (D.queries[ym] || []).forEach(function (r) {
        var o = out[r[0]] = out[r[0]] || { k: 0, i: 0, pw: 0, pc: 0 };
        o.k += r[1]; o.i += r[3]; o.pw += r[2] * r[3]; o.pc += r[2] * r[1];
      });
    });
    return out;
  }
  function posOf(o) { return o.i > 0 ? o.pw / o.i : (o.k > 0 ? o.pc / o.k : 0); }
  function f1(x) { return x.toLocaleString(LOC, { minimumFractionDigits: 1, maximumFractionDigits: 1 }); }
  function openTerm(term) { S.kw = "lookup"; S.q = term; renderContent(); syncHash(); window.scrollTo && window.scrollTo(0, 0); }

  function kwSpark(term, endYm) {
    var months = []; for (var i = 11; i >= 0; i--) months.push(shift(endYm, -i));
    var vals = months.map(function (ym) { var r = (D.queries[ym] || []).filter(function (x) { return x[0] === term; })[0]; return D.queries[ym] ? (r ? r[1] : null) : undefined; });
    var present = vals.filter(function (v) { return v !== null && v !== undefined; }), top = Math.max.apply(null, present.concat([1]));
    var W = 110, H = 28, g = svg("svg", { viewBox: "0 0 " + W + " " + H, "class": "spark", role: "img", "aria-label": term }), seg = [];
    function flush() {
      if (seg.length > 1) g.appendChild(svg("polyline", { points: seg.join(" ") }));
      else if (seg.length === 1) { var p = seg[0].split(","); g.appendChild(svg("circle", { cx: p[0], cy: p[1], r: 2.2 })); }
      seg = [];
    }
    vals.forEach(function (v, i2) { if (v === null || v === undefined) { flush(); return; } seg.push((2 + i2 * (W - 4) / 11).toFixed(1) + "," + (H - 3 - v / top * (H - 8)).toFixed(1)); });
    flush();
    return g;
  }

  function kwNow(box, k, qa) {
    box.appendChild(panelHead(U.kw_now_h)); box.appendChild(note(U.kw_now_hint));
    var A = qAgg(qa.a), B = qa.b ? qAgg(qa.b) : null, names = Object.keys(A).sort(function (x, y) { return A[y].k - A[x].k; }).slice(0, 15);
    var endYm = qa.a[qa.a.length - 1];
    var rows = names.map(function (n) {
      var a = A[n], b = B ? B[n] : null, d = B ? (b ? dlt(a.k, b.k) : null) : null;
      var diff = !B ? U.none : (b ? { t: sgn(d), cls: "num " + cls(d) } : { t: U.kw_new, cls: "num new" });
      return { key: n, cells: [n, n0(a.k), n0(a.i), pct(a.i ? a.k / a.i * 100 : 0, 1), f1(posOf(a)), diff, { t: "", cls: "num", spark: kwSpark(n, endYm) }] };
    });
    var t = pickTable(U.kw_th, rows, function (key) { openTerm(key); });
    Array.prototype.forEach.call(t.querySelectorAll("tr.pick"), function (tr) { var c = tr.lastChild, i = rows.filter(function (r) { return r.key === tr.getAttribute("data-key"); })[0]; if (i) c.appendChild(i.cells[6].spark); });
    box.appendChild(t);
  }
  function kwPast(box) {
    box.appendChild(panelHead(U.kw_past_h)); box.appendChild(note(U.kw_past_hint));
    var all = {}, ms = Object.keys(D.queries).sort();
    ms.forEach(function (ym) { D.queries[ym].forEach(function (r) { var o = all[r[0]] = all[r[0]] || { k: 0, best: 0, bm: null, n: 0 }; o.k += r[1]; o.n++; if (r[1] > o.best) { o.best = r[1]; o.bm = ym; } }); });
    var names = Object.keys(all).sort(function (x, y) { return all[y].k - all[x].k; }).slice(0, 20);
    box.appendChild(pickTable(U.kw_past_th, names.map(function (n) {
      var o = all[n]; return { key: n, cells: [n, n0(o.k), mname(o.bm), n0(o.best), o.n + " / " + ms.length] };
    }), function (key) { openTerm(key); }));
  }
  function kwMove(box, k, qa) {
    box.appendChild(panelHead(U.kw_tabs.move)); box.appendChild(note(U.kw_move_hint));
    if (!qa.b) { box.appendChild(el("p", "muted", U.kw_need_cmp)); return; }
    var A = qAgg(qa.a), B = qAgg(qa.b), up = [], down = [];
    Object.keys(A).forEach(function (n) {
      var a = A[n].k, b = B[n] ? B[n].k : null; if (b === null) return;
      var diff = a - b;
      if (Math.max(a, b) < 20 || Math.abs(diff) < 20 || !b || Math.abs(diff) / b * 100 < 15 || Math.abs(diff) < 3.5 * Math.sqrt(a + b)) return;
      (diff > 0 ? up : down).push([n, a, b, diff]);
    });
    up.sort(function (x, y) { return y[3] - x[3]; }); down.sort(function (x, y) { return x[3] - y[3]; });
    if (!up.length && !down.length) { box.appendChild(el("p", "muted", U.kw_move_none)); return; }
    [[U.kw_move_up, up], [U.kw_move_down, down]].forEach(function (grp) {
      if (!grp[1].length) return;
      box.appendChild(el("h3", null, grp[0]));
      box.appendChild(pickTable(U.kw_move_th, grp[1].slice(0, 8).map(function (r) {
        var d = dlt(r[1], r[2]); return { key: r[0], cells: [r[0], n0(r[1]), n0(r[2]), { t: sgn(d), cls: "num " + cls(d) }] };
      }), function (key) { openTerm(key); }));
    });
  }
  function kwChances(box, k, qa) {
    var A = qAgg(qa.a), terms = Object.keys(A);
    // verwachte klikratio per positiegroep uit de eigen gegevens van de klant
    function bucket(p) { return p <= 3.5 ? 0 : p <= 7.5 ? 1 : p <= 10.5 ? 2 : p <= 20.5 ? 3 : 4; }
    var sums = [0, 1, 2, 3, 4].map(function () { return { k: 0, i: 0, n: 0 }; });
    terms.forEach(function (n) { var b = sums[bucket(posOf(A[n]))]; b.k += A[n].k; b.i += A[n].i; b.n++; });
    var aRows = [];
    terms.forEach(function (n) {
      var o = A[n], b = sums[bucket(posOf(o))];
      if (o.i < 200 || b.n < 5 || !b.i) return;
      var ctr = o.k / o.i, exp = b.k / b.i, extra = o.i * (exp - ctr);
      if (ctr < 0.6 * exp && extra >= 10) aRows.push([n, o.i, ctr, exp, extra]);
    });
    aRows.sort(function (x, y) { return y[4] - x[4]; });
    box.appendChild(panelHead(U.kw_chances_a)); box.appendChild(note(U.kw_chances_a_hint));
    if (!aRows.length) box.appendChild(el("p", "muted", U.kw_chances_none));
    else box.appendChild(pickTable(U.kw_chances_a_th, aRows.slice(0, 8).map(function (r) {
      return { key: r[0], cells: [r[0], n0(r[1]), pct(r[2] * 100, 1), pct(r[3] * 100, 1), n0(r[4])] };
    }), function (key) { openTerm(key); }));
    var bRows = terms.filter(function (n) { var p = posOf(A[n]); return A[n].i >= 200 && p > 10.5 && p <= 20.5; })
      .sort(function (x, y) { return A[y].i - A[x].i; }).slice(0, 8);
    box.appendChild(el("h3", null, U.kw_chances_b)); box.appendChild(note(U.kw_chances_b_hint));
    if (!bRows.length) box.appendChild(el("p", "muted", U.kw_chances_none));
    else box.appendChild(pickTable(U.kw_chances_b_th, bRows.map(function (n) { return { key: n, cells: [n, n0(A[n].i), n0(A[n].k), f1(posOf(A[n]))] }; }), function (key) { openTerm(key); }));
  }
  function kwSeason(box, k) {
    var last = k.al.a[k.al.a.length - 1], base = shift(last, -12), next = shift(base, 1);
    box.appendChild(panelHead(U.kw_season_h));
    box.appendChild(note(U.kw_season_hint.replace("{m1}", mname(base)).replace("{m2}", mname(next))));
    var qa = D.queries[base], qb = D.queries[next], rows = [];
    if (qa && qb) {
      var mb = {}; qb.forEach(function (r) { mb[r[0]] = r; });
      qa.forEach(function (r) {
        var n = mb[r[0]]; if (!n) return;
        var a = r[3], b = n[3];
        if (!a || Math.max(a, b) < 100 || b <= a) return;
        var g = (b - a) / a * 100; if (g < 30 || (b - a) < 3.5 * Math.sqrt(a + b)) return;
        rows.push([r[0], a, b, g]);
      });
    }
    rows.sort(function (x, y) { return (y[2] - y[1]) - (x[2] - x[1]); });
    if (!rows.length) box.appendChild(el("p", "muted", U.kw_season_none));
    else box.appendChild(pickTable(U.kw_season_th.map(function (h) { return h.replace("{m1}", mname(base)).replace("{m2}", mname(next)); }),
      rows.slice(0, 8).map(function (r) { return { key: r[0], cells: [r[0], n0(r[1]), n0(r[2]), { t: "+" + pct(r[3], 0), cls: "num pos" }] }; }), function (key) { openTerm(key); }));
    box.appendChild(note(U.kw_season_note));
  }
  function kwIdeas(box) {
    box.appendChild(panelHead(U.kw_ideas_h)); box.appendChild(note(U.kw_ideas_hint));
    // alle termen uit het hele archief met hun klikken
    var clicks = {}; Object.keys(D.queries).forEach(function (ym) { D.queries[ym].forEach(function (r) { clicks[r[0]] = (clicks[r[0]] || 0) + r[1]; }); });
    var have = {}; Object.keys(clicks).forEach(function (t) { have[termKey(t)] = 1; });
    var modStat = {};                      // woord -> {terms, clicks}
    var heads = {};                        // basisterm -> klikken
    Object.keys(clicks).forEach(function (t) {
      var tk = tokens(t), found = false;
      tk.forEach(function (w) {
        if (MODS[w]) {
          found = true; var m = modStat[w] = modStat[w] || { n: 0, k: 0 }; m.n++; m.k += clicks[t];
          var rest = tk.filter(function (x) { return x !== w; });
          if (rest.length) { var h = rest.join(" "); heads[h] = (heads[h] || 0) + clicks[t]; }
        }
      });
      if (!found) heads[tk.join(" ")] = (heads[tk.join(" ")] || 0) + clicks[t];
    });
    var ideas = [];
    Object.keys(modStat).forEach(function (w) {
      Object.keys(heads).forEach(function (h) {
        var ht = h.split(" ");
        if (!h || ht.indexOf(w) >= 0 || ht.some(function (x) { return MODS[x]; })) return;
        var idea = MODS[w] === "before" ? w + " " + h : h + " " + w;
        if (have[termKey(idea)]) return;
        ideas.push({ idea: idea, mod: w, head: h, n: modStat[w].n, hk: heads[h], score: Math.sqrt(modStat[w].k * heads[h]) });
      });
    });
    ideas.sort(function (x, y) { return y.score - x.score || (x.idea < y.idea ? -1 : 1); });
    var out = [], perHead = {};
    ideas.forEach(function (i) { if (out.length < 10 && (perHead[i.head] || 0) < 2) { perHead[i.head] = (perHead[i.head] || 0) + 1; out.push(i); } });
    if (!out.length) box.appendChild(el("p", "muted", U.kw_ideas_none));
    else box.appendChild(pickTable(U.kw_ideas_th, out.map(function (i) {
      return { key: i.idea, cells: [i.idea, { t: U.kw_ideas_why.replace("{mod}", i.mod).replace("{n}", i.n).replace("{head}", i.head), cls: "txt" }, n0(i.hk)] };
    }), null));
    box.appendChild(note(U.kw_ideas_note));
  }
  function kwLookup(box) {
    box.appendChild(panelHead(U.kw_lookup_h));
    var info = {}, ms = Object.keys(D.queries).sort();
    ms.forEach(function (ym) { D.queries[ym].forEach(function (r) { (info[r[0]] = info[r[0]] || {})[ym] = [r[1], r[2], r[3]]; }); });
    var input = el("input", "kw-search"); input.type = "search"; input.id = "kw-q"; input.placeholder = U.kw_placeholder; input.autocomplete = "off";
    input.setAttribute("aria-label", U.kw_lookup_h);
    var chips = el("div", "chips"), detail = el("div", "kw-detail");
    function show(term) {
      detail.textContent = "";
      if (!info[term]) { detail.appendChild(el("p", "muted", U.kw_none)); post(); return; }
      var top = 1; ms.forEach(function (ym) { if (info[term][ym]) top = Math.max(top, info[term][ym][0]); });
      detail.appendChild(el("h3", null, term));
      var W = 640, H = 150, slot = (W - 10) / ms.length, g = svg("svg", { viewBox: "0 0 " + W + " " + H, width: "100%", role: "img", "aria-label": term }), have = 0, rows = [];
      ms.forEach(function (ym, i2) {
        var r = info[term][ym];
        if (r) {
          have++; var h = r[0] / top * (H - 40);
          var rect = svg("rect", { x: 5 + i2 * slot + slot * 0.15, y: H - 20 - h, width: slot * 0.7, height: Math.max(h, 1), rx: 2, "class": "bar sel" });
          var t = svg("title", {}); t.textContent = mname(ym) + ": " + n0(r[0]) + " / pos. " + f1(r[1]); rect.appendChild(t); g.appendChild(rect);
        }
        if (ms.length <= 14 || i2 % 3 === 0) { var tx = svg("text", { x: 5 + i2 * slot + slot / 2, y: H - 6, "text-anchor": "middle", "class": "axis" }); tx.textContent = mshort(ym) + " " + ym.slice(2, 4); g.appendChild(tx); }
        rows.push({ key: ym, cells: [mname(ym), r ? n0(r[0]) : { t: U.kw_absent, cls: "num absent" }, r ? n0(r[2]) : "", r ? f1(r[1]) : ""] });
      });
      var box2 = el("div", "chart"); box2.appendChild(g); detail.appendChild(box2);
      detail.appendChild(note(U.kw_months_have.replace("{n}", have).replace("{t}", ms.length) + ". " + U.kw_pos_note));
      detail.appendChild(pickTable(U.kw_detail_th, rows.reverse(), null)); post();
    }
    input.addEventListener("input", function () {
      var q = input.value.trim().toLowerCase(); chips.textContent = "";
      if (!q) return;
      Object.keys(info).filter(function (t) { return t.toLowerCase().indexOf(q) !== -1; })
        .sort(function (a, b) { var tot = function (t) { var s = 0; for (var y in info[t]) s += info[t][y][0]; return s; }; return tot(b) - tot(a); }).slice(0, 8)
        .forEach(function (t) { var b = el("button", "chip", t); b.type = "button"; b.addEventListener("click", function () { S.q = t; show(t); syncHash(); }); chips.appendChild(b); });
      if (!chips.firstChild) chips.appendChild(el("span", "muted", U.kw_none));
      post();
    });
    box.appendChild(input); box.appendChild(chips); box.appendChild(detail); box.appendChild(note(U.kw_note));
    if (S.q) { input.value = S.q; input.dispatchEvent(new Event("input")); show(S.q); }
  }

  function renderKeywords(content) {
    var k = ctx();
    content.appendChild(notes(k));
    var tabs = el("div", "subtabs");
    KW_TABS.forEach(function (t) {
      var b = el("button", "pill" + (S.kw === t ? " on" : ""), U.kw_tabs[t]); b.type = "button"; b.setAttribute("data-kw", t);
      if (S.kw === t) b.setAttribute("aria-current", "true");
      b.addEventListener("click", function () { S.kw = t; renderContent(); syncHash(); });
      tabs.appendChild(b);
    });
    content.appendChild(tabs);
    var box = el("section", "card"); content.appendChild(box);
    if (S.kw === "past") return kwPast(box);
    if (S.kw === "lookup") return kwLookup(box);
    if (S.kw === "ideas") return kwIdeas(box);
    if (S.kw === "season") return kwSeason(box, k);
    var qa = alignedWith(k, D.queries);
    if (!qa.a.length) { box.appendChild(el("p", "muted", U.kw_no_queries)); return; }
    if (qa.have < qa.of) box.appendChild(note(U.parts_note.replace("{n}", qa.have).replace("{t}", qa.of)));
    if (S.kw === "move") return kwMove(box, k, qa);
    if (S.kw === "chances") return kwChances(box, k, qa);
    kwNow(box, k, qa);
  }
  VIEWS.push({ id: "keywords", icon: "keywords", label: "n_keywords", render: renderKeywords, needs: function () { return !!D.queries; } });

