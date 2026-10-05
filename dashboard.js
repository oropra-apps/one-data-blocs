// ============================================================================
//  DASHBOARD — module One Data (OD.define)   v50 — PROFIL TEAM COLIN
//
//  v50 : « Jamais contactés » suit la définition du lead management : leads
//  attribués, ouverts, sans premier contact, reçus depuis moins de 30 jours,
//  fiches anonymisées écartées (dash_refresh_vendeur_etat, dash_refresh_site,
//  dashboard_tc_liste). Chaque ligne a un bouton « Ouvrir » qui ouvre le lead
//  dans la page Lead management.
//
//  v49 : l'opérateur du plateau VROOM (rôle 10) a SA page — la piscine BACS,
//  sa journée, l'activité du plateau sur 14 et 30 jours, ce que deviennent
//  les transferts, les opérateurs — au lieu de celle d'un vendeur
//  (plateau_tableau, teamcolin_poste_site.sql). Chiffres en Nunito Sans
//  tabulaire, comme le veut la charte : plus de police à chasse fixe.
//
//  REFONTE : LA PAGE NE CALCULE PLUS RIEN, ELLE LIT
//
//  Les versions précédentes recalculaient tout à chaque ouverture : douze mois
//  de commandes, le stock, l'entonnoir, le pipe, les leads, agrégés à la volée
//  sur 160 000 lignes. Même ramené à un seul appel, cela coûtait une seconde à
//  chaud et près de trois à froid, et le message « chargement en cours »
//  s'installait. Sur la page d'accueil, c'est inacceptable.
//
//  Tout est désormais PRÉCALCULÉ en base, dans deux tables tenues à jour toutes
//  les deux minutes par un job :
//
//    dash_vendeur_mois   une ligne par vendeur, par site et par mois.
//                        Commandes, financements, objectifs, livraisons, pipe,
//                        leads attribués, rendez-vous. ~950 lignes.
//    dash_site_mois      une ligne par site : stock VN/VO, entonnoir des
//                        commandes, leads du site, délais par tranche, sources.
//
//  La page fait UN appel — dash_lire(annee, mois) — qui ne fait que filtrer ces
//  lignes au périmètre et à l'effectif visible de l'utilisateur. 58 ms pour un
//  directeur de groupe, 27 ms pour un chef des ventes, là où le socle mettait
//  1 100 ms. Le reste se passe en mémoire : changer de marque, d'affaire ou de
//  site ne déclenche plus aucune requête, puisque le détail par vendeur et par
//  site est déjà là. C'est la méthode du suivi d'activité, poussée d'un cran.
//
//  Règle de construction, héritée du socle et maintenue : les tables ne portent
//  AUCUN taux ni médiane, qui ne s'additionnent pas. Elles portent les
//  numérateurs et les dénominateurs, et les divisions se font ici, après la
//  somme.
//
//  QUATRE PAGES, PAS UNE PAGE FILTRÉE
//
//  La différence entre rôles ne tient pas au nombre de tuiles mais au NIVEAU
//  D'AGRÉGATION : le vendeur voit ses lignes, le chef voit ses vendeurs nommés,
//  la direction voit ses entités nommées.
//
//    VENDEUR    « qui j'appelle aujourd'hui ? »
//               Ses commandes contre son objectif, ses leads jamais contactés
//               le plus ancien en tête, ses affaires sorties de la fenêtre de
//               relance, ses livraisons, ses commandes sans financement.
//               Chaque dépli est une liste nominative avec le téléphone.
//
//    CHEF       « qui décroche, et sur quoi ? »
//               Les mêmes sujets, mais le dépli NOMME le vendeur en retard, et
//               le constat dit lequel aller voir. Plus le stock dormant de ses
//               sites, qui est son levier.
//
//    DIRECTION  « quelle entité décroche, et de combien ? »
//               Commandes contre objectif par affaire, argent engagé non soldé,
//               dossiers bloqués en approbation, stock dormant en millions,
//               pénétration du financement et écart entre affaires.
//
//    MARKETING  « d'où viennent les leads et pourquoi se perdent-ils ? »
//               Reçus, jamais contactés, tranche de délai de premier contact,
//               taux de perte par source, non attribués.
//
//  L'ORDRE D'AFFICHAGE
//  Le cadre, le titre et les tuiles sont posés AVANT le premier appel, vides.
//  La page ne reste jamais blanche en attendant la base ; elle se remplit.
//
//  Prérequis SQL : dash_vendeur_mois, dash_site_mois, dash_lire,
//  dash_refresh_tout + job pg_cron « dash_refresh » (toutes les 2 minutes).
//  Les listes nominatives du vendeur restent servies à la demande par
//  dashboard_tc_liste, et seulement au clic.
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

    // =========================================================================
    //  CHARTE
    // =========================================================================
    const CSS = `
#dash-root{--bleu:#2a5ea9;--bleu-clair:#acc5e4;--vert:#53bda7;--orange:#fac055;--rouge:#d97070;
  --m-vert:#00997f;--m-orange:#d2941f;--m-bleu:#3f7cba;--m-rouge:#c0524f;
  --ground:#f4f7fb;--card:#fff;--line:#e3e9f3;--line-2:#cfd9e9;
  --ink:#1c2b45;--ink-2:#5a6b86;--ink-3:#8b99b0;
  --ok-bg:#e4f4f0;--alerte-bg:#fdf3de;--chaud-bg:#fbeceb;--calme-bg:#eef2f8;
  --ombre:0 1px 2px rgba(28,43,69,.05),0 8px 24px rgba(28,43,69,.06);
  --ui:"Nunito Sans",system-ui,-apple-system,sans-serif;
  --mono:"Nunito Sans",system-ui,-apple-system,sans-serif;
  font-family:var(--ui);color:var(--ink);background:var(--ground);font-variant-numeric:tabular-nums;
  display:block;width:100%;padding:18px 16px 40px;box-sizing:border-box}
#dash-root *{box-sizing:border-box}
#dash-root .dw{max-width:1180px;margin:0 auto;display:flex;flex-direction:column;gap:16px}
#dash-root .drail{display:flex;flex-wrap:wrap;align-items:center;gap:10px 14px}
#dash-root .drail h1{font-size:19px;font-weight:800;letter-spacing:-.015em;margin:0}
#dash-root .drail .dt{font-family:var(--mono);font-size:11.5px;color:var(--ink-3)}
#dash-root .drole{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;
  color:var(--ink-3);background:var(--calme-bg);border-radius:20px;padding:5px 11px}
#dash-root .dmois{display:inline-flex;gap:2px;background:var(--calme-bg);border-radius:9px;padding:2px;
  margin-left:auto}
#dash-root .dmois button{background:none;border:0;font:inherit;font-size:11.5px;font-weight:700;
  color:var(--ink-3);padding:4px 10px;border-radius:7px;cursor:pointer;text-transform:capitalize}
#dash-root .dmois button:hover{color:var(--ink)}
#dash-root .dmois button[aria-pressed="true"]{background:var(--card);color:var(--ink);
  box-shadow:0 1px 2px rgba(28,43,69,.08)}
#dash-root .dband{background:var(--card);border:1px solid var(--line);border-radius:14px;
  box-shadow:var(--ombre);padding:17px 20px;display:flex;flex-wrap:wrap;gap:16px 30px;align-items:center;
  min-height:86px}
#dash-root .dband .q{font-size:10.5px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--ink-3)}
#dash-root .dband .d{flex:1 1 320px;min-width:0}
#dash-root .dband p{margin:6px 0 0;font-size:16px;line-height:1.45;max-width:62ch}
#dash-root .dband b{font-weight:800}
#dash-root .dpouls{display:flex;gap:20px;flex-wrap:wrap}
#dash-root .dpouls div{min-width:66px}
#dash-root .dpouls .n{font-family:var(--mono);font-size:22px;font-weight:600;line-height:1;font-variant-numeric:tabular-nums}
#dash-root .dpouls .l{font-size:10px;color:var(--ink-3);margin-top:5px;line-height:1.25}
#dash-root .dcorps{display:grid;grid-template-columns:minmax(0,1fr) 268px;gap:16px;align-items:start}
@media (max-width:900px){#dash-root .dcorps{grid-template-columns:minmax(0,1fr)}}
#dash-root .dfams{display:grid;grid-template-columns:repeat(auto-fill,minmax(164px,1fr));
  gap:18px 10px;align-items:start}
#dash-root .dfam{display:flex;flex-direction:column;gap:7px;min-width:0}
#dash-root .dfam > h2{font-size:11px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;
  color:var(--ink-2);margin:0;height:16px;display:flex;align-items:center;gap:8px;
  white-space:nowrap;overflow:hidden}
#dash-root .dfam > h2 .tt{overflow:hidden;text-overflow:ellipsis;min-width:0;flex:0 1 auto}
#dash-root .dgrille{display:grid;grid-template-columns:repeat(auto-fill,minmax(152px,1fr));gap:10px}
#dash-root .dtuile{position:relative;text-align:left;font:inherit;color:var(--ink);cursor:pointer;
  background:var(--card);border:1px solid var(--line);border-radius:13px;padding:11px 13px 9px;
  box-shadow:var(--ombre);display:flex;flex-direction:column;min-width:0;min-height:84px;
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
#dash-root .dtuile .pl{position:absolute;top:10px;right:10px;width:16px;height:16px;border-radius:50%;
  background:var(--calme-bg);color:var(--ink-3);font-size:11.5px;font-weight:800;line-height:16px;text-align:center}
#dash-root .dtuile[aria-expanded="true"] .pl{background:var(--bleu);color:#fff}
#dash-root .dtuile.sq .v,#dash-root .dtuile.sq .lab{color:transparent;background:var(--calme-bg);
  border-radius:5px;display:block}
#dash-root .dtuile.sq{pointer-events:none}
#dash-root .hausse{color:var(--m-vert)}#dash-root .baisse{color:var(--m-rouge)}#dash-root .plat{color:var(--ink-3)}
#dash-root #dash-tiroir{grid-column:1/-1}
#dash-root #dash-tiroir:empty{display:none}
#dash-root .dtiroir{position:relative;background:var(--card);border:1px solid var(--bleu);border-radius:14px;
  box-shadow:var(--ombre);padding:20px 22px;display:grid;
  grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:24px}
@media (max-width:820px){#dash-root .dtiroir{grid-template-columns:minmax(0,1fr)}}
#dash-root .dtiroir h3{font-size:16px;font-weight:800;margin:0 0 3px;letter-spacing:-.01em;padding-right:34px}
#dash-root .dtiroir .ctx{font-size:12.5px;color:var(--ink-2);margin:0 0 14px}
#dash-root .dtrouve{background:var(--alerte-bg);border-radius:11px;padding:14px 16px;font-size:13.5px;line-height:1.5}
#dash-root .dtrouve .t{font-size:10.5px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;
  color:var(--ink-3);margin-bottom:6px}
#dash-root .dtrouve b{font-weight:800}
#dash-root table.dmini{width:100%;border-collapse:collapse;font-size:12.5px;margin-top:4px;min-width:330px}
#dash-root table.dmini th{font-size:9.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;
  color:var(--ink-3);text-align:right;padding:0 7px 6px;white-space:nowrap}
#dash-root table.dmini th:first-child{text-align:left}
#dash-root table.dmini td{padding:5px 7px;border-top:1px solid var(--line);text-align:right;
  font-variant-numeric:tabular-nums;white-space:nowrap}
#dash-root table.dmini td:first-child{text-align:left;white-space:normal}
#dash-root table.dmini .f{font-family:var(--mono);font-weight:600}
#dash-root table.dmini .pale{color:var(--ink-3)}
#dash-root table.dmini .mauvais{color:var(--m-rouge)}
#dash-root table.dmini td.coupe{max-width:230px;overflow:hidden;text-overflow:ellipsis;
  white-space:nowrap;text-align:left}
#dash-root .dscroll{overflow-x:auto;-webkit-overflow-scrolling:touch;position:relative;
  max-width:100%;max-height:336px;overflow-y:auto;overscroll-behavior-x:contain}
#dash-root .dscroll table.dmini th:first-child,
#dash-root .dscroll table.dmini td:first-child{position:sticky;left:0;z-index:2;
  background:var(--card);border-right:1px solid var(--line)}
#dash-root .dscroll table.dmini thead th:first-child{z-index:3}
#dash-root .dtel{font-family:var(--mono);font-weight:600;color:var(--m-bleu);
  text-decoration:none;border-bottom:1px solid transparent}
#dash-root .dtel:hover{border-bottom-color:currentColor}
#dash-root .dnote{font-size:11.5px;color:var(--ink-3);margin-top:8px;line-height:1.5}
#dash-root .dperim{background:var(--card);border:1px solid var(--line);
  border-radius:11px;box-shadow:var(--ombre);overflow:hidden;position:sticky;top:12px}
#dash-root .dperim-h{display:flex;align-items:baseline;gap:10px;padding:10px 14px 6px;
  font-size:12px;font-weight:800;letter-spacing:.02em;color:var(--ink)}
#dash-root .dperim-h .cn{font-size:10.5px;font-weight:600;color:var(--ink-3);letter-spacing:0}
#dash-root .dperim .dscroll{max-height:420px;overflow-y:auto}
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
#dash-root .dferme.dx{position:absolute;top:9px;right:11px;margin:0;text-decoration:none;
  width:26px;height:26px;border-radius:50%;font-size:18px;line-height:24px;text-align:center;
  color:var(--ink-3);background:var(--calme-bg)}
#dash-root .dferme.dx:hover{color:var(--ink);background:var(--line)}
#dash-root .dpied{font-size:11.5px;color:var(--ink-3);line-height:1.6;max-width:84ch}
#dash-root .davis{background:var(--alerte-bg);border-radius:10px;padding:10px 14px;
  font-size:12.5px;line-height:1.5;color:var(--ink-2)}
#dash-root .dvide{padding:22px;color:var(--ink-2);font-size:14px}
#dash-root .dlead{font:inherit;font-size:12px;font-weight:700;color:#fff;background:var(--bleu);border:0;border-radius:8px;padding:5px 11px;cursor:pointer;white-space:nowrap}
#dash-root .dlead:hover{background:#1F4A85}
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
    const FINE = ' ';
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
    const MOIS_LONG = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet',
                       'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    const MOIS_COURT = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin',
                        'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'];

    // =========================================================================
    //  ÉTAT
    // =========================================================================
    const today = new Date();
    const state = {
      annee: today.getFullYear(), mois: today.getMonth() + 1,
      j: null,          // la réponse brute de dash_lire
      A: null,          // l'agrégat du périmètre courant
      ouvert: null, plis: {}, busSiteVu: null, chargement: false,
      sel: { level: 'all', key: null, label: 'Tout mon périmètre' },
      erreur: null, listes: {}, avisRepli: null
    };

    function estMoisEnCours() {
      const d = new Date();
      return state.annee === d.getFullYear() && state.mois === d.getMonth() + 1;
    }

    // Les sites couverts par la sélection. null = tout le périmètre.
    function sitesSelection() {
      const per = ((state.j || {}).perimetre || []);
      const s = state.sel;
      if (!s || s.level === 'all') return null;
      if (s.level === 'reseau')
        return per.filter(x => (x.reseau || '__sans') === s.key).map(x => Number(x.id_site));
      if (s.level === 'affaire')
        return per.filter(x => (x.affaire || '__sans') === s.key).map(x => Number(x.id_site));
      if (s.level === 'site') return [Number(s.key)];
      return null;
    }
    function siteSelection() {
      return (state.sel && state.sel.level === 'site') ? Number(state.sel.key) : null;
    }
    function poserSite(id) {
      const per = ((state.j || {}).perimetre || []);
      const s = per.find(x => Number(x.id_site) === Number(id));
      state.sel = { level: 'site', key: Number(id),
                    label: (s && s.nom) || ('Site ' + id) };
    }

    // --- bus de site ---------------------------------------------------------
    function siteBus() {
      try { const w = wwLib.getFrontWindow(); if (w && w.oropraSite) return w.oropraSite; } catch (e) { }
      return window.oropraSite || null;
    }
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
    function brancherBus(essais) {
      essais = essais || 0;
      const b = siteBus();
      if (!b) { if (essais < 120) setTimeout(() => brancherBus(essais + 1), 250); return; }
      try {
        const id = b.getSiteId ? b.getSiteId() : null;
        if (id != null) {
          state.busSiteVu = Number(id);
          if (String(id) !== String(siteSelection())) { poserSite(Number(id)); rendre(); }
        }
      } catch (e) { }
      if (window.__dashTcBusBound) return;
      window.__dashTcBusBound = true;
      // La barre du haut ne porte qu'un SITE : elle n'impose un périmètre que
      // lorsqu'elle change réellement de site. Sans cette mémoire, choisir
      // « Tout mon périmètre » ici était aussitôt annulé par le bus, qui
      // réémettait le site qu'il portait toujours.
      b.onChange(d => {
        const id = d && d.siteId != null ? Number(d.siteId) : null;
        if (id == null) return;
        if (state.busSiteVu != null && id === state.busSiteVu) return;
        state.busSiteVu = id;
        if (String(id) === String(siteSelection())) return;
        poserSite(id);
        rendre();
      });
    }
    function pousserAuBus(id) {
      try {
        const b = siteBus();
        if (b && typeof b.setSiteId === 'function' && id != null) {
          state.busSiteVu = Number(id);
          b.setSiteId(Number(id));
        }
      } catch (e) { }
    }

    // =========================================================================
    //  LA DONNÉE : UN SEUL APPEL, MIS EN CACHE PAR MOIS
    //
    //  dash_lire ne calcule rien : elle lit deux tables de précalcul et les
    //  borne au périmètre et à l'effectif visible. Tout le détail par vendeur
    //  et par site arrive d'un coup, et le filtrage par périmètre se fait
    //  ensuite ici, sans réseau.
    //
    //  Verrou anti-doublon repris du suivi d'activité : si un appel est déjà
    //  en vol pour le même mois, on rend sa promesse.
    // =========================================================================
    const CACHE = {};
    let EN_VOL = { cle: null, p: null };

    async function lireBase() {
      const cle = state.annee + '|' + state.mois;
      if (CACHE[cle]) return CACHE[cle];
      if (EN_VOL.p && EN_VOL.cle === cle) return EN_VOL.p;
      const p = (async () => {
        const jwt = await getUserJwt();
        if (!jwt) throw new Error('session absente');
        const res = await fetch(SUPABASE_URL + '/rest/v1/rpc/dash_lire', {
          method: 'POST',
          headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + jwt,
                     'Content-Type': 'application/json' },
          body: JSON.stringify({ p_annee: state.annee, p_mois: state.mois })
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const j = await res.json();
        CACHE[cle] = j;
        return j;
      })();
      EN_VOL = { cle: cle, p: p };
      try { return await p; }
      finally { if (EN_VOL.cle === cle) EN_VOL = { cle: null, p: null }; }
    }

    // =========================================================================
    //  AGRÉGATION — en mémoire, selon le périmètre choisi
    //
    //  Aucun taux n'est sommé : on somme les numérateurs et les dénominateurs,
    //  puis on divise. Les vendeurs présents sur plusieurs sites du périmètre
    //  sont regroupés sur une seule ligne nominative.
    // =========================================================================
    // Deux horizons, et c'est voulu : la PRODUCTION suit le mois choisi, l'ÉTAT
    // DU JOUR — livraisons, pipe, leads, rendez-vous — reste celui
    // d'aujourd'hui. Un pipe « de septembre » n'existe pas : il n'y a que le
    // pipe de maintenant. Les deux jeux de colonnes sont disjoints, donc les
    // deux sources se somment sans jamais se recouvrir.
    const CH_PROD = ['cdes','loueurs','hors_loueurs','fi','loa','roole','reprise','phev','vu','acc',
      'obj_cdes','obj_fi'];
    const CH_ETAT = ['livr_attente','livr_montant','livr_retard','livr_semaine','livr_mois30',
      'livr_plus_tard','livr_a_cloturer','pipe_affaires','pipe_fraiches','pipe_a_relancer',
      'pipe_froides','pv_dossiers','pv_montant','pv_recents','leads_attribues','leads_jamais',
      'leads_jamais_48h','rdv_a_venir','rdv_tenus','rdv_soldes','rapports','cdes_jour','devis_jour'];
    const CH_V = CH_PROD.concat(CH_ETAT);
    const CH_S = ['vn_n','vn_valeur','vn_90','vn_180','vn_age_somme','vn_age_n','vn_dormant',
      'vn_reserve','vo_n','vo_valeur','vo_90','vo_180','vo_age_somme','vo_age_n','vo_dormant',
      'ent_prep_n','ent_prep_m','ent_appro_n','ent_appro_m','ent_trans_n','ent_trans_m',
      'ent_refus_n','ent_refus_m','leads_recus_30j','leads_non_attribues','leads_jamais',
      'leads_perdus','leads_resolus','leads_contactes','leads_total',
      'd_15min','d_30min','d_60min','d_4h','d_24h','d_plus','delai_n'];

    function vide(champs) { const o = {}; champs.forEach(c => o[c] = 0); return o; }
    function ajouter(o, l, champs) { champs.forEach(c => o[c] += num(l[c])); return o; }

    function agreger(j, ids) {
      const dans = ids ? new Set(ids.map(Number)) : null;
      const okSite = s => !dans || dans.has(Number(s));

      const A = { prod: vide(CH_V), stock: vide(CH_S), vendeurs: [], sites: [], serie: [],
                  lignes: [], etats: [], sources: {}, perimetre: (j.perimetre || []),
                  role: num(j.role), moi: num(j.moi), maj: j.maj };

      // --- vendeurs : somme et regroupement nominatif
      const parUser = new Map();
      const prendreUser = l => {
        const k = String(l.id_user);
        let v = parUser.get(k);
        if (!v) { v = vide(CH_V); v.id_user = l.id_user; v.nom = l.nom;
                  v.leads_plus_vieux_h = 0; parUser.set(k, v); }
        if (!v.nom && l.nom) v.nom = l.nom;
        return v;
      };
      (j.vendeurs || []).forEach(l => {           // production du mois choisi
        if (!okSite(l.id_site)) return;
        A.lignes.push(l);
        ajouter(A.prod, l, CH_PROD);
        ajouter(prendreUser(l), l, CH_PROD);
      });
      (j.etat || []).forEach(l => {               // état du jour
        if (!okSite(l.id_site)) return;
        A.etats.push(l);
        ajouter(A.prod, l, CH_ETAT);
        const v = prendreUser(l);
        ajouter(v, l, CH_ETAT);
        v.leads_plus_vieux_h = Math.max(v.leads_plus_vieux_h, num(l.leads_plus_vieux_h));
      });
      A.vendeurs = Array.from(parUser.values());

      // --- sites : stock, entonnoir, leads
      const nomSite = {};
      (j.perimetre || []).forEach(p => nomSite[String(p.id_site)] = p);
      (j.sites || []).forEach(l => {
        if (!okSite(l.id_site)) return;
        ajouter(A.stock, l, CH_S);
        const p = nomSite[String(l.id_site)] || {};
        const s = Object.assign({}, l);
        s.nom = p.nom || ('Site ' + l.id_site);
        s.affaire = p.affaire || ''; s.reseau = p.reseau || '';
        A.sites.push(s);
        (l.sources || []).forEach(x => {
          const k = x.source || '(inconnue)';
          const o = A.sources[k] || (A.sources[k] = { source: k, total: 0, perdus: 0, resolus: 0 });
          o.total += num(x.total); o.perdus += num(x.perdus); o.resolus += num(x.resolus);
        });
      });

      // --- série 12 mois
      const parMois = new Map();
      (j.serie || []).forEach(l => {
        if (!okSite(l.id_site)) return;
        let m = parMois.get(l.mois);
        if (!m) { m = { mois: l.mois, cdes: 0, hors_loueurs: 0, fi: 0, loa: 0, roole: 0,
                        reprise: 0, phev: 0, vu: 0, acc: 0, obj_cdes: 0, obj_fi: 0 };
                  parMois.set(l.mois, m); }
        ['cdes','hors_loueurs','fi','loa','roole','reprise','phev','vu','acc','obj_cdes','obj_fi']
          .forEach(c => m[c] += num(l[c]));
      });
      A.serie = Array.from(parMois.values()).sort((a, b) => a.mois < b.mois ? -1 : 1);

      // --- dérivés, calculés APRÈS la somme
      const p = A.prod, s = A.stock;
      A.taux_fi = pct(p.fi, p.hors_loueurs);
      A.taux_obj = pct(p.cdes, p.obj_cdes);
      A.stock_n = s.vn_n + s.vo_n;
      A.stock_valeur = s.vn_valeur + s.vo_valeur;
      A.stock_dormant = s.vn_dormant + s.vo_dormant;
      A.stock_90 = s.vn_90 + s.vo_90;
      A.vn_age = s.vn_age_n > 0 ? Math.round(s.vn_age_somme / s.vn_age_n) : null;
      A.vo_age = s.vo_age_n > 0 ? Math.round(s.vo_age_somme / s.vo_age_n) : null;
      A.engage = s.ent_trans_m;
      A.nb_sites = (ids ? ids.length : (j.perimetre || []).length);
      return A;
    }

    // La tranche médiane du premier contact, reconstruite à partir des
    // compteurs par tranche : on ne peut pas additionner des médianes entre
    // sites, mais on peut additionner des effectifs et retrouver où tombe le
    // milieu. La moyenne, elle, était inutilisable — des leads de 2016
    // recontactés cette année la portaient à 333 jours.
    const TRANCHES = [
      { k: 'd_15min', lab: 'moins de 15 min' },
      { k: 'd_30min', lab: 'moins de 30 min' },
      { k: 'd_60min', lab: 'moins d’une heure' },
      { k: 'd_4h',    lab: 'moins de 4 heures' },
      { k: 'd_24h',   lab: 'moins de 24 heures' },
      { k: 'd_plus',  lab: 'plus de 24 heures' }
    ];
    function delaiMedian(s) {
      const n = num(s.delai_n);
      if (!n) return null;
      let cumul = 0;
      for (const t of TRANCHES) {
        cumul += num(s[t.k]);
        if (cumul >= n / 2) return t.lab;
      }
      return null;
    }

    // L'arbre du périmètre : marque › affaire › site.
    function arbrePerimetre() {
      const per = ((state.j || {}).perimetre || []);
      const m = new Map();
      per.forEach(s => {
        const mk = s.reseau || '__sans', ak = s.affaire || '__sans';
        let M = m.get(mk);
        if (!M) { M = { k: mk, lab: s.reseau || 'Sans réseau', aff: new Map() }; m.set(mk, M); }
        let Af = M.aff.get(ak);
        if (!Af) { Af = { k: ak, lab: s.affaire || 'Sans affaire', sites: [] }; M.aff.set(ak, Af); }
        Af.sites.push(s);
      });
      return Array.from(m.values()).map(M => ({
        k: M.k, lab: M.lab,
        aff: Array.from(M.aff.values()).sort((a, b) => a.lab.localeCompare(b.lab, 'fr'))
      })).sort((a, b) => a.lab.localeCompare(b.lab, 'fr'));
    }

    function selecteurPerimetre() {
      const per = ((state.j || {}).perimetre || []);
      if (per.length < 2) return '';
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

      // Un échelon qui n'offre aucun choix n'est pas un échelon : sur un petit
      // périmètre, une marque unique ne ferait que répéter la ligne suivante.
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

    // =========================================================================
    //  LES QUATRE PAGES
    //
    //  Ce n'est pas une page filtrée : le niveau d'agrégation change avec la
    //  fonction. Le vendeur voit SES lignes, le chef voit SES VENDEURS nommés,
    //  la direction voit SES ENTITÉS nommées, le marketing voit SES SOURCES.
    // =========================================================================
    function famille() {
      const r = num((state.j || {}).role);
      // Tout rôle connu hors des rôles manager (vendeur, opérateur plateau = 10)
      // reçoit la vue vendeur. Miroir de public.role_est_manager(), 05/10/2026 :
      // avant, un rôle inconnu tombait sur la vue direction.
      if (r === 4 || (r > 0 && ![1, 2, 3, 5, 6, 7, 8, 9].includes(r))) return 'vendeur';
      if (r === 3 || r === 9) return 'chef';
      if (r === 5) return 'marketing';
      return 'direction';
    }
    const TITRES = {
      vendeur:   'Votre journée',
      chef:      'Votre équipe aujourd’hui',
      direction: 'Le tableau du groupe',
      marketing: 'Ce qui entre, ce qui se perd'
    };
    const NOM_ROLE = { 1: 'Admin', 2: 'Direction', 3: 'Chef des ventes', 4: 'Vendeur',
                       5: 'Marketing', 6: 'Directeur plaque', 7: 'Directeur marque',
                       8: 'Directeur groupe', 9: 'Secrétariat commercial',
                       10: 'Opérateur plateau' };

    // Regroupement par entité : affaire, réseau ou site. Sert aux déplis de la
    // direction — « quelle entité décroche, et de combien ».
    function parEntite(A, niveau) {
      const info = {};
      (A.perimetre || []).forEach(p => info[String(p.id_site)] = p);
      const cle = s => niveau === 'reseau' ? (s.reseau || 'Sans réseau')
                     : niveau === 'site'   ? (s.nom || ('Site ' + s.id_site))
                     :                       (s.affaire || 'Sans affaire');
      const m = new Map();
      const prendre = k => {
        let o = m.get(k);
        if (!o) { o = Object.assign({ nom: k }, vide(CH_V), vide(CH_S)); m.set(k, o); }
        return o;
      };
      A.lignes.forEach(l => ajouter(prendre(cle(info[String(l.id_site)] || {})), l, CH_PROD));
      A.etats.forEach(l => ajouter(prendre(cle(info[String(l.id_site)] || {})), l, CH_ETAT));
      A.sites.forEach(s => ajouter(prendre(cle(s)), s, CH_S));
      return Array.from(m.values());
    }

    // Les vendeurs triés sur un critère, les plus en retard d'abord.
    function classement(A, f, ordre) {
      const l = A.vendeurs.slice();
      l.sort((a, b) => (ordre === 'asc' ? 1 : -1) * (num(f(b)) - num(f(a))));
      return l;
    }

    // --- fabriques de tableaux ----------------------------------------------
    function tableau(cols, lignes, note) {
      if (!lignes.length) return '<p class="dnote">Rien à signaler sur ce périmètre.</p>';
      let h = '<div class="dscroll"><table class="dmini"><thead><tr>'
        + cols.map(c => '<th>' + esc(c.t) + '</th>').join('')
        + '</tr></thead><tbody>';
      lignes.forEach(l => {
        h += '<tr>' + cols.map((c, i) => {
          const v = c.v(l);
          return '<td class="' + (i === 0 ? 'coupe' : 'f') + (c.cl && c.cl(l) ? ' ' + c.cl(l) : '') + '">'
            + (v == null ? '<span class="pale">—</span>' : v) + '</td>';
        }).join('') + '</tr>';
      });
      h += '</tbody></table></div>';
      if (note) h += '<p class="dnote">' + note + '</p>';
      return h;
    }
    function trouvaille(txt) {
      if (!txt) return '';
      return '<div class="dtrouve"><div class="t">Ce qu’il faut en faire</div>' + txt + '</div>';
    }
    const pcts = v => v == null ? '<span class="pale">—</span>' : v + ' %';
    function ecart(a, b) {
      const d = num(a) - num(b);
      if (d === 0) return '<span class="plat">à l’objectif</span>';
      return '<span class="' + (d > 0 ? 'hausse' : 'baisse') + '">'
        + (d > 0 ? '+' : '') + fmt(d) + '</span>';
    }

    // --- la série sur douze mois, en barres ----------------------------------
    function serieHtml(A, champ, lab) {
      const s = A.serie || [];
      if (s.length < 2) return '';
      const max = Math.max.apply(null, s.map(x => num(x[champ])).concat([1]));
      let h = '<div class="dent" style="gap:6px">';
      s.forEach(x => {
        const m = Number(String(x.mois).slice(5, 7));
        const v = num(x[champ]);
        h += '<div class="dent-l" style="gap:3px"><div class="dent-h">'
          + '<b style="font-weight:600;font-size:11.5px">' + esc(MOIS_COURT[m - 1]) + '</b>'
          + '<span>' + fmt(v) + '</span></div>'
          + '<div class="dent-p" style="height:7px"><div class="dent-b" style="width:'
          + Math.round(v / max * 100) + '%;background:var(--m-bleu)"></div></div></div>';
      });
      h += '</div>';
      return '<p class="dnote" style="margin:2px 0 8px">' + esc(lab) + ' sur douze mois</p>' + h;
    }

    // --- l'entonnoir des commandes -------------------------------------------
    function entonnoirHtml(s) {
      const et = [
        { lab: 'En préparation', n: s.ent_prep_n,  m: s.ent_prep_m,  c: 'var(--m-bleu)' },
        { lab: 'En approbation',   n: s.ent_appro_n, m: s.ent_appro_m, c: 'var(--m-orange)' },
        { lab: 'Transmis, validés', n: s.ent_trans_n, m: s.ent_trans_m, c: 'var(--m-vert)' },
        { lab: 'Refusés',          n: s.ent_refus_n, m: s.ent_refus_m, c: 'var(--m-rouge)' }
      ];
      const max = Math.max.apply(null, et.map(x => num(x.n)).concat([1]));
      return '<div class="dent">' + et.map(x =>
        '<div class="dent-l"><div class="dent-h"><b>' + x.lab + '</b>'
        + '<span>' + fmt(x.n) + ' · ' + fmtEur(x.m) + '</span></div>'
        + '<div class="dent-p"><div class="dent-b" style="width:'
        + Math.round(num(x.n) / max * 100) + '%;background:' + x.c + '"></div></div></div>'
      ).join('') + '</div>';
    }

    // =========================================================================
    //  LES TUILES
    // =========================================================================
    function tuiles() {
      const f = famille();
      if (f === 'vendeur')   return TUILES_VENDEUR;
      if (f === 'chef')      return TUILES_CHEF;
      if (f === 'marketing') return TUILES_MARKETING;
      return TUILES_DIRECTION;
    }

    // ---------------------------------------------------------------- VENDEUR
    const TUILES_VENDEUR = [
      { id: 'v_cdes', fam: 'Ma production', lab: 'Mes commandes',
        val: A => fmt(A.prod.cdes),
        sub: A => A.prod.obj_cdes > 0
               ? ('objectif ' + fmt(A.prod.obj_cdes) + ' · ' + ecart(A.prod.cdes, A.prod.obj_cdes))
               : 'pas d’objectif posé',
        ton: A => A.prod.obj_cdes > 0 && A.prod.cdes < A.prod.obj_cdes ? 'baisse' : 'hausse',
        titre: 'Vos commandes du mois',
        ctx: A => 'Commandes gagnées ce mois-ci, loueurs compris. L’objectif est le vôtre, pas celui du site.',
        vue: A => serieHtml(A, 'cdes', 'Vos commandes'),
        trouve: A => {
          const o = num(A.prod.obj_cdes), c = num(A.prod.cdes);
          if (!o) return 'Aucun objectif n’est posé pour vous ce mois-ci.';
          if (c >= o) return 'Objectif atteint : <b>' + fmt(c) + '</b> commandes pour ' + fmt(o) + '.';
          const j = new Date(state.annee, state.mois, 0).getDate() - new Date().getDate();
          return 'Il vous manque <b>' + fmt(o - c) + '</b> commande' + (o - c > 1 ? 's' : '')
            + (estMoisEnCours() ? ', et il reste <b>' + Math.max(j, 0) + '</b> jour' + (j > 1 ? 's' : '') + '.' : '.');
        } },
      { id: 'v_leads', fam: 'Mes leads', lab: 'Jamais contactés',
        val: A => fmt(A.prod.leads_jamais),
        sub: A => { const h = num((A.vendeurs[0] || {}).leads_plus_vieux_h);
                    return h > 0 ? ('le plus ancien depuis ' + (h < 48 ? h + ' h' : Math.round(h / 24) + ' j')) : 'rien en attente'; },
        ton: A => A.prod.leads_jamais > 0 ? 'baisse' : 'hausse',
        titre: 'Les leads que vous n’avez pas encore appelés',
        ctx: A => 'Attribués à votre nom, sans aucun premier contact enregistré. Les plus anciens d’abord.',
        liste: 'leads_jamais',
        trouve: A => num(A.prod.leads_jamais) === 0
          ? 'Aucun lead en attente : tout ce qui vous a été attribué a été appelé.'
          : 'Appelez d’abord les plus anciens : un lead rappelé au-delà de 24 heures se perd deux fois plus souvent.' },
      { id: 'v_relance', fam: 'Mes affaires', lab: 'À relancer',
        val: A => fmt(A.prod.pipe_a_relancer + A.prod.pipe_froides),
        sub: A => fmt(A.prod.pipe_affaires) + ' affaires ouvertes',
        ton: A => A.prod.pipe_froides > 0 ? 'baisse' : null,
        titre: 'Vos affaires sorties de la fenêtre',
        ctx: A => 'Affaires ouvertes depuis plus de sept jours sans commande. Au-delà de trente jours, elles sont froides.',
        liste: 'relance',
        trouve: A => num(A.prod.pipe_froides) > 0
          ? '<b>' + fmt(A.prod.pipe_froides) + '</b> affaires ont plus de trente jours : elles ne se rattrapent plus toutes seules.'
          : 'Votre portefeuille est à jour.' },
      { id: 'v_livr', fam: 'Mes livraisons', lab: 'En retard',
        val: A => fmt(A.prod.livr_retard),
        sub: A => fmt(A.prod.livr_semaine) + ' cette semaine',
        ton: A => A.prod.livr_retard > 0 ? 'baisse' : 'hausse',
        titre: 'Vos livraisons',
        ctx: A => 'Commandes transmises ou validées dont la date limite est passée, et celles de la semaine.',
        liste: 'livr_retard',
        trouve: A => num(A.prod.livr_a_cloturer) > 0
          ? '<b>' + fmt(A.prod.livr_a_cloturer) + '</b> dossiers ont plus de trois mois de retard : ils sont probablement à clôturer.'
          : 'Rien d’anormal dans vos livraisons.' },
      { id: 'v_sansfi', fam: 'Mes leviers', lab: 'Sans financement',
        val: A => fmt(A.prod.hors_loueurs - A.prod.fi),
        sub: A => A.taux_fi == null ? 'aucune commande' : (A.taux_fi + ' % financé'),
        ton: A => (A.taux_fi != null && A.taux_fi < 30) ? 'baisse' : null,
        titre: 'Vos commandes sans financement',
        ctx: A => 'Hors loueurs. Chacune est une marge de financement non prise, et le client repartira la chercher ailleurs.',
        liste: 'sans_fi',
        trouve: A => A.taux_fi == null ? 'Pas encore de commande ce mois-ci.'
          : 'Vous financez <b>' + A.taux_fi + ' %</b> de vos commandes hors loueurs.' },
      { id: 'v_rdv', fam: 'Mon agenda', lab: 'Rendez-vous à venir',
        val: A => fmt(A.prod.rdv_a_venir),
        sub: A => fmt(A.prod.rdv_tenus) + ' tenus sur 30 j',
        titre: 'Vos rendez-vous',
        ctx: A => 'Rendez-vous programmés, et ceux des trente derniers jours, soldés ou non.',
        vue: A => tableau(
          [{ t: '', v: l => l.l }, { t: 'Nombre', v: l => fmt(l.n) }],
          [{ l: 'À venir', n: A.prod.rdv_a_venir },
           { l: 'Tenus sur 30 jours', n: A.prod.rdv_tenus },
           { l: 'Soldés', n: A.prod.rdv_soldes }]),
        trouve: A => num(A.prod.rdv_tenus) > 0
          ? 'Vous avez soldé <b>' + (pct(A.prod.rdv_soldes, A.prod.rdv_tenus) || 0) + ' %</b> de vos rendez-vous tenus.'
          : 'Aucun rendez-vous tenu sur les trente derniers jours.' }
    ];

    // ------------------------------------------------------------------- CHEF
    const COLS_V_BASE = { t: 'Vendeur', v: l => esc(l.nom) };
    const TUILES_CHEF = [
      { id: 'c_cdes', fam: 'Production', lab: 'Commandes de l’équipe',
        val: A => fmt(A.prod.cdes),
        sub: A => A.prod.obj_cdes > 0
               ? ('objectif ' + fmt(A.prod.obj_cdes) + ' · ' + ecart(A.prod.cdes, A.prod.obj_cdes))
               : 'pas d’objectif posé',
        ton: A => A.prod.obj_cdes > 0 && A.prod.cdes < A.prod.obj_cdes ? 'baisse' : 'hausse',
        titre: 'Qui décroche, et de combien',
        ctx: A => 'Vos vendeurs classés par écart à leur objectif individuel, du plus en retard au moins.',
        vue: A => tableau([
            COLS_V_BASE,
            { t: 'Cdes', v: l => fmt(l.cdes) },
            { t: 'Obj.', v: l => l.obj_cdes ? fmt(l.obj_cdes) : null },
            { t: 'Écart', v: l => l.obj_cdes ? ecart(l.cdes, l.obj_cdes) : null },
            { t: 'Financ.', v: l => pcts(pct(l.fi, l.hors_loueurs)) }
          ], classement(A, v => num(v.obj_cdes) ? num(v.cdes) - num(v.obj_cdes) : 9999, 'asc')),
        trouve: A => {
          const r = classement(A, v => num(v.obj_cdes) ? num(v.cdes) - num(v.obj_cdes) : 9999, 'asc')
            .filter(v => num(v.obj_cdes) > 0 && num(v.cdes) < num(v.obj_cdes));
          if (!r.length) return 'Tout le monde est à l’objectif ou au-dessus.';
          const p = r[0];
          return 'L\u2019\u00e9cart le plus important est celui de <b>' + esc(p.nom) + '</b> : '
            + fmt(p.cdes) + ' pour ' + fmt(p.obj_cdes) + ', soit ' + fmt(p.obj_cdes - p.cdes) + ' de retard'
            + (r.length > 1 ? '. ' + (r.length - 1) + ' autre' + (r.length > 2 ? 's sont' : ' est') + ' aussi en dessous.' : '.');
        } },
      { id: 'c_leads', fam: 'Leads', lab: 'Jamais contactés',
        val: A => fmt(A.prod.leads_jamais),
        sub: A => fmt(A.prod.leads_jamais_48h) + ' depuis plus de 48 h',
        ton: A => A.prod.leads_jamais_48h > 0 ? 'baisse' : 'hausse',
        titre: 'Les leads qui dorment, par vendeur',
        ctx: A => 'Leads attribués sans aucun premier contact. Au-delà de 48 heures, le client a déjà appelé ailleurs.',
        vue: A => tableau([
            COLS_V_BASE,
            { t: 'Jamais appelés', v: l => fmt(l.leads_jamais) },
            { t: '> 48 h', v: l => fmt(l.leads_jamais_48h), cl: l => l.leads_jamais_48h > 0 ? 'mauvais' : '' },
            { t: 'Plus ancien', v: l => l.leads_plus_vieux_h ? (l.leads_plus_vieux_h < 48 ? l.leads_plus_vieux_h + ' h' : Math.round(l.leads_plus_vieux_h / 24) + ' j') : null }
          ], classement(A, v => v.leads_jamais).filter(v => num(v.leads_jamais) > 0)),
        trouve: A => {
          const r = classement(A, v => v.leads_jamais_48h).filter(v => num(v.leads_jamais_48h) > 0);
          if (!r.length) return 'Aucun lead en souffrance : l’équipe suit.';
          return '<b>' + esc(r[0].nom) + '</b> a ' + fmt(r[0].leads_jamais_48h)
            + ' lead' + (r[0].leads_jamais_48h > 1 ? 's' : '') + ' de plus de 48 heures sans appel.';
        } },
      { id: 'c_relance', fam: 'Pipe', lab: 'Affaires à relancer',
        val: A => fmt(A.prod.pipe_a_relancer + A.prod.pipe_froides),
        sub: A => fmt(A.prod.pipe_froides) + ' froides (> 30 j)',
        ton: A => A.prod.pipe_froides > 0 ? 'baisse' : null,
        titre: 'Le portefeuille de chacun',
        ctx: A => 'Affaires ouvertes sans commande. Au-delà de sept jours elles sont à relancer, au-delà de trente elles sont froides.',
        vue: A => tableau([
            COLS_V_BASE,
            { t: 'Ouvertes', v: l => fmt(l.pipe_affaires) },
            { t: 'Fraîches', v: l => fmt(l.pipe_fraiches) },
            { t: 'À relancer', v: l => fmt(l.pipe_a_relancer) },
            { t: 'Froides', v: l => fmt(l.pipe_froides), cl: l => l.pipe_froides > 0 ? 'mauvais' : '' }
          ], classement(A, v => v.pipe_froides).filter(v => num(v.pipe_affaires) > 0)),
        trouve: A => {
          const r = classement(A, v => v.pipe_froides).filter(v => num(v.pipe_froides) > 0);
          if (!r.length) return 'Aucune affaire froide dans l’équipe.';
          return '<b>' + esc(r[0].nom) + '</b> porte ' + fmt(r[0].pipe_froides)
            + ' affaires de plus de trente jours.';
        } },
      { id: 'c_livr', fam: 'Livraisons', lab: 'En retard',
        val: A => fmt(A.prod.livr_retard),
        sub: A => fmt(A.prod.livr_attente) + ' en attente · ' + fmtEur(A.prod.livr_montant),
        ton: A => A.prod.livr_retard > 0 ? 'baisse' : 'hausse',
        titre: 'Les livraisons en retard',
        ctx: A => 'Commandes transmises ou validées dont la date limite est passée. Au-delà de trois mois, le dossier est à clôturer.',
        liste: 'livr_retard',
        trouve: A => num(A.prod.livr_a_cloturer) > 0
          ? '<b>' + fmt(A.prod.livr_a_cloturer) + '</b> dossiers traînent depuis plus de trois mois : ils faussent vos chiffres d’en-cours.'
          : 'Rien d’anormal.' },
      { id: 'c_stock', fam: 'Stock', lab: 'Dort depuis 90 j',
        val: A => fmt(A.stock_90),
        sub: A => fmtEur(A.stock_dormant) + ' immobilisés',
        ton: A => A.stock_90 > 0 ? 'baisse' : null,
        titre: 'Le stock de vos sites',
        ctx: A => 'Véhicules disponibles par site, et ce qui dort depuis plus de trois mois. L’âge du VO se compte depuis l’achat.',
        vue: A => tableau([
            { t: 'Site', v: l => esc(l.nom) },
            { t: 'VN', v: l => fmt(l.vn_n) },
            { t: 'VN > 90 j', v: l => fmt(l.vn_90), cl: l => l.vn_90 > 0 ? 'mauvais' : '' },
            { t: 'VO', v: l => fmt(l.vo_n) },
            { t: 'VO > 90 j', v: l => fmt(l.vo_90), cl: l => l.vo_90 > 0 ? 'mauvais' : '' },
            { t: 'Dormant', v: l => fmtEur(num(l.vn_dormant) + num(l.vo_dormant)) }
          ], A.sites.slice().sort((a, b) => (num(b.vn_dormant) + num(b.vo_dormant)) - (num(a.vn_dormant) + num(a.vo_dormant)))),
        trouve: A => A.stock_dormant > 0
          ? '<b>' + fmtEur(A.stock_dormant) + '</b> dorment depuis plus de trois mois. C’est là que se trouve votre marge de manœuvre commerciale.'
          : 'Aucun véhicule immobilisé depuis plus de trois mois.' },
      { id: 'c_fi', fam: 'Leviers', lab: 'Financement',
        val: A => A.taux_fi == null ? '—' : (A.taux_fi + ' %'),
        sub: A => fmt(A.prod.fi) + ' sur ' + fmt(A.prod.hors_loueurs) + ' hors loueurs',
        ton: A => (A.taux_fi != null && A.taux_fi < 30) ? 'baisse' : null,
        titre: 'La pénétration du financement, par vendeur',
        ctx: A => 'Part des commandes hors loueurs assorties d’un financement. Les loueurs sont exclus : ils ne se financent pas chez nous.',
        vue: A => tableau([
            COLS_V_BASE,
            { t: 'Hors loueurs', v: l => fmt(l.hors_loueurs) },
            { t: 'Financées', v: l => fmt(l.fi) },
            { t: 'Taux', v: l => pcts(pct(l.fi, l.hors_loueurs)),
              cl: l => { const p = pct(l.fi, l.hors_loueurs); return p != null && p < 30 ? 'mauvais' : ''; } }
          ], classement(A, v => pct(v.fi, v.hors_loueurs) == null ? 999 : pct(v.fi, v.hors_loueurs), 'asc')
               .filter(v => num(v.hors_loueurs) > 0)),
        trouve: A => {
          const r = classement(A, v => pct(v.fi, v.hors_loueurs) == null ? 999 : pct(v.fi, v.hors_loueurs), 'asc')
            .filter(v => num(v.hors_loueurs) >= 3);
          if (!r.length) return 'Pas assez de volume pour comparer.';
          return '<b>' + esc(r[0].nom) + '</b> finance ' + (pct(r[0].fi, r[0].hors_loueurs) || 0)
            + ' % de ses commandes, contre ' + (A.taux_fi || 0) + ' % pour l’équipe.';
        } }
    ];

    // -------------------------------------------------------------- DIRECTION
    const TUILES_DIRECTION = [
      { id: 'd_cdes', fam: 'Production', lab: 'Commandes',
        val: A => fmt(A.prod.cdes),
        sub: A => A.prod.obj_cdes > 0
               ? ('objectif ' + fmt(A.prod.obj_cdes) + ' · ' + ecart(A.prod.cdes, A.prod.obj_cdes))
               : 'pas d’objectif posé',
        ton: A => A.prod.obj_cdes > 0 && A.prod.cdes < A.prod.obj_cdes ? 'baisse' : 'hausse',
        titre: 'Quelle entité décroche',
        ctx: A => 'Vos affaires classées par écart à l’objectif. Les objectifs sont la somme des objectifs individuels.',
        vue: A => tableau([
            { t: 'Affaire', v: l => esc(l.nom) },
            { t: 'Cdes', v: l => fmt(l.cdes) },
            { t: 'Obj.', v: l => l.obj_cdes ? fmt(l.obj_cdes) : null },
            { t: 'Écart', v: l => l.obj_cdes ? ecart(l.cdes, l.obj_cdes) : null },
            { t: 'Financ.', v: l => pcts(pct(l.fi, l.hors_loueurs)) }
          ], parEntite(A, 'affaire').sort((a, b) =>
               (num(a.obj_cdes) ? a.cdes - a.obj_cdes : 9999) - (num(b.obj_cdes) ? b.cdes - b.obj_cdes : 9999)))
          + serieHtml(A, 'cdes', 'Commandes du périmètre'),
        trouve: A => {
          const r = parEntite(A, 'affaire').filter(x => num(x.obj_cdes) > 0 && x.cdes < x.obj_cdes)
            .sort((a, b) => (a.cdes - a.obj_cdes) - (b.cdes - b.obj_cdes));
          if (!r.length) return 'Toutes les affaires sont à l’objectif ou au-dessus.';
          return '<b>' + esc(r[0].nom) + '</b> accuse le plus gros retard : ' + fmt(r[0].cdes)
            + ' commandes pour ' + fmt(r[0].obj_cdes) + ' attendues.';
        } },
      { id: 'd_engage', fam: 'Argent engagé', lab: 'Transmis, non soldé',
        val: A => fmtEur(A.stock.ent_trans_m),
        sub: A => fmt(A.stock.ent_trans_n) + ' dossiers',
        titre: 'L’entonnoir des commandes',
        ctx: A => 'Toutes les commandes vivantes du périmètre, par étape. Le montant est l’engagement TTC.',
        vue: A => entonnoirHtml(A.stock),
        trouve: A => num(A.stock.ent_refus_n) > 0
          ? '<b>' + fmt(A.stock.ent_refus_n) + '</b> commandes refusées, soit ' + fmtEur(A.stock.ent_refus_m)
            + ' perdus en bout de chaîne.'
          : 'Aucun refus enregistré sur ce périmètre.' },
      { id: 'd_appro', fam: 'Argent engagé', lab: 'Bloqués en approbation',
        val: A => fmt(A.stock.ent_appro_n),
        sub: A => fmtEur(A.stock.ent_appro_m) + ' en attente',
        ton: A => A.stock.ent_appro_n > 0 ? 'baisse' : null,
        titre: 'Ce qui attend une signature',
        ctx: A => 'Commandes en attente d’approbation, par site. Chaque jour passé ici est un jour où le client peut changer d’avis.',
        vue: A => tableau([
            { t: 'Site', v: l => esc(l.nom) },
            { t: 'En approbation', v: l => fmt(l.ent_appro_n), cl: l => l.ent_appro_n > 0 ? 'mauvais' : '' },
            { t: 'Montant', v: l => fmtEur(l.ent_appro_m) },
            { t: 'En préparation', v: l => fmt(l.ent_prep_n) }
          ], A.sites.slice().sort((a, b) => num(b.ent_appro_n) - num(a.ent_appro_n))),
        trouve: A => num(A.stock.ent_appro_n) > 0
          ? '<b>' + fmtEur(A.stock.ent_appro_m) + '</b> attendent une approbation. C’est le poste le plus simple à débloquer.'
          : 'Rien en attente d’approbation.' },
      { id: 'd_stock', fam: 'Stock', lab: 'Dort depuis 90 j',
        val: A => fmtEur(A.stock_dormant),
        sub: A => fmt(A.stock_90) + ' véhicules sur ' + fmt(A.stock_n),
        ton: A => A.stock_dormant > 0 ? 'baisse' : null,
        titre: 'Le stock immobilisé',
        ctx: A => 'Par affaire : ce qui est en parc, et ce qui y est depuis plus de trois mois. L’âge du VO se compte depuis l’achat.',
        vue: A => tableau([
            { t: 'Affaire', v: l => esc(l.nom) },
            { t: 'VN', v: l => fmt(l.vn_n) },
            { t: 'VO', v: l => fmt(l.vo_n) },
            { t: 'Valeur', v: l => fmtEur(num(l.vn_valeur) + num(l.vo_valeur)) },
            { t: '> 90 j', v: l => fmt(num(l.vn_90) + num(l.vo_90)), cl: l => (num(l.vn_90) + num(l.vo_90)) > 0 ? 'mauvais' : '' },
            { t: 'Dormant', v: l => fmtEur(num(l.vn_dormant) + num(l.vo_dormant)) }
          ], parEntite(A, 'affaire').sort((a, b) =>
               (num(b.vn_dormant) + num(b.vo_dormant)) - (num(a.vn_dormant) + num(a.vo_dormant))),
          'Âge moyen du parc : VN ' + (A.vn_age == null ? '—' : A.vn_age + ' j')
            + ' · VO ' + (A.vo_age == null ? '—' : A.vo_age + ' j') + '.'),
        trouve: A => {
          const r = parEntite(A, 'affaire').sort((a, b) =>
            (num(b.vn_dormant) + num(b.vo_dormant)) - (num(a.vn_dormant) + num(a.vo_dormant)));
          if (!r.length || (num(r[0].vn_dormant) + num(r[0].vo_dormant)) === 0)
            return 'Aucun véhicule immobilisé depuis plus de trois mois.';
          return '<b>' + esc(r[0].nom) + '</b> porte à elle seule '
            + fmtEur(num(r[0].vn_dormant) + num(r[0].vo_dormant)) + ' de stock dormant sur les '
            + fmtEur(A.stock_dormant) + ' du périmètre.';
        } },
      { id: 'd_fi', fam: 'Leviers', lab: 'Financement',
        val: A => A.taux_fi == null ? '—' : (A.taux_fi + ' %'),
        sub: A => fmt(A.prod.fi) + ' sur ' + fmt(A.prod.hors_loueurs) + ' hors loueurs',
        ton: A => (A.taux_fi != null && A.taux_fi < 30) ? 'baisse' : null,
        titre: 'L’écart de financement entre affaires',
        ctx: A => 'Part des commandes hors loueurs financées. L’écart entre la meilleure et la dernière affaire est la marge récupérable.',
        vue: A => tableau([
            { t: 'Affaire', v: l => esc(l.nom) },
            { t: 'Hors loueurs', v: l => fmt(l.hors_loueurs) },
            { t: 'Financées', v: l => fmt(l.fi) },
            { t: 'Taux', v: l => pcts(pct(l.fi, l.hors_loueurs)),
              cl: l => { const p = pct(l.fi, l.hors_loueurs); return p != null && p < 30 ? 'mauvais' : ''; } },
            { t: 'LOA', v: l => fmt(l.loa) }
          ], parEntite(A, 'affaire').filter(x => num(x.hors_loueurs) > 0)
               .sort((a, b) => (pct(a.fi, a.hors_loueurs) || 0) - (pct(b.fi, b.hors_loueurs) || 0))),
        trouve: A => {
          const r = parEntite(A, 'affaire').filter(x => num(x.hors_loueurs) >= 5)
            .sort((a, b) => (pct(a.fi, a.hors_loueurs) || 0) - (pct(b.fi, b.hors_loueurs) || 0));
          if (r.length < 2) return 'Pas assez d’affaires comparées pour mesurer un écart.';
          const bas = r[0], haut = r[r.length - 1];
          const pb = pct(bas.fi, bas.hors_loueurs), ph = pct(haut.fi, haut.hors_loueurs);
          const manque = Math.round(bas.hors_loueurs * (ph - pb) / 100);
          return '<b>' + esc(bas.nom) + '</b> finance ' + pb + ' % quand <b>' + esc(haut.nom)
            + '</b> finance ' + ph + ' %. Au niveau de la meilleure, ce serait '
            + fmt(manque) + ' financements de plus ce mois-ci.';
        } },
      { id: 'd_livr', fam: 'Livraisons', lab: 'En retard',
        val: A => fmt(A.prod.livr_retard),
        sub: A => fmt(A.prod.livr_attente) + ' en attente · ' + fmtEur(A.prod.livr_montant),
        ton: A => A.prod.livr_retard > 0 ? 'baisse' : 'hausse',
        titre: 'Les livraisons en retard, par affaire',
        ctx: A => 'Commandes transmises ou validées dont la date limite est passée. Au-delà de trois mois le dossier est à clôturer.',
        vue: A => tableau([
            { t: 'Affaire', v: l => esc(l.nom) },
            { t: 'En attente', v: l => fmt(l.livr_attente) },
            { t: 'En retard', v: l => fmt(l.livr_retard), cl: l => l.livr_retard > 0 ? 'mauvais' : '' },
            { t: 'À clôturer', v: l => fmt(l.livr_a_cloturer) },
            { t: 'Montant', v: l => fmtEur(l.livr_montant) }
          ], parEntite(A, 'affaire').sort((a, b) => num(b.livr_retard) - num(a.livr_retard))),
        trouve: A => num(A.prod.livr_a_cloturer) > 0
          ? '<b>' + fmt(A.prod.livr_a_cloturer) + '</b> dossiers ont plus de trois mois de retard : ils gonflent l’en-cours sans raison.'
          : 'Aucun dossier anormalement ancien.' }
    ];

    // -------------------------------------------------------------- MARKETING
    function sourcesTriees(A) {
      return Object.values(A.sources).sort((a, b) => num(b.total) - num(a.total));
    }
    const TUILES_MARKETING = [
      { id: 'm_recus', fam: 'Flux', lab: 'Reçus sur 30 jours',
        val: A => fmt(A.stock.leads_recus_30j),
        sub: A => fmt(A.stock.leads_total) + ' depuis janvier',
        titre: 'Ce qui entre, par source',
        ctx: A => 'Leads reçus depuis le 1er janvier, par source, avec ce qui se résout et ce qui se perd.',
        vue: A => tableau([
            { t: 'Source', v: l => esc(l.source) },
            { t: 'Total', v: l => fmt(l.total) },
            { t: 'Résolus', v: l => fmt(l.resolus) },
            { t: 'Perdus', v: l => fmt(l.perdus) },
            { t: 'Perte', v: l => pcts(pct(l.perdus, l.total)),
              cl: l => { const p = pct(l.perdus, l.total); return p != null && p >= 25 ? 'mauvais' : ''; } }
          ], sourcesTriees(A)),
        trouve: A => {
          const s = sourcesTriees(A);
          if (!s.length) return 'Aucun lead sur ce périmètre.';
          return '<b>' + esc(s[0].source) + '</b> apporte ' + fmt(s[0].total) + ' leads, soit '
            + (pct(s[0].total, A.stock.leads_total) || 0) + ' % du flux.';
        } },
      { id: 'm_jamais', fam: 'Traitement', lab: 'Jamais contactés',
        val: A => fmt(A.stock.leads_jamais),
        sub: A => fmt(A.stock.leads_non_attribues) + ' pas encore attribués',
        ton: A => A.stock.leads_jamais > 0 ? 'baisse' : 'hausse',
        titre: 'Les leads qui n’ont jamais été appelés',
        ctx: A => 'Par site : ceux qui sont attribués sans premier contact, et ceux qui n’ont pas trouvé de vendeur.',
        vue: A => tableau([
            { t: 'Site', v: l => esc(l.nom) },
            { t: 'Reçus 30 j', v: l => fmt(l.leads_recus_30j) },
            { t: 'Jamais appelés', v: l => fmt(l.leads_jamais), cl: l => l.leads_jamais > 0 ? 'mauvais' : '' },
            { t: 'Non attribués', v: l => fmt(l.leads_non_attribues) },
            { t: 'Perdus', v: l => fmt(l.leads_perdus) }
          ], A.sites.slice().sort((a, b) => num(b.leads_jamais) - num(a.leads_jamais))),
        trouve: A => {
          const r = A.sites.slice().sort((a, b) => num(b.leads_jamais) - num(a.leads_jamais));
          if (!r.length || !num(r[0].leads_jamais)) return 'Tous les leads attribués ont été appelés.';
          return '<b>' + esc(r[0].nom) + '</b> laisse ' + fmt(r[0].leads_jamais)
            + ' leads sans premier appel.';
        } },
      { id: 'm_delai', fam: 'Traitement', lab: 'Délai de 1er contact',
        val: A => { const d = delaiMedian(A.stock); return d ? d.replace('moins de ', '< ').replace('moins d’une heure', '< 1 h') : '—'; },
        sub: A => fmt(A.stock.delai_n) + ' leads mesurés',
        titre: 'En combien de temps on rappelle',
        ctx: A => 'La distribution du délai entre réception et premier contact. La moyenne est inutilisable : des leads anciens recontactés la portaient à plus de 300 jours.',
        vue: A => tableau([
            { t: 'Délai', v: l => l.lab },
            { t: 'Leads', v: l => fmt(l.n) },
            { t: 'Part', v: l => pcts(pct(l.n, A.stock.delai_n)) }
          ], TRANCHES.map(t => ({ lab: t.lab, n: num(A.stock[t.k]) }))),
        trouve: A => {
          const tard = num(A.stock.d_24h) + num(A.stock.d_plus);
          const p = pct(tard, A.stock.delai_n);
          if (p == null) return 'Aucun délai mesurable sur ce périmètre.';
          return '<b>' + p + ' %</b> des leads sont rappelés au-delà de quatre heures. '
            + 'C’est le seuil où le client a déjà contacté un autre point de vente.';
        } },
      { id: 'm_perte', fam: 'Rendement', lab: 'Taux de perte',
        val: A => pcts(pct(A.stock.leads_perdus, A.stock.leads_total)),
        sub: A => fmt(A.stock.leads_perdus) + ' perdus sur ' + fmt(A.stock.leads_total),
        ton: A => { const p = pct(A.stock.leads_perdus, A.stock.leads_total); return p != null && p >= 25 ? 'baisse' : null; },
        titre: 'Où se perdent les leads',
        ctx: A => 'Taux de perte par source. Un écart entre deux sources tient rarement au canal : il tient à qui les traite.',
        vue: A => tableau([
            { t: 'Source', v: l => esc(l.source) },
            { t: 'Total', v: l => fmt(l.total) },
            { t: 'Perdus', v: l => fmt(l.perdus) },
            { t: 'Perte', v: l => pcts(pct(l.perdus, l.total)),
              cl: l => { const p = pct(l.perdus, l.total); return p != null && p >= 25 ? 'mauvais' : ''; } }
          ], sourcesTriees(A).filter(s => num(s.total) >= 5)
               .sort((a, b) => (pct(b.perdus, b.total) || 0) - (pct(a.perdus, a.total) || 0))),
        trouve: A => {
          const s = sourcesTriees(A).filter(x => num(x.total) >= 10)
            .sort((a, b) => (pct(b.perdus, b.total) || 0) - (pct(a.perdus, a.total) || 0));
          if (s.length < 2) return 'Pas assez de volume pour comparer les sources.';
          return '<b>' + esc(s[0].source) + '</b> perd ' + (pct(s[0].perdus, s[0].total) || 0)
            + ' % de ses leads, contre ' + (pct(s[s.length - 1].perdus, s[s.length - 1].total) || 0)
            + ' % pour <b>' + esc(s[s.length - 1].source) + '</b>.';
        } },
      { id: 'm_attrib', fam: 'Rendement', lab: 'Non attribués',
        val: A => fmt(A.stock.leads_non_attribues),
        sub: A => fmt(A.stock.leads_contactes) + ' en cours de traitement',
        ton: A => A.stock.leads_non_attribues > 0 ? 'baisse' : 'hausse',
        titre: 'Ce qui n’a trouvé personne',
        ctx: A => 'Leads sans vendeur attribué et non clos. Chacun est un client qui a laissé ses coordonnées et que personne n’a pris.',
        vue: A => tableau([
            { t: 'Site', v: l => esc(l.nom) },
            { t: 'Non attribués', v: l => fmt(l.leads_non_attribues), cl: l => l.leads_non_attribues > 0 ? 'mauvais' : '' },
            { t: 'Contactés', v: l => fmt(l.leads_contactes) },
            { t: 'Résolus', v: l => fmt(l.leads_resolus) }
          ], A.sites.slice().sort((a, b) => num(b.leads_non_attribues) - num(a.leads_non_attribues))),
        trouve: A => num(A.stock.leads_non_attribues) > 0
          ? '<b>' + fmt(A.stock.leads_non_attribues) + '</b> leads attendent un vendeur. C’est la file d’arbitrage qu’il faut vider en premier.'
          : 'Tous les leads ont trouvé un vendeur.' }
    ];

    // =========================================================================
    //  LE BANDEAU — une question par fonction, et le pouls qui va avec
    // =========================================================================
    function bandeau(A) {
      const f = famille(), p = A.prod, s = A.stock;
      let q, txt, pouls;
      if (f === 'vendeur') {
        q = 'Qui appeler aujourd’hui';
        const n = num(p.leads_jamais) + num(p.pipe_a_relancer);
        txt = n > 0
          ? 'Vous avez <b>' + fmt(n) + '</b> contact' + (n > 1 ? 's' : '') + ' à passer : '
            + fmt(p.leads_jamais) + ' lead' + (p.leads_jamais > 1 ? 's' : '') + ' jamais appelé'
            + (p.leads_jamais > 1 ? 's' : '') + ' et ' + fmt(p.pipe_a_relancer) + ' affaire'
            + (p.pipe_a_relancer > 1 ? 's' : '') + ' à relancer.'
          : 'Rien en attente : vos leads sont appelés et votre portefeuille est à jour.';
        pouls = [['Commandes', fmt(p.cdes)], ['À appeler', fmt(p.leads_jamais)],
                 ['À relancer', fmt(p.pipe_a_relancer)], ['Livr. en retard', fmt(p.livr_retard)]];
      } else if (f === 'chef') {
        q = 'Qui décroche, et sur quoi';
        const r = classement(A, v => num(v.obj_cdes) ? num(v.cdes) - num(v.obj_cdes) : 9999, 'asc')
          .filter(v => num(v.obj_cdes) > 0 && num(v.cdes) < num(v.obj_cdes));
        txt = r.length
          ? 'L’équipe est à <b>' + fmt(p.cdes) + '</b> commandes pour ' + fmt(p.obj_cdes)
            + '. L\u2019\u00e9cart le plus important est celui de <b>' + esc(r[0].nom) + '</b>.'
          : '<b>' + fmt(p.cdes) + '</b> commandes ce mois-ci : toute l’équipe tient son objectif.';
        pouls = [['Commandes', fmt(p.cdes)], ['Objectif', fmt(p.obj_cdes)],
                 ['Leads en attente', fmt(p.leads_jamais)], ['Stock > 90 j', fmt(A.stock_90)]];
      } else if (f === 'marketing') {
        q = 'Ce qui entre, ce qui se perd';
        const pp = pct(s.leads_perdus, s.leads_total);
        txt = '<b>' + fmt(s.leads_recus_30j) + '</b> leads reçus sur trente jours. '
          + (pp != null ? 'Le périmètre en perd <b>' + pp + ' %</b>, ' : '')
          + fmt(s.leads_jamais) + ' n’ont jamais été appelés.';
        pouls = [['Reçus 30 j', fmt(s.leads_recus_30j)], ['Jamais appelés', fmt(s.leads_jamais)],
                 ['Non attribués', fmt(s.leads_non_attribues)],
                 ['Perte', pct(s.leads_perdus, s.leads_total) == null ? '—' : (pct(s.leads_perdus, s.leads_total) + ' %')]];
      } else {
        q = 'Quelle entité décroche';
        const r = parEntite(A, 'affaire').filter(x => num(x.obj_cdes) > 0 && x.cdes < x.obj_cdes)
          .sort((a, b) => (a.cdes - a.obj_cdes) - (b.cdes - b.obj_cdes));
        txt = '<b>' + fmt(p.cdes) + '</b> commandes pour ' + fmt(p.obj_cdes) + ' attendues, '
          + '<b>' + fmtEur(A.engage) + '</b> engagés et non soldés'
          + (r.length ? ', et <b>' + esc(r[0].nom) + '</b> porte le plus gros retard.' : '.');
        pouls = [['Commandes', fmt(p.cdes)], ['Objectif', fmt(p.obj_cdes)],
                 ['Engagé', fmtEur(A.engage)], ['Stock dormant', fmtEur(A.stock_dormant)]];
      }
      return '<section class="dband"><div class="d"><div class="q">' + q + '</div>'
        + '<p>' + txt + '</p></div><div class="dpouls">'
        + pouls.map(x => '<div><div class="n">' + x[1] + '</div><div class="l">' + x[0] + '</div></div>').join('')
        + '</div></section>';
    }

    // =========================================================================
    //  LE RENDU
    //
    //  Le cadre est posé d'abord, vide, pour que la page ne reste jamais
    //  blanche en attendant la base ; il se remplit ensuite.
    // =========================================================================
    function dateLongue() {
      const j = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
      const d = new Date();
      return j[d.getDay()] + ' ' + d.getDate() + ' ' + MOIS_LONG[d.getMonth()]
        + ' · ' + MOIS_LONG[state.mois - 1] + (estMoisEnCours() ? ' en cours' : ' ' + state.annee);
    }
    function selecteurMois() {
      const d = new Date();
      const choix = [];
      let a = d.getFullYear(), m = d.getMonth() + 1;
      for (let i = 0; i < 3; i++) {
        choix.push({ a: a, m: m, lab: MOIS_LONG[m - 1] });
        if (m > 1) { m -= 1; } else { m = 12; a -= 1; }
      }
      return '<div class="dmois" role="group" aria-label="Mois">'
        + choix.map(c => '<button type="button" data-a="' + c.a + '" data-m="' + c.m + '"'
            + ' aria-pressed="' + (c.a === state.annee && c.m === state.mois) + '">'
            + esc(c.lab) + '</button>').join('')
        + '</div>';
    }

    function enTete(titre, roleLab) {
      return '<div class="drail"><h1>' + esc(titre) + '</h1>'
        + '<span class="dt">' + esc(dateLongue()) + '</span>'
        + (roleLab ? '<span class="drole">' + esc(roleLab) + '</span>' : '')
        + selecteurMois() + '</div>';
    }

    // Les tuiles, groupées par famille, chaque famille occupant autant de
    // colonnes qu'elle a de tuiles.
    function grilleTuiles(A) {
      const jeu = tuiles();
      const fams = [];
      jeu.forEach(t => {
        let f = fams.find(x => x.nom === t.fam);
        if (!f) { f = { nom: t.fam, t: [] }; fams.push(f); }
        f.t.push(t);
      });
      let h = '<div class="dfams">';
      fams.forEach(f => {
        h += '<section class="dfam' + (f.t.length <= 2 ? ' etroite' : '') + '"'
          + ' style="grid-column:span ' + Math.min(f.t.length, 6) + '">'
          + '<h2><span class="tt">' + esc(f.nom) + '</span></h2><div class="dgrille">';
        f.t.forEach(t => {
          const ton = t.ton ? t.ton(A) : null;
          h += '<button type="button" class="dtuile" data-id="' + esc(t.id) + '"'
            + ' aria-expanded="' + (state.ouvert === t.id) + '">'
            + '<span class="pl">' + (state.ouvert === t.id ? '−' : '+') + '</span>'
            + '<span class="lab">' + esc(t.lab) + '</span>'
            + '<span class="v">' + t.val(A) + '</span>'
            + (t.sub ? '<span class="c ' + (ton || 'plat') + '">' + t.sub(A) + '</span>' : '')
            + '</button>';
        });
        h += '</div></section>';
      });
      h += '<div id="dash-tiroir"></div></div>';
      return h;
    }

    function squelette() {
      const jeu = [1, 2, 3, 4, 5, 6];
      let h = '<div class="dw">' + enTete(TITRES[famille()] || 'Tableau de bord', '')
        + '<section class="dband"><div class="d"><div class="q">Chargement</div>'
        + '<p class="pale" style="color:var(--ink-3)">Lecture du tableau de bord…</p></div></section>'
        + '<div class="dcorps"><div><div class="dfams">'
        + '<section class="dfam" style="grid-column:span 6"><h2><span class="tt">&nbsp;</span></h2>'
        + '<div class="dgrille">'
        + jeu.map(() => '<div class="dtuile sq"><span class="lab">&nbsp;</span>'
            + '<span class="v">&nbsp;</span></div>').join('')
        + '</div></section></div></div><aside></aside></div></div>';
      getRoot().innerHTML = h;
    }

    function pied(A) {
      const maj = A.maj ? new Date(A.maj) : null;
      const quand = maj ? (maj.getHours() + 'h' + String(maj.getMinutes()).padStart(2, '0')) : null;
      return '<p class="dpied">Chiffres précalculés et rafraîchis toutes les deux minutes'
        + (quand ? ', dernière mise à jour à ' + quand : '')
        + '. Le périmètre est le vôtre : vous ne voyez que les sites et les vendeurs '
        + 'que votre fonction couvre. Les grands comptes sont exclus partout, '
        + 'comme dans Performances. L’âge du stock VO se compte depuis la date d’achat.</p>';
    }

    function rendre() {
      if (state.erreur) {
        getRoot().innerHTML = '<div class="dw"><div class="dvide">'
          + 'Le tableau de bord n’a pas pu être chargé (' + esc(state.erreur) + ').'
          + '</div></div>';
        return;
      }
      if (!state.j) { squelette(); return; }
      const A = agreger(state.j, sitesSelection());
      state.A = A;
      const roleLab = NOM_ROLE[num(state.j.role)] || '';
      const h = '<div class="dw">'
        + enTete(TITRES[famille()] || 'Tableau de bord', roleLab)
        + (state.avisRepli
            ? '<div class="davis">Aucune commande n’a encore été passée en '
              + esc(state.avisRepli) + ' sur ce périmètre : la production affichée est '
              + 'celle de ' + esc(MOIS_LONG[state.mois - 1]) + '. Les livraisons, le pipe, les '
              + 'leads et le stock restent, eux, ceux d’aujourd’hui.</div>'
            : '')
        + bandeau(A)
        + '<div class="dcorps"><div>' + grilleTuiles(A) + '</div>'
        + '<aside>' + selecteurPerimetre() + '</aside></div>'
        + pied(A) + '</div>';
      getRoot().innerHTML = h;
      if (state.ouvert) ouvrir(state.ouvert, true);
    }

    // =========================================================================
    //  LE TIROIR
    // =========================================================================
    function fermer() {
      state.ouvert = null;
      const r = getRoot();
      const z = r.querySelector('#dash-tiroir');
      if (z) z.innerHTML = '';
      r.querySelectorAll('.dtuile').forEach(b => {
        b.setAttribute('aria-expanded', 'false');
        const pl = b.querySelector('.pl'); if (pl) pl.textContent = '+';
      });
    }

    // `auto` : réouverture faite par la page elle-même après un rendu. Elle ne
    // doit pas faire défiler : c'est ce qui renvoyait l'écran vers le bas à
    // chaque changement de périmètre.
    function ouvrir(id, auto) {
      const t = tuiles().find(x => x.id === id);
      if (!t || !state.A) return;
      const A = state.A, r = getRoot();
      state.ouvert = id;
      r.querySelectorAll('.dtuile').forEach(b => {
        const on = b.getAttribute('data-id') === id;
        b.setAttribute('aria-expanded', String(on));
        const pl = b.querySelector('.pl'); if (pl) pl.textContent = on ? '−' : '+';
      });
      const zone = r.querySelector('#dash-tiroir');
      const btn = r.querySelector('.dtuile[data-id="' + id + '"]');
      if (!zone || !btn) return;
      const hote = btn.closest('.dfam');
      if (hote && hote.parentNode) hote.parentNode.insertBefore(zone, hote.nextSibling);

      const corps = t.vue ? t.vue(A) : (t.liste ? '<p class="dnote">Chargement de la liste…</p>' : '');
      zone.innerHTML = '<div class="dtiroir">'
        + '<button type="button" class="dferme dx" data-role="fermer" aria-label="Refermer">×</button>'
        + '<div><h3>' + esc(t.titre) + '</h3>'
        + '<p class="ctx">' + esc(typeof t.ctx === 'function' ? t.ctx(A) : (t.ctx || '')) + '</p>'
        + '<div data-role="corps">' + corps + '</div>'
        + '<button type="button" class="dferme" data-role="fermer">Refermer</button></div>'
        + '<div>' + trouvaille(t.trouve ? t.trouve(A) : '') + '</div>'
        + '</div>';

      if (t.liste) chargerListe(t, zone);
      if (!auto) { try { zone.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) { } }
    }

    function basculer(id) {
      if (state.ouvert === id) { fermer(); return; }
      ouvrir(id, false);
    }

    // Les listes nominatives restent servies à la demande, et seulement au
    // clic : les charger d'avance alourdirait la page pour des dépliés que
    // personne n'ouvrira. Elles sont mises en cache par bloc et périmètre.
    async function chargerListe(t, zone) {
      const sites = sitesSelection();
      const cle = t.liste + '|' + state.annee + '|' + state.mois + '|' + (sites ? sites.join(',') : 'all');
      const cible = () => {
        const z = getRoot().querySelector('#dash-tiroir [data-role="corps"]');
        return (state.ouvert === t.id) ? z : null;
      };
      if (state.listes[cle]) { const c = cible(); if (c) c.innerHTML = state.listes[cle]; return; }
      try {
        const jwt = await getUserJwt();
        if (!jwt) throw new Error('session absente');
        const res = await fetch(SUPABASE_URL + '/rest/v1/rpc/dashboard_tc_liste', {
          method: 'POST',
          headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + jwt,
                     'Content-Type': 'application/json' },
          body: JSON.stringify({ p_bloc: t.liste, p_annee: state.annee, p_mois: state.mois,
                                 p_id_site: null, p_limite: 60, p_sites: sites })
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        const j = await res.json();
        const lignes = (j && j.lignes) || [];
        const avecVendeur = famille() !== 'vendeur';
        const cols = [{ t: 'Client', v: l => esc(l.client || '—') }];
        if (avecVendeur) cols.push({ t: 'Vendeur', v: l => esc(l.vendeur || '—') });
        cols.push({ t: 'Véhicule', v: l => l.vehicule ? '<span title="' + esc(l.vehicule) + '">' + esc(l.vehicule.length > 48 ? l.vehicule.slice(0, 46) + '…' : l.vehicule) + '</span>' : null });
        cols.push({ t: 'Ancienneté', v: l => l.age == null ? null : (fmt(l.age) + ' j') });
        cols.push({ t: 'Téléphone', v: l => l.tel
          ? '<a class="dtel" href="tel:' + esc(String(l.tel).replace(/\s/g, '')) + '">' + esc(l.tel) + '</a>'
          : null });
        if (t.liste === 'leads_jamais') cols.push({ t: '', v: l => l.id_lead
          ? '<button type="button" class="dlead" data-lead="' + esc(l.id_lead) + '">Ouvrir</button>' : null });
        const h = tableau(cols, lignes,
          num(j && j.total) > lignes.length
            ? ('Les ' + lignes.length + ' premiers sur ' + fmt(j.total) + '.') : '');
        state.listes[cle] = h;
        const c = cible(); if (c) c.innerHTML = h;
      } catch (e) {
        const c = cible();
        if (c) c.innerHTML = '<p class="dnote">La liste n’a pas pu être chargée.</p>';
      }
    }

    function ouvrirLead(id) {
      const FW = (window.wwLib && wwLib.getFrontWindow && wwLib.getFrontWindow()) || window;
      try { FW.sessionStorage.setItem('od-lead-ouvrir', String(id)); } catch (e) { }
      let editeur = false;
      try { editeur = window.self !== window.top; } catch (e) { editeur = true; }
      if (editeur) { try { wwLib.wwApp.goTo('99519997-f935-471a-9147-b0118191b991'); return; } catch (e) { } return; }
      try { wwLib.goTo('/fr/marketing'); return; } catch (e) { }
      try { FW.location.href = '/fr/marketing#lead=' + encodeURIComponent(id); } catch (e) { }
    }

    // =========================================================================
    //  LES CLICS
    // =========================================================================
    getRoot().addEventListener('click', ev => {
      const r = getRoot();

      const fer = ev.target.closest('[data-role="fermer"]');
      if (fer && r.contains(fer)) { fermer(); return; }

      // « Ouvrir » un lead : la page Lead management l'ouvre à son arrivée.
      const ol = ev.target.closest('.dlead');
      if (ol && r.contains(ol)) { ouvrirLead(ol.getAttribute('data-lead')); return; }

      const tu = ev.target.closest('.dtuile');
      if (tu && r.contains(tu) && tu.getAttribute('data-id')) {
        basculer(tu.getAttribute('data-id')); return;
      }

      const bm = ev.target.closest('.dmois button');
      if (bm && r.contains(bm)) {
        const a = Number(bm.getAttribute('data-a')), m = Number(bm.getAttribute('data-m'));
        if (a === state.annee && m === state.mois) return;
        state.annee = a; state.mois = m; state.listes = {}; state.avisRepli = null;
        const cle = a + '|' + m;
        if (CACHE[cle]) { state.j = CACHE[cle]; rendre(); return; }
        // Pas encore en cache : on redessine avec le mois choisi, puis on
        // remplit. Le cadre ne disparaît pas.
        rendre();
        lireBase().then(j => { state.j = j; rendre(); })
                  .catch(e => { state.erreur = e.message; rendre(); });
        return;
      }

      // Le périmètre : le chevron plie, le reste de la ligne choisit.
      const pli = ev.target.closest('.dperimt .pli[data-role="pli"]');
      if (pli && r.contains(pli)) {
        const tr = pli.closest('tr');
        const k = tr && tr.getAttribute('data-pli');
        if (k) {
          const defaut = k.indexOf('reseau:') === 0;
          const ouvert = defaut ? state.plis[k] !== false : state.plis[k] === true;
          state.plis[k] = !ouvert;
          rendre();
        }
        ev.stopPropagation();
        return;
      }
      const tr = ev.target.closest('.dperimt tr');
      if (tr && r.contains(tr)) {
        const lv = tr.getAttribute('data-lv'), k = tr.getAttribute('data-k'),
              lab = tr.getAttribute('data-lab');
        if (!lv) return;
        state.sel = { level: lv, key: lv === 'site' ? Number(k) : k, label: lab };
        // La barre du haut ne sait porter qu'un site : on ne lui pousse que ça.
        if (lv === 'site') pousserAuBus(Number(k));
        rendre();
        return;
      }
    });

    // =========================================================================
    //  LE TABLEAU DU PLATEAU VROOM (rôle 10)
    //
    //  Un opérateur plateau ne vend pas : ses commandes, son pipe et son stock
    //  ne veulent rien dire. Sa page répond à « où en est la piscine, qu'ai-je
    //  fait aujourd'hui, que deviennent nos transferts ? ».
    //  Une seule source : plateau_tableau (teamcolin_poste_site.sql), qui lit
    //  l'état de la piscine (plateau_kpis), les gestes faits dans One Data et
    //  l'historique BACS des comptes VROOM partagés.
    // =========================================================================
    async function roleConnu() {
      try {
        let u = ctx.user || (window.OD && OD.getUser && OD.getUser());
        if (!u) {
          const FW = (window.wwLib && wwLib.getFrontWindow && wwLib.getFrontWindow()) || window;
          if (typeof FW.oropraLoadUser === 'function') u = await FW.oropraLoadUser();
        }
        if (Array.isArray(u)) u = u[0];
        const r = u && Number(u.ID_Role);
        return isFinite(r) && r > 0 ? r : null;
      } catch (e) { return null; }
    }
    const CSS_PL = `
