// ============================================================================
//  One Data — Stock VN  (vn-liste.js)
//
//  Rendu dans __anchor, sur la page /vn-liste.
//  Source : public.v_liste_vn (= gold.stock + gold.veh + SITE + contre-marque).
//
//  POURQUOI CE MODULE NE RESSEMBLE PAS A vo-liste
//    Un stock VN n'est pas un stock VO. Sur 11 592 vehicules, 9 445 sont
//    des COMMANDES constructeur : pas encore produites, souvent sans VIN,
//    sans prix d'achat tant que la facture fournisseur n'est pas arrivee.
//    Le stock physiquement disponible, lui, tient en 605 vehicules.
//
//    La page separe donc les deux : ce qu'on peut vendre aujourd'hui, et
//    ce qui arrive. C'est la question que se pose un vendeur VN, et ce
//    n'est pas celle du VO.
//
//    Pas de photos, pas d'affiches, pas de cotation : le VN n'en a pas.
//
//  Perimetre : chips RESEAU / AFFAIRE / SITE posees depuis le site
//              selectionne, toutes retirables — meme logique que le VO.
//  Role      : prix d'achat et marge visibles si ID_Role ∈ {1,2,3,6,7,8}.
// ============================================================================
OD.define('vn-liste', {
  async mount(__anchor, ctx) {
  __anchor.id = 'stockvn-root';

  var PA_ROLES = [1, 2, 3, 6, 7, 8];   // roles voyant le prix d'achat et la marge
  var PAR_PAGE = 25;

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

  // Les statuts arrivent en majuscules techniques : on les rend lisibles.
  var LIB_STATUT = {
    DISPONIBLE: 'Disponible', RESERVE: 'Réservé', COMMANDE_STOCK: 'Commande stock',
    COMMANDE_CLIENT: 'Commande client', COMMANDE_DEMO: 'Commande démo',
    DEMO: 'Démonstration', COURTOISIE: 'Courtoisie', ATTENTE_REPRISE: 'Attente de reprise',
    REPRISE_PROBABLE: 'Reprise probable', DEPOT_VENTE: 'Dépôt-vente'
  };
  function libStatut(s) { return LIB_STATUT[s] || (notEmpty(s) ? s : 'Sans statut'); }

  // ───────────────────────────────────────────────────────────── etat
  var S = {
    raw: [], loading: true, error: null,
    onglet: 'stock',        // stock | commandes | tous
    recherche: '', page: 1,
    tri: 'jours_de_stock', sens: 'desc',
    showPA: false, fiche: null,
    f: { reseau: null, affaire: null, site: null, marque: null, modele: null,
         energie: null, statut: null, lieu: null, reserve: null }
  };

  // ───────────────────────────────────────────────────────────── donnees
  async function charger() {
    S.loading = true; S.error = null; rendre();
    try {
      var tout = [], depuis = 0, taille = 1000;
      // Pagination explicite : PostgREST plafonne les reponses, et 11 592
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
        var foin = [r.vin, r.immatriculation, r.marque, r.modele, r.version,
                    r.commande_fournisseur, r.identite_dms, r.couleur]
          .filter(Boolean).join(' ').toLowerCase();
        if (foin.indexOf(q) < 0) return false;
      }
      return true;
    });
  }

  function triees(l) {
    var k = S.tri, sens = S.sens === 'asc' ? 1 : -1;
    return l.slice().sort(function (a, b) {
      var x = a[k], y = b[k];
      if (x == null && y == null) return 0;
      if (x == null) return 1;            // les valeurs absentes toujours en bas
      if (y == null) return -1;
      if (typeof x === 'number' || typeof y === 'number') return (Number(x) - Number(y)) * sens;
      return String(x).localeCompare(String(y), 'fr') * sens;
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
    if (!doc.getElementById('od-css-vn')) {
      var st = doc.createElement('style'); st.id = 'od-css-vn'; st.textContent = CSS;
      doc.head.appendChild(st);
    }
    if (S.loading) { el.innerHTML = coque('<div class="vn-vide">Chargement du stock…</div>'); return; }
    if (S.error) { el.innerHTML = coque('<div class="vn-vide vn-err">' + esc(S.error) + '</div>'); return; }

    var l = triees(filtrees());
    var pages = Math.max(1, Math.ceil(l.length / PAR_PAGE));
    if (S.page > pages) S.page = pages;
    var page = l.slice((S.page - 1) * PAR_PAGE, S.page * PAR_PAGE);

    el.innerHTML = coque(entete() + reperes(l) + filtres() + tableau(page, l.length, pages))
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
    var h = '<div class="vn-filtres">'
      + '<input class="vn-rech" id="vn-q" placeholder="VIN, immatriculation, modèle, commande…" value="' + esc(S.recherche) + '">'
      + sel('reseau', 'Réseau') + sel('affaire', 'Affaire') + sel('site', 'Site')
      + sel('marque', 'Marque') + sel('modele', 'Modèle') + sel('energie', 'Énergie')
      + selStatut() + sel('lieu', 'Lieu de stockage', 'lieu_stockage')
      + '<button class="vn-raz" id="vn-raz">Tout effacer</button>'
      + '</div>';
    return h;
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

  var COLS = [
    { k: 'marque', t: 'Véhicule', cl: 'c-veh' },
    { k: 'statut', t: 'Statut', cl: 'c-st' },
    { k: 'site', t: 'Site', cl: 'c-site' },
    { k: 'date_entree_stock', t: 'Entrée', cl: 'c-d' },
    { k: 'jours_de_stock', t: 'Jours', cl: 'c-n' },
    { k: 'tarif_catalogue', t: 'Tarif', cl: 'c-n' },
    { k: 'prix_vente_ttc', t: 'Prix TTC', cl: 'c-n' },
    { k: 'prix_achat_ht', t: 'Achat HT', cl: 'c-n c-pa' },
    { k: 'marge_ht', t: 'Marge', cl: 'c-n c-pa' }
  ];

  function tableau(page, total, pages) {
    if (!total) return '<div class="vn-vide">Aucun véhicule ne correspond à ces critères.</div>';
    var cols = COLS.filter(function (c) { return S.showPA || c.cl.indexOf('c-pa') < 0; });
    var h = '<table class="vn-tab"><thead><tr>'
      + cols.map(function (c) {
          var actif = S.tri === c.k;
          return '<th class="' + c.cl + (actif ? ' tri' : '') + '" data-tri="' + c.k + '">'
            + esc(c.t) + (actif ? '<i>' + (S.sens === 'asc' ? '▲' : '▼') + '</i>' : '') + '</th>';
        }).join('')
      + '</tr></thead><tbody>';

    page.forEach(function (r) {
      h += '<tr data-id="' + esc(r.identite_dms) + '">'
        + '<td class="c-veh"><span class="vn-mod">' + jolieValeur([r.marque, r.modele].filter(Boolean).join(' ')) + '</span>'
          + '<span class="vn-ver">' + jolieValeur(r.version) + '</span>'
          + '<span class="vn-sub">' + (notEmpty(r.vin) ? esc(r.vin) : '<i>VIN non attribué</i>')
          + (notEmpty(r.couleur) ? ' · ' + esc(r.couleur) : '') + '</span></td>'
        + '<td class="c-st">' + puce(r) + '</td>'
        + '<td class="c-site">' + jolieValeur(r.site)
          + (notEmpty(r.lieu_stockage) ? '<span class="vn-sub">' + esc(r.lieu_stockage) + '</span>' : '') + '</td>'
        + '<td class="c-d">' + dateFR(r.date_entree_stock) + '</td>'
        + '<td class="c-n">' + (r.jours_de_stock == null ? '—' : ent(r.jours_de_stock)) + '</td>'
        + '<td class="c-n">' + eur(r.tarif_catalogue) + '</td>'
        + '<td class="c-n">' + eur(r.prix_vente_ttc) + '</td>'
        + (S.showPA ? '<td class="c-n">' + eur(r.prix_achat_ht) + '</td>'
                    + '<td class="c-n' + (num(r.marge_ht) < 0 ? ' neg' : '') + '">' + eur(r.marge_ht) + '</td>' : '')
        + '</tr>';
    });

    h += '</tbody></table>';
    if (pages > 1) {
      h += '<div class="vn-pag"><button id="vn-prec"' + (S.page <= 1 ? ' disabled' : '') + '>Précédent</button>'
        + '<span>' + S.page + ' / ' + pages + ' · ' + ent(total) + ' véhicules</span>'
        + '<button id="vn-suiv"' + (S.page >= pages ? ' disabled' : '') + '>Suivant</button></div>';
    } else {
      h += '<div class="vn-pag"><span>' + ent(total) + ' véhicule' + (total > 1 ? 's' : '') + '</span></div>';
    }
    return h;
  }

  function puce(r) {
    var cl = r.disponible ? 'ok' : (r.en_commande ? 'cmd' : 'autre');
    return '<span class="vn-puce ' + cl + '">' + esc(libStatut(r.statut)) + '</span>'
      + (r.reserve ? '<span class="vn-puce cm">réservé</span>' : '');
  }

  // ───────────────────────────────────────────────────────────── fiche
  function fiche(r) {
    function ligne(l, v) { return '<div class="vn-fl"><span>' + esc(l) + '</span><b>' + v + '</b></div>'; }
    return '<div class="vn-modal" id="vn-modal"><div class="vn-card">'
      + '<button class="vn-x" id="vn-close">✕</button>'
      + '<h2>' + jolieValeur([r.marque, r.modele].filter(Boolean).join(' ')) + '</h2>'
      + '<p class="vn-card-sub">' + jolieValeur(r.version) + '</p>'
      + '<div class="vn-card-puces">' + puce(r) + '</div>'
      + '<div class="vn-fgrid">'
        + '<div><h3>Identité</h3>'
          + ligne('VIN', notEmpty(r.vin) ? esc(r.vin) : '<i>non attribué</i>')
          + ligne('Immatriculation', jolieValeur(r.immatriculation))
          + ligne('N° véhicule', jolieValeur(r.identite_dms))
          + ligne('Millésime', jolieValeur(r.millesime))
          + ligne('Couleur', jolieValeur(r.couleur))
          + ligne('Énergie', jolieValeur(r.energie))
          + ligne('Boîte', jolieValeur(r.boite))
          + ligne('Gamme', jolieValeur(r.gamme))
        + '</div>'
        + '<div><h3>Stock</h3>'
          + ligne('Site', jolieValeur(r.site))
          + ligne('Lieu de stockage', jolieValeur(r.lieu_stockage))
          + ligne('Entrée en stock', dateFR(r.date_entree_stock))
          + ligne('Ancienneté', r.jours_de_stock == null ? '—' : ent(r.jours_de_stock) + ' jours')
          + ligne('Mise en circulation', dateFR(r.date_mise_en_circulation))
          + ligne('Kilométrage', r.kilometrage == null ? '—' : ent(r.kilometrage) + ' km')
        + '</div>'
        + '<div><h3>Prix</h3>'
          + ligne('Tarif catalogue', eur(r.tarif_catalogue))
          + ligne('Options', eur(r.montant_options))
          + ligne('Prix de vente HT', eur(r.prix_vente_ht))
          + ligne('Prix de vente TTC', eur(r.prix_vente_ttc))
          + (S.showPA ? ligne('Prix d\'achat HT', eur(r.prix_achat_ht)) : '')
          + (S.showPA ? ligne('Marge', eur(r.marge_ht)) : '')
        + '</div>'
        + '<div><h3>Approvisionnement</h3>'
          + ligne('Fournisseur', jolieValeur(r.fournisseur))
          + ligne('Commande', jolieValeur(r.commande_fournisseur))
          + ligne('Facture fournisseur', dateFR(r.date_facture_fournisseur))
          + ligne('Stock payé', r.stock_paye == null ? '—' : (r.stock_paye ? 'Oui' : 'Non'))
          + ligne('Financement', jolieValeur(r.type_financement))
        + '</div>'
      + '</div>'
      + (notEmpty(r.equipements)
          ? '<div class="vn-equip"><h3>Équipements</h3><p>' + esc(r.equipements) + '</p></div>' : '')
      + '</div></div>';
  }

  // ───────────────────────────────────────────────────────────── evenements
  function brancher() {
    var el = root(); if (!el) return;
    el.querySelectorAll('[data-ong]').forEach(function (b) {
      b.onclick = function () { S.onglet = b.dataset.ong; S.page = 1; rendre(); };
    });
    el.querySelectorAll('[data-f]').forEach(function (s) {
      s.onchange = function () { S.f[s.dataset.f] = s.value || null; S.page = 1; rendre(); };
    });
    el.querySelectorAll('[data-tri]').forEach(function (th) {
      th.onclick = function () {
        var k = th.dataset.tri;
        if (S.tri === k) S.sens = (S.sens === 'asc' ? 'desc' : 'asc');
        else { S.tri = k; S.sens = 'desc'; }
        rendre();
      };
    });
    el.querySelectorAll('tbody tr[data-id]').forEach(function (tr) {
      tr.onclick = function () {
        var r = S.raw.find(function (x) { return String(x.identite_dms) === tr.dataset.id; });
        if (r) { S.fiche = r; rendre(); }
      };
    });
    var q = el.querySelector('#vn-q');
    if (q) {
      q.oninput = function () {
        clearTimeout(S.__t);
        // Le filtrage porte sur 11 592 lignes en memoire : on attend la fin
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
    var p = el.querySelector('#vn-prec'); if (p) p.onclick = function () { if (S.page > 1) { S.page--; rendre(); } };
    var n = el.querySelector('#vn-suiv'); if (n) n.onclick = function () { S.page++; rendre(); };
    var x = el.querySelector('#vn-close'); if (x) x.onclick = function () { S.fiche = null; rendre(); };
    var m = el.querySelector('#vn-modal');
    if (m) m.onclick = function (e) { if (e.target === m) { S.fiche = null; rendre(); } };
  }

  // ───────────────────────────────────────────────────────────── styles
  var CSS = ''
    + '#stockvn-root{font-family:"Nunito Sans",Inter,system-ui,sans-serif;color:#1F4A85}'
    + '.vn-wrap{max-width:1200px;margin:0 auto;padding:4px 0 40px}'
    + '.vn-head{display:flex;justify-content:space-between;align-items:flex-end;gap:16px;flex-wrap:wrap;margin-bottom:18px}'
    + '.vn-head h1{font-size:23px;font-weight:800;margin:0 0 3px;letter-spacing:-.02em}'
    + '.vn-head p{margin:0;font-size:13.5px;color:#9bb3d1}'
    + '.vn-onglets{display:flex;gap:6px}'
    + '.vn-ong{border:1px solid #e2eaf5;background:#fff;color:#54678a;border-radius:9px;padding:7px 14px;font:inherit;font-size:13.5px;font-weight:600;cursor:pointer;display:flex;align-items:center;gap:7px}'
    + '.vn-ong span{background:#f2f6fc;color:#54678a;border-radius:20px;padding:1px 8px;font-size:11.5px;font-variant-numeric:tabular-nums}'
    + '.vn-ong.on{background:#1F4A85;border-color:#1F4A85;color:#fff}'
    + '.vn-ong.on span{background:rgba(255,255,255,.18);color:#fff}'
    + '.vn-reperes{display:grid;grid-template-columns:repeat(4,1fr);gap:1px;background:#e8eef7;border:1px solid #e8eef7;border-radius:11px;overflow:hidden;margin-bottom:16px}'
    + '.vn-rep{background:#fff;padding:13px 16px}'
    + '.vn-rep-l{font-size:11.5px;color:#8ba3c0;font-weight:600;margin-bottom:5px}'
    + '.vn-rep-v{font-size:22px;font-weight:800;line-height:1.1;font-variant-numeric:tabular-nums}'
    + '.vn-rep-n{font-size:11.5px;color:#a8bcd4;margin-top:3px}'
    + '.vn-filtres{display:flex;flex-wrap:wrap;gap:7px;margin-bottom:14px;align-items:center}'
    + '.vn-rech{flex:1 1 260px;min-width:220px;border:1px solid #e2eaf5;border-radius:9px;padding:8px 12px;font:inherit;font-size:13.5px;background:#fff;color:#1F4A85}'
    + '.vn-sel{border:1px solid #e2eaf5;border-radius:9px;padding:8px 10px;font:inherit;font-size:13px;background:#fff;color:#1F4A85;max-width:180px}'
    + '.vn-raz{border:none;background:none;color:#2a5ea9;font:inherit;font-size:13px;font-weight:600;cursor:pointer;padding:8px 6px}'
    + '.vn-tab{width:100%;border-collapse:collapse;font-size:13px;background:#fff;border:1px solid #e8eef7;border-radius:11px;overflow:hidden}'
    + '.vn-tab th{text-align:left;padding:10px 12px;font-size:11.5px;font-weight:600;color:#54678a;background:#f8fafd;border-bottom:1px solid #e8eef7;cursor:pointer;white-space:nowrap;user-select:none}'
    + '.vn-tab th:hover{color:#2a5ea9}.vn-tab th.tri{color:#1F4A85}'
    + '.vn-tab th i{font-style:normal;font-size:9px;margin-left:4px}'
    + '.vn-tab td{padding:9px 12px;border-bottom:1px solid #f2f6fb;vertical-align:top}'
    + '.vn-tab tbody tr{cursor:pointer}.vn-tab tbody tr:hover td{background:#f9fbfe}'
    + '.vn-tab .c-n{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums;color:#2e4260}'
    + '.vn-tab .c-n.neg{color:#b05a3c}'
    + '.vn-tab .c-d{white-space:nowrap;color:#54678a;font-variant-numeric:tabular-nums}'
    + '.vn-tab .c-veh{min-width:260px}.vn-tab .c-site{min-width:130px}'
    + '.vn-mod{display:block;font-weight:700;color:#1F4A85}'
    + '.vn-ver{display:block;font-size:12px;color:#54678a;margin-top:1px}'
    + '.vn-sub{display:block;font-size:11px;color:#a8bcd4;margin-top:2px;font-variant-numeric:tabular-nums}'
    + '.vn-sub i{font-style:italic}'
    + '.vn-puce{display:inline-block;padding:2px 9px;border-radius:20px;font-size:11px;font-weight:700;white-space:nowrap;margin-right:4px}'
    + '.vn-puce.ok{background:#e4f5ef;color:#1d7a63}'
    + '.vn-puce.cmd{background:#eef2fb;color:#4a63a0}'
    + '.vn-puce.autre{background:#f5f0e8;color:#8a6a3d}'
    + '.vn-puce.cm{background:#fdeeea;color:#b05a3c}'
    + '.vn-pag{display:flex;align-items:center;justify-content:center;gap:14px;margin-top:14px;font-size:13px;color:#54678a}'
    + '.vn-pag button{border:1px solid #e2eaf5;background:#fff;border-radius:8px;padding:7px 14px;font:inherit;font-size:13px;color:#1F4A85;cursor:pointer}'
    + '.vn-pag button:disabled{opacity:.4;cursor:default}'
    + '.vn-vide{padding:50px;text-align:center;color:#9bb3d1;font-size:14px;font-weight:600;background:#fff;border:1px solid #e8eef7;border-radius:11px}'
    + '.vn-err{color:#b05a3c}'
    + '.vn-modal{position:fixed;inset:0;background:rgba(22,45,80,.44);display:flex;align-items:center;justify-content:center;padding:24px;z-index:900}'
    + '.vn-card{background:#fff;border-radius:16px;padding:26px 30px;max-width:900px;width:100%;max-height:88vh;overflow:auto;position:relative;box-shadow:0 20px 60px rgba(22,45,80,.28)}'
    + '.vn-card h2{margin:0;font-size:21px;font-weight:800}'
    + '.vn-card-sub{margin:2px 0 10px;color:#9bb3d1;font-size:13.5px}'
    + '.vn-card-puces{margin-bottom:18px}'
    + '.vn-x{position:absolute;top:16px;right:18px;border:none;background:#f2f6fc;color:#54678a;width:30px;height:30px;border-radius:50%;cursor:pointer;font-size:14px}'
    + '.vn-fgrid{display:grid;grid-template-columns:repeat(auto-fit,minmax(215px,1fr));gap:22px}'
    + '.vn-fgrid h3{font-size:11.5px;text-transform:uppercase;letter-spacing:.05em;color:#8ba3c0;margin:0 0 8px;font-weight:700}'
    + '.vn-fl{display:flex;justify-content:space-between;gap:12px;padding:5px 0;border-bottom:1px solid #f4f7fc;font-size:13px}'
    + '.vn-fl span{color:#8ba3c0}.vn-fl b{color:#2e4260;font-weight:600;text-align:right;font-variant-numeric:tabular-nums}'
    + '.vn-fl b i{font-style:italic;color:#a8bcd4;font-weight:400}'
    + '.vn-equip{margin-top:22px;padding-top:16px;border-top:1px solid #eef3fa}'
    + '.vn-equip h3{font-size:11.5px;text-transform:uppercase;letter-spacing:.05em;color:#8ba3c0;margin:0 0 6px;font-weight:700}'
    + '.vn-equip p{margin:0;font-size:12.5px;color:#54678a;line-height:1.5}'
    + '@media(max-width:820px){.vn-reperes{grid-template-columns:repeat(2,1fr)}'
      + '.vn-tab .c-site,.vn-tab .c-d{display:none}.vn-sel{flex:1 1 140px;max-width:none}}';

  // ───────────────────────────────────────────────────────────── boot
  function suivreSite() {
    var api = siteApi(); if (!api) return;
    if (api.onChange && !window.__vnSiteSub) {
      window.__vnSiteSub = api.onChange(function () { S.__perimetrePose = false; poserPerimetreParDefaut(); rendre(); });
    }
    if (!window.__vnSiteEvt) {
      try {
        doc.addEventListener('oropra-site-changed', function () {
          S.__perimetrePose = false; poserPerimetreParDefaut(); rendre();
        });
      } catch (e) { }
      window.__vnSiteEvt = true;
    }
  }

  suivreSite();
  charger();
  }
});
