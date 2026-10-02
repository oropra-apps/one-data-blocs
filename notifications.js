// ============================================================================
//  NOTIFICATIONS — module One Data (OD.define)   v5 — PROFIL TEAM COLIN
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
//       rendez-vous      -> son COMPTE RENDU : venu, pas venu, reporté
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
      // L'onglet se pose UNE SEULE FOIS, avant la navigation. La topnav a paye
      // pour l'apprendre : des re-applications differees ecrasaient le clic
      // suivant de l'utilisateur sur un autre onglet et le laissaient vide.
      if (onglet != null) ecrireVar(FICHE_TAB_VAR, onglet);
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
    function telMasque(t) {
      const s = String(t || '').replace(/\s/g, '');
      if (s.length < 6) return s || '—';
      return s.slice(0, 4) + FINE + '••' + FINE + '••' + FINE + s.slice(-2);
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
      if (r === 4) return 'vendeur';
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
        +   (x.apercu ? '<p class="extrait">' + esc(x.apercu) + '</p>' : '')
        +   (ouvert ? blocReport('client', x.id_client) : '')
        + '</div>'
        + '<div class="actes">'
        +   (x.tel ? '<a class="btn p" href="tel:' + esc(String(x.tel).replace(/\s/g, ''))
                   + '" data-role="appeler">Rappeler</a>' : '')
        +   '<button type="button" class="btn s" data-role="repondre">Répondre</button>'
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
        + '<div><h3>' + esc(telMasque(i.interlocuteur))
        +   (n > 1 ? ' <span class="enjeu livr">' + fmt(n) + ' appels</span>' : '') + '</h3>'
        + '<p class="attend">A appelé <span class="depuis'
        +   (n > 1 ? ' tiede' : ' calme') + '">'
        +   (n > 1 ? fmt(n) + ' fois' : 'une fois, ' + quandLisible(i.last_contact)) + '</span>'
        +   ' — aucune fiche ne porte ce numéro</p>'
        + '<div class="fil">' + pastillesCanaux([i.media], false)
        +   '<span class="ev">Dernier : ' + esc(quandLisible(i.last_contact)) + '</span>'
        +   (i.site ? '<span class="ev">Reçu sur ' + esc(i.site) + '</span>' : '') + '</div>'
        + (i.apercu ? '<p class="extrait">' + esc(i.apercu) + '</p>' : '')
        + '</div>'
        + '<div class="actes">'
        +   '<a class="btn p" href="tel:' + esc(String(i.interlocuteur).replace(/\s/g, ''))
        +     '">Rappeler</a>'
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
        +   '<div class="report" style="margin-top:9px">Que s\u2019est-il pass\u00e9 ?'
        +     '<button type="button" class="q" data-issue="venu">Le client est venu</button>'
        +     '<button type="button" class="q" data-issue="absent">Il n\u2019est pas venu</button>'
        +     '<button type="button" class="q" data-issue="reporte">Report\u00e9</button>'
        +   '</div>'
        + '</div>'
        + '<div class="actes">'
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
          + (x.apercu ? '<p class="extrait">' + esc(x.apercu) + '</p>' : '')
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
        + 'rendez-vous se solde par son COMPTE RENDU — venu, pas venu, reporté — et non '
        + 'par l’heure qui passe. Un numéro inconnu se '
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
    }

    async function recharger() {
      await charger();
      rendre();
      prevenirBadge();
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
      const iss = ev.target.closest('[data-issue]');
      if (iss && r.contains(iss)) {
        const art = iss.closest('[data-conclure]');
        const quoi = iss.getAttribute('data-issue');
        let quand = null;
        if (quoi === 'reporte') {
          // Reporter DÉPLACE le rendez-vous : il garde son identité et
          // redevient à venir. Par défaut demain 10 h — le vendeur ajustera
          // depuis l'agenda, qui est fait pour ça.
          const d = new Date();
          d.setDate(d.getDate() + 1); d.setHours(10, 0, 0, 0);
          quand = d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-'
                + String(d.getDate()).padStart(2, '0') + 'T10:00:00';
        }
        iss.textContent = '\u2026';
        try {
          await rpc('notif_rdv_conclure', {
            p_id_rdv: Number(art.getAttribute('data-conclure')),
            p_issue: quoi, p_commentaire: null, p_nouvelle_date: quand });
          await recharger();
        } catch (e) { iss.textContent = '\u00e9chec'; }
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
