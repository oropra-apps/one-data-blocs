// ============================================================================
//  LEAD MANAGEMENT — module One Data (OD.define 'lead-mgmt')
//  VERSION TEAM COLIN (v74) — déploiement CIBLÉ (publish-targets :
//  v74 (28/10/2026) : plateau VROOM, MODE DÉMONSTRATION (bouton dans le
//  bandeau « BACS fermé ») : Prendre / ouvrir un lead montre la fiche comme
//  après la prise, avec qualification, transfert, rappel et abandon, sans
//  rien réserver ni écrire (One Data comme BACS). Pour présenter l'outil.
//  v73 (28/10/2026) : plateau VROOM, bandeau BACS corrigé — ce qui bloque
//  est l'absence de BACS ouvert sur le poste, pas l'identifiant BACS du compte
//  (facultatif : il sert seulement à nommer l'opérateur propriétaire du lead).
//  v72 (28/10/2026) : PLATEAU VROOM revu.
//  * « Prendre le suivant » : le lead FRAIS (moins de 24 h) le plus en
//    retard sur son délai ; plus jamais un lead de trois semaines quand des
//    leads du jour attendent. Pool BACS en trois files : Moins de 24 h (par
//    défaut), Plus de 24 h, Stock accepté. Hors délai = leads frais.
//  * Bandeau BACS réduit à une ligne (« BACS fermé sur ce poste ») ; boutons
//    grisés avec la raison en infobulle.
//  * Onglet « Rappels dus » (compteur = rappels dus, comme l'en-tête), liste
//    triée par échéance. Trafic atelier retiré (pastille et signal).
//  * Une étiquette par lead (campagne, sinon source) ; le site BACS passe
//    à côté du nom. Liseret VN / VO (champ Nature de BACS), filtre VN / VO,
//    sélecteur de période (même calendrier que la gestion des ventes),
//    onglets aux couleurs One Data, demande du client en tête de fiche.
//  v71 (28/10/2026) : onglets dans l'ordre Pool (vert One Data), À rappeler
//  (rouge), Relances et Campagnes (bleu) ; le Pool s'ouvre en premier. Chef :
//  Pool (vert), En souffrance (rouge), Campagnes (bleu). Fiche d'un lead :
//  un seul défilement (le volet entier), plus de zones qui défilent seules.
//  VN / VO distingués comme dans la gestion des ventes,
//  par un liseret à gauche (vert VN, orange VO) sur les lignes, les cartes
//  du Pool et la demande du client ; plus de pastille. Invités au rendez-vous
//  choisis dans le menu de la gestion des ventes (recherche, groupes Chef des ventes
//  / Secrétariat / VN / VO / VN-VO) ; les invités choisis s'affichent en
//  étiquettes retirables. La DEMANDE DU CLIENT (type, véhicule, message) est
//  en tête de la fiche du lead, sous le téléphone, visible sans défiler.
//  v69 (28/10/2026) : invités au rendez-vous = l'équipe du site du lead
//  seulement (lead_invitables), plus tous les utilisateurs.
//  v68 (28/10/2026) : la « Vue vendeur » du chef utilise le même menu de
//  vendeurs que la gestion des ventes (bouton VENDEUR / nom, recherche,
//  groupes VN / VO / VN-VO, le chef en tête = sa propre vue). Les vendeurs
//  grands comptes sont retirés du lead management (en base : équipe, règle
//  d'attribution, Pool).
//  v67 (28/10/2026) : leads segmentés VN / VO (pastille sur chaque lead,
//  filtre Tous / VN / VO ; un vendeur VN ou VO ne voit que son univers dans
//  le Pool, un VNVO voit les deux — filtrage fait en base, poste_site_leads).
//  Période de réception choisie avec le même calendrier que la gestion des
//  ventes (30 derniers jours par défaut). Le chef des ventes peut afficher
//  l'écran d'un de ses vendeurs (aperçu en lecture seule). La confirmation du
//  rendez-vous par SMS est retirée (coût).
//  v66 (28/10/2026) : cartes de l'équipe, badge sous le nom (plus de
//  débordement).
//  v65 (27/10/2026) : nouveau dessin, plus aéré. « En souffrance » est
//  groupé par VENDEUR (une carte par personne : avatar, nom, nombre de leads,
//  ancienneté ; « Le prévenir » = poste_prevenir_vendeur, « Tout
//  réattribuer… » vers un collègue ou le Pool). Pool : une carte par lead,
//  âge en pastille, un seul bouton « Attribuer à Prénom » avec la raison
//  dessous, ▾ pour choisir un autre vendeur. Onglets soulignés.
//  v64 (27/10/2026) : le site choisi dans la barre du haut devient le
//  périmètre de la page (et l'inverse) ; « Bloqués chez un vendeur » devient
//  « En souffrance », et le vendeur qui garde le lead s'affiche en grand sur
//  chaque ligne ; le lien « Analyses détaillées » est retiré (les indicateurs
//  sont dans Leads performances).
//  v63 (27/10/2026) : le lien « Tableaux détaillés » est retiré : il ouvrait
//  l'ancienne version sans chemin de retour. Le mur et le relais restent sous
//  « Analyses détaillées », la règle d'attribution sous « Modifier la règle ».
//  v62 (27/10/2026) : LEAD MANAGEMENT ALLÉGÉ (« simplicité, rapidité,
//  efficacité »). Plus de colonne de signaux ni de bandeau de compteurs :
//  une phrase, un gros bouton « suivant », des filtres-pastilles au-dessus
//  d'UNE liste triée par urgence, un compte à rebours et un seul bouton par
//  ligne. La « piscine » devient le POOL. Vendeur : À rappeler · Relances ·
//  Campagnes · Pool. Chef des ventes et direction : Pool (vendeur suggéré
//  et sa raison, poste_suggestions) · Bloqués chez un vendeur · Campagnes,
//  l'équipe en cartes, la règle d'attribution du site affichée et
//  modifiable ; la direction a le sélecteur de périmètre marque › affaire ›
//  site. Le mur et le relais restent accessibles (« Analyses détaillées »),
//  en attendant leur place dans Performances. Fiche du lead : Appeler, SMS,
//  WhatsApp, E-mail avec des MODÈLES adaptés au lead (pré-remplis dans les
//  modules sms v12, whatsapp v17, email v9) ; rendez-vous avec l'objet BACS,
//  des collègues invités et un commentaire (lead_rdv_creer à 6 paramètres).
//  v61 (25/10/2026) : « Injoignable » — deux cases, comme dans BACS : envoyer
//  l'e-mail au client, envoyer le SMS au client (décochées par défaut). Le
//  geste rejoue le bouton BACS « Injoignable temporairement » : statut, date
//  de rappel, Event de rappel dans l'agenda BACS de l'opérateur, et les
//  messages cochés. Nécessite l'extension utilisateurs v3.1.0.
//  v60 (22/10/2026) : BACS doit être ouvert CHEZ L'UTILISATEUR pour tout geste
//  reporté dans BACS (règle d'Antoine). Plateau : les gestes BACS sont bloqués
//  tant que la session BACS de l'opérateur lui-même ne bat pas (avant : bloqués
//  seulement si aucun poste n'avait BACS ouvert). La base refuse de toute façon
//  le geste (bacs_session_exiger) ; l'écran l'annonce avant. Postes site : un
//  signal prévient quand BACS n'est pas ouvert sur ce poste.
//  v59 (22/10/2026) : le canal « Appeler » n'apparait qu'aux licences Connect
//  et Full (OD.peut('appel'), socle v29) ; ailleurs, les verbes de la file
//  deviennent Prendre, Traiter, Relancer, Ouvrir.
//  v58 (07/10/2026) : le délai de premier contact par site est une MÉDIANE
//  (poste_site_stats, migration 20261007440000). La moyenne affichait
//  « 5 j à Arcueil » pour une médiane de 13 min : un seul lead rappelé au
//  bout de 21 jours. Libellés alignés. Même mesure que l'accueil marketing.
//  lead-mgmt = teamcolin). Le reste de la flotte reste sur la v48.
//
//  Refonte du lead management de Team Colin. Un poste de travail à deux
//  zones, le même pour tous les profils :
//    · à gauche, les SIGNAUX : ce qui arrive, chacun avec son action ;
//    · à droite, les ACTIONS : quelques onglets, chacun répond à une question.
//
//  LES POSTES (v52) :
//    · rôle 10 (opérateur plateau)     : le poste VROOM (piscine BACS, rappels,
//                                         transferts, campagnes BACS) ;
//    · rôle 4  (vendeur)               : À faire · Piscine du site · Mes campagnes ;
//    · rôle 3  (chef des ventes)       : Le mur · À relayer · Campagnes ;
//    · rôles 1, 2, 6, 7, 8 (direction) : Le mur des sites · Le relais · Campagnes,
//                                         et le mur d'un site en l'ouvrant ;
//    · rôles 5 (marketing) et 9 (secrétariat) : la version 48, inchangée.
//  Rôles 1 et 8 : le poste VROOM en aperçu avec #plateau dans l'adresse.
//  Chaque poste garde un lien « Tableaux détaillés » vers la version 48
//  (cycles, kanban, synthèse, règles d'attribution).
//  v53 : un lead s'ouvre directement depuis le tableau de bord (« Ouvrir »)
//  ou par l'adresse (#lead=123) ; « À faire » signale les leads plus anciens
//  que la fenêtre de 30 jours, encore attribués au vendeur.
//  v54 : sur le mur (chef des ventes, direction), un clic sur un chiffre ouvre
//  la liste des leads dans le volet de droite ; une fiche ouverte depuis cette
//  liste y revient par « Retour à la liste ».
//  v55 : visites guidées (« Montre-moi en vrai ») : chaque poste expose
//  window.__lmtcTour (fiche d'exemple où aucun geste n'est enregistré).
//  v56 (07/10/2026, recette A-48) : un lead sans fiche client (identité
//  douteuse en attente d'arbitrage, ou fiche disparue) ne peut plus être
//  marqué « joint » sans client. Le vendeur choisit la fiche parmi celles que
//  propose le résolveur (poste_lead_candidats), ou en crée une
//  (poste_lead_rattacher) : il a le client au téléphone, c'est lui qui
//  tranche. La base refuse aussi « joint » sans fiche.
//
//  DONNÉES : fonctions plateau_* (teamcolin_plateau_vroom.sql,
//  teamcolin_plateau_bacs.sql) et poste_* (teamcolin_poste_site.sql) du
//  tenant Team Colin, plus les fonctions de lead et de campagne existantes.
//
//  ÉCRITURE DANS BACS : chaque geste du plateau part dans la file
//  bacs_sortant, que l'extension applique par la session BACS ouverte.
//  L'opérateur ne touche plus à BACS. Côté site, le rendez-vous, l'attribution,
//  le renvoi vers un autre site, la clôture et le retour au plateau d'un lead
//  BACS sont aussi reportés dans BACS.
//
//  CHARTE : celle de One Data (Nunito Sans seule, bleu #2a5ea9, bleu foncé
//  #1F4A85, vert de validation #53bda7, texte bleu nuit — jamais de noir).
//
//  ⚠️ CE FICHIER EST DÉSORMAIS CELUI DE TEAM COLIN (comme objectifs.js).
//  La version de flotte vit au tag lead-mgmt-v48. Pour la corriger :
//  repartir de `git show lead-mgmt-v48:lead-mgmt.js`, jamais de ce fichier.
//  Retour arrière Team Colin : ré-épingler la v52, la v51 (plateau seul) ou la v48.
// ============================================================================
(function () {
  'use strict';

  // Version d'origine, servie aux rôles qui n'ont pas encore leur poste.
  var LEGACY_URL = 'https://cdn.jsdelivr.net/gh/oropra-apps/one-data-blocs@6383ae37cc242b32685fd155feefae361f23e9f6/lead-mgmt.js';
  var ROLES_PLATEAU = [10];
  var ROLES_APERCU = [1, 8];
  // Rôle → poste des sites. Le marketing (5) a le poste de direction : il
  // traite et transfère les leads de ses réseaux et crée des campagnes comme
  // un directeur de groupe (décision d'Antoine, recette Team Colin 07/10/2026).
  // Le secrétariat (9) garde la version 48 (lead management fermé).
  var POSTE_DU_ROLE = { 4: 'vendeur', 3: 'chef', 1: 'direction', 2: 'direction', 5: 'direction', 6: 'direction', 7: 'direction', 8: 'direction' };

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

  // ── Outils communs aux postes ─────────────────────────────────────────────
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
  // Icônes des canaux : celles de la fiche client (fiche-shell), à l'identique.
  var IC = {
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
    wa: '<path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.3A9 9 0 1 0 12 3z"/><path d="M8.5 8.8c.2-.5.4-.5.6-.5h.5c.2 0 .4 0 .6.4l.7 1.6c0 .2.1.3 0 .5l-.4.5c-.1.2-.2.3 0 .5.6 1 1.4 1.6 2.3 2 .2.1.4.1.5 0l.5-.6c.1-.2.3-.2.5-.1l1.5.7c.2.1.3.2.3.4 0 .5-.7 1.3-1.2 1.4-1.3.2-2.9-.7-4-1.7-.8-.8-1.6-1.9-1.7-3 0-.4 0-.8.2-1z" fill="currentColor" stroke="none"/>',
    mail: '<rect x="2.5" y="4.5" width="19" height="15" rx="2"/><path d="m3 6 9 6.5L21 6"/>',
    sms: '<path d="M4 4.5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H8l-4 3.5v-3.5H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1z"/>',
    fiche: '<rect x="4" y="3" width="16" height="18" rx="2"/><circle cx="12" cy="10" r="3"/><path d="M8 17c.8-1.8 2.2-2.6 4-2.6s3.2.8 4 2.6"/>'
  };
  function svgIc(p) { return '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + p + '</svg>'; }

  // v59 : téléphonie incluse dans les licences Connect et Full (socle v29).
  function __lmPeutAppeler() { return (typeof OD === 'undefined' || typeof OD.peut !== 'function' || OD.peut('appel')); }

  OD.define('lead-mgmt', {
    async mount(el, ctx) {
      var u = await utilisateur(ctx);
      var role = Number(u && u.ID_Role);
      var apercu = ROLES_APERCU.indexOf(role) !== -1 && demandeApercu();
      if (ROLES_PLATEAU.indexOf(role) !== -1 || apercu) {
        return posteVroom(el, ctx, u, { apercu: apercu, role: role });
      }
      var poste = POSTE_DU_ROLE[role];
      if (poste) return posteSite(el, ctx, u, { poste: poste, role: role });
      var legacy = await chargerLegacy();
      return legacy.mount(el, ctx);
    }
  });


  // ==========================================================================
  //  Calendrier de période (même dessin que la gestion des ventes : un mois,
  //  deux clics). Partagé par le poste site et le poste VROOM.
  // ==========================================================================
  var __calDehors = null;
  function fermerCalendrier(doc) {
    var e = doc.getElementById('lm-dp'); if (e) e.remove();
    if (__calDehors) { doc.removeEventListener('mousedown', __calDehors, true); __calDehors = null; }
  }
  function ouvrirCalendrier(doc, FW, anchor, debut, surChoix) {
    if (doc.getElementById('lm-dp')) { fermerCalendrier(doc); return; }
    var pk = { mois: null, deb: null, fin: null, survol: null };
    var m0 = new Date(String(debut) + 'T12:00:00'); if (isNaN(m0)) m0 = new Date(); pk.mois = new Date(m0.getFullYear(), m0.getMonth(), 1);
    var pop = doc.createElement('div'); pop.id = 'lm-dp';
    var r = anchor.getBoundingClientRect();
    pop.style.cssText = 'position:fixed;z-index:99999;top:' + (r.bottom + 6) + 'px;left:' + Math.max(8, Math.min(r.left, ((FW && FW.innerWidth) || 1200) - 280)) + 'px';
    styleCalendrier(doc); doc.body.appendChild(pop);
    var ymd = function (y, m, d) { return y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0'); };
    function choisir(a, b) { fermerCalendrier(doc); surChoix(a, b); }
    function cal() {
      var y = pk.mois.getFullYear(), m = pk.mois.getMonth(), p1 = new Date(y, m, 1), dec = (p1.getDay() + 6) % 7, nb = new Date(y, m + 1, 0).getDate();
      var auj = new Date(), today = ymd(auj.getFullYear(), auj.getMonth(), auj.getDate()), a = pk.deb, b = pk.fin || pk.survol;
      var lo = a && b ? (a < b ? a : b) : null, hi = a && b ? (a < b ? b : a) : null;
      var h = '<div class="kan-dp-box"><div class="kan-dp-head"><button type="button" data-nav="-1">‹</button><span>' + esc(p1.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })) + '</span><button type="button" data-nav="1">›</button></div><div class="kan-dp-grid">';
      ['L', 'M', 'M', 'J', 'V', 'S', 'D'].forEach(function (x) { h += '<span class="kan-dp-dow">' + x + '</span>'; });
      for (var i = 0; i < dec; i++) h += '<span></span>';
      for (var d = 1; d <= nb; d++) {
        var ds = ymd(y, m, d), c = 'kan-dp-day';
        if (ds === today) c += ' today';
        if (pk.deb === ds || pk.fin === ds) c += ' sel'; else if (lo && hi && ds > lo && ds < hi) c += ' inr';
        h += '<span class="' + c + '" data-d="' + ds + '">' + d + '</span>';
      }
      return h + '</div><div class="kan-dp-foot">' + (pk.deb ? 'Cliquez la date de fin' : 'Cliquez la date de début') + '</div></div>';
    }
    function brancher() {
      pop.querySelectorAll('[data-nav]').forEach(function (b) { b.addEventListener('click', function (e) { e.stopPropagation(); pk.mois = new Date(pk.mois.getFullYear(), pk.mois.getMonth() + Number(b.getAttribute('data-nav')), 1); peindre(); }); });
      pop.querySelectorAll('.kan-dp-day').forEach(function (c) {
        c.addEventListener('click', function () { var ds = c.getAttribute('data-d'); if (!pk.deb || pk.fin) { pk.deb = ds; pk.fin = null; pk.survol = null; peindre(); return; } pk.fin = ds; var a = pk.deb, b = pk.fin; if (b < a) { var t = a; a = b; b = t; } choisir(a, b); });
        c.addEventListener('mouseenter', function () { if (pk.deb && !pk.fin && pk.survol !== c.getAttribute('data-d')) { pk.survol = c.getAttribute('data-d'); peindre(); } });
      });
    }
    function peindre() { pop.innerHTML = cal(); brancher(); }
    peindre();
    __calDehors = function (e) { if (!pop.contains(e.target) && e.target !== anchor && !anchor.contains(e.target)) fermerCalendrier(doc); };
    setTimeout(function () { doc.addEventListener('mousedown', __calDehors, true); }, 0);
  }
  function periodeDefaut() { var a = new Date(), d = new Date(Date.now() - 29 * 86400000); var f = function (x) { return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); }; return { du: f(d), au: f(a) }; }
  function fmtPeriode(per) { var f = function (x) { return new Date(x + 'T12:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }); }; return f(per.du) + ' → ' + f(per.au); }
  function boutonPeriode(per) { return '<button type="button" class="k-range" data-a="dates" title="Leads reçus sur la période">📅 <span class="k-range-t">' + esc(fmtPeriode(per)) + '</span> <span class="k-caret">▾</span></button>'; }
  function styleCalendrier(doc) {
    if (doc.getElementById('lm-dp-style')) return;
    var st = doc.createElement('style'); st.id = 'lm-dp-style';
    st.textContent = '#lm-dp .kan-dp-box{background:#fff;border:1.5px solid #e8eef7;border-radius:12px;box-shadow:0 8px 30px rgba(42,94,169,.18);padding:13px;width:262px;font-family:"Nunito Sans",system-ui,sans-serif}'
      + '#lm-dp .kan-dp-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}'
      + '#lm-dp .kan-dp-head span{font-size:12px;font-weight:700;color:#2a5ea9;text-transform:capitalize}'
      + '#lm-dp .kan-dp-head button{width:26px;height:26px;border:1.5px solid #e8eef7;background:#fff;border-radius:8px;cursor:pointer;color:#2a5ea9;font-size:13px;line-height:1;padding:0}'
      + '#lm-dp .kan-dp-head button:hover{background:#f5f8fc}'
      + '#lm-dp .kan-dp-grid{display:grid;grid-template-columns:repeat(7,33px);gap:2px}'
      + '#lm-dp .kan-dp-dow{font-size:9px;color:#acc5e4;text-align:center;font-weight:800;padding-bottom:3px}'
      + '#lm-dp .kan-dp-day{height:29px;line-height:29px;text-align:center;font-size:11px;color:#2c2c2a;border-radius:7px;cursor:pointer}'
      + '#lm-dp .kan-dp-day:hover{background:#eef4fc}'
      + '#lm-dp .kan-dp-day.today{box-shadow:inset 0 0 0 1.5px #acc5e4}'
      + '#lm-dp .kan-dp-day.sel{background:#2a5ea9;color:#fff;font-weight:800}'
      + '#lm-dp .kan-dp-day.inr{background:#eef4fc}'
      + '#lm-dp .kan-dp-foot{margin-top:8px;text-align:center;font-size:10px;color:#9bb3d1;font-style:italic}';
    doc.head.appendChild(st);
  }

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
      tab: 'piscine', stock: false, age: 'frais', demoMode: false, univ: 'tous', per: periodeDefaut(), sources: null, campagne: null, miens: false,
      kpis: null, piscine: [], rappels: [], transferts: [], campagnes: null, stockListe: null,
      ack: new Set(), vus: new Set(), frais: new Set(), premier: true,
      bacs: null,
      dr: null, // { sf, fiche, sites, vendeurs, site, envois }
      charge: false, erreur: null
    };
    try { (JSON.parse(FW.localStorage.getItem('lmtc-ack') || '[]') || []).forEach(function (x) { S.ack.add(x); }); } catch (e) {}
    var MOI = null;

    // ── Outils ────────────────────────────────────────────────────────────
    function libStatut(s) {
      return ({ 'A affecter': 'À affecter', 'Injoignable temporairement': 'Injoignable', 'Projet Long Terme': 'Projet long terme',
                'Abandonned': 'Abandonné', 'Interesse': 'Intéressé' })[s] || s || '';
    }
    function tagsLead(l) {
      var src = l.source_libelle || l.source_bacs || 'BACS';
      var h = l.campagne ? '<span class="tag camp" title="' + esc(src + ' · ' + l.campagne) + '">' + esc(l.campagne.length > 52 ? l.campagne.slice(0, 50) + '…' : l.campagne) + '</span>'
                         : '<span class="tag">' + esc(src) + '</span>';
      if (l.statut_eff === 'Accepté') h += '<span class="tag warn">Accepté</span>';
      if (l.tentatives > 0) h += '<span class="tag warn">' + plural(l.tentatives, 'tentative') + '</span>';
      return h;
    }
    // v71 : univers VN / VO (champ Nature de BACS ; « Entreprise » = VN),
    // fraîcheur (moins de 24 h) et période de réception.
    function univ(l) {
      var n = String(l.nature || '').toUpperCase(), t = String(l.type_demande || '');
      if (n === 'VO' || /réservation vo/i.test(t)) return 'VO';
      if (n === 'VN' || n === 'ENTREPRISE' || /réservation vn/i.test(t)) return 'VN';
      return null;
    }
    function univCls(l) { var u = univ(l); return u === 'VN' ? ' vt-vn' : u === 'VO' ? ' vt-vo' : ''; }
    function frais(l) { return mins(l.recu_le) < 1440; }
    function dansPeriode(l) {
      var d = l.recu_le ? new Date(l.recu_le) : null; if (!d) return true;
      var j = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
      return j >= S.per.du && j <= S.per.au;
    }
    function okUniv(l) { var u = univ(l); return S.univ === 'tous' || !u || u === S.univ; }
    function vus(list) { return fc(list).filter(function (l) { return okUniv(l) && dansPeriode(l); }); }
    function libresTous() { return S.piscine.filter(function (l) { return verrouLibre(l) && okUniv(l); }); }
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
    // v60 : BACS doit être ouvert sur CE poste (session de l'opérateur). On
    // bloque AVANT le geste ; la base le refuserait de toute façon.
    function bloque() { return !S.demoMode && ecritBacs() && S.bacs.canal !== 'moi'; }
    function dis() { return bloque() ? ' disabled title="Ouvrez BACS dans un onglet de ce navigateur pour agir"' : ''; }
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
      // v71 : une ligne discrète (les boutons sont grisés, avec la raison en infobulle).
      // Ce qui bloque, c'est l'absence de session BACS sur CE poste (règle du
      // 22/10 : un geste qui touche BACS exige BACS ouvert chez l'utilisateur).
      // L'identifiant BACS du compte n'est pas requis : il sert seulement à
      // mettre l'opérateur propriétaire du lead dans BACS.
      if (S.demoMode) return '<div class="demo-l" role="status"><b>Mode démonstration.</b><span>Tout est consultable et chaque geste se joue sur la fiche, mais rien n\'est enregistré, ni dans One Data ni dans BACS.</span><button type="button" class="btn sm" data-a="demo-off">Quitter la démonstration</button></div>';
      if (b.canal !== 'moi') return '<div class="bacs-l" role="status"><b>BACS fermé sur ce poste.</b><span>Prendre, transférer ou abandonner un lead s\'écrit dans BACS : ouvrez BACS dans un onglet de ce navigateur, avec l\'extension One Data. Les gestes se débloquent dès qu\'il répond.</span>'
        + '<button type="button" class="btn sm" data-a="demo-on">Mode démonstration</button></div>';
      var h = '';
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

    root.innerHTML = '<section class="situ"><p class="situ-l"><span class="vr">Plateau VROOM</span></p><p class="situ-t">Chargement de le Pool BACS…</p></section>';

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
      var hd = libres.filter(function (l) { return frais(l) && mins(l.recu_le) >= (l.sla_min || 120); })
        .sort(function (a, b) { return ts(a.recu_le) - ts(b.recu_le); });
      if (hd.length) out.push({ id: 'hd-' + hd.length + '-' + hd[0].sf_lead_id, niv: 'crit', k: 'Hors délai', t: hd[0].recu_le,
        titre: plural(hd.length, 'lead frais hors délai', 'leads frais hors délai') + ' dans le Pool',
        d: 'Le plus ancien : ' + nomLead(hd[0]) + ', ' + duree(mins(hd[0].recu_le)) + ' (' + (hd[0].source_libelle || 'BACS') + ', SLA ' + slaTxt(hd[0].sla_min || 120) + ').',
        a: [['Prendre le plus ancien', 'prendre', hd[0].sf_lead_id]] });
      // 4. Rappels : ceux de l'heure, un par un ; le retard, en un seul signal.
      var dus = S.rappels.filter(function (l) { return l.rappel_le && ts(l.rappel_le) <= Date.now() + 10 * 60000; });
      dus.filter(function (l) { return Math.abs(ts(l.rappel_le) - Date.now()) < 30 * 60000 && verrouLibre(l); }).slice(0, 4).forEach(function (l) {
        out.push({ id: 'rap-' + l.sf_lead_id + '-' + l.rappel_le, niv: 'warn', k: 'Rappel', t: l.rappel_le, titre: 'Rappeler ' + nomLead(l),
          d: libStatut(l.statut_eff) + (l.tentatives ? ' · ' + plural(l.tentatives, 'tentative') : '') + ' · ' + demande(l), a: [[__lmPeutAppeler() ? 'Appeler' : 'Prendre', 'prendre', l.sf_lead_id]] });
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

    // ── En-tête : une phrase et le bouton « suivant » (v62) ───────────────
    // v71 : le suivant = le lead FRAIS (moins de 24 h) le plus en retard sur
    // son délai. Sans lead frais, le plus récent des plus anciens : un lead de
    // trois semaines n'est plus le premier à appeler.
    function prochainVroom() {
      var libres = libresTous().filter(function (l) { return l.statut_eff === 'A affecter' || l.statut_eff === 'Nouveau'; });
      var fr = libres.filter(frais);
      if (fr.length) return fr.slice().sort(function (a, b) { return (mins(b.recu_le) - (b.sla_min || 120)) - (mins(a.recu_le) - (a.sla_min || 120)); })[0];
      return libres.slice().sort(function (a, b) { return ts(b.recu_le) - ts(a.recu_le); })[0] || null;
    }
    function renderSituation() {
      var k = S.kpis || {};
      var libres = libresTous(), fr = libres.filter(frais), vieux = libres.length - fr.length;
      var hd = fr.filter(function (l) { return (l.statut_eff === 'A affecter' || l.statut_eff === 'Nouveau') && mins(l.recu_le) >= (l.sla_min || 120); });
      var nom = propre([user && user.prenom, user && user.nom].filter(Boolean).join(' ')) || (user && user.nomComplet) || '';
      var p = '<b>' + plural(fr.length, 'lead frais', 'leads frais') + '</b> (moins de 24 h) dans le Pool BACS'
        + (hd.length ? ', dont <b class="t-crit">' + hd.length + ' hors délai</b>' : '')
        + (vieux ? ' · ' + plural(vieux, 'plus ancien', 'plus anciens') : '')
        + (nbDus() ? ' · <b class="t-warn">' + plural(nbDus(), 'rappel dû', 'rappels dus') + '</b>' : '')
        + ' · Aujourd\'hui : <b>' + (k.pris || 0) + ' pris</b>, <b>' + (k.qualifies || 0) + ' transférés</b>, <b>' + (k.abandonnes || 0) + ' abandonnés</b>.';
      var syncAge = k.derniere_synchro ? mins(k.derniere_synchro) : null;
      if (syncAge != null && syncAge > 120) p += ' <span class="' + (syncAge > 1440 ? 't-crit' : 't-warn') + '">BACS relu il y a ' + duree(syncAge) + '.</span>';
      var s = prochainVroom(), cta = '';
      if (s) {
        var m = mins(s.recu_le), sla = s.sla_min || 120;
        cta = '<button type="button" class="cta" data-a="prendre" data-id="' + esc(s.sf_lead_id) + '"' + dis() + '>Prendre le suivant<small>'
          + esc(nomLead(s)) + ' · ' + (!frais(s) ? 'reçu le ' + jour(s.recu_le) : m >= sla ? 'hors délai de ' + duree(m - sla) : 'attend depuis ' + duree(m)) + '</small></button>';
      }
      var b = S.bacs || {};
      var voyant = !b.ecrire_bacs ? '' : '<span class="voyant ' + (b.canal !== 'moi' || b.echecs ? 'crit' : b.en_attente ? 'warn' : 'ok') + '">'
        + (b.canal !== 'moi' ? 'BACS fermé' : b.echecs ? plural(b.echecs, 'échec BACS', 'échecs BACS') : b.en_attente ? b.en_attente + ' en attente BACS' : 'BACS connecté') + '</span>';
      return '<section class="hello"><div class="hello-t"><p class="hello-l">Plateau VROOM' + (nom ? ' · ' + esc(nom) : '') + voyant
        + (opt.apercu ? ' · aperçu <button type="button" class="lien" data-a="quitter-apercu">revenir à la vue habituelle</button>' : '') + '</p>'
        + '<h1>' + (nom ? 'Bonjour ' + esc(nom.split(' ')[0]) : 'Plateau VROOM') + '</h1><p class="hello-p">' + p + '</p></div>' + cta + '</section>';
    }

    // ── Onglets ───────────────────────────────────────────────────────────
    function rappelsDus() { return fc(S.rappels).filter(function (l) { return okUniv(l) && l.rappel_le && ts(l.rappel_le) <= Date.now(); }); }
    function nbDus() { return rappelsDus().length; }
    function onglets() {
      var fr = vus(libresTous()).filter(frais);
      var hd = fr.some(function (l) { return (l.statut_eff === 'A affecter' || l.statut_eff === 'Nouveau') && mins(l.recu_le) >= (l.sla_min || 120); });
      var tr = vus(S.transferts);
      return [['piscine', 'Pool BACS', fr.length, hd, 'v'],
              ['rappels', 'Rappels dus', nbDus(), nbDus() > 0, 'r'],
              ['transferts', 'Transferts', tr.length, false, 'b'],
              ['campagnes', 'Campagnes', null, false, 'b']];
    }
    function outilsVroom() {
      return '<div class="outils"><div class="seg-u" role="group" aria-label="Univers">' + [['tous', 'VN + VO'], ['VN', 'VN'], ['VO', 'VO']].map(function (o) {
        return '<button type="button" class="' + (S.univ === o[0] ? 'on' : '') + '" data-a="univ" data-id="' + o[0] + '" aria-pressed="' + (S.univ === o[0]) + '">' + (o[0] !== 'tous' ? '<i class="pt vt-' + o[0].toLowerCase() + '"></i>' : '') + o[1] + '</button>'; }).join('') + '</div>'
        + boutonPeriode(S.per) + '</div>';
    }
    function renderTabs() {
      return '<div class="tabs" role="tablist">' + onglets().map(function (o) {
        var on = o[0] === S.tab;
        return '<button type="button" role="tab" aria-selected="' + on + '" class="' + (on ? 'on' : '') + (o[4] ? ' t-' + o[4] : '') + '" data-a="tab" data-id="' + o[0] + '">' + esc(o[1])
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
      return '<div class="lr' + (!verrouLibre(l) && !estMien(l) ? ' resa' : '') + univCls(l) + '" data-a="open" data-id="' + esc(l.sf_lead_id) + '" tabindex="0">'
        + '<div>' + gauche + '</div>'
        + '<div><span class="lr-n">' + esc(nomLead(l)) + '</span> <span class="lr-v">' + esc(l.site ? siteNom(l.site) : (l.ville || '')) + '</span><p class="lr-d">' + esc(demande(l)) + '</p><div class="tags">' + tagsLead(l) + '</div></div>'
        + '<div class="lr-a">' + actionLigne(l, verbe) + '</div></div>';
    }
    function chipsSources() {
      var k = S.kpis || {}, src = (k.sources || []).filter(function (s) { return s.code !== 'bacs_atelier'; });
      if (!src.length) return '';
      var actives = S.sources || src.filter(function (s) { return s.suivi; }).map(function (s) { return s.code; });
      return '<div class="chips filtres" aria-label="Sources">' + src.map(function (s) {
        var on = actives.indexOf(s.code) !== -1;
        return '<button type="button" class="fchip' + (on ? ' on' : '') + '" data-a="source" data-id="' + esc(s.code) + '" aria-pressed="' + on + '">' + esc(s.libelle) + ' <span class="num">' + s.n + '</span></button>';
      }).join('') + '</div>';
    }
    function vuePiscine() {
      var k = S.kpis || {};
      var base = vus(S.piscine).filter(okUniv), nFr = base.filter(frais).length;
      var h = '<div class="barre"><div class="seg"><button type="button" class="' + (!S.stock && S.age === 'frais' ? 'on' : '') + '" data-a="age" data-id="frais">Moins de 24 h <span class="num">' + nFr + '</span></button>'
        + '<button type="button" class="' + (!S.stock && S.age === 'vieux' ? 'on' : '') + '" data-a="age" data-id="vieux">Plus de 24 h <span class="num">' + (base.length - nFr) + '</span></button>'
        + '<button type="button" class="' + (S.stock ? 'on' : '') + '" data-a="stock" data-id="1">Stock accepté <span class="num">' + (S.stockListe ? vus(S.stockListe).length : (k.stock_acceptes_anciens || 0)) + '</span></button></div>'
        + (!S.stock ? chipsSources() : '') + '</div><div class="list">';
      var ls = S.stock ? vus(S.stockListe || []) : base.filter(function (l) { return S.age === 'frais' ? frais(l) : !frais(l); });
      if (!S.stock) ls.sort(S.age === 'frais' ? function (a, b) { return (mins(b.recu_le) - (b.sla_min || 120)) - (mins(a.recu_le) - (a.sla_min || 120)); } : function (a, b) { return ts(b.recu_le) - ts(a.recu_le); });
      if (S.stock && !S.stockListe) h += '<div class="empty">Chargement du stock…</div>';
      else if (!ls.length) h += '<div class="empty">' + (S.campagne ? 'Aucun lead de cette campagne à traiter.' : S.stock ? 'Aucun lead en stock.' : S.age === 'frais' ? 'Aucun lead de moins de 24 h à prendre.' : 'Aucun lead de plus de 24 h dans le Pool BACS.') + '</div>';
      ls.forEach(function (l) {
        var gauche = S.stock || !frais(l)
          ? '<span class="tm crit"><b>' + duree(mins(l.recu_le)) + '</b><small>reçu le ' + jour(l.recu_le) + '</small></span>'
          : tm(l.recu_le, l.sla_min || 120);
        h += ligneLead(l, gauche, S.stock || l.statut_eff === 'Accepté' ? 'Rappeler' : 'Prendre');
      });
      return h + '</div><p class="foot">Prendre réserve le lead à votre nom ' + (k.verrou_minutes || 5) + ' min.' + (S.stock ? ' Stock : leads acceptés il y a plus de 14 jours, sans suite.' : '') + '</p>';
    }
    function vueRappels() {
      var ls = fc(S.rappels).filter(function (l) { return okUniv(l) && (!S.miens || Number(l.derniere_action_par) === Number(MOI)); })
        .sort(function (a, b) { return ts(a.rappel_le) - ts(b.rappel_le); });
      var h = '<div class="barre"><span class="lbl-s">' + plural(nbDus(), 'rappel dû', 'rappels dus') + ' sur ' + plural(fc(S.rappels).filter(okUniv).length, 'programmé', 'programmés') + '.</span><div class="ph-r"><div class="seg"><button type="button" class="' + (!S.miens ? 'on' : '') + '" data-a="miens" data-id="">Tout le plateau</button><button type="button" class="' + (S.miens ? 'on' : '') + '" data-a="miens" data-id="1">Les miens</button></div></div></div><div class="list">';
      if (!ls.length) h += '<div class="empty">' + (S.campagne ? 'Aucun rappel pour cette campagne.' : 'Aucun rappel programmé.') + '</div>';
      ls.forEach(function (l) {
        var due = ts(l.rappel_le) - Date.now();
        var cls = due <= 0 ? 'crit' : (due < 15 * 60000 ? 'warn' : 'ok');
        var b = due <= 0 ? (due > -15 * 60000 ? 'Maintenant' : 'retard ' + duree(-due / 60000)) : 'dans ' + duree(due / 60000);
        var gauche = '<span class="tm ' + cls + '"><b>' + b + '</b><small>prévu ' + (quand(l.rappel_le).length > 5 ? 'le ' : 'à ') + esc(quand(l.rappel_le)) + '</small></span>';
        h += ligneLead(l, gauche, __lmPeutAppeler() ? 'Appeler' : 'Traiter').replace('<div class="tags">', '<div class="tags"><span class="tag ' + (l.statut_eff === 'Projet Long Terme' ? 'vr' : 'warn') + '">' + esc(libStatut(l.statut_eff)) + '</span>');
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
      var ls = vus(S.transferts).filter(function (l) { return !S.miens || Number(l.derniere_action_par) === Number(MOI); });
      var h = '<div class="barre"><span class="lbl-s">Le site a 2 h pour prendre un transfert.</span><div class="ph-r"><div class="seg"><button type="button" class="' + (!S.miens ? 'on' : '') + '" data-a="miens" data-id="">Tout le plateau</button><button type="button" class="' + (S.miens ? 'on' : '') + '" data-a="miens" data-id="1">Les miens</button></div></div></div><div class="list">';
      if (!ls.length) h += '<div class="empty">' + (S.campagne ? 'Aucun transfert pour cette campagne sur la période.' : 'Aucun transfert sur la période.') + '</div>';
      ls.forEach(function (l) {
        var depuis = l.transfere_le || l.derniere_action_le;
        var attente = l.id_lead && !l.od_contact_le && ['recu', 'resolu', 'attribue'].indexOf(l.od_statut) !== -1 && depuis;
        var gauche = attente ? tm(depuis, SLA_SITE, 'sur le site · SLA 2 h')
          : '<span class="tm neutre"><b>' + esc(depuis ? jour(depuis) : jour(l.recu_le)) + '</b><small>' + (depuis ? 'transféré' : 'reçu') + '</small></span>';
        var q = resumeQualif(l.qualification);
        h += '<div class="lr' + univCls(l) + '" data-a="open" data-id="' + esc(l.sf_lead_id) + '" tabindex="0"><div>' + gauche + '</div>'
          + '<div><span class="lr-n">' + esc(nomLead(l)) + '</span> <span class="lr-v">→ ' + esc(siteNom(l.site) || 'site non renseigné') + '</span><p class="lr-d">' + esc(q || demande(l)) + '</p><div class="tags">' + tagsLead(l) + '</div></div>'
          + '<div class="lr-a">' + etatTransfert(l) + '</div></div>';
      });
      return h + '</div>';
    }
    function vueCampagnes() {
      var h = '';
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
      return h + '</tbody></table></div><p class="foot">Un lead est compté dans la colonne de son statut actuel : statut BACS, ou celui du dernier geste One Data s\'il est plus récent que la copie BACS. « Filtrer » restreint le Pool, les rappels et les transferts à la campagne ; les signaux restent ceux de tout le plateau.</p>';
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
      var y = (FW.scrollY || 0);
      root.innerHTML = renderSituation() + bandeauBacs()
        + (S.erreur ? '<p class="alerte">' + esc(S.erreur) + ' Les données affichées datent du dernier chargement réussi.</p>' : '')
        + '<div class="barre-o">' + renderTabs() + outilsVroom() + '</div>' + bandeauFiltre()
        + '<section class="act" aria-label="Leads"><div class="panel">' + renderPanel() + '</div></section>';
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

    // v71 : la demande initiale du client, visible du premier coup d'œil.
    function demandeHautVr(l, fb) {
      var type = fb.type_demande || l.type_demande || '', veh = [fb.marque, fb.modele || l.modele].filter(Boolean).join(' ');
      var msg = String(l.commentaire || '').trim(), u = univ(l);
      if (!type && !veh && !msg && !l.campagne) return '';
      var long = msg.length > 220, ouvert = S.dr && S.dr.demOuverte;
      return '<div class="dem-h' + univCls(l) + '"><div class="dem-t"><span>Demande du client</span>' + (u ? '<em class="u' + univCls(l) + '">' + u + '</em>' : '') + (type ? '<em>' + esc(type) + '</em>' : '') + '<small>' + esc(quand(l.recu_le)) + '</small></div>'
        + (veh ? '<p class="dem-v">' + esc(veh) + '</p>' : '')
        + (msg ? '<p class="dem-m' + (long && !ouvert ? ' court' : '') + '">« ' + esc(msg) + ' »</p>' + (long ? '<button type="button" class="lien" data-a="dem-plus">' + (ouvert ? 'Réduire' : 'Lire toute la demande') + '</button>' : '')
          : (l.campagne ? '<p class="dem-m">' + esc(l.campagne) + '</p>' : ''))
        + '</div>';
    }
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
        + '<h2>' + esc(nomLead(l)) + '</h2><p class="dr-s">' + esc([l.ville, l.site ? 'site BACS : ' + siteNom(l.site) : null].filter(Boolean).join(' · ')) + '</p>' + demandeHautVr(l, fb) + '</div>'
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
        + '<div class="canaux">' + [['Appeler', 'appel', 'call', IC.phone], ['WhatsApp', 'wa', 'wa', IC.wa], ['Email', 'mail', 'mail', IC.mail], ['SMS', 'sms', 'sms', IC.sms]].filter(function (c) { return c[1] !== 'appel' || __lmPeutAppeler(); }).map(function (c) {
            return '<button type="button" class="fs-btn ' + c[2] + '" data-a="canal" data-id="' + c[1] + '"' + ((c[1] === 'mail' ? !l.email : !l.telephone) ? ' disabled' : '') + '>' + svgIc(c[3]) + c[0] + '</button>'; }).join('') + '</div></section>';
      // Demande
      var oui = function (v) { return v === 'true' || v === true ? 'Oui' : v === 'false' || v === false ? 'Non' : v; };
      var dl = [['Type', fb.type_demande], ['Modèle', fb.modele], ['Marque', fb.marque], ['Échéance', fb.echeance], ['Reprise', oui(fb.reprise)],
                ['Financement', fb.financement], ['Budget', fb.budget], ['Canal préféré', fb.canal_prefere],
                ['À accepter avant', fb.limite_acceptation ? quand(fb.limite_acceptation) : null]].filter(function (x) { return x[1]; });
      h += '<section><h3>Demande</h3>' + (dl.length ? '<dl class="dl">' + dl.map(function (x) { return '<dt>' + x[0] + '</dt><dd>' + esc(x[1]) + '</dd>'; }).join('') + '</dl>' : '<p style="font-weight:700">' + esc(demande(l)) + '</p>')
        + (fb.campagne_description ? '<p class="hint">' + esc(fb.campagne_description) + '</p>' : '') + '</section>';
      // Qualification et orientation (lead réservé à mon nom)
      if (mien && actif) {
        var q = l.qualification || {};
        h += '<section><h3>Qualification</h3><div class="qf">'
          + '<div class="q"><span>Projet</span>' + chipGroup('q-projet', ['Achat VN', 'Achat VO', 'Atelier', 'Simple information'], q.projet || (univ(l) === 'VO' || (!univ(l) && /VO|occasion/i.test(fb.type_demande || l.campagne || '')) ? 'Achat VO' : 'Achat VN')) + '</div>'
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
            + '<button type="button" class="btn pri" data-a="injoignable"' + dis() + '>Programmer le rappel</button>'
            + (ecritBacs() ? '</div><div class="row inj-msg"><label class="hint"><input type="checkbox" id="r-email"> Envoyer l\u2019e-mail au client</label>'
                + '<label class="hint"><input type="checkbox" id="r-sms"> Envoyer le SMS au client</label>' : '');
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
      var top = $drawer.scrollTop;
      if (D.demo) h = h.replace('<div class="dr-b">', '<p class="demo">' + (S.demoMode ? 'Démonstration : la fiche est montrée comme après la prise du lead. Rien n\'est enregistré, rien ne part dans BACS.' : 'Fiche d\'exemple de la visite guidée : rien n\'est enregistré, rien ne part dans BACS.') + '</p><div class="dr-b">');
      $drawer.innerHTML = h;
      $drawer.scrollTop = top;
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
    // Visite guidée : la fiche d'un vrai lead, présentée comme réservée à
    // l'opérateur pour montrer la qualification, l'orientation et les issues.
    // Aucun geste n'est enregistré (geste() et canal() refusent), rien n'est
    // réservé ni libéré dans BACS.
    async function ouvrirExemple(sfVoulu) {
      var tous = [].concat(S.piscine || [], S.stockListe || [], S.rappels || [], S.transferts || []).filter(function (x) { return x && x.sf_lead_id; });
      var cand = (sfVoulu && tous.find(function (x) { return x.sf_lead_id === sfVoulu; })) || tous[0];
      var fiche = null;
      if (cand) { try { fiche = await rpc('plateau_fiche', { p_sf_lead_id: cand.sf_lead_id }); } catch (e) { fiche = null; } }
      if (!fiche) fiche = { sf_lead_id: 'exemple', prenom: 'Client', nom: 'Exemple', recu_le: new Date(Date.now() - 1200000).toISOString(), fiche_bacs: { type_demande: 'Demande d\'essai', modele: 'Yaris Cross' } };
      fiche = JSON.parse(JSON.stringify(fiche));
      fiche.statut_eff = 'Accepté'; fiche.verrou_par = MOI; fiche.verrou_nom = null;
      fiche.verrou_jusqu = new Date(Date.now() + 3600000).toISOString();
      fermerDrawer(true);
      S.dr = { sf: fiche.sf_lead_id, fiche: fiche, sites: null, vendeurs: null, site: null, envois: [], demo: true };
      $scrim.hidden = false; $drawer.hidden = false;
      renderDrawer();
      if (fiche.sf_lead_id !== 'exemple') { await chargerEnvois(); await chargerSites(); }
      else if (S.dr) { S.dr.sites = []; renderDrawer(); }
    }
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
      if (D && D.fiche && estMien(D.fiche) && !silencieux && !D.demo) {
        try { await rpc('plateau_liberer', { p_sf_lead_id: D.sf }); } catch (e) {}
        rafraichir(true);
      }
    }

    // ── Gestes ────────────────────────────────────────────────────────────
    var occupe = false;
    async function geste(fn) {
      if (S.dr && S.dr.demo) { toast(S.demoMode ? 'Démonstration : en situation réelle, ce geste serait enregistré dans One Data et reporté dans BACS.' : 'Visite guidée : rien n\'est enregistré sur la fiche d\'exemple.'); return; }
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
      var email = type === 'injoignable' && !!($drawer.querySelector('#r-email') || {}).checked;
      var sms = type === 'injoignable' && !!($drawer.querySelector('#r-sms') || {}).checked;
      return geste(async function () {
        await rpc('plateau_rappel', { p_sf_lead_id: D.sf, p_type: type, p_rappel_le: quandR.toISOString(), p_note: note, p_email: email, p_sms: sms });
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
      if (D.demo) { toast('Visite guidée : les boutons de contact ne font rien sur la fiche d\'exemple.'); return; }
      var f = D.fiche;
      var nom = propre(f.nom || '');
      var client = { IDVu: f.id_client, TEl_MOB: f.telephone, EMAIL: f.email, nom: nom, prenom: '' };
      try {
        if (act === 'appel') {
          if (!__lmPeutAppeler()) return;
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
        toast('BACS n\'est pas ouvert sur votre poste : ouvrez-le dans un onglet de ce navigateur et connectez-vous.', true); return;
      }
      // v74 : mode démonstration — « Prendre » et l'ouverture d'un lead
      // montrent la fiche telle qu'après la prise (qualification, transfert,
      // rappel, abandon), sans rien réserver ni écrire ; les gestes qui
      // écriraient sont refusés.
      if (S.demoMode) {
        if (a === 'prendre' || a === 'open') return ouvrirExemple(id);
        if (a === 'relancer' || a === 'bacs-relancer') { toast('Démonstration : en situation réelle, le chef des ventes du site serait relancé.'); return; }
      }
      switch (a) {
        case 'demo-on': S.demoMode = true; render(); toast('Mode démonstration : rien n\'est enregistré.'); return;
        case 'demo-off': S.demoMode = false; if (S.dr && S.dr.demo) fermerDrawer(true); render(); return;
        case 'age': S.tab = 'piscine'; S.stock = false; S.age = id === 'vieux' ? 'vieux' : 'frais'; render(); return;
        case 'univ': S.univ = id || 'tous'; render(); return;
        case 'dem-plus': if (S.dr) { S.dr.demOuverte = !S.dr.demOuverte; renderDrawerPreserve(); } return;
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
      if (a === 'dates') { ouvrirCalendrier(doc, FW, t, S.per.du, function (du, au) { S.per = { du: du, au: au }; render(); }); return; }
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
    // Accès des visites guidées (module tours) : fiche d'exemple et fermeture.
    try { FW.__lmtcTour = { poste: 'vroom', exemple: ouvrirExemple, fermer: function () { if (S.dr) fermerDrawer(); } }; } catch (e) {}

    // ── Cycle de vie ──────────────────────────────────────────────────────
    var minuteur = null, horloge = null;
    function detruire() {
      clearInterval(minuteur); clearInterval(horloge); clearInterval(renouvellement);
      doc.removeEventListener('keydown', surTouche);
      if (S.dr && S.dr.fiche && estMien(S.dr.fiche) && !S.dr.demo) { try { rpc('plateau_liberer', { p_sf_lead_id: S.dr.sf }); } catch (e) {} }
      S.dr = null;
      try { if (FW.__lmtcTour && FW.__lmtcTour.poste === 'vroom') delete FW.__lmtcTour; } catch (e) {}
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
  //  LE POSTE DES SITES : VENDEUR, CHEF DES VENTES, DIRECTION
  //
  //  Même grammaire que le plateau : la situation en une phrase, les signaux à
  //  gauche (chacun porte son action), les onglets à droite.
  //    · vendeur   : À faire · Piscine du site · Mes campagnes
  //    · chef      : Le mur · À relayer · Campagnes
  //    · direction : Le mur des sites · Le relais · Campagnes ; « Ouvrir » un
  //                  site montre le mur de son chef des ventes.
  //  Données : poste_site_leads (leads ouverts du périmètre), poste_site_stats
  //  (sites, vendeurs, mesures 30 j), poste_relais, et les fonctions de
  //  campagne existantes. Gestes : poste_* (teamcolin_poste_site.sql),
  //  lead_rdv_creer, lead_transferer_site.
  // ==========================================================================
  async function posteSite(el, ctx, user, opt) {
    var doc = el.ownerDocument || document;
    var sb = ctx.supabase;
    var FW = frontWindow();
    var POSTE = opt.poste;                       // 'vendeur' | 'chef' | 'direction'
    var REFRESH_MS = 60000;
    var MOTIFS_CLORE = [['pas_interesse', 'Pas intéressé'], ['injoignable', 'Injoignable'], ['concurrent', 'Parti à la concurrence'],
                        ['doublon', 'Doublon'], ['spam', 'Fausse demande'], ['autre', 'Autre']];
    var COLS = [['ok', 'Dans les temps'], ['warn', 'À risque'], ['crit', 'Hors délai'], ['stock', 'Ouverts + 24 h']];

    var S = {
      tab: 'pool',
      sugg: {}, suggKey: null, regle: {}, perimOuvert: false, invitables: {},
      leads: [], stats: null, bacs: null, charge: false, erreur: null,
      site: null,              // site affiché (chef, direction après « Ouvrir »)
      vueSite: null,           // direction : site ouvert
      depuis: 'site', cell: null, autresVendeurs: false, autresSites: false,
      campagnes: null, campVend: null, campOuverte: null, mesSollis: null,
      relais: null,
      ack: new Set(), vus: new Set(), frais: new Set(), premier: true,
      dr: null, modal: null,
      tous: [], univ: 'tous', comme: null, poste0: null,
      per: (function () { var a = new Date(), d = new Date(Date.now() - 29 * 86400000); var f = function (x) { return x.getFullYear() + '-' + String(x.getMonth() + 1).padStart(2, '0') + '-' + String(x.getDate()).padStart(2, '0'); }; return { du: f(d), au: f(a) }; })()
    };
    try { (JSON.parse(FW.localStorage.getItem('lmtc-ack-site') || '[]') || []).forEach(function (x) { S.ack.add(x); }); } catch (e) {}
    var MOI = null;

    // ── Lecture de la donnée ──────────────────────────────────────────────
    function nomLead(l) { return propre(l.nom) || 'Sans nom'; }
    // Une mesure (médiane, moyenne) : « moins d'une minute » plutôt que « à l'instant ».
    function dureeMes(m) { return m == null ? '—' : Number(m) < 1 ? '< 1 min' : duree(Number(m)); }
    function prenom(n) { return String(propre(n) || '').split(' ')[0]; }
    function arrive(l) { return S.depuis === 'bacs' ? l.recu_le : l.arrive_le; }
    function slaDe(l) { return S.depuis === 'bacs' ? (l.sla_min || 60) : (l.sla_site || l.sla_min || 60); }
    function niveau(l) { var m = mins(arrive(l)); return m >= 1440 ? 'stock' : niv(m, slaDe(l)); }
    function verrouAutre(l) { return l.verrou_par && Number(l.verrou_par) !== Number(MOI) && l.verrou_jusqu && ts(l.verrou_jusqu) > Date.now(); }
    function estMien(l) { return l.zone === 'vendeur' && Number(l.id_user_attribue) === Number(MOI); }
    function sitesStats() { return (S.stats && S.stats.sites) || []; }
    function siteInfo(id) { return sitesStats().find(function (s) { return Number(s.id_site) === Number(id); }) || null; }
    function manager(id) { var s = siteInfo(id); return !!(s && s.manager); }
    function vendeursDu(id) { return ((S.stats && S.stats.vendeurs) || []).filter(function (v) { return Number(v.id_site) === Number(id); }); }
    function leadsDu(id) { return S.leads.filter(function (l) { return Number(l.id_site) === Number(id); }); }
    function piscine(id) { return S.leads.filter(function (l) { return l.zone === 'piscine' && (id == null || Number(l.id_site) === Number(id)) && (!S.comme || S.comme.sites.indexOf(Number(l.id_site)) !== -1); }); }
    // ── v67 : univers VN / VO, vue d'un vendeur, période ──────────────────
    function sitesVendeur() { return S.comme ? sitesStats().filter(function (x) { return S.comme.sites.indexOf(Number(x.id_site)) !== -1; }) : sitesStats(); }
    function univDe(v) { var t = String(v || '').toUpperCase(); return t === 'VN' ? 'VN' : t === 'VO' ? 'VO' : 'tous'; }
    function univActif() { return S.comme ? univDe(S.comme.vnvo) : S.univ; }
    function filtrerUniv(ls) {
      var u = univActif();
      return (ls || []).filter(function (l) { return u === 'tous' || !l.univers || l.univers === u || (S.comme && l.zone !== 'piscine'); });
    }
    // v70 : VN / VO comme dans la gestion des ventes : un liseret à gauche,
    // vert pour le VN, orange pour le VO (plus de pastille).
    function univTag(l) { return ''; }
    function univCls(l) { return l && l.univers === 'VN' ? ' vt-vn' : l && l.univers === 'VO' ? ' vt-vo' : ''; }
    function segUniv() {
      if (S.comme) return '';
      if (POSTE === 'vendeur' && univDe(S.stats && S.stats.mon_univers) !== 'tous') return '';
      return '<div class="seg-u" role="group" aria-label="Univers">' + [['tous', 'VN + VO'], ['VN', 'VN'], ['VO', 'VO']].map(function (o) {
        return '<button type="button" class="' + (S.univ === o[0] ? 'on' : '') + '" data-a="univ" data-id="' + o[0] + '" aria-pressed="' + (S.univ === o[0]) + '">' + (o[0] !== 'tous' ? '<i class="pt vt-' + o[0].toLowerCase() + '"></i>' : '') + o[1] + '</button>'; }).join('') + '</div>';
    }
    // Même sélecteur que la gestion des ventes : bouton « VENDEUR / nom ▾ »,
    // recherche, groupes VN / VO / VN-VO, le chef en tête (= sa propre vue).
    function vnvoLbl(t) { var n = String(t || '').toUpperCase().replace(/[^A-Z]/g, ''); return n === 'VN' ? 'VN' : n === 'VO' ? 'VO' : n === 'VNVO' ? 'VN/VO' : 'Autres'; }
    function vnvoRang(t) { var n = String(t || '').toUpperCase().replace(/[^A-Z]/g, ''); return n === 'VN' ? 0 : n === 'VO' ? 1 : n === 'VNVO' ? 2 : 3; }
    function vendeursComme() {
      var sid = S.comme ? S.comme.site : sitePoste();
      var vus = {};
      return vendeursDu(sid).filter(function (v) { if (vus[v.id_user] || Number(v.id_user) === Number(S.stats && S.stats.moi)) return false; vus[v.id_user] = 1; return true; })
        .sort(function (a, b) { return (vnvoRang(a.vn_vo) - vnvoRang(b.vn_vo)) || String(propre(a.nom)).localeCompare(String(propre(b.nom)), 'fr', { sensitivity: 'base' }); });
    }
    function listeComme() {
      var q = String(S.commeQ || '').toLowerCase().trim();
      var moiNom = propre((S.stats && S.stats.nom) || '') || 'Moi';
      var h = '', last = null;
      var p0 = S.comme ? S.poste0 : POSTE;
      if (!q || moiNom.toLowerCase().indexOf(q) !== -1) h += '<div class="k-vgroup">' + (p0 === 'chef' ? 'Chef des ventes' : 'Direction') + '</div><button type="button" class="k-vitem' + (!S.comme ? ' on' : '') + '" data-a="comme-off">' + esc(moiNom) + '</button>';
      var ls = vendeursComme().filter(function (v) { return !q || String(propre(v.nom)).toLowerCase().indexOf(q) !== -1; });
      ls.forEach(function (v) {
        var t = vnvoLbl(v.vn_vo);
        if (t !== last) { h += '<div class="k-vgroup">' + esc(t) + '</div>'; last = t; }
        h += '<button type="button" class="k-vitem' + (S.comme && Number(S.comme.id) === Number(v.id_user) ? ' on' : '') + '" data-a="comme" data-id="' + v.id_user + '">' + esc(propre(v.nom)) + '</button>';
      });
      return h || '<div class="k-vempty">Aucun vendeur sur ce site.</div>';
    }
    function selComme() {
      var p0 = S.comme ? S.poste0 : POSTE;
      if (p0 === 'vendeur') return '';
      var sid = S.comme ? S.comme.site : sitePoste();
      if (sid == null || !vendeursComme().length) return '';
      var nom = S.comme ? propre(S.comme.nom) : (propre((S.stats && S.stats.nom) || '') || 'Moi');
      return '<div class="k-vend-sel"><button type="button" class="k-vend k-vend-btn" data-a="comme-menu" aria-expanded="' + !!S.commeMenu + '"><span class="k-vend-l">Vendeur</span><span class="k-vend-n">' + esc(nom) + ' <span class="k-caret">\u25be</span></span></button>'
        + (S.commeMenu ? '<div class="k-vpanel"><input type="text" class="k-vsearch" data-x="comme-q" placeholder="Rechercher un vendeur…" value="' + esc(S.commeQ || '') + '"><div class="k-vlist">' + listeComme() + '</div></div>' : '') + '</div>';
    }
    function fmtPer() { return fmtPeriode(S.per); }
    function outils() {
      return '<div class="outils">' + selComme() + segUniv()
        + '<button type="button" class="k-range" data-a="dates" title="Leads reçus sur la période">\ud83d\udcc5 <span class="k-range-t">' + esc(fmtPer()) + '</span> <span class="k-caret">\u25be</span></button></div>';
    }
    function bandeauComme() {
      if (!S.comme) return '';
      var u = S.comme.vnvo === 'VNVO' ? 'VN et VO' : S.comme.vnvo ? S.comme.vnvo : 'VN et VO';
      return '<div class="comme-b" role="status"><span>Vous voyez l\'écran de <b>' + esc(propre(S.comme.nom)) + '</b> (vendeur ' + esc(u) + ') : son Pool, ses leads à rappeler et ses relances. Aperçu en lecture seule.</span>'
        + '<button type="button" class="btn sm" data-a="comme-off">Revenir à ma vue</button></div>';
    }
    function entrerComme(id) {
      var sid = sitePoste();
      var v = ((S.stats && S.stats.vendeurs) || []).find(function (x) { return Number(x.id_user) === Number(id); });
      if (!v) return;
      var sites = ((S.stats && S.stats.vendeurs) || []).filter(function (x) { return Number(x.id_user) === Number(id); }).map(function (x) { return Number(x.id_site); });
      if (!S.comme) S.poste0 = POSTE;
      S.comme = { id: Number(id), nom: v.nom, vnvo: v.vn_vo || '', sites: sites, site: sid };
      POSTE = 'vendeur'; MOI = Number(id); S.tab = 'pool'; S.cell = null;
      if (S.dr || !$drawer.hidden) fermerTout();
      S.leads = filtrerUniv(S.tous); render();
      try { FW.scrollTo(0, 0); } catch (e) {}
    }
    function sortirComme() {
      if (!S.comme) return;
      POSTE = S.poste0 || POSTE; S.comme = null; S.poste0 = null; MOI = S.stats ? S.stats.moi : MOI;
      S.tab = 'pool'; S.cell = null; S.leads = filtrerUniv(S.tous); render(); chargerAide();
    }
    var ACTIONS_APERCU = ['tab', 'comme-off', 'comme', 'comme-menu', 'univ', 'dates', 'dem-plus', 'open', 'close', 'retour-liste', 'ack', 'reessayer', 'cell', 'fermer'];
    function fermerDates() { fermerCalendrier(doc); }
    function appliquerDates(du, au) {
      fermerDates();
      if (!du || !au || (du === S.per.du && au === S.per.au)) return;
      S.per = { du: du, au: au }; S.suggKey = null;
      rafraichir();
    }
    function ouvrirDates(anchor) { ouvrirCalendrier(doc, FW, anchor, S.per.du, appliquerDates); }
    function libres(id) { return piscine(id).filter(function (l) { return !verrouAutre(l); }); }
    function mesLeads() {
      return S.leads.filter(estMien).sort(function (a, b) { return (slaDe(a) - mins(arrive(a))) - (slaDe(b) - mins(arrive(b))); });
    }
    function prisSansAppel(l) { return l.zone === 'vendeur' && l.attribution_regle === 'prise_directe' && !l.tentatives && l.attribue_le && mins(l.attribue_le) > 20; }
    function marqueNorm(s) { return String(s || '').toUpperCase().replace(/[^A-Z]/g, ''); }
    // Seules les deux marques du groupe comptent : BACS met parfois un code (« 01 ») dans ce champ.
    function horsMarque(l) {
      var m = marqueNorm(l.marque_lead), r = marqueNorm(l.reseau);
      return (m === 'TOYOTA' || m === 'LEXUS') && (r === 'TOYOTA' || r === 'LEXUS') && m !== r;
    }
    function aussiPlateau(l) { return l.zone === 'vendeur' && !l.transfere_le && (l.statut_bacs === 'A affecter' || l.statut_bacs === 'Nouveau'); }
    function charge(idUser, idSite) { return S.leads.filter(function (l) { return l.zone === 'vendeur' && Number(l.id_user_attribue) === Number(idUser) && (idSite == null || Number(l.id_site) === Number(idSite)); }).length; }
    function sitePoste() { return POSTE === 'direction' ? S.vueSite : S.site; }
    function monStat() { return ((S.stats && S.stats.vendeurs) || []).filter(function (v) { return Number(v.id_user) === Number(MOI); }); }
    function stockDu(id) { return S.leads.filter(function (l) { return l.zone !== 'plateau' && Number(l.id_site) === Number(id) && mins(l.arrive_le) >= 1440; }).length; }
    function demandeDe(l) { return l.vehicule || (l.message ? String(l.message).replace(/^\[[^\]]*\]\s*/, '').slice(0, 90) : '') || l.source_libelle || 'Demande'; }
    function tagsLead(l) {
      var h = univTag(l) + '<span class="tag">' + esc(l.source_libelle || l.source || 'Lead') + '</span>';
      if (l.par_plateau) h += '<span class="tag vr">Qualifié par VROOM</span>';
      if (l.campagne) h += '<span class="tag camp" title="' + esc(l.campagne) + '">' + esc(l.campagne.length > 40 ? l.campagne.slice(0, 38) + '…' : l.campagne) + '</span>';
      if (l.tentatives > 0) h += '<span class="tag warn">' + plural(l.tentatives, 'tentative') + '</span>';
      if (horsMarque(l)) h += '<span class="tag warn">Demande ' + esc(propre(l.marque_lead)) + '</span>';
      if (aussiPlateau(l)) h += '<span class="tag">Aussi dans le Pool BACS</span>';
      if (l.statut_bacs === 'Abandonned') h += '<span class="tag crit">Abandonné dans BACS</span>';
      return h;
    }

    async function rpc(nom, args) {
      var r = await sb.rpc(nom, args || {});
      if (r.error) { var e = new Error(r.error.message || nom); e.code = r.error.code; throw e; }
      return r.data;
    }
    function messageErreur(e) {
      var m = String((e && e.message) || e || '');
      if (/Failed to fetch|NetworkError/i.test(m)) return 'Connexion perdue. Réessayez dans un instant.';
      return m.replace(/^\[lead\]\s*/, '') || 'Erreur inattendue';
    }

    // ── Cadre ─────────────────────────────────────────────────────────────
    injecterCss(doc);
    el.innerHTML = '';
    var root = doc.createElement('div');
    root.className = 'lmtc';
    el.appendChild(root);
    var ov = doc.createElement('div');
    ov.className = 'lmtc lmtc-ov';
    ov.innerHTML = '<div class="scrim" hidden></div><aside class="drawer" hidden aria-label="Détail du lead"></aside><div class="modal" hidden></div><div class="toast" role="status" aria-live="polite"></div>';
    doc.body.appendChild(ov);
    var $scrim = ov.querySelector('.scrim'), $drawer = ov.querySelector('.drawer'), $modal = ov.querySelector('.modal'), $toast = ov.querySelector('.toast');
    function toast(msg, err) {
      $toast.textContent = msg; $toast.classList.toggle('err', !!err); $toast.classList.add('on');
      clearTimeout(toast._t); toast._t = setTimeout(function () { $toast.classList.remove('on'); }, err ? 5200 : 3200);
    }
    var LIB_POSTE = { vendeur: 'Vendeur', chef: 'Chef des ventes', direction: 'Direction' };
    root.innerHTML = '<section class="situ"><p class="situ-l">' + LIB_POSTE[POSTE] + '</p><p class="situ-t">Chargement des leads…</p></section>';

    // ── Chargement ────────────────────────────────────────────────────────
    async function charger() {
      var res = await Promise.all([
        rpc('poste_site_leads', { p_sites: null, p_du: S.per.du, p_au: S.per.au }),
        rpc('poste_site_stats', { p_sites: null }),
        rpc('bacs_canal_etat').catch(function () { return S.bacs; })
      ]);
      S.tous = res[0] || []; S.stats = res[1] || {}; S.bacs = res[2] || null;
      MOI = S.comme ? S.comme.id : S.stats.moi;
      S.leads = filtrerUniv(S.tous);
      if (POSTE === 'chef' && (S.site == null || !siteInfo(S.site))) {
        var gere = sitesStats().filter(function (s) { return s.manager; });
        var avecLeads = gere.slice().sort(function (a, b) { return leadsDu(b.id_site).length - leadsDu(a.id_site).length; });
        S.site = (avecLeads[0] || sitesStats()[0] || {}).id_site || null;
      }
      if (POSTE === 'vendeur' && S.site == null) S.site = (sitesStats()[0] || {}).id_site || null;
      if (!S._busLu) { S._busLu = true; adopterSite(siteDuBus()); }
      S.erreur = null; S.charge = true;
    }
    async function rafraichir(silencieux) {
      try { await charger(); }
      catch (e) { S.erreur = messageErreur(e); if (!silencieux) toast(S.erreur, true); }
      render();
      if (POSTE !== 'vendeur') chargerAide();
      if (S.dr && S.dr.id && !S.dr.demo) { var l = S.leads.find(function (x) { return Number(x.id_lead) === Number(S.dr.id); }); if (l) { S.dr.l = l; renderDrawerPreserve(); } }
      else if (S.cell && !$drawer.hidden) renderVolet();
    }
    async function chargerCampagnes() {
      var de = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10), a = new Date().toISOString().slice(0, 10);
      var sites = POSTE === 'direction' && !S.vueSite ? null : (sitePoste() != null ? [Number(sitePoste())] : null);
      try {
        if (POSTE === 'vendeur') {
          var r = await Promise.all([
            rpc('get_campagnes_sollicitation', { p_viewer_id_user: Number(MOI), p_date_from: de, p_date_to: a, p_site_ids: null, p_id_user: Number(MOI) }),
            rpc('get_campagne_detail', { p_viewer_id_user: Number(MOI), p_date_from: de, p_date_to: a, p_campagne: null, p_filtre: 'a_traiter', p_site_ids: null, p_id_user: Number(MOI), p_limit: 300 })
          ]);
          S.campagnes = r[0] || []; S.mesSollis = r[1] || [];
        } else {
          var r2 = await Promise.all([
            rpc('get_campagnes_sollicitation', { p_viewer_id_user: Number(MOI), p_date_from: de, p_date_to: a, p_site_ids: sites, p_id_user: null }),
            rpc('get_campagnes_par_vendeur', { p_viewer_id_user: Number(MOI), p_date_from: de, p_date_to: a, p_campagne: null, p_site_ids: sites })
          ]);
          S.campagnes = r2[0] || []; S.campVend = r2[1] || [];
        }
      } catch (e) { S.campagnes = S.campagnes || []; toast(messageErreur(e), true); }
    }

    // ── v62 : suggestion d'attribution et règle du site ───────────────────
    // poste_suggestions : pour chaque lead du Pool, le vendeur que la règle
    // désignerait et POURQUOI (lecture seule). poste_regle_site : la règle,
    // affichée au chef pour qu'il la connaisse.
    async function chargerAide() {
      var sid = sitePoste();
      var ids = libres(sid).map(function (l) { return Number(l.id_lead); }).sort(function (a, b) { return a - b; });
      var key = ids.join(',');
      var fait = false;
      if (key !== S.suggKey) {
        S.suggKey = key;
        if (ids.length) {
          try {
            var r = await rpc('poste_suggestions', { p_ids: ids });
            var m = {}; ((r && r.leads) || []).forEach(function (x) { m[x.id_lead] = x; });
            S.sugg = m; fait = true;
          } catch (e) { S.sugg = {}; }
        } else { S.sugg = {}; }
      }
      if (sid != null && !S.regle[sid]) {
        try { S.regle[sid] = await rpc('poste_regle_site', { p_id_site: Number(sid) }) || { vide: true }; fait = true; }
        catch (e) { S.regle[sid] = { vide: true }; }
      }
      if (fait) render();
    }
    function suggestion(l) { return S.sugg[l.id_lead] || null; }

    // ── v64 : le site de la barre du haut EST le périmètre de la page ─────
    function busApi() { try { return FW.oropraSite || window.oropraSite || null; } catch (e) { return window.oropraSite || null; } }
    function siteDuBus() { var b = busApi(); try { var v = b && b.getSiteId ? b.getSiteId() : null; return v == null ? null : Number(v); } catch (e) { return null; } }
    // Rend vrai si le périmètre a changé.
    function adopterSite(id) {
      if (POSTE === 'vendeur') return false;
      if (POSTE === 'chef') {
        if (id == null || !sitesStats().some(function (s) { return s.manager && Number(s.id_site) === Number(id); })) return false;
        if (Number(S.site) === Number(id)) return false;
        S.site = Number(id);
      } else {
        var v = id == null ? null : (siteInfo(id) ? Number(id) : null);
        if (id != null && v == null) return false;
        if (S.vueSite === v) return false;
        S.vueSite = v;
      }
      S.cell = null; S.campagnes = null; S.suggKey = null;
      return true;
    }
    var __busEcrit = false;
    function ecrireBus(id) {
      var b = busApi(); if (!b || !b.setSiteId || id == null) return;
      if (siteDuBus() === Number(id)) return;
      __busEcrit = true; try { b.setSiteId(Number(id)); } catch (e) {} setTimeout(function () { __busEcrit = false; }, 800);
    }
    function surBus() {
      if (__busEcrit || !S.charge) return;
      if (adopterSite(siteDuBus())) { render(); chargerAide(); if (S.tab === 'campagnes') chargerCampagnes().then(render); }
    }

    // ── Signaux ───────────────────────────────────────────────────────────
    function signaux() {
      var out = [];
      var b = S.bacs || {};
      // v60 : BACS doit être ouvert sur CE poste pour agir sur un lead BACS.
      if (b && b.joignable !== undefined && !b.par_moi) out.push({ id: 'bacs-moi', niv: 'crit', k: 'BACS', titre: 'BACS n\'est pas ouvert sur votre poste', d: 'Rendez-vous, attributions, transferts et clôtures des leads BACS, ainsi que la création d\'un client, sont refusés tant que BACS n\'est pas ouvert dans un onglet de ce navigateur, avec l\'extension One Data.', a: [] });
      if (POSTE === 'vendeur') {
        piscine(null).filter(function (l) { return l.par_plateau && !verrouAutre(l); }).slice(0, 4).forEach(function (l) {
          out.push({ id: 'vr-' + l.id_lead, niv: 'vr', k: 'Qualifié par VROOM', t: l.arrive_le, titre: nomLead(l) + ' · ' + demandeDe(l),
            d: (l.qualification || 'Transmis par le plateau VROOM') + (l.transfere_par_nom ? ' (' + propre(l.transfere_par_nom) + ')' : ''), a: [['Prendre', 'prendre', l.id_lead]] });
        });
        piscine(null).filter(function (l) { return !l.par_plateau && !verrouAutre(l) && mins(l.arrive_le) < 20; }).slice(0, 4).forEach(function (l) {
          out.push({ id: 'np-' + l.id_lead, niv: 'new', k: 'Nouveau dans le Pool', t: l.arrive_le, titre: nomLead(l) + ' · ' + (l.source_libelle || ''), d: demandeDe(l), a: [['Prendre', 'prendre', l.id_lead]] });
        });
        mesLeads().filter(function (l) { return l.attribue_par_nom && l.attribue_le && mins(l.attribue_le) < 1440; }).slice(0, 4).forEach(function (l) {
          out.push({ id: 'att-' + l.id_lead + '-' + l.attribue_le, niv: 'warn', k: 'Attribué par votre chef', t: l.attribue_le, titre: propre(l.attribue_par_nom) + ' vous confie ' + nomLead(l),
            d: demandeDe(l) + ' · arrivé il y a ' + duree(mins(l.arrive_le)), a: [['Ouvrir', 'open', l.id_lead]] });
        });
        var hd = mesLeads().filter(function (l) { return niveau(l) === 'crit'; });
        if (hd.length) out.push({ id: 'vhd-' + hd.length + '-' + hd[0].id_lead, niv: 'crit', k: 'Hors délai', t: hd[0].arrive_le, titre: plural(hd.length, 'lead attend', 'leads attendent') + ' votre appel au-delà du délai',
          d: 'Le plus pressé : ' + nomLead(hd[0]) + ', arrivé il y a ' + duree(mins(hd[0].arrive_le)) + ' (délai ' + slaTxt(slaDe(hd[0])) + ').', a: [['Ouvrir', 'open', hd[0].id_lead]] });
        mesLeads().filter(function (l) { return l.tentatives > 0 && l.tentatives < 3 && l.dernier_essai && mins(l.dernier_essai) >= 120; }).slice(0, 3).forEach(function (l) {
          out.push({ id: 'rap-' + l.id_lead + '-' + l.tentatives, niv: 'warn', k: 'Rappel', t: l.dernier_essai, titre: 'Rappeler ' + nomLead(l),
            d: 'Tentative ' + (l.tentatives + 1) + ' sur 3 · dernier essai ' + quand(l.dernier_essai) + '.', a: [[__lmPeutAppeler() ? 'Appeler' : 'Ouvrir', 'open', l.id_lead]] });
        });
        var sol = (S.mesSollis || []).length;
        if (sol) out.push({ id: 'camp-' + sol, niv: 'info', k: 'Campagne', titre: plural(sol, 'relance de campagne', 'relances de campagne') + ' pour vous', d: 'Des clients que votre chef vous a confiés. Ils comptent dans votre travail, pas dans vos leads entrants.', a: [['Voir', 'tab', 'campagnes']] });
      } else {
        var sid = sitePoste();
        if (POSTE === 'direction' && sid == null) return signauxDirection(out);
        var p = libres(sid);
        var gere = manager(sid);
        p.filter(function (l) { return mins(l.arrive_le) < 15; }).slice(0, 3).forEach(function (l) {
          out.push({ id: 'cnew-' + l.id_lead, niv: l.par_plateau ? 'vr' : 'new', k: l.par_plateau ? 'Transféré par VROOM' : 'Nouveau lead', t: l.arrive_le, titre: nomLead(l) + ' · ' + (l.source_libelle || ''),
            d: demandeDe(l) + '. Dans le Pool, personne ne l\'a encore pris.', a: gere ? [['Attribuer', 'open', l.id_lead]] : [['Ouvrir', 'open', l.id_lead]] });
        });
        var hd2 = p.filter(function (l) { return niveau(l) === 'crit'; }).sort(function (a, b2) { return ts(a.arrive_le) - ts(b2.arrive_le); });
        if (hd2.length) out.push({ id: 'chd-' + hd2.length + '-' + hd2[0].id_lead, niv: 'crit', k: 'Hors délai', t: hd2[0].arrive_le,
          titre: plural(hd2.length, 'lead hors délai', 'leads hors délai') + ' dans le Pool', d: hd2.slice(0, 4).map(function (l) { return nomLead(l) + ' (' + duree(mins(l.arrive_le)) + ')'; }).join(', ') + '. Personne ne les a pris.',
          a: [['Attribuer', 'tab', 'relayer']] });
        var vrp = p.filter(function (l) { return l.par_plateau && mins(l.arrive_le) >= 120; });
        if (vrp.length) out.push({ id: 'cvr-' + vrp.length, niv: 'vr', k: 'Transferts VROOM non pris', t: vrp[0].arrive_le, titre: plural(vrp.length, 'lead qualifié', 'leads qualifiés') + ' par le plateau attend' + (vrp.length > 1 ? 'ent' : '') + ' depuis plus de 2 h',
          d: vrp.slice(0, 4).map(function (l) { return nomLead(l); }).join(', ') + '. Le plateau peut vous relancer.', a: [['Attribuer', 'tab', 'relayer']] });
        var rs = S.leads.filter(function (l) { return Number(l.id_site) === Number(sid) && prisSansAppel(l); });
        if (rs.length) {
          var parV = {}; rs.forEach(function (l) { (parV[l.vendeur_nom] = parV[l.vendeur_nom] || []).push(l); });
          var v0 = Object.keys(parV).sort(function (a, b2) { return parV[b2].length - parV[a].length; })[0];
          out.push({ id: 'crs-' + rs.length, niv: 'warn', k: 'Pris sans appel', t: rs[0].attribue_le, titre: propre(v0) + ' garde ' + plural(parV[v0].length, 'lead', 'leads') + ' sans appeler' + (rs.length > parV[v0].length ? ', ' + (rs.length - parV[v0].length) + ' autres chez l\'équipe' : ''),
            d: rs.slice(0, 4).map(function (l) { return nomLead(l) + ' depuis ' + duree(mins(l.attribue_le)); }).join(', ') + '.', a: [['Voir', 'tab', 'relayer']] });
        }
        var hs = leadsDu(sid).filter(function (l) { return l.zone !== 'plateau' && horsMarque(l); });
        if (hs.length) out.push({ id: 'chs-' + hs.length, niv: 'warn', k: 'Pas pour ce site', t: hs[0].arrive_le, titre: plural(hs.length, 'lead demande', 'leads demandent') + ' une autre marque',
          d: hs.slice(0, 4).map(function (l) { return nomLead(l) + ' → ' + propre(l.marque_lead); }).join(', ') + '.', a: [['Renvoyer', 'tab', 'relayer']] });
        var inj = leadsDu(sid).filter(function (l) { return l.zone === 'vendeur' && l.tentatives >= 3; });
        if (inj.length) out.push({ id: 'cinj-' + inj.length, niv: 'warn', k: 'Injoignables', t: inj[0].dernier_essai, titre: plural(inj.length, 'lead injoignable', 'leads injoignables') + ' après 3 tentatives',
          d: 'Le plateau VROOM peut reprendre la relance, ou le lead peut être clos.', a: [['Voir', 'tab', 'relayer']] });
        var vs = vendeursDu(sid).filter(function (v) { return v.contacts_jour > 0; }).sort(function (a, b2) { return b2.contacts_jour - a.contacts_jour; });
        if (vs.length) out.push({ id: 'cact-' + vs[0].id_user + '-' + vs[0].contacts_jour, niv: 'info', k: 'Activité', t: null, titre: propre(vs[0].nom) + ' : ' + plural(vs[0].contacts_jour, 'premier contact', 'premiers contacts') + ' aujourd\'hui',
          d: 'L\'équipe en est à ' + plural(vs.reduce(function (a, v) { return a + v.contacts_jour; }, 0), 'premier contact', 'premiers contacts') + ' sur la journée.', a: [['Voir le mur', 'tab', 'mur']] });
      }
      return out.filter(function (s) { return !S.ack.has(s.id); });
    }
    function signauxDirection(out) {
      var sites = sitesStats().filter(function (s) { return s.d30_min != null && s.nc30 >= 2; }).sort(function (a, b) { return b.d30_min - a.d30_min; });
      if (sites.length) {
        var w = sites[0];
        out.push({ id: 'd-pire-' + w.id_site + '-' + w.d30_min, niv: w.d30_min > 240 ? 'crit' : 'warn', k: 'Site', t: null, titre: siteNom(w.site) + ' : premier contact en ' + dureeMes(w.d30_min),
          d: 'Moyenne des 30 derniers jours, sur ' + plural(w.nc30, 'lead contacté', 'leads contactés') + '. Le délai le plus long du périmètre.', a: [['Ouvrir', 'voir-site', w.id_site]] });
      }
      var st = S.leads.filter(function (l) { return l.zone !== 'plateau' && mins(l.arrive_le) >= 1440; }).length;
      var arch = sitesStats().reduce(function (a, s) { return a + (Number(s.archives) || 0); }, 0);
      if (st + arch) out.push({ id: 'd-stock-' + (st + arch), niv: 'warn', k: 'Stock', t: null, titre: plural(st + arch, 'lead ouvert', 'leads ouverts') + ' depuis plus de 24 h',
        d: 'Dont ' + arch + ' de plus de ' + ((S.stats && S.stats.arriere_jours) || 30) + ' jours. Ils faussent les délais tant qu\'ils restent ouverts.', a: [['Voir le mur des sites', 'tab', 'mur']] });
      var pl = S.leads.filter(function (l) { return l.zone === 'plateau'; });
      if (pl.length) {
        var old = pl.reduce(function (a, b) { return ts(a.recu_le) < ts(b.recu_le) ? a : b; });
        out.push({ id: 'd-plateau-' + pl.length, niv: 'vr', k: 'Plateau VROOM', t: old.recu_le, titre: plural(pl.length, 'lead attend', 'leads attendent') + ' au plateau VROOM',
          d: 'Le plus ancien depuis ' + duree(mins(old.recu_le)) + ' (' + siteNom(old.site) + ').', a: [['Voir le relais', 'tab', 'relais']] });
      }
      var parSite = {};
      S.leads.filter(function (l) { return l.zone === 'piscine' && niveau(l) === 'crit'; }).forEach(function (l) { parSite[l.id_site] = (parSite[l.id_site] || 0) + 1; });
      Object.keys(parSite).sort(function (a, b) { return parSite[b] - parSite[a]; }).slice(0, 2).forEach(function (sid) {
        var s = siteInfo(sid) || {};
        out.push({ id: 'd-hd-' + sid + '-' + parSite[sid], niv: 'crit', k: 'Hors délai', t: null, titre: siteNom(s.site) + ' : ' + plural(parSite[sid], 'lead hors délai', 'leads hors délai') + ' dans le Pool',
          d: 'Personne ne les a pris.' + (s.chefs ? ' Chef des ventes : ' + propre(s.chefs) + '.' : ''), a: [['Ouvrir', 'voir-site', sid]] });
      });
      return out.filter(function (s) { return !S.ack.has(s.id); });
    }
    function renderSignaux(list) {
      var h = '<div class="zh"><h2>Signaux <span class="cnt">' + list.length + '</span></h2><p>Ce qui vous arrive. Chaque signal porte son action.</p></div>';
      if (!list.length) return h + '<div class="sig-empty">Aucun signal en attente. Les nouveaux leads et les retards apparaîtront ici dès qu\'ils se produisent.</div>';
      list.forEach(function (s) {
        h += '<div class="sg ' + s.niv + (S.frais.has(s.id) ? ' fresh' : '') + '"><span class="sg-m"></span><div>'
          + '<div class="sg-top"><span class="sg-k">' + esc(s.k) + '</span><span class="sg-h">' + (s.t ? esc(quand(s.t)) : '') + '</span></div>'
          + '<p class="sg-t">' + esc(s.titre) + '</p><p class="sg-d">' + esc(s.d) + '</p>'
          + '<div class="sg-a">' + s.a.map(function (a, i) { return '<button type="button" class="btn sm' + (i === 0 ? (s.niv === 'vr' ? ' vr' : ' pri') : '') + '" data-a="' + a[1] + '" data-id="' + esc(a[2]) + '">' + esc(a[0]) + '</button>'; }).join('')
          + '<button type="button" class="btn sm ghost" data-a="ack" data-id="' + esc(s.id) + '">Vu</button></div></div></div>';
      });
      return h;
    }

    // ── En-tête : une phrase et le bouton « suivant » (v62) ───────────────
    function lienAncien() { return ' <button type="button" class="lien" data-a="ancien">Tableaux détaillés</button>'; }
    function aRappeler() { return mesLeads().filter(function (l) { return !l.tentatives; }); }
    function aRelancer() { return mesLeads().filter(function (l) { return l.tentatives > 0; }); }
    function poolNom(sid) {
      if (sid != null) return 'Pool ' + siteNom((siteInfo(sid) || {}).site);
      var ss = sitesVendeur();
      return ss.length === 1 ? 'Pool ' + siteNom(ss[0].site) : 'Pool de vos sites';
    }
    function reste(l) { return slaDe(l) - mins(arrive(l)); }
    function retardsEquipe(sid) { return S.leads.filter(function (l) { return l.zone === 'vendeur' && (sid == null || Number(l.id_site) === Number(sid)) && niveau(l) === 'crit'; }).length; }
    function libPerim() {
      var sid = sitePoste();
      return sid == null ? 'Tous mes sites' : siteNom((siteInfo(sid) || {}).site);
    }
    function sitesSelecteur() { return POSTE === 'chef' ? sitesStats().filter(function (s) { return s.manager; }) : sitesStats(); }
    // Le sélecteur de périmètre : le même arbre que le Suivi activité
    // (marque › affaire › site). Direction : « Tous mes sites » en tête.
    function perimetreHtml() {
      var ss = sitesSelecteur();
      if (POSTE === 'chef' && ss.length < 2) return '';
      var sid = sitePoste();
      var h = '<div class="perim"><button type="button" class="perim-btn" data-a="perim-ouvrir" aria-expanded="' + !!S.perimOuvert + '">Périmètre : ' + esc(libPerim()) + ' <span aria-hidden="true">▾</span></button>';
      if (S.perimOuvert) {
        var arbre = {};
        ss.forEach(function (s) {
          var m = propre(s.reseau || 'Autres'), a = propre(s.affaire || '');
          ((arbre[m] = arbre[m] || {})[a] = arbre[m][a] || []).push(s);
        });
        h += '<div class="perim-pop" role="menu"><p class="perim-cap">Marque › affaire › site</p>';
        if (POSTE === 'direction') h += '<button type="button" class="l0' + (sid == null ? ' on' : '') + '" data-a="perim" data-id="">Tous mes sites</button>';
        Object.keys(arbre).sort().forEach(function (m) {
          h += '<p class="perim-m">' + esc(m) + '</p>';
          Object.keys(arbre[m]).sort().forEach(function (a) {
            if (a && Object.keys(arbre[m]).length > 1) h += '<p class="perim-a">' + esc(a) + '</p>';
            arbre[m][a].forEach(function (s) {
              h += '<button type="button" class="l2' + (Number(s.id_site) === Number(sid) ? ' on' : '') + '" data-a="perim" data-id="' + s.id_site + '">' + esc(siteNom(s.site)) + '</button>';
            });
          });
        });
        h += '</div>';
      }
      return h + '</div>';
    }
    function renderSituation() {
      var nom = S.comme ? propre(S.comme.nom) : propre((S.stats && S.stats.nom) || [user && user.prenom, user && user.nom].filter(Boolean).join(' '));
      var pre = prenom(nom);
      var cta = '', p = '', lbl = '';
      if (POSTE === 'vendeur') {
        var ml = mesLeads(), crit = ml.filter(function (x) { return niveau(x) === 'crit'; }).length;
        var li = libres(null).length, s = ml[0];
        lbl = esc(sitesVendeur().length === 1 ? siteNom(sitesVendeur()[0].site) : plural(sitesVendeur().length, 'site')) + ' · ' + esc(nom);
        p = '<b>' + plural(ml.length, 'lead à rappeler', 'leads à rappeler') + '</b>'
          + (crit ? ' · <b class="t-crit">' + crit + ' en retard</b>' : '')
          + (s && reste(s) > 0 ? ' · le prochain expire dans <b>' + duree(reste(s)) + '</b>' : '')
          + ' · <b>' + plural(li, 'lead libre', 'leads libres') + '</b> dans le ' + esc(poolNom()) + '.';
        if (s) {
          var rs = reste(s);
          cta = '<button type="button" class="cta" data-a="appeler" data-id="' + s.id_lead + '">' + (__lmPeutAppeler() ? 'Appeler le suivant' : 'Traiter le suivant')
            + '<small>' + esc(nomLead(s)) + ' · ' + (rs < 0 ? 'en retard de ' + duree(-rs) : 'expire dans ' + duree(rs)) + '</small></button>';
        } else if (li) {
          var o = libres(null).slice().sort(function (a, b) { return reste(a) - reste(b); })[0];
          cta = '<button type="button" class="cta" data-a="prendre" data-id="' + o.id_lead + '">Prendre dans le Pool<small>' + esc(nomLead(o)) + ' · ' + esc(demandeDe(o)) + '</small></button>';
        }
      } else {
        var sid = sitePoste();
        var pool = libres(sid), hd = pool.filter(function (x) { return niveau(x) === 'crit'; }).length;
        var bl = bloques(sid).length, ret = retardsEquipe(sid);
        lbl = (POSTE === 'chef' ? 'Chef des ventes' : 'Direction') + ' · ' + esc(nom);
        var nbV = {}; bloques(sid).forEach(function (l) { nbV[l.id_user_attribue] = 1; });
        p = (pool.length ? '<b>' + plural(pool.length, 'lead', 'leads') + '</b> ' + (pool.length > 1 ? 'attendent' : 'attend') + ' dans le Pool' + (hd ? ', dont <b class="t-crit">' + hd + ' hors délai</b>' : '') : 'Le Pool est vide')
          + (bl ? ' · <b class="t-crit">' + bl + ' en souffrance</b> chez ' + plural(Object.keys(nbV).length, 'vendeur') : ' · aucun lead en souffrance') + '.';
        if (sid != null && !manager(sid)) p += ' <span class="t-mut">Vue de pilotage : le chef des ventes du site agit sur ses leads.</span>';
        var aAttr = pool.filter(function (l) { var g = suggestion(l); return manager(l.id_site) && g && g.id_user; });
        if (aAttr.length) cta = '<button type="button" class="cta" data-a="tout-attribuer">Attribuer ' + (aAttr.length > 1 ? 'les ' + aAttr.length + ' leads du Pool' : 'le lead du Pool') + '<small>' + (aAttr.length > 1 ? 'chacun au vendeur suggéré' : 'au vendeur suggéré') + '</small></button>';
      }
      var analyses = '';
      return '<section class="hello"><div class="hello-t">' + (POSTE !== 'vendeur' ? perimetreHtml() : '')
        + '<p class="hello-l">' + lbl + analyses + '</p>'
        + '<h1>' + (POSTE === 'vendeur' ? 'Bonjour ' + esc(pre || '') : esc(libPerim()) + ' · aujourd\'hui') + '</h1><p class="hello-p">' + p + '</p></div>' + cta + '</section>';
    }
    function bandeauBacsSite() {
      var b = S.bacs || {};
      if (b.joignable === undefined || b.par_moi) return '';
      return '<div class="bacs-l" role="alert"><b>BACS fermé sur ce poste.</b><span>Les gestes sur les leads BACS (attribution, rendez-vous, clôture) sont refusés tant que BACS n\'est pas ouvert dans un onglet de ce navigateur.</span></div>';
    }

    // ── Filtres-pastilles ─────────────────────────────────────────────────
    function onglets() {
      if (POSTE === 'vendeur') {
        return [['pool', poolNom(), libres(null).length, false, 'v'],
                ['arappeler', 'À rappeler', aRappeler().length, aRappeler().some(function (l) { return niveau(l) === 'crit'; }), 'r'],
                ['relances', 'Relances', aRelancer().length, false, 'b'],
                ['campagnes', 'Campagnes', S.mesSollis ? S.mesSollis.length : null, false, 'b']].filter(function (o) { return !(S.comme && o[0] === 'campagnes'); });
      }
      var sid = sitePoste(), pool = libres(sid);
      return [['pool', sid == null ? 'Pool' : poolNom(sid), pool.length, pool.some(function (l) { return niveau(l) === 'crit'; }), 'v'],
              ['bloques', 'En souffrance', bloques(sid).length, bloques(sid).length > 0, 'r'],
              ['campagnes', 'Campagnes', null, false, 'b']];
    }
    function renderTabs() {
      var analyse = ['mur', 'mursites', 'relais'].indexOf(S.tab) !== -1;
      return '<div class="tabs" role="tablist">' + (analyse ? '<button type="button" data-a="tab" data-id="pool">← Retour au Pool</button>' : '') + onglets().map(function (o) {
        var on = o[0] === S.tab;
        return '<button type="button" role="tab" aria-selected="' + on + '" class="' + (on ? 'on' : '') + (o[4] ? ' t-' + o[4] : '') + '" data-a="tab" data-id="' + o[0] + '">' + esc(o[1])
          + (o[2] != null ? ' <span class="cnt ' + (o[2] === 0 ? 'z' : (o[3] ? 'c' : '')) + '">' + o[2] + '</span>' : '') + '</button>';
      }).join('') + '</div>';
    }

    // ── Lignes v62 : compte à rebours, qui, source, UN bouton ─────────────
    function rebours(l) {
      var m = mins(arrive(l));
      if (m >= 1440) return '<span class="tm crit"><b>' + duree(m) + '</b><small>arrivé le ' + jour(arrive(l)) + '</small></span>';
      var r = slaDe(l) - m;
      if (r <= 0) return '<span class="tm crit"><b>+' + duree(-r) + '</b><small>hors délai</small></span>';
      return '<span class="tm ' + (r <= slaDe(l) * 0.4 ? 'warn' : 'ok') + '"><b>' + duree(r) + '</b><small>avant le délai</small></span>';
    }
    function etatCourt(l) {
      if (l.tentatives) return 'pas joint ×' + l.tentatives + (l.dernier_essai ? ', ' + quand(l.dernier_essai) : '');
      if (l.par_plateau) return 'qualifié par VROOM';
      if (l.zone === 'piscine') return 'libre';
      return 'nouveau';
    }
    function ligneAction(l, act) {
      var a;
      if (act === 'prendre') a = verrouAutre(l) ? '<span class="resa-l">Réservé par ' + esc(propre(l.verrou_nom || 'un collègue')) + '</span>' : '<button type="button" class="btn vr" data-a="prendre" data-id="' + l.id_lead + '">Prendre</button>';
      else a = '<button type="button" class="btn pri" data-a="appeler" data-id="' + l.id_lead + '">' + (__lmPeutAppeler() ? (l.tentatives ? 'Rappeler' : 'Appeler') : 'Traiter') + '</button>';
      return '<div class="lr v2' + univCls(l) + '" data-a="open" data-id="' + l.id_lead + '" tabindex="0"><div>' + rebours(l) + '</div>'
        + '<div class="who"><span class="lr-n">' + esc(nomLead(l)) + '</span><p class="lr-d">' + esc(demandeDe(l)) + ' · ' + esc(etatCourt(l)) + '</p></div>'
        + '<div class="src">' + univTag(l) + '<span class="tag">' + esc(l.source_libelle || l.source || 'Lead') + '</span></div>'
        + '<div class="lr-a">' + a + '</div></div>';
    }
    function ligneAttrib(l, bloque) {
      var g = suggestion(l), gere = manager(l.id_site);
      var why = bloque ? (l.vendeur_nom ? 'Chez ' + propre(l.vendeur_nom) + (l.attribue_le ? ' depuis ' + duree(mins(l.attribue_le)) : '') + (l.tentatives ? ' · ' + plural(l.tentatives, 'tentative') : ' · pas encore appelé') : '')
        : g ? (g.id_user ? 'Suggéré : ' + propre(g.nom) + ' — ' + g.raison : 'Aucun vendeur disponible') : '';
      var a;
      if (!gere) a = '<button type="button" class="btn" data-a="open" data-id="' + l.id_lead + '">Ouvrir</button>';
      else a = '<select id="sel-' + l.id_lead + '" aria-label="Vendeur">' + optionsVendeurs(l.id_site, bloque ? l.id_user_attribue : null, g && g.id_user) + '</select>'
        + '<button type="button" class="btn pri" data-a="attribuer" data-id="' + l.id_lead + '">' + (bloque ? 'Réattribuer' : 'Attribuer') + '</button>';
      if (bloque) {
        var vn = propre(l.vendeur_nom || 'Un vendeur');
        var ini = vn.split(/\s+/).filter(Boolean).slice(0, 2).map(function (x) { return x[0]; }).join('').toUpperCase();
        var depuis = (l.attribue_le ? 'depuis ' + duree(mins(l.attribue_le)) : '') + (l.tentatives ? ' · ' + plural(l.tentatives, 'tentative') : ' · pas encore appelé');
        return '<div class="lr v2 attr souf' + univCls(l) + '" data-a="open" data-id="' + l.id_lead + '" tabindex="0"><div>' + rebours(l) + '</div>'
          + '<div class="who"><span class="lr-n">' + esc(nomLead(l)) + '</span>' + (sitePoste() == null ? ' <span class="lr-v">' + esc(siteNom(l.site)) + '</span>' : '')
          + '<p class="lr-d">' + esc(demandeDe(l)) + ' · ' + esc(l.source_libelle || l.source || 'Lead') + '</p></div>'
          + '<div class="chez"><span class="av">' + esc(ini) + '</span><span class="chez-t"><small>En souffrance chez</small><b>' + esc(vn) + '</b><em>' + esc(depuis) + '</em></span></div>'
          + '<div class="lr-a">' + a + '</div></div>';
      }
      return '<div class="lr v2 attr' + univCls(l) + '" data-a="open" data-id="' + l.id_lead + '" tabindex="0"><div>' + rebours(l) + '</div>'
        + '<div class="who"><span class="lr-n">' + esc(nomLead(l)) + '</span>' + (sitePoste() == null ? ' <span class="lr-v">' + esc(siteNom(l.site)) + '</span>' : '')
        + '<p class="lr-d">' + esc(demandeDe(l)) + '</p>' + (why ? '<p class="why">' + esc(why) + '</p>' : '') + '</div>'
        + '<div class="src">' + univTag(l) + '<span class="tag">' + esc(l.source_libelle || l.source || 'Lead') + '</span></div>'
        + '<div class="lr-a">' + a + '</div></div>';
    }

    // ── Vues : vendeur ────────────────────────────────────────────────────
    function vueListeVendeur() {
      var rel = S.tab === 'relances';
      var ls = rel ? aRelancer() : aRappeler();
      var h = '<div class="list">';
      if (!ls.length) h += '<div class="empty">' + (rel ? 'Aucune relance en attente.' : 'Rien à rappeler.' + (libres(null).length ? ' Des leads attendent dans le ' + esc(poolNom()) + '.' : '')) + '</div>';
      ls.forEach(function (l) { h += ligneAction(l, 'appeler'); });
      h += '</div>';
      var arch = Number((S.stats || {}).mes_archives) || 0;
      if (arch && !rel) h += '<p class="foot">' + (arch > 1 ? arch + ' autres leads vous sont encore attribués' : 'Un autre lead vous est encore attribué') + ', reçu' + (arch > 1 ? 's' : '') + ' il y a plus de ' + ((S.stats && S.stats.arriere_jours) || 30) + ' jours : votre chef des ventes les solde.</p>';
      return h;
    }
    function vuePiscineVendeur() {
      var ls = piscine(null).sort(function (a, b) { return reste(a) - reste(b); });
      var h = '<div class="list">';
      if (!ls.length) h += '<div class="empty">Le Pool est vide.</div>';
      ls.forEach(function (l) { h += ligneAction(l, 'prendre'); });
      return h + '</div><p class="foot">Libre-service : premier arrivé, premier servi. Un lead pris passe dans « À rappeler » ; s\'il ne vous concerne pas, rendez-le au Pool.</p>';
    }
    function vueCampagnesVendeur() {
      var h = '';
      if (!S.campagnes) return '<div class="empty">Chargement des campagnes…</div>';
      if (!S.campagnes.length) return '<div class="empty">Aucune campagne ne vous a été confiée ces 90 derniers jours.</div>';
      S.campagnes.forEach(function (c) {
        var cibles = (S.mesSollis || []).filter(function (t2) { return t2.campagne === c.campagne; });
        var n = Number(c.nb_sollicitations) || 0, tr = Number(c.nb_traitees) || 0, pct = n ? Math.round(100 * tr / n) : 0;
        h += '<div class="sub"><div class="sub-h"><h3>' + esc(c.campagne) + '</h3><span class="prog"><span class="num">' + tr + ' / ' + n + ' traités</span><span class="bar' + (pct < 40 ? ' low' : '') + '"><i style="width:' + pct + '%"></i></span></span></div><div class="list">';
        if (!cibles.length) h += '<div class="empty">Tous les clients de cette campagne sont traités.</div>';
        cibles.slice(0, 80).forEach(function (t2) {
          h += '<div class="lr v2" data-a="fiche" data-id="' + esc(t2.id_client) + '" tabindex="0"><div><span class="tm ' + (t2.anciennete_j >= 3 ? 'warn' : 'ok') + '"><b>' + (t2.anciennete_j ? plural(t2.anciennete_j, 'jour') : 'aujourd\'hui') + '</b><small>depuis le lancement</small></span></div>'
            + '<div class="who"><span class="lr-n">' + esc(propre(t2.client_nom)) + '</span><p class="lr-d">' + esc(siteNom(t2.nom_site)) + '</p></div><div class="src"><span class="tag camp">Campagne</span></div>'
            + '<div class="lr-a"><button type="button" class="btn pri" data-a="fiche" data-id="' + esc(t2.id_client) + '">Ouvrir la fiche</button></div></div>';
        });
        h += '</div></div>';
      });
      return h + '<p class="foot">Une relance est comptée comme traitée quand vous faites votre compte rendu sur la fiche du client.</p>';
    }

    // ── Vues : chef des ventes et direction ───────────────────────────────
    function bloques(sid) {
      return S.leads.filter(function (l) {
        if (l.zone !== 'vendeur' || (sid != null && Number(l.id_site) !== Number(sid))) return false;
        return prisSansAppel(l) || niveau(l) === 'crit' || niveau(l) === 'stock' || l.tentatives >= 3;
      }).sort(function (a, b) { return reste(a) - reste(b); });
    }
    function texteRegle(r) {
      if (!r || r.vide) return '';
      var crit = [];
      if (r.priorite_cycle) crit.push('le vendeur qui suit déjà le client');
      if (r.vendeur_habituel) crit.push('son vendeur habituel (' + (r.vendeur_habituel_mois || 12) + ' derniers mois)');
      crit.push(r.repartition === 'sequentiel' ? 'le suivant du tour de rôle'
        : r.repartition === 'conversion' ? 'le vendeur le moins chargé, et à charge égale celui qui convertit le mieux'
        : 'le vendeur le moins chargé');
      var c = crit.join(', sinon ');
      var h = r.mode === 'libre' ? '<b>Libre-service</b> : les vendeurs prennent eux-mêmes leurs leads dans le Pool. Quand vous attribuez, One Data suggère ' + c + '.'
        : r.mode === 'manuel' ? '<b>Attribution par le chef des ventes</b> : vous attribuez chaque lead. One Data suggère ' + c + '.'
        : '<b>Attribution automatique</b> : chaque lead part aussitôt chez ' + c + '. Le Pool ne garde que ceux qu\'aucun vendeur ne peut prendre.';
      if (r.filtre_vn_vo) h += ' Un lead VO ne va qu\'aux vendeurs VO.';
      var ex = (r.exclus || []).filter(function (e) { return !/recette|administration/i.test(e.motif || ''); });
      if (ex.length) h += ' Écartés du tour de rôle : ' + ex.map(function (e) { return esc(propre(e.nom)) + (e.au ? ' (jusqu\'au ' + jour(e.au) + ')' : ''); }).join(', ') + '.';
      return h;
    }
    function regleHtml(sid) {
      if (sid == null) return '<div class="regle"><span class="i" aria-hidden="true">i</span><div>Chaque site applique sa propre règle d\'attribution. Choisissez un site dans le périmètre pour la voir.</div></div>';
      var r = S.regle[sid];
      if (!r || r.vide) return '';
      return '<div class="regle"><span class="i" aria-hidden="true">i</span><div><b>Règle d\'attribution de ' + esc(siteNom((siteInfo(sid) || {}).site)) + '.</b> ' + texteRegle(r)
        + (r.peut_modifier ? ' <button type="button" class="lien" data-a="regle-modifier" data-id="' + sid + '">Modifier la règle</button>' : '') + '</div></div>';
    }
    function ageLead(l) {
      var m = mins(arrive(l)), r = slaDe(l) - m;
      if (m >= 1440) return '<div class="age r"><b>' + duree(m) + '</b><small>en attente</small></div>';
      if (r <= 0) return '<div class="age o"><b>' + duree(m) + '</b><small>hors délai</small></div>';
      return '<div class="age v"><b>' + duree(r) + '</b><small>avant le délai</small></div>';
    }
    function carteLead(l) {
      var g = suggestion(l), gere = manager(l.id_site), ch = S.choix && S.choix[l.id_lead];
      var act;
      if (!gere) act = '<button type="button" class="btn" data-a="open" data-id="' + l.id_lead + '">Ouvrir</button>';
      else if (ch || !(g && g.id_user)) act = '<div class="choix"><select id="sel-' + l.id_lead + '" aria-label="Vendeur">' + optionsVendeurs(l.id_site, null, g && g.id_user) + '</select><button type="button" class="btn pri" data-a="attribuer" data-id="' + l.id_lead + '">Attribuer</button>'
        + (g && g.id_user ? '<button type="button" class="btn ghost sm" data-a="choix" data-id="' + l.id_lead + '">Annuler</button>' : '') + '</div>';
      else act = '<div class="go"><button type="button" class="main" data-a="attribuer-sugg" data-id="' + l.id_lead + '">Attribuer à ' + esc(prenom(g.nom)) + '<small>' + esc(g.raison) + '</small></button>'
        + '<button type="button" class="alt" data-a="choix" data-id="' + l.id_lead + '" title="Choisir un autre vendeur" aria-label="Choisir un autre vendeur">▾</button></div>';
      return '<div class="carte-l' + univCls(l) + '" data-a="open" data-id="' + l.id_lead + '" tabindex="0">' + ageLead(l)
        + '<div class="qui"><b>' + esc(nomLead(l)) + (sitePoste() == null ? ' <span class="lr-v">' + esc(siteNom(l.site)) + '</span>' : '') + '</b><p>' + esc(demandeDe(l)) + '</p>' + univTag(l) + '<span class="src">' + esc(l.source_libelle || l.source || 'Lead') + '</span></div>'
        + act + '</div>';
    }
    function vuePool() {
      var sid = sitePoste();
      var ls = libres(sid).slice().sort(function (a, b) { return reste(a) - reste(b); });
      var h = regleHtml(sid) + '<div class="cartes">';
      if (!ls.length) h += '<div class="vide">Le Pool est vide : chaque lead a son vendeur.</div>';
      ls.slice(0, 150).forEach(function (l) { h += carteLead(l); });
      if (ls.length > 150) h += '<div class="vide">… et ' + (ls.length - 150) + ' autres.</div>';
      h += '</div>';
      var st = sid != null ? stockDu(sid) + (Number((siteInfo(sid) || {}).archives) || 0) : 0;
      if (st && manager(sid)) h += '<div class="stock-l"><span>' + plural(st, 'lead ouvert', 'leads ouverts') + ' depuis plus de 24 h faussent les délais du site.</span><button type="button" class="btn" data-a="solder" data-id="' + sid + '">Solder le stock</button></div>';
      return h + equipeHtml(sid);
    }
    function groupesSouffrance(sid) {
      var g = {};
      bloques(sid).forEach(function (l) {
        var k = l.id_user_attribue + '|' + l.id_site;
        (g[k] = g[k] || { uid: l.id_user_attribue, site: l.id_site, nom: propre(l.vendeur_nom || 'Vendeur'), ls: [] }).ls.push(l);
      });
      return Object.keys(g).map(function (k) {
        var x = g[k];
        x.ls.sort(function (a, b) { return ts(a.attribue_le || a.arrive_le) - ts(b.attribue_le || b.arrive_le); });
        x.vieux = Math.max.apply(null, x.ls.map(function (l) { return mins(l.attribue_le || arrive(l)); }));
        x.appels = x.ls.reduce(function (a, l) { return a + (l.tentatives || 0); }, 0);
        return x;
      }).sort(function (a, b) { return (b.ls.length - a.ls.length) || (b.vieux - a.vieux); });
    }
    function vueBloques() {
      var sid = sitePoste();
      var gs = groupesSouffrance(sid);
      if (!gs.length) return '<div class="vide">Aucun lead en souffrance : chaque vendeur traite les siens dans le délai.</div>';
      var h = '';
      gs.forEach(function (x) {
        var ini = x.nom.split(/\s+/).filter(Boolean).slice(0, 2).map(function (s) { return s[0]; }).join('').toUpperCase();
        var gere = manager(x.site), ids = x.ls.map(function (l) { return l.id_lead; }).join(',');
        h += '<section class="vend"><header class="vend-h"><span class="av' + (x.vieux >= 1440 ? '' : ' o') + '">' + esc(ini) + '</span>'
          + '<div class="nm"><b>' + esc(x.nom) + (sitePoste() == null ? ' <span class="lr-v">' + esc(siteNom((siteInfo(x.site) || {}).site)) + '</span>' : '') + '</b>'
          + '<span><em>' + plural(x.ls.length, 'lead en souffrance', 'leads en souffrance') + '</em> · le plus ancien depuis ' + duree(x.vieux) + ' · ' + (x.appels ? plural(x.appels, 'appel sans réponse', 'appels sans réponse') : 'aucun appel') + '</span></div>'
          + (gere ? '<div class="acts"><button type="button" class="btn" data-a="prevenir" data-id="' + x.uid + '|' + ids + '">Prévenir</button><button type="button" class="btn pri" data-a="tout-reattr" data-id="' + x.uid + '|' + x.site + '|' + ids + '">Tout réattribuer…</button></div>' : '')
          + '</header><div class="ls">';
        x.ls.forEach(function (l) {
          var m = mins(l.attribue_le || arrive(l));
          var sous = l.tentatives ? plural(l.tentatives, 'essai') : niveau(l) === 'crit' && m < 1440 ? 'hors délai' : 'sans appel';
          h += '<div class="l" data-a="open" data-id="' + l.id_lead + '" tabindex="0"><div class="d">' + duree(m) + '<small>' + sous + '</small></div>'
            + '<div class="qui"><b>' + esc(nomLead(l)) + '</b><p>' + esc(demandeDe(l)) + ' · ' + esc(l.source_libelle || l.source || 'Lead') + '</p></div>'
            + (gere ? '<button type="button" class="lien-r" data-a="open" data-id="' + l.id_lead + '">Réattribuer ›</button>' : '') + '</div>';
        });
        h += '</div></section>';
      });
      return h + '<p class="foot">En souffrance : pris sans appel depuis plus de 20 min, délai dépassé, gardé plus de 24 h, ou trois essais sans joindre le client.</p>';
    }
    function prevenir(v) {
      var p = String(v).split('|'), uid = Number(p[0]), ids = (p[1] || '').split(',').map(Number).filter(Boolean);
      return geste(async function () {
        var r = await rpc('poste_prevenir_vendeur', { p_id_user: uid, p_ids: ids });
        if (r && r.ok === false) { toast(r.motif || 'Impossible de prévenir ce vendeur.', true); return; }
        toast(nomVendeur(uid) + ' est prévenu : ' + plural((r && r.leads) || ids.length, 'lead en souffrance', 'leads en souffrance') + '.');
      });
    }
    function modalToutReattr(v) {
      var p = String(v).split('|'), uid = p[0], site = p[1], ids = p[2];
      var n = ids.split(',').filter(Boolean).length;
      ouvrirModal('<div class="mb-h"><div><h2>Réattribuer les ' + plural(n, 'lead', 'leads') + ' de ' + esc(nomVendeur(uid)) + '</h2><p>Ils partent tous chez le même collègue, ou retournent dans le Pool.</p></div><button type="button" class="x" data-a="modal-close" aria-label="Fermer">' + X_SVG + '</button></div>'
        + '<div class="mb-b"><label class="opt"><input type="radio" name="tr" value="pool" checked><span><b>Les rendre au Pool</b><small>Libres pour tous les vendeurs du site.</small></span></label>'
        + '<label class="opt"><input type="radio" name="tr" value="vend"><span><b>Les confier à un collègue</b><small><select id="tr-vend">' + optionsVendeurs(site, uid) + '</select></small></span></label></div>'
        + '<div class="mb-f"><button type="button" class="btn ghost" data-a="modal-close">Annuler</button><button type="button" class="btn pri" data-a="tout-reattr-ok" data-id="' + esc(ids) + '">Réattribuer</button></div>');
    }
    function toutReattrOk(ids) {
      var mode = ($modal.querySelector('input[name="tr"]:checked') || {}).value, vend = ($modal.querySelector('#tr-vend') || {}).value;
      var liste = String(ids).split(',').map(Number).filter(Boolean);
      return geste(async function () {
        var ok = 0;
        for (var i = 0; i < liste.length; i++) {
          try {
            if (mode === 'vend' && vend) await rpc('poste_attribuer', { p_id_lead: liste[i], p_id_user: Number(vend) });
            else await rpc('poste_rendre', { p_id_lead: liste[i], p_motif: 'en souffrance' });
            ok++;
          } catch (e) {}
        }
        fermerModal(); S.suggKey = null;
        apres(plural(ok, 'lead réattribué', 'leads réattribués') + (mode === 'vend' && vend ? ' à ' + nomVendeur(vend) : ' au Pool') + '.', true);
      });
    }
    function attribuerSugg(id) {
      var l = leadDe(id), g = suggestion(l);
      if (!g || !g.id_user) return;
      return geste(async function () {
        await rpc('poste_attribuer', { p_id_lead: Number(id), p_id_user: Number(g.id_user) });
        S.suggKey = null;
        apres(nomLead(l) + ' attribué à ' + propre(g.nom) + '.', true);
      });
    }
    function equipeHtml(sid) {
      if (sid == null) {
        var cartes = sitesStats().map(function (s) {
          var pool = libres(s.id_site), hd = pool.filter(function (l) { return niveau(l) === 'crit'; }).length;
          return { s: s, pool: pool.length, hd: hd, ret: retardsEquipe(s.id_site), vend: S.leads.filter(function (l) { return l.zone === 'vendeur' && Number(l.id_site) === Number(s.id_site); }).length };
        }).filter(function (c) { return c.pool || c.vend || c.s.n7; })
          .sort(function (a, b) { return (b.hd + b.ret) - (a.hd + a.ret) || b.pool - a.pool; });
        if (!cartes.length) return '';
        return '<h3 class="sec-t">Les sites</h3><div class="team">' + cartes.map(function (c) {
          return '<button type="button" class="mate" data-a="perim" data-id="' + c.s.id_site + '"><span class="nm">' + esc(siteNom(c.s.site))
            + (c.hd + c.ret ? '<span class="pill crit">' + (c.hd + c.ret) + ' en retard</span>' : '<span class="pill ok">à jour</span>') + '</span>'
            + '<span class="st"><span><b>' + c.pool + '</b>dans le Pool</span><span><b>' + c.vend + '</b>chez les vendeurs</span></span>'
            + '<span class="mate-lg">1er contact médian, 30 j : ' + (c.s.d30_min != null ? dureeMes(c.s.d30_min) : '—') + '</span></button>';
        }).join('') + '</div>';
      }
      var vs = vendeursDu(sid).map(function (v) {
        var ls = S.leads.filter(function (l) { return l.zone === 'vendeur' && Number(l.id_site) === Number(sid) && Number(l.id_user_attribue) === Number(v.id_user); });
        var vieux = ls.reduce(function (a, l) { return Math.max(a, mins(arrive(l))); }, 0);
        return { v: v, n: ls.length, ret: ls.filter(function (l) { return niveau(l) === 'crit' || niveau(l) === 'stock'; }).length, vieux: vieux, critV: ls.some(function (l) { return niveau(l) === 'crit' || niveau(l) === 'stock'; }) };
      });
      var actifs = vs.filter(function (x) { return x.n || x.v.contacts_jour || x.v.pris_jour; })
        .sort(function (a, b) { return (b.ret - a.ret) || (b.n - a.n); });
      var autres = vs.filter(function (x) { return actifs.indexOf(x) === -1; });
      var carte = function (x) {
        return '<button type="button" class="mate" data-a="cell" data-id="' + x.v.id_user + '|tous"><span class="nm">' + esc(propre(x.v.nom))
          + (x.ret ? '<span class="pill crit">' + x.ret + ' en souffrance</span>' : '<span class="pill ok">à jour</span>') + '</span>'
          + '<span class="st"><span><b>' + x.n + '</b>en cours</span><span><b class="' + (x.critV ? 't-crit' : '') + '">' + (x.n ? duree(x.vieux) : '—') + '</b>plus ancien</span></span>'
          + '<span class="mate-lg">' + plural(x.v.contacts_jour || 0, 'premier contact', 'premiers contacts') + ' · ' + (x.v.pris_jour || 0) + ' pris aujourd\'hui' + (x.v.exclu ? ' · écarté du tour de rôle' : '') + '</span></button>';
      };
      var h = '<h3 class="sec-t">L\'équipe</h3>';
      if (!actifs.length && !autres.length) return h + '<div class="empty">Aucun vendeur rattaché à ce site.</div>';
      h += '<div class="team">' + actifs.map(carte).join('') + (S.autresVendeurs ? autres.map(carte).join('') : '') + '</div>';
      if (autres.length) h += '<button type="button" class="btn ghost sm" data-a="autres-vendeurs">' + (S.autresVendeurs ? 'Masquer' : 'Afficher') + ' les ' + plural(autres.length, 'autre vendeur', 'autres vendeurs') + ', sans lead en cours</button>';
      return h;
    }

    // ── Lignes ────────────────────────────────────────────────────────────
    function ligneLead(l, opt2) {
      opt2 = opt2 || {};
      var a = '';
      if (opt2.action === 'attribuer') a = '<button type="button" class="btn sm pri" data-a="open" data-id="' + l.id_lead + '">' + (l.id_user_attribue ? 'Réattribuer' : 'Attribuer') + '</button>';
      else if (opt2.action === 'voir') a = '<button type="button" class="btn sm" data-a="open" data-id="' + l.id_lead + '">Ouvrir</button>';
      else if (verrouAutre(l)) a = '<span class="resa-l">Réservé par ' + esc(propre(l.verrou_nom || 'un collègue')) + '<br>jusqu\'à ' + hh(l.verrou_jusqu) + '</span>';
      else if (l.zone === 'piscine') a = '<button type="button" class="btn pri" data-a="prendre" data-id="' + l.id_lead + '">Prendre</button>';
      else a = '<button type="button" class="btn" data-a="open" data-id="' + l.id_lead + '">Ouvrir</button>';
      var qui = opt2.qui && l.vendeur_nom ? ' · chez ' + propre(l.vendeur_nom) : '';
      var gauche = l.zone === 'plateau'
        ? '<span class="tm neutre"><b>' + duree(mins(l.recu_le)) + '</b><small>au plateau · ' + esc(l.statut_bacs || '') + '</small></span>'
        : mins(arrive(l)) >= 1440 ? '<span class="tm crit"><b>' + duree(mins(arrive(l))) + '</b><small>arrivé le ' + jour(arrive(l)) + '</small></span>'
        : tm(arrive(l), slaDe(l), (S.depuis === 'bacs' ? 'depuis la réception' : 'sur le site') + ' · SLA ' + slaTxt(slaDe(l)));
      return '<div class="lr' + (verrouAutre(l) ? ' resa' : '') + univCls(l) + '" data-a="open" data-id="' + l.id_lead + '" tabindex="0">'
        + '<div>' + gauche + '</div>'
        + '<div><span class="lr-n">' + esc(nomLead(l)) + '</span> <span class="lr-v">' + esc(siteNom(l.site) + qui) + '</span><p class="lr-d">' + esc(demandeDe(l)) + '</p><div class="tags">' + tagsLead(l) + '</div></div>'
        + '<div class="lr-a">' + a + '</div></div>';
    }

    // ── Vues : vendeur ────────────────────────────────────────────────────
    function vueAFaire() {
      var ls = mesLeads();
      var h = '<div class="ph"><div><h2>À faire maintenant</h2><p>Dans l\'ordre où il faut le faire : vos leads d\'abord, le plus pressé en tête, puis les relances de campagne.</p></div></div><div class="list">';
      if (!ls.length && !(S.mesSollis || []).length) h += '<div class="empty">Rien en attente. Prenez un lead dans le Pool du site.</div>';
      ls.forEach(function (l) {
        var verbe = __lmPeutAppeler() ? (l.tentatives ? 'Rappeler' : 'Appeler') : (l.tentatives ? 'Relancer' : 'Traiter');
        var sous = l.tentatives ? 'tentative ' + (l.tentatives + 1) + ' sur 3' : 'premier contact';
        var why = l.par_plateau ? 'Qualifié par ' + (l.transfere_par_nom ? propre(l.transfere_par_nom) + ' (VROOM)' : 'le plateau VROOM') + (l.qualification ? ' : ' + l.qualification : '')
          : l.attribue_par_nom ? 'Attribué par ' + propre(l.attribue_par_nom) + (l.attribue_le ? ' il y a ' + duree(mins(l.attribue_le)) : '')
          : l.tentatives ? 'Pas joint, dernier essai ' + quand(l.dernier_essai) : (l.message ? String(l.message).replace(/^\[[^\]]*\]\s*/, '').slice(0, 140) : (l.source_libelle || ''));
        var gauche = mins(arrive(l)) >= 1440 ? '<span class="tm crit"><b>' + duree(mins(arrive(l))) + '</b><small>arrivé le ' + jour(arrive(l)) + '</small></span>' : tm(arrive(l), slaDe(l), 'depuis l\'arrivée · SLA ' + slaTxt(slaDe(l)));
        h += '<div class="todo" data-a="open" data-id="' + l.id_lead + '" tabindex="0"><div class="todo-v">' + verbe + '<small>' + sous + '</small></div>'
          + '<div><span class="lr-n">' + esc(nomLead(l)) + '</span> <span class="lr-v">' + esc(demandeDe(l)) + '</span><p class="why">' + esc(why) + '</p><div class="tags">' + tagsLead(l) + '</div></div>'
          + '<div>' + gauche + '</div></div>';
      });
      (S.mesSollis || []).slice(0, 60).forEach(function (t) {
        h += '<div class="todo" data-a="fiche" data-id="' + esc(t.id_client) + '" tabindex="0"><div class="todo-v">Relancer<small>campagne</small></div>'
          + '<div><span class="lr-n">' + esc(propre(t.client_nom)) + '</span><p class="why">' + esc(siteNom(t.nom_site)) + '</p><div class="tags"><span class="tag camp">' + esc(t.campagne) + '</span></div></div>'
          + '<div><span class="tm ' + (t.anciennete_j >= 3 ? 'warn' : 'ok') + '"><b>' + (t.anciennete_j ? plural(t.anciennete_j, 'jour') : 'aujourd\'hui') + '</b><small>depuis le lancement</small></span></div></div>';
      });
      h += '</div>';
      var arch = Number((S.stats || {}).mes_archives) || 0;
      if (arch) h += '<p class="foot">' + (arch > 1 ? arch + ' autres leads vous sont encore attribués' : 'Un autre lead vous est encore attribué') + ', reçu' + (arch > 1 ? 's' : '') + ' il y a plus de ' + ((S.stats && S.stats.arriere_jours) || 30) + ' jours. Ils ne sont plus à appeler en priorité : votre chef des ventes les solde.</p>';
      return h;
    }
    function vuePiscineVendeur() {
      var ls = piscine(null).sort(function (a, b) { return (slaDe(a) - mins(arrive(a))) - (slaDe(b) - mins(arrive(b))); });
      var h = '<div class="ph"><div><h2>' + esc(poolNom()) + '</h2><p>Libre-service : premier arrivé, premier servi. Prendre met le lead à votre nom ; s\'il ne vous concerne pas, rendez-le au Pool.</p></div></div><div class="list">';
      if (!ls.length) h += '<div class="empty">Le Pool est vide.</div>';
      ls.forEach(function (l) { h += ligneLead(l); });
      return h + '</div>';
    }
    function vueCampagnesVendeur() {
      var h = '<div class="ph"><div><h2>Mes campagnes</h2><p>Les clients que votre chef vous a confiés dans une campagne. Ouvrez la fiche du client pour l\'appeler et faire votre compte rendu : la relance est alors comptée comme traitée.</p></div></div>';
      if (!S.campagnes) return h + '<div class="empty">Chargement des campagnes…</div>';
      if (!S.campagnes.length) return h + '<div class="empty">Aucune campagne ne vous a été confiée ces 90 derniers jours.</div>';
      S.campagnes.forEach(function (c) {
        var cibles = (S.mesSollis || []).filter(function (t) { return t.campagne === c.campagne; });
        h += '<div class="sub"><h3>' + esc(c.campagne) + '</h3><p>' + plural(Number(c.nb_sollicitations) || 0, 'client') + ' pour vous · ' + (c.nb_traitees || 0) + ' traités · ' + (c.nb_a_traiter || 0) + ' à relancer'
          + (Number(c.nb_propales) ? ' · ' + plural(c.nb_propales, 'proposition') : '') + (Number(c.nb_bdc) ? ' · ' + plural(c.nb_bdc, 'commande') : '') + '.</p><div class="list">';
        cibles.slice(0, 80).forEach(function (t) {
          h += '<div class="todo" data-a="fiche" data-id="' + esc(t.id_client) + '" tabindex="0"><div class="todo-v">Relancer<small>sans réponse</small></div><div><span class="lr-n">' + esc(propre(t.client_nom)) + '</span><p class="why">' + esc(siteNom(t.nom_site)) + '</p></div>'
            + '<div><span class="tm ' + (t.anciennete_j >= 3 ? 'warn' : 'ok') + '"><b>' + (t.anciennete_j ? plural(t.anciennete_j, 'jour') : 'aujourd\'hui') + '</b><small>depuis le lancement</small></span></div></div>';
        });
        h += '</div></div>';
      });
      return h;
    }

    // ── Vues : chef des ventes (et direction sur un site) ─────────────────
    function compter(liste) {
      var c = { ok: [], warn: [], crit: [], stock: [] };
      liste.forEach(function (l) { c[niveau(l)].push(l); });
      return c;
    }
    function vueMur() {
      var sid = sitePoste(), si = siteInfo(sid) || {};
      var gere = manager(sid);
      var pisc = compter(piscine(sid));
      var h = '<div class="ph"><div><h2>Le mur · ' + esc(siteNom(si.site)) + '</h2><p>Qui a la main sur quoi, et depuis combien de temps. Le Pool en tête : personne n\'y a la main. Cliquez un chiffre : la liste des leads s\'ouvre dans le volet de droite.</p></div>'
        + '<div class="ph-r"><span class="lbl-s">Compter depuis</span><div class="seg"><button type="button" class="' + (S.depuis === 'site' ? 'on' : '') + '" data-a="depuis" data-id="site">L\'arrivée sur le site</button><button type="button" class="' + (S.depuis === 'bacs' ? 'on' : '') + '" data-a="depuis" data-id="bacs">La réception</button></div></div></div>';
      h += '<div class="scroll"><table class="mur"><thead><tr><th>Qui a la main</th>' + COLS.map(function (c) { return '<th>' + c[1] + '</th>'; }).join('') + '<th>Premiers contacts aujourd\'hui</th></tr></thead><tbody>';
      var cell = function (r, c, n) {
        var sel = S.cell && S.cell.r === String(r) && S.cell.c === c;
        if (!n) return '<td><span class="cell zero" aria-label="aucun">·</span></td>';
        return '<td><button type="button" class="cell ' + c + (sel ? ' sel' : '') + '" data-a="cell" data-id="' + esc(r) + '|' + c + '">' + n + '</button></td>';
      };
      h += '<tr class="pisc"><td class="who"><b>Pool · personne</b><small>libre-service, premier arrivé</small></td>'
        + cell('piscine', 'ok', pisc.ok.length) + cell('piscine', 'warn', pisc.warn.length) + cell('piscine', 'crit', pisc.crit.length) + cell('piscine', 'stock', pisc.stock.length) + '<td><span class="na">—</span></td></tr>';
      var vs = vendeursDu(sid).map(function (v) { return Object.assign({ c: compter(S.leads.filter(function (l) { return l.zone === 'vendeur' && Number(l.id_site) === Number(sid) && Number(l.id_user_attribue) === Number(v.id_user); })) }, v); });
      // Leads attribués à quelqu'un qui n'est pas vendeur du site (chef, ancien vendeur) : une ligne chacun.
      var connus = {}; vs.forEach(function (v) { connus[v.id_user] = 1; });
      S.leads.filter(function (l) { return l.zone === 'vendeur' && Number(l.id_site) === Number(sid); }).forEach(function (l) {
        if (connus[l.id_user_attribue]) return;
        connus[l.id_user_attribue] = 1;
        vs.push({ id_user: l.id_user_attribue, nom: l.vendeur_nom, contacts_jour: 0, hors: true, c: compter(S.leads.filter(function (x) { return x.zone === 'vendeur' && Number(x.id_site) === Number(sid) && Number(x.id_user_attribue) === Number(l.id_user_attribue); })) });
      });
      var actifs = vs.filter(function (v) { return v.contacts_jour || v.c.ok.length + v.c.warn.length + v.c.crit.length + v.c.stock.length; })
        .sort(function (a, b) { return (b.c.crit.length - a.c.crit.length) || ((b.c.ok.length + b.c.warn.length + b.c.crit.length + b.c.stock.length) - (a.c.ok.length + a.c.warn.length + a.c.crit.length + a.c.stock.length)); });
      var autres = vs.filter(function (v) { return actifs.indexOf(v) === -1; });
      var ligneV = function (v) {
        return '<tr><td class="who"><b>' + esc(propre(v.nom)) + '</b>' + (v.exclu ? '<small>écarté de l\'attribution</small>' : v.hors ? '<small>' + (Number(v.id_user) === Number(MOI) ? 'vous' : 'pas vendeur du site') + '</small>' : '') + '</td>'
          + cell(v.id_user, 'ok', v.c.ok.length) + cell(v.id_user, 'warn', v.c.warn.length) + cell(v.id_user, 'crit', v.c.crit.length) + cell(v.id_user, 'stock', v.c.stock.length)
          + '<td class="num"><span class="ctc">' + (v.contacts_jour || '<span class="na">0</span>') + '</span></td></tr>';
      };
      actifs.forEach(function (v) { h += ligneV(v); });
      if (autres.length) {
        h += '<tr><td colspan="6" class="plus"><button type="button" class="btn sm ghost" data-a="autres-vendeurs">' + (S.autresVendeurs ? 'Masquer' : 'Afficher') + ' les ' + plural(autres.length, 'autre vendeur', 'autres vendeurs') + ' du site, sans lead en cours</button></td></tr>';
        if (S.autresVendeurs) autres.forEach(function (v) { h += ligneV(v); });
      }
      var pl = leadsDu(sid).filter(function (l) { return l.zone === 'plateau'; });
      if (pl.length) h += '<tr class="vroom"><td class="who"><b>Au plateau VROOM</b><small>pas encore transmis au site</small></td><td colspan="4"><button type="button" class="cell vr" data-a="cell" data-id="plateau|tous">' + pl.length + '</button></td><td><span class="na">—</span></td></tr>';
      h += '</tbody></table></div>';
      h += '<p class="foot">Chaque lead ouvert (pas encore contacté) est compté une fois, chez la personne qui l\'a en main. « À risque » : plus de 60 % du délai consommé. Délai : celui de la source pour un lead direct, 2 h pour un lead transmis par le plateau VROOM. « Ouverts + 24 h » : leads de moins de ' + ((S.stats && S.stats.arriere_jours) || 30) + ' jours ; les plus anciens sont comptés à part, en archives.</p>';
      return h;
    }
    // La case cliquée du mur → ses leads (affichés dans le volet de droite).
    function listeCellule() {
      if (!S.cell) return null;
      var sid = sitePoste(), r = S.cell.r, c = S.cell.c, ls;
      if (r === 'piscine') ls = compter(piscine(sid))[c] || [];
      else if (r === 'plateau') ls = leadsDu(sid).filter(function (l) { return l.zone === 'plateau'; });
      else if (c === 'tous') ls = S.leads.filter(function (l) { return l.zone === 'vendeur' && (sid == null || Number(l.id_site) === Number(sid)) && String(l.id_user_attribue) === String(r); });
      else ls = compter(S.leads.filter(function (l) { return l.zone === 'vendeur' && Number(l.id_site) === Number(sid) && String(l.id_user_attribue) === String(r); }))[c] || [];
      var lib = r === 'plateau' ? 'Pas encore transmis au site' : c === 'tous' ? 'Ses leads en cours' : (COLS.find(function (x) { return x[0] === c; }) || ['', ''])[1];
      var nom = '';
      if (r !== 'piscine' && r !== 'plateau') {
        var v = vendeursDu(sid).find(function (x) { return String(x.id_user) === String(r); });
        var lv = S.leads.find(function (x) { return String(x.id_user_attribue) === String(r) && x.vendeur_nom; });
        nom = propre((v && v.nom) || (lv && lv.vendeur_nom) || 'Vendeur');
      }
      var qui = r === 'piscine' ? 'Pool · personne' : r === 'plateau' ? 'Au plateau VROOM' : nom;
      return { sid: sid, r: r, c: c, gere: manager(sid), qui: qui, lib: lib, leads: ls.slice().sort(function (a, b) { return ts(arrive(a)) - ts(arrive(b)); }) };
    }
    function renderVolet() {
      $drawer.classList.remove('composing');
      var z = listeCellule();
      if (!z) return fermerTout();
      var si = siteInfo(z.sid) || {};
      var x = '<button type="button" class="x" data-a="close" aria-label="Fermer"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>';
      var h = '<header class="dr-h"><div><h2>' + esc(z.qui) + '</h2><p class="dr-s">' + esc(z.lib) + ' · ' + plural(z.leads.length, 'lead') + ' · ' + esc(siteNom(si.site)) + '</p></div>' + x + '</header>'
        + '<div class="dr-b vol"><div class="list">';
      if (!z.leads.length) h += '<div class="empty">Plus aucun lead dans cette case.</div>';
      z.leads.slice(0, 150).forEach(function (l) { h += ligneLead(l, { action: z.r === 'plateau' ? 'voir' : z.gere ? 'attribuer' : 'voir' }); });
      if (z.leads.length > 150) h += '<div class="empty">… et ' + (z.leads.length - 150) + ' autres.</div>';
      h += '</div></div>';
      if (z.r === 'piscine' && z.c === 'stock' && z.gere && z.leads.length) h += '<footer class="dr-f"><div class="row pied"><span class="hint">Leads sans contact depuis plus de 24 h.</span><button type="button" class="btn pri" data-a="solder" data-id="' + z.sid + '">Solder le stock</button></div></footer>';
      var top = $drawer.querySelector('.dr-b.vol') ? $drawer.scrollTop : 0;
      $drawer.innerHTML = h;
      $drawer.scrollTop = top;
      $scrim.hidden = false; $drawer.hidden = false;
    }
    function groupesRelais() {
      var sid = sitePoste();
      var mine = leadsDu(sid).filter(function (l) { return l.zone !== 'plateau'; });
      return [
        { k: 'hd', titre: 'Hors délai dans le Pool', why: 'Personne ne les a pris dans le temps prévu. Confiez-les à quelqu\'un.', items: mine.filter(function (l) { return l.zone === 'piscine' && !verrouAutre(l) && niveau(l) === 'crit'; }), act: 'attribuer' },
        { k: 'rs', titre: 'Pris sans appel depuis plus de 20 min', why: 'Un vendeur les a pris puis n\'a pas appelé. Rendez-les au Pool ou confiez-les à un autre.', items: mine.filter(prisSansAppel), act: 'liberer' },
        { k: 'hs', titre: 'Autre marque demandée', why: 'La demande vise une marque que le site ne vend pas. Renvoyez-les avant qu\'ils ne vieillissent ici.', items: mine.filter(horsMarque), act: 'renvoyer' },
        { k: 'inj', titre: 'Injoignables après 3 tentatives', why: 'Le plateau VROOM peut reprendre la relance (leads BACS), ou le lead peut être clos.', items: mine.filter(function (l) { return l.zone === 'vendeur' && l.tentatives >= 3; }), act: 'injoignable' }
      ];
    }
    function optionsVendeurs(sid, exclu, choisi) {
      var vs = vendeursDu(sid).filter(function (v) { return String(v.id_user) !== String(exclu); })
        .map(function (v) { return [v, charge(v.id_user, sid)]; })
        .sort(function (a, b) { return (a[0].exclu - b[0].exclu) || (a[1] - b[1]) || String(a[0].nom).localeCompare(String(b[0].nom), 'fr'); });
      if (choisi == null && vs.length) choisi = vs[0][0].id_user;
      return vs.map(function (x) { return '<option value="' + x[0].id_user + '"' + (String(x[0].id_user) === String(choisi) ? ' selected' : '') + '>' + esc(propre(x[0].nom)) + ' · ' + x[1] + ' en cours' + (x[0].exclu ? ' · écarté' : String(x[0].id_user) === String(choisi) ? ' · suggéré' : '') + '</option>'; }).join('');
    }
    function sitesRenvoi(l) {
      var m = marqueNorm(l.marque_lead);
      return sitesStats().filter(function (s) { return Number(s.id_site) !== Number(l.id_site); })
        .sort(function (a, b) { return ((marqueNorm(b.reseau) === m) - (marqueNorm(a.reseau) === m)) || String(a.site).localeCompare(String(b.site), 'fr'); });
    }
    function vueRelayer() {
      var sid = sitePoste(), gere = manager(sid);
      var gs = groupesRelais();
      var h = '<div class="ph"><div><h2>À relayer</h2><p>Ce qui ne doit pas rester où c\'est. Chaque groupe a une seule action. La suggestion suit la règle du site : le moins chargé d\'abord.</p></div>'
        + (gs[0].items.length && gere ? '<div class="ph-r"><button type="button" class="btn pri" data-a="attribuer-regle">Tout attribuer selon la règle</button></div>' : '') + '</div>';
      gs.forEach(function (g) {
        h += '<div class="grp"><div class="grp-h"><h3>' + esc(g.titre) + ' <span class="cnt' + (g.items.length ? (g.k === 'hd' ? ' c' : '') : ' z') + '">' + g.items.length + '</span></h3><p>' + esc(g.why) + '</p></div>';
        if (!g.items.length) h += '<div class="empty">Rien à relayer ici.</div>';
        g.items.slice(0, 60).forEach(function (l) {
          var a = '';
          if (!gere) a = '<button type="button" class="btn sm" data-a="open" data-id="' + l.id_lead + '">Ouvrir</button>';
          else if (g.act === 'attribuer') a = '<select id="sel-' + l.id_lead + '" aria-label="Vendeur">' + optionsVendeurs(l.id_site) + '</select><button type="button" class="btn sm pri" data-a="attribuer" data-id="' + l.id_lead + '">Attribuer</button>';
          else if (g.act === 'liberer') a = '<button type="button" class="btn sm" data-a="rendre" data-id="' + l.id_lead + '">Rendre au Pool</button><select id="sel-' + l.id_lead + '" aria-label="Vendeur">' + optionsVendeurs(l.id_site, l.id_user_attribue) + '</select><button type="button" class="btn sm pri" data-a="attribuer" data-id="' + l.id_lead + '">Attribuer</button>';
          else if (g.act === 'renvoyer') a = '<select id="sit-' + l.id_lead + '" aria-label="Site">' + sitesRenvoi(l).map(function (s) { return '<option value="' + s.id_site + '">' + esc(siteNom(s.site)) + ' · ' + esc(propre(s.reseau || '')) + '</option>'; }).join('') + '</select><button type="button" class="btn sm pri" data-a="renvoyer" data-id="' + l.id_lead + '">Renvoyer</button>';
          else if (g.act === 'injoignable') a = (l.sf_lead_id ? '<button type="button" class="btn sm vr" data-a="confier" data-id="' + l.id_lead + '">Confier au plateau VROOM</button>' : '') + '<button type="button" class="btn sm dang" data-a="clore-inj" data-id="' + l.id_lead + '">Clore</button>';
          var tsv = g.act === 'liberer' ? tm(l.attribue_le, 20, 'pris par ' + prenom(l.vendeur_nom)) : tm(arrive(l), slaDe(l));
          h += '<div class="rel"><div>' + tsv + '</div><div><span class="lr-n lien-n" data-a="open" data-id="' + l.id_lead + '">' + esc(nomLead(l)) + '</span> <span class="lr-v">' + esc(demandeDe(l)) + '</span>'
            + (l.vendeur_nom && g.act !== 'liberer' ? '<p class="why">Chez ' + esc(propre(l.vendeur_nom)) + (l.dernier_essai ? ' · dernier essai ' + esc(quand(l.dernier_essai)) : '') + '</p>' : '') + '<div class="tags">' + tagsLead(l) + '</div></div><div class="rel-a">' + a + '</div></div>';
        });
        if (g.items.length > 60) h += '<div class="empty">… et ' + (g.items.length - 60) + ' autres.</div>';
        h += '</div>';
      });
      var si = siteInfo(sid) || {}, st = stockDu(sid) + (Number(si.archives) || 0);
      h += '<div class="grp"><div class="grp-h"><h3>Stock de plus de 24 h <span class="cnt' + (st ? '' : ' z') + '">' + st + '</span></h3><p>Les leads ouverts depuis plus d\'un jour, dont ' + (si.archives || 0) + ' de plus de ' + ((S.stats && S.stats.arriere_jours) || 30) + ' jours. Tant qu\'ils restent ouverts, ils faussent les délais du site.</p></div>'
        + (st ? '<div class="rel"><div><span class="tm crit"><b>+ 24 h</b><small>tous</small></span></div><div><span class="lr-n">' + plural(st, 'lead', 'leads') + ' à solder en une fois</span><p class="why">Confiez-les au plateau, répartissez-les sur l\'équipe ou classez-les sans suite.</p></div><div class="rel-a">'
          + (gere ? '<button type="button" class="btn sm pri" data-a="solder" data-id="' + sid + '">Solder le stock</button>' : '<span class="na">réservé au chef des ventes</span>') + '</div></div>' : '<div class="empty">Stock soldé.</div>') + '</div>';
      return h;
    }

    // ── Vues : direction ──────────────────────────────────────────────────
    function vueMurSites() {
      var rows = sitesStats().map(function (s) {
        var ls = S.leads.filter(function (l) { return l.zone !== 'plateau' && Number(l.id_site) === Number(s.id_site); });
        return { s: s, c: compter(ls), pl: S.leads.filter(function (l) { return l.zone === 'plateau' && Number(l.id_site) === Number(s.id_site); }).length };
      });
      var actifs = rows.filter(function (r) { return r.s.n7 || r.c.ok.length + r.c.warn.length + r.c.crit.length + r.c.stock.length || r.pl; })
        .sort(function (a, b) { return (b.c.crit.length - a.c.crit.length) || (b.s.n7 - a.s.n7); });
      var autres = rows.filter(function (r) { return actifs.indexOf(r) === -1; });
      var h = '<div class="ph"><div><h2>Le mur des sites</h2><p>Une ligne par site. Les quatre premières colonnes disent où en sont les leads maintenant, les suivantes ce qui s\'est passé sur la durée.</p></div></div>';
      h += '<div class="scroll"><table class="mur sites"><thead><tr><th>Site</th><th>Dans les temps</th><th>À risque</th><th>Hors délai</th><th>Ouverts + 24 h</th><th>Au plateau</th><th>1er contact, médiane 30 j</th><th>Dans le délai, 30 j</th><th>Leads 7 j</th><th></th></tr></thead><tbody>';
      var ligne = function (r) {
        var s = r.s, n = function (x, c) { return x ? '<span class="cell ' + c + ' fixe">' + x + '</span>' : '<span class="cell zero">·</span>'; };
        var taux = s.nc30 ? Math.round(100 * s.dans_sla30 / s.nc30) : null;
        return '<tr><td class="who"><b>' + esc(siteNom(s.site)) + '</b><small>' + esc(s.chefs ? propre(s.chefs) : (propre(s.affaire || '') || '')) + '</small></td>'
          + '<td>' + n(r.c.ok.length, 'ok') + '</td><td>' + n(r.c.warn.length, 'warn') + '</td><td>' + n(r.c.crit.length, 'crit') + '</td>'
          + '<td>' + n(r.c.stock.length, 'stock') + (s.archives ? '<small class="arch">+ ' + s.archives + ' archives</small>' : '') + '</td>'
          + '<td>' + (r.pl ? '<span class="cell vr fixe">' + r.pl + '</span>' : '<span class="na">0</span>') + '</td>'
          + '<td class="num"><b class="' + (s.d30_min == null ? '' : s.d30_min > 240 ? 't-crit' : s.d30_min > 60 ? 't-warn' : 't-ok') + '">' + (s.d30_min != null ? dureeMes(s.d30_min) : '<span class="na">—</span>') + '</b>' + (s.nc30 ? '<small class="arch">' + plural(s.nc30, 'contact') + '</small>' : '') + '</td>'
          + '<td class="num">' + (taux != null ? taux + ' %' : '<span class="na">—</span>') + '</td><td class="num">' + (s.n7 || '<span class="na">0</span>') + '</td>'
          + '<td><button type="button" class="btn sm" data-a="voir-site" data-id="' + s.id_site + '">Ouvrir</button></td></tr>';
      };
      actifs.forEach(function (r) { h += ligne(r); });
      if (autres.length) {
        h += '<tr><td colspan="10" class="plus"><button type="button" class="btn sm ghost" data-a="autres-sites">' + (S.autresSites ? 'Masquer' : 'Afficher') + ' les ' + plural(autres.length, 'autre site', 'autres sites') + ' sans lead récent</button></td></tr>';
        if (S.autresSites) autres.forEach(function (r) { h += ligne(r); });
      }
      h += '</tbody></table></div><p class="foot">Colonnes « maintenant » : leads ouverts, pas encore contactés, comptés depuis leur arrivée sur le site. « 1er contact » : délai médian entre l\'arrivée sur le site et le premier contact, sur les leads reçus ces 30 derniers jours et contactés. « Dans le délai » : part de ces contacts faits dans le délai de la source (2 h pour un lead du plateau).</p>';
      return h;
    }
    function vueRelais() {
      var h = '<div class="ph"><div><h2>Le relais</h2><p>Le chemin d\'un lead, de BACS au premier appel du vendeur, en temps médian sur 30 jours. Les segments hachurés n\'appartiennent à personne : c\'est là que le temps se perd.</p></div></div>';
      if (!S.relais) return h + '<div class="empty">Chargement du relais…</div>';
      var rows = S.relais.filter(function (r) { return r.att_bacs_min != null || r.att_site_min != null || r.vendeur_min != null; })
        .map(function (r) {
          var seg = [['u', 'Attente dans le Pool BACS', r.att_bacs_min], ['v', 'Traitement VROOM', r.vroom_min], ['u', 'Attente sur le site', r.att_site_min], ['s', 'Vendeur, avant l\'appel', r.vendeur_min]]
            .filter(function (x) { return x[2] != null; }).map(function (x) { return [x[0], x[1], Math.max(0, Number(x[2]))]; });
          return { r: r, seg: seg, tot: seg.reduce(function (a, s) { return a + s[2]; }, 0) };
        }).sort(function (a, b) { return b.tot - a.tot; });
      h += '<div class="lg"><span><i class="u"></i>Attente, personne n\'a la main</span><span><i class="v"></i>Plateau VROOM</span><span><i class="s"></i>Vendeur</span></div><div class="rl">';
      if (!rows.length) h += '<div class="empty">Pas encore assez de leads contactés sur 30 jours pour mesurer le relais.</div>';
      rows.forEach(function (x) {
        var tot = x.tot || 1;
        h += '<div class="rl-r"><div class="rl-h"><b>' + esc(siteNom(x.r.site)) + '</b><span>' + dureeMes(x.tot) + ' en médiane · ' + plural(Number(x.r.n) || 0, 'lead') + ', ' + (x.r.n_contact || 0) + ' contactés</span></div><div class="rb">'
          + x.seg.map(function (s) { return '<i class="' + s[0] + '" style="width:' + Math.max(1.5, 100 * s[2] / tot).toFixed(2) + '%" title="' + esc(s[1]) + ' : ' + dureeMes(s[2]) + '"></i>'; }).join('') + '</div><div class="rl-d">'
          + x.seg.map(function (s) { return '<span>' + esc(s[1]) + ' <b>' + dureeMes(s[2]) + '</b></span>'; }).join('') + '</div></div>';
      });
      return h + '</div><p class="foot">Médianes calculées séparément pour chaque segment : leur somme donne un ordre de grandeur, pas un parcours réel. Pool BACS et traitement VROOM : historique BACS des comptes VROOM et gestes du plateau dans One Data. Site : de l\'arrivée sur le site à la prise par un vendeur, puis de la prise au premier contact.</p>';
    }

    // ── Campagnes : chef et direction ─────────────────────────────────────
    function vueCampagnesManager() {
      var sid = sitePoste();
      var peutCreer = POSTE === 'direction' ? sitesStats().some(function (s) { return s.manager; }) || [1, 2, 5, 6, 7, 8].indexOf(opt.role) !== -1 : true;
      var h = '<div class="ph"><div><h2>Campagnes</h2><p>L\'avancement se lit avant le résultat : une campagne à moitié traitée n\'a pas un mauvais taux, elle a du retard.' + (sid != null ? ' Site : ' + esc(siteNom((siteInfo(sid) || {}).site)) + '.' : '') + '</p></div>'
        + (peutCreer ? '<div class="ph-r"><button type="button" class="btn pri" data-a="creer-camp">Créer une campagne</button></div>' : '') + '</div>';
      if (!S.campagnes) return h + '<div class="empty">Chargement des campagnes…</div>';
      if (!S.campagnes.length) return h + '<div class="empty">Aucune campagne lancée ces 90 derniers jours. Une campagne choisit des clients par critères, les répartit entre les vendeurs, et suit leurs relances.</div>';
      h += '<div class="scroll"><table class="camp-t"><thead><tr><th>Campagne</th><th>Cibles</th><th>Traitées</th><th>À relancer</th><th>Propositions</th><th>Commandes</th><th>Vendeurs</th></tr></thead><tbody>';
      S.campagnes.forEach(function (c) {
        var n = Number(c.nb_sollicitations) || 0, tr = Number(c.nb_traitees) || 0, pct = n ? Math.round(100 * tr / n) : 0;
        var ouverte = S.campOuverte === c.campagne;
        h += '<tr class="clic' + (ouverte ? ' actif' : '') + '" data-a="camp-ouvrir" data-id="' + esc(c.campagne) + '" tabindex="0"><td class="l">' + esc(c.campagne) + '<small>' + plural(Number(c.nb_sites) || 0, 'site') + (c.delai_median_h != null ? ' · traitée en ' + duree(Number(c.delai_median_h) * 60) + ' en médiane' : '') + '</small></td><td class="num">' + n + '</td>'
          + '<td><span class="prog"><span class="num">' + tr + ' · ' + pct + ' %</span><span class="bar' + (pct < 40 ? ' low' : '') + '"><i style="width:' + pct + '%"></i></span></span></td>'
          + '<td class="num">' + (Number(c.nb_a_traiter) ? '<span class="tag ' + (Number(c.nb_a_traiter) > 10 ? 'crit' : 'warn') + '">' + c.nb_a_traiter + '</span>' : '<span class="na">0</span>') + '</td>'
          + '<td class="num">' + (Number(c.nb_propales) || '<span class="na">0</span>') + '</td><td class="num">' + (Number(c.nb_bdc) || '<span class="na">0</span>') + '</td><td class="num">' + (c.nb_vendeurs || 0) + '</td></tr>';
        if (ouverte) {
          var vs = (S.campVend || []).filter(function (v) { return v.campagne == null || true; });
          if (S.campVendDe !== c.campagne) h += '<tr class="vdet"><td colspan="7">Chargement de la répartition…</td></tr>';
          else if (!vs.length) h += '<tr class="vdet"><td colspan="7">Répartition par vendeur indisponible.</td></tr>';
          else vs.forEach(function (v) {
            var p2 = Math.round(Number(v.taux_traite) || 0);
            h += '<tr class="vdet"><td class="l">' + esc(propre(v.vendeur_nom)) + '<small>' + esc(siteNom(v.nom_site)) + '</small></td><td class="num">' + v.nb_cibles + '</td><td><span class="prog"><span class="num">' + v.nb_traitees + ' · ' + p2 + ' %</span><span class="bar' + (p2 < 40 ? ' low' : '') + '"><i style="width:' + p2 + '%"></i></span></span></td><td class="num">' + (v.nb_a_traiter || '<span class="na">0</span>') + '</td><td></td><td></td><td></td></tr>';
          });
        }
      });
      return h + '</tbody></table></div><p class="foot">Campagnes internes des 90 derniers jours. Une cible est « traitée » quand le vendeur a fait son compte rendu sur la fiche du client.</p>';
    }

    function renderPanel() {
      if (POSTE === 'vendeur') return S.tab === 'pool' ? vuePiscineVendeur() : S.tab === 'campagnes' ? vueCampagnesVendeur() : vueListeVendeur();
      if (S.tab === 'bloques') return vueBloques();
      if (S.tab === 'campagnes') return vueCampagnesManager();
      if (S.tab === 'mur') return sitePoste() == null ? vueMurSites() : vueMur();
      if (S.tab === 'mursites') return '<div class="seg-a"><button type="button" class="on" data-a="tab" data-id="mursites">Le mur des sites</button><button type="button" data-a="tab" data-id="relais">Le relais</button></div>' + vueMurSites();
      if (S.tab === 'relais') return '<div class="seg-a"><button type="button" data-a="tab" data-id="mursites">Le mur des sites</button><button type="button" class="on" data-a="tab" data-id="relais">Le relais</button></div>' + vueRelais();
      return vuePool();
    }
    function render() {
      if (!el.isConnected) return;
      if (!S.charge) {
        root.innerHTML = '<section class="situ"><p class="situ-l">' + LIB_POSTE[POSTE] + '</p><p class="situ-t">' + esc(S.erreur || 'Chargement…') + '</p>'
          + (S.erreur ? '<div><button type="button" class="btn pri" data-a="reessayer">Réessayer</button></div>' : '') + '</section>';
        return;
      }
      var y = (FW.scrollY || 0);
      root.innerHTML = bandeauComme() + renderSituation() + bandeauBacsSite()
        + (S.erreur ? '<p class="alerte">' + esc(S.erreur) + ' Les données affichées datent du dernier chargement réussi.</p>' : '')
        + '<div class="barre-o">' + renderTabs() + outils() + '</div>'
        + '<section class="act" aria-label="Leads"><div class="panel">' + renderPanel() + '</div></section>';
      try { if (FW.scrollY !== y) FW.scrollTo(0, y); } catch (e) {}
      setTimeout(function () { S.frais.clear(); }, 7000);
    }

    // ── Panneau latéral : la fiche du lead ────────────────────────────────
    function renderDrawer() {
      var D = S.dr; if (!D) return;
      var l = D.l;
      var x = '<button type="button" class="x" data-a="close" aria-label="Fermer"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg></button>';
      if (!l) { $drawer.innerHTML = '<header class="dr-h"><div><h2>Chargement…</h2></div>' + x + '</header>'; return; }
      var gere = manager(l.id_site);
      var mien = estMien(l);
      var retour = S.cell ? '<button type="button" class="retour" data-a="retour-liste"><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>Retour à la liste</button>' : '';
      var canaux = [['Appeler', 'appel', 'call', IC.phone], ['SMS', 'sms', 'sms', IC.sms], ['WhatsApp', 'wa', 'wa', IC.wa], ['E-mail', 'mail', 'mail', IC.mail]]
        .filter(function (c) { return c[1] !== 'appel' || __lmPeutAppeler(); }).map(function (c) {
          return '<button type="button" class="fs-btn ' + c[2] + (D.canal === c[1] ? ' on' : '') + '" data-a="canal" data-id="' + c[1] + '"' + ((c[1] === 'mail' ? !l.email : !l.telephone) ? ' disabled' : '') + '>' + svgIc(c[3]) + c[0] + '</button>'; }).join('');
      var h = '<header class="dr-h"><div class="dr-ht">' + retour + '<h2>' + esc(nomLead(l)) + '</h2><p class="dr-s">' + esc([demandeDe(l), l.source_libelle, siteNom(l.site)].filter(Boolean).join(' · '))
        + (l.vendeur_nom ? ' · chez ' + esc(propre(l.vendeur_nom)) : l.zone === 'piscine' ? ' · dans le Pool' : l.zone === 'plateau' ? ' · au plateau VROOM' : '') + '</p>'
        + '<p class="dr-tel">' + (l.telephone ? '<b>' + esc(telAff(l.telephone)) + '</b>' : 'Aucun numéro') + (l.email ? ' · ' + esc(l.email) : '') + '</p>'
        + demandeHaut(l)
        + '<div class="canaux">' + canaux + '</div>'
        + (l.id_client ? '<button type="button" class="lien fiche-l" data-a="fiche" data-id="' + l.id_client + '">Ouvrir la fiche client ›</button>' : '')
        + '</div>' + x + '</header><div class="dr-b">' + composeHtml(l);
      // Délais
      h += '<section><h3>Délai</h3><div class="delais">';
      if (l.zone === 'plateau') h += '<div><span>Au plateau VROOM</span><span class="tm neutre"><b>' + duree(mins(l.recu_le)) + '</b><small>reçu le ' + esc(quand(l.recu_le)) + '</small></span></div>';
      else {
        if (l.transfere_le) h += '<div><span>Plateau VROOM</span><span class="tm ok"><b>transmis en ' + duree((ts(l.transfere_le) - ts(l.recu_le)) / 60000) + '</b><small>après réception</small></span></div>';
        h += '<div><span>Sur le site</span>' + (mins(l.arrive_le) >= 1440 ? '<span class="tm crit"><b>' + duree(mins(l.arrive_le)) + '</b><small>arrivé le ' + esc(quand(l.arrive_le)) + '</small></span>' : tm(l.arrive_le, l.sla_site || 60, 'sans contact · SLA ' + slaTxt(l.sla_site || 60))) + '</div>';
        if (l.zone === 'vendeur' && l.attribue_le) h += '<div><span>Chez ' + esc(prenom(l.vendeur_nom)) + ' depuis</span>' + tm(l.attribue_le, 30, l.tentatives ? plural(l.tentatives, 'tentative') : 'sans appel') + '</div>';
      }
      h += '</div></section>';
      // Demande
      h += '<section><h3>Demande</h3><dl class="dl">' + [['Source', l.source_libelle], ['Campagne', l.campagne], ['Reçu le', quand(l.recu_le)], ['Statut BACS', l.statut_bacs]]
          .filter(function (y) { return y[1]; }).map(function (y) { return '<dt>' + y[0] + '</dt><dd>' + esc(y[1]) + '</dd>'; }).join('') + '</dl>'
        + '</section>';
      if (l.qualification) h += '<section><h3>' + (l.par_plateau ? 'Qualification du plateau VROOM' : 'Qualification') + '</h3><p class="qualif">' + esc(l.qualification) + '</p>' + (l.transfere_par_nom ? '<p class="hint">Par ' + esc(propre(l.transfere_par_nom)) + ', le ' + esc(quand(l.transfere_le)) + '.</p>' : '') + '</section>';
      h += sectionBacs();
      h += '</div><footer class="dr-f">' + piedDrawer(l, gere, mien) + '</footer>';
      if (D.demo) h = h.replace('<div class="dr-b">', '<p class="demo">Fiche d\'exemple de la visite guidée : rien n\'est enregistré.</p><div class="dr-b">');
      var top = $drawer.scrollTop;
      $drawer.innerHTML = h;
      $drawer.classList.toggle('composing', !!(D.canal && D.canal !== 'appel'));
      $drawer.scrollTop = top;
    }
    // v69 : la demande initiale du client, visible du premier coup d'œil.
    function demandeHaut(l) {
      var brut = String(l.message || ''), m = brut.match(/^\s*\[([^\]]*)\]\s*/), type = m ? m[1] : '';
      var msg = brut.replace(/^\s*\[[^\]]*\]\s*/, '').trim();
      var veh = l.vehicule || '';
      if (!msg && !veh && !l.campagne) return '';
      var long = msg.length > 220, ouvert = S.dr && S.dr.demOuverte;
      return '<div class="dem-h' + univCls(l) + '"><div class="dem-t"><span>Demande du client</span>' + (l.univers ? '<em class="u' + univCls(l) + '">' + l.univers + '</em>' : '') + (type ? '<em>' + esc(type) + '</em>' : '') + '<small>' + esc(quand(l.recu_le)) + '</small></div>'
        + (veh ? '<p class="dem-v">' + esc(veh) + '</p>' : '')
        + (msg ? '<p class="dem-m' + (long && !ouvert ? ' court' : '') + '">« ' + esc(msg) + ' »</p>' + (long ? '<button type="button" class="lien" data-a="dem-plus">' + (ouvert ? 'Réduire' : 'Lire toute la demande') + '</button>' : '')
          : (l.campagne ? '<p class="dem-m">' + esc(l.campagne) + '</p>' : ''))
        + '</div>';
    }
    function piedDrawer(l, gere, mien) {
      var D = S.dr, h = '';
      if (l.zone === 'plateau') return '<p class="hint">Ce lead est encore au plateau VROOM : il arrivera sur le site une fois qualifié.</p>';
      var libre = l.zone === 'piscine' && !verrouAutre(l);
      if (POSTE === 'vendeur' || (mien && !gere)) {
        if (l.zone === 'piscine') {
          if (!libre) return '<p class="hint">' + esc(propre(l.verrou_nom || 'Un collègue')) + ' regarde ce lead, jusqu\'à ' + hh(l.verrou_jusqu) + '.</p>';
          return '<div class="row"><button type="button" class="btn pri" data-a="prendre" data-id="' + l.id_lead + '">Prendre ce lead</button><span class="hint">Il passe à votre nom, dans « À faire ».</span></div>';
        }
        if (!mien) return '<p class="hint">Ce lead est suivi par ' + esc(propre(l.vendeur_nom || 'un collègue')) + '.</p>';
        return piedResultat(l);
      }
      // Chef des ventes (ou direction qui encadre le site)
      if (!gere) return '<p class="hint">Vue de pilotage. Le chef des ventes du site agit sur ce lead.</p>';
      var mode = D.mode || 'attribuer';
      var MODES = [['attribuer', l.id_user_attribue ? 'Réattribuer' : 'Attribuer'], ['resultat', 'Résultat d\'appel'], ['renvoyer', 'Autre site'], ['clore', 'Clore']];
      h += '<div class="issues" role="radiogroup" aria-label="Geste">' + MODES.map(function (m) { return '<button type="button" role="radio" aria-checked="' + (m[0] === mode) + '" class="' + (m[0] === mode ? 'on' : '') + '" data-a="mode" data-id="' + m[0] + '">' + m[1] + '</button>'; }).join('') + '</div>';
      if (mode === 'attribuer') {
        h += '<div class="row"><select id="dr-vendeur" aria-label="Vendeur">' + optionsVendeurs(l.id_site, l.id_user_attribue) + '</select><button type="button" class="btn pri" data-a="attribuer" data-id="' + l.id_lead + '|dr">' + (l.id_user_attribue ? 'Réattribuer' : 'Attribuer') + '</button></div>'
          + '<div class="row">' + (l.sf_lead_id ? '<button type="button" class="btn vr" data-a="confier" data-id="' + l.id_lead + '">Confier au plateau VROOM</button>' : '')
          + (l.id_user_attribue ? '<button type="button" class="btn" data-a="rendre" data-id="' + l.id_lead + '">Rendre au Pool</button>' : '') + '</div>';
      } else if (mode === 'resultat') {
        h += piedResultat(l, true);
      } else if (mode === 'renvoyer') {
        h += '<div class="row"><select id="dr-site" aria-label="Site">' + sitesRenvoi(l).map(function (s) { return '<option value="' + s.id_site + '">' + esc(siteNom(s.site)) + ' · ' + esc(propre(s.reseau || '')) + '</option>'; }).join('') + '</select><button type="button" class="btn pri" data-a="renvoyer" data-id="' + l.id_lead + '|dr">Renvoyer</button></div>'
          + '<p class="hint">Le lead part dans le Pool du site choisi (ou chez le vendeur du tour de rôle), avec son délai remis à zéro.' + (l.sf_lead_id ? ' BACS reçoit le nouveau site.' : '') + '</p>';
      } else {
        h += piedClore(l);
      }
      return h;
    }
    function piedResultat(l, dansChef) {
      var D = S.dr, r = D.res || 'rdv';
      var RES = [['rdv', 'Joint · RDV'], ['joint', 'Joint · sans RDV'], ['pasjoint', 'Pas joint'], ['clore', 'Clore']];
      var h = '<p class="hint">Après l\'appel, dites ce qui s\'est passé :</p><div class="issues" role="radiogroup" aria-label="Résultat de l\'appel">' + RES.map(function (x) {
        return '<button type="button" role="radio" aria-checked="' + (x[0] === r) + '" class="' + (x[0] === r ? 'on ' + x[0] : '') + '" data-a="res" data-id="' + x[0] + '">' + x[1] + '</button>'; }).join('') + '</div>';
      // v56 : client joint mais lead sans fiche -> d'abord la fiche.
      if ((r === 'rdv' || r === 'joint') && sansFiche(l)) return h + blocRattacher(l);
      h += '<div class="row">';
      if (r === 'rdv') {
        if (!l.id_client) h += '<span class="hint">Pas de fiche client rattachée : le rendez-vous ne peut pas être posé ici.</span>';
        else return h + '</div>' + formRdv(l);
      } else if (r === 'joint') {
        h += '<input type="text" id="res-note" placeholder="Ce qui a été dit (facultatif)" aria-label="Note"><button type="button" class="btn pri" data-a="joint" data-id="' + l.id_lead + '">Enregistrer le contact</button>';
      } else if (r === 'pasjoint') {
        h += '<input type="text" id="res-note" placeholder="Messagerie, numéro erroné…" aria-label="Note"><button type="button" class="btn pri" data-a="pasjoint" data-id="' + l.id_lead + '">Noter la tentative ' + ((l.tentatives || 0) + 1) + ' sur 3</button>';
      } else {
        return h + '</div>' + piedClore(l);
      }
      h += '</div>';
      if (!dansChef) h += '<div class="row pied"><span class="hint">' + (l.sf_lead_id ? 'Lead BACS : le RDV et la clôture partent aussi dans BACS.' : 'Lead hors BACS : tout est enregistré dans One Data.') + '</span><button type="button" class="btn sm ghost" data-a="rendre" data-id="' + l.id_lead + '">Rendre au Pool</button></div>';
      return h;
    }
    // ── v62 : modèles de messages adaptés au lead ─────────────────────────
    function estVO(l) { return /\bVO\b|occasion/i.test(l.vehicule || '') || /centrale|leboncoin|lbc|autoscout|paru|spoticar|vo/i.test((l.source || '') + ' ' + (l.source_libelle || '')); }
    function vehCourt(l) { var v = String(l.vehicule || '').replace(/\s+/g, ' ').trim(); return v ? (v.length > 60 ? v.slice(0, 58) + '…' : v) : ''; }
    function salut(l) {
      var s = String(l.nom || '').trim(), m = /^([A-ZÀ-ÖØ-Ý'’ -]{2,}?)\s+(.*[a-zà-ÿ].*)$/.exec(s);
      return m ? propre(m[2]) + ' ' + propre(m[1]) : nomLead(l);
    }
    function modeles(canalId, l) {
      var cli = salut(l), moi = prenom((S.stats && S.stats.nom) || '') || 'votre conseiller', site = siteNom(l.site) || 'notre concession';
      var v = vehCourt(l), vo = estVO(l), relance = (l.tentatives || 0) > 0;
      var leVeh = v ? 'le ' + v : 'votre projet', duVeh = v ? 'du ' + v : 'de votre projet', auVeh = v ? 'au sujet du ' + v : 'au sujet de votre demande';
      var M;
      if (canalId === 'sms') M = [
        { k: 'Premier contact', t: 'Bonjour ' + cli + ', ' + moi + ' de ' + site + '. J\'ai bien reçu votre demande ' + (v ? 'pour ' + leVeh : '') + '. À quel moment puis-je vous appeler ?' },
        vo ? { k: 'Véhicule disponible', t: 'Bonjour ' + cli + ', ' + leVeh + ' est toujours disponible à ' + site + '. Je peux vous le réserver pour un essai : quel jour vous arrange ? ' + moi }
           : { k: 'Proposer un essai', t: 'Bonjour ' + cli + ', je vous propose un essai ' + duVeh + ' cette semaine à ' + site + '. Plutôt en semaine ou le samedi ? ' + moi },
        { k: 'Après un appel manqué', t: 'Bonjour ' + cli + ', j\'ai essayé de vous joindre ' + auVeh + '. Répondez simplement à ce SMS avec un créneau qui vous convient. ' + moi + ', ' + site }];
      else if (canalId === 'wa') M = [
        { k: 'Premier contact', m: 'Modèle WhatsApp validé par Meta : votre phrase s\'insère après la présentation.', t: 'Vous nous avez écrit ' + auVeh + ' : je peux répondre à vos questions ici.' },
        vo ? { k: 'Véhicule disponible', m: 'Modèle WhatsApp validé par Meta.', t: (v ? 'Le ' + v : 'Le véhicule') + ' est toujours disponible, je peux vous envoyer ses photos et son historique.' }
           : { k: 'Proposer un essai', m: 'Modèle WhatsApp validé par Meta.', t: 'Je peux vous proposer un essai ' + duVeh + ' cette semaine.' },
        { k: 'Après un appel manqué', m: 'Modèle WhatsApp validé par Meta.', t: 'J\'ai essayé de vous joindre ' + auVeh + '.' }];
      else M = [
        vo ? { k: 'Réponse à votre annonce', s: 'Votre demande pour ' + (v ? leVeh : 'notre véhicule'), t: 'Bonjour ' + cli + ',\n\nMerci pour votre intérêt pour ' + (v ? leVeh : 'notre véhicule') + '. Il est disponible à ' + site + '.\n\nJe vous propose de venir l\'essayer : quel jour vous conviendrait ?\n\n' + moi + '\n' + site }
           : { k: 'Réponse à votre demande', s: 'Votre projet' + (v ? ' ' + v : ''), t: 'Bonjour ' + cli + ',\n\nMerci pour votre demande ' + (v ? 'concernant ' + leVeh : '') + '. Je reste à votre disposition pour vous présenter les offres du moment.\n\nJe vous propose un essai à ' + site + ' : quel jour vous conviendrait ?\n\n' + moi + '\n' + site },
        { k: 'Estimation de votre reprise', s: 'Estimation de votre véhicule actuel', t: 'Bonjour ' + cli + ',\n\nPour préparer votre projet, je peux estimer votre véhicule actuel. Envoyez-moi sa carte grise et son kilométrage, ou passez 20 minutes à ' + site + '.\n\n' + moi },
        { k: 'Après un appel manqué', s: 'Votre demande · ' + site, t: 'Bonjour ' + cli + ',\n\nJ\'ai essayé de vous joindre ' + auVeh + '. Indiquez-moi un créneau de rappel en répondant à ce message.\n\n' + moi + '\n' + site }];
      // Conseillé : après un appel manqué, le message qui le dit ; sinon le premier.
      var reco = relance ? M.length - 1 : 0;
      M.forEach(function (x, i) { x.reco = i === reco; });
      return M;
    }
    function composeHtml(l) {
      var D = S.dr;
      if (!D || !D.canal || D.canal === 'appel') return '';
      var M = modeles(D.canal, l), i = D.tpl == null ? M.findIndex(function (x) { return x.reco; }) : D.tpl;
      if (i < 0) i = 0;
      var m = M[i], lib = { sms: 'SMS', wa: 'WhatsApp', mail: 'E-mail' }[D.canal];
      var txt = D.txt != null ? D.txt : m.t, subj = D.subj != null ? D.subj : (m.s || '');
      return '<section class="compose ' + D.canal + '"><h3>' + lib + ' · modèles adaptés à ce lead</h3><div class="tpls">' + M.map(function (x, j) {
          return '<button type="button" class="tpl' + (j === i ? ' on' : '') + '" data-a="tpl" data-id="' + j + '">' + esc(x.k) + (x.reco ? '<span class="reco">conseillé</span>' : '') + '</button>'; }).join('') + '</div>'
        + (m.m ? '<p class="hint">' + esc(m.m) + '</p>' : '')
        + (D.canal === 'mail' ? '<input type="text" id="cp-subj" value="' + esc(subj) + '" aria-label="Objet">' : '')
        + '<textarea id="cp-txt" rows="' + (D.canal === 'mail' ? 7 : 3) + '" aria-label="Message">' + esc(txt) + '</textarea>'
        + '<div class="row"><span class="hint">' + (D.canal === 'wa' ? 'La fenêtre WhatsApp s\'ouvre avec ce motif : vous relisez puis envoyez.' : 'La fenêtre ' + lib + ' s\'ouvre avec ce texte : vous relisez puis envoyez.') + '</span>'
        + '<button type="button" class="btn pri" data-a="canal-ouvrir">Ouvrir dans ' + lib + '</button><button type="button" class="btn ghost sm" data-a="canal-fermer">Annuler</button></div></section>';
    }
    var OBJETS_RDV = ['RDV Vente', 'Essai', 'Estimation de reprise', 'Livraison VN', 'Livraison VO'];
    function creneau(j, hr) { var d = new Date(); d.setDate(d.getDate() + j); d.setHours(hr, 0, 0, 0); return d; }
    function samediProchain() { var d = new Date(); var k = (6 - d.getDay() + 7) % 7 || 7; return creneau(k, 10); }
    function formRdv(l) {
      var D = S.dr, f = D.rdvF || (D.rdvF = { objet: estVO(l) ? 'Essai' : 'RDV Vente', date: dateLocale(creneau(1, 10)), duree: '60', inv: [], com: '' });
      var rapides = [['Demain 10:00', creneau(1, 10)], ['Demain 14:00', creneau(1, 14)], ['Samedi 10:00', samediProchain()]];
      var invS = S.invitables[l.id_site];
      if (!invS) chargerInvitables(l.id_site);
      var inv = (invS || []).filter(function (u) { return Number(u.id_user) !== Number(l.id_user_attribue || MOI); });
      var choisis = inv.filter(function (u) { return f.inv.indexOf(Number(u.id_user)) !== -1; });
      var h = '<div class="rdvf">'
        + '<div class="q"><span>Objet <em class="bacs-tag">libellés BACS</em></span><div class="chips">' + OBJETS_RDV.map(function (o) {
            return '<button type="button" class="qk' + (f.objet === o ? ' on' : '') + '" data-a="rdv-objet" data-id="' + esc(o) + '">' + esc(o) + '</button>'; }).join('') + '</div></div>'
        + '<div class="q"><span>Quand</span><div class="chips">' + rapides.map(function (x) {
            var v = dateLocale(x[1]); return '<button type="button" class="qk' + (f.date === v ? ' on' : '') + '" data-a="rdv-quand" data-id="' + v + '">' + x[0] + '</button>'; }).join('') + '</div>'
        + '<div class="row"><input type="datetime-local" id="rdv-date" value="' + esc(f.date) + '" aria-label="Date et heure"><select id="rdv-duree" aria-label="Durée">'
        + [['30', '30 min'], ['60', '1h00'], ['90', '1h30'], ['120', '2h00']].map(function (d) { return '<option value="' + d[0] + '"' + (f.duree === d[0] ? ' selected' : '') + '>' + d[1] + '</option>'; }).join('') + '</select></div></div>'
        + '<div class="q"><span>Inviter un collègue</span><div class="inv-l">'
        + choisis.map(function (u) { return '<span class="inv-t">' + esc(propre(u.nom)) + '<button type="button" data-a="rdv-inv" data-id="' + u.id_user + '" aria-label="Retirer ' + esc(propre(u.nom)) + '">\u00d7</button></span>'; }).join('')
        + (invS == null ? '<span class="hint">Chargement des collègues…</span>' : !inv.length ? '<span class="hint">Aucun collègue du site à inviter.</span>'
          : '<div class="k-vend-sel"><button type="button" class="k-vend k-vend-btn" data-a="inv-menu" aria-expanded="' + !!D.invMenu + '"><span class="k-vend-l">Collègue</span><span class="k-vend-n">' + (choisis.length ? 'Ajouter' : 'Choisir') + ' <span class="k-caret">\u25be</span></span></button>'
            + (D.invMenu ? '<div class="k-vpanel"><input type="text" class="k-vsearch" data-x="inv-q" placeholder="Rechercher un collègue…" value="' + esc(D.invQ || '') + '"><div class="k-vlist">' + listeInvites(inv, f) + '</div></div>' : '') + '</div>')
        + '</div></div>'
        + '<div class="q"><span>Commentaire</span><textarea id="rdv-com" rows="2" placeholder="Ex. vient avec sa Clio pour la reprise, préparer le véhicule">' + esc(f.com) + '</textarea></div>'
        + '<div class="row"><button type="button" class="btn vr big" data-a="rdv" data-id="' + l.id_lead + '">Valider le rendez-vous</button></div>'
        + '<p class="hint">' + (l.sf_lead_id ? 'Le rendez-vous part dans l\'agenda One Data et dans BACS, avec son objet et ses invités.' : 'Le rendez-vous part dans l\'agenda One Data.') + '</p></div>';
      return h;
    }
    // Liste du menu « Collègue » : mêmes groupes que la gestion des ventes.
    function listeInvites(inv, f) {
      var q = String((S.dr && S.dr.invQ) || '').toLowerCase().trim(), last = null, h = '';
      inv.filter(function (u) { return !q || String(propre(u.nom)).toLowerCase().indexOf(q) !== -1; }).forEach(function (u) {
        var g = u.groupe || 'Vendeurs';
        if (g !== last) { h += '<div class="k-vgroup">' + esc(g) + '</div>'; last = g; }
        var on = f.inv.indexOf(Number(u.id_user)) !== -1;
        h += '<button type="button" class="k-vitem' + (on ? ' on' : '') + '" data-a="rdv-inv" data-id="' + u.id_user + '">' + (on ? '\u2713 ' : '') + esc(propre(u.nom)) + '</button>';
      });
      return h || '<div class="k-vempty">Aucun collègue trouvé.</div>';
    }
    // v69 : seulement l'équipe du site du lead (chef des ventes, secrétariat
    // commercial, vendeurs hors grands comptes) — lead_invitables.
    async function chargerInvitables(site) {
      if (site == null || S.invitables[site] || S._invEnCours) return; S._invEnCours = true;
      try { S.invitables[site] = await rpc('lead_invitables', { p_id_site: Number(site) }) || []; } catch (e) { S.invitables[site] = []; }
      S._invEnCours = false;
      if (S.dr) renderDrawerPreserve();
    }
    function lireRdvF() {
      var D = S.dr; if (!D || !D.rdvF) return;
      var g = function (s) { return $drawer.querySelector(s); };
      if (g('#rdv-date')) D.rdvF.date = g('#rdv-date').value;
      if (g('#rdv-duree')) D.rdvF.duree = g('#rdv-duree').value;
      if (g('#rdv-com')) D.rdvF.com = g('#rdv-com').value;
    }

    // ── v56 : rattacher le lead à une fiche client ─────────────────────────
    function sansFiche(l) { return !l.id_client && !!(l.telephone || l.email); }
    function blocRattacher(l) {
      var D = S.dr;
      if (!D.cands || !D.cands.charge) { if (!D.cands) chargerCandidats(l.id_lead); return '<div class="ratt"><p class="ratt-t">Ce lead n\'a pas encore de fiche client</p><p class="hint">Recherche des fiches qui pourraient correspondre…</p></div>'; }
      if (D.cands.erreur) return '<div class="ratt"><p class="ratt-t">Ce lead n\'a pas encore de fiche client</p><p class="hint err">' + esc(D.cands.erreur) + '</p></div>';
      var c = D.cands.candidats || [];
      var IND = { mobile_identique: 'même mobile', email_identique: 'même email', siret_identique: 'même SIRET', nom_prenom_exact: 'même nom et prénom', nom_societe_equivalent: 'même société', naissance_differente: 'naissance différente' };
      var h = '<div class="ratt"><p class="ratt-t">Ce lead n\'a pas encore de fiche client</p>'
        + '<p class="hint">Avant de noter le contact, dites qui est ce client. ' + (c.length ? 'Ces fiches lui ressemblent : comparez avec ce qu\'il vous dit.' : 'Aucune fiche existante ne lui ressemble.') + '</p>';
      if (c.length) {
        h += '<ul class="ratt-l">' + c.map(function (x) {
          var nom = [x.civilite, x.prenom, x.nom].filter(Boolean).map(propre).join(' ') || 'Fiche ' + x.id_client;
          var ind = (x.indices || []).map(function (k) { return IND[k]; }).filter(Boolean);
          return '<li><div><b>' + esc(nom) + '</b><small>' + esc([x.ville ? propre(x.ville) : '', x.mobile, x.email].filter(Boolean).join(' · ')) + '</small>'
            + (ind.length ? '<small class="ind">' + esc(ind.join(' · ')) + '</small>' : '') + '</div>'
            + '<button type="button" class="btn pri sm" data-a="rattacher" data-id="' + l.id_lead + '|' + x.id_client + '">C\'est ce client</button></li>';
        }).join('') + '</ul>';
      }
      h += '<div class="row"><button type="button" class="btn" data-a="rattacher" data-id="' + l.id_lead + '|new">' + (c.length ? 'Aucune ne correspond : créer sa fiche' : 'Créer sa fiche') + '</button>'
        + '<span class="hint">La fiche reprend le nom, le mobile et l\'email du lead.</span></div></div>';
      return h;
    }
    async function chargerCandidats(id) {
      var D = S.dr; if (!D || D.cands) return;
      D.cands = { charge: false, candidats: [] };
      try {
        var r = await rpc('poste_lead_candidats', { p_id_lead: Number(id) });
        if (!S.dr || Number(S.dr.id) !== Number(id)) return;
        S.dr.cands = { charge: true, candidats: (r && r.candidats) || [] };
        if (r && r.rattache) { await rafraichir(true); return; }
      } catch (e) {
        if (S.dr && Number(S.dr.id) === Number(id)) S.dr.cands = { charge: true, erreur: messageErreur(e) };
      }
      if (S.dr && Number(S.dr.id) === Number(id)) renderDrawerPreserve();
    }
    function rattacher(v) {
      var p = String(v).split('|'), id = Number(p[0]), idc = p[1] === 'new' ? null : Number(p[1]);
      var l = leadDe(id);
      return geste(async function () {
        var r = await rpc('poste_lead_rattacher', { p_id_lead: id, p_id_client: idc });
        if (S.dr && Number(S.dr.id) === id) S.dr.cands = null;
        toast(r && r.cree ? 'Fiche client créée pour ' + nomLead(l) + '. Notez maintenant le résultat de l\'appel.'
                          : nomLead(l) + ' est rattaché à sa fiche client. Notez maintenant le résultat de l\'appel.');
        await rafraichir(true);
      });
    }
    function piedClore(l) {
      return '<div class="row"><select id="clore-motif" aria-label="Motif">' + MOTIFS_CLORE.map(function (m) { return '<option value="' + m[0] + '">' + m[1] + '</option>'; }).join('') + '</select>'
        + '<input type="text" id="clore-note" placeholder="Précision (facultatif)" aria-label="Précision"><button type="button" class="btn dang" data-a="clore" data-id="' + l.id_lead + '">Clore le lead</button></div>'
        + (l.sf_lead_id ? '<p class="hint">Le lead est aussi abandonné dans BACS, avec le motif équivalent.</p>' : '');
    }
    function sectionBacs() {
      var D = S.dr; if (!D || !D.envois || !D.envois.length) return '';
      var ech = false;
      var lis = D.envois.map(function (e) {
        var st = e.statut === 'fait' ? '<span class="tag ok">Fait à ' + esc(quand(e.fait_le)) + '</span>'
          : e.statut === 'echec' ? (ech = true, '<span class="tag crit">Échec</span>')
          : e.statut === 'abandonne' ? '<span class="tag">Abandonné</span>' : '<span class="tag warn">En attente</span>';
        return '<li><div><b>' + esc(e.resume || e.geste) + '</b><small>déposé ' + esc(quand(e.cree_le)) + (e.tentatives > 1 ? ' · ' + e.tentatives + ' essais' : '') + '</small>'
          + (e.statut === 'echec' && e.erreur ? '<small class="err">' + esc(e.erreur) + '</small>' : '') + '</div>' + st + '</li>';
      }).join('');
      return '<section><h3>Dans BACS</h3><ul class="env">' + lis + '</ul>'
        + (ech ? '<div class="row"><button type="button" class="btn" data-a="bacs-relancer">Relancer l\'envoi</button><span class="hint">Les gestes en échec repartent pour cinq essais.</span></div>' : '') + '</section>';
    }
    function dateLocale(d) {
      var p = function (n) { return String(n).padStart(2, '0'); };
      return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':' + p(d.getMinutes());
    }
    function demainA(hr, j) { var d = new Date(); d.setDate(d.getDate() + (j || 1)); d.setHours(hr, 0, 0, 0); return d; }
    function lireForm() {
      var g = function (s) { var x2 = $drawer.querySelector(s); return x2 ? x2.value : null; };
      return { vendeur: g('#dr-vendeur'), site: g('#dr-site'), note: g('#res-note'), motif: g('#clore-motif'), cnote: g('#clore-note') };
    }
    function lireCompose() {
      var D = S.dr; if (!D || !D.canal) return;
      var a = $drawer.querySelector('#cp-txt'), b = $drawer.querySelector('#cp-subj');
      if (a) D.txt = a.value; if (b) D.subj = b.value;
    }
    function renderDrawerPreserve() {
      var v = lireForm();
      lireRdvF(); lireCompose();
      var pTop = $drawer.scrollTop;
      renderDrawer();
      $drawer.scrollTop = pTop;
      Object.keys(v).forEach(function (k) {
        if (v[k] == null) return;
        var sel = { vendeur: '#dr-vendeur', site: '#dr-site', note: '#res-note', motif: '#clore-motif', cnote: '#clore-note' }[k];
        var x2 = $drawer.querySelector(sel); if (x2) x2.value = v[k];
      });
    }
    // Visite guidée : ouvre la fiche d'un lead du poste. Vendeur : un de ses
    // leads ; chef et direction : un lead du site affiché. S'il n'y en a pas,
    // une fiche d'exemple (copie d'un lead visible) où aucun geste n'est
    // enregistré.
    async function ouvrirExemple() {
      var sid = sitePoste();
      var l = POSTE === 'vendeur' ? mesLeads()[0] : leadsDu(sid).filter(function (z) { return z.zone !== 'plateau'; })[0];
      if (l) { S.cell = null; return ouvrir(l.id_lead); }
      var src = S.leads.filter(function (z) { return z.zone !== 'plateau'; })[0] || S.leads[0];
      var x = src ? JSON.parse(JSON.stringify(src)) : { id_lead: 0, prenom: 'Client', nom: 'Exemple', site: (siteInfo(sid) || {}).site, id_site: sid,
        recu_le: new Date(Date.now() - 1500000).toISOString(), arrive_le: new Date(Date.now() - 1500000).toISOString(), sla_site: 60, source_libelle: 'Site constructeur' };
      if (POSTE === 'vendeur') { x.zone = 'vendeur'; x.id_user_attribue = MOI; x.vendeur_nom = (S.stats && S.stats.nom) || ''; x.attribue_le = new Date(Date.now() - 600000).toISOString(); x.verrou_par = null; }
      else if (!x.zone || x.zone === 'plateau') x.zone = 'piscine';
      S.cell = null;
      S.dr = { id: x.id_lead, l: x, envois: [], mode: null, res: null, demo: true };
      $scrim.hidden = false; $drawer.hidden = false;
      renderDrawer();
    }
    async function ouvrir(id) {
      var l = S.leads.find(function (x) { return Number(x.id_lead) === Number(id); });
      if (!l) { toast('Ce lead n\'est plus ouvert.', true); return; }
      S.dr = { id: l.id_lead, l: l, envois: null, mode: null, res: null, cands: null };
      $scrim.hidden = false; $drawer.hidden = false;
      renderDrawer();
      try { S.dr.envois = await rpc('poste_bacs_envois', { p_id_lead: Number(id) }) || []; } catch (e) { if (S.dr) S.dr.envois = []; }
      if (S.dr && Number(S.dr.id) === Number(id)) renderDrawerPreserve();
    }
    // Fiche ouverte depuis le volet : on revient à la liste ; sinon on ferme tout.
    function fermerDrawer() { if (S.cell) { S.dr = null; renderVolet(); return; } fermerTout(); }
    function fermerTout() {
      var avait = !!S.cell;
      S.dr = null; S.cell = null; $scrim.hidden = !S.modal; $drawer.hidden = true; $drawer.innerHTML = '';
      if (avait) render();
    }

    // ── Fenêtres ──────────────────────────────────────────────────────────
    function ouvrirModal(html) {
      S.modal = true;
      $modal.innerHTML = '<div class="mb" role="dialog" aria-modal="true">' + html + '</div>';
      $modal.hidden = false; $scrim.hidden = false;
      var f = $modal.querySelector('input,select,button'); if (f) try { f.focus(); } catch (e) {}
    }
    function fermerModal() { S.modal = null; $modal.hidden = true; $modal.innerHTML = ''; if ($drawer.hidden) $scrim.hidden = true; }
    var X_SVG = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>';
    async function modalSolder(sid) {
      var si = siteInfo(sid) || {};
      ouvrirModal('<div class="mb-h"><div><h2>Solder le stock · ' + esc(siteNom(si.site)) + '</h2><p>Comptage en cours…</p></div><button type="button" class="x" data-a="modal-close" aria-label="Fermer">' + X_SVG + '</button></div>');
      var est;
      try { est = await rpc('poste_solder', { p_id_site: Number(sid), p_mode: 'equipe', p_dry_run: true }); }
      catch (e) { fermerModal(); toast(messageErreur(e), true); return; }
      var n = est.leads || 0, nb = est.leads_bacs || 0;
      ouvrirModal('<div class="mb-h"><div><h2>Solder le stock · ' + esc(siteNom(si.site)) + '</h2><p>' + plural(n, 'lead ouvert', 'leads ouverts') + ' depuis plus de 24 h, dont ' + nb + ' venant de BACS. Choisissez ce qu\'ils deviennent, en une fois.</p></div><button type="button" class="x" data-a="modal-close" aria-label="Fermer">' + X_SVG + '</button></div><div class="mb-b">'
        + '<label class="opt"><input type="radio" name="sold" value="vroom"' + (nb ? ' checked' : ' disabled') + '><span><b>Confier les ' + nb + ' leads BACS au plateau VROOM</b><small>Le plateau rappelle et requalifie ; ceux qui ont encore un projet reviennent sur le site. Les autres leads restent ouverts.</small></span></label>'
        + '<label class="opt"><input type="radio" name="sold" value="equipe"' + (nb ? '' : ' checked') + '><span><b>Les répartir sur l\'équipe</b><small>Selon la règle du site, le moins chargé d\'abord.</small></span></label>'
        + '<label class="opt"><input type="radio" name="sold" value="clore"><span><b>Les clore « sans suite, stock avant déploiement »</b><small>Ils sortent des délais. Rien n\'est effacé, le motif est conservé. BACS n\'est pas modifié.</small></span></label>'
        + '</div><div class="mb-f"><button type="button" class="btn ghost" data-a="modal-close">Annuler</button><button type="button" class="btn pri" data-a="solder-ok" data-id="' + sid + '"' + (n ? '' : ' disabled') + '>Appliquer</button></div>');
    }
    function modalCampagne() {
      var gere = sitesStats().filter(function (s) { return s.manager || POSTE === 'direction'; });
      var sid = sitePoste();
      ouvrirModal('<div class="mb-h"><div><h2>Créer une campagne</h2><p>Choisissez qui relancer. La cible est estimée avant tout envoi ; rien n\'est créé sans votre confirmation.</p></div><button type="button" class="x" data-a="modal-close" aria-label="Fermer">' + X_SVG + '</button></div><div class="mb-b"><div class="fg">'
        + '<label class="full">Nom de la campagne<input type="text" id="c-nom" placeholder="ex. Fin de LOA Yaris 2023"></label>'
        + '<label>Site<select id="c-site">' + (gere.length > 1 ? '<option value="">Tous mes sites</option>' : '') + gere.map(function (s) { return '<option value="' + s.id_site + '"' + (Number(s.id_site) === Number(sid) ? ' selected' : '') + '>' + esc(siteNom(s.site)) + '</option>'; }).join('') + '</select></label>'
        + '<label>Clients<select id="c-type"><option value="">Particuliers et sociétés</option><option value="particulier">Particuliers</option><option value="societe">Sociétés</option></select></label>'
        + '<label>Marque du véhicule<input type="text" id="c-marque" placeholder="ex. TOYOTA"></label>'
        + '<label>Modèle (contient)<input type="text" id="c-modele" placeholder="ex. C-HR"></label>'
        + '<label>Âge du véhicule, au moins (ans)<input type="number" id="c-age" min="0" max="30"></label>'
        + '<label>Kilométrage, au moins<input type="number" id="c-kmmin" min="0" step="5000"></label>'
        + '<label>Kilométrage, au plus<input type="number" id="c-kmmax" min="0" step="5000"></label>'
        + '<label>Départements<input type="text" id="c-dep" placeholder="ex. 94, 92"></label>'
        + '<label class="chk full"><input type="checkbox" id="c-excl" checked> Exclure les clients qui ont déjà un cycle ouvert</label>'
        + '<label class="full">Répartition<select id="c-aff"><option value="equitable">Équitable entre les vendeurs actifs du site</option><option value="habituel">Le vendeur habituel du client d\'abord</option><option value="charge">Selon la charge de chacun</option><option value="manuelle">Je choisis les vendeurs</option></select></label>'
        + '<div class="full" id="c-vend" hidden></div>'
        + '</div><div class="est" id="c-est">Réglez les critères puis estimez la cible.</div></div>'
        + '<div class="mb-f"><button type="button" class="btn ghost" data-a="modal-close">Annuler</button><button type="button" class="btn" data-a="camp-estimer">Estimer la cible</button><button type="button" class="btn pri" data-a="camp-lancer" id="c-go" disabled>Lancer la campagne</button></div>');
      majVendeursCamp();
    }
    function majVendeursCamp() {
      var box = $modal.querySelector('#c-vend'); if (!box) return;
      var manuel = ($modal.querySelector('#c-aff') || {}).value === 'manuelle';
      box.hidden = !manuel;
      if (!manuel) return;
      var sid = ($modal.querySelector('#c-site') || {}).value;
      var vs = ((S.stats && S.stats.vendeurs) || []).filter(function (v) { return !sid || Number(v.id_site) === Number(sid); });
      var vus = {};
      box.innerHTML = '<div class="chips">' + vs.filter(function (v) { if (vus[v.id_user]) return false; vus[v.id_user] = 1; return true; }).map(function (v) {
        return '<label class="chip"><input type="checkbox" class="c-v" value="' + v.id_user + '"><span>' + esc(propre(v.nom)) + '</span></label>'; }).join('') + '</div>';
    }
    function paramsCampagne(dry) {
      var g = function (id) { var e = $modal.querySelector('#' + id); return e ? String(e.value || '').trim() : ''; };
      var num = function (v) { if (!v) return null; var n = parseFloat(String(v).replace(',', '.')); return isNaN(n) ? null : n; };
      var site = g('c-site');
      var deps = g('c-dep').split(/[\s,;]+/).map(function (s) { return s.trim(); }).filter(Boolean);
      var vends = Array.prototype.slice.call($modal.querySelectorAll('.c-v:checked')).map(function (e) { return Number(e.value); });
      return {
        p_viewer_id_user: Number(MOI), p_dry_run: !!dry,
        p_site_ids: site ? [Number(site)] : sitesStats().filter(function (s) { return s.manager || POSTE === 'direction'; }).map(function (s) { return Number(s.id_site); }),
        p_type: g('c-type') || null, p_marque: g('c-marque') || null, p_modele: g('c-modele') || null,
        p_vehicule_age_min: g('c-age') ? parseInt(g('c-age'), 10) : null, p_km_min: num(g('c-kmmin')), p_km_max: num(g('c-kmmax')),
        p_departements: deps.length ? deps : null, p_csp: null,
        p_exclure_cycle_ouvert: !!($modal.querySelector('#c-excl') || {}).checked,
        p_affectation: g('c-aff') || 'equitable', p_vendeurs_manuels: vends.length ? vends : null,
        p_nom_campagne: g('c-nom') || null
      };
    }
    function nomVendeur(id) { var v = ((S.stats && S.stats.vendeurs) || []).find(function (x) { return Number(x.id_user) === Number(id); }); return v ? propre(v.nom) : 'Vendeur ' + id; }
    async function estimerCampagne() {
      var p = paramsCampagne(true), est = $modal.querySelector('#c-est'), go = $modal.querySelector('#c-go');
      if (p.p_affectation === 'manuelle' && !p.p_vendeurs_manuels) { est.innerHTML = '<span class="t-crit">Choisissez au moins un vendeur.</span>'; return; }
      est.textContent = 'Estimation en cours…'; go.disabled = true;
      try {
        var r = await rpc('creer_campagne_sollicitation', p) || [];
        var aff = r.filter(function (x) { return x.o_id_user != null; });
        var n = aff.reduce(function (a, x) { return a + Number(x.o_nb_cibles || 0); }, 0);
        var non = r.filter(function (x) { return x.o_id_user == null; }).reduce(function (a, x) { return a + Number(x.o_nb_cibles || 0); }, 0);
        var parV = {}; aff.forEach(function (x) { parV[x.o_id_user] = (parV[x.o_id_user] || 0) + Number(x.o_nb_cibles || 0); });
        var nv = Object.keys(parV).length;
        est.innerHTML = 'Cible estimée : <b>' + n + '</b> clients, répartis sur <b>' + nv + '</b> vendeurs, soit environ <b>' + (nv ? Math.ceil(n / nv) : 0) + '</b> chacun.'
          + (non ? ' <span class="t-warn">' + non + ' sans vendeur actif, non affectés.</span>' : '')
          + (nv ? '<div class="est-v">' + Object.keys(parV).sort(function (a, b) { return parV[b] - parV[a]; }).map(function (k) { return '<span>' + esc(nomVendeur(k)) + ' <b>' + parV[k] + '</b></span>'; }).join('') + '</div>' : '');
        S.estim = { n: n };
        go.disabled = !n;
      } catch (e) { est.innerHTML = '<span class="t-crit">' + esc(messageErreur(e)) + '</span>'; }
    }
    async function lancerCampagne() {
      var p = paramsCampagne(false), est = $modal.querySelector('#c-est');
      if (!p.p_nom_campagne) { est.innerHTML = '<span class="t-crit">Donnez un nom à la campagne avant de la lancer.</span>'; return; }
      var go = $modal.querySelector('#c-go');
      if (go.getAttribute('data-confirme') !== '1') { go.setAttribute('data-confirme', '1'); go.textContent = 'Confirmer : créer ' + ((S.estim && S.estim.n) || '') + ' relances'; return; }
      return geste(async function () {
        var r = await rpc('creer_campagne_sollicitation', p) || [];
        var n = r.filter(function (x) { return x.o_id_user != null; }).reduce(function (a, x) { return a + Number(x.o_nb_cibles || 0); }, 0);
        fermerModal(); toast('Campagne « ' + p.p_nom_campagne + ' » lancée : ' + plural(n, 'relance créée', 'relances créées') + '.');
        S.campagnes = null; render(); await chargerCampagnes(); render();
      });
    }

    // ── Gestes ────────────────────────────────────────────────────────────
    var occupe = false;
    async function geste(fn) {
      if (S.dr && S.dr.demo) { toast(S.demoMode ? 'Démonstration : en situation réelle, ce geste serait enregistré dans One Data et reporté dans BACS.' : 'Visite guidée : rien n\'est enregistré sur la fiche d\'exemple.'); return; }
      if (occupe) return; occupe = true;
      ov.classList.add('busy'); root.classList.add('busy');
      try { await fn(); }
      catch (e) { toast(messageErreur(e), true); }
      finally { occupe = false; ov.classList.remove('busy'); root.classList.remove('busy'); }
    }
    function reveillerBacs() { try { if (OD.bacs && typeof OD.bacs.demander === 'function') OD.bacs.demander('vider_file', {}, 4000); } catch (e) {} }
    function apres(msg, garder) { reveillerBacs(); toast(msg); if (!garder) fermerDrawer(); return rafraichir(true); }
    function leadDe(id) { return S.leads.find(function (x) { return Number(x.id_lead) === Number(id); }) || {}; }
    function prendre(id) {
      return geste(async function () {
        var r = await rpc('poste_prendre', { p_id_lead: Number(id) });
        if (r && r.action === 'reserve') { await rafraichir(true); S.tab = POSTE === 'vendeur' ? S.tab : S.tab; toast('Lead pris : il est dans « À rappeler ».'); return ouvrir(id); }
        if (r && r.action === 'occupe') toast('Déjà pris par ' + propre(r.par_nom || 'un collègue') + '.', true);
        else if (r && r.action === 'clos') toast('Ce lead est déjà traité.', true);
        else if (r && r.action === 'univers') toast('Ce lead ' + r.univers + ' est réservé aux vendeurs ' + r.univers + '.', true);
        rafraichir(true);
      });
    }
    function attribuer(v) {
      var p = String(v).split('|'), id = p[0], dr = p[1] === 'dr';
      var sel = dr ? $drawer.querySelector('#dr-vendeur') : (root.querySelector('#sel-' + id) || $drawer.querySelector('#sel-' + id));
      if (!sel || !sel.value) { toast('Aucun vendeur rattaché à ce site.', true); return; }
      var l = leadDe(id);
      return geste(async function () {
        var r = await rpc('poste_attribuer', { p_id_lead: Number(id), p_id_user: Number(sel.value) });
        apres(nomLead(l) + ' attribué à ' + propre((r && r.vers_nom) || nomVendeur(sel.value)), !dr);
      });
    }
    function rdv(id) {
      lireRdvF();
      var D = S.dr, f = (D && D.rdvF) || {}, l = leadDe(id);
      var d = f.date ? new Date(f.date) : null;
      if (!d || isNaN(d.getTime()) || d.getTime() < Date.now() - 3600000) { toast('Choisissez la date du rendez-vous.', true); return; }
      var fin = new Date(d.getTime() + (Number(f.duree) || 60) * 60000);
      var loc = function (x) { var q = function (n) { return String(n).padStart(2, '0'); }; return x.getFullYear() + '-' + q(x.getMonth() + 1) + '-' + q(x.getDate()) + ' ' + q(x.getHours()) + ':' + q(x.getMinutes()) + ':00'; };
      var objet = f.objet || 'RDV Vente', com = String(f.com || '').trim();
      return geste(async function () {
        var r = await rpc('lead_rdv_creer', { p_id_lead: Number(id), p_start: loc(d), p_end: loc(fin), p_sujet: objet, p_commentaire: com || null, p_invites: (f.inv || []).length ? f.inv.map(Number) : null });
        await rpc('poste_resultat', { p_id_lead: Number(id), p_resultat: 'joint_rdv', p_note: objet + (com ? ' · ' + com : '') });
        var jourTxt = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) + ' à ' + hh(d);
        apres(objet + ' le ' + jourTxt + ' : dans l\'agenda' + (r && r.vers_bacs ? ' et envoyé à BACS' : '') + ((f.inv || []).length ? ', ' + plural(f.inv.length, 'collègue invité', 'collègues invités') : '') + '.');
      });
    }
    function resultat(id, res) {
      var f = lireForm(), l = leadDe(id);
      return geste(async function () {
        var r = await rpc('poste_resultat', { p_id_lead: Number(id), p_resultat: res, p_note: (f.note || '').trim() || null });
        if (res === 'pas_joint') apres('Tentative ' + ((r && r.tentatives) || '') + ' notée. ' + (r && r.tentatives >= 3 ? 'Trois essais : pensez à clore ou à confier le lead.' : 'Le lead reste dans « À faire ».'));
        else apres('Contact enregistré : ' + nomLead(l) + ' sort de vos leads à appeler.');
      });
    }
    function clore(id) {
      var f = lireForm(), l = leadDe(id);
      return geste(async function () {
        var r = await rpc('poste_clore', { p_id_lead: Number(id), p_motif: f.motif || 'autre', p_note: (f.cnote || '').trim() || null });
        apres(nomLead(l) + ' clos' + (r && r.vers_bacs ? ', et abandonné dans BACS' : '') + '.');
      });
    }
    function rendre(id) {
      var l = leadDe(id);
      return geste(async function () {
        await rpc('poste_rendre', { p_id_lead: Number(id), p_motif: null });
        apres(nomLead(l) + ' est de nouveau dans le Pool' + (POSTE !== 'vendeur' && l.vendeur_nom ? ' (repris à ' + prenom(l.vendeur_nom) + ')' : '') + '.');
      });
    }
    function confier(id) {
      var l = leadDe(id);
      return geste(async function () {
        var r = await rpc('poste_confier_plateau', { p_id_lead: Number(id), p_note: null });
        if (r && r.ok === false) { toast(r.motif || 'Impossible de confier ce lead au plateau.', true); return; }
        apres(nomLead(l) + ' confié au plateau VROOM : rappel dans 30 min' + (r && r.vers_bacs ? ', BACS mis à jour.' : '.'));
      });
    }
    function renvoyer(v) {
      var p = String(v).split('|'), id = p[0], dr = p[1] === 'dr';
      var sel = dr ? $drawer.querySelector('#dr-site') : root.querySelector('#sit-' + id);
      if (!sel || !sel.value) return;
      var l = leadDe(id), cible = siteInfo(sel.value) || {};
      return geste(async function () {
        var r = await rpc('lead_transferer_site', { p_id_lead: Number(id), p_id_site: Number(sel.value), p_qualification: null, p_id_user_cible: null });
        if (r && r.ok === false) { toast('Renvoi impossible : ' + (r.motif || 'raison inconnue'), true); return; }
        apres(nomLead(l) + ' renvoyé à ' + siteNom(cible.site || 'l\'autre site') + '.');
      });
    }
    function attribuerRegle() {
      var ids = groupesRelais()[0].items.map(function (l) { return Number(l.id_lead); });
      if (!ids.length) return;
      return geste(async function () {
        var r = await rpc('poste_attribuer_regle', { p_ids: ids });
        apres(plural((r && r.attribues) || 0, 'lead attribué', 'leads attribués') + ' selon la règle du site' + (r && r.sans_vendeur ? ' ; ' + r.sans_vendeur + ' sans vendeur disponible' : '') + '.', true);
      });
    }
    function solder(sid) {
      var m = $modal.querySelector('input[name="sold"]:checked'); if (!m) return;
      return geste(async function () {
        var r = await rpc('poste_solder', { p_id_site: Number(sid), p_mode: m.value, p_dry_run: false });
        fermerModal(); fermerTout();
        apres('Stock soldé : ' + plural((r && r.traites) || 0, 'lead traité', 'leads traités') + '.', true);
      });
    }
    function pick3cx() {
      var c = [FW, window]; try { c.push(window.parent); } catch (e) {} try { c.push(window.top); } catch (e) {}
      for (var i = 0; i < c.length; i++) { try { if (c[i] && c[i].OD3CX && typeof c[i].OD3CX.appeler === 'function') return c[i].OD3CX; } catch (e) {} }
      return null;
    }
    function canal(act, pre) {
      var D = S.dr; if (!D || !D.l) return;
      if (D.demo) { toast('Visite guidée : les boutons de contact ne font rien sur la fiche d\'exemple.'); return; }
      pre = pre || {};
      var l = D.l, nom = nomLead(l);
      var client = { IDVu: l.id_client, TEl_MOB: l.telephone, EMAIL: l.email, nom: nom, prenom: '' };
      try {
        if (act === 'appel') {
          if (!__lmPeutAppeler()) return;
          var cx = pick3cx(), num = normTel(l.telephone);
          if (cx && num) { cx.appeler(num, { nom: nom, idvu: l.id_client }); return; }
          var w = (window.parent && window.parent.__VOIP_UI__) || window.__VOIP_UI__ || FW.__VOIP_UI__;
          if (w && w.call) { w.call(l.telephone, client); return; }
          FW.open('tel:' + String(l.telephone || '').replace(/[^0-9+]/g, ''), '_self');
        } else if (act === 'sms') { var s = FW.__SMS_UI__ || window.__SMS_UI__; if (s && s.open) s.open({ client: client, text: pre.text }); else toast('Module SMS indisponible.', true); }
        else if (act === 'wa') { var wa = FW.__WA_UI__ || window.__WA_UI__; if (wa && wa.open) wa.open({ client: client, motif: pre.text }); else toast('Module WhatsApp indisponible.', true); }
        else if (act === 'mail') {
          var m = FW.__EMAIL_UI__ || window.__EMAIL_UI__;
          var corps = pre.text != null ? esc(pre.text).replace(/\n/g, '<br>') : undefined;
          if (m && m.open) m.open({ mode: 'new', client: client, subject: pre.subject, body: corps });
          else FW.open('mailto:' + l.email + (pre.subject ? '?subject=' + encodeURIComponent(pre.subject) + '&body=' + encodeURIComponent(pre.text || '') : ''), '_blank');
        }
      } catch (e) { toast('Canal indisponible : ' + messageErreur(e), true); }
    }
    // v62 : SMS, WhatsApp, e-mail passent d'abord par les modèles du lead.
    function choisirCanal(act) {
      var D = S.dr; if (!D || !D.l) return;
      if (act === 'appel') return canal('appel');
      if (D.canal === act) { D.canal = null; renderDrawerPreserve(); return; }
      lireRdvF();
      D.canal = act; D.tpl = null; D.txt = null; D.subj = null;
      renderDrawer();
      $drawer.scrollTop = 0;
    }
    function ouvrirCanalModele() {
      var D = S.dr; if (!D || !D.canal) return;
      lireCompose();
      var M = modeles(D.canal, D.l), i = D.tpl == null ? Math.max(0, M.findIndex(function (x) { return x.reco; })) : D.tpl;
      var txt = D.txt != null ? D.txt : M[i].t, subj = D.subj != null ? D.subj : M[i].s;
      canal(D.canal, { text: txt, subject: subj });
    }
    // v62 : tout le Pool au vendeur suggéré (sites que l'on encadre).
    function toutAttribuer() {
      var ls = libres(sitePoste()).filter(function (l) { var g = suggestion(l); return manager(l.id_site) && g && g.id_user; });
      if (!ls.length) return;
      return geste(async function () {
        var ok = 0, ko = 0;
        for (var i = 0; i < ls.length; i++) {
          try { await rpc('poste_attribuer', { p_id_lead: Number(ls[i].id_lead), p_id_user: Number(suggestion(ls[i]).id_user) }); ok++; } catch (e) { ko++; }
        }
        S.suggKey = null;
        apres(plural(ok, 'lead attribué', 'leads attribués') + ' au vendeur suggéré' + (ko ? ' ; ' + ko + ' refusé' + (ko > 1 ? 's' : '') : '') + '.', true);
      });
    }
    // v62 : la règle d'attribution du site, modifiable par qui l'encadre.
    function modalRegle(sid) {
      var r = S.regle[sid] || {};
      var radio = function (n, v, lib, sous) { return '<label class="opt"><input type="radio" name="' + n + '" value="' + v + '"' + (r[n === 'rg-mode' ? 'mode' : 'repartition'] === v ? ' checked' : '') + '><span><b>' + lib + '</b><small>' + sous + '</small></span></label>'; };
      ouvrirModal('<div class="mb-h"><div><h2>Règle d\'attribution · ' + esc(siteNom((siteInfo(sid) || {}).site)) + '</h2><p>Elle s\'applique aux nouveaux leads du site et aux suggestions du Pool.</p></div><button type="button" class="x" data-a="modal-close" aria-label="Fermer">' + X_SVG + '</button></div><div class="mb-b">'
        + '<p class="rg-t">Qui attribue ?</p>'
        + radio('rg-mode', 'libre', 'Libre-service', 'Les vendeurs prennent eux-mêmes leurs leads dans le Pool ; vous pouvez attribuer.')
        + radio('rg-mode', 'manuel', 'Le chef des ventes', 'Chaque lead attend dans le Pool que vous l\'attribuiez.')
        + radio('rg-mode', 'auto', 'Automatique', 'Chaque lead part aussitôt chez le vendeur désigné par la règle.')
        + '<p class="rg-t">À qui en priorité ?</p>'
        + '<label class="opt chk"><input type="checkbox" id="rg-cycle"' + (r.priorite_cycle ? ' checked' : '') + '><span><b>Au vendeur qui suit déjà le client</b><small>Son cycle commercial est ouvert sur le site.</small></span></label>'
        + '<label class="opt chk"><input type="checkbox" id="rg-hab"' + (r.vendeur_habituel ? ' checked' : '') + '><span><b>À son vendeur habituel</b><small>Le dernier vendeur à l\'avoir contacté sur les <select id="rg-mois">' + [6, 12, 24].map(function (m) { return '<option value="' + m + '"' + (Number(r.vendeur_habituel_mois || 12) === m ? ' selected' : '') + '>' + m + '</option>'; }).join('') + '</select> derniers mois.</small></span></label>'
        + '<p class="rg-t">Sinon ?</p>'
        + radio('rg-rep', 'charge', 'Le moins chargé', 'Le vendeur qui a le moins de leads en cours.')
        + radio('rg-rep', 'conversion', 'Le moins chargé, puis le meilleur', 'À charge égale, celui qui convertit le mieux : la conversion départage, elle ne classe pas.')
        + radio('rg-rep', 'sequentiel', 'Tour de rôle', 'Chacun son tour, le dernier servi passe en queue.')
        + '<label class="opt chk"><input type="checkbox" id="rg-vnvo"' + (r.filtre_vn_vo ? ' checked' : '') + '><span><b>Un lead VO ne va qu\'aux vendeurs VO</b><small>Selon le profil VN / VO de chaque vendeur.</small></span></label>'
        + '</div><div class="mb-f"><button type="button" class="btn ghost" data-a="modal-close">Annuler</button><button type="button" class="btn pri" data-a="regle-ok" data-id="' + sid + '">Enregistrer la règle</button></div>');
    }
    function enregistrerRegle(sid) {
      var q = function (s) { return $modal.querySelector(s); };
      var mode = (q('input[name="rg-mode"]:checked') || {}).value, rep = (q('input[name="rg-rep"]:checked') || {}).value;
      var p = { id_site: Number(sid), mode: mode || null, repartition: rep || null, priorite_cycle: !!(q('#rg-cycle') || {}).checked,
                vendeur_habituel: !!(q('#rg-hab') || {}).checked, vendeur_habituel_mois: Number((q('#rg-mois') || {}).value) || 12, filtre_vn_vo: !!(q('#rg-vnvo') || {}).checked };
      return geste(async function () {
        await rpc('lead_regles_enregistrer', { p_regles: p });
        fermerModal(); S.regle[sid] = null; S.suggKey = null;
        toast('Règle d\'attribution enregistrée.');
        await rafraichir(true);
      });
    }
    function ficheClient(idClient) {
      if (!idClient) { toast('Pas de fiche client rattachée.', true); return; }
      try { wwLib.wwVariable.updateValue('55490583-c88b-4748-916e-4d203db07742', { IDVu: Number(idClient) }); } catch (e) {}
      try { FW.__odFicheTab = 0; } catch (e) {}
      var edit = false; try { edit = (window.self !== window.top) || /-editor\.weweb\.io|weweb\.io/i.test(location.hostname); } catch (e) { edit = true; }
      if (edit) { try { wwLib.wwApp.goTo('259f1951-a2d4-4b90-ac83-0b3febe1d4ec'); return; } catch (e) {} }
      try { wwLib.goTo('/fr/fiche-client'); return; } catch (e) {}
      try { FW.location.href = '/fr/fiche-client'; } catch (e) {}
    }

    // ── Événements ────────────────────────────────────────────────────────
    function memoAck() { try { FW.localStorage.setItem('lmtc-ack-site', JSON.stringify(Array.from(S.ack).slice(-200))); } catch (e) {} }
    async function action(a, id) {
      switch (a) {
        case 'tab':
          S.tab = id; S.cell = null; render();
          if (id === 'campagnes' && !S.campagnes) { await chargerCampagnes(); render(); }
          if (id === 'relais' && !S.relais) { try { S.relais = await rpc('poste_relais', { p_jours: 30 }) || []; } catch (e) { S.relais = []; toast(messageErreur(e), true); } render(); }
          return;
        case 'ack': S.ack.add(id); memoAck(); render(); return;
        case 'open': return ouvrir(id);
        case 'appeler': await ouvrir(id); if (S.dr && Number(S.dr.id) === Number(id)) canal('appel'); return;
        case 'prendre': return prendre(id);
        case 'tout-attribuer': return toutAttribuer();
        case 'univ': S.univ = id || 'tous'; S.leads = filtrerUniv(S.tous); S.suggKey = null; render(); if (POSTE !== 'vendeur') chargerAide(); return;
        case 'comme-off': S.commeMenu = false; S.commeQ = ''; if (S.comme) return sortirComme(); render(); return;
        case 'comme-menu': S.commeMenu = !S.commeMenu; S.commeQ = ''; render(); if (S.commeMenu) { var qi = root.querySelector('.k-vsearch'); if (qi) try { qi.focus(); } catch (e) {} } return;
        case 'comme': S.commeMenu = false; S.commeQ = ''; return entrerComme(Number(id));
        case 'attribuer-sugg': return attribuerSugg(id);
        case 'choix': S.choix = S.choix || {}; S.choix[id] = !S.choix[id]; render(); return;
        case 'prevenir': return prevenir(id);
        case 'tout-reattr': return modalToutReattr(id);
        case 'tout-reattr-ok': return toutReattrOk(id);
        case 'regle-modifier': return modalRegle(Number(id));
        case 'regle-ok': return enregistrerRegle(Number(id));
        case 'perim-ouvrir': S.perimOuvert = !S.perimOuvert; render(); return;
        case 'perim':
          S.perimOuvert = false; S.cell = null; S.campagnes = null; S.suggKey = null;
          if (POSTE === 'direction') S.vueSite = id === '' ? null : Number(id); else S.site = Number(id);
          if (id !== '') ecrireBus(Number(id));
          if (['mur', 'mursites'].indexOf(S.tab) !== -1) S.tab = sitePoste() == null ? 'mursites' : 'mur';
          render(); chargerAide(); if (S.tab === 'campagnes') { await chargerCampagnes(); render(); } return;
        case 'site': S.site = Number(id); S.cell = null; S.campagnes = null; render(); if (S.tab === 'campagnes') { await chargerCampagnes(); render(); } return;
        case 'voir-site': S.vueSite = Number(id); S.tab = 'pool'; S.cell = null; S.campagnes = null; S.suggKey = null; render(); chargerAide(); try { FW.scrollTo(0, 0); } catch (e) {} return;
        case 'retour-sites': S.vueSite = null; S.tab = 'pool'; S.cell = null; S.campagnes = null; S.suggKey = null; render(); chargerAide(); return;
        case 'depuis': S.depuis = id; S.cell = null; render(); return;
        case 'cell': { var p = id.split('|'); S.cell = { r: p[0], c: p[1] }; S.dr = null; render(); renderVolet(); return; }
        case 'cell-close': return fermerTout();
        case 'retour-liste': S.dr = null; return renderVolet();
        case 'autres-vendeurs': S.autresVendeurs = !S.autresVendeurs; render(); return;
        case 'autres-sites': S.autresSites = !S.autresSites; render(); return;
        case 'camp-ouvrir':
          if (S.campOuverte === id) { S.campOuverte = null; render(); return; }
          S.campOuverte = id; S.campVendDe = null; render();
          try {
            var de = new Date(Date.now() - 90 * 86400000).toISOString().slice(0, 10), au = new Date().toISOString().slice(0, 10);
            S.campVend = await rpc('get_campagnes_par_vendeur', { p_viewer_id_user: Number(MOI), p_date_from: de, p_date_to: au, p_campagne: id, p_site_ids: sitePoste() != null ? [Number(sitePoste())] : null }) || [];
            S.campVendDe = id;
          } catch (e) { S.campVend = []; S.campVendDe = id; }
          render(); return;
        case 'creer-camp': return modalCampagne();
        case 'camp-estimer': return estimerCampagne();
        case 'camp-lancer': return lancerCampagne();
        case 'solder': return modalSolder(id);
        case 'solder-ok': return solder(id);
        case 'modal-close': return fermerModal();
        case 'attribuer': return attribuer(id);
        case 'attribuer-regle': return attribuerRegle();
        case 'rendre': return rendre(id);
        case 'confier': return confier(id);
        case 'renvoyer': return renvoyer(id);
        case 'clore-inj': if (S.dr) fermerDrawer(); await ouvrir(id); if (S.dr) { S.dr.mode = 'clore'; renderDrawer(); var mm = $drawer.querySelector('#clore-motif'); if (mm) mm.value = 'injoignable'; } return;
        case 'fiche': return ficheClient(id);
        case 'ancien':
          detruire();
          var legacy = await chargerLegacy();
          return legacy.mount(el, ctx);
        case 'reessayer': S.erreur = null; render(); return rafraichir();
        // Panneau
        case 'close': return fermerTout();
        case 'copier': try { await (FW.navigator || navigator).clipboard.writeText(id); toast('Numéro copié'); } catch (e) { toast(id); } return;
        case 'canal': return choisirCanal(id);
        case 'tpl': if (S.dr) { S.dr.tpl = Number(id); S.dr.txt = null; S.dr.subj = null; lireRdvF(); renderDrawer(); } return;
        case 'canal-ouvrir': return ouvrirCanalModele();
        case 'canal-fermer': if (S.dr) { S.dr.canal = null; renderDrawerPreserve(); } return;
        case 'rdv-objet': if (S.dr && S.dr.rdvF) { lireRdvF(); S.dr.rdvF.objet = id; renderDrawerPreserve(); } return;
        case 'rdv-quand': if (S.dr && S.dr.rdvF) { lireRdvF(); S.dr.rdvF.date = id; renderDrawerPreserve(); } return;
        case 'dem-plus': if (S.dr) { S.dr.demOuverte = !S.dr.demOuverte; renderDrawerPreserve(); } return;
        case 'inv-menu': if (S.dr) { lireRdvF(); S.dr.invMenu = !S.dr.invMenu; S.dr.invQ = ''; renderDrawerPreserve(); var qi = $drawer.querySelector('.k-vsearch'); if (qi) try { qi.focus(); } catch (e) {} } return;
        case 'rdv-inv': if (S.dr && S.dr.rdvF) { lireRdvF(); var iv = S.dr.rdvF.inv, n2 = Number(id); S.dr.rdvF.inv = iv.indexOf(n2) !== -1 ? iv.filter(function (z) { return z !== n2; }) : iv.concat([n2]); renderDrawerPreserve(); } return;
        case 'mode': if (S.dr) { S.dr.mode = id; renderDrawerPreserve(); } return;
        case 'res': if (S.dr) { S.dr.res = id; renderDrawerPreserve(); } return;
        case 'rdv': return rdv(id);
        case 'joint': return resultat(id, 'joint');
        case 'rattacher': return rattacher(id);
        case 'pasjoint': return resultat(id, 'pas_joint');
        case 'clore': return clore(id);
        case 'bacs-relancer':
          return geste(async function () {
            var r = await rpc('poste_bacs_relancer', { p_id_lead: Number(S.dr.id) });
            reveillerBacs(); toast(plural((r && r.relances) || 0, 'envoi relancé', 'envois relancés'));
            try { S.dr.envois = await rpc('poste_bacs_envois', { p_id_lead: Number(S.dr.id) }) || []; } catch (e) {}
            renderDrawerPreserve();
          });
      }
    }
    function surClic(ev) {
      var t = ev.target.closest('[data-a]');
      if (!t || t.disabled) return;
      var a = t.getAttribute('data-a');
      if (a === 'dates') { ev.preventDefault(); ev.stopPropagation(); ouvrirDates(t); return; }
      if (S.comme && ACTIONS_APERCU.indexOf(a) === -1 && !((t.classList.contains('lr') || t.classList.contains('carte-l')) && !ev.target.closest('button,select,input,a'))) {
        ev.preventDefault(); ev.stopPropagation();
        toast('Aperçu de l\'écran de ' + prenom(S.comme.nom) + ' : lecture seule. Revenez à votre vue pour agir.', true); return;
      }
      if ((t.classList.contains('lr') || t.classList.contains('todo') || t.classList.contains('carte-l') || t.classList.contains('l') || t.tagName === 'TR') && ev.target.closest('button,select,input,a')) return;
      ev.preventDefault(); ev.stopPropagation();
      action(a, t.getAttribute('data-id') || '');
    }
    root.addEventListener('click', function (ev) {
      if (S.perimOuvert && !ev.target.closest('.perim')) { S.perimOuvert = false; render(); }
      if (S.commeMenu && !ev.target.closest('.k-vend-sel')) { S.commeMenu = false; render(); }
      surClic(ev);
    });
    ov.addEventListener('click', function (ev) {
      if (S.dr && S.dr.invMenu && !ev.target.closest('.k-vend-sel')) { S.dr.invMenu = false; renderDrawerPreserve(); }
      surClic(ev);
    });
    ov.addEventListener('input', function (ev) {
      if (S.dr && ev.target.getAttribute && ev.target.getAttribute('data-x') === 'inv-q') {
        S.dr.invQ = ev.target.value; var li = $drawer.querySelector('.k-vlist'), l = S.dr.l;
        if (li && l && S.dr.rdvF) li.innerHTML = listeInvites((S.invitables[l.id_site] || []).filter(function (u) { return Number(u.id_user) !== Number(l.id_user_attribue || MOI); }), S.dr.rdvF);
      }
    });
    root.addEventListener('input', function (ev) {
      if (ev.target.getAttribute && ev.target.getAttribute('data-x') === 'comme-q') { S.commeQ = ev.target.value; var li = root.querySelector('.k-vlist'); if (li) li.innerHTML = listeComme(); }
    });
    $scrim.addEventListener('click', function () { if (S.modal) fermerModal(); else fermerTout(); });
    root.addEventListener('keydown', function (ev) {
      var t = ev.target;
      if ((ev.key === 'Enter' || ev.key === ' ') && t.classList && (t.classList.contains('lr') || t.classList.contains('todo') || t.classList.contains('clic') || t.classList.contains('carte-l') || t.classList.contains('l'))) { ev.preventDefault(); action(t.getAttribute('data-a'), t.getAttribute('data-id')); }
    });
    ov.addEventListener('keydown', function (ev) {
      var t = ev.target;
      if ((ev.key === 'Enter' || ev.key === ' ') && t.classList && t.classList.contains('lr')) { ev.preventDefault(); action(t.getAttribute('data-a'), t.getAttribute('data-id')); }
    });
    ov.addEventListener('change', function (ev) {
      if (ev.target.id === 'rdv-inv-plus' && S.dr && S.dr.rdvF && ev.target.value) { lireRdvF(); var n3 = Number(ev.target.value); if (S.dr.rdvF.inv.indexOf(n3) === -1) S.dr.rdvF.inv.push(n3); renderDrawerPreserve(); return; }
      if (ev.target.id === 'c-aff' || ev.target.id === 'c-site') majVendeursCamp();
      if (ev.target.closest && ev.target.closest('.mb')) { var go = $modal.querySelector('#c-go'); if (go && ev.target.id !== 'c-nom') { go.disabled = true; go.removeAttribute('data-confirme'); go.textContent = 'Lancer la campagne'; } }
    });
    function surTouche(ev) { if (ev.key === 'Escape') { if (S.modal) fermerModal(); else if (S.dr) fermerDrawer(); else if (!$drawer.hidden) fermerTout(); } }
    doc.addEventListener('keydown', surTouche);
    // Accès des visites guidées (module tours).
    try { FW.__lmtcTour = { poste: POSTE, exemple: ouvrirExemple, fermer: function () { if (S.modal) fermerModal(); fermerTout(); } }; } catch (e) {}
    // v64 : abonnement au site de la barre du haut.
    var __desabBus = null;
    try { var __b = busApi(); if (__b && __b.onChange) __desabBus = __b.onChange(function () { surBus(); }); } catch (e) {}
    function __evtBus() { surBus(); }
    try { (FW.document || doc).addEventListener('oropra-site-changed', __evtBus); } catch (e) {}

    // ── Cycle de vie ──────────────────────────────────────────────────────
    var minuteur = null, horloge = null;
    function detruire() {
      clearInterval(minuteur); clearInterval(horloge);
      doc.removeEventListener('keydown', surTouche);
      try { if (typeof __desabBus === 'function') __desabBus(); } catch (e) {}
      try { (FW.document || doc).removeEventListener('oropra-site-changed', __evtBus); } catch (e) {}
      S.dr = null;
      try { if (FW.__lmtcTour && FW.__lmtcTour.poste !== 'vroom') delete FW.__lmtcTour; } catch (e) {}
      try { ov.remove(); } catch (e) {}
      try { root.remove(); } catch (e) {}
    }
    minuteur = setInterval(function () {
      if (!el.isConnected || !root.isConnected) { detruire(); return; }
      if (doc.visibilityState === 'hidden' || occupe || S.modal) return;
      rafraichir(true);
    }, REFRESH_MS);
    horloge = setInterval(function () {
      if (!el.isConnected) { detruire(); return; }
      if (doc.visibilityState === 'hidden' || occupe || !S.charge || S.modal) return;
      var act = doc.activeElement;
      if (act && root.contains(act) && /INPUT|SELECT|TEXTAREA/.test(act.tagName)) return;
      render();
    }, 15000);

    await rafraichir();
    if (POSTE === 'vendeur') { chargerCampagnes().then(render); }
    // Un lead demandé par une autre page (tableau de bord : « Ouvrir ») ou par
    // l'adresse (#lead=123) s'ouvre directement.
    (function () {
      var id = null;
      try { id = FW.sessionStorage.getItem('od-lead-ouvrir'); FW.sessionStorage.removeItem('od-lead-ouvrir'); } catch (e) {}
      if (!id) { try { var m = /[#&]lead=(\d+)/.exec(FW.location.hash || ''); if (m) id = m[1]; } catch (e) {} }
      if (id && S.leads.some(function (l) { return String(l.id_lead) === String(id); })) ouvrir(id);
      else if (id) toast('Ce lead n\'est plus à traiter : il a été contacté, clos ou réattribué.');
    })();
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
.lmtc select,.lmtc input[type=text],.lmtc input[type=number],.lmtc input[type=date],.lmtc input[type=datetime-local],.lmtc textarea{font:inherit;font-size:13px;font-weight:600;color:var(--bleu-dk);background:#fff;border:1.5px solid var(--line-in);border-radius:9px;padding:8px 11px;min-width:0;outline:none}
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
.lmtc-ov .dr-f .row.inj-msg{gap:16px;margin-top:6px}
.lmtc-ov .dr-f .row.inj-msg label{display:inline-flex;align-items:center;gap:6px;cursor:pointer;color:var(--ink,#1F4A85)}
.lmtc-ov .dr-f .row.pied .hint{flex:1}
.lmtc-ov .hint{font-size:11.5px;color:var(--mut);font-weight:600;line-height:1.5}
.lmtc-ov .ratt{display:grid;gap:8px;padding:12px;border:1.5px solid #c9dcf3;border-radius:12px;background:#f5f9fe}
.lmtc-ov .ratt-t{margin:0;font-size:13px;font-weight:800;color:#1F4A85}
.lmtc-ov .ratt .hint.err{color:#c0392b}
.lmtc-ov .ratt-l{list-style:none;margin:0;padding:0;display:grid;gap:6px}
.lmtc-ov .ratt-l li{display:flex;align-items:center;justify-content:space-between;gap:10px;padding:8px 10px;background:#fff;border:1px solid #e2eaf5;border-radius:10px}
.lmtc-ov .ratt-l li div{display:grid;gap:2px;min-width:0}
.lmtc-ov .ratt-l b{font-size:12.5px;color:#1F4A85}
.lmtc-ov .ratt-l small{font-size:11px;color:#5a7196;overflow:hidden;text-overflow:ellipsis}
.lmtc-ov .ratt-l small.ind{color:#2f8a76;font-weight:700}
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
/* ── Poste des sites : vendeur, chef des ventes, direction ── */
.lmtc .site-chips{display:inline-flex;flex-wrap:wrap;gap:6px;margin-left:10px;vertical-align:middle;text-transform:none;letter-spacing:0}
.lmtc .site-chips .fchip{padding:4px 10px;font-size:12px}
.lmtc .k b .mes{display:block;font-size:10.5px;font-weight:700;color:var(--ink-3)}
.lmtc .lbl-s{font-size:12px;color:var(--mut);font-weight:700}
.lmtc .todo{display:grid;grid-template-columns:96px minmax(0,1fr) auto;gap:14px;align-items:center;padding:12px 8px;border-top:1px solid var(--line);cursor:pointer;border-radius:10px}
.lmtc .todo:hover{background:var(--hov)}
.lmtc .todo-v{font-weight:800;color:var(--bleu-dk);font-size:14px;display:grid;gap:1px}
.lmtc .todo-v small{font-size:11px;font-weight:600;color:var(--ink-3)}
.lmtc .why{font-size:12.5px;color:var(--ink-2);margin-top:2px}
@media (max-width:600px){.lmtc .todo{grid-template-columns:minmax(0,1fr)}}
.lmtc .sub{margin-top:16px;display:grid;gap:4px}
.lmtc .sub h3{font-size:14px;font-weight:800;color:var(--bleu-dk)}
.lmtc .sub > p{font-size:12.5px;color:var(--mut);font-weight:600}
/* Le mur */
.lmtc table.mur{min-width:640px}
.lmtc table.mur.sites{min-width:900px}
.lmtc table.mur th{white-space:normal;line-height:1.25;vertical-align:bottom}
.lmtc td.who{min-width:170px}
.lmtc td.who b{display:block;font-weight:800;color:var(--ink)}
.lmtc td.who small{display:block;font-size:11.5px;color:var(--mut);font-weight:600}
.lmtc tr.pisc td{background:var(--calme-bg)}
.lmtc tr.pisc td:first-child{border-radius:9px 0 0 9px} .lmtc tr.pisc td:last-child{border-radius:0 9px 9px 0}
.lmtc tr.vroom td{background:var(--sel)}
.lmtc .cell{display:inline-grid;place-items:center;min-width:40px;height:32px;padding:0 10px;border-radius:9px;border:0;font:inherit;font-weight:800;font-size:14px;cursor:pointer;font-variant-numeric:tabular-nums;background:var(--ok-bg);color:var(--m-vert)}
.lmtc .cell.warn{background:var(--alerte-bg);color:var(--m-orange)}
.lmtc .cell.crit{background:var(--chaud-bg);color:var(--m-rouge)}
.lmtc .cell.stock{background:#fff;color:var(--m-rouge);box-shadow:inset 0 0 0 1.5px #f2c4c4}
.lmtc .cell.vr{background:var(--bleu);color:#fff}
.lmtc .cell.zero{background:none;color:var(--ink-3);cursor:default}
.lmtc .cell.fixe{cursor:default}
.lmtc .cell.sel{box-shadow:0 0 0 2px var(--bleu)}
.lmtc button.cell:hover{filter:brightness(.96)}
.lmtc td.plus{text-align:left}
.lmtc small.arch{display:block;font-size:10.5px;color:var(--ink-3);font-weight:700;margin-top:2px}
.lmtc .ctc{font-weight:800}
/* À relayer */
.lmtc .grp{margin-top:6px}
.lmtc .grp + .grp{margin-top:14px;border-top:1.5px solid var(--line)}
.lmtc .grp-h{padding:12px 0 6px;display:grid;gap:2px}
.lmtc .grp-h h3{font-size:14px;font-weight:800;color:var(--bleu-dk);display:flex;gap:8px;align-items:center}
.lmtc .grp-h p{font-size:12.5px;color:var(--mut);font-weight:600}
.lmtc .grp .cnt.c{background:var(--m-rouge);color:#fff}
.lmtc .grp .cnt.z{color:var(--ink-3)}
.lmtc .rel{display:grid;grid-template-columns:112px minmax(0,1fr) auto;gap:14px;align-items:center;padding:10px 8px;border-top:1px solid var(--line)}
.lmtc .rel-a{display:flex;flex-wrap:wrap;gap:6px;justify-content:flex-end;align-items:center}
.lmtc .rel-a select{max-width:240px}
.lmtc .lien-n{cursor:pointer} .lmtc .lien-n:hover{color:var(--bleu);text-decoration:underline}
@media (max-width:760px){.lmtc .rel{grid-template-columns:minmax(0,1fr)}.lmtc .rel-a{justify-content:flex-start}}
/* Le relais */
.lmtc .lg{display:flex;flex-wrap:wrap;gap:8px 18px;font-size:12px;color:var(--ink-2);font-weight:600;margin-bottom:14px}
.lmtc .lg i{display:inline-block;width:16px;height:10px;border-radius:3px;margin-right:6px;vertical-align:-1px}
.lmtc .lg i.u,.lmtc .rb i.u{background:repeating-linear-gradient(135deg,var(--line-2) 0 4px,var(--calme-bg) 4px 8px)}
.lmtc .lg i.v,.lmtc .rb i.v{background:var(--bleu)}
.lmtc .lg i.s,.lmtc .rb i.s{background:var(--vert)}
.lmtc .rl{display:grid;gap:18px}
.lmtc .rl-h{display:flex;flex-wrap:wrap;justify-content:space-between;gap:4px 12px;font-size:13px;margin-bottom:6px}
.lmtc .rl-h b{font-weight:800;color:var(--ink)} .lmtc .rl-h span{color:var(--mut);font-weight:600;font-size:12px}
.lmtc .rb{display:flex;height:14px;border-radius:7px;overflow:hidden;background:var(--line)}
.lmtc .rb i{display:block;height:100%}
.lmtc .rb i + i{border-left:2px solid #fff}
.lmtc .rl-d{display:flex;flex-wrap:wrap;gap:4px 16px;margin-top:6px;font-size:11.5px;color:var(--ink-3);font-weight:600}
.lmtc .rl-d b{color:var(--ink-2);font-weight:800}
/* Campagnes internes */
.lmtc .camp-t tr.clic{cursor:pointer}
.lmtc .camp-t tr.clic:hover td{background:var(--hov)}
.lmtc .camp-t tr.vdet td{background:#f9fbfe;font-size:12.5px}
.lmtc .camp-t tr.vdet td.l{padding-left:18px}
/* Panneau : compléments */
.lmtc-ov .qualif{font-size:13px;font-weight:700;color:var(--bleu-dk)}
.lmtc-ov .fs-btn.fiche{color:var(--ink-2);border-color:var(--line-2)} .lmtc-ov .fs-btn.fiche:hover{background:var(--hov)}
.lmtc-ov .dr-f input[type=text]{flex:1;min-width:140px}
.lmtc-ov .issues button.on.clore{background:var(--m-rouge)}
.lmtc-ov .issues button.on.rdv{background:var(--vert)}
/* Fenêtres */
.lmtc-ov .modal{position:fixed;inset:0;z-index:9992;display:grid;place-items:center;padding:16px;pointer-events:none}
.lmtc-ov .modal[hidden]{display:none}
.lmtc-ov .mb{pointer-events:auto;background:#fff;border-radius:16px;box-shadow:0 16px 50px rgba(42,94,169,.22);width:min(660px,100%);max-height:calc(100vh - 32px);display:flex;flex-direction:column}
.lmtc-ov .mb-h{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:16px 18px 12px;border-bottom:1.5px solid #eef2f8}
.lmtc-ov .mb-h h2{font-size:18px;font-weight:800;color:var(--bleu-dk)}
.lmtc-ov .mb-h p{font-size:12.5px;color:var(--mut);font-weight:600;margin-top:3px}
.lmtc-ov .mb-b{padding:14px 18px;overflow:auto;display:grid;gap:10px}
.lmtc-ov .mb-f{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:8px;padding:12px 18px;border-top:1.5px solid #eef2f8}
.lmtc-ov .opt{display:grid;grid-template-columns:auto minmax(0,1fr);gap:10px;border:1.5px solid var(--line-in);border-radius:10px;padding:11px 12px;cursor:pointer}
.lmtc-ov .opt:has(input:checked){border-color:var(--bleu);background:var(--sel)}
.lmtc-ov .opt:has(input:disabled){opacity:.5;cursor:not-allowed}
.lmtc-ov .opt input{accent-color:var(--bleu);margin-top:3px}
.lmtc-ov .opt b{font-weight:800;color:var(--bleu-dk);display:block}
.lmtc-ov .opt small{display:block;font-size:12px;color:var(--mut);font-weight:600;margin-top:2px}
.lmtc-ov .fg{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px 12px}
.lmtc-ov .fg label{display:grid;gap:5px;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:var(--lbl)}
.lmtc-ov .fg .full{grid-column:1/-1}
.lmtc-ov .fg label.chk{display:flex;align-items:center;gap:8px;text-transform:none;letter-spacing:0;font-size:13px;color:var(--ink-2);font-weight:600}
.lmtc-ov .fg label.chk input{accent-color:var(--bleu)}
@media (max-width:560px){.lmtc-ov .fg{grid-template-columns:minmax(0,1fr)}}
.lmtc-ov .est{background:var(--calme-bg);border-radius:10px;padding:10px 12px;font-size:13px;color:var(--ink-2);font-weight:600}
.lmtc-ov .est b{color:var(--bleu-dk);font-weight:800}
.lmtc-ov .est-v{display:flex;flex-wrap:wrap;gap:4px 14px;margin-top:6px;font-size:12px}
.lmtc-ov .retour{display:inline-flex;align-items:center;gap:4px;margin:0 0 10px;padding:4px 12px 4px 6px;border:1.5px solid var(--line-2);border-radius:999px;background:#fff;color:var(--bleu);font:inherit;font-size:12.5px;font-weight:800;cursor:pointer}
.lmtc-ov .retour svg{width:16px;height:16px;fill:none;stroke:currentColor;stroke-width:2.4;stroke-linecap:round;stroke-linejoin:round}
.lmtc-ov .retour:hover{background:var(--hov)}
.lmtc-ov .dr-b.vol{padding:4px 10px 18px}
.lmtc-ov .dr-b.vol .lr{grid-template-columns:112px minmax(0,1fr) auto;gap:10px;padding:10px 8px}
.lmtc-ov .dr-b.vol .lr:first-child{border-top:0}
.lmtc-ov .demo{margin:0;padding:8px 18px;background:#eaf1fb;color:var(--bleu-dk);font-size:12.5px;font-weight:800;border-bottom:1.5px solid #eef2f8}
/* ══ v62 : lead management allégé ══════════════════════════════════════ */
.lmtc .hello{display:flex;flex-wrap:wrap;align-items:center;gap:14px 24px;margin:4px 0 18px}
.lmtc .hello-t{flex:1 1 420px;min-width:0;display:grid;gap:4px}
.lmtc .hello-l{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-3)}
.lmtc .hello-l .lien{font-size:11px}
.lmtc .hello h1{margin:0;font-size:clamp(20px,2.4vw,25px);font-weight:800;color:var(--bleu-dk);letter-spacing:-.01em}
.lmtc .hello-p{font-size:15px;color:var(--ink-2);line-height:1.5;max-width:90ch}
.lmtc .hello-p b{color:var(--ink);font-weight:800}
.lmtc .hello-p b.t-crit{color:var(--m-rouge)} .lmtc .hello-p b.t-warn{color:var(--m-orange)}
.lmtc .cta{border:0;background:var(--vert);color:#fff;font:inherit;font-weight:800;font-size:15.5px;padding:13px 22px;border-radius:12px;cursor:pointer;box-shadow:0 4px 14px rgba(83,189,167,.35);text-align:center;line-height:1.25;transition:background .15s}
.lmtc .cta:hover{background:var(--vert-dk)}
.lmtc .cta small{display:block;font-weight:600;font-size:11.5px;opacity:.92;margin-top:2px}
.lmtc .cta[disabled]{opacity:.55;cursor:not-allowed}
@media (max-width:640px){.lmtc .cta{width:100%}}
.lmtc .voyant{display:inline-flex;align-items:center;gap:6px;margin-left:10px;text-transform:none;letter-spacing:0;font-size:12px;font-weight:700;color:var(--ink-2)}
.lmtc .voyant::before{content:"";width:8px;height:8px;border-radius:50%;background:var(--vert)}
.lmtc .voyant.warn::before{background:var(--m-orange)} .lmtc .voyant.crit::before{background:var(--m-rouge)} .lmtc .voyant.crit{color:var(--m-rouge)}
/* Filtres-pastilles (remplacent les onglets) */
.lmtc .tabs{background:none;padding:0;margin:0 0 12px;gap:8px}
.lmtc .tabs button{border:1.5px solid var(--line);background:var(--card);border-radius:999px;padding:7px 14px;color:var(--ink-2)}
.lmtc .tabs button:hover{border-color:var(--bleu-clair);color:var(--bleu)}
.lmtc .tabs button.on{border-color:var(--bleu);background:var(--sel);color:var(--bleu);box-shadow:none}
.lmtc .tabs .cnt{background:var(--calme-bg)}
.lmtc .act{background:var(--card);border:1px solid var(--line);border-radius:14px;box-shadow:var(--ombre);min-width:0}
.lmtc .act .panel{padding:6px 14px 16px}
/* Lignes v62 */
.lmtc .lr.v2{grid-template-columns:118px minmax(0,1fr) minmax(0,150px) auto;padding:13px 8px}
.lmtc .list > .lr.v2:first-child,.lmtc .list > .empty:first-child{border-top:0}
.lmtc .lr.v2 .who .lr-d{margin-top:2px}
.lmtc .lr.v2 .src{min-width:0}
.lmtc .lr.v2 .src .tag{max-width:150px}
.lmtc .lr.v2 .why{font-size:12px;color:var(--ink-3);font-weight:600;margin-top:3px}
.lmtc .lr.attr .lr-a select{max-width:250px}
.lmtc .lr.v2.souf{grid-template-columns:118px minmax(0,1fr) minmax(0,250px) auto}
.lmtc .chez{display:flex;align-items:center;gap:10px;background:var(--chaud-bg);border:1.5px solid #f2c4c4;border-radius:12px;padding:8px 12px;min-width:0}
.lmtc .chez .av{flex:none;width:34px;height:34px;border-radius:50%;background:var(--m-rouge);color:#fff;display:grid;place-items:center;font-weight:800;font-size:13px}
.lmtc .chez-t{display:grid;min-width:0;line-height:1.25}
.lmtc .chez-t small{font-size:10px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--m-rouge)}
.lmtc .chez-t b{font-size:15px;font-weight:800;color:var(--ink);white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lmtc .chez-t em{font-style:normal;font-size:11.5px;font-weight:700;color:var(--m-rouge)}
@media (max-width:760px){.lmtc .lr.v2.souf{grid-template-columns:100px minmax(0,1fr)}.lmtc .lr.v2.souf .chez{grid-column:1/-1}}
.lmtc .lr.v2 .btn{padding:9px 15px;font-size:13px}
@media (max-width:760px){.lmtc .lr.v2{grid-template-columns:100px minmax(0,1fr)}.lmtc .lr.v2 .src{display:none}.lmtc .lr.v2 .lr-a{grid-column:1/-1;justify-content:flex-start}}
/* Règle d'attribution */
.lmtc .regle{display:flex;gap:10px;align-items:flex-start;background:var(--sel);border:1px solid var(--bleu-clair);border-radius:12px;padding:11px 14px;margin:10px 0 6px;font-size:13px;color:var(--ink-2);line-height:1.5}
.lmtc .regle b{color:var(--bleu-dk);font-weight:800}
.lmtc .regle .i{flex:none;width:21px;height:21px;border-radius:50%;background:var(--card);color:var(--bleu);display:grid;place-items:center;font-weight:800;font-size:12px;margin-top:1px}
.lmtc .regle .lien{font-size:13px}
.lmtc .stock-l{display:flex;flex-wrap:wrap;gap:8px 14px;align-items:center;justify-content:space-between;margin-top:10px;padding:10px 12px;border-radius:10px;background:var(--alerte-bg);font-size:12.5px;font-weight:700;color:#8a6d1f}
/* L'équipe, les sites */
.lmtc .sec-t{margin:22px 0 10px;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-3)}
.lmtc .team{display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:12px;align-items:stretch}
.lmtc .mate{display:grid;gap:8px;text-align:left;background:var(--card);border:1.5px solid var(--line);border-radius:14px;padding:14px;font:inherit;color:var(--ink);cursor:pointer;transition:border-color .15s}
.lmtc .mate:hover{border-color:var(--bleu-clair)}
.lmtc .mate .nm{display:flex;flex-direction:column;align-items:flex-start;gap:6px;font-weight:800;min-width:0;line-height:1.25}
.lmtc .mate .nm > .pill{flex-shrink:0}
.lmtc .mate{min-width:0;overflow:hidden;align-content:start}
.lmtc .mate .st{display:flex;gap:18px}
.lmtc .mate .st span{display:grid;font-size:11.5px;color:var(--ink-3);font-weight:600}
.lmtc .mate .st b{font-size:19px;font-weight:800;color:var(--ink);font-variant-numeric:tabular-nums}
.lmtc .mate .st b.t-crit{color:var(--m-rouge)}
.lmtc .mate-lg{font-size:11.5px;color:var(--ink-2);font-weight:600}
.lmtc .pill{font-size:11px;font-weight:800;border-radius:999px;padding:2px 9px;white-space:nowrap}
.lmtc .pill.crit{background:var(--chaud-bg);color:var(--m-rouge)} .lmtc .pill.ok{background:var(--ok-bg);color:var(--m-vert)}
/* Périmètre (direction, chef de plusieurs sites) */
.lmtc .perim{position:relative;margin-bottom:6px}
.lmtc .perim-btn{border:1.5px solid var(--bleu);background:var(--card);color:var(--bleu);border-radius:10px;padding:7px 13px;font:inherit;font-weight:800;font-size:13px;cursor:pointer}
.lmtc .perim-pop{position:absolute;top:42px;left:0;z-index:50;background:var(--card);border:1px solid var(--line);border-radius:12px;box-shadow:0 12px 34px rgba(28,43,69,.16);padding:8px;min-width:270px;max-height:70vh;overflow:auto;display:grid;gap:1px}
.lmtc .perim-pop button{text-align:left;border:0;background:none;padding:7px 10px;border-radius:8px;font:inherit;font-size:13.5px;color:var(--ink);cursor:pointer}
.lmtc .perim-pop button:hover,.lmtc .perim-pop button.on{background:var(--sel);color:var(--bleu)}
.lmtc .perim-pop .l0{font-weight:800}
.lmtc .perim-pop .l2{padding-left:30px}
.lmtc .perim-cap{font-size:10.5px;color:var(--ink-3);font-weight:700;padding:4px 10px 6px;text-transform:uppercase;letter-spacing:.05em}
.lmtc .perim-m{font-size:12px;font-weight:800;color:var(--bleu-dk);padding:8px 10px 2px}
.lmtc .perim-a{font-size:12px;font-weight:700;color:var(--ink-2);padding:4px 10px 2px 18px}
.lmtc .seg-a{display:inline-flex;gap:4px;background:var(--calme-bg);border-radius:10px;padding:3px;margin:8px 0 12px}
.lmtc .seg-a button{border:0;background:none;padding:6px 12px;border-radius:8px;font:inherit;font-size:12.5px;font-weight:700;color:var(--ink-2);cursor:pointer}
.lmtc .seg-a button.on{background:var(--card);color:var(--ink)}
.lmtc .sub-h{display:flex;flex-wrap:wrap;gap:6px 14px;align-items:center;justify-content:space-between}
/* Fiche du lead */
.lmtc-ov .dr-ht{display:grid;gap:6px;min-width:0;flex:1}
.lmtc-ov .dr-tel{font-size:13px;color:var(--ink-2);font-weight:600;word-break:break-word}
.lmtc-ov .dr-tel b{font-size:16px;color:var(--bleu-dk);font-weight:800;font-variant-numeric:tabular-nums;user-select:all}
.lmtc-ov .dr-h .canaux{margin-top:4px}
.lmtc-ov .dr-h .canaux{flex-wrap:nowrap}
.lmtc-ov .dr-h .fs-btn{flex:1 1 0;min-width:0;justify-content:center;padding:9px 6px;font-size:13px;gap:6px;white-space:nowrap}
@media (max-width:420px){.lmtc-ov .dr-h .fs-btn svg{display:none}}
.lmtc-ov .fs-btn.on{box-shadow:inset 0 0 0 1.5px currentColor}
.lmtc-ov .fs-btn.call.on{background:var(--sel)} .lmtc-ov .fs-btn.wa.on{background:#eafaf1} .lmtc-ov .fs-btn.mail.on{background:#f2f5f9} .lmtc-ov .fs-btn.sms.on{background:#fdf7e8}
.lmtc-ov .lien{border:0;background:none;padding:0;color:var(--bleu);font:inherit;font-weight:800;font-size:12.5px;cursor:pointer;text-decoration:underline;justify-self:start}
.lmtc-ov .compose{margin-top:12px;padding:12px!important;border:1.5px solid var(--line-in)!important;border-radius:12px;background:#fbfcfe}
.lmtc-ov .compose.sms{border-color:#f0dca6!important} .lmtc-ov .compose.wa{border-color:#bfe6cf!important} .lmtc-ov .compose.mail{border-color:#d7dfe9!important}
.lmtc-ov .tpls{display:grid;gap:6px}
.lmtc-ov .tpl{display:flex;justify-content:space-between;align-items:center;gap:8px;text-align:left;border:1.5px solid var(--line-in);background:#fff;border-radius:9px;padding:8px 10px;font:inherit;font-size:13px;font-weight:700;color:var(--ink);cursor:pointer}
.lmtc-ov .tpl.on{border-color:var(--bleu);background:var(--sel);color:var(--bleu-dk)}
.lmtc-ov .reco{font-size:10.5px;font-weight:800;color:var(--m-vert);background:var(--ok-bg);border-radius:999px;padding:1px 8px;white-space:nowrap}
.lmtc-ov .compose textarea,.lmtc-ov .compose input[type=text]{width:100%}
.lmtc-ov .compose .row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.lmtc-ov .compose .row .hint{flex:1 1 200px}
.lmtc-ov .dr-f{max-height:62vh;overflow:auto;grid-auto-rows:max-content;align-content:start}
.lmtc-ov .drawer.composing .dr-f{max-height:30vh}
/* v70 : UN SEUL défilement, celui du volet entier (plus de petites zones
   qui défilent chacune avec du contenu caché). */
.lmtc-ov .drawer{overflow-y:auto;overscroll-behavior:contain}
.lmtc-ov .drawer .dr-b{flex:none;overflow:visible}
.lmtc-ov .drawer .dr-f,.lmtc-ov .drawer.composing .dr-f{max-height:none;overflow:visible;flex:none}
.lmtc-ov .drawer .dr-h{flex:none}
.lmtc-ov .rdvf{display:grid;gap:12px;margin-top:4px}
.lmtc-ov .rdvf .q{display:grid;gap:6px}
.lmtc-ov .rdvf .q > span{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:var(--lbl)}
.lmtc-ov .rdvf .row{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
.lmtc-ov .qk{border:1.5px solid var(--line-in);background:#fff;color:var(--ink-2);border-radius:999px;padding:6px 12px;font:inherit;font-size:12.5px;font-weight:700;cursor:pointer}
.lmtc-ov .qk.on{border-color:var(--vert);background:var(--ok-bg);color:var(--m-vert)}
.lmtc-ov .bacs-tag{font-style:normal;text-transform:none;letter-spacing:0;font-size:10.5px;font-weight:800;color:var(--bleu);background:var(--sel);border-radius:999px;padding:1px 7px;margin-left:6px}
.lmtc-ov .rdvf textarea{min-height:52px}
.lmtc-ov label.chk{display:inline-flex;align-items:center;gap:8px;cursor:pointer;color:var(--ink-2);font-size:12.5px}
.lmtc-ov label.chk input{accent-color:var(--vert)}
.lmtc-ov .btn.big{width:100%;padding:12px;font-size:14px}
.lmtc-ov .rg-t{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:var(--lbl);margin-top:6px}
.lmtc-ov .opt.chk{display:grid;grid-template-columns:auto minmax(0,1fr)}
.lmtc-ov .opt select{padding:2px 6px;font-size:12px}
/* ══ v65 : dessin aéré ══════════════════════════════════════════════════ */
.lmtc .tabs{gap:4px;border-bottom:1px solid var(--line);margin:0 0 18px;flex-wrap:wrap}
.lmtc .tabs button{border:0;border-bottom:3px solid transparent;border-radius:0;background:none;padding:10px 14px 12px;margin-bottom:-1px;font-size:14px;color:var(--ink-3)}
.lmtc .tabs button:hover{color:var(--bleu);border-color:transparent;background:none}
.lmtc .tabs button.on{background:none;color:var(--bleu-dk);border-bottom-color:var(--bleu);box-shadow:none}
.lmtc .tabs .cnt{background:var(--sel);color:var(--bleu)}
.lmtc .tabs .cnt.c,.lmtc .tabs button.on .cnt.c{background:var(--chaud-bg);color:var(--m-rouge)}
.lmtc .tabs button.on .cnt{background:var(--sel);color:var(--bleu)}
.lmtc .tabs .cnt.z{background:var(--calme-bg);color:var(--ink-3)}
.lmtc .act:has(.cartes,.vend,.panel > .vide){background:none;border:0;box-shadow:none}
.lmtc .act:has(.cartes,.vend,.panel > .vide) .panel{padding:0}
.lmtc .bacs-l{display:flex;flex-wrap:wrap;gap:4px 10px;align-items:baseline;background:var(--card);border:1px solid var(--line);border-left:4px solid var(--m-rouge);border-radius:12px;padding:10px 14px;margin-bottom:18px;font-size:13px;color:var(--ink-2)}
.lmtc .demo-l{display:flex;flex-wrap:wrap;gap:4px 10px;align-items:center;background:var(--sel);border:1px solid var(--bleu-clair);border-left:4px solid var(--bleu);border-radius:12px;padding:10px 14px;margin-bottom:18px;font-size:13px;color:var(--bleu-dk)}
.lmtc .demo-l b{font-weight:800}
.lmtc .demo-l .btn,.lmtc .bacs-l .btn{margin-left:auto}
.lmtc .bacs-l b{color:var(--m-rouge);font-weight:800}
.lmtc .regle{background:none;border:0;padding:0 2px;margin:0 0 16px}
.lmtc .regle .i{background:var(--sel)}
.lmtc .vide{background:var(--card);border:1px solid var(--line);border-radius:16px;padding:26px;text-align:center;color:var(--mut);font-weight:700}
/* Pool : une carte par lead */
.lmtc .cartes{display:grid;gap:10px}
.lmtc .carte-l{display:grid;grid-template-columns:76px minmax(0,1fr) auto;gap:18px;align-items:center;background:var(--card);border:1px solid var(--line);border-radius:16px;padding:16px 18px;cursor:pointer;transition:box-shadow .15s}
.lmtc .carte-l:hover{box-shadow:0 6px 20px rgba(28,43,69,.07)}
.lmtc .age{display:grid;place-items:center;align-content:center;height:58px;border-radius:14px;background:var(--ground);text-align:center;line-height:1.1}
.lmtc .age b{font-size:16px;font-weight:800;color:var(--ink-2)}
.lmtc .age small{font-size:10px;color:var(--ink-3);font-weight:700;margin-top:2px}
.lmtc .age.r{background:var(--chaud-bg)} .lmtc .age.r b{color:var(--m-rouge)}
.lmtc .age.o{background:var(--alerte-bg)} .lmtc .age.o b{color:var(--m-orange)}
.lmtc .age.v{background:var(--ok-bg)} .lmtc .age.v b{color:var(--m-vert)}
.lmtc .carte-l .qui,.lmtc .vend .qui{min-width:0}
.lmtc .carte-l .qui b{font-size:15.5px;font-weight:800;color:var(--ink);display:block}
.lmtc .carte-l .qui p,.lmtc .vend .qui p{margin:2px 0 0;color:var(--ink-2);font-size:13px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.lmtc .carte-l .src{display:inline-block;margin-top:6px;font-size:11px;font-weight:700;color:var(--ink-3);background:var(--ground);border-radius:6px;padding:2px 8px}
:is(.lmtc,.lmtc-ov) .tag.u-vn,:is(.lmtc,.lmtc-ov) .tag.u-vo{display:inline-flex;align-items:center;border-radius:6px;padding:2px 8px;font-size:11px;font-weight:800;letter-spacing:.02em;margin-right:6px}
:is(.lmtc,.lmtc-ov) .tag.u-vn{background:#e8f0fb;color:#2a5ea9}
:is(.lmtc,.lmtc-ov) .tag.u-vo{background:#fdf2e3;color:#a8660a}
.lmtc .carte-l .tag.u-vn,.lmtc .carte-l .tag.u-vo{margin-top:6px;font-size:11px;padding:2px 8px;border-radius:6px}
.lmtc .barre-o{display:flex;align-items:flex-end;justify-content:space-between;gap:10px 16px;flex-wrap:wrap;border-bottom:1px solid var(--line);margin:0 0 18px}
.lmtc .barre-o .tabs{border-bottom:0;margin:0;flex:1 1 auto}
.lmtc .outils{display:flex;align-items:center;gap:8px;flex-wrap:wrap;padding:0 0 9px}
.lmtc .seg-u{display:inline-flex;border:1px solid #ece9e1;border-radius:10px;overflow:hidden;background:#fff}
.lmtc .seg-u button{border:0;background:none;padding:7px 11px;font:inherit;font-size:12px;font-weight:700;color:var(--ink-2);cursor:pointer}
.lmtc .seg-u button+button{border-left:1px solid #ece9e1}
.lmtc .seg-u button.on{background:#2a5ea9;color:#fff}
:is(.lmtc,.lmtc-ov) .k-vend{display:flex;flex-direction:column;line-height:1.1}
:is(.lmtc,.lmtc-ov) .k-vend-l{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:#888780}
:is(.lmtc,.lmtc-ov) .k-vend-n{font-size:15px;font-weight:800;color:#2a5ea9}
:is(.lmtc,.lmtc-ov) .k-vend-sel{position:relative}
:is(.lmtc,.lmtc-ov) .k-vend-btn{background:#fff;border:1px solid #ece9e1;border-radius:10px;padding:5px 12px;cursor:pointer;text-align:left;font-family:inherit}
:is(.lmtc,.lmtc-ov) .k-vend-btn:hover{border-color:#2a5ea9}
:is(.lmtc,.lmtc-ov) .k-vpanel{position:absolute;top:calc(100% + 6px);right:0;z-index:30;width:300px;max-height:380px;overflow-y:auto;background:#fff;border:1px solid #ece9e1;border-radius:12px;box-shadow:0 12px 32px rgba(42,94,169,.16);padding:8px;text-align:left}
:is(.lmtc,.lmtc-ov) .k-vsearch{width:100%;border:1px solid #ece9e1;border-radius:8px;padding:8px 11px;font-family:inherit;font-size:13px;color:#1c2b45;box-sizing:border-box;margin-bottom:6px}
:is(.lmtc,.lmtc-ov) .k-vsearch:focus{outline:none;border-color:#2a5ea9}
:is(.lmtc,.lmtc-ov) .k-vgroup{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:#888780;padding:8px 8px 4px}
:is(.lmtc,.lmtc-ov) .k-vitem{display:flex;align-items:center;gap:6px;width:100%;text-align:left;background:none;border:none;border-radius:8px;padding:8px 10px;font-family:inherit;font-size:13px;font-weight:700;color:#1c2b45;cursor:pointer}
:is(.lmtc,.lmtc-ov) .k-vitem:hover{background:rgba(172,197,228,.18)}
:is(.lmtc,.lmtc-ov) .k-vitem.on{background:#2a5ea9;color:#fff}
:is(.lmtc,.lmtc-ov) .k-vempty{font-size:12px;color:#888780;padding:10px}
.lmtc-ov .inv-l{display:flex;flex-wrap:wrap;align-items:center;gap:8px}
.lmtc-ov .inv-l .k-vpanel{left:0;right:auto;bottom:calc(100% + 6px);top:auto}
.lmtc-ov .inv-t{display:inline-flex;align-items:center;gap:6px;background:var(--sel);color:var(--bleu);border:1px solid var(--bleu-clair);border-radius:999px;padding:5px 6px 5px 12px;font-size:12.5px;font-weight:700}
.lmtc-ov .inv-t button{border:0;background:none;color:var(--bleu);font-size:15px;line-height:1;cursor:pointer;padding:0 4px;border-radius:50%}
.lmtc-ov .inv-t button:hover{background:#fff}
.lmtc-ov .dem-h{margin:10px 0 12px;background:#f5f8fc;border:1px solid #dbe6f4;border-left:4px solid #2a5ea9;border-radius:10px;padding:10px 12px}
.lmtc-ov .dem-t{display:flex;align-items:center;gap:8px;flex-wrap:wrap;font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:#2a5ea9}
.lmtc-ov .dem-t em{font-style:normal;text-transform:none;letter-spacing:0;font-size:11.5px;font-weight:700;background:#fff;border:1px solid #dbe6f4;border-radius:6px;padding:1px 7px;color:var(--ink-2)}
.lmtc-ov .dem-t small{margin-left:auto;text-transform:none;letter-spacing:0;font-weight:600;color:var(--ink-3);font-size:11px}
.lmtc-ov .dem-t .tag{margin:0;font-size:10.5px;padding:1px 7px}
.lmtc-ov .dem-v{margin:6px 0 0;font-size:14px;font-weight:800;color:var(--bleu-dk)}
.lmtc-ov .dem-m{margin:6px 0 0;font-size:13.5px;line-height:1.45;color:#1c2b45;white-space:pre-line}
.lmtc-ov .dem-m.court{display:-webkit-box;-webkit-line-clamp:4;-webkit-box-orient:vertical;overflow:hidden}
.lmtc-ov .dem-h .lien{margin-top:4px;font-size:12px}
.lmtc .k-range{background:#fff;border:1px solid #ece9e1;border-radius:10px;padding:7px 12px;font-family:inherit;font-size:12px;font-weight:700;color:#2a5ea9;cursor:pointer;display:inline-flex;align-items:center;gap:6px}
.lmtc .k-range:hover{border-color:#2a5ea9}
:is(.lmtc,.lmtc-ov) .k-caret{font-size:10px;color:#888780}
.lmtc .lr.vt-vn{box-shadow:inset 3px 0 0 #53bda7}
.lmtc .lr.vt-vo{box-shadow:inset 3px 0 0 #fac055}
.lmtc .carte-l.vt-vn{border-left:3px solid #53bda7}
.lmtc .carte-l.vt-vo{border-left:3px solid #fac055}
.lmtc-ov .dem-h.vt-vn{border-left-color:#53bda7}
.lmtc-ov .dem-h.vt-vo{border-left-color:#fac055}
.lmtc-ov .dem-t em.u.vt-vn{color:#2c8a76;border-color:#bfe6dc}
.lmtc-ov .dem-t em.u.vt-vo{color:#a8660a;border-color:#f6dca8}
.lmtc .seg-u .pt{display:inline-block;width:3px;height:12px;border-radius:2px;margin-right:6px;vertical-align:-1px}
.lmtc .seg-u .pt.vt-vn{background:#53bda7}
.lmtc .seg-u .pt.vt-vo{background:#fac055}
.lmtc .tabs button.t-v .cnt{background:var(--ok-bg);color:var(--m-vert)}
.lmtc .tabs button.t-r .cnt{background:var(--chaud-bg);color:var(--m-rouge)}
.lmtc .tabs button.t-b .cnt{background:var(--sel);color:var(--bleu)}
.lmtc .tabs button.t-v .cnt.z,.lmtc .tabs button.t-r .cnt.z,.lmtc .tabs button.t-b .cnt.z{background:var(--calme-bg);color:var(--ink-3)}
.lmtc .tabs button.t-v:hover{color:var(--m-vert)}
.lmtc .tabs button.t-r:hover{color:var(--m-rouge)}
.lmtc .tabs button.t-b:hover{color:var(--bleu)}
.lmtc .tabs button.t-v.on{color:var(--m-vert);border-bottom-color:var(--vert)}
.lmtc .tabs button.t-r.on{color:var(--m-rouge);border-bottom-color:var(--rouge)}
.lmtc .tabs button.t-b.on{color:var(--bleu-dk);border-bottom-color:var(--bleu)}
.lmtc .tabs button.t-v.on .cnt{background:var(--vert);color:#fff}
.lmtc .tabs button.t-r.on .cnt{background:var(--m-rouge);color:#fff}
.lmtc .tabs button.t-b.on .cnt{background:var(--bleu);color:#fff}
.lmtc .comme-b{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;background:var(--sel);border:1.5px solid var(--bleu-clair);color:var(--bleu-dk);border-radius:12px;padding:10px 14px;margin:0 0 14px;font-size:13px;line-height:1.45}
.lmtc .go{display:flex;align-items:stretch}
.lmtc .go .main{border:0;background:var(--bleu);color:#fff;font:inherit;font-weight:800;font-size:13.5px;padding:9px 16px;border-radius:11px 0 0 11px;cursor:pointer;white-space:nowrap;text-align:left;line-height:1.25}
.lmtc .go .main small{display:block;font-size:10.5px;font-weight:600;opacity:.85}
.lmtc .go .alt{border:0;border-left:1px solid rgba(255,255,255,.28);background:var(--bleu);color:#fff;font:inherit;padding:0 12px;border-radius:0 11px 11px 0;cursor:pointer;font-size:12px}
.lmtc .go .main:hover,.lmtc .go .alt:hover{background:#24528f}
.lmtc .choix{display:flex;gap:6px;align-items:center;flex-wrap:wrap;justify-content:flex-end}
.lmtc .choix select{max-width:240px}
/* En souffrance : une carte par vendeur */
.lmtc .vend{background:var(--card);border:1px solid var(--line);border-radius:18px;margin-bottom:14px;overflow:hidden}
.lmtc .vend-h{display:flex;align-items:center;gap:14px;padding:16px 20px;border-bottom:1px solid var(--line)}
.lmtc .vend .av{flex:none;width:44px;height:44px;border-radius:50%;display:grid;place-items:center;font-weight:800;font-size:15px;color:#fff;background:var(--m-rouge)}
.lmtc .vend .av.o{background:var(--m-orange)}
.lmtc .vend-h .nm{flex:1;min-width:0}
.lmtc .vend-h .nm b{display:block;font-size:17px;font-weight:800;color:var(--ink)}
.lmtc .vend-h .nm span{font-size:12.5px;color:var(--ink-2);font-weight:600}
.lmtc .vend-h .nm em{font-style:normal;color:var(--m-rouge);font-weight:800}
.lmtc .vend-h .acts{display:flex;gap:8px;flex-wrap:wrap}
.lmtc .vend .l{display:grid;grid-template-columns:70px minmax(0,1fr) auto;gap:16px;align-items:center;padding:12px 20px;border-top:1px solid var(--line);cursor:pointer}
.lmtc .vend .l:first-child{border-top:0}
.lmtc .vend .l:hover{background:var(--hov)}
.lmtc .vend .l .d{font-size:13.5px;font-weight:800;color:var(--m-rouge);text-align:center;line-height:1.15}
.lmtc .vend .l .d small{display:block;font-size:10px;color:var(--ink-3);font-weight:700}
.lmtc .vend .l .qui b{font-size:14.5px;font-weight:800;color:var(--ink)}
.lmtc .lien-r{border:0;background:none;color:var(--bleu);font:inherit;font-weight:800;font-size:12.5px;cursor:pointer;padding:6px 4px;white-space:nowrap}
@media (max-width:720px){.lmtc .carte-l{grid-template-columns:60px minmax(0,1fr)}.lmtc .carte-l > .go,.lmtc .carte-l > .choix,.lmtc .carte-l > .btn{grid-column:1/-1}.lmtc .go .main{flex:1}.lmtc .vend-h{flex-wrap:wrap}.lmtc .vend .l{grid-template-columns:56px minmax(0,1fr)}.lmtc .vend .l .lien-r{grid-column:2;justify-self:start}}
@media (prefers-reduced-motion:reduce){.lmtc *{animation:none!important;transition:none!important}}
`;
    (doc.head || doc.documentElement).appendChild(st);
  }
})();
