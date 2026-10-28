// ============================================================================
//  One Data — Stock VN  (vn-liste.js)
//
//  v5 (28/10/2026) : LISTE VN FAÇON LISTE VO + FICHE VÉHICULE BACS.
//  * La liste reprend la présentation de la liste VO (v27) : une ligne par
//    véhicule (vignette, identité, statut / prix, lieu, véhicule BACS,
//    actions), pagination en haut et en bas, nombre par page au choix
//    (retenu sur le poste), tri par menu. Responsive.
//  * FICHE BACS : le n° de commande DBS (commande_fournisseur) est le champ
//    TFROrderNumber__c du véhicule BACS. Le pont BACS (extension v2.4.44,
//    poste récolteur) lit la fiche véhicule de chaque commande et la range
//    dans public.bacs_stock_vn. La liste en montre l'essentiel
//    (vn_bacs_resume : finition, motorisation, teintes, parc BACS), la fiche
//    le détail (vn_bacs_fiche), avec un lien direct vers le véhicule dans BACS.
//  * Le stock reste celui du DMS (v_liste_vn) : c'est lui qui dit ce qui est
//    en stock, à quel prix et depuis quand ; BACS décrit la voiture.
//  v6 (28/10/2026) : statut du parc BACS traduit (Stock, Livré, Livraison planifiée,
//    En route) ; un véhicule encore au stock DMS mais livré dans BACS est signalé.
//  v4 (28/10/2026) : colonne « N° commande » (commande fournisseur DBS).
//
//  Rendu dans __anchor, sur la page /vn-liste.
//  Source : public.v_liste_vn (= gold.stock + gold.veh + SITE + contre-marque)
//           + public.vn_bacs_resume() / vn_bacs_fiche(commande).
//  Perimetre : chips RESEAU / AFFAIRE / SITE posees depuis le site
//              selectionne, toutes retirables — meme logique que le VO.
//  Role      : prix d'achat et marge visibles si ID_Role ∈ {1,2,3,6,7,8}.
// ============================================================================
OD.define('vn-liste', {
  async mount(__anchor, ctx) {
  __anchor.id = 'stockvn-root';

  var PA_ROLES = [1, 2, 3, 6, 7, 8];   // roles voyant le prix d'achat et la marge
  var BACS_URL = 'https://toyota-france.my.site.com/bacs2/s/asset/';
  var CLE_PP = 'od_vn_par_page';

  var wwLib = window.wwLib;
  var doc = __anchor.ownerDocument || document;
  var win = (wwLib && wwLib.getFrontWindow && wwLib.getFrontWindow()) || window;

  function root() { return __anchor; }
  function sb() { return ctx.supabase; }
  function siteApi() { return win.oropraSite || window.oropraSite || null; }
  function connectedUser() {
    try {
      var d = ((wwLib && wwLib.getFrontWindow && wwLib.getFrontWindow()) || window).oropraUser;
      if (Array.isArray(d)) d = d[0];
      return d || {};
    } catch (e) { return {}; }
  }

  // ───────────────────────────────────────────────────────────── helpers
  function esc(s) {
    if (s == null) return '';
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;')
                    .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function num(v) { if (v == null || v === '') return null; var n = Number(v); return isNaN(n) ? null : n; }
  function notEmpty(v) { return v != null && String(v).trim() !== ''; }
  function eur(v) { var n = num(v); return n == null ? '—' : Math.round(n).toLocaleString('fr-FR') + ' €'; }
  function eurCourt(v) {
    var n = num(v); if (n == null) return '—';
    if (Math.abs(n) >= 1000000) return (n / 1000000).toFixed(1).replace('.', ',') + ' M€';
    if (Math.abs(n) >= 1000) return Math.round(n / 1000).toLocaleString('fr-FR') + ' k€';
    return Math.round(n) + ' €';
  }
  function ent(v) { var n = num(v); return n == null ? '—' : Math.round(n).toLocaleString('fr-FR'); }
  function dateFR(iso) {
    if (!notEmpty(iso)) return '—';
    var p = String(iso).slice(0, 10).split('-');
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : String(iso);
  }
  function jolieValeur(v) { return notEmpty(v) ? esc(v) : '—'; }
  // Capitalise une saisie DMS en majuscules (« BI TON GRIS » -> « Bi Ton Gris »).
  function propre(s) {
    if (!notEmpty(s)) return '';
    s = String(s).trim();
    if (s !== s.toUpperCase()) return s;
    return s.toLowerCase().replace(/(^|[\s\-'\/(])([a-zà-ÿ])/g, function (m, a, c) { return a + c.toUpperCase(); });
  }
  // DBS suffixe la marque du stock VN (« TOYOTA VN ») : on l'enlève.
  function marqueDe(r) { return propre(String((r && r.marque) || '').replace(/\s+V[NDO]$/i, '')); }
  // N° de commande DBS (commande fournisseur) ; « 0 » = pas de commande.
  function numCommande(r) { var c = r && r.commande_fournisseur; c = c == null ? '' : String(c).trim(); return c && c !== '0' ? c : ''; }
  function bacsDe(r) { var c = numCommande(r); return c ? S.bacs[c] || null : null; }

  // Les statuts arrivent en majuscules techniques : on les rend lisibles.
  var LIB_STATUT = {
    DISPONIBLE: 'Disponible', RESERVE: 'Réservé', COMMANDE_STOCK: 'Commande stock',
    COMMANDE_CLIENT: 'Commande client', COMMANDE_DEMO: 'Commande démo',
    DEMO: 'Démonstration', COURTOISIE: 'Courtoisie', ATTENTE_REPRISE: 'Attente de reprise',
    REPRISE_PROBABLE: 'Reprise probable', DEPOT_VENTE: 'Dépôt-vente'
  };
  function libStatut(s) { return LIB_STATUT[s] || (notEmpty(s) ? propre(String(s).replace(/_/g, ' ')) : 'Sans statut'); }

  // Codes énergie BACS.
  var LIB_ENERGIE = { HSD: 'Hybride', HEV: 'Hybride', PHEV: 'Hybride rechargeable', PHV: 'Hybride rechargeable',
    BEV: 'Électrique', EV: 'Électrique', FCEV: 'Hydrogène', GO: 'Diesel', DI: 'Diesel', ES: 'Essence', EH: 'Hybride' };
  // Statut du parc BACS (libellés anglais de BACS).
  var LIB_PARC = { 'Stock': 'En stock', 'Delivered': 'Livré', 'Delivery to plan': 'Livraison planifiée',
    'On the road': 'En route', 'In transit': 'En transit', 'Sold': 'Vendu' };
  function libParc(s) { return s ? (LIB_PARC[s] || s) : ''; }
  // Véhicule livré dans BACS mais toujours en stock au DMS : à vérifier.
  function ecartParc(r, statut) { return !r.en_commande && /^deliver/i.test(String(statut || '')) && !/^delivery to plan/i.test(String(statut || '')); }
  function libEnergie(e) { if (!notEmpty(e)) return ''; var k = String(e).trim().toUpperCase(); return LIB_ENERGIE[k] || propre(e); }

  // Pastille de teinte à partir du libellé (BACS sinon DMS).
  var TEINTES = [
    [/blanc|white|nacr/i, '#f4f6fa'], [/noir|black/i, '#2e3a4d'], [/gris|grey|gray|ardoise|anthracite/i, '#8c97a8'],
    [/argent|silver|alu/i, '#c3cad4'], [/rouge|red|bordeaux|carmin/i, '#c0392b'], [/bleu|blue|marine/i, '#2a5ea9'],
    [/vert|green|kaki/i, '#3d8b6e'], [/orange|cuivre/i, '#e07b39'], [/jaune|or\b|gold/i, '#e2b33c'],
    [/brun|marron|bronze|beige|sable|champagne/i, '#a58a6a']
  ];
  function teinte(lib) {
    var t = String(lib || '');
    for (var i = 0; i < TEINTES.length; i++) if (TEINTES[i][0].test(t)) return TEINTES[i][1];
    return null;
  }
  function pastille(lib) {
    var c = teinte(lib); if (!c) return '';
    // « Bi-ton … toit noir » : deux teintes.
    var bi = /bi.?ton/i.test(lib) && /toit\s+(\w+)/i.exec(lib);
    var c2 = bi ? teinte(bi[1]) : null;
    return '<i class="vn-tt" style="background:' + (c2 ? 'linear-gradient(180deg,' + c2 + ' 0 38%,' + c + ' 38%)' : c) + '"></i>';
  }

  function lsGet(k) { try { return win.localStorage.getItem(k); } catch (e) { return null; } }
  function lsSet(k, v) { try { win.localStorage.setItem(k, v); } catch (e) { } }

  // ───────────────────────────────────────────────────────────── etat
  var S = {
    raw: [], bacs: {}, loading: true, error: null,
    onglet: 'stock',        // stock | commandes | tous
    recherche: '', page: 1,
    perPage: num(lsGet(CLE_PP)) || 20,
    tri: 'jours_de_stock', sens: 'desc',
    showPA: false, fiche: null, ficheBacs: null, ficheOnglet: 'vehicule',
    f: { reseau: null, affaire: null, site: null, marque: null, modele: null,
         energie: null, statut: null, lieu: null, reserve: null }
  };

  // ───────────────────────────────────────────────────────────── donnees
  async function chargerBacs() {
    try {
      var r = await sb().rpc('vn_bacs_resume');
      if (r.error) return;
      var m = {};
      (r.data || []).forEach(function (b) { if (b && b.commande) m[String(b.commande).trim()] = b; });
      S.bacs = m;
    } catch (e) { /* fiche BACS absente chez ce tenant : liste DMS seule */ }
  }

  async function charger() {
    S.loading = true; S.error = null; rendre();
    var pBacs = chargerBacs();
    try {
      var tout = [], depuis = 0, taille = 1000;
      // Pagination explicite : PostgREST plafonne les reponses, et 12 000
      // lignes passent au-dessus de la limite par defaut.
      for (var i = 0; i < 30; i++) {
        var r = await sb().from('v_liste_vn').select('*').range(depuis, depuis + taille - 1);
        if (r.error) { S.error = r.error.message || String(r.error); break; }
        var lot = r.data || [];
        tout = tout.concat(lot);
        if (lot.length < taille) break;
        depuis += taille;
      }
      S.raw = tout;
    } catch (e) {
      S.error = (e && e.message) || String(e);
    }
    await pBacs;
    try {
      var role = num(connectedUser().ID_Role);
      S.showPA = role != null && PA_ROLES.indexOf(role) !== -1;
    } catch (e) { S.showPA = false; }
    S.loading = false;
    poserPerimetreParDefaut();
    rendre();
  }

  // Le site selectionne dans la barre du haut donne le perimetre de depart.
  function poserPerimetreParDefaut() {
    if (S.__perimetrePose) return;
    var api = siteApi(); if (!api || !api.getSiteId) return;
    var id = api.getSiteId(); if (id == null) return;
    var ligne = S.raw.find(function (r) { return String(r.id_site) === String(id); });
    if (ligne) {
      S.f.reseau = ligne.reseau || null;
      S.f.affaire = ligne.affaire || null;
      S.f.site = ligne.site || null;
    }
    S.__perimetrePose = true;
  }

  // ───────────────────────────────────────────────────────────── filtrage
  function filtrees() {
    var q = S.recherche.trim().toLowerCase();
    return S.raw.filter(function (r) {
      if (S.onglet === 'stock' && r.en_commande) return false;
      if (S.onglet === 'commandes' && !r.en_commande) return false;
      var f = S.f;
      if (f.reseau && r.reseau !== f.reseau) return false;
      if (f.affaire && r.affaire !== f.affaire) return false;
      if (f.site && r.site !== f.site) return false;
      if (f.marque && r.marque !== f.marque) return false;
      if (f.modele && r.modele !== f.modele) return false;
      if (f.energie && r.energie !== f.energie) return false;
      if (f.statut && r.statut !== f.statut) return false;
      if (f.lieu && r.lieu_stockage !== f.lieu) return false;
      if (f.reserve != null && !!r.reserve !== f.reserve) return false;
      if (q) {
        var b = bacsDe(r) || {};
        var foin = [r.vin, r.immatriculation, r.marque, r.modele, r.version,
                    r.commande_fournisseur, r.identite_dms, r.couleur,
                    b.finition, b.motorisation, b.couleur, b.immatriculation]
          .filter(Boolean).join(' ').toLowerCase();
        if (foin.indexOf(q) < 0) return false;
      }
      return true;
    });
  }

  function valTri(r, k) {
    if (k === 'commande_fournisseur') return numCommande(r) || null;
    if (k === 'modele') return [r.marque, r.modele, r.version].filter(Boolean).join(' ') || null;
    var v = r[k];
    return v === '' ? null : v;
  }
  function triees(l) {
    var k = S.tri, sens = S.sens === 'asc' ? 1 : -1;
    return l.slice().sort(function (a, b) {
      var x = valTri(a, k), y = valTri(b, k);
      if (x == null && y == null) return 0;
      if (x == null) return 1;            // les valeurs absentes toujours en bas
      if (y == null) return -1;
      var nx = num(x), ny = num(y);
      if (nx != null && ny != null && k !== 'commande_fournisseur') return (nx - ny) * sens;
      return String(x).localeCompare(String(y), 'fr', { numeric: true }) * sens;
    });
  }

  function valeursDe(cle) {
    var vues = {};
    S.raw.forEach(function (r) { if (notEmpty(r[cle])) vues[r[cle]] = 1; });
    return Object.keys(vues).sort(function (a, b) { return a.localeCompare(b, 'fr'); });
  }

  // ───────────────────────────────────────────────────────────── rendu
  function rendre() {
    var el = root(); if (!el) return;
    if (!doc.getElementById('od-css-vn5')) {
      var st = doc.createElement('style'); st.id = 'od-css-vn5'; st.textContent = CSS;
      doc.head.appendChild(st);
    }
    if (S.loading) { el.innerHTML = coque('<div class="vn-vide"><span class="vn-spin"></span>Chargement du stock…</div>'); return; }
    if (S.error) { el.innerHTML = coque('<div class="vn-vide vn-err">' + esc(S.error) + '</div>'); return; }

    var l = triees(filtrees());
    var pages = Math.max(1, Math.ceil(l.length / S.perPage));
    if (S.page > pages) S.page = pages;
    var page = l.slice((S.page - 1) * S.perPage, S.page * S.perPage);

    el.innerHTML = coque(entete() + reperes(l) + filtres() + liste(page, l.length))
                 + (S.fiche ? fiche(S.fiche) : '');
    brancher();
  }

  function coque(dedans) { return '<div class="vn-wrap">' + dedans + '</div>'; }

  function entete() {
    var nStock = S.raw.filter(function (r) { return !r.en_commande; }).length;
    var nCmd = S.raw.filter(function (r) { return r.en_commande; }).length;
    return '<div class="vn-head">'
      + '<div><h1>Stock véhicules neufs</h1>'
      + '<p>Le parc disponible et les commandes constructeur attendues</p></div>'
      + '<div class="vn-onglets">'
        + ong('stock', 'En stock', nStock)
        + ong('commandes', 'Commandes', nCmd)
        + ong('tous', 'Tous', S.raw.length)
      + '</div></div>';
  }
  function ong(cle, lbl, n) {
    return '<button class="vn-ong' + (S.onglet === cle ? ' on' : '') + '" data-ong="' + cle + '">'
      + esc(lbl) + '<span>' + ent(n) + '</span></button>';
  }

  // Quatre reperes, choisis pour la question d'un responsable VN : combien
  // de vehicules, quelle valeur immobilisee, depuis combien de temps, et
  // combien sont deja promis a un client.
  function reperes(l) {
    var valeur = l.reduce(function (s, r) { return s + (num(r.tarif_catalogue) || num(r.prix_vente_ht) || 0); }, 0);
    var jours = l.map(function (r) { return num(r.jours_de_stock); }).filter(function (x) { return x != null; });
    jours.sort(function (a, b) { return a - b; });
    var median = jours.length ? jours[Math.floor(jours.length / 2)] : null;
    var reserves = l.filter(function (r) { return r.reserve; }).length;
    return '<div class="vn-reperes">'
      + repere('Véhicules', ent(l.length), S.onglet === 'commandes' ? 'commandés' : 'au périmètre affiché')
      + repere('Valeur au tarif', eurCourt(valeur), 'somme des tarifs catalogue')
      + repere('Ancienneté médiane', median == null ? '—' : ent(median) + ' j', 'depuis l\'entrée en stock')
      + repere('Réservés', ent(reserves), 'contre-marque posée')
      + '</div>';
  }
  function repere(lbl, val, note) {
    return '<div class="vn-rep"><div class="vn-rep-l">' + esc(lbl) + '</div>'
      + '<div class="vn-rep-v">' + val + '</div>'
      + '<div class="vn-rep-n">' + esc(note) + '</div></div>';
  }

  function filtres() {
    return '<div class="vn-filtres">'
      + '<input class="vn-rech" id="vn-q" placeholder="VIN, immatriculation, modèle, n° de commande…" value="' + esc(S.recherche) + '">'
      + sel('reseau', 'Réseau') + sel('affaire', 'Affaire') + sel('site', 'Site')
      + sel('marque', 'Marque') + sel('modele', 'Modèle') + sel('energie', 'Énergie')
      + selStatut() + sel('lieu', 'Lieu de stockage', 'lieu_stockage')
      + '<button class="vn-raz" id="vn-raz">Tout effacer</button>'
      + '</div>';
  }
  function sel(cle, lbl, champ) {
    var vals = valeursDe(champ || cle);
    if (!vals.length) return '';
    return '<select class="vn-sel" data-f="' + cle + '">'
      + '<option value="">' + esc(lbl) + '</option>'
      + vals.map(function (v) {
          return '<option value="' + esc(v) + '"' + (S.f[cle] === v ? ' selected' : '') + '>' + esc(v) + '</option>';
        }).join('')
      + '</select>';
  }
  function selStatut() {
    var vals = valeursDe('statut');
    if (!vals.length) return '';
    return '<select class="vn-sel" data-f="statut"><option value="">Statut</option>'
      + vals.map(function (v) {
          return '<option value="' + esc(v) + '"' + (S.f.statut === v ? ' selected' : '') + '>' + esc(libStatut(v)) + '</option>';
        }).join('') + '</select>';
  }

  // ───────────────────────────────────────────────────────────── liste
  var TRIS = [
    ['jours_de_stock', 'Jours en stock'], ['prix_vente_ttc', 'Prix TTC'], ['tarif_catalogue', 'Tarif catalogue'],
    ['date_entree_stock', 'Entrée en stock'], ['commande_fournisseur', 'N° de commande'], ['modele', 'Modèle'], ['site', 'Site']
  ];
  function enteteListe() {
    var opts = TRIS.map(function (t) { return '<option value="' + t[0] + '"' + (S.tri === t[0] ? ' selected' : '') + '>' + esc(t[1]) + '</option>'; }).join('');
    var nB = Object.keys(S.bacs).length;
    return '<div class="vl-head"><span class="vl-hint">' + (nB ? '<i class="vn-bdot"></i>' + ent(nB) + ' véhicule' + (nB > 1 ? 's' : '') + ' décrit' + (nB > 1 ? 's' : '') + ' par BACS' : 'Fiches BACS en cours de lecture') + '</span>'
      + '<div class="vl-tri">Trier par <select id="vl-tri">' + opts + '</select>'
      + '<button type="button" class="vl-dir" id="vl-dir" title="' + (S.sens === 'asc' ? 'Croissant' : 'Décroissant') + '">' + (S.sens === 'asc' ? '↑' : '↓') + '</button></div></div>';
  }
  function pager(total) {
    var pages = Math.max(1, Math.ceil(total / S.perPage)), page = S.page;
    if (pages <= 1) return '';
    var out = '<button class="vn-pg" data-pg="' + (page - 1) + '"' + (page <= 1 ? ' disabled' : '') + '>‹</button>';
    var lst = [];
    for (var i = 1; i <= pages; i++) { if (i === 1 || i === pages || Math.abs(i - page) <= 1) lst.push(i); else if (lst[lst.length - 1] !== '…') lst.push('…'); }
    lst.forEach(function (i) { out += i === '…' ? '<span class="vn-pg-dots">…</span>' : '<button class="vn-pg' + (i === page ? ' on' : '') + '" data-pg="' + i + '">' + i + '</button>'; });
    out += '<button class="vn-pg" data-pg="' + (page + 1) + '"' + (page >= pages ? ' disabled' : '') + '>›</button>';
    return '<div class="vn-pager">' + out + '</div>';
  }
  function barrePages(total) {
    var de = total ? (S.page - 1) * S.perPage + 1 : 0, a = Math.min(total, S.page * S.perPage);
    var opts = [10, 20, 30, 50, 100, 200].map(function (v) { return '<option value="' + v + '"' + (v === S.perPage ? ' selected' : '') + '>' + v + '</option>'; }).join('');
    return '<div class="vl-pbar"><div class="vl-pinfo"><span>' + ent(de) + '–' + ent(a) + ' sur ' + ent(total) + '</span>'
      + '<span>Afficher <select class="vl-pp">' + opts + '</select> par page</span></div>' + pager(total) + '</div>';
  }

  function liste(page, total) {
    if (!total) return '<div class="vn-vide">Aucun véhicule ne correspond à ces critères.</div>';
    return barrePages(total)
      + '<div class="vl-list">' + enteteListe() + page.map(ligne).join('') + '</div>'
      + barrePages(total);
  }

  function vignette(r, b) {
    var coul = (b && b.couleur) || r.couleur;
    var en = libEnergie((b && b.energie) || r.energie);
    var fam = propre(r.modele) || marqueDe(r) || 'VN';
    return '<div class="vn-vig' + (r.en_commande ? ' cmd' : '') + '">'
      + '<span class="vn-vig-m">' + esc(marqueDe(r)) + '</span>'
      + '<span class="vn-vig-f">' + esc(fam) + '</span>'
      + '<span class="vn-vig-b">' + pastille(coul) + (en ? '<span>' + esc(en) + '</span>' : '') + '</span>'
      + '</div>';
  }

  function badgeJours(r) {
    if (r.en_commande) return '<span class="vl-badge cmd">' + esc(libStatut(r.statut)) + '</span>';
    var nb = num(r.jours_de_stock);
    if (nb == null) return '<span class="vl-badge ok">' + esc(libStatut(r.statut)) + '</span>';
    return '<span class="vl-badge' + (nb <= 90 ? ' ok' : nb <= 180 ? ' mid' : '') + '">' + esc(libStatut(r.statut)) + ' · ' + ent(nb) + ' j</span>';
  }

  function ligne(r) {
    var b = bacsDe(r), cmd = numCommande(r);
    var titre = [marqueDe(r), propre(r.modele)].filter(Boolean).join(' ') || '—';
    var finition = (b && [b.finition, b.motorisation].filter(Boolean).join(' · ')) || propre(r.version) || '';
    var ident = [(b && b.immatriculation) || r.immatriculation, r.vin ? r.vin : null].filter(notEmpty).map(esc);
    var coul = (b && b.couleur) || propre(r.couleur);
    var meta2 = [coul ? pastille(coul) + esc(coul) : null, (b && b.interieur) ? 'Intérieur ' + esc(b.interieur) : null].filter(Boolean).join(' | ');
    var bacsBloc = b
      ? '<div class="vl-lbl">Véhicule BACS</div>'
        + '<div class="vl-lieu"><i class="vn-bdot' + (ecartParc(r, b.statut_parc) ? ' warn' : '') + '"></i>' + esc(libParc(b.statut_parc) || 'Parc') + '</div>'
        + (ecartParc(r, b.statut_parc) ? '<div class="vl-m vl-warn">Livré dans BACS, encore au stock DMS</div>' : '')
        + (b.point_de_vente ? '<div class="vl-m">' + esc(propre(b.point_de_vente.replace(/^\d+\s+/, ''))) + '</div>' : '')
        + (b.facture_le ? '<div class="vl-m">Facturé le ' + esc(dateFR(b.facture_le)) + '</div>' : '')
      : '<div class="vl-lbl">Véhicule BACS</div><div class="vl-m vl-muet">' + (cmd ? 'Pas encore lu' : 'Sans n° de commande') + '</div>';
    return '<div class="vl-row" data-id="' + esc(r.identite_dms) + '">'
      + '<div class="vl-img">' + vignette(r, b) + '</div>'
      + '<div class="vl-id">'
        + '<div class="vl-t">' + (r.reserve ? '<span class="vn-dot red" title="Contre-marque posée"></span>' : '<span class="vn-dot green" title="Libre"></span>') + esc(titre) + '</div>'
        + (finition ? '<div class="vl-v" title="' + esc(finition) + '">' + esc(finition) + '</div>' : '')
        + '<div class="vl-m">' + (cmd ? '<span class="vn-cmd" title="N° de commande DBS">' + esc(cmd) + '</span>' : '') + (ident.length ? ident.join(' | ') : (r.vin ? '' : '<i>VIN non attribué</i>')) + '</div>'
        + (meta2 ? '<div class="vl-m">' + meta2 + '</div>' : '')
        + '<div class="vl-site">' + jolieValeur(r.site) + '</div>'
      + '</div>'
      + '<div class="vl-st">' + badgeJours(r)
        + '<div class="vl-prix">' + eur(r.prix_vente_ttc) + '</div>'
        + (num(r.tarif_catalogue) ? '<div class="vl-m">Tarif ' + eur(r.tarif_catalogue) + '</div>' : '')
        + (S.showPA && num(r.prix_achat_ht) ? '<div class="vl-pa">PA ' + eur(r.prix_achat_ht) + (num(r.marge_ht) != null ? ' · marge ' + eur(r.marge_ht) : '') + '</div>' : '')
      + '</div>'
      + '<div class="vl-loc"><div class="vl-lbl">Lieu de stockage</div>'
        + '<div class="vl-lieu">' + (notEmpty(r.lieu_stockage) ? esc(r.lieu_stockage) : '—') + '</div>'
        + (r.date_entree_stock ? '<div class="vl-m">Entré le ' + esc(dateFR(r.date_entree_stock)) + '</div>' : '')
      + '</div>'
      + '<div class="vl-bacs">' + bacsBloc + '</div>'
      + '<div class="vl-act">'
        + '<button type="button" class="vn-iact" data-act="fiche" title="Fiche véhicule">' + IC.oeil + '</button>'
        + (b && b.asset_id ? '<a class="vn-iact b" href="' + BACS_URL + esc(b.asset_id) + '" target="_blank" rel="noopener" title="Ouvrir le véhicule dans BACS">B</a>' : '')
      + '</div>'
      + '</div>';
  }

  var IC = {
    oeil: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/><circle cx="12" cy="12" r="3"/></svg>'
  };

  // ───────────────────────────────────────────────────────────── fiche
  function bv(c, k) { var v = c && c[k]; return v == null || v === '' ? null : v; }
  function fiche(r) {
    var b = bacsDe(r), fb = S.ficheBacs, c = (fb && fb.champs) || null, parc = (fb && fb.parc) || null, cmd = numCommande(r);
    var titre = [marqueDe(r) || propre(bv(c, 'DisplayBrand__c')), (c && bv(c, 'DisplayFamily__c')) || propre(r.modele)].filter(Boolean).join(' ');
    var sous = (c && [bv(c, 'DisplayVersion__c'), bv(c, 'DisplayEngine__c')].filter(Boolean).join(' · ')) || propre(r.version);
    var chips = ''
      + chip('Prix TTC', eur(r.prix_vente_ttc))
      + chip(r.en_commande ? 'Statut' : 'En stock', r.en_commande ? esc(libStatut(r.statut)) : (r.jours_de_stock == null ? '—' : ent(r.jours_de_stock) + ' jours'))
      + chip('N° commande', cmd ? '<span class="vn-cmd">' + esc(cmd) + '</span>' : '—')
      + chip('VIN', notEmpty(r.vin) ? '<span class="vn-mono">' + esc(r.vin) + '</span>' : '<i>non attribué</i>');
    var onglets = '<div class="vf-tabs">'
      + '<button type="button" class="vf-tab' + (S.ficheOnglet === 'vehicule' ? ' on' : '') + '" data-ftab="vehicule">Véhicule</button>'
      + '<button type="button" class="vf-tab' + (S.ficheOnglet === 'stock' ? ' on' : '') + '" data-ftab="stock">Stock et prix</button>'
      + '</div>';
    return '<div class="vn-modal" id="vn-modal"><div class="vn-card">'
      + '<button class="vn-x" id="vn-close" title="Fermer">✕</button>'
      + '<div class="vf-top">'
        + vignette(r, b)
        + '<div class="vf-tt"><h2>' + jolieValeur(titre) + '</h2>'
        + '<p class="vn-card-sub">' + jolieValeur(sous) + '</p>'
        + '<div class="vf-puces">' + puce(r)
          + (b && b.asset_id ? '<a class="vf-bacs" href="' + BACS_URL + esc(b.asset_id) + '" target="_blank" rel="noopener"><i class="vn-bdot"></i>Ouvrir dans BACS</a>' : '')
        + '</div></div>'
      + '</div>'
      + '<div class="vf-chips">' + chips + '</div>'
      + onglets
      + '<div class="vf-body">' + (S.ficheOnglet === 'stock' ? ongletStock(r) : ongletVehicule(r, b, fb, c, parc)) + '</div>'
      + '</div></div>';
  }
  function chip(l, v) { return '<div class="vf-chip"><div class="vf-chip-l">' + esc(l) + '</div><div class="vf-chip-v">' + v + '</div></div>'; }
  function ligneF(l, v) { return v == null || v === '' ? '' : '<div class="vn-fl"><span>' + esc(l) + '</span><b>' + v + '</b></div>'; }
  function section(t, lignes) { return lignes ? '<div class="vf-sec"><h3>' + esc(t) + '</h3>' + lignes + '</div>' : ''; }
  function e(v) { return v == null || v === '' ? null : esc(v); }

  function ongletVehicule(r, b, fb, c, parc) {
    if (numCommande(r) && fb === undefined) return '<div class="vf-wait"><span class="vn-spin"></span>Lecture de la fiche BACS…</div>';
    var dms = section('Description DMS',
        ligneF('Version', e(propre(r.version)))
      + ligneF('Couleur', r.couleur ? pastille(r.couleur) + esc(propre(r.couleur)) : null)
      + ligneF('Intérieur', e(propre(r.couleur_interieur)))
      + ligneF('Énergie', e(propre(r.energie)))
      + ligneF('Boîte', e(propre(r.boite)))
      + ligneF('Carrosserie', e(r.carrosserie))
      + ligneF('Millésime', e(r.millesime))
      + ligneF('CO2', num(r.co2) != null ? ent(r.co2) + ' g/km' : null)
      + ligneF('Puissance fiscale', num(r.puissance_fiscale) != null ? ent(r.puissance_fiscale) + ' CV' : null));
    if (!c) {
      var msg = !numCommande(r) ? 'Ce véhicule n\'a pas de n° de commande : il ne peut pas être rapproché de BACS.'
              : (fb && fb.trouve === false) ? 'Aucun véhicule BACS ne porte le n° de commande ' + esc(numCommande(r)) + (r.vin ? ' ni le VIN ' + esc(r.vin) : '') + '.'
              : 'La fiche BACS de ce véhicule n\'a pas encore été lue. Elle le sera au prochain passage du pont BACS.';
      return '<div class="vf-note">' + msg + '</div><div class="vf-grid">' + dms + '</div>'
        + (notEmpty(r.equipements) ? '<div class="vf-equip"><h3>Équipements</h3><p>' + esc(r.equipements) + '</p></div>' : '');
    }
    var cylindree = num(bv(c, 'Engine_Ccs__c'));
    var portes = bv(c, 'DisplayDoorsNumber__c'); portes = portes ? String(portes).replace(/^0+/, '') : null;
    var ident = section('Identité',
        ligneF('Marque', e(bv(c, 'Brand__c__lib') || propre(bv(c, 'DisplayBrand__c'))))
      + ligneF('Modèle', e(bv(c, 'DisplayFamily__c')))
      + ligneF('Finition', e(bv(c, 'DisplayVersion__c') || [bv(c, 'Product2.Version__c'), bv(c, 'Product2.Variant__c')].filter(Boolean).join(' ')))
      + ligneF('Motorisation', e(bv(c, 'DisplayEngine__c') || bv(c, 'Product2.Model__c')))
      + ligneF('Carrosserie', e(bv(c, 'BodyType__c') || bv(c, 'Product2.Body__c')))
      + ligneF('Portes', e(portes))
      + ligneF('Immatriculation', e(bv(c, 'Licence_Plate__c') || r.immatriculation)));
    var tech = section('Motorisation et fiscalité',
        ligneF('Énergie', e(libEnergie(bv(c, 'DisplayEnergy__c'))))
      + ligneF('Boîte', e(bv(c, 'DisplayGearBox__c')))
      + ligneF('Cylindrée', cylindree ? ent(cylindree) + ' cm³' : null)
      + ligneF('CO2', num(bv(c, 'DisplayCO2__c')) != null ? ent(bv(c, 'DisplayCO2__c')) + ' g/km' : null)
      + ligneF('Puissance fiscale', num(bv(c, 'Fiscal_Rating__c') || bv(c, 'DisplayMaxPowerHP__c')) != null ? ent(bv(c, 'Fiscal_Rating__c') || bv(c, 'DisplayMaxPowerHP__c')) + ' CV' : null)
      + ligneF('Pneumatiques', e(bv(c, 'dimension_pneus__c'))));
    var ext = bv(c, 'DisplayExternalColor__c');
    var teintes = section('Teintes',
        ligneF('Extérieur', ext ? pastille(ext) + esc(ext) + (bv(c, 'ExternalColor__c') ? ' <span class="vn-code">' + esc(bv(c, 'ExternalColor__c')) + '</span>' : '') : null)
      + ligneF('Intérieur', e(bv(c, 'DisplayInterior__c')))
      + ligneF('Sellerie', e(bv(c, 'Upholstery__c'))));
    var codes = section('Codes constructeur',
        ligneF('Code modèle', bv(c, 'Model__c') ? '<span class="vn-mono">' + esc(bv(c, 'Model__c')) + '</span>' : null)
      + ligneF('Version / variante', [bv(c, 'Version__c'), bv(c, 'Variant__c')].filter(Boolean).length ? '<span class="vn-mono">' + esc([bv(c, 'Version__c'), bv(c, 'Variant__c')].filter(Boolean).join(' / ')) + '</span>' : null)
      + ligneF('Katashiki', bv(c, 'Katashiki__c') ? '<span class="vn-mono">' + esc(bv(c, 'Katashiki__c')) + '</span>' : null)
      + ligneF('Famille', e(bv(c, 'Family__c'))));
    var suivi = section('Suivi BACS',
        ligneF('Statut du parc', parc && parc.statut ? esc(libParc(parc.statut)) + (ecartParc(r, parc.statut) ? ' <span class="vn-warn">encore au stock DMS</span>' : '') : null)
      + ligneF('Point de vente', e(parc && parc.site ? propre(String(parc.site).replace(/^\d+\s+/, '')) : null))
      + ligneF('Type de parc', e(parc && parc.type))
      + ligneF('Client', e(parc && parc.client))
      + ligneF('Facturé par Toyota France', bv(c, 'TFR_invoicing_date__c') ? esc(dateFR(bv(c, 'TFR_invoicing_date__c'))) : null)
      + ligneF('Date de production', bv(c, 'ProductionDate__c') ? esc(dateFR(bv(c, 'ProductionDate__c'))) : null)
      + ligneF('Fin de garantie constructeur', bv(c, 'C1W2_Manufacturer_Warranty_End_Date__c') ? esc(dateFR(bv(c, 'C1W2_Manufacturer_Warranty_End_Date__c'))) : null)
      + ligneF('Véhicule connectable', bv(c, 'Connectable__c') === true ? 'Oui' : (bv(c, 'Connectable__c') === false ? 'Non' : null))
      + ligneF('Type de fiche', e(bv(c, 'RecordType.Name__lib') || bv(c, 'RecordType.Name'))));
    var lu = fb && fb.lu_le ? '<div class="vf-lu">Fiche BACS lue le ' + esc(dateFR(fb.lu_le)) + ' à ' + esc(String(new Date(fb.lu_le).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }))) + '</div>' : '';
    return '<div class="vf-grid">' + ident + tech + teintes + suivi + codes + '</div>'
      + (notEmpty(r.equipements) ? '<div class="vf-equip"><h3>Équipements (DMS)</h3><p>' + esc(r.equipements) + '</p></div>' : '')
      + lu;
  }

  function ongletStock(r) {
    var stock = section('Stock',
        ligneF('Site', jolieValeur(r.site))
      + ligneF('Lieu de stockage', jolieValeur(r.lieu_stockage))
      + ligneF('Statut', esc(libStatut(r.statut)))
      + ligneF('Entrée en stock', dateFR(r.date_entree_stock))
      + ligneF('Ancienneté', r.jours_de_stock == null ? '—' : ent(r.jours_de_stock) + ' jours')
      + ligneF('Réservation', r.reserve ? 'Contre-marque posée' : 'Libre')
      + ligneF('N° véhicule DMS', jolieValeur(r.identite_dms)));
    var prix = section('Prix',
        ligneF('Tarif catalogue', eur(r.tarif_catalogue))
      + ligneF('Options', eur(r.montant_options))
      + ligneF('Prix de vente HT', eur(r.prix_vente_ht))
      + ligneF('Prix de vente TTC', '<span class="vf-big">' + eur(r.prix_vente_ttc) + '</span>')
      + (S.showPA ? ligneF('Prix d\'achat HT', eur(r.prix_achat_ht)) : '')
      + (S.showPA ? ligneF('Marge', '<span' + (num(r.marge_ht) < 0 ? ' class="neg"' : '') + '>' + eur(r.marge_ht) + '</span>') : ''));
    var appro = section('Approvisionnement',
        ligneF('Fournisseur', jolieValeur(r.fournisseur))
      + ligneF('N° de commande', numCommande(r) ? '<span class="vn-cmd">' + esc(numCommande(r)) + '</span>' : '—')
      + ligneF('Facture fournisseur', dateFR(r.date_facture_fournisseur))
      + ligneF('Stock payé', r.stock_paye == null ? '—' : (r.stock_paye ? 'Oui' : 'Non'))
      + ligneF('Financement', jolieValeur(r.type_financement))
      + ligneF('Organisme', notEmpty(r.organisme_financement) ? esc(r.organisme_financement) : null));
    return '<div class="vf-grid">' + stock + prix + appro + '</div>';
  }

  function puce(r) {
    var cl = r.disponible ? 'ok' : (r.en_commande ? 'cmd' : 'autre');
    return '<span class="vn-puce ' + cl + '">' + esc(libStatut(r.statut)) + '</span>'
      + (r.reserve ? '<span class="vn-puce cm">réservé</span>' : '');
  }

  async function ouvrirFiche(r) {
    S.fiche = r; S.ficheOnglet = 'vehicule';
    var cmd = numCommande(r);
    S.ficheBacs = cmd ? undefined : null;
    rendre();
    if (!cmd) return;
    var fb = null;
    try {
      var res = await sb().rpc('vn_bacs_fiche', { p_commande: cmd });
      fb = res.error ? null : (res.data || null);
    } catch (e) { fb = null; }
    if (S.fiche !== r) return;
    S.ficheBacs = fb;
    rendre();
  }
  function fermerFiche() { S.fiche = null; S.ficheBacs = null; rendre(); }

  // ───────────────────────────────────────────────────────────── evenements
  function brancher() {
    var el = root(); if (!el) return;
    el.querySelectorAll('[data-ong]').forEach(function (b) {
      b.onclick = function () { S.onglet = b.dataset.ong; S.page = 1; rendre(); };
    });
    el.querySelectorAll('[data-f]').forEach(function (s) {
      s.onchange = function () { S.f[s.dataset.f] = s.value || null; S.page = 1; rendre(); };
    });
    var t = el.querySelector('#vl-tri');
    if (t) t.onchange = function () { S.tri = t.value; S.sens = (t.value === 'modele' || t.value === 'site' || t.value === 'commande_fournisseur') ? 'asc' : 'desc'; S.page = 1; rendre(); };
    var dir = el.querySelector('#vl-dir');
    if (dir) dir.onclick = function () { S.sens = S.sens === 'asc' ? 'desc' : 'asc'; rendre(); };
    el.querySelectorAll('.vl-pp').forEach(function (s) {
      s.onchange = function () { S.perPage = num(s.value) || 20; lsSet(CLE_PP, String(S.perPage)); S.page = 1; rendre(); };
    });
    el.querySelectorAll('.vn-pg[data-pg]').forEach(function (b) {
      b.onclick = function () { var p = num(b.dataset.pg); if (p) { S.page = p; rendre(); var l = root().querySelector('.vl-list'); if (l && l.scrollIntoView) l.scrollIntoView({ block: 'start', behavior: 'smooth' }); } };
    });
    el.querySelectorAll('.vl-row[data-id]').forEach(function (row) {
      row.onclick = function (ev) {
        if (ev.target.closest && ev.target.closest('a')) return;
        var r = S.raw.find(function (x) { return String(x.identite_dms) === row.dataset.id; });
        if (r) ouvrirFiche(r);
      };
    });
    el.querySelectorAll('[data-ftab]').forEach(function (b) {
      b.onclick = function () { S.ficheOnglet = b.dataset.ftab; rendre(); };
    });
    var q = el.querySelector('#vn-q');
    if (q) {
      q.oninput = function () {
        clearTimeout(S.__t);
        // Le filtrage porte sur 12 000 lignes en memoire : on attend la fin
        // de la frappe plutot que de tout recalculer a chaque touche.
        S.__t = setTimeout(function () { S.recherche = q.value; S.page = 1; rendre();
          var n = root().querySelector('#vn-q'); if (n) { n.focus(); n.setSelectionRange(n.value.length, n.value.length); }
        }, 220);
      };
    }
    var raz = el.querySelector('#vn-raz');
    if (raz) raz.onclick = function () {
      S.f = { reseau: null, affaire: null, site: null, marque: null, modele: null,
              energie: null, statut: null, lieu: null, reserve: null };
      S.recherche = ''; S.page = 1; rendre();
    };
    var x = el.querySelector('#vn-close'); if (x) x.onclick = fermerFiche;
    var m = el.querySelector('#vn-modal');
    if (m) m.onclick = function (ev) { if (ev.target === m) fermerFiche(); };
  }
  if (!window.__vnEchap) {
    window.__vnEchap = true;
    doc.addEventListener('keydown', function (ev) { if (ev.key === 'Escape' && window.__vnFermer) window.__vnFermer(); });
  }
  window.__vnFermer = function () { if (S.fiche) fermerFiche(); };

  // ───────────────────────────────────────────────────────────── styles
  var CSS = ''
    + '#stockvn-root{font-family:"Nunito Sans",Inter,system-ui,sans-serif;color:#1F4A85}'
    + '.vn-wrap{max-width:1280px;margin:0 auto;padding:4px 0 40px}'
    + '.vn-head{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap;margin-bottom:18px}'
    + '.vn-head h1{font-size:23px;font-weight:800;margin:0 0 3px;letter-spacing:-.02em}'
    + '.vn-head p{margin:0;font-size:13.5px;color:#9bb3d1}'
    + '.vn-onglets{display:flex;gap:6px;flex-wrap:wrap}'
    + '.vn-ong{border:1px solid #e2eaf5;background:#fff;color:#54678a;border-radius:9px;padding:7px 14px;font:inherit;font-size:13.5px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:7px}'
    + '.vn-ong span{background:#f2f6fc;color:#54678a;border-radius:20px;padding:1px 8px;font-size:11.5px;font-variant-numeric:tabular-nums}'
    + '.vn-ong.on{background:#1F4A85;border-color:#1F4A85;color:#fff}'
    + '.vn-ong.on span{background:rgba(255,255,255,.18);color:#fff}'
    + '.vn-reperes{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:#e8eef7;border:1px solid #e8eef7;border-radius:11px;overflow:hidden;margin-bottom:16px}'
    + '.vn-rep{background:#fff;padding:13px 16px}'
    + '.vn-rep-l{font-size:11.5px;color:#8ba3c0;font-weight:600;margin-bottom:5px}'
    + '.vn-rep-v{font-size:22px;font-weight:800;line-height:1.1;font-variant-numeric:tabular-nums}'
    + '.vn-rep-n{font-size:11.5px;color:#a8bcd4;margin-top:3px}'
    + '.vn-filtres{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:4px;align-items:center}'
    + '.vn-rech{flex:1 1 260px;min-width:220px;border:1px solid #e2eaf5;border-radius:9px;padding:8px 12px;font:inherit;font-size:13.5px;background:#fff;color:#1F4A85}'
    + '.vn-sel{border:1px solid #e2eaf5;border-radius:9px;padding:8px 10px;font:inherit;font-size:13px;background:#fff;color:#1F4A85;max-width:180px}'
    + '.vn-raz{border:none;background:none;color:#2a5ea9;font:inherit;font-size:13px;font-weight:600;cursor:pointer;padding:8px 6px}'
    // barre de pages (comme la liste VO)
    + '.vl-pbar{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;margin:14px 2px 0}'
    + '.vl-pinfo{display:flex;align-items:center;gap:14px;flex-wrap:wrap;font-size:13px;font-weight:700;color:#7a98c5}'
    + '.vl-pinfo select{border:1.5px solid #e2eaf5;border-radius:8px;padding:3px 6px;font:inherit;color:#1F4A85;background:#fff}'
    + '.vn-pager{display:flex;gap:4px;align-items:center}'
    + '.vn-pg{min-width:32px;height:31px;border:1.5px solid #e2eaf5;background:#fff;color:#2a5ea9;border-radius:9px;font:inherit;font-size:13px;font-weight:700;cursor:pointer;padding:0 8px}'
    + '.vn-pg.on{background:#1F4A85;border-color:#1F4A85;color:#fff}.vn-pg:disabled{opacity:.4;cursor:default}'
    + '.vn-pg-dots{color:#9bb3d1;padding:0 3px}'
    // liste
    + '.vl-list{margin-top:12px;background:#fff;border:1px solid #e8eef7;border-radius:16px;overflow:hidden;box-shadow:0 6px 20px rgba(31,74,133,.05)}'
    + '.vl-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:10px 16px;background:#f7faff;border-bottom:1px solid #e8eef7;font-size:12.5px;font-weight:700;color:#7a98c5;flex-wrap:wrap}'
    + '.vl-hint{display:flex;align-items:center;gap:7px}'
    + '.vl-tri{display:flex;align-items:center;gap:7px}'
    + '.vl-tri select{border:1.5px solid #e2eaf5;border-radius:9px;padding:5px 8px;font:inherit;font-size:12.5px;color:#1F4A85;background:#fff}'
    + '.vl-dir{border:1.5px solid #e2eaf5;background:#fff;color:#2a5ea9;border-radius:9px;width:32px;height:31px;cursor:pointer;font-size:13px;font-weight:800}'
    + '.vl-row{display:grid;grid-template-columns:128px minmax(230px,1.7fr) minmax(150px,1fr) minmax(140px,.9fr) minmax(170px,1.1fr) auto;grid-template-areas:"img id st loc bacs act";gap:16px;align-items:start;padding:16px 18px;border-bottom:1px solid #f0f4fa;cursor:pointer;transition:background .12s}'
    + '.vl-row:last-child{border-bottom:none}.vl-row:hover{background:#f9fbfe}'
    + '.vl-img{grid-area:img}.vl-id{grid-area:id;min-width:0}.vl-st{grid-area:st;min-width:0}.vl-loc{grid-area:loc;min-width:0}.vl-bacs{grid-area:bacs;min-width:0}.vl-act{grid-area:act;display:flex;flex-direction:column;gap:6px;align-items:center}'
    + '.vl-t{display:flex;align-items:center;gap:7px;font-size:15px;font-weight:800;color:#1F4A85;line-height:1.25}'
    + '.vl-v{font-size:12.5px;font-weight:600;color:#54678a;margin-top:2px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
    + '.vl-m{font-size:12px;color:#7a98c5;font-weight:600;margin-top:4px;line-height:1.45;overflow-wrap:anywhere;display:flex;align-items:center;flex-wrap:wrap;gap:4px}'
    + '.vl-m i{font-style:italic;color:#a8bcd4}'
    + '.vl-muet{color:#a8bcd4}'
    + '.vl-site{font-size:12px;font-weight:800;color:#2a5ea9;margin-top:5px;text-transform:uppercase;letter-spacing:.02em}'
    + '.vl-badge{display:inline-block;font-size:11.5px;font-weight:800;padding:3px 9px;border-radius:7px;background:#fdecec;color:#c0392b;white-space:nowrap}'
    + '.vl-badge.ok{background:#e4f5ef;color:#1d7a63}.vl-badge.mid{background:#fff4dd;color:#9a6b00}.vl-badge.cmd{background:#eef2fb;color:#4a63a0}'
    + '.vl-prix{font-size:17px;font-weight:800;color:#1F4A85;margin-top:7px;font-variant-numeric:tabular-nums}'
    + '.vl-pa{font-size:12px;font-weight:700;color:#9a6b00;margin-top:3px}'
    + '.vl-lbl{font-size:10.5px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:#9bb3d1;margin-bottom:4px}'
    + '.vl-lieu{font-size:13px;font-weight:800;color:#1F4A85;display:flex;align-items:center;gap:6px}'
    // vignette VN (pas de photo en VN : marque, modèle, teinte, énergie)
    + '.vn-vig{width:128px;height:86px;border-radius:11px;background:linear-gradient(135deg,#eef4fc,#dfe9f7);display:flex;flex-direction:column;justify-content:space-between;padding:9px 10px;box-sizing:border-box;overflow:hidden}'
    + '.vn-vig.cmd{background:linear-gradient(135deg,#f3f1fb,#e6e9f7)}'
    + '.vn-vig-m{font-size:10px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;color:#7a98c5}'
    + '.vn-vig-f{font-size:15px;font-weight:800;color:#1F4A85;line-height:1.1;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
    + '.vn-vig-b{display:flex;align-items:center;gap:6px;font-size:10.5px;font-weight:700;color:#54678a}'
    + '.vn-tt{display:inline-block;width:12px;height:12px;border-radius:50%;border:1.5px solid rgba(31,74,133,.18);flex:none;vertical-align:-2px;margin-right:4px}'
    + '.vn-vig-b .vn-tt{margin-right:0}'
    + '.vn-dot{width:9px;height:9px;border-radius:50%;flex:none}.vn-dot.green{background:#53bda7}.vn-dot.red{background:#e05a4f}'
    + '.vn-bdot{display:inline-block;width:8px;height:8px;border-radius:50%;background:#53bda7;flex:none}.vn-bdot.warn{background:#fac055}'
    + '.vl-warn{color:#9a6b00}.vn-warn{font-size:11.5px;font-weight:800;color:#9a6b00;background:#fff4dd;border-radius:6px;padding:1px 7px;margin-left:4px}'
    + '.vn-cmd{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12px;font-weight:700;color:#1F4A85;background:#eef3fa;border-radius:6px;padding:1px 7px;margin-right:4px}'
    + '.vn-mono{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:12.5px}'
    + '.vn-code{font-family:ui-monospace,Menlo,Consolas,monospace;font-size:11px;color:#7a98c5;background:#f2f6fc;border-radius:5px;padding:1px 5px;margin-left:4px}'
    + '.vn-iact{width:32px;height:32px;border-radius:9px;border:1.5px solid #e2eaf5;background:#fff;color:#2a5ea9;display:flex;align-items:center;justify-content:center;cursor:pointer;font:inherit;font-size:13px;font-weight:800;text-decoration:none}'
    + '.vn-iact:hover{border-color:#2a5ea9}.vn-iact.b{color:#1d7a63}'
    + '.vn-puce{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11.5px;font-weight:700;white-space:nowrap;margin-right:5px}'
    + '.vn-puce.ok{background:#e4f5ef;color:#1d7a63}.vn-puce.cmd{background:#eef2fb;color:#4a63a0}'
    + '.vn-puce.autre{background:#f5f0e8;color:#8a6a3d}.vn-puce.cm{background:#fdeeea;color:#b05a3c}'
    + '.vn-vide{padding:50px;text-align:center;color:#9bb3d1;font-size:14px;font-weight:600;background:#fff;border:1px solid #e8eef7;border-radius:11px;margin-top:12px}'
    + '.vn-err{color:#b05a3c}'
    + '.vn-spin{display:inline-block;width:15px;height:15px;border:2px solid #d6e2f2;border-top-color:#2a5ea9;border-radius:50%;animation:vnspin .8s linear infinite;vertical-align:-3px;margin-right:9px}'
    + '@keyframes vnspin{to{transform:rotate(360deg)}}'
    // fiche
    + '.vn-modal{position:fixed;inset:0;background:rgba(22,45,80,.44);display:flex;align-items:center;justify-content:center;padding:24px;z-index:900}'
    + '.vn-card{background:#fff;border-radius:18px;padding:30px 34px 26px;max-width:980px;width:100%;max-height:90vh;overflow:auto;position:relative;box-shadow:0 20px 60px rgba(22,45,80,.28);box-sizing:border-box}'
    + '.vn-x{position:absolute;top:18px;right:20px;border:none;background:#f2f6fc;color:#54678a;width:32px;height:32px;border-radius:50%;cursor:pointer;font-size:14px}'
    + '.vf-top{display:flex;gap:20px;align-items:center;padding-right:40px}'
    + '.vf-top .vn-vig{width:150px;height:100px;flex:none}'
    + '.vf-tt{min-width:0}'
    + '.vf-tt h2{margin:0;font-size:23px;font-weight:800;letter-spacing:-.01em}'
    + '.vn-card-sub{margin:3px 0 10px;color:#54678a;font-size:14px;font-weight:600}'
    + '.vf-puces{display:flex;align-items:center;flex-wrap:wrap;gap:6px}'
    + '.vf-bacs{display:inline-flex;align-items:center;gap:7px;font-size:12.5px;font-weight:800;color:#1d7a63;background:#e4f5ef;border-radius:20px;padding:4px 12px;text-decoration:none}'
    + '.vf-bacs:hover{background:#d3efe5}'
    + '.vf-chips{display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin:22px 0 18px}'
    + '.vf-chip{background:#f7faff;border:1px solid #e8eef7;border-radius:12px;padding:11px 14px;min-width:0}'
    + '.vf-chip-l{font-size:10.5px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:#9bb3d1;margin-bottom:4px}'
    + '.vf-chip-v{font-size:15px;font-weight:800;color:#1F4A85;overflow-wrap:anywhere}'
    + '.vf-chip-v i{font-style:italic;font-weight:600;color:#a8bcd4;font-size:13px}'
    + '.vf-tabs{display:flex;gap:4px;border-bottom:1.5px solid #eef3fa;margin-bottom:20px}'
    + '.vf-tab{border:none;background:none;font:inherit;font-size:14px;font-weight:700;color:#7a98c5;padding:9px 14px;cursor:pointer;border-bottom:2.5px solid transparent;margin-bottom:-1.5px}'
    + '.vf-tab.on{color:#1F4A85;border-bottom-color:#1F4A85}'
    + '.vf-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:22px 30px}'
    + '.vf-sec h3{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#8ba3c0;margin:0 0 8px;font-weight:800}'
    + '.vn-fl{display:flex;justify-content:space-between;align-items:baseline;gap:14px;padding:7px 0;border-bottom:1px solid #f4f7fc;font-size:13.5px}'
    + '.vn-fl:last-child{border-bottom:none}'
    + '.vn-fl span{color:#8ba3c0;flex:none}.vn-fl b{color:#2e4260;font-weight:700;text-align:right;font-variant-numeric:tabular-nums;overflow-wrap:anywhere}'
    + '.vn-fl b i{font-style:italic;color:#a8bcd4;font-weight:400}.vn-fl b .neg{color:#b05a3c}'
    + '.vf-big{font-size:16px;font-weight:800;color:#1F4A85}'
    + '.vf-note{background:#f7faff;border:1px dashed #d6e2f2;border-radius:12px;padding:12px 16px;font-size:13px;font-weight:600;color:#54678a;margin-bottom:18px}'
    + '.vf-wait{padding:40px;text-align:center;color:#7a98c5;font-weight:700;font-size:13.5px}'
    + '.vf-equip{margin-top:22px;padding-top:16px;border-top:1px solid #eef3fa}'
    + '.vf-equip h3{font-size:11px;text-transform:uppercase;letter-spacing:.06em;color:#8ba3c0;margin:0 0 6px;font-weight:800}'
    + '.vf-equip p{margin:0;font-size:12.5px;color:#54678a;line-height:1.55}'
    + '.vf-lu{margin-top:18px;font-size:11.5px;color:#a8bcd4;font-weight:600;text-align:right}'
    // responsive : comme la liste VO, 4 zones sous 1 180 px, une seule sous 640 px
    + '@media(max-width:1180px){.vl-row{grid-template-columns:128px minmax(0,1.6fr) minmax(0,1fr) auto;grid-template-areas:"img id st act" "img loc bacs act"}}'
    + '@media(max-width:820px){.vn-reperes{grid-template-columns:repeat(2,1fr)}.vn-sel{flex:1 1 140px;max-width:none}.vf-chips{grid-template-columns:repeat(2,1fr)}}'
    + '@media(max-width:640px){.vl-row{grid-template-columns:1fr auto;grid-template-areas:"img act" "id id" "st st" "loc loc" "bacs bacs";gap:10px;padding:14px}'
      + '.vn-vig{width:100%;max-width:220px}.vn-card{padding:22px 18px;border-radius:14px}.vn-modal{padding:10px}'
      + '.vf-top{flex-direction:column;align-items:flex-start;padding-right:30px}.vf-top .vn-vig{width:100%;max-width:220px}'
      + '.vl-pbar{justify-content:center}}';

  // ───────────────────────────────────────────────────────────── boot
  function suivreSite() {
    var api = siteApi(); if (!api) return;
    // Abonnements posés une fois, mais module remonté à chaque navigation : ils
    // appellent la fonction du montage COURANT (window.__vnSurSite). Avant v3, un
    // changement de site après navigation alimentait l'instance morte et la liste
    // restait sur l'ancien site (recette Team Colin 08/10/2026, même défaut que
    // vo-liste).
    window.__vnSurSite = function () { S.__perimetrePose = false; poserPerimetreParDefaut(); rendre(); };
    var relai = function () { if (window.__vnSurSite) window.__vnSurSite(); };
    if (api.onChange && !window.__vnSiteSub) {
      window.__vnSiteSub = api.onChange(relai);
    }
    if (!window.__vnSiteEvt) {
      try { doc.addEventListener('oropra-site-changed', relai); } catch (e) { }
      window.__vnSiteEvt = true;
    }
  }

  suivreSite();
  charger();
  }
});
