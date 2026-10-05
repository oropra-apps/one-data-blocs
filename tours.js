// ============================================================================
//  VISITES GUIDÉES (« Montre-moi en vrai ») — module One Data (OD.define) v1
//  Ex-bloc collé dans le on-page-load de CHAQUE page -> devient UN module
//  app-level : une ancre masquée dans le header partagé suffit pour tout le site.
//  Aucune dépendance Supabase. Expose window.OneDataTour ; délégation de clic sur
//  [data-tour-launch] (garde __odtLaunchBound) ; reprise auto via localStorage.
//  NB : nommé 'tours' — 'tutos' est déjà pris par le module centre d'aide.
//  v3 : visites du lead management par poste (lm-vendeur, lm-chef,
//  lm-direction, lm-plateau), lancées depuis la section Lead management du
//  centre d'aide (tutos v3).
// ============================================================================
/* =====================================================================
   One Data — Visites guidées « Montre-moi en vrai »  (v5)
   À coller en « code au chargement de page » sur CHAQUE page concernée.
   Lancer : <button data-tour-launch="lead-management">…</button>
            ou  window.OneDataTour.launch('lead-management')
   ---------------------------------------------------------------------
   Propriétés d'étape :
     target   : { css } | { tour:'data-tour' } | { text }   (élément à surligner)
     optional : true → étape ignorée si sa cible est absente AU DÉMARRAGE
     requires : 'css' → étape incluse seulement si ce repère existe au démarrage
     action   : { click:'css' } | function(doc) → exécutée quand l'étape s'affiche
                (ex. basculer d'onglet pour révéler la cible suivante)
   ===================================================================== */
