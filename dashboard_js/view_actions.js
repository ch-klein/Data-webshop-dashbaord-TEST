// dashboard_js/view_actions.js: Weergave Acties: wat is er gedaan en wat leverde het op (gesloten lus van signaal naar actie naar meting).
// Alle onderdelen worden bij het bouwen achter elkaar gezet in een functie-omgeving (zie dashboard.read_js()); de volgorde staat in JS_PARTS.

  // ---------- weergave: Acties ----------
  function renderActions(content) {
    var list = D.actions || [], open = 0, done = 0, hit = 0;
    list.forEach(function (a) { if (a.state === "open") open++; else done++; if (a.state === "plus" || a.state === "min") hit++; });
    content.appendChild(note(U.ac_intro));
    if (!list.length) { content.appendChild(el("p", "muted", U.ac_none)); content.appendChild(note(U.ac_note)); return; }
    var tiles = el("div", "pbi-tiles");
    [[U.ac_open_n.replace("{n}", open)], [U.ac_done_n.replace("{n}", done)], [U.ac_signal_n.replace("{n}", hit)]].forEach(function (t) { var d = el("div", "pbi-tile"); d.appendChild(el("div", "l", t[0])); tiles.appendChild(d); });
    var card = el("section", "card"); card.appendChild(panelHead(U.n_actions));
    var rows = list.map(function (a) {
      var eff = a.effect === null || a.effect === undefined ? "" : " (" + (a.effect >= 0 ? "+" : "\u2212") + pct(Math.abs(a.effect), 0) + ")";
      return { key: a.id, cells: [{ t: a.title, cls: "txt" }, { t: U.ac_kinds[a.kind] || a.kind, cls: "txt" }, { t: U.ac_goals[a.goal] || a.goal, cls: "txt" }, { t: (U.ac_state[a.state] || a.state) + eff, cls: "txt" }, { t: a.done || U.none, cls: "txt" }, { t: a.text, cls: "txt" }] };
    });
    card.appendChild(pickTable(U.ac_th, rows, null));
    content.appendChild(tiles); content.appendChild(card); content.appendChild(note(U.ac_note));
  }
  VIEWS.push({ id: "actions", icon: "actions", label: "n_actions", render: renderActions, needs: function () { return !!D.actions; } });
