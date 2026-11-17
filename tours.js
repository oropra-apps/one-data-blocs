// ============================================================================
//  VISITES GUIDÉES (« Montre-moi en vrai ») — module One Data (OD.define) v6
//  Module app-level : une ancre masquée dans le header partagé suffit pour
//  tout le site. Aucune dépendance Supabase. Expose window.OneDataTour ;
//  délégation de clic sur [data-tour-launch] ; reprise auto via localStorage.
//  NB : nommé 'tours' — 'tutos' est déjà pris par le module centre d'aide.
//
//  v6 (17/11/2026, Team Colin — publish-targets : tours = teamcolin)
//    · Lead management : toutes les visites refaites sur le poste actuel
//      (lead-mgmt v127) : Accueil, Pool, Congélateur, À rappeler, Relances,
//      Campagnes, Suivis, Historique, En souffrance, fiche plein écran ;
//      plateau Vroom Team : Pool BACS, Rappels dus, Transferts, Campagnes,
//      Mes actions, Nouveau lead. Les visites v4/v5 visaient l'ancien poste
//      (onglets « À faire », « Piscine », « Mur ») : elles ne démarraient
//      plus ou pointaient dans le vide.
//    · Suivi d'activité refait (activite v16 : un écran par rôle — Ma journée,
//      En direct, Point du matin, Site, Groupe).
//    · Performances : vue Ventes corrigée, nouvelle visite de la vue Leads.
//    · Nouvelles visites : Démarrer (barre du haut), Fiche client,
//      Propositions commerciales, Bilatérales (vendeur et encadrement), Delco.
//    · Moteur : cible { css, has } (premier élément visible dont le texte
//      contient « has ») ; chemin de page direct (path) en plus de pageId.
//  Les visites ne cliquent jamais un bouton qui écrit en base.
// ============================================================================
/* ---------------------------------------------------------------------
   Propriétés d'étape :
     target   : { css } | { css, has } | { tour:'data-tour' } | { text }
     optional : true → étape passée si sa cible n'apparaît pas (≈ 2,5 s)
     requires : 'css' | function → étape gardée seulement si vrai AU DÉMARRAGE
     action   : function(doc) (peut être async) | { click:'css' } → exécutée
                quand l'étape s'affiche (bascule d'onglet, ouverture…)
   Propriétés de visite :
     pageId / path, rootCheck (repère « page prête »), steps, fin (nettoyage)
   --------------------------------------------------------------------- */
