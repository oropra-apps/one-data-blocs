// ============================================================================
//  SITE BUS — module One Data (OD.define)  v3
//
//  Ex-bloc on-app-load n°2. Devenu un module app-level : ancre masquée dans le
//  header partagé, monté par le loader et PERSISTANT (jamais re-monté).
//  L'utilisateur est garanti par le socle AVANT le montage -> les attentes
//  internes ne servent plus que de filet.
//
//  CE QUI CHANGE EN v3 — LE BUS PORTE UN PÉRIMÈTRE, PLUS SEULEMENT UN SITE
//
//  Le bus ne savait porter qu'un identifiant de site, et setSiteId(null) était
//  refusé net : « if (id == null || isNaN(id)) return; ». Conséquence, aucune
//  page ne pouvait dire « tout mon périmètre », « la marque TOYOTA » ou
//  « l'affaire COLIN TEAM TOY » — et le sélecteur de la barre du haut affichait
//  un site même quand la page en regardait douze.
//
//  Le bus porte désormais un PÉRIMÈTRE :
//      { level: 'all' | 'reseau' | 'affaire' | 'site', key, label }
//  Il avait déjà tout ce qu'il fallait pour cela : getSites() renvoie depuis
//  toujours { id_site, site, affaire, id_affaire, reseau }.
//
//  COMPATIBILITÉ — c'est la partie qui compte
//  Les modules existants écoutent onChange({siteId, users}) et filtrent sur un
//  site. Ils continuent de fonctionner sans être modifiés :
//    · périmètre de niveau 'site'  -> siteId vaut ce site, exactement comme avant
//    · périmètre plus large        -> siteId vaut null, ce que tous
//                                     interprètent déjà comme « pas de filtre »
//  Un module qui veut la finesse lit « perimetre » et « sites » dans le même
//  detail. Aucun module n'est cassé ; ceux qui ignorent le périmètre voient
//  simplement large, ce qui est la lecture juste.
//
//  La variable WeWeb selected_site_id reste la source de vérité POUR LE SITE :
//  elle est vidée quand le périmètre n'est pas un site, et le watcher continue
//  de suivre tout composant tiers qui l'écrit — choisir un site ailleurs ramène
//  donc le périmètre sur ce site, ce qui est bien l'intention de celui qui clique.
// ============================================================================
OD.define('site-bus', {
  async mount(__anchor, ctx) {
  const wwLib = window.wwLib;

  /* ---- Config ------------------------------------------------------------- */
  const VAR_SITE_SELECTED = '39fecccf-9296-43b7-b5b6-eadaa928290d';   // selected_site_id (source de vérité)
  const EVENT_NAME = 'oropra-site-changed';
  const LOG = (...a) => console.log('%c[site-bus]', 'color:#53bda7;font-weight:bold', ...a);

  function sb() { return ctx.supabase; }   // client du tenant (fourni par le socle)
  function fdoc() { return __anchor.ownerDocument || document; }
  function fwin() { try { return (wwLib.getFrontWindow && wwLib.getFrontWindow()) || window; } catch (e) { return window; } }
  function getVar(id) { try { return wwLib.wwVariable.getValue(id); } catch (e) { return null; } }
  function setVar(id, v) {
    try { wwLib.wwVariable.updateValue(id, v); } catch (e) {}
    try { const w = fwin(); if (w.variables) w.variables[id + '-value'] = v; } catch (e) {}
  }

  function getConnectedUser() {
    // MIGRÉ : lit le socle window.oropraUser (front window) au lieu de la collection.
    try { return fwin().oropraUser || {}; } catch (e) {}
    return {};
  }

  /* ---- État (singleton sur window) ----------------------------------------- */
  // La version d'état passe à 2 : le périmètre s'ajoute, et un état v1 encore en
  // mémoire après une mise à jour à chaud est reconstruit proprement.
  const STATE_VERSION = 2;
  function st() {
    const w = window;
    const cur = w.__OROPRA_SITE_BUS__;
    if (!cur || cur._v !== STATE_VERSION) {
      try { if (cur && cur.poll) clearInterval(cur.poll); } catch (e) {}
      w.__OROPRA_SITE_BUS__ = {
        _v: STATE_VERSION,
        ready: false,            // bus démarré
        booted: false,           // présélection initiale faite (une seule fois par session)
        sites: null,             // périmètre [{id_site, site, affaire, id_affaire, reseau, type_site}]
        usersBySite: {},         // cache { siteId: [{ID_User, nomComplet, nom, vnvo}] }
        siteId: null,            // site courant, null si le périmètre est plus large
        perim: null,             // { level, key, label } — null tant que rien n'est choisi
        users: [],               // users du site courant (vide si périmètre large)
        loadingUsersFor: null,
        listeners: [],
        poll: null
      };
    }
    return w.__OROPRA_SITE_BUS__;
  }

  /* ---- Données ------------------------------------------------------------- */
  async function loadPerimeter(meId) {
    const s = st(); const c = sb();
    if (s.sites !== null) return s.sites;
    const { data: perim, error: e1 } = await c.from('v_mon_perimetre').select('id_site').eq('viewer_id_user', Number(meId));
    if (e1) throw e1;
    const siteIds = Array.from(new Set((perim || []).map(r => Number(r.id_site)).filter(x => !isNaN(x))));
    if (!siteIds.length) { s.sites = []; return s.sites; }
    // type_site en plus : la barre du haut distingue une concession d'un
    // atelier ou d'un site logistique, qui ne vendent pas.
    const { data: sites, error: e2 } = await c.from('SITE')
      .select('ID_SITE,SITE,AFFAIRE,ID_AFFAIRE,RESEAU,type_site').in('ID_SITE', siteIds);
    if (e2) throw e2;
    s.sites = (sites || []).map(x => ({
      id_site: Number(x.ID_SITE), site: x.SITE, affaire: x.AFFAIRE,
      id_affaire: x.ID_AFFAIRE != null ? Number(x.ID_AFFAIRE) : null, reseau: x.RESEAU,
      type_site: x.type_site || null
    }));
    return s.sites;
  }

  async function loadUsers(siteId) {
    const s = st(); const c = sb();
    const key = String(siteId);
    if (s.usersBySite[key]) return s.usersBySite[key];
    s.loadingUsersFor = key;
    const { data: us, error: e1 } = await c.from('USER_SITE').select('ID_User').eq('ID_SITE', Number(siteId));
    if (e1) throw e1;
    const ids = Array.from(new Set((us || []).map(r => Number(r.ID_User)).filter(x => !isNaN(x))));
    let list = [];
    if (ids.length) {
      const { data: users, error: e2 } = await c.from('USER').select('ID_User, nomComplet, nom, VN_VO').in('ID_User', ids);
      if (e2) throw e2;
      list = (users || []).map(u => ({
        ID_User: Number(u.ID_User),
        nomComplet: u.nomComplet || ('User ' + u.ID_User),
        nom: u.nom || u.nomComplet || '',
        vnvo: String(u.VN_VO || '').toUpperCase().replace(/[^A-Z]/g, '')
      })).sort((a, b) => String(a.nom).localeCompare(String(b.nom), 'fr'));
    }
    s.usersBySite[key] = list;
    return list;
  }

  /* ---- Le périmètre --------------------------------------------------------- */
  // Les sites couverts par un niveau. Une clé inconnue ne renvoie RIEN plutôt
  // que tout : mieux vaut un écran vide, qui se voit, qu'un écran trop large,
  // qui ne se voit pas.
  function sitesDuNiveau(level, key) {
    const tous = st().sites || [];
    if (!level || level === 'all') return tous.slice();
    if (level === 'reseau')  return tous.filter(x => String(x.reseau  || '') === String(key));
    if (level === 'affaire') return tous.filter(x => String(x.affaire || '') === String(key));
    if (level === 'site')    return tous.filter(x => String(x.id_site)       === String(key));
    return [];
  }

  function libelleNiveau(level, key) {
    if (!level || level === 'all') return 'Tout mon périmètre';
    if (level === 'site') {
      const s2 = (st().sites || []).find(x => String(x.id_site) === String(key));
      return s2 ? (s2.site || ('Site ' + key)) : ('Site ' + key);
    }
    return String(key || '');
  }

  function detailCourant() {
    const s = st();
    const p = s.perim || { level: 'all', key: null, label: 'Tout mon périmètre' };
    return {
      siteId: s.siteId,                 // null si le périmètre est plus large qu'un site
      users: s.users.slice(),
      perimetre: { level: p.level, key: p.key, label: p.label },
      sites: sitesDuNiveau(p.level, p.key).map(x => Number(x.id_site))
    };
  }

  /* ---- Cœur : adoption d'un périmètre + notification ------------------------ */
  async function adoptPerimetre(p, origin) {
    const s = st();
    const level = (p && p.level) || 'all';
    const key = p ? p.key : null;

    // Un site hors périmètre reste ignoré : on ne l'ouvre pas par la bande en
    // passant par le niveau.
    if (level === 'site') {
      const id = Number(key);
      if (isNaN(id)) return;
      if (s.sites !== null && s.sites.length && !s.sites.some(x => Number(x.id_site) === id)) {
        const fb = Number(s.sites[0].id_site);
        if (String(getVar(VAR_SITE_SELECTED)) !== String(fb)) setVar(VAR_SITE_SELECTED, fb);
        if (origin !== 'boot') { console.warn('[site-bus] site ' + id + ' hors perimetre -> ignore (repli ' + fb + ')'); return; }
      }
    }

    const sites = sitesDuNiveau(level, key);
    const label = (p && p.label) || libelleNiveau(level, key);
    const nouveauSite = level === 'site' ? Number(key) : null;

    // Rien de neuf : même niveau, même clé, et les users déjà chargés.
    if (s.perim && s.perim.level === level && String(s.perim.key) === String(key)
        && (level !== 'site' || s.users.length)) return;

    s.perim = { level: level, key: key, label: label };
    s.siteId = nouveauSite;

    // La variable WeWeb ne sait porter qu'un site : elle est vidée dès que le
    // périmètre est plus large, pour qu'aucun composant tiers ne continue de
    // croire qu'on regarde un site précis.
    const vCible = nouveauSite == null ? '' : nouveauSite;
    if (String(getVar(VAR_SITE_SELECTED)) !== String(vCible)) setVar(VAR_SITE_SELECTED, vCible);

    let users = [];
    if (nouveauSite != null) {
      try { users = await loadUsers(nouveauSite); } catch (e) { console.error('[site-bus] loadUsers', e); }
      if (s.siteId !== nouveauSite) return;            // un autre choix est passé devant
    }
    s.users = users;

    LOG('périmètre =', level, key == null ? '' : key, '(' + sites.length + ' sites, '
        + users.length + ' users)', origin ? '[' + origin + ']' : '');

    const detail = detailCourant();
    s.listeners.slice().forEach(cb => { try { cb(detail); } catch (e) {} });
    try { fdoc().dispatchEvent(new CustomEvent(EVENT_NAME, { detail })); } catch (e) {}
  }

  // Compatibilité : adopter un site, c'est adopter un périmètre de niveau site.
  function adoptSite(siteId, origin) {
    if (siteId == null || isNaN(Number(siteId))) {
      // setSiteId(null) ne partait nulle part en v2. Il veut dire « plus de site
      // en particulier », donc : tout mon périmètre.
      return adoptPerimetre({ level: 'all', key: null }, origin);
    }
    return adoptPerimetre({ level: 'site', key: Number(siteId) }, origin);
  }

  /* ---- Présélection initiale (UNE seule fois par session) ------------------- */
  // Règle inchangée : on repart TOUJOURS du ID_SITE du user connecté à chaque
  // connexion (s'il est dans le périmètre), sinon le 1er site du périmètre.
  async function bootPreselection() {
    const s = st();
    if (s.booted) return;
    s.booted = true;
    const me = getConnectedUser();
    let target = null;
    try {
      const sites = await loadPerimeter(Number(me.ID_User));
      if (sites.length) {
        if (me.ID_SITE != null && sites.some(x => String(x.id_site) === String(me.ID_SITE))) target = Number(me.ID_SITE);
        else target = sites[0].id_site;
      }
    } catch (e) { console.error('[site-bus] perimeter', e); }
    if (target == null && me.ID_SITE != null) target = Number(me.ID_SITE);
    if (target != null) await adoptSite(target, 'boot');
  }

  /* ---- Watcher central : suit selected_site_id ------------------------------ */
  // Compatibilité : tout composant existant qui écrit selected_site_id
  // (sélecteur accueil, cascade page notifs…) est automatiquement pris en compte.
  // Écrire un site depuis ailleurs ramène le périmètre sur ce site — c'est bien
  // ce que veut celui qui l'écrit.
  function watch() {
    const s = st();
    if (s.poll) return;
    s.poll = setInterval(() => {
      const v = getVar(VAR_SITE_SELECTED);
      const id = (v == null || v === '') ? null : Number(v);
      if (id != null && !isNaN(id) && id !== s.siteId) adoptSite(id, 'var');
    }, 400);
  }

  /* ---- API publique ---------------------------------------------------------
     window.oropraSite.getSiteId()        -> Number|null  site courant (null si le
                                             périmètre est plus large qu'un site)
     window.oropraSite.getUsers()         -> Array        users du site courant
     window.oropraSite.getSites()         -> Array|null   périmètre complet
                                             [{id_site, site, affaire, id_affaire,
                                               reseau, type_site}]
     window.oropraSite.setSiteId(id)      -> Promise      change de site ; null = tout
     window.oropraSite.getPerimetre()     -> {level,key,label}|null       v3
     window.oropraSite.setPerimetre(p)    -> Promise                      v3
                                             p = {level:'all'|'reseau'|'affaire'|'site',
                                                  key, label?}
     window.oropraSite.getSitesDuPerimetre() -> [Number]                  v3
     window.oropraSite.onChange(cb)       -> Function     s'abonne à
                                             {siteId, users, perimetre, sites}
     (+ événement DOM 'oropra-site-changed' sur le front document, même detail)
  ----------------------------------------------------------------------------- */
  function exposeApi() {
    const api = {
      getSiteId: () => st().siteId,
      getUsers:  () => st().users.slice(),
      getSites:  () => (st().sites ? st().sites.slice() : null),
      setSiteId: (id) => adoptSite(id, 'api'),
      getPerimetre: () => { const p = st().perim; return p ? { level: p.level, key: p.key, label: p.label } : null; },
      setPerimetre: (p) => adoptPerimetre(p, 'api'),
      getSitesDuPerimetre: () => {
        const p = st().perim;
        return sitesDuNiveau(p ? p.level : 'all', p ? p.key : null).map(x => Number(x.id_site));
      },
      onChange:  (cb) => {
        const s = st();
        if (typeof cb !== 'function') return () => {};
        s.listeners.push(cb);
        // Un abonné qui arrive après coup reçoit l'état courant tout de suite,
        // y compris quand le périmètre n'est pas un site (siteId null) — en v2
        // il ne recevait rien dans ce cas et restait sur un écran vide.
        if (s.perim) { try { cb(detailCourant()); } catch (e) {} }
        return () => { const i = s.listeners.indexOf(cb); if (i >= 0) s.listeners.splice(i, 1); };
      }
    };
    try { fwin().oropraSite = api; } catch (e) {}
    try { window.oropraSite = api; } catch (e) {}
  }

  /* ---- Démarrage ------------------------------------------------------------ */
  function start(tries) {
    tries = tries || 0;
    if (!sb() || getConnectedUser().ID_User == null) {
      if (tries < 120) return void setTimeout(() => start(tries + 1), 250);
      console.error('[site-bus] Supabase ou utilisateur connecté jamais prêt');
      return;
    }
    const s = st();
    if (s.ready) return;
    s.ready = true;
    exposeApi();
    LOG('démarrage');
    bootPreselection();   // présélection unique : ID_SITE du user (jamais re-déclenchée ensuite)
    watch();              // suit selected_site_id écrit par n'importe quel composant
  }
  start();

  // Robustesse : si l'utilisateur applicatif arrive tardivement (session restaurée
  // après coup, changement de compte), démarrer sur l'événement du socle au lieu
  // d'abandonner après la boucle d'attente. start() est idempotent (garde s.ready).
  try {
    const _w = fwin();
    const _kick = () => { try { start(0); } catch (e) {} };
    _w.addEventListener('oropra-user-ready', _kick);
    if (_w !== window) window.addEventListener('oropra-user-ready', _kick);
  } catch (e) {}
}
});
