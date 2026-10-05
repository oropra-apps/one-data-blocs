// ============================================================================
//  LEAD MANAGEMENT · TEAM COLIN — module One Data (OD.define 'lead-mgmt')  tc1
//
//  Refonte du lead management de Team Colin. Un poste de travail à deux
//  zones, le même pour tous les profils :
//    · à gauche, les SIGNAUX : ce qui arrive, chacun avec son action ;
//    · à droite, les ACTIONS : quelques onglets, chacun répond à une question.
//
//  ÉTAPE 1 (cette version) : le poste du plateau VROOM.
//    · Rôle 10 (opérateur plateau) : le poste VROOM.
//    · Rôles 1 et 8 : la vue habituelle, et le poste VROOM en aperçu avec
//      #plateau dans l'adresse de la page.
//    · Tous les autres rôles : la version 48 du module, chargée telle quelle
//      depuis le CDN (épinglée par son commit). Rien ne change pour eux.
//
//  DONNÉES : uniquement les fonctions plateau_* du tenant Team Colin
//  (teamcolin_plateau_vroom.sql). Elles lisent la copie BACS synchronisée par
//  l'extension, refusent tout utilisateur hors rôles 1, 8 et 10, et
//  n'écrivent dans BACS que si lead_collecte_config.plateau_ecrire_bacs = oui.
//
//  DÉPLOIEMENT CIBLÉ : ce fichier n'existe que pour Team Colin. Il est servi
//  par une code_version dédiée du module « lead-mgmt » épinglée sur le tenant
//  6. Retour arrière : ré-épingler la version 48.
// ============================================================================
(function () {
  'use strict';

  // Version d'origine, servie aux rôles qui n'ont pas encore leur poste.
  var LEGACY_URL = 'https://cdn.jsdelivr.net/gh/oropra-apps/one-data-blocs@6383ae37cc242b32685fd155feefae361f23e9f6/lead-mgmt.js';
  var ROLES_PLATEAU = [10];
  var ROLES_APERCU = [1, 8];

  function frontWindow() {
    try { var w = window.wwLib && wwLib.getFrontWindow && wwLib.getFrontWindow(); if (w) return w; } catch (e) {}
    return window;
  }

  // ── La version 48, pour les autres rôles ─────────────────────────────────
  // Elle se déclare elle aussi sous la clé « lead-mgmt » : on la charge, on
  // garde sa définition à part, et on remet la nôtre en place.
  var legacyPromise = null;
  function chargerLegacy() {
    if (legacyPromise) return legacyPromise;
    legacyPromise = new Promise(function (resolve, reject) {
      var mienne = OD.modules['lead-mgmt'];
      var s = document.createElement('script');
      s.src = LEGACY_URL; s.async = true;
      s.onload = function () {
        var legacy = OD.modules['lead-mgmt'];
        OD.modules['lead-mgmt'] = mienne;
        if (!legacy || legacy === mienne || typeof legacy.mount !== 'function') {
          legacyPromise = null; reject(new Error('lead-mgmt v48 : définition introuvable')); return;
        }
        resolve(legacy);
      };
      s.onerror = function () { legacyPromise = null; reject(new Error('lead-mgmt v48 : chargement CDN KO')); };
      document.head.appendChild(s);
    });
    return legacyPromise;
  }

  async function utilisateur(ctx) {
    var u = ctx.user || (OD.getUser && OD.getUser());
    if (!u) {
      var FW = frontWindow();
      try { if (typeof FW.oropraLoadUser === 'function') u = await FW.oropraLoadUser(); } catch (e) {}
    }
    if (Array.isArray(u)) u = u[0];
    return u || null;
  }

  function demandeApercu() {
    var FW = frontWindow();
    try { return /plateau/i.test(FW.location.hash || '') || /[?&]plateau=1/.test(FW.location.search || ''); }
    catch (e) { return false; }
  }

  OD.define('lead-mgmt', {
    async mount(el, ctx) {
      var u = await utilisateur(ctx);
      var role = Number(u && u.ID_Role);
      var apercu = ROLES_APERCU.indexOf(role) !== -1 && demandeApercu();
      if (ROLES_PLATEAU.indexOf(role) !== -1 || apercu) {
        return posteVroom(el, ctx, u, { apercu: apercu, role: role });
      }
      var legacy = await chargerLegacy();
      return legacy.mount(el, ctx);
    }
  });

  // ==========================================================================
  //  LE POSTE DU PLATEAU VROOM
  // ==========================================================================
  async function posteVroom(el, ctx, user, opt) {
    var doc = el.ownerDocument || document;
    var sb = ctx.supabase;
    var FW = frontWindow();

    // ── Référentiels ──────────────────────────────────────────────────────
    var MOTIFS_ABANDON = ['Non intéressé par l\'offre', 'Non intéressé par le produit', 'Injoignable permanent',
      'Erreur du client', 'Doublon', 'Conserve son véhicule', 'Trop tôt', 'Véhicule réservé déjà vendu',
      'Délai de livraison trop important', 'Clôture manuelle'];
    var SLA_SITE = 120;          // un transfert du plateau doit être pris par le site en 2 h
    var REFRESH_MS = 60000;

    // ── État ──────────────────────────────────────────────────────────────
    var S = {
      tab: 'piscine', stock: false, sources: null, campagne: null, miens: false,
      kpis: null, piscine: [], rappels: [], transferts: [], campagnes: null, stockListe: null,
      ack: new Set(), vus: new Set(), frais: new Set(), premier: true,
      dr: null, // { sf, fiche, sites, vendeurs, site }
      charge: false, erreur: null
    };
    try { (JSON.parse(FW.localStorage.getItem('lmtc-ack') || '[]') || []).forEach(function (x) { S.ack.add(x); }); } catch (e) {}
    var MOI = null;

    // ── Outils ────────────────────────────────────────────────────────────
    function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
    function ts(v) { return v ? new Date(v).getTime() : null; }
    function mins(v) { return (Date.now() - ts(v)) / 60000; }
    function duree(m) {
      m = Math.max(0, m);
      if (m < 1) return 'à l\'instant';
      if (m < 60) return Math.floor(m) + ' min';
      if (m < 1440) { var h = Math.floor(m / 60), r = Math.floor(m % 60); return h + ' h ' + String(r).padStart(2, '0'); }
      return Math.floor(m / 1440) + ' j';
    }
    function slaTxt(s) { return s < 60 ? s + ' min' : (Math.round(s / 6) / 10) + ' h'; }
    function niv(m, sla) { return m >= sla ? 'crit' : (m >= sla * 0.6 ? 'warn' : 'ok'); }
    function hh(v) { var d = new Date(v); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
    function jour(v) { var d = new Date(v); return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + (d.getFullYear() !== new Date().getFullYear() ? '/' + String(d.getFullYear()).slice(2) : ''); }
    function quand(v) {
      if (!v) return '';
      var d = new Date(v), n = new Date();
      return d.toDateString() === n.toDateString() ? hh(v) : jour(v) + ' ' + hh(v);
    }
    function plural(n, s, p) { return n + ' ' + (n > 1 ? (p || s + 's') : s); }
    // BACS écrit souvent en capitales : « MOHAMED KEITA » → « Mohamed Keita ».
    function propre(s) {
      s = String(s || '').trim();
      if (!s || s !== s.toUpperCase()) return s;
      return s.toLowerCase().replace(/(^|[\s\-'’])([a-zà-ÿ])/g, function (m, a, b) { return a + b.toUpperCase(); });
    }
    function siteNom(s) { return propre(String(s || '').replace(/\s+TT\d+$/i, '')); }
    function nomLead(l) { return propre(l.nom) || 'Sans nom'; }
    function telAff(t) {
      var d = String(t || '').replace(/[^0-9+]/g, '');
      if (/^\+33\d{9}$/.test(d)) d = '0' + d.slice(3);
      return /^0\d{9}$/.test(d) ? d.replace(/(\d{2})(?=\d)/g, '$1 ') : (t || '');
    }
    function normTel(n) {
      var t = String(n || '').replace(/[^0-9+]/g, '');
      if (!t) return ''; if (t[0] === '+') return t; if (t[0] === '0') return '+33' + t.slice(1); return t;
    }
    function tm(v, sla, cap) {
      var m = mins(v);
      return '<span class="tm ' + niv(m, sla) + '"><b>' + duree(m) + '</b><small>' + esc(cap || ('SLA ' + slaTxt(sla))) + '</small></span>';
    }
    function libStatut(s) {
      return ({ 'A affecter': 'À affecter', 'Injoignable temporairement': 'Injoignable', 'Projet Long Terme': 'Projet long terme',
                'Abandonned': 'Abandonné', 'Interesse': 'Intéressé' })[s] || s || '';
    }
    function tagsLead(l) {
      var h = '<span class="tag">' + esc(l.source_libelle || l.source_bacs || 'BACS') + '</span>';
      if (l.campagne) h += '<span class="tag camp" title="' + esc(l.campagne) + '">' + esc(l.campagne.length > 46 ? l.campagne.slice(0, 44) + '…' : l.campagne) + '</span>';
      if (l.statut_eff === 'Accepté') h += '<span class="tag warn">Accepté</span>';
      if (l.tentatives > 0) h += '<span class="tag warn">' + plural(l.tentatives, 'tentative') + '</span>';
      if (l.site) h += '<span class="tag">BACS : ' + esc(siteNom(l.site)) + '</span>';
      return h;
    }
    function demande(l) {
      var p = [l.type_demande, l.modele].filter(Boolean);
      return p.length ? p.join(' · ') : (l.nature || 'Demande BACS');
    }
    function resumeQualif(q) {
      if (!q) return '';
      return [q.projet, q.modele, q.echeance ? 'échéance ' + String(q.echeance).toLowerCase() : null,
              q.reprise ? 'reprise ' + String(q.reprise).toLowerCase() : null, q.financement].filter(Boolean).join(' · ');
    }
    function verrouLibre(l) { return !l.verrou_par || (l.verrou_jusqu && ts(l.verrou_jusqu) < Date.now()); }
    function estMien(l) { return !verrouLibre(l) && Number(l.verrou_par) === Number(MOI); }
    // null = sources suivies par le groupe (choix serveur) ; [] = aucune, qu'on
    // ne peut pas envoyer telle quelle (le serveur la lirait comme « par défaut »).
    function sourcesArg() { return S.sources == null ? null : (S.sources.length ? S.sources : ['__aucune__']); }

    async function rpc(nom, args) {
      var r = await sb.rpc(nom, args || {});
      if (r.error) { var e = new Error(r.error.message || nom); e.code = r.error.code; throw e; }
      return r.data;
    }
    function messageErreur(e) {
      var m = String((e && e.message) || e || '');
      if (/Réservé au plateau/.test(m)) return 'Votre rôle n\'a pas accès au plateau.';
      if (/Failed to fetch|NetworkError/i.test(m)) return 'Connexion perdue. Réessayez dans un instant.';
      return m || 'Erreur inattendue';
    }

    // ── Cadre ─────────────────────────────────────────────────────────────
    injecterCss(doc);
    el.innerHTML = '';
    var root = doc.createElement('div');
    root.className = 'lmtc';
    el.appendChild(root);
    var ov = doc.createElement('div');           // panneau, fenêtres, toast : hors du flux de la page
    ov.className = 'lmtc lmtc-ov';
    ov.innerHTML = '<div class="scrim" hidden></div><aside class="drawer" hidden aria-label="Détail du lead"></aside><div class="toast" role="status" aria-live="polite"></div>';
    doc.body.appendChild(ov);
    var $scrim = ov.querySelector('.scrim'), $drawer = ov.querySelector('.drawer'), $toast = ov.querySelector('.toast');

    function toast(msg, err) {
      $toast.textContent = msg; $toast.classList.toggle('err', !!err); $toast.classList.add('on');
      clearTimeout(toast._t); toast._t = setTimeout(function () { $toast.classList.remove('on'); }, err ? 5200 : 3200);
    }

    root.innerHTML = '<section class="situ"><p class="situ-l"><span class="vr">Plateau VROOM</span></p><p class="situ-t">Chargement de la piscine BACS…</p></section>';

    // ── Chargement ────────────────────────────────────────────────────────
    async function charger() {
      var args = { p_sources: sourcesArg(), p_campagne: S.campagne };
      var res = await Promise.all([
        rpc('plateau_kpis'),
        rpc('plateau_file', Object.assign({ p_vue: 'piscine' }, args)),
        rpc('plateau_file', { p_vue: 'rappels', p_campagne: S.campagne }),
        rpc('plateau_file', { p_vue: 'transferts', p_campagne: S.campagne }),
        S.stock ? rpc('plateau_file', { p_vue: 'stock', p_campagne: S.campagne }) : Promise.resolve(S.stockListe),
        S.tab === 'campagnes' ? rpc('plateau_campagnes', { p_jours: 90 }) : Promise.resolve(S.campagnes)
      ]);
      S.kpis = res[0] || {}; MOI = S.kpis.moi;
      S.piscine = res[1] || []; S.rappels = res[2] || []; S.transferts = res[3] || [];
      S.stockListe = res[4] || null; S.campagnes = res[5] || null;
      S.erreur = null; S.charge = true;
    }
    async function rafraichir(silencieux) {
      try { await charger(); }
      catch (e) { S.erreur = messageErreur(e); if (!silencieux) toast(S.erreur, true); }
      render();
    }

    // ── Signaux ───────────────────────────────────────────────────────────
    function signaux() {
      var out = [], k = S.kpis || {};
      // 1. Fraîcheur de la copie BACS : tout le reste en dépend.
      if (k.derniere_synchro) {
        var age = mins(k.derniere_synchro);
        if (age > 120) out.push({ id: 'sync-' + jour(k.derniere_synchro), niv: age > 1440 ? 'crit' : 'warn', k: 'Copie BACS', t: k.derniere_synchro,
          titre: 'BACS n\'a pas été relu depuis ' + duree(age),
          d: 'Les leads arrivés depuis le ' + quand(k.derniere_synchro) + ' ne sont pas encore ici. Ouvrez BACS avec l\'extension One Data pour relancer la synchronisation.', a: [] });
      }
      // 2. Nouveaux leads libres.
      var libres = S.piscine.filter(function (l) { return verrouLibre(l) && (l.statut_eff === 'A affecter' || l.statut_eff === 'Nouveau'); });
      libres.filter(function (l) { return mins(l.recu_le) < 15; }).forEach(function (l) {
        out.push({ id: 'new-' + l.sf_lead_id, niv: 'new', k: 'Nouveau lead', t: l.recu_le, titre: nomLead(l) + ' · ' + (l.source_libelle || l.source_bacs || 'BACS'),
          d: demande(l) + (l.site ? ' · ' + siteNom(l.site) : ''), a: [['Prendre', 'prendre', l.sf_lead_id]] });
      });
      // 3. Hors délai dans la piscine.
      var hd = libres.filter(function (l) { return mins(l.recu_le) >= (l.sla_min || 120); })
        .sort(function (a, b) { return ts(a.recu_le) - ts(b.recu_le); });
      if (hd.length) out.push({ id: 'hd-' + hd.length + '-' + hd[0].sf_lead_id, niv: 'crit', k: 'Hors délai', t: hd[0].recu_le,
        titre: plural(hd.length, 'lead hors délai', 'leads hors délai') + ' dans la piscine',
        d: 'Le plus ancien : ' + nomLead(hd[0]) + ', ' + duree(mins(hd[0].recu_le)) + ' (' + (hd[0].source_libelle || 'BACS') + ', SLA ' + slaTxt(hd[0].sla_min || 120) + ').',
        a: [['Prendre le plus ancien', 'prendre', hd[0].sf_lead_id]] });
      // 4. Rappels : ceux de l'heure, un par un ; le retard, en un seul signal.
      var dus = S.rappels.filter(function (l) { return l.rappel_le && ts(l.rappel_le) <= Date.now() + 10 * 60000; });
      dus.filter(function (l) { return Math.abs(ts(l.rappel_le) - Date.now()) < 30 * 60000 && verrouLibre(l); }).slice(0, 4).forEach(function (l) {
        out.push({ id: 'rap-' + l.sf_lead_id + '-' + l.rappel_le, niv: 'warn', k: 'Rappel', t: l.rappel_le, titre: 'Rappeler ' + nomLead(l),
          d: libStatut(l.statut_eff) + (l.tentatives ? ' · ' + plural(l.tentatives, 'tentative') : '') + ' · ' + demande(l), a: [['Appeler', 'prendre', l.sf_lead_id]] });
      });
      var retard = dus.filter(function (l) { return ts(l.rappel_le) < Date.now() - 30 * 60000; });
      if (retard.length) {
        var r0 = retard.slice().sort(function (a, b) { return ts(a.rappel_le) - ts(b.rappel_le); })[0];
        out.push({ id: 'retard-' + retard.length, niv: 'warn', k: 'Rappels en retard', t: r0.rappel_le,
          titre: plural(retard.length, 'rappel dépassé', 'rappels dépassés'),
          d: 'Le plus ancien : ' + nomLead(r0) + ', prévu le ' + quand(r0.rappel_le) + '. Rappelez, reprogrammez ou abandonnez.',
          a: [['Voir les rappels', 'tab', 'rappels']] });
      }
      // 5. Relais bloqué : transferts non pris par le site au-delà de 2 h.
      var bloques = S.transferts.filter(function (l) {
        var depuis = l.transfere_le || l.derniere_action_le;
        return l.id_lead && !l.od_contact_le && ['recu', 'resolu', 'attribue'].indexOf(l.od_statut) !== -1
          && depuis && mins(depuis) >= SLA_SITE && l.derniere_action !== 'relance_site';
      });
      var parSite = {};
      bloques.forEach(function (l) { var s = l.site || 'Site inconnu'; (parSite[s] = parSite[s] || []).push(l); });
      Object.keys(parSite).forEach(function (s) {
        var ls = parSite[s];
        out.push({ id: 'bloque-' + s + '-' + ls.length, niv: 'vr', k: 'Relais bloqué', t: ls[0].transfere_le || ls[0].derniere_action_le,
          titre: siteNom(s) + ' n\'a pas pris ' + (ls.length > 1 ? ls.length + ' transferts' : 'un transfert'),
          d: ls.slice(0, 4).map(function (l) { return nomLead(l) + ' (' + duree(mins(l.transfere_le || l.derniere_action_le)) + ')'; }).join(', ') + '. SLA du site : 2 h.',
          a: [['Relancer le chef', 'relancer', ls.map(function (l) { return l.sf_lead_id; }).join(',')]] });
      });
      // 6. Les collègues au travail.
      S.piscine.concat(S.rappels).filter(function (l) { return !verrouLibre(l) && !estMien(l); }).slice(0, 3).forEach(function (l) {
        out.push({ id: 'resa-' + l.sf_lead_id + '-' + l.verrou_jusqu, niv: 'info', k: 'Plateau', t: l.verrou_jusqu,
          titre: propre(l.verrou_nom || 'Un collègue') + ' traite ' + nomLead(l), d: 'Réservé jusqu\'à ' + hh(l.verrou_jusqu) + ', puis libéré automatiquement.', a: [] });
      });
      // 7. Ce qui n'est dans aucune file par défaut.
      if (k.stock_acceptes_anciens > 0) out.push({ id: 'stock-' + k.stock_acceptes_anciens, niv: 'info', k: 'Stock', t: null,
        titre: plural(k.stock_acceptes_anciens, 'lead accepté', 'leads acceptés') + ' sans suite depuis plus de 14 j',
        d: 'Acceptés dans BACS par le plateau, jamais qualifiés ni abandonnés. Rappelez-les ou abandonnez-les avec un motif.',
        a: [['Voir le stock', 'stock', '1']] });
      var atelierCache = (k.atelier_en_file || 0) > 0 && !(S.sources || []).some(function (c) { return c === 'bacs_atelier'; });
      if (atelierCache) out.push({ id: 'atelier-' + k.atelier_en_file, niv: 'info', k: 'Trafic atelier', t: null,
        titre: plural(k.atelier_en_file, 'lead atelier attend', 'leads atelier attendent') + ' dans BACS',
        d: 'Le trafic atelier n\'est pas affiché dans la piscine par défaut.', a: [['Les afficher', 'source', 'bacs_atelier']] });
      return out.filter(function (s) { return !S.ack.has(s.id); });
    }

    function renderSignaux(list) {
      var h = '<div class="zh"><h2>Signaux <span class="cnt">' + list.length + '</span></h2><p>Ce qui vous arrive. Chaque signal porte son action.</p></div>';
      if (!list.length) return h + '<div class="sig-empty">Aucun signal en attente. Les nouveaux leads, les rappels dus et les transferts non pris apparaîtront ici.</div>';
      list.forEach(function (s) {
        h += '<div class="sg ' + s.niv + (S.frais.has(s.id) ? ' fresh' : '') + '"><span class="sg-m"></span><div>'
          + '<div class="sg-top"><span class="sg-k">' + esc(s.k) + '</span><span class="sg-h">' + (s.t ? esc(quand(s.t)) : '') + '</span></div>'
          + '<p class="sg-t">' + esc(s.titre) + '</p><p class="sg-d">' + esc(s.d) + '</p>'
          + '<div class="sg-a">' + s.a.map(function (a, i) { return '<button type="button" class="btn sm' + (i === 0 ? (s.niv === 'vr' ? ' vr' : ' pri') : '') + '" data-a="' + a[1] + '" data-id="' + esc(a[2]) + '">' + esc(a[0]) + '</button>'; }).join('')
          + '<button type="button" class="btn sm ghost" data-a="ack" data-id="' + esc(s.id) + '">Vu</button></div></div></div>';
      });
      return h;
    }

    // ── Situation ─────────────────────────────────────────────────────────
    function renderSituation() {
      var k = S.kpis || {};
      var libres = S.piscine.filter(verrouLibre);
      var hd = libres.filter(function (l) { return (l.statut_eff === 'A affecter' || l.statut_eff === 'Nouveau') && mins(l.recu_le) >= (l.sla_min || 120); });
      var old = libres.length ? libres.reduce(function (a, b) { return ts(a.recu_le) < ts(b.recu_le) ? a : b; }) : null;
      var nom = propre([user && user.prenom, user && user.nom].filter(Boolean).join(' ')) || (user && user.nomComplet) || '';
      var l = '<span class="vr">Plateau VROOM</span>' + (nom ? ' · ' + esc(nom) : '')
        + (opt.apercu ? ' · aperçu <button type="button" class="lien" data-a="quitter-apercu">revenir à la vue habituelle</button>' : '');
      var t = libres.length
        ? (hd.length ? '<b class="t-crit">' + plural(hd.length, 'lead hors délai', 'leads hors délai') + '</b> sur ' : '')
          + '<b>' + plural(libres.length, 'lead libre', 'leads libres') + '</b> dans la piscine BACS. Le plus ancien attend depuis <b class="' + (hd.length ? 't-crit' : 't-acc') + '">' + duree(mins(old.recu_le)) + '</b>.'
        : 'La piscine BACS est vide.';
      if (k.n_rappels_dus) t += ' <b class="t-warn">' + plural(k.n_rappels_dus, 'rappel est dû', 'rappels sont dus') + '</b>.';
      if (k.n_transferts_sans_contact) t += ' <b class="t-vr">' + plural(k.n_transferts_sans_contact, 'transfert n\'est pas pris', 'transferts ne sont pas pris') + '</b> par les sites.';
      var syncAge = k.derniere_synchro ? mins(k.derniere_synchro) : null;
      var kp = [['Pris aujourd\'hui', k.pris || 0], ['Qualifiés', k.qualifies || 0], ['Rappels programmés', k.rappels || 0],
                ['Abandonnés', k.abandonnes || 0], ['Acceptés dans BACS', k.bacs_acceptes || 0],
                ['Copie BACS', syncAge == null ? '—' : '<span class="txt ' + (syncAge > 1440 ? 't-crit' : syncAge > 120 ? 't-warn' : '') + '">' + (syncAge < 1 ? 'à l\'instant' : 'il y a ' + duree(syncAge)) + '</span>']];
      if (k.ecrire_bacs === false) kp.push(['Report dans BACS', '<span class="txt t-mut">désactivé</span>']);
      return '<section class="situ"><p class="situ-l">' + l + '</p><p class="situ-t">' + t + '</p><div class="kpis">'
        + kp.map(function (x) { return '<div class="k"><span>' + x[0] + '</span><b>' + x[1] + '</b></div>'; }).join('') + '</div></section>';
    }

    // ── Onglets ───────────────────────────────────────────────────────────
    function onglets() {
      var k = S.kpis || {};
      var libres = S.piscine.filter(verrouLibre);
      var hd = libres.some(function (l) { return (l.statut_eff === 'A affecter' || l.statut_eff === 'Nouveau') && mins(l.recu_le) >= (l.sla_min || 120); });
      return [['piscine', 'La piscine BACS', libres.length, hd],
              ['rappels', 'Rappels', S.rappels.length, (k.n_rappels_dus || 0) > 0],
              ['transferts', 'Transferts', S.transferts.length, (k.n_transferts_sans_contact || 0) > 0],
              ['campagnes', 'Campagnes', null]];
    }
    function renderTabs() {
      return '<div class="tabs" role="tablist">' + onglets().map(function (o) {
        var on = o[0] === S.tab;
        return '<button type="button" role="tab" aria-selected="' + on + '" class="' + (on ? 'on' : '') + '" data-a="tab" data-id="' + o[0] + '">' + esc(o[1])
          + (o[2] != null ? ' <span class="cnt ' + (o[2] === 0 ? 'z' : (o[3] ? 'c' : '')) + '">' + o[2] + '</span>' : '') + '</button>';
      }).join('') + '</div>';
    }
    function filtreCampagne() {
      return S.campagne ? '<div class="ph-r"><span class="tag camp">' + esc(S.campagne) + '</span><button type="button" class="btn sm ghost" data-a="campagne" data-id="">Retirer le filtre</button></div>' : '';
    }

    // ── Vues ──────────────────────────────────────────────────────────────
    function actionLigne(l, verbe) {
      if (estMien(l)) return '<button type="button" class="btn pri" data-a="open" data-id="' + esc(l.sf_lead_id) + '">Reprendre</button>';
      if (!verrouLibre(l)) return '<span class="resa-l">Réservé par ' + esc(propre(l.verrou_nom || 'un collègue')) + '<br>jusqu\'à ' + hh(l.verrou_jusqu) + '</span>';
      return '<button type="button" class="btn pri" data-a="prendre" data-id="' + esc(l.sf_lead_id) + '">' + esc(verbe || 'Prendre') + '</button>';
    }
    function ligneLead(l, gauche, verbe) {
      return '<div class="lr' + (!verrouLibre(l) && !estMien(l) ? ' resa' : '') + '" data-a="open" data-id="' + esc(l.sf_lead_id) + '" tabindex="0">'
        + '<div>' + gauche + '</div>'
        + '<div><span class="lr-n">' + esc(nomLead(l)) + '</span> <span class="lr-v">' + esc(l.ville || '') + '</span><p class="lr-d">' + esc(demande(l)) + '</p><div class="tags">' + tagsLead(l) + '</div></div>'
        + '<div class="lr-a">' + actionLigne(l, verbe) + '</div></div>';
    }
    function chipsSources() {
      var k = S.kpis || {}, src = k.sources || [];
      if (!src.length) return '';
      var actives = S.sources || src.filter(function (s) { return s.suivi; }).map(function (s) { return s.code; });
      return '<div class="chips filtres" aria-label="Sources">' + src.map(function (s) {
        var on = actives.indexOf(s.code) !== -1;
        return '<button type="button" class="fchip' + (on ? ' on' : '') + '" data-a="source" data-id="' + esc(s.code) + '" aria-pressed="' + on + '">' + esc(s.libelle) + ' <span class="num">' + s.n + '</span></button>';
      }).join('') + '</div>';
    }
    function vuePiscine() {
      var k = S.kpis || {};
      var h = '<div class="ph"><div><h2>La piscine BACS</h2><p>' + (S.stock
          ? 'Les leads acceptés par le plateau il y a plus de 14 jours, sans suite. Rappelez-les, qualifiez-les ou abandonnez-les.'
          : 'Ce qui attend d\'être pris, du plus ancien au plus récent, et ce que le plateau a accepté ces 14 derniers jours. Prendre réserve le lead à votre nom ' + (k.verrou_minutes || 5) + ' min.') + '</p></div>'
        + filtreCampagne() + '</div>'
        + '<div class="barre"><div class="seg"><button type="button" class="' + (!S.stock ? 'on' : '') + '" data-a="stock" data-id="">À traiter <span class="num">' + S.piscine.length + '</span></button>'
        + '<button type="button" class="' + (S.stock ? 'on' : '') + '" data-a="stock" data-id="1">Stock accepté <span class="num">' + (k.stock_acceptes_anciens || 0) + '</span></button></div>'
        + (!S.stock ? chipsSources() : '') + '</div><div class="list">';
      var ls = S.stock ? (S.stockListe || []) : S.piscine;
      if (S.stock && !S.stockListe) h += '<div class="empty">Chargement du stock…</div>';
      else if (!ls.length) h += '<div class="empty">' + (S.campagne ? 'Aucun lead de cette campagne à traiter.' : S.stock ? 'Aucun lead en stock.' : 'Rien à prendre : la piscine BACS est vide pour les sources sélectionnées.') + '</div>';
      ls.forEach(function (l) {
        var gauche = S.stock
          ? '<span class="tm crit"><b>' + duree(mins(l.recu_le)) + '</b><small>reçu le ' + jour(l.recu_le) + '</small></span>'
          : tm(l.recu_le, l.sla_min || 120);
        h += ligneLead(l, gauche, S.stock || l.statut_eff === 'Accepté' ? 'Rappeler' : 'Prendre');
      });
      return h + '</div>';
    }
    function vueRappels() {
      var ls = S.rappels.filter(function (l) { return !S.miens || Number(l.derniere_action_par) === Number(MOI); });
      var h = '<div class="ph"><div><h2>Rappels</h2><p>Les clients injoignables et les projets à long terme, du rappel le plus en retard au plus lointain (30 jours en arrière, 7 jours en avant).</p></div>'
        + '<div class="ph-r">' + filtreCampagne() + '<div class="seg"><button type="button" class="' + (!S.miens ? 'on' : '') + '" data-a="miens" data-id="">Tout le plateau</button><button type="button" class="' + (S.miens ? 'on' : '') + '" data-a="miens" data-id="1">Les miens</button></div></div></div><div class="list">';
      if (!ls.length) h += '<div class="empty">Aucun rappel programmé.</div>';
      ls.forEach(function (l) {
        var due = ts(l.rappel_le) - Date.now();
        var cls = due <= 0 ? 'crit' : (due < 15 * 60000 ? 'warn' : 'ok');
        var b = due <= 0 ? (due > -15 * 60000 ? 'Maintenant' : 'retard ' + duree(-due / 60000)) : 'dans ' + duree(due / 60000);
        var gauche = '<span class="tm ' + cls + '"><b>' + b + '</b><small>prévu ' + (quand(l.rappel_le).length > 5 ? 'le ' : 'à ') + esc(quand(l.rappel_le)) + '</small></span>';
        h += ligneLead(l, gauche, 'Appeler').replace('<div class="tags">', '<div class="tags"><span class="tag ' + (l.statut_eff === 'Projet Long Terme' ? 'vr' : 'warn') + '">' + esc(libStatut(l.statut_eff)) + '</span>');
      });
      return h + '</div>';
    }
    function etatTransfert(l) {
      var depuis = l.transfere_le || l.derniere_action_le;
      if (l.od_contact_le) return '<span class="tag ok">Contacté' + (l.od_vendeur ? ' par ' + esc(propre(l.od_vendeur)) : '') + (depuis && ts(l.od_contact_le) > ts(depuis) ? ' en ' + duree((ts(l.od_contact_le) - ts(depuis)) / 60000) : '') + '</span>';
      if (l.od_statut === 'converti') return '<span class="tag ok">Converti</span>';
      if (l.od_statut === 'perdu' || l.od_statut === 'rejete') return '<span class="tag">Clos par le site</span>';
      if (!l.id_lead) return '<span class="tag">Suivi dans BACS</span>';
      if (l.derniere_action === 'relance_site') return '<span class="tag vr">Chef relancé</span>';
      if (depuis && mins(depuis) >= SLA_SITE) return '<button type="button" class="btn sm vr" data-a="relancer" data-id="' + esc(l.sf_lead_id) + '">Relancer le chef</button>';
      return '<span class="tag">En attente' + (l.od_vendeur ? ' chez ' + esc(propre(l.od_vendeur)) : ' sur le site') + '</span>';
    }
    function vueTransferts() {
      var ls = S.transferts.filter(function (l) { return !S.miens || Number(l.derniere_action_par) === Number(MOI); });
      var h = '<div class="ph"><div><h2>Transferts</h2><p>Ce que deviennent les leads qualifiés par le plateau ces 30 derniers jours. Le site a 2 h pour les prendre ; au-delà, relancez le chef des ventes.</p></div>'
        + '<div class="ph-r">' + filtreCampagne() + '<div class="seg"><button type="button" class="' + (!S.miens ? 'on' : '') + '" data-a="miens" data-id="">Tout le plateau</button><button type="button" class="' + (S.miens ? 'on' : '') + '" data-a="miens" data-id="1">Les miens</button></div></div></div><div class="list">';
      if (!ls.length) h += '<div class="empty">Aucun transfert sur la période.</div>';
      ls.forEach(function (l) {
        var depuis = l.transfere_le || l.derniere_action_le;
        var attente = l.id_lead && !l.od_contact_le && ['recu', 'resolu', 'attribue'].indexOf(l.od_statut) !== -1 && depuis;
        var gauche = attente ? tm(depuis, SLA_SITE, 'sur le site · SLA 2 h')
          : '<span class="tm neutre"><b>' + esc(depuis ? jour(depuis) : jour(l.recu_le)) + '</b><small>' + (depuis ? 'transféré' : 'reçu') + '</small></span>';
        var q = resumeQualif(l.qualification);
        h += '<div class="lr" data-a="open" data-id="' + esc(l.sf_lead_id) + '" tabindex="0"><div>' + gauche + '</div>'
          + '<div><span class="lr-n">' + esc(nomLead(l)) + '</span> <span class="lr-v">→ ' + esc(siteNom(l.site) || 'site non renseigné') + '</span><p class="lr-d">' + esc(q || demande(l)) + '</p><div class="tags">' + tagsLead(l).replace(/<span class="tag">BACS : [^<]*<\/span>/, '') + '</div></div>'
          + '<div class="lr-a">' + etatTransfert(l) + '</div></div>';
      });
      return h + '</div>';
    }
    function vueCampagnes() {
      var h = '<div class="ph"><div><h2>Campagnes BACS</h2><p>Les leads des 90 derniers jours par campagne, hors trafic atelier. Filtrez les files sur une campagne pour la solder.</p></div></div>';
      if (!S.campagnes) return h + '<div class="empty">Chargement des campagnes…</div>';
      if (!S.campagnes.length) return h + '<div class="empty">Aucune campagne sur la période.</div>';
      h += '<div class="scroll"><table class="camp-t"><thead><tr><th>Campagne</th><th>Reçus</th><th>À prendre</th><th>Acceptés</th><th>En rappel</th><th>Qualifiés</th><th>Abandonnés</th><th>Qualification</th><th></th></tr></thead><tbody>';
      S.campagnes.forEach(function (c) {
        var taux = c.recus ? Math.round(100 * c.qualifies / c.recus) : 0;
        var ouverts = Number(c.a_prendre) + Number(c.acceptes) + Number(c.rappels);
        var sans = c.campagne === '(sans nom de campagne)';
        h += '<tr><td class="l">' + esc(c.campagne) + '<small>dernier lead le ' + esc(jour(c.dernier)) + '</small></td>'
          + '<td class="num">' + c.recus + '</td><td class="num">' + (c.a_prendre || '<span class="na">0</span>') + '</td>'
          + '<td class="num">' + (c.acceptes || '<span class="na">0</span>') + '</td><td class="num">' + (c.rappels || '<span class="na">0</span>') + '</td>'
          + '<td class="num">' + (c.qualifies || '<span class="na">0</span>') + '</td><td class="num">' + (c.abandonnes || '<span class="na">0</span>') + '</td>'
          + '<td><span class="prog"><span class="num">' + taux + ' %</span><span class="bar' + (taux < 10 ? ' low' : '') + '"><i style="width:' + Math.min(100, taux) + '%"></i></span></span></td>'
          + '<td>' + (ouverts && !sans ? '<button type="button" class="btn sm" data-a="campagne" data-id="' + esc(c.campagne) + '">Filtrer les files</button>' : '') + '</td></tr>';
      });
      return h + '</tbody></table></div><p class="foot">Un lead est compté dans la colonne de son statut actuel : statut BACS, ou celui du dernier geste One Data s\'il est plus récent que la copie BACS.</p>';
    }
    function renderPanel() {
      if (S.tab === 'rappels') return vueRappels();
      if (S.tab === 'transferts') return vueTransferts();
      if (S.tab === 'campagnes') return vueCampagnes();
      return vuePiscine();
    }

    function render() {
      if (!el.isConnected) return;
      if (!S.charge) {
        root.innerHTML = '<section class="situ"><p class="situ-l"><span class="vr">Plateau VROOM</span></p><p class="situ-t">' + esc(S.erreur || 'Chargement…') + '</p>'
          + (S.erreur ? '<div><button type="button" class="btn pri" data-a="reessayer">Réessayer</button></div>' : '') + '</section>';
        return;
      }
      var list = signaux();
      list.forEach(function (s) { if (!S.vus.has(s.id)) { S.vus.add(s.id); if (!S.premier) S.frais.add(s.id); } });
      S.premier = false;
      var y = (FW.scrollY || 0);
      root.innerHTML = renderSituation()
        + (S.erreur ? '<p class="alerte">' + esc(S.erreur) + ' Les données affichées datent du dernier chargement réussi.</p>' : '')
        + '<div class="poste"><aside class="sig" aria-label="Signaux">' + renderSignaux(list) + '</aside>'
        + '<section class="act" aria-label="Actions">' + renderTabs() + '<div class="panel">' + renderPanel() + '</div></section></div>';
      try { if (FW.scrollY !== y) FW.scrollTo(0, y); } catch (e) {}
      setTimeout(function () { S.frais.clear(); }, 7000);
    }

    // ── Panneau latéral : la fiche du lead ────────────────────────────────
    function itemConnu(sf) {
      return S.piscine.concat(S.rappels, S.transferts, S.stockListe || []).find(function (x) { return x.sf_lead_id === sf; }) || null;
    }
    function chipGroup(name, opts, val) {
      return '<div class="chips">' + opts.map(function (o, i) {
        return '<label class="chip"><input type="radio" name="' + name + '" value="' + esc(o) + '"' + (o === val ? ' checked' : '') + '><span>' + esc(o) + '</span></label>';
      }).join('') + '</div>';
    }
    function parcours(f) {
      var ev = [];
      (f.historique_bacs || []).forEach(function (e) {
        var a = String(e.action || '');
        var txt = a === 'created' ? 'Reçu dans BACS' : a.replace(/^Statut\s*:?\s*/i, 'Statut : ').replace(/^Owner\s*:?\s*/i, 'Propriétaire : ');
        ev.push(['', e.le, txt + (e.par ? ' · ' + propre(e.par) : ''), /VROOM/i.test(e.par || '') ? 'v' : '']);
      });
      var LIB = { prendre: 'Pris dans One Data', qualifie: 'Qualifié et orienté', injoignable: 'Injoignable, rappel programmé',
                  long_terme: 'Projet long terme, rappel programmé', abandonne: 'Abandonné', relance_site: 'Chef des ventes relancé' };
      (f.actions_od || []).forEach(function (a) {
        var d = a.detail || {};
        var plus = a.action === 'abandonne' && d.motif ? ' · ' + d.motif
          : (a.action === 'injoignable' || a.action === 'long_terme') && d.rappel_le ? ' le ' + quand(d.rappel_le)
          : a.action === 'relance_site' && d.chefs_prevenus != null ? ' (' + plural(d.chefs_prevenus, 'chef prévenu', 'chefs prévenus') + ')' : '';
        ev.push(['', a.le, (LIB[a.action] || a.action) + plus + (a.par ? ' · ' + propre(a.par) : ''), 'v']);
      });
      if (!ev.length) return '<p class="hint">Aucun historique synchronisé pour ce lead.</p>';
      ev.sort(function (a, b) { return ts(a[1]) - ts(b[1]); });
      return '<ol class="tl">' + ev.map(function (e) { return '<li class="' + e[3] + '"><b>' + esc(quand(e[1])) + '</b><span>' + esc(e[2]) + '</span></li>'; }).join('') + '</ol>';
    }
    function dateLocale(d) {
      var p = function (n) { return String(n).padStart(2, '0'); };
      return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':' + p(d.getMinutes());
    }
    function demainA(h, j) { var d = new Date(); d.setDate(d.getDate() + (j || 1)); d.setHours(h, 0, 0, 0); return d; }

    function renderDrawer() {
      var D = S.dr; if (!D) return;
      var f = D.fiche;
      if (!f) { $drawer.innerHTML = '<header class="dr-h"><div><h2>Chargement…</h2></div><button type="button" class="x" data-a="close" aria-label="Fermer">×</button></header>'; return; }
      var it = itemConnu(D.sf) || {};
      var l = Object.assign({}, it, f);
      l.source_libelle = it.source_libelle || f.source_bacs; l.sla_min = it.sla_min || 120;
      var mien = estMien(l), libre = verrouLibre(l);
      var actif = ['A affecter', 'Nouveau', 'Accepté', 'Injoignable temporairement', 'Projet Long Terme', 'Interesse', 'Intéressé'].indexOf(l.statut_eff) !== -1;
      var fb = f.fiche_bacs || {};
      var h = '<header class="dr-h"><div><div class="tags" style="margin:0 0 6px">' + tagsLead(l).replace(/<span class="tag">BACS : [^<]*<\/span>/, '')
        + '<span class="tag ' + (l.statut_eff === 'Qualifié' ? 'ok' : l.statut_eff === 'Abandonned' ? 'crit' : '') + '">' + esc(libStatut(l.statut_eff)) + '</span></div>'
        + '<h2>' + esc(nomLead(l)) + '</h2><p class="dr-s">' + esc([l.ville, l.site ? 'site BACS : ' + siteNom(l.site) : null].filter(Boolean).join(' · ')) + '</p></div>'
        + '<button type="button" class="x" data-a="close" aria-label="Fermer">×</button></header><div class="dr-b">';
      // Délais
      h += '<section><h3>Délai</h3><div class="delais"><div><span>Depuis la réception BACS</span>' + (actif && l.statut_eff !== 'Accepté' && !l.rappel_le ? tm(l.recu_le, l.sla_min) : '<span class="tm neutre"><b>' + duree(mins(l.recu_le)) + '</b><small>reçu le ' + esc(quand(l.recu_le)) + '</small></span>') + '</div>';
      if (l.rappel_le && actif) { var due = ts(l.rappel_le) - Date.now(); h += '<div><span>Rappel prévu</span><span class="tm ' + (due <= 0 ? 'crit' : 'ok') + '"><b>' + esc(quand(l.rappel_le)) + '</b><small>' + (due <= 0 ? 'retard ' + duree(-due / 60000) : 'dans ' + duree(due / 60000)) + '</small></span></div>'; }
      if (l.transfere_le) h += '<div><span>Sur le site</span>' + (l.od_contact_le ? '<span class="tm ok"><b>' + duree((ts(l.od_contact_le) - ts(l.transfere_le)) / 60000) + '</b><small>avant contact</small></span>' : tm(l.transfere_le, SLA_SITE, 'sans contact · SLA 2 h')) + '</div>';
      if (mien) h += '<div><span>Réservé à votre nom</span><span class="tm ok"><b>jusqu\'à ' + hh(l.verrou_jusqu) + '</b><small>prolongé tant que la fiche est ouverte</small></span></div>';
      h += '</div></section>';
      // Contact
      h += '<section><h3>Contact</h3>' + (l.telephone ? '<div class="tel"><b>' + esc(telAff(l.telephone)) + '</b><button type="button" class="btn sm" data-a="copier" data-id="' + esc(telAff(l.telephone)) + '">Copier</button></div>' : '<p class="hint">Aucun numéro dans BACS.</p>')
        + (l.email ? '<p class="mail">' + esc(l.email) + '</p>' : '')
        + '<div class="canaux">' + [['Appeler', 'appel'], ['SMS', 'sms'], ['WhatsApp', 'wa'], ['Email', 'mail']].map(function (c) { return '<button type="button" class="btn" data-a="canal" data-id="' + c[1] + '"' + ((c[1] === 'mail' ? !l.email : !l.telephone) ? ' disabled' : '') + '>' + c[0] + '</button>'; }).join('') + '</div></section>';
      // Demande
      var oui = function (v) { return v === 'true' || v === true ? 'Oui' : v === 'false' || v === false ? 'Non' : v; };
      var dl = [['Type', fb.type_demande], ['Modèle', fb.modele], ['Marque', fb.marque], ['Échéance', fb.echeance], ['Reprise', oui(fb.reprise)],
                ['Financement', fb.financement], ['Budget', fb.budget], ['Canal préféré', fb.canal_prefere],
                ['À accepter avant', fb.limite_acceptation ? quand(fb.limite_acceptation) : null]].filter(function (x) { return x[1]; });
      h += '<section><h3>Demande</h3>' + (dl.length ? '<dl class="dl">' + dl.map(function (x) { return '<dt>' + x[0] + '</dt><dd>' + esc(x[1]) + '</dd>'; }).join('') + '</dl>' : '<p style="font-weight:700">' + esc(demande(l)) + '</p>')
        + (l.commentaire ? '<p class="quote">« ' + esc(l.commentaire) + ' »</p>' : '')
        + (fb.campagne_description ? '<p class="hint">' + esc(fb.campagne_description) + '</p>' : '') + '</section>';
      // Qualification et orientation (lead réservé à mon nom)
      if (mien && actif) {
        var q = l.qualification || {};
        h += '<section><h3>Qualification</h3><div class="qf">'
          + '<div class="q"><span>Projet</span>' + chipGroup('q-projet', ['Achat VN', 'Achat VO', 'Atelier', 'Simple information'], q.projet || (/VO|occasion/i.test(fb.type_demande || l.campagne || '') ? 'Achat VO' : 'Achat VN')) + '</div>'
          + '<div class="q"><span>Modèle visé</span><input type="text" id="q-modele" value="' + esc(q.modele || fb.modele || l.modele || '') + '"></div>'
          + '<div class="q"><span>Échéance</span>' + chipGroup('q-echeance', ['Moins d\'un mois', '1 à 3 mois', '3 mois et plus'], q.echeance || '') + '</div>'
          + '<div class="q"><span>Reprise</span>' + chipGroup('q-reprise', ['Oui', 'Non', 'Ne sait pas'], q.reprise || '') + '</div>'
          + '<div class="q"><span>Financement</span>' + chipGroup('q-fin', ['Comptant', 'Crédit', 'LOA', 'LLD', 'Ne sait pas'], q.financement || '') + '</div>'
          + '<div class="q"><span>Note pour le vendeur</span><textarea id="q-note" rows="2" placeholder="Ce que le vendeur doit savoir avant d\'appeler">' + esc(q.note || '') + '</textarea></div></div></section>';
        h += '<section><h3>Orienter vers</h3>';
        if (!D.sites) h += '<p class="hint">Chargement des sites…</p>';
        else if (!D.sites.length) h += '<p class="hint">Aucun site de vente trouvé pour cette marque.</p>';
        else {
          var montrer = D.tousSites ? D.sites : D.sites.filter(function (s, i) { return s.rang < 3 || i < 3 || Number(s.id_site) === Number(D.site); });
          h += '<div class="sites">' + montrer.map(function (s) {
            return '<label class="site-o"><input type="radio" name="q-site" value="' + s.id_site + '"' + (Number(D.site) === Number(s.id_site) ? ' checked' : '') + '><span><b>' + esc(siteNom(s.site)) + '</b><small>' + esc(s.raison) + '</small></span><em>' + plural(Number(s.en_attente) || 0, 'lead', 'leads') + ' en attente</em></label>';
          }).join('') + '</div>' + (!D.tousSites && montrer.length < D.sites.length ? '<button type="button" class="btn sm ghost" data-a="tous-sites">Voir les ' + D.sites.length + ' sites</button>' : '');
          h += '<label class="q vend"><span>Vendeur</span><select id="q-vendeur"><option value="">Tour de rôle du site</option>'
            + (D.vendeurs || []).map(function (v) { return '<option value="' + v.id_user + '">' + esc(propre(v.nom)) + (Number(v.en_attente) ? ' · ' + v.en_attente + ' en attente' : '') + '</option>'; }).join('')
            + '</select></label>';
        }
        h += '</section>';
      } else if (l.qualification && Object.keys(l.qualification).length) {
        var qq = l.qualification;
        h += '<section><h3>Qualification du plateau</h3><dl class="dl">' + [['Projet', qq.projet], ['Modèle', qq.modele], ['Échéance', qq.echeance], ['Reprise', qq.reprise], ['Financement', qq.financement], ['Note', qq.note]]
          .filter(function (x) { return x[1]; }).map(function (x) { return '<dt>' + x[0] + '</dt><dd>' + esc(x[1]) + '</dd>'; }).join('') + '</dl></section>';
      }
      if (l.id_lead && (l.od_statut || l.od_vendeur)) {
        h += '<section><h3>Sur le site</h3><dl class="dl"><dt>Statut One Data</dt><dd>' + esc(({ recu: 'Reçu', resolu: 'En attente', attribue: 'Attribué', contacte: 'Contacté', converti: 'Converti', perdu: 'Perdu', rejete: 'Rejeté' })[l.od_statut] || l.od_statut || '—') + '</dd>'
          + (l.od_vendeur ? '<dt>Vendeur</dt><dd>' + esc(propre(l.od_vendeur)) + '</dd>' : '')
          + (l.od_contact_le ? '<dt>Premier contact</dt><dd>' + esc(quand(l.od_contact_le)) + '</dd>' : '') + '</dl></section>';
      }
      h += '<section><h3>Parcours</h3>' + parcours(f) + '</section></div>';

      // Pied : les gestes
      h += '<footer class="dr-f">';
      if (!actif) {
        h += '<p class="hint">' + (l.statut_eff === 'Qualifié' ? 'Transféré : le site a la main.' : 'Lead clos (' + esc(libStatut(l.statut_eff)) + ').') + '</p>';
        if (l.statut_eff === 'Qualifié' && l.id_lead && !l.od_contact_le && ['recu', 'resolu', 'attribue'].indexOf(l.od_statut) !== -1)
          h += '<div class="row"><button type="button" class="btn vr" data-a="relancer" data-id="' + esc(l.sf_lead_id) + '">Relancer le chef des ventes</button></div>';
      } else if (!libre && !mien) {
        h += '<p class="hint">' + esc(propre(l.verrou_nom || 'Un collègue')) + ' traite ce lead. Il redevient libre à ' + hh(l.verrou_jusqu) + ' sans action.</p>';
      } else if (!mien) {
        h += '<div class="row"><button type="button" class="btn pri" data-a="prendre" data-id="' + esc(l.sf_lead_id) + '">Prendre ce lead</button><span class="hint">Il sera réservé à votre nom ' + ((S.kpis || {}).verrou_minutes || 5) + ' min.</span></div>';
      } else {
        var issue = D.issue || 'qualifier';
        var ISSUES = [['qualifier', 'Qualifié'], ['injoignable', 'Injoignable'], ['long_terme', 'Projet long terme'], ['abandon', 'Abandonner']];
        h += '<div class="issues" role="radiogroup" aria-label="Issue de l\'appel">' + ISSUES.map(function (x) {
          return '<button type="button" role="radio" aria-checked="' + (x[0] === issue) + '" class="' + (x[0] === issue ? 'on ' + x[0] : '') + '" data-a="issue" data-id="' + x[0] + '">' + x[1] + '</button>';
        }).join('') + '</div><div class="row">';
        if (issue === 'qualifier') {
          var cible = (D.sites || []).find(function (s) { return Number(s.id_site) === Number(D.site); });
          h += cible ? '<button type="button" class="btn vr" data-a="qualifier">Transférer à ' + esc(siteNom(cible.site)) + '</button><span class="hint">avec la qualification ci-dessus</span>'
                     : '<button type="button" class="btn vr" disabled>Transférer</button><span class="hint">Choisissez d\'abord le site, plus haut.</span>';
        } else if (issue === 'injoignable') {
          h += '<select id="r-quand" aria-label="Quand rappeler"><option value="2h">Dans 2 h</option><option value="demain">Demain 9 h</option><option value="apres">Après-demain 9 h</option><option value="autre">Autre date…</option></select>'
            + '<input type="datetime-local" id="r-date" value="' + dateLocale(new Date(Date.now() + 2 * 3600000)) + '" hidden>'
            + '<button type="button" class="btn pri" data-a="injoignable">Programmer le rappel</button>';
        } else if (issue === 'long_terme') {
          h += '<label class="hint" for="lt-date">Rappeler le</label><input type="date" id="lt-date" value="' + dateLocale(demainA(9, 30)).slice(0, 10) + '">'
            + '<button type="button" class="btn pri" data-a="long-terme">Programmer</button>';
        } else {
          h += '<select id="a-motif" aria-label="Motif d\'abandon BACS">' + MOTIFS_ABANDON.map(function (m) { return '<option>' + esc(m) + '</option>'; }).join('') + '</select>'
            + '<button type="button" class="btn dang" data-a="abandonner">Abandonner</button>';
        }
        h += '</div><div class="row pied"><span class="hint">' + ((S.kpis || {}).ecrire_bacs ? 'Le geste est aussi reporté dans BACS.' : 'Reportez aussi le statut dans BACS : l\'écriture automatique n\'est pas encore activée.') + '</span>'
          + '<button type="button" class="btn sm ghost" data-a="liberer">Libérer</button></div>';
      }
      h += '</footer>';
      var sc = $drawer.querySelector('.dr-b'); var top = sc ? sc.scrollTop : 0;
      $drawer.innerHTML = h;
      var sc2 = $drawer.querySelector('.dr-b'); if (sc2) sc2.scrollTop = top;
    }

    async function chargerSites() {
      var D = S.dr; if (!D) return;
      try {
        D.sites = await rpc('plateau_sites', { p_sf_lead_id: D.sf }) || [];
        if (D.site == null && D.sites.length && D.sites[0].rang < 3) D.site = D.sites[0].id_site;
        await chargerVendeurs();
      } catch (e) { D.sites = []; toast(messageErreur(e), true); }
      renderDrawer();
    }
    async function chargerVendeurs() {
      var D = S.dr; if (!D || D.site == null) return;
      var site = D.site;
      try { var v = await rpc('plateau_vendeurs', { p_id_site: site }); if (S.dr && S.dr.site === site) S.dr.vendeurs = v || []; }
      catch (e) { if (S.dr) S.dr.vendeurs = []; }
    }

    var renouvellement = null;
    async function ouvrir(sf) {
      fermerDrawer(true);
      S.dr = { sf: sf, fiche: null, sites: null, vendeurs: null, site: null };
      $scrim.hidden = false; $drawer.hidden = false;
      renderDrawer();
      try {
        S.dr.fiche = await rpc('plateau_fiche', { p_sf_lead_id: sf });
        if (!S.dr.fiche) { toast('Lead introuvable dans la copie BACS.', true); fermerDrawer(); return; }
      } catch (e) { toast(messageErreur(e), true); fermerDrawer(); return; }
      renderDrawer();
      if (estMien(S.dr.fiche)) { chargerSites(); armerRenouvellement(); }
    }
    function armerRenouvellement() {
      clearInterval(renouvellement);
      var min = ((S.kpis || {}).verrou_minutes || 5);
      renouvellement = setInterval(async function () {
        if (!S.dr || !S.dr.fiche || !estMien(S.dr.fiche) || !el.isConnected) { clearInterval(renouvellement); return; }
        try {
          var r = await rpc('plateau_prendre', { p_sf_lead_id: S.dr.sf });
          if (r && r.action === 'reserve') { S.dr.fiche.verrou_jusqu = r.jusqu; renderDrawerPreserve(); }
        } catch (e) {}
      }, Math.max(60000, (min - 1) * 60000));
    }
    // Re-rendu du panneau sans perdre la saisie en cours.
    function lireForm() {
      var g = function (s) { var x = $drawer.querySelector(s); return x ? x.value : null; };
      var r = function (n) { var x = $drawer.querySelector('input[name="' + n + '"]:checked'); return x ? x.value : null; };
      return { projet: r('q-projet'), modele: g('#q-modele'), echeance: r('q-echeance'), reprise: r('q-reprise'),
               financement: r('q-fin'), note: g('#q-note'), site: r('q-site'), vendeur: g('#q-vendeur') };
    }
    function renderDrawerPreserve() {
      var D = S.dr; if (!D || !D.fiche) return;
      var v = lireForm();
      if (v.projet || v.modele != null) {
        D.fiche.qualification = Object.assign({}, D.fiche.qualification || {}, {
          projet: v.projet, modele: v.modele, echeance: v.echeance, reprise: v.reprise, financement: v.financement, note: v.note });
      }
      if (v.site) D.site = Number(v.site);
      var vend = v.vendeur;
      renderDrawer();
      var sel = $drawer.querySelector('#q-vendeur'); if (sel && vend) sel.value = vend;
    }
    async function fermerDrawer(silencieux) {
      clearInterval(renouvellement);
      var D = S.dr; S.dr = null;
      $scrim.hidden = true; $drawer.hidden = true; $drawer.innerHTML = '';
      // Fermer sans geste rend le lead aux collègues tout de suite.
      if (D && D.fiche && estMien(D.fiche) && !silencieux) {
        try { await rpc('plateau_liberer', { p_sf_lead_id: D.sf }); } catch (e) {}
        rafraichir(true);
      }
    }

    // ── Gestes ────────────────────────────────────────────────────────────
    var occupe = false;
    async function geste(fn) {
      if (occupe) return; occupe = true;
      ov.classList.add('busy'); root.classList.add('busy');
      try { await fn(); }
      catch (e) { toast(messageErreur(e), true); }
      finally { occupe = false; ov.classList.remove('busy'); root.classList.remove('busy'); }
    }
    function prendre(sf) {
      return geste(async function () {
        var r = await rpc('plateau_prendre', { p_sf_lead_id: sf });
        if (r && r.action === 'reserve') { await ouvrir(sf); rafraichir(true); return; }
        if (r && r.action === 'occupe') { toast('Déjà pris par ' + propre(r.par_nom || 'un collègue') + '.', true); }
        else if (r && r.action === 'clos') toast('Ce lead est déjà traité (' + libStatut(r.statut) + ').', true);
        else toast('Lead introuvable dans la copie BACS.', true);
        rafraichir(true);
      });
    }
    function apresGeste(msg) { toast(msg); fermerDrawer(true); rafraichir(true); }
    function qualifier() {
      var D = S.dr; if (!D) return;
      var v = lireForm();
      if (!v.site) { toast('Choisissez le site vers lequel orienter le lead.', true); return; }
      var qualif = {};
      ['projet', 'modele', 'echeance', 'reprise', 'financement', 'note'].forEach(function (k) { if (v[k] && String(v[k]).trim()) qualif[k] = String(v[k]).trim(); });
      return geste(async function () {
        var r = await rpc('plateau_qualifier', { p_sf_lead_id: D.sf, p_id_site: Number(v.site), p_qualif: qualif, p_id_user_cible: v.vendeur ? Number(v.vendeur) : null });
        var site = (D.sites || []).find(function (s) { return Number(s.id_site) === Number(v.site); });
        if (r && r.ok === false) { toast('Qualifié, mais le transfert a échoué : ' + (r.motif || r.erreur || 'raison inconnue') + '.', true); fermerDrawer(true); rafraichir(true); return; }
        var vend = v.vendeur ? (D.vendeurs || []).find(function (x) { return String(x.id_user) === String(v.vendeur); }) : null;
        apresGeste('Transféré à ' + siteNom(site ? site.site : 'site') + (vend ? ' · ' + propre(vend.nom) : (r && r.id_user_attribue ? ' · tour de rôle' : '')));
      });
    }
    function rappel(type) {
      var D = S.dr; if (!D) return;
      var quandR;
      if (type === 'injoignable') {
        var choix = ($drawer.querySelector('#r-quand') || {}).value;
        quandR = choix === 'demain' ? demainA(9, 1) : choix === 'apres' ? demainA(9, 2)
          : choix === 'autre' ? new Date(($drawer.querySelector('#r-date') || {}).value) : new Date(Date.now() + 2 * 3600000);
      } else {
        var d = ($drawer.querySelector('#lt-date') || {}).value;
        quandR = d ? new Date(d + 'T09:00') : demainA(9, 30);
      }
      if (!quandR || isNaN(quandR.getTime()) || quandR.getTime() < Date.now() - 60000) { toast('Choisissez une date de rappel dans le futur.', true); return; }
      var note = (($drawer.querySelector('#q-note') || {}).value || '').trim() || null;
      return geste(async function () {
        await rpc('plateau_rappel', { p_sf_lead_id: D.sf, p_type: type, p_rappel_le: quandR.toISOString(), p_note: note });
        apresGeste((type === 'injoignable' ? 'Rappel programmé ' : 'Projet long terme, rappel ') + (quand(quandR).length > 5 ? 'le ' : 'à ') + quand(quandR));
      });
    }
    function abandonner() {
      var D = S.dr; if (!D) return;
      var motif = ($drawer.querySelector('#a-motif') || {}).value;
      var note = (($drawer.querySelector('#q-note') || {}).value || '').trim() || null;
      return geste(async function () {
        await rpc('plateau_abandonner', { p_sf_lead_id: D.sf, p_motif: motif, p_note: note });
        apresGeste('Lead abandonné · ' + motif);
      });
    }
    function relancer(ids) {
      var liste = String(ids || '').split(',').filter(Boolean);
      return geste(async function () {
        var n = 0, ok = 0;
        for (var i = 0; i < liste.length; i++) {
          var r = await rpc('plateau_relancer_site', { p_sf_lead_id: liste[i] });
          if (r && r.ok) ok++; n += (r && r.chefs_prevenus) || 0;
        }
        toast(ok ? 'Chef des ventes prévenu' + (n > 1 ? ' (' + n + ' alertes)' : '') : 'Aucun chef des ventes rattaché à ce site.', !ok);
        if (S.dr) { fermerDrawer(true); }
        rafraichir(true);
      });
    }
    function pick3cx() {
      var c = [FW, window]; try { c.push(window.parent); } catch (e) {} try { c.push(window.top); } catch (e) {}
      for (var i = 0; i < c.length; i++) { try { if (c[i] && c[i].OD3CX && typeof c[i].OD3CX.appeler === 'function') return c[i].OD3CX; } catch (e) {} }
      return null;
    }
    function canal(act) {
      var D = S.dr; if (!D || !D.fiche) return;
      var f = D.fiche;
      var nom = propre(f.nom || '');
      var client = { IDVu: f.id_client, TEl_MOB: f.telephone, EMAIL: f.email, nom: nom, prenom: '' };
      try {
        if (act === 'appel') {
          var cx = pick3cx(), num = normTel(f.telephone);
          if (cx && num) { cx.appeler(num, { nom: nom, idvu: f.id_client }); return; }
          var w = (window.parent && window.parent.__VOIP_UI__) || window.__VOIP_UI__ || FW.__VOIP_UI__;
          if (w && w.call) { w.call(f.telephone, client); return; }
          FW.open('tel:' + String(f.telephone || '').replace(/[^0-9+]/g, ''), '_self');
        } else if (act === 'sms') { var s = FW.__SMS_UI__ || window.__SMS_UI__; if (s && s.open) s.open({ client: client }); else toast('Module SMS indisponible.', true); }
        else if (act === 'wa') { var wa = FW.__WA_UI__ || window.__WA_UI__; if (wa && wa.open) wa.open({ client: client }); else toast('Module WhatsApp indisponible.', true); }
        else if (act === 'mail') { var m = FW.__EMAIL_UI__ || window.__EMAIL_UI__; if (m && m.open) m.open({ mode: 'new', client: client }); else FW.open('mailto:' + f.email, '_blank'); }
      } catch (e) { toast('Canal indisponible : ' + messageErreur(e), true); }
    }

    // ── Événements ────────────────────────────────────────────────────────
    function memoAck() { try { FW.localStorage.setItem('lmtc-ack', JSON.stringify(Array.from(S.ack).slice(-200))); } catch (e) {} }
    async function action(a, id, ev) {
      switch (a) {
        case 'tab':
          S.tab = id;
          if (id === 'campagnes' && !S.campagnes) { render(); try { S.campagnes = await rpc('plateau_campagnes', { p_jours: 90 }); } catch (e) { toast(messageErreur(e), true); S.campagnes = []; } }
          render(); return;
        case 'ack': S.ack.add(id); memoAck(); render(); return;
        case 'prendre': return prendre(id);
        case 'open': return ouvrir(id);
        case 'relancer': return relancer(id);
        case 'stock':
          S.tab = 'piscine'; S.stock = !!id; render();
          if (S.stock && !S.stockListe) { try { S.stockListe = await rpc('plateau_file', { p_vue: 'stock', p_campagne: S.campagne }); } catch (e) { toast(messageErreur(e), true); S.stockListe = []; } render(); }
          return;
        case 'source': {
          var src = (S.kpis && S.kpis.sources) || [];
          var actives = S.sources || src.filter(function (x) { return x.suivi; }).map(function (x) { return x.code; });
          S.sources = actives.indexOf(id) !== -1 ? actives.filter(function (c) { return c !== id; }) : actives.concat([id]);
          S.tab = 'piscine'; S.stock = false;
          return geste(async function () {
            S.piscine = await rpc('plateau_file', { p_vue: 'piscine', p_sources: sourcesArg(), p_campagne: S.campagne }) || [];
            render();
          });
        }
        case 'campagne':
          S.campagne = id || null; S.stockListe = null;
          if (S.campagne) {
            var c = (S.campagnes || []).find(function (x) { return x.campagne === S.campagne; }) || {};
            S.stock = false;
            S.tab = (Number(c.a_prendre) + Number(c.acceptes)) > 0 ? 'piscine' : Number(c.rappels) > 0 ? 'rappels' : 'transferts';
          }
          return geste(async function () { await charger(); render(); });
        case 'miens': S.miens = !!id; render(); return;
        case 'quitter-apercu':
          try { FW.history.replaceState(null, '', FW.location.pathname + FW.location.search.replace(/([?&])plateau=1&?/, '$1').replace(/[?&]$/, '')); } catch (e) { try { FW.location.hash = ''; } catch (e2) {} }
          detruire();
          var legacy = await chargerLegacy();
          return legacy.mount(el, ctx);
        case 'reessayer': S.erreur = null; render(); return rafraichir();
        // Panneau
        case 'close': return fermerDrawer();
        case 'copier': try { await (FW.navigator || navigator).clipboard.writeText(id); toast('Numéro copié'); } catch (e) { toast(id); } return;
        case 'canal': return canal(id);
        case 'tous-sites': if (S.dr) { S.dr.tousSites = true; renderDrawerPreserve(); } return;
        case 'issue': if (S.dr) { S.dr.issue = id; renderDrawerPreserve(); } return;
        case 'qualifier': return qualifier();
        case 'injoignable': return rappel('injoignable');
        case 'long-terme': return rappel('long_terme');
        case 'abandonner': return abandonner();
        case 'liberer':
          return geste(async function () { var D = S.dr; await rpc('plateau_liberer', { p_sf_lead_id: D.sf }); apresGeste('Lead libéré'); });
      }
    }
    function surClic(ev) {
      var t = ev.target.closest('[data-a]');
      if (!t || t.disabled) return;
      var a = t.getAttribute('data-a');
      if (t.classList.contains('lr') && ev.target.closest('button,select,input,a')) return;
      ev.preventDefault(); ev.stopPropagation();
      action(a, t.getAttribute('data-id') || '', ev);
    }
    root.addEventListener('click', surClic);
    ov.addEventListener('click', surClic);
    $scrim.addEventListener('click', function () { fermerDrawer(); });
    root.addEventListener('keydown', function (ev) {
      if ((ev.key === 'Enter' || ev.key === ' ') && ev.target.classList && ev.target.classList.contains('lr')) { ev.preventDefault(); ouvrir(ev.target.getAttribute('data-id')); }
    });
    ov.addEventListener('change', async function (ev) {
      var t = ev.target;
      if (t.name === 'q-site' && S.dr) {
        S.dr.site = Number(t.value); S.dr.vendeurs = null;
        renderDrawerPreserve();
        await chargerVendeurs(); renderDrawerPreserve();
      } else if (t.id === 'r-quand') {
        var d = $drawer.querySelector('#r-date'); if (d) d.hidden = t.value !== 'autre';
      }
    });
    function surTouche(ev) { if (ev.key === 'Escape' && S.dr) fermerDrawer(); }
    doc.addEventListener('keydown', surTouche);

    // ── Cycle de vie ──────────────────────────────────────────────────────
    var minuteur = null, horloge = null;
    function detruire() {
      clearInterval(minuteur); clearInterval(horloge); clearInterval(renouvellement);
      doc.removeEventListener('keydown', surTouche);
      if (S.dr && S.dr.fiche && estMien(S.dr.fiche)) { try { rpc('plateau_liberer', { p_sf_lead_id: S.dr.sf }); } catch (e) {} }
      S.dr = null;
      try { ov.remove(); } catch (e) {}
      try { root.remove(); } catch (e) {}
    }
    minuteur = setInterval(function () {
      if (!el.isConnected || !root.isConnected) { detruire(); return; }
      if (doc.visibilityState === 'hidden' || occupe) return;
      rafraichir(true);
    }, REFRESH_MS);
    // Les minuteurs affichés vieillissent sans attendre le rechargement.
    horloge = setInterval(function () {
      if (!el.isConnected) { detruire(); return; }
      if (doc.visibilityState === 'hidden' || occupe || !S.charge) return;
      var act = doc.activeElement;
      if (act && root.contains(act) && /INPUT|SELECT|TEXTAREA/.test(act.tagName)) return;
      render();
    }, 20000);

    await rafraichir();
  }

  // ==========================================================================
  //  CHARTE (maquette « Leads Team Colin », validée le 05/10/2026)
  // ==========================================================================
  function injecterCss(doc) {
    if (doc.getElementById('lmtc-css')) return;
    if (!doc.getElementById('lmtc-font')) {
      var f = doc.createElement('link'); f.id = 'lmtc-font'; f.rel = 'stylesheet';
      f.href = 'https://fonts.googleapis.com/css2?family=Nunito+Sans:opsz,wght@6..12,400;6..12,600;6..12,700;6..12,800&display=swap';
      (doc.head || doc.documentElement).appendChild(f);
    }
    var st = doc.createElement('style'); st.id = 'lmtc-css';
    st.textContent = `
.lmtc{--bg:#f1f4f9;--surface:#ffffff;--surface-2:#f6f8fc;--line:#e1e7f0;--line-2:#ccd6e4;
  --fg:#17253b;--muted:#56657d;--faint:#8794a8;
  --accent:#2a5ea9;--accent-dk:#1f4a87;--accent-bg:#e9eff9;--on-accent:#ffffff;
  --ok:#0b7a58;--ok-bg:#e0f3eb;--warn:#9c5a00;--warn-bg:#fcefd6;--crit:#b42323;--crit-bg:#fbe8e8;
  --vroom:#5a2dbd;--vroom-bg:#efe9fd;--scrim:rgba(12,22,38,.38);--shadow:0 18px 40px rgba(23,37,59,.16);
  --f-ui:"Nunito Sans",system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;
  --f-num:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
  font-family:var(--f-ui);font-size:14px;line-height:1.45;color:var(--fg);-webkit-font-smoothing:antialiased}
.lmtc:not(.lmtc-ov){display:block;width:100%;max-width:1320px;margin:0 auto;padding:18px 16px 48px;box-sizing:border-box;background:var(--bg)}
.lmtc *{box-sizing:border-box}
.lmtc [hidden]{display:none!important}
.lmtc button{font:inherit;color:inherit}
.lmtc h2,.lmtc h3{margin:0;text-wrap:balance}
.lmtc p{margin:0}
.lmtc .num{font-family:var(--f-num);font-variant-numeric:tabular-nums}
.lmtc.busy{cursor:progress}
.lmtc .situ{display:grid;gap:12px;margin-bottom:18px}
.lmtc .situ-l{font-size:11.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
.lmtc .situ-l .vr{color:var(--vroom)}
.lmtc .lien{border:0;background:none;padding:0;color:var(--accent);font-weight:800;text-transform:none;letter-spacing:0;cursor:pointer;text-decoration:underline}
.lmtc .situ-t{font-size:clamp(17px,2.1vw,21px);font-weight:700;line-height:1.35;max-width:72ch}
.lmtc .situ-t b{font-weight:800}
.lmtc .t-crit{color:var(--crit)} .lmtc .t-warn{color:var(--warn)} .lmtc .t-ok{color:var(--ok)} .lmtc .t-acc{color:var(--accent)} .lmtc .t-vr{color:var(--vroom)} .lmtc .t-mut{color:var(--faint);font-weight:600}
.lmtc .kpis{display:flex;flex-wrap:wrap;gap:8px 26px}
.lmtc .k{display:grid;gap:1px}
.lmtc .k > span{font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--faint)}
.lmtc .k b{font-family:var(--f-num);font-size:15.5px;font-weight:600}
.lmtc .k b .txt{font-family:var(--f-ui);font-weight:800;font-size:15px}
.lmtc .alerte{background:var(--warn-bg);color:var(--warn);border-radius:10px;padding:9px 12px;font-size:13px;font-weight:700;margin-bottom:14px}
.lmtc .poste{display:grid;grid-template-columns:minmax(0,340px) minmax(0,1fr);gap:18px;align-items:start}
@media (max-width:940px){.lmtc .poste{grid-template-columns:minmax(0,1fr)}}
.lmtc .sig{background:var(--surface);border:1px solid var(--line);border-radius:12px;min-width:0}
@media (min-width:941px){.lmtc .sig{position:sticky;top:12px;max-height:calc(100vh - 24px);overflow:auto}}
.lmtc .zh{padding:14px 16px 11px;display:grid;gap:3px}
.lmtc .zh h2{font-size:15px;font-weight:800;display:flex;align-items:center;gap:8px}
.lmtc .zh p{font-size:12.5px;color:var(--muted)}
.lmtc .cnt{font-family:var(--f-num);font-size:11.5px;font-weight:600;background:var(--accent-bg);color:var(--accent-dk);border-radius:999px;padding:1px 8px}
.lmtc .sg{display:grid;grid-template-columns:10px minmax(0,1fr);gap:11px;padding:12px 16px;border-top:1px solid var(--line)}
.lmtc .sg-m{width:10px;height:10px;border-radius:3px;margin-top:5px;background:var(--faint)}
.lmtc .sg.crit .sg-m{background:var(--crit)} .lmtc .sg.warn .sg-m{background:var(--warn)} .lmtc .sg.new .sg-m{background:var(--accent)} .lmtc .sg.vr .sg-m{background:var(--vroom)} .lmtc .sg.info .sg-m{background:var(--line-2)}
.lmtc .sg.fresh .sg-m{animation:lmtc-pulse 1.6s ease-out 4}
@keyframes lmtc-pulse{0%{box-shadow:0 0 0 0 var(--accent)}100%{box-shadow:0 0 0 9px transparent}}
.lmtc .sg-top{display:flex;justify-content:space-between;gap:8px;align-items:baseline}
.lmtc .sg-k{font-size:10.5px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--muted)}
.lmtc .sg.crit .sg-k{color:var(--crit)} .lmtc .sg.warn .sg-k{color:var(--warn)} .lmtc .sg.new .sg-k{color:var(--accent)} .lmtc .sg.vr .sg-k{color:var(--vroom)}
.lmtc .sg-h{font-family:var(--f-num);font-size:11px;color:var(--faint);white-space:nowrap}
.lmtc .sg-t{font-weight:700;margin-top:2px}
.lmtc .sg-d{font-size:12.5px;color:var(--muted);margin-top:2px}
.lmtc .sg-a{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}
.lmtc .sig-empty{padding:18px 16px;border-top:1px solid var(--line);font-size:12.5px;color:var(--muted)}
.lmtc .act{background:var(--surface);border:1px solid var(--line);border-radius:12px;min-width:0}
.lmtc .tabs{display:flex;gap:2px;padding-inline:8px;border-bottom:1px solid var(--line);overflow-x:auto;scrollbar-width:thin}
.lmtc .tabs button{flex:none;border:0;background:transparent;padding:13px 12px 11px;border-bottom:2px solid transparent;font-weight:700;font-size:13.5px;color:var(--muted);cursor:pointer;display:flex;align-items:center;gap:7px}
.lmtc .tabs button.on{color:var(--fg);border-bottom-color:var(--accent)}
.lmtc .tabs .cnt.z{background:var(--surface-2);color:var(--faint)}
.lmtc .tabs .cnt.c{background:var(--crit-bg);color:var(--crit)}
.lmtc .panel{padding:16px 18px 20px;min-width:0}
.lmtc .ph{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:10px 16px;margin-bottom:12px}
.lmtc .ph h2{font-size:16px;font-weight:800}
.lmtc .ph p{font-size:12.5px;color:var(--muted);max-width:68ch;margin-top:2px}
.lmtc .ph-r{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.lmtc .barre{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;margin-bottom:10px}
.lmtc .btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;border:1px solid var(--line-2);background:var(--surface);color:var(--fg);border-radius:8px;padding:7px 12px;font-size:12.5px;font-weight:700;cursor:pointer;white-space:nowrap;line-height:1.2}
.lmtc .btn:hover{border-color:var(--accent);color:var(--accent-dk)}
.lmtc .btn.pri{background:var(--accent);border-color:var(--accent);color:var(--on-accent)}
.lmtc .btn.pri:hover{background:var(--accent-dk);border-color:var(--accent-dk);color:var(--on-accent)}
.lmtc .btn.vr{background:var(--vroom);border-color:var(--vroom);color:var(--on-accent)}
.lmtc .btn.vr:hover{filter:brightness(.92);color:var(--on-accent)}
.lmtc .btn.ghost{border-color:transparent;background:transparent;color:var(--muted)}
.lmtc .btn.ghost:hover{color:var(--fg);border-color:var(--line-2)}
.lmtc .btn.sm{padding:5px 9px;font-size:12px}
.lmtc .btn.dang{color:var(--crit)}
.lmtc .btn[disabled]{opacity:.45;cursor:not-allowed}
.lmtc.busy .btn,.lmtc-ov.busy .btn{pointer-events:none;opacity:.7}
.lmtc :is(.btn,.tabs button,.lr,.chip span,.seg button,.fchip):focus-visible{outline:2px solid var(--accent);outline-offset:2px}
.lmtc select,.lmtc input[type=text],.lmtc input[type=date],.lmtc input[type=datetime-local],.lmtc textarea{font:inherit;font-size:13px;color:var(--fg);background:var(--surface);border:1px solid var(--line-2);border-radius:8px;padding:7px 9px;min-width:0}
.lmtc select:focus,.lmtc input:focus,.lmtc textarea:focus{outline:2px solid var(--accent);outline-offset:1px}
.lmtc .tag{display:inline-flex;align-items:center;font-size:11px;font-weight:700;border-radius:999px;padding:2px 8px;background:var(--surface-2);border:1px solid var(--line);color:var(--muted);white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis}
.lmtc .tag.camp{background:var(--accent-bg);border-color:transparent;color:var(--accent-dk)}
.lmtc .tag.vr{background:var(--vroom-bg);border-color:transparent;color:var(--vroom)}
.lmtc .tag.ok{background:var(--ok-bg);border-color:transparent;color:var(--ok)}
.lmtc .tag.crit{background:var(--crit-bg);border-color:transparent;color:var(--crit)}
.lmtc .tag.warn{background:var(--warn-bg);border-color:transparent;color:var(--warn)}
.lmtc .tags{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px}
.lmtc .tm{display:inline-grid;gap:2px;justify-items:start}
.lmtc .tm b{font-family:var(--f-num);font-weight:600;font-size:13.5px;padding:3px 8px;border-radius:6px;background:var(--ok-bg);color:var(--ok);white-space:nowrap}
.lmtc .tm.warn b{background:var(--warn-bg);color:var(--warn)}
.lmtc .tm.crit b{background:var(--crit-bg);color:var(--crit)}
.lmtc .tm.neutre b{background:var(--surface-2);color:var(--muted)}
.lmtc .tm small{font-size:10.5px;color:var(--faint);white-space:nowrap}
.lmtc .list{display:grid}
.lmtc .lr{display:grid;grid-template-columns:112px minmax(0,1fr) auto;gap:14px;align-items:center;padding:12px 6px;border-top:1px solid var(--line);cursor:pointer;border-radius:8px}
.lmtc .lr:hover{background:var(--surface-2)}
.lmtc .lr.resa{opacity:.62}
.lmtc .lr-n{font-weight:800}
.lmtc .lr-v{color:var(--muted);font-size:12.5px;font-weight:600}
.lmtc .lr-d{font-size:13px;margin-top:1px}
.lmtc .lr-a{display:flex;flex-wrap:wrap;gap:6px;justify-content:flex-end;align-items:center}
.lmtc .resa-l{font-size:12px;color:var(--muted);font-weight:600;text-align:right}
@media (max-width:600px){.lmtc .lr{grid-template-columns:minmax(0,1fr)}.lmtc .lr-a{justify-content:flex-start}.lmtc .resa-l{text-align:left}}
.lmtc .empty{padding:20px 6px;border-top:1px solid var(--line);color:var(--muted);font-size:13px}
.lmtc .seg{display:inline-flex;gap:2px;padding:2px;border:1px solid var(--line);border-radius:8px;background:var(--surface-2)}
.lmtc .seg button{border:0;background:transparent;padding:5px 9px;border-radius:6px;font-size:12px;font-weight:700;color:var(--muted);cursor:pointer}
.lmtc .seg button.on{background:var(--surface);color:var(--fg);box-shadow:0 1px 2px rgba(23,37,59,.12)}
.lmtc .seg .num{font-size:11px;color:var(--faint);margin-left:3px}
.lmtc .filtres{display:flex;flex-wrap:wrap;gap:5px}
.lmtc .fchip{border:1px solid var(--line-2);background:var(--surface);border-radius:999px;padding:4px 10px;font-size:12px;font-weight:700;color:var(--muted);cursor:pointer}
.lmtc .fchip.on{background:var(--accent-bg);border-color:var(--accent);color:var(--accent-dk)}
.lmtc .fchip .num{font-size:11px;margin-left:3px}
.lmtc .scroll{overflow-x:auto}
.lmtc table{border-collapse:separate;border-spacing:0;width:100%}
.lmtc th{font-size:10.5px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--faint);text-align:center;padding:8px 6px;white-space:nowrap}
.lmtc th:first-child,.lmtc td:first-child{text-align:left}
.lmtc td{border-top:1px solid var(--line);padding:7px 6px;text-align:center;vertical-align:middle}
.lmtc .camp-t{min-width:820px}
.lmtc .camp-t td{font-size:13px}
.lmtc .camp-t td.l{font-weight:700;max-width:320px}
.lmtc .camp-t td.l small{display:block;font-weight:600;color:var(--muted);font-size:11.5px}
.lmtc .prog{display:inline-grid;gap:4px;justify-items:center}
.lmtc .bar{width:84px;height:5px;border-radius:2px;background:var(--line);overflow:hidden}
.lmtc .bar i{display:block;height:100%;background:var(--accent)}
.lmtc .bar.low i{background:var(--crit)}
.lmtc .na{color:var(--faint);font-size:12px}
.lmtc .foot{font-size:12px;color:var(--muted);margin-top:10px;max-width:80ch}
.lmtc-ov .scrim{position:fixed;inset:0;background:var(--scrim);z-index:9990}
.lmtc-ov .drawer{position:fixed;top:0;right:0;bottom:0;width:min(520px,100%);background:var(--surface);z-index:9991;box-shadow:var(--shadow);display:flex;flex-direction:column;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
.lmtc-ov .dr-h{display:flex;justify-content:space-between;gap:12px;padding:16px 18px 12px;border-bottom:1px solid var(--line)}
.lmtc-ov .dr-h h2{font-size:19px;font-weight:800}
.lmtc-ov .dr-s{font-size:12.5px;color:var(--muted);font-weight:600;margin-top:2px}
.lmtc-ov .x{border:0;background:var(--surface-2);width:34px;height:34px;border-radius:8px;font-size:18px;cursor:pointer;flex:none;color:var(--muted)}
.lmtc-ov .dr-b{flex:1;overflow:auto;padding:4px 18px 18px;display:grid;align-content:start}
.lmtc-ov .dr-b section{padding:13px 0;border-bottom:1px solid var(--line);display:grid;gap:7px}
.lmtc-ov .dr-b section:last-child{border-bottom:0}
.lmtc-ov .dr-b h3{font-size:10.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--faint)}
.lmtc-ov .dl{display:grid;grid-template-columns:max-content minmax(0,1fr);gap:4px 14px;font-size:13px;margin:0}
.lmtc-ov .dl dt{color:var(--muted)}
.lmtc-ov .dl dd{margin:0;font-weight:700}
.lmtc-ov .tel{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.lmtc-ov .tel b{font-family:var(--f-num);font-size:15px;user-select:all}
.lmtc-ov .mail{font-size:13px;color:var(--muted);word-break:break-all}
.lmtc-ov .quote{font-size:13px;color:var(--muted);border-left:2px solid var(--line-2);padding-left:10px;white-space:pre-line}
.lmtc-ov .canaux{display:flex;flex-wrap:wrap;gap:6px}
.lmtc-ov .canaux .btn{flex:1 1 84px}
.lmtc-ov .delais{display:flex;flex-wrap:wrap;gap:14px 22px}
.lmtc-ov .delais > div{display:grid;gap:4px}
.lmtc-ov .delais > div > span:first-child{font-size:11.5px;color:var(--muted);font-weight:700}
.lmtc-ov .tl{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.lmtc-ov .tl li{display:grid;grid-template-columns:86px minmax(0,1fr);gap:10px;font-size:12.5px}
.lmtc-ov .tl li b{font-family:var(--f-num);font-weight:500;color:var(--faint);font-size:11.5px}
.lmtc-ov .tl li.v span{color:var(--vroom);font-weight:700}
.lmtc-ov .dr-f{border-top:1px solid var(--line);padding:12px 18px;display:grid;gap:10px;background:var(--surface)}
.lmtc-ov .dr-f .row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.lmtc-ov .hint{font-size:12px;color:var(--muted)}
.lmtc-ov .issues{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:2px;padding:2px;border:1px solid var(--line);border-radius:9px;background:var(--surface-2)}
.lmtc-ov .issues button{border:0;background:transparent;padding:7px 4px;border-radius:7px;font-size:12.5px;font-weight:700;color:var(--muted);cursor:pointer}
.lmtc-ov .issues button.on{background:var(--surface);color:var(--fg);box-shadow:0 1px 2px rgba(23,37,59,.14)}
.lmtc-ov .issues button.on.qualifier{color:var(--vroom)} .lmtc-ov .issues button.on.abandon{color:var(--crit)}
.lmtc-ov .dr-f .row.pied{justify-content:space-between;flex-wrap:nowrap}
.lmtc-ov .dr-f .row.pied .hint{flex:1}
@media (max-width:420px){.lmtc-ov .issues{grid-template-columns:repeat(2,minmax(0,1fr))}}
.lmtc-ov .qf{display:grid;gap:10px}
.lmtc-ov .q{display:grid;gap:5px}
.lmtc-ov .q > span{font-size:12px;font-weight:700;color:var(--muted)}
.lmtc-ov .vend{margin-top:6px}
.lmtc-ov .chips{display:flex;flex-wrap:wrap;gap:5px}
.lmtc-ov .chip{position:relative}
.lmtc-ov .chip input{position:absolute;opacity:0;width:1px;height:1px}
.lmtc-ov .chip span{display:inline-block;padding:5px 10px;border-radius:999px;border:1px solid var(--line-2);font-size:12.5px;font-weight:700;color:var(--muted);cursor:pointer}
.lmtc-ov .chip input:checked + span{background:var(--accent-bg);border-color:var(--accent);color:var(--accent-dk)}
.lmtc-ov .chip input:focus-visible + span{outline:2px solid var(--accent);outline-offset:2px}
.lmtc-ov .sites{display:grid;gap:6px}
.lmtc-ov .site-o{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:10px;align-items:center;border:1px solid var(--line-2);border-radius:9px;padding:9px 11px;cursor:pointer}
.lmtc-ov .site-o:has(input:checked){border-color:var(--vroom);background:var(--vroom-bg)}
.lmtc-ov .site-o b{font-weight:800}
.lmtc-ov .site-o small{display:block;color:var(--muted);font-size:11.5px;font-weight:600}
.lmtc-ov .site-o input{accent-color:var(--vroom)}
.lmtc-ov .site-o em{font-style:normal;font-family:var(--f-num);font-size:12px;color:var(--muted)}
.lmtc-ov .toast{position:fixed;left:50%;bottom:calc(18px + env(safe-area-inset-bottom,0px));transform:translate(-50%,20px);background:var(--fg);color:#fff;padding:10px 16px;border-radius:10px;font-weight:700;font-size:13px;opacity:0;pointer-events:none;transition:opacity .2s,transform .2s;z-index:9999;max-width:calc(100% - 32px)}
.lmtc-ov .toast.err{background:var(--crit)}
.lmtc-ov .toast.on{opacity:1;transform:translate(-50%,0)}
@media (prefers-reduced-motion:reduce){.lmtc *{animation:none!important;transition:none!important}}
`;
    (doc.head || doc.documentElement).appendChild(st);
  }
})();
