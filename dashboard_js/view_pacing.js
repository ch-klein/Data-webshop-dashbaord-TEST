// dashboard_js/view_pacing.js: Weergave Doelen: voortgang van het jaardoel met verwachting, en een rekenvoorbeeld voor het advertentiebudget.
// Alle onderdelen worden bij het bouwen achter elkaar gezet in een functie-omgeving (zie dashboard.read_js()); de volgorde staat in JS_PARTS.

  // ---------- weergave: Doelen ----------
  function pcFmt(metric, v) { return metric === "revenue" ? eur(v) : n0(v); }
  // Eigen jaardoel van de bezoeker: staat in de browser (localStorage, mag ontbreken) en zolang de pagina openstaat in het geheugen. Het doel van het bureau blijft ongemoeid.
  var MEM_GOALS = {};
  function goalStoreKey() { return storeKey("dash-goal") + "-" + D.pacing.year; }
  function loadOwnGoals() {
    var v = null;
    try { v = JSON.parse(window.localStorage.getItem(goalStoreKey()) || "null"); } catch (e) { v = null; }
    if (!v && MEM_GOALS[goalStoreKey()]) v = MEM_GOALS[goalStoreKey()];
    var out = {}; if (v && typeof v === "object") ["sessions", "conversions", "revenue"].forEach(function (m) { if (typeof v[m] === "number" && isFinite(v[m]) && v[m] > 0) out[m] = v[m]; });
    return out;
  }
  function saveOwnGoals(o) {
    MEM_GOALS[goalStoreKey()] = o;
    try { if (Object.keys(o).length) window.localStorage.setItem(goalStoreKey(), JSON.stringify(o)); else window.localStorage.removeItem(goalStoreKey()); } catch (e) { /* opslag niet beschikbaar: het geheugen van de pagina blijft */ }
  }
  // rijen met het doel van de bezoeker waar dat is ingevuld, anders het doel van het bureau; de verwachting hangt niet van het doel af
  function goalRows(P, own) {
    return (P.base || []).map(function (b) {
      var bureau = P.rows.filter(function (r) { return r.metric === b.metric; })[0], g = own[b.metric];
      if (!g) return bureau ? { own: false, row: bureau } : null;
      var ratio = b.projection / g, left = 12 - P.months_done, need = left ? Math.max(0, (g - b.ytd) / left) : 0;
      return { own: true, row: { metric: b.metric, ytd: b.ytd, goal: g, projection: b.projection, lo: b.lo, hi: b.hi, need: need, recent: b.recent, actual: b.actual, proj: b.proj,
                                 status: ratio >= 1.1 ? "ahead" : ratio >= 1 ? "on_track" : ratio >= 0.9 ? "close" : "behind", path: b.pattern.map(function (p) { return p * g; }) } };
    }).filter(function (x) { return !!x; });
  }
  function ownGoalEditor(P, own) {
    var card = el("section", "card"); card.appendChild(panelHead(U.pc_h_own)); card.appendChild(note(U.pc_own_hint));
    var form = el("div", "controls"), inputs = {};
    (P.base || []).forEach(function (b) {
      var bureau = P.rows.filter(function (r) { return r.metric === b.metric; })[0];
      var lab = el("label", "field"); lab.appendChild(el("span", null, U.pc_metrics[b.metric] + " " + U.pc_per_year.replace("{y}", P.year)));
      var inp = el("input"); inp.type = "number"; inp.min = "1"; inp.step = "any"; inp.id = "pc-own-" + b.metric; inp.inputMode = "decimal";
      inp.placeholder = bureau ? pcFmt(b.metric, bureau.goal) + " (" + U.pc_by_agency + ")" : U.pc_no_goal;
      if (own[b.metric]) inp.value = String(own[b.metric]);
      inputs[b.metric] = inp; lab.appendChild(inp); form.appendChild(lab);
    });
    card.appendChild(form);
    var row = el("div", "exrow"), msg = el("p", "note"); msg.setAttribute("role", "status"); msg.id = "pc-own-msg";
    var save = el("button", "xb", U.pc_own_save); save.type = "button"; save.id = "pc-own-save";
    save.addEventListener("click", function () {
      var o = {}, bad = false;
      Object.keys(inputs).forEach(function (m) {
        var t = inputs[m].value.replace(",", ".").trim(); if (!t) return;
        var v = Number(t); if (!isFinite(v) || v <= 0) { bad = true; inputs[m].setAttribute("aria-invalid", "true"); return; } o[m] = v;
      });
      if (bad) { msg.textContent = U.pc_own_bad; say(U.pc_own_bad); return; }
      saveOwnGoals(o); say(U.pc_own_saved); renderContent();
    });
    var reset = el("button", "xb", U.pc_own_reset); reset.type = "button"; reset.id = "pc-own-reset"; reset.disabled = !Object.keys(own).length;
    reset.addEventListener("click", function () { saveOwnGoals({}); say(U.pc_own_cleared); renderContent(); });
    row.appendChild(save); row.appendChild(reset); card.appendChild(row); card.appendChild(msg);
    return card;
  }
  function renderPacing(content) {
    var P = D.pacing, own = loadOwnGoals(), GR = goalRows(P, own), RW = GR.map(function (g) { return g.row; }), anyOwn = Object.keys(own).length > 0;
    content.appendChild(note(U.pc_intro));
    if (P.base && P.base.length) content.appendChild(ownGoalEditor(P, own));
    if (RW.length) {
      var card = el("section", "card"); card.appendChild(panelHead(U.pc_h_goal));
      var rows = RW.map(function (r) {
        return { key: r.metric, cells: [{ t: U.pc_metrics[r.metric], cls: "txt" }, pcFmt(r.metric, r.ytd), pcFmt(r.metric, r.goal) + (GR[RW.indexOf(r)].own ? " (" + U.pc_own_tag + ")" : ""),
                 { t: pcFmt(r.metric, r.projection) + " (" + U.pc_range.replace("{lo}", pcFmt(r.metric, r.lo)).replace("{hi}", pcFmt(r.metric, r.hi)) + ")", cls: "num" },
                 { t: U.pc_status[r.status], cls: "txt " + (r.status === "behind" ? "neg" : (r.status === "close" ? "" : "pos")) }, pcFmt(r.metric, r.need), pcFmt(r.metric, r.recent)] };
      });
      if (isNeon()) {                                    // Donker: een meter per doel met de voortgang, en de verwachting eronder
        card.appendChild(neonRow(RW.map(function (r) {
          var done = r.goal ? r.ytd / r.goal * 100 : 0, exp = r.goal ? r.projection / r.goal * 100 : 0;
          return { label: U.pc_metrics[r.metric], fill: done, center: pct(done, 0), sub: pcFmt(r.metric, r.ytd) + " / " + pcFmt(r.metric, r.goal) + " \u00b7 " + U.nx_expect.replace("{p}", function () { return pct(exp, 0); }) };
        })));
      }
      card.appendChild(pickTable(U.pc_th, rows, null));
      var holder = el("div"), sel = el("select"); sel.id = "pc-metric";
      RW.forEach(function (r) { var o = el("option", null, U.pc_metrics[r.metric]); o.value = r.metric; sel.appendChild(o); });
      function draw() {
        var r = RW.filter(function (x) { return x.metric === sel.value; })[0], months = [];
        for (var m = 1; m <= 12; m++) months.push(P.year + "-" + (m < 10 ? "0" : "") + m);
        var fmt = function (v) { return pcFmt(r.metric, v); }, money = r.metric === "revenue";
        holder.textContent = "";
        holder.appendChild(seriesChart(months, [{ name: U.pc_actual, values: months.map(function (x, i) { return i < r.actual.length ? r.actual[i] : null; }) },
                                                { name: U.pc_path, dash: true, values: r.path }, { name: U.pc_proj, dash: true, values: r.proj }], fmt, function (v) { return compact(v, money); }, "lines", U.pc_chart + ": " + U.pc_metrics[r.metric], { w: 900, h: 280 }));
        post();
      }
      if (RW.length > 1) { var lab = el("label", "field"); lab.appendChild(el("span", null, U.metric)); lab.appendChild(sel); var bar = el("div", "controls"); bar.appendChild(lab); card.appendChild(bar); }
      sel.addEventListener("change", draw);
      card.appendChild(el("h3", null, U.pc_chart)); card.appendChild(holder);
      if (anyOwn) card.appendChild(note(U.pc_own_sentences)); else { var ul = el("ul"); P.sentences.forEach(function (s) { ul.appendChild(el("li", null, s)); }); card.appendChild(ul); }
      content.appendChild(card); draw();
    }
    if (P.ads) {
      var c2 = el("section", "card"); c2.appendChild(panelHead(U.pc_h_ads));
      c2.appendChild(note(U.pc_ads_hint.replace("{eff}", pct(P.ads.efficiency * 100, 0))));
      var rows2 = [];
      P.ads.rows.forEach(function (a) {
        P.ads.scenarios.forEach(function (sc, i) {
          var extraCost = a.cost * sc / 100, extraRev = a.roas === null ? 0 : extraCost * a.roas * P.ads.efficiency;
          rows2.push({ key: a.channel + sc, cells: [i === 0 ? { t: a.channel, cls: "txt" } : { t: a.channel, cls: "txt", sr: true }, i === 0 ? eur(a.cost) : "", i === 0 ? eur(a.revenue) : "", i === 0 ? (a.roas === null ? U.none : a.roas.toLocaleString(LOC, { minimumFractionDigits: 1, maximumFractionDigits: 1 }) + "\u00d7") : "",
                                                      { t: (sc > 0 ? "+" : "\u2212") + Math.abs(sc) + "%", cls: "num" }, { t: (extraCost >= 0 ? "+" : "\u2212") + eur(Math.abs(extraCost)), cls: "num" }, { t: (extraRev >= 0 ? "+" : "\u2212") + eur(Math.abs(extraRev)), cls: "num" }] });
        });
      });
      c2.appendChild(pickTable(U.pc_ads_th, rows2, null)); content.appendChild(c2);
    } else if (!RW.length) content.appendChild(el("p", "muted", U.pc_no_goal_yet));
    content.appendChild(note(U.pc_note));
  }
  VIEWS.push({ id: "pacing", icon: "pacing", label: "n_pacing", render: renderPacing, needs: function () { return !!D.pacing; } });
