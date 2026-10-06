// ============================================================================
//  VISITES GUIDÉES (« Montre-moi en vrai ») — module One Data (OD.define) v4
//  Module app-level : une ancre masquée dans le header partagé suffit pour
//  tout le site. Aucune dépendance Supabase. Expose window.OneDataTour ;
//  délégation de clic sur [data-tour-launch] ; reprise auto via localStorage.
//  NB : nommé 'tours' — 'tutos' est déjà pris par le module centre d'aide.
//
//  v4 (06/10/2026, Team Colin — publish-targets : tours = teamcolin)
//    · Une visite par tuto du lead management (lead-mgmt v55+ : le poste
//      expose window.__lmtcTour pour ouvrir une fiche d'exemple où aucun
//      geste n'est enregistré).
//    · Visites reprises sur les écrans actuels : tableau de bord (v50,
//      vendeur / chef / direction / marketing, et plateau VROOM), gestion des
//      ventes (kanban v50), suivi d'activité (v5), performances (v19),
//      objectifs (v11).
//    · Moteur : étape « optional » jugée à l'affichage (passée si sa cible
//      n'apparaît pas), actions asynchrones, garde « requires » (sélecteur ou
//      fonction), nettoyage « fin » à la sortie, cible retrouvée quand la page
//      se redessine, bulle placée à côté des panneaux hauts.
//  Les visites ne cliquent jamais un bouton qui écrit en base.
// ============================================================================
/* ---------------------------------------------------------------------
   Propriétés d'étape :
     target   : { css } | { tour:'data-tour' } | { text }   (élément à surligner)
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
  function frontWin() { try { return (window.wwLib && wwLib.getFrontWindow && wwLib.getFrontWindow()) || win; } catch (e) { return win; } }
  // Lead management : le poste expose window.__lmtcTour (lead-mgmt v55+).
  function lmApi() { const f = frontWin(); return (f && f.__lmtcTour) || win.__lmtcTour || null; }
  const lmExemple = async () => { const t = lmApi(); if (t && t.exemple) { await t.exemple(); await sleep(250); } };
  const lmFermer = () => { const t = lmApi(); if (t && t.fermer) t.fermer(); };
  const onglet = id => clic('.lmtc .poste .tabs [data-id="' + id + '"]');
  // Le poste ouvert, reconnu à ses onglets.
  const VEND = '.lmtc .tabs [data-id="afaire"]';
  const CHEF = '.lmtc .tabs [data-id="relayer"]';
  const DIR = '.lmtc .tabs [data-id="relais"]';
  const PLAT = '.lmtc .tabs [data-id="rappels"]';
  const SITE = '.lmtc .tabs [data-id="afaire"], .lmtc .tabs [data-id="relayer"], .lmtc .tabs [data-id="relais"]';
  const LM_PAGE = '99519997-f935-471a-9147-b0118191b991';
  const ACCUEIL = 'f84d6f00-de35-45b9-ae23-c1f1e46bfa69';
  // Direction sur le mur des sites : les visites du chef ouvrent d'abord un
  // site (le plus chargé, en tête du mur), puis y reviennent à la fin.
  const siteDirection = async () => {
    if (doc.querySelector(CHEF)) return;
    const b = doc.querySelector('.lmtc table.mur.sites [data-a="voir-site"]');
    if (b) { b.click(); win.__odtSiteOuvert = true; await sleep(300); }
  };
  const finSite = () => { lmFermer(); if (win.__odtSiteOuvert) { win.__odtSiteOuvert = false; const r = doc.querySelector('.lmtc [data-a="retour-sites"]'); if (r) r.click(); } };
  const lm = (steps, extra) => Object.assign({ pageId: LM_PAGE, rootCheck: '.lmtc .poste .tabs', fin: lmFermer, steps }, extra || {});
  const FIN = (titre, body) => ({ title: titre, body });
  // Pied de la fiche (sites) : un des quatre gestes du chef des ventes.
  const mode = id => clic('.lmtc-ov .drawer [data-a="mode"][data-id="' + id + '"]');
  const res = id => clic('.lmtc-ov .drawer [data-a="res"][data-id="' + id + '"]');
  const issue = id => clic('.lmtc-ov .drawer [data-a="issue"][data-id="' + id + '"]');

  const TOURS = {

    /* =================================================================
       LEAD MANAGEMENT — vue d'ensemble, un par poste
       ================================================================= */
    'lm-vendeur': lm([
      FIN('Ton poste vendeur', 'Je te montre ton poste en moins d’une minute. Clique « Suivant ».'),
      { action: onglet('afaire'), target: { css: '.lmtc .situ .situ-t' }, title: 'La situation', body: 'Une phrase dit combien de personnes tu as à appeler et combien de leads sont libres dans la piscine du site.' },
      { target: { css: '.lmtc .situ .kpis' }, title: 'Les chiffres du jour', body: 'Tes premiers contacts et tes prises du jour, ce qui reste à faire, la piscine et tes relances de campagne.' },
      { target: { css: '.lmtc .poste .sig' }, title: 'Les signaux', body: 'Ce qui vient d’arriver : un lead qualifié par le plateau, un lead que ton chef te confie, un rappel. Chaque signal porte son bouton ; « Vu » le retire.' },
      { target: { css: '.lmtc .poste .tabs' }, title: 'Tes trois onglets', body: 'À faire, la piscine du site et tes campagnes. Le chiffre passe en rouge dès qu’un lead est hors délai.' },
      { target: { css: '.lmtc .poste .panel' }, title: 'À faire', body: 'Tes leads pas encore contactés, le plus pressé en tête, puis tes relances. Chaque ligne dit quoi faire et pourquoi.' },
      { action: onglet('piscine'), target: { css: '.lmtc .poste .panel' }, title: 'La piscine du site', body: 'Les leads que personne n’a pris. « Prendre » met le lead à ton nom : il passe dans « À faire ».' },
      { action: onglet('campagnes'), target: { css: '.lmtc .poste .panel' }, title: 'Mes campagnes', body: 'Les clients que ton chef t’a confiés. Un clic ouvre la fiche du client : appelle, puis fais ton compte rendu.' },
      { action: onglet('afaire'), optional: true, target: { css: '.lmtc .situ [data-a="ancien"]' }, title: 'L’écran précédent', body: '« Tableaux détaillés » ramène aux cycles, au kanban et à la synthèse.' },
      FIN('À toi de jouer', 'Commence par le haut de « À faire ». Chaque geste a sa visite dans la section Lead management des tutos.'),
    ]),

    'lm-chef': lm([
      FIN('Ton poste chef des ventes', 'Je te montre ton poste en moins d’une minute. Clique « Suivant ».'),
      { action: onglet('mur'), target: { css: '.lmtc .situ .situ-t' }, title: 'La situation', body: 'Combien de leads sont hors délai dans la piscine, combien sont pris sans appel, et les premiers contacts de l’équipe aujourd’hui.' },
      { target: { css: '.lmtc .situ .kpis' }, title: 'Les chiffres du site', body: 'Leads libres, chez les vendeurs, au plateau VROOM, ouverts depuis plus de 24 h (et les archives), et le délai moyen de premier contact.' },
      { target: { css: '.lmtc .poste .sig' }, title: 'Les signaux', body: 'Ce qui demande ton intervention, chacun avec son bouton. « Vu » le retire.' },
      { target: { css: '.lmtc table.mur:not(.sites)' }, title: 'Le mur', body: 'Qui a la main sur quoi, et depuis combien de temps. Chaque lead ouvert est compté une fois, chez la personne qui l’a en main.' },
      { action: onglet('relayer'), target: { css: '.lmtc .poste .panel' }, title: 'À relayer', body: 'Ce qui reste en plan, groupe par groupe, avec le geste proposé : attribuer, rendre, renvoyer, confier au plateau, solder le stock.' },
      { action: onglet('campagnes'), target: { css: '.lmtc .poste .panel' }, title: 'Campagnes', body: 'L’avancement de chaque campagne, vendeur par vendeur, et « Créer une campagne ».' },
      { action: onglet('mur'), title: 'À toi de jouer', body: 'Un coup d’œil au mur, puis « À relayer ». Chaque geste a sa visite dans la section Lead management des tutos.' },
    ]),

    'lm-direction': lm([
      { action: clic('.lmtc [data-a="retour-sites"]'), title: 'Ton poste direction', body: 'Je te montre ton poste en moins d’une minute. Clique « Suivant ».' },
      { action: onglet('mur'), target: { css: '.lmtc .situ .situ-t' }, title: 'La situation', body: 'Les trois délais de premier contact les plus longs sur 30 jours, et les leads ouverts depuis plus de 24 h.' },
      { target: { css: '.lmtc .situ .kpis' }, title: 'Les chiffres du périmètre', body: 'Leads reçus sur 7 jours, en piscine, hors délai, ouverts depuis plus de 24 h, encore au plateau VROOM.' },
      { target: { css: '.lmtc .poste .sig' }, title: 'Les signaux', body: 'Ce qui demande une attention, site par site.' },
      { target: { css: '.lmtc table.mur.sites' }, title: 'Le mur des sites', body: 'Une ligne par site : où en sont les leads maintenant, puis le délai de premier contact et la part dans le délai sur 30 jours.' },
      { action: onglet('relais'), target: { css: '.lmtc .poste .panel' }, title: 'Le relais', body: 'De BACS au premier appel, en temps médian par site. Les segments hachurés n’appartiennent à personne : c’est là que le temps se perd.' },
      { action: onglet('campagnes'), target: { css: '.lmtc .poste .panel' }, title: 'Campagnes', body: 'Les campagnes de tout ton périmètre, et la création d’une campagne.' },
      { action: onglet('mur'), title: 'À toi de jouer', body: 'Repère le site le plus lent, puis ouvre son mur.' },
    ]),

    'lm-plateau': lm([
      FIN('Ton poste plateau VROOM', 'Je te montre ton poste en moins d’une minute. Clique « Suivant ».'),
      { action: onglet('piscine'), target: { css: '.lmtc .situ .situ-t' }, title: 'La situation', body: 'Combien de leads sont libres et hors délai dans la piscine BACS, depuis quand attend le plus ancien, et les rappels dus.' },
      { target: { css: '.lmtc .situ .kpis' }, title: 'Les chiffres du plateau', body: 'Pris, qualifiés, rappels, abandonnés aujourd’hui ; l’âge de la copie BACS ; et le report dans BACS, « automatique » quand tout passe.' },
      { optional: true, target: { css: '.lmtc .bd' }, title: 'Le canal BACS', body: 'Rouge : aucune session BACS ne répond, ouvre BACS et connecte-toi. Bleu : tes gestes passent par un collègue. Orange : des gestes attendent.' },
      { target: { css: '.lmtc .poste .sig' }, title: 'Les signaux', body: 'Nouveau lead, hors délai, rappel, relais bloqué : chaque signal porte son bouton. « Vu » le retire.' },
      { target: { css: '.lmtc .poste .tabs' }, title: 'Tes quatre onglets', body: 'La piscine BACS, les rappels, les transferts et les campagnes.' },
      { target: { css: '.lmtc .poste .panel' }, title: 'La piscine BACS', body: 'Du plus ancien au plus récent. « Prendre » réserve le lead à ton nom, le passe en Accepté dans BACS et ouvre sa fiche.' },
      { action: onglet('rappels'), target: { css: '.lmtc .poste .panel' }, title: 'Rappels', body: 'Injoignables et projets long terme, du plus en retard au plus lointain.' },
      { action: onglet('transferts'), target: { css: '.lmtc .poste .panel' }, title: 'Transferts', body: 'Ce que deviennent tes leads qualifiés. Après 2 h sans contact, « Relancer le chef » alerte le site.' },
      { action: onglet('campagnes'), target: { css: '.lmtc .poste .panel' }, title: 'Campagnes', body: 'Les campagnes BACS. « Filtrer » restreint tes files à une campagne.' },
      { action: onglet('piscine'), title: 'À toi de jouer', body: 'Prends le plus ancien. Garde l’onglet BACS ouvert et connecté : One Data y écrit pour toi.' },
    ]),

    /* =================================================================
       LEAD MANAGEMENT — une visite par tuto
       ================================================================= */
    'lm-delais': lm([
      FIN('Délais et couleurs', 'Chaque lead a un délai de premier contact. Je te montre où le lire.'),
      { requires: VEND, action: onglet('afaire'), optional: true, target: { css: '.lmtc .poste .panel .tm' }, title: 'Le minuteur', body: 'À gauche de chaque ligne : le temps écoulé et, dessous, le délai de la source. Vert tant que moins de 60 % du délai est consommé, orange au-delà, rouge une fois dépassé.' },
      { requires: CHEF, action: onglet('mur'), target: { css: '.lmtc table.mur:not(.sites) thead' }, title: 'Les colonnes du mur', body: 'Dans les temps (vert), À risque (orange, plus de 60 % du délai consommé), Hors délai (rouge), puis Ouverts + 24 h.' },
      { requires: DIR, action: onglet('mur'), target: { css: '.lmtc table.mur.sites thead' }, title: 'Les colonnes du mur des sites', body: 'Dans les temps, À risque, Hors délai, Ouverts + 24 h pour chaque site, puis le délai moyen de premier contact sur 30 jours.' },
      { requires: PLAT, action: onglet('piscine'), optional: true, target: { css: '.lmtc .poste .panel .lr .tm' }, title: 'Le minuteur', body: 'Depuis combien de temps le lead attend, coloré selon le délai de sa source : vert, orange à 60 %, rouge au-delà.' },
      { target: { css: '.lmtc .poste .tabs' }, title: 'Le chiffre des onglets', body: 'Il passe en rouge dès qu’un lead de la file est hors délai.' },
      { requires: '.lmtc .situ .kpis', target: { css: '.lmtc .situ .kpis' }, title: 'Les chiffres du haut', body: 'Ils comptent aussi les leads hors délai et ceux ouverts depuis plus de 24 h.' },
      FIN('Le délai dépend de la source', 'Site constructeur : 30 min. Campagne marketing BACS : 1 h. Autre demande BACS : 2 h. Showroom et trafic atelier : 4 h. Lead transmis par le plateau : 2 h pour le site.'),
    ]),

    'lm-bacs-sites': lm([
      FIN('Ce qui part dans BACS', 'Pour un lead BACS, tes gestes sont reportés automatiquement dans BACS. Je t’ouvre une fiche pour te montrer où le voir.'),
      { action: lmExemple, target: { css: '.lmtc-ov .drawer .dr-h' }, title: 'La fiche du lead', body: 'L’étiquette « BACS » dit que le lead vient de BACS : ses gestes y seront reportés.' },
      { optional: true, target: { css: '.lmtc-ov .drawer .env' }, title: 'Dans BACS', body: 'Chaque envoi et son résultat : « Fait à 10:42 », « En attente » ou « Échec » avec la raison. « Relancer l’envoi » remet un échec en route.' },
      { target: { css: '.lmtc-ov .drawer .dr-f' }, title: 'Les gestes', body: 'RDV : le rendez-vous part dans BACS. Attribuer : le vendeur devient propriétaire. Autre site : site et propriétaire mis à jour. Clore : abandon avec le motif. Confier au plateau : rappel VROOM dans 30 min.' },
      { optional: true, target: { css: '.lmtc-ov .drawer .row.pied .hint' }, title: 'Le rappel en bas', body: 'Il dit si le lead est un lead BACS ou un lead hors BACS, enregistré seulement dans One Data.' },
      FIN('Ce qui reste dans One Data', 'Joint sans RDV, Pas joint et Rendre à la piscine ne modifient pas BACS.'),
    ]),

    'lm-v-afaire': lm([
      { action: onglet('afaire'), target: { css: '.lmtc .situ .situ-t' }, title: 'À faire : qui appeler maintenant', body: 'La phrase du haut compte les personnes à appeler.' },
      { target: { css: '.lmtc .poste .panel' }, title: 'La liste', body: 'Tes leads pas encore contactés, le plus pressé en tête, puis tes relances de campagne.' },
      { optional: true, target: { css: '.lmtc .poste .panel .todo .todo-v' }, title: 'Quoi faire', body: '« Appeler » pour un premier contact, « Rappeler » avec le numéro de la tentative, « Relancer » pour une campagne.' },
      { optional: true, target: { css: '.lmtc .poste .panel .todo .why' }, title: 'Pourquoi', body: 'Qualifié par le plateau VROOM, attribué par ton chef, ou pas joint au dernier essai.' },
      { optional: true, target: { css: '.lmtc .poste .panel .todo .tm' }, title: 'Le délai', body: 'Le temps écoulé depuis l’arrivée sur le site, et le délai de la source.' },
      { optional: true, target: { css: '.lmtc .poste .panel > .foot' }, title: 'Les leads plus anciens', body: 'Tes leads de plus de 30 jours encore à ton nom : ils ne sont plus à appeler en priorité, ton chef les solde.' },
      { action: lmExemple, target: { css: '.lmtc-ov .drawer .canaux' }, title: 'Ouvre et appelle', body: 'Un clic sur une ligne ouvre la fiche à droite : Appeler (3CX), WhatsApp, Email, SMS, et la fiche client.' },
      { optional: true, target: { css: '.lmtc-ov .drawer .qualif' }, title: 'La qualification du plateau', body: 'Ce que le plateau VROOM a appris : lis-la avant d’appeler.' },
      FIN('Ensuite', 'En bas de la fiche, dis ce qui s’est passé : voir la visite « Après l’appel ».'),
    ]),

    'lm-v-piscine': lm([
      { action: onglet('piscine'), target: { css: '.lmtc .poste .tabs [data-id="piscine"]' }, title: 'La piscine du site', body: 'Les leads du site que personne n’a pris : premier arrivé, premier servi.' },
      { target: { css: '.lmtc .poste .panel' }, title: 'Les leads libres', body: 'Du plus pressé au moins pressé, avec leur délai.' },
      { optional: true, target: { css: '.lmtc .poste .panel .lr [data-a="prendre"]' }, title: 'Prendre', body: 'Met le lead à ton nom : il passe dans « À faire » et sa fiche s’ouvre.' },
      { optional: true, target: { css: '.lmtc .poste .panel .lr.resa' }, title: 'Réservé', body: 'Un collègue regarde ce lead jusqu’à l’heure indiquée.' },
      { optional: true, target: { css: '.lmtc .poste .panel .lr .tags' }, title: 'Les étiquettes', body: 'Source, campagne, « Qualifié par VROOM »… « Aussi en piscine BACS » : appelle-le normalement, il sortira de la piscine du plateau.' },
      { action: onglet('afaire'), title: 'Un lead BACS manque ?', body: 'Il est encore au plateau VROOM : il arrivera sur le site une fois qualifié.' },
    ]),

    'lm-v-apres': lm([
      FIN('Après l’appel', 'Je t’ouvre une fiche pour te montrer comment dire ce qui s’est passé.'),
      { action: async () => { await lmExemple(); if (doc.querySelector(CHEF) || doc.querySelector(DIR)) { mode('resultat')(); await sleep(150); } res('rdv')(); },
        target: { css: '.lmtc-ov .drawer [role="radiogroup"][aria-label^="Résultat"]' }, title: 'Quatre issues', body: 'Joint · RDV, Joint · sans RDV, Pas joint, Clore.' },
      { action: res('rdv'), target: { css: '.lmtc-ov .drawer .dr-f' }, title: 'Joint · RDV', body: 'Date, durée, objet, puis « Enregistrer le RDV » : il s’inscrit dans ton agenda et le lead est contacté. Il faut une fiche client rattachée.' },
      { action: res('joint'), target: { css: '.lmtc-ov .drawer .dr-f' }, title: 'Joint · sans RDV', body: 'Le lead est contacté, avec une note si tu veux. Il sort de « À faire ».' },
      { action: res('pasjoint'), target: { css: '.lmtc-ov .drawer .dr-f' }, title: 'Pas joint', body: 'La tentative est notée (1, 2, 3 sur 3). Le lead reste dans « À faire » et revient en signal « Rappel » deux heures plus tard.' },
      { action: res('clore'), target: { css: '.lmtc-ov .drawer .dr-f' }, title: 'Clore', body: 'Avec un motif : pas intéressé, injoignable, parti à la concurrence, doublon, fausse demande, autre.' },
      { requires: VEND, optional: true, target: { css: '.lmtc-ov .drawer [data-a="rendre"]' }, title: 'Rendre à la piscine', body: 'Ce lead n’est pas pour toi ? Il redevient libre pour tes collègues.' },
      FIN('À toi de jouer', 'Rien n’a été enregistré pendant la visite.'),
    ]),

    'lm-v-campagnes': lm([
      { action: onglet('campagnes'), target: { css: '.lmtc .poste .tabs [data-id="campagnes"]' }, title: 'Mes campagnes', body: 'Les clients que ton chef des ventes t’a confiés dans une campagne.' },
      { target: { css: '.lmtc .poste .panel' }, title: 'Une campagne', body: 'Pour chacune : tes clients, ceux déjà traités, ceux à relancer, les propositions et les commandes.' },
      { optional: true, target: { css: '.lmtc .poste .panel .todo' }, title: 'Un client à relancer', body: 'Un clic ouvre sa fiche : appelle-le, puis fais ton compte rendu. La relance est alors comptée comme traitée.' },
      { optional: true, target: { css: '.lmtc .poste .panel .todo .tm' }, title: 'Depuis quand', body: 'Les jours depuis le lancement ; orange au-delà de trois jours.' },
      { action: onglet('afaire'), title: 'Dans « À faire » aussi', body: 'Tes relances de campagne apparaissent à la fin de la liste « À faire ».' },
    ]),

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

    'lm-c-mur': lm([
      { action: async () => { onglet('mur')(); await siteDirection(); onglet('mur')(); }, target: { css: '.lmtc table.mur:not(.sites)' }, title: 'Le mur', body: 'Chaque lead ouvert est compté une fois, chez la personne qui l’a en main.' },
      { target: { css: '.lmtc table.mur:not(.sites) tr.pisc' }, title: 'La piscine en tête', body: 'Personne n’y a la main : c’est la première ligne à regarder.' },
      { target: { css: '.lmtc table.mur:not(.sites) thead' }, title: 'Les colonnes', body: 'Dans les temps, À risque, Hors délai, Ouverts + 24 h, et les premiers contacts de chacun aujourd’hui.' },
      { optional: true, target: { css: '.lmtc table.mur:not(.sites) tr.vroom' }, title: 'Au plateau VROOM', body: 'Les leads BACS de ton site pas encore qualifiés par le plateau.' },
      { optional: true, target: { css: '.lmtc [data-a="autres-vendeurs"]' }, title: 'Les autres vendeurs', body: 'Ceux sans lead en cours sont repliés ici.' },
      { target: { css: '.lmtc .panel .ph-r .seg' }, title: 'Compter depuis', body: 'L’arrivée sur le site (le transfert du plateau, sinon la réception) ou la réception dans BACS.' },
      { optional: true, target: { css: '.lmtc .site-chips' }, title: 'Tes sites', body: 'Si tu encadres plusieurs sites, change de site ici.' },
      { optional: true, target: { css: '.lmtc table.mur:not(.sites) .cell[data-a="cell"]' }, title: 'Clique un chiffre', body: 'Je clique pour toi : la liste de ces leads s’ouvre dans le volet de droite.' },
      { optional: true, action: clic('.lmtc table.mur:not(.sites) .cell[data-a="cell"]'), target: { css: '.lmtc-ov .drawer .dr-b.vol' }, title: 'Le volet', body: 'Les leads de la case, le plus ancien en tête. Chaque ligne s’ouvre.' },
      { optional: true, action: clic('.lmtc-ov .drawer .dr-b.vol .lr'), target: { css: '.lmtc-ov .drawer [data-a="retour-liste"]' }, title: 'Retour à la liste', body: 'La fiche s’ouvre dans le même volet ; ce bouton ramène à la liste.' },
      { action: lmFermer, title: 'À toi de jouer', body: 'La croix, Échap ou un clic à côté ferment le volet.' },
    ], { fin: finSite }),

    'lm-c-relayer': lm([
      { action: async () => { await siteDirection(); onglet('relayer')(); }, target: { css: '.lmtc .poste .tabs [data-id="relayer"]' }, title: 'À relayer', body: 'Ce qui reste en plan, groupe par groupe.' },
      { target: { css: '.lmtc .poste .panel' }, title: 'Les groupes', body: 'Hors délai dans la piscine, pris sans appel depuis plus de 20 min, autre marque demandée, injoignables après 3 tentatives, stock de plus de 24 h.' },
      { optional: true, target: { css: '.lmtc .poste .panel [data-a="attribuer-regle"]' }, title: 'Tout attribuer selon la règle', body: 'Répartit d’un coup les leads hors délai de la piscine, avec la règle du site.' },
      { optional: true, target: { css: '.lmtc .poste .panel .grp' }, title: 'Un groupe', body: 'Son titre dit le problème, son compteur le nombre de leads.' },
      { optional: true, target: { css: '.lmtc .poste .panel .rel' }, title: 'Une ligne', body: 'Le lead, depuis quand, chez qui. Un clic sur le nom ouvre sa fiche.' },
      { optional: true, target: { css: '.lmtc .poste .panel .rel-a' }, title: 'Le geste proposé', body: 'Attribuer (le moins chargé est conseillé), rendre, renvoyer vers un autre site, confier au plateau VROOM ou clore.' },
      { optional: true, target: { css: '.lmtc .poste .panel [data-a="solder"]' }, title: 'Solder le stock', body: 'Les leads de plus de 24 h se traitent en une fois : voir la visite « Solder le stock ».' },
      { action: onglet('mur'), title: 'À toi de jouer', body: 'Vide les groupes du haut d’abord : ce sont les plus pressés.' },
    ], { fin: finSite }),

    'lm-c-fiche': lm([
      FIN('Agir sur un lead', 'Je t’ouvre la fiche d’un lead de ton site.'),
      { action: lmExemple, target: { css: '.lmtc-ov .drawer .dr-h' }, title: 'La fiche', body: 'Le lead, son site, qui l’a en main ; dessous, délais, contact et demande.' },
      { optional: true, target: { css: '.lmtc-ov .drawer [role="radiogroup"][aria-label="Geste"]' }, title: 'Quatre gestes', body: 'Attribuer, Résultat d’appel, Autre site, Clore.' },
      { optional: true, action: mode('attribuer'), target: { css: '.lmtc-ov .drawer #dr-vendeur' }, title: 'Attribuer', body: 'Choisis le vendeur : sa charge en cours est affichée, le moins chargé est conseillé.' },
      { optional: true, target: { css: '.lmtc-ov .drawer [data-a="confier"], .lmtc-ov .drawer [data-a="rendre"]' }, title: 'Confier ou rendre', body: '« Confier au plateau VROOM » (lead BACS) : rappel au plateau dans 30 min. « Rendre à la piscine » : de nouveau libre.' },
      { optional: true, action: mode('resultat'), target: { css: '.lmtc-ov .drawer .dr-f' }, title: 'Résultat d’appel', body: 'Si tu as appelé toi-même : RDV, joint, pas joint ou clore.' },
      { optional: true, action: mode('renvoyer'), target: { css: '.lmtc-ov .drawer #dr-site' }, title: 'Autre site', body: 'Le lead part dans la piscine du site choisi, délai remis à zéro ; BACS reçoit le nouveau site.' },
      { optional: true, action: mode('clore'), target: { css: '.lmtc-ov .drawer #clore-motif' }, title: 'Clore', body: 'Avec un motif. Un lead BACS est aussi abandonné dans BACS.' },
      { optional: true, target: { css: '.lmtc-ov .drawer .dr-f > .hint' }, title: 'Vue de pilotage', body: 'Sur un site que tu n’encadres pas, tu lis tout mais n’agis pas.' },
      FIN('À toi de jouer', 'Rien n’a été modifié pendant la visite.'),
    ]),

    'lm-c-solder': lm([
      { action: async () => { await siteDirection(); onglet('mur')(); }, optional: true, target: { css: '.lmtc table.mur:not(.sites) tr.pisc .cell.stock' }, title: 'Le stock', body: 'Les leads de la piscine sans contact depuis plus de 24 h. Sur le mur, le bouton « Solder le stock » est au pied du volet de cette case.' },
      { action: onglet('relayer'), optional: true, target: { css: '.lmtc .poste .panel .rel:has([data-a="solder"])' }, title: 'À solder en une fois', body: 'Dans « À relayer », la dernière ligne compte tous les leads ouverts depuis plus de 24 h, archives comprises.' },
      { optional: true, action: clic('.lmtc .poste .panel [data-a="solder"]'), target: { css: '.lmtc-ov .modal .mb-h' }, title: 'Le compte exact', body: 'La fenêtre compte les leads, dont ceux venant de BACS, avant tout geste.' },
      { optional: true, target: { css: '.lmtc-ov .modal label.opt:nth-of-type(1)' }, title: 'Confier au plateau VROOM', body: 'Les leads BACS repartent au plateau, qui rappelle et requalifie. Les autres restent ouverts.' },
      { optional: true, target: { css: '.lmtc-ov .modal label.opt:nth-of-type(2)' }, title: 'Répartir sur l’équipe', body: 'Selon la règle du site, le moins chargé d’abord.' },
      { optional: true, target: { css: '.lmtc-ov .modal label.opt:nth-of-type(3)' }, title: 'Clore sans suite', body: '« Stock avant déploiement » : ils sortent des délais, rien n’est effacé, BACS n’est pas modifié.' },
      { optional: true, target: { css: '.lmtc-ov .modal [data-a="solder-ok"]' }, title: 'Appliquer', body: 'Rien ne part sans ce clic. Je ferme la fenêtre sans rien appliquer.' },
      { action: () => { lmFermer(); onglet('mur')(); }, title: 'À toi de jouer', body: 'Les leads encore au plateau ne sont jamais soldés.' },
    ], { fin: finSite }),

    'lm-campagnes': lm([
      { action: onglet('campagnes'), target: { css: '.lmtc .poste .tabs [data-id="campagnes"]' }, title: 'Campagnes', body: 'Les campagnes internes de ton périmètre sur 90 jours.' },
      { optional: true, target: { css: '.lmtc .poste .panel .camp-t' }, title: 'Le suivi', body: 'Cibles, traitées, à relancer, propositions, commandes.' },
      { optional: true, action: clic('.lmtc .poste .panel .camp-t tr.clic'), target: { css: '.lmtc .poste .panel .vdet' }, title: 'Vendeur par vendeur', body: 'Un clic sur une campagne montre qui avance.' },
      { optional: true, action: clic('.lmtc .poste .panel [data-a="creer-camp"]'), target: { css: '.lmtc-ov .modal .mb' }, title: 'Créer une campagne', body: 'Les clients se choisissent par critères : site, particuliers ou sociétés, marque, modèle, âge et kilométrage du véhicule, départements.' },
      { optional: true, target: { css: '.lmtc-ov .modal [data-a="camp-estimer"]' }, title: 'Estimer d’abord', body: 'La cible et sa répartition sont estimées avant tout envoi ; « Lancer » demande une seconde confirmation.' },
      { action: lmFermer, title: 'À toi de jouer', body: 'Rien n’a été créé pendant la visite.' },
    ]),

    'lm-d-sites': lm([
      { action: () => { clic('.lmtc [data-a="retour-sites"]')(); onglet('mur')(); }, target: { css: '.lmtc table.mur.sites' }, title: 'Le mur des sites', body: 'Une ligne par site de ton périmètre.' },
      { target: { css: '.lmtc table.mur.sites thead' }, title: 'Maintenant, puis sur la durée', body: 'Dans les temps, à risque, hors délai, ouverts + 24 h, au plateau ; puis délai moyen de premier contact et part dans le délai sur 30 jours, leads reçus sur 7 jours.' },
      { optional: true, target: { css: '.lmtc table.mur.sites .arch' }, title: 'Les archives', body: 'Les leads de plus de 30 jours, comptés à part.' },
      { optional: true, target: { css: '.lmtc table.mur.sites [data-a="voir-site"]' }, title: 'Ouvrir un site', body: 'Je l’ouvre pour toi : c’est le mur du chef des ventes.' },
      { optional: true, action: clic('.lmtc table.mur.sites [data-a="voir-site"]'), target: { css: '.lmtc table.mur:not(.sites)' }, title: 'Le mur du site', body: 'Qui a la main sur quoi. Un clic sur un chiffre ouvre la liste dans le volet de droite.' },
      { optional: true, target: { css: '.lmtc [data-a="retour-sites"]' }, title: 'Tous les sites', body: 'Ramène au mur des sites.' },
      { action: clic('.lmtc [data-a="retour-sites"]'), title: 'À toi de jouer', body: 'Commence par le site qui a le plus de rouge.' },
    ]),

    'lm-d-relais': lm([
      { action: () => { clic('.lmtc [data-a="retour-sites"]')(); onglet('relais')(); }, target: { css: '.lmtc .poste .panel' }, title: 'Le relais', body: 'Le chemin d’un lead, de BACS au premier appel, en temps médian par site.' },
      { optional: true, target: { css: '.lmtc .poste .panel .lg' }, title: 'Quatre segments', body: 'Attente en piscine BACS, traitement par le plateau VROOM, attente sur le site, vendeur avant l’appel.' },
      { optional: true, target: { css: '.lmtc .poste .panel .rl' }, title: 'Un site', body: 'Sa durée totale, segment par segment. Les segments hachurés n’appartiennent à personne : c’est là que le temps se perd.' },
      { action: onglet('mur'), title: 'À toi de jouer', body: 'Ouvre le mur du site le plus lent pour voir où ça bloque.' },
    ]),

    'lm-p-bacs': lm([
      FIN('BACS : un onglet ouvert, rien d’autre', 'One Data écrit dans BACS pour toi, par ta session BACS ouverte dans ce navigateur avec l’extension.'),
      { optional: true, target: { css: '.lmtc .bd' }, title: 'Le bandeau', body: 'Rouge : aucune session BACS ne répond, les gestes sont bloqués. Bleu : tes gestes passent par un collègue. Orange : des gestes attendent.' },
      { target: { css: '.lmtc .situ .kpis .k:nth-child(6)' }, title: 'Copie BACS', body: 'L’âge de la dernière lecture de BACS. Orange au-delà de 2 h, rouge au-delà de 24 h : recharge l’onglet BACS.' },
      { target: { css: '.lmtc .situ .kpis .k:nth-child(7)' }, title: 'Report dans BACS', body: '« automatique » quand tout passe ; sinon les gestes en attente, les échecs, ou « bloqué ».' },
      { action: lmExemple, optional: true, target: { css: '.lmtc-ov .drawer .env' }, title: 'Dans BACS', body: 'Sur chaque fiche : ce qui est parti et son résultat. Un échec se relance avec « Relancer l’envoi ».' },
      { optional: true, target: { css: '.lmtc-ov .drawer .row.pied .hint' }, title: 'Le rappel en bas de fiche', body: 'Il dit si le geste partira automatiquement dans BACS, ou s’il est bloqué.' },
      { action: lmFermer, title: 'À toi de jouer', body: 'Garde l’onglet BACS ouvert et connecté. Une session de la veille a souvent expiré.' },
    ]),

    'lm-p-signaux': lm([
      { target: { css: '.lmtc .poste .sig' }, title: 'Les signaux du plateau', body: 'Ce qui demande une action, pour tout le plateau, même avec un filtre de campagne.' },
      { optional: true, target: { css: '.lmtc .poste .sig .sg' }, title: 'Un signal', body: 'Son type (Nouveau lead, Hors délai, Rappel, Relais bloqué, Report BACS, Copie BACS…), son heure et ce qu’il annonce.' },
      { optional: true, target: { css: '.lmtc .poste .sig .sg-a' }, title: 'Son bouton', body: 'Il traite le signal : Prendre, Prendre le plus ancien, Appeler, Voir les rappels, Relancer le chef, Ouvrir la fiche.' },
      { optional: true, target: { css: '.lmtc .poste .sig [data-a="ack"]' }, title: 'Vu', body: 'Retire le signal de la liste ; ce choix reste mémorisé dans ton navigateur.' },
      FIN('À retenir', 'Un signal qui apparaît pendant que l’écran est ouvert clignote quelques secondes.'),
    ]),

    'lm-p-piscine': lm([
      { action: () => { onglet('piscine')(); clic('.lmtc .barre [data-a="stock"][data-id=""]')(); }, target: { css: '.lmtc .poste .panel' }, title: 'La piscine BACS', body: 'Les leads « À affecter » ou « Nouveau » de moins de 60 jours, et ceux acceptés ces 14 derniers jours restés sans suite, du plus ancien au plus récent.' },
      { optional: true, target: { css: '.lmtc .poste .panel .chips.filtres' }, title: 'Les sources', body: 'Une pastille par source, avec son nombre. Le trafic atelier est masqué par défaut ; un clic ajoute ou retire une source.' },
      { optional: true, target: { css: '.lmtc .poste .panel .lr .tm' }, title: 'Le minuteur', body: 'Depuis combien de temps le lead attend, coloré selon le délai de sa source.' },
      { optional: true, target: { css: '.lmtc .poste .panel .lr [data-a="prendre"]' }, title: 'Prendre', body: 'Réserve le lead à ton nom 5 minutes, le passe en Accepté dans BACS et ouvre sa fiche.' },
      { optional: true, target: { css: '.lmtc .poste .panel .barre .seg' }, title: 'Le stock accepté', body: 'Je bascule pour toi : les leads acceptés il y a plus de 14 jours, jamais qualifiés ni abandonnés.' },
      { optional: true, action: clic('.lmtc .barre [data-a="stock"][data-id="1"]'), target: { css: '.lmtc .poste .panel' }, title: 'Le stock accepté', body: 'Le bouton de ligne devient « Rappeler » : on reprend le lead, on rappelle, puis on choisit une issue.' },
      { action: clic('.lmtc .barre [data-a="stock"][data-id=""]'), target: { css: '.lmtc .situ .kpis .k:nth-child(6)' }, title: 'La copie BACS', body: 'Un lead arrivé dans BACS après la dernière lecture n’est pas encore visible. Tes gestes, eux, comptent tout de suite.' },
    ]),

    'lm-p-traiter': lm([
      { action: onglet('piscine'), target: { css: '.lmtc .poste .panel .lr [data-a="prendre"], .lmtc .poste .tabs [data-id="piscine"]' }, title: 'Prendre', body: 'Réserve le lead à ton nom 5 minutes et le passe en Accepté dans BACS. Pour la visite, j’ouvre une fiche d’exemple : rien n’est réservé ni enregistré.' },
      { action: lmExemple, target: { css: '.lmtc-ov .drawer .delais' }, title: 'Les délais', body: 'Depuis la réception BACS ; et, tant que la fiche est ouverte, ta réservation prolongée automatiquement.' },
      { target: { css: '.lmtc-ov .drawer .canaux' }, title: 'Appeler', body: 'Appeler (3CX), WhatsApp, Email, SMS.' },
      { optional: true, target: { css: '.lmtc-ov .drawer .qf' }, title: 'Qualifier', body: 'Projet, modèle visé, échéance, reprise, financement, note pour le vendeur. Facultatif, mais c’est ce que le vendeur lira avant d’appeler.' },
      { optional: true, target: { css: '.lmtc-ov .drawer .sites' }, title: 'Orienter', body: 'Le site BACS, puis ceux où le client a un dossier, puis les autres sites de la marque, chacun avec ses leads en attente.' },
      { optional: true, target: { css: '.lmtc-ov .drawer #q-vendeur' }, title: 'Le vendeur', body: '« Tour de rôle du site » par défaut : le moins chargé. Ou un vendeur précis.' },
      { optional: true, target: { css: '.lmtc-ov .drawer .dr-f .issues' }, title: 'L’issue', body: 'Qualifié, Injoignable, Projet long terme, Abandonner : voir la visite « Les quatre issues ».' },
      { optional: true, target: { css: '.lmtc-ov .drawer [data-a="liberer"]' }, title: 'Libérer', body: 'Rend le lead sans rien faire ; fermer la fiche fait de même.' },
      { action: lmFermer, title: 'À toi de jouer', body: 'La fiche d’exemple est fermée : rien n’a été enregistré.' },
    ]),

    'lm-p-issues': lm([
      { action: async () => { await lmExemple(); issue('qualifier')(); }, target: { css: '.lmtc-ov .drawer .dr-f' }, title: 'Qualifié', body: 'Le lead part au site choisi avec ta qualification ; attribué au vendeur choisi ou par tour de rôle. BACS : Qualifié, site et propriétaire.' },
      { action: issue('injoignable'), target: { css: '.lmtc-ov .drawer .dr-f' }, title: 'Injoignable', body: 'Une tentative de plus et un rappel : dans 2 h, demain 9 h, après-demain 9 h ou à une date. BACS : Injoignable temporairement et date de rappel.' },
      { action: issue('long_terme'), target: { css: '.lmtc-ov .drawer .dr-f' }, title: 'Projet long terme', body: 'Un rappel à la date choisie, dans 30 jours par défaut ; le lead revient dans Rappels 7 jours avant.' },
      { action: issue('abandon'), target: { css: '.lmtc-ov .drawer .dr-f' }, title: 'Abandonner', body: 'Avec un motif BACS. Le lead est clos dans One Data s’il y existe.' },
      { action: lmFermer, title: 'À toi de jouer', body: 'Fiche d’exemple : rien n’a été enregistré.' },
    ]),

    'lm-p-rappels': lm([
      { action: onglet('rappels'), target: { css: '.lmtc .poste .panel' }, title: 'Rappels', body: 'Injoignables, projets long terme et intéressés tenus par le plateau, du plus en retard au plus lointain.' },
      { optional: true, target: { css: '.lmtc .poste .panel .lr .tm' }, title: 'Le minuteur', body: '« Maintenant », « retard 2 h 10 » ou « dans 1 h 30 », avec la date prévue.' },
      { optional: true, target: { css: '.lmtc .poste .panel .lr .tags' }, title: 'Statut et tentatives', body: 'Le statut BACS et le nombre de tentatives déjà faites.' },
      { optional: true, target: { css: '.lmtc .poste .panel .ph-r .seg' }, title: 'Les miens', body: 'Ne garde que les leads dont tu as fait le dernier geste.' },
      { action: onglet('piscine'), title: 'À toi de jouer', body: 'Le bouton de ligne prend le lead et ouvre sa fiche.' },
    ]),

    'lm-p-transferts': lm([
      { action: onglet('transferts'), target: { css: '.lmtc .poste .panel' }, title: 'Transferts', body: 'Les leads qualifiés par le plateau ces 30 derniers jours. Le site a 2 h pour les contacter.' },
      { optional: true, target: { css: '.lmtc .poste .panel .lr .lr-a' }, title: 'L’état', body: 'Contacté par … en …, En attente chez …, Relancer le chef, Chef relancé, Converti · Clos par le site, Suivi dans BACS.' },
      { optional: true, target: { css: '.lmtc .poste .panel [data-a="relancer"]' }, title: 'Relancer le chef', body: 'Après 2 h sans contact : une alerte part aux chefs des ventes du site, dans leur page Notifications.' },
      { optional: true, target: { css: '.lmtc .poste .panel .ph-r .seg' }, title: 'Les miens', body: 'Ne garde que tes transferts.' },
      { action: onglet('piscine'), title: 'À toi de jouer', body: 'Surveille les transferts sans contact au-delà de 2 h.' },
    ]),

    'lm-p-campagnes': lm([
      { action: onglet('campagnes'), target: { css: '.lmtc .poste .panel .camp-t, .lmtc .poste .panel' }, title: 'Campagnes BACS', body: 'Les campagnes des 90 derniers jours, hors trafic atelier : reçus, à prendre, acceptés, en rappel, qualifiés, abandonnés, taux de qualification.' },
      { optional: true, target: { css: '.lmtc .poste .panel .camp-t [data-a="campagne"]' }, title: 'Filtrer', body: 'Je filtre pour toi : la piscine, les rappels et les transferts se restreignent à cette campagne.' },
      { optional: true, action: clic('.lmtc .poste .panel .camp-t [data-a="campagne"]:not([data-id=""])'), target: { css: '.lmtc .filtre-actif' }, title: 'Le bandeau du filtre', body: 'Il reste sous les onglets tant que le filtre est actif, avec les nombres de la campagne.' },
      { optional: true, target: { css: '.lmtc .filtre-actif [data-a="campagne"]' }, title: 'Retirer le filtre', body: 'La phrase et les signaux comptent toujours tout le plateau.' },
      { action: () => { clic('.lmtc .filtre-actif [data-a="campagne"]')(); onglet('piscine')(); }, title: 'À toi de jouer', body: 'Le filtre est retiré.' },
    ]),

    'lm-faq-sites': lm([
      FIN('Questions fréquentes', 'Je te montre où trouver chaque réponse.'),
      { requires: CHEF, action: onglet('mur'), optional: true, target: { css: '.lmtc table.mur:not(.sites) tr.vroom' }, title: 'Un lead BACS manque dans la piscine', body: 'Il est encore au plateau VROOM : le mur le montre sur cette ligne.' },
      { requires: CHEF, optional: true, target: { css: '.lmtc .panel > .foot' }, title: 'Le stock compte plus que le mur', body: 'Le mur ne montre que les leads de moins de 30 jours ; les plus anciens sont comptés en archives et soldés avec le reste.' },
      { action: lmExemple, target: { css: '.lmtc-ov .drawer .canaux' }, title: 'Appeler ne fait rien', body: 'Sans téléphonie 3CX active, le navigateur ouvre le numéro avec l’application du poste ; « Copier » reste disponible.' },
      { optional: true, target: { css: '.lmtc-ov .drawer .env' }, title: 'Un envoi en échec', body: 'La raison est sous le geste ; « Relancer l’envoi » le remet en route.' },
      { action: lmFermer, target: { css: '.lmtc .situ [data-a="ancien"]' }, title: 'Retrouver l’ancien écran', body: '« Tableaux détaillés » : cycles, kanban, synthèse, règles d’attribution.' },
    ]),

    'lm-faq-plateau': lm([
      FIN('Questions fréquentes du plateau', 'Je te montre où trouver chaque réponse.'),
      { optional: true, target: { css: '.lmtc .bd' }, title: 'Boutons grisés', body: 'Bandeau rouge : aucune session BACS ne répond. Ouvre BACS et connecte-toi ; tout se réactive dans les 15 secondes.' },
      { target: { css: '.lmtc .situ .kpis .k:nth-child(6)' }, title: 'Piscine vide mais leads dans BACS', body: 'Regarde l’âge de la copie BACS ; si elle est ancienne, recharge l’onglet BACS.' },
      { action: onglet('piscine'), optional: true, target: { css: '.lmtc .poste .panel .chips.filtres' }, title: 'Puis les sources', body: 'Le trafic atelier est masqué par défaut.' },
      { optional: true, target: { css: '.lmtc .filtre-actif' }, title: 'Un onglet ne colle pas à la phrase', body: 'Un filtre de campagne est actif : les onglets ne comptent que cette campagne.' },
      { optional: true, target: { css: '.lmtc .poste .panel .lr.resa' }, title: '« Réservé par … »', body: 'Un collègue traite ce lead ; il redevient libre à l’heure indiquée.' },
      FIN('Fiche fermée par erreur', 'Le lead est libéré : reprends-le avec « Prendre ». La qualification saisie est perdue, rien n’a été enregistré à moitié.'),
    ]),

    /* =================================================================
       LEAD MANAGEMENT — écran précédent (marketing, secrétariat : v48)
       ================================================================= */
    'lead-management': {
      pageId: LM_PAGE,
      rootCheck: '#lead-mgmt-root .lm-toggle',
      steps: [
        { title: 'Lead Management', body: 'Le poste de pilotage des leads et des cycles commerciaux. La visite s’adapte à ce que tu vois à l’écran.' },
        { target: { css: '#lead-mgmt-root .lm-toggle' }, title: 'Les vues', body: 'Bascule ici entre les différentes vues de la page.' },
        { optional: true, target: { css: '#lead-mgmt-root .lm-team' }, title: 'Ton équipe', body: 'Déplie réseau, affaire et site. Clique un site pour le définir comme site global, ou un vendeur pour consulter son détail.' },
        { optional: true, target: { css: '#lead-mgmt-root #lm-range' }, title: 'La période', body: 'Choisis la fenêtre d’analyse : un clic sur la date de début, un clic sur la date de fin.' },
        { optional: true, target: { css: '#lead-mgmt-root .lm-synth-kpi' }, title: 'Tes indicateurs', body: 'Cycles actifs, wins, taux de conversion et délai de premier contact sur la période.' },
        { optional: true, target: { css: '#lead-mgmt-root .lm-synth-2col' }, title: 'Le classement', body: 'Tes meilleurs performers et ceux à soutenir, selon le taux de transformation.' },
        { optional: true, target: { css: '#lead-mgmt-root [data-section="campagnes"]' }, title: 'Les campagnes', body: 'Ici, le ROI de tes campagnes de sollicitation : de la sollicitation jusqu’au win.' },
        { optional: true, action: { click: '#lead-mgmt-root .lm-toggle [data-view="a_traiter"]' }, target: { css: '#lead-mgmt-root .kpi-bar' }, title: 'Tes indicateurs du jour', body: 'SLA dépassé, à traiter, relances dues, cycles chauds, cycles ouverts.' },
        { optional: true, target: { css: '#lead-mgmt-root .card' }, title: 'Un cycle à traiter', body: 'Chaque carte est un cycle. La couleur et le délai signalent l’urgence. Clique pour ouvrir la fiche client.' },
        { optional: true, action: { click: '#lead-mgmt-root .lm-toggle [data-view="pipeline"]' }, target: { css: '#lead-mgmt-root .lm-kanban' }, title: 'Le pipeline', body: 'Tes cycles répartis par étape : Nouveau, En cours, Avancé, Clos.' },
        { action: { click: '#lead-mgmt-root .lm-toggle [data-view="a_traiter"]' }, title: 'À toi de jouer', body: 'Traite tes leads à temps : c’est souvent là que la vente se gagne.' },
      ],
    },

    /* =================================================================
       TABLEAU DE BORD (dashboard v50 Team Colin)
       ================================================================= */
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
       GESTION DES VENTES (kanban v50)
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
       SUIVI D'ACTIVITÉ (activite v5)
       ================================================================= */
    'suivi-activite': {
      pageId: '55717966-7e07-4957-9969-399198cce1ad',
      rootCheck: '#act-root .act-bar',
      fin: () => { const c = doc.querySelector('#act-root #act-cmp-toggle.on'); if (c) c.click(); },
      steps: [
        { title: 'Suivi d’activité', body: 'Contacts, RDV choc, propositions et transformation de l’équipe. Je te montre la page.' },
        { target: { css: '#act-root #act-range' }, title: 'La période', body: 'Du 1er du mois à aujourd’hui à chaque arrivée. Un clic sur le début, un clic sur la fin : tout se recharge.' },
        { optional: true, target: { css: '#act-root .act-toggle' }, title: 'Le type', body: 'Tous, VN, VO ou VN/VO : filtre toute la page.' },
        { optional: true, target: { css: '#act-root #act-export' }, title: 'Exporter', body: 'Toute la page dans un fichier Excel.' },
        { optional: true, target: { css: '#act-root .act-sel-banner' }, title: 'Le périmètre affiché', body: 'La ligne choisie dans l’arbre ; « 📍 site global » quand c’est le site de la barre du haut. « ✕ » revient à tout le périmètre.' },
        { optional: true, target: { css: '#act-root .act-kpi-grid' }, title: 'Le résumé', body: 'Contacts (entrants et sortants), RDV choc, propositions créées, BDC, wins (transformation), abandons.' },
        { optional: true, target: { css: '#act-root .act-charts > .act-card:nth-child(1)' }, title: 'Contacts par jour', body: 'Une courbe par entité du même niveau que ta sélection, et la moyenne en pointillés. Total, entrants ou sortants ; moyenne mobile sur 7 jours.' },
        { optional: true, target: { css: '#act-root .act-charts > .act-card:nth-child(2)' }, title: 'Le pipeline dans le temps', body: 'Propositions, BDC, wins et abandons, en cumulé ou au jour le jour.' },
        { optional: true, target: { css: '#act-root .act-tree' }, title: 'Le périmètre', body: 'Réseau, affaire, site, type, vendeur. Un clic sur une ligne filtre la page ; un site devient le site global ; un second clic revient à tout.' },
        { optional: true, target: { css: '#act-root .act-hm' }, title: 'La cadence', body: 'Les contacts de chaque vendeur, jour par jour. Plus c’est foncé, plus il y en a ; les dimanches en rouge.' },
        { optional: true, target: { css: '#act-root .act-vtable' }, title: 'Par vendeur', body: 'Contacts, mix des canaux (téléphone, WhatsApp, SMS, RPV), chocs, relances, abandons, propositions, BDC, wins.' },
        { optional: true, target: { css: '#act-root #act-cmp-toggle' }, title: 'Comparer', body: 'Je l’active pour toi : clique ensuite deux lignes de l’arbre.' },
        { optional: true, action: () => { const c = doc.querySelector('#act-root #act-cmp-toggle'); if (c && !c.classList.contains('on')) c.click(); }, target: { css: '#act-root .act-card:has(.act-cmp-chips)' }, title: 'Le comparateur', body: 'Deux lignes, même période, mêmes filtres : la meilleure valeur ressort sur chaque mesure.' },
        { action: () => { const c = doc.querySelector('#act-root #act-cmp-toggle.on'); if (c) c.click(); }, title: 'À toi de jouer', body: 'Le comparateur est refermé.' },
      ],
    },

    /* =================================================================
       PERFORMANCES (performances v19, profil Team Colin)
       ================================================================= */
    'performances': {
      pageId: '1499f15f-e8cb-4561-aea8-bdeeeb080b68',
      rootCheck: '#perf-root .pf-bar',
      fin: () => { const x = doc.querySelector('#perf-drawer .pfd-x'); if (x) x.click(); },
      steps: [
        { title: 'Performances', body: 'Ton réalisé face aux objectifs du reporting commandes. Je te montre la page.' },
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
        // Premier élément VISIBLE parmi ceux qui correspondent.
        const all = doc.querySelectorAll(t.css);
        for (const n of all) if (visible(n)) return n;
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
    tipTitle.textContent = step.title || '';
    tipBody.textContent = step.body || '';
    tipStep.textContent = (idx + 1) + ' / ' + tour.steps.length;
    btnPrev.style.visibility = idx === 0 ? 'hidden' : 'visible';
    btnNext.textContent = idx >= tour.steps.length - 1 ? 'Terminer' : 'Suivant';
    if (step.action) { try { await runAction(step.action); } catch (e) {} }
    if (mon !== jeton || !tour) return;
    const limite = step.optional ? 2500 : 4000, t0 = Date.now();
    (function find() {
      if (mon !== jeton || !tour) return;
      const node = step.target ? resolveTarget(step.target) : null;
      if (node) {
        curNode = node; btnNext.disabled = false;
        try { node.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) {}
        setTimeout(reposition, 320);
      } else if (step.target && Date.now() - t0 < limite) { setTimeout(find, 200); }
      else if (step.target && step.optional) {
        // Cible absente : l'étape ne concerne pas cet écran, on passe.
        const j = idx + dir;
        if (j < 0) go(idx + 1, 1); else if (j > tour.steps.length - 1) { curNode = null; hl.style.display = 'none'; btnNext.disabled = false; centerTip(); }
        else go(j, dir);
      } else { curNode = null; hl.style.display = 'none'; btnNext.disabled = false; centerTip(); }
    })();
    centerTip();
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
