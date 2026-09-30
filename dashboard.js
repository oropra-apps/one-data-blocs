// ============================================================================
//  DASHBOARD — module One Data (OD.define)   v30 — PROFIL TEAM COLIN
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
//  LE PÉRIMÈTRE — TOUS LES NIVEAUX (v30)
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
    async function getUserJwt() {
      try { const s = await ctx.supabase.auth.getSession(); return s?.data?.session?.access_token || null; }
      catch (e) { return null; }
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
#dash-root .dfam{display:flex;flex-direction:column;gap:9px}
#dash-root .dfam > h2{font-size:12px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;
  color:var(--ink-2);margin:6px 0 0;display:flex;align-items:baseline;gap:10px;flex-wrap:wrap}
#dash-root .dfam > h2 .cn{font-size:11px;font-weight:600;letter-spacing:0;text-transform:none;color:var(--ink-3)}
#dash-root .detat{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:6px;vertical-align:1px}
#dash-root .detat.plein{background:var(--m-vert)}
#dash-root .detat.partiel{background:var(--m-orange)}
#dash-root .detat.vide{background:var(--line-2)}
#dash-root .dgrille{display:grid;grid-template-columns:repeat(auto-fill,minmax(176px,1fr));gap:10px}
#dash-root .dtuile{position:relative;text-align:left;font:inherit;color:var(--ink);cursor:pointer;
  background:var(--card);border:1px solid var(--line);border-radius:13px;padding:14px 15px 11px;
  box-shadow:var(--ombre);display:flex;flex-direction:column;min-width:0;
  transition:border-color .12s,transform .12s}
#dash-root .dtuile:hover{border-color:var(--line-2);transform:translateY(-1px)}
#dash-root .dtuile[aria-expanded="true"]{border-color:var(--bleu);
  box-shadow:0 0 0 2px rgba(42,94,169,.22),var(--ombre)}
#dash-root .dtuile:focus-visible{outline:2px solid var(--bleu);outline-offset:2px}
#dash-root .dtuile.muette{opacity:.62;border-style:dashed}
#dash-root .dtuile.muette .v{color:var(--ink-3)}
#dash-root .dtuile .lab{font-size:11px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;
  color:var(--ink-3);display:block;min-height:29px;padding-right:22px;line-height:1.3}
#dash-root .dtuile .v{font-family:var(--mono);font-size:26px;font-weight:600;letter-spacing:-.02em;
  line-height:1.15;margin-top:2px;font-variant-numeric:tabular-nums}
#dash-root .dtuile .v em{font-style:normal;font-size:14px;color:var(--ink-3);font-weight:400;margin-left:3px}
#dash-root .dtuile .c{font-size:11.5px;margin-top:3px;font-weight:600;line-height:1.3}
#dash-root .dtuile svg.sp{display:block;width:100%;height:30px;margin-top:auto;padding-top:9px;overflow:visible}
#dash-root .dtuile .pl{position:absolute;top:12px;right:12px;width:17px;height:17px;border-radius:50%;
  background:var(--calme-bg);color:var(--ink-3);font-size:12px;font-weight:800;line-height:17px;text-align:center}