OD.define('tours', {
  mount(__anchor, ctx) {
  const doc = __anchor.ownerDocument || document;
  const win = doc.defaultView || window;

  /* =====================================================================
     OUTILS DES VISITES
     ===================================================================== */
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const clic = sel => () => { const n = doc.querySelector(sel); if (n) n.click(); };
  const txt = n => String((n && n.textContent) || '').replace(/\s+/g, ' ').trim().toLowerCase();
  function frontWin() { try { return (window.wwLib && wwLib.getFrontWindow && wwLib.getFrontWindow()) || win; } catch (e) { return win; } }
  // Lead management : le poste expose window.__lmtcTour (fiche d'exemple où
  // aucun geste n'est enregistré).
  function lmApi() { const f = frontWin(); return (f && f.__lmtcTour) || win.__lmtcTour || null; }
  const lmExemple = async () => { const t = lmApi(); if (t && t.exemple) { await t.exemple(); await sleep(350); } };
  const lmFermer = () => { const t = lmApi(); if (t && t.fermer) t.fermer(); };
  const onglet = id => async () => { const n = doc.querySelector('.lmtc .tabs [data-a="tab"][data-id="' + id + '"]'); if (n && !n.classList.contains('on')) { n.click(); await sleep(250); } };
  // Les postes, reconnus à leurs onglets et à leur titre.
  const PLAT = '.lmtc .tabs [data-id="transferts"]';
  const VEND = '.lmtc .tabs [data-id="arappeler"]';
  const SITE = '.lmtc .tabs [data-id="bloques"], .lmtc .tabs [data-id="arappeler"]';
  const ENC = '.lmtc .tabs [data-id="bloques"]';
  const estDirection = () => !!doc.querySelector(ENC) && /direction/.test(txt(doc.querySelector('.lmtc .hello-l, .lmtc .ac-sup')));
  const estChef = () => !!doc.querySelector(ENC) && !estDirection();
  const LM_PAGE = '99519997-f935-471a-9147-b0118191b991';
  const ACCUEIL = 'f84d6f00-de35-45b9-ae23-c1f1e46bfa69';
  const lm = (steps, extra) => Object.assign({ pageId: LM_PAGE, path: '/marketing', rootCheck: '.lmtc .tabs', fin: lmFermer, steps }, extra || {});
  const FIN = (titre, body) => ({ title: titre, body });
  // Fiche du lead (sites) : gestes du chef, issues de l'appel.
  const mode = id => clic('.lmtc-ov .drawer [data-a="mode"][data-id="' + id + '"]');
  const res = id => async () => { const n = doc.querySelector('.lmtc-ov .drawer [data-a="res"][data-id="' + id + '"]'); if (n) { n.click(); await sleep(200); } };
  const issue = id => async () => { const n = doc.querySelector('.lmtc-ov .drawer [data-a="issue"][data-id="' + id + '"]'); if (n) { n.click(); await sleep(200); } };
  const carteFiche = has => ({ css: '.lmtc-ov .drawer .fx-card', has });
  const secPlat = has => ({ css: '.lmtc-ov .drawer section', has });
  // Suivi d'activité : bascule d'écran.
  const ecran = v => async () => { const b = doc.querySelector('#act-root [data-seg="ecran"] [data-v="' + v + '"]'); if (b && b.getAttribute('aria-pressed') !== 'true') { b.click(); await sleep(900); } };
  const aEcran = v => () => !!doc.querySelector('#act-root [data-seg="ecran"] [data-v="' + v + '"]');
  // Fiche client : onglet.
  const ficheOnglet = k => async () => { const b = doc.querySelector('#oropra-fiche-shell .fs-tab[data-tab="' + k + '"]'); if (b && !b.classList.contains('on')) { b.click(); await sleep(500); } };
  // Barre du haut : ouvre / ferme un menu déroulant par son libellé.
  function menuTop(lib) {
    return async () => {
      const b = [...doc.querySelectorAll('a,button,[role="button"],div,span')].find(n => txt(n) === lib.toLowerCase() && n.getClientRects().length && n.closest('header, nav, [class*="nav"]'));
      if (b) { try { b.dispatchEvent(new MouseEvent('mouseenter', { bubbles: true })); b.dispatchEvent(new MouseEvent('mouseover', { bubbles: true })); } catch (e) {} b.click(); await sleep(300); }
    };
  }
  const fermerMenus = () => { try { doc.body.dispatchEvent(new MouseEvent('mousedown', { bubbles: true })); doc.body.click(); } catch (e) {} };

  const TOURS = {

    /* =================================================================
       LEAD MANAGEMENT — vue d'ensemble, un par poste
       ================================================================= */
    'lm-vendeur': lm([
      FIN('Ton poste vendeur', 'Je te montre ton poste Lead management en une minute. Clique « Suivant ».'),
      { action: onglet('accueil'), target: { css: '.lmtc .ac-h' }, title: 'Ta journée', body: 'Ton site, la date, combien de clients tu as à rappeler (et combien sont en retard), et combien de leads sont libres dans le Pool.' },
      { optional: true, target: { css: '.lmtc .ac-ks' }, title: 'Les quatre chiffres', body: 'À rappeler, en retard, dans le Pool, et les leads qualifiés pour toi par la Vroom Team.' },
      { optional: true, target: { css: '.lmtc .ac-next' }, title: 'À faire maintenant', body: 'Le lead le plus urgent. Le tien : « Appeler » ou « Ouvrir la fiche ». Sinon, le plus pressé du Pool : « Prendre ».' },
      { optional: true, target: { css: '.lmtc .ac-g > .ac-c:not(.pool)' }, title: 'À rappeler', body: 'Tes leads, le plus urgent en haut. Les « pas joint » remontent à l’heure du rappel que tu as choisie.' },
      { optional: true, target: { css: '.lmtc .ac-c.pool' }, title: 'Le Pool du site', body: 'Les leads que personne n’a pris : premier arrivé, premier servi. « Prendre » le met à ton nom et ouvre sa fiche.' },
      { optional: true, target: { css: '.lmtc .ac-side' }, title: 'Aussi à faire', body: 'Tes relances (clients déjà essayés) et tes campagnes. Un lead de la Vroom Team t’attend ? Donne ton avis sur sa qualification dans la fiche.' },
      { target: { css: '.lmtc .tabs' }, title: 'Les onglets', body: 'Accueil, Pool, Congélateur, À rappeler, Relances, Campagnes, Suivis, Historique. Le chiffre passe en rouge quand un lead est en retard.' },
      { optional: true, target: { css: '.lmtc .outils' }, title: 'Les filtres', body: 'VN / VO si tu vends les deux, Particuliers / Pros, « Rappels programmés » (aujourd’hui et demain) et la période de réception.' },
      FIN('À toi de jouer', 'Commence par « À faire maintenant ». Chaque geste a sa visite dans la section Lead management des tutos.'),
    ]),

    'lm-chef': lm([
      FIN('Ton poste chef des ventes', 'Je te montre ton poste Lead management en une minute. Clique « Suivant ».'),
      { action: onglet('accueil'), target: { css: '.lmtc .ac-h, .lmtc .hello' }, title: 'Ton site aujourd’hui', body: 'Combien de leads attendent un vendeur dans le Pool, et combien demandent ton intervention.' },
      { optional: true, target: { css: '.lmtc .ac-ks' }, title: 'Les chiffres du site', body: 'Dans le Pool (dont hors délai), chez les vendeurs, en souffrance, venus de la Vroom Team, et la part de leads rappelés dans le délai sur 30 jours.' },
      { optional: true, target: { css: '.lmtc .perim' }, title: 'Ton périmètre', body: 'Si tu encadres plusieurs sites, choisis-en un ici : l’Accueil, le Pool et les listes le suivent.' },
      { optional: true, target: { css: '.lmtc .ac-c.urg' }, title: 'À traiter maintenant', body: 'Les leads en souffrance chez tes vendeurs, le plus urgent en haut. « Agir » ouvre la fiche : réattribuer, rendre au Pool, renvoyer, clore.' },
      { optional: true, target: { css: '.lmtc .ac-c.pool' }, title: 'Le Pool', body: 'Filtre Tous, Hors délai, VN, VO. En libre-service, les vendeurs se servent ; tu peux prendre un lead (« Pour moi ») ou l’attribuer (« Attribuer… »).' },
      { optional: true, target: { css: '.lmtc .ac-side' }, title: 'Ton équipe et le pilotage', body: 'Pour chaque vendeur : leads ouverts et en souffrance. Dessous : la règle d’attribution du site, les campagnes et, s’il y en a, les leads ouverts depuis plus de 24 h à solder.' },
      { target: { css: '.lmtc .tabs' }, title: 'Les onglets', body: 'Accueil, Pool, Congélateur, Mes leads (si tu vends aussi), En souffrance, Campagnes, Suivis, Historique.' },
      { optional: true, target: { css: '.lmtc .k-vend-sel' }, title: 'L’écran d’un vendeur', body: 'Choisis un vendeur pour voir exactement son écran : son Pool, ses leads à rappeler, ses relances. En lecture seule.' },
      FIN('À toi de jouer', 'Un coup d’œil à « À traiter maintenant », puis au Pool. Chaque geste a sa visite dans la section Lead management.'),
    ]),

    'lm-direction': lm([
      FIN('Ton poste direction', 'Je te montre ton poste Lead management en une minute. Clique « Suivant ».'),
      { target: { css: '.lmtc .hello' }, title: 'La situation', body: 'Ton périmètre, les leads qui attendent dans le Pool (dont hors délai) et les leads en souffrance chez les vendeurs.' },
      { optional: true, target: { css: '.lmtc .perim' }, title: 'Le périmètre', body: 'Tous mes sites, ou une marque, une affaire, un site. Sur un site que tu n’encadres pas, tu lis tout : c’est le chef des ventes qui agit.' },
      { action: onglet('pool'), target: { css: '.lmtc .panel' }, title: 'Le Pool', body: 'Les leads libres du périmètre, le plus pressé en tête, chacun avec son site et son délai.' },
      { action: onglet('bloques'), target: { css: '.lmtc .panel' }, title: 'En souffrance', body: 'Vendeur par vendeur : les leads pris sans appel, hors délai, gardés plus de 24 h ou injoignables après trois essais.' },
      { action: onglet('campagnes'), target: { css: '.lmtc .panel' }, title: 'Campagnes', body: 'L’avancement des campagnes de ton périmètre, et « Créer une campagne ».' },
      { target: { css: '.lmtc .tabs' }, title: 'Les onglets', body: 'Pool, Congélateur, En souffrance, Campagnes, Suivis, Historique.' },
      { action: onglet('pool'), title: 'À toi de jouer', body: 'Choisis un site dans le périmètre pour voir son Pool et son équipe comme son chef des ventes.' },
    ]),

    'lm-plateau': lm([
      FIN('Ton poste Vroom Team', 'Je te montre ton poste en une minute. Clique « Suivant ».'),
      { target: { css: '.lmtc .hello' }, title: 'Ta situation', body: 'Leads à traiter dans le Pool BACS, rappels dus, et ce que tu as fait aujourd’hui : pris, transférés, abandonnés. Si BACS n’a pas été relu depuis 2 h, c’est écrit ici.' },
      { optional: true, target: { css: '.lmtc .hello .cta' }, title: 'Prendre le suivant', body: 'Le prochain lead à traiter, « Demande client (1h) » d’abord. Un clic : il est réservé à ton nom et sa fiche s’ouvre.' },
      { optional: true, target: { css: '.lmtc .voyant' }, title: 'Le voyant BACS', body: 'Vert : BACS connecté, tes gestes y partent. Orange : des gestes attendent. Rouge : BACS fermé ou des échecs.' },
      { optional: true, target: { css: '.lmtc .b1h' }, title: 'Demande client (1h)', body: 'Pénalité constructeur au-delà d’une heure : ces leads restent en bandeau sur tous les onglets tant qu’ils attendent.' },
      { target: { css: '.lmtc .tabs' }, title: 'Tes cinq onglets', body: 'Pool BACS, Rappels dus, Transferts, Campagnes, Mes actions.' },
      { optional: true, target: { css: '.lmtc .outils' }, title: 'Rechercher, créer', body: 'Recherche un lead par nom, téléphone ou e-mail ; « + Nouveau lead » pour un appel entrant ; VN / VO ; la période.' },
      { action: onglet('piscine'), target: { css: '.lmtc .panel' }, title: 'Le Pool BACS', body: 'Les leads BACS à prendre, groupés : Demande client (1h), Relance concession (48h), autres, trafic atelier.' },
      FIN('À toi de jouer', 'Prends le suivant. Garde l’onglet BACS ouvert et connecté : One Data y écrit pour toi.'),
    ]),

    /* =================================================================
       LEAD MANAGEMENT — premiers pas
       ================================================================= */
    'lm-delais': lm([
      FIN('Délais et couleurs', 'Chaque lead a un délai de premier contact. Je te montre où le lire.'),
      { requires: VEND, action: onglet('arappeler'), optional: true, target: { css: '.lmtc .panel .lr .tm' }, title: 'Le compte à rebours', body: 'Vert : le temps qu’il reste avant le délai. Orange : moins de 40 % du délai restant. Rouge « +12 min hors délai » : délai dépassé. Au-delà de 24 h, la date d’arrivée.' },
      { requires: SITE, action: onglet('pool'), optional: true, target: { css: '.lmtc .panel .lg-t, .lmtc .panel .lr .tm, .lmtc .cartes .age' }, title: 'Dans le Pool', body: 'Le gros chiffre : l’attente depuis l’arrivée sur le site. Dessous : « hors délai » ou ce qu’il reste (« reste 2 h »).' },
      { requires: PLAT, action: onglet('piscine'), optional: true, target: { css: '.lmtc .panel .lr .tm' }, title: 'Le minuteur du plateau', body: 'Depuis la réception dans BACS, coloré selon le délai de la source. « Demande client (1h) » : pénalité constructeur au-delà d’une heure.' },
      { target: { css: '.lmtc .tabs' }, title: 'Le chiffre des onglets', body: 'Il passe en rouge dès qu’un lead de la liste est en retard.' },
      { requires: SITE, action: lmExemple, optional: true, target: { css: '.lmtc-ov .drawer .fx-del' }, title: 'Dans la fiche', body: 'L’anneau se remplit à mesure que le délai passe : « À rappeler avant 10:45 », ou « Délai dépassé de 27 min ». Le délai du site se compte en heures ouvrées.' },
      { action: lmFermer, title: 'À retenir', body: 'Un créneau choisi par le client (message automatique) remplace le compte à rebours : on rappelle à l’heure qu’il a demandée.' },
    ]),

    'lm-bacs-sites': lm([
      FIN('Ce qui part dans BACS', 'Pour un lead venu de BACS, tes gestes sont reportés dans BACS : tu n’as pas à y retourner.'),
      { optional: true, target: { css: '.lmtc .bacs-l' }, title: 'BACS fermé sur ce poste', body: 'Ce bandeau apparaît quand aucun onglet BACS n’est ouvert dans ton navigateur : les gestes sur les leads BACS sont alors refusés. Ouvre BACS, connecte-toi.' },
      { action: lmExemple, target: { css: '.lmtc-ov .drawer .fx-c1' }, title: 'La demande', body: 'La source et, pour un lead BACS, son statut BACS.' },
      { optional: true, target: { css: '.lmtc-ov .drawer .env' }, title: 'Dans BACS', body: 'Chaque envoi et son résultat : fait, en attente ou échec avec la raison. Un échec se relance.' },
      { target: { css: '.lmtc-ov .drawer .fx-c3 .dr-f' }, title: 'Les gestes reportés', body: 'Le RDV, l’attribution, le renvoi vers un autre site, la clôture (avec son motif) et le retour à la Vroom Team partent dans BACS.' },
      { optional: true, target: { css: '.lmtc-ov .drawer .row.pied .hint' }, title: 'Le rappel en bas', body: 'Il dit si c’est un lead BACS ou un lead hors BACS, enregistré seulement dans One Data.' },
      { action: lmFermer, title: 'Ce qui reste dans One Data', body: 'Joint sans RDV, Pas joint et Rendre au Pool ne modifient pas BACS. Rien n’a été enregistré pendant la visite.' },
    ]),

    /* =================================================================
       LEAD MANAGEMENT — vendeur
       ================================================================= */
    'lm-v-pool': lm([
      { action: onglet('pool'), target: { css: '.lmtc .tabs [data-id="pool"]' }, title: 'Le Pool du site', body: 'Les leads que personne n’a pris : site web, Leboncoin, La Centrale, e-mails, et les leads transmis par la Vroom Team.' },
      { optional: true, target: { css: '.lmtc .panel .ph' }, title: 'Libre-service', body: 'Premier arrivé, premier servi. Un lead pris et non traité (ni appel, ni geste) dans le quart d’heure revient tout seul dans le Pool.' },
      { optional: true, target: { css: '.lmtc .panel .lr' }, title: 'Un lead', body: 'Le temps, le nom, la demande (véhicule ou qualification), le détail du message, la source et les étiquettes : Pro, Qualifié par la Vroom Team…' },
      { optional: true, target: { css: '.lmtc .panel .lr [data-a="prendre"]' }, title: 'Prendre', body: 'Le lead passe à ton nom, dans « À rappeler », et sa fiche s’ouvre.' },
      { optional: true, target: { css: '.lmtc .panel .resa-l' }, title: 'Réservé', body: 'Un collègue regarde ce lead en ce moment.' },
      { optional: true, target: { css: '.lmtc .seg-u[aria-label="Clientèle"]' }, title: 'Particuliers / Pros', body: 'Ne montre que les particuliers ou que les professionnels (société, SIRET).' },
      FIN('Un lead BACS manque ?', 'Chez Toyota, les demandes BACS passent d’abord par la Vroom Team, qui les qualifie avant de les envoyer au site. À Lexus Sceaux, elles arrivent directement dans le Pool.'),
    ]),

    'lm-v-fiche': lm([
      FIN('La fiche du lead', 'Je t’ouvre une fiche d’exemple : rien n’y est enregistré.'),
      { action: lmExemple, target: { css: '.lmtc-ov .drawer .fx-h' }, title: 'L’en-tête', body: 'Le client, son rang dans ta liste (« Lead 2 sur 5 »), le site, qui l’a en main ; « Lead suivant » à droite.' },
      { optional: true, target: { css: '.lmtc-ov .drawer .fx-del' }, title: 'Le délai', body: 'Avant quand rappeler, ou le créneau choisi par le client.' },
      { target: { css: '.lmtc-ov .drawer .fx-c1' }, title: 'La demande', body: 'Ce que le client a demandé (VN ou VO, véhicule, message complet), la source, la date, ses coordonnées et « Ouvrir la fiche client ».' },
      { optional: true, target: { css: '.lmtc-ov .drawer .fx-card.vr' }, title: 'Ce que la Vroom Team a appris', body: 'Projet, modèle, échéance, reprise, financement, note pour toi. Dis en un clic si la qualification était bonne.' },
      { target: { css: '.lmtc-ov .drawer .fx-call' }, title: 'Appeler, écrire', body: 'Appeler (par ton poste 3CX), SMS, WhatsApp, E-mail : la fenêtre propose des modèles adaptés au lead.' },
      { optional: true, target: carteFiche('Message automatique'), title: 'Le message automatique', body: 'Ce que le client a reçu à l’arrivée de sa demande (RCS, SMS ou e-mail) : envoyé, remis, lu, lien ouvert, et sa réponse.' },
      { optional: true, target: carteFiche('Delco'), title: 'Delco, avant d’appeler', body: 'Ce qu’il faut savoir : stock disponible, véhicule à reprendre, affaire déjà en cours, autres demandes, passages atelier.' },
      { optional: true, target: { css: '.lmtc-ov .drawer .fx-tiles' }, title: 'Ce que le groupe sait de lui', body: 'Son véhicule, ses passages atelier, ses achats.' },
      { optional: true, target: carteFiche('Fil du client'), title: 'Le fil du client', body: 'BACS, One Data, Vroom Team, appels, messages, RDV, atelier : les derniers événements, avec qui.' },
      { target: { css: '.lmtc-ov .drawer .fx-c3' }, title: 'Le résultat de l’appel', body: 'À droite, après l’appel : voir la visite « Après l’appel ».' },
      { action: lmFermer, title: 'À toi de jouer', body: 'La fiche d’exemple est fermée : rien n’a été enregistré.' },
    ]),

    'lm-v-apres': lm([
      FIN('Après l’appel', 'Je t’ouvre une fiche d’exemple pour te montrer comment dire ce qui s’est passé.'),
      { action: async () => { await lmExemple(); if (doc.querySelector('.lmtc-ov .drawer [data-a="mode"][data-id="resultat"]')) { mode('resultat')(); await sleep(200); } await res('rdv')(); },
        target: { css: '.lmtc-ov .drawer [role="radiogroup"][aria-label^="Résultat"]' }, title: 'Quatre issues', body: 'Joint · RDV, Joint · sans RDV, Pas joint, Clore.' },
      { action: res('rdv'), target: { css: '.lmtc-ov .drawer .fx-c3 .dr-f' }, title: 'Joint · RDV', body: 'L’objet (RDV vente, essai, estimation de reprise, livraison VN ou VO), la date, les invités, puis enregistrer : le RDV va dans ton agenda et, pour un lead BACS, dans BACS.' },
      { action: res('joint'), target: { css: '.lmtc-ov .drawer .fx-c3 .dr-f' }, title: 'Joint · sans RDV', body: 'Une note si tu veux, puis « Enregistrer le contact ». Le lead sort de tes leads à rappeler.' },
      { action: res('pasjoint'), target: { css: '.lmtc-ov .drawer .fx-c3 .dr-f' }, title: 'Pas joint', body: 'Choisis la prochaine tentative (dans 1 h, 2 h, ce soir, demain…) puis « Noter la tentative 1 sur 3 ». Le lead passe dans Relances, rangé à cette heure.' },
      { action: res('clore'), target: { css: '.lmtc-ov .drawer .fx-c3 .dr-f' }, title: 'Clore', body: 'Avec un motif : pas intéressé, injoignable, parti à la concurrence, doublon, fausse demande, autre. Un lead BACS est aussi clos dans BACS.' },
      { requires: VEND, optional: true, target: { css: '.lmtc-ov .drawer [data-a="rendre"]' }, title: 'Rendre au Pool', body: 'Ce lead n’est pas pour toi ? Il redevient libre pour tes collègues.' },
      { action: lmFermer, title: 'À retenir', body: 'Sans fiche client rattachée, « Joint » te demande d’abord de choisir la bonne fiche ou d’en créer une. Rien n’a été enregistré pendant la visite.' },
    ]),

    'lm-v-rappeler': lm([
      { action: onglet('arappeler'), target: { css: '.lmtc .tabs [data-id="arappeler"]' }, title: 'À rappeler', body: 'Tes leads pas encore contactés, le plus urgent en haut.' },
      { optional: true, target: { css: '.lmtc .panel .lr' }, title: 'Une ligne', body: 'Le délai (ou l’heure du rappel), le client, sa demande et son état : nouveau, qualifié par la Vroom Team, retour au Pool dans 9 min…' },
      { optional: true, target: { css: '.lmtc .panel .lr [data-a="appeler"]' }, title: 'Appeler', body: 'Ouvre la fiche et lance l’appel.' },
      { optional: true, target: { css: '.lmtc .panel > .foot' }, title: 'Les leads anciens', body: 'Tes leads reçus il y a plus de 30 jours : ils ne sont plus à appeler en priorité, ton chef des ventes les solde.' },
      { action: onglet('relances'), target: { css: '.lmtc .tabs [data-id="relances"]' }, title: 'Relances', body: 'Les clients déjà essayés sans les joindre (« pas joint ×2 »), à l’heure du rappel que tu as choisie. Rouge quand un rappel est dû.' },
      { optional: true, target: { css: '.lmtc .acc-f' }, title: 'Rappels programmés', body: 'Ne garde que les leads à rappeler aujourd’hui ou demain, créneaux choisis par les clients compris.' },
      FIN('À retenir', 'Après trois essais sans joindre le client, ton chef des ventes le voit en souffrance.'),
    ]),

    'lm-congelateur': lm([
      { action: onglet('congelateur'), target: { css: '.lmtc .tabs [data-id="congelateur"]' }, title: 'Le Congélateur', body: 'Les leads que la Vroom Team a abandonnés dans BACS, avec le motif. Une deuxième chance pour le site.' },
      { optional: true, target: { css: '.lmtc .panel .ph' }, title: 'Sans délai', body: 'Ici, aucun délai ni alerte : un lead repris ne revient pas au Pool tout seul.' },
      { optional: true, target: { css: '.lmtc .panel .lr.cg' }, title: 'Un lead congelé', body: 'Reçu le…, la demande, abandonné le…, et le motif de la Vroom Team avec son commentaire.' },
      { optional: true, target: { css: '.lmtc .panel [data-a="cg-prendre"]' }, title: 'Prendre', body: 'Le lead passe à ton nom (À rappeler, ou Mes leads pour un chef) et repasse « Accepté » dans BACS.' },
      FIN('S’il n’aboutit pas', 'Dans sa fiche, « Remettre au congélateur » le rend à tes collègues, avec ton commentaire.'),
    ]),

    'lm-v-campagnes': lm([
      { action: onglet('campagnes'), target: { css: '.lmtc .tabs [data-id="campagnes"]' }, title: 'Campagnes', body: 'Les clients à relancer d’une campagne de ton site (ex. « Lexus Black Friday ») : libre-service, comme le Pool.' },
      { optional: true, target: { css: '.lmtc .panel .cp-kpis' }, title: 'L’avancement', body: 'À prendre, pris par l’équipe, traités, propositions, commandes, et tes clients.' },
      { optional: true, target: { css: '.lmtc .panel .cp-flt, .lmtc .panel [data-x="cp-q"]' }, title: 'Les filtres', body: 'Nom, ville ou immatriculation ; modèle ; critère : simulation BACS, renouvellement, 100 000 km, passage atelier récent, joignable sur mobile…' },
      { optional: true, target: { css: '.lmtc .panel .lr.cp-l' }, title: 'Un client', body: 'Son indice de priorité sur 100, son véhicule (modèle, immatriculation, année, km), ses passages atelier et les raisons de la priorité.' },
      { optional: true, target: { css: '.lmtc .panel [data-a="camp-prendre"]' }, title: 'Je prends', body: 'Le client passe à ton nom, dans « À relancer par vous ».' },
      { optional: true, target: { css: '.lmtc .panel [data-a="camp-traiter"]' }, title: 'Traiter', body: 'Ouvre le panneau : numéros, e-mail, véhicule, raisons, puis le résultat (RDV pris, à rappeler, messagerie, pas intéressé, déjà équipé, ne plus appeler) ou « Rendre ».' },
      FIN('À retenir', 'Une relance est comptée comme traitée dès que tu as noté son résultat.'),
    ]),

    'lm-suivis': lm([
      { action: onglet('suivis'), target: { css: '.lmtc .tabs [data-id="suivis"]' }, title: 'Suivis', body: 'Un client rappelle ? Retrouve sa demande et vois où elle en est, même si un collègue la suit.' },
      { target: { css: '.lmtc .panel .hist-f' }, title: 'Rechercher', body: 'Nom, téléphone, e-mail ou véhicule. Sans recherche : les demandes prises en charge ces 60 derniers jours, ou encore ouvertes.' },
      { optional: true, target: { css: '.lmtc .panel table.hist' }, title: 'Le tableau', body: 'Client, demande, suivi par, dernier geste, statut (et statut BACS), suite prévue. Un clic ouvre la fiche du client.' },
      FIN('Plusieurs sites', 'La recherche porte d’abord sur le site choisi en haut ; sans résultat, elle cherche sur tes autres sites et le signale.'),
    ]),

    'lm-historique': lm([
      { action: onglet('historique'), target: { css: '.lmtc .tabs [data-id="historique"]' }, title: 'Historique', body: 'Les leads traités et ce qui a été fait : pris, attribué, joint, RDV posé, pas joint, clos…' },
      { optional: true, target: { css: '.lmtc .panel .hist-f' }, title: 'Les filtres', body: 'Période, recherche, statut, résultat, source ; pour un chef, le vendeur.' },
      { optional: true, target: { css: '.lmtc .panel table.hist' }, title: 'Le tableau', body: 'Le geste, son auteur, le statut actuel du lead (vendu, en cours chez un collègue…). Un clic rouvre le lead ou la fiche client.' },
      FIN('À retenir', 'L’Historique suit le site choisi en haut à droite.'),
    ]),

    /* =================================================================
       LEAD MANAGEMENT — chef des ventes, direction
       ================================================================= */
    'lm-c-pool': lm([
      { action: onglet('pool'), target: { css: '.lmtc .tabs [data-id="pool"]' }, title: 'Le Pool', body: 'Les leads du site sans vendeur, le plus pressé en tête.' },
      { optional: true, target: { css: '.lmtc .panel .regle' }, title: 'La règle du site', body: 'Libre-service (les vendeurs se servent), par le chef, ou automatique. « Modifier » la change.' },
      { optional: true, target: { css: '.lmtc .panel .lg-t' }, title: 'Le temps', body: 'L’attente depuis l’arrivée sur le site ; dessous, la situation face au délai de rappel.' },
      { optional: true, target: { css: '.lmtc .cartes > *' }, title: 'Un lead', body: 'Le client, sa demande, sa source ; « + 1 autre demande » si le même contact a déjà écrit au site.' },
      { optional: true, target: { css: '.lmtc .cartes [data-a="choix"], .lmtc .cartes [data-a="attribuer-sugg"], .lmtc .cartes [data-a="attribuer"]' }, title: 'Attribuer', body: 'Le vendeur suggéré (le moins chargé de l’équipe) ou un autre. En libre-service, l’attribution reste possible, en second.' },
      { optional: true, target: { css: '.lmtc .cartes [data-a="prendre"]' }, title: 'Je le prends', body: 'Si tu vends aussi : le lead passe dans « Mes leads ».' },
      { optional: true, target: { css: '.lmtc .panel .stock-l' }, title: 'Le stock', body: 'Les leads ouverts depuis plus de 24 h faussent les délais du site : « Solder le stock ».' },
      { optional: true, target: { css: '.lmtc .panel .team' }, title: 'L’équipe', body: 'Chaque vendeur, ses leads en cours et en souffrance.' },
      FIN('À toi de jouer', 'Rien n’a été attribué pendant la visite.'),
    ]),

    'lm-c-souffrance': lm([
      { action: onglet('bloques'), target: { css: '.lmtc .tabs [data-id="bloques"]' }, title: 'En souffrance', body: 'Les leads qui n’avancent pas chez un vendeur.' },
      { optional: true, target: { css: '.lmtc .panel section.vend' }, title: 'Un vendeur', body: 'Ses leads en souffrance, le plus ancien, et les appels déjà faits sans réponse.' },
      { optional: true, target: { css: '.lmtc .panel [data-a="prevenir"]' }, title: 'Prévenir', body: 'Le vendeur reçoit une alerte avec la liste de ses leads en souffrance.' },
      { optional: true, target: { css: '.lmtc .panel [data-a="tout-reattr"]' }, title: 'Tout réattribuer…', body: 'Ses leads passent à un autre vendeur, ou retournent au Pool.' },
      { optional: true, target: { css: '.lmtc .panel .lien-r' }, title: 'Lead par lead', body: '« Réattribuer › » ouvre la fiche du lead.' },
      { optional: true, target: { css: '.lmtc .panel > .foot' }, title: 'La définition', body: 'Pris sans appel depuis plus de 20 min, délai dépassé, gardé plus de 24 h, ou trois essais sans joindre le client.' },
      FIN('À toi de jouer', 'Prévenir d’abord ; réattribuer si rien ne bouge.'),
    ]),

    'lm-c-fiche': lm([
      FIN('Agir sur un lead', 'Je t’ouvre la fiche d’un lead : rien n’y est enregistré.'),
      { action: lmExemple, target: { css: '.lmtc-ov .drawer .fx-h' }, title: 'La fiche', body: 'Le lead, son site, qui l’a en main, et son délai.' },
      { optional: true, target: { css: '.lmtc-ov .drawer [role="radiogroup"][aria-label="Geste"]' }, title: 'Quatre gestes', body: 'Attribuer (ou réattribuer), Résultat d’appel, Autre site, Clore.' },
      { optional: true, action: mode('attribuer'), target: { css: '.lmtc-ov .drawer #dr-vendeur' }, title: 'Attribuer', body: 'Choisis le vendeur. Dessous : « Confier à la Vroom Team » (lead BACS, Toyota), « Rendre au Pool », ou « Je le prends ».' },
      { optional: true, action: mode('resultat'), target: { css: '.lmtc-ov .drawer .fx-c3 .dr-f' }, title: 'Résultat d’appel', body: 'Si tu as appelé toi-même : RDV, joint, pas joint ou clore.' },
      { optional: true, action: mode('renvoyer'), target: { css: '.lmtc-ov .drawer #dr-site' }, title: 'Autre site', body: 'Le lead part dans le Pool du site choisi, délai remis à zéro. BACS reçoit le nouveau site.' },
      { optional: true, action: mode('clore'), target: { css: '.lmtc-ov .drawer #clore-motif' }, title: 'Clore', body: 'Avec un motif. Un lead BACS est aussi abandonné dans BACS.' },
      { action: lmFermer, title: 'Vue de pilotage', body: 'Sur un site que tu n’encadres pas, tu lis la fiche sans pouvoir agir. Rien n’a été modifié pendant la visite.' },
    ]),

    'lm-c-comme': lm([
      { target: { css: '.lmtc .k-vend-sel' }, title: 'L’écran d’un vendeur', body: 'Le même sélecteur que dans la gestion des ventes.' },
      { action: async () => { const b = doc.querySelector('.lmtc [data-a="comme-menu"]'); if (b && b.getAttribute('aria-expanded') !== 'true') { b.click(); await sleep(250); } }, optional: true, target: { css: '.lmtc .k-vpanel' }, title: 'Choisis un vendeur', body: 'Recherche, puis un clic : tu vois son Pool, ses leads à rappeler, ses relances, comme lui.' },
      { action: async () => { const b = doc.querySelector('.lmtc [data-a="comme-menu"]'); if (b && b.getAttribute('aria-expanded') === 'true') { b.click(); await sleep(200); } }, title: 'En lecture seule', body: 'Un bandeau le rappelle ; « Revenir à ma vue » le referme. Pour agir sur un de ses leads, ouvre-le depuis ta vue.' },
    ]),

    'lm-c-solder': lm([
      { optional: true, action: onglet('accueil'), target: { css: '.lmtc .ac-side [data-a="solder"]' }, title: 'Ouverts depuis plus de 24 h', body: 'Sur l’Accueil, dans Pilotage : le nombre de leads ouverts depuis plus de 24 h, et « solder ».' },
      { optional: true, action: onglet('pool'), target: { css: '.lmtc .panel .stock-l' }, title: 'Au pied du Pool', body: 'Les mêmes leads, avec « Solder le stock ».' },
      { optional: true, action: clic('.lmtc [data-a="solder"]'), target: { css: '.lmtc-ov .modal' }, title: 'La fenêtre', body: 'Elle compte les leads, dont ceux venus de BACS, puis propose : confier à la Vroom Team, répartir sur l’équipe, ou clore sans suite (« stock avant déploiement »).' },
      { action: lmFermer, title: 'Appliquer', body: 'Rien ne part sans ton clic. Je ferme la fenêtre sans rien appliquer.' },
    ]),

    'lm-campagnes': lm([
      { action: onglet('campagnes'), target: { css: '.lmtc .tabs [data-id="campagnes"]' }, title: 'Campagnes', body: 'Les campagnes internes de ton périmètre sur 90 jours.' },
      { optional: true, target: { css: '.lmtc .panel table.camp-t' }, title: 'Le suivi', body: 'Cibles, traitées (avec la barre d’avancement), à relancer, propositions, commandes, vendeurs. L’avancement se lit avant le résultat.' },
      { optional: true, action: clic('.lmtc .panel table.camp-t tr.clic'), target: { css: '.lmtc .panel tr.vdet' }, title: 'Vendeur par vendeur', body: 'Un clic sur une campagne montre qui avance.' },
      { optional: true, action: clic('.lmtc .panel [data-a="creer-camp"]'), target: { css: '.lmtc-ov .modal' }, title: 'Créer une campagne', body: 'Les clients se choisissent par critères (site, particuliers ou sociétés, marque, modèle, âge et kilométrage du véhicule, départements), avec ou sans répartition entre les vendeurs.' },
      { action: lmFermer, title: 'Sans répartition', body: 'Une campagne lancée sans répartition fonctionne comme le Pool : chaque vendeur prend lui-même les clients dans son onglet Campagnes. Rien n’a été créé pendant la visite.' },
    ]),

    /* =================================================================
       LEAD MANAGEMENT — Vroom Team
       ================================================================= */
    'lm-p-pool': lm([
      { action: onglet('piscine'), target: { css: '.lmtc .tabs [data-id="piscine"]' }, title: 'Le Pool BACS', body: 'Les leads « À affecter » ou « Nouveau » de BACS, prêts à être pris.' },
      { optional: true, target: { css: '.lmtc .panel .barre .seg' }, title: 'Moins de 24 h, plus de 24 h, stock', body: 'Les leads frais d’abord ; les plus anciens à part ; « Stock accepté » : acceptés il y a plus de 14 jours, sans suite.' },
      { optional: true, target: { css: '.lmtc .panel .chips.filtres' }, title: 'Les sources', body: 'Une pastille par source avec son nombre ; un clic ajoute ou retire une source.' },
      { optional: true, target: { css: '.lmtc .panel .grp' }, title: 'Les groupes', body: 'Demande client (1h) à prendre maintenant, Relance concession (48h), autres leads, trafic atelier par date de RDV.' },
      { optional: true, target: { css: '.lmtc .panel .lr' }, title: 'Un lead', body: 'Depuis quand il attend, le client, son site, sa demande et ses étiquettes.' },
      { optional: true, target: { css: '.lmtc .panel .lr [data-a="prendre"]' }, title: 'Prendre', body: 'Réserve le lead à ton nom quelques minutes, le passe en Accepté dans BACS et ouvre sa fiche.' },
      FIN('À retenir', 'Un lead arrivé dans BACS après la dernière lecture n’est pas encore visible : la phrase du haut dit quand BACS a été relu.'),
    ]),

    'lm-p-traiter': lm([
      FIN('Traiter un lead', 'Je t’ouvre une fiche d’exemple : rien n’est réservé, rien ne part dans BACS.'),
      { action: lmExemple, target: { css: '.lmtc-ov .drawer .dr-h' }, title: 'La fiche', body: 'Le client et sa demande.' },
      { optional: true, target: secPlat('Client'), title: 'Le client', body: 'Retrouvé dans One Data par son numéro ; sinon cherché dans BACS, ou « nouveau client ».' },
      { optional: true, target: secPlat('Délai'), title: 'Le délai', body: 'Depuis la réception BACS ; ta réservation se prolonge tant que la fiche est ouverte.' },
      { optional: true, target: { css: '.lmtc-ov .drawer .canaux, .lmtc-ov .drawer .tel' }, title: 'Appeler', body: 'Le numéro, « Copier », et les canaux.' },
      { optional: true, target: { css: '.lmtc-ov .drawer .qf' }, title: 'Qualifier', body: 'Projet, modèle, échéance, reprise, financement, note pour le vendeur : c’est ce qu’il lira avant d’appeler.' },
      { optional: true, target: { css: '.lmtc-ov .drawer .sites' }, title: 'Orienter', body: 'Le site BACS, puis ceux où le client a un dossier, puis les autres sites de la marque, chacun avec ses leads en attente.' },
      { optional: true, target: { css: '.lmtc-ov .drawer #q-vendeur' }, title: 'L’attribution', body: 'Le Pool de la concession (règle du site) par défaut, ou un vendeur précis.' },
      { optional: true, target: { css: '.lmtc-ov .drawer .dr-f .issues' }, title: 'L’issue', body: 'Qualifié, Injoignable, Projet long terme, Abandonner : voir la visite « Les quatre issues ».' },
      { optional: true, target: { css: '.lmtc-ov .drawer [data-a="liberer"]' }, title: 'Libérer', body: 'Rend le lead sans rien faire ; fermer la fiche fait de même.' },
      { action: lmFermer, title: 'À toi de jouer', body: 'La fiche d’exemple est fermée : rien n’a été enregistré.' },
    ]),

    'lm-p-issues': lm([
      { action: async () => { await lmExemple(); await issue('qualifier')(); }, target: { css: '.lmtc-ov .drawer .dr-f' }, title: 'Qualifié', body: '« Transférer à … » : le lead part au site choisi avec ta qualification. BACS : Qualifié, site et propriétaire.' },
      { action: issue('injoignable'), target: { css: '.lmtc-ov .drawer .dr-f' }, title: 'Injoignable', body: 'Un rappel dans 2 h, demain 9 h, après-demain 9 h ou à une date ; e-mail et SMS au client si tu les coches. BACS : Injoignable temporairement.' },
      { action: issue('long_terme'), target: { css: '.lmtc-ov .drawer .dr-f' }, title: 'Projet long terme', body: 'Un rappel à la date choisie ; le lead revient dans Rappels dus.' },
      { action: issue('abandon'), target: { css: '.lmtc-ov .drawer .dr-f' }, title: 'Abandonner', body: 'Un commentaire pour BACS et le motif BACS. Le lead part au Congélateur, où un vendeur peut le reprendre.' },
      { action: lmFermer, title: 'Les autres demandes du client', body: 'S’il a plusieurs demandes ouvertes sur le site, une case propose de les clore comme doublons (ou de les abandonner avec le même motif). Rien n’a été enregistré.' },
    ]),

    'lm-p-rappels': lm([
      { action: onglet('rappels'), target: { css: '.lmtc .tabs [data-id="rappels"]' }, title: 'Rappels dus', body: 'Injoignables et projets long terme, du plus en retard au plus lointain.' },
      { optional: true, target: { css: '.lmtc .panel .lbl-s' }, title: 'Le compte', body: 'Combien de rappels sont dus, sur combien de programmés.' },
      { optional: true, target: { css: '.lmtc .panel .lr .tm' }, title: 'Le minuteur', body: '« Maintenant », « retard 2 h 10 » ou « dans 1 h 30 », avec l’heure prévue.' },
      { optional: true, target: { css: '.lmtc .panel .ph-r .seg' }, title: 'Les miens', body: 'Ne garde que les leads dont tu as fait le dernier geste.' },
      { optional: true, target: { css: '.lmtc .panel .grp.garr' }, title: 'L’arriéré BACS', body: 'Les rappels promis dans BACS avant One Data, à traiter aussi.' },
      FIN('À toi de jouer', 'Le bouton de ligne prend le lead et ouvre sa fiche.'),
    ]),

    'lm-p-transferts': lm([
      { action: onglet('transferts'), target: { css: '.lmtc .tabs [data-id="transferts"]' }, title: 'Transferts', body: 'Ce que deviennent les leads qualifiés. Le site a 2 h pour prendre un transfert.' },
      { optional: true, target: { css: '.lmtc .panel .lr .lr-a' }, title: 'L’état', body: 'Contacté par … en …, En attente chez …, Chef relancé, Converti, Clos par le site, Suivi dans BACS.' },
      { optional: true, target: { css: '.lmtc .panel [data-a="relancer"]' }, title: 'Relancer le chef', body: 'Après 2 h sans contact : une alerte part aux chefs des ventes du site.' },
      { optional: true, target: { css: '.lmtc .panel .ph-r .seg' }, title: 'Tout le plateau ou les miens', body: 'Filtre sur tes propres transferts.' },
      FIN('À toi de jouer', 'Surveille les transferts sans contact au-delà de 2 h.'),
    ]),

    'lm-p-campagnes': lm([
      { action: onglet('campagnes'), target: { css: '.lmtc .tabs [data-id="campagnes"]' }, title: 'Campagnes BACS', body: 'Reçus, à prendre, acceptés, en rappel, qualifiés, abandonnés et taux de qualification, campagne par campagne.' },
      { optional: true, target: { css: '.lmtc .panel table.camp-t [data-a="campagne"]' }, title: 'Filtrer', body: 'Restreint le Pool, les rappels et les transferts à cette campagne.' },
      { optional: true, target: { css: '.lmtc .filtre-actif' }, title: 'Le bandeau du filtre', body: 'Il reste sous les onglets tant que le filtre est actif ; « Retirer le filtre » le referme.' },
      FIN('À retenir', 'La phrase du haut et le bandeau « Demande client (1h) » comptent toujours tout le plateau.'),
    ]),

    'lm-p-actions': lm([
      { action: onglet('actions'), target: { css: '.lmtc .tabs [data-id="actions"]' }, title: 'Mes actions', body: 'Tes gestes, dans One Data et directement dans BACS.' },
      { optional: true, target: { css: '.lmtc .panel .barre .seg' }, title: 'La période', body: 'Aujourd’hui, hier, 7 jours…' },
      { optional: true, target: { css: '.lmtc .panel .lr .tags' }, title: 'Le report dans BACS', body: 'Reporté dans BACS, en route, refusé par BACS (survole pour la raison), non reporté, fait dans BACS.' },
      { optional: true, target: { css: '.lmtc .panel [data-a="corriger"]' }, title: 'Corriger', body: 'Une erreur ? « Corriger » la reporte dans BACS, tracée à ton nom. Si un vendeur a déjà la main, la correction attend le superviseur.' },
      FIN('Un refus de BACS', 'Un bandeau rouge liste les gestes refusés : ne les retraite pas, « Signaler au support ».'),
    ]),

    'lm-p-nouveau': lm([
      { target: { css: '.lmtc .outils [data-a="nouveau"]' }, title: '+ Nouveau lead', body: 'Un client appelle sans demande dans BACS : crée son lead ici.' },
      { optional: true, action: clic('.lmtc .outils [data-a="nouveau"]'), target: { css: '.lmtc-ov .drawer' }, title: 'La fiche de création', body: 'Le client (retrouvé par son numéro ou nouveau), la demande, la concession. Si le client a déjà une demande ouverte, la fiche le signale.' },
      { action: lmFermer, target: { css: '.lmtc .outils [data-x="vr-q"]' }, title: 'Rechercher un lead', body: 'Nom, téléphone ou e-mail : la recherche porte sur tout le plateau. Rien n’a été créé pendant la visite.' },
    ]),

    /* =================================================================
       LEAD MANAGEMENT — depuis le tableau de bord
       ================================================================= */
    'lm-dashboard': {
      pageId: ACCUEIL, rootCheck: '#dash-root .dpouls',
      fin: () => { const f = doc.querySelector('#dash-root #dash-tiroir [data-role="fermer"]'); if (f) f.click(); },
      steps: [
        { requires: '#dash-root .dtuile[data-id="v_leads"]', target: { css: '#dash-root .dtuile[data-id="v_leads"]' }, title: 'Jamais contactés', body: 'Tes leads ouverts sans premier contact : le même compte que ton poste Lead management.' },
        { requires: '#dash-root .dtuile[data-id="v_leads"]', action: () => { const t = doc.querySelector('#dash-root .dtuile[data-id="v_leads"]'); if (t && t.getAttribute('aria-expanded') !== 'true') t.click(); },
          target: { css: '#dash-root #dash-tiroir .dmini, #dash-root #dash-tiroir .dnote' }, title: 'La liste', body: 'Client, véhicule, ancienneté et téléphone.' },
        { requires: '#dash-root .dtuile[data-id="v_leads"]', optional: true, target: { css: '#dash-root #dash-tiroir .dlead' }, title: 'Ouvrir', body: 'T’emmène sur Lead management, la fiche du lead déjà ouverte.' },
        { requires: '#dash-root .dtuile[data-id="c_leads"]', target: { css: '#dash-root .dtuile[data-id="c_leads"]' }, title: 'Jamais contactés', body: 'Les leads ouverts de ton équipe sans premier contact, comptés comme sur ton mur.' },
        { requires: '#dash-root .dtuile[data-id="c_leads"]', action: () => { const t = doc.querySelector('#dash-root .dtuile[data-id="c_leads"]'); if (t && t.getAttribute('aria-expanded') !== 'true') t.click(); },
          target: { css: '#dash-root #dash-tiroir .dtiroir' }, title: 'Par vendeur', body: 'Jamais appelés, à plus de 48 h, et le plus ancien, vendeur par vendeur. Pour agir, ouvre ton mur dans Lead management.' },
        FIN('À retenir', 'Le tableau de bord se rafraîchit toutes les 2 minutes ; le poste Lead management est la référence pour agir.'),
      ],
    },


    /* =================================================================
       DÉMARRER — la barre du haut
       ================================================================= */
    'demarrer': {
      path: '/accueil', pageId: ACCUEIL, rootCheck: '.od-bar .od-menus',
      fin: fermerMenus,
      steps: [
        FIN('Bienvenue dans One Data', 'Je te montre la barre du haut : tout part d’elle.'),
        { target: { css: '.od-bar .od-menus' }, title: 'Les menus', body: 'Clients, Ventes, Management, Leads, Véhicules. Survole un menu pour voir ses pages ; ce que tu vois dépend de ton rôle.' },
        { optional: true, target: { css: '#od-recherche' }, title: 'La recherche', body: 'Un client, une immatriculation, un VIN, un téléphone, une affaire : tape quelques lettres, les résultats arrivent rangés par catégorie. Raccourci : Ctrl K.' },
        { optional: true, target: { css: '.od-client-btn' }, title: 'Le dernier client', body: 'Le client que tu as ouvert en dernier : un clic rouvre sa fiche. L’horloge à côté rouvre les clients récents.' },
        { optional: true, target: { css: '.od-site' }, title: 'Le site', body: 'Le site sur lequel tu travailles. Tableau de bord, listes, Pool et stocks le suivent ; si tu es sur plusieurs sites, change-le ici.' },
        { optional: true, target: { css: '.od-user-btn' }, title: 'Ton compte', body: 'Mon compte, Annuaire, Tutos (ce centre d’aide), Email Support, Se déconnecter.' },
        FIN('Le O en bas à droite', 'Le O de One Data : un clic pour donner ton avis ou signaler un problème, à l’écrit ou à la voix. La réponse de l’équipe arrive dans le même fil.'),
      ],
    },

    /* =================================================================
       FICHE CLIENT
       ================================================================= */
    'fiche-client': {
      path: '/fiche-client', pageId: '259f1951-a2d4-4b90-ac83-0b3febe1d4ec', rootCheck: '#oropra-fiche-shell .fs-tabs',
      steps: [
        FIN('La fiche client', 'Je te montre la fiche du dernier client ouvert. Rien n’y est modifié.'),
        { target: { css: '#oropra-fiche-shell .fs-head' }, title: 'L’en-tête', body: 'Le nom, le téléphone, l’e-mail, le type (particulier ou société) et la ville. « B » ouvre le compte du client dans BACS quand il y est relié.' },
        { optional: true, target: { css: '#oropra-fiche-shell .fs-actions' }, title: 'Contacter', body: 'Appeler (par ton poste 3CX), WhatsApp, Email, SMS, RPV : chaque échange se range tout seul dans l’historique du client.' },
        { target: { css: '#oropra-fiche-shell .fs-tabs' }, title: 'Les onglets', body: 'Fiche client, Likes, Contacts, RDV, Véhicules, P. Commerciales, Entreprise (ou Interlocuteurs pour une société), Entourage, Historique client.' },
        { action: ficheOnglet('fiche'), optional: true, target: { css: '#oropra-fiche-shell .cf-cols' }, title: 'Fiche client', body: 'Identité, contact, adresse, profil, véhicule déclaré, commentaires. Le petit picto copie l’e-mail ou le portable. « Modifier la fiche » pour corriger.' },
        { optional: true, target: { css: '#oropra-fiche-shell .cs' }, title: 'Consentements', body: 'Reflétés de BACS, marque par marque (Toyota, Lexus) : l’état, la date et les huit canaux.' },
        { action: ficheOnglet('contacts'), optional: true, target: { css: '#oropra-fiche-shell .fs-pane[data-pane="contacts"]' }, title: 'Contacts', body: 'Tous les échanges du cycle en cours : appels (avec résumé), SMS, WhatsApp, e-mails, RPV, leads. En bas, les leads déjà clôturés.' },
        { action: ficheOnglet('rdv'), optional: true, target: { css: '#oropra-fiche-shell .fs-pane[data-pane="rdv"]' }, title: 'RDV', body: 'Les rendez-vous du client : à venir, en retard, passés, traités. « Ajouter un RDV » ouvre l’agenda sur ce client.' },
        { action: ficheOnglet('vehicules'), optional: true, target: { css: '#oropra-fiche-shell .fs-pane[data-pane="vehicules"]' }, title: 'Véhicules', body: 'Son parc : modèle, VIN (un clic le copie), mise en circulation, et ses factures atelier, quel que soit le site.' },
        { action: ficheOnglet('pcom'), optional: true, target: { css: '#oropra-fiche-shell .fs-pane[data-pane="pcom"]' }, title: 'P. Commerciales', body: 'Ses affaires : simulations et commandes BACS, version par version. Voir le tuto « Propositions commerciales ».' },
        { action: ficheOnglet('historique'), optional: true, target: { css: '#oropra-fiche-shell .fs-pane[data-pane="historique"]' }, title: 'Historique client', body: 'Ses cycles commerciaux, du premier contact au résultat : un clic ouvre les échanges du cycle.' },
        { action: ficheOnglet('fiche'), title: 'À retenir', body: 'La fiche est commune à tout le groupe : un client connu d’un autre site garde son historique.' },
      ],
    },

    'pcom': {
      path: '/fiche-client', pageId: '259f1951-a2d4-4b90-ac83-0b3febe1d4ec', rootCheck: '#oropra-fiche-shell .fs-tabs',
      steps: [
        { action: ficheOnglet('pcom'), target: { css: '#oropra-fiche-shell .fs-tab[data-tab="pcom"]' }, title: 'P. Commerciales', body: 'Le suivi commercial du client, affaire par affaire.' },
        { optional: true, target: { css: '#pcom-root .outils' }, title: 'Les filtres', body: 'VN ou VO, et le statut des affaires.' },
        { optional: true, target: { css: '#pcom-root .ln' }, title: 'Une affaire', body: 'Une intention d’achat : l’opportunité BACS avec ses simulations et ses commandes. Où on en est, depuis quand rien ne bouge, le montant de la commande.' },
        { optional: true, target: { css: '#pcom-root .plier, #pcom-root .vers' }, title: 'Les versions', body: 'Déplie une affaire : chaque version avec son écart de prix, celle qui est retenue, celles qui ont été refusées.' },
        { optional: true, target: { css: '#pcom-root .frise' }, title: 'Plus ancien', body: 'Au-delà de 12 mois, les affaires passent sur une frise.' },
        FIN('Créer ou modifier', 'Chez Team Colin, simulations et commandes se font dans BACS : elles remontent ici toutes seules. La loupe consulte un document, « B » l’ouvre dans BACS.'),
      ],
    },

    /* =================================================================
       BILATÉRALES
       ================================================================= */
    'bilaterales': {
      path: '/bilaterales', pageId: '7bfcfe73-4e89-40cf-bc84-1e07ddb478a6', rootCheck: '#bil-root .vs-next, #bil-root .bil-tab',
      steps: [
        FIN('Bilatérales', 'L’entretien régulier entre un vendeur et son chef des ventes. Je te montre la page.'),
        // Vendeur
        { requires: '#bil-root .vs-next', target: { css: '#bil-root .vs-next' }, title: 'Ma prochaine bilatérale', body: 'Planifiée par ton chef des ventes dans son agenda : elle apparaît ici et dans le tien, avec son ordre du jour.' },
        { requires: '#bil-root .vs-next', optional: true, target: { css: '#bil-root .prio-kpis' }, title: 'Mes engagements', body: 'La dernière bilatérale, les engagements en cours et ceux que tu as tenus.' },
        { requires: '#bil-root .vs-next', optional: true, target: { css: '#bil-root .vs-ch' }, title: 'Ce qui sera regardé', body: 'Tes chiffres du mois, les mêmes que ceux de ton chef : commandes, affaires à relancer, leads non contactés, RDV.' },
        // Chef des ventes et direction
        { requires: '#bil-root .bil-tab', target: { css: '#bil-root .bil-tab' }, title: 'Les onglets', body: 'Suivi de l’équipe, À recevoir en priorité, et Encadrement pour la direction.' },
        { requires: '#bil-root .bil-tab', optional: true, action: clic('#bil-root .bil-tab[data-tab="prio"]'), target: { css: '#bil-root .next-box, #bil-root .prio-head' }, title: 'À recevoir en priorité', body: 'Tes vendeurs classés par un score expliqué : écart à l’objectif, baisse de transformation, ancienneté de la dernière bilatérale, engagements non tenus.' },
        { requires: '#bil-root .bil-tab', optional: true, target: { css: '#bil-root .pr-plan, #bil-root .pq-plan' }, title: 'Planifier', body: 'Deux clics : la date, l’heure et l’ordre du jour (pastilles de points récurrents ou texte libre). « Mener maintenant » démarre l’entretien tout de suite.' },
        { requires: '#bil-root .bil-tab', optional: true, action: clic('#bil-root .bil-tab[data-tab="site"]'), target: { css: '#bil-root .bil-tab[data-tab="site"]' }, title: 'Suivi de l’équipe', body: 'La régularité de chacun : 1 bilatérale par semaine et par vendeur minimum.' },
        FIN('Pendant l’entretien', 'La fiche ouvre sur la revue des engagements, pré-remplit le bilan avec les chiffres, propose des engagements datés et chiffrés. Enregistre-la pendant l’entretien : la suivante est proposée d’un clic.'),
      ],
    },

    /* =================================================================
       DELCO (chef des ventes, direction)
       ================================================================= */
    'delco': {
      path: '/delco', pageId: 'da5005d5-42e4-4b37-9d42-f8b8728ddb0e', rootCheck: '#dp-root, #cp-root',
      steps: [
        FIN('Delco', 'L’assistant de One Data : il lit tes données et te signale ce qui mérite ton attention.'),
        { optional: true, target: { css: '#dp-root' }, title: 'Le brief', body: 'Les sujets du moment, regroupés : « 14 leads sans premier contact · 7 vendeurs ». Déplie un sujet pour le détail par vendeur ou par site.' },
        { optional: true, target: { css: '#dp-root svg' }, title: 'Le radar', body: 'Une bulle par sujet : la taille dit le volume, la distance au centre l’ancienneté du cas le plus vieux, la couleur la priorité.' },
        { optional: true, target: { css: '#cp-root' }, title: 'Le chat', body: 'Pose une question métier : Delco répond avec des chiffres justes. « Analyser » sur un sujet le lui envoie.' },
        FIN('Rien sans ton clic', 'Quand Delco propose un RDV ou un message, il affiche une carte « Valider / Ignorer » : rien n’est fait sans ton accord.'),
      ],
    },

    /* =================================================================
       SUIVI D'ACTIVITÉ (activite v16) — un écran par rôle
       ================================================================= */
    'act-vendeur': {
      path: '/activite', pageId: '55717966-7e07-4957-9969-399198cce1ad', rootCheck: '#act-root .rail',
      steps: [
        { action: ecran('vendeur'), target: { css: '#act-root .rail' }, title: 'Ma journée', body: 'Ton site et le filtre Tous, VN, VO, Pro.' },
        { optional: true, target: { css: '#act-root .band' }, title: 'L’essentiel', body: 'Une phrase (« 3 opportunités attendent une relance »), puis tes commandes du mois, tes relances en retard, tes opportunités actives et les jours ouvrés restants.' },
        { optional: true, target: { css: '#act-root [data-g="anneau"]' }, title: 'Commandes signées', body: 'Tes commandes du mois face à ton objectif.' },
        { optional: true, target: { css: '#act-root .card', has: 'carte de mes opportunités' }, title: 'La carte de mes opportunités', body: 'Une bulle par opportunité, de la taille de son montant, rangée par étape (commande, simulation, sans simulation) et par jours depuis la dernière activité. Dans la zone rouge : délai de relance dépassé.' },
        { optional: true, target: { css: '#act-root .card', has: 'Aujourd' }, title: 'Aujourd’hui', body: 'Tes actions du jour, la plus en retard d’abord : lead à contacter, opportunité à relancer. Un clic ouvre la fiche du client.' },
        FIN('À retenir', 'Délai de relance : 3 jours pour une simulation ou une commande, 7 jours pour une opportunité sans simulation.'),
      ],
    },

    'act-chef': {
      path: '/activite', pageId: '55717966-7e07-4957-9969-399198cce1ad', rootCheck: '#act-root .rail',
      steps: [
        FIN('Suivi d’activité', 'Un écran par question. Je te montre En direct, puis le Point du matin.'),
        { optional: true, target: { css: '#act-root .seg.ecrans' }, title: 'Les écrans', body: 'En direct, Point du matin, Site et, pour la direction, Groupe.' },
        { requires: aEcran('direct'), action: ecran('direct'), optional: true, target: { css: '#act-root .rail' }, title: 'En direct', body: 'La journée de la concession, pensée pour le téléphone : un jour (ou une période) au choix, comparé à la même heure il y a 7 jours. Il se met à jour tout seul chaque minute.' },
        { requires: aEcran('direct'), optional: true, target: { css: '#act-root .tuiles' }, title: 'Les tuiles du jour', body: 'Commandes, simulations, opportunités, leads, RDV, Pool : un clic filtre le fil de la journée sur ce type d’événement.' },
        { requires: aEcran('chef'), action: ecran('chef'), target: { css: '#act-root .rail' }, title: 'Point du matin', body: 'Avec qui, sur quoi, avec quel levier : la période (aujourd’hui, hier, 7 jours, ce mois) et le filtre VN, VO, Pro.' },
        { requires: aEcran('chef'), optional: true, target: { css: '#act-root .team' }, title: 'L’équipe', body: 'Un vendeur par onglet ; un nombre rouge signale ses opportunités bloquées.' },
        { requires: aEcran('chef'), optional: true, target: { css: '#act-root .band' }, title: 'Le vendeur choisi', body: 'Ses opportunités bloquées et la valeur en jeu, ce qui manque pour l’objectif, ses simulations en cours et la part de ses leads joints.' },
        { requires: aEcran('chef'), optional: true, target: { css: '#act-root .card', has: 'Opportunités qui bloquent' }, title: 'Opportunités qui bloquent', body: 'Par valeur en jeu, avec le levier proposé : « Ouvrir la fiche », ou « Note pour … » pour lui écrire sans quitter l’écran.' },
        { requires: aEcran('chef'), optional: true, target: { css: '#act-root .card', has: 'en un regard' }, title: 'L’équipe en un regard', body: 'Chaque vendeur placé selon son atteinte d’objectif et ses opportunités bloquées : à accompagner en priorité ceux qui cumulent les deux.' },
        { requires: aEcran('site'), action: ecran('site'), optional: true, target: { css: '#act-root .rail' }, title: 'Site', body: 'Le mois se joue-t-il, et où ça fuit : commandes, parcours opportunité → simulation → commande, pourquoi on perd, leads web, vendeurs côte à côte.' },
        FIN('À toi de jouer', 'Le matin : Point du matin, un vendeur après l’autre, une action chacun.'),
      ],
    },

    'act-direction': {
      path: '/activite', pageId: '55717966-7e07-4957-9969-399198cce1ad', rootCheck: '#act-root .rail',
      steps: [
        FIN('Suivi d’activité', 'Quel site, quel écart. Je te montre l’écran Groupe puis l’écran Site.'),
        { optional: true, target: { css: '#act-root .seg.ecrans' }, title: 'Les écrans', body: 'En direct, Point du matin, Site, Groupe.' },
        { requires: aEcran('groupe'), action: ecran('groupe'), optional: true, target: { css: '#act-root .band' }, title: 'Groupe', body: 'Les commandes du groupe face à l’objectif et la projection de fin de mois.' },
        { requires: aEcran('groupe'), optional: true, target: { css: '#act-root .card', has: 'Transformation et financement' }, title: 'Transformation et financement', body: 'Une bulle par site, de la taille de ses commandes ; un clic ouvre le site.' },
        { requires: aEcran('groupe'), optional: true, target: { css: '#act-root .card', has: 'mérite une question' }, title: 'Ce qui mérite une question', body: 'Les écarts détectés automatiquement entre les sites.' },
        { requires: aEcran('site'), action: ecran('site'), optional: true, target: { css: '#act-root .card', has: 'Parcours' }, title: 'Le parcours', body: 'Opportunités → simulées → commandes : ce qui passe chaque étape, ce qui s’y perd.' },
        { requires: aEcran('site'), optional: true, target: { css: '#act-root .card', has: 'Pourquoi on perd' }, title: 'Pourquoi on perd', body: 'Les motifs d’abandon des 90 derniers jours.' },
        { requires: aEcran('site'), optional: true, target: { css: '#act-root .card', has: 'côte à côte' }, title: 'Les vendeurs côte à côte', body: 'Appels, RDV, simulations, commandes de chacun sur la période.' },
        FIN('À retenir', 'Commandes : VN au jour de la transmission au constructeur, VO validées ou en attente d’approbation, hors grands comptes.'),
      ],
    },

    /* =================================================================
       PERFORMANCES — vue Leads
       ================================================================= */
    'perf-leads': {
      path: '/performances', pageId: '1499f15f-e8cb-4561-aea8-bdeeeb080b68', rootCheck: '[data-vue="leads"]',
      steps: [
        { action: async () => { const b = doc.querySelector('[data-vue="leads"]'); if (b && !b.classList.contains('on')) { b.click(); await sleep(1500); } }, target: { css: '[data-vue="leads"]' }, title: 'La vue Leads', body: 'Les indicateurs du lead management, sur la période et le périmètre choisis. Le menu Leads › Leads performances y mène directement.' },
        { optional: true, target: { css: '.pl-root .pl-tiles' }, title: 'Six chiffres clés', body: 'Leads reçus, contactés, délai du premier contact (médian), part dans le délai, rendez-vous, commandes, avec leur tendance.' },
        { optional: true, target: { css: '.pl-root .pl-card', has: 'Du lead à la commande' }, title: 'Du lead à la commande', body: 'Chaque étape et ce qu’elle garde de la précédente.' },
        { optional: true, target: { css: '.pl-root .pl-card', has: 'rapidité paie' }, title: 'La rapidité paie', body: 'Ce que deviennent les leads selon le temps mis à les contacter.' },
        { optional: true, target: { css: '.pl-root .pl-card', has: 'Quand arrivent' }, title: 'Quand arrivent les leads', body: 'Par jour et par heure : de quoi caler les présences.' },
        { optional: true, target: { css: '.pl-root .pl-card', has: 'Par vendeur' }, title: 'Par vendeur', body: 'Leads, contactés, délai médian, dans le délai (vert au-delà de 80 %), RDV, commandes. Aussi par source, par site et pour la Vroom Team.' },
        { action: async () => { const b = doc.querySelector('[data-vue="ventes"]'); if (b) b.click(); }, title: 'Retour aux ventes', body: '« Ventes » ramène aux commandes face aux objectifs.' },
      ],
    },

    'tdb': {
      pageId: ACCUEIL, rootCheck: '#dash-root .dpouls',
      fin: () => { const f = doc.querySelector('#dash-root #dash-tiroir [data-role="fermer"]'); if (f) f.click(); },
      steps: [
        { target: { css: '#dash-root .drail' }, title: 'Ton tableau de bord', body: 'Il s’adapte à ton rôle : vendeur, chef des ventes, direction ou marketing. Le titre et l’étiquette à droite le disent.' },
        { target: { css: '#dash-root .dmois' }, title: 'Le mois', body: 'Le mois en cours et les deux précédents. Si le mois en cours n’a encore aucune commande, un bandeau le signale.' },
        { target: { css: '#dash-root .dband' }, title: 'Le constat', body: 'La question de ton rôle (« Qui appeler aujourd’hui », « Qui décroche, et sur quoi »…) et une phrase qui y répond.' },
        { target: { css: '#dash-root .dpouls' }, title: 'Le pouls', body: 'Quatre chiffres à lire d’abord.' },
        { target: { css: '#dash-root .dfams' }, title: 'Les familles', body: 'Production, leads, affaires, livraisons, leviers, agenda ou stock selon ton rôle : une tuile par question.' },
        { target: { css: '#dash-root .dtuile[data-id]' }, title: 'Une tuile', body: 'Le chiffre, et dessous son évolution. Un clic ouvre le détail juste sous la famille.' },
        { action: () => { const t = doc.querySelector('#dash-root .dtuile[data-id="v_leads"], #dash-root .dtuile[data-id="c_cdes"], #dash-root .dtuile[data-id="d_cdes"], #dash-root .dtuile[data-id="m_recus"]') || doc.querySelector('#dash-root .dtuile[data-id]'); if (t && t.getAttribute('aria-expanded') !== 'true') t.click(); },
          target: { css: '#dash-root #dash-tiroir .dtiroir' }, title: 'Le détail', body: 'Le tableau, la liste ou l’évolution derrière le chiffre. « Refermer » ou un second clic sur la tuile le ferme.' },
        { optional: true, target: { css: '#dash-root #dash-tiroir .dtrouve' }, title: 'Ce qu’il faut en faire', body: 'La conduite à tenir, en une phrase.' },
        { optional: true, target: { css: '#dash-root #dash-tiroir .dlead' }, title: 'Ouvrir un lead', body: 'Dans « Jamais contactés », « Ouvrir » t’emmène sur Lead management, fiche ouverte.' },
        { optional: true, target: { css: '#dash-root .dperim' }, title: 'Le périmètre', body: 'Tout ton périmètre, un réseau, une affaire ou un site. Choisir un site change aussi le site de la barre du haut.' },
        { target: { css: '#dash-root .dpied' }, title: 'La fraîcheur', body: 'Les chiffres se rafraîchissent toutes les 2 minutes.' },
      ],
    },

    'tdb-plateau': {
      pageId: ACCUEIL, rootCheck: '#dash-root .pl-sec',
      steps: [
        { target: { css: '#dash-root .drail' }, title: 'Le tableau du plateau', body: 'Le tien, pas celui d’un vendeur : où en est la piscine, ce que tu as fait aujourd’hui, ce que deviennent nos transferts.' },
        { target: { css: '#dash-root .dband' }, title: 'Ta journée', body: 'Leads à traiter, rappels dus, ce que tu as pris et transmis, transferts qui attendent un vendeur.' },
        { target: { css: '#dash-root .pl-sec' }, title: 'La piscine, maintenant', body: 'Leads à traiter, rappels dus, transferts non pris au-delà de 2 h, stock accepté depuis plus de 14 jours, trafic atelier, âge de la copie BACS.' },
        { target: { css: '#dash-root .pl-sec ~ .pl-sec' }, title: 'Aujourd’hui', body: 'Tes leads pris, transmis, mis en rappel, abandonnés, face au total du plateau ; ton délai de prise médian.' },
        { optional: true, target: { css: '#dash-root .pl-graph' }, title: 'Le plateau sur 14 jours', body: 'Par jour : qualifiés, rappels, abandonnés (colonnes) et pris (trait bleu). Survole une colonne pour le détail.' },
        { optional: true, target: { css: '#dash-root .pl-ligne' }, title: 'Sur 30 jours', body: 'Leads pris, délai de prise médian, part prise en moins d’une heure, qualifiés, abandonnés, taux de qualification, chefs relancés.' },
        { optional: true, target: { css: '#dash-root .pl-deux ~ .pl-deux' }, title: 'Transferts et opérateurs', body: 'Ce que deviennent les leads qualifiés, site par site ; puis les gestes de chaque opérateur. Les comptes VROOM partagés de BACS sont sur une ligne à part.' },
        { target: { css: '#dash-root .dpied' }, title: 'À retenir', body: 'L’activité additionne l’historique BACS des comptes VROOM et tes gestes dans One Data.' },
      ],
    },

    /* =================================================================
       GESTION DES VENTES (kanban v82)
       ================================================================= */
    'gestion-ventes': {
      pageId: '9e90d49a-215f-4c2b-b2bb-2d7c4f9aabd6',
      rootCheck: '#kanban-root .kan-board',
      fin: () => { const m = doc.querySelector('#kanban-root .kc-menu'); if (m) { const b = doc.querySelector('#kanban-root .kc-card .kc-move'); if (b) b.click(); } },
      steps: [
        { title: 'Gestion des ventes', body: 'Ton pipe commercial, de la simulation à la commande validée. Je te montre l’essentiel en une minute.' },
        { target: { css: '#kanban-root .k-vend, #kanban-root .k-vend-sel, #kanban-root #kan-perim' }, title: 'Qui est affiché', body: 'Vendeur : tes affaires. Chef des ventes : choisis un vendeur de ton site. Direction : réseau, affaire, site, puis vendeur.' },
        { target: { css: '#kanban-root .k-dates' }, title: 'La période', body: 'Le mois en cours à chaque arrivée sur la page. Un clic sur la date de début, un clic sur la date de fin.' },
        { target: { css: '#kanban-root .k-filters' }, title: 'Les filtres', body: 'VN ou VO, particuliers ou sociétés, financement ou comptant.' },
        { target: { css: '#kanban-root .kan-board' }, title: 'Le pipe', body: 'Cinq colonnes : Simulations, Commandes, Demande d’approbation, Transmis TFR / Validée, Abandonné.' },
        { target: { css: '#kanban-root [data-col="propale"] .kc-head' }, title: 'L’en-tête d’une colonne', body: 'Le nombre d’affaires (et de documents), le montant total, et le taux de passage depuis la colonne précédente.' },
        { optional: true, target: { css: '#kanban-root .kc-card' }, title: 'Une affaire', body: 'Liseré vert pour un VN, jaune pour un VO. En haut, le statut BACS : Éditée, Approbation lancée, Refusée, Transmise à TFR, Validée, Livrée.' },
        { optional: true, target: { css: '#kanban-root .kc-card .kc-cli-link' }, title: 'Le client', body: 'Ouvre sa fiche client, onglet Propositions commerciales.' },
        { optional: true, target: { css: '#kanban-root .kc-card .k-age' }, title: 'L’âge', body: 'Vert jusqu’à 7 jours, orange jusqu’à 21, rouge au-delà : une affaire qui traîne.' },
        { optional: true, target: { css: '#kanban-root .kc-vers' }, title: 'Les versions', body: 'Une affaire hors BACS peut avoir plusieurs versions de proposition : dépliez-les pour choisir celle qui compte.' },
        { optional: true, target: { css: '#kanban-root .kc-plural' }, title: 'Plusieurs documents', body: 'Une affaire BACS avec plusieurs simulations ou commandes : un clic pour choisir laquelle consulter.' },
        { optional: true, target: { css: '#kanban-root .kc-veh-link' }, title: 'La fiche VO', body: 'Sur un VO, le véhicule ouvre sa fiche : identité, photos, factures atelier.' },
        { optional: true, target: { css: '#kanban-root .kc-card .kc-actions' }, title: 'Les actions', body: 'Loupe : consulter. Crayon : modifier. Corbeille : archiver ou abandonner (Simulations et Commandes). « B » : ouvrir dans BACS.' },
        { optional: true, target: { css: '#kanban-root .kc-card .kc-move' }, title: 'Déplacer', body: 'Ou glisse-dépose la carte. Une affaire BACS ne passe ici que de Simulations à Commandes : la suite se fait dans BACS. Transmis et Abandonné sont réservés aux managers.' },
        FIN('À toi de jouer', 'Rien n’a été déplacé pendant la visite.'),
      ],
    },

    /* =================================================================
       PERFORMANCES (performances v31, vue Ventes, profil Team Colin)
       ================================================================= */
    'performances': {
      pageId: '1499f15f-e8cb-4561-aea8-bdeeeb080b68',
      rootCheck: '#perf-root .pf-bar',
      fin: () => { const x = doc.querySelector('#perf-drawer .pfd-x'); if (x) x.click(); },
      steps: [
        { action: async () => { const b = doc.querySelector('[data-vue="ventes"]'); if (b && !b.classList.contains('on')) { b.click(); await sleep(900); } }, title: 'Performances', body: 'Ton réalisé face aux objectifs du reporting commandes (vue Ventes). Je te montre la page.' },
        { target: { css: '#perf-root #pf-range' }, title: 'La période', body: 'Du 1er du mois à aujourd’hui à chaque arrivée. Sur plusieurs mois, des pastilles permettent de lire un mois ou le cumul.' },
        { target: { css: '#perf-root .pf-toggle:has([data-vnvo])' }, title: 'Le type', body: 'Tous, VN, VO ou VN/VO.' },
        { optional: true, target: { css: '#perf-root .pf-toggle:has([data-seg])' }, title: 'L’activité', body: 'Réseau (par défaut, hors grands comptes), Grands comptes, ou Tous.' },
        { optional: true, target: { css: '#perf-root .pf-toggle:has([data-vuetc])' }, title: 'La vue', body: 'Pilotage : les indicateurs à objectif. Mix produit : VD/VK, Pack Premium, reprises, accessoires.' },
        { target: { css: '#perf-root .pf-resume' }, title: 'Le mois écoulé', body: 'La part des jours ouvrés (lundi à samedi) déjà passés. C’est elle qui donne les couleurs.' },
        { optional: true, target: { css: '#perf-root .pf-sel-banner' }, title: 'Le périmètre affiché', body: 'La ligne choisie dans l’arbre ; « ✕ » revient à tout le périmètre.' },
        { optional: true, target: { css: '#perf-root .pf-shead + .pf-kpi-grid, #perf-root .pf-kpi-grid' }, title: 'Les objectifs', body: 'Cde, Cde part., Cde pro, FI, PHEV / EV, VU, Kinto, Arval : réalisé sur objectif du mois. Vert si l’atteinte suit le mois écoulé, orange un peu en dessous, rouge loin derrière, gris sans objectif.' },
        { optional: true, target: { css: '#perf-root .pf-kpi-grid .pf-kpi' }, title: 'Une tuile', body: 'Le réalisé compte vendeurs et encadrement ; la mention « dont … » le précise. L’objectif FI vaut la moitié des commandes hors loueurs.' },
        { optional: true, target: { css: '#perf-root .pf-kpi-sub + .pf-kpi-grid' }, title: 'Mix et équipement', body: 'LOA / Easy, Roole, VD/VK, Pack Premium, reprises, accessoires : en % des commandes.' },
        { optional: true, target: { css: '#perf-root .pf-card:has(#pf-c1)' }, title: 'Réalisé vs objectif', body: 'Les indicateurs à objectif, côte à côte.' },
        { optional: true, target: { css: '#perf-root .pf-card:has(#pf-c2)' }, title: 'L’atteinte', body: 'Par réseau, affaire, site ou vendeur : chacun jugé sur son propre objectif.' },
        { optional: true, target: { css: '#perf-root .pf-card:has(#pf-c4)' }, title: 'Le taux d’équipement', body: 'Chaque indicateur en % des commandes.' },
        { optional: true, target: { css: '#perf-root .pf-tree' }, title: 'Le périmètre', body: 'Réseau, affaire, site, type, vendeur, et une ligne Encadrement. Un clic sur une ligne filtre la page ; un site devient le site global.' },
        { optional: true, target: { css: '#perf-root .pf-tree tr.is-moi' }, title: 'Toi', body: 'Ta ligne, marquée « vous », au milieu de ton équipe.' },
        { optional: true, target: { css: '#perf-root .pf-tree .td-reste' }, title: 'Reste à faire', body: 'Les commandes qui manquent pour atteindre l’objectif, ou « atteint +N ». Les plus en retard sont en tête.' },
        { optional: true, action: async () => {
            const vu = () => [...doc.querySelectorAll('#perf-root .pf-tree tr.lv-vendeur:not([data-key="__encadrement"]) .pf-c[data-kpi-click]')].some(n => n.getClientRects().length);
            for (const niv of ['lv-reseau', 'lv-affaire', 'lv-site', 'lv-type']) {
              if (vu()) break;
              const e = doc.querySelector('#perf-root .pf-tree tr.' + niv + ' .pf-exp');
              if (e && /▶/.test(e.textContent)) { e.click(); await sleep(200); }
            }
          }, target: { css: '#perf-root .pf-tree tr.lv-vendeur:not([data-key="__encadrement"]) .pf-c[data-kpi-click]' }, title: 'Un chiffre = le détail', body: 'Je clique pour toi : les commandes derrière ce chiffre.' },
        { optional: true, action: clic('#perf-root .pf-tree tr.lv-vendeur:not([data-key="__encadrement"]) .pf-c[data-kpi-click]'), target: { css: '#perf-drawer .pfd' }, title: 'Les commandes', body: 'Statut BACS, client, véhicule, montant, âge ; la pastille de l’indicateur cliqué ressort. La loupe consulte la commande, « B » l’ouvre dans BACS.' },
        { action: () => { const x = doc.querySelector('#perf-drawer .pfd-x'); if (x) x.click(); }, target: { css: '#perf-root #pf-cmp-toggle' }, title: 'Comparer', body: 'Active-le, puis clique deux lignes de l’arbre : tous les indicateurs côte à côte.' },
        { optional: true, target: { css: '#perf-root #pf-export' }, title: 'Exporter', body: 'Le périmètre affiché dans un fichier Excel.' },
      ],
    },

    /* =================================================================
       OBJECTIFS (objectifs v11, profil Team Colin)
       ================================================================= */
    'objectifs': {
      pageId: 'c9b4f9a6-460a-4365-8a06-95e30a13cbdb',
      rootCheck: '#obj-root .obj-hero, #obj-root .obj-tree, #obj-root .obj-cards',
      steps: [
        { title: 'Objectifs', body: 'Les objectifs du mois et ton rythme. La page s’adapte : tableau de marche pour le vendeur, saisie pour le chef des ventes.' },
        { target: { css: '#obj-root .obj-bar' }, title: 'Le mois', body: 'Année, mois, et VN + VO, VN ou VO.' },
        // Vendeur
        { requires: '#obj-root .obj-hero', target: { css: '#obj-root .obj-hero' }, title: 'Ton mois', body: 'Les jours ouvrés écoulés et la part du mois déjà passée.' },
        { requires: '#obj-root .obj-hero', target: { css: '#obj-root .obj-cards' }, title: 'Tes indicateurs', body: 'Commandes particuliers, commandes pro, PHEV / EV, VU, Kinto, Arval.' },
        { requires: '#obj-root .obj-hero', target: { css: '#obj-root .obj-cards > .obj-card' }, title: 'Une carte', body: 'Le rythme (dans les temps, léger retard, en retard), ton réalisé sur l’objectif, la barre avec le trait bleu du mois écoulé, et la cadence pour finir dans les temps.' },
        // Chef des ventes et direction
        { requires: '#obj-root table.obj-tree', optional: true, target: { css: '#obj-root .obj-repart' }, title: 'L’atelier', body: 'Pour définir les objectifs du périmètre choisi dans l’arbre (tout le périmètre par défaut). Je le déplie pour toi.' },
        { requires: '#obj-root table.obj-tree', optional: true, action: () => { if (!doc.querySelector('#obj-root div.obj-cap')) { const h = doc.querySelector('#obj-root .obj-repart > div:first-child'); if (h) { h.click(); win.__odtObjOuvert = true; } } },
          target: { css: '#obj-root div.obj-cap' }, title: 'Le cap d’équipe', body: 'La cible de commandes, puis pour chaque indicateur un taux pré-rempli avec celui du mois précédent, qui donne la cible d’équipe.' },
        { requires: '#obj-root table.obj-tree', optional: true, target: { css: '#obj-root select.obj-mode' }, title: 'Répartir', body: 'À la main, équitablement, au prorata du réalisé du mois précédent, ou selon les jours de présence ; puis « Répartir ».' },
        { requires: '#obj-root table.obj-tree', optional: true, target: { css: '#obj-root #obj-balpill' }, title: 'L’équilibre', body: 'Réparti sur la cible : vert pile, bleu s’il reste à distribuer, orange en dépassement.' },
        { requires: '#obj-root table.obj-tree', optional: true, target: { css: '#obj-root .obj-reconduire' }, title: 'Reconduire le mois précédent', body: 'Recharge les objectifs du mois dernier comme point de départ.' },
        { requires: '#obj-root table.obj-tree', optional: true, target: { css: '#obj-root .obj-repart .obj-save' }, title: 'Enregistrer', body: 'Rien n’est visible des vendeurs avant ce clic. « Réinitialiser » annule le brouillon.' },
        { requires: '#obj-root table.obj-tree', target: { css: '#obj-root table.obj-tree' }, title: 'L’arbre', body: 'Réseau, affaire, site, vendeur : Cde part., Cde pro, PHEV / EV, VU, Kinto, Arval. Un clic sur un site le choisit pour l’atelier ; un clic sur un chiffre d’un vendeur le corrige (en bleu une fois modifié).' },
        { requires: '#obj-root table.obj-tree', optional: true, target: { css: '#obj-root .obj-tree tfoot' }, title: 'Le total', body: 'Le total du périmètre affiché.' },
        { requires: () => !!doc.querySelector('#obj-root .obj-cards') && !doc.querySelector('#obj-root .obj-hero'), optional: true, target: { css: '#obj-root .obj-cards' }, title: 'Sur téléphone', body: 'Une carte par vendeur, à saisir directement ; « Enregistrer les objectifs » en bas.' },
        { action: () => { if (win.__odtObjOuvert) { win.__odtObjOuvert = false; const h = doc.querySelector('#obj-root .obj-repart > div:first-child'); if (h && doc.querySelector('#obj-root div.obj-cap')) h.click(); } }, title: 'À toi de jouer', body: 'Rien n’a été modifié pendant la visite.' },
      ],
    },
  };

  /* ===================== CIBLAGE ===================== */
  function visible(n) { return n && n.isConnected && n.getClientRects().length > 0 && (n.offsetParent !== null || getComputedStyle(n).position === 'fixed'); }
  function resolveTarget(t) {
    if (!t) return null;
    try {
      if (t.css) {
        // Premier élément VISIBLE parmi ceux qui correspondent ; avec « has »,
        // le premier dont le texte contient « has » (casse ignorée).
        const all = doc.querySelectorAll(t.css), h = t.has ? String(t.has).toLowerCase() : null;
        for (const n of all) if (visible(n) && (!h || (n.textContent || '').replace(/\s+/g, ' ').toLowerCase().indexOf(h) !== -1)) return n;
        return null;
      }
      if (t.tour) return doc.querySelector('[data-tour="' + t.tour + '"]');
      if (t.text) {
        const q = t.text.toLowerCase();
        const clickable = doc.querySelectorAll('button,a,[role="button"],input[type="button"],input[type="submit"]');
        let best = null;
        clickable.forEach(n => {
          const s = (n.textContent || n.value || '').trim().toLowerCase();
          if (s && s.indexOf(q) !== -1 && visible(n)) {
            if (!best || s.length < (best.textContent || best.value || '').trim().length) best = n;
          }
        });
        if (best) return best;
        const all = doc.querySelectorAll('span,div,p,label,h1,h2,h3');
        for (const n of all) {
          const s = (n.textContent || '').trim().toLowerCase();
          if (s && s.indexOf(q) !== -1 && s.length < 60 && visible(n)) return n;
        }
        return null;
      }
    } catch (e) {}
    return null;
  }
  function runAction(a) {
    try {
      if (typeof a === 'function') return a(doc);
      if (a && a.click) { const n = doc.querySelector(a.click); if (n) n.click(); }
    } catch (e) {}
    return null;
  }
  function garde(r) {
    try { return typeof r === 'function' ? !!r(doc) : !!doc.querySelector(r); } catch (e) { return false; }
  }

  /* ===================== UI ===================== */
  let catcher, hl, tip, tipTitle, tipBody, tipStep, btnPrev, btnNext;
  let tour = null, idx = 0, curNode = null, jeton = 0, veille = null;

  function injectCSS() {
    if (doc.getElementById('odt-css')) return;
    const css = `
.odt-catcher{position:fixed;inset:0;z-index:2147482999;background:transparent;}
.odt-hl{position:fixed;z-index:2147483000;border-radius:10px;border:2px solid #53bda7;
  box-shadow:0 0 0 100vmax rgba(28,43,69,.55),0 0 0 4px rgba(83,189,167,.5);pointer-events:none;transition:all .2s ease;display:none;}
.odt-tip{position:fixed;z-index:2147483002;background:#fff;color:#1c2b45;border-radius:14px;padding:16px 18px;
  max-width:340px;width:calc(100vw - 32px);box-shadow:0 16px 40px rgba(28,43,69,.28);
  font-family:'Nunito Sans',-apple-system,Segoe UI,Roboto,sans-serif;display:none;}
.odt-tip h4{margin:0 14px 6px 0;font-size:16px;font-weight:800;color:#1F4A85;}
.odt-tip p{margin:0;font-size:14px;line-height:1.5;color:#41506b;}
.odt-foot{display:flex;align-items:center;justify-content:space-between;margin-top:14px;gap:10px;}
.odt-step{font-size:12px;color:#8895ad;}
.odt-btns{display:flex;gap:8px;}
.odt-btn{border:none;border-radius:9px;padding:8px 14px;font:inherit;font-weight:700;font-size:14px;cursor:pointer;}
.odt-prev{background:#eef1f7;color:#41506b;}
.odt-next{background:#2a5ea9;color:#fff;}
.odt-next:disabled{opacity:.6;cursor:default;}
.odt-quit{position:absolute;top:10px;right:12px;background:none;border:none;font-size:18px;line-height:1;color:#8895ad;cursor:pointer;}
.od-tour-btn,.odt-launch-btn{display:inline-flex;align-items:center;gap:7px;background:#2a5ea9;color:#fff;border:none;border-radius:10px;
  padding:9px 16px;font-family:'Nunito Sans',-apple-system,Segoe UI,Roboto,sans-serif;font-weight:700;font-size:14px;cursor:pointer;}
.od-tour-btn:hover,.odt-launch-btn:hover{background:#1f4a87;}
`;
    const st = doc.createElement('style'); st.id = 'odt-css'; st.innerHTML = css;
    (doc.head || doc.documentElement).appendChild(st);
    if (!doc.getElementById('odt-font')) {
      const l = doc.createElement('link'); l.id = 'odt-font'; l.rel = 'stylesheet';
      l.href = 'https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;700;800&display=swap';
      (doc.head || doc.documentElement).appendChild(l);
    }
  }

  function buildUI() {
    injectCSS();
    ['odt-catcher', 'odt-hl-el', 'odt-tip'].forEach(id => { const n = doc.getElementById(id); if (n) n.remove(); });
    catcher = doc.createElement('div'); catcher.className = 'odt-catcher'; catcher.id = 'odt-catcher';
    catcher.addEventListener('click', e => { e.preventDefault(); e.stopPropagation(); });
    catcher.addEventListener('mousedown', e => { e.preventDefault(); e.stopPropagation(); });
    hl = doc.createElement('div'); hl.className = 'odt-hl'; hl.id = 'odt-hl-el';
    tip = doc.createElement('div'); tip.className = 'odt-tip'; tip.id = 'odt-tip';
    tip.setAttribute('role', 'dialog'); tip.setAttribute('aria-live', 'polite');
    tip.innerHTML = '<button class="odt-quit" aria-label="Quitter la visite">×</button>' +
      '<h4></h4><p></p>' +
      '<div class="odt-foot"><span class="odt-step"></span>' +
      '<div class="odt-btns"><button class="odt-btn odt-prev">Précédent</button>' +
      '<button class="odt-btn odt-next">Suivant</button></div></div>';
    tipTitle = tip.querySelector('h4'); tipBody = tip.querySelector('p'); tipStep = tip.querySelector('.odt-step');
    btnPrev = tip.querySelector('.odt-prev'); btnNext = tip.querySelector('.odt-next');
    tip.querySelector('.odt-quit').addEventListener('click', end);
    btnPrev.addEventListener('click', () => go(idx - 1, -1));
    btnNext.addEventListener('click', () => (idx >= tour.steps.length - 1 ? end() : go(idx + 1, 1)));
    doc.body.appendChild(catcher); doc.body.appendChild(hl); doc.body.appendChild(tip);
    win.__odtReposition = reposition;
    if (!win.__odtScrollBound) {
      win.__odtScrollBound = true;
      win.addEventListener('scroll', () => { if (win.__odtReposition) win.__odtReposition(); }, true);
      win.addEventListener('resize', () => { if (win.__odtReposition) win.__odtReposition(); });
    }
    if (!win.__odtKeyBound) {
      win.__odtKeyBound = true;
      doc.addEventListener('keydown', e => {
        if (!win.__odtActif) return;
        if (e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); win.__odtActif.next(); }
        else if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); win.__odtActif.prev(); }
      }, true);
    }
  }

  function show() {
    catcher.style.display = 'block'; tip.style.display = 'block';
    clearInterval(veille);
    // La page se redessine (rechargement, données arrivées) : on retrouve la cible.
    veille = setInterval(() => { if (!tour) { clearInterval(veille); return; } if (curNode && !curNode.isConnected) reposition(); }, 400);
  }
  function hide() { if (catcher) catcher.style.display = 'none'; if (tip) tip.style.display = 'none'; if (hl) hl.style.display = 'none'; clearInterval(veille); }

  async function go(i, dir) {
    if (!tour) return;
    dir = dir || 1;
    if (i < 0) i = 0;
    if (i > tour.steps.length - 1) { end(); return; }
    idx = i; const step = tour.steps[idx]; const mon = ++jeton;
    btnNext.disabled = true;
    // v6 : rien ne s'affiche tant que la cible de l'étape n'est pas trouvée —
    // plus de bulle au texte neuf posée sur la zone de l'étape précédente, ni
    // d'étape facultative qui s'affiche puis disparaît.
    curNode = null; hl.style.display = 'none'; tip.style.visibility = 'hidden';
    const afficher = () => {
      tipTitle.textContent = step.title || '';
      tipBody.textContent = step.body || '';
      tipStep.textContent = (idx + 1) + ' / ' + tour.steps.length;
      btnPrev.style.visibility = idx === 0 ? 'hidden' : 'visible';
      btnNext.textContent = idx >= tour.steps.length - 1 ? 'Terminer' : 'Suivant';
      btnNext.disabled = false; tip.style.visibility = 'visible';
    };
    if (step.action) { try { await runAction(step.action); } catch (e) {} }
    if (mon !== jeton || !tour) return;
    const limite = step.optional ? 2500 : 4000, t0 = Date.now();
    (function find() {
      if (mon !== jeton || !tour) return;
      const node = step.target ? resolveTarget(step.target) : null;
      if (node) {
        curNode = node; afficher();
        try { node.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) {}
        reposition(); setTimeout(reposition, 360);
      } else if (step.target && Date.now() - t0 < limite) { setTimeout(find, 200); }
      else if (step.target && step.optional) {
        // Cible absente : l'étape ne concerne pas cet écran, on passe.
        const j = idx + dir;
        if (j >= 0 && j <= tour.steps.length - 1) go(j, dir);
        else if (j < 0) go(idx + 1, 1);
        else { curNode = null; afficher(); centerTip(); }
      } else { curNode = null; afficher(); centerTip(); }
    })();
  }

  function reposition() {
    if (!tour || !tip) return;
    if (curNode && !curNode.isConnected) { const st = tour.steps[idx]; curNode = (st && st.target) ? resolveTarget(st.target) : null; }
    if (curNode && visible(curNode)) {
      const r = curNode.getBoundingClientRect();
      hl.style.display = 'block';
      hl.style.left = (r.left - 6) + 'px'; hl.style.top = (r.top - 6) + 'px';
      hl.style.width = (r.width + 12) + 'px'; hl.style.height = (r.height + 12) + 'px';
      positionTipNear(r);
    } else { hl.style.display = 'none'; centerTip(); }
  }

  function positionTipNear(r) {
    const tw = tip.offsetWidth, th = tip.offsetHeight, m = 12, W = win.innerWidth, H = win.innerHeight;
    let top, left;
    if (r.bottom + m + th <= H - m) { top = r.bottom + m; left = r.left; }           // dessous
    else if (r.top - th - m >= m) { top = r.top - th - m; left = r.left; }           // dessus
    else if (r.left - tw - m >= m) { left = r.left - tw - m; top = Math.min(Math.max(m, r.top), H - th - m); }   // à gauche (panneau à droite)
    else if (r.right + m + tw <= W - m) { left = r.right + m; top = Math.min(Math.max(m, r.top), H - th - m); }  // à droite
    else { top = H - th - m; left = (W - tw) / 2; }                                    // en bas de l'écran
    if (left + tw > W - m) left = W - tw - m;
    if (left < m) left = m;
    tip.style.left = left + 'px'; tip.style.top = top + 'px';
  }
  function centerTip() {
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    tip.style.left = Math.max(12, (win.innerWidth - tw) / 2) + 'px';
    tip.style.top = Math.max(12, (win.innerHeight - th) / 2) + 'px';
  }

  /* ===================== API ===================== */
  function start(tourId) {
    const def = TOURS[tourId];
    if (!def || !def.steps || !def.steps.length) return;
    if (tour) end();
    buildUI();
    const eff = def.steps.filter(s => !s.requires || garde(s.requires));
    tour = { id: tourId, def, steps: eff.length ? eff : def.steps.slice() };
    idx = 0; curNode = null;
    win.__odtActif = { next: () => { if (!btnNext.disabled) btnNext.click(); }, prev: () => btnPrev.click() };
    show(); go(0, 1);
  }
  function end() {
    const t = tour;
    tour = null; curNode = null; jeton++; hide(); win.__odtActif = null;
    try { win.localStorage.removeItem('onedata_pending_tour'); } catch (e) {}
    if (t && t.def && typeof t.def.fin === 'function') { try { t.def.fin(doc); } catch (e) {} }
  }
  // Navigation ÉDITEUR vs PROD — même patron éprouvé que la top nav :
  //  - ÉDITEUR : par UID (vrai SPA interne, aucune imbrication d'éditeur).
  //  - PROD    : par CHEMIN /fr/xxx. Un UID en prod s'inscrit tel quel dans l'URL
  //              -> route inexistante -> PAGE BLANCHE (bug constaté).
  const LANG_PREFIX = '/fr';
  const PAGE_PATHS = {            // pageId -> chemin (table alignée sur la top nav)
    'f84d6f00-de35-45b9-ae23-c1f1e46bfa69': '/accueil',
    '9e90d49a-215f-4c2b-b2bb-2d7c4f9aabd6': '/pipe-commercial',
    '99519997-f935-471a-9147-b0118191b991': '/marketing',
    '55717966-7e07-4957-9969-399198cce1ad': '/activite',
    '7bfcfe73-4e89-40cf-bc84-1e07ddb478a6': '/bilaterales',
    'da5005d5-42e4-4b37-9d42-f8b8728ddb0e': '/delco',
    '259f1951-a2d4-4b90-ac83-0b3febe1d4ec': '/fiche-client',
    '1499f15f-e8cb-4561-aea8-bdeeeb080b68': '/performances',
    'c9b4f9a6-460a-4365-8a06-95e30a13cbdb': '/objectifs',
  };
  function inEditor() {
    try { return (window.self !== window.top) || /-editor\.weweb\.io|weweb\.io/i.test(location.hostname); }
    catch (e) { return true; }
  }
  function goToTourPage(t) {
    if (inEditor()) {
      if (t.pageId) {
        try { wwLib.wwApp.goTo(t.pageId); return true; } catch (e) {}
        try { wwLib.goTo(t.pageId); return true; } catch (e) {}
      }
      return false;
    }
    const path = t.path || PAGE_PATHS[t.pageId];
    if (path) {
      const href = LANG_PREFIX + path;
      try { wwLib.goTo(href); return true; } catch (e) {}
      try { win.location.href = href; return true; } catch (e) {}
    }
    return false;
  }

  function launch(tourId) {
    const t = TOURS[tourId]; if (!t) return;
    if (t.rootCheck && doc.querySelector(t.rootCheck)) { start(tourId); return; }
    try { win.localStorage.setItem('onedata_pending_tour', tourId); } catch (e) {}
    if (goToTourPage(t)) { attendre(tourId); return; }
    if (t.page) { win.location.href = t.page + '?tour=' + encodeURIComponent(tourId); return; }
    start(tourId);
  }
  window.OneDataTour = { start, launch, end, tours: TOURS };

  /* ===== Délégation : tout [data-tour-launch="ID"] lance la visite ID ===== */
  win.__odtLaunch = launch;
  if (!win.__odtLaunchBound) {
    win.__odtLaunchBound = true;
    doc.addEventListener('click', function (e) {
      const b = e.target.closest && e.target.closest('[data-tour-launch]');
      if (b && win.__odtLaunch) { e.preventDefault(); e.stopPropagation(); win.__odtLaunch(b.getAttribute('data-tour-launch')); }
    }, true);
  }

  /* ===================== AUTO-DÉMARRAGE ===================== */
  // Le module est monté une fois (header partagé) : après une navigation SPA,
  // on attend que la page de la visite soit prête.
  function attendre(id) {
    const t = TOURS[id]; if (!t) return;
    let waited = 0;
    (function ready() {
      if (tour) return;
      let pend = null; try { pend = win.localStorage.getItem('onedata_pending_tour'); } catch (e) {}
      if (pend !== id) return;
      const ok = t.rootCheck ? !!doc.querySelector(t.rootCheck) : true;
      if (ok) { try { win.localStorage.removeItem('onedata_pending_tour'); } catch (e) {} setTimeout(() => start(id), 400); }
      else if (waited >= 15000) { try { win.localStorage.removeItem('onedata_pending_tour'); } catch (e) {} }
      else { waited += 200; setTimeout(ready, 200); }
    })();
  }
  function pending() {
    try { const u = new URL(win.location.href); const f = u.searchParams.get('tour'); if (f) return f; } catch (e) {}
    try { return win.localStorage.getItem('onedata_pending_tour'); } catch (e) { return null; }
  }
  setTimeout(() => { const id = pending(); if (id && TOURS[id]) { try { win.localStorage.setItem('onedata_pending_tour', id); } catch (e) {} attendre(id); } }, 250);
  }
});
