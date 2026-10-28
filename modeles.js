// ============================================================================
//  MODÈLES DE MESSAGES — module One Data (OD.define 'modeles')  v2
//  v2 (28/10/2026) : relecture des textes. Variables « le_vehicule » et
//  « du_vehicule » (article accordé : « la Toyota Yaris », « le Toyota C-HR »,
//  « la Lexus ES d'occasion »), nom du véhicule nettoyé en base. Partie
//  facultative avec repli : [[ votre {{vehicule}} || votre véhicule ]].
//  L'aperçu de l'administration applique la même règle que la base.
//  v1 (28/10/2026) — Team Colin.
//  * API partagée window.__OD_MODELES__, posée dès le chargement du fichier :
//      lister({ canal, idClient, idLead, idSite, contexte })  -> modele_rendus
//      choisir({ canal, idClient, idLead, idSite, contexte, univers, doc })
//          -> fenêtre de choix ; Promise<{ id, titre, objet, corps, manquantes } | null>
//      utilise(id)        -> compteur d'utilisation
//      texteHtml(texte)   -> texte -> HTML (e-mail)
//      gerer(el)          -> écran d'administration dans el
//    Utilisée par les fenêtres SMS, WhatsApp et e-mail (fiche client) et par
//    le traitement des leads. Les variables {{...}} sont remplacées en base ;
//    une variable vide devient [libellé] à compléter avant l'envoi.
//  * Monté sur une ancre (data-od-module="modeles"), le module affiche
//    l'écran d'administration (la page Administration l'ouvre dans son onglet
//    « Modèles de messages »).
// ============================================================================
(function () {
  'use strict';
  var W = window;
  var OD = W.OD || {};

  var CANAUX = [
    { id: 'sms', lib: 'SMS', coul: '#e8ae28' },
    { id: 'whatsapp', lib: 'WhatsApp', coul: '#53bda7' },
    { id: 'email', lib: 'E-mail', coul: '#2a5ea9' }
  ];
  var CATEGORIES = [
    ['premier_contact', 'Premier contact'], ['appel_manque', 'Après un appel manqué'], ['essai', 'Essai'],
    ['vehicule_dispo', 'Véhicule disponible'], ['rdv_confirmation', 'Confirmation de RDV'], ['rdv_rappel', 'Rappel de RDV'],
    ['offre', 'Proposition'], ['relance', 'Relance'], ['reprise', 'Reprise'], ['financement', 'Financement'],
    ['documents', 'Pièces du dossier'], ['livraison', 'Livraison'], ['apres_livraison', 'Après livraison'], ['autre', 'Autre']
  ];
  function libCat(c) { for (var i = 0; i < CATEGORIES.length; i++) if (CATEGORIES[i][0] === c) return CATEGORIES[i][1]; return 'Autre'; }
  function libCanal(c) { for (var i = 0; i < CANAUX.length; i++) if (CANAUX[i].id === c) return CANAUX[i].lib; return c; }

  function sb() { return OD.supabase || (W.OD && W.OD.supabase); }
  function esc(v) { return String(v == null ? '' : v).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function fold(v) { return String(v == null ? '' : v).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); }
  function msgErr(e) { var m = (e && (e.message || e.details || e.hint)) || String(e || ''); return m.replace(/^.*?ERROR:\s*/i, ''); }
  async function rpc(nom, args) {
    var r = await sb().rpc(nom, args || {});
    if (r.error) throw r.error;
    return r.data;
  }
  // [libellé] laissé par la base pour une variable vide : mis en évidence
  function surligner(t) { return esc(t).replace(/\[([^\[\]]{2,60})\]/g, '<mark class="odm-trou">[$1]</mark>'); }
  function texteHtml(t) {
    return esc(t || '').split(/\n{2,}/).map(function (p) { return '<p style="margin:0 0 12px">' + p.replace(/\n/g, '<br>') + '</p>'; }).join('');
  }

  // SMS : alphabet GSM 7 bits -> 160 / 153 caractères ; sinon Unicode -> 70 / 67.
  var GSM = '@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !"#¤%&\'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà';
  var GSM_EXT = '^{}\\[~]|€';
  function compteSms(t) {
    t = t || ''; var uni = false, n = 0, bad = [];
    for (var i = 0; i < t.length; i++) {
      var ch = t[i];
      if (GSM.indexOf(ch) !== -1) n += 1;
      else if (GSM_EXT.indexOf(ch) !== -1) n += 2;
      else { uni = true; if (bad.indexOf(ch) === -1) bad.push(ch); }
    }
    if (uni) n = t.length;
    var unite = uni ? 70 : 160, multi = uni ? 67 : 153;
    var sms = n === 0 ? 0 : (n <= unite ? 1 : Math.ceil(n / multi));
    return { car: n, sms: sms, unicode: uni, horsAlphabet: bad };
  }

  // Rendu d'aperçu côté navigateur (valeurs d'exemple) — même règles que la base.
  function appliquer(txt, vars) {
    var t = String(txt || '');
    t = t.replace(/\[\[([\s\S]*?)\]\]/g, function (m, frag) {
      var i = frag.indexOf('||'), a = i >= 0 ? frag.slice(0, i) : frag, b = i >= 0 ? frag.slice(i + 2) : '';
      var ok = true; a.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, function (x, k) { if (!vars[k]) ok = false; return x; });
      return ok ? a : b;
    });
    t = t.replace(/\{\{\s*([a-z_]+)\s*\}\}/g, function (m, k) { return vars[k] != null && vars[k] !== '' ? vars[k] : '[' + k + ']'; });
    return t.replace(/ {2,}/g, ' ').replace(/ ([,.])/g, '$1');
  }
  // Modèles WhatsApp Meta (texte identique à wa-send-text / whatsapp.js)
  function apercuWa(motif, v) {
    return 'Bonjour ' + (v.client_prenom || 'Pierre') + ', ' + (v.vendeur_prenom || 'Julie') + ' de ' + (v.site || 'notre concession') + ' à votre service. '
      + motif + ' Je me permets WhatsApp plutôt que le téléphone : vous me répondez quand cela vous arrange, et je peux vous transmettre photos et documents directement. Si vous préférez un autre canal, dites-le-moi simplement.';
  }

  /* ======================================================================
     STYLE (charte One Data : bleus, vert, orange ; aucun noir)
     ====================================================================== */
  var TOKENS = '--g:#53bda7;--bl:#acc5e4;--o:#fac055;--b:#2a5ea9;--bg:#fafbfd;--card:#fff;--bd:#eaf0f9;'
    + '--t:#2a5ea9;--tm:#7a9cc4;--ts:#4a6a8a;--r:#c4554a;--rbg:#fcebeb;--obg:#fdf2dd;--gbg:#e1f5ee;--bbg:#eaf0f9;--gb:#dde2ea;';
  var CSS = ''
    + '.odm,.odm-ov{' + TOKENS + 'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:13px;color:var(--t);}'
    + '.odm *,.odm-ov *{box-sizing:border-box;}'
    + '.odm-ov{position:fixed;inset:0;z-index:2147483200;background:rgba(28,43,69,.45);display:flex;align-items:center;justify-content:center;padding:16px;}'
    + '.odm-box{background:var(--card);border-radius:14px;width:100%;max-width:880px;max-height:90vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 16px 48px rgba(28,43,69,.3);}'
    + '.odm-box.etroit{max-width:620px;}'
    + '.odm-hd{display:flex;align-items:center;gap:10px;padding:14px 18px;border-bottom:1px solid var(--bd);flex:0 0 auto;}'
    + '.odm-hd h2{margin:0;font-size:15px;font-weight:700;color:var(--b);flex:1;}'
    + '.odm-hd p{margin:2px 0 0;font-size:12px;color:var(--tm);font-weight:400;}'
    + '.odm-x{border:0;background:none;font-size:22px;line-height:1;color:var(--tm);cursor:pointer;padding:2px 6px;border-radius:6px;}'
    + '.odm-x:hover{background:var(--bbg);color:var(--b);}'
    + '.odm-bd{padding:14px 18px;overflow:auto;flex:1 1 auto;}'
    + '.odm-ft{padding:12px 18px;border-top:1px solid var(--bd);display:flex;gap:10px;justify-content:flex-end;align-items:center;flex:0 0 auto;flex-wrap:wrap;}'
    + '.odm-ft .info{margin-right:auto;font-size:12px;color:var(--tm);}'
    + '.odm-btn{border:none;border-radius:8px;padding:9px 16px;font-size:13px;font-weight:600;cursor:pointer;font-family:inherit;}'
    + '.odm-btn.pri{background:var(--b);color:#fff;} .odm-btn.pri:hover{background:#1f4a87;}'
    + '.odm-btn.gh{background:var(--card);border:1px solid var(--bd);color:var(--ts);} .odm-btn.gh:hover{border-color:var(--b);color:var(--b);}'
    + '.odm-btn.dg{background:var(--card);border:1px solid var(--rbg);color:var(--r);} .odm-btn.dg:hover{background:var(--rbg);}'
    + '.odm-btn.sm{padding:6px 11px;font-size:12px;}'
    + '.odm-btn[disabled]{opacity:.5;cursor:default;}'
    + '.odm-in,.odm-sel,.odm-ta{width:100%;border:1px solid var(--gb);border-radius:8px;padding:9px 11px;font-size:14px;color:var(--t);font-family:inherit;background:var(--card);}'
    + '.odm-ta{resize:vertical;min-height:90px;line-height:1.45;}'
    + '.odm-in:focus,.odm-sel:focus,.odm-ta:focus{outline:none;border-color:var(--b);box-shadow:0 0 0 3px var(--bbg);}'
    + '.odm-lbl{display:block;font-size:10px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;color:var(--tm);margin:0 0 5px;}'
    + '.odm-f{margin-bottom:12px;}'
    + '.odm-row{display:flex;gap:12px;flex-wrap:wrap;} .odm-row>.odm-f{flex:1 1 160px;}'
    + '.odm-chips{display:flex;gap:6px;flex-wrap:wrap;}'
    + '.odm-chip{border:1px solid var(--bd);background:var(--card);color:var(--ts);border-radius:999px;padding:5px 11px;font-size:12px;cursor:pointer;font-family:inherit;}'
    + '.odm-chip:hover{border-color:var(--b);color:var(--b);} .odm-chip.on{background:var(--b);border-color:var(--b);color:#fff;}'
    + '.odm-badge{display:inline-block;font-size:10px;font-weight:700;letter-spacing:.3px;padding:2px 7px;border-radius:999px;background:var(--bbg);color:var(--b);vertical-align:1px;}'
    + '.odm-badge.vo{background:var(--obg);color:#8a6014;} .odm-badge.vn{background:var(--gbg);color:#1b7a44;} .odm-badge.site{background:#f0f2f5;color:var(--ts);}'
    + '.odm-badge.off{background:var(--rbg);color:var(--r);}'
    + 'mark.odm-trou{background:var(--obg);color:#8a6014;border-radius:4px;padding:0 3px;font-weight:600;}'
    + '.odm-err{background:var(--rbg);color:var(--r);border-radius:8px;padding:9px 12px;font-size:12.5px;margin:0 0 12px;}'
    + '.odm-warn{background:var(--obg);color:#8a6014;border-radius:8px;padding:9px 12px;font-size:12.5px;margin:8px 0 0;}'
    + '.odm-hint{font-size:12px;color:var(--tm);margin:6px 0 0;line-height:1.45;}'
    + '.odm-empty{padding:30px 10px;text-align:center;color:var(--tm);}'
    + '.odm-spin{display:inline-block;width:16px;height:16px;border:2px solid var(--bbg);border-top-color:var(--b);border-radius:50%;animation:odm-r .7s linear infinite;vertical-align:-3px;margin-right:8px;}'
    + '@keyframes odm-r{to{transform:rotate(360deg)}}'
    /* fenêtre de choix */
    + '.odm-pick{display:grid;grid-template-columns:minmax(220px,300px) 1fr;gap:14px;min-height:320px;}'
    + '.odm-list{display:flex;flex-direction:column;gap:2px;overflow:auto;max-height:56vh;padding-right:4px;}'
    + '.odm-gt{font-size:10px;font-weight:700;letter-spacing:.4px;text-transform:uppercase;color:var(--tm);margin:10px 4px 4px;}'
    + '.odm-gt:first-child{margin-top:0;}'
    + '.odm-it{display:flex;align-items:center;gap:6px;text-align:left;border:1px solid transparent;background:none;border-radius:8px;padding:8px 10px;cursor:pointer;color:var(--ts);font:inherit;width:100%;}'
    + '.odm-it span.t{flex:1;min-width:0;} .odm-it:hover{background:var(--bbg);} .odm-it.on{background:var(--bbg);border-color:var(--bl);color:var(--b);font-weight:600;}'
    + '.odm-it.loin{opacity:.6;}'
    + '.odm-prev{border:1px solid var(--bd);border-radius:12px;background:var(--bg);padding:14px;display:flex;flex-direction:column;gap:8px;min-width:0;}'
    + '.odm-prev .obj{font-weight:700;color:var(--b);}'
    + '.odm-prev .txt{white-space:pre-wrap;line-height:1.5;color:var(--ts);word-break:break-word;}'
    + '.odm-prev .wa{background:#e7f6f2;border-radius:10px;padding:10px 12px;}'
    + '.odm-prev .meta{font-size:11.5px;color:var(--tm);}'
    + '.odm-search{position:relative;margin-bottom:10px;}'
    /* administration */
    + '.odm{width:100%;box-sizing:border-box;}'
    + '.odm-head{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px;}'
    + '.odm-head .sp{flex:1;}'
    + '.odm-tabs{display:flex;gap:6px;flex-wrap:wrap;}'
    + '.odm-tab{border:1px solid var(--bd);background:var(--card);border-radius:10px;padding:8px 14px;font-weight:600;color:var(--ts);cursor:pointer;font-family:inherit;font-size:13px;}'
    + '.odm-tab small{font-weight:600;color:var(--tm);margin-left:6px;}'
    + '.odm-tab.on{background:var(--b);border-color:var(--b);color:#fff;} .odm-tab.on small{color:var(--bl);}'
    + '.odm-filters{display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px;align-items:flex-end;}'
    + '.odm-filters>div{flex:1 1 200px;max-width:320px;}'
    + '.odm-tw{border:1px solid var(--bd);border-radius:10px;overflow:auto;background:var(--card);}'
    + '.odm-tb{width:100%;border-collapse:collapse;font-size:13px;min-width:760px;}'
    + '.odm-tb th{text-align:left;padding:9px 12px;background:#f9fbfd;color:var(--tm);font-weight:700;font-size:10px;letter-spacing:.3px;text-transform:uppercase;border-bottom:1px solid var(--bd);white-space:nowrap;}'
    + '.odm-tb td{padding:10px 12px;border-bottom:.5px solid var(--bd);vertical-align:top;color:var(--ts);}'
    + '.odm-tb tr:last-child td{border-bottom:none;}'
    + '.odm-tb tr.off td{opacity:.55;}'
    + '.odm-tb tr.decl td:first-child{padding-left:30px;}'
    + '.odm-tb .tt{font-weight:600;color:var(--b);cursor:pointer;} .odm-tb .tt:hover{text-decoration:underline;}'
    + '.odm-tb .ex{font-size:12px;color:var(--tm);margin-top:3px;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;max-width:520px;}'
    + '.odm-tb .acts{white-space:nowrap;text-align:right;}'
    + '.odm-sw{position:relative;display:inline-block;width:34px;height:20px;cursor:pointer;vertical-align:middle;}'
    + '.odm-sw i{position:absolute;inset:0;border-radius:999px;background:var(--gb);transition:background .15s;}'
    + '.odm-sw i:after{content:"";position:absolute;top:2px;left:2px;width:16px;height:16px;border-radius:50%;background:#fff;transition:left .15s;box-shadow:0 1px 3px rgba(42,94,169,.3);}'
    + '.odm-sw.on i{background:var(--g);} .odm-sw.on i:after{left:16px;}'
    + '.odm-vars{display:flex;flex-direction:column;gap:6px;margin:6px 0 8px;}'
    + '.odm-vars .grp{display:flex;gap:5px;flex-wrap:wrap;align-items:center;}'
    + '.odm-vars .grp b{font-size:10px;font-weight:700;letter-spacing:.3px;text-transform:uppercase;color:var(--tm);width:74px;flex:0 0 74px;}'
    + '.odm-var{border:1px dashed var(--bl);background:var(--bbg);color:var(--b);border-radius:6px;padding:3px 8px;font-size:11.5px;cursor:pointer;font-family:inherit;}'
    + '.odm-var:hover{border-style:solid;}'
    + '.odm-var.opt{background:var(--obg);border-color:var(--o);color:#8a6014;}'
    + '.odm-ed{display:grid;grid-template-columns:1.15fr 1fr;gap:16px;}'
    + '.odm-cnt{font-size:12px;color:var(--tm);margin-top:6px;} .odm-cnt b{color:var(--b);}'
    + '.odm-cnt.alerte b{color:#8a6014;}'
    + '.odm-toast{position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:2147483300;background:var(--b);color:#fff;padding:11px 18px;border-radius:10px;font-size:13px;box-shadow:0 10px 30px rgba(28,43,69,.28);font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;}'
    + '.odm-toast.ko{background:var(--r);}'
    + '@media (max-width:720px){.odm-pick,.odm-ed{grid-template-columns:1fr;}.odm-list{max-height:30vh;}.odm-box{max-height:94vh;}.odm-ov{padding:8px;}'
    + '.odm-in,.odm-sel,.odm-ta{font-size:16px;}.odm-filters>div{max-width:none;}.odm-tb{min-width:0;}.odm-tb thead{display:none;}'
    + '.odm-tb tr{display:block;border-bottom:1px solid var(--bd);padding:6px 0;}.odm-tb td{display:block;border:0;padding:4px 12px;}.odm-tb .acts{text-align:left;}.odm-tb tr.decl td:first-child{padding-left:24px;}}';
  function style(d) {
    if (d.getElementById('odm-style')) return;
    var s = d.createElement('style'); s.id = 'odm-style'; s.textContent = CSS; d.head.appendChild(s);
  }
  function toast(d, msg, ko) {
    var t = d.createElement('div'); t.className = 'odm-toast' + (ko ? ' ko' : ''); t.textContent = msg; d.body.appendChild(t);
    setTimeout(function () { try { t.remove(); } catch (e) { } }, 3200);
  }

  /* ======================================================================
     LECTURE (vendeurs)
     ====================================================================== */
  async function lister(o) {
    o = o || {};
    var r = await rpc('modele_rendus', {
      p_canal: o.canal, p_id_client: o.idClient != null && o.idClient !== '' ? Number(o.idClient) : null,
      p_id_lead: o.idLead != null && o.idLead !== '' ? Number(o.idLead) : null,
      p_id_site: o.idSite != null && o.idSite !== '' ? Number(o.idSite) : null,
      p_contexte: o.contexte || null
    });
    return r || [];
  }
  function utilise(id) { if (id == null) return; try { sb().rpc('modele_utilise', { p_id: Number(id) }).then(function () { }, function () { }); } catch (e) { } }

  // Ordre de présentation : univers du lead d'abord, puis catégorie, puis ordre.
  function trier(liste, univers) {
    var rang = {}; CATEGORIES.forEach(function (c, i) { rang[c[0]] = i; });
    return liste.slice().sort(function (a, b) {
      var la = univers && a.univers !== 'tous' && a.univers !== univers ? 1 : 0, lb = univers && b.univers !== 'tous' && b.univers !== univers ? 1 : 0;
      if (la !== lb) return la - lb;
      var ca = rang[a.categorie] != null ? rang[a.categorie] : 99, cb = rang[b.categorie] != null ? rang[b.categorie] : 99;
      if (ca !== cb) return ca - cb;
      return (a.ordre || 0) - (b.ordre || 0);
    });
  }

  function choisir(o) {
    o = o || {};
    var d = o.doc || document;
    style(d);
    return new Promise(function (resolve) {
      var st = { liste: null, err: null, q: '', sel: null, cat: '' };
      var ov = d.createElement('div'); ov.className = 'odm-ov';
      d.body.appendChild(ov);
      function fin(v) { try { d.removeEventListener('keydown', clavier, true); ov.remove(); } catch (e) { } resolve(v); }
      function clavier(e) { if (e.key === 'Escape') { e.stopPropagation(); fin(null); } }
      d.addEventListener('keydown', clavier, true);
      function visibles() {
        var q = fold(st.q);
        return (st.liste || []).filter(function (m) {
          if (st.cat && m.categorie !== st.cat) return false;
          return !q || fold(m.titre + ' ' + m.corps + ' ' + (m.objet || '') + ' ' + libCat(m.categorie)).indexOf(q) !== -1;
        });
      }
      function courant() { var v = visibles(); for (var i = 0; i < v.length; i++) if (v[i].id === st.sel) return v[i]; return v[0] || null; }
      function rendre() {
        var lib = libCanal(o.canal), h = '<div class="odm-box"><div class="odm-hd"><div style="flex:1"><h2>Modèles ' + esc(lib) + '</h2>'
          + '<p>' + (o.canal === 'whatsapp' && o.motif ? 'Le texte choisi devient le motif du message WhatsApp.' : 'Le texte choisi remplace celui de votre message ; vous le relisez avant l\'envoi.') + '</p></div>'
          + '<button class="odm-x" data-a="x" aria-label="Fermer">×</button></div><div class="odm-bd">';
        if (st.err) h += '<div class="odm-err">' + esc(st.err) + '</div>';
        if (!st.liste && !st.err) h += '<div class="odm-empty"><span class="odm-spin"></span>Préparation des modèles…</div>';
        else if (st.liste && !st.liste.length) h += '<div class="odm-empty">Aucun modèle ' + esc(lib) + ' n\'est encore défini. L\'administrateur les crée dans Administration › Modèles de messages.</div>';
        else if (st.liste) {
          var cats = []; st.liste.forEach(function (m) { if (cats.indexOf(m.categorie) === -1) cats.push(m.categorie); });
          h += '<div class="odm-search"><input class="odm-in" data-x="q" type="search" placeholder="Rechercher un modèle…" value="' + esc(st.q) + '"></div>';
          if (cats.length > 3) h += '<div class="odm-chips" style="margin-bottom:10px"><button class="odm-chip' + (!st.cat ? ' on' : '') + '" data-a="cat" data-v="">Tous</button>'
            + cats.map(function (c) { return '<button class="odm-chip' + (st.cat === c ? ' on' : '') + '" data-a="cat" data-v="' + esc(c) + '">' + esc(libCat(c)) + '</button>'; }).join('') + '</div>';
          var v = visibles(), cur = courant(), last = null;
          h += '<div class="odm-pick"><div class="odm-list">';
          if (!v.length) h += '<div class="odm-empty">Aucun modèle ne correspond.</div>';
          v.forEach(function (m) {
            var g = libCat(m.categorie);
            if (g !== last) { h += '<div class="odm-gt">' + esc(g) + '</div>'; last = g; }
            var loin = o.univers && m.univers !== 'tous' && m.univers !== o.univers;
            h += '<button class="odm-it' + (cur && cur.id === m.id ? ' on' : '') + (loin ? ' loin' : '') + '" data-a="sel" data-v="' + m.id + '"><span class="t">' + esc(m.titre) + '</span>'
              + (m.univers !== 'tous' ? '<span class="odm-badge ' + m.univers.toLowerCase() + '">' + m.univers + '</span>' : '')
              + (m.specifique_site ? '<span class="odm-badge site" title="Version propre à votre site">site</span>' : '') + '</button>';
          });
          h += '</div><div class="odm-prev">';
          if (cur) {
            if (cur.objet) h += '<div class="obj">' + surligner(cur.objet) + '</div>';
            h += '<div class="txt' + (o.canal === 'whatsapp' && o.motif ? ' wa' : '') + '">' + surligner(cur.corps) + '</div>';
            if (cur.manquantes && cur.manquantes.length) h += '<div class="odm-warn">À compléter après insertion : ' + cur.manquantes.map(esc).join(', ') + '.</div>';
            if (o.canal === 'sms') { var c = compteSms(cur.corps); h += '<div class="meta">' + c.car + ' caractères · ' + c.sms + ' SMS' + (c.unicode ? ' (accents spéciaux : 70 caractères par SMS)' : '') + '</div>'; }
          }
          h += '</div></div>';
        }
        h += '</div><div class="odm-ft"><button class="odm-btn gh" data-a="x">Annuler</button>'
          + '<button class="odm-btn pri" data-a="ok"' + (st.liste && courant() ? '' : ' disabled') + '>Utiliser ce modèle</button></div></div>';
        ov.innerHTML = h;
        var qi = ov.querySelector('[data-x="q"]');
        if (qi) {
          qi.addEventListener('input', function () { st.q = qi.value; var pos = qi.selectionStart; rendre(); var n = ov.querySelector('[data-x="q"]'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (e) { } } });
          if (st._focus) { qi.focus(); st._focus = false; }
        }
      }
      ov.addEventListener('click', function (e) {
        if (e.target === ov) return fin(null);
        var b = e.target.closest('[data-a]'); if (!b) return;
        var a = b.getAttribute('data-a'), v = b.getAttribute('data-v');
        if (a === 'x') return fin(null);
        if (a === 'cat') { st.cat = v; st.sel = null; return rendre(); }
        if (a === 'sel') { st.sel = Number(v); return rendre(); }
        if (a === 'ok') { var m = courant(); if (!m) return; utilise(m.id); return fin({ id: m.id, titre: m.titre, objet: m.objet, corps: m.corps, manquantes: m.manquantes || [], categorie: m.categorie }); }
      });
      // double-clic sur un modèle = l'utiliser
      ov.addEventListener('dblclick', function (e) { var b = e.target.closest('[data-a="sel"]'); if (b) { var m = courant(); if (m) { utilise(m.id); fin({ id: m.id, titre: m.titre, objet: m.objet, corps: m.corps, manquantes: m.manquantes || [], categorie: m.categorie }); } } });
      st._focus = true;
      rendre();
      lister(o).then(function (l) {
        st.liste = trier(l, o.univers);
        if (o.categorie) { var x = st.liste.filter(function (m) { return m.categorie === o.categorie; })[0]; if (x) st.sel = x.id; }
        rendre();
      }, function (e) { st.err = 'Modèles indisponibles : ' + msgErr(e); st.liste = []; rendre(); });
    });
  }

  /* ======================================================================
     ADMINISTRATION
     ====================================================================== */
  function gerer(el) {
    var d = el.ownerDocument || document;
    style(d);
    el.classList.add('odm');
    var st = { canal: 'sms', q: '', site: '', data: null, err: null };
    var EX = {};

    async function charger() {
      try {
        st.data = await rpc('modele_admin_lister');
        EX = {}; (st.data.variables || []).forEach(function (v) { EX[v.cle] = v.exemple; });
        st.err = null;
      } catch (e) { st.err = msgErr(e); st.data = st.data || { modeles: [], sites: [], variables: [] }; }
      rendre();
    }
    function sites() {
      var s = (st.data && st.data.sites) || [], n = {};
      s.forEach(function (x) { n[x.site] = (n[x.site] || 0) + 1; });
      return s.map(function (x) { return { id_site: x.id_site, site: n[x.site] > 1 && x.code ? x.site + ' (' + x.code + ')' : x.site }; });
    }
    function libSite(id) { var s = sites().filter(function (x) { return String(x.id_site) === String(id); })[0]; return s ? s.site : 'Site ' + id; }
    function modeles() { return (st.data && st.data.modeles) || []; }
    function parId(id) { return modeles().filter(function (m) { return String(m.id) === String(id); })[0]; }
    function enfants(m) { return modeles().filter(function (x) { return String(x.id_parent) === String(m.id); }); }

    function lignes() {
      var q = fold(st.q), ms = modeles().filter(function (m) { return m.canal === st.canal; });
      var racines = ms.filter(function (m) { return m.id_parent == null; });
      if (st.site) racines = racines.filter(function (m) { return m.id_site == null || String(m.id_site) === String(st.site); });
      var out = [];
      racines.forEach(function (m) {
        var ds = enfants(m).filter(function (x) { return !st.site || String(x.id_site) === String(st.site); });
        var txt = fold(m.titre + ' ' + m.corps + ' ' + (m.objet || '') + ' ' + libCat(m.categorie) + ' ' + ds.map(function (x) { return libSite(x.id_site); }).join(' '));
        if (q && txt.indexOf(q) === -1) return;
        out.push({ m: m, decl: false });
        ds.forEach(function (x) { out.push({ m: x, decl: true }); });
      });
      return out;
    }

    function rendre() {
      var h = '<div class="odm-head"><div class="odm-tabs">' + CANAUX.map(function (c) {
          var n = modeles().filter(function (m) { return m.canal === c.id && m.id_parent == null; }).length;
          return '<button class="odm-tab' + (st.canal === c.id ? ' on' : '') + '" data-a="canal" data-v="' + c.id + '">' + c.lib + '<small>' + n + '</small></button>'; }).join('')
        + '</div><span class="sp"></span><button class="odm-btn pri" data-a="nouveau">+ Nouveau modèle ' + esc(libCanal(st.canal)) + '</button></div>';
      h += '<p class="odm-hint" style="margin:0 0 12px">Les modèles sont proposés aux équipes dans les fenêtres SMS, WhatsApp et e-mail de la fiche client et dans le traitement des leads. '
        + 'Un modèle « groupe » sert à tous les sites ; une <b>déclinaison</b> le remplace pour un site qui en fait la demande.'
        + (st.canal === 'whatsapp' ? ' <b>WhatsApp</b> : hors conversation ouverte, Meta impose son message ; le texte du modèle s\'y insère comme motif, après « Bonjour …, … à votre service. »' : '')
        + (st.canal === 'email' ? ' <b>E-mail</b> : la signature du vendeur s\'ajoute toute seule à la fin.' : '') + '</p>';
      h += '<div class="odm-filters"><div><label class="odm-lbl">Rechercher</label><input class="odm-in" type="search" data-x="q" placeholder="Titre, texte, site…" value="' + esc(st.q) + '"></div>'
        + '<div><label class="odm-lbl">Site</label><select class="odm-sel" data-x="site"><option value="">Tous les sites</option>' + sites().map(function (s) {
          return '<option value="' + s.id_site + '"' + (String(st.site) === String(s.id_site) ? ' selected' : '') + '>' + esc(s.site) + '</option>'; }).join('') + '</select></div></div>';
      if (st.err) h += '<div class="odm-err">' + esc(st.err) + '</div>';
      if (!st.data) h += '<div class="odm-empty"><span class="odm-spin"></span>Chargement des modèles…</div>';
      else {
        var L = lignes();
        if (!L.length) h += '<div class="odm-tw"><div class="odm-empty">Aucun modèle ' + esc(libCanal(st.canal)) + (st.q || st.site ? ' ne correspond aux filtres' : ' pour l\'instant') + '.</div></div>';
        else {
          h += '<div class="odm-tw"><table class="odm-tb"><thead><tr><th>Modèle</th><th>Catégorie</th><th>Portée</th><th>Utilisé</th><th>Actif</th><th></th></tr></thead><tbody>';
          L.forEach(function (x) {
            var m = x.m, portee = m.id_parent != null ? '<span class="odm-badge site">Déclinaison · ' + esc(libSite(m.id_site)) + '</span>'
              : m.id_site != null ? '<span class="odm-badge site">' + esc(libSite(m.id_site)) + ' seulement</span>' : '<span class="odm-badge">Groupe</span>';
            var ctx = (m.contextes || []).map(function (c) { return c === 'lead' ? 'Leads' : 'Fiche client'; }).join(' · ');
            h += '<tr class="' + (m.actif ? '' : 'off') + (x.decl ? ' decl' : '') + '"><td><div class="tt" data-a="edit" data-v="' + m.id + '">' + (x.decl ? '↳ ' : '') + esc(m.titre) + ' '
              + (m.univers !== 'tous' ? '<span class="odm-badge ' + m.univers.toLowerCase() + '">' + m.univers + '</span>' : '') + '</div>'
              + '<div class="ex">' + esc(m.objet ? m.objet + ' — ' + m.corps : m.corps) + '</div></td>'
              + '<td>' + esc(libCat(m.categorie)) + '<div class="ex">' + esc(ctx) + '</div></td><td>' + portee + '</td>'
              + '<td>' + (m.nb_utilisations || 0) + '</td>'
              + '<td><span class="odm-sw' + (m.actif ? ' on' : '') + '" data-a="actif" data-v="' + m.id + '" title="' + (m.actif ? 'Désactiver' : 'Activer') + '"><i></i></span></td>'
              + '<td class="acts"><button class="odm-btn gh sm" data-a="edit" data-v="' + m.id + '">Modifier</button> '
              + (m.id_parent == null && m.id_site == null ? '<button class="odm-btn gh sm" data-a="decliner" data-v="' + m.id + '">Décliner pour un site</button> ' : '')
              + '<button class="odm-btn dg sm" data-a="suppr" data-v="' + m.id + '">Supprimer</button></td></tr>';
          });
          h += '</tbody></table></div>';
        }
      }
      el.innerHTML = h;
      var qi = el.querySelector('[data-x="q"]');
      if (qi) qi.addEventListener('input', function () { st.q = qi.value; var p = qi.selectionStart; rendre(); var n = el.querySelector('[data-x="q"]'); if (n) { n.focus(); try { n.setSelectionRange(p, p); } catch (e) { } } });
      var si = el.querySelector('[data-x="site"]');
      if (si) si.addEventListener('change', function () { st.site = si.value; rendre(); });
    }

    el.addEventListener('click', async function (e) {
      var b = e.target.closest('[data-a]'); if (!b || !el.contains(b)) return;
      var a = b.getAttribute('data-a'), v = b.getAttribute('data-v');
      if (a === 'canal') { st.canal = v; return rendre(); }
      if (a === 'nouveau') return editer({ canal: st.canal, categorie: 'autre', titre: '', objet: '', corps: '', univers: 'tous', contextes: ['client', 'lead'], id_site: st.site ? Number(st.site) : null, actif: true, ordre: 100 });
      if (a === 'edit') return editer(parId(v));
      if (a === 'decliner') return decliner(parId(v));
      if (a === 'actif') {
        var m = parId(v); if (!m) return;
        try { await rpc('modele_enregistrer', { p: { id: m.id, titre: m.titre, corps: m.corps, objet: m.objet, actif: !m.actif } }); m.actif = !m.actif; rendre();
          toast(d, m.actif ? 'Modèle activé.' : (m.id_parent != null ? 'Modèle retiré pour ce site.' : 'Modèle désactivé.'));
        } catch (er) { toast(d, msgErr(er), true); }
        return;
      }
      if (a === 'suppr') {
        var s = parId(v); if (!s) return;
        var nb = enfants(s).length;
        confirmer('Supprimer « ' + s.titre + ' » ?', (s.id_parent != null ? 'Le site retrouvera le modèle du groupe.' : nb ? 'Ses ' + nb + ' déclinaison' + (nb > 1 ? 's' : '') + ' par site seront supprimées aussi. ' : '') + 'Pour simplement le retirer aux équipes, désactivez-le plutôt.', 'Supprimer', async function () {
          await rpc('modele_supprimer', { p_id: s.id }); toast(d, 'Modèle supprimé.'); await charger();
        });
      }
    });

    function overlay(inner, etroit) {
      var ov = d.createElement('div'); ov.className = 'odm-ov';
      ov.innerHTML = '<div class="odm-box' + (etroit ? ' etroit' : '') + '">' + inner + '</div>';
      d.body.appendChild(ov);
      ov.addEventListener('mousedown', function (e) { if (e.target === ov) ov._down = true; });
      ov.addEventListener('click', function (e) { if (e.target === ov && ov._down) ov.remove(); ov._down = false; });
      return ov;
    }
    function confirmer(titre, texte, bouton, action) {
      var ov = overlay('<div class="odm-hd"><h2>' + esc(titre) + '</h2><button class="odm-x" data-a="x">×</button></div><div class="odm-bd"><p style="margin:0;color:var(--ts)">' + esc(texte) + '</p><div class="odm-err" style="display:none;margin-top:12px"></div></div>'
        + '<div class="odm-ft"><button class="odm-btn gh" data-a="x">Annuler</button><button class="odm-btn pri" data-a="ok">' + esc(bouton) + '</button></div>', true);
      ov.addEventListener('click', async function (e) {
        var b = e.target.closest('[data-a]'); if (!b) return;
        if (b.getAttribute('data-a') === 'x') return ov.remove();
        b.disabled = true;
        try { await action(); ov.remove(); } catch (er) { var x = ov.querySelector('.odm-err'); x.style.display = 'block'; x.textContent = msgErr(er); b.disabled = false; }
      });
    }

    function decliner(m) {
      if (!m) return;
      var deja = enfants(m).map(function (x) { return String(x.id_site); });
      var dispo = sites().filter(function (s) { return deja.indexOf(String(s.id_site)) === -1; });
      var ov = overlay('<div class="odm-hd"><div style="flex:1"><h2>Décliner « ' + esc(m.titre) + ' »</h2><p>Le site choisi recevra sa propre version, à la place de celle du groupe.</p></div><button class="odm-x" data-a="x">×</button></div>'
        + '<div class="odm-bd"><label class="odm-lbl">Site</label><select class="odm-sel" data-x="s">' + (dispo.length ? dispo.map(function (s) { return '<option value="' + s.id_site + '">' + esc(s.site) + '</option>'; }).join('') : '<option value="">Tous les sites ont déjà leur déclinaison</option>') + '</select>'
        + '<p class="odm-hint">La déclinaison démarre avec le texte du groupe : vous l\'adaptez ensuite. Les changements faits plus tard sur le modèle du groupe ne s\'y reportent pas.</p><div class="odm-err" style="display:none;margin-top:12px"></div></div>'
        + '<div class="odm-ft"><button class="odm-btn gh" data-a="x">Annuler</button><button class="odm-btn pri" data-a="ok"' + (dispo.length ? '' : ' disabled') + '>Créer la déclinaison</button></div>', true);
      ov.addEventListener('click', async function (e) {
        var b = e.target.closest('[data-a]'); if (!b) return;
        if (b.getAttribute('data-a') === 'x') return ov.remove();
        var s = ov.querySelector('[data-x="s"]').value; if (!s) return;
        b.disabled = true;
        try { var id = await rpc('modele_decliner', { p_id: m.id, p_id_site: Number(s) }); ov.remove(); await charger(); editer(parId(id)); }
        catch (er) { var x = ov.querySelector('.odm-err'); x.style.display = 'block'; x.textContent = msgErr(er); b.disabled = false; }
      });
    }

    function editer(m0) {
      if (!m0) return;
      var m = JSON.parse(JSON.stringify(m0)), canal = m.canal, parent = m.id_parent != null ? parId(m.id_parent) : null;
      var vars = (st.data && st.data.variables) || [];
      var groupes = []; vars.forEach(function (v) { if (groupes.indexOf(v.groupe) === -1) groupes.push(v.groupe); });
      var titre = m.id ? (parent ? 'Déclinaison pour ' + libSite(m.id_site) : 'Modifier le modèle') : 'Nouveau modèle ' + libCanal(canal);
      var h = '<div class="odm-hd"><div style="flex:1"><h2>' + esc(titre) + '</h2><p>' + esc(libCanal(canal)) + (parent ? ' · modèle du groupe : « ' + esc(parent.titre) + ' »' : '') + '</p></div><button class="odm-x" data-a="x">×</button></div><div class="odm-bd">'
        + '<div class="odm-err" style="display:none"></div>'
        + '<div class="odm-ed"><div>'
        + '<div class="odm-f"><label class="odm-lbl">Titre (vu par les vendeurs)</label><input class="odm-in" data-f="titre" value="' + esc(m.titre) + '" placeholder="Ex. Proposer un essai"></div>'
        + '<div class="odm-row"><div class="odm-f"><label class="odm-lbl">Catégorie</label><select class="odm-sel" data-f="categorie">' + CATEGORIES.map(function (c) { return '<option value="' + c[0] + '"' + (m.categorie === c[0] ? ' selected' : '') + '>' + c[1] + '</option>'; }).join('') + '</select></div>'
        + '<div class="odm-f"><label class="odm-lbl">Pour</label><select class="odm-sel" data-f="univers">' + [['tous', 'VN et VO'], ['VN', 'VN seulement'], ['VO', 'VO seulement']].map(function (u) { return '<option value="' + u[0] + '"' + (m.univers === u[0] ? ' selected' : '') + '>' + u[1] + '</option>'; }).join('') + '</select></div></div>'
        + '<div class="odm-row"><div class="odm-f"><label class="odm-lbl">Proposé dans</label><div class="odm-chips">'
        + '<button class="odm-chip' + ((m.contextes || []).indexOf('client') !== -1 ? ' on' : '') + '" data-a="ctx" data-v="client">Fiche client</button>'
        + '<button class="odm-chip' + ((m.contextes || []).indexOf('lead') !== -1 ? ' on' : '') + '" data-a="ctx" data-v="lead">Traitement des leads</button></div></div>'
        + (parent ? '' : '<div class="odm-f"><label class="odm-lbl">Portée</label><select class="odm-sel" data-f="id_site"' + (m.id && enfants(m).length ? ' disabled title="Ce modèle a des déclinaisons : il reste un modèle du groupe."' : '') + '><option value="">Tout le groupe</option>'
          + sites().map(function (s) { return '<option value="' + s.id_site + '"' + (String(m.id_site) === String(s.id_site) ? ' selected' : '') + '>' + esc(s.site) + ' seulement</option>'; }).join('') + '</select></div>')
        + '</div>'
        + (canal === 'email' ? '<div class="odm-f"><label class="odm-lbl">Objet</label><input class="odm-in" data-f="objet" value="' + esc(m.objet || '') + '" placeholder="Ex. Votre essai à {{site}}"></div>' : '')
        + '<div class="odm-f"><label class="odm-lbl">' + (canal === 'whatsapp' ? 'Motif (une seule ligne, sans « Bonjour »)' : 'Texte') + '</label>'
        + '<div class="odm-vars">' + groupes.map(function (g) {
            return '<div class="grp"><b>' + esc(g) + '</b>' + vars.filter(function (v) { return v.groupe === g; }).map(function (v) {
              return '<button class="odm-var" data-a="var" data-v="' + v.cle + '" title="' + esc(v.libelle) + ' — ex. ' + esc(v.exemple) + '">' + esc(v.libelle.replace(/\s*\(.*\)$/, '')) + '</button>'; }).join('') + '</div>'; }).join('')
        + '<div class="grp"><b>Mise en forme</b><button class="odm-var opt" data-a="facultatif" title="Sélectionnez une partie du texte : elle disparaîtra si une variable qu\'elle contient est vide.">[[ partie facultative ]]</button>'
        + '<button class="odm-var opt" data-a="repli" title="Texte de remplacement quand la variable est vide.">[[ … || repli ]]</button></div></div>'
        + '<textarea class="odm-ta" data-f="corps" rows="' + (canal === 'email' ? 12 : 5) + '">' + esc(m.corps || '') + '</textarea>'
        + '<div class="odm-cnt" data-x="cnt"></div>'
        + '<p class="odm-hint">Cliquez une variable pour l\'insérer à l\'endroit du curseur. Pour le véhicule, préférez <b>« Véhicule avec article »</b> (« le Toyota C-HR », « la Toyota Yaris ») à « le {{vehicule}} » : l\'article est accordé tout seul. '
        + 'Une variable sans valeur pour un client devient [à compléter] dans le message du vendeur, sauf dans une <b>partie facultative</b> : [[ concernant {{le_vehicule}} ]] disparaît entièrement, et [[ votre {{vehicule}} || votre véhicule ]] prend le texte après « || ».</p></div>'
        + '<div class="odm-row"><div class="odm-f" style="flex:0 0 120px"><label class="odm-lbl">Ordre</label><input class="odm-in" type="number" data-f="ordre" value="' + esc(m.ordre != null ? m.ordre : 100) + '"></div>'
        + '<div class="odm-f"><label class="odm-lbl">État</label><div class="odm-chips"><button class="odm-chip' + (m.actif ? ' on' : '') + '" data-a="etat" data-v="1">Actif</button><button class="odm-chip' + (!m.actif ? ' on' : '') + '" data-a="etat" data-v="0">' + (parent ? 'Retiré pour ce site' : 'Désactivé') + '</button></div></div></div>'
        + '</div><div><label class="odm-lbl">Aperçu avec un client fictif</label><div class="odm-prev" data-x="prev"></div>'
        + (parent ? '<label class="odm-lbl" style="margin-top:14px">Texte du modèle groupe</label><div class="odm-prev"><div class="txt">' + esc((parent.objet ? parent.objet + '\n\n' : '') + parent.corps) + '</div></div>' : '')
        + '</div></div></div>'
        + '<div class="odm-ft">' + (m.id ? '<span class="info">' + esc((m.nb_utilisations || 0) + ' utilisation' + (m.nb_utilisations > 1 ? 's' : '') + (m.modifie_par ? ' · modifié par ' + m.modifie_par : '')) + '</span>' : '<span class="info"></span>')
        + '<button class="odm-btn gh" data-a="x">Annuler</button><button class="odm-btn pri" data-a="save">Enregistrer</button></div>';
      var ov = overlay(h);
      var ta = ov.querySelector('[data-f="corps"]'), obj = ov.querySelector('[data-f="objet"]'), last = ta;
      function apercu() {
        var t = ta.value;
        if (canal === 'whatsapp' && /[\r\n\t]/.test(t)) { var p = ta.selectionStart; ta.value = t.replace(/[\r\n\t]+/g, ' '); t = ta.value; try { ta.setSelectionRange(p, p); } catch (e) { } }
        var r = appliquer(t, EX), pv = ov.querySelector('[data-x="prev"]'), ph = '';
        if (canal === 'email') ph += '<div class="obj">' + surligner(appliquer(obj ? obj.value : '', EX)) + '</div>';
        ph += '<div class="txt' + (canal === 'whatsapp' ? ' wa' : '') + '">' + surligner(canal === 'whatsapp' ? apercuWa(r, EX) : r) + '</div>';
        if (canal === 'whatsapp') ph += '<div class="meta">Hors conversation ouverte, Meta envoie ce message ; dans une conversation ouverte, seul votre texte part.</div>';
        if (canal === 'email') ph += '<div class="meta">+ la signature du vendeur</div>';
        pv.innerHTML = ph;
        var cnt = ov.querySelector('[data-x="cnt"]');
        if (canal === 'sms') {
          var c = compteSms(r);
          cnt.className = 'odm-cnt' + (c.unicode || c.sms > 2 ? ' alerte' : '');
          cnt.innerHTML = 'Avec l\'exemple : <b>' + c.car + ' caractères · ' + c.sms + ' SMS</b>' + (c.unicode ? ' — caractères hors alphabet SMS (' + esc(c.horsAlphabet.join(' ')) + ') : 70 caractères par SMS au lieu de 160. Remplacez ê, ç, â, ô, î, û, ’ ou « » si possible.' : '');
        } else cnt.innerHTML = '';
      }
      ta.addEventListener('input', apercu); if (obj) obj.addEventListener('input', apercu);
      ta.addEventListener('focus', function () { last = ta; }); if (obj) obj.addEventListener('focus', function () { last = obj; });
      apercu();
      function inserer(champ, txt) {
        var s = champ.selectionStart != null ? champ.selectionStart : champ.value.length, e = champ.selectionEnd != null ? champ.selectionEnd : s;
        champ.value = champ.value.slice(0, s) + txt + champ.value.slice(e);
        champ.focus(); try { champ.setSelectionRange(s + txt.length, s + txt.length); } catch (x) { }
        apercu();
      }
      ov.addEventListener('click', async function (e) {
        var b = e.target.closest('[data-a]'); if (!b) return;
        var a = b.getAttribute('data-a'), v = b.getAttribute('data-v');
        if (a === 'x') return ov.remove();
        if (a === 'var') return inserer(last || ta, '{{' + v + '}}');
        if (a === 'facultatif') {
          var c = last || ta, s = c.selectionStart, en = c.selectionEnd;
          if (s != null && en > s) { var sel = c.value.slice(s, en); c.value = c.value.slice(0, s) + '[[' + sel + ']]' + c.value.slice(en); c.focus(); try { c.setSelectionRange(s, en + 4); } catch (x) { } apercu(); }
          else inserer(c, '[[ ]]');
          return;
        }
        if (a === 'repli') {
          var c2 = last || ta, s2 = c2.selectionStart, e2 = c2.selectionEnd;
          var sel2 = (s2 != null && e2 > s2) ? c2.value.slice(s2, e2) : '';
          inserer(c2, '[[' + (sel2 || ' ') + '|| ]]');
          return;
        }
        if (a === 'ctx') { b.classList.toggle('on'); return; }
        if (a === 'etat') { ov.querySelectorAll('[data-a="etat"]').forEach(function (x) { x.classList.toggle('on', x === b); }); return; }
        if (a === 'save') {
          var g = function (f) { var x = ov.querySelector('[data-f="' + f + '"]'); return x ? x.value : null; };
          var ctx = []; ov.querySelectorAll('[data-a="ctx"].on').forEach(function (x) { ctx.push(x.getAttribute('data-v')); });
          var err = ov.querySelector('.odm-err');
          if (!ctx.length) { err.style.display = 'block'; err.textContent = 'Choisissez au moins un endroit où proposer ce modèle.'; return; }
          var p = { id: m.id || null, canal: canal, titre: g('titre'), categorie: g('categorie'), univers: g('univers'), contextes: ctx,
            objet: canal === 'email' ? g('objet') : null, corps: ta.value, ordre: g('ordre'),
            actif: !!ov.querySelector('[data-a="etat"][data-v="1"].on') };
          var sSel = ov.querySelector('[data-f="id_site"]');
          if (sSel && !sSel.disabled) p.id_site = sSel.value || '';
          b.disabled = true;
          try { await rpc('modele_enregistrer', { p: p }); ov.remove(); toast(d, 'Modèle enregistré.'); await charger(); }
          catch (er) { err.style.display = 'block'; err.textContent = msgErr(er); b.disabled = false; err.scrollIntoView({ block: 'nearest' }); }
        }
      });
      setTimeout(function () { var t = ov.querySelector('[data-f="titre"]'); if (t && !m.titre) t.focus(); }, 30);
    }

    rendre();
    charger();
    return { recharger: charger };
  }

  W.__OD_MODELES__ = { lister: lister, choisir: choisir, utilise: utilise, texteHtml: texteHtml, gerer: gerer, compteSms: compteSms, CATEGORIES: CATEGORIES };

  if (OD.define) OD.define('modeles', {
    mount: function (el) { gerer(el); }
  });
})();
