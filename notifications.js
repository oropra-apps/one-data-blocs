// ============================================================================
//  NOTIFICATIONS — module One Data (OD.define)   v3 — PROFIL TEAM COLIN
//
//  LE COMPTE RENDU EST LE MEME DES DEUX COTES. Trois boutons posaient ici
//  trois questions fermees — venu, pas venu, reporté — et appelaient une RPC
//  qui n'existait plus. La page ouvre maintenant la fiche complete de
//  l'agenda : issue, température, motif de perte, relance proposée, preuve
//  d'appel. Un seul formulaire, un seul geste à apprendre, un seul endroit à
//  corriger.
//
//  UNE NOTIFICATION N'EST PAS UN MESSAGE, C'EST UNE DETTE
//
//  Quelqu'un attend quelque chose de nous. Tout découle de là, et c'est ce qui
//  change tout le reste.
//
//  CE QUI CHANGE PAR RAPPORT À LA v1
//
//  1. UNE CARTE PAR PERSONNE, PAS PAR MESSAGE.
//     Un client qui laissait un appel manqué puis deux SMS donnait trois lignes
//     réparties dans deux sections. Il donne maintenant UNE carte, avec ses
//     canaux en pastilles et un seul geste pour la solder. Le média devient un
//     attribut et un filtre ; il n'est plus un rangement.
//
//  2. LES LEADS SONT PARTIS AU LEAD MANAGEMENT.
//     Mesuré sur Team Colin : les 476 notifications « à traiter » de la v1
//     étaient à 100 % des leads externes ou des rapports « Sollicitation ».
//     La page les écarte — c'est le lead management qui les traite, avec ses
//     propres règles d'attribution et de relance.
//
//  3. LE MANAGER NE REÇOIT PLUS LA FILE DE SES VENDEURS, IL REÇOIT LEUR DETTE.
//     Un directeur ouvrait la page et recevait 501 notifications qu'il ne
//     pouvait ni lire ni traiter — et il n'a pas à lire les SMS de ses
//     vendeurs. Il voit désormais, par vendeur ou par affaire : la dette
//     ouverte, le retard, la plus ancienne, et la vitesse de réponse
//     habituelle. Deux actes : ALERTER (le vendeur reçoit une notification
//     nommée) et REPRENDRE (le manager s'attribue la dette, qui quitte la file
//     du vendeur). Le détail reste chez celui qui doit agir.
//
//  4. CE QUI FAIT DISPARAÎTRE UNE NOTIFICATION : UN ACTE, JAMAIS UN REGARD.
//       message entrant  -> un sortant vers ce client
//       relance datée    -> le rapport vendeur qui la clôt
//       rendez-vous      -> son COMPTE RENDU, la même fiche que dans l'agenda
//       numéro inconnu   -> rattaché à une fiche, ou écarté sept jours
//
//     Le compte rendu de rendez-vous n'existait pas, et son absence rendait la
//     règle fausse : un rendez-vous disparaissait quand son heure était passée.
//     Le TEMPS le faisait disparaître, pas un acte. Mesuré sur Team Colin :
//     9 135 rendez-vous passés, AUCUN avec un compte rendu — le champ prévu
//     pour cela (TRAITE, IDResultatRdv) n'a jamais été alimenté par personne.
//     Les rendez-vous passés depuis moins de sept jours entrent donc dans
//     « J'ai promis », en tête, sous « À conclure », avec trois boutons.
//     Le REPORT ne solde rien : il met la dette de côté jusqu'à l'heure dite,
//     puis elle revient. Il remplace l'ancien « ignorer », qui la faisait
//     disparaître sans trace et sans retour.
//     Le « vu » n'est pas une action : il arrête le battement de la pastille,
//     et la ligne reste.
//
//  5. LE TRI EST L'URGENCE, ET ELLE EST ÉCRITE EN CLAIR.
//     L'âge de l'attente croisé avec l'enjeu du client — commande en cours,
//     devis, ou rien. Jamais un score opaque : « vous attend depuis 17 h —
//     commande en cours ». Le liseré de gauche est le seul code couleur :
//     bleu clair sous 4 h, ambre au-delà, rouge passé 24 h.
//
//  6. LA PAGE OUVRE SUR LA PREMIÈRE SECTION QUI A QUELQUE CHOSE,
//     dans l'ordre propre au rôle. Une page qui ouvre sur un onglet vide fait
//     douter de toute la page — et aujourd'hui, « On m'attend » est vide pour
//     presque tout le monde, puisque les messages ne sont pas encore branchés.
//
//  QUI VOIT QUOI
//     Vendeur (4)        ma file, mes promesses, mes numéros inconnus
//     Chef des ventes (3) ma file, la dette de mes vendeurs nommés, les
//                        numéros de mes sites
//     Secrétariat (9)    les numéros inconnus d'abord — c'est son métier
//     Direction (1,2,6,7,8) ma file (zéro, et c'est normal) + la dette par
//                        affaire, avec le temps de réponse et la part soldée
//                        sous 24 h : un indicateur de qualité de service
//     Marketing (5)      ma file seulement ; les leads sont ailleurs
//
//  Prérequis SQL : notif_lire, notif_feu, notif_dettes, notif_reporter,
//  notif_reprendre_report, notif_vu_maintenant, notif_alerter,
//  notif_alerte_lue, notif_reprendre, notif_refresh_reponses + job pg_cron
//  « notif_reponses » (toutes les 10 minutes).
//  Tables : notif_report, notif_vu, notif_reponse, notif_alerte, notif_reprise.
// ============================================================================

