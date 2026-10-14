// dashboard_js/view_overview.js: Weergave Overzicht.
// Alle onderdelen worden bij het bouwen achter elkaar gezet in een functie-omgeving (zie dashboard.read_js()); de volgorde staat in JS_PARTS.

  // ---------- weergave: overzicht ----------
  // samenvatting van het bureau (alleen als het bureau die heeft goedgekeurd): gewone tekst, nooit als html
  function summaryPanel() {
    var card = el("section", "card"); card.appendChild(panelHead(U.sm_title));
    D.summary.paragraphs.forEach(function (p) { card.appendChild(el("p", "sm-text", p)); });
    card.appendChild(note(U.sm_by.replace("{via}", U.sm_via[D.summary.via] || D.summary.via).replace("{d}", D.summary.approved)));
    return card;
  }
  function renderOverview(content) {
    var k = ctx();
    if (D.summary && D.summary.month === D.latest) content.appendChild(summaryPanel());
    if (D.styles && S.style === "kaarten") { renderCardsOverview(content, k); return; }
    if (D.styles && S.style === "lijnen") { renderLinesOverview(content, k); return; }
    if (D.styles && S.style === "donker") { renderNeonOverview(content, k); return; }
    content.appendChild(notes(k));
    if (!k.A.s && !k.A.c) { content.appendChild(el("p", "muted", U.no_data)); return; }
    content.appendChild(kpiCards(k));
    if (!k.single && k.A.n > 1) content.appendChild(note(U.single_users));
    var card = el("section", "card"); card.appendChild(panelHead(U.h_trend));
    var opts = [["s", U.kpi.sessions], ["c", U.kpi.conversions], ["cr", U.kpi.conv_rate]];
    if (HASREV) opts.splice(2, 0, ["r", U.kpi.revenue]);
    var bar = el("div", "controls"), lab = el("label", "field"); lab.appendChild(el("span", null, U.metric));
    var sel = el("select"); sel.id = "chart-metric";
    opts.forEach(function (o) { var op = el("option", null, o[1]); op.value = o[0]; sel.appendChild(op); });
    sel.value = S.metric;
    var holder = el("div");
    function draw() { holder.textContent = ""; holder.appendChild(monthChart(k, S.metric)); post(); }
    sel.addEventListener("change", function () { S.metric = sel.value; draw(); });
    lab.appendChild(sel); bar.appendChild(lab); card.firstChild.querySelector('.tools').insertBefore(bar, card.firstChild.querySelector('.xbtn')); card.appendChild(holder); card.appendChild(note(U.conv_note));
    content.appendChild(card); draw();
    if (D.sentences && D.sentences.length) {
      var s = el("section", "card"); s.appendChild(panelHead(U.h_read));
      var ul = el("ul"); D.sentences.forEach(function (x) { ul.appendChild(el("li", null, x)); }); s.appendChild(ul); content.appendChild(s);
    }
  }
  VIEWS.push({ id: "overview", icon: "overview", label: "n_overview", render: renderOverview });