#dash-root .dtuile[aria-expanded="true"] .pl{background:var(--bleu);color:#fff}
#dash-root .hausse{color:var(--m-vert)}#dash-root .baisse{color:var(--m-rouge)}#dash-root .plat{color:var(--ink-3)}
#dash-root .dtiroir{background:var(--card);border:1px solid var(--bleu);border-radius:14px;
  box-shadow:var(--ombre);padding:20px 22px;display:grid;
  grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:24px}
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
#dash-root .dferme{background:none;border:0;font:inherit;font-size:12px;font-weight:600;color:var(--ink-3);
  cursor:pointer;padding:0;margin-top:14px;text-decoration:underline;text-underline-offset:3px}
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
    const JOURS_NOM = { '1': 'Lundi', '2': 'Mardi', '3': 'Mercredi', '4': 'Jeudi',
                        '5': 'Vendredi', '6': 'Samedi', '7': 'Dimanche' };

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
                    plis: {}, arbrePlis: {} };

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
    function brancherBus(essais) {
      essais = essais || 0;
      const b = siteBus();
      if (!b) { if (essais < 120) setTimeout(() => brancherBus(essais + 1), 250); return; }
      try {
        const id = b.getSiteId();
        if (id != null && String(id) !== String(siteSelection())) { poserSite(Number(id)); recharger(); }
      } catch (e) { }
      if (window.__dashTcBusBound) return;
      window.__dashTcBusBound = true;
      b.onChange(({ siteId }) => {
        const v = siteId == null ? null : Number(siteId);
        if (String(v) === String(siteSelection())) return;
        if (v == null) state.sel = { level: 'all', key: null, label: 'Tout mon périmètre' };
        else poserSite(v);
        recharger();
      });
    }

    async function charger() {
      const jwt = await getUserJwt();
      if (!jwt) throw new Error('session absente');
      const res = await fetch(SUPABASE_URL + '/rest/v1/rpc/dashboard_tc', {
        method: 'POST',
        headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + jwt,
                   'Content-Type': 'application/json' },
        body: JSON.stringify({ p_annee: state.annee, p_mois: state.mois,
                               p_id_site: siteSelection(), p_sites: sitesSelection() })
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
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
      vendeur:   ['cdes', 'fi', 'acc', 'affaires', 'relance', 'livr', 'leads', 'delai'],
      // Le chef : la production de son équipe, plus les objectifs individuels
      // qu'il suit — PHEV et utilitaires en font partie, ils sont fixés par
      // vendeur et par mois.
      chef:      ['cdes', 'fi', 'loa', 'acc', 'roole', 'reprise', 'phev', 'vu',
                  'affaires', 'relance', 'pipeval', 'livr', 'cloturer',
                  'rapports', 'rdv', 'leads', 'delai'],
      // La direction : les marges et les stocks, pas les objectifs individuels.
      // PHEV et utilitaires se pilotent au site, pas au groupe — les mettre ici
      // ne produirait qu'une somme sans destinataire.
      direction: ['cdes', 'fi', 'loa', 'acc', 'roole', 'reprise',
                  'affaires', 'relance', 'pipeval', 'livr', 'cloturer',
                  'leads', 'delai', 'injoignables', 'fusion', 'bloctel'],
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

    // Somme de tous les compteurs d'un ensemble de sites.
    const CLES_SOMME = ['cdes', 'obj_cdes', 'hors_loueurs', 'fi', 'loa', 'roole', 'reprise',
                        'phev', 'vu', 'acc_total', 'affaires', 'a_relancer', 'froides',
                        'livr', 'retard', 'a_cloturer', 'leads', 'leads_jamais'];
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
      delai:    { t: 'Leads sans appel', v: a => fmt(a.leads_jamais) }
    };

    // Rendu de l'arbre pour UN indicateur, plus la colonne commandes comme
    // repère de volume — un taux sans son volume ne se compare pas.
    function rendreArbre(j, indCle) {
      const ind = IND[indCle] || IND.cdes;
      const marques = construireArbre((j || {}).sites || []);
      if (!marques.length) return '<p class="ctx">Aucun site dans votre périmètre.</p>';
      const entetes = ['Périmètre', 'Commandes', ind.t, ''];
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
                 + esc(lab) },
            { h: '<span class="f">' + fmt(agg.cdes) + '</span>' },
            { h: '<span class="f"' + (ind.bon && ind.bon(agg) ? ' style="color:var(--m-vert)"' : '') + '>'
                 + ind.v(agg) + '</span>' },
            { h: sous ? '<span class="pale">' + sous + '</span>' : '' }
          ]
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
      const entetes = ['Vendeur', 'Commandes', d.t, ''].concat(multi ? ['Site'] : []);
      return tableauLignes(entetes, l.map(v => ({
        attrs: d.mauvais && d.mauvais(v) ? ' class="dmuet"' : '',
        c: [
          { h: '<b>' + esc(v.nom) + '</b>' },
          { h: '<span class="f">' + fmt(v.cdes) + '</span>' },
          { h: '<span class="f"' + (d.mauvais && d.mauvais(v) ? ' style="color:var(--m-rouge)"' : '')
               + '>' + d.v(v) + '</span>' },
          { h: d.r ? '<span class="pale">' + d.r(v) + '</span>' : '' }
        ].concat(multi ? [{ h: '<span class="pale">' + esc(v.site || '—') + '</span>' }] : [])
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
      { k: 'pipe', t: 'Pipe et relances', etat: 'plein', n: 'affaires et devis BACS' },
      { k: 'livr', t: 'Livraisons', etat: 'plein', n: 'statut BACS des commandes' },
      { k: 'act', t: 'Activité commerciale', etat: 'partiel', n: 'rapports tenus, rendez-vous jamais soldés' },
      { k: 'leads', t: 'Leads', etat: 'partiel', n: 'reçus et attribués tracés, issue rarement renseignée' },
      { k: 'base', t: 'Qualité de la base client', etat: 'partiel', n: 'réservé à l’encadrement' }
    ];

    function tuiles() {
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
              const j = (det.jours || []).slice().sort((a, b) => num(b.n) - num(a.n));
              const fort = j.length ? (JOURS_NOM[j[0].dow] || '').toLowerCase() : null;
              let h = '';
              if (reste != null && reste > 0) {
                h += '<b>Il vous reste ' + fmt(reste) + ' commande' + (reste > 1 ? 's' : '')
                  + ' pour tenir votre objectif.</b> ';
              } else if (reste != null) {
                h += '<b>Objectif atteint, et dépassé de ' + fmt(Math.abs(reste)) + '.</b> ';
              }
              if (fort) {
                h += (h ? '' : '<b>') + 'Sur le réseau, le ' + fort + ' est le jour qui signe le plus'
                  + (h ? '' : '.</b>') + ' — un rendez-vous posé ce jour-là ne vaut pas un rendez-vous '
                  + 'posé un autre jour.';
              }
              return h || 'Pas encore assez de commandes ce mois-ci pour dégager une tendance.';
            },
            table: () => ''
          }
        },
        titre: 'Commandes du mois',
        ctx: 'Commandes gagnées, grands comptes exclus, rattachées à leur mois de création dans BACS.',
        trouve: () => {
          const j = (det.jours || []).slice().sort((a, b) => num(b.n) - num(a.n));
          if (!j.length) return 'Pas encore assez de commandes sur l’année pour dégager un rythme hebdomadaire.';
          const fort = j[0], faible = j[j.length - 1];
          const rap = num(faible.n) > 0 ? (num(fort.n) / num(faible.n)).toFixed(1).replace('.', ',') : '—';
          const tot = j.reduce((a, x) => a + num(x.n), 0);
          return '<b>Un ' + (JOURS_NOM[fort.dow] || '?').toLowerCase() + ' vaut ' + rap + ' '
            + (JOURS_NOM[faible.dow] || '?').toLowerCase() + '.</b> Sur les ' + fmt(tot)
            + ' commandes de l’année, ' + fmt(fort.n) + ' ont été signées un '
            + (JOURS_NOM[fort.dow] || '?').toLowerCase() + ', soit ' + pct(fort.n, tot)
            + ' % de la semaine à elles seules. Le renfort de ce jour-là cesse d’être une '
            + 'question de ressenti.';
        },
        table: () => {
          const j = (det.jours || []);
          if (!j.length) return '';
          const mx = Math.max.apply(null, j.map(x => num(x.n)));
          return tableau(['Jour', 'Commandes', 'Poids'], j.map(x => [
            JOURS_NOM[x.dow] || x.dow,
            { h: '<span class="f">' + fmt(x.n) + '</span>' },
            { h: '<span style="display:inline-block;height:9px;border-radius:5px;width:'
                 + Math.round(num(x.n) / mx * 100) + '%;background:'
                 + (num(x.n) === mx ? 'var(--m-orange)' : 'var(--m-bleu)') + '"></span>',
              cls: 'g' }
          ]));
        }
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
      T.push({
        fam: 'act', id: 'rapports', lab: 'Rapports vendeurs', v: fmt(ac.rapports), statique: true,
        obj: 'sur 30 jours',
        c: (num(ac.rapports) / 30).toFixed(1).replace('.', ',') + ' par jour',
        sens: num(ac.rapports) > 0 ? 'hausse' : 'plat',
        titre: 'Activité commerciale tracée',
        ctx: 'Comptes rendus d’échange saisis par les vendeurs.',
        trouve: () => '<b>C’est la source d’activité la mieux tenue.</b> '
          + (num(ac.rapports) / 30).toFixed(0) + ' comptes rendus par jour, sans trou. À l’inverse '
          + 'des rendez-vous et des canaux de contact, les vendeurs la remplissent. C’est donc sur '
          + 'elle qu’un indicateur de pression commerciale peut s’appuyer dès maintenant.',
        table: () => ''
      });

      T.push({
        fam: 'act', id: 'rdv', lab: 'Rendez-vous à venir', v: fmt(ac.rdv_a_venir), statique: true,
        obj: fmt(ac.rdv_tenus) + ' tenus sur 30 jours',
        c: num(ac.rdv_soldes) === 0 ? 'aucun soldé' : fmt(ac.rdv_soldes) + ' soldés',
        sens: num(ac.rdv_soldes) === 0 ? 'baisse' : 'plat',
        titre: 'Rendez-vous clients',
        ctx: 'Rendez-vous planifiés dans One Data.',
        trouve: () => num(ac.rdv_soldes) === 0
          ? '<b>' + fmt(ac.rdv_tenus) + ' rendez-vous se sont tenus en trente jours et pas un seul '
            + 'n’a été soldé.</b> Le résultat de rendez-vous n’est jamais saisi : impossible '
            + 'aujourd’hui de calculer une transformation rendez-vous vers vente, ni de savoir qui '
            + 'n’est pas venu. Un champ obligatoire à la clôture réglerait ça.'
          : fmt(ac.rdv_soldes) + ' rendez-vous sur ' + fmt(ac.rdv_tenus) + ' ont été soldés, soit '
            + pct(ac.rdv_soldes, ac.rdv_tenus) + ' %.',
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

      T.push({
        fam: 'leads', id: 'delai', lab: 'Premier contact',
        v: ld.delai_median_h == null ? '—' : String(ld.delai_median_h).replace('.', ','), unite: 'h',
        statique: true, obj: 'délai médian',
        c: num(ld.delai_median_h) > 1 ? 'la norme est sous 1 h' : 'dans la norme',
        sens: num(ld.delai_median_h) > 1 ? 'baisse' : 'hausse',
        vues: {
          vendeur: {
            titre: 'Les plus anciens d’abord',
            ctx: 'Vos leads en attente, classés par ancienneté. Ceux du haut sont ceux dont la '
               + 'probabilité de réponse est la plus basse — et donc ceux à traiter en premier '
               + 'ou à classer.',
            liste: 'leads_jamais', cols: colsLeads,
            table: () => '',
            trouve: () => '<b>La première heure décide.</b> Passé ce délai, la probabilité de '
              + 'joindre un prospect s’effondre, et le concurrent a rappelé. Le délai médian sur '
              + 'votre périmètre est de ' + String(ld.delai_median_h).replace('.', ',') + ' heures : '
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
        // ce qui est engagé et ce qui traîne, pas les commandes de la matinée.
        r = [
          { n: fmt(pi.dossiers), l: 'dossiers<br>au pipe' },
          { n: fmt(pi.froides), l: 'affaires<br>froides' },
          { n: fmt(lv.retard), l: 'livraisons<br>en retard' },
          { n: fmt(lv.a_cloturer), l: 'dossiers<br>à clôturer' }
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
        return '<section class="dfam" data-fam="' + f.k + '">'
          + '<h2><span class="detat ' + f.etat + '"></span>' + esc(f.t)
          + ' <span class="cn">' + esc(f.n) + '</span></h2>'
          + '<div class="dgrille">' + ts.map(carte).join('') + '</div></section>';
      }).join('');

      r.innerHTML = '<div class="dw">'
        + '<div class="drail"><h1>' + esc(TITRE_ROLE[familleRole()] || 'Le tableau du jour') + '</h1>'
        + '<span class="dt">' + esc(dateLongue()) + '</span>'
        + '<span class="dportee">' + esc(state.sel.label) + '</span>'
        + '<span class="drole">' + esc(ETIQ_ROLE[familleRole()] || '') + '</span></div>'
        // Le périmètre est un tableau : il a sa place en pleine largeur, pas
        // dans le rail du titre.
        + selecteurPerimetre()
        + '<section class="dband"><div class="d"><div class="q">La météo du jour</div>'
        + '<p>' + phraseDuJour() + '</p></div>'
        + '<div class="dpouls">' + pouls() + '</div></section>'
        + '<div id="dash-fams" style="display:flex;flex-direction:column;gap:18px">' + fams + '</div>'
        + '<div id="dash-tiroir"></div><div id="dash-ancre"></div>'
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
            rendre(); if (state.ouvert) basculer(state.ouvert);
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
        const d = await charger();
        if (mien !== jeton) return;            // un autre changement est passé devant
        // Périmètre ou mois changé : tout ce qui en dépend est périmé.
        CACHE_LISTES = {}; CACHE_EQUIPE = null; CACHE_SOURCES = null;
        state.d = d;
        // L'arbre chiffre le sélecteur de périmètre : il se charge avec la page,
        // sans la retarder — le tableau s'affiche d'abord sans ses colonnes.
        chargerArbre().then(j => { state.arbre = j; rendre(); if (state.ouvert) basculer(state.ouvert); })
                      .catch(() => { });
        TUILES = tuiles();
        state.ouvert = null;
        rendre();
        const cible = TUILES.some(t => t.id === memoire) ? memoire : tuileParDefaut();
        if (cible) basculer(cible);
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

    function selecteurPerimetre() {
      const per = (state.d.perimetre || []);
      if (per.length < 2) return '';
      const marques = arbrePerimetre();
      const sel = state.sel;
      const estSel = (lv, k) => sel.level === lv && String(sel.key == null ? '' : sel.key) === String(k);

      // Les chiffres du tableau viennent de l'arbre, chargé en même temps que la
      // page. Tant qu'il n'est pas là, les colonnes restent vides plutôt que de
      // faire attendre le sélecteur.
      const parSite = {};
      (((state.arbre || {}).sites) || []).forEach(x => { parSite[String(x.id_site)] = x; });
      const agg = (lv, k) => {
        const l = lv === 'all' ? per
          : lv === 'reseau' ? per.filter(x => (x.reseau || '__sans') === k)
          : lv === 'affaire' ? per.filter(x => (x.affaire || '__sans') === k)
          : per.filter(x => String(x.id_site) === String(k));
        return somme(l.map(x => parSite[String(x.id_site)]).filter(Boolean));
      };

      const cel = (a, cle, cls) => ({ h: state.arbre
        ? '<span class="f' + (cls || '') + '">' + fmt(a[cle]) + '</span>' : '' });

      const ligne = (lv, k, lab, niveau, pliable, ouvert, sfx) => {
        const a = agg(lv, k);
        const obj = num(a.obj_cdes) > 0
          ? '<span class="pale"> / ' + fmt(a.obj_cdes) + '</span>' : '';
        return '<tr class="lv' + niveau + (estSel(lv, k) ? ' actif' : '')
          + (state.arbre && num(a.cdes) === 0 ? ' dmuet' : '') + '"'
          + ' data-lv="' + esc(lv) + '" data-k="' + esc(k == null ? '' : k) + '"'
          + ' data-lab="' + esc(lab) + '"'
          + (pliable ? ' data-pli="' + esc(lv + ':' + k) + '"' : '') + '>'
          + '<td>' + (pliable ? '<span class="pli" data-role="pli">' + (ouvert ? '▾' : '▸') + '</span>'
                              : '<span class="pli"></span>')
          + esc(lab) + (sfx || '') + '</td>'
          + '<td>' + (state.arbre ? '<span class="f">' + fmt(a.cdes) + '</span>' + obj : '') + '</td>'
          + '<td>' + cel(a, 'a_relancer').h + '</td>'
          + '<td>' + (state.arbre ? '<span class="f' + (num(a.retard) > 0 ? ' mauvais' : '')
                                    + '">' + fmt(a.retard) + '</span>' : '') + '</td>'
          + '</tr>';
      };

      let lignes = ligne('all', '', 'Tout mon périmètre', 1, false, false, '');
      marques.forEach(m => {
        const pk = 'reseau:' + m.k, ouv = state.plis[pk] !== false;
        lignes += ligne('reseau', m.k, m.lab, 1, true, ouv, '');
        if (!ouv) return;
        m.aff.forEach(a => {
          const ak = 'affaire:' + a.k, aouv = state.plis[ak] === true;
          lignes += ligne('affaire', a.k, a.lab, 2, true, aouv, '');
          if (!aouv) return;
          a.sites.forEach(x => {
            lignes += ligne('site', x.id_site, x.nom, 3, false, false,
              x.type_site && x.type_site !== 'vente'
                ? ' <em class="pale">' + esc(x.type_site) + '</em>' : '');
          });
        });
      });

      return '<div class="dperim"><div class="dperim-h">Périmètre'
        + '<span class="cn">' + per.length + ' sites · ' + marques.length + ' marque'
        + (marques.length > 1 ? 's' : '') + ' · cliquez une ligne pour filtrer, le chevron pour déplier</span></div>'
        + '<div class="dscroll"><table class="dmini dperimt"><thead><tr>'
        + '<th>Périmètre</th><th>Commandes</th><th>À relancer</th><th>Retards</th>'
        + '</tr></thead><tbody>' + lignes + '</tbody></table></div></div>';
    }

    function dateLongue() {
      const j = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
      const m = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août',
                 'septembre', 'octobre', 'novembre', 'décembre'];
      const d = new Date();
      return j[d.getDay()] + ' ' + d.getDate() + ' ' + m[d.getMonth()]
        + ' · ' + m[state.mois - 1] + ' en cours';
    }

    function basculer(id) {
      if (state.ouvert === id) { fermer(); return; }
      const t = TUILES.find(x => x.id === id);
      if (!t) return;
      state.ouvert = id;
      const r = getRoot();
      r.querySelectorAll('.dtuile').forEach(b =>
        b.setAttribute('aria-expanded', String(b.getAttribute('data-id') === id)));
      const zone = r.querySelector('#dash-tiroir');
      const hote = r.querySelector('.dtuile[data-id="' + id + '"]').closest('.dfam');
      hote.appendChild(zone);

      // Tout ce qui s'affiche ici passe par vue() : la même tuile ne raconte pas
      // la même chose à un vendeur et à son chef.
      const titre = vue(t, 'titre'), ctx = vue(t, 'ctx');
      const fTrouve = vue(t, 'trouve'), fTable = vue(t, 'table');
      const bloc = vue(t, 'liste'), fCols = vue(t, 'cols');
      const arbre = vue(t, 'arbre'), equipe = vue(t, 'equipe'), sources = vue(t, 'sources');
      let trouve = '', table = '';
      try { trouve = fTrouve ? fTrouve() : ''; } catch (e) { console.error('[dash] trouvaille', id, e); }
      try { table = fTable ? fTable() : ''; } catch (e) { console.error('[dash] table', id, e); }

      zone.innerHTML = '<section class="dtiroir"><div style="min-width:0">'
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
      zone.querySelector('.dferme').addEventListener('click', fermer);
      try { zone.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) { }

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
              fermer(); basculer(id);       // le dépli se redessine avec le nouveau pli
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
      if (a && z) a.parentNode.insertBefore(z, a);
    }

    // =========================================================================
    //  DÉMARRAGE
    // =========================================================================
    getRoot().innerHTML = '<div class="dvide">Chargement du tableau de bord…</div>';
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
    TUILES = tuiles();
    rendre();
    chargerArbre().then(j => { state.arbre = j; rendre(); if (state.ouvert) basculer(state.ouvert); })
                  .catch(() => { });
    // Une tuile est ouverte d'entrée : la page montre à quoi sert le clic sans
    // qu'on ait à le deviner. Le financement si son taux a reculé, sinon les
    // commandes.
    const ouvrable = tuileParDefaut();
    if (ouvrable) basculer(ouvrable);
    // Le bus peut arriver après le module : on se branche une fois la page
    // posée, et il recalera le site lui-même s'il en porte déjà un.
    brancherBus();
  }
});
