// ============================================================================
//  TUTOS / Centre d'aide Delco coach — module One Data (OD.define)  v4
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
    if (role === 4 || (role > 0 && ![1, 2, 3, 5, 6, 7, 8, 9].includes(role))) return 'vendeur';
    if (role === 3) return 'chef';
    return 'manager'; // 1,2,5,6,7,8
  }
  // Lead management par poste : version du module lead-mgmt servie au tenant
  // (manifeste du socle). Le marketing (5) et le secrétariat (9) gardent
  // l'écran précédent.
  function versionLeads() {
    try {
      const fw = (window.wwLib && wwLib.getFrontWindow && wwLib.getFrontWindow()) || win;
      const od = (typeof OD !== 'undefined' && OD) || fw.OD || win.OD;
      const m = od && od.manifest && od.manifest['lead-mgmt'];
      const n = m && String(m.label || '').match(/(\d+)/);
      return n ? Number(n[1]) : 0;
    } catch (e) { return 0; }
  }
  function posteLeads() { return versionLeads() >= 52 && ![5, 9].includes(roleNum); }
  let roleNum = getRole();
  let group = groupOf(roleNum);

  /* =======================  DONNÉES  ======================= */
  const BRANDS = {
    samsung:  { label: 'Samsung (One UI)', match: /samsung|\bSM-[A-Z0-9]/i, steps: [
      'Réglages > Applications > One-Data Phone > Batterie : « Sans restriction ».',
      'Réglages > Batterie > Limites d\u2019usage en arrière-plan : retire l\u2019app des « applis en veille » et ne l\u2019ajoute pas à « veille profonde ».',
      'Désactive « Mettre en veille les applis inutilisées » pour cette application.' ] },
    xiaomi:   { label: 'Xiaomi / Redmi / POCO (MIUI/HyperOS)', match: /xiaomi|redmi|poco|\bMI\b|miui/i, steps: [
      'Gérer les applications > One-Data Phone : active « Démarrage automatique ».',
      '« Économiseur de batterie » : « Pas de restrictions ».',
      'Récents (multitâche) : verrouille l\u2019app (cadenas).',
      'Autres autorisations : active « Afficher les fenêtres popup en arrière-plan ».' ] },
    huawei:   { label: 'Huawei / Honor (EMUI)', match: /huawei|honor|-L29|\bCLT-|\bANE-|\bELE-/i, steps: [
      'Réglages > Batterie > Lancement des applications > One-Data Phone : désactive « Gérer automatiquement ».',
      'Active « Lancement auto », « Lancement secondaire », « Exécution en arrière-plan ».',
      'Sors l\u2019app de l\u2019optimisation de la batterie.' ] },
    pixel:    { label: 'Google Pixel (Android standard)', match: /pixel/i, steps: [
      'Réglages > Applications > One-Data Phone > Batterie : « Sans restriction ».',
      'Vérifie que les notifications sont activées.' ] },
    oppo:     { label: 'Oppo (ColorOS)', match: /\boppo\b|\bCPH[0-9]/i, steps: [
      'Réglages > Batterie > One-Data Phone : autorise arrière-plan + démarrage auto.',
      'Gestionnaire de démarrage : autorise One-Data Phone.',
      'Verrouille l\u2019app dans les Récents.' ] },
    oneplus:  { label: 'OnePlus (OxygenOS)', match: /oneplus/i, steps: [
      'Optimisation de la batterie > One-Data Phone : « Ne pas optimiser ».',
      'Autorise l\u2019arrière-plan ; désactive « Optimisation poussée ».',
      'Verrouille l\u2019app dans les Récents.' ] },
    autre:    { label: 'Autre / Android standard', match: null, steps: [
      'Réglages > Applications > One-Data Phone > Batterie : « Sans restriction ».',
      'Autorise notifications + affichage par-dessus les autres applications.',
      'Active un éventuel « démarrage auto » propre à ta surcouche.' ] },
  };

  const PERMS = [
    { id: 'perm:micro',   label: 'Microphone autorisé', help: 'Demandé au 1er appel — touche « Autoriser ».' },
    { id: 'perm:notif',   label: 'Notifications autorisées', help: 'Pour être prévenu des appels entrants.' },
    { id: 'perm:overlay', label: '« Afficher par-dessus les autres applications » activé', help: 'Pour voir l\u2019écran d\u2019appel même verrouillé.' },
  ];

  const ALL = ['vendeur', 'chef', 'manager'];
  function crm(id, title, sub, aud) { return { id, product: 'crm', category: title, title, subtitle: sub, available: false, aud: aud || ALL }; }

  /* =======================  LEAD MANAGEMENT (postes)  =======================
     Section affichée seulement quand le tenant sert le lead management par
     poste (lead-mgmt v52 et plus) et que le rôle y a un poste : vendeur (4),
     chef des ventes (3), direction (1, 2, 6, 7, 8), opérateur VROOM (10).
     Le marketing (5) et le secrétariat commercial (9) gardent l'écran
     précédent : ils voient l'ancien tuto « Lead Management ».            */
  const SITES = ['vendeur', 'chef', 'manager'];
  const POSTES = ['vendeur', 'chef', 'manager', 'vroom'];
  const TOUR_POSTE = { vendeur: 'lm-vendeur', chef: 'lm-chef', manager: 'lm-direction', vroom: 'lm-plateau' };
  function lm(id, category, duration, aud, title, subtitle, intro, steps, extra) {
    return Object.assign({ id, product: 'leads', category, duration, available: true, poste: true, aud, title, subtitle, intro, steps, tour: id }, extra || {});
  }
  const TUTOS_LEADS = [
    /* ---------- Premiers pas, pour tous les postes ---------- */
    lm('lm-poste', 'Premiers pas', '2 min', POSTES, 'Ton poste Lead management', 'Situation, signaux, onglets',
      'La page Lead management ouvre un poste de travail selon ton rôle. Il n’y a rien à paramétrer. Lance la visite guidée pour le parcourir sur ton écran.',
      [
        { title: 'La phrase de situation', body: 'En haut, une phrase dit l’essentiel du moment, suivie des chiffres du jour.',
          bodyBy: {
            vendeur: 'En haut, une phrase dit combien de personnes tu as à appeler et combien de leads sont libres dans la piscine du site. Dessous : premiers contacts et leads pris aujourd’hui, à faire, en piscine, relances de campagne.',
            chef: 'En haut, une phrase dit combien de leads sont hors délai dans la piscine, combien sont pris sans appel, et où en est l’équipe dans ses premiers contacts du jour.',
            manager: 'En haut, une phrase donne les trois délais de premier contact les plus longs sur 30 jours, et le nombre de leads ouverts depuis plus de 24 h.',
            vroom: 'En haut, une phrase dit combien de leads sont libres et hors délai dans la piscine BACS, depuis quand attend le plus ancien, et combien de rappels sont dus. Dessous : pris, qualifiés, rappels, abandonnés aujourd’hui, et l’état de la copie BACS.' } },
        { title: 'À gauche, les signaux', body: 'Ce qui vient d’arriver ou qui demande une action. Chaque signal porte le bouton qui le traite ; « Vu » le retire de la liste. Un signal nouveau clignote quelques secondes.' },
        { title: 'À droite, les onglets', body: 'Tes files de travail. Le chiffre d’un onglet passe en rouge dès qu’un lead y est hors délai.',
          bodyBy: {
            vendeur: 'Tes files de travail : « À faire », « Piscine du site » et « Mes campagnes ». Le chiffre d’un onglet passe en rouge dès qu’un lead y est hors délai.',
            chef: 'Tes files de travail : « Le mur », « À relayer » et « Campagnes ». Le chiffre d’« À relayer » passe en rouge dès qu’un lead libre est hors délai.',
            manager: 'Tes vues : « Le mur des sites », « Le relais » et « Campagnes ». Depuis le mur des sites, « Ouvrir » montre le mur du chef des ventes d’un site.',
            vroom: 'Tes files de travail : « La piscine BACS », « Rappels », « Transferts » et « Campagnes ». Le chiffre d’un onglet passe en rouge dès qu’il y a un retard.' } },
        { title: 'La fiche du lead', body: 'Un clic sur une ligne ouvre la fiche à droite : délais, téléphone avec Appeler, WhatsApp, Email et SMS, la demande, puis ce qui est parti dans BACS. La croix, la touche Échap ou un clic à côté la ferment.' },
        { title: 'L’écran se tient à jour', body: 'Il se recharge tout seul chaque minute. Le lien « Tableaux détaillés », en haut, ramène à l’écran précédent : cycles, kanban, synthèse et règles d’attribution.' },
      ], { tourBy: TOUR_POSTE, tour: null }),

    lm('lm-delais', 'Premiers pas', '2 min', POSTES, 'Délais et couleurs', 'Vert, orange, rouge',
      'Chaque lead a un délai de premier contact. Le minuteur à gauche de chaque ligne dit où il en est.',
      [
        { title: 'Trois couleurs', body: 'Vert tant que moins de 60 % du délai est consommé. Orange au-delà : le lead est « à risque ». Rouge une fois le délai dépassé : il est « hors délai ».' },
        { title: 'Le délai dépend de la source', body: 'Site constructeur (Toyota.fr, Lexus.fr) : 30 min. Campagne marketing BACS : 1 h. Autre demande BACS : 2 h. Showroom et trafic atelier : 4 h.' },
        { title: 'Lead transmis par le plateau VROOM', body: 'Le site a 2 h pour contacter un lead qualifié par le plateau, à compter du transfert. Au-delà, le plateau relance le chef des ventes.' },
        { title: 'Ouverts + 24 h, puis archives', body: 'Un lead sans contact depuis plus de 24 h passe en « Ouverts + 24 h ». Après 30 jours, il sort des files et n’est plus compté qu’à part, en archives : le chef des ventes le solde.' },
      ]),

    lm('lm-bacs-sites', 'Premiers pas', '2 min', SITES, 'Ce qui part dans BACS', 'Plus besoin d’aller dans BACS',
      'Pour un lead BACS, tes gestes sont reportés automatiquement dans BACS. La fiche du lead montre chaque envoi et son résultat, dans sa section « Dans BACS ».',
      [
        { title: 'Joint · RDV', body: 'Le rendez-vous part dans BACS, avec le vendeur comme propriétaire du lead.' },
        { title: 'Attribuer, autre site', body: 'Une attribution pose le vendeur comme propriétaire (s’il a un identifiant BACS). Un renvoi vers un autre site met à jour le site et le propriétaire.' },
        { title: 'Clore, confier au plateau', body: 'Clore abandonne le lead dans BACS avec le motif équivalent. Confier au plateau VROOM le passe en « Injoignable temporairement », au compte VROOM, avec un rappel dans 30 min.' },
        { title: 'Ce qui reste dans One Data', body: 'Joint sans RDV, Pas joint et Rendre à la piscine ne modifient pas BACS.' },
        { title: 'Un envoi en échec', body: 'La raison donnée par BACS s’affiche sous le geste. « Relancer l’envoi » le remet en route pour cinq essais.' },
      ]),

    /* ---------- Vendeur ---------- */
    lm('lm-v-afaire', 'Vendeur', '2 min', ['vendeur'], 'À faire : qui appeler maintenant', 'Le plus pressé en tête',
      'L’onglet « À faire » range tes leads pas encore contactés, le plus pressé en tête, puis tes relances de campagne.',
      [
        { title: 'Chaque ligne dit quoi faire', body: '« Appeler » pour un premier contact, « Rappeler » avec le numéro de la tentative, « Relancer » pour une campagne.' },
        { title: 'Et pourquoi', body: 'Qualifié par le plateau VROOM (avec sa qualification), attribué par ton chef, ou pas joint au dernier essai : la raison est écrite sous le nom.' },
        { title: 'Ouvre et appelle', body: 'Clique la ligne : la fiche s’ouvre à droite avec le téléphone et les boutons Appeler, WhatsApp, Email et SMS. Lis la qualification du plateau avant d’appeler.' },
        { title: 'Les leads plus anciens', body: 'En bas de la liste, une ligne compte tes leads de plus de 30 jours encore à ton nom. Ils ne sont plus à appeler en priorité : ton chef des ventes les solde.' },
      ]),

    lm('lm-v-piscine', 'Vendeur', '1 min', ['vendeur'], 'Prendre un lead dans la piscine', 'Libre-service, premier arrivé',
      'La piscine contient les leads du site que personne n’a pris.',
      [
        { title: 'Prendre', body: '« Prendre » met le lead à ton nom : il passe dans « À faire » et sa fiche s’ouvre.' },
        { title: 'Déjà pris ?', body: '« Réservé par … jusqu’à 10:42 » : un collègue regarde ce lead. Si quelqu’un l’a pris juste avant toi, un message te le dit et rien ne change.' },
        { title: 'Un lead BACS manque ?', body: 'Il est encore au plateau VROOM : il arrivera sur le site une fois qualifié.' },
        { title: '« Aussi en piscine BACS »', body: 'One Data te l’a attribué alors que BACS le présente encore au plateau. Appelle-le normalement : une fois contacté, il sort de la piscine du plateau.' },
      ]),

    lm('lm-v-apres', 'Vendeur', '2 min', ['vendeur', 'chef'], 'Après l’appel : dire ce qui s’est passé', 'RDV, joint, pas joint, clore',
      'En bas de la fiche du lead, choisis ce qui s’est passé. Un chef des ventes qui a appelé lui-même trouve la même chose sous « Résultat d’appel ».',
      [
        { title: 'Joint · RDV', body: 'Choisis la date, la durée et l’objet, puis « Enregistrer le RDV ». Le rendez-vous s’inscrit dans ton agenda One Data et le lead est marqué contacté. Il faut une fiche client rattachée au lead.' },
        { title: 'Joint · sans RDV', body: 'Le lead est marqué contacté, avec une note si tu veux. Il sort de « À faire » ; la suite se joue dans le cycle du client.' },
        { title: 'Pas joint', body: 'La tentative est notée (1, 2, 3 sur 3). Le lead reste dans « À faire » et revient en signal « Rappel » deux heures plus tard. Après trois essais, ton chef le voit dans « À relayer ».' },
        { title: 'Clore', body: 'Avec un motif : pas intéressé, injoignable, parti à la concurrence, doublon, fausse demande, autre.' },
        { title: 'Ce lead n’est pas pour toi ?', body: '« Rendre à la piscine », en bas de la fiche, le remet en libre-service.' },
      ]),

    lm('lm-v-campagnes', 'Vendeur', '1 min', ['vendeur'], 'Mes campagnes : relancer mes clients', 'Les clients confiés par ton chef',
      'Ton chef des ventes te confie des clients dans une campagne. Ils sont dans « Mes campagnes », et à la fin de « À faire ».',
      [
        { title: 'Relancer', body: 'Un clic ouvre la fiche du client : appelle-le, puis fais ton compte rendu. La relance est alors comptée comme traitée.' },
        { title: 'Depuis quand', body: 'Chaque ligne dit depuis combien de jours la campagne est lancée ; elle passe en orange au-delà de trois jours.' },
      ]),

    lm('lm-dashboard', 'Vendeur', '1 min', ['vendeur', 'chef'], 'Ouvrir un lead depuis le tableau de bord', 'Jamais contactés',
      'Le tableau de bord et le poste comptent les mêmes leads.',
      [
        { title: 'Jamais contactés', body: 'La tuile « Jamais contactés » du tableau de bord compte les leads ouverts sans premier contact, comme ton poste.' },
        { title: 'La liste', body: 'Un clic sur la tuile ouvre la liste : client, véhicule, ancienneté, téléphone.',
          bodyBy: { chef: 'Un clic sur la tuile donne, vendeur par vendeur, les leads jamais appelés, ceux à plus de 48 h et le plus ancien.' } },
        { title: 'Ouvrir', body: 'Le bouton « Ouvrir » d’un lead t’emmène sur Lead management, sa fiche déjà ouverte.',
          bodyBy: { chef: 'Pour agir, ouvre ton mur dans Lead management : la même case y donne la liste des leads.' } },
      ]),

    /* ---------- Chef des ventes ---------- */
    lm('lm-c-mur', 'Chef des ventes', '2 min', ['chef', 'manager'], 'Le mur : qui a la main', 'Une ligne par personne',
      'Qui a la main sur quoi, et depuis combien de temps. Lance la visite guidée pour le parcourir.',
      [
        { title: 'Chaque lead compté une fois', body: 'Chez la personne qui l’a en main. La piscine (personne) en tête, puis les vendeurs, puis « Au plateau VROOM » : les leads BACS pas encore transmis au site.' },
        { title: 'Les colonnes', body: 'Dans les temps, À risque, Hors délai, Ouverts + 24 h, et les premiers contacts de chacun aujourd’hui.' },
        { title: 'Clique un chiffre', body: 'La liste de ces leads s’ouvre dans le volet de droite. Ouvre un lead pour l’attribuer, puis « Retour à la liste » ramène à la liste.' },
        { title: 'Compter depuis', body: 'L’arrivée sur le site (le transfert du plateau, sinon la réception) ou la réception dans BACS.' },
        { title: 'Plusieurs sites', body: 'Si tu encadres plusieurs sites, des pastilles en haut changent de site. Les vendeurs sans lead en cours sont repliés sous « Afficher les autres vendeurs ».' },
      ]),

    lm('lm-c-relayer', 'Chef des ventes', '2 min', ['chef', 'manager'], 'À relayer : remettre les leads en route', 'Un geste par groupe',
      'L’onglet « À relayer » regroupe ce qui reste en plan, avec le geste proposé pour chaque groupe.',
      [
        { title: 'Hors délai dans la piscine', body: 'Choisis un vendeur (le moins chargé est conseillé) et attribue. « Tout attribuer selon la règle » répartit tout le groupe d’un coup, avec la règle du site.' },
        { title: 'Pris sans appel depuis plus de 20 min', body: 'Rends le lead à la piscine, ou attribue-le à un autre vendeur.' },
        { title: 'Autre marque demandée', body: 'Renvoie-le vers un site de la bonne marque : il y arrive avec son délai remis à zéro.' },
        { title: 'Injoignables après 3 tentatives', body: 'Confie-les au plateau VROOM (leads BACS) : ils repartent en rappel au plateau dans 30 minutes. Ou clos-les.' },
        { title: 'Stock de plus de 24 h', body: 'Solde-le en une fois : voir le tuto « Solder le stock ».' },
      ]),

    lm('lm-c-fiche', 'Chef des ventes', '2 min', ['chef', 'manager'], 'Agir sur un lead', 'Attribuer, résultat, autre site, clore',
      'Le pied de la fiche d’un lead propose quatre gestes.',
      [
        { title: 'Attribuer ou réattribuer', body: 'Choisis le vendeur : sa charge en cours est affichée. Au même endroit : « Confier au plateau VROOM » et « Rendre à la piscine ».' },
        { title: 'Résultat d’appel', body: 'Comme un vendeur, si tu as appelé toi-même : RDV, joint, pas joint ou clore.' },
        { title: 'Autre site', body: 'Le lead part dans la piscine du site choisi (ou chez le vendeur du tour de rôle), délai remis à zéro.' },
        { title: 'Clore', body: 'Avec un motif. Un lead BACS est aussi abandonné dans BACS.' },
      ], { tip: '<b>Direction.</b> Sur un site que tu n’encadres pas directement, tu lis tout mais n’agis pas : les gestes restent au chef des ventes du site.' }),

    lm('lm-c-solder', 'Chef des ventes', '2 min', ['chef', 'manager'], 'Solder le stock', 'Les leads ouverts depuis plus de 24 h',
      'Les leads sans premier contact depuis plus de 24 h, archives de plus de 30 jours comprises, se traitent en une fois.',
      [
        { title: 'Où le trouver', body: 'Dans « À relayer », sur la ligne « à solder en une fois ». Ou sur le mur : clique la case « Ouverts + 24 h » de la piscine, le bouton est au pied du volet.' },
        { title: 'Confier au plateau VROOM', body: 'Les leads BACS repartent au plateau, qui rappelle et requalifie ; ceux qui ont encore un projet reviennent sur le site. Les autres leads restent ouverts.' },
        { title: 'Répartir sur l’équipe', body: 'Selon la règle du site, le moins chargé d’abord.' },
        { title: 'Clore « sans suite, stock avant déploiement »', body: 'Ils sortent des délais. Rien n’est effacé, le motif est conservé. BACS n’est pas modifié.' },
        { title: 'Compté avant d’appliquer', body: 'La fenêtre donne le nombre exact de leads, dont ceux venant de BACS, avant que tu cliques « Appliquer ». Les leads encore au plateau ne sont pas soldés.' },
      ]),

    lm('lm-campagnes', 'Chef des ventes', '2 min', ['chef', 'manager'], 'Campagnes : suivre et créer', 'Relancer une cible de clients',
      'L’onglet « Campagnes » suit les campagnes internes et en crée de nouvelles.',
      [
        { title: 'Suivre', body: 'Pour chaque campagne : cibles, traitées, à relancer, propositions, commandes. Un clic sur une ligne montre qui avance, vendeur par vendeur.' },
        { title: 'Créer', body: '« Créer une campagne » choisit les clients par critères : site, particuliers ou sociétés, marque, modèle, âge et kilométrage du véhicule, départements.' },
        { title: 'Estimer, puis lancer', body: 'La cible et sa répartition entre vendeurs sont estimées avant tout envoi. Rien n’est créé sans une seconde confirmation.' },
      ]),

    /* ---------- Direction ---------- */
    lm('lm-d-sites', 'Direction', '2 min', ['manager'], 'Le mur des sites', 'Une ligne par site',
      'Tous les sites de ton périmètre, d’un coup d’œil. Lance la visite guidée pour le parcourir.',
      [
        { title: 'Maintenant', body: 'Les quatre premières colonnes : leads dans les temps, à risque, hors délai, ouverts depuis plus de 24 h (et les archives), puis ceux encore au plateau.' },
        { title: 'Sur la durée', body: 'Le délai moyen de premier contact et la part des contacts faits dans le délai, sur 30 jours ; les leads reçus sur 7 jours.' },
        { title: 'Ouvrir un site', body: '« Ouvrir » montre le mur du chef des ventes de ce site. « ← Tous les sites », en haut, ramène au mur des sites.' },
      ]),

    lm('lm-d-relais', 'Direction', '1 min', ['manager'], 'Le relais : où le temps se perd', 'De BACS au premier appel',
      'Le chemin d’un lead, de BACS au premier appel, en temps médian par site.',
      [
        { title: 'Quatre segments', body: 'Attente en piscine BACS, traitement par le plateau VROOM, attente sur le site, vendeur avant l’appel.' },
        { title: 'Les segments hachurés', body: 'Ils n’appartiennent à personne : c’est là que le temps se perd.' },
      ]),

    /* ---------- Plateau VROOM ---------- */
    lm('lm-p-bacs', 'Plateau VROOM', '2 min', ['vroom'], 'BACS : un onglet ouvert, rien d’autre', 'Le report automatique dans BACS',
      'Tu ne travailles plus dans BACS. One Data y écrit pour toi, par ta session BACS.',
      [
        { title: 'Garde un onglet BACS ouvert', body: 'Dans le même navigateur que One Data, connecté, avec l’extension One Data installée. Inutile de le regarder ; une session ouverte depuis la veille a souvent expiré : reconnecte-toi.' },
        { title: 'Bandeau rouge', body: 'Aucune session BACS ne répond : Prendre, Transférer, Programmer et Abandonner sont bloqués. Ouvre BACS et connecte-toi ; le bandeau disparaît tout seul dans les 15 secondes.' },
        { title: 'Bandeau bleu', body: 'Tes gestes passent par la session d’un collègue : l’historique BACS portera son nom. Ouvre BACS sur ton poste.' },
        { title: 'Bandeau orange', body: 'Des gestes attendent depuis plus de 2 minutes. Patiente, puis recharge l’onglet BACS si cela dure.' },
        { title: 'La section « Dans BACS »', body: 'Chaque fiche montre ce qui est parti : « Fait à 10:42 », « En attente » ou « Échec » avec la raison. Un envoi est retenté cinq fois ; ensuite, « Relancer l’envoi ».' },
      ]),

    lm('lm-p-signaux', 'Plateau VROOM', '2 min', ['vroom'], 'Les signaux du plateau', 'Ce qui demande une action',
      'Les signaux et la phrase de situation portent toujours sur tout le plateau, même avec un filtre de campagne.',
      [
        { title: 'Nouveau lead, hors délai', body: '« Nouveau lead » : un lead libre arrivé il y a moins de 15 min, bouton Prendre. « Hors délai » : un seul signal pour tous, bouton Prendre le plus ancien.' },
        { title: 'Rappels', body: '« Rappel » : un rappel tombe dans les 30 min ; « Appeler » prend le lead et ouvre sa fiche. « Rappels en retard » : dépassés de plus de 30 min.' },
        { title: 'Relais bloqué', body: 'Un site n’a pas contacté un lead transféré depuis plus de 2 h. « Relancer le chef » alerte les chefs des ventes du site.' },
        { title: 'BACS', body: '« Report BACS » : un geste n’a pas pu être écrit après cinq essais. « Copie BACS » : la dernière lecture de BACS a plus de 2 h ; recharge l’onglet BACS.' },
        { title: 'Information', body: '« Plateau » : un collègue a pris un lead. « Stock » : des leads acceptés il y a plus de 14 jours sans suite. « Trafic atelier » : des leads atelier attendent alors que la piscine les masque.' },
      ]),

    lm('lm-p-piscine', 'Plateau VROOM', '2 min', ['vroom'], 'La piscine BACS', 'Qu’est-ce que je prends maintenant ?',
      'La piscine range les leads à prendre, du plus ancien au plus récent. Lance la visite guidée pour la parcourir.',
      [
        { title: 'Ce qu’elle contient', body: 'Les leads « À affecter » ou « Nouveau » reçus depuis moins de 60 jours, et ceux acceptés par le plateau ces 14 derniers jours, restés sans suite.' },
        { title: 'Les sources', body: 'Une pastille par source, avec son nombre de leads. Le trafic atelier est masqué par défaut ; clique une pastille pour ajouter ou retirer une source.' },
        { title: 'Le stock accepté', body: 'Le bouton « Stock accepté » affiche les leads acceptés il y a plus de 14 jours, jamais qualifiés ni abandonnés. Le bouton de ligne devient « Rappeler ».' },
        { title: 'La copie BACS', body: 'One Data lit une copie de BACS. Un lead arrivé après la dernière lecture n’est pas encore visible : l’indicateur « Copie BACS » donne son âge. Tes gestes, eux, comptent tout de suite.' },
      ]),

    lm('lm-p-traiter', 'Plateau VROOM', '3 min', ['vroom'], 'Traiter un lead, pas à pas', 'Prendre, qualifier, orienter',
      'De la prise à la validation, sans ouvrir BACS.',
      [
        { title: 'Prendre', body: '« Prendre » (ou « Appeler », « Rappeler ») réserve le lead à ton nom 5 minutes, le passe en « Accepté » dans BACS et ouvre sa fiche. La réservation se prolonge tant que la fiche reste ouverte.' },
        { title: 'Lire la fiche', body: 'Les délais, le contact et ses boutons, la demande telle que BACS l’a reçue, ce qui est déjà parti dans BACS, puis le parcours du lead.' },
        { title: 'Qualifier', body: 'Projet, modèle visé, échéance, reprise, financement, et une note pour le vendeur. Tout est facultatif, mais c’est ce que le vendeur lira avant d’appeler.' },
        { title: 'Orienter', body: 'Le site affecté par BACS, puis ceux où le client a un dossier, puis les autres sites de la marque, chacun avec ses leads en attente. Vendeur : « Tour de rôle du site » par défaut, ou un vendeur précis.' },
        { title: 'Choisir l’issue et valider', body: 'En bas de la fiche, l’une des quatre issues, puis le bouton qui apparaît. La fiche se ferme et le geste part dans BACS.' },
        { title: 'Rendre sans rien faire', body: '« Libérer », ou ferme simplement la fiche : le lead redevient libre tout de suite pour tes collègues.' },
      ]),

    lm('lm-p-issues', 'Plateau VROOM', '2 min', ['vroom'], 'Les quatre issues', 'Ce que devient le lead',
      'Chaque issue est reportée dans BACS.',
      [
        { title: 'Qualifié', body: 'Le lead part au site choisi avec ta qualification. Même site que dans BACS : il est attribué au vendeur choisi ou par tour de rôle. Autre site : il y est transféré. BACS : statut Qualifié, site et propriétaire.' },
        { title: 'Injoignable', body: 'Une tentative de plus et un rappel : dans 2 h, demain 9 h, après-demain 9 h ou à une date choisie. BACS : Injoignable temporairement et date de rappel.' },
        { title: 'Projet long terme', body: 'Un rappel à la date choisie, dans 30 jours par défaut ; le lead revient dans Rappels 7 jours avant. BACS : Projet Long Terme et date de rappel.' },
        { title: 'Abandonner', body: 'Avec un motif BACS (non intéressé, injoignable permanent, doublon, erreur du client, conserve son véhicule…). BACS : Abandonné et motif.' },
      ]),

    lm('lm-p-rappels', 'Plateau VROOM', '1 min', ['vroom'], 'Rappels', 'Injoignables et projets long terme',
      'Les leads en rappel tenus par le plateau, du plus en retard au plus lointain.',
      [
        { title: 'Ce qu’il contient', body: 'Injoignable temporairement, Projet Long Terme et Intéressé, dont le rappel tombe entre 30 jours en arrière et 7 jours en avant.' },
        { title: 'Le minuteur', body: '« Maintenant », « retard 2 h 10 » ou « dans 1 h 30 », avec la date prévue ; une étiquette donne le statut et le nombre de tentatives.' },
        { title: 'Les miens', body: '« Les miens » ne garde que les leads dont tu as fait le dernier geste.' },
      ]),

    lm('lm-p-transferts', 'Plateau VROOM', '1 min', ['vroom'], 'Transferts : suivre et relancer', 'Ce que deviennent tes leads qualifiés',
      'Les leads qualifiés par le plateau ces 30 derniers jours. Le site a 2 h pour les contacter.',
      [
        { title: 'Contacté, en attente', body: '« Contacté par … en … » : le vendeur a appelé, avec le délai depuis le transfert. « En attente chez … » : attribué, pas encore contacté, dans le délai.' },
        { title: 'Relancer le chef', body: 'Après 2 h sans contact, le bouton alerte les chefs des ventes du site dans leur page Notifications ; la ligne passe en « Chef relancé ».' },
        { title: 'Terminés', body: '« Converti · Clos par le site » : vente, ou lead perdu ou rejeté. « Suivi dans BACS » : qualifié directement dans BACS, son suivi n’est que dans BACS.' },
      ]),

    lm('lm-p-campagnes', 'Plateau VROOM', '1 min', ['vroom'], 'Campagnes BACS', 'Filtrer le travail par campagne',
      'Les campagnes BACS des 90 derniers jours, hors trafic atelier.',
      [
        { title: 'Le tableau', body: 'Pour chaque campagne : reçus, à prendre, acceptés, en rappel, qualifiés, abandonnés, et le taux de qualification.' },
        { title: 'Filtrer', body: '« Filtrer » restreint la piscine, les rappels et les transferts à cette campagne. Un bandeau bleu reste sous les onglets, avec « Retirer le filtre ».' },
      ]),

    lm('lm-p-dashboard', 'Plateau VROOM', '2 min', ['vroom'], 'Ton tableau de bord du plateau', 'Piscine, journée, transferts',
      'Ta page Tableau de bord est celle du plateau, pas celle d’un vendeur.',
      [
        { title: 'Ta journée', body: 'Une phrase : leads à traiter, rappels dus, ce que tu as pris et transmis, transferts qui attendent un vendeur.' },
        { title: 'La piscine, maintenant', body: 'Leads à traiter, rappels dus et en retard, transferts non pris au-delà de 2 h, stock accepté, trafic atelier, âge de la copie BACS.' },
        { title: 'Aujourd’hui et sur 30 jours', body: 'Tes leads pris, transmis, mis en rappel, abandonnés, face au total du plateau ; ton délai de prise médian ; le taux de qualification.' },
        { title: 'Les transferts et les opérateurs', body: 'Ce que deviennent les leads qualifiés, site par site. Puis les gestes par personne ; les comptes VROOM partagés de BACS sont sur une ligne à part.' },
      ], { tour: 'tdb-plateau' }),

    /* ---------- Questions fréquentes ---------- */
    lm('lm-faq-sites', 'Questions fréquentes', '2 min', SITES, 'Questions fréquentes', 'Vendeurs, chefs, direction',
      'Les questions qui reviennent le plus sur les postes des sites.',
      [
        { title: 'Un lead BACS de mon site n’est pas dans la piscine.', body: 'Il est encore au plateau VROOM : il arrivera une fois qualifié. Le chef des ventes le voit sur la ligne « Au plateau VROOM » de son mur.' },
        { title: 'Le stock compte plus de leads que le mur.', body: 'Le mur ne montre que les leads de moins de 30 jours ; les plus anciens sont comptés à part, en archives, et soldés avec le reste.' },
        { title: 'Le bouton Appeler ne fait rien.', body: 'Sans téléphonie 3CX active sur le poste, le navigateur ouvre le numéro avec l’application de téléphone. Le numéro reste affiché et copiable.' },
        { title: 'Un envoi est en échec dans « Dans BACS ».', body: 'La raison est affichée sous le geste. Corrige si besoin, puis « Relancer l’envoi ».' },
        { title: 'Je veux retrouver l’ancien écran.', body: 'Lien « Tableaux détaillés », en haut du poste : cycles, kanban, synthèse et règles d’attribution y sont toujours.' },
      ]),

    lm('lm-faq-plateau', 'Questions fréquentes', '2 min', ['vroom'], 'Questions fréquentes du plateau', 'Boutons grisés, piscine vide…',
      'Les questions qui reviennent le plus au plateau VROOM.',
      [
        { title: 'Les boutons Prendre et Transférer sont grisés.', body: 'Le bandeau rouge est affiché : aucune session BACS ne répond. Ouvre BACS dans un onglet de ce navigateur et connecte-toi ; les boutons se réactivent dans les 15 secondes.' },
        { title: 'La piscine est vide, mais des leads attendent dans BACS.', body: 'Regarde « Copie BACS » : si elle est ancienne, recharge l’onglet BACS. Vérifie ensuite les pastilles de sources (trafic atelier masqué) et l’absence de filtre de campagne.' },
        { title: 'Le chiffre d’un onglet ne correspond pas à la phrase.', body: 'Un filtre de campagne est actif (bandeau bleu) : la phrase et les signaux comptent tout le plateau, les onglets seulement la campagne.' },
        { title: '« Réservé par … jusqu’à 10:42 ».', body: 'Un collègue traite ce lead ; il redevient libre à l’heure indiquée s’il n’a rien fait. Tu peux ouvrir sa fiche en lecture.' },
        { title: 'J’ai fermé la fiche par erreur.', body: 'Le lead est libéré. Reprends-le avec « Prendre » : la qualification saisie est perdue, mais rien n’a été enregistré à moitié.' },
      ]),
  ];

  const TUTOS = [
    { id: 'phone-install', product: 'phone', category: 'Premiers pas', duration: '2 min', available: true, aud: ALL,
      title: 'Installer l\u2019application', steps: [
        { title: 'Récupère ton lien d\u2019accès', body: 'Tu reçois (ou demandes à ton administrateur) un lien d\u2019accès.', action: { label: 'Copier le lien', copy: INSTALL_LINK } },
        { title: 'Ouvre le lien sur ton téléphone', body: 'Connecte-toi avec ton compte Google et accepte de rejoindre le test.' },
        { title: 'Installe depuis le Play Store', body: 'Suis « Télécharger sur Google Play » puis installe One-Data Phone.' },
        { title: 'Lance l\u2019application', body: 'Ouvre One-Data Phone : tu arrives sur l\u2019écran de connexion.' } ] },
    { id: 'phone-login', product: 'phone', category: 'Premiers pas', duration: '1 min', available: true, aud: ALL,
      title: 'Se connecter', steps: [
        { title: 'Saisis tes identifiants', body: 'Email + mot de passe One Data, les mêmes que sur le CRM web.' },
        { title: 'Connecte-toi', body: 'Touche « Se connecter ». Tu dois voir « Prêt à appeler ».' },
        { title: 'En cas d\u2019erreur', body: 'Si « identifiants incorrects », revérifie ; en cas de doute, contacte ton administrateur.' } ] },
    { id: 'phone-setup', product: 'phone', category: 'Paramétrage', duration: '3 min', available: true, aud: ALL,
      title: 'Paramétrer son téléphone (appels entrants)', type: 'phoneSetup',
      intro: 'Pour recevoir les appels même app fermée ou téléphone verrouillé. Les chemins exacts varient selon la version.' },
    { id: 'phone-call', product: 'phone', category: 'Utiliser', duration: '2 min', available: true, aud: ALL,
      title: 'Passer un appel', steps: [
        { title: 'Rechercher un client', body: 'Onglet « Rechercher » : filtre Tous/Particuliers/Sociétés, tape le nom, touche le client.' },
        { title: 'Composer un numéro', body: 'Onglet « Clavier » : 06\u2026 ou +33\u2026 (appui long sur 0 = « + »). « Appeler » quand valide.' },
        { title: 'Pendant l\u2019appel', body: 'Muet, clavier, haut-parleur, bouton rouge pour raccrocher.' } ] },
    { id: 'phone-incoming', product: 'phone', category: 'Utiliser', duration: '2 min', available: true, aud: ALL,
      title: 'Recevoir un appel', steps: [
        { title: 'L\u2019écran d\u2019appel s\u2019affiche', body: 'Même verrouillé : nom + numéro de l\u2019appelant.' },
        { title: 'Le briefing client', body: 'Contexte : véhicule, dernier devis, dernier échange, suggestion d\u2019accroche.' },
        { title: 'Accepte ou refuse', body: 'Vert pour répondre, rouge pour refuser.' } ] },
    { id: 'phone-recents', product: 'phone', category: 'Utiliser', duration: '1 min', available: true, aud: ALL,
      title: 'Consulter ses appels récents', steps: [
        { title: 'Onglet « Récents »', body: 'Entrants, sortants, manqués (rouge), avec le nom du client si connu.' },
        { title: 'Rappeler en un tap', body: 'Touche une ligne pour rappeler.' } ] },
    { id: 'phone-trouble-incoming', product: 'phone', category: 'Dépannage', duration: '2 min', available: true, aud: ALL,
      title: 'Je ne reçois pas les appels', steps: [
        { title: 'Vérifie ton paramétrage', body: 'Cause n°1 : ouvre « Paramétrer son téléphone » et déroule la checklist de ta marque.' },
        { title: 'Affichage + notifications', body: '« Afficher par-dessus » et notifications doivent être autorisés.' },
        { title: 'Batterie & arrière-plan', body: 'Optimisation batterie désactivée, arrière-plan autorisé.' },
        { title: 'Toujours rien ?', body: 'Ferme/rouvre l\u2019app (réenregistre l\u2019appareil) et vérifie ta connexion.' } ] },
    { id: 'phone-trouble-audio', product: 'phone', category: 'Dépannage', duration: '1 min', available: true, aud: ALL,
      title: 'Pas de son / micro', steps: [
        { title: 'Autorisation micro', body: 'Réglages > Applications > One-Data Phone > Autorisations > Micro.' },
        { title: 'Volume d\u2019appel', body: 'Monte le volume pendant l\u2019appel.' },
        { title: 'Haut-parleur', body: 'Teste le haut-parleur pour isoler le souci.' } ] },

    /* CRM — phase 2 */
    crm('crm-start', 'Démarrer', 'Connexion, navigation, périmètre'),
    { id: 'crm-tdb', product: 'crm', category: 'Piloter son activité', duration: '2 min', available: true, aud: ['vendeur', 'chef', 'manager', 'vroom'],
      title: 'Tableau de bord', subtitle: 'Ta page d’accueil', tourBy: { vendeur: 'tdb', chef: 'tdb', manager: 'tdb', vroom: 'tdb-plateau' },
      intro: 'La page d’accueil répond à la question de ton rôle. Lance la visite guidée pour la parcourir.',
      steps: [
        { title: 'Le constat', body: 'Une question selon ton rôle (« Qui appeler aujourd’hui », « Qui décroche, et sur quoi », « Quelle entité décroche »…), une phrase qui y répond et quatre chiffres.',
          bodyBy: { vroom: 'Ta journée : leads à traiter dans la piscine, rappels dus, ce que tu as pris et transmis, transferts qui attendent un vendeur.' } },
        { title: 'Les tuiles', body: 'Rangées par famille. Un clic ouvre le détail juste dessous, avec « Ce qu’il faut en faire ».',
          bodyBy: { vroom: 'La piscine maintenant, ta journée, le plateau sur 14 et 30 jours, ce que deviennent les transferts, et les opérateurs.' } },
        { title: 'Le mois et le périmètre', body: 'Le mois en cours ou les deux précédents ; à droite, tout ton périmètre ou un site. Les chiffres se rafraîchissent toutes les 2 minutes.',
          bodyBy: { vroom: 'Les chiffres portent sur le plateau ; l’activité additionne l’historique BACS des comptes VROOM et tes gestes dans One Data.' } },
      ] },
    { id: 'crm-dashboard', product: 'crm', category: 'Piloter son activité', duration: '3 min', available: true, aud: ALL,
      title: 'Suivi d’activité', subtitle: 'Contacts, RDV choc, pipeline, cadence', tour: 'suivi-activite',
      intro: 'L’activité de l’équipe : contacts, RDV choc, propositions et transformation. Lance la visite guidée pour parcourir la page.',
      steps: [
        { title: 'Période, type et export', body: 'Du 1er du mois à aujourd’hui à chaque arrivée ; Tous, VN, VO ou VN/VO ; le logo Excel exporte la page.' },
        { title: 'Le résumé et les graphes', body: 'Contacts, RDV choc, propositions, BDC, wins, abandons ; les contacts par jour (avec la moyenne mobile sur 7 jours) et le pipeline dans le temps.' },
        { title: 'Le périmètre', body: 'Un clic sur une ligne de l’arbre filtre la page ; un site devient le site global. Sur un site : la cadence jour par jour et le détail par vendeur.' },
        { title: 'Comparer', body: '« ⇄ Comparer », puis deux lignes de l’arbre : la meilleure valeur ressort sur chaque mesure.' } ] },
    { id: 'crm-leads', product: 'crm', category: 'Piloter son activité', duration: '2 min', available: true, aud: ALL, poste: false,
      title: 'Lead Management', subtitle: 'À traiter, pipeline, suivi', tour: 'lead-management',
      intro: 'Le poste de pilotage des leads et des cycles commerciaux. Lance la visite guidée pour le parcourir sur ton écran.',
      steps: [
        { title: 'Choisis ta vue', body: 'Vendeur : « À traiter » et « Pipeline ». Manager : « Synthèse », « Suivi leads » et « Campagnes ».' },
        { title: 'Traite les urgences', body: 'Dans « À traiter », les cycles sont triés par urgence (SLA). Clique une carte pour ouvrir la fiche client.' },
        { title: 'Analyse et pilote', body: 'Manager : la Synthèse donne KPI, classement et graphes ; l’équipe se déplie par réseau, affaire et site.' } ] },
    { id: 'crm-kanban', product: 'crm', category: 'Piloter son activité', duration: '2 min', available: true, aud: ALL,
      title: 'Gestion des ventes', subtitle: 'De la simulation à la commande', tour: 'gestion-ventes',
      intro: 'Ton pipe commercial, de la simulation à la commande validée. Lance la visite guidée pour le découvrir sur ton écran.',
      steps: [
        { title: 'Qui et quand', body: 'Vendeur : tes affaires. Chef des ventes : un vendeur de ton site. Direction : réseau, affaire, site, vendeur. La période revient au mois en cours à chaque visite.' },
        { title: 'Cinq colonnes', body: 'Simulations, Commandes, Demande d’approbation, Transmis TFR / Validée, Abandonné ; en tête, le nombre, le montant et le taux de passage.' },
        { title: 'Une affaire', body: 'Le statut BACS en haut, le client (vers sa fiche), le véhicule, le montant et l’âge. Loupe pour consulter, crayon pour modifier, « B » pour ouvrir dans BACS.' },
        { title: 'Faire avancer', body: 'Glisse-dépose ou « Déplacer ». Une affaire BACS ne passe ici que de Simulations à Commandes : la suite se fait dans BACS. Transmis et Abandonné sont réservés aux managers.' } ] },
    { id: 'crm-performances', product: 'crm', category: 'Piloter son activité', duration: '3 min', available: true, aud: ALL,
      title: 'Performances', subtitle: 'Réalisé vs objectifs', tour: 'performances',
      intro: 'Ton réalisé face aux objectifs du reporting commandes : Cde, Cde part., Cde pro, FI, PHEV / EV, VU, Kinto, Arval. Lance la visite guidée pour parcourir la page.',
      steps: [
        { title: 'Choisis ce que tu regardes', body: 'Période, type (VN/VO), activité (réseau, grands comptes ou tous) et vue (pilotage ou mix produit).' },
        { title: 'Lis au prorata du mois', body: 'Chaque tuile : réalisé sur objectif. Vert si l’atteinte suit le mois écoulé, orange un peu en dessous, rouge loin derrière, gris sans objectif.' },
        { title: 'Le périmètre et le reste à faire', body: 'L’arbre donne chaque site et chaque vendeur (toi : « vous »), avec ce qui reste à faire. Un chiffre ouvre les commandes qui le composent.' } ] },
    { id: 'crm-objectifs', product: 'crm', category: 'Piloter son activité', duration: '3 min', available: true, aud: ALL,
      title: 'Objectifs', subtitle: 'Définir et suivre', tour: 'objectifs',
      intro: 'Les objectifs du mois et ton rythme. La page s’adapte : tableau de marche pour le vendeur, saisie pour le chef des ventes. Lance la visite guidée pour la parcourir.',
      steps: [
        { title: 'Vendeur : ton rythme', body: 'Commandes particuliers, commandes pro, PHEV / EV, VU, Kinto, Arval : ton réalisé sur l’objectif, le trait bleu du mois écoulé, et la cadence pour finir dans les temps.' },
        { title: 'Chef : l’atelier', body: 'Pose la cible de commandes, laisse les taux du mois précédent déduire les autres cibles, puis répartis (équitable, prorata M-1, jours de présence) ou reconduis le mois précédent.' },
        { title: 'Brouillon puis enregistrement', body: 'Tout reste en brouillon, corrigeable case par case dans l’arbre, jusqu’à « Enregistrer les objectifs ».' } ] },
    crm('crm-client', 'Fiche client (CRM 360)', 'Historique multicanal'),
    crm('crm-propales', 'Propositions & bons de commande', 'Propale, BDC, PDF, VN/VO'),
    crm('crm-bilaterales', 'Bilatérales', 'Suivi propales & BDC'),
    crm('crm-whatsapp', 'Messagerie WhatsApp', 'Échanger avec ses clients'),
    crm('crm-emails', 'Emails', 'Rédiger et suivre'),
    crm('crm-delco', 'Delco (assistant IA)', 'Signaux & recommandations'),
    crm('crm-team', 'Piloter son équipe', 'Suivi et coaching', ['chef', 'manager']),
    crm('crm-rollout', 'Adoption & déploiement', 'Suivi par site', ['manager']),
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
  function detectBrand() { const ua = win.navigator.userAgent || ''; for (const k in BRANDS) { const m = BRANDS[k].match; if (m && m.test(ua)) return k; } return null; }

  function visibleTutos() {
    const p = posteLeads();
    return TUTOS.filter(t => (t.aud || ALL).includes(group) && (t.poste == null || t.poste === p));
  }
  function tourOf(t) { return (t.tourBy && t.tourBy[group]) || t.tour || null; }
  // Ordre des sous-sections Lead management : premiers pas, le poste de
  // l'utilisateur, les autres postes, les questions fréquentes.
  function rangCat(c) {
    const mien = { vendeur: 'Vendeur', chef: 'Chef des ventes', manager: 'Direction', vroom: 'Plateau VROOM' }[group];
    return c === 'Premiers pas' ? 0 : c === mien ? 1 : c === 'Questions fréquentes' ? 9 : 5;
  }
  function suivants(t) {
    if (t.product !== 'leads') return [];
    const ls = visibleTutos().filter(x => x.product === 'leads' && x.available);
    return ls.map((x, i) => [x, i]).sort((a, b) => (rangCat(a[0].category) - rangCat(b[0].category)) || (a[1] - b[1])).map(a => a[0]).filter(x => x.id !== t.id);
  }
  const PRODUITS = { leads: 'Lead management', crm: 'CRM', phone: 'Téléphone' };
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
  function build(root) { injectCSS(); mount = root; mount.className = 'od-tutos'; if (!state.brand) { state.brand = detectBrand(); saveState(); } win.addEventListener('hashchange', routeFromHash); routeFromHash(); }
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
    (aLeads ? [['all', 'Tout'], ['leads', 'Lead management'], ['crm', 'CRM'], ['phone', 'Application téléphone']] : [['all', 'Tout'], ['phone', 'Application téléphone'], ['crm', 'CRM']]).forEach(([k, lbl]) => chips.appendChild(el('button', { class: 'od-chip' + (curFilter === k ? ' on' : ''), text: lbl, onclick: () => { curFilter = k; renderHome(); } })));
    mount.appendChild(chips);
    mount.appendChild(el('div', { id: 'od-list' }));
    updateList();
  }

  function suggestions() {
    if (group === 'vroom') return ['Les boutons Prendre sont grisés', 'Comment qualifier un lead ?', 'Que deviennent mes transferts ?'];
    if (posteLeads() && group === 'chef') return ['Comment solder le stock ?', 'Lire le mur', 'Comment suivre mon équipe ?'];
    if (posteLeads() && group === 'vendeur') return ['Que faire après un appel ?', 'Prendre un lead dans la piscine', 'Mon téléphone ne sonne pas'];
    if (group === 'vendeur') return ['Mon téléphone ne sonne pas', 'Comment passer un appel ?', 'Comment créer une propale ?'];
    if (group === 'chef') return ['Comment suivre mon équipe ?', 'Lire le tableau de bord', 'Paramétrer mon téléphone'];
    return ['Suivre l\u2019adoption par site', 'Lire les performances', 'Premiers pas avec One Data'];
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
      if (p !== 'leads') { const g = el('div', { class: 'od-grid' }); ls.forEach(t => g.appendChild(card(t))); box.appendChild(g); return; }
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
    if (t.type === 'phoneSetup') renderPhoneSetup(wrap, t);
    else (t.steps || []).forEach((s, i) => wrap.appendChild(step(i + 1, s)));
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

  function renderPhoneSetup(wrap, t) {
    wrap.appendChild(el('div', { class: 'od-sec-title', text: 'Ta marque de téléphone' }));
    const chips = el('div', { class: 'od-chips' });
    Object.keys(BRANDS).forEach(k => chips.appendChild(el('button', { class: 'od-chip' + (state.brand === k ? ' on' : ''), text: BRANDS[k].label, onclick: () => { state.brand = k; saveState(); renderDetail(t); } })));
    wrap.appendChild(chips);

    const items = []; PERMS.forEach(p => items.push(p));
    const bk = state.brand;
    if (bk && BRANDS[bk]) BRANDS[bk].steps.forEach((s, i) => items.push({ id: 'brand:' + bk + ':' + i, label: s }));

    const prog = el('div', { class: 'od-progress' }); const bar = el('i'); prog.appendChild(bar);
    const progL = el('div', { class: 'od-progress-l' });
    const ready = el('div', { class: 'od-ready', html: '<span>\u2713</span> Tout est prêt : tu peux recevoir les appels.' });
    function refresh() { const done = items.filter(it => state.checks[it.id]).length; bar.style.width = (items.length ? Math.round(done / items.length * 100) : 0) + '%'; progL.textContent = done + ' / ' + items.length + ' validé' + (done > 1 ? 's' : ''); const full = items.length > 0 && done === items.length; ready.classList.toggle('on', full); if (full && !state.learned['phone-setup']) { state.learned['phone-setup'] = true; saveState(); } }

    wrap.appendChild(el('div', { class: 'od-sec-title', text: 'Autorisations' }));
    PERMS.forEach(p => wrap.appendChild(checkRow(p, refresh)));
    if (bk && BRANDS[bk]) { wrap.appendChild(el('div', { class: 'od-sec-title', text: BRANDS[bk].label + ' \u2014 batterie & arrière-plan' })); BRANDS[bk].steps.forEach((s, i) => wrap.appendChild(checkRow({ id: 'brand:' + bk + ':' + i, label: s }, refresh))); }
    else wrap.appendChild(el('p', { class: 'intro', text: 'Choisis ta marque pour afficher les réglages batterie.' }));

    wrap.appendChild(prog); wrap.appendChild(progL); wrap.appendChild(ready);
    wrap.appendChild(el('div', { class: 'od-tip', html: '<b>Teste un appel entrant.</b> Demande à un collègue de t\u2019appeler, téléphone verrouillé : l\u2019écran d\u2019appel doit s\u2019afficher.' }));
    refresh();
  }

  function checkRow(item, onChange) {
    const row = el('div', { class: 'od-check' + (state.checks[item.id] ? ' done' : '') });
    row.appendChild(el('div', { class: 'od-box', html: CHK }));
    const txt = el('div', {}); txt.appendChild(el('div', { class: 'ck-l', text: item.label })); if (item.help) txt.appendChild(el('div', { class: 'ck-h', text: item.help }));
    row.appendChild(txt);
    row.addEventListener('click', () => { state.checks[item.id] = !state.checks[item.id]; row.classList.toggle('done', state.checks[item.id]); saveState(); onChange && onChange(); });
    return row;
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
