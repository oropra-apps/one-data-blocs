// ============================================================================
//  v49 (04/11/2026) : boutons « SMS de confirmation » et « E-mail de
//    confirmation » aux couleurs des boutons SMS et Email de la fiche client
//    (SMS ambre #e6a817, e-mail bleu #1F4A85, mêmes bordures et survols).
//    Aucun autre changement.
//  v48 (04/11/2026) : infobulle vraiment utilisable.
//    * En allant de l'événement vers l'infobulle, la souris passait sur
//      d'autres événements dont l'infobulle remplaçait aussitôt la première :
//      une infobulle ouverte ne cède plus la place qu'après un court arrêt
//      sur un autre événement (et jamais si la souris arrive dessus).
//    * Le téléphone appelle par le 3CX du vendeur (comme « Appeler » de la
//      fiche) ; le texte se sélectionne et se copie.
//  v47 (04/11/2026) : retours terrain.
//    * Fenêtre d'un RDV client existant : deux boutons « SMS de
//      confirmation » et « E-mail de confirmation ». Ils ouvrent les fenêtres
//      SMS / e-mail habituelles, pré-remplies (date, heure, adresse de la
//      concession, signature du vendeur) ; le vendeur relit et envoie.
//    * Livraisons : VN en vert, VO en orange (charte One Data). Un VD est un
//      VO. Le genre est lu dans l'objet BACS (« Livraison VO · … »), sinon
//      dans la commande rattachée (PROPALE_BDC.VN_VO), sinon dans le
//      commentaire ; à défaut, vert. Les livraisons portent 🚚 dans l'agenda
//      personnel, pour ne pas les confondre avec les RDV client (orange).
//  v46 (04/11/2026) : retour vendeurs — l'infobulle de survol devient
//    utilisable : elle reste ouverte quand la souris passe de l'événement à
//    l'infobulle (délai de fermeture), le nom du client ouvre sa fiche client,
//    le téléphone (celui du rendez-vous, sinon le portable de la fiche) se
//    clique pour appeler.
//  v45 (04/11/2026) : création d'une SOCIÉTÉ comme dans BACS — module partagé
//    oropra-bacs-client v6 : la société est créée dans BACS d'abord (compte
//    Business Account), puis dans One Data ; le panneau final rappelle de lui
//    désigner un interlocuteur (onglet Entreprise de la fiche). Actif quand
//    la base l'active (societe_ecrire_bacs) ; sinon comportement inchangé.
//    Aucun autre changement.
//  v44 (03/11/2026) : retours des séances de coaching (suite).
//    * « Autre créneau » s'appelle « Créneau libre », et c'est la nature
//      proposée par défaut quand on clique dans la grille (type « Autre »
//      présélectionné). Le RDV client reste à un clic.
//    * Ouverture depuis la fiche client (onglet RDV, « Ajouter un RDV ») : la
//      fiche pose window.__odAgendaCreer et ouvre l'agenda ; la même fenêtre
//      s'ouvre aussitôt en RDV client, sur ce client, au prochain créneau.
//  v43 (03/11/2026) : charge le module partagé sous l'étiquette
//    oropra-bacs-client-v5 (l'étiquette v4 a été posée par erreur sur
//    l'ancien code v3). Aucun autre changement que v42.
//  v42 (03/11/2026) : création d'un client — DEMANDE DE CONSENTEMENT en fin
//    de création (SMS envoyé par BACS au client, qui répond lui-même) et
//    message clair quand l'extension BACS n'est pas à jour (module partagé
//    oropra-bacs-client v4). Aucun autre changement.
//  v41 (03/11/2026) : retours des séances de coaching.
//    * L'entrée d'agenda en dit plus : le client, puis le type de RDV, le
//      véhicule et son immatriculation, puis le commentaire ; l'infobulle donne
//      type (ou « sans client »), véhicule, immatriculation, VIN, téléphone et
//      toujours le commentaire (get_calendar_events : extra.vehicule, immat, tel).
//    * Un événement PASSÉ s'ouvre et se modifie : on peut le déplacer (glisser
//      ou fenêtre), changer son type, son commentaire, ses invités. Créer dans
//      le passé reste interdit, et un événement à venir ne se tire pas dans le
//      passé. Un rendez-vous client passé non conclu ouvre toujours le compte
//      rendu, dont le lien « Le déplacer » ouvre maintenant la fenêtre.
//    * Un clic sur un jour (vue Mois, en-tête de jour) propose un créneau par
//      défaut : le prochain quart d'heure libre aujourd'hui, 9 h un autre jour.
//      Avant, un clic sur aujourd'hui en vue Mois tombait à 00:00 et était
//      refusé comme « dans le passé ».
//  v40 (03/11/2026) : création d'un client — BACS D'ABORD, One Data ensuite
//    (module partagé oropra-bacs-client v3). BACS vérifie le portable et
//    l'e-mail ; s'il refuse, aucune fiche n'est créée dans One Data et la
//    fenêtre reste ouverte pour corriger. Aucun autre changement.
//  v39 (02/11/2026) : CRÉNEAUX RÉCURRENTS. À la création d'un créneau (pas
//  de livraison, préparation, absence…), « Se répète » : les jours cochés,
//  toutes les 1 à 4 semaines, de l'heure de début à l'heure de fin, jusqu'à
//  la date choisie (create_creneau_serie : un vrai rendez-vous par date,
//  envoyé à BACS). Sur une occurrence : « Supprimer celui-ci » ou « Toute la
//  série à partir de celui-ci » (delete_rdv_serie).
// ============================================================================
//  v38 (02/11/2026) : EXPERT PRODUIT, PRÉPARATEUR, LIVRAISONS DU SITE.
//  - Onglet « Livraisons du site » : toutes les livraisons (= mises en main)
//    et préparations du site, quel que soit l'agenda où elles sont posées.
//    Une livraison reste UN rendez-vous : celui du vendeur est celui que voit
//    l'expert produit, jamais une copie. Couleur pleine : l'expert livre ;
//    pointillé : le vendeur livre lui-même.
//  - Fiche livraison au clic (sites avec expert produit, et préparateur) :
//    client, téléphone, véhicule, n° de commande, vendeur, commentaire BACS,
//    préparation, et « Qui livre ? » (agenda_mes_roles, rdv_livraison_qui).
//  - Préparateur (rôle 12) : lecture seule, rien à créer ni à déplacer ;
//    il ne voit que livraisons, préparations, réceptions de son site.
//  - Plannings imprimés : téléphone, véhicule, commande, vendeur, qui livre,
//    commentaire BACS complet, préparation ; nouvelle entrée « Choisir les
//    dates » (du … au …).
// ============================================================================
//  v37 (02/11/2026) : fenêtre de saisie — le commentaire prend la hauteur de
//  son texte (il était coupé à 2 lignes) ; les invités qui n'ont que BACS
//  s'affichent par leur nom (agenda_invitables).
// ============================================================================
//  v36 (02/11/2026) : FILTRE « AUCUN » ET PLANNING PRÉPARATEUR.
//  - « Aucun » à côté de « Tout » : on décoche tout puis on coche les natures
//    voulues ; un agenda sans nature cochée le dit en clair.
//  - Planning imprimable « Préparateur » (jour / semaine) : les seules
//    préparations du site, commentaire complet (clé, châssis, accessoires),
//    pour le préparateur sans poste. La préparation reste dans l'agenda de
//    celui qui la demande, comme dans BACS.

