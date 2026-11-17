// ============================================================================
//  COCKPIT MARKETING — module One Data (OD.define)   v1 — PROFIL TEAM COLIN
//
//  Page du directeur digital et marketing. Quatre onglets :
//    Moments    : où en sont les clients du périmètre dans leur parcours, ce que
//                 le moteur prédictif attend, et les campagnes qu'il propose.
//    Composer   : construire une audience à la volée (cascade d'exclusion en
//                 direct), la lancer en sollicitations ou l'extraire en CSV.
//    Campagnes  : avancement et commandes obtenues, mesurées contre un groupe
//                 témoin tiré au hasard et jamais sollicité.
//    Moteur     : fiabilité du moteur, dite en clair.
//
//  Prérequis SQL (tenant Team Colin, sql/04_cockpit_marketing.sql) :
//    mkt_synthese, mkt_audience, mkt_export, mkt_campagne_creer, mkt_campagnes
//  Accès : rôles 1, 2, 5, 6, 7, 8 (contrôlé aussi côté base par mkt_viewer).
//  Périmètre : suit le bus de site (window.oropraSite).
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
      confirm: null, envoi: false, message: null, campagnes: null, campErr: null, ouvertCoh: null
    };
    function critDefaut() {
      return { segments: [], etats: [], archetypes: [], etapes: [], marques: [], financements: [],
        decile_max: null, age_min_mois: null, age_max_mois: null, canal: 'telephone',
        exclure_cycle_ouvert: true, pression_jours: 30, temoin_pct: 10 };
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
    function sites() {
      try {
        const b = bus();
        if (b && typeof b.getSitesDuPerimetre === 'function') {
          const l = (b.getSitesDuPerimetre() || []).map(Number).filter(x => x > 0);
          if (l.length) return l;
        }
        if (b && typeof b.getSiteId === 'function') { const id = Number(b.getSiteId()); if (id > 0) return [id]; }
      } catch (e) { }
      return null;
    }
    function libPerimetre() {
      try { const p = bus() && bus().getPerimetre && bus().getPerimetre(); if (p && p.label) return p.label; } catch (e) { }
      return 'Tout mon périmètre';
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
@media (max-width:980px){#mkt-root .voies{grid-template-columns:1fr} #mkt-root .compo{grid-template-columns:1fr} #mkt-root .collant{position:static}}
@media (max-width:560px){#mkt-root{padding:12px 10px 50px} #mkt-root .kpi .v{font-size:22px} #mkt-root .card{padding:13px}}
`;
    const style = document.createElement('style'); style.textContent = CSS; R.appendChild(style);
    const corps = document.createElement('div'); R.appendChild(corps);

    // ------------------------------------------------------------- garde d'accès
    if (ROLES_OK.indexOf(role()) === -1) {
      corps.innerHTML = '<div class="card vide">Cette page est réservée à la direction marketing et à la direction.</div>';
      return;
    }

    // ------------------------------------------------------------- chargements
    async function chargerSynthese() {
      S.chargement = true; S.err = null; rendre();
      try { S.synth = await rpc('mkt_synthese', { p_site_ids: sites(), p_viewer_id_user: viewer() }); }
      catch (e) { S.err = e.message || String(e); console.error('[cockpit-mkt]', e); }
      S.chargement = false; rendre();
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
      o.pression_jours = Number(c.pression_jours); o.temoin_pct = Number(c.temoin_pct);
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
    async function chargerCampagnes() {
      S.campErr = null;
      try { S.campagnes = await rpc('mkt_campagnes', { p_viewer_id_user: viewer() }) || []; }
      catch (e) { S.campErr = e.message || String(e); S.campagnes = []; }
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
      h += '<div class="onglets">' + [['moments', 'Moments'], ['composer', 'Composer une campagne'], ['campagnes', 'Campagnes'], ['moteur', 'Moteur']]
        .map(o => '<button data-onglet="' + o[0] + '" class="' + (S.onglet === o[0] ? 'on' : '') + '">' + o[1] + '</button>').join('') + '</div>';
      if (S.err) h += '<div class="alerte">Le cockpit n\'a pas pu charger les scores : ' + esc(S.err) + '</div>';
      if (S.chargement && !s) h += '<div class="card vide">Chargement des parcours clients…</div>';
      else if (s) {
        if (S.onglet === 'moments') h += vueMoments();
        else if (S.onglet === 'composer') h += vueComposer();
        else if (S.onglet === 'campagnes') h += vueCampagnes();
        else h += vueMoteur();
      }
      corps.innerHTML = h;
      if (S.onglet === 'composer') rendreAudience();
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
        kpi('Concessions', n0((s.sites || []).length), 'dans le périmètre') + '</div>';
      h += '<div class="card"><h2>Le brief du jour</h2><div class="brief">' +
        'Le moteur attend <b>' + n0(tot) + ' achats</b> sur ' + n0(s.clients) + ' clients. ' +
        (tot ? '<b>' + pct(chauds / tot, 0) + '</b> viennent des projets en cours et des prospects chauds : c\'est le travail des vendeurs, à protéger d\'une sollicitation de trop. ' : '') +
        (fen.n ? '<b>' + n0(fen.n) + '</b> clients sont dans leur fenêtre de renouvellement (' + n0(fen.attendus) + ' achats attendus) : un gisement que le marketing peut travailler sans gêner les vendeurs. ' : '') +
        (psa.n ? '<b>' + n0(psa.n) + '</b> propriétaires n\'ont jamais été revus à l\'atelier. ' : '') +
        (sil.n ? '<b>' + n0(sil.n) + '</b> clients décrochent de leur rythme de visite : à réveiller avant qu\'ils ne partent ailleurs.' : '') +
        '</div></div>';

      const props = propositions();
      if (props.length) {
        h += '<div class="card"><h2>Campagnes proposées par le moteur</h2><div class="sous" style="margin:-4px 0 10px">Classées par achats attendus. Ouvrez-en une pour l\'ajuster avant de la lancer.</div><div class="props">' +
          props.slice(0, 6).map((p, i) => '<div class="prop"><div class="ligne" style="justify-content:space-between"><span class="t">' + esc(p.t) + '</span><span class="tag">' + esc(CANAUX[p.canal]) + '</span></div>' +
            '<div class="pq">' + esc(p.pq) + '</div><div class="m"><span><b>' + n0(p.n) + '</b> clients</span><span><b>' + n0(p.attendus) + '</b> achats attendus</span><span><b>' + pct(p.p) + '</b></span></div>' +
            '<div><button class="btn" data-act="prop" data-i="' + i + '">Préparer la campagne</button></div></div>').join('') + '</div></div>';
      }

      h += '<div class="card"><h2>Où en sont les clients</h2><div class="sous" style="margin:-4px 0 12px">Chaque client est placé à un moment de son parcours. Probabilité d\'achat à 6 mois, achats attendus et prochaine étape la plus probable.</div><div class="voies">';
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
      h += '<div class="card"><h2>Où se trouvent les achats</h2><div class="sous" style="margin:-4px 0 6px">Achats attendus par décile de score (1 = les 10 % les plus chauds).</div><div class="deciles">' +
        dec.map(d => '<div class="c"><b>' + n0(d.attendus) + '</b><i style="height:' + Math.max(2, Math.round((Number(d.attendus) || 0) / maxD * 100)) + '%"></i><span>' + d.decile + '</span></div>').join('') + '</div>' +
        (dec.length && tot ? '<div class="sous" style="margin-top:8px">Les 3 premiers déciles portent <b>' + pct(dec.filter(d => d.decile <= 3).reduce((a, d) => a + (Number(d.attendus) || 0), 0) / tot, 0) + '</b> des achats attendus.</div>' : '') + '</div>';

      h += '<div class="card"><h2>Cohortes de parcours</h2><div class="sous" style="margin:-4px 0 10px">Familles de clients au comportement proche, trouvées par le moteur. Les flèches indiquent ce qui les distingue de la moyenne.</div>';
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
      h += '<h2>Audience</h2>';
      h += '<div class="champ"><div class="l">Nom de la campagne</div><input type="text" data-champ="nom" maxlength="120" placeholder="Ex. Reprise fenêtre de renouvellement – décembre" value="' + esc(S.nom) + '"></div>';
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
      h += '<div class="champ"><div class="l">Canal</div><div class="puces">' + Object.keys(CANAUX).map(k => '<button class="puce' + (c.canal === k ? ' on' : '') + '" data-canal="' + k + '">' + CANAUX[k] + '</button>').join('') + '</div>' +
        '<div class="sous" style="margin-top:4px">Le consentement de chaque client est vérifié pour le canal choisi.</div></div>';
      h += '<div class="champ"><div class="ligne">' +
        '<button class="puce' + (c.exclure_cycle_ouvert ? ' on' : '') + '" data-act="cycle">Écarter les clients déjà suivis par un vendeur</button>' +
        '<span>Ne pas resolliciter avant</span><select data-champ="pression_jours">' + [[0, 'sans limite'], [15, '15 jours'], [30, '30 jours'], [60, '60 jours'], [90, '90 jours']].map(o => '<option value="' + o[0] + '"' + (Number(c.pression_jours) === o[0] ? ' selected' : '') + '>' + o[1] + '</option>').join('') + '</select>' +
        '<span>Groupe témoin</span><select data-champ="temoin_pct">' + [0, 5, 10, 20].map(v => '<option value="' + v + '"' + (Number(c.temoin_pct) === v ? ' selected' : '') + '>' + (v ? v + ' %' : 'aucun') + '</option>').join('') + '</select></div>' +
        '<div class="sous" style="margin-top:4px">Le groupe témoin est tiré au hasard et n\'est jamais sollicité : c\'est lui qui prouve ce que la campagne a rapporté.</div></div>';
      h += '<div class="ligne"><button class="btn sec" data-act="raz">Tout effacer</button></div>';
      h += '</div><div class="collant"><div class="card" id="mkt-aud"></div></div></div>';
      return h;
    }
    function rendreAudience() {
      const box = corps.querySelector('#mkt-aud'); if (!box) return;
      const a = S.audience, c = S.crit;
      let h = '<h2>Audience en direct</h2>';
      if (S.audErr) h += '<div class="alerte">' + esc(S.audErr) + '</div>';
      if (!a) { box.innerHTML = h + '<div class="charge">Calcul de l\'audience…</div>'; return; }
      const cas = a.cascade || [], max = Math.max(1, Number((cas[0] || {}).n) || 1);
      const finale = Number((cas[cas.length - 1] || {}).n) || 0;
      const temoins = cas.length >= 2 ? (Number(cas[cas.length - 2].n) || 0) - finale : 0;
      h += '<div class="cascade' + (S.audCharge ? '" style="opacity:.55' : '') + '">' + cas.map(e => '<div class="e"><span class="lb">' + esc(e.etape) + '</span><span class="nb">' + n0(e.n) + '</span><div class="barre"><i style="width:' + Math.max(0.5, (Number(e.n) || 0) / max * 100) + '%"></i></div></div>').join('') + '</div>';
      h += '<div class="resume"><b>' + n0(finale) + ' clients</b> à contacter' + (c.canal ? ' par ' + esc(CANAUX[c.canal]).toLowerCase() : '') + ' · <b>' + n0(a.achats_attendus) + '</b> achats attendus sans action' +
        (temoins > 0 ? ' · ' + n0(temoins) + ' gardés en témoin' : '') + '</div>';
      if (a.par_site && a.par_site.length) {
        h += '<div class="sous" style="margin-bottom:10px">' + a.par_site.slice(0, 8).map(x => esc(x.nom_site) + ' ' + n0(x.n)).join(' · ') + (a.par_site.length > 8 ? ' · …' : '') + '</div>';
      }
      // actions
      const okNom = S.nom.trim().length > 0, okNb = finale > 0 && !S.envoi;
      if (S.message) h += '<div class="' + (S.message.ok ? 'resume' : 'alerte') + '">' + S.message.t + '</div>';
      if (S.confirm) {
        h += '<div class="info">' + n0(finale) + ' sollicitations « Marketing Affaire » vont être créées ' +
          (S.confirm === 'libre' ? 'en <b>libre-service</b> : le premier vendeur qui les prend en devient responsable.' : 'au nom du <b>vendeur habituel</b> de chaque client (libre-service s\'il n\'en a pas).') +
          (temoins > 0 ? ' ' + n0(temoins) + ' clients restent en témoin.' : '') + '<div class="ligne" style="margin-top:8px"><button class="btn vert" data-act="confirmer"' + (S.envoi ? ' disabled' : '') + '>' + (S.envoi ? 'Création…' : 'Confirmer') + '</button><button class="btn sec" data-act="annuler">Annuler</button></div></div>';
      } else {
        h += '<div class="ligne" style="margin-bottom:6px"><button class="btn" data-act="lancer" data-mode="libre"' + (okNom && okNb ? '' : ' disabled') + '>Lancer en libre-service</button>' +
          '<button class="btn sec" data-act="lancer" data-mode="habituel"' + (okNom && okNb ? '' : ' disabled') + '>Au vendeur habituel</button></div>';
        if (!okNom) h += '<div class="sous">Donnez un nom à la campagne pour la lancer.</div>';
      }
      h += '<div class="champ" style="margin-top:12px"><div class="l">Extraction pour un routeur</div><div class="ligne"><input type="text" data-champ="motif" style="flex:1;min-width:180px" placeholder="Motif (obligatoire, tracé au registre)" value="' + esc(S.motif) + '">' +
        '<button class="btn sec" data-act="export"' + (S.motif.trim() && finale > 0 && !S.envoi ? '' : ' disabled') + '>Extraire en CSV</button></div></div>';
      // aperçu
      const ap = a.apercu || [];
      if (ap.length) {
        h += '<h2 style="margin-top:14px">Les plus chauds de l\'audience</h2><div class="defil"><table class="tbl"><thead><tr><th>Client</th><th>Moment</th><th>Prochaine étape</th><th class="n">Achat</th></tr></thead><tbody>' +
          ap.slice(0, 25).map(x => '<tr><td><button class="lien" data-fiche="' + esc(x.id_client) + '">' + esc(x.nom) + '</button><div class="fact">' + esc([x.ville, x.nom_site].filter(Boolean).join(' · ')) + '</div>' +
            (Array.isArray(x.facteurs) && x.facteurs.length ? '<div class="fact">' + esc(x.facteurs.slice(0, 2).map(f => f.facteur).join(' · ')) + '</div>' : '') + '</td>' +
            '<td>' + esc((ETATS[x.etat] || {}).t || x.etat) + '<div class="fact">' + esc(x.archetype_libelle || '') + '</div></td><td>' + esc(ETAPES[x.etape] || x.etape || '–') + '</td><td class="n">' + pct(x.p_achat) + '</td></tr>').join('') +
          '</tbody></table></div>';
      } else if (!S.audCharge) h += '<div class="vide">Aucun client ne correspond.</div>';
      box.innerHTML = h;
    }

    function vueCampagnes() {
      if (S.campagnes == null) { chargerCampagnes(); return '<div class="card vide">Chargement des campagnes…</div>'; }
      let h = '';
      if (S.campErr) h += '<div class="alerte">' + esc(S.campErr) + '</div>';
      const l = S.campagnes || [];
      if (!l.length) return h + '<div class="card vide">Aucune campagne lancée depuis le cockpit pour l\'instant.<div style="margin-top:10px"><button class="btn" data-onglet="composer">Composer une campagne</button></div></div>';
      const tc = l.reduce((a, c) => a + (Number(c.cibles) || 0), 0), dues = l.reduce((a, c) => a + Math.max(0, Number(c.commandes_dues) || 0), 0);
      h += '<div class="bande">' + kpi('Campagnes', n0(l.length), 'lancées depuis le cockpit') + kpi('Clients sollicités', n0(tc), 'hors groupes témoins') +
        kpi('Commandes', n0(l.reduce((a, c) => a + (Number(c.commandes) || 0), 0)), 'dans les 90 jours') + kpi('Commandes dues aux campagnes', n0(dues), 'au-delà du groupe témoin') + '</div>';
      h += '<div class="card"><h2>Résultats</h2><div class="sous" style="margin:-4px 0 10px">Une commande compte si elle arrive dans les 90 jours après le lancement. Les commandes dues à la campagne sont l\'écart avec le groupe témoin, ramené au nombre de clients sollicités.</div><div class="defil"><table class="tbl"><thead><tr>' +
        '<th>Campagne</th><th class="n">Sollicités</th><th>Prises en main</th><th>Traitées</th><th class="n">Commandes</th><th class="n">Taux</th><th class="n">Témoin</th><th class="n">Dues</th></tr></thead><tbody>' +
        l.map(c => {
          const cib = Number(c.cibles) || 0, pris = cib ? (Number(c.pris) || 0) / cib : 0, tr = cib ? (Number(c.traites) || 0) / cib : 0;
          const dd = Number(c.commandes_dues);
          return '<tr><td><b style="color:var(--bleu-f)">' + esc(c.nom) + '</b><div class="fact">' + esc(dfr(c.cree_le)) + ' · ' + (c.mode === 'habituel' ? 'vendeur habituel' : 'libre-service') +
            ' · ' + esc(CANAUX[(c.criteres || {}).canal] || '') + '</div></td><td class="n">' + n0(cib) + '</td>' +
            '<td><div class="barre"><i style="width:' + (pris * 100) + '%"></i></div><div class="fact">' + pct(pris, 0) + '</div></td>' +
            '<td><div class="barre"><i style="width:' + (tr * 100) + '%;background:var(--vert)"></i></div><div class="fact">' + pct(tr, 0) + '</div></td>' +
            '<td class="n">' + n0(c.commandes) + '</td><td class="n">' + pct(c.taux_cible) + '</td><td class="n">' + pct(c.taux_temoin) + '<div class="fact">' + n0(c.temoins) + ' clients</div></td>' +
            '<td class="n">' + (isNaN(dd) || c.commandes_dues == null ? '–' : (dd > 0 ? '<span class="tag vert">+' + n0(dd) + '</span>' : '<span class="tag or">' + n0(dd) + '</span>')) + '</td></tr>';
        }).join('') + '</tbody></table></div></div>';
      return h;
    }

    function vueMoteur() {
      const m = (S.synth.modele || {}), me = m.metriques || {};
      const a = me.achat || {}, r = me.retour_atelier || {}, e = me.etape || {};
      if (!m.version) return '<div class="card vide">Aucun rapport de modèle disponible.</div>';
      let h = '<div class="card"><h2>Ce que vaut le moteur</h2><div class="sous" style="margin:-4px 0 12px">Testé honnêtement : entraîné sur le passé, puis confronté à ce que les clients ont réellement fait dans les 6 mois suivant le ' + esc(dfr(m.date_test)) + ', sur ' + n0(me.clients_test) + ' clients. Version ' + esc(m.version) + '.</div><div class="tuiles">' +
        '<div class="tuile"><div class="v">' + pct(a.capture_top10pct, 0) + '</div><p>des achats viennent des <b>10 % de clients</b> que le moteur juge les plus chauds.</p></div>' +
        '<div class="tuile"><div class="v">× ' + (a.lift_top10pct != null ? Number(a.lift_top10pct).toLocaleString('fr-FR') : '–') + '</div><p>Dans ces 10 %, on trouve ' + (a.lift_top10pct != null ? Number(a.lift_top10pct).toLocaleString('fr-FR') : '–') + ' fois plus d\'acheteurs que dans la base (' + pct(a.taux_top10pct) + ' contre ' + pct(a.taux_observe) + ').</p></div>' +
        '<div class="tuile"><div class="v">' + pct(r.taux_top10pct, 0) + '</div><p>des 10 % les plus probables reviennent bien à l\'atelier dans les 6 mois (moyenne ' + pct(r.taux_observe, 0) + ').</p></div>' +
        '<div class="tuile"><div class="v">' + pct(e.exactitude_modele, 0) + '</div><p>de prochaines étapes bien devinées, contre ' + pct(e.exactitude_reference, 0) + ' en pariant toujours sur la plus fréquente.</p></div>' +
        '<div class="tuile"><div class="v">' + (a.auc != null ? Number(a.auc).toLocaleString('fr-FR', { maximumFractionDigits: 2 }) : '–') + '</div><p>Qualité de tri des acheteurs, sur une échelle de 0,5 (hasard) à 1 (parfait).</p></div>' +
        '</div></div>';
      const pe = (me.par_etat || []).slice().sort((x, y) => ORDRE_ETATS.indexOf(x.etat) - ORDRE_ETATS.indexOf(y.etat));
      if (pe.length) {
        const mx = Math.max.apply(null, pe.map(x => Math.max(Number(x.achat_predit) || 0, Number(x.achat_observe) || 0)).concat([0.01]));
        h += '<div class="card"><h2>Promesse tenue, moment par moment</h2><div class="sous" style="margin:-4px 0 10px">Taux d\'achat annoncé par le moteur et taux réellement observé. Un écart signalé veut dire que le moteur est prudent : il y a plus d\'acheteurs que prévu.</div><div class="defil"><table class="tbl"><thead><tr><th>Moment</th><th class="n">Clients</th><th>Annoncé</th><th>Observé</th><th></th></tr></thead><tbody>' +
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
        h += '<div class="card"><h2>Fiabilité par prochaine étape</h2><div class="defil"><table class="tbl"><thead><tr><th>Étape</th><th class="n">Part observée</th><th>Qualité de tri</th></tr></thead><tbody>' +
          Object.keys(ap).sort((x, y) => ap[y] - ap[x]).map(k => '<tr><td>' + esc(ETAPES[k] || k) + '</td><td class="n">' + pct((e.repartition_observee || {})[k]) + '</td><td><div class="barre"><i style="width:' + Math.max(0, (Number(ap[k]) - 0.5) * 200) + '%"></i></div><div class="fact">' + Number(ap[k]).toLocaleString('fr-FR', { maximumFractionDigits: 2 }) + '</div></td></tr>').join('') +
          '</tbody></table></div><div class="sous" style="margin-top:8px">Le moteur se réentraîne seul tous les 30 jours ; les scores sont recalculés chaque nuit.</div></div>';
      }
      return h;
    }

    // ------------------------------------------------------------- actions
    async function lancer() {
      const mode = S.confirm; if (!mode) return;
      S.envoi = true; rendreAudience();
      try {
        const r = await rpc('mkt_campagne_creer', { p_nom: S.nom.trim(), p_criteres: critPourBase(), p_mode: mode, p_site_ids: sites(), p_viewer_id_user: viewer() });
        S.message = { ok: true, t: 'Campagne « ' + esc(r.nom) + ' » lancée : <b>' + n0(r.cibles) + '</b> sollicitations créées' + (r.temoins ? ', ' + n0(r.temoins) + ' clients en témoin' : '') + '. Suivez-la dans l\'onglet Campagnes.' };
        S.confirm = null; S.campagnes = null;
      } catch (e) { S.message = { ok: false, t: 'La campagne n\'a pas été créée : ' + esc(e.message || e) }; }
      S.envoi = false; chargerAudience();
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
      if (t.dataset.puce) {
        const l = S.crit[t.dataset.puce], v = t.dataset.v, i = l.indexOf(v);
        if (i === -1) l.push(v); else l.splice(i, 1);
        if (t.dataset.puce === 'segments') S.crit.archetypes = S.crit.archetypes.filter(a => !S.crit.segments.length || S.crit.segments.indexOf(a.split('-')[0]) !== -1);
        S.confirm = null; S.message = null; rendre(); planifierAudience(); return;
      }
      if (t.dataset.canal) { S.crit.canal = t.dataset.canal; S.confirm = null; S.message = null; rendre(); planifierAudience(); return; }
      const act = t.dataset.act;
      if (act === 'recharger') { S.campagnes = null; chargerSynthese().then(() => { if (S.onglet === 'composer') chargerAudience(); }); }
      else if (act === 'prop') { const p = propositions()[Number(t.dataset.i)]; if (p) versComposer(Object.assign({ canal: p.canal }, p.crit), p.t); }
      else if (act === 'etat') versComposer({ etats: [t.dataset.k] }, ETATS[t.dataset.k].t);
      else if (act === 'coh') { const k = t.dataset.k; versComposer({ segments: [k.split('-')[0]], archetypes: [k] }, 'Cohorte ' + nomCohorte(k)); }
      else if (act === 'cycle') { S.crit.exclure_cycle_ouvert = !S.crit.exclure_cycle_ouvert; S.confirm = null; rendre(); planifierAudience(); }
      else if (act === 'raz') { S.crit = critDefaut(); S.nom = ''; S.confirm = null; S.message = null; rendre(); planifierAudience(); }
      else if (act === 'lancer') { S.confirm = t.dataset.mode; S.message = null; rendreAudience(); }
      else if (act === 'annuler') { S.confirm = null; rendreAudience(); }
      else if (act === 'confirmer') lancer();
      else if (act === 'export') exporter();
    });
    corps.addEventListener('input', ev => {
      const f = ev.target.dataset && ev.target.dataset.champ; if (!f) return;
      if (f === 'nom') { const avant = !!S.nom.trim(); S.nom = ev.target.value; if (avant !== !!S.nom.trim()) majBoutons(); return; }
      if (f === 'motif') { const avant = !!S.motif.trim(); S.motif = ev.target.value; if (avant !== !!S.motif.trim()) majBoutons(); return; }
      if (f === 'age_min_mois' || f === 'age_max_mois') { const v = ev.target.value; S.crit[f] = v === '' ? null : Math.max(0, parseInt(v, 10) || 0); planifierAudience(); }
    });
    corps.addEventListener('change', ev => {
      const f = ev.target.dataset && ev.target.dataset.champ; if (!f) return;
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

    // ------------------------------------------------------------- bus de site
    (function lier(n) {
      const b = bus();
      if (!b || typeof b.onChange !== 'function') { if ((n || 0) < 120) setTimeout(() => lier((n || 0) + 1), 250); return; }
      if (R.__mktLie) return; R.__mktLie = true;
      let dernier = JSON.stringify(sites());
      b.onChange(() => {
        if (!R.isConnected) return;
        const k = JSON.stringify(sites()); if (k === dernier) return; dernier = k;
        S.audience = null; S.confirm = null; S.message = null;
        chargerSynthese().then(() => { if (S.onglet === 'composer') chargerAudience(); });
      });
    })(0);

    rendre();
    await chargerSynthese();
  }
});
