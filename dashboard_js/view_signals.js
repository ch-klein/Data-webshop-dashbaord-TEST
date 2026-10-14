// dashboard_js/view_signals.js: Weergave Signalen: wat valt er op deze maand en wat te doen, op belang gesorteerd.
// Alle onderdelen worden bij het bouwen achter elkaar gezet in een functie-omgeving (zie dashboard.read_js()); de volgorde staat in JS_PARTS.

  // ---------- weergave: Signalen ----------
  function renderSignals(content) {
    var list = D.signals || [], kinds = ["risk", "chance", "good", "info"], views = active();
    content.appendChild(note(U.sg_intro.replace("{m}", mname(D.latest))));
    if (!list.length) content.appendChild(el("p", "muted", U.sg_empty));
    kinds.forEach(function (kind) {
      var items = list.filter(function (s) { return s.kind === kind; });
      if (!items.length) return;
      var card = el("section", "card"); card.appendChild(panelHead(U.sg_kinds[kind]));
      var ul = el("ul", "signals");
      items.forEach(function (s) {
        var li = el("li", "signal sev-" + s.sev);
        if (s.kind === "risk" || s.kind === "chance") li.appendChild(el("span", "sev", U.sg_sev[s.sev]));          // ernst alleen bij wat actie vraagt
        li.appendChild(el("h3", null, s.title));
        li.appendChild(el("p", null, s.why));
        var act = el("p", "act"); act.appendChild(el("b", null, U.sg_now + ": ")); act.appendChild(document.createTextNode(s.action)); li.appendChild(act);
        var target = views.filter(function (v) { return v.id === s.view; })[0];
        if (target && s.view !== "overview") {
          var b = el("button", "close", U.sg_go + ": " + (U.sg_views[s.view] || s.view)); b.type = "button";
          b.addEventListener("click", function () { S.view = target.id; renderNav(); renderContent(); syncHash(); var h1 = headBox.querySelector("h1"); if (h1) { h1.tabIndex = -1; h1.focus(); } });
          li.appendChild(b);
        }
        ul.appendChild(li);
      });
      card.appendChild(ul); content.appendChild(card);
    });
    content.appendChild(note(U.sg_note));
  }
  VIEWS.push({ id: "signals", icon: "signals", label: "n_signals", render: renderSignals, needs: function () { return !!D.signals; } });
