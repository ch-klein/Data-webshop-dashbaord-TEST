// dashboard_js/export.js: Exporteren en delen: tabel als CSV, grafiek als afbeelding (PNG), link kopiëren, afdrukken en alles als PDF.
// Alle onderdelen worden bij het bouwen achter elkaar gezet in een functie-omgeving (zie dashboard.read_js()); de volgorde staat in JS_PARTS.

  // ---------- exporteren en delen ----------
  function say(text) { if (liveEl) liveEl.textContent = text; }
  // geeft een bestand aan de bezoeker. data: tekst of Blob. Het gebeurt volledig in de browser; er gaat niets naar een server.
  function download(name, type, data) {
    try { document.dispatchEvent(new CustomEvent("dashboard-export", { detail: { name: name, type: type, size: data.size !== undefined ? data.size : data.length, text: typeof data === "string" ? data : null } })); } catch (e) { /* oudere browser */ }
    try {
      var blob = data instanceof Blob ? data : new Blob([data], { type: type }), url = URL.createObjectURL(blob), a = document.createElement("a");
      a.href = url; a.download = name; a.style.display = "none"; document.body.appendChild(a); a.click(); document.body.removeChild(a);
      setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
      say(U.ex_done.replace("{f}", name));
    } catch (e) { say(U.ex_failed); }
  }
  function slug(t) { return String(t).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "export"; }
  function fileName(title, ext) { return slug((D.brand && D.brand.name) || "dashboard") + "-" + slug(title) + "-" + D.latest + "." + ext; }
  // een cel veilig voor Excel: tekst die met = of @ begint (of met + of - en geen getal is) kan als formule worden uitgevoerd; daar komt een ' voor
  function csvCell(text, sep) {
    var t = String(text).replace(/\s+/g, " ").trim();
    if (/^[=@]/.test(t) || (/^[+\-]/.test(t) && !/^[+\-]\d[\d.,]*%?$/.test(t))) t = "'" + t;
    return t.indexOf(sep) >= 0 || t.indexOf('"') >= 0 ? '"' + t.replace(/"/g, '""') + '"' : t;
  }
  function tableCsv(card) {
    var sep = D.lang === "nl" ? ";" : ",", out = [];
    Array.prototype.forEach.call(card.querySelectorAll("table"), function (t, i) {
      if (i) out.push("");
      Array.prototype.forEach.call(t.querySelectorAll("tr"), function (tr) {
        out.push(Array.prototype.map.call(tr.querySelectorAll("th, td"), function (c) { return csvCell(c.textContent, sep); }).join(sep));
      });
    });
    return "﻿" + out.join("\r\n") + "\r\n";
  }
  // de opmaak van een grafiek komt uit het stijlblad; voor een los bestand zetten we de berekende opmaak op elk onderdeel
  function inlineStyles(src, dst) {
    var cs = window.getComputedStyle(src);
    ["fill", "stroke", "stroke-width", "stroke-dasharray", "opacity", "font-size", "font-family", "font-weight", "text-anchor"].forEach(function (p) { dst.style.setProperty(p, cs.getPropertyValue(p)); });
    for (var i = 0; i < src.children.length; i++) if (dst.children[i]) inlineStyles(src.children[i], dst.children[i]);
  }
  function chartPng(card, title) {
    var cv = card.querySelector("canvas");
    if (cv) { if (cv.toBlob) cv.toBlob(function (b) { if (b) download(fileName(title, "png"), "image/png", b); else say(U.ex_failed); }, "image/png"); else say(U.ex_failed); return; }
    var svgEl = card.querySelector('svg[role="img"]');
    if (!svgEl) return;
    var vb = svgEl.getAttribute("viewBox").split(" "), w = parseFloat(vb[2]), h = parseFloat(vb[3]), clone = svgEl.cloneNode(true);
    inlineStyles(svgEl, clone);
    clone.setAttribute("xmlns", "http://www.w3.org/2000/svg"); clone.setAttribute("width", w); clone.setAttribute("height", h);
    var img = new Image();
    img.onload = function () {
      var scale = 2, canvas = document.createElement("canvas"); canvas.width = w * scale; canvas.height = (h + 28) * scale;
      var ctx2 = canvas.getContext("2d");
      ctx2.fillStyle = window.getComputedStyle(card).backgroundColor || "#fff"; ctx2.fillRect(0, 0, canvas.width, canvas.height);
      ctx2.fillStyle = window.getComputedStyle(document.body).color; ctx2.font = "bold " + 15 * scale + "px sans-serif"; ctx2.fillText(title, 8 * scale, 20 * scale);
      ctx2.drawImage(img, 0, 28 * scale, w * scale, h * scale);
      if (canvas.toBlob) canvas.toBlob(function (b) { if (b) download(fileName(title, "png"), "image/png", b); else say(U.ex_failed); }, "image/png");
      else say(U.ex_failed);
    };
    img.onerror = function () { say(U.ex_failed); };
    img.src = "data:image/svg+xml;charset=utf-8," + encodeURIComponent(new XMLSerializer().serializeToString(clone));
  }
  // voegt aan elk paneel met een tabel of grafiek de knoppen CSV en PNG toe
  function addExports(box) {
    Array.prototype.forEach.call(box.querySelectorAll("section.card"), function (card) {
      var tools = card.querySelector(".tools"), h2 = card.querySelector(".ph h2");
      if (!tools || !h2 || tools.querySelector(".exp")) return;
      var title = h2.textContent, xbtn = tools.querySelector(".xbtn");
      function mk(label, full, fn) {
        var b = el("button", "exp", label); b.type = "button"; b.setAttribute("aria-label", full + ": " + title); b.title = full;
        b.addEventListener("click", fn); tools.insertBefore(b, xbtn);
      }
      if (card.querySelector("table")) mk("CSV", U.ex_csv, function () { download(fileName(title, "csv"), "text/csv;charset=utf-8", tableCsv(card)); });
      if (card.querySelector('svg[role="img"]') || card.querySelector("canvas")) mk("PNG", U.ex_png, function () { chartPng(card, title); });
    });
  }
  function copyLink() {
    var url = location.href;
    function ok() { say(U.ex_copied); }
    function fallback() {
      try {
        var ta = document.createElement("textarea"); ta.value = url; ta.setAttribute("readonly", ""); ta.style.position = "fixed"; ta.style.top = "0"; ta.style.left = "0"; document.body.appendChild(ta); ta.select();
        var done = document.execCommand("copy"); document.body.removeChild(ta); say(done ? U.ex_copied : U.ex_copy_failed.replace("{u}", url));
      } catch (e) { say(U.ex_copy_failed.replace("{u}", url)); }
    }
    if (navigator.clipboard && navigator.clipboard.writeText) navigator.clipboard.writeText(url).then(ok, fallback); else fallback();
  }
  // alle onderdelen onder elkaar voor afdrukken of PDF (zonder knoppen en keuzelijsten)
  function buildPrintAll() {
    var box = el("div", "printall");
    box.appendChild(el("h1", "print-head", ((D.brand && D.brand.name) || "") + " – " + mname(D.latest)));
    active().forEach(function (v) {
      var sec = el("section", "print-view"), inner = el("div");
      sec.appendChild(el("h2", "print-title", U[v.label]));
      try { v.render(inner); } catch (e) { inner.appendChild(el("p", "neg", U.error)); }
      sec.appendChild(inner); box.appendChild(sec);
    });
    return box;
  }
  function printAll() {
    var box = buildPrintAll();
    root.appendChild(box); document.body.classList.add("print-all");
    function done() { document.body.classList.remove("print-all"); if (box.parentNode) box.parentNode.removeChild(box); window.removeEventListener("afterprint", done); }
    window.addEventListener("afterprint", done);
    setTimeout(function () { try { window.print(); } catch (e) { done(); } }, 50);
  }
  function exportBox() {
    var box = el("div", "field export"), l = el("span", null, U.ex_label); box.appendChild(l);
    var row = el("div", "exrow");
    [[U.ex_link, copyLink], [U.ex_print, function () { window.print(); }], [U.ex_print_all, printAll]].forEach(function (x) {
      var b = el("button", "xb", x[0]); b.type = "button"; b.addEventListener("click", x[1]); row.appendChild(b);
    });
    box.appendChild(row);
    return box;
  }
