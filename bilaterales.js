// ============================================================================
//  BILATÉRALES — v17 (14/10/2026, Team Colin)
//   - Cadence de la direction : 1 bilatérale par semaine et par vendeur
//     minimum (cadenceJ 7, retard au-delà de 10 j) ; période par défaut =
//     semaine en cours, preset « Cette semaine ».
//   - Mobile : suivi de l'équipe en cartes, périmètre réduit à l'essentiel.
//   - Fiche ouverte depuis l'agenda : tuile Transformation complétée après
//     chargement ; heure de mise à jour en heure de Paris.
// ============================================================================
//  BILATÉRALES — v6 (14/10/2026, Team Colin) — préparation de la revue du 14/10
//
//  1. LA FICHE A TOUJOURS SES CHIFFRES. get_vendeur_synthese dépassait le
//     délai d'exécution : « Indicateurs indisponibles : canceling statement
//     due to statement timeout ». Les chiffres de tête viennent désormais de
//     dash_lire — précalculé, le même que l'accueil, donc les mêmes nombres
//     que « L'écart le plus important est celui de … ». Le détail (pipeline,
//     RDV, leads, clos) arrive section par section (bilat_synthese_part) ;
//     une section lente affiche « Réessayer » sans bloquer les autres.
//  2. PAS DE RÉALISATION DANS LE FUTUR. Une bilatérale à venir se réalise
//     par « Réaliser maintenant » : sa date est ramenée à l'instant présent
//     (bilat_realiser). Le serveur refuse le reste.
//  3. LA FILE « EN PRIORITÉ » EST CLASSÉE PAR UN SCORE EXPLICABLE :
//     40 % écart à l'objectif au prorata du mois, 25 % baisse de transfo
//     pondérée par le volume, 20 % ancienneté de la dernière bilatérale,
//     15 % discipline (engagements non tenus, relances et leads en retard).
//     Chaque ligne affiche sa RAISON PRINCIPALE. Le nombre de propales ne
//     sert plus qu'à départager. Filtre « Charge élevée » retiré (il gardait
//     tout le monde). Transfo affichée seulement au-delà d'un volume minimal.
//  4. PLANIFIER EN DEUX CLICS depuis chaque ligne, et « Mener maintenant ».
//  5. LE PÉRIMÈTRE CHOISI EST CONSERVÉ au retour de la fiche d'un vendeur.
//  6. LA FICHE OUVRE SUR LA REVUE DES ENGAGEMENTS, pré-remplit le bilan avec
//     les constats chiffrés, propose des engagements chiffrés et datés
//     (quoi / combien / pour quand), et le mode réunion met les chiffres en
//     grand avec le compte rendu en panneau latéral.
//  7. APRÈS L'ENREGISTREMENT : confirmation, prochaine bilatérale suggérée à
//     la cadence de la direction (BIL_CFG.cadenceJ), planifiable d'un clic.
//  Vocabulaire : « 2 derniers mois » au lieu de « Bimestre », « aucun
//  engagement pris » au lieu de « à constituer », « Fréquence », « Engagements
//  tenus ».
//  Prérequis SQL : bilaterales_02_fonctions_teamcolin.sql (fonctions bilat_*).
// ============================================================================
// ============================================================================
//  BILATÉRALES — module One Data (OD.define)  v1
//  Rendu dans __anchor ; client via ctx.supabase ; attente d'ancre et filets de
//  re-render retirés (le loader possède le cycle de vie).
//  Popup Réalisation : workflow WeWeb supprimé (WF_GET_FICHE) retiré, client via
//  sa variable + onglet via __odFicheTab, navigation par CHEMIN en prod.
// ============================================================================
// ============================================================================
//  PAGE BILATÉRALES — CRM360
//  Root : #bil-root. Données : RPC get_perimetre_sites + get_bilaterales.
//  Période : variables WeWeb partagées avec le dashboard (début / fin).
//  Flux : arbre périmètre (réseau>affaire>site) -> clic site -> tableau
//         vendeur×mois -> clic cellule -> timeline (profondeur réglable) ->
//         clic carte : modale si "realisee", sinon placeholder page réalisation.
// ============================================================================
OD.define('bilaterales', {
  async mount(__anchor, ctx) {
__anchor.id = 'bil-root';

// --- Variables WeWeb de période (MÊMES que le dashboard) --------------------
// VAR_DATE_FROM / VAR_DATE_TO retirees le 13/08/2026 : constantes mortes.
// Elles n'etaient declarees nulle part ailleurs dans ce fichier (grep verifie),
// vestige de l'epoque ou la periode transitait par des variables WeWeb
// partagees. Cette page pilote sa periode elle-meme via state.period.
// Variable WeWeb remplie par le bouton "Réaliser la Bilatérale" de l'agenda :
// si elle contient un id au chargement, on ouvre directement le popup de réalisation.
const VAR_ID_BILATE_REAL = '851fed59-9397-41ae-b91d-26daa2ff960a';

// --- Règles d'animation (réglables par tenant) -------------------------------
// cadenceJ : fréquence exigée par la direction entre deux bilatérales d'un même
//            vendeur ; sert à suggérer la prochaine date.
// retardJ  : au-delà, la cadence est « dépassée » (filtre, couleur, score).
// minVolumeTransfo : en dessous de ce nombre de propositions sur une période,
//            la transformation n'est pas affichée (0 % ou 100 % sur 2
//            propositions ne veut rien dire).
// Surcharge possible par ctx.tenant.config.bilaterales ou window.__OD_BIL_CFG.
const BIL_CFG = (function () {
  const base = { cadenceJ: 7, retardJ: 10, minVolumeTransfo: 8, transfoJours: 90 };  // Team Colin : 1 bilatérale par semaine et par vendeur minimum
  try { Object.assign(base, (ctx && ctx.tenant && ctx.tenant.config && ctx.tenant.config.bilaterales) || {}); } catch (e) {}
  try { Object.assign(base, window.__OD_BIL_CFG || {}); } catch (e) {}
  return base;
})();

function ymd(d) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), j = String(d.getDate()).padStart(2, '0');
  return y + '-' + m + '-' + j;
}
function readWwDate(id) {
  try {
    let v = wwLib.wwVariable.getValue(id);
    if (!v) return null;
    if (v instanceof Date) return ymd(v);
    v = String(v);
    const m = v.match(/^(\d{4}-\d{2}-\d{2})/);
    return m ? m[1] : null;
  } catch (e) { return null; }
}

const doc = __anchor.ownerDocument || document;
function getRoot() { return __anchor; }

// --- Viewer connecté (MÊME méthode que le dashboard : COLLECTION, pas variable) ---
function getViewerId() {
  if (window.__bilViewerId) return window.__bilViewerId;
  try {
    let uc = (((wwLib.getFrontWindow && wwLib.getFrontWindow()) || window).oropraUser); if (Array.isArray(uc)) uc = uc[0]; uc = uc || {};
    if (uc.ID_User != null) return Number(uc.ID_User);
  } catch (e) {}
  return null;
}
function getViewerName() {
  try {
    let uc = (((wwLib.getFrontWindow && wwLib.getFrontWindow()) || window).oropraUser); if (Array.isArray(uc)) uc = uc[0]; uc = uc || {};
    return uc.nomComplet || '';
  } catch (e) { return ''; }
}
// Rôle du viewer : Admin(1), Directeur(2), Chef ventes(3), Vendeur(4),
// Dir plaque(6), Dir marque(7), Dir groupe(8). La "direction" (>= directeur)
// accède à la vue d'évaluation des chefs des ventes.
const DIRECTION_ROLES = [1, 2, 6, 7, 8];
function getViewerRole() {
  try {
    let uc = (((wwLib.getFrontWindow && wwLib.getFrontWindow()) || window).oropraUser); if (Array.isArray(uc)) uc = uc[0]; uc = uc || {};
    if (uc.ID_Role != null) return Number(uc.ID_Role);
  } catch (e) {}
  return null;
}
function isDirection() { return DIRECTION_ROLES.includes(getViewerRole()); }
  // Vendeur (rôle 4) : interface personnelle, pas la vue chef/direction.
  const VENDEUR_ROLE = 4;
  // Interface personnelle pour tout rôle non manager (vendeur, opérateur
  // plateau) : miroir de public.role_est_manager(), 04/10/2026.
  function isVendeur() { const r = getViewerRole(); return r != null && ![1, 2, 3, 5, 6, 7, 8, 9].includes(r); }
  function daysSinceTs(ts) { if (!ts) return null; const d = new Date(String(ts).replace(' ', 'T')); if (isNaN(d)) return null; return Math.max(0, Math.floor((Date.now() - d.getTime()) / 86400000)); }

// --- État -------------------------------------------------------------------
const state = window.__bil || {};
{
  const now = new Date(), firstOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
  // Période AUTONOME : le sélecteur de dates de cette page pilote state.period.
  // On ignore volontairement les variables WeWeb partagées (pas de sélecteur externe
  // sur cette page). Défaut = du 1er du mois courant à aujourd'hui.
  //
  // TOUJOURS réinitialisée (13/08/2026), comme la navigation juste en dessous :
  // l'état vit sur window.__bil et survivrait sinon aux navigations SPA.
  // v17 : cadence hebdomadaire -> défaut = lundi de la semaine en cours -> aujourd'hui.
  const lundi = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  state.period = { from: ymd(BIL_CFG.cadenceJ <= 7 ? lundi : firstOfMonth), to: ymd(now) };
}
if (state.sites === undefined)   state.sites = null;   // périmètre (arbre)
if (state.bils === undefined)    state.bils = null;    // bilatérales détaillées
if (state.loading === undefined) state.loading = false;
if (state.error === undefined)   state.error = null;
// Navigation TOUJOURS réinitialisée à l'arrivée sur la page (arbre tout replié,
// aucune sélection) — sinon l'état persiste via window.__bil entre deux visites.
state.selSite = null;        // périmètre sélectionné (le plus profond non nul = niveau)
state.selReseau = null;
state.selAffaire = null;
state.expanded = {};         // dépli de l'arbre (sélecteur de périmètre)
state.chefFocus = null;      // équipe d'un chef ciblée dans l'onglet "Bilatérales du site"
state.view = 'main';         // 'main' (onglets contextuels) | 'timeline' (drill vendeur)
state.tab = 'site';          // onglet courant : 'site' (défaut, v14) | 'prio' | 'enc'
state.autoTargeted = false;  // refait l'auto-ciblage du périmètre à chaque arrivée
state.tlVend = null;
state.tlMonth = null;
state.tlDepth = 1;
state.cadence = null;
state.cadenceError = null;
state.prioFocus = 'tous';    // filtre de la file de priorité (rôle chef)
state.suiviSearch = '';
state.suiviSort = 'tenue';
state.tenueMap = null;
state.chefs = null;
state.chefsError = null;
state.chefSort = 'reg';
window.__bil = state;

// --- Utilitaires ------------------------------------------------------------
function esc(s){ if(s==null) return ''; return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;'); }
const MOIS_FR = ['janvier','février','mars','avril','mai','juin','juillet','août','septembre','octobre','novembre','décembre'];
const BP_CAL_SVG = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>';
function monthKey(d){ return d.slice(0,7); }                 // 'YYYY-MM' depuis un timestamp/date string
function monthLabel(key){ const [y,m]=key.split('-'); return MOIS_FR[Number(m)-1]; }
function monthsInRange(from, to){                            // liste des 'YYYY-MM' entre from et to inclus
  const a=[]; let d=new Date(from.slice(0,7)+'-01T00:00:00');
  const end=new Date(to.slice(0,7)+'-01T00:00:00');
  while(d<=end){ a.push(ymd(d).slice(0,7)); d=new Date(d.getFullYear(), d.getMonth()+1, 1); }
  return a;
}
function fmtDate(ts){ // '2026-05-19 17:00:00' -> '19 mai 2026'
  if(!ts) return ''; const d=new Date(ts.replace(' ','T'));
  return d.getDate()+' '+MOIS_FR[d.getMonth()]+' '+d.getFullYear();
}
function fmtHeure(ts){ if(!ts) return ''; const d=new Date(ts.replace(' ','T')); return String(d.getHours()).padStart(2,'0')+'h'+String(d.getMinutes()).padStart(2,'0'); }
function dureeMin(b){ // minutes depuis start/end (fiable), sinon null
  if(!b.start_date||!b.end_date) return null;
  const s=new Date(b.start_date.replace(' ','T')), e=new Date(b.end_date.replace(' ','T'));
  const m=Math.round((e-s)/60000); return (m>0&&m<600)?m:null;
}
// Statut fiabilisé (D) : réalisée dès qu'un champ du CR est rempli (résultat /
// actions / engagement), même si l'heure prévue n'est pas encore passée ; sinon
// programmée si à venir ; sinon en retard. Calculé côté JS pour ne pas dépendre
// de l'heuristique de get_bilaterales.
// Recette Team Colin 07/10/2026 (BIL-02) : un compte rendu saisi en avance
// (mode réunion ouvert avant l'heure) restait « non encore réalisé » et la
// carte ne passait jamais en Historique.
function computeStatut(b){
  const filled = (b.resultat && String(b.resultat).trim()) ||
                 (b.actions && String(b.actions).trim()) ||
                 (b.engagement && String(b.engagement).trim());
  if (filled) return 'realisee';
  // En retard seulement une fois l'entretien terminé (fin prévue, ou une
  // heure après le début) : une bilatérale en cours n'est pas en retard.
  const ts = x => x ? new Date(String(x).replace(' ','T')) : null;
  const fin = ts(b.end_date) || (b.start_date ? new Date(ts(b.start_date).getTime() + 3600000) : null);
  return (fin && fin > new Date()) ? 'programmee' : 'retard';
}
// Fin du mois d'une date 'YYYY-MM-..' -> 'YYYY-MM-JJ' (dernier jour du mois).
function endOfMonth(dstr){
  const d = new Date(dstr.slice(0,7) + '-01T00:00:00');
  const e = new Date(d.getFullYear(), d.getMonth()+1, 0);
  return ymd(e);
}

// --- Chargement RPC ---------------------------------------------------------
async function loadData() {
  window.__bilLoadData = loadData;
  const viewer = getViewerId();
  if (viewer == null) { state.error = 'Utilisateur non identifié'; render(); return; }
  if (state.loading) return;
  state.loading = true; state.error = null; render();
  try {
    const supabase = ctx.supabase;
    // Pour le suivi/timeline, on élargit la borne haute afin d'inclure les bilatérales
    // PROGRAMMÉES à venir — pas seulement dans le mois courant, mais aussi les mois
    // suivants — pour pouvoir les ouvrir et les réaliser depuis la timeline.
    const FUTURE_HORIZON_MOIS = 3;
    const _toD = new Date(state.period.to.slice(0, 7) + '-01T00:00:00');
    const bilTo = endOfMonth(ymd(new Date(_toD.getFullYear(), _toD.getMonth() + FUTURE_HORIZON_MOIS, 1)));
    // Borne BASSE élargie UNIQUEMENT pour get_bilaterales : la timeline / la réalisation
    // ont besoin de l'historique des bilatérales RÉALISÉES, qui sont antérieures à la
    // période en cours. On recule donc de HISTORIQUE_MOIS mois. Les RPC de cadence et de
    // chefs, eux, gardent state.period.from pour les KPI de couverture ("vus ce mois").
    const HISTORIQUE_MOIS = 12;
    const _fromD = new Date(state.period.from.slice(0, 7) + '-01T00:00:00');
    const bilFrom = ymd(new Date(_fromD.getFullYear(), _fromD.getMonth() - HISTORIQUE_MOIS, 1));
    const dir = isDirection();
    const auj = new Date();
    // Best effort : volumes de transfo et chiffres du tableau de bord. Leur
    // absence (SQL non appliqué, autre tenant) ne bloque jamais la page.
    const souple = (pr) => Promise.resolve(pr).catch(e => ({ data: null, error: e }));
    const moisPrec = new Date(auj.getFullYear(), auj.getMonth() - 1, 1);
    const [rTx, rVol, rDash, rDashPrec] = await Promise.all([
      souple(supabase.rpc('bilat_transfo', { p_viewer_id_user: viewer, p_jours: BIL_CFG.transfoJours })),
      souple(supabase.rpc('bilat_transfo_volumes', { p_viewer_id_user: viewer, p_date_from: state.period.from, p_date_to: state.period.to })),
      souple(lireDash(auj.getFullYear(), auj.getMonth() + 1)),
      souple(lireDash(moisPrec.getFullYear(), moisPrec.getMonth() + 1))
    ]);
    const [rPerimH, rMesEng] = await Promise.all([
      dir ? souple(supabase.rpc('get_agenda_perimeter', { p_viewer_id_user: viewer })) : Promise.resolve(null),
      isVendeur() ? souple(supabase.rpc('bilat_engagements_ouverts', { p_id_user: viewer, p_exclure_bilaterale: null })) : Promise.resolve(null)
    ]);
    state.perimH = (rPerimH && !rPerimH.error && Array.isArray(rPerimH.data)) ? rPerimH.data : null;
    state.mesEngagements = (rMesEng && !rMesEng.error && Array.isArray(rMesEng.data)) ? rMesEng.data : null;
    const [rSites, rBils, rCad, rTenue, rChefs] = await Promise.all([
      supabase.rpc('get_perimetre_sites', { p_viewer_id_user: viewer }),
      supabase.rpc('get_bilaterales', { p_viewer_id_user: viewer, p_date_from: bilFrom, p_date_to: bilTo }),
      supabase.rpc('get_cadence_bilaterales', { p_viewer_id_user: viewer, p_date_from: state.period.from, p_date_to: state.period.to }),
      supabase.rpc('get_bilaterale_tenue_vendeurs', { p_viewer_id_user: viewer }),
      dir ? supabase.rpc('get_chefs_bilaterales', { p_viewer_id_user: viewer, p_date_from: state.period.from, p_date_to: state.period.to })
          : Promise.resolve({ data: [], error: null })
    ]);
    if (rSites.error) throw rSites.error;
    if (rBils.error)  throw rBils.error;
    // La file de priorité est "best effort" : son échec n'empêche pas la page.
    if (rCad.error) {
      console.warn('[bilaterales] cadence', rCad.error);
      state.cadence = []; state.cadenceError = rCad.error.message || String(rCad.error);
    } else {
      state.cadence = (rCad.data || []).map(r => ({
        id_user: Number(r.id_user), nom_vendeur: r.nom_vendeur, vn_vo: (r.vn_vo || '').toUpperCase(),
        id_site: Number(r.id_site), nom_site: r.nom_site, affaire: r.affaire, reseau: r.reseau,
        last_bilaterale_at: r.last_bilaterale_at,
        next_bilaterale_at: r.next_bilaterale_at,
        jours_depuis_bilat: r.jours_depuis_bilat != null ? Number(r.jours_depuis_bilat) : null,
        nb_bilaterales_periode: Number(r.nb_bilaterales_periode || 0),
        nb_retard: Number(r.nb_retard || 0),
        rpv_en_retard: Number(r.rpv_en_retard || 0),
        nb_propales_ouvertes: Number(r.nb_propales_ouvertes || 0),
        transfo_actuel: r.transfo_actuel != null ? Number(r.transfo_actuel) : null,
        transfo_precedent: r.transfo_precedent != null ? Number(r.transfo_precedent) : null,
        transfo_tendance: Number(r.transfo_tendance || 0)
      }));
      state.cadenceError = null;
      // Volumes derrière la transfo : la tendance n'est retenue que si les deux
      // périodes ont assez de propositions (BIL_CFG.minVolumeTransfo).
      const vol = {};
      if (rVol && !rVol.error && Array.isArray(rVol.data)) rVol.data.forEach(v => { vol[Number(v.id_user)] = v; });
      state.volumesOk = !!(rVol && !rVol.error);
      // v8 : transformation STABLE (bilat_transfo) quand elle est disponible.
      // L'ancienne comptait les propositions par date de mise à jour : un
      // traitement en masse (549 propositions le 17/09/2026) faisait basculer
      // la « période précédente » d'un vendeur d'un jour à l'autre.
      const tx = {};
      state.transfoStable = !!(rTx && !rTx.error && Array.isArray(rTx.data));
      if (state.transfoStable) rTx.data.forEach(v => { tx[Number(v.id_user)] = v; });
      const taux = (g, t) => (t > 0 ? Math.round(1000 * g / t) / 10 : null);
      state.cadence.forEach(c => {
        if (state.transfoStable) {
          const v = tx[c.id_user];
          const g1 = v ? Number(v.gagnees_actuel || 0) : 0, t1 = v ? Number(v.tranchees_actuel || 0) : 0;
          const g0 = v ? Number(v.gagnees_precedent || 0) : 0, t0 = v ? Number(v.tranchees_precedent || 0) : 0;
          c.transfo_actuel = taux(g1, t1); c.transfo_precedent = taux(g0, t0);
          c.tx_tot_actuel = t1; c.tx_tot_precedent = t0;
          c.tx_ouvertes = v ? Number(v.ouvertes_actuel || 0) : 0;
        } else {
          const v = vol[c.id_user];
          c.tx_tot_actuel = v ? Number(v.tot_actuel || 0) : null;
          c.tx_tot_precedent = v ? Number(v.tot_precedent || 0) : null;
        }
        enrichirTransfo(c);
      });
      // v9 : une transformation n'a de sens que si des affaires PERDUES sont
      // enregistrées. Relevé du 14/10/2026 chez Team Colin : aucune sur 90
      // jours, toutes les transfos sortaient à 100 %. Dans ce cas, elle n'est
      // ni affichée ni comptée dans le score (remplacée par la part du
      // portefeuille à relancer).
      if (state.transfoStable) {
        const pertes = (rTx.data || []).reduce((s, v) => s + Number(v.tranchees_actuel || 0) - Number(v.gagnees_actuel || 0)
                                                         + Number(v.tranchees_precedent || 0) - Number(v.gagnees_precedent || 0), 0);
        state.txMesurable = pertes > 0;
      } else state.txMesurable = true;
      if (!state.txMesurable) state.cadence.forEach(c => {
        c.transfo_actuel = null; c.transfo_precedent = null; c.tx_signif = false; c.tx_signif_prec = false;
        c.transfo_baisse = false; c.transfo_hausse = false;
      });
    }
    // Chiffres du tableau de bord (dash_lire, mois en cours), par vendeur.
    state.dash = (rDash && !rDash.error && rDash.data) ? indexerDash(rDash.data) : null;
    // v12 : EFFECTIF. La file reprenait tout vendeur ayant un rapport ou une
    // bilatérale depuis 6 mois, y compris des vendeurs sortis (relevé du
    // 14/10/2026 : 4 vendeurs sans aucune ligne au tableau de bord). On ne
    // garde que ceux que l'accueil suit — présents dans dash_lire ce mois-ci
    // ou le mois dernier, dont l'effectif est celui de dashboard_tc_effectif.
    if (state.dash && Array.isArray(state.cadence)) {
      const suivis = new Set(Object.keys(state.dash.parUser).map(Number));
      if (rDashPrec && !rDashPrec.error && rDashPrec.data) Object.keys(indexerDash(rDashPrec.data).parUser).forEach(k => suivis.add(Number(k)));
      if (suivis.size) {
        state.horsEffectif = state.cadence.filter(c => !suivis.has(c.id_user)).map(c => c.nom_vendeur);
        state.cadence = state.cadence.filter(c => suivis.has(c.id_user));
      }
    }
    // Tenue des engagements par vendeur (toujours chargée)
    state.tenueMap = {};
    if (!rTenue.error) {
      (rTenue.data || []).forEach(r => {
        state.tenueMap[Number(r.id_user)] = {
          tenu: Number(r.eng_tenu || 0), partiel: Number(r.eng_partiel || 0),
          non_tenu: Number(r.eng_non_tenu || 0), en_cours: Number(r.eng_en_cours || 0)
        };
      });
    } else { console.warn('[bilaterales] tenue', rTenue.error); }
    // Évaluation des chefs (direction uniquement)
    if (rChefs.error) {
      console.warn('[bilaterales] chefs', rChefs.error);
      state.chefs = []; state.chefsError = rChefs.error.message || String(rChefs.error);
    } else {
      state.chefs = (rChefs.data || []).map(c => ({
        id_manager: Number(c.id_manager), nom_chef: c.nom_chef, nom_site: c.nom_site,
        team_size: Number(c.team_size || 0), vus_periode: Number(c.vus_periode || 0),
        couverture: Number(c.couverture || 0), volume: Number(c.volume || 0),
        delai_moyen: c.delai_moyen != null ? Number(c.delai_moyen) : null,
        eng: { tenu: Number(c.eng_tenu || 0), partiel: Number(c.eng_partiel || 0), non_tenu: Number(c.eng_non_tenu || 0), en_cours: Number(c.eng_en_cours || 0) },
        regularite: Array.isArray(c.regularite) ? c.regularite.map(x => Number(x)) : [0, 0, 0, 0, 0, 0]
      }));
      state.chefsError = null;
    }
    state.sites = (rSites.data || []).map(s => ({
      id_site: Number(s.id_site), nom_site: s.nom_site,
      id_affaire: s.id_affaire != null ? Number(s.id_affaire) : null,
      affaire: s.affaire || '(Sans affaire)', reseau: s.reseau || '(Sans réseau)'
    }));
    state.bils = (rBils.data || []).map(b => ({
      id: Number(b.id_bilaterales), id_user: Number(b.id_user), nom_vendeur: b.nom_vendeur,
      id_manager: Number(b.id_manager), nom_chef: b.nom_chef,
      id_site: Number(b.id_site), nom_site: b.nom_site,
      id_affaire: b.id_affaire != null ? Number(b.id_affaire) : null, affaire: b.affaire, reseau: b.reseau,
      vn_vo: (b.vn_vo || '').toUpperCase(),
      start_date: b.start_date, end_date: b.end_date, duree: b.duree,
      resultat: b.resultat, actions: b.actions, engagement: b.engagement,
      statut: computeStatut(b), mois: b.start_date ? monthKey(b.start_date) : null
    }));
    // v15 : encadrement recalculé (direction) sur la hiérarchie réelle.
    if (dir) state.chefs = construireChefs(state.chefs || []);
    // Auto-ciblage : si le périmètre est restreint, on déplie/cible directement
    // (un chef sur une seule affaire arrive sur cette affaire, pas sur la racine).
    autoTargetPerimetre();
  } catch (e) {
    console.error('[bilaterales] RPC', e);
    state.error = (e && e.message) ? e.message : String(e);
    state.sites = state.sites || []; state.bils = state.bils || [];
  } finally {
    state.loading = false; render();
    // Fiche ouverte depuis l'agenda avant la fin du chargement : on complète la
    // tuile Transformation sans reconstruire la fiche (la saisie en cours reste).
    try {
      if (typeof R !== 'undefined' && R.detail && !R.done) {
        if (!R.cad) R.cad = (state.cadence || []).find(x => x.id_user === Number(R.detail.id_user)) || null;
        const el = doc.getElementById('r-kpi-tx'); if (el) el.outerHTML = R_txTile();
      }
    } catch (e) {}
  }
}

// --- Chiffres du tableau de bord (dash_lire) ---------------------------------
// Même source que l'accueil : précalculée toutes les deux minutes, bornée au
// périmètre et à l'effectif visibles. ~30 ms. On l'agrège par vendeur (un
// vendeur présent sur deux sites n'a qu'une ligne).
const DASH_PROD = ['cdes','loueurs','hors_loueurs','fi','loa','roole','reprise','phev','vu','acc','obj_cdes','obj_fi'];
const DASH_ETAT = ['livr_attente','livr_retard','livr_semaine','livr_a_cloturer','pipe_affaires','pipe_fraiches',
  'pipe_a_relancer','pipe_froides','leads_attribues','leads_jamais','leads_jamais_48h','rdv_a_venir','rdv_tenus',
  'rdv_soldes','rapports','devis_jour','cdes_jour'];
const DASH_CACHE = {};
async function lireDash(annee, mois) {
  const k = annee + '-' + mois;
  if (DASH_CACHE[k] && Date.now() - DASH_CACHE[k].t < 120000) return { data: DASH_CACHE[k].data, error: null };
  const r = await ctx.supabase.rpc('dash_lire', { p_annee: annee, p_mois: mois });
  if (!r.error) DASH_CACHE[k] = { t: Date.now(), data: r.data };
  return r;
}
function indexerDash(j) {
  const n = x => (x == null || x === '' || isNaN(Number(x))) ? 0 : Number(x);
  const m = {};
  const prendre = (l) => { const k = Number(l.id_user); if (!m[k]) { m[k] = { id_user: k, nom: l.nom }; DASH_PROD.concat(DASH_ETAT).forEach(c => m[k][c] = 0); } return m[k]; };
  (j.vendeurs || []).forEach(l => { const v = prendre(l); DASH_PROD.forEach(c => v[c] += n(l[c])); });
  (j.etat || []).forEach(l => { const v = prendre(l); DASH_ETAT.forEach(c => v[c] += n(l[c])); });
  return { parUser: m, annee: n(j.annee), mois: n(j.mois), maj: j.maj || null };
}
function dashOf(idUser) { return (state.dash && state.dash.parUser[Number(idUser)]) || null; }
// Part du mois écoulée (jours calendaires) : l'objectif « attendu à date ».
function prorataMois(d) {
  d = d || new Date();
  const fin = new Date(d.getFullYear(), d.getMonth() + 1, 0).getDate();
  return Math.min(1, d.getDate() / fin);
}
function clamp01(x) { return Math.max(0, Math.min(1, Number(x) || 0)); }
function fmtNb(x, dec) { if (x == null || isNaN(x)) return '—'; return Number(x).toLocaleString('fr-FR', { maximumFractionDigits: dec == null ? 1 : dec, minimumFractionDigits: 0 }); }

// --- Transformation : une seule définition, une seule présentation ------------
// Définition : affaires gagnées / propositions mises à jour sur la période,
// comparées à la période précédente de même longueur (get_cadence_bilaterales).
// Elle n'est montrée que si le volume est suffisant ; la baisse n'est
// retenue qu'au-delà de 5 points.
function enrichirTransfo(c) {
  const min = BIL_CFG.minVolumeTransfo;
  const volConnu = c.tx_tot_actuel != null;
  c.tx_signif = volConnu ? (c.tx_tot_actuel >= min) : (c.transfo_actuel != null);
  c.tx_signif_prec = volConnu ? (c.tx_tot_precedent >= min) : (c.transfo_precedent != null);
  c.transfo_baisse = !!(c.tx_signif && c.tx_signif_prec && c.transfo_actuel != null && c.transfo_precedent != null
                        && c.transfo_actuel < c.transfo_precedent - 5);
  c.transfo_hausse = !!(c.tx_signif && c.tx_signif_prec && c.transfo_actuel != null && c.transfo_precedent != null
                        && c.transfo_actuel > c.transfo_precedent + 5);
}
function txUnite() { return state.transfoStable ? 'affaires tranchées' : 'prop.'; }
function txFenetre() { return state.transfoStable ? ' ' + BIL_CFG.transfoJours + ' j' : ''; }
function transfoTexte(c) {
  if (state.txMesurable === false) return 'Transfo non mesurable : aucune affaire perdue n’est enregistrée';
  if (!c || c.transfo_actuel == null) return 'Transfo' + txFenetre() + ' : aucune affaire ' + (state.transfoStable ? 'tranchée' : 'sur la période');
  if (!c.tx_signif) return 'Transfo' + txFenetre() + ' : volume insuffisant' + (c.tx_tot_actuel != null ? ' (' + c.tx_tot_actuel + ' ' + txUnite() + ')' : '');
  let t = 'Transfo' + txFenetre() + ' ' + fmtNb(c.transfo_actuel) + ' %';
  if (c.tx_signif_prec && c.transfo_precedent != null) t += ' (' + fmtNb(c.transfo_precedent) + ' % ' + (state.transfoStable ? 'les ' + BIL_CFG.transfoJours + ' j d’avant' : 'avant') + ')';
  if (c.tx_tot_actuel != null) t += ' · ' + c.tx_tot_actuel + ' ' + txUnite();
  return t;
}

// --- Encadrement (direction) — v15 ------------------------------------------
// get_chefs_bilaterales ne connaissait un chef que s'il avait des bilatérales
// sur 6 mois, et comptait son équipe avec les vendeurs hors effectif : base
// vierge = « Aucun chef des ventes ». On part désormais de la HIÉRARCHIE
// (get_agenda_perimeter : chefs des ventes et leurs sites), de l'EFFECTIF
// (vendeurs suivis par l'accueil) et des bilatérales RÉALISÉES chargées par
// la page. La tenue des engagements reste celle de la base.
function construireChefs(chefsBase) {
  const H = state.perimH;
  if (!H || !H.length) return chefsBase;
  const base = {}; chefsBase.forEach(c => { base[c.id_manager] = c; });
  const parChef = {};
  H.forEach(r => {
    if (Number(r.id_role) !== 3 || r.id_user == null) return;
    const k = Number(r.id_user);
    const o = parChef[k] || (parChef[k] = { id_manager: k, nom_chef: r.nom_complet || ('Chef ' + k), sites: new Set() });
    if (r.id_site != null) o.sites.add(Number(r.id_site));
  });
  const ids = Object.keys(parChef);
  if (!ids.length) return chefsBase;
  const debut = state.period.from, fin = state.period.to;
  const faites = (state.bils || []).filter(b => b.statut === 'realisee' && b.start_date);
  const auj = new Date();
  const moisCle = k => { const d = new Date(auj.getFullYear(), auj.getMonth() - k, 1); return ymd(d).slice(0, 7); };
  return ids.map(k => {
    const o = parChef[k];
    const equipe = (state.cadence || []).filter(c => o.sites.has(c.id_site));
    const eqIds = new Set(equipe.map(c => c.id_user));
    const n = eqIds.size;
    const siennes = faites.filter(b => b.id_manager === o.id_manager && eqIds.has(b.id_user));
    const dPer = siennes.filter(b => { const d = String(b.start_date).slice(0, 10); return d >= debut && d <= fin; });
    const vus = new Set(dPer.map(b => b.id_user)).size;
    const regularite = [5, 4, 3, 2, 1, 0].map(kk => {
      const m = moisCle(kk);
      const u = new Set(siennes.filter(b => String(b.start_date).slice(0, 7) === m).map(b => b.id_user)).size;
      return n ? Math.round(100 * u / n) : 0;
    });
    // délai moyen entre deux bilatérales d'un même vendeur
    const parV = {}; siennes.forEach(b => (parV[b.id_user] = parV[b.id_user] || []).push(new Date(String(b.start_date).replace(' ', 'T')).getTime()));
    const ecarts = []; Object.values(parV).forEach(l => { l.sort((a, b) => a - b); for (let i = 1; i < l.length; i++) ecarts.push((l[i] - l[i - 1]) / 86400000); });
    const b0 = base[o.id_manager] || {};
    const noms = [...o.sites].map(id => (siteOf(id) || {}).nom_site).filter(Boolean).sort();
    return {
      id_manager: o.id_manager, nom_chef: o.nom_chef,
      nom_site: noms.length > 1 ? noms[0] + ' + ' + (noms.length - 1) : (noms[0] || '—'),
      sites: [...o.sites],
      team_size: n, vus_periode: vus, couverture: n ? Math.round(100 * vus / n) : 0, volume: dPer.length,
      delai_moyen: ecarts.length ? Math.round(ecarts.reduce((a, b) => a + b, 0) / ecarts.length) : null,
      eng: b0.eng || { tenu: 0, partiel: 0, non_tenu: 0, en_cours: 0 },
      regularite
    };
  }).filter(c => c.team_size > 0);
}

// --- Rendu : coquille -------------------------------------------------------
function shell(inner){ return '<div class="bil">' + STYLE + inner + '</div>'; }

function render() {
  const root = getRoot(); if (!root) return;
  // Infobulle de l'agenda restée affichée après la navigation : retirée.
  try { const t = doc.getElementById('agenda-tip'); if (t) t.remove(); } catch (e) {}
  if (state.loading || state.sites === null) { root.innerHTML = shell('<div class="bil-load">Chargement des bilatérales…</div>'); return; }
  if (state.error) { root.innerHTML = shell('<div class="bil-err">Erreur : ' + esc(state.error) + '</div>'); return; }
  if (isVendeur()) { root.innerHTML = shell(renderVendeurSelf()); return; }
  if (activeTab() !== 'site') state.chefFocus = null;
  let body = renderPerimPanel();
  if (state.view === 'timeline') {
    body += renderTimeline();
  } else {
    body += renderTabs();
    const t = activeTab();
    if (t === 'prio')      body += renderPriorite();
    else if (t === 'site') body += renderSuivi();
    else if (t === 'enc')  body += renderChefs();
  }
  root.innerHTML = shell(body);
}

// Niveau du périmètre sélectionné (le plus profond non nul).
function scopeLevel() {
  if (state.selSite) return 'site';
  if (state.selAffaire) return 'affaire';
  if (state.selReseau) return 'reseau';
  return 'racine';
}
// Onglet effectif : retombe sur "prio" si l'onglet courant n'est pas disponible
// pour le périmètre / le rôle.
function activeTab() {
  let t = state.tab || 'site';
  if (t === 'enc' && !isDirection()) t = 'prio';
  return t;
}
function siteOf(id) { return (state.sites || []).find(s => s.id_site === id); }
// Filtre la file de cadence selon le périmètre sélectionné dans l'arbre (même logique
// que leaderboardEntities). Utilisé par la vue "En priorité" du chef pour que le clic
// sur un réseau / une affaire / un site mette à jour KPIs et liste.
function cadInScope() {
  const cad = state.cadence || [];
  const lvl = scopeLevel();
  if (lvl === 'racine') return cad;
  if (lvl === 'site') return cad.filter(c => c.id_site === state.selSite);
  const cadOf = (pred) => cad.filter(c => { const s = siteOf(c.id_site); return s && pred(s); });
  if (lvl === 'reseau') return cadOf(s => s.reseau === state.selReseau);
  if (lvl === 'affaire') { const rk = state.selReseau, ak = String(state.selAffaire.key); return cadOf(s => s.reseau === rk && String(s.id_affaire) === ak); }
  return cad;
}
// Bilatérales EN RETARD "ouvertes" sur la période : passées (start_date < now, donc
// statut 'retard' = ni résultat, ni actions, ni engagement), et NON suivies d'une
// bilatérale RÉALISÉE pour le même vendeur — une réalisée postérieure solde le retard.
// La recherche de "réalisée postérieure" se fait sur tout l'historique chargé (12 mois),
// pas seulement sur la période, pour ne pas compter un retard déjà rattrapé.
function retardsOuvertsPeriode() {
  const bils = state.bils || [];
  const debM = state.period.from.slice(0, 7), finM = state.period.to.slice(0, 7);
  const lastReal = {}; // id_user -> start_date de sa dernière bilatérale réalisée
  for (const b of bils) {
    if (b.statut === 'realisee' && b.start_date && (!lastReal[b.id_user] || b.start_date > lastReal[b.id_user])) {
      lastReal[b.id_user] = b.start_date;
    }
  }
  return bils.filter(b => b.statut === 'retard' && b.mois && b.mois >= debM && b.mois <= finM &&
    (!lastReal[b.id_user] || b.start_date > lastReal[b.id_user]));
}
function scopeLabel() {
  const lvl = scopeLevel();
  if (lvl === 'site') { const s = siteOf(state.selSite); return s ? s.nom_site : 'Site'; }
  if (lvl === 'affaire') return state.selAffaire.label;
  if (lvl === 'reseau') return state.selReseau;
  return 'Tout mon périmètre';
}

// Sélecteur de périmètre : l'arbre est toujours visible, tout s'adapte au clic.

  // ===== INTERFACE VENDEUR (rôle 4) : "Mes bilatérales", lecture seule =====
  function renderVendeurSelf() {
    const me = getViewerId();
    const name = getViewerName() || 'Moi';
    // La vue vendeur reste scopée sur la PÉRIODE en cours (+ ses programmées à venir),
    // indépendamment de l'historique élargi chargé pour la timeline/réalisation, afin que
    // le libellé "période en cours" et le compteur "sur la période" restent exacts.
    const _debMois = state.period.from.slice(0, 7);
    const mine = (state.bils || []).filter(b => b.id_user === me && b.mois && b.mois >= _debMois)
      .sort((a, b) => (b.start_date || '').localeCompare(a.start_date || ''));
    const realised = mine.filter(b => b.statut === 'realisee');
    const future = mine.filter(b => b.statut === 'programmee').sort((a, b) => (a.start_date || '').localeCompare(b.start_date || ''));
    const retard = mine.filter(b => b.statut === 'retard');
    const last = realised[0] || null;
    const next = future[0] || null;
    const eng = (state.tenueMap || {})[me] || null;
    const tp = tenuePctOf(eng);

    let h = '<div class="prio-head">Mes bilatérales <span class="prio-sub">' + esc(name) + ' · période en cours</span></div>';
    h += '<div class="prio-kpis">';
    if (last) {
      const j = daysSinceTs(last.start_date); const col = j == null ? '#8b99b0' : (j <= BIL_CFG.cadenceJ ? '#00997f' : (j <= BIL_CFG.retardJ ? '#8a6d1f' : '#c0524f'));
      h += '<div class="pk"><div class="pk-v" style="font-size:18px;color:' + col + '">' + esc(fmtDate(last.start_date)) + '</div><div class="pk-l">dernière bilatérale</div><div class="pk-s">' + (j == null ? '' : 'il y a ' + j + ' j') + (last.nom_chef ? ' · ' + esc(last.nom_chef) : '') + '</div></div>';
    } else {
      h += '<div class="pk"><div class="pk-v" style="color:#c0524f">—</div><div class="pk-l">dernière bilatérale</div><div class="pk-s">aucune reçue</div></div>';
    }
    if (next) {
      h += '<div class="pk"><div class="pk-v" style="font-size:18px;color:#2a5ea9">' + esc(fmtDate(next.start_date)) + '</div><div class="pk-l">prochaine</div><div class="pk-s">' + fmtHeure(next.start_date) + (next.nom_chef ? ' · ' + esc(next.nom_chef) : '') + '</div></div>';
    } else {
      h += '<div class="pk"><div class="pk-v" style="color:#9bb3d1">à planifier</div><div class="pk-l">prochaine</div><div class="pk-s">aucune programmée</div></div>';
    }
    h += '<div class="pk"><div class="pk-v" style="color:#2a5ea9">' + mine.length + '</div><div class="pk-l">sur la période</div><div class="pk-s">' + realised.length + ' réalisée' + (realised.length > 1 ? 's' : '') + (retard.length ? ' · ' + retard.length + ' en attente' : '') + '</div></div>';
    const tCol = tp == null ? '#8b99b0' : (tp >= 80 ? '#00997f' : (tp >= 60 ? '#8a6d1f' : '#c0524f'));
    h += '<div class="pk"><div class="pk-v" style="color:' + tCol + '">' + (tp == null ? '—' : tp + '%') + '</div><div class="pk-l">mes engagements tenus</div><div class="pk-s">sur 6 mois</div></div>';
    h += '</div>';
    // v15 : ce que le vendeur s'est engagé à faire, avec cible et échéance.
    const mesEng = state.mesEngagements || [];
    if (mesEng.length) {
      const auj = ymd(new Date());
      h += '<div class="bil-cat-title" style="color:#2a5ea9">Mes engagements en cours</div><div class="me-eng">' +
        mesEng.map(e => {
          const echu = e.echeance && String(e.echeance).slice(0, 10) < auj;
          return '<div class="me-row"><div class="me-lib">' + esc(e.libelle) + '</div>' +
            (e.cible != null && e.cible !== '' ? '<div class="me-cible">objectif <b>' + esc(String(e.cible)) + '</b></div>' : '') +
            (e.echeance ? '<div class="me-ech' + (echu ? ' echu' : '') + '">' + (echu ? 'échéance dépassée le ' : 'pour le ') + esc(fmtDate(String(e.echeance))) + '</div>' : '') + '</div>';
        }).join('') + '</div>';
    }
    h += renderSelfTimeline(mine);
    return h;
  }
  function renderSelfTimeline(list) {
    if (!list.length) return '<div class="bil-empty">Aucune bilatérale sur la période.</div>';
    let h = '<div class="bil-cat-title" style="color:#2a5ea9">Mes entretiens</div><div class="tl">';
    let i = 0;
    for (const b of list) {
      const side = i % 2 === 0 ? 'left' : 'right'; i++;
      const stTxt = b.statut === 'realisee' ? '✓ Réalisée' : (b.statut === 'programmee' ? '🗓 Programmée' : '⚠ En attente de CR');
      const meta = fmtHeure(b.start_date) + (b.end_date ? ' → ' + fmtHeure(b.end_date) : '');
      const prev = b.statut === 'realisee'
        ? esc((b.resultat || '').slice(0, 160))
        : '<i style="color:#8b99b0">Entretien ' + (b.statut === 'programmee' ? 'à venir' : 'à compléter par votre chef') + (b.nom_chef ? (' · ' + esc(b.nom_chef)) : '') + '.</i>';
      h += '<div class="tl-row ' + side + '">' +
        '<div class="tl-dot ' + b.statut + '"></div>' +
        '<div class="tl-date">' + fmtDate(b.start_date) + '</div>' +
        '<div class="tl-card" data-bil="' + b.id + '">' +
        '<div class="c-vend">avec ' + esc(b.nom_chef || '') + '</div>' +
        '<div class="c-meta">' + meta + '</div>' +
        '<div class="c-prev">' + prev + '</div>' +
        '<span class="c-status ' + b.statut + '">' + stTxt + '</span>' +
        '</div></div>';
    }
    h += '</div>';
    return h;
  }
  function openBilReadonly(b) {
    const root = getRoot(); if (!root) return;
    const meta = 'avec ' + esc(b.nom_chef || '') + ' · ' + fmtDate(b.start_date) + (b.start_date ? (', ' + fmtHeure(b.start_date)) : '');
    const statutLbl = b.statut === 'programmee' ? 'Programmée' : 'En attente de compte-rendu';
    const ov = doc.createElement('div'); ov.className = 'bil-ov'; ov.id = 'bil-ov';
    ov.innerHTML = '<div class="bil-modal"><div class="m-head"><div><div class="m-vend">Bilatérale ' + esc(statutLbl.toLowerCase()) + '</div>' +
      '<div class="m-meta">' + meta + '</div></div><button class="m-close" data-close="1">×</button></div>' +
      '<div class="m-body"><div class="m-sec res"><div class="s-lbl">Statut</div><div class="s-txt">' + esc(statutLbl) +
      (b.statut === 'retard' ? ' — le compte-rendu n\'a pas encore été saisi par votre chef des ventes.' : ' — entretien à venir.') + '</div></div></div></div>';
    root.appendChild(ov);
  }

  // Sélecteur de dates AUTONOME (au-dessus de l'arbre du périmètre).
  // Défaut : 1er du mois courant -> aujourd'hui. Pilote state.period puis recharge.
  // Sélecteur de dates AUTONOME : un seul calendrier, sélection de la plage en 2 clics.
  // 1er clic = début (en attente), 2e clic = fin -> applique la période et recharge.
  function renderDatePicker() {
    const trig = '<button class="bp-trigger" data-dp-toggle="1">' +
        '<span class="bp-cal-ico">' + BP_CAL_SVG + '</span>' +
        '<span class="bp-range-txt">' + esc(fmtDate(state.period.from)) + '<span class="bp-arrow">→</span>' + esc(fmtDate(state.period.to)) + '</span>' +
        '<span class="bp-chev">' + (state.dpOpen ? '▲' : '▼') + '</span>' +
      '</button>';
    let pop = '';
    if (state.dpOpen) {
      pop = '<div class="bp-backdrop" data-dp-close="1"></div>' +
        '<div class="bp-pop">' + renderCalendar() +
          '<div class="bp-pop-foot">' +
            '<span class="bp-hint">' + (state.dpStart ? 'Cliquez la date de <b>fin</b>' : 'Cliquez la date de <b>début</b>') + '</span>' +
            '<span class="bp-presets">' +
              '<button class="bp-preset" data-period-preset="semaine">Cette semaine</button>' +
              '<button class="bp-preset" data-period-preset="mois">Ce mois</button>' +
              '<button class="bp-preset" data-period-preset="3mois">3 mois</button>' +
              '<button class="bp-preset" data-period-preset="annee">Année</button>' +
            '</span>' +
          '</div>' +
        '</div>';
    }
    return '<div class="bil-period">' +
      '<span class="bp-lbl">Période analysée</span>' +
      '<div class="bp-wrap">' + trig + pop + '</div>' +
    '</div>';
  }

  // Grille calendrier du mois state.dpMonth (semaine commençant le lundi).
  function renderCalendar() {
    const mk = (state.dpMonth || state.period.from.slice(0, 7));
    const y = Number(mk.slice(0, 4)), m = Number(mk.slice(5, 7));
    const daysInMonth = new Date(y, m, 0).getDate();
    let startWd = new Date(y, m - 1, 1).getDay(); // 0=dim..6=sam
    startWd = (startWd + 6) % 7;                  // -> lundi=0
    const todayStr = ymd(new Date());
    const from = state.period.from, to = state.period.to, pend = state.dpStart;
    let h = '<div class="bp-cal">';
    h += '<div class="bp-cal-head">' +
         '<button class="bp-nav" data-dp-nav="prev" title="Mois précédent">‹</button>' +
         '<span class="bp-cal-title">' + MOIS_FR[m - 1] + ' ' + y + '</span>' +
         '<button class="bp-nav" data-dp-nav="next" title="Mois suivant">›</button>' +
         '</div>';
    h += '<div class="bp-cal-grid">';
    ['L', 'M', 'M', 'J', 'V', 'S', 'D'].forEach(d => h += '<span class="bp-wd">' + d + '</span>');
    for (let i = 0; i < startWd; i++) h += '<span class="bp-day empty"></span>';
    for (let d = 1; d <= daysInMonth; d++) {
      const ds = y + '-' + String(m).padStart(2, '0') + '-' + String(d).padStart(2, '0');
      let cls = 'bp-day';
      if (pend) { if (ds === pend) cls += ' pending'; }
      else if (from && to) {
        if (ds === from && ds === to) cls += ' sel-single';
        else if (ds === from) cls += ' sel-start';
        else if (ds === to) cls += ' sel-end';
        else if (ds > from && ds < to) cls += ' in-range';
      }
      if (ds === todayStr) cls += ' today';
      h += '<button class="' + cls + '" data-dp-day="' + ds + '">' + d + '</button>';
    }
    h += '</div></div>';
    return h;
  }

  function renderPerimPanel() {
  const lvl = scopeLevel();
  const chip = lvl === 'racine' ? '' : '<span class="pt-sel">' + esc(scopeLabel()) + '<b data-scope="racine" title="Revenir à tout le périmètre">✕</b></span>';
  return renderDatePicker() + '<div class="pt-card"><div class="pt-shead"><div class="bar"></div><div class="title">Périmètre</div>' + chip +
    '<div class="sub">Cliquez une ligne pour filtrer · ▶ pour déplier jusqu’aux vendeurs</div></div>' + renderTree() + '</div>';
}

// Onglets contextuels : En priorité (toujours), Bilatérales du site (si scope=site),
// Encadrement (directeurs+).
function renderTabs() {
  // v11 : « Suivi de l'équipe » est disponible à tous les niveaux du
  // périmètre. Il n'apparaissait qu'une fois un SITE choisi : au niveau
  // de l'affaire, le tableau semblait avoir disparu (14/10/2026).
  const t = activeTab();
  let h = '<div class="bil-tabs">';
  h += '<span class="bil-tab' + (t === 'site' ? ' on' : '') + '" data-tab="site">Suivi de l’équipe</span>';
  h += '<span class="bil-tab' + (t === 'prio' ? ' on' : '') + '" data-tab="prio">À recevoir en priorité</span>';
  if (isDirection()) h += '<span class="bil-tab' + (t === 'enc' ? ' on' : '') + '" data-tab="enc">Encadrement</span>';
  h += '</div>';
  return h;
}

// Score de priorité (0-100) — v6. Quatre composantes, chacune normalisée
// entre 0 et 1, pondérées 40 / 25 / 20 / 15. La composante qui pèse le plus
// devient la RAISON PRINCIPALE affichée sur la ligne : un chef doit
// comprendre en une seconde pourquoi ce vendeur passe en premier.
//   objectif   : retard sur l'objectif de commandes AU PRORATA du mois
//                (dash_lire, la source de l'accueil) ;
//   transfo    : baisse relative de la transformation, pondérée par le volume
//                (rien sous BIL_CFG.minVolumeTransfo propositions) ;
//   ancienneté : jours depuis la dernière bilatérale réalisée / BIL_CFG.retardJ
//                (jamais reçu = maximum) ;
//   discipline : le pire de — engagements non tenus, relances en retard,
//                leads jamais contactés depuis plus de 48 h, bilatérale
//                planifiée non tenue.
// Le nombre de propales ouvertes ne sert plus qu'à départager deux ex aequo.
const POIDS = { objectif: 40, transfo: 25, anciennete: 20, discipline: 15 };
function prioDetail(c) {
  const K = dashOf(c.id_user);
  const r = { c, K, comps: {}, txt: {}, score: 0, main: null };
  // Objectif
  if (K && K.obj_cdes > 0) {
    const att = K.obj_cdes * prorataMois();
    r.attendu = att; r.ecart = K.cdes - att;
    r.comps.objectif = clamp01((att - K.cdes) / K.obj_cdes);
    r.txt.objectif = (r.ecart < 0 ? 'Retard de ' + fmtNb(-r.ecart) + ' cmd sur l’objectif' : 'En avance de ' + fmtNb(r.ecart) + ' cmd') +
      ' (' + fmtNb(K.cdes, 0) + ' / ' + fmtNb(K.obj_cdes, 0) + ', attendu à date ' + fmtNb(att) + ')';
  } else { r.comps.objectif = 0; }
  // Transfo, ou à défaut (pertes non enregistrées) part du portefeuille à relancer
  if (state.txMesurable === false) {
    const aff = K ? (K.pipe_affaires || 0) : 0, rel = K ? (K.pipe_a_relancer || 0) : 0;
    r.comps.transfo = aff > 0 ? clamp01(rel / aff) * Math.min(1, aff / 10) : 0;
    r.txt.transfo = aff > 0 && rel > 0 ? rel + ' affaire' + (rel > 1 ? 's' : '') + ' sur ' + aff + ' à relancer (> 30 j)' : '';
  } else if (c.transfo_baisse && c.transfo_precedent > 0) {
    const poidsVol = Math.min(1, (c.tx_tot_actuel != null ? c.tx_tot_actuel : BIL_CFG.minVolumeTransfo) / 20);
    r.comps.transfo = clamp01((c.transfo_precedent - c.transfo_actuel) / c.transfo_precedent) * poidsVol;
    r.txt.transfo = 'Transfo' + txFenetre() + ' ' + fmtNb(c.transfo_precedent) + ' % → ' + fmtNb(c.transfo_actuel) + ' %';
  } else { r.comps.transfo = 0; }
  // Ancienneté
  const j = c.jours_depuis_bilat;
  r.comps.anciennete = j == null ? 1 : clamp01(j / BIL_CFG.retardJ);
  r.txt.anciennete = j == null ? 'Jamais reçu en bilatérale' : (j === 0 ? 'Reçu aujourd’hui' : j + ' j sans bilatérale');
  // Discipline
  const e = (state.tenueMap || {})[c.id_user];
  const pointes = e ? (e.tenu + e.partiel + e.non_tenu) : 0;
  const dis = [
    { v: pointes ? (e.non_tenu + 0.5 * e.partiel) / pointes : 0, t: e && e.non_tenu ? e.non_tenu + ' engagement' + (e.non_tenu > 1 ? 's' : '') + ' non tenu' + (e.non_tenu > 1 ? 's' : '') : '' },
    { v: (c.rpv_en_retard || 0) / 10, t: c.rpv_en_retard ? c.rpv_en_retard + ' relance' + (c.rpv_en_retard > 1 ? 's' : '') + ' en retard' : '' },
    { v: ((K && K.leads_jamais_48h) || 0) / 10, t: K && K.leads_jamais_48h ? K.leads_jamais_48h + ' lead' + (K.leads_jamais_48h > 1 ? 's' : '') + ' non contacté' + (K.leads_jamais_48h > 1 ? 's' : '') + ' > 48 h' : '' },
    { v: (c.nb_retard || 0) > 0 ? 1 : 0, t: c.nb_retard ? c.nb_retard + ' bilatérale' + (c.nb_retard > 1 ? 's' : '') + ' planifiée' + (c.nb_retard > 1 ? 's' : '') + ' non tenue' + (c.nb_retard > 1 ? 's' : '') : '' }
  ].sort((a, b) => b.v - a.v);
  r.comps.discipline = clamp01(dis[0].v);
  r.txt.discipline = dis[0].t;
  r.disAutres = dis.slice(1).filter(x => x.v > 0 && x.t).map(x => x.t);
  // Score et raison principale
  let best = null, bestV = 0;
  // Une raison partagée par TOUTE l'équipe affichée (ex. personne n'a encore
  // été reçu) ne distingue personne : elle compte dans le score mais ne
  // devient la raison principale qu'à défaut d'autre.
  Object.keys(POIDS).forEach(k => {
    const v = POIDS[k] * (r.comps[k] || 0); r.score += v;
    if (k === 'anciennete' && state.ancienneteCommune) return;
    if (v > bestV && r.txt[k]) { bestV = v; best = k; }
  });
  if (!best && r.comps.anciennete > 0 && r.txt.anciennete) best = 'anciennete';
  r.score = Math.round(r.score);
  r.main = best;
  return r;
}
function prioScore(c) { return prioDetail(c).score; }

// ÉTAPE 0 (landing) — file de priorité "qui recevoir"
// "En priorité" : direction -> classement des entités-filles du périmètre, des
// moins performantes aux plus performantes ; chef -> file de ses vendeurs.
function renderPriorite() {
  return isDirection() ? renderPrioLeaderboard() : renderPrioVendeurs();
}

// Agrégats d'une liste de vendeurs (cadence) : couverture + tenue.
// Reçu sur la période = une bilatérale RÉALISÉE dans la période. Le compteur
// de la base (nb_bilaterales_periode) comptait aussi les programmées.
function recuPeriode(c) {
  const d = c && c.last_bilaterale_at ? String(c.last_bilaterale_at).slice(0, 10) : null;
  return !!(d && d >= state.period.from && d <= state.period.to);
}
function entityMetrics(vs) {
  const total = vs.length;
  const vus = vs.filter(recuPeriode).length;
  const cov = total ? Math.round(100 * vus / total) : 0;
  let t = 0, p = 0, n = 0;
  vs.forEach(v => { const e = (state.tenueMap || {})[v.id_user]; if (e) { t += e.tenu; p += e.partiel; n += e.non_tenu; } });
  const d = t + p + n; const tenue = d ? Math.round(100 * (t + 0.5 * p) / d) : null;
  return { total, vus, cov, tenue };
}
function entityScore(m) { return m.tenue == null ? m.cov : Math.round(0.5 * m.cov + 0.5 * m.tenue); }
function chefScore(c) {
  const tp = tenuePctOf(c.eng); const reg = c.regularite.reduce((s, x) => s + x, 0) / 6;
  return Math.round(tp == null ? (0.6 * c.couverture + 0.4 * reg) : (0.4 * c.couverture + 0.4 * tp + 0.2 * reg));
}
function metricColor(p) { return p == null ? '#8b99b0' : (p >= 80 ? '#00997f' : (p >= 60 ? '#8a6d1f' : '#c0524f')); }
function scoreBg(s) { return s >= 80 ? 'rgba(83,189,167,.16)' : (s >= 60 ? 'rgba(250,192,85,.22)' : 'rgba(217,112,112,.13)'); }

// Construit les lignes de classement = enfants du périmètre courant.
function leaderboardEntities() {
  const lvl = scopeLevel();
  const sites = state.sites || [];
  const cad = state.cadence || [];
  const cadOf = (pred) => cad.filter(c => { const s = siteOf(c.id_site); return s && pred(s); });
  if (lvl === 'racine') {
    const reseaux = [...new Set(sites.map(s => s.reseau))].sort();
    return reseaux.map(rk => {
      const m = entityMetrics(cadOf(s => s.reseau === rk));
      const nbAff = new Set(sites.filter(s => s.reseau === rk).map(s => String(s.id_affaire))).size;
      return { type: 'reseau', key: rk, label: rk, sub: nbAff + ' affaire' + (nbAff > 1 ? 's' : ''), m, score: entityScore(m), scopeStr: 'reseau:' + rk };
    });
  }
  if (lvl === 'reseau') {
    const rk = state.selReseau;
    const affs = []; const seen = {};
    sites.filter(s => s.reseau === rk).forEach(s => { const k = String(s.id_affaire); if (!seen[k]) { seen[k] = true; affs.push({ key: k, label: s.affaire }); } });
    return affs.map(a => {
      const m = entityMetrics(cadOf(s => s.reseau === rk && String(s.id_affaire) === a.key));
      const nbSites = sites.filter(s => s.reseau === rk && String(s.id_affaire) === a.key).length;
      return { type: 'affaire', key: a.key, label: a.label, sub: nbSites + ' site' + (nbSites > 1 ? 's' : ''), m, score: entityScore(m), scopeStr: 'affaire:' + rk + '|' + a.key };
    });
  }
  if (lvl === 'affaire') {
    const rk = state.selReseau, ak = String(state.selAffaire.key);
    const ss = sites.filter(s => s.reseau === rk && String(s.id_affaire) === ak);
    return ss.map(s => {
      const m = entityMetrics(cad.filter(c => c.id_site === s.id_site));
      return { type: 'site', key: s.id_site, label: s.nom_site, sub: m.total + ' vendeur' + (m.total > 1 ? 's' : ''), m, score: entityScore(m), scopeStr: 'site:' + s.id_site };
    });
  }
  // site -> chefs des ventes de ce site
  const s = siteOf(state.selSite);
  const chefs = (state.chefs || []).filter(c => s && c.nom_site === s.nom_site);
  return chefs.map(c => {
    const tp = tenuePctOf(c.eng);
    return { type: 'chef', key: c.id_manager, label: c.nom_chef, sub: 'chef des ventes' + (c.team_size ? ' · ' + c.vus_periode + '/' + c.team_size + ' reçus' : ''), reg: c.regularite, m: { cov: c.couverture, tenue: tp }, score: chefScore(c), scopeStr: 'chef:' + c.id_manager };
  });
}

function renderPrioLeaderboard() {
  if (state.cadence === null) return '<div class="bil-empty">Chargement du classement…</div>';
  const lvl = scopeLevel();
  const childLbl = lvl === 'racine' ? 'réseaux' : (lvl === 'reseau' ? 'affaires' : (lvl === 'affaire' ? 'sites' : 'chefs des ventes'));
  const ents = leaderboardEntities().sort((a, b) => a.score - b.score);
  let h = '<div class="prio-head">En priorité <span class="prio-sub">' + childLbl + ' les moins performant·e·s · ' + esc(scopeLabel()) + '</span></div>';
  h += '<div class="hint-line">Classé·e·s par score d’animation &amp; tenue croissant — cliquez pour descendre d’un niveau.</div>';
  if (!ents.length) return h + '<div class="bil-empty">Aucune entité à classer dans ce périmètre.</div>';
  const showReg = lvl === 'site';
  h += '<div class="bil-hscroll"><div class="bil-hscroll-inner">';
  h += '<div class="lead-head"><div></div><div>' + (lvl === 'site' ? 'Chef des ventes' : childLbl.replace(/^./, x => x.toUpperCase())) + '</div><div>' + (showReg ? 'Régularité 6 mois' : '') + '</div><div>Couverture</div><div>Tenue</div><div></div></div>';
  h += '<div class="lead-list">';
  ents.forEach(e => {
    const sc = e.score, scCol = metricColor(sc);
    h += '<div class="lead-row" data-prio-ent="' + e.scopeStr + '">' +
      '<div class="lead-score" style="color:' + scCol + ';background:' + scoreBg(sc) + '">' + sc + '</div>' +
      '<div class="lead-name">' + esc(e.label) + '<span class="lead-sub">' + esc(e.sub) + '</span></div>' +
      '<div>' + (e.reg ? chefRegStrip(e.reg) : '<span class="lead-na">—</span>') + '</div>' +
      '<div class="lead-metric" style="color:' + metricColor(e.m.cov) + '"><span class="lm-l">couv.</span>' + e.m.cov + '%</div>' +
      '<div class="lead-metric" style="color:' + metricColor(e.m.tenue) + '"><span class="lm-l">tenue</span>' + (e.m.tenue == null ? '—' : e.m.tenue + '%') + '</div>' +
      '<div class="lead-chev">›</div></div>';
  });
  h += '</div>';
  h += '</div></div>';
  h += '<div class="bil-legend"><span class="lg">score = 40% couverture + 40% tenue + 20% régularité</span>' +
       (showReg ? regScaleLegend() : '') + '</div>';
  return h;
}

  // "En priorité" — rôle chef : file de SES vendeurs, classée par le score v6.
function renderPrioVendeurs() {
  if (state.cadence === null) return '<div class="bil-empty">Chargement de la file de priorité…</div>';
  if (state.cadenceError) return '<div class="bil-empty">File de priorité indisponible : ' + esc(state.cadenceError) + '</div>';
  const cad = cadInScope();
  if (!cad.length) return '<div class="bil-empty">Aucun vendeur actif dans ce périmètre sur la période.</div>';

  const isPlanifie = (c) => c.next_bilaterale_at != null;
  const isJamais = (c) => c.jours_depuis_bilat == null && !isPlanifie(c);
  // Cadence dépassée = déjà reçu mais trop ancien (> BIL_CFG.retardJ) OU bilatérale
  // planifiée non réalisée, et sans RDV déjà programmé.
  const isCadenceLate = (c) => !isPlanifie(c) && c.jours_depuis_bilat != null && (c.jours_depuis_bilat > BIL_CFG.retardJ || c.nb_retard > 0);

  state.ancienneteCommune = cad.length > 1 && cad.every(c => c.jours_depuis_bilat == null);
  const det = cad.map(prioDetail);
  const sousObj = (d) => (d.comps.objectif || 0) > 0.1;
  const total = cad.length;
  const vus = cad.filter(recuPeriode).length;
  const jamais = cad.filter(isJamais).length;
  const retardCad = cad.filter(isCadenceLate).length;
  const baisse = cad.filter(c => c.transfo_baisse).length;
  const planifieN = cad.filter(isPlanifie).length;
  const sousObjN = det.filter(sousObj).length;
  const pctVus = total ? Math.round(100 * vus / total) : 0;

  // Les vendeurs dont la bilatérale est déjà programmée passent en bas :
  // l'action est prise. Entre eux et entre les autres : score décroissant,
  // puis propales ouvertes.
  const sorted = det.slice().sort((a, b) => (isPlanifie(a.c) - isPlanifie(b.c)) || (b.score - a.score) || ((b.c.nb_propales_ouvertes || 0) - (a.c.nb_propales_ouvertes || 0)));
  const f = state.prioFocus === 'charge' ? 'tous' : (state.prioFocus || 'tous');
  const retardSet = new Set(retardsOuvertsPeriode().map(b => b.id_user));
  const retardN = cad.filter(c => retardSet.has(c.id_user)).length;
  const pass = (d) => { const c = d.c; return f === 'tous' ? true
    : f === 'jamais'   ? isJamais(c)
    : f === 'retard'   ? retardSet.has(c.id_user)
    : f === 'cadence'  ? isCadenceLate(c)
    : f === 'objectif' ? sousObj(d)
    : f === 'perf'     ? c.transfo_baisse
    : f === 'planifie' ? isPlanifie(c)
    : true; };

  let h = '<div class="prio-head">À recevoir en priorité <span class="prio-sub">' + esc(scopeLabel()) + ' · ' + total + ' vendeur' + (total > 1 ? 's' : '') + ' actif' + (total > 1 ? 's' : '') + '</span></div>';
  h += '<div class="prio-kpis">';
  h += '<div class="pk"><div class="pk-v" style="color:' + (pctVus >= 70 ? '#00997f' : (pctVus >= 40 ? '#8a6d1f' : '#c0524f')) + '">' + pctVus + '%</div><div class="pk-l">équipe reçue sur la période</div><div class="pk-s">' + vus + '/' + total + ' vendeurs</div></div>';
  h += '<div class="pk clik' + (f === 'jamais' ? ' on' : '') + '" data-priofilter="jamais"><div class="pk-v" style="color:' + (jamais ? '#c0524f' : '#00997f') + '">' + jamais + '</div><div class="pk-l">jamais reçus</div><div class="pk-s">aucune bilatérale</div></div>';
  h += '<div class="pk clik' + (f === 'cadence' ? ' on' : '') + '" data-priofilter="cadence"><div class="pk-v" style="color:' + (retardCad ? '#8a6d1f' : '#00997f') + '">' + retardCad + '</div><div class="pk-l">cadence dépassée</div><div class="pk-s">plus de ' + BIL_CFG.retardJ + ' j sans bilatérale</div></div>';
  if (state.dash) h += '<div class="pk clik' + (f === 'objectif' ? ' on' : '') + '" data-priofilter="objectif"><div class="pk-v" style="color:' + (sousObjN ? '#c0524f' : '#00997f') + '">' + sousObjN + '</div><div class="pk-l">en retard sur l’objectif</div><div class="pk-s">commandes, au prorata du mois</div></div>';
  else h += '<div class="pk"><div class="pk-v" style="color:' + (baisse ? '#c0524f' : '#00997f') + '">' + baisse + '</div><div class="pk-l">transfo en baisse</div><div class="pk-s">vs période précédente</div></div>';
  h += '</div>';

  const fchips = [['tous', 'Tous', total], ['objectif', 'Retard objectif', sousObjN], ['retard', 'Bilat. en retard', retardN], ['jamais', 'Jamais reçus', jamais], ['cadence', 'Cadence dépassée', retardCad], ['perf', 'Transfo en baisse', baisse], ['planifie', 'Bilat. programmée', planifieN]];
  h += '<div class="prio-chips">';
  fchips.forEach(([k, l, n]) => { if (n === 0 && k !== 'tous') return; const extra = (k === 'retard' ? ' retard' : ''); h += '<span class="prio-chip' + extra + (f === k ? ' on' : '') + '" data-priofilter="' + k + '">' + l + '<span class="pc-n">' + n + '</span></span>'; });
  h += '</div>';
  // Action immédiate : le premier vendeur à recevoir, et la semaine à planifier.
  const aFaire = sorted.filter(d => !isPlanifie(d.c));
  state.prioOrdre = aFaire.map(d => d.c);
  if (aFaire.length) {
    const d0 = aFaire[0];
    h += '<div class="next-box"><div class="nb-l">À recevoir en premier</div>' +
      '<div class="nb-main"><div><div class="nb-nom">' + esc(d0.c.nom_vendeur) + ' <span>' + esc(d0.c.nom_site) + '</span></div>' +
      '<div class="nb-why">' + esc([d0.main ? d0.txt[d0.main] : '', ...['objectif', 'transfo', 'discipline'].filter(k => k !== d0.main && d0.comps[k] > 0.15 && d0.txt[k]).map(k => d0.txt[k])].filter(Boolean).join(' · ')) + '</div></div>' +
      '<div class="nb-acts"><button class="pr-plan" data-plan-vend="' + d0.c.id_user + '|' + d0.c.id_site + '">Planifier</button>' +
      (aFaire.length > 1 ? '<button class="nb-batch" data-batch="1">📅 Planifier les ' + Math.min(5, aFaire.length) + ' premiers</button>' : '') + '</div></div></div>';
  }
  h += '<details class="hint-det"><summary>Comment est calculé le classement ?</summary><div>Score sur 100 : <b>40</b> retard sur l’objectif de commandes au prorata du mois · <b>25</b> ' +
    (state.txMesurable === false ? 'part du portefeuille à relancer (> 30 j) — la transformation n’est pas mesurable tant que les affaires perdues ne sont pas enregistrées' : 'baisse de la transformation sur ' + BIL_CFG.transfoJours + ' jours') +
    ' · <b>20</b> ancienneté de la dernière bilatérale (plafond ' + BIL_CFG.retardJ + ' j) · <b>15</b> discipline : engagements non tenus, relances en retard, leads non contactés depuis 48 h. Les vendeurs dont la bilatérale est déjà programmée passent en bas de liste. La raison qui pèse le plus est affichée en bleu.</div></details>';

  // v14 : liste en tableau sobre. Une ligne = rang, vendeur, POURQUOI (la
  // raison principale en clair, les autres en gris), dernière bilatérale,
  // score en barre, action. Plus de pastilles colorées en série.
  const shown = sorted.filter(pass);
  h += '<div class="pq">';
  h += '<div class="pq-row pq-head"><div>#</div><div>Vendeur</div><div>Pourquoi le recevoir</div><div>Dernière bilatérale</div><div>Priorité</div><div></div></div>';
  if (!shown.length) h += '<div class="bil-empty">Aucun vendeur pour ce filtre.</div>';
  shown.forEach((d, i) => {
    const c = d.c;
    const planifie = isPlanifie(c);
    const autres = ['objectif', 'transfo', 'discipline', 'anciennete']
      .filter(k => k !== d.main && d.comps[k] > 0.15 && d.txt[k] && !(k === 'anciennete' && state.ancienneteCommune))
      .map(k => d.txt[k]).concat((d.disAutres || []).slice(0, 1));
    if (c.nb_propales_ouvertes > 0) autres.push(c.nb_propales_ouvertes + ' propale' + (c.nb_propales_ouvertes > 1 ? 's' : '') + ' ouverte' + (c.nb_propales_ouvertes > 1 ? 's' : ''));
    const crit = d.main === 'objectif' || d.main === 'transfo' || d.main === 'discipline';
    let derniere;
    if (planifie) derniere = '<span class="pq-planif">Programmée le ' + esc(fmtJJMM(c.next_bilaterale_at)) + '</span>';
    else if (c.jours_depuis_bilat == null) derniere = '<span class="pq-jamais">Jamais</span>';
    else derniere = '<span class="' + (c.jours_depuis_bilat > BIL_CFG.retardJ ? 'pq-jamais' : (c.jours_depuis_bilat > BIL_CFG.cadenceJ ? 'pq-warn' : 'pq-ok')) + '">' + (c.jours_depuis_bilat === 0 ? 'Aujourd’hui' : 'Il y a ' + c.jours_depuis_bilat + ' j') + '</span>';
    const sc = d.score, niv = sc >= 50 ? 'haut' : (sc >= 30 ? 'moyen' : 'bas');
    h += '<div class="pq-row' + (planifie ? ' is-planif' : '') + '" data-prio-vend="' + c.id_user + '|' + c.id_site + '">' +
      '<div class="pq-rang">' + (i + 1) + '</div>' +
      '<div class="pq-who"><b>' + esc(c.nom_vendeur) + '</b><span>' + esc(c.nom_site) + (c.vn_vo ? ' · ' + esc(c.vn_vo) : '') + '</span></div>' +
      '<div class="pq-why"><div class="pq-main' + (crit ? ' crit' : '') + '">' + esc(d.main ? d.txt[d.main] : 'À jour') + '</div>' +
        (autres.length ? '<div class="pq-sub">' + autres.map(esc).join(' · ') + '</div>' : '') + '</div>' +
      '<div class="pq-last">' + derniere + '</div>' +
      '<div class="pq-score ' + niv + '" title="Score de priorité sur 100"><b>' + sc + '</b><i><u style="width:' + Math.max(4, sc) + '%"></u></i></div>' +
      '<div class="pq-act">' + (planifie ? '<span class="pq-ok">Programmée</span>' : '<button class="pq-plan" data-plan-vend="' + c.id_user + '|' + c.id_site + '">Planifier</button>') + '</div>' +
    '</div>';
  });
  h += '</div>';
  return h;
}
function fmtJJMM(ts) { const t = String(ts || ''); return t.length >= 10 ? t.slice(8, 10) + '/' + t.slice(5, 7) : ''; }

// Auto-ciblage du périmètre à l'arrivée : si l'utilisateur n'a qu'un réseau
// (et/ou une affaire, un site), on déplie directement jusqu'au niveau pertinent.
function autoTargetPerimetre() {
  if (state.autoTargeted) return; // une seule fois par session de page
  state.autoTargeted = true;
  const sites = state.sites || [];
  if (!sites.length) return;
  const reseaux = [...new Set(sites.map(s => s.reseau))];

  // Périmètre restreint (≤ 6 sites, typiquement un chef des ventes) :
  // on déplie TOUT l'arbre (réseaux + affaires) pour voir directement les sites.
  if (sites.length <= 6) {
    for (const s of sites) {
      state.expanded['r:' + s.reseau] = true;
      state.expanded['r:' + s.reseau + '|a:' + String(s.id_affaire)] = true;
    }
    // Sélections pour le fil d'Ariane si tout est dans un seul réseau/affaire
    if (reseaux.length === 1) {
      state.selReseau = reseaux[0];
      const affaires = [...new Set(sites.map(s => String(s.id_affaire)))];
      if (affaires.length === 1) {
        const sAff = sites[0];
        state.selAffaire = { key: String(sAff.id_affaire), label: sAff.affaire };
      }
    }
    // Un seul site -> sélectionné comme périmètre (l'onglet reste "En priorité").
    if (sites.length === 1) { state.selSite = sites[0].id_site; }
    return;
  }

  // Périmètre large : repli intelligent (réseau unique -> déplié, etc.)
  if (reseaux.length === 1) {
    const rk = reseaux[0];
    state.expanded['r:' + rk] = true;
    state.selReseau = rk;
    const affaires = [...new Set(sites.filter(s => s.reseau === rk).map(s => String(s.id_affaire)))];
    if (affaires.length === 1) {
      const ak = affaires[0];
      state.expanded['r:' + rk + '|a:' + ak] = true;
      const sAff = sites.find(s => s.reseau === rk && String(s.id_affaire) === ak);
      state.selAffaire = { key: ak, label: sAff ? sAff.affaire : ak };
      const sitesAff = sites.filter(s => s.reseau === rk && String(s.id_affaire) === ak);
      if (sitesAff.length === 1) {
        state.selSite = sitesAff[0].id_site;
      }
    }
  }
}

// ÉTAPE 1 — arbre périmètre (réseau > affaire > site), avec compteur de bilatérales
// v16 : le périmètre reprend le composant des pages Performances et Suivi
// d'activité — carte à liseré, tableau-arbre réseau ▸ affaire ▸ site ▸
// vendeurs, carrés ▶/▼, ligne choisie surlignée — avec des colonnes propres
// aux bilatérales. Un niveau unique (un seul réseau, une seule affaire) est
// aplati, comme là-bas.
function statsNoeud(pred) {
  const vs = (state.cadence || []).filter(c => { const s = siteOf(c.id_site); return s && pred(s); });
  const ids = new Set(vs.map(v => v.id_user));
  const recus = new Set(vs.filter(recuPeriode).map(v => v.id_user)).size;
  const jamais = new Set(vs.filter(v => v.jours_depuis_bilat == null).map(v => v.id_user)).size;
  const prog = new Set(vs.filter(v => v.next_bilaterale_at).map(v => v.id_user)).size;
  const sitesIds = new Set((state.sites || []).filter(pred).map(s => s.id_site));
  const retard = retardsOuvertsPeriode().filter(b => sitesIds.has(b.id_site)).length;
  return { total: ids.size, recus, jamais, prog, retard };
}
function cellulesNoeud(st) {
  const p = st.total ? Math.round(100 * st.recus / st.total) : null;
  const col = p == null ? '#acc5e4' : (p >= 80 ? '#53bda7' : (p >= 40 ? '#fac055' : '#d97070'));
  const txt = p == null ? '#7a9cc4' : (p >= 80 ? '#00997f' : (p >= 40 ? '#8a6d1f' : '#c0524f'));
  return '<td class="pt-n">' + st.total + '</td>' +
    '<td><div class="pt-cell"><div class="pt-top"><span class="pt-ro">' + st.recus + ' / ' + st.total + '</span>' +
      (p == null ? '' : '<span class="pt-pct" style="color:' + txt + ';background:' + col + '26">' + p + ' %</span>') + '</div>' +
      '<div class="pt-track"><i style="width:' + (p || 0) + '%;background:' + col + '"></i></div></div></td>' +
    '<td class="pt-n">' + (st.prog || '<span class="pt-0">0</span>') + '</td>' +
    '<td class="pt-n' + (st.jamais ? ' pt-ko' : '') + '">' + (st.jamais || '<span class="pt-0">0</span>') + '</td>' +
    '<td class="pt-n' + (st.retard ? ' pt-ko' : '') + '">' + (st.retard || '<span class="pt-0">0</span>') + '</td>';
}
function expIcon(open) { return '<span class="pt-exp">' + (open ? '▼' : '▶') + '</span>'; }
function renderTree() {
  const sites = state.sites || [];
  if (!sites.length) return '<div class="bil-empty">Aucun site dans votre périmètre.</div>';
  const lvl = scopeLevel();
  const reseaux = [...new Set(sites.map(s => s.reseau))].sort();
  const collapseR = reseaux.length === 1;
  let body = '';
  for (const rk of reseaux) {
    const rKey = 'r:' + rk, rOpen = !!state.expanded[rKey] || collapseR;
    const rSel = lvl === 'reseau' && state.selReseau === rk;
    if (!collapseR) body += '<tr class="lv-reseau' + (rSel ? ' is-selected' : '') + '" data-scope="reseau:' + esc(rk) + '"><td><span data-exp="' + esc(rKey) + '">' + expIcon(rOpen) + '</span>' + esc(rk) + '</td>' + cellulesNoeud(statsNoeud(s => s.reseau === rk)) + '</tr>';
    if (!rOpen) continue;
    const affs = []; const vu = {};
    sites.filter(s => s.reseau === rk).forEach(s => { const k = String(s.id_affaire); if (!vu[k]) { vu[k] = 1; affs.push({ key: k, label: s.affaire }); } });
    const collapseA = collapseR && affs.length === 1;
    for (const A of affs.sort((x, y) => String(x.label).localeCompare(String(y.label), 'fr'))) {
      const aKey = rKey + '|a:' + A.key, aOpen = !!state.expanded[aKey] || collapseA;
      const aSel = lvl === 'affaire' && state.selReseau === rk && String(state.selAffaire.key) === A.key;
      if (!collapseA) body += '<tr class="lv-affaire' + (aSel ? ' is-selected' : '') + '" data-scope="affaire:' + esc(rk) + '|' + esc(A.key) + '"><td><span data-exp="' + esc(aKey) + '">' + expIcon(aOpen) + '</span>' + esc(A.label) + '</td>' + cellulesNoeud(statsNoeud(s => s.reseau === rk && String(s.id_affaire) === A.key)) + '</tr>';
      if (!aOpen) continue;
      for (const S of sites.filter(s => s.reseau === rk && String(s.id_affaire) === A.key).sort((x, y) => x.nom_site.localeCompare(y.nom_site, 'fr'))) {
        const sKey = aKey + '|s:' + S.id_site, sOpen = !!state.expanded[sKey];
        const sSel = lvl === 'site' && state.selSite === S.id_site;
        body += '<tr class="lv-site' + (sSel ? ' is-selected' : '') + (collapseA ? ' flat' : '') + '" data-scope="site:' + S.id_site + '"><td><span data-exp="' + esc(sKey) + '">' + expIcon(sOpen) + '</span>' + esc(S.nom_site) + '</td>' + cellulesNoeud(statsNoeud(s => s.id_site === S.id_site)) + '</tr>';
        if (!sOpen) continue;
        const vend = (state.cadence || []).filter(c => c.id_site === S.id_site).sort((x, y) => (x.nom_vendeur || '').localeCompare(y.nom_vendeur || '', 'fr'));
        if (!vend.length) body += '<tr class="lv-vendeur' + (collapseA ? ' flat' : '') + '"><td class="pt-vide">Aucun vendeur actif</td><td colspan="5"></td></tr>';
        vend.forEach(c => {
          const recu = recuPeriode(c);
          const etat = recu ? '<span class="pt-ok">reçu</span>' : (c.next_bilaterale_at ? '<span class="pt-prog">programmé le ' + esc(fmtJJMM(c.next_bilaterale_at)) + '</span>' : (c.jours_depuis_bilat == null ? '<span class="pt-ko">jamais reçu</span>' : '<span class="pt-mut">il y a ' + c.jours_depuis_bilat + ' j</span>'));
          body += '<tr class="lv-vendeur' + (collapseA ? ' flat' : '') + '" data-prio-vend="' + c.id_user + '|' + c.id_site + '"><td>' + esc(c.nom_vendeur) + (c.vn_vo ? ' <span class="fct">· ' + esc(c.vn_vo) + '</span>' : '') + '</td>' +
            '<td colspan="5" class="pt-etat">' + etat + '</td></tr>';
        });
      }
    }
  }
  return '<div class="pt-wrap"><table class="pt-tree"><thead><tr><th>Périmètre</th><th>Vendeurs</th><th>Reçus sur la période</th><th>Programmés</th><th>Jamais reçus</th><th>CR en retard</th></tr></thead><tbody>' + body + '</tbody></table></div>';
}

// ============================================================================
//  Tableau "rythme & tenue" (vendeurs) + vue "Chefs des ventes" (direction)
// ============================================================================
function tenuePctOf(e){
  if(!e) return null;
  const d=(e.tenu||0)+(e.partiel||0)+(e.non_tenu||0);
  return d ? Math.round(100*((e.tenu||0)+0.5*(e.partiel||0))/d) : null;
}
function regColor(p){
  if(p<=0) return null;        // aucune bilatérale ce mois -> case "vide" (hachurée)
  if(p<30) return '#d97070';   // rouge   : couverture faible
  if(p<55) return '#d2941f';   // orange foncé
  if(p<75) return '#fac055';   // orange/jaune
  if(p<90) return '#8fd3c4';   // vert tendre
  return '#53bda7';            // vert    : couverture élevée
}
// Légende de l'échelle de couleurs de la heatmap de régularité.
function regScaleLegend(){
  return '<span class="lg">Couverture du mois&nbsp;: '+
    '<span class="sw" style="background:#d97070"></span>'+
    '<span class="sw" style="background:#d2941f"></span>'+
    '<span class="sw" style="background:#fac055"></span>'+
    '<span class="sw" style="background:#8fd3c4"></span>'+
    '<span class="sw" style="background:#53bda7"></span>'+
    ' <span style="color:#9bb3d1">faible &#8594; élevée</span></span>'+
    '<span class="lg"><span class="sw" style="background:#eef2f8;border:1px dashed #cfd9e9"></span>aucune bilatérale</span>';
}
function reg6Months(){ const out=[]; const d=new Date(); for(let k=5;k>=0;k--){ const m=new Date(d.getFullYear(), d.getMonth()-k, 1); out.push({ ini: MOIS_FR[m.getMonth()].charAt(0).toUpperCase(), nom: MOIS_FR[m.getMonth()] }); } return out; }

// --- cellules du tableau vendeurs ---
function vendeurRythmeCell(c){
  const jd=c.jours_depuis_bilat, planif=c.next_bilaterale_at!=null;
  let dotCls='none', dLabel='<span class="d">Jamais reçu</span>';
  if(jd!=null){ dotCls=jd<=BIL_CFG.cadenceJ?'ok':(jd<=BIL_CFG.retardJ?'warn':'late'); dLabel='<span class="d">'+esc(fmtDate(c.last_bilaterale_at))+'</span> <span class="k">· '+(jd===0?'aujourd’hui':'il y a '+jd+' j')+'</span>'; }
  const next=planif?'<span class="rnext">RDV '+esc(fmtDate(c.next_bilaterale_at))+'</span>':'<span class="rnext todo">à planifier</span>';
  return '<div class="rythme"><div><span class="rdot '+dotCls+'"></span>'+dLabel+'</div><div>'+next+'</div></div>';
}
function vendeurTenueCell(c){
  const e=c.eng||{}; const d=(e.tenu||0)+(e.partiel||0)+(e.non_tenu||0); const pct=tenuePctOf(e);
  if(d===0 && (e.en_cours||0)===0) return '<div class="tcell empty"><span class="acons"><span class="ph"></span> aucun engagement pris</span></div>';
  const tot=(d+(e.en_cours||0))||1, w=k=>Math.round(100*k/tot)+'%';
  const bar='<div class="tbar">'+
    (e.tenu?'<i class="seg-t" style="width:'+w(e.tenu)+'"></i>':'')+
    (e.partiel?'<i class="seg-p" style="width:'+w(e.partiel)+'"></i>':'')+
    (e.non_tenu?'<i class="seg-n" style="width:'+w(e.non_tenu)+'"></i>':'')+
    (e.en_cours?'<i class="seg-c" style="width:'+w(e.en_cours)+'"></i>':'')+'</div>';
  const col=pct==null?'#8b99b0':(pct>=80?'#00997f':(pct>=60?'#8a6d1f':'#c0524f'));
  const det=[]; if(e.tenu)det.push(e.tenu+' tenus'); if(e.partiel)det.push(e.partiel+' partiel'+(e.partiel>1?'s':'')); if(e.non_tenu)det.push(e.non_tenu+' non tenu'+(e.non_tenu>1?'s':'')); if(e.en_cours)det.push(e.en_cours+' en cours');
  return '<div class="tcell"><div class="ttop">'+bar+'<span class="tpct" style="color:'+col+'">'+(pct==null?'—':pct+'%')+'</span></div><div class="tdet">'+det.join(' · ')+'</div></div>';
}
// Quand la transfo n'est pas mesurable, la 4e colonne montre la production :
// commandes du mois contre l'attendu à date (même source que l'accueil).
function vendeurObjectifCell(c){
  const K=dashOf(c.id_user);
  if(!K) return '<div class="vtf na">—</div>';
  if(!(K.obj_cdes>0)) return '<div class="vtf flat">'+fmtNb(K.cdes,0)+' cmd<span class="vtf-n">pas d’objectif</span></div>';
  const att=K.obj_cdes*prorataMois(), ec=K.cdes-att;
  return '<div class="vtf '+(ec< -0.5?'down':'up')+'" title="Commandes du mois / objectif · attendu à date '+fmtNb(att)+'">'+fmtNb(K.cdes,0)+' / '+fmtNb(K.obj_cdes,0)+
    '<span class="vtf-n">'+(ec<0?'retard '+fmtNb(-ec):'avance +'+fmtNb(ec))+' à date</span></div>';
}
function vendeurTransfoCell(c){
  if(state.txMesurable===false) return vendeurObjectifCell(c);
  if(c.transfo_actuel==null) return '<div class="vtf na" title="Aucune proposition sur la période">—</div>';
  if(!c.tx_signif) return '<div class="vtf na" title="'+esc(transfoTexte(c))+'">trop peu'+(c.tx_tot_actuel!=null?'<span class="vtf-n">'+c.tx_tot_actuel+' '+(state.transfoStable?'tranchées':'prop.')+'</span>':'')+'</div>';
  const cls=c.transfo_hausse?'up':(c.transfo_baisse?'down':'flat'), ar=c.transfo_hausse?'↗':(c.transfo_baisse?'↘':'→');
  return '<div class="vtf '+cls+'" title="'+esc(transfoTexte(c))+'">'+fmtNb(c.transfo_actuel)+' % '+ar+
    (c.tx_signif_prec&&c.transfo_precedent!=null?'<span class="vtf-n">'+fmtNb(c.transfo_precedent)+' % avant</span>':'')+'</div>';
}
function vendeurRows(pred){
  const tmap=state.tenueMap||{};
  return (state.cadence||[]).filter(pred).map(c=>{
    const t=tmap[c.id_user]||{tenu:0,partiel:0,non_tenu:0,en_cours:0};
    return Object.assign({}, c, { eng:t });
  });
}
function sortVendeurs(list){
  const s=state.suiviSort||'tenue', arr=list.slice();
  if(s==='tenue') arr.sort((a,b)=>{ const pa=tenuePctOf(a.eng), pb=tenuePctOf(b.eng); if(pa==null&&pb==null) return (a.nom_vendeur||'').localeCompare(b.nom_vendeur||''); if(pa==null) return 1; if(pb==null) return -1; return pa-pb; });
  else if(s==='recence') arr.sort((a,b)=>{ const ja=a.jours_depuis_bilat, jb=b.jours_depuis_bilat; if(ja==null&&jb==null) return 0; if(ja==null) return -1; if(jb==null) return 1; return jb-ja; });
  else if(s==='transfo' && state.txMesurable===false) arr.sort((a,b)=>{ const e=x=>{ const K=dashOf(x.id_user); return K&&K.obj_cdes>0 ? K.cdes-K.obj_cdes*prorataMois() : 999; }; return e(a)-e(b); });
  else if(s==='transfo') arr.sort((a,b)=> ((b.transfo_baisse?1:0)-(a.transfo_baisse?1:0)) || ((a.tx_signif&&a.transfo_actuel!=null?a.transfo_actuel:999)-(b.tx_signif&&b.transfo_actuel!=null?b.transfo_actuel:999)) );
  return arr;
}
function vendeurTable(titre, couleur, vlist){
  if(!vlist.length) return '';
  let t='<div class="bil-cat-title" style="color:'+couleur+'">'+titre+' <span class="bil-cat-n">'+vlist.length+' vendeur'+(vlist.length>1?'s':'')+'</span></div>';
  t+='<div class="bil-hscroll"><div class="vtbl"><div class="vrow vthead"><div class="vth">Vendeur</div><div class="vth c-ryt">Fréquence · dernière / prochaine</div><div class="vth">Engagements tenus · 6 mois</div><div class="vth c-tf">'+(state.txMesurable===false?'Commandes du mois':'Transformation'+txFenetre())+'</div><div class="vth"></div></div>';
  vlist.forEach(c=>{
    t+='<div class="vrow" data-vbil="'+c.id_user+'|'+c.id_site+'">'+
      '<div class="vname">'+esc(c.nom_vendeur)+(c.vn_vo?'<span class="vcat">'+esc(c.vn_vo)+'</span>':'')+'</div>'+
      '<div class="c-ryt" data-l="Fréquence · dernière / prochaine">'+vendeurRythmeCell(c)+'</div>'+
      '<div class="c-ten" data-l="Engagements tenus · 6 mois">'+vendeurTenueCell(c)+'</div>'+
      '<div class="c-tf" data-l="'+(state.txMesurable===false?'Commandes du mois':'Transformation')+'">'+vendeurTransfoCell(c)+'</div>'+
      '<div class="vchev">'+(c.next_bilaterale_at?'›':'<button class="v-plan" data-plan-vend="'+c.id_user+'|'+c.id_site+'" title="Planifier une bilatérale">+</button>')+'</div></div>';
  });
  t+='</div></div>';
  return t;
}
function vendeursLegend(){
  return '<div class="bil-legend">'+
    '<span class="lg"><span class="sw" style="background:#53bda7"></span>Tenu</span>'+
    '<span class="lg"><span class="sw" style="background:#fac055"></span>Partiel</span>'+
    '<span class="lg"><span class="sw" style="background:#d97070"></span>Non tenu</span>'+
    '<span class="lg"><span class="sw" style="background:#d8dfe9"></span>En cours (pas encore pointé)</span>'+
    '<span class="lg">· Engagements tenus = (tenus + ½ partiels) / engagements pointés, sur 6 mois</span>'+
    '<span class="lg">· Fréquence attendue : 1 bilatérale tous les '+BIL_CFG.cadenceJ+' jours par vendeur (point orange au-delà, rouge après '+BIL_CFG.retardJ+' jours)</span>'+
    '<span class="lg">· '+(state.txMesurable===false
      ? 'Commandes du mois = commandes signées / objectif, et écart à l’attendu à date. La transformation n’est pas affichée : aucune affaire perdue n’est enregistrée, le taux serait faux'
      : state.transfoStable
      ? 'Transformation = affaires gagnées (commande signée) / affaires tranchées (gagnées + perdues), sur les propositions créées ces '+BIL_CFG.transfoJours+' derniers jours, comparée aux '+BIL_CFG.transfoJours+' jours d’avant'
      : 'Transformation = affaires gagnées / propositions de la période')+(state.txMesurable===false?'':', affichée à partir de '+BIL_CFG.minVolumeTransfo+' affaires')+'</span></div>';
}
function suiviSortBar(){
  const s=state.suiviSort||'tenue';
  const c=(k,l)=>'<span class="ssort'+(s===k?' on':'')+'" data-suivisort="'+k+'">'+l+'</span>';
  return '<div class="suivi-sort"><span class="sort-lbl">Trier par</span>'+c('tenue','Engagements les moins tenus')+c('recence','Plus longtemps sans bilatérale')+(state.txMesurable===false?c('transfo','Plus en retard sur l’objectif'):c('transfo','Transfo en baisse'))+'</div>';
}
function renderVendeursTables(list, sansLegende){
  const sorted=sortVendeurs(list);
  const vn=sorted.filter(v=>v.vn_vo==='VN'), vo=sorted.filter(v=>v.vn_vo==='VO'), vnvo=sorted.filter(v=>v.vn_vo==='VNVO');
  const autres=sorted.filter(v=>!['VN','VO','VNVO'].includes(v.vn_vo));
  return vendeurTable('Vendeurs VN','#53bda7',vn)+vendeurTable('Vendeurs VO','#fac055',vo)+vendeurTable('Vendeurs VN/VO','#2a5ea9',vnvo)+vendeurTable('Autres','#8b99b0',autres)+(sansLegende?'':vendeursLegend());
}

// --- vue Chefs des ventes ---
function chefRegScore(c){ const active=c.regularite.filter(p=>p>0).length; const avg=c.regularite.reduce((s,x)=>s+x,0)/6; return active*100+avg; }
function chefRegStrip(reg){
  const m=reg6Months();
  let cells='<div class="reg-cells">';
  reg.forEach((p,i)=>{ const col=regColor(p); cells+= col?'<div class="reg-c" style="background:'+col+'" title="'+esc(m[i].nom)+' : '+Math.round(p)+'%"></div>':'<div class="reg-c empty" title="'+esc(m[i].nom)+' : aucune bilatérale"></div>'; });
  cells+='</div><div class="reg-labels">'+m.map(x=>'<span>'+x.ini+'</span>').join('')+'</div>';
  return '<div class="reg">'+cells+'</div>';
}
function chefRow(c){
  const cov=c.couverture, active=c.regularite.filter(p=>p>0).length, tp=tenuePctOf(c.eng);
  let flag=''; if(active<=3||cov<50) flag='<span class="cflag irr">irrégulier</span>'; else if(active>=6&&cov>=90&&tp!=null&&tp>=80) flag='<span class="cflag exe">exemplaire</span>';
  const covCol=cov>=85?'#00997f':(cov>=60?'#8a6d1f':'#c0524f');
  const tCol=tp==null?'#8b99b0':(tp>=80?'#00997f':(tp>=60?'#8a6d1f':'#c0524f'));
  const dCol=c.delai_moyen==null?'#8b99b0':(c.delai_moyen<=BIL_CFG.cadenceJ?'#00997f':(c.delai_moyen<=BIL_CFG.retardJ?'#8a6d1f':'#c0524f'));
  return '<div class="crow" data-chef="'+c.id_manager+'">'+
    '<div class="cname">'+esc(c.nom_chef)+flag+'<span class="csite">'+esc(c.nom_site)+'</span></div>'+
    '<div>'+chefRegStrip(c.regularite)+'</div>'+
    '<div class="ccov" style="color:'+covCol+'">'+cov+'%<span class="cfrac">'+c.vus_periode+'/'+c.team_size+' reçus</span></div>'+
    '<div class="cten" style="color:'+tCol+'">'+(tp==null?'—':tp+'%')+'</div>'+
    '<div class="cdel" style="color:'+dCol+'">'+(c.delai_moyen==null?'—':c.delai_moyen+'<span class="u"> j</span>')+'</div>'+
    '<div class="cchev">›</div></div>';
}
function sortChefs(list){
  const s=state.chefSort||'reg', a=list.slice();
  if(s==='reg') a.sort((x,y)=>chefRegScore(x)-chefRegScore(y));
  else if(s==='cov') a.sort((x,y)=>x.couverture-y.couverture);
  else if(s==='tenue') a.sort((x,y)=>{ const px=tenuePctOf(x.eng), py=tenuePctOf(y.eng); return (px==null?999:px)-(py==null?999:py); });
  return a;
}
function chefsInScope(){
  const lvl=scopeLevel();
  return (state.chefs||[]).filter(c=>{
    if(lvl==='racine') return true;
    const ss = Array.isArray(c.sites) ? c.sites.map(id=>siteOf(id)).filter(Boolean) : (state.sites||[]).filter(x=>x.nom_site===c.nom_site);
    if(!ss.length) return false;
    if(lvl==='reseau') return ss.some(s=>s.reseau===state.selReseau);
    if(lvl==='affaire') return ss.some(s=>s.reseau===state.selReseau && String(s.id_affaire)===String(state.selAffaire.key));
    if(lvl==='site') return ss.some(s=>s.id_site===state.selSite);
    return true;
  });
}
function renderChefs(){
  if(state.chefs===null) return '<div class="bil-empty">Chargement de l\'évaluation des chefs…</div>';
  if(state.chefsError) return '<div class="bil-empty">Évaluation indisponible : '+esc(state.chefsError)+'</div>';
  const list=chefsInScope(), nb=list.length;
  if(!nb) return '<div class="bil-empty">Aucun chef des ventes rattaché à ce périmètre.</div>';
  const covMoy=Math.round(list.reduce((s,c)=>s+c.couverture,0)/nb);
  const irr=list.filter(c=>c.regularite.filter(p=>p>0).length<=3||c.couverture<50).length;
  const tenVals=list.map(c=>tenuePctOf(c.eng)).filter(x=>x!=null);
  const tenMoy=tenVals.length?Math.round(tenVals.reduce((s,x)=>s+x,0)/tenVals.length):null;
  const vol=list.reduce((s,c)=>s+c.volume,0);
  let h='<div class="prio-head">Encadrement <span class="prio-sub">'+nb+' chef'+(nb>1?'s':'')+' des ventes · '+esc(scopeLabel())+'</span></div>';
  h+='<div class="prio-kpis">';
  h+='<div class="pk"><div class="pk-v" style="color:'+(covMoy>=85?'#00997f':(covMoy>=60?'#8a6d1f':'#c0524f'))+'">'+covMoy+'%</div><div class="pk-l">couverture moyenne</div><div class="pk-s">vendeurs reçus sur la période</div></div>';
  h+='<div class="pk"><div class="pk-v" style="color:'+(irr?'#c0524f':'#00997f')+'">'+irr+'</div><div class="pk-l">chefs irréguliers</div><div class="pk-s">≤ 3 mois actifs / 6</div></div>';
  h+='<div class="pk"><div class="pk-v" style="color:'+(tenMoy==null?'#8b99b0':(tenMoy>=80?'#00997f':(tenMoy>=60?'#8a6d1f':'#c0524f')))+'">'+(tenMoy==null?'—':tenMoy+'%')+'</div><div class="pk-l">tenue moyenne</div><div class="pk-s">engagements des équipes</div></div>';
  h+='<div class="pk"><div class="pk-v" style="color:#2a5ea9">'+vol+'</div><div class="pk-l">bilatérales</div><div class="pk-s">sur la période</div></div>';
  h+='</div>';
  const s=state.chefSort||'reg';
  const sc=(k,l)=>'<span class="prio-chip'+(s===k?' on':'')+'" data-chefsort="'+k+'">'+l+'</span>';
  h+='<div class="prio-chips"><span class="sort-lbl">Trier par</span>'+sc('reg','Régularité ↑')+sc('cov','Couverture')+sc('tenue','Tenue d\'équipe')+'</div>';
  h+='<div class="bil-hscroll"><div class="ctbl"><div class="crow cthead"><div class="cth">Chef des ventes</div><div class="cth">Régularité · 6 mois</div><div class="cth">Couverture</div><div class="cth">Tenue équipe</div><div class="cth">Délai moy.</div><div class="cth"></div></div>';
  h+=sortChefs(list).map(chefRow).join('');
  h+='</div></div>';
  h+='<div class="bil-legend">'+
     regScaleLegend()+
     '<span class="lg">· <b>irrégulier</b> = ≤ 3 mois actifs / 6 ou couverture &lt; 50 %</span>'+
     '<span class="lg">· <b>exemplaire</b> = 6 mois actifs, couverture ≥ 90 %, tenue ≥ 80 %</span>'+
     '<span class="lg">· délai moy. = jours entre deux bilatérales d\'un même vendeur</span></div>';
  return h;
}

// ÉTAPE 2 — Suivi de l'équipe : tous les vendeurs du périmètre choisi,
// regroupés par site quand le périmètre en couvre plusieurs.
function renderSuivi() {
  const q = (state.suiviSearch || '').toLowerCase().trim();
  const inScope = new Set(cadInScope().map(c => c.id_user + '|' + c.id_site));
  let list = vendeurRows(c => inScope.has(c.id_user + '|' + c.id_site));
  let focus = '';
  if (state.chefFocus != null) {
    const chef = (state.chefs || []).find(c => c.id_manager === state.chefFocus);
    const sitesChef = chef && Array.isArray(chef.sites) ? new Set(chef.sites) : null;
    const teamIds = new Set((state.bils || []).filter(b => b.id_manager === state.chefFocus).map(b => b.id_user));
    list = list.filter(v => sitesChef ? sitesChef.has(v.id_site) : teamIds.has(v.id_user));
    focus = chef ? ' · équipe de ' + esc(chef.nom_chef) : '';
  }
  if (q) list = list.filter(v => (v.nom_vendeur || '').toLowerCase().includes(q));
  const back = state.chefFocus != null ? '<div class="bil-back" data-suivi-all="1">← toute l’équipe</div>' : '';
  const recus = list.filter(recuPeriode).length;
  let h = back + '<div class="bil-suivi-head">Suivi de l’équipe · ' + esc(scopeLabel()) + focus + ' · ' + list.length + ' vendeur' + (list.length > 1 ? 's' : '') +
    '<span class="suivi-cov">' + recus + ' reçu' + (recus > 1 ? 's' : '') + ' sur la période</span></div>';
  h += '<div class="suivi-filters">' +
    '<input id="bil-suivi-search" class="suivi-search" type="text" placeholder="Rechercher un vendeur…" value="' + esc(state.suiviSearch || '') + '" oninput="window.__bilSuiviSearch(this.value)">' +
    suiviSortBar() + '</div>';
  if (!list.length) { h += '<div class="bil-empty">' + (q ? 'Aucun vendeur ne correspond à la recherche.' : 'Aucun vendeur actif dans ce périmètre.') + '</div>'; return h; }
  const sites = [...new Set(list.map(v => v.id_site))];
  if (sites.length > 1) {
    sites.map(id => ({ id, nom: (siteOf(id) || {}).nom_site || ('Site ' + id) }))
      .sort((a, b) => a.nom.localeCompare(b.nom, 'fr'))
      .forEach(si => {
        const l = list.filter(v => v.id_site === si.id);
        const r = l.filter(recuPeriode).length;
        h += '<div class="site-block"><div class="site-title">' + esc(si.nom) + '<span>' + r + '/' + l.length + ' reçus</span></div>' + renderVendeursTables(l, true) + '</div>';
      });
    h += vendeursLegend();
  } else {
    h += renderVendeursTables(list);
  }
  return h;
}

// ÉTAPE 3 — timeline (profondeur = nb de mois en arrière depuis le mois ancre)
const DEPTHS = [{n:1,l:'Ce mois'},{n:2,l:'2 derniers mois'},{n:3,l:'3 derniers mois'},{n:4,l:'4 derniers mois'},{n:6,l:'6 derniers mois'}];
function monthMinus(key, k){ // 'YYYY-MM' moins k mois
  const [y,m]=key.split('-').map(Number); const d=new Date(y, m-1-k, 1); return ymd(d).slice(0,7);
}
function renderTimeline() {
  const vend = state.tlVend, depth = state.tlDepth;
  // Ancre bornée au mois COURANT : si la période sélectionnée s'étend dans le futur
  // (trimestre / année en cours…), l'ancre ne doit pas sauter en avant, sinon les
  // bilatérales RÉALISÉES récentes sortent de la fenêtre de profondeur. Les programmées
  // à venir, elles, restent toujours affichées via estProgFutur (indépendant de l'ancre).
  const _curMonth = ymd(new Date()).slice(0, 7);
  const anchor = (state.tlMonth && state.tlMonth < _curMonth) ? state.tlMonth : _curMonth;
  const v = (state.bils||[]).find(b => b.id_user===vend);
  const vname = (v && v.nom_vendeur) || state.tlVendName || '';
  const moisInclus = []; for (let k=0;k<depth;k++) moisInclus.push(monthMinus(anchor, k));
  // On inclut TOUJOURS les bilatérales PROGRAMMÉES à venir (au-delà de la fenêtre de
  // profondeur) pour pouvoir les ouvrir et les réaliser, en plus de l'historique.
  const _now = new Date();
  const estProgFutur = b => b.statut === 'programmee' && b.start_date &&
    new Date(String(b.start_date).replace(' ', 'T')) > _now;
  const tlSite = state.tlSite != null ? state.tlSite : state.selSite;
  const list = (state.bils||[]).filter(b => b.id_user===vend && b.id_site===tlSite &&
                (moisInclus.includes(b.mois) || estProgFutur(b)))
                .sort((a,b)=> (b.start_date||'').localeCompare(a.start_date||''));
  const depthLbl = DEPTHS.find(d=>d.n===depth).l;
  const cv = (state.cadence||[]).find(x => x.id_user===vend);
  let h = '<div class="tl-head"><div class="h-t">' + esc(vname) + ' · ' +
          (depth===1 ? (monthLabel(anchor)+' '+anchor.slice(0,4)) : depthLbl) +
          '</div><div class="h-acts">' +
          (cv && !cv.next_bilaterale_at ? '<button class="h-plan" data-plan-vend="'+vend+'|'+tlSite+'">Planifier une bilatérale</button>' : '') +
          '<button class="h-back" data-tlback="1">← retour</button></div></div>';
  if (cv) {
    const d = prioDetail(cv);
    const bits = [];
    if (d.txt.objectif) bits.push(d.txt.objectif);
    bits.push(transfoTexte(cv));
    bits.push(d.txt.anciennete);
    h += '<div class="tl-ctx">' + bits.map(b => '<span>' + esc(b) + '</span>').join('') + '</div>';
  }
  h += '<div class="tl-depth">';
  DEPTHS.forEach(d => h += '<span class="d-opt'+(d.n===depth?' on':'')+'" data-depth="'+d.n+'">'+d.l+'</span>');
  h += '</div>';
  h += '<div class="tl">';
  if (!list.length) h += '<div class="bil-empty">Aucune bilatérale sur cette période.</div>';
  // Rendu d'une carte (réutilisé pour les deux sections "À venir" / "Historique").
  const carte = (b, side) => {
    const stTxt = b.statut==='realisee' ? '✓ Réalisée' : (b.statut==='programmee' ? '🗓 Programmée' : '⚠ Compte rendu manquant');
    const dm = dureeMin(b);
    const meta = fmtHeure(b.start_date) + (b.end_date?' → '+fmtHeure(b.end_date):'') + (dm?' · '+dm+' min':(b.duree?' · '+esc(b.duree):''));
    const prev = b.statut==='realisee'
      ? esc((b.resultat||'').slice(0,160))
      : (b.statut==='programmee'
          ? '<i style="color:#8b99b0">Entretien à venir — cliquez pour le préparer ou le mener maintenant.</i>'
          : '<i style="color:#c0524f">Compte rendu à saisir — cliquez pour le renseigner.</i>');
    return '<div class="tl-row '+side+'">' +
         '<div class="tl-dot '+b.statut+'"></div>' +
         '<div class="tl-date">'+fmtDate(b.start_date)+'</div>' +
         '<div class="tl-card" data-bil="'+b.id+'">' +
           '<div class="c-vend">'+esc(b.nom_vendeur)+'</div>' +
           '<div class="c-meta">'+meta+'</div>' +
           '<div class="c-prev">'+prev+'</div>' +
           '<span class="c-status '+b.statut+'">'+stTxt+'</span>' +
         '</div></div>';
  };
  // Deux blocs : d'abord les programmées à venir (sous "À venir"), puis le reste
  // (historique du mois / de la fenêtre de profondeur) sous "Historique".
  const futurs = list.filter(estProgFutur);
  const passes = list.filter(b => !estProgFutur(b));
  if (futurs.length) {
    h += '<div class="tl-sep avenir"><span>À venir</span></div>';
    let i = 0; for (const b of futurs) { h += carte(b, i%2===0 ? 'left' : 'right'); i++; }
  }
  if (passes.length) {
    if (futurs.length) h += '<div class="tl-sep histo"><span>Historique</span></div>';
    let i = 0; for (const b of passes) { h += carte(b, i%2===0 ? 'left' : 'right'); i++; }
  }
  h += '</div>';
  return h;
}

// Modale détail (bilatérale réalisée)
function openBil(id) {
  const b = (state.bils||[]).find(x => x.id===id); if (!b) return;
  if (b.statut !== 'realisee') {
    if (isVendeur()) { openBilReadonly(b); return; }   // vendeur : lecture seule, pas de saisie
    R_open(id);
    return;
  }
  const dm = dureeMin(b);
  const meta = 'avec ' + esc(b.nom_chef) + ' (chef des ventes) · ' + fmtDate(b.start_date) + ', ' +
               fmtHeure(b.start_date) + (b.end_date?' → '+fmtHeure(b.end_date):'') + (dm?' · '+dm+' min':'');
  const root = getRoot();
  const ov = doc.createElement('div'); ov.className = 'bil-ov'; ov.id = 'bil-ov';
  ov.innerHTML =
    '<div class="bil-modal"><div class="m-head"><div><div class="m-vend">'+esc(b.nom_vendeur)+'</div>'+
    '<div class="m-meta">'+meta+'</div></div><button class="m-close" data-close="1">×</button></div>'+
    '<div class="m-body">'+
      '<div class="m-sec res"><div class="s-lbl">Résultat</div><div class="s-txt">'+esc(b.resultat||'—')+'</div></div>'+
      '<div class="m-sec act"><div class="s-lbl">Actions</div><div class="s-txt">'+esc(b.actions||'—')+'</div></div>'+
      '<div class="m-sec eng"><div class="s-lbl">Engagements</div><div class="s-txt" id="bil-ro-eng">'+esc(b.engagement||'—')+'</div></div>'+
    '</div></div>';
  root.appendChild(ov);
  // Détail structuré : quoi, combien, pour quand, et où en est le suivi.
  Promise.resolve(ctx.supabase.rpc('bilat_engagements', { p_id_bilaterales: b.id })).then(r => {
    if (r.error || !Array.isArray(r.data) || !r.data.length) return;
    const el = doc.getElementById('bil-ro-eng'); if (!el) return;
    const st = { tenu: ['Tenu', 'ok'], partiel: ['Partiel', 'warn'], non_tenu: ['Non tenu', 'ko'], en_cours: ['En cours', 'cours'] };
    el.classList.add('ro-eng');
    el.innerHTML = r.data.map(e => '<div class="ro-row"><span class="ro-lib">' + esc(e.libelle) + '</span>' +
      (e.cible != null ? '<span class="ro-m">objectif ' + esc(String(e.cible)) + '</span>' : '') +
      (e.echeance ? '<span class="ro-m">pour le ' + esc(fmtJJMM(String(e.echeance))) + '</span>' : '') +
      '<span class="ro-st ' + (st[e.statut_suivi] || st.en_cours)[1] + '">' + (st[e.statut_suivi] || st.en_cours)[0] + '</span></div>').join('');
  }).catch(() => {});
}
function closeModal(){ const ov = doc.getElementById('bil-ov'); if (ov) ov.remove(); }

// --- Toast (confirmation / erreur) -------------------------------------------
function bilToast(msg, kind) {
  try {
    let t = doc.getElementById('bil-toast');
    if (!t) { t = doc.createElement('div'); t.id = 'bil-toast'; (doc.body || doc.documentElement).appendChild(t); }
    const ok = kind !== 'err';
    t.style.cssText = 'position:fixed;bottom:24px;left:50%;transform:translateX(-50%);z-index:90;color:#fff;font-family:"Nunito Sans",sans-serif;font-size:13px;font-weight:700;padding:11px 18px;border-radius:10px;max-width:86vw;'
      + (ok ? 'background:#00997f;box-shadow:0 6px 24px rgba(44,122,104,.35)' : 'background:#c0524f;box-shadow:0 6px 24px rgba(163,45,45,.35)');
    t.textContent = (ok ? '✓ ' : '') + msg; t.style.display = 'block';
    clearTimeout(window.__bilToastT); window.__bilToastT = setTimeout(() => { try { t.style.display = 'none'; } catch (x) {} }, 5000);
  } catch (e) {}
}
function libQuand(dateStr, heure) {
  const d = new Date(dateStr + 'T12:00:00');
  return d.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' }) + ' à ' + String(heure || '').replace(':', 'h');
}
// Prochain jour ouvré (lundi → samedi) après une date, ou après n jours.
function jourOuvre(base, n) {
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + (n || 0));
  while (d.getDay() === 0) d.setDate(d.getDate() + 1);
  return d;
}
function plus(min, hhmm) { const [h, m] = String(hhmm).split(':').map(Number); const t = h * 60 + m + Number(min); return String(Math.floor(t / 60)).padStart(2, '0') + ':' + String(t % 60).padStart(2, '0'); }
function messageErreur(e) {
  const m = (e && e.message) ? e.message : String(e || '');
  if (/Could not find the function|does not exist|PGRST202/i.test(m)) return 'Fonction indisponible : le script SQL des bilatérales v6 n’est pas encore appliqué.';
  if (/Date passee non autorisee/i.test(m)) return 'Cette date est déjà passée : choisis un créneau à venir.';
  return m.replace(/^BILAT_FUTURE\s*:\s*/, '');
}

// ============================================================================
//  PLANIFIER UNE BILATÉRALE (depuis la file de priorité ou la timeline)
//  Deux clics : la date proposée est le prochain jour ouvré, 9 h, 30 min.
//  « Mener maintenant » crée la bilatérale à l'instant présent et ouvre la
//  fiche de réalisation.
// ============================================================================
const P = { idUser: null, idSite: null, nom: '', date: '', heure: '09:00', dur: 30, saving: false, err: '' };
function P_open(idUser, idSite) {
  const c = (state.cadence || []).find(x => x.id_user === idUser);
  P.idUser = idUser; P.idSite = idSite; P.nom = c ? c.nom_vendeur : ('Vendeur ' + idUser);
  P.date = ymd(jourOuvre(new Date(), 1)); P.heure = '09:00'; P.dur = 30; P.saving = false; P.err = '';
  P.contexte = c ? prioDetail(c) : null;
  P_render();
}
function P_render() {
  closeModal();
  const d = P.contexte;
  const ctxTxt = d ? [d.main ? d.txt[d.main] : null, d.txt.anciennete].filter((x, i, a) => x && a.indexOf(x) === i).join(' · ') : '';
  const ov = doc.createElement('div'); ov.className = 'bil-ov'; ov.id = 'bil-ov';
  ov.innerHTML = '<div class="bil-modal pl-modal"><div class="m-head"><div><div class="m-vend">Planifier une bilatérale</div>' +
    '<div class="m-meta">avec <b>' + esc(P.nom) + '</b>' + (ctxTxt ? ' · ' + esc(ctxTxt) : '') + '</div></div><button class="m-close" data-close="1">×</button></div>' +
    '<div class="m-body">' +
      '<div class="pl-row"><label>Date<input type="date" id="pl-date" min="' + ymd(new Date()) + '" value="' + esc(P.date) + '"></label>' +
      '<label>Heure<input type="time" id="pl-heure" step="900" value="' + esc(P.heure) + '"></label>' +
      '<label>Durée<select id="pl-dur">' + [15, 30, 45, 60, 90].map(m => '<option value="' + m + '"' + (m === P.dur ? ' selected' : '') + '>' + m + ' min</option>').join('') + '</select></label></div>' +
      '<div class="pl-quick">' + [1, 2, 3, 7].map(n => { const dd = jourOuvre(new Date(), n); return '<button data-pact="jour:' + ymd(dd) + '">' + esc(dd.toLocaleDateString('fr-FR', { weekday: 'short', day: '2-digit', month: '2-digit' })) + '</button>'; }).join('') + '</div>' +
      (P.err ? '<div class="pl-err">' + esc(P.err) + '</div>' : '') +
      '<div class="pl-acts"><button class="pl-go" data-pact="planifier"' + (P.saving ? ' disabled' : '') + '>' + (P.saving ? 'Enregistrement…' : '📅 Planifier') + '</button>' +
      '<button class="pl-now" data-pact="maintenant"' + (P.saving ? ' disabled' : '') + '>▶ Mener l’entretien maintenant</button></div>' +
    '</div></div>';
  getRoot().appendChild(ov);
}
function P_sync() {
  const g = id => doc.getElementById(id);
  if (g('pl-date')) P.date = g('pl-date').value;
  if (g('pl-heure')) P.heure = g('pl-heure').value;
  if (g('pl-dur')) P.dur = Number(g('pl-dur').value) || 30;
}
async function P_planifier() {
  P_sync(); P.err = '';
  if (!P.date || !P.heure) { P.err = 'Date et heure requises.'; return P_render(); }
  P.saving = true; P_render();
  try {
    const start = P.date + ' ' + P.heure + ':00', end = P.date + ' ' + plus(P.dur, P.heure) + ':00';
    const r = await ctx.supabase.rpc('create_bilaterale', { p_id_user: P.idUser, p_id_manager: getViewerId(), p_id_site: P.idSite, p_start: start, p_end: end, p_duree: P.dur + ' min' });
    if (r.error) throw r.error;
    closeModal();
    bilToast('Bilatérale planifiée avec ' + P.nom + ' · ' + libQuand(P.date, P.heure));
    rechargerBil();
  } catch (e) { console.error('[bilaterales] planifier', e); P.saving = false; P.err = messageErreur(e); P_render(); }
}
async function P_maintenant() {
  P_sync(); P.err = ''; P.saving = true; P_render();
  try {
    const r = await ctx.supabase.rpc('bilat_creer_maintenant', { p_id_user: P.idUser, p_id_site: P.idSite, p_duree_min: P.dur });
    if (r.error) throw r.error;
    closeModal();
    rechargerBil();
    R_open(Number(r.data));
  } catch (e) { console.error('[bilaterales] maintenant', e); P.saving = false; P.err = messageErreur(e); P_render(); }
}
// Planification groupée : les N premiers de la file, un par jour ouvré à 9 h.
const PB = { items: [], saving: false, err: '', fait: 0 };
function PB_open() {
  const l = (state.prioOrdre || []).slice(0, 5);
  PB.items = l.map((c, i) => ({ c, on: true, date: ymd(jourOuvre(new Date(), i + 1)), heure: '09:00' }));
  PB.saving = false; PB.err = ''; PB.fait = 0;
  PB_render();
}
function PB_render() {
  closeModal();
  const ov = doc.createElement('div'); ov.className = 'bil-ov'; ov.id = 'bil-ov';
  const n = PB.items.filter(x => x.on).length;
  ov.innerHTML = '<div class="bil-modal pl-modal pb-modal"><div class="m-head"><div><div class="m-vend">Planifier les bilatérales prioritaires</div>' +
    '<div class="m-meta">Un entretien par jour ouvré, dans l’ordre de la file. Ajustez les dates si besoin.</div></div><button class="m-close" data-close="1">×</button></div>' +
    '<div class="m-body">' + PB.items.map((x, i) => {
      const d = prioDetail(x.c);
      return '<div class="pb-row"><label class="pb-chk"><input type="checkbox" data-pb-on="' + i + '"' + (x.on ? ' checked' : '') + '></label>' +
        '<div class="pb-who"><b>' + esc(x.c.nom_vendeur) + '</b><span>' + esc(d.main ? d.txt[d.main] : '') + '</span></div>' +
        '<input type="date" data-pb-date="' + i + '" min="' + ymd(new Date()) + '" value="' + esc(x.date) + '">' +
        '<input type="time" data-pb-heure="' + i + '" step="900" value="' + esc(x.heure) + '"></div>';
    }).join('') +
    (PB.err ? '<div class="pl-err">' + esc(PB.err) + '</div>' : '') +
    '<div class="pl-acts"><button class="pl-go" data-pact="batch_go"' + (PB.saving || !n ? ' disabled' : '') + '>' + (PB.saving ? 'Enregistrement… (' + PB.fait + '/' + n + ')' : '📅 Planifier ' + n + ' bilatérale' + (n > 1 ? 's' : '')) + '</button></div>' +
    '</div></div>';
  getRoot().appendChild(ov);
}
function PB_sync() {
  PB.items.forEach((x, i) => {
    const c = doc.querySelector('[data-pb-on="' + i + '"]'), d = doc.querySelector('[data-pb-date="' + i + '"]'), h = doc.querySelector('[data-pb-heure="' + i + '"]');
    if (c) x.on = c.checked; if (d) x.date = d.value; if (h) x.heure = h.value;
  });
}
async function PB_go() {
  PB_sync(); PB.err = '';
  const l = PB.items.filter(x => x.on);
  if (l.some(x => !x.date || !x.heure)) { PB.err = 'Chaque bilatérale cochée doit avoir une date et une heure.'; return PB_render(); }
  PB.saving = true; PB.fait = 0; PB_render();
  const ko = [];
  for (const x of l) {
    try {
      const r = await ctx.supabase.rpc('create_bilaterale', { p_id_user: x.c.id_user, p_id_manager: getViewerId(), p_id_site: x.c.id_site,
        p_start: x.date + ' ' + x.heure + ':00', p_end: x.date + ' ' + plus(30, x.heure) + ':00', p_duree: '30 min' });
      if (r.error) throw r.error;
      PB.fait++; PB_render();
    } catch (e) { ko.push(x.c.nom_vendeur + ' : ' + messageErreur(e)); }
  }
  PB.saving = false;
  if (ko.length) { PB.err = ko.join(' · '); PB_render(); }
  else closeModal();
  if (PB.fait) { bilToast(PB.fait + ' bilatérale' + (PB.fait > 1 ? 's' : '') + ' planifiée' + (PB.fait > 1 ? 's' : '') + ' — elles sont dans votre agenda'); rechargerBil(); }
}
function P_route(e) {
  const a = e.target.closest('[data-pact]'); if (!a) return false;
  const v = a.getAttribute('data-pact');
  if (v === 'batch_go') { PB_go(); return true; }
  if (v === 'planifier') { P_planifier(); return true; }
  if (v === 'maintenant') { P_maintenant(); return true; }
  if (v.indexOf('jour:') === 0) { P_sync(); P.date = v.slice(5); P_render(); return true; }
  return true;
}
function rechargerBil() {
  if (window.__bilLoadData) { state.sites = null; state.bils = null; state.cadence = null; window.__bilLoadData(); }
}

// --- Délégation des clics (routeur réassignable, comme le dashboard) --------
// Sélection du périmètre (depuis le fil d'Ariane, l'arbre ou le classement).
function setScope(str) {
  state.chefFocus = null;
  state.view = 'main'; state.prevScope = null;
  if (str === 'racine') { state.selReseau = null; state.selAffaire = null; state.selSite = null; }
  else if (str.indexOf('reseau:') === 0) {
    const rk = str.slice(7);
    state.selReseau = rk; state.selAffaire = null; state.selSite = null;
    state.expanded['r:' + rk] = true;
  } else if (str.indexOf('affaire:') === 0) {
    const rest = str.slice(8); const i = rest.lastIndexOf('|');
    const rk = rest.slice(0, i), ak = rest.slice(i + 1);
    const s = (state.sites || []).find(x => x.reseau === rk && String(x.id_affaire) === ak);
    state.selReseau = rk; state.selAffaire = { key: ak, label: s ? s.affaire : ak }; state.selSite = null;
    state.expanded['r:' + rk] = true; state.expanded['r:' + rk + '|a:' + ak] = true;
  } else if (str.indexOf('site:') === 0) {
    const id = Number(str.slice(5)); state.selSite = id;
    const s = siteOf(id);
    if (s) { state.selReseau = s.reseau; state.selAffaire = { key: String(s.id_affaire), label: s.affaire }; state.expanded['r:' + s.reseau] = true; state.expanded['r:' + s.reseau + '|a:' + String(s.id_affaire)] = true; }
  }
  if (state.tab === 'enc' && !isDirection()) state.tab = 'prio';
  render();
}
// Cible l'équipe d'un chef dans l'onglet "Bilatérales du site".
function focusChef(idManager) {
  const chef = (state.chefs || []).find(c => c.id_manager === idManager);
  if (chef) {
    const s = Array.isArray(chef.sites) && chef.sites.length === 1 ? siteOf(chef.sites[0]) : (state.sites || []).find(x => x.nom_site === chef.nom_site);
    if (s) { state.selSite = s.id_site; state.selReseau = s.reseau; state.selAffaire = { key: String(s.id_affaire), label: s.affaire }; }
  }
  state.chefFocus = idManager; state.tab = 'site';
  render();
}

window.__bilRoute = function (e) {
  if (e.__bilDone) return;
  if (!(e.target.closest && e.target.closest('#bil-root'))) return;
  e.__bilDone = true;
  // Modale : fermeture
  if (e.target.closest('[data-close]') || (e.target.id === 'bil-ov')) { closeModal(); return; }
  // Planification groupée
  if (e.target.closest('[data-batch]')) { PB_open(); return; }
  if (e.target.closest('[data-pb-on]')) { PB_sync(); setTimeout(PB_render, 0); return; }
  // Fenêtre « Planifier »
  if (e.target.closest('.pl-modal') && P_route(e)) return;
  if (e.target.closest('.pl-modal')) return;

  // Onglets contextuels
  const tab = e.target.closest('[data-tab]');
  if (tab) { state.tab = tab.getAttribute('data-tab'); state.chefFocus = null; render(); return; }

  // Arbre : chevron = déplier/replier (sans toucher au scope)
  const exp = e.target.closest('[data-exp]');
  if (exp) { const k = exp.getAttribute('data-exp'); state.expanded[k] = !state.expanded[k]; render(); return; }

  // Sélection du périmètre (fil d'Ariane + arbre)
  const sc = e.target.closest('[data-scope]');
  if (sc) { setScope(sc.getAttribute('data-scope')); return; }

  // Filtre de la file de priorité (rôle chef)
  const pf = e.target.closest('[data-priofilter]');
  if (pf) { const v = pf.getAttribute('data-priofilter'); state.prioFocus = (state.prioFocus === v && v !== 'tous') ? 'tous' : v; render(); return; }

  // Classement direction : clic sur une entité -> descendre / cibler un chef
  const ent = e.target.closest('[data-prio-ent]');
  if (ent) {
    const v = ent.getAttribute('data-prio-ent');
    if (v.indexOf('chef:') === 0) focusChef(Number(v.slice(5)));
    else setScope(v);
    return;
  }

  // Tris
  const ssort = e.target.closest('[data-suivisort]');
  if (ssort) { state.suiviSort = ssort.getAttribute('data-suivisort'); render(); return; }
  const csort = e.target.closest('[data-chefsort]');
  if (csort) { state.chefSort = csort.getAttribute('data-chefsort'); render(); return; }

  // Encadrement : clic chef -> son équipe dans l'onglet "Bilatérales du site"
  const chefRowEl = e.target.closest('[data-chef]');
  if (chefRowEl) { focusChef(Number(chefRowEl.getAttribute('data-chef'))); return; }

  // "toute l'équipe du site" (annule le focus chef)
  const all = e.target.closest('[data-suivi-all]');
  if (all) { state.chefFocus = null; render(); return; }

  // Bouton « Planifier » (ligne de la file ou en-tête de la timeline)
  const plan = e.target.closest('[data-plan-vend]');
  if (plan) {
    if (plan.classList.contains('done')) return;
    const [pvid, psid] = plan.getAttribute('data-plan-vend').split('|');
    P_open(Number(pvid), Number(psid));
    return;
  }

  // Clic vendeur (file de priorité chef OU tableau du site) -> sa timeline
  const pv = e.target.closest('[data-prio-vend]') || e.target.closest('[data-vbil]');
  if (pv) {
    const raw = pv.getAttribute('data-prio-vend') || pv.getAttribute('data-vbil');
    const [vid, sid] = raw.split('|');
    // Le périmètre choisi (ex. COLIN TEAM TOY) est MÉMORISÉ et rendu au
    // retour : il basculait sur le site du vendeur (recette du 13/10/2026).
    state.prevScope = { selSite: state.selSite, selReseau: state.selReseau, selAffaire: state.selAffaire, tab: state.tab, scroll: (doc.defaultView || window).scrollY || 0 };
    state.tlSite = Number(sid);
    state.tlVend = Number(vid); state.tlMonth = state.period.to.slice(0, 7); state.tlDepth = 2;
    const cv = (state.cadence || []).find(x => x.id_user === Number(vid));
    state.tlVendName = cv ? cv.nom_vendeur : null;
    state.view = 'timeline'; render(); return;
  }

  // Timeline : retour au tableau
  const tlb = e.target.closest('[data-tlback]');
  if (tlb) {
    const ps = state.prevScope;
    if (ps) { state.selSite = ps.selSite; state.selReseau = ps.selReseau; state.selAffaire = ps.selAffaire; state.tab = ps.tab; }
    state.view = 'main'; state.prevScope = null; render();
    if (ps && ps.scroll) { try { (doc.defaultView || window).scrollTo(0, ps.scroll); } catch (x) {} }
    return;
  }

  // Timeline : profondeur
  const dpt = e.target.closest('[data-depth]');
  if (dpt) { state.tlDepth = Number(dpt.getAttribute('data-depth')); render(); return; }

  // Timeline : clic carte
  const card = e.target.closest('[data-bil]');
  if (card) { openBil(Number(card.getAttribute('data-bil'))); return; }

  // Sélecteur de dates : ouverture/fermeture du calendrier
  const dpTog = e.target.closest('[data-dp-toggle]');
  if (dpTog) {
    state.dpOpen = !state.dpOpen;
    if (state.dpOpen) { state.dpMonth = (state.period.from || ymd(new Date())).slice(0, 7); state.dpStart = null; }
    render(); return;
  }
  const dpCl = e.target.closest('[data-dp-close]');
  if (dpCl) { state.dpOpen = false; state.dpStart = null; render(); return; }
  const dpNav = e.target.closest('[data-dp-nav]');
  if (dpNav) { state.dpMonth = monthShift(state.dpMonth || state.period.from.slice(0, 7), dpNav.getAttribute('data-dp-nav') === 'next' ? 1 : -1); render(); return; }
  const dpDay = e.target.closest('[data-dp-day]');
  if (dpDay) { pickDpDay(dpDay.getAttribute('data-dp-day')); return; }

  // Sélecteur de dates : presets de période
  const preset = e.target.closest('[data-period-preset]');
  if (preset) { applyPeriodPreset(preset.getAttribute('data-period-preset')); return; }
};
if (!window.__bilDocClickBound) {
  doc.addEventListener('click', function (e) { if (window.__bilRoute) window.__bilRoute(e); }, true);
  window.__bilDocClickBound = true;
}

// Recherche live dans le suivi (D) : re-rend puis restaure le focus + le curseur.
window.__bilSuiviSearch = function (val) {
  state.suiviSearch = val;
  render();
  const inp = doc.getElementById('bil-suivi-search');
  if (inp) { inp.focus(); try { inp.setSelectionRange(val.length, val.length); } catch (e) {} }
};

// --- Période autonome : rechargement + handlers du sélecteur de dates --------
function reloadPeriodBil() {
  // On invalide les données dépendantes de la période et on recharge. La sélection
  // du périmètre (selSite/expanded/…) est conservée volontairement.
  state.sites = null; state.bils = null; state.cadence = null; state.chefs = null; state.tenueMap = null;
  if (window.__bilLoadData) window.__bilLoadData(); else render();
}
// Modification directe d'une borne (conservé pour usage éventuel/programmatique).
window.__bilSetPeriod = function (which, val) {
  if (!val) return;
  if (which === 'from') { if (val > state.period.to) val = state.period.to; state.period.from = val; }
  else { if (val < state.period.from) val = state.period.from; state.period.to = val; }
  reloadPeriodBil();
};
// Décalage de mois pour le calendrier ('YYYY-MM' +/- delta).
function monthShift(key, delta) {
  const y = Number(key.slice(0, 4)), m = Number(key.slice(5, 7));
  const d = new Date(y, m - 1 + delta, 1);
  return ymd(d).slice(0, 7);
}
// Clic sur un jour du calendrier : 1er clic = début en attente, 2e clic = fin.
function pickDpDay(dstr) {
  if (!dstr) return;
  if (!state.dpStart) { state.dpStart = dstr; render(); return; }
  let a = state.dpStart, b = dstr;
  if (b < a) { const t = a; a = b; b = t; }
  state.period = { from: a, to: b };
  state.dpStart = null; state.dpOpen = false;
  reloadPeriodBil();
}
// Presets rapides. 'mois' = 1er du mois courant -> aujourd'hui ; '3mois' = 1er du mois
// il y a 2 mois -> aujourd'hui ; 'annee' = 1er janvier de l'année en cours -> aujourd'hui.
function applyPeriodPreset(kind) {
  const now = new Date();
  let from;
  if (kind === 'semaine')    from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - ((now.getDay() + 6) % 7));
  else if (kind === 'mois')  from = new Date(now.getFullYear(), now.getMonth(), 1);
  else if (kind === '3mois') from = new Date(now.getFullYear(), now.getMonth() - 2, 1);
  else if (kind === 'annee') from = new Date(now.getFullYear(), 0, 1);
  else return;
  state.period = { from: ymd(from), to: ymd(now) };
  state.dpStart = null; state.dpOpen = false;
  reloadPeriodBil();
}

// --- Styles -----------------------------------------------------------------
const STYLE = '<style>' +
'#bil-root .bil{font-family:"Nunito Sans",sans-serif;color:#1c2b45}' +
'#bil-root .bil-load,#bil-root .bil-err,#bil-root .bil-empty{padding:24px;text-align:center;color:#8b99b0;font-size:14px}' +
'#bil-root .bil-err{color:#c0524f}' +
'#bil-root .bil-crumbs{display:flex;align-items:center;gap:6px;font-size:13px;margin-bottom:14px;flex-wrap:wrap}' +
'#bil-root .crumb{background:#fff;border:1px solid #e3e9f3;border-radius:8px;padding:5px 11px;color:#2a5ea9;font-weight:600;cursor:pointer}' +
'#bil-root .crumb.cur{background:#2a5ea9;color:#fff;border-color:#2a5ea9;cursor:default}' +
'#bil-root .crumb-sep{color:#9bb3d1}' +
'#bil-root .bil-tree{background:#fff;border:1px solid #e3e9f3;border-radius:12px;overflow:hidden}' +
'#bil-root .tree-row{display:flex;align-items:center;gap:8px;padding:10px 16px;border-bottom:1px solid #eef2f8;cursor:pointer;font-size:14px}' +
'#bil-root .tree-row:last-child{border-bottom:none}' +
'#bil-root .tree-row:hover{background:rgba(172,197,228,.14)}' +
'#bil-root .tree-row .exp{width:14px;color:#8b99b0;font-size:10px}' +
'#bil-root .lv-reseau{font-weight:700;color:#2a5ea9}' +
'#bil-root .lv-affaire{padding-left:30px}' +
'#bil-root .lv-site{padding-left:50px}' +
'#bil-root .lv-site .ico{color:#53bda7;font-size:10px}' +
'#bil-root .badge-n{margin-left:auto;font-size:12px;color:#8b99b0;background:#eef2f8;border-radius:20px;padding:2px 10px}' +
'#bil-root .badge-r{background:#d97070;color:#fff;border-radius:8px;padding:0 5px;font-size:10px;font-weight:800;margin-left:3px}' +
'#bil-root .bil-suivi-head{font-size:14px;font-weight:700;color:#2a5ea9;margin-bottom:12px}' +
'#bil-root .bil-cat-title{font-size:13px;font-weight:800;margin:18px 0 8px;text-transform:uppercase;letter-spacing:.03em}' +
'#bil-root .bil-cat-n{font-size:11px;font-weight:600;color:#8b99b0;text-transform:none;letter-spacing:0}' +
'#bil-root .suivi{background:#fff;border:1px solid #e3e9f3;border-radius:12px;overflow:hidden}' +
'#bil-root .suivi table{width:100%;border-collapse:collapse;font-size:14px}' +
'#bil-root .suivi th,#bil-root .suivi td{padding:11px 14px;text-align:center;border-bottom:1px solid #eef2f8}' +
'#bil-root .suivi th{background:rgba(172,197,228,.18);font-size:12px;color:#8b99b0;font-weight:700;text-transform:uppercase;letter-spacing:.03em}' +
'#bil-root .suivi th.vend,#bil-root .suivi td.vend{text-align:left;font-weight:600;color:#2a5ea9}' +
'#bil-root .suivi td.cell{cursor:pointer;position:relative;font-weight:700}' +
'#bil-root .suivi td.cell:hover{background:rgba(172,197,228,.18)}' +
'#bil-root .suivi td.cell.zero{color:#9bb3d1;font-weight:400;cursor:default}' +
'#bil-root .suivi td.cell.zero:hover{background:none}' +
'#bil-root .cell .notif{position:absolute;top:4px;right:5px;min-width:16px;height:16px;padding:0 4px;border-radius:8px;background:#d97070;color:#fff;font-size:10px;font-weight:800;line-height:16px;text-align:center}' +
'#bil-root .suivi tr.tot td{background:rgba(172,197,228,.18);font-weight:800;color:#2a5ea9;border-bottom:none}' +
'#bil-root .tl-head{display:flex;align-items:center;justify-content:space-between;margin:4px 0 8px;flex-wrap:wrap;gap:8px}' +
'#bil-root .tl-head .h-t{font-size:16px;font-weight:800;color:#2a5ea9}' +
'#bil-root .tl-head .h-back{font-size:13px;color:#2a5ea9;background:#fff;border:1px solid #e3e9f3;border-radius:8px;padding:5px 11px;cursor:pointer;font-weight:600}' +
'#bil-root .tl-depth{display:flex;gap:4px;flex-wrap:wrap;margin-bottom:12px}' +
'#bil-root .tl-depth .d-opt{font-size:12px;color:#2a5ea9;background:#fff;border:1px solid #e3e9f3;border-radius:7px;padding:4px 10px;cursor:pointer;font-weight:600}' +
'#bil-root .tl-depth .d-opt.on{background:#2a5ea9;color:#fff;border-color:#2a5ea9}' +
'#bil-root .tl{position:relative;padding:8px 0}' +
'#bil-root .tl::before{content:"";position:absolute;left:50%;top:0;bottom:0;width:2px;background:#acc5e4;transform:translateX(-1px)}' +
'#bil-root .tl-sep{position:relative;text-align:center;margin:6px 0 20px;z-index:3}' +
'#bil-root .tl-sep span{display:inline-block;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.05em;padding:4px 14px;border-radius:20px;background:#fff;border:1px solid #e3e9f3}' +
'#bil-root .tl-sep.avenir span{color:#2a5ea9;background:rgba(42,94,169,.10);border-color:rgba(42,94,169,.28)}' +
'#bil-root .tl-sep.histo span{color:#8b99b0}' +
'#bil-root .tl-row{position:relative;display:flex;margin-bottom:22px;min-height:60px}' +
'#bil-root .tl-row.left{justify-content:flex-start}' +
'#bil-root .tl-row.right{justify-content:flex-end}' +
'#bil-root .tl-dot{position:absolute;left:50%;top:18px;width:14px;height:14px;border-radius:50%;border:3px solid #fff;transform:translateX(-50%);z-index:2;box-shadow:0 0 0 1px #acc5e4}' +
'#bil-root .tl-dot.realisee{background:#53bda7}' +
'#bil-root .tl-dot.programmee{background:#2a5ea9}' +
'#bil-root .tl-dot.retard{background:#d97070}' +
'#bil-root .tl-date{position:absolute;left:50%;top:42px;transform:translateX(-50%);font-size:11px;color:#8b99b0;background:#eef2f8;padding:0 6px;white-space:nowrap}' +
'#bil-root .tl-card{width:42%;background:#fff;border:1px solid #e3e9f3;border-radius:12px;padding:14px 16px;cursor:pointer;transition:box-shadow .15s,transform .15s;position:relative}' +
'#bil-root .tl-card:hover{box-shadow:0 4px 16px rgba(42,94,169,.12);transform:translateY(-1px)}' +
'#bil-root .tl-row.left .tl-card::after{content:"";position:absolute;top:18px;right:-14px;width:0;height:0;border:7px solid transparent;border-left-color:#fff}' +
'#bil-root .tl-row.right .tl-card::after{content:"";position:absolute;top:18px;left:-14px;width:0;height:0;border:7px solid transparent;border-right-color:#fff}' +
'#bil-root .tl-card .c-vend{font-size:15px;font-weight:700;color:#2a5ea9}' +
'#bil-root .tl-card .c-meta{font-size:12px;color:#8b99b0;margin:2px 0 8px}' +
'#bil-root .tl-card .c-prev{font-size:13px;color:#1c2b45;line-height:1.4;display:-webkit-box;-webkit-line-clamp:2;-webkit-box-orient:vertical;overflow:hidden}' +
'#bil-root .c-status{margin-top:8px;display:inline-block;font-size:11px;font-weight:700;padding:3px 9px;border-radius:6px}' +
'#bil-root .c-status.realisee{background:rgba(83,189,167,.16);color:#00997f}' +
'#bil-root .c-status.programmee{background:rgba(42,94,169,.14);color:#2a5ea9}' +
'#bil-root .c-status.retard{background:rgba(217,112,112,.15);color:#c0524f}' +
'#bil-root .bil-ov{position:fixed;inset:0;background:rgba(28,43,69,.5);display:flex;align-items:center;justify-content:center;padding:20px;z-index:50}' +
'#bil-root .bil-modal{background:#fff;border-radius:16px;max-width:560px;width:100%;max-height:88vh;overflow:auto;box-shadow:0 20px 60px rgba(28,43,69,.25)}' +
'#bil-root .m-head{padding:18px 22px;border-bottom:1px solid #e3e9f3;display:flex;justify-content:space-between;align-items:flex-start}' +
'#bil-root .m-head .m-vend{font-size:18px;font-weight:800;color:#2a5ea9}' +
'#bil-root .m-head .m-meta{font-size:13px;color:#8b99b0;margin-top:3px}' +
'#bil-root .m-close{border:none;background:#eef2f8;width:30px;height:30px;border-radius:8px;font-size:18px;color:#8b99b0;cursor:pointer;flex-shrink:0}' +
'#bil-root .m-body{padding:18px 22px}' +
'#bil-root .m-sec{margin-bottom:18px}' +
'#bil-root .m-sec .s-lbl{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px}' +
'#bil-root .m-sec.res .s-lbl{color:#2a5ea9}' +
'#bil-root .m-sec.act .s-lbl{color:#8a6d1f}' +
'#bil-root .m-sec.eng .s-lbl{color:#00997f}' +
'#bil-root .m-sec .s-txt{font-size:14px;line-height:1.55;color:#1c2b45;background:#eef2f8;border-radius:10px;padding:12px 14px;white-space:pre-wrap}' +
'#bil-root .bil-nav{display:flex;gap:6px;margin-bottom:16px}' +
'#bil-root .nav-tab{font-size:13px;font-weight:700;color:#2a5ea9;background:#fff;border:1px solid #e3e9f3;border-radius:9px;padding:8px 16px;cursor:pointer}' +
'#bil-root .nav-tab:hover{background:rgba(172,197,228,.16)}' +
'#bil-root .nav-tab.on{background:#2a5ea9;color:#fff;border-color:#2a5ea9}' +
'#bil-root .prio-head{font-size:16px;font-weight:800;color:#2a5ea9;margin-bottom:14px}' +
'#bil-root .prio-head .prio-sub{font-size:12px;font-weight:600;color:#8b99b0;margin-left:8px}' +
'#bil-root .prio-kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:10px;margin-bottom:16px}' +
'#bil-root .pk{background:#fff;border:1px solid #e3e9f3;border-radius:12px;padding:13px 16px}' +
'#bil-root .pk .pk-v{font-size:26px;font-weight:800;line-height:1}' +
'#bil-root .pk .pk-l{font-size:12px;font-weight:700;color:#1c2b45;margin-top:4px}' +
'#bil-root .pk .pk-s{font-size:11px;color:#9bb3d1;margin-top:1px}' +
'#bil-root .prio-chips{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px}' +
'#bil-root .prio-chip{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:600;color:#2a5ea9;background:#fff;border:1px solid #e3e9f3;border-radius:16px;padding:5px 12px;cursor:pointer}' +
'#bil-root .prio-chip:hover{background:rgba(172,197,228,.16)}' +
'#bil-root .prio-chip.on{background:#2a5ea9;color:#fff;border-color:#2a5ea9}' +
'#bil-root .prio-chip .pc-n{font-size:10px;font-weight:700;opacity:.7}' +
'#bil-root .prio-chip.retard{color:#c0524f;border-color:#f2c4c4}' +
'#bil-root .prio-chip.retard:hover{background:rgba(217,112,112,.10)}' +
'#bil-root .prio-chip.retard.on{background:#d97070;color:#fff;border-color:#d97070}' +
'#bil-root .prio-chip.retard.on .pc-n{opacity:.9}' +
'#bil-root .prio-list{display:flex;flex-direction:column;gap:8px}' +
'#bil-root .prio-row{display:flex;align-items:center;gap:14px;background:#fff;border:1px solid #e3e9f3;border-radius:12px;padding:12px 16px;cursor:pointer;transition:box-shadow .15s,transform .12s}' +
'#bil-root .prio-row:hover{box-shadow:0 4px 16px rgba(42,94,169,.10);transform:translateY(-1px)}' +
'#bil-root .pr-cad{flex-shrink:0;width:62px;text-align:center;font-size:13px;font-weight:800;border-radius:9px;padding:9px 4px;line-height:1.1}' +
'#bil-root .pr-cad.never{background:rgba(217,112,112,.14);color:#c0524f}' +
'#bil-root .pr-cad.late{background:rgba(217,112,112,.12);color:#c0524f}' +
'#bil-root .pr-cad.warn{background:rgba(250,192,85,.22);color:#8a6d1f}' +
'#bil-root .pr-cad.ok{background:rgba(83,189,167,.16);color:#00997f}' +
'#bil-root .pr-cad.planif{background:rgba(42,94,169,.12);color:#2a5ea9}' +
'#bil-root .pr-main{flex:1;min-width:0}' +
'#bil-root .pr-name{font-size:15px;font-weight:700;color:#2a5ea9}' +
'#bil-root .pr-name .pr-cat{font-size:10px;font-weight:800;color:#8b99b0;background:#eef2f8;border-radius:6px;padding:1px 6px;margin-left:5px;vertical-align:middle}' +
'#bil-root .pr-site{font-size:12px;color:#8b99b0;margin:1px 0 6px}' +
'#bil-root .pr-raisons{display:flex;gap:5px;flex-wrap:wrap}' +
'#bil-root .rsn{font-size:11px;font-weight:600;border-radius:6px;padding:2px 8px}' +
'#bil-root .rsn-red{background:rgba(217,112,112,.13);color:#c0524f}' +
'#bil-root .rsn-amber{background:rgba(250,192,85,.20);color:#8a6d1f}' +
'#bil-root .rsn-blue{background:rgba(42,94,169,.10);color:#2a5ea9}' +
'#bil-root .rsn-green{background:rgba(83,189,167,.16);color:#00997f}' +
'#bil-root .pr-go{flex-shrink:0;color:#9bb3d1;font-size:22px;font-weight:700}' +
/* --- v6 --- */
'#bil-root .pr-cad small{display:block;font-size:10px;font-weight:700;margin-top:2px}' +
/* --- v11 --- */
'#bil-root .pt-card{background:#fff;border:1px solid #eaf0f9;border-radius:10px;padding:15px;margin-bottom:16px}' +
'#bil-root .pt-shead{display:flex;align-items:center;gap:8px;margin-bottom:14px;flex-wrap:wrap}' +
'#bil-root .pt-shead .bar{width:3px;height:17px;background:#2a5ea9}' +
'#bil-root .pt-shead .title{font-size:13px;font-weight:600;color:#2a5ea9}' +
'#bil-root .pt-shead .sub{margin-left:auto;font-size:10px;color:#acc5e4}' +
'#bil-root .pt-sel{display:inline-flex;align-items:center;gap:8px;background:#2a5ea9;color:#fff;padding:4px 10px;border-radius:6px;font-size:12px;font-weight:600}' +
'#bil-root .pt-sel b{cursor:pointer;opacity:.85;font-size:11px}' +
'#bil-root .pt-wrap{width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}' +
'#bil-root .pt-tree{width:100%;border-collapse:collapse}' +
'#bil-root .pt-tree th{font-size:10px;font-weight:600;color:#7a9cc4;text-transform:uppercase;letter-spacing:.4px;padding:8px 10px;background:#f9fbfd;border-bottom:1px solid #eaf0f9;text-align:center;white-space:nowrap}' +
'#bil-root .pt-tree th:first-child{text-align:left}' +
'#bil-root .pt-tree td{padding:6px 10px;font-size:12px;border-bottom:.5px solid #eaf0f9;vertical-align:middle;color:#2a5ea9}' +
'#bil-root .pt-tree td:first-child{overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:320px}' +
'#bil-root .pt-tree tr{cursor:pointer}' +
'#bil-root .pt-tree tr.lv-reseau{background:#f5f8fc}#bil-root .pt-tree tr.lv-affaire{background:#fafbfd}#bil-root .pt-tree tr.lv-site,#bil-root .pt-tree tr.lv-vendeur{background:#fff}' +
'#bil-root .pt-tree tbody tr:hover{filter:brightness(.97)}' +
'#bil-root .pt-tree tr.is-selected{background:#acc5e4!important}' +
'#bil-root .pt-tree tr.is-selected td:first-child{font-weight:700;color:#2a5ea9}' +
'#bil-root .pt-tree .lv-reseau td:first-child{color:#2a5ea9;font-weight:600}' +
'#bil-root .pt-tree .lv-affaire td:first-child{color:#2a5ea9;font-weight:500;padding-left:24px}' +
'#bil-root .pt-tree .lv-site td:first-child{color:#4a6a8a;font-weight:500;padding-left:44px}' +
'#bil-root .pt-tree .lv-vendeur td:first-child{color:#4a6a8a;padding-left:64px}' +
'#bil-root .pt-tree .lv-site.flat td:first-child{padding-left:10px}' +
'#bil-root .pt-tree .lv-vendeur.flat td:first-child{padding-left:32px}' +
'#bil-root .pt-tree .fct{color:#acc5e4;font-size:10px}' +
'#bil-root .pt-exp{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:3px;background:#eaf0f9;font-size:9px;color:#7a9cc4;margin-right:6px;vertical-align:middle}' +
'#bil-root .pt-n{text-align:center;font-variant-numeric:tabular-nums;font-weight:600}' +
'#bil-root .pt-ko{color:#c0524f}#bil-root .pt-0{color:#acc5e4;font-weight:400}' +
'#bil-root .pt-cell{display:flex;flex-direction:column;gap:3px;min-width:96px}' +
'#bil-root .pt-top{display:flex;align-items:center;justify-content:space-between;gap:6px}' +
'#bil-root .pt-ro{font-size:11px;color:#2a5ea9;font-weight:500;font-variant-numeric:tabular-nums}' +
'#bil-root .pt-pct{font-size:9px;font-weight:600;padding:1px 5px;border-radius:3px}' +
'#bil-root .pt-track{height:3px;background:#eaf0f9;border-radius:2px;overflow:hidden}#bil-root .pt-track i{display:block;height:100%}' +
'#bil-root .pt-etat{font-size:11.5px}#bil-root .pt-etat .pt-ok{color:#00997f;font-weight:700}#bil-root .pt-prog{color:#2a5ea9;font-weight:700}#bil-root .pt-mut{color:#7a9cc4}' +
'#bil-root .pt-vide{font-style:italic;color:#7a9cc4}' +
'#bil-root .me-eng{background:#fff;border:1px solid #e3e9f3;border-radius:12px;overflow:hidden;margin-bottom:6px}' +
'#bil-root .me-row{display:flex;flex-wrap:wrap;align-items:center;gap:6px 14px;padding:11px 16px;border-bottom:1px solid #eef2f8}' +
'#bil-root .me-row:last-child{border-bottom:none}' +
'#bil-root .me-lib{flex:1 1 260px;font-size:14px;font-weight:700;color:#1c2b45}' +
'#bil-root .me-cible{font-size:12px;color:#5a6b86}#bil-root .me-cible b{color:#2a5ea9}' +
'#bil-root .me-ech{font-size:12px;font-weight:700;color:#00997f}#bil-root .me-ech.echu{color:#c0524f}' +
'#bil-root .s-txt.ro-eng{white-space:normal;padding:6px 10px}' +
'#bil-root .ro-row{display:flex;flex-wrap:wrap;align-items:center;gap:4px 12px;padding:7px 4px;border-bottom:1px solid #e3e9f3}' +
'#bil-root .ro-row:last-child{border-bottom:none}' +
'#bil-root .ro-lib{flex:1 1 220px;font-weight:700;color:#1c2b45}' +
'#bil-root .ro-m{font-size:12px;color:#5a6b86}' +
'#bil-root .ro-st{font-size:11px;font-weight:800;border-radius:6px;padding:2px 8px}' +
'#bil-root .ro-st.ok{background:#e4f4f0;color:#00997f}#bil-root .ro-st.warn{background:#fdf3de;color:#8a6d1f}#bil-root .ro-st.ko{background:#fbeceb;color:#c0524f}#bil-root .ro-st.cours{background:#eef2f8;color:#5a6b86}' +
'#bil-root .pq{background:#fff;border:1px solid #e3e9f3;border-radius:14px;overflow:hidden;box-shadow:0 1px 2px rgba(28,43,69,.05),0 8px 24px rgba(28,43,69,.06)}' +
'#bil-root .pq-row{display:grid;grid-template-columns:34px minmax(150px,1.1fr) minmax(220px,2.4fr) 132px 112px 108px;gap:14px;align-items:center;padding:13px 18px;border-bottom:1px solid #eef2f8;cursor:pointer;transition:background .12s}' +
'#bil-root .pq-row:last-child{border-bottom:none}' +
'#bil-root .pq-row:not(.pq-head):hover{background:#f2f6fc}' +
'#bil-root .pq-head{cursor:default;background:#f4f7fb;padding:9px 18px;font-size:10.5px;font-weight:800;color:#8b99b0;text-transform:uppercase;letter-spacing:.06em}' +
'#bil-root .pq-row.is-planif{opacity:.72}' +
'#bil-root .pq-rang{font-size:13px;font-weight:800;color:#9bb3d1;font-variant-numeric:tabular-nums}' +
'#bil-root .pq-who b{display:block;font-size:14.5px;font-weight:800;color:#1c2b45}' +
'#bil-root .pq-who span{display:block;font-size:11.5px;color:#8b99b0;margin-top:1px}' +
'#bil-root .pq-main{font-size:13px;font-weight:700;color:#2a5ea9;line-height:1.35}' +
'#bil-root .pq-main.crit{color:#c0524f}' +
'#bil-root .pq-sub{font-size:11.5px;color:#8b99b0;margin-top:3px;line-height:1.4}' +
'#bil-root .pq-last span{font-size:12px;font-weight:700}' +
'#bil-root .pq-jamais{color:#c0524f}#bil-root .pq-warn{color:#8a6d1f}#bil-root .pq-ok{color:#00997f}#bil-root .pq-planif{color:#2a5ea9}' +
'#bil-root .pq-score{display:flex;flex-direction:column;gap:5px}' +
'#bil-root .pq-score b{font-size:15px;font-weight:800;font-variant-numeric:tabular-nums;color:#1c2b45}' +
'#bil-root .pq-score i{display:block;height:5px;border-radius:3px;background:#eef2f8;overflow:hidden}' +
'#bil-root .pq-score u{display:block;height:100%;border-radius:3px;text-decoration:none}' +
'#bil-root .pq-score.haut u{background:#d97070}#bil-root .pq-score.moyen u{background:#fac055}#bil-root .pq-score.bas u{background:#53bda7}' +
'#bil-root .pq-act{text-align:right}' +
'#bil-root .pq-plan{border:1.5px solid #2a5ea9;background:#fff;color:#2a5ea9;font-family:inherit;font-size:12px;font-weight:800;border-radius:9px;padding:6px 12px;cursor:pointer}' +
'#bil-root .pq-plan:hover{background:#eef4fc}' +
'@media (max-width:900px){#bil-root .pq-head{display:none}#bil-root .pq-row{grid-template-columns:28px 1fr auto;grid-template-areas:"r w s" "r y y" "r l a"}' +
'#bil-root .pq-rang{grid-area:r}#bil-root .pq-who{grid-area:w}#bil-root .pq-why{grid-area:y}#bil-root .pq-last{grid-area:l}#bil-root .pq-score{grid-area:s;min-width:70px}#bil-root .pq-act{grid-area:a}}' +
'#bil-root .perim-help{font-size:10.5px;font-weight:600;color:#9bb3d1;text-transform:none;letter-spacing:0;margin-left:8px}' +
'#bil-root .badge-cov{margin-left:auto;font-size:11.5px;font-weight:800;border-radius:20px;padding:2px 10px;white-space:nowrap}' +
'#bil-root .badge-cov.ok{background:rgba(83,189,167,.16);color:#00997f}' +
'#bil-root .badge-cov.moyen{background:rgba(250,192,85,.22);color:#8a6d1f}' +
'#bil-root .badge-cov.faible{background:rgba(217,112,112,.12);color:#c0524f}' +
'#bil-root .badge-n.vide{color:#9bb3d1}' +
'#bil-root .tree-row .badge-r{margin-left:6px;padding:2px 8px;font-size:10.5px;border-radius:20px;white-space:nowrap}' +
'#bil-root .pk.clik{cursor:pointer;transition:border-color .12s}' +
'#bil-root .pk.clik:hover{border-color:#acc5e4}' +
'#bil-root .pk.on{border-color:#2a5ea9;box-shadow:inset 0 0 0 1px #2a5ea9}' +
'#bil-root .next-box{background:linear-gradient(135deg,rgba(42,94,169,.08),rgba(83,189,167,.10));border:1px solid rgba(42,94,169,.25);border-radius:14px;padding:14px 18px;margin-bottom:14px}' +
'#bil-root .nb-l{font-size:11px;font-weight:800;color:#2a5ea9;text-transform:uppercase;letter-spacing:.05em;margin-bottom:6px}' +
'#bil-root .nb-main{display:flex;align-items:center;gap:14px;flex-wrap:wrap;justify-content:space-between}' +
'#bil-root .nb-nom{font-size:18px;font-weight:800;color:#1c2b45}' +
'#bil-root .nb-nom span{font-size:12px;font-weight:600;color:#8b99b0;margin-left:6px}' +
'#bil-root .nb-why{font-size:13px;color:#2a5ea9;font-weight:600;margin-top:2px}' +
'#bil-root .nb-acts{display:flex;gap:8px;flex-wrap:wrap}' +
'#bil-root .nb-batch{border:none;background:#2a5ea9;color:#fff;font-family:inherit;font-size:12.5px;font-weight:800;border-radius:9px;padding:8px 14px;cursor:pointer}' +
'#bil-root .hint-det{font-size:12px;color:#8b99b0;margin:2px 0 14px}' +
'#bil-root .hint-det summary{cursor:pointer;color:#2a5ea9;font-weight:700}' +
'#bil-root .hint-det div{margin-top:6px;line-height:1.5}' +
'#bil-root .hint-det b{color:#2a5ea9}' +
'#bil-root .suivi-cov{font-size:12px;font-weight:700;color:#8b99b0;margin-left:10px}' +
'#bil-root .site-block{margin-bottom:10px}' +
'#bil-root .site-title{font-size:15px;font-weight:800;color:#1c2b45;margin:20px 0 2px;display:flex;align-items:center;gap:10px}' +
'#bil-root .site-title span{font-size:11.5px;font-weight:700;color:#8b99b0;background:#eef2f8;border-radius:20px;padding:2px 10px}' +
'#bil-root .v-plan{width:28px;height:28px;border-radius:8px;border:1.5px solid #2a5ea9;background:#fff;color:#1F4A85;font-size:16px;font-weight:800;line-height:1;cursor:pointer}' +
'#bil-root .v-plan:hover{background:rgba(42,94,169,.08)}' +
'#bil-root .pb-modal{max-width:640px}' +
'#bil-root .pb-row{display:flex;align-items:center;gap:10px;padding:9px 0;border-bottom:1px solid #eef2f8;flex-wrap:wrap}' +
'#bil-root .pb-chk input{width:17px;height:17px;accent-color:#2a5ea9}' +
'#bil-root .pb-who{flex:1;min-width:180px}' +
'#bil-root .pb-who b{display:block;font-size:14px;color:#2a5ea9}' +
'#bil-root .pb-who span{font-size:11.5px;color:#8b99b0}' +
'#bil-root .pb-row input[type=date],#bil-root .pb-row input[type=time]{border:1px solid #e3e9f3;border-radius:8px;padding:7px 8px;font-family:inherit;font-size:13px;color:#1c2b45}' +
'#bil-root .rsn-main{background:#2a5ea9;color:#fff;font-weight:800}' +
'#bil-root .pr-score{flex-shrink:0;width:54px;text-align:center;font-size:18px;font-weight:800;line-height:1}' +
'#bil-root .pr-score small{display:block;font-size:9.5px;font-weight:700;color:#9bb3d1;margin-top:2px}' +
'#bil-root .pr-plan{flex-shrink:0;border:1.5px solid #2a5ea9;background:#fff;color:#1F4A85;font-family:inherit;font-size:12px;font-weight:800;border-radius:9px;padding:7px 12px;cursor:pointer}' +
'#bil-root .pr-plan:hover{background:rgba(42,94,169,.08)}' +
'#bil-root .pr-plan.done{border-color:#e3e9f3;color:#8b99b0;cursor:default;font-weight:700}' +
'#bil-root .pr-plan.done:hover{background:#fff}' +
'#bil-root .tl-head .h-acts{display:flex;gap:8px;flex-wrap:wrap}' +
'#bil-root .tl-head .h-plan{font-size:13px;color:#fff;background:#2a5ea9;border:1px solid #2a5ea9;border-radius:8px;padding:5px 12px;cursor:pointer;font-weight:700}' +
'#bil-root .tl-ctx{display:flex;flex-wrap:wrap;gap:6px;margin:0 0 12px}' +
'#bil-root .tl-ctx span{font-size:12px;font-weight:600;color:#2a5ea9;background:rgba(42,94,169,.08);border-radius:7px;padding:3px 9px}' +
'#bil-root .vtf-n{display:block;font-size:10.5px;font-weight:600;color:#8b99b0;font-style:normal}' +
'#bil-root .pl-modal{max-width:520px}' +
'#bil-root .pl-row{display:flex;gap:10px;flex-wrap:wrap}' +
'#bil-root .pl-row label{display:flex;flex-direction:column;gap:4px;font-size:11px;font-weight:800;color:#8b99b0;text-transform:uppercase;letter-spacing:.04em;flex:1 1 120px}' +
'#bil-root .pl-row input,#bil-root .pl-row select{border:1px solid #e3e9f3;border-radius:9px;padding:9px 10px;font-family:inherit;font-size:14px;color:#1c2b45;font-weight:600;text-transform:none;letter-spacing:0;background:#fff}' +
'#bil-root .pl-quick{display:flex;gap:6px;flex-wrap:wrap;margin:12px 0 4px}' +
'#bil-root .pl-quick button{border:1px solid #e3e9f3;background:#fff;color:#2a5ea9;border-radius:16px;padding:5px 11px;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;text-transform:capitalize}' +
'#bil-root .pl-quick button:hover{background:rgba(172,197,228,.16)}' +
'#bil-root .pl-err{color:#c0524f;font-size:12.5px;font-weight:700;margin-top:10px}' +
'#bil-root .pl-acts{display:flex;flex-direction:column;gap:8px;margin-top:16px}' +
'#bil-root .pl-go{border:none;border-radius:10px;padding:12px;background:#53bda7;color:#fff;font-family:inherit;font-weight:800;font-size:14px;cursor:pointer}' +
'#bil-root .pl-go:disabled,#bil-root .pl-now:disabled{opacity:.55;cursor:default}' +
'#bil-root .pl-now{border:1.5px solid #2a5ea9;border-radius:10px;padding:11px;background:#fff;color:#1F4A85;font-family:inherit;font-weight:800;font-size:13.5px;cursor:pointer}' +
'@media (max-width:760px){#bil-root .prio-row{flex-wrap:wrap}#bil-root .pr-main{flex:1 1 calc(100% - 80px)}#bil-root .pr-score{width:auto}}' +
'#bil-root .suivi-filters{display:flex;align-items:center;gap:12px;flex-wrap:wrap;margin-bottom:14px}' +
'#bil-root .suivi-search{flex:0 0 240px;max-width:240px;border:1px solid #e3e9f3;border-radius:9px;padding:8px 12px;font-family:inherit;font-size:13px;color:#1c2b45;background:#fff}' +
'#bil-root .suivi-search:focus{outline:none;border-color:#2a5ea9}' +
'#bil-root .suivi-stchips{display:flex;gap:6px;flex-wrap:wrap}' +
'#bil-root .st-chip{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:600;color:#2a5ea9;background:#fff;border:1px solid #e3e9f3;border-radius:16px;padding:5px 12px;cursor:pointer}' +
'#bil-root .st-chip:hover{background:rgba(172,197,228,.16)}' +
'#bil-root .st-chip.on{background:#2a5ea9;color:#fff;border-color:#2a5ea9}' +
'#bil-root .st-chip.rt.on{background:#d97070;border-color:#d97070}' +
'#bil-root .st-chip.re.on{background:#53bda7;border-color:#53bda7}' +
'#bil-root .st-chip.pr.on{background:#2a5ea9;border-color:#2a5ea9}' +
'#bil-root .st-chip .st-n{font-size:10px;font-weight:700;opacity:.7}' +
'#bil-root .suivi-sort{display:flex;gap:6px;flex-wrap:wrap}' +
'#bil-root .ssort{font-size:12px;font-weight:700;color:#2a5ea9;background:#fff;border:1px solid #e3e9f3;border-radius:16px;padding:5px 12px;cursor:pointer;user-select:none}' +
'#bil-root .ssort:hover{background:rgba(172,197,228,.16)}' +
'#bil-root .ssort.on{background:#2a5ea9;color:#fff;border-color:#2a5ea9}' +
'#bil-root .sort-lbl{font-size:12px;color:#8b99b0;font-weight:700;align-self:center;margin-right:2px}' +
'#bil-root .bil-back{font-size:13px;color:#2a5ea9;background:#fff;border:1px solid #e3e9f3;border-radius:8px;padding:6px 12px;cursor:pointer;font-weight:700;display:inline-block;margin-bottom:12px}' +
'#bil-root .bil-back:hover{background:rgba(172,197,228,.16)}' +
'#bil-root .vtbl{background:#fff;border:1px solid #e3e9f3;border-radius:12px;overflow:hidden;margin-bottom:6px}' +
'#bil-root .vrow{display:grid;grid-template-columns:1.5fr 1.35fr 1.75fr .95fr 26px;align-items:center;gap:14px;padding:13px 18px;border-bottom:1px solid #eef2f8;cursor:pointer;transition:background .12s}' +
'#bil-root .vrow:last-child{border-bottom:none}' +
'#bil-root .vrow.vthead{cursor:default;background:rgba(172,197,228,.16);padding:10px 18px}' +
'#bil-root .vrow:not(.vthead):hover{background:rgba(172,197,228,.10)}' +
'#bil-root .vth{font-size:11px;font-weight:800;color:#8b99b0;text-transform:uppercase;letter-spacing:.04em}' +
'#bil-root .vname{font-size:15px;font-weight:700;color:#2a5ea9}' +
'#bil-root .vname .vcat{font-size:10px;font-weight:800;color:#8b99b0;background:#eef2f8;border-radius:6px;padding:1px 6px;margin-left:6px;vertical-align:middle}' +
'#bil-root .rythme{font-size:12px;line-height:1.5}' +
'#bil-root .rythme .rdot{display:inline-block;width:7px;height:7px;border-radius:50%;margin-right:5px;vertical-align:middle}' +
'#bil-root .rdot.ok{background:#53bda7}#bil-root .rdot.warn{background:#fac055}#bil-root .rdot.late{background:#d97070}#bil-root .rdot.none{background:#cfd9e9}' +
'#bil-root .rythme .k{color:#8b99b0}#bil-root .rythme .d{font-weight:700;color:#1c2b45}' +
'#bil-root .rythme .rnext{color:#2a5ea9;font-weight:700}#bil-root .rythme .rnext.todo{color:#9bb3d1;font-weight:600}' +
'#bil-root .tcell{display:flex;flex-direction:column;gap:4px}' +
'#bil-root .tcell.empty{color:#9bb3d1;font-style:italic;font-size:12px}' +
'#bil-root .tcell .ttop{display:flex;align-items:center;gap:10px}' +
'#bil-root .tbar{flex:1;height:11px;border-radius:6px;overflow:hidden;display:flex;background:#eef2f8;min-width:80px}' +
'#bil-root .tbar i{display:block;height:100%}' +
'#bil-root .seg-t{background:#53bda7}#bil-root .seg-p{background:#fac055}#bil-root .seg-n{background:#d97070}#bil-root .seg-c{background:#d8dfe9}' +
'#bil-root .tpct{font-size:15px;font-weight:800;min-width:42px;text-align:right}' +
'#bil-root .tdet{font-size:11px;color:#8b99b0}' +
'#bil-root .acons{display:inline-flex;align-items:center;gap:6px}#bil-root .acons .ph{width:70px;height:8px;border-radius:5px;border:1px dashed #cfd9e9}' +
'#bil-root .vtf{font-size:14px;font-weight:800}' +
'#bil-root .vtf.up{color:#00997f}#bil-root .vtf.down{color:#c0524f}#bil-root .vtf.flat{color:#8b99b0}#bil-root .vtf.na{color:#cfd9e9;font-style:italic;font-size:12px}' +
'#bil-root .vchev{color:#9bb3d1;font-size:20px;font-weight:700;text-align:right}' +
'#bil-root .bil-legend{display:flex;gap:16px;flex-wrap:wrap;margin:10px 2px 6px;font-size:11px;color:#8b99b0}' +
'#bil-root .bil-legend .lg{display:inline-flex;align-items:center;gap:5px}' +
'#bil-root .bil-legend .sw{width:11px;height:11px;border-radius:3px;display:inline-block}' +
'#bil-root .bil-legend b{color:#1c2b45}' +
'#bil-root .ctbl{background:#fff;border:1px solid #e3e9f3;border-radius:12px;overflow:hidden}' +
'#bil-root .crow{display:grid;grid-template-columns:1.55fr 190px 1fr .85fr .85fr 24px;align-items:center;gap:14px;padding:14px 18px;border-bottom:1px solid #eef2f8;cursor:pointer;transition:background .12s}' +
'#bil-root .crow:last-child{border-bottom:none}' +
'#bil-root .crow.cthead{cursor:default;background:rgba(172,197,228,.16);padding:10px 18px}' +
'#bil-root .crow:not(.cthead):hover{background:rgba(172,197,228,.10)}' +
'#bil-root .cth{font-size:11px;font-weight:800;color:#8b99b0;text-transform:uppercase;letter-spacing:.04em}' +
'#bil-root .cname{font-size:15px;font-weight:700;color:#2a5ea9}' +
'#bil-root .cname .csite{display:block;font-size:11.5px;font-weight:600;color:#8b99b0;margin-top:1px}' +
'#bil-root .cflag{display:inline-block;font-size:10px;font-weight:800;border-radius:5px;padding:1px 7px;margin-left:6px;vertical-align:middle}' +
'#bil-root .cflag.irr{background:rgba(217,112,112,.13);color:#c0524f}' +
'#bil-root .cflag.exe{background:rgba(83,189,167,.16);color:#00997f}' +
'#bil-root .reg{display:flex;flex-direction:column;gap:3px}' +
'#bil-root .reg-cells{display:flex;gap:3px}' +
'#bil-root .reg-c{width:24px;height:22px;border-radius:5px;background:#eef2f8}' +
'#bil-root .reg-c.empty{border:1px dashed #cfd9e9;background:repeating-linear-gradient(45deg,#f4f7fb,#f4f7fb 3px,#eef2f8 3px,#eef2f8 6px)}' +
'#bil-root .reg-labels{display:flex;gap:3px}' +
'#bil-root .reg-labels span{width:24px;text-align:center;font-size:9px;color:#9bb3d1;font-weight:700}' +
'#bil-root .ccov{font-size:14px;font-weight:800}#bil-root .ccov .cfrac{font-size:11px;font-weight:600;color:#8b99b0;display:block;margin-top:1px}' +
'#bil-root .cten{font-size:15px;font-weight:800}' +
'#bil-root .cdel{font-size:14px;font-weight:800}#bil-root .cdel .u{font-size:11px;font-weight:600;color:#8b99b0}' +
'#bil-root .cchev{color:#9bb3d1;font-size:20px;font-weight:700;text-align:right}' +
'#bil-root .bil-period{display:flex;align-items:center;gap:10px;flex-wrap:wrap;background:#fff;border:1px solid #e3e9f3;border-radius:12px;padding:10px 14px;margin-bottom:14px}' +
'#bil-root .bp-lbl{font-size:11px;font-weight:800;color:#8b99b0;text-transform:uppercase;letter-spacing:.04em}' +
'#bil-root .bp-wrap{position:relative}' +
'#bil-root .bp-trigger{display:inline-flex;align-items:center;gap:9px;border:1px solid #e3e9f3;border-radius:10px;padding:8px 12px;background:#fff;color:#2a5ea9;font-family:inherit;font-size:13px;font-weight:700;cursor:pointer;transition:.12s}' +
'#bil-root .bp-trigger:hover{background:rgba(172,197,228,.12);border-color:#acc5e4}' +
'#bil-root .bp-cal-ico{display:inline-flex;color:#2a5ea9}' +
'#bil-root .bp-range-txt{display:inline-flex;align-items:center;gap:8px;color:#1c2b45;font-weight:700}' +
'#bil-root .bp-arrow{color:#9bb3d1;font-weight:400}' +
'#bil-root .bp-chev{font-size:9px;color:#9bb3d1}' +
'#bil-root .bp-backdrop{position:fixed;inset:0;z-index:40;background:transparent}' +
'#bil-root .bp-pop{position:absolute;top:calc(100% + 6px);left:0;z-index:41;background:#fff;border:1px solid #e3e9f3;border-radius:14px;box-shadow:0 16px 44px rgba(28,43,69,.22);padding:14px;width:290px}' +
'#bil-root .bp-cal-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:10px}' +
'#bil-root .bp-cal-title{font-size:14px;font-weight:800;color:#2a5ea9;text-transform:capitalize}' +
'#bil-root .bp-nav{width:28px;height:28px;border-radius:8px;border:1px solid #e3e9f3;background:#fff;color:#2a5ea9;font-size:16px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center}' +
'#bil-root .bp-nav:hover{background:rgba(172,197,228,.16)}' +
'#bil-root .bp-cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:2px}' +
'#bil-root .bp-wd{font-size:10px;font-weight:800;color:#9bb3d1;text-align:center;padding:2px 0 4px}' +
'#bil-root .bp-day{aspect-ratio:1/1;border:none;background:none;border-radius:8px;font-family:inherit;font-size:12.5px;font-weight:600;color:#1c2b45;cursor:pointer;padding:0;display:flex;align-items:center;justify-content:center}' +
'#bil-root .bp-day:hover:not(.empty){background:rgba(172,197,228,.22)}' +
'#bil-root .bp-day.empty{cursor:default}' +
'#bil-root .bp-day.today{box-shadow:inset 0 0 0 1.5px #acc5e4}' +
'#bil-root .bp-day.in-range{background:rgba(42,94,169,.10);border-radius:0;color:#2a5ea9}' +
'#bil-root .bp-day.sel-start{background:#2a5ea9;color:#fff;border-radius:8px 0 0 8px}' +
'#bil-root .bp-day.sel-end{background:#2a5ea9;color:#fff;border-radius:0 8px 8px 0}' +
'#bil-root .bp-day.sel-single{background:#2a5ea9;color:#fff;border-radius:8px}' +
'#bil-root .bp-day.pending{background:#53bda7;color:#fff;box-shadow:0 0 0 3px rgba(83,189,167,.25)}' +
'#bil-root .bp-pop-foot{margin-top:12px;padding-top:10px;border-top:1px solid #e3e9f3;display:flex;flex-direction:column;gap:8px}' +
'#bil-root .bp-hint{font-size:11px;color:#8b99b0}#bil-root .bp-hint b{color:#2a5ea9}' +
'#bil-root .bp-presets{display:flex;gap:6px;flex-wrap:wrap}' +
'#bil-root .bp-preset{font-size:12px;font-weight:700;color:#2a5ea9;background:#fff;border:1px solid #e3e9f3;border-radius:16px;padding:5px 12px;cursor:pointer;font-family:inherit}' +
'#bil-root .bp-preset:hover{background:rgba(172,197,228,.16)}' +
'#bil-root .bil-perim{background:#fff;border:1px solid #e3e9f3;border-radius:12px;margin-bottom:14px;padding:10px 12px 12px}' +
'#bil-root .perim-title{font-size:11px;font-weight:800;color:#8b99b0;text-transform:uppercase;letter-spacing:.04em;margin:2px 4px 6px}' +
'#bil-root .tree-row.lv-root{font-weight:800;color:#1c2b45}' +
'#bil-root .tree-row.sel{background:rgba(42,94,169,.10);border-radius:7px}' +
'#bil-root .bil-tabs{display:flex;gap:6px;margin-bottom:16px;flex-wrap:wrap}' +
'#bil-root .bil-tab{font-size:13px;font-weight:700;color:#2a5ea9;background:#fff;border:1px solid #e3e9f3;border-radius:9px;padding:8px 16px;cursor:pointer}' +
'#bil-root .bil-tab:hover{background:rgba(172,197,228,.16)}' +
'#bil-root .bil-tab.on{background:#2a5ea9;color:#fff;border-color:#2a5ea9}' +
'#bil-root .hint-line{font-size:12px;color:#8b99b0;margin:2px 0 14px}' +
'#bil-root .lead-head{display:grid;grid-template-columns:46px 1.6fr 150px 1fr 1fr 24px;gap:14px;padding:4px 16px;font-size:11px;font-weight:800;color:#8b99b0;text-transform:uppercase;letter-spacing:.04em}' +
'#bil-root .lead-list{display:flex;flex-direction:column;gap:8px}' +
'#bil-root .lead-row{display:grid;grid-template-columns:46px 1.6fr 150px 1fr 1fr 24px;align-items:center;gap:14px;background:#fff;border:1px solid #e3e9f3;border-radius:12px;padding:13px 16px;cursor:pointer;transition:box-shadow .15s,transform .12s}' +
'#bil-root .lead-row:hover{box-shadow:0 4px 16px rgba(42,94,169,.10);transform:translateY(-1px)}' +
'#bil-root .lead-score{width:46px;height:42px;border-radius:9px;display:flex;align-items:center;justify-content:center;font-size:17px;font-weight:800}' +
'#bil-root .lead-name{font-size:15px;font-weight:700;color:#2a5ea9}' +
'#bil-root .lead-name .lead-sub{display:block;font-size:11.5px;font-weight:600;color:#8b99b0;margin-top:1px}' +
'#bil-root .lead-metric{font-size:14px;font-weight:800}' +
'#bil-root .lead-metric .lm-l{display:block;font-size:10px;font-weight:700;color:#9bb3d1;text-transform:uppercase;letter-spacing:.03em;margin-bottom:1px}' +
'#bil-root .lead-na{font-size:11px;color:#9bb3d1}' +
'#bil-root .lead-chev{color:#9bb3d1;font-size:20px;font-weight:700;text-align:right}' +
'#bil-root .bil-hscroll{width:100%;overflow-x:auto;-webkit-overflow-scrolling:touch}' +
'#bil-root .bil-hscroll-inner{min-width:700px}' +
'#bil-root .bil-hscroll .vtbl{min-width:720px}' +
'#bil-root .bil-hscroll .ctbl{min-width:760px}' +
'@media (max-width:760px){' +
  '#bil-root .suivi-search{flex:1 1 100%;max-width:none}' +
  '#bil-root .tl::before{left:13px}' +
  '#bil-root .tl-sep{text-align:left;padding-left:0}' +
  '#bil-root .tl-row,#bil-root .tl-row.left,#bil-root .tl-row.right{justify-content:flex-end;min-height:auto;margin-bottom:24px}' +
  '#bil-root .tl-dot{left:13px;top:6px;transform:none}' +
  '#bil-root .tl-date{left:36px;top:-4px;transform:none}' +
  '#bil-root .tl-card{width:calc(100% - 36px);margin-top:14px}' +
  '#bil-root .tl-row.left .tl-card::after,#bil-root .tl-row.right .tl-card::after{display:none}' +
  '#bil-root .bil-ov{padding:12px}' +
'}' +
'#bil-root.bil-narrow .suivi-search{flex:1 1 100%;max-width:none}' +
'#bil-root.bil-narrow .bil-hscroll .vtbl{min-width:0}' +
'#bil-root.bil-narrow .vrow.vthead{display:none}' +
'#bil-root.bil-narrow .vrow{grid-template-columns:minmax(0,1fr) auto;gap:8px 14px;padding:12px 14px}' +
'#bil-root.bil-narrow .vrow>.vname{grid-column:1;grid-row:1}' +
'#bil-root.bil-narrow .vrow>.vchev{grid-column:2;grid-row:1}' +
'#bil-root.bil-narrow .vrow>.c-ryt{grid-column:1/3}' +
'#bil-root.bil-narrow .vrow>.c-ten{grid-column:1}' +
'#bil-root.bil-narrow .vrow>.c-tf{grid-column:2;text-align:right}' +
'#bil-root.bil-narrow .vrow>[data-l]::before{content:attr(data-l);display:block;font-size:10px;font-weight:800;color:#8b99b0;text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px}' +
'#bil-root.bil-narrow .tbar{min-width:60px}' +
'#bil-root.bil-narrow .pt-tree th:nth-child(2),#bil-root.bil-narrow .pt-tree td:nth-child(2),#bil-root.bil-narrow .pt-tree th:nth-child(4),#bil-root.bil-narrow .pt-tree td:nth-child(4),#bil-root.bil-narrow .pt-tree th:nth-child(6),#bil-root.bil-narrow .pt-tree td:nth-child(6){display:none}' +
'#bil-root.bil-narrow .pt-shead .sub{display:none}' +
'#bil-root.bil-narrow .pt-card{padding:12px}' +
'#bil-root.bil-narrow .suivi-cov{display:block;margin:4px 0 0}' +
'#bil-root.bil-narrow .site-title{flex-wrap:wrap}' +
'#bil-root.bil-narrow .tl::before{left:13px}' +
'#bil-root.bil-narrow .tl-sep{text-align:left;padding-left:0}' +
'#bil-root.bil-narrow .tl-row,#bil-root.bil-narrow .tl-row.left,#bil-root.bil-narrow .tl-row.right{justify-content:flex-end;min-height:auto;margin-bottom:24px}' +
'#bil-root.bil-narrow .tl-dot{left:13px;top:6px;transform:none}' +
'#bil-root.bil-narrow .tl-date{left:36px;top:-4px;transform:none}' +
'#bil-root.bil-narrow .tl-card{width:calc(100% - 36px);margin-top:14px}' +
'#bil-root.bil-narrow .tl-row.left .tl-card::after,#bil-root.bil-narrow .tl-row.right .tl-card::after{display:none}' +
'</style>';

// --- Watcher période DÉSACTIVÉ ----------------------------------------------
// La période est désormais pilotée par le sélecteur de dates autonome de la page
// (voir renderDatePicker / __bilSetPeriod). On s'assure juste qu'un ancien timer
// éventuellement laissé par une précédente version soit bien arrêté.
(function stopLegacyPeriodWatcher() {
  if (window.__bilPeriodTimer) { clearInterval(window.__bilPeriodTimer); window.__bilPeriodTimer = null; }
})();

// --- Démarrage robuste (attend #bil-root si pas encore monté) ---------------
// Démarrage : le loader fournit __anchor et possède le cycle de vie (re-montage
// SPA compris) -> plus d'attente d'ancre ni de filets de re-render.
render(); loadData();


// ============================================================================
//  MODULE POPUP RÉALISATION (intégré dans le suivi)
//  Ouvre un grand popup #real-ov avec tout le contexte vendeur + saisie + histo.
//  Sous-état R isolé. Fonctions préfixées R_. Réutilise esc/fmtDate/fmtHeure du suivi.
// ============================================================================
const R = { bilId:null, detail:null, hist:null, loading:false, error:null, kpi:'cmd', histIdx:0, saving:false, b2filter:'tous',
  engagements:[], ouverts:[], revues:{}, engLoaded:false, reunion:false, _draftApplied:false,
  K:null, Kp:null, kLoaded:false, dashErr:null, cad:null, parts:{}, legacy:false, future:false, done:null };

const R_WF_GET_FICHE  = '53250f54-d14c-4622-baf4-0b89064316b6';
const R_PAGE_FICHE_ID = '259f1951-a2d4-4b90-ac83-0b3febe1d4ec';
const R_TAB_CONTACTS  = 2;
const R_PAGE_PROPALE_UPDATE = 'efb6187d-2330-4392-86ed-bc5ad2489fed';
const R_VAR_ID_PROPALE      = 'aac565e9-ad32-4f81-bf8d-adb611322e62';
const R_PDF_EDGE_FN   = 'generate-document';
const R_TPL_PROPOSITION  = 'a8a39792-b795-4a07-92a2-8bd307ec105b';
const R_TPL_BON_COMMANDE = 'a440bca0-e10a-4549-a11b-f4ad512b010d';
const R_PDF_BUCKET    = 'commercial-documents';

function R_eur(n){ if(n==null) return ''; return new Intl.NumberFormat('fr-FR').format(Math.round(n))+' €'; }


// Navigation ÉDITEUR vs PROD (patron topnav) : en prod, un UID s'inscrit tel quel
// dans l'URL -> route inexistante -> page blanche. On navigue donc par CHEMIN.
const R_SELECTED_CLIENT_VAR = '55490583-c88b-4748-916e-4d203db07742';
const R_PATH_FICHE_CLIENT   = '/fr/fiche-client';
const R_PATH_PROPALE_UPDATE = '/fr/propo-vo-update';
function R_inEditor(){
  try { return (window.self !== window.top) || /-editor\.weweb\.io|weweb\.io/i.test(location.hostname); }
  catch(e){ return true; }
}
function R_goPage(pageId, path){
  if (R_inEditor()) { try { wwLib.wwApp.goTo(pageId); return; } catch(e){} }
  try { wwLib.goTo(path); return; } catch(e){}
  try { (doc.defaultView || window).location.href = path; } catch(e){}
}
// Ouvre la fiche client : le client passe par SA variable (fiche-shell recharge
// lui-même) et l'onglet par le global lu par fiche-shell. Le workflow WeWeb
// R_WF_GET_FICHE a été supprimé du projet -> on ne l'appelle plus.
function R_setClientAndTab(idClient, tab){
  try { wwLib.wwVariable.updateValue(R_SELECTED_CLIENT_VAR, { IDVu: Number(idClient) }); } catch(e){}
  try { const w = (wwLib.getFrontWindow && wwLib.getFrontWindow()) || window; w.__odFicheTab = (tab != null ? tab : 0); } catch(e){}
}
async function R_openClientFiche(idClient){
  if(!idClient){ console.warn('[real] openClientFiche: id_client manquant'); return; }
  try {
    R_setClientAndTab(idClient, R_TAB_CONTACTS);
    R_close();
    R_goPage(R_PAGE_FICHE_ID, R_PATH_FICHE_CLIENT);
  } catch(e){ console.error('[real] openClientFiche', e); }
}
async function R_openClientFicheTab(idClient, tab){
  if(!idClient){ return; }
  try {
    R_setClientAndTab(idClient, tab);
    R_close();
    R_goPage(R_PAGE_FICHE_ID, R_PATH_FICHE_CLIENT);
  } catch(e){ console.error('[real] openClientFicheTab', e); }
}
function R_modifPropale(idPropale){
  try { wwLib.wwVariable.updateValue(R_VAR_ID_PROPALE, Number(idPropale)); }
  catch(e){ console.error('[real] updateValue id_propale_bdc', e); }
  try { R_close(); R_goPage(R_PAGE_PROPALE_UPDATE, R_PATH_PROPALE_UPDATE); }
  catch(e){ console.error('[real] navigation propale update', e); }
}
async function R_pdfPropale(idPropale, status, majIso){
  const supabase = ctx.supabase;
  const isPropale = (status==='propale');
  const type = isPropale ? 'proposition_commerciale' : 'bon_de_commande';
  const templateId = isPropale ? R_TPL_PROPOSITION : R_TPL_BON_COMMANDE;
  const btn = doc.querySelector('[data-rpdf="'+idPropale+':'+status+'"]');
  if(btn){ btn.disabled=true; btn.style.opacity='.5'; }
  const open = (url)=>{ try { wwLib.getFrontWindow().open(url, '_blank'); } catch(e){ window.open(url,'_blank'); } };
  const done = ()=>{ if(btn){ btn.disabled=false; btn.style.opacity=''; } };
  const generer = async ()=>{
    const { data: gen, error: gErr } = await supabase.functions.invoke(R_PDF_EDGE_FN, {
      body: { id_propale_bdc: idPropale, template_id: templateId, type: type }
    });
    if(gErr) throw gErr;
    if(gen && gen.ok && gen.signed_url){ open(gen.signed_url); }
    else { throw new Error(gen && gen.error ? gen.error : 'Génération PDF échouée'); }
  };
  try {
    const { data: docs, error: qErr } = await supabase
      .from('generated_documents')
      .select('storage_path, ready_at')
      .eq('id_propale_bdc', idPropale)
      .eq('type', type)
      .eq('status', 'ready')
      .order('ready_at', { ascending: false })
      .limit(1);
    if(qErr) throw qErr;
    if(docs && docs.length && docs[0].storage_path){
      const pdfTime = docs[0].ready_at ? new Date(docs[0].ready_at).getTime() : 0;
      const majTime = majIso ? new Date(String(majIso).replace(' ','T')).getTime() : 0;
      const aJour = pdfTime >= majTime;
      if(aJour){
        const { data: signed, error: sErr } = await supabase.storage
          .from(R_PDF_BUCKET).createSignedUrl(docs[0].storage_path, 3600);
        if(!sErr && signed && signed.signedUrl){ open(signed.signedUrl); return; }
      }
    }
    await generer();
  } catch(e){
    console.error('[real] PDF propale', e);
    alert('Impossible de générer le PDF : '+((e && e.message)?e.message:e));
  } finally { done(); }
}

function R_LS(){ try { return wwLib.getFrontWindow().localStorage; } catch(e){ return window.localStorage; } }
// Clé du brouillon : id + vendeur + date prévue. L'id seul ne suffit pas :
// create_bilaterale numérote par max+1, un id libéré par une suppression est
// réattribué, et la nouvelle fiche héritait du brouillon de l'ancienne
// (relevé du 14/10/2026 : « Recette : bilan test… » réapparu).
function R_draftKey(){
  if(R.bilId==null || !R.detail) return null;
  return 'bil_draft_'+R.bilId+'_'+R.detail.id_user+'_'+String(R.detail.start_date||'').slice(0,16).replace(/[^0-9]/g,'');
}
let R_draftTimer=null;
function R_saveDraft(){
  if(R.bilId==null) return;
  if(R_draftTimer) clearTimeout(R_draftTimer);
  R_draftTimer=setTimeout(()=>{
    try {
      const payload={ resultat:(R.detail&&R.detail.resultat)||'', actions:(R.detail&&R.detail.actions)||'',
        engagements:(R.engagements||[]).map(e=>({libelle:e.libelle,ordre:e.ordre,cible:e.cible,echeance:e.echeance})), revues:R.revues||{}, ts:Date.now() };
      const k=R_draftKey(); if(!k) return;
      R_LS().setItem(k, JSON.stringify(payload));
      const ind=doc.getElementById('r-draft-ind'); if(ind){ ind.textContent='brouillon enregistré'; ind.style.opacity='1'; setTimeout(()=>{ if(ind) ind.style.opacity='.5'; },1200); }
    } catch(e){}
  }, 500);
}
function R_clearDraft(){ try { const k=R.draftKeyAtLoad||R_draftKey(); if(k) R_LS().removeItem(k); R_LS().removeItem('bil_draft_'+R.bilId); } catch(e){} }
function R_applyDraft(){
  if(R._draftApplied) return; R._draftApplied=true;
  try {
    R.draftKeyAtLoad=R_draftKey();
    try { R_LS().removeItem('bil_draft_'+R.bilId); } catch(x){}   // ancien format, ambigu : abandonné
    const raw=R.draftKeyAtLoad ? R_LS().getItem(R.draftKeyAtLoad) : null; if(!raw) return;
    const d=JSON.parse(raw); if(!d) return;
    if(R.detail){ if(d.resultat){ R.detail.resultat=d.resultat; R.fromDraft=true; } if(d.actions) R.detail.actions=d.actions; }
    if(Array.isArray(d.engagements) && d.engagements.length) R.engagements=d.engagements.map((e,i)=>({ libelle:e.libelle||'', ordre:e.ordre!=null?e.ordre:i, cible:(e.cible!=null?e.cible:''), echeance:e.echeance||'' }));
    if(d.revues && typeof d.revues==='object') R.revues=d.revues;
  } catch(e){}
}
window.__bilDraftField=function(which,val){ if(!R.detail) return; if(which==='res') R.detail.resultat=val; if(which==='act') R.detail.actions=val; R_saveDraft(); };
window.__bilEngInput=function(i,field,val){
  if(!(R.engagements && R.engagements[i])) return;
  if(field==='cible') R.engagements[i].cible=val;
  else if(field==='echeance') R.engagements[i].echeance=val;
  else R.engagements[i].libelle=val;
  R_saveDraft();
};
function R_lireSaisie(){
  const res=doc.getElementById('rf-res'), act=doc.getElementById('rf-act');
  if(R.detail){ if(res) R.detail.resultat=res.value; if(act) R.detail.actions=act.value; }
  const rows=doc.querySelectorAll('#real-ov .eng-item');
  (R.engagements||[]).forEach((e,i)=>{ const r=rows[i]; if(!r) return;
    const l=r.querySelector('.eng-inp'), c=r.querySelector('.eng-cible'), d=r.querySelector('.eng-ech');
    if(l) e.libelle=l.value; if(c) e.cible=c.value; if(d) e.echeance=d.value; });
}
function R_fmtJour(dstr){ if(!dstr) return ''; const d=new Date(String(dstr).slice(0,10)+'T12:00:00'); if(isNaN(d)) return ''; return d.toLocaleDateString('fr-FR',{day:'2-digit',month:'2-digit'}); }
function R_engTexte(e){
  return (e.libelle||'').trim()+((e.cible!==''&&e.cible!=null)?' — objectif '+e.cible:'')+(e.echeance?' — pour le '+R_fmtJour(e.echeance):'');
}

function R_print(){
  const d=R.detail; if(!d) return;
  R_lireSaisie();
  const res=d.resultat||'', act=d.actions||'';
  const engs=(R.engagements||[]).filter(e=>(e.libelle||'').trim()).map(R_engTexte);
  const stLbl=(st)=> st==='tenu'?'Tenu':st==='partiel'?'Partiel':st==='non_tenu'?'Non tenu':'Non pointé';
  const ouvertsHtml=(R.ouverts||[]).map(o=>'<li>'+esc(R_engTexte(o))+' — <b>'+stLbl(R.revues[o.id])+'</b></li>').join('');
  const today=new Date(); const todayStr=today.getDate()+' '+MOIS_FR[today.getMonth()]+' '+today.getFullYear();
  const html='<!doctype html><html lang="fr"><head><meta charset="utf-8"><title>Bilatérale '+esc(d.nom_vendeur)+'</title>'+
    '<style>body{font-family:Arial,Helvetica,sans-serif;color:#1c2b45;max-width:720px;margin:30px auto;padding:0 24px;line-height:1.5}'+
    'h1{color:#2a5ea9;font-size:22px;margin:0 0 4px}.sub{color:#888;font-size:13px;margin-bottom:22px}'+
    'h2{font-size:13px;text-transform:uppercase;letter-spacing:.04em;border-bottom:2px solid #acc5e4;padding-bottom:4px;margin:22px 0 8px;color:#2a5ea9}'+
    '.txt{white-space:pre-wrap;font-size:14px}ul{margin:6px 0;padding-left:20px}li{margin:3px 0;font-size:14px}'+
    '.foot{margin-top:34px;color:#aaa;font-size:11px;border-top:1px solid #eee;padding-top:8px}@media print{body{margin:0}}</style>'+
    '</head><body>'+
    '<h1>Compte-rendu de bilatérale</h1>'+
    '<div class="sub">'+esc(d.nom_vendeur)+(d.vn_vo?(' · '+esc(d.vn_vo)):'')+' · '+esc(d.nom_site||'')+'<br>'+esc(fmtDate(d.start_date))+' · avec '+esc(d.nom_chef||'')+'</div>'+
    (ouvertsHtml?'<h2>Suivi des engagements précédents</h2><ul>'+ouvertsHtml+'</ul>':'')+
    '<h2>Bilan</h2><div class="txt">'+esc(res||'—')+'</div>'+
    '<h2>Actions décidées</h2><div class="txt">'+esc(act||'—')+'</div>'+
    '<h2>Engagements pris</h2>'+(engs.length?('<ul>'+engs.map(e=>'<li>'+esc(e)+'</li>').join('')+'</ul>'):'<div class="txt">—</div>')+
    '<div class="foot">Édité le '+todayStr+' depuis One Data</div>'+
    '<scr'+'ipt>window.onload=function(){setTimeout(function(){window.print();},250);};</scr'+'ipt>'+
    '</body></html>';
  let w; try { w=wwLib.getFrontWindow().open('','_blank'); } catch(e){ w=window.open('','_blank'); }
  if(!w){ alert('Veuillez autoriser les fenêtres pop-up pour imprimer le compte-rendu.'); return; }
  w.document.open(); w.document.write(html); w.document.close();
}

const R_PARTS = ['pipeline','rdv','cycles','clos'];
function R_open(bilId){
  R.bilId = Number(bilId); R.detail=null; R.hist=null;
  R.error=null; R.kpi='cmd'; R.histIdx=0; R.saving=false;
  R.histLoading=false; R.b2filter='tous';
  R.engagements=[]; R.ouverts=[]; R.revues={}; R.engLoaded=false; R.reunion=false; R._draftApplied=false;
  R.K=null; R.Kp=null; R.kLoaded=false; R.dashErr=null; R.cad=null; R.parts={}; R.legacy=false;
  R.future=false; R.done=null; R.prefilled=false; R.fromDraft=false; R.saveErr=''; R.nextDate=''; R.nextHeure=''; R.nextMsg='';
  R_ensureOverlay();
  R_render();
  R_load();
}
function R_close(){ const ov = doc.getElementById('real-ov'); if(ov) ov.remove(); }
function R_ensureOverlay(){
  let ov = doc.getElementById('real-ov');
  if(!ov){ ov = doc.createElement('div'); ov.id='real-ov'; doc.body.appendChild(ov); }
}

async function R_load(){
  const id = R.bilId;
  if(id==null){ R.error='Aucune bilatérale spécifiée.'; R_render(); return; }
  if(R.loading) return;
  R.loading=true; R.error=null; R_render();
  try {
    const supabase = ctx.supabase;
    const rDet = await supabase.rpc('get_bilaterale_detail', { p_id: id });
    if(rDet.error) throw rDet.error;
    R.detail = rDet.data || null;
    if(!R.detail || R.detail.id_user==null){ R.error='Bilatérale introuvable.'; R.loading=false; R_render(); return; }
    R.loading=false;
    const sd = R.detail.start_date ? new Date(String(R.detail.start_date).replace(' ','T')) : null;
    const filled = !!((R.detail.resultat||'').trim() || (R.detail.actions||'').trim() || (R.detail.engagement||'').trim());
    R.future = !!(sd && sd > new Date() && !filled);
    R.histLoading=true;
    R_render();
    const idUser = Number(R.detail.id_user);
    R.cad = (state.cadence||[]).find(x=>x.id_user===idUser) || null;
    R_loadDash();
    R_PARTS.forEach(R_loadPart);
    supabase.rpc('get_bilaterales_historique', { p_id_user: idUser, p_exclure_id: id })
      .then(r=>{ if(r.error) throw r.error; R.hist=r.data||[]; })
      .catch(e=>{ console.error('[real] historique', e); R.hist=[]; })
      .finally(()=>{ R.histLoading=false; R_render(); });
    // Engagements : nouvelles fonctions (cible, échéance), repli sur les anciennes.
    R_rpcRepli('bilat_engagements', { p_id_bilaterales: id }, 'get_bilaterale_engagements', { p_id_bilaterales: id })
      .then(r=>{ if(r.error) throw r.error; R.engagements=(r.data||[]).map(x=>({ id:x.id, libelle:x.libelle, ordre:x.ordre, cible:(x.cible!=null?x.cible:''), echeance:x.echeance||'' })); })
      .catch(e=>{ console.error('[real] engagements', e); R.engagements=[]; })
      .finally(()=>{ R.engLoaded=true; R_applyDraft(); R_prefillConstats(); R_render(); });
    R_rpcRepli('bilat_engagements_ouverts', { p_id_user: idUser, p_exclure_bilaterale: id }, 'get_engagements_ouverts', { p_id_user: idUser, p_exclure_bilaterale: id })
      .then(r=>{ if(r.error) throw r.error; R.ouverts=(r.data||[]).map(x=>({ id:x.id, libelle:x.libelle, statut_suivi:x.statut_suivi, id_bilaterales:x.id_bilaterales, bilaterale_date:x.bilaterale_date, cible:(x.cible!=null?x.cible:''), echeance:x.echeance||'' })); })
      .catch(e=>{ console.error('[real] ouverts', e); R.ouverts=[]; })
      .finally(()=>{ R_render(); });
  } catch(e){
    console.error('[real] RPC', e);
    R.error = (e && e.message) ? e.message : String(e);
    R.loading=false; R_render();
  }
}
function R_fonctionAbsente(err){ const m=(err&&(err.message||err.code))||''; return /PGRST202|Could not find the function|does not exist/i.test(String(m)) || (err&&err.code==='PGRST202'); }
async function R_rpcRepli(fn, args, fnRepli, argsRepli){
  const r = await ctx.supabase.rpc(fn, args);
  if(r.error && R_fonctionAbsente(r.error) && fnRepli) return ctx.supabase.rpc(fnRepli, argsRepli);
  return r;
}
// Chiffres de tête : dash_lire, mois en cours + mois précédent (comparaison).
function R_loadDash(){
  const idUser = Number(R.detail.id_user);
  const a = new Date(); const p = new Date(a.getFullYear(), a.getMonth()-1, 1);
  R.kLoaded=false; R.dashErr=null;
  Promise.all([lireDash(a.getFullYear(), a.getMonth()+1), lireDash(p.getFullYear(), p.getMonth()+1).catch(e=>({ error:e }))])
    .then(([cur, prev])=>{
      if(cur.error) throw cur.error;
      const ix = indexerDash(cur.data);
      R.K = ix.parUser[idUser] || null;
      R.majDash = ix.maj;
      if(prev && !prev.error && prev.data){ const ip=indexerDash(prev.data); R.Kp = ip.parUser[idUser] || null; }
    })
    .catch(e=>{ console.error('[real] dash_lire', e); R.dashErr = messageErreur(e); })
    .finally(()=>{ R.kLoaded=true; R_prefillConstats(); R_render(); });
}
// Détail par section. Une section lente ou en erreur n'empêche pas les autres.
function R_loadPart(part){
  const idUser = Number(R.detail.id_user);
  R.parts[part] = { st:'load' };
  if(R.legacy){ R_loadLegacy(); return; }
  Promise.resolve(ctx.supabase.rpc('bilat_synthese_part', { p_id_user: idUser, p_part: part }))
    .then(r=>{
      if(r.error){
        if(R_fonctionAbsente(r.error)){ R.legacy=true; R_loadLegacy(); return; }
        throw r.error;
      }
      R.parts[part] = { st:'ok', data: Array.isArray(r.data) ? r.data : [] };
      R_render();
    })
    .catch(e=>{ console.error('[real] section '+part, e); R.parts[part] = { st:'err', err: messageErreur(e) }; R_render(); });
}
// Repli (fonction bilat_synthese_part absente) : l'ancienne synthèse d'un bloc.
let R_legacyEnVol=false;
function R_loadLegacy(){
  if(R_legacyEnVol) return; R_legacyEnVol=true;
  const idUser = Number(R.detail.id_user);
  const a = new Date(); const from = ymd(new Date(a.getFullYear(), a.getMonth(), 1));
  Promise.resolve(ctx.supabase.rpc('get_vendeur_synthese', { p_id_user: idUser, p_date_from: from, p_date_to: ymd(a) }))
    .then(r=>{ if(r.error) throw r.error; const s=r.data||{}; R_PARTS.forEach(p=>{ R.parts[p]={ st:'ok', data: s[p]||[] }; }); })
    .catch(e=>{ const m=messageErreur(e); R_PARTS.forEach(p=>{ R.parts[p]={ st:'err', err:m }; }); })
    .finally(()=>{ R_legacyEnVol=false; R_render(); });
}

function R_kpiData(){
  const part = p => (R.parts[p] && R.parts[p].st==='ok') ? R.parts[p].data : [];
  const cycles=part('cycles'), clos=part('clos'), pipeline=part('pipeline'), rdv=part('rdv');
  const atraiter=cycles.filter(c=>c.categorie==='retard'||c.categorie==='urgent');
  const nbRetardRdv=rdv.filter(r=>r.en_retard===true).length;
  const nbAvenirRdv=rdv.filter(r=>r.categorie==='avenir').length;
  const wins=clos.filter(c=>c.type_cloture==='win').length;
  const abandons=clos.filter(c=>c.type_cloture==='abandon').length;
  return {cycles,clos,pipeline,rdv,atraiter,nbRetardRdv,nbAvenirRdv,wins,abandons};
}
// Objectif attendu à la date du jour (prorata calendaire du mois).
function R_objectif(rea, obj){
  rea=Number(rea)||0; obj=Number(obj)||0;
  if(obj<=0) return { obj:0, rea, att:null, ecart:null };
  const att=obj*prorataMois(); return { obj, rea, att, ecart: rea-att };
}
function R_transfoSous(c){
  if(state.txMesurable===false) return 'non mesurable : aucune affaire perdue enregistrée';
  if(!c) return state.loading||!state.cadence ? 'chargement…' : 'pas de donnée sur la période';
  if(c.transfo_actuel==null) return state.transfoStable ? 'aucune affaire tranchée sur '+BIL_CFG.transfoJours+' j' : 'aucune proposition sur la période';
  if(!c.tx_signif) return 'volume insuffisant'+(c.tx_tot_actuel!=null?' ('+c.tx_tot_actuel+' '+txUnite()+')':'');
  const avant = c.tx_signif_prec&&c.transfo_precedent!=null ? fmtNb(c.transfo_precedent)+' % '+(state.transfoStable?'les '+BIL_CFG.transfoJours+' j d’avant':'la période précédente') : 'gagnées / tranchées';
  return avant+(c.tx_tot_actuel!=null?' · '+c.tx_tot_actuel+' '+txUnite():'')+(state.transfoStable&&c.tx_ouvertes?' · '+c.tx_ouvertes+' encore ouvertes':'');
}
function R_heureParis(v){
  try {
    let t=String(v).trim().replace(' ','T');
    if(!/[zZ]|[+-]\d\d:?\d\d$/.test(t)) t+='Z';
    const d=new Date(t); if(isNaN(d)) return String(v).slice(11,16);
    return d.toLocaleTimeString('fr-FR',{hour:'2-digit',minute:'2-digit',timeZone:'Europe/Paris'}).replace(':','h');
  } catch(e){ return String(v).slice(11,16); }
}
function R_txTile(){
  const c=R.cad;
  const txCol = !c||!c.tx_signif ? '#8b99b0' : (c.transfo_baisse?'#c0524f':(c.transfo_hausse?'#00997f':'#2a5ea9'));
  return '<div class="kpi mute" id="r-kpi-tx"><div class="k-l">Transformation'+txFenetre()+'</div><div class="k-v" style="color:'+txCol+'">'+(c&&c.tx_signif&&c.transfo_actuel!=null?fmtNb(c.transfo_actuel)+' %':'—')+'</div><div class="k-s">'+esc(R_transfoSous(c))+'</div></div>';
}
function R_partEtat(p){ const x=R.parts[p]; return !x ? 'load' : x.st; }
function R_kpis(){
  const K=R.K||{}, Kp=R.Kp||null, D=R_kpiData(), on=s=>R.kpi===s?' on':'';
  const dashOk = !!R.K;
  const v = (x)=> dashOk ? fmtNb(x,0) : '—';
  const cmd = R_objectif(K.cdes, K.obj_cdes), fi = R_objectif(K.fi, K.obj_fi);
  const colObj = o => o.ecart==null ? '#2a5ea9' : (o.ecart < -0.5 ? '#c0524f' : '#00997f');
  const subObj = (o, unite) => o.att==null ? 'pas d’objectif saisi' : ('attendu à date '+fmtNb(o.att)+' · '+(o.ecart<0?'retard ':'avance +')+fmtNb(Math.abs(o.ecart))+' '+unite);
  let h='';
  if(!R.kLoaded) h+='<div class="r-load-inline" style="padding:6px">Chargement des chiffres…</div>';
  else if(R.dashErr) h+='<div class="r-warn">Chiffres du tableau de bord indisponibles ('+esc(R.dashErr)+'). <button class="lnk" data-ract="retry:dash">Réessayer</button></div>';
  else if(!R.K) h+='<div class="r-warn">Aucun chiffre ce mois-ci pour ce vendeur dans le tableau de bord.</div>';
  h+='<div class="kpis">';
  h+='<div class="kpi clik big'+on('cmd')+'" data-rkpi="cmd"><div class="k-l">Commandes du mois</div><div class="k-v" style="color:'+colObj(cmd)+'">'+v(K.cdes)+(cmd.obj?'<span class="k-of"> / '+fmtNb(cmd.obj,0)+'</span>':'')+'</div><div class="k-s">'+(dashOk?subObj(cmd,'cmd'):'')+'</div>'+(Kp?'<div class="k-p">mois dernier : '+fmtNb(Kp.cdes,0)+(Kp.obj_cdes?' / '+fmtNb(Kp.obj_cdes,0):'')+'</div>':'')+'</div>';
  h+='<div class="kpi clik'+on('fi')+'" data-rkpi="fi"><div class="k-l">Financements</div><div class="k-v" style="color:'+colObj(fi)+'">'+v(K.fi)+(fi.obj?'<span class="k-of"> / '+fmtNb(fi.obj,0)+'</span>':'')+'</div><div class="k-s">'+(dashOk?(fi.att==null?'pas d’objectif saisi':'attendu à date '+fmtNb(fi.att)):'')+'</div></div>';
  h+=R_txTile();
  h+='<div class="kpi clik'+on('pipeline')+'" data-rkpi="pipeline"><div class="k-l">Affaires en cours</div><div class="k-v" style="color:#2a5ea9">'+v(K.pipe_affaires)+'</div><div class="k-s">'+(dashOk?fmtNb(K.pipe_a_relancer,0)+' à relancer (> 30 j)':'')+'</div></div>';
  h+='<div class="kpi clik'+on('leads')+'" data-rkpi="leads"><div class="k-l">Leads jamais contactés</div><div class="k-v" style="color:'+((K.leads_jamais||0)>0?'#c0524f':'#00997f')+'">'+v(K.leads_jamais)+'</div><div class="k-s">'+(dashOk?'dont '+fmtNb(K.leads_jamais_48h,0)+' depuis plus de 48 h':'')+'</div></div>';
  h+='<div class="kpi clik'+on('rdv')+'" data-rkpi="rdv"><div class="k-l">RDV à venir</div><div class="k-v" style="color:#2a5ea9">'+v(K.rdv_a_venir)+(D.nbRetardRdv>0?' <span class="k-alert">⚠ '+D.nbRetardRdv+'</span>':'')+'</div><div class="k-s">'+(dashOk?fmtNb(K.rdv_tenus,0)+' tenus ce mois':'')+(D.nbRetardRdv>0?' · '+D.nbRetardRdv+' sans compte rendu':'')+'</div></div>';
  h+='<div class="kpi mute"><div class="k-l">Livraisons en retard</div><div class="k-v" style="color:'+((K.livr_retard||0)>0?'#c0524f':'#00997f')+'">'+v(K.livr_retard)+'</div><div class="k-s">'+(dashOk?fmtNb(K.livr_attente,0)+' en attente':'')+'</div></div>';
  const closSt=R_partEtat('clos');
  h+='<div class="kpi clik'+on('clos')+'" data-rkpi="clos"><div class="k-l">Clos sur 30 j</div><div class="k-v" style="color:#8b99b0">'+(closSt==='ok'?D.clos.length:(closSt==='err'?'!':'…'))+'</div><div class="k-s">'+(closSt==='ok'?D.wins+' gagnés · '+D.abandons+' abandons':(closSt==='err'?'indisponible':'chargement'))+'</div></div>';
  h+='</div>';
  return h;
}
function R_row(cli,info,badge,onclick){
  return '<div class="cyc" data-rgo="'+onclick+'"><div><div class="c-cli">'+esc(cli)+'</div><div class="c-info">'+esc(info)+'</div></div>'+
         '<div class="c-right">'+(badge||'')+'<span class="c-arrow">›</span></div></div>';
}
function R_propaleRow(p){
  const st=p.status;
  const badge = st==='propale'?'<span class="badge prop">propale</span>'
              : st==='bdc'?'<span class="badge bdc">BDC</span>'
              : st==='win'?'<span class="badge win">vendu</span>'
              : '<span class="badge lose">perdu</span>';
  const info=[R_eur(p.montant),p.label,p.vin].filter(Boolean).join(' · ');
  const id=p.id_propale_bdc;
  const pdfBtn = (st==='propale'||st==='bdc'||st==='win')
    ? '<button class="pp-icon pp-pdf" data-rpdf="'+id+':'+st+'" data-rmaj="'+(p.maj||'')+'" title="PDF du document">'+R_PDF_SVG+'</button>'
    : '';
  const modBtn = (st==='propale')
    ? '<button class="pp-icon pp-mod" data-rmodif="'+id+'" title="Modifier la propale">'+R_EDIT_SVG+'</button>'
    : '';
  return '<div class="cyc pp-row">'+
    '<div class="pp-main" data-rgo="client:'+p.id_client+'"><div class="c-cli">'+esc(p.client)+'</div><div class="c-info">'+esc(info)+'</div></div>'+
    '<div class="c-right">'+badge+pdfBtn+modBtn+'</div>'+
  '</div>';
}
const R_PDF_SVG='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 18 15 15"/></svg>';
const R_EDIT_SVG='<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
function R_chips(cats){
  let h='<div class="b2-chips">';
  cats.forEach(([key,label,count])=>{
    if(count===0 && key!=='tous') return;
    h+='<span class="b2-chip'+(R.b2filter===key?' on':'')+'" data-rchip="'+key+'">'+label+'<span class="b2-chip-n">'+count+'</span></span>';
  });
  h+='</div>';
  return h;
}
function R_partMsg(part){
  const x=R.parts[part];
  if(!x || x.st==='load') return '<div class="b2-empty">Chargement…</div>';
  if(x.st==='err') return '<div class="b2-empty">Détail indisponible ('+esc(x.err||'erreur')+'). <button class="lnk" data-ract="retry:'+part+'">Réessayer</button></div>';
  return null;
}
function R_bloc2(){
  const D=R_kpiData(); const k=R.kpi;
  if(k==='cmd' || k==='fi'){
    const K=R.K, Kp=R.Kp;
    if(!K) return '<div class="b2-empty">'+(R.kLoaded?'Pas de chiffres du tableau de bord pour ce vendeur ce mois-ci.':'Chargement…')+'</div>';
    const ligne=(lbl,rea,obj,prev,prevObj)=>{
      const o=R_objectif(rea,obj); const p=o.obj>0?Math.round(100*o.rea/o.obj):null;
      const barCol = p==null?'#acc5e4':(o.ecart<-0.5?'#d97070':'#53bda7');
      const attW = o.obj>0?Math.min(100, 100*o.att/o.obj):0;
      return '<div class="perf-row"><div class="p-l">'+lbl+'</div>'+
        '<div class="p-v">'+fmtNb(o.rea,0)+(o.obj?' / '+fmtNb(o.obj,0):'')+'</div>'+
        (o.obj?'<div class="perf-bar"><i style="width:'+Math.min(p,100)+'%;background:'+barCol+'"></i><b style="left:'+attW+'%" title="attendu à date"></b></div>'+
          '<div class="perf-pct">'+p+' % de l’objectif · attendu à date '+fmtNb(o.att)+'</div>':'<div class="perf-pct">pas d’objectif</div>')+
        (prev!=null?'<div class="perf-prev">mois dernier : '+fmtNb(prev,0)+(prevObj?' / '+fmtNb(prevObj,0):'')+'</div>':'')+
      '</div>';
    };
    let cells='';
    cells+=ligne('Commandes',K.cdes,K.obj_cdes,Kp?Kp.cdes:null,Kp?Kp.obj_cdes:null);
    cells+=ligne('Financements',K.fi,K.obj_fi,Kp?Kp.fi:null,Kp?Kp.obj_fi:null);
    cells+=ligne('Hors loueurs',K.hors_loueurs,0,Kp?Kp.hors_loueurs:null,0);
    cells+=ligne('Reprises',K.reprise,0,Kp?Kp.reprise:null,0);
    cells+=ligne('LOA',K.loa,0,Kp?Kp.loa:null,0);
    return '<div class="b2-title">Production du mois — même source que l’accueil'+(R.majDash?' · à jour à '+esc(R_heureParis(R.majDash)):'')+'</div><div class="perf-grid">'+cells+'</div>'+
      '<div class="b2-note">Le trait vertical marque l’attendu à date : l’objectif du mois au prorata des jours écoulés.</div>';
  }
  if(k==='leads'){
    const m=R_partMsg('cycles'); if(m) return '<div class="b2-title">Leads et cycles ouverts</div>'+m;
    const cats=[['tous','Tous',D.cycles.length],['retard','En retard',D.cycles.filter(c=>c.categorie==='retard').length],['urgent','À traiter',D.cycles.filter(c=>c.categorie==='urgent').length],['cours','En cours',D.cycles.filter(c=>c.categorie==='cours').length]];
    let h='<div class="b2-title">'+D.cycles.length+' cycles ouverts · '+D.atraiter.length+' à traiter maintenant</div>'+R_chips(cats);
    const grp=(titre,cls,cat)=>{ if(R.b2filter!=='tous'&&R.b2filter!==cat) return ''; const list=D.cycles.filter(c=>c.categorie===cat); if(!list.length) return '';
      let s='<div class="pipe-group"><div class="pipe-gt '+cls+'">'+titre+' <span class="gn">'+list.length+'</span></div>';
      list.slice(0,12).forEach(c=> s+=R_row(c.client,[c.source_lead,c.canal_lead].filter(Boolean).join(' · ')+(c.heures_inactivite!=null?' · sans activité depuis '+Math.round(c.heures_inactivite/24)+' j':''),'','cycle:'+(c.id_cycle_com||'')+':'+c.id_client));
      if(list.length>12) s+='<div class="b2-empty">+ '+(list.length-12)+' autres</div>'; return s+'</div>'; };
    return h+grp('En retard','retard','retard')+grp('À traiter','urgent','urgent')+grp('En cours','cours','cours');
  }
  if(k==='pipeline'){
    const m=R_partMsg('pipeline'); if(m) return '<div class="b2-title">Affaires en cours</div>'+m;
    if(!D.pipeline.length) return '<div class="b2-empty">Aucune proposition ni bon de commande en cours.</div>';
    const cats=[['tous','Tous',D.pipeline.length],['propale','Propositions',D.pipeline.filter(p=>p.status==='propale').length],['bdc','Bons de commande',D.pipeline.filter(p=>p.status==='bdc').length],['win','Gagnées',D.pipeline.filter(p=>p.status==='win').length],['lose','Perdues',D.pipeline.filter(p=>p.status==='lose').length]];
    let h='<div class="b2-title">Affaires en cours — '+D.pipeline.length+' documents</div>'+R_chips(cats);
    const filtered = R.b2filter==='tous' ? D.pipeline : D.pipeline.filter(p=>p.status===R.b2filter);
    const sect=(label,cls,vnvo)=>{
      const list=filtered.filter(p=>(p.vn_vo||'').toUpperCase()===vnvo);
      if(!list.length) return '';
      let s='<div class="pipe-group"><div class="pipe-gt '+cls+'">'+label+' <span class="gn">'+list.length+'</span></div>';
      list.forEach(p=> s+=R_propaleRow(p));
      return s+'</div>';
    };
    let body=sect('VN — véhicules neufs','cours','VN')+sect('VO — véhicules d\'occasion','urgent','VO');
    const autres=filtered.filter(p=>!['VN','VO'].includes((p.vn_vo||'').toUpperCase()));
    if(autres.length){ let s='<div class="pipe-group"><div class="pipe-gt win">Autres <span class="gn">'+autres.length+'</span></div>'; autres.forEach(p=> s+=R_propaleRow(p)); body+=s+'</div>'; }
    if(!body) body='<div class="b2-empty">Aucun document pour ce filtre.</div>';
    return h+body;
  }
  if(k==='rdv'){
    const m=R_partMsg('rdv'); if(m) return '<div class="b2-title">Rendez-vous</div>'+m;
    const retards=D.rdv.filter(r=>r.en_retard===true); const avenir=D.rdv.filter(r=>r.categorie==='avenir');
    let s='<div class="b2-title">Rendez-vous</div>';
    if(retards.length){ s+='<div class="pipe-group"><div class="pipe-gt aband">Compte rendu manquant <span class="gn">'+retards.length+'</span></div>';
      retards.forEach(r=> s+=R_row(r.client,fmtDate(r.start_date)+' · '+(r.commentaire||''),'','cycle:'+(r.id_cycle_com||'')+':'+r.id_client)); s+='</div>'; }
    if(avenir.length){ s+='<div class="pipe-group"><div class="pipe-gt cours">À venir <span class="gn">'+avenir.length+'</span></div>';
      avenir.slice(0,10).forEach(r=> s+=R_row(r.client,fmtDate(r.start_date)+' '+fmtHeure(r.start_date)+' · '+(r.commentaire||''),'','cycle:'+(r.id_cycle_com||'')+':'+r.id_client));
      if(avenir.length>10) s+='<div class="b2-empty">+ '+(avenir.length-10)+' autres RDV</div>'; s+='</div>'; }
    if(!retards.length&&!avenir.length) s+='<div class="b2-empty">Aucun RDV à venir ni en retard.</div>';
    return s;
  }
  if(k==='clos'){
    const m=R_partMsg('clos'); if(m) return '<div class="b2-title">Cycles clos sur 30 jours</div>'+m;
    const cats=[['tous','Tous',D.clos.length],['win','Gagnés',D.clos.filter(c=>c.type_cloture==='win').length],['abandon','Abandons',D.clos.filter(c=>c.type_cloture==='abandon').length],['autre','Autres',D.clos.filter(c=>c.type_cloture==='autre').length]];
    let h='<div class="b2-title">'+D.clos.length+' cycles clos sur 30 jours</div>'+R_chips(cats);
    const grp=(titre,cls,type)=>{ if(R.b2filter!=='tous'&&R.b2filter!==type) return ''; const list=D.clos.filter(c=>c.type_cloture===type); if(!list.length) return '';
      let s='<div class="pipe-group"><div class="pipe-gt '+cls+'">'+titre+' <span class="gn">'+list.length+'</span></div>';
      list.forEach(c=> s+=R_row(c.client,'clôturé il y a '+(c.jours_depuis_cloture!=null?c.jours_depuis_cloture:'?')+' j','','cycle:'+(c.id_cycle_com||'')+':'+c.id_client));
      return s+'</div>'; };
    return h+grp('Gagnés','win','win')+grp('Abandons','aband','abandon')+grp('Autres','cours','autre');
  }
  return '';
}

// --- Constats chiffrés (pré-remplissage du bilan) ----------------------------
function R_constats(){
  const out=[]; const K=R.K, Kp=R.Kp, c=R.cad;
  if(K){
    const o=R_objectif(K.cdes,K.obj_cdes);
    if(o.obj) out.push('Commandes : '+fmtNb(o.rea,0)+' sur un objectif de '+fmtNb(o.obj,0)+' — attendu à date '+fmtNb(o.att)+', soit '+(o.ecart<0?'un retard de '+fmtNb(-o.ecart):'une avance de '+fmtNb(o.ecart))+' commande'+(Math.abs(o.ecart)>=2?'s':'')+(Kp&&Kp.obj_cdes?' (mois dernier : '+fmtNb(Kp.cdes,0)+' / '+fmtNb(Kp.obj_cdes,0)+')':'')+'.');
    else out.push('Commandes : '+fmtNb(K.cdes,0)+' ce mois-ci (pas d’objectif saisi).');
    const fi=R_objectif(K.fi,K.obj_fi);
    if(fi.obj) out.push('Financements : '+fmtNb(fi.rea,0)+' sur '+fmtNb(fi.obj,0)+' (attendu à date '+fmtNb(fi.att)+').');
  }
  if(c && c.tx_signif && c.transfo_actuel!=null) out.push('Transformation'+(state.transfoStable?' sur '+BIL_CFG.transfoJours+' jours':'')+' : '+fmtNb(c.transfo_actuel)+' %'+(c.tx_signif_prec&&c.transfo_precedent!=null?' contre '+fmtNb(c.transfo_precedent)+' % '+(state.transfoStable?'les '+BIL_CFG.transfoJours+' jours d’avant':'la période précédente'):'')+(c.tx_tot_actuel!=null?', sur '+c.tx_tot_actuel+' '+(state.transfoStable?'affaires tranchées':'propositions'):'')+'.');
  if(K){
    const bits=[];
    bits.push(fmtNb(K.pipe_affaires,0)+' affaires en cours dont '+fmtNb(K.pipe_a_relancer,0)+' à relancer (plus de 30 j)');
    if(K.leads_jamais) bits.push(fmtNb(K.leads_jamais,0)+' lead'+(K.leads_jamais>1?'s':'')+' jamais contacté'+(K.leads_jamais>1?'s':'')+(K.leads_jamais_48h?' dont '+fmtNb(K.leads_jamais_48h,0)+' depuis plus de 48 h':''));
    if(K.livr_retard) bits.push(fmtNb(K.livr_retard,0)+' livraison'+(K.livr_retard>1?'s':'')+' en retard');
    out.push('Activité : '+bits.join(' · ')+'.');
  }
  const e=(state.tenueMap||{})[Number(R.detail&&R.detail.id_user)];
  if(e && (e.tenu+e.partiel+e.non_tenu)>0) out.push('Engagements des 6 derniers mois : '+e.tenu+' tenu'+(e.tenu>1?'s':'')+', '+e.partiel+' partiel'+(e.partiel>1?'s':'')+', '+e.non_tenu+' non tenu'+(e.non_tenu>1?'s':'')+'.');
  return out;
}
function R_constatsTexte(){
  const l=R_constats(); if(!l.length) return '';
  const a=new Date();
  return 'Constats au '+String(a.getDate()).padStart(2,'0')+'/'+String(a.getMonth()+1).padStart(2,'0')+' (chiffres One Data) :\n'+l.map(x=>'• '+x).join('\n')+'\n\nAnalyse et points d’appui :\n';
}
// Pré-remplissage UNE fois, quand les chiffres sont là, si le bilan est vide
// et qu'aucun brouillon ne l'a déjà rempli. Le chef corrige ou complète.
function R_prefillConstats(){
  if(R.prefilled || !R.detail || !R.kLoaded || !R.engLoaded) return;
  R.prefilled=true;
  const filled=(R.detail.resultat||'').trim();
  if(filled || R.fromDraft) return;
  const t=R_constatsTexte(); if(!t) return;
  R.detail.resultat=t; R.constatsAuto=true;
}

// --- Engagements proposés à partir des chiffres ------------------------------
function R_addJours(n){ const d=new Date(); d.setDate(d.getDate()+n); while(d.getDay()===0) d.setDate(d.getDate()+1); return ymd(d); }
function R_finMois(){ const a=new Date(); return ymd(new Date(a.getFullYear(), a.getMonth()+1, 0)); }
function R_suggestions(){
  const K=R.K; if(!K) return [];
  const s=[];
  if(K.leads_jamais>0) s.push({ libelle:'Contacter tous les leads jamais contactés', cible:K.leads_jamais, echeance:R_addJours(2) });
  if(K.pipe_a_relancer>0) s.push({ libelle:'Relancer les affaires sans contact depuis plus de 30 jours', cible:K.pipe_a_relancer, echeance:R_addJours(7) });
  const o=R_objectif(K.cdes,K.obj_cdes);
  if(o.obj && o.rea<o.obj) s.push({ libelle:'Signer des commandes d’ici la fin du mois', cible:Math.ceil(o.obj-o.rea), echeance:R_finMois() });
  const fi=R_objectif(K.fi,K.obj_fi);
  if(fi.obj && fi.rea<fi.obj) s.push({ libelle:'Placer des financements d’ici la fin du mois', cible:Math.ceil(fi.obj-fi.rea), echeance:R_finMois() });
  if(K.livr_retard>0) s.push({ libelle:'Solder les livraisons en retard', cible:K.livr_retard, echeance:R_addJours(7) });
  if((K.rdv_a_venir||0)<3) s.push({ libelle:'Poser des rendez-vous physiques en concession', cible:5, echeance:R_addJours(7) });
  const deja=new Set((R.engagements||[]).map(e=>(e.libelle||'').trim()));
  return s.filter(x=>!deja.has(x.libelle)).slice(0,5);
}

function R_engStatutBtns(o){
  const cur=R.revues[o.id];
  const opt=(val,lbl,cls)=> '<button class="rev-b '+cls+(cur===val?' on':'')+'" data-ract="rev:'+o.id+':'+val+'">'+lbl+'</button>';
  return '<div class="rev-btns">'+opt('tenu','Tenu','t')+opt('partiel','Partiel','p')+opt('non_tenu','Non tenu','n')+'</div>';
}
// Premier temps de l'entretien : on pointe ce qui avait été promis.
function R_revue(){
  const list=R.ouverts||[];
  let h='<div class="sec sec-rev"><div class="sec-t">1 · Engagements de la dernière fois <span class="pill">'+(list.length?'à pointer avant tout':'rien à pointer')+'</span></div>';
  if(!list.length){ h+='<div class="eng-empty">Aucun engagement ouvert pour ce vendeur.</div></div>'; return h; }
  const auj=ymd(new Date());
  list.forEach(o=>{
    const echu = o.echeance && String(o.echeance).slice(0,10) < auj;
    const meta=[];
    if(o.cible!==''&&o.cible!=null) meta.push('objectif '+o.cible);
    if(o.echeance) meta.push((echu?'échéance dépassée le ':'pour le ')+R_fmtJour(o.echeance));
    if(o.bilaterale_date) meta.push('pris le '+fmtDate(String(o.bilaterale_date)));
    h+='<div class="rev-row"><div class="rev-lib">'+esc(o.libelle)+'<span class="rev-date'+(echu?' echu':'')+'">'+esc(meta.join(' · '))+'</span></div>'+R_engStatutBtns(o)+'</div>';
  });
  const n=Object.keys(R.revues||{}).length;
  h+='<div class="rev-foot">'+n+' / '+list.length+' pointé'+(n>1?'s':'')+'</div></div>';
  return h;
}
function R_saisie(){
  const d=R.detail;
  let h='<div class="sec sec-cr"><div class="sec-t">3 · Compte rendu de l\'entretien <span id="r-draft-ind" class="draft-ind">brouillon auto</span></div>';
  h+='<div class="field res"><label>Bilan'+(R.constatsAuto?' <span class="lbl-note">pré-rempli avec les chiffres — à corriger et compléter</span>':'')+'<button class="lnk lbl-act" data-ract="constats" title="Ajouter les constats chiffrés au bilan">↻ insérer les constats chiffrés</button></label>'+
     '<textarea id="rf-res" oninput="window.__bilDraftField(\'res\',this.value)" placeholder="Bilan de la période…">'+esc(d.resultat||'')+'</textarea></div>'+
     '<div class="field act"><label>Actions décidées</label><textarea id="rf-act" oninput="window.__bilDraftField(\'act\',this.value)" placeholder="Accompagnement, formation, prise de rendez-vous commune…">'+esc(d.actions||'')+'</textarea></div>';
  h+='<div class="eng-block"><label class="eng-lbl">Engagements pris <span class="lbl-note">quoi · combien · pour quand</span></label>';
  if(!R.engLoaded){ h+='<div class="r-load-inline">Chargement…</div>'; }
  else {
    const list=R.engagements||[];
    if(!list.length){ h+='<div class="eng-empty">Aucun engagement pour l\'instant. Choisissez une proposition ci-dessous ou ajoutez le vôtre.</div>'; }
    list.forEach((e,i)=>{
      h+='<div class="eng-item"><span class="eng-h">'+(i+1)+'</span>'+
        '<input class="eng-inp" value="'+esc(e.libelle||'')+'" oninput="window.__bilEngInput('+i+',\'libelle\',this.value)" placeholder="Quoi : l’engagement du vendeur…">'+
        '<input class="eng-cible" type="number" min="0" step="1" value="'+esc(e.cible!=null?e.cible:'')+'" oninput="window.__bilEngInput('+i+',\'cible\',this.value)" placeholder="Combien" title="Combien">'+
        '<input class="eng-ech" type="date" value="'+esc(e.echeance?String(e.echeance).slice(0,10):'')+'" oninput="window.__bilEngInput('+i+',\'echeance\',this.value)" title="Pour quand">'+
        '<button class="eng-del" data-ract="eng_del:'+i+'" title="Supprimer">×</button></div>';
    });
    const sug=R_suggestions();
    if(sug.length){
      h+='<div class="sug-t">Proposés à partir des chiffres :</div><div class="sug-list">'+
        sug.map((x,i)=>'<button class="sug" data-ract="sug:'+i+'">+ '+esc(x.libelle)+' <b>'+esc(String(x.cible))+'</b> <span>· '+esc(R_fmtJour(x.echeance))+'</span></button>').join('')+'</div>';
    }
    h+='<button class="eng-add" data-ract="eng_add">+ Ajouter un engagement</button>';
  }
  h+='</div>';
  const libSave = R.saving ? 'Enregistrement…' : (R.future ? '▶ Réaliser maintenant' : 'Enregistrer la bilatérale');
  h+='<div class="save-bar"><span id="r-save-msg" class="save-msg">'+esc(R.saveErr||'')+'</span>'+
    '<button class="btn btn-ghost" data-ract="print">Imprimer / PDF</button>'+
    '<button class="btn btn-sec" data-ract="annuler">Fermer</button>'+
    '<button class="btn btn-prim" data-ract="save"'+(R.saving?' disabled':'')+'>'+libSave+'</button></div></div>';
  return h;
}
function R_histo(){
  const hist=R.hist||[];
  let h='<div class="sec"><div class="sec-t">Bilatérales précédentes <span class="pill">naviguez dans l\'historique</span></div>';
  if(!hist.length){ h+='<div class="b2-empty">Aucune bilatérale réalisée précédemment pour ce vendeur.</div></div>'; return h; }
  const n=hist.length;
  const idx=Math.min(R.histIdx||0, n-1);
  const tsOf=b=>{ try{ return new Date(String(b.start_date).replace(' ','T')).getTime(); }catch(e){ return 0; } };
  const times=hist.map(tsOf);
  const MAX_DOTS=8;
  let winStart=0, winEnd=n;
  if(n>MAX_DOTS){ winStart=Math.max(0, Math.min(idx-Math.floor(MAX_DOTS/2), n-MAX_DOTS)); winEnd=winStart+MAX_DOTS; }
  const win=[]; for(let i=winStart;i<winEnd;i++) win.push(i);
  const wTimes=win.map(i=>times[i]);
  const wMin=Math.min.apply(null,wTimes), wMax=Math.max.apply(null,wTimes);
  const wSpan=(wMax-wMin)||1;
  const posOf=i=> win.length===1 ? 50 : (4 + 92*(times[i]-wMin)/wSpan);
  const b=hist[idx];
  h+='<div class="tl2-nav">';
  h+='<button class="tl2-arrow" data-rhistnav="prev"'+(idx>=n-1?' disabled':'')+' title="Plus ancienne">‹</button>';
  h+='<div class="tl2-cur"><span class="tl2-cur-date">'+esc(fmtDate(b.start_date))+'</span><span class="tl2-cur-pos">'+(idx+1)+' / '+n+'</span></div>';
  h+='<button class="tl2-arrow" data-rhistnav="next"'+(idx<=0?' disabled':'')+' title="Plus récente">›</button>';
  h+='</div>';
  h+='<div class="tl2-track-wrap"><div class="tl2-track"><div class="tl2-line"></div>';
  h+='<div class="tl2-line-fill" style="width:'+posOf(idx)+'%"></div>';
  win.forEach(i=>{ const p=posOf(i); const active=i===idx;
    h+='<button class="tl2-dot'+(active?' on':'')+'" data-rhistdot="'+i+'" style="left:'+p+'%" title="'+esc(fmtDate(hist[i].start_date))+'">'+(active?'<span class="tl2-dot-bubble">'+esc(fmtDate(hist[i].start_date))+'</span>':'')+'</button>';
  });
  h+='</div></div>';
  const moreOld=(winEnd<n)?(' · +'+(n-winEnd)+' plus anciennes'):'';
  const moreNew=(winStart>0)?('+'+winStart+' plus récentes · '):'';
  h+='<div class="tl2-ends"><span>'+esc(fmtDate(hist[winEnd-1].start_date))+moreOld+'</span><span>'+moreNew+esc(fmtDate(hist[winStart].start_date))+'</span></div>';
  h+='<div class="hist-card"><div class="hist-date">Entretien du '+esc(fmtDate(b.start_date))+(b.nom_chef?(' · avec '+esc(b.nom_chef)):'')+'</div>'+
    '<div class="hist-sec res"><div class="h-l">Résultat</div><div class="h-t">'+esc(b.resultat||'—')+'</div></div>'+
    '<div class="hist-sec act"><div class="h-l">Actions</div><div class="h-t">'+esc(b.actions||'—')+'</div></div>'+
    '<div class="hist-sec eng"><div class="h-l">Engagement</div><div class="h-t">'+esc(b.engagement||'—')+'</div></div></div>';
  h+='</div>';
  return h;
}
function R_render(){
  const ov=doc.getElementById('real-ov'); if(!ov) return;
  // Fiche ouverte depuis l'agenda avant le chargement de la page : la ligne
  // de cadence (transfo) arrive après coup.
  if(R.detail && !R.cad && state.cadence){ R.cad=(state.cadence||[]).find(x=>x.id_user===Number(R.detail.id_user))||null; }
  let body='';
  if(R.detail===null && !R.error){ body='<div class="r-load">Chargement…</div>'; }
  else if(R.error){ body='<div class="r-err">Erreur : '+esc(R.error)+'</div>'; }
  else if(R.done){ body=R_doneView(); }
  else {
    const d=R.detail;
    body+='<div class="r-head"><div><div class="r-vend">'+esc(d.nom_vendeur)+'</div>'+
      '<div class="r-sub">'+(d.vn_vo?('Vendeur '+esc(d.vn_vo)+' · '):'')+esc(d.nom_site)+'</div></div>'+
      '<div class="r-meta">Bilatérale du <b>'+fmtDate(d.start_date)+'</b><br>avec '+esc(d.nom_chef)+
      (d.start_date?(' · '+fmtHeure(d.start_date)+(d.end_date?' → '+fmtHeure(d.end_date):'')):'')+'</div></div>';
    if(R.future){
      const a=new Date();
      body+='<div class="r-future">Prévue le <b>'+esc(fmtDate(d.start_date))+' à '+esc(fmtHeure(d.start_date))+'</b>. Vous pouvez la mener dès maintenant : à l’enregistrement, sa date sera ramenée à aujourd’hui, '+String(a.getHours()).padStart(2,'0')+'h'+String(a.getMinutes()).padStart(2,'0')+'.</div>';
    }
    let perf='<div class="sec sec-perf"><div class="sec-t">2 · Chiffres du vendeur <span class="pill">cliquez un indicateur pour le détail</span></div>';
    perf+=R_kpis();
    perf+='<div class="bloc2">'+R_bloc2()+'</div></div>';
    const histo=(R.histLoading || R.hist===null)
      ? '<div class="sec"><div class="sec-t">Bilatérales précédentes</div><div class="r-load-inline">Chargement de l\'historique…</div></div>'
      : R_histo();
    if(R.reunion){
      // Mode réunion : les chiffres en grand à gauche (c'est l'écran qu'on
      // tourne vers le vendeur), le compte rendu en panneau latéral.
      body+='<div class="r-cols"><div class="r-left">'+perf+histo+'</div><div class="r-right">'+R_revue()+R_saisie()+'</div></div>';
    } else {
      body+=R_revue()+perf+R_saisie()+histo;
    }
  }
  const scrollPrec = ov.scrollTop;
  try { const t=doc.getElementById('agenda-tip'); if(t) t.style.display='none'; } catch(e){}
  ov.innerHTML = R_STYLE + '<div class="real-modal'+(R.reunion?' reunion':'')+'">'+
    '<div class="real-toolbar">'+(R.done?'':'<button class="real-mode" data-ract="reunion">'+(R.reunion?'↙ Quitter le mode réunion':'⤢ Mode réunion')+'</button>')+'</div>'+
    '<button class="real-close" data-ract="annuler" title="Fermer">×</button>'+body+'</div>';
  R_autoHauteur();
  ov.scrollTop = scrollPrec;
}
// Le bilan et les actions grandissent avec leur contenu : le bilan pré-rempli
// (constats chiffrés) se lit en entier sans ascenseur interne.
function R_autoHauteur(){
  ['rf-res','rf-act'].forEach(id=>{
    const t=doc.getElementById(id); if(!t) return;
    const ajuste=()=>{ t.style.height='auto'; t.style.height=Math.min(Math.max(t.scrollHeight+4, id==='rf-res'?260:120), 900)+'px'; };
    ajuste();
    if(!t.__auto){ t.__auto=true; t.addEventListener('input', ajuste); }
  });
}

// --- Après l'enregistrement ----------------------------------------------------
function R_suggestionSuivante(){
  const base = R.done && R.done.start ? new Date(String(R.done.start).replace(' ','T')) : new Date();
  const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + BIL_CFG.cadenceJ);
  while(d.getDay()===0) d.setDate(d.getDate()+1);
  const h = isNaN(base) ? '09:00' : String(base.getHours()).padStart(2,'0')+':'+String(base.getMinutes()).padStart(2,'0');
  return { date: ymd(d), heure: (h<'08:00'||h>'19:00') ? '09:00' : h };
}
function R_doneView(){
  const d=R.detail, x=R.done;
  if(!R.nextDate){ const s=R_suggestionSuivante(); R.nextDate=s.date; R.nextHeure=s.heure; }
  let h='<div class="done-card"><div class="done-ic">✓</div><div class="done-t">Bilatérale enregistrée</div>'+
    '<div class="done-s">'+esc(d.nom_vendeur)+' · '+esc(fmtDate(String(x.start||d.start_date)))+'</div>'+
    '<ul class="done-list">'+
      '<li>'+x.nbEng+' engagement'+(x.nbEng>1?'s':'')+' pris'+(x.nbEng?' (chiffrés et datés)':'')+'</li>'+
      (x.nbRev?'<li>'+x.nbRev+' engagement'+(x.nbRev>1?'s':'')+' précédent'+(x.nbRev>1?'s':'')+' pointé'+(x.nbRev>1?'s':'')+'</li>':'')+
      (x.ramenee?'<li>Date ramenée à aujourd’hui, '+esc(fmtHeure(String(x.start)))+' (elle était prévue plus tard)</li>':'')+
    '</ul></div>';
  if(R.nextMsg){
    h+='<div class="done-next ok">'+esc(R.nextMsg)+'</div>';
  } else {
    h+='<div class="done-next"><div class="dn-t">Prochaine bilatérale suggérée <span>cadence de '+BIL_CFG.cadenceJ+' jours</span></div>'+
      '<div class="dn-row"><input type="date" id="rd-date" min="'+ymd(new Date())+'" value="'+esc(R.nextDate)+'"><input type="time" id="rd-heure" step="900" value="'+esc(R.nextHeure)+'">'+
      '<button class="btn btn-prim" data-ract="done_plan"'+(R.saving?' disabled':'')+'>'+(R.saving?'Enregistrement…':'📅 Planifier')+'</button></div>'+
      (R.saveErr?'<div class="dn-err">'+esc(R.saveErr)+'</div>':'')+'</div>';
  }
  h+='<div class="save-bar"><button class="btn btn-ghost" data-ract="print">Imprimer / PDF</button><button class="btn btn-sec" data-ract="annuler">Fermer</button></div>';
  return h;
}
async function R_planifierSuivante(){
  const di=doc.getElementById('rd-date'), hi=doc.getElementById('rd-heure');
  if(di) R.nextDate=di.value; if(hi) R.nextHeure=hi.value;
  if(!R.nextDate||!R.nextHeure){ R.saveErr='Date et heure requises.'; return R_render(); }
  R.saving=true; R.saveErr=''; R_render();
  try {
    const d=R.detail;
    const r=await ctx.supabase.rpc('create_bilaterale',{ p_id_user:Number(d.id_user), p_id_manager:getViewerId(), p_id_site:d.id_site!=null?Number(d.id_site):null,
      p_start:R.nextDate+' '+R.nextHeure+':00', p_end:R.nextDate+' '+plus(30,R.nextHeure)+':00', p_duree:'30 min' });
    if(r.error) throw r.error;
    R.saving=false; R.nextMsg='Prochaine bilatérale planifiée le '+libQuand(R.nextDate,R.nextHeure)+'.';
    R_render(); rechargerBil();
  } catch(e){ console.error('[real] prochaine', e); R.saving=false; R.saveErr=messageErreur(e); R_render(); }
}

async function R_save(){
  if(R.saving) return;
  R_lireSaisie();
  const res=(R.detail.resultat||''), act=(R.detail.actions||'');
  const nouveaux=(R.engagements||[]).map((e,i)=>({
    libelle:(e.libelle||'').trim(), ordre:i,
    cible:(e.cible===''||e.cible==null||isNaN(Number(e.cible)))?null:Number(e.cible),
    echeance:e.echeance?String(e.echeance).slice(0,10):null
  })).filter(e=>e.libelle);
  if(!res.trim() && !act.trim() && !nouveaux.length){ R.saveErr='Renseignez au moins le bilan ou un engagement.'; R_render(); return; }
  const revues=Object.keys(R.revues||{}).map(id=>({ id:Number(id), statut_suivi:R.revues[id] }));
  const engResume=nouveaux.map((e,i)=>(i+1)+'. '+R_engTexte(e)).join('\n');
  R.saving=true; R.saveErr=''; R_render();
  try {
    const supabase=ctx.supabase;
    let r=await supabase.rpc('bilat_realiser',{ p_id:R.bilId, p_resultat:res, p_actions:act, p_engagement:engResume, p_nouveaux:nouveaux, p_revues:revues, p_maintenant:!!R.future });
    let out=r.data||null;
    if(r.error && R_fonctionAbsente(r.error)){
      // SQL v6 pas encore appliqué : l'ancienne fonction, sauf pour une
      // bilatérale future (elle l'aurait réalisée dans le futur).
      if(R.future) throw new Error('Fonction indisponible : le script SQL des bilatérales v6 n’est pas encore appliqué.');
      r=await supabase.rpc('realiser_bilaterale_complet',{ p_id:R.bilId, p_resultat:res, p_actions:act, p_engagement:engResume,
        p_nouveaux:nouveaux.map(e=>({ libelle:e.libelle, ordre:e.ordre })), p_revues:revues });
      out=null;
    }
    if(r.error) throw r.error;
    R.saving=false;
    R_clearDraft();
    R.done={ start:(out&&out.start_date)||R.detail.start_date, ramenee:!!(out&&out.date_ramenee), nbEng:nouveaux.length, nbRev:revues.length };
    R.nextDate=''; R.nextMsg='';
    R_render();
    try { (doc.getElementById('real-ov')||{}).scrollTop=0; } catch(x){}
    rechargerBil();
  } catch(e){
    console.error('[real] save', e);
    R.saving=false; R.saveErr='Erreur : '+messageErreur(e); R_render();
  }
}

// Routeur du popup (capture, distinct du routeur suivi)
window.__realRoute2 = function(e){
  if(e.__realDone) return;
  if(e.target.closest('#real-contacts-ov')){ e.__realDone = true; RC_route(e); return; }
  const ov = e.target.closest('#real-ov'); if(!ov) return;
  e.__realDone = true;
  if(e.target.id==='real-ov'){ if(!R.done) R_lireSaisie(); R_close(); return; }
  const kpi=e.target.closest('[data-rkpi]');
  if(kpi){ const k=kpi.getAttribute('data-rkpi'); if(k==='transfo') return; R_lireSaisie(); R.kpi=k; R.b2filter='tous'; R_render(); return; }
  const chip=e.target.closest('[data-rchip]');
  if(chip){ R.b2filter=chip.getAttribute('data-rchip');
    const b2=ov.querySelector('.bloc2'); if(b2){ b2.innerHTML=R_bloc2(); } return; }
  const mod=e.target.closest('[data-rmodif]');
  if(mod){ R_modifPropale(Number(mod.getAttribute('data-rmodif'))); return; }
  const pdf=e.target.closest('[data-rpdf]');
  if(pdf){ const v=pdf.getAttribute('data-rpdf'); const [pid,st]=v.split(':'); const maj=pdf.getAttribute('data-rmaj')||null; R_pdfPropale(Number(pid), st, maj); return; }
  const go=e.target.closest('[data-rgo]');
  if(go){ const v=go.getAttribute('data-rgo'); const parts=v.split(':'); const type=parts[0];
    if(type==='cycle'){ const idCycle=parts[1]||null; const idClient=parts[2]||null; RC_open(idCycle, idClient); return; }
    if(type==='client'){ R_openClientFiche(Number(parts[1])); return; }
    return; }
  const hn=e.target.closest('[data-rhistnav]');
  if(hn){ R_lireSaisie(); const n=(R.hist||[]).length; const dir=hn.getAttribute('data-rhistnav');
    if(dir==='prev') R.histIdx=Math.min((R.histIdx||0)+1, n-1); else R.histIdx=Math.max((R.histIdx||0)-1, 0);
    R_render(); return; }
  const hd=e.target.closest('[data-rhistdot]');
  if(hd){ R_lireSaisie(); R.histIdx=Number(hd.getAttribute('data-rhistdot')); R_render(); return; }
  const act=e.target.closest('[data-ract]');
  if(act){ const a=act.getAttribute('data-ract');
    if(a==='save'){ R_save(); return; }
    if(a==='annuler'){ if(!R.done) R_lireSaisie(); R_close(); return; }
    if(a==='reunion'){ R_lireSaisie(); R.reunion=!R.reunion; R_render(); return; }
    if(a==='done_plan'){ R_planifierSuivante(); return; }
    if(a==='retry:dash'){ R_loadDash(); R_render(); return; }
    if(a.indexOf('retry:')===0){ R_loadPart(a.slice(6)); R_render(); return; }
    if(a==='constats'){
      R_lireSaisie();
      const t=R_constatsTexte(); if(!t) return;
      R.detail.resultat = (R.detail.resultat||'').trim() ? (t+'\n'+R.detail.resultat) : t;
      R_saveDraft(); R_render(); return;
    }
    if(a.indexOf('sug:')===0){
      R_lireSaisie();
      const sug=R_suggestions()[Number(a.slice(4))]; if(!sug) return;
      if(!R.engagements) R.engagements=[];
      R.engagements.push({ libelle:sug.libelle, cible:sug.cible, echeance:sug.echeance, ordre:R.engagements.length });
      R_saveDraft(); R_render(); return;
    }
    if(a==='print'){ R_print(); return; }
    if(a==='eng_add'){
      R_lireSaisie();
      if(!R.engagements) R.engagements=[];
      R.engagements.push({ libelle:'', cible:'', echeance:R_addJours(7), ordre:R.engagements.length }); R_saveDraft(); R_render();
      setTimeout(()=>{ const ins=doc.querySelectorAll('#real-ov .eng-inp'); if(ins.length) ins[ins.length-1].focus(); }, 20);
      return;
    }
    if(a.indexOf('eng_del:')===0){ R_lireSaisie(); const i=Number(a.split(':')[1]); if(R.engagements){ R.engagements.splice(i,1); R_saveDraft(); R_render(); } return; }
    if(a.indexOf('rev:')===0){ R_lireSaisie(); const p=a.split(':'); const id=p[1], st=p[2]; if(!R.revues) R.revues={};
      if(R.revues[id]===st) delete R.revues[id]; else R.revues[id]=st; R_saveDraft(); R_render(); return; }
    return;
  }
};
if(!window.__realDocClickBound2){
  doc.addEventListener('click', function(e){ if(window.__realRoute2) window.__realRoute2(e); }, true);
  window.__realDocClickBound2 = true;
}

const R_STYLE = '<style>'+
'#real-ov{position:fixed;inset:0;background:rgba(28,43,69,.55);z-index:60;display:flex;align-items:flex-start;justify-content:center;padding:24px;overflow-y:auto;font-family:"Nunito Sans",sans-serif}'+
'#real-ov .real-modal{position:relative;background:#f4f7fb;border-radius:18px;max-width:940px;width:100%;padding:24px;box-shadow:0 20px 60px rgba(28,43,69,.3);margin:auto}'+
'#real-ov .real-close{position:absolute;top:16px;right:18px;width:34px;height:34px;border-radius:50%;border:none;background:#fff;color:#8b99b0;font-size:20px;line-height:34px;text-align:center;padding:0;cursor:pointer;box-shadow:0 1px 4px rgba(28,43,69,.1);z-index:2;display:flex;align-items:center;justify-content:center}'+
'#real-ov .real-close:hover{background:#d97070;color:#fff}'+
'#real-ov .r-head{padding-right:44px}'+
'#real-ov .real{font-family:"Nunito Sans",sans-serif;color:#1c2b45;max-width:920px;margin:0 auto}'+
'#real-ov .r-load,#real-ov .r-err,#real-ov .b2-empty{padding:22px;text-align:center;color:#8b99b0;font-size:14px}'+
'#real-ov .r-load-inline{padding:24px;text-align:center;color:#8b99b0;font-size:13px;font-style:italic}'+
'#real-ov .r-err{color:#c0524f}'+
'#real-ov .r-head{display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;margin-bottom:14px}'+
'#real-ov .r-vend{font-size:22px;font-weight:800;color:#2a5ea9}'+
'#real-ov .r-sub{font-size:13px;color:#8b99b0;margin-top:2px}'+
'#real-ov .r-meta{font-size:13px;color:#8b99b0;text-align:right}#real-ov .r-meta b{color:#1c2b45}'+
'#real-ov .sec{background:#fff;border:1px solid #e3e9f3;border-radius:14px;padding:18px 20px;margin-bottom:18px}'+
'#real-ov .sec-t{font-size:15px;font-weight:800;color:#2a5ea9;margin-bottom:14px;display:flex;align-items:center;gap:8px}'+
'#real-ov .sec-t .pill{font-size:11px;font-weight:600;color:#2a5ea9;background:rgba(172,197,228,.18);border-radius:20px;padding:2px 10px}'+
'#real-ov .kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(115px,1fr));gap:10px;margin-bottom:16px}'+
'#real-ov .kpi{background:rgba(172,197,228,.12);border-radius:10px;padding:10px 12px;border:2px solid transparent;transition:.12s}'+
'#real-ov .kpi.clik{cursor:pointer}#real-ov .kpi.clik:hover{background:rgba(172,197,228,.22)}'+
'#real-ov .kpi.on{border-color:#2a5ea9;background:#fff}#real-ov .kpi.mute{cursor:default}'+
'#real-ov .kpi.kvn.on{border-color:#53bda7}'+
'#real-ov .kpi.kvo.on{border-color:#d2941f}'+
'#real-ov .kpi .k-l{font-size:11px;color:#8b99b0;font-weight:600}'+
'#real-ov .kpi .k-v{font-size:20px;font-weight:800;margin-top:2px}'+
'#real-ov .kpi .k-s{font-size:11px;color:#9bb3d1;margin-top:1px}'+
'#real-ov .bloc2{border-top:1px dashed #e3e9f3;padding-top:16px;min-height:110px}'+
'#real-ov .b2-title{font-size:13px;font-weight:800;color:#2a5ea9;margin-bottom:12px}'+
'#real-ov .b2-chips{display:flex;gap:6px;flex-wrap:wrap;margin-bottom:14px}'+
'#real-ov .b2-chip{display:inline-flex;align-items:center;gap:5px;font-size:12px;font-weight:600;color:#2a5ea9;background:#fff;border:1px solid #e3e9f3;border-radius:16px;padding:4px 11px;cursor:pointer;transition:.12s}'+
'#real-ov .b2-chip:hover{background:rgba(172,197,228,.16)}'+
'#real-ov .b2-chip.on{background:#2a5ea9;color:#fff;border-color:#2a5ea9}'+
'#real-ov .b2-chip-n{font-size:10px;font-weight:700;opacity:.7}'+
'#real-ov .perf-grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));gap:12px}'+
'#real-ov .perf-row{background:rgba(172,197,228,.12);border-radius:10px;padding:12px 14px}'+
'#real-ov .perf-row .p-l{font-size:12px;color:#8b99b0;font-weight:600}'+
'#real-ov .perf-row .p-v{font-size:18px;font-weight:800;margin-top:3px}'+
'#real-ov .perf-bar{height:7px;background:rgba(172,197,228,.35);border-radius:4px;margin-top:8px;overflow:hidden}'+
'#real-ov .perf-bar i{display:block;height:7px;border-radius:4px}'+
'#real-ov .perf-pct{font-size:11px;color:#8b99b0;font-weight:600;margin-top:5px}'+
'#real-ov .pipe-group{margin-bottom:14px}'+
'#real-ov .pipe-gt{font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;margin-bottom:8px;display:flex;align-items:center;gap:6px}'+
'#real-ov .pipe-gt.retard{color:#c0524f}#real-ov .pipe-gt.urgent{color:#8a6d1f}#real-ov .pipe-gt.cours{color:#00997f}'+
'#real-ov .pipe-gt.win{color:#00997f}#real-ov .pipe-gt.aband{color:#c0524f}'+
'#real-ov .pipe-gt .gn{font-size:11px;font-weight:700;color:#fff;border-radius:10px;padding:1px 8px}'+
'#real-ov .pipe-gt.retard .gn,#real-ov .pipe-gt.aband .gn{background:#d97070}'+
'#real-ov .pipe-gt.urgent .gn{background:#fac055;color:#8a6d1f}'+
'#real-ov .pipe-gt.cours .gn,#real-ov .pipe-gt.win .gn{background:#53bda7}'+
'#real-ov .cyc{display:flex;align-items:center;gap:10px;padding:9px 12px;border:1px solid #e3e9f3;border-radius:10px;margin-bottom:6px;cursor:pointer;transition:background .12s}'+
'#real-ov .cyc:hover{background:rgba(172,197,228,.14)}'+
'#real-ov .cyc .c-cli{font-weight:700;color:#2a5ea9;font-size:14px}'+
'#real-ov .cyc .c-info{font-size:12px;color:#8b99b0}'+
'#real-ov .cyc .c-right{margin-left:auto;display:flex;align-items:center;gap:8px}'+
'#real-ov .cyc .badge{font-size:10px;font-weight:700;padding:2px 8px;border-radius:6px}'+
'#real-ov .badge.prop{background:rgba(42,94,169,.12);color:#2a5ea9}'+
'#real-ov .badge.bdc{background:rgba(250,192,85,.22);color:#8a6d1f}'+
'#real-ov .badge.win{background:rgba(83,189,167,.18);color:#00997f}'+
'#real-ov .badge.lose{background:rgba(217,112,112,.14);color:#c0524f}'+
'#real-ov .cyc .c-arrow{color:#9bb3d1;font-size:16px}'+
'#real-ov .pp-row{align-items:center}'+
'#real-ov .pp-main{flex:1;min-width:0;cursor:pointer;border-radius:8px;padding:2px 4px;margin:-2px -4px}'+
'#real-ov .pp-main:hover{background:rgba(172,197,228,.14)}'+
'#real-ov .pp-icon{width:30px;height:30px;border-radius:8px;border:1px solid #e3e9f3;background:#fff;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;padding:0;transition:.12s}'+
'#real-ov .pp-pdf{color:#d97070}#real-ov .pp-pdf:hover{background:#fbeceb;border-color:#d97070}'+
'#real-ov .pp-mod{color:#2a5ea9}#real-ov .pp-mod:hover{background:rgba(42,94,169,.10);border-color:#2a5ea9}'+
'#real-ov .field{margin-bottom:14px}'+
'#real-ov .field label{display:block;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;margin-bottom:6px}'+
'#real-ov .field.res label{color:#2a5ea9}#real-ov .field.act label{color:#8a6d1f}#real-ov .field.eng label{color:#00997f}'+
'#real-ov .field textarea{width:100%;border:1px solid #e3e9f3;border-radius:10px;padding:11px 13px;font-family:inherit;font-size:14px;color:#1c2b45;resize:vertical;min-height:80px;background:rgba(172,197,228,.10);box-sizing:border-box}'+
'#real-ov .field textarea:focus{outline:none;border-color:#2a5ea9;background:#fff}'+
'#real-ov .field.res textarea{min-height:260px;line-height:1.55}'+
'#real-ov .field.act textarea{min-height:120px;line-height:1.55}'+
'#real-ov .save-bar{display:flex;justify-content:flex-end;align-items:center;gap:10px;margin-top:4px}'+
'#real-ov .save-msg{font-size:13px;font-weight:700;margin-right:auto}'+
'#real-ov .btn{border:none;border-radius:9px;padding:10px 20px;font-family:inherit;font-size:14px;font-weight:700;cursor:pointer}'+
'#real-ov .btn-prim{background:#53bda7;color:#fff}#real-ov .btn-prim:disabled{opacity:.6;cursor:default}'+
'#real-ov .btn-sec{background:rgba(172,197,228,.18);color:#2a5ea9;border:1px solid #e3e9f3}'+
'#real-ov .histbl-wrap{max-height:340px;overflow-y:auto;border:1px solid rgba(172,197,228,.4);border-radius:12px}'+
'#real-ov .histbl{width:100%;border-collapse:collapse;font-size:13px}'+
'#real-ov .histbl thead th{position:sticky;top:0;z-index:5;text-align:left;font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;padding:10px 12px;background:#e3ecf6;border-bottom:2px solid #acc5e4}'+
'#real-ov .histbl thead th.col-date{color:#2a5ea9;background:#e3ecf6}'+
'#real-ov .histbl thead th.col-res{color:#2a5ea9;background:#dde8f5}'+
'#real-ov .histbl thead th.col-act{color:#8a6d1f;background:#f6ead0}'+
'#real-ov .histbl thead th.col-eng{color:#00997f;background:#dcf0e9}'+
'#real-ov .histbl tbody td{padding:11px 12px;vertical-align:top;border-bottom:1px solid rgba(172,197,228,.25);line-height:1.45}'+
'#real-ov .histbl tbody tr:last-child td{border-bottom:none}'+
'#real-ov .histbl tbody tr:hover td{background:rgba(172,197,228,.08)}'+
'#real-ov .histbl td.col-date{white-space:nowrap;min-width:108px}'+
'#real-ov .histbl td.col-res{background:rgba(42,94,169,.05);color:#1c2b45}'+
'#real-ov .histbl td.col-act{background:rgba(250,192,85,.07);color:#8a6d1f}'+
'#real-ov .histbl td.col-eng{background:rgba(83,189,167,.06);color:#00997f}'+
'#real-ov .histbl .hd-date{font-weight:800;color:#2a5ea9}'+
'#real-ov .histbl .hd-chef{font-size:11px;color:#8b99b0;margin-top:2px}'+
'#real-ov .real-toolbar{margin-bottom:10px}'+
'#real-ov .real-mode{background:#fff;border:1px solid #e3e9f3;color:#2a5ea9;font-family:inherit;font-size:12px;font-weight:700;border-radius:8px;padding:6px 12px;cursor:pointer;box-shadow:0 1px 4px rgba(28,43,69,.08)}'+
'#real-ov .real-mode:hover{background:rgba(172,197,228,.18)}'+
'#real-ov .real-modal.reunion{max-width:1180px}'+
'#real-ov .real-modal.reunion .r-vend{font-size:26px}'+
'#real-ov .real-modal.reunion .field textarea{min-height:120px;font-size:15px}'+
'#real-ov .real-modal.reunion .eng-inp{font-size:15px;padding:11px 13px}'+
'#real-ov .real-modal.reunion .sec{padding:22px 26px}'+
'#real-ov .draft-ind{margin-left:auto;font-size:11px;font-weight:600;color:#8b99b0;background:#eef2f8;border-radius:20px;padding:2px 10px;opacity:.5;transition:opacity .2s}'+
'#real-ov .rev-block{background:rgba(250,192,85,.10);border:1px solid rgba(250,192,85,.40);border-radius:12px;padding:14px 16px;margin-bottom:16px}'+
'#real-ov .rev-title{font-size:13px;font-weight:800;color:#8a6d1f;margin-bottom:10px;display:flex;align-items:center;gap:8px}'+
'#real-ov .rev-title .pill{font-size:10px;font-weight:700;color:#8a6d1f;background:rgba(250,192,85,.30);border-radius:20px;padding:2px 9px}'+
'#real-ov .rev-row{display:flex;align-items:center;gap:12px;padding:8px 0;border-top:1px solid rgba(250,192,85,.30)}'+
'#real-ov .rev-row:first-of-type{border-top:none}'+
'#real-ov .rev-lib{flex:1;min-width:0;font-size:13px;color:#1c2b45;font-weight:600}'+
'#real-ov .rev-date{display:block;font-size:11px;font-weight:400;color:#8a6d1f;margin-top:1px}'+
'#real-ov .rev-btns{display:flex;gap:5px;flex-shrink:0}'+
'#real-ov .rev-b{font-size:12px;font-weight:700;border:1px solid #e3e9f3;background:#fff;border-radius:7px;padding:5px 11px;cursor:pointer;color:#8b99b0;font-family:inherit}'+
'#real-ov .rev-b:hover{background:#eef2f8}'+
'#real-ov .rev-b.t.on{background:#53bda7;color:#fff;border-color:#53bda7}'+
'#real-ov .rev-b.p.on{background:#fac055;color:#8a6d1f;border-color:#fac055}'+
'#real-ov .rev-b.n.on{background:#d97070;color:#fff;border-color:#d97070}'+
'#real-ov .eng-block{margin-bottom:16px}'+
'#real-ov .eng-lbl{display:block;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;margin-bottom:8px;color:#00997f}'+
'#real-ov .eng-empty{font-size:13px;color:#9bb3d1;font-style:italic;margin-bottom:8px}'+
'#real-ov .eng-item{display:flex;align-items:center;gap:8px;margin-bottom:7px}'+
'#real-ov .eng-h{flex-shrink:0;width:22px;height:22px;border-radius:50%;background:rgba(83,189,167,.18);color:#00997f;font-size:12px;font-weight:800;display:flex;align-items:center;justify-content:center}'+
'#real-ov .eng-inp{flex:1;border:1px solid #e3e9f3;border-radius:9px;padding:9px 12px;font-family:inherit;font-size:14px;color:#1c2b45;background:rgba(83,189,167,.06)}'+
'#real-ov .eng-inp:focus{outline:none;border-color:#53bda7;background:#fff}'+
'#real-ov .eng-del{flex-shrink:0;width:28px;height:28px;border-radius:8px;border:1px solid #e3e9f3;background:#fff;color:#d97070;font-size:17px;line-height:1;cursor:pointer}'+
'#real-ov .eng-del:hover{background:#fbeceb;border-color:#d97070}'+
'#real-ov .eng-add{margin-top:4px;background:rgba(83,189,167,.12);border:1px dashed #53bda7;color:#00997f;font-family:inherit;font-size:13px;font-weight:700;border-radius:9px;padding:8px 14px;cursor:pointer}'+
'#real-ov .eng-add:hover{background:rgba(83,189,167,.20)}'+
'#real-ov .btn-ghost{background:#fff;color:#2a5ea9;border:1px solid #e3e9f3}'+
'#real-ov .btn-ghost:hover{background:rgba(172,197,228,.16)}'+
'#real-ov .tl2-nav{display:flex;align-items:center;justify-content:center;gap:16px;margin-bottom:6px}'+
'#real-ov .tl2-arrow{width:34px;height:34px;border-radius:50%;border:1px solid #e3e9f3;background:#fff;color:#2a5ea9;font-size:20px;line-height:1;cursor:pointer;display:flex;align-items:center;justify-content:center;transition:.12s;flex-shrink:0}'+
'#real-ov .tl2-arrow:hover:not(:disabled){background:#2a5ea9;color:#fff;border-color:#2a5ea9}'+
'#real-ov .tl2-arrow:disabled{opacity:.3;cursor:default}'+
'#real-ov .tl2-cur{text-align:center;min-width:160px}'+
'#real-ov .tl2-cur-date{display:block;font-size:15px;font-weight:800;color:#2a5ea9}'+
'#real-ov .tl2-cur-pos{display:block;font-size:11px;color:#9bb3d1;font-weight:600;margin-top:1px}'+
'#real-ov .tl2-track-wrap{padding:26px 6px 6px}'+
'#real-ov .tl2-track{position:relative;height:24px}'+
'#real-ov .tl2-line{position:absolute;left:0;right:0;top:11px;height:3px;background:#e3e9f3;border-radius:2px}'+
'#real-ov .tl2-line-fill{position:absolute;left:0;top:11px;height:3px;background:#acc5e4;border-radius:2px;transition:width .25s ease}'+
'#real-ov .tl2-dot{position:absolute;top:5px;width:14px;height:14px;border-radius:50%;border:2px solid #fff;background:#acc5e4;cursor:pointer;padding:0;transform:translateX(-50%);box-shadow:0 0 0 1px #d8dfe9;transition:.15s;z-index:1}'+
'#real-ov .tl2-dot:hover{background:#53bda7;transform:translateX(-50%) scale(1.25);z-index:3}'+
'#real-ov .tl2-dot.on{background:#2a5ea9;width:18px;height:18px;top:3px;box-shadow:0 0 0 4px rgba(42,94,169,.18);z-index:4}'+
'#real-ov .tl2-dot-bubble{position:absolute;bottom:26px;left:50%;transform:translateX(-50%);background:#2a5ea9;color:#fff;font-size:11px;font-weight:700;padding:3px 9px;border-radius:6px;white-space:nowrap;pointer-events:none}'+
'#real-ov .tl2-dot-bubble::after{content:"";position:absolute;top:100%;left:50%;transform:translateX(-50%);border:5px solid transparent;border-top-color:#2a5ea9}'+
'#real-ov .tl2-ends{display:flex;justify-content:space-between;font-size:10px;color:#9bb3d1;font-weight:600;margin:2px 6px 14px}'+
'#real-ov .hist-card{border:1px solid #e3e9f3;border-radius:10px;padding:14px 16px}'+
'#real-ov .hist-date{font-size:12px;color:#8b99b0;margin-bottom:10px}'+
'#real-ov .hist-sec{margin-bottom:12px}#real-ov .hist-sec:last-child{margin-bottom:0}'+
'#real-ov .hist-sec .h-l{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.04em;margin-bottom:4px}'+
'#real-ov .hist-sec.res .h-l{color:#2a5ea9}#real-ov .hist-sec.act .h-l{color:#8a6d1f}#real-ov .hist-sec.eng .h-l{color:#00997f}'+
'#real-ov .hist-sec .h-t{font-size:13px;line-height:1.5;white-space:pre-wrap}'+
/* --- v6 --- */
'#real-ov .r-future{background:rgba(42,94,169,.08);border:1px solid rgba(42,94,169,.35);color:#1F4A85;border-radius:12px;padding:11px 14px;font-size:13px;font-weight:600;margin-bottom:14px;line-height:1.45}'+
'#real-ov .r-future b{color:#1F4A85}'+
'#real-ov .r-warn{font-size:12.5px;color:#8a6d1f;background:rgba(250,192,85,.14);border:1px solid rgba(250,192,85,.45);border-radius:10px;padding:8px 12px;margin-bottom:12px;font-weight:600}'+
'#real-ov .lnk{background:none;border:none;color:#2a5ea9;font-family:inherit;font-size:12px;font-weight:800;text-decoration:underline;cursor:pointer;padding:0 2px}'+
'#real-ov .kpi.big{grid-column:span 2}'+
'#real-ov .kpi .k-of{font-size:14px;font-weight:700;color:#8b99b0}'+
'#real-ov .kpi .k-p{font-size:11px;color:#8b99b0;margin-top:4px;font-weight:600}'+
'#real-ov .kpi .k-alert{font-size:12px;color:#d97070;font-weight:800}'+
'#real-ov .perf-bar{position:relative}'+
'#real-ov .perf-bar b{position:absolute;top:-2px;width:2px;height:11px;background:#2a5ea9;border-radius:1px}'+
'#real-ov .perf-prev{font-size:11px;color:#8b99b0;margin-top:3px}'+
'#real-ov .b2-note{font-size:11px;color:#8b99b0;margin-top:10px}'+
'#real-ov .sec-rev{border-color:rgba(250,192,85,.55);background:#fdf3de}'+
'#real-ov .sec-rev .sec-t{color:#8a6d1f}'+
'#real-ov .sec-rev .sec-t .pill{background:rgba(250,192,85,.30);color:#8a6d1f}'+
'#real-ov .rev-date.echu{color:#c0524f;font-weight:700}'+
'#real-ov .rev-foot{font-size:11px;color:#8a6d1f;font-weight:700;text-align:right;margin-top:6px}'+
'#real-ov .field label{display:flex;align-items:center;gap:8px;flex-wrap:wrap}'+
'#real-ov .lbl-note{font-size:11px;font-weight:600;text-transform:none;letter-spacing:0;color:#8b99b0}'+
'#real-ov .lbl-act{margin-left:auto;text-transform:none;letter-spacing:0}'+
'#real-ov .eng-cible{width:84px;flex-shrink:0;border:1px solid #e3e9f3;border-radius:9px;padding:9px 8px;font-family:inherit;font-size:14px;color:#1c2b45;background:rgba(83,189,167,.06);text-align:center}'+
'#real-ov .eng-ech{width:142px;flex-shrink:0;border:1px solid #e3e9f3;border-radius:9px;padding:8px 8px;font-family:inherit;font-size:13px;color:#1c2b45;background:rgba(83,189,167,.06)}'+
'#real-ov .eng-cible:focus,#real-ov .eng-ech:focus{outline:none;border-color:#53bda7;background:#fff}'+
'#real-ov .sug-t{font-size:11px;font-weight:800;color:#8b99b0;text-transform:uppercase;letter-spacing:.04em;margin:10px 0 6px}'+
'#real-ov .sug-list{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:8px}'+
'#real-ov .sug{border:1px dashed #53bda7;background:#fff;color:#00997f;border-radius:16px;padding:5px 11px;font-family:inherit;font-size:12px;font-weight:700;cursor:pointer;text-align:left}'+
'#real-ov .sug:hover{background:rgba(83,189,167,.10)}'+
'#real-ov .sug b{color:#00997f}#real-ov .sug span{color:#8b99b0;font-weight:600}'+
'#real-ov .r-cols{display:grid;grid-template-columns:minmax(0,1.3fr) minmax(0,1fr);gap:18px;align-items:start}'+
'#real-ov .r-right{position:sticky;top:0}'+
'#real-ov .real-modal.reunion .kpi .k-v{font-size:30px}'+
'#real-ov .real-modal.reunion .kpi .k-l{font-size:12.5px}'+
'#real-ov .real-modal.reunion .kpi .k-s{font-size:12px}'+
'#real-ov .real-modal.reunion .r-right .field textarea{min-height:110px}'+
'#real-ov .real-modal.reunion .eng-item{flex-wrap:wrap}'+
'#real-ov .real-modal.reunion .eng-inp{flex:1 1 100%}'+
'#real-ov .done-card{background:#fff;border:1px solid #e3e9f3;border-radius:16px;padding:26px 22px;text-align:center;margin-bottom:16px}'+
'#real-ov .done-ic{width:52px;height:52px;border-radius:50%;background:#53bda7;color:#fff;font-size:28px;font-weight:800;display:flex;align-items:center;justify-content:center;margin:0 auto 10px}'+
'#real-ov .done-t{font-size:20px;font-weight:800;color:#2a5ea9}'+
'#real-ov .done-s{font-size:13px;color:#8b99b0;margin-top:2px}'+
'#real-ov .done-list{list-style:none;padding:0;margin:14px 0 0;font-size:13.5px;color:#1c2b45}'+
'#real-ov .done-list li{margin:4px 0}'+
'#real-ov .done-next{background:#fff;border:1px solid #e3e9f3;border-radius:14px;padding:16px 18px;margin-bottom:16px}'+
'#real-ov .done-next.ok{background:rgba(83,189,167,.12);border-color:#9ed8c9;color:#00997f;font-weight:700;font-size:14px}'+
'#real-ov .dn-t{font-size:14px;font-weight:800;color:#2a5ea9;margin-bottom:10px}'+
'#real-ov .dn-t span{font-size:11px;font-weight:600;color:#8b99b0;margin-left:6px}'+
'#real-ov .dn-row{display:flex;gap:8px;flex-wrap:wrap;align-items:center}'+
'#real-ov .dn-row input{border:1px solid #e3e9f3;border-radius:9px;padding:9px 10px;font-family:inherit;font-size:14px;color:#1c2b45}'+
'#real-ov .dn-err{color:#c0524f;font-size:12.5px;font-weight:700;margin-top:8px}'+
'@media (max-width:900px){#real-ov .r-cols{grid-template-columns:1fr}#real-ov .r-right{position:static}}'+
'@media (max-width:760px){#real-ov .kpi.big{grid-column:auto}#real-ov .eng-item{flex-wrap:wrap}#real-ov .eng-inp{flex:1 1 100%}}'+
'@media (max-width:760px){'+
'#real-ov{padding:10px}'+
'#real-ov .real-modal{padding:16px;border-radius:14px}'+
'#real-ov .real-modal.reunion{max-width:none}'+
'#real-ov .sec{padding:14px 14px}'+
'#real-ov .r-meta{text-align:left}'+
'#real-ov .save-bar{flex-wrap:wrap}'+
'#real-ov .save-bar .btn{flex:1 1 auto}'+
'#real-ov .save-msg{flex:1 1 100%;margin-bottom:6px}'+
'#real-ov .tl2-cur{min-width:0}'+
'}'+
'</style>';
// --- fin module popup réalisation ---


// ============================================================================
//  SOUS-POPUP CONTACTS DU CYCLE (par-dessus la réalisation)
//  Affiche les contacts de v_contacts_client filtrés par id_cycle_com.
//  Lien "Ouvrir la fiche complète" (tab 0) qui ferme les deux popups.
// ============================================================================
const RC = { idCycle:null, idClient:null, rows:null, loading:false, error:null };

function RC_open(idCycle, idClient){
  RC.idCycle = idCycle || null;
  RC.idClient = idClient || null;
  RC.rows = null; RC.error = null; RC.loading = false;
  RC_ensureOverlay();
  RC_render();
  RC_load();
}
function RC_close(){ const ov = doc.getElementById('real-contacts-ov'); if(ov) ov.remove(); }
function RC_ensureOverlay(){
  let ov = doc.getElementById('real-contacts-ov');
  if(!ov){ ov = doc.createElement('div'); ov.id='real-contacts-ov'; doc.body.appendChild(ov); }
}
async function RC_load(){
  if(!RC.idCycle){ RC.error='Cycle introuvable pour ce contact.'; RC_render(); return; }
  if(RC.loading) return;
  RC.loading=true; RC.error=null; RC_render();
  try {
    const supabase = ctx.supabase;
    const { data, error } = await supabase
      .from('v_contacts_client')
      .select('*')
      .eq('id_cycle_com', RC.idCycle)
      .order('date_contact', { ascending: false });
    if(error) throw error;
    RC.rows = await window.__odSignRows(supabase, data || []);
  } catch(e){
    console.error('[real-contacts] load', e);
    RC.error = (e && e.message) ? e.message : String(e);
  } finally {
    RC.loading=false; RC_render();
  }
}

function RC_esc(s){ return (s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function RC_fmtDate(d){ if(!d) return ''; const dt=new Date(String(d).replace(' ','T'));
  return String(dt.getDate()).padStart(2,'0')+'/'+String(dt.getMonth()+1).padStart(2,'0')+'/'+dt.getFullYear()+
    ' '+String(dt.getHours()).padStart(2,'0')+':'+String(dt.getMinutes()).padStart(2,'0'); }
function RC_truncate(str,n){ return str&&str.length>n?str.substring(0,n)+'…':(str||''); }
function RC_parseAtt(raw){ try{ if(Array.isArray(raw)) return raw; if(typeof raw==='string'&&raw) return JSON.parse(raw); }catch(e){} return []; }
  // ---- Signature groupee des URL de stockage prive (A2) --------------------
  // Les buckets call-recordings et wa-attachments sont PRIVES : une URL
  // publique ne fonctionne plus. On signe APRES la requete et AVANT le rendu,
  // en un seul appel par bucket (createSignedUrls, au pluriel).
  // Pourquoi pas au clic : __ctPlay / __rcVoipPlay font a.src = ... puis
  // a.play() de facon synchrone. Un await avant play() casse la regle du geste
  // utilisateur et Safari refuse la lecture.
  if (!window.__odSignRows) window.__odSignRows = async function (sb, rows) {
    try {
      if (!Array.isArray(rows) || !rows.length) return rows;
      var RX = /\/storage\/v1\/object\/public\/([^/]+)\/(.+)$/;
      var byBucket = {}, refs = [];
      function collect(url, set) {
        if (!url || typeof url !== 'string') return;
        var m = url.match(RX); if (!m) return;
        var bucket = m[1], path = decodeURIComponent(m[2].split('?')[0]);
        (byBucket[bucket] = byBucket[bucket] || []).push(path);
        refs.push({ bucket: bucket, path: path, set: set });
      }
      rows.forEach(function (r) {
        if (!r) return;
        collect(r.voip_recording_url, function (v) { r.voip_recording_url = v; });
        var atts = r.attachments;
        if (typeof atts === 'string' && atts) { try { atts = JSON.parse(atts); } catch (e) { atts = null; } }
        if (Array.isArray(atts)) {
          atts.forEach(function (a) { collect(a && a.public_url, function (v) { a.public_url = v; }); });
          r.attachments = atts;
        }
      });
      if (!refs.length) return rows;
      var signed = {}, buckets = Object.keys(byBucket);
      for (var i = 0; i < buckets.length; i++) {
        var b = buckets[i];
        var uniq = byBucket[b].filter(function (p, k, arr) { return arr.indexOf(p) === k; });
        var res = await sb.storage.from(b).createSignedUrls(uniq, 3600);
        if (res.error) { console.warn('[sign] ' + b + ' : ' + res.error.message); continue; }
        (res.data || []).forEach(function (d) { if (d && d.path && d.signedUrl) signed[b + '|' + d.path] = d.signedUrl; });
      }
      refs.forEach(function (r) { var s = signed[r.bucket + '|' + r.path]; if (s) r.set(s); });
    } catch (e) { console.warn('[sign] echec : ' + (e && e.message)); }
    return rows;
  };


// Rendu FIDÈLE d'une carte de contact (transcription du template onglet Contacts de la fiche client)
function RC_card(item){
  const media = item?.media;
  const sens = item?.sens;
  const agent = item?.agent || '';
  const dateContact = item?.date_contact;
  const idLigne = (item?.id_ligne || Math.random().toString(36).substring(2,10));
  const uid = idLigne.toString().replace(/-/g,'').substring(0,8);

  const mediaAccent = { WHATSAPP:'#4CAF7D', RAPPORT_VENDEUR:'#E05252', VOIP:'#60AEDF', EMAIL:'#9E9E9E', SMS:'#F5A623', LEAD_EXTERNE:'#7C3AED' };
  const mediaBg = { WHATSAPP:'#F0FDF4', RAPPORT_VENDEUR:'#FFF5F5', VOIP:'#F0F9FF', EMAIL:'#F8F8F8', SMS:'#FFFBEB', LEAD_EXTERNE:'#F5F3FF' };
  const accent = mediaAccent[media] || '#E0E0E0';
  const bg = mediaBg[media] || '#FFFFFF';

  const formatDate = (d)=>{ if(!d) return ''; const dt=new Date(String(d).replace(' ','T'));
    return String(dt.getDate()).padStart(2,'0')+'/'+String(dt.getMonth()+1).padStart(2,'0')+'/'+dt.getFullYear()+'<br>'+
      String(dt.getHours()).padStart(2,'0')+':'+String(dt.getMinutes()).padStart(2,'0'); };
  const formatRdv = (d)=>{ if(!d) return ''; const dt=new Date(String(d).replace(' ','T'));
    return 'RDV '+String(dt.getDate()).padStart(2,'0')+'/'+String(dt.getMonth()+1).padStart(2,'0')+'/'+dt.getFullYear(); };
  const truncate = (str,n)=> str&&str.length>n ? str.substring(0,n)+'…' : (str||'');
  const esc = (s)=>(s||'').toString().replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  const parseAttachments = (raw)=>{ try{ if(Array.isArray(raw)) return raw; if(typeof raw==='string'&&raw) return JSON.parse(raw); }catch(e){} return []; };

  const mediaIcons = {
    WHATSAPP: '<svg width="14" height="14" viewBox="0 0 24 24" fill="'+accent+'"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.125.556 4.111 1.514 5.842L.057 23.428a.75.75 0 0 0 .921.921l5.629-1.456A11.945 11.945 0 0 0 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 21.75a9.722 9.722 0 0 1-4.953-1.355l-.355-.211-3.685.954.974-3.564-.23-.368A9.722 9.722 0 0 1 2.25 12C2.25 6.615 6.615 2.25 12 2.25S21.75 6.615 21.75 12 17.385 21.75 12 21.75z"/></svg>',
    VOIP: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="'+accent+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 13.1a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 2.24h3a2 2 0 0 1 2 1.72c.127.96.361 1.903.7 2.81a2 2 0 0 1-.45 2.11L7.91 9.91a16 16 0 0 0 6.08 6.08l1.03-.95a2 2 0 0 1 2.11-.45c.907.339 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/></svg>',
    EMAIL: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="'+accent+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>',
    SMS: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="'+accent+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>',
    RAPPORT_VENDEUR: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="'+accent+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    LEAD_EXTERNE: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="'+accent+'" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 8.82a15 15 0 0 1 20 0"/><path d="M5 12.859a10 10 0 0 1 14 0"/><path d="M8.5 16.429a5 5 0 0 1 7 0"/><line x1="12" y1="20" x2="12.01" y2="20"/></svg>'
  };
  const mediaIcon = mediaIcons[media] || '';

  const isInbound = sens==='inbound' || sens==='in';
  const arrowSvg = isInbound
    ? '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="'+accent+'" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="17" y1="7" x2="7" y2="17"/><polyline points="17 17 7 17 7 7"/></svg>'
    : '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="'+accent+'" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/></svg>';
  const arrowHtml = media!=='RAPPORT_VENDEUR'
    ? '<div style="flex-shrink:0;width:30px;height:30px;border-radius:50%;border:1.5px solid '+accent+';display:flex;align-items:center;justify-content:center;background:#fff;">'+arrowSvg+'</div>'
    : '';

  const toggleBtn = (tid,label)=> '<button id="tgl_'+tid+'" onclick="window.__rcToggle(\''+tid+'\')" style="background:none;border:none;cursor:pointer;padding:0 2px;font-size:12px;color:#9ca3af;display:inline;vertical-align:middle;margin-left:3px;line-height:1;font-family:sans-serif;">▸ '+(label||'voir plus')+'</button>';

  const SVG_PDF='<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><path fill="#E94335" d="M14 2H6c-1.1 0-1.99.9-1.99 2L4 20c0 1.1.89 2 1.99 2H18c1.1 0 2-.9 2-2V8l-6-6z"/><path fill="#B53024" d="M14 2v6h6l-6-6z"/><text x="12" y="17.5" text-anchor="middle" fill="#FFF" font-size="5.5" font-weight="900" font-family="Arial Black,sans-serif">PDF</text></svg>';
  const SVG_IMAGE_I='<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" fill="#34A853"/><circle cx="8.5" cy="9.5" r="1.5" fill="#FFF"/><path fill="#FFF" d="M21 15l-3.5-4.5-3 4-2-2.5L8 17h13z"/></svg>';
  const SVG_GENERIC='<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" stroke="#6B7280" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
  const getIcon = (att)=>{ const mime=(att?.mime_type||'').toLowerCase(); const fname=(att?.filename||'').toLowerCase();
    if(mime==='application/pdf'||fname.endsWith('.pdf')) return SVG_PDF;
    if(mime.startsWith('image/')||/\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i.test(fname)) return SVG_IMAGE_I;
    return SVG_GENERIC; };
  const formatSize = (b)=>{ if(!b) return ''; if(b<1024) return b+' o'; if(b<1048576) return Math.round(b/1024)+' Ko'; return (b/1048576).toFixed(1)+' Mo'; };

  let contentHtml=''; let metaRight=''; let headerMiddle=''; let footerHtml='';

  if(media==='VOIP'){
    const url=item?.voip_recording_url; const duration=item?.voip_duration_seconds||0;
    const summary=item?.voip_summary; const transcription=item?.contenu_texte; const tonalite=item?.voip_summary?.tonalite||'';
    if(url){ const pid='vp_'+uid;
      contentHtml+='<div style="display:inline-flex;align-items:center;gap:8px;background:rgba(96,174,223,0.12);border-radius:999px;padding:5px 14px;">'+
        '<button id="btn_'+pid+'" onclick="window.__rcVoipPlay(\''+pid+'\')" style="background:none;border:none;cursor:pointer;padding:0;width:16px;height:16px;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg width="10" height="12" viewBox="0 0 10 12" fill="#60AEDF"><path d="M0 0l10 6-10 6z"/></svg></button>'+
        '<span id="cur_'+pid+'" style="font-size:12px;color:#60AEDF;min-width:28px;font-variant-numeric:tabular-nums;">0:00</span>'+
        '<div style="width:130px;height:3px;background:rgba(96,174,223,0.3);border-radius:2px;cursor:pointer;position:relative;" onclick="window.__rcVoipSeek(event,this,\''+pid+'\')"><div id="prg_'+pid+'" style="height:100%;width:0%;background:#60AEDF;border-radius:2px;pointer-events:none;transition:width 0.1s linear;"></div></div>'+
        '<span id="rem_'+pid+'" style="font-size:12px;color:#60AEDF;min-width:28px;text-align:right;font-variant-numeric:tabular-nums;">'+Math.floor(duration/60)+':'+String(duration%60).padStart(2,'0')+'</span>'+
        '<div id="data_'+pid+'" data-src="'+esc(url)+'" data-dur="'+duration+'" style="display:none;"></div></div>'; }
    if(summary||transcription){ const tid='tr_'+uid; const objet=esc(summary?.objet||''); const texte=esc(transcription||'').replace(/\n/g,'<br>');
      contentHtml+='<div style="font-size:13px;color:#4b5563;line-height:1.6;margin-top:7px;"><span id="sum_'+tid+'">'+objet+'</span>'+(objet&&texte?toggleBtn(tid):'')+'<span id="ful_'+tid+'" style="display:none;color:#6b7280;font-style:italic;">'+texte+toggleBtn(tid,'voir moins')+'</span></div>'; }
    metaRight='<span style="font-size:11px;color:#9ca3af;white-space:nowrap;text-align:right;line-height:1.4">'+formatDate(dateContact)+'</span>'+(tonalite?'<span style="font-size:11px;color:#60AEDF;background:rgba(96,174,223,0.1);border:1px solid rgba(96,174,223,0.3);border-radius:999px;padding:1px 8px;white-space:nowrap;">'+esc(tonalite)+'</span>':'');
  }
  else if(media==='WHATSAPP'){
    const statut=item?.statut; const contenu=item?.contenu_texte||''; const deliveryStatus=item?.delivery_status; const isOut=sens==='out';
    const attachments=parseAttachments(item?.attachments); const att=attachments[0]; const url=att?.public_url||''; const fname=att?.filename||'';
    const placeholders=['[image]','[video]','[audio]','[document]','[sticker]'];
    const hasCaption=contenu&&!placeholders.includes(contenu.trim())&&statut!=='text';
    const captionHtml=hasCaption?'<div style="font-size:13px;color:#4b5563;line-height:1.5;word-break:break-word;margin-top:5px;">'+esc(contenu)+'</div>':'';
    if(statut==='text'){ const sid='wt_'+uid; const resume=truncate(contenu,80); const showToggle=contenu.length>80;
      contentHtml='<div style="font-size:13px;color:#4b5563;line-height:1.5;word-break:break-word;"><span id="sum_'+sid+'">'+esc(resume)+'</span>'+(showToggle?toggleBtn(sid):'')+'<span id="ful_'+sid+'" style="display:none;">'+esc(contenu)+toggleBtn(sid,'voir moins')+'</span></div>'; }
    else if(statut==='audio'){ if(url){ const wid='wa_'+uid;
      contentHtml='<div style="display:inline-flex;align-items:center;gap:8px;background:rgba(76,175,125,0.12);border-radius:999px;padding:5px 14px;width:fit-content;'+(isOut?'margin-left:auto;':'')+'">'+
        '<button id="btn_'+wid+'" onclick="window.__rcWaPlay(\''+wid+'\')" style="background:none;border:none;cursor:pointer;padding:0;width:16px;height:16px;display:flex;align-items:center;justify-content:center;flex-shrink:0;"><svg width="10" height="12" viewBox="0 0 10 12" fill="#4CAF7D"><path d="M0 0l10 6-10 6z"/></svg></button>'+
        '<span id="cur_'+wid+'" style="font-size:12px;color:#4CAF7D;min-width:28px;font-variant-numeric:tabular-nums;">0:00</span>'+
        '<div style="width:80px;height:3px;background:rgba(76,175,125,0.25);border-radius:2px;cursor:pointer;position:relative;flex-shrink:0;" onclick="window.__rcWaSeek(event,this,\''+wid+'\')"><div id="prg_'+wid+'" style="height:100%;width:0%;background:#4CAF7D;border-radius:2px;pointer-events:none;"></div></div>'+
        '<audio id="aud_'+wid+'" data-src="'+esc(url)+'" preload="none" style="display:none;"></audio></div>'+captionHtml; } }
    else if(statut==='image'){ if(url){
      contentHtml='<a href="'+esc(url)+'" target="_blank" class="rc-thumb" style="display:inline-block;position:relative;width:72px;height:72px;border-radius:10px;overflow:hidden;border:1px solid rgba(76,175,125,0.25);flex-shrink:0;cursor:pointer;"><img src="'+esc(url)+'" style="width:72px;height:72px;object-fit:cover;display:block;" /></a>'+captionHtml; } }
    else if(statut==='video'){ if(url){
      contentHtml='<a href="'+esc(url)+'" target="_blank" class="rc-thumb" style="display:inline-block;position:relative;width:72px;height:72px;border-radius:10px;overflow:hidden;border:1px solid rgba(76,175,125,0.25);flex-shrink:0;cursor:pointer;background:#1c2b45;"><video src="'+esc(url)+'" preload="metadata" muted style="width:72px;height:72px;object-fit:cover;display:block;pointer-events:none;"></video><div style="position:absolute;inset:0;display:flex;align-items:center;justify-content:center;"><div style="width:28px;height:28px;border-radius:50%;background:rgba(255,255,255,0.9);display:flex;align-items:center;justify-content:center;"><svg width="10" height="12" viewBox="0 0 10 12" fill="#374151"><path d="M0 0l10 6-10 6z"/></svg></div></div></a>'+captionHtml; } }
    else if(statut==='document'){ if(url){ const short=truncate(fname,30);
      contentHtml='<div onclick="window.open(\''+esc(url)+'\',\'_blank\')" class="rc-doc" style="display:inline-flex;align-items:center;gap:8px;padding:7px 12px;border:1px solid rgba(76,175,125,0.25);border-radius:8px;background:rgba(76,175,125,0.06);cursor:pointer;">'+getIcon(att)+'<div style="display:flex;flex-direction:column;gap:1px;"><span style="font-size:12px;color:#374151;font-weight:500;">'+esc(short)+'</span>'+(att.file_size?'<span style="font-size:11px;color:#9ca3af;">'+formatSize(att.file_size)+'</span>':'')+'</div></div>'+captionHtml; } }
    const deliveryHtml=isOut&&deliveryStatus?'<span style="font-size:14px;color:'+(deliveryStatus==='read'?'#0075df':'#9ca3af')+';">'+(deliveryStatus==='sent'?'✓':'✓✓')+'</span>':'';
    metaRight='<span style="font-size:11px;color:#9ca3af;white-space:nowrap;text-align:right;line-height:1.4">'+formatDate(dateContact)+'</span>'+deliveryHtml;
  }
  else if(media==='SMS'){
    const contenu=item?.contenu_texte||'';
    if(contenu){ const sid='sm_'+uid; const resume=truncate(contenu,80); const showToggle=contenu.length>80;
      contentHtml='<div style="font-size:13px;color:#4b5563;line-height:1.6;word-break:break-word;"><span id="sum_'+sid+'">'+esc(resume)+'</span>'+(showToggle?toggleBtn(sid):'')+'<span id="ful_'+sid+'" style="display:none;white-space:pre-wrap;">'+esc(contenu)+toggleBtn(sid,'voir moins')+'</span></div>'; }
    metaRight='<span style="font-size:11px;color:#9ca3af;white-space:nowrap;text-align:right;line-height:1.4">'+formatDate(dateContact)+'</span>';
  }
  else if(media==='EMAIL'){
    const eid='em_'+uid; const subject=item?.email_subject||'(sans sujet)'; const snippetSrc=item?.email_snippet||item?.contenu_texte||''; const snippetTrunc=truncate(snippetSrc,60);
    const sanitize=(html)=>html?html.replace(/<script[\s\S]*?<\/script>/gi,'').replace(/<iframe[\s\S]*?<\/iframe>/gi,'').replace(/\s+on\w+\s*=\s*"[^"]*"/gi,'').replace(/javascript:/gi,''):'';
    const stripHtml=(html)=>html?html.replace(/<[^>]*>/g,'').replace(/\s+/g,' ').trim():'';
    const bodyHtml=sanitize(item?.email_body_html||''); const fullContent=bodyHtml||esc(item?.contenu_texte||'');
    const fullPlain=stripHtml(item?.email_body_html||'')||(item?.contenu_texte||''); const showToggle=fullPlain.length>snippetSrc.length+10;
    headerMiddle='<span style="font-size:13px;font-weight:600;color:#111827;flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;" title="'+esc(subject)+'">'+esc(subject)+'</span>';
    contentHtml='<div style="font-size:13px;color:#4b5563;line-height:1.5;"><span id="sum_'+eid+'" style="color:#6b7280;">'+esc(snippetTrunc)+'</span>'+(showToggle?toggleBtn(eid):'')+'<div id="ful_'+eid+'" style="display:none;color:#374151;word-break:break-word;overflow-wrap:anywhere;margin-top:4px;">'+fullContent+toggleBtn(eid,'voir moins')+'</div></div>';
    metaRight='<span style="font-size:11px;color:#9ca3af;white-space:nowrap;text-align:right;line-height:1.4">'+formatDate(dateContact)+'</span>';
  }
  else if(media==='RAPPORT_VENDEUR'){
    const resultat=item?.resultat||''; const canalContact=item?.canal_contact||''; const dtActivation=item?.dt_activation; const commentaire=item?.contenu_texte||''; const note=item?.note_chatgpt;
    const chipColors={ 'Abandon':{bg:'#fee2e2',color:'#9B1C1C',border:'#fca5a5'},'Marketing':{bg:'#ede9fe',color:'#5b21b6',border:'#c4b5fd'},'Choc':{bg:'#fef3c7',color:'#92400e',border:'#fcd34d'},'Commande':{bg:'#d1fae5',color:'#065f46',border:'#6ee7b7'},'Relance':{bg:'#dbeafe',color:'#1e40af',border:'#93c5fd'} };
    const chip=chipColors[resultat]||{bg:'#f3f4f6',color:'#374151',border:'#d1d5db'};
    headerMiddle='<div style="display:flex;flex-wrap:wrap;gap:5px;align-items:center;flex:1;min-width:0;">'+
      (resultat?'<span style="background:'+chip.bg+';color:'+chip.color+';border:1px solid '+chip.border+';border-radius:999px;padding:2px 10px;font-size:12px;font-weight:500;white-space:nowrap;">'+esc(resultat)+'</span>':'')+
      (canalContact?'<span style="background:#f3f4f6;color:#6b7280;border:1px solid #e5e7eb;border-radius:999px;padding:2px 10px;font-size:12px;white-space:nowrap;">'+esc(canalContact)+'</span>':'')+
      (dtActivation?'<span style="background:#eff6ff;color:#2a5ea9;border:1px solid #bfdbfe;border-radius:999px;padding:2px 10px;font-size:12px;white-space:nowrap;">'+formatRdv(dtActivation)+'</span>':'')+'</div>';
    const sid='rv_'+uid; const showToggle=commentaire.length>80; const resume=truncate(commentaire,80);
    contentHtml=commentaire?'<div style="font-size:13px;color:#4b5563;line-height:1.5;"><span id="sum_'+sid+'">'+esc(resume)+'</span>'+(showToggle?toggleBtn(sid):'')+'<span id="ful_'+sid+'" style="display:none;">'+esc(commentaire)+toggleBtn(sid,'voir moins')+'</span></div>':'';
    const noteHtml=note!=null?(()=>{ const isGood=note>=7; return '<div style="display:flex;flex-direction:column;align-items:center;gap:1px;flex-shrink:0;"><span style="font-size:13px;font-weight:700;color:'+(isGood?'#4CAF7D':'#E05252')+';background:'+(isGood?'#D1FAE5':'#FEE2E2')+';border:1.5px solid '+(isGood?'#4CAF7D':'#E05252')+';border-radius:50%;width:26px;height:26px;display:inline-flex;align-items:center;justify-content:center;">'+note+'</span><span style="font-size:9px;color:#9ca3af;letter-spacing:0.02em;">IA</span></div>'; })():'';
    metaRight='<span style="font-size:11px;color:#9ca3af;white-space:nowrap;text-align:right;line-height:1.4">'+formatDate(dateContact)+'</span>'+noteHtml;
  }
  else if(media==='LEAD_EXTERNE'){
    const source=item?.origine_echange||''; const sourceRef=item?.canal_contact||''; const vehicule=item?.vehicule_interet||''; const statutBrut=item?.statut||''; const contenu=item?.contenu_texte||''; const phone=item?.phone_from||'';
    const sourceChip=source?'<span style="background:#ede9fe;color:#5b21b6;border:1px solid #c4b5fd;border-radius:999px;padding:2px 10px;font-size:12px;font-weight:500;white-space:nowrap;">'+esc(source)+(sourceRef?' · '+esc(truncate(sourceRef,20)):'')+'</span>':'';
    const isTraite=statutBrut==='traite';
    const statutChip=statutBrut?'<span style="background:'+(isTraite?'#d1fae5':'#fef3c7')+';color:'+(isTraite?'#065f46':'#92400e')+';border:1px solid '+(isTraite?'#6ee7b7':'#fcd34d')+';border-radius:999px;padding:2px 10px;font-size:12px;font-weight:500;white-space:nowrap;">'+(isTraite?'✓ Traité':'⏱ Non traité')+'</span>':'';
    const vehiculeChip=vehicule?'<span style="background:#f5f3ff;color:#5b21b6;border:1px solid #ddd6fe;border-radius:999px;padding:2px 10px;font-size:12px;white-space:nowrap;" title="'+esc(vehicule)+'">🚗 '+esc(truncate(vehicule,30))+'</span>':'';
    headerMiddle='<div style="display:flex;flex-wrap:wrap;gap:5px;align-items:center;flex:1;min-width:0;">'+sourceChip+statutChip+vehiculeChip+'</div>';
    if(contenu||phone){ const sid='le_'+uid; const showToggle=contenu.length>80; const resume=truncate(contenu,80);
      const phoneHtml=phone?'<div style="font-size:12px;color:#6b7280;margin-top:4px;display:inline-flex;align-items:center;gap:4px;"><a href="tel:'+esc(phone)+'" style="color:#7C3AED;text-decoration:none;">'+esc(phone)+'</a></div>':'';
      contentHtml='<div style="font-size:13px;color:#4b5563;line-height:1.5;word-break:break-word;">'+(contenu?'<span id="sum_'+sid+'">'+esc(resume)+'</span>'+(showToggle?toggleBtn(sid):'')+'<span id="ful_'+sid+'" style="display:none;white-space:pre-wrap;">'+esc(contenu)+toggleBtn(sid,'voir moins')+'</span>':'')+phoneHtml+'</div>'; }
    metaRight='<span style="font-size:11px;color:#9ca3af;white-space:nowrap;text-align:right;line-height:1.4">'+formatDate(dateContact)+'</span>';
  }

  const indent = arrowHtml ? '38px' : '0';
  return '<div style="background:'+bg+';border-left:3px solid '+accent+';border-top:1px solid '+accent+'22;border-right:1px solid '+accent+'22;border-bottom:1px solid '+accent+'22;border-radius:10px;padding:10px 14px;font-family:-apple-system,BlinkMacSystemFont,\'Segoe UI\',sans-serif;width:100%;box-sizing:border-box;box-shadow:0 2px 6px rgba(0,0,0,0.08);margin-bottom:8px;">'+
    '<div style="display:flex;align-items:center;gap:8px;min-width:0;">'+arrowHtml+
      '<div style="display:flex;align-items:center;gap:5px;flex-shrink:0;max-width:140px;">'+mediaIcon+'<span style="font-size:13px;font-weight:600;color:#1f2937;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;" title="'+esc(agent)+'">'+esc(agent)+'</span></div>'+
      (headerMiddle?'<span style="color:#e5e7eb;font-size:13px;flex-shrink:0;">|</span>'+headerMiddle:'<div style="flex:1;"></div>')+
      '<div style="display:flex;align-items:center;gap:6px;flex-shrink:0;margin-left:auto;">'+metaRight+'</div>'+
    '</div>'+
    (contentHtml?'<div style="margin-top:8px;padding-left:'+indent+';">'+contentHtml+'</div>':'')+
    (footerHtml?'<div style="padding-left:'+indent+';">'+footerHtml+'</div>':'')+
  '</div>';
}

function RC_render(){
  const ov = doc.getElementById('real-contacts-ov'); if(!ov) return;
  let body='';
  if(RC.loading || RC.rows===null && !RC.error){ body='<div class="rc-load">Chargement des échanges…</div>'; }
  else if(RC.error){ body='<div class="rc-err">Erreur : '+RC_esc(RC.error)+'</div>'; }
  else if(!RC.rows.length){ body='<div class="rc-load">Aucun échange enregistré pour ce cycle.</div>'; }
  else { body = RC.rows.map(RC_card).join(''); }

  const ficheBtn = RC.idClient ? '<button class="rc-fiche" data-rcfiche="'+RC.idClient+'">Ouvrir la fiche complète →</button>' : '';
  ov.innerHTML = RC_STYLE + '<div class="rc-modal">'+
    '<div class="rc-head"><div class="rc-title">Échanges du cycle</div>'+
      '<div class="rc-head-actions">'+ficheBtn+'<button class="rc-close" data-rcclose title="Fermer">×</button></div>'+
    '</div>'+
    '<div class="rc-body">'+body+'</div>'+
  '</div>';
}

// Routeur du sous-popup contacts
function RC_route(e){
  if(e.target.id==='real-contacts-ov'){ RC_close(); return; }
  const cl=e.target.closest('[data-rcclose]'); if(cl){ RC_close(); return; }
  const f=e.target.closest('[data-rcfiche]'); if(f){ const id=f.getAttribute('data-rcfiche'); RC_close(); R_openClientFicheTab(Number(id), 0); return; }
}

// Fonctions globales d'interactivité des cartes contacts (toggle + lecteurs audio)
window.__rcToggle = function(id){
  const sum=doc.getElementById('sum_'+id); const ful=doc.getElementById('ful_'+id); const btn=doc.getElementById('tgl_'+id);
  if(!ful) return; const open=ful.style.display!=='none';
  ful.style.display=open?'none':'block'; if(sum) sum.style.display=open?'inline':'none';
  if(btn) btn.innerHTML=open?'▸ voir plus':'▸ voir moins';
};
if(!window.__rcVoipAudio) window.__rcVoipAudio=new Audio();
window.__rcVoipPlay = function(pid){
  const b=doc.getElementById('btn_'+pid);
  const pauseIcon='<svg width="12" height="12" viewBox="0 0 12 12" fill="#60AEDF"><rect x="0" y="0" width="4" height="12" rx="1"/><rect x="8" y="0" width="4" height="12" rx="1"/></svg>';
  const playIcon='<svg width="10" height="12" viewBox="0 0 10 12" fill="#60AEDF"><path d="M0 0l10 6-10 6z"/></svg>';
  const a=window.__rcVoipAudio;
  if(a.dataset.currentId&&a.dataset.currentId!==pid){ const pb=doc.getElementById('btn_'+a.dataset.currentId); const pp=doc.getElementById('prg_'+a.dataset.currentId); if(pb) pb.innerHTML=playIcon; if(pp) pp.style.width='0%'; a.pause(); a.src=''; }
  a.dataset.currentId=pid;
  if(!a.src||a.dataset.loadedId!==pid){ const dataEl=doc.getElementById('data_'+pid); if(!dataEl) return; a.src=dataEl.dataset.src; a.dataset.loadedId=pid; const dur=parseFloat(dataEl.dataset.dur)||0;
    a.ontimeupdate=function(){ const d=a.duration||dur,c=a.currentTime; const prg=doc.getElementById('prg_'+pid); const cur=doc.getElementById('cur_'+pid); const rem=doc.getElementById('rem_'+pid);
      if(prg) prg.style.width=(d>0?c/d*100:0)+'%'; if(cur) cur.textContent=Math.floor(c/60)+':'+String(Math.floor(c%60)).padStart(2,'0'); if(rem) rem.textContent=Math.floor((d-c)/60)+':'+String(Math.floor((d-c)%60)).padStart(2,'0'); };
    a.onended=function(){ if(b) b.innerHTML=playIcon; const prg=doc.getElementById('prg_'+pid); if(prg) prg.style.width='0%'; };
    a.play().then(()=>{ if(b) b.innerHTML=pauseIcon; }).catch(e=>console.warn('voip:',e)); return; }
  if(a.paused){ a.play().then(()=>{ if(b) b.innerHTML=pauseIcon; }).catch(e=>console.warn(e)); } else { a.pause(); if(b) b.innerHTML=playIcon; }
};
window.__rcVoipSeek = function(e,bar,pid){ const a=window.__rcVoipAudio; if(!a||!a.duration) return; const r=bar.getBoundingClientRect(); a.currentTime=(e.clientX-r.left)/r.width*a.duration; };
window.__rcWaPlay = function(wid){
  const a=doc.getElementById('aud_'+wid); const b=doc.getElementById('btn_'+wid); if(!a||!b) return;
  const pauseIcon='<svg width="12" height="12" viewBox="0 0 12 12" fill="#4CAF7D"><rect x="0" y="0" width="4" height="12" rx="1"/><rect x="8" y="0" width="4" height="12" rx="1"/></svg>';
  const playIcon='<svg width="10" height="12" viewBox="0 0 10 12" fill="#4CAF7D"><path d="M0 0l10 6-10 6z"/></svg>';
  if(!a.getAttribute('src')){ a.setAttribute('src',a.dataset.src); a.load();
    a.ontimeupdate=function(){ const d=a.duration,c=a.currentTime; const prg=doc.getElementById('prg_'+wid); const cur=doc.getElementById('cur_'+wid); if(prg) prg.style.width=(d>0?c/d*100:0)+'%'; if(cur) cur.textContent=Math.floor(c/60)+':'+String(Math.floor(c%60)).padStart(2,'0'); };
    a.onended=function(){ b.innerHTML=playIcon; const prg=doc.getElementById('prg_'+wid); if(prg) prg.style.width='0%'; };
    a.addEventListener('canplay',function onR(){ a.removeEventListener('canplay',onR); a.play(); b.innerHTML=pauseIcon; }); return; }
  if(a.paused){ a.play(); b.innerHTML=pauseIcon; } else { a.pause(); b.innerHTML=playIcon; }
};
window.__rcWaSeek = function(e,bar,wid){ const a=doc.getElementById('aud_'+wid); if(!a||!a.duration) return; const r=bar.getBoundingClientRect(); a.currentTime=(e.clientX-r.left)/r.width*a.duration; };

const RC_STYLE = '<style>'+
'#real-contacts-ov{position:fixed;inset:0;background:rgba(42,52,60,.45);z-index:70;display:flex;align-items:flex-start;justify-content:center;padding:32px;overflow-y:auto;font-family:"Nunito Sans",sans-serif}'+
'#real-contacts-ov .rc-modal{position:relative;background:#fff;border-radius:16px;max-width:680px;width:100%;box-shadow:0 24px 70px rgba(0,0,0,.35);margin:auto;display:flex;flex-direction:column;max-height:82vh}'+
'#real-contacts-ov .rc-head{display:flex;align-items:center;justify-content:space-between;gap:12px;padding:16px 20px;border-bottom:1px solid #eef0f3}'+
'#real-contacts-ov .rc-title{font-size:16px;font-weight:800;color:#2a5ea9}'+
'#real-contacts-ov .rc-head-actions{display:flex;align-items:center;gap:10px}'+
'#real-contacts-ov .rc-fiche{background:#2a5ea9;color:#fff;border:none;border-radius:8px;padding:7px 14px;font-family:inherit;font-size:13px;font-weight:700;cursor:pointer}'+
'#real-contacts-ov .rc-fiche:hover{background:#1f4a87}'+
'#real-contacts-ov .rc-close{width:32px;height:32px;border-radius:50%;border:none;background:#f1f3f6;color:#888;font-size:19px;line-height:32px;text-align:center;cursor:pointer;padding:0;display:flex;align-items:center;justify-content:center}'+
'#real-contacts-ov .rc-close:hover{background:#d97070;color:#fff}'+
'#real-contacts-ov .rc-body{padding:16px 20px;overflow-y:auto}'+
'#real-contacts-ov .rc-load,#real-contacts-ov .rc-err{padding:30px;text-align:center;color:#888;font-size:14px}'+
'#real-contacts-ov .rc-err{color:#a32d2d}'+
'#real-contacts-ov .rc-doc:hover{background:rgba(76,175,125,0.12)!important}'+
'#real-contacts-ov .rc-thumb{transition:opacity .15s}'+
'@media (max-width:760px){'+
'#real-contacts-ov{padding:12px}'+
'#real-contacts-ov .rc-modal{max-height:88vh}'+
'#real-contacts-ov .rc-head{padding:12px 14px}'+
'#real-contacts-ov .rc-body{padding:12px 14px}'+
'}'+
'</style>';
// --- fin sous-popup contacts ---


// ============================================================================
//  RÉALISATION DEPUIS L'AGENDA
//  Le bouton "Réaliser la Bilatérale" de l'agenda remplit la variable
//  id_bilate_real puis navigue vers cette page. Si la variable porte un id au
//  chargement, on ouvre directement le popup de réalisation (R_open) sur cette
//  bilatérale, puis on vide la variable pour ne pas la rouvrir aux visites
//  suivantes.
// ============================================================================
(function bilAutoOpenFromAgenda(){
  function tryOpen(){
    // v6 : l'agenda dépose l'id dans sessionStorage (fiable en navigation SPA).
    try {
      const W = (wwLib.getFrontWindow && wwLib.getFrontWindow()) || window;
      const raw = W.sessionStorage.getItem('od_bil_open');
      if (raw) {
        W.sessionStorage.removeItem('od_bil_open');
        const o = JSON.parse(raw);
        try { wwLib.wwVariable.updateValue(VAR_ID_BILATE_REAL, null); } catch(e){}
        if (o && o.id && (Date.now() - (o.t || 0)) < 120000) { R_open(Number(o.id)); return true; }
      }
    } catch(e){}
    try {
      const v = wwLib.wwVariable.getValue(VAR_ID_BILATE_REAL);
      if (v != null && v !== '' && !Number.isNaN(Number(v))) {
        const id = Number(v);
        try { wwLib.wwVariable.updateValue(VAR_ID_BILATE_REAL, null); } catch(e){}
        R_open(id);
        return true;
      }
    } catch(e){}
    return false;
  }
  if (tryOpen()) return;
  let n = 0;
  const iv = setInterval(() => { n++; if (tryOpen() || n > 15) clearInterval(iv); }, 200);
})();

// --- Responsive : bascule #bil-root.bil-narrow selon la largeur RÉELLE du root
(function bindBilNarrow(tries){
  tries = tries || 0;
  try { window.__bilVer = 'v2-responsive'; } catch(e){}
  const root = getRoot();
  if (!root) { if (tries < 40) setTimeout(function(){ bindBilNarrow(tries + 1); }, 200); return; }
  const W = doc.defaultView || window;
  function apply(){
    const r = getRoot(); if (!r) return;
    let w = 0;
    try { w = r.getBoundingClientRect().width || r.clientWidth || 0; } catch(e){}
    if (!w) return;
    if (w <= 760) r.classList.add('bil-narrow'); else r.classList.remove('bil-narrow');
  }
  apply();
  [120, 400, 900, 1800, 3200].forEach(function(d){ setTimeout(apply, d); });
  try {
    if ('ResizeObserver' in W) {
      if (window.__bilRO) { try { window.__bilRO.disconnect(); } catch(e){} }
      window.__bilRO = new W.ResizeObserver(apply);
      window.__bilRO.observe(root);
    } else {
      if (window.__bilResize) W.removeEventListener('resize', window.__bilResize);
      window.__bilResize = apply;
      W.addEventListener('resize', window.__bilResize);
    }
  } catch(e){}
})();


}
});
