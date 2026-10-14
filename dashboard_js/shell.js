// dashboard_js/shell.js: Opbouw van de pagina: zijbalk, topbalk, selectie, kop en het starten. Sluit de gedeelde functie-omgeving.
// Alle onderdelen worden bij het bouwen achter elkaar gezet in een functie-omgeving (zie dashboard.read_js()); de volgorde staat in JS_PARTS.

  // ---------- besturing: navigatie en periodekeuze ----------
  var navBox, ctlBox, content, headBox, sideEl, scrim, selTxt, selPanel, burgerEl, liveEl;
  function option(sel, value, text) { var o = el("option", null, text); o.value = value; sel.appendChild(o); return o; }
  function cmpHasData(kind) {
    if (kind === "none" || kind === "pick") return true;
    var old = S.cmp, ok;
    S.cmp = kind;
    var p = currentPeriod(), c = comparePeriod(p);
    ok = !!p && !!c && align(p, c).a.length > 0;
    S.cmp = old;
    return ok;
  }
  function field(label, control) { var l = el("label", "field"); l.appendChild(el("span", null, label)); l.appendChild(control); return l; }
  function renderNav() {
    navBox.textContent = "";
    active().forEach(function (v) {
      var b = el("button", "nav" + (v.id === S.view ? " on" : "")); b.type = "button"; b.appendChild(icon(v.icon || "overview"));
      b.appendChild(document.createTextNode(U[v.label]));
      if (v.id === S.view) b.setAttribute("aria-current", "page");
      b.addEventListener("click", function () { S.view = v.id; closeMenu(); renderNav(); renderContent(); syncHash(); var h1 = headBox.querySelector("h1"); if (h1) { h1.tabIndex = -1; h1.focus(); } });
      navBox.appendChild(b);
    });
  }
  function closeMenu() { if (sideEl) sideEl.classList.remove("open"); if (scrim) scrim.classList.remove("on"); if (burgerEl) burgerEl.setAttribute("aria-expanded", "false"); }
  function selText() {
    var p = currentPeriod(), c = p ? comparePeriod(p) : null;
    return (p ? p.label : "") + (c ? " " + U.vs + " " + c.label : "");
  }
  function renderHead() {
    var v = active().filter(function (x) { return x.id === S.view; })[0] || active()[0];
    headBox.textContent = "";
    var h1 = el("h1", null, U[v.label]); h1.id = "paginatitel"; h1.appendChild(el("small", null, selText())); headBox.appendChild(h1);
    headBox.setAttribute("role", "region"); headBox.setAttribute("aria-labelledby", "paginatitel");              // de kop met de gekozen periode is een eigen oriëntatiepunt voor schermlezers
    var cr = el("div", "crumbs"); cr.appendChild(icon("home", 16)); cr.appendChild(document.createTextNode(" " + U.n_overview));
    if (v.id !== "overview") { cr.appendChild(document.createTextNode(" \u203a " + U[v.label])); }
    headBox.appendChild(cr);
    if (selTxt) selTxt.textContent = selText();
    if (liveEl) liveEl.textContent = U[v.label] + ". " + selText();
  }
  function renderControls() {
    ctlBox.textContent = "";
    var tsel = el("select"); tsel.id = "ctl-type";
    // kwartaal, halfjaar en jaar staan niet in de keuze (dubbel met de laatste 3, 6 en 12 maanden); een oude link met zo'n periode werkt nog
    var kinds = ["month", "r3", "r6", "r12", "custom"];
    if (kinds.indexOf(S.type) < 0) kinds.splice(1, 0, S.type);
    kinds.forEach(function (t) { option(tsel, t, U.types[t]); });
    tsel.value = S.type;
    tsel.addEventListener("change", function () {
      S.type = tsel.value; S.key = defaultKey(S.type); S.ckey = null;
      if ((RN[S.type] || S.type === "custom") && S.cmp === "pick") S.cmp = "prev";
      changed();
    });
    ctlBox.appendChild(field(U.c_type, tsel));
    if (S.type === "custom") {
      var parts = (S.key || "..").split(".."), from = el("select"), to = el("select"); from.id = "ctl-from"; to.id = "ctl-to";
      HAVE.forEach(function (ym) { option(from, ym, mname(ym)); option(to, ym, mname(ym)); });
      from.value = parts[0]; to.value = parts[1];
      var upd = function () { S.key = from.value + ".." + to.value; changed(); };
      from.addEventListener("change", upd); to.addEventListener("change", upd);
      ctlBox.appendChild(field(U.c_from, from)); ctlBox.appendChild(field(U.c_to, to));
    } else if (!RN[S.type]) {
      var psel = el("select"); psel.id = "ctl-period";
      periodList(S.type).forEach(function (p) { option(psel, p.key, p.label); });
      psel.value = S.key; psel.addEventListener("change", function () { S.key = psel.value; changed(); });
      ctlBox.appendChild(field(U.c_period, psel));
    }
    var csel = el("select"); csel.id = "ctl-cmp";
    var cmps = ["prev", "yoy"].concat(RN[S.type] || S.type === "custom" ? [] : ["pick"]).concat(["none"]);
    cmps.forEach(function (c) {                         // een vergelijking zonder gegevens in het archief is niet te kiezen (anders lijkt het alsof er niets verandert)
      var o = option(csel, c, U.cmps[c] + (cmpHasData(c) ? "" : U.cmp_nodata));
      if (!cmpHasData(c) && c !== S.cmp) o.disabled = true;
    });
    csel.value = S.cmp;
    csel.addEventListener("change", function () {
      S.cmp = csel.value;
      if (S.cmp === "pick" && !S.ckey) { var l = periodList(S.type).filter(function (p) { return p.key !== S.key; }); S.ckey = l.length ? l[0].key : null; }
      changed();
    });
    ctlBox.appendChild(field(U.c_cmp, csel));
    ctlBox.appendChild(exportBox());
    if (D.styles && D.styles.length > 1) {
      var ssel = el("select"); ssel.id = "ctl-style";
      D.styles.forEach(function (id) { option(ssel, id, U.styles[id] || id); });
      ssel.value = S.style;
      ssel.addEventListener("change", function () { S.style = ssel.value; saveStyle(S.style); applyStyle(); renderContent(); syncHash(); post(); });
      ctlBox.appendChild(field(U.style_label, ssel));
      var lyBox = el("div", "field"); lyBox.appendChild(el("span", null, U.ly_label)); var lyRow = el("div", "exrow"); lyRow.appendChild(layoutButton()); lyBox.appendChild(lyRow); ctlBox.appendChild(lyBox);
    }
    if (S.cmp === "pick") {
      var ksel = el("select"); ksel.id = "ctl-ckey";
      periodList(S.type).forEach(function (p) { option(ksel, p.key, p.label); });
      ksel.value = S.ckey; ksel.addEventListener("change", function () { S.ckey = ksel.value; changed(); });
      ctlBox.appendChild(field(U.c_period, ksel));
    }
  }
  function renderContent() {
    content.textContent = "";
    var v = active().filter(function (x) { return x.id === S.view; })[0] || active()[0];
    renderHead();
    try { v.render(content); } catch (e) { content.appendChild(el("p", "neg", U.error)); document.documentElement.setAttribute("data-error", String(e && e.message || e)); }
    addExports(content);
    finishLayout(content);
    post();
  }
  // de gekozen weergave als kenmerk op het document: de stijl (bijvoorbeeld donker) hangt daaraan
  function applyStyle() { document.documentElement.setAttribute("data-style", S.style); }
  function changed() { renderControls(); renderContent(); renderHead(); syncHash(); }

  var lastH = 0;
  function post() {
    var h = Math.ceil(document.documentElement.scrollHeight);
    if (h === lastH) return;
    lastH = h;
    try { parent.postMessage({ type: "dashboard-height", height: h }, "*"); } catch (e) { /* niet ingesloten */ }
  }

  function start() {
    try {
      try { D = JSON.parse($("d").textContent); } catch (e) { D = null; }
      var problem = contractProblem(D);
      if (problem) { fatal(problem); return; }
      U = D.ui; LOC = D.lang === "nl" ? "nl-NL" : "en-US";
      try { var wEl = $("w"); WORLD = wEl ? JSON.parse(wEl.textContent) : null; } catch (e) { WORLD = null; }
      D.months.forEach(function (m) { byYm[m.ym] = m; HAVE.push(m.ym); });
      HAVE.sort();
      HASREV = D.months.some(function (m) { return m.r > 0; });
      var h = hashParams();
      S.type = ["month", "quarter", "half", "year", "r3", "r6", "r12", "custom"].indexOf(h.type) >= 0 ? h.type : "month";
      S.key = RN[S.type] ? "r" : (h.p || defaultKey(S.type));
      if (!validState()) { S.type = "month"; S.key = D.latest; }
      S.cmp = ["prev", "yoy", "pick", "none"].indexOf(h.cmp) >= 0 ? h.cmp : "prev";
      if (S.cmp === "pick") { S.ckey = h.c || null; if (RN[S.type] || S.type === "custom" || !periodMonths(S.type, S.ckey)) S.cmp = "prev"; }
      if (active().some(function (v) { return v.id === h.view; })) S.view = h.view;
      S.item = h.item || null;
      S.style = D.styles ? (D.styles.indexOf(h.st) >= 0 ? h.st : (savedStyle() || styleDefault())) : "standaard";
      if (KW_TABS.indexOf(h.kw) >= 0) S.kw = h.kw;
      S.q = h.q || null;                                  // rij die bij het openen al is uitgeklapt (deelbaar)
      var printMode = h.print === "all";
      var shell = el("div", "shell");
      sideEl = el("aside", "side"); sideEl.id = "side";
      var brand = el("div", "side-brand");
      if (D.brand && D.brand.logo) { var im = el("img"); im.setAttribute("src", D.brand.logo); im.setAttribute("alt", D.brand.name || ""); brand.appendChild(im); }
      else brand.appendChild(document.createTextNode((D.brand && D.brand.name) || ""));
      navBox = el("nav", "nav-list"); navBox.setAttribute("aria-label", U.nav_label);
      var foot = el("div", "side-foot", U.updated + " " + mname(D.latest));
      sideEl.appendChild(brand); sideEl.appendChild(navBox); sideEl.appendChild(foot);
      scrim = el("div", "scrim"); scrim.addEventListener("click", closeMenu);
      var main = el("div", "main");
      var bar = el("header", "topbar");
      var burger = el("button", "burger"); burger.type = "button"; burger.setAttribute("aria-label", U.menu); burger.setAttribute("aria-controls", "side"); burger.appendChild(icon("menu", 24));
      burgerEl = burger; burger.setAttribute("aria-expanded", "false");
      burger.addEventListener("click", function () { var o = sideEl.classList.toggle("open"); scrim.classList.toggle("on", o); burger.setAttribute("aria-expanded", o ? "true" : "false"); });
      var bname = el("span", "bar-name", (D.brand && D.brand.name) || "");
      var selbtn = el("button", "selbtn"); selbtn.type = "button"; selbtn.setAttribute("aria-controls", "selpanel"); selbtn.appendChild(icon("sliders", 18));
      selbtn.appendChild(el("span", "lab", U.sel_current)); selTxt = el("span", "txt", ""); selbtn.appendChild(selTxt); selbtn.appendChild(icon("chevron", 16));
      selPanel = el("div", "selpanel"); selPanel.id = "selpanel";
      var openSel = window.innerWidth >= 900; selPanel.hidden = !openSel; selbtn.setAttribute("aria-expanded", openSel ? "true" : "false");
      selbtn.addEventListener("click", function () { selPanel.hidden = !selPanel.hidden; selbtn.setAttribute("aria-expanded", selPanel.hidden ? "false" : "true"); post(); });
      bar.appendChild(burger); bar.appendChild(bname); bar.appendChild(selbtn);
      ctlBox = el("div", "controls"); selPanel.appendChild(ctlBox);
      headBox = el("div", "pagehead"); content = el("main", "content"); content.id = "inhoud"; content.tabIndex = -1;
      main.appendChild(bar); main.appendChild(selPanel); main.appendChild(headBox); main.appendChild(content); main.appendChild(el("footer", "footer", U.footer));
      var skip = el("button", "skip", U.skip); skip.type = "button"; skip.addEventListener("click", function () { content.focus(); });
      liveEl = el("div", "sr"); liveEl.setAttribute("role", "status"); liveEl.setAttribute("aria-live", "polite");
      root.appendChild(skip); shell.appendChild(sideEl); shell.appendChild(main); root.appendChild(shell); root.appendChild(scrim); root.appendChild(liveEl);
      applyStyle(); renderNav(); renderControls(); renderContent();
      if (printMode) { root.appendChild(buildPrintAll()); document.body.classList.add("print-all"); }          // #print=all: alle onderdelen onder elkaar (voor een PDF)
      if (h.x !== undefined && /^\d+$/.test(h.x)) { var xb = content.querySelectorAll(".xbtn")[parseInt(h.x, 10)]; if (xb) xb.click(); }
      document.documentElement.setAttribute("data-ready", "1");
      document.documentElement.setAttribute("data-sw", String(document.documentElement.scrollWidth));
      document.documentElement.setAttribute("data-iw", String(window.innerWidth));
    } catch (e) {
      root.appendChild(el("p", "neg", (U && U.error) || "Error"));
      document.documentElement.setAttribute("data-error", String(e && e.message || e));
    }
    post();
  }
  window.addEventListener("load", start);
  window.addEventListener("resize", post);
  if (typeof ResizeObserver === "function") new ResizeObserver(post).observe(document.documentElement);
})();
