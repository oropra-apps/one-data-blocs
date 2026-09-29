// ============================================================================
//  DASHBOARD — module One Data (OD.define)   v26 — PROFIL TEAM COLIN
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
//  PAR RÔLE
//  Le jeu de tuiles dépend de la fonction : un vendeur voit sa production, son
//  pipe et ses leads ; un chef des ventes y ajoute son équipe et ses
//  livraisons ; un directeur voit tout, y compris la qualité de la base ; le
//  marketing voit les leads et la base. Moins de tuiles, mais toutes utiles à
//  celui qui les regarde.
//
//  PÉRIMÈTRE ET TOP NAV
//  Un chef multi-site ouvre sur la vue agrégée de tout son périmètre, avec la
//  ventilation par site en dessous. Le sélecteur de la page et le sélecteur de
//  site de la barre du haut sont le même état : changer l'un change l'autre, et
//  les chiffres se recalculent. C'est le bus de site (oropra-site-bus) qui les
//  relie.
//
//  SOURCE UNIQUE
//  Un seul aller-retour réseau : la RPC dashboard_tc(annee, mois) renvoie tout
//  en un jsonb, bornée par propale_visible_user_ids() — un vendeur ne voit que
//  lui, un chef son site, la direction les trois. Les grands comptes sont
//  exclus partout, comme dans Performances. La famille « qualité de la base »
//  est un sujet de groupe : elle n'est servie qu'aux rôles 1, 2 et 3.
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
    const state = { annee: today.getFullYear(), mois: today.getMonth() + 1,
                    ouvert: null, d: null, site: null, chargement: false };

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
        if (id != null && String(id) !== String(state.site)) { state.site = Number(id); recharger(); }
      } catch (e) { }
      if (window.__dashTcBusBound) return;
      window.__dashTcBusBound = true;
      b.onChange(({ siteId }) => {
        const v = siteId == null ? null : Number(siteId);
        if (String(v) === String(state.site)) return;
        state.site = v;
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
        body: JSON.stringify({ p_annee: state.annee, p_mois: state.mois, p_id_site: state.site })
      });
      if (!res.ok) throw new Error('HTTP ' + res.status);
      return await res.json();
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
      vendeur:   ['cdes', 'fi', 'acc', 'affaires', 'relance', 'livr', 'leads', 'delai'],
      chef:      ['cdes', 'fi', 'loa', 'acc', 'roole', 'phev', 'vu',
                  'affaires', 'relance', 'pipeval', 'livr', 'cloturer',
                  'rapports', 'rdv', 'leads', 'delai'],
      direction: null,   // tout
      marketing: ['cdes', 'leads', 'delai', 'injoignables', 'fusion', 'bloctel']
    };
    const ETIQ_ROLE = { vendeur: 'Vendeur', chef: 'Chef des ventes',
                        direction: 'Direction', marketing: 'Marketing' };
    function familleRole() { return ROLE_FAM[Number((state.d || {}).role)] || 'direction'; }
    function jeuDuRole() { return JEUX[familleRole()] || null; }
    // Un vendeur lit « mes » et non « les » : les libellés s'adaptent.
    function moi(txt) { return familleRole() === 'vendeur' ? txt.replace(/^Les /, 'Mes ') : txt; }

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
                x.nom + (x.site ? ' <span style="font-size:10.5px;color:var(--ink-3);font-weight:600">'
                  + esc(x.site) + '</span>' : ''),
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
      if (state.site == null && sites.length > 1) {
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
      const ou = state.site == null
        ? (((state.d.perimetre || []).length > 1) ? 'Sur tout votre périmètre, le volume ' : 'Le volume ')
        : 'Sur ' + esc(nomSite(state.site)) + ', le volume ';
      let ph = ou + (objCde > 0 && num(p.cdes) >= objCde ? 'tient' : 'est en deçà') + ' — ' + bouts[0];
      if (recul.length) ph += ' — mais ce qui s’ajoute à la voiture recule : ' + recul.join(', ');
      ph += '.';
      if (num(ld.delai_median_h) > 1) {
        ph += ' Et un lead sur deux attend <b>plus de '
          + String(ld.delai_median_h).replace('.', ',') + ' heures</b> avant le premier appel.';
      }
      return ph;
    }

    function nomSite(id) {
      const s2 = (state.d.perimetre || []).find(x => String(x.id_site) === String(id));
      return s2 ? (s2.nom || ('site ' + id)) : ('site ' + id);
    }

    function pouls() {
      const d = state.d, m = d.meteo || {}, lv = d.livr || {}, pi = d.pipe || {};
      return [
        { n: fmt(m.cdes_jour), l: 'commande' + (num(m.cdes_jour) > 1 ? 's' : '') + '<br>aujourd’hui' },
        { n: fmt(m.devis_jour), l: 'devis<br>ouverts' },
        { n: fmt(lv.semaine), l: 'livraison' + (num(lv.semaine) > 1 ? 's' : '') + '<br>cette semaine' },
        { n: fmt(pi.a_relancer), l: 'affaires<br>à relancer' }
      ].map(x => '<div><div class="n">' + x.n + '</div><div class="l">' + x.l + '</div></div>').join('');
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
        + '<div class="drail"><h1>Le tableau du jour</h1>'
        + '<span class="dt">' + esc(dateLongue()) + '</span>'
        + selecteurPerimetre()
        + '<span class="drole">' + esc(ETIQ_ROLE[familleRole()] || '') + '</span></div>'
        + '<section class="dband"><div class="d"><div class="q">La météo du jour</div>'
        + '<p>' + phraseDuJour() + '</p></div>'
        + '<div class="dpouls">' + pouls() + '</div></section>'
        + '<div id="dash-fams" style="display:flex;flex-direction:column;gap:18px">' + fams + '</div>'
        + '<div id="dash-tiroir"></div><div id="dash-ancre"></div>'
        + '<p class="dpied">Commandes gagnées uniquement, grands comptes exclus, sur votre périmètre. '
        + 'Douze mois glissants. Les seuils de relance (' + num((state.d.seuils || {}).p85) + ' et '
        + num((state.d.seuils || {}).p95) + ' jours) sont recalculés chaque nuit sur les affaires de '
        + 'l’année qui ont abouti. La pastille devant chaque famille dit l’état de sa source : '
        + '<span class="detat plein"></span>alimentée, <span class="detat partiel"></span>partielle, '
        + '<span class="detat vide"></span>sans donnée.</p>'
        + '</div>';

      r.querySelectorAll('.dtuile').forEach(b =>
        b.addEventListener('click', () => basculer(b.getAttribute('data-id'))));

      r.querySelectorAll('.dseg button[data-site]').forEach(b =>
        b.addEventListener('click', () => {
          const v = b.getAttribute('data-site');
          const site = v === '' ? null : Number(v);
          if (String(site) === String(state.site)) return;
          state.site = site;
          // On repousse le choix vers la barre du haut pour que les deux
          // sélecteurs ne se contredisent jamais. « Tout mon périmètre » n'est
          // pas un site : le bus reste sur sa valeur, seule la page s'élargit.
          if (site != null) { try { const bus = siteBus(); if (bus) bus.setSiteId(site); } catch (e) { } }
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
        state.d = d;
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

    // Le sélecteur n'apparaît qu'à partir de deux sites : pour un vendeur ou un
    // chef mono-site, il n'y aurait qu'un bouton et rien à choisir.
    function selecteurPerimetre() {
      const per = (state.d.perimetre || []);
      if (per.length < 2) return '';
      let h = '<div class="dseg" role="group" aria-label="Périmètre">'
        + '<button data-site="" aria-pressed="' + (state.site == null) + '">Tout mon périmètre</button>'
        + '<span class="sep"></span>';
      per.forEach(s2 => {
        h += '<button data-site="' + esc(s2.id_site) + '" aria-pressed="'
          + (String(state.site) === String(s2.id_site)) + '">' + esc(s2.nom || ('Site ' + s2.id_site))
          + '</button>';
      });
      return h + '</div>';
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
      let trouve = '', table = '';
      try { trouve = t.trouve ? t.trouve() : ''; } catch (e) { console.error('[dash] trouvaille', id, e); }
      try { table = t.table ? t.table() : ''; } catch (e) { console.error('[dash] table', id, e); }
      zone.innerHTML = '<section class="dtiroir"><div style="min-width:0">'
        + '<h3>' + esc(t.titre) + '</h3><p class="ctx">' + esc(t.ctx) + '</p>'
        + (t.statique ? '' : graphe(t.vals, t.forme, t.lm, t.gUnite, t.second, t.titre))
        + table + '</div><div style="min-width:0">'
        + '<div class="dtrouve"><div class="t">Ce que le chiffre ne dit pas</div>' + trouve + '</div>'
        + '<button class="dferme" type="button">Refermer</button></div></section>';
      zone.querySelector('.dferme').addEventListener('click', fermer);
      try { zone.scrollIntoView({ behavior: 'smooth', block: 'nearest' }); } catch (e) { }
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
