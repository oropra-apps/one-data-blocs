// ============================================================================
//  DASHBOARD — module One Data (OD.define)   v33 — PROFIL TEAM COLIN
//
//  Cette version est réservée au tenant Team Colin (ref ieztupavcdnubmpbjvuq),
//  où elle est épinglée. Le défaut du registre reste la v25 « Tour de
//  contrôle » : aucun autre tenant ne charge ce fichier. Par sécurité, si la
//  v26 était servie ailleurs, le module se contente d'un message et rend la
//  main sans rien casser.
//
//  CE QUE LA PAGE FAIT
//  Elle rassemble les indicateurs que Team Colin regarde tous les jours, rangés
//  en six familles, et chaque tuile s'ouvre sur ce que son chiffre ne dit pas :
//  la série sur douze mois, le détail par vendeur, et le constat qui en sort.
//
//    1. Production commerciale — commandes, financement, LOA, accessoires,
//       Roole, reprises, PHEV/EV, VU
//    2. Pipe et relances       — affaires ouvertes, à relancer, pipe valorisé
//    3. Livraisons             — à livrer, dossiers à clôturer
//    4. Activité commerciale   — rapports vendeurs, rendez-vous
//    5. Leads                  — reçus, jamais contactés, délai de premier contact
//    6. Qualité de la base     — injoignables, file de fusion, Bloctel
//
//  Une pastille devant chaque famille dit l'état de sa source : alimentée,
//  partielle, ou sans donnée. Une famille sans source n'est pas masquée — une
//  tuile vide dit ce qui manque, une tuile absente ne dit rien.
//
//  LE STOCK, ET MOINS DE TUILES POUR LA DIRECTION (v33)
//  Un directeur de groupe ou de plaque recevait seize tuiles, dont la plupart
//  relevaient du détail d'exécution : LOA, Roole, reprises, affaires ouvertes,
//  dossiers à clôturer, délai de premier contact, file de fusion, Bloctel. Son
//  jeu tombe à NEUF, et ce qui en sort reste accessible par l'arborescence et
//  par les pages Performances et Activité.
//  Et il gagne ce qui manquait : LE STOCK. 31,4 M€ immobilisés au 1er octobre,
//  dont 11,6 qui dorment depuis plus de trois mois, et aucun indicateur ne le
//  disait. Deux tuiles — VN disponible, VO en parc — avec l'âge du parc, qui est
//  ce qui mange la marge. Son bandeau et son pouls parlent désormais d'argent
//  engagé plutôt que de pourcentages qui s'érodent.
//
//  LE MOIS (v32)
//  Le tableau lisait toujours le mois en cours. Le 1er octobre, cela donnait une
//  page entière à zéro — aucune commande n'avait encore été passée — et faisait
//  douter du reste, qui était juste. Un sélecteur de mois s'ajoute, et la page
//  s'ouvre sur le mois précédent tant que le mois en cours n'a aucune commande,
//  en le disant. Le repli ne joue qu'une fois : choisir un mois à la main le
//  désarme.
//
//  LE PÉRIMÈTRE — UN SEUL SÉLECTEUR, DANS LA BARRE DU HAUT (v31)
//  La v30 avait mis un tableau de périmètre dans la page. Deux sélecteurs pour
//  un même choix — celui de la barre du haut et celui de la page — finissaient
//  toujours par se contredire : choisir une marque ici laissait la barre
//  afficher un site.
//  Le choix vit maintenant dans la barre du haut (topnav v3), qui déplie
//  marque › affaire › site, et le bus (site-bus v3) porte le périmètre au lieu
//  d'un simple identifiant de site. La page l'écoute et se contente de rappeler
//  le périmètre courant à côté de son titre.
//
//  LE PÉRIMÈTRE — TOUS LES NIVEAUX (v30, la couche SQL)
//  Le sélecteur ne savait choisir qu'un site : vingt-sept boutons à plat, puis
//  un menu qui ne rendait cliquables que les feuilles. Un directeur de groupe ne
//  pouvait ni isoler TOYOTA, ni une affaire.
//  Il est remplacé par un TABLEAU dont chaque ligne est un choix — le groupe,
//  une marque, une affaire, un site — sur le modèle du périmètre du suivi
//  d'activité : le chevron plie la branche, le reste de la ligne sélectionne.
//  Chaque ligne porte ses chiffres (commandes / objectif, à relancer, retards),
//  tirés de l'arbre chargé avec la page.
//  Dessous, les fonctions SQL acceptent désormais une LISTE de sites
//  (p_sites numeric[]), toujours bornée au périmètre réel de l'utilisateur.
//
//  PAR RÔLE — QUATRE PAGES, PAS UNE PAGE FILTRÉE (v29)
//
//  Chaque fonction a sa propre question, et donc sa propre page :
//
//    VENDEUR    « qui j'appelle aujourd'hui ? »
//               Titre « Votre journée ». Huit tuiles, et chaque dépli est une
//               LISTE NOMINATIVE — nom, véhicule, téléphone cliquable — servie
//               par dashboard_tc_liste. Aucun comparatif : il y figurerait seul.
//
//    CHEF       « qui décroche, et sur quoi ? »
//               Titre « Votre équipe aujourd'hui ». Chaque dépli est le
//               CLASSEMENT DE SON ÉQUIPE sur cet indicateur, trié du plus en
//               retard au moins, avec l'écart à l'objectif individuel, servi par
//               dashboard_tc_equipe. Le constat nomme la personne à voir.
//
//    DIRECTION  « quelle entité décroche, et de combien ? »
//               Titre « Le tableau du groupe ». Chaque dépli est
//               L'ARBORESCENCE MARQUE › AFFAIRE › SITE, repliable, servie par
//               dashboard_tc_arbre ; cliquer une ligne filtre toute la page sur
//               ce périmètre. Le sélecteur à plat de vingt-sept boutons est
//               remplacé par le même arbre. Le constat compare les affaires
//               entre elles. Ni PHEV ni utilitaires : ce sont des objectifs
//               individuels, leur somme au niveau groupe n'a pas de destinataire.
//
//    MARKETING  « d'où viennent les leads et pourquoi se perdent-ils ? »
//               Titre « Ce qui entre, ce qui se perd ». Les déplis leads
//               ouvrent sur LE TABLEAU PAR SOURCE — volume, délai médian,
//               jamais appelés, taux de perte — servi par dashboard_tc_sources.
//               Le constat met en regard délai de rappel et taux de perte.
//
//  Le bandeau, le pouls, le titre et le pied de page suivent le même découpage.
//
//  PAR RÔLE — ce qui avait changé en v28
//  Le jeu de tuiles dépendait déjà de la fonction. Ce n'était pas assez : le
//  DÉPLI restait celui du chef des ventes. Un vendeur cliquait sur « À
//  relancer » et lisait « Le portefeuille de chacun » — un tableau d'une seule
//  ligne, la sienne, sous la phrase « Mina Tang porte 26 affaires ». Elle le
//  sait : c'est elle.
//
//  Chaque tuile porte donc maintenant un bloc `vues` qui redéfinit, par
//  famille de rôle, son titre, son contexte, sa trouvaille, son tableau et la
//  liste nominative qu'elle ouvre. Ce qui n'est pas redéfini retombe sur la
//  valeur commune, et rien n'est dupliqué.
//
//  La règle qui a guidé le découpage : le chef compare ses vendeurs, la
//  direction compare ses sites, LE VENDEUR NE COMPARE RIEN. Il ne veut pas
//  savoir combien il a d'affaires à relancer — il le voit sur la tuile — mais
//  LESQUELLES, dans quel ordre, et à quel numéro. Les huit tuiles de son jeu
//  ouvrent donc sur une liste de noms et de téléphones cliquables, servie à la
//  demande par dashboard_tc_liste. Le bandeau, le pouls, le titre de la page et
//  le pied de page sont réécrits dans le même esprit.
//
//  PÉRIMÈTRE ET TOP NAV
//  Un chef multi-site ouvre sur la vue agrégée de tout son périmètre, avec la
//  ventilation par site en dessous. Le sélecteur de la page et le sélecteur de
//  site de la barre du haut sont le même état : changer l'un change l'autre, et
//  les chiffres se recalculent. C'est le bus de site (oropra-site-bus) qui les
//  relie.
//
//  SOURCE
//  Un seul aller-retour au chargement : la RPC dashboard_tc(annee, mois) renvoie
//  tout en un jsonb, bornée par propale_visible_user_ids() — un vendeur ne voit
//  que lui, un chef son site, la direction les trois. Les grands comptes sont
//  exclus partout, comme dans Performances. La famille « qualité de la base »
//  est un sujet de groupe : elle n'est servie qu'aux rôles 1, 2 et 3.
//
//  Les listes nominatives sont servies à part, par dashboard_tc_liste(bloc, …),
//  et seulement au clic : les charger d'avance alourdirait la page pour des
//  dépliés que personne n'ouvrira. Elles sont mises en cache par bloc, et le
//  cache est vidé dès que le site ou le mois change.
//
//  SEUILS
//  7 et 27 jours ne sont pas choisis : ce sont les 85ᵉ et 95ᵉ centiles du délai
//  entre l'ouverture d'une affaire et sa commande, recalculés à chaque appel
//  sur les affaires de l'année. Ils dérivent avec le comportement du réseau.
//
//  Prérequis SQL : dashboard_tc + dashboard_tc_obj
//  (fichier dashboard_teamcolin.sql).
// ============================================================================

