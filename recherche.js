// ============================================================================
//  RECHERCHE GLOBALE (top nav) — module One Data (OD.define)  v1
//
//  v1 (02/11/2026) : champ de recherche au centre de la barre client/site de
//  la top nav, résultats en listes catégorisées.
//
//  CE QU'ON CHERCHE (une seule RPC, recherche_globale, sur l'index od_recherche)
//    Clients            nom/prénom dans n'importe quel ordre, sans accent,
//                       téléphone (9 chiffres, avec ou sans espaces/+33),
//                       e-mail, SIRET/SIREN
//    Véhicules clients  immatriculation (avec ou sans tirets), VIN complet
//                       ou ses 6/8 derniers caractères
//    Stock VO / VN      immat, VIN, marque/modèle/version, n° VO, n° de
//                       commande — bornés au périmètre de l'utilisateur
//    Affaires           référence (OPP-…, S-…) ou un de ses segments,
//                       n° de commande constructeur — bornées au périmètre
//    Collaborateurs     nom, e-mail, téléphone
//  Si rien n'est trouvé exactement, la base tente une recherche APPROCHÉE
//  (fautes de frappe : « peujeot », « renolt clio ») et le panneau le dit.
//
//  OÙ MÈNE UN CLIC
//    Client, véhicule client, affaire -> fiche client (cycle de CONSULTATION
//      ouvert sur le site courant, comme la Base client : jamais « Ouvert »,
//      pour ne pas créer de tâche au vendeur)
//    VO -> liste VO filtrée sur le VIN, fiche du véhicule ouverte
//    VN -> liste VN, onglet « Tous », filtrée sur le VIN, fiche ouverte si
//          un seul résultat
//    Collaborateur -> annuaire filtré sur son nom
//    Pour VO/VN, si le véhicule est sur un autre site du périmètre, le
//    sélecteur de site y bascule d'abord (la liste VO suit le site courant).
//
//  CLAVIER : Ctrl+K (⌘K sur Mac) ou « / » donne le focus ; ↑ ↓ parcourent
//  toutes les catégories ; Entrée ouvre ; Échap ferme.
//  Au focus d'un champ vide : les 6 derniers résultats ouverts (par
//  utilisateur, sur ce navigateur).
//
//  Ancre posée par la top nav (v41) : <div id="od-recherche"
//  data-od-module="recherche">. Le module se déclare PERSISTANT (comme
//  client-history) : la top nav ne bouge pas, inutile de le re-monter à
//  chaque navigation.
// ============================================================================
try { if (window.OD && OD.persistent && OD.persistent.add) OD.persistent.add('recherche'); } catch (e) { }

