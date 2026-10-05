// ============================================================================
//  LEAD MANAGEMENT — module One Data (OD.define 'lead-mgmt')
//  VERSION TEAM COLIN (v51) — déploiement CIBLÉ (publish-targets :
//  lead-mgmt = teamcolin). Le reste de la flotte reste sur la v48.
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
//  (teamcolin_plateau_vroom.sql, teamcolin_plateau_bacs.sql). Elles lisent la
//  copie BACS synchronisée par l'extension et refusent tout utilisateur hors
//  rôles 1, 8 et 10.
//
//  ÉCRITURE DANS BACS (v51) : chaque geste part dans la file bacs_sortant,
//  que l'extension applique par la session BACS ouverte sur le poste.
//  L'opérateur ne touche plus à BACS : il garde un onglet BACS ouvert et
//  connecté. Sans aucune session vivante, les gestes sont BLOQUÉS par un
//  bandeau qu'on ne peut pas fermer (décision du 16/09/2026).
//
//  CHARTE : celle de One Data (Nunito Sans seule, bleu #2a5ea9, bleu foncé
//  #1F4A85, vert de validation #53bda7, texte bleu nuit — jamais de noir).
//
//  ⚠️ CE FICHIER EST DÉSORMAIS CELUI DE TEAM COLIN (comme objectifs.js).
//  La version de flotte vit au tag lead-mgmt-v48. Pour la corriger :
//  repartir de `git show lead-mgmt-v48:lead-mgmt.js`, jamais de ce fichier.
//  Retour arrière Team Colin : ré-épingler la v48 sur le tenant.
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
      bacs: null,
      dr: null, // { sf, fiche, sites, vendeurs, site, envois }
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
    // ── Canal BACS ────────────────────────────────────────────────────────
    function ecritBacs() { return !!(S.bacs && S.bacs.ecrire_bacs); }
    // Aucune session BACS vivante : rien ne partirait. On bloque AVANT le geste.
    function bloque() { return ecritBacs() && S.bacs.canal === 'aucun'; }
    function dis() { return bloque() ? ' disabled title="Ouvrez BACS dans un onglet pour agir"' : ''; }
    var GESTES_BACS = ['prendre', 'qualifier', 'injoignable', 'long-terme', 'abandonner'];
    // Réveille l'extension pour qu'elle vide la file tout de suite (sans
    // effet si elle ne connaît pas encore ce signal : elle la videra au
    // prochain passage).
    function reveillerBacs() {
      try { if (OD.bacs && typeof OD.bacs.demander === 'function') OD.bacs.demander('vider_file', {}, 4000); } catch (e) {}
    }
    async function rafraichirBacs() {
      try { var b = await rpc('plateau_bacs_etat'); var avant = JSON.stringify(S.bacs); S.bacs = b; return avant !== JSON.stringify(b); }
      catch (e) { return false; }
    }
    function bandeauBacs() {
      var b = S.bacs; if (!b || !b.ecrire_bacs) return '';
      if (b.canal === 'aucun') return '<div class="bd crit" role="alert"><b>BACS n\'est ouvert sur aucun poste.</b>'
        + '<span>One Data reporte chacun de vos gestes dans BACS. Ouvrez BACS dans un onglet de ce navigateur et connectez-vous : les gestes se débloquent dès que BACS répond.</span></div>';
      var h = '';
      if (b.canal === 'autre') h += '<div class="bd info"><b>Vos gestes passent par la session BACS de ' + esc(propre(b.par || 'un collègue')) + '.</b>'
        + '<span>' + (b.moi_bacs ? 'Ouvrez BACS sur ce poste pour qu\'ils portent votre nom.' : 'Votre compte One Data n\'est pas relié à un compte BACS : demandez à l\'administrateur de renseigner votre identifiant BACS.') + '</span></div>';
      if (b.en_attente_vieux > 0) h += '<div class="bd warn"><b>' + plural(b.en_attente_vieux, 'geste attend', 'gestes attendent') + ' d\'être appliqué' + (b.en_attente_vieux > 1 ? 's' : '') + ' dans BACS.</b>'
        + '<span>Ils partent au prochain passage de l\'extension. Si cela dure, rechargez l\'onglet BACS.</span></div>';
      return h;
    }
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
      // Le filtre de campagne n'est PAS envoyé au serveur : il ne s'applique qu'à
      // l'affichage des files. Les signaux et la situation restent ceux du plateau entier.
      var args = { p_sources: sourcesArg() };
      var res = await Promise.all([
        rpc('plateau_kpis'),
        rpc('plateau_file', Object.assign({ p_vue: 'piscine' }, args)),
        rpc('plateau_file', { p_vue: 'rappels' }),
        rpc('plateau_file', { p_vue: 'transferts' }),
        S.stock ? rpc('plateau_file', { p_vue: 'stock' }) : Promise.resolve(S.stockListe),
        S.tab === 'campagnes' ? rpc('plateau_campagnes', { p_jours: 90 }) : Promise.resolve(S.campagnes),
        rpc('plateau_bacs_etat').catch(function () { return S.bacs; })
      ]);
      S.bacs = res[6] || S.bacs;
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
      if (S.bacs && S.bacs.echecs > 0) {
        var el0 = (S.bacs.echecs_leads || [])[0];
        out.push({ id: 'bacs-echec-' + S.bacs.echecs, niv: 'crit', k: 'Report BACS', t: null,
          titre: plural((S.bacs.echecs_leads || []).length || S.bacs.echecs, 'lead n\'a pas pu être mis à jour', 'leads n\'ont pas pu être mis à jour') + ' dans BACS',
          d: 'BACS a refusé le geste ou n\'a pas répondu après cinq essais. La fiche donne la raison et permet de relancer l\'envoi.',
          a: el0 ? [['Ouvrir la fiche', 'open', el0]] : [] });
      }
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
      var b = S.bacs || {};
      kp.push(['Report dans BACS', !b.ecrire_bacs ? '<span class="txt t-mut">désactivé</span>'
        : b.canal === 'aucun' ? '<span class="txt t-crit">bloqué</span>'
        : b.echecs ? '<span class="txt t-crit">' + plural(b.echecs, 'échec') + '</span>'
        : b.en_attente ? '<span class="txt t-warn">' + b.en_attente + ' en attente</span>'
        : '<span class="txt t-ok">automatique</span>']);
      return '<section class="situ"><p class="situ-l">' + l + '</p><p class="situ-t">' + t + '</p><div class="kpis">'
        + kp.map(function (x) { return '<div class="k"><span>' + x[0] + '</span><b>' + x[1] + '</b></div>'; }).join('') + '</div></section>';
    }

    // ── Onglets ───────────────────────────────────────────────────────────
    function onglets() {
      var k = S.kpis || {};
      var libres = S.piscine.filter(verrouLibre);
      var hd = libres.some(function (l) { return (l.statut_eff === 'A affecter' || l.statut_eff === 'Nouveau') && mins(l.recu_le) >= (l.sla_min || 120); });
      if (S.campagne) return [['piscine', 'La piscine BACS', fc(libres).length, false], ['rappels', 'Rappels', fc(S.rappels).length, false],
                              ['transferts', 'Transferts', fc(S.transferts).length, false], ['campagnes', 'Campagnes', null]];
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
    function fc(list) { return S.campagne ? (list || []).filter(function (l) { return l.campagne === S.campagne; }) : (list || []); }
    // Bandeau visible sur TOUS les onglets tant qu'un filtre de campagne est actif.
    function bandeauFiltre() {
      if (!S.campagne) return '';
      var n = [[fc(S.piscine).length, 'à traiter'], [fc(S.rappels).length, 'en rappel'], [fc(S.transferts).length, 'transféré', 'transférés']];
      return '<div class="filtre-actif"><span><b>Filtre campagne</b> ' + esc(S.campagne) + '</span><span class="fa-n">'
        + n.map(function (x) { return x[0] + ' ' + (x[0] > 1 && x[2] ? x[2] : x[1]); }).join(' · ')
        + '</span><button type="button" class="btn sm" data-a="campagne" data-id="">Retirer le filtre</button></div>';
    }

    // ── Vues ──────────────────────────────────────────────────────────────
    function actionLigne(l, verbe) {
      if (estMien(l)) return '<button type="button" class="btn pri" data-a="open" data-id="' + esc(l.sf_lead_id) + '">Reprendre</button>';
      if (!verrouLibre(l)) return '<span class="resa-l">Réservé par ' + esc(propre(l.verrou_nom || 'un collègue')) + '<br>jusqu\'à ' + hh(l.verrou_jusqu) + '</span>';
      return '<button type="button" class="btn pri" data-a="prendre" data-id="' + esc(l.sf_lead_id) + '"' + dis() + '>' + esc(verbe || 'Prendre') + '</button>';
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
        + '</div>'
        + '<div class="barre"><div class="seg"><button type="button" class="' + (!S.stock ? 'on' : '') + '" data-a="stock" data-id="">À traiter <span class="num">' + fc(S.piscine).length + '</span></button>'
        + '<button type="button" class="' + (S.stock ? 'on' : '') + '" data-a="stock" data-id="1">Stock accepté <span class="num">' + (S.campagne && S.stockListe ? fc(S.stockListe).length : (k.stock_acceptes_anciens || 0)) + '</span></button></div>'
        + (!S.stock ? chipsSources() : '') + '</div><div class="list">';
      var ls = fc(S.stock ? (S.stockListe || []) : S.piscine);
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
      var ls = fc(S.rappels).filter(function (l) { return !S.miens || Number(l.derniere_action_par) === Number(MOI); });
      var h = '<div class="ph"><div><h2>Rappels</h2><p>Les clients injoignables et les projets à long terme, du rappel le plus en retard au plus lointain (30 jours en arrière, 7 jours en avant).</p></div>'
        + '<div class="ph-r"><div class="seg"><button type="button" class="' + (!S.miens ? 'on' : '') + '" data-a="miens" data-id="">Tout le plateau</button><button type="button" class="' + (S.miens ? 'on' : '') + '" data-a="miens" data-id="1">Les miens</button></div></div></div><div class="list">';
      if (!ls.length) h += '<div class="empty">' + (S.campagne ? 'Aucun rappel pour cette campagne.' : 'Aucun rappel programmé.') + '</div>';
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
      var ls = fc(S.transferts).filter(function (l) { return !S.miens || Number(l.derniere_action_par) === Number(MOI); });
      var h = '<div class="ph"><div><h2>Transferts</h2><p>Ce que deviennent les leads qualifiés par le plateau ces 30 derniers jours. Le site a 2 h pour les prendre ; au-delà, relancez le chef des ventes.</p></div>'
        + '<div class="ph-r"><div class="seg"><button type="button" class="' + (!S.miens ? 'on' : '') + '" data-a="miens" data-id="">Tout le plateau</button><button type="button" class="' + (S.miens ? 'on' : '') + '" data-a="miens" data-id="1">Les miens</button></div></div></div><div class="list">';
      if (!ls.length) h += '<div class="empty">' + (S.campagne ? 'Aucun transfert pour cette campagne sur la période.' : 'Aucun transfert sur la période.') + '</div>';
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
      h += '<div class="scroll"><table class="camp-t"><thead><tr><th>Campagne</th><th>Reçus</th><th>À prendre</th><th>Acceptés</th><th>En rappel</th><th>Qualifiés</th><th>Aban&shy;donnés</th><th>Taux de qualif.</th><th></th></tr></thead><tbody>';
      S.campagnes.forEach(function (c) {
        var taux = c.recus ? Math.round(100 * c.qualifies / c.recus) : 0;
        var ouverts = Number(c.a_prendre) + Number(c.acceptes) + Number(c.rappels);
        var sans = c.campagne === '(sans nom de campagne)';
        var actif = S.campagne === c.campagne;
        h += '<tr' + (actif ? ' class="actif"' : '') + '><td class="l">' + esc(c.campagne) + '<small>dernier lead le ' + esc(jour(c.dernier)) + '</small></td>'
          + '<td class="num">' + c.recus + '</td><td class="num">' + (c.a_prendre || '<span class="na">0</span>') + '</td>'
          + '<td class="num">' + (c.acceptes || '<span class="na">0</span>') + '</td><td class="num">' + (c.rappels || '<span class="na">0</span>') + '</td>'
          + '<td class="num">' + (c.qualifies || '<span class="na">0</span>') + '</td><td class="num">' + (c.abandonnes || '<span class="na">0</span>') + '</td>'
          + '<td><span class="prog"><span class="num">' + taux + ' %</span><span class="bar' + (taux < 10 ? ' low' : '') + '"><i style="width:' + Math.min(100, taux) + '%"></i></span></span></td>'
          + '<td class="act-c">' + (actif ? '<button type="button" class="btn sm" data-a="campagne" data-id="">Retirer</button>'
              : ouverts && !sans ? '<button type="button" class="btn sm" data-a="campagne" data-id="' + esc(c.campagne) + '">Filtrer</button>' : '') + '</td></tr>';
      });
      return h + '</tbody></table></div><p class="foot">Un lead est compté dans la colonne de son statut actuel : statut BACS, ou celui du dernier geste One Data s\'il est plus récent que la copie BACS. « Filtrer » restreint la piscine, les rappels et les transferts à la campagne ; les signaux restent ceux de tout le plateau.</p>';
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
      root.innerHTML = renderSituation() + bandeauBacs()
        + (S.erreur ? '<p class="alerte">' + esc(S.erreur) + ' Les données affichées datent du dernier chargement réussi.</p>' : '')
        + '<div class="poste"><aside class="sig" aria-label="Signaux">' + renderSignaux(list) + '</aside>'
        + '<section class="act" aria-label="Actions">' + renderTabs() + bandeauFiltre() + '<div class="panel">' + renderPanel() + '</div></section></div>';
      try { if (FW.scrollY !== y) FW.scrollTo(0, y); } catch (e) {}
      setTimeout(function () { S.frais.clear(); }, 7000);
    }

    // ── Panneau latéral : la fiche du lead ────────────────────────────────
    function itemConnu(sf) {
      return S.piscine.concat(S.rappels, S.transferts, S.stockListe || []).find(function (x) { return x.sf_lead_id === sf; }) || null;
    }
    // Icônes des canaux : celles de la fiche client (fiche-shell), à l'identique.
    var IC = {
      phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
      wa: '<path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.3A9 9 0 1 0 12 3z"/><path d="M8.5 8.8c.2-.5.4-.5.6-.5h.5c.2 0 .4 0 .6.4l.7 1.6c0 .2.1.3 0 .5l-.4.5c-.1.2-.2.3 0 .5.6 1 1.4 1.6 2.3 2 .2.1.4.1.5 0l.5-.6c.1-.2.3-.2.5-.1l1.5.7c.2.1.3.2.3.4 0 .5-.7 1.3-1.2 1.4-1.3.2-2.9-.7-4-1.7-.8-.8-1.6-1.9-1.7-3 0-.4 0-.8.2-1z" fill="currentColor" stroke="none"/>',
      mail: '<rect x="2.5" y="4.5" width="19" height="15" rx="2"/><path d="m3 6 9 6.5L21 6"/>',
      sms: '<path d="M4 4.5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H8l-4 3.5v-3.5H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1z"/>'
    };
    function svgIc(p) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>'; }
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
      if (!f) { $drawer.innerHTML = '<header class="dr-h"><div><h2>Chargement…</h2></div><button type="button" class="x" data-a="close" aria-label="Fermer"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></header>'; return; }
      var it = itemConnu(D.sf) || {};
      var l = Object.assign({}, it, f);
      l.source_libelle = it.source_libelle || f.source_bacs; l.sla_min = it.sla_min || 120;
      var mien = estMien(l), libre = verrouLibre(l);
      var actif = ['A affecter', 'Nouveau', 'Accepté', 'Injoignable temporairement', 'Projet Long Terme', 'Interesse', 'Intéressé'].indexOf(l.statut_eff) !== -1;
      var fb = f.fiche_bacs || {};
      var h = '<header class="dr-h"><div><div class="tags" style="margin:0 0 6px">' + tagsLead(l).replace(/<span class="tag">BACS : [^<]*<\/span>/, '')
        + '<span class="tag ' + (l.statut_eff === 'Qualifié' ? 'ok' : l.statut_eff === 'Abandonned' ? 'crit' : '') + '">' + esc(libStatut(l.statut_eff)) + '</span></div>'
        + '<h2>' + esc(nomLead(l)) + '</h2><p class="dr-s">' + esc([l.ville, l.site ? 'site BACS : ' + siteNom(l.site) : null].filter(Boolean).join(' · ')) + '</p></div>'
        + '<button type="button" class="x" data-a="close" aria-label="Fermer"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button></header><div class="dr-b">';
      // Délais
      h += '<section><h3>Délai</h3><div class="delais"><div><span>Depuis la réception BACS</span>' + (actif && l.statut_eff !== 'Accepté' && !l.rappel_le ? tm(l.recu_le, l.sla_min) : '<span class="tm neutre"><b>' + duree(mins(l.recu_le)) + '</b><small>reçu le ' + esc(quand(l.recu_le)) + '</small></span>') + '</div>';
      if (l.rappel_le && actif) { var due = ts(l.rappel_le) - Date.now(); h += '<div><span>Rappel prévu</span><span class="tm ' + (due <= 0 ? 'crit' : 'ok') + '"><b>' + esc(quand(l.rappel_le)) + '</b><small>' + (due <= 0 ? 'retard ' + duree(-due / 60000) : 'dans ' + duree(due / 60000)) + '</small></span></div>'; }
      if (l.transfere_le) h += '<div><span>Sur le site</span>' + (l.od_contact_le ? '<span class="tm ok"><b>' + duree((ts(l.od_contact_le) - ts(l.transfere_le)) / 60000) + '</b><small>avant contact</small></span>' : tm(l.transfere_le, SLA_SITE, 'sans contact · SLA 2 h')) + '</div>';
      if (mien) h += '<div><span>Réservé à votre nom</span><span class="tm ok"><b>jusqu\'à ' + hh(l.verrou_jusqu) + '</b><small>prolongé tant que la fiche est ouverte</small></span></div>';
      h += '</div></section>';
      // Contact
      h += '<section><h3>Contact</h3>' + (l.telephone ? '<div class="tel"><b>' + esc(telAff(l.telephone)) + '</b><button type="button" class="btn sm" data-a="copier" data-id="' + esc(telAff(l.telephone)) + '">Copier</button></div>' : '<p class="hint">Aucun numéro dans BACS.</p>')
        + (l.email ? '<p class="mail">' + esc(l.email) + '</p>' : '')
        + '<div class="canaux">' + [['Appeler', 'appel', 'call', IC.phone], ['WhatsApp', 'wa', 'wa', IC.wa], ['Email', 'mail', 'mail', IC.mail], ['SMS', 'sms', 'sms', IC.sms]].map(function (c) {
            return '<button type="button" class="fs-btn ' + c[2] + '" data-a="canal" data-id="' + c[1] + '"' + ((c[1] === 'mail' ? !l.email : !l.telephone) ? ' disabled' : '') + '>' + svgIc(c[3]) + c[0] + '</button>'; }).join('') + '</div></section>';
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
      h += sectionBacs();
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
        h += '<div class="row"><button type="button" class="btn pri" data-a="prendre" data-id="' + esc(l.sf_lead_id) + '"' + dis() + '>Prendre ce lead</button><span class="hint">Il sera réservé à votre nom ' + ((S.kpis || {}).verrou_minutes || 5) + ' min.</span></div>';
      } else {
        var issue = D.issue || 'qualifier';
        var ISSUES = [['qualifier', 'Qualifié'], ['injoignable', 'Injoignable'], ['long_terme', 'Projet long terme'], ['abandon', 'Abandonner']];
        h += '<div class="issues" role="radiogroup" aria-label="Issue de l\'appel">' + ISSUES.map(function (x) {
          return '<button type="button" role="radio" aria-checked="' + (x[0] === issue) + '" class="' + (x[0] === issue ? 'on ' + x[0] : '') + '" data-a="issue" data-id="' + x[0] + '">' + x[1] + '</button>';
        }).join('') + '</div><div class="row">';
        if (issue === 'qualifier') {
          var cible = (D.sites || []).find(function (s) { return Number(s.id_site) === Number(D.site); });
          h += cible ? '<button type="button" class="btn vr" data-a="qualifier"' + dis() + '>Transférer à ' + esc(siteNom(cible.site)) + '</button><span class="hint">avec la qualification ci-dessus</span>'
                     : '<button type="button" class="btn vr" disabled>Transférer</button><span class="hint">Choisissez d\'abord le site, plus haut.</span>';
        } else if (issue === 'injoignable') {
          h += '<select id="r-quand" aria-label="Quand rappeler"><option value="2h">Dans 2 h</option><option value="demain">Demain 9 h</option><option value="apres">Après-demain 9 h</option><option value="autre">Autre date…</option></select>'
            + '<input type="datetime-local" id="r-date" value="' + dateLocale(new Date(Date.now() + 2 * 3600000)) + '" hidden>'
            + '<button type="button" class="btn pri" data-a="injoignable"' + dis() + '>Programmer le rappel</button>';
        } else if (issue === 'long_terme') {
          h += '<label class="hint" for="lt-date">Rappeler le</label><input type="date" id="lt-date" value="' + dateLocale(demainA(9, 30)).slice(0, 10) + '">'
            + '<button type="button" class="btn pri" data-a="long-terme"' + dis() + '>Programmer</button>';
        } else {
          h += '<select id="a-motif" aria-label="Motif d\'abandon BACS">' + MOTIFS_ABANDON.map(function (m) { return '<option>' + esc(m) + '</option>'; }).join('') + '</select>'
            + '<button type="button" class="btn dang" data-a="abandonner"' + dis() + '>Abandonner</button>';
        }
        h += '</div><div class="row pied"><span class="hint">' + (bloque() ? 'Bloqué : ouvrez BACS dans un onglet et connectez-vous.' : ecritBacs() ? 'Le geste est reporté automatiquement dans BACS.' : 'Reportez aussi le statut dans BACS : l\'écriture automatique n\'est pas activée.') + '</span>'
          + '<button type="button" class="btn sm ghost" data-a="liberer">Libérer</button></div>';
      }
      h += '</footer>';
      var sc = $drawer.querySelector('.dr-b'); var top = sc ? sc.scrollTop : 0;
      $drawer.innerHTML = h;
      var sc2 = $drawer.querySelector('.dr-b'); if (sc2) sc2.scrollTop = top;
    }

    // Ce que One Data a envoyé à BACS pour ce lead, et ce qu'il en est advenu.
    function sectionBacs() {
      var D = S.dr; if (!D || !D.envois || !D.envois.length) return '';
      var ech = false;
      var lis = D.envois.map(function (e) {
        var st = e.statut === 'fait' ? '<span class="tag ok">Fait à ' + esc(quand(e.fait_le)) + '</span>'
          : e.statut === 'echec' ? (ech = true, '<span class="tag crit">Échec</span>')
          : '<span class="tag warn">En attente</span>';
        return '<li><div><b>' + esc(e.resume || e.geste) + '</b><small>déposé ' + esc(quand(e.cree_le)) + (e.tentatives > 1 ? ' · ' + e.tentatives + ' essais' : '') + '</small>'
          + (e.statut === 'echec' && e.erreur ? '<small class="err">' + esc(e.erreur) + '</small>' : '') + '</div>' + st + '</li>';
      }).join('');
      return '<section><h3>Dans BACS</h3><ul class="env">' + lis + '</ul>'
        + (ech ? '<div class="row"><button type="button" class="btn" data-a="bacs-relancer"' + dis() + '>Relancer l\'envoi</button><span class="hint">Les gestes en échec repartent pour cinq essais.</span></div>' : '')
        + '</section>';
    }
    async function chargerEnvois() {
      var D = S.dr; if (!D) return;
      try { D.envois = await rpc('plateau_bacs_envois', { p_sf_lead_id: D.sf }) || []; } catch (e) { D.envois = []; }
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
      await chargerEnvois();
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
        if (r && r.action === 'reserve') { reveillerBacs(); await ouvrir(sf); rafraichir(true); return; }
        if (r && r.action === 'occupe') { toast('Déjà pris par ' + propre(r.par_nom || 'un collègue') + '.', true); }
        else if (r && r.action === 'clos') toast('Ce lead est déjà traité (' + libStatut(r.statut) + ').', true);
        else toast('Lead introuvable dans la copie BACS.', true);
        rafraichir(true);
      });
    }
    function apresGeste(msg) { reveillerBacs(); toast(msg); fermerDrawer(true); rafraichir(true); }
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
      if (GESTES_BACS.indexOf(a) !== -1 && bloque()) {
        toast('BACS n\'est ouvert sur aucun poste : ouvrez-le dans un onglet et connectez-vous.', true); return;
      }
      switch (a) {
        case 'bacs-relancer':
          return geste(async function () {
            var r = await rpc('plateau_bacs_relancer', { p_sf_lead_id: S.dr.sf });
            reveillerBacs(); toast(plural((r && r.relances) || 0, 'envoi relancé', 'envois relancés'));
            await chargerEnvois(); renderDrawerPreserve(); rafraichirBacs().then(render);
          });
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
          if (S.stock && !S.stockListe) { try { S.stockListe = await rpc('plateau_file', { p_vue: 'stock' }); } catch (e) { toast(messageErreur(e), true); S.stockListe = []; } render(); }
          return;
        case 'source': {
          var src = (S.kpis && S.kpis.sources) || [];
          var actives = S.sources || src.filter(function (x) { return x.suivi; }).map(function (x) { return x.code; });
          S.sources = actives.indexOf(id) !== -1 ? actives.filter(function (c) { return c !== id; }) : actives.concat([id]);
          S.tab = 'piscine'; S.stock = false;
          return geste(async function () {
            S.piscine = await rpc('plateau_file', { p_vue: 'piscine', p_sources: sourcesArg() }) || [];
            render();
          });
        }
        case 'campagne':
          S.campagne = id || null;
          if (S.campagne) {
            var c = (S.campagnes || []).find(function (x) { return x.campagne === S.campagne; }) || {};
            S.stock = false;
            S.tab = (Number(c.a_prendre) + Number(c.acceptes)) > 0 ? 'piscine' : Number(c.rappels) > 0 ? 'rappels' : 'transferts';
          }
          render(); return;
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
      rafraichirBacs().then(function (change) {
        if (change && S.dr && S.dr.fiche) renderDrawerPreserve();
      });
      var act = doc.activeElement;
      if (act && root.contains(act) && /INPUT|SELECT|TEXTAREA/.test(act.tagName)) return;
      render();
    }, 15000);

    await rafraichir();
  }

  // ==========================================================================
  //  CHARTE ONE DATA
  // ==========================================================================
  function injecterCss(doc) {
    if (doc.getElementById('lmtc-css')) return;
    if (!doc.getElementById('lmtc-font')) {
      var f = doc.createElement('link'); f.id = 'lmtc-font'; f.rel = 'stylesheet';
      f.href = 'https://fonts.googleapis.com/css2?family=Nunito+Sans:opsz,wght@6..12,400;6..12,500;6..12,600;6..12,700;6..12,800&display=swap';
      (doc.head || doc.documentElement).appendChild(f);
    }
    var st = doc.createElement('style'); st.id = 'lmtc-css';
    st.textContent = `
/* Charte One Data — reprise des modules Notifications, Fiche client et Tableau de bord.
   Une seule police (Nunito Sans), chiffres en tabulaire ; texte bleu nuit, jamais de noir. */
.lmtc{--bleu:#2a5ea9;--bleu-dk:#1F4A85;--bleu-clair:#acc5e4;--vert:#53bda7;--vert-dk:#46a892;--m-vert:#00997f;
  --orange:#fac055;--m-orange:#d2941f;--rouge:#d97070;--m-rouge:#c0524f;
  --ground:#f4f7fb;--card:#fff;--line:#e3e9f3;--line-2:#cfd9e9;--line-in:#e2eaf5;
  --ink:#1c2b45;--ink-2:#5a6b86;--ink-3:#8b99b0;--mut:#7a98c5;--lbl:#9bb3d1;
  --ok-bg:#e4f4f0;--alerte-bg:#fdf3de;--chaud-bg:#fbeceb;--calme-bg:#eef2f8;--hov:#f2f6fc;--sel:#eef4fc;
  --ombre:0 1px 2px rgba(28,43,69,.05),0 8px 24px rgba(28,43,69,.06);
  --ui:"Nunito Sans",system-ui,-apple-system,"Segoe UI",sans-serif;
  font-family:var(--ui);font-size:14px;line-height:1.45;color:var(--ink);-webkit-font-smoothing:antialiased}
.lmtc:not(.lmtc-ov){display:block;width:100%;max-width:1320px;margin:0 auto;padding:20px 16px 56px;box-sizing:border-box;background:var(--ground)}
.lmtc *{box-sizing:border-box}
.lmtc [hidden]{display:none!important}
.lmtc button{font:inherit}
.lmtc h2,.lmtc h3{margin:0;text-wrap:balance}
.lmtc p{margin:0}
.lmtc .num{font-variant-numeric:tabular-nums}
.lmtc.busy{cursor:progress}

/* Situation */
.lmtc .situ{display:grid;gap:12px;margin-bottom:16px}
.lmtc .situ-l{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-3)}
.lmtc .situ-l .vr{color:var(--bleu);font-weight:800}
.lmtc .lien{border:0;background:none;padding:0;color:var(--bleu);font-weight:800;text-transform:none;letter-spacing:0;cursor:pointer;text-decoration:underline}
.lmtc .situ-t{font-size:clamp(17px,2.1vw,20px);font-weight:700;line-height:1.4;max-width:74ch;color:var(--ink)}
.lmtc .situ-t b{font-weight:800}
.lmtc .t-crit{color:var(--m-rouge)} .lmtc .t-warn{color:var(--m-orange)} .lmtc .t-ok{color:var(--m-vert)}
.lmtc .t-acc,.lmtc .t-vr{color:var(--bleu)} .lmtc .t-mut{color:var(--ink-3);font-weight:700}
.lmtc .kpis{display:flex;flex-wrap:wrap;gap:10px 28px}
.lmtc .k{display:grid;gap:2px}
.lmtc .k > span{font-size:10px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-3)}
.lmtc .k b{font-size:18px;font-weight:800;color:var(--ink);font-variant-numeric:tabular-nums;line-height:1.2}
.lmtc .k b .txt{font-size:15px;font-weight:800}

/* Bandeaux */
.lmtc .bd{display:flex;flex-wrap:wrap;gap:4px 10px;align-items:baseline;border-radius:12px;padding:11px 14px;margin-bottom:12px;font-size:13px;border:1.5px solid}
.lmtc .bd b{font-weight:800}
.lmtc .bd.crit{background:var(--chaud-bg);border-color:#f2c4c4;color:#a32d2d}
.lmtc .bd.warn{background:var(--alerte-bg);border-color:#f0d9a0;color:#8a6d1f}
.lmtc .bd.info{background:var(--sel);border-color:var(--bleu-clair);color:var(--bleu-dk)}
.lmtc .alerte{background:var(--alerte-bg);border:1.5px solid #f0d9a0;color:#8a6d1f;border-radius:12px;padding:10px 14px;font-size:13px;font-weight:700;margin-bottom:12px}

/* Poste : signaux à gauche, actions à droite */
.lmtc .poste{display:grid;grid-template-columns:minmax(0,340px) minmax(0,1fr);gap:16px;align-items:start}
@media (max-width:940px){.lmtc .poste{grid-template-columns:minmax(0,1fr)}}
.lmtc .sig,.lmtc .act{background:var(--card);border:1px solid var(--line);border-radius:14px;box-shadow:var(--ombre);min-width:0}
@media (min-width:941px){.lmtc .sig{position:sticky;top:12px;max-height:calc(100vh - 24px);overflow:auto}}
.lmtc .zh{padding:15px 16px 11px;display:grid;gap:3px}
.lmtc .zh h2{font-size:15px;font-weight:800;color:var(--bleu-dk);display:flex;align-items:center;gap:8px}
.lmtc .zh p{font-size:12.5px;color:var(--mut);font-weight:600}
.lmtc .cnt{font-size:11px;font-weight:700;background:var(--line);color:var(--ink-2);border-radius:9px;padding:1px 7px;min-width:20px;text-align:center;font-variant-numeric:tabular-nums}
.lmtc .sg{display:grid;grid-template-columns:10px minmax(0,1fr);gap:11px;padding:12px 16px;border-top:1px solid var(--line)}
.lmtc .sg-m{width:10px;height:10px;border-radius:3px;margin-top:5px;background:var(--bleu-clair)}
.lmtc .sg.crit .sg-m{background:var(--m-rouge)} .lmtc .sg.warn .sg-m{background:var(--m-orange)}
.lmtc .sg.new .sg-m{background:var(--m-vert)} .lmtc .sg.vr .sg-m{background:var(--bleu)}
.lmtc .sg.fresh .sg-m{animation:lmtc-pulse 1.6s ease-out 4}
@keyframes lmtc-pulse{0%{box-shadow:0 0 0 0 rgba(42,94,169,.45)}100%{box-shadow:0 0 0 9px rgba(42,94,169,0)}}
.lmtc .sg-top{display:flex;justify-content:space-between;gap:8px;align-items:baseline}
.lmtc .sg-k{font-size:10px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-3)}
.lmtc .sg.crit .sg-k{color:var(--m-rouge)} .lmtc .sg.warn .sg-k{color:var(--m-orange)}
.lmtc .sg.new .sg-k{color:var(--m-vert)} .lmtc .sg.vr .sg-k{color:var(--bleu)}
.lmtc .sg-h{font-size:11px;color:var(--ink-3);white-space:nowrap;font-variant-numeric:tabular-nums}
.lmtc .sg-t{font-weight:800;margin-top:2px;color:var(--ink)}
.lmtc .sg-d{font-size:12.5px;color:var(--ink-2);margin-top:2px}
.lmtc .sg-a{display:flex;flex-wrap:wrap;gap:6px;margin-top:9px}
.lmtc .sig-empty{padding:18px 16px;border-top:1px solid var(--line);font-size:12.5px;color:var(--mut);font-weight:600}

/* Onglets : sélecteur segmenté One Data */
.lmtc .tabs{display:flex;flex-wrap:wrap;gap:3px;background:var(--calme-bg);border-radius:11px;padding:3px;margin:12px 12px 0}
.lmtc .tabs button{border:0;background:none;padding:8px 14px;border-radius:8px;font-size:13px;font-weight:700;color:var(--ink-2);cursor:pointer;display:inline-flex;align-items:center;gap:7px}
.lmtc .tabs button.on{background:var(--card);color:var(--ink);box-shadow:0 1px 2px rgba(28,43,69,.08)}
.lmtc .tabs button.on .cnt{background:var(--bleu);color:#fff}
.lmtc .tabs .cnt.z{background:var(--line);color:var(--ink-3)}
.lmtc .tabs .cnt.c,.lmtc .tabs button.on .cnt.c{background:var(--m-rouge);color:#fff}
.lmtc .panel{padding:16px 18px 20px;min-width:0}
.lmtc .ph{display:flex;flex-wrap:wrap;justify-content:space-between;align-items:flex-end;gap:10px 16px;margin-bottom:12px}
.lmtc .ph h2{font-size:16px;font-weight:800;color:var(--bleu-dk)}
.lmtc .ph p{font-size:12.5px;color:var(--mut);font-weight:600;max-width:70ch;margin-top:2px}
.lmtc .ph-r{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.lmtc .barre{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;margin-bottom:10px}

/* Boutons */
.lmtc .btn{display:inline-flex;align-items:center;justify-content:center;gap:6px;font-size:12.5px;font-weight:700;border-radius:9px;padding:8px 13px;cursor:pointer;border:1px solid var(--line-2);background:var(--card);color:var(--ink-2);white-space:nowrap;line-height:1.2;transition:background .15s,border-color .15s,color .15s}
.lmtc .btn:hover{border-color:var(--bleu-clair);color:var(--bleu)}
.lmtc .btn.pri{background:var(--bleu);border-color:var(--bleu);color:#fff}
.lmtc .btn.pri:hover{background:#24528f;border-color:#24528f;color:#fff}
.lmtc .btn.vr{background:var(--vert);border-color:var(--vert);color:#fff;font-weight:800}
.lmtc .btn.vr:hover{background:var(--vert-dk);border-color:var(--vert-dk);color:#fff}
.lmtc .btn.ghost{background:none;border-color:transparent;color:var(--ink-3);font-weight:600}
.lmtc .btn.ghost:hover{color:var(--ink-2)}
.lmtc .btn.dang{color:var(--m-rouge);border-color:#f2c4c4}
.lmtc .btn.dang:hover{background:#fdf1f1;color:var(--m-rouge)}
.lmtc .btn.sm{padding:6px 10px;font-size:12px}
.lmtc .btn[disabled]{opacity:.5;cursor:not-allowed}
.lmtc.busy .btn,.lmtc-ov.busy .btn{pointer-events:none;opacity:.7}
.lmtc :is(.btn,.tabs button,.lr,.chip span,.seg button,.fchip,.fs-btn,.issues button,.x):focus-visible{outline:2px solid var(--bleu);outline-offset:2px}

/* Champs */
.lmtc select,.lmtc input[type=text],.lmtc input[type=date],.lmtc input[type=datetime-local],.lmtc textarea{font:inherit;font-size:13px;font-weight:600;color:var(--bleu-dk);background:#fff;border:1.5px solid var(--line-in);border-radius:9px;padding:8px 11px;min-width:0;outline:none}
.lmtc select:focus,.lmtc input:focus,.lmtc textarea:focus{border-color:var(--bleu)}
.lmtc textarea{width:100%;min-height:64px;resize:vertical;font-weight:500}

/* Étiquettes */
.lmtc .tag{display:inline-flex;align-items:center;font-size:11.5px;font-weight:600;border-radius:8px;padding:3px 9px;background:var(--calme-bg);color:var(--ink-2);white-space:nowrap;max-width:100%;overflow:hidden;text-overflow:ellipsis}
.lmtc .tag.camp{background:var(--sel);color:var(--bleu)}
.lmtc .tag.vr{background:var(--sel);color:var(--bleu-dk);font-weight:700}
.lmtc .tag.ok{background:var(--ok-bg);color:var(--m-vert);font-weight:700}
.lmtc .tag.crit{background:var(--chaud-bg);color:var(--m-rouge);font-weight:700}
.lmtc .tag.warn{background:var(--alerte-bg);color:var(--m-orange);font-weight:700}
.lmtc .tags{display:flex;flex-wrap:wrap;gap:5px;margin-top:6px}

/* Minuteurs */
.lmtc .tm{display:inline-grid;gap:3px;justify-items:start}
.lmtc .tm b{font-weight:800;font-size:13.5px;padding:3px 9px;border-radius:8px;background:var(--ok-bg);color:var(--m-vert);white-space:nowrap;font-variant-numeric:tabular-nums}
.lmtc .tm.warn b{background:var(--alerte-bg);color:var(--m-orange)}
.lmtc .tm.crit b{background:var(--chaud-bg);color:var(--m-rouge)}
.lmtc .tm.neutre b{background:var(--calme-bg);color:var(--ink-2)}
.lmtc .tm small{font-size:10.5px;color:var(--ink-3);font-weight:600;white-space:nowrap}

/* Lignes de lead */
.lmtc .list{display:grid}
.lmtc .lr{display:grid;grid-template-columns:112px minmax(0,1fr) auto;gap:14px;align-items:center;padding:12px 8px;border-top:1px solid var(--line);cursor:pointer;border-radius:10px}
.lmtc .lr:hover{background:var(--hov)}
.lmtc .lr.resa{opacity:.6}
.lmtc .lr-n{font-weight:800;color:var(--ink)}
.lmtc .lr-v{color:var(--mut);font-size:12.5px;font-weight:600}
.lmtc .lr-d{font-size:13px;margin-top:1px;color:var(--ink-2)}
.lmtc .lr-a{display:flex;flex-wrap:wrap;gap:6px;justify-content:flex-end;align-items:center}
.lmtc .resa-l{font-size:12px;color:var(--mut);font-weight:600;text-align:right}
@media (max-width:600px){.lmtc .lr{grid-template-columns:minmax(0,1fr)}.lmtc .lr-a{justify-content:flex-start}.lmtc .resa-l{text-align:left}}
.lmtc .empty{padding:20px 8px;border-top:1px solid var(--line);color:var(--mut);font-size:13px;font-weight:600}

/* Sélecteurs */
.lmtc .seg{display:inline-flex;border:1.5px solid var(--line-in);border-radius:10px;overflow:hidden;background:#fff}
.lmtc .seg button{border:0;background:#fff;padding:7px 12px;font-size:12px;font-weight:700;color:var(--mut);cursor:pointer}
.lmtc .seg button:not(:last-child){border-right:1.5px solid var(--line-in)}
.lmtc .seg button.on{background:var(--bleu);color:#fff}
.lmtc .seg .num{font-size:11px;margin-left:4px;opacity:.8}
.lmtc .filtres{display:flex;flex-wrap:wrap;gap:6px}
.lmtc .fchip{font-size:12.5px;font-weight:600;padding:6px 12px;border-radius:9px;border:1px solid var(--line);background:var(--card);color:var(--ink-2);cursor:pointer}
.lmtc .fchip.on{background:var(--calme-bg);color:var(--bleu);border-color:var(--bleu-clair)}
.lmtc .fchip .num{font-size:11px;margin-left:4px;font-weight:700}

/* Campagnes */
.lmtc .scroll{overflow-x:auto}
.lmtc table{border-collapse:separate;border-spacing:0;width:100%}
.lmtc th{font-size:9.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-3);text-align:center;padding:9px 6px;background:var(--calme-bg);white-space:nowrap}
.lmtc th:first-child{border-radius:9px 0 0 9px} .lmtc th:last-child{border-radius:0 9px 9px 0}
.lmtc th:first-child,.lmtc td:first-child{text-align:left}
.lmtc td{border-top:1px solid var(--line);padding:8px 6px;text-align:center;vertical-align:middle;font-variant-numeric:tabular-nums;color:var(--ink)}
.lmtc tbody tr:first-child td{border-top:0}
.lmtc .camp-t{min-width:600px}
.lmtc .camp-t th{white-space:normal;line-height:1.25;vertical-align:bottom;padding:9px 4px}
.lmtc .camp-t td{padding:8px 4px;font-size:13px}
.lmtc .camp-t td.l{font-weight:700;min-width:180px;max-width:260px}
.lmtc .camp-t td.l small{display:block;font-weight:600;color:var(--mut);font-size:11.5px}
.lmtc .camp-t td.act-c{text-align:right;padding-right:0;white-space:nowrap}
.lmtc .camp-t tr.actif td{background:var(--sel)}
.lmtc .camp-t tr.actif td:first-child{box-shadow:inset 3px 0 0 var(--bleu)}
.lmtc .prog{display:inline-grid;gap:4px;justify-items:center}
.lmtc .bar{width:56px;height:5px;border-radius:3px;background:var(--line);overflow:hidden}
.lmtc .bar i{display:block;height:100%;background:var(--bleu)}
.lmtc .bar.low i{background:var(--rouge)}
.lmtc .na{color:var(--ink-3);font-size:12px}
.lmtc .foot{font-size:12px;color:var(--mut);font-weight:600;margin-top:10px;max-width:84ch}
.lmtc .filtre-actif{display:flex;flex-wrap:wrap;align-items:center;gap:6px 14px;padding:9px 12px;margin:10px 12px 0;background:var(--sel);border:1px solid var(--bleu-clair);border-radius:10px;font-size:13px;color:var(--bleu-dk)}
.lmtc .filtre-actif b{font-weight:800;margin-right:4px}
.lmtc .filtre-actif .fa-n{font-size:12px;color:var(--mut);font-weight:700;font-variant-numeric:tabular-nums}
.lmtc .filtre-actif .btn{margin-left:auto}

/* Panneau latéral */
.lmtc-ov .scrim{position:fixed;inset:0;background:rgba(42,94,169,.18);z-index:9990}
.lmtc-ov .drawer{position:fixed;top:0;right:0;bottom:0;width:min(540px,100%);background:#fff;z-index:9991;box-shadow:0 16px 50px rgba(42,94,169,.22);display:flex;flex-direction:column;border-radius:16px 0 0 16px;padding-top:env(safe-area-inset-top,0px);padding-bottom:env(safe-area-inset-bottom,0px)}
.lmtc-ov .dr-h{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:16px 18px 12px;border-bottom:1.5px solid #eef2f8}
.lmtc-ov .dr-h h2{font-size:20px;font-weight:800;letter-spacing:-.01em;color:var(--bleu-dk)}
.lmtc-ov .dr-s{font-size:12.5px;color:var(--mut);font-weight:600;margin-top:2px}
.lmtc-ov .x{flex:none;width:30px;height:30px;padding:0;border:0;background:var(--hov);border-radius:8px;color:#5a7196;cursor:pointer;display:inline-flex;align-items:center;justify-content:center}
.lmtc-ov .x svg{width:14px;height:14px;display:block;fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round}
.lmtc-ov .x:hover{background:#e6eef8;color:var(--bleu-dk)}
.lmtc-ov .dr-b{flex:1;overflow:auto;padding:4px 18px 18px;display:grid;align-content:start}
.lmtc-ov .dr-b section{padding:14px 0;border-bottom:1.5px solid #eef2f8;display:grid;gap:8px}
.lmtc-ov .dr-b section:last-child{border-bottom:0}
.lmtc-ov .dr-b h3{font-size:10px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--lbl)}
.lmtc-ov .dl{display:grid;grid-template-columns:max-content minmax(0,1fr);gap:5px 14px;font-size:13px;margin:0}
.lmtc-ov .dl dt{color:var(--ink-3);font-weight:600}
.lmtc-ov .dl dd{margin:0;font-weight:700;color:var(--ink)}
.lmtc-ov .tel{display:flex;flex-wrap:wrap;gap:10px;align-items:center}
.lmtc-ov .tel b{font-size:17px;font-weight:800;color:var(--bleu-dk);font-variant-numeric:tabular-nums;user-select:all}
.lmtc-ov .mail{font-size:13px;color:var(--mut);font-weight:600;word-break:break-all}
.lmtc-ov .quote{font-size:13px;color:var(--ink-2);border-left:2px solid var(--line-2);padding-left:10px;white-space:pre-line;font-style:italic}
/* Boutons de canal : ceux de la fiche client */
.lmtc-ov .canaux{display:flex;flex-wrap:wrap;gap:8px}
.lmtc-ov .fs-btn{display:inline-flex;align-items:center;gap:8px;border:1.5px solid #e8eef7;background:#fff;border-radius:10px;padding:8px 14px;font-size:13.5px;font-weight:700;cursor:pointer;transition:background .15s;color:var(--bleu-dk)}
.lmtc-ov .fs-btn svg{width:17px;height:17px}
.lmtc-ov .fs-btn[disabled]{opacity:.45;cursor:not-allowed}
.lmtc-ov .fs-btn.call{color:var(--bleu);border-color:#c9d9ee}.lmtc-ov .fs-btn.call:hover{background:var(--sel)}
.lmtc-ov .fs-btn.wa{color:#1f9d63;border-color:#bfe6cf}.lmtc-ov .fs-btn.wa:hover{background:#eafaf1}
.lmtc-ov .fs-btn.mail{color:var(--bleu-dk);border-color:#d7dfe9}.lmtc-ov .fs-btn.mail:hover{background:#f2f5f9}
.lmtc-ov .fs-btn.sms{color:#e6a817;border-color:#f0dca6}.lmtc-ov .fs-btn.sms:hover{background:#fdf7e8}
.lmtc-ov .delais{display:flex;flex-wrap:wrap;gap:14px 24px}
.lmtc-ov .delais > div{display:grid;gap:4px}
.lmtc-ov .delais > div > span:first-child{font-size:11.5px;color:var(--ink-3);font-weight:700}
.lmtc-ov .tl{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.lmtc-ov .tl li{display:grid;grid-template-columns:86px minmax(0,1fr);gap:10px;font-size:12.5px;color:var(--ink-2)}
.lmtc-ov .tl li b{font-weight:600;color:var(--ink-3);font-size:11.5px;font-variant-numeric:tabular-nums}
.lmtc-ov .tl li.v span{color:var(--bleu);font-weight:700}
.lmtc-ov .env{list-style:none;margin:0;padding:0;display:grid;gap:8px}
.lmtc-ov .env li{display:flex;justify-content:space-between;align-items:flex-start;gap:10px;background:#f7f9fc;border:1.5px solid var(--line-in);border-radius:10px;padding:9px 11px}
.lmtc-ov .env b{display:block;font-size:13px;font-weight:700;color:var(--bleu-dk)}
.lmtc-ov .env small{display:block;font-size:11.5px;color:var(--mut);font-weight:600;margin-top:2px}
.lmtc-ov .env small.err{color:#a32d2d}
.lmtc-ov .dr-f{border-top:1.5px solid #eef2f8;padding:14px 18px;display:grid;gap:10px;background:#fff;border-radius:0 0 0 16px}
.lmtc-ov .dr-f .row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.lmtc-ov .dr-f .row.pied{justify-content:space-between;flex-wrap:nowrap}
.lmtc-ov .dr-f .row.pied .hint{flex:1}
.lmtc-ov .hint{font-size:11.5px;color:var(--mut);font-weight:600;line-height:1.5}
.lmtc-ov .issues{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));border:1.5px solid var(--line-in);border-radius:10px;overflow:hidden}
.lmtc-ov .issues button{border:0;background:#fff;padding:9px 6px;font-size:12px;font-weight:700;color:var(--mut);cursor:pointer;transition:all .12s}
.lmtc-ov .issues button:not(:last-child){border-right:1.5px solid var(--line-in)}
.lmtc-ov .issues button.on{background:var(--bleu);color:#fff}
@media (max-width:420px){.lmtc-ov .issues{grid-template-columns:repeat(2,minmax(0,1fr))}}
.lmtc-ov .qf{display:grid;gap:11px}
.lmtc-ov .q{display:grid;gap:6px}
.lmtc-ov .q > span{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:var(--lbl)}
.lmtc-ov .vend{margin-top:6px}
.lmtc-ov .chips{display:flex;flex-wrap:wrap;gap:6px}
.lmtc-ov .chip{position:relative}
.lmtc-ov .chip input{position:absolute;opacity:0;width:1px;height:1px}
.lmtc-ov .chip span{display:inline-block;border:1.5px solid var(--line-in);background:#fff;color:var(--bleu);border-radius:8px;padding:7px 12px;font-size:12px;font-weight:700;cursor:pointer}
.lmtc-ov .chip input:checked + span{background:var(--bleu);border-color:var(--bleu);color:#fff}
.lmtc-ov .chip input:focus-visible + span{outline:2px solid var(--bleu);outline-offset:2px}
.lmtc-ov .sites{display:grid;gap:6px}
.lmtc-ov .site-o{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:10px;align-items:center;border:1.5px solid var(--line-in);border-radius:10px;padding:10px 12px;cursor:pointer;background:#fff;transition:border-color .12s}
.lmtc-ov .site-o:hover{border-color:var(--bleu-clair)}
.lmtc-ov .site-o:has(input:checked){border-color:var(--bleu);background:var(--sel);box-shadow:inset 0 0 0 1px var(--bleu)}
.lmtc-ov .site-o b{font-weight:800;color:var(--bleu-dk)}
.lmtc-ov .site-o small{display:block;color:var(--mut);font-size:11.5px;font-weight:600}
.lmtc-ov .site-o input{accent-color:var(--bleu)}
.lmtc-ov .site-o em{font-style:normal;font-size:12px;font-weight:700;color:var(--ink-3);font-variant-numeric:tabular-nums}
.lmtc-ov .toast{position:fixed;left:50%;bottom:calc(18px + env(safe-area-inset-bottom,0px));transform:translate(-50%,20px);background:var(--bleu-dk);color:#fff;padding:11px 18px;border-radius:10px;font-weight:700;font-size:13px;box-shadow:0 10px 30px rgba(42,94,169,.28);opacity:0;pointer-events:none;transition:opacity .2s,transform .2s;z-index:9999;max-width:calc(100% - 32px)}
.lmtc-ov .toast.err{background:var(--m-rouge)}
.lmtc-ov .toast.on{opacity:1;transform:translate(-50%,0)}
@media (prefers-reduced-motion:reduce){.lmtc *{animation:none!important;transition:none!important}}
`;
    (doc.head || doc.documentElement).appendChild(st);
  }
})();
