// ============================================================================
//  COCKPIT MARKETING — module One Data (OD.define)   v8 — PROFIL TEAM COLIN
//  v8 (18/11/2026) : pression commerciale — onglet Pression (registre des contacts
//    sortants, niveaux, vendeurs, signaux, clients au plafond, clients oubliés),
//    charte du groupe éditable, appliquée à toutes les campagnes et opérations.
//  v7 (17/11/2026) : opérations commerciales (vente privée, portes ouvertes…) —
//    fichier dimensionné sur la capacité d'appel et classé par PRISME, vendeurs
//    ou prestataire (fichier d'appel tracé), bilan RDV + ventes contre témoin.
//  v6 (17/11/2026) : responsive mobile — tableaux en fiches, onglets courts,
//    barre d'audience flottante dans Composer, champs à 16 px (pas de zoom iOS).
//  v5 (17/11/2026) : logo = « O » One Data qui décompose la lumière ; PRISME
//    signe chaque onglet (ligne d'en-tête) et chaque bloc qu'il produit.
//  v4 (17/11/2026) : marque « PRISME by One Data » (bandeau, onglet PRISME,
//    propositions signées). Données du client, intelligence One Data.
//  v3 (17/11/2026) : périmètre choisi dans la page (groupe / marque / affaire /
//    site, RPC mkt_perimetre), comparatif au niveau inférieur, suivi des
//    campagnes limité et ventilé selon le même périmètre.
//  v2 (17/11/2026) : accès tranché par la base (RPC mkt_acces), pilote limité.
//
//  Page du directeur digital et marketing. Quatre onglets :
//    Moments    : où en sont les clients du périmètre dans leur parcours, ce que
//                 PRISME (moteur prédictif One Data) attend, et ses propositions.
//    Composer   : construire une audience à la volée (cascade d'exclusion en
//                 direct), la lancer en sollicitations ou l'extraire en CSV.
//    Campagnes  : avancement et commandes obtenues, mesurées contre un groupe
//                 témoin tiré au hasard et jamais sollicité.
//    PRISME     : fiabilité du moteur PRISME, dite en clair.
//
//  Prérequis SQL (tenant Team Colin, sql/04_cockpit_marketing.sql) :
//    mkt_synthese, mkt_audience, mkt_export, mkt_campagne_creer, mkt_campagnes
//  Accès : rôles 1, 2, 5, 6, 7, 8 (contrôlé aussi côté base par mkt_viewer).
//  Périmètre : sélecteur propre à la page (le site de la barre du haut n'est pas suivi).
// ============================================================================