OD.define('tours', {
  mount(__anchor, ctx) {
  // Module app-level : une seule ancre (header partagé), pas de rendu dans
  // __anchor (les visites s'affichent en overlay). Expose window.OneDataTour.
  const doc = __anchor.ownerDocument || document;
  const win = doc.defaultView || window;

  const TOURS = {
    'gestion-ventes': {
      pageId: '9e90d49a-215f-4c2b-b2bb-2d7c4f9aabd6',
      rootCheck: '#kanban-root .kan-toolbar',
      steps: [
        { title: 'Gestion des ventes', body: 'Voici ton pipe commercial. Je te montre l\u2019essentiel en moins d\u2019une minute \u2014 clique « Suivant ».' },
        { target: { css: '#kanban-root .k-vend' }, title: 'Le vendeur affiché', body: 'Tu vois les affaires d\u2019un vendeur à la fois. En tant que manager, clique ici pour en changer.' },
        { target: { css: '#kanban-root .k-dates' }, title: 'La période', body: 'Seules les affaires mises à jour entre ces deux dates s\u2019affichent.' },
        { target: { css: '#kanban-root .k-filters' }, title: 'Les filtres', body: 'Affine d\u2019un clic : VN ou VO, particuliers ou sociétés, financement ou comptant.' },
        { target: { css: '#kanban-root .kan-board' }, title: 'Le pipe', body: 'Chaque affaire avance de Brouillon vers Propale, puis BDC, et enfin Gagné ou Perdu.' },
        { target: { css: '#kanban-root [data-col="propale"]' }, title: 'Une colonne', body: 'En tête : le nombre d\u2019affaires, le montant total, et le taux de conversion depuis l\u2019étape précédente.' },
        { target: { css: '#kanban-root .kc-card' }, title: 'Une affaire', body: 'Une carte = un client et son véhicule. Le nom ouvre la fiche client, et l\u2019âge t\u2019alerte quand une affaire traîne.' },
        { target: { css: '#kanban-root .kc-card .kc-move' }, title: 'Faire avancer une affaire', body: 'Glisse-dépose la carte vers une autre colonne, ou utilise ce bouton. Gagné/Perdu est réservé aux managers.' },
        { target: { css: '#kanban-root .kc-card .kc-actions' }, title: 'Les actions', body: 'Sur chaque carte : générer le PDF, modifier la propale, ou archiver.' },
        { title: 'À toi de jouer', body: 'Tu sais piloter ton pipe. Reviens au centre d\u2019aide quand tu veux.' },
      ],
    },

    'lead-management': {
      pageId: '99519997-f935-471a-9147-b0118191b991',
      rootCheck: '#lead-mgmt-root .lm-toggle',
      steps: [
        { title: 'Lead Management', body: 'Le poste de pilotage des leads et des cycles commerciaux. La visite s\u2019adapte à ce que tu vois à l\u2019écran.' },
        { target: { css: '#lead-mgmt-root .lm-toggle' }, title: 'Les vues', body: 'Bascule ici entre les différentes vues de la page.' },
        { optional: true, target: { css: '#lead-mgmt-root .lm-team' }, title: 'Ton équipe', body: 'Déplie réseau, affaire et site. Clique un site pour le définir comme site global, ou un vendeur pour consulter son détail.' },
        { optional: true, target: { css: '#lead-mgmt-root #lm-range' }, title: 'La période', body: 'Choisis la fenêtre d\u2019analyse : un clic sur la date de début, un clic sur la date de fin.' },
        { optional: true, target: { css: '#lead-mgmt-root .lm-synth-kpi' }, title: 'Tes indicateurs', body: 'Cycles actifs, wins, taux de conversion et délai de premier contact sur la période.' },
        { optional: true, target: { css: '#lead-mgmt-root .lm-synth-2col' }, title: 'Le classement', body: 'Tes meilleurs performers et ceux à soutenir, selon le taux de transformation.' },
        { optional: true, target: { css: '#lead-mgmt-root [data-section="campagnes"]' }, title: 'Les campagnes', body: 'Ici, le ROI de tes campagnes de sollicitation : de la sollicitation jusqu\u2019au win.' },
        { optional: true, target: { css: '#lead-mgmt-root .lm-cmp-summary' }, title: 'ROI des campagnes', body: 'Pour chaque campagne, l\u2019entonnoir sollicitation → cycles → propales → BDC → wins.' },
        { optional: true, action: { click: '#lead-mgmt-root .lm-toggle [data-view="a_traiter"]' }, target: { css: '#lead-mgmt-root .kpi-bar' }, title: 'Tes indicateurs du jour', body: 'SLA dépassé, à traiter, relances dues, cycles chauds, cycles ouverts.' },
        { optional: true, action: { click: '#lead-mgmt-root .lm-toggle [data-view="a_traiter"]' }, target: { css: '#lead-mgmt-root .filters' }, title: 'Filtrer & rechercher', body: 'Filtre par source de lead, ou recherche un client par son nom ou son véhicule.' },
        { optional: true, action: { click: '#lead-mgmt-root .lm-toggle [data-view="a_traiter"]' }, target: { css: '#lead-mgmt-root .card' }, title: 'Un cycle à traiter', body: 'Chaque carte est un cycle. La couleur et le délai signalent l\u2019urgence. Clique pour ouvrir la fiche client.' },
        { requires: '#lead-mgmt-root .lm-toggle [data-view="pipeline"]', action: { click: '#lead-mgmt-root .lm-toggle [data-view="pipeline"]' }, target: { css: '#lead-mgmt-root .lm-kanban' }, title: 'Le pipeline', body: 'L\u2019autre vue : tes cycles répartis par étape — Nouveau, En cours, Avancé, Clos. Clique une carte pour ouvrir la fiche client.' },
        { action: { click: '#lead-mgmt-root .lm-toggle [data-view="a_traiter"]' }, title: 'À toi de jouer', body: 'Traite tes leads à temps — c\u2019est souvent là que la vente se gagne.' },
      ],
    },

    // ── Lead management par poste (Team Colin, lead-mgmt v52 et plus) ──────
    // Une visite par poste ; le centre d'aide choisit celle du rôle. Les
    // actions basculent d'onglet pour révéler la cible suivante.
    'lm-vendeur': {
      pageId: '99519997-f935-471a-9147-b0118191b991',
      rootCheck: '.lmtc .poste .tabs',
      steps: [
        { title: 'Ton poste vendeur', body: 'Je te montre ton poste en moins d’une minute. Clique « Suivant ».' },
        { action: { click: '.lmtc .tabs [data-id="afaire"]' }, target: { css: '.lmtc .situ .situ-t' }, title: 'La situation', body: 'Une phrase dit combien de personnes tu as à appeler et combien de leads sont libres dans la piscine du site.' },
        { target: { css: '.lmtc .situ .kpis' }, title: 'Les chiffres du jour', body: 'Tes premiers contacts et tes prises du jour, ce qui reste à faire, la piscine et tes relances de campagne.' },
        { target: { css: '.lmtc .poste .sig' }, title: 'Les signaux', body: 'Ce qui vient d’arriver : un lead qualifié par le plateau, un lead que ton chef te confie, un rappel. Chaque signal porte son bouton ; « Vu » le retire.' },
        { target: { css: '.lmtc .poste .tabs' }, title: 'Tes trois onglets', body: 'À faire, la piscine du site et tes campagnes. Le chiffre passe en rouge dès qu’un lead est hors délai.' },
        { target: { css: '.lmtc .poste .panel' }, title: 'À faire', body: 'Tes leads pas encore contactés, le plus pressé en tête, puis tes relances. Chaque ligne dit quoi faire et pourquoi. Clique-la : la fiche s’ouvre à droite, et en bas tu dis ce qui s’est passé.' },
        { action: { click: '.lmtc .tabs [data-id="piscine"]' }, target: { css: '.lmtc .poste .panel' }, title: 'La piscine du site', body: 'Les leads que personne n’a pris. « Prendre » met le lead à ton nom : il passe dans « À faire ».' },
        { action: { click: '.lmtc .tabs [data-id="campagnes"]' }, target: { css: '.lmtc .poste .panel' }, title: 'Mes campagnes', body: 'Les clients que ton chef t’a confiés. Un clic ouvre la fiche du client : appelle, puis fais ton compte rendu.' },
        { optional: true, target: { css: '.lmtc .situ [data-a="ancien"]' }, title: 'L’écran précédent', body: '« Tableaux détaillés » ramène aux cycles, au kanban et à la synthèse.' },
        { action: { click: '.lmtc .tabs [data-id="afaire"]' }, title: 'À toi de jouer', body: 'Commence par le haut de « À faire ». Les tutos Lead management du centre d’aide détaillent chaque geste.' },
      ],
    },

    'lm-chef': {
      pageId: '99519997-f935-471a-9147-b0118191b991',
      rootCheck: '.lmtc .poste .tabs',
      steps: [
        { title: 'Ton poste chef des ventes', body: 'Je te montre ton poste en moins d’une minute. Clique « Suivant ».' },
        { action: { click: '.lmtc .tabs [data-id="mur"]' }, target: { css: '.lmtc .situ .situ-t' }, title: 'La situation', body: 'Combien de leads sont hors délai dans la piscine, combien sont pris sans appel, et les premiers contacts de l’équipe aujourd’hui.' },
        { target: { css: '.lmtc .situ .kpis' }, title: 'Les chiffres du site', body: 'Leads libres, chez les vendeurs, au plateau VROOM, ouverts depuis plus de 24 h (et les archives), et le délai moyen de premier contact.' },
        { target: { css: '.lmtc .poste .sig' }, title: 'Les signaux', body: 'Ce qui demande ton intervention, chacun avec son bouton. « Vu » le retire.' },
        { target: { css: '.lmtc table.mur:not(.sites)' }, title: 'Le mur', body: 'Qui a la main sur quoi, et depuis combien de temps. Chaque lead ouvert est compté une fois, chez la personne qui l’a en main.' },
        { target: { css: '.lmtc table.mur tr.pisc' }, title: 'La piscine en tête', body: 'Personne n’y a la main : c’est la première ligne à regarder.' },
        { optional: true, target: { css: '.lmtc table.mur tr.vroom' }, title: 'Au plateau VROOM', body: 'Les leads BACS de ton site que le plateau n’a pas encore qualifiés.' },
        { optional: true, target: { css: '.lmtc table.mur .cell[data-a="cell"]' }, title: 'Clique un chiffre', body: 'La liste de ces leads s’ouvre dans le volet de droite. Ouvre un lead pour l’attribuer, puis « Retour à la liste ».' },
        { target: { css: '.lmtc .ph-r .seg' }, title: 'Compter depuis', body: 'L’arrivée sur le site (le transfert du plateau, sinon la réception) ou la réception dans BACS.' },
        { action: { click: '.lmtc .tabs [data-id="relayer"]' }, target: { css: '.lmtc .poste .panel' }, title: 'À relayer', body: 'Ce qui reste en plan, groupe par groupe, avec le geste proposé : attribuer, rendre, renvoyer, confier au plateau, solder le stock.' },
        { action: { click: '.lmtc .tabs [data-id="campagnes"]' }, target: { css: '.lmtc .poste .panel' }, title: 'Campagnes', body: 'L’avancement de chaque campagne, vendeur par vendeur, et « Créer une campagne ».' },
        { action: { click: '.lmtc .tabs [data-id="mur"]' }, title: 'À toi de jouer', body: 'Un coup d’œil au mur, puis « À relayer ». Les tutos Lead management du centre d’aide détaillent chaque geste.' },
      ],
    },

    'lm-direction': {
      pageId: '99519997-f935-471a-9147-b0118191b991',
      rootCheck: '.lmtc .poste .tabs',
      steps: [
        { action: { click: '.lmtc [data-a="retour-sites"]' }, title: 'Ton poste direction', body: 'Je te montre ton poste en moins d’une minute. Clique « Suivant ».' },
        { action: { click: '.lmtc .tabs [data-id="mur"]' }, target: { css: '.lmtc .situ .situ-t' }, title: 'La situation', body: 'Les trois délais de premier contact les plus longs sur 30 jours, et les leads ouverts depuis plus de 24 h.' },
        { target: { css: '.lmtc .situ .kpis' }, title: 'Les chiffres du périmètre', body: 'Leads reçus sur 7 jours, en piscine, hors délai, ouverts depuis plus de 24 h, encore au plateau VROOM.' },
        { target: { css: '.lmtc .poste .sig' }, title: 'Les signaux', body: 'Ce qui demande une attention, site par site.' },
        { target: { css: '.lmtc table.mur.sites' }, title: 'Le mur des sites', body: 'Une ligne par site : où en sont les leads maintenant, puis le délai de premier contact et la part dans le délai sur 30 jours.' },
        { optional: true, target: { css: '.lmtc [data-a="voir-site"]' }, title: 'Ouvrir un site', body: 'Montre le mur du chef des ventes de ce site. « ← Tous les sites » ramène ici.' },
        { action: { click: '.lmtc .tabs [data-id="relais"]' }, target: { css: '.lmtc .poste .panel' }, title: 'Le relais', body: 'De BACS au premier appel, en temps médian par site. Les segments hachurés n’appartiennent à personne : c’est là que le temps se perd.' },
        { action: { click: '.lmtc .tabs [data-id="campagnes"]' }, target: { css: '.lmtc .poste .panel' }, title: 'Campagnes', body: 'Les campagnes de tout ton périmètre, et la création d’une campagne.' },
        { action: { click: '.lmtc .tabs [data-id="mur"]' }, title: 'À toi de jouer', body: 'Repère le site le plus lent, puis ouvre son mur.' },
      ],
    },

    'lm-plateau': {
      pageId: '99519997-f935-471a-9147-b0118191b991',
      rootCheck: '.lmtc .poste .tabs',
      steps: [
        { title: 'Ton poste plateau VROOM', body: 'Je te montre ton poste en moins d’une minute. Clique « Suivant ».' },
        { action: { click: '.lmtc .tabs [data-id="piscine"]' }, target: { css: '.lmtc .situ .situ-t' }, title: 'La situation', body: 'Combien de leads sont libres et hors délai dans la piscine BACS, depuis quand attend le plus ancien, et les rappels dus.' },
        { target: { css: '.lmtc .situ .kpis' }, title: 'Les chiffres du plateau', body: 'Pris, qualifiés, rappels, abandonnés aujourd’hui ; l’âge de la copie BACS ; et le report dans BACS, « automatique » quand tout passe.' },
        { optional: true, target: { css: '.lmtc .bd' }, title: 'Le canal BACS', body: 'Rouge : aucune session BACS ne répond, ouvre BACS et connecte-toi. Bleu : tes gestes passent par un collègue. Orange : des gestes attendent.' },
        { target: { css: '.lmtc .poste .sig' }, title: 'Les signaux', body: 'Nouveau lead, hors délai, rappel, relais bloqué : chaque signal porte son bouton. « Vu » le retire.' },
        { target: { css: '.lmtc .poste .tabs' }, title: 'Tes quatre onglets', body: 'La piscine BACS, les rappels, les transferts et les campagnes.' },
        { optional: true, target: { css: '.lmtc .chips.filtres' }, title: 'Les sources', body: 'Une pastille par source. Le trafic atelier est masqué par défaut : clique une pastille pour l’ajouter ou la retirer.' },
        { optional: true, target: { css: '.lmtc .barre .seg' }, title: 'Le stock accepté', body: 'Les leads acceptés il y a plus de 14 jours, jamais qualifiés ni abandonnés.' },
        { target: { css: '.lmtc .poste .panel' }, title: 'La piscine BACS', body: 'Du plus ancien au plus récent. « Prendre » réserve le lead à ton nom, le passe en Accepté dans BACS et ouvre sa fiche : qualifie, oriente, choisis l’issue.' },
        { action: { click: '.lmtc .tabs [data-id="rappels"]' }, target: { css: '.lmtc .poste .panel' }, title: 'Rappels', body: 'Injoignables et projets long terme, du plus en retard au plus lointain.' },
        { action: { click: '.lmtc .tabs [data-id="transferts"]' }, target: { css: '.lmtc .poste .panel' }, title: 'Transferts', body: 'Ce que deviennent tes leads qualifiés. Après 2 h sans contact, « Relancer le chef » alerte le site.' },
        { action: { click: '.lmtc .tabs [data-id="campagnes"]' }, target: { css: '.lmtc .poste .panel' }, title: 'Campagnes', body: 'Les campagnes BACS. « Filtrer » restreint tes files à une campagne.' },
        { action: { click: '.lmtc .tabs [data-id="piscine"]' }, title: 'À toi de jouer', body: 'Prends le plus ancien. Garde l’onglet BACS ouvert et connecté : One Data y écrit pour toi.' },
      ],
    },

    'suivi-activite': {
      pageId: '55717966-7e07-4957-9969-399198cce1ad',
      rootCheck: '#act-root .act-bar',
      steps: [
        { title: 'Suivi d\u2019activité', body: 'Qui fait quoi, combien, et avec quel résultat. Je te fais le tour des contenus.' },
        { target: { css: '#act-root .act-bar' }, title: 'La barre d\u2019outils', body: 'Tout se pilote d\u2019ici : période, filtres, export et comparateur.' },
        { target: { css: '#act-root #act-range' }, title: 'La période', body: 'Un clic sur la date de début, un clic sur la fin. Tous les chiffres et graphes se recalculent.' },
        { optional: true, target: { css: '#act-root .act-toggle' }, title: 'Filtre par type', body: 'Restreins aux vendeurs VN, VO ou mixtes (VNVO).' },
        { optional: true, target: { css: '#act-root #act-export' }, title: 'Export Excel', body: 'Exporte le périmètre affiché, filtres appliqués, en un clic.' },
        { optional: true, target: { css: '#act-root #act-cmp-toggle' }, title: 'Comparer', body: 'Active le comparateur, puis clique deux lignes de l\u2019arbre pour les mettre côte à côte.' },
        { target: { css: '#act-root .act-kpi-grid' }, title: 'Le résumé', body: 'Contacts, RDV choc, propales, BDC, wins et abandons sur la période et le périmètre choisis.' },
        { target: { css: '#act-root #act-c1' }, title: 'Contacts par jour', body: 'Une courbe par vendeur ; la courbe orange en pointillés est la moyenne. Bascule Total / Entrants / Sortants, ou lisse avec « MM 7j ».' },
        { target: { css: '#act-root #act-c2' }, title: 'Le pipeline dans le temps', body: 'Propales, BDC, wins et abandons, en cumulé ou au quotidien.' },
        { target: { css: '#act-root .act-tree' }, title: 'L\u2019arbre du périmètre', body: 'Réseau, affaire, site, type, vendeur. Clique une ligne pour tout filtrer ; clique un site pour en faire le site global partout.' },
        { optional: true, target: { css: '#act-root .act-hm' }, title: 'La cadence', body: 'Pour un site ou un vendeur : une heatmap jour par jour, l\u2019intensité = le nombre de contacts.' },
        { optional: true, target: { css: '#act-root .act-vtable' }, title: 'Le détail par vendeur', body: 'Le mix des canaux (VOIP, WhatsApp, SMS, RPV) et tous les indicateurs, vendeur par vendeur.' },
        { title: 'À toi de jouer', body: 'Sélectionne un site ou un vendeur dans l\u2019arbre pour faire apparaître la cadence et le détail. Bonne analyse.' },
      ],
    },

    'performances': {
      pageId: '1499f15f-e8cb-4561-aea8-bdeeeb080b68',
      rootCheck: '#perf-root .pf-bar',
      steps: [
        { title: 'Performances', body: 'Ton réalisé face aux objectifs, sur cinq indicateurs clés. Je te montre comment lire la page.' },
        { target: { css: '#perf-root #pf-range' }, title: 'La période', body: 'Un clic sur le début, un clic sur la fin. Tout se recalcule sur la plage choisie.' },
        { target: { css: '#perf-root .pf-toggle' }, title: 'Filtre par type', body: 'Restreins aux véhicules neufs (VN), occasions (VO) ou mixtes (VNVO).' },
        { target: { css: '#perf-root .pf-resume' }, title: 'Le prorata du mois', body: 'Les couleurs comparent ton atteinte au pourcentage de jours ouvrés déjà écoulés : vert = dans les temps, orange = léger retard, rouge = loin derrière. Fini le « tout rouge » le 5 du mois.' },
        { target: { css: '#perf-root #pf-export' }, title: 'Export Excel', body: 'Exporte le périmètre affiché, filtres appliqués, en un clic.' },
        { target: { css: '#perf-root #pf-cmp-toggle' }, title: 'Comparer', body: 'Active le comparateur, puis clique deux lignes de l\u2019arbre pour les mettre côte à côte sur les cinq indicateurs.' },
        { optional: true, target: { css: '#perf-root .pf-chips' }, title: 'Le mois', body: 'Quand la période couvre plusieurs mois, isole un mois précis ou garde le cumul.' },
        { target: { css: '#perf-root .pf-kpi-grid' }, title: 'Les cinq indicateurs', body: 'Commandes, Financement, Waxoyl, CS et Gravage : réalisé sur objectif, avec le pourcentage d\u2019atteinte.' },
        { target: { css: '#perf-root #pf-c1' }, title: 'Réalisé vs objectif', body: 'Le réalisé et l\u2019objectif côte à côte sur les cinq indicateurs.' },
        { target: { css: '#perf-root #pf-c2' }, title: 'Atteinte par périmètre', body: 'Le pourcentage d\u2019atteinte commandes par réseau, site ou vendeur selon ta sélection, classé.' },
        { optional: true, target: { css: '#perf-root #pf-c3' }, title: 'Tendance mensuelle', body: 'L\u2019évolution des commandes réalisées face à l\u2019objectif, mois par mois.' },
        { target: { css: '#perf-root .pf-tree' }, title: 'L\u2019arbre du périmètre', body: 'Réseau, affaire, site, type, vendeur. Clique une ligne pour filtrer, un site pour en faire le site global, ou un chiffre pour le détail des commandes (avec le BDC en PDF).' },
        { title: 'À toi de jouer', body: 'Pilote ton mois au prorata, pas au compteur brut. Bonne route vers les objectifs.' },
      ],
    },

    'objectifs': {
      pageId: 'c9b4f9a6-460a-4365-8a06-95e30a13cbdb',
      rootCheck: '#obj-root .obj-tree, #obj-root .obj-cards',
      steps: [
        { title: 'Objectifs', body: 'Cette page s\u2019adapte à ton rôle. Le vendeur suit son tableau de marche du mois ; le chef des ventes dispose d\u2019un atelier pour fixer et répartir les objectifs. Suivons-la ensemble.' },
        { target: { css: '#obj-root .obj-bar' }, title: 'Période et type', body: 'On commence toujours par l\u2019année, le mois et le type de véhicule (VN, VO ou les deux). Tout ce qui suit se recalcule sur cette sélection — un mois à la fois.' },

        { optional: true, target: { css: '#obj-root .obj-hero' }, title: 'Ton mois', body: 'En haut, le nombre de jours ouvrés déjà écoulés et le pourcentage du mois passé. C\u2019est ton rythme de référence : à 50 % du mois, on attend la moitié des objectifs.' },
        { optional: true, target: { css: '#obj-root .obj-cards' }, title: 'Objectif et rythme', body: 'Une carte par indicateur : ton réalisé sur l\u2019objectif du mois. Le trait bleu sur la barre marque le rythme attendu au prorata, la couleur dit si tu es dans les temps, et la dernière ligne traduit le reste à faire en cadence concrète (« 1 tous les 2 jours »).' },

        { requires: '#obj-root .obj-repart', action: function (d) { try { var w = d.defaultView; if (w.__objState && !w.__objState.atelierOpen) { w.__objState.atelierOpen = true; if (w.__renderObj) w.__renderObj(); } } catch (e) {} }, target: { css: '#obj-root .obj-repart' }, title: 'L\u2019atelier du chef', body: 'Voici le principe, en quatre temps : tu poses un cap d\u2019équipe, tu le répartis entre tes vendeurs, tu ajustes à la main, puis tu enregistres. Point important : rien n\u2019est écrit en base tant que tu n\u2019as pas enregistré — tout se construit en brouillon. (Ce bloc se plie et se déplie ; replié, tu sélectionnes un site dans l\u2019arbre pour lui définir des objectifs un par un.)' },
        { requires: '#obj-root .obj-repart', target: { css: '#obj-root .obj-cap' }, title: 'Le cap d\u2019équipe', body: 'Tu fixes d\u2019abord la cible de commandes de l\u2019équipe. À droite, les taux de pénétration (financement, CS, Waxoyl, gravage) sont pré-remplis avec ce que ton équipe a réellement fait le mois dernier et en déduisent automatiquement les cibles. Monte un taux pour viser plus haut, ou tape directement une cible : taux et cible restent synchronisés. Contacts/jour fixe la cadence d\u2019activité.' },
        { requires: '#obj-root .obj-repart', target: { css: '#obj-root .obj-mode' }, title: 'Les modes de répartition', body: 'C\u2019est le c\u0153ur du dispositif. « Équitablement » donne autant à chacun. « Au prorata du réalisé M-1 » donne plus à ceux qui ont le plus vendu le mois dernier. « Selon les jours de présence » pondère par la disponibilité (congés, temps partiel). « À la main » te laisse tout saisir. Le bouton « Répartir » applique le mode et remplit alors toute la grille — tous les indicateurs — en une fois.' },
        { requires: '#obj-root .obj-repart', target: { css: '#obj-root #obj-balpill' }, title: 'Le contrôle d\u2019équilibre', body: 'Cette pastille te dit en continu où tu en es : réparti X sur cible Y. Vert quand tu tombes pile sur la cible, bleu quand il reste à distribuer, orange si tu dépasses. Tu gardes la main même après une répartition automatique.' },
        { requires: '#obj-root .obj-repart', target: { css: '#obj-root .obj-reconduire' }, title: 'Reconduire le mois dernier', body: 'Plutôt que repartir de zéro, « Reconduire M-1 » recharge les objectifs du mois précédent comme point de départ — que tu ajustes ensuite. Là encore, ça ne fait que remplir le brouillon.' },
        { optional: true, target: { css: '#obj-root .obj-tree' }, title: 'Affiner par périmètre', body: 'L\u2019arbre réseau → affaire → site → type (VN/VO) → vendeur montre les totaux à chaque niveau. Sélectionne un site pour n\u2019y appliquer le cap et la répartition que sur lui. Tu peux aussi cliquer n\u2019importe quel chiffre d\u2019une ligne vendeur pour le corriger : la valeur modifiée passe en bleu.' },
        { requires: '#obj-root .obj-repart', target: { css: '#obj-root .obj-save' }, title: 'Enregistrer (ou pas)', body: 'En bas de l\u2019atelier, « Enregistrer les objectifs » écrit tout d\u2019un coup et « Réinitialiser » annule le brouillon — les deux s\u2019activent dès que tu modifies quelque chose. À ce moment-là, un bandeau d\u2019alerte apparaît aussi tout en haut. Tant que tu n\u2019enregistres pas, tes vendeurs ne voient rien changer.' },

        { title: 'À toi de jouer', body: 'En début de mois : pose le cap, choisis un mode de répartition, affine par vendeur, puis enregistre. Bon début de mois.' },
      ],
    },
  };

  /* ===================== CIBLAGE ===================== */
  function visible(n) { return n && n.offsetParent !== null && n.getClientRects().length > 0; }
  function resolveTarget(t) {
    if (!t) return null;
    try {
      if (t.css) return doc.querySelector(t.css);
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
      if (typeof a === 'function') { a(doc); return; }
      if (a && a.click) { const n = doc.querySelector(a.click); if (n) n.click(); }
    } catch (e) {}
  }

  /* ===================== UI ===================== */
  let catcher, hl, tip, tipTitle, tipBody, tipStep, btnPrev, btnNext;
  let tour = null, idx = 0, curNode = null;

  function injectCSS() {
    if (doc.getElementById('odt-css')) return;
    const css = `
.odt-catcher{position:fixed;inset:0;z-index:2147482999;background:transparent;}
.odt-hl{position:fixed;z-index:2147483000;border-radius:10px;border:2px solid #53bda7;
  box-shadow:0 0 0 100vmax rgba(20,30,50,.55),0 0 0 4px rgba(83,189,167,.5);pointer-events:none;transition:all .2s ease;display:none;}
.odt-tip{position:fixed;z-index:2147483002;background:#fff;color:#1c2b45;border-radius:14px;padding:16px 18px;
  max-width:320px;width:calc(100vw - 32px);box-shadow:0 16px 40px rgba(28,43,69,.28);
  font-family:'Nunito Sans',-apple-system,Segoe UI,Roboto,sans-serif;display:none;}
.odt-tip h4{margin:0 14px 6px 0;font-size:16px;font-weight:800;}
.odt-tip p{margin:0;font-size:14px;line-height:1.5;color:#41506b;}
.odt-foot{display:flex;align-items:center;justify-content:space-between;margin-top:14px;gap:10px;}
.odt-step{font-size:12px;color:#8895ad;}
.odt-btns{display:flex;gap:8px;}
.odt-btn{border:none;border-radius:9px;padding:8px 14px;font:inherit;font-weight:700;font-size:14px;cursor:pointer;}
.odt-prev{background:#eef1f7;color:#41506b;}
.odt-next{background:#2a5ea9;color:#fff;}
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
    hl = doc.createElement('div'); hl.className = 'odt-hl'; hl.id = 'odt-hl-el';
    tip = doc.createElement('div'); tip.className = 'odt-tip'; tip.id = 'odt-tip';
    tip.innerHTML = '<button class="odt-quit" aria-label="Quitter">\u00d7</button>' +
      '<h4></h4><p></p>' +
      '<div class="odt-foot"><span class="odt-step"></span>' +
      '<div class="odt-btns"><button class="odt-btn odt-prev">Précédent</button>' +
      '<button class="odt-btn odt-next">Suivant</button></div></div>';
    tipTitle = tip.querySelector('h4'); tipBody = tip.querySelector('p'); tipStep = tip.querySelector('.odt-step');
    btnPrev = tip.querySelector('.odt-prev'); btnNext = tip.querySelector('.odt-next');
    tip.querySelector('.odt-quit').addEventListener('click', end);
    btnPrev.addEventListener('click', () => go(idx - 1));
    btnNext.addEventListener('click', () => (idx >= tour.steps.length - 1 ? end() : go(idx + 1)));
    doc.body.appendChild(catcher); doc.body.appendChild(hl); doc.body.appendChild(tip);
    win.__odtReposition = reposition;
    if (!win.__odtScrollBound) {
      win.__odtScrollBound = true;
      win.addEventListener('scroll', () => { if (win.__odtReposition) win.__odtReposition(); }, true);
      win.addEventListener('resize', () => { if (win.__odtReposition) win.__odtReposition(); });
    }
  }

  let veille = null;
  function show() {
    catcher.style.display = 'block'; tip.style.display = 'block';
    clearInterval(veille);
    veille = setInterval(() => { if (!tour) { clearInterval(veille); return; } if (curNode && !curNode.isConnected) reposition(); }, 400);
  }
  function hide() { if (catcher) catcher.style.display = 'none'; if (tip) tip.style.display = 'none'; if (hl) hl.style.display = 'none'; }

  function go(i) {
    if (i < 0) i = 0; idx = i; const step = tour.steps[idx];
    if (step.action) runAction(step.action);   // bascule d'onglet, etc.
    tipTitle.textContent = step.title || '';
    tipBody.textContent = step.body || '';
    tipStep.textContent = (idx + 1) + ' / ' + tour.steps.length;
    btnPrev.style.visibility = idx === 0 ? 'hidden' : 'visible';
    btnNext.textContent = idx >= tour.steps.length - 1 ? 'Terminer' : 'Suivant';
    let tries = 0;
    (function find() {
      const node = step.target ? resolveTarget(step.target) : null;
      if (node) { curNode = node; try { node.scrollIntoView({ block: 'center', behavior: 'smooth' }); } catch (e) {} setTimeout(reposition, 320); }
      else if (step.target && tries < 16) { tries++; setTimeout(find, 250); }
      else { curNode = null; if (hl) hl.style.display = 'none'; centerTip(); }
    })();
  }

  function reposition() {
    if (!tour || !tip) return;
    // La page a été redessinée (rechargement, données arrivées après un
    // changement d'onglet) : la cible d'avant n'est plus dans le document.
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
    const tw = tip.offsetWidth, th = tip.offsetHeight, m = 12;
    let top = r.bottom + m, left = r.left;
    if (top + th > win.innerHeight - m) top = Math.max(m, r.top - th - m);
    if (left + tw > win.innerWidth - m) left = win.innerWidth - tw - m;
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
    buildUI();
    const eff = def.steps.filter(s => {
      if (s.requires && !doc.querySelector(s.requires)) return false;        // garde de présence
      if (s.optional && s.target && !resolveTarget(s.target)) return false;  // étape optionnelle absente
      return true;
    });
    tour = { steps: eff.length ? eff : def.steps.slice() };
    idx = 0; curNode = null;
    show(); go(0);
  }
  function end() {
    tour = null; curNode = null; hide();
    try { win.localStorage.removeItem('onedata_pending_tour'); } catch (e) {}
  }
  // Navigation ÉDITEUR vs PROD — même patron éprouvé que la top nav :
  //  - ÉDITEUR : par UID (vrai SPA interne, aucune imbrication d'éditeur).
  //  - PROD    : par CHEMIN /fr/xxx. Un UID en prod s'inscrit tel quel dans l'URL
  //              -> route inexistante -> PAGE BLANCHE (bug constaté).
  const LANG_PREFIX = '/fr';
  const PAGE_PATHS = {            // pageId -> chemin (table alignée sur la top nav)
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
    if (goToTourPage(t)) return;
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
  function pending() {
    try { const u = new URL(win.location.href); const f = u.searchParams.get('tour'); if (f) return f; } catch (e) {}
    try { return win.localStorage.getItem('onedata_pending_tour'); } catch (e) { return null; }
  }
  function boot() {
    const id = pending(); if (!id || !TOURS[id]) return;
    const t = TOURS[id];
    let waited = 0;
    (function ready() {
      const ok = t.rootCheck ? !!doc.querySelector(t.rootCheck) : true;
      if (ok) { try { win.localStorage.removeItem('onedata_pending_tour'); } catch (e) {} start(id); }
      else if (waited >= 10000) { try { win.localStorage.removeItem('onedata_pending_tour'); } catch (e) {} }
      else { waited += 150; setTimeout(ready, 150); }
    })();
  }
  setTimeout(boot, 250);
  }
});