//  - Bandeau BACS : la vraie cause (extension à recharger, onglet BACS pas
//    prêt…) au lieu d'un « BACS fermé » systématique.
// ============================================================================
//  v35 (02/11/2026) : L'AGENDA DU SITE SUIT LE SITE.
//  - Le site choisi dans la barre du haut s'applique à l'agenda du site
//    (personnes et événements), et le choix fait dans l'agenda du site met à
//    jour la barre du haut : un seul site courant.
//  - Seuls les événements DE CE SITE s'affichent : une personne rattachée à
//    deux sites (secrétaire, chef des ventes) n'apporte plus à L'Haÿ ses
//    livraisons d'Arcueil. Les absences la suivent sur ses deux sites.
//  - Les personnes désactivées dans One Data qui tiennent encore un agenda
//    BACS sur le site (metteur en main) en font partie (agenda_site_membres).
//  - Fenêtre de saisie refondue : la nature d'abord (pastilles de couleur :
//    RDV client, livraison, préparation, réception / restitution, pas de
//    livraison, absence, autre créneau, bilatérale), puis « Dans l'agenda
//    de » et « Quand » côte à côte ; client, origine (menu) et physique /
//    téléphone seulement pour un RDV client. Deux colonnes sur ordinateur,
//    plein écran sur téléphone, plus de défilement.
// ============================================================================
//  v34 (02/11/2026) : AGENDA PERSONNEL + AGENDA DU SITE (maquette validée par
//  Antoine le 01/11/2026).
//  - Deux vues : « Mon agenda » (inchangé : couleur par nature) et « Agenda du
//    site », la SOMME des agendas personnels du site, façon Google Agenda :
//    une couleur par personne, les événements simultanés côte à côte, une
//    pastille par personne pour la masquer ou l'afficher. Un événement posé
//    dans l'une des vues est le même RDV que dans l'autre : rien à recopier.
//  - Tout le monde peut poser un créneau dans l'agenda de n'importe qui de son
//    site (la hiérarchie dans son périmètre, la VROOM team partout) : champ
//    « Dans l'agenda de » à la création ET en modification (changer de
//    personne déplace le RDV dans BACS : nouveau propriétaire).
//    Livraison : dans l'agenda du metteur en main, le vendeur qui la pose y
//    est invité d'office. Préparation : dans l'agenda du préparateur.
//  - Réceptions / restitutions, préparations, « pas de livraison » et
//    absences ont leur couleur et leur pastille : la rubrique grise
//    « Autres (BACS) » disparaît. L'ancien bouton « Planning livraisons »
//    est remplacé par l'agenda du site.
//  - Planning imprimable (A4 paysage) du responsable livraisons et des
//    préparateurs : JOUR et SEMAINE (livraisons, préparations, réceptions /
//    restitutions, créneaux bloqués), avec VIN et case à cocher.
//  - L'infobulle dit qui a posé l'événement quand ce n'est pas son
//    propriétaire (extra.pose_par).
//  Prérequis SQL : agendas_natures_bacs, agendas_auteur_controle,
//  agendas_site_droits (02/11/2026).
// ============================================================================
//  v33 (27/10/2026) : durées au format 1h30, 2h30 (au lieu de 1,5 h, 2,5 h).
//  v32 (27/10/2026) : BACS FERMÉ NE BLOQUE PLUS L'AGENDA.
//  Le RDV, le créneau ou la bilatérale s'enregistre toujours ; son envoi vers
//  BACS attend en file et part dès que BACS est rouvert sur le poste du
//  propriétaire (la base ne l'exige plus : _bacs_evt_deposer du 27/10). La
//  fenêtre le dit en clair au lieu de griser le bouton, et chaque événement
//  pas encore écrit dans BACS porte une pastille « BACS » (extra.bacs_attente).
//  La veille commune (topnav v34) signale la réouverture : l'agenda se
//  recharge alors pour retirer les pastilles.
// ============================================================================
//  v31 (27/10/2026) : DURÉE EN HEURES ET DÉPLACEMENT EXPLIQUÉ.
//  - La durée se choisit en heures (¼ h, ½ h, ¾ h, 1 h, 1h30 … 10 h) ; par
//    défaut 1 h. Une durée hors liste (sélection de 3 h 15 à la souris, RDV
//    BACS de 15 h) est ajoutée à la liste : avant, le menu retombait en
//    silence sur la première valeur et le RDV était enregistré à 15 min.
//  - Un événement qu'on ne peut pas déplacer le dit dès qu'on essaie de le
//    tirer (activité BACS, passé, RDV d'un collègue, rapport vendeur) : le
//    glisser-déposer restait muet et passait pour une panne.
//  - Un déplacement réussi est confirmé par un message.
// ============================================================================
//  v29 (25/10/2026) : RDV BACS « NEUTRES ». L'agenda est le miroir de BACS :
//  tout y est importé, y compris ce qui n'est pas de l'activité commerciale
//  (Réception / Restitution, créneaux « PAS DE LIVRAISON »). Ces RDV arrivent
//  marqués neutres (extra.neutre) : affichés en gris clair, rangés sous un
//  chip « Autres (BACS) » qu'on peut décocher, en lecture seule (ils se
//  modifient dans BACS), jamais « à conclure ».
//  v28 (25/10/2026) : AGENDA SYNCHRONISÉ AVEC BACS (Team Colin, demande de
//  Julien Faugeras). Chaque RDV, créneau et bilatérale posé, déplacé ou
//  supprimé ici est reporté dans l'agenda BACS de son propriétaire (la base
//  dépose le geste, l'extension l'écrit) ; les RDV pris dans BACS arrivent
//  ici. Dans la fenêtre : INVITÉS, comme dans BACS (BACS leur écrit), état de
//  la synchronisation, et bouton verrouillé en rouge tant que BACS n'est pas
//  ouvert sur le poste. Un RDV où l'on n'est qu'invité s'ouvre en lecture.
//  BACS interdisant toute suppression, un RDV supprimé y est marqué annulé.
//  v27 (22/10/2026) : bouton « Enregistrer » verrouillé en rouge (« Bacs doit être
//  ouvert pour pouvoir valider ») tant que BACS n'est pas ouvert ; il redevient
//  normal dès que BACS répond (module partagé oropra-bacs-client v2).
//  v26 (22/10/2026) : création de client SUIVIE — panneau d'avancement One Data
//  puis BACS (spinners), bouton « B » vers le compte BACS ; erreur si BACS n'est
//  pas ouvert chez le vendeur (module partagé oropra-bacs-client v1).
//  v25 (14/10/2026) : vendeurs inactifs retirés du choix « vendeur évalué »
//   (même effectif que l'accueil : présents dans dash_lire ce mois-ci ou le
//   mois dernier) ; bilatérales en bleu foncé #1F4A85 (charte One Data).
// ============================================================================
//  v21 (14/10/2026) : BILATÉRALES DEPUIS L'AGENDA (Team Colin).
//   - Création : retour immédiat. Un toast confirme « Bilatérale planifiée
//     avec … », l'événement apparaît tout de suite (placeholder) puis le
//     calendrier se recharge. Avant, la fenêtre se fermait sans rien dire et
//     l'événement n'apparaissait qu'après un temps de chargement muet.
//   - Liste « Vendeur évalué » enrichie : date de la dernière bilatérale
//     réalisée, ou « jamais reçu », et un repère ⚠ en cas de retard
//     (RPC bilat_resume_vendeurs). Les vendeurs à recevoir passent en tête.
//   - Bouton « Mener l'entretien maintenant » : crée la bilatérale à l'instant
//     présent (RPC bilat_creer_maintenant) et ouvre la fiche de réalisation.
//   - Clic sur une bilatérale : à venir -> modifier OU « Réaliser maintenant » ;
//     passée -> « Compléter le compte rendu » (le clic ne faisait plus rien).
//     Les deux ouvrent la fiche de réalisation sur la page Bilatérales.
//   - Livraisons empilées au même créneau (≥ 3) regroupées en un seul bloc
//     « N livraisons », qui se déplie au clic. Vues jour/semaine seulement.
//  Prérequis SQL : bilaterales_02_fonctions_teamcolin.sql. Sans lui, la liste
//  des vendeurs reste celle de la v20 et « maintenant » affiche une erreur
//  explicite ; rien d'autre ne change.
// ============================================================================
//  v20 (08/10/2026) : le selecteur de collaborateur suit le site choisi dans
//  la barre du haut. Chef des ventes : la liste ne garde que les
//  collaborateurs de ce site (ou de tout le perimetre si « Tout mon
//  perimetre » est choisi). Direction (cascade) : la cascade se cale sur ce
//  site a chaque changement. Si le collaborateur affiche n'est plus dans la
//  liste, l'agenda revient a celui de l'utilisateur. Les vendeurs sortis de
//  l'effectif sont retires cote base (get_agenda_perimeter, 08/10/2026).
//  v16 (05/10/2026) : filet d'affichage. Une valeur stockee hors referentiel
//  ("Other", une variante d'un import) ne retombe plus sur « Selectionner » :
//  elle est ajoutee comme option, avec son libelle propre quand on sait la
//  reconnaitre (casse, accents, point final), sinon telle quelle. Aucune
//  ecriture : la donnee reste visible et l'utilisateur corrige s'il le souhaite.
//  v15 (05/10/2026) : le select Civilite proposait `libelle` comme valeur
//  ("Monsieur") alors que la base stocke `libelle_court` ("M."), comme le fait
//  deja le select Type des societes. Aucune valeur ne correspondait donc jamais
//  et le champ retombait sur « Selectionner » : 145 fiches sur 60 181 affichaient
//  leur civilite. Le correctif en repare 45 708.
//  AGENDA (FullCalendar) — module One Data (OD.define)  v14 — COMPTE RENDU
//  v14 (05/10/2026) : resolution de l'ID_User par getSession() au lieu de
//  getUser() — un aller-retour vers /auth/v1/user de moins au demarrage
//  (140 ms mesures). Repli sur getUser() si aucune session n'est posee.
//
//  AJOUT v12 : LE CRÉNEAU QUI RESTE À CONCLURE SE VOIT VRAIMENT
//  (la v11 le marquait, mais .fc-event est en overflow:hidden et sa règle
//  est portée par « #agenda-root .fc .fc-event » : la pastille était
//  découpée et le fond écrasé. Sélecteur complet, pastille dans le titre.)
//  Un rendez-vous commercial passé dont personne n'a dit ce qu'il a donné est
//  cerné d'ambre et hachuré, avec la mention « à conclure » sur son titre. Le
//  vendeur voit son retard dans l'outil où il travaille déjà, pas dans un écran
//  qu'il devrait penser à ouvrir. Les livraisons en sont exclues : elles sont
//  tenues par les secrétaires, et un véhicule livré est un véhicule facturé.
//  Voir resteAConclure(), à côté de familleEvt().
//
//  AJOUT v10 : LE COMPTE RENDU DE RENDEZ-VOUS
//  Le clic sur un créneau PASSÉ ne faisait rien (openEdit refusait d'ouvrir).
//  Il ouvre maintenant une fiche de compte rendu. À venir → modifier, passé →
//  conclure. Aucun bouton nouveau à chercher : c'est le même geste.
//  Voir le bloc « COMPTE RENDU DE RENDEZ-VOUS » plus bas.
//
//  AGENDA (FullCalendar) — module One Data (OD.define)  v1 (checklist)
//  Rendu dans __anchor ; client via __OD_SB__ ; frontDoc/Win -> ancre ;
//  self-boot retiré ; re-render (ex-bloc « Re-render agenda ») intégré.
//  Lit window.__dash.rawData (dashboard). User via socle oropraUser.
// ============================================================================
// ============================================================================
//  One Data — Agenda (agenda_v1.js)  — PHASE 2 / LECTURE  (v4 — design dashboard)
//  Embed FullCalendar dans <div id="agenda-root"></div>.
//
//  Design calé sur le dashboard v3 (cartes #e8eef7 r14, labels #9bb3d1 maj,
//  titres #1F4A85, Nunito Sans).
//
//  Sources :
//   - USER affiché : variable "Agenda user" 3f02442f (suit le sélecteur intégré,
//     défaut = user connecté). SITE : selected_id_site 39fecccf (topnav).
//   - Sélecteur de collaborateur : alimenté par window.__dash.rawData (dashboard)
//     => fonction / vn_vo / id_site / reseau / affaire + viewerRole. AUCUNE RPC.
//
//  Rôles : 4=vendeur (pas de sélecteur) · 3=chef (ses vendeurs groupés VN/VO/VNVO
//  + lui) · 1/5/6/7/8=managers (collaborateurs du site courant par fonction/nom).
//
//  LECTURE SEULE (écritures = sous-lot suivant).
// ============================================================================
OD.define('agenda', {
  mount(__anchor, ctx) {
    const OROPRA_DOUBLONS_URL = 'https://cdn.jsdelivr.net/gh/oropra-apps/one-data-blocs@aa457b862a926340283e1b8e2e956cbff6357658/oropra-doublons.js';
    function chargerDoublons() {
      if (window.oropraDoublons) return Promise.resolve();
      if (window.__oropraDoublonsChargement) return window.__oropraDoublonsChargement;
      window.__oropraDoublonsChargement = new Promise((resolve) => {
        const sc = document.createElement('script'); sc.src = OROPRA_DOUBLONS_URL; sc.async = true;
        sc.onload = () => resolve(); sc.onerror = () => { console.warn('[od] doublons introuvable'); resolve(); };
        document.head.appendChild(sc);
      }); return window.__oropraDoublonsChargement;
    }
    chargerDoublons().then(function(){ try { if (window.oropraDoublons && !document.getElementById('od-css-clp')) { var e=document.createElement('style'); e.id='od-css-clp'; e.textContent=window.oropraDoublons.css('clp'); document.head.appendChild(e); } } catch(x){} });
    'use strict';
    __anchor.id = 'agenda-root';

  const CFG = {
    rootId: 'agenda-root',
    agendaUserVar: '3f02442f-a00f-41ba-93ad-787c7fd82763',     // "Agenda user" (collaborateur affiché)
    siteVar: '39fecccf-9296-43b7-b5b6-eadaa928290d',           // selected_id_site (topnav)
    selectedClientVar: '55490583-c88b-4748-916e-4d203db07742', // client sélectionné (topnav)
    lookupVar: 'cced74ab-5a0a-418d-9479-2366e05a8754',         // civilités / types société
    npaiVar: '7e24f595-e1fd-4257-99f4-76f179032788',           // options NPAI
    fcVersion: '6.1.15',
    timeZone: 'Europe/Paris',
    initialView: 'timeGridWeek',
    hideLinkedRpv: true,
    // Univers couleur arrêté le 25/08/2026, indexé par FAMILLE d'événement —
    // et non par type de RDV. C'est ce qui garantit qu'un chip et l'événement
    // qu'il filtre portent forcément la même teinte : ils lisent la même clé.
    // Avant, le chip « RDV client » tirait rdvDefault (bleu) alors que les
    // types 5 et 10 étaient rendus en rdvPhone (orange) — deux sources qui
    // pouvaient diverger sans que rien ne le signale.
    colors: {
      client:    '#e8833a',   // RDV client : orange
      relance:   '#9aa3ad',   // relances : gris
      bilat:     '#1F4A85',   // bilatérales : bleu foncé (charte One Data, v25 — le violet n'en fait pas partie)
      livraison: '#53bda7',   // livraisons VN : vert
      livraisonVo: '#e8833a', // v46 : livraisons VO (et VD) : orange
      creneau:   '#2a5ea9',   // créneaux : bleu
      bacs:      '#aab2bd',   // v29 : RDV BACS neutres (il n'y en a plus depuis le 02/11/2026)
      prepa:     '#b45f1a',   // v34 : préparation VN (agenda du préparateur)
      recep:     '#6a55b8',   // v34 : réception / restitution
      bloque:    '#c2554d',   // v34 : « pas de livraison » (créneau bloqué)
      absence:   '#8793a6',   // v34 : congés, repos, indisponibilité
    },
    // v34 : une couleur par personne dans l'agenda du site (aucun noir).
    personnes: ['#2a5ea9', '#1f7f6d', '#b45f1a', '#6a55b8', '#5c7a14', '#8a3f2b', '#1b7fa6', '#a8326e',
                '#7a6a12', '#3d5a99', '#2c8a4b', '#b0412e', '#5a6b8c', '#8b5fbf', '#0f6e73', '#9c6b1f'],
  };

  // --- accès WeWeb / Supabase -------------------------------------------------
  const wwLib = () => window.wwLib;
  function frontWin() { try { return (__anchor.ownerDocument && __anchor.ownerDocument.defaultView) || window; } catch (e) { return window; } }
  function frontDoc() { return __anchor.ownerDocument || document; }
  const sb = () => window.__OD_SB__ || window.wwLib?.wwPlugins?.supabase?.instance;
  function wwVal(id) { try { const v = wwLib().wwVariable.getValue(id); return (v == null || v === '') ? null : v; } catch (e) { return null; } }

  // --- passage vers la fiche de réalisation (page Bilatérales) ---------------
  // La page Bilatérales ouvre la fiche si elle trouve un id au montage :
  // sessionStorage (fiable, survit à la navigation SPA) et, par compatibilité,
  // la variable WeWeb historique « id_bilate_real ».
  const BIL_PATH = '/fr/bilaterales';
  const BIL_PAGE_UID = '7bfcfe73-4e89-40cf-bc84-1e07ddb478a6';
  const VAR_ID_BILATE_REAL = '851fed59-9397-41ae-b91d-26daa2ff960a';
  function inEditor() { try { return window.self !== window.top; } catch (e) { return true; } }
  function goBilaterale(id, maintenant) {
    try { hideTip(); if (tipEl) { tipEl.remove(); tipEl = null; } } catch (e) {}
    try { frontWin().sessionStorage.setItem('od_bil_open', JSON.stringify({ id: Number(id), maintenant: !!maintenant, t: Date.now() })); } catch (e) {}
    try { wwLib().wwVariable.updateValue(VAR_ID_BILATE_REAL, Number(id)); } catch (e) {}
    try { closeCreate(); } catch (e) {}
    if (inEditor()) {
      try { wwLib().wwApp.goTo(BIL_PAGE_UID); return; } catch (e) {}
      try { wwLib().goTo(BIL_PAGE_UID); return; } catch (e) {}
      return;
    }
    try { wwLib().goTo(BIL_PATH); return; } catch (e) {}
    try { frontWin().location.href = BIL_PATH; } catch (e) {}
  }

  function siteValRaw() { return wwVal(CFG.siteVar); }
  function siteIds() { const v = siteValRaw(); return v == null ? null : (Array.isArray(v) ? v.map(Number) : [Number(v)]); }
  function agendaUserVal() { return wwVal(CFG.agendaUserVar); }
  function setAgendaUser(id) { try { wwLib().wwVariable.updateValue(CFG.agendaUserVar, Number(id)); } catch (e) {} }
  function clearAgendaUser() { try { wwLib().wwVariable.updateValue(CFG.agendaUserVar, null); } catch (e) {} }

  function userRow() { try { let d = frontWin().oropraUser; if (Array.isArray(d)) d = d[0]; return d || {}; } catch (e) { return {}; } }
  function viewerName() { const u = userRow(); return u.nomComplet || u.nom_complet || ''; }
  let CACHED_UID = null;
  async function getUserId() {
    if (CACHED_UID != null) return CACHED_UID;
    const u = userRow();
    let id = u.ID_User ?? u.id_user;
    if (id != null && id !== '') { CACHED_UID = Number(id); return CACHED_UID; }
    try {
      // getSession() rend le meme auth_uid sans aller-retour reseau ; getUser()
      // coutait un appel a /auth/v1/user (mesure du 05/10/2026 : 140 ms au
      // demarrage). On ne retombe sur getUser() que si la session est absente,
      // cas ou il faut bien interroger le serveur.
      const c = sb();
      let authUid = (await c.auth.getSession())?.data?.session?.user?.id || null;
      if (!authUid) { const { data: auth } = await c.auth.getUser(); authUid = auth?.user?.id || null; }
      if (authUid) { const { data, error } = await c.from('USER').select('"ID_User"').eq('auth_uid', authUid).single(); if (!error && data && data.ID_User != null) { CACHED_UID = Number(data.ID_User); return CACHED_UID; } }
    } catch (e) { console.error('[agenda] résolution ID_User', e); }
    return null;
  }
  function viewerRole() {
    const u = userRow(); let r = (u.ID_Role != null) ? Number(u.ID_Role) : null;
    if (r == null) { const d = dash(); if (d && d.viewerRole != null) r = Number(d.viewerRole); }
    return r;
  }

  // Données du dashboard (périmètre du viewer) — partagées via window.__dash.
  function dash() { try { return frontWin().__dash || window.__dash || null; } catch (e) { return null; } }
  function dashRows() { const d = dash(); return (d && Array.isArray(d.rawData)) ? d.rawData : null; }

  async function effectiveUserIds() {
    const a = agendaUserVal();
    if (a != null) return Array.isArray(a) ? a.map(Number) : [Number(a)];
    const uid = await getUserId();
    return uid != null ? [uid] : [-1];
  }

  // --- couleurs / mapping -----------------------------------------------------
  // La couleur d'un événement découle de sa FAMILLE, exactement comme le chip
  // qui le filtre. Une seule décision, donc aucune divergence possible entre
  // la légende et le calendrier.
  function strongColor(e) {
    const f = familleEvt(e);
    if (f === 'livraison') return couleurLivr(e);
    return CFG.colors[f] || CFG.colors.creneau;
  }
  // v46 : une livraison est-elle un VO (un VD est un VO) ? L'objet BACS
  // (« Livraison VO · … ») prime : c'est l'événement lui-même. Puis la
  // commande rattachée, puis le commentaire libre. À défaut : VN.
  const RX_VO = /(^|[^A-Za-z0-9])(VO|VD|occasion)([^A-Za-z0-9]|$)/i;
  const RX_VN = /(^|[^A-Za-z0-9])VN([^A-Za-z0-9]|$)/i;
  function estLivraisonVo(e) {
    if (!e) return false;
    const desc = String(e.description || '');
    const sujet = desc.split(' · ')[0];
    if (RX_VO.test(sujet)) return true;
    if (RX_VN.test(sujet)) return false;
    const vv = String(((e.extra && e.extra.livraison) || {}).vn_vo || '').toUpperCase().trim();
    if (/^(VO|VD)/.test(vv)) return true;
    if (vv === 'VN') return false;
    return RX_VO.test(desc) && !RX_VN.test(desc);
  }
  function couleurLivr(e) { return estLivraisonVo(e) ? CFG.colors.livraisonVo : CFG.colors.livraison; }
  function tint(hex, a) { const h = hex.replace('#', ''); const n = parseInt(h, 16); return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; }
  const toFc = (ts) => (ts ? String(ts).replace(' ', 'T') : null);

  function agToday() { const d = new Date(); return d.getFullYear() + '-' + String(d.getMonth()+1).padStart(2,'0') + '-' + String(d.getDate()).padStart(2,'0'); }
  function agNowMin() { const d = new Date(); const z = (n) => String(n).padStart(2,'0'); return d.getFullYear() + '-' + z(d.getMonth()+1) + '-' + z(d.getDate()) + ' ' + z(d.getHours()) + ':' + z(d.getMinutes()); }
  function normTs(x) { return (typeof x === 'string') ? x.slice(0,16).replace('T',' ') : ''; }
  function isPastSlot(ts) { const n = normTs(ts); return n !== '' && n < agNowMin(); }
  function clientName(e) { return [e.civilite, e.nom, e.prenom].filter(Boolean).join(' ').trim(); }
  function typeLabel(e) { if (e.source_type === 'rdv') return e.title || 'RDV'; if (e.source_type === 'bilat') return 'Bilatérale'; if (e.source_type === 'rpv') return 'Rapport vendeur'; return ''; }
  function composeTitle(e) {
    const cn = clientName(e);
    if (estNeutre(e)) {
      // Le libellé BACS (« Réception », « PAS DE LIVRAISON »…) est en tête du commentaire.
      const sujet = String(e.description || '').split(' · ')[0].trim() || 'BACS';
      return cn ? sujet + ' · ' + cn : sujet;
    }
    if (e.source_type === 'rdv') return cn || (e.title || '');
    return e.title || '';
  }

  // v34 : pictogramme de nature, utile dans l'agenda du site où la couleur
  // désigne la personne et non plus la nature.
  const PICTO = { livraison: '🚚', prepa: '🔧', recep: '🔑', bloque: '⛔', absence: '🌴', bilat: '👥', relance: '📞', client: '', creneau: '' };
  function mapEvent(e) {
    if (vueSite()) return mapEventSite(e);
    const c = strongColor(e);
    const estLivr = familleEvt(e) === 'livraison' && !estNeutre(e);
    return {
      id: e.uid, title: (estLivr ? '🚚 ' : '') + composeTitle(e),
      start: toFc(e.event_start_time), end: toFc(e.event_end_time), allDay: !!e.is_event_all_day,
      backgroundColor: tint(c, estNeutre(e) ? 0.18 : 0.14), borderColor: tint(c, estNeutre(e) ? 0.45 : 0.14),
      textColor: estNeutre(e) ? '#5B6475' : '#1F4A85',
      editable: (!estNeutre(e) && !!e.can_edit && (e.source_type === 'rdv' || e.source_type === 'bilat')),
      extendedProps: Object.assign({ _accent: c }, e),
    };
  }
  function livInfo(e) { return (e && e.extra && e.extra.livraison) || {}; }
  function prenomDe(n) { return String(n || '').split(/\s+/)[0]; }
  function mapEventLivr(e) {
    const f = familleEvt(e), li = livInfo(e);
    const vendeurLivre = f === 'livraison' && li.livre_par === 'vendeur';
    const c = f === 'livraison' ? (vendeurLivre ? '#7f9cc4' : couleurLivr(e)) : (CFG.colors[f] || CFG.colors.creneau);
    const qui = f === 'livraison' ? (li.vendeur ? prenomDe(li.vendeur) : '') : prenomDe(e.extra && e.extra.proprietaire);
    return {
      id: e.uid, title: (PICTO[f] ? PICTO[f] + ' ' : '') + composeTitle(e) + (qui ? ' · ' + qui : ''),
      start: toFc(e.event_start_time), end: toFc(e.event_end_time), allDay: false,
      backgroundColor: f === 'livraison' && !vendeurLivre ? tint(c, 0.20) : tint(c, 0.10), borderColor: tint(c, 0.5), textColor: '#1F4A85',
      classNames: vendeurLivre ? ['ag-livr-vendeur'] : [],
      editable: !lectureSeule() && (!!e.can_edit && e.source_type === 'rdv'),
      extendedProps: Object.assign({ _accent: c }, e),
    };
  }
  function mapEventSite(e) {
    if (vueLivr()) return mapEventLivr(e);
    const c = couleurPersonne(e.id_user);
    const f = familleEvt(e);
    const pic = PICTO[f] ? PICTO[f] + ' ' : '';
    // Une absence de plus de 4 h (congés, repos) passe dans le bandeau « journée » :
    // en colonne, elle écrasait les rendez-vous des autres sur toute la hauteur.
    const dureeH = (new Date(toFc(e.event_end_time) || 0) - new Date(toFc(e.event_start_time) || 0)) / 3600000;
    const journee = !!e.is_event_all_day || (f === 'absence' && dureeH >= 4);
    const nomP = (e.extra && e.extra.proprietaire) ? String(e.extra.proprietaire).split(/\s+/)[0] : '';
    return {
      id: e.uid, title: pic + (journee && nomP ? nomP + ' · ' : '') + composeTitle(e),
      start: journee ? String(e.event_start_time || '').slice(0, 10) : toFc(e.event_start_time),
      end: journee ? null : toFc(e.event_end_time), allDay: journee,
      backgroundColor: tint(c, 0.16), borderColor: tint(c, 0.16), textColor: '#1F4A85',
      editable: (!!e.can_edit && (e.source_type === 'rdv' || e.source_type === 'bilat')),
      extendedProps: Object.assign({ _accent: c }, e),
    };
  }
  function buildEvents(rows) {
    const linked = new Set();
    if (CFG.hideLinkedRpv) rows.forEach(r => { if (r.source_type === 'rdv' && r.id_rpv != null) linked.add(String(r.id_rpv)); });
    const out = [];
    for (const e of rows) {
      if (CFG.hideLinkedRpv && e.source_type === 'rpv' && linked.has(String(e.origin_id))) continue;
      // Filtre des chips. Appliqué ICI et non dans la RPC : on ne recharge
      // pas le réseau pour masquer une catégorie, et recocher est instantané.
      if (typesActifs.indexOf(familleEvt(e)) < 0) continue;
      if (vue === 'site' && e.id_user != null && siteAg.masques.has(Number(e.id_user))) continue;
      out.push(mapEvent(e));
    }
    // Agenda du site : chaque livraison reste visible avec la couleur de sa
    // personne, côte à côte ; le regroupement ne vaut que pour l'agenda perso.
    return vueSite() ? out : grouperLivraisons(out);
  }

  // Livraisons empilées : au-delà de SEUIL_GROUPE livraisons qui commencent au
  // même instant, la colonne devient une suite de lamelles illisibles (relevé
  // du 13/10/2026 : une dizaine le mardi à 10 h). On les remplace par UN bloc
  // « N livraisons » qui se déplie au clic. En vue Liste et Mois, on garde le
  // détail : ces vues n'empilent pas.
  const SEUIL_GROUPE = 3;
  function vueEmpile() {
    try { const t = calendar && calendar.view && calendar.view.type; return !t || t.indexOf('timeGrid') === 0; }
    catch (e) { return true; }
  }
  function grouperLivraisons(evts) {
    if (!vueEmpile()) return evts;
    const paquets = {}, autres = [];
    evts.forEach(ev => {
      const p = ev.extendedProps || {};
      if (familleEvt(p) !== 'livraison') { autres.push(ev); return; }
      const k = normTs(String(ev.start || ''));
      (paquets[k] = paquets[k] || []).push(ev);
    });
    Object.keys(paquets).forEach(k => {
      const lot = paquets[k];
      if (lot.length < SEUIL_GROUPE) { lot.forEach(ev => autres.push(ev)); return; }
      const toutesVo = lot.every(ev => estLivraisonVo(ev.extendedProps || {}));
      const c = toutesVo ? CFG.colors.livraisonVo : CFG.colors.livraison;
      const fin = lot.map(ev => String(ev.end || ev.start || '')).sort().pop();
      autres.push({
        id: 'grp-livr-' + k, title: '🚚 ' + lot.length + ' livraisons',
        start: lot[0].start, end: fin || lot[0].end, allDay: false,
        backgroundColor: tint(c, 0.22), borderColor: tint(c, 0.22), textColor: '#1F4A85',
        editable: false,
        extendedProps: { _accent: c, _groupe: lot, source_type: 'groupe', title: lot.length + ' livraisons',
                         description: lot.map(ev => '• ' + (ev.title || '')).join('\n') }
      });
    });
    return autres;
  }
  // Dépli d'un groupe : la liste des livraisons, chacune ouvrable comme avant.
  function ouvrirGroupe(p) {
    const lot = (p && p._groupe) || [];
    if (!lot.length) return;
    const d = frontDoc(); let ov = d.getElementById('agenda-ov');
    if (!ov) { ov = d.createElement('div'); ov.id = 'agenda-ov'; (d.body || d.documentElement).appendChild(ov); ov.addEventListener('mousedown', (e) => { if (e.target === ov) closeCreate(); }); }
    const quand = String(lot[0].start || '');
    const jour = quand ? new Date(quand.slice(0, 10) + 'T12:00:00') : null;
    const titre = lot.length + ' livraisons' + (jour ? ' · ' + jour.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' }) + ' ' + quand.slice(11, 16).replace(':', 'h') : '');
    ov.innerHTML = '<div class="agm"><div class="agm-head"><span class="agm-title">' + esc(titre) + '</span><button class="agm-x" id="agm-x">×</button></div>'
      + '<div class="agm-body"><div class="agm-grp-list">'
      + lot.map((ev, i) => '<button type="button" class="agm-grp-it" data-i="' + i + '"><i style="background:' + couleurLivr(ev.extendedProps || {}) + '"></i><span>' + esc(ev.title || 'Livraison') + '</span><b>›</b></button>').join('')
      + '</div></div></div>';
    d.getElementById('agm-x').addEventListener('click', closeCreate);
    ov.querySelectorAll('.agm-grp-it').forEach(b => b.addEventListener('click', () => {
      const ev = lot[Number(b.getAttribute('data-i'))]; if (!ev) return;
      const pseudo = { title: ev.title, startStr: String(ev.start || ''), endStr: String(ev.end || ''),
                       start: ev.start ? new Date(String(ev.start)) : null, end: ev.end ? new Date(String(ev.end)) : null,
                       extendedProps: ev.extendedProps || {} };
      closeCreate();
      openEdit(pseudo);
    }));
  }
  async function fetchEvents(info, success, failure) {
    // Mode planning : même calendrier, autre source. C'est ce qui garantit un
    // design identique sans dupliquer une ligne de rendu.
    if (vueSite()) return fetchSite(info, success, failure);
    const client = sb(); if (!client) return failure(new Error('no supabase'));
    try {
      const p_start = info.startStr.slice(0, 19).replace('T', ' ');
      const p_end   = info.endStr.slice(0, 19).replace('T', ' ');
      // Un collaborateur précis est sélectionné -> on montre TOUT son agenda
      // (ne pas restreindre au site top-nav, sinon un vendeur d'un autre site
      //  du périmètre apparaît avec un agenda vide). Filtre site seulement en
      //  l'absence de collaborateur explicite (repli périmètre).
      const p_site_ids = (agendaUserVal() != null) ? null : siteIds();
      const { data, error } = await client.rpc('get_calendar_events', { p_start, p_end, p_user_ids: await effectiveUserIds(), p_site_ids });
      if (error) throw error;
      retirerProvisoires();
      success(buildEvents(data || []));
    } catch (err) { console.error('[agenda] erreur fetch', err); failure(err); }
  }

  // ==========================================================================
  //  SÉLECTEUR DE COLLABORATEUR (role-aware, à partir de window.__dash.rawData)
  // ==========================================================================
  function uniqVendeurs(rows) {
    const seen = {}, out = [];
    for (const r of rows) { const k = String(r.id_user); if (seen[k]) continue; seen[k] = 1; out.push({ id: Number(r.id_user), nom: r.nom_complet || ('Vendeur ' + r.id_user), vnvo: (r.vn_vo || '').toUpperCase(), fonction: (r.fonction || '').trim(), id_role: r.id_role != null ? Number(r.id_role) : null, id_site: r.id_site }); }
    return out;
  }
  const sortNom = (a, b) => String(a.nom).localeCompare(String(b.nom), 'fr');

  // Personnes visibles selon la RPC de périmètre : le viewer et TOUS ses
  // subordonnés descendants. C'est la seule source de vérité — window.__dash
  // ne porte aucune notion de hiérarchie, et depuis dashboard.js v18 il
  // contient aussi l'encadrement, donc les collègues de même niveau.
  // Renvoie null tant que le périmètre n'est pas chargé.
  // sites (optionnel) : ne garder que les collaborateurs rattaches a l'un de
  // ces sites (le viewer reste toujours present). Filtre AVANT dedoublonnage :
  // un vendeur de deux sites est retenu s'il est sur l'un des sites demandes.
  function collaborateursVisibles(sites) {
    const perim = perimRows();
    if (perim === null) { loadPerim(); return null; }
    const filtre = Array.isArray(sites) && sites.length ? new Set(sites.map(Number)) : null;
    const vus = {}, out = [];
    for (const r of perim) {
      if (filtre && !r.est_moi && !filtre.has(Number(r.id_site))) continue;
      const k = String(r.id_user);
      if (vus[k]) continue;
      vus[k] = 1;
      // Le rôle 9 (secrétaire commerciale) n'apparaît dans AUCUN sélecteur de
      // collaborateurs — arbitrage d'Antoine du 25/08/2026. Elle est rattachée
      // hiérarchiquement au chef des ventes de chacun de ses sites, donc la
      // RPC de périmètre la remonte légitimement ; c'est ICI qu'on l'écarte,
      // et nulle part ailleurs : collaborateursVisibles() est la source unique
      // du menu chef, de la cascade directeur et du sélecteur « vendeur
      // évalué » de la bilatérale.
      // Elle reste visible d'elle-même (est_moi) : sans quoi son propre agenda
      // n'aurait plus de sélecteur du tout.
      if (Number(r.id_role) === 9 && !r.est_moi) continue;
      out.push({ id: Number(r.id_user), id_user: Number(r.id_user), nom: r.nom,
                 vn_vo: r.vn_vo, id_role: r.id_role, role_nom: r.role_nom,
                 niveau: r.niveau, est_moi: !!r.est_moi });
    }
    return out;
  }

  // null = pas encore prêt ; {mode:'none'} = pas de sélecteur (vendeur)
  function buildCollaborators() {
    const role = viewerRole();
    // Pas de sélecteur de collaborateur hors des rôles manager (vendeur,
    // opérateur plateau) : miroir de public.role_est_manager(), 04/10/2026.
    if (role != null && ![1, 2, 3, 5, 6, 7, 8, 9].includes(role)) return { mode: 'none' };
    // Plus aucune dépendance à window.__dash ici : les deux modes (chef et
    // cascade) s'alimentent désormais à la RPC de périmètre. Le sélecteur
    // n'attend donc plus le chargement du module dashboard.
    const vid = Number(CACHED_UID); const vname = viewerName();
    const allById = {}; const groups = [];

    if (role === 3) {
      // Corrigé le 21/08/2026 : cette branche lisait window.__dash.rawData,
      // qui liste tout le monde sur le site. Un chef des ventes y voyait
      // donc les autres chefs — deux personnes de même niveau ne doivent
      // pas pouvoir se consulter. On passe par la RPC, qui ne descend que
      // la hiérarchie (N-1, N-2, N-3...).
      // v20 : la liste suit le site de la barre du haut.
      const vus = collaborateursVisibles(siteIds());
      if (vus === null) return null;
      const moi = vus.find(v => v.est_moi);
      groups.push({ label: (moi && moi.role_nom) || 'Chef des ventes', items: [{ id: vid, nom: vname }] });
      for (const g of groupeParFonction(vus, vid)) {
        groups.push({ label: g.label, items: g.items });
      }
    } else {
      // rôles 1/2/5/6/7/8 : cascade Réseau→Affaire→Site→Vendeur (périmètre complet, RPC dédié)
      return { mode: 'cascade', selfName: vname, selfId: vid };
    }
    groups.forEach(g => g.items.forEach(it => { allById[it.id] = it.nom; }));
    allById[vid] = vname;
    return { mode: role === 3 ? 'chef' : 'manager', groups, allById, selfName: vname };
  }

  function initials(name) { const p = String(name || '').trim().split(/\s+/); return ((p[0] || '')[0] || '').toUpperCase() + ((p[1] || '')[0] || '').toUpperCase(); }
  function currentCollabId() { const a = agendaUserVal(); return a != null ? Number(a) : Number(CACHED_UID); }

  let collabMenuOpen = false;
  let collabSig = null;
  function collabSignature() {
    const r = dashRows();
    const p = perimRows();   // le mode chef dépend désormais du périmètre
    return JSON.stringify([viewerRole(), siteValRaw(), r ? r.length : -1, p ? p.length : -1, currentCollabId(), vue]);
  }

  // ---- Cascade directeur : Réseau → Affaire → Site → Vendeur ----------------
  function perimRows() { try { return frontWin().__agendaPerim || window.__agendaPerim || null; } catch (e) { return (typeof window !== 'undefined' ? window.__agendaPerim : null) || null; } }
  function setPerimRows(v) { try { frontWin().__agendaPerim = v; } catch (e) { try { window.__agendaPerim = v; } catch (x) {} } }
  let perimLoading = false;
  async function loadPerim() {
    if (perimRows() || perimLoading) return;
    perimLoading = true;
    try {
      const c = sb();
      const { data, error } = await c.rpc('get_agenda_perimeter', { p_viewer_id_user: (CACHED_UID != null ? Number(CACHED_UID) : null) });
      if (error) throw error;
      const rows = (data || []).map(r => ({
        id_user: r.id_user != null ? Number(r.id_user) : null,
        nom: r.nom_complet || ('Vendeur ' + r.id_user),
        id_site: r.id_site != null ? Number(r.id_site) : null,
        nom_site: r.nom_site || ('Site ' + r.id_site),
        reseau: r.reseau || '(Sans réseau)',
        affaire: r.affaire || '(Sans affaire)',
        id_affaire: r.id_affaire != null ? Number(r.id_affaire) : null,
        id_role: r.id_role != null ? Number(r.id_role) : null,
        role_nom: (r.role_nom || '').trim(),
        fonction: (r.fonction || '').trim(),
        niveau: r.niveau != null ? Number(r.niveau) : null,
        vn_vo: (r.vn_vo || '').toUpperCase(),
        // est_moi était perdu ici : collaborateursVisibles() le lisait toujours
        // faux, si bien que le chef apparaissait dans « Vendeur évalué » et que
        // « Moi » n'était jamais reconnu (recette Team Colin 07/10/2026).
        est_moi: r.est_moi === true || (r.niveau != null && Number(r.niveau) === 0)
      }));
      setPerimRows(rows);
    } catch (e) { console.error('[agenda] get_agenda_perimeter', e); setPerimRows([]); }
    finally { perimLoading = false; renderCollab(true); }
  }
  function perimSel() {
    let sObj; try { sObj = frontWin().__agendaPerimSel; } catch (e) { sObj = (typeof window !== 'undefined' ? window.__agendaPerimSel : null); }
    if (!sObj) { sObj = { reseau: null, affKey: null, idSite: null, init: false }; try { frontWin().__agendaPerimSel = sObj; } catch (e) { try { window.__agendaPerimSel = sObj; } catch (x) {} } }
    return sObj;
  }
  function affKeyOf(r) { return r.reseau + '~~' + r.id_affaire; }
  function uniqOpts(arr, keyFn, labelFn) {
    const m = {}; for (const x of arr) { const k = keyFn(x); if (k == null) continue; if (!(k in m)) m[k] = { key: k, label: labelFn(x) }; }
    return Object.values(m).sort((a, b) => String(a.label).localeCompare(String(b.label), 'fr'));
  }
  // Résout la sélection (auto-collapse des niveaux à 1 valeur) + renvoie les options.
  function resolveCascade(rows) {
    const sel = perimSel();
    if (!sel.init) {                                   // défaut : le site du viewer (sinon 1re ligne)
      let self = rows.find(r => String(r.id_user) === String(CACHED_UID));
      if (!self) { const us = userRow(); const sid = us.ID_SITE != null ? Number(us.ID_SITE) : null; if (sid != null) self = rows.find(r => r.id_site === sid); }
      if (!self) self = rows[0];
      if (self) { sel.reseau = self.reseau; sel.affKey = affKeyOf(self); sel.idSite = self.id_site; }
      sel.init = true;
    }
    // v20 : à chaque changement de site dans la barre du haut, la cascade se
    // cale sur ce site (s'il n'y en a qu'un et qu'il est dans le perimetre).
    const top = siteIds(); const topSig = JSON.stringify(top);
    if (sel.topnav !== topSig) {
      sel.topnav = topSig;
      if (top && top.length === 1) {
        const ligne = rows.find(r => Number(r.id_site) === Number(top[0]));
        if (ligne) { sel.reseau = ligne.reseau; sel.affKey = affKeyOf(ligne); sel.idSite = ligne.id_site; }
      }
    }
    const reseaux = uniqOpts(rows, r => r.reseau, r => r.reseau);
    if (!reseaux.some(o => o.key === sel.reseau)) sel.reseau = reseaux.length ? reseaux[0].key : null;
    const afRows = rows.filter(r => r.reseau === sel.reseau);
    const affaires = uniqOpts(afRows, affKeyOf, r => r.affaire);
    if (!affaires.some(o => o.key === sel.affKey)) sel.affKey = affaires.length ? affaires[0].key : null;
    const stRows = afRows.filter(r => affKeyOf(r) === sel.affKey);
    const sites = uniqOpts(stRows, r => String(r.id_site), r => r.nom_site);
    if (!sites.some(o => String(o.key) === String(sel.idSite))) sel.idSite = sites.length ? Number(sites[0].key) : null;
    const veRows = stRows.filter(r => String(r.id_site) === String(sel.idSite));
    const seenV = {}, vendeurs = [];
    for (const v of veRows) {
      const k = String(v.id_user); if (seenV[k]) continue; seenV[k] = 1;
      // Rôle 9 (secrétaire commerciale) écarté de TOUS les sélecteurs de
      // collaborateurs (arbitrage du 25/08/2026) : la cascade du directeur
      // l'oubliait (recette Team Colin 07/10/2026). Elle reste visible d'elle-même.
      if (Number(v.id_role) === 9 && !v.est_moi) continue;
      vendeurs.push(v);
    }
    return { reseaux, affaires, sites, vendeurs, sel };
  }
  // Catégorie d'un collaborateur pour le regroupement du menu (rôle, + VN/VO pour les vendeurs).
  // Regroupement du menu déroulant, commun aux deux sélecteurs (chef et cascade).
  //
  // Le libellé du groupe est celui de la table ROLE, remonté par
  // get_agenda_perimeter sous le nom role_nom, à partir de USER_SITE.ID_Role —
  // le rôle de la personne SUR CE SITE. Plus aucune correspondance codée en
  // dur ici : ajouter un rôle en base suffit.
  //
  // Pour les vendeurs (4) ET les chefs des ventes (3), on ajoute le suffixe
  // VN / VO / VN-VO, lu sur USER.VN_VO. Le tri à l'intérieur d'un groupe est
  // alphabétique sur le nom (locale fr).
  //
  // ROLE_FALLBACK ne sert que si role_nom est absent — tenant pas encore migré,
  // ou données lues depuis window.__dash.rawData, qui ne porte pas ce libellé.
  const ROLE_FALLBACK = { 1: 'Admin', 2: 'Directeur', 3: 'Chef des ventes', 4: 'Vendeur', 5: 'Responsable Marketing', 6: 'Directeur plaque', 7: 'Directeur marque', 8: 'Directeur groupe' };
  // Ordre d'affichage des groupes : du plus haut au plus bas dans la hiérarchie.
  const ROLE_ORDRE = { 8: 10, 7: 20, 6: 30, 2: 40, 5: 50, 1: 60, 3: 70, 4: 88 };
  function vnvoSuffixe(s) {
    const v = String(s || '').toUpperCase();
    const vn = v.includes('VN'), vo = v.includes('VO');
    if (vn && vo) return { sfx: ' VN/VO', ord: 3 };
    if (vn)       return { sfx: ' VN',    ord: 1 };
    if (vo)       return { sfx: ' VO',    ord: 2 };
    return { sfx: '', ord: 4 };
  }
  function collabCategory(r) {
    const role = Number(r.id_role);
    const nom = String(r.role_nom || ROLE_FALLBACK[role] || 'Autres').trim();
    const base = ROLE_ORDRE[role] != null ? ROLE_ORDRE[role] : 99;
    if (role === 4 || role === 3) {
      const t = vnvoSuffixe(r.vn_vo);
      return { key: 'r' + role + '_' + t.ord, label: nom + t.sfx, order: base + t.ord };
    }
    return { key: 'r' + role, label: nom, order: base };
  }
  // Construit les optgroups triés à partir d'une liste de personnes.
  // Chaque entrée doit porter id_role et vn_vo ; nom sert au tri.
  function groupeParFonction(items, exclureId) {
    const cats = {};
    for (const v of items) {
      if (exclureId != null && String(v.id_user != null ? v.id_user : v.id) === String(exclureId)) continue;
      const c = collabCategory(v);
      (cats[c.key] = cats[c.key] || { label: c.label, order: c.order, items: [] }).items.push(v);
    }
    const grps = Object.values(cats).sort((a, b) => a.order - b.order);
    grps.forEach(g => g.items.sort((a, b) => String(a.nom).localeCompare(String(b.nom), 'fr')));
    return grps;
  }
  function renderCascade(host, model) {
    const rows = perimRows();
    host.style.display = '';
    if (rows === null) { loadPerim(); host.innerHTML = '<div class="agc-cascade"><span class="agc-loading">Chargement du périmètre…</span></div>'; return; }
    if (!rows.length) { host.innerHTML = ''; host.style.display = 'none'; return; }
    const r = resolveCascade(rows);
    const curId = currentCollabId();
    const selfId = model.selfId != null ? model.selfId : CACHED_UID;
    const selVal = r.vendeurs.some(v => String(v.id_user) === String(curId)) ? curId : selfId;
    // v20 : collaborateur affiche hors du site retenu -> retour a soi.
    const affC = agendaUserVal();
    if (affC != null && String(affC) !== String(selfId) && !r.vendeurs.some(v => String(v.id_user) === String(affC))) {
      clearAgendaUser(); try { refetch(); } catch (e) {}
    }
    const lvl = (id, label, opts, val, show) => {
      if (!show) return '';
      return '<label class="agc-lvl"><span class="agc-lvl-lbl">' + esc(label) + '</span>'
        + '<select class="agc-sel" id="' + id + '">'
        + opts.map(o => '<option value="' + esc(o.key) + '"' + (String(o.key) === String(val) ? ' selected' : '') + '>' + esc(o.label) + '</option>').join('')
        + '</select></label>';
    };
    // Menu collaborateur : "Moi" épinglé, puis optgroups par fonction, triés par nom dans chaque groupe.
    const grps = groupeParFonction(r.vendeurs, selfId);
    const vendOpts = '<option value="' + esc(selfId) + '"' + (String(selVal) === String(selfId) ? ' selected' : '') + '>Moi (mon agenda)</option>'
      + grps.map(g => '<optgroup label="' + esc(g.label) + '">'
          + g.items.map(v => '<option value="' + esc(v.id_user) + '"' + (String(v.id_user) === String(selVal) ? ' selected' : '') + '>' + esc(v.nom) + '</option>').join('')
          + '</optgroup>').join('');
    host.innerHTML = '<div class="agc-cascade">'
      + lvl('agc-reseau', 'Réseau', r.reseaux, r.sel.reseau, r.reseaux.length > 1)
      + lvl('agc-affaire', 'Affaire', r.affaires, r.sel.affKey, r.affaires.length > 1)
      + lvl('agc-site', 'Site', r.sites, r.sel.idSite, r.sites.length > 1)
      + '<label class="agc-lvl"><span class="agc-lvl-lbl">Collaborateur</span><select class="agc-sel" id="agc-vendeur">' + vendOpts + '</select></label>'
      + '</div>';
    wireCascade(host);
  }
  function wireCascade(host) {
    const g = (id) => host.querySelector('#' + id);
    const sel = perimSel();
    const re = g('agc-reseau'); if (re) re.addEventListener('change', () => { sel.reseau = re.value; sel.affKey = null; sel.idSite = null; renderCollab(true); });
    const af = g('agc-affaire'); if (af) af.addEventListener('change', () => { sel.affKey = af.value; sel.idSite = null; renderCollab(true); });
    const si = g('agc-site'); if (si) si.addEventListener('change', () => { sel.idSite = Number(si.value); renderCollab(true); });
    const ve = g('agc-vendeur'); if (ve) ve.addEventListener('change', () => { setAgendaUser(ve.value); renderCollab(true); refetch(); });
  }
  /* ===== TYPES D'ÉVÉNEMENT ET FILTRES ====================================
     Chips de sélection au-dessus de l'agenda (demande du 25/08/2026).
     Cinq familles, dérivées du source_type et du type de RDV :
       bilat     bilatérales
       client    RDV client physique (5) ou téléphonique (10)
       relance   relances (6)
       livraison livraisons (4) — la vente qui se conclut
       creneau   le reste : rapports vendeur, convoyage, expo, APV, réunion…
     Le libellé « créneau » regroupe volontairement ce qui occupe du temps
     sans être un rendez-vous client. Si la répartition ne convient pas,
     c'est ICI qu'elle se change — un seul endroit.
  ======================================================================== */
  // La couleur n'est PAS déclarée ici : elle est lue dans CFG.colors par la
  // clé de famille, la même que celle qu'utilise strongColor. Redéclarer une
  // teinte à cet endroit rouvrirait la porte à la divergence qu'on vient de
  // fermer.
  const TYPES_EVT = [
    { cle: 'client',    label: 'RDV client'  },
    { cle: 'relance',   label: 'Relances'    },
    { cle: 'bilat',     label: 'Bilatérales' },
    { cle: 'livraison', label: 'Livraisons VN / VO' },
    { cle: 'prepa',     label: 'Préparations' },
    { cle: 'recep',     label: 'Réceptions / restitutions' },
    { cle: 'bloque',    label: 'Pas de livraison' },
    { cle: 'absence',   label: 'Absences'    },
    { cle: 'creneau',   label: 'Créneaux'    },
  ];
  // Tout est affiché par défaut : un filtre qui masque à l'insu de
  // l'utilisateur est pire que pas de filtre du tout.
  let typesActifs = TYPES_EVT.map(x => x.cle);

  function estNeutre(e) { return !!(e && e.extra && e.extra.neutre); }
  // v31 : pourquoi un événement ne se déplace pas (null = déplaçable).
  function raisonVerrou(e) {
    if (!e || e._provisoire || e._groupe) return null;
    if (estNeutre(e)) return 'Activité BACS : elle se déplace dans BACS.';
    if (e.source_type === 'rpv') return 'Rapport vendeur : il ne se déplace pas dans l\u2019agenda.';
    if (e.source_type === 'bilat' && !e.can_edit) return 'Bilatérale : seul le manager qui l\u2019a posée peut la déplacer.';
    if (e.source_type === 'rdv' && !e.can_edit) return 'RDV de ' + ((e.extra && e.extra.proprietaire) || 'un collègue') + ' : seul son propriétaire peut le déplacer.';
    return null;
  }
  function familleEvt(e) {
    if (e.source_type === 'bilat') return 'bilat';
    const t = String(e.id_rdv_type ?? e.extra?.ID_Rdv_Type ?? '');
    if (t === '4' || t === '9') return 'livraison';
    if (t === '12') return 'prepa';
    if (t === '13') return 'recep';
    if (t === '14') return 'bloque';
    if (t === '15') return 'absence';
    if (t === '6') return 'relance';
    if (t === '5' || t === '10') return 'client';
    if (e.source_type === 'rpv') return 'creneau';
    return 'creneau';
  }

  // Reste a conclure : un rendez-vous AVEC CLIENT, commercial (ni livraison ni
  // bilaterale), dont l'heure est passee et dont TRAITE n'a jamais ete pose.
  // get_calendar_events renvoie status = nullif(TRAITE,'false') : null tant que
  // personne n'a dit ce que le rendez-vous a donne.
  function resteAConclure(p) {
    if (!p || p.source_type !== 'rdv') return false;
    if (estNeutre(p)) return false;
    if (p.status) return false;
    if (!(Number(p.id_client) > 0)) return false;
    const f = crFamille(p.id_rdv_type != null ? p.id_rdv_type
                        : (p.extra && p.extra.ID_Rdv_Type));
    if (f === 'livraison') return false;
    return isPastSlot(p.event_start_time || '');
  }

  function renderChips() {
    const host = document.getElementById('agenda-chips');
    if (!host) return;
    host.innerHTML = TYPES_EVT.map(ty => {
      const on = typesActifs.indexOf(ty.cle) >= 0;
      const c = CFG.colors[ty.cle];
      return '<button type="button" class="agf-chip' + (on ? ' is-on' : '') + '" data-cle="' + ty.cle + '"' +
        ' style="' + (on ? 'border-color:' + c + ';background:' + tint(c, 0.12) + ';color:' + c : '') + '">' +
        '<i style="background:' + c + '"></i>'
        + (ty.cle === 'livraison' ? '<i style="background:' + CFG.colors.livraisonVo + '"></i>' : '')
        + esc(ty.label) + '</button>';
    }).join('') +
    // Un raccourci pour revenir à l'état complet : sans lui, l'utilisateur
    // qui a tout décoché doit recliquer cinq fois.
    '<button type="button" class="agf-all" data-cle="__all">Tout</button>' +
    '<button type="button" class="agf-all" data-cle="__none">Aucun</button>' +
    (typesActifs.length ? '' : '<span class="agf-vide">Rien d\u2019affiché : cochez les natures à voir.</span>');
    host.querySelectorAll('[data-cle]').forEach(b => b.addEventListener('click', () => {
      const c = b.getAttribute('data-cle');
      if (c === '__all') typesActifs = TYPES_EVT.map(x => x.cle);
      else if (c === '__none') typesActifs = [];
      else {
        const i = typesActifs.indexOf(c);
        if (i >= 0) typesActifs.splice(i, 1); else typesActifs.push(c);
        // Ne jamais tout masquer : un agenda vide sans raison visible est un
        // faux bug qu'on nous signalerait.
        // v35 : on peut tout décocher (« Aucun ») puis cocher une à une les
        // natures voulues ; l'agenda vide le dit en clair (bandeau ci-dessous).
      }
      renderChips();
      try { window.__agendaRefetch && window.__agendaRefetch(); } catch (e) {}
    }));
  }

  /* ===== v34 : MON AGENDA / AGENDA DU SITE ===============================
     L'agenda du site n'est pas un agenda de plus : c'est la SOMME des agendas
     personnels des personnes du site (chefs des ventes, vendeurs, secrétaires
     commerciales), lus par la même RPC get_calendar_events. Un RDV posé dans
     l'une des vues est donc, par construction, dans l'autre — et dans BACS,
     dans l'agenda de son propriétaire.
     Couleur : par PERSONNE (façon Google Agenda), stable dans la session
     (rang alphabétique dans le site). La nature se lit au pictogramme.
  ======================================================================== */
  const VUE_CLE = 'od_agenda_vue';
  let vue = (function () { try { const v = frontWin().sessionStorage.getItem(VUE_CLE); return v === 'site' || v === 'livr' ? v : 'perso'; } catch (e) { return 'perso'; } })();
  function vueSite() { return vue === 'site' || vue === 'livr'; }
  // v38 : « Livraisons du site » — la vue du site réduite aux livraisons,
  // préparations, réceptions et créneaux « pas de livraison ».
  function vueLivr() { return vue === 'livr'; }
  const FAMILLES_LIVR = ['livraison', 'prepa', 'recep', 'bloque'];
  // v38 : rôles du viewer pour l'agenda (agenda_mes_roles).
  let ROLES = null;
  function lectureSeule() { return !!(ROLES && ROLES.lecture_seule); }
  function siteAExpert(id) { return !!(ROLES && (ROLES.sites_avec_expert || []).map(Number).indexOf(Number(id)) >= 0); }
  async function chargerRoles() {
    if (ROLES) return ROLES;
    try { const r = await sb().rpc('agenda_mes_roles'); ROLES = (!r.error && r.data) ? r.data : { lecture_seule: false, sites_avec_expert: [], expert_sites: [], prep_sites: [] }; }
    catch (e) { ROLES = { lecture_seule: false, sites_avec_expert: [], expert_sites: [], prep_sites: [] }; }
    if (lectureSeule() && vue !== 'livr') { vue = 'livr'; try { frontWin().sessionStorage.setItem(VUE_CLE, 'livr'); } catch (e) {} }
    return ROLES;
  }
  const siteAg = { id: null, sites: null, masques: new Set() };
  const membresCache = {};          // id_site -> [{id_user, nom, id_role, role_nom, bacs, couleur}]
  const membresEnCours = {};

  function siteParDefaut() {
    const t = siteIds();
    if (t && t.length === 1) return Number(t[0]);
    const u = userRow(); if (u.ID_SITE != null) return Number(u.ID_SITE);
    if (siteAg.sites && siteAg.sites.length) return Number(siteAg.sites[0].id_site);
    return null;
  }
  // Le site dont on parle : celui de l'agenda du site, sinon celui de la barre du haut.
  function siteCourant() { return vueSite() && siteAg.id != null ? Number(siteAg.id) : siteParDefaut(); }

  // Un seul site courant : la barre du haut pilote l'agenda du site, et le
  // choix fait dans l'agenda du site remonte dans la barre du haut.
  function suivreSiteHaut() {
    const t = siteIds(); const sig = JSON.stringify(t);
    if (siteAg.topSig === sig) return false;
    siteAg.topSig = sig;
    if (t && t.length === 1 && Number(t[0]) !== Number(siteAg.id)) {
      siteAg.id = Number(t[0]); siteAg.masques = new Set();
      setTimeout(renderSiteBar, 0);
      return true;
    }
    return false;
  }
  function poserSiteHaut(id) {
    try {
      const brut = siteValRaw();
      const v = Array.isArray(brut) ? [Number(id)] : Number(id);
      siteAg.topSig = JSON.stringify([Number(id)]);
      wwLib().wwVariable.updateValue(CFG.siteVar, v);
    } catch (e) {}
  }
  async function chargerMesSites() {
    if (siteAg.sites) return siteAg.sites;
    try { const r = await sb().rpc('agenda_mes_sites'); siteAg.sites = (!r.error && Array.isArray(r.data)) ? r.data : []; }
    catch (e) { siteAg.sites = []; }
    return siteAg.sites;
  }
  async function chargerMembresPour(idSite) {
    if (idSite == null) return [];
    const k = String(idSite);
    if (membresCache[k]) return membresCache[k];
    if (membresEnCours[k]) return membresEnCours[k];
    membresEnCours[k] = (async () => {
      let rows = [];
      try { const r = await sb().rpc('agenda_site_membres', { p_id_site: Number(idSite) }); rows = (!r.error && Array.isArray(r.data)) ? r.data : []; }
      catch (e) { rows = []; }
      rows = rows.map(x => ({ id_user: Number(x.id_user), nom: x.nom || ('Utilisateur ' + x.id_user), id_role: Number(x.id_role), role_nom: x.role_nom || '', bacs: !!x.bacs }))
                 .sort((a, b) => String(a.nom).localeCompare(String(b.nom), 'fr'));
      rows.forEach((m, i) => { m.couleur = CFG.personnes[i % CFG.personnes.length]; });
      membresCache[k] = rows; delete membresEnCours[k];
      return rows;
    })();
    return membresEnCours[k];
  }
  function membresSite() { return membresCache[String(siteCourant())] || []; }
  function couleurPersonne(id) {
    const m = membresSite().find(x => Number(x.id_user) === Number(id));
    if (m) return m.couleur;
    const n = Math.abs(Number(id) || 0);
    return CFG.personnes[n % CFG.personnes.length];
  }
  // ==========================================================================
  //  v38 : FICHE LIVRAISON (et lecture seule du préparateur)
  // ==========================================================================
  function dateLongue(ts) {
    try { const d = new Date(toFc(ts)); return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) + ' · ' + String(ts).slice(11, 16).replace(':', 'h'); }
    catch (e) { return String(ts || ''); }
  }
  function commentaireLivr(p) {
    const li = livInfo(p);
    if (li.bacs_desc) return li.bacs_desc;
    const c = String(p.description || '').trim();
    const i = c.indexOf(' · ');
    return i > 0 && /^Livraison|^Mise en main|^Nouvelle mise/i.test(c) ? c.slice(i + 3) : c;
  }
  function ouvrirFicheLivraison(p, ev) {
    const d = frontDoc(); try { hideTip(); } catch (e) {}
    let ov = d.getElementById('agenda-livr-ov'); if (ov) ov.remove();
    const f = familleEvt(p), li = livInfo(p), estLiv = f === 'livraison';
    const ro = lectureSeule();
    const peutQui = estLiv && !ro && siteAExpert(p.id_site);
    const nomCli = clientName(p);
    const veh = [li.vehicule, li.vn_vo].filter(Boolean).join(' · ');
    const vinCde = [li.vin || (p.extra && p.extra.vin) ? 'VIN ' + (li.vin || p.extra.vin) : '', li.commande ? 'commande ' + li.commande : ''].filter(Boolean).join(' · ');
    const comm = estLiv ? commentaireLivr(p) : String(p.description || '').trim();
    const ligne = (lab, val, sub) => val ? '<div class="alv-b"><span>' + esc(lab) + '</span><b>' + esc(val) + '</b>' + (sub ? '<em>' + esc(sub) + '</em>' : '') + '</div>' : '';
    let h = '<style>'
      + '#agenda-livr-ov{position:fixed;inset:0;z-index:99990;background:rgba(31,74,133,.28);display:flex;align-items:center;justify-content:center;padding:16px;font-family:"Nunito Sans",system-ui,sans-serif}'
      + '#agenda-livr-ov .alv{background:#fff;border-radius:16px;box-shadow:0 16px 50px rgba(42,94,169,.25);width:min(560px,100%);max-height:calc(100vh - 32px);overflow:auto;color:#1F4A85}'
      + '#agenda-livr-ov .alv-h{display:flex;justify-content:space-between;align-items:center;padding:14px 18px;border-bottom:1.5px solid #eef2f8;font-size:12.5px;font-weight:800;text-transform:uppercase;letter-spacing:.04em}'
      + '#agenda-livr-ov .alv-x{border:0;background:#f2f6fc;color:#2a5ea9;border-radius:8px;width:30px;height:30px;font-size:17px;cursor:pointer}'
      + '#agenda-livr-ov .alv-c{padding:14px 18px;display:grid;gap:12px}'
      + '#agenda-livr-ov .alv-t{font-size:17px;font-weight:800}#agenda-livr-ov .alv-s{font-size:13px;font-weight:600;color:#4b628a}'
      + '#agenda-livr-ov .alv-g{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}@media(max-width:520px){#agenda-livr-ov .alv-g{grid-template-columns:minmax(0,1fr)}}'
      + '#agenda-livr-ov .alv-b{background:#f7f9fc;border-radius:10px;padding:9px 11px;display:grid;gap:2px}#agenda-livr-ov .alv-b span,#agenda-livr-ov .alv-l{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:#5f7aa3}'
      + '#agenda-livr-ov .alv-b b{font-size:13.5px}#agenda-livr-ov .alv-b em{font-style:normal;font-size:12px;font-weight:600;color:#4b628a}'
      + '#agenda-livr-ov .alv-cm{background:#f7f9fc;border:1.5px solid #e2eaf5;border-radius:10px;padding:10px 12px;font-size:13px;font-weight:600;white-space:pre-wrap;line-height:1.45}'
      + '#agenda-livr-ov .alv-q{display:flex;gap:8px}#agenda-livr-ov .alv-q button{flex:1;border:1.5px solid #d6e2f2;background:#fff;color:#1F4A85;border-radius:10px;padding:10px;font:700 13px "Nunito Sans",system-ui,sans-serif;cursor:pointer}'
      + '#agenda-livr-ov .alv-q button.on{background:#2a5ea9;border-color:#2a5ea9;color:#fff;font-weight:800}'
      + '#agenda-livr-ov .alv-p{display:flex;justify-content:space-between;gap:10px;align-items:center;border-radius:10px;padding:9px 12px;font-size:13px;font-weight:700}'
      + '#agenda-livr-ov .alv-p.ok{background:#eef7f4;color:#2c7a68}#agenda-livr-ov .alv-p.ko{background:#fff8ec;color:#7a5208}'
      + '#agenda-livr-ov .alv-f{display:flex;gap:10px;flex-wrap:wrap;padding:12px 18px;border-top:1.5px solid #eef2f8}'
      + '#agenda-livr-ov .alv-f button{border:1.5px solid #d6e2f2;background:#fff;color:#2a5ea9;border-radius:10px;padding:10px 14px;font:800 13px "Nunito Sans",system-ui,sans-serif;cursor:pointer}'
      + '#agenda-livr-ov .alv-f button.pri{background:#2a5ea9;border-color:#2a5ea9;color:#fff}'
      + '</style><div class="alv" role="dialog" aria-modal="true" aria-label="Livraison">'
      + '<div class="alv-h"><span>' + esc((estLiv ? (p.title || 'Livraison') : (p.title || 'Rendez-vous'))) + '</span><button type="button" class="alv-x" data-x aria-label="Fermer">×</button></div>'
      + '<div class="alv-c">'
      + '<div><div class="alv-t">' + esc(nomCli || composeTitle(p) || '—') + '</div><div class="alv-s">' + esc(dateLongue(p.event_start_time)) + (li.tel ? ' · ' + esc(li.tel) : '') + '</div></div>';
    if (estLiv) {
      h += '<div class="alv-g">' + ligne('Véhicule', veh || (vinCde ? '—' : ''), vinCde) + ligne('Vendu par', li.vendeur || '', p.extra && p.extra.proprietaire && p.extra.proprietaire !== li.vendeur ? 'posé par ' + p.extra.proprietaire : '') + '</div>';
      if (siteAExpert(p.id_site) || li.livre_par === 'vendeur') {
        h += '<div><div class="alv-l">Qui livre ?</div>';
        if (peutQui) {
          h += '<div class="alv-q"><button type="button" data-qui="expert" class="' + (li.livre_par === 'expert' ? 'on' : '') + '">L’expert produit' + (li.expert ? ' · ' + esc(prenomDe(li.expert)) : '') + '</button>'
            + '<button type="button" data-qui="vendeur" class="' + (li.livre_par === 'vendeur' ? 'on' : '') + '">Le vendeur' + (li.vendeur ? ' · ' + esc(prenomDe(li.vendeur)) : '') + '</button></div>';
        } else {
          h += '<div class="alv-s" style="margin-top:4px">' + esc(li.livre_par === 'vendeur' ? 'Le vendeur' + (li.vendeur ? ' (' + li.vendeur + ')' : '') : 'L’expert produit' + (li.expert ? ' (' + li.expert + ')' : '')) + '</div>';
        }
        h += '</div>';
      }
      h += '<div class="alv-p ' + (li.prepa_le ? 'ok' : 'ko') + '"><span>' + (li.prepa_le ? 'Préparation planifiée ' + esc(dateLongue(li.prepa_le)) : 'Préparation pas encore planifiée') + '</span></div>';
    } else if (p.extra && p.extra.proprietaire) {
      h += '<div class="alv-g">' + ligne(f === 'prepa' ? 'Demandée par' : 'Dans l’agenda de', p.extra.proprietaire, '') + (p.extra.vin ? ligne('VIN', p.extra.vin, '') : '') + '</div>';
    }
    if (comm) h += '<div><div class="alv-l">' + (estLiv ? 'Commentaire BACS' : 'Commentaire') + '</div><div class="alv-cm">' + esc(comm) + '</div></div>';
    h += '</div><div class="alv-f">'
      + (!ro && p.can_edit ? '<button type="button" class="pri" data-edit>Modifier le rendez-vous</button>' : '')
      + (!ro && p.can_edit && isPastSlot(p.event_start_time) && Number(p.id_client) > 0 ? '<button type="button" class="pri" data-edit>Compte rendu</button>' : '')
      + '<button type="button" data-print>Imprimer la fiche</button><button type="button" data-x>Fermer</button></div></div>';
    ov = d.createElement('div'); ov.id = 'agenda-livr-ov'; ov.innerHTML = h;
    (d.body || d.documentElement).appendChild(ov);
    const close = () => { try { ov.remove(); } catch (e) {} };
    ov.addEventListener('mousedown', (e) => { if (e.target === ov) close(); });
    ov.querySelectorAll('[data-x]').forEach(b => b.addEventListener('click', close));
    const be = ov.querySelector('[data-edit]'); if (be) be.addEventListener('click', () => { close(); window.__agendaSelected = p; openEdit(ev); });
    const bp = ov.querySelector('[data-print]'); if (bp) bp.addEventListener('click', () => {
      const lot = [p]; const jour = new Date(toFc(p.event_start_time));
      planningSeul = estLiv ? 'livraison' : null;
      ouvrirImpression(estLiv ? planningLivraisonsHtml(lot, 'Livraison du ' + jour.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }), nomSiteDe(p.id_site))
                              : planningJourHtml(lot, jour, nomSiteDe(p.id_site)));
    });
    ov.querySelectorAll('[data-qui]').forEach(b => b.addEventListener('click', async () => {
      const q = b.getAttribute('data-qui');
      try {
        const r = await sb().rpc('rdv_livraison_qui', { p_id_rdv: Number(p.origin_id), p_qui: q });
        if (r.error) throw r.error;
        p.extra = Object.assign({}, p.extra, { livraison: Object.assign({}, li, { livre_par: q, livre_par_fixe: true }) });
        toast(q === 'vendeur' ? 'Noté : le vendeur livre lui-même.' : 'Noté : l’expert produit livre.', 'ok');
        close(); ouvrirFicheLivraison(p, ev); refetch();
      } catch (e) { toast('Impossible : ' + ((e && e.message) || e)); }
    }));
  }
  function nomSiteDe(id) { return ((siteAg.sites || []).find(x => Number(x.id_site) === Number(id)) || {}).nom || ('Site ' + id); }
  function nomPersonne(id) {
    for (const k in membresCache) { const m = membresCache[k].find(x => Number(x.id_user) === Number(id)); if (m) return m.nom; }
    const i = (invitablesCache || []).find(x => Number(x.id_user) === Number(id));
    if (i) return i.nom;
    if (Number(id) === Number(CACHED_UID)) return viewerName() || 'moi';
    return 'Utilisateur ' + id;
  }
  // Menu « Dans l'agenda de » : moi d'abord, puis le site par fonction.
  function optionsProprietaire(cur, curNom) {
    const moi = Number(CACHED_UID);
    const ms = membresSite().filter(m => m.id_user !== moi);
    let h = '<option value="' + moi + '"' + (Number(cur) === moi ? ' selected' : '') + '>Moi (' + esc(viewerName() || 'mon agenda') + ')</option>';
    const vus = { [moi]: 1 };
    const grp = {};
    ms.forEach(m => { const g = m.role_nom || 'Équipe'; (grp[g] = grp[g] || []).push(m); });
    const ordre = (g) => /chef/i.test(g) ? 1 : /vendeur/i.test(g) ? 2 : 3;
    Object.keys(grp).sort((a, b) => ordre(a) - ordre(b) || a.localeCompare(b, 'fr')).forEach(g => {
      h += '<optgroup label="' + esc(g) + '">' + grp[g].map(m => { vus[m.id_user] = 1; return '<option value="' + m.id_user + '"' + (Number(cur) === m.id_user ? ' selected' : '') + '>' + esc(m.nom) + '</option>'; }).join('') + '</optgroup>';
    });
    if (cur != null && !vus[Number(cur)]) h = '<option value="' + Number(cur) + '" selected>' + esc(curNom || nomPersonne(cur)) + '</option>' + h;
    return h;
  }

  function changerVue(v) {
    if (v === vue) return;
    if (lectureSeule() && v !== 'livr') return;
    vue = v;
    try { frontWin().sessionStorage.setItem(VUE_CLE, v); } catch (e) {}
    if (vueSite()) { const t = siteIds(); if (t && t.length === 1) siteAg.id = Number(t[0]); else if (siteAg.id == null) siteAg.id = siteParDefaut(); siteAg.topSig = JSON.stringify(t); }
    try {
      calendar.setOption('slotEventOverlap', !vueSite());
      calendar.setOption('allDaySlot', vueSite());
      if (isMobile()) calendar.changeView(vueSite() ? 'timeGridDay' : 'timeGrid3');
    } catch (e) {}
    collabSig = null;
    renderCollab(true);
    if (vueSite()) chargerMembresPour(siteAg.id).then(() => { renderSiteBar(); refetch(); });
    else { const sb0 = document.getElementById('agenda-site'); if (sb0) { sb0.style.display = 'none'; sb0.innerHTML = ''; } refetch(); }
  }

  let printMenuOuvert = false;
  function renderVues() {
    const host = document.getElementById('agenda-vues');
    if (!host) return;
    const ls = lectureSeule();
    host.innerHTML = '<div class="agv-seg">'
      + (ls ? '' : '<button type="button" data-vue="perso" class="' + (vue === 'perso' ? 'is-on' : '') + '">Mon agenda</button>')
      + '<button type="button" data-vue="livr" class="' + (vueLivr() ? 'is-on' : '') + '">' + (ls ? 'Préparations et livraisons' : 'Livraisons du site') + '</button>'
      + (ls ? '' : '<button type="button" data-vue="site" class="' + (vue === 'site' ? 'is-on' : '') + '">Agenda du site</button>') + '</div>'
      + '<div class="agv-print"><button type="button" class="agl-btn" id="agv-print">🖨 Planning</button>'
      + '<div class="agv-print-menu" id="agv-print-menu"' + (printMenuOuvert ? '' : ' style="display:none"') + '>'
      + '<div class="agv-dates"><span>Choisir les dates</span><label>Du<input type="date" id="agv-du"></label><label>Au<input type="date" id="agv-au"></label>'
      + '<div class="agv-dates-b"><button type="button" data-print="periode">Tout</button><button type="button" data-print="periode" data-seul="prepa">Préparations</button><button type="button" data-print="periode" data-seul="livraison">Livraisons</button></div></div>'
      + '<button type="button" data-print="jour" data-seul="livraison">Livraisons · jour<small>Le détail de chaque livraison, jour affiché</small></button>'
      + '<button type="button" data-print="semaine" data-seul="livraison">Livraisons · semaine<small>Le détail de chaque livraison, semaine affichée</small></button>'
      + '<button type="button" data-print="jour">Planning du jour<small>Livraisons, préparations, réceptions — jour affiché</small></button>'
      + '<button type="button" data-print="semaine">Planning de la semaine<small>Du lundi au samedi de la semaine affichée</small></button>'
      + '<button type="button" data-print="jour" data-seul="prepa">Préparateur · jour<small>Les seules préparations du site, jour affiché</small></button>'
      + '<button type="button" data-print="semaine" data-seul="prepa">Préparateur · semaine<small>Les seules préparations du site, semaine affichée</small></button>'
      + '</div></div>';
    host.querySelectorAll('[data-vue]').forEach(b => b.addEventListener('click', () => changerVue(b.getAttribute('data-vue'))));
    const pb = host.querySelector('#agv-print'), pm = host.querySelector('#agv-print-menu');
    // Dates proposées : la semaine affichée.
    try {
      const d0 = calendar ? new Date(calendar.getDate()) : new Date(); const dw = (d0.getDay() + 6) % 7;
      const lu = new Date(d0.getFullYear(), d0.getMonth(), d0.getDate() - dw), sa = new Date(lu); sa.setDate(lu.getDate() + 5);
      const iDu = host.querySelector('#agv-du'), iAu = host.querySelector('#agv-au');
      if (iDu && !iDu.value) iDu.value = ymd(lu); if (iAu && !iAu.value) iAu.value = ymd(sa);
      [iDu, iAu].forEach(x => x && x.addEventListener('click', ev => ev.stopPropagation()));
    } catch (e) {}
    if (pb) pb.addEventListener('click', (e) => { e.stopPropagation(); printMenuOuvert = !printMenuOuvert; pm.style.display = printMenuOuvert ? '' : 'none'; });
    host.querySelectorAll('[data-print]').forEach(b => b.addEventListener('click', (e) => {
      e.stopPropagation();
      const k = b.getAttribute('data-print');
      let du = null, au = null;
      if (k === 'periode') {
        du = (host.querySelector('#agv-du') || {}).value; au = (host.querySelector('#agv-au') || {}).value;
        if (!du || !au || au < du) { toast('Choisissez une date de début et une date de fin.'); return; }
      }
      printMenuOuvert = false; pm.style.display = 'none'; imprimerPlanning(k, b.getAttribute('data-seul'), du, au);
    }));
    if (!window.__agendaPrintOutside) {
      window.__agendaPrintOutside = (e) => { const m = document.getElementById('agv-print-menu'); const h = document.getElementById('agenda-vues'); if (printMenuOuvert && m && h && !h.contains(e.target)) { printMenuOuvert = false; m.style.display = 'none'; } };
      try { frontDoc().addEventListener('mousedown', window.__agendaPrintOutside, true); } catch (e) {}
    }
  }

  // Barre de l'agenda du site : choix du site (si plusieurs) et une pastille
  // par personne (cliquer masque / affiche son agenda).
  function renderSiteBar() {
    const host = document.getElementById('agenda-site');
    if (!host) return;
    if (!vueSite()) { host.style.display = 'none'; host.innerHTML = ''; return; }
    host.style.display = '';
    if (siteAg.id == null) siteAg.id = siteParDefaut();
    if (!siteAg.sites) { chargerMesSites().then(() => { if (siteAg.id == null) siteAg.id = siteParDefaut(); renderSiteBar(); refetch(); }); }
    const ms = membresCache[String(siteAg.id)];
    if (!ms && siteAg.id != null) { chargerMembresPour(siteAg.id).then(() => { renderSiteBar(); refetch(); }); }
    const sites = siteAg.sites || [];
    let h = '<div class="ags-bar">';
    if (sites.length > 1) {
      h += '<select class="ags-sel" id="ags-site">' + sites.map(x => '<option value="' + x.id_site + '"' + (Number(x.id_site) === Number(siteAg.id) ? ' selected' : '') + '>' + esc(x.nom) + '</option>').join('') + '</select>';
    }
    if (vueLivr()) {
      h += '<span class="ags-lg"><i class="exp"></i>' + (siteAExpert(siteAg.id) ? 'L’expert produit livre' : 'Livraison') + '</span>'
        + (siteAExpert(siteAg.id) ? '<span class="ags-lg"><i class="vdr"></i>Le vendeur livre lui-même</span>' : '')
        + '<span class="ags-lg"><i class="prp"></i>Préparation</span>'
        + (lectureSeule() ? '<span class="ags-lg ro">Lecture seule</span>' : '');
    }
    else if (!ms) h += '<span class="ags-vide">Chargement de l’équipe…</span>';
    else if (!ms.length) h += '<span class="ags-vide">Personne n’est rattaché à ce site.</span>';
    else {
      h += ms.map(m => {
        const on = !siteAg.masques.has(m.id_user);
        return '<button type="button" class="ags-p' + (on ? ' is-on' : '') + '" data-p="' + m.id_user + '" title="' + esc(m.nom + (m.role_nom ? ' · ' + m.role_nom : '')) + '">'
          + '<span class="av" style="background:' + m.couleur + '">' + esc(initials(m.nom)) + '</span>' + esc(m.nom.split(/\s+/)[0]) + '</button>';
      }).join('');
      h += '<button type="button" class="ags-act" data-pall="1">Tous</button><button type="button" class="ags-act" data-pall="0">Aucun</button>';
    }
    h += '</div>';
    host.innerHTML = h;
    const se = host.querySelector('#ags-site');
    if (se) se.addEventListener('change', () => { siteAg.id = Number(se.value); siteAg.masques = new Set(); poserSiteHaut(siteAg.id); renderSiteBar(); chargerMembresPour(siteAg.id).then(() => { renderSiteBar(); refetch(); }); });
    host.querySelectorAll('[data-p]').forEach(b => b.addEventListener('click', () => {
      const id = Number(b.getAttribute('data-p'));
      if (siteAg.masques.has(id)) siteAg.masques.delete(id); else siteAg.masques.add(id);
      renderSiteBar(); refetch();
    }));
    host.querySelectorAll('[data-pall]').forEach(b => b.addEventListener('click', () => {
      siteAg.masques = b.getAttribute('data-pall') === '1' ? new Set() : new Set((ms || []).map(m => m.id_user));
      renderSiteBar(); refetch();
    }));
  }

  async function fetchSite(info, success, failure) {
    const client = sb(); if (!client) return failure(new Error('no supabase'));
    try {
      if (siteAg.id == null) { await chargerMesSites(); siteAg.id = siteParDefaut(); }
      suivreSiteHaut();
      const idSite = Number(siteAg.id);
      const ms = await chargerMembresPour(idSite);
      if (Number(siteAg.id) !== idSite) return success([]);   // site changé pendant le chargement
      const ids = ms.map(m => m.id_user).filter(id => vueLivr() || !siteAg.masques.has(id));
      if (!ids.length) { retirerProvisoires(); return success([]); }
      const { data, error } = await client.rpc('get_calendar_events', {
        p_start: info.startStr.slice(0, 19).replace('T', ' '), p_end: info.endStr.slice(0, 19).replace('T', ' '),
        p_user_ids: ids, p_site_ids: null });
      if (error) throw error;
      // Un RDV où une personne du site n'est qu'invitée remonte aussi : on ne
      // garde que ceux dont le propriétaire est du site (les autres sont dans
      // l'agenda d'un collègue d'un autre site).
      const garde = new Set(ms.map(m => m.id_user));
      // Les rapports vendeur (relances à faire) restent dans l'agenda personnel.
      // Événements DE CE SITE seulement (une absence suit la personne partout).
      const duSite = (r) => r.id_site == null || Number(r.id_site) === idSite || familleEvt(r) === 'absence';
      const rows = (data || []).filter(r => ((r.source_type === 'rdv' && garde.has(Number(r.id_user))) || r.source_type === 'bilat') && duSite(r)
        && (!vueLivr() || FAMILLES_LIVR.indexOf(familleEvt(r)) >= 0));
      retirerProvisoires();
      success(buildEvents(rows));
    } catch (err) { console.error('[agenda] agenda du site', err); failure(err); }
  }

  /* ===== PLANNING IMPRIMABLE (responsable livraisons, préparateurs) ======
     A4 paysage. Jour : un tableau par nature, trié par heure, avec la
     personne, le client, le VIN, le commentaire et une case à cocher.
     Semaine : six colonnes (lundi → samedi, + dimanche s'il y a quelque
     chose), une carte par événement. Toujours le site entier.
  ======================================================================== */
  const NATURES_PLANNING = [
    { cle: 'livraison', type: 4,  titre: 'Livraisons',                qui: 'Metteur en main' },
    { cle: 'prepa',     type: 12, titre: 'Préparations',              qui: 'Demandée par' },
    { cle: 'recep',     type: 13, titre: 'Réceptions / restitutions', qui: 'Accueil' },
    { cle: 'bloque',    type: 14, titre: 'Créneaux « pas de livraison »', qui: 'Agenda', court: 'Pas de livraison' },
  ];
  function ymd(d) { return d.getFullYear() + '-' + pad2(d.getMonth() + 1) + '-' + pad2(d.getDate()); }
  let planningSeul = null;            // v35 : 'prepa' = planning du préparateur
  async function imprimerPlanning(kind, seul, duPer, auPer) {
    planningSeul = seul || null;
    const idSite = siteCourant();
    if (idSite == null) { showAgError('Planning', 'Choisissez un site dans la barre du haut.'); return; }
    toast('Préparation du planning…', 'ok');
    try {
      const ms = await chargerMembresPour(idSite);
      await Promise.all([chargerMesSites(), chargerInvitables()]);
      const nomSite = ((siteAg.sites || []).find(x => Number(x.id_site) === Number(idSite)) || {}).nom || ('Site ' + idSite);
      let d0 = calendar ? new Date(calendar.getDate()) : new Date();
      d0 = new Date(d0.getFullYear(), d0.getMonth(), d0.getDate());
      let debut = d0, fin;
      if (kind === 'semaine') { const dw = (d0.getDay() + 6) % 7; debut = new Date(d0); debut.setDate(d0.getDate() - dw); }
      fin = new Date(debut); fin.setDate(debut.getDate() + (kind === 'semaine' ? 7 : 1));
      if (kind === 'periode' && duPer && auPer) {
        const a = duPer.split('-').map(Number), z = auPer.split('-').map(Number);
        debut = new Date(a[0], a[1] - 1, a[2]); fin = new Date(z[0], z[1] - 1, z[2] + 1);
      }
      const ids = ms.map(m => m.id_user);
      const { data, error } = await sb().rpc('get_calendar_events', { p_start: ymd(debut) + ' 00:00:00', p_end: ymd(fin) + ' 00:00:00', p_user_ids: ids.length ? ids : [-1], p_site_ids: null });
      if (error) throw error;
      const garde = new Set(ids);
      const rows = (data || []).filter(r => r.source_type === 'rdv' && garde.has(Number(r.id_user))
        && (r.id_site == null || Number(r.id_site) === Number(idSite))
        && NATURES_PLANNING.some(n => n.cle === familleEvt(r))
        && (!planningSeul || familleEvt(r) === planningSeul))
        .sort((a, b) => String(a.event_start_time).localeCompare(String(b.event_start_time)));
      let html;
      if (planningSeul === 'livraison') {
        const t = kind === 'jour' ? 'Livraisons du ' + debut.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
          : 'Livraisons du ' + debut.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' }) + ' au ' + new Date(fin.getTime() - 86400000).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
        html = planningLivraisonsHtml(rows, t, nomSite);
      } else if (kind === 'periode') {
        html = '';
        for (let d = new Date(debut); d < fin; d.setDate(d.getDate() + 1)) {
          const lot = rows.filter(r => String(r.event_start_time || '').slice(0, 10) === ymd(d));
          if (!lot.length) continue;
          html += '<div class="jr">' + planningJourHtml(lot, new Date(d), nomSite) + '</div>';
        }
        if (!html) html = '<div class="ent"><h1>Rien de prévu</h1><div class="s">' + esc(nomSite) + '</div></div>';
      } else html = kind === 'semaine' ? planningSemaineHtml(rows, debut, nomSite) : planningJourHtml(rows, debut, nomSite);
      ouvrirImpression(html);
    } catch (e) { console.error('[agenda] planning', e); toast('Planning impossible : ' + ((e && e.message) || e)); }
  }
  function lignePlanning(r) {
    const x = r.extra || {};
    const hd = String(r.event_start_time || '').slice(11, 16).replace(':', 'h');
    const hf = String(r.event_end_time || '').slice(11, 16).replace(':', 'h');
    const invites = (Array.isArray(x.invites) ? x.invites : []).map(nomPersonne).filter(n => !/^Utilisateur \d/.test(n)).join(', ');
    const li = x.livraison || {};
    const estLiv = familleEvt(r) === 'livraison';
    return { hd, hf, client: clientName(r) || '', vin: li.vin || x.vin || '', comm: estLiv ? commentaireLivr(r) : String(r.description || '').trim(),
             qui: x.proprietaire || nomPersonne(r.id_user), invites, couleur: couleurPersonne(r.id_user),
             tel: li.tel || '', vehicule: li.vehicule || '', commande: li.commande || '', vendeur: li.vendeur || '',
             livre: estLiv ? (li.livre_par === 'vendeur' ? 'le vendeur' + (li.vendeur ? ' (' + prenomDe(li.vendeur) + ')' : '') : (li.expert ? li.expert : 'le vendeur')) : '',
             prepa: estLiv ? (li.prepa_le ? 'planifiée ' + String(li.prepa_le).slice(8, 10) + '/' + String(li.prepa_le).slice(5, 7) + ' ' + String(li.prepa_le).slice(11, 16).replace(':', 'h') : 'pas planifiée') : '' };
  }
  const CSS_PRINT = '@page{size:A4 landscape;margin:10mm}*{box-sizing:border-box}body{font-family:"Nunito Sans",Arial,sans-serif;color:#1F4A85;margin:0;font-size:11px}'
    + '.ent{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:2px solid #1F4A85;padding-bottom:6px;margin-bottom:10px}'
    + '.ent h1{font-size:18px;margin:0}.ent .s{color:#5a6b8c;font-size:11px;text-align:right}'
    + 'h2{font-size:13px;margin:12px 0 4px;display:flex;align-items:center;gap:8px}h2 i{width:10px;height:10px;border-radius:3px;display:inline-block}'
    + 'h2 em{font-style:normal;font-weight:600;color:#5a6b8c;font-size:11px}'
    + 'table{width:100%;border-collapse:collapse;page-break-inside:auto}tr{page-break-inside:avoid}'
    + 'th{text-align:left;font-size:9.5px;text-transform:uppercase;letter-spacing:.04em;color:#5a6b8c;border-bottom:1px solid #c9d9ee;padding:4px 5px}'
    + 'td{border-bottom:1px solid #e8eef7;padding:5px;vertical-align:top}td.h{white-space:nowrap;font-weight:800;width:70px}td.ck{width:26px}td.ck span{display:inline-block;width:13px;height:13px;border:1.5px solid #1F4A85;border-radius:3px}'
    + '.p{display:inline-flex;align-items:center;gap:5px;font-weight:700}.p i{width:8px;height:8px;border-radius:50%;display:inline-block}'
    + '.vin{font-family:monospace;font-size:10.5px}.c{color:#3d4f6b}.vide{color:#7d93b2;font-style:italic;padding:6px 0}'
    + '.sem{display:grid;gap:6px}.col{border:1px solid #c9d9ee;border-radius:6px;min-height:150mm;overflow:hidden}.col h3{margin:0;padding:5px 6px;font-size:11.5px;background:#eef3fa;border-bottom:1px solid #c9d9ee}'
    + '.ev{margin:4px;padding:4px 5px;border-radius:4px;border-left:3px solid;background:#f7f9fc;page-break-inside:avoid}.ev b{display:block;font-size:10.5px}.ev span{display:block;font-size:9.5px;color:#3d4f6b}'
    + '.lg{display:flex;flex-wrap:wrap;gap:10px;margin-top:8px;font-size:10px;color:#5a6b8c}.jr{page-break-after:always}.jr:last-child{page-break-after:auto}'
    + '@media screen{body{padding:16px;background:#f2f6fc}.feuille{background:#fff;padding:14px;max-width:290mm;margin:auto;box-shadow:0 4px 18px rgba(31,74,133,.12)}}';
  function planningJourHtml(rows, jour, nomSite) {
    const titreJour = jour.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
    let b = '<div class="ent"><h1>' + (planningSeul === 'prepa' ? 'Préparations du ' : 'Planning du ') + esc(titreJour) + '</h1><div class="s">' + esc(nomSite) + '<br>Imprimé le ' + esc(new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })) + '</div></div>';
    NATURES_PLANNING.filter(n => !planningSeul || n.cle === planningSeul).forEach(n => {
      const lot = rows.filter(r => familleEvt(r) === n.cle);
      if (n.cle === 'bloque' && !lot.length) return;
      b += '<h2><i style="background:' + CFG.colors[n.cle] + '"></i>' + esc(n.titre) + ' <em>' + lot.length + '</em></h2>';
      if (!lot.length) { b += '<div class="vide">Rien de prévu.</div>'; return; }
      if (n.cle === 'livraison') { b += tableLivraisons(lot); return; }
      b += '<table><thead><tr><th>Heure</th><th>' + esc(n.qui) + '</th><th>Client</th><th>VIN</th><th>Vendeur / invités</th><th>Commentaire</th><th>Fait</th></tr></thead><tbody>'
        + lot.map(r => { const l = lignePlanning(r); return '<tr><td class="h">' + esc(l.hd) + (l.hf ? '<br><span class="c">→ ' + esc(l.hf) + '</span>' : '') + '</td>'
          + '<td><span class="p"><i style="background:' + l.couleur + '"></i>' + esc(l.qui) + '</span></td>'
          + '<td>' + esc(l.client) + (l.tel ? '<br><span class="c">' + esc(l.tel) + '</span>' : '') + '</td><td class="vin">' + esc(l.vin) + '</td><td>' + esc(l.invites) + '</td>'
          + '<td class="c">' + esc(l.comm) + '</td><td class="ck"><span></span></td></tr>'; }).join('')
        + '</tbody></table>';
    });
    return b;
  }
  // v38 : le tableau complet des livraisons (expert produit, préparateur).
  function tableLivraisons(lot) {
    return '<table><thead><tr><th>Heure</th><th>Client</th><th>Véhicule</th><th>Vendu par · livré par</th><th>Commentaire BACS</th><th>Préparation</th><th>Fait</th></tr></thead><tbody>'
      + lot.map(r => { const l = lignePlanning(r); return '<tr><td class="h">' + esc(l.hd) + (l.hf ? '<br><span class="c">→ ' + esc(l.hf) + '</span>' : '') + '</td>'
        + '<td><b>' + esc(l.client || '—') + '</b>' + (l.tel ? '<br>' + esc(l.tel) : '') + '</td>'
        + '<td>' + esc(l.vehicule || '') + (l.vin ? '<br><span class="vin">' + esc(l.vin) + '</span>' : '') + (l.commande ? '<br><span class="c">commande ' + esc(l.commande) + '</span>' : '') + '</td>'
        + '<td><b>' + esc(l.vendeur || l.qui || '') + '</b><br><span class="c">livré par ' + esc(l.livre) + '</span></td>'
        + '<td class="c">' + esc(l.comm) + '</td><td class="c">' + esc(l.prepa) + '</td><td class="ck"><span></span></td></tr>'; }).join('')
      + '</tbody></table>';
  }
  function planningLivraisonsHtml(rows, titre, nomSite) {
    const lot = rows.filter(r => familleEvt(r) === 'livraison');
    let b = '<div class="ent"><h1>' + esc(titre) + '</h1><div class="s">' + esc(nomSite) + ' · ' + lot.length + ' livraison' + (lot.length > 1 ? 's' : '') + '<br>Imprimé le ' + esc(new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })) + '</div></div>';
    if (!lot.length) return b + '<div class="vide">Aucune livraison.</div>';
    const jours = [];
    lot.forEach(r => { const j = String(r.event_start_time || '').slice(0, 10); if (jours.indexOf(j) < 0) jours.push(j); });
    jours.forEach(j => {
      const d = new Date(j + 'T12:00:00');
      if (jours.length > 1) b += '<h2>' + esc(d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })) + '</h2>';
      b += tableLivraisons(lot.filter(r => String(r.event_start_time || '').slice(0, 10) === j));
    });
    return b;
  }
  function planningSemaineHtml(rows, lundi, nomSite) {
    const jours = [];
    for (let i = 0; i < 7; i++) { const d = new Date(lundi); d.setDate(lundi.getDate() + i); jours.push(d); }
    const parJour = jours.map(d => rows.filter(r => String(r.event_start_time || '').slice(0, 10) === ymd(d)));
    const cols = parJour[6].length ? 7 : 6;
    const dim = jours[cols - 1];
    let b = '<div class="ent"><h1>' + (planningSeul === 'prepa' ? 'Préparations de la semaine du ' : 'Planning de la semaine du ') + esc(lundi.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })) + ' au ' + esc(dim.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })) + '</h1>'
      + '<div class="s">' + esc(nomSite) + ' · ' + rows.length + ' événement' + (rows.length > 1 ? 's' : '') + '<br>Imprimé le ' + esc(new Date().toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' })) + '</div></div>';
    b += '<div class="sem" style="grid-template-columns:repeat(' + cols + ',1fr)">';
    for (let i = 0; i < cols; i++) {
      b += '<div class="col"><h3>' + esc(jours[i].toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: '2-digit' })) + '</h3>'
        + (parJour[i].length ? parJour[i].map(r => { const l = lignePlanning(r); const f = familleEvt(r);
            return '<div class="ev" style="border-color:' + CFG.colors[f] + '"><b>' + esc(l.hd) + ' · ' + esc((PICTO[f] || '') + ' ' + (l.client || ((NATURES_PLANNING.find(n => n.cle === f) || {}).court) || (NATURES_PLANNING.find(n => n.cle === f) || {}).titre || '')) + '</b>'
              + '<span><span class="p" style="display:inline-flex"><i style="background:' + l.couleur + '"></i>' + esc(l.qui) + '</span></span>'
              + (l.vin ? '<span class="vin">' + esc(l.vin) + '</span>' : '')
              + (l.invites ? '<span>avec ' + esc(l.invites) + '</span>' : '')
              + (l.tel ? '<span>' + esc(l.tel) + '</span>' : '')
              + (l.vendeur ? '<span>vendu par ' + esc(l.vendeur) + ' · livré par ' + esc(l.livre) + '</span>' : '')
              + (l.comm ? '<span>' + esc(planningSeul || f === 'livraison' ? l.comm : l.comm.slice(0, 90)) + '</span>' : '') + '</div>'; }).join('')
          : '<div class="vide" style="padding:6px">—</div>')
        + '</div>';
    }
    b += '</div><div class="lg">' + NATURES_PLANNING.filter(n => !planningSeul || n.cle === planningSeul).map(n => '<span><i style="display:inline-block;width:9px;height:9px;border-radius:2px;background:' + CFG.colors[n.cle] + '"></i> ' + esc(n.titre) + '</span>').join('') + '</div>';
    return b;
  }
  function ouvrirImpression(corps) {
    const doc = '<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Planning</title>'
      + '<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700;800&display=swap">'
      + '<style>' + CSS_PRINT + '</style></head><body><div class="feuille">' + corps + '</div>'
      + '<script>window.onload=function(){setTimeout(function(){window.print();},350);};<\/script></body></html>';
    const w = frontWin().open('', '_blank');
    if (w) { w.document.open(); w.document.write(doc); w.document.close(); return; }
    // Fenêtres bloquées : impression par un cadre invisible.
    const d = frontDoc(); const f = d.createElement('iframe');
    f.style.cssText = 'position:fixed;right:0;bottom:0;width:0;height:0;border:0';
    (d.body || d.documentElement).appendChild(f);
    f.contentDocument.open(); f.contentDocument.write(doc.replace('window.print()', 'window.print();setTimeout(function(){parent.document.body.removeChild(frameElement)},1500)')); f.contentDocument.close();
  }

  function renderCollab(force) {
    const host = document.getElementById('agenda-collab'); if (!host) return;
    const sig = collabSignature();
    // Le poll rappelle renderCollab(false) toutes les 600 ms. L'ancienne
    // condition portait `&& !collabMenuOpen` : quand le menu etait OUVERT,
    // la sortie anticipee ne se declenchait pas et le innerHTML ci-dessous
    // reconstruisait la liste a chaque tick, remettant scrollTop a zero.
    // On ne pouvait donc pas atteindre les vendeurs du bas. La condition
    // disait l'inverse de son intention : c'est justement quand le menu est
    // ouvert qu'il ne faut pas le reconstruire.
    // L'etat ouvert/ferme n'a pas besoin d'un rendu : wireCollab pilote
    // menu.style.display directement.
    if (!force && sig === collabSig) return;
    collabSig = sig;
    renderVues();              // même cycle de rendu que le sélecteur
    renderChips();
    if (vueSite()) { host.style.display = 'none'; renderSiteBar(); return; }
    const model = buildCollaborators();
    if (!model) { return; }                              // pas prêt : on retentera au poll
    if (model.mode === 'cascade') { renderCascade(host, model); return; }
    if (model.mode === 'none') { host.style.display = 'none'; host.innerHTML = ''; return; }
    host.style.display = '';
    // v20 : collaborateur affiche absent de la liste du site choisi -> on
    // revient a l'agenda de l'utilisateur.
    const aff = agendaUserVal();
    if (aff != null && String(aff) !== String(CACHED_UID) && !model.allById[Number(aff)]) {
      clearAgendaUser(); collabSig = null; try { refetch(); } catch (e) {}
    }
    const curId = currentCollabId();
    const curName = model.allById[curId] || model.selfName || '';
    let menu = '';
    for (const g of model.groups) { if (!g.items.length) continue; menu += '<div class="agc-grp">' + esc(g.label) + '</div>'; for (const it of g.items) menu += '<div class="agc-opt' + (String(it.id) === String(curId) ? ' is-sel' : '') + '" data-id="' + it.id + '">' + esc(it.nom) + '</div>'; }
    // Si le menu est ouvert et que le contenu change vraiment (nouveau
    // perimetre, vendeurs qui arrivent), on lui rend sa position de
    // defilement apres reconstruction.
    const menuPrec = host.querySelector('#agc-menu');
    const scrollPrec = menuPrec ? menuPrec.scrollTop : 0;
    host.innerHTML =
      '<button type="button" class="agc-trigger" id="agc-trigger">'
      + '<span class="agc-ava">' + esc(initials(curName)) + '</span>'
      + '<span class="agc-name">' + esc(curName || '—') + '</span>'
      + '<span class="agc-chev">▾</span></button>'
      + '<div class="agc-menu" id="agc-menu"' + (collabMenuOpen ? '' : ' style="display:none"') + '>' + menu + '</div>';
    if (collabMenuOpen && scrollPrec) {
      const m = host.querySelector('#agc-menu'); if (m) m.scrollTop = scrollPrec;
    }
    wireCollab(host);
  }
  function wireCollab(host) {
    const trig = host.querySelector('#agc-trigger'); const menu = host.querySelector('#agc-menu');
    if (trig) trig.addEventListener('click', (e) => { e.stopPropagation(); collabMenuOpen = !collabMenuOpen; menu.style.display = collabMenuOpen ? '' : 'none'; });
    host.querySelectorAll('.agc-opt').forEach(o => o.addEventListener('click', (e) => {
      e.stopPropagation(); const id = o.getAttribute('data-id'); collabMenuOpen = false; setAgendaUser(id); renderCollab(true); refetch();
    }));
  }
  function esc(s) { if (s == null) return ''; return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }

  // --- styles (charte dashboard) ---------------------------------------------
  function injectCss() {
    const d = document; if (d.getElementById('agenda-css')) return;
    const st = d.createElement('style'); st.id = 'agenda-css';
    st.textContent = `
#agenda-root{font-family:"Nunito Sans",system-ui,sans-serif;color:#2c2c2a}
#agenda-root .agenda-card{background:#fff;border:1.5px solid #e8eef7;border-radius:14px;padding:16px 18px}
#agenda-root .agenda-top{display:flex;align-items:center;justify-content:space-between;gap:12px;margin-bottom:14px}
#agenda-root .agenda-title{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#9bb3d1}
#agenda-root #agenda-collab{position:relative}
#agenda-root #agenda-vues{display:flex;gap:8px;align-items:center;margin-left:auto;margin-right:10px}
#agenda-root .agv-seg{display:inline-flex;border:1.5px solid #e8eef7;border-radius:10px;overflow:hidden;background:#fff}
#agenda-root .agv-seg button{border:0;background:transparent;color:#2a5ea9;font-weight:800;font-size:12.5px;padding:7px 13px;cursor:pointer;font-family:inherit;white-space:nowrap}
#agenda-root .agv-seg button.is-on{background:#2a5ea9;color:#fff}
#agenda-root .agv-print{position:relative}
#agenda-root .agv-print-menu{position:absolute;right:0;top:calc(100% + 6px);z-index:60;background:#fff;border:1.5px solid #e8eef7;border-radius:12px;box-shadow:0 10px 30px rgba(31,74,133,.14);padding:6px;min-width:220px}
#agenda-root .agv-print-menu button{display:block;width:100%;text-align:left;border:0;background:transparent;padding:9px 11px;border-radius:8px;font:700 13px "Nunito Sans",system-ui,sans-serif;color:#1F4A85;cursor:pointer}
#agenda-root .agv-print-menu button:hover{background:#f2f6fc}
#agenda-root .agv-print-menu small{display:block;font-weight:600;color:#7d93b2;font-size:11.5px}
#agenda-root .agv-print-menu{min-width:280px}
#agenda-root .agv-dates{display:grid;grid-template-columns:1fr 1fr;gap:6px;padding:8px 10px 10px;border-bottom:1.5px solid #eef2f8;margin-bottom:4px}
#agenda-root .agv-dates > span{grid-column:1/-1;font-size:10.5px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:#5f7aa3}
#agenda-root .agv-dates label{display:grid;gap:3px;font-size:11px;font-weight:700;color:#5f7aa3}
#agenda-root .agv-dates input{border:1.5px solid #e8eef7;border-radius:8px;padding:5px 7px;font:700 12.5px "Nunito Sans",system-ui,sans-serif;color:#1F4A85}
#agenda-root .agv-dates-b{grid-column:1/-1;display:flex;gap:6px}
#agenda-root .agv-print-menu .agv-dates-b button{flex:1;text-align:center;background:#2a5ea9;color:#fff;padding:7px 6px;font-size:12px}
#agenda-root .agv-print-menu .agv-dates-b button:hover{background:#1F4A85}
#agenda-root .ags-lg{display:inline-flex;align-items:center;gap:6px;font-size:12px;font-weight:700;color:#4b628a}
#agenda-root .ags-lg i{width:12px;height:12px;border-radius:3px;display:inline-block}
#agenda-root .ags-lg i.exp{background:${CFG.colors.livraison}}#agenda-root .ags-lg i.vdr{background:#fff;border:1.5px dashed #7f9cc4}#agenda-root .ags-lg i.prp{background:${CFG.colors.prepa}}
#agenda-root .ags-lg.ro{background:#fff6e6;color:#7a5208;border:1.5px solid #f3d9a4;border-radius:999px;padding:3px 10px}
#agenda-root .fc-event.ag-livr-vendeur{border-style:dashed!important;border-width:1.5px!important}
#agenda-root #agenda-site{margin:-4px 0 12px}
#agenda-root .ags-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
#agenda-root .ags-sel{border:1.5px solid #e8eef7;border-radius:10px;padding:6px 10px;font:700 13px "Nunito Sans",system-ui,sans-serif;color:#1F4A85;background:#fff;max-width:260px}
#agenda-root .ags-p{display:inline-flex;align-items:center;gap:6px;border:1.5px solid #e8eef7;background:#fff;color:#9bb3d1;font-weight:700;font-size:12px;padding:4px 10px 4px 4px;border-radius:20px;cursor:pointer;font-family:inherit}
#agenda-root .ags-p .av{width:20px;height:20px;border-radius:50%;color:#fff;font-size:9.5px;font-weight:800;display:inline-flex;align-items:center;justify-content:center;opacity:.35}
#agenda-root .ags-p.is-on .av{opacity:1}
#agenda-root .ags-p.is-on{color:#1F4A85}
#agenda-root .ags-act{border:0;background:transparent;color:#2a5ea9;font:800 12px "Nunito Sans",system-ui,sans-serif;cursor:pointer;padding:4px 6px}
#agenda-root .ags-vide{font-size:12.5px;color:#7d93b2}
#agenda-root .agl-btn{border:1.5px solid #e8eef7;background:#fff;color:#2a5ea9;font-weight:800;font-size:12.5px;padding:7px 13px;border-radius:10px;cursor:pointer;font-family:inherit;white-space:nowrap}
#agenda-root .agl-btn:hover{border-color:#2a5ea9}
#agenda-root .agl-btn.is-on{background:#2a5ea9;color:#fff;border-color:#2a5ea9}
/* Chips de filtrage des types d'événement. Le point de couleur reprend
   exactement la teinte de l'événement dans le calendrier : la légende EST
   le filtre, il n'y a pas deux codes couleur à mémoriser. */
#agenda-root #agenda-chips{display:flex;flex-wrap:wrap;gap:7px;margin:12px 0 4px}
#agenda-root .agf-chip{display:inline-flex;align-items:center;gap:6px;border:1.5px solid #e8eef7;background:#fff;color:#9bb3d1;font-weight:700;font-size:12px;padding:5px 11px;border-radius:20px;cursor:pointer;font-family:inherit;transition:all .12s}
#agenda-root .agf-chip i{width:8px;height:8px;border-radius:50%;flex-shrink:0;opacity:.35}
#agenda-root .agf-chip.is-on i{opacity:1}
#agenda-root .agf-chip:hover{border-color:#c9d9ee}
#agenda-root .agf-vide{font-size:12px;font-weight:700;color:#b45f1a;align-self:center}
#agenda-root .agf-all{border:none;background:none;color:#7a98c5;font-weight:700;font-size:11.5px;padding:5px 8px;cursor:pointer;font-family:inherit;text-decoration:underline}
#agenda-root .agf-all:hover{color:#2a5ea9}
@media(max-width:560px){#agenda-root #agenda-chips{gap:5px}#agenda-root .agf-chip{font-size:11px;padding:4px 9px}}
#agenda-root .agc-trigger{display:inline-flex;align-items:center;gap:9px;background:#fff;border:1.5px solid #e2eaf5;border-radius:10px;padding:5px 11px 5px 6px;cursor:pointer;font-family:inherit;color:#1F4A85;font-weight:700;font-size:13px;transition:border-color .15s}
#agenda-root .agc-cascade{display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end}
#agenda-root .agc-lvl{display:flex;flex-direction:column;gap:3px}
#agenda-root .agc-lvl-lbl{font-size:10px;font-weight:700;color:#9bb3d1;text-transform:uppercase;letter-spacing:.03em;padding-left:2px}
#agenda-root .agc-sel{border:1.5px solid #e2eaf5;border-radius:9px;padding:7px 10px;font-family:inherit;font-size:13px;font-weight:600;color:#1F4A85;background:#fff;cursor:pointer;min-width:118px}
#agenda-root .agc-sel:focus{outline:none;border-color:#2a5ea9}
#agenda-root .agc-loading{font-size:12px;color:#9bb3d1}
#agenda-root .agc-trigger:hover{border-color:#acc5e4}
#agenda-root .agc-ava{width:26px;height:26px;border-radius:50%;background:#2a5ea9;color:#fff;font-size:10px;font-weight:800;display:flex;align-items:center;justify-content:center}
#agenda-root .agc-name{max-width:190px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#agenda-root .agc-chev{color:#9bb3d1;font-size:10px}
#agenda-root .agc-menu{position:absolute;top:calc(100% + 6px);right:0;background:#fff;border:1.5px solid #e8eef7;border-radius:12px;box-shadow:0 10px 34px rgba(42,94,169,.16);padding:6px;z-index:1000;min-width:248px;max-height:340px;overflow-y:auto}
#agenda-root .agc-grp{font-size:9px;font-weight:800;text-transform:uppercase;letter-spacing:.06em;color:#9bb3d1;padding:9px 12px 4px}
#agenda-root .agc-opt{padding:8px 12px;border-radius:8px;font-size:13px;color:#2a5ea9;font-weight:600;cursor:pointer;white-space:nowrap}
#agenda-root .agc-opt:hover{background:#eef4fc}
#agenda-root .agc-opt.is-sel,#agenda-root .agc-opt.is-sel:hover{background:#2a5ea9;color:#fff;font-weight:800}
#agenda-root .fc{--fc-border-color:#eef2f8;--fc-page-bg-color:#fff;--fc-now-indicator-color:#e24b4a;--fc-today-bg-color:#f7f9fc;font-size:12px;
  --fc-button-bg-color:#fff;--fc-button-border-color:#e2eaf5;--fc-button-text-color:#2a5ea9;
  --fc-button-hover-bg-color:#f2f6fc;--fc-button-hover-border-color:#acc5e4;--fc-button-hover-text-color:#2a5ea9;
  --fc-button-active-bg-color:#2a5ea9;--fc-button-active-border-color:#2a5ea9;--fc-button-active-text-color:#fff}
#agenda-root .fc .fc-toolbar.fc-header-toolbar{margin-bottom:12px}
#agenda-root .fc .fc-toolbar-title{font-size:16px;font-weight:800;color:#1F4A85;letter-spacing:-.01em}
#agenda-root .fc .fc-button{font-weight:700;font-size:12px;text-transform:none;border-radius:9px;padding:6px 12px;border-width:1.5px;box-shadow:none!important;transition:background .15s,border-color .15s}
#agenda-root .fc .fc-button:focus,#agenda-root .fc .fc-button:focus-visible{box-shadow:none!important;outline:none}
#agenda-root .fc .fc-button-primary:disabled{opacity:.45}
#agenda-root .fc .fc-button-primary:not(:disabled).fc-button-active,#agenda-root .fc .fc-button-primary:not(:disabled).fc-button-active:focus,#agenda-root .fc .fc-button-primary:not(:disabled):active{background:#2a5ea9;border-color:#2a5ea9;color:#fff}
#agenda-root .fc .fc-button-group>.fc-button:first-child{border-radius:9px 0 0 9px}
#agenda-root .fc .fc-button-group>.fc-button:last-child{border-radius:0 9px 9px 0}
#agenda-root .fc .fc-button-group>.fc-button:not(:first-child):not(:last-child){border-radius:0}
#agenda-root .fc .fc-prev-button,#agenda-root .fc .fc-next-button{padding:6px 9px}
#agenda-root .fc-theme-standard .fc-scrollgrid{border-color:#eef2f8;border-radius:12px;overflow:hidden}
#agenda-root .fc-theme-standard td,#agenda-root .fc-theme-standard th{border-color:#eef2f8}
#agenda-root .fc .fc-col-header-cell{background:#fbfcfe;padding:8px 0}
#agenda-root .fc .fc-col-header-cell-cushion{font-size:11px;font-weight:700;color:#1F4A85;text-decoration:none;text-transform:capitalize}
#agenda-root .fc .fc-timegrid-axis-cushion,#agenda-root .fc .fc-timegrid-slot-label-cushion{font-size:10px;font-weight:700;color:#9bb3d1}
#agenda-root .fc .fc-timegrid-slot{height:1.7em}
#agenda-root .fc .fc-timegrid-slot-minor{border-top-style:dotted;border-top-color:#f1f5fa}
#agenda-root .fc .fc-day-today .fc-col-header-cell-cushion{color:#2a5ea9}
#agenda-root .fc .fc-event{border:none;border-radius:7px;padding:1px 7px;font-size:11px;line-height:1.3;cursor:pointer;box-shadow:none;overflow:hidden}
#agenda-root .fc .fc-event .fc-event-main{padding:1px 0}
#agenda-root .fc .fc-event .fc-event-time{font-weight:700;font-size:10px;opacity:.7}
#agenda-root .fc .fc-event .fc-event-title{font-weight:700;overflow:hidden;text-overflow:ellipsis}
#agenda-root .fc .fc-timegrid-event .fc-event-time{display:none}
#agenda-root .fc .fc-timegrid-event .fc-event-title,#agenda-root .fc .fc-timegrid-event-short .fc-event-title{font-size:10.5px;font-weight:700;line-height:1.2;white-space:normal;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden;text-overflow:clip}
#agenda-root .fc .fc-timegrid-event-short .fc-event-main,#agenda-root .fc .fc-timegrid-event .fc-event-main{font-size:10.5px}
#agenda-root .fc .fc-list-event:hover td{background:#f2f6fc}
#agenda-root .fc .fc-list-day-cushion{background:#fbfcfe}
#agenda-root .fc .fc-list-event-dot{border-radius:3px}
#agenda-tip{position:fixed;z-index:2000;pointer-events:auto;display:none;max-width:300px;user-select:text;-webkit-user-select:text;cursor:auto}
#agenda-tip a.agt-lien{color:#2a5ea9;text-decoration:none;border-bottom:1px solid transparent;cursor:pointer}
#agenda-tip a.agt-lien:hover{border-bottom-color:currentColor}
#agenda-tip .agt-tel{font-size:11px;font-weight:700;margin-top:4px;padding-left:15px}
#agenda-tip .agt-card{background:#fff;border:1.5px solid #e8eef7;border-radius:10px;box-shadow:0 8px 26px rgba(42,94,169,.16);padding:9px 12px;font-family:"Nunito Sans",system-ui,sans-serif}
#agenda-tip .agt-title{font-size:12px;font-weight:800;color:#1F4A85;line-height:1.25;display:flex;align-items:flex-start;gap:7px}
#agenda-tip .agt-dot{width:8px;height:8px;border-radius:3px;flex:0 0 auto;margin-top:3px}
#agenda-tip .agt-time{font-size:10px;font-weight:700;color:#9bb3d1;margin-top:4px;padding-left:15px}
#agenda-tip .agt-type{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.04em;color:#7a98c5;margin-top:3px;padding-left:15px}
#agenda-tip .agt-desc{font-size:11px;color:#54678a;margin-top:6px;line-height:1.35;white-space:pre-wrap;padding-left:15px}
#agenda-ov{position:fixed;inset:0;background:rgba(42,94,169,.18);z-index:3000;display:flex;align-items:center;justify-content:center;font-family:"Nunito Sans",system-ui,sans-serif}
#agenda-ov .agm{background:#fff;border-radius:16px;box-shadow:0 16px 50px rgba(42,94,169,.22);width:94%;max-width:520px;max-height:90vh;overflow:hidden;display:flex;flex-direction:column}
#agenda-ov .agm-head{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;border-bottom:1.5px solid #eef2f8}
#agenda-ov .agm-title{font-size:13px;font-weight:800;color:#1F4A85;text-transform:uppercase;letter-spacing:.04em}
#agenda-ov .agm-x{width:28px;height:28px;padding:0;border:none;background:#f2f6fc;border-radius:8px;color:#2a5ea9;font-size:18px;cursor:pointer;line-height:1;display:flex;align-items:center;justify-content:center}
#agenda-ov .agm-x:hover{background:#e6eefb}
#agenda-ov .agm-body{padding:16px 18px;overflow-y:auto;display:flex;flex-direction:column;gap:12px}
#agenda-ov .agm-seg{display:flex;border:1.5px solid #e2eaf5;border-radius:10px;overflow:hidden}
#agenda-ov .agm-seg button{flex:1;padding:9px 6px;border:none;background:#fff;color:#7a98c5;font-family:inherit;font-weight:700;font-size:12px;cursor:pointer;transition:all .12s}
#agenda-ov .agm-seg button:not(:last-child){border-right:1.5px solid #e2eaf5}
#agenda-ov .agm-seg button.on{background:#2a5ea9;color:#fff}
#agenda-ov .agm-row{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
#agenda-ov .agm-inp,#agenda-ov .agm-sel{border:1.5px solid #e2eaf5;border-radius:9px;padding:8px 11px;font-size:13px;font-family:inherit;color:#1F4A85;font-weight:600;background:#fff;outline:none}
#agenda-ov .agm-inp:focus,#agenda-ov .agm-sel:focus,#agenda-ov .agm-ta:focus{border-color:#2a5ea9}
#agenda-ov .agm-ta{width:100%;min-height:64px;resize:vertical;border:1.5px solid #e2eaf5;border-radius:9px;padding:8px 11px;font-size:13px;font-family:inherit;color:#1F4A85;font-weight:500;background:#fff;outline:none}
#agenda-ov .agm-grid2{display:grid;grid-template-columns:1fr 1fr;gap:6px 14px}
#agenda-ov .agm-radio{display:flex;align-items:center;gap:8px;font-size:12px;color:#54678a;font-weight:600;cursor:pointer;padding:5px 2px}
#agenda-ov .agm-radio input{accent-color:#2a5ea9;width:15px;height:15px}
#agenda-ov .agm-cli{position:relative}
#agenda-ov .agm-cli-menu{position:absolute;top:calc(100% + 4px);left:0;right:0;background:#fff;border:1.5px solid #e8eef7;border-radius:10px;box-shadow:0 10px 30px rgba(42,94,169,.16);max-height:200px;overflow-y:auto;z-index:10}
#agenda-ov .agm-cli-opt{padding:8px 11px;font-size:13px;color:#2a5ea9;font-weight:600;cursor:pointer}
#agenda-ov .agm-cli-opt:hover{background:#eef4fc}
#agenda-ov .agm-cli-sel{display:flex;align-items:center;justify-content:space-between;gap:10px;border:1.5px solid #e2eaf5;border-radius:9px;padding:8px 9px 8px 12px;cursor:pointer;background:#f7f9fc;transition:border-color .12s}
#agenda-ov .agm-cli-sel:hover{border-color:#acc5e4}
#agenda-ov .agm-cli-name{font-size:13px;font-weight:700;color:#1F4A85;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#agenda-ov .agm-cli-change{flex:0 0 auto;border:none;background:#2a5ea9;color:#fff;border-radius:7px;padding:5px 12px;font-size:11px;font-weight:700;font-family:inherit;cursor:pointer;text-transform:uppercase;letter-spacing:.03em}
#agenda-ov .agm-cli-change:hover{background:#24508f}
#agenda-ov .agm-cli-pick{width:100%;display:flex;align-items:center;justify-content:center;gap:8px;border:1.5px dashed #cdd9ea;background:#f7f9fc;border-radius:9px;padding:10px;color:#2a5ea9;font-family:inherit;font-size:13px;font-weight:700;cursor:pointer;transition:all .12s}
#agenda-ov .agm-cli-pick:hover{border-color:#2a5ea9;background:#eef4fc}
#agenda-ov .agm-tg{display:flex;align-items:center;gap:10px;font-size:13px;font-weight:700;color:#1F4A85;cursor:pointer;user-select:none}
#agenda-ov .agm-tg .sw{width:42px;height:24px;border-radius:999px;background:#cdd9ea;position:relative;transition:background .15s;flex:0 0 auto}
#agenda-ov .agm-tg .sw::after{content:"";position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff;transition:left .15s}
#agenda-ov .agm-tg.on .sw{background:#2a5ea9}
#agenda-ov .agm-tg.on .sw::after{left:21px}
#agenda-ov .agm-lbl{font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;color:#9bb3d1;margin-bottom:5px}
#agenda-ov .agm-err{color:#a32d2d;font-size:12px;font-weight:700}
/* ---- compte rendu de RDV ------------------------------------------------
   Le clic sur un creneau PASSE n'ouvrait rien : openEdit refusait. Il ouvre
   desormais cette fiche. A venir -> modifier, passe -> conclure. */
/* UN RENDEZ-VOUS COMMERCIAL PASSE ET JAMAIS CONCLU.
   Deux pieges du CSS de l'agenda rendaient le marquage invisible :
   .fc-event porte overflow:hidden, qui decoupait une pastille placee en
   debordement ; et sa regle est portee par « #agenda-root .fc .fc-event »,
   dont la specificite ecrase une simple classe. D'ou le selecteur complet
   ici, et une pastille posee DANS le titre plutot qu'au bord du bloc. */
#agenda-root .fc .fc-event.ag-aconclure{
  background:#fbe6bd !important;border:2px solid #d2941f !important;
  box-shadow:0 2px 6px rgba(138,93,8,.28) !important}
#agenda-root .fc .fc-event.ag-aconclure .fc-event-title,
#agenda-root .fc .fc-event.ag-aconclure .fc-event-time,
#agenda-root .fc .fc-event.ag-aconclure .fc-event-main{color:#7a5207 !important;font-weight:800 !important}
/* La pastille vit dans le flux du titre : jamais decoupee, jamais dependante
   de la largeur du creneau. */
#agenda-root .fc .ag-det{font-size:10.5px;font-weight:500;opacity:.85;line-height:1.25;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
#agenda-root .fc .ag-det.ag-com{font-style:italic;font-weight:400}
#agenda-root .fc .fc-timegrid-event-short .ag-det{display:none}
#agenda-root .fc .ag-aconclure-mk{display:inline-block;margin-right:4px;
  width:13px;height:13px;border-radius:50%;background:#d2941f;color:#fff;
  font:800 10px/13px system-ui,sans-serif;text-align:center;vertical-align:-1px;
  flex:0 0 auto}
#agenda-root .fc .ag-aconclure-note{display:inline-block;margin-left:5px;padding:0 5px;
  border-radius:7px;background:#d2941f;color:#fff;
  font:800 9px/15px system-ui,sans-serif;letter-spacing:.04em;text-transform:uppercase;
  vertical-align:1px}
#agenda-ov .agm-cr-head{display:flex;gap:11px;align-items:flex-start}
#agenda-ov .agm-cr-when{font-size:12px;font-weight:800;color:#2a5ea9;white-space:nowrap;background:#f7f9fc;border:1.5px solid #e2eaf5;border-radius:8px;padding:7px 10px;text-align:center;line-height:1.3}
#agenda-ov .agm-cr-when small{display:block;font-size:9.5px;color:#9bb3d1;text-transform:uppercase;letter-spacing:.04em;font-weight:700}
#agenda-ov .agm-cr-who{min-width:0;padding-top:2px}
#agenda-ov .agm-cr-who b{display:block;font-size:15px;font-weight:800;color:#1F4A85;line-height:1.3}
#agenda-ov .agm-cr-who span{display:block;font-size:11.5px;color:#7a98c5;font-weight:600;margin-top:2px}
/* La carte d'appel reprend EXACTEMENT le rendu de la fiche client
   (contacts.js v6) : memes teintes, meme lecteur, meme badge de tonalite. Le
   vendeur ne doit pas avoir a reconnaitre deux presentations d'un meme appel. */
#agenda-ov .ct-call{background:#F0F9FF;border:1px solid rgba(96,174,223,.25);border-radius:12px;padding:11px 13px;display:flex;gap:11px;align-items:flex-start}
#agenda-ov .ct-ar{flex-shrink:0;width:30px;height:30px;border-radius:50%;border:1.5px solid #60AEDF;display:flex;align-items:center;justify-content:center;background:#fff}
#agenda-ov .ct-mid{min-width:0;flex:1}
#agenda-ov .ct-top{display:flex;align-items:flex-start;gap:10px}
#agenda-ov .ct-who{font-size:13px;font-weight:700;color:#1F4A85;display:flex;align-items:center;gap:6px;min-width:0}
#agenda-ov .ct-meta{margin-left:auto;display:flex;flex-direction:column;align-items:flex-end;gap:4px}
#agenda-ov .ct-date{font-size:11px;color:#9ca3af;white-space:nowrap;text-align:right;line-height:1.4}
#agenda-ov .ct-ton{font-size:11px;color:#60AEDF;background:rgba(96,174,223,.1);border:1px solid rgba(96,174,223,.3);border-radius:999px;padding:1px 8px;white-space:nowrap}
#agenda-ov .ct-pill{display:inline-flex;align-items:center;gap:8px;background:#60AEDF1f;border-radius:999px;padding:5px 14px;margin-top:7px;max-width:100%;box-sizing:border-box}
#agenda-ov .ct-pill button{background:none;border:none;cursor:pointer;padding:0;width:16px;height:16px;display:flex;align-items:center;justify-content:center;flex-shrink:0}
#agenda-ov .ct-pill .t{font-size:12px;color:#60AEDF;min-width:28px;font-variant-numeric:tabular-nums}
#agenda-ov .ct-bar{flex:1 1 60px;min-width:40px;max-width:130px;height:3px;background:#60AEDF4d;border-radius:2px;cursor:pointer;position:relative}
#agenda-ov .ct-bar i{display:block;height:100%;width:0%;background:#60AEDF;border-radius:2px;pointer-events:none;transition:width .1s linear}
#agenda-ov .ct-txt{font-size:13px;color:#4b5563;line-height:1.6;margin-top:7px}
#agenda-ov .ct-txt .tg{background:none;border:none;cursor:pointer;padding:0 2px;font-size:12px;color:#9ca3af;font-family:inherit}
#agenda-ov .ct-full{display:none;margin-top:8px;padding:12px;background:#f8fbff;border-radius:8px;border:1px solid rgba(96,174,223,.2);font-size:13px;color:#374151;line-height:1.5;white-space:pre-wrap}
/* L'echelle : une ligne, du signe au perdu. Chaque degre porte sa cadence —
   le vendeur ne choisit pas une date, il dit ou en est son client. */
#agenda-ov .agm-ech{display:grid;gap:6px;grid-template-columns:repeat(3,1fr)}
#agenda-ov .agm-ech.quatre{grid-template-columns:repeat(2,1fr)}
#agenda-ov .agm-ech button{border:1.5px solid #e2eaf5;background:#fff;border-radius:10px;padding:9px 8px;font-family:inherit;cursor:pointer;text-align:left;transition:all .12s}
#agenda-ov .agm-ech button:hover{border-color:#acc5e4}
#agenda-ov .agm-ech b{display:flex;align-items:center;gap:6px;font-size:13px;font-weight:800;color:#1F4A85}
#agenda-ov .agm-ech i{width:9px;height:9px;border-radius:3px;flex:0 0 auto;display:inline-block}
#agenda-ov .agm-ech small{display:block;font-size:10.5px;color:#9bb3d1;font-weight:700;margin-top:3px;padding-left:15px}
#agenda-ov .agm-ech button.on{border-color:#2a5ea9;background:#eef4fc;box-shadow:inset 0 0 0 1px #2a5ea9}
#agenda-ov .agm-ech button.on small{color:#2a5ea9}
#agenda-ov .agm-quand{display:flex;gap:6px;flex-wrap:wrap;align-items:center}
#agenda-ov .agm-quand button{border:1.5px solid #e2eaf5;background:#fff;color:#2a5ea9;border-radius:8px;padding:7px 12px;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer}
#agenda-ov .agm-quand button.on{background:#2a5ea9;border-color:#2a5ea9;color:#fff}
#agenda-ov .agm-note{font-size:11.5px;color:#7a98c5;line-height:1.5;font-weight:600}
#agenda-ov .agm-note b{color:#2a5ea9;font-weight:800}
#agenda-ov .agm-avis{font-size:11.5px;color:#8a6d1f;background:#fdf3de;border:1.5px solid #f0d9a0;border-radius:9px;padding:9px 11px;font-weight:600;line-height:1.45}
#agenda-ov .agm-deplace{font-size:11.5px;color:#9bb3d1;font-weight:600;text-align:center}
#agenda-ov .agm-deplace button{background:none;border:none;color:#2a5ea9;font-family:inherit;font-size:11.5px;font-weight:700;text-decoration:underline;cursor:pointer;padding:0}
#agenda-ov .agm-done{display:flex;gap:10px;align-items:flex-start;background:#e4f4f0;border:1.5px solid #9ed8c9;border-radius:11px;padding:11px 13px;font-size:13px;color:#0b6b57;font-weight:700;line-height:1.4}
#agenda-ov .agm-foot{padding:14px 18px;border-top:1.5px solid #eef2f8}
#agenda-ov #agm-bacs-info{margin:0;padding:8px 18px;border-top:1.5px solid #f3d9a4;background:#fff6e6;color:#8a5d08;font-size:12px;font-weight:700;line-height:1.4}
#agenda-ov .agm.agm-saisie{max-width:720px}
#agenda-ov .agm-nat{display:flex;flex-wrap:wrap;gap:6px}
#agenda-ov .agm-nat button{display:inline-flex;align-items:center;gap:6px;border:1.5px solid #e2eaf5;background:#fff;color:#1F4A85;font:700 12px "Nunito Sans",system-ui,sans-serif;padding:6px 11px;border-radius:999px;cursor:pointer;transition:border-color .12s,background .12s}
#agenda-ov .agm-nat button:hover{border-color:var(--c,#2a5ea9)}
#agenda-ov .agm-nat button i{width:8px;height:8px;border-radius:50%;flex:0 0 auto}
#agenda-ov .agm-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px 16px;align-items:start}
#agenda-ov .agm-cell{min-width:0}
#agenda-ov .agm-w{width:100%}
#agenda-ov .agm-quand{flex-wrap:nowrap}
#agenda-ov .agm-quand #agm-date{flex:1;min-width:0}
#agenda-ov .agm-quand #agm-time{width:116px;flex:0 0 auto}
#agenda-ov .agm-quand #agm-dur{flex:0 0 auto}
#agenda-ov .agm-pf{display:inline-flex;border:1.5px solid #e2eaf5;border-radius:9px;overflow:hidden;flex:0 0 auto}
#agenda-ov .agm-pf button{border:0;background:#fff;color:#7a98c5;font:700 12px "Nunito Sans",system-ui,sans-serif;padding:8px 11px;cursor:pointer}
#agenda-ov .agm-pf button.on{background:#2a5ea9;color:#fff}
#agenda-ov .agm-saisie .agm-ta{min-height:52px;max-height:260px;box-sizing:border-box;display:block;resize:vertical;overflow-y:auto}
#agenda-ov .agm-saisie .agm-inp,#agenda-ov .agm-saisie .agm-sel{box-sizing:border-box}
@media(max-width:640px){#agenda-ov .agm-grid{grid-template-columns:1fr}#agenda-ov .agm.agm-saisie{width:100%;max-width:none;max-height:100%;height:100%;border-radius:0}#agenda-ov .agm-quand{flex-wrap:wrap}}
#agenda-root .fc .ag-bacs-att{display:inline-block;margin-right:4px;padding:0 4px;border-radius:4px;background:#fac055;color:#5a3d05;font:800 9px/13px "Nunito Sans",system-ui,sans-serif;letter-spacing:.02em;vertical-align:0}
#agenda-ov .agm-save{width:100%;border:none;border-radius:10px;padding:12px;background:#53bda7;color:#fff;font-family:inherit;font-weight:800;font-size:14px;cursor:pointer;transition:background .15s}
#agenda-ov .agm-save:hover{background:#46a892}
#agenda-ov .agm-save:disabled{opacity:.55;cursor:default}
#agenda-ov .agm-foot-edit{display:flex;gap:10px}
#agenda-ov .agm-foot-col{display:flex;flex-direction:column;gap:8px}
#agenda-ov .agm-foot-row{display:flex;gap:10px}
#agenda-ov .agm-foot-row .agm-save{flex:1}
#agenda-ov .agm-now{width:100%;border:1.5px solid #2a5ea9;border-radius:10px;padding:11px;background:#fff;color:#1F4A85;font-family:inherit;font-weight:800;font-size:13.5px;cursor:pointer;transition:background .15s}
#agenda-ov .agm-now:hover{background:#eef4fc}
#agenda-ov .agm-now:disabled{opacity:.55;cursor:default}
#agenda-ov .agm-hint{font-size:11px;color:#7a98c5;font-weight:600;margin-top:6px;line-height:1.4}
#agenda-ov .agm-rep{margin-top:10px}
#agenda-ov .agm-rj{display:flex;flex-wrap:wrap;gap:6px;margin-top:8px}
#agenda-ov .agm-rj button{min-width:34px;height:34px;border:1.5px solid #e2eaf5;background:#fff;color:#7a98c5;border-radius:9px;font:800 12.5px "Nunito Sans",system-ui,sans-serif;cursor:pointer;padding:0 8px}
#agenda-ov .agm-rj button.on{background:#2a5ea9;border-color:#2a5ea9;color:#fff}
#agenda-ov .agm-rj button.agm-rj-t{color:#2a5ea9}
#agenda-ov .agm-rep-l{margin-top:8px;gap:12px;flex-wrap:wrap;font-size:12.5px;font-weight:700;color:#5f7aa3}
#agenda-ov .agm-rep-l label{display:inline-flex;align-items:center;gap:6px}
#agenda-ov .agm-rep .agm-hint b{color:#1F4A85}
#agenda-ov .agm-grp-list{display:flex;flex-direction:column;gap:6px}
#agenda-ov .agm-grp-it{display:flex;align-items:center;gap:10px;width:100%;text-align:left;border:1.5px solid #e2eaf5;background:#fff;border-radius:10px;padding:9px 12px;font-family:inherit;font-size:13px;font-weight:700;color:#1F4A85;cursor:pointer}
#agenda-ov .agm-grp-it:hover{border-color:#acc5e4;background:#f7f9fc}
#agenda-ov .agm-grp-it i{width:8px;height:8px;border-radius:3px;flex:0 0 auto}
#agenda-ov .agm-grp-it span{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#agenda-ov .agm-grp-it b{color:#9bb3d1;font-size:16px}
#agenda-root .fc .fc-event.ag-tmp{opacity:.75;outline:1.5px dashed #2a5ea9;outline-offset:-1.5px}
#agenda-ov .agm-foot-edit .agm-save{flex:1}
#agenda-ov .agm-del{border:1.5px solid #f0b6b6;border-radius:10px;padding:12px 16px;background:#fff;color:#c0392b;font-family:inherit;font-weight:800;font-size:14px;cursor:pointer;transition:all .15s}
#agenda-ov .agm-del:hover{background:#fcebeb}
#agenda-ov .agm-del:disabled{opacity:.55;cursor:default}
#agenda-ov .agm-inv{display:flex;flex-wrap:wrap;gap:6px;align-items:center}
#agenda-ov .agm-inv-chip{display:inline-flex;align-items:center;gap:6px;background:#eef4fc;color:#1F4A85;border:1px solid #d4e2f4;border-radius:999px;padding:4px 6px 4px 11px;font-size:12px;font-weight:700}
#agenda-ov .agm-inv-chip button{border:none;background:#d4e2f4;color:#1F4A85;width:18px;height:18px;border-radius:50%;font-size:12px;line-height:18px;padding:0;cursor:pointer;font-family:inherit}
#agenda-ov .agm-inv-chip button:hover{background:#2a5ea9;color:#fff}
#agenda-ov .agm-inv-chip.nb{background:#fdf6e6;border-color:#f3dfb0}
#agenda-ov .agm-sync{display:flex;align-items:center;gap:8px;font-size:12px;font-weight:700;color:#1F4A85;background:#f7f9fc;border:1px solid #e2eaf5;border-radius:9px;padding:8px 10px}
#agenda-ov .agm-sync .pt{width:9px;height:9px;border-radius:50%;flex:0 0 auto;background:#acc5e4}
#agenda-ov .agm-sync.ok .pt{background:#53bda7}
#agenda-ov .agm-sync.att .pt{background:#e6a817}
#agenda-ov .agm-sync.ko{color:#a32d2d;background:#fdf1f1;border-color:#f2c4c4}
#agenda-ov .agm-sync.ko .pt{background:#e24b4a}
#agenda-ov .agm-cli-ro{padding:10px 12px;border:1.5px solid #e2eaf5;border-radius:10px;background:#f7f9fc;color:#1F4A85;font-weight:700;font-size:13px}
#agenda-ov .agm-conf{gap:8px;flex-wrap:wrap}
#agenda-ov .agm-conf-b{flex:1;min-width:150px;display:inline-flex;align-items:center;justify-content:center;gap:7px;border:1.5px solid #e2eaf5;background:#fff;color:#2a5ea9;border-radius:9px;padding:9px 10px;font-family:inherit;font-size:13px;font-weight:700;cursor:pointer;transition:all .12s}
#agenda-ov .agm-conf-b:hover{border-color:#2a5ea9;background:#eef4fc}
#agenda-ov .agm-conf-b.sms{color:#e6a817;border-color:#f0dca6}
#agenda-ov .agm-conf-b.sms:hover{background:#fdf7e8;border-color:#f0dca6}
#agenda-ov .agm-conf-b.mail{color:#1F4A85;border-color:#d7dfe9}
#agenda-ov .agm-conf-b.mail:hover{background:#f2f5f9;border-color:#d7dfe9}
#agenda-ov .agm-conf-b[disabled]{opacity:.55;cursor:default}
#agenda-ov .agm-confirm{display:flex;align-items:center;gap:10px;flex-wrap:wrap}
#agenda-ov .agm-confirm-txt{flex:1;min-width:140px;color:#a32d2d;font-weight:800;font-size:13px}
#agenda-ov .agm-cancel{border:1.5px solid #e2eaf5;border-radius:10px;padding:11px 16px;background:#fff;color:#5f5e5a;font-family:inherit;font-weight:700;font-size:13px;cursor:pointer}
#agenda-ov .agm-cancel:hover{background:#f4f6fa}
#agenda-ov .agm-confirm .agm-del{background:#e24b4a;color:#fff;border:none}
#agenda-ov .agm-confirm .agm-del:hover{background:#cf3d3c}
#agenda-err-ov{position:fixed;inset:0;z-index:3500;background:rgba(20,33,61,.28);display:flex;align-items:center;justify-content:center;padding:18px;font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,sans-serif}
#agenda-err-ov .agm-err-card{background:#fff;border-radius:13px;box-shadow:0 12px 34px rgba(20,33,61,.22);width:286px;max-width:90vw;padding:18px 18px 16px;text-align:center}
#agenda-err-ov .agm-err-ic{width:38px;height:38px;border-radius:50%;margin:0 auto 9px;display:flex;align-items:center;justify-content:center;background:#fdeceb;color:#e24b4a}
#agenda-err-ov .agm-err-ic svg{width:20px;height:20px}
#agenda-err-ov .agm-err-h{font-size:14.5px;font-weight:800;color:#14213d;margin-bottom:4px;line-height:1.3}
#agenda-err-ov .agm-err-m{font-size:12px;line-height:1.45;color:#7b7a76;margin-bottom:14px}
#agenda-err-ov .agm-err-ok{width:100%;border:none;border-radius:9px;padding:9px 14px;background:#1F4A85;color:#fff;font-family:inherit;font-weight:700;font-size:12.5px;cursor:pointer;transition:background .15s}
#agenda-err-ov .agm-err-ok:hover{background:#163864}
/* ---- Responsive (02/10/2026) -------------------------------------------
   La barre FullCalendar est une rangée flex à trois blocs qui ne passe
   jamais à la ligne : sur téléphone, le titre (centre) était écrasé jusqu'à
   un mot par ligne et poussait les boutons hors de la carte. En dessous de
   640 px : le titre prend toute la première ligne, navigation et vues se
   partagent la seconde, et la barre peut encore passer à la ligne si l'écran
   est vraiment étroit. La vue Semaine (6 colonnes illisibles) est remplacée
   par une vue 3 jours côté JS. */
#agenda-root .agenda-top{flex-wrap:wrap}
@media(max-width:640px){
  #agenda-root .agenda-card{padding:12px 10px;border-radius:12px}
  #agenda-root .agenda-top{margin-bottom:8px;gap:8px}
  #agenda-root #agenda-vues{margin:0;width:100%;justify-content:space-between}
  #agenda-root .agv-seg button{padding:7px 10px;font-size:12px}
  #agenda-root .agl-btn{padding:7px 10px;font-size:12px}
  #agenda-root .ags-bar{flex-wrap:nowrap;overflow-x:auto;padding-bottom:4px;-webkit-overflow-scrolling:touch}
  #agenda-root .ags-bar>*{flex-shrink:0}
  #agenda-root .agc-name{max-width:140px}
  #agenda-root .agc-menu{max-width:calc(100vw - 32px);min-width:220px}
  #agenda-root .agc-cascade{width:100%}
  #agenda-root .agc-sel{min-width:0;flex:1 1 120px}
  #agenda-root .fc .fc-toolbar.fc-header-toolbar{flex-wrap:wrap;gap:8px;margin-bottom:10px}
  #agenda-root .fc .fc-toolbar-chunk{display:flex;align-items:center;gap:6px;flex-wrap:nowrap}
  #agenda-root .fc .fc-toolbar-chunk:nth-child(2){order:-1;flex:1 0 100%}
  #agenda-root .fc .fc-toolbar-title{font-size:15px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
  #agenda-root .fc .fc-toolbar-chunk .fc-button-group,#agenda-root .fc .fc-toolbar-chunk>.fc-button{margin-left:0!important}
  #agenda-root .fc .fc-button{font-size:11.5px;padding:6px 9px}
  #agenda-root .fc .fc-prev-button,#agenda-root .fc .fc-next-button{padding:6px 8px}
  /* « Aujourd'hui » raccourci en CSS et non via buttonText : FullCalendar lit le
     libellé de ce bouton dans les options du CONSTRUCTEUR, un setOption à la
     rotation ne le change jamais. Le bouton natif garde son état grisé. */
  #agenda-root .fc .fc-today-button{font-size:0!important}
  #agenda-root .fc .fc-today-button::after{content:'Auj.';font-size:11.5px}
  #agenda-root .fc .fc-col-header-cell{padding:6px 0}
  #agenda-root .fc .fc-col-header-cell-cushion{font-size:10.5px;padding:2px 1px}
  #agenda-root .fc .fc-timegrid-slot-label-cushion{font-size:9.5px;padding:0 3px}
  #agenda-root .fc .fc-timegrid-slot{height:2em}
  #agenda-root .fc .fc-timegrid-event .fc-event-title{font-size:10px}
  #agenda-root .fc .fc-list-event-title,#agenda-root .fc .fc-list-event-time{font-size:12px}
  #agenda-root .fc .fc-daygrid-day-number{font-size:11px;padding:3px}
  #agenda-root .fc .fc-daygrid-event{font-size:10px}
}
@media(max-width:360px){
  #agenda-root .fc .fc-button{font-size:11px;padding:5px 7px}
  #agenda-root .fc .fc-today-button::after{font-size:11px}
  #agenda-root .fc .fc-toolbar-chunk{flex-wrap:wrap}
}
`;
    (d.head || d.documentElement).appendChild(st);
  }

  // --- tooltip au survol -----------------------------------------------------
  let tipEl = null;
  function ensureTip() { const d = frontDoc(); if (tipEl && tipEl.isConnected) return tipEl; tipEl = d.createElement('div'); tipEl.id = 'agenda-tip'; (d.body || d.documentElement).appendChild(tipEl); return tipEl; }
  function hhmm(x) { return x ? String(x.getUTCHours()).padStart(2, '0') + ':' + String(x.getUTCMinutes()).padStart(2, '0') : ''; }
  function hhmmStr(s) { return (typeof s === 'string' && s.length >= 16) ? s.slice(11, 16) : ''; }
  let tipTimer = null, tipCle = null, tipIntention = null;
  const telCache = {};
  function annulerMasquage() { if (tipTimer) { clearTimeout(tipTimer); tipTimer = null; } }
  function masquerBientot(ms) { annulerMasquage(); tipTimer = setTimeout(() => { tipTimer = null; hideTip(); }, ms || 300); }
  function lienTel(tel) {
    const t = String(tel || '').trim(); if (!t) return '';
    return '<div class="agt-tel">📞 <a class="agt-lien" href="tel:' + esc(t.replace(/[^0-9+]/g, '')) + '" data-agt-tel="' + esc(t) + '" title="Appeler">' + esc(t) + '</a></div>';
  }
  // Appel depuis un numéro affiché : par le 3CX du vendeur (OD3CX, module
  // phone3cx) quand il est là ; sinon le lien tel: classique.
  function appelerNumero(num, nom, idvu) {
    let to = String(num || '').replace(/[^0-9+]/g, '');
    if (!to) return false;
    if (to[0] === '0') to = '+33' + to.slice(1);
    const cands = [];
    try { cands.push(wwLib.getFrontWindow && wwLib.getFrontWindow()); } catch (e) {}
    cands.push(window);
    try { cands.push(window.parent); } catch (e) {}
    try { cands.push(window.top); } catch (e) {}
    for (const w of cands) {
      try {
        if (w && w.OD3CX && typeof w.OD3CX.appeler === 'function') {
          w.OD3CX.appeler(to, { nom: nom || num, idvu: Number(idvu) > 0 ? Number(idvu) : null });
          return true;
        }
      } catch (e) {}
    }
    return false;
  }

  function showTip(el, ev) {
    annulerMasquage();
    const t = ensureTip(); const p = ev.extendedProps || {};
    if (!t.__agtLie) {
      t.__agtLie = true;
      t.addEventListener('mouseenter', () => { annulerMasquage(); if (tipIntention) { clearTimeout(tipIntention); tipIntention = null; } });
      t.addEventListener('mouseleave', () => masquerBientot(200));
      t.addEventListener('click', (e) => {
        const a = e.target.closest('[data-agt-client]');
        if (a) { e.preventDefault(); const id = a.getAttribute('data-agt-client'); hideTip(); ouvrirFicheClient(id); return; }
        const tl = e.target.closest('a[data-agt-tel]');
        if (tl) {
          const nomCli = (t.querySelector('[data-agt-client]') || {}).textContent || '';
          const idCli = (t.querySelector('[data-agt-client]') || { getAttribute: () => null }).getAttribute('data-agt-client');
          if (appelerNumero(tl.getAttribute('data-agt-tel'), nomCli, idCli)) e.preventDefault();
          setTimeout(hideTip, 50);
        }
      });
    }
    const cn = clientName(p); const main = cn || ev.title || '';
    const idCli = Number(p.id_client) > 0 ? Number(p.id_client) : null;
    const sub = typeLabel(p);
    const startTxt = hhmmStr(ev.startStr) || hhmm(ev.start);
    const endTxt = ev.endStr ? hhmmStr(ev.endStr) : (ev.end ? hhmm(ev.end) : '');
    const range = startTxt + (endTxt ? ' – ' + endTxt : '');
    const desc = p.description || p.commentaire || p.Commentaire || '';
    const accent = p._accent || '#2a5ea9';
    const xx = p.extra || {};
    const qui = (p.source_type === 'rdv' && xx.proprietaire) ? ('Agenda de ' + xx.proprietaire) : '';
    const pose = xx.pose_par ? ('Posé par ' + xx.pose_par) : '';
    const titre = (idCli && cn) ? '<a class="agt-lien" data-agt-client="' + idCli + '" title="Ouvrir la fiche client">' + esc(main) + '</a>' : esc(main);
    const tel = xx.tel || (idCli ? telCache[idCli] : '') || '';
    tipCle = ev.id || (ev.startStr + '|' + main);
    t.innerHTML = '<div class="agt-card"><div class="agt-title"><span class="agt-dot" style="background:' + accent + '"></span><span>' + titre + '</span></div>'
      + (sub ? '<div class="agt-type">' + esc(sub) + (cn ? '' : ' · sans client') + '</div>' : '')
      + (qui || pose ? '<div class="agt-type">' + esc([qui, pose].filter(Boolean).join(' · ')) + '</div>' : '')
      + (xx.vehicule ? '<div class="agt-type">🚗 ' + esc(xx.vehicule) + '</div>' : '')
      + (xx.vin || xx.immat ? '<div class="agt-type">' + esc([xx.immat, xx.vin ? 'VIN ' + xx.vin : ''].filter(Boolean).join(' · ')) + '</div>' : '')
      + '<div data-agt-tel>' + lienTel(tel) + '</div>'
      + '<div class="agt-time">' + esc(range) + '</div>'
      + '<div class="agt-desc">' + (desc ? esc(desc) : '<i>Pas de commentaire</i>') + '</div></div>';
    t.style.display = 'block';
    const r = el.getBoundingClientRect(); const tr = t.getBoundingClientRect();
    const vw = frontWin().innerWidth || window.innerWidth;
    let top = r.top - tr.height - 4; if (top < 6) top = r.bottom + 4;
    let left = r.left; if (left + tr.width > vw - 8) left = vw - 8 - tr.width; if (left < 6) left = 6;
    t.style.top = top + 'px'; t.style.left = left + 'px';
    // Pas de téléphone sur le rendez-vous : portable (ou fixe) de la fiche client.
    if (!tel && idCli && telCache[idCli] === undefined) {
      const cle = tipCle; telCache[idCli] = '';
      Promise.resolve(sb().from('CLIENT').select('TEl_MOB, TEL_FIXE').eq('IDVu', idCli).maybeSingle()).then((r2) => {
        const d = (r2 && r2.data) || {};
        telCache[idCli] = String(d.TEl_MOB || d.TEL_FIXE || '').trim();
        if (telCache[idCli] && tipCle === cle && t.style.display === 'block') {
          const z = t.querySelector('[data-agt-tel]'); if (z) z.innerHTML = lienTel(telCache[idCli]);
        }
      }).catch(() => {});
    }
  }
  function hideTip() { annulerMasquage(); if (tipEl) tipEl.style.display = 'none'; }
  // Fiche client : variable « client sélectionné » lue par toute la fiche, puis
  // navigation vers la page (même chemin que lead-mgmt et le tableau de bord).
  function ouvrirFicheClient(id) {
    const n = Number(id); if (!(n > 0)) return;
    let FW = frontWin(); try { FW = (wwLib.getFrontWindow && wwLib.getFrontWindow()) || FW; } catch (e) {}
    try { wwLib.wwVariable.updateValue(CFG.selectedClientVar, { IDVu: n }); } catch (e) {}
    try { FW.__odFicheTab = 0; } catch (e) {}
    let editeur = false;
    try { editeur = window.self !== window.top; } catch (e) { editeur = true; }
    if (editeur) { try { wwLib.wwApp.goTo('259f1951-a2d4-4b90-ac83-0b3febe1d4ec'); return; } catch (e) {} }
    try { wwLib.goTo('/fr/fiche-client'); return; } catch (e) {}
    try { FW.location.href = '/fr/fiche-client?idvu=' + n; } catch (e) {}
  }
  // L'infobulle vit dans le body : si l'agenda disparaît pendant qu'elle est
  // affichée (navigation vers la fiche de bilatérale), mouseleave ne vient
  // jamais et elle restait figée par-dessus la page suivante (14/10/2026).
  // On la masque à chaque clic, défilement ou changement de page, et on la
  // retire dès que l'agenda n'est plus dans le document.
  if (!window.__agendaTipGuard) {
    window.__agendaTipGuard = true;
    const masquer = (e) => { try { const t = frontDoc().getElementById('agenda-tip'); if (!t) return; if (e && e.type === 'mousedown' && e.target && t.contains(e.target)) return; t.style.display = 'none'; } catch (x) {} };
    try {
      const W = frontWin();
      ['mousedown', 'scroll', 'popstate', 'pagehide', 'blur'].forEach(ev => W.addEventListener(ev, masquer, true));
      setInterval(() => { try { const r = frontDoc().getElementById('agenda-root'); if (!r || !r.offsetParent) { const t = frontDoc().getElementById('agenda-tip'); if (t) t.remove(); } } catch (e) {} }, 500);
    } catch (e) {}
  }

  // --- init FullCalendar ------------------------------------------------------
  let calendar = null;
  let showSunday = false;                              // dimanche masqué par défaut
  const refetch = () => { try { calendar && calendar.refetchEvents(); } catch (e) {} };
  // Événements PROVISOIRES : posés à l'enregistrement pour que l'utilisateur
  // voie son rendez-vous tout de suite, retirés dès que la vraie liste arrive.
  // Sans eux, la fenêtre se fermait sur un agenda inchangé le temps du
  // rechargement, et l'on croyait l'enregistrement perdu (recette 13/10/2026).
  function poserProvisoire(o) {
    try {
      if (!calendar) return;
      const c = CFG.colors[o.famille] || CFG.colors.creneau;
      calendar.addEvent({
        id: 'tmp-' + Date.now(), title: o.titre, start: o.start.replace(' ', 'T'), end: o.end.replace(' ', 'T'),
        backgroundColor: tint(c, 0.14), borderColor: tint(c, 0.14), textColor: '#1F4A85', editable: false,
        classNames: ['ag-tmp'], extendedProps: { _accent: c, _provisoire: true, source_type: 'tmp' }
      });
    } catch (e) {}
  }
  function retirerProvisoires() {
    try { if (calendar) calendar.getEvents().forEach(ev => { if (ev.extendedProps && ev.extendedProps._provisoire) ev.remove(); }); } catch (e) {}
  }
  // Rechargement après écriture : immédiat, puis une seconde passe, pour
  // couvrir un premier chargement déjà en vol au moment de l'enregistrement.
  function refetchApresEcriture() {
    refetch();
    setTimeout(refetch, 1200);
  }
  function updateSundayBtn() { try { const b = document.querySelector('#agenda-root .fc-dimanche-button'); if (b) b.classList.toggle('fc-button-active', showSunday); } catch (e) {} }

  // --- responsive -------------------------------------------------------------
  // Deux jeux d'options selon la largeur. Sur téléphone, la vue Semaine
  // (6 colonnes de 50 px) est remplacée par une vue 3 jours, le bouton
  // Dimanche disparaît (il ne sert qu'en semaine) et les libellés raccourcissent.
  // La bascule suit la rotation et le redimensionnement (matchMedia), sans
  // recharger les événements.
  const MOBILE_MQ = '(max-width: 640px)';
  let mqList = null;
  function isMobile() {
    try { if (!mqList) mqList = frontWin().matchMedia(MOBILE_MQ); return mqList.matches; }
    catch (e) { return (frontWin().innerWidth || window.innerWidth) <= 640; }
  }
  function isTouch() { try { return frontWin().matchMedia('(hover: none)').matches; } catch (e) { return false; } }
  function layoutOptions(m) {
    return m ? {
      headerToolbar: { left: 'prev,next today', center: 'title', right: 'timeGridDay,timeGrid3,listWeek,dayGridMonth' },
    } : {
      headerToolbar: { left: 'prev,next today dimanche', center: 'title', right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek' },
    };
  }
  let lastMobile = null;
  function applyLayout() {
    if (!calendar) return;
    const m = isMobile();
    if (m === lastMobile) return;
    lastMobile = m;
    const o = layoutOptions(m);
    calendar.batchRendering(() => {
      Object.keys(o).forEach(k => calendar.setOption(k, o[k]));
      const v = calendar.view && calendar.view.type;
      if (m && v === 'timeGridWeek') calendar.changeView(vueSite() ? 'timeGridDay' : 'timeGrid3');
      else if (!m && v === 'timeGrid3') calendar.changeView('timeGridWeek');
    });
    updateSundayBtn();
  }
  function wireLayout() {
    if (window.__agendaMq) { try { window.__agendaMq.mq.removeEventListener('change', window.__agendaMq.fn); } catch (e) {} }
    try {
      isMobile();
      const fn = () => applyLayout();
      if (mqList.addEventListener) mqList.addEventListener('change', fn); else mqList.addListener(fn);
      window.__agendaMq = { mq: mqList, fn: fn };
    } catch (e) {}
  }

  function init() {
    const root = __anchor;
    if (!root) { console.warn('[agenda] #' + CFG.rootId + ' absent'); return; }
    if (!window.FullCalendar) { console.error('[agenda] FullCalendar non chargé'); return; }
    injectCss();
    root.innerHTML = '<div class="agenda-card"><div class="agenda-top"><span class="agenda-title">Agenda</span><div id="agenda-vues"></div><div id="agenda-collab" style="display:none"></div></div><div id="agenda-site" style="display:none"></div><div id="agenda-chips"></div><div id="agenda-fc"></div></div>';
    const mount = root.querySelector('#agenda-fc');

    const mobile0 = isMobile();
    const lay0 = layoutOptions(mobile0);
    lastMobile = mobile0;
    const touch = isTouch();
    calendar = new window.FullCalendar.Calendar(mount, {
      timeZone: CFG.timeZone, locale: 'fr', initialView: mobile0 ? (vueSite() ? 'timeGridDay' : 'timeGrid3') : CFG.initialView, height: 'auto', firstDay: 1,
      // v34 : agenda du site — les événements simultanés se rangent côte à côte.
      slotEventOverlap: !vueSite(),
      allDaySlot: vueSite(), allDayText: 'Journée',
      nowIndicator: true, allDaySlot: false, slotMinTime: '07:00:00', slotMaxTime: '20:00:00',
      slotDuration: '00:30:00', slotLabelInterval: '01:00', expandRows: true,
      hiddenDays: showSunday ? [] : [0],                // 0 = dimanche
      // dayCount (et non duration) : toujours 3 colonnes visibles, le dimanche
      // masqué est sauté au lieu de laisser une vue à 2 jours.
      views: {
        // Formats d'en-tête PAR VUE : un dayHeaderFormat global s'appliquait
        // aussi au mois, qui affichait la date de la 1re semaine sous chaque
        // jour (« lun. 28/09 » sur toute la colonne).
        timeGridWeek: { dayHeaderFormat: { weekday: 'short', day: '2-digit', month: '2-digit', omitCommas: true } },
        timeGrid3: { type: 'timeGrid', dayCount: 3, buttonText: '3 j', dayHeaderFormat: { weekday: 'short', day: 'numeric', omitCommas: true } },
        dayGridMonth: { dayHeaderFormat: { weekday: 'short' } },
        timeGridDay: { titleFormat: { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' } },
      },
      customButtons: { dimanche: { text: 'Dimanche', click: function () { showSunday = !showSunday; calendar.setOption('hiddenDays', showSunday ? [] : [0]); updateSundayBtn(); } } },
      headerToolbar: lay0.headerToolbar,
      buttonText: { today: "Aujourd'hui", month: 'Mois', week: 'Semaine', day: 'Jour', list: 'Liste' },
      slotLabelFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
      eventTimeFormat: { hour: '2-digit', minute: '2-digit', hour12: false },
      editable: true, selectable: true, selectMirror: true, unselectAuto: false,
      eventStartEditable: true, eventDurationEditable: true,
      // Au doigt : appui long de 1 s par défaut, beaucoup trop lent pour créer
      // un RDV ou déplacer un événement.
      longPressDelay: 400, eventLongPressDelay: 400, selectLongPressDelay: 400,
      select: (sel) => { if (lectureSeule()) { try { calendar.unselect(); } catch (e) {} return; } openCreate(sel); },
      events: fetchEvents,
      // FullCalendar re-rend un evenement APRES eventDidMount — un creneau
      // court est reclasse « short » au recalcul des hauteurs — et une classe
      // posee a la main disparait alors. C'est ce qui laissait un rendez-vous
      // de trente minutes sans marquage pendant qu'un bloc de deux heures
      // l'avait. eventClassNames est reapplique a chaque rendu.
      eventClassNames: (arg) => (resteAConclure(arg.event.extendedProps) && !lectureSeule() ? ['ag-aconclure'] : [])
        .concat(vueLivr() && livInfo(arg.event.extendedProps).livre_par === 'vendeur' && familleEvt(arg.event.extendedProps) === 'livraison' ? ['ag-livr-vendeur'] : []),
      eventDidMount: (info) => {
        const c = info.event.extendedProps._accent; if (c) { info.el.style.borderLeft = '3px solid ' + c; }
        // v41 : sous le titre, le type de RDV (s'il n'est pas déjà le titre), le
        // véhicule et son immatriculation, puis le commentaire.
        try {
          const xp0 = info.event.extendedProps || {};
          if (xp0.source_type === 'rdv' && !xp0._groupe) {
            const x0 = xp0.extra || {};
            const aClient = !!clientName(xp0);
            const l1 = [aClient ? xp0.title : '', x0.vehicule, x0.immat].filter(Boolean).join(' · ');
            const l2 = String(xp0.description || '').replace(/\s+/g, ' ').trim();
            const hote = info.el.querySelector('.fc-event-title-container') || info.el.querySelector('.fc-list-event-title');
            if (hote && !hote.querySelector('.ag-det')) {
              [l1, l2].forEach((t, i) => {
                if (!t) return;
                const sd = document.createElement('div'); sd.className = 'ag-det' + (i ? ' ag-com' : '');
                sd.textContent = t.length > 90 ? t.slice(0, 88) + '…' : t;
                hote.appendChild(sd);
              });
            }
          }
        } catch (e) {}
        // v32 : pastille « BACS » tant qu'un geste n'est pas écrit dans BACS.
        try {
          const xp = info.event.extendedProps || {};
          if (xp.extra && xp.extra.bacs_attente) {
            const tt = info.el.querySelector('.fc-event-title') || info.el.querySelector('.fc-list-event-title');
            if (tt && !tt.querySelector('.ag-bacs-att')) {
              const pb = document.createElement('span');
              pb.className = 'ag-bacs-att'; pb.textContent = 'BACS';
              pb.title = 'En attente d\u2019envoi vers BACS : il partira dès que BACS sera ouvert sur le poste de son propriétaire.';
              tt.insertBefore(pb, tt.firstChild);
            }
          }
        } catch (e) {}
        // v31 : tirer un événement verrouillé affiche la raison au lieu de ne rien faire.
        const verrou = raisonVerrou(info.event.extendedProps);
        if (verrou && !info.el.__agVerrou) {
          info.el.__agVerrou = true;
          info.el.style.cursor = 'pointer';
          const debut = (ev0) => {
            const pt = (ev0.touches && ev0.touches[0]) || ev0; const x0 = pt.clientX, y0 = pt.clientY;
            const W = frontWin(); let dit = false;
            const bouge = (ev1) => {
              const q = (ev1.touches && ev1.touches[0]) || ev1;
              if (!dit && (Math.abs(q.clientX - x0) > 12 || Math.abs(q.clientY - y0) > 12)) { dit = true; hideTip(); toast(verrou); fin(); }
            };
            const fin = () => { W.removeEventListener('mousemove', bouge, true); W.removeEventListener('touchmove', bouge, true); W.removeEventListener('mouseup', fin, true); W.removeEventListener('touchend', fin, true); };
            W.addEventListener('mousemove', bouge, true); W.addEventListener('touchmove', bouge, true);
            W.addEventListener('mouseup', fin, true); W.addEventListener('touchend', fin, true);
          };
          info.el.addEventListener('mousedown', debut); info.el.addEventListener('touchstart', debut, { passive: true });
        }
        if (resteAConclure(info.event.extendedProps)) {
          info.el.classList.add('ag-aconclure');   // ceinture ; la bretelle est eventClassNames
          try {
            const t = info.el.querySelector('.fc-event-title');
            if (t) {
              // La pastille se pose DANS le titre : le bloc est en
              // overflow:hidden, tout ce qui deborde disparait.
              const mk = document.createElement('span');
              mk.className = 'ag-aconclure-mk';
              mk.textContent = '!';
              t.insertBefore(mk, t.firstChild);
              // Le mot n'apparait que s'il tient. Tronque, il ne vaut rien.
              if (info.el.offsetWidth >= 170) {
                const b = document.createElement('span');
                b.className = 'ag-aconclure-note';
                b.textContent = 'à conclure';
                t.appendChild(b);
              }
            }
          } catch (e) { }
        }
        // Pas d'infobulle sur écran tactile : le tap déclenche mouseenter sans
        // jamais de mouseleave, l'infobulle restait collée par-dessus le popup.
        if (touch) return;
        // Infobulle déjà ouverte : on ne la remplace qu'après un arrêt de 350 ms
        // sur cet événement (la souris qui la rejoint ne fait que passer).
        info.el.addEventListener('mouseenter', () => {
          if (tipIntention) { clearTimeout(tipIntention); tipIntention = null; }
          const ouverte = tipEl && tipEl.style.display === 'block';
          if (!ouverte) { showTip(info.el, info.event); return; }
          tipIntention = setTimeout(() => { tipIntention = null; showTip(info.el, info.event); }, 350);
        });
        info.el.addEventListener('mouseleave', () => { if (tipIntention) { clearTimeout(tipIntention); tipIntention = null; } });
        info.el.addEventListener('mouseleave', () => masquerBientot(300));
      },
      eventClick: (arg) => {
        hideTip();
        const p = arg.event.extendedProps || {};
        if (p._provisoire) return;                       // en cours d'enregistrement
        if (p._groupe) { ouvrirGroupe(p); return; }      // bloc « N livraisons »
        // v38 : fiche livraison (sites avec expert produit, vue Livraisons, préparateur).
        if (p.source_type === 'rdv' && familleEvt(p) === 'livraison' && (lectureSeule() || vueLivr() || siteAExpert(p.id_site))) { ouvrirFicheLivraison(p, arg.event); return; }
        if (lectureSeule()) { ouvrirFicheLivraison(p, arg.event); return; }
        window.__agendaSelected = p; openEdit(arg.event);
      },
      // Le regroupement des livraisons dépend de la vue (empilée ou non) :
      // passer de Semaine à Liste sur la même plage ne recharge pas les
      // événements, il faut donc le demander.
      datesSet: (arg) => {
        const empile = String(arg.view && arg.view.type || '').indexOf('timeGrid') === 0;
        if (window.__agendaVueEmpile !== undefined && window.__agendaVueEmpile !== empile) refetch();
        window.__agendaVueEmpile = empile;
      },
      eventDrop: applyDragResize,
      eventResize: applyDragResize,
    });

    calendar.render();
    updateSundayBtn();
    wireLayout();
    window.__agendaRefetch = refetch;
    // v32 : BACS rouvert -> la file part ; on recharge pour retirer les pastilles.
    if (!window.__agendaVeilleBacs) {
      window.__agendaVeilleBacs = true;
      try {
        frontWin().addEventListener('od-bacs-etat', function (e) {
          const d = e && e.detail; if (!d) return;
          bacsOuvert = !!d.ok;
          if (d.ok && d.precedent === false) { setTimeout(function () { try { window.__agendaRefetch && window.__agendaRefetch(); } catch (x) {} }, 9000); }
          if (cs && !cs.saving) appliquerVerrou();
        });
      } catch (e) {}
    }
    getUserId().then(() => { renderCollab(true); refetch(); ouvrirDemandeFiche(); });
    chargerRoles().then(() => {
      if (lectureSeule()) {
        try { calendar.setOption('editable', false); calendar.setOption('selectable', false); calendar.setOption('slotEventOverlap', false); } catch (e) {}
        if (siteAg.id == null) siteAg.id = siteParDefaut();
      }
      collabSig = null; renderCollab(true); renderSiteBar(); refetch();
    });
    wireRefresh();
  }

  function wireRefresh() {
    if (!window.__agendaCollabOutside) {
      window.__agendaCollabOutside = (e) => { const host = document.getElementById('agenda-collab'); if (collabMenuOpen && host && !host.contains(e.target)) { collabMenuOpen = false; const m = document.getElementById('agc-menu'); if (m) m.style.display = 'none'; } };
      try { frontDoc().addEventListener('mousedown', window.__agendaCollabOutside, true); } catch (e) {}
    }
    if (!window.__agendaPoll) {
      let last = JSON.stringify([siteIds(), agendaUserVal()]);
      window.__agendaPoll = setInterval(() => {
        const cur = JSON.stringify([siteIds(), agendaUserVal()]);
        if (cur !== last) { last = cur; refetch(); }
        renderCollab(false);                 // (re)construit le sélecteur dès que le dashboard est prêt / au changement de site
      }, 600);
    }
  }


  // ==========================================================================
  //  POPUP CRÉATION (3 modes : RDV client / Créneau / Bilatérale)
  //  UI à la charte dashboard. Écrit via les RPC create_* (phase2b_creation.sql).
  // ==========================================================================
  const ORIGINES = ['Initiative personnelle', 'Indication', 'Marketing Groupe', 'Campagnes Constructeur', 'Fin de financement', 'Salon - Expo'];
  const DURATIONS = [15, 30, 45, 60, 90, 120, 150, 180, 240, 300, 360, 420, 480, 540, 600];
  const DUREE_DEFAUT = 60;
  // 30 -> « ½ h », 90 -> « 1h30 », 75 -> « 1h15 »
  function libDuree(min) {
    min = Number(min) || 0;
    if (min === 15) return '\u00bc h'; if (min === 30) return '\u00bd h'; if (min === 45) return '\u00be h';
    if (min % 60 === 0) return (min / 60) + ' h';
    // v33 : 90 -> « 1h30 », 150 -> « 2h30 » (demande d'Antoine, 27/10/2026)
    const h = Math.floor(min / 60), m = min % 60;
    return h ? (h + 'h' + String(m).padStart(2, '0')) : (m + ' min');
  }
  function optionsDuree(cur) {
    const l = DURATIONS.slice(); cur = Number(cur) || DUREE_DEFAUT;
    if (l.indexOf(cur) < 0) { l.push(cur); l.sort((a, b) => a - b); }
    return l.map(d => '<option value="' + d + '"' + (d === cur ? ' selected' : '') + '>' + libDuree(d) + '</option>').join('');
  }
  // ── v28 : synchronisation avec BACS ──────────────────────────────────────
  //  agenda_bacs_preflight dit si l'agenda est synchronisé sur ce tenant et
  //  si l'utilisateur a un compte BACS. Si oui, tout geste d'écriture exige
  //  BACS ouvert sur CE poste (règle du 22/10) : le bouton reste rouge et
  //  verrouillé tant que l'extension ne répond pas, comme à la création de
  //  client. La base refuserait de toute façon le geste.
  let agendaBacsPf = null;
  async function chargerAgendaBacs() {
    if (agendaBacsPf) return agendaBacsPf;
    try { const r = await sb().rpc('agenda_bacs_preflight'); agendaBacsPf = (!r.error && r.data) ? r.data : { actif: false }; }
    catch (e) { agendaBacsPf = { actif: false }; }
    return agendaBacsPf;
  }
  function bacsExige() { return !!(agendaBacsPf && agendaBacsPf.actif && agendaBacsPf.moi_bacs); }
  function bacsDemander(action, params, delaiMs) {
    const w = frontWin();
    const g = (w.OD && w.OD.bacs) || (window.OD && window.OD.bacs);
    if (g && typeof g.demander === 'function') return g.demander(action, params, delaiMs);
    return new Promise(function (resolve) {
      const id = 'agd_' + Date.now() + '_' + Math.random().toString(16).slice(2);
      let t = null;
      function fin(r) { try { w.removeEventListener('message', ecoute); } catch (e) {} clearTimeout(t); resolve(r); }
      function ecoute(e) { const m = e.data; if (m && m.__od_bacs_result && m.id === id) fin(m); }
      w.addEventListener('message', ecoute);
      t = setTimeout(function () { fin({ ok: false, erreur: 'delai_depasse' }); }, delaiMs || 8000);
      try { w.postMessage({ __od_bacs: true, id: id, action: action, params: params || {} }, '*'); }
      catch (e) { fin({ ok: false, erreur: 'extension_absente' }); }
    });
  }
  let bacsOuvert = null;           // dernier état connu du poste
  let bacsErreur = null;           // v35 : pourquoi BACS est vu fermé
  // v35 : le bandeau dit la vraie cause et quoi faire, au lieu de « fermé ».
  function texteBacsFerme() {
    switch (bacsErreur) {
      case 'extension_absente':
      case 'extension_indisponible':
        return 'L\u2019extension BACS ne répond pas sur cette page (elle a sans doute été rechargée) : appuyez sur F5 pour recharger One Data. L\u2019enregistrement se fait quand même et partira vers BACS.';
      case 'bacs_non_pret':
      case 'contexte_absent':
        return 'BACS est ouvert mais pas prêt : rechargez l\u2019onglet BACS (F5) et cliquez une fois dans BACS. L\u2019enregistrement se fait quand même et partira vers BACS.';
      case 'delai_depasse':
        return 'BACS ne répond pas pour l\u2019instant. L\u2019enregistrement se fait ici et partira vers BACS dès qu\u2019il répondra.';
      default:
        return 'BACS est fermé sur ce poste : l\u2019enregistrement se fait ici et partira vers BACS dès sa réouverture.';
    }
  }
  let bacsSuiviT = null;
  function suivreBacs() {
    clearTimeout(bacsSuiviT);
    if (!cs || !bacsExige()) return;
    bacsDemander('ping', {}, 6000).then(function (p) {
      const ouvert = !!(p && p.ok && p.contexte !== false);
      bacsErreur = ouvert ? null : ((p && p.erreur) || (p && p.ok && p.contexte === false ? 'contexte_absent' : 'bacs_non_ouvert'));
      const change = ouvert !== bacsOuvert;
      bacsOuvert = ouvert;
      if (change && cs && !cs.saving) appliquerVerrou();
      if (cs) bacsSuiviT = setTimeout(suivreBacs, ouvert ? 8000 : 2500);
    });
  }
  // v32 : plus de verrou — l'envoi vers BACS est différé, jamais bloquant.
  function verrouille() { return false; }
  function bacsFermeIci() { return bacsExige() && bacsOuvert === false; }
  function appliquerVerrou() {
    const d = frontDoc();
    try {
      const foot = d.querySelector('#agenda-ov .agm-foot');
      let info = d.getElementById('agm-bacs-info');
      if (foot && bacsFermeIci()) {
        if (!info) { info = d.createElement('div'); info.id = 'agm-bacs-info'; foot.parentNode.insertBefore(info, foot); }
        info.textContent = texteBacsFerme();
      } else if (info) { info.remove(); }
    } catch (e) {}
    ['agm-save', 'agm-start-now', 'agm-del', 'agm-del-yes', 'agm-real-now'].forEach(function (id) {
      const b = d.getElementById(id); if (!b || cs.saving) return;
      if (verrouille()) {
        if (b.dataset.agvHtml == null) b.dataset.agvHtml = b.innerHTML;
        b.dataset.agvBloque = '1'; b.disabled = true;
        if (id === 'agm-save') b.innerHTML = 'Bacs doit être ouvert pour pouvoir valider';
        b.style.setProperty('background', '#fdf1f1', 'important');
        b.style.setProperty('border-color', '#f2c4c4', 'important');
        b.style.setProperty('color', '#e24b4a', 'important');
        b.style.setProperty('cursor', 'not-allowed', 'important');
        b.title = 'Ouvrez BACS dans un onglet de ce navigateur et connectez-vous : le bouton se débloque tout seul.';
      } else if (b.dataset.agvBloque === '1') {
        if (b.dataset.agvHtml != null) b.innerHTML = b.dataset.agvHtml;
        delete b.dataset.agvHtml; delete b.dataset.agvBloque; b.disabled = false;
        ['background', 'border-color', 'color', 'cursor'].forEach(function (k) { b.style.removeProperty(k); });
        b.removeAttribute('title');
      }
    });
  }
  // Après une écriture : l'extension écrit dans BACS sans attendre son tour.
  function pousserVersBacs() { if (bacsExige()) { try { bacsDemander('vider_file', {}, 4000); } catch (e) {} } }

  // Les invitables : annuaire actif du tenant (avec ou sans compte BACS).
  let invitablesCache = null;
  async function chargerInvitables() {
    if (invitablesCache) return invitablesCache;
    try { const r = await sb().rpc('agenda_invitables'); invitablesCache = (!r.error && Array.isArray(r.data)) ? r.data : []; }
    catch (e) { invitablesCache = []; }
    return invitablesCache;
  }
  function nomInvite(id) { const u = (invitablesCache || []).find(x => Number(x.id_user) === Number(id)); return u ? u.nom : nomPersonne(id); }
  function bacsInvite(id) { const u = (invitablesCache || []).find(x => Number(x.id_user) === Number(id)); return !u || !!u.bacs; }
  function memesInvites(a, b) { const x = (a || []).map(Number).sort().join(','), y = (b || []).map(Number).sort().join(','); return x === y; }
  // État de la synchronisation d'un RDV existant, affiché dans la fenêtre.
  async function chargerEtatSync(idRdv) {
    if (!bacsExige() && !(agendaBacsPf && agendaBacsPf.actif)) return;
    try {
      const r = await sb().rpc('agenda_bacs_etat', { p_ids: [Number(idRdv)] });
      if (!r.error && r.data && r.data[0] && cs && String(cs.editId) === String(idRdv)) { cs.sync = r.data[0]; renderCreate(); }
    } catch (e) {}
  }

  let rdvTypesCache = null;
  async function loadRdvTypes() {
    if (rdvTypesCache) return rdvTypesCache;
    try { const { data, error } = await sb().from('rdv_type').select('"ID_RDV_TYPE","DESIGNATION"'); if (error) throw error; rdvTypesCache = (data || []).map(r => ({ id: Number(r.ID_RDV_TYPE), label: r.DESIGNATION })).sort((a, b) => String(a.label).localeCompare(String(b.label), 'fr')); }
    catch (e) { console.error('[agenda] rdv_type', e); rdvTypesCache = []; }
    return rdvTypesCache;
  }
  function creneauTypes() {
    const ex = { 5: 1, 6: 1, 10: 1 }; // RDV Physique / Relance / RDV T\u00e9l\u00e9phonique = rpv, pas des cr\u00e9neaux
    return (rdvTypesCache || []).filter(t => !ex[Number(t.id)]).sort((a, b) => {
      const aA = /^autre$/i.test(String(a.label).trim()), bA = /^autre$/i.test(String(b.label).trim());
      if (aA && !bA) return 1; if (bA && !aA) return -1;
      return String(a.label).localeCompare(String(b.label), 'fr');
    });
  }
  function clientLabel(c) { if (!c) return ''; const soc = (c.idmultivu === 1 || c.idmultivu === '1'); return soc ? [c.CIVILITE, c.NOM].filter(Boolean).join(' ') : [c.CIVILITE, c.NOM, c.PRENOM].filter(Boolean).join(' '); }

  // ==========================================================================
  //  Picker client — comportement identique à oropra-client-search / Like-P.Com
  //  (onglets Particulier/Société, recherche multi-critères, tableau + pagination,
  //   création client avec autocomplete SIRENE + adresse). Overlay au-dessus du
  //   popup RDV. onPick(client) renvoie la row choisie ; n'écrit PAS la var topnav.
  // ==========================================================================
  function openClientPicker(onPick, preselect) {
    const GEOPF_ENDPOINT = 'https://data.geopf.fr/geocodage/search';
    const EDGE_FN_SIRENE_SEARCH = 'sirene-search';
    const EDGE_FN_SIRENE_UPSERT = 'sirene-upsert';
    const PAGE_SIZE = 10;
    const d = frontDoc();
    const supa = () => sb();
    let viewerId = null;
    try { let cd = frontWin().oropraUser; if (Array.isArray(cd)) cd = cd[0]; viewerId = cd && cd.ID_User; } catch (e) {}
    function rv(id) { try { return wwLib().wwVariable.getValue(id); } catch (e) { return null; } }
    const lookup = Array.isArray(rv(CFG.lookupVar)) ? rv(CFG.lookupVar) : [];
    const civilitesP = lookup.filter(x => x.multivu === 0);
    const typesS = lookup.filter(x => x.multivu === 1);
    const npaiRaw = rv(CFG.npaiVar);
    const npaiOptions = Array.isArray(npaiRaw) && npaiRaw.length ? npaiRaw : ['Aucun', 'NPAI', 'Décédé'];

    const emptyP = () => ({ NOM: '', PRENOM: '', EMAIL: '', IDVu: '', tel: '', ville: '', cp: '', birthMin: '', birthMax: '', CSP: '', marque: '' });
    const emptyS = () => ({ SIRET: '', NOM: '', EMAIL: '', IDVu: '' });
    const st = {
      activeTab: 'particulier', showMore: false, filters: { particulier: emptyP(), societe: emptyS() },
      page: 1, results: [], totalCount: 0, loading: false, searched: false, error: null, modal: null,
      selectedClient: (preselect && preselect.IDVu != null) ? Object.assign({}, preselect) : (function () { const c = rv(CFG.selectedClientVar); if (c && typeof c === 'object' && c.IDVu != null) { const o = JSON.parse(JSON.stringify(c)); delete o.full_count; return o; } return null; })()
    };

    function ce(s) { if (s == null) return ''; return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
    function cd2(s) { return s == null ? '' : String(s).replace(/\D/g, ''); }
    function cmail(s) { return s == null ? '' : String(s).trim().toLowerCase(); }
    function vMail(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s).trim()); }
    function vMob(s) { const x = cd2(s); return /^(0[67]\d{8}|33[67]\d{8})$/.test(x); }
    function vFixe(s) { const x = cd2(s); return /^(0[1-589]\d{8}|33[1-589]\d{8})$/.test(x); }
    function cname(c) { if (!c) return ''; const soc = c.idmultivu === 1 || c.idmultivu === '1'; return soc ? [c.CIVILITE, c.NOM].filter(Boolean).join(' ') : [c.CIVILITE, c.NOM, c.PRENOM].filter(Boolean).join(' '); }

    function buildQuery() {
      const tab = st.activeTab, f = st.filters[tab];
      let q = supa().from('CLIENT').select('*', { count: 'exact' }).eq('idmultivu', tab === 'societe' ? 1 : 0);
      if (tab === 'particulier') {
        if (f.NOM) q = q.ilike('NOM', '%' + f.NOM + '%');
        if (f.PRENOM) q = q.ilike('PRENOM', '%' + f.PRENOM + '%');
        if (f.EMAIL) q = q.ilike('EMAIL', '%' + f.EMAIL + '%');
        if (f.IDVu) q = q.eq('IDVu', Number(f.IDVu));
        if (f.tel) q = q.or('TEl_MOB.ilike.%' + f.tel + '%,TEL_FIXE.ilike.%' + f.tel + '%');
        if (f.ville) q = q.ilike('ville', '%' + f.ville + '%');
        if (f.cp) q = q.ilike('code_postal', f.cp + '%');
        if (f.birthMin) q = q.gte('BIRTHDAY', f.birthMin);
        if (f.birthMax) q = q.lte('BIRTHDAY', f.birthMax);
        if (f.CSP) q = q.ilike('CSP', '%' + f.CSP + '%');
        if (f.marque) q = q.ilike('MARQUE_CLIENT_VEHICULE', '%' + f.marque + '%');
      } else {
        if (f.SIRET) { const c = cd2(f.SIRET); if (c) q = q.eq('SIRET', c); }
        if (f.NOM) q = q.ilike('NOM', '%' + f.NOM + '%');
        if (f.EMAIL) q = q.ilike('EMAIL', '%' + f.EMAIL + '%');
        if (f.IDVu) q = q.eq('IDVu', Number(f.IDVu));
      }
      const start = (st.page - 1) * PAGE_SIZE;
      return q.order('NOM', { ascending: true, nullsFirst: false }).range(start, start + PAGE_SIZE - 1);
    }
    async function runSearch() {
      st.loading = true; st.searched = true; render();
      try { const { data, error, count } = await buildQuery(); if (error) throw error; st.results = data || []; st.totalCount = count || 0; st.error = null; }
      catch (e) { st.error = e.message || String(e); st.results = []; st.totalCount = 0; }
      st.loading = false; render();
    }
    function clearFilters() { st.filters[st.activeTab] = st.activeTab === 'particulier' ? emptyP() : emptyS(); st.page = 1; st.results = []; st.totalCount = 0; st.searched = false; st.error = null; render(); }
    function changeTab(t) { if (st.activeTab === t) return; st.activeTab = t; st.page = 1; st.results = []; st.totalCount = 0; st.searched = false; st.error = null; st.showMore = false; render(); }
    function pickRow(r) { st.selectedClient = Object.assign({}, r); render(); }
    function changePage(p) { const total = Math.max(1, Math.ceil(st.totalCount / PAGE_SIZE)); if (p < 1 || p > total || p === st.page) return; st.page = p; runSearch(); }
    function pagerItems(cur, total) { if (total <= 1) return []; if (total <= 7) { const a = []; for (let i = 1; i <= total; i++) a.push({ page: i }); return a; } const set = new Set([1, total, cur]); if (cur > 1) set.add(cur - 1); if (cur < total) set.add(cur + 1); const arr = Array.from(set).sort((a, b) => a - b); const out = []; let prev = 0; for (const p of arr) { if (p > prev + 1) out.push({ ellipsis: true }); out.push({ page: p }); prev = p; } return out; }

    function openCreateModal() {
      const f = st.filters[st.activeTab]; const isSoc = st.activeTab === 'societe';
      st.modal = {
        isSoc, saving: false, error: null, duplicate: null,
        addressQuery: '', addressSuggestions: [], addressLoading: false,
        siretQuery: isSoc && f.SIRET ? cd2(f.SIRET) : '', siretSuggestions: [], siretLoading: false,
        data: {
          CIVILITE: '', NOM: f.NOM || '', PRENOM: !isSoc ? (f.PRENOM || '') : '',
          BIRTHDAY: '', EMAIL: f.EMAIL || '', TEl_MOB: !isSoc ? (f.tel || '') : '', TEL_FIXE: '',
          ADRESSE: '', code_postal: !isSoc ? (f.cp || '') : '', ville: !isSoc ? (f.ville || '') : '',
          code_insee: '', lat: null, lon: null, adresse_label: '', adresse_source: 'manual',
          adresse_status: null, adresse_score: null, adresse_ban: null,
          STOP_COM: false, NPAI: 'Aucun', CSP: '', PROFESSION: '', LOISIR: '',
          MARQUE_CLIENT_VEHICULE: '', MODELE_CLIENT_VEHICULE: '', ANNEE_CLIENT_VEHICULE: '',
          KM_CLIENT_VEHICULE: '', KM_MOY: '', COMMENTAIRE: '',
          SIRET: isSoc && f.SIRET ? cd2(f.SIRET) : '', idmultivu: isSoc ? 1 : 0
        }
      };
      render();
    }
    function closeModal() { st.modal = null; render(); }
    function updMField(field, value) { if (st.modal) st.modal.data[field] = value; }
    function validateModal() {
      if (!st.modal) return null; const dd = st.modal.data, isSoc = st.modal.isSoc, err = [];
      if (isSoc) {
        if (!cd2(dd.SIRET) || cd2(dd.SIRET).length !== 14) err.push('Le SIRET doit comporter 14 chiffres.');
        if (!dd.NOM || !String(dd.NOM).trim()) err.push('La raison sociale est obligatoire.');
      } else {
        if (!dd.CIVILITE) err.push('La civilité est obligatoire.');
        if (!dd.NOM || !String(dd.NOM).trim()) err.push('Le nom est obligatoire.');
        if (!dd.PRENOM || !String(dd.PRENOM).trim()) err.push('Le prénom est obligatoire.');
        if (!dd.TEl_MOB) err.push('Le téléphone portable est obligatoire.');
        else if (!vMob(dd.TEl_MOB)) err.push('Téléphone portable invalide (06/07).');
        if (!dd.EMAIL) err.push("L'email est obligatoire.");
        else if (!vMail(dd.EMAIL)) err.push('Email invalide.');
      }
      if (dd.TEL_FIXE && !vFixe(dd.TEL_FIXE)) err.push('Téléphone fixe invalide.');
      if (isSoc && dd.TEl_MOB && !vMob(dd.TEl_MOB)) err.push('Téléphone portable invalide.');
      if (isSoc && dd.EMAIL && !vMail(dd.EMAIL)) err.push('Email invalide.');
      return err.length ? err : null;
    }
    async function checkDuplicates() {
      if (!st.modal) return null;
      await chargerDoublons();
      const od = window.oropraDoublons;
      if (!od) return null;
      return od.check(supa(), st.modal.data, { societe: st.modal.isSoc });
    }
    function dismissDuplicate() { if (st.modal) { st.modal.duplicate = null; st.modal.dupAck = false; } render(); }
    async function viewDuplicate(ev) { const id = ev && ev.currentTarget && ev.currentTarget.getAttribute('data-od-idvu'); if (!id) return; const { data } = await supa().from('CLIENT').select('*').eq('IDVu', Number(id)).maybeSingle(); if (data) { st.selectedClient = Object.assign({}, data); st.modal = null; } render(); }
    async function saveAnyway() { if (!st.modal) return; const cands = st.modal.duplicate ? st.modal.duplicate.candidats.slice() : []; st.modal.dupAck = true; st.modal.duplicate = null; st.__dupEnAttente = cands; await saveCreation(); }
    async function saveCreation() {
      if (!st.modal) return; const errs = validateModal();
      if (errs) { st.modal.error = errs.join(' '); st.modal.duplicate = null; render(); return; }
      st.modal.saving = true; st.modal.error = null; st.modal.duplicate = null; render();
      try {
        const dup = await checkDuplicates();
        if (dup) { st.modal.duplicate = dup; st.modal.saving = false; render(); return; }
        const now = new Date().toISOString();
        const isSoc = st.modal.isSoc;
        const siteApi = window.oropraSite || null;
        const idSite = siteApi && siteApi.getSiteId ? siteApi.getSiteId() : null;
        if (idSite == null) { st.modal.saving = false; st.modal.error = "Aucun site sélectionné (choisissez un site en haut à droite)."; render(); return; }
        const payload = Object.assign({}, st.modal.data, {
          CreationDate: now, UpdateDate: now,
          ID_VENDEUR_CREATION: viewerId != null ? String(viewerId) : null,
          ID_VENDEUR_UPDATE: viewerId != null ? String(viewerId) : null,
          adresse_checked_at: st.modal.data.adresse_status === 'verified' ? now : null,
          CP_VILLE: [st.modal.data.code_postal, st.modal.data.ville].filter(Boolean).join(' ')
        });
        if (payload.TEl_MOB) payload.TEl_MOB = cd2(payload.TEl_MOB);
        if (payload.TEL_FIXE) payload.TEL_FIXE = cd2(payload.TEL_FIXE);
        if (payload.EMAIL) payload.EMAIL = cmail(payload.EMAIL);
        ['ANNEE_CLIENT_VEHICULE', 'KM_CLIENT_VEHICULE', 'KM_MOY', 'SIRET', 'adresse_score'].forEach(k => {
          if (payload[k] === '' || payload[k] == null) payload[k] = null;
          else if (k === 'adresse_score') payload[k] = Number(payload[k]);
          else payload[k] = Number(cd2(payload[k])) || null;
        });
        if (payload.BIRTHDAY === '') payload.BIRTHDAY = null;
        const _od = window.oropraDoublons; if (_od) _od.nettoyerPayload(payload);
        delete payload.IDVu;
        // v26 : création suivie One Data + BACS (oropra-bacs-client). Repli sur
        // l'appel direct si le module partagé ne se charge pas : la base exige
        // de toute façon que BACS soit ouvert chez le vendeur.
        const _bc = await (window.__odBacsClientPret || (window.__odBacsClientPret = new Promise(function (ok) {
              if (window.oropraBacsClient) return ok(window.oropraBacsClient);
              var sc = document.createElement('script'); sc.src = 'https://cdn.jsdelivr.net/gh/oropra-apps/one-data-blocs@oropra-bacs-client-v6/oropra-bacs-client.js'; sc.async = true;
              sc.onload = function () { ok(window.oropraBacsClient || null); };
              sc.onerror = function () { window.__odBacsClientPret = null; ok(null); };
              document.head.appendChild(sc);
            })));
        const { data: creation, error } = _bc
          ? await _bc.creer(supa(), { p_payload: payload, p_id_site: idSite, p_id_user: viewerId != null ? Number(viewerId) : null })
          : await supa().rpc('client_creer', { p_payload: payload, p_id_site: idSite, p_id_user: viewerId != null ? Number(viewerId) : null });
        if (error) throw error;
        const inserted = creation && creation.client ? creation.client : null;
        if (!inserted) throw new Error('création : aucune fiche renvoyée');
        if (st.__dupEnAttente && st.__dupEnAttente.length && _od) { for (const c of st.__dupEnAttente) { if (c.id_client == null || Number(c.id_client) === Number(inserted.IDVu)) continue; try { await _od.signaler(supa(), inserted.IDVu, [c]); } catch(e){} } st.__dupEnAttente = null; }
        if (isSoc && payload.SIRET) { try { await supa().functions.invoke(EDGE_FN_SIRENE_UPSERT, { body: { siret: String(inserted.SIRET), idvu: String(inserted.IDVu), setPrimary: true } }); } catch (e) {} }
        st.selectedClient = Object.assign({}, inserted); st.modal = null; render();
      } catch (e) { st.modal.saving = false; st.modal.error = e.message || String(e); render(); }
    }
    async function inseeAddr(query) {
      const r = await fetch(GEOPF_ENDPOINT + '?q=' + encodeURIComponent(query) + '&limit=8'); if (!r.ok) throw new Error('Geocoding ' + r.status);
      const j = await r.json();
      return (j && j.features || []).map(f => ({ label: (f.properties && f.properties.label) || '', value: (f.properties && f.properties.id) || '', raw: f })).filter(o => o.label && o.value);
    }
    let addrDeb = null;
    function onAddr(query) {
      if (!st.modal) return; st.modal.addressQuery = query; st.modal.data.ADRESSE = query; st.modal.data.adresse_source = 'manual'; st.modal.data.adresse_status = null;
      if (!query || query.length < 4) { st.modal.addressSuggestions = []; render(); return; }
      if (addrDeb) clearTimeout(addrDeb);
      addrDeb = setTimeout(async () => { st.modal.addressLoading = true; render(); try { st.modal.addressSuggestions = await inseeAddr(query); } catch (e) { st.modal.addressSuggestions = []; } st.modal.addressLoading = false; render(); }, 350);
    }
    function applyAddr(s) {
      if (!st.modal) return; const p = (s.raw && s.raw.properties) || {}; const c = (s.raw && s.raw.geometry && s.raw.geometry.coordinates) || [];
      Object.assign(st.modal.data, { ADRESSE: p.name || p.label || '', code_postal: p.postcode || '', ville: p.city || '', code_insee: p.citycode || '', lat: c[1] != null ? Number(c[1]) : null, lon: c[0] != null ? Number(c[0]) : null, adresse_label: p.label || '', adresse_source: 'ban', adresse_status: 'verified', adresse_score: p.score != null ? Number(p.score) : null, adresse_ban: s.raw || null });
      st.modal.addressSuggestions = []; st.modal.addressQuery = p.label || ''; render();
    }
    async function inseeSiret(query) {
      const qs = new URLSearchParams({ query, limit: '8', activeOnly: 'false' }).toString();
      const { data, error } = await supa().functions.invoke(EDGE_FN_SIRENE_SEARCH + '?' + qs, { method: 'GET' });
      if (error) throw error; return (data && data.items) || [];
    }
    let siretDeb = null;
    function onSiret(query) {
      if (!st.modal) return; st.modal.siretQuery = query; const od = cd2(query);
      if (od === query.replace(/\s/g, '')) st.modal.data.SIRET = od;
      if (!query || query.length < 2) { st.modal.siretSuggestions = []; render(); return; }
      if (siretDeb) clearTimeout(siretDeb);
      siretDeb = setTimeout(async () => { st.modal.siretLoading = true; render(); try { st.modal.siretSuggestions = await inseeSiret(query); } catch (e) { st.modal.siretSuggestions = []; st.modal.error = e.message || String(e); } st.modal.siretLoading = false; render(); }, 400);
    }
    function applySiret(item) {
      if (!st.modal) return; const t = typesS.find(x => String(x.code) === String(item.categorie_juridique_code));
      Object.assign(st.modal.data, { SIRET: cd2(item.siret), NOM: item.raison_sociale || st.modal.data.NOM, CIVILITE: t ? t.libelle_court : st.modal.data.CIVILITE, ADRESSE: item.adresse_ligne1 || '', code_postal: item.code_postal || '', ville: item.commune || '', adresse_label: item.adresse || '', adresse_source: 'sirene', adresse_status: 'verified', adresse_score: null, code_insee: '', lat: null, lon: null });
      st.modal.siretSuggestions = []; st.modal.siretQuery = cd2(item.siret); st.modal.addressQuery = item.adresse || item.adresse_ligne1 || ''; render();
    }

    const I_P = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>';
    const I_S = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 21V12h6v9"/></svg>';
    const I_MOB = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="7" y="2" width="10" height="20" rx="2"/></svg>';
    const I_FIXE = '<svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>';
    const I_PLUS = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>';
    const I_MINUS = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><line x1="8" y1="12" x2="16" y2="12"/></svg>';
    const I_REFRESH = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>';
    const I_SEARCH = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>';
    const I_CLOSE = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    const I_WARN = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12" y2="17"/></svg>';
    const I_CHECK = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';

    const STYLE = '<style>'
      + '#agenda-clp-ov{position:fixed;inset:0;background:rgba(31,74,133,.5);z-index:3200;display:flex;align-items:center;justify-content:center;padding:20px;font-family:"Nunito Sans",system-ui,sans-serif}'
      + '#agenda-clp-ov *{box-sizing:border-box}'
      + '#agenda-clp-ov .clp-modal{background:#fff;border-radius:16px;width:100%;max-width:920px;max-height:88vh;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 30px 80px rgba(31,74,133,.35)}'
      + '#agenda-clp-ov .clp-hd{padding:16px 22px;border-bottom:1px solid #eef2f8;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}'
      + '#agenda-clp-ov .clp-hd-title{font-size:16px;font-weight:800;color:#1F4A85}'
      + '#agenda-clp-ov .clp-hd-x{width:30px;height:30px;border:1.5px solid #e2eaf5;background:#fff;border-radius:8px;color:#7a98c5;font-size:18px;cursor:pointer;line-height:1}'
      + '#agenda-clp-ov .clp-hd-x:hover{background:#f2f6fc}'
      + '#agenda-clp-ov .clp-root{position:relative;flex:1;display:flex;flex-direction:column;min-height:0;color:#2a5ea9}'
      + '#agenda-clp-ov .clp-body{overflow-y:auto;flex:1;padding:18px 22px}'
      + '#agenda-clp-ov .clp-selected{background:#eef9f5;border:1px solid #b6e3d6;border-radius:10px;padding:14px 16px;margin-bottom:16px;display:flex;align-items:flex-start;gap:12px}'
      + '#agenda-clp-ov .clp-selected.is-empty{background:#fdf2dd;border-color:#f5c785}'
      + '#agenda-clp-ov .clp-selicon{flex:0 0 auto;width:34px;height:34px;border-radius:50%;background:#53bda7;color:#fff;display:flex;align-items:center;justify-content:center}'
      + '#agenda-clp-ov .clp-selected.is-empty .clp-selicon{background:#fac055}'
      + '#agenda-clp-ov .clp-sellabel{font-size:10px;text-transform:uppercase;letter-spacing:.4px;color:#3d8a76;font-weight:700;margin-bottom:3px}'
      + '#agenda-clp-ov .clp-selected.is-empty .clp-sellabel{color:#a65f00}'
      + '#agenda-clp-ov .clp-selname{font-size:15px;font-weight:700;color:#2a5ea9}'
      + '#agenda-clp-ov .clp-seldetail{font-size:12px;color:#5a7ba8;margin-top:3px}'
      + '#agenda-clp-ov .clp-tabs{display:flex;border-bottom:1px solid #e3edf9;margin-bottom:16px}'
      + '#agenda-clp-ov .clp-tab{display:inline-flex;align-items:center;gap:8px;padding:11px 16px;cursor:pointer;color:#acc5e4;font-size:13px;font-weight:600;border:none;background:none;border-bottom:2px solid transparent;margin-bottom:-1px;font-family:inherit}'
      + '#agenda-clp-ov .clp-tab.is-active{color:#53bda7;border-bottom-color:#53bda7}'
      + '#agenda-clp-ov .clp-form{display:grid;grid-template-columns:repeat(3,1fr);gap:10px 14px;margin-bottom:12px}'
      + '#agenda-clp-ov .clp-field{display:flex;flex-direction:column}'
      + '#agenda-clp-ov .clp-label{font-size:11px;color:#7a98c5;margin-bottom:4px;text-transform:uppercase;letter-spacing:.4px;font-weight:600}'
      + '#agenda-clp-ov .clp-input{border:1.5px solid #e2eaf5;border-radius:8px;padding:9px 11px;font-size:13px;color:#1F4A85;outline:none;background:#fff;font-family:inherit;width:100%;transition:border-color .12s}'
      + '#agenda-clp-ov .clp-input:focus{border-color:#2a5ea9}'
      + '#agenda-clp-ov .clp-input::placeholder{color:#acc5e4}'
      + '#agenda-clp-ov select.clp-input{cursor:pointer;appearance:none}'
      + '#agenda-clp-ov .clp-toolbar{display:flex;align-items:center;justify-content:space-between;margin:12px 0;gap:12px;flex-wrap:wrap}'
      + '#agenda-clp-ov .clp-tsec{display:flex;align-items:center;flex:1}'
      + '#agenda-clp-ov .clp-tsec.right{justify-content:flex-end}'
      + '#agenda-clp-ov .clp-more{display:inline-flex;align-items:center;gap:6px;color:#2a5ea9;font-size:13px;cursor:pointer;background:none;border:none;font-family:inherit;font-weight:600}'
      + '#agenda-clp-ov .clp-pager{display:inline-flex;align-items:center;gap:2px}'
      + '#agenda-clp-ov .clp-pager-item{padding:6px 10px;cursor:pointer;color:#2a5ea9;font-size:13px;border-radius:6px;background:none;border:none;font-family:inherit;min-width:28px;font-weight:600}'
      + '#agenda-clp-ov .clp-pager-item.is-active{background:#eef4fc}'
      + '#agenda-clp-ov .clp-pager-item:disabled{color:#cad6e5;cursor:not-allowed}'
      + '#agenda-clp-ov .clp-btns{display:flex;gap:8px}'
      + '#agenda-clp-ov .clp-btn{padding:9px 16px;border-radius:8px;font-size:13px;font-weight:700;cursor:pointer;border:1.5px solid transparent;outline:none;font-family:inherit;display:inline-flex;align-items:center;gap:6px}'
      + '#agenda-clp-ov .clp-btn-primary{background:#2a5ea9;color:#fff;border-color:#2a5ea9}'
      + '#agenda-clp-ov .clp-btn-primary:hover{background:#1F4A85}'
      + '#agenda-clp-ov .clp-btn-ghost{background:transparent;color:#2a5ea9;border-color:#e2eaf5}'
      + '#agenda-clp-ov .clp-btn-ghost:hover{border-color:#2a5ea9}'
      + '#agenda-clp-ov .clp-table{width:100%;border-collapse:collapse;font-size:13px;margin-top:6px}'
      + '#agenda-clp-ov .clp-table thead th{background:#f4f7fc;padding:9px 12px;text-align:left;color:#2a5ea9;font-weight:700;font-size:11px;text-transform:uppercase;letter-spacing:.04em}'
      + '#agenda-clp-ov .clp-table tbody tr{border-bottom:1px solid #f0f4fa;cursor:pointer;transition:background .1s}'
      + '#agenda-clp-ov .clp-table tbody tr:hover{background:#f7fafd}'
      + '#agenda-clp-ov .clp-table tbody tr.is-picked{background:#eef9f5}'
      + '#agenda-clp-ov .clp-table tbody tr.is-picked td:first-child{box-shadow:inset 3px 0 0 #53bda7}'
      + '#agenda-clp-ov .clp-table td{padding:12px;color:#2a5ea9;vertical-align:middle}'
      + '#agenda-clp-ov .clp-tel-row{display:flex;align-items:center;gap:5px;font-size:12px}'
      + '#agenda-clp-ov .clp-pick-dot{width:22px;height:22px;border-radius:50%;border:2px solid #e2eaf5;display:inline-flex;align-items:center;justify-content:center;color:transparent}'
      + '#agenda-clp-ov tr.is-picked .clp-pick-dot{border-color:#53bda7;background:#53bda7;color:#fff}'
      + '#agenda-clp-ov .clp-empty{padding:36px;text-align:center;color:#9bb3d1;font-size:13px;font-weight:600}'
      + '#agenda-clp-ov .clp-footer{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:14px 22px;border-top:1px solid #eef2f8;flex-shrink:0}'
      + '#agenda-clp-ov .clp-foot-info{font-size:13px;color:#1F4A85;font-weight:600}'
      + '#agenda-clp-ov .clp-foot-info.muted{color:#9bb3d1}'
      + '#agenda-clp-ov .clp-act{padding:10px 22px;border-radius:999px;font-size:14px;font-weight:700;cursor:pointer;border:1.5px solid #53bda7;background:#53bda7;color:#fff;outline:none;font-family:inherit;display:inline-flex;align-items:center;gap:8px;transition:all .12s}'
      + '#agenda-clp-ov .clp-act:hover:not(:disabled){background:#46a892;border-color:#46a892}'
      + '#agenda-clp-ov .clp-act:disabled{opacity:.4;cursor:not-allowed}'
      + '#agenda-clp-ov .clp-spinner{display:inline-block;width:13px;height:13px;border:2px solid #e3edf9;border-top-color:#53bda7;border-radius:50%;animation:clp-spin .8s linear infinite}'
      + '@keyframes clp-spin{to{transform:rotate(360deg)}}'
      + '#agenda-clp-ov .clp-modal-overlay{position:absolute;inset:0;background:rgba(42,94,169,.35);z-index:10;display:flex;align-items:flex-start;justify-content:center;padding:16px;overflow-y:auto}'
      + '#agenda-clp-ov .clp-modal2{background:#fff;border-radius:14px;width:100%;max-width:700px;box-shadow:0 20px 60px rgba(0,0,0,.18);display:flex;flex-direction:column;max-height:calc(100% - 32px)}'
      + '#agenda-clp-ov .clp-modal2-header{padding:14px 20px;border-bottom:1px solid #eef2f8;display:flex;align-items:center;justify-content:space-between;flex-shrink:0}'
      + '#agenda-clp-ov .clp-modal2-title{font-size:16px;font-weight:800;margin:0;color:#1F4A85}'
      + '#agenda-clp-ov .clp-modal2-close{background:none;border:none;cursor:pointer;color:#9bb3d1;padding:4px;display:flex}'
      + '#agenda-clp-ov .clp-modal2-body{padding:16px 20px;overflow-y:auto;flex:1}'
      + '#agenda-clp-ov .clp-section{margin-bottom:18px}'
      + '#agenda-clp-ov .clp-section-title{font-size:11px;text-transform:uppercase;letter-spacing:.05em;color:#9bb3d1;margin:0 0 10px;font-weight:800}'
      + '#agenda-clp-ov .clp-grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px 14px}'
      + '#agenda-clp-ov .clp-grid .full{grid-column:1 / -1}'
      + '#agenda-clp-ov .clp-grid .two{grid-column:span 2}'
      + '#agenda-clp-ov .clp-modal2-footer{padding:12px 20px;border-top:1px solid #eef2f8;display:flex;justify-content:flex-end;gap:8px;flex-shrink:0}'
      + '#agenda-clp-ov .clp-modal2-error{color:#e24b4a;font-size:13px;padding:10px 13px;background:#fcebeb;border-radius:8px;margin-bottom:12px;border:1px solid #f5a5a5;font-weight:600}'
      + '#agenda-clp-ov .clp-dup{background:#fff8e8;border:1px solid #fac055;border-radius:10px;padding:14px;margin-bottom:14px;display:flex;flex-direction:column;gap:10px}'
      + '#agenda-clp-ov .clp-dup-head{display:flex;gap:10px;align-items:flex-start;color:#854f0b;font-weight:700}'
      + '#agenda-clp-ov .clp-dup-actions{display:flex;gap:8px;justify-content:flex-end}'
      + '#agenda-clp-ov .clp-checkbox{display:flex;align-items:center;gap:8px;font-size:13px;cursor:pointer;padding:8px 0}'
      + '#agenda-clp-ov .clp-ac{position:relative}'
      + '#agenda-clp-ov .clp-suggestions{position:absolute;top:calc(100% + 4px);left:0;right:0;background:#fff;border:1.5px solid #e2eaf5;border-radius:8px;box-shadow:0 6px 20px rgba(42,94,169,.12);z-index:20;max-height:240px;overflow-y:auto}'
      + '#agenda-clp-ov .clp-sg{padding:9px 12px;cursor:pointer;font-size:13px;border-bottom:.5px solid #f0f4fa}'
      + '#agenda-clp-ov .clp-sg:hover{background:#f2f6fc}'
      + '#agenda-clp-ov .clp-status{font-size:11px;color:#53bda7;margin-top:4px;display:inline-flex;align-items:center;gap:4px}'
      + '@media(max-width:640px){#agenda-clp-ov .clp-form{grid-template-columns:1fr 1fr}#agenda-clp-ov .clp-grid{grid-template-columns:1fr 1fr}#agenda-clp-ov .clp-table thead{display:none}#agenda-clp-ov .clp-table tbody tr{display:block;padding:10px 12px}#agenda-clp-ov .clp-table td{display:inline;padding:0 4px 0 0;font-size:12px}}'
      + '</style>';

    function fieldHtml(label, field, type, ph) {
      const val = st.filters[st.activeTab][field] || ''; const isDate = type === 'date';
      return '<div class="clp-field">' + (isDate ? '<label class="clp-label">' + ce(label) + '</label>' : '') + '<input class="clp-input" type="' + (type || 'text') + '" data-clp-field="' + ce(field) + '" value="' + ce(val) + '" placeholder="' + ce(ph || label) + '" /></div>';
    }
    function renderSelected() {
      const c = st.selectedClient;
      if (!c) return '<div class="clp-selected is-empty"><div class="clp-selicon">' + I_WARN + '</div><div><div class="clp-sellabel">Aucun client sélectionné</div><div class="clp-seldetail">Recherchez ou créez un client ci-dessous.</div></div></div>';
      const soc = c.idmultivu === 1 || c.idmultivu === '1';
      const detail = [c.IDVu ? 'ID ' + ce(c.IDVu) : '', c.EMAIL ? ce(c.EMAIL) : '', c.TEl_MOB ? ce(c.TEl_MOB) : '', [c.code_postal, c.ville].filter(Boolean).join(' ')].filter(Boolean).join(' · ');
      return '<div class="clp-selected"><div class="clp-selicon">' + (soc ? I_S : I_P) + '</div><div><div class="clp-sellabel">Client sélectionné</div><div class="clp-selname">' + ce(cname(c)) + '</div><div class="clp-seldetail">' + detail + '</div></div></div>';
    }
    function renderForm() {
      const tab = st.activeTab; let h = '<div class="clp-form">';
      if (tab === 'particulier') {
        h += fieldHtml('Nom', 'NOM') + fieldHtml('Prénom', 'PRENOM') + fieldHtml('Email', 'EMAIL') + fieldHtml('ID Client', 'IDVu') + '<div></div><div></div>';
        if (st.showMore) h += fieldHtml('Téléphone', 'tel') + fieldHtml('Ville', 'ville') + fieldHtml('Code postal', 'cp') + fieldHtml('Né(e) après le', 'birthMin', 'date') + fieldHtml('Né(e) avant le', 'birthMax', 'date') + fieldHtml('CSP', 'CSP') + fieldHtml('Marque véhicule', 'marque');
      } else {
        h += fieldHtml('SIRET', 'SIRET') + fieldHtml('Raison sociale', 'NOM') + fieldHtml('Email', 'EMAIL') + fieldHtml('ID Client', 'IDVu') + '<div></div><div></div>';
      }
      return h + '</div>';
    }
    function renderToolbar() {
      const total = Math.max(1, Math.ceil(st.totalCount / PAGE_SIZE));
      let h = '<div class="clp-toolbar"><div class="clp-tsec">';
      if (st.activeTab === 'particulier') h += '<button class="clp-more" data-clp-action="toggle-more">' + (st.showMore ? I_MINUS : I_PLUS) + '<span>' + (st.showMore ? 'Moins de critères' : 'Plus de critères') + '</span></button>';
      h += '</div><div class="clp-tsec" style="justify-content:center">';
      if (st.searched && st.totalCount > 0) {
        h += '<div class="clp-pager">';
        h += '<button class="clp-pager-item" data-clp-action="prev-page"' + (st.page <= 1 ? ' disabled' : '') + '>‹</button>';
        for (const it of pagerItems(st.page, total)) { if (it.ellipsis) h += '<span style="padding:0 4px;color:#acc5e4">…</span>'; else h += '<button class="clp-pager-item' + (it.page === st.page ? ' is-active' : '') + '" data-clp-action="page" data-page="' + it.page + '">' + it.page + '</button>'; }
        h += '<button class="clp-pager-item" data-clp-action="next-page"' + (st.page >= total ? ' disabled' : '') + '>›</button></div>';
      }
      h += '</div><div class="clp-tsec right"><div class="clp-btns">';
      h += '<button class="clp-btn clp-btn-ghost" data-clp-action="cancel">' + I_REFRESH + '<span>Annuler</span></button>';
      h += '<button class="clp-btn clp-btn-primary" data-clp-action="search">' + I_SEARCH + '<span>Rechercher</span></button>';
      return h + '</div></div></div>';
    }
    function renderTable() {
      if (st.loading) return '<div class="clp-empty">Chargement…</div>';
      if (st.error) return '<div class="clp-empty">Erreur : ' + ce(st.error) + '</div>';
      if (!st.searched) return '';
      if (!st.results.length) { const label = st.activeTab === 'societe' ? 'une société' : 'un particulier'; return '<div class="clp-empty">Aucun résultat.<br><br><button class="clp-btn clp-btn-primary" data-clp-action="create">' + I_PLUS + '<span>Créer ' + label + '</span></button></div>'; }
      const isSoc = st.activeTab === 'societe'; const selId = st.selectedClient ? String(st.selectedClient.IDVu) : null;
      let h = '<table class="clp-table"><thead><tr><th>ID</th><th>Nom</th><th>Adresse</th><th>Email</th><th>Tél.</th><th></th></tr></thead><tbody>';
      for (const r of st.results) {
        const fullName = isSoc ? [r.CIVILITE, r.NOM].filter(Boolean).join(' ') : [r.CIVILITE, r.NOM, r.PRENOM].filter(Boolean).join(' ');
        const cpVille = [r.code_postal, r.ville].filter(Boolean).join(' ') || r.CP_VILLE || '';
        const adr = [r.ADRESSE, cpVille, isSoc && r.SIRET ? String(r.SIRET) : ''].filter(Boolean).map(ce).join('<br>');
        let tel = ''; if (r.TEl_MOB) tel += '<div class="clp-tel-row">' + I_MOB + ' ' + ce(r.TEl_MOB) + '</div>'; if (r.TEL_FIXE) tel += '<div class="clp-tel-row">' + I_FIXE + ' ' + ce(r.TEL_FIXE) + '</div>';
        const picked = selId && String(r.IDVu) === selId;
        h += '<tr class="' + (picked ? 'is-picked' : '') + '" data-clp-action="pick-row" data-idvu="' + ce(r.IDVu) + '"><td>' + ce(r.IDVu) + '</td><td>' + ce(fullName) + '</td><td>' + adr + '</td><td>' + ce(r.EMAIL || '') + '</td><td>' + tel + '</td><td><span class="clp-pick-dot">' + I_CHECK + '</span></td></tr>';
      }
      return h + '</tbody></table>';
    }
    function renderFooter() {
      const dis = !st.selectedClient;
      let h = '<div class="clp-footer">';
      h += st.selectedClient ? '<div class="clp-foot-info">Client : <strong>' + ce(cname(st.selectedClient)) + '</strong></div>' : '<div class="clp-foot-info muted">Aucun client sélectionné</div>';
      h += '<button class="clp-act" data-clp-action="confirm"' + (dis ? ' disabled' : '') + '>' + I_CHECK + '<span>Sélectionner ce client</span></button>';
      return h + '</div>';
    }
    function mfield(label, field, type, opts) {
      opts = opts || {}; const val = st.modal.data[field]; const v = val == null ? '' : val; const cls = opts.gridClass ? 'clp-field ' + opts.gridClass : 'clp-field'; const req = opts.required ? ' <span style="color:#e24b4a">*</span>' : '';
      let inp;
      if (type === 'textarea') inp = '<textarea class="clp-input" data-clp-mfield="' + ce(field) + '" rows="3">' + ce(v) + '</textarea>';
      // Filet d'affichage (05/10/2026) : une valeur deja en base qui ne figure
      // pas dans la liste faisait retomber le select sur « Selectionner », et la
      // donnee disparaissait de l'ecran sans prevenir. On l'ajoute en option, avec
      // le libelle propre quand on sait la reconnaitre (casse, accents, point final),
      // sinon telle quelle. Rien n'est ecrit : l'utilisateur voit et corrige s'il veut.
      let _listeOD = (opts.options || []).slice();
      if (v != null && String(v) !== '' && !_listeOD.some(function (o) { return String(o.value) === String(v); })) {
        var _cleOD = function (s) { return String(s == null ? '' : s).toLowerCase()
          .normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]/g, ''); };
        var _procheOD = _listeOD.filter(function (o) { return _cleOD(o.value) === _cleOD(v) || _cleOD(o.label) === _cleOD(v); })[0];
        _listeOD = _listeOD.concat([{ value: v, label: _procheOD ? _procheOD.label : String(v) }]);
      }
      else if (type === 'select') { const o2 = _listeOD.map(o => '<option value="' + ce(o.value) + '"' + (String(o.value) === String(v) ? ' selected' : '') + '>' + ce(o.label) + '</option>').join(''); inp = '<select class="clp-input" data-clp-mfield="' + ce(field) + '"><option value="">—</option>' + o2 + '</select>'; }
      else if (type === 'checkbox') return '<div class="' + cls + '"><label class="clp-checkbox"><input type="checkbox" data-clp-mfield="' + ce(field) + '"' + (v ? ' checked' : '') + '/> <span>' + ce(label) + '</span></label></div>';
      else inp = '<input class="clp-input" type="' + (type || 'text') + '" data-clp-mfield="' + ce(field) + '" value="' + ce(v) + '" placeholder="' + ce(opts.placeholder || '') + '"/>';
      return '<div class="' + cls + '"><label class="clp-label">' + ce(label) + req + '</label>' + inp + '</div>';
    }
    function renderModal() {
      if (!st.modal) return ''; const m = st.modal; const isSoc = m.isSoc; let body = '';
      if (m.duplicate && window.oropraDoublons) { body += window.oropraDoublons.html(m.duplicate, 'clp', { saving: m.saving, libelleForce: 'Créer quand même' }); }
      if (m.error && !m.duplicate) body += '<div class="clp-modal2-error">' + ce(m.error) + '</div>';
      body += '<div class="clp-section"><div class="clp-section-title">Identité</div><div class="clp-grid">';
      if (isSoc) {
        body += mfield('Type', 'CIVILITE', 'select', { options: typesS.map(t => ({ value: t.libelle_court, label: t.libelle_court + ' — ' + t.libelle })) });
        body += '<div class="clp-field two"><label class="clp-label">SIRET / Raison sociale <span style="color:#e24b4a">*</span></label><div class="clp-ac"><input class="clp-input" type="text" data-clp-mfield="__siretQuery" value="' + ce(m.siretQuery || '') + '" placeholder="Rechercher SIRENE"/>' + (m.siretLoading ? '<div class="clp-status"><span class="clp-spinner"></span> Recherche SIRENE…</div>' : '') + (m.siretSuggestions && m.siretSuggestions.length ? '<div class="clp-suggestions">' + m.siretSuggestions.map((s, i) => '<div class="clp-sg" data-clp-action="pick-siret" data-idx="' + i + '"><strong>' + ce(s.raison_sociale || '') + '</strong><div style="font-size:11px;color:#9bb3d1">' + ce(s.siret || '') + ' — ' + ce(s.commune || '') + '</div></div>').join('') + '</div>' : '') + '</div></div>';
        body += mfield('Raison sociale', 'NOM', 'text', { gridClass: 'full', required: true });
      } else {
        body += mfield('Civilité', 'CIVILITE', 'select', { options: civilitesP.map(c => ({ value: c.libelle_court, label: c.libelle })), required: true });
        body += mfield('Nom', 'NOM', 'text', { required: true });
        body += mfield('Prénom', 'PRENOM', 'text', { required: true });
        body += mfield('Date de naissance', 'BIRTHDAY', 'date');
      }
      body += '</div></div><div class="clp-section"><div class="clp-section-title">Contact</div><div class="clp-grid">';
      body += mfield('Téléphone portable', 'TEl_MOB', 'text', { required: !isSoc });
      body += mfield('Téléphone fixe', 'TEL_FIXE');
      body += mfield('Email', 'EMAIL', 'text', { required: !isSoc });
      body += '</div></div><div class="clp-section"><div class="clp-section-title">Adresse</div><div class="clp-grid">';
      const verified = m.data.adresse_status === 'verified';
      body += '<div class="clp-field full"><label class="clp-label">Adresse</label><div class="clp-ac"><input class="clp-input" type="text" data-clp-mfield="__addressQuery" value="' + ce(m.addressQuery || m.data.ADRESSE || '') + '" placeholder="Tapez une adresse"/>' + (m.addressLoading ? '<div class="clp-status"><span class="clp-spinner"></span> Recherche…</div>' : (verified ? '<div class="clp-status">✓ Vérifiée (' + ce(m.data.adresse_source || '') + ')</div>' : '')) + (m.addressSuggestions && m.addressSuggestions.length ? '<div class="clp-suggestions">' + m.addressSuggestions.map((s, i) => '<div class="clp-sg" data-clp-action="pick-address" data-idx="' + i + '">' + ce(s.label || '') + '</div>').join('') + '</div>' : '') + '</div></div>';
      body += mfield('Code postal', 'code_postal');
      body += mfield('Ville', 'ville', 'text', { gridClass: 'two' });
      body += '</div></div>';
      if (!isSoc) {
        body += '<div class="clp-section"><div class="clp-section-title">Préférences</div><div class="clp-grid">' + mfield('Stop com', 'STOP_COM', 'checkbox') + mfield('NPAI', 'NPAI', 'select', { options: npaiOptions.map(o => ({ value: o, label: o })) }) + '</div></div>';
        body += '<div class="clp-section"><div class="clp-section-title">Commentaires</div><div class="clp-grid">' + mfield('Commentaires', 'COMMENTAIRE', 'textarea', { gridClass: 'full' }) + '</div></div>';
      }
      return '<div class="clp-modal-overlay" data-clp-action="close-modal-bg"><div class="clp-modal2"><div class="clp-modal2-header"><h2 class="clp-modal2-title">' + (isSoc ? 'Créer une société' : 'Créer un particulier') + '</h2><button class="clp-modal2-close" data-clp-action="close-modal">' + I_CLOSE + '</button></div><div class="clp-modal2-body">' + body + '</div><div class="clp-modal2-footer"><button class="clp-btn clp-btn-ghost" data-clp-action="close-modal">Annuler</button><button class="clp-btn clp-btn-primary" data-clp-action="save-modal"' + (m.saving ? ' disabled' : '') + '>' + (m.saving ? '<span class="clp-spinner"></span>' : I_PLUS) + '<span>' + (m.saving ? 'Enregistrement…' : 'Enregistrer') + '</span></button></div></div></div>';
    }

    function render() {
      const root = d.getElementById('agenda-clp-root'); if (!root) return;
      const active = d.activeElement;
      const af = active && active.getAttribute ? (active.getAttribute('data-clp-field') || active.getAttribute('data-clp-mfield')) : null;
      const ak = active && active.getAttribute && active.getAttribute('data-clp-mfield') ? 'm' : 'f';
      const ac = af && typeof active.selectionStart === 'number' ? active.selectionStart : null;
      root.innerHTML = STYLE + '<div class="clp-body">' + renderSelected() + '<div class="clp-tabs"><button class="clp-tab' + (st.activeTab === 'particulier' ? ' is-active' : '') + '" data-clp-action="tab" data-tab="particulier">' + I_P + '<span>Particulier</span></button><button class="clp-tab' + (st.activeTab === 'societe' ? ' is-active' : '') + '" data-clp-action="tab" data-tab="societe">' + I_S + '<span>Société</span></button></div>' + renderForm() + renderToolbar() + renderTable() + '</div>' + renderFooter() + renderModal();
      bindEvents();
      if (af) { const sel = ak === 'm' ? '[data-clp-mfield="' + af + '"]' : 'input[data-clp-field="' + af + '"]'; const next = root.querySelector(sel); if (next) { next.focus(); if (ac != null && next.setSelectionRange) try { next.setSelectionRange(ac, ac); } catch (e) {} } }
    }
    function bindEvents() {
      const root = d.getElementById('agenda-clp-root'); if (!root) return;
      root.querySelectorAll('[data-clp-action="tab"]').forEach(el => el.addEventListener('click', () => changeTab(el.getAttribute('data-tab'))));
      root.querySelectorAll('input[data-clp-field]').forEach(el => { el.addEventListener('input', () => { st.filters[st.activeTab][el.getAttribute('data-clp-field')] = el.value; }); el.addEventListener('keydown', e => { if (e.key === 'Enter') { st.page = 1; runSearch(); } }); });
      root.querySelectorAll('[data-clp-action="toggle-more"]').forEach(el => el.addEventListener('click', () => { st.showMore = !st.showMore; render(); }));
      root.querySelectorAll('[data-clp-action="cancel"]').forEach(el => el.addEventListener('click', clearFilters));
      root.querySelectorAll('[data-clp-action="search"]').forEach(el => el.addEventListener('click', () => { st.page = 1; runSearch(); }));
      root.querySelectorAll('[data-clp-action="prev-page"]').forEach(el => el.addEventListener('click', () => changePage(st.page - 1)));
      root.querySelectorAll('[data-clp-action="next-page"]').forEach(el => el.addEventListener('click', () => changePage(st.page + 1)));
      root.querySelectorAll('[data-clp-action="page"]').forEach(el => el.addEventListener('click', () => changePage(Number(el.getAttribute('data-page')))));
      root.querySelectorAll('[data-clp-action="create"]').forEach(el => el.addEventListener('click', openCreateModal));
      root.querySelectorAll('tr[data-clp-action="pick-row"]').forEach(el => el.addEventListener('click', () => { const r = st.results.find(r => String(r.IDVu) === el.getAttribute('data-idvu')); if (r) pickRow(r); }));
      root.querySelectorAll('[data-clp-action="confirm"]').forEach(el => el.addEventListener('click', () => { if (!st.selectedClient) return; const cli = st.selectedClient; closePicker(); if (typeof onPick === 'function') onPick(cli); }));
      root.querySelectorAll('[data-clp-action="close-modal"]').forEach(el => el.addEventListener('click', closeModal));
      root.querySelectorAll('[data-clp-action="close-modal-bg"]').forEach(el => el.addEventListener('click', e => { if (e.target === el) closeModal(); }));
      // v27 : le bouton reste verrouillé (rouge) tant que BACS n'est pas ouvert sur ce poste.
      root.querySelectorAll('[data-clp-action="save-modal"]').forEach(el => {
        el.addEventListener('click', () => { if (el.dataset.obcBloque === '1') return; saveCreation(); });
        const _m = st.modal;
        if (!_m || _m.isSoc) return;
        if (window.oropraBacsClient) window.oropraBacsClient.appliquer(el, _m);
        if (_m.__bacsSuivi) return;
        (window.__odBacsClientPret || (window.__odBacsClientPret = new Promise(function (ok) {
          if (window.oropraBacsClient) return ok(window.oropraBacsClient);
          var sc = document.createElement('script'); sc.src = 'https://cdn.jsdelivr.net/gh/oropra-apps/one-data-blocs@oropra-bacs-client-v6/oropra-bacs-client.js'; sc.async = true;
          sc.onload = function () { ok(window.oropraBacsClient || null); };
          sc.onerror = function () { window.__odBacsClientPret = null; ok(null); };
          document.head.appendChild(sc);
        }))).then(function (bc) {
          if (!bc || st.modal !== _m) return;
          bc.surveiller(supa(), _m, function () {
            const b = root.querySelector('[data-clp-action="save-modal"]'); if (b) bc.appliquer(b, _m);
          }, function () { return st.modal === _m; });
        });
      });
      root.querySelectorAll('[data-clp-action="dismiss-duplicate"], [data-od-action="dup-dismiss"]').forEach(el => el.addEventListener('click', dismissDuplicate));
      root.querySelectorAll('[data-clp-action="view-duplicate"], [data-od-action="dup-open"]').forEach(el => el.addEventListener('click', viewDuplicate));
      root.querySelectorAll('[data-od-action="dup-force"]').forEach(el => el.addEventListener('click', saveAnyway));
      root.querySelectorAll('[data-clp-action="pick-address"]').forEach(el => el.addEventListener('click', () => { const i = Number(el.getAttribute('data-idx')); if (st.modal && st.modal.addressSuggestions[i]) applyAddr(st.modal.addressSuggestions[i]); }));
      root.querySelectorAll('[data-clp-action="pick-siret"]').forEach(el => el.addEventListener('click', () => { const i = Number(el.getAttribute('data-idx')); if (st.modal && st.modal.siretSuggestions[i]) applySiret(st.modal.siretSuggestions[i]); }));
      root.querySelectorAll('[data-clp-mfield]').forEach(el => {
        const field = el.getAttribute('data-clp-mfield');
        if (field === '__addressQuery') { el.addEventListener('input', () => onAddr(el.value)); return; }
        if (field === '__siretQuery') { el.addEventListener('input', () => onSiret(el.value)); return; }
        if (el.tagName === 'SELECT') el.addEventListener('change', () => updMField(field, el.value));
        else if (el.type === 'checkbox') el.addEventListener('change', () => updMField(field, el.checked));
        else el.addEventListener('input', () => updMField(field, el.value));
      });
    }
    function closePicker() { const o = d.getElementById('agenda-clp-ov'); if (o) o.remove(); }

    let ov = d.getElementById('agenda-clp-ov'); if (ov) ov.remove();
    ov = d.createElement('div'); ov.id = 'agenda-clp-ov';
    ov.innerHTML = '<div class="clp-modal"><div class="clp-hd"><span class="clp-hd-title">Sélectionner un client</span><button type="button" class="clp-hd-x" id="clp-close">' + I_CLOSE + '</button></div><div class="clp-root" id="agenda-clp-root"></div></div>';
    (d.body || d.documentElement).appendChild(ov);
    ov.addEventListener('mousedown', e => { if (e.target === ov && !st.modal) closePicker(); });
    d.getElementById('clp-close').addEventListener('click', closePicker);
    render();
  }
  // Une bilatérale se tient avec un SUBORDONNÉ : même source de vérité que
  // le sélecteur d'agenda. Lire window.__dash ici proposait d'évaluer un
  // collègue de même niveau (corrigé le 21/08/2026).
  function bilatVendeurs() {
    const v = collaborateursVisibles();
    return v ? v.filter(x => !x.est_moi).map(x => ({ id: x.id, nom: x.nom })).sort(sortNom) : [];
  }
  function bilatVendeurGroups() {
    const v = collaborateursVisibles();
    if (!v) return [];
    const moi = v.find(x => x.est_moi);
    // On ne s'évalue pas soi-même : la liste proposait le chef en tête
    // (recette Team Colin 07/10/2026, AGD-08). La base refuse aussi.
    // v25 : seuls les vendeurs suivis par l'accueil (présents dans dash_lire ce
    // mois-ci ou le mois dernier) — les comptes inactifs ne sont plus proposés.
    // Le vendeur déjà choisi (modification) reste toujours dans la liste.
    const garde = x => Number(x.id_role) !== 4 || !actifsBilat || !actifsBilat.size || actifsBilat.has(Number(x.id_user != null ? x.id_user : x.id)) || String(x.id) === String(cs && cs.bilatUser);
    return groupeParFonction(v.filter(x => !x.est_moi && garde(x)), moi ? moi.id_user : null)
      .map(g => ({ label: g.label, items: g.items }))
      .filter(g => g.items && g.items.length);
  }
  // Résumé des bilatérales par vendeur visible (bilat_resume_vendeurs) :
  // dernière réalisée, prochaine programmée, nombre en retard. Chargé à
  // l'ouverture de la fenêtre, gardé une minute. Absent (SQL non appliqué) :
  // la liste reste celle de la v20, sans annotation.
  let resumeBilat = null, resumeBilatT = 0, resumeBilatEnVol = false;
  let actifsBilat = null, actifsBilatT = 0;
  function chargerActifsBilat(c) {
    if (actifsBilat && Date.now() - actifsBilatT < 600000) return;
    const now = new Date(), prev = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lire = d => Promise.resolve(c.rpc('dash_lire', { p_annee: d.getFullYear(), p_mois: d.getMonth() + 1 })).catch(() => ({ error: true }));
    Promise.all([lire(now), lire(prev)]).then(rs => {
      const set = new Set();
      rs.forEach(r => { if (r && !r.error && r.data) ((r.data.vendeurs || []).concat(r.data.etat || [])).forEach(l => { if (l && l.id_user != null) set.add(Number(l.id_user)); }); });
      if (!set.size) return;                       // pas de tableau de bord : on garde toute la liste
      actifsBilat = set; actifsBilatT = Date.now();
      if (cs && cs.mode === 'bilat' && frontDoc().getElementById('agenda-ov')) { syncInputs(); renderCreate(); }
    });
  }
  function chargerResumeBilat() {
    try { const c0 = sb(); if (c0) chargerActifsBilat(c0); } catch (e) {}
    if (resumeBilatEnVol || (resumeBilat && Date.now() - resumeBilatT < 60000)) return;
    const c = sb(); if (!c) return;
    resumeBilatEnVol = true;
    Promise.resolve(c.rpc('bilat_resume_vendeurs')).then(({ data, error }) => {
      if (error) { console.warn('[agenda] bilat_resume_vendeurs', error.message || error); return; }
      const m = {}; (data || []).forEach(r => { m[Number(r.id_user)] = r; });
      resumeBilat = m; resumeBilatT = Date.now();
      if (cs && cs.mode === 'bilat' && frontDoc().getElementById('agenda-ov')) { syncInputs(); renderCreate(); }
    }).catch(e => console.warn('[agenda] bilat_resume_vendeurs', e)).finally(() => { resumeBilatEnVol = false; });
  }
  function joursDepuis(ts) {
    if (!ts) return null;
    const d = new Date(String(ts).slice(0, 10) + 'T12:00:00'); if (isNaN(d)) return null;
    const a = new Date(); a.setHours(12, 0, 0, 0);
    return Math.max(0, Math.round((a - d) / 86400000));
  }
  function jjmm(ts) { const t = String(ts || ''); return t.length >= 10 ? t.slice(8, 10) + '/' + t.slice(5, 7) : ''; }
  // Plus c'est haut, plus il faut recevoir ce vendeur : en retard, puis
  // jamais reçu, puis ancienneté de la dernière. Un RDV déjà programmé passe
  // derrière : l'action est prise.
  function urgenceBilat(id) {
    const r = resumeBilat && resumeBilat[Number(id)];
    if (!r) return 500;                                  // aucune bilatérale du tout = jamais reçu
    if (r.prochaine) return -1;
    let u = (Number(r.nb_retard) || 0) > 0 ? 1000 : 0;
    const j = joursDepuis(r.derniere);
    u += j == null ? 500 : Math.min(j, 400);
    return u;
  }
  function libelleVendeurBilat(v) {
    const nom = String(v.nom || '');
    if (!resumeBilat) return nom;
    const r = resumeBilat[Number(v.id)];
    if (!r) return nom + ' \u00b7 jamais re\u00e7u';
    const bits = [];
    if (r.prochaine) bits.push('pr\u00e9vue le ' + jjmm(r.prochaine));
    else if (r.derniere) { const j = joursDepuis(r.derniere); bits.push('derni\u00e8re ' + (j === 0 ? 'aujourd\u2019hui' : 'il y a ' + j + ' j')); }
    else bits.push('jamais re\u00e7u');
    if ((Number(r.nb_retard) || 0) > 0) bits.push(r.nb_retard + ' en retard');
    return ((Number(r.nb_retard) || 0) > 0 ? '\u26a0 ' : '') + nom + ' \u00b7 ' + bits.join(' \u00b7 ');
  }
  // Site d'une bilatérale : celui de la barre du haut s'il est unique et que
  // le vendeur y est rattaché, sinon le site du vendeur. Avec « Tout mon
  // périmètre », la bilatérale partait sans site et n'apparaissait pas sur
  // la page Bilatérales (filtrée par site).
  function siteBilat(idUser) {
    const lignes = (perimRows() || []).filter(r => String(r.id_user) === String(idUser) && r.id_site != null);
    const top = siteIds();
    if (top && top.length === 1 && (!lignes.length || lignes.some(r => Number(r.id_site) === Number(top[0])))) return Number(top[0]);
    return lignes.length ? Number(lignes[0].id_site) : (top && top.length === 1 ? Number(top[0]) : null);
  }
  function nomVendeurBilat(id) {
    const v = (collaborateursVisibles() || []).find(x => String(x.id) === String(id));
    return v ? v.nom : '';
  }
  function libQuand(startStr) {
    const t = String(startStr || ''); if (t.length < 16) return t;
    const d = new Date(t.slice(0, 10) + 'T12:00:00');
    return d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' }) + ' \u00e0 ' + t.slice(11, 13) + 'h' + t.slice(14, 16);
  }
  const pad2 = (n) => String(n).padStart(2, '0');
  function endStrFrom(date, time, mins) { const [Y, Mo, D] = date.split('-').map(Number); const [h, mi] = time.split(':').map(Number); const dt = new Date(Y, Mo - 1, D, h, mi); dt.setMinutes(dt.getMinutes() + Number(mins)); return dt.getFullYear() + '-' + pad2(dt.getMonth() + 1) + '-' + pad2(dt.getDate()) + ' ' + pad2(dt.getHours()) + ':' + pad2(dt.getMinutes()) + ':00'; }
  function fmtDuree(min) { min = Number(min) || 0; const h = Math.floor(min / 60), m = min % 60; if (h === 0) return m + ' min'; if (m === 0) return h + 'h'; return h + 'h ' + m + ' min'; }

  let cs = null; // \u00e9tat cr\u00e9ation / \u00e9dition
  // =========================================================================
  //  COMPTE RENDU DE RENDEZ-VOUS
  //
  //  Avant : un rendez-vous disparaissait de l'agenda quand son heure etait
  //  passee. Le TEMPS le soldait, pas un acte — et personne, dans One Data, ne
  //  savait dire si un client etait venu. Mesure du 02/10/2026 : 9 135
  //  rendez-vous passes, AUCUN avec un compte rendu.
  //
  //  Trois principes :
  //
  //  1. ON NE DEMANDE PAS CE QU'ON PEUT SAVOIR. rdv_preuve cherche d'abord un
  //     appel decroche autour du creneau. S'il en trouve un, la question « ca a
  //     eu lieu ? » ne se pose pas : la fiche l'affiche, exactement comme la
  //     fiche client l'affiche, et passe directement a la suite.
  //
  //  2. UNE SEULE ECHELLE, DU SIGNE AU PERDU. Pas « issue » puis
  //     « temperature » : un vendeur ne raisonne pas en deux temps. Six degres,
  //     et c'est le degre qui FIXE LA CADENCE de relance. On ne choisit pas une
  //     date, on dit ou en est le client.
  //
  //  3. LES LIVRAISONS N'Y SONT PAS. Elles sont tenues par les secretaires de
  //     livraison, et un vehicule livre est un vehicule facture : BACS porte
  //     deja la date. rdv_famille les ecarte.
  // =========================================================================
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
  async function openCompteRendu(ev) {
    const p = ev.extendedProps || {};
    const fam = crFamille(p.id_rdv_type);
    if (fam === 'livraison') {
      showAgError('Les livraisons se soldent sur la facturation.',
                  'Elles sont tenues par les secrétaires de livraison : un véhicule livré est un véhicule facturé.');
      return;
    }
    crs = {
      idRdv: p.origin_id, idClient: (p.id_client != null ? Number(p.id_client) : null),
      famille: fam,
      client: [p.civilite, p.nom, p.prenom].filter(Boolean).join(' ').trim()
              || ('Client ' + (p.id_client != null ? p.id_client : '')),
      type: ev.title || '', quand: ev.startStr || p.event_start_time || '',
      deja: !!p.status,                 // status = TRAITE, pose par get_calendar_events
      __ev: ev,
      preuve: null, chargement: true,
      issue: 'vu', deg: null, relance: null, motif: CR_MOTIFS[0],
      comment: '', saving: false, err: '', avis: ''
    };
    renderCR();
    try {
      const { data, error } = await sb().rpc('rdv_preuve', { p_id_rdv: Number(crs.idRdv) });
      // Le socle SQL du compte rendu (rdv_preuve, rdv_conclure, rdv_famille)
      // n'existe pas encore partout. La ou il manque, on referme sans bruit et
      // le clic sur un creneau passe ne fait rien — exactement le comportement
      // d'avant. Un module de flotte ne doit jamais supposer que sa base a
      // recu la migration.
      if (error && (error.code === 'PGRST202'
                    || /rdv_preuve/.test(error.message || ''))) {
        closeCR(); return;
      }
      if (error) throw error;
      crs.preuve = data || null;
      // Le bucket des enregistrements est PRIVE : l'URL doit etre signee, comme
      // dans la fiche client.
      const a = crs.preuve && crs.preuve.appel;
      if (a && a.recording_url) {
        try {
          const chemin = String(a.recording_url).split('/call-recordings/').pop();
          const r = await sb().storage.from('call-recordings').createSignedUrl(chemin, 3600);
          if (r && r.data && r.data.signedUrl) a.url_signee = r.data.signedUrl;
        } catch (e) { /* pas d'audio : le reste de la fiche tient debout */ }
      }
    } catch (e) { console.error('[agenda] rdv_preuve', e); }
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
    const d = frontDoc(); let ov = d.getElementById('agenda-ov');
    if (!ov) {
      ov = d.createElement('div'); ov.id = 'agenda-ov';
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
    const d = frontDoc();
    const c = d.getElementById('cr-com'); if (c) crs.comment = c.value;
    const dd = d.getElementById('cr-date'); if (dd) crs.dateLibre = dd.value;
    const hh = d.getElementById('cr-heure'); if (hh) crs.heureLibre = hh.value;
  }

  function wireCR() {
    const d = frontDoc(); const g = (id) => d.getElementById(id);
    if (g('cr-x')) g('cr-x').addEventListener('click', closeCR);
    d.querySelectorAll('#agenda-ov [data-cri]').forEach(b => b.addEventListener('click', () => {
      crSync(); crs.issue = b.getAttribute('data-cri'); crs.relance = null; crs.err = ''; renderCR(); }));
    d.querySelectorAll('#agenda-ov [data-cre]').forEach(b => b.addEventListener('click', () => {
      crSync(); crs.deg = b.getAttribute('data-cre'); crs.relance = null; renderCR(); }));
    d.querySelectorAll('#agenda-ov [data-crm]').forEach(b => b.addEventListener('click', () => {
      crSync(); crs.motif = b.getAttribute('data-crm'); renderCR(); }));
    d.querySelectorAll('#agenda-ov [data-crj]').forEach(b => b.addEventListener('click', () => {
      crSync(); crs.relance = b.getAttribute('data-crj'); renderCR(); }));
    if (g('cr-corriger')) g('cr-corriger').addEventListener('click', () => {
      crSync(); crs.corrige = true; crs.relance = null; renderCR(); });
    if (g('cr-deplacer')) g('cr-deplacer').addEventListener('click', () => {
      // Deplacer, c'est l'affaire de l'agenda : on referme et on laisse la main
      // au glisser-deposer, qui sait deja le faire.
      // v41 : ouvre la fenêtre de modification (date, heure, type, commentaire).
      const evCr = crs && crs.__ev;
      closeCR();
      if (evCr) openEdit(evCr, true);
      else showAgError('Déplacez le rendez-vous directement dans l’agenda.',
                       'Faites-le glisser sur son nouveau créneau : il garde son identité et redevient à venir.');
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
      a.play().catch(e => console.warn('[agenda] audio', e));
    });
    if (g('cr-tg')) g('cr-tg').addEventListener('click', () => {
      const f = g('cr-full'); if (!f) return;
      const ouvert = f.style.display !== 'none' && f.style.display !== '';
      f.style.display = ouvert ? 'none' : 'block';
      g('cr-tg').innerHTML = ouvert ? '▸ voir plus' : '▸ voir moins';
    });
  }

  function closeCR() {
    const o = frontDoc().getElementById('agenda-ov'); if (o) o.remove();
    crs = null;
    try { calendar && calendar.unselect(); } catch (e) {}
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
      const { data, error } = await sb().rpc('rdv_conclure', {
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
      refetch();                            // le compte rendu et sa relance entrent dans l'agenda
      try {
        const w = (wwLib.getFrontWindow && wwLib.getFrontWindow()) || window;
        if (typeof w.oropraNotifBadgeRefresh === 'function') w.oropraNotifBadgeRefresh();
      } catch (e2) {}
    } catch (err) {
      console.error('[agenda] rdv_conclure', err);
      crs.saving = false;
      crs.err = (err && err.message) ? err.message : 'Enregistrement impossible.';
      renderCR();
    }
  }

  function closeCreate() { clearTimeout(bacsSuiviT); const o = frontDoc().getElementById('agenda-ov'); if (o) o.remove(); cs = null; try { calendar && calendar.unselect(); } catch (e) {} }
  // v39 : règle de répétition par défaut — le jour de la date, chaque semaine, 4 semaines.
  function isoJour(dstr) { const a = String(dstr || '').split('-').map(Number); const d = new Date(a[0], (a[1] || 1) - 1, a[2] || 1); return ((d.getDay() + 6) % 7) + 1; }
  function plusJours(dstr, n) { const a = String(dstr || '').split('-').map(Number); const d = new Date(a[0], (a[1] || 1) - 1, (a[2] || 1) + n); return ymd(d); }
  function repDefaut(dstr) { return { on: false, jours: dstr ? [isoJour(dstr)] : [1], intervalle: 1, au: dstr ? plusJours(dstr, 27) : '' }; }
  const JOURS_REP = [[1, 'L', 'lundi'], [2, 'M', 'mardi'], [3, 'M', 'mercredi'], [4, 'J', 'jeudi'], [5, 'V', 'vendredi'], [6, 'S', 'samedi'], [7, 'D', 'dimanche']];
  // v44 : demande d'ouverture posée par la fiche client (onglet RDV) — fraîche de moins de 2 min.
  function ouvrirDemandeFiche() {
    let dm = null;
    try { const W = frontWin(); dm = W.__odAgendaCreer; W.__odAgendaCreer = null; } catch (e) {}
    if (!dm || !dm.at || Date.now() - dm.at > 120000 || lectureSeule()) return;
    setTimeout(() => {
      const h = prochainCreneau(), j = agToday();
      const start = (h >= '19:00' || h < '08:00') ? (h < '08:00' ? j + 'T08:00:00' : null) : j + 'T' + h + ':00';
      if (start) openCreate({ startStr: start, start: null, end: null }, { mode: 'rdv' });
      else {
        const d = new Date(); d.setDate(d.getDate() + 1); if (d.getDay() === 0) d.setDate(d.getDate() + 1);
        openCreate({ startStr: ymd(d) + 'T09:00:00', start: null, end: null }, { mode: 'rdv' });
      }
    }, 300);
  }
  // v41 : prochain créneau libre aujourd'hui (quart d'heure suivant, +10 min de marge).
  function prochainCreneau() { const d = new Date(Date.now() + 10 * 60000); const m = Math.ceil(d.getMinutes() / 15) * 15; d.setMinutes(m, 0, 0); return String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); }
  function openCreate(sel, opts) {
    opts = opts || {};
    // v41 : un clic sur un JOUR (vue Mois) n'a pas d'heure — on propose un créneau par défaut.
    if (sel && sel.startStr && !/T\d\d:\d\d/.test(sel.startStr)) {
      const j = sel.startStr.slice(0, 10);
      if (j < agToday()) { try { calendar && calendar.unselect(); } catch (e) {} hideTip(); showAgError('Impossible de placer un \u00e9v\u00e9nement dans le pass\u00e9.', 'Choisis un jour \u00e0 partir d\u2019aujourd\u2019hui.'); return; }
      let h = j === agToday() ? prochainCreneau() : '09:00';
      if (j === agToday() && h < '08:00') h = '08:00';
      if (j === agToday() && h >= '23:45') { showAgError('La journée est terminée.', 'Choisis un autre jour.'); return; }
      sel = { startStr: j + 'T' + h + ':00', start: null, end: null };
    }
    if (isPastSlot(sel.startStr || '')) { try { calendar && calendar.unselect(); } catch (e) {} hideTip(); showAgError('Impossible de placer un \u00e9v\u00e9nement dans le pass\u00e9.', 'Choisis un cr\u00e9neau \u00e0 partir de maintenant.'); return; }
    const startStr = sel.startStr || '';
    const date = startStr.slice(0, 10) || '';
    const time = (startStr.slice(11, 16)) || '09:00';
    // Un clic sélectionne une case de 30 min : durée par défaut 1 h. Une
    // plage tirée à la souris (plus d'une case) garde sa longueur.
    let dur = DUREE_DEFAUT; if (sel.end && sel.start) { const d = Math.round((sel.end - sel.start) / 60000); if (d > 30) dur = d; }
    const proprio0 = vueSite() ? Number(CACHED_UID) : Number(currentCollabId());
    // v44 : depuis la grille, « Créneau libre » (type Autre) par défaut ; depuis la fiche client, RDV client.
    const modeDefaut = opts.mode || 'creneau';
    cs = { editing: false, editId: null, idRpv: null, mode: modeDefaut, date, time, dur, idClient: null, clientLabel: '', client: null, origine: ORIGINES[0], physique: true, rdvType: null, creneauType: modeDefaut === 'creneau' ? 7 : null, bilatUser: null, bilatNom: '', comment: '', saving: false, err: '', invites: [], invitesInit: [], owner: proprio0, ownerInit: proprio0, rep: repDefaut(date) };
    chargerInvitables().then(() => { if (cs) renderCreate(); });
    chargerMembresPour(siteCourant()).then(() => { if (cs) renderCreate(); });
    chargerAgendaBacs().then(() => { if (cs) { renderCreate(); suivreBacs(); } });
    const navCli = wwVal(CFG.selectedClientVar);
    if (navCli && typeof navCli === 'object' && navCli.IDVu != null) { cs.idClient = Number(navCli.IDVu); cs.clientLabel = clientLabel(navCli); cs.client = navCli; }
    chargerResumeBilat();
    loadRdvTypes().then(renderCreate);
    renderCreate();
  }
  // Ouverture en \u00c9DITION depuis un clic sur un event existant.
  function openEdit(ev, forcer) {
    const p = ev.extendedProps || {};
    const st = String(p.source_type || '');
    if (st === 'bilat' && !p.can_edit) return;            // bilat\u00e9rale : lecture seule c\u00f4t\u00e9 vendeur
    // v29 : RDV BACS neutre — miroir de BACS, il se modifie dans BACS.
    if (estNeutre(p)) {
      showAgError(composeTitle(p) || 'Activité BACS', 'Ce créneau vient de l\u2019agenda BACS (activité hors vente). Il est affiché pour information et se modifie dans BACS.');
      return;
    }
    // PASSE : la modale d'edition refusait, et le clic ne faisait rien. Il
    // ouvre desormais le COMPTE RENDU — a venir on modifie, passe on conclut.
    // Un creneau sans client n'a rien a conclure. Une bilaterale passee
    // ouvre sa fiche de realisation (v21) : avant, le clic restait muet.
    // v41 : un rendez-vous passé AVEC client et pas encore conclu ouvre le
    // compte rendu ; tout autre événement passé s'ouvre en modification.
    if (!forcer && (isPastSlot(ev.startStr || '') || isPastSlot(p.event_start_time || ''))) {
      if (st === 'rdv' && resteAConclure(p)) { openCompteRendu(ev); return; }
      if (st === 'bilat') { openBilatPassee(ev); return; }
    }
    if (st !== 'rdv' && st !== 'bilat') return;            // rpv : non \u00e9ditable ici
    // v28 : RDV d'un collègue où l'on est invité — lecture seule.
    if (st === 'rdv' && p.can_edit === false) {
      const x = p.extra || {};
      showAgError('Vous êtes invité à ce rendez-vous', 'Il appartient à ' + (x.proprietaire || 'un collègue') + ' : seul son propriétaire peut le modifier.');
      return;
    }
    const date = (ev.startStr || '').slice(0, 10) || '';
    const time = (ev.startStr || '').slice(11, 16) || '09:00';
    let dur = 30; if (ev.end && ev.start) { const d = Math.round((ev.end - ev.start) / 60000); if (d >= 15) dur = d; }
    const isCreneau = st === 'rdv' && !(Number(p.id_client) > 0);
    cs = {
      editing: true, editId: p.origin_id, idRpv: (p.id_rpv != null ? Number(p.id_rpv) : null),
      mode: st === 'bilat' ? 'bilat' : (isCreneau ? 'creneau' : 'rdv'),
      date, time, dur,
      idClient: (p.id_client != null ? Number(p.id_client) : null),
      clientLabel: [p.civilite, p.nom, p.prenom].filter(Boolean).join(' ').trim(),
      client: null, origine: ORIGINES[0], physique: (Number(p.id_rdv_type) === 5),
      rdvType: (p.id_rdv_type != null ? Number(p.id_rdv_type) : null),
      creneauType: (p.id_rdv_type != null ? Number(p.id_rdv_type) : null),
      bilatUser: (st === 'bilat' && p.id_user != null ? Number(p.id_user) : null),
      bilatNom: (st === 'bilat' ? (ev.title || '').replace(/^Bilat\s*/i, '') : ''),
      comment: (st === 'bilat' ? '' : (p.description || '')), saving: false, err: '',
      invites: ((p.extra && Array.isArray(p.extra.invites)) ? p.extra.invites : []).map(Number),
      invitesInit: ((p.extra && Array.isArray(p.extra.invites)) ? p.extra.invites : []).map(Number),
      idBacs: (p.extra && p.extra.id_bacs) || null, sync: null, serieId: (p.extra && p.extra.serie_id) || null, startInit: String(p.event_start_time || '').slice(0, 19),
      owner: (st === 'rdv' && p.id_user != null) ? Number(p.id_user) : null,
      ownerInit: (st === 'rdv' && p.id_user != null) ? Number(p.id_user) : null,
      ownerNom: (p.extra && p.extra.proprietaire) || '',
      idSite: (p.id_site != null ? Number(p.id_site) : null)
    };
    chargerInvitables().then(() => { if (cs) renderCreate(); });
    if (st === 'rdv') chargerMembresPour(p.id_site != null ? Number(p.id_site) : siteCourant()).then(() => { if (cs) renderCreate(); });
    chargerAgendaBacs().then(() => { if (!cs) return; renderCreate(); suivreBacs(); if (st === 'rdv') chargerEtatSync(p.origin_id); });
    if (st === 'bilat') chargerResumeBilat();
    loadRdvTypes().then(renderCreate);
    renderCreate();
  }
  // Bilatérale dont l'heure est passée : on ne la déplace plus, on la mène.
  function openBilatPassee(ev) {
    const p = ev.extendedProps || {};
    const d = frontDoc(); let ov = d.getElementById('agenda-ov');
    if (!ov) { ov = d.createElement('div'); ov.id = 'agenda-ov'; (d.body || d.documentElement).appendChild(ov); ov.addEventListener('mousedown', (e) => { if (e.target === ov) closeCreate(); }); }
    const quand = String(ev.startStr || p.event_start_time || '');
    const jour = quand ? new Date(quand.slice(0, 10) + 'T12:00:00') : null;
    const qui = (ev.title || '').replace(/^Bilat\s*/i, '') || 'collaborateur';
    ov.innerHTML = '<div class="agm"><div class="agm-head"><span class="agm-title">Bilatérale</span><button class="agm-x" id="agm-x">×</button></div>'
      + '<div class="agm-body"><div class="agm-cr-head"><div class="agm-cr-when">'
      + (jour ? esc(jour.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' })) : '') + '<small>' + esc(quand.slice(11, 16).replace(':', 'h')) + '</small></div>'
      + '<div class="agm-cr-who"><b>' + esc(qui) + '</b><span>L’heure est passée : il reste à saisir le compte rendu et les engagements.</span></div></div></div>'
      + '<div class="agm-foot"><button class="agm-save" id="agm-mener">Compléter le compte rendu</button></div></div>';
    d.getElementById('agm-x').addEventListener('click', closeCreate);
    d.getElementById('agm-mener').addEventListener('click', () => goBilaterale(p.origin_id, false));
  }

  const TITLES = { rdv: 'Nouveau RDV Client', creneau: 'Nouveau Cr\u00e9neau', bilat: 'Nouvelle Bilat\u00e9rale' };
  const TITLES_EDIT = { rdv: 'Modifier le RDV', creneau: 'Modifier le cr\u00e9neau', bilat: 'Modifier la bilat\u00e9rale' };
  function popTitle() {
    if (cs.mode === 'bilat') return (cs.editing ? TITLES_EDIT : TITLES).bilat;
    const n = NATURES_SAISIE.find(x => x.cle === natureDe(cs));
    if (!cs.editing) return 'Nouvel événement';
    return 'Modifier \u00b7 ' + (n ? n.label : 'événement');
  }
  // v35 : fenêtre de saisie refondue. On choisit d'abord QUOI (la nature, en
  // pastilles de couleur), puis POUR QUI et QUAND, côte à côte ; le client et
  // l'origine n'apparaissent que pour un RDV client. Plus de défilement sur
  // ordinateur : deux colonnes, l'origine en menu au lieu de six boutons.
  const NATURES_SAISIE = [
    { cle: 'rdv',       label: 'RDV client',       mode: 'rdv' },
    { cle: 'livraison', label: 'Livraison',        mode: 'creneau', type: 4 },
    { cle: 'prepa',     label: 'Préparation',      mode: 'creneau', type: 12 },
    { cle: 'recep',     label: 'Réception / restit.', mode: 'creneau', type: 13 },
    { cle: 'bloque',    label: 'Pas de livraison', mode: 'creneau', type: 14 },
    { cle: 'absence',   label: 'Absence',          mode: 'creneau', type: 15 },
    { cle: 'creneau',   label: 'Créneau libre',    mode: 'creneau' },
    { cle: 'bilat',     label: 'Bilatérale',       mode: 'bilat' },
  ];
  const TYPES_NATURE = { 4: 'livraison', 12: 'prepa', 13: 'recep', 14: 'bloque', 15: 'absence' };
  function natureDe(c) {
    if (c.mode === 'bilat') return 'bilat';
    if (c.mode === 'rdv') return (c.editing && TYPES_NATURE[Number(c.rdvType)]) || 'rdv';
    return TYPES_NATURE[Number(c.creneauType)] || 'creneau';
  }
  function choisirNature(cle) {
    const n = NATURES_SAISIE.find(x => x.cle === cle); if (!n) return;
    cs.mode = n.mode; cs.err = '';
    if (n.mode === 'creneau') cs.creneauType = n.type != null ? n.type : (TYPES_NATURE[Number(cs.creneauType)] ? null : cs.creneauType);
  }
  function couleurNature(cle) { return cle === 'rdv' ? CFG.colors.client : (CFG.colors[cle] || CFG.colors.creneau); }
  function bodyHtml() {
    const ed = cs.editing;
    const nat = natureDe(cs);
    // Nature : en création, toutes ; en modification, on peut changer de
    // nature de créneau, pas passer d'un créneau à un RDV client ou l'inverse.
    const offertes = !ed ? NATURES_SAISIE : (cs.mode === 'creneau' ? NATURES_SAISIE.filter(n => n.mode === 'creneau') : []);
    const chips = offertes.length ? '<div class="agm-nat">' + offertes.map(n => {
      const c = couleurNature(n.cle), on = n.cle === nat;
      return '<button type="button" data-nat="' + n.cle + '" class="' + (on ? 'on' : '') + '" style="' + (on ? 'background:' + c + ';border-color:' + c + ';color:#fff' : '--c:' + c) + '"><i style="background:' + (on ? '#fff' : c) + '"></i>' + esc(n.label) + '</button>';
    }).join('') + '</div>' : '';

    const quand = '<div class="agm-cell"><div class="agm-lbl">Quand</div><div class="agm-row agm-quand">'
      + '<input type="date" class="agm-inp" id="agm-date" min="' + esc(agToday()) + '" value="' + esc(cs.date) + '">'
      + '<input type="time" class="agm-inp" id="agm-time" value="' + esc(cs.time) + '" step="900">'
      + '<select class="agm-sel" id="agm-dur" title="Durée">' + optionsDuree(cs.dur) + '</select>'
      + '</div></div>';

    let qui = '';
    if (cs.mode === 'bilat') {
      const grp = bilatVendeurGroups();
      const res = resumeBilat;
      const tri = (a, b) => urgenceBilat(b.id) - urgenceBilat(a.id) || String(a.nom).localeCompare(String(b.nom), 'fr');
      qui = '<div class="agm-cell"><div class="agm-lbl">Vendeur évalué</div><select class="agm-sel agm-w" id="agm-bvend"><option value="">— choisir —</option>'
        + grp.map(g => '<optgroup label="' + esc(g.label) + '">' + g.items.slice().sort(res ? tri : () => 0).map(v => '<option value="' + v.id + '"' + (String(v.id) === String(cs.bilatUser) ? ' selected' : '') + '>' + esc(libelleVendeurBilat(v)) + '</option>').join('') + '</optgroup>').join('')
        + '</select>' + (res ? '<div class="agm-hint">⚠ = bilatérale en retard ; les vendeurs à recevoir sont en tête.</div>' : '') + '</div>';
    } else if (cs.owner != null) {
      const aide = cs.editing && Number(cs.owner) !== Number(cs.ownerInit) ? 'Passera dans l’agenda de cette personne, ici et dans BACS.'
        : (!ed && nat === 'livraison') ? 'Le metteur en main ; vous y serez invité.'
        : (!ed && nat === 'prepa') ? 'Celui qui la demande, comme dans BACS : elle sort au planning du préparateur (bouton Planning).'
        : '';
      qui = '<div class="agm-cell"><div class="agm-lbl">Dans l’agenda de</div><select class="agm-sel agm-w" id="agm-owner">' + optionsProprietaire(cs.owner, cs.ownerNom) + '</select>'
        + (aide ? '<div class="agm-hint">' + esc(aide) + '</div>' : '') + '</div>';
    }

    let quoi = '';
    if (cs.mode === 'rdv') {
      let cli;
      if (ed) cli = '<div class="agm-cli-ro">' + esc(cs.clientLabel || ('Client ' + (cs.idClient != null ? cs.idClient : ''))) + '</div>';
      else if (cs.idClient != null) cli = '<div class="agm-cli-sel" id="agm-cli-box"><span class="agm-cli-name">' + esc(cs.clientLabel || ('Client ' + cs.idClient)) + '</span><button type="button" class="agm-cli-change" id="agm-cli-change">Changer</button></div>';
      else cli = '<button type="button" class="agm-cli-pick" id="agm-cli-pick"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><circle cx="11" cy="11" r="7"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg><span>Choisir un client</span></button>';
      quoi += '<div class="agm-cell"><div class="agm-lbl">Client</div>' + cli + '</div>';
      // v46 : confirmer le rendez-vous au client, par SMS ou par e-mail.
      if (ed && cs.idClient != null && Number(cs.idClient) > 0 && !isPastSlot((cs.date || '') + ' ' + (cs.time || ''))) {
        quoi += '<div class="agm-cell"><div class="agm-lbl">Confirmer au client</div><div class="agm-row agm-conf">'
          + '<button type="button" class="agm-conf-b sms" id="agm-conf-sms"' + (cs.confCharge ? ' disabled' : '') + '>'
          + '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4.5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H8l-4 3.5v-3.5H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1z"/></svg>'
          + '<span>SMS de confirmation</span></button>'
          + '<button type="button" class="agm-conf-b mail" id="agm-conf-mail"' + (cs.confCharge ? ' disabled' : '') + '>'
          + '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="4.5" width="19" height="15" rx="2"/><path d="m3 6 9 6.5L21 6"/></svg>'
          + '<span>E-mail de confirmation</span></button>'
          + '</div><div class="agm-hint">Le message reprend la date et l’heure affichées ici ; vous le relisez avant l’envoi.</div></div>';
      }
      if (ed) {
        const types = rdvTypesCache || [];
        quoi += '<div class="agm-cell"><div class="agm-lbl">Type de RDV</div><select class="agm-sel agm-w" id="agm-rtype"><option value="">— choisir —</option>' + types.map(t => '<option value="' + t.id + '"' + (String(t.id) === String(cs.rdvType) ? ' selected' : '') + '>' + esc(t.label) + '</option>').join('') + '</select></div>';
      } else {
        quoi += '<div class="agm-cell"><div class="agm-lbl">Origine et forme</div><div class="agm-row">'
          + '<select class="agm-sel" id="agm-ori" style="flex:1;min-width:150px">' + ORIGINES.map((o, i) => '<option value="' + i + '"' + (o === cs.origine ? ' selected' : '') + '>' + esc(o) + '</option>').join('') + '</select>'
          + '<div class="agm-pf" id="agm-phys"><button type="button" data-phys="1" class="' + (cs.physique ? 'on' : '') + '">Physique</button><button type="button" data-phys="0" class="' + (cs.physique ? '' : 'on') + '">Téléphone</button></div>'
          + '</div></div>';
      }
    } else if (cs.mode === 'creneau' && nat === 'creneau') {
      const types = creneauTypes().filter(t => !TYPES_NATURE[Number(t.id)]);
      quoi += '<div class="agm-cell"><div class="agm-lbl">Type de créneau</div><select class="agm-sel agm-w" id="agm-ctype"><option value="">— choisir —</option>' + types.map(t => '<option value="' + t.id + '"' + (String(t.id) === String(cs.creneauType) ? ' selected' : '') + '>' + esc(t.label) + '</option>').join('') + '</select></div>';
    }

    // v39 : répétition (création de créneau seulement).
    let repet = '';
    if (!ed && cs.mode === 'creneau') {
      const r = cs.rep || (cs.rep = repDefaut(cs.date));
      repet = '<div class="agm-cell agm-rep"><div class="agm-lbl">Répétition</div><div class="agm-row">'
        + '<div class="agm-pf"><button type="button" data-rep="0" class="' + (r.on ? '' : 'on') + '">Une seule fois</button><button type="button" data-rep="1" class="' + (r.on ? 'on' : '') + '">Se répète</button></div></div>';
      if (r.on) {
        const finH = endStrFrom(cs.date || agToday(), cs.time || '09:00', cs.dur).slice(11, 16);
        const nb = compterRep(r, cs.date);
        repet += '<div class="agm-rj">' + JOURS_REP.map(j => '<button type="button" data-rj="' + j[0] + '" title="' + j[2] + '" class="' + (r.jours.indexOf(j[0]) >= 0 ? 'on' : '') + '">' + j[1] + '</button>').join('')
          + '<button type="button" class="agm-rj-t" data-rjt="ouvres">Lun → ven</button><button type="button" class="agm-rj-t" data-rjt="ouvres6">Lun → sam</button></div>'
          + '<div class="agm-row agm-rep-l"><label>Toutes les <select class="agm-sel" id="agm-rep-int">' + [1, 2, 3, 4].map(n => '<option value="' + n + '"' + (Number(r.intervalle) === n ? ' selected' : '') + '>' + n + '</option>').join('') + '</select> semaine' + (Number(r.intervalle) > 1 ? 's' : '') + '</label>'
          + '<label>jusqu’au <input type="date" class="agm-inp" id="agm-rep-au" min="' + esc(cs.date || agToday()) + '" value="' + esc(r.au) + '"></label></div>'
          + '<div class="agm-hint">De ' + esc(String(cs.time || '').replace(':', 'h')) + ' à ' + esc(finH.replace(':', 'h')) + ', ' + esc(r.jours.slice().sort().map(n => (JOURS_REP[n - 1] || [])[2]).join(', ') || 'aucun jour coché')
          + (Number(r.intervalle) > 1 ? ', une semaine sur ' + r.intervalle : '') + ', du ' + esc(libDateCourte(cs.date)) + ' au ' + esc(libDateCourte(r.au)) + ' : <b>' + nb + ' créneau' + (nb > 1 ? 'x' : '') + '</b>.</div>';
      }
      repet += '</div>';
    }

    let invites = '';
    if (cs.mode !== 'bilat') {
      const pris = (cs.invites || []).map(Number);
      const moi = Number(cs.owner != null ? cs.owner : (currentCollabId() || CACHED_UID));
      const dispo = (invitablesCache || []).filter(u => pris.indexOf(Number(u.id_user)) < 0 && Number(u.id_user) !== moi);
      invites = '<div class="agm-cell"><div class="agm-lbl">Invités</div><div class="agm-inv">'
        + pris.map(id => '<span class="agm-inv-chip' + (bacsInvite(id) ? '' : ' nb') + '"' + (bacsInvite(id) ? '' : ' title="Sans compte BACS : invité dans One Data seulement"') + '>' + esc(nomInvite(id)) + '<button type="button" data-inv-del="' + id + '" aria-label="Retirer">×</button></span>').join('')
        + '<select class="agm-sel" id="agm-inv-add" style="flex:1;min-width:150px"><option value="">+ Inviter…</option>'
        + dispo.map(u => '<option value="' + u.id_user + '">' + esc(u.nom) + (u.fonction ? ' · ' + esc(u.fonction) : '') + '</option>').join('')
        + '</select></div>'
        + (pris.length && agendaBacsPf && agendaBacsPf.actif ? '<div class="agm-hint">BACS envoie l’invitation par e-mail.</div>' : '')
        + '</div>';
    }
    const comment = cs.mode !== 'bilat' ? '<div class="agm-cell"><div class="agm-lbl">Commentaire</div><textarea class="agm-ta" id="agm-comment" rows="' + Math.min(10, Math.max(2, String(cs.comment || '').split('\n').length + 1)) + '" placeholder="Véhicule, VIN, consignes…">' + esc(cs.comment) + '</textarea></div>' : '';

    let sync = '';
    if (cs.editing && cs.mode !== 'bilat' && cs.sync) {
      const e = cs.sync.etat;
      sync = e === 'synchro' ? '<div class="agm-sync ok"><span class="pt"></span>Synchronisé avec l’agenda BACS</div>'
           : e === 'en_attente' ? '<div class="agm-sync att"><span class="pt"></span>En cours d’envoi vers BACS</div>'
           : e === 'echec' ? '<div class="agm-sync ko"><span class="pt"></span>BACS a refusé : ' + esc(cs.sync.erreur || 'raison inconnue') + '</div>'
           : '';
    }
    return chips
      + '<div class="agm-grid">' + qui + quand + quoi + invites + '</div>' + repet
      + comment + sync + (cs.err ? '<div class="agm-err">' + esc(cs.err) + '</div>' : '');
  }
  function libDateCourte(dstr) { const a = String(dstr || '').split('-').map(Number); if (!a[0]) return '—'; return new Date(a[0], a[1] - 1, a[2]).toLocaleDateString('fr-FR', { weekday: 'short', day: 'numeric', month: 'short' }); }
  function compterRep(r, du) {
    if (!du || !r.au || r.au < du || !r.jours.length) return 0;
    const a = du.split('-').map(Number), z = r.au.split('-').map(Number);
    const d0 = new Date(a[0], a[1] - 1, a[2]), fin = new Date(z[0], z[1] - 1, z[2]);
    const lundi0 = new Date(d0); lundi0.setDate(d0.getDate() - ((d0.getDay() + 6) % 7));
    let n = 0;
    for (const d = new Date(d0); d <= fin && n < 999; d.setDate(d.getDate() + 1)) {
      const iso = ((d.getDay() + 6) % 7) + 1, sem = Math.floor(Math.round((d - lundi0) / 86400000) / 7);
      if (r.jours.indexOf(iso) >= 0 && sem % (Number(r.intervalle) || 1) === 0) n++;
    }
    return n;
  }
  function renderCreate() {
    const d = frontDoc(); let ov = d.getElementById('agenda-ov');
    if (!ov) { ov = d.createElement('div'); ov.id = 'agenda-ov'; (d.body || d.documentElement).appendChild(ov); ov.addEventListener('mousedown', (e) => { if (e.target === ov) closeCreate(); }); }
    const saveLbl = cs.saving ? 'Enregistrement\u2026' : (cs.editing ? '\ud83d\udcbe  Enregistrer les modifications' : '\ud83d\udcc5  Enregistrer dans l\'agenda');
    let foot;
    if (cs.editing && cs.confirmDel && cs.serieId) {
      foot = '<div class="agm-confirm"><span class="agm-confirm-txt">Ce créneau fait partie d’une série.</span>'
        + '<button class="agm-cancel" id="agm-del-cancel"' + (cs.saving ? ' disabled' : '') + '>Annuler</button>'
        + '<button class="agm-del" id="agm-del-yes"' + (cs.saving ? ' disabled' : '') + '>' + (cs.saving ? 'Suppression\u2026' : 'Celui-ci seulement') + '</button>'
        + '<button class="agm-del" id="agm-del-serie"' + (cs.saving ? ' disabled' : '') + '>Toute la série à partir de celui-ci</button></div>';
    } else if (cs.editing && cs.confirmDel) {
      foot = '<div class="agm-confirm"><span class="agm-confirm-txt">Supprimer d\u00e9finitivement\u00a0?</span>'
        + '<button class="agm-cancel" id="agm-del-cancel"' + (cs.saving ? ' disabled' : '') + '>Annuler</button>'
        + '<button class="agm-del" id="agm-del-yes"' + (cs.saving ? ' disabled' : '') + '>' + (cs.saving ? 'Suppression\u2026' : 'Supprimer') + '</button></div>';
    } else if (cs.editing) {
      foot = '<button class="agm-del" id="agm-del"' + (cs.saving ? ' disabled' : '') + '>Supprimer</button>'
        + '<button class="agm-save" id="agm-save"' + (cs.saving ? ' disabled' : '') + '>' + saveLbl + '</button>';
      // Bilatérale à venir : on peut aussi la mener tout de suite. La fiche
      // ramène alors sa date à l'instant présent.
      if (cs.mode === 'bilat') foot = '<div class="agm-foot-col"><div class="agm-foot-row">' + foot + '</div>'
        + '<button class="agm-now" id="agm-real-now"' + (cs.saving ? ' disabled' : '') + '>\u25b6\u2002R\u00e9aliser maintenant</button></div>';
    } else if (cs.mode === 'bilat') {
      foot = '<div class="agm-foot-col"><button class="agm-save" id="agm-save"' + (cs.saving ? ' disabled' : '') + '>' + (cs.saving ? 'Enregistrement\u2026' : '\ud83d\udcc5\u2002Planifier la bilat\u00e9rale') + '</button>'
        + '<button class="agm-now" id="agm-start-now"' + (cs.saving ? ' disabled' : '') + '>\u25b6\u2002Mener l\u2019entretien maintenant</button></div>';
    } else {
      foot = '<button class="agm-save" id="agm-save"' + (cs.saving ? ' disabled' : '') + '>' + saveLbl + '</button>';
    }
    ov.innerHTML = '<div class="agm agm-saisie"><div class="agm-head"><span class="agm-title">' + esc(popTitle()) + '</span><button class="agm-x" id="agm-x">\u00d7</button></div>'
      + '<div class="agm-body">' + bodyHtml() + '</div>'
      + '<div class="agm-foot' + (cs.editing && cs.mode !== 'bilat' ? ' agm-foot-edit' : '') + '">' + foot + '</div></div>';
    wireCreate();
    appliquerVerrou();
  }
  function syncInputs() {
    const d = frontDoc(); const g = (id) => d.getElementById(id);
    if (g('agm-date')) cs.date = g('agm-date').value;
    if (g('agm-time')) cs.time = g('agm-time').value;
    if (g('agm-dur')) cs.dur = Number(g('agm-dur').value);
    if (g('agm-comment')) cs.comment = g('agm-comment').value;
    if (g('agm-ctype')) cs.creneauType = g('agm-ctype').value || null;
    if (g('agm-rtype')) cs.rdvType = g('agm-rtype').value || null;
    if (g('agm-bvend')) cs.bilatUser = g('agm-bvend').value || null;
    if (g('agm-ori')) cs.origine = ORIGINES[Number(g('agm-ori').value)] || cs.origine;
    if (g('agm-owner') && g('agm-owner').value) cs.owner = Number(g('agm-owner').value);
    if (cs.rep && g('agm-rep-int')) cs.rep.intervalle = Number(g('agm-rep-int').value) || 1;
    if (cs.rep && g('agm-rep-au')) cs.rep.au = g('agm-rep-au').value;
  }
  function wireCreate() {
    const d = frontDoc(); const g = (id) => d.getElementById(id);
    g('agm-x').addEventListener('click', closeCreate);
    d.querySelectorAll('#agenda-ov .agm-seg button').forEach(b => b.addEventListener('click', () => { syncInputs(); cs.mode = b.getAttribute('data-mode'); cs.err = ''; renderCreate(); }));
    d.querySelectorAll('#agenda-ov [data-phys]').forEach(b => b.addEventListener('click', () => { syncInputs(); cs.physique = b.getAttribute('data-phys') === '1'; renderCreate(); }));
    d.querySelectorAll('#agenda-ov [data-nat]').forEach(b => b.addEventListener('click', () => { syncInputs(); choisirNature(b.getAttribute('data-nat')); renderCreate(); }));
    const openPicker = (e) => {
      if (e) e.stopPropagation();
      syncInputs();
      openClientPicker((client) => {
        cs.idClient = Number(client.IDVu); cs.clientLabel = clientLabel(client); cs.client = client; cs.err = '';
        renderCreate();
      }, cs.client || (cs.idClient != null ? { IDVu: cs.idClient, NOM: cs.clientLabel } : null));
    };
    if (g('agm-cli-change')) g('agm-cli-change').addEventListener('click', openPicker);
    if (g('agm-cli-box')) g('agm-cli-box').addEventListener('click', openPicker);
    if (g('agm-cli-pick')) g('agm-cli-pick').addEventListener('click', openPicker);
    if (g('agm-del')) g('agm-del').addEventListener('click', () => { cs.confirmDel = true; cs.err = ''; renderCreate(); });
    if (g('agm-del-cancel')) g('agm-del-cancel').addEventListener('click', () => { cs.confirmDel = false; renderCreate(); });
    if (g('agm-del-yes')) g('agm-del-yes').addEventListener('click', () => performDelete(false));
    if (g('agm-del-serie')) g('agm-del-serie').addEventListener('click', () => performDelete(true));
    if (g('agm-save')) g('agm-save').addEventListener('click', doSave);
    if (g('agm-conf-sms')) g('agm-conf-sms').addEventListener('click', () => confirmerRdv('sms'));
    if (g('agm-conf-mail')) g('agm-conf-mail').addEventListener('click', () => confirmerRdv('mail'));
    if (g('agm-real-now')) g('agm-real-now').addEventListener('click', () => { if (cs && cs.editId != null) goBilaterale(cs.editId, true); });
    if (g('agm-start-now')) g('agm-start-now').addEventListener('click', demarrerBilatMaintenant);
    if (g('agm-bvend')) g('agm-bvend').addEventListener('change', () => { syncInputs(); });
    // v36 : le commentaire s'agrandit avec son texte (il était coupé à 2 lignes).
    const ta = g('agm-comment');
    if (ta) { const ajuster = () => { ta.style.height = 'auto'; ta.style.height = Math.min(260, ta.scrollHeight + 4) + 'px'; }; ajuster(); ta.addEventListener('input', ajuster); }
    if (g('agm-owner')) g('agm-owner').addEventListener('change', () => { syncInputs(); cs.invites = (cs.invites || []).filter(x => Number(x) !== Number(cs.owner)); renderCreate(); });
    if (g('agm-ctype')) g('agm-ctype').addEventListener('change', () => { syncInputs(); renderCreate(); });
    // v39 : répétition
    d.querySelectorAll('#agenda-ov [data-rep]').forEach(b => b.addEventListener('click', () => {
      syncInputs(); cs.rep = cs.rep || repDefaut(cs.date); cs.rep.on = b.getAttribute('data-rep') === '1';
      if (cs.rep.on && cs.date && cs.rep.jours.length === 1 && !cs.rep.touche) cs.rep.jours = [isoJour(cs.date)];
      if (cs.rep.on && (!cs.rep.au || cs.rep.au < cs.date)) cs.rep.au = plusJours(cs.date, 27);
      renderCreate();
    }));
    d.querySelectorAll('#agenda-ov [data-rj]').forEach(b => b.addEventListener('click', () => {
      syncInputs(); const j = Number(b.getAttribute('data-rj')); const t = cs.rep.jours; cs.rep.touche = true;
      cs.rep.jours = t.indexOf(j) >= 0 ? t.filter(x => x !== j) : t.concat([j]); renderCreate();
    }));
    d.querySelectorAll('#agenda-ov [data-rjt]').forEach(b => b.addEventListener('click', () => {
      syncInputs(); cs.rep.touche = true; cs.rep.jours = b.getAttribute('data-rjt') === 'ouvres' ? [1, 2, 3, 4, 5] : [1, 2, 3, 4, 5, 6]; renderCreate();
    }));
    ['agm-rep-int', 'agm-rep-au', 'agm-date', 'agm-time', 'agm-dur'].forEach(id => { if (g(id) && cs.rep && cs.rep.on) g(id).addEventListener('change', () => { syncInputs(); renderCreate(); }); });
    if (g('agm-inv-add')) g('agm-inv-add').addEventListener('change', (e) => {
      const v = Number(e.target.value); if (!v) return;
      syncInputs(); cs.invites = (cs.invites || []).concat([v]); renderCreate();
    });
    d.querySelectorAll('#agenda-ov [data-inv-del]').forEach(b => b.addEventListener('click', (e) => {
      e.stopPropagation(); syncInputs();
      const v = Number(b.getAttribute('data-inv-del')); cs.invites = (cs.invites || []).filter(x => Number(x) !== v); renderCreate();
    }));
  }
  // v46 : confirmation du RDV au client. Les fenêtres SMS et e-mail sont des
  // modules persistants (montés sur toutes les pages) : on les trouve sur la
  // fenêtre du front, ou au-dessus quand WeWeb isole l'embed.
  function uiGlobal(nom) {
    const cands = [];
    try { cands.push(frontWin()); } catch (e) {}
    cands.push(window);
    try { cands.push(window.parent); } catch (e) {}
    try { cands.push(window.top); } catch (e) {}
    for (const w of cands) { try { if (w && w[nom] && typeof w[nom].open === 'function') return w[nom]; } catch (e) {} }
    return null;
  }
  function heureLisible(t) { const m = String(t || '').match(/^(\d{1,2}):(\d{2})/); if (!m) return ''; return Number(m[1]) + 'h' + (m[2] === '00' ? '' : m[2]); }
  async function confirmerRdv(canal) {
    syncInputs();
    const s = cs; if (!s || s.idClient == null) return;
    s.confCharge = true; renderCreate();
    let cli = null, site = null;
    try {
      const c = sb();
      const [rc, rs] = await Promise.all([
        c.from('CLIENT').select('"IDVu","CIVILITE","NOM","PRENOM","TEl_MOB","TEL_FIXE","EMAIL","idmultivu"').eq('IDVu', Number(s.idClient)).maybeSingle(),
        s.idSite != null ? c.from('SITE').select('"SITE","Adresse","CodePostal","VILLE","Telephone"').eq('ID_SITE', Number(s.idSite)).maybeSingle() : Promise.resolve({ data: null })
      ]);
      cli = rc && rc.data; site = rs && rs.data;
    } catch (e) { console.warn('[agenda] confirmation : lecture client / site', e && e.message); }
    if (cs !== s) return;
    s.confCharge = false; renderCreate();
    if (!cli) { toast('Fiche client introuvable : impossible de préparer le message.'); return; }

    const soc = cli.idmultivu === 1 || cli.idmultivu === '1';
    const salut = soc ? 'Bonjour,' : 'Bonjour ' + [cli.CIVILITE, cli.NOM].filter(Boolean).join(' ').trim() + ',';
    const jour = s.date ? new Date(s.date + 'T12:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }) : '';
    const h = heureLisible(s.time);
    const tel = Number(s.rdvType) === 10;
    const adresse = site && site.Adresse ? [site.Adresse, [site.CodePostal, site.VILLE].filter(Boolean).join(' ')].filter(Boolean).join(', ') : '';
    const vendeur = (s.ownerNom || (s.owner != null ? nomPersonne(s.owner) : '') || viewerName() || '').trim();
    const telSite = site && site.Telephone ? String(site.Telephone).trim() : '';

    const phrase = tel
      ? 'je vous confirme notre rendez-vous téléphonique du ' + jour + ' à ' + h + ' : je vous appellerai à ce moment-là.'
      : 'je vous confirme notre rendez-vous du ' + jour + ' à ' + h + (adresse ? ' à la concession, ' + adresse : '') + '.';

    if (canal === 'sms') {
      if (!String(cli.TEl_MOB || '').replace(/\D/g, '')) { toast('Pas de numéro de portable sur la fiche : le SMS ne peut pas partir.'); return; }
      const ui = uiGlobal('__SMS_UI__');
      if (!ui) { toast('La fenêtre SMS n’est pas disponible sur cette page.'); return; }
      const texte = salut + ' ' + phrase + ' En cas d’empêchement, répondez simplement à ce message.' + (vendeur ? ' ' + vendeur : '');
      ui.open({ client: cli, text: texte });
      return;
    }
    const ui = uiGlobal('__EMAIL_UI__');
    if (!ui) { toast('La fenêtre e-mail n’est pas disponible sur cette page.'); return; }
    if (!cli.EMAIL) toast('Pas d’adresse e-mail sur la fiche : saisissez le destinataire.');
    const para = (t) => '<p style="margin:0 0 12px">' + esc(t) + '</p>';
    const corps = para(salut)
      + para(phrase.charAt(0).toUpperCase() + phrase.slice(1))
      + para('En cas d’empêchement, il suffit de répondre à ce message' + (telSite ? ' ou de nous appeler au ' + telSite : '') + '.')
      + para('À très bientôt,');
    ui.open({ mode: 'new', client: cli,
      subject: 'Confirmation de votre rendez-vous ' + (tel ? 'téléphonique ' : '') + 'du ' + jour + ' à ' + h,
      body: corps });
  }
  async function doSave() {
    syncInputs();
    const s = cs; s.err = '';
    if (verrouille()) { s.err = 'BACS n\u2019est pas ouvert sur votre poste : ouvrez BACS dans un onglet de ce navigateur, connectez-vous, puis recommencez.'; return renderCreate(); }
    if (!s.date || !s.time) { s.err = 'Date et heure requises.'; return renderCreate(); }
    const siteBrut = vueSite() ? siteAg.id : siteValRaw();
    const site = Array.isArray(siteBrut) ? (siteBrut.length === 1 ? siteBrut[0] : siteCourant()) : siteBrut;
    const uid = (s.owner != null) ? s.owner : currentCollabId();
    // v34 : une livraison posée dans l'agenda du metteur en main invite d'office
    // celui qui la pose (le vendeur), comme dans BACS.
    if (!s.editing && s.mode === 'creneau' && String(s.creneauType) === '4' && Number(uid) !== Number(CACHED_UID)
        && (s.invites || []).map(Number).indexOf(Number(CACHED_UID)) < 0) {
      s.invites = (s.invites || []).concat([Number(CACHED_UID)]);
    }
    const startStr = s.date + ' ' + s.time + ':00';
    // v41 : la création reste interdite dans le passé ; un événement déjà passé se modifie et se repositionne.
    if (isPastSlot(startStr) && !(s.editing && isPastSlot(s.startInit || ''))) { s.err = 'Date dans le pass\u00e9 : choisis un cr\u00e9neau \u00e0 partir de maintenant.'; return renderCreate(); }
    const endStr = endStrFrom(s.date, s.time, s.dur);
    const dur = fmtDuree(s.dur);
    try {
      const c = sb(); let res;
      if (s.editing) {
        if (s.mode === 'bilat') {
          if (!s.bilatUser) { s.err = 'S\u00e9lectionne le vendeur \u00e9valu\u00e9.'; return renderCreate(); }
          s.saving = true; renderCreate();
          res = await c.rpc('update_bilaterale', { p_id: s.editId, p_id_user: Number(s.bilatUser), p_start: startStr, p_end: endStr, p_duree: dur });
        } else {
          const type = s.mode === 'creneau' ? s.creneauType : s.rdvType;
          if (!type) { s.err = 'S\u00e9lectionne le type.'; return renderCreate(); }
          s.saving = true; renderCreate();
          if (s.owner != null && Number(s.owner) !== Number(s.ownerInit)) {
            const rc = await c.rpc('rdv_changer_personne', { p_id_rdv: Number(s.editId), p_id_user: Number(s.owner) });
            if (rc && rc.error) throw rc.error;
          }
          res = await c.rpc('update_rdv_client', { p_id_rdv: s.editId, p_start: startStr, p_end: endStr, p_duree: dur, p_id_rdv_type: Number(type), p_commentaire: s.comment || null });
        }
      } else if (s.mode === 'rdv') {
        if (!s.idClient) { s.err = 'S\u00e9lectionne un client.'; return renderCreate(); }
        s.saving = true; renderCreate();
        res = await c.rpc('create_rdv_client', { p_id_user: Number(uid), p_id_client: Number(s.idClient), p_id_site: site != null ? Number(site) : null, p_start: startStr, p_end: endStr, p_duree: dur, p_id_rdv_type: s.physique ? 5 : 10, p_origine: s.origine, p_commentaire: s.comment || null });
      } else if (s.mode === 'creneau' && s.rep && s.rep.on) {
        // v39 : série de créneaux
        if (!s.creneauType) { s.err = 'Choisis la nature de l\u2019événement (ou le type de créneau).'; return renderCreate(); }
        if (!s.rep.jours.length) { s.err = 'Coche au moins un jour.'; return renderCreate(); }
        if (!s.rep.au || s.rep.au < s.date) { s.err = 'Choisis la date de fin de la répétition.'; return renderCreate(); }
        if (endStr.slice(0, 10) !== s.date) { s.err = 'Un créneau qui se répète doit finir le jour même.'; return renderCreate(); }
        s.saving = true; renderCreate();
        const rs = await c.rpc('create_creneau_serie', { p_id_user: Number(uid), p_id_site: site != null ? Number(site) : null,
          p_du: s.date, p_au: s.rep.au, p_heure_debut: s.time + ':00', p_heure_fin: endStr.slice(11, 19),
          p_jours: s.rep.jours.slice().sort(), p_intervalle: Number(s.rep.intervalle) || 1, p_id_rdv_type: Number(s.creneauType),
          p_commentaire: s.comment || null, p_invites: (s.invites || []).length ? (s.invites || []).map(Number) : null });
        if (rs.error) throw rs.error;
        pousserVersBacs();
        const lab = (NATURES_SAISIE.find(x => x.cle === natureDe(s)) || {}).label || 'Créneau';
        closeCreate();
        toast(lab + ' : ' + ((rs.data && rs.data.n) || 0) + ' créneaux posés' + (Number(uid) !== Number(CACHED_UID) ? ' dans l’agenda de ' + nomPersonne(uid) : '')
          + (rs.data && rs.data.sautes ? ' (' + rs.data.sautes + ' date' + (rs.data.sautes > 1 ? 's' : '') + ' passée' + (rs.data.sautes > 1 ? 's' : '') + ' ignorée' + (rs.data.sautes > 1 ? 's' : '') + ')' : ''), 'ok');
        refetchApresEcriture();
        return;
      } else if (s.mode === 'creneau') {
        if (!s.creneauType) { s.err = 'Choisis la nature de l\u2019événement (ou le type de créneau).'; return renderCreate(); }
        s.saving = true; renderCreate();
        res = await c.rpc('create_creneau', { p_id_user: Number(uid), p_id_site: site != null ? Number(site) : null, p_start: startStr, p_end: endStr, p_duree: dur, p_id_rdv_type: Number(s.creneauType), p_commentaire: s.comment || null });
      } else {
        if (!s.bilatUser) { s.err = 'S\u00e9lectionne le vendeur \u00e9valu\u00e9.'; return renderCreate(); }
        s.saving = true; renderCreate();
        res = await c.rpc('create_bilaterale', { p_id_user: Number(s.bilatUser), p_id_manager: Number(CACHED_UID), p_id_site: siteBilat(s.bilatUser), p_start: startStr, p_end: endStr, p_duree: dur });
      }
      if (res && res.error) throw res.error;
      // v28 : invités — posés après la création (la charge envoyée à BACS est
      // recalculée au moment de l'envoi, elle les embarque).
      if (s.mode !== 'bilat' && !memesInvites(s.invites, s.invitesInit)) {
        const idRdv = s.editing ? s.editId : (res && res.data);
        if (idRdv != null) {
          const ri = await c.rpc('rdv_invites_poser', { p_id_rdv: Number(idRdv), p_invites: (s.invites || []).map(Number) });
          if (ri && ri.error) toast('RDV enregistré, mais les invités n\u2019ont pas été posés : ' + ri.error.message);
        }
      }
      pousserVersBacs();
      const quandTxt = libQuand(startStr);
      if (!s.editing) {
        const titre = s.mode === 'bilat' ? ('Bilat ' + nomVendeurBilat(s.bilatUser))
                    : s.mode === 'rdv' ? (s.clientLabel || 'RDV client') : ((NATURES_SAISIE.find(x => x.cle === natureDe(s)) || {}).label || 'Cr\u00e9neau');
        const natP = natureDe(s);
        poserProvisoire({ famille: natP === 'rdv' ? 'client' : natP, titre, start: startStr, end: endStr });
      }
      const msg = s.mode === 'bilat'
        ? (s.editing ? 'Bilat\u00e9rale d\u00e9plac\u00e9e au ' : 'Bilat\u00e9rale planifi\u00e9e avec ' + nomVendeurBilat(s.bilatUser) + ' \u00b7 ') + quandTxt
        : (s.editing ? 'Modification enregistr\u00e9e \u00b7 ' : 'Enregistr\u00e9 dans l\u2019agenda' + (Number(uid) !== Number(CACHED_UID) ? ' de ' + nomPersonne(uid) : '') + ' \u00b7 ') + quandTxt
          + (bacsFermeIci() ? ' \u00b7 partira vers BACS \u00e0 sa r\u00e9ouverture' : '');
      closeCreate();
      toast(msg, 'ok');
      if (s.mode === 'bilat') { resumeBilatT = 0; }
      refetchApresEcriture();
    } catch (e) { console.error('[agenda] enregistrement', e); s.saving = false; s.err = (e && e.message) ? e.message : String(e); renderCreate(); }
  }
  // « Mener l'entretien maintenant » : la bilatérale est créée à l'instant
  // présent puis la fiche de réalisation s'ouvre. Pas de détour par le
  // calendrier : le chef est déjà en face du vendeur.
  async function demarrerBilatMaintenant() {
    syncInputs();
    const s = cs; if (!s) return; s.err = '';
    if (!s.bilatUser) { s.err = 'S\u00e9lectionne le vendeur \u00e9valu\u00e9.'; return renderCreate(); }
    s.saving = true; renderCreate();
    try {
      const { data, error } = await sb().rpc('bilat_creer_maintenant', {
        p_id_user: Number(s.bilatUser), p_id_site: siteBilat(s.bilatUser), p_duree_min: Number(s.dur) || 30 });
      if (error) throw error;
      resumeBilatT = 0;
      goBilaterale(data, false);
    } catch (e) {
      console.error('[agenda] bilat_creer_maintenant', e);
      s.saving = false;
      const m = (e && e.message) ? e.message : String(e);
      s.err = /bilat_creer_maintenant/.test(m) ? 'Fonction indisponible : le script SQL des bilat\u00e9rales v6 n\u2019est pas encore appliqu\u00e9.' : m;
      renderCreate();
    }
  }
  async function performDelete(serie) {
    const s = cs; if (!s || !s.editing) return; s.err = '';
    if (verrouille()) { s.confirmDel = false; s.err = 'BACS n\u2019est pas ouvert sur votre poste : ouvrez BACS dans un onglet de ce navigateur, connectez-vous, puis recommencez.'; return renderCreate(); }
    s.saving = true; renderCreate();
    try {
      const c = sb(); let res;
      if (s.mode === 'bilat') res = await c.rpc('delete_bilaterale', { p_id: s.editId });
      else if (serie === true && s.serieId) res = await c.rpc('delete_rdv_serie', { p_serie: s.serieId, p_a_partir_de: (s.startInit || (s.date + ' ' + s.time + ':00')).replace('T', ' ') });
      else res = await c.rpc('delete_rdv_client', { p_id_rdv: s.editId });
      if (res && res.error) throw res.error;
      if (serie === true && res && res.data) toast(((res.data && res.data.n) || 0) + ' créneaux de la série supprimés', 'ok');
      pousserVersBacs();
      closeCreate(); refetch();
    } catch (e) { console.error('[agenda] suppression', e); s.saving = false; s.confirmDel = false; s.err = (e && e.message) ? e.message : String(e); renderCreate(); }
  }
  // Popup d'erreur stylé (charte) — bloquant léger, centré.
  function showAgError(title, msg) {
    const d = frontDoc(); try { hideTip(); } catch (e) {} let ov = d.getElementById('agenda-err-ov');
    if (ov) ov.remove();
    ov = d.createElement('div'); ov.id = 'agenda-err-ov';
    ov.innerHTML = '<div class="agm-err-card">'
      + '<div class="agm-err-ic"><svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="7.5" x2="12" y2="13"/><circle cx="12" cy="16.5" r="0.6" fill="currentColor"/></svg></div>'
      + '<div class="agm-err-h">' + esc(title || 'Action impossible') + '</div>'
      + (msg ? '<div class="agm-err-m">' + esc(msg) + '</div>' : '')
      + '<button class="agm-err-ok" id="agm-err-ok">J\'ai compris</button></div>';
    (d.body || d.documentElement).appendChild(ov);
    const close = () => { try { ov.remove(); } catch (e) {} };
    ov.addEventListener('mousedown', (e) => { if (e.target === ov) close(); });
    const ok = d.getElementById('agm-err-ok'); if (ok) ok.addEventListener('click', close);
  }
  // Petit toast d'erreur (erreurs techniques inattendues).
  function toast(msg, kind) {
    try {
      const d = frontDoc(); let t = d.getElementById('agenda-toast');
      if (!t) { t = d.createElement('div'); t.id = 'agenda-toast'; (d.body || d.documentElement).appendChild(t); }
      const ok = kind === 'ok';
      t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:4000;color:#fff;font-family:"Nunito Sans",system-ui,sans-serif;font-size:13px;font-weight:700;padding:11px 18px;border-radius:10px;max-width:80vw;'
        + (ok ? 'background:#2c7a68;box-shadow:0 6px 24px rgba(44,122,104,.35)' : 'background:#a32d2d;box-shadow:0 6px 24px rgba(163,45,45,.35)');
      t.textContent = (ok ? '\u2713 ' : '') + msg; t.style.display = 'block';
      clearTimeout(window.__agendaToastT); window.__agendaToastT = setTimeout(() => { try { t.style.display = 'none'; } catch (x) {} }, 5000);
    } catch (e) { console.error(msg); }
  }
  // Drag & resize d'un event -> update_* (type / commentaire inchang\u00e9s).
  async function applyDragResize(arg) {
    if (lectureSeule()) { try { arg.revert(); } catch (x) {} return; }
    const ev = arg.event; const p = ev.extendedProps || {};
    const st = String(p.source_type || '');
    const mins = (ev.end && ev.start) ? Math.max(15, Math.round((ev.end - ev.start) / 60000)) : 30;
    const date = (ev.startStr || '').slice(0, 10); const time = (ev.startStr || '').slice(11, 16);
    const startStr = date + ' ' + time + ':00';
    // v41 : un événement déjà passé se repositionne librement ; un événement à venir ne se tire pas dans le passé.
    const etaitPasse = isPastSlot(p.event_start_time || '') || isPastSlot((arg.oldEvent && arg.oldEvent.startStr) || '');
    if (isPastSlot(startStr) && !etaitPasse) { try { arg.revert(); } catch (x) {} showAgError('D\u00e9placement impossible', 'On ne peut pas d\u00e9placer un \u00e9v\u00e9nement \u00e0 venir dans le pass\u00e9.'); return; }
    const endStr = endStrFrom(date, time, mins);
    const dur = fmtDuree(mins);
    try {
      const c = sb(); let res;
      if (st === 'rdv') {
        res = await c.rpc('update_rdv_client', { p_id_rdv: p.origin_id, p_start: startStr, p_end: endStr, p_duree: dur, p_id_rdv_type: (p.id_rdv_type != null ? Number(p.id_rdv_type) : null), p_commentaire: p.description || null });
      } else if (st === 'bilat') {
        if (!p.can_edit) { arg.revert(); return; }
        res = await c.rpc('update_bilaterale', { p_id: p.origin_id, p_id_user: Number(p.id_user), p_start: startStr, p_end: endStr, p_duree: dur });
      } else { arg.revert(); return; }
      if (res && res.error) throw res.error;
      pousserVersBacs();
      toast((arg.oldEvent && arg.oldEvent.startStr === ev.startStr ? 'Durée modifiée · ' : 'Déplacé au ') + libQuand(startStr), 'ok');
      refetch();
    } catch (e) { console.error('[agenda] d\u00e9placement', e); try { arg.revert(); } catch (x) {} toast('D\u00e9placement impossible : ' + ((e && e.message) ? e.message : String(e))); }
  }


  // --- bootstrap --------------------------------------------------------------
  function loadScript(src, cb) { const s = document.createElement('script'); s.src = src; s.onload = cb; s.onerror = () => console.error('[agenda] échec chargement ' + src); document.head.appendChild(s); }
  function boot() {
    if (window.FullCalendar) { init(); return; }
    const base = 'https://cdn.jsdelivr.net/npm/fullcalendar@' + CFG.fcVersion + '/index.global.min.js';
    const frLoc = 'https://cdn.jsdelivr.net/npm/@fullcalendar/core@' + CFG.fcVersion + '/locales/fr.global.min.js';
    loadScript(base, () => loadScript(frLoc, init));
  }
  boot();
  // re-render intégré (remplace l'ancien bloc on-page-load « Re-render agenda ») :
  try { const w = frontWin(); [100, 400, 900, 1800].forEach(function (d) { setTimeout(function () { try { w.dispatchEvent(new Event('resize')); } catch (e) {} }, d); }); } catch (e) {}
}
});
