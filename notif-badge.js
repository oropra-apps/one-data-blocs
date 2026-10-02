// ============================================================================
//  NOTIF BADGE — module One Data (OD.define)  v2 — LE FEU, PAS LE COMPTEUR
//
//  Module app-level : ancre masquée dans le header, PERSISTANT.
//
//  CE QUI CHANGE
//
//  1. LA PASTILLE NE COMPTE PLUS QUE MA FILE.
//     La v1 comptait les notifications de tout le périmètre visible. Pour un
//     directeur de groupe, cela donnait 501 — un nombre qu'il ne pouvait pas
//     faire descendre, puisqu'aucune de ces notifications ne lui appartenait.
//     Un compteur qu'on ne peut pas ramener à zéro n'est pas une notification,
//     c'est du bruit, et on apprend à ne plus le regarder.
//     notif_feu() ne compte donc que les dettes du porteur de la session, plus
//     ses relances promises et non tenues.
//
//  2. CE N'EST PLUS UN COMPTEUR, C'EST UN FEU.
//     Le nombre reste, mais c'est la COULEUR qui dit s'il y a urgence :
//       calme  encre pâle  — il y a des choses, rien ne presse
//       tiede  ambre       — quelque chose attend depuis plus de 4 h
//       chaud  rouge       — plus de 24 h, ou une relance promise en retard
//     L'état est publié dans window.__odNotifFeu ; la barre du haut le lit et
//     le pose en data-feu sur ses pastilles (topnav v16 et au-delà).
//
//  3. LE BUS DE SITE N'INTERVIENT PLUS.
//     La v1 interrogeait le bus pour construire le périmètre des managers, avec
//     un repli sur USER_SITE quand il n'était pas prêt : trois chemins, deux
//     requêtes de rattrapage, et un résultat qui changeait selon le site
//     sélectionné. Ma file est la mienne quel que soit le site affiché : le
//     calcul n'a plus besoin du bus du tout.
//
//  4. LE BATTEMENT S'ARRÊTE QUAND ON A REGARDÉ.
//     notif_feu rend aussi « nouveau » : vrai s'il y a quelque chose arrivé
//     depuis le dernier passage sur la page. C'est ce qui fait battre la
//     pastille. Ouvrir la page appelle notif_vu_maintenant, le battement
//     s'arrête — mais la couleur ne change pas et le nombre ne bouge pas. Une
//     dette vue reste une dette.
//
//  5. LES LEADS NE COMPTENT PLUS.
//     Ils sont au lead management. Sur Team Colin, les 501 de la v1 étaient à
//     100 % des leads : la pastille tombe enfin à ce qui relève de la page.
//
//  Prérequis SQL : notif_feu().
// ============================================================================
OD.define('notif-badge', {
  async mount(__anchor, ctx) {
    const wwLib = window.wwLib;

    /* ---- Config ----------------------------------------------------------- */
    const VAR_NB_NOTIFS = '9fc0eca4-2325-4774-8e27-4c66515a9166';   // sortie : nb_notifs (Number)
    const PERIOD_MS     = 5 * 60 * 1000;                            // rafraîchissement périodique
    const LOG = (...a) => console.log('%c[notif-badge]', 'color:#2a5ea9;font-weight:bold', ...a);

    function fwin() {
      try { return (wwLib.getFrontWindow && wwLib.getFrontWindow()) || window; }
      catch (e) { return window; }
    }
    function getConnectedUser() {
      try {
        let d = fwin().oropraUser;
        if (Array.isArray(d)) d = d[0];
        return d || {};
      } catch (e) { return {}; }
    }

    // Le jeton est redemandé à chaque appel REST : getSession lit le stockage
    // et peut déclencher un rafraîchissement. On le garde trente secondes.
    let JWT = { t: 0, v: null };
    async function getUserJwt() {
      const now = Date.now();
      if (JWT.v && now - JWT.t < 30000) return JWT.v;
      try {
        const s = await ctx.supabase.auth.getSession();
        JWT = { t: now, v: s?.data?.session?.access_token || null };
        return JWT.v;
      } catch (e) { return null; }
    }

    /* ---- Publication ------------------------------------------------------ */
    // Le nombre passe par la variable historique (la barre du haut la lit
    // déjà). L'état du feu passe par window.__odNotifFeu : aucune nouvelle
    // variable WeWeb à créer, et la barre du haut sait s'en passer si ce module
    // n'est pas chargé — ses pastilles restent alors rouges comme avant.
    function publier(etat) {
      const n = Number(etat && etat.n) || 0;
      try { wwLib.wwVariable.updateValue(VAR_NB_NOTIFS, n); }
      catch (e) { console.error('[notif-badge] updateValue', e); }
      try { const w = fwin(); if (w.variables) w.variables[VAR_NB_NOTIFS + '-value'] = n; } catch (e) {}

      const feu = { n: n, feu: (etat && etat.feu) || 'calme',
                    nouveau: !!(etat && etat.nouveau), maj: Date.now() };
      try { window.__odNotifFeu = feu; } catch (e) {}
      try { const w = fwin(); w.__odNotifFeu = feu; } catch (e) {}
      // La barre du haut repeint sur cet événement, sans attendre son cycle
      // de vingt secondes.
      try { fwin().dispatchEvent(new CustomEvent('oropra-notif-feu', { detail: feu })); } catch (e) {}
      try { (wwLib.getFrontDocument ? wwLib.getFrontDocument() : document)
              .dispatchEvent(new CustomEvent('oropra-notif-feu', { detail: feu })); } catch (e) {}
    }

    /* ---- État ------------------------------------------------------------- */
    const STATE_VERSION = 20;   // v20 : ma file seule + feu, plus de bus
    function st() {
      const cur = window.__OROPRA_NOTIF_BADGE__;
      if (!cur || cur._v !== STATE_VERSION) {
        try { if (cur && cur.tick) clearInterval(cur.tick); } catch (e) {}
        try { if (cur && cur.poll) clearInterval(cur.poll); } catch (e) {}
        window.__OROPRA_NOTIF_BADGE__ = { _v: STATE_VERSION, etat: null, debounce: null,
                                          tick: null, ready: false, bound: false };
      }
      return window.__OROPRA_NOTIF_BADGE__;
    }

    /* ---- Calcul ----------------------------------------------------------- */
    async function calculer() {
      const s = st();
      try {
        const jwt = await getUserJwt();
        if (!jwt) return;
        const res = await fetch(ctx.tenant.supabase_url + '/rest/v1/rpc/notif_feu', {
          method: 'POST',
          headers: { 'apikey': ctx.tenant.supabase_anon_key, 'Authorization': 'Bearer ' + jwt,
                     'Content-Type': 'application/json' },
          body: '{}'
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        s.etat = await res.json();
      } catch (e) {
        console.error('[notif-badge] notif_feu', e);
        return;                       // on garde le dernier état connu
      }
      publier(s.etat);
      LOG('ma file =', s.etat && s.etat.n, '· feu', s.etat && s.etat.feu,
          (s.etat && s.etat.nouveau) ? '· du nouveau' : '');
    }

    function bientot(delai) {
      const s = st();
      if (s.debounce) clearTimeout(s.debounce);
      s.debounce = setTimeout(() => calculer(), delai || 600);
    }

    /* ---- Déclencheurs ------------------------------------------------------
       1) périodique, toutes les cinq minutes
       2) à la demande : oropraNotifBadgeRefresh() ou l'événement
          'oropra-notif-refresh' — appelés dès qu'une dette bouge (report,
          réponse, alerte lue) depuis la page Notifications
       Le bus de site ne déclenche plus rien : ma file ne dépend pas du site
       affiché.
    ------------------------------------------------------------------------- */
    function periodique() {
      const s = st();
      if (s.tick) return;
      s.tick = setInterval(() => calculer(), PERIOD_MS);
    }
    function brancherRappel() {
      const s = st();
      if (s.bound) return;
      s.bound = true;
      const h = () => bientot(0);
      try { fwin().oropraNotifBadgeRefresh = h; } catch (e) {}
      try { window.oropraNotifBadgeRefresh = h; } catch (e) {}
      try { (wwLib.getFrontDocument ? wwLib.getFrontDocument() : document)
              .addEventListener('oropra-notif-refresh', h); } catch (e) {}
      try { fwin().addEventListener('oropra-notif-refresh', h); } catch (e) {}
    }

    /* ---- Démarrage -------------------------------------------------------- */
    function demarrer(essais) {
      essais = essais || 0;
      if (!ctx.supabase || getConnectedUser().ID_User == null) {
        if (essais < 120) return void setTimeout(() => demarrer(essais + 1), 250);
        console.error('[notif-badge] Supabase ou utilisateur connecté jamais prêt');
        return;
      }
      const s = st();
      if (s.ready) { publier(s.etat); return; }
      s.ready = true;
      LOG('démarrage');
      publier({ n: 0, feu: 'calme', nouveau: false });

      // La pastille passe APRÈS l'affichage du tableau de bord et de l'agenda.
      // Elle informe, elle ne bloque rien : la faire patienter jusqu'au premier
      // moment d'inactivité du navigateur ne coûte rien à l'utilisateur, et
      // rend sa seconde aux deux écrans qu'il regarde vraiment.
      const premierCalcul = () => calculer();
      try {
        if (typeof window.requestIdleCallback === 'function') {
          window.requestIdleCallback(premierCalcul, { timeout: 6000 });
        } else { setTimeout(premierCalcul, 3500); }
      } catch (e) { setTimeout(premierCalcul, 3500); }

      periodique();
      brancherRappel();
    }
    demarrer();

    // Robustesse : si l'utilisateur applicatif arrive tardivement (session
    // restaurée après coup, changement de compte), démarrer sur l'événement du
    // socle plutôt que d'abandonner après la boucle d'attente. demarrer() est
    // idempotent (garde s.ready).
    try {
      const w = fwin();
      const kick = () => { try { demarrer(0); } catch (e) {} };
      w.addEventListener('oropra-user-ready', kick);
      if (w !== window) window.addEventListener('oropra-user-ready', kick);
    } catch (e) {}
  }
});
