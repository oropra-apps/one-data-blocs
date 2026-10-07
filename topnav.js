// ============================================================================
//  TOP NAV — module One Data (OD.define)  v28 — SÉLECTEUR DE PÉRIMÈTRE
//  v24 (06/10/2026) : l'arbitrage gagne une TROISIEME COLONNE de saisie et la
//  ligne NATURE (particulier / societe), jusque-la totalement absente alors
//  qu'elle commande toute la presentation de la fiche client. 15,2 % des
//  fiches de la file sont marquees entreprise sans porter de SIRET : la ligne
//  reste donc affichee meme quand les deux cotes sont d'accord, et une alerte
//  signale « societe sans SIRET ». Corrige aussi un cas ou le choix de
//  l'arbitre etait ignore : quand un seul des deux cotes portait une valeur,
//  cliquer « non renseigne » ne changeait rien. Et le COMPTEUR passe sur la
//  barre, a cote de Delco : il ne vivait que dans le menu de l'avatar, et le
//  bandeau, seule surface visible, se tait 30 minutes quand on clique sa croix.
//
//  v25 (06/10/2026) : trois corrections d'affichage du meme defaut.
//  1. Le compteur survit a la reconstruction de la nav. build() repart d'un
//     `r.innerHTML = …`, ce qui effacait le bandeau accroche au conteneur :
//     a chaque navigation dans le SPA il disparaissait, et rien ne le
//     redessinait avant le prochain retour sur l'onglet. D'ou un compteur
//     present, puis absent, puis present, sans que personne n'ait rien
//     touche. On repeint depuis le dernier compte connu, sans requete.
//  2. Il parait des la connexion (1,2 s) au lieu d'attendre que le
//     navigateur s'ennuie (jusqu'a 9 s). Cette attente se justifiait quand le
//     comptage coutait 5 s de serveur ; il en coute 8 a 49 ms.
//  3. Les lignes d'arbitrage tiennent sur une ligne : la provenance, qui
//     etait repetee dans chaque carte, passe en en-tete de colonne une fois
//     pour toutes. Mesure au rendu : 5 lignes sur 6 a 40-42 px, seule une
//     adresse de 34 caracteres en occupe trois.
//
//  v26 (06/10/2026) : les dates de naissance s'affichent en jj/mm/aaaa dans
//  les deux colonnes de valeurs, dans la fiche finale et dans le repli des
//  champs identiques. Affichage seul : la valeur transmise a client_arbitrer
//  est relue depuis la fiche, jamais depuis le texte a l'ecran, et reste donc
//  en ISO.
//
//  v27 (06/10/2026) : apres une fusion, on ENCHAINE sur le dossier suivant au
//  lieu de fermer la modale et de partir sur la fiche client. Ce detour se
//  justifiait tant que l'arbitrage ne montrait pas tout ; depuis que la
//  nature, la civilite et la saisie libre y sont, il ne coute plus qu'une
//  navigation complete entre deux dossiers. La fiche reste a un clic depuis
//  le message de confirmation. Corrige au passage un defaut ancien : ce
//  message etait pose dans #od-arb, que arbRender reconstruit par innerHTML,
//  et vivait donc 430 ms au lieu des six secondes prevues — pour tous les
//  messages de fin d'action, pas seulement celui-ci.
//
//  v28 (06/10/2026) : les colonnes de l'arbitrage tombent enfin en face. Deux
//  causes, mesurees au rendu dans Chromium. 1) `1fr` vaut `minmax(auto,1fr)`,
//  donc chaque colonne gardait un plancher a la largeur de son contenu
//  insecable ; comme chaque ligne est une grille independante, un e-mail ou
//  une adresse longue elargissait sa colonne sur SA ligne seulement. Passe en
//  minmax(0,1fr). 2) La ligne d'en-tete portait la classe `od-arb-head`, deja
//  prise par la barre de titre de la modale (gap:14px, padding:18px 22px) :
//  elle en heritait et resolvait ses colonnes a 166,7 px contre 181,3 px pour
//  les autres. Renommee `od-arb-cols`. Les sept lignes partagent desormais
//  exactement les memes bords.
//  Chaque ligne a trancher porte un champ de saisie libre, alimente par
//  ref_type_client pour la civilite : BACS annoncait « Mme » pour un monsieur
//  prenomme Francois Xavier, et l'arbitre devait fusionner l'erreur avant de
//  la corriger dans la fiche.
//  v23 (06/10/2026) : un echec du comptage n'efface plus le badge ni le
//  bandeau d'arbitrage. Trois reponses 500 relevees en une heure dans la nuit
//  du 05 au 06/10, toutes des depassements du statement_timeout de 8 s : le
//  compteur disparaissait de l'ecran sans un mot. On conserve le dernier
//  compte connu et on reessaie a 20 puis 40 secondes.
//  v22 (05/10/2026) : le badge ne se rafraichit plus a la fermeture de la modale
//  d'arbitrage mais une fois le navigateur libre. Mesure juste apres une fusion :
//  5 927 ms de temps serveur pour ce comptage, lance pile au montage de la fiche
//  client. C'est ce qui rendait la navigation apres fusion si lente.
//  v21 (05/10/2026) : le badge d'arbitrage appelle client_file_arbitrage_compte
//  au lieu de la fonction complete. Celle-ci fabriquait 99 lignes et 198 apercus
//  clients pour afficher un chiffre : 5 028 ms de temps serveur a froid, releves
//  sur le demarrage du 05/10/2026. L'ouverture de la modale garde, elle, la
//  fonction complete — c'est la qu'on a besoin des lignes.
//
//  CE QUI CHANGE EN v3
//  Le sélecteur de site listait les sites à plat. Sur un groupe de vingt-sept
//  sites répartis en deux marques et douze affaires, ce n'était plus un
//  sélecteur mais une liste à lire — et il ne permettait de choisir qu'une
//  feuille : ni « tout mon périmètre », ni une marque, ni une affaire.
//
//  Il devient une ARBORESCENCE marque › affaire › site, alimentée par
//  oropraSite.getSites() qui portait déjà reseau et affaire. Chaque ligne est un
//  choix ; le chevron déplie sans choisir. En dessous de sept sites, la liste
//  plate est conservée : un arbre à deux branches ferait perdre du temps.
//
//  Il appelle setPerimetre({level,key}) du bus v3. Sur un bus v2, qui ne connaît
//  que setSiteId, il retombe automatiquement sur la liste plate — la nav ne
//  casse donc pas si les deux modules ne sont pas déployés ensemble.
//
//  (v2, étape B — refresh user au montage)
//  Extrait de authDefine. Rendu dans __anchor (#nav-root) ; logo via
//  ctx.tenant.logo_url ; ref morte Userconnected retirée.
//  GARDÉS (constants de l'app partagée, identiques pour tous les tenants) :
//  PAGE_UID, VAR_CLIENT, VAR_NB_NOTIFS, FICHE_TAB_VAR + tout l'auto-persistance
//  (observer/heartbeat) qui maintient la nav à travers les navigations.
// ============================================================================
OD.define('topnav', {
  _inited: false,
  mount(__anchor, ctx) {
    __anchor.id = 'nav-root';
    if (this._inited) return;
    this._inited = true;
(function () {
  if (!window.wwLib) { return; }
  const wwLib = window.wwLib;
  const doc = __anchor.ownerDocument || wwLib.getFrontDocument();
  const ROOT_ID = 'nav-root';
  const NAV_VER = 35; // <- numéro de version (témoin de chargement)

  // La barre du haut est un sélecteur de SITE, et rien d'autre.
  //
  // L'essai inverse a été fait : elle portait l'arborescence marque › affaire ›
  // site, et le périmètre choisi là valait pour toute l'application. Il a échoué
  // pour une raison de fond. La barre est partagée par toutes les pages, mais
  // aucune page opérationnelle ne sait travailler sur « une marque » : le kanban
  // se vidait (sa requête exige un site et un vendeur), le lead management
  // ignorait l'événement et restait figé sur son dernier site, les listes VN/VO
  // et l'agenda suivaient le même chemin. Un seul écran savait l'exploiter.
  //
  // Le périmètre multi-niveaux vit donc dans les pages qui savent agréger —
  // dashboard, lead management, suivi d'activité — chacune avec le sien.
  //
  // Le code d'arborescence (arbrePerim, htmlPerim, plis) est conservé tel quel :
  // il est juste débranché. Repasser ce drapeau à true le réactive en entier.
  const PERIM_EN_TOPNAV = false;
  try { window.__navVer = NAV_VER; } catch (e) {}
  function root() { return doc.getElementById(ROOT_ID); }
  // NB : on ne fait PLUS de "early return" si #nav-root est absent. Tout le démarrage
  // (rendu immédiat si possible + observer ré-armé + filets) est géré par boot(),
  // appelé en bas après toutes les déclarations. L'ancien flag __navWaiting pouvait
  // rester coincé à true (poll épuisé / navigation) et bloquait définitivement le
  // rendu -> nav qui ne réapparaissait qu'en relançant le JS à la main.

  // ---------------------------------------------------------------- constantes
  // Navigation par CHEMIN d'URL (comme l'embed Delco : wwLib.goTo("/fr/delco")).
  // LANG_PREFIX = préfixe de langue de l'app. Mets '' si un jour l'app n'a plus de /fr/.
  const LANG_PREFIX = '/fr';
  const P = {
    accueil:   '/accueil',
    admin:     '/admin',
    client:    '/client',
    notifs:    '/notifications',
    pipe:      '/pipe-commercial',
    perf:      '/performances',
    objectifs: '/objectifs',
    bilat:     '/bilaterales',
    activite:  '/activite',
    marketing: '/marketing',
    voListe:   '/vo-liste',
    vnListe:   '/vn-liste',
    vnConfig:  '/bdc-vn',
    delco:     '/delco',
    annuaire:  '/annuaire',
    tutos:     '/tutos',
    auth:      '/authentification',
    ficheClient: '/fiche-client'
  };
  // UID de page WeWeb (réf. référentiel section 5.1 + UID /vn-liste & /vn-config fournis).
  // Utilisés UNIQUEMENT dans l'ÉDITEUR : wwLib.wwApp.goTo(uid) y donne un vrai SPA, fenêtres
  // synchronisées, sans imbrication. En PROD, on navigue par CHEMIN (URL propre /fr/xxx, voir
  // goPage), car un UID en prod s'inscrit tel quel dans l'URL -> route inexistante au refresh
  // -> page blanche. Clé = path de P.
  const PAGE_UID = {
    '/accueil':          'f84d6f00-de35-45b9-ae23-c1f1e46bfa69',
    '/admin':            '1d30e3ac-fdee-4cce-b9c5-190aee995d23',
    '/client':           'f5b60fe2-bc14-4b3e-ba84-82ddfa11248c',
    '/notifications':    '8868fa49-e115-482d-9da2-4249e16196da',
    '/pipe-commercial':  '9e90d49a-215f-4c2b-b2bb-2d7c4f9aabd6',
    '/performances':     '1499f15f-e8cb-4561-aea8-bdeeeb080b68',
    '/objectifs':        'c9b4f9a6-460a-4365-8a06-95e30a13cbdb',
    '/bilaterales':      '7bfcfe73-4e89-40cf-bc84-1e07ddb478a6',
    '/activite':         '55717966-7e07-4957-9969-399198cce1ad',
    '/marketing':        '99519997-f935-471a-9147-b0118191b991',
    '/vo-liste':         '188b0f0b-5e80-4a77-a856-26469b08b614',
    '/vn-liste':         '08106b65-19e5-4e36-bdbb-2b12f67a2b6c',
    '/bdc-vn':           '5ecc8832-d99b-47c7-a853-0921624d80ef',
    '/delco':            'da5005d5-42e4-4b37-9d42-f8b8728ddb0e',
    '/annuaire':         'a6c1a683-2490-4263-8dc5-5e187bcbec87',
    '/tutos':            '3395973c-c8eb-476b-bda2-9862b5a3e30f',
    '/authentification': 'a97c534c-b592-4282-bd20-d0333f28ff75',
    '/fiche-client':     '259f1951-a2d4-4b90-ac83-0b3febe1d4ec'
  };
  const VAR_CLIENT = '55490583-c88b-4748-916e-4d203db07742';
  // Onglet actif de la fiche client : variable globale (Number) liée au champ
  // "Active tab index" du composant Tabs. On la force à 0 (= onglet "Fiche client")
  // au clic sur le nom du client, pour ne pas retomber sur le dernier onglet consulté.
  const FICHE_TAB_VAR = 'fb2cad2c-cd04-42e0-8909-e3c91c8dcfac';
  const FICHE_TAB_DEFAULT = 0;
  const VAR_NB_NOTIFS = '9fc0eca4-2325-4774-8e27-4c66515a9166';
  const SUPPORT_MAIL = 'oropra.gen@gmail.com';
  const LOGO_URL = (ctx && ctx.tenant && ctx.tenant.logo_url) || "";   // logo du tenant

  // ---------------------------------------------------------------- helpers
  // Détecte l'éditeur WeWeb : l'app y tourne dans une iframe de preview (window != top),
  // alors qu'en prod elle est au top-level. On NE FAIT JAMAIS de changement de location.*
  // dans l'éditeur : une URL relative s'y résout sur l'origine de l'ÉDITEUR -> l'éditeur se
  // recharge dans sa propre preview -> imbrications en poupées russes.
  function inEditor() {
    try { return window.self !== window.top; } catch (e) { return true; } // cross-origin -> iframe -> éditeur
  }
  function goPage(path) {
    if (!path) return;
    const uid = PAGE_UID[path];
    if (inEditor()) {
      // ÉDITEUR : navigation par UID UNIQUEMENT -> vrai SPA interne, fenêtres synchronisées,
      // aucune imbrication. Surtout PAS de chemin ici : une URL relative se résoudrait sur
      // l'origine de l'ÉDITEUR -> l'éditeur se recharge dans sa preview (poupées russes).
      if (uid) {
        try { wwLib.wwApp.goTo(uid); return; } catch (e) {}
        try { wwLib.goTo(uid); return; } catch (e) {}
      }
      return; // pas d'UID connu -> on ne tente rien en éditeur (éviter l'imbrication)
    }
    // PROD : navigation par CHEMIN -> URL propre /fr/xxx (comme l'embed Delco : wwLib.goTo("/fr/delco")).
    // C'est une vraie route, donc le rechargement de page fonctionne. À l'inverse, l'UID en prod
    // s'inscrit tel quel dans l'URL -> route inexistante au refresh -> page blanche.
    const href = LANG_PREFIX + path;
    try { wwLib.goTo(href); return; } catch (e) {}
    try { const w = (wwLib.getFrontWindow && wwLib.getFrontWindow()) || window; w.location.href = href; } catch (e) {}
  }
  // Déconnexion RÉELLE :
  //  - on coupe la session Supabase (signOut vide le token en localStorage) ;
  //  - puis on revient au login. ÉDITEUR : par UID (vrai SPA, aucune imbrication, aucun
  //    location.*). PROD : la page d'auth est la page d'ACCUEIL servie à la racine (/fr/),
  //    donc on force un rechargement complet vers '/' -> état réinitialisé + URL propre.
  //    (Naviguer vers /fr/authentification serait un 404 : cette route n'existe pas.)
  async function goAuth() {
    // vide le cache user AVANT de couper la session (éditeur SPA + prod)
    try { const w = wwLib.getFrontWindow(); w.oropraUser = null; w.__oropraUserPromise = null; w.__oropraAuthUid = null; } catch (e) {}
    try {
      const sb = wwLib.wwPlugins && wwLib.wwPlugins.supabase && wwLib.wwPlugins.supabase.instance;
      if (sb && sb.auth && typeof sb.auth.signOut === 'function') { await sb.auth.signOut(); }
    } catch (e) {}
    if (inEditor()) {
      const authUid = PAGE_UID['/authentification'];
      try { wwLib.wwApp.goTo(authUid); return; } catch (e) {}
      try { wwLib.goTo(authUid); return; } catch (e) {}
      return;
    }
    try { const w = (wwLib.getFrontWindow && wwLib.getFrontWindow()) || window; w.location.assign('/'); return; } catch (e) {}
    try { window.location.assign('/'); } catch (e) {}
  }
  // Pose l'index d'onglet de la fiche (Number) sur la variable globale liée au composant Tabs.
  function setFicheTab(idx) {
    try { wwLib.wwVariable.updateValue(FICHE_TAB_VAR, idx); } catch (e) {}
  }
  // Clic sur le nom du client -> fiche, sur l'onglet "Fiche client" (index 0).
  // On pose l'onglet UNE seule fois avant la navigation. Aucune ré-application :
  // les ré-applications répétées écrasaient le clic suivant de l'utilisateur sur
  // un autre onglet (Contacts, RDV, P.Com, Historique) et le laissaient vide.
  function openFicheClient() {
    setFicheTab(FICHE_TAB_DEFAULT);
    goPage(P.ficheClient);
  }
  // Ouvre la fiche d'un client precis (apres un arbitrage) : on pose le client
  // selectionne (variable + global + sessionStorage + evenement, comme la recherche),
  // puis on navigue vers la fiche.
  function odGoToClientFiche(idvu) {
    if (idvu == null) return;
    const obj = { IDVu: Number(idvu) };
    try { wwLib.wwVariable.updateValue(VAR_CLIENT, obj); } catch (e) {}
    try {
      const w = (wwLib.getFrontWindow && wwLib.getFrontWindow()) || window;
      w.__odSelectedClient = obj;
      try { sessionStorage.setItem('od_selected_client', JSON.stringify(obj)); } catch (e2) {}
      try { w.dispatchEvent(new Event('oropra-client-selected')); } catch (e2) {}
    } catch (e) {}
    openFicheClient();
  }
  // Delco : relance l'embed externe pour réafficher le nombre après un (re)rendu de la nav.
  function kickDelco() {
    try { if (window.__delcoBadge && typeof window.__delcoBadge.refresh === 'function') window.__delcoBadge.refresh(); } catch (e) {}
  }
  function getVar(id) { try { return wwLib.wwVariable.getValue(id); } catch (e) { return null; } }
  function user() {
    try { return wwLib.getFrontWindow().oropraUser || {}; }
    catch (e) { return {}; }
  }
  function pick(o, keys) { for (const k of keys) { if (o && o[k] != null && o[k] !== '') return o[k]; } return ''; }
  function esc(s) { if (s == null) return ''; return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }

  function clientLabelFrom(c) {
    if (!c || (c.NOM == null && c.PRENOM == null)) return null;
    const part = (c.idmultivu === 0 || c.idmultivu === '0');
    if (part) return [c.PRENOM, (c.NOM || '').toUpperCase()].filter(Boolean).join(' ');
    return [c.CIVILITE, c.NOM].filter(Boolean).join(' ');
  }
  function clientLabel() { return clientLabelFrom(getVar(VAR_CLIENT)); }
  function userInitials() {
    const u = user();
    const p = pick(u, ['prenom', 'Prenom', 'PRENOM', 'firstname']);
    const n = pick(u, ['nom', 'Nom', 'NOM', 'lastname']);
    const i = ((p || '')[0] || '') + ((n || '')[0] || '');
    return (i || pick(u, ['nomComplet', 'nom_complet_affichage']).slice(0, 2) || 'U').toUpperCase();
  }
  function userFullName() {
    const u = user();
    return pick(u, ['nomComplet', 'nom_complet_affichage'])
      || [pick(u, ['prenom', 'Prenom', 'PRENOM']), pick(u, ['nom', 'Nom', 'NOM'])].filter(Boolean).join(' ')
      || 'Mon compte';
  }

  // ---------------------------------------------------------------- icons
  const I = {
    chevron: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>',
    person:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>',
    pin:     '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21s-7-6-7-11a7 7 0 0 1 14 0c0 5-7 11-7 11z"/><circle cx="12" cy="10" r="2.5"/></svg>',
    bolt:    '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M13 2 4 14h6l-1 8 9-12h-6z"/></svg>',
    // Logo Delco : l'éclair officiel repris de la page Delco (LOGO_SVG),
    // fill=currentColor -> recoloré par `.od-delco svg{color:#53bda7}`. viewBox
    // RECADRÉ au plus près du tracé (bbox x18-46 / y8-56, +2 de marge) : sans ça
    // l'éclair flottait, petit, au centre d'un 64x64 quasi vide.
    delco:   '<svg viewBox="16 6 32 52" fill="currentColor"><path d="M 36 8 L 18 36 L 30 36 L 26 56 L 46 28 L 34 28 L 36 8 Z"/></svg>',
    burger:  '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>',
    close:   '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>'
  };

  // ---------------------------------------------------------------- menus
  const MENUS = [
    { label: 'Clients', badge: true, items: [
      { t: 'Base client', p: P.client },
      { t: 'Notifications', p: P.notifs, badge: true }
    ] },
    { label: 'Ventes', items: [
      { t: 'Gestion des ventes', p: P.pipe },
      { t: 'Performances', p: P.perf },
      { t: 'Objectifs', p: P.objectifs }
    ] },
    { label: 'Management', items: [
      { t: 'Bilatérales', p: P.bilat },
      { t: 'Suivi activité', p: P.activite },
      { t: 'Lead Management', p: P.marketing }
    ] },
    { label: 'Véhicules', items: [
      { t: 'Stock VN', p: P.vnListe },
      { t: 'Stock VO', p: P.voListe },
      { t: 'Import VN', p: P.vnConfig }
    ] }
  ];
  const USER_MENU = [
    { t: 'Mon compte', act: 'account' },
    { t: 'Doublons', act: 'doublons', badge: true },
    { t: 'Annuaire', p: P.annuaire },
    { t: 'Tutos', p: P.tutos },
    { t: 'Email Support', act: 'support' },
    { t: 'Se déconnecter', act: 'logout', danger: true }
  ];

  // ---------------------------------------------------------------- CSS
  const STYLE = `<style id="onedata-nav-css">
/* --od-maxw = largeur du contenu (À CALER sur ta page : 1200px). --od-gutter =
   gouttière latérale. Mets 0 si tes blocs sont flush au 1200 ; sinon mets la
   même valeur que le padding horizontal de ton conteneur de page. */
#nav-root{--od-maxw:1200px;--od-gutter:0px;font-family:"Nunito Sans",system-ui,sans-serif;color:#1F4A85;width:100%}
#nav-root *{box-sizing:border-box}
.od-nav{background:#fff;border-bottom:1px solid #e8eef7;width:100%}
.od-bar{width:100%}
.od-bar-inner{display:flex;align-items:center;gap:8px;padding:9px var(--od-gutter);position:relative;max-width:var(--od-maxw);margin:0 auto}
.od-logo{display:flex;align-items:center;gap:8px;cursor:pointer;flex:0 0 auto;margin-right:14px;font-weight:800;font-size:21px;color:#1F4A85;letter-spacing:-.5px}
.od-logo-img{height:44px;width:auto;max-width:min(190px,46vw);object-fit:contain;display:block}
.od-menus{display:flex;align-items:center;justify-content:center;flex-wrap:wrap;gap:6px;flex:1 1 auto;min-width:0}
.od-m{position:relative}
.od-m>button{display:flex;align-items:center;gap:6px;background:none;border:none;cursor:pointer;font:inherit;font-size:14px;font-weight:600;color:#1F4A85;padding:10px 18px;border-radius:9px;transition:background .15s,color .15s;white-space:nowrap}
.od-m>button:hover{background:#f2f6fc;color:#2a5ea9}
.od-m.open>button{background:#eef4fc;color:#2a5ea9}
.od-m>button>svg{width:14px;height:14px;transition:transform .18s}
.od-m.open>button>svg{transform:rotate(180deg)}
.od-pill{min-width:18px;height:18px;padding:0 5px;border-radius:9px;background:#e24b4a;color:#fff;font-size:10px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;line-height:1}
/* La pastille de notifications est un FEU, pas un compteur : c'est la couleur
   qui dit s'il y a urgence, et elle ne compte que la file personnelle. L'état
   vient de notif-badge (window.__odNotifFeu). Sans ce module, aucune pastille
   ne porte data-feu et le rouge historique s'applique : les deux versions
   peuvent donc etre deployees separement. */
.od-pill[data-feu="calme"]{background:#8b99b0;color:#fff}
.od-pill[data-feu="tiede"]{background:#fac055;color:#5a3d05}
.od-pill[data-feu="chaud"]{background:#e24b4a;color:#fff}
.od-pill[data-bat="1"]{position:relative}
.od-pill[data-bat="1"]::after{content:'';position:absolute;inset:-3px;border-radius:12px;border:2px solid #e24b4a;opacity:.45;animation:od-pouls 2.4s ease-out infinite;pointer-events:none}
@keyframes od-pouls{0%{transform:scale(.82);opacity:.5}100%{transform:scale(1.4);opacity:0}}
@media (prefers-reduced-motion:reduce){.od-pill[data-bat="1"]::after{animation:none;opacity:.3}}
.od-drop{position:absolute;top:calc(100% + 6px);left:0;min-width:230px;background:#fff;border:1px solid #e8eef7;border-radius:12px;box-shadow:0 12px 32px rgba(31,74,133,.14);padding:6px;z-index:300;display:none}
.od-m.open .od-drop,.od-user.open .od-drop,.od-site.open .od-drop{display:block}
.od-drop a{display:flex;align-items:center;justify-content:flex-start;gap:8px;padding:10px 12px;border-radius:8px;font-size:14px;color:#1F4A85;text-decoration:none;cursor:pointer}
.od-drop a:hover{background:#f2f6fc;color:#2a5ea9}
.od-spacer{display:none}
.od-delco{display:flex;align-items:center;gap:8px;padding:10px 18px;border-radius:9px;cursor:pointer;font-size:14px;font-weight:600;color:#1F4A85;text-decoration:none;transition:background .15s;white-space:nowrap}
.od-delco:hover{background:#f2f6fc;color:#2a5ea9}
.od-delco svg{width:auto;height:26px;margin-top:-6px;margin-bottom:-6px;color:#53bda7;flex:0 0 auto}
#delco-header-badge{min-width:18px;height:18px;padding:0 5px;border-radius:9px;font-size:10px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;line-height:1;margin-left:8px}
#delco-header-badge[data-state="idle"]{display:none}
#delco-header-badge[data-state="warn"]{background:#fac055;color:#5a3d05}
#delco-header-badge[data-state="urgent"]{background:#e24b4a;color:#fff}
.od-arb-bar{display:flex;align-items:center;gap:7px;padding:10px 14px;border-radius:9px;cursor:pointer;font-size:14px;font-weight:600;color:#1F4A85;text-decoration:none;transition:background .15s}
.od-arb-bar:hover{background:#fdf6e9;color:#8a5d08}
.od-arb-bar svg{width:17px;height:17px;color:#d2941f;flex:0 0 auto}
#od-arb-bar-n{min-width:18px;height:18px;padding:0 5px;border-radius:9px;font-size:10px;font-weight:700;display:inline-flex;align-items:center;justify-content:center;background:#d2941f;color:#fff}
@media(max-width:1100px){.od-arb-bar-txt{display:none}}
.od-user{position:relative;flex:0 0 auto}
.od-user>button{display:flex;align-items:center;gap:7px;background:none;border:none;cursor:pointer;padding:4px 6px 4px 4px;border-radius:30px;transition:background .15s}
.od-user>button:hover{background:#f2f6fc}
  .od-user-btn{position:relative}
  .od-user-btn::after{content:attr(data-tip);position:absolute;top:calc(100% + 8px);right:0;background:#2a5ea9;color:#fff;font-size:11px;font-weight:600;padding:5px 10px;border-radius:8px;white-space:nowrap;opacity:0;pointer-events:none;transition:opacity .12s ease;z-index:1200;box-shadow:0 6px 18px rgba(31,74,133,.28)}
  .od-user-btn:hover::after{opacity:1}
.od-avatar{width:34px;height:34px;border-radius:50%;background:#2a5ea9;color:#fff;font-size:13px;font-weight:700;display:flex;align-items:center;justify-content:center;flex:0 0 auto}
.od-user>button>svg{width:14px;height:14px;color:#7a98c5}
.od-user .od-drop{left:auto;right:0}
.od-drop a.od-danger{color:#e24b4a}
.od-drop a.od-danger:hover{background:#fcebeb}
.od-drop .od-sep{height:1px;background:#f0f4fa;margin:5px 8px}
/* barre secondaire : client + site */
.od-sub{width:100%;border-bottom:1px solid #eef2f8;background:#fbfcfe}
.od-sub-inner{display:flex;align-items:center;gap:10px;padding:8px var(--od-gutter);max-width:var(--od-maxw);margin:0 auto}
.od-client{display:inline-flex;align-items:center;gap:8px}
.od-client-btn{display:inline-flex;align-items:center;gap:7px;background:none;border:none;cursor:pointer;font:inherit;font-size:14px;font-weight:600;color:#2a5ea9;padding:5px 8px;border-radius:7px;transition:background .15s}
.od-client-btn:hover{background:#eef4fc}
.od-client-btn svg{width:15px;height:15px;flex:0 0 auto}
.od-client-btn.is-empty{color:#9bb3d1;font-weight:500;cursor:default}
#oropra-client-history{display:inline-flex;flex:0 0 auto}
#nav-root #oropra-client-history .ch-trigger svg{transform:none}
.od-site{position:relative;margin-left:auto;flex:0 0 auto}
.od-site>button{display:inline-flex;align-items:center;gap:7px;background:#fff;border:1px solid #d6e2f2;cursor:pointer;font:inherit;font-size:13px;font-weight:600;color:#2a5ea9;padding:7px 11px;border-radius:9px}
.od-site>button:hover{border-color:#acc5e4}
.od-site>button svg.od-pin{width:15px;height:15px;color:#53bda7;flex:0 0 auto}
.od-site>button svg.od-cv{width:13px;height:13px;color:#7a98c5;transition:transform .18s}
.od-site.open>button svg.od-cv{transform:rotate(180deg)}
.od-site .od-drop{left:auto;right:0;min-width:220px;max-height:320px;overflow-y:auto}
.od-site .od-drop a.is-active{background:#eef4fc;color:#2a5ea9;font-weight:700}
/* Sélecteur de périmètre : marque › affaire › site. Le décalage dit le niveau,
   le chevron plie sans choisir. Plus étroit que la liste plate parce qu'il est
   plus haut : on garde le menu utilisable sur un portable. */
.od-site .od-drop.od-perim{min-width:280px;max-height:420px;padding:4px}
.od-drop.od-perim a.od-p{padding:5px 10px;gap:4px;font-size:13px;line-height:1.35;align-items:baseline}
.od-drop.od-perim a.od-p i.od-pli{font-style:normal;width:14px;flex:0 0 14px;color:#9db2d2;font-size:10px;text-align:center}
.od-drop.od-perim a.od-p i.od-pli[data-pli]{cursor:pointer;border-radius:3px}
.od-drop.od-perim a.od-p i.od-pli[data-pli]:hover{background:#e4ecf8;color:#2a5ea9}
.od-drop.od-perim a.od-p em{font-style:normal;font-size:10.5px;color:#9db2d2;margin-left:4px}
.od-drop.od-perim a.n0{font-weight:700;color:#1F4A85}
.od-drop.od-perim a.n1{font-weight:700;font-size:11px;letter-spacing:.06em;text-transform:uppercase;color:#7a98c5}
.od-drop.od-perim a.n2{font-weight:600;padding-left:22px;color:#2a5ea9}
.od-drop.od-perim a.n3{font-weight:400;padding-left:40px;color:#42618f}
.od-drop.od-perim a.is-active{background:#eef4fc;font-weight:700;box-shadow:inset 3px 0 0 #2a5ea9}
/* burger */
.od-burger{display:none;background:none;border:none;cursor:pointer;color:#1F4A85;padding:7px;border-radius:9px;flex:0 0 auto}
.od-burger:hover{background:#f2f6fc}
.od-burger svg{width:24px;height:24px}
/* modale compte */
.od-modal-bg{position:fixed;inset:0;background:rgba(31,74,133,.45);z-index:1000;display:flex;align-items:center;justify-content:center;padding:18px}
.od-modal{background:#fff;border-radius:16px;width:380px;max-width:100%;overflow:hidden;box-shadow:0 24px 60px rgba(31,74,133,.3)}
.od-modal-head{background:#2a5ea9;color:#fff;padding:20px;display:flex;align-items:center;gap:14px}
.od-modal-head .od-avatar{width:48px;height:48px;font-size:18px;background:rgba(255,255,255,.18)}
.od-modal-head .od-mh-name{font-size:17px;font-weight:700}
.od-modal-body{padding:8px 20px 16px}
.od-row{display:flex;justify-content:space-between;gap:14px;padding:11px 0;border-top:1px solid #f1f5fb;font-size:14px}
.od-row:first-child{border-top:none}
.od-row .od-k{color:#7a98c5}
.od-row .od-v{color:#1F4A85;font-weight:600;text-align:right;word-break:break-word}
.od-modal-foot{padding:0 20px 20px;display:flex;gap:10px}
.od-modal-foot button{flex:1;padding:11px;border-radius:10px;font:inherit;font-size:14px;font-weight:600;cursor:pointer;border:1px solid #d6e2f2;background:#fff;color:#2a5ea9}
.od-modal-foot button.od-logout{border:none;background:#e24b4a;color:#fff}
@media (max-width:1024px){
  .od-bar-inner{padding:8px 14px;flex-wrap:nowrap}
  .od-logo{flex:0 1 auto;min-width:0;margin-right:8px}
  .od-burger{display:inline-flex;order:3}
  .od-user{order:2;margin-left:auto}
  .od-menus{position:absolute;top:100%;left:0;right:0;flex-direction:column;align-items:stretch;justify-content:flex-start;gap:0;background:#fff;border-bottom:1px solid #e8eef7;box-shadow:0 16px 30px rgba(31,74,133,.14);padding:8px;display:none;z-index:400}
  .od-nav.open .od-menus{display:flex}
  .od-m>button{width:100%;justify-content:flex-start;font-size:15px;padding:13px 14px}
  .od-drop{position:static;border:none;box-shadow:none;padding:0 0 6px 14px;min-width:0}
  .od-delco{width:100%;justify-content:flex-start;font-size:15px;padding:13px 14px;border-radius:0}
  .od-delco:hover{background:#f2f6fc}
  .od-sub-inner{padding:8px 14px;gap:8px;flex-wrap:wrap}
  .od-client{flex:1 1 auto;min-width:0}
  .od-client-btn{flex:1 1 auto;min-width:0;max-width:100%}
  .od-client-name{min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
  .od-site{flex:0 1 auto;max-width:48%}
  .od-site>button{padding:7px 10px}
  .od-site-name{display:inline-block;max-width:130px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;vertical-align:middle}
  .od-site .od-drop{max-width:calc(100vw - 28px)}
}
@media (max-width:560px){
  .od-bar-inner{padding:7px 11px}
  .od-sub-inner{padding:7px 11px;flex-wrap:wrap}
  .od-logo-img{height:34px}
  .od-avatar{width:30px;height:30px;font-size:12px}
  /* barre 2 empilée : client en haut, sélecteur de site dessous -> jamais de débordement */
  .od-client{flex:1 1 100%;min-width:0}
  .od-site{flex:1 1 100%;max-width:100%;margin-left:0}
  .od-site>button{width:100%;justify-content:flex-start}
  .od-site-name{flex:1 1 auto;min-width:0;max-width:none;text-align:left}
  .od-modal{width:100%}
}
</style>`;

  // ---------------------------------------------------------------- render
  function build() {
    const r = root();
    if (!r) return;
    if (r.querySelector('#onedata-nav-css') && r.getAttribute('data-nav-ver') === String(NAV_VER)) return; // déjà rendu (même version)

    let menusHtml = '';
    // Opérateur plateau (rôle 10, VROOM chez Team Colin) : il qualifie et
    // oriente des leads. Pas de pages de pilotage commercial (ventes,
    // objectifs, bilatérales, activité, import VN). Les droits sont tenus
    // en base ; ce filtre évite seulement d'ouvrir des pages vides.
    var __roleMenu = Number((user() || {}).ID_Role != null ? user().ID_Role : (user() || {}).id_role);
    var __masque = (__roleMenu === 10) ? [P.pipe, P.perf, P.objectifs, P.bilat, P.activite, P.vnConfig] : [];
    MENUS.forEach(function (m, mi) {
      if (!m.items.some(function (it) { return __masque.indexOf(it.p) === -1; })) return;
      let items = '';
      m.items.forEach(function (it) {
        if (__masque.indexOf(it.p) !== -1) return;
        items += '<a data-page="' + it.p + '">' + esc(it.t) +
          (it.badge ? '<span class="od-pill od-notifs-pill" style="display:none"></span>' : '') + '</a>';
      });
      menusHtml += '<div class="od-m" data-mi="' + mi + '"><button data-toggle="' + mi + '">' + esc(m.label) +
        (m.badge ? '<span class="od-pill od-notifs-pill" style="display:none"></span>' : '') +
        '</button><div class="od-drop">' + items + '</div></div>';
    });

    var __u = user();
    var __role = Number(__u.ID_Role != null ? __u.ID_Role : __u.id_role);
    var __delcoOk = (__role !== 4 && __role !== 9);
    var __userMenu = USER_MENU.slice();
    if (__role === 1 || __role === 8) { __userMenu.splice(__userMenu.length - 1, 0, { t: 'Administration', p: P.admin }); }
    let userItems = '';
    __userMenu.forEach(function (it) {
      if (it.t === 'Se déconnecter') userItems += '<div class="od-sep"></div>';
      var extra = it.badge ? '<span class="od-arb-badge" id="od-arb-badge" hidden></span>' : '';
      userItems += '<a ' + (it.p ? 'data-page="' + it.p + '"' : 'data-act="' + it.act + '"') + (it.danger ? ' class="od-danger"' : '') + '>' + esc(it.t) + extra + '</a>';
    });

    r.innerHTML = STYLE +
      '<div class="od-nav">' +
        '<div class="od-bar"><div class="od-bar-inner">' +
          '<div class="od-logo" data-page="' + P.accueil + '">' + (LOGO_URL ? '<img class="od-logo-img" src="' + LOGO_URL + '" alt="Oropra">' : 'Oropra') + '</div>' +
          '<button class="od-burger" data-burger>' + I.burger + '</button>' +
          '<div class="od-menus">' + menusHtml +
            // Delco réservé à l'encadrement et aux fonctions support (07/10/2026) :
            // pas de lien pour les vendeurs (4) ni les secrétaires (9). La base
            // refuse aussi Delco à ces rôles ; ce filtre évite une page vide.
            (__delcoOk ? '<a class="od-delco" id="delco-header-link">' + I.delco + '<span class="od-delco-txt">Delco</span><span id="delco-header-badge" data-state="idle"><span class="delco-header-badge-num"></span></span></a>' : '') +
            // Compteur d'arbitrage sur la barre (06/10/2026). Il ne vivait que
            // dans le menu de l'avatar, donc invisible tant qu'on ne l'ouvre pas,
            // et le bandeau — seule surface visible — se tait 30 minutes des
            // qu'on clique sa croix. Un chef des ventes avec 99 dossiers en
            // attente ne voyait alors plus rien nulle part.
            '<a class="od-arb-bar" id="od-arb-bar" hidden title="Clients à arbitrer">'
              + '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
              + '<path d="M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0z"/>'
              + '<path d="M12 9v4"/><path d="M12 17h.01"/></svg>'
              + '<span class="od-arb-bar-txt">Arbitrage</span><span id="od-arb-bar-n"></span></a>' +
          '</div>' +
          '<div class="od-user"><button class="od-user-btn" data-toggle="user" data-tip="' + esc(userFullName()) + '"><span class="od-avatar">' + esc(userInitials()) + '</span></button>' +
            '<div class="od-drop">' + userItems + '</div></div>' +
        '</div></div>' +
        '<div class="od-sub"><div class="od-sub-inner">' +
          '<span class="od-client">' +
            '<button class="od-client-btn" data-act="fiche">' + I.person + '<span class="od-client-name"></span></button>' +
            // Ancre : le loader y monte le module 'client-history'. Il vivait
            // dans auth.js et n'était initialisé qu'au login -> absent après un
            // F5 ou en navigation. Monté ici, il est présent partout.
            '<div id="oropra-client-history" data-od-module="client-history"></div>' +
          '</span>' +
          '<div class="od-site"><button data-toggle="site">' + I.pin.replace('<svg', '<svg class="od-pin"') +
            '<span class="od-site-name">Site</span></button>' +
            '<div class="od-drop"></div></div>' +
        '</div></div>' +
      '</div>';

    bind();
    r.setAttribute('data-nav-ver', String(NAV_VER));
    refreshClient();
    refreshNotifs();
    mountSite();
    watchHistoryIcon();
    kickDelco();
  }

  // ---------------------------------------------------------------- interactions
  function closeAll(except) {
    root().querySelectorAll('.od-m.open, .od-user.open, .od-site.open').forEach(function (el) { if (el !== except) el.classList.remove('open'); });
  }
  function bind() {
    const r = root();
    // dropdowns (menus, user, site)
    r.querySelectorAll('[data-toggle]').forEach(function (btn) {
      btn.addEventListener('click', function (e) {
        e.stopPropagation();
        const parent = btn.closest('.od-m, .od-user, .od-site');
        const wasOpen = parent.classList.contains('open');
        closeAll(parent);
        parent.classList.toggle('open', !wasOpen);
        if (!wasOpen && parent.classList.contains('od-user')) rafraichirBadgeArbitrage();
      });
    });
    // navigation par data-page
    r.querySelectorAll('[data-page]').forEach(function (el) {
      el.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); closeAll(); closeBurger(); goPage(el.getAttribute('data-page')); });
    });
    // actions
    r.querySelectorAll('[data-act]').forEach(function (el) {
      el.addEventListener('click', function (e) {
        e.preventDefault(); e.stopPropagation();
        const a = el.getAttribute('data-act');
        closeAll();
        if (a === 'account') openAccount();
        else if (a === 'doublons') openArbitrage();
        else if (a === 'support') { try { (wwLib.getFrontWindow && wwLib.getFrontWindow() || window).location.href = 'mailto:' + SUPPORT_MAIL; } catch (er) {} }
        else if (a === 'logout') goAuth();
        else if (a === 'fiche') { if (clientLabel()) openFicheClient(); }
      });
    });
    // burger
    const bg = r.querySelector('[data-burger]');
    if (bg) bg.addEventListener('click', function (e) { e.stopPropagation(); r.querySelector('.od-nav').classList.toggle('open'); });
    // Delco : on gère le clic nous-mêmes (l'embed externe ne fait QUE le badge/compteur)
    const delcoLink = r.querySelector('#delco-header-link');
    if (delcoLink) delcoLink.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); closeAll(); closeBurger(); goPage(P.delco); });
    const arbBar = r.querySelector('#od-arb-bar');
    if (arbBar) arbBar.addEventListener('click', function (e) { e.preventDefault(); e.stopPropagation(); closeAll(); openArbitrage(); });
    // clic dehors
    if (!window.__navOutside) {
      doc.addEventListener('mousedown', function (e) { const rr = root(); if (rr && !rr.contains(e.target)) { closeAll(); } }, true);
      window.__navOutside = true;
    }
    // mise à jour du label client quand l'embed historique change de client
    if (!window.__navClientEvt) {
      const onSel = function (e) {
        refreshClient(e && e.detail);   // immédiat via le client de l'event
        setTimeout(function () { refreshClient(); }, 150);  // relecture après MAJ de la variable
        setTimeout(function () { refreshClient(); }, 500);
      };
      window.addEventListener('oropra-client-selected', onSel);
      try { doc.addEventListener('oropra-client-selected', onSel); } catch (er) {}
      window.__navClientEvt = true;
    }
    // filet : suit la variable client en continu (au cas où l'event est manqué)
    if (!window.__navClientPoll) {
      window.__navClientPoll = setInterval(function () { refreshClient(); }, 1200);
    }

    // LE COMPTEUR SURVIT A LA RECONSTRUCTION DE LA NAV (06/10/2026).
    // build() repart d'un `r.innerHTML = …` : tout ce qui etait accroche au
    // conteneur disparait, y compris le bandeau d'arbitrage, qui y est ajoute
    // par appendChild. A chaque navigation dans le SPA la nav se reconstruit,
    // le bandeau s'evaporait donc, et rien ne le redessinait avant le prochain
    // retour sur l'onglet — d'ou un compteur present, puis absent, puis
    // present, sans que personne n'ait rien touche. On repeint ici depuis le
    // dernier compte connu : aucune requete, juste le reaffichage.
    if (arbDernierCompte != null) {
      majBadgeArbitrage(arbDernierCompte);
      afficherBandeauArbitrage(arbDernierCompte);
    }
  }
  function closeBurger() { const n = root() && root().querySelector('.od-nav'); if (n) n.classList.remove('open'); }

  // ---------------------------------------------------------------- client (barre 2)
  function refreshClient(c) {
    const el = root() && root().querySelector('.od-client-name');
    const btn = root() && root().querySelector('.od-client-btn');
    if (!el || !btn) return;
    const lbl = (c ? clientLabelFrom(c) : null) || clientLabel();
    const next = lbl || 'Aucun client sélectionné';
    if (el.textContent === next) return; // pas de changement -> rien à faire
    el.textContent = next;
    btn.classList.toggle('is-empty', !lbl);
  }

  // ---------------------------------------------------------------- icône historique (forçage)
  // Remplace l'icône du déclencheur de l'embed historique par une icône "historique"
  // (horloge + flèche), quelle que soit la version de l'embed, et re-applique à chaque rendu.
  function fixHistoryIcon() {
    const r = root(); if (!r) return;
    const trg = r.querySelector('#oropra-client-history .ch-trigger');
    if (!trg || trg.getAttribute('data-od-icon') === 'clock') return;
    trg.innerHTML = '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 3v5h5"/><path d="M3.05 13A9 9 0 1 0 6 5.3L3 8"/><path d="M12 7v5l3 3"/></svg>';
    trg.setAttribute('data-od-icon', 'clock');
  }
  function watchHistoryIcon() {
    const r = root(); if (!r) return;
    const host = r.querySelector('#oropra-client-history');
    if (!host) return;
    try { if (window.__navHistoMO) window.__navHistoMO.disconnect(); } catch (e) {}
    try {
      const mo = new MutationObserver(function () { fixHistoryIcon(); });
      mo.observe(host, { childList: true, subtree: true });
      window.__navHistoMO = mo;
    } catch (e) {}
    fixHistoryIcon();
  }

  // ---------------------------------------------------------------- badge Clients/Notifs
  // Le nombre vient de la variable historique ; l'ETAT (calme / tiede / chaud)
  // vient de notif-badge v2, qui le pose dans window.__odNotifFeu. Si ce module
  // n'est pas charge, feu() rend null et la pastille garde son rouge d'origine.
  function feu() {
    try {
      var w = (wwLib.getFrontWindow && wwLib.getFrontWindow()) || window;
      return w.__odNotifFeu || window.__odNotifFeu || null;
    } catch (e) { return window.__odNotifFeu || null; }
  }
  function refreshNotifs() {
    const f = feu();
    const n = f ? Number(f.n || 0) : Number(getVar(VAR_NB_NOTIFS) || 0);
    const txt = n > 99 ? '99+' : String(n);
    (root() ? root().querySelectorAll('.od-notifs-pill') : []).forEach(function (p) {
      if (n > 0) { p.textContent = txt; p.style.display = ''; } else { p.style.display = 'none'; }
      if (f && f.feu) { p.setAttribute('data-feu', f.feu); } else { p.removeAttribute('data-feu'); }
      // Le nombre est une SOMME : les clients qui attendent, plus les relances
      // promises et non tenues. Sans ce survol, on lit « 3 » en face d'un
      // onglet qui dit « 1 » et on croit a un bug.
      if (f && f.detail) {
        var d = f.detail, parts = [];
        if (Number(d.dettes || 0) > 0)
          parts.push(d.dettes + (d.dettes > 1 ? ' personnes attendent une reponse'
                                              : ' personne attend une reponse'));
        if (Number(d.relances_en_retard || 0) > 0)
          parts.push(d.relances_en_retard + (d.relances_en_retard > 1
            ? ' relances en retard' : ' relance en retard'));
        p.setAttribute('title', parts.length ? parts.join(' \u00b7 ') : 'Rien en attente');
      } else { p.removeAttribute('title'); }
      // Le battement ne signale que du NOUVEAU depuis le dernier passage sur la
      // page. Il s'arrete quand on a regarde ; la couleur, elle, ne bouge pas.
      if (f && f.nouveau && f.feu === 'chaud') { p.setAttribute('data-bat', '1'); }
      else { p.removeAttribute('data-bat'); }
    });
  }
  if (!window.__navNotifsPoll) { window.__navNotifsPoll = setInterval(refreshNotifs, 20000); }
  // Repeindre des que notif-badge a du neuf, sans attendre le cycle de 20 s.
  if (!window.__navNotifsFeuBound) {
    window.__navNotifsFeuBound = true;
    try {
      var _wf = (wwLib.getFrontWindow && wwLib.getFrontWindow()) || window;
      _wf.addEventListener('oropra-notif-feu', function () { refreshNotifs(); });
      if (_wf !== window) window.addEventListener('oropra-notif-feu', function () { refreshNotifs(); });
      (wwLib.getFrontDocument ? wwLib.getFrontDocument() : document)
        .addEventListener('oropra-notif-feu', function () { refreshNotifs(); });
    } catch (e) {}
  }

  // ---------------------------------------------------------------- site selector
  // La nav ne fait que LIRE le site-bus (window.oropraSite). Toute la logique de
  // récupération est concentrée dans UN SEUL heartbeat persistant (jamais tué) +
  // un renderSiteState IDEMPOTENT qui ne casse plus aucune chaîne de retry. Fini
  // les dead-ends silencieux et les filets (poll 15s / flags persistants) qui
  // cédaient ensemble sur un login malchanceux -> "Site" vide + dropdown vide.
  function getSiteApi() {
    try {
      const w = (wwLib.getFrontWindow && wwLib.getFrontWindow()) || window;
      return w.oropraSite || window.oropraSite || null;
    } catch (e) { return window.oropraSite || null; }
  }
  function siteName(api, id) {
    const sites = api && api.getSites && api.getSites();
    if (!sites || id == null) return null;
    const s = sites.find(function (x) { return String(x.id_site) === String(id); });
    return s ? s.site : null;
  }

  // --- Périmètre arborescent (bus v3) ----------------------------------------
  // Le bus v2 ne connaît que setSiteId : on le détecte et on retombe sur la
  // liste plate, plutôt que d'afficher un arbre dont les branches ne feraient
  // rien. Les deux modules peuvent donc être déployés séparément.
  function busPorteLePerimetre(api) {
    return !!(api && typeof api.setPerimetre === 'function' && typeof api.getPerimetre === 'function');
  }
  // Pliage : mémorisé sur window pour survivre aux reconstructions du menu.
  function plis() {
    if (!window.__navPlisPerim) window.__navPlisPerim = {};
    return window.__navPlisPerim;
  }
  // marque › affaire › site, dans l'ordre alphabétique. Les sites sans marque
  // (logistique) finissent la liste plutôt que d'ouvrir le menu.
  function arbrePerim(sites) {
    const marques = [];
    (sites || []).forEach(function (x) {
      const mk = x.reseau || '__sans';
      let m = marques.find(function (y) { return y.k === mk; });
      if (!m) { m = { k: mk, lab: x.reseau || 'Sans marque', aff: [] }; marques.push(m); }
      const ak = x.affaire || '__sans';
      let a = m.aff.find(function (y) { return y.k === ak; });
      if (!a) { a = { k: ak, lab: x.affaire || 'Sans affaire', sites: [] }; m.aff.push(a); }
      a.sites.push(x);
    });
    marques.sort(function (a, b) {
      if (a.k === '__sans') return 1; if (b.k === '__sans') return -1;
      return String(a.lab).localeCompare(String(b.lab), 'fr');
    });
    marques.forEach(function (m) {
      m.aff.sort(function (a, b) { return String(a.lab).localeCompare(String(b.lab), 'fr'); });
      m.aff.forEach(function (a) {
        a.sites.sort(function (x, y) { return String(x.site).localeCompare(String(y.site), 'fr'); });
      });
    });
    return marques;
  }
  // Un échelon qui n'offre aucun choix n'est pas un échelon : il est sauté.
  // Un seul réseau, ou une affaire qui ne contient qu'un site, produisait une
  // ligne qui ne faisait que répéter la suivante. C'est ce qui rend le même
  // sélecteur lisible pour un chef des ventes à deux sites et pour un
  // directeur de groupe qui en a vingt-sept.
  function htmlPerim(sites, perim) {
    const p = perim || { level: 'site', key: null };
    const estSel = function (lv, k) {
      return p.level === lv && String(p.key == null ? '' : p.key) === String(k);
    };
    const ligne = function (lv, k, lab, cls, pliable, ouvert, suffixe) {
      return '<a class="od-p ' + cls + (estSel(lv, k) ? ' is-active' : '') + '"'
        + ' data-lv="' + esc(lv) + '" data-k="' + esc(k == null ? '' : k) + '"'
        + ' data-lab="' + esc(lab) + '">'
        + (pliable
            ? '<i class="od-pli" data-pli="' + esc(lv + ':' + k) + '">' + (ouvert ? '\u25be' : '\u25b8') + '</i>'
            : '<i class="od-pli"></i>')
        + '<span>' + esc(lab) + '</span>'
        + (suffixe ? '<em>' + esc(suffixe) + '</em>' : '') + '</a>';
    };
    const marques = arbrePerim(sites);
    const plusieursReseaux = marques.length > 1;
    // Le repliage ne vaut que pour un petit périmètre. Au-delà de sept sites,
    // l'arbre reste complet : sauter une affaire à site unique ferait apparaître
    // un site au milieu des affaires, et on ne saurait plus ce qu'on lit.
    const compact = sites.length < 7;
    let h = ligne('all', '', 'Tout mon périmètre', 'n0', false, false, '');
    marques.forEach(function (m) {
      const nSites = m.aff.reduce(function (a, x) { return a + x.sites.length; }, 0);
      const rendreR = compact ? (plusieursReseaux && nSites > 1) : true;
      let d = 1;
      if (rendreR) {
        const pk = 'reseau:' + m.k, ouv = plis()[pk] !== false;
        h += ligne('reseau', m.k, m.lab, 'n1', true, ouv, '');
        if (!ouv) return;
        d = 2;
      }
      const plusieursAff = m.aff.length > 1;
      m.aff.forEach(function (a) {
        const rendreA = compact ? (plusieursAff && a.sites.length > 1) : true;
        let d2 = d;
        if (rendreA) {
          const ak = 'affaire:' + a.k, aouv = plis()[ak] === true;
          h += ligne('affaire', a.k, a.lab, 'n' + d, true, aouv, '');
          if (!aouv) return;
          d2 = d + 1;
        }
        const cls = 'n' + Math.min(d2, 3);
        a.sites.forEach(function (x) {
          h += ligne('site', x.id_site, x.site, cls, false, false,
                     (x.type_site && x.type_site !== 'vente') ? x.type_site : '');
        });
      });
    });
    return h;
  }
  // Rend l'état SI les données sont là. Ne casse JAMAIS de chaîne : en cas
  // d'indispo transitoire (api/DOM absents, sites vides) -> renvoie false, le
  // heartbeat rappellera. Idempotent via une signature -> coût négligeable par
  // battement + ne reconstruit pas le DOM (et ne ferme pas un menu ouvert).
  function renderSiteState() {
    const api = getSiteApi();
    const r = root();
    if (!api || !r) return false;
    const box = r.querySelector('.od-site');
    const nameEl = r.querySelector('.od-site-name');
    const drop = r.querySelector('.od-site .od-drop');
    if (!box || !nameEl || !drop) return false;
    const sites = (api.getSites && api.getSites()) || [];
    if (!sites.length) return false; // pas encore chargé -> heartbeat rappellera
    const curId = api.getSiteId && api.getSiteId();

    // Débranché : voir PERIM_EN_TOPNAV en tête de module.
    const arbo = PERIM_EN_TOPNAV && busPorteLePerimetre(api) && sites.length >= 2;
    const perim = arbo ? (api.getPerimetre() || { level: 'site', key: curId }) : null;

    const sig = (arbo ? 'A' : 'P') + '|' + (perim ? perim.level + ':' + perim.key : String(curId))
      + '|' + sites.map(function (s) { return s.id_site; }).join(',')
      + '|' + (arbo ? JSON.stringify(plis()) : '');
    if (box.getAttribute('data-sig') === sig) return true;   // déjà à jour
    if (box.classList.contains('open') && box.getAttribute('data-sig')) {
      // Un menu ouvert ne se reconstruit que si l'utilisateur vient d'y plier
      // une branche — sinon il se refermerait sous ses doigts.
      if (box.getAttribute('data-sig').split('|')[3] === sig.split('|')[3]) return true;
    }

    // Sans libellé, le niveau décide : un périmètre « site » non étiqueté doit
    // afficher le nom du site, pas « Tout mon périmètre ».
    nameEl.textContent = arbo
      ? (perim.label || (perim.level === 'site'
           ? (siteName(api, perim.key) || siteName(api, curId) || 'Site')
           : 'Tout mon périmètre'))
      : (siteName(api, curId) || (curId != null ? ('Site ' + curId) : 'Site'));

    if (arbo) {
      drop.classList.add('od-perim');
      drop.innerHTML = htmlPerim(sites, perim);
      drop.querySelectorAll('a.od-p').forEach(function (a) {
        a.addEventListener('click', function (e) {
          e.preventDefault(); e.stopPropagation();
          // Le chevron plie, le reste de la ligne choisit.
          const cible = e.target;
          if (cible && cible.classList && cible.classList.contains('od-pli')) {
            const cle = cible.getAttribute('data-pli');
            if (cle) {
              const ouvertParDefaut = cle.indexOf('reseau:') === 0;
              const etat = plis()[cle];
              plis()[cle] = (etat === undefined) ? !ouvertParDefaut : !etat;
              renderSiteState();
            }
            return;
          }
          const lv = a.getAttribute('data-lv');
          const k = a.getAttribute('data-k');
          const lab = a.getAttribute('data-lab');
          try {
            api.setPerimetre({ level: lv, key: lv === 'all' ? null : (lv === 'site' ? Number(k) : k), label: lab });
          } catch (er) { console.error('[nav] setPerimetre', er); }
          box.classList.remove('open');
          renderSiteState();
        });
      });
    } else {
      drop.classList.remove('od-perim');
      drop.innerHTML = sites.slice().sort(function (a, b) {
        return String(a.site).localeCompare(String(b.site), 'fr');
      }).map(function (s) {
        return '<a data-site="' + s.id_site + '"' + (String(s.id_site) === String(curId) ? ' class="is-active"' : '') + '>' + esc(s.site) + '</a>';
      }).join('');
      drop.querySelectorAll('[data-site]').forEach(function (a) {
        a.addEventListener('click', function (e) {
          e.preventDefault(); e.stopPropagation();
          const id = Number(a.getAttribute('data-site'));
          try { api.setSiteId(id); } catch (er) {}
          box.classList.remove('open');
          renderSiteState();
        });
      });
    }
    box.setAttribute('data-sig', sig);
    return true;
  }
  // (Ré)abonne si l'instance oropraSite a changé (site-bus ré-init après login).
  function subscribeSite() {
    const api = getSiteApi();
    if (!api || !api.onChange) return;
    if (window.__navSiteApi === api) return; // déjà abonné à CETTE instance
    try { if (typeof window.__navSiteUnsub === 'function') window.__navSiteUnsub(); } catch (e) {}
    try {
      const h = api.onChange(function () { renderSiteState(); });
      window.__navSiteUnsub = (typeof h === 'function') ? h : null;
    } catch (e) {}
    window.__navSiteApi = api;
  }
  // UN SEUL heartbeat persistant, jamais tué : couvre login lent, re-mount du
  // header, ré-init du site-bus et changement d'instance. renderSiteState étant
  // idempotent (signature), le coût par battement est négligeable.
  function mountSite() {
    subscribeSite();
    if (!window.__navSiteEvt) {
      try { doc.addEventListener('oropra-site-changed', renderSiteState); } catch (e) {}
      try { window.addEventListener('oropra-site-changed', renderSiteState); } catch (e) {}
      window.__navSiteEvt = true;
    }
    renderSiteState();
    if (!window.__navSiteBeat) {
      window.__navSiteBeat = setInterval(function () {
        subscribeSite();
        renderSiteState();
      }, 800);
    }
  }

  // ---------------------------------------------------------------- modale "Mon compte"
  function openAccount() {
    closeBurger();
    const u = user();
    const fullName = [pick(u, ['prenom', 'Prenom', 'PRENOM']), pick(u, ['nom', 'Nom', 'NOM'])].filter(Boolean).join(' ') || pick(u, ['nomComplet', 'nom_complet_affichage']) || 'Mon compte';
    const email = pick(u, ['email', 'Email', 'mail', 'EMAIL']);
    const tel = pick(u, ['N_de_telephone', 'telephone', 'tel', 'phone', 'voip_number']);
    const api = getSiteApi();
    const site = api ? siteName(api, api.getSiteId && api.getSiteId()) : null;

    let rows = '';
    if (email) rows += '<div class="od-row"><span class="od-k">Email</span><span class="od-v">' + esc(email) + '</span></div>';
    if (tel) rows += '<div class="od-row"><span class="od-k">Téléphone</span><span class="od-v">' + esc(tel) + '</span></div>';
    if (site) rows += '<div class="od-row"><span class="od-k">Site</span><span class="od-v">' + esc(site) + '</span></div>';
    if (!rows) rows = '<div class="od-row"><span class="od-k">Compte</span><span class="od-v">' + esc(fullName) + '</span></div>';

    const bg = doc.createElement('div'); bg.className = 'od-modal-bg';
    bg.innerHTML = STYLE +
      '<div class="od-modal">' +
        '<div class="od-modal-head"><span class="od-avatar">' + esc(userInitials()) + '</span><div><div class="od-mh-name">' + esc(fullName) + '</div></div></div>' +
        '<div class="od-modal-body">' + rows + '</div>' +
        '<div class="od-modal-foot"><button data-close>Fermer</button><button class="od-logout" data-logout>Se déconnecter</button></div>' +
      '</div>';
    bg.addEventListener('mousedown', function (e) { if (e.target === bg) bg.remove(); });
    bg.querySelector('[data-close]').addEventListener('click', function () { bg.remove(); });
    bg.querySelector('[data-logout]').addEventListener('click', function () { bg.remove(); goAuth(); });
    doc.body.appendChild(bg);
  }

  const ARB_STYLE = '<style id="od-arb-css">' +