OD.define('notifications', {
  async mount(__anchor, ctx) {
    __anchor.id = 'notif-root';
    __anchor.setAttribute('data-oropra-notifs', '');
    const doc = __anchor.ownerDocument || document;
    const getRoot = () => __anchor;

    // --- PROFIL TENANT -------------------------------------------------------
    const TC_REF = 'ieztupavcdnubmpbjvuq';
    const IS_TC = (function () {
      try {
        if (window.__OD_NOTIF_PROFILE__ === 'teamcolin') return true;
        const t = ctx.tenant || {};
        if (String(t.supabase_url || '').indexOf(TC_REF) !== -1) return true;
        const slug = String(t.slug || t.code || t.tenant_slug || t.name || '')
          .toLowerCase().replace(/[^a-z]/g, '');
        return slug === 'teamcolin';
      } catch (e) { return false; }
    })();
    if (!IS_TC) {
      getRoot().innerHTML = '<div style="padding:24px;font:14px/1.5 system-ui;color:#5a6b86">'
        + 'Cette version des notifications est réservée à Team Colin.</div>';
      return;
    }

    const SUPABASE_URL = ctx.tenant.supabase_url;
    const SUPABASE_KEY = ctx.tenant.supabase_anon_key;
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
    async function rpc(nom, corps) {
      const jwt = await getUserJwt();
      if (!jwt) throw new Error('session absente');
      const res = await fetch(SUPABASE_URL + '/rest/v1/rpc/' + nom, {
        method: 'POST',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + jwt,
                   'Content-Type': 'application/json' },
        body: JSON.stringify(corps || {})
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return res.json();
    }

    // --- ouverture de la fiche client : même mécanique que le sélecteur
    //     d'historique, qui est la seule qui met TOUT à jour. -----------------
    const FICHE_WORKFLOW_ID     = 'ec8bcc55-a733-4982-a946-13e10ba3b09b';
    const FICHE_PAGE_ID         = '259f1951-a2d4-4b90-ac83-0b3febe1d4ec';
    // En PROD on navigue par CHEMIN : un UID de page passe a goTo s'inscrit tel
    // quel dans l'URL, qui n'est pas une route -> page blanche. Dans l'EDITEUR
    // c'est l'inverse : un chemin relatif s'y resout sur l'origine de l'editeur,
    // qui se recharge alors dans sa propre preview. Meme regle que la topnav.
    const LANG_PREFIX           = '/fr';
    const FICHE_PATH            = '/fiche-client';
    const SELECTED_CLIENT_VAR   = '55490583-c88b-4748-916e-4d203db07742';
    const FICHE_TAB_VAR         = 'fb2cad2c-cd04-42e0-8909-e3c91c8dcfac';
    const TAB_CONTACTS = 2, TAB_RDV = 3;

    const WW = window.wwLib;
    function FW() { try { return (WW.getFrontWindow && WW.getFrontWindow()) || window; } catch (e) { return window; } }
    function ecrireVar(id, v) {
      try { WW.wwVariable.updateValue(id, v); return; } catch (e) { }
      try { const w = FW(); if (w.variables) w.variables[id + '-value'] = v; } catch (e) { }
    }
    function lireVar(id) {
      try { return WW.wwVariable.getValue(id); } catch (e) { return undefined; }
    }
    // L'onglet de la fiche : la variable est posée AVANT la navigation, mais le
    // composant Tabs se monte après et peut la remettre à sa valeur par défaut.
    // On la repose donc quelques fois — et UNIQUEMENT tant que l'utilisateur n'a
    // rien cliqué. C'est la nuance que la topnav avait payée : des réapplications
    // aveugles écrasaient le clic suivant sur un autre onglet et le laissaient
    // vide. Ici, le premier clic éteint le filet.
    function poserOnglet(idx) {
      if (idx == null) return;
      ecrireVar(FICHE_TAB_VAR, idx);
      let vivant = true;
      const w = FW();
      const eteindre = () => { vivant = false; try { w.removeEventListener('click', eteindre, true); } catch (e) { } };
      try { w.addEventListener('click', eteindre, true); } catch (e) { }
      [120, 350, 700, 1200].forEach(ms => setTimeout(() => {
        if (!vivant) return;
        if (Number(lireVar(FICHE_TAB_VAR)) !== Number(idx)) ecrireVar(FICHE_TAB_VAR, idx);
      }, ms));
      setTimeout(eteindre, 1400);
    }
    function dansEditeur() {
      try { return window.self !== window.top; } catch (e) { return true; }
    }
    function allerFiche() {
      if (dansEditeur()) {
        try { WW.wwApp.goTo(FICHE_PAGE_ID); return; } catch (e) { }
        try { WW.goTo(FICHE_PAGE_ID); return; } catch (e) { }
        return;   // pas d'acrobatie en editeur : on eviterait mal les poupees russes
      }
      const href = LANG_PREFIX + FICHE_PATH;
      try { WW.goTo(href); return; } catch (e) { }
      try { FW().location.href = href; } catch (e) { }
    }

    async function ouvrirFiche(idvu, onglet) {
      if (idvu == null || idvu === '') return;
      const id = Number(idvu);
      let client = null;
      try {
        const res = await fetch(SUPABASE_URL + '/rest/v1/CLIENT?IDVu=eq.' + id + '&select=*&limit=1', {
          headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + (await getUserJwt()) }
        });
        if (res.ok) { const j = await res.json(); client = (j && j[0]) || null; }
      } catch (e) { }
      const obj = client ? Object.assign({}, client) : { IDVu: id };
      ecrireVar(SELECTED_CLIENT_VAR, obj);
      // Les quatre relais de la topnav, qui est la seule mécanique éprouvée :
      // variable globale, objet sur la fenêtre de front, sessionStorage (relu au
      // montage de la fiche) et événement. Un seul des quatre suffit rarement.
      try {
        const w = FW();
        w.__odSelectedClient = obj;
        try { sessionStorage.setItem('od_selected_client', JSON.stringify(obj)); } catch (e2) { }
        try { w.dispatchEvent(new CustomEvent('oropra-client-selected', { detail: obj })); } catch (e2) { }
      } catch (e) { }
      try { WW.wwWorkflow.executeGlobal(FICHE_WORKFLOW_ID, { IDVu: id }); } catch (e) { }
      if (onglet != null) poserOnglet(onglet);
      allerFiche();
    }

    // Prévenir la pastille de la barre du haut qu'une dette vient de bouger.
    function prevenirBadge() {
      try {
        const w = FW();
        if (typeof w.oropraNotifBadgeRefresh === 'function') w.oropraNotifBadgeRefresh();
        else if (typeof window.oropraNotifBadgeRefresh === 'function') window.oropraNotifBadgeRefresh();
        doc.dispatchEvent(new CustomEvent('oropra-notif-refresh'));
      } catch (e) { }
    }

    // =========================================================================
    //  CHARTE — mêmes jetons que le tableau de bord. Aucun noir : l'encre est
    //  --ink #1c2b45, et les marques graphiques prennent un pas plus soutenu
    //  des teintes de marque pour rester lisibles en trait fin.
    // =========================================================================
    const CSS = `
#notif-root{
  --bleu:#2a5ea9;--bleu-clair:#acc5e4;--vert:#53bda7;--orange:#fac055;--rouge:#d97070;
  --m-vert:#00997f;--m-orange:#d2941f;--m-bleu:#3f7cba;--m-rouge:#c0524f;
  --ground:#f4f7fb;--card:#fff;--line:#e3e9f3;--line-2:#cfd9e9;
  --ink:#1c2b45;--ink-2:#5a6b86;--ink-3:#8b99b0;
  --ok-bg:#e4f4f0;--alerte-bg:#fdf3de;--chaud-bg:#fbeceb;--calme-bg:#eef2f8;
  --ombre:0 1px 2px rgba(28,43,69,.05),0 8px 24px rgba(28,43,69,.06);
  --ui:"Nunito Sans",system-ui,-apple-system,sans-serif;
  --mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
  font-family:var(--ui);color:var(--ink);background:var(--ground);
  display:block;width:100%;padding:20px 16px 60px;box-sizing:border-box;min-height:70vh}
#notif-root *{box-sizing:border-box}
#notif-root .nw{max-width:1200px;margin:0 auto;display:flex;flex-direction:column;gap:16px}
#notif-root .rail{display:flex;align-items:center;gap:12px 16px;flex-wrap:wrap}
#notif-root .rail h1{margin:0;font-size:21px;font-weight:800;letter-spacing:-.02em}
#notif-root .rail .role{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;
  color:var(--ink-3);background:var(--calme-bg);border-radius:20px;padding:5px 11px}
/* === LA FICHE DE COMPTE RENDU — reprise telle quelle de l'agenda, pour que
   le vendeur retrouve le meme formulaire des deux cotes === */
#notif-ov{position:fixed;inset:0;background:rgba(42,94,169,.18);z-index:3000;display:flex;align-items:center;justify-content:center;font-family:"Nunito Sans",system-ui,sans-serif}
#notif-ov .agm{background:#fff;border-radius:16px;box-shadow:0 16px 50px rgba(42,94,169,.22);width:94%;max-width:520px;max-height:90vh;overflow:hidden;display:flex;flex-direction:column}
#notif-ov .agm-head{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1.5px solid #eef2f8}
#notif-ov .agm-title{font-size:13px;font-weight:800;color:#1F4A85;text-transform:uppercase;letter-spacing:.04em}
#notif-ov .agm-x{width:28px;height:28px;padding:0;border:none;background:#f2f6fc;border-radius:8px;color:#2a5ea9;font-size:18px;cursor:pointer;line-height:1;display:flex;align-items:center;justify-content:center}
#notif-ov .agm-x:hover{background:#e6eefb}
#notif-ov .agm-body{padding:16px 18px;overflow-y:auto;display:flex;flex-direction:column;gap:12px}
#notif-ov .agm-seg{display:flex;border:1.5px solid #e2eaf5;border-radius:10px;overflow:hidden}
#notif-ov .agm-seg button{flex:1;padding:9px 6px;border:none;background:#fff;color:#7a98c5;font-family:inherit;font-weight:700;font-size:12px;cursor:pointer;transition:all .12s}
#notif-ov .agm-seg button:not(:last-child){border-right:1.5px solid #e2eaf5}
#notif-ov .agm-seg button.on{background:#2a5ea9;color:#fff}
#notif-ov .agm-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
#notif-ov .agm-inp,#notif-ov .agm-sel{border:1.5px solid #e2eaf5;border-radius:9px;padding:8px 11px;font-size:13px;font-family:inherit;color:#1F4A85;font-weight:600;background:#fff;outline:none}
#notif-ov .agm-inp:focus,#notif-ov .agm-sel:focus,#notif-ov .agm-ta:focus{border-color:#2a5ea9}
#notif-ov .agm-ta{width:100%;min-height:64px;resize:vertical;border:1.5px solid #e2eaf5;border-radius:9px;padding:8px 11px;font-size:13px;font-family:inherit;color:#1F4A85;font-weight:500;background:#fff;outline:none}
#notif-ov .agm-lbl{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:#9bb3d1;margin-bottom:5px}
#notif-ov .agm-err{color:#a32d2d;font-size:12px;font-weight:700}
#notif-ov .agm-cr-head{display:flex;gap:11px;align-items:flex-start}
#notif-ov .agm-cr-when{font-size:12px;font-weight:800;color:#2a5ea9;white-space:nowrap;background:#f7f9fc;border:1.5px solid #e2eaf5;border-radius:8px;padding:7px 10px;text-align:center;line-height:1.3}
#notif-ov .agm-cr-when small{display:block;font-size:9.5px;color:#9bb3d1;text-transform:uppercase;letter-spacing:.04em;font-weight:700}
#notif-ov .agm-cr-who{min-width:0;padding-top:2px}
#notif-ov .agm-cr-who b{display:block;font-size:15px;font-weight:800;color:#1F4A85;line-height:1.3}
#notif-ov .agm-cr-who span{display:block;font-size:11.5px;color:#7a98c5;font-weight:600;margin-top:2px}
#notif-ov .ct-call{background:#F0F9FF;border:1px solid rgba(96,174,223,.25);border-radius:12px;padding:11px 13px;display:flex;gap:11px;align-items:flex-start}
#notif-ov .ct-ar{flex-shrink:0;width:30px;height:30px;border-radius:50%;border:1.5px solid #60AEDF;display:flex;align-items:center;justify-content:center;background:#fff}
#notif-ov .ct-mid{min-width:0;flex:1}
#notif-ov .ct-top{display:flex;align-items:flex-start;gap:10px}
#notif-ov .ct-who{font-size:13px;font-weight:700;color:#1F4A85;display:flex;align-items:center;gap:6px;min-width:0}
#notif-ov .ct-meta{margin-left:auto;display:flex;flex-direction:column;align-items:flex-end;gap:4px}
#notif-ov .ct-date{font-size:11px;color:#9ca3af;white-space:nowrap;text-align:right;line-height:1.4}
#notif-ov .ct-ton{font-size:11px;color:#60AEDF;background:rgba(96,174,223,.1);border:1px solid rgba(96,174,223,.3);border-radius:999px;padding:1px 8px;white-space:nowrap}
#notif-ov .ct-pill{display:inline-flex;align-items:center;gap:8px;background:#60AEDF1f;border-radius:999px;padding:5px 14px;margin-top:7px;max-width:100%;box-sizing:border-box}
#notif-ov .ct-pill button{background:none;border:none;cursor:pointer;padding:0;width:16px;height:16px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
#notif-ov .ct-pill .t{font-size:12px;color:#60AEDF;min-width:28px;font-variant-numeric:tabular-nums}
#notif-ov .ct-bar{flex:1 1 60px;min-width:40px;max-width:130px;height:3px;background:#60AEDF4d;border-radius:2px;cursor:pointer;position:relative}
#notif-ov .ct-bar i{display:block;height:100%;width:0%;background:#60AEDF;border-radius:2px;pointer-events:none;transition:width .1s linear}
#notif-ov .ct-txt{font-size:13px;color:#4b5563;line-height:1.6;margin-top:7px}
#notif-ov .ct-txt .tg{background:none;border:none;cursor:pointer;padding:0 2px;font-size:12px;color:#9ca3af;font-family:inherit}
#notif-ov .ct-full{display:none;margin-top:8px;padding:12px;background:#f8fbff;border-radius:8px;border:1px solid rgba(96,174,223,.2);font-size:13px;color:#374151;line-height:1.5;white-space:pre-wrap}
#notif-ov .agm-ech{display:grid;gap:6px;grid-template-columns:repeat(3,1fr)}
#notif-ov .agm-ech.quatre{grid-template-columns:repeat(2,1fr)}
#notif-ov .agm-ech button{border:1.5px solid #e2eaf5;background:#fff;border-radius:10px;padding:9px 8px;font-family:inherit;cursor:pointer;text-align:left;transition:all .12s}
#notif-ov .agm-ech button:hover{border-color:#acc5e4}
#notif-ov .agm-ech b{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:800;color:#1F4A85}
#notif-ov .agm-ech i{width:9px;height:9px;border-radius:3px;flex:0 0 auto;display:inline-block}
#notif-ov .agm-ech small{display:block;font-size:10.5px;color:#9bb3d1;font-weight:700;margin-top:3px;padding-left:15px}
#notif-ov .agm-ech button.on{border-color:#2a5ea9;background:#eef4fc;box-shadow:inset 0 0 0 1px #2a5ea9}
#notif-ov .agm-ech button.on small{color:#2a5ea9}
#notif-ov .agm-quand{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
#notif-ov .agm-quand button{border:1.5px solid #e2eaf5;background:#fff;color:#2a5ea9;border-radius:8px;padding:7px 12px;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer}
#notif-ov .agm-quand button.on{background:#2a5ea9;border-color:#2a5ea9;color:#fff}
#notif-ov .agm-note{font-size:11.5px;color:#7a98c5;line-height:1.5;font-weight:600}
#notif-ov .agm-note b{color:#2a5ea9;font-weight:800}
#notif-ov .agm-avis{font-size:11.5px;color:#8a6d1f;background:#fdf3de;border:1.5px solid #f0d9a0;border-radius:9px;padding:9px 11px;font-weight:600;line-height:1.45}
#notif-ov .agm-deplace{font-size:11.5px;color:#9bb3d1;font-weight:600;text-align:center}
#notif-ov .agm-deplace button{background:none;border:none;color:#2a5ea9;font-family:inherit;font-size:11.5px;font-weight:700;text-decoration:underline;cursor:pointer;padding:0}
#notif-ov .agm-done{display:flex;gap:10px;align-items:flex-start;background:#e4f4f0;border:1.5px solid #9ed8c9;border-radius:11px;padding:11px 13px;font-size:13px;color:#0b6b57;font-weight:700;line-height:1.4}
#notif-ov .agm-foot{padding:14px 18px;border-top:1.5px solid #eef2f8}
#notif-ov .agm-save{width:100%;border:none;border-radius:10px;padding:12px;background:#53bda7;color:#fff;font-family:inherit;font-weight:800;font-size:14px;cursor:pointer;transition:background .15s}
#notif-ov .agm-save:hover{background:#46a892}
#notif-ov .agm-save:disabled{opacity:.55;cursor:default}
#notif-ov .agm-foot-edit .agm-save{flex:1}

#notif-root h3.tel{cursor:pointer;font-variant-numeric:tabular-nums}
#notif-root h3.tel:hover{color:var(--bleu)}
#notif-root .rail .perim{font-size:11px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;
  color:var(--bleu);background:var(--calme-bg);border:1px solid var(--bleu-clair);
  border-radius:20px;padding:4px 10px}
#notif-root .rail .maj{font-family:var(--mono);font-size:11.5px;color:var(--ink-3);margin-left:auto}

#notif-root .dette{background:var(--card);border:1px solid var(--line);border-radius:14px;
  box-shadow:var(--ombre);padding:18px 20px;display:flex;gap:18px 30px;align-items:center;flex-wrap:wrap}
#notif-root .dette .q{font-size:10.5px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--ink-3)}
#notif-root .dette .d{flex:1 1 340px;min-width:0}
#notif-root .dette p{margin:6px 0 0;font-size:16.5px;line-height:1.45;max-width:60ch}
#notif-root .dette b{font-weight:800}
#notif-root .jauge{display:flex;gap:22px;flex-wrap:wrap}
#notif-root .jauge div{min-width:72px}
#notif-root .jauge .n{font-family:var(--mono);font-size:23px;font-weight:600;line-height:1}
#notif-root .jauge .l{font-size:10px;color:var(--ink-3);margin-top:5px;line-height:1.25}
#notif-root .jauge .n.chaud{color:var(--m-rouge)}
#notif-root .jauge .n.tiede{color:var(--m-orange)}

#notif-root .ongl{display:flex;gap:3px;background:var(--calme-bg);border-radius:11px;padding:3px;
  flex-wrap:wrap}
#notif-root .ongl button{font:inherit;font-size:13px;font-weight:700;color:var(--ink-2);background:none;
  border:0;padding:8px 15px;border-radius:8px;cursor:pointer;display:inline-flex;align-items:center;gap:7px}
#notif-root .ongl button[aria-pressed="true"]{background:var(--card);color:var(--ink);
  box-shadow:0 1px 2px rgba(28,43,69,.08)}
#notif-root .ongl .cpt{font-family:var(--mono);font-size:11px;font-weight:700;background:var(--line);
  color:var(--ink-2);border-radius:9px;padding:1px 7px;min-width:20px;text-align:center}
#notif-root .ongl button[aria-pressed="true"] .cpt{background:var(--bleu);color:#fff}
#notif-root .ongl .cpt.chaud{background:var(--m-rouge);color:#fff}
#notif-root .ongl .cpt.tiede{background:var(--m-orange);color:#fff}

#notif-root .filtres{display:flex;gap:8px;flex-wrap:wrap;align-items:center}
#notif-root .puce{font-size:12.5px;font-weight:600;padding:6px 12px;border-radius:9px;
  border:1px solid var(--line);background:var(--card);color:var(--ink-2);cursor:pointer;
  display:inline-flex;align-items:center;gap:7px}
#notif-root .puce .dot{width:8px;height:8px;border-radius:50%}
#notif-root .puce[aria-pressed="true"]{background:var(--calme-bg);color:var(--bleu);border-color:var(--bleu-clair)}
#notif-root .filtres .tri{margin-left:auto;font-size:12px;color:var(--ink-3)}
#notif-root .filtres .tri b{color:var(--ink-2);font-weight:700}

#notif-root .pile{display:flex;flex-direction:column;gap:10px}
#notif-root .cli{background:var(--card);border:1px solid var(--line);border-radius:14px;
  box-shadow:var(--ombre);padding:14px 16px;display:grid;grid-template-columns:44px minmax(0,1fr) auto;
  gap:14px;align-items:start;position:relative;overflow:hidden}
#notif-root .cli::before{content:'';position:absolute;left:0;top:0;bottom:0;width:4px;background:var(--line-2)}
#notif-root .cli.tiede::before{background:var(--m-orange)}
#notif-root .cli.chaud::before{background:var(--m-rouge)}
#notif-root .cli.froid::before{background:var(--bleu-clair)}
#notif-root .av{width:44px;height:44px;border-radius:12px;background:var(--calme-bg);color:var(--bleu);
  display:flex;align-items:center;justify-content:center;font-weight:800;font-size:15px;letter-spacing:-.02em}
#notif-root .cli h3{margin:0;font-size:16px;font-weight:800;letter-spacing:-.01em;display:flex;
  align-items:center;gap:9px;flex-wrap:wrap}
#notif-root .enjeu{font-size:10.5px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;
  padding:3px 8px;border-radius:7px}
#notif-root .enjeu.cde{background:var(--ok-bg);color:var(--m-vert)}
#notif-root .enjeu.devis{background:var(--calme-bg);color:var(--m-bleu)}
#notif-root .enjeu.livr{background:var(--alerte-bg);color:var(--m-orange)}
#notif-root .cli .attend{font-size:13px;color:var(--ink-2);margin:5px 0 0;font-weight:600}
#notif-root .cli .attend .depuis{color:var(--m-rouge)}
#notif-root .cli .attend .depuis.tiede{color:var(--m-orange)}
#notif-root .cli .attend .depuis.calme{color:var(--ink-3)}
#notif-root .fil{display:flex;gap:7px;flex-wrap:wrap;margin-top:9px}
#notif-root .ev{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;font-weight:600;
  background:var(--calme-bg);border-radius:8px;padding:4px 9px;color:var(--ink-2)}
#notif-root .ev .ic{width:14px;height:14px;border-radius:4px;display:flex;align-items:center;
  justify-content:center;color:#fff}
#notif-root .ev .ic svg{width:9px;height:9px;stroke:currentColor;fill:none;stroke-width:2.6}
#notif-root .ev.manq{background:var(--chaud-bg);color:var(--m-rouge)}
#notif-root .cli .extrait{font-size:13px;color:var(--ink-2);margin:9px 0 0;font-style:italic;
  border-left:2px solid var(--line);padding-left:10px;line-height:1.45}
#notif-root .extrait.media{font-style:normal}
#notif-root .vocal{display:inline-flex;align-items:center;gap:9px;background:var(--calme-bg);
  border:1px solid var(--bleu-clair);border-radius:999px;padding:5px 14px 5px 5px;margin-top:9px;
  max-width:330px;width:100%;box-sizing:border-box}
#notif-root .vocal .voc{border:none;background:var(--bleu);color:#fff;width:24px;height:24px;
  border-radius:50%;display:flex;align-items:center;justify-content:center;flex:0 0 auto;
  cursor:pointer;padding:0}
#notif-root .vocal .voc:disabled{opacity:.45;cursor:default}
#notif-root .vocal .voc svg{width:9px;height:9px;fill:currentColor}
#notif-root .vbar{flex:1 1 auto;min-width:40px;height:3px;background:var(--bleu-clair);
  border-radius:2px;position:relative;cursor:pointer}
#notif-root .vprog{position:absolute;inset:0 auto 0 0;width:0;background:var(--bleu);
  border-radius:2px;pointer-events:none}
#notif-root .vtime{font-size:11.5px;font-weight:700;color:var(--bleu);flex:0 0 auto;
  font-variant-numeric:tabular-nums;min-width:30px;text-align:right}
#notif-root .vtr{font-style:italic}
#notif-root .vtr.attente{color:var(--ink-3);font-style:normal}
#notif-root .actes{display:flex;flex-direction:column;gap:7px;align-items:stretch;min-width:132px}
#notif-root .btn{font:inherit;font-size:12.5px;font-weight:700;border-radius:9px;padding:8px 13px;
  cursor:pointer;border:1px solid transparent;text-align:center;white-space:nowrap}
#notif-root .btn.p{background:var(--bleu);color:#fff}
#notif-root .btn.p:hover{background:#24528f}
#notif-root .btn.s{background:var(--card);border-color:var(--line-2);color:var(--ink-2)}
#notif-root .btn.s:hover{border-color:var(--bleu-clair);color:var(--bleu)}
#notif-root .btn.t{background:none;color:var(--ink-3);font-weight:600;font-size:12px;padding:4px}
#notif-root .btn.t:hover{color:var(--ink-2)}
#notif-root .report{background:var(--calme-bg);border-radius:10px;padding:10px 12px;margin-top:10px;
  display:flex;gap:7px;flex-wrap:wrap;align-items:center;font-size:12px;color:var(--ink-2)}
#notif-root .report .q{font-size:12px;font-weight:600;padding:4px 10px;border-radius:7px;
  border:1px solid var(--line-2);background:var(--card);cursor:pointer;color:var(--ink-2)}
#notif-root .report .q:hover{border-color:var(--bleu-clair);color:var(--bleu)}

#notif-root .jour{display:flex;align-items:center;gap:10px;margin:8px 0 0}
#notif-root .jour .t{font-size:11px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:var(--ink-2)}
#notif-root .jour .ligne{flex:1;height:1px;background:var(--line)}
#notif-root .jour .n{font-family:var(--mono);font-size:11.5px;color:var(--ink-3)}
#notif-root .pr{background:var(--card);border:1px solid var(--line);border-radius:12px;
  box-shadow:var(--ombre);padding:12px 15px;display:grid;grid-template-columns:66px minmax(0,1fr) auto;
  gap:14px;align-items:center}
#notif-root .pr .h{font-family:var(--mono);font-size:15px;font-weight:600;color:var(--ink)}
#notif-root .pr .h small{display:block;font-family:var(--ui);font-size:10.5px;color:var(--ink-3);
  font-weight:700;text-transform:uppercase;letter-spacing:.04em;margin-top:2px}
#notif-root .pr.retard .h{color:var(--m-rouge)}
#notif-root .pr b{font-size:14.5px;font-weight:800}
#notif-root .pr .quoi{font-size:12.5px;color:var(--ink-2);margin-top:2px}
#notif-root .pr .actes{flex-direction:row;min-width:0;align-items:center}

#notif-root .tab{width:100%;border-collapse:collapse;font-size:13px;background:var(--card);
  border:1px solid var(--line);border-radius:13px;overflow:hidden;box-shadow:var(--ombre)}
#notif-root .tab th{font-size:9.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;
  color:var(--ink-3);text-align:right;padding:11px 12px;background:var(--calme-bg)}
#notif-root .tab th:first-child{text-align:left}
#notif-root .tab td{padding:11px 12px;border-top:1px solid var(--line);text-align:right;
  font-variant-numeric:tabular-nums}
#notif-root .tab td:first-child{text-align:left;font-weight:700}
#notif-root .tab td.f{font-family:var(--mono);font-weight:600}
#notif-root .tab td .mauvais{color:var(--m-rouge);font-weight:700}
#notif-root .tab td .bon{color:var(--m-vert)}
#notif-root .tab tr:hover td{background:#fafcff}
#notif-root .tab .mini{font-size:11.5px;font-weight:600;color:var(--ink-3);padding:5px 10px;
  border-radius:7px;border:1px solid var(--line-2);background:var(--card);cursor:pointer}
#notif-root .tab .mini:hover{color:var(--bleu);border-color:var(--bleu-clair)}
#notif-root .barre{height:7px;border-radius:4px;background:var(--calme-bg);overflow:hidden;
  min-width:70px;display:inline-block;vertical-align:middle}
#notif-root .barre i{display:block;height:100%;border-radius:4px}
#notif-root .dscroll{overflow-x:auto;max-width:100%}

#notif-root .vide{background:var(--card);border:1px dashed var(--line-2);border-radius:14px;
  padding:30px 26px;text-align:center}
#notif-root .vide .ico{width:46px;height:46px;border-radius:14px;background:var(--ok-bg);
  margin:0 auto 14px;display:flex;align-items:center;justify-content:center}
#notif-root .vide .ico svg{width:23px;height:23px;stroke:var(--m-vert);fill:none;stroke-width:2.4}
#notif-root .vide h3{margin:0 0 6px;font-size:16px;font-weight:800}
#notif-root .vide p{margin:0 auto;font-size:13.5px;color:var(--ink-2);max-width:52ch;line-height:1.55}
#notif-root .vide.attente .ico{background:var(--calme-bg)}
#notif-root .vide.attente .ico svg{stroke:var(--ink-3)}
#notif-root .pied{font-size:11.5px;color:var(--ink-3);line-height:1.65;max-width:84ch}
#notif-root .pied b{color:var(--ink-2);font-weight:700}
#notif-root .expl{background:var(--card);border:1px solid var(--bleu-clair);border-left:4px solid var(--bleu);
  border-radius:11px;padding:14px 17px;font-size:13px;line-height:1.6;color:var(--ink-2)}
#notif-root .expl .t{font-size:10.5px;font-weight:800;letter-spacing:.08em;text-transform:uppercase;
  color:var(--bleu);margin-bottom:6px}
#notif-root .expl b{color:var(--ink);font-weight:800}
#notif-root .expl ul{margin:8px 0 0;padding-left:20px}
#notif-root .expl li{margin-bottom:5px}
@media(max-width:760px){
  #notif-root .cli{grid-template-columns:38px minmax(0,1fr)}
  #notif-root .actes{grid-column:1/-1;flex-direction:row;flex-wrap:wrap}
  #notif-root .pr{grid-template-columns:60px minmax(0,1fr)}
  #notif-root .dette p{font-size:15px}
}
`;
    if (!doc.getElementById('notif-tc-css')) {
      const st = doc.createElement('style'); st.id = 'notif-tc-css'; st.textContent = CSS;
      doc.head.appendChild(st);
    }

    // =========================================================================
    //  OUTILS
    // =========================================================================
    const esc = s => String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const num = v => { const n = Number(v); return isFinite(n) ? n : 0; };
    const FINE = ' ';
    // Un lien tel: n'ouvre rien sur un poste de travail : le bouton y copiait
    // le vide. Sur telephone il compose, sur ordinateur il copie le numero.
    const SUR_MOBILE = /Mobi|Android|iPhone|iPad|iPod/i.test(
      (navigator && navigator.userAgent) || '');
    const fmt = n => String(Math.round(num(n))).replace(/\B(?=(\d{3})+(?!\d))/g, FINE);

    // Une durée se lit, elle ne se calcule pas : « 17 h » plutôt que
    // « 1020 min ». Entre une heure et un jour, les minutes restent : une
    // réponse médiane de « 2 h » et une de « 2 h 05 » ne se comparent pas si
    // on arrondit les deux au même chiffre.
    function duree(min) {
      const m = Math.max(Math.round(num(min)), 0);
      if (m < 60) return m + ' min';
      if (m < 1440) {
        const h = Math.floor(m / 60), r = m % 60;
        return h + ' h' + (r ? FINE + String(r).padStart(2, '0') : '');
      }
      const j = Math.round(m / 1440);
      if (j < 2) return Math.round(m / 60) + ' h';
      return j + ' j';
    }
    function heure(iso) {
      if (!iso) return '';
      const d = new Date(iso);
      return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0');
    }
    const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet',
                  'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    function jourLisible(iso) {
      if (!iso) return '';
      const d = new Date(iso), a = new Date();
      const j0 = new Date(a.getFullYear(), a.getMonth(), a.getDate());
      const j1 = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const ecart = Math.round((j1 - j0) / 86400000);
      if (ecart === 0) return 'aujourd’hui';
      if (ecart === 1) return 'demain';
      if (ecart === -1) return 'hier';
      if (ecart > 1 && ecart < 7) return JOURS[d.getDay()];
      return d.getDate() + ' ' + MOIS[d.getMonth()];
    }
    function quandLisible(iso) {
      if (!iso) return '';
      const d = new Date(iso), s = (Date.now() - d.getTime()) / 1000;
      if (s < 0) return jourLisible(iso) + ' ' + heure(iso);
      if (s < 3600) return 'il y a ' + Math.max(Math.round(s / 60), 1) + ' min';
      if (s < 86400) return jourLisible(iso) + ' ' + heure(iso);
      return jourLisible(iso) + ' ' + heure(iso);
    }
    function initiales(nom) {
      const p = String(nom || '').trim().split(/\s+/).filter(Boolean);
      if (!p.length) return '?';
      if (p.length === 1) return p[0].slice(0, 2).toUpperCase();
      return (p[0][0] + p[p.length - 1][0]).toUpperCase();
    }
    // Un numéro ne s'affiche jamais en entier dans une liste : les quatre
    // derniers chiffres suffisent à reconnaître un appel, et le reste n'a pas
    // à traîner sur un écran partagé en concession.
    // Le numéro s'affiche EN ENTIER : c'est la seule chose qu'on sache de cet
    // appelant, et le masquer rendait la carte inutile. Groupé par deux, en
    // gardant un éventuel indicatif international devant.
    function telLisible(t) {
      let s = String(t || '').replace(/[^0-9+]/g, '');
      if (!s) return '—';
      // La telephonie stocke en E.164 (+33603439144). Un vendeur lit 06 03 43
      // 91 44 : on rend la forme nationale pour la France, et on garde
      // l'indicatif devant pour tout le reste.
      let p = '';
      if (/^\+33[1-9][0-9]{8}$/.test(s)) { s = '0' + s.slice(3); }
      else if (s.charAt(0) === '+') { p = s.slice(0, 3) + FINE; s = s.slice(3); }
      return p + (s.match(/.{1,2}/g) || [s]).join(FINE);
    }

    const CANAL = {
      SMS:      { lab: 'SMS',      c: 'var(--m-orange)' },
      WHATSAPP: { lab: 'WhatsApp', c: 'var(--m-vert)' },
      EMAIL:    { lab: 'Email',    c: 'var(--ink-3)' },
      VOIP:     { lab: 'Appel',    c: 'var(--m-bleu)' },
      RPV:      { lab: 'Rapport',  c: 'var(--m-rouge)' }
    };
    const ICO = {
      SMS:      '<svg viewBox="0 0 24 24"><path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.9-.9L3 21l1.9-5.6A8.5 8.5 0 1 1 21 11.5z"/></svg>',
      WHATSAPP: '<svg viewBox="0 0 24 24"><path d="M21 11.5a8.4 8.4 0 0 1-8.5 8.5 8.5 8.5 0 0 1-3.9-.9L3 21l1.9-5.6A8.5 8.5 0 1 1 21 11.5z"/></svg>',
      EMAIL:    '<svg viewBox="0 0 24 24"><rect x="3" y="5" width="18" height="14" rx="2"/><path d="m3 7 9 6 9-6"/></svg>',
      VOIP:     '<svg viewBox="0 0 24 24"><path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3-8.6A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/></svg>',
      MANQUE:   '<svg viewBox="0 0 24 24"><path d="M22 2 2 22M8 5H5v3M16 19h3v-3"/></svg>',
      RPV:      '<svg viewBox="0 0 24 24"><circle cx="9" cy="8" r="3.5"/><path d="M3 20c0-3.3 2.7-6 6-6s6 2.7 6 6"/></svg>'
    };

    const ROLES = { 1: 'Admin', 2: 'Direction', 3: 'Chef des ventes', 4: 'Vendeur',
                    5: 'Marketing', 6: 'Directeur plaque', 7: 'Directeur marque',
                    8: 'Directeur groupe', 9: 'Secrétariat commercial' };

    // =========================================================================
    //  ÉTAT
    // =========================================================================
    const state = { j: null, section: null, canal: 'TOUS', erreur: null,
                    chargement: true, reportOuvert: null, busBound: false,
                    sig: null };

    // Le périmètre choisi dans la barre du haut. « Tout mon périmètre » ne
    // filtre rien : on envoie null plutôt que la liste complète, pour que la
    // base garde sa propre définition du périmètre et ne la recalcule pas à
    // partir d'une liste que le front aurait pu tronquer.
    function sitesDuPerimetre() {
      try {
        const b = FW().oropraSite || window.oropraSite;
        if (!b) return null;
        const p = (typeof b.getPerimetre === 'function') ? b.getPerimetre() : null;
        if (!p || p.level === 'all') return null;
        const l = (typeof b.getSitesDuPerimetre === 'function') ? b.getSitesDuPerimetre() : null;
        return (l && l.length) ? l : null;
      } catch (e) { return null; }
    }
    function signature(l) { return l ? l.slice().sort((a, b) => a - b).join(',') : '*'; }

    function famille() {
      const r = num((state.j && state.j.moi && state.j.moi.role));
      // Tout rôle connu hors des rôles manager (vendeur, opérateur plateau = 10)
      // reçoit la vue vendeur. Miroir de public.role_est_manager(), 05/10/2026 :
      // avant, un rôle inconnu tombait sur la vue direction.
      if (r === 4 || (r > 0 && ![1, 2, 3, 5, 6, 7, 8, 9].includes(r))) return 'vendeur';
      if (r === 3) return 'chef';
      if (r === 9) return 'secretaire';
      if (r === 5) return 'marketing';
      return 'direction';
    }
    const TITRES = {
      vendeur:    'On vous attend',
      chef:       'Ce que votre équipe doit à ses clients',
      direction:  'La dette client du périmètre',
      secretaire: 'Qui a appelé ?',
      marketing:  'On vous attend'
    };

    // L'ordre des sections dépend du rôle, et la page ouvre sur la PREMIÈRE
    // qui a quelque chose. Le secrétariat commence par les numéros inconnus :
    // c'est son métier, pas un reste.
    const ORDRE = {
      vendeur:    ['ma_file', 'promesses', 'inconnus', 'reportees'],
      chef:       ['ma_file', 'equipe', 'inconnus', 'promesses', 'reportees'],
      direction:  ['ma_file', 'perimetre', 'reportees'],
      secretaire: ['inconnus', 'ma_file', 'promesses', 'reportees'],
      marketing:  ['ma_file', 'promesses', 'reportees']
    };
    const LABELS = {
      ma_file:   'On m’attend',
      promesses: 'J’ai promis',
      equipe:    'L’équipe',
      perimetre: 'Le périmètre',
      inconnus:  'Inconnus',
      reportees: 'Reportées'
    };
    function compteur(sec) {
      const c = (state.j && state.j.compteurs) || {};
      if (sec === 'promesses') return num(c.relances) + num(c.rdv) + num(c.a_conclure);
      if (sec === 'perimetre') return num(c.equipe);
      return num(c[sec]);
    }
    function tonSection(sec) {
      const c = (state.j && state.j.compteurs) || {};
      if (sec === 'ma_file') return num(c.chaud) > 0 ? 'chaud' : (num(c.tiede) > 0 ? 'tiede' : '');
      if (sec === 'promesses')
        return num(c.relances_retard) > 0 ? 'chaud' : (num(c.a_conclure) > 0 ? 'tiede' : '');
      if (sec === 'equipe' || sec === 'perimetre') {
        const l = (state.j[sec] || []);
        return l.some(x => num(x.en_retard) > 0) ? 'chaud' : '';
      }
      if (sec === 'inconnus') return num(c.inconnus) > 0 ? 'tiede' : '';
      return '';
    }
    function premiereSectionUtile() {
      const o = ORDRE[famille()] || ORDRE.vendeur;
      for (const s of o) if (compteur(s) > 0) return s;
      return o[0];
    }

    // =========================================================================
    //  CHARGEMENT
    // =========================================================================
    let EN_VOL = null;
    async function charger() {
      if (EN_VOL) return EN_VOL;
      EN_VOL = (async () => {
        try {
          const sites = sitesDuPerimetre();
          const j = await rpc('notif_lire', { p_sites: sites });
          state.j = j; state.erreur = null; state.sig = signature(sites);
        } catch (e) {
          state.erreur = (e && e.message) || 'erreur inconnue';
        } finally {
          state.chargement = false;
          EN_VOL = null;
        }
      })();
      return EN_VOL;
    }

    // =========================================================================
    //  LE BANDEAU — la dette en une phrase
    // =========================================================================
    function bandeau() {
      const j = state.j, c = j.compteurs || {}, f = famille();
      const svc = j.service || {};
      let q, txt, jauge;

      if (f === 'chef' || f === 'direction') {
        const eq = (f === 'chef' ? (j.equipe || []) : (j.perimetre || []));
        const pire = eq.slice().sort((a, b) =>
          (num(b.en_retard) - num(a.en_retard)) || (num(b.plus_ancienne_min) - num(a.plus_ancienne_min)))[0];
        const retard = eq.reduce((a, x) => a + num(x.en_retard), 0);
        q = f === 'chef' ? 'La dette de l’équipe' : 'Ce qui n’a pas reçu de réponse';
        txt = num(c.equipe) === 0
          ? 'Aucun client n’attend de réponse sur votre périmètre.'
          : '<b>' + fmt(c.equipe) + '</b> client' + (c.equipe > 1 ? 's attendent' : ' attend')
            + ' une réponse'
            + (retard > 0 ? ', dont <b>' + fmt(retard) + '</b> depuis plus de 24 h' : '')
            + (pire && num(pire.plus_ancienne_min) > 0
                ? '. La plus ancienne dort chez <b>' + esc(pire.nom) + '</b> depuis '
                  + duree(pire.plus_ancienne_min) + '.'
                : '.');
        jauge = [
          ['en retard', fmt(retard), retard > 0 ? 'chaud' : ''],
          ['réponse médiane', svc.mediane == null ? '—' : duree(svc.mediane), ''],
          ['soldées < 24 h', svc.sous_24h == null ? '—' : (svc.sous_24h + FINE + '%'), ''],
          ['pour vous<br>personnellement', fmt(c.ma_file), num(c.ma_file) > 0 ? 'tiede' : '']
        ];
      } else if (f === 'secretaire') {
        const inc = (j.inconnus || []);
        const multi = inc.filter(x => num(x.nb_messages) > 1).length;
        q = 'Votre travail du matin';
        txt = inc.length === 0
          ? 'Aucun numéro inconnu : tous les appels reçus sont rattachés à une fiche.'
          : '<b>' + fmt(inc.length) + '</b> numéro' + (inc.length > 1 ? 's ont' : ' a')
            + ' appelé sans qu’on sache qui c’est'
            + (multi > 0 ? '. <b>' + fmt(multi) + '</b> ' + (multi > 1 ? 'ont' : 'a')
                + ' rappelé plus d’une fois : ceux-là d’abord.' : '.');
        jauge = [
          ['ont rappelé<br>plusieurs fois', fmt(multi), multi > 0 ? 'tiede' : ''],
          ['un seul appel', fmt(inc.length - multi), ''],
          ['dans ma file', fmt(c.ma_file), num(c.ma_file) > 0 ? 'tiede' : '']
        ];
      } else {
        const aAppeler = num(c.ma_file) + num(c.relances_retard);
        q = 'Votre dette du moment';
        if (aAppeler === 0) {
          txt = num(c.rdv) > 0
            ? 'Personne n’attend de réponse de vous. Vous avez <b>' + fmt(c.rdv)
              + '</b> rendez-vous à venir.'
            : 'Personne n’attend de réponse de vous, et rien n’est en retard.';
        } else {
          const vieille = (j.ma_file || [])[0];
          txt = '<b>' + fmt(c.ma_file) + '</b> personne'
            + (num(c.ma_file) > 1 ? 's attendent' : ' attend') + ' une réponse de vous'
            + (vieille ? ', dont une <b>depuis ' + duree(vieille.attend_min) + '</b>' : '')
            + (num(c.relances_retard) > 0
                ? '. Et <b>' + fmt(c.relances_retard) + '</b> relance'
                  + (c.relances_retard > 1 ? 's sont' : ' est') + ' en retard.'
                : '.');
        }
        jauge = [
          ['en retard<br>(> 24 h)', fmt(c.chaud), num(c.chaud) > 0 ? 'chaud' : ''],
          ['à surveiller<br>(> 4 h)', fmt(c.tiede), num(c.tiede) > 0 ? 'tiede' : ''],
          ['promesses<br>du jour', fmt(num(c.relances) + num(c.rdv)), ''],
          ['reportées', fmt(c.reportees), '']
        ];
      }

      return '<section class="dette"><div class="d"><div class="q">' + q + '</div>'
        + '<p>' + txt + '</p></div><div class="jauge">'
        + jauge.map(x => '<div><div class="n ' + x[2] + '">' + x[1] + '</div>'
            + '<div class="l">' + x[0] + '</div></div>').join('')
        + '</div></section>';
    }

    // =========================================================================
    //  LES CARTES
    // =========================================================================
    function pastillesCanaux(medias, manque) {
      const l = (medias || []).slice();
      let h = '';
      if (manque) h += '<span class="ev manq"><span class="ic" style="background:var(--m-rouge)">'
        + ICO.MANQUE + '</span>Appel manqué</span>';
      l.forEach(m => {
        if (m === 'VOIP' && manque) return;      // déjà dit, et plus précisément
        const k = CANAL[m] || { lab: m, c: 'var(--ink-3)' };
        h += '<span class="ev"><span class="ic" style="background:' + k.c + '">'
          + (ICO[m] || '') + '</span>' + esc(k.lab) + '</span>';
      });
      return h;
    }
    const ENJEU = { cde: ['cde', 'Commande en cours'], devis: ['devis', 'Devis en cours'] };

    // =========================================================================
    //  L'APERÇU D'UN MÉDIA
    //
    //  Le connecteur WhatsApp écrit « [audio] », « [image] »… dans le corps du
    //  message quand il n'y a pas de texte. Ces marqueurs techniques
    //  remontaient tels quels dans l'aperçu de la carte : le vendeur lisait
    //  « [audio] » et n'avait aucun moyen d'entendre quoi que ce soit depuis
    //  cette page.
    //
    //  Pour une note vocale on pose donc un vrai lecteur — bouton, barre de
    //  temps, durée — ET la transcription juste en dessous. C'est le média le
    //  plus fréquent en concession, et demander d'ouvrir la fiche pour trois
    //  secondes de son annule le bénéfice de la page : on vient ici pour
    //  savoir quoi faire, pas pour naviguer.
    //
    //  La transcription est la vraie réponse au besoin : un vendeur en
    //  clientèle lit en deux secondes ce qu'il mettrait vingt secondes à
    //  écouter, et il peut le faire sans son. Le lecteur reste là pour le ton
    //  de la voix, qui ne se transcrit pas.
    //
    //  L'URL signée est posée à l'AFFICHAGE, pas au clic — voir hydraterVocaux.
    // =========================================================================
    const MEDIA_LIB = {
      '[audio]': 'Note vocale', '[image]': 'Photo', '[video]': 'Vidéo',
      '[document]': 'Document', '[sticker]': 'Sticker',
      '[localisation]': 'Localisation', '[contact]': 'Contact'
    };
    const IC_LECTURE = '<svg viewBox="0 0 10 12"><path d="M0 0l10 6-10 6z"/></svg>';
    const IC_PAUSE   = '<svg viewBox="0 0 12 12"><rect x="0" y="0" width="4" height="12" rx="1"/>'
                     + '<rect x="8" y="0" width="4" height="12" rx="1"/></svg>';
    function libelleApercu(t) {
      const k = String(t == null ? '' : t).trim().toLowerCase();
      return MEDIA_LIB[k] || t;
    }
    function estMedia(t) {
      const k = String(t == null ? '' : t).trim().toLowerCase();
      return Object.prototype.hasOwnProperty.call(MEDIA_LIB, k);
    }
    function mmss(s) {
      const n = Math.max(0, Math.round(Number(s) || 0));
      return Math.floor(n / 60) + ':' + String(n % 60).padStart(2, '0');
    }
    function apercuHtml(x) {
      if (!x || !x.apercu) return '';
      const k = String(x.apercu).trim().toLowerCase();
      if (k === '[audio]' && Array.isArray(x.cycles) && x.cycles.length) {
        // Le bouton reste désactivé jusqu'à ce que l'URL signée soit posée :
        // un bouton qui ne fait rien au clic est pire qu'un bouton grisé.
        // La durée affiche --:-- tant que la transcription n'a pas rendu la
        // sienne : mieux vaut un tiret qu'un 0:00 qui serait un mensonge.
        return '<div class="vocal" data-voc="' + esc(x.cycles.join(',')) + '">'
          + '<button type="button" class="voc" disabled aria-label="Écouter">'
          + IC_LECTURE + '</button>'
          + '<div class="vbar"><div class="vprog"></div></div>'
          + '<span class="vtime">--:--</span>'
          + '</div>'
          + '<p class="extrait vtr attente" data-vtr="' + esc(x.cycles.join(',')) + '">'
          + 'Transcription…</p>';
      }
      return '<p class="extrait' + (estMedia(x.apercu) ? ' media' : '') + '">'
        + esc(libelleApercu(x.apercu)) + '</p>';
    }

    function carteDette(x) {
      const ton = x.feu === 'chaud' ? 'chaud' : (x.feu === 'tiede' ? 'tiede' : 'froid');
      const e = ENJEU[x.enjeu];
      const nom = x.client_nom || ('Client ' + x.id_client);
      const ouvert = String(state.reportOuvert) === String(x.id_client);
      return '<article class="cli ' + ton + '" data-client="' + esc(x.id_client) + '">'
        + '<div class="av">' + esc(initiales(nom)) + '</div>'
        + '<div>'
        +   '<h3>' + esc(nom)
        +     (e ? ' <span class="enjeu ' + e[0] + '">' + e[1] + '</span>' : '')
        +   '</h3>'
        +   '<p class="attend">Vous attend <span class="depuis'
        +     (x.feu === 'tiede' ? ' tiede' : (x.feu === 'calme' ? ' calme' : ''))
        +     '">depuis ' + duree(x.attend_min) + '</span>'
        +     (num(x.nb_ev) > 1 ? ' — ' + fmt(x.nb_ev) + ' messages sans réponse' : '')
        +   '</p>'
        +   '<div class="fil">' + pastillesCanaux(x.medias, x.a_un_manque)
        +     '<span class="ev">' + esc(quandLisible(x.attend_depuis)) + '</span></div>'
        +   apercuHtml(x)
        +   (ouvert ? blocReport('client', x.id_client) : '')
        + '</div>'
        + '<div class="actes">'
        +   '<button type="button" class="btn p" data-role="repondre">Contacter</button>'
        +   '<button type="button" class="btn t" data-role="reporter">Reporter</button>'
        + '</div></article>';
    }

    // Le report propose des échéances, pas un calendrier : « ce soir », « demain
    // matin ». Un vendeur ne remplit pas un formulaire de date entre deux clients.
    function blocReport(scope, cle) {
      return '<div class="report" data-scope="' + esc(scope) + '" data-cle="' + esc(cle) + '">'
        + 'Vous ne pouvez pas maintenant ? Dites quand : '
        + '<button type="button" class="q" data-h="1">dans 1 h</button>'
        + '<button type="button" class="q" data-h="3">dans 3 h</button>'
        + '<button type="button" class="q" data-soir="1">ce soir 18 h</button>'
        + '<button type="button" class="q" data-demain="9">demain 9 h</button>'
        + '<button type="button" class="q" data-jours="2">après-demain</button>'
        + '</div>';
    }

    function carteAlerte(a) {
      return '<article class="cli chaud" data-alerte="' + esc(a.id) + '">'
        + '<div class="av">!</div>'
        + '<div><h3>' + esc(a.client_nom || 'Dossier à traiter')
        + ' <span class="enjeu livr">Signalé par ' + esc(a.de) + '</span></h3>'
        + '<p class="attend">' + esc(quandLisible(a.cree_le)) + '</p>'
        + (a.message ? '<p class="extrait">' + esc(a.message) + '</p>' : '')
        + '</div>'
        + '<div class="actes">'
        + (a.id_client ? '<button type="button" class="btn p" data-role="repondre">Ouvrir la fiche</button>' : '')
        + '<button type="button" class="btn t" data-role="alerte-lue">J’ai vu</button>'
        + '</div></article>';
    }

    function carteInconnu(i) {
      const n = num(i.nb_messages);
      const ton = n > 1 ? 'tiede' : 'froid';
      return '<article class="cli ' + ton + '" data-inconnu="' + esc(i.interlocuteur) + '">'
        + '<div class="av">?</div>'
        + '<div><h3 class="tel" data-tel="' + esc(i.interlocuteur) + '">'
        +   esc(telLisible(i.interlocuteur))
        +   (n > 1 ? ' <span class="enjeu livr">' + fmt(n) + ' appels</span>' : '') + '</h3>'
        + '<p class="attend">A appelé <span class="depuis'
        +   (n > 1 ? ' tiede' : ' calme') + '">'
        +   (n > 1 ? fmt(n) + ' fois' : 'une fois, ' + quandLisible(i.last_contact)) + '</span>'
        +   ' — aucune fiche ne porte ce numéro</p>'
        + '<div class="fil">' + pastillesCanaux([i.media], false)
        +   '<span class="ev">Dernier : ' + esc(quandLisible(i.last_contact)) + '</span>'
        +   (i.site ? '<span class="ev">Reçu sur ' + esc(i.site) + '</span>' : '') + '</div>'
        + (i.apercu ? '<p class="extrait' + (estMedia(i.apercu) ? ' media' : '') + '">'
            + esc(libelleApercu(i.apercu)) + '</p>' : '')
        + '</div>'
        + '<div class="actes">'
        +   '<button type="button" class="btn p" data-role="appeler" data-tel="'
        +     esc(i.interlocuteur) + '">' + (SUR_MOBILE ? 'Appeler' : 'Copier le numéro')
        +     '</button>'
        +   '<button type="button" class="btn t" data-role="ecarter">Écarter 7 jours</button>'
        + '</div></article>';
    }

    // Les livraisons d'une flotte arrivent par six, même client, même heure :
    // une ligne par VIN serait illisible. On les regroupe.
    function groupeRdv(liste) {
      const m = new Map();
      (liste || []).forEach(r => {
        const k = String(r.id_client) + '|' + String(r.quand);
        let g = m.get(k);
        if (!g) { g = Object.assign({}, r, { n: 0, vins: [] }); m.set(k, g); }
        g.n += 1;
        if (r.vin) g.vins.push(r.vin);
      });
      return Array.from(m.values());
    }

    function lignePromesse(p, type) {
      if (type === 'relance') {
        return '<article class="pr' + (p.en_retard ? ' retard' : '') + '"'
          + ' data-rapport="' + esc(p.id_rapport) + '" data-client="' + esc(p.id_client || '') + '">'
          + '<div class="h">' + esc(heure(p.quand))
          +   '<small>' + (p.en_retard ? 'En retard' : jourLisible(p.quand)) + '</small></div>'
          + '<div><b>Relancer ' + esc(p.client_nom || ('client ' + p.id_client)) + '</b>'
          +   (p.quoi ? '<div class="quoi">' + esc(p.quoi) + '</div>' : '') + '</div>'
          + '<div class="actes">'
          +   (p.id_client ? '<button type="button" class="btn p" data-role="repondre">'
                           + 'Contacter</button>' : '')
          +   '<button type="button" class="btn t" data-role="reporter-rpv">Reporter</button>'
          + '</div></article>';
      }
      const vins = (p.vins || []).length;
      return '<article class="pr" data-client="' + esc(p.id_client || '') + '">'
        + '<div class="h">' + esc(heure(p.quand)) + '<small>'
        +   (num(p.n) > 1 ? fmt(p.n) + ' livraisons' : 'RDV') + '</small></div>'
        + '<div><b>' + esc(p.client_nom || ('client ' + p.id_client)) + '</b>'
        +   '<div class="quoi">' + esc(jourLisible(p.quand)) + ' à ' + esc(heure(p.quand))
        +   (p.quoi ? ' · ' + esc(p.quoi) : '')
        +   (vins === 1 ? ' · VIN ' + esc(p.vins[0]) : '')
        +   (vins > 1 ? ' · ' + fmt(vins) + ' véhicules' : '')
        +   '</div></div>'
        + '<div class="actes">'
        +   '<button type="button" class="btn s" data-role="repondre-rdv">Ouvrir la fiche</button>'
        + '</div></article>';
    }

    // Le compte rendu : trois issues, pas plus. Un vendeur entre deux clients
    // ne remplit pas un formulaire — il clique sur ce qui s'est passé. Le
    // détail commercial appartient au rapport vendeur, dans la fiche.
    function ligneAConclure(p) {
      const n = num(p.n);
      const vins = (p.vins || []).length;
      return '<article class="pr" data-conclure="' + esc(p.id_rdv) + '"'
        + ' data-client="' + esc(p.id_client || '') + '">'
        + '<div class="h">' + esc(heure(p.quand))
        +   '<small>' + esc(jourLisible(p.quand)) + '</small></div>'
        + '<div><b>' + esc(p.client_nom || ('client ' + p.id_client)) + '</b>'
        +   '<div class="quoi">' + (p.quoi ? esc(p.quoi) : 'Rendez-vous')
        +   (vins > 1 ? ' \u00b7 ' + fmt(vins) + ' v\u00e9hicules'
                      : (vins === 1 ? ' \u00b7 VIN ' + esc(p.vins[0]) : ''))
        +   '</div>'
        + '</div>'
        + '<div class="actes">'
        +   '<button type="button" class="btn p" data-role="cr">Compte rendu</button>'
        +   '<button type="button" class="btn t" data-role="repondre-rdv">Ouvrir la fiche</button>'
        + '</div></article>';
    }

    // =========================================================================
    //  LES TABLEAUX DE MANAGER
    //  Jamais le détail des messages : la dette, le retard, la vitesse de
    //  réponse. Le détail reste chez celui qui doit agir.
    // =========================================================================
    function tableauEquipe(lignes, niveau) {
      if (!lignes.length) {
        return '<div class="vide"><div class="ico">'
          + '<svg viewBox="0 0 24 24"><path d="m5 13 4 4L19 7"/></svg></div>'
          + '<h3>Personne ne doit rien à personne</h3>'
          + '<p>Tous les clients du périmètre ont eu leur réponse.</p></div>';
      }
      const estVendeur = niveau === 'vendeur';
      const max = Math.max.apply(null, lignes.map(x => num(x.dette)).concat([1]));
      let h = '<div class="dscroll"><table class="tab"><thead><tr>'
        + '<th>' + (estVendeur ? 'Vendeur' : 'Affaire') + '</th>'
        + '<th>Dette</th><th>En retard</th><th>Plus ancienne</th>'
        + '<th>Réponse médiane</th><th>Charge</th><th></th></tr></thead><tbody>';
      lignes.forEach(x => {
        const r = num(x.en_retard);
        h += '<tr data-cle="' + esc(x.cle) + '">'
          + '<td>' + esc(x.nom) + '</td>'
          + '<td class="f">' + fmt(x.dette) + '</td>'
          + '<td class="f">' + (r > 0 ? '<span class="mauvais">' + fmt(r) + '</span>' : '—') + '</td>'
          + '<td class="f">' + (num(x.plus_ancienne_min) > 0
              ? (num(x.plus_ancienne_min) >= 1440
                  ? '<span class="mauvais">' + duree(x.plus_ancienne_min) + '</span>'
                  : duree(x.plus_ancienne_min))
              : '—') + '</td>'
          + '<td class="f">' + (x.reponse_mediane_min == null ? '—'
              : (num(x.reponse_mediane_min) <= 60
                  ? '<span class="bon">' + duree(x.reponse_mediane_min) + '</span>'
                  : duree(x.reponse_mediane_min))) + '</td>'
          + '<td><span class="barre"><i style="width:'
              + Math.round(num(x.dette) / max * 100) + '%;background:'
              + (r > 0 ? 'var(--m-rouge)' : 'var(--m-bleu)') + '"></i></span></td>'
          + '<td>' + (estVendeur && num(x.dette) > 0
              ? '<button type="button" class="mini" data-role="alerter">Alerter</button>' : '')
          + '</td></tr>';
      });
      h += '</tbody></table></div>';
      if (estVendeur) h += '<p class="dnote" style="font-size:11.5px;color:var(--ink-3);margin-top:8px">'
        + '« Alerter » envoie au vendeur une notification nommée dans sa propre file. '
        + 'Vous ne voyez pas ses messages : le détail reste chez celui qui doit agir.</p>';
      return h;
    }

    // =========================================================================
    //  LES VIDES — ils expliquent, ils ne s'excusent pas
    // =========================================================================
    function vide(sec) {
      const c = (state.j.canaux || {});
      const messagerie = num(c.sms) + num(c.wa) + num(c.email);
      if (sec === 'ma_file') {
        if (messagerie < 10) {
          return '<div class="vide attente"><div class="ico">'
            + '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>'
            + '</div><h3>Rien ne vous attend par message</h3>'
            + '<p>Les SMS, WhatsApp et emails entrants arriveront ici dès que One Data sera '
            + 'déployé sur votre site. Vos appels et vos rendez-vous, eux, sont '
            + 'déjà suivis.</p></div>';
        }
        return '<div class="vide"><div class="ico">'
          + '<svg viewBox="0 0 24 24"><path d="m5 13 4 4L19 7"/></svg></div>'
          + '<h3>Vous ne devez rien à personne</h3>'
          + '<p>Tout le monde a eu sa réponse. C’est l’état normal d’une fin '
          + 'de journée réussie — la page reste vide jusqu’au prochain contact.</p></div>';
      }
      if (sec === 'promesses') {
        return '<div class="vide"><div class="ico">'
          + '<svg viewBox="0 0 24 24"><path d="m5 13 4 4L19 7"/></svg></div>'
          + '<h3>Aucune promesse en attente</h3>'
          + '<p>Les relances datées que vous posez dans One Data apparaîtront ici le jour '
          + 'prévu, avec vos rendez-vous à venir et ceux qui attendent encore leur compte '
          + 'rendu.</p></div>';
      }
      if (sec === 'inconnus') {
        return '<div class="vide"><div class="ico">'
          + '<svg viewBox="0 0 24 24"><path d="m5 13 4 4L19 7"/></svg></div>'
          + '<h3>Aucun numéro inconnu</h3>'
          + '<p>Tous les appels reçus sont rattachés à une fiche client.</p></div>';
      }
      if (sec === 'reportees') {
        return '<div class="vide"><div class="ico">'
          + '<svg viewBox="0 0 24 24"><path d="m5 13 4 4L19 7"/></svg></div>'
          + '<h3>Rien de reporté</h3>'
          + '<p>Une dette reportée revient ici jusqu’à l’heure que vous avez '
          + 'dite, puis repasse dans votre file.</p></div>';
      }
      return '<div class="vide"><h3>Rien à afficher</h3><p>&nbsp;</p></div>';
    }

    // =========================================================================
    //  LE RENDU
    // =========================================================================
    function enTete() {
      const j = state.j;
      const role = ROLES[num(j.moi.role)] || '';
      const f = j.filtre || {};
      return '<div class="rail"><h1>' + esc(TITRES[famille()]) + '</h1>'
        + (role ? '<span class="role">' + esc(role) + '</span>' : '')
        + (f.actif && f.libelle ? '<span class="perim">' + esc(f.libelle) + '</span>' : '')
        + '<span class="maj">temps réel · ' + heure(new Date().toISOString()) + '</span></div>';
    }
    function onglets() {
      const o = ORDRE[famille()] || ORDRE.vendeur;
      return '<div class="ongl">' + o.map(s => {
        const n = compteur(s), t = tonSection(s);
        return '<button type="button" data-sec="' + s + '" aria-pressed="'
          + (state.section === s) + '">' + esc(LABELS[s])
          + ' <span class="cpt ' + t + '">' + fmt(n) + '</span></button>';
      }).join('') + '</div>';
    }
    function filtresCanaux() {
      const l = (state.j.ma_file || []);
      const presents = {};
      l.forEach(x => (x.medias || []).forEach(m => presents[m] = true));
      const cles = Object.keys(presents);
      if (cles.length < 2) return '';
      const puce = (k, lab, c) => '<span class="puce" data-canal="' + k + '" aria-pressed="'
        + (state.canal === k) + '">'
        + (c ? '<span class="dot" style="background:' + c + '"></span>' : '') + esc(lab) + '</span>';
      return '<div class="filtres">' + puce('TOUS', 'Tous les canaux', '')
        + cles.map(k => puce(k, (CANAL[k] || { lab: k }).lab, (CANAL[k] || {}).c)).join('')
        + '<span class="tri">Trié par <b>urgence</b> : l’âge de l’attente '
        + 'croisé avec l’enjeu du client</span></div>';
    }

    function corps() {
      const j = state.j, sec = state.section;

      if (sec === 'ma_file') {
        let l = (j.ma_file || []);
        if (state.canal !== 'TOUS') l = l.filter(x => (x.medias || []).indexOf(state.canal) !== -1);
        const al = (j.alertes || []);
        if (!l.length && !al.length) return vide('ma_file');
        return filtresCanaux() + '<div class="pile">'
          + al.map(carteAlerte).join('') + l.map(carteDette).join('') + '</div>';
      }

      if (sec === 'promesses') {
        const rel = (j.promesses && j.promesses.relances) || [];
        const rdv = groupeRdv((j.promesses && j.promesses.rdv) || []);
        const con = groupeRdv((j.promesses && j.promesses.a_conclure) || []);
        if (!rel.length && !rdv.length && !con.length) return vide('promesses');
        let h = '';
        // Les rendez-vous PASSÉS dont personne n'a dit ce qu'ils ont donné.
        // Ils passent en premier : c'est le seul endroit de l'application où
        // l'on saura si le client est venu, et plus on attend moins on s'en
        // souvient.
        if (con.length) {
          h += '<div class="jour"><span class="t">\u00c0 conclure</span>'
            + '<span class="ligne"></span><span class="n">' + fmt(con.length) + '</span></div>'
            + '<p class="dnote" style="font-size:12px;color:var(--ink-3);margin:0 0 10px">'
            + 'Ces rendez-vous sont pass\u00e9s et personne n\u2019a dit ce qu\u2019ils ont '
            + 'donn\u00e9. Sans r\u00e9ponse, ils dispara\u00eetraient tout seuls \u2014 et '
            + 'c\u2019est pr\u00e9cis\u00e9ment ce qu\u2019on ne veut plus.</p>'
            + '<div class="pile">' + con.map(x => ligneAConclure(x)).join('') + '</div>';
        }
        if (rel.length) {
          h += '<div class="jour"><span class="t">Relances promises</span>'
            + '<span class="ligne"></span><span class="n">' + fmt(rel.length) + '</span></div>'
            + '<div class="pile">' + rel.map(x => lignePromesse(x, 'relance')).join('') + '</div>';
        }
        if (rdv.length) {
          h += '<div class="jour"><span class="t">Rendez-vous à venir</span>'
            + '<span class="ligne"></span><span class="n">' + fmt(rdv.length) + '</span></div>'
            + '<div class="pile">' + rdv.map(x => lignePromesse(x, 'rdv')).join('') + '</div>';
        }
        return h;
      }

      if (sec === 'equipe')    return tableauEquipe(j.equipe || [], 'vendeur');
      if (sec === 'perimetre') return tableauEquipe(j.perimetre || [], 'affaire');

      if (sec === 'inconnus') {
        const l = (j.inconnus || []);
        if (!l.length) return vide('inconnus');
        return '<p class="dnote" style="font-size:12px;color:var(--ink-3);margin:0 0 10px">'
          + 'Triés par <b>nombre de rappels</b> : quelqu’un qui appelle trois fois veut '
          + 'vraiment quelque chose.</p>'
          + '<div class="pile">' + l.map(carteInconnu).join('') + '</div>';
      }

      if (sec === 'reportees') {
        const l = (j.reportees || []);
        if (!l.length) return vide('reportees');
        return '<div class="pile">' + l.map(x =>
          '<article class="cli froid" data-client="' + esc(x.id_client) + '">'
          + '<div class="av">' + esc(initiales(x.client_nom)) + '</div>'
          + '<div><h3>' + esc(x.client_nom || ('Client ' + x.id_client)) + '</h3>'
          + '<p class="attend">Reportée jusqu’à <span class="depuis calme">'
          + esc(jourLisible(x.jusqu_a)) + ' ' + esc(heure(x.jusqu_a))
          + '</span> — attend depuis ' + duree(x.attend_min) + '</p>'
          + '<div class="fil">' + pastillesCanaux(x.medias, false) + '</div>'
          + apercuHtml(x)
          + '</div><div class="actes">'
          + '<button type="button" class="btn s" data-role="reprendre-report">Reprendre maintenant</button>'
          + '<button type="button" class="btn t" data-role="repondre">Ouvrir la fiche</button>'
          + '</div></article>').join('') + '</div>';
      }
      return '';
    }

    function pied() {
      return '<p class="pied"><b>Ce qui fait disparaître une notification.</b> Jamais un '
        + 'regard : seul un acte. Un message entrant se solde par un message ou un appel sortant '
        + 'vers ce client. Une relance se solde par le rapport vendeur qui la clôt. Un '
        + 'rendez-vous se solde par son COMPTE RENDU — la même fiche que dans l’agenda — '
        + 'et non par l’heure qui passe. Un numéro inconnu se '
        + 'solde quand il est rattaché à une fiche. Un <b>report</b> ne solde rien : il '
        + 'met la dette de côté jusqu’à l’heure dite, puis elle revient. '
        + 'Les leads ne sont pas ici : ils sont traités dans le lead management.</p>';
    }

    function squelette() {
      getRoot().innerHTML = '<div class="nw">'
        + '<div class="rail"><h1>Notifications</h1></div>'
        + '<section class="dette"><div class="d"><div class="q">Chargement</div>'
        + '<p style="color:var(--ink-3)">Lecture de votre file…</p></div></section>'
        + '</div>';
    }

    function rendre() {
      if (state.erreur) {
        getRoot().innerHTML = '<div class="nw"><div class="dvide" style="padding:22px;'
          + 'color:var(--ink-2)">Les notifications n’ont pas pu être chargées ('
          + esc(state.erreur) + ').</div></div>';
        return;
      }
      if (!state.j) { squelette(); return; }
      if (!state.section) state.section = premiereSectionUtile();
      getRoot().innerHTML = '<div class="nw">'
        + enTete() + bandeau() + onglets() + corps() + pied() + '</div>';
      hydraterVocaux(getRoot());
    }

    // =========================================================================
    //  LES NOTES VOCALES
    //
    //  Deux temps, et l'ordre compte.
    //
    //  1. À l'affichage : on cherche la dernière note vocale ENTRANTE de
    //     chaque dette (DEUX requêtes pour toute la page, pas deux par carte),
    //     on récupère sa transcription et sa durée, puis on demande une URL
    //     signée à `wa-attachment-url`. Le bucket `wa-attachments` est privé :
    //     l'adresse « publique » stockée en base ne répond pas, c'est le même
    //     piège que dans le fil WhatsApp.
    //
    //  2. Au clic : `play()` est appelé SYNCHRONEMENT. Aucun `await` entre le
    //     geste de l'utilisateur et la lecture — Safari casse la lecture si le
    //     geste est rompu par une attente. C'est toute la raison pour laquelle
    //     la signature est faite au temps 1 et pas au temps 2.
    //
    //  La DURÉE vient de la base, pas du fichier : Whisper la rend dans sa
    //  réponse `verbose_json` et on la range. Sans elle il faudrait charger
    //  les métadonnées de chaque fichier pour afficher la barre, soit une
    //  requête réseau par carte pour écrire « 0:05 ».
    // =========================================================================
    const VOC = { audio: null, cle: null };
    // rendre() est rappelé à chaque changement d'onglet et à chaque écho du
    // temps réel : sans ce cache, chaque repeinture redemanderait une signature
    // pour les mêmes fichiers. On garde l'URL un peu moins longtemps que sa
    // validité réelle, pour ne jamais servir une URL qui vient d'expirer.
    const VOC_CACHE = new Map();

    function majBarre(el) {
      const prog = el.querySelector('.vprog');
      const tps = el.querySelector('.vtime');
      const dur = Number(el.getAttribute('data-dur')) || 0;
      const joue = VOC.audio && VOC.cle === el.getAttribute('data-voc');
      const t = joue ? (VOC.audio.currentTime || 0) : 0;
      const d = (joue && VOC.audio.duration && isFinite(VOC.audio.duration))
        ? VOC.audio.duration : dur;
      if (prog) prog.style.width = (d > 0 ? Math.min(100, t / d * 100) : 0) + '%';
      // Pendant la lecture on montre le temps ÉCOULÉ, à l'arrêt la durée
      // totale : c'est ce que fait WhatsApp, et c'est l'information utile
      // dans chacun des deux cas.
      if (tps) tps.textContent = d > 0 ? mmss(joue && t > 0 ? t : d) : '--:--';
    }

    async function hydraterVocaux(root) {
      const els = Array.prototype.slice.call(root.querySelectorAll('.vocal[data-voc]'));
      if (!els.length) return;
      const cycles = [];
      els.forEach(function (e) {
        String(e.getAttribute('data-voc') || '').split(',').forEach(function (c) {
          c = c.trim();
          if (c && /^\d+$/.test(c) && cycles.indexOf(c) < 0) cycles.push(c);
        });
      });
      if (!cycles.length) return;

      const jwt = await getUserJwt();
      if (!jwt) return;
      const entetes = { apikey: SUPABASE_KEY, Authorization: 'Bearer ' + jwt };

      let messages = [];
      try {
        const url = SUPABASE_URL + '/rest/v1/wa_messages'
          + '?id_cycle_com=in.(' + cycles.join(',') + ')'
          + '&direction=eq.in&msg_type=eq.audio'
          + '&select=id,id_cycle_com,created_at&order=created_at.desc';
        const r = await fetch(url, { headers: entetes });
        if (r.ok) messages = await r.json();
      } catch (e) { return; }

      // la requête est déjà triée du plus récent au plus ancien : le premier
      // vu pour un cycle est le bon.
      const parCycle = {};
      (messages || []).forEach(function (m) {
        const c = String(m.id_cycle_com);
        if (!parCycle[c]) parCycle[c] = m.id;
      });
      const idsMsg = Object.keys(parCycle).map(function (c) { return parCycle[c]; });
      if (!idsMsg.length) {
        els.forEach(function (el) { marquerVocalAbsent(el, 'Note vocale introuvable'); });
        return;
      }

      // Transcription et durée, en une seule requête pour toute la page.
      const parMessage = {};
      try {
        const url = SUPABASE_URL + '/rest/v1/wa_message_attachments'
          + '?message_id=in.(' + idsMsg.join(',') + ')'
          + '&msg_type=eq.audio'
          + '&select=id,message_id,transcription,transcription_statut,duree_s';
        const r = await fetch(url, { headers: entetes });
        if (r.ok) {
          (await r.json()).forEach(function (a) {
            if (!parMessage[a.message_id]) parMessage[a.message_id] = a;
          });
        }
      } catch (e) { /* la transcription est un plus, pas une condition */ }

      await Promise.all(els.map(async function (el) {
        let msg = null;
        const ids = String(el.getAttribute('data-voc') || '').split(',');
        for (let i = 0; i < ids.length; i++) {
          const c = ids[i].trim();
          if (parCycle[c]) { msg = parCycle[c]; break; }
        }
        if (!msg) { marquerVocalAbsent(el, 'Note vocale introuvable'); return; }

        const piece = parMessage[msg] || null;
        if (piece && piece.duree_s) el.setAttribute('data-dur', String(piece.duree_s));
        poserTranscription(el, piece);
        majBarre(el);

        const bouton = el.querySelector('.voc');
        const enCache = VOC_CACHE.get(msg);
        if (enCache && enCache.exp > Date.now()) {
          el.setAttribute('data-src', enCache.url);
          if (bouton) { bouton.disabled = false; bouton.title = 'Écouter la note vocale'; }
          return;
        }
        try {
          const r = await fetch(SUPABASE_URL + '/functions/v1/wa-attachment-url', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', apikey: SUPABASE_KEY,
                       Authorization: 'Bearer ' + (await getUserJwt()) },
            body: JSON.stringify({ message_id: msg })
          });
          const j = await r.json().catch(function () { return null; });
          if (!r.ok || !j || !j.url) throw new Error('url absente');
          VOC_CACHE.set(msg, {
            url: j.url,
            exp: Date.now() + Math.max(60, (j.expire_dans || 3600) - 300) * 1000
          });
          el.setAttribute('data-src', j.url);
          if (bouton) { bouton.disabled = false; bouton.title = 'Écouter la note vocale'; }
        } catch (e) {
          if (bouton) bouton.title = 'Note vocale indisponible';
        }
      }));
    }

    function marquerVocalAbsent(el, texte) {
      const b = el.querySelector('.voc');
      if (b) b.title = texte;
      poserTranscription(el, null);
    }

    // Quatre états, et chacun dit quelque chose de different au vendeur :
    // un texte, « rien de dit » (silence ou bruit), « en cours » (la note
    // vient d'arriver), et l'echec, où on ne promet rien plutôt que de
    // laisser un « Transcription… » qui ne viendra jamais.
    function poserTranscription(el, piece) {
      const cle = el.getAttribute('data-voc');
      const p = getRoot() && getRoot().querySelector('[data-vtr="' + cle + '"]');
      if (!p) return;
      const statut = piece && piece.transcription_statut;
      const texte = piece && piece.transcription;
      if (statut === 'fait' && texte) {
        // Espaces insécables : sans elles le guillemet fermant part seul à la
        // ligne quand la transcription tombe juste en fin de ligne.
        p.textContent = '« ' + texte + ' »';
        p.classList.remove('attente');
        return;
      }
      p.classList.add('attente');
      if (statut === 'en_cours') { p.textContent = 'Transcription en cours…'; return; }
      if (statut === 'vide') { p.textContent = 'Note vocale sans parole audible.'; return; }
      if (statut === 'erreur') { p.textContent = 'Transcription indisponible.'; return; }
      p.textContent = 'Note vocale.';
    }

    function peindreVocaux() {
      const r = getRoot();
      if (!r) return;
      Array.prototype.slice.call(r.querySelectorAll('.vocal[data-voc]')).forEach(function (el) {
        const joue = !!(VOC.audio && !VOC.audio.paused && VOC.cle === el.getAttribute('data-voc'));
        const b = el.querySelector('.voc');
        if (b) b.innerHTML = joue ? IC_PAUSE : IC_LECTURE;
        majBarre(el);
      });
    }

    function jouerVocal(el) {
      const src = el.getAttribute('data-src');
      if (!src) return;
      const cle = el.getAttribute('data-voc');
      if (!VOC.audio) {
        VOC.audio = new Audio();
        ['play', 'pause', 'ended', 'timeupdate', 'loadedmetadata'].forEach(function (e) {
          VOC.audio.addEventListener(e, peindreVocaux);
        });
      }
      if (VOC.cle === cle && !VOC.audio.paused) { VOC.audio.pause(); return; }
      if (VOC.cle !== cle) { VOC.audio.pause(); VOC.audio.src = src; VOC.cle = cle; }
      VOC.audio.play().catch(function () {
        const b = el.querySelector('.voc');
        if (b) b.title = 'Lecture refusée par le navigateur';
      });
    }

    // Déplacement dans la bande. Sans source chargée il n'y a rien à
    // déplacer : on lance la lecture à la position visée plutôt que de ne
    // rien faire, ce qui est ce qu'attend quelqu'un qui clique au milieu.
    function deplacerVocal(el, ev) {
      const barre = el.querySelector('.vbar');
      if (!barre) return;
      const r = barre.getBoundingClientRect();
      const part = Math.min(1, Math.max(0, (ev.clientX - r.left) / r.width));
      const cle = el.getAttribute('data-voc');
      if (!VOC.audio || VOC.cle !== cle) {
        jouerVocal(el);
        if (!VOC.audio || VOC.cle !== cle) return;
      }
      const d = (VOC.audio.duration && isFinite(VOC.audio.duration))
        ? VOC.audio.duration : (Number(el.getAttribute('data-dur')) || 0);
      if (d > 0) VOC.audio.currentTime = part * d;
      peindreVocaux();
    }

    async function recharger() {
      await charger();
      rendre();
      prevenirBadge();
    }

      const SB = () => ctx.supabase;
      function crErreur(a, b) {
        if (!crs) return;
        crs.err = [a, b].filter(Boolean).join(' ');
        renderCR();
      }

    let crs = null;

    const CR_ECH = [
      { c: 'commande', lab: 'Commande',    sous: 'relance facultative', j: null, col: '#00997f', appel: false },
      { c: 'devis',    lab: 'Devis remis', sous: 'relance à 3 j',   j: 3,    col: '#3f7cba', appel: false },
      { c: 'chaud',    lab: 'Chaud',       sous: 'relance à 7 j',   j: 7,    col: '#d2941f', appel: true  },
      { c: 'tiede',    lab: 'Tiède',  sous: 'relance à 1 mois', j: 30,  col: '#9bb3d1', appel: true  },
      { c: 'froid',    lab: 'Froid',       sous: 'relance à 6 mois', j: 180, col: '#acc5e4', appel: true  },
      { c: 'perdu',    lab: 'Perdu',       sous: 'relance facultative', j: null, col: '#c0524f', appel: true  }
    ];
    const CR_MOTIFS = ['Prix', 'Délai', 'Concurrent', 'Abandon'];
    const CR_LIB = {
      rencontre: { t: 'Rencontre', vu: 'Je l’ai rencontré', non: 'Il n’est pas venu',
                   lbl: 'Où en est le client' },
      appel:     { t: 'Appel', vu: 'Je l’ai eu', non: 'Pas joint',
                   lbl: 'La température de l’appel' },
      autre:     { t: 'Rendez-vous', vu: 'Fait', non: 'Pas fait', lbl: '' }
    };

    function crFamille(idType) {
      const t = Number(idType);
      if (t === 4 || t === 9) return 'livraison';
      if (t === 5 || t === 2 || t === 3) return 'rencontre';
      if (t === 10 || t === 6) return 'appel';
      return 'autre';
    }
    function crDegres() {
      return CR_ECH.filter(e => crs.famille !== 'appel' || e.appel);
    }
    function crJour(iso) {
      if (!iso) return '';
      const d = new Date(String(iso).replace(' ', 'T'));
      const a = new Date();
      const j0 = new Date(a.getFullYear(), a.getMonth(), a.getDate());
      const j1 = new Date(d.getFullYear(), d.getMonth(), d.getDate());
      const e = Math.round((j1 - j0) / 86400000);
      if (e === 0) return 'aujourd’hui';
      if (e === -1) return 'hier';
      if (e > -7 && e < 0) return ['dimanche','lundi','mardi','mercredi','jeudi','vendredi','samedi'][d.getDay()];
      return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
    }

    // Ouverture : on charge la preuve AVANT de dessiner, pour ne jamais poser une
    // question dont on a deja la reponse.
    // La fiche s'ouvre ici sur une LIGNE de la page, pas sur un evenement du
    // calendrier : c'est la seule difference avec l'agenda. Tout le reste —
    // l'echelle, la preuve d'appel, le report, l'enregistrement — est le meme
    // code, pour que le vendeur retrouve exactement le meme geste des deux
    // cotes. Deux formulaires qui divergent, c'est deux comportements a
    // expliquer et deux bugs a corriger.
    async function openCompteRendu(p) {
      const fam = crFamille(p.id_rdv_type);
      if (fam === 'livraison') return;
      crs = {
        idRdv: p.id_rdv, idClient: (p.id_client != null ? Number(p.id_client) : null),
        famille: fam,
        client: [p.civilite, p.client_nom].filter(Boolean).join(' ').trim()
                || ('Client ' + (p.id_client != null ? p.id_client : '')),
        type: p.type_libelle || 'Rendez-vous', quand: p.quand || '',
        deja: false,
        preuve: null, chargement: true,
        issue: 'vu', deg: null, relance: null, motif: CR_MOTIFS[0],
        comment: '', saving: false, err: '', avis: ''
      };
      renderCR();
      try {
        const { data, error } = await SB().rpc('rdv_preuve', { p_id_rdv: Number(crs.idRdv) });
        // Le socle SQL du compte rendu n'existe pas encore partout : la ou il
        // manque, on referme sans bruit plutot que d'afficher une panne.
        if (error && (error.code === 'PGRST202'
                      || /rdv_preuve/.test(error.message || ''))) {
          closeCR(); return;
        }
        if (error) throw error;
        crs.preuve = data || null;
        // Le bucket des enregistrements est PRIVE : l'URL doit etre signee.
        const a = crs.preuve && crs.preuve.appel;
        if (a && a.recording_url) {
          try {
            const chemin = String(a.recording_url).split('/call-recordings/').pop();
            const r = await SB().storage.from('call-recordings').createSignedUrl(chemin, 3600);
            if (r && r.data && r.data.signedUrl) a.url_signee = r.data.signedUrl;
          } catch (e) { /* pas d'audio : le reste de la fiche tient debout */ }
        }
      } catch (e) { console.error('[notifs] rdv_preuve', e); }
      crs.chargement = false;
      renderCR();
    }

    function crCarteAppel(a) {
      const sec = Number(a.secondes) || 0;
      const dur = Math.floor(sec / 60) + ':' + String(sec % 60).padStart(2, '0');
      const entrant = String(a.sens || '') === 'inbound';
      const fleche = entrant
        ? '<line x1="17" y1="7" x2="7" y2="17"/><polyline points="17 17 7 17 7 7"/>'
        : '<line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>';
      const d = a.quand ? new Date(String(a.quand).replace(' ', 'T')) : null;
      const quand = d ? (d.toLocaleDateString('fr-FR') + '<br>'
        + String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0')) : '';
      const ton = a.tonalite ? '<span class="ct-ton">' + esc(a.tonalite) + '</span>' : '';
      const resume = a.objet || a.transcription || '';
      const complet = a.transcription && a.objet && a.transcription !== a.objet ? a.transcription : '';
      return '<div class="ct-call">'
        + '<div class="ct-ar"><svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#60AEDF" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">' + fleche + '</svg></div>'
        + '<div class="ct-mid"><div class="ct-top">'
        +   '<div class="ct-who"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#60AEDF" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.1a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.24h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.08 6.08l1.03-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>'
        +   '<span>' + esc(crs.client) + '</span></div>'
        +   '<div class="ct-meta"><span class="ct-date">' + quand + '</span>' + ton + '</div>'
        + '</div>'
        + (a.url_signee
            ? '<div class="ct-pill"><button type="button" id="cr-play"><svg width="10" height="12" viewBox="0 0 10 12" fill="#60AEDF"><path d="M0 0l10 6-10 6z"/></svg></button>'
              + '<span class="t" id="cr-cur">0:00</span><div class="ct-bar" id="cr-bar"><i id="cr-prg"></i></div>'
              + '<span class="t" id="cr-rem" style="text-align:right">' + dur + '</span>'
              + '<div id="cr-src" data-src="' + esc(a.url_signee) + '" style="display:none"></div></div>'
            : '<div class="ct-pill"><span class="t" style="min-width:0">Appel de ' + dur + ', sans enregistrement</span></div>')
        + (resume ? '<div class="ct-txt"><span>' + esc(resume) + '</span>'
            + (complet ? '<button type="button" class="tg" id="cr-tg">▸ voir plus</button>'
                       + '<div class="ct-full" id="cr-full">' + esc(complet) + '</div>' : '')
            + '</div>' : '')
        + '</div></div>';
    }

    function crBody() {
      if (crs.chargement) return '<div class="agm-note">Lecture du rendez-vous…</div>';
      const L = CR_LIB[crs.famille] || CR_LIB.autre;
      const pr = crs.preuve || {};
      const appel = pr.appel || null;
      const aPreuve = !!appel && !crs.corrige;

      let h = '<div class="agm-cr-head">'
        + '<div class="agm-cr-when">' + esc(String(crs.quand).slice(11, 16))
        +   '<small>' + esc(crJour(crs.quand)) + '</small></div>'
        + '<div class="agm-cr-who"><b>' + esc(crs.client) + '</b>'
        +   '<span>' + esc(crs.type) + '</span></div></div>';

      if (crs.deja) {
        h += '<div class="agm-done">Ce rendez-vous a déjà son compte rendu'
          + (pr.issue_connue ? ' : ' + esc(pr.issue_connue) : '') + '.</div>';
      }

      if (aPreuve) h += crCarteAppel(appel);

      // La question ne se pose que si la telephonie n'a pas deja repondu.
      if (!aPreuve) {
        h += '<div><div class="agm-lbl">Ce qui s’est passé</div><div class="agm-seg">'
          + '<button data-cri="vu" class="' + (crs.issue === 'vu' ? 'on' : '') + '">' + esc(L.vu) + '</button>'
          + '<button data-cri="absent" class="' + (crs.issue === 'absent' ? 'on' : '') + '">' + esc(L.non) + '</button>'
          + '</div></div>';
      }

      const vu = aPreuve || crs.issue === 'vu';
      const l = crDegres();
      if (crs.deg == null || !l.some(e => e.c === crs.deg)) crs.deg = 'chaud';
      const montreEch = crs.famille !== 'autre' && vu;
      if (montreEch) {
        h += '<div><div class="agm-lbl">' + esc(L.lbl) + '</div>'
          + '<div class="agm-ech' + (l.length <= 4 ? ' quatre' : '') + '">'
          + l.map(e => '<button data-cre="' + e.c + '" class="' + (e.c === crs.deg ? 'on' : '') + '">'
              + '<b><i style="background:' + e.col + '"></i>' + esc(e.lab) + '</b>'
              + '<small>' + esc(e.sous) + '</small></button>').join('')
          + '</div>';
        if (crs.deg === 'perdu') {
          h += '<div style="margin-top:10px"><div class="agm-lbl">Pourquoi perdu</div><div class="agm-seg">'
            + CR_MOTIFS.map(m => '<button data-crm="' + esc(m) + '" class="' + (crs.motif === m ? 'on' : '') + '">'
                + esc(m) + '</button>').join('')
            + '</div></div>';
        }
        if (crs.deg === 'commande') {
          h += '<div class="agm-avis" style="margin-top:10px">Pensez à saisir la commande dans BACS : '
            + 'le tableau de bord ne compte que les commandes BACS.</div>';
        }
        h += '</div>';
      }

      // La relance : decidee par le degre, modifiable d'un clic.
      const e = l.find(x => x.c === crs.deg);
      let j = montreEch ? (e ? e.j : null) : null;
      if (!vu) j = 2;                                  // un lapin se rattrape a deux jours
      if (crs.famille === 'autre') j = null;
      const libre = montreEch && (crs.deg === 'commande' || crs.deg === 'perdu');
      if (j !== null || libre) {
        if (crs.relance == null) crs.relance = (j !== null ? String(j) : 'x');
        const choix = (j !== null)
          ? [[String(j), 'dans ' + (j >= 30 ? Math.round(j / 30) + ' mois' : j + ' jours')],
             ['0', 'une autre date…'], ['x', 'rien']]
          : [['x', 'rien'],
             [crs.deg === 'commande' ? '30' : '180',
              crs.deg === 'commande' ? 'suivi dans 1 mois' : 'retenter dans 6 mois'],
             ['0', 'une autre date…']];
        h += '<div><div class="agm-lbl">La relance</div><div class="agm-quand">'
          + choix.map(x => '<button data-crj="' + x[0] + '" class="' + (x[0] === crs.relance ? 'on' : '') + '">'
              + esc(x[1]) + '</button>').join('') + '</div>'
          + (crs.relance === '0'
              ? '<div class="agm-row" style="margin-top:8px"><input type="date" class="agm-inp" id="cr-date" value="'
                + esc(crs.dateLibre || agToday()) + '" style="flex:1;min-width:130px">'
                + '<input type="time" class="agm-inp" id="cr-heure" value="' + esc(crs.heureLibre || '09:00')
                + '" step="900" style="width:104px"></div>'
              : '')
          + '<p class="agm-note" style="margin:9px 0 0">'
          + (crs.relance === 'x'
              ? 'Rien ne sera programmé. Le dossier se referme.'
              : 'Elle apparaîtra dans votre agenda et dans <b>« J’ai promis »</b> le jour venu.')
          + '</p></div>';
      }

      h += '<div><div class="agm-lbl">Commentaire</div>'
        + '<textarea class="agm-ta" id="cr-com" placeholder="Ce qu’il faut retenir…">'
        + esc(crs.comment) + '</textarea></div>';

      if (aPreuve) {
        h += '<div class="agm-deplace">Ce n’est pas ce qui s’est passé ? '
          + '<button type="button" id="cr-corriger">Le dire autrement</button></div>';
      }
      h += '<div class="agm-deplace">Le rendez-vous doit être repoussé ? '
        + '<button type="button" id="cr-deplacer">Le déplacer dans l’agenda</button></div>';

      if (crs.err) h += '<div class="agm-err">' + esc(crs.err) + '</div>';
      if (crs.avis) h += '<div class="agm-avis">' + esc(crs.avis) + '</div>';
      return h;
    }

    function renderCR() {
      const d = doc; let ov = d.getElementById('notif-ov');
      if (!ov) {
        ov = d.createElement('div'); ov.id = 'notif-ov';
        (d.body || d.documentElement).appendChild(ov);
        ov.addEventListener('mousedown', (e) => { if (e.target === ov) closeCR(); });
      }
      const titre = 'Compte rendu — ' + ((CR_LIB[crs.famille] || CR_LIB.autre).t);
      ov.innerHTML = '<div class="agm"><div class="agm-head"><span class="agm-title">' + esc(titre) + '</span>'
        + '<button class="agm-x" id="cr-x">×</button></div>'
        + '<div class="agm-body">' + crBody() + '</div>'
        + '<div class="agm-foot"><button class="agm-save" id="cr-save"' + (crs.saving ? ' disabled' : '') + '>'
        + (crs.saving ? 'Enregistrement…' : 'Enregistrer') + '</button></div></div>';
      wireCR();
    }

    function crSync() {
      const d = doc;
      const c = d.getElementById('cr-com'); if (c) crs.comment = c.value;
      const dd = d.getElementById('cr-date'); if (dd) crs.dateLibre = dd.value;
      const hh = d.getElementById('cr-heure'); if (hh) crs.heureLibre = hh.value;
    }

    function wireCR() {
      const d = doc; const g = (id) => d.getElementById(id);
      if (g('cr-x')) g('cr-x').addEventListener('click', closeCR);
      d.querySelectorAll('#notif-ov [data-cri]').forEach(b => b.addEventListener('click', () => {
        crSync(); crs.issue = b.getAttribute('data-cri'); crs.relance = null; crs.err = ''; renderCR(); }));
      d.querySelectorAll('#notif-ov [data-cre]').forEach(b => b.addEventListener('click', () => {
        crSync(); crs.deg = b.getAttribute('data-cre'); crs.relance = null; renderCR(); }));
      d.querySelectorAll('#notif-ov [data-crm]').forEach(b => b.addEventListener('click', () => {
        crSync(); crs.motif = b.getAttribute('data-crm'); renderCR(); }));
      d.querySelectorAll('#notif-ov [data-crj]').forEach(b => b.addEventListener('click', () => {
        crSync(); crs.relance = b.getAttribute('data-crj'); renderCR(); }));
      if (g('cr-corriger')) g('cr-corriger').addEventListener('click', () => {
        crSync(); crs.corrige = true; crs.relance = null; renderCR(); });
      if (g('cr-deplacer')) g('cr-deplacer').addEventListener('click', () => {
        // Deplacer, c'est l'affaire de l'agenda : le glisser-deposer sait deja
        // le faire, et le rendez-vous y garde son identite. Dans l'agenda, ce
        // message s'affichait dans un bandeau apres fermeture ; ici il n'y a
        // pas de bandeau, donc il s'ecrit DANS la fiche — la refermer d'abord
        // l'aurait efface avant meme qu'il soit lu, puisque crErreur n'ecrit
        // que sur une fiche ouverte.
        crErreur('Déplacez le rendez-vous directement dans l’agenda :',
                 'faites-le glisser sur son nouveau créneau, il garde son identité et redevient à venir.');
      });
      if (g('cr-save')) g('cr-save').addEventListener('click', crSave);
      // Le lecteur audio, repris de la fiche client.
      if (g('cr-play')) g('cr-play').addEventListener('click', () => {
        const src = g('cr-src') && g('cr-src').getAttribute('data-src');
        if (!src) return;
        if (!window.__voipAudio) window.__voipAudio = new Audio();
        const a = window.__voipAudio;
        if (a.src !== src) { a.src = src; a.currentTime = 0; }
        if (!a.paused) { a.pause(); return; }
        a.ontimeupdate = () => {
          const D = a.duration || 0, c = a.currentTime;
          if (g('cr-prg')) g('cr-prg').style.width = (D > 0 ? c / D * 100 : 0) + '%';
          if (g('cr-cur')) g('cr-cur').textContent = Math.floor(c / 60) + ':' + String(Math.floor(c % 60)).padStart(2, '0');
        };
        a.play().catch(e => console.warn('[notifs] audio', e));
      });
      if (g('cr-tg')) g('cr-tg').addEventListener('click', () => {
        const f = g('cr-full'); if (!f) return;
        const ouvert = f.style.display !== 'none' && f.style.display !== '';
        f.style.display = ouvert ? 'none' : 'block';
        g('cr-tg').innerHTML = ouvert ? '▸ voir plus' : '▸ voir moins';
      });
    }

    function closeCR() {
      const o = doc.getElementById('notif-ov'); if (o) o.remove();
      crs = null;
    
    }

    async function crSave() {
      crSync();
      crs.err = ''; crs.avis = '';
      const aPreuve = !!(crs.preuve && crs.preuve.appel) && !crs.corrige;
      const vu = aPreuve || crs.issue === 'vu';
      const l = crDegres();
      const e = l.find(x => x.c === crs.deg);

      let relance = null;
      if (crs.relance && crs.relance !== 'x') {
        if (crs.relance === '0') {
          if (!crs.dateLibre) { crs.err = 'Choisissez une date de relance.'; return renderCR(); }
          relance = crs.dateLibre + ' ' + (crs.heureLibre || '09:00') + ':00';
        } else {
          const d = new Date();
          d.setDate(d.getDate() + Number(crs.relance));
          d.setHours(9, 0, 0, 0);
          const z = (n) => String(n).padStart(2, '0');
          relance = d.getFullYear() + '-' + z(d.getMonth() + 1) + '-' + z(d.getDate()) + ' 09:00:00';
        }
      }

      crs.saving = true; renderCR();
      try {
        const { data, error } = await SB().rpc('rdv_conclure', {
          p_id_rdv: Number(crs.idRdv),
          p_issue: vu ? 'vu' : 'absent',
          p_temperature: (crs.famille === 'autre' || !vu) ? null : crs.deg,
          p_commentaire: crs.comment || null,
          p_motif_perte: (crs.deg === 'perdu' ? crs.motif : null),
          p_relance_le: relance
        });
        if (error && (error.code === 'PGRST202'
                      || /rdv_conclure/.test(error.message || ''))) {
          crs.saving = false;
          crs.err = 'Le compte rendu n\u2019est pas encore activ\u00e9 sur cette base.';
          return renderCR();
        }
        if (error) throw error;
        if (data && data.ok === false) {
          crs.saving = false;
          crs.err = data.message || ('Enregistrement refusé : ' + (data.erreur || 'raison inconnue'));
          return renderCR();
        }
        closeCR();
        recharger();                            // le compte rendu et sa relance entrent dans l'agenda
        prevenirBadge();
      } catch (err) {
        console.error('[notifs] rdv_conclure', err);
        crs.saving = false;
        crs.err = (err && err.message) ? err.message : 'Enregistrement impossible.';
        renderCR();
      }
    }


    // =========================================================================
    //  LES CLICS
    // =========================================================================
    function clientDe(el) {
      const c = el.closest('[data-client]');
      return c ? c.getAttribute('data-client') : null;
    }
    function echeance(b) {
      const d = new Date();
      if (b.getAttribute('data-h')) { d.setHours(d.getHours() + Number(b.getAttribute('data-h'))); return d; }
      if (b.getAttribute('data-soir')) { d.setHours(18, 0, 0, 0);
        if (d <= new Date()) d.setDate(d.getDate() + 1); return d; }
      if (b.getAttribute('data-demain')) { d.setDate(d.getDate() + 1);
        d.setHours(Number(b.getAttribute('data-demain')), 0, 0, 0); return d; }
      if (b.getAttribute('data-jours')) { d.setDate(d.getDate() + Number(b.getAttribute('data-jours')));
        d.setHours(9, 0, 0, 0); return d; }
      return null;
    }

    getRoot().addEventListener('click', async ev => {
      const r = getRoot();

      // --- onglets
      const o = ev.target.closest('.ongl button[data-sec]');
      if (o && r.contains(o)) {
        state.section = o.getAttribute('data-sec');
        state.canal = 'TOUS'; state.reportOuvert = null;
        rendre(); return;
      }
      // --- filtre canal
      const p = ev.target.closest('.puce[data-canal]');
      if (p && r.contains(p)) { state.canal = p.getAttribute('data-canal'); rendre(); return; }

      // --- échéances de report
      //     Le compte rendu de rendez-vous réutilise la même boîte visuelle,
      //     sans data-scope : sans cette condition, il était intercepté ici et
      //     ne partait jamais.
      const q = ev.target.closest('.report[data-scope] .q');
      if (q && r.contains(q)) {
        const z = q.closest('.report');
        const d = echeance(q);
        if (!d) return;
        q.textContent = '…';
        try {
          await rpc('notif_reporter', { p_scope: z.getAttribute('data-scope'),
                                        p_cle: String(z.getAttribute('data-cle')),
                                        p_jusqu_a: d.toISOString(), p_motif: null });
          state.reportOuvert = null;
          await recharger();
        } catch (e) { q.textContent = 'échec'; }
        return;
      }

      // --- ouvrir le bloc de report
      const br = ev.target.closest('[data-role="reporter"]');
      if (br && r.contains(br)) {
        const c = clientDe(br);
        state.reportOuvert = (String(state.reportOuvert) === String(c)) ? null : c;
        rendre(); return;
      }
      const brp = ev.target.closest('[data-role="reporter-rpv"]');
      if (brp && r.contains(brp)) {
        const art = brp.closest('[data-rapport]');
        const d = new Date(); d.setDate(d.getDate() + 1); d.setHours(9, 0, 0, 0);
        brp.textContent = '…';
        try {
          await rpc('notif_reporter', { p_scope: 'rpv',
                                        p_cle: String(art.getAttribute('data-rapport')),
                                        p_jusqu_a: d.toISOString(), p_motif: null });
          await recharger();
        } catch (e) { brp.textContent = 'échec'; }
        return;
      }

      // --- reprendre un report
      const rr = ev.target.closest('[data-role="reprendre-report"]');
      if (rr && r.contains(rr)) {
        rr.textContent = '…';
        try {
          await rpc('notif_reprendre_report', { p_scope: 'client', p_cle: String(clientDe(rr)) });
          await recharger();
        } catch (e) { rr.textContent = 'échec'; }
        return;
      }

      // --- un numéro inconnu : composer sur téléphone, copier sur ordinateur
      const ap = ev.target.closest('[data-tel]');
      if (ap && r.contains(ap)) {
        const brut = String(ap.getAttribute('data-tel') || '').replace(/[^0-9+]/g, '');
        if (!brut) return;
        if (SUR_MOBILE) {
          try { FW().location.href = 'tel:' + brut; } catch (e) { }
          return;
        }
        const dire = (txt) => {
          if (ap.tagName !== 'BUTTON') return;
          const avant = ap.textContent;
          ap.textContent = txt;
          setTimeout(() => { try { ap.textContent = avant; } catch (e) { } }, 1600);
        };
        try {
          if (navigator.clipboard && navigator.clipboard.writeText) {
            await navigator.clipboard.writeText(brut);
            dire('Copié'); return;
          }
        } catch (e) { }
        // Repli : l'API du presse-papiers est refusée hors contexte sécurisé
        // et dans certaines iframes. La vieille méthode, elle, passe partout.
        try {
          const z = doc.createElement('textarea');
          z.value = brut;
          z.style.cssText = 'position:fixed;left:-9999px;top:0';
          doc.body.appendChild(z); z.select();
          doc.execCommand('copy'); doc.body.removeChild(z);
          dire('Copié');
        } catch (e) { dire('à copier : ' + brut); }
        return;
      }

      // --- écarter un numéro inconnu (sept jours, pas pour toujours)
      const ec = ev.target.closest('[data-role="ecarter"]');
      if (ec && r.contains(ec)) {
        const art = ec.closest('[data-inconnu]');
        const d = new Date(); d.setDate(d.getDate() + 7);
        ec.textContent = '…';
        try {
          await rpc('notif_reporter', { p_scope: 'orphan',
                                        p_cle: String(art.getAttribute('data-inconnu')),
                                        p_jusqu_a: d.toISOString(), p_motif: null });
          await recharger();
        } catch (e) { ec.textContent = 'échec'; }
        return;
      }

      // --- alerter un vendeur
      const al = ev.target.closest('[data-role="alerter"]');
      if (al && r.contains(al)) {
        const tr = al.closest('tr[data-cle]');
        al.textContent = '…';
        try {
          const res = await rpc('notif_alerter', {
            p_id_user_cible: Number(tr.getAttribute('data-cle')), p_id_client: null,
            p_message: 'Des clients attendent une réponse depuis trop longtemps.' });
          al.textContent = (res && res.ok) ? 'alerté' : 'échec';
        } catch (e) { al.textContent = 'échec'; }
        return;
      }

      // --- alerte lue
      const vu = ev.target.closest('[data-role="alerte-lue"]');
      if (vu && r.contains(vu)) {
        const art = vu.closest('[data-alerte]');
        try {
          await rpc('notif_alerte_lue', { p_id: Number(art.getAttribute('data-alerte')) });
          await recharger();
        } catch (e) { }
        return;
      }

      // --- conclure un rendez-vous passé
      // --- le compte rendu : la MEME fiche que dans l'agenda
      // Trois boutons posaient trois questions fermees et appelaient une RPC
      // qui n'existait plus. Le vendeur ouvre maintenant le formulaire complet
      // — issue, temperature, motif de perte, relance, preuve d'appel — celui
      // qu'il connait deja par l'agenda.
      const cr = ev.target.closest('[data-role="cr"]');
      if (cr && r.contains(cr)) {
        const art = cr.closest('[data-conclure]');
        const id = art && art.getAttribute('data-conclure');
        const liste = ((state.j && state.j.promesses) || {}).a_conclure || [];
        const l = liste.filter(x => String(x.id_rdv) === String(id))[0];
        if (l) openCompteRendu(l);
        return;
      }

      // --- écouter une note vocale, ou se déplacer dedans (avant l'ouverture
      //     de fiche : le lecteur est dans la carte, dont le clic ne doit pas
      //     naviguer)
      const voc = ev.target.closest('.vocal[data-voc]');
      if (voc && r.contains(voc)) {
        ev.stopPropagation();
        if (ev.target.closest('.vbar')) deplacerVocal(voc, ev);
        else jouerVocal(voc);
        return;
      }

      // --- ouvrir la fiche
      const rep = ev.target.closest('[data-role="repondre"]');
      if (rep && r.contains(rep)) { ouvrirFiche(clientDe(rep), TAB_CONTACTS); return; }
      const repr = ev.target.closest('[data-role="repondre-rdv"]');
      if (repr && r.contains(repr)) { ouvrirFiche(clientDe(repr), TAB_RDV); return; }
    });

    // =========================================================================
    //  MONTAGE
    //
    //  Le cadre d'abord, l'appel ensuite : la page ne reste jamais blanche.
    //  Le « vu » part après l'affichage, et ne retire rien — il arrête
    //  seulement le battement de la pastille.
    // =========================================================================
    squelette();
    await recharger();

    try { await rpc('notif_vu_maintenant'); prevenirBadge(); } catch (e) { }

    // Le temps réel : on écoute les tables qui créent des dettes. Un
    // rafraîchissement est groupé pour ne pas repartir à chaque message d'une
    // rafale.
    let differe = null;
    function plusTard() {
      if (differe) clearTimeout(differe);
      differe = setTimeout(() => { differe = null; recharger(); }, 1200);
    }
    try {
      if (!window.__notifCanal) {
        const ch = ctx.supabase.channel('oropra-notifs-v2');
        ['sms_messages', 'wa_messages', 'voip_calls', 'emails', 'RDV_CLIENT',
         'RAPPORT_VENDEUR', 'notif_alerte'].forEach(t => {
          ch.on('postgres_changes', { event: '*', schema: 'public', table: t }, plusTard);
        });
        ch.subscribe();
        window.__notifCanal = ch;
      }
    } catch (e) { /* le temps réel n'est pas critique */ }

    // Le périmètre de la barre du haut : un changement de site change ce que
    // voit un manager. On se contente d'écouter, sans jamais imposer.
    try {
      const b = FW().oropraSite || window.oropraSite;
      if (b && typeof b.onChange === 'function' && !state.busBound) {
        state.busBound = true;
        // On ne compte pas les tours : le bus annonce son état courant dès
        // l'abonnement, et ce premier état peut déjà différer de celui qui a
        // servi au chargement si le bus n'était pas prêt. Seule la signature
        // du périmètre décide d'un rechargement.
        b.onChange(() => {
          if (signature(sitesDuPerimetre()) === state.sig) return;
          recharger();
        });
      }
    } catch (e) { }
  }
});