#dash-root .pl-band p{font-size:17px}
#dash-root .pl-sec{display:grid;gap:10px}
#dash-root .pl-sec > h2{font-size:11px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:var(--ink-2);margin:0}
#dash-root .pl-tuiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:10px}
#dash-root .pl-t{background:var(--card);border:1px solid var(--line);border-radius:13px;padding:11px 13px 10px;box-shadow:var(--ombre);min-height:84px;display:flex;flex-direction:column}
#dash-root .pl-t .lab{font-size:10.5px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:var(--ink-3);line-height:1.3}
#dash-root .pl-t .v{font-size:24px;font-weight:800;letter-spacing:-.01em;margin-top:auto;font-variant-numeric:tabular-nums;color:var(--ink)}
#dash-root .pl-t .v small{font-size:13px;font-weight:700;color:var(--ink-3);margin-left:3px}
#dash-root .pl-t .c{font-size:11px;font-weight:700;color:var(--ink-3);margin-top:2px}
#dash-root .pl-t.crit .v{color:var(--m-rouge)} #dash-root .pl-t.warn .v{color:var(--m-orange)}
#dash-root .pl-t.ok .v{color:var(--m-vert)} #dash-root .pl-t.bleu .v{color:var(--bleu)}
#dash-root .pl-carte .pl-tuiles{grid-template-columns:repeat(auto-fill,minmax(118px,1fr))}
#dash-root .pl-deux{display:grid;grid-template-columns:minmax(0,1.25fr) minmax(0,1fr);gap:16px;align-items:start}
@media (max-width:900px){#dash-root .pl-deux{grid-template-columns:minmax(0,1fr)}}
#dash-root .pl-carte{background:var(--card);border:1px solid var(--line);border-radius:14px;box-shadow:var(--ombre);padding:16px 18px;display:grid;gap:12px;min-width:0}
#dash-root .pl-carte h3{font-size:14px;font-weight:800;color:#1F4A85;margin:0}
#dash-root .pl-carte .s{font-size:12px;color:#7a98c5;font-weight:600;margin:-6px 0 0}
#dash-root .pl-graph{display:grid;grid-template-columns:repeat(14,minmax(0,1fr));gap:6px;align-items:end;height:150px;padding-top:8px}
#dash-root .pl-col{display:flex;flex-direction:column-reverse;height:100%;gap:2px;position:relative}
#dash-root .pl-col i{display:block;border-radius:3px;min-height:0}
#dash-root .pl-col i.q{background:var(--vert)} #dash-root .pl-col i.r{background:var(--bleu-clair)} #dash-root .pl-col i.a{background:var(--rouge)}
#dash-root .pl-col b{position:absolute;left:0;right:0;border-top:2px solid var(--bleu);height:0}
#dash-root .pl-jours{display:grid;grid-template-columns:repeat(14,minmax(0,1fr));gap:6px;font-size:10px;color:var(--ink-3);font-weight:700;text-align:center;font-variant-numeric:tabular-nums}
#dash-root .pl-leg{display:flex;flex-wrap:wrap;gap:6px 16px;font-size:11.5px;color:var(--ink-2);font-weight:600}
#dash-root .pl-leg i{display:inline-block;width:12px;height:10px;border-radius:3px;margin-right:6px;vertical-align:-1px}
#dash-root .pl-leg i.q{background:var(--vert)} #dash-root .pl-leg i.r{background:var(--bleu-clair)} #dash-root .pl-leg i.a{background:var(--rouge)}
#dash-root .pl-leg i.p{height:0;border-top:2px solid var(--bleu);vertical-align:3px}
#dash-root table.pl-tab{width:100%;border-collapse:separate;border-spacing:0;font-size:13px}
#dash-root table.pl-tab th{font-size:9.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-3);text-align:center;padding:8px 6px;background:var(--calme-bg)}
#dash-root table.pl-tab th:first-child{text-align:left;border-radius:9px 0 0 9px} #dash-root table.pl-tab th:last-child{border-radius:0 9px 9px 0}
#dash-root table.pl-tab td{border-top:1px solid var(--line);padding:8px 6px;text-align:center;font-variant-numeric:tabular-nums}
#dash-root table.pl-tab tbody tr:first-child td{border-top:0}
#dash-root table.pl-tab td:first-child{text-align:left;font-weight:700}
#dash-root table.pl-tab td small{display:block;font-weight:600;color:var(--ink-3);font-size:11px}
#dash-root table.pl-tab tr.moi td{background:#eef4fc}
#dash-root .pl-na{color:var(--ink-3)}
#dash-root .pl-barre{height:8px;border-radius:4px;background:var(--calme-bg);overflow:hidden}
#dash-root .pl-barre i{display:block;height:100%;background:var(--vert);border-radius:4px}
#dash-root .pl-ligne{display:flex;justify-content:space-between;gap:10px;font-size:13px;color:var(--ink-2);font-weight:600}
#dash-root .pl-ligne b{color:var(--ink);font-weight:800;font-variant-numeric:tabular-nums}
#dash-root .pl-lien{display:inline-flex;align-items:center;gap:6px;background:#2a5ea9;color:#fff;border:0;border-radius:9px;padding:7px 13px;font:inherit;font-size:12.5px;font-weight:700;cursor:pointer;text-decoration:none;margin-left:auto}
#dash-root .pl-lien:hover{background:#1F4A85}
`;
    async function tableauPlateau() {
      if (!doc.getElementById('dash-tc-css-pl')) {
        const st = doc.createElement('style'); st.id = 'dash-tc-css-pl'; st.textContent = CSS_PL;
        doc.head.appendChild(st);
      }
      const root = getRoot();
      const duree = m => {
        if (m == null || !isFinite(Number(m))) return '—';
        m = Math.max(0, Number(m));
        if (m < 1) return '< 1 min';
        if (m < 60) return Math.round(m) + ' min';
        if (m < 1440) { const h = Math.floor(m / 60), r = Math.round(m % 60); return h + ' h ' + String(r).padStart(2, '0'); }
        return Math.floor(m / 1440) + ' j';
      };
      const propre = s => { s = String(s || '').trim(); return !s || s !== s.toUpperCase() ? s : s.toLowerCase().replace(/(^|[\s\-'’])([a-zà-ÿ])/g, (x, a, b) => a + b.toUpperCase()); };
      const siteNom = s => propre(String(s || '').replace(/\s+TT\d+$/i, ''));
      const tuile = (lab, v, c, cls) => '<div class="pl-t ' + (cls || '') + '"><span class="lab">' + esc(lab) + '</span><span class="v">' + v + '</span>' + (c ? '<span class="c">' + esc(c) + '</span>' : '') + '</div>';
      root.innerHTML = '<div class="dw"><div class="drail"><h1>Le plateau VROOM</h1><span class="dt">' + esc(dateLongue()) + '</span><span class="drole">Opérateur plateau</span></div>'
        + '<div class="dband pl-band"><div class="d"><div class="q">Chargement</div><p>Lecture de la piscine BACS…</p></div></div></div>';
      let j;
      try {
        const jwt = await getUserJwt();
        const res = await fetch(SUPABASE_URL + '/rest/v1/rpc/plateau_tableau', {
          method: 'POST',
          headers: { 'apikey': SUPABASE_KEY, 'Authorization': 'Bearer ' + jwt, 'Content-Type': 'application/json' },
          body: JSON.stringify({ p_jours: 30 })
        });
        if (!res.ok) throw new Error('HTTP ' + res.status);
        j = await res.json();
      } catch (e) {
        root.innerHTML = '<div class="dw"><div class="dvide">Le tableau du plateau n’a pas pu être chargé (' + esc(e.message || e) + ').</div></div>';
        return;
      }
      const f = j.file || {}, moi = j.moi_aujourdhui || {}, eq = j.aujourdhui || {}, p = j.periode || {}, dp = j.delai_prise || {}, tr = j.transferts || {};
      const prenom = String(propre(j.nom || '')).split(' ')[0];
      const syncMin = f.derniere_synchro ? (Date.now() - new Date(f.derniere_synchro).getTime()) / 60000 : null;

      // La phrase
      let t = (prenom ? esc(prenom) + ', l' : 'L') + 'a piscine BACS compte <b>' + fmt(f.n_piscine || 0) + ' lead' + (num(f.n_piscine) > 1 ? 's' : '') + '</b> à traiter';
      t += num(f.n_rappels_dus) ? ' et <b style="color:#d2941f">' + fmt(f.n_rappels_dus) + ' rappel' + (num(f.n_rappels_dus) > 1 ? 's sont dus' : ' est dû') + '</b>.' : '.';
      t += ' Aujourd’hui, vous avez pris <b>' + fmt(moi.pris || 0) + '</b> lead' + (num(moi.pris) > 1 ? 's' : '') + ' et transmis <b>' + fmt(moi.qualifies || 0) + '</b> aux sites.';
      if (num(f.n_transferts_sans_contact)) t += ' <b style="color:#c0524f">' + fmt(f.n_transferts_sans_contact) + ' transfert' + (num(f.n_transferts_sans_contact) > 1 ? 's attendent' : ' attend') + '</b> encore un vendeur.';

      const qualifTaux = (num(p.qualifies) + num(p.abandons)) ? Math.round(100 * num(p.qualifies) / (num(p.qualifies) + num(p.abandons))) : null;
      const dans1h = num(dp.n) ? Math.round(100 * num(dp.dans_1h) / num(dp.n)) : null;
      const dans2h = num(tr.contactes) ? Math.round(100 * num(tr.dans_2h) / num(tr.contactes)) : null;

      let h = '<div class="dw"><div class="drail"><h1>Le plateau VROOM</h1><span class="dt">' + esc(dateLongue()) + '</span><span class="drole">Opérateur plateau</span></div>';
      h += '<div class="dband pl-band"><div class="d"><div class="q">Votre journée</div><p>' + t + '</p></div></div>';

      h += '<section class="pl-sec"><h2>La piscine, maintenant</h2><div class="pl-tuiles">'
        + tuile('Leads à traiter', fmt(f.n_piscine || 0), num(f.n_nouveaux) ? fmt(f.n_nouveaux) + ' jamais pris' : 'tous déjà acceptés', num(f.n_piscine) ? 'bleu' : '')
        + tuile('Rappels dus', fmt(f.n_rappels_dus || 0), num(f.n_rappels_retard) ? fmt(f.n_rappels_retard) + ' en retard de plus de 30 min' : 'à l’heure', num(f.n_rappels_retard) ? 'crit' : num(f.n_rappels_dus) ? 'warn' : 'ok')
        + tuile('Transferts non pris', fmt(f.n_transferts_sans_contact || 0), 'au-delà de 2 h sur le site', num(f.n_transferts_sans_contact) ? 'crit' : 'ok')
        + tuile('Stock accepté + 14 j', fmt(f.stock_acceptes_anciens || 0), 'acceptés sans suite', num(f.stock_acceptes_anciens) ? 'warn' : 'ok')
        + tuile('Trafic atelier', fmt(f.atelier_en_file || 0), 'hors piscine par défaut', '')
        + tuile('Copie BACS', syncMin == null ? '—' : syncMin < 1 ? 'à l’instant' : duree(syncMin), syncMin == null ? 'jamais synchronisée' : 'depuis la dernière lecture', syncMin == null || syncMin > 1440 ? 'crit' : syncMin > 120 ? 'warn' : 'ok')
        + '</div></section>';

      h += '<section class="pl-sec"><h2>Aujourd’hui</h2><div class="pl-tuiles">'
        + tuile('Vous · pris', fmt(moi.pris || 0), 'plateau : ' + fmt(eq.pris || 0), 'bleu')
        + tuile('Vous · transmis aux sites', fmt(moi.qualifies || 0), 'plateau : ' + fmt(eq.qualifies || 0), num(moi.qualifies) ? 'ok' : '')
        + tuile('Vous · rappels programmés', fmt(moi.rappels || 0), 'plateau : ' + fmt(eq.rappels || 0), '')
        + tuile('Vous · abandonnés', fmt(moi.abandons || 0), 'plateau : ' + fmt(eq.abandons || 0), '')
        + tuile('Votre délai de prise', duree(j.moi_delai_prise_min), 'médiane, 30 jours', '')
        + '</div></section>';

      // Série 14 jours
      const serie = j.serie || [];
      const max = Math.max(1, ...serie.map(d => Math.max(num(d.pris), num(d.qualifies) + num(d.rappels) + num(d.abandons))));
      let g = '<div class="pl-graph">';
      serie.forEach(d => {
        const hh = x => (100 * num(x) / max).toFixed(1) + '%';
        g += '<div class="pl-col" title="' + esc(d.jour) + ' : ' + num(d.pris) + ' pris, ' + num(d.qualifies) + ' qualifiés, ' + num(d.rappels) + ' en rappel, ' + num(d.abandons) + ' abandonnés">'
          + '<i class="q" style="height:' + hh(d.qualifies) + '"></i><i class="r" style="height:' + hh(d.rappels) + '"></i><i class="a" style="height:' + hh(d.abandons) + '"></i>'
          + (num(d.pris) ? '<b style="bottom:' + hh(d.pris) + '"></b>' : '') + '</div>';
      });
      g += '</div><div class="pl-jours">' + serie.map(d => { const x = new Date(d.jour + 'T12:00:00'); return '<span>' + ['di', 'lu', 'ma', 'me', 'je', 've', 'sa'][x.getDay()] + ' ' + x.getDate() + '</span>'; }).join('') + '</div>'
        + '<div class="pl-leg"><span><i class="q"></i>Qualifiés, transmis</span><span><i class="r"></i>Mis en rappel</span><span><i class="a"></i>Abandonnés</span><span><i class="p"></i>Pris</span></div>';

      h += '<div class="pl-deux"><div class="pl-carte"><h3>Le plateau sur 14 jours</h3><p class="s">Leads distincts par jour, tous opérateurs, gestes faits dans BACS ou dans One Data.</p>' + g + '</div>';
      h += '<div class="pl-carte"><h3>Sur 30 jours</h3>'
        + '<div class="pl-ligne"><span>Leads pris</span><b>' + fmt(p.pris || 0) + '</b></div>'
        + '<div class="pl-ligne"><span>Délai de prise, médiane</span><b>' + duree(dp.median_min) + '</b></div>'
        + '<div class="pl-ligne"><span>Pris en moins d’une heure</span><b>' + (dans1h == null ? '—' : dans1h + ' %') + '</b></div>'
        + '<div class="pl-barre"><i style="width:' + (dans1h || 0) + '%"></i></div>'
        + '<div class="pl-ligne"><span>Qualifiés et transmis</span><b>' + fmt(p.qualifies || 0) + '</b></div>'
        + '<div class="pl-ligne"><span>Abandonnés</span><b>' + fmt(p.abandons || 0) + '</b></div>'
        + '<div class="pl-ligne"><span>Taux de qualification</span><b>' + (qualifTaux == null ? '—' : qualifTaux + ' %') + '</b></div>'
        + '<div class="pl-barre"><i style="width:' + (qualifTaux || 0) + '%"></i></div>'
        + '<div class="pl-ligne"><span>Chefs des ventes relancés</span><b>' + fmt(p.relances || 0) + '</b></div>'
        + '<div class="pl-ligne"><span>Leads confiés par les sites</span><b>' + fmt(p.confies || 0) + '</b></div>'
        + '</div></div>';

      // Transferts
      const sites = (j.par_site || []);
      h += '<div class="pl-deux"><div class="pl-carte"><h3>Ce que deviennent les transferts</h3><p class="s">Leads qualifiés par le plateau ces 30 derniers jours, suivis sur le site.</p>'
        + '<div class="pl-tuiles">'
        + tuile('Transmis', fmt(tr.n || 0), '', 'bleu')
        + tuile('Contactés', fmt(tr.contactes || 0), dans2h == null ? '' : dans2h + ' % dans les 2 h', 'ok')
        + tuile('En attente', fmt(tr.en_attente || 0), fmt(tr.en_retard || 0) + ' au-delà de 2 h', num(tr.en_retard) ? 'crit' : '')
        + tuile('Délai du site', duree(tr.median_site_min), 'médiane, jusqu’au contact', '')
        + '</div>';
      if (sites.length) {
        h += '<table class="pl-tab"><thead><tr><th>Site</th><th>Transmis</th><th>Contactés</th><th>En retard</th><th>Délai médian</th></tr></thead><tbody>'
          + sites.map(s => '<tr><td>' + esc(siteNom(s.site)) + '</td><td>' + fmt(s.n) + '</td><td>' + fmt(s.contactes) + '</td><td>' + (num(s.en_retard) ? '<b style="color:#c0524f">' + fmt(s.en_retard) + '</b>' : '<span class="pl-na">0</span>') + '</td><td>' + duree(s.median_min) + '</td></tr>').join('')
          + '</tbody></table>';
      }
      h += '</div>';

      // Opérateurs
      const ops = j.operateurs || [], cb = j.comptes_bacs || {};
      h += '<div class="pl-carte"><h3>Les opérateurs, 30 jours</h3><p class="s">Gestes faits dans One Data, par personne. Les comptes VROOM partagés de BACS ne disent pas qui a agi : ils sont comptés à part.</p>'
        + '<table class="pl-tab"><thead><tr><th>Opérateur</th><th>Pris</th><th>Qualifiés</th><th>Rappels</th><th>Aban&shy;dons</th><th>Délai de prise</th></tr></thead><tbody>'
        + (ops.length ? ops.map(o => '<tr' + (o.moi ? ' class="moi"' : '') + '><td>' + esc(propre(o.nom)) + (o.dernier ? '<small>dernier geste ' + esc(new Date(o.dernier).toLocaleString('fr-FR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })) + '</small>' : '') + '</td><td>' + fmt(o.pris) + '</td><td>' + fmt(o.qualifies) + '</td><td>' + fmt(o.rappels) + '</td><td>' + fmt(o.abandons) + '</td><td>' + duree(o.delai_median_min) + '</td></tr>').join('')
          : '<tr><td colspan="6" class="pl-na">Aucun geste fait dans One Data sur la période.</td></tr>')
        + '<tr><td>Comptes VROOM (BACS)<small>gestes faits directement dans BACS</small></td><td>' + fmt(cb.pris || 0) + '</td><td>' + fmt(cb.qualifies || 0) + '</td><td>' + fmt(cb.rappels || 0) + '</td><td>' + fmt(cb.abandons || 0) + '</td><td class="pl-na">—</td></tr>'
        + '</tbody></table>';
      const motifs = j.motifs || [];
      if (motifs.length) h += '<div class="pl-ligne" style="flex-wrap:wrap;justify-content:flex-start;gap:6px 16px"><span>Motifs d’abandon :</span>' + motifs.slice(0, 6).map(m => '<span>' + esc(m.motif) + ' <b>' + fmt(m.n) + '</b></span>').join('') + '</div>';
      h += '</div></div>';

      h += '<p class="dpied">Piscine : état de la copie BACS synchronisée par l’extension, corrigé des gestes faits dans One Data. Activité : historique BACS des comptes VROOM et gestes du plateau dans One Data, un lead compté une fois par type de geste et par jour. Délai de prise : de la réception dans BACS à la première prise. Le travail se fait dans le poste du plateau (page Leads).</p></div>';
      root.innerHTML = h;
    }

    // =========================================================================
    //  MONTAGE
    //
    //  Le cadre d'abord, l'appel ensuite. On n'attend plus le bus avant de
    //  charger : dash_lire rend tout le périmètre d'un coup, et adopter le
    //  site de la barre du haut ne coûte plus qu'un nouveau rendu en mémoire.
    // =========================================================================
    // L'opérateur plateau a sa propre page : on le sait souvent avant tout appel.
    const roleUser = await roleConnu();
    if (roleUser === 10) { await tableauPlateau(); return; }

    squelette();

    const siteInitial = siteDuBusMaintenant();
    if (siteInitial != null) state.busSiteVu = siteInitial;

    try {
      state.j = await lireBase();
    } catch (e) {
      state.erreur = e && e.message ? e.message : 'erreur inconnue';
    }
    // Rôle inconnu au montage : dash_lire le donne.
    if (!state.erreur && state.j && num(state.j.role) === 10) { await tableauPlateau(); return; }
    if (!state.erreur && siteInitial != null) {
      const per = (state.j.perimetre || []);
      if (per.length > 1 && per.some(x => Number(x.id_site) === siteInitial)) poserSite(siteInitial);
    }
    rendre();
    brancherBus();

    // LE REPLI. Le 1er octobre, la production est vide : aucune commande n'a
    // encore été passée, et la page entière paraît fausse alors qu'elle est
    // juste. Tant que le mois en cours n'a aucune commande sur le périmètre,
    // la production bascule sur le mois précédent, et la page le dit. L'état
    // du jour, lui, ne bascule pas : il n'a qu'un seul horizon.
    // Le repli ne joue qu'une fois — choisir un mois à la main le désarme.
    if (!state.erreur && state.A && estMoisEnCours() && num(state.A.prod.cdes) === 0) {
      state.avisRepli = MOIS_LONG[state.mois - 1];
      if (state.mois > 1) { state.mois -= 1; } else { state.mois = 12; state.annee -= 1; }
      try {
        state.j = await lireBase();
      } catch (e) { state.avisRepli = null; }
      rendre();
    }
  }
});
