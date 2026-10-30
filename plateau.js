// ============================================================================
//  PLATEAU VROOM — module One Data (OD.define 'plateau')  v1
//  v1 (30/10/2026) — Team Colin. Les maquettes « Plateau Vroom – interface
//  idéale », branchées sur les vraies données.
//  * API partagée window.__OD_PLATEAU__, posée dès le chargement :
//      poste(el, ctx, { user, liste })       -> poste de l'agent en flux
//      superviser(el, ctx, { user, ancien }) -> tour de contrôle (superviseur)
//      rapport(el, ctx, { user })            -> rapport mensuel au client
//    lead-mgmt (v82) charge ce fichier par OD.manifest.plateau.cdn_url et
//    garde ses écrans d'avant en repli (« Vue liste », « Écran détaillé »).
//  * POSTE EN FLUX : One Data sert le lead suivant (plateau_suivant : 1 h
//    d'abord, puis rappels promis, relances 48 h, leads frais, Pool), le
//    réserve à l'agent et montre tout ce qu'il faut pour l'appel : demande,
//    compte à rebours BACS, ce que le groupe sait du client (plateau_contexte :
//    parc, atelier, affaires, stock, autres demandes), guide d'appel,
//    qualification, notes (dictée vocale du navigateur). Issue de l'appel au
//    clavier (R, Q, M, L, A), puis Entrée : le geste part dans One Data et
//    dans BACS, et le lead suivant arrive.
//    La téléphonie du plateau n'est pas celle de One Data : « Appeler » passe
//    par le logiciel téléphonique du poste (lien tel:) ou copie le numéro.
//  * TOUR DE CONTRÔLE : plateau_supervision (file 1 h / 48 h, équipe),
//    plateau_prevision (charge par heure), plateau_qualite (à regarder),
//    corrections à valider, lien vers la console du prestataire téléphonique
//    (réglage plateau_url_telephonie).
//  * RAPPORT CLIENT : plateau_rapport (entonnoir demande → vente, délai 1 h,
//    concessions, origines), d'après la collecte BACS (od_bronze).
// ============================================================================
(function () {
  'use strict';
  var W = window;

  function frontWindow() {
    try { var w = W.wwLib && W.wwLib.getFrontWindow && W.wwLib.getFrontWindow(); if (w) return w; } catch (e) {}
    return W;
  }
  function odGlobal() { var FW = frontWindow(); try { return FW.OD || W.OD || null; } catch (e) { return W.OD || null; } }

  // ── Outils ───────────────────────────────────────────────────────────────
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function p2(n) { return String(n).padStart(2, '0'); }
  function ts(v) { return v ? new Date(v).getTime() : null; }
  function hh(v) { var d = new Date(v); return p2(d.getHours()) + ':' + p2(d.getMinutes()); }
  function jour(v) { var d = new Date(v); return p2(d.getDate()) + '/' + p2(d.getMonth() + 1) + (d.getFullYear() !== new Date().getFullYear() ? '/' + String(d.getFullYear()).slice(2) : ''); }
  function quand(v) { if (!v) return ''; var d = new Date(v); return d.toDateString() === new Date().toDateString() ? hh(v) : jour(v) + ' ' + hh(v); }
  function jourCourt(v) { var d = new Date(v), auj = new Date(), dem = new Date(Date.now() + 86400000);
    if (d.toDateString() === auj.toDateString()) return 'Auj.';
    if (d.toDateString() === dem.toDateString()) return 'Demain';
    return d.toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric' }).replace('.', ''); }
  function chrono(s) { s = Math.max(0, Math.round(s)); var h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60), x = s % 60; return (h ? h + ':' + p2(m) : p2(m)) + ':' + p2(x); }
  function dureeMin(m) { m = Math.max(0, m); if (m < 1) return 'à l\'instant'; if (m < 60) return Math.floor(m) + ' min'; if (m < 1440) return Math.floor(m / 60) + ' h ' + p2(Math.floor(m % 60)); return Math.floor(m / 1440) + ' j'; }
  function dureeS(s) { if (s == null) return '—'; s = Math.round(s); return s < 60 ? s + ' s' : Math.floor(s / 60) + ' min ' + p2(s % 60); }
  function plural(n, s, p) { return n + ' ' + (n > 1 ? (p || s + 's') : s); }
  function nf(n) { return n == null ? '—' : Number(n).toLocaleString('fr-FR'); }
  function pct(a, b) { return b ? Math.round(100 * a / b) : null; }
  function propre(s) {
    s = String(s || '').trim();
    if (!s || s !== s.toUpperCase()) return s;
    return s.toLowerCase().replace(/(^|[\s\-'’])([a-zà-ÿ])/g, function (m, a, b) { return a + b.toUpperCase(); });
  }
  function modeleAff(s) {
    s = String(s || '').replace(/\s+/g, ' ').trim();
    if (!s || s !== s.toUpperCase()) return s;
    return s.split(' ').map(function (w) { return /\d|-/.test(w) || w.length <= 3 ? w : w.charAt(0) + w.slice(1).toLowerCase(); }).join(' ');
  }
  function siteNom(s) { return propre(String(s || '').replace(/\s+TT\d+$/i, '')); }
  function telAff(t) {
    var d = String(t || '').replace(/[^0-9+]/g, '');
    if (/^\+33\d{9}$/.test(d)) d = '0' + d.slice(3);
    return /^0\d{9}$/.test(d) ? d.replace(/(\d{2})(?=\d)/g, '$1 ') : (t || '');
  }
  function initiales(n) { var w = String(n || '').trim().split(/\s+/); if (w.length > 1 && /^\d+$/.test(w[w.length - 1])) return (w[0][0] + w[w.length - 1]).toUpperCase(); return String(propre(n) || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(function (x) { return x[0]; }).join('').toUpperCase(); }
  function versRpcErreur(r, nom) { var e = new Error((r.error && r.error.message) || nom); e.code = r.error && r.error.code; return e; }
  function messageErreur(e) {
    var m = String((e && e.message) || e || '');
    if (/Réservé au plateau|Réservé au superviseur/.test(m)) return 'Votre rôle n\'a pas accès à cet écran.';
    if (/Failed to fetch|NetworkError/i.test(m)) return 'Connexion perdue. Réessayez dans un instant.';
    if (/session BACS|BACS n'est pas ouvert|bacs_session/i.test(m)) return 'BACS n\'est pas ouvert sur ce poste : ouvrez-le dans un onglet de ce navigateur.';
    return m || 'Erreur inattendue';
  }
  function svg(p, sz) { return '<svg viewBox="0 0 24 24" width="' + (sz || 18) + '" height="' + (sz || 18) + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>'; }
  var IC = {
    tel: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
    sms: '<path d="M4 4.5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H8l-4 3.5v-3.5H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1z"/>',
    copie: '<rect x="9" y="9" width="12" height="12" rx="2"/><path d="M5 15V5a2 2 0 0 1 2-2h10"/>',
    micro: '<rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5 11a7 7 0 0 0 14 0M12 18v3"/>',
    liste: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01"/>',
    ext: '<path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5"/>',
    print: '<path d="M6 9V3h12v6M6 18H4a1 1 0 0 1-1-1v-6a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v6a1 1 0 0 1-1 1h-2"/><rect x="6" y="14" width="12" height="7"/>'
  };

  function fabriqueRpc(sb) {
    return async function rpc(nom, args) {
      var r = await sb.rpc(nom, args || {});
      if (r.error) throw versRpcErreur(r, nom);
      return r.data;
    };
  }
  function reveillerBacs() { try { var o = odGlobal(); if (o && o.bacs && typeof o.bacs.demander === 'function') o.bacs.demander('vider_file', {}, 4000); } catch (e) {} }

  // ── Toast ────────────────────────────────────────────────────────────────
  function toast(doc, msg, err) {
    var t = doc.getElementById('odpl-toast');
    if (!t) { t = doc.createElement('div'); t.id = 'odpl-toast'; t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite'); doc.body.appendChild(t); }
    t.className = err ? 'err on' : 'on'; t.textContent = msg;
    clearTimeout(t.__h); t.__h = setTimeout(function () { t.className = err ? 'err' : ''; }, err ? 6000 : 3500);
  }

  // ── Styles (charte One Data, plus d'air que la v1 de la maquette) ────────
  function injecterCss(doc) {
    if (doc.getElementById('odpl-css')) return;
    var l = doc.createElement('link'); l.rel = 'stylesheet';
    l.href = 'https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700;800;900&display=swap';
    doc.head.appendChild(l);
    var st = doc.createElement('style'); st.id = 'odpl-css';
    st.textContent = [
      '.odpl{--bl:#2a5ea9;--bl2:#1f4a85;--tx:#1c2b45;--tx2:#4b5563;--ln:#dce6f3;--ln2:#eef2f8;--bg:#eef3fa;--bg2:#f6f9fd;--bgb:#eef4fc;--ve:#53bda7;--ve2:#2c7a68;--vebg:#eaf7f4;--or:#fac055;--or2:#8a5a00;--orbg:#fff6e0;--ro:#e24b4a;--ro2:#b23433;--robg:#fdeeee;',
      'font-family:"Nunito Sans",system-ui,sans-serif;color:var(--tx);background:var(--bg);min-height:100%;font-size:14px;line-height:1.5;-webkit-font-smoothing:antialiased}',
      '.odpl *,.odpl *::before,.odpl *::after{box-sizing:border-box}',
      '.odpl button{font:inherit;cursor:pointer}.odpl button:disabled{cursor:not-allowed;opacity:.55}',
      '.odpl :focus-visible{outline:3px solid #9cc0ee;outline-offset:2px}',
      '.odpl h1,.odpl h2,.odpl h3{margin:0;font-weight:900;color:var(--bl2);letter-spacing:-.01em}',
      '.odpl .muted{color:var(--tx2)}.odpl .small{font-size:12.5px}',
      // en-tête
      '.odpl .hd{display:flex;flex-wrap:wrap;align-items:center;gap:16px 22px;padding:14px 28px;background:var(--bl2);color:#fff}',
      '.odpl .hd .logo{display:flex;align-items:center;gap:12px}.odpl .hd .logo i{width:34px;height:34px;border-radius:10px;background:#fff;color:var(--bl2);font-style:normal;font-weight:900;display:flex;align-items:center;justify-content:center;font-size:13px}',
      '.odpl .hd .logo b{font-size:16px;font-weight:900}.odpl .hd .logo small{display:block;font-size:12px;color:#c9daf1;font-weight:700}',
      '.odpl .hd .sp{flex:1}',
      '.odpl .seg{display:flex;gap:4px;background:rgba(255,255,255,.12);border-radius:12px;padding:4px}',
      '.odpl .seg button{font-size:13px;font-weight:800;padding:8px 14px;border-radius:9px;border:0;background:transparent;color:#dce8f7;min-height:38px}',
      '.odpl .seg button.on{background:var(--ve);color:#0f3d33}.odpl .seg button.pause.on{background:var(--or);color:#4a3000}',
      '.odpl .kp{display:flex;gap:26px;flex-wrap:wrap;font-size:12px;color:#c9daf1}.odpl .kp b{display:block;font-size:18px;color:#fff;font-weight:900;line-height:1.2}',
      '.odpl .who{display:flex;align-items:center;gap:10px;padding-left:20px;border-left:1px solid rgba(255,255,255,.2)}',
      '.odpl .who i{width:36px;height:36px;border-radius:50%;background:#acc5e4;color:var(--bl2);font-style:normal;font-weight:900;display:flex;align-items:center;justify-content:center;font-size:12.5px}',
      '.odpl .who b{display:block;font-size:13px}.odpl .who small{font-size:12px;color:#c9daf1}.odpl .who small.ko{color:#ffd28a}',
      '.odpl .hbtn{font-size:13px;font-weight:800;padding:9px 14px;border-radius:10px;border:1px solid rgba(255,255,255,.35);background:transparent;color:#fff;min-height:40px;display:inline-flex;align-items:center;gap:8px;text-decoration:none}',
      '.odpl .hbtn:hover{background:rgba(255,255,255,.1)}.odpl .hbtn.w{background:#fff;color:var(--bl2);border-color:#fff}',
      // bande « après cet appel »
      '.odpl .strip{display:flex;flex-wrap:wrap;gap:10px 12px;align-items:center;padding:12px 28px;background:#fff;border-bottom:1px solid var(--ln);font-size:13px}',
      '.odpl .strip>b{color:var(--bl2);font-weight:900}',
      '.odpl .pill{padding:4px 12px;border-radius:999px;font-weight:800;font-size:12.5px;white-space:nowrap}',
      '.odpl .pill.r{background:var(--robg);color:var(--ro2)}.odpl .pill.o{background:var(--orbg);color:var(--or2)}.odpl .pill.b{background:var(--bgb);color:var(--bl2)}.odpl .pill.v{background:var(--vebg);color:var(--ve2)}',
      // bandeaux
      '.odpl .ban{margin:18px 28px 0;padding:14px 18px;border-radius:14px;display:flex;flex-wrap:wrap;gap:8px 16px;align-items:center;font-size:13.5px}',
      '.odpl .ban.warn{background:var(--orbg);color:#5c3d00;border:1px solid #f3dca2}.odpl .ban.err{background:var(--robg);color:var(--ro2);border:1px solid #f3c4c3}',
      // grille principale
      '.odpl .grid3{display:grid;grid-template-columns:minmax(0,320px) minmax(0,1fr) minmax(0,380px);grid-template-areas:"dem app iss";gap:24px;padding:24px 28px 40px;align-items:start}',
      '.odpl .grid3>.c-dem{grid-area:dem}.odpl .grid3>.c-app{grid-area:app}.odpl .grid3>.c-iss{grid-area:iss}',
      '@media (max-width:1280px){.odpl .grid3{grid-template-columns:minmax(0,1fr) minmax(0,340px);grid-template-areas:"dem iss" "app iss"}.odpl .grid3>.c-dem{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));align-items:start}.odpl .grid3>.c-iss{position:sticky;top:12px}}',
      '@media (max-width:860px){.odpl .grid3{grid-template-columns:minmax(0,1fr);grid-template-areas:"dem" "app" "iss"}.odpl .grid3>.c-dem{display:flex}.odpl .grid3>.c-iss{position:static}}',
      '@media (max-width:860px){.odpl .grid3{padding:16px}.odpl .hd,.odpl .strip{padding-left:16px;padding-right:16px}.odpl .ban{margin-left:16px;margin-right:16px}}',
      '.odpl .col{display:flex;flex-direction:column;gap:18px;min-width:0}',
      '.odpl .card{background:#fff;border:1px solid var(--ln);border-radius:18px;padding:20px 22px}',
      '.odpl .card.focus{border:2px solid var(--bl)}',
      '.odpl .lab{white-space:nowrap;font-size:11px;font-weight:900;letter-spacing:.07em;text-transform:uppercase;color:var(--tx2);margin-bottom:10px}',
      '.odpl .lab.r{color:var(--ro2)}.odpl .lab.o{color:var(--or2)}.odpl .lab.b{color:var(--bl)}',
      '.odpl .row{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid var(--ln2);font-size:13px}.odpl .row:last-child{border-bottom:0}',
      '.odpl .row>span{color:var(--tx2)}.odpl .row>b{text-align:right}',
      '.odpl .vide{font-size:13px;color:var(--tx2);font-style:italic}',
      // demande
      '.odpl .who-lead h1{font-size:24px;margin:8px 0 2px;line-height:1.2}',
      '.odpl .ring{display:flex;align-items:center;gap:14px;margin-top:16px}',
      '.odpl .ring .c{width:70px;height:70px;border-radius:50%;display:flex;align-items:center;justify-content:center;flex:0 0 auto}',
      '.odpl .ring .c span{width:54px;height:54px;border-radius:50%;background:#fff;display:flex;align-items:center;justify-content:center;font-weight:900;font-size:13px}',
      '.odpl .ask{margin-top:16px;background:var(--bgb);border-radius:12px;padding:12px 14px;font-size:13.5px}.odpl .ask b{display:block;color:var(--bl2);margin-bottom:3px}',
      '.odpl .tl{display:flex;gap:12px;padding:6px 0;font-size:12.5px}.odpl .tl span{flex:0 0 74px;color:var(--tx2);font-weight:700}',
      // barre d'appel
      '.odpl .call{background:var(--bl2);color:#fff;border-radius:18px;padding:18px 22px;display:flex;flex-wrap:wrap;align-items:center;gap:14px}',
      '.odpl .call .dot{width:12px;height:12px;border-radius:50%;background:var(--ve);box-shadow:0 0 0 6px rgba(83,189,167,.25)}',
      '.odpl .call .t{flex:1 1 240px;min-width:0}.odpl .call .bt{display:flex;gap:8px;flex-wrap:wrap;flex:0 0 auto}.odpl .call .t b{display:block;font-size:19px;font-weight:900}.odpl .call .t small{font-size:12.5px;color:#c9daf1}',
      '.odpl .cbtn{font-size:13px;font-weight:800;padding:10px 16px;border-radius:11px;border:1px solid rgba(255,255,255,.35);background:transparent;color:#fff;min-height:44px;display:inline-flex;align-items:center;gap:8px}',
      '.odpl .cbtn:hover{background:rgba(255,255,255,.1)}.odpl .cbtn.vert{background:var(--ve);border-color:var(--ve);color:#0f3d33;font-weight:900}',
      // guide
      '.odpl .steps{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:10px;margin:4px 0 14px}',
      '.odpl .steps button{padding:10px 12px;border-radius:11px;border:0;background:#f2f6fc;color:var(--tx2);font-size:12.5px;font-weight:800;text-align:left;min-height:42px}',
      '.odpl .steps button.ok{background:var(--vebg);color:var(--ve2)}.odpl .steps button.on{background:var(--bl);color:#fff}',
      '.odpl .say{background:var(--bg2);border-radius:14px;padding:14px 16px;font-size:14.5px;line-height:1.6}',
      '.odpl .qgrid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px 20px;margin-top:18px}',
      '@media (max-width:620px){.odpl .qgrid,.odpl .duo{grid-template-columns:minmax(0,1fr)!important}}',
      '.odpl .chips{display:flex;flex-wrap:wrap;gap:7px}',
      '.odpl .chip{font-size:12.5px;font-weight:800;padding:7px 12px;border-radius:10px;min-height:36px;border:1.5px solid #c9daf1;background:#fff;color:var(--bl2)}',
      '.odpl .chip:hover{background:var(--bgb)}.odpl .chip.on{border-color:var(--bl);background:var(--bl);color:#fff}',
      '.odpl input[type=text],.odpl input[type=datetime-local],.odpl select,.odpl textarea{font:inherit;font-size:13.5px;color:var(--tx);border:1.5px solid #c9daf1;border-radius:10px;padding:9px 11px;background:#fff;width:100%;min-height:40px}',
      '.odpl textarea{resize:vertical;line-height:1.5}',
      '.odpl .duo{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:18px}',
      '.odpl .dl{margin:0;padding-left:18px;font-size:13px;line-height:1.65}.odpl .dl li{margin-bottom:4px}',
      '.odpl .badge{width:24px;height:24px;border-radius:7px;background:var(--bl);color:#fff;font-size:11px;font-weight:900;display:inline-flex;align-items:center;justify-content:center;margin-right:8px}',
      '.odpl .mic{font-size:12px;font-weight:800;border:0;background:transparent;color:var(--tx2);display:inline-flex;gap:6px;align-items:center;padding:4px 8px;border-radius:8px}',
      '.odpl .mic.on{color:var(--ve2);background:var(--vebg)}',
      // issues
      '.odpl .iss{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}',
      '.odpl .is{display:flex;flex-direction:column;align-items:flex-start;gap:2px;padding:12px 14px;border-radius:13px;min-height:60px;text-align:left;border:1.5px solid #c9daf1;background:#fff;color:var(--bl2)}',
      '.odpl .is b{font-size:14px;font-weight:900}.odpl .is small{font-size:11px;opacity:.8;font-weight:700}',
      '.odpl .is:hover{background:var(--bgb)}.odpl .is.on{border-color:var(--bl);background:var(--bl);color:#fff}',
      '.odpl .is.ko{border-color:#f3c4c3;color:var(--ro2)}.odpl .is.ko.on{background:var(--ro2);border-color:var(--ro2);color:#fff}',
      '.odpl .is.pass{border-style:dashed;color:var(--tx2)}',
      '.odpl .slots{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:8px}',
      '.odpl .slot{display:flex;flex-direction:column;align-items:flex-start;gap:1px;padding:9px 11px;border-radius:11px;min-height:50px;text-align:left;font-size:13px;border:1.5px solid #c9daf1;background:#fff;color:var(--bl2)}',
      '.odpl .slot small{font-size:11.5px;color:inherit;opacity:.85}.odpl .slot.on{border-color:var(--bl);background:var(--bl);color:#fff}',
      '.odpl .ck{display:flex;gap:10px;align-items:flex-start;margin-top:10px;font-size:13px}.odpl .ck input{accent-color:var(--bl);width:17px;height:17px;margin-top:2px;flex:0 0 auto}',
      '.odpl .go{width:100%;font-size:16px;font-weight:900;padding:16px;border-radius:15px;border:0;background:var(--bl);color:#fff;min-height:58px;box-shadow:0 8px 22px rgba(42,94,169,.28)}',
      '.odpl .go:hover{background:var(--bl2)}.odpl .go.ko{background:var(--ro2);box-shadow:0 8px 22px rgba(178,52,51,.22)}',
      '.odpl .note-go{font-size:12px;color:var(--tx2);text-align:center;margin-top:8px}',
      '.odpl .f{margin-top:14px}.odpl .f>label{display:block;font-size:11px;font-weight:900;letter-spacing:.06em;text-transform:uppercase;color:var(--tx2);margin-bottom:6px}',
      // écran d'attente
      '.odpl .wait{max-width:760px;margin:48px auto;padding:0 20px;text-align:center}',
      '.odpl .wait h2{font-size:28px;margin-bottom:8px}',
      '.odpl .tiles{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px;margin:28px 0}',
      '@media (max-width:700px){.odpl .tiles{grid-template-columns:repeat(2,minmax(0,1fr))}}',
      '.odpl .tile{background:#fff;border:1px solid var(--ln);border-radius:16px;padding:16px}.odpl .tile b{display:block;font-size:28px;font-weight:900;color:var(--bl2)}.odpl .tile.r b{color:var(--ro2)}.odpl .tile.o b{color:var(--or2)}',
      '.odpl .bigbtn{font-size:17px;font-weight:900;padding:18px 34px;border-radius:16px;border:0;background:var(--bl);color:#fff;box-shadow:0 10px 26px rgba(42,94,169,.3);min-height:60px}',
      '.odpl .lnk{border:0;background:transparent;color:var(--bl);font-weight:800;font-size:13px;text-decoration:underline;padding:6px}',
      '.odpl kbd{font:inherit;font-size:11px;font-weight:900;padding:1px 6px;border-radius:5px;border:1px solid currentColor;opacity:.75}',
      // tour de contrôle
      '.odpl .kpis{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:14px}',
      '@media (max-width:1180px){.odpl .kpis{grid-template-columns:repeat(3,minmax(0,1fr))}}@media (max-width:640px){.odpl .kpis{grid-template-columns:repeat(2,minmax(0,1fr))}}',
      '.odpl .kpi{background:#fff;border:1px solid var(--ln);border-radius:16px;padding:14px 16px}',
      '.odpl .kpi .l{font-size:12px;font-weight:800;color:var(--tx2)}.odpl .kpi .v{font-size:26px;font-weight:900;color:var(--bl2);line-height:1.25}',
      '.odpl .kpi .v.g{color:var(--ve2)}.odpl .kpi .v.r{color:var(--ro2)}.odpl .kpi .v.o{color:var(--or2)}',
      '.odpl .bar{height:6px;background:#e6eef8;border-radius:3px;overflow:hidden;margin:7px 0 5px}.odpl .bar i{display:block;height:100%;border-radius:3px;background:var(--bl)}',
      '.odpl .bar i.g{background:var(--ve)}.odpl .bar i.r{background:var(--ro)}.odpl .bar i.o{background:var(--or)}',
      '.odpl .tour{max-width:1480px;margin:0 auto;padding:24px 28px 40px;display:flex;flex-direction:column;gap:22px}',
      '.odpl .g3{display:grid;grid-template-columns:minmax(0,340px) minmax(0,1fr) minmax(0,360px);gap:22px;align-items:start}',
      '@media (max-width:1280px){.odpl .g3{grid-template-columns:minmax(0,320px) minmax(0,1fr)}.odpl .g3>.col3{grid-column:1/-1}}@media (max-width:860px){.odpl .g3{grid-template-columns:minmax(0,1fr)}.odpl .tour{padding:16px}}',
      '.odpl .panel{background:#fff;border:1px solid var(--ln);border-radius:18px;overflow:hidden}',
      '.odpl .panel>.ph{padding:14px 18px;border-bottom:1px solid var(--ln2);display:flex;justify-content:space-between;align-items:baseline;gap:10px}',
      '.odpl .panel>.ph b{color:var(--bl2);font-size:15px;font-weight:900}',
      '.odpl .fl{padding:12px 18px;border-bottom:1px solid var(--ln2)}.odpl .fl:last-child{border-bottom:0}',
      '.odpl .fl .a{display:flex;justify-content:space-between;gap:8px;font-size:13px}.odpl .fl .d{font-size:12px;color:var(--tx2);margin:2px 0 7px}',
      '.odpl .fl .z{display:flex;justify-content:space-between;align-items:center;font-size:11.5px;color:var(--tx2);margin-top:5px}',
      '.odpl .mini{font-size:12px;font-weight:800;padding:6px 11px;border-radius:9px;border:1.5px solid #c9daf1;background:#fff;color:var(--bl2);min-height:32px}',
      '.odpl .mini:hover{background:var(--bgb)}.odpl .mini.p{border:0;background:var(--bl);color:#fff}.odpl .mini.k{border-color:#f3c4c3;color:var(--ro2)}',
      '.odpl .team{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px}@media (max-width:620px){.odpl .team{grid-template-columns:minmax(0,1fr)}}',
      '.odpl .ag{background:#fff;border:1px solid var(--ln);border-radius:16px;padding:14px 16px}.odpl .ag.warn{border-color:var(--or)}.odpl .ag.off{opacity:.7}',
      '.odpl .ag .t{display:flex;align-items:center;gap:12px}.odpl .ag .av{width:38px;height:38px;border-radius:50%;font-weight:900;font-size:12px;display:flex;align-items:center;justify-content:center;border:2px solid currentColor;flex:0 0 auto}',
      '.odpl .ag .n{flex:1;min-width:0}.odpl .ag .n b{display:block;font-size:14px}.odpl .ag .n small{font-size:12px;font-weight:800}',
      '.odpl .ag .m{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:6px;margin-top:12px;font-size:11.5px;color:var(--tx2)}.odpl .ag .m b{display:block;font-size:16px;color:var(--bl2)}',
      '.odpl .ag .acts{display:flex;gap:6px;margin-top:12px;flex-wrap:wrap}',
      '.odpl .hist{display:flex;align-items:flex-end;gap:6px;height:130px;border-bottom:1px solid #e6eef8}',
      '.odpl .hist>div{flex:1;height:100%;position:relative}.odpl .hist i{position:absolute;bottom:0;border-radius:3px 3px 0 0}',
      '.odpl .hist i.p{left:0;right:0;background:#dce8f7}.odpl .hist i.r{left:25%;right:25%;background:var(--bl2)}',
      '.odpl .hx{display:flex;gap:6px;font-size:10.5px;color:var(--tx2);margin-top:4px}.odpl .hx span{flex:1;text-align:center}',
      '.odpl .qi{display:flex;gap:10px;align-items:flex-start;padding:10px 0;border-bottom:1px solid var(--ln2);font-size:12.5px}.odpl .qi:last-child{border-bottom:0}',
      '.odpl .qi .x{flex:1}.odpl .qi .x b{display:block}',
      '.odpl .tag{font-size:10.5px;font-weight:900;letter-spacing:.04em;text-transform:uppercase;padding:2px 7px;border-radius:6px;background:var(--orbg);color:var(--or2);white-space:nowrap}.odpl .tag.r{background:var(--robg);color:var(--ro2)}',
      // fenêtre
      '.odpl-ov{position:fixed;inset:0;background:rgba(28,43,69,.38);z-index:99990;display:flex;align-items:center;justify-content:center;padding:16px;font-family:"Nunito Sans",system-ui,sans-serif}',
      '.odpl-ov .bx{background:#fff;border-radius:18px;max-width:520px;width:100%;max-height:86vh;overflow:auto;padding:22px 24px;box-shadow:0 20px 50px rgba(31,74,133,.3);color:#1c2b45}',
      '.odpl-ov h3{margin:0 0 6px;font-size:18px;color:#1f4a85;font-weight:900}.odpl-ov p{margin:0 0 14px;font-size:13px;color:#4b5563}',
      '.odpl-ov .it{display:flex;justify-content:space-between;align-items:center;gap:10px;width:100%;text-align:left;padding:11px 14px;border-radius:12px;border:1.5px solid #dce6f3;background:#fff;margin-bottom:8px;font:inherit;font-size:13.5px;cursor:pointer;color:#1c2b45}',
      '.odpl-ov .it:hover{border-color:#2a5ea9;background:#eef4fc}.odpl-ov .it small{color:#4b5563;font-size:12px}',
      '.odpl-ov textarea{font:inherit;font-size:13.5px;width:100%;border:1.5px solid #c9daf1;border-radius:10px;padding:10px;min-height:90px;box-sizing:border-box}',
      '.odpl-ov .ft{display:flex;justify-content:flex-end;gap:8px;margin-top:14px}',
      '.odpl-ov .b{font:inherit;font-size:13px;font-weight:800;padding:9px 16px;border-radius:10px;border:1.5px solid #c9daf1;background:#fff;color:#1f4a85;cursor:pointer;min-height:40px}.odpl-ov .b.p{border:0;background:#2a5ea9;color:#fff}',
      // rapport
      '.odpl.rp{background:#fff}',
      '.odpl .rph{background:var(--bl2);color:#fff;padding:32px 40px 80px}.odpl .rph .in{max-width:1280px;margin:0 auto;display:flex;flex-wrap:wrap;gap:18px;align-items:flex-start}',
      '.odpl .rph .k{font-size:13px;font-weight:800;color:#c9daf1;letter-spacing:.06em;text-transform:uppercase}',
      '.odpl .rph h1{color:#fff;font-size:36px;line-height:1.15;margin:10px 0 8px}.odpl .rph .s{font-size:16px;color:#dce8f7}',
      '.odpl .rpm{max-width:1280px;margin:-52px auto 0;padding:0 40px 48px;display:flex;flex-direction:column;gap:24px}',
      '@media (max-width:760px){.odpl .rph{padding:24px 16px 70px}.odpl .rph h1{font-size:26px}.odpl .rpm{padding:0 16px 32px}}',
      '.odpl .rpt{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}@media (max-width:900px){.odpl .rpt{grid-template-columns:repeat(2,minmax(0,1fr))}}',
      '.odpl .rpt>div{background:#fff;border-radius:18px;padding:20px;box-shadow:0 10px 30px rgba(31,74,133,.14);border:1px solid #e6eef8}',
      '.odpl .rpt .l{font-size:13px;font-weight:800;color:var(--tx2)}.odpl .rpt .v{font-size:34px;font-weight:900;color:var(--bl2);margin:4px 0}.odpl .rpt .c{font-size:13px;color:var(--ve2);font-weight:800}',
      '.odpl .sec{border:1px solid #e6eef8;border-radius:20px;padding:24px}.odpl .sec h2{font-size:20px}',
      '.odpl .sech{display:flex;justify-content:space-between;align-items:baseline;flex-wrap:wrap;gap:8px;margin-bottom:18px}',
      '.odpl .ent{display:grid;grid-template-columns:repeat(6,minmax(0,1fr));gap:12px;align-items:end}@media (max-width:760px){.odpl .ent{grid-template-columns:repeat(3,minmax(0,1fr))}}',
      '.odpl .ent .v{font-size:22px;font-weight:900;color:var(--bl2)}.odpl .ent .h{height:150px;display:flex;align-items:flex-end}.odpl .ent .h i{width:100%;border-radius:8px 8px 0 0;background:#acc5e4}',
      '.odpl .ent .l{font-size:13px;font-weight:800}.odpl .ent .t{font-size:12px;color:var(--tx2)}',
      '.odpl table.t{width:100%;border-collapse:collapse;font-size:14px;min-width:640px}.odpl table.t th{text-align:left;font-size:12px;text-transform:uppercase;letter-spacing:.04em;color:var(--tx2);padding:10px 12px;font-weight:800}',
      '.odpl table.t td{padding:11px 12px;border-top:1px solid #f0f4fa}.odpl table.t td:first-child,.odpl table.t th:first-child{padding-left:22px}',
      '.odpl .og{display:grid;grid-template-columns:minmax(0,1fr) 100px 60px;gap:12px;align-items:center;padding:7px 0;font-size:13px}',
      '.odpl .og .bar{margin:0;height:8px}',
      '@media print{.odpl .noprint{display:none!important}.odpl .rph{-webkit-print-color-adjust:exact;print-color-adjust:exact}}',
      // toast
      '#odpl-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%) translateY(20px);opacity:0;transition:.2s;background:#1f4a85;color:#fff;padding:12px 18px;border-radius:12px;font:700 14px "Nunito Sans",system-ui,sans-serif;z-index:99999;max-width:min(560px,92vw);box-shadow:0 10px 30px rgba(31,74,133,.3);pointer-events:none}',
      '#odpl-toast.on{opacity:1;transform:translateX(-50%)}#odpl-toast.err{background:#b23433}',
      '@media (prefers-reduced-motion:reduce){#odpl-toast{transition:none}}'
    ].join('\n');
    doc.head.appendChild(st);
  }

  // ── Fenêtre simple ───────────────────────────────────────────────────────
  function fenetre(doc, html, brancher) {
    var ov = doc.createElement('div'); ov.className = 'odpl-ov'; ov.setAttribute('role', 'dialog'); ov.setAttribute('aria-modal', 'true');
    ov.innerHTML = '<div class="bx">' + html + '</div>';
    function fermer() { ov.remove(); doc.removeEventListener('keydown', esc_); }
    function esc_(e) { if (e.key === 'Escape') fermer(); }
    ov.addEventListener('mousedown', function (e) { if (e.target === ov) fermer(); });
    doc.addEventListener('keydown', esc_);
    doc.body.appendChild(ov);
    brancher(ov, fermer);
    var f = ov.querySelector('textarea, button'); if (f) try { f.focus(); } catch (e) {}
    return fermer;
  }

  // ==========================================================================
  //  1. LE POSTE DE L'AGENT, EN FLUX
  // ==========================================================================
  var MOTIFS = ['Non intéressé par l\'offre', 'Non intéressé par le produit', 'Conserve son véhicule', 'Trop tôt',
    'Achète ailleurs', 'Véhicule réservé déjà vendu', 'Délai de livraison trop important', 'Erreur du client', 'Doublon', 'Injoignable permanent'];
  var QUALIF = [
    ['projet', 'Projet', ['Achat VN', 'Achat VO', 'Essai', 'Information']],
    ['echeance', 'Échéance', ['< 1 mois', '1–3 mois', '> 3 mois']],
    ['reprise', 'Reprise', ['Oui', 'Non', 'À voir']],
    ['financement', 'Financement', ['Comptant', 'Crédit', 'LOA', 'LLD', 'À voir']]
  ];
  var ISSUES = [
    ['rdv', 'RDV pris', 'R', ''], ['qualifie', 'Qualifié, sans RDV', 'Q', ''],
    ['injoignable', 'Pas joint · rappeler', 'M', ''], ['long_terme', 'Projet > 3 mois', 'L', ''],
    ['abandon', 'Pas intéressé', 'A', 'ko'], ['passer', 'Passer ce lead', 'S', 'pass']
  ];
  var RAISON = {
    '1h': ['Demande client · 1 h', 'r', 'pénalité constructeur au-delà'],
    '48h': ['Relance concession · 48 h', 'o', 'délai BACS'],
    'rappel': ['Rappel promis', 'o', 'heure promise au client'],
    'frais': ['Demande du jour', 'b', ''],
    'pool': ['Pool', 'b', '']
  };

  async function poste(el, ctx, opt) {
    opt = opt || {};
    var doc = el.ownerDocument || document, FW = frontWindow();
    var sb = ctx.supabase, rpc = fabriqueRpc(sb);
    var user = opt.user || ctx.user || {};
    var S = {
      vue: 'attente', occupe: false, pause: false, enchainer: true,
      cur: null, fiche: null, cx: null, sites: null, site: null, vendeurs: {}, vendeur: '',
      creneaux: {}, slot: null, issue: null, q: {}, modele: '', note: '', rappel: '2h', rappelDate: '', smsBacs: true, mailBacs: false,
      motif: MOTIFS[0], etape: 0, passes: [], file: [], cpt: {}, stats: {}, bacs: null, debut: null, dernier: null, liens: null, dictee: false
    };
    injecterCss(doc);
    el.innerHTML = '';
    var root = doc.createElement('div'); root.className = 'odpl'; el.appendChild(root);

    function bacsBloque() { return !!(S.bacs && S.bacs.ecrire_bacs && S.bacs.canal !== 'moi'); }

    // ── Données ────────────────────────────────────────────────────────────
    async function chargerEntour() {
      var r = await Promise.all([
        rpc('plateau_mes_stats', { p_id_user: null }).catch(function () { return S.stats; }),
        rpc('plateau_bacs_etat').catch(function () { return S.bacs; }),
        rpc('plateau_suivant', { p_passer: S.passes.length ? S.passes : null, p_reserver: false }).catch(function () { return null; })
      ]);
      S.stats = r[0] || {}; S.bacs = r[1]; if (r[2]) { S.file = r[2].file || []; S.cpt = r[2]; }
    }
    async function servir() {
      if (S.occupe) return;
      if (bacsBloque()) { toast(doc, 'BACS n\'est pas ouvert sur ce poste : ouvrez-le dans un onglet de ce navigateur, avec l\'extension One Data.', true); return; }
      S.occupe = true; S.vue = 'charge'; render();
      try {
        var r = await rpc('plateau_suivant', { p_passer: S.passes.length ? S.passes : null, p_reserver: true });
        S.file = r.file || []; S.cpt = r;
        if (!r.sf) { S.vue = 'vide'; S.cur = null; return; }
        reveillerBacs();
        S.cur = r; S.debut = Date.now();
        Object.assign(S, { fiche: null, cx: null, sites: null, site: null, vendeur: '', slot: null, issue: null, q: {}, note: '', rappel: '2h', rappelDate: '', smsBacs: true, mailBacs: false, motif: MOTIFS[0], etape: 0 });
        S.vue = 'lead';
        var d = await Promise.all([
          rpc('plateau_fiche', { p_sf_lead_id: r.sf }).catch(function () { return null; }),
          rpc('plateau_contexte', { p_sf_lead_id: r.sf }).catch(function () { return null; }),
          rpc('plateau_sites', { p_sf_lead_id: r.sf }).catch(function () { return []; })
        ]);
        S.fiche = d[0] || {}; S.cx = d[1] || {}; S.sites = d[2] || [];
        S.site = S.sites.length ? String(S.sites[0].id_site) : null;
        S.modele = modeleAff(S.fiche.modele || (r.lead && r.lead.modele) || '');
        var dem = String(S.fiche.type_demande || '').toLowerCase();
        S.q.projet = /essai/.test(dem) ? 'Essai' : (String(S.fiche.nature || '').toUpperCase() === 'VO' ? 'Achat VO' : (/info/.test(dem) ? 'Information' : 'Achat VN'));
      } catch (e) {
        S.vue = 'attente'; toast(doc, messageErreur(e), true);
      } finally { S.occupe = false; render(); }
    }
    async function chargerCreneaux(site) {
      if (!site || S.creneaux[site]) return;
      S.creneaux[site] = 'charge';
      try { S.creneaux[site] = await rpc('plateau_creneaux', { p_id_site: Number(site), p_jours: 6, p_limite: 10 }) || []; }
      catch (e) { S.creneaux[site] = []; }
      render();
    }
    async function chargerVendeurs(site) {
      if (!site || S.vendeurs[site]) return;
      S.vendeurs[site] = 'charge';
      try { S.vendeurs[site] = await rpc('plateau_vendeurs', { p_id_site: Number(site) }) || []; }
      catch (e) { S.vendeurs[site] = []; }
      render();
    }

    // ── Rendu ──────────────────────────────────────────────────────────────
    function enTete() {
      var st = S.stats || {}, b = S.bacs || {};
      var etat = S.pause ? 'Pause' : (S.vue === 'lead' ? 'Sur un lead <span data-tick="sur">' + chrono((Date.now() - S.debut) / 1000) + '</span>' : 'Disponible');
      return '<header class="hd"><div class="logo"><i>OD</i><div><b>Plateau Vroom</b><small>Poste agent · leads servis automatiquement</small></div></div>'
        + '<div class="seg" role="group" aria-label="Mon état"><button type="button" class="' + (!S.pause ? 'on' : '') + '" data-a="dispo">● ' + etat + '</button>'
        + '<button type="button" class="pause' + (S.pause ? ' on' : '') + '" data-a="pause">Pause</button></div>'
        + '<div class="sp"></div>'
        + '<div class="kp"><div><b>' + nf(st.traites || 0) + '</b>traités</div><div><b>' + nf(st.rdv || 0) + '</b>RDV posés</div>'
        + '<div><b>' + nf(st.qualifies || 0) + '</b>qualifiés</div><div><b>' + dureeS(st.prise_1h_s) + '</b>prise en charge 1 h</div><div><b>' + dureeS(st.dmt_s) + '</b>durée moyenne</div></div>'
        + '<button type="button" class="hbtn" data-a="liste" title="Liste des leads, nouveau lead, mes actions">' + svg(IC.liste, 16) + 'Vue liste</button>'
        + '<div class="who"><i>' + esc(initiales(user.nomComplet || ((user.prenom || '') + ' ' + (user.nom || '')))) + '</i><div><b>' + esc(propre(user.prenom || user.nomComplet || 'Moi')) + '</b>'
        + (b.ecrire_bacs ? (b.canal === 'moi' ? '<small>BACS ✓</small>' : '<small class="ko">BACS fermé</small>') : '<small>BACS non requis</small>') + '</div></div></header>';
    }
    function bandeBacs() {
      if (!bacsBloque()) return '';
      return '<div class="ban warn" role="status"><b>BACS est fermé sur ce poste.</b><span>Chaque lead servi est accepté dans BACS à votre nom : ouvrez BACS dans un onglet de ce navigateur, avec l\'extension One Data. Le poste se débloque dès qu\'il répond.</span></div>';
    }
    function pilule(f) {
      var r = RAISON[f.raison] || RAISON.pool, txt;
      if (f.raison === '1h' || f.raison === '48h') {
        var rest = f.echeance ? (ts(f.echeance) - Date.now()) / 1000 : null;
        txt = (f.raison === '1h' ? '1 h' : '48 h') + ' · ' + propre(f.nom) + (rest == null ? '' : rest > 0 ? ' · reste ' + (rest < 3600 ? chrono(rest) : dureeMin(rest / 60)) : ' · hors délai');
      } else if (f.raison === 'rappel') txt = 'Rappel promis ' + quand(f.rappel_le) + ' · ' + propre(f.nom);
      else txt = propre(f.nom) + (f.demande ? ' · ' + f.demande : '');
      return '<span class="pill ' + r[1] + '">' + esc(txt) + '</span>';
    }
    function bande() {
      var cur = S.cur && S.cur.sf, f = (S.file || []).filter(function (x) { return x.sf !== cur && S.passes.indexOf(x.sf) === -1; }).slice(0, 4), c = S.cpt || {};
      var reste = [];
      if (c.n1h) reste.push(plural(c.n1h, 'demande 1 h', 'demandes 1 h'));
      if (c.nrappels) reste.push(plural(c.nrappels, 'rappel dû', 'rappels dus'));
      if (c.n48h) reste.push(plural(c.n48h, 'relance 48 h', 'relances 48 h'));
      if (c.npool) reste.push(plural(c.npool, 'lead au Pool', 'leads au Pool'));
      return '<div class="strip"><b>' + (S.vue === 'lead' ? 'Après cet appel :' : 'En attente :') + '</b>' + (f.length ? f.map(pilule).join('') : '<span class="muted">rien d\'urgent</span>')
        + (reste.length ? '<span class="muted">· en tout ' + reste.join(', ') + '</span>' : '')
        + '<span style="flex:1"></span><label class="small muted" style="display:flex;gap:8px;align-items:center"><input type="checkbox" data-x="enchainer"' + (S.enchainer ? ' checked' : '') + ' style="accent-color:#2a5ea9;width:16px;height:16px"> Enchaîner automatiquement</label></div>';
    }
    function ecranAttente() {
      var c = S.cpt || {};
      var titre = S.pause ? 'Vous êtes en pause' : S.vue === 'vide' ? 'Aucun lead à servir pour l\'instant' : S.vue === 'charge' ? 'Recherche du lead suivant…' : 'Prête pour le lead suivant ?';
      var sous = S.pause ? 'Aucun lead ne vous est servi. Reprenez quand vous êtes prête.'
        : S.vue === 'vide' ? 'Tous les leads à traiter sont pris ou attendent leur heure de rappel. Le poste regarde à nouveau toutes les 30 secondes.'
        : 'One Data vous sert le plus urgent : les demandes 1 h d\'abord, puis les rappels promis, les relances 48 h et les demandes du jour.';
      return '<div class="wait"><h2>' + titre + '</h2><p class="muted">' + sous + '</p>'
        + '<div class="tiles"><div class="tile r"><b>' + nf(c.n1h || 0) + '</b>demandes 1 h</div><div class="tile o"><b>' + nf(c.nrappels || 0) + '</b>rappels dus</div>'
        + '<div class="tile o"><b>' + nf(c.n48h || 0) + '</b>relances 48 h</div><div class="tile"><b>' + nf(c.npool || 0) + '</b>leads au Pool</div></div>'
        + (S.pause ? '<button type="button" class="bigbtn" data-a="reprendre">Reprendre</button>'
          : '<button type="button" class="bigbtn" data-a="servir"' + (bacsBloque() || S.vue === 'charge' ? ' disabled' : '') + '>' + (S.vue === 'charge' ? 'Un instant…' : 'Lead suivant <kbd>Entrée</kbd>') + '</button>')
        + (S.passes.length ? '<p class="small muted" style="margin-top:16px">' + plural(S.passes.length, 'lead passé', 'leads passés') + ' pendant cette session. <button type="button" class="lnk" data-a="oublier-passes">Les remettre dans la file</button></p>' : '')
        + '</div>';
    }

    // ── colonne gauche : pourquoi on appelle ──
    function anneau() {
      var cur = S.cur, raison = cur.raison, lead = cur.lead || {};
      var ech = lead.echeance || S.fiche.echeance, rec = lead.recu_le || S.fiche.recu_le;
      if (raison === 'rappel') {
        var rp = lead.rappel_le || S.fiche.rappel_le;
        return '<div class="ring"><div class="small muted">Rappel promis pour <b style="color:#1c2b45">' + esc(quand(rp)) + '</b>' + (lead.tentatives ? '<br>' + plural(lead.tentatives, 'tentative', 'tentatives') + ' déjà' : '') + '</div></div>';
      }
      if ((raison !== '1h' && raison !== '48h') || !ech) return '<div class="ring"><div class="small muted">Reçue ' + esc(quand(rec)) + ' · il y a ' + dureeMin((Date.now() - ts(rec)) / 60000) + '</div></div>';
      var tot = Math.max(1, ts(ech) - ts(rec)), rest = ts(ech) - Date.now(), part = Math.max(0, Math.min(1, 1 - rest / tot));
      var col = rest <= 0 ? '#e24b4a' : part > 0.66 ? '#e24b4a' : part > 0.4 ? '#fac055' : '#53bda7', fond = rest <= 0 ? '#f3d6d6' : '#e6eef8';
      var txtc = rest <= 0 ? '#b23433' : part > 0.66 ? '#b23433' : part > 0.4 ? '#8a5a00' : '#2c7a68';
      return '<div class="ring"><div class="c" style="background:conic-gradient(' + col + ' 0 ' + Math.round(part * 100) + '%,' + fond + ' ' + Math.round(part * 100) + '% 100%)"><span data-tick="reste" data-ech="' + esc(ech) + '" style="color:' + txtc + '">' + (rest > 0 ? (rest < 3600000 ? chrono(rest / 1000) : dureeMin(rest / 60000)) : 'hors délai') + '</span></div>'
        + '<div class="small muted">Délai BACS : <b style="color:#1c2b45">' + esc(quand(ech)) + '</b><br>' + esc(RAISON[raison][2]) + '</div></div>';
    }
    function colDemande() {
      var f = S.fiche || {}, cur = S.cur, r = RAISON[cur.raison] || RAISON.pool, cx = S.cx || {};
      var dem = [f.type_demande, f.modele && modeleAff(f.modele)].filter(Boolean).join(' · ');
      var h = '<div class="card who-lead"><div style="display:flex;justify-content:space-between;gap:10px;align-items:flex-start"><span class="lab ' + r[1] + '" style="margin:0">' + esc(r[0]) + '</span>'
        + '<span class="small muted" style="font-weight:800;text-align:right">' + esc(f.source_bacs || '') + '</span></div>'
        + '<h1>' + esc(propre(f.nom) || 'Sans nom') + '</h1><div class="small muted">' + esc([siteNom(f.site), f.nature, f.marque].filter(Boolean).join(' · ')) + '</div>'
        + anneau()
        + '<div class="ask"><b>Ce qu\'il a demandé</b>' + esc(dem || 'Demande sans précision')
        + (f.commentaire ? '<div style="margin-top:6px">« ' + esc(String(f.commentaire).slice(0, 400)) + ' »</div>' : '')
        + (f.campagne ? '<div class="small muted" style="margin-top:6px">' + esc(f.campagne) + '</div>' : '') + '</div></div>';
      // ce que le groupe sait
      var rows = [];
      (cx.parc || []).slice(0, 2).forEach(function (p) { rows.push(['Véhicule', [propre(p.marque), modeleAff(p.modele)].filter(Boolean).join(' ') + (p.mec ? ' · ' + String(p.mec).slice(0, 4) : '')]); });
      if ((cx.atelier || [])[0]) { var a = cx.atelier[0]; rows.push(['Dernier atelier', siteNom(a.site) + ' · ' + jour(a.le) + (a.km ? ' · ' + nf(a.km) + ' km' : '')]); }
      if ((cx.affaires || [])[0]) { var af = cx.affaires[0]; rows.push(['Affaire en cours', [af.statut, af.vn_vo, propre(af.vendeur)].filter(Boolean).join(' · ')]); }
      if (cx.consentement) rows.push(['Consentement', cx.consentement.valide ? 'recueilli ✓' : 'à recueillir']);
      if (f.email) rows.push(['E-mail', f.email]);
      h += '<div class="card"><div class="lab">Ce que le groupe sait de lui</div>'
        + (rows.length ? rows.map(function (x) { return '<div class="row"><span>' + esc(x[0]) + '</span><b>' + esc(x[1]) + '</b></div>'; }).join('') : '<div class="vide">' + (cx.id_client ? 'Client connu, sans véhicule ni passage atelier enregistré.' : 'Inconnu du groupe : premier contact.') + '</div>')
        + '</div>';
      var autres = cx.autres_demandes || [], contacts = cx.contacts || [];
      if (autres.length) h += '<div class="card"><div class="lab o">Autres demandes de ce client</div>' + autres.map(function (o) {
          return '<div class="tl"><span>' + esc(jour(o.le)) + '</span><div>' + esc(o.demande || o.source || 'Demande') + '<div class="small muted">' + esc([siteNom(o.site), o.statut].filter(Boolean).join(' · ')) + '</div></div></div>'; }).join('') + '</div>';
      h += '<div class="card"><div class="lab">Contacts précédents</div>' + (contacts.length ? contacts.slice(0, 6).map(function (c) {
          return '<div class="tl"><span>' + esc(quand(c.le)) + '</span><div>' + esc(c.quoi) + (c.par ? '<div class="small muted">' + esc(propre(c.par)) + '</div>' : '') + '</div></div>'; }).join('') : '<div class="vide">Aucun contact avant celui-ci.</div>') + '</div>';
      return '<aside class="col c-dem" aria-label="Pourquoi on appelle">' + h + '</aside>';
    }

    // ── colonne centrale : l'appel ──
    function guide() {
      var f = S.fiche || {}, moi = propre(user.prenom || '') || 'votre conseillère', mod = S.modele || 'le véhicule', site = siteNom((S.sites && S.sites[0] && S.sites[0].site) || f.site) || 'la concession';
      var marque = propre(f.marque || 'Toyota'), dem = String(f.type_demande || '').toLowerCase(), cx = S.cx || {};
      var parc = (cx.parc || [])[0];
      var nomC = propre(f.nom || ''); var acc = 'Bonjour, je suis bien avec ' + (nomC || 'vous') + ' ? ' + moi + ' de ' + marque + ' ' + site + '. Vous nous avez demandé ' + (/essai/.test(dem) ? 'un essai du ' + mod : /offre|devis|prix/.test(dem) ? 'une offre pour le ' + mod : 'des informations sur le ' + mod) + (f.source_bacs ? ' sur ' + f.source_bacs : '') + ' : vous avez deux minutes ?';
      if (S.cur && S.cur.raison === 'rappel') acc = 'Bonjour, je suis bien avec ' + (nomC || 'vous') + ' ? ' + moi + ' de ' + marque + ' ' + site + ', je vous rappelle comme convenu au sujet du ' + mod + '.';
      var qual = parc ? 'Vous roulez aujourd\'hui en ' + propre(parc.marque || '') + ' ' + modeleAff(parc.modele || '') + (parc.mec ? ' de ' + String(parc.mec).slice(0, 4) : '') + ' : l\'idée serait de la remplacer ? Vous la feriez reprendre ? Vous pensez plutôt payer comptant, ou garder une mensualité ?'
        : 'C\'est pour remplacer un véhicule actuel ? Vous le feriez reprendre ? Vous pensez plutôt payer comptant, ou garder une mensualité ? Pour quand environ ?';
      var rdvTxt = 'Le mieux est de passer à ' + site + ' : un conseiller vous prépare ' + (/essai/.test(dem) ? 'l\'essai' : 'une offre chiffrée') + (S.q.reprise === 'Oui' ? ' et estime votre véhicule sur place' : '') + '. Je regarde ses disponibilités : plutôt en semaine ou le samedi ?';
      var T = [acc, qual, rdvTxt], N = ['Accroche', 'Qualifier', 'Rendez-vous'];
      return '<div class="card"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;margin-bottom:6px"><h3 style="font-size:16px">Guide d\'appel</h3><span class="small muted">étape ' + (S.etape + 1) + ' sur 3</span></div>'
        + '<div class="steps">' + N.map(function (n, i) { return '<button type="button" data-a="etape" data-id="' + i + '" class="' + (i === S.etape ? 'on' : i < S.etape ? 'ok' : '') + '">' + (i + 1) + ' · ' + n + (i < S.etape ? ' ✓' : '') + '</button>'; }).join('') + '</div>'
        + '<div class="say">« ' + esc(T[S.etape]) + ' »</div>'
        + '<div class="qgrid">' + QUALIF.map(function (q) {
            return '<div><div class="lab" style="margin-bottom:7px">' + q[1] + '</div><div class="chips">' + q[2].map(function (o) {
              return '<button type="button" class="chip' + (S.q[q[0]] === o ? ' on' : '') + '" data-a="q" data-k="' + q[0] + '" data-id="' + esc(o) + '">' + esc(o) + '</button>'; }).join('') + '</div></div>'; }).join('')
        + '</div><div class="f"><label for="pl-mod">Modèle souhaité</label><input type="text" id="pl-mod" data-x="modele" value="' + esc(S.modele) + '" placeholder="Ex. C-HR hybride"></div></div>';
    }
    function arguments_() {
      var cx = S.cx || {}, f = S.fiche || {}, out = [];
      var stock = cx.stock || [], site0 = S.sites && S.sites[0];
      if (stock.length) {
        var ici = site0 ? stock.filter(function (s) { return Number(s.idsite) === Number(site0.id_site); })[0] : null;
        if (ici) out.push(ici.n + ' ' + modeleAff(ici.modele) + ' disponible' + (ici.n > 1 ? 's' : '') + ' en stock à ' + siteNom(ici.site) + '.');
        var ailleurs = stock.filter(function (s) { return s !== ici; }).slice(0, 2);
        if (ailleurs.length) out.push((ici ? 'Aussi ' : 'En stock ') + ailleurs.map(function (s) { return s.n + ' à ' + siteNom(s.site); }).join(', ') + ' (' + modeleAff(ailleurs[0].modele) + ').');
      } else if (S.modele) out.push('Pas de ' + S.modele + ' disponible en stock VN : parler du délai de commande.');
      var parc = (cx.parc || [])[0];
      if (parc && parc.age != null) out.push('Son ' + modeleAff(parc.modele || 'véhicule') + ' a ' + parc.age + ' an' + (parc.age > 1 ? 's' : '') + ' : la reprise est un argument.');
      var at = (cx.atelier || [])[0];
      if (at) out.push('Il connaît l\'atelier de ' + siteNom(at.site) + ' : lui proposer la même concession.');
      var af = (cx.affaires || [])[0];
      if (af) out.push('Une affaire existe déjà avec ' + (propre(af.vendeur) || 'un vendeur') + ' (' + (af.statut || 'en cours') + ') : orienter vers ce vendeur.');
      if ((cx.autres_demandes || []).length) out.push(plural(cx.autres_demandes.length, 'autre demande', 'autres demandes') + ' de ce client en 18 mois : vérifier qu\'il n\'est pas déjà suivi.');
      if (!out.length) out.push('Rien de particulier dans les données du groupe : qualifier le projet.');
      return '<div class="card"><div style="display:flex;align-items:center;margin-bottom:10px"><span class="badge">D</span><h3 style="font-size:15px">Delco · arguments pour lui</h3></div><ul class="dl">' + out.map(function (x) { return '<li>' + esc(x) + '</li>'; }).join('') + '</ul></div>';
    }
    function notes() {
      var peutDicter = !!(FW.SpeechRecognition || FW.webkitSpeechRecognition || W.SpeechRecognition || W.webkitSpeechRecognition);
      return '<div class="card"><div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px"><h3 style="font-size:15px">Notes de l\'appel</h3>'
        + (peutDicter ? '<button type="button" class="mic' + (S.dictee ? ' on' : '') + '" data-a="dictee" aria-pressed="' + S.dictee + '">' + svg(IC.micro, 15) + (S.dictee ? 'Dictée en cours… (arrêter)' : 'Dictée vocale') + '</button>' : '') + '</div>'
        + '<textarea id="pl-note" data-x="note" rows="5" placeholder="Ce qu\'il faut que le vendeur sache : projet, budget, reprise, disponibilités…">' + esc(S.note) + '</textarea>'
        + '<div class="small muted" style="margin-top:6px">Elles partent avec la qualification, chez le vendeur et dans BACS.</div></div>';
    }
    function colAppel() {
      var f = S.fiche || {};
      var tel = telAff(f.telephone);
      return '<section class="col c-app" aria-label="Appel">'
        + '<div class="call"><div class="dot"></div><div class="t"><b>' + esc(propre(f.nom) || 'Sans nom') + (tel ? ' · ' + esc(tel) : '') + '</b><small>Appel par la téléphonie du plateau : « Appeler » ouvre votre logiciel téléphonique, ou copiez le numéro.</small></div>'
        + (tel ? '<div class="bt"><button type="button" class="cbtn" data-a="copier">' + svg(IC.copie, 16) + 'Copier</button><button type="button" class="cbtn" data-a="sms">' + svg(IC.sms, 16) + 'SMS</button><button type="button" class="cbtn vert" data-a="appeler">' + svg(IC.tel, 16) + 'Appeler</button></div>' : '<span class="small" style="color:#ffd28a">Pas de numéro dans BACS</span>')
        + '</div>' + guide() + '<div class="duo">' + arguments_() + notes() + '</div></section>';
    }

    // ── colonne droite : l'issue ──
    function selectSite() {
      return '<select data-x="site" aria-label="Concession">' + (S.sites || []).map(function (s) {
        return '<option value="' + s.id_site + '"' + (String(s.id_site) === String(S.site) ? ' selected' : '') + '>' + esc(siteNom(s.site)) + (s.raison ? ' · ' + esc(s.raison) : '') + '</option>'; }).join('') + '</select>';
    }
    function panneauIssue() {
      var i = S.issue;
      if (!i) return '<div class="card" style="background:var(--bg2)"><div class="small muted">Choisissez l\'issue de l\'appel (ou sa touche au clavier) : le détail à compléter apparaît ici.</div></div>';
      if (i === 'rdv') {
        chargerCreneaux(S.site);
        var cr = S.creneaux[S.site], site = (S.sites || []).filter(function (s) { return String(s.id_site) === String(S.site); })[0];
        var slots = cr === 'charge' || !cr ? '<div class="vide">Recherche des créneaux libres…</div>' : !cr.length ? '<div class="vide">Aucun créneau libre dans les 6 jours : passez par « Qualifié, sans RDV ».</div>'
          : '<div class="slots">' + cr.map(function (c, k) {
              var on = S.slot === k;
              return '<button type="button" class="slot' + (on ? ' on' : '') + '" data-a="slot" data-id="' + k + '"><b>' + esc(jourCourt(c.debut) + ' ' + hh(c.debut)) + '</b><small>' + esc(propre(c.vendeur)) + (c.rdv_du_jour ? ' · ' + c.rdv_du_jour + ' RDV ce jour' : '') + '</small></button>'; }).join('') + '</div>';
        return '<div class="card focus"><h3 style="font-size:16px">Rendez-vous en concession</h3><div class="small muted" style="margin:3px 0 12px">' + esc(site && site.raison ? 'Proposé : ' + siteNom(site.site) + ' · ' + site.raison : 'Choisissez la concession') + '</div>'
          + selectSite() + '<div class="lab" style="margin:16px 0 8px">Créneaux libres des vendeurs</div>' + slots
          + '<p class="small muted" style="margin:12px 0 0">Le RDV part dans l\'agenda du vendeur et dans BACS ; le vendeur est prévenu.</p></div>';
      }
      if (i === 'qualifie') {
        chargerVendeurs(S.site);
        var vs = S.vendeurs[S.site];
        return '<div class="card focus"><h3 style="font-size:16px">Transmettre à la concession</h3><div class="small muted" style="margin:3px 0 12px">Le lead qualifié part chez un vendeur, qui rappelle sous 2 h.</div>'
          + selectSite() + '<div class="f"><label>Vendeur</label><select data-x="vendeur"><option value="">Tour de rôle du site</option>'
          + (Array.isArray(vs) ? vs.map(function (v) { return '<option value="' + v.id_user + '"' + (String(S.vendeur) === String(v.id_user) ? ' selected' : '') + '>' + esc(propre(v.nom)) + (v.en_attente ? ' · ' + v.en_attente + ' en attente' : '') + '</option>'; }).join('') : '')
          + '</select></div></div>';
      }
      if (i === 'injoignable' || i === 'long_terme') {
        var opts = i === 'injoignable' ? [['2h', 'Dans 2 h'], ['demain', 'Demain 9 h'], ['apres', 'Après-demain'], ['autre', 'Autre…']] : [['1m', 'Dans 1 mois'], ['3m', 'Dans 3 mois'], ['6m', 'Dans 6 mois'], ['autre', 'Autre…']];
        if (!opts.some(function (o) { return o[0] === S.rappel; })) S.rappel = opts[0][0];
        return '<div class="card focus"><h3 style="font-size:16px">' + (i === 'injoignable' ? 'Pas joint : quand rappeler ?' : 'Projet à plus de 3 mois') + '</h3>'
          + '<div class="chips" style="margin-top:12px">' + opts.map(function (o) { return '<button type="button" class="chip' + (S.rappel === o[0] ? ' on' : '') + '" data-a="rappel" data-id="' + o[0] + '">' + o[1] + '</button>'; }).join('') + '</div>'
          + (S.rappel === 'autre' ? '<div class="f"><input type="datetime-local" data-x="rappelDate" value="' + esc(S.rappelDate) + '" aria-label="Date du rappel"></div>' : '')
          + (i === 'injoignable' ? '<label class="ck"><input type="checkbox" data-x="smsBacs"' + (S.smsBacs ? ' checked' : '') + '><span>SMS « nous avons essayé de vous joindre » envoyé par BACS</span></label>'
            + '<label class="ck"><input type="checkbox" data-x="mailBacs"' + (S.mailBacs ? ' checked' : '') + '><span>E-mail envoyé par BACS</span></label>' : '<p class="small muted" style="margin:12px 0 0">Le lead passe en « Projet Long Terme » dans BACS et vous revient à la date choisie.</p>')
          + '</div>';
      }
      if (i === 'abandon') {
        return '<div class="card focus" style="border-color:#e24b4a"><h3 style="font-size:16px;color:#b23433">Motif de l\'abandon</h3><div class="f"><select data-x="motif">' + MOTIFS.map(function (m) { return '<option' + (m === S.motif ? ' selected' : '') + '>' + esc(m) + '</option>'; }).join('') + '</select></div>'
          + '<p class="small muted" style="margin:10px 0 0">Le motif part dans BACS (statut « Abandonned »).</p></div>';
      }
      if (i === 'passer') return '<div class="card focus"><h3 style="font-size:16px">Passer ce lead</h3><p class="small muted" style="margin:8px 0 0">Il est libéré pour vos collègues et ne vous sera plus servi pendant cette session. Rien n\'est écrit dans BACS.</p></div>';
      return '';
    }
    function libelleValider() {
      var i = S.issue, suiv = S.enchainer && !S.pause ? ' · suivant' : '';
      if (!i) return 'Choisissez une issue';
      if (i === 'rdv') { var c = Array.isArray(S.creneaux[S.site]) && S.slot != null ? S.creneaux[S.site][S.slot] : null; return c ? 'Valider · RDV ' + jourCourt(c.debut).toLowerCase() + ' ' + hh(c.debut) + suiv : 'Choisissez un créneau'; }
      if (i === 'qualifie') return 'Transmettre à ' + siteNom(((S.sites || []).filter(function (s) { return String(s.id_site) === String(S.site); })[0] || {}).site) + suiv;
      if (i === 'injoignable') return 'Programmer le rappel' + suiv;
      if (i === 'long_terme') return 'Classer en projet long terme' + suiv;
      if (i === 'abandon') return 'Abandonner le lead' + suiv;
      if (i === 'passer') return 'Passer' + suiv;
      return 'Valider';
    }
    function colIssue() {
      var pret = peutValider();
      return '<aside class="col c-iss" aria-label="Issue de l\'appel"><div class="card"><h3 style="font-size:16px;margin-bottom:12px">Issue de l\'appel</h3><div class="iss">'
        + ISSUES.map(function (x) { return '<button type="button" class="is ' + x[3] + (S.issue === x[0] ? ' on' : '') + '" data-a="issue" data-id="' + x[0] + '" aria-pressed="' + (S.issue === x[0]) + '"><b>' + x[1] + '</b><small>touche ' + x[2] + '</small></button>'; }).join('')
        + '</div></div>' + panneauIssue()
        + '<div><button type="button" class="go' + (S.issue === 'abandon' ? ' ko' : '') + '" data-a="valider"' + (pret && !S.occupe ? '' : ' disabled') + '>' + esc(S.occupe ? 'Envoi…' : libelleValider()) + (pret ? ' <kbd style="border-color:#fff">⏎</kbd>' : '') + '</button>'
        + '<div class="note-go">' + (S.issue === 'passer' ? 'Rien n\'est écrit dans BACS.' : 'Écrit dans One Data et dans BACS par votre extension.') + '</div></div></aside>';
    }
    function peutValider() {
      var i = S.issue; if (!i) return false;
      if (i === 'rdv') return Array.isArray(S.creneaux[S.site]) && S.slot != null && !!S.creneaux[S.site][S.slot];
      if (i === 'qualifie') return !!S.site;
      if ((i === 'injoignable' || i === 'long_terme') && S.rappel === 'autre') return !!S.rappelDate;
      return true;
    }

    function render() {
      var actif = doc.activeElement, idf = actif && root.contains(actif) ? actif.id : null, sel = null;
      try { if (idf && actif.selectionStart != null) sel = [actif.selectionStart, actif.selectionEnd]; } catch (e) {}
      var corps = S.vue === 'lead' && S.cur && S.fiche ? '<main class="grid3">' + colDemande() + colAppel() + colIssue() + '</main>' : ecranAttente();
      root.innerHTML = enTete() + bande() + bandeBacs() + corps;
      if (idf) { var n = root.querySelector('#' + idf); if (n) { try { n.focus(); if (sel) n.setSelectionRange(sel[0], sel[1]); } catch (e) {} } }
    }
    function tic() {
      root.querySelectorAll('[data-tick]').forEach(function (n) {
        var k = n.getAttribute('data-tick');
        if (k === 'sur' && S.debut) n.textContent = chrono((Date.now() - S.debut) / 1000);
        if (k === 'reste') { var r = ts(n.getAttribute('data-ech')) - Date.now(); n.textContent = r > 0 ? (r < 3600000 ? chrono(r / 1000) : dureeMin(r / 60000)) : 'hors délai'; }
      });
    }

    // ── Gestes ─────────────────────────────────────────────────────────────
    function quandRappel() {
      var d = new Date();
      var a9 = function (j) { var x = new Date(); x.setDate(x.getDate() + j); x.setHours(9, 0, 0, 0); if (x.getDay() === 0) x.setDate(x.getDate() + 1); return x; };
      switch (S.rappel) {
        case '2h': return new Date(d.getTime() + 2 * 3600000);
        case 'demain': return a9(1);
        case 'apres': return a9(2);
        case '1m': return a9(30);
        case '3m': return a9(91);
        case '6m': return a9(182);
        default: return S.rappelDate ? new Date(S.rappelDate) : null;
      }
    }
    function qualifJson() {
      var q = {};
      ['projet', 'echeance', 'reprise', 'financement'].forEach(function (k) { if (S.q[k]) q[k] = S.q[k]; });
      if (S.modele && S.modele.trim()) q.modele = S.modele.trim();
      if (S.note && S.note.trim()) q.note = S.note.trim();
      return q;
    }
    async function valider() {
      if (!peutValider() || S.occupe || !S.cur) return;
      var sf = S.cur.sf, i = S.issue, msg = '';
      if (i !== 'passer' && bacsBloque()) { toast(doc, 'BACS n\'est pas ouvert sur ce poste : le geste ne peut pas partir.', true); return; }
      S.occupe = true; render();
      try {
        if (i === 'rdv') {
          var c = S.creneaux[S.site][S.slot];
          var r = await rpc('plateau_rdv_poser', { p_sf_lead_id: sf, p_id_site: Number(S.site), p_id_user: Number(c.id_user), p_debut: String(c.debut).replace('T', ' ').slice(0, 19), p_duree_min: 60, p_qualif: qualifJson(), p_note: S.note || null });
          msg = r && r.rdv === false ? 'Qualifié et transmis, mais le RDV n\'a pas pu être posé : ' + (r.erreur || 'raison inconnue') + '. Prévenez ' + propre(c.vendeur) + '.' : 'RDV ' + jourCourt(c.debut).toLowerCase() + ' ' + hh(c.debut) + ' avec ' + propre(c.vendeur) + ' · transmis';
          if (r && r.rdv === false) { toast(doc, msg, true); msg = ''; }
        } else if (i === 'qualifie') {
          var r2 = await rpc('plateau_qualifier', { p_sf_lead_id: sf, p_id_site: Number(S.site), p_qualif: qualifJson(), p_id_user_cible: S.vendeur ? Number(S.vendeur) : null });
          if (r2 && r2.ok === false) { toast(doc, 'Qualifié, mais le transfert a échoué : ' + (r2.motif || r2.erreur || 'raison inconnue') + '.', true); }
          else msg = 'Transmis à ' + siteNom(((S.sites || []).filter(function (s) { return String(s.id_site) === String(S.site); })[0] || {}).site);
        } else if (i === 'injoignable' || i === 'long_terme') {
          var q = quandRappel();
          if (!q || isNaN(q.getTime()) || q.getTime() < Date.now() - 60000) throw new Error('Choisissez une date de rappel dans le futur.');
          await rpc('plateau_rappel', { p_sf_lead_id: sf, p_type: i, p_rappel_le: q.toISOString(), p_note: S.note || null, p_email: i === 'injoignable' && S.mailBacs, p_sms: i === 'injoignable' && S.smsBacs });
          msg = (i === 'injoignable' ? 'Rappel programmé ' : 'Projet long terme, rappel ') + (quand(q).length > 5 ? 'le ' : 'à ') + quand(q);
        } else if (i === 'abandon') {
          await rpc('plateau_abandonner', { p_sf_lead_id: sf, p_motif: S.motif, p_note: S.note || null });
          msg = 'Lead abandonné · ' + S.motif;
        } else if (i === 'passer') {
          S.passes.push(sf);
          await rpc('plateau_liberer', { p_sf_lead_id: sf }).catch(function () {});
          msg = 'Lead passé';
        }
        if (i !== 'passer') reveillerBacs();
        if (msg) toast(doc, msg);
        S.cur = null; S.fiche = null; S.vue = 'attente'; S.debut = null;
        S.occupe = false;
        await chargerEntour();
        if (S.enchainer && !S.pause) return servir();
        render();
      } catch (e) {
        S.occupe = false; toast(doc, messageErreur(e), true); render();
      }
    }
    function client() { var f = S.fiche || {}; return { IDVu: f.id_client, TEl_MOB: f.telephone, EMAIL: f.email, nom: propre(f.nom || ''), prenom: '' }; }
    function appeler() {
      var f = S.fiche || {}, num = String(f.telephone || '').replace(/[^0-9+]/g, '');
      if (!num) return;
      try { FW.open('tel:' + num, '_self'); } catch (e) { copier(); }
    }
    function copier() {
      var t = telAff((S.fiche || {}).telephone);
      var ok = function () { toast(doc, 'Numéro copié : ' + t); };
      try { (FW.navigator || navigator).clipboard.writeText(String((S.fiche || {}).telephone || '')).then(ok, function () { toast(doc, t); }); } catch (e) { toast(doc, t); }
    }
    function modelesApi() {
      var api = (FW && FW.__OD_MODELES__) || W.__OD_MODELES__;
      if (api) return Promise.resolve(api);
      var o = odGlobal(), e = o && o.manifest && o.manifest.modeles;
      if (!e || !e.cdn_url) return Promise.resolve(null);
      if (!W.__odModelesP) W.__odModelesP = new Promise(function (res) {
        var sc = document.createElement('script'); sc.src = e.cdn_url; sc.async = true;
        sc.onload = function () { res(W.__OD_MODELES__ || (FW && FW.__OD_MODELES__) || null); };
        sc.onerror = function () { W.__odModelesP = null; res(null); };
        document.head.appendChild(sc);
      });
      return W.__odModelesP;
    }
    async function sms() {
      var f = S.fiche || {}, ui = FW.__SMS_UI__ || W.__SMS_UI__;
      if (!ui || !ui.open) { toast(doc, 'Module SMS indisponible.', true); return; }
      var pre = {};
      try {
        var api = await modelesApi();
        if (api && api.choisir) {
          var m = await api.choisir({ canal: 'sms', idClient: f.id_client, idLead: f.id_lead, idSite: f.id_site, contexte: 'lead', univers: String(f.nature || '').toUpperCase() === 'VO' ? 'VO' : 'VN', doc: doc });
          if (m === null) return;
          if (m) { pre.text = m.corps; pre.trous = m.manquantes; if (m.id != null && api.utilise) api.utilise(m.id); }
        }
      } catch (e) {}
      ui.open({ client: client(), text: pre.text, idLead: f.id_lead, trous: pre.trous || [] });
    }
    var reco = null;
    function dictee() {
      var SR = FW.SpeechRecognition || FW.webkitSpeechRecognition || W.SpeechRecognition || W.webkitSpeechRecognition;
      if (!SR) return;
      if (reco) { try { reco.stop(); } catch (e) {} reco = null; S.dictee = false; render(); return; }
      reco = new SR(); reco.lang = 'fr-FR'; reco.continuous = true; reco.interimResults = false;
      reco.onresult = function (ev) {
        for (var k = ev.resultIndex; k < ev.results.length; k++) if (ev.results[k].isFinal) {
          var t = ev.results[k][0].transcript.trim(); if (!t) continue;
          S.note = (S.note ? S.note.replace(/\s+$/, '') + (/[.!?]$/.test(S.note.trim()) ? ' ' : '. ') : '') + t.charAt(0).toUpperCase() + t.slice(1);
          var ta = root.querySelector('#pl-note'); if (ta) ta.value = S.note;
        }
      };
      reco.onend = function () { reco = null; S.dictee = false; render(); };
      reco.onerror = function (e) { if (e && e.error === 'not-allowed') toast(doc, 'Micro refusé par le navigateur.', true); };
      try { reco.start(); S.dictee = true; render(); } catch (e) { reco = null; }
    }

    // ── Événements ─────────────────────────────────────────────────────────
    function choisirIssue(id) {
      S.issue = S.issue === id ? null : id;
      if (id === 'rdv') { S.etape = 2; S.slot = null; }
      if (id === 'injoignable') S.rappel = '2h';
      if (id === 'long_terme') S.rappel = '3m';
      render();
    }
    root.addEventListener('click', function (ev) {
      var t = ev.target.closest('[data-a]'); if (!t || t.disabled) return;
      var a = t.getAttribute('data-a'), id = t.getAttribute('data-id');
      switch (a) {
        case 'servir': return servir();
        case 'pause':
          if (S.vue === 'lead') { toast(doc, 'Terminez d\'abord le lead en cours (ou passez-le).', true); return; }
          S.pause = true; render(); return;
        case 'reprendre': case 'dispo':
          if (!S.pause) return; S.pause = false; render(); return;
        case 'oublier-passes': S.passes = []; chargerEntour().then(render); return;
        case 'liste': if (typeof opt.liste === 'function') { detruire(); opt.liste(); } return;
        case 'etape': S.etape = Number(id); render(); return;
        case 'q': { var k = t.getAttribute('data-k'); S.q[k] = S.q[k] === id ? null : id; if (S.etape === 0) S.etape = 1; render(); return; }
        case 'issue': return choisirIssue(id);
        case 'slot': S.slot = S.slot === Number(id) ? null : Number(id); render(); return;
        case 'rappel': S.rappel = id; render(); return;
        case 'valider': return valider();
        case 'appeler': return appeler();
        case 'copier': return copier();
        case 'sms': return sms();
        case 'dictee': return dictee();
      }
    });
    function surSaisie(ev) {
      var t = ev.target, x = t.getAttribute && t.getAttribute('data-x'); if (!x) return;
      if (t.type === 'checkbox') { S[x] = t.checked; if (x !== 'enchainer') render(); return; }
      S[x] = t.value;
      if (x === 'site') { S.slot = null; S.vendeur = ''; render(); }
      else if (x === 'rappelDate' || x === 'vendeur' || x === 'motif') render();
    }
    root.addEventListener('input', function (ev) { var x = ev.target.getAttribute && ev.target.getAttribute('data-x'); if (x === 'note' || x === 'modele') S[x] = ev.target.value; });
    root.addEventListener('change', surSaisie);
    function surTouche(ev) {
      if (!el.isConnected || !root.isConnected) return detruire();
      if (doc.querySelector('.odpl-ov')) return;
      var tg = ev.target, saisie = tg && (/^(INPUT|TEXTAREA|SELECT)$/.test(tg.tagName) || tg.isContentEditable);
      if (ev.key === 'Enter' && !ev.shiftKey && (!saisie || ev.ctrlKey || ev.metaKey) && !(tg && tg.tagName === 'BUTTON')) {
        if (S.vue === 'lead') { if (peutValider()) { ev.preventDefault(); valider(); } }
        else if (!S.pause && S.vue !== 'charge') { ev.preventDefault(); servir(); }
        return;
      }
      if (saisie || ev.ctrlKey || ev.metaKey || ev.altKey || S.vue !== 'lead') return;
      var k = String(ev.key || '').toUpperCase(), m = ISSUES.filter(function (x) { return x[2] === k; })[0];
      if (m) { ev.preventDefault(); choisirIssue(m[0]); }
    }
    doc.addEventListener('keydown', surTouche);

    // ── Minuteurs ──────────────────────────────────────────────────────────
    var tTic = setInterval(function () { if (!el.isConnected || !root.isConnected) return detruire(); tic(); }, 1000);
    var tEntour = setInterval(async function () {
      if (!el.isConnected || !root.isConnected) return detruire();
      if (S.occupe) return;
      await chargerEntour();
      if (S.vue === 'vide' && !S.pause && S.enchainer && (S.cpt.n1h || S.cpt.nrappels || S.cpt.n48h || S.cpt.npool)) return servir();
      // on ne repeint pas pendant une saisie (la note, le modèle)
      var a = doc.activeElement; if (a && root.contains(a) && /^(INPUT|TEXTAREA|SELECT)$/.test(a.tagName)) return;
      render();
    }, 30000);
    var tVerrou = setInterval(async function () {
      if (!el.isConnected || !root.isConnected) return detruire();
      if (S.vue !== 'lead' || !S.cur || S.occupe) return;
      try { await rpc('plateau_prendre', { p_sf_lead_id: S.cur.sf }); } catch (e) {}
    }, 4 * 60000);
    function detruire() {
      clearInterval(tTic); clearInterval(tEntour); clearInterval(tVerrou);
      doc.removeEventListener('keydown', surTouche);
      if (reco) try { reco.stop(); } catch (e) {}
    }

    await chargerEntour();
    render();
    return { detruire: detruire };
  }

  // ==========================================================================
  //  2. LA TOUR DE CONTRÔLE DU SUPERVISEUR
  // ==========================================================================
  async function superviser(el, ctx, opt) {
    opt = opt || {};
    var doc = el.ownerDocument || document, FW = frontWindow();
    var sb = ctx.supabase, rpc = fabriqueRpc(sb);
    var S = { d: null, prevJ: null, prevD: null, qual: [], corr: [], liens: null, err: null, onglet: 'tour' };
    injecterCss(doc);
    el.innerHTML = '';
    var root = doc.createElement('div'); root.className = 'odpl'; el.appendChild(root);

    async function charger() {
      var demain = new Date(Date.now() + 86400000), auj = new Date();
      var f = function (x) { return x.getFullYear() + '-' + p2(x.getMonth() + 1) + '-' + p2(x.getDate()); };
      var r = await Promise.all([
        rpc('plateau_supervision').catch(function (e) { S.err = e; return S.d; }),
        rpc('plateau_prevision', { p_jour: f(auj) }).catch(function () { return S.prevJ; }),
        rpc('plateau_prevision', { p_jour: f(demain) }).catch(function () { return S.prevD; }),
        rpc('plateau_qualite', { p_jours: 1 }).catch(function () { return S.qual; }),
        rpc('plateau_corrections_attente').catch(function () { return S.corr; }),
        S.liens ? Promise.resolve(S.liens) : rpc('plateau_liens').catch(function () { return null; })
      ]);
      S.d = r[0]; S.prevJ = r[1]; S.prevD = r[2]; S.qual = r[3] || []; S.corr = r[4] || []; S.liens = r[5];
      if (S.d) S.err = null;
    }
    function enTete() {
      var maint = new Date(), l = S.liens || {};
      return '<header class="hd"><div class="logo"><i>OD</i><div><b>Tour de contrôle · Plateau Vroom</b><small>' + esc(maint.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })) + ' · <span data-tick="h">' + hh(maint) + '</span> · en direct</small></div></div>'
        + '<div class="seg" role="tablist"><button type="button" role="tab" data-a="onglet" data-id="tour" class="' + (S.onglet === 'tour' ? 'on' : '') + '">Tour de contrôle</button><button type="button" role="tab" data-a="onglet" data-id="rapport" class="' + (S.onglet === 'rapport' ? 'on' : '') + '">Rapport client</button></div>'
        + '<div class="sp"></div>'
        + (l.telephonie ? '<a class="hbtn" href="' + esc(l.telephonie) + '" target="_blank" rel="noopener">Supervision téléphonie ' + svg(IC.ext, 15) + '</a>' : '')
        + (typeof opt.poste === 'function' ? '<button type="button" class="hbtn" data-a="poste">Poste agent</button>' : '')
        + (typeof opt.ancien === 'function' ? '<button type="button" class="hbtn w" data-a="ancien">Écran détaillé</button>' : '')
        + '</header>';
    }
    function kpis() {
      var d = S.d, j = d.jour || {}, t = d.transferts || {}, eq = d.equipe || [];
      var tot1h = (j.un_h_ok || 0) + (j.un_h_hors || 0), p1h = pct(j.un_h_ok || 0, tot1h), obj = Number((d.reglages || {}).objectif_1h || 90);
      var n1h = (d.chrono || []).length, n48 = (d.chrono_48h || []).length;
      var actifs = eq.filter(function (e) { return e.sur_fiche; }).length, presents = eq.filter(function (e) { return e.dernier && (Date.now() - ts(e.dernier)) < 3600000; }).length;
      var qual = eq.reduce(function (s, e) { return s + (e.qualifies || 0); }, 0), pris = eq.reduce(function (s, e) { return s + (e.pris || 0); }, 0);
      var p2h = pct(t.dans_2h || 0, t.n || 0);
      var K = [
        ['1 h dans le délai BACS', p1h == null ? '—' : p1h + ' %', tot1h ? (j.un_h_ok || 0) + ' sur ' + tot1h + ' · cible ' + obj + ' %' : 'aucune demande 1 h traitée', p1h == null ? '' : p1h >= obj ? 'g' : 'r', p1h || 0],
        ['En attente maintenant', n1h + ' · ' + nf(j.rappels_dus || 0), '1 h · rappels dus' + (n48 ? ' · ' + n48 + ' relances 48 h' : ''), n1h ? 'r' : '', Math.min(100, n1h * 10)],
        ['Prise en charge 1 h', j.prise_mediane_min == null ? '—' : Math.round(j.prise_mediane_min) + ' min', 'médiane du jour', '', j.prise_mediane_min == null ? 0 : Math.max(5, 100 - j.prise_mediane_min * 1.5)],
        ['Pris aujourd\'hui', nf(pris), plural(qual, 'qualifié', 'qualifiés') + ' · ' + plural(j.abandons || 0, 'abandon', 'abandons'), '', pris ? Math.round(100 * qual / pris) : 0],
        ['Rappel concession < 2 h', p2h == null ? '—' : p2h + ' %', (t.n || 0) + ' transmis · ' + (t.en_retard || 0) + ' en retard', p2h == null ? '' : p2h >= 85 ? 'g' : 'o', p2h || 0],
        ['L\'équipe', actifs + ' / ' + presents, 'sur un lead · actives dans l\'heure', '', presents ? Math.round(100 * actifs / presents) : 0]
      ];
      return '<div class="kpis">' + K.map(function (k) { return '<div class="kpi"><div class="l">' + esc(k[0]) + '</div><div class="v ' + k[3] + '">' + esc(k[1]) + '</div><div class="bar"><i class="' + (k[3] || '') + '" style="width:' + Math.max(0, Math.min(100, Math.round(k[4]))) + '%"></i></div><div class="small muted">' + esc(k[2]) + '</div></div>'; }).join('') + '</div>';
    }
    function fileDirect() {
      var d = S.d, rg = d.reglages || {}, l = [];
      (d.chrono || []).forEach(function (x) { l.push({ x: x, k: '1h', tot: 3600000 }); });
      (d.chrono_48h || []).slice(0, 8).forEach(function (x) { l.push({ x: x, k: '48h', tot: 48 * 3600000 }); });
      var h = l.map(function (o) {
        var x = o.x, ech = ts(x.echeance) || (ts(x.recu_le) + o.tot), rest = ech - Date.now(), tot = Math.max(1, ech - ts(x.recu_le)), part = Math.max(0, Math.min(1, 1 - rest / tot));
        var etat = rest <= 0 || part > 0.75 ? 'r' : part > 0.5 ? 'o' : 'b';
        var coul = etat === 'r' ? '#b23433' : etat === 'o' ? '#8a5a00' : '#1f4a85';
        var restTxt = rest <= 0 ? '+' + dureeMin(-rest / 60000) : rest < 3600000 ? chrono(rest / 1000) : dureeMin(rest / 60000);
        return '<div class="fl"><div class="a"><b>' + esc(propre(x.nom)) + '</b><span style="font-weight:900;font-size:12.5px;color:' + coul + '" data-tick="ech" data-ech="' + new Date(ech).toISOString() + '">' + esc(restTxt) + '</span></div>'
          + '<div class="d">' + esc([o.k === '1h' ? '1 h' : '48 h', x.type_demande, x.modele && modeleAff(x.modele), siteNom(x.site)].filter(Boolean).join(' · ')) + '</div>'
          + '<div class="bar" style="margin:0"><i class="' + (etat === 'b' ? '' : etat) + '" style="width:' + Math.round(part * 100) + '%"></i></div>'
          + '<div class="z"><span>' + esc(x.pris_par ? 'pris par ' + propre(x.pris_par) : 'Personne dessus') + '</span>' + (x.pris_par ? '' : '<button type="button" class="mini p" data-a="confier" data-id="' + esc(x.sf) + '" data-n="' + esc(propre(x.nom)) + '">Confier</button>') + '</div></div>';
      }).join('');
      return '<section class="panel"><div class="ph"><b>File en direct</b><span class="small muted">par urgence BACS</span></div>' + (h || '<div class="fl vide">Aucune demande 1 h ni relance 48 h en attente.</div>') + '</section>';
    }
    function equipe() {
      var d = S.d, eq = (d.equipe || []).slice(), inactif = Number((d.reglages || {}).inactif_min || 20);
      eq.sort(function (a, b) { return (b.sur_fiche ? 1 : 0) - (a.sur_fiche ? 1 : 0) || (ts(b.dernier) || 0) - (ts(a.dernier) || 0); });
      var actifs = eq.filter(function (e) { return e.dernier && Date.now() - ts(e.dernier) < 8 * 3600000; });
      var montrer = actifs.length ? actifs : eq;
      var cartes = montrer.map(function (e) {
        var depuis = e.dernier ? (Date.now() - ts(e.dernier)) / 60000 : null, st, c, cl = '';
        if (e.sur_fiche) { st = 'Sur un lead'; c = ['#2c7a68', '#eaf7f4']; }
        else if (depuis == null) { st = 'Pas encore active aujourd\'hui'; c = ['#4b5563', '#f2f6fc']; cl = ' off'; }
        else if (depuis > inactif && depuis < 240) { st = 'Sans geste depuis ' + dureeMin(depuis); c = ['#8a5a00', '#fff6e0']; cl = ' warn'; }
        else if (depuis >= 240) { st = 'Dernier geste ' + quand(e.dernier); c = ['#4b5563', '#f2f6fc']; cl = ' off'; }
        else { st = 'Disponible · dernier geste il y a ' + dureeMin(depuis); c = ['#1f4a85', '#eef4fc']; }
        if (e.bacs_vu == null && !e.sur_fiche && depuis != null && depuis < 240) st += ' · BACS fermé';
        var p1 = e.un_h_total ? Math.round(100 * e.un_h_ok / e.un_h_total) + ' %' : '—';
        return '<div class="ag' + cl + '"><div class="t"><div class="av" style="color:' + c[0] + ';background:' + c[1] + '">' + esc(initiales(e.nom)) + '</div><div class="n"><b>' + esc(propre(e.nom)) + '</b><small style="color:' + c[0] + '">' + esc(st) + '</small></div>'
          + '<div class="small muted" style="text-align:right">' + (e.prise_mediane_min != null ? 'prise ' + Math.round(e.prise_mediane_min) + ' min' : '') + '</div></div>'
          + '<div class="m"><div><b>' + nf(e.pris || 0) + '</b>pris</div><div><b>' + nf(e.qualifies || 0) + '</b>qualifiés</div><div><b>' + p1 + '</b>1 h à l\'heure</div><div><b' + (e.abandons_rapides ? ' style="color:#b23433"' : '') + '>' + nf(e.abandons || 0) + '</b>abandons' + (e.abandons_rapides ? ' (' + plural(e.abandons_rapides, 'rapide') + ')' : '') + '</div></div>'
          + '<div class="acts"><button type="button" class="mini" data-a="confier-a" data-id="' + e.id + '" data-n="' + esc(propre(e.nom)) + '">Confier un lead</button><button type="button" class="mini" data-a="message" data-id="' + e.id + '" data-n="' + esc(propre(e.nom)) + '">Message</button></div></div>';
      }).join('');
      var nb = function (f) { return eq.filter(f).length; };
      return '<section class="col"><div style="display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap"><h2 style="font-size:16px">L\'équipe maintenant</h2>'
        + '<span class="small muted">d\'après One Data · ' + nb(function (e) { return e.sur_fiche; }) + ' sur un lead · l\'écoute et les appels restent dans la console téléphonie</span></div>'
        + '<div class="team">' + (cartes || '<div class="vide">Personne dans l\'équipe du plateau.</div>') + '</div></section>';
    }
    function charge() {
      var pj = S.prevJ, pd = S.prevD;
      if (!pj || !pj.heures) return '';
      var max = Math.max.apply(null, pj.heures.map(function (x) { return Math.max(x.prevues || 0, x.reel || 0); }).concat([1]));
      var h = '<div class="card"><h3 style="font-size:15px">Charge prévue et réelle</h3><div class="small muted" style="margin:2px 0 12px">demandes par heure aujourd\'hui · prévu (clair) d\'après les ' + (pj.semaines || 8) + ' mêmes jours précédents · reçu (foncé)</div>'
        + '<div class="hist">' + pj.heures.map(function (x) { return '<div title="' + x.h + ' h : ' + (x.prevues || 0) + ' prévues, ' + (x.reel || 0) + ' reçues"><i class="p" style="height:' + Math.round(100 * (x.prevues || 0) / max) + '%"></i><i class="r" style="height:' + Math.round(100 * (x.reel || 0) / max) + '%"></i></div>'; }).join('') + '</div>'
        + '<div class="hx">' + pj.heures.map(function (x) { return '<span>' + x.h + 'h</span>'; }).join('') + '</div>';
      if (pd && pd.total) {
        var nuit = (pd.heures || [])[0] || {};
        h += '<div style="margin-top:14px;background:#fff6e0;border-radius:12px;padding:12px 14px;font-size:12.5px;line-height:1.55"><b style="color:#8a5a00">' + esc((function (x) { return x.charAt(0).toUpperCase() + x.slice(1); })(new Date(pd.jour + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long' }))) + '</b> : ≈ ' + Math.round(pd.total) + ' demandes attendues, dont ' + Math.round(pd.total_1h || 0) + ' « 1 h »'
          + (pd.pic ? ' ; pic vers ' + pd.pic.h + ' h' + (pd.pic.h === 9 && nuit.prevues ? ' (avec les demandes de la nuit)' : '') : '') + '. ' + plural(pd.agents_max || 0, 'agent nécessaire', 'agents nécessaires') + ' au plus fort, à ' + (pd.dmt_min || 6) + ' min par lead.</div>';
      }
      return h + '</div>';
    }
    function qualite() {
      var L = { abandon_rapide: ['Abandon rapide', 'r'], injoignable_sans_message: ['Sans SMS', ''], qualif_fausse: ['Avis vendeur', 'r'] };
      return '<div class="card"><h3 style="font-size:15px;margin-bottom:6px">Contrôle qualité · à regarder</h3>' + (S.qual.length ? S.qual.slice(0, 8).map(function (q) {
          var t = L[q.type] || [q.type, ''];
          return '<div class="qi"><span class="tag ' + t[1] + '">' + esc(t[0]) + '</span><div class="x"><b>' + esc(propre(q.agent || '?') + (q.nom ? ' · ' + propre(q.nom) : '')) + '</b><span class="muted">' + esc(q.detail) + ' · ' + esc(quand(q.le)) + '</span></div></div>'; }).join('')
        : '<div class="vide">Rien à signaler aujourd\'hui.</div>') + '</div>';
    }
    function corrections() {
      if (!S.corr.length) return '';
      return '<div class="card"><h3 style="font-size:15px;margin-bottom:6px">Corrections à valider</h3>' + S.corr.map(function (c) {
        var dem = c.demande || {}, av = c.avant || {};
        return '<div class="qi"><div class="x"><b>' + esc(propre(c.nom || '')) + ' · ' + esc(siteNom(c.site)) + '</b><span class="muted">' + esc((av.statut || '?') + ' → ' + (dem.statut || '?')) + ' · ' + esc(propre(c.demande_par || '')) + (c.raison ? ' : « ' + esc(c.raison) + ' »' : '') + '</span>'
          + '<div style="display:flex;gap:6px;margin-top:8px"><button type="button" class="mini p" data-a="corr-ok" data-id="' + c.id + '">Valider</button><button type="button" class="mini k" data-a="corr-ko" data-id="' + c.id + '">Refuser</button></div></div></div>'; }).join('') + '</div>';
    }
    function render() {
      if (S.onglet === 'rapport') return;
      if (!S.d) {
        root.innerHTML = enTete() + '<div class="tour"><div class="card">' + (S.err ? esc(messageErreur(S.err)) : 'Chargement…') + '</div></div>';
        return;
      }
      root.innerHTML = enTete() + '<div class="tour">' + kpis() + '<div class="g3">' + fileDirect() + equipe() + '<section class="col col3">' + charge() + qualite() + corrections() + '</section></div></div>';
    }
    function tic() {
      root.querySelectorAll('[data-tick]').forEach(function (n) {
        var k = n.getAttribute('data-tick');
        if (k === 'h') n.textContent = hh(new Date());
        if (k === 'ech') { var r = ts(n.getAttribute('data-ech')) - Date.now(); n.textContent = r <= 0 ? '+' + dureeMin(-r / 60000) : r < 3600000 ? chrono(r / 1000) : dureeMin(r / 60000); }
      });
    }
    function confier(sf, nom, idAgent, nomAgent) {
      var eq = (S.d.equipe || []).filter(function (e) { return e.dernier && Date.now() - ts(e.dernier) < 8 * 3600000; });
      if (!eq.length) eq = S.d.equipe || [];
      var leads = (S.d.chrono || []).concat(S.d.chrono_48h || []).filter(function (x) { return !x.pris_par; });
      var html = sf ? '<h3>Confier ' + esc(nom) + '</h3><p>Le lead est réservé à l\'agent choisie, qui est prévenue.</p>' + eq.map(function (e) { return '<button type="button" class="it" data-id="' + e.id + '"><b>' + esc(propre(e.nom)) + '</b><small>' + (e.sur_fiche ? 'sur un lead' : 'disponible') + ' · ' + plural(e.pris || 0, 'pris', 'pris') + '</small></button>'; }).join('')
        : '<h3>Confier un lead à ' + esc(nomAgent) + '</h3><p>Les demandes en attente, les plus urgentes d\'abord.</p>' + (leads.length ? leads.slice(0, 12).map(function (x) { return '<button type="button" class="it" data-id="' + esc(x.sf) + '"><b>' + esc(propre(x.nom)) + '</b><small>' + esc([x.type_demande, siteNom(x.site)].filter(Boolean).join(' · ')) + '</small></button>'; }).join('') : '<p>Aucun lead libre en attente.</p>');
      fenetre(doc, html + '<div class="ft"><button type="button" class="b" data-f="x">Fermer</button></div>', function (ov, fermer) {
        ov.addEventListener('click', async function (e) {
          var b = e.target.closest('button'); if (!b) return;
          if (b.getAttribute('data-f') === 'x') return fermer();
          var v = b.getAttribute('data-id'); if (!v) return;
          b.disabled = true;
          try {
            var r = await rpc('plateau_attribuer', { p_sf_lead_id: sf || v, p_id_user: Number(sf ? v : idAgent) });
            if (r && r.ok === false) toast(doc, 'Impossible : ' + (r.motif || 'refusé'), true);
            else { toast(doc, 'Lead confié'); fermer(); await charger(); render(); }
          } catch (er) { toast(doc, messageErreur(er), true); b.disabled = false; }
        });
      });
    }
    function message(id, nom) {
      fenetre(doc, '<h3>Message à ' + esc(nom) + '</h3><p>Il s\'affiche en notification sur son poste One Data.</p><textarea id="pl-msg" placeholder="Ex. une demande 1 h de Meaux attend, tu peux la prendre ?"></textarea><div class="ft"><button type="button" class="b" data-f="x">Annuler</button><button type="button" class="b p" data-f="go">Envoyer</button></div>', function (ov, fermer) {
        ov.addEventListener('click', async function (e) {
          var b = e.target.closest('button'); if (!b) return;
          if (b.getAttribute('data-f') === 'x') return fermer();
          if (b.getAttribute('data-f') !== 'go') return;
          var m = (ov.querySelector('#pl-msg').value || '').trim(); if (!m) return;
          b.disabled = true;
          try { var r = await rpc('plateau_prevenir', { p_id_user: Number(id), p_message: m }); if (r && r.ok === false) toast(doc, 'Impossible : ' + (r.motif || 'refusé'), true); else { toast(doc, 'Message envoyé'); fermer(); } }
          catch (er) { toast(doc, messageErreur(er), true); b.disabled = false; }
        });
      });
    }
    var rapportCtl = null;
    root.addEventListener('click', async function (ev) {
      var t = ev.target.closest('[data-a]'); if (!t || t.disabled) return;
      var a = t.getAttribute('data-a'), id = t.getAttribute('data-id');
      switch (a) {
        case 'onglet':
          if (S.onglet === id) return;
          S.onglet = id;
          if (id === 'rapport') {
            root.innerHTML = enTete() + '<div data-rp></div>';
            rapportCtl = await rapport(root.querySelector('[data-rp]'), ctx, { integre: true });
          } else { if (rapportCtl && rapportCtl.detruire) rapportCtl.detruire(); rapportCtl = null; render(); }
          return;
        case 'ancien': detruire(); return opt.ancien();
        case 'poste': detruire(); return opt.poste();
        case 'confier': return confier(id, t.getAttribute('data-n'));
        case 'confier-a': return confier(null, null, id, t.getAttribute('data-n'));
        case 'message': return message(id, t.getAttribute('data-n'));
        case 'corr-ok': case 'corr-ko':
          t.disabled = true;
          try { await rpc('plateau_correction_decider', { p_id: Number(id), p_valider: a === 'corr-ok', p_note: null }); toast(doc, a === 'corr-ok' ? 'Correction validée, reportée dans BACS' : 'Correction refusée'); await charger(); render(); }
          catch (er) { toast(doc, messageErreur(er), true); t.disabled = false; }
          return;
      }
    });
    var tTic = setInterval(function () { if (!el.isConnected || !root.isConnected) return detruire(); tic(); }, 1000);
    var tData = setInterval(async function () {
      if (!el.isConnected || !root.isConnected) return detruire();
      if (S.onglet !== 'tour' || doc.querySelector('.odpl-ov')) return;
      await charger(); render();
    }, 20000);
    function detruire() { clearInterval(tTic); clearInterval(tData); if (rapportCtl && rapportCtl.detruire) rapportCtl.detruire(); }
    render();
    await charger();
    render();
    return { detruire: detruire };
  }

  // ==========================================================================
  //  3. LE RAPPORT MENSUEL AU CLIENT
  // ==========================================================================
  async function rapport(el, ctx, opt) {
    opt = opt || {};
    var doc = el.ownerDocument || document;
    var rpc = fabriqueRpc(ctx.supabase);
    var auj = new Date();
    var S = { mois: auj.getFullYear() + '-' + p2(auj.getMonth() + 1) + '-01', d: null, err: null, liens: null };
    injecterCss(doc);
    el.innerHTML = '';
    var root = doc.createElement('div'); root.className = 'odpl rp'; el.appendChild(root);

    function moisListe() {
      var out = [], d = new Date(auj.getFullYear(), auj.getMonth(), 1);
      for (var k = 0; k < 24; k++) { out.push(d.getFullYear() + '-' + p2(d.getMonth() + 1) + '-01'); d = new Date(d.getFullYear(), d.getMonth() - 1, 1); }
      return out;
    }
    function nomMois(m) { var s = new Date(m + 'T12:00:00').toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }); return s.charAt(0).toUpperCase() + s.slice(1); }
    async function charger() {
      S.d = null; S.err = null; render();
      try {
        var r = await Promise.all([rpc('plateau_rapport', { p_mois: S.mois }), S.liens ? Promise.resolve(S.liens) : rpc('plateau_liens').catch(function () { return null; })]);
        S.d = r[0]; S.liens = r[1];
      } catch (e) { S.err = e; }
      render();
    }
    function couverture() {
      var c = (S.liens || {}).collecte; if (!c || c.historique_fini) return '';
      var jusq = c.historique_jusqu ? new Date(c.historique_jusqu) : null, fin = new Date(new Date(S.mois + 'T12:00:00').getFullYear(), new Date(S.mois + 'T12:00:00').getMonth() + 1, 1);
      if (jusq && jusq >= fin) return '';
      return '<div class="ban warn noprint" style="margin:0"><b>Historique BACS en cours de collecte.</b><span>Les demandes sont reprises depuis janvier 2024' + (jusq ? ' ; la collecte en est au ' + jusq.toLocaleDateString('fr-FR') : '') + '. Ce mois peut être incomplet jusqu\'à la fin de la reprise.</span></div>';
    }
    function render() {
      var d = S.d;
      var sel = '<select data-x="mois" aria-label="Mois" style="min-width:170px;background:transparent;color:#fff;border-color:rgba(255,255,255,.4)">' + moisListe().map(function (m) { return '<option value="' + m + '"' + (m === S.mois ? ' selected' : '') + ' style="color:#1c2b45">' + esc(nomMois(m)) + '</option>'; }).join('') + '</select>';
      var actions = '<div class="noprint" style="display:flex;gap:8px;flex-wrap:wrap">' + sel + '<button type="button" class="hbtn w" data-a="imprimer">' + svg(IC.print, 15) + 'Imprimer / PDF</button></div>';
      if (!d) {
        root.innerHTML = '<header class="rph"><div class="in"><div style="flex:1;min-width:280px"><div class="k">Plateau Vroom · rapport à la direction Team Colin</div><h1>' + esc(nomMois(S.mois)) + '</h1><div class="s">' + (S.err ? esc(messageErreur(S.err)) : 'Calcul du rapport…') + '</div></div>' + actions + '</div></header>';
        return;
      }
      var p1h = pct(d.un_h_ok, d.un_h);
      var titre = d.ventes ? nomMois(S.mois) + ' : ' + plural(d.ventes, 'vente née', 'ventes nées') + ' d\'une demande BACS' : nomMois(S.mois) + ' : ' + nf(d.recues) + ' demandes BACS';
      var h = '<header class="rph"><div class="in"><div style="flex:1;min-width:280px"><div class="k">Plateau Vroom · rapport à la direction Team Colin</div><h1>' + esc(titre) + '</h1>'
        + '<div class="s">' + nf(d.traitees) + ' demandes traitées sur ' + nf(d.recues) + ' reçues · ' + (d.concessions || []).length + ' concessions' + (p1h != null ? ' · ' + p1h + ' % des demandes « 1 h » dans le délai constructeur' : '') + '</div></div>' + actions + '</div></header>';
      h += '<main class="rpm">';
      var tiles = [
        ['Demandes « 1 h » dans le délai', p1h == null ? '—' : p1h + ' %', d.un_h ? nf(d.un_h_ok) + ' sur ' + nf(d.un_h) + ' · ' + nf(d.un_h - d.un_h_ok) + ' hors délai' : 'aucune ce mois'],
        ['Qualifiées et transmises', nf(d.qualifiees), pct(d.qualifiees, d.jointes) != null ? pct(d.qualifiees, d.jointes) + ' % des clients joints' : ''],
        ['RDV en concession', nf(d.rdv), 'posés par le plateau ou pris dans les 30 jours'],
        ['Ventes', nf(d.ventes), 'VN ' + nf(d.ventes_vn) + ' · VO ' + nf(d.ventes_vo) + ' · bon de commande sous 120 jours']
      ];
      h += '<div class="rpt">' + tiles.map(function (t) { return '<div><div class="l">' + esc(t[0]) + '</div><div class="v">' + esc(t[1]) + '</div><div class="c">' + esc(t[2]) + '</div></div>'; }).join('') + '</div>';
      h += couverture();
      var E = [['Reçues', d.recues, 'dans BACS'], ['Traitées', d.traitees, (pct(d.traitees, d.recues) || 0) + ' %'], ['Jointes', d.jointes, (pct(d.jointes, d.traitees) || 0) + ' % des traitées'],
        ['Qualifiées', d.qualifiees, (pct(d.qualifiees, d.jointes) || 0) + ' % des jointes'], ['RDV', d.rdv, 'agenda vendeur'], ['Ventes', d.ventes, (d.recues ? (Math.round(1000 * d.ventes / d.recues) / 10).toLocaleString('fr-FR') : '0') + ' % des reçues']];
      var mx = Math.max(1, d.recues || 1);
      h += '<section class="sec"><div class="sech"><h2>De la demande à la vente</h2><span class="small muted">chaque étape lue dans BACS et One Data, demande par demande</span></div><div class="ent">'
        + E.map(function (e, i) { return '<div><div class="v">' + nf(e[1] || 0) + '</div><div class="h"><i style="height:' + Math.max(3, Math.round(100 * Math.sqrt((e[1] || 0) / mx))) + '%;background:' + (i === 5 ? '#53bda7' : i >= 3 ? '#2a5ea9' : '#acc5e4') + '"></i></div><div class="l">' + e[0] + '</div><div class="t">' + esc(e[2]) + '</div></div>'; }).join('') + '</div></section>';
      var pill = function (ok) { return 'padding:3px 10px;border-radius:999px;font-weight:800;font-size:13px;background:' + (ok ? '#eaf7f4' : '#fdeeee') + ';color:' + (ok ? '#2c7a68' : '#b23433'); };
      var conc = (d.concessions || []).map(function (s) {
        return '<tr><td style="font-weight:800">' + esc(siteNom(s.site)) + '</td><td>' + nf(s.transmis) + '</td><td>' + (s.rappel_2h_pct == null ? '<span class="muted">—</span>' : '<span style="' + pill(s.rappel_2h_pct >= 85) + '">' + s.rappel_2h_pct + ' %</span>') + '</td><td>' + nf(s.rdv) + '</td><td style="font-weight:900;color:#2c7a68">' + nf(s.ventes) + '</td><td>' + (s.sans_suite ? '<span style="' + pill(false) + '">' + s.sans_suite + '</span>' : '<span class="muted">0</span>') + '</td></tr>'; }).join('');
      var origs = (d.origines || []).filter(function (o) { return o.recues >= 3; }), mo = Math.max.apply(null, origs.map(function (o) { return o.taux_qualif || 0; }).concat([1]));
      h += '<div class="g3" style="grid-template-columns:minmax(0,1fr) minmax(0,400px)"><section class="sec" style="padding:0;overflow-x:auto"><div class="sech" style="padding:20px 22px 4px"><h2>Ce que les concessions ont fait des leads transmis</h2><span class="small muted">le plateau qualifie, la concession transforme</span></div>'
        + '<table class="t"><thead><tr><th>Concession</th><th>Transmis</th><th>Rappel vendeur &lt; 2 h</th><th>RDV</th><th>Ventes</th><th>Sans suite &gt; 48 h</th></tr></thead><tbody>' + (conc || '<tr><td colspan="6" class="muted">Aucun lead transmis ce mois.</td></tr>') + '</tbody></table></section>'
        + '<aside class="col"><div class="sec"><h2 style="font-size:18px;margin-bottom:12px">Par origine</h2>' + (origs.length ? origs.slice(0, 8).map(function (o) {
            return '<div class="og"><span style="font-weight:800">' + esc(o.origine) + ' <span class="muted" style="font-weight:600">· ' + nf(o.recues) + '</span></span><div class="bar"><i style="width:' + Math.round(100 * (o.taux_qualif || 0) / mo) + '%"></i></div><span style="text-align:right;font-weight:800;color:#1f4a85">' + String(o.taux_qualif || 0).replace('.', ',') + ' %</span></div>'; }).join('')
          + '<div class="small muted" style="margin-top:8px">taux de qualification par origine (demandes reçues ≥ 3)</div>' : '<div class="vide">Pas assez de demandes.</div>') + '</div>'
        + '<div class="sec" style="background:#eef4fc;border-color:#eef4fc"><h2 style="font-size:18px;margin-bottom:10px">Comment c\'est compté</h2><ul class="dl"><li><b>Jointe</b> : le client a répondu (qualifiée, projet long terme, ou abandon avec un motif donné par le client).</li><li><b>Délai 1 h</b> : le champ BACS « délai d\'acceptation respecté ».</li><li><b>Vente</b> : bon de commande ou affaire gagnée pour ce client dans les 120 jours suivant la demande.</li>' + (d.samedi_1h ? '<li>' + plural(d.samedi_1h, 'demande 1 h reçue', 'demandes 1 h reçues') + ' un samedi.</li>' : '') + '</ul></div></aside></div>';
      h += '</main>';
      root.innerHTML = h;
    }
    root.addEventListener('change', function (ev) { if (ev.target.getAttribute('data-x') === 'mois') { S.mois = ev.target.value; charger(); } });
    root.addEventListener('click', function (ev) { var t = ev.target.closest('[data-a]'); if (t && t.getAttribute('data-a') === 'imprimer') { try { (frontWindow()).print(); } catch (e) { W.print(); } } });
    await charger();
    return { detruire: function () {} };
  }

  // ── Publication ──────────────────────────────────────────────────────────
  var API = { version: 'v1', poste: poste, superviser: superviser, rapport: rapport };
  W.__OD_PLATEAU__ = API;
  try { var FW0 = frontWindow(); if (FW0 && FW0 !== W) FW0.__OD_PLATEAU__ = API; } catch (e) {}

  // Monté seul (data-od-module="plateau") : poste, tour de contrôle ou rapport selon l'ancre.
  var OD0 = W.OD || {};
  if (OD0.define) OD0.define('plateau', {
    async mount(el, ctx) {
      var vue = (el.getAttribute && el.getAttribute('data-vue')) || '';
      if (vue === 'rapport') return rapport(el, ctx, {});
      if (vue === 'poste') return poste(el, ctx, {});
      var sup = false;
      try { var r = await ctx.supabase.rpc('plateau_superviseur'); sup = !r.error && r.data === true; } catch (e) {}
      return sup ? superviser(el, ctx, {}) : poste(el, ctx, {});
    }
  });
})();
