// dashboard_js/layout.js: Eigen indeling (duurste abonnement): de bezoeker kiest per onderdeel welke panelen er staan en in welke volgorde.
// Alle onderdelen worden bij het bouwen achter elkaar gezet in een functie-omgeving (zie dashboard.read_js()); de volgorde staat in JS_PARTS.

  // ---------- eigen indeling ----------
  // De keuze staat per onderdeel in de browser van de bezoeker (localStorage, mag ontbreken) en wordt herkend aan de titel van het paneel.
  var EDIT = false, EDIT_FOCUS = null;
  function layoutKey() { return storeKey("dash-layout") + "-" + S.view + "-" + S.style; }
  // Kan de browser niets bewaren (bestand in een voorbeeldvenster, privévenster, opslag geblokkeerd), dan houdt de pagina de keuze zolang hij open staat.
  var MEM_LAYOUT = {};
  function loadLayout() {
    var v = null;
    try { v = JSON.parse(window.localStorage.getItem(layoutKey()) || "null"); } catch (e) { v = null; }
    if (!v && MEM_LAYOUT[layoutKey()]) v = MEM_LAYOUT[layoutKey()];
    return v && Array.isArray(v.order) && Array.isArray(v.hidden) ? v : null;
  }
  function saveLayout(order, hidden) {
    MEM_LAYOUT[layoutKey()] = { order: order, hidden: hidden };
    try { window.localStorage.setItem(layoutKey(), JSON.stringify({ order: order, hidden: hidden })); } catch (e) { /* opslag niet beschikbaar: het geheugen van de pagina blijft */ }
  }
  function resetLayout() { delete MEM_LAYOUT[layoutKey()]; try { window.localStorage.removeItem(layoutKey()); } catch (e) { /* niets te doen */ } }
  function panelTitle(card) { var h = card.querySelector(".ph h2"); return h ? h.textContent : ""; }
  // panelen die direct in de inhoud of in een raster staan
  function layoutCards(box) {
    var out = [];
    Array.prototype.forEach.call(box.children, function (c) {
      if (c.classList.contains("card")) out.push(c);
      else if (c.classList.contains("pbi-grid")) Array.prototype.forEach.call(c.children, function (x) { if (x.classList.contains("card")) out.push(x); });
    });
    return out.filter(function (c) { return panelTitle(c); });
  }
  // zet de panelen in de opgeslagen volgorde (op de plekken die ze al innamen) en verbergt wat de bezoeker niet wil zien
  function applyLayout(box) {
    var saved = loadLayout(), cards = layoutCards(box);
    if (!saved || !cards.length) return;
    var slots = cards.map(function (c) { var m = document.createComment(""); c.parentNode.insertBefore(m, c); return m; });
    var rank = function (c) { var i = saved.order.indexOf(panelTitle(c)); return i < 0 ? 1000 + cards.indexOf(c) : i; };
    var sorted = cards.slice().sort(function (a, b) { return rank(a) - rank(b); });
    sorted.forEach(function (c, i) { slots[i].parentNode.insertBefore(c, slots[i]); });
    slots.forEach(function (m) { m.parentNode.removeChild(m); });
    cards.forEach(function (c) { c.hidden = saved.hidden.indexOf(panelTitle(c)) >= 0; });
  }
  function layoutEditor(box) {
    var saved = loadLayout(), cards = layoutCards(box), titles = cards.map(panelTitle), hidden = saved ? saved.hidden.slice() : [];
    var ed = el("section", "card layout-editor"); ed.setAttribute("aria-label", U.ly_title);
    var head = el("div", "ph"); head.appendChild(el("h2", null, U.ly_title)); ed.appendChild(head);
    ed.appendChild(note(titles.length < 2 ? U.ly_single : U.ly_hint));
    var ul = el("ul", "ly-list");
    function commit(order, hid, focusId) { saveLayout(order, hid); EDIT_FOCUS = focusId; renderContent(); }
    titles.forEach(function (t, i) {
      var li = el("li", "ly-row"), id = "ly-" + i;
      var cb = el("input"); cb.type = "checkbox"; cb.id = id; cb.checked = hidden.indexOf(t) < 0;
      var lab = el("label", null, t); lab.setAttribute("for", id);
      cb.addEventListener("change", function () { var h = titles.filter(function (x) { return x !== t ? hidden.indexOf(x) >= 0 : !cb.checked; }); commit(titles, h, id); });
      li.appendChild(cb); li.appendChild(lab);
      [[-1, U.ly_up, "ly-up"], [1, U.ly_down, "ly-down"]].forEach(function (mv) {
        var j = i + mv[0], b = el("button", "xb", mv[0] < 0 ? "↑" : "↓"); b.type = "button"; b.setAttribute("aria-label", mv[1] + ": " + t); b.title = mv[1]; b.disabled = j < 0 || j >= titles.length;
        b.addEventListener("click", function () { var o = titles.slice(); var x = o[i]; o[i] = o[j]; o[j] = x; say(U.ly_moved.replace("{t}", t).replace("{n}", j + 1)); commit(o, hidden, mv[2] + "-" + j); });
        b.id = mv[2] + "-" + i; li.appendChild(b);
      });
      ul.appendChild(li);
    });
    ed.appendChild(ul);
    var row = el("div", "exrow");
    var reset = el("button", "xb", U.ly_reset); reset.type = "button"; reset.addEventListener("click", function () { resetLayout(); EDIT_FOCUS = "ly-reset"; renderContent(); });
    reset.id = "ly-reset";
    var done = el("button", "xb", U.ly_done); done.type = "button"; done.addEventListener("click", function () { EDIT = false; EDIT_FOCUS = "ly-toggle"; renderControls(); renderContent(); });
    row.appendChild(reset); row.appendChild(done); ed.appendChild(row);
    return ed;
  }
  // wordt na het opbouwen van een onderdeel aangeroepen
  function finishLayout(box) {
    if (!D.styles) return;
    applyLayout(box);
    if (EDIT) {
      box.insertBefore(layoutEditor(box), box.firstChild);
      if (EDIT_FOCUS) {
        var f = document.getElementById(EDIT_FOCUS);
        if (f && f.disabled) f = document.getElementById(EDIT_FOCUS.replace(/^ly-(up|down)-/, function (m, d) { return "ly-" + (d === "up" ? "down" : "up") + "-"; }));       // staat het paneel nu bovenaan of onderaan: de knop de andere kant op
        if (f && !f.disabled) f.focus();
        EDIT_FOCUS = null;
      }
    }
  }
  function layoutButton() {
    var b = el("button", "xb", EDIT ? U.ly_done : U.ly_edit); b.type = "button"; b.id = "ly-toggle"; b.setAttribute("aria-pressed", EDIT ? "true" : "false");
    b.addEventListener("click", function () { EDIT = !EDIT; EDIT_FOCUS = "ly-toggle"; renderControls(); renderContent(); });
    return b;
  }
