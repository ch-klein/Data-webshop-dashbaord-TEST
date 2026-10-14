// dashboard_js/core.js: Kern: hulpfuncties, toestand, perioden, vergelijken en samenvoegen. Opent de gedeelde functie-omgeving.
// Alle onderdelen worden bij het bouwen achter elkaar gezet in een functie-omgeving (zie dashboard.read_js()); de volgorde staat in JS_PARTS.
(function () {
  "use strict";
  var JS_SCHEMA = 1;                    // moet gelijk zijn aan dashboard_contract.SCHEMA_VERSION
  var root = document.getElementById("app");
  var D, U, LOC, HAVE = [], byYm = {};
  var S = { view: "overview", type: "month", key: null, cmp: "prev", ckey: null, metric: "s", item: null, kw: "now", q: null, style: "standaard" };
  var VIEWS = [];                       // {id, label, render(content), needs()}; wordt per stap uitgebreid
  function active() { return VIEWS.filter(function (v) { return !v.needs || v.needs(); }); }

  // controle van het gegevensformaat; geeft "schema", "data" of null (alles in orde)
  function contractProblem(d) {
    if (!d || typeof d !== "object") return "data";
    if (d.schema !== JS_SCHEMA) return "schema";
    if (!d.ui || typeof d.ui !== "object" || !Array.isArray(d.months) || !d.months.length || !Array.isArray(d.month_names) || d.month_names.length !== 12 || typeof d.latest !== "string") return "data";
    for (var i = 0; i < d.months.length; i++) {
      var m = d.months[i];
      if (!m || typeof m.ym !== "string" || typeof m.s !== "number" || typeof m.u !== "number" || typeof m.c !== "number" || typeof m.r !== "number") return "data";
    }
    if (!d.months.some(function (m) { return m.ym === d.latest; })) return "data";
    return optionalProblem(d) ? "data" : null;
  }
  // De webshopgegevens (alleen aanwezig als de klant ze heeft): een beschadigd of met de hand aangepast bestand geeft een foutmelding in plaats van NaN in de cijfers.
  // Dezelfde regels als dashboard_contract.py, dat de gegevens al controleert voordat de pagina wordt geschreven.
  function optionalProblem(d) {
    var have = {}; d.months.forEach(function (m) { have[m.ym] = 1; });
    function num(x) { return typeof x === "number" && isFinite(x) && x >= 0; }
    function obj(x) { return !!x && typeof x === "object" && !Array.isArray(x); }
    function nums(o, keys) { return obj(o) && keys.every(function (k) { return num(o[k]); }); }
    function perMonth(key, ok) {
      var s = d[key]; if (s === undefined) return false;
      if (!obj(s)) return true;
      return Object.keys(s).some(function (ym) { return !have[ym] || !ok(s[ym]); });
    }
    var STEPS = ["view_item", "add_to_cart", "begin_checkout", "purchase"], BASE = ["orders", "revenue", "vat", "shipping", "discount", "cancelled"], MORE = ["refunded", "refund_orders", "new", "returning", "unknown"];
    function steps(o) { return nums(o, STEPS); }
    function named(width) {
      return function (m) { return obj(m) && Object.keys(m).every(function (n) { var r = m[n]; return Array.isArray(r) && r.length === width && r.every(function (x) { return num(x); }); }); };
    }
    if (perMonth("shop", function (m) { return nums(m, BASE) && (!MORE.some(function (k) { return m[k] !== undefined; }) || nums(m, MORE)); })) return true;
    if (perMonth("funnel", function (m) { return obj(m) && steps(m.steps) && ["by_device", "by_channel"].every(function (g) { return m[g] === undefined || (obj(m[g]) && Object.keys(m[g]).every(function (n) { return steps(m[g][n]); })); }); })) return true;
    if (perMonth("product_funnel", named(3)) || perMonth("shop_lines", named(3)) || perMonth("coupons", named(3))) return true;
    var sp = d.shop_profit;
    if (sp !== undefined) {
      if (!obj(sp) || typeof sp.prices !== "boolean" || !obj(sp.months)) return true;
      return Object.keys(sp.months).some(function (ym) {
        var m = sp.months[ym];
        return !have[ym] || !nums(m, ["rev", "known", "cost"]) || !Array.isArray(m.rows) || m.rows.some(function (r) { return !Array.isArray(r) || r.length !== 4 || typeof r[0] !== "string" || !num(r[1]) || !num(r[2]) || !(r[3] === null || num(r[3])); });
      });
    }
    return false;
  }
  var FALLBACK = { schema: "This dashboard was made with another version of the data format. Please generate it again.", data: "The data of this dashboard is incomplete or damaged. Please generate it again." };
  function fatal(kind) {
    var t = (D && D.ui && D.ui[kind === "schema" ? "schema_error" : "data_error"]) || FALLBACK[kind];
    var p = document.createElement("p"); p.setAttribute("role", "alert"); p.className = "warn"; p.textContent = t; root.appendChild(p);
    document.documentElement.setAttribute("data-error", "contract:" + kind);
  }

  // ---------- hulpfuncties ----------
  function $(id) { return document.getElementById(id); }
  function el(tag, cls, txt) {
    var e = document.createElement(tag);
    if (cls) e.className = cls;
    if (txt !== undefined && txt !== null) e.textContent = txt;
    return e;
  }
  function svg(tag, attrs) {
    var e = document.createElementNS("http://www.w3.org/2000/svg", tag);
    for (var k in attrs) e.setAttribute(k, attrs[k]);
    return e;
  }
  function n0(x) { return Math.round(x).toLocaleString(LOC); }
  function eur(x) { return (D.lang === "nl" ? "€ " : "€") + n0(x); }
  function pct(x, d) { return x.toLocaleString(LOC, { minimumFractionDigits: d || 0, maximumFractionDigits: d || 0 }) + "%"; }
  function dlt(a, b) { return b ? (a - b) / b * 100 : null; }
  function sgn(x) { return x === null ? U.none : (Math.round(Math.abs(x)) === 0 ? pct(0, 0) : (x >= 0 ? "+" : "−") + pct(Math.abs(x), 0)); }       // een verschil dat naar 0% afrondt, krijgt geen teken
  function cls(x) { return x === null || Math.round(Math.abs(x)) === 0 ? "" : (x >= 0 ? "pos" : "neg"); }
  function mname(ym) { var p = ym.split("-"); return D.month_names[parseInt(p[1], 10) - 1] + " " + p[0]; }
  function mshort(ym) { return D.month_names[parseInt(ym.slice(5), 10) - 1].slice(0, 3); }
  function shift(ym, k) {
    var p = ym.split("-"), i = parseInt(p[0], 10) * 12 + parseInt(p[1], 10) - 1 + k;
    return Math.floor(i / 12) + "-" + ("0" + (i % 12 + 1)).slice(-2);
  }
  function monthsBetween(a, b) {
    var out = [], c = a;
    while (c <= b && out.length < 120) { out.push(c); c = shift(c, 1); }
    return out;
  }
  function isYm(s) { return /^\d{4}-(0[1-9]|1[0-2])$/.test(s || ""); }
  function hashParams() {
    var h = {};
    location.hash.replace(/^#/, "").split("&").forEach(function (p) {
      var kv = p.split("="); if (!kv[0]) return;
      try { h[kv[0]] = decodeURIComponent(kv.slice(1).join("=")); } catch (e) { h[kv[0]] = ""; }
    });
    return h;
  }
  // de weergave die bij het openen hoort: de standaard van het bureau (of "standaard")
  function styleDefault() { return D.styles && D.styles.indexOf(D.style_default) >= 0 ? D.style_default : "standaard"; }
  // alle dashboards op dezelfde host delen de opslag van de browser: de sleutel bevat daarom een afdruk van het adres (zonder het gedeelte na #)
  function storeKey(base) { var s = location.pathname, h = 5381; for (var i = 0; i < s.length; i++) h = ((h * 33) ^ s.charCodeAt(i)) >>> 0; return base + "-" + h.toString(36); }
  function savedStyle() { try { var v = window.localStorage.getItem(storeKey("dash-style")); return D.styles.indexOf(v) >= 0 ? v : null; } catch (e) { return null; } }
  function saveStyle(v) { try { window.localStorage.setItem(storeKey("dash-style"), v); } catch (e) { /* opslag niet beschikbaar */ } }
  function syncHash() {
    var parts = ["view=" + S.view, "type=" + S.type, "p=" + (S.key || ""), "cmp=" + S.cmp];
    if (S.cmp === "pick" && S.ckey) parts.push("c=" + S.ckey);
    if (D.styles && S.style !== styleDefault()) parts.push("st=" + S.style);
    if (S.view === "keywords") { parts.push("kw=" + S.kw); if (S.kw === "lookup" && S.q) parts.push("q=" + S.q); }
    try { history.replaceState(null, "", "#" + parts.map(function (x) { var i = x.indexOf("="); return x.slice(0, i + 1) + encodeURIComponent(x.slice(i + 1)); }).join("&")); } catch (e) { /* bestand zonder geschiedenis */ }
  }

  // ---------- perioden ----------
  var RN = { r3: 3, r6: 6, r12: 12 };
  function periodMonths(type, key) {
    var m;
    if (type === "month") return isYm(key) ? [key] : null;
    if (type === "quarter") {
      m = /^(\d{4})-Q([1-4])$/.exec(key || ""); if (!m) return null;
      var f = (parseInt(m[2], 10) - 1) * 3 + 1;
      return [0, 1, 2].map(function (i) { return m[1] + "-" + ("0" + (f + i)).slice(-2); });
    }
    if (type === "half") {
      m = /^(\d{4})-H([12])$/.exec(key || ""); if (!m) return null;
      return monthsBetween(m[1] + (m[2] === "1" ? "-01" : "-07"), m[1] + (m[2] === "1" ? "-06" : "-12"));
    }
    if (type === "year") return /^\d{4}$/.test(key || "") ? monthsBetween(key + "-01", key + "-12") : null;
    if (RN[type]) return monthsBetween(shift(D.latest, -(RN[type] - 1)), D.latest);
    if (type === "custom") {
      m = /^(\d{4}-\d{2})\.\.(\d{4}-\d{2})$/.exec(key || "");
      if (!m || !isYm(m[1]) || !isYm(m[2]) || m[1] > m[2]) return null;
      var r = monthsBetween(m[1], m[2]); return r.length > 60 ? null : r;
    }
    return null;
  }
  function labelOf(months, type, isCmp) {
    var n = months.length, f = months[0], l = months[n - 1], y = f.slice(0, 4), mo = parseInt(f.slice(5), 10);
    if (RN[type] && !isCmp) return U.r_label.replace("{n}", n).replace("{m}", mname(l));       // een vaste reeks houdt zijn eigen naam
    if (RN[type] && isCmp) return U.prev_label.replace("{n}", n);
    if (n === 1) return mname(f);
    if (n === 3 && mo % 3 === 1) return U.q_label.replace("{q}", (mo - 1) / 3 + 1).replace("{y}", y);
    if (n === 6 && (mo === 1 || mo === 7)) return U.h_label.replace("{h}", mo === 1 ? 1 : 2).replace("{y}", y);
    if (n === 12 && mo === 1) return y;
    return U.c_label.replace("{a}", mname(f)).replace("{b}", mname(l));
  }
  function periodList(type) {
    var seen = {}, out = [], i;
    if (RN[type]) return [{ key: "r", label: labelOf(periodMonths(type, "r"), type) }];
    HAVE.forEach(function (ym) {
      var y = ym.slice(0, 4), mo = parseInt(ym.slice(5), 10), key;
      if (type === "month") key = ym;
      else if (type === "quarter") key = y + "-Q" + (Math.floor((mo - 1) / 3) + 1);
      else if (type === "half") key = y + "-H" + (mo <= 6 ? 1 : 2);
      else if (type === "year") key = y;
      else return;
      if (!seen[key]) { seen[key] = 1; out.push(key); }
    });
    out.sort().reverse();
    return out.map(function (k) { return { key: k, label: labelOf(periodMonths(type, k), type) }; });
  }
  function defaultKey(type) {
    if (type === "custom") return HAVE.length ? HAVE[Math.max(0, HAVE.length - 12)] + ".." + D.latest : null;
    var l = periodList(type); return l.length ? l[0].key : null;
  }
  function validState() {
    var m = periodMonths(S.type, S.key);
    return !!m && m.some(function (ym) { return byYm[ym]; });
  }
  function currentPeriod() { var m = periodMonths(S.type, S.key); return m ? { months: m, label: labelOf(m, S.type, false) } : null; }
  function comparePeriod(p) {
    if (S.cmp === "none" || !p) return null;
    var n = p.months.length, months;
    if (S.cmp === "prev") months = monthsBetween(shift(p.months[0], -n), shift(p.months[0], -1));
    else if (S.cmp === "yoy") months = p.months.map(function (m) { return shift(m, -12); });
    else if (S.cmp === "pick") { months = periodMonths(S.type, S.ckey); if (!months || RN[S.type] || S.type === "custom") return null; }
    else return null;
    return { months: months, label: labelOf(months, S.type, true) };
  }
  // alleen de posities waar allebei data hebben; zonder vergelijking alle beschikbare maanden
  function align(p, c) {
    var a = [], b = [];
    if (!c) { a = p.months.filter(function (m) { return byYm[m]; }); return { a: a, b: null, haveA: a.length, total: p.months.length, aligned: false }; }
    for (var i = 0; i < p.months.length; i++) if (byYm[p.months[i]] && byYm[c.months[i]]) { a.push(p.months[i]); b.push(c.months[i]); }
    return { a: a, b: b, haveA: p.months.filter(function (m) { return byYm[m]; }).length, total: p.months.length, aligned: true };
  }
  function agg(months) {
    var t = { s: 0, u: 0, c: 0, r: 0, n: months.length };
    months.forEach(function (ym) { var m = byYm[ym]; if (m) { t.s += m.s; t.u += m.u; t.c += m.c; t.r += m.r; } });
    return t;
  }

  // ---------- onderdelen die elke weergave gebruikt ----------
  function note(text) { return el("p", "note", text); }
