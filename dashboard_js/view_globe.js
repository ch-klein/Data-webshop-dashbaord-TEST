// dashboard_js/view_globe.js: De wereldbol: bezoek per land op een draaibare bol (kaartgegevens van Natural Earth, ingebed in de pagina, geen verzoeken naar buiten).
// Alle onderdelen worden bij het bouwen achter elkaar gezet in een functie-omgeving (zie dashboard.read_js()); de volgorde staat in JS_PARTS.

  // ---------- wereldbol ----------
  var WORLD = null, RAD = Math.PI / 180;
  function cssColor(name, fallback) { var v = window.getComputedStyle(document.documentElement).getPropertyValue(name).trim(); return /^#[0-9a-f]{6}$/i.test(v) ? v : fallback; }
  function rgb(c) { return c.charAt(0) === "#" ? [parseInt(c.slice(1, 3), 16), parseInt(c.slice(3, 5), 16), parseInt(c.slice(5, 7), 16)] : c.match(/\d+/g).slice(0, 3).map(Number); }       // #rrggbb of rgb(r,g,b)
  function mixHex(a, b, t) { var x = rgb(a), y = rgb(b); return "rgb(" + [0, 1, 2].map(function (i) { return Math.round(x[i] + (y[i] - x[i]) * t); }).join(",") + ")"; }
  // orthografische projectie: punt achter de horizon komt op de rand van de bol te liggen (zodat vlakken netjes doorlopen)
  function projector(lon0, lat0, R, cx, cy) {
    var sl0 = Math.sin(lat0 * RAD), cl0 = Math.cos(lat0 * RAD);
    return function (lon, lat) {
      var dl = (lon - lon0) * RAD, sp = Math.sin(lat * RAD), cp = Math.cos(lat * RAD), cosc = sl0 * sp + cl0 * cp * Math.cos(dl);
      var x = cp * Math.sin(dl), y = cl0 * sp - sl0 * cp * Math.cos(dl);
      if (cosc < 0) { var n = Math.sqrt(x * x + y * y) || 1; x = x / n; y = y / n; }
      return [cx + R * x, cy - R * y, cosc >= 0];
    };
  }
  // een omtrek op de bol: het zichtbare deel wordt langs de horizon afgesneden en de rand van de bol volgt de cirkel (zoals een echte bol)
  function ringPath(ctx2, ring, lon0, lat0, R, cx, cy) {
    var sl0 = Math.sin(lat0 * RAD), cl0 = Math.cos(lat0 * RAD), pts = [], i;
    for (i = 0; i < ring.length; i += 2) {
      var dl = (ring[i] / 10 - lon0) * RAD, sp = Math.sin(ring[i + 1] / 10 * RAD), cp = Math.cos(ring[i + 1] / 10 * RAD);
      pts.push([cp * Math.sin(dl), cl0 * sp - sl0 * cp * Math.cos(dl), sl0 * sp + cl0 * cp * Math.cos(dl)]);
    }
    var out = [], n = pts.length;
    for (i = 0; i < n; i++) {
      var p = pts[i], q = pts[(i + 1) % n];
      if (p[2] >= 0) out.push({ x: p[0], y: p[1], limb: false });
      if ((p[2] >= 0) !== (q[2] >= 0)) {                              // de rand kruist de horizon
        var t = p[2] / (p[2] - q[2]), x = p[0] + t * (q[0] - p[0]), y = p[1] + t * (q[1] - p[1]), l = Math.sqrt(x * x + y * y) || 1;
        out.push({ x: x / l, y: y / l, limb: true });
      }
    }
    if (out.length < 3) return false;
    ctx2.moveTo(cx + R * out[0].x, cy - R * out[0].y);
    for (i = 1; i <= out.length; i++) {
      var a = out[i - 1], b = out[i % out.length];
      if (a.limb && b.limb) {                                          // langs de horizon, via de korte kant
        var a1 = Math.atan2(a.y, a.x), d = Math.atan2(b.y, b.x) - a1;
        d = Math.atan2(Math.sin(d), Math.cos(d));
        var steps = Math.max(1, Math.ceil(Math.abs(d) / (5 * RAD)));
        for (var k = 1; k <= steps; k++) ctx2.lineTo(cx + R * Math.cos(a1 + d * k / steps), cy - R * Math.sin(a1 + d * k / steps));
      } else if (i < out.length) ctx2.lineTo(cx + R * b.x, cy - R * b.y);
    }
    ctx2.closePath();
    return true;
  }
  // omgekeerd: van een punt op het scherm naar lengte- en breedtegraad (of null naast de bol)
  function unproject(px, py, lon0, lat0, R, cx, cy) {
    var dx = (px - cx) / R, dy = (cy - py) / R, rho = Math.sqrt(dx * dx + dy * dy);
    if (rho > 1) return null;
    if (rho === 0) return [lon0, lat0];
    var c = Math.asin(rho), sl0 = Math.sin(lat0 * RAD), cl0 = Math.cos(lat0 * RAD);
    var lat = Math.asin(Math.cos(c) * sl0 + dy * Math.sin(c) * cl0 / rho), lon = lon0 * RAD + Math.atan2(dx * Math.sin(c), rho * cl0 * Math.cos(c) - dy * sl0 * Math.sin(c));
    lon = ((lon / RAD + 540) % 360) - 180;
    return [lon, lat / RAD];
  }
  function inCountry(c, lon, lat) {
    if (!c.r) return false;
    var hit = false;
    c.r.forEach(function (ring) {
      for (var i = 0, j = ring.length - 2; i < ring.length; i += 2) {
        var xi = ring[i] / 10, yi = ring[i + 1] / 10, xj = ring[j] / 10, yj = ring[j + 1] / 10;
        if ((yi > lat) !== (yj > lat) && lon < (xj - xi) * (lat - yi) / (yj - yi) + xi) hit = !hit;
        j = i;
      }
    });
    return hit;
  }
  // het midden van het grootste vlak van een land (om de bol erheen te draaien)
  function centerOf(c) {
    if (c.p) return [c.p[1] / 10, c.p[0] / 10];
    var best = c.r.slice().sort(function (a, b) { return b.length - a.length; })[0], sx = 0, sy = 0, n = best.length / 2;
    for (var i = 0; i < best.length; i += 2) { sx += best[i]; sy += best[i + 1]; }
    return [sx / n / 10, sy / n / 10];
  }
  function insightGlobe(content, k) {
    if (!D.geo || !D.geo_map || !WORLD) return;
    var ge = alignedWith(k, D.geo), card = el("section", "card"); card.appendChild(panelHead(U.gl_title)); content.appendChild(card);
    if (!ge.a.length) { card.appendChild(el("p", "muted", U.no_parts)); return; }
    var A = sumBy(ge.a, function (ym) { return D.geo[ym]; }), names = Object.keys(A).sort(function (x, y) { return A[y][0] - A[x][0]; }), value = {}, shown = [], unmatched = 0, mx = 1;
    names.forEach(function (n) {
      var i = D.geo_map[n];
      if (i === undefined || !WORLD.c[i]) { unmatched++; return; }
      value[i] = (value[i] || 0) + A[n][0]; shown.push(n); if (value[i] > mx) mx = value[i];
    });
    if (!shown.length) { card.appendChild(el("p", "muted", U.no_data)); return; }
    var topIdx = D.geo_map[shown[0]], center = centerOf(WORLD.c[topIdx]), lon0 = center[0], lat0 = Math.max(-60, Math.min(70, center[1] * 0.6)), sel = topIdx, drag = null, auto = false;
    card.appendChild(note(U.gl_hint));
    var wrap = el("div", "globe-wrap"), canvas = document.createElement("canvas"), S0 = 560;
    canvas.width = S0; canvas.height = S0; canvas.className = "globe"; canvas.tabIndex = 0; canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", U.gl_label + ": " + shown.slice(0, 3).map(function (n) { return n + " " + n0(A[n][0]); }).join(", "));
    var info = el("p", "globe-info"), say2 = el("p", "sr"); say2.setAttribute("aria-live", "polite");              // alleen bij een klik of keuze voorlezen, niet bij elke muisbeweging
    function describe(i, announce) {
      var c = WORLD.c[i], v = value[i];
      info.textContent = v ? c.n + ": " + n0(v) + " " + U.gl_sessions + " (" + pct(v / (ge.a.reduce(function (t, ym) { return t + (byYm[ym] ? byYm[ym].s : 0); }, 0) || 1) * 100, 1) + ")" : c.n + ": " + U.gl_none;
      if (announce) say2.textContent = info.textContent;
    }
    function draw() {
      var ctx2 = canvas.getContext("2d"), R = S0 / 2 - 8, cx = S0 / 2, cy = S0 / 2, P = projector(lon0, lat0, R, cx, cy);
      var ink = cssColor("--s-a", "#c2185b"), card2 = cssColor("--card", "#ffffff"), line = cssColor("--border", "#dddddd"), mute = cssColor("--muted", "#777777"), acc = cssColor("--s-b", "#1b5e20");
      ctx2.clearRect(0, 0, S0, S0);
      ctx2.beginPath(); ctx2.arc(cx, cy, R, 0, 2 * Math.PI); ctx2.fillStyle = mixHex(card2, line, 0.35); ctx2.fill();
      ctx2.save(); ctx2.beginPath(); ctx2.arc(cx, cy, R, 0, 2 * Math.PI); ctx2.clip();
      ctx2.lineWidth = 1; ctx2.strokeStyle = mixHex(card2, line, 0.7);
      for (var lo = -180; lo < 180; lo += 30) { ctx2.beginPath(); var pen = false; for (var la = -90; la <= 90; la += 5) { var q = P(lo, la); if (q[2]) { if (!pen) ctx2.moveTo(q[0], q[1]); else ctx2.lineTo(q[0], q[1]); pen = true; } else pen = false; } ctx2.stroke(); }
      for (var la2 = -60; la2 <= 60; la2 += 30) { ctx2.beginPath(); var pen2 = false; for (var lo2 = -180; lo2 <= 180; lo2 += 5) { var q2 = P(lo2, la2); if (q2[2]) { if (!pen2) ctx2.moveTo(q2[0], q2[1]); else ctx2.lineTo(q2[0], q2[1]); pen2 = true; } else pen2 = false; } ctx2.stroke(); }
      WORLD.c.forEach(function (c, i) {
        if (!c.r) return;
        ctx2.beginPath();
        c.r.forEach(function (ring) { ringPath(ctx2, ring, lon0, lat0, R, cx, cy); });
        ctx2.fillStyle = value[i] ? mixHex(mixHex(card2, line, 0.15), ink, 0.25 + 0.75 * Math.sqrt(value[i] / mx)) : mixHex(card2, mute, 0.18);
        ctx2.fill("evenodd"); ctx2.lineWidth = i === sel ? 2.5 : 0.6; ctx2.strokeStyle = i === sel ? acc : mixHex(card2, line, 0.9); ctx2.stroke();
      });
      WORLD.c.forEach(function (c, i) {                                  // kleine landen zonder vlak: een stip
        if (!c.p || !value[i]) return;
        var p = P(c.p[1] / 10, c.p[0] / 10); if (!p[2]) return;
        ctx2.beginPath(); ctx2.arc(p[0], p[1], 4 + 9 * Math.sqrt(value[i] / mx), 0, 2 * Math.PI); ctx2.fillStyle = ink; ctx2.globalAlpha = 0.85; ctx2.fill(); ctx2.globalAlpha = 1;
        ctx2.lineWidth = i === sel ? 2.5 : 1; ctx2.strokeStyle = i === sel ? acc : card2; ctx2.stroke();
      });
      ctx2.restore();
      ctx2.beginPath(); ctx2.arc(cx, cy, R, 0, 2 * Math.PI); ctx2.lineWidth = 2; ctx2.strokeStyle = line; ctx2.stroke();
    }
    function pick(ev) {
      var r = canvas.getBoundingClientRect(), px = (ev.clientX - r.left) * S0 / r.width, py = (ev.clientY - r.top) * S0 / r.height, g = unproject(px, py, lon0, lat0, S0 / 2 - 8, S0 / 2, S0 / 2);
      if (!g) return null;
      for (var i = 0; i < WORLD.c.length; i++) { var c = WORLD.c[i]; if (c.r && inCountry(c, g[0], g[1])) return i; }
      var best = null, bd = 9999; WORLD.c.forEach(function (c, i) { if (c.p && value[i]) { var d = Math.abs(c.p[1] / 10 - g[0]) + Math.abs(c.p[0] / 10 - g[1]); if (d < 6 && d < bd) { bd = d; best = i; } } });
      return best;
    }
    function rotate(dLon, dLat) { lon0 = ((lon0 + dLon + 540) % 360) - 180; lat0 = Math.max(-85, Math.min(85, lat0 + dLat)); draw(); }
    canvas.addEventListener("pointerdown", function (e) { drag = { x: e.clientX, y: e.clientY, moved: false }; try { canvas.setPointerCapture(e.pointerId); } catch (x) { /* niet nodig */ } });
    canvas.addEventListener("pointermove", function (e) {
      if (drag) { var dx = e.clientX - drag.x, dy = e.clientY - drag.y; if (Math.abs(dx) + Math.abs(dy) > 2) drag.moved = true; drag.x = e.clientX; drag.y = e.clientY; rotate(-dx * 0.4, dy * 0.4); }
      else { var i = pick(e); if (i !== null) describe(i); }
    });
    canvas.addEventListener("pointerup", function (e) { if (drag && !drag.moved) { var i = pick(e); if (i !== null) { sel = i; describe(i, true); draw(); } } drag = null; });
    canvas.addEventListener("keydown", function (e) {
      var m = { ArrowLeft: [-10, 0], ArrowRight: [10, 0], ArrowUp: [0, 10], ArrowDown: [0, -10] }[e.key];
      if (m) { e.preventDefault(); rotate(m[0], m[1]); }
    });
    wrap.appendChild(canvas); describe(sel); draw();
    var side = el("div", "globe-side");
    side.appendChild(info); side.appendChild(say2);
    var btns = el("div", "exrow");
    [["←", U.gl_left, -15, 0], ["→", U.gl_right, 15, 0], ["↑", U.gl_up, 0, 15], ["↓", U.gl_down, 0, -15]].forEach(function (b) {
      var bt = el("button", "xb", b[0]); bt.type = "button"; bt.setAttribute("aria-label", b[1]); bt.title = b[1]; bt.addEventListener("click", function () { rotate(b[2], b[3]); }); btns.appendChild(bt);
    });
    var home = el("button", "xb", U.gl_home.replace("{c}", function () { return WORLD.c[topIdx].n; })); home.type = "button";
    home.addEventListener("click", function () { var c = centerOf(WORLD.c[topIdx]); lon0 = c[0]; lat0 = Math.max(-60, Math.min(70, c[1] * 0.6)); sel = topIdx; describe(sel, true); draw(); });
    btns.appendChild(home);
    if (!(window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches)) {
      var spin = el("button", "xb", U.gl_spin); spin.type = "button"; spin.setAttribute("aria-pressed", "false");
      spin.addEventListener("click", function () {
        auto = !auto; spin.setAttribute("aria-pressed", auto ? "true" : "false");
        (function step() { if (!auto || !document.body.contains(canvas)) { auto = false; return; } rotate(0.25, 0); window.requestAnimationFrame(step); })();
      });
      btns.appendChild(spin);
    }
    side.appendChild(btns);
    var lg = el("div", "globe-legend"); lg.appendChild(el("span", null, U.gl_less)); lg.appendChild(el("i", "globe-grad")); lg.appendChild(el("span", null, U.gl_more)); side.appendChild(lg);
    var top = el("ol", "globe-top"); shown.slice(0, 5).forEach(function (n) { top.appendChild(el("li", null, n + ": " + n0(A[n][0]))); }); side.appendChild(top);
    if (unmatched) side.appendChild(note(U.gl_unmatched.replace("{n}", unmatched)));
    var row = el("div", "globe-row"); row.appendChild(wrap); row.appendChild(side); card.appendChild(row);
    card.appendChild(note(U.gl_note));
  }