OD.define('recherche', {
  mount(__anchor, ctx) {
    const VER = 1;
    const W = (window.wwLib && wwLib.getFrontWindow && wwLib.getFrontWindow()) || window;
    const doc = __anchor.ownerDocument || document;
    const sb = (ctx && ctx.supabase) || (window.wwLib && wwLib.wwPlugins && wwLib.wwPlugins.supabase && wwLib.wwPlugins.supabase.instance);

    // --------------------------------------------------------------- constantes
    const LANG_PREFIX = '/fr';
    const PAGE_UID = {
      '/fiche-client': '259f1951-a2d4-4b90-ac83-0b3febe1d4ec',
      '/vo-liste':     '188b0f0b-5e80-4a77-a856-26469b08b614',
      '/vn-liste':     '08106b65-19e5-4e36-bdbb-2b12f67a2b6c',
      '/annuaire':     'a6c1a683-2490-4263-8dc5-5e187bcbec87'
    };
    const VAR_CLIENT = '55490583-c88b-4748-916e-4d203db07742';
    const LIMITE = 5;
    const DEBOUNCE = 180;

    const CATS = [
      { k: 'clients',        lib: 'Clients',           ic: 'person' },
      { k: 'vehicules',      lib: 'Véhicules clients', ic: 'key' },
      { k: 'vo',             lib: 'Stock VO',          ic: 'car' },
      { k: 'vn',             lib: 'Stock VN',          ic: 'carNew' },
      { k: 'affaires',       lib: 'Affaires',          ic: 'doc' },
      { k: 'collaborateurs', lib: 'Collaborateurs',    ic: 'team' }
    ];
    const TYPE_DE_CAT = { clients: 'client', vehicules: 'vehicule', vo: 'vo', vn: 'vn', affaires: 'affaire', collaborateurs: 'collaborateur' };

    const I = {
      search: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7"/><path d="m20 20-3.5-3.5"/></svg>',
      close:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6 6 18"/></svg>',
      person: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
      key:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="4.5"/><path d="m10.7 12.3 9.3-9.3M16 7l3 3M14 9l2 2"/></svg>',
      car:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 17h14v-5l-2-5H7l-2 5z"/><path d="M3 12h18"/><circle cx="7.5" cy="17.5" r="1.8"/><circle cx="16.5" cy="17.5" r="1.8"/></svg>',
      carNew: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 18h13v-5l-2-4H6l-2 4z"/><path d="M2.5 13h16"/><circle cx="7" cy="18.3" r="1.6"/><circle cx="14" cy="18.3" r="1.6"/><path d="M20 3v4M18 5h4"/></svg>',
      doc:    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/></svg>',
      team:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20a6.5 6.5 0 0 1 13 0"/><path d="M16 4.6a3.5 3.5 0 0 1 0 6.8M18.5 14.5a6.5 6.5 0 0 1 3 5.5"/></svg>',
      clock:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>',
      wand:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m4 20 11-11M14 4v2M19 9h2M17.5 5.5 19 4M13 9l2 2"/></svg>'
    };

    // ------------------------------------------------------------------ état
    // Global (et non local au montage) : un re-montage ne perd ni la saisie ni
    // les résultats.
    const S = W.__odRech || (W.__odRech = {
      q: '', ouvert: false, charge: false, erreur: null, res: null, approche: false,
      sel: -1, seq: 0, timer: null
    });

    // ---------------------------------------------------------------- helpers
    function esc(s) { return s == null ? '' : String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    function user() { try { return W.oropraUser || window.oropraUser || {}; } catch (e) { return {}; } }
    function userId() { const u = user(); return u.ID_User != null ? Number(u.ID_User) : null; }
    function inEditor() { try { return window.self !== window.top; } catch (e) { return true; } }
    function siteApi() { return W.oropraSite || window.oropraSite || null; }
    function euros(v) { const n = Number(v); return isFinite(n) && n > 0 ? n.toLocaleString('fr-FR', { maximumFractionDigits: 0 }) + ' €' : ''; }
    function sansAccent(c) { return c.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase(); }
    function estMac() { try { return /Mac|iPhone|iPad/.test(navigator.platform || navigator.userAgent); } catch (e) { return false; } }

    // Surligne les mots tapés dans un libellé, sans tenir compte des accents
    // ni de la casse, en conservant le texte d'origine.
    function surligne(txt, q) {
      if (!txt) return '';
      const mots = sansAccent(q || '').split(/\s+/).filter(function (m) { return m.length >= 2; });
      if (!mots.length) return esc(txt);
      const src = String(txt);
      let norm = '', carte = [];
      for (let i = 0; i < src.length; i++) { const n = sansAccent(src[i]); for (let j = 0; j < n.length; j++) { norm += n[j]; carte.push(i); } }
      const marque = new Array(src.length).fill(false);
      mots.forEach(function (m) {
        let p = norm.indexOf(m);
        while (p !== -1) { for (let k = p; k < p + m.length; k++) marque[carte[k]] = true; p = norm.indexOf(m, p + m.length); }
      });
      let out = '', dedans = false;
      for (let i = 0; i < src.length; i++) {
        if (marque[i] && !dedans) { out += '<mark>'; dedans = true; }
        if (!marque[i] && dedans) { out += '</mark>'; dedans = false; }
        out += esc(src[i]);
      }
      return out + (dedans ? '</mark>' : '');
    }

    // -------------------------------------------------------------- récents
    function cleRecents() { return 'od_recherche_recents_' + (userId() || 'x'); }
    function lireRecents() { try { return JSON.parse(W.localStorage.getItem(cleRecents()) || '[]') || []; } catch (e) { return []; } }
    function noterRecent(type, it) {
      try {
        const l = lireRecents().filter(function (r) { return !(r.type === type && r.it && r.it.cle === it.cle); });
        l.unshift({ type: type, it: it });
        W.localStorage.setItem(cleRecents(), JSON.stringify(l.slice(0, 6)));
      } catch (e) { }
    }

    // ---------------------------------------------------------------- CSS
    const CSS = `
#od-recherche{position:relative;width:100%;max-width:520px;font-family:"Nunito Sans",system-ui,sans-serif}
#od-recherche *{box-sizing:border-box}
#od-recherche .rch-champ{display:flex;align-items:center;gap:8px;height:36px;padding:0 10px 0 11px;background:#fff;border:1px solid #d6e2f2;border-radius:10px;transition:border-color .15s,box-shadow .15s}
#od-recherche .rch-champ:hover{border-color:#acc5e4}
#od-recherche.rch-on .rch-champ{border-color:#2a5ea9;box-shadow:0 0 0 3px rgba(42,94,169,.12)}
#od-recherche .rch-champ>svg{width:16px;height:16px;color:#7a98c5;flex:0 0 auto}
#od-recherche input{flex:1 1 auto;min-width:0;border:none;outline:none;background:transparent;font:inherit;font-size:13.5px;font-weight:600;color:#1F4A85;padding:0}
#od-recherche input::placeholder{color:#9bb3d1;font-weight:500}
#od-recherche input::-webkit-search-cancel-button{display:none}
#od-recherche .rch-kbd{flex:0 0 auto;font-size:10.5px;font-weight:700;color:#7a98c5;background:#f2f6fc;border:1px solid #e3edf9;border-radius:6px;padding:2px 6px;line-height:1.3}
#od-recherche .rch-x{flex:0 0 auto;display:none;border:none;background:none;cursor:pointer;color:#7a98c5;padding:3px;border-radius:6px}
#od-recherche .rch-x:hover{background:#f2f6fc;color:#2a5ea9}
#od-recherche .rch-x svg{width:14px;height:14px;display:block}
#od-recherche.rch-plein .rch-x{display:block}
#od-recherche.rch-plein .rch-kbd{display:none}
#od-recherche .rch-spin{flex:0 0 auto;width:14px;height:14px;border:2px solid #e3edf9;border-top-color:#53bda7;border-radius:50%;animation:rch-tourne .7s linear infinite;display:none}
#od-recherche.rch-charge .rch-spin{display:block}
@keyframes rch-tourne{to{transform:rotate(360deg)}}
#od-recherche .rch-panneau{position:absolute;top:calc(100% + 8px);left:50%;transform:translateX(-50%);width:min(640px,calc(100vw - 24px));max-height:min(72vh,620px);overflow-y:auto;background:#fff;border:1px solid #e8eef7;border-radius:14px;box-shadow:0 18px 44px rgba(31,74,133,.18);z-index:900;padding:6px;display:none;overscroll-behavior:contain}
#od-recherche.rch-on .rch-panneau.rch-a-contenu{display:block}
#od-recherche .rch-info{display:flex;align-items:center;gap:8px;margin:4px 6px 6px;padding:8px 11px;border-radius:9px;background:#fff8ea;color:#8a5d08;font-size:12.5px;font-weight:600}
#od-recherche .rch-info svg{width:15px;height:15px;flex:0 0 auto;color:#d2941f}
#od-recherche .rch-cat{padding:4px 0 2px}
#od-recherche .rch-cat+.rch-cat{border-top:1px solid #f0f4fa;margin-top:2px;padding-top:6px}
#od-recherche .rch-cat-h{display:flex;align-items:center;gap:7px;padding:4px 10px 5px;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#7a98c5}
#od-recherche .rch-cat-h svg{width:14px;height:14px;color:#53bda7}
#od-recherche .rch-cat-h em{font-style:normal;font-weight:700;letter-spacing:0;text-transform:none;color:#acc5e4;margin-left:2px}
#od-recherche .rch-it{display:flex;align-items:center;gap:11px;padding:8px 10px;border-radius:10px;cursor:pointer;color:#1F4A85;text-decoration:none}
#od-recherche .rch-it.rch-sel,#od-recherche .rch-it:hover{background:#f2f6fc}
#od-recherche .rch-it.rch-sel{box-shadow:inset 3px 0 0 #2a5ea9}
#od-recherche .rch-vis{flex:0 0 36px;width:36px;height:36px;border-radius:9px;background:#eef4fc;color:#2a5ea9;display:flex;align-items:center;justify-content:center;overflow:hidden}
#od-recherche .rch-vis svg{width:18px;height:18px}
#od-recherche .rch-vis img{width:100%;height:100%;object-fit:cover;display:block}
#od-recherche .rch-vis.rch-ini{font-size:12.5px;font-weight:800;letter-spacing:.02em}
#od-recherche .rch-corps{flex:1 1 auto;min-width:0}
#od-recherche .rch-t{display:flex;align-items:center;gap:6px;font-size:14px;font-weight:700;color:#1F4A85;line-height:1.3}
#od-recherche .rch-t>span{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#od-recherche .rch-d{font-size:12px;color:#7a98c5;line-height:1.35;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:1px}
#od-recherche mark{background:#dff3ee;color:#1F4A85;border-radius:3px;padding:0 1px}
#od-recherche .rch-b{flex:0 0 auto;font-style:normal;font-size:10.5px;font-weight:700;padding:2px 7px;border-radius:20px;line-height:1.4;white-space:nowrap}
#od-recherche .rch-b-v{background:#e5f6f2;color:#2f8d78}
#od-recherche .rch-b-o{background:#fdf3df;color:#a06b0a}
#od-recherche .rch-b-r{background:#fcebeb;color:#c23d3c}
#od-recherche .rch-b-b{background:#eaf1fb;color:#2a5ea9}
#od-recherche .rch-b-g{background:#f1f4f9;color:#7a98c5}
#od-recherche .rch-droite{flex:0 0 auto;text-align:right;font-size:13px;font-weight:800;color:#53bda7;white-space:nowrap}
#od-recherche .rch-droite small{display:block;font-size:11px;font-weight:600;color:#9bb3d1}
#od-recherche .rch-plus{padding:3px 10px 6px 57px;font-size:11.5px;color:#9bb3d1}
#od-recherche .rch-plus a{color:#2a5ea9;font-weight:700;cursor:pointer;text-decoration:none}
#od-recherche .rch-plus a:hover{text-decoration:underline}
#od-recherche .rch-vide{padding:26px 16px 22px;text-align:center;color:#7a98c5;font-size:13.5px}
#od-recherche .rch-vide b{color:#1F4A85}
#od-recherche .rch-vide small{display:block;margin-top:6px;color:#9bb3d1;font-size:12px}
#od-recherche .rch-pied{display:flex;gap:14px;justify-content:center;padding:8px 10px 4px;margin-top:4px;border-top:1px solid #f0f4fa;font-size:11px;color:#9bb3d1}
#od-recherche .rch-pied b{font-weight:700;color:#7a98c5}
@media (max-width:760px){
  #od-recherche{max-width:none}
  #od-recherche .rch-kbd{display:none}
  #od-recherche .rch-pied{display:none}
  #od-recherche .rch-panneau{position:fixed;left:12px;right:12px;width:auto;transform:none;top:auto;max-height:70vh}
  #od-recherche input{font-size:16px}
}
.od-rech-toast{position:fixed;left:50%;bottom:24px;transform:translateX(-50%);z-index:1200;background:#2a5ea9;color:#fff;font-family:"Nunito Sans",system-ui,sans-serif;font-size:13px;font-weight:600;padding:10px 16px;border-radius:10px;box-shadow:0 10px 28px rgba(31,74,133,.3);max-width:calc(100vw - 32px)}
`;

    // ---------------------------------------------------------------- rendu
    function racine() { return __anchor.querySelector('.rch-champ') ? __anchor : null; }

    function construire() {
      __anchor.id = 'od-recherche';
      __anchor.innerHTML =
        '<style>' + CSS + '</style>' +
        '<div class="rch-champ">' + I.search +
          '<input type="search" autocomplete="off" spellcheck="false" enterkeyhint="search" aria-label="Rechercher"' +
          ' placeholder="Client, immat, VIN, téléphone, affaire…" value="' + esc(S.q) + '">' +
          '<span class="rch-spin" aria-hidden="true"></span>' +
          '<button type="button" class="rch-x" title="Effacer" aria-label="Effacer">' + I.close + '</button>' +
          '<span class="rch-kbd">' + (estMac() ? '⌘K' : 'Ctrl K') + '</span>' +
        '</div>' +
        '<div class="rch-panneau" role="listbox"></div>';
      __anchor.setAttribute('data-rch-ver', String(VER));
      brancher();
      peindre();
    }

    function etat() {
      const r = racine(); if (!r) return;
      r.classList.toggle('rch-on', !!S.ouvert);
      r.classList.toggle('rch-plein', !!S.q);
      r.classList.toggle('rch-charge', !!S.charge);
    }

    // Liste à plat des éléments navigables au clavier, dans l'ordre affiché.
    function aplat() {
      const l = [];
      if (!S.q || S.q.trim().length < 2) {
        lireRecents().forEach(function (r) { l.push({ type: r.type, it: r.it }); });
        return l;
      }
      if (!S.res) return l;
      CATS.forEach(function (c) {
        const bloc = S.res[c.k];
        ((bloc && bloc.items) || []).forEach(function (it) { l.push({ type: TYPE_DE_CAT[c.k], it: it }); });
      });
      return l;
    }

    function badge(txt, cls) { return '<em class="rch-b ' + cls + '">' + esc(txt) + '</em>'; }

    function htmlItem(type, it, idx, q) {
      const x = it.extra || {};
      let vis = '', titre = surligne(it.titre, q), det = surligne(it.detail || '', q), bad = '', droite = '';
      switch (type) {
        case 'client': {
          const ini = String(it.titre || '?').split(/\s+/).filter(Boolean).slice(0, 2).map(function (m) { return m[0]; }).join('').toUpperCase();
          vis = '<span class="rch-vis rch-ini">' + esc(ini || '?') + '</span>';
          if (x.cycle_ouvert) bad += badge('Suivi', 'rch-b-v');
          if (x.societe) bad += badge('Société', 'rch-b-b');
          if (x.nb_vehicules > 0) droite = '<small>' + x.nb_vehicules + ' véh.</small>';
          break;
        }
        case 'vehicule':
          vis = '<span class="rch-vis">' + I.key + '</span>';
          if (x.actuel === false) bad += badge('Ancien', 'rch-b-g');
          det = surligne([x.immat, x.proprietaire ? 'à ' + x.proprietaire : null].filter(Boolean).join(' · ') || it.detail, q);
          break;
        case 'vo': {
          vis = x.photo ? '<span class="rch-vis"><img src="' + esc(x.photo) + '" alt="" loading="lazy" onerror="this.parentNode.innerHTML=\'\'"></span>' : '<span class="rch-vis">' + I.car + '</span>';
          const st = { EN_STOCK: ['En stock', 'rch-b-v'], IMMOBILISE: ['Immobilisé', 'rch-b-o'], PREVISION_RENTREE: ['À venir', 'rch-b-g'] }[x.statut];
          if (st) bad += badge(st[0], st[1]);
          if (euros(x.prix)) droite = esc(euros(x.prix)) + (x.millesime ? '<small>' + esc(x.millesime) + '</small>' : '');
          break;
        }
        case 'vn': {
          vis = '<span class="rch-vis">' + I.carNew + '</span>';
          const s = String(x.statut || '');
          if (s === 'DISPONIBLE') bad += badge('Disponible', 'rch-b-v');
          else if (s === 'RESERVE') bad += badge('Réservé', 'rch-b-o');
          else if (/^COMMANDE/.test(s)) bad += badge('Commande', 'rch-b-b');
          else if (s) bad += badge(s.charAt(0) + s.slice(1).toLowerCase().replace(/_/g, ' '), 'rch-b-g');
          if (euros(x.prix)) droite = esc(euros(x.prix));
          break;
        }
        case 'affaire': {
          vis = '<span class="rch-vis">' + I.doc + '</span>';
          const st = { win: ['Gagnée', 'rch-b-v'], lose: ['Perdue', 'rch-b-r'], propale: ['Proposition', 'rch-b-b'], bdc: ['Bon de commande', 'rch-b-b'], draft: ['Brouillon', 'rch-b-g'] }[x.status];
          if (st) bad += badge(st[0], st[1]);
          det = surligne([x.client, it.detail].filter(Boolean).join(' · '), q);
          if (euros(x.montant)) droite = esc(euros(x.montant));
          break;
        }
        case 'collaborateur':
          vis = '<span class="rch-vis">' + I.team + '</span>';
          break;
      }
      return '<a class="rch-it' + (idx === S.sel ? ' rch-sel' : '') + '" role="option" data-i="' + idx + '">' + vis +
        '<span class="rch-corps"><span class="rch-t"><span>' + titre + '</span>' + bad + '</span>' +
        (det ? '<span class="rch-d">' + det + '</span>' : '') + '</span>' +
        (droite ? '<span class="rch-droite">' + droite + '</span>' : '') + '</a>';
    }

    function peindre() {
      const r = racine(); if (!r) return;
      etat();
      const p = r.querySelector('.rch-panneau');
      const q = (S.q || '').trim();
      let h = '', idx = 0;

      if (q.length < 2) {
        const rec = lireRecents();
        if (rec.length) {
          h += '<div class="rch-cat"><div class="rch-cat-h">' + I.clock + 'Ouverts récemment</div>';
          rec.forEach(function (x) { h += htmlItem(x.type, x.it, idx++, ''); });
          h += '</div>';
        }
      } else if (S.erreur) {
        h = '<div class="rch-vide">La recherche n’a pas abouti.<small>' + esc(S.erreur) + '</small></div>';
      } else if (S.res) {
        if (S.approche) h += '<div class="rch-info">' + I.wand + 'Aucun résultat exact pour « ' + esc(q) + ' » — voici les plus proches.</div>';
        CATS.forEach(function (c) {
          const bloc = S.res[c.k];
          const items = (bloc && bloc.items) || [];
          if (!items.length) return;
          h += '<div class="rch-cat"><div class="rch-cat-h">' + I[c.ic] + esc(c.lib) + '<em>' + items.length + (bloc.plus ? '+' : '') + '</em></div>';
          items.forEach(function (it) { h += htmlItem(TYPE_DE_CAT[c.k], it, idx++, S.approche ? '' : q); });
          if (bloc.plus) {
            // En recherche approchée, filtrer une liste avec le mot mal tapé
            // ne donnerait rien : pas de lien « voir tout ».
            const lien = S.approche ? null : { vo: 'Voir tout dans le stock VO', vn: 'Voir tout dans le stock VN', collaborateurs: 'Voir tout dans l’annuaire' }[c.k];
            h += '<div class="rch-plus">D’autres résultats existent' + (lien ? ' — <a data-tout="' + c.k + '">' + lien + '</a>' : ' : précisez la recherche') + '</div>';
          }
          h += '</div>';
        });
        if (!idx && !S.charge && q.length < 3 && /[a-zA-ZÀ-ÿ]/.test(q)) {
          h = '<div class="rch-vide">Tapez au moins 3 lettres pour chercher un nom.' +
              '<small>Une immatriculation, un VIN ou un téléphone se cherchent dès 2 caractères.</small></div>';
        } else if (!idx && !S.charge) {
          h = '<div class="rch-vide">Aucun résultat pour <b>« ' + esc(q) + ' »</b>' +
              '<small>Essayez un nom, une immatriculation, les derniers caractères d’un VIN ou un numéro de téléphone.</small></div>';
        }
      }
      if (h && idx) h += '<div class="rch-pied"><span><b>↑ ↓</b> parcourir</span><span><b>Entrée</b> ouvrir</span><span><b>Échap</b> fermer</span></div>';
      p.innerHTML = h;
      p.classList.toggle('rch-a-contenu', !!h);
      const sel = p.querySelector('.rch-sel');
      if (sel && sel.scrollIntoView) { try { sel.scrollIntoView({ block: 'nearest' }); } catch (e) { } }
    }

    // ---------------------------------------------------------------- requête
    function planifier() {
      clearTimeout(S.timer);
      const q = (S.q || '').trim();
      if (q.length < 2) { S.res = null; S.erreur = null; S.charge = false; S.sel = -1; S.seq++; peindre(); return; }
      S.timer = setTimeout(chercher, DEBOUNCE);
    }

    async function chercher() {
      const q = (S.q || '').trim();
      const n = ++S.seq;
      S.charge = true; etat();
      try {
        if (!sb) throw new Error('Connexion à la base indisponible');
        const r = await sb.rpc('recherche_globale', { p_q: q, p_limite: LIMITE });
        if (n !== S.seq) return;                 // une frappe plus récente a pris la main
        if (r.error) throw r.error;
        const d = r.data || {};
        if (d.erreur) throw new Error(d.erreur === 'non_authentifie' ? 'Session expirée : reconnectez-vous.' : d.erreur);
        S.res = d; S.approche = !!d.approche; S.erreur = null;
        S.sel = aplat().length ? 0 : -1;
        try { if (window.OD && OD.pulse && OD.pulse.track) OD.pulse.track('recherche', { n: aplat().length, ms: d.ms, approche: S.approche }); } catch (e) { }
      } catch (e) {
        if (n !== S.seq) return;
        S.res = null; S.erreur = (e && e.message) || String(e);
      } finally {
        if (n === S.seq) { S.charge = false; peindre(); }
      }
    }

    // ---------------------------------------------------------------- navigation
    function goPage(path) {
      const uid = PAGE_UID[path];
      if (inEditor()) {
        if (uid) { try { wwLib.wwApp.goTo(uid); return; } catch (e) { } try { wwLib.goTo(uid); return; } catch (e) { } }
        return;
      }
      try { wwLib.goTo(LANG_PREFIX + path); return; } catch (e) { }
      try { W.location.href = LANG_PREFIX + path; } catch (e) { }
    }
    function surPage(path) {
      try { return String(W.location.pathname || '').indexOf(path) !== -1; } catch (e) { return false; }
    }

    // Attend qu'un élément apparaisse dans la page (le module cible se monte
    // après la navigation), puis agit. Abandon silencieux au bout de `max` ms.
    function quand(trouver, agir, max) {
      const fin = Date.now() + (max || 12000);
      (function tour() {
        let el = null;
        try { el = trouver(); } catch (e) { }
        if (el) { try { agir(el); } catch (e) { } return; }
        if (Date.now() < fin) setTimeout(tour, 150);
      })();
    }
    function saisir(input, valeur) {
      input.value = valeur;
      input.dispatchEvent(new Event('input', { bubbles: true }));
    }
    function toast(txt) {
      try {
        const old = doc.querySelector('.od-rech-toast'); if (old) old.remove();
        const t = doc.createElement('div'); t.className = 'od-rech-toast'; t.textContent = txt;
        (doc.body || doc.documentElement).appendChild(t);
        setTimeout(function () { try { t.remove(); } catch (e) { } }, 4000);
      } catch (e) { }
    }

    async function ouvrirClient(idvu) {
      if (idvu == null || idvu === '') return;
      const id = Number(idvu);
      // Cycle de CONSULTATION (pas « Ouvert ») : même règle que la Base client.
      try {
        const api = siteApi();
        const idSite = api && api.getSiteId ? api.getSiteId() : null;
        if (idSite != null && sb) await sb.rpc('cycle_consulter', { p_id_client: id, p_id_site: idSite, p_id_user: userId() });
      } catch (e) { console.warn('[recherche] cycle_consulter :', e && e.message); }
      const obj = { IDVu: id };
      try { W.__odSelectedClient = obj; } catch (e) { }
      try { W.sessionStorage.setItem('od_selected_client', JSON.stringify(obj)); } catch (e) { }
      try { wwLib.wwVariable.updateValue(VAR_CLIENT, obj); } catch (e) { }
      try { W.dispatchEvent(new Event('oropra-client-selected')); } catch (e) { }
      goPage('/fiche-client');
    }

    // VO / VN : se placer sur le site du véhicule s'il diffère du site courant.
    async function siteDuVehicule(it) {
      const cible = it && it.id_site != null ? Number(it.id_site) : null;
      const api = siteApi();
      if (cible == null || !api || !api.getSiteId || !api.setSiteId) return;
      if (Number(api.getSiteId()) === cible) return;
      try {
        await api.setSiteId(cible);
        const nom = (it.extra && it.extra.site) || '';
        toast('Site basculé' + (nom ? ' sur ' + nom : '') + ' pour afficher ce véhicule.');
      } catch (e) { }
    }

    function ouvrirVO(it, filtre) {
      const vin = (it && it.extra && it.extra.vin) || (it && it.cle) || '';
      goPage('/vo-liste');
      quand(function () {
        const s = doc.getElementById('vo-search');
        const pret = doc.querySelector('.vl-row[data-vin], .vo-card, [data-act="eye"]');
        return s && pret ? s : null;
      }, function (s) {
        saisir(s, filtre != null ? filtre : vin);
        if (filtre != null) return;
        quand(function () {
          return doc.querySelector('.vl-row[data-vin="' + CSS_esc(vin) + '"]') || doc.querySelector('[data-act="eye"][data-vin="' + CSS_esc(vin) + '"]');
        }, function (el) { el.click(); }, 4000);
      });
    }

    function ouvrirVN(it, filtre) {
      const x = (it && it.extra) || {};
      const cle = filtre != null ? filtre : (x.vin || x.commande || (it && it.cle) || '');
      goPage('/vn-liste');
      quand(function () { return doc.querySelector('[data-ong="tous"]') && doc.getElementById('vn-q'); }, function () {
        const tous = doc.querySelector('[data-ong="tous"]');
        if (tous && !tous.classList.contains('on')) tous.click();
        quand(function () { return doc.getElementById('vn-q'); }, function (s) {
          saisir(s, cle);
          if (filtre != null) return;
          // la liste filtre après 220 ms de pause : on laisse passer le rendu
          setTimeout(function () {
            const lignes = doc.querySelectorAll('.vl-row[data-id]');
            if (lignes.length === 1) lignes[0].click();
          }, 650);
        }, 3000);
      });
    }

    function ouvrirAnnuaire(nom) {
      goPage('/annuaire');
      quand(function () { return doc.querySelector('.an-search input'); }, function (s) { saisir(s, nom || ''); });
    }

    function CSS_esc(v) { try { return (W.CSS && W.CSS.escape) ? W.CSS.escape(v) : String(v).replace(/"/g, '\\"'); } catch (e) { return String(v); } }

    async function ouvrir(entree) {
      if (!entree) return;
      const type = entree.type, it = entree.it || {};
      noterRecent(type, it);
      fermer(true);
      switch (type) {
        case 'client':        return ouvrirClient(it.cle);
        case 'vehicule':      return ouvrirClient(it.extra && it.extra.id_client);
        case 'affaire':       return ouvrirClient(it.extra && it.extra.id_client);
        case 'vo':            await siteDuVehicule(it); return ouvrirVO(it);
        case 'vn':            await siteDuVehicule(it); return ouvrirVN(it);
        case 'collaborateur': return ouvrirAnnuaire(it.titre);
      }
    }

    function voirTout(cat) {
      const q = (S.q || '').trim();
      fermer(true);
      if (cat === 'vo') return ouvrirVO(null, q);
      if (cat === 'vn') return ouvrirVN(null, q);
      if (cat === 'collaborateurs') return ouvrirAnnuaire(q);
    }

    // ---------------------------------------------------------------- interactions
    function ouvrirPanneau() { if (!S.ouvert) { S.ouvert = true; peindre(); } }
    function fermer(vider) {
      S.ouvert = false;
      if (vider) { S.q = ''; S.res = null; S.sel = -1; S.erreur = null; S.seq++; clearTimeout(S.timer); S.charge = false;
        const r = racine(); const i = r && r.querySelector('input'); if (i) { i.value = ''; i.blur(); } }
      peindre();
    }

    function brancher() {
      const r = racine(); if (!r) return;
      const input = r.querySelector('input');
      input.addEventListener('focus', ouvrirPanneau);
      input.addEventListener('input', function () { S.q = input.value; S.ouvert = true; planifier(); etat(); if ((S.q || '').trim().length < 2) peindre(); });
      input.addEventListener('keydown', function (e) {
        const l = aplat();
        if (e.key === 'ArrowDown') { e.preventDefault(); if (l.length) { S.sel = (S.sel + 1) % l.length; peindre(); } }
        else if (e.key === 'ArrowUp') { e.preventDefault(); if (l.length) { S.sel = (S.sel - 1 + l.length) % l.length; peindre(); } }
        else if (e.key === 'Enter') {
          e.preventDefault();
          // Entrée avant la fin de la frappe : on attend la réponse en cours.
          const q = (S.q || '').trim();
          if (q.length >= 2 && (!S.res || S.res.q !== q)) {
            // Entrée tapée avant la fin du délai de frappe : on cherche tout de
            // suite, puis on ouvre le premier résultat.
            clearTimeout(S.timer);
            chercher().then(function () { const l2 = aplat(); if (l2.length) ouvrir(l2[Math.max(0, S.sel)]); });
            return;
          }
          if (S.charge) return;
          if (S.sel >= 0 && l[S.sel]) ouvrir(l[S.sel]);
        }
        else if (e.key === 'Escape') { e.preventDefault(); if (S.q) { fermer(true); } else { fermer(false); input.blur(); } }
      });
      r.querySelector('.rch-x').addEventListener('click', function (e) { e.preventDefault(); S.q = ''; input.value = ''; planifier(); input.focus(); });
      const p = r.querySelector('.rch-panneau');
      // mousedown (et non click) : l'item réagit avant que le champ perde le focus
      p.addEventListener('mousedown', function (e) {
        const tout = e.target.closest && e.target.closest('[data-tout]');
        if (tout) { e.preventDefault(); voirTout(tout.getAttribute('data-tout')); return; }
        const a = e.target.closest && e.target.closest('.rch-it');
        if (!a) { e.preventDefault(); return; }
        e.preventDefault();
        const l = aplat(); ouvrir(l[Number(a.getAttribute('data-i'))]);
      });
      p.addEventListener('mousemove', function (e) {
        const a = e.target.closest && e.target.closest('.rch-it'); if (!a) return;
        const i = Number(a.getAttribute('data-i'));
        if (i !== S.sel) { S.sel = i; p.querySelectorAll('.rch-it').forEach(function (x) { x.classList.toggle('rch-sel', Number(x.getAttribute('data-i')) === i); }); }
      });
    }

    // Écouteurs de document : posés UNE fois pour la session (le module peut
    // être re-monté, la top nav reconstruite).
    if (!W.__odRechGlobal) {
      W.__odRechGlobal = true;
      const raccourci = function (e) {
        const champ = doc.querySelector('#od-recherche input');
        if (!champ) return;
        const k = (e.key || '').toLowerCase();
        const cible = e.target || {};
        const enSaisie = /^(input|textarea|select)$/i.test(cible.tagName || '') || cible.isContentEditable;
        if ((k === 'k' && (e.ctrlKey || e.metaKey)) || (k === '/' && !enSaisie && !e.ctrlKey && !e.metaKey && !e.altKey)) {
          e.preventDefault(); champ.focus(); champ.select();
        }
      };
      const dehors = function (e) {
        const box = doc.getElementById('od-recherche');
        if (box && !box.contains(e.target) && W.__odRech && W.__odRech.ouvert) { W.__odRech.ouvert = false; box.classList.remove('rch-on'); }
      };
      try { doc.addEventListener('keydown', raccourci, true); } catch (e) { }
      try { doc.addEventListener('mousedown', dehors, true); doc.addEventListener('touchstart', dehors, { capture: true, passive: true }); } catch (e) { }
    }

    construire();
  }
});