OD.define('dashboard', {
  async mount(__anchor, ctx) {
    __anchor.id = 'dash-root';
    const doc = __anchor.ownerDocument || document;
    const getRoot = () => __anchor;

    // --- PROFIL TENANT -------------------------------------------------------
    const TC_REF = 'ieztupavcdnubmpbjvuq';
    const IS_TC = (function () {
      try {
        if (window.__OD_DASH_PROFILE__ === 'teamcolin') return true;
        const t = ctx.tenant || {};
        if (String(t.supabase_url || '').indexOf(TC_REF) !== -1) return true;
        const slug = String(t.slug || t.code || t.tenant_slug || t.name || '')
          .toLowerCase().replace(/[^a-z]/g, '');
        return slug === 'teamcolin';
      } catch (e) { return false; }
    })();
    if (!IS_TC) {
      getRoot().innerHTML = '<div style="padding:24px;font:14px/1.5 system-ui;color:#5a6b86">'
        + 'Cette version du tableau de bord est réservée à Team Colin. '
        + 'Le module standard est la version 25.</div>';
      return;
    }

    const SUPABASE_URL = ctx.tenant.supabase_url;
    const SUPABASE_KEY = ctx.tenant.supabase_anon_key;
    // Le jeton est redemandé à chaque appel REST, et la page en fait cinq ou six
    // par chargement. getSession() lit le stockage et peut déclencher un
    // rafraîchissement : on garde le jeton trente secondes, très loin de son
    // heure de validité, pour ne pas payer ce détour à chaque requête.
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

    // --- socle utilisateur ---------------------------------------------------
    {
      const w = (wwLib.getFrontWindow && wwLib.getFrontWindow()) || window;
      const uid = () => { let d = w.oropraUser; if (Array.isArray(d)) d = d[0]; return d && d.ID_User; };
      for (let i = 0; i < 40 && uid() == null; i++) await new Promise(r => setTimeout(r, 250));
    }
    const FW = (wwLib.getFrontWindow && wwLib.getFrontWindow()) || window;
    const U = Array.isArray(FW.oropraUser) ? (FW.oropraUser[0] || {}) : (FW.oropraUser || {});
    const prenom = String(U.nomComplet || '').split(' ')[0] || '';

    // =========================================================================
    //  CHARTE
    //  Les couleurs de marque servent les fonds, les bandeaux et les pastilles.
    //  Les MARQUES des graphiques (points, traits, barres) prennent un pas plus
    //  soutenu des mêmes teintes : posés tels quels en traits de 2 px sur fond
    //  blanc, le vert, l'orange et le bleu clair passent sous le seuil de
    //  contraste et les courbes disparaissent. Les deux jeux ont été vérifiés
    //  en vision normale et en vision déficiente, sur fond clair et sombre.
    // =========================================================================
    const CSS = `
#dash-root{--bleu:#2a5ea9;--bleu-clair:#acc5e4;--vert:#53bda7;--orange:#fac055;--rouge:#d97070;
  --m-vert:#00997f;--m-orange:#d2941f;--m-bleu:#3f7cba;--m-rouge:#c0524f;
  --ground:#f4f7fb;--card:#fff;--line:#e3e9f3;--line-2:#cfd9e9;
  --ink:#1c2b45;--ink-2:#5a6b86;--ink-3:#8b99b0;
  --ok-bg:#e4f4f0;--alerte-bg:#fdf3de;--chaud-bg:#fbeceb;--calme-bg:#eef2f8;
  --ombre:0 1px 2px rgba(28,43,69,.05),0 8px 24px rgba(28,43,69,.06);
  --ui:"Nunito Sans",system-ui,-apple-system,sans-serif;
  --mono:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;
  font-family:var(--ui);color:var(--ink);background:var(--ground);
  display:block;width:100%;padding:18px 16px 40px;box-sizing:border-box}
#dash-root *{box-sizing:border-box}
#dash-root .dw{max-width:1180px;margin:0 auto;display:flex;flex-direction:column;gap:16px}
#dash-root .drail{display:flex;flex-wrap:wrap;align-items:center;gap:10px 14px}
#dash-root .drail h1{font-size:19px;font-weight:800;letter-spacing:-.015em;margin:0}
#dash-root .drail .dt{font-family:var(--mono);font-size:11.5px;color:var(--ink-3)}
#dash-root .dseg{display:flex;background:var(--card);border:1px solid var(--line);border-radius:9px;
  padding:3px;box-shadow:var(--ombre);margin-left:auto}
#dash-root .dseg button{font:inherit;font-size:12px;font-weight:600;color:var(--ink-2);background:none;
  border:0;padding:6px 11px;border-radius:6px;cursor:pointer;white-space:nowrap}
#dash-root .dseg button[aria-pressed="true"]{background:var(--bleu);color:#fff}
#dash-root .dseg button:focus-visible{outline:2px solid var(--bleu);outline-offset:2px}
#dash-root .dseg .sep{width:1px;background:var(--line);margin:3px 4px}
#dash-root .drole{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;
  color:var(--ink-3);background:var(--calme-bg);border-radius:20px;padding:5px 11px}
#dash-root .dband{background:var(--card);border:1px solid var(--line);border-radius:14px;
  box-shadow:var(--ombre);padding:17px 20px;display:flex;flex-wrap:wrap;gap:16px 30px;align-items:center}
#dash-root .dband .q{font-size:10.5px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--ink-3)}
#dash-root .dband .d{flex:1 1 320px;min-width:0}
#dash-root .dband p{margin:6px 0 0;font-size:16px;line-height:1.45;max-width:62ch}
#dash-root .dband b{font-weight:800}
#dash-root .dpouls{display:flex;gap:20px;flex-wrap:wrap}
#dash-root .dpouls div{min-width:66px}
#dash-root .dpouls .n{font-family:var(--mono);font-size:22px;font-weight:600;line-height:1;font-variant-numeric:tabular-nums}
#dash-root .dpouls .l{font-size:10px;color:var(--ink-3);margin-top:5px;line-height:1.25}
/* Les familles ne s'empilent plus en bandes pleine largeur : elles partagent
   une grille unique. Une famille d'une seule tuile occupe une colonne, pas une
   ligne entière — c'est ce qui divisait la hauteur de page par deux. Chaque
   section reçoit un grid-column:span N posé au rendu, N étant son nombre de
   tuiles ; sa grille interne se recompose toute seule quand la place manque. */
#dash-root .dfams{display:grid;grid-template-columns:repeat(auto-fill,minmax(164px,1fr));
  gap:18px 10px;align-items:start}
#dash-root .dfam{display:flex;flex-direction:column;gap:7px;min-width:0}
/* Hauteur fixe : sans elle, un titre sur deux lignes décalait la grille de sa
   voisine et l'alignement des tuiles sautait d'une famille à l'autre. */
#dash-root .dfam > h2{font-size:11px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;
  color:var(--ink-2);margin:0;height:16px;display:flex;align-items:center;gap:8px;
  white-space:nowrap;overflow:hidden}
#dash-root .dfam > h2 .tt{overflow:hidden;text-overflow:ellipsis;min-width:0;flex:0 1 auto}
#dash-root .dfam > h2 .cn{font-size:10.5px;font-weight:600;letter-spacing:0;text-transform:none;
  color:var(--ink-3);overflow:hidden;text-overflow:ellipsis;min-width:0;flex:0 1 auto}
/* Une ou deux tuiles : la colonne est trop étroite pour la source, qui serait
   tronquée à trois mots. Le titre seul y suffit ; le pied de page dit le reste. */
#dash-root .dfam.etroite > h2 .cn{display:none}
#dash-root .detat{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:6px;vertical-align:1px}
#dash-root .detat.plein{background:var(--m-vert)}
#dash-root .detat.partiel{background:var(--m-orange)}
#dash-root .detat.vide{background:var(--line-2)}
#dash-root .dgrille{display:grid;grid-template-columns:repeat(auto-fill,minmax(152px,1fr));gap:10px}
#dash-root .dtuile{position:relative;text-align:left;font:inherit;color:var(--ink);cursor:pointer;
  background:var(--card);border:1px solid var(--line);border-radius:13px;padding:11px 13px 9px;
  box-shadow:var(--ombre);display:flex;flex-direction:column;min-width:0;
  transition:border-color .12s,transform .12s}
#dash-root .dtuile:hover{border-color:var(--line-2);transform:translateY(-1px)}
#dash-root .dtuile[aria-expanded="true"]{border-color:var(--bleu);
  box-shadow:0 0 0 2px rgba(42,94,169,.22),var(--ombre)}
#dash-root .dtuile:focus-visible{outline:2px solid var(--bleu);outline-offset:2px}
#dash-root .dtuile.muette{opacity:.62;border-style:dashed}
#dash-root .dtuile.muette .v{color:var(--ink-3)}
#dash-root .dtuile .lab{font-size:10.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;
  color:var(--ink-3);display:block;min-height:26px;padding-right:20px;line-height:1.25}
#dash-root .dtuile .v{font-family:var(--mono);font-size:23px;font-weight:600;letter-spacing:-.02em;
  line-height:1.1;margin-top:1px;font-variant-numeric:tabular-nums}
#dash-root .dtuile .v em{font-style:normal;font-size:13px;color:var(--ink-3);font-weight:400;margin-left:3px}
#dash-root .dtuile .c{font-size:11px;margin-top:2px;font-weight:600;line-height:1.3}
#dash-root .dtuile svg.sp{display:block;width:100%;height:22px;margin-top:auto;padding-top:7px;overflow:visible}
#dash-root .dtuile .pl{position:absolute;top:10px;right:10px;width:16px;height:16px;border-radius:50%;
  background:var(--calme-bg);color:var(--ink-3);font-size:11.5px;font-weight:800;line-height:16px;text-align:center}
#dash-root .dtuile[aria-expanded="true"] .pl{background:var(--bleu);color:#fff}
#dash-root .hausse{color:var(--m-vert)}#dash-root .baisse{color:var(--m-rouge)}#dash-root .plat{color:var(--ink-3)}
/* Le tiroir vit dans la grille des familles, en pleine largeur, juste sous la
   famille de la tuile ouverte. Vide, il disparaît : sinon il laissait une
   gouttière de 18px au milieu de la page. */
#dash-root #dash-tiroir{grid-column:1/-1}
#dash-root #dash-tiroir:empty{display:none}
#dash-root #dash-ancre{display:none}
#dash-root .dtiroir{background:var(--card);border:1px solid var(--bleu);border-radius:14px;
  box-shadow:var(--ombre);padding:20px 22px;display:grid;
  grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:24px}
/* Un arbre de 27 sites déroulé faisait à lui seul trois écrans de défilement :
   il défile désormais dans son cadre, la page ne s'allonge plus. */
#dash-root .dtiroir .dscroll{max-height:336px;overflow-y:auto}
#dash-root .dtiroir h3{font-size:16px;font-weight:800;margin:0 0 3px;letter-spacing:-.01em}
#dash-root .dtiroir .ctx{font-size:12.5px;color:var(--ink-2);margin:0 0 14px}
#dash-root .dtiroir svg.gr{display:block;width:100%;height:auto;overflow:visible}
#dash-root .dtiroir svg text{font-family:var(--ui)}
#dash-root .dtiroir svg text.m{font-family:var(--mono);font-variant-numeric:tabular-nums}
#dash-root .dtrouve{background:var(--alerte-bg);border-radius:11px;padding:14px 16px;font-size:13.5px;line-height:1.5}
#dash-root .dtrouve .t{font-size:10.5px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;
  color:var(--ink-3);margin-bottom:6px}
#dash-root .dtrouve b{font-weight:800}
#dash-root table.dmini{width:100%;border-collapse:collapse;font-size:12.5px;margin-top:14px;min-width:330px}
#dash-root .dscroll{overflow-x:auto}
#dash-root table.dmini th{font-size:9.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;
  color:var(--ink-3);text-align:right;padding:0 7px 6px;white-space:nowrap}
#dash-root table.dmini th:first-child{text-align:left}
#dash-root table.dmini td{padding:5px 7px;border-top:1px solid var(--line);text-align:right;
  font-variant-numeric:tabular-nums;white-space:nowrap}
#dash-root table.dmini td:first-child{text-align:left;white-space:normal}
#dash-root table.dmini .f{font-family:var(--mono);font-weight:600}
#dash-root table.dmini .pale{color:var(--ink-3)}
#dash-root table.dmini .mauvais{color:var(--m-rouge)}
/* Le conteneur défile, pas la page — et la première colonne reste ancrée : sans
   elle on perdait de vue à qui appartenait la ligne qu'on lisait. Même principe
   que l'arbre de Performances. */
#dash-root .dscroll{overflow-x:auto;-webkit-overflow-scrolling:touch;position:relative;
  max-width:100%;overscroll-behavior-x:contain}
#dash-root .dscroll table.dmini th:first-child,
#dash-root .dscroll table.dmini td:first-child{position:sticky;left:0;z-index:2;
  background:var(--card);border-right:1px solid var(--line)}
#dash-root .dscroll table.dmini thead th:first-child{z-index:3}
#dash-root .dliste{margin-top:6px}
#dash-root .dliste table.dmini td:first-child{font-weight:600}
/* Un libellé véhicule fait parfois soixante caractères : il se tronque plutôt
   que de pousser tout le tableau hors de l'écran. */
#dash-root table.dmini td.coupe{max-width:230px;overflow:hidden;text-overflow:ellipsis;
  white-space:nowrap;text-align:left}
#dash-root .dtel{font-family:var(--mono);font-weight:600;color:var(--m-bleu);
  text-decoration:none;border-bottom:1px solid transparent}
#dash-root .dtel:hover{border-bottom-color:currentColor}
/* L'arbre marque › affaire › site. Le décalage dit le niveau, la ligne entière
   est cliquable pour filtrer le tableau de bord sur ce périmètre. */
#dash-root .darbre tr{cursor:pointer}
#dash-root .darbre tr:hover td{background:var(--calme-bg)}
#dash-root .darbre .lv1 td:first-child{font-weight:800;padding-left:7px}
#dash-root .darbre .lv2 td:first-child{font-weight:700;padding-left:22px;color:var(--ink-2)}
#dash-root .darbre .lv3 td:first-child{font-weight:500;padding-left:38px;color:var(--ink-2)}
#dash-root .darbre tr.lv1 td{border-top:1.5px solid var(--line-2)}
#dash-root .darbre tr.actif td{background:var(--calme-bg)}
#dash-root .darbre tr.actif td:first-child{box-shadow:inset 3px 0 0 var(--m-bleu)}
#dash-root .darbre .pli{display:inline-block;width:13px;color:var(--ink-3);font-size:10px}
#dash-root .dmuet td{color:var(--ink-3)}
#dash-root .dnote{font-size:11.5px;color:var(--ink-3);margin-top:8px;line-height:1.5}
/* Le périmètre : un tableau dont chaque ligne est un choix — le groupe, une
   marque, une affaire, un site. Le chevron plie, le reste de la ligne choisit.
   Même mécanique que le périmètre du suivi d'activité. */
#dash-root .dmois{display:inline-flex;gap:2px;background:var(--calme-bg);border-radius:9px;padding:2px}
#dash-root .dmois button{background:none;border:0;font:inherit;font-size:11.5px;font-weight:700;
  color:var(--ink-3);padding:4px 10px;border-radius:7px;cursor:pointer;text-transform:capitalize}
#dash-root .dmois button:hover{color:var(--ink)}
#dash-root .dmois button[aria-pressed="true"]{background:var(--card);color:var(--ink);
  box-shadow:0 1px 2px rgba(28,43,69,.08)}
/* L'avis de repli : il explique pourquoi la production est vide. Il ne doit pas
   ressembler à une erreur — c'est une information de calendrier. */
#dash-root .davis{background:var(--alerte-bg);border-radius:10px;padding:10px 14px;
  font-size:12.5px;line-height:1.5;color:var(--ink-2)}
#dash-root .dportee{font-size:11px;font-weight:700;color:var(--ink-2);background:var(--calme-bg);
  padding:3px 9px;border-radius:20px}
#dash-root .dperim{margin-top:0;background:var(--card);border:1px solid var(--line);
  border-radius:11px;box-shadow:var(--ombre);overflow:hidden}
#dash-root .dperim-h{display:flex;align-items:baseline;gap:10px;padding:10px 14px 6px;
  font-size:12px;font-weight:800;letter-spacing:.02em;color:var(--ink)}
#dash-root .dperim-h .cn{font-size:10.5px;font-weight:600;color:var(--ink-3);letter-spacing:0}
#dash-root .dperim .dscroll{max-height:290px;overflow-y:auto}
#dash-root table.dperimt{min-width:0}
#dash-root table.dperimt td{border-top:1px solid var(--line);padding:4px 14px;cursor:pointer}
#dash-root table.dperimt td:first-child{text-align:left;white-space:nowrap}
#dash-root table.dperimt tr:first-child td{border-top:0}
#dash-root table.dperimt tr:hover td{background:var(--calme-bg)}
#dash-root table.dperimt tr.actif td{background:var(--calme-bg);font-weight:800;color:var(--ink)}
#dash-root table.dperimt tr.actif td:first-child{box-shadow:inset 3px 0 0 var(--m-bleu)}
#dash-root table.dperimt tr.lv1 td:first-child{font-weight:700}
#dash-root table.dperimt tr.lv2 td:first-child{padding-left:30px;font-weight:600;color:var(--ink-2)}
#dash-root table.dperimt tr.lv3 td:first-child{padding-left:50px;font-weight:400;color:var(--ink-2)}
#dash-root table.dperimt .pli{display:inline-block;width:15px;color:var(--ink-3);font-size:10px}
#dash-root table.dperimt .pli[data-role="pli"]{cursor:pointer;border-radius:3px}
#dash-root table.dperimt .pli[data-role="pli"]:hover{background:var(--line)}
#dash-root table.dperimt em{font-style:normal;font-size:10.5px}
@media (max-width:640px){
  #dash-root table.dmini td.coupe{max-width:130px}
  #dash-root .dscroll table.dmini th:first-child,
  #dash-root .dscroll table.dmini td:first-child{max-width:132px;overflow:hidden;
    text-overflow:ellipsis;white-space:nowrap}
}
/* L'entonnoir des commandes. Le libellé et les chiffres sont AU-DESSUS de la
   barre, jamais dedans : dans la barre, ils devenaient illisibles sur les
   teintes foncées, et sortaient du cadre sur les étapes trop courtes. */
#dash-root .dent{display:flex;flex-direction:column;gap:13px;margin-top:6px}
#dash-root .dent-l{display:flex;flex-direction:column;gap:5px}
#dash-root .dent-h{display:flex;justify-content:space-between;align-items:baseline;gap:12px}
#dash-root .dent-h b{font-size:12.5px;font-weight:800;color:var(--ink)}
#dash-root .dent-h span{font-family:var(--mono);font-size:11.5px;font-variant-numeric:tabular-nums;
  color:var(--ink-2);white-space:nowrap}
#dash-root .dent-p{height:10px;border-radius:5px;background:var(--calme-bg);overflow:hidden}
#dash-root .dent-b{height:100%;border-radius:5px}
#dash-root .dferme{background:none;border:0;font:inherit;font-size:12px;font-weight:600;color:var(--ink-3);
  cursor:pointer;padding:0;margin-top:14px;text-decoration:underline;text-underline-offset:3px}
/* La croix : refermer sans avoir à redescendre au bas du tiroir. */
#dash-root .dtiroir{position:relative}
#dash-root .dferme.dx{position:absolute;top:9px;right:11px;margin:0;text-decoration:none;
  width:26px;height:26px;border-radius:50%;font-size:18px;line-height:24px;text-align:center;
  color:var(--ink-3);background:var(--calme-bg)}
#dash-root .dferme.dx:hover{color:var(--ink);background:var(--line)}
#dash-root .dtiroir h3{padding-right:34px}
#dash-root .dpied{font-size:11.5px;color:var(--ink-3);line-height:1.6;max-width:84ch}
#dash-root .dvide{padding:22px;color:var(--ink-2);font-size:14px}
@media (max-width:820px){#dash-root .dtiroir{grid-template-columns:minmax(0,1fr)}}
@media (prefers-reduced-motion:reduce){#dash-root *{transition:none!important}}
`;
    if (!doc.getElementById('dash-tc-css')) {
      const st = doc.createElement('style'); st.id = 'dash-tc-css'; st.textContent = CSS;
      doc.head.appendChild(st);
    }

    // =========================================================================
    //  OUTILS
    // =========================================================================
    const esc = s => String(s == null ? '' : s)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const num = v => { const n = Number(v); return isFinite(n) ? n : 0; };
    const FINE = ' ';                       // espace fine insécable
    function fmt(n) {
      const v = Math.round(num(n));
      return String(v).replace(/\B(?=(\d{3})+(?!\d))/g, FINE);
    }
    function fmtEur(n) {
      const v = num(n);
      if (Math.abs(v) >= 1e6) return (v / 1e6).toFixed(1).replace('.', ',') + FINE + 'M€';
      if (Math.abs(v) >= 1e3) return fmt(v / 1e3) + FINE + 'k€';
      return fmt(v) + FINE + '€';
    }
    function pct(a, b) { return num(b) > 0 ? Math.round(num(a) / num(b) * 100) : null; }
    const MOIS_COURT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
                        'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

    // =========================================================================
    //  DONNÉES
    // =========================================================================
    const today = new Date();
    // Le périmètre n'est plus un site mais un NIVEAU : le groupe entier, une
    // marque, une affaire ou un site. state.site ne garde que le cas « un seul
    // site », parce que c'est la seule chose que la barre du haut sait porter.
    const state = { annee: today.getFullYear(), mois: today.getMonth() + 1,
                    ouvert: null, d: null, site: null, chargement: false,
                    sel: { level: 'all', key: null, label: 'Tout mon périmètre' },
                    plis: {}, arbrePlis: {}, busSiteVu: null,
                    stockBrut: null, entonnoirBrut: null, entonnoir: null,
                    replieFait: false, moisRepli: null, stock: null };

    // Les sites couverts par la sélection courante. null = tout le périmètre,
    // et c'est ce que les fonctions SQL attendent pour ne rien filtrer.
    function sitesSelection() {
      const per = ((state.d || {}).perimetre || []);
      const s = state.sel;
      if (!s || s.level === 'all') return null;
      if (s.level === 'reseau')
        return per.filter(x => (x.reseau || '__sans') === s.key).map(x => Number(x.id_site));
      if (s.level === 'affaire')
        return per.filter(x => (x.affaire || '__sans') === s.key).map(x => Number(x.id_site));
      if (s.level === 'site') return [Number(s.key)];
      return null;
    }

    // Ce que la sélection vaut pour la barre du haut : un site, ou rien.
    function siteSelection() {
      return (state.sel && state.sel.level === 'site') ? Number(state.sel.key) : null;
    }

    // Bus de site : la barre du haut et la page partagent le même état. Un
    // changement de site là-haut recharge les chiffres ici, et le sélecteur de
    // la page repousse son choix vers le bus. « Tout mon périmètre » ne touche
    // pas au bus : c'est une vue agrégée, pas un site.
    function siteBus() {
      try { const w = wwLib.getFrontWindow(); if (w && w.oropraSite) return w.oropraSite; } catch (e) { }
      return window.oropraSite || null;
    }
    // Le périmètre d'ouverture vient de la barre du haut, et il doit être connu
    // AVANT le premier appel. Sans cela, la page chargeait tout sur « tout mon
    // périmètre », le bus arrivait ensuite avec son site, et les cinq appels
    // repartaient une seconde fois avec d'autres paramètres : le temps
    // d'affichage était tout simplement doublé.
    function siteDuBusMaintenant() {
      try {
        const b = siteBus();
        if (b && typeof b.getSiteId === 'function') {
          const id = b.getSiteId();
          if (id != null && !isNaN(Number(id))) return Number(id);
        }
      } catch (e) { }
      return null;
    }
    async function siteDOuverture(msMax) {
      const t0 = Date.now();
      for (;;) {
        const id = siteDuBusMaintenant();
        if (id != null) return id;
        if (Date.now() - t0 > (msMax || 2000)) return null;
        await new Promise(r => setTimeout(r, 70));
      }
    }

    function brancherBus(essais) {
      essais = essais || 0;
      const b = siteBus();
      if (!b) { if (essais < 120) setTimeout(() => brancherBus(essais + 1), 250); return; }
      try {
        // Au montage seulement, on adopte le site que porte déjà la barre du haut.
        const id = b.getSiteId ? b.getSiteId() : null;
        if (id != null) {
          state.busSiteVu = Number(id);
          if (String(id) !== String(siteSelection())) { poserSite(Number(id)); recharger(); }
        }
      } catch (e) { }
      if (window.__dashTcBusBound) return;
      window.__dashTcBusBound = true;
      // La barre du haut ne porte qu'un SITE. Elle n'a donc le droit d'imposer un
      // périmètre à cette page que lorsqu'elle change RÉELLEMENT de site.
      //
      // Sans cette mémoire, le scénario suivant se produisait : on choisissait
      // « Tout mon périmètre » dans la page, le bus réémettait le site qu'il
      // portait toujours, et comme ce niveau « site » différait du niveau
      // « all » de la page, celle-ci le réadoptait aussitôt et rechargeait — la
      // sélection revenait sur le site en une fraction de seconde, et « Tout mon
      // périmètre » paraissait impossible à sélectionner.
      b.onChange(d => {
        const id = d && d.siteId != null ? Number(d.siteId) : null;
        if (id == null) return;                        // pas un site : rien à suivre ici
        if (state.busSiteVu != null && id === state.busSiteVu) return;   // déjà vu
        state.busSiteVu = id;
        if (String(id) === String(siteSelection())) return;
        poserSite(id);
        recharger();
      });
    }

    // Les chiffres du périmètre courant, mis en cache par (année, mois,
    // périmètre). Revenir sur un périmètre déjà consulté n'appelle plus la base.
    // Les chiffres de la page. Ils ne viennent plus d'un appel par périmètre
    // mais du socle, chargé une fois par mois consulté et agrégé en mémoire :
    // un changement de périmètre ne touche donc plus le réseau.
    //
    // Verrou anti-doublon repris du suivi d'activité : si un chargement du
    // socle est déjà en vol, on rend sa promesse plutôt que d'en lancer un
    // second — le montage et le bus peuvent se déclencher coup sur coup.
    let EN_VOL = { cle: null, p: null };
    async function charger() {
      const cleMois = state.annee + '|' + state.mois;
      let socle;
      if (CACHE_SOCLE && CACHE_SOCLE.cle === cleMois) {
        socle = CACHE_SOCLE.j;
      } else if (EN_VOL.p && EN_VOL.cle === cleMois) {
        socle = await EN_VOL.p;
      } else {
        EN_VOL = { cle: cleMois, p: chargerSocle() };
        try { socle = await EN_VOL.p; }
        finally { if (EN_VOL.cle === cleMois) EN_VOL = { cle: null, p: null }; }
      }
      return agreger(socle, sitesSelection());
    }

    // -------------------------------------------------------------------------
    //  Les listes nominatives, chargées au clic et pas avant.
    //
    //  Un agrégat dit combien ; un vendeur veut savoir QUI. dashboard_tc_liste
    //  sert ces listes à la demande — les charger au démarrage alourdirait la
    //  page pour des dépliés que personne n'ouvrira.
    //
    //  Le cache est vidé à chaque changement de site ou de mois : une liste
    //  d'un autre périmètre serait pire que pas de liste du tout.
    // -------------------------------------------------------------------------
    let CACHE_LISTES = {};
    async function chargerListe(bloc) {
      const cle = bloc + '|' + cleSel();
      if (CACHE_LISTES[cle]) return CACHE_LISTES[cle];
      const jwt = await getUserJwt();
      if (!jwt) throw new Error('session absente');
      const res = await fetch(SUPABASE_URL + '/rest/v1/rpc/dashboard_tc_liste', {
        method: 'POST',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + jwt,
                   'Content-Type': 'application/json' },
        body: JSON.stringify({ p_bloc: bloc, p_annee: state.annee, p_mois: state.mois,
                               p_id_site: siteSelection(), p_limite: 60,
                               p_sites: sitesSelection() })
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const j = await res.json();
      CACHE_LISTES[cle] = j;
      return j;
    }

    // Un téléphone se compose, il ne se lit pas : on en fait un lien.
    function tel(n) {
      if (!n) return '<span class="pale">—</span>';
      const brut = String(n).replace(/[^0-9+]/g, '');
      return '<a href="tel:' + esc(brut) + '" class="dtel">' + esc(String(n)) + '</a>';
    }

    // Rendu d'une liste nominative. Les colonnes sont décrites une fois, la
    // colonne « vendeur » ne s'ajoute que lorsque le périmètre en compte
    // plusieurs — pour un vendeur elle ne répéterait que son propre nom.
    function listeNominative(j, cols) {
      const l = (j && j.lignes) || [];
      if (!l.length) return '<p class="ctx">Rien dans cette liste aujourd’hui.</p>';
      const c = cols.filter(x => x.k !== 'vendeur' || j.multi_vendeurs);
      const h = tableau(c.map(x => x.t), l.map(r => c.map(x => x.h(r))));
      const reste = num(j.total) - l.length;
      return h + (reste > 0
        ? '<p class="ctx">Les ' + fmt(l.length) + ' premiers sur ' + fmt(j.total)
          + '. Les ' + fmt(reste) + ' autres sont dans le kanban.</p>'
        : '');
    }

    // -------------------------------------------------------------------------
    //  LE STOCK
    //
    //  Premier poste d'immobilisation d'un groupe, et il n'était nulle part :
    //  31,4 M€ au 1er octobre, dont 11,6 qui dorment depuis plus de trois mois.
    //  Il ne dépend pas du mois — c'est une photo à l'instant — donc il se
    //  recharge au changement de périmètre seulement.
    // -------------------------------------------------------------------------
    let CACHE_STOCK = null;
    async function chargerStock() {
      const cle = 'tout';            // ventilé par site : un seul chargement suffit
      if (CACHE_STOCK && CACHE_STOCK.cle === cle) return CACHE_STOCK.j;
      const jwt = await getUserJwt();
      if (!jwt) throw new Error('session absente');
      const res = await fetch(SUPABASE_URL + '/rest/v1/rpc/dashboard_tc_stock', {
        method: 'POST',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + jwt,
                   'Content-Type': 'application/json' },
        body: '{}'
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const j = await res.json();
      CACHE_STOCK = { cle: cle, j: j };
      return j;
    }

    // Le stock et l'entonnoir arrivent eux aussi ventilés par site : on les
    // somme ici, comme le socle, pour que le périmètre reste sans appel.
    function agregerStock(j, ids) {
      const tous = ((j || {}).sites || []);
      const gard = (ids && ids.length)
        ? tous.filter(x => ids.indexOf(Number(x.id_site)) >= 0) : tous;
      const vn = sommer(gard.map(x => x.vn));
      const vo = sommer(gard.map(x => x.vo));
      const moy = o => num(o.age_n) > 0 ? Math.round(num(o.age_somme) / num(o.age_n)) : null;
      return {
        vn: Object.assign({}, vn, { age_moyen: moy(vn) }),
        vo: Object.assign({}, vo, { age_moyen: moy(vo) }),
        sites: gard.map(x => ({
          id_site: x.id_site, site: x.site,
          vn: num((x.vn || {}).n), vn_valeur: num((x.vn || {}).valeur), vn_90: num((x.vn || {}).plus_90j),
          vo: num((x.vo || {}).n), vo_valeur: num((x.vo || {}).valeur), vo_90: num((x.vo || {}).plus_90j)
        }))
      };
    }

    function agregerEntonnoir(j, ids) {
      const tous = ((j || {}).sites || []);
      const gard = (ids && ids.length)
        ? tous.filter(x => ids.indexOf(Number(x.id_site)) >= 0) : tous;
      const t = sommer(gard.map(x => { const y = Object.assign({}, x); delete y.id_site; return y; }));
      return {
        etapes: [
          { cle: 'preparation', lab: 'En préparation',
            n: num(t.preparation_n), montant: num(t.preparation_m) },
          { cle: 'approbation', lab: 'Demande d\u2019approbation',
            n: num(t.approbation_n), montant: num(t.approbation_m) },
          { cle: 'transmis', lab: 'Transmis / Validé',
            n: num(t.transmis_n), montant: num(t.transmis_m) }
        ],
        refus: { n: num(t.refus_n), montant: num(t.refus_m) },
        total: { n: num(t.preparation_n) + num(t.approbation_n) + num(t.transmis_n),
                 montant: num(t.preparation_m) + num(t.approbation_m) + num(t.transmis_m) }
      };
    }

    // -------------------------------------------------------------------------
    //  CE QUI N'EST PAS SUR LE CHEMIN CRITIQUE
    //
    //  La qualité de la base client (169 000 fiches, plus 1,2 million de lignes
    //  de consentement) et les détails des tiroirs coûtaient ensemble un demi-
    //  seconde DANS dashboard_tc — alors qu'aucun des deux ne nourrit une tuile.
    //  Ils arrivent maintenant à part, pendant que la page s'affiche déjà.
    // -------------------------------------------------------------------------
    let CACHE_BASE = null;
    async function chargerBase() {
      if (CACHE_BASE) return CACHE_BASE.j;
      const jwt = await getUserJwt();
      if (!jwt) throw new Error('session absente');
      const res = await fetch(SUPABASE_URL + '/rest/v1/rpc/dashboard_tc_base', {
        method: 'POST',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + jwt,
                   'Content-Type': 'application/json' },
        body: '{}'
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const j = await res.json();
      CACHE_BASE = { j: j };
      return j;
    }

    let CACHE_DETAIL = null;
    async function chargerDetail() {
      const cle = cleSel();
      if (CACHE_DETAIL && CACHE_DETAIL.cle === cle) return CACHE_DETAIL.j;
      const jwt = await getUserJwt();
      if (!jwt) throw new Error('session absente');
      const res = await fetch(SUPABASE_URL + '/rest/v1/rpc/dashboard_tc_detail', {
        method: 'POST',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + jwt,
                   'Content-Type': 'application/json' },
        body: JSON.stringify({ p_annee: state.annee, p_mois: state.mois, p_sites: sitesSelection() })
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const j = await res.json();
      CACHE_DETAIL = { cle: cle, j: j };
      return j;
    }

    // Les deux se recollent dans state.d, à l'endroit où les tuiles les
    // attendent : rien d'autre dans le module n'a besoin de le savoir.
    function greffer(cle, j) {
      if (!state.d || !j) return false;
      state.d[cle] = j;
      return true;
    }

    // -------------------------------------------------------------------------
    //  L'ENTONNOIR DES COMMANDES
    //
    //  Ce n'est pas un taux de conversion mais une FILE : où en sont, à cet
    //  instant, les commandes engagées et pas encore soldées. Les commandes
    //  closes en sont exclues — 33 416 lignes d'historique écrasaient l'échelle
    //  des trois étapes vivantes sans rien dire de ce qu'il reste à faire.
    // -------------------------------------------------------------------------
    let CACHE_ENTONNOIR = null;
    async function chargerEntonnoir() {
      const cle = 'tout';
      if (CACHE_ENTONNOIR && CACHE_ENTONNOIR.cle === cle) return CACHE_ENTONNOIR.j;
      const jwt = await getUserJwt();
      if (!jwt) throw new Error('session absente');
      const res = await fetch(SUPABASE_URL + '/rest/v1/rpc/dashboard_tc_entonnoir', {
        method: 'POST',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + jwt,
                   'Content-Type': 'application/json' },
        body: '{}'
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const j = await res.json();
      CACHE_ENTONNOIR = { cle: cle, j: j };
      return j;
    }

    // =========================================================================
    //  LE SOCLE, ET SON AGRÉGATION EN MÉMOIRE
    //
    //  C'est la méthode du suivi d'activité, qui est la seule page fluide de
    //  l'application : on charge UNE fois les chiffres ventilés par site, sans
    //  filtre de périmètre, puis on fait la somme ici selon le périmètre choisi.
    //  Changer de marque, d'affaire ou de site ne déclenche donc plus aucun
    //  appel — le travail se fait sur trente kilo-octets déjà en mémoire.
    //
    //  Règle de lecture : le socle ne contient ni taux ni médiane, qui ne
    //  s'additionnent pas. Il porte les numérateurs et les dénominateurs ; les
    //  divisions se font ici, APRÈS la somme.
    // =========================================================================
    let CACHE_SOCLE = null;
    async function chargerSocle() {
      const cle = state.annee + '|' + state.mois;
      if (CACHE_SOCLE && CACHE_SOCLE.cle === cle) return CACHE_SOCLE.j;
      const jwt = await getUserJwt();
      if (!jwt) throw new Error('session absente');
      const res = await fetch(SUPABASE_URL + '/rest/v1/rpc/dashboard_tc_socle', {
        method: 'POST',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + jwt,
                   'Content-Type': 'application/json' },
        body: JSON.stringify({ p_annee: state.annee, p_mois: state.mois })
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const j = await res.json();
      CACHE_SOCLE = { cle: cle, j: j };
      return j;
    }

    // La tranche médiane du premier contact, reconstruite à partir des compteurs
    // par tranche. On ne peut pas additionner des médianes entre sites, mais on
    // peut additionner des effectifs et retrouver où tombe le milieu.
    //
    // La moyenne, elle, était inutilisable : des leads de 2016 recontactés cette
    // année la portaient à 333 jours, là où la médiane réelle est d'un quart de
    // journée. On rend donc le haut de la tranche où tombe le milieu.
    const TRANCHES = [
      { k: 'd_15min', h: 0.25, lab: 'moins de 15 min' },
      { k: 'd_30min', h: 0.5,  lab: 'moins de 30 min' },
      { k: 'd_60min', h: 1,    lab: 'moins d\u2019une heure' },
      { k: 'd_4h',    h: 4,    lab: 'moins de 4 heures' },
      { k: 'd_24h',   h: 24,   lab: 'moins de 24 heures' },
      { k: 'd_plus',  h: null, lab: 'plus de 24 heures' }
    ];
    function delaiMedian(leads) {
      const n = num(leads.delai_n);
      if (!n) return null;
      let cumul = 0;
      for (let i = 0; i < TRANCHES.length; i++) {
        cumul += num(leads[TRANCHES[i].k]);
        if (cumul >= n / 2) return TRANCHES[i].h;   // null = au-delà de 24 h
      }
      return null;
    }

    // Somme de plusieurs objets plats, clé à clé.
    function sommer(objets) {
      const o = {};
      objets.forEach(x => {
        Object.keys(x || {}).forEach(k => { o[k] = num(o[k]) + num(x[k]); });
      });
      return o;
    }

    // Du socle vers la forme que tout le reste du module attend déjà. Rien
    // d'autre ne change : tuiles(), la météo, les graphes continuent de lire
    // state.d.prod, state.d.pipe, state.d.livr…
    function agreger(socle, ids) {
      const tous = (socle.sites || []);
      const gard = (ids && ids.length)
        ? tous.filter(x => ids.indexOf(Number(x.id_site)) >= 0)
        : tous;

      const prod  = sommer(gard.map(x => x.prod));
      const livr  = sommer(gard.map(x => x.livr));
      const pipe  = sommer(gard.map(x => x.pipe));
      const pval  = sommer(gard.map(x => x.pipe_val));
      const rap   = sommer(gard.map(x => x.rap));
      const rdv   = sommer(gard.map(x => x.rdv));
      const leads = sommer(gard.map(x => x.leads));
      const obj   = sommer(gard.map(x => x.obj));
      const met   = sommer(gard.map(x => x.meteo));

      // Les séries : on ne garde que les sites du périmètre, puis on recompose
      // les douze mois, y compris ceux sans aucune commande — un trou dans la
      // série décalerait le graphe.
      const parMois = {};
      (socle.serie || []).forEach(r => {
        if (ids && ids.length && ids.indexOf(Number(r.id_site)) < 0) return;
        const m = r.mois;
        if (!parMois[m]) parMois[m] = { mois: m };
        Object.keys(r).forEach(k => {
          if (k === 'mois' || k === 'id_site') return;
          parMois[m][k] = num(parMois[m][k]) + num(r[k]);
        });
      });
      const serie = [];
      const d0 = new Date(state.annee, state.mois - 1, 1);
      for (let i = 11; i >= 0; i--) {
        const dd = new Date(d0.getFullYear(), d0.getMonth() - i, 1);
        const cle = dd.getFullYear() + '-' + String(dd.getMonth() + 1).padStart(2, '0');
        const r = parMois[cle] || { mois: cle };
        // Les taux se calculent après la somme, jamais en moyennant des taux.
        serie.push({
          mois: cle, cdes: num(r.cdes),
          fi:      num(r.hors_loueurs) > 0 ? Math.round(100 * num(r.fi) / num(r.hors_loueurs)) : null,
          loa:     num(r.cdes) > 0 ? Math.round(100 * num(r.loa) / num(r.cdes)) : null,
          roole:   num(r.cdes) > 0 ? Math.round(100 * num(r.roole) / num(r.cdes)) : null,
          reprise: num(r.cdes) > 0 ? Math.round(100 * num(r.reprise) / num(r.cdes)) : null,
          phev:    num(r.phev), vu: num(r.vu),
          acc:     num(r.cdes) > 0 ? Math.round(num(r.acc) / num(r.cdes)) : 0
        });
      }

      return {
        annee: socle.annee, mois: socle.mois, role: socle.role,
        perimetre: socle.perimetre, seuils: socle.seuils,
        site: (ids && ids.length === 1) ? ids[0] : null,
        sites_actifs: ids || null,
        prod: prod,
        obj: { cdes: num(obj.cdes), fi: num(obj.fi) },
        serie: serie,
        pipe: Object.assign({}, pipe, {
          dossiers: num(pval.dossiers), montant: num(pval.montant), recents: num(pval.recents)
        }),
        livr: livr,
        act: { rapports: num(rap.rapports), rdv_a_venir: num(rdv.rdv_a_venir),
               rdv_tenus: num(rdv.rdv_tenus), rdv_soldes: num(rdv.rdv_soldes) },
        leads: Object.assign({}, leads, { delai_median_h: delaiMedian(leads) }),
        meteo: { cdes_jour: num(met.cdes_jour), devis_jour: num(met.devis_jour) },
        base: null, detail: null
      };
    }

    // Les séries de la RPC arrivent en douze lignes { mois, cdes, fi, ... }.
    function serie(cle) { return (state.d.serie || []).map(r => num(r[cle])); }
    function libellesMois() {
      return (state.d.serie || []).map(r => MOIS_COURT[parseInt(String(r.mois).slice(5), 10) - 1]);
    }
    // Écart entre le premier et le dernier mois de la série : c'est lui que la
    // tuile affiche sous le chiffre, jamais un écart au mois précédent, trop
    // bruité sur des volumes de cent commandes.
    function ecartAn(cle, unite) {
      const s = serie(cle).filter(v => v !== 0 || true);
      if (s.length < 2) return { txt: '', sens: 'plat' };
      const a = s[0], b = s[s.length - 1];
      if (!a) return { txt: '', sens: 'plat' };
      if (unite === 'pts') {
        const e = Math.round(b - a);
        return { txt: (e > 0 ? '+' : '') + e + ' pts sur un an', sens: e < -2 ? 'baisse' : e > 2 ? 'hausse' : 'plat' };
      }
      const e = Math.round((b - a) / a * 100);
      return { txt: (e > 0 ? '+' : '') + e + ' % sur un an', sens: e < -5 ? 'baisse' : e > 5 ? 'hausse' : 'plat' };
    }

    // =========================================================================
    //  GRAPHIQUES
    // =========================================================================
    function etincelle(vals, forme, couleur) {
      if (!vals || !vals.length) return '';
      const W = 160, H = 30, n = vals.length;
      const mx = Math.max.apply(null, vals), mn = forme === 'barres' ? 0 : Math.min.apply(null, vals);
      const y = v => H - 3 - (H - 6) * ((v - mn) / ((mx - mn) || 1));
      let h = '';
      if (forme === 'barres') {
        const w = W / n;
        vals.forEach((v, i) => {
          h += '<rect x="' + (i * w + 1).toFixed(1) + '" y="' + y(v).toFixed(1) + '" width="' + (w - 2).toFixed(1)
            + '" height="' + Math.max(H - 3 - y(v), 0).toFixed(1) + '" rx="1.5" fill="' + couleur
            + '" fill-opacity="' + (i === n - 1 ? 1 : .32) + '"/>';
        });
      } else {
        const x = i => (i / (n - 1)) * (W - 4) + 2;
        h += '<polyline fill="none" stroke="' + couleur + '" stroke-width="2" stroke-linejoin="round"'
          + ' stroke-linecap="round" points="'
          + vals.map((v, i) => x(i).toFixed(1) + ',' + y(v).toFixed(1)).join(' ') + '"/>';
        h += '<circle cx="' + x(n - 1).toFixed(1) + '" cy="' + y(vals[n - 1]).toFixed(1)
          + '" r="3" fill="' + couleur + '" stroke="var(--card)" stroke-width="1.5"/>';
      }
      return '<svg class="sp" viewBox="0 0 ' + W + ' ' + H + '" preserveAspectRatio="none" aria-hidden="true">'
        + h + '</svg>';
    }

    // Graphe du tiroir. Une seule échelle, jamais deux axes : quand une seconde
    // série est tracée (le financement sous la LOA), elle partage l'axe — ce
    // sont deux pourcentages, la comparaison a un sens.
    // L'entonnoir : une barre par étape, large comme l'argent qu'elle immobilise.
    // En HTML et non en SVG — un viewBox étiré pour occuper la largeur aurait
    // déformé les libellés avec lui.
    //
    // Les étapes ne décroissent pas forcément : « transmis » peut être plus
    // fourni que « en préparation ». Ce sont des files d'attente, pas les
    // paliers d'un tamis ; c'est la largeur qu'on compare, pas la pente.
    function entonnoirHtml(j) {
      const et = ((j || {}).etapes || []);
      if (!et.length) return '<p class="ctx">Aucune commande en cours sur ce périmètre.</p>';
      const mx = Math.max.apply(null, et.map(x => num(x.montant))) || 1;
      const TEINTES = { preparation: 'var(--m-bleu)', approbation: 'var(--m-orange)',
                        transmis: 'var(--m-vert)' };
      const lignes = et.map(x => {
        const w = Math.max(num(x.montant) / mx * 100, 1.5);
        return '<div class="dent-l">'
          + '<div class="dent-h"><b>' + esc(x.lab) + '</b>'
          + '<span>' + fmt(x.n) + ' dossier' + (num(x.n) > 1 ? 's' : '') + ' \u00b7 '
          + fmtEur(x.montant) + '</span></div>'
          + '<div class="dent-p"><div class="dent-b" style="width:' + w.toFixed(1)
          + '%;background:' + (TEINTES[x.cle] || 'var(--m-bleu)') + '"></div></div></div>';
      }).join('');
      const tot = (j || {}).total || {}, ref = (j || {}).refus || {};
      return '<div class="dent">' + lignes + '</div>'
        + '<p class="dnote"><b>' + fmt(tot.n) + ' commandes engagées, ' + fmtEur(tot.montant)
        + '</b>, en attente d\u2019être soldées.'
        + (num(ref.n) > 0 ? ' À côté, ' + fmt(ref.n) + ' commande' + (num(ref.n) > 1 ? 's' : '')
           + ' refusée' + (num(ref.n) > 1 ? 's' : '') + ' pour ' + fmtEur(ref.montant)
           + ' — elles ne sont dans aucune étape, elles sont sorties.' : '')
        + '</p>';
    }

    function graphe(vals, forme, libelles, unite, second, titre) {
      if (!vals || !vals.length) return '';
      const W = 520, H = 190, gT = 22, gR = 12, gB = 30, gL = 34;
      const tous = second ? vals.concat(second) : vals;
      const mx = Math.max.apply(null, tous) || 1, mn = 0;
      const y = v => gT + (H - gT - gB) * (1 - (v - mn) / ((mx - mn) || 1));
      const x = i => gL + (i / (vals.length - 1)) * (W - gL - gR);
      let h = '';
      for (let k = 0; k <= 3; k++) {
        const v = mn + (mx - mn) * k / 3;
        h += '<line x1="' + gL + '" y1="' + y(v).toFixed(1) + '" x2="' + (W - gR) + '" y2="' + y(v).toFixed(1)
          + '" stroke="var(--line)" stroke-width="1"/>'
          + '<text class="m" x="' + (gL - 7) + '" y="' + (y(v) + 4).toFixed(1) + '" text-anchor="end"'
          + ' font-size="10" fill="var(--ink-3)">' + Math.round(v) + '</text>';
      }
      if (forme === 'barres') {
        const w = (W - gL - gR) / vals.length;
        vals.forEach((v, i) => {
          h += '<rect x="' + (gL + i * w + 2).toFixed(1) + '" y="' + y(v).toFixed(1) + '" width="' + (w - 4).toFixed(1)
            + '" height="' + Math.max(y(mn) - y(v), 0).toFixed(1) + '" rx="2.5" fill="var(--m-bleu)"'
            + ' fill-opacity="' + (i === vals.length - 1 ? 1 : .42) + '"/>';
        });
        h += '<text class="m" x="' + (gL + w * (vals.length - .5)).toFixed(1) + '" y="'
          + (y(vals[vals.length - 1]) - 8).toFixed(1) + '" text-anchor="middle" font-size="11.5"'
          + ' font-weight="700" fill="var(--ink)">' + vals[vals.length - 1] + '</text>';
      } else {
        if (second) {
          h += '<polyline fill="none" stroke="var(--m-bleu)" stroke-width="2" stroke-dasharray="4 3" points="'
            + second.map((v, i) => x(i).toFixed(1) + ',' + y(v).toFixed(1)).join(' ') + '"/>';
        }
        h += '<polyline fill="none" stroke="var(--m-orange)" stroke-width="2.5" stroke-linejoin="round" points="'
          + vals.map((v, i) => x(i).toFixed(1) + ',' + y(v).toFixed(1)).join(' ') + '"/>';
        vals.forEach((v, i) => {
          h += '<circle cx="' + x(i).toFixed(1) + '" cy="' + y(v).toFixed(1) + '" r="3.2"'
            + ' fill="var(--m-orange)" stroke="var(--card)" stroke-width="1.5"/>';
        });
        const bout = (i, v, anc, dx) => '<text class="m" x="' + (x(i) + dx).toFixed(1) + '" y="'
          + (y(v) - 11).toFixed(1) + '" text-anchor="' + anc + '" font-size="11.5" font-weight="700"'
          + ' fill="var(--ink)">' + v + (unite || '') + '</text>';
        h += bout(0, vals[0], 'start', 13) + bout(vals.length - 1, vals[vals.length - 1], 'end', -4);
      }
      (libelles || []).forEach((m, i) => {
        if (i % 2 && i !== libelles.length - 1) return;
        const cx = forme === 'barres'
          ? gL + ((W - gL - gR) / vals.length) * (i + .5) : x(i);
        h += '<text x="' + cx.toFixed(1) + '" y="' + (H - gB + 18) + '" text-anchor="middle" font-size="10"'
          + ' fill="var(--ink-3)">' + esc(m) + '</text>';
      });
      if (second) {
        h += '<text x="' + (W - gR) + '" y="' + (gT - 8) + '" text-anchor="end" font-size="10.5"'
          + ' font-weight="700" fill="var(--m-bleu)">— — taux de financement</text>';
      }
      return '<svg class="gr" viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="'
        + esc(titre || '') + ', douze mois glissants">' + h + '</svg>';
    }

    function tableau(entetes, lignes) {
      return '<div class="dscroll"><table class="dmini"><thead><tr>'
        + entetes.map((e, i) => '<th' + (i === 0 ? '' : '') + '>' + e + '</th>').join('')
        + '</tr></thead><tbody>'
        + lignes.map(l => '<tr>' + l.map((c, i) =>
            '<td' + (c && c.cls ? ' class="' + c.cls + '"' : '') + '>' + (c && c.h != null ? c.h : esc(c)) + '</td>'
          ).join('') + '</tr>').join('')
        + '</tbody></table></div>';
    }

    // Variante : mêmes cellules, mais chaque ligne porte ses propres attributs
    // (niveau d'arbre, clé de périmètre) et la table une classe. Sert à
    // l'arborescence marque › affaire › site de la direction.
    function tableauLignes(entetes, lignes, classeTable) {
      return '<div class="dscroll"><table class="dmini ' + (classeTable || '') + '"><thead><tr>'
        + entetes.map(e => '<th>' + e + '</th>').join('')
        + '</tr></thead><tbody>'
        + lignes.map(l => '<tr' + (l.attrs || '') + '>' + (l.c || []).map(c =>
            '<td' + (c && c.cls ? ' class="' + c.cls + '"' : '') + '>'
            + (c && c.h != null ? c.h : esc(c)) + '</td>'
          ).join('') + '</tr>').join('')
        + '</tbody></table></div>';
    }

    // =========================================================================
    //  LES TUILES
    //  Chaque entrée décrit ce qu'elle affiche et ce qu'elle ouvre. Le constat
    //  ("trouvaille") est CALCULÉ sur les données du moment : il change avec
    //  elles, il n'est pas écrit en dur.
    // =========================================================================
    // Rôles (table ROLE) : 1 Admin · 2 Directeur · 3 Chef des ventes · 4 Vendeur
    // 5 Responsable marketing · 6 Dir. plaque · 7 Dir. marque · 8 Dir. groupe
    const ROLE_FAM = { 1: 'direction', 2: 'direction', 3: 'chef', 4: 'vendeur',
                       5: 'marketing', 6: 'direction', 7: 'direction', 8: 'direction' };
    // Ce que chaque fonction a besoin de voir. Un vendeur n'a rien à faire de la
    // valeur du pipe du groupe ni de la file de fusion ; un responsable
    // marketing n'a rien à faire du taux de LOA. Mieux vaut six tuiles utiles
    // que vingt dont douze ne le concernent pas.
    const JEUX = {
      // Le vendeur : ce sur quoi il agit lui-même dans la journée.
      vendeur:   ['cdes', 'fi', 'acc', 'affaires', 'relance', 'pipecom', 'livr', 'leads', 'delai'],
      // Le chef : la production de son équipe, plus les objectifs individuels
      // qu'il suit — PHEV et utilitaires en font partie, ils sont fixés par
      // vendeur et par mois.
      // Le stock lui sert autant qu'à la direction : c'est lui qui décide ce
      // qu'on pousse cette semaine, et un VN de plus de 90 jours sur son parc
      // est son problème avant d'être celui du groupe.
      chef:      ['cdes', 'fi', 'loa', 'acc', 'roole', 'reprise', 'phev', 'vu',
                  'stock_vn', 'stock_vo',
                  'affaires', 'relance', 'pipeval', 'pipecom', 'livr', 'cloturer',
                  'rapports', 'rdv', 'leads', 'delai'],
      // La direction : NEUF tuiles, pas seize. Un directeur de groupe ou de
      // plaque ne pilote pas le détail — il pilote ce qui engage de l'argent et
      // ce qui dérive. Tout le reste reste accessible : chaque tuile ouvre sur
      // l'arborescence, et les pages Performances et Activité portent le détail.
      //
      // Ce qui est SORTI de son jeu, et pourquoi :
      //   loa, roole, reprise  — composantes de marge, elles se pilotent au site
      //   affaires, relance    — le travail du chef des ventes, pas le sien
      //   cloturer             — administratif, il est déjà dans « à livrer »
      //   delai, fusion, bloctel — détail d'exécution, pages dédiées
      // Et ce qui ENTRE : le stock, premier poste d'immobilisation du groupe,
      // qui n'était nulle part.
      direction: ['cdes', 'fi', 'acc',
                  'stock_vn', 'stock_vo',
                  'pipeval', 'pipecom', 'livr', 'leads', 'injoignables'],
      marketing: ['cdes', 'leads', 'delai', 'injoignables', 'fusion', 'bloctel']
    };
    const ETIQ_ROLE = { vendeur: 'Vendeur', chef: 'Chef des ventes',
                        direction: 'Direction', marketing: 'Marketing' };
    // Le titre dit à qui la page s'adresse, et donc ce qu'on va y trouver.
    const TITRE_ROLE = { vendeur: 'Votre journée', chef: 'Votre équipe aujourd’hui',
                         direction: 'Le tableau du groupe', marketing: 'Ce qui entre, ce qui se perd' };
    function familleRole() { return ROLE_FAM[Number((state.d || {}).role)] || 'direction'; }
    function jeuDuRole() { return JEUX[familleRole()] || null; }
    // Un vendeur lit « mes » et non « les » : les libellés s'adaptent.
    function moi(txt) { return familleRole() === 'vendeur' ? txt.replace(/^Les /, 'Mes ') : txt; }

    // =========================================================================
    //  LES VUES PAR RÔLE
    //
    //  Filtrer les tuiles par rôle ne suffisait pas : le DÉPLI restait celui du
    //  chef des ventes. Un vendeur cliquait sur « À relancer » et lisait « Le
    //  portefeuille de chacun » — un tableau d'une seule ligne, la sienne, avec
    //  la phrase « Mina Tang porte 26 affaires ». Elle le sait : c'est elle.
    //
    //  Une tuile porte donc maintenant, en plus de ses valeurs par défaut, un
    //  bloc `vues` qui redéfinit titre, contexte, trouvaille, tableau ou liste
    //  pour une famille de rôle donnée. Ce qui n'est pas redéfini retombe sur
    //  la valeur commune.
    //
    //  La règle qui guide le choix : le chef compare ses vendeurs, la direction
    //  compare ses sites, LE VENDEUR NE COMPARE RIEN — il a besoin de noms, de
    //  numéros et d'un ordre de priorité pour sa journée.
    // =========================================================================
    //  Le découpage se fait par défaut, tuile par tuile, plutôt que d'écrire
    //  quarante blocs à la main : à la direction l'arborescence de son
    //  indicateur, au chef le classement de son équipe sur ce même indicateur,
    //  au marketing les sources. Une tuile peut toujours redéfinir sa vue à la
    //  main dans `vues` — c'est ce que fait le vendeur, dont les dépliés sont
    //  des listes d'appels et non des comparatifs.
    function vue(t, champ) {
      const fam = familleRole();
      const v = (t.vues || {})[fam];
      if (v && Object.prototype.hasOwnProperty.call(v, champ)) return v[champ];

      if (fam === 'direction') {
        if (champ === 'arbre') return IND[t.id] ? t.id : null;
        // Le détail par vendeur n'a pas de sens sur douze affaires et cent
        // vendeurs : l'arbre le remplace.
        if (champ === 'table' && IND[t.id]) return () => '';
        if (champ === 'titre' && IND[t.id]) return t.titre + ' — par marque, affaire et site';
      }
      if (fam === 'chef') {
        if (champ === 'equipe') return VEND[t.id] ? t.id : null;
        if (champ === 'titre' && VEND[t.id]) return t.titre + ' — votre équipe';
        // Le stock ne se ventile pas par vendeur mais par site : un chef qui en
        // couvre deux doit voir lequel porte les véhicules âgés.
        if (champ === 'arbre' && (t.id === 'stock_vn' || t.id === 'stock_vo')
            && (state.d.perimetre || []).length > 1) return t.id;
      }
      if (fam === 'marketing') {
        if (champ === 'sources') return (t.id === 'leads' || t.id === 'delai') ? true : null;
      }
      return t[champ];
    }

    // ---- Jeux de colonnes réutilisables pour les listes nominatives ----------
    const COL_CLIENT   = { k: 'client', t: 'Client',
                           h: r => ({ h: '<b>' + esc(r.client || '—') + '</b>' }) };
    const COL_TEL      = { k: 'tel', t: 'Téléphone', h: r => ({ h: tel(r.tel) }) };
    const COL_VENDEUR  = { k: 'vendeur', t: 'Vendeur',
                           h: r => ({ h: '<span class="pale">' + esc(r.vendeur || '—') + '</span>' }) };
    const COL_VEHICULE = { k: 'vehicule', t: 'Véhicule',
                           h: r => ({ h: r.vehicule ? esc(r.vehicule) : '<span class="pale">—</span>',
                                      cls: 'coupe' }) };
    const COL_AGE      = { k: 'age', t: 'Ouverte depuis',
                           h: r => ({ h: '<span class="f">' + fmt(r.age) + ' j</span>' }) };

    function colsAffaires() { return [COL_CLIENT, COL_TEL, COL_AGE, COL_VENDEUR]; }
    function colsLivraisons() {
      return [COL_CLIENT, COL_VEHICULE, COL_TEL,
              { k: 'd', t: 'Promise le', h: r => ({ h: '<span class="f">' + jourCourt(r.date_promise) + '</span>' }) },
              COL_VENDEUR];
    }
    function colsCommandes() {
      return [COL_CLIENT, COL_VEHICULE, COL_TEL,
              { k: 'j', t: 'Commandée le', h: r => ({ h: jourCourt(r.jour) }) }, COL_VENDEUR];
    }
    function colsLeads() {
      return [COL_CLIENT, COL_TEL,
              { k: 's', t: 'Source', h: r => ({ h: r.source ? esc(r.source) : '<span class="pale">—</span>' }) },
              { k: 'j', t: 'Reçu il y a', h: r => ({ h: '<span class="f">' + fmt(r.jours) + ' j</span>' }) },
              COL_VENDEUR];
    }
    // =========================================================================
    //  L'ARBRE CHIFFRÉ — marque › affaire › site
    //
    //  C'est la lecture de la direction : elle ne compare pas des vendeurs, elle
    //  compare des entités. L'arbre agrège les sites en affaires et les affaires
    //  en marques, additionne les numérateurs et les dénominateurs séparément —
    //  une moyenne de taux n'est pas un taux — et se replie.
    //
    //  Les branches sans activité du mois sont rangées à la fin et repliées :
    //  sur vingt-sept sites, vingt-quatre sont à zéro pendant le pilote, et les
    //  laisser au milieu noierait les trois qui produisent.
    // =========================================================================
    let CACHE_ARBRE = null;
    async function chargerArbre() {
      if (CACHE_ARBRE && CACHE_ARBRE.cle === state.annee + '|' + state.mois) return CACHE_ARBRE.j;
      const jwt = await getUserJwt();
      if (!jwt) throw new Error('session absente');
      const res = await fetch(SUPABASE_URL + '/rest/v1/rpc/dashboard_tc_arbre', {
        method: 'POST',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + jwt,
                   'Content-Type': 'application/json' },
        body: JSON.stringify({ p_annee: state.annee, p_mois: state.mois })
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const j = await res.json();
      CACHE_ARBRE = { cle: state.annee + '|' + state.mois, j: j };
      return j;
    }

    // L'arbre vient de dashboard_tc_arbre, le stock de dashboard_tc_stock : deux
    // appels, un seul tableau. On greffe l'un sur l'autre par identifiant de site
    // plutôt que de faire une troisième requête qui les joindrait.
    function arbreAvecStock(j) {
      const st2 = ((state.stock || {}).sites) || [];
      if (!j || !j.sites || !st2.length) return j;
      const par = {};
      st2.forEach(x => { par[String(x.id_site)] = x; });
      return Object.assign({}, j, {
        sites: j.sites.map(x => Object.assign({}, x, par[String(x.id_site)] || {}))
      });
    }

    // Somme de tous les compteurs d'un ensemble de sites.
    const CLES_SOMME = ['cdes', 'obj_cdes', 'hors_loueurs', 'fi', 'loa', 'roole', 'reprise',
                        'phev', 'vu', 'acc_total', 'affaires', 'a_relancer', 'froides',
                        'livr', 'retard', 'a_cloturer', 'leads', 'leads_jamais',
                        'vn', 'vn_valeur', 'vn_90', 'vo', 'vo_valeur', 'vo_90'];
    function somme(sites) {
      const o = {};
      CLES_SOMME.forEach(k => { o[k] = sites.reduce((a, s2) => a + num(s2[k]), 0); });
      o._n = sites.length;
      return o;
    }

    function construireArbre(sites) {
      const marques = [];
      (sites || []).forEach(s2 => {
        const mk = s2.reseau || '__sans';
        let m = marques.find(x => x.k === mk);
        if (!m) { m = { k: mk, lab: s2.reseau || 'Sans marque', aff: [], sites: [] }; marques.push(m); }
        m.sites.push(s2);
        const ak = s2.affaire || '__sans';
        let a = m.aff.find(x => x.k === ak);
        if (!a) { a = { k: mk + '|' + ak, lab: s2.affaire || 'Sans affaire', sites: [] }; m.aff.push(a); }
        a.sites.push(s2);
      });
      marques.forEach(m => {
        m.agg = somme(m.sites);
        m.aff.forEach(a => {
          a.agg = somme(a.sites);
          a.sites.sort((x, y) => num(y.cdes) - num(x.cdes) || String(x.site).localeCompare(String(y.site)));
        });
        // Les affaires qui produisent d'abord, les dormantes ensuite.
        m.aff.sort((a, b) => num(b.agg.cdes) - num(a.agg.cdes) || a.lab.localeCompare(b.lab));
      });
      marques.sort((a, b) => num(b.agg.cdes) - num(a.agg.cdes) || a.lab.localeCompare(b.lab));
      return marques;
    }

    // Un indicateur décrit comment se lit une cellule de l'arbre : son en-tête,
    // sa valeur à partir d'un agrégat, et si un petit est mauvais ou bon.
    const IND = {
      cdes:     { t: 'Commandes', v: a => fmt(a.cdes),
                  s: a => num(a.obj_cdes) > 0 ? (pct(a.cdes, a.obj_cdes) + ' % de ' + fmt(a.obj_cdes)) : null,
                  bon: a => num(a.obj_cdes) > 0 && num(a.cdes) >= num(a.obj_cdes) },
      fi:       { t: 'Financement', v: a => { const p2 = pct(a.fi, a.hors_loueurs); return p2 == null ? '—' : p2 + ' %'; },
                  s: a => fmt(a.fi) + ' sur ' + fmt(a.hors_loueurs) },
      loa:      { t: 'LOA / Easy', v: a => { const p2 = pct(a.loa, a.cdes); return p2 == null ? '—' : p2 + ' %'; } },
      acc:      { t: 'Accessoires', v: a => num(a.cdes) > 0 ? fmt(Math.round(num(a.acc_total) / num(a.cdes))) + ' €' : '—' },
      roole:    { t: 'Roole', v: a => { const p2 = pct(a.roole, a.cdes); return p2 == null ? '—' : p2 + ' %'; } },
      reprise:  { t: 'Reprises', v: a => { const p2 = pct(a.reprise, a.cdes); return p2 == null ? '—' : p2 + ' %'; } },
      phev:     { t: 'PHEV / EV', v: a => fmt(a.phev) },
      vu:       { t: 'Utilitaires', v: a => fmt(a.vu) },
      affaires: { t: 'Affaires ouvertes', v: a => fmt(a.affaires), s: a => fmt(a.froides) + ' froides' },
      relance:  { t: 'À relancer', v: a => fmt(a.a_relancer) },
      livr:     { t: 'À livrer', v: a => fmt(a.livr), s: a => fmt(a.retard) + ' en retard' },
      cloturer: { t: 'À clôturer', v: a => fmt(a.a_cloturer) },
      leads:    { t: 'Leads 30 j', v: a => fmt(a.leads), s: a => fmt(a.leads_jamais) + ' sans appel' },
      delai:    { t: 'Leads sans appel', v: a => fmt(a.leads_jamais) },
      stock_vn: { t: 'Stock VN', v: a => fmt(a.vn),
                  s: a => fmtEur(a.vn_valeur) + (num(a.vn_90) > 0 ? ' · ' + fmt(a.vn_90) + ' > 90 j' : '') },
      stock_vo: { t: 'Stock VO', v: a => fmt(a.vo),
                  s: a => fmtEur(a.vo_valeur) + (num(a.vo_90) > 0 ? ' · ' + fmt(a.vo_90) + ' > 90 j' : '') }
    };

    // Rendu de l'arbre pour UN indicateur, plus la colonne commandes comme
    // repère de volume — un taux sans son volume ne se compare pas.
    function rendreArbre(j, indCle) {
      const ind = IND[indCle] || IND.cdes;
      const jj = arbreAvecStock(j);
      const marques = construireArbre((jj || {}).sites || []);
      if (!marques.length) return '<p class="ctx">Aucun site dans votre périmètre.</p>';
      // Même règle que pour l'équipe : le repère « Commandes » ne s'ajoute pas
      // quand l'indicateur regardé est déjà les commandes.
      const repere = ind.t !== 'Commandes';
      const entetes = ['Périmètre'].concat(repere ? ['Commandes'] : []).concat([ind.t, '']);
      const lignes = [];
      let muets = 0;

      const cellules = (agg, lab, niveau, cle, idSite) => {
        const vide = num(agg.cdes) === 0;
        const sous = ind.s ? ind.s(agg) : null;
        return {
          attrs: ' class="lv' + niveau + (vide ? ' dmuet' : '')
               + (idSite != null && String(idSite) === String(siteSelection()) ? ' actif' : '') + '"'
               + (idSite != null ? ' data-site="' + esc(idSite) + '"' : '')
               + (cle ? ' data-cle="' + esc(cle) + '"' : ''),
          c: [
            { h: (niveau < 3 ? '<span class="pli">' + (state.arbrePlis[cle] === false ? '▸' : '▾') + '</span>' : '')
                 + esc(lab) }
          ].concat(repere ? [{ h: '<span class="f">' + fmt(agg.cdes) + '</span>' }] : [])
           .concat([
            { h: '<span class="f"' + (ind.bon && ind.bon(agg) ? ' style="color:var(--m-vert)"' : '') + '>'
                 + ind.v(agg) + '</span>' },
            { h: sous ? '<span class="pale">' + sous + '</span>' : '' }
          ])
        };
      };

      marques.forEach(m => {
        lignes.push(cellules(m.agg, m.lab, 1, 'm:' + m.k, null));
        if (state.arbrePlis['m:' + m.k] === false) return;
        m.aff.forEach(a => {
          if (num(a.agg.cdes) === 0) { muets += a.sites.length; return; }
          lignes.push(cellules(a.agg, a.lab, 2, 'a:' + a.k, null));
          if (state.arbrePlis['a:' + a.k] === false) return;
          a.sites.forEach(s2 => {
            lignes.push(cellules(s2, s2.site, 3, null, s2.id_site));
          });
        });
      });

      return tableauLignes(entetes, lignes, 'darbre')
        + (muets > 0 ? '<p class="dnote">' + fmt(muets) + ' sites sans commande ce mois-ci ne sont pas '
           + 'affichés. Cliquez une ligne pour filtrer le tableau de bord sur ce périmètre.</p>'
           : '<p class="dnote">Cliquez une ligne pour filtrer le tableau de bord sur ce périmètre.</p>');
    }

    // =========================================================================
    //  L'ÉQUIPE — la lecture du chef des ventes
    //
    //  Il ne compare pas des sites, il compare des gens. Chaque tuile ouvre sur
    //  le classement de son équipe pour CET indicateur, avec l'écart à
    //  l'objectif individuel quand il existe.
    // =========================================================================
    let CACHE_EQUIPE = null;
    async function chargerEquipe() {
      const cle = cleSel();
      if (CACHE_EQUIPE && CACHE_EQUIPE.cle === cle) return CACHE_EQUIPE.j;
      const jwt = await getUserJwt();
      if (!jwt) throw new Error('session absente');
      const res = await fetch(SUPABASE_URL + '/rest/v1/rpc/dashboard_tc_equipe', {
        method: 'POST',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + jwt,
                   'Content-Type': 'application/json' },
        body: JSON.stringify({ p_annee: state.annee, p_mois: state.mois,
                               p_id_site: siteSelection(), p_sites: sitesSelection() })
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const j = await res.json();
      CACHE_EQUIPE = { cle: cle, j: j };
      return j;
    }

    // Comment se lit un vendeur pour chaque indicateur : sa valeur, son repère,
    // et le critère de tri — le plus faible en premier quand c'est un manque.
    const VEND = {
      cdes:     { t: 'Commandes', v: v => fmt(v.cdes),
                  r: v => num(v.obj_cdes) > 0 ? pct(v.cdes, v.obj_cdes) + ' % de ' + fmt(v.obj_cdes) : 'sans objectif',
                  tri: (a, b) => num(b.cdes) - num(a.cdes),
                  mauvais: v => num(v.obj_cdes) > 0 && num(v.cdes) < num(v.obj_cdes) },
      fi:       { t: 'Financement', v: v => { const p2 = pct(v.fi, v.hors_loueurs); return p2 == null ? '—' : p2 + ' %'; },
                  r: v => fmt(v.fi) + ' sur ' + fmt(v.hors_loueurs),
                  tri: (a, b) => (pct(a.fi, a.hors_loueurs) || 0) - (pct(b.fi, b.hors_loueurs) || 0),
                  mauvais: v => num(v.hors_loueurs) >= 5 && (pct(v.fi, v.hors_loueurs) || 0) < 20 },
      loa:      { t: 'LOA / Easy', v: v => { const p2 = pct(v.loa, v.cdes); return p2 == null ? '—' : p2 + ' %'; },
                  tri: (a, b) => (pct(a.loa, a.cdes) || 0) - (pct(b.loa, b.cdes) || 0) },
      acc:      { t: 'Accessoires', v: v => num(v.cdes) > 0 ? fmt(Math.round(num(v.acc_total) / num(v.cdes))) + ' €' : '—',
                  tri: (a, b) => (num(a.cdes) ? num(a.acc_total) / num(a.cdes) : 0)
                               - (num(b.cdes) ? num(b.acc_total) / num(b.cdes) : 0) },
      roole:    { t: 'Roole', v: v => { const p2 = pct(v.roole, v.cdes); return p2 == null ? '—' : p2 + ' %'; },
                  tri: (a, b) => (pct(a.roole, a.cdes) || 0) - (pct(b.roole, b.cdes) || 0) },
      reprise:  { t: 'Reprises', v: v => { const p2 = pct(v.reprise, v.cdes); return p2 == null ? '—' : p2 + ' %'; },
                  tri: (a, b) => (pct(a.reprise, a.cdes) || 0) - (pct(b.reprise, b.cdes) || 0) },
      phev:     { t: 'PHEV / EV', v: v => fmt(v.phev), tri: (a, b) => num(a.phev) - num(b.phev) },
      vu:       { t: 'Utilitaires', v: v => fmt(v.vu), tri: (a, b) => num(a.vu) - num(b.vu) },
      affaires: { t: 'Affaires ouvertes', v: v => fmt(v.affaires),
                  r: v => fmt(v.froides) + ' froides', tri: (a, b) => num(b.froides) - num(a.froides),
                  mauvais: v => num(v.affaires) > 0 && num(v.froides) > num(v.affaires) * .5 },
      relance:  { t: 'À relancer', v: v => fmt(v.a_relancer),
                  r: v => num(v.plus_vieille) > 0 ? 'la plus vieille : ' + fmt(v.plus_vieille) + ' j' : '',
                  tri: (a, b) => num(b.a_relancer) - num(a.a_relancer) },
      livr:     { t: 'À livrer', v: v => fmt(v.livr), r: v => fmt(v.retard) + ' en retard',
                  tri: (a, b) => num(b.retard) - num(a.retard),
                  mauvais: v => num(v.retard) > 0 },
      rapports: { t: 'Rapports 30 j', v: v => fmt(v.rapports),
                  tri: (a, b) => num(a.rapports) - num(b.rapports),
                  mauvais: v => num(v.cdes) > 0 && num(v.rapports) === 0 },
      leads:    { t: 'Leads sans appel', v: v => fmt(v.leads_jamais),
                  tri: (a, b) => num(b.leads_jamais) - num(a.leads_jamais),
                  mauvais: v => num(v.leads_jamais) >= 20 },
      delai:    { t: 'Leads sans appel', v: v => fmt(v.leads_jamais),
                  tri: (a, b) => num(b.leads_jamais) - num(a.leads_jamais),
                  mauvais: v => num(v.leads_jamais) >= 20 }
    };

    function rendreEquipe(j, indCle) {
      const d = VEND[indCle] || VEND.cdes;
      // Un vendeur sans commande ni affaire ni lead n'est pas en retard : il
      // n'est pas en poste. L'afficher ferait passer l'équipe pour deux fois
      // plus grande qu'elle n'est.
      const tous = ((j || {}).vendeurs || []).filter(v =>
        num(v.cdes) + num(v.affaires) + num(v.livr) + num(v.leads_jamais) + num(v.rapports) > 0);
      if (!tous.length) return '<p class="ctx">Aucune activité sur votre équipe ce mois-ci.</p>';
      const l = tous.slice().sort(d.tri);
      const multi = new Set(tous.map(v => v.site)).size > 1;
      // Les commandes servent de repère à côté de l'indicateur regardé — sauf
      // quand l'indicateur EST les commandes : la colonne apparaissait alors
      // deux fois, même intitulé et même valeur.
      const repere = d.t !== 'Commandes';
      const entetes = ['Vendeur'].concat(repere ? ['Commandes'] : []).concat([d.t, ''])
        .concat(multi ? ['Site'] : []);
      return tableauLignes(entetes, l.map(v => ({
        attrs: d.mauvais && d.mauvais(v) ? ' class="dmuet"' : '',
        c: [{ h: '<b>' + esc(v.nom) + '</b>' }]
          .concat(repere ? [{ h: '<span class="f">' + fmt(v.cdes) + '</span>' }] : [])
          .concat([
            { h: '<span class="f"' + (d.mauvais && d.mauvais(v) ? ' style="color:var(--m-rouge)"' : '')
                 + '>' + d.v(v) + '</span>' },
            { h: d.r ? '<span class="pale">' + d.r(v) + '</span>' : '' }
          ])
          .concat(multi ? [{ h: '<span class="pale">' + esc(v.site || '—') + '</span>' }] : [])
      })), 'dequipe');
    }

    // =========================================================================
    //  LES SOURCES DE LEADS — la lecture du marketing
    // =========================================================================
    let CACHE_SOURCES = null;
    async function chargerSources() {
      const cle = cleSel();
      if (CACHE_SOURCES && CACHE_SOURCES.cle === cle) return CACHE_SOURCES.j;
      const jwt = await getUserJwt();
      if (!jwt) throw new Error('session absente');
      const res = await fetch(SUPABASE_URL + '/rest/v1/rpc/dashboard_tc_sources', {
        method: 'POST',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + jwt,
                   'Content-Type': 'application/json' },
        body: JSON.stringify({ p_annee: state.annee, p_mois: state.mois,
                               p_id_site: siteSelection(), p_sites: sitesSelection() })
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      const j = await res.json();
      CACHE_SOURCES = { cle: cle, j: j };
      return j;
    }

    function rendreSources(j) {
      const l = ((j || {}).sources || []);
      if (!l.length) return '<p class="ctx">Aucun lead sur ce périmètre.</p>';
      return tableau(['Source', 'Leads', 'Délai médian', 'Jamais appelés', 'Perdus'],
        l.map(s2 => [
          { h: '<b>' + esc(s2.source) + '</b>' },
          { h: '<span class="f">' + fmt(s2.total) + '</span>' },
          { h: s2.delai_median_h == null ? '<span class="pale">—</span>'
             : '<span class="f"' + (num(s2.delai_median_h) > 24 ? ' style="color:var(--m-rouge)"' : '')
               + '>' + String(s2.delai_median_h).replace('.', ',') + ' h</span>' },
          { h: '<span class="f">' + fmt(s2.jamais) + '</span>' },
          { h: '<span class="f"' + (num(s2.tx_perdu) >= 70 ? ' style="color:var(--m-rouge)"' : '')
               + '>' + (s2.tx_perdu == null ? '—' : s2.tx_perdu + ' %') + '</span>' }
        ]));
    }

    // =========================================================================
    //  LES CONSTATS PAR RÔLE
    //
    //  La trouvaille est calculée, jamais écrite d'avance. Mais elle se calcule
    //  sur des données qui arrivent après le dépli (l'arbre, l'équipe) : elle
    //  est donc réécrite quand elles arrivent, à la place du texte commun.
    //
    //  Ce qu'elle cherche n'est pas le même selon le rôle : la direction veut
    //  savoir QUELLE ENTITÉ décroche et de combien, le chef QUI décroche.
    // =========================================================================
    function ecartRelatif(agg, indCle) {
      // Position d'une entité par rapport au reste, en points ou en pourcentage
      // selon la nature de l'indicateur.
      if (indCle === 'cdes') return num(agg.obj_cdes) > 0 ? pct(agg.cdes, agg.obj_cdes) : null;
      if (indCle === 'fi')   return pct(agg.fi, agg.hors_loueurs);
      if (indCle === 'loa')  return pct(agg.loa, agg.cdes);
      if (indCle === 'roole') return pct(agg.roole, agg.cdes);
      if (indCle === 'reprise') return pct(agg.reprise, agg.cdes);
      if (indCle === 'acc')  return num(agg.cdes) > 0 ? Math.round(num(agg.acc_total) / num(agg.cdes)) : null;
      // Pour le stock, ce qui se compare n'est pas un taux mais une part de
      // véhicules trop vieux : c'est elle qui dit où l'argent dort.
      if (indCle === 'stock_vn') return pct(agg.vn_90, agg.vn);
      if (indCle === 'stock_vo') return pct(agg.vo_90, agg.vo);
      return null;
    }

    function trouvailleArbre(j, indCle) {
      const marques = construireArbre((j || {}).sites || []);
      const aff = [];
      marques.forEach(m => m.aff.forEach(a => { if (num(a.agg.cdes) > 0) aff.push({ lab: a.lab, agg: a.agg, m: m.lab }); }));
      if (aff.length < 2) {
        return '<b>Un seul périmètre produit ce mois-ci.</b> La comparaison entre affaires n’a pas '
          + 'encore de sens : ' + fmt(aff.length) + ' affaire sur ' + fmt(marques.reduce((n, m) => n + m.aff.length, 0))
          + ' a enregistré des commandes. C’est le propre d’un déploiement en cours — l’arborescence '
          + 'ci-contre montre déjà tout le groupe, elle se remplira au fur et à mesure des raccordements.';
      }
      const val = aff.map(a => ({ a: a, v: ecartRelatif(a.agg, indCle) })).filter(x => x.v != null);
      if (val.length < 2) {
        const tot = somme((j.sites || []));
        return '<b>' + fmt(tot.cdes) + ' commandes sur l’ensemble du groupe</b>, réparties sur '
          + fmt(aff.length) + ' affaires. Le détail par entité est dans l’arborescence.';
      }
      val.sort((x, y) => y.v - x.v);
      const haut = val[0], bas = val[val.length - 1];
      const unite = indCle === 'acc' ? ' €' : ' %';
      const ecart = Math.round(haut.v - bas.v);
      return '<b>' + esc(haut.a.lab) + ' est à ' + haut.v + unite + ', ' + esc(bas.a.lab)
        + ' à ' + bas.v + unite + '.</b> ' + ecart + (indCle === 'acc' ? ' € ' : ' points ')
        + 'séparent la meilleure affaire de la dernière, sur le même produit et le même mois. '
        + 'Un écart de cette taille ne vient pas du marché local : il vient de ce qui se fait, ou '
        + 'ne se fait pas, au moment de la vente. L’arborescence dit à quel site il se loge.';
    }

    function trouvailleEquipe(j, indCle) {
      const d = VEND[indCle] || VEND.cdes;
      const l = ((j || {}).vendeurs || []).filter(v =>
        num(v.cdes) + num(v.affaires) + num(v.livr) + num(v.leads_jamais) + num(v.rapports) > 0);
      if (!l.length) return 'Aucune activité sur votre équipe ce mois-ci.';
      const mauvais = d.mauvais ? l.filter(d.mauvais) : [];
      if (mauvais.length) {
        const m = mauvais.slice().sort(d.tri)[0];
        const autres = mauvais.length - 1;
        return '<b>' + esc(m.nom) + ' : ' + d.v(m) + (d.r ? ' — ' + d.r(m) : '') + '.</b> '
          + (autres > 0
             ? autres + ' autre' + (autres > 1 ? 's sont' : ' est') + ' dans le même cas. '
             : '')
          + 'Le classement ci-contre est trié du plus en retard au moins : la première ligne est '
          + 'l’entretien à mener cette semaine, pas la moyenne de l’équipe.';
      }
      const tete = l.slice().sort(d.tri)[0];
      return '<b>Personne ne décroche sur cet indicateur.</b> ' + esc(tete.nom) + ' ouvre le '
        + 'classement à ' + d.v(tete) + '. Quand l’équipe se tient, l’écart utile n’est plus entre '
        + 'ses membres mais avec les autres sites — le tableau de bord de la direction le montre.';
    }

    // Le marketing ne cherche pas un coupable mais une corrélation : les sources
    // traitées vite se perdent moins. Si elle est là, on la montre.
    function trouvailleSources(j) {
      const l = ((j || {}).sources || []).filter(s2 => num(s2.total) >= 20 && s2.delai_median_h != null);
      if (l.length < 2) return 'Pas encore assez de sources mesurées pour comparer les délais.';
      const vite = l.slice().sort((a, b) => num(a.delai_median_h) - num(b.delai_median_h))[0];
      const lent = l.slice().sort((a, b) => num(b.delai_median_h) - num(a.delai_median_h))[0];
      if (vite.source === lent.source) return 'Une seule source exploitable pour l’instant.';
      const gagne = num(lent.tx_perdu) - num(vite.tx_perdu);
      return '<b>' + esc(vite.source) + ' est rappelée en '
        + String(vite.delai_median_h).replace('.', ',') + ' h et perd ' + num(vite.tx_perdu)
        + ' % de ses leads ; ' + esc(lent.source) + ' attend '
        + String(lent.delai_median_h).replace('.', ',') + ' h et en perd ' + num(lent.tx_perdu)
        + ' %.</b> '
        + (gagne > 5
           ? gagne + ' points de perte séparent les deux, et ce qui les sépare n’est pas la qualité '
             + 'du lead — c’est le délai de rappel. Une source n’est jamais mauvaise en soi : elle '
             + 'est mal servie.'
           : 'Le délai ne suffit pas ici à expliquer l’écart de perte : le motif de fin n’est '
             + 'presque jamais renseigné, et sans lui aucune source ne peut être jugée sur sa '
             + 'rentabilité.');
    }

    function jourCourt(d) {
      if (!d) return '—';
      const x = new Date(d);
      if (isNaN(x)) return esc(String(d));
      return x.getDate() + ' ' + MOIS_COURT[x.getMonth()];
    }

    const FAMILLES = [
      { k: 'prod', t: 'Production commerciale', etat: 'plein', n: 'commandes gagnées BACS' },
      { k: 'stock', t: 'Stock', etat: 'plein', n: 'véhicules disponibles, DMS' },
      { k: 'pipe', t: 'Pipe et relances', etat: 'plein', n: 'affaires et devis BACS' },
      { k: 'livr', t: 'Livraisons', etat: 'plein', n: 'statut BACS des commandes' },
      { k: 'act', t: 'Activité commerciale', etat: 'vide', n: 'saisie One Data, en attente du déploiement' },
      { k: 'leads', t: 'Leads', etat: 'partiel', n: 'reçus et attribués tracés, issue rarement renseignée' },
      { k: 'base', t: 'Base client', etat: 'partiel', n: 'qualité des coordonnées, encadrement' }
    ];

    function tuiles() {
      // Le stock et l'entonnoir sont gardés bruts, ventilés par site, et
      // ré-agrégés ici au périmètre courant : changer de périmètre ne les
      // recharge pas, il les recompte.
      const idsP = sitesSelection();
      state.stock = state.stockBrut ? agregerStock(state.stockBrut, idsP) : null;
      state.entonnoir = state.entonnoirBrut ? agregerEntonnoir(state.entonnoirBrut, idsP) : null;
      const d = state.d, p = d.prod || {}, o = d.obj || {}, pi = d.pipe || {}, lv = d.livr || {},
            ac = d.act || {}, ld = d.leads || {}, ba = d.base, det = d.detail || {}, s = d.seuils || {};
      const lm = libellesMois();
      const T = [];

      // ---------------------------------------------------------------- PROD
      const objCde = num(o.cdes);
      T.push({
        fam: 'prod', id: 'cdes', lab: 'Commandes', v: fmt(p.cdes),
        c: objCde > 0 ? (pct(p.cdes, objCde) + ' % de l’objectif (' + objCde + ')') : 'sans objectif saisi',
        sens: objCde > 0 && num(p.cdes) >= objCde ? 'hausse' : objCde > 0 ? 'baisse' : 'plat',
        vals: serie('cdes'), forme: 'barres', lm: lm,
        vues: {
          vendeur: {
            titre: 'Votre mois, jour après jour',
            ctx: 'Vos commandes gagnées du mois. Le graphe porte vos douze derniers mois.',
            liste: 'cdes_mois', cols: colsCommandes,
            trouve: () => {
              const reste = objCde > 0 ? objCde - num(p.cdes) : null;
              const s = serie('cdes').slice(0, -1).filter(v => v > 0);
              const moy = s.length ? s.reduce((a, b) => a + b, 0) / s.length : 0;
              let h = '';
              if (reste != null && reste > 0) {
                h += '<b>Il vous reste ' + fmt(reste) + ' commande' + (reste > 1 ? 's' : '')
                  + ' pour tenir votre objectif.</b> ';
              } else if (reste != null) {
                h += '<b>Objectif atteint, et dépassé de ' + fmt(Math.abs(reste)) + '.</b> ';
              }
              if (moy > 0) {
                const e = Math.round((num(p.cdes) - moy) / moy * 100);
                h += (h ? '' : '<b>') + 'Votre moyenne des onze mois précédents est de '
                  + moy.toFixed(1).replace('.', ',') + ' commandes par mois'
                  + (h ? '' : '.</b>') + ' : ce mois-ci vous êtes '
                  + (e >= 0 ? (e === 0 ? 'au même niveau' : e + ' % au-dessus') : Math.abs(e) + ' % en dessous')
                  + '.';
              }
              return h || 'Pas encore assez de commandes ce mois-ci pour dégager une tendance.';
            },
            table: () => ''
          }
        },
        titre: 'Commandes du mois',
        ctx: 'Commandes gagnées, grands comptes exclus, rattachées à leur mois de création dans BACS.',
        // La répartition par jour de la semaine a été retirée : elle décrivait une
        // saisonnalité hebdomadaire sur laquelle personne n'agit depuis cette page,
        // et elle occupait la moitié du tiroir. Ce qui se lit ici désormais, c'est
        // le mois courant rapporté aux onze précédents.
        trouve: () => {
          const s = serie('cdes').slice(0, -1).filter(v => v > 0);
          if (!s.length) return 'Pas encore assez d\u2019historique pour situer ce mois.';
          const moy = s.reduce((a, b) => a + b, 0) / s.length;
          const haut = Math.max.apply(null, s), bas = Math.min.apply(null, s);
          const e = moy > 0 ? Math.round((num(p.cdes) - moy) / moy * 100) : 0;
          return '<b>' + fmt(p.cdes) + ' commandes ce mois-ci, pour une moyenne de '
            + moy.toFixed(1).replace('.', ',') + ' sur les onze mois précédents</b> \u2014 '
            + (e >= 0 ? (e === 0 ? 'exactement au niveau habituel' : e + ' % au-dessus')
                      : Math.abs(e) + ' % en dessous') + '. Sur la période, le meilleur mois a '
            + 'porté ' + fmt(haut) + ' commandes et le plus faible ' + fmt(bas)
            + ' : c\u2019est l\u2019amplitude dans laquelle ce chiffre se lit.';
        },
        table: () => ''
      });

      const txFi = pct(p.fi, p.hors_loueurs);
      T.push({
        fam: 'prod', id: 'fi', lab: 'Financement', v: txFi == null ? '—' : txFi, unite: '%',
        c: ecartAn('fi', 'pts').txt || 'hors loueurs', sens: ecartAn('fi', 'pts').sens,
        vals: serie('fi'), forme: 'ligne', lm: lm, gUnite: '%',
        // Le classement des vendeurs n'a aucun sens pour un vendeur : il y
        // figure seul. Ce qui l'intéresse, ce sont SES commandes sans
        // financement — celles où il reste quelque chose à rattraper.
        vues: {
          vendeur: {
            titre: 'Vos commandes sans financement',
            ctx: 'Vos commandes du mois qui sont parties sans financement, loueurs longue durée '
               + 'exclus — eux n’en ont jamais.',
            liste: 'sans_fi', cols: colsCommandes,
            table: () => '',
            trouve: () => {
              const sans = num(p.hors_loueurs) - num(p.fi);
              const e = ecartAn('fi', 'pts');
              return '<b>' + fmt(sans) + ' de vos ' + fmt(p.hors_loueurs) + ' commandes finançables '
                + 'du mois n’ont pas de financement.</b> Deux explications possibles, et elles '
                + 'n’appellent pas le même geste : soit le financement n’a pas été proposé, soit il '
                + 'l’a été mais n’a jamais été saisi dans BACS. Dans le second cas la commission '
                + 'existe et ne vous est pas comptée.'
                + (e.sens === 'baisse' ? ' Sur douze mois votre taux a reculé de ' + e.txt.replace(' sur un an', '') + '.' : '');
            }
          }
        },
        titre: 'Taux de financement',
        ctx: 'Part des commandes financées, loueurs longue durée exclus du calcul.',
        trouve: () => {
          const fi = (det.fi || []);
          const bas = fi.filter(v => num(v.n_t3) >= 15 && num(v.fi_t3) <= 5);
          const chute = fi.filter(v => v.fi_t2 != null && v.fi_t3 != null && num(v.fi_t3) - num(v.fi_t2) <= -25);
          let h = '';
          if (bas.length) {
            const v = bas[0];
            h += '<b>' + esc(v.nom) + ' n’a financé que ' + Math.round(num(v.fi_t3) * num(v.n_t3) / 100)
              + ' de ses ' + fmt(v.n_t3) + ' commandes du trimestre.</b> Deux issues seulement : soit le '
              + 'financement ne se vend pas, soit il ne se saisit pas dans BACS. Dans les deux cas c’est '
              + 'un appel à passer. ';
          }
          if (chute.length) {
            h += (h ? 'Et ' : '<b>') + chute.length + ' vendeur' + (chute.length > 1 ? 's ont' : ' a')
              + ' perdu plus de vingt-cinq points entre le trimestre précédent et celui-ci'
              + (h ? '.' : '.</b>');
          }
          return h || 'Aucun décrochage marqué ce trimestre : les écarts entre vendeurs restent sous vingt-cinq points.';
        },
        table: () => {
          const fi = (det.fi || []).filter(v => v.fi_t2 != null || v.fi_t3 != null);
          if (!fi.length) return '';
          return tableau(['Vendeur', 'Trim. préc.', 'Ce trim.', 'Écart'], fi.map(v => {
            const e = (v.fi_t2 == null || v.fi_t3 == null) ? null : Math.round(num(v.fi_t3) - num(v.fi_t2));
            return [
              v.nom,
              v.fi_t2 == null ? '—' : v.fi_t2 + ' %',
              v.fi_t3 == null ? '—' : v.fi_t3 + ' %',
              { h: e == null ? '—' : (e > 0 ? '+' : '') + e + ' pts',
                cls: 'f ' + (e <= -10 ? 'baisse' : e >= 10 ? 'hausse' : 'plat') }
            ];
          }));
        }
      });

      const txLoa = pct(p.loa, p.cdes);
      T.push({
        fam: 'prod', id: 'loa', lab: 'LOA / Easy', v: txLoa == null ? '—' : txLoa, unite: '%',
        c: ecartAn('loa', 'pts').txt || 'des commandes', sens: ecartAn('loa', 'pts').sens,
        vals: serie('loa'), forme: 'ligne', lm: lm, gUnite: '%', second: serie('fi'),
        titre: 'LOA et Toyota Easy',
        ctx: 'Part des commandes en location avec option d’achat, financement superposé.',
        trouve: () => {
          const a = serie('loa'), b = serie('fi');
          const ec = a.map((v, i) => Math.abs(num(b[i]) - v)).filter(v => isFinite(v));
          const mx = ec.length ? Math.max.apply(null, ec) : null;
          if (mx == null) return 'Série incomplète.';
          return '<b>Le financement de la maison, c’est la LOA.</b> Sur douze mois, l’écart entre '
            + 'le taux de financement et le taux de LOA ne dépasse jamais ' + Math.round(mx) + ' points. '
            + 'Il n’existe pas de levier « financement » séparé à actionner — relancer le financement, '
            + 'ici, veut dire relancer la LOA.';
        },
        table: () => ''
      });

      const accCde = num(p.cdes) > 0 ? Math.round(num(p.acc) / num(p.cdes)) : 0;
      T.push({
        fam: 'prod', id: 'acc', lab: 'Accessoires', v: fmt(accCde), unite: '€',
        c: ecartAn('acc').txt || 'par commande', sens: ecartAn('acc').sens,
        vals: serie('acc'), forme: 'ligne', lm: lm, gUnite: '',
        vues: {
          vendeur: {
            titre: 'Vos commandes sans aucun accessoire',
            ctx: 'Vos commandes du mois dont le bon ne porte pas une ligne d’accessoire.',
            liste: 'sans_acc', cols: colsCommandes,
            trouve: () => {
              const s = serie('acc');
              const ref = s.length > 1 && s[0] ? Math.round(s[0]) : null;
              return '<b>Chaque commande sans accessoire est une marge qui ne revient pas.</b> '
                + 'Vous êtes à ' + fmt(accCde) + ' € par commande ce mois-ci'
                + (ref ? ', contre ' + fmt(ref) + ' € il y a un an' : '') + '. L’accessoire se vend '
                + 'à la signature ou ne se vend pas : passé la livraison, le client ne revient pas '
                + 'pour ça. Les commandes de la liste sont celles où rien n’a été posé.';
            }
          }
        },
        titre: 'Accessoires par commande',
        ctx: 'Montant HT des accessoires du bon de commande, divisé par le nombre de commandes.',
        trouve: () => {
          const s = serie('acc'); if (s.length < 2 || !s[0]) return 'Série incomplète.';
          const e = Math.round((s[s.length - 1] - s[0]) / s[0] * 100);
          const ch = (det.fi || []).filter(v => v.acc_t2 && v.acc_t3)
            .map(v => ({ n: v.nom, e: Math.round((num(v.acc_t3) - num(v.acc_t2)) / num(v.acc_t2) * 100) }))
            .sort((a, b) => a.e - b.e);
          return '<b>' + fmt(s[0]) + ' € il y a un an, ' + fmt(s[s.length - 1]) + ' € aujourd’hui'
            + (e < 0 ? ', soit ' + Math.abs(e) + ' % de moins' : '') + '.</b> Le total mensuel bouge peu '
            + 'parce que le volume compense : c’est le panier qui se déplace, et le total le masque.'
            + (ch.length && ch[0].e < 0
                ? ' Le plus fort recul est celui de ' + esc(ch[0].n) + ', de ' + Math.abs(ch[0].e)
                  + '\u202f% entre les deux trimestres.' : '');
        },
        table: () => {
          const a = (det.fi || []).filter(v => v.acc_t2 != null || v.acc_t3 != null);
          if (!a.length) return '';
          return tableau(['Vendeur', 'Trim. préc.', 'Ce trim.', 'Écart'], a.map(v => {
            const e = (!v.acc_t2 || v.acc_t3 == null) ? null
              : Math.round((num(v.acc_t3) - num(v.acc_t2)) / num(v.acc_t2) * 100);
            return [v.nom, v.acc_t2 == null ? '—' : fmt(v.acc_t2) + ' €',
                    v.acc_t3 == null ? '—' : fmt(v.acc_t3) + ' €',
                    { h: e == null ? '—' : (e > 0 ? '+' : '') + e + ' %',
                      cls: 'f ' + (e <= -10 ? 'baisse' : e >= 10 ? 'hausse' : 'plat') }];
          }));
        }
      });

      const txRoole = pct(p.roole, p.cdes);
      T.push({
        fam: 'prod', id: 'roole', lab: 'Roole', v: txRoole == null ? '—' : txRoole, unite: '%',
        c: ecartAn('roole', 'pts').txt || 'des commandes', sens: ecartAn('roole', 'pts').sens,
        vals: serie('roole'), forme: 'ligne', lm: lm, gUnite: '%',
        titre: 'Produit fidélité Roole',
        ctx: 'Part des commandes portant un pack Roole, un gravage ou une carte fidélité.',
        trouve: () => {
          const s = serie('roole'); if (s.length < 2) return 'Série incomplète.';
          const mn = Math.min.apply(null, s), i = s.indexOf(mn);
          return '<b>' + s[0] + ' % il y a un an, ' + s[s.length - 1] + ' % aujourd’hui.</b> '
            + 'La bascule du gravage vers le pack Roole, courant 2025, s’est faite avec une perte qui '
            + 'n’a pas été rattrapée. Le creux est en ' + (lm[i] || '?') + ', à ' + mn + ' %.';
        },
        table: () => ''
      });

      const txRep = pct(p.reprise, p.cdes);
      T.push({
        fam: 'prod', id: 'reprise', lab: 'Reprises', v: txRep == null ? '—' : txRep, unite: '%',
        c: ecartAn('reprise', 'pts').txt || 'des commandes', sens: ecartAn('reprise', 'pts').sens,
        vals: serie('reprise'), forme: 'ligne', lm: lm, gUnite: '%', second: serie('fi'),
        titre: 'Commandes avec reprise',
        ctx: 'Part des commandes portant le numéro de série d’un véhicule repris.',
        trouve: () => '<b>La reprise suit le financement.</b> Les deux séries montent et descendent '
          + 'ensemble : les mois à forte reprise sont les mois à fort financement. Ce sont les mêmes '
          + 'ventes — celles où le vendeur a pris le temps de monter un dossier complet.',
        table: () => ''
      });

      const objPhev = num(o.phev);
      T.push({
        fam: 'prod', id: 'phev', lab: 'PHEV / EV', v: fmt(p.phev),
        c: objPhev > 0 ? 'objectif ' + objPhev : 'sans objectif saisi',
        sens: objPhev > 0 && num(p.phev) >= objPhev ? 'hausse' : 'plat',
        vals: serie('phev'), forme: 'barres', lm: lm,
        titre: 'Hybrides rechargeables et électriques',
        ctx: 'Commandes de véhicules rechargeables ou 100 % électriques.',
        trouve: () => {
          const s = serie('phev'); const mx = Math.max.apply(null, s);
          const der = s[s.length - 1];
          return der >= mx
            ? '<b>Meilleur mois des douze derniers.</b> ' + der + ' commandes, contre '
              + Math.min.apply(null, s) + ' au plus bas. C’est le seul produit additionnel qui '
              + 'progresse pendant que les autres reculent'
              + (objPhev > 0 && der > objPhev * 1.5 ? ', et l’objectif de ' + objPhev
                 + ' n’a plus grand sens.' : '.')
            : 'Le mois se situe à ' + der + ' commandes, pour un maximum de ' + mx + ' sur les douze mois.';
        },
        table: () => ''
      });

      const objVu = num(o.vu);
      T.push({
        fam: 'prod', id: 'vu', lab: 'Véhicules utilitaires', v: fmt(p.vu),
        c: objVu > 0 ? 'objectif ' + objVu : 'sans objectif saisi',
        sens: objVu > 0 && num(p.vu) >= objVu ? 'hausse' : 'plat',
        vals: serie('vu'), forme: 'barres', lm: lm,
        titre: 'Véhicules utilitaires',
        ctx: 'Commandes de VU : Hilux, Proace et fourgons.',
        trouve: () => {
          const s = serie('vu'); const moitie = Math.floor(s.length / 2);
          const av = s.slice(0, moitie).reduce((a, b) => a + b, 0) / (moitie || 1);
          const ap = s.slice(moitie).reduce((a, b) => a + b, 0) / ((s.length - moitie) || 1);
          return ap > av * 1.3
            ? '<b>Le VU a changé de palier.</b> ' + av.toFixed(1).replace('.', ',') + ' par mois sur le '
              + 'premier semestre glissant, ' + ap.toFixed(1).replace('.', ',') + ' sur le second'
              + (objVu > 0 ? ', sans que l’objectif, resté à ' + objVu + ', en tienne compte.' : '.')
            : 'Le rythme reste stable autour de ' + ap.toFixed(1).replace('.', ',') + ' commandes par mois.';
        },
        table: () => ''
      });

      // --------------------------------------------------------------- STOCK
      // Le stock est une photo, pas une série : pas de graphe, pas d'écart sur
      // douze mois. Ce qui compte est sa VALEUR et son ÂGE — un véhicule de
      // plus de trois mois a déjà mangé sa marge en frais financiers.
      const stk = state.stock || {};
      const sVn = stk.vn || {}, sVo = stk.vo || {};

      T.push({
        fam: 'stock', id: 'stock_vn', lab: 'Stock VN', v: fmt(sVn.n), statique: true,
        obj: fmtEur(sVn.valeur) + ' en parc',
        c: num(sVn.plus_90j) > 0 ? fmt(sVn.plus_90j) + ' au-delà de 90 jours' : 'aucun véhicule âgé',
        sens: num(sVn.plus_90j) > num(sVn.n) * .25 ? 'baisse' : 'plat',
        titre: 'Véhicules neufs disponibles',
        ctx: 'Stock physique disponible à la vente. Les commandes usine non livrées en sont exclues : '
           + 'elles ne sont pas immobilisées.',
        trouve: () => {
          if (!num(sVn.n)) return 'Aucun véhicule neuf disponible sur ce périmètre.';
          const part = pct(sVn.plus_90j, sVn.n);
          return '<b>' + fmtEur(sVn.valeur_dormante) + ' dorment depuis plus de trois mois.</b> '
            + fmt(sVn.plus_90j) + ' des ' + fmt(sVn.n) + ' véhicules disponibles ont dépassé '
            + '90 jours de parc' + (part != null ? ', soit ' + part + ' %' : '') + ', et '
            + fmt(sVn.plus_180j) + ' ont dépassé six mois. À cette ancienneté, les frais '
            + 'financiers ont déjà consommé la marge : ce ne sont plus des véhicules à vendre, '
            + 'ce sont des véhicules à sortir.'
            + (num(sVn.reserve) > 0 ? ' S\u2019y ajoutent ' + fmt(sVn.reserve)
               + ' véhicules réservés, qui ne sont pas encore livrés mais déjà engagés.' : '');
        },
        table: () => tableau(['Âge en parc', 'Véhicules', 'Part'], [
          ['Moins de 90 jours', { h: '<span class="f">' + fmt(num(sVn.n) - num(sVn.plus_90j)) + '</span>' },
            pct(num(sVn.n) - num(sVn.plus_90j), sVn.n) + ' %'],
          ['90 à 180 jours', { h: '<span class="f">' + fmt(num(sVn.plus_90j) - num(sVn.plus_180j)) + '</span>' },
            pct(num(sVn.plus_90j) - num(sVn.plus_180j), sVn.n) + ' %'],
          [{ h: '<b>Plus de 180 jours</b>' },
            { h: '<span class="f mauvais">' + fmt(sVn.plus_180j) + '</span>' },
            pct(sVn.plus_180j, sVn.n) + ' %']
        ])
      });

      T.push({
        fam: 'stock', id: 'stock_vo', lab: 'Stock VO', v: fmt(sVo.n), statique: true,
        obj: fmtEur(sVo.valeur) + ' en parc',
        c: num(sVo.age_moyen) > 0 ? fmt(sVo.age_moyen) + ' jours de parc en moyenne' : '—',
        sens: num(sVo.age_moyen) > 90 ? 'baisse' : 'plat',
        titre: 'Véhicules d\u2019occasion en parc',
        ctx: 'Stock VO à la vente, valorisé au prix de vente affiché.',
        trouve: () => {
          if (!num(sVo.n)) return 'Aucun véhicule d\u2019occasion sur ce périmètre.';
          const part = pct(sVo.plus_90j, sVo.n);
          return '<b>Un VO sur ' + (num(sVo.plus_90j) > 0
                   ? Math.max(Math.round(num(sVo.n) / num(sVo.plus_90j)), 2) : '—')
            + ' a plus de trois mois de parc.</b> ' + fmt(sVo.plus_90j) + ' véhicules sur '
            + fmt(sVo.n) + (part != null ? ' (' + part + ' %)' : '') + ', pour '
            + fmtEur(sVo.valeur_dormante) + ' immobilisés. En VO la décote court avec le temps : '
            + 'ce qui ne part pas en trois mois part moins cher, ou pas du tout. '
            + fmt(sVo.plus_180j) + ' dépassent même six mois.';
        },
        table: () => tableau(['Âge en parc', 'Véhicules', 'Part'], [
          ['Moins de 90 jours', { h: '<span class="f">' + fmt(num(sVo.n) - num(sVo.plus_90j)) + '</span>' },
            pct(num(sVo.n) - num(sVo.plus_90j), sVo.n) + ' %'],
          ['90 à 180 jours', { h: '<span class="f">' + fmt(num(sVo.plus_90j) - num(sVo.plus_180j)) + '</span>' },
            pct(num(sVo.plus_90j) - num(sVo.plus_180j), sVo.n) + ' %'],
          [{ h: '<b>Plus de 180 jours</b>' },
            { h: '<span class="f mauvais">' + fmt(sVo.plus_180j) + '</span>' },
            pct(sVo.plus_180j, sVo.n) + ' %']
        ])
      });

      // ---------------------------------------------------------------- PIPE
      T.push({
        fam: 'pipe', id: 'affaires', lab: 'Affaires ouvertes', v: fmt(pi.affaires), statique: true,
        obj: 'sans commande, moins de 90 jours',
        c: fmt(pi.froides) + ' au-delà de ' + num(s.p95) + ' jours', sens: 'baisse',
        vues: {
          vendeur: {
            titre: 'Celles que vous allez perdre',
            ctx: 'Vos affaires ouvertes au-delà de ' + num(s.p95) + ' jours. Statistiquement, '
               + 'elles ne se concluent plus : soit elles se rouvrent autrement, soit elles se ferment.',
            liste: 'froides', cols: colsAffaires,
            table: () => tableau(['Âge', 'Vos affaires', 'Ce que ça veut dire'], [
              [{ h: '<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:var(--m-vert);margin-right:7px"></span>Dans la fenêtre' },
               { h: '<span class="f">' + fmt(pi.fraiches) + '</span>' }, 'tout est normal'],
              [{ h: '<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:var(--m-orange);margin-right:7px"></span>À relancer' },
               { h: '<span class="f">' + fmt(pi.a_relancer) + '</span>' }, 'un appel les récupère'],
              [{ h: '<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:var(--m-bleu);margin-right:7px"></span>Froides' },
               { h: '<span class="f">' + fmt(pi.froides) + '</span>' }, 'à rouvrir ou à fermer']
            ]),
            trouve: () => {
              const part = pct(pi.froides, pi.affaires);
              return '<b>' + fmt(pi.froides) + ' de vos ' + fmt(pi.affaires) + ' affaires ouvertes '
                + 'sont froides</b>, soit ' + (part == null ? '—' : part) + ' %. Elles pèsent dans '
                + 'votre portefeuille sans rien y apporter : tant qu’elles y restent, impossible de '
                + 'savoir combien vous avez vraiment de dossiers vivants. Les fermer ne fait rien '
                + 'perdre — le client reste dans la base, et vous retrouvez un portefeuille lisible.';
            }
          }
        },
        titre: 'Affaires ouvertes sans commande',
        ctx: 'Affaires BACS ouvertes depuis moins de 90 jours et encore sans commande. Photo à l’instant, pas un cumul.',
        trouve: () => '<b>Une vente se joue en ' + num(s.p85) + ' jours.</b> Sur les affaires de '
          + 'l’année qui ont abouti, 85 % se sont conclues en ' + num(s.p85) + ' jours et 95 % '
          + 'en ' + num(s.p95) + '. Ces deux seuils ne sont pas choisis, ils se recalculent chaque nuit sur '
          + 'le comportement réel du réseau. Appliqués au stock d’aujourd’hui : ' + fmt(pi.fraiches)
          + ' affaires sont dans la fenêtre, <b>' + fmt(pi.a_relancer) + ' encore rattrapables</b>, et '
          + fmt(pi.froides) + ' ne reviendront pas.',
        table: () => tableau(['Âge', 'Affaires', 'Fenêtre'], [
          [{ h: '<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:var(--m-vert);margin-right:7px"></span>Dans la fenêtre' },
           { h: '<span class="f">' + fmt(pi.fraiches) + '</span>' }, num(s.p85) + ' jours ou moins'],
          [{ h: '<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:var(--m-orange);margin-right:7px"></span>À relancer' },
           { h: '<span class="f">' + fmt(pi.a_relancer) + '</span>' }, (num(s.p85) + 1) + ' à ' + num(s.p95) + ' jours'],
          [{ h: '<span style="display:inline-block;width:9px;height:9px;border-radius:50%;background:var(--m-bleu);margin-right:7px"></span>Froides' },
           { h: '<span class="f">' + fmt(pi.froides) + '</span>' }, 'au-delà de ' + num(s.p95) + ' jours']
        ])
      });

      T.push({
        fam: 'pipe', id: 'relance', lab: 'À relancer', v: fmt(pi.a_relancer), statique: true,
        obj: 'affaires de ' + (num(s.p85) + 1) + ' à ' + num(s.p95) + ' jours',
        c: fmt(pi.fraiches) + ' encore dans la fenêtre', sens: 'plat',
        // Le vendeur reçoit la liste de ses appels du jour ; son chef, le
        // comparatif de son équipe. Même chiffre, deux métiers.
        vues: {
          vendeur: {
            titre: 'Vos appels du jour',
            ctx: 'Vos affaires ouvertes entre ' + (num(s.p85) + 1) + ' et ' + num(s.p95)
               + ' jours — la fenêtre où une relance change encore l’issue. La plus ancienne en premier.',
            liste: 'relance', cols: colsAffaires,
            table: () => '',
            trouve: () => '<b>Passé ' + num(s.p95) + ' jours, une affaire ne se conclut plus.</b> '
              + 'Ce seuil n’est pas une convention : il se recalcule chaque nuit sur les affaires '
              + 'de l’année qui ont abouti — 95 % se sont jouées avant. Vous avez <b>'
              + fmt(pi.a_relancer) + ' affaires</b> encore dans cette fenêtre et ' + fmt(pi.froides)
              + ' qui l’ont dépassée. Les premières valent un appel aujourd’hui ; les secondes, '
              + 'une décision — relancer autrement, ou fermer.'
          }
        },
        titre: 'Le portefeuille de chacun',
        ctx: 'Les affaires ouvertes de chaque vendeur, rangées par âge. Trié sur la colonne à relancer.',
        trouve: () => {
          const v = (det.vendeurs || []);
          if (!v.length) return 'Aucune affaire ouverte sur le périmètre.';
          const t = v[0];
          const sansDevis = v.filter(x => num(x.froides) > num(x.total) * .6);
          return '<b>' + esc(t.nom) + ' porte ' + fmt(t.a_relancer) + ' affaires dans la fenêtre de '
            + 'relance</b>, la plus ancienne remonte à ' + fmt(t.plus_vieille) + ' jours.'
            + (sansDevis.length ? ' ' + sansDevis.length + ' vendeur' + (sansDevis.length > 1 ? 's laissent' : ' laisse')
                + ' plus de six affaires sur dix passer en froid sans les relancer.' : '');
        },
        table: () => {
          const v = (det.vendeurs || []);
          if (!v.length) return '';
          const mx = Math.max.apply(null, v.map(x => num(x.total))) || 1;
          return tableau(['Vendeur', 'Affaires', 'Répartition par âge', 'À relancer', 'La plus ancienne'],
            v.map(x => {
              const t = num(x.total) || 1;
              return [
                // Une chaîne nue serait échappée par tableau() : le balisage du
                // site s'affichait en clair dans la cellule. Elle passe donc en
                // { h: … }, avec le nom échappé à la main.
                { h: esc(x.nom) + (x.site
                    ? ' <span style="font-size:10.5px;color:var(--ink-3);font-weight:600">'
                      + esc(x.site) + '</span>' : '') },
                { h: '<span class="f">' + fmt(x.total) + '</span>' },
                { h: '<span style="display:inline-flex;height:9px;border-radius:5px;overflow:hidden;gap:2px;'
                     + 'vertical-align:middle;width:' + Math.max(num(x.total) / mx * 100, 4).toFixed(1) + '%">'
                     + '<i style="display:block;height:100%;width:' + (num(x.fraiches) / t * 100) + '%;background:var(--m-vert)"></i>'
                     + '<i style="display:block;height:100%;width:' + (num(x.a_relancer) / t * 100) + '%;background:var(--m-orange)"></i>'
                     + '<i style="display:block;height:100%;width:' + (num(x.froides) / t * 100) + '%;background:var(--m-bleu)"></i>'
                     + '</span>' },
                { h: '<span class="f" style="color:var(--m-orange)">' + fmt(x.a_relancer) + '</span>' },
                { h: '<span class="f" style="color:var(--ink-3)">' + fmt(x.plus_vieille) + ' j</span>' }
              ];
            }));
        }
      });

      T.push({
        fam: 'pipe', id: 'pipeval', lab: 'Pipe valorisé', v: fmtEur(pi.montant).replace(FINE + 'M€', ''),
        unite: 'M€', statique: true, obj: fmt(pi.dossiers) + ' dossiers ouverts',
        c: num(pi.dossiers) > 0 ? fmtEur(num(pi.montant) / num(pi.dossiers)) + ' par dossier' : '—', sens: 'plat',
        titre: 'Pipe commercial',
        ctx: 'Commandes à l’état propale ou bon de commande, non encore gagnées.',
        trouve: () => {
          const vieux = num(pi.dossiers) - num(pi.recents);
          return '<b>' + fmt(vieux) + ' des ' + fmt(pi.dossiers) + ' dossiers n’ont pas bougé depuis '
            + 'plus de trente jours.</b> Le pipe affiché n’est pas un pipe : c’est un stock qui '
            + 'n’a jamais été purgé. Le pipe réel, celui des trente derniers jours, pèse '
            + fmt(pi.recents) + ' dossiers.';
        },
        table: () => ''
      });

      // Où en sont les commandes engagées : la file BACS, étape par étape.
      // La tuile porte l'argent en attente ; le dépli montre la répartition.
      const en = state.entonnoir || {};
      const enTot = en.total || {};
      T.push({
        fam: 'pipe', id: 'pipecom', lab: 'Commandes en cours',
        v: fmt(enTot.n), statique: true,
        obj: fmtEur(enTot.montant) + ' engagés',
        c: (() => {
          const et = (en.etapes || []);
          const ap = et.find(x => x.cle === 'approbation');
          return ap && num(ap.n) > 0 ? fmt(ap.n) + ' en attente d\u2019approbation'
                                     : 'rien en attente d\u2019approbation';
        })(),
        sens: 'plat',
        titre: 'Les commandes engagées, étape par étape',
        ctx: 'Commandes BACS non soldées, à l\u2019instant présent. Les commandes closes '
           + 'sont exclues : ce qui compte ici est ce qu\u2019il reste à faire.',
        trouve: () => {
          const et = (en.etapes || []);
          if (!et.length) return 'Aucune commande en cours sur ce périmètre.';
          const plus = et.slice().sort((a, b) => num(b.montant) - num(a.montant))[0];
          const ap = et.find(x => x.cle === 'approbation');
          const ref = en.refus || {};
          let h = '<b>' + fmtEur(plus.montant) + ' attendent à l\u2019étape « '
                + esc(plus.lab).toLowerCase() + ' »</b>, soit '
                + pct(plus.montant, enTot.montant) + ' % de l\u2019argent engagé. ';
          if (ap && num(ap.n) > 0) {
            h += fmt(ap.n) + ' dossier' + (num(ap.n) > 1 ? 's attendent' : ' attend')
              + ' une approbation pour ' + fmtEur(ap.montant) + ' : c\u2019est la seule étape '
              + 'qui dépende d\u2019une signature, et la seule qu\u2019on puisse débloquer '
              + 'aujourd\u2019hui. ';
          }
          if (num(ref.n) > 0) {
            h += fmt(ref.n) + ' commande' + (num(ref.n) > 1 ? 's ont été refusées' : ' a été refusée')
              + ' pour ' + fmtEur(ref.montant) + '.';
          }
          return h;
        },
        table: () => entonnoirHtml(en)
      });

      // ------------------------------------------------------------- LIVRAISON
      T.push({
        fam: 'livr', id: 'livr', lab: 'À livrer', v: fmt(lv.en_attente), statique: true,
        obj: fmtEur(lv.montant) + ' engagés',
        c: fmt(lv.retard) + ' en retard réel', sens: num(lv.retard) > 0 ? 'baisse' : 'plat',
        vues: {
          vendeur: {
            titre: num(lv.retard) > 0 ? 'Les clients à rappeler avant qu’ils n’appellent'
                                      : 'Vos livraisons de la semaine',
            ctx: num(lv.retard) > 0
              ? 'Vos commandes dont la date promise est passée de moins de trois mois. Le client '
                + 'attend et n’a pas été prévenu.'
              : 'Vos commandes à livrer dans les sept jours, à confirmer au client.',
            liste: num(lv.retard) > 0 ? 'livr_retard' : 'livr_semaine', cols: colsLivraisons,
            table: () => tableau(['Quand', 'Vos dossiers', ''], [
              ['En retard', { h: '<span class="f" style="color:var(--m-rouge)">' + fmt(lv.retard) + '</span>' }, 'à rappeler'],
              ['Cette semaine', { h: '<span class="f">' + fmt(lv.semaine) + '</span>' }, 'à confirmer'],
              ['Ce mois-ci', { h: '<span class="f">' + fmt(lv.mois30) + '</span>' }, 'sous 30 jours'],
              ['Plus tard', { h: '<span class="f">' + fmt(lv.plus_tard) + '</span>' }, 'au-delà'],
              ['À clôturer', { h: '<span class="f pale">' + fmt(lv.a_cloturer) + '</span>' }, 'dossiers oubliés']
            ]),
            trouve: () => num(lv.retard) > 0
              ? '<b>' + fmt(lv.retard) + ' de vos clients ont dépassé leur date de livraison.</b> '
                + 'Un client prévenu d’un retard attend ; un client qui découvre le retard en '
                + 'appelant doute de tout le reste. C’est le seul appel de la journée qui coûte '
                + 'moins cher fait que pas fait.'
              : '<b>Aucun retard sur vos livraisons.</b> Les ' + fmt(lv.semaine) + ' dossiers de la '
                + 'semaine n’attendent qu’une confirmation — c’est aussi le moment où un accessoire '
                + 'ou une extension de garantie se placent encore.'
          }
        },
        titre: 'Commandes vendues non livrées',
        ctx: 'Commandes gagnées dont le statut BACS n’est pas clos, placées par rapport à la date promise.',
        trouve: () => '<b>Sur ' + fmt(num(lv.retard) + num(lv.a_cloturer)) + ' dates de livraison dépassées, '
          + fmt(lv.retard) + ' seulement sont de vrais retards.</b> Les ' + fmt(lv.a_cloturer)
          + ' autres ont plus de trois mois de dépassement : la voiture est livrée depuis longtemps, '
          + 'c’est le dossier qui n’a jamais été fermé dans BACS. Mélanger les deux rend '
          + 'l’indicateur inutilisable, d’où la séparation.',
        table: () => tableau(['Bloc', 'Dossiers', 'Ce que c’est'], [
          ['À rappeler aujourd’hui', { h: '<span class="f">' + fmt(lv.retard) + '</span>' }, 'date dépassée, moins de 90 jours'],
          ['Cette semaine', { h: '<span class="f">' + fmt(lv.semaine) + '</span>' }, 'à confirmer au client'],
          ['Ce mois-ci', { h: '<span class="f">' + fmt(lv.mois30) + '</span>' }, 'prévues sous 30 jours'],
          ['Plus tard', { h: '<span class="f">' + fmt(lv.plus_tard) + '</span>' }, 'au-delà de 30 jours'],
          ['À clôturer', { h: '<span class="f">' + fmt(lv.a_cloturer) + '</span>' }, 'plus de 90 jours de retard']
        ])
      });

      T.push({
        fam: 'livr', id: 'cloturer', lab: 'Dossiers à clôturer', v: fmt(lv.a_cloturer), statique: true,
        obj: 'plus de 90 jours de retard', c: 'travail d’administration', sens: 'plat',
        titre: 'Dossiers jamais fermés',
        ctx: 'Commandes dont la date de livraison promise est dépassée de plus de trois mois.',
        trouve: () => '<b>' + fmt(lv.a_cloturer) + ' dossiers portent un retard de plus de trois mois.</b> '
          + 'À cette ancienneté, la voiture est livrée : c’est le statut BACS qui n’est jamais '
          + 'passé à clos. Ils pèsent dans les ' + fmt(lv.en_attente) + ' « à livrer » et faussent tout '
          + 'indicateur de délai tant qu’on ne les sépare pas des ' + fmt(lv.retard) + ' vrais retards.',
        table: () => ''
      });

      // -------------------------------------------------------------- ACTIVITÉ
      //
      // Ces deux indicateurs ne mesurent pas le terrain : ils mesurent la
      // SAISIE dans One Data. Tant que l'outil n'est pas deploye chez les
      // vendeurs, ils valent zero — et un zero affiche en rouge ferait passer
      // pour un relachement commercial ce qui n'est qu'un calendrier de
      // deploiement.
      //
      // Le basculement est automatique, sans drapeau a maintenir : le jour ou
      // le premier compte rendu est saisi, la tuile reprend son sens d'elle-meme.
      const odSaisi = num(ac.rapports) > 0 || num(ac.rdv_soldes) > 0;

      T.push({
        fam: 'act', id: 'rapports', lab: 'Rapports vendeurs',
        v: odSaisi ? fmt(ac.rapports) : '\u2014', statique: true,
        obj: odSaisi ? 'sur 30 jours' : 'en attente du d\u00e9ploiement',
        c: odSaisi ? (num(ac.rapports) / 30).toFixed(1).replace('.', ',') + ' par jour'
                   : 'One Data pas encore d\u00e9ploy\u00e9',
        sens: 'plat', muette: !odSaisi,
        titre: 'Activit\u00e9 commerciale trac\u00e9e',
        ctx: 'Comptes rendus d\u2019\u00e9change saisis par les vendeurs dans One Data.',
        trouve: () => odSaisi
          ? '<b>' + fmt(ac.rapports) + ' comptes rendus en trente jours</b>, soit '
            + (num(ac.rapports) / 30).toFixed(1).replace('.', ',') + ' par jour. Les cl\u00f4tures '
            + 'de cycle \u00e9crites automatiquement par BACS en sont exclues : seules comptent '
            + 'les saisies d\u2019un vendeur apr\u00e8s un \u00e9change avec un client.'
          : '<b>Aucun compte rendu n\u2019est saisi, et c\u2019est attendu : One Data n\u2019est '
            + 'pas encore d\u00e9ploy\u00e9 aupr\u00e8s des vendeurs.</b> Cette tuile mesure '
            + 'l\u2019adoption de l\u2019outil, pas l\u2019activit\u00e9 du terrain — elle se '
            + 'remplira d\u2019elle-m\u00eame au d\u00e9ploiement. Les cl\u00f4tures de cycle '
            + '\u00e9crites par BACS sont volontairement exclues du compte : elles disent '
            + 'qu\u2019une commande a \u00e9t\u00e9 transmise, pas qu\u2019un vendeur a parl\u00e9 '
            + '\u00e0 quelqu\u2019un.',
        table: () => ''
      });

      T.push({
        fam: 'act', id: 'rdv', lab: 'Rendez-vous \u00e0 venir', v: fmt(ac.rdv_a_venir), statique: true,
        obj: fmt(ac.rdv_tenus) + ' tenus sur 30 jours',
        c: num(ac.rdv_soldes) === 0 ? (odSaisi ? 'aucun sold\u00e9' : 'r\u00e9sultats non saisis')
                                    : fmt(ac.rdv_soldes) + ' sold\u00e9s',
        sens: num(ac.rdv_soldes) === 0 && odSaisi ? 'baisse' : 'plat',
        titre: 'Rendez-vous clients',
        ctx: 'Rendez-vous import\u00e9s, et leur r\u00e9sultat quand il est saisi dans One Data.',
        trouve: () => num(ac.rdv_soldes) > 0
          ? fmt(ac.rdv_soldes) + ' rendez-vous sur ' + fmt(ac.rdv_tenus) + ' ont \u00e9t\u00e9 '
            + 'sold\u00e9s, soit ' + pct(ac.rdv_soldes, ac.rdv_tenus) + ' %.'
          : (odSaisi
            ? '<b>' + fmt(ac.rdv_tenus) + ' rendez-vous se sont tenus en trente jours et pas un '
              + 'seul n\u2019a \u00e9t\u00e9 sold\u00e9.</b> Le r\u00e9sultat n\u2019est '
              + 'jamais saisi : impossible de calculer une transformation rendez-vous vers vente, '
              + 'ni de savoir qui n\u2019est pas venu.'
            : '<b>Les rendez-vous sont import\u00e9s, leurs r\u00e9sultats ne le sont pas.</b> '
              + 'Le r\u00e9sultat d\u2019un rendez-vous se saisit dans One Data, qui n\u2019est '
              + 'pas encore d\u00e9ploy\u00e9 : la colonne « sold\u00e9s » restera vide '
              + 'jusque-l\u00e0. Le volume affich\u00e9, lui, est r\u00e9el et vient de '
              + 'l\u2019import.'),
        table: () => ''
      });


      // ----------------------------------------------------------------- LEADS
      T.push({
        fam: 'leads', id: 'leads', lab: 'Leads reçus', v: fmt(ld.recus_30j), statique: true,
        obj: 'sur 30 jours',
        c: pct(ld.perdus, ld.total) + ' % finissent perdus', sens: 'baisse',
        vues: {
          vendeur: {
            titre: 'Les leads qui vous attendent',
            ctx: 'Les leads qui vous ont été attribués et dont aucun premier contact n’est tracé. '
               + 'Le plus ancien en premier.',
            liste: 'leads_jamais', cols: colsLeads,
            table: () => '',
            trouve: () => '<b>' + fmt(ld.jamais_contactes) + ' leads vous ont été attribués sans '
              + 'qu’un seul appel soit tracé.</b> Un lead non rappelé n’est pas un lead perdu par '
              + 'hasard : c’est un client qui a appelé ailleurs. Et tant que le contact n’est pas '
              + 'saisi, le lead reste compté comme en attente — même si vous avez appelé.'
          }
        },
        titre: 'Leads entrants',
        ctx: 'Leads externes reçus sur le périmètre, toutes sources confondues.',
        trouve: () => '<b>Sur les ' + fmt(ld.total) + ' leads de l’historique, ' + fmt(ld.perdus)
          + ' sont classés perdus et ' + fmt(ld.resolus) + ' résolus.</b> Un lead sur '
          + (num(ld.resolus) > 0 ? Math.round(num(ld.total) / num(ld.resolus)) : '—')
          + ' aboutit à une issue tracée. Le reste se perd sans motif renseigné, ce qui rend toute '
          + 'analyse de rentabilité par source impossible : on ne sait pas quels apporteurs valent leur coût.',
        table: () => tableau(['État', 'Leads', 'Part'], [
          ['Perdus', { h: '<span class="f">' + fmt(ld.perdus) + '</span>' }, pct(ld.perdus, ld.total) + ' %'],
          ['Contactés', { h: '<span class="f">' + fmt(ld.contactes) + '</span>' }, pct(ld.contactes, ld.total) + ' %'],
          ['Attribués, jamais contactés', { h: '<span class="f">' + fmt(ld.jamais_contactes) + '</span>' },
            pct(ld.jamais_contactes, ld.total) + ' %'],
          ['Résolus', { h: '<span class="f">' + fmt(ld.resolus) + '</span>' }, pct(ld.resolus, ld.total) + ' %']
        ])
      });

      // Le délai n'est plus une médiane exacte mais la TRANCHE où tombe le
      // milieu : c'est le prix à payer pour qu'il reste juste quand on change de
      // périmètre, des médianes ne s'additionnant pas entre sites. L'affichage
      // le dit — « moins de 4 h », pas « 3,7 h ».
      const trMed = TRANCHES.filter(t => t.h === ld.delai_median_h)[0]
                 || (ld.delai_median_h == null && num(ld.delai_n) > 0
                      ? TRANCHES[TRANCHES.length - 1] : null);
      T.push({
        fam: 'leads', id: 'delai', lab: 'Premier contact',
        v: trMed ? (trMed.h == null ? '> 24' : String(trMed.h).replace('.', ',')) : '—',
        unite: 'h',
        statique: true, obj: trMed ? 'la moitié répond en ' + trMed.lab : 'aucun contact tracé',
        c: (trMed && trMed.h != null && trMed.h <= 1) ? 'dans la norme' : 'la norme est sous 1 h',
        sens: (trMed && trMed.h != null && trMed.h <= 1) ? 'hausse' : 'baisse',
        vues: {
          vendeur: {
            titre: 'Les plus anciens d’abord',
            ctx: 'Vos leads en attente, classés par ancienneté. Ceux du haut sont ceux dont la '
               + 'probabilité de réponse est la plus basse — et donc ceux à traiter en premier '
               + 'ou à classer.',
            liste: 'leads_jamais', cols: colsLeads,
            table: () => '',
            trouve: () => '<b>La première heure décide.</b> Passé ce délai, la probabilité de '
              + 'joindre un prospect s’effondre, et le concurrent a rappelé. Sur votre périmètre, '
              + 'la moitié des leads sont contactés en ' + (trMed ? trMed.lab : '—') + ' : '
              + 'ce n’est pas une question d’organisation, c’est la différence entre un lead qui se '
              + 'transforme et un lead qui alimente la statistique des perdus.'
          }
        },
        titre: 'Délai de premier contact',
        ctx: 'Temps écoulé entre la réception du lead et le premier contact tracé.',
        trouve: () => '<b>Un lead sur deux attend plus de '
          + String(ld.delai_median_h).replace('.', ',') + ' heures.</b> La probabilité de joindre un '
          + 'prospect s’effondre après la première heure ; à ce délai, le concurrent a rappelé. Et '
          + '<b>' + fmt(ld.jamais_contactes) + ' leads attribués n’ont jamais été contactés du '
          + 'tout</b> — ceux-là ne sont pas en retard, ils sont abandonnés.',
        table: () => ''
      });

      // ------------------------------------------------------------------ BASE
      if (ba) {
        const fu = ba.fusion || {}, bl = ba.bloctel || {};
        T.push({
          fam: 'base', id: 'injoignables', lab: 'Fiches injoignables', v: fmt(ba.injoignables), statique: true,
          obj: 'sur ' + fmt(ba.fiches) + ' fiches',
          c: pct(ba.injoignables, ba.fiches) + ' % de la base', sens: 'baisse',
          titre: 'Qualité des coordonnées',
          ctx: 'Fiches client sans téléphone ni adresse e-mail.',
          trouve: () => '<b>' + fmt(ba.sans_email) + ' fiches n’ont pas d’e-mail et '
            + fmt(ba.sans_tel) + ' pas de téléphone</b> ; ' + fmt(ba.injoignables) + ' n’ont ni '
            + 'l’un ni l’autre. Une fiche injoignable ne coûte rien à stocker et cher à compter : '
            + 'elle gonfle la base, fausse les taux de couverture et interdit toute campagne. Le champ '
            + 'manquant se récupère au comptoir, pas par un traitement.',
          table: () => tableau(['Manque', 'Fiches', 'Part'], [
            ['Sans adresse e-mail', { h: '<span class="f">' + fmt(ba.sans_email) + '</span>' }, pct(ba.sans_email, ba.fiches) + ' %'],
            ['Sans téléphone', { h: '<span class="f">' + fmt(ba.sans_tel) + '</span>' }, pct(ba.sans_tel, ba.fiches) + ' %'],
            ['Ni l’un ni l’autre', { h: '<span class="f">' + fmt(ba.injoignables) + '</span>' }, pct(ba.injoignables, ba.fiches) + ' %'],
            ['Sans code postal', { h: '<span class="f">' + fmt(ba.sans_cp) + '</span>' }, pct(ba.sans_cp, ba.fiches) + ' %'],
            ['En opposition commerciale', { h: '<span class="f">' + fmt(ba.stop_com) + '</span>' }, pct(ba.stop_com, ba.fiches) + ' %']
          ])
        });

        T.push({
          fam: 'base', id: 'fusion', lab: 'Rapprochements en attente', v: fmt(fu.en_attente), statique: true,
          obj: 'file d’arbitrage RCU',
          c: 'ni fusionnés ni rejetés', sens: 'baisse',
          titre: 'Déduplication client',
          ctx: 'Rapprochements que le résolveur d’identité n’a tranchés ni dans un sens ni dans l’autre.',
          trouve: () => {
            // Le rejet et la fusion sont le fait du traitement, pas d'un humain :
            // la file ne contient que la bande grise, celle où le résolveur ne
            // sait pas trancher seul. Personne ne la vide.
            return '<b>Ce n\u2019est pas une file d\u2019arbitrage, c\u2019est un angle mort.</b> '
              + 'Le rejet et la fusion sont automatiques\u202f; ces ' + fmt(fu.en_attente)
              + ' dossiers sont ceux dont le score tombe entre les deux seuils, là où le traitement '
              + 'ne sait pas trancher seul. Ils n\u2019attendent pas un arbitrage, ils attendent '
              + 'qu\u2019on décide d\u2019en faire quelque chose — et le tas grossit à chaque import.';
          },
          table: () => tableau(['État', 'Dossiers', 'Part'], [
            ['En attente d’arbitrage', { h: '<span class="f">' + fmt(fu.en_attente) + '</span>' }, pct(fu.en_attente, fu.total) + ' %'],
            ['Rejetés', { h: '<span class="f">' + fmt(fu.rejetes) + '</span>' }, pct(fu.rejetes, fu.total) + ' %'],
            ['Fusionnés', { h: '<span class="f">' + fmt(fu.fusionnes) + '</span>' }, pct(fu.fusionnes, fu.total) + ' %']
          ])
        });

        const txBloc = pct(bl.opposes, bl.verifies);
        T.push({
          fam: 'base', id: 'bloctel', lab: 'Bloctel',
          v: txBloc == null ? '—' : String(txBloc), unite: '%', statique: true,
          obj: 'des numéros vérifiés',
          c: pct(bl.verifies, ba.fiches) + ' % de la base vérifiée', sens: 'baisse',
          titre: 'Opposition au démarchage',
          ctx: 'Clients dont au moins un numéro est inscrit sur la liste Bloctel.',
          trouve: () => '<b>' + fmt(bl.opposes) + ' clients sur les ' + fmt(bl.verifies)
            + ' vérifiés sont inscrits sur Bloctel.</b> La prospection téléphonique sortante sur fichier '
            + 'est, en l’état, juridiquement fermée — et seules ' + pct(bl.verifies, ba.fiches)
            + ' % des fiches ont été confrontées à la liste. Le report naturel serait l’e-mail '
            + 'et le SMS ; aucun des deux n’est branché aujourd’hui.',
          table: () => ''
        });
      }

      // Ventilation par site : elle n'a de sens qu'en vue agrégée, et qu'à
      // partir de deux sites dans le périmètre.
      const sites = (det.sites || []);
      if (state.sel.level === 'all' && sites.length > 1) {
        T.push({
          fam: 'prod', id: 'sites', lab: 'Par site', v: String(sites.length), statique: true,
          obj: 'sites dans votre périmètre',
          c: 'vue agrégée', sens: 'plat',
          titre: 'La ventilation par site',
          ctx: 'Le même mois, découpé site par site. Un clic sur un site dans la barre du haut restreint toute la page.',
          trouve: () => {
            const tri = sites.slice().sort((a, b) => num(b.cdes) - num(a.cdes));
            const h = tri[0], b = tri[tri.length - 1];
            const ecartFi = (h.fi != null && b.fi != null) ? Math.abs(num(h.fi) - num(b.fi)) : null;
            return '<b>' + esc(h.site) + ' porte ' + fmt(h.cdes) + ' des ' + fmt(p.cdes)
              + ' commandes du périmètre.</b>'
              + (ecartFi != null && ecartFi >= 8
                 ? ' Et les sites ne vendent pas le financement de la même façon : ' + ecartFi
                   + ' points séparent ' + esc(h.site) + ' de ' + esc(b.site)
                   + ' — un écart de pratique, pas de clientèle.'
                 : ' Les taux de financement des sites restent dans un mouchoir de poche.');
          },
          table: () => {
            const mx = Math.max.apply(null, sites.map(x => num(x.cdes))) || 1;
            return tableau(['Site', 'Commandes', 'Poids', 'Financement', 'Accessoires'],
              sites.slice().sort((a, b) => num(b.cdes) - num(a.cdes)).map(x => [
                x.site,
                { h: '<span class="f">' + fmt(x.cdes) + '</span>' },
                { h: '<span style="display:inline-block;height:9px;border-radius:5px;width:'
                     + Math.max(num(x.cdes) / mx * 100, 4).toFixed(0) + '%;background:var(--m-bleu)"></span>' },
                x.fi == null ? '—' : x.fi + ' %',
                x.acc == null ? '—' : fmt(x.acc) + ' €'
              ]));
          }
        });
      }

      // Chaque fonction ne garde que ses tuiles.
      const jeu = jeuDuRole();
      return jeu ? T.filter(t => jeu.indexOf(t.id) !== -1 || t.id === 'sites') : T;
    }

    // =========================================================================
    //  RENDU
    // =========================================================================
    function phraseDuJour() {
      if (familleRole() === 'vendeur') return phraseVendeur();
      if (familleRole() === 'marketing') return phraseMarketing();
      if (familleRole() === 'direction') return phraseDirection();
      const d = state.d, p = d.prod || {}, o = d.obj || {}, ld = d.leads || {};
      const bouts = [];
      const objCde = num(o.cdes);
      if (objCde > 0) {
        bouts.push('<b>' + fmt(p.cdes) + ' commandes</b> pour un objectif de ' + objCde);
      } else {
        bouts.push('<b>' + fmt(p.cdes) + ' commandes</b> ce mois-ci');
      }
      // Les érosions : on ne cite que celles qui reculent vraiment sur un an.
      const recul = [];
      [['acc', 'accessoires', ''], ['roole', 'Roole', 'pts'], ['fi', 'financement', 'pts']]
        .forEach(([k, nom, u]) => {
          const e = ecartAn(k, u);
          if (e.sens === 'baisse') recul.push(nom + ' <b>' + e.txt.replace(' sur un an', '') + '</b>');
        });
      const ou = state.sel.level === 'all'
        ? (((state.d.perimetre || []).length > 1) ? 'Sur tout votre périmètre, le volume ' : 'Le volume ')
        : 'Sur ' + esc(state.sel.label) + ', le volume ';
      let ph = ou + (objCde > 0 && num(p.cdes) >= objCde ? 'tient' : 'est en deçà') + ' — ' + bouts[0];
      if (recul.length) ph += ' — mais ce qui s’ajoute à la voiture recule : ' + recul.join(', ');
      ph += '.';
      if (num(ld.delai_median_h) > 1) {
        ph += ' Et un lead sur deux attend <b>plus de '
          + String(ld.delai_median_h).replace('.', ',') + ' heures</b> avant le premier appel.';
      }
      return ph;
    }

    // Le bandeau d'un vendeur ne commente pas la santé du réseau : il ouvre sa
    // journée. Le premier bout dit où il en est de son mois, les suivants
    // nomment ce qui l'attend, dans l'ordre où ça coûte de ne pas le faire.
    function phraseVendeur() {
      const d = state.d, p = d.prod || {}, o = d.obj || {}, pi = d.pipe || {},
            lv = d.livr || {}, ld = d.leads || {};
      const objCde = num(o.cdes);
      let ph;
      if (objCde > 0) {
        const reste = objCde - num(p.cdes);
        ph = reste > 0
          ? 'Vous êtes à <b>' + fmt(p.cdes) + ' commandes</b> sur ' + objCde + ' : il en manque <b>'
            + fmt(reste) + '</b>.'
          : 'Vous êtes à <b>' + fmt(p.cdes) + ' commandes</b> pour ' + objCde
            + ' demandées — objectif tenu.';
      } else {
        ph = 'Vous êtes à <b>' + fmt(p.cdes) + ' commandes</b> ce mois-ci.';
      }
      const faire = [];
      if (num(lv.retard) > 0) {
        faire.push('<b>' + fmt(lv.retard) + ' client' + (num(lv.retard) > 1 ? 's ont' : ' a')
          + ' dépassé sa date de livraison</b>');
      }
      if (num(pi.a_relancer) > 0) {
        faire.push('<b>' + fmt(pi.a_relancer) + ' affaire' + (num(pi.a_relancer) > 1 ? 's' : '')
          + '</b> dans la fenêtre de relance');
      }
      if (num(ld.jamais_contactes) > 0) {
        faire.push('<b>' + fmt(ld.jamais_contactes) + ' lead'
          + (num(ld.jamais_contactes) > 1 ? 's' : '') + '</b> sans premier appel tracé');
      }
      if (!faire.length) return ph + ' Rien d’urgent dans votre portefeuille aujourd’hui.';
      const dernier = faire.pop();
      return ph + ' Aujourd’hui : '
        + (faire.length ? faire.join(', ') + ' et ' + dernier : dernier) + '.';
    }

    // Le marketing ne pilote ni le volume ni la marge : il pilote l'entrée —
    // ce qui arrive, à quelle vitesse c'est traité, et ce que la base permet
    // encore de faire.
    function phraseMarketing() {
      const d = state.d, ld = d.leads || {}, ba = d.base;
      const bouts = ['<b>' + fmt(ld.recus_30j) + ' leads</b> reçus en trente jours'];
      if (num(ld.jamais_contactes) > 0) {
        bouts.push('<b>' + fmt(ld.jamais_contactes) + '</b> attribués sans un seul appel tracé');
      }
      let ph = bouts.join(', ') + '.';
      if (num(ld.delai_median_h) > 1) {
        ph += ' Le délai médian de premier contact est de <b>'
          + String(ld.delai_median_h).replace('.', ',') + ' heures</b> — la probabilité de joindre '
          + 'un prospect s’effondre après la première.';
      }
      if (ba && num(ba.fiches) > 0) {
        const p2 = pct(ba.injoignables, ba.fiches);
        ph += ' Sur ' + fmt(ba.fiches) + ' fiches, <b>' + fmt(ba.injoignables)
          + '</b> n’ont ni téléphone ni e-mail' + (p2 != null ? ' (' + p2 + ' %)' : '') + '.';
      }
      return ph;
    }

    // Un directeur de groupe ne lit pas une liste d'érosions : il lit combien est
    // engagé, combien dort, et si le volume suit. Trois choses, dans cet ordre.
    function phraseDirection() {
      const d = state.d, p = d.prod || {}, o = d.obj || {}, pi = d.pipe || {}, lv = d.livr || {};
      const sv = (state.stock || {}).vn || {}, so = (state.stock || {}).vo || {};
      const parc = num(sv.valeur) + num(so.valeur);
      const dormant = num(sv.valeur_dormante) + num(so.valeur_dormante);
      const objCde = num(o.cdes);

      let ph = 'Sur ' + esc(state.sel.label) + ', ';
      if (parc > 0) {
        ph += '<b>' + fmtEur(parc) + ' de véhicules en parc</b>'
           + (dormant > 0 ? ', dont <b>' + fmtEur(dormant) + ' au-delà de trois mois</b>' : '') + '. ';
      }
      if (objCde > 0) {
        const r = pct(p.cdes, objCde);
        ph += fmt(p.cdes) + ' commandes pour ' + objCde + ' demandées'
           + (r != null ? ' (<b>' + r + ' %</b>)' : '') + '. ';
      } else if (num(p.cdes) > 0) {
        ph += fmt(p.cdes) + ' commandes ce mois-ci. ';
      }
      if (num(lv.retard) > 0) {
        ph += '<b>' + fmt(lv.retard) + ' livraisons</b> ont dépassé leur date promise.';
      } else if (num(pi.montant) > 0) {
        ph += fmtEur(pi.montant) + ' de pipe commercial en cours.';
      }
      return ph;
    }

    function nomSite(id) {
      const s2 = (state.d.perimetre || []).find(x => String(x.id_site) === String(id));
      return s2 ? (s2.nom || ('site ' + id)) : ('site ' + id);
    }

    // Le pouls d'un vendeur compte ce qui se fait dans la journée ; celui d'un
    // encadrant, ce qui se produit sur le périmètre. Les deux premiers repères
    // sont communs, les deux derniers changent.
    function pouls() {
      const d = state.d, m = d.meteo || {}, lv = d.livr || {}, pi = d.pipe || {},
            ld = d.leads || {}, ba = d.base;
      const fam = familleRole();
      let r;
      if (fam === 'vendeur') {
        r = [
          { n: fmt(m.cdes_jour), l: 'commande' + (num(m.cdes_jour) > 1 ? 's' : '') + '<br>aujourd’hui' },
          { n: fmt(m.devis_jour), l: 'devis<br>ouverts' },
          { n: fmt(lv.retard), l: 'livraison' + (num(lv.retard) > 1 ? 's' : '') + '<br>en retard' },
          { n: fmt(ld.jamais_contactes), l: 'leads<br>jamais appelés' }
        ];
      } else if (fam === 'marketing') {
        r = [
          { n: fmt(ld.recus_30j), l: 'leads reçus<br>sur 30 jours' },
          { n: fmt(ld.jamais_contactes), l: 'jamais<br>appelés' },
          { n: ld.delai_median_h == null ? '—' : String(ld.delai_median_h).replace('.', ','),
            l: 'heures avant<br>le premier appel' },
          { n: ba ? fmt(ba.injoignables) : '—', l: 'fiches<br>injoignables' }
        ];
      } else if (fam === 'direction') {
        // Au niveau groupe, le pouls du jour ne dit rien : un directeur regarde
        // ce qui est immobilisé et ce qui dort, pas les commandes de la matinée.
        const sv = (state.stock || {}).vn || {}, so = (state.stock || {}).vo || {};
        const dormant = num(sv.valeur_dormante) + num(so.valeur_dormante);
        r = [
          { n: fmtEur(num(sv.valeur) + num(so.valeur)), l: 'de stock<br>en parc' },
          { n: fmtEur(dormant), l: 'dorment depuis<br>plus de 90 jours' },
          { n: fmtEur(pi.montant), l: 'de pipe<br>commercial' },
          { n: fmt(lv.retard), l: 'livraisons<br>en retard' }
        ];
      } else {
        r = [
          { n: fmt(m.cdes_jour), l: 'commande' + (num(m.cdes_jour) > 1 ? 's' : '') + '<br>aujourd’hui' },
          { n: fmt(m.devis_jour), l: 'devis<br>ouverts' },
          { n: fmt(lv.semaine), l: 'livraison' + (num(lv.semaine) > 1 ? 's' : '') + '<br>cette semaine' },
          { n: fmt(pi.a_relancer), l: 'affaires<br>à relancer' }
        ];
      }
      return r.map(x => '<div><div class="n">' + x.n + '</div><div class="l">' + x.l + '</div></div>').join('');
    }

    let TUILES = [];

    function carte(t) {
      const sp = t.statique ? '<span class="c plat" style="margin-top:9px">' + esc(t.obj || '') + '</span>'
        : etincelle(t.vals, t.forme, t.sens === 'baisse' ? 'var(--m-rouge)' : 'var(--m-bleu)');
      return '<button class="dtuile' + (t.muette ? ' muette' : '') + '" type="button" data-id="' + esc(t.id)
        + '" aria-expanded="false"><span class="pl" aria-hidden="true">+</span>'
        + '<span class="lab">' + esc(t.lab) + '</span>'
        + '<span class="v">' + esc(t.v) + (t.unite ? '<em>' + esc(t.unite) + '</em>' : '') + '</span>'
        + '<span class="c ' + esc(t.sens || 'plat') + '">' + esc(t.c || '') + '</span>'
        + sp + '</button>';
    }

    function rendre() {
      const r = getRoot();
      const fams = FAMILLES.map(f => {
        const ts = TUILES.filter(t => t.fam === f.k);
        if (!ts.length) return '';
        // La largeur de la famille suit son nombre de tuiles, plafonnée à six :
        // au-delà, une seule famille mangeait la ligne et renvoyait toutes les
        // autres à la suivante.
        const n = Math.min(ts.length, 6);
        return '<section class="dfam' + (n <= 2 ? ' etroite' : '') + '" data-fam="' + f.k
          + '" style="grid-column:span ' + n + '">'
          + '<h2><span class="detat ' + f.etat + '"></span>'
          + '<span class="tt">' + esc(f.t) + '</span>'
          + '<span class="cn">' + esc(f.n) + '</span></h2>'
          + '<div class="dgrille">' + ts.map(carte).join('') + '</div></section>';
      }).join('');

      r.innerHTML = '<div class="dw">'
        + '<div class="drail"><h1>' + esc(TITRE_ROLE[familleRole()] || 'Le tableau du jour') + '</h1>'
        + '<span class="dt">' + esc(dateLongue()) + '</span>'
        + '<span class="dportee">' + esc(state.sel.label) + '</span>'
        + selecteurMois()
        + '<span class="drole">' + esc(ETIQ_ROLE[familleRole()] || '') + '</span></div>'
        // Le périmètre est un tableau : il a sa place en pleine largeur, pas
        // dans le rail du titre.
        + selecteurPerimetre()
        + (state.moisRepli
            ? '<div class="davis">' + esc(MOIS_LONG[new Date().getMonth()])
              + ' n\u2019a pas encore de commande : voici ' + esc(MOIS_LONG[state.mois - 1])
              + '. Le pipe, les livraisons et les leads ci-dessous sont, eux, à jour '
              + 'd\u2019aujourd\u2019hui.</div>'
            : '')
        + '<section class="dband"><div class="d"><div class="q">La météo du jour</div>'
        + '<p>' + phraseDuJour() + '</p></div>'
        + '<div class="dpouls">' + pouls() + '</div></section>'
        + '<div id="dash-fams" class="dfams">' + fams
        + '<div id="dash-tiroir"></div><div id="dash-ancre"></div></div>'
        + '<p class="dpied">Commandes gagnées uniquement, grands comptes exclus, '
        + (familleRole() === 'vendeur' ? 'sur vos propres affaires. ' : 'sur votre périmètre. ')
        + 'Douze mois glissants. Les seuils de relance (' + num((state.d.seuils || {}).p85) + ' et '
        + num((state.d.seuils || {}).p95) + ' jours) sont recalculés chaque nuit sur les affaires de '
        + 'l’année qui ont abouti. La pastille devant chaque famille dit l’état de sa source : '
        + '<span class="detat plein"></span>alimentée, <span class="detat partiel"></span>partielle, '
        + '<span class="detat vide"></span>sans donnée.</p>'
        + '</div>';

      r.querySelectorAll('.dtuile').forEach(b =>
        b.addEventListener('click', () => basculer(b.getAttribute('data-id'))));

      // Le chevron plie, le reste de la ligne choisit le périmètre.
      r.querySelectorAll('.dperimt tr').forEach(tr => {
        tr.addEventListener('click', ev => {
          const pli = tr.getAttribute('data-pli');
          if (pli && ev.target && ev.target.getAttribute('data-role') === 'pli') {
            const ouvertParDefaut = pli.indexOf('reseau:') === 0;
            const etat = state.plis[pli];
            state.plis[pli] = (etat === undefined) ? !ouvertParDefaut : !etat;
            rendre(); if (state.ouvert) basculer(state.ouvert, true);
            return;
          }
          const lv = tr.getAttribute('data-lv');
          const k = tr.getAttribute('data-k');
          const lab = tr.getAttribute('data-lab');
          if (lv === state.sel.level && String(k) === String(state.sel.key == null ? '' : state.sel.key)) return;
          state.sel = { level: lv, key: lv === 'all' ? null : (lv === 'site' ? Number(k) : k), label: lab };
          state.site = lv === 'site' ? Number(k) : null;
          // La barre du haut ne sait porter qu'un site : on ne lui pousse une
          // valeur que dans ce cas, sinon les deux se contrediraient.
          if (lv === 'site') { try { const b = siteBus(); if (b) b.setSiteId(Number(k)); } catch (e) { } }
          recharger();
        });
      });

      r.querySelectorAll('.dmois button[data-m]').forEach(b =>
        b.addEventListener('click', () => {
          const a = Number(b.getAttribute('data-a')), m = Number(b.getAttribute('data-m'));
          if (a === state.annee && m === state.mois) return;
          state.annee = a; state.mois = m;
          state.replieFait = true;      // choix explicite : le repli ne joue plus
          state.moisRepli = null;
          CACHE_ARBRE = null;           // l'arbre est daté, lui aussi
          recharger();
        }));

      r.querySelectorAll('.dseg button[data-site]').forEach(b =>
        b.addEventListener('click', () => {
          const v = b.getAttribute('data-site');
          const site = v === '' ? null : Number(v);
          if (String(site) === String(siteSelection())) return;
          if (site == null) { state.sel = { level: 'all', key: null, label: 'Tout mon périmètre' }; state.site = null; }
          else { poserSite(site); try { const bus = siteBus(); if (bus) bus.setSiteId(site); } catch (e) { } }
          recharger();
        }));
    }

    // Rechargement : on garde la tuile ouverte si elle existe encore dans le
    // nouveau jeu, sinon la page s'ouvre sur son indicateur par défaut.
    let jeton = 0;
    async function recharger() {
      if (state.chargement) return;
      state.chargement = true;
      const mien = ++jeton;
      const memoire = state.ouvert;
      try {
        // Changer de PÉRIMÈTRE ne déclenche plus aucun appel : le socle, le stock
        // et l'entonnoir sont tous ventilés par site et déjà en mémoire, et les
        // quatre chargeurs rendent leur cache immédiatement. Seul un changement
        // de MOIS repart chercher le socle, et le détail, qui reste périmétré.
        const pStock = chargerStock().catch(() => null);
        const pEnt   = chargerEntonnoir().catch(() => null);
        const pBase  = chargerBase().catch(() => null);
        const pDet   = chargerDetail().catch(() => null);
        const d = await charger();
        if (mien !== jeton) return;            // un autre changement est passé devant
        state.d = d;
        pStock.then(j => { if (mien !== jeton || !j) return;
                           state.stockBrut = j; TUILES = tuiles(); rendre();
                           if (state.ouvert) basculer(state.ouvert, true); });
        pEnt.then(j => { if (mien !== jeton || !j) return;
                         state.entonnoirBrut = j; TUILES = tuiles(); rendre();
                         if (state.ouvert) basculer(state.ouvert, true); });
        pBase.then(j => { if (mien !== jeton || !greffer('base', j)) return;
                          TUILES = tuiles(); rendre();
                          if (state.ouvert) basculer(state.ouvert, true); });
        pDet.then(j => { if (mien !== jeton || !greffer('detail', j)) return;
                         TUILES = tuiles(); rendre();
                         if (state.ouvert) basculer(state.ouvert, true); });
        TUILES = tuiles();
        state.ouvert = null;
        rendre();
        const cible = TUILES.some(t => t.id === memoire) ? memoire : tuileParDefaut();
        if (cible) basculer(cible, true);
      } catch (e) {
        console.error('[dash] rechargement', e);
      } finally {
        state.chargement = false;
      }
    }

    function tuileParDefaut() {
      const prefere = ecartAn('fi', 'pts').sens === 'baisse' ? 'fi' : 'cdes';
      return TUILES.some(t => t.id === prefere) ? prefere : (TUILES[0] && TUILES[0].id);
    }

    // -------------------------------------------------------------------------
    //  Le périmètre
    //
    //  Une rangée de vingt-sept boutons n'est pas un sélecteur, c'est une liste
    //  à lire. Au-delà de six sites, le choix passe par l'arborescence réelle du
    //  groupe — marque › affaire › site — celle que Performances utilise déjà.
    //  En dessous, la rangée reste plus rapide qu'un arbre à deux branches.
    // -------------------------------------------------------------------------
    function arbrePerimetre() {
      const per = (state.d.perimetre || []).slice();
      const marques = [];
      per.forEach(s2 => {
        const mk = s2.reseau || '__sans';
        let m = marques.find(x => x.k === mk);
        if (!m) { m = { k: mk, lab: s2.reseau || 'Sans marque', aff: [] }; marques.push(m); }
        const ak = s2.affaire || '__sans';
        let a = m.aff.find(x => x.k === ak);
        if (!a) { a = { k: ak, lab: s2.affaire || 'Sans affaire', sites: [] }; m.aff.push(a); }
        a.sites.push(s2);
      });
      marques.sort((a, b) => a.k === '__sans' ? 1 : b.k === '__sans' ? -1 : a.lab.localeCompare(b.lab));
      marques.forEach(m => {
        m.aff.sort((a, b) => a.lab.localeCompare(b.lab));
        m.aff.forEach(a => a.sites.sort((x, y) => String(x.nom).localeCompare(String(y.nom))));
      });
      return marques;
    }

    // Le tableau du périmètre. Chaque ligne est sélectionnable — le groupe, une
    // marque, une affaire, un site — et porte ses chiffres, comme le périmètre
    // du suivi d'activité. Le chevron plie la branche, le reste de la ligne
    // choisit le périmètre.
    function cleSel() {
      return state.annee + '|' + state.mois + '|' + state.sel.level + '|' + state.sel.key;
    }

    function poserSite(id) {
      const s2 = ((state.d || {}).perimetre || []).find(x => String(x.id_site) === String(id));
      state.sel = { level: 'site', key: Number(id),
                    label: s2 ? (s2.nom || ('Site ' + id)) : ('Site ' + id) };
      state.site = Number(id);
    }

    // Le sélecteur de périmètre revient DANS la page. L'essai d'un sélecteur
    // unique en barre du haut a échoué pour une raison de fond : la barre est
    // partagée par toutes les pages, et aucune page opérationnelle (kanban,
    // lead management, listes VN/VO) ne sait travailler sur « une marque ».
    // Choisir TOYOTA là-haut les laissait vides ou figées. La barre redevient
    // donc un sélecteur de SITE, et chaque page qui sait agréger porte son
    // propre périmètre — celui-ci.
    //
    // Un site sélectionné ici est poussé vers la barre du haut (c'est un choix
    // qu'elle sait porter) ; une marque ou une affaire ne l'est pas.
    function selecteurPerimetre() {
      const per = (state.d.perimetre || []);
      if (per.length < 2) return '';            // un seul site : rien à choisir
      const sel = state.sel || { level: 'all', key: null };
      const estSel = (lv, k) =>
        sel.level === lv && String(sel.key == null ? '' : sel.key) === String(k == null ? '' : k);

      const ligne = (lv, k, lab, niveau, pliable, ouvert, suffixe) =>
        '<tr class="' + (niveau ? 'lv' + niveau + ' ' : '') + (estSel(lv, k) ? 'actif' : '') + '"'
        + ' data-lv="' + esc(lv) + '" data-k="' + esc(k == null ? '' : k) + '"'
        + ' data-lab="' + esc(lab) + '"'
        + (pliable ? ' data-pli="' + esc(lv + ':' + k) + '"' : '')
        + '><td>'
        + (pliable
            ? '<span class="pli" data-role="pli">' + (ouvert ? '▾' : '▸') + '</span>'
            : '<span class="pli"></span>')
        + esc(lab)
        + (suffixe ? ' <em class="pale">' + esc(suffixe) + '</em>' : '')
        + '</td></tr>';

      // Même règle que la barre du haut : un échelon qui n'offre aucun choix
      // n'est pas un échelon. Sur un petit périmètre, une marque unique ou une
      // affaire à site unique ne ferait que répéter la ligne suivante.
      const compact = per.length < 7;
      const marques = arbrePerimetre();
      const plusieursMarques = marques.length > 1;
      const nb = n => n + (n > 1 ? ' sites' : ' site');
      let h = ligne('all', '', 'Tout mon périmètre', 0, false, false, nb(per.length));

      marques.forEach(m => {
        const nSites = m.aff.reduce((a, x) => a + x.sites.length, 0);
        const rendreM = compact ? (plusieursMarques && nSites > 1) : true;
        let d = 1;
        if (rendreM) {
          const pk = 'reseau:' + m.k, ouv = state.plis[pk] !== false;
          h += ligne('reseau', m.k, m.lab, 1, true, ouv, nb(nSites));
          if (!ouv) return;
          d = 2;
        }
        const plusieursAff = m.aff.length > 1;
        m.aff.forEach(a => {
          const rendreA = compact ? (plusieursAff && a.sites.length > 1) : true;
          let d2 = d;
          if (rendreA) {
            const ak = 'affaire:' + a.k, aouv = state.plis[ak] === true;
            h += ligne('affaire', a.k, a.lab, d, true, aouv, nb(a.sites.length));
            if (!aouv) return;
            d2 = d + 1;
          }
          a.sites.forEach(s2 => {
            h += ligne('site', s2.id_site, s2.nom || ('Site ' + s2.id_site),
                       Math.min(d2, 3), false, false, '');
          });
        });
      });

      return '<section class="dperim">'
        + '<div class="dperim-h">Périmètre <span class="cn">' + esc(sel.label || '')
        + '</span></div>'
        + '<div class="dscroll"><table class="dmini dperimt"><tbody>' + h
        + '</tbody></table></div></section>';
    }

    // -------------------------------------------------------------------------
    //  LE MOIS
    //
    //  Le tableau de bord lisait toujours le mois en cours. Le 1er octobre, cela
    //  donne une page entière à zéro : aucune commande n'a encore été passée, et
    //  tout ce qui est mensuel — commandes, financement, accessoires, Roole —
    //  affiche 0 ou « — ». La page devient illisible un jour sur trente, et
    //  pire : elle fait douter du reste, qui est juste.
    //
    //  Deux réponses, pas une. Un SÉLECTEUR, pour aller voir le mois qu'on veut.
    //  Et un REPLI automatique au démarrage : tant que le mois en cours n'a
    //  aucune commande sur le périmètre, la page s'ouvre sur le mois précédent
    //  et le dit. Le repli ne joue qu'une fois — choisir un mois à la main le
    //  désarme, sinon le sélecteur serait inutilisable.
    // -------------------------------------------------------------------------
    const MOIS_LONG = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet',
                       'août', 'septembre', 'octobre', 'novembre', 'décembre'];

    function moisPrecedent(a, m) { return m > 1 ? { a: a, m: m - 1 } : { a: a - 1, m: 12 }; }

    function estMoisEnCours() {
      const d = new Date();
      return state.annee === d.getFullYear() && state.mois === d.getMonth() + 1;
    }

    function selecteurMois() {
      const d = new Date();
      const choix = [];
      let a = d.getFullYear(), m = d.getMonth() + 1;
      for (let i = 0; i < 3; i++) {
        choix.push({ a: a, m: m, lab: MOIS_LONG[m - 1] + (i === 0 ? '' : '') });
        const p2 = moisPrecedent(a, m); a = p2.a; m = p2.m;
      }
      return '<div class="dmois" role="group" aria-label="Mois">'
        + choix.map(c => '<button type="button" data-a="' + c.a + '" data-m="' + c.m + '"'
            + ' aria-pressed="' + (c.a === state.annee && c.m === state.mois) + '">'
            + esc(c.lab) + '</button>').join('')
        + '</div>';
    }

    // Vrai une seule fois : si le mois en cours est vide, on recule d'un mois.
    async function replierSiMoisVide() {
      if (state.replieFait || !estMoisEnCours()) return false;
      state.replieFait = true;
      if (num((state.d.prod || {}).cdes) > 0) return false;
      const p2 = moisPrecedent(state.annee, state.mois);
      state.moisRepli = { depuis: MOIS_LONG[state.mois - 1] };
      state.annee = p2.a; state.mois = p2.m;
      return true;
    }

    function dateLongue() {
      const j = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
      const m = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août',
                 'septembre', 'octobre', 'novembre', 'décembre'];
      const d = new Date();
      return j[d.getDay()] + ' ' + d.getDate() + ' ' + m[d.getMonth()]
        + ' · ' + m[state.mois - 1] + (estMoisEnCours() ? ' en cours' : ' ' + state.annee);
    }

    // `auto` : réouverture faite par la page elle-même (rechargement, arrivée
    // d'une donnée en différé). Elle ne doit PAS faire défiler la page : c'est
    // ce qui renvoyait l'écran vers le bas à chaque changement de périmètre,
    // trois fois de suite — une par rechargement différé.
    function basculer(id, auto) {
      if (state.ouvert === id) { fermer(); return; }
      const t = TUILES.find(x => x.id === id);
      if (!t) return;
      state.ouvert = id;
      const r = getRoot();
      r.querySelectorAll('.dtuile').forEach(b =>
        b.setAttribute('aria-expanded', String(b.getAttribute('data-id') === id)));
      const zone = r.querySelector('#dash-tiroir');
      // Le tiroir se glisse APRÈS la section de la famille, pas dedans : dedans,
      // il héritait de la largeur de la colonne (parfois une seule tuile).
      const hote = r.querySelector('.dtuile[data-id="' + id + '"]').closest('.dfam');
      hote.parentNode.insertBefore(zone, hote.nextSibling);

      // Tout ce qui s'affiche ici passe par vue() : la même tuile ne raconte pas
      // la même chose à un vendeur et à son chef.
      const titre = vue(t, 'titre'), ctx = vue(t, 'ctx');
      const fTrouve = vue(t, 'trouve'), fTable = vue(t, 'table');
      const bloc = vue(t, 'liste'), fCols = vue(t, 'cols');
      const arbre = vue(t, 'arbre'), equipe = vue(t, 'equipe'), sources = vue(t, 'sources');
      let trouve = '', table = '';
      try { trouve = fTrouve ? fTrouve() : ''; } catch (e) { console.error('[dash] trouvaille', id, e); }
      try { table = fTable ? fTable() : ''; } catch (e) { console.error('[dash] table', id, e); }

      zone.innerHTML = '<section class="dtiroir">'
        + '<button class="dferme dx" type="button" aria-label="Refermer">×</button>'
        + '<div style="min-width:0">'
        + '<h3>' + esc(titre) + '</h3><p class="ctx">' + esc(ctx) + '</p>'
        + (t.statique ? '' : graphe(t.vals, t.forme, t.lm, t.gUnite, t.second, titre))
        + table
        + (arbre ? '<div class="darbre-z"><p class="ctx">Chargement de l’arborescence…</p></div>' : '')
        + (equipe ? '<div class="dequipe-z"><p class="ctx">Chargement de l’équipe…</p></div>' : '')
        + (sources ? '<div class="dsources-z"><p class="ctx">Chargement des sources…</p></div>' : '')
        + (bloc ? '<div class="dliste" data-bloc="' + esc(bloc) + '">'
                  + '<p class="ctx">Chargement de la liste…</p></div>' : '')
        + '</div><div style="min-width:0">'
        + '<div class="dtrouve"><div class="t">Ce que le chiffre ne dit pas</div>' + trouve + '</div>'
        + '<button class="dferme" type="button">Refermer</button></div></section>';
      zone.querySelectorAll('.dferme').forEach(b => b.addEventListener('click', fermer));
      if (!auto) { try { zone.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) { } }

      // L'arborescence de la direction. Cliquer une ligne de marque ou d'affaire
      // la replie ; cliquer un site filtre tout le tableau de bord dessus.
      if (arbre) {
        const zA = zone.querySelector('.darbre-z');
        chargerArbre().then(j => {
          if (state.ouvert !== id || !zA.isConnected) return;
          zA.innerHTML = rendreArbre(j, arbre);
          // Le constat se réécrit sur les données réelles de l'arbre : il nomme
          // l'entité qui décroche, pas un vendeur.
          const zT = zone.querySelector('.dtrouve');
          if (zT) zT.innerHTML = '<div class="t">Ce que le chiffre ne dit pas</div>'
            + trouvailleArbre(j, arbre);
          zA.querySelectorAll('tr[data-cle], tr[data-site]').forEach(tr => {
            tr.addEventListener('click', () => {
              const site = tr.getAttribute('data-site');
              if (site != null) {
                poserSite(Number(site));
                try { const b = siteBus(); if (b) b.setSiteId(Number(site)); } catch (e) { }
                recharger();
                return;
              }
              const cle = tr.getAttribute('data-cle');
              state.arbrePlis[cle] = state.arbrePlis[cle] === false ? true : false;
              fermer(); basculer(id, true); // le dépli se redessine avec le nouveau pli
            });
          });
        }).catch(e => {
          console.error('[dash] arbre', e);
          if (zA.isConnected) zA.innerHTML = '<p class="ctx">L’arborescence n’a pas pu être chargée.</p>';
        });
      }

      if (equipe) {
        const zE = zone.querySelector('.dequipe-z');
        chargerEquipe().then(j => {
          if (state.ouvert !== id || !zE.isConnected) return;
          zE.innerHTML = rendreEquipe(j, equipe);
          const zT = zone.querySelector('.dtrouve');
          if (zT) zT.innerHTML = '<div class="t">Ce que le chiffre ne dit pas</div>'
            + trouvailleEquipe(j, equipe);
        }).catch(e => {
          console.error('[dash] equipe', e);
          if (zE.isConnected) zE.innerHTML = '<p class="ctx">L’équipe n’a pas pu être chargée.</p>';
        });
      }

      if (sources) {
        const zS = zone.querySelector('.dsources-z');
        chargerSources().then(j => {
          if (state.ouvert !== id || !zS.isConnected) return;
          zS.innerHTML = rendreSources(j);
          const zT = zone.querySelector('.dtrouve');
          if (zT) zT.innerHTML = '<div class="t">Ce que le chiffre ne dit pas</div>'
            + trouvailleSources(j);
        }).catch(e => {
          console.error('[dash] sources', e);
          if (zS.isConnected) zS.innerHTML = '<p class="ctx">Les sources n’ont pas pu être chargées.</p>';
        });
      }

      // La liste arrive après coup. Le dépli reste utilisable pendant ce temps,
      // et si la tuile a changé entre-temps on n'écrit rien.
      if (bloc) {
        const cible = zone.querySelector('.dliste');
        chargerListe(bloc).then(j => {
          if (state.ouvert !== id || !cible.isConnected) return;
          cible.innerHTML = listeNominative(j, (fCols || colsAffaires)());
        }).catch(e => {
          console.error('[dash] liste', bloc, e);
          if (cible.isConnected) cible.innerHTML = '<p class="ctx">La liste n’a pas pu être chargée.</p>';
        });
      }
    }

    function fermer() {
      state.ouvert = null;
      const r = getRoot();
      r.querySelectorAll('.dtuile').forEach(b => b.setAttribute('aria-expanded', 'false'));
      const a = r.querySelector('#dash-ancre'), z = r.querySelector('#dash-tiroir');
      if (!z) return;
      // C'était le bug : le tiroir était replacé à sa position de repos, mais son
      // contenu restait écrit. « Refermer » donnait donc l'impression de pousser
      // le détail vers le bas au lieu de le fermer.
      z.innerHTML = '';
      if (a) a.parentNode.insertBefore(z, a);
    }

    // =========================================================================
    //  DÉMARRAGE
    // =========================================================================
    getRoot().innerHTML = '<div class="dvide">Chargement du tableau de bord…</div>';

    // D'abord le périmètre, ensuite les chiffres. Jamais l'inverse.
    const idDepart = await siteDOuverture(2000);
    if (idDepart != null) { state.busSiteVu = idDepart; poserSite(idDepart); }

    // Le stock et l'entonnoir ne dépendent ni de l'année ni du mois : ils
    // partent tout de suite, en même temps que les chiffres, au lieu d'attendre
    // leur retour. L'arbre, lui, est daté — il attend le repli de mois.
    const pStock0 = chargerStock().catch(() => null);
    const pEnt0   = chargerEntonnoir().catch(() => null);
    const pBase0  = chargerBase().catch(() => null);

    try {
      state.d = await charger();
    } catch (e) {
      console.error('[dash] dashboard_tc', e);
      getRoot().innerHTML = '<div class="dvide">Le tableau de bord n’a pas pu être chargé. '
        + 'Rechargez la page ; si le problème persiste, la fonction dashboard_tc est peut-être absente '
        + 'de ce tenant.</div>';
      return;
    }
    if (!state.d) { getRoot().innerHTML = '<div class="dvide">Aucune donnée sur votre périmètre.</div>'; return; }
    // Le mois en cours est vide (on est le 1er, ou rien n'est encore importé) :
    // on s'ouvre sur le mois précédent plutôt que sur une page de zéros.
    if (await replierSiMoisVide()) {
      try { state.d = await charger(); } catch (e) { console.error('[dash] repli mois', e); }
    }
    // L'arbre n'est plus chargé ici. Il l'était à chaque montage et à chaque
    // changement de périmètre — l'appel le plus lourd de la page, 1,3 s — pour
    // remplir une variable que PERSONNE ne lisait : le tiroir fait sa propre
    // requête et se sert de son résultat. Il est donc chargé à l'ouverture
    // d'une tuile qui l'affiche, et mis en cache pour les suivantes.
    //
    // Le libellé du périmètre n'était qu'un « Site 12 » tant que la liste des
    // sites n'était pas revenue : on le reprend maintenant qu'elle est là.
    if (idDepart != null) poserSite(idDepart);
    TUILES = tuiles();
    rendre();
    pStock0.then(j => { if (!j) return;
                        state.stockBrut = j; TUILES = tuiles(); rendre();
                        if (state.ouvert) basculer(state.ouvert, true); });
    pEnt0.then(j => { if (!j) return;
                      state.entonnoirBrut = j; TUILES = tuiles(); rendre();
                      if (state.ouvert) basculer(state.ouvert, true); });
    pBase0.then(j => { if (!greffer('base', j)) return;
                       TUILES = tuiles(); rendre();
                       if (state.ouvert) basculer(state.ouvert, true); });
    chargerDetail().then(j => { if (!greffer('detail', j)) return;
                                TUILES = tuiles(); rendre();
                                if (state.ouvert) basculer(state.ouvert, true); })
                   .catch(() => { });
    // Une tuile est ouverte d'entrée : la page montre à quoi sert le clic sans
    // qu'on ait à le deviner. Le financement si son taux a reculé, sinon les
    // commandes.
    const ouvrable = tuileParDefaut();
    if (ouvrable) basculer(ouvrable, true);
    // Le bus peut arriver après le module : on se branche une fois la page
    // posée, et il recalera le site lui-même s'il en porte déjà un.
    brancherBus();
  }
});