'.od-arb-bg{align-items:flex-start;padding:40px 18px;overflow:auto}' +
'.od-arb-modal{background:#fff;border-radius:20px;width:680px;max-width:100%;overflow:hidden;box-shadow:0 24px 70px -18px rgba(31,74,133,.4);font-family:"Nunito Sans",system-ui,sans-serif;color:#1F4A85}' +
'.od-arb-modal *{box-sizing:border-box}' +
'.od-arb-head{display:flex;align-items:center;gap:14px;padding:18px 22px 15px;border-bottom:1px solid #e8eef7}' +
'.od-arb-ic{width:40px;height:40px;border-radius:11px;background:#2a5ea9;display:flex;align-items:center;justify-content:center;color:#fff;flex:0 0 auto}' +
'.od-arb-ic svg{width:21px;height:21px}' +
'.od-arb-htxt{flex:1 1 auto;min-width:0}.od-arb-htxt h1{font-size:17px;font-weight:900;margin:0;letter-spacing:-.02em}.od-arb-htxt p{margin:2px 0 0;font-size:12px;color:#7a98c5}' +
'.od-arb-x{width:32px;height:32px;border-radius:8px;border:none;background:none;color:#7a98c5;font-size:20px;cursor:pointer;flex:0 0 auto}.od-arb-x:hover{background:#f7f9fc;color:#1F4A85}' +
'.od-arb-load{padding:50px 24px;text-align:center;color:#7a98c5;font-size:13.5px}' +
'.od-arb-erru{margin:12px 22px 0;padding:10px 14px;background:#fcebeb;border:1px solid #f3d4d4;color:#e24b4a;border-radius:10px;font-size:12.5px;font-weight:600}' +
'.od-arb-info{margin:12px 22px 0;padding:10px 14px;background:#eef4fb;border:1px solid #e3edf9;color:#2a5ea9;border-radius:10px;font-size:12.5px;font-weight:600}' +
'.od-arb-ruban{display:flex;align-items:center;gap:12px;padding:11px 22px;background:#f7f9fc;border-bottom:1px solid #e8eef7;font-size:12px;color:#7a98c5;font-weight:600}' +
'.od-arb-ruban .reste{color:#1F4A85;font-weight:800;font-size:14px}' +
'.od-arb-jauge{flex:1 1 auto;height:6px;border-radius:99px;background:#e8eef7;overflow:hidden}.od-arb-jauge i{display:block;height:100%;background:#53bda7;border-radius:99px;transition:width .4s cubic-bezier(.3,.8,.3,1)}' +
'.od-arb-mini{display:flex;gap:14px}.od-arb-mini b{color:#3a8d7b}.od-arb-mini .r b{color:#7a98c5}' +
'.od-arb-pile{position:relative;padding:22px}' +
'.od-arb-ghost{position:absolute;left:22px;right:22px;top:22px;height:170px;border-radius:15px;background:#fff;border:1px solid #e8eef7}' +
'.od-arb-ghost.g1{transform:translateY(9px) scale(.97);opacity:.6;z-index:1}.od-arb-ghost.g2{transform:translateY(18px) scale(.945);opacity:.35;z-index:0}' +
'.od-arb-carte{position:relative;z-index:2;background:#fff;border:1px solid #e8eef7;border-radius:15px;box-shadow:0 12px 32px -14px rgba(31,74,133,.22);overflow:hidden;animation:odArbMonte .42s cubic-bezier(.2,.7,.3,1)}' +
'@keyframes odArbMonte{from{transform:translateY(24px) scale(.97);opacity:0}to{transform:none;opacity:1}}' +
'.od-arb-carte.partir-fusion{animation:odArbFus .5s forwards cubic-bezier(.4,0,.6,1)}@keyframes odArbFus{to{transform:translateY(-38px) scale(.9);opacity:0}}' +
'.od-arb-carte.partir-rejet{animation:odArbRej .45s forwards ease-in}@keyframes odArbRej{to{transform:translateX(56px) rotate(4deg);opacity:0}}' +
'.od-arb-carte.partir-report{animation:odArbRep .45s forwards ease-in}@keyframes odArbRep{to{transform:translateY(56px) scale(.94);opacity:0}}' +
'.od-arb-mtf{display:flex;align-items:center;gap:9px;padding:12px 18px;background:#f7f9fc;border-bottom:1px solid #e8eef7;flex-wrap:wrap}' +
'.od-arb-force{font-size:10.5px;font-weight:900;letter-spacing:.05em;padding:4px 9px;border-radius:6px;text-transform:uppercase}.od-arb-force.fort{background:#eaf7f4;color:#3a8d7b}.od-arb-force.moyen{background:#fdf6e6;color:#8a5e08}' +
'.od-arb-mtf .sur{font-size:12px;color:#7a98c5}' +
'.od-arb-tag{font-size:11px;font-weight:700;background:#fff;border:1px solid #e8eef7;color:#7a98c5;padding:3px 9px;border-radius:99px}.od-arb-tag.pos{border-color:#bce4db;color:#3a8d7b;background:#eaf7f4}.od-arb-tag.neg{border-color:#f3d4d4;color:#e24b4a;background:#fcebeb}' +
'.od-arb-simple{padding:20px 22px}.od-arb-simple .duo{display:flex;border:1px solid #e8eef7;border-radius:13px;overflow:hidden}' +
'.od-arb-simple .mini{flex:1;padding:15px 17px}.od-arb-simple .mini.a{background:#eef4fc}.od-arb-simple .mini.b{background:#eaf7f4}' +
'.od-arb-simple .ref{font-size:10.5px;font-weight:800;letter-spacing:.03em;margin-bottom:6px}.od-arb-simple .mini.a .ref{color:#2a5ea9}.od-arb-simple .mini.b .ref{color:#53bda7}' +
'.od-arb-simple .n{font-size:15px;font-weight:800;margin-bottom:2px}.od-arb-simple .l{font-size:12px;color:#5a72a0}' +
'.od-arb-simple .fleche{display:flex;align-items:center;justify-content:center;padding:0 5px;background:#fff;color:#53bda7}.od-arb-simple .fleche svg{width:21px;height:21px}' +
'.od-arb-simple .verdict{margin-top:15px;text-align:center;font-size:13px;color:#5a72a0}.od-arb-simple .verdict b{color:#1F4A85}' +
'.od-arb-peint{padding:18px 22px}.od-arb-peint .intro{font-size:12px;color:#7a98c5;margin:0 0 15px;text-align:center}.od-arb-peint .intro b{color:#1F4A85}' +
'.od-arb-res{border:1.5px solid #bce4db;border-radius:13px;padding:15px 17px;margin-bottom:17px;background:#eaf7f4;position:relative}' +
'.od-arb-res::before{content:"FICHE FINALE";position:absolute;top:-9px;left:15px;background:#53bda7;color:#fff;font-size:9px;font-weight:900;letter-spacing:.08em;padding:2px 8px;border-radius:5px}' +
'.od-arb-res .rg{display:grid;grid-template-columns:1fr 1fr;gap:7px 18px;margin-top:3px}' +
'.od-arb-res .rc{display:flex;flex-direction:column;gap:1px}.od-arb-res .rk{font-size:10px;font-weight:700;color:#7a98c5;text-transform:uppercase;letter-spacing:.03em}' +
'.od-arb-res .rv{font-size:13px;font-weight:600;min-height:18px}.od-arb-res .rv.vide{color:#7a98c5;opacity:.6;font-weight:400;font-style:italic}' +
'.od-arb-res .pin{display:inline-block;width:7px;height:7px;border-radius:99px;margin-right:6px;vertical-align:1px}.od-arb-res .pin.a{background:#2a5ea9}.od-arb-res .pin.b{background:#53bda7}' +
'.od-arb-peint .ct{font-size:11px;font-weight:800;color:#7a98c5;text-transform:uppercase;letter-spacing:.04em;margin:0 0 7px}' +
'.od-arb-peint .ct + .od-arb-cols{margin-top:0}.od-arb-peint .od-arb-cf + .ct{margin-top:14px}' +
// minmax(0,1fr) et non 1fr : `1fr` vaut `minmax(auto,1fr)`, donc chaque colonne
// garde un plancher a la largeur de son contenu insecable. Comme chaque ligne
// est une grille independante, un e-mail ou une adresse longue elargissait sa
// colonne sur SA ligne seulement — d'ou des colonnes qui ne tombaient pas en
// face. Avec un plancher a zero, les quatre colonnes se resolvent a l'identique
// sur toutes les lignes, en-tete compris.
'.od-arb-cf{display:grid;grid-template-columns:74px minmax(0,1fr) minmax(0,1fr) minmax(0,1fr);gap:6px;align-items:stretch;margin-bottom:6px}.od-arb-cf .ck{display:flex;align-items:center;font-size:12px;font-weight:700;color:#5a72a0}' +
'.od-arb-opt{display:flex;align-items:center;min-width:0;border:2px solid #e8eef7;border-radius:10px;padding:8px 22px 8px 10px;text-align:left;background:#fff;cursor:pointer;position:relative;transition:.15s;font-family:inherit;min-height:40px}.od-arb-opt:hover{border-color:#acc5e4}' +
'.od-arb-opt .ov{font-size:13px;font-weight:700;color:#1F4A85;min-width:0;word-break:normal;overflow-wrap:anywhere;hyphens:none;line-height:1.25}.od-arb-opt .ov.vide{color:#7a98c5;opacity:.6;font-weight:400;font-style:italic;white-space:nowrap}' +
'.od-arb-cols{margin-bottom:3px}.od-arb-cols .he{font-size:10px;font-weight:700;letter-spacing:.03em;text-transform:uppercase;padding-left:10px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
'.od-arb-cols .he.a{color:#2a5ea9}.od-arb-cols .he.b{color:#53bda7}.od-arb-cols .he.c{color:#d2941f}' +
'.od-arb-opt.a[aria-pressed="true"]{border-color:#2a5ea9;background:#eef4fc}.od-arb-opt.b[aria-pressed="true"]{border-color:#53bda7;background:#eaf7f4}' +
'.od-arb-opt[aria-pressed="true"]::after{content:"\\2713";position:absolute;top:50%;right:7px;transform:translateY(-50%);font-size:11px;font-weight:900}' +
'.od-arb-opt.a[aria-pressed="true"]::after{color:#2a5ea9}.od-arb-opt.b[aria-pressed="true"]::after{color:#53bda7}.od-arb-opt.c[aria-pressed="true"]::after{color:#d2941f}' +
// Saisie libre : troisieme ligne sous les deux propositions, en orange de la
// charte pour la distinguer de l'existante (bleu) et de la source (vert).
'.od-arb-opt.c{display:flex;align-items:center;padding:5px 20px 5px 6px;cursor:default}' +
'.od-arb-opt.c[aria-pressed="true"]{border-color:#d2941f;background:#fdf6e9}' +
'.od-arb-si{flex:1 1 auto;width:100%;min-width:0;border:1px solid #cfdcef;border-radius:7px;padding:5px 6px;font-size:12px;font-weight:700;color:#1F4A85;background:#fff;font-family:inherit}' +
'.od-arb-si:focus{outline:none;border-color:#d2941f;box-shadow:0 0 0 2px rgba(210,148,31,.18)}' +
'.od-arb-nat-a{margin:-1px 0 10px 74px;font-size:11px;font-weight:700;color:#c0524f}' +
'.od-arb-bg .od-arb-info{position:fixed;top:16px;left:50%;transform:translateX(-50%);z-index:100001;max-width:min(560px,92vw);background:#eaf7f4;border:1px solid #53bda7;color:#1F4A85;border-radius:10px;padding:10px 14px;font-size:13px;font-weight:700;box-shadow:0 6px 18px rgba(31,74,133,.18);display:flex;align-items:center;gap:4px;flex-wrap:wrap}' +
'.od-arb-info-lien{margin-left:10px;border:none;background:none;padding:0;font:inherit;font-weight:800;color:#2a5ea9;text-decoration:underline;cursor:pointer}' +
'.od-arb-info-lien:hover{color:#1F4A85}' +
'.od-arb-id{margin-top:5px}.od-arb-id summary{font-size:12px;color:#7a98c5;cursor:pointer;padding:8px 0;font-weight:600;list-style:none}.od-arb-id summary::-webkit-details-marker{display:none}.od-arb-id summary::before{content:"▸ ";color:#acc5e4}.od-arb-id[open] summary::before{content:"▾ "}' +
'.od-arb-id .idr{display:grid;grid-template-columns:90px 1fr;gap:9px;font-size:12px;padding:4px 0;color:#5a72a0}.od-arb-id .idk{font-weight:700;color:#7a98c5}' +
'.od-arb-act{display:flex;gap:9px;padding:15px 22px;border-top:1px solid #e8eef7;background:#f7f9fc}' +
'.od-arb-b{flex:1;padding:12px 14px;border-radius:11px;font-size:13.5px;font-weight:800;display:inline-flex;align-items:center;justify-content:center;gap:7px;cursor:pointer;border:none;font-family:inherit;transition:.15s}.od-arb-b svg{width:16px;height:16px}.od-arb-b:disabled{opacity:.5;cursor:default}' +
'.od-arb-b.fusion{background:#53bda7;color:#fff;flex:1.6}.od-arb-b.fusion:hover:not(:disabled){background:#48ad98}' +
'.od-arb-b.rejet{background:#fff;border:1.5px solid #e8eef7;color:#5a72a0}.od-arb-b.rejet:hover:not(:disabled){border-color:#e24b4a;color:#e24b4a;background:#fcebeb}' +
'.od-arb-b.report{background:#fff;border:1.5px solid #e8eef7;color:#5a72a0}.od-arb-b.report:hover:not(:disabled){border-color:#fac055;color:#8a5e08;background:#fdf6e6}' +
'.od-arb-vide{padding:60px 30px;text-align:center}.od-arb-vide .ok{width:64px;height:64px;border-radius:50%;background:#eaf7f4;display:flex;align-items:center;justify-content:center;margin:0 auto 16px;color:#53bda7}.od-arb-vide .ok svg{width:30px;height:30px}' +
'.od-arb-vide h2{font-size:18px;font-weight:900;margin:0 0 6px}.od-arb-vide p{color:#7a98c5;margin:0;font-size:13px}' +
'.od-arb-badge{display:inline-flex;align-items:center;justify-content:center;min-width:18px;height:18px;padding:0 5px;margin-left:auto;background:#e24b4a;color:#fff;font-size:11px;font-weight:800;border-radius:99px}' +
'@media(max-width:620px){.od-arb-modal{width:100%}.od-arb-res .rg{grid-template-columns:1fr}.od-arb-cf{grid-template-columns:1fr;gap:5px}.od-arb-cols{display:none}.od-arb-act{flex-wrap:wrap}.od-arb-b{flex:1 1 100%}}' +
'</style>';



  // ================================================================
  //  ARBITRAGE DES DOUBLONS  — modale, dans le menu utilisateur
  //  Câblé sur : client_file_arbitrage, client_arbitrage_detail,
  //  client_arbitrer. Périmètre géré côté RPC.
  // ================================================================
  const ARB_CHAMPS = [
    ['nature','Nature'],
    ['civilite','Civilité'], ['nom','Nom'], ['prenom','Prénom'],
    ['mobile','Portable'], ['email','E-mail'], ['adresse','Adresse'],
    ['code_postal','Code postal'], ['ville','Ville'], ['naissance','Naissance']
  ];
  const ARB_LIB = {
    siret_identique:'même SIRET', mobile_identique:'même portable',
    email_identique:'même e-mail', fixe_identique:'même fixe',
    nom_prenom_exact:'même nom et prénom', nom_prenom_inverses:'nom et prénom inversés',
    nom_trigram:'nom très proche', naissance_identique:'même naissance',
    naissance_differente:'naissances différentes', insee_identique:'même commune',
    adresse_trigram:'adresse très proche', email_different:'e-mails différents',
    nature_differente:'société vs particulier', vin_commun:'même véhicule'
  };

  function arbSb() {
    try { return wwLib.wwPlugins && wwLib.wwPlugins.supabase && wwLib.wwPlugins.supabase.instance; }
    catch (e) { return null; }
  }
  function arbUserId() {
    const u = user();
    const v = pick(u, ['ID_User','id_user','ID_USER']);
    return v !== '' ? Number(v) : null;
  }
  // Affichage seulement : la base et l'envoi gardent l'ISO (aaaa-mm-jj), c'est
  // l'ecran qui parle francais. Ne touche jamais a la valeur transmise, qui est
  // relue depuis la fiche et non depuis le texte affiche.
  function arbAff(k, v) {
    if (k !== 'naissance' || !v) return v;
    const m = String(v).match(/^(\d{4})-(\d{2})-(\d{2})/);
    return m ? (m[3] + '/' + m[2] + '/' + m[1]) : v;
  }
  function arbVal(f, k) {
    // La nature n'est pas une colonne mais un booleen (idmultivu = 1). On la
    // presente comme un champ ordinaire pour qu'elle se tranche comme les autres.
    if (k === 'nature') return f ? (f.societe ? 'Société' : 'Particulier') : '';
    return f && f[k] != null ? String(f[k]).trim() : '';
  }
  function arbNom(f) { return [f.civilite, f.nom, (f.societe ? '' : f.prenom)].filter(Boolean).join(' '); }

  // ---- badge compteur dans le menu -------------------------------
  function majBadgeArbitrage(n) {
    const r = root(); if (!r) return;
    const texte = n > 99 ? '99+' : String(n);
    const el = r.querySelector('#od-arb-badge');
    if (el) { if (n > 0) { el.textContent = texte; el.hidden = false; } else { el.hidden = true; } }
    const bar = r.querySelector('#od-arb-bar'), barN = r.querySelector('#od-arb-bar-n');
    if (bar && barN) { if (n > 0) { barN.textContent = texte; bar.hidden = false; } else { bar.hidden = true; } }
  }
  // Comptage unique, partage par le badge et le bandeau.
  // Le badge n'affiche qu'un nombre : client_file_arbitrage_compte s'arrete au
  // comptage et ne construit pas les 198 apercus clients que la fonction
  // complete fabriquait pour rien (8 a 11 ms contre 27 a 319 pour un encadrant).
  //
  // 06/10/2026 — UN ECHEC NE DOIT PLUS EFFACER L'AFFICHAGE. Le code rendait la
  // main sur `if (error) return;` : badge et bandeau disparaissaient sans un
  // mot. Releve dans les journaux la nuit du 05 au 06/10 : trois reponses 500
  // en une heure, toutes des depassements du statement_timeout de 8 s pendant
  // que la tache planifiee bacs_a_relire_rafraichir saturait l'instance. La
  // cause est corrigee en base, mais l'ecran ne doit pas dependre de sa bonne
  // sante : on rend null (= « je ne sais pas »), l'appelant laisse alors
  // l'affichage en l'etat, et on reessaie deux fois, a 20 puis 40 secondes.
  let arbDernierCompte = null;
  async function arbCompter(essai) {
    essai = essai || 1;
    const sb = arbSb(), uid = arbUserId();
    if (!sb || uid == null) return null;
    try {
      const { data, error } = await sb.rpc('client_file_arbitrage_compte', { p_id_user: uid, p_statut: 'en_attente', p_plafond: 99 });
      if (error) throw error;
      arbDernierCompte = Number(data) || 0;
      return arbDernierCompte;
    } catch (e) {
      if (essai < 3) {
        setTimeout(function () {
          arbCompter(essai + 1).then(function (n) {
            if (n == null) return;
            majBadgeArbitrage(n);
            afficherBandeauArbitrage(n);
          });
        }, essai * 20000);
      }
      return null;
    }
  }
  async function rafraichirBadgeArbitrage() {
    // On exigeait la presence du badge du menu de l'avatar pour seulement
    // compter. Depuis que le compteur vit aussi sur la barre, il suffit que la
    // nav soit la.
    if (!root()) return;
    const n = await arbCompter();
    if (n != null) majBadgeArbitrage(n);
  }

  // ---- ouverture de la modale ------------------------------------
  let ARB = null;   // état courant : { file, i, choix, survivant }

  async function openArbitrage() {
    closeBurger();
    const sb = arbSb(), uid = arbUserId();
    const bg = doc.createElement('div');
    bg.className = 'od-modal-bg od-arb-bg';
    bg.innerHTML = ARB_STYLE + '<div class="od-arb-modal" id="od-arb"></div>';
    bg.addEventListener('mousedown', function (e) { if (e.target === bg) bg.remove(); });
    doc.body.appendChild(bg);
    ARB = { file: [], i: 0, choix: {}, saisie: {}, civilites: [], survivant: 'a', busy: false, fus: 0, rej: 0 };

    arbRender(true);   // état de chargement
    if (!sb || uid == null) { ARB.err = "Session indisponible."; arbRender(); return; }
    try {
      // Le referentiel des civilites part en meme temps que la file : il
      // alimente la saisie libre de la ligne « Civilite ». En parallele, donc
      // sans rien couter de plus que l'appel le plus lent des deux.
      const [r, rc] = await Promise.all([
        sb.rpc('client_file_arbitrage', { p_id_user: uid, p_statut: 'en_attente', p_limit: 200 }),
        sb.from('ref_type_client').select('libelle,libelle_court,ordre')
          .eq('actif', true).eq('multivu', 0).order('ordre')
      ]);
      if (r.error) throw r.error;
      ARB.file = (r.data && r.data.lignes) ? r.data.lignes : [];
      // Referentiel indisponible : la saisie retombe sur un champ libre, la
      // modale ne doit pas echouer pour autant.
      ARB.civilites = (rc && !rc.error && rc.data) ? rc.data : [];
    } catch (e) { ARB.err = (e && e.message) || 'Erreur de chargement.'; }
    arbRender();
  }

  // Le rafraichissement du badge partait a la fermeture, c'est-a-dire a la
  // milliseconde ou la fiche client se monte. Mesure du 05/10/2026, juste apres
  // une fusion : 5 927 ms de temps serveur pour ce seul comptage, en concurrence
  // avec entreprise.js, get_propales_client, v_historique_cycles et les lectures
  // CLIENT — d'ou la navigation « tres lente » ressentie. On laisse la fiche
  // s'afficher d'abord, exactement comme au demarrage.
  function arbClose() {
    const bg = doc.querySelector('.od-arb-bg'); if (bg) bg.remove(); ARB = null;
    let parti = false;
    const go = function () { if (parti) return; parti = true; rafraichirBadgeArbitrage(); };
    // 1,5 s : la fiche client a le temps de se monter, et le comptage qui suit
    // ne coute plus que quelques dizaines de millisecondes.
    setTimeout(go, 1500);
    setTimeout(go, 6000);   // filet : le compteur finit toujours par se remettre a jour
  }

  // ---- rendu ------------------------------------------------------
  function arbRender(loading) {
    const box = doc.getElementById('od-arb'); if (!box) return;
    if (loading && !ARB.file.length && !ARB.err) { box.innerHTML = arbHead() + '<div class="od-arb-load">Chargement de la file…</div>'; arbBindClose(); return; }
    if (ARB.err) { box.innerHTML = arbHead() + '<div class="od-arb-load">' + esc(ARB.err) + '</div>'; arbBindClose(); return; }
    const reste = ARB.file.length - ARB.i;
    if (reste <= 0) { box.innerHTML = arbHead() + arbVide(); arbBindClose(); return; }

    const d = ARB.detail || null;
    if (!d) { box.innerHTML = arbHead() + arbRuban(reste) + '<div class="od-arb-load">Ouverture du dossier…</div>'; arbBindClose(); arbLoadDetail(); return; }

    const conflits = arbAnalyse(d).conflits;
    const identiques = arbAnalyse(d).identiques;
    const simple = conflits.length === 0;
    if (!simple && Object.keys(ARB.choix).length === 0) ARB.choix = arbPreselection(d, conflits);

    box.innerHTML = arbHead() + arbRuban(reste) +
      '<div class="od-arb-pile">' +
        (reste > 1 ? '<div class="od-arb-ghost g1"></div>' : '') +
        (reste > 2 ? '<div class="od-arb-ghost g2"></div>' : '') +
        '<div class="od-arb-carte" id="od-arb-carte">' +
          arbMotif(d) +
          (simple ? arbSimple(d) : arbPeint(d, conflits, identiques)) +
          arbActions(simple) +
        '</div>' +
      '</div>';
    arbBind(d, conflits, simple);
  }

  async function arbLoadDetail() {
    const sb = arbSb(), uid = arbUserId();
    const ligne = ARB.file[ARB.i]; if (!ligne) return;
    try {
      const { data, error } = await sb.rpc('client_arbitrage_detail', { p_id_file: ligne.id_file, p_id_user: uid });
      if (error) throw error;
      // fiche_entrant = 'b' (créée), fiche_candidat = 'a' (existante)
      ARB.srcLabel = data.source_libelle || null;
      ARB.type = data.type || 'doublon';
      ARB.diff = data.champs_diff || null;
      ARB.detail = {
        id_file: ligne.id_file, score: ligne.score, detail: ligne.detail || {},
        a: data.fiche_candidat || {}, b: data.fiche_entrant || {}
      };
      ARB.choix = {}; ARB.saisie = {}; ARB.survivant = 'a';
      arbRender();
    } catch (e) { ARB.err = (e && e.message) || 'Dossier illisible.'; arbRender(); }
  }

  function arbAnalyse(d) {
    const conflits = [], identiques = [];
    // En mode « mise a jour », on ne presente QUE les champs signales divergents.
    const majKeys = (ARB && ARB.type === 'maj' && ARB.diff) ? Object.keys(ARB.diff) : null;
    ARB_CHAMPS.forEach(function (pair) {
      const k = pair[0], lbl = pair[1];
      // La nature a sa ligne dediee, toujours affichee : elle ne rejoint ni les
      // conflits ni le repli des champs identiques.
      if (k === 'nature') return;
      const va = arbVal(d.a, k), vb = arbVal(d.b, k);
      if (majKeys) {
        if (majKeys.indexOf(k) >= 0) conflits.push([k, lbl, va, vb]);
        else if (va) identiques.push([k, lbl, va]);
        return;
      }
      if (va && vb && va.toLowerCase() === vb.toLowerCase()) identiques.push([k, lbl, va]);
      else if (!va && !vb) {}
      else conflits.push([k, lbl, va, vb]);
    });
    return { conflits: conflits, identiques: identiques };
  }
  function arbPreselection(d, conflits) {
    const c = {};
    conflits.forEach(function (row) {
      const k = row[0], va = row[2], vb = row[3];
      c[k] = (vb && (!va || vb.length > va.length)) ? 'b' : 'a';
    });
    return c;
  }

  function arbHead() {
    const maj = (ARB && ARB.type === 'maj');
    const title = maj ? 'Mise à jour BACS' : 'Arbitrage des doublons';
    const sub = maj ? 'Le vendeur a modifié cette fiche dans BACS. Validez les changements.'
                    : 'Deux fiches semblent désigner le même client. Vous tranchez.';
    return '<div class="od-arb-head"><div class="od-arb-ic">' + I_ARB.users + '</div>' +
      '<div class="od-arb-htxt"><h1>' + title + '</h1><p>' + sub + '</p></div>' +
      '<button class="od-arb-x" data-arb-close>&times;</button></div>';
  }
  function arbRuban(reste) {
    const tot = ARB.file.length, pct = tot ? Math.round(ARB.i / tot * 100) : 0;
    return '<div class="od-arb-ruban"><span class="reste">' + reste + '</span><span>à arbitrer</span>' +
      '<div class="od-arb-jauge"><i style="width:' + pct + '%"></i></div>' +
      '<div class="od-arb-mini"><span><b>' + ARB.fus + '</b> fusionnés</span><span class="r"><b>' + ARB.rej + '</b> écartés</span></div></div>';
  }
  function arbMotif(d) {
    if (ARB && ARB.type === 'maj') {
      return '<div class="od-arb-mtf"><span class="od-arb-force moyen">Modifié dans BACS</span>' +
        '<span class="sur">champs à valider</span></div>';
    }
    const fort = (d.score >= 90);
    const sig = Object.keys(d.detail || {}).map(function (k) {
      const val = d.detail[k]; const cls = val > 0 ? 'pos' : 'neg';
      return '<span class="od-arb-tag ' + cls + '">' + esc(ARB_LIB[k] || k) + '</span>';
    }).join('');
    return '<div class="od-arb-mtf"><span class="od-arb-force ' + (fort ? 'fort' : 'moyen') + '">' +
      (fort ? 'Quasi certain' : 'À vérifier') + '</span><span class="sur">rapprochement sur</span>' + sig + '</div>';
  }

  function arbSimple(d) {
    return '<div class="od-arb-simple"><div class="duo">' +
      arbMini('a', d.a) + '<div class="fleche">' + I_ARB.arrow + '</div>' + arbMini('b', d.b) +
    '</div><p class="verdict">Les deux fiches concordent. La fusion conserve <b>' + esc(arbNom(d.a)) +
    '</b> (fiche ' + esc(d.a.idvu) + ') et récupère les infos de la fiche ' + esc(d.b.idvu) + '.</p></div>';
  }
  function arbMini(cote, f) {
    return '<div class="mini ' + cote + '"><div class="ref">' + (cote === 'a' ? 'Fiche existante' : (ARB && ARB.srcLabel ? ARB.srcLabel : 'Saisie vendeur')) + '</div>' +
      '<div class="n">' + esc(arbNom(f)) + '</div>' +
      '<div class="l">' + esc([f.mobile, f.email].filter(Boolean).join(' · ')) + '</div>' +
      '<div class="l">' + esc([f.code_postal, f.ville].filter(Boolean).join(' ') + (f.vehicules ? ' · ' + f.vehicules + ' véh.' : '')) + '</div></div>';
  }

  function arbPeint(d, conflits, identiques) {
    return '<div class="od-arb-peint">' +
      '<p class="intro">Pour chaque ligne, <b>touchez la valeur à conserver</b>. La fiche finale se compose au-dessus.</p>' +
      arbResultat(d, conflits) +
      arbNature(d) +
      '<p class="ct">À trancher — ' + conflits.length + ' champ' + (conflits.length > 1 ? 's' : '') + '</p>' +
      conflits.map(function (c) { return arbLigne(d, c); }).join('') +
      (identiques.length ? arbIdentiques(identiques) : '') + '</div>';
  }
  // NATURE DE LA FICHE (06/10/2026). Elle ne figurait nulle part dans
  // l'arbitrage, alors qu'elle commande toute la presentation de la fiche
  // client : a 1, le formulaire bascule en mode entreprise et remplace
  // civilite/nom/prenom par type/SIRET/raison sociale. Resultat, un
  // particulier arbitre proprement ressortait en societe sans que rien ne
  // l'ait annonce. Mesure du 06/10/2026 : 15,2 % des fiches de la file sont
  // marquees entreprise SANS porter le moindre SIRET.
  // La ligne est donc toujours affichee, meme quand les deux cotes sont
  // d'accord — c'est justement le cas ou les deux ont tort.
  function arbNature(d) {
    const va = arbVal(d.a, 'nature'), vb = arbVal(d.b, 'nature');
    const ch = ARB.choix.nature;
    const retenue = (ch === 'c') ? ((ARB.saisie && ARB.saisie.nature) || '')
                  : (ch === 'b') ? vb : (ch === 'a') ? va : (va || vb);
    const sansSiret = !arbVal(d.a, 'siret') && !arbVal(d.b, 'siret');
    const alerte = (retenue === 'Société' && sansSiret)
      ? '<p class="od-arb-nat-a">Marquée entreprise, mais aucun SIRET des deux côtés.</p>' : '';
    return '<p class="ct">Nature de la fiche</p>' + arbEntete() +
      arbLigne(d, ['nature', 'Nature', va, vb]) + alerte;
  }
  function arbResultat(d, conflits) {
    const cells = ARB_CHAMPS.map(function (pair) {
      const k = pair[0], lbl = pair[1], va = arbVal(d.a, k), vb = arbVal(d.b, k);
      const ch = ARB.choix[k];
      let src, v;
      // Une valeur saisie l'emporte sur tout le reste.
      if (ch === 'c') { src = 'c'; v = (ARB.saisie && ARB.saisie[k]) || ''; }
      else if (va && vb && va.toLowerCase() === vb.toLowerCase()) { src = ARB.survivant; v = va; }
      else if (!va && !vb) { src = null; v = ''; }
      else if (va && vb) { src = ch || 'a'; v = (src === 'a') ? va : vb; }
      // Un seul des deux cotes porte une valeur : le choix de l'arbitre restait
      // ignore ici, alors que c'est exactement le cas de la civilite de ce soir
      // (existante vide, BACS faux). On l'honore.
      else { src = ch || (va ? 'a' : 'b'); v = (src === 'a') ? va : vb; }
      const pin = src ? '<span class="pin ' + src + '"></span>' : '';
      return '<div class="rc"><span class="rk">' + lbl + '</span><span class="rv' + (v ? '' : ' vide') + '">' + pin + (esc(arbAff(k, v)) || '—') + '</span></div>';
    }).join('');
    return '<div class="od-arb-res"><div class="rg">' + cells + '</div></div>';
  }
  function arbLigne(d, row) {
    const k = row[0], lbl = row[1], va = row[2], vb = row[3];
    return '<div class="od-arb-cf" data-champ="' + k + '"><div class="ck">' + lbl + '</div>' +
      arbOpt('a', k, va) + arbOpt('b', k, vb) + arbSaisie(k) + '</div>';
  }
  // TROISIEME VOIE (06/10/2026) : aucune des deux valeurs proposees n'est
  // forcement juste. Cas rencontre ce soir — BACS propose « Mme » pour un
  // monsieur prenomme Francois Xavier, et l'existante est vide : l'arbitre
  // n'avait d'autre choix que de fusionner une erreur, puis d'aller la corriger
  // dans la fiche. On ouvre donc une saisie libre a cote des deux propositions.
  // Pour la civilite, c'est le referentiel ref_type_client qui alimente la
  // liste — le meme que les formulaires client, pour ne pas reintroduire des
  // variantes la ou on vient d'en normaliser 12 745.
  function arbSaisie(k) {
    const on = ARB.choix[k] === 'c';
    const v = (ARB.saisie && ARB.saisie[k] != null) ? String(ARB.saisie[k]) : '';
    let champ;
    if (k === 'nature') {
      champ = '<select class="od-arb-si" data-saisie="nature">' +
        '<option value="">— autre —</option>' +
        ['Particulier', 'Société'].map(function (o) {
          return '<option value="' + o + '"' + (v === o ? ' selected' : '') + '>' + o + '</option>';
        }).join('') + '</select>';
    } else if (k === 'civilite' && ARB.civilites && ARB.civilites.length) {
      champ = '<select class="od-arb-si" data-saisie="' + k + '">' +
        '<option value="">— autre valeur —</option>' +
        ARB.civilites.map(function (c) {
          return '<option value="' + esc(c.libelle_court) + '"' + (v === c.libelle_court ? ' selected' : '') + '>' +
                 esc(c.libelle) + '</option>';
        }).join('') + '</select>';
    } else {
      champ = '<input class="od-arb-si" type="' + (k === 'naissance' ? 'date' : 'text') +
        '" data-saisie="' + k + '" value="' + esc(v) + '" placeholder="autre valeur">';
    }
    return '<div class="od-arb-opt c" data-champ="' + k + '" data-cote="c" aria-pressed="' + on + '">' +
      champ + '</div>';
  }
  // Le libelle complet de la source (« BACS2 (Toyota/Lexus) ») tenait sur deux
  // lignes et forcait la valeur a se couper au milieu d'un mot. On n'affiche que
  // sa premiere partie ; le detail reste en infobulle.
  function arbSrcCourt(cote) {
    if (cote === 'a') return 'existante';
    const l = (ARB && ARB.srcLabel) ? String(ARB.srcLabel) : 'saisie vendeur';
    return l.split(' (')[0].trim() || l;
  }
  function arbOpt(cote, k, v) {
    const on = (ARB.choix[k] || 'a') === cote;
    const plein = (cote === 'a') ? 'Valeur déjà dans la fiche' : ((ARB && ARB.srcLabel) ? String(ARB.srcLabel) : 'saisie vendeur');
    return '<button class="od-arb-opt ' + cote + '" data-champ="' + k + '" data-cote="' + cote + '" aria-pressed="' + on + '" title="' + esc(plein) + '">' +
      '<span class="ov' + (v ? '' : ' vide') + '">' + (esc(arbAff(k, v)) || 'non renseigné') + '</span></button>';
  }
  // En-tete de colonnes. CLASSE `od-arb-cols` ET NON `od-arb-head` : ce dernier
  // nom est deja pris par la barre de titre de la modale, avec gap:14px et
  // padding:18px 22px — la ligne en heritait et ses colonnes ne tombaient plus
  // en face des autres (166,7 px contre 181,3 px, mesure au rendu).
  // La provenance est identique sur toutes les lignes, la
  // repeter dans chaque carte mangeait la largeur et coupait les valeurs au
  // milieu des mots (« 12 RUE DE L'INSURRECTIO / N »).
  function arbEntete() {
    return '<div class="od-arb-cf od-arb-cols" aria-hidden="true"><div class="ck"></div>' +
      '<div class="he a">Existante</div>' +
      '<div class="he b" title="' + esc((ARB && ARB.srcLabel) || '') + '">' + esc(arbSrcCourt('b')) + '</div>' +
      '<div class="he c">Saisie</div></div>';
  }
  function arbIdentiques(identiques) {
    return '<details class="od-arb-id"><summary>' + identiques.length + ' champ' + (identiques.length > 1 ? 's identiques' : ' identique') + '</summary>' +
      identiques.map(function (r) { return '<div class="idr"><span class="idk">' + r[1] + '</span><span>' + esc(arbAff(r[0], r[2])) + '</span></div>'; }).join('') + '</details>';
  }

  function arbActions(simple) {
    const maj = (ARB && ARB.type === 'maj');
    const bFus = maj ? 'Appliquer' : (simple ? 'Fusionner' : 'Fusionner ainsi');
    const bRej = maj ? 'Garder One Data' : 'Pas un doublon';
    return '<div class="od-arb-act">' +
      '<button class="od-arb-b fusion" data-arb="fusion"' + (ARB.busy ? ' disabled' : '') + '>' + I_ARB.check + '<span>' + bFus + '</span></button>' +
      '<button class="od-arb-b rejet" data-arb="rejet"' + (ARB.busy ? ' disabled' : '') + '>' + I_ARB.x + '<span>' + bRej + '</span></button>' +
      '<button class="od-arb-b report" data-arb="report"' + (ARB.busy ? ' disabled' : '') + '>' + I_ARB.clock + '<span>Plus tard</span></button></div>';
  }
  function arbVide() {
    return '<div class="od-arb-vide"><div class="ok">' + I_ARB.check + '</div><h2>File vide</h2>' +
      '<p>Plus aucun doublon à arbitrer dans votre périmètre. ' + ARB.fus + ' fusionnés, ' + ARB.rej + ' écartés.</p></div>';
  }

  // ---- interactions ----------------------------------------------
  function arbBindClose() {
    const x = doc.querySelector('[data-arb-close]'); if (x) x.addEventListener('click', arbClose);
  }
  function arbBind(d, conflits, simple) {
    arbBindClose();
    if (!simple) {
      doc.querySelectorAll('.od-arb-opt').forEach(function (b) {
        b.addEventListener('click', function () {
          const k = b.getAttribute('data-champ'), cote = b.getAttribute('data-cote');
          // Cliquer la zone de saisie alors qu'elle est vide ne doit pas
          // imposer une valeur vide : on la laisse prendre le focus.
          if (cote === 'c' && !(ARB.saisie && ARB.saisie[k])) return;
          ARB.choix[k] = cote;
          arbRepeindre(d, conflits);
        });
      });
      // Saisie libre : on met a jour sans re-rendre la ligne, sinon le champ
      // perdrait le focus a chaque frappe. arbRepeindre ne refait que la fiche
      // finale et les etats des boutons.
      doc.querySelectorAll('[data-saisie]').forEach(function (el) {
        const k = el.getAttribute('data-saisie');
        const maj = function () {
          const val = el.value;
          if (!ARB.saisie) ARB.saisie = {};
          ARB.saisie[k] = val;
          if (val === '') { delete ARB.choix[k]; } else { ARB.choix[k] = 'c'; }
          arbRepeindre(d, conflits);
        };
        el.addEventListener('input', maj);
        el.addEventListener('change', maj);
        el.addEventListener('click', function (e) { e.stopPropagation(); });
      });
    }
    doc.querySelectorAll('[data-arb]').forEach(function (b) {
      b.addEventListener('click', function () { arbTrancher(b.getAttribute('data-arb'), d, conflits); });
    });
  }
  function arbRepeindre(d, conflits) {
    const carte = doc.getElementById('od-arb-carte'); if (!carte) return;
    const old = carte.querySelector('.od-arb-res');
    const tmp = doc.createElement('div'); tmp.innerHTML = arbResultat(d, conflits);
    if (old) old.replaceWith(tmp.firstChild);
    carte.querySelectorAll('.od-arb-opt').forEach(function (b) {
      b.setAttribute('aria-pressed', String((ARB.choix[b.getAttribute('data-champ')] || 'a') === b.getAttribute('data-cote')));
    });
  }

  async function arbTrancher(action, d, conflits) {
    if (ARB.busy) return;
    ARB.busy = true;
    let __arbData = null;
    const sb = arbSb(), uid = arbUserId();
    const carte = doc.getElementById('od-arb-carte');
    const anim = action === 'fusion' ? 'partir-fusion' : action === 'rejet' ? 'partir-rejet' : 'partir-report';

    try {
      let params;
      if (action === 'fusion') {
        // survivant = fiche qui garde l'identité (le nom) = 'a' par défaut (existante).
        // Champs peints : pour chaque conflit où l'arbitre a choisi la valeur de
        // l'absorbé, on la passe à client_merge via p_champs.
        const survCote = ARB.survivant;                 // 'a'
        const survivant = survCote === 'a' ? d.a.idvu : d.b.idvu;
        const absorbe   = survCote === 'a' ? d.b.idvu : d.a.idvu;
        const champs = {};
        (conflits || []).forEach(function (row) {
          const k = row[0]; const choisi = ARB.choix[k] || 'a';
          if (choisi === 'c') {
            // Valeur saisie par l'arbitre : ni celle de la fiche, ni celle de
            // la source. On l'impose toujours, quel que soit le survivant.
            champs[k] = (ARB.saisie && ARB.saisie[k]) || '';
          } else if (choisi !== survCote) {
            // la valeur retenue vient de l'absorbé -> on l'impose
            const f = choisi === 'a' ? d.a : d.b;
            champs[k] = f[k];
          }
        });
        // La nature est presentee a part : on la traduit ici en idmultivu, et
        // seulement si elle differe de celle que porte deja le survivant.
        const chNat = ARB.choix.nature;
        if (chNat) {
          const nat = (chNat === 'c') ? ((ARB.saisie && ARB.saisie.nature) || '')
                    : arbVal(chNat === 'a' ? d.a : d.b, 'nature');
          if (nat) {
            const vise = (nat === 'Société') ? '1' : '0';
            const porte = ((survCote === 'a' ? d.a : d.b) || {}).societe ? '1' : '0';
            if (vise !== porte) champs.idmultivu = vise;
          }
        }
        params = { p_id_file: d.id_file, p_decision: 'fusionner', p_survivant: Number(survivant), p_absorbe: Number(absorbe), p_id_user: uid, p_champs: champs };
      } else if (action === 'rejet') {
        params = { p_id_file: d.id_file, p_decision: 'rejeter', p_id_user: uid };
      } else {
        params = { p_id_file: d.id_file, p_decision: 'reporter', p_id_user: uid };
      }
      const res = await sb.rpc('client_arbitrer', params);
      if (res.error) throw res.error;
      __arbData = res.data;
      // La base peut refuser sans lever d'erreur : ligne deja traitee par un
      // autre vendeur, par exemple. Sans ce controle, le refus passait pour une
      // reussite, la carte se fermait et on redirigeait vers la fiche comme si
      // quelque chose avait ete ecrit.
      if (__arbData && __arbData.ok === false) throw new Error(__arbData.motif || 'Action refusee.');
    } catch (e) {
      ARB.busy = false;
      // afficher l'erreur sans perdre la carte
      const box = doc.getElementById('od-arb');
      if (box) { const w = doc.createElement('div'); w.className = 'od-arb-erru'; w.textContent = (e && e.message) || 'Action refusée.'; box.prepend(w); setTimeout(function(){ w.remove(); }, 4000); }
      return;
    }

    // Un ecart peut avoir disparu entre l'affichage et la validation : une autre
    // remontee a corrige la fiche entre-temps. La base ne l'ecrase pas et le dit
    // par decision='sans_objet'. On l'annonce plutot que de feindre une fusion.
    if (action === 'fusion' && __arbData && __arbData.decision === 'sans_objet') {
      arbInfo(__arbData.motif || 'La fiche a ete mise a jour entre-temps : plus aucun ecart a trancher.');
      ARB.rej++;
      if (carte) carte.classList.add(anim);
      setTimeout(function () {
        ARB.i++; ARB.detail = null; ARB.choix = {}; ARB.saisie = {}; ARB.survivant = 'a'; ARB.busy = false;
        arbRender();
      }, 430);
      return;
    }

    // Validation (fusion / application) : ON ENCHAINE SUR LE DOSSIER SUIVANT.
    // On fermait la modale pour partir sur la fiche client fusionnee. C'etait
    // utile tant que l'arbitrage ne montrait pas tout : il fallait aller
    // verifier le resultat ailleurs. Depuis que la nature, la civilite et la
    // saisie libre sont dans la fenetre, ce detour coute une navigation
    // complete entre deux dossiers — mesuree a plus d'une seconde le
    // 06/10/2026 — et oblige a rouvrir la file a chaque fois. La fiche reste
    // accessible d'un clic depuis le message de confirmation.
    if (action === 'fusion') {
      ARB.fus++;
      const cid = (__arbData && (__arbData.id_client != null ? __arbData.id_client : __arbData.survivant)) || (d.a && d.a.idvu);
      const ecartes = (__arbData && Array.isArray(__arbData.ecartes) && __arbData.ecartes.length)
        ? ' Champs déjà à jour, non modifiés : ' + __arbData.ecartes.join(', ') + '.' : '';
      arbInfo('Fiches fusionnées.' + ecartes, (cid != null) ? { libelle: 'Ouvrir la fiche', cid: cid } : null);
      if (carte) carte.classList.add(anim);
      setTimeout(function () {
        ARB.i++; ARB.detail = null; ARB.choix = {}; ARB.saisie = {}; ARB.survivant = 'a'; ARB.busy = false;
        arbRender();
      }, 430);
      return;
    }
    if (action === 'rejet') ARB.rej++;
    if (carte) carte.classList.add(anim);
    setTimeout(function () {
      ARB.i++; ARB.detail = null; ARB.choix = {}; ARB.saisie = {}; ARB.survivant = 'a'; ARB.busy = false;
      arbRender();
    }, 430);
  }

  // Information neutre, la ou od-arb-erru signale un echec.
  // Le message etait pose dans #od-arb, que arbRender reconstruit par innerHTML :
  // il vivait 430 ms, le temps de l'animation, puis disparaissait. Les six
  // secondes prevues n'ont donc jamais existe, pour aucun des messages de fin
  // d'action. On l'accroche desormais au fond de la modale, qui n'est pas
  // reconstruit, et il survit a l'enchainement sur le dossier suivant.
  function arbInfo(msg, lien) {
    const fond = doc.querySelector('.od-arb-bg');
    if (!fond) { console.log('[arbitrage]', msg); return; }
    const vieux = fond.querySelector('.od-arb-info'); if (vieux) vieux.remove();
    const w = doc.createElement('div');
    w.className = 'od-arb-info';
    w.textContent = msg;
    // Lien facultatif : la fiche reste a un clic, sans l'imposer a chaque fusion.
    if (lien && lien.cid != null) {
      const b = doc.createElement('button');
      b.type = 'button'; b.className = 'od-arb-info-lien'; b.textContent = lien.libelle || 'Ouvrir';
      b.addEventListener('click', function (e) { e.stopPropagation(); arbClose(); odGoToClientFiche(lien.cid); });
      w.appendChild(b);
    }
    fond.appendChild(w);
    setTimeout(function () { try { w.remove(); } catch (e) {} }, 6000);
  }

  const I_ARB = {
    users: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.2"/><path d="M3.5 20a5.5 5.5 0 0 1 11 0"/><path d="M16 5.2a3.2 3.2 0 0 1 0 6M18.5 20a5.5 5.5 0 0 0-3-4.9"/></svg>',
    arrow: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14M13 6l6 6-6 6"/></svg>',
    check: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6L9 17l-5-5"/></svg>',
    x: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>',
    clock: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>'
  };


  // ---------------------------------------------------------------- boot robuste & ré-entrant
  // (Re)construit la nav dès que #nav-root est présent mais vide : premier rendu,
  // apparition du header APRÈS le login, re-mount du header par WeWeb, changement
  // de page... Idempotent : si la nav est déjà rendue (CSS présent), ne fait rien.
  function ensureNav() {
    const r = root();
    if (r && !r.querySelector('#onedata-nav-css')) { build(); return true; }
    return !!r;
  }
  // UN SEUL observer persistant, (RÉ)ARMÉ à chaque exécution pour toujours pointer
  // le <body> vivant du front (après une navigation, l'ancien peut être mort).
  function armNavObserver() {
    try { if (window.__navMo && typeof window.__navMo.disconnect === 'function') window.__navMo.disconnect(); } catch (e) {}
    try {
      const mo = new MutationObserver(function () { ensureNav(); });
      mo.observe(doc.body, { childList: true, subtree: true });
      window.__navMo = mo;
    } catch (e) {}
  }
  // Le user arrive de façon asynchrone (socle). Quand il est prêt, on FORCE un
  // re-render (sinon la garde de version empêche la mise à jour avec le user).
  function onUserReady() {
    try { const r = root(); if (r) r.setAttribute('data-nav-ver', ''); build(); } catch (e) {}
  }
  if (!window.__navUserReadyBound) {
    window.__navUserReadyBound = true;
    try { const wf = (wwLib.getFrontWindow && wwLib.getFrontWindow()) || window; wf.addEventListener('oropra-user-ready', onUserReady); } catch (e) {}
    try { window.addEventListener('oropra-user-ready', onUserReady); } catch (e) {}
  }
  function boot() {
    ensureNav();          // rendu immédiat si #nav-root est déjà là
    armNavObserver();     // (ré)arme le watcher sur le body vivant
    // filets : tentatives échelonnées (header monté en différé) + intervalle léger permanent
    [50, 150, 300, 600, 1200, 2500, 5000].forEach(function (d) { setTimeout(ensureNav, d); });
    if (!window.__navSafety) { window.__navSafety = setInterval(ensureNav, 4000); }
  }

  // ---- Rappel d'arbitrage au retour sur One Data (patch BACS2) ----
  // Réutilise rafraichirBadgeArbitrage / openArbitrage / arbSb / arbUserId / root / doc.
  // ⚠️ 21/09/2026 : au retour sur l'onglet, « focus » ET « visibilitychange »
  //    se déclenchent tous les deux, et chacun lançait DEUX fois la même
  //    requête (badge + bandeau) — 4 appels par retour. Avec BACS ouvert à
  //    côté, un vendeur change d'onglet sans arrêt. Désormais : un seul
  //    appel, qui sert au badge et au bandeau, et au plus un toutes les 30 s.
  let arbDernierRappel = 0;
  async function rappelArbitrageAuRetour() {
    if (Date.now() - arbDernierRappel < 30000) return;
    try {
      const sb = arbSb(), uid = arbUserId();
      if (!sb || uid == null) return;
      arbDernierRappel = Date.now();
      // Badge + bandeau : un nombre suffit ici aussi. C'est CET appel qui partait
      // au demarrage (releve a 1,56 s dans le HAR du 05/10/2026) et qui coutait
      // 5 028 ms de temps serveur a froid. Passe par arbCompter, donc protege
      // par la meme reprise sur echec : null veut dire « on ne sait pas », et on
      // laisse alors l'affichage tel qu'il est plutot que de l'effacer.
      const n = await arbCompter();
      if (n == null) return;
      majBadgeArbitrage(n);
      afficherBandeauArbitrage(n);
    } catch (e) {}
  }
  // 02/10/2026 \u2014 sur t\u00E9l\u00E9phone, le bandeau (fix\u00E9 en haut \u00E0 droite) recouvrait
  // le nom de l'utilisateur et le s\u00E9lecteur de site, sans moyen de le fermer.
  // D\u00E9sormais : en bas d'\u00E9cran sous 640 px (\u00E0 gauche du bouton Pulse), et une
  // croix qui le met en sourdine 30 min \u2014 le badge du menu reste \u00E0 jour.
  let arbBandeauSourdine = 0;
  function cssBandeauArbitrage() {
    if (doc.getElementById('od-arb-rappel-css')) return;
    const st = doc.createElement('style'); st.id = 'od-arb-rappel-css';
    st.textContent = '#od-arb-rappel{position:fixed;top:64px;right:16px;z-index:99999;background:#1F4A85;color:#fff;'
      + 'padding:10px 10px 10px 14px;border-radius:10px;box-shadow:0 3px 12px rgba(0,0,0,.25);'
      + 'font:600 13px "Nunito Sans",system-ui,sans-serif;cursor:pointer;display:flex;align-items:center;gap:10px;max-width:360px}'
      + '#od-arb-rappel .arb-go{opacity:.85;text-decoration:underline;white-space:nowrap}'
      + '#od-arb-rappel .arb-x{border:none;background:rgba(255,255,255,.14);color:#fff;width:22px;height:22px;border-radius:6px;'
      + 'font:700 14px/1 system-ui,sans-serif;cursor:pointer;display:flex;align-items:center;justify-content:center;flex:0 0 auto;padding:0}'
      + '#od-arb-rappel .arb-x:hover{background:rgba(255,255,255,.28)}'
      + '@media(max-width:640px){#od-arb-rappel{top:auto;right:72px;left:12px;bottom:calc(16px + env(safe-area-inset-bottom,0px));'
      + 'max-width:none;font-size:12.5px;padding:9px 8px 9px 12px}#od-arb-rappel .arb-txt{flex:1;min-width:0}}';
    (doc.head || doc.documentElement).appendChild(st);
  }
  function afficherBandeauArbitrage(n) {
    const r = root(); if (!r) return;
    let b = r.querySelector('#od-arb-rappel');
    if (!n || n <= 0 || Date.now() < arbBandeauSourdine) { if (b) b.remove(); return; }
    cssBandeauArbitrage();
    if (!b) {
      b = doc.createElement('div');
      b.id = 'od-arb-rappel';
      b.addEventListener('click', function (e) {
        if (e.target && e.target.closest && e.target.closest('.arb-x')) {
          e.stopPropagation(); arbBandeauSourdine = Date.now() + 30 * 60 * 1000; b.remove(); return;
        }
        b.remove(); openArbitrage();
      });
      r.appendChild(b);
    }
    b.innerHTML = '<span class="arb-txt">\u26A0\uFE0F ' + n + ' client' + (n > 1 ? 's' : '') + ' \u00E0 arbitrer</span>'
      + '<span class="arb-go">Ouvrir</span>'
      + '<button type="button" class="arb-x" aria-label="Masquer">\u00D7</button>';
  }
  if (!window.__navArbReturnBound) {
    window.__navArbReturnBound = true;
    var __onArbReturn = function () { if (doc.visibilityState === 'visible') rappelArbitrageAuRetour(); };
    try { doc.addEventListener('visibilitychange', __onArbReturn); } catch (e) {}
    try { window.addEventListener('focus', __onArbReturn); } catch (e) {}
    // LE COMPTEUR DOIT ETRE LA DES LA CONNEXION (06/10/2026).
    // Il attendait que le navigateur n'ait plus rien a faire, avec un filet a
    // 9 s : c'etait justifie quand le comptage passait par la fonction
    // complete, qui coutait jusqu'a 5 s de serveur. Depuis
    // client_file_arbitrage_compte il coute 8 a 49 ms, et la tache planifiee
    // qui saturait l'instance quatre fois par heure est corrigee. Plus rien ne
    // justifie de faire attendre : on part a 1,2 s, le temps que la page
    // s'affiche, et le filet a 6 s ne sert plus qu'aux demarrages pateux.
    (function pastilleDesLaConnexion() {
      let parti = false;
      const go = function () { if (parti) return; parti = true; rappelArbitrageAuRetour(); };
      setTimeout(go, 1200);
      setTimeout(go, 6000);
    })();
  }
  boot();
})();
    // La nav s'est peut-être construite AVANT que oropraUser soit à jour (event
    // 'oropra-user-ready' émis par le socle avant le chargement CDN du module).
    // On re-déclenche l'event -> onUserReady() force un rebuild avec le user courant.
    try {
      const W = (window.wwLib && window.wwLib.getFrontWindow && window.wwLib.getFrontWindow()) || window;
      const fire = () => { try { W.dispatchEvent(new CustomEvent('oropra-user-ready')); } catch (e) {} };
      fire(); setTimeout(fire, 300); setTimeout(fire, 1000);
    } catch (e) {}

  }
});
