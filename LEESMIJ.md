# Dashboard: de broncode van de pagina

Dit zijn de losse bestanden waaruit `dashboard.html` is opgebouwd. Elk bestand is een deel van één groot script; ze worden achter elkaar gezet in deze volgorde (een bestand kan functies uit een ander bestand gebruiken):

core, ui, shared, charts, view_overview, view_signals, view_actions, view_pacing, view_styles, view_analytics, view_conversion, view_shop, view_shop2, view_keywords, view_pages, view_insights, view_insights2, view_globe, view_forecast, export, layout, shell

- `dashboard_js/*.js`: de code van de pagina (onderdelen als Overzicht, Webshop, Doelen, Zoekwoorden, de grafieken en het exporteren).
- `dashboard.css`: de opmaak, inclusief de weergaven Standaard, Kaarten, Lijnen en Donker.
- De gegevens staan niet in deze bestanden; die zitten in `dashboard.html` (voorbeeldbedrijf met nepgegevens).

Webshop: `view_shop.js` (bestellingen, bestelstappen, retouren, klanten, winst) en `view_shop2.js` (producten).
Export en delen: `export.js`. Eigen indeling: `layout.js`. Weergaven: `view_styles.js`.
