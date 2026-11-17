// ============================================================================
//  TUTOS / Centre d'aide Delco coach — module One Data (OD.define)  v6
//  Migré : rend DANS l'ancre `el` (aucun getElementById -> pas de collision
//  d'ID) ; edge via ctx.fn('tutos-coach') ; rôle via socle oropraUser.
//  v3 : section « Lead management » (un tuto par geste, par poste : vendeur,
//  chef des ventes, direction, plateau VROOM), affichée seulement quand le
//  tenant sert le lead management par poste (lead-mgmt v52 et plus, lu dans
//  le manifeste du socle). Ailleurs, l'ancien tuto « Lead Management » reste.
//  Accueil rangé par section ; le coach ne reçoit que les tutos visibles.
//  v4 (06/10/2026, Team Colin — publish-targets : tutos = teamcolin) :
//  « Montre-moi en vrai » sur chaque tuto Lead management (visites de
//  tours v4) ; tuto « Tableau de bord » par rôle ; tutos Gestion des ventes,
//  Suivi d'activité, Performances et Objectifs réécrits sur les écrans
//  actuels ; l'opérateur VROOM voit aussi son tableau de bord.
//  v6 (17/11/2026, Team Colin) : contrôle de chaque tuto et de sa visite.
//  - Lead management réécrit sur le poste actuel (lead-mgmt v127 : Accueil,
//    Pool, Congélateur, À rappeler, Relances, Campagnes, Suivis, Historique,
//    En souffrance ; Vroom Team : Pool BACS, Rappels dus, Transferts,
//    Campagnes, Mes actions). Les tutos v3-v5 décrivaient l'ancien poste.
//  - Retirés : l'application téléphone Android (One-Data Phone), remplacée
//    chez Team Colin par la téléphonie 3CX (section « Téléphone 3CX ») ;
//    l'ancien tuto « Lead Management » (v48) ; « Adoption & déploiement ».
//  - Écrits (ils étaient « Bientôt disponible ») : Démarrer, Fiche client,
//    Propositions commerciales, Bilatérales, WhatsApp, E-mails et SMS,
//    Delco, Piloter son équipe ; nouveau : Performances leads.
//  - Le marketing (5) a le poste de direction ; le secrétariat (9) n'a pas
//    de lead management. Sous-sections par catégorie dans chaque section ;
//    « Dans la même section » sur tous les tutos.
// ============================================================================
OD.define('tutos', {
  mount(__anchor, ctx) {
  

  const doc = __anchor.ownerDocument || document;
  const win = doc.defaultView || window;

  /* ---------- À COMPLÉTER ---------- */
  // SUPABASE_URL / SUPABASE_ANON supprimés -> ctx.fn (projet du tenant)
  const INSTALL_LINK  = '[LIEN_INSTALLATION]';

  /* =======================  RÔLE  ======================= */
  function getRole() {
    try {
      const fw = (window.wwLib && wwLib.getFrontWindow && wwLib.getFrontWindow()) || win;
      let u = fw.oropraUser; if (Array.isArray(u)) u = u[0];
      const r = u && u.ID_Role;
      return r != null ? Number(r) : null;
    } catch (e) { return null; }
  }
  function groupOf(role) {
    // Opérateur plateau VROOM (10) : son propre groupe, s'il a le poste plateau.
    if (role === 10 && posteLeads()) return 'vroom';
    // Vendeur et tout rôle connu hors des rôles manager.
    if (role === 4 || role === 9 || (role > 0 && ![1, 2, 3, 5, 6, 7, 8].includes(role))) return 'vendeur';
    if (role === 3) return 'chef';
    return 'manager'; // 1,2,5,6,7,8
  }
  // Lead management par poste : version du module lead-mgmt servie au tenant
  // (manifeste du socle). Le secrétariat (9) n'a pas de lead management ; le
  // marketing (5) a le poste de direction.
  function versionLeads() {
    try {
      const fw = (window.wwLib && wwLib.getFrontWindow && wwLib.getFrontWindow()) || win;
      const od = (typeof OD !== 'undefined' && OD) || fw.OD || win.OD;
      const m = od && od.manifest && od.manifest['lead-mgmt'];
      const n = m && String(m.label || '').match(/(\d+)/);
      return n ? Number(n[1]) : 0;
    } catch (e) { return 0; }
  }
  function posteLeads() { return versionLeads() >= 52 && roleNum !== 9; }
  let roleNum = getRole();
  let group = groupOf(roleNum);

  /* =======================  DONNÉES  ======================= */
  // v6 : plus d'application téléphone Android (One-Data Phone) chez Team
  // Colin : la téléphonie passe par 3CX. Section « Téléphone » réécrite.
  const ALL = ['vendeur', 'chef', 'manager'];
  const ALL4 = ['vendeur', 'chef', 'manager', 'vroom'];
  const ENC = ['chef', 'manager'];

  /* =======================  LEAD MANAGEMENT (postes)  =======================
     Section affichée quand le tenant sert le lead management par poste
     (lead-mgmt v52 et plus) : vendeur (4), chef des ventes (3), direction et
     marketing (1, 2, 5, 6, 7, 8), Vroom Team (10). Le secrétariat commercial
     (9) n'a pas de lead management.                                       */
  const SITES = ['vendeur', 'chef', 'manager'];
  const POSTES = ['vendeur', 'chef', 'manager', 'vroom'];
  const TOUR_POSTE = { vendeur: 'lm-vendeur', chef: 'lm-chef', manager: 'lm-direction', vroom: 'lm-plateau' };
  function lm(id, category, duration, aud, title, subtitle, intro, steps, extra) {
    return Object.assign({ id, product: 'leads', category, duration, available: true, poste: true, aud, title, subtitle, intro, steps, tour: id }, extra || {});
  }
  const TUTOS_LEADS = [
    /* ---------- Premiers pas, pour tous les postes ---------- */
    lm('lm-poste', 'Premiers pas', '2 min', POSTES, 'Ton poste Lead management', 'Accueil, onglets, filtres',
      'La page Leads › Leads management ouvre un poste de travail selon ton rôle. Rien à paramétrer. Lance la visite guidée pour le parcourir sur ton écran.',
      [
        { title: 'L’Accueil', body: 'La page d’arrivée résume la situation.',
          bodyBy: {
            vendeur: '« Bonjour » : combien de clients tu as à rappeler (et combien sont en retard), combien de leads sont libres dans le Pool, puis « À faire maintenant » : le lead le plus urgent, prêt à appeler.',
            chef: 'Ton site aujourd’hui : leads dans le Pool (dont hors délai), chez les vendeurs, en souffrance, venus de la Vroom Team, part rappelée dans le délai sur 30 jours. Dessous : « À traiter maintenant », le Pool, ton équipe et le pilotage.',
            manager: 'Pas d’Accueil pour la direction : la phrase du haut résume ton périmètre (leads dans le Pool, hors délai, en souffrance). Choisis un site dans le périmètre pour le voir comme son chef des ventes.',
            vroom: 'La phrase du haut : leads à traiter, rappels dus, ce que tu as pris, transféré et abandonné aujourd’hui. « Prendre le suivant » à droite.' } },
        { title: 'Les onglets', body: 'Une liste par onglet ; le chiffre passe en rouge quand un lead est en retard.',
          bodyBy: {
            vendeur: 'Accueil, Pool, Congélateur, À rappeler (tes leads pas encore contactés), Relances (les clients déjà essayés), Campagnes, Suivis, Historique.',
            chef: 'Accueil, Pool, Congélateur, Mes leads (si tu vends aussi), En souffrance, Campagnes, Suivis, Historique.',
            manager: 'Pool, Congélateur, En souffrance, Campagnes, Suivis, Historique.',
            vroom: 'Pool BACS, Rappels dus, Transferts, Campagnes, Mes actions.' } },
        { title: 'Les filtres', body: 'VN / VO, Particuliers / Pros, « Rappels programmés » (aujourd’hui et demain) et la période de réception, en haut à droite des onglets.',
          bodyBy: { vroom: 'La recherche (nom, téléphone, e-mail), « + Nouveau lead », VN / VO et la période.' } },
        { title: 'La fiche du lead', body: 'Un clic sur un lead l’ouvre en plein écran : la demande, les coordonnées, Delco, le fil du client, et à droite ce que tu en fais.',
          bodyBy: { vroom: 'Un clic sur un lead ouvre sa fiche : client, délai, contact, demande, qualification, site, attribution, puis l’issue.' } },
      ], { tourBy: TOUR_POSTE }),
    lm('lm-delais', 'Premiers pas', '2 min', POSTES, 'Délais et couleurs', 'Vert, orange, rouge',
      'Chaque lead a un délai de premier contact. Les couleurs disent où tu en es.',
      [
        { title: 'Le compte à rebours', body: 'Vert : le temps qu’il reste avant le délai. Orange : moins de 40 % du délai restant. Rouge « +12 min » : délai dépassé. Au-delà de 24 h : la date d’arrivée.',
          bodyBy: { vroom: 'Depuis la réception dans BACS, coloré selon le délai de la source.' } },
        { title: 'Le délai du site', body: 'Il se compte en heures ouvrées depuis l’arrivée du lead sur le site ; la fiche l’affiche (« délai de rappel du site : 15 min ouvrées »). Au-delà, le chef des ventes est prévenu.',
          bodyBy: { vroom: '« Demande client (1h) » : pénalité constructeur au-delà d’une heure. Ces leads restent en bandeau sur tous les onglets tant qu’ils attendent. Le site a ensuite 2 h pour prendre un transfert.' } },
        { title: 'Le créneau choisi par le client', body: 'Quand le client a choisi l’heure de son rappel (message automatique), l’heure remplace le compte à rebours. « Créneau manqué » en rouge si l’heure est passée ; « Le client attend un appel maintenant » s’il a répondu « dès que possible ».',
          bodyBy: { vroom: 'Les rappels programmés (injoignable, projet long terme) affichent « maintenant », « retard 2 h 10 » ou « dans 1 h 30 ».' } },
      ]),
    lm('lm-bacs-sites', 'Premiers pas', '2 min', SITES, 'Ce qui part dans BACS', 'Plus besoin d’aller dans BACS',
      'Pour un lead venu de BACS, tes gestes dans One Data sont reportés automatiquement dans BACS.',
      [
        { title: 'Ce qui part dans BACS', body: 'Le RDV, l’attribution à un vendeur, le renvoi vers un autre site, la clôture avec son motif, le retour à la Vroom Team.' },
        { title: 'Ce qui reste dans One Data', body: 'Joint sans RDV, Pas joint et Rendre au Pool ne modifient pas BACS.' },
        { title: 'Où le voir', body: 'Dans la fiche du lead : le statut BACS, puis « Dans BACS » avec chaque envoi (fait, en attente, échec avec sa raison). Un échec se relance.' },
        { title: 'BACS fermé', body: 'Un bandeau rouge « BACS fermé sur ce poste » apparaît quand aucun onglet BACS n’est ouvert dans ton navigateur : les gestes sur les leads BACS sont alors refusés. Ouvre BACS et connecte-toi.' },
      ]),
    lm('lm-p-bacs', 'Premiers pas', '2 min', ['vroom'], 'BACS : un onglet ouvert, rien d’autre', 'One Data écrit dans BACS pour toi',
      'Tu ne travailles plus dans BACS : One Data y reporte chacun de tes gestes, par ta session BACS ouverte dans ce navigateur avec l’extension.',
      [
        { title: 'Le voyant', body: 'À côté de « Vroom Team » : BACS connecté (vert), en attente (orange), BACS fermé ou échecs (rouge).' },
        { title: 'Ce qui part', body: 'Prendre (Accepté), Qualifié (site et propriétaire), Injoignable (date de rappel, e-mail et SMS au client si tu les coches), Projet long terme, Abandon avec son motif et ton commentaire.' },
        { title: 'Un refus de BACS', body: 'Un bandeau rouge liste les gestes refusés : ces leads ne sont PAS à jour dans BACS. Ne les retraite pas : « Signaler au support ».' },
        { title: 'Vérifier', body: 'L’onglet « Mes actions » dit, geste par geste : reporté, en route, refusé, non reporté. « Corriger » reporte une correction dans BACS.' },
      ], { tour: 'lm-p-actions' }),

    /* ---------- Vendeur ---------- */
    lm('lm-v-pool', 'Vendeur', '1 min', ['vendeur'], 'Prendre un lead dans le Pool', 'Libre-service, premier arrivé',
      'Le Pool du site : les leads que personne n’a pris. Premier arrivé, premier servi.',
      [
        { title: 'Ce qui arrive dans le Pool', body: 'Le site web, Leboncoin, La Centrale, les e-mails, et les leads BACS qualifiés par la Vroom Team. À Lexus Sceaux, les demandes BACS arrivent directement.' },
        { title: 'Prendre', body: 'Le lead passe à ton nom, dans « À rappeler », et sa fiche s’ouvre. « Réservé par … » : un collègue le regarde en ce moment.' },
        { title: 'Le quart d’heure', body: 'Un lead pris et non traité (ni appel, ni geste) dans le quart d’heure revient tout seul dans le Pool.' },
        { title: 'Pas pour toi ?', body: 'Dans sa fiche, « Rendre au Pool » le remet à disposition de tes collègues.' },
      ]),
    lm('lm-v-fiche', 'Vendeur', '2 min', ['vendeur', 'chef'], 'La fiche du lead', 'Tout savoir avant d’appeler',
      'La fiche s’ouvre en plein écran, en trois colonnes. Lance la visite : elle ouvre une fiche d’exemple où rien n’est enregistré.',
      [
        { title: 'La demande', body: 'À gauche : ce que le client a demandé (VN ou VO, véhicule, message complet), la source, le statut BACS, ce que la Vroom Team a appris, ses coordonnées et « Ouvrir la fiche client ».' },
        { title: 'L’appel', body: 'Au centre : Appeler (par ton poste 3CX), SMS, WhatsApp, E-mail avec des modèles adaptés ; le message automatique reçu par le client et sa réponse ; Delco (stock, reprise, affaire en cours, atelier) ; le fil du client.' },
        { title: 'Le résultat', body: 'À droite : le résultat de l’appel et les délais. « Lead suivant » en haut enchaîne sans revenir à la liste.' },
        { title: 'L’avis sur la Vroom Team', body: 'Sur un lead qualifié par la Vroom Team, dis en un clic si la qualification était bonne : le plateau s’améliore avec tes retours.' },
      ]),
    lm('lm-v-apres', 'Vendeur', '2 min', ['vendeur', 'chef'], 'Après l’appel : dire ce qui s’est passé', 'RDV, joint, pas joint, clore',
      'En bas à droite de la fiche, quatre issues. Rien n’est enregistré tant que tu ne cliques pas le bouton de l’issue.',
      [
        { title: 'Joint · RDV', body: 'L’objet (RDV vente, essai, estimation de reprise, livraison VN ou VO), la date, les invités, puis enregistrer : le RDV s’inscrit dans ton agenda et, pour un lead BACS, dans BACS.' },
        { title: 'Joint · sans RDV', body: 'Une note si tu veux, puis « Enregistrer le contact ».' },
        { title: 'Pas joint', body: 'Choisis la prochaine tentative (dans 1 h, 2 h, ce soir 18:00, demain 9:00 ou 14:00, ou une date), puis « Noter la tentative 1 sur 3 ». Le lead passe dans Relances, rangé à cette heure.' },
        { title: 'Clore', body: 'Avec un motif : pas intéressé, injoignable, parti à la concurrence, doublon, fausse demande, autre. Un lead BACS est aussi clos dans BACS.' },
        { title: 'Sans fiche client', body: 'Si le lead n’a pas de fiche client, « Joint » te demande de choisir la bonne parmi celles proposées, ou d’en créer une : tu as le client au téléphone, c’est toi qui tranches.' },
      ]),
    lm('lm-v-rappeler', 'Vendeur', '1 min', ['vendeur'], 'À rappeler et Relances', 'Tes leads, dans l’ordre',
      'Deux listes pour tes leads : ceux pas encore contactés, et ceux déjà essayés.',
      [
        { title: 'À rappeler', body: 'Tes leads pas encore contactés, le plus urgent en haut. Chaque ligne : le délai, le client, sa demande et son état (nouveau, qualifié par la Vroom Team, repris du congélateur…), puis « Appeler ».' },
        { title: 'Relances', body: 'Les clients essayés sans les joindre (« pas joint ×2 »), à l’heure du rappel que tu as choisie. En rouge quand le rappel est dû.' },
        { title: 'Rappels programmés', body: 'Le bouton en haut ne garde que les leads à rappeler aujourd’hui ou demain, créneaux choisis par les clients compris.' },
        { title: 'Les anciens', body: 'Tes leads reçus il y a plus de 30 jours ne sont plus à appeler en priorité : ton chef des ventes les solde.' },
      ]),
    lm('lm-v-campagnes', 'Vendeur', '2 min', ['vendeur'], 'Campagnes : prendre et relancer', 'Libre-service, comme le Pool',
      'Une campagne (ex. « Lexus Black Friday ») propose des clients à relancer. Tu les prends toi-même, comme un lead.',
      [
        { title: 'L’avancement', body: 'En tête de chaque campagne : à prendre, pris par l’équipe, traités, propositions, commandes, tes clients, et la barre d’avancement.' },
        { title: 'Choisir', body: 'Les clients « À prendre » sont triés par priorité (sur 100) : véhicule, kilométrage, passages atelier, simulation BACS, renouvellement. Filtre par nom, ville, immatriculation, modèle ou critère.' },
        { title: 'Je prends, puis Traiter', body: '« Je prends » met le client à ton nom (« À relancer par vous »). « Traiter » ouvre le panneau : numéros, e-mail, véhicule, raisons, puis le résultat.' },
        { title: 'Le résultat', body: 'RDV pris (posé dans l’agenda), à rappeler (relance datée), messagerie (relance le lendemain 10 h), pas intéressé, déjà équipé, ne plus appeler. Ou « Rendre ».' },
      ]),

    /* ---------- Au quotidien, sur les sites ---------- */
    lm('lm-congelateur', 'Au quotidien', '1 min', SITES, 'Le Congélateur', 'Une deuxième chance',
      'Les leads que la Vroom Team a abandonnés dans BACS, avec leur motif.',
      [
        { title: 'Ce qu’on y trouve', body: 'Reçu le…, la demande, abandonné le…, et le motif de la Vroom Team avec son commentaire.' },
        { title: 'Prendre', body: 'Le lead passe à ton nom (À rappeler ; Mes leads pour un chef des ventes) et repasse « Accepté » dans BACS.' },
        { title: 'Sans délai', body: 'Ici, ni délai ni alerte : un lead repris du congélateur ne revient pas au Pool tout seul.' },
        { title: 'S’il n’aboutit pas', body: 'Dans sa fiche, « Remettre au congélateur » le rend à tes collègues, avec ton commentaire.' },
      ]),
    lm('lm-suivis', 'Au quotidien', '1 min', SITES, 'Suivis : un client rappelle', 'Retrouver sa demande',
      'Un client rappelle ? Retrouve sa demande et vois où elle en est, même si un collègue la suit.',
      [
        { title: 'Rechercher', body: 'Nom, téléphone, e-mail ou véhicule. Sans recherche : les demandes prises en charge ces 60 derniers jours, ou encore ouvertes.' },
        { title: 'Lire', body: 'Client, demande, suivi par (ou Pool), dernier geste, statut (et statut BACS), rappel prévu. Un clic ouvre la fiche du client.' },
        { title: 'Plusieurs sites', body: 'La recherche porte d’abord sur le site choisi en haut ; sans résultat, elle cherche sur tes autres sites et le signale.' },
      ]),
    lm('lm-historique', 'Au quotidien', '1 min', SITES, 'Historique', 'Ce qui a été fait',
      'Les leads traités et chaque geste : pris, attribué, joint, RDV posé, pas joint, clos.',
      [
        { title: 'Les filtres', body: 'Période, recherche, statut, résultat, source ; pour un chef des ventes, le vendeur.' },
        { title: 'Le statut actuel', body: 'Chaque ligne dit ce que le lead est devenu : vendu, en cours chez un collègue, perdu…' },
        { title: 'Le site', body: 'L’Historique suit le site choisi en haut à droite, comme le Pool et les campagnes.' },
      ]),

    /* ---------- Encadrement : chef des ventes, direction ---------- */
    lm('lm-c-pool', 'Encadrement', '2 min', ENC, 'Le Pool : laisser faire ou attribuer', 'Libre-service, suggestion',
      'Le Pool du site, avec la règle d’attribution et l’équipe.',
      [
        { title: 'La règle du site', body: 'Libre-service (les vendeurs se servent), par le chef, ou automatique. Chez Team Colin, les sites pilotes sont en libre-service.' },
        { title: 'Attribuer', body: '« Attribuer… » propose le vendeur suggéré (le moins chargé de l’équipe) ou un autre. En libre-service, l’attribution reste possible, en second.' },
        { title: 'Pour moi', body: 'Si tu vends aussi : « Pour moi » ou « Je le prends » met le lead dans « Mes leads ».' },
        { title: 'L’équipe', body: 'Sous le Pool (et sur l’Accueil, « Mon équipe ») : chaque vendeur, ses leads ouverts et en souffrance.' },
      ]),
    lm('lm-c-souffrance', 'Encadrement', '2 min', ENC, 'En souffrance : prévenir, réattribuer', 'Ce qui n’avance pas',
      'Les leads qui n’avancent pas chez un vendeur, regroupés par vendeur.',
      [
        { title: 'La définition', body: 'Pris sans appel depuis plus de 20 min, délai dépassé, gardé plus de 24 h, ou trois essais sans joindre le client.' },
        { title: 'Prévenir', body: 'Le vendeur reçoit une alerte avec la liste de ses leads en souffrance.' },
        { title: 'Réattribuer', body: '« Tout réattribuer… » les passe à un autre vendeur ou au Pool ; « Réattribuer › » lead par lead ouvre la fiche.' },
      ]),
    lm('lm-c-fiche', 'Encadrement', '2 min', ENC, 'Agir sur un lead', 'Quatre gestes',
      'Dans la fiche d’un lead de ton site, à droite : « Que faire de ce lead ? ».',
      [
        { title: 'Attribuer', body: 'Le vendeur, puis « Attribuer ». Dessous : « Confier à la Vroom Team » (lead BACS d’un site Toyota : rappel au plateau), « Rendre au Pool », « Je le prends ».' },
        { title: 'Résultat d’appel', body: 'Si tu as appelé toi-même : RDV, joint, pas joint ou clore.' },
        { title: 'Autre site', body: 'Le lead part dans le Pool du site choisi, délai remis à zéro. BACS reçoit le nouveau site.' },
        { title: 'Clore', body: 'Avec un motif. Un lead BACS est aussi abandonné dans BACS. Sur un site que tu n’encadres pas : vue de pilotage, tu lis sans agir.' },
      ]),
    lm('lm-c-comme', 'Encadrement', '1 min', ['chef'], 'Voir l’écran d’un vendeur', 'En lecture seule',
      'Le sélecteur « Vendeur » en haut des onglets montre l’écran d’un vendeur, exactement comme il le voit.',
      [
        { title: 'Choisir', body: 'Recherche, puis un clic sur le vendeur : son Pool, ses leads à rappeler, ses relances.' },
        { title: 'Lecture seule', body: 'Un bandeau le rappelle ; « Revenir à ma vue » le referme. Pour agir sur un lead, ouvre-le depuis ta vue.' },
      ]),
    lm('lm-c-solder', 'Encadrement', '1 min', ENC, 'Solder le stock', 'Les leads de plus de 24 h',
      'Les leads ouverts depuis plus de 24 h faussent les délais du site. Ils se traitent en une fois.',
      [
        { title: 'Où', body: 'Sur l’Accueil (Pilotage › « Ouverts depuis plus de 24 h · solder ») ou au pied du Pool (« Solder le stock »).' },
        { title: 'Trois choix', body: 'Confier les leads BACS à la Vroom Team (qui rappelle et requalifie), répartir sur l’équipe selon la règle du site, ou clore sans suite (« stock avant déploiement » : rien n’est effacé, BACS n’est pas modifié).' },
        { title: 'Appliquer', body: 'La fenêtre compte les leads avant tout geste ; rien ne part sans ton clic.' },
      ]),
    lm('lm-campagnes', 'Encadrement', '2 min', ENC, 'Créer et suivre une campagne', 'Relancer une cible',
      'Une campagne choisit des clients par critères et suit leurs relances.',
      [
        { title: 'Créer', body: '« Créer une campagne » : site, particuliers ou sociétés, marque, modèle, âge et kilométrage du véhicule, départements. La cible est estimée avant tout lancement.' },
        { title: 'Avec ou sans répartition', body: 'Répartie : chaque vendeur reçoit ses clients. Sans répartition : les vendeurs prennent eux-mêmes les clients dans leur onglet Campagnes, comme dans le Pool.' },
        { title: 'Suivre', body: 'Cibles, traitées (avec la barre d’avancement), à relancer, propositions, commandes. Un clic sur une campagne : vendeur par vendeur. L’avancement se lit avant le résultat.' },
      ]),
    lm('lm-d-perimetre', 'Encadrement', '1 min', ['manager'], 'Ton périmètre', 'Tous les sites ou un seul',
      'La direction voit tous ses sites ; le bouton « Périmètre » choisit une marque, une affaire ou un site.',
      [
        { title: 'Tous mes sites', body: 'Le Pool, les leads en souffrance et les campagnes de tout ton périmètre, chacun avec son site.' },
        { title: 'Un site', body: 'Tu le vois comme son chef des ventes. Sur un site que tu n’encadres pas : vue de pilotage, c’est le chef des ventes du site qui agit.' },
      ], { tour: 'lm-direction' }),

    /* ---------- Vroom Team ---------- */
    lm('lm-p-pool', 'Vroom Team', '2 min', ['vroom'], 'Le Pool BACS', 'Prendre le bon lead',
      'Les leads « À affecter » ou « Nouveau » de BACS, prêts à être pris.',
      [
        { title: 'Prendre le suivant', body: 'Le bouton en haut à droite prend le prochain lead à traiter, « Demande client (1h) » d’abord.' },
        { title: 'Les groupes', body: 'Demande client (1h) à prendre maintenant, Relance concession (48h), autres leads, trafic atelier par date de RDV atelier.' },
        { title: 'Moins de 24 h, plus de 24 h, stock', body: 'Les leads frais d’abord ; les plus anciens à part ; « Stock accepté » : acceptés il y a plus de 14 jours, sans suite. Les pastilles de sources ajoutent ou retirent une source (le trafic atelier est masqué par défaut).' },
        { title: 'Prendre', body: 'Réserve le lead à ton nom quelques minutes, le passe en Accepté dans BACS et ouvre sa fiche.' },
      ]),
    lm('lm-p-traiter', 'Vroom Team', '2 min', ['vroom'], 'Traiter un lead', 'Qualifier, orienter',
      'La fiche du lead, de haut en bas. Lance la visite : elle ouvre une fiche d’exemple où rien n’est réservé ni envoyé dans BACS.',
      [
        { title: 'Le client', body: 'Retrouvé dans One Data par son numéro, sinon cherché dans BACS, ou nouveau client.' },
        { title: 'Qualifier', body: 'Projet, modèle, échéance, reprise, financement, note pour le vendeur : c’est ce qu’il lira avant d’appeler.' },
        { title: 'Orienter', body: 'Le site BACS, puis ceux où le client a un dossier, puis les autres sites de la marque, chacun avec ses leads en attente. L’attribution : le Pool de la concession (règle du site) ou un vendeur précis.' },
        { title: 'Libérer', body: '« Libérer » rend le lead sans rien faire ; fermer la fiche fait de même.' },
      ]),
    lm('lm-p-issues', 'Vroom Team', '2 min', ['vroom'], 'Les quatre issues', 'Qualifié, injoignable, long terme, abandon',
      'En bas de la fiche, l’issue de ton appel. Chacune part dans BACS.',
      [
        { title: 'Qualifié', body: '« Transférer à … » : le lead part au site choisi avec ta qualification. BACS : Qualifié, site et propriétaire.' },
        { title: 'Injoignable', body: 'Un rappel dans 2 h, demain 9 h, après-demain 9 h ou à une date ; e-mail et SMS au client si tu les coches.' },
        { title: 'Projet long terme', body: 'Un rappel à la date choisie ; le lead revient dans Rappels dus.' },
        { title: 'Abandonner', body: 'Un commentaire pour BACS et le motif. Le lead part au Congélateur, où un vendeur peut le reprendre. Si le client a d’autres demandes ouvertes sur le site, une case propose de les clore aussi.' },
      ]),
    lm('lm-p-rappels', 'Vroom Team', '1 min', ['vroom'], 'Rappels dus', 'Injoignables et long terme',
      'Les leads à rappeler, du plus en retard au plus lointain.',
      [
        { title: 'Le minuteur', body: '« Maintenant », « retard 2 h 10 » ou « dans 1 h 30 », avec l’heure prévue, le statut BACS et le nombre de tentatives.' },
        { title: 'Les miens', body: 'Ne garde que les leads dont tu as fait le dernier geste.' },
        { title: 'L’arriéré BACS', body: 'Les rappels promis dans BACS avant One Data sont regroupés à part.' },
      ]),
    lm('lm-p-transferts', 'Vroom Team', '1 min', ['vroom'], 'Transferts', 'Ce que deviennent tes leads',
      'Les leads qualifiés ces 30 derniers jours. Le site a 2 h pour prendre un transfert.',
      [
        { title: 'L’état', body: 'Contacté par … en …, En attente chez …, Chef relancé, Converti, Clos par le site, Suivi dans BACS.' },
        { title: 'Relancer le chef', body: 'Après 2 h sans contact, le bouton envoie une alerte aux chefs des ventes du site.' },
      ]),
    lm('lm-p-campagnes', 'Vroom Team', '1 min', ['vroom'], 'Campagnes BACS', 'Filtrer une campagne',
      'Les campagnes BACS : reçus, à prendre, acceptés, en rappel, qualifiés, abandonnés, taux de qualification.',
      [
        { title: 'Filtrer', body: '« Filtrer » restreint le Pool, les rappels et les transferts à la campagne ; un bandeau le rappelle sous les onglets.' },
        { title: 'Ce qui ne change pas', body: 'La phrase du haut et le bandeau « Demande client (1h) » comptent toujours tout le plateau.' },
      ]),
    lm('lm-p-nouveau', 'Vroom Team', '1 min', ['vroom'], 'Nouveau lead et recherche', 'Un client appelle',
      'Un client appelle sans demande dans BACS, ou rappelle pour une demande en cours.',
      [
        { title: 'Rechercher', body: 'Nom, téléphone ou e-mail : la recherche porte sur tout le plateau.' },
        { title: '+ Nouveau lead', body: 'Le client (retrouvé par son numéro ou nouveau), la demande, la concession. S’il a déjà une demande ouverte, la fiche le signale.' },
      ]),

    /* ---------- Questions fréquentes ---------- */
    lm('lm-faq-sites', 'Questions fréquentes', '2 min', SITES, 'Questions fréquentes', 'Vendeurs, chefs, direction',
      'Les questions qui reviennent le plus sur les sites.',
      [
        { title: 'Un lead BACS manque dans le Pool.', body: 'Sur un site Toyota, il est encore à la Vroom Team : il arrivera une fois qualifié. Sinon, regarde le Congélateur.' },
        { title: 'Mon lead est revenu dans le Pool.', body: 'Pris mais ni appelé ni traité dans le quart d’heure : il revient au Pool. Reprends-le et appelle.' },
        { title: '« Appeler » ne fait rien.', body: 'L’appel passe par ton poste 3CX : vérifie qu’il est connecté. Sinon, copie le numéro.' },
        { title: 'Un geste BACS est refusé.', body: 'BACS doit être ouvert et connecté dans un onglet de ton navigateur ; un échec se relance depuis la fiche (« Dans BACS »).' },
        { title: 'Le même client a deux demandes.', body: '« + 1 autre demande » sur le lead : traite-les ensemble, et clos l’autre comme doublon.' },
      ], { tour: null }),
    lm('lm-faq-plateau', 'Questions fréquentes', '2 min', ['vroom'], 'Questions fréquentes', 'Vroom Team',
      'Les questions qui reviennent le plus au plateau.',
      [
        { title: 'Les boutons sont grisés.', body: 'BACS n’est pas ouvert ou a expiré : ouvre BACS dans un onglet et connecte-toi. Tout se réactive dans les 15 secondes.' },
        { title: 'Pool vide mais des leads dans BACS.', body: 'Regarde quand BACS a été relu (phrase du haut) ; si c’est ancien, recharge l’onglet BACS. Vérifie aussi les pastilles de sources.' },
        { title: 'Un onglet ne colle pas à la phrase.', body: 'Un filtre de campagne est actif : les onglets ne comptent que cette campagne.' },
        { title: '« Réservé par … ».', body: 'Un collègue traite ce lead ; il redevient libre à l’heure indiquée s’il n’a rien fait.' },
        { title: 'J’ai fermé la fiche par erreur.', body: 'Le lead est libéré : reprends-le avec « Prendre ». Rien n’a été enregistré à moitié.' },
      ], { tour: null }),
  ];

  /* =======================  CRM, TÉLÉPHONE  ======================= */
  const TUTOS = [
    { id: 'crm-start', product: 'crm', category: 'Démarrer', duration: '2 min', available: true, aud: ALL4,
      title: 'Démarrer', subtitle: 'Menus, recherche, site', tour: 'demarrer',
      intro: 'La barre du haut est la même partout. Lance la visite guidée pour la parcourir.',
      steps: [
        { title: 'Se connecter', body: 'Ton e-mail et ton mot de passe. À la première connexion, tu choisis ton mot de passe. « Mot de passe oublié ? » sous le formulaire t’envoie un lien par e-mail.' },
        { title: 'Les menus', body: 'Clients (Base client, Notifications), Ventes (Gestion des ventes, Performances, Objectifs), Management (Bilatérales, Suivi activité), Leads (Leads management, Leads performances), Véhicules (Stock VN, Stock VO). Ce que tu vois dépend de ton rôle.' },
        { title: 'La recherche', body: 'Un client, une immatriculation, un VIN, un téléphone, une affaire : quelques lettres suffisent, les résultats arrivent rangés par catégorie. Raccourci : Ctrl K.' },
        { title: 'Le site et le dernier client', body: 'Le site sur lequel tu travailles (à changer si tu es sur plusieurs sites) ; le dernier client ouvert, à rouvrir d’un clic.' },
        { title: 'Ton compte et le O', body: 'Les initiales en haut à droite : Mon compte, Annuaire, Tutos, Email Support, Se déconnecter. Le O en bas à droite : ton avis ou un problème, à l’écrit ou à la voix ; la réponse arrive dans le même fil.' },
      ] },
    { id: 'crm-tdb', product: 'crm', category: 'Piloter son activité', duration: '2 min', available: true, aud: ALL4,
      title: 'Tableau de bord', subtitle: 'Ta page d’accueil', tourBy: { vendeur: 'tdb', chef: 'tdb', manager: 'tdb', vroom: 'tdb-plateau' },
      intro: 'La page d’accueil répond à la question de ton rôle. Lance la visite guidée pour la parcourir.',
      steps: [
        { title: 'Le constat', body: 'Une question selon ton rôle (« Qui appeler aujourd’hui », « Qui décroche, et sur quoi »…), une phrase qui y répond et quatre chiffres.',
          bodyBy: { vroom: 'Ta journée : leads à traiter dans le Pool BACS, rappels dus, ce que tu as pris et transmis, transferts qui attendent un vendeur.' } },
        { title: 'Les tuiles', body: 'Rangées par famille. Un clic ouvre le détail juste dessous, avec « Ce qu’il faut en faire ». « Jamais contactés » ouvre le lead dans Lead management.',
          bodyBy: { vroom: 'Le Pool maintenant, ta journée, le plateau sur 14 et 30 jours, ce que deviennent les transferts, et les opérateurs.' } },
        { title: 'Le mois et le périmètre', body: 'Le mois en cours ou les deux précédents ; à droite, tout ton périmètre ou un site. Les chiffres se rafraîchissent toutes les 2 minutes.',
          bodyBy: { vroom: 'Les chiffres portent sur le plateau ; l’activité additionne l’historique BACS des comptes Vroom Team et tes gestes dans One Data.' } },
        { title: 'L’agenda', body: 'Sous le tableau de bord : ton agenda, tes RDV clients et tes bilatérales. Un RDV posé ici part aussi dans BACS.' },
      ] },
    { id: 'crm-activite', product: 'crm', category: 'Piloter son activité', duration: '3 min', available: true, aud: ALL,
      title: 'Suivi d’activité', subtitle: 'Un écran par rôle', tourBy: { vendeur: 'act-vendeur', chef: 'act-chef', manager: 'act-direction' },
      intro: 'Management › Suivi activité : un écran par question, selon ton rôle. Lance la visite guidée pour parcourir les tiens.',
      steps: [
        { title: 'Vendeur : Ma journée', body: '« Que dois-je faire aujourd’hui ? » Tes commandes du mois, tes relances en retard, la carte de tes opportunités (dans la zone rouge : délai de relance dépassé) et tes actions du jour.',
          bodyBy: { chef: 'Ton écran : Point du matin. Avec qui, sur quoi, avec quel levier : un vendeur par onglet, ses opportunités qui bloquent (avec « Ouvrir la fiche » ou « Note pour … »), et l’équipe en un regard.',
            manager: 'Tes écrans : Site et Groupe. Quel site, quel écart : commandes face à l’objectif, transformation et financement par site, ce qui mérite une question, parcours et motifs de perte.' } },
        { title: 'En direct', body: 'Pour l’encadrement : la journée d’une concession, pensée pour le téléphone, comparée à la même heure il y a 7 jours et mise à jour chaque minute. Un clic sur une tuile filtre le fil de la journée.' },
        { title: 'Les filtres', body: 'Tous, VN, VO ou Pro ; la période (aujourd’hui, hier, 7 jours, ce mois, ou le calendrier « 📅 du → au »).' },
        { title: 'Les définitions', body: 'Opportunités → simulations (devis BACS) → commandes. Commandes : VN à la transmission au constructeur, VO validées ou en attente d’approbation, hors grands comptes. Délai de relance : 3 jours (simulation, commande), 7 jours (opportunité sans simulation).' },
      ] },
    { id: 'crm-kanban', product: 'crm', category: 'Piloter son activité', duration: '2 min', available: true, aud: ALL,
      title: 'Gestion des ventes', subtitle: 'De la simulation à la commande', tour: 'gestion-ventes',
      intro: 'Ton pipe commercial, de la simulation à la commande validée. Lance la visite guidée pour le découvrir sur ton écran.',
      steps: [
        { title: 'Qui et quand', body: 'Vendeur : tes affaires. Chef des ventes : un vendeur de ton site. Direction : réseau, affaire, site, vendeur. La période revient au mois en cours à chaque visite.' },
        { title: 'Cinq colonnes', body: 'Simulations, Commandes, Demande d’approbation, Transmis TFR / Validée, Abandonné ; en tête, le nombre, le montant et le taux de passage.' },
        { title: 'Une affaire', body: 'Le statut BACS en haut, le client (vers sa fiche), le véhicule, le montant et l’âge. Loupe pour consulter, « B » pour ouvrir dans BACS.' },
        { title: 'Faire avancer', body: 'Glisse-dépose ou « Déplacer ». Une affaire BACS ne passe ici que de Simulations à Commandes : la suite se fait dans BACS. Transmis et Abandonné sont réservés aux managers.' } ] },
    { id: 'crm-performances', product: 'crm', category: 'Piloter son activité', duration: '3 min', available: true, aud: ALL,
      title: 'Performances : les ventes', subtitle: 'Réalisé vs objectifs', tour: 'performances',
      intro: 'Ventes › Performances, vue Ventes : ton réalisé face aux objectifs du reporting commandes (Cde, Cde part., Cde pro, FI, PHEV / EV, VU, Kinto, Arval). Lance la visite guidée pour parcourir la page.',
      steps: [
        { title: 'Choisis ce que tu regardes', body: 'Période, type (VN/VO), activité (réseau, grands comptes ou tous) et vue (pilotage ou mix produit).' },
        { title: 'Lis au prorata du mois', body: 'Chaque tuile : réalisé sur objectif. Vert si l’atteinte suit le mois écoulé, orange un peu en dessous, gris sans objectif.' },
        { title: 'Le périmètre et le reste à faire', body: 'L’arbre donne chaque site et chaque vendeur (toi : « vous »), avec ce qui reste à faire. Un chiffre ouvre les commandes qui le composent.' } ] },
    { id: 'crm-perf-leads', product: 'crm', category: 'Piloter son activité', duration: '2 min', available: true, aud: ALL,
      title: 'Performances : les leads', subtitle: 'Délai, contact, RDV, commande', tour: 'perf-leads',
      intro: 'Leads › Leads performances : les indicateurs du lead management sur la période et le site choisis. Lance la visite guidée pour parcourir la page.',
      steps: [
        { title: 'Six chiffres clés', body: 'Leads reçus, contactés, délai du premier contact (médian), part dans le délai, rendez-vous, commandes, avec leur tendance.' },
        { title: 'Le parcours', body: 'Du lead à la commande : chaque étape et ce qu’elle garde de la précédente ; les leads jour après jour, contactés à temps, en retard ou pas encore.' },
        { title: 'La rapidité paie', body: 'Ce que deviennent les leads selon le temps mis à les contacter ; quand arrivent les leads, par jour et par heure.' },
        { title: 'Les tableaux', body: 'Par source, par vendeur (pastille « dans le délai » : vert au-delà de 80 %), par site et pour la Vroom Team.' } ] },
    { id: 'crm-objectifs', product: 'crm', category: 'Piloter son activité', duration: '3 min', available: true, aud: ALL,
      title: 'Objectifs', subtitle: 'Définir et suivre', tour: 'objectifs',
      intro: 'Les objectifs du mois et ton rythme. La page s’adapte : tableau de marche pour le vendeur, saisie pour le chef des ventes. Lance la visite guidée pour la parcourir.',
      steps: [
        { title: 'Vendeur : ton rythme', body: 'Commandes particuliers, commandes pro, PHEV / EV, VU, Kinto, Arval : ton réalisé sur l’objectif, le trait bleu du mois écoulé, et la cadence pour finir dans les temps.' },
        { title: 'Chef : l’atelier', body: 'Pose la cible de commandes, laisse les taux du mois précédent déduire les autres cibles, puis répartis (équitable, prorata M-1, jours de présence) ou reconduis le mois précédent.' },
        { title: 'Brouillon puis enregistrement', body: 'Tout reste en brouillon, corrigeable case par case dans l’arbre, jusqu’à « Enregistrer les objectifs ».' } ] },
    { id: 'crm-client', product: 'crm', category: 'Le client', duration: '3 min', available: true, aud: ALL4,
      title: 'Fiche client (CRM 360)', subtitle: 'Tout le client sur une page', tour: 'fiche-client',
      intro: 'La fiche client réunit tout ce que le groupe sait d’un client, et tous les échanges avec lui. On l’ouvre par la recherche, depuis un lead, une affaire ou un RDV. Lance la visite guidée pour la parcourir.',
      steps: [
        { title: 'L’en-tête', body: 'Nom, téléphone, e-mail, type et ville. Appeler (3CX), WhatsApp, Email, SMS, RPV : chaque échange se range dans l’historique. « B » ouvre le compte du client dans BACS.' },
        { title: 'Fiche client', body: 'Identité, contact (un picto copie l’e-mail ou le portable), adresse, profil, véhicule déclaré, commentaires ; « Modifier la fiche » pour corriger. En bas, les consentements reflétés de BACS, par marque.' },
        { title: 'Contacts et RDV', body: 'Contacts : tous les échanges du cycle (appels avec résumé, SMS, WhatsApp, e-mails, RPV, leads). RDV : à venir, en retard, passés ; « Ajouter un RDV » ouvre l’agenda sur ce client.' },
        { title: 'Véhicules, Likes, P. Commerciales', body: 'Son parc (VIN, mise en circulation, factures atelier de tous les sites), les véhicules qui l’intéressent, ses affaires BACS version par version.' },
        { title: 'Entreprise, Entourage, Historique', body: 'Les sociétés dont il est l’interlocuteur (ou, pour une société, ses interlocuteurs), son entourage (conjoint, enfants, parrain…), ses cycles commerciaux du premier contact au résultat.' },
      ] },
    { id: 'crm-propales', product: 'crm', category: 'Le client', duration: '2 min', available: true, aud: ALL,
      title: 'Propositions commerciales', subtitle: 'Les affaires du client', tour: 'pcom',
      intro: 'L’onglet P. Commerciales de la fiche client montre des affaires, pas des papiers : une affaire, c’est une intention d’achat, avec ses simulations et ses commandes.',
      steps: [
        { title: 'Une affaire', body: 'Où on en est, depuis combien de temps rien ne bouge, et le montant qui engage : celui de la commande. Sans commande, une fourchette.' },
        { title: 'Les versions', body: 'Déplie l’affaire : chaque version avec son écart de prix, celle qui a été retenue, celles que le client a refusées. La mémoire de la négociation.' },
        { title: 'Chez tes collègues', body: 'Les affaires du client chez un collègue apparaissent sans détail (date, modèle, auteur) : tu sais qu’il est suivi.' },
        { title: 'Créer, modifier', body: 'Chez Team Colin, simulations et bons de commande se font dans BACS : ils remontent ici et dans la gestion des ventes. La loupe consulte, « B » ouvre dans BACS.' },
      ] },
    { id: 'crm-whatsapp', product: 'crm', category: 'Le client', duration: '2 min', available: true, aud: ALL4,
      title: 'Messagerie WhatsApp', subtitle: 'Échanger avec ses clients',
      intro: 'Le bouton WhatsApp de la fiche client (ou de la fiche d’un lead) ouvre la conversation avec le client, depuis le numéro de la concession ou le tien s’il est raccordé.',
      steps: [
        { title: 'Ouvrir la conversation', body: 'Tout l’échange avec le client s’affiche, y compris celui d’un collègue sur le même site.' },
        { title: 'Le premier message', body: 'WhatsApp n’autorise un message libre que dans les 24 h qui suivent la dernière réponse du client. Au-delà, choisis un motif (ou un modèle) : un message validé par Meta part, et la conversation s’ouvre quand le client répond.' },
        { title: 'Écrire', body: 'Texte, photos (remises à l’endroit automatiquement), pièces jointes, modèles de messages.' },
        { title: 'Ton numéro', body: 'Si ton propre numéro WhatsApp Business est raccordé, tes clients reçoivent le message du numéro qu’ils connaissent, et la conversation est la même que sur ton téléphone.' },
      ] },
    { id: 'crm-emails', product: 'crm', category: 'Le client', duration: '2 min', available: true, aud: ALL4,
      title: 'E-mails et SMS', subtitle: 'Rédiger, modèles, dictée',
      intro: 'Les boutons Email et SMS de la fiche client (ou de la fiche d’un lead) ouvrent une fenêtre d’écriture. Les envois se rangent dans les contacts du client.',
      steps: [
        { title: 'Les modèles', body: '« Modèles » remplit le message (objet et texte pour un e-mail) avec les données du client ou du lead. Les [données manquantes] restées dans le texte bloquent l’envoi tant qu’elles y sont.' },
        { title: 'Le SMS', body: 'Entrée passe à la ligne, Ctrl + Entrée envoie. Le fil des SMS du client s’affiche au-dessus.' },
        { title: 'Mes modèles', body: 'Un message que tu réutilises ? « Enregistrer mon message comme modèle » le garde pour la prochaine fois.' },
        { title: 'La dictée', body: 'Le micro dicte le texte. Dis « virgule », « point final », « à la ligne », « nouveau paragraphe »… La dictée s’arrête à l’envoi ou dès que tu tapes au clavier.' },
        { title: 'L’e-mail', body: 'Il part de ta boîte reliée à One Data, avec ta signature. Sans boîte reliée, le panneau Signature l’explique.' },
      ] },
    { id: 'crm-bilaterales', product: 'crm', category: 'Management', duration: '3 min', available: true, aud: ALL,
      title: 'Bilatérales', subtitle: 'Planifier, mener, suivre', tour: 'bilaterales',
      intro: 'Management › Bilatérales : l’entretien régulier entre un vendeur et son chef des ventes. Chez Team Colin, au moins une par semaine et par vendeur. Lance la visite guidée pour parcourir la page.',
      steps: [
        { title: 'Vendeur : ma prochaine bilatérale', body: 'Planifiée par ton chef des ventes, avec son ordre du jour ; tes engagements en cours et tenus ; les chiffres qui seront regardés, les mêmes que ceux de ton chef.',
          bodyBy: { chef: '« À recevoir en priorité » classe tes vendeurs par un score expliqué (écart à l’objectif, baisse de transformation, ancienneté de la dernière bilatérale, engagements non tenus). « Suivi de l’équipe » montre la régularité de chacun.',
            manager: '« Encadrement » montre la régularité de chaque chef des ventes ; un clic sur un chef ouvre son équipe. « À recevoir en priorité » : les vendeurs de ton périmètre.' } },
        { title: 'Planifier', body: 'Deux clics depuis la ligne d’un vendeur : la date, l’heure et l’ordre du jour (pastilles de points récurrents ou texte libre). « Planifier les 5 premiers » d’un coup ; « Mener maintenant » démarre l’entretien tout de suite.' },
        { title: 'Mener l’entretien', body: 'La fiche ouvre sur la revue des engagements, pré-remplit le bilan avec les constats chiffrés (commandes, affaires à relancer, leads, RDV) et propose des engagements datés et chiffrés. Le mode réunion met les chiffres en grand.' },
        { title: 'Enregistrer', body: 'Pendant l’entretien, pas après : sinon la bilatérale reste « non renseignée » et ressort en retard. La suivante est proposée à la bonne cadence, planifiable d’un clic.' },
      ] },
    { id: 'crm-team', product: 'crm', category: 'Management', duration: '2 min', available: true, aud: ENC,
      title: 'Piloter son équipe', subtitle: 'Le rituel de la semaine',
      intro: 'Les écrans de l’encadrement, dans l’ordre où on s’en sert.',
      steps: [
        { title: 'Chaque matin', body: 'Suivi activité › Point du matin : un vendeur après l’autre, ses opportunités qui bloquent et une action chacun. Puis Leads management : « À traiter maintenant » et le Pool.' },
        { title: 'Dans la journée', body: 'Suivi activité › En direct, sur téléphone : commandes, simulations, leads et RDV du jour. Lead management › En souffrance : prévenir ou réattribuer.' },
        { title: 'Chaque semaine', body: 'Une bilatérale par vendeur : préparée sur ses chiffres, enregistrée pendant l’entretien, avec des engagements datés.' },
        { title: 'Chaque mois', body: 'Objectifs : la cible, la répartition, l’enregistrement. Performances (Ventes et Leads) pour suivre le rythme.' },
      ] },
    { id: 'crm-delco', product: 'crm', category: 'Management', duration: '2 min', available: true, aud: ENC,
      title: 'Delco (assistant IA)', subtitle: 'Signaux et questions', tour: 'delco',
      intro: 'Delco lit les données de ton périmètre et te signale ce qui mérite ton attention. On le trouve sur sa page et dans la fiche de chaque lead.',
      steps: [
        { title: 'Le brief et le radar', body: 'Les sujets du moment, regroupés (« 14 leads sans premier contact · 7 vendeurs »), à déplier par vendeur ou par site. Le radar : une bulle par sujet, taille = volume, distance au centre = ancienneté, couleur = priorité.' },
        { title: 'Analyser, plus tard', body: '« Analyser » envoie le sujet au chat ; « Plus tard » l’écarte.' },
        { title: 'Le chat', body: 'Pose une question métier : Delco répond avec des chiffres justes, au fil de la rédaction. Un pouce sous chaque réponse pour dire si elle t’a servi.' },
        { title: 'Rien sans ton clic', body: 'Quand Delco propose un RDV ou un message, il affiche une carte « Valider / Ignorer » : rien n’est fait sans ton accord.' },
      ] },

    /* Téléphone : 3CX (plus d'application Android chez Team Colin) */
    { id: 'tel-appeler', product: 'phone', category: 'Téléphone 3CX', duration: '1 min', available: true, aud: ALL4,
      title: 'Appeler un client', subtitle: 'Depuis One Data, avec ton poste',
      intro: 'Tu appelles depuis One Data ; ton poste 3CX (combiné ou application 3CX) porte la voix.',
      steps: [
        { title: 'Appeler', body: 'Le bouton « Appeler » de la fiche client ou de la fiche d’un lead, ou un clic sur un numéro de téléphone : ton poste 3CX compose le numéro.' },
        { title: 'Pendant l’appel', body: 'Un panneau en bas à droite suit l’appel (chronomètre, client). Tu décroches et raccroches toujours sur ton combiné ou ton téléphone.' },
        { title: 'Si rien ne se passe', body: 'Le panneau le dit (pas de poste, poste injoignable) et se referme seul. Vérifie que ton poste 3CX est connecté ; sinon copie le numéro.' },
        { title: 'Après', body: 'L’appel est rangé dans les contacts du client. Sur un lead, dis ce qui s’est passé : voir « Après l’appel ».' },
      ] },
    { id: 'tel-entrant', product: 'phone', category: 'Téléphone 3CX', duration: '1 min', available: true, aud: ALL4,
      title: 'Un client t’appelle', subtitle: 'Le panneau d’appel',
      intro: 'Quand ton poste sonne, One Data affiche qui appelle, avant même que tu décroches.',
      steps: [
        { title: 'À la sonnerie', body: 'Le panneau montre le client (s’il est connu) et la préconisation de Delco. « Voir la fiche » ouvre sa fiche client.' },
        { title: 'Ta ligne', body: 'Ton poste et ta ligne directe sont ceux de l’annuaire 3CX, repris automatiquement dans One Data (menu de ton compte › Annuaire).' },
      ] },
  ].concat(TUTOS_LEADS);

  /* =======================  ÉTAT  ======================= */
  const STORE_KEY = 'onedata_tutos';
  const state = loadState();
  window.__tutosState = state;
  let curFilter = 'all', curSearch = '';
  function loadState() { try { return Object.assign({ brand: null, checks: {}, learned: {} }, JSON.parse(win.localStorage.getItem(STORE_KEY) || '{}')); } catch (e) { return { brand: null, checks: {}, learned: {} }; } }
  function saveState() { try { win.localStorage.setItem(STORE_KEY, JSON.stringify(state)); } catch (e) {} }

  /* =======================  HELPERS  ======================= */
  function el(tag, attrs, kids) {
    const n = doc.createElement(tag);
    if (attrs) for (const k in attrs) { const v = attrs[k];
      if (k === 'class') n.className = v; else if (k === 'html') n.innerHTML = v; else if (k === 'text') n.textContent = v;
      else if (k.slice(0, 2) === 'on' && typeof v === 'function') n.addEventListener(k.slice(2).toLowerCase(), v);
      else if (v != null) n.setAttribute(k, v); }
    if (kids != null) (Array.isArray(kids) ? kids : [kids]).forEach(c => { if (c == null) return; n.appendChild(typeof c === 'string' ? doc.createTextNode(c) : c); });
    return n;
  }
  function clear(n) { while (n.firstChild) n.removeChild(n.firstChild); }
  function norm(s) { return (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }

  function visibleTutos() {
    const p = posteLeads();
    return TUTOS.filter(t => (t.aud || ALL).includes(group) && (t.poste == null || t.poste === p));
  }
  const ORDRE_CAT = ['Démarrer', 'Piloter son activité', 'Le client', 'Management', 'Téléphone 3CX'];
  function tourOf(t) { return (t.tourBy && t.tourBy[group]) || t.tour || null; }
  // Ordre des sous-sections Lead management : premiers pas, le poste de
  // l'utilisateur, les autres postes, les questions fréquentes.
  function rangCat(c) {
    const mien = { vendeur: 'Vendeur', chef: 'Encadrement', manager: 'Encadrement', vroom: 'Vroom Team' }[group];
    if (c === 'Premiers pas') return 0;
    if (c === mien) return 1;
    if (c === 'Au quotidien') return 2;
    if (c === 'Questions fréquentes') return 9;
    const i = ORDRE_CAT.indexOf(c);
    return i === -1 ? 5 : 10 + i;
  }
  function suivants(t) {
    const ls = visibleTutos().filter(x => x.product === t.product && x.available);
    return ls.map((x, i) => [x, i]).sort((a, b) => (rangCat(a[0].category) - rangCat(b[0].category)) || (a[1] - b[1])).map(a => a[0]).filter(x => x.id !== t.id);
  }
  const PRODUITS = { leads: 'Lead management', crm: 'CRM', phone: 'Téléphone 3CX' };
  function learnable() { return visibleTutos().filter(t => t.available); }
  function isLearned(t) { return !!state.learned[t.id]; }
  function scorePct() { const L = learnable(); return L.length ? Math.round(L.filter(isLearned).length / L.length * 100) : 0; }
  function niveau(p) { if (p >= 100) return 'Expert'; if (p >= 67) return 'Confirmé'; if (p >= 34) return 'En progression'; if (p > 0) return 'Débutant'; return 'Nouveau'; }

  let toastTimer;
  function toast(msg) { let t = doc.getElementById('od-toast'); if (!t) { t = el('div', { id: 'od-toast', class: 'od-toast' }); mount.appendChild(t); } t.textContent = msg; t.classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => t.classList.remove('show'), 2200); }

  /* =======================  CSS  ======================= */
  function injectCSS() {
    if (doc.getElementById('od-tutos-css')) return;
    if (!doc.getElementById('od-tutos-font')) (doc.head || doc.documentElement).appendChild(el('link', { id: 'od-tutos-font', rel: 'stylesheet', href: 'https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700;800&display=swap' }));
    const css = `
.od-tutos{--p:#2a5ea9;--a:#53bda7;--bl:#acc5e4;--o:#fac055;--d:#e24b4a;--t:#1c2b45;--s:#f6f8fc;font-family:'Nunito Sans',-apple-system,Segoe UI,Roboto,sans-serif;color:var(--t);max-width:900px;margin:0 auto;padding:18px 16px 64px;}
.od-tutos *{box-sizing:border-box;}
.od-top{display:flex;justify-content:space-between;align-items:flex-start;gap:16px;flex-wrap:wrap;}
.od-tutos h1{font-size:26px;font-weight:800;margin:0 0 4px;}
.od-tutos .sub{color:#5b6b86;font-size:15px;margin:0;}
.od-score{display:flex;align-items:center;gap:12px;background:#fff;border:1px solid #e6ebf4;border-radius:14px;padding:10px 14px;}
.od-score .lvl{font-size:13px;color:#7282a0;}
.od-score .lvl b{display:block;color:var(--t);font-size:16px;}
.od-coach{background:linear-gradient(135deg,#2a5ea9,#3f78c9);border-radius:18px;padding:18px;margin:18px 0;color:#fff;box-shadow:0 10px 30px rgba(42,94,169,.25);}
.od-coach h2{margin:0 0 2px;font-size:19px;font-weight:800;}
.od-coach p.h{margin:0 0 12px;opacity:.85;font-size:14px;}
.od-ask{display:flex;gap:8px;}
.od-ask input{flex:1;border:none;border-radius:11px;padding:13px 15px;font:inherit;font-size:15px;outline:none;}
.od-ask button{border:none;border-radius:11px;padding:0 18px;background:var(--a);color:#fff;font:inherit;font-weight:700;cursor:pointer;}
.od-ask button:disabled{opacity:.6;cursor:default;}
.od-sugg{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;}
.od-sugg button{background:rgba(255,255,255,.16);border:1px solid rgba(255,255,255,.3);color:#fff;border-radius:999px;padding:6px 12px;font:inherit;font-size:13px;cursor:pointer;}
.od-sugg button:hover{background:rgba(255,255,255,.26);}
.od-ans{background:rgba(255,255,255,.12);border-radius:12px;padding:14px;margin-top:12px;font-size:15px;line-height:1.55;display:none;}
.od-ans.on{display:block;}
.od-ans p{margin:0 0 8px;} .od-ans p:last-child{margin:0;}
.od-ans .links{display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;}
.od-ans .links a{background:#fff;color:var(--p);border-radius:999px;padding:6px 12px;font-size:13px;font-weight:700;text-decoration:none;cursor:pointer;}
.od-search{width:100%;padding:13px 16px;border:1px solid #d4dcea;border-radius:12px;font:inherit;font-size:15px;background:#fff;outline:none;}
.od-search:focus{border-color:var(--p);box-shadow:0 0 0 3px rgba(42,94,169,.12);}
.od-chips{display:flex;gap:8px;flex-wrap:wrap;margin:14px 0 6px;}
.od-chip{border:1px solid #d4dcea;background:#fff;color:var(--t);padding:7px 14px;border-radius:999px;font:inherit;font-size:14px;cursor:pointer;transition:.15s;}
.od-chip:hover{border-color:var(--bl);} .od-chip.on{background:var(--p);border-color:var(--p);color:#fff;font-weight:700;}
.od-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:14px;margin-top:16px;}
.od-card{background:#fff;border:1px solid #e6ebf4;border-radius:14px;padding:16px;cursor:pointer;transition:.18s;display:flex;flex-direction:column;gap:8px;position:relative;}
.od-card:hover{transform:translateY(-2px);box-shadow:0 8px 22px rgba(28,43,69,.10);border-color:var(--bl);}
.od-card.soon{cursor:default;opacity:.7;} .od-card.soon:hover{transform:none;box-shadow:none;border-color:#e6ebf4;}
.od-card .done-dot{position:absolute;top:14px;right:14px;width:20px;height:20px;border-radius:50%;background:var(--a);display:none;align-items:center;justify-content:center;}
.od-card.learned .done-dot{display:flex;} .od-card .done-dot svg{width:12px;height:12px;}
.od-badge{display:inline-block;font-size:11px;font-weight:800;letter-spacing:.02em;padding:3px 9px;border-radius:999px;width:fit-content;}
.od-badge.phone{background:rgba(83,189,167,.16);color:#2c7a68;} .od-badge.crm{background:rgba(42,94,169,.12);color:var(--p);} .od-badge.soon{background:#eef1f7;color:#8895ad;}
.od-badge.leads{background:#1F4A85;color:#fff;}
.od-sec{font-size:18px;font-weight:800;color:#1F4A85;margin:26px 0 2px;}
.od-sec-leads{display:flex;align-items:center;gap:8px;}
.od-sec-leads::after{content:'Ton poste, geste par geste';font-size:13px;font-weight:600;color:#7282a0;}
.od-grid-s{margin-top:4px;}
.od-card .meta-s{font-size:13px;color:#41506b;margin-top:-4px;}
.od-next{display:flex;flex-wrap:wrap;gap:8px;}
.od-nx{display:inline-flex;align-items:center;gap:6px;border:1px solid #d4dcea;background:#fff;color:var(--p);border-radius:999px;padding:7px 13px;font:inherit;font-size:13.5px;font-weight:700;cursor:pointer;}
.od-nx:hover{border-color:var(--p);} .od-nx.learned{color:#2c7a68;border-color:rgba(83,189,167,.5);} .od-nx i{font-style:normal;}
.od-card h3{margin:0;font-size:16px;font-weight:700;} .od-card .meta{font-size:13px;color:#8895ad;}
.od-empty{text-align:center;color:#8895ad;padding:40px 0;}
.od-back{background:none;border:none;color:var(--p);font:inherit;font-size:15px;font-weight:700;cursor:pointer;padding:6px 0;}
.od-detail h2{font-size:22px;font-weight:800;margin:6px 0 2px;} .od-detail .intro{color:#5b6b86;font-size:15px;margin:8px 0 18px;}
.od-tour-btn{display:flex;align-items:center;justify-content:center;gap:9px;width:100%;margin:2px 0 20px;background:linear-gradient(135deg,#2a5ea9,#3f78c9);color:#fff;border:none;border-radius:12px;padding:14px;font:inherit;font-weight:800;font-size:15px;cursor:pointer;box-shadow:0 8px 22px rgba(42,94,169,.22);transition:.15s;}
.od-tour-btn:hover{filter:brightness(1.05);transform:translateY(-1px);}
.od-tour-btn svg{flex-shrink:0;}
.od-step{display:flex;gap:14px;padding:14px 0;border-top:1px solid #eef1f7;} .od-step:first-of-type{border-top:none;}
.od-num{flex:0 0 30px;height:30px;border-radius:50%;background:var(--p);color:#fff;font-weight:700;display:flex;align-items:center;justify-content:center;font-size:14px;}
.od-step .st-t{font-weight:700;margin:2px 0 4px;} .od-step .st-b{color:#41506b;font-size:15px;line-height:1.5;}
.od-act{margin-top:8px;background:var(--a);color:#fff;border:none;border-radius:9px;padding:8px 14px;font:inherit;font-weight:700;cursor:pointer;}
.od-learn{margin-top:22px;width:100%;border:2px solid var(--a);background:#fff;color:#2c7a68;border-radius:12px;padding:13px;font:inherit;font-weight:800;cursor:pointer;}
.od-learn.on{background:var(--a);color:#fff;}
.od-sec-title{font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;color:#8895ad;margin:22px 0 10px;}
.od-check{display:flex;gap:12px;align-items:flex-start;padding:12px 14px;border:1px solid #e6ebf4;border-radius:11px;margin-bottom:8px;cursor:pointer;background:#fff;transition:.15s;}
.od-check:hover{border-color:var(--bl);} .od-check.done{background:rgba(83,189,167,.07);border-color:rgba(83,189,167,.4);}
.od-box{flex:0 0 22px;height:22px;border-radius:6px;border:2px solid #c3cde0;display:flex;align-items:center;justify-content:center;margin-top:1px;}
.od-check.done .od-box{background:var(--a);border-color:var(--a);} .od-box svg{width:14px;height:14px;display:none;} .od-check.done .od-box svg{display:block;}
.od-check .ck-l{font-weight:600;font-size:15px;} .od-check .ck-h{color:#7282a0;font-size:13px;margin-top:2px;}
.od-progress{height:8px;background:#e9eef6;border-radius:999px;overflow:hidden;margin:6px 0 4px;} .od-progress i{display:block;height:100%;background:var(--a);width:0;transition:width .3s;}
.od-progress-l{font-size:13px;color:#7282a0;margin-bottom:14px;}
.od-ready{background:rgba(83,189,167,.14);color:#2c7a68;border:1px solid rgba(83,189,167,.4);border-radius:11px;padding:12px 14px;font-weight:700;display:none;align-items:center;gap:8px;} .od-ready.on{display:flex;}
.od-tip{background:rgba(250,192,85,.14);border:1px solid rgba(250,192,85,.5);border-radius:11px;padding:13px 15px;margin-top:20px;} .od-tip b{color:#9a6a00;}
.od-toast{position:fixed;left:50%;bottom:26px;transform:translateX(-50%) translateY(14px);background:var(--t);color:#fff;padding:11px 18px;border-radius:10px;font-size:14px;opacity:0;pointer-events:none;transition:.25s;z-index:9999;} .od-toast.show{opacity:1;transform:translateX(-50%) translateY(0);}
`;
    (doc.head || doc.documentElement).appendChild(el('style', { id: 'od-tutos-css', html: css }));
  }
  const CHK = '<svg viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
  function ringSVG(pct) { const r = 30, c = 2 * Math.PI * r, off = c * (1 - pct / 100);
    return `<svg width="74" height="74" viewBox="0 0 74 74"><circle cx="37" cy="37" r="${r}" fill="none" stroke="#e9eef6" stroke-width="7"/><circle cx="37" cy="37" r="${r}" fill="none" stroke="#53bda7" stroke-width="7" stroke-linecap="round" stroke-dasharray="${c}" stroke-dashoffset="${off}" transform="rotate(-90 37 37)"/><text x="37" y="42" text-anchor="middle" font-size="18" font-weight="800" fill="#1c2b45">${pct}%</text></svg>`; }

  /* =======================  COACH  ======================= */
  async function askCoach(q) {
    const res = await ctx.fn('tutos-coach', { question: q, role: roleNum, catalog: visibleTutos().map(t => ({ id: t.id, title: t.title, desc: (t.product === 'leads' ? 'Lead management · ' : '') + (t.subtitle || t.category) })) });
    return res.json();
  }

  /* =======================  RENDER  ======================= */
  let mount;
  function build(root) { injectCSS(); mount = root; mount.className = 'od-tutos'; win.addEventListener('hashchange', routeFromHash); routeFromHash(); }
  function routeFromHash() { const m = (win.location.hash || '').match(/tuto=([\w-]+)/); const t = m && visibleTutos().find(x => x.id === m[1] && x.available); if (t) renderDetail(t); else renderHome(); }
  function go(id) { win.location.hash = id ? ('tuto=' + id) : ''; try { (mount && mount.scrollIntoView) && mount.scrollIntoView({ block: 'start' }); } catch (e) {} }

  function renderHome() {
    clear(mount);
    const pct = scorePct(), L = learnable(), remain = L.filter(t => !isLearned(t)).length;
    const top = el('div', { class: 'od-top' });
    const left = el('div', {});
    left.appendChild(el('h1', { text: 'Centre d\u2019aide One Data' }));
    left.appendChild(el('p', { class: 'sub', text: 'Apprends l\u2019app à ton rythme — et demande au coach quand tu bloques.' }));
    top.appendChild(left);
    const score = el('div', { class: 'od-score' });
    score.appendChild(el('div', { html: ringSVG(pct) }));
    score.appendChild(el('div', { class: 'lvl', html: 'Niveau<b>' + niveau(pct) + '</b>' + (remain ? ('Reste ' + remain + ' tuto' + (remain > 1 ? 's' : '')) : 'Tout est acquis 🎉') }));
    top.appendChild(score);
    mount.appendChild(top);

    const coach = el('div', { class: 'od-coach' });
    coach.appendChild(el('h2', { text: 'Demande à Delco' }));
    coach.appendChild(el('p', { class: 'h', text: 'Pose ta question, il te répond et te pointe le bon tuto.' }));
    const ask = el('div', { class: 'od-ask' });
    const input = el('input', { type: 'text', placeholder: 'Ex. : comment passer un appel ?' });
    const send = el('button', { text: 'Demander' });
    const ans = el('div', { class: 'od-ans' });
    function submit() {
      const q = input.value.trim(); if (!q) return;
      send.disabled = true; ans.classList.add('on'); clear(ans); ans.appendChild(el('p', { text: 'Delco réfléchit…' }));
      askCoach(q).then(r => {
        clear(ans);
        String(r.answer || 'Je n\u2019ai pas de réponse.').split(/\n+/).forEach(line => { if (line.trim()) ans.appendChild(el('p', { text: line.trim() })); });
        const vis = visibleTutos(); const ids = (r.tutos || []).map(id => vis.find(t => t.id === id && t.available)).filter(Boolean);
        if (ids.length) { const links = el('div', { class: 'links' }); ids.forEach(t => links.appendChild(el('a', { text: t.title, onclick: () => go(t.id) }))); ans.appendChild(links); }
      }).catch(() => { clear(ans); ans.appendChild(el('p', { text: 'Désolé, le coach est indisponible. Réessaie.' })); })
        .finally(() => { send.disabled = false; });
    }
    send.addEventListener('click', submit);
    input.addEventListener('keydown', e => { if (e.key === 'Enter') submit(); });
    ask.appendChild(input); ask.appendChild(send);
    coach.appendChild(ask);
    const sugg = el('div', { class: 'od-sugg' });
    suggestions().forEach(q => sugg.appendChild(el('button', { text: q, onclick: () => { input.value = q; submit(); } })));
    coach.appendChild(sugg);
    coach.appendChild(ans);
    mount.appendChild(coach);

    const search = el('input', { class: 'od-search', type: 'text', placeholder: 'Rechercher un tutoriel\u2026', value: curSearch });
    search.addEventListener('input', () => { curSearch = search.value; updateList(); });
    mount.appendChild(search);
    const chips = el('div', { class: 'od-chips' });
    const aLeads = visibleTutos().some(t => t.product === 'leads');
    if (curFilter === 'leads' && !aLeads) curFilter = 'all';
    (aLeads ? [['all', 'Tout'], ['leads', 'Lead management'], ['crm', 'CRM'], ['phone', 'Téléphone 3CX']] : [['all', 'Tout'], ['crm', 'CRM'], ['phone', 'Téléphone 3CX']]).forEach(([k, lbl]) => chips.appendChild(el('button', { class: 'od-chip' + (curFilter === k ? ' on' : ''), text: lbl, onclick: () => { curFilter = k; renderHome(); } })));
    mount.appendChild(chips);
    mount.appendChild(el('div', { id: 'od-list' }));
    updateList();
  }

  function suggestions() {
    if (group === 'vroom') return ['Les boutons Prendre sont grisés', 'Comment qualifier un lead ?', 'Que deviennent mes transferts ?'];
    if (posteLeads() && group === 'chef') return ['Réattribuer un lead en souffrance', 'Planifier une bilatérale', 'Créer une campagne'];
    if (posteLeads() && group === 'vendeur') return ['Que faire après un appel ?', 'Prendre un lead dans le Pool', 'Relancer un client de campagne'];
    if (group === 'vendeur') return ['Comment appeler un client ?', 'Où voir les affaires d\u2019un client ?', 'Lire mon tableau de bord'];
    if (group === 'chef') return ['Planifier une bilatérale', 'Lire le point du matin', 'Fixer les objectifs du mois'];
    return ['Lire le suivi d\u2019activité', 'Choisir un site dans mon périmètre', 'Lire les performances leads'];
  }

  function updateList() {
    const box = mount && mount.querySelector('#od-list'); if (!box) return; clear(box);
    const q = norm(curSearch);
    const list = visibleTutos().filter(t => {
      if (curFilter !== 'all' && t.product !== curFilter) return false;
      if (!q) return true; return norm(t.title).includes(q) || norm(t.category).includes(q) || norm(t.subtitle).includes(q) || norm(PRODUITS[t.product]).includes(q);
    });
    if (!list.length) { box.appendChild(el('div', { class: 'od-empty', text: 'Aucun tutoriel ne correspond.' })); return; }
    // Une section par produit (Lead management d'abord) ; à l'intérieur de la
    // section Lead management, un sous-titre par poste.
    const ordre = ['leads', 'crm', 'phone'].filter(p => list.some(t => t.product === p));
    ordre.forEach(p => {
      const ls = list.filter(t => t.product === p);
      if (ordre.length > 1 || p === 'leads') box.appendChild(el('div', { class: 'od-sec od-sec-' + p, text: PRODUITS[p] }));
      const cats = []; ls.forEach(t => { if (!cats.includes(t.category)) cats.push(t.category); });
      cats.sort((x, y) => rangCat(x) - rangCat(y));
      cats.forEach(c => {
        if (cats.length > 1) box.appendChild(el('div', { class: 'od-sec-title', text: c }));
        const g = el('div', { class: 'od-grid od-grid-s' }); ls.filter(t => t.category === c).forEach(t => g.appendChild(card(t))); box.appendChild(g);
      });
    });
  }

  function card(t) {
    const c = el('div', { class: 'od-card' + (t.available ? '' : ' soon') + (isLearned(t) ? ' learned' : '') });
    c.appendChild(el('div', { class: 'done-dot', html: CHK }));
    c.appendChild(el('span', { class: 'od-badge ' + t.product, text: PRODUITS[t.product] || 'CRM' }));
    c.appendChild(el('h3', { text: t.title }));
    if (t.available && t.subtitle && t.product === 'leads') c.appendChild(el('div', { class: 'meta-s', text: t.subtitle }));
    c.appendChild(el('div', { class: 'meta', text: t.available ? (t.category + ' \u00b7 ' + t.duration) : (t.subtitle || t.category) }));
    if (t.available) c.addEventListener('click', () => go(t.id));
    else { c.appendChild(el('span', { class: 'od-badge soon', text: 'Bientôt disponible' })); c.addEventListener('click', () => toast('Ce tutoriel arrive bientôt.')); }
    return c;
  }

  function renderDetail(t) {
    clear(mount);
    mount.appendChild(el('button', { class: 'od-back', html: '\u2190 Retour', onclick: () => go(null) }));
    const wrap = el('div', { class: 'od-detail' });
    wrap.appendChild(el('span', { class: 'od-badge ' + t.product, text: PRODUITS[t.product] || 'CRM' }));
    wrap.appendChild(el('h2', { text: t.title }));
    if (t.intro) wrap.appendChild(el('p', { class: 'intro', text: t.intro }));
    mount.appendChild(wrap);
    const tourId = tourOf(t);
    if (tourId) {
      const tb = el('button', { class: 'od-tour-btn', html: '<svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg> Montre-moi en vrai' });
      tb.addEventListener('click', () => {
        if (win.OneDataTour && win.OneDataTour.launch && win.OneDataTour.tours && win.OneDataTour.tours[tourId]) win.OneDataTour.launch(tourId);
        else toast('La visite guidée n\u2019est pas encore disponible.');
      });
      wrap.appendChild(tb);
    }
    (t.steps || []).forEach((s, i) => wrap.appendChild(step(i + 1, s)));
    if (t.tip) wrap.appendChild(el('div', { class: 'od-tip', html: t.tip }));
    const suite = suivants(t);
    if (suite.length) {
      wrap.appendChild(el('div', { class: 'od-sec-title', text: 'Dans la même section' }));
      const g = el('div', { class: 'od-next' });
      suite.forEach(x => g.appendChild(el('button', { type: 'button', class: 'od-nx' + (isLearned(x) ? ' learned' : ''), html: (isLearned(x) ? '<i>\u2713</i>' : '') + '<span></span>', onclick: () => go(x.id) })));
      Array.prototype.forEach.call(g.querySelectorAll('.od-nx span'), (n, i) => { n.textContent = suite[i].title; });
      wrap.appendChild(g);
    }
    const btn = el('button', { class: 'od-learn' + (isLearned(t) ? ' on' : ''), text: isLearned(t) ? '\u2713 Appris' : 'Marquer comme appris' });
    btn.addEventListener('click', () => { state.learned[t.id] = !state.learned[t.id]; saveState(); btn.classList.toggle('on', state.learned[t.id]); btn.textContent = state.learned[t.id] ? '\u2713 Appris' : 'Marquer comme appris'; toast(state.learned[t.id] ? 'Bravo, tuto acquis !' : 'Retiré de tes acquis.'); });
    wrap.appendChild(btn);
  }

  function step(n, s) {
    const row = el('div', { class: 'od-step' });
    row.appendChild(el('div', { class: 'od-num', text: String(n) }));
    const body = el('div', {});
    body.appendChild(el('div', { class: 'st-t', text: s.title }));
    body.appendChild(el('div', { class: 'st-b', text: (s.bodyBy && s.bodyBy[group]) || s.body }));
    if (s.action) { const b = el('button', { class: 'od-act', text: s.action.label }); b.addEventListener('click', () => { const v = s.action.copy || ''; if (win.navigator.clipboard) win.navigator.clipboard.writeText(v).then(() => toast('Lien copié.'), () => toast(v)); else toast(v); }); body.appendChild(b); }
    row.appendChild(body); return row;
  }

  /* =======================  BOOT  ======================= */
  function resolveRoleThenMaybeRerender() {
    [400, 1200, 2500].forEach(d => setTimeout(() => {
      const r = getRole();
      if (r != null && r !== roleNum) { roleNum = r; group = groupOf(r); if (mount && !(win.location.hash || '').includes('tuto=')) renderHome(); }
    }, d));
  }
  // montage unique dans l'ancre (le loader garantit que el existe et est unique)
  build(__anchor);
  resolveRoleThenMaybeRerender();
  }
});