OD.define('cockpit-mkt', {
  async mount(__anchor, ctx) {
    __anchor.id = 'mkt-root';
    const R = __anchor;
    const ROLES_OK = [1, 2, 5, 6, 7, 8];

    // ------------------------------------------------------------- libellés
    const ETATS = {
      PROSPECT_CHAUD: { t: 'Prospects chauds', g: 'acq', d: 'Demande ou simulation très récente, pas encore d\'achat.' },
      PROJET_EN_COURS: { t: 'Projets en cours', g: 'acq', d: 'Un projet est ouvert : simulations, propositions, échanges.' },
      PROJET_PERDU: { t: 'Projets perdus', g: 'acq', d: 'Projet récent clos sans commande.' },
      PROSPECT_FROID: { t: 'Prospects froids', g: 'acq', d: 'Contacts sans véhicule chez nous et sans signal récent.' },
      NOUVEAU_PROPRIETAIRE: { t: 'Nouveaux propriétaires', g: 'pos', d: 'Achat de moins d\'un an.' },
      ATELIER_UNIQUE_RECENT: { t: 'Première visite atelier', g: 'pos', d: 'Une seule visite atelier, récente.' },
      FIDELE_ATELIER: { t: 'Fidèles atelier', g: 'pos', d: 'Visites régulières, rythme respecté.' },
      PROPRIETAIRE_SANS_ATELIER: { t: 'Propriétaires sans atelier', g: 'pos', d: 'Véhicule acheté chez nous, jamais revu à l\'atelier.' },
      FENETRE_RENOUVELLEMENT: { t: 'Fenêtre de renouvellement', g: 'ren', d: 'Âge du véhicule ou fin de financement : le moment de proposer.' },
      SILENCE_ALERTE: { t: 'Silence en alerte', g: 'ren', d: 'En retard sur son propre rythme de visite (2 à 3 fois l\'écart habituel).' },
      SILENCE_PROFOND: { t: 'Silence profond', g: 'ren', d: 'Plus de trois fois son écart habituel sans nouvelles.' }
    };
    const ORDRE_ETATS = ['PROSPECT_CHAUD', 'PROJET_EN_COURS', 'PROJET_PERDU', 'PROSPECT_FROID',
      'NOUVEAU_PROPRIETAIRE', 'ATELIER_UNIQUE_RECENT', 'FIDELE_ATELIER', 'PROPRIETAIRE_SANS_ATELIER',
      'FENETRE_RENOUVELLEMENT', 'SILENCE_ALERTE', 'SILENCE_PROFOND'];
    const GROUPES = { acq: 'Acquisition', pos: 'Possession', ren: 'Renouvellement et risque' };
    const ETAPES = {
      ACHAT_VN: 'Achat de neuf', ACHAT_VO: 'Achat d\'occasion', PROJET: 'Nouveau projet',
      LEAD: 'Nouvelle demande', ATELIER: 'Passage à l\'atelier', SORTIE: 'Sortie du parc', SILENCE: 'Silence'
    };
    const FIN = { LOA: 'LOA', LLD: 'LLD', CREDIT: 'Crédit', COMPTANT: 'Comptant', AUCUN: 'Sans financement', NON_RENSEIGNE: 'Non renseigné' };
    const SEG = { B2C: 'Particuliers', B2B: 'Professionnels' };
    const CANAUX = { telephone: 'Téléphone', sms: 'SMS', email: 'E-mail', tous: 'SMS ou e-mail' };
    const TRAITS = {
      'z_achats': 'achats', 'z_part VN': 'part de neuf', 'z_projets': 'projets', 'z_visites': 'visites atelier',
      'z_km annuel': 'kilométrage', 'z_véhicules': 'véhicules', 'z_ancienneté': 'ancienneté', 'z_part garantie': 'part garantie',
      'z_irrégularité': 'irrégularité', 'z_valeur atelier': 'valeur atelier', 'z_âge véhicule': 'âge du véhicule',
      'z_financement locatif': 'location', 'z_écart entre visites': 'écart entre visites', 'z_leads': 'demandes'
    };

    // ------------------------------------------------------------- état
    const S = {
      onglet: 'moments', synth: null, err: null, chargement: true,
      crit: critDefaut(), nom: '', motif: '', audience: null, audErr: null, audCharge: false, audSeq: 0,
      confirm: null, envoi: false, message: null, campagnes: null, campErr: null, ouvertCoh: null,
      per: { niveau: 'groupe', valeur: null }, perim: null, ouvertCamp: {}, op: opDefaut(), pression: null, presErr: null, presCharge: false, charte: null, charteEdit: null, charteMsg: null
    };
    // Opération commerciale ponctuelle : 1 à 3 jours d'appels pour caler des RDV
    function opDefaut() {
      return { actif: false, type: 'Vente privée', debut: '', fin: '', executant: 'vendeurs', mode: 'libre', prestataire: '',
        appelants: 4, heures: 12, appels_heure: 12, tentatives: 2, cout: '' };
    }
    const TYPES_OP = ['Vente privée', 'Portes ouvertes', 'Temps fort commercial', 'Déstockage VO', 'Lancement de modèle', 'Fins de contrat LOA / LLD', 'Autre'];
    function capacite() {
      const o = S.op, n = x => Math.max(0, Number(x) || 0);
      return Math.floor(n(o.appelants) * n(o.heures) * n(o.appels_heure) / Math.max(1, n(o.tentatives) || 1));
    }
    function opPayload() {
      const o = S.op;
      return { type: o.type, debut: o.debut, fin: o.fin || o.debut, executant: o.executant, mode: o.mode, prestataire: o.prestataire.trim(),
        appelants: Number(o.appelants) || 0, heures: Number(o.heures) || 0, appels_heure: Number(o.appels_heure) || 0,
        tentatives: Number(o.tentatives) || 1, cout: Number(o.cout) || 0 };
    }
    const euros = v => nf.format(Math.round(Number(v) || 0)) + ' €';
    function critDefaut() {
      return { segments: [], etats: [], archetypes: [], etapes: [], marques: [], financements: [],
        decile_max: null, age_min_mois: null, age_max_mois: null, canal: 'telephone',
        exclure_cycle_ouvert: true, oublies: false, temoin_pct: 10 };
    }

    // ------------------------------------------------------------- outils
    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const nf = new Intl.NumberFormat('fr-FR');
    const n0 = v => (v == null || isNaN(Number(v))) ? '–' : nf.format(Math.round(Number(v)));
    const pct = (v, d) => (v == null || isNaN(Number(v))) ? '–' : (Number(v) * 100).toLocaleString('fr-FR', { minimumFractionDigits: d == null ? 1 : d, maximumFractionDigits: d == null ? 1 : d }) + ' %';
    const dfr = s => { if (!s) return '–'; const d = new Date(String(s).length <= 10 ? s + 'T12:00:00' : s); return isNaN(d) ? '–' : d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }); };
    const sb = () => ctx.supabase;
    function user() { let u = ctx.user || (window.OD && OD.getUser && OD.getUser()); if (Array.isArray(u)) u = u[0]; return u || {}; }
    const viewer = () => { const v = Number(user().ID_User); return isFinite(v) && v > 0 ? v : null; };
    const role = () => { const r = Number(user().ID_Role); return isFinite(r) ? r : null; };
    async function rpc(nom, args) {
      const r = await sb().rpc(nom, args || {});
      if (r.error) throw new Error(r.error.message || nom);
      return r.data;
    }
    function bus() {
      try { const w = wwLib.getFrontWindow(); if (w && w.oropraSite) return w.oropraSite; } catch (e) { }
      return window.oropraSite || null;
    }
    // v3 : le périmètre se choisit DANS la page (groupe / marque / affaire / site),
    // indépendamment du site de la barre du haut. Mémorisé par utilisateur.
    const NIVEAUX = [['groupe', 'Groupe'], ['marque', 'Marque'], ['affaire', 'Affaire'], ['site', 'Site']];
    const SOUS_NIVEAU = { groupe: 'marque', marque: 'affaire', affaire: 'site', site: null };
    const CLE_PER = () => 'od-mkt-perimetre-' + (viewer() || 0);
    function lirePer() {
      try { const p = JSON.parse(localStorage.getItem(CLE_PER()) || 'null'); if (p && p.niveau) return p; } catch (e) { }
      return { niveau: 'groupe', valeur: null };
    }
    function ecrirePer() { try { localStorage.setItem(CLE_PER(), JSON.stringify(S.per)); } catch (e) { } }
    const cleNiveau = (s, niv) => niv === 'marque' ? s.marque : niv === 'affaire' ? String(s.id_affaire) : niv === 'site' ? String(s.id_site) : 'groupe';
    const libNiveau = (s, niv) => niv === 'marque' ? (s.marque.charAt(0) + s.marque.slice(1).toLowerCase()) : niv === 'affaire' ? s.affaire : niv === 'site' ? s.site : 'Groupe';
    function sitesDe(niv, val) {
      const l = S.perim || [];
      if (niv === 'groupe' || val == null) return l;
      return l.filter(s => cleNiveau(s, niv) === String(val));
    }
    function sites() {
      if (!S.perim || S.per.niveau === 'groupe' || S.per.valeur == null) return null;
      const ids = sitesDe(S.per.niveau, S.per.valeur).map(s => Number(s.id_site));
      return ids.length ? ids : null;
    }
    function libPerimetre() {
      const p = S.per;
      if (p.niveau === 'groupe' || p.valeur == null) return 'Tout le groupe · ' + n0((S.perim || []).length) + ' concessions';
      const l = sitesDe(p.niveau, p.valeur);
      if (!l.length) return 'Tout le groupe';
      const nom = libNiveau(l[0], p.niveau);
      return (p.niveau === 'site' ? 'Site ' : p.niveau === 'affaire' ? 'Affaire ' : 'Marque ') + nom + (p.niveau !== 'site' ? ' · ' + l.length + ' concession' + (l.length > 1 ? 's' : '') : '');
    }
    // Regroupe une liste {id_site, ...valeurs} au niveau voulu
    function regrouper(lignes, niv, champs) {
      const parSite = {}; (S.perim || []).forEach(s => { parSite[s.id_site] = s; });
      const g = {};
      lignes.forEach(x => {
        const s = parSite[x.id_site]; if (!s) return;
        const k = cleNiveau(s, niv);
        if (!g[k]) { g[k] = { cle: k, lib: libNiveau(s, niv) }; champs.forEach(c => { g[k][c] = 0; }); }
        champs.forEach(c => { g[k][c] += Number(x[c]) || 0; });
      });
      return Object.values(g);
    }
    function choisirPer(niveau, valeur) {
      if (niveau !== 'groupe' && valeur == null) {
        const premier = (S.perim || [])[0]; valeur = premier ? cleNiveau(premier, niveau) : null;
      }
      S.per = { niveau: niveau, valeur: niveau === 'groupe' ? null : valeur };
      ecrirePer();
      S.audience = null; S.confirm = null; S.message = null; S.campagnes = null; S.pression = null;
      chargerSynthese().then(() => { if (S.onglet === 'composer') chargerAudience(); });
    }
    function ouvrirFicheClient(id) {
      const n = Number(id); if (!(n > 0)) return;
      const FW = (window.wwLib && wwLib.getFrontWindow && wwLib.getFrontWindow()) || window;
      try { wwLib.wwVariable.updateValue('55490583-c88b-4748-916e-4d203db07742', { IDVu: n }); } catch (e) { }
      try { FW.__odFicheTab = 0; } catch (e) { }
      let editeur = false;
      try { editeur = window.self !== window.top; } catch (e) { editeur = true; }
      if (editeur) { try { wwLib.wwApp.goTo('259f1951-a2d4-4b90-ac83-0b3febe1d4ec'); return; } catch (e) { } }
      try { wwLib.goTo('/fr/fiche-client'); return; } catch (e) { }
      try { FW.location.href = '/fr/fiche-client?idvu=' + n; } catch (e) { }
    }
    function nomCohorte(code) {
      const c = ((S.synth && S.synth.cohortes) || []).find(x => x.segment + '-' + x.archetype === code);
      return c ? c.libelle : code;
    }
    function traits(profil) {
      if (!profil) return [];
      return Object.keys(profil).filter(k => k.indexOf('z_') === 0 && TRAITS[k])
        .map(k => ({ k, z: Number(profil[k]) })).filter(x => Math.abs(x.z) >= 0.5)
        .sort((a, b) => Math.abs(b.z) - Math.abs(a.z)).slice(0, 3)
        .map(x => (x.z > 0 ? '↑ ' : '↓ ') + TRAITS[x.k]);
    }

    // ------------------------------------------------------------- styles (charte v55, sans noir ni rouge)
    const CSS = `
#mkt-root{--bleu:#2a5ea9;--bleu-f:#1F4A85;--bleu-c:#e8f0fb;--ink:#1F4A85;--ink-2:#4a6a8a;--ink-3:#7a9cc4;--vert:#53bda7;--vert-c:#e6f6f2;
 --or:#fac055;--or-f:#c7820a;--or-c:#fef5e2;--tuile:#f5f8fc;--card:#fff;--line:#eaf0f9;--ombre:0 1px 3px rgba(42,94,169,.07);
 font-family:'Nunito Sans',system-ui,sans-serif;color:var(--ink-2);font-size:14px;line-height:1.45;max-width:1320px;margin:0 auto;padding:18px 16px 60px;box-sizing:border-box}
#mkt-root *{box-sizing:border-box}
#mkt-root h1{font-size:22px;font-weight:800;color:var(--bleu-f);margin:0;letter-spacing:-.01em}
#mkt-root h2{font-size:15px;font-weight:800;color:var(--bleu-f);margin:0 0 10px;display:flex;align-items:center;gap:8px}
#mkt-root h2:before{content:'';width:4px;height:16px;border-radius:2px;background:var(--bleu);flex:none}
#mkt-root .sous{color:var(--ink-3);font-size:12.5px}
#mkt-root .prisme-bandeau{display:inline-flex;align-items:center;gap:7px;font-size:12px;color:var(--ink-2);background:var(--tuile);border:1px solid var(--line);border-radius:20px;padding:4px 12px 4px 8px;margin:-6px 0 12px}
#mkt-root .prisme-bandeau b{color:var(--bleu-f)} #mkt-root .prisme-bandeau .sep{color:var(--ink-3)}
#mkt-root h2.p:before{display:none}
#mkt-root h2.p{gap:7px}
#mkt-root .prisme-onglet{display:flex;flex-wrap:wrap;align-items:center;gap:6px 8px;font-size:12.5px;color:var(--ink-2);margin:-6px 0 14px;padding:0 2px}
#mkt-root .prisme-onglet b{color:var(--bleu-f)}
#mkt-root .signe{display:inline-flex;align-items:center;gap:5px;font-size:11px;font-weight:700;color:var(--ink-3)}
#mkt-root .prisme-carte{background:linear-gradient(135deg,#fff 0%,var(--tuile) 100%)}
#mkt-root .prisme-titre{display:flex;align-items:center;gap:12px;margin-bottom:12px}
#mkt-root .prisme-titre .by{font-size:13px;font-weight:700;color:var(--ink-3)}
#mkt-root .prisme-lettres{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:8px}
#mkt-root .prisme-lettres div{background:#fff;border:1px solid var(--line);border-radius:10px;padding:8px 10px;display:grid;grid-template-columns:28px 1fr;column-gap:6px}
#mkt-root .prisme-lettres b{grid-row:1/3;font-size:22px;font-weight:800;color:var(--bleu);line-height:1}
#mkt-root .prisme-lettres span{font-weight:800;color:var(--bleu-f);font-size:13px}
#mkt-root .prisme-lettres em{font-style:normal;font-size:11.5px;color:var(--ink-3)}
#mkt-root .perim{display:flex;flex-wrap:wrap;align-items:center;gap:8px 10px;margin:-4px 0 14px}
#mkt-root .perl{font-size:10.5px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:var(--ink-3)}
#mkt-root .seg{display:inline-flex;border:1px solid #d6e2f2;border-radius:10px;overflow:hidden;background:#fff}
#mkt-root .seg button{border:0;background:none;padding:7px 14px;font:inherit;font-size:13px;font-weight:700;color:var(--ink-2);cursor:pointer;border-right:1px solid #e3ebf6}
#mkt-root .seg button:last-child{border-right:0}
#mkt-root .seg button.on{background:var(--bleu);color:#fff}
#mkt-root .perim select{min-width:220px}
#mkt-root tr.sousl td{background:var(--tuile);font-size:12.5px}
#mkt-root .tete{display:flex;flex-wrap:wrap;align-items:flex-end;justify-content:space-between;gap:10px;margin-bottom:14px}
#mkt-root .onglets{display:flex;gap:4px;background:var(--tuile);border:1px solid var(--line);border-radius:12px;padding:4px;overflow-x:auto;margin-bottom:16px}
#mkt-root .onglets button{border:0;background:none;padding:8px 16px;border-radius:9px;font:inherit;font-weight:700;color:var(--ink-2);cursor:pointer;white-space:nowrap}
#mkt-root .onglets button.on{background:#fff;color:var(--bleu);box-shadow:var(--ombre)}
#mkt-root .card{background:var(--card);border:1px solid var(--line);border-radius:14px;padding:16px;box-shadow:var(--ombre);margin-bottom:14px}
#mkt-root .bande{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px;margin-bottom:14px}
#mkt-root .kpi{background:var(--tuile);border-radius:12px;padding:12px 14px}
#mkt-root .kpi .l{font-size:10.5px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-3)}
#mkt-root .kpi .v{font-size:26px;font-weight:800;color:var(--bleu-f);font-variant-numeric:tabular-nums;margin-top:2px}
#mkt-root .kpi .s{font-size:12px;color:var(--ink-3)}
#mkt-root .brief{font-size:15px;color:var(--ink);line-height:1.6}
#mkt-root .brief b{color:var(--bleu-f)}
#mkt-root .voies{display:grid;grid-template-columns:repeat(3,1fr);gap:12px}
#mkt-root .voie>.titre{font-size:11px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;margin:0 0 8px;padding-left:2px}
#mkt-root .voie.acq>.titre{color:var(--bleu)} #mkt-root .voie.pos>.titre{color:#2f9a85} #mkt-root .voie.ren>.titre{color:var(--or-f)}
#mkt-root .mom{border:1px solid var(--line);border-left:4px solid var(--bleu);border-radius:11px;padding:10px 12px;margin-bottom:8px;background:#fff}
#mkt-root .voie.pos .mom{border-left-color:var(--vert)} #mkt-root .voie.ren .mom{border-left-color:var(--or)}
#mkt-root .mom .nm{font-weight:800;color:var(--bleu-f);display:flex;justify-content:space-between;gap:8px}
#mkt-root .mom .chiffres{display:flex;flex-wrap:wrap;gap:4px 14px;font-size:12.5px;margin-top:3px}
#mkt-root .mom .chiffres b{color:var(--bleu-f);font-variant-numeric:tabular-nums}
#mkt-root .mom .desc{font-size:12px;color:var(--ink-3);margin-top:3px}
#mkt-root .lien{background:none;border:0;padding:0;font:inherit;font-size:12.5px;font-weight:700;color:var(--bleu);cursor:pointer;text-decoration:underline;text-underline-offset:2px}
#mkt-root .props{display:grid;grid-template-columns:repeat(auto-fill,minmax(270px,1fr));gap:10px}
#mkt-root .prop{border:1px solid var(--line);border-radius:12px;padding:12px 14px;background:linear-gradient(180deg,#fff,var(--tuile));display:flex;flex-direction:column;gap:6px}
#mkt-root .prop .t{font-weight:800;color:var(--bleu-f)}
#mkt-root .prop .pq{font-size:12.5px;color:var(--ink-2)}
#mkt-root .prop .m{display:flex;gap:14px;font-size:12.5px;margin-top:auto}
#mkt-root .prop .m b{color:var(--bleu-f)}
#mkt-root .tag{display:inline-block;font-size:11px;font-weight:700;border-radius:20px;padding:2px 9px;background:var(--bleu-c);color:var(--bleu)}
#mkt-root .tag.vert{background:var(--vert-c);color:#2f9a85} #mkt-root .tag.or{background:var(--or-c);color:var(--or-f)}
#mkt-root .btn{border:1px solid var(--bleu);background:var(--bleu);color:#fff;font:inherit;font-weight:700;font-size:13px;border-radius:9px;padding:8px 14px;cursor:pointer}
#mkt-root .btn.sec{background:#fff;color:var(--bleu)}
#mkt-root .btn.vert{background:var(--vert);border-color:var(--vert)}
#mkt-root .btn[disabled]{opacity:.45;cursor:default}
#mkt-root .tbl{width:100%;border-collapse:collapse;font-size:13px}
#mkt-root .tbl th{text-align:left;font-size:10.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-3);font-weight:800;padding:6px 8px;border-bottom:1px solid var(--line);white-space:nowrap}
#mkt-root .tbl td{padding:7px 8px;border-bottom:1px solid var(--line);vertical-align:top}
#mkt-root .tbl td.n{text-align:right;font-variant-numeric:tabular-nums;white-space:nowrap}
#mkt-root .tbl th.n{text-align:right}
#mkt-root .defil{overflow-x:auto;-webkit-overflow-scrolling:touch}
#mkt-root .barre{height:8px;border-radius:4px;background:var(--line);overflow:hidden;min-width:60px}
#mkt-root .barre i{display:block;height:100%;background:var(--bleu);border-radius:4px}
#mkt-root .deciles{display:flex;align-items:flex-end;gap:6px;height:130px;padding-top:6px}
#mkt-root .deciles .c{flex:1;display:flex;flex-direction:column;align-items:center;gap:4px;height:100%;justify-content:flex-end}
#mkt-root .deciles .c i{display:block;width:100%;background:var(--bleu);border-radius:5px 5px 0 0;min-height:2px}
#mkt-root .deciles .c:nth-child(n+4) i{background:#a9c3e6}
#mkt-root .deciles .c span{font-size:11px;color:var(--ink-3)} #mkt-root .deciles .c b{font-size:11px;color:var(--bleu-f)}
#mkt-root .compo{display:grid;grid-template-columns:minmax(0,1.05fr) minmax(0,1fr);gap:14px;align-items:start}
#mkt-root .onglets .ct{display:none}
#mkt-root .charte-resume{display:flex;gap:8px;align-items:flex-start;font-size:12.5px;color:var(--ink-2);background:var(--tuile);border:1px solid var(--line);border-radius:11px;padding:9px 11px;margin:0 0 12px}
#mkt-root .charte-resume b{color:var(--bleu-f)} #mkt-root .charte-resume svg{flex:none;margin-top:1px}
#mkt-root .pile{display:flex;height:16px;border-radius:8px;overflow:hidden;background:var(--line)}
#mkt-root .pile i,#mkt-root .pile-v i,#mkt-root .legende i{display:block}
#mkt-root .n1{background:#a9c3e6} #mkt-root .n2{background:var(--bleu)} #mkt-root .n3{background:var(--or)} #mkt-root .n4{background:var(--or-f)}
#mkt-root .legende{display:flex;flex-wrap:wrap;gap:6px 16px;margin-top:8px;font-size:12px;color:var(--ink-2)}
#mkt-root .legende span{display:inline-flex;align-items:center;gap:6px} #mkt-root .legende b{color:var(--bleu-f)}
#mkt-root .legende i{width:10px;height:10px;border-radius:3px}
#mkt-root .semaines{display:flex;align-items:flex-end;gap:8px;height:150px;padding-top:4px}
#mkt-root .semaines .c{flex:1;display:flex;flex-direction:column;align-items:center;justify-content:flex-end;gap:4px;height:100%;min-width:0}
#mkt-root .semaines .c b{font-size:11px;color:var(--bleu-f)} #mkt-root .semaines .c span{font-size:10.5px;color:var(--ink-3);white-space:nowrap}
#mkt-root .pile-v{width:100%;max-width:46px;display:flex;flex-direction:column-reverse;border-radius:5px 5px 0 0;overflow:hidden;min-height:2px}
#mkt-root .charte-grille{display:grid;grid-template-columns:repeat(auto-fill,minmax(210px,1fr));gap:10px}
#mkt-root .charte-grille label{display:flex;flex-direction:column;gap:4px;background:var(--tuile);border:1px solid var(--line);border-radius:10px;padding:9px 11px}
#mkt-root .charte-grille label span{font-size:12.5px;font-weight:800;color:var(--bleu-f)}
#mkt-root .charte-grille label em{font-style:normal;font-size:11px;color:var(--ink-3)}
#mkt-root .charte-grille input{width:100px}
#mkt-root .seg.bascule{display:flex;margin-bottom:14px} #mkt-root .seg.bascule button{flex:1}
#mkt-root .op-bloc{background:var(--tuile);border:1px solid var(--line);border-radius:12px;padding:12px 12px 2px;margin:2px 0 14px}
#mkt-root .op-bloc select,#mkt-root .op-bloc input[type=text]{width:100%}
#mkt-root .op-grille{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:8px}
#mkt-root .op-grille label{display:flex;flex-direction:column;gap:4px;font-size:11.5px;font-weight:700;color:var(--ink-2)}
#mkt-root .op-grille label em{font-style:normal;font-weight:400;font-size:10.5px;color:var(--ink-3)}
#mkt-root .op-grille input{width:100%}
#mkt-root .op-cap{margin-top:8px;font-size:13px;color:var(--ink-2)} #mkt-root .op-cap b{color:var(--bleu-f)}
#mkt-root input[type=date]{font:inherit;font-size:13.5px;color:var(--ink);border:1px solid #d6e2f2;border-radius:9px;padding:6px 9px;background:#fff}
#mkt-root .op-dim{border:1px solid var(--line);border-radius:12px;padding:12px;margin:10px 0;background:linear-gradient(135deg,#fff,var(--tuile))}
#mkt-root .op-dim>.l{display:flex;align-items:center;gap:6px;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--bleu-f)}
#mkt-root .op-chiffres{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:8px;margin:8px 0}
#mkt-root .op-chiffres b{display:block;font-size:22px;font-weight:800;color:var(--bleu-f);font-variant-numeric:tabular-nums}
#mkt-root .op-chiffres span{font-size:11.5px;color:var(--ink-3)}
#mkt-root .aud-flottant{display:none}
#mkt-root .champ{margin-bottom:12px}
#mkt-root .champ>.l{font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-3);margin-bottom:5px}
#mkt-root .puces{display:flex;flex-wrap:wrap;gap:6px}
#mkt-root .puce{border:1px solid var(--line);background:#fff;color:var(--ink-2);border-radius:20px;padding:5px 11px;font:inherit;font-size:12.5px;font-weight:600;cursor:pointer}
#mkt-root .puce.on{background:var(--bleu);border-color:var(--bleu);color:#fff}
#mkt-root input[type=text],#mkt-root input[type=number],#mkt-root select{font:inherit;font-size:13.5px;color:var(--ink);border:1px solid #d6e2f2;border-radius:9px;padding:7px 10px;background:#fff;max-width:100%}
#mkt-root input[type=text]{width:100%}
#mkt-root input[type=number]{width:90px}
#mkt-root .ligne{display:flex;flex-wrap:wrap;gap:8px;align-items:center}
#mkt-root .collant{position:sticky;top:10px}
#mkt-root .cascade .e{display:grid;grid-template-columns:minmax(0,1fr) 90px;gap:4px 10px;align-items:center;margin-bottom:7px}
#mkt-root .cascade .e .lb{font-size:12.5px}
#mkt-root .cascade .e .nb{text-align:right;font-weight:800;color:var(--bleu-f);font-variant-numeric:tabular-nums}
#mkt-root .cascade .e .barre{grid-column:1/3;height:10px}
#mkt-root .cascade .e:last-child .barre i{background:var(--vert)}
#mkt-root .resume{background:var(--vert-c);border-radius:11px;padding:10px 12px;color:#2a6f62;font-size:13.5px;margin:10px 0}
#mkt-root .resume b{color:#1f5a4f}
#mkt-root .alerte{background:var(--or-c);border-radius:11px;padding:10px 12px;color:#8a5a06;font-size:13px;margin:10px 0}
#mkt-root .info{background:var(--bleu-c);border-radius:11px;padding:10px 12px;color:var(--bleu-f);font-size:13px;margin:10px 0}
#mkt-root .vide{padding:30px;text-align:center;color:var(--ink-3)}
#mkt-root .charge{color:var(--ink-3);font-size:12px}
#mkt-root .fact{font-size:11.5px;color:var(--ink-3)}
#mkt-root .tuiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:10px}
#mkt-root .tuile{background:var(--tuile);border-radius:12px;padding:12px 14px}
#mkt-root .tuile .v{font-size:24px;font-weight:800;color:var(--bleu-f)}
#mkt-root .tuile p{margin:4px 0 0;font-size:12.5px}
#mkt-root .gros{font-size:20px;font-weight:800;color:var(--bleu-f)}
@media (max-width:980px){#mkt-root .voies{grid-template-columns:1fr} #mkt-root .compo{grid-template-columns:minmax(0,1fr)} #mkt-root .collant{position:static}
 #mkt-root .aud-flottant{display:flex;align-items:center;gap:8px;position:fixed;left:12px;right:12px;bottom:max(12px,env(safe-area-inset-bottom));z-index:60;border:0;border-radius:14px;padding:11px 14px;
  background:var(--bleu-f);color:#fff;font:inherit;font-size:14px;text-align:left;box-shadow:0 8px 24px rgba(31,74,133,.28);cursor:pointer;transition:opacity .2s,transform .2s}
 #mkt-root .aud-flottant span{flex:1;min-width:0} #mkt-root .aud-flottant b{color:#fff}
 #mkt-root .aud-flottant .vers{flex:none;font-weight:800;color:#bfe9df}
 #mkt-root .aud-flottant.charge{opacity:.85} #mkt-root .aud-flottant.cache{opacity:0;transform:translateY(20px);pointer-events:none}
 #mkt-root .aud-flottant svg circle[stroke="#32AFA4"]{stroke:#53bda7}
 #mkt-root .compo>.card:first-child{padding-bottom:70px}}
@media (max-width:640px){
 #mkt-root .defil{overflow:visible}
 #mkt-root .tbl,#mkt-root .tbl tbody{display:block;width:100%}
 #mkt-root .tbl thead{display:none}
 #mkt-root .tbl tr{display:block;border:1px solid var(--line);border-radius:11px;padding:8px 11px;margin-bottom:8px;background:#fff}
 #mkt-root .tbl tr.sousl{background:var(--tuile);margin-left:12px}
 #mkt-root .tbl td{display:flex;align-items:center;justify-content:flex-end;gap:10px;border:0;padding:4px 0;text-align:right;white-space:normal}
 #mkt-root .tbl td.n{white-space:normal}
 #mkt-root .tbl td::before{content:attr(data-l);flex:none;margin-right:auto;max-width:48%;text-align:left;font-size:10.5px;font-weight:800;letter-spacing:.05em;text-transform:uppercase;color:var(--ink-3)}
 #mkt-root .tbl td[data-l=""]::before{display:none}
 #mkt-root .tbl td:first-child{display:block;text-align:left;padding:2px 0 7px;margin-bottom:3px;border-bottom:1px solid var(--line);font-size:14px}
 #mkt-root .tbl td:first-child::before{display:none}
 #mkt-root .tbl td:empty{display:none}
 #mkt-root .tbl td .barre{flex:1;max-width:45%}
 #mkt-root .tbl td .fact{flex:none}
 #mkt-root .tbl tr.sousl td:first-child{font-size:13px}
}
@media (max-width:560px){
 #mkt-root{padding:12px 10px 50px} #mkt-root h1{font-size:20px}
 #mkt-root .kpi .v{font-size:22px} #mkt-root .card{padding:13px;border-radius:12px}
 #mkt-root .bande{grid-template-columns:repeat(2,minmax(0,1fr));gap:8px} #mkt-root .kpi{padding:10px 11px} #mkt-root .kpi .l{font-size:9.5px}
 #mkt-root .tete{flex-wrap:nowrap;align-items:flex-start} #mkt-root .tete .btn{padding:7px 10px;font-size:12px;flex:none}
 #mkt-root .prisme-bandeau{display:flex;flex-wrap:wrap;border-radius:12px;font-size:11.5px;row-gap:2px}
 #mkt-root .prisme-bandeau .sep{display:none} #mkt-root .prisme-bandeau>span{white-space:nowrap}
 #mkt-root .perim .seg{display:flex;flex:1 1 100%} #mkt-root .perim .seg button{flex:1;padding:8px 4px}
 #mkt-root .perim select{flex:1 1 100%;min-width:0;width:100%} #mkt-root .perl{display:none}
 #mkt-root .onglets{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:2px;padding:3px}
 #mkt-root .semaines{gap:4px} #mkt-root .semaines .c span{font-size:9px}
 #mkt-root .charte-grille{grid-template-columns:minmax(0,1fr)}
 #mkt-root .onglets button{padding:8px 1px;font-size:11.5px;display:flex;align-items:center;justify-content:center;gap:3px}
 #mkt-root .onglets button svg{width:18px;height:14px}
 #mkt-root .onglets .lg{display:none} #mkt-root .onglets .ct{display:inline}
 #mkt-root .prisme-onglet{display:grid;grid-template-columns:auto minmax(0,1fr);align-items:start;font-size:12px}
 #mkt-root .prisme-onglet svg{margin-top:1px}
 #mkt-root .brief{font-size:14px}
 #mkt-root .props{grid-template-columns:minmax(0,1fr)}
 #mkt-root .tuiles{grid-template-columns:minmax(0,1fr)}
 #mkt-root .prisme-lettres{grid-template-columns:repeat(2,minmax(0,1fr))}
 #mkt-root .prisme-lettres em{display:none}
 #mkt-root .deciles{height:110px;gap:4px} #mkt-root .deciles .c b{font-size:10px}
 #mkt-root input[type=text],#mkt-root input[type=number],#mkt-root input[type=date],#mkt-root select{font-size:16px}
 #mkt-root .op-grille{grid-template-columns:repeat(2,minmax(0,1fr))}
 #mkt-root .op-chiffres b{font-size:19px}
 #mkt-root .seg.bascule button{font-size:12.5px;padding:8px 6px}
 #mkt-root input[type=number]{width:76px}
 #mkt-root .ligne{gap:6px}
 #mkt-root .ligne .btn{flex:1 1 auto}
 #mkt-root .puce{padding:6px 11px;font-size:13px}
}
@media (max-width:560px){#mkt-root{padding:12px 10px 50px} #mkt-root .kpi .v{font-size:22px} #mkt-root .card{padding:13px}}
`;
    const style = document.createElement('style'); style.textContent = CSS; R.appendChild(style);
    const corps = document.createElement('div'); R.appendChild(corps);

    // ------------------------------------------------------------- garde d'accès
    // v2 : la base tranche (RPC mkt_acces). Pilote : utilisateurs listés dans
    // od_predict.mkt_acces ; table vide = rôles 1, 2, 5, 6, 7, 8. Repli sur le
    // rôle si la fonction n'existe pas encore.
    let acces = null;
    try { acces = (await rpc('mkt_acces')) === true; } catch (e) { acces = ROLES_OK.indexOf(role()) !== -1; }
    if (!acces) {
      corps.innerHTML = '<div class="card vide">Cette page est réservée à la direction marketing et à la direction.</div>';
      return;
    }

    // ------------------------------------------------------------- chargements
    let synthSeq = 0;
    async function chargerSynthese() {
      const seq = ++synthSeq; S.chargement = true; S.err = null; rendre();
      let d = null, err = null;
      try { d = await rpc('mkt_synthese', { p_site_ids: sites(), p_viewer_id_user: viewer() }); }
      catch (e) { err = e.message || String(e); console.error('[cockpit-mkt]', e); }
      if (seq !== synthSeq) return;
      if (d) S.synth = d; S.err = err;
      S.chargement = false; rendre();
    }
    async function chargerPerimetre() {
      try { S.perim = await rpc('mkt_perimetre', { p_viewer_id_user: viewer() }) || []; }
      catch (e) { S.perim = []; console.error('[cockpit-mkt] périmètre', e); }
      // un choix mémorisé qui ne correspond plus à rien repasse au groupe
      if (S.per.niveau !== 'groupe' && !sitesDe(S.per.niveau, S.per.valeur).length) S.per = { niveau: 'groupe', valeur: null };
    }
    let minuteur = null;
    function planifierAudience() {
      clearTimeout(minuteur);
      minuteur = setTimeout(chargerAudience, 400);
    }
    function critPourBase() {
      const c = S.crit, o = {};
      ['segments', 'etats', 'archetypes', 'etapes', 'marques', 'financements'].forEach(k => { if (c[k].length) o[k] = c[k]; });
      if (c.decile_max) o.decile_max = c.decile_max;
      if (c.age_min_mois != null && c.age_min_mois !== '') o.age_min_mois = Number(c.age_min_mois);
      if (c.age_max_mois != null && c.age_max_mois !== '') o.age_max_mois = Number(c.age_max_mois);
      o.canal = c.canal; o.exclure_cycle_ouvert = !!c.exclure_cycle_ouvert;
      if (c.oublies) o.oublies = true; o.temoin_pct = Number(c.temoin_pct);
      if (S.op.actif) { o.canal = 'telephone'; o.capacite_clients = capacite(); }
      return o;
    }
    async function chargerAudience() {
      const seq = ++S.audSeq; S.audCharge = true; S.audErr = null; rendreAudience();
      try {
        const d = await rpc('mkt_audience', { p_criteres: critPourBase(), p_site_ids: sites(), p_viewer_id_user: viewer() });
        if (seq !== S.audSeq) return;
        S.audience = d;
      } catch (e) { if (seq !== S.audSeq) return; S.audErr = e.message || String(e); }
      S.audCharge = false; rendreAudience();
    }
    let campSeq = 0;
    async function chargerCampagnes() {
      const seq = ++campSeq; S.campCharge = true; S.campErr = null;
      let res = [], err = null;
      try { res = await rpc('mkt_campagnes', { p_site_ids: sites(), p_viewer_id_user: viewer() }) || []; }
      catch (e) { err = e.message || String(e); }
      if (seq !== campSeq) return;
      S.campagnes = res; S.campErr = err; S.campCharge = false;
      rendre();
    }

    // ------------------------------------------------------------- propositions du moteur
    function propositions() {
      const s = S.synth; if (!s || !s.etats) return [];
      const parEtat = {}; s.etats.forEach(e => { parEtat[e.etat] = e; });
      const recettes = [
        { etat: 'PROSPECT_CHAUD', t: 'Rappeler les prospects chauds', pq: 'Leur intention est fraîche : un appel dans la semaine transforme le mieux.', canal: 'telephone', crit: { etats: ['PROSPECT_CHAUD'] } },
        { etat: 'FENETRE_RENOUVELLEMENT', t: 'Proposer une reprise', pq: 'Véhicule à l\'âge ou au terme de financement où l\'on change. Offre de reprise et essai.', canal: 'telephone', crit: { etats: ['FENETRE_RENOUVELLEMENT'] } },
        { etat: 'PROPRIETAIRE_SANS_ATELIER', t: 'Inviter à l\'atelier', pq: 'Achetés chez nous, jamais revus : premier entretien, puis l\'occasion d\'en parler.', canal: 'sms', crit: { etats: ['PROPRIETAIRE_SANS_ATELIER'] } },
        { etat: 'PROJET_PERDU', t: 'Seconde chance sur les projets perdus', pq: 'Projet clos sans commande : nouvelle offre ou véhicule d\'occasion équivalent.', canal: 'telephone', crit: { etats: ['PROJET_PERDU'] } },
        { etat: 'SILENCE_ALERTE', t: 'Réveiller les silences en alerte', pq: 'En retard sur leur rythme habituel : un rappel d\'entretien avant qu\'ils ne partent.', canal: 'sms', crit: { etats: ['SILENCE_ALERTE'], etapes: ['ATELIER'] } },
        { etat: 'NOUVEAU_PROPRIETAIRE', t: 'Accueillir les nouveaux propriétaires', pq: 'Moins d\'un an de possession : bienvenue, premier entretien, parrainage.', canal: 'email', crit: { etats: ['NOUVEAU_PROPRIETAIRE'] } },
        { etat: 'PROJET_EN_COURS', t: 'Relancer les projets en cours les plus mûrs', pq: 'Les 3 premiers déciles des projets ouverts, hors clients déjà suivis.', canal: 'telephone', crit: { etats: ['PROJET_EN_COURS'], decile_max: 3 } }
      ];
      return recettes.filter(r => parEtat[r.etat] && Number(parEtat[r.etat].n) > 0).map(r => {
        const e = parEtat[r.etat];
        return Object.assign({}, r, { n: Number(e.n), attendus: Number(e.attendus), p: Number(e.p_achat) });
      }).sort((a, b) => b.attendus - a.attendus);
    }
    function versComposer(crit, nom) {
      S.crit = Object.assign(critDefaut(), crit || {});
      S.nom = nom || ''; S.confirm = null; S.message = null;
      S.onglet = 'composer'; rendre(); chargerAudience();
      try { R.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) { }
    }

    // ------------------------------------------------------------- rendu
    function rendre() {
      const s = S.synth;
      let h = '<div class="tete"><div><h1>Cockpit marketing</h1><div class="sous">' + esc(libPerimetre()) +
        (s && s.date_ref ? ' · scores du ' + esc(dfr(s.date_ref)) : '') + '</div></div>' +
        '<button class="btn sec" data-act="recharger">Actualiser</button></div>';
      h += bandeauPrisme();
      h += selecteurPerimetre();
      h += '<div class="onglets">' + [['moments', 'Moments'], ['composer', '<span class="lg">Composer une campagne</span><span class="ct">Composer</span>'], ['campagnes', 'Campagnes'], ['pression', 'Pression'], ['moteur', 'PRISME']]
        .map(o => '<button data-onglet="' + o[0] + '" class="' + (S.onglet === o[0] ? 'on' : '') + '">' + (o[0] === 'moteur' ? LOGO + ' ' : '') + o[1] + '</button>').join('') + '</div>';
      if (s) h += '<div class="prisme-onglet">' + LOGO + '<span><b>PRISME</b> ' + esc(SOUS_ONGLET[S.onglet] || '') + ' <span class="fact">· lecture du ' + esc(dfr(s.date_ref)) + '</span></span></div>';
      if (S.err) h += '<div class="alerte">Le cockpit n\'a pas pu charger les scores : ' + esc(S.err) + '</div>';
      if (S.chargement && !s) h += '<div class="card vide">Chargement des parcours clients…</div>';
      else if (s) {
        if (S.onglet === 'moments') h += vueMoments();
        else if (S.onglet === 'composer') h += vueComposer();
        else if (S.onglet === 'campagnes') h += vueCampagnes();
        else if (S.onglet === 'pression') h += vuePression();
        else h += vueMoteur();
      }
      corps.innerHTML = h;
      etiqueter(corps);
      suivreAudience();
      if (S.onglet === 'composer') rendreAudience();
    }

    // ------------------------------------------------------------- marque PRISME by One Data
    const NOMS_CLIENTS = { teamcolin: 'Team Colin' };
    const NOM_CLIENT = (function () {
      const t = ctx.tenant; const k = String((t && (t.slug || t.code || t.tenant || t.id)) || t || '').toLowerCase();
      return (t && (t.nom || t.label || t.name)) || NOMS_CLIENTS[k] || 'votre groupe';
    })();
    // Logo PRISME : le « O » de One Data (anneau sarcelle, quart orange, comme le favicon)
    // reçoit un rayon de lumière et le décompose en trois faisceaux aux couleurs de la charte.
    function prismeSvg(t) {
      const l = Math.round(t * 1.3);
      return '<svg width="' + l + '" height="' + t + '" viewBox="0 0 42 32" aria-hidden="true" style="flex:none;vertical-align:middle">' +
        '<path d="M1 16 L7.5 16" stroke="#7a9cc4" stroke-width="2" stroke-linecap="round"/>' +
        '<circle cx="16" cy="16" r="7.5" fill="none" stroke="#32AFA4" stroke-width="4.4"/>' +
        '<circle cx="16" cy="16" r="7.5" fill="none" stroke="#F8BA36" stroke-width="4.4" stroke-dasharray="11.78 35.34"/>' +
        '<path d="M25.5 13.2 L41 7" stroke="#2a5ea9" stroke-width="2" stroke-linecap="round"/>' +
        '<path d="M26 16 L41 16" stroke="#53bda7" stroke-width="2" stroke-linecap="round"/>' +
        '<path d="M25.5 18.8 L41 25" stroke="#fac055" stroke-width="2" stroke-linecap="round"/></svg>';
    }
    // Titre d'un bloc produit par PRISME : le logo remplace la barre bleue
    const h2p = (t, style) => '<h2 class="p"' + (style ? ' style="' + style + '"' : '') + '>' + LOGO + '<span>' + t + '</span></h2>';
    const LOGO = prismeSvg(20), LOGO_GRAND = prismeSvg(44);
    const SOUS_ONGLET = {
      moments: 'lit le parcours de chaque client et ce qu\'il va probablement faire',
      composer: 'calcule l\'audience et classe chaque client par probabilité d\'achat',
      campagnes: 'mesure ce que chaque campagne a vraiment rapporté, contre son groupe témoin',
      pression: 'mesure la pression commerciale sur chaque client et applique la charte du groupe',
      moteur: 'montre sa fiabilité, testée sur des clients qu\'il n\'avait jamais vus'
    };
    function bandeauPrisme() {
      return '<div class="prisme-bandeau">' + LOGO + '<span>Données <b>' + esc(NOM_CLIENT) + '</b></span><span class="sep">·</span><span>Intelligence <b>PRISME</b> by One Data</span></div>';
    }

    const TITRE_NIV = { marque: 'Par marque', affaire: 'Par affaire', site: 'Par concession' };
    function selecteurPerimetre() {
      const p = S.per;
      let h = '<div class="perim"><span class="perl">Périmètre</span><div class="seg">' + NIVEAUX.map(n => '<button data-niveau="' + n[0] + '" class="' + (p.niveau === n[0] ? 'on' : '') + '">' + n[1] + '</button>').join('') + '</div>';
      if (p.niveau !== 'groupe') {
        const opts = {};
        (S.perim || []).forEach(s => { const k = cleNiveau(s, p.niveau); if (!opts[k]) opts[k] = { k: k, l: libNiveau(s, p.niveau), n: 0 }; opts[k].n += Number(s.n) || 0; });
        h += '<select data-champ="perval">' + Object.values(opts).sort((a, b) => a.l.localeCompare(b.l, 'fr')).map(o => '<option value="' + esc(o.k) + '"' + (String(p.valeur) === o.k ? ' selected' : '') + '>' + esc(o.l) + ' · ' + n0(o.n) + ' clients</option>').join('') + '</select>';
      }
      if (S.chargement) h += '<span class="charge">mise à jour…</span>';
      return h + '</div>';
    }
    function vueComparatif() {
      const sous = SOUS_NIVEAU[S.per.niveau]; if (!sous || !S.perim) return '';
      const l = regrouper(sitesDe(S.per.niveau, S.per.valeur).map(s => ({ id_site: s.id_site, n: s.n, attendus: s.attendus })), sous, ['n', 'attendus'])
        .sort((a, b) => b.attendus - a.attendus);
      if (l.length < 2) return '';
      const tot = l.reduce((a, x) => a + x.attendus, 0) || 1;
      return '<div class="card">' + h2p(TITRE_NIV[sous]) + '<div class="sous" style="margin:-4px 0 10px">Cliquez une ligne pour y restreindre le cockpit.</div><div class="defil"><table class="tbl"><thead><tr><th></th><th class="n">Clients</th><th class="n">Achats attendus</th><th class="n">Taux</th><th>Part des achats attendus</th></tr></thead><tbody>' +
        l.map(x => '<tr><td><button class="lien" data-act="drill" data-niv="' + sous + '" data-k="' + esc(x.cle) + '">' + esc(x.lib) + '</button></td><td class="n">' + n0(x.n) + '</td><td class="n">' + n0(x.attendus) + '</td><td class="n">' + pct(x.n ? x.attendus / x.n : 0) +
          '</td><td><div class="barre"><i style="width:' + (x.attendus / tot * 100) + '%"></i></div><div class="fact">' + pct(x.attendus / tot, 0) + '</div></td></tr>').join('') +
        '</tbody></table></div></div>';
    }

    function vueMoments() {
      const s = S.synth, etats = s.etats || [];
      const tot = Number(s.achats_attendus) || 0;
      const get = k => etats.find(e => e.etat === k) || {};
      const chauds = (Number(get('PROSPECT_CHAUD').attendus) || 0) + (Number(get('PROJET_EN_COURS').attendus) || 0);
      const fen = get('FENETRE_RENOUVELLEMENT'), sil = get('SILENCE_ALERTE'), psa = get('PROPRIETAIRE_SANS_ATELIER');
      let h = '<div class="bande">' +
        kpi('Clients suivis', n0(s.clients), 'avec un score à jour') +
        kpi('Achats attendus', n0(tot), 'dans les 6 prochains mois') +
        kpi('Retours atelier attendus', n0(s.retours_atelier_attendus), 'dans les 6 prochains mois') +
        kpi('Concessions', n0((sites() || (S.perim || [])).length), 'dans le périmètre') + '</div>';
      h += vueComparatif();
      h += '<div class="card">' + h2p('Le brief du jour') + '<div class="brief">' +
        'PRISME attend <b>' + n0(tot) + ' achats</b> sur ' + n0(s.clients) + ' clients. ' +
        (tot ? '<b>' + pct(chauds / tot, 0) + '</b> viennent des projets en cours et des prospects chauds : c\'est le travail des vendeurs, à protéger d\'une sollicitation de trop. ' : '') +
        (fen.n ? '<b>' + n0(fen.n) + '</b> clients sont dans leur fenêtre de renouvellement (' + n0(fen.attendus) + ' achats attendus) : un gisement que le marketing peut travailler sans gêner les vendeurs. ' : '') +
        (psa.n ? '<b>' + n0(psa.n) + '</b> propriétaires n\'ont jamais été revus à l\'atelier. ' : '') +
        (sil.n ? '<b>' + n0(sil.n) + '</b> clients décrochent de leur rythme de visite : à réveiller avant qu\'ils ne partent ailleurs.' : '') +
        '</div></div>';

      const props = propositions();
      if (props.length) {
        h += '<div class="card">' + h2p('Campagnes proposées par PRISME') + '<div class="sous" style="margin:-4px 0 10px">Classées par achats attendus. Ouvrez-en une pour l\'ajuster avant de la lancer.</div><div class="props">' +
          props.slice(0, 6).map((p, i) => '<div class="prop"><div class="ligne" style="justify-content:space-between"><span class="t">' + esc(p.t) + '</span><span class="tag">' + esc(CANAUX[p.canal]) + '</span></div>' +
            '<div class="pq">' + esc(p.pq) + '</div><div class="m"><span><b>' + n0(p.n) + '</b> clients</span><span><b>' + n0(p.attendus) + '</b> achats attendus</span><span><b>' + pct(p.p) + '</b></span></div>' +
            '<div class="ligne" style="justify-content:space-between"><button class="btn" data-act="prop" data-i="' + i + '">Préparer la campagne</button><span class="signe">' + LOGO + ' Proposé par PRISME</span></div></div>').join('') + '</div></div>';
      }

      h += '<div class="card">' + h2p('Où en sont les clients') + '<div class="sous" style="margin:-4px 0 12px">Chaque client est placé à un moment de son parcours. Probabilité d\'achat à 6 mois, achats attendus et prochaine étape la plus probable.</div><div class="voies">';
      ['acq', 'pos', 'ren'].forEach(g => {
        h += '<div class="voie ' + g + '"><div class="titre">' + GROUPES[g] + '</div>';
        ORDRE_ETATS.filter(k => ETATS[k].g === g).forEach(k => {
          const e = get(k); if (!e.etat) return;
          h += '<div class="mom"><div class="nm"><span>' + esc(ETATS[k].t) + '</span><span>' + n0(e.n) + '</span></div>' +
            '<div class="chiffres"><span>Achat <b>' + pct(e.p_achat) + '</b></span><span>Attendus <b>' + n0(e.attendus) + '</b></span><span>Atelier <b>' + pct(e.p_atelier, 0) + '</b></span></div>' +
            '<div class="desc">' + esc(ETATS[k].d) + (e.etape ? ' Prochaine étape probable : ' + esc(ETAPES[e.etape] || e.etape).toLowerCase() + '.' : '') + '</div>' +
            '<div style="margin-top:5px"><button class="lien" data-act="etat" data-k="' + k + '">En faire une audience</button></div></div>';
        });
        h += '</div>';
      });
      h += '</div></div>';

      const dec = s.deciles || [], maxD = Math.max.apply(null, dec.map(d => Number(d.attendus) || 0).concat([1]));
      h += '<div class="card">' + h2p('Où se trouvent les achats') + '<div class="sous" style="margin:-4px 0 6px">Achats attendus par décile de score (1 = les 10 % les plus chauds).</div><div class="deciles">' +
        dec.map(d => '<div class="c"><b>' + n0(d.attendus) + '</b><i style="height:' + Math.max(2, Math.round((Number(d.attendus) || 0) / maxD * 100)) + '%"></i><span>' + d.decile + '</span></div>').join('') + '</div>' +
        (dec.length && tot ? '<div class="sous" style="margin-top:8px">Les 3 premiers déciles portent <b>' + pct(dec.filter(d => d.decile <= 3).reduce((a, d) => a + (Number(d.attendus) || 0), 0) / tot, 0) + '</b> des achats attendus.</div>' : '') + '</div>';

      h += '<div class="card">' + h2p('Cohortes de parcours') + '<div class="sous" style="margin:-4px 0 10px">Familles de clients au comportement proche, trouvées par PRISME. Les flèches indiquent ce qui les distingue de la moyenne.</div>';
      ['B2C', 'B2B'].forEach(seg => {
        const l = (s.cohortes || []).filter(c => c.segment === seg).sort((a, b) => (Number(b.attendus) || 0) - (Number(a.attendus) || 0));
        if (!l.length) return;
        h += '<div class="champ"><div class="l">' + SEG[seg] + '</div><div class="defil"><table class="tbl"><thead><tr><th>Cohorte</th><th>Signes distinctifs</th><th class="n">Clients</th><th class="n">Achat</th><th class="n">Attendus</th><th class="n">Atelier</th><th></th></tr></thead><tbody>' +
          l.map(c => '<tr><td><b style="color:var(--bleu-f)">' + esc(c.libelle) + '</b></td><td class="fact">' + esc(traits(c.profil).join(' · ')) + '</td><td class="n">' + n0(c.n) + '</td><td class="n">' + pct(c.p_achat) +
            '</td><td class="n">' + n0(c.attendus) + '</td><td class="n">' + pct(c.p_atelier, 0) + '</td><td><button class="lien" data-act="coh" data-k="' + esc(seg + '-' + c.archetype) + '">Cibler</button></td></tr>').join('') +
          '</tbody></table></div></div>';
      });
      h += '</div>';
      return h;
    }
    function kpi(l, v, s) { return '<div class="kpi"><div class="l">' + esc(l) + '</div><div class="v">' + v + '</div><div class="s">' + esc(s) + '</div></div>'; }

    function puces(cle, options) {
      const sel = S.crit[cle];
      return '<div class="puces">' + options.map(o => '<button class="puce' + (sel.indexOf(o[0]) !== -1 ? ' on' : '') + '" data-puce="' + cle + '" data-v="' + esc(o[0]) + '">' + esc(o[1]) + '</button>').join('') + '</div>';
    }
    function vueComposer() {
      const c = S.crit, s = S.synth;
      const coh = (s.cohortes || []).slice().sort((a, b) => a.segment.localeCompare(b.segment) || a.archetype - b.archetype)
        .filter(x => !c.segments.length || c.segments.indexOf(x.segment) !== -1)
        .map(x => [x.segment + '-' + x.archetype, (x.segment === 'B2B' && x.libelle.indexOf('Pros') !== 0 ? 'Pros · ' : '') + x.libelle]);
      let h = '<div class="compo"><div class="card">';
      const op = S.op;
      h += '<div class="seg bascule"><button data-act="mode-op" data-v="0" class="' + (op.actif ? '' : 'on') + '">Campagne au fil de l\'eau</button>' +
        '<button data-act="mode-op" data-v="1" class="' + (op.actif ? 'on' : '') + '">Opération commerciale</button></div>';
      h += '<h2>' + (op.actif ? 'Opération' : 'Audience') + '</h2>';
      h += '<div class="champ"><div class="l">' + (op.actif ? 'Nom de l\'opération' : 'Nom de la campagne') + '</div><input type="text" data-champ="nom" maxlength="120" placeholder="' +
        (op.actif ? 'Ex. Vente privée Lexus – 6 et 7 décembre' : 'Ex. Reprise fenêtre de renouvellement – décembre') + '" value="' + esc(S.nom) + '"></div>';
      if (op.actif) h += blocOperation();
      h += '<div class="champ"><div class="l">Type de client</div>' + puces('segments', [['B2C', 'Particuliers'], ['B2B', 'Professionnels']]) + '</div>';
      h += '<div class="champ"><div class="l">Moment du parcours</div>' + puces('etats', ORDRE_ETATS.map(k => [k, ETATS[k].t])) + '</div>';
      h += '<div class="champ"><div class="l">Prochaine étape probable</div>' + puces('etapes', ['ACHAT_VN', 'ACHAT_VO', 'PROJET', 'LEAD', 'ATELIER', 'SORTIE'].map(k => [k, ETAPES[k]])) + '</div>';
      h += '<div class="champ"><div class="l">Cohorte</div>' + puces('archetypes', coh) + '</div>';
      h += '<div class="champ"><div class="l">Marque</div>' + puces('marques', [['TOYOTA', 'Toyota'], ['LEXUS', 'Lexus']]) + '</div>';
      h += '<div class="champ"><div class="l">Financement du véhicule</div>' + puces('financements', ['LOA', 'LLD', 'CREDIT', 'COMPTANT', 'AUCUN', 'NON_RENSEIGNE'].map(k => [k, FIN[k]])) + '</div>';
      h += '<div class="champ"><div class="l">Score et véhicule</div><div class="ligne">' +
        '<select data-champ="decile_max"><option value="">Tous les scores</option>' + [1, 2, 3, 5, 7].map(d => '<option value="' + d + '"' + (Number(c.decile_max) === d ? ' selected' : '') + '>Les ' + (d * 10) + ' % les plus chauds</option>').join('') + '</select>' +
        '<span>Âge du véhicule</span><input type="number" min="0" max="400" data-champ="age_min_mois" placeholder="min" value="' + esc(c.age_min_mois == null ? '' : c.age_min_mois) + '">' +
        '<span>à</span><input type="number" min="0" max="400" data-champ="age_max_mois" placeholder="max" value="' + esc(c.age_max_mois == null ? '' : c.age_max_mois) + '"><span>mois</span></div></div>';
      h += '<h2 style="margin-top:16px">Canal et garde-fous</h2>';
      if (op.actif) h += '<div class="champ"><div class="l">Canal</div><div class="puces"><button class="puce on" disabled>Téléphone</button></div>' +
        '<div class="sous" style="margin-top:4px">Une opération se joue au téléphone : seuls les clients qui acceptent d\'être appelés sont retenus.</div></div>';
      else h += '<div class="champ"><div class="l">Canal</div><div class="puces">' + Object.keys(CANAUX).map(k => '<button class="puce' + (c.canal === k ? ' on' : '') + '" data-canal="' + k + '">' + CANAUX[k] + '</button>').join('') + '</div>' +
        '<div class="sous" style="margin-top:4px">Le consentement de chaque client est vérifié pour le canal choisi.</div></div>';
      h += '<div class="champ"><div class="ligne">' +
        '<button class="puce' + (c.exclure_cycle_ouvert ? ' on' : '') + '" data-act="cycle">Écarter les clients déjà suivis par un vendeur</button>' +
        '<button class="puce' + (c.oublies ? ' on' : '') + '" data-act="oublies">Seulement les clients oubliés</button>' +
        '<span>Groupe témoin</span><select data-champ="temoin_pct">' + [0, 5, 10, 20].map(v => '<option value="' + v + '"' + (Number(c.temoin_pct) === v ? ' selected' : '') + '>' + (v ? v + ' %' : 'aucun') + '</option>').join('') + '</select></div>' +
        '<div class="sous" style="margin-top:4px">Le groupe témoin est tiré au hasard et n\'est jamais sollicité : c\'est lui qui prouve ce que la campagne a rapporté.</div></div>';
      h += '<div class="charte-resume">' + LOGO + '<span><b>Charte de pression du groupe</b> : ' + esc(resumeCharte()) + ' <button class="lien" data-onglet="pression">Voir ou modifier</button></span></div>';
      h += '<div class="ligne"><button class="btn sec" data-act="raz">Tout effacer</button></div>';
      h += '</div><div class="collant"><div class="card" id="mkt-aud"></div></div></div>';
      h += '<button class="aud-flottant" id="mkt-flot" data-act="voir-aud"></button>';
      return h;
    }
    function blocOperation() {
      const o = S.op, cap = capacite();
      const num = (k, lib, aide) => '<label>' + lib + '<input type="number" min="0" step="1" data-op="' + k + '" value="' + esc(o[k]) + '">' + (aide ? '<em>' + aide + '</em>' : '') + '</label>';
      return '<div class="op-bloc">' +
        '<div class="champ"><div class="l">Type d\'opération</div><select data-op="type">' + TYPES_OP.map(t => '<option' + (o.type === t ? ' selected' : '') + '>' + esc(t) + '</option>').join('') + '</select></div>' +
        '<div class="champ"><div class="l">Dates des appels</div><div class="ligne"><span>du</span><input type="date" data-op="debut" value="' + esc(o.debut) + '"><span>au</span><input type="date" data-op="fin" value="' + esc(o.fin) + '"></div></div>' +
        '<div class="champ"><div class="l">Qui appelle</div><div class="puces">' +
          '<button class="puce' + (o.executant === 'vendeurs' ? ' on' : '') + '" data-opv="executant" data-v="vendeurs">Les vendeurs</button>' +
          '<button class="puce' + (o.executant === 'prestataire' ? ' on' : '') + '" data-opv="executant" data-v="prestataire">Un prestataire</button></div>' +
          (o.executant === 'vendeurs'
            ? '<div class="puces" style="margin-top:6px"><button class="puce' + (o.mode === 'libre' ? ' on' : '') + '" data-opv="mode" data-v="libre">Libre-service</button>' +
              '<button class="puce' + (o.mode === 'habituel' ? ' on' : '') + '" data-opv="mode" data-v="habituel">Vendeur habituel</button></div>' +
              '<div class="sous" style="margin-top:4px">Chaque client devient une sollicitation numérotée par priorité PRISME : n° 1 à appeler en premier.</div>'
            : '<input type="text" data-op="prestataire" maxlength="80" style="margin-top:6px" placeholder="Nom du prestataire (tracé au registre)" value="' + esc(o.prestataire) + '">' +
              '<div class="sous" style="margin-top:4px">Le prestataire reçoit un fichier d\'appel classé par priorité PRISME, sans le groupe témoin.</div>') + '</div>' +
        '<div class="champ"><div class="l">Capacité d\'appel</div><div class="op-grille">' +
          num('appelants', 'Appelants') + num('heures', 'Heures par appelant', 'sur toute l\'opération') +
          num('appels_heure', 'Appels par heure') + num('tentatives', 'Tentatives par client') + '</div>' +
          '<div class="op-cap" id="mkt-cap">' + capTexte(cap) + '</div></div>' +
        '<div class="champ"><div class="l">Coût de l\'opération (facultatif)</div><div class="ligne"><input type="number" min="0" step="100" data-op="cout" placeholder="€" value="' + esc(o.cout) + '"><span>€ — pour calculer le coût par vente supplémentaire</span></div></div>' +
        '</div>';
    }
    function capTexte(cap) {
      const o = S.op;
      return cap > 0 ? n0((Number(o.appelants) || 0) * (Number(o.heures) || 0) * (Number(o.appels_heure) || 0)) + ' appels ÷ ' + n0(Math.max(1, Number(o.tentatives) || 1)) + ' tentatives = <b>' + n0(cap) + ' clients</b> à appeler'
        : 'Renseignez les appelants, les heures et le rythme d\'appel.';
    }
    function manqueOperation(a) {
      const o = S.op, m = [];
      if (!S.nom.trim()) m.push('le nom');
      if (!o.debut) m.push('la date de début');
      if (o.fin && o.debut && o.fin < o.debut) m.push('une date de fin après le début');
      if (capacite() <= 0) m.push('la capacité d\'appel');
      if (o.executant === 'prestataire' && !o.prestataire.trim()) m.push('le nom du prestataire');
      if (a && a.operation && !(Number(a.operation.a_appeler) > 0)) m.push('des clients dans l\'audience');
      return m;
    }

    // Sur mobile, chaque ligne de tableau devient une fiche : chaque cellule reçoit
    // le libellé de sa colonne (data-l), affiché par le CSS à la place de l'en-tête.
    function etiqueter(racine) {
      racine.querySelectorAll('table.tbl').forEach(t => {
        const th = Array.from(t.querySelectorAll('thead th')).map(x => x.textContent.trim());
        t.querySelectorAll('tbody tr').forEach(tr => Array.from(tr.children).forEach((td, i) => td.setAttribute('data-l', th[i] || '')));
      });
    }
    // Barre flottante de Composer (mobile) : le résultat de l'audience reste visible
    // pendant qu'on coche les critères ; elle s'efface quand le bloc d'audience est à l'écran.
    let obsAud = null;
    function majFlottant() {
      const f = corps.querySelector('#mkt-flot'); if (!f) return;
      const a = S.audience, cas = (a && a.cascade) || [], fin = Number((cas[cas.length - 1] || {}).n) || 0;
      const o = a && S.op.actif ? a.operation : null;
      f.innerHTML = LOGO + '<span>' + (!a ? 'Calcul de l\'audience…' : o ? '<b>' + n0(o.a_appeler) + ' à appeler</b> · ' + n0(o.attendus) + ' achats attendus'
        : '<b>' + n0(fin) + ' clients</b> · ' + n0(a.achats_attendus) + ' achats attendus') + '</span><span class="vers">Voir ↓</span>';
      f.classList.toggle('charge', !!S.audCharge);
    }
    function suivreAudience() {
      try { if (obsAud) obsAud.disconnect(); } catch (e) { }
      const box = corps.querySelector('#mkt-aud'), f = corps.querySelector('#mkt-flot');
      if (!box || !f || typeof IntersectionObserver === 'undefined') return;
      obsAud = new IntersectionObserver(e => { f.classList.toggle('cache', e[0].isIntersecting); }, { threshold: 0.05 });
      obsAud.observe(box);
    }

    function rendreAudience() {
      const box = corps.querySelector('#mkt-aud'); if (!box) return;
      const a = S.audience, c = S.crit;
      let h = '' + h2p('Audience en direct') + '';
      if (S.audErr) h += '<div class="alerte">' + esc(S.audErr) + '</div>';
      if (!a) { box.innerHTML = h + '<div class="charge">Calcul de l\'audience…</div>'; return; }
      const cas = a.cascade || [], max = Math.max(1, Number((cas[0] || {}).n) || 1);
      const finale = Number((cas[cas.length - 1] || {}).n) || 0;
      const temoins = cas.length >= 2 ? (Number(cas[cas.length - 2].n) || 0) - finale : 0;
      h += '<div class="cascade' + (S.audCharge ? '" style="opacity:.55' : '') + '">' + cas.map(e => '<div class="e"><span class="lb">' + esc(e.etape) + '</span><span class="nb">' + n0(e.n) + '</span><div class="barre"><i style="width:' + Math.max(0.5, (Number(e.n) || 0) / max * 100) + '%"></i></div></div>').join('') + '</div>';
      const opA = S.op.actif ? a.operation : null;
      if (opA) {
        const part = Number(opA.attendus_audience) ? Number(opA.attendus) / Number(opA.attendus_audience) : 0;
        h += '<div class="op-dim"><div class="l">' + LOGO + ' Fichier PRISME de l\'opération</div><div class="op-chiffres">' +
          '<div><b>' + n0(opA.a_appeler) + '</b><span>clients à appeler</span></div>' +
          '<div><b>' + n0(opA.attendus) + '</b><span>achats attendus dans le fichier</span></div>' +
          '<div><b>' + pct(part, 0) + '</b><span>des achats attendus de toute l\'audience</span></div></div>' +
          '<div class="sous">Les ' + n0(opA.a_appeler) + ' clients les mieux classés par PRISME parmi ' + n0(opA.eligibles) + ' éligibles' +
          (opA.score_min != null ? ' (dernier retenu : score ' + pct(opA.score_min) + ')' : '') + '. ' +
          (Number(opA.temoins) ? n0(opA.temoins) + ' clients du fichier sont tirés au hasard et ne seront pas appelés : c\'est le groupe témoin.' : 'Sans groupe témoin, le bilan ne pourra pas isoler l\'effet de l\'opération.') + '</div>' +
          (Number(opA.eligibles) < Number(opA.capacite) ? '<div class="alerte" style="margin-bottom:0">L\'audience (' + n0(opA.eligibles) + ' clients) est plus petite que la capacité (' + n0(opA.capacite) + ') : élargissez les critères ou réduisez les moyens.</div>' : '') + '</div>';
        if (opA.par_site && opA.par_site.length) h += '<div class="sous" style="margin-bottom:10px">' + opA.par_site.slice(0, 8).map(x => esc(x.nom_site) + ' ' + n0(x.n)).join(' · ') + (opA.par_site.length > 8 ? ' · …' : '') + '</div>';
      } else {
        h += '<div class="resume"><b>' + n0(finale) + ' clients</b> à contacter' + (c.canal ? ' par ' + esc(CANAUX[c.canal]).toLowerCase() : '') + ' · <b>' + n0(a.achats_attendus) + '</b> achats attendus sans action' +
          (temoins > 0 ? ' · ' + n0(temoins) + ' gardés en témoin' : '') + '</div>';
        if (a.par_site && a.par_site.length) {
          h += '<div class="sous" style="margin-bottom:10px">' + a.par_site.slice(0, 8).map(x => esc(x.nom_site) + ' ' + n0(x.n)).join(' · ') + (a.par_site.length > 8 ? ' · …' : '') + '</div>';
        }
      }
      // actions
      const okNom = S.nom.trim().length > 0, okNb = finale > 0 && !S.envoi;
      if (S.message) h += '<div class="' + (S.message.ok ? 'resume' : 'alerte') + '">' + S.message.t + '</div>';
      if (S.op.actif) {
        const manque = manqueOperation(a), o = S.op, na = opA ? Number(opA.a_appeler) : 0, nt = opA ? Number(opA.temoins) : 0;
        if (S.confirm === 'operation') {
          h += '<div class="info">' + (o.executant === 'vendeurs'
              ? n0(na) + ' sollicitations « Marketing Affaire » vont être créées sur <b>' + esc(libPerimetre()) + '</b>, ' + (o.mode === 'habituel' ? 'au nom du <b>vendeur habituel</b> de chaque client (libre-service s\'il n\'en a pas)' : 'en <b>libre-service</b>') +
                ', numérotées par priorité PRISME.'
              : 'Le fichier d\'appel de <b>' + n0(na) + ' clients</b>, classés par priorité PRISME, va être téléchargé pour <b>' + esc(o.prestataire) + '</b>. La transmission est tracée au registre.') +
            (nt ? ' ' + n0(nt) + ' clients restent en témoin : ils ne sont ni sollicités ni dans le fichier.' : '') +
            '<div class="ligne" style="margin-top:8px"><button class="btn vert" data-act="confirmer"' + (S.envoi ? ' disabled' : '') + '>' + (S.envoi ? 'Création…' : 'Confirmer') + '</button><button class="btn sec" data-act="annuler">Annuler</button></div></div>';
        } else {
          h += '<div class="ligne" style="margin-bottom:6px"><button class="btn" data-act="lancer" data-mode="operation"' + (manque.length || S.envoi ? ' disabled' : '') + '>Créer l\'opération</button></div>';
          if (manque.length) h += '<div class="sous">Il manque ' + manque.join(', ') + '.</div>';
        }
      } else if (S.confirm) {
        h += '<div class="info">' + n0(finale) + ' sollicitations « Marketing Affaire » vont être créées sur le périmètre <b>' + esc(libPerimetre()) + '</b>, ' +
          (S.confirm === 'libre' ? 'en <b>libre-service</b> : le premier vendeur qui les prend en devient responsable.' : 'au nom du <b>vendeur habituel</b> de chaque client (libre-service s\'il n\'en a pas).') +
          (temoins > 0 ? ' ' + n0(temoins) + ' clients restent en témoin.' : '') + '<div class="ligne" style="margin-top:8px"><button class="btn vert" data-act="confirmer"' + (S.envoi ? ' disabled' : '') + '>' + (S.envoi ? 'Création…' : 'Confirmer') + '</button><button class="btn sec" data-act="annuler">Annuler</button></div></div>';
      } else {
        h += '<div class="ligne" style="margin-bottom:6px"><button class="btn" data-act="lancer" data-mode="libre"' + (okNom && okNb ? '' : ' disabled') + '>Lancer en libre-service</button>' +
          '<button class="btn sec" data-act="lancer" data-mode="habituel"' + (okNom && okNb ? '' : ' disabled') + '>Au vendeur habituel</button></div>';
        if (!okNom) h += '<div class="sous">Donnez un nom à la campagne pour la lancer.</div>';
      }
      if (!S.op.actif) h += '<div class="champ" style="margin-top:12px"><div class="l">Extraction pour un routeur</div><div class="ligne"><input type="text" data-champ="motif" style="flex:1;min-width:180px" placeholder="Motif (obligatoire, tracé au registre)" value="' + esc(S.motif) + '">' +
        '<button class="btn sec" data-act="export"' + (S.motif.trim() && finale > 0 && !S.envoi ? '' : ' disabled') + '>Extraire en CSV</button></div></div>';
      // aperçu
      const ap = a.apercu || [];
      if (ap.length) {
        h += '' + h2p(S.op.actif ? 'Le haut du fichier PRISME' : 'Les plus chauds selon PRISME', 'margin-top:14px') + '<div class="defil"><table class="tbl"><thead><tr><th>Client</th><th>Moment</th><th>Prochaine étape</th><th class="n">Score PRISME</th></tr></thead><tbody>' +
          ap.slice(0, 25).map(x => '<tr><td><button class="lien" data-fiche="' + esc(x.id_client) + '">' + esc(x.nom) + '</button><div class="fact">' + esc([x.ville, x.nom_site].filter(Boolean).join(' · ')) + '</div>' +
            (Array.isArray(x.facteurs) && x.facteurs.length ? '<div class="fact">' + esc(x.facteurs.slice(0, 2).map(f => f.facteur).join(' · ')) + '</div>' : '') + '</td>' +
            '<td>' + esc((ETATS[x.etat] || {}).t || x.etat) + '<div class="fact">' + esc(x.archetype_libelle || '') + '</div></td><td>' + esc(ETAPES[x.etape] || x.etape || '–') + '</td><td class="n">' + pct(x.p_achat) + '</td></tr>').join('') +
          '</tbody></table></div>';
      } else if (!S.audCharge) h += '<div class="vide">Aucun client ne correspond.</div>';
      box.innerHTML = h;
      etiqueter(box);
      majFlottant();
    }

    function ligneResultat(lib, x, extra, sansSol) {
      const cib = Number(x.cibles) || 0, pris = cib ? (Number(x.pris) || 0) / cib : 0, tr = cib ? (Number(x.traites) || 0) / cib : 0;
      const tem = Number(x.temoins) || 0, tc = cib ? (Number(x.commandes) || 0) / cib : null, tt = tem ? (Number(x.commandes_temoin) || 0) / tem : null;
      const dd = (tc != null && tt != null) ? Math.round((tc - tt) * cib) : null;
      const rdv = Number(x.rdv) || 0, rdvt = Number(x.rdv_temoin) || 0;
      return '<tr' + (extra ? ' class="sousl"' : '') + '><td>' + lib + '</td><td class="n">' + n0(cib) + '</td>' +
        (sansSol ? '<td class="fact">appels du prestataire</td><td class="fact">–</td>' :
        '<td><div class="barre"><i style="width:' + (pris * 100) + '%"></i></div><div class="fact">' + pct(pris, 0) + '</div></td>' +
        '<td><div class="barre"><i style="width:' + (tr * 100) + '%;background:var(--vert)"></i></div><div class="fact">' + pct(tr, 0) + '</div></td>') +
        '<td class="n">' + n0(rdv) + '<div class="fact">' + (cib ? pct(rdv / cib) : '–') + (tem ? ' · témoin ' + pct(rdvt / tem) : '') + '</div></td>' +
        '<td class="n">' + n0(x.commandes) + '</td><td class="n">' + pct(tc) + '</td><td class="n">' + pct(tt) + '<div class="fact">' + n0(tem) + ' clients</div></td>' +
        '<td class="n">' + (dd == null ? '–' : (dd > 0 ? '<span class="tag vert">+' + n0(dd) + '</span>' : '<span class="tag or">' + n0(dd) + '</span>')) + '</td></tr>';
    }
    const CHAMPS_RES = ['cibles', 'temoins', 'pris', 'traites', 'commandes', 'commandes_temoin', 'rdv', 'rdv_temoin'];
    const TETE_RES = '<th class="n">Sollicités</th><th>Prises en main</th><th>Traitées</th><th class="n">RDV</th><th class="n">Commandes</th><th class="n">Taux</th><th class="n">Témoin</th><th class="n">Dues</th>';
    function vueCampagnes() {
      if (S.campagnes == null) { if (!S.campCharge) chargerCampagnes(); return '<div class="card vide">Chargement des campagnes…</div>'; }
      let h = '';
      if (S.campErr) h += '<div class="alerte">' + esc(S.campErr) + '</div>';
      const l = S.campagnes || [], sous = SOUS_NIVEAU[S.per.niveau];
      if (!l.length) return h + '<div class="card vide">Aucune campagne ni opération lancée depuis le cockpit sur ce périmètre.<div style="margin-top:10px"><button class="btn" data-onglet="composer">Composer une campagne</button></div></div>';
      const somme = c => l.reduce((a, x) => a + (Number(x[c]) || 0), 0);
      const dues = l.reduce((a, c) => a + Math.max(0, Number(c.commandes_dues) || 0), 0);
      h += '<div class="bande">' + kpi('Campagnes et opérations', n0(l.length), 'touchant ce périmètre') + kpi('Clients sollicités', n0(somme('cibles')), 'hors groupes témoins') +
        kpi('RDV et commandes', n0(somme('rdv')) + ' · ' + n0(somme('commandes')), 'dans la fenêtre de mesure') + kpi('Commandes dues aux campagnes', n0(dues), 'au-delà du groupe témoin') + '</div>';
      // toutes campagnes confondues, au niveau inférieur du périmètre
      if (sous) {
        const tout = []; l.forEach(c => (c.par_site || []).forEach(x => tout.push(x)));
        const g = regrouper(tout, sous, CHAMPS_RES).sort((a, b) => b.cibles - a.cibles);
        if (g.length > 1) {
          h += '<div class="card">' + h2p(TITRE_NIV[sous] + ', toutes campagnes') + '<div class="defil"><table class="tbl"><thead><tr><th></th>' + TETE_RES + '</tr></thead><tbody>' +
            g.map(x => ligneResultat('<button class="lien" data-act="drill" data-niv="' + sous + '" data-k="' + esc(x.cle) + '">' + esc(x.lib) + '</button>', x)).join('') + '</tbody></table></div></div>';
        }
      }
      h += '<div class="card">' + h2p('Résultats mesurés par PRISME') + '<div class="sous" style="margin:-4px 0 10px">Campagne : RDV et commandes dans les 90 jours après le lancement. Opération : RDV pris pendant l\'opération, commandes jusqu\'à 30 jours après sa fin. Les commandes dues sont l\'écart avec le groupe témoin, ramené au nombre de clients sollicités. Chiffres limités au périmètre choisi.</div><div class="defil"><table class="tbl"><thead><tr>' +
        '<th>Campagne</th>' + TETE_RES + '</tr></thead><tbody>' +
        l.map(c => {
          const ouvert = !!S.ouvertCamp[c.id];
          const est = c.type === 'operation', o = c.operation || {}, dd = Number(c.commandes_dues);
          const meta = est
            ? '<span class="tag">Opération</span> ' + esc(o.type || '') + ' · ' + esc(dfr(c.debut)) + (c.fin && c.fin !== c.debut ? ' → ' + esc(dfr(c.fin)) : '') + ' · ' +
              (c.executant === 'prestataire' ? 'prestataire ' + esc(o.prestataire || '') : (c.mode === 'habituel' ? 'vendeurs habituels' : 'vendeurs, libre-service')) +
              (Number(c.cout) ? ' · coût ' + euros(c.cout) + (dd > 0 ? ' · ' + euros(Number(c.cout) / dd) + ' par vente en plus' : '') : '')
            : esc(dfr(c.cree_le)) + ' · ' + (c.mode === 'habituel' ? 'vendeur habituel' : 'libre-service') + ' · ' + esc(CANAUX[(c.criteres || {}).canal] || '');
          let r = ligneResultat('<b style="color:var(--bleu-f)">' + esc(c.nom) + '</b><div class="fact">' + meta + '</div>' +
            (est && c.executant === 'prestataire' ? '<button class="lien" data-act="fichier" data-id="' + c.id + '" data-nom="' + esc(c.nom) + '" style="margin-right:12px">Fichier d\'appel</button>' : '') +
            (sous ? '<button class="lien" data-act="campdet" data-id="' + c.id + '">' + (ouvert ? 'Masquer le détail' : TITRE_NIV[sous].replace('Par', 'Détail par')) + '</button>' : ''), c, false, est && c.executant === 'prestataire');
          if (ouvert && sous) r += regrouper(c.par_site || [], sous, CHAMPS_RES).sort((a, b) => b.cibles - a.cibles).map(x => ligneResultat('<span style="padding-left:14px">' + esc(x.lib) + '</span>', x, true, est && c.executant === 'prestataire')).join('');
          return r;
        }).join('') + '</tbody></table></div></div>';
      return h;
    }

    // ------------------------------------------------------------- pression commerciale
    const CHARTE_CHAMPS = [
      ['appels_30j', 'Appels par client', 'sur 30 jours, tous appelants (4 au plus pour du démarchage)'],
      ['appels_marketing_30j', 'Dont appels marketing', 'sollicitations du marketing et appels de prestataire'],
      ['sms_30j', 'SMS, RCS ou WhatsApp', 'sur 30 jours'],
      ['emails_30j', 'E-mails', 'sur 30 jours'],
      ['silence_apres_achat_j', 'Silence après un achat', 'jours sans sollicitation marketing'],
      ['silence_apres_sollicitation_j', 'Silence après une sollicitation', 'jours avant la suivante'],
      ['indice_max', 'Indice de pression maximal', 'au-delà, plus aucune sollicitation marketing']];
    function resumeCharte() {
      const r = (S.charte && S.charte.regles) || {};
      if (!Object.keys(r).length) return 'chargement…';
      return r.appels_30j + ' appels / 30 j dont ' + r.appels_marketing_30j + ' marketing · ' + r.sms_30j + ' SMS · ' + r.emails_30j + ' e-mails · silence de ' +
        r.silence_apres_achat_j + ' j après un achat et de ' + r.silence_apres_sollicitation_j + ' j après une sollicitation · indice maximal ' + r.indice_max;
    }
    async function chargerCharte() {
      try { S.charte = await rpc('mkt_charte', { p_viewer_id_user: viewer() }); } catch (e) { S.charte = null; }
    }
    let presSeq = 0;
    async function chargerPression() {
      const seq = ++presSeq; S.presCharge = true; S.presErr = null;
      let d = null, err = null;
      try { d = await rpc('mkt_pression', { p_site_ids: sites(), p_viewer_id_user: viewer() }); } catch (e) { err = e.message || String(e); }
      if (seq !== presSeq) return;
      S.pression = d; S.presErr = err; S.presCharge = false; rendre();
    }
    function vuePression() {
      if (S.pression == null) { if (!S.presCharge) chargerPression(); return '<div class="card vide">Calcul de la pression commerciale…</div>'; }
      const p = S.pression, c30 = p.contacts_30j || {}, nv = p.niveaux || {}, sg = p.signaux || {}, oub = p.oublies || {};
      let h = '';
      if (S.presErr) h += '<div class="alerte">' + esc(S.presErr) + '</div>';
      h += '<div class="bande">' +
        kpi('Clients contactés', n0(p.contactes_30j), 'sur 30 jours, tous canaux') +
        kpi('Contacts sortants', n0(c30.total), n0(c30.appel) + ' appels · ' + n0(c30.sms) + ' SMS · ' + n0(c30.email) + ' e-mails · ' + n0(c30.sollicitation) + ' sollicitations') +
        kpi('Au plafond de la charte', n0(p.satures), 'plus sollicitables sur au moins un canal') +
        kpi('Clients oubliés', n0(oub.n), n0(oub.attendus) + ' achats attendus, aucun contact depuis 12 mois') + '</div>';
      h += '<div class="info">Registre des contacts enregistrés dans One Data : appels téléphoniques, SMS et RCS, e-mails, WhatsApp, sollicitations et fichiers d\'appel confiés à un prestataire. ' +
        'Les appels passés hors One Data ne sont pas comptés : les chiffres sont complets sur les sites qui utilisent toute la téléphonie One Data.</div>';
      // niveaux
      const tot = (nv.faible || 0) + (nv.moderee || 0) + (nv.elevee || 0) + (nv.saturee || 0);
      const seg = [['faible', 'Faible', 'n1'], ['moderee', 'Modérée', 'n2'], ['elevee', 'Élevée', 'n3'], ['saturee', 'Saturée', 'n4']];
      h += '<div class="card">' + h2p('Niveaux de pression') + '<div class="sous" style="margin:-4px 0 10px">Indice de pression de chaque client contacté ces 90 derniers jours : un appel pèse 3, une sollicitation 2, un SMS 1, un e-mail 0,5, et chaque contact pèse deux fois moins tous les 30 jours. ' +
        n0(nv.aucun) + ' clients n\'ont eu aucun contact enregistré.</div>' +
        (tot ? '<div class="pile">' + seg.map(x => (nv[x[0]] ? '<i class="' + x[2] + '" style="width:' + (nv[x[0]] / tot * 100) + '%" title="' + x[1] + '"></i>' : '')).join('') + '</div>' +
          '<div class="legende">' + seg.map(x => '<span><i class="' + x[2] + '"></i>' + x[1] + ' <b>' + n0(nv[x[0]]) + '</b></span>').join('') + '</div>' : '<div class="vide">Aucun contact sortant enregistré sur la période.</div>') + '</div>';
      // semaines
      const sem = p.semaines || [];
      if (sem.length) {
        const mx = Math.max.apply(null, sem.map(w => (w.appel || 0) + (w.sms || 0) + (w.email || 0) + (w.sollicitation || 0)).concat([1]));
        h += '<div class="card">' + h2p('Contacts sortants par semaine') + '<div class="semaines">' + sem.map(w => {
          const t = (w.appel || 0) + (w.sms || 0) + (w.email || 0) + (w.sollicitation || 0);
          return '<div class="c"><b>' + n0(t) + '</b><div class="pile-v" style="height:' + Math.max(2, t / mx * 100) + '%">' +
            [['appel', 'n4'], ['sollicitation', 'n3'], ['sms', 'n2'], ['email', 'n1']].map(k => w[k[0]] ? '<i class="' + k[1] + '" style="flex:' + w[k[0]] + '"></i>' : '').join('') +
            '</div><span>' + esc(new Date(w.semaine + 'T12:00:00').toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' })) + '</span></div>';
        }).join('') + '</div><div class="legende"><span><i class="n4"></i>Appels</span><span><i class="n3"></i>Sollicitations</span><span><i class="n2"></i>SMS</span><span><i class="n1"></i>E-mails</span></div></div>';
      }
      // comparatif
      const sous = SOUS_NIVEAU[S.per.niveau];
      if (sous && p.par_site) {
        const g = regrouper(p.par_site, sous, ['clients', 'contacts', 'appels', 'sms', 'emails', 'satures']).sort((a, b) => b.contacts - a.contacts);
        if (g.length > 1) h += '<div class="card">' + h2p(TITRE_NIV[sous] + ', sur 30 jours') + '<div class="defil"><table class="tbl"><thead><tr><th></th><th class="n">Clients contactés</th><th class="n">Contacts</th><th class="n">Appels</th><th class="n">SMS</th><th class="n">E-mails</th><th class="n">Au plafond</th></tr></thead><tbody>' +
          g.map(x => '<tr><td><button class="lien" data-act="drill" data-niv="' + sous + '" data-k="' + esc(x.cle) + '">' + esc(x.lib) + '</button></td><td class="n">' + n0(x.clients) + '</td><td class="n">' + n0(x.contacts) + '</td><td class="n">' + n0(x.appels) +
            '</td><td class="n">' + n0(x.sms) + '</td><td class="n">' + n0(x.emails) + '</td><td class="n">' + (x.satures ? '<span class="tag or">' + n0(x.satures) + '</span>' : '0') + '</td></tr>').join('') + '</tbody></table></div></div>';
      }
      // vendeurs
      const vd = p.par_vendeur || [];
      if (vd.length) h += '<div class="card">' + h2p('Qui sollicite le plus, sur 30 jours') + '<div class="defil"><table class="tbl"><thead><tr><th>Collaborateur</th><th class="n">Contacts</th><th class="n">Appels</th><th class="n">SMS</th><th class="n">E-mails</th><th class="n">Clients</th><th class="n">Dont au plafond</th></tr></thead><tbody>' +
        vd.map(x => '<tr><td>' + esc(x.nom || ('Utilisateur ' + x.id_user)) + '</td><td class="n">' + n0(x.contacts) + '</td><td class="n">' + n0(x.appels) + '</td><td class="n">' + n0(x.sms) + '</td><td class="n">' + n0(x.emails) +
          '</td><td class="n">' + n0(x.clients) + '</td><td class="n">' + (x.clients_satures ? '<span class="tag or">' + n0(x.clients_satures) + '</span>' : '0') + '</td></tr>').join('') + '</tbody></table></div></div>';
      // signaux
      h += '<div class="card">' + h2p('Signaux de sur-sollicitation, sur 30 jours') + '<div class="tuiles">' +
        '<div class="tuile"><div class="v">' + n0(sg.refus_30j) + '</div><p>clients ont retiré un consentement (appels, SMS, e-mails, offres…).</p></div>' +
        '<div class="tuile"><div class="v">' + n0(sg.stop_sms_30j) + '</div><p>réponses STOP à un SMS.</p></div>' +
        '<div class="tuile"><div class="v">' + n0(sg.hors_plages) + '</div><p>appels sortants hors des plages de démarchage (lundi au vendredi, 10 h – 13 h et 14 h – 20 h).</p></div>' +
        '<div class="tuile"><div class="v">' + n0(sg.appels_sans_reponse) + '</div><p>appels sortants restés sans réponse.</p></div></div></div>';
      // clients au plafond
      const ls = p.liste_satures || [];
      if (ls.length) h += '<div class="card">' + h2p('Clients au plafond de la charte') + '<div class="sous" style="margin:-4px 0 10px">PRISME les écarte automatiquement des campagnes et opérations tant qu\'ils restent au plafond.</div><div class="defil"><table class="tbl"><thead><tr><th>Client</th><th class="n">Indice</th><th class="n">Appels</th><th class="n">SMS</th><th class="n">E-mails</th><th>Dernier contact</th></tr></thead><tbody>' +
        ls.map(x => '<tr><td><button class="lien" data-fiche="' + esc(x.id_client) + '">' + esc(x.nom) + '</button><div class="fact">' + esc(x.nom_site || '') + '</div></td><td class="n">' + Number(x.indice).toLocaleString('fr-FR', { maximumFractionDigits: 1 }) +
          '</td><td class="n">' + n0(x.appels_30j) + '</td><td class="n">' + n0(x.sms_30j) + '</td><td class="n">' + n0(x.emails_30j) + '</td><td>' + esc(dfr(x.dernier_contact)) + '</td></tr>').join('') + '</tbody></table></div></div>';
      // oubliés
      h += '<div class="card">' + h2p('Clients oubliés') + '<div class="brief"><b>' + n0(oub.n) + '</b> clients parmi les 30 % les plus chauds n\'ont eu aucun contact enregistré depuis 12 mois. PRISME y attend <b>' + n0(oub.attendus) +
        '</b> achats. Sous-solliciter coûte aussi.</div><div style="margin-top:10px"><button class="btn" data-act="oublies-audience">En faire une audience</button></div></div>';
      // charte
      const r = S.charteEdit || (S.charte && S.charte.regles) || p.charte || {};
      h += '<div class="card">' + h2p('Charte de pression du groupe') + '<div class="sous" style="margin:-4px 0 10px">Elle s\'applique à toutes les campagnes et opérations du cockpit : un client au plafond sur le canal choisi est écarté de l\'audience.' +
        (S.charte && S.charte.par ? ' Dernière modification par ' + esc(S.charte.par) + ' le ' + esc(dfr(S.charte.maj)) + '.' : '') + '</div><div class="charte-grille">' +
        CHARTE_CHAMPS.map(f => '<label><span>' + f[1] + '</span><input type="number" min="0" max="365" step="1" data-charte="' + f[0] + '" value="' + esc(r[f[0]] == null ? '' : r[f[0]]) + '"><em>' + f[2] + '</em></label>').join('') + '</div>' +
        (S.charteMsg ? '<div class="' + (S.charteMsg.ok ? 'resume' : 'alerte') + '">' + esc(S.charteMsg.t) + '</div>' : '') +
        '<div class="ligne" style="margin-top:10px"><button class="btn" data-act="charte-enr"' + (S.charteEdit ? '' : ' disabled') + '>Enregistrer la charte</button>' +
        (S.charteEdit ? '<button class="btn sec" data-act="charte-annuler">Annuler</button>' : '') + '</div></div>';
      return h;
    }
    async function enregistrerCharte() {
      try {
        S.charte = await rpc('mkt_charte_maj', { p_regles: S.charteEdit, p_viewer_id_user: viewer() });
        S.charteEdit = null; S.charteMsg = { ok: true, t: 'Charte enregistrée : elle s\'applique dès maintenant à toutes les audiences.' };
        S.audience = null; S.pression = null;
      } catch (e) { S.charteMsg = { ok: false, t: 'Charte non enregistrée : ' + (e.message || e) }; }
      rendre();
    }

    function vueMoteur() {
      const m = (S.synth.modele || {}), me = m.metriques || {};
      const a = me.achat || {}, r = me.retour_atelier || {}, e = me.etape || {};
      if (!m.version) return '<div class="card vide">Aucun rapport de modèle disponible.</div>';
      let h = '<div class="card prisme-carte"><div class="prisme-titre">' + LOGO_GRAND + '<div><div class="gros">PRISME <span class="by">by One Data</span></div>' +
        '<div class="sous">Vos données sont la lumière. One Data est le prisme.</div></div></div>' +
        '<div class="prisme-lettres">' + [['P', 'Parcours', 'achats, possessions, financements, véhicules'], ['R', 'Rythmes', 'écarts entre les visites et les factures, régularité'], ['I', 'Intentions', 'demandes, simulations, propositions, appels'],
          ['S', 'Silences', 'retards sur le rythme propre à chaque client'], ['M', 'Moments', 'onze moments de vie, de prospect à silence profond'], ['É', 'Étapes', 'prochaine étape la plus probable et son délai']]
          .map(l => '<div><b>' + l[0] + '</b><span>' + l[1] + '</span><em>' + l[2] + '</em></div>').join('') + '</div>' +
        '<div class="sous" style="margin-top:10px">Les données restent celles de ' + esc(NOM_CLIENT) + '. Les modèles, les cohortes, les règles de lecture et leur entraînement sont la propriété de One Data.</div></div>';
      h += '<div class="card">' + h2p('Ce que vaut PRISME') + '<div class="sous" style="margin:-4px 0 12px">Testé honnêtement : entraîné sur le passé, puis confronté à ce que les clients ont réellement fait dans les 6 mois suivant le ' + esc(dfr(m.date_test)) + ', sur ' + n0(me.clients_test) + ' clients. Version ' + esc(m.version) + '.</div><div class="tuiles">' +
        '<div class="tuile"><div class="v">' + pct(a.capture_top10pct, 0) + '</div><p>des achats viennent des <b>10 % de clients</b> que PRISME juge les plus chauds.</p></div>' +
        '<div class="tuile"><div class="v">× ' + (a.lift_top10pct != null ? Number(a.lift_top10pct).toLocaleString('fr-FR') : '–') + '</div><p>Dans ces 10 %, on trouve ' + (a.lift_top10pct != null ? Number(a.lift_top10pct).toLocaleString('fr-FR') : '–') + ' fois plus d\'acheteurs que dans la base (' + pct(a.taux_top10pct) + ' contre ' + pct(a.taux_observe) + ').</p></div>' +
        '<div class="tuile"><div class="v">' + pct(r.taux_top10pct, 0) + '</div><p>des 10 % les plus probables reviennent bien à l\'atelier dans les 6 mois (moyenne ' + pct(r.taux_observe, 0) + ').</p></div>' +
        '<div class="tuile"><div class="v">' + pct(e.exactitude_modele, 0) + '</div><p>de prochaines étapes bien devinées, contre ' + pct(e.exactitude_reference, 0) + ' en pariant toujours sur la plus fréquente.</p></div>' +
        '<div class="tuile"><div class="v">' + (a.auc != null ? Number(a.auc).toLocaleString('fr-FR', { maximumFractionDigits: 2 }) : '–') + '</div><p>Qualité de tri des acheteurs, sur une échelle de 0,5 (hasard) à 1 (parfait).</p></div>' +
        '</div></div>';
      const pe = (me.par_etat || []).slice().sort((x, y) => ORDRE_ETATS.indexOf(x.etat) - ORDRE_ETATS.indexOf(y.etat));
      if (pe.length) {
        const mx = Math.max.apply(null, pe.map(x => Math.max(Number(x.achat_predit) || 0, Number(x.achat_observe) || 0)).concat([0.01]));
        h += '<div class="card">' + h2p('Promesse tenue, moment par moment') + '<div class="sous" style="margin:-4px 0 10px">Taux d\'achat annoncé par PRISME et taux réellement observé. Un écart signalé veut dire que PRISME est prudent : il y a plus d\'acheteurs que prévu.</div><div class="defil"><table class="tbl"><thead><tr><th>Moment</th><th class="n">Clients</th><th>Annoncé</th><th>Observé</th><th></th></tr></thead><tbody>' +
          pe.map(x => {
            const p = Number(x.achat_predit) || 0, o = Number(x.achat_observe) || 0;
            const ecart = o > p * 1.3 && o - p > 0.005 ? '<span class="tag or">sous-estimé</span>' : (p > o * 1.3 && p - o > 0.005 ? '<span class="tag">surestimé</span>' : '<span class="tag vert">juste</span>');
            return '<tr><td>' + esc((ETATS[x.etat] || {}).t || x.etat) + '</td><td class="n">' + n0(x.clients) + '</td>' +
              '<td><div class="barre"><i style="width:' + (p / mx * 100) + '%"></i></div><div class="fact">' + pct(p) + '</div></td>' +
              '<td><div class="barre"><i style="width:' + (o / mx * 100) + '%;background:var(--vert)"></i></div><div class="fact">' + pct(o) + '</div></td><td>' + ecart + '</td></tr>';
          }).join('') + '</tbody></table></div></div>';
      }
      const ap = e.auc_par_etape || {};
      if (Object.keys(ap).length) {
        h += '<div class="card">' + h2p('Fiabilité par prochaine étape') + '<div class="defil"><table class="tbl"><thead><tr><th>Étape</th><th class="n">Part observée</th><th>Qualité de tri</th></tr></thead><tbody>' +
          Object.keys(ap).sort((x, y) => ap[y] - ap[x]).map(k => '<tr><td>' + esc(ETAPES[k] || k) + '</td><td class="n">' + pct((e.repartition_observee || {})[k]) + '</td><td><div class="barre"><i style="width:' + Math.max(0, (Number(ap[k]) - 0.5) * 200) + '%"></i></div><div class="fact">' + Number(ap[k]).toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + '</div></td></tr>').join('') +
          '</tbody></table></div><div class="sous" style="margin-top:8px">PRISME se réentraîne seul tous les 30 jours ; les scores sont recalculés chaque jour.</div></div>';
      }
      return h;
    }

    // ------------------------------------------------------------- actions
    async function lancer() {
      const mode = S.confirm; if (!mode) return;
      S.envoi = true; rendreAudience();
      if (mode === 'operation') {
        try {
          const o = opPayload();
          const r = await rpc('mkt_operation_creer', { p_nom: S.nom.trim(), p_criteres: critPourBase(), p_operation: o, p_site_ids: sites(), p_viewer_id_user: viewer() });
          let fichier = '';
          if (o.executant === 'prestataire') {
            const n = await telechargerFichier(r.id, r.nom, 'Fichier d\'appel de l\'opération « ' + r.nom + ' » transmis à ' + o.prestataire);
            fichier = ' Fichier d\'appel de <b>' + n0(n) + '</b> clients téléchargé pour ' + esc(o.prestataire) + '.';
          }
          S.message = { ok: true, t: 'Opération « ' + esc(r.nom) + ' » créée : <b>' + n0(r.cibles) + '</b> clients à appeler' + (r.temoins ? ', ' + n0(r.temoins) + ' en témoin' : '') + '.' +
            (o.executant === 'vendeurs' ? ' Les sollicitations sont dans le Pool, numérotées par priorité PRISME.' : fichier) + ' Le bilan est dans l\'onglet Campagnes.' };
          S.confirm = null; S.campagnes = null;
        } catch (e) { S.message = { ok: false, t: 'L\'opération n\'a pas été créée : ' + esc(e.message || e) }; }
        S.envoi = false; chargerAudience(); return;
      }
      try {
        const r = await rpc('mkt_campagne_creer', { p_nom: S.nom.trim(), p_criteres: critPourBase(), p_mode: mode, p_site_ids: sites(), p_viewer_id_user: viewer() });
        S.message = { ok: true, t: 'Campagne « ' + esc(r.nom) + ' » lancée : <b>' + n0(r.cibles) + '</b> sollicitations créées' + (r.temoins ? ', ' + n0(r.temoins) + ' clients en témoin' : '') + '. Suivez-la dans l\'onglet Campagnes.' };
        S.confirm = null; S.campagnes = null;
      } catch (e) { S.message = { ok: false, t: 'La campagne n\'a pas été créée : ' + esc(e.message || e) }; }
      S.envoi = false; chargerAudience();
    }
    // CSV (séparateur ;, BOM UTF-8 pour Excel)
    function telechargerCsv(cols, lignes, nomFichier) {
      const cel = v => { const s = v == null ? '' : String(v); return /[";\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
      const txt = [cols.map(c => c[1]).join(';')].concat(lignes.map(x => cols.map(c => cel(x[c[0]])).join(';'))).join('\r\n');
      const blob = new Blob(['\ufeff' + txt], { type: 'text/csv;charset=utf-8' });
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
      a.download = nomFichier.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9.]+/g, '-').replace(/^-|-$/g, '');
      document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
    }
    const telFr = v => { const s = String(v || ''); return /^\+33\d{9}$/.test(s) ? ('0' + s.slice(3)).replace(/(\d{2})(?=\d)/g, '$1 ') : s; };
    async function telechargerFichier(id, nom, motif) {
      const l = await rpc('mkt_operation_fichier', { p_id_campagne: Number(id), p_motif: motif, p_viewer_id_user: viewer() }) || [];
      const cols = [['priorite', 'Priorité'], ['civilite', 'Civilité'], ['prenom', 'Prénom'], ['nom', 'Nom'], ['telephone', 'Téléphone'], ['telephone_2', 'Téléphone 2'],
        ['code_postal', 'Code postal'], ['ville', 'Ville'], ['concession', 'Concession'], ['moment', 'Moment'], ['a_savoir', 'À savoir avant d\'appeler'],
        ['prochaine_etape', 'Prochaine étape probable'], ['score_prisme', 'Score PRISME'], ['id_client', 'Réf. client'], ['resultat', 'Résultat de l\'appel'], ['rdv', 'Date du RDV']];
      telechargerCsv(cols, l.map(x => Object.assign({}, x, {
        telephone: telFr(x.telephone), telephone_2: telFr(x.telephone_2), moment: (ETATS[x.moment] || {}).t || x.moment,
        prochaine_etape: ETAPES[x.prochaine_etape] || x.prochaine_etape, score_prisme: x.score_prisme == null ? '' : pct(x.score_prisme), resultat: '', rdv: ''
      })), 'operation-' + nom + '-' + new Date().toISOString().slice(0, 10) + '.csv');
      return l.length;
    }
    async function exporter() {
      S.envoi = true; S.message = null; rendreAudience();
      try {
        const l = await rpc('mkt_export', { p_criteres: critPourBase(), p_motif: S.motif.trim(), p_site_ids: sites(), p_viewer_id_user: viewer() }) || [];
        const cols = [['id_client', 'Id client'], ['civilite', 'Civilité'], ['prenom', 'Prénom'], ['nom', 'Nom'], ['email', 'E-mail'], ['mobile', 'Mobile'], ['code_postal', 'Code postal'], ['ville', 'Ville'],
          ['concession', 'Concession'], ['moment', 'Moment'], ['cohorte', 'Cohorte'], ['prochaine_etape', 'Prochaine étape'], ['probabilite_achat', 'Probabilité achat']];
        const cel = v => { const s = v == null ? '' : String(v); return /[";\n\r]/.test(s) ? '"' + s.replace(/"/g, '""') + '"' : s; };
        const lignes = [cols.map(c => c[1]).join(';')].concat(l.map(x => cols.map(c => {
          let v = x[c[0]];
          if (c[0] === 'moment') v = (ETATS[v] || {}).t || v;
          if (c[0] === 'prochaine_etape') v = ETAPES[v] || v;
          if (c[0] === 'probabilite_achat' && v != null) v = String(v).replace('.', ',');
          return cel(v);
        }).join(';')));
        const blob = new Blob(['﻿' + lignes.join('\r\n')], { type: 'text/csv;charset=utf-8' });
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob);
        a.download = 'audience-' + (S.nom.trim() || 'cockpit').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') + '-' + new Date().toISOString().slice(0, 10) + '.csv';
        document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 1000);
        S.message = { ok: true, t: '<b>' + n0(l.length) + '</b> lignes extraites. L\'extraction est tracée au registre avec son motif.' };
      } catch (e) { S.message = { ok: false, t: 'Extraction impossible : ' + esc(e.message || e) }; }
      S.envoi = false; rendreAudience();
    }

    corps.addEventListener('click', ev => {
      const t = ev.target.closest('button'); if (!t || !corps.contains(t)) return;
      if (t.dataset.onglet) { S.onglet = t.dataset.onglet; rendre(); if (S.onglet === 'composer' && !S.audience) chargerAudience(); return; }
      if (t.dataset.fiche) { ouvrirFicheClient(t.dataset.fiche); return; }
      if (t.dataset.niveau) { if (t.dataset.niveau !== S.per.niveau) choisirPer(t.dataset.niveau, null); return; }
      if (t.dataset.puce) {
        const l = S.crit[t.dataset.puce], v = t.dataset.v, i = l.indexOf(v);
        if (i === -1) l.push(v); else l.splice(i, 1);
        if (t.dataset.puce === 'segments') S.crit.archetypes = S.crit.archetypes.filter(a => !S.crit.segments.length || S.crit.segments.indexOf(a.split('-')[0]) !== -1);
        S.confirm = null; S.message = null; rendre(); planifierAudience(); return;
      }
      if (t.dataset.opv) { S.op[t.dataset.opv] = t.dataset.v; S.confirm = null; rendre(); return; }
      if (t.dataset.canal) { S.crit.canal = t.dataset.canal; S.confirm = null; S.message = null; rendre(); planifierAudience(); return; }
      const act = t.dataset.act;
      if (act === 'recharger') { S.campagnes = null; S.pression = null; chargerCharte(); chargerPerimetre().then(chargerSynthese).then(() => { if (S.onglet === 'composer') chargerAudience(); }); }
      else if (act === 'prop') { const p = propositions()[Number(t.dataset.i)]; if (p) versComposer(Object.assign({ canal: p.canal }, p.crit), p.t); }
      else if (act === 'etat') versComposer({ etats: [t.dataset.k] }, ETATS[t.dataset.k].t);
      else if (act === 'coh') { const k = t.dataset.k; versComposer({ segments: [k.split('-')[0]], archetypes: [k] }, 'Cohorte ' + nomCohorte(k)); }
      else if (act === 'voir-aud') { const b = corps.querySelector('#mkt-aud'); if (b) try { b.scrollIntoView({ behavior: 'smooth', block: 'start' }); } catch (e) { b.scrollIntoView(); } }
      else if (act === 'drill') choisirPer(t.dataset.niv, t.dataset.k);
      else if (act === 'oublies') { S.crit.oublies = !S.crit.oublies; S.confirm = null; rendre(); planifierAudience(); }
      else if (act === 'oublies-audience') versComposer({ oublies: true, decile_max: 3 }, 'Clients oubliés à fort potentiel');
      else if (act === 'charte-enr') enregistrerCharte();
      else if (act === 'charte-annuler') { S.charteEdit = null; S.charteMsg = null; rendre(); }
      else if (act === 'mode-op') { S.op.actif = t.dataset.v === '1'; S.confirm = null; S.message = null; rendre(); planifierAudience(); }
      else if (act === 'fichier') {
        const id = t.dataset.id, nom = t.dataset.nom; t.disabled = true;
        telechargerFichier(id, nom, 'Nouveau téléchargement du fichier d\'appel de l\'opération « ' + nom + ' »')
          .catch(e => alert('Fichier indisponible : ' + (e.message || e))).then(() => { t.disabled = false; });
      }
      else if (act === 'campdet') { const id = t.dataset.id; S.ouvertCamp[id] = !S.ouvertCamp[id]; rendre(); }
      else if (act === 'cycle') { S.crit.exclure_cycle_ouvert = !S.crit.exclure_cycle_ouvert; S.confirm = null; rendre(); planifierAudience(); }
      else if (act === 'raz') { S.crit = critDefaut(); S.nom = ''; S.confirm = null; S.message = null; rendre(); planifierAudience(); }
      else if (act === 'lancer') { S.confirm = t.dataset.mode; S.message = null; rendreAudience(); }
      else if (act === 'annuler') { S.confirm = null; rendreAudience(); }
      else if (act === 'confirmer') lancer();
      else if (act === 'export') exporter();
    });
    corps.addEventListener('input', ev => {
      const ck = ev.target.dataset && ev.target.dataset.charte;
      if (ck) {
        const avant = !!S.charteEdit;
        if (!S.charteEdit) S.charteEdit = Object.assign({}, (S.charte && S.charte.regles) || (S.pression && S.pression.charte) || {});
        S.charteEdit[ck] = ev.target.value === '' ? null : Number(ev.target.value); S.charteMsg = null;
        if (!avant) { const b = corps.querySelector('[data-act="charte-enr"]'); if (b) b.disabled = false; }
        return;
      }
      const k = ev.target.dataset && ev.target.dataset.op;
      if (k) {
        S.op[k] = ev.target.value; S.confirm = null;
        if (['appelants', 'heures', 'appels_heure', 'tentatives'].indexOf(k) !== -1) {
          const c = corps.querySelector('#mkt-cap'); if (c) c.innerHTML = capTexte(capacite());
          planifierAudience();
        } else rendreAudience();
        return;
      }
      const f = ev.target.dataset && ev.target.dataset.champ; if (!f) return;
      if (f === 'nom') { const avant = !!S.nom.trim(); S.nom = ev.target.value; if (S.op.actif) rendreAudience(); else if (avant !== !!S.nom.trim()) majBoutons(); return; }
      if (f === 'motif') { const avant = !!S.motif.trim(); S.motif = ev.target.value; if (avant !== !!S.motif.trim()) majBoutons(); return; }
      if (f === 'age_min_mois' || f === 'age_max_mois') { const v = ev.target.value; S.crit[f] = v === '' ? null : Math.max(0, parseInt(v, 10) || 0); planifierAudience(); }
    });
    corps.addEventListener('change', ev => {
      const k = ev.target.dataset && ev.target.dataset.op;
      if (k) { S.op[k] = ev.target.value; S.confirm = null; rendreAudience(); return; }
      const f = ev.target.dataset && ev.target.dataset.champ; if (!f) return;
      if (f === 'perval') { choisirPer(S.per.niveau, ev.target.value); return; }
      if (f === 'decile_max') S.crit.decile_max = ev.target.value ? Number(ev.target.value) : null;
      else if (f === 'pression_jours' || f === 'temoin_pct') S.crit[f] = Number(ev.target.value);
      else return;
      S.confirm = null; planifierAudience();
    });
    // Met à jour l'état des boutons sans redessiner (le champ garde le focus)
    function majBoutons() {
      const a = S.audience, cas = (a && a.cascade) || [], fin = Number((cas[cas.length - 1] || {}).n) || 0;
      corps.querySelectorAll('[data-act="lancer"]').forEach(b => { b.disabled = !(S.nom.trim() && fin > 0 && !S.envoi); });
      corps.querySelectorAll('[data-act="export"]').forEach(b => { b.disabled = !(S.motif.trim() && fin > 0 && !S.envoi); });
    }

    // ------------------------------------------------------------- démarrage
    // v3 : le site de la barre du haut n'est plus suivi ; le périmètre se choisit dans la page.
    S.per = lirePer();
    rendre();
    await chargerPerimetre();
    chargerCharte().then(() => { if (S.onglet === 'composer') rendre(); });
    await chargerSynthese();
  }
});
