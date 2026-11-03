// ============================================================================
//  NOUVEAU LEAD — APPELS ENTRANTS — module One Data (OD.define 'lead-appel')  v5
//
//  v5 (03/11/2026) : le formulaire s'adapte à la demande, pour que le vendeur
//    apprenne le plus possible en lisant l'e-mail et le lead :
//    · intérêt OCCASION : recherche d'un VO PRÉCIS dans le stock du groupe
//      (immatriculation, modèle, VIN ou n° de l'annonce teamcolin.fr) ; le
//      vendeur reçoit l'immat, le VIN, le prix, le km, où est la voiture et le
//      lien de l'annonce. Sans voiture précise : critères de recherche du
//      client (modèle, budget, km, année, énergie, boîte) ;
//    · intérêt NEUF : marque, modèle, motorisation, finition, délai ;
//    · ENTREPRISE : raison sociale, SIRET, nombre et type de véhicules,
//      financement (+ le véhicule neuf) ;
//    · APRÈS-VENTE : motif, véhicule, immatriculation, kilométrage ;
//    · demande de RENDEZ-VOUS : date et heure souhaitées + objet (obligatoire),
//      ESSAI : date souhaitée, REPRISE : véhicule du client détaillé ;
//    · projet (échéance, financement, budget), meilleur moment et canal pour
//      rappeler, note libre.
//    Le serveur (lead_appel_creer, détails) rédige le message rubrique par
//    rubrique ; l'écran de confirmation montre ce que reçoit le vendeur.
//  v4 (03/11/2026) : « Modèle souhaité » devient la liste des modèles de la
//    marque choisie (Toyota ou Lexus, référentiel msg_modele_vehicule via
//    lead_appel_modeles), avec « Autre modèle… » en saisie libre. Une fiche
//    client dont le prénom et le nom sont dans le même champ (« Antoine
//    Raguet » en NOM, prénom vide) est séparée : mot en capitales = nom,
//    sinon premier mot = prénom, le reste = nom.
//  v3 (03/11/2026) : deux portes d'entrée.
//    · bouton « Nouveau lead » de la FICHE CLIENT (fiche-shell v15) : la
//      fenêtre s'ouvre pré-remplie avec ce client (API window.__odLeadAppel
//      .ouvrir(client)) ;
//    · bouton « Nouveau lead » de la TOP NAV : formulaire VIERGE, pour un
//      appelant inconnu de la base (il n'est plus pré-rempli avec le client
//      sélectionné).
//  v2 (03/11/2026) : fenêtre au niveau du « Nouveau lead » de la Vroom Team.
//    · client sélectionné dans la Base client : formulaire PRÉ-REMPLI d'office
//      (civilité, prénom, nom, entreprise, portable, e-mail), « Autre client »
//      pour repartir de zéro ;
//    · entreprise, nature (VN, VO, Entreprise, après-vente), type de demande
//      (Essai, Info, Offre, Rendez-vous), marque (déduite de la concession),
//      modèle souhaité, rappel (date et heure), qualification pour le vendeur ;
//    · concessions avec leurs vendeurs et leurs leads en attente ; choix du
//      vendeur (ou Pool de la concession, selon sa règle d'attribution) ;
//    · demandes déjà ouvertes pour le même client (portable ou e-mail, 60
//      jours) montrées avant de créer, avec « Créer quand même ».
//  v1 (03/11/2026) : accès « Appels entrants » de Team Colin (rôle 13). Les
//  équipes qui décrochent les appels entrants créent, le cas échéant, un lead
//  versé dans l'une des concessions pilotes (Arcueil, L'Haÿ-les-Roses,
//  Sceaux TT92 — réglage appel_entrant_sites en base).
//
//  Le lead suit le circuit des leads One Data (RPC lead_appel_creer ->
//  lead_ingerer) : client retrouvé ou créé, cycle ouvert sur la concession,
//  attribution au vendeur par les règles de la concession. Aucun lien BACS.
//
//  Ancre posée par la top nav (v42) pour le rôle 13 : <div id="od-lead-appel"
//  data-od-module="lead-appel">. Le module affiche le bouton « + Nouveau
//  lead » et sa fenêtre. Si un client est sélectionné (barre client), la
//  fenêtre propose de partir de sa fiche : nom, téléphone et e-mail remplis.
//
//  Charte One Data : bleus #1F4A85 / #2a5ea9, vert #53bda7, rouge #e24b4a,
//  Nunito Sans — jamais de noir.
// ============================================================================
try { if (window.OD && OD.persistent && OD.persistent.add) OD.persistent.add('lead-appel'); } catch (e) { }

OD.define('lead-appel', {
  mount(__anchor, ctx) {
    const VER = 5;
    const W = (window.wwLib && wwLib.getFrontWindow && wwLib.getFrontWindow()) || window;
    const doc = __anchor.ownerDocument || document;
    const sb = (ctx && ctx.supabase) || (window.wwLib && wwLib.wwPlugins && wwLib.wwPlugins.supabase && wwLib.wwPlugins.supabase.instance);
    const LANG_PREFIX = '/fr';
    const PAGE_UID = { '/fiche-client': '259f1951-a2d4-4b90-ac83-0b3febe1d4ec' };
    const VAR_CLIENT = '55490583-c88b-4748-916e-4d203db07742';

    function esc(s) { return s == null ? '' : String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
    function inEditor() { try { return window.self !== window.top; } catch (e) { return true; } }
    function propre(s) {
      return String(s || '').split(/(\s+)/).map(function (w) {
        if (/\d/.test(w)) return w.toUpperCase();          // TT92, XII… restent tels quels
        return w.toLowerCase().replace(/(^|[\-'’])([a-zà-ÿ])/g, function (m, a, b) { return a + b.toUpperCase(); });
      }).join('');
    }
    function goPage(path) {
      const uid = PAGE_UID[path];
      if (inEditor()) { if (uid) { try { wwLib.wwApp.goTo(uid); return; } catch (e) { } try { wwLib.goTo(uid); } catch (e) { } } return; }
      try { wwLib.goTo(LANG_PREFIX + path); return; } catch (e) { }
      try { W.location.href = LANG_PREFIX + path; } catch (e) { }
    }

    // ---------------------------------------------------------------- style
    const CSS =
      '#od-lead-appel{display:flex;align-items:center}' +
      '.lap-btn{display:inline-flex;align-items:center;gap:7px;height:36px;padding:0 14px;border:none;border-radius:10px;background:#2a5ea9;color:#fff;font:800 13px "Nunito Sans",system-ui,sans-serif;cursor:pointer;white-space:nowrap}' +
      '.lap-btn:hover{background:#1F4A85}' +
      '.lap-btn svg{width:16px;height:16px}' +
      '.lap-ov{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:flex-start;justify-content:center;padding:28px 16px;background:rgba(31,74,133,.42);overflow-y:auto;font-family:"Nunito Sans",system-ui,sans-serif;color:#1F4A85}' +
      '.lap-box{background:#fff;border-radius:16px;width:100%;max-width:680px;box-shadow:0 30px 80px rgba(31,74,133,.35)}' +
      '.lap-h{display:flex;justify-content:space-between;align-items:flex-start;gap:12px;padding:20px 22px 12px;border-bottom:1px solid #eef2f8}' +
      '.lap-h h2{margin:0;font-size:18px;font-weight:800}' +
      '.lap-h p{margin:3px 0 0;font-size:13px;color:#7a98c5}' +
      '.lap-x{border:none;background:#f2f6fc;color:#2a5ea9;width:34px;height:34px;border-radius:9px;cursor:pointer;font-size:18px;line-height:1}' +
      '.lap-b{padding:14px 22px 6px}' +
      '.lap-sec{margin-bottom:14px}' +
      '.lap-sec h3{margin:0 0 8px;font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#7a98c5}' +
      '.lap-g2{display:grid;grid-template-columns:1fr 1fr;gap:10px}' +
      '.lap-q{display:flex;flex-direction:column;gap:4px;font-size:12px;font-weight:700;color:#5a7ba8}' +
      '.lap-q input,.lap-q select,.lap-q textarea{font:600 14px "Nunito Sans",system-ui,sans-serif;color:#1F4A85;border:1.5px solid #e3edf9;border-radius:10px;padding:9px 11px;background:#fff;outline:none;width:100%;box-sizing:border-box}' +
      '.lap-q input:focus,.lap-q select:focus,.lap-q textarea:focus{border-color:#2a5ea9}' +
      '.lap-q textarea{resize:vertical;min-height:74px}' +
      '.lap-sites{display:grid;grid-template-columns:repeat(3,1fr);gap:8px}' +
      '.lap-site em{display:block;font-style:normal;font-size:11.5px;color:#2a5ea9;font-weight:700;margin-top:4px}' +
      '.lap-dbl{background:#fff8e8;border:1.5px solid #f3dca6;border-radius:12px;padding:12px 14px;margin-bottom:14px}' +
      '.lap-dbl h3{margin:0 0 6px;font-size:14px;font-weight:800;color:#1F4A85;text-transform:none;letter-spacing:0}' +
      '.lap-dbl li{font-size:13px;color:#5a7ba8;margin:3px 0}' +
      '.lap-dbl ul{margin:0;padding-left:18px}' +
      '.lap-site{border:1.5px solid #e3edf9;border-radius:12px;padding:10px 12px;cursor:pointer;background:#fff;text-align:left;font:inherit;color:#1F4A85}' +
      '.lap-site b{display:block;font-size:14px;font-weight:800}' +
      '.lap-site small{display:block;font-size:11.5px;color:#7a98c5;margin-top:2px}' +
      '.lap-site.on{border-color:#2a5ea9;background:#eef4fc;box-shadow:inset 0 0 0 1px #2a5ea9}' +
      '.lap-seg{display:flex;gap:6px;flex-wrap:wrap}' +
      '.lap-seg button{border:1.5px solid #e3edf9;background:#fff;color:#2a5ea9;border-radius:999px;padding:7px 13px;font:700 13px "Nunito Sans",system-ui,sans-serif;cursor:pointer}' +
      '.lap-seg button.on{background:#2a5ea9;border-color:#2a5ea9;color:#fff}' +
      '.lap-cli{display:flex;justify-content:space-between;align-items:center;gap:10px;background:#f2f6fc;border-radius:12px;padding:10px 12px;margin-bottom:12px;font-size:13px}' +
      '.lap-cli button{border:none;background:none;color:#2a5ea9;font:800 12.5px "Nunito Sans",system-ui,sans-serif;cursor:pointer;white-space:nowrap}' +
      '.lap-err{background:#fdf1f1;color:#c43c3b;border-radius:10px;padding:9px 12px;font-size:13px;font-weight:700;margin-bottom:10px}' +
      '.lap-hint{font-size:12px;color:#7a98c5;margin:6px 0 0}' +
      '.lap-f{display:flex;gap:9px;justify-content:flex-end;padding:12px 22px 18px;border-top:1px solid #eef2f8}' +
      '.lap-f button{height:42px;border-radius:10px;padding:0 18px;font:800 14px "Nunito Sans",system-ui,sans-serif;cursor:pointer}' +
      '.lap-pri{border:none;background:#2a5ea9;color:#fff}' +
      '.lap-pri[disabled]{opacity:.6;cursor:wait}' +
      '.lap-sec2{border:1.5px solid #e3edf9;background:#fff;color:#2a5ea9}' +
      '.lap-ok{text-align:center;padding:26px 22px 10px}' +
      '.lap-ok .ic{width:54px;height:54px;border-radius:50%;background:#53bda7;color:#fff;display:inline-flex;align-items:center;justify-content:center;font-size:28px;font-weight:900;margin-bottom:10px}' +
      '.lap-ok .ic.att{background:#e6a817}' +
      '.lap-ok h3{margin:0 0 6px;font-size:18px;font-weight:800}' +
      '.lap-ok p{margin:4px 0;font-size:14px;color:#5a7ba8}' +
      '.lap-g3{display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px}' +
      '.lap-bloc{background:#f7faff;border:1.5px solid #e3edf9;border-radius:12px;padding:12px;margin-bottom:10px}' +
      '.lap-bloc h4{margin:0 0 8px;font-size:13px;font-weight:800;color:#1F4A85}' +
      '.lap-bloc.rdv{background:#eef8f5;border-color:#bfe5db}' +
      '.lap-mt{margin-top:10px}' +
      '.lap-lab{font-size:12px;font-weight:700;color:#5a7ba8;margin:0 0 5px}' +
      '.lap-vos{display:flex;flex-direction:column;gap:6px;margin-top:8px;max-height:270px;overflow-y:auto}' +
      '.lap-vo{display:flex;justify-content:space-between;gap:10px;align-items:center;border:1.5px solid #e3edf9;border-radius:10px;padding:8px 11px;background:#fff;cursor:pointer;text-align:left;font:inherit;color:#1F4A85;width:100%}' +
      '.lap-vo:hover{border-color:#2a5ea9}' +
      '.lap-vo b{font-size:13.5px;font-weight:800}' +
      '.lap-vo small{display:block;font-size:12px;color:#5a7ba8;margin-top:2px}' +
      '.lap-vo .px{font-size:15px;font-weight:800;color:#2a5ea9;white-space:nowrap}' +
      '.lap-vo .tag{display:inline-block;font-size:10.5px;font-weight:800;border-radius:6px;padding:1px 6px;margin-left:6px;background:#eef8f5;color:#2f8f7a;vertical-align:1px}' +
      '.lap-vo .tag.hors{background:#f2f6fc;color:#7a98c5}' +
      '.lap-vo.on{border-color:#53bda7;background:#f3fbf9;cursor:default}' +
      '.lap-lien{border:none;background:none;color:#2a5ea9;font:800 12.5px "Nunito Sans",system-ui,sans-serif;cursor:pointer;padding:0}' +
      '.lap-msg{white-space:pre-wrap;text-align:left;background:#f7faff;border:1.5px solid #e3edf9;border-radius:12px;padding:12px 14px;font:600 12.5px/1.55 "Nunito Sans",system-ui,sans-serif;color:#1F4A85;margin:12px 0 0;max-height:300px;overflow-y:auto;word-break:break-word}' +
      '@media (max-width:620px){.lap-g3{grid-template-columns:1fr}.lap-g2,.lap-sites{grid-template-columns:1fr}.lap-btn span{display:none}}';
    if (!doc.getElementById('lap-css')) {
      const st = doc.createElement('style'); st.id = 'lap-css'; st.textContent = CSS;
      (doc.head || doc.documentElement).appendChild(st);
    }

    // ---------------------------------------------------------------- bouton
    __anchor.innerHTML = '<button type="button" class="lap-btn" title="Créer un lead pour une concession">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>' +
      '<span>Nouveau lead</span></button>';
    __anchor.querySelector('.lap-btn').addEventListener('click', function () { ouvrir(null); });
    // API pour la fiche client (fiche-shell v15) : ouvrir(client) pré-remplit.
    const API = { version: VER, ouvrir: function (c) { return ouvrir(c || null); } };
    try { W.__odLeadAppel = API; } catch (e) { }
    try { window.__odLeadAppel = API; } catch (e) { }

    // ---------------------------------------------------------------- fenêtre
    let ov = null, S = null, sites = null, modeles = null;
    const AUTRE = '__autre__';
    function modelesDe(marque) { return (modeles || []).filter(function (m) { return m.marque === marque; }).map(function (m) { return m.modele; }); }
    function champModele() {
      const liste_ = modelesDe(S.marque);
      if (!liste_.length && modeles == null) return champ('modele', 'Modèle souhaité', 'text', 'Chargement des modèles…');
      const connu = !S.modele || liste_.indexOf(S.modele) !== -1;
      const autre = S.modeleAutre || !connu;
      let h = '<label class="lap-q">Modèle souhaité<select data-k="modele_choix"><option value="">— Choisir un modèle ' + esc(S.marque) + ' —</option>' +
        liste_.map(function (m) { return '<option value="' + esc(m) + '"' + (!autre && S.modele === m ? ' selected' : '') + '>' + esc(m) + '</option>'; }).join('') +
        '<option value="' + AUTRE + '"' + (autre ? ' selected' : '') + '>Autre modèle…</option></select></label>';
      if (autre) h += '<input data-k="modele" type="text" value="' + esc(S.modele) + '" placeholder="Modèle, autre marque…" style="margin-top:6px;font:600 14px \'Nunito Sans\',system-ui,sans-serif;color:#1F4A85;border:1.5px solid #e3edf9;border-radius:10px;padding:9px 11px;width:100%;box-sizing:border-box">';
      return '<div>' + h + '</div>';
    }
    const vendeursParSite = {};
    const NATURES = [['VN', 'Véhicule neuf'], ['VO', 'Occasion'], ['Entreprise', 'Entreprise / flotte'], ['APV', 'Après-vente']];
    const DEMANDES = ['Information', 'Offre de prix', 'Essai', 'Rendez-vous', 'Reprise'];
    const DEMANDES_APV = ['Rendez-vous', 'Offre de prix', 'Information'];
    const ENERGIES = ['', 'Hybride', 'Hybride rechargeable', 'Électrique', 'Essence', 'Diesel', 'Hydrogène'];
    const BOITES = ['', 'Automatique', 'Manuelle'];
    const DELAIS = ['', 'Dès que possible', 'Sous 1 mois', '1 à 3 mois', '3 à 6 mois', 'Plus de 6 mois'];
    const FINANCEMENTS = ['', 'Comptant', 'Crédit', 'LOA', 'LLD', 'À définir'];
    const PLAGES = ['', 'le matin', 'entre midi et deux', 'l’après-midi', 'après 18h', 'le samedi'];
    const CANAUX = ['', 'téléphone', 'SMS', 'e-mail', 'WhatsApp'];
    const ETATS = ['', 'Très bon état', 'Bon état', 'État moyen', 'À réparer'];
    const OBJETS_RDV = ['Découverte et présentation', 'Essai', 'Offre / signature', 'Estimation de la reprise', 'Livraison'];
    const OBJETS_RDV_APV = ['Entretien / révision', 'Réparation / diagnostic', 'Carrosserie', 'Pneumatiques', 'Contrôle technique', 'Garantie / rappel constructeur'];
    const TYPES_FLOTTE = ['', 'Véhicules particuliers', 'Utilitaires', 'Mixte'];

    function vierge() {
      return { id_site: null, id_vendeur: '', civilite: 'M.', prenom: '', nom: '', entreprise: '', telephone: '', email: '',
               nature: 'VN', type_demande: 'Information', marque: 'Toyota', modele: '', energie: '', finition: '', delai: '',
               vo: null, voq: '', voRes: null, voCharg: false,
               vr_modele: '', vr_budget: '', vr_km: '', vr_annee: '', vr_energie: '', vr_boite: '',
               ent_siret: '', ent_nb: '', ent_type: '', ent_fin: '',
               apv_motif: '', apv_vehicule: '', apv_immat: '', apv_km: '',
               rdv_le: '', rdv_objet: '', essai_le: '',
               rep: '', rep_vehicule: '', rep_annee: '', rep_km: '', rep_immat: '', rep_etat: '',
               pj_echeance: '', pj_fin: '', pj_budget: '',
               rappel: '', plage: '', canal: '', commentaire: '',
               id_client: null, client: null, err: null, envoi: false, res: null, doublons: null };
    }
    function depuisClient(c) {
      S.id_client = c.IDVu; S.client = c;
      S.civilite = /^(mme|mlle|madame|mademoiselle)/i.test(String(c.CIVILITE || '')) ? 'Mme' : 'M.';
      S.prenom = c.PRENOM || ''; S.nom = c.NOM || '';
      if (Number(c.idmultivu) === 1) { S.entreprise = c.NOM || ''; S.nature = 'Entreprise'; }
      else if (!String(S.prenom).trim()) {
        // Prénom et nom saisis ensemble dans NOM : on les sépare.
        const mots = String(S.nom).trim().split(/\s+/);
        if (mots.length >= 2) {
          const caps = mots.filter(function (m) { return /[A-ZÀ-Ý]/.test(m) && m === m.toUpperCase(); });
          if (caps.length && caps.length < mots.length) {
            S.nom = caps.join(' ');
            S.prenom = mots.filter(function (m) { return caps.indexOf(m) === -1; }).join(' ');
          } else {
            S.prenom = mots[0]; S.nom = mots.slice(1).join(' ');
          }
        }
      }
      S.telephone = c.TEl_MOB || c.TEL_FIXE || ''; S.email = c.EMAIL || '';
    }
    function siteCourant() { return (sites || []).filter(function (s) { return String(s.id_site) === String(S.id_site); })[0] || null; }
    function nomSite(s) { return propre(String(s || '').replace(/\s+-\s+(TOYOTA|LEXUS)$/i, '')); }

    async function ouvrir(client) {
      if (ov) return;
      S = vierge();
      ov = doc.createElement('div'); ov.className = 'lap-ov';
      (doc.body || doc.documentElement).appendChild(ov);
      ov.addEventListener('mousedown', function (e) { if (e.target === ov) fermer(); });
      ov.addEventListener('click', surClic);
      ov.addEventListener('input', surSaisie);
      ov.addEventListener('change', surChange);
      doc.addEventListener('keydown', surTouche);
      // Ouverte depuis une fiche client : formulaire pré-rempli avec ce client.
      // Depuis la top nav : formulaire vierge (appelant inconnu).
      const cc = client && client.IDVu != null ? client : null;
      if (cc) {
        let c = cc;
        if ((c.NOM == null || c.TEl_MOB === undefined) && sb) {
          try {
            const r = await sb.from('CLIENT').select('IDVu,CIVILITE,PRENOM,NOM,TEl_MOB,TEL_FIXE,EMAIL,idmultivu').eq('IDVu', Number(c.IDVu)).maybeSingle();
            if (r && r.data) c = r.data;
          } catch (e) { }
        }
        if (c.NOM != null) depuisClient(c);
      }
      peindre();
      if (!sites) {
        if (!modeles) { sb.rpc('lead_appel_modeles').then(function (r) { modeles = (r && r.data) || []; peindre(); }, function () { modeles = []; peindre(); }); }
        try { const r = await sb.rpc('lead_appel_concessions'); if (r.error) throw r.error; sites = r.data || []; }
        catch (e) { sites = []; S.err = (e && e.message) || 'Concessions indisponibles.'; }
      }
      if (sites.length === 1) choisirSite(sites[0].id_site); else peindre();
      setTimeout(function () { const f = ov && ov.querySelector(S.client ? '[data-a="nature"]' : '[data-k="prenom"]'); if (f) try { f.focus(); } catch (e) { } }, 30);
    }
    function fermer() {
      if (!ov) return;
      try { ov.remove(); } catch (e) { }
      ov = null; doc.removeEventListener('keydown', surTouche);
    }
    function surTouche(e) { if (e.key === 'Escape') fermer(); }

    async function choisirSite(id) {
      S.id_site = Number(id); S.id_vendeur = ''; S.err = null; S.doublons = null;
      const s = siteCourant();
      if (s) S.marque = /lexus/i.test(s.reseau || '') ? 'Lexus' : 'Toyota';
      if (S.modele && !S.modeleAutre && modeles && modelesDe(S.marque).indexOf(S.modele) === -1) S.modele = '';
      peindre();
      if (!vendeursParSite[S.id_site]) {
        try { const r = await sb.rpc('lead_appel_vendeurs', { p_id_site: S.id_site }); vendeursParSite[S.id_site] = (r && r.data) || []; }
        catch (e) { vendeursParSite[S.id_site] = []; }
        peindre();
      }
    }

    function champ(k, lib, type, ph) {
      return '<label class="lap-q">' + esc(lib) + '<input data-k="' + k + '" type="' + (type || 'text') + '" value="' + esc(S[k]) + '"' + (ph ? ' placeholder="' + esc(ph) + '"' : '') + '></label>';
    }
    function liste(k, lib, opts) {
      return '<label class="lap-q">' + esc(lib) + '<select data-k="' + k + '">' + opts.map(function (o) {
        const v = Array.isArray(o) ? o[0] : o, t = Array.isArray(o) ? o[1] : o;
        return '<option value="' + esc(v) + '"' + (String(S[k]) === String(v) ? ' selected' : '') + '>' + esc(t) + '</option>';
      }).join('') + '</select></label>';
    }
    function pluriel(n, un, plus) { n = Number(n) || 0; return n + ' ' + (n > 1 ? plus : un); }
    function jourHeure(v) { const d = new Date(v); return isNaN(d) ? '' : d.toLocaleDateString('fr-FR') + ' à ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); }

    // ---------------------------------------------------------------- demande
    function seg(a, opts, cur) {
      return '<div class="lap-seg">' + opts.map(function (o) {
        const v = Array.isArray(o) ? o[0] : o, t = Array.isArray(o) ? o[1] : o;
        return '<button type="button" data-a="' + a + '" data-id="' + esc(v) + '" class="' + (String(cur) === String(v) ? 'on' : '') + '">' + esc(t) + '</button>';
      }).join('') + '</div>';
    }
    function opt(list) { return list.map(function (v) { return [v, v || '—']; }); }
    function maintenantLocal() {
      const d = new Date(Date.now() - new Date().getTimezoneOffset() * 60000);
      return d.toISOString().slice(0, 16);
    }
    function champDate(k, lib) {
      return '<label class="lap-q">' + esc(lib) + '<input data-k="' + k + '" type="datetime-local" min="' + maintenantLocal() + '" value="' + esc(S[k]) + '"></label>';
    }
    function nf(n) { return n == null || n === '' ? '' : Math.round(Number(n)).toLocaleString('fr-FR'); }
    function voLigne(v) {
      return [v.annee, v.km != null ? nf(v.km) + ' km' : null, v.energie, v.boite, v.couleur].filter(Boolean).join(' · ');
    }
    function voCarte(v, i, choisi) {
      return '<button type="button" class="lap-vo' + (choisi ? ' on' : '') + '"' + (choisi ? '' : ' data-a="vo" data-id="' + i + '"') + '>' +
        '<span><b>' + esc([v.marque, v.modele].filter(Boolean).join(' ')) + '</b> <span style="font-weight:600">' + esc(v.version || '') + '</span>' +
        '<small>' + esc(voLigne(v)) + '</small>' +
        '<small>' + esc(v.immat || '') + ' · ' + esc(nomSite(v.site)) +
          (v.lieu && nomSite(v.lieu).toUpperCase() !== nomSite(v.site).toUpperCase() ? ' (actuellement à ' + esc(propre(v.lieu)) + ')' : '') +
          (v.statut === 'PREVISION_RENTREE' ? ' · arrivage prévu' : '') + '<span class="tag' + (v.pilote ? '' : ' hors') + '">' + (v.pilote ? 'site pilote' : 'autre site') + '</span>' +
          (v.annonce ? '<span class="tag">annonce en ligne</span>' : '') + '</small></span>' +
        '<span class="px">' + (v.prix != null ? esc(nf(v.prix)) + ' €' : '') + '</span></button>';
    }
    function voResHtml() {
      if (S.voCharg) return '<p class="lap-hint">Recherche…</p>';
      if (S.voRes == null) return '<p class="lap-hint">Immatriculation, modèle, VIN ou n° de l’annonce (ex. « HB-120-JH », « yaris cross hybride », « 5109279 »).</p>';
      if (!S.voRes.length) return '<p class="lap-hint">Aucune occasion en stock ne correspond. Vérifiez la référence, ou laissez vide et décrivez la recherche du client ci-dessous.</p>';
      return '<div class="lap-vos">' + S.voRes.map(function (v, i) { return voCarte(v, i, false); }).join('') + '</div>';
    }
    let voMinuteur = null, voJeton = 0;
    function chercherVO() {
      clearTimeout(voMinuteur);
      const q = String(S.voq || '').trim();
      if (q.length < 2) { S.voRes = null; S.voCharg = false; majVO(); return; }
      voMinuteur = setTimeout(async function () {
        const j = ++voJeton; S.voCharg = true; majVO();
        let res = [];
        try { const r = await sb.rpc('lead_appel_vo_chercher', { p_q: q, p_limite: 12 }); if (r.error) throw r.error; res = r.data || []; }
        catch (e) { res = []; }
        if (j !== voJeton) return;
        S.voCharg = false; S.voRes = res; majVO();
      }, 300);
    }
    function majVO() { const z = ov && ov.querySelector('#lap-vores'); if (z) z.innerHTML = voResHtml(); }

    function blocDemande() {
      const apv = S.nature === 'APV', vo = S.nature === 'VO', ent = S.nature === 'Entreprise';
      const dems = apv ? DEMANDES_APV : DEMANDES;
      if (dems.indexOf(S.type_demande) === -1) S.type_demande = dems[0];
      let h = '<div class="lap-sec"><h3>Demande</h3>' +
        '<p class="lap-lab">Intérêt du client *</p>' + seg('nature', NATURES, S.nature) +
        '<p class="lap-lab" style="margin-top:12px">Il appelle pour *</p>' + seg('demande', dems, S.type_demande) + '<div class="lap-mt"></div>';

      // RDV / essai : en tête, c'est ce que le vendeur doit traiter d'abord.
      if (S.type_demande === 'Rendez-vous') {
        h += '<div class="lap-bloc rdv"><h4>Rendez-vous souhaité</h4><div class="lap-g2">' +
          champDate('rdv_le', 'Date et heure souhaitées *') +
          liste('rdv_objet', 'Objet du rendez-vous', [['', '—']].concat(opt(apv ? OBJETS_RDV_APV : OBJETS_RDV))) + '</div>' +
          '<p class="lap-hint">Le vendeur confirme le créneau au client.</p></div>';
      } else if (S.type_demande === 'Essai') {
        h += '<div class="lap-bloc rdv"><h4>Essai</h4><div class="lap-g2">' + champDate('essai_le', 'Date souhaitée pour l’essai') + '<div></div></div></div>';
      }

      if (vo) {
        h += '<div class="lap-bloc"><h4>Véhicule d’occasion</h4>';
        if (S.vo) {
          h += voCarte(S.vo, 0, true) +
            '<div style="display:flex;justify-content:space-between;gap:10px;margin-top:6px">' +
            (S.vo.annonce ? '<a class="lap-lien" href="' + esc(S.vo.annonce) + '" target="_blank" rel="noopener">Voir l’annonce ↗</a>' : '<span></span>') +
            '<button type="button" class="lap-lien" data-a="vo-changer">Changer de véhicule</button></div>';
          if (!S.vo.pilote) h += '<p class="lap-hint">Cette voiture est en stock à ' + esc(nomSite(S.vo.site)) + ', hors sites pilotes : choisissez ci-dessous la concession qui traitera la demande.</p>';
        } else {
          h += '<label class="lap-q">Rechercher dans le stock du groupe<input data-k="voq" type="search" value="' + esc(S.voq) + '" placeholder="Immat, modèle, VIN ou n° d’annonce" autocomplete="off"></label>' +
            '<div id="lap-vores">' + voResHtml() + '</div>' +
            '<p class="lap-lab" style="margin-top:12px">Pas de voiture précise ? Ce que cherche le client :</p>' +
            '<div class="lap-g3">' + champ('vr_modele', 'Modèle(s)', 'text', 'C-HR, RAV4…') + champ('vr_budget', 'Budget', 'text', '20 000 €') + champ('vr_km', 'Km maximum', 'text', '50 000') + '</div>' +
            '<div class="lap-g3 lap-mt">' + champ('vr_annee', 'Année minimum', 'text', '2021') + liste('vr_energie', 'Énergie', opt(ENERGIES)) + liste('vr_boite', 'Boîte', opt(BOITES)) + '</div>';
        }
        h += '</div>';
      }
      if (S.nature === 'VN' || ent) {
        h += '<div class="lap-bloc"><h4>Véhicule neuf</h4><div class="lap-g2">' + liste('marque', 'Marque', ['Toyota', 'Lexus']) + champModele() + '</div>' +
          '<div class="lap-g3 lap-mt">' + liste('energie', 'Motorisation', opt(ENERGIES)) + champ('finition', 'Finition / couleur', 'text', 'Design, GR Sport…') + liste('delai', 'Livraison souhaitée', opt(DELAIS)) + '</div></div>';
      }
      if (ent) {
        h += '<div class="lap-bloc"><h4>Entreprise</h4><div class="lap-g2">' + champ('entreprise', 'Raison sociale') + champ('ent_siret', 'SIRET', 'text', '14 chiffres') + '</div>' +
          '<div class="lap-g3 lap-mt">' + champ('ent_nb', 'Nombre de véhicules', 'number') + liste('ent_type', 'Type de flotte', opt(TYPES_FLOTTE)) + liste('ent_fin', 'Financement', opt(FINANCEMENTS)) + '</div></div>';
      }
      if (apv) {
        h += '<div class="lap-bloc"><h4>Après-vente</h4><div class="lap-g2">' +
          liste('apv_motif', 'Motif', [['', '—']].concat(opt(OBJETS_RDV_APV)).concat([['Autre', 'Autre (préciser dans la note)']])) + champ('apv_vehicule', 'Véhicule', 'text', 'Toyota Yaris 2019') + '</div>' +
          '<div class="lap-g2 lap-mt">' + champ('apv_immat', 'Immatriculation', 'text', 'AB-123-CD') + champ('apv_km', 'Kilométrage', 'text') + '</div></div>';
      }

      if (!apv) {
        const repOui = S.rep === 'oui' || S.type_demande === 'Reprise';
        h += '<div class="lap-bloc"><h4>Reprise d’un véhicule</h4>' +
          (S.type_demande === 'Reprise' ? '' : seg('rep', [['oui', 'Oui'], ['non', 'Non'], ['', 'Pas abordé']], S.rep));
        if (repOui) {
          h += '<div class="lap-g3' + (S.type_demande === 'Reprise' ? '' : ' lap-mt') + '">' + champ('rep_vehicule', 'Véhicule', 'text', 'Peugeot 208 1.2') + champ('rep_annee', 'Année', 'text') + champ('rep_km', 'Kilométrage', 'text') + '</div>' +
            '<div class="lap-g2 lap-mt">' + champ('rep_immat', 'Immatriculation', 'text') + liste('rep_etat', 'État', opt(ETATS)) + '</div>';
        }
        h += '</div>';
        h += '<div class="lap-bloc"><h4>Projet</h4><div class="lap-g3">' + liste('pj_echeance', 'Échéance', opt(DELAIS)) +
          (ent ? '<div></div>' : liste('pj_fin', 'Financement', opt(FINANCEMENTS))) + champ('pj_budget', 'Budget / mensualité', 'text', '25 000 € ou 300 €/mois') + '</div></div>';
      }

      h += '<div class="lap-bloc"><h4>Recontacter le client</h4><div class="lap-g3">' +
        champDate('rappel', S.type_demande === 'Rendez-vous' ? 'Rappel avant le RDV' : 'Rappel à date') + liste('plage', 'De préférence', opt(PLAGES)) + liste('canal', 'Par', opt(CANAUX)) + '</div></div>';
      h += '<label class="lap-q">Note de l’appel<textarea data-k="commentaire" placeholder="Ce que le client a dit : contexte, questions, points d’attention…">' + esc(S.commentaire) + '</textarea></label></div>';
      return h;
    }

    function peindre() {
      if (!ov) return;
      const b0 = ov.querySelector('.lap-b'), pos = b0 ? b0.scrollTop : 0;
      const actif = doc.activeElement && ov.contains(doc.activeElement) ? doc.activeElement.getAttribute('data-k') : null;
      let h = '<div class="lap-box" role="dialog" aria-modal="true" aria-label="Nouveau lead">' +
        '<div class="lap-h"><div><h2>Nouveau lead</h2><p>Appel entrant : la demande part à la concession choisie, et au vendeur si vous le désignez.</p></div>' +
        '<button type="button" class="lap-x" data-a="fermer" aria-label="Fermer">×</button></div>';

      if (S.res) {
        const r = S.res;
        let titre, lignes = [], ok = r.action === 'ingere';
        if (r.action === 'ingere') {
          titre = 'Lead transmis à ' + nomSite(r.site || 'la concession');
          lignes.push(r.vendeur ? 'Attribué à ' + propre(r.vendeur) + ', qui rappellera le client.' : 'Il est dans le Pool de la concession : le premier vendeur disponible le prend.');
          if (S.type_demande === 'Rendez-vous' && S.rdv_le) lignes.push('Rendez-vous souhaité le ' + jourHeure(S.rdv_le) + ' : le vendeur le confirme au client.');
          else if (S.rappel) lignes.push('Rappel demandé le ' + jourHeure(S.rappel) + '.');
        } else if (r.action === 'doublon') {
          titre = 'Demande déjà reçue';
          lignes.push('Ce client a fait la même demande il y a moins de 24 heures : votre message a été ajouté à son lead.');
        } else if (r.action === 'resolution_incomplete') {
          titre = 'Lead enregistré';
          lignes.push('La fiche du client doit être rapprochée d’une fiche existante : la concession s’en charge.');
        } else {
          titre = 'Lead enregistré';
          lignes.push('Il sera traité par la concession.');
        }
        h += '<div class="lap-ok"><div class="ic' + (ok ? '' : ' att') + '">' + (ok ? '✓' : 'i') + '</div><h3>' + esc(titre) + '</h3>' +
          lignes.map(function (l) { return '<p>' + esc(l) + '</p>'; }).join('') +
          (r.message ? '<p class="lap-lab" style="margin-top:14px;text-align:left">Ce que reçoit le vendeur</p><div class="lap-msg">' + esc(r.message) + '</div>' : '') + '</div>' +
          '<div class="lap-f">' +
          (r.id_client ? '<button type="button" class="lap-sec2" data-a="fiche" data-id="' + esc(r.id_client) + '">Ouvrir la fiche client</button>' : '') +
          '<button type="button" class="lap-sec2" data-a="autre">Nouveau lead</button>' +
          '<button type="button" class="lap-pri" data-a="fermer">Fermer</button></div></div>';
        ov.innerHTML = h; return;
      }

      h += '<div class="lap-b">';
      if (S.err) h += '<div class="lap-err">' + esc(S.err) + '</div>';
      if (S.client) {
        h += '<div class="lap-cli"><span>Client : <b>' + esc([S.client.PRENOM, S.client.NOM].filter(Boolean).join(' ')) + '</b> — formulaire pré-rempli</span>' +
          '<button type="button" data-a="vider">Autre client</button></div>';
      }
      if (S.doublons && S.doublons.length) {
        h += '<div class="lap-dbl"><h3>Ce client a déjà une demande ouverte</h3><ul>' + S.doublons.map(function (d) {
          return '<li><b>' + esc(propre(d.nom) || 'Client') + '</b> · ' + esc([d.source, d.vehicule, d.site ? nomSite(d.site) : null,
            d.recu_le ? 'reçue le ' + new Date(d.recu_le).toLocaleDateString('fr-FR') : null,
            d.vendeur ? 'suivie par ' + propre(d.vendeur) : 'dans le Pool'].filter(Boolean).join(' · ')) + '</li>';
        }).join('') + '</ul><p class="lap-hint">Si c’est bien une nouvelle demande, créez-la quand même ; sinon, prévenez le vendeur qui la suit.</p></div>';
      }

      h += '<div class="lap-sec"><h3>Client</h3>' +
        '<div class="lap-g2" style="margin-bottom:10px">' + liste('civilite', 'Civilité *', [['M.', 'M.'], ['Mme', 'Mme']]) + (S.nature === 'Entreprise' ? '<div></div>' : champ('entreprise', 'Entreprise')) + '</div>' +
        '<div class="lap-g2" style="margin-bottom:10px">' + champ('prenom', 'Prénom') + champ('nom', 'Nom *') + '</div>' +
        '<div class="lap-g2">' + champ('telephone', 'Portable', 'tel', '06 12 34 56 78') + champ('email', 'E-mail', 'email', 'nom@exemple.fr') + '</div>' +
        '<p class="lap-hint">Au moins l’un des deux : portable ou e-mail.</p></div>';

      h += blocDemande();

      h += '<div class="lap-sec"><h3>Concession *</h3>';
      if (sites == null) h += '<p class="lap-hint">Chargement des concessions…</p>';
      else if (!sites.length) h += '<p class="lap-hint">Aucune concession disponible.</p>';
      else h += '<div class="lap-sites">' + sites.map(function (s) {
        return '<button type="button" class="lap-site' + (String(S.id_site) === String(s.id_site) ? ' on' : '') + '" data-a="site" data-id="' + s.id_site + '">' +
          '<b>' + esc(nomSite(s.site)) + '</b><small>' + esc(propre(s.reseau || '')) + ' · ' + esc(pluriel(s.vendeurs, 'vendeur', 'vendeurs')) + '</small>' +
          '<em>' + esc(pluriel(s.en_attente, 'lead en attente', 'leads en attente')) + '</em></button>';
      }).join('') + '</div>';
      if (S.id_site) {
        const vs = vendeursParSite[S.id_site];
        h += '<div style="margin-top:10px">';
        if (!vs) h += '<p class="lap-hint">Chargement des vendeurs…</p>';
        else h += liste('id_vendeur', 'Vendeur', [['', 'Pool de la concession (règle d’attribution du site)']].concat(vs.map(function (v) {
          return [String(v.id_user), propre(v.nom) + (Number(v.en_attente) ? ' · ' + pluriel(v.en_attente, 'lead en attente', 'leads en attente') : '')];
        })));
        h += '</div>';
      }
      h += '</div>';

      const dbl = S.doublons && S.doublons.length;
      h += '</div><div class="lap-f"><button type="button" class="lap-sec2" data-a="fermer">Annuler</button>' +
        '<button type="button" class="lap-pri" data-a="' + (dbl ? 'forcer' : 'envoyer') + '"' + (S.envoi ? ' disabled' : '') + '>' +
        (S.envoi ? 'Envoi…' : dbl ? 'Créer quand même' : (S.id_vendeur ? 'Créer et envoyer au vendeur' : 'Envoyer à la concession')) + '</button></div></div>';
      ov.innerHTML = h;
      const b = ov.querySelector('.lap-b'); if (b) b.scrollTop = pos;
      if (actif) { const f = ov.querySelector('[data-k="' + actif + '"]'); if (f) try { f.focus(); } catch (e) { } }
    }

    function surSaisie(e) {
      const k = e.target.getAttribute && e.target.getAttribute('data-k');
      if (k) S[k] = e.target.value;
      if (k === 'voq') chercherVO();
      if (k === 'telephone' || k === 'email' || k === 'nom') { if (S.doublons) { S.doublons = null; peindre(); } }
    }
    function surChange(e) {
      const k = e.target.getAttribute && e.target.getAttribute('data-k');
      if (!k) return;
      S[k] = e.target.value;
      if (k === 'id_vendeur') peindre();   // libellé du bouton
      if (k === 'modele_choix') {
        delete S.modele_choix;
        if (e.target.value === AUTRE) { S.modeleAutre = true; S.modele = ''; peindre(); const f = ov && ov.querySelector('input[data-k="modele"]'); if (f) try { f.focus(); } catch (x) { } }
        else { S.modeleAutre = false; S.modele = e.target.value; }
      }
      if (k === 'marque') { if (S.modele && modelesDe(S.marque).indexOf(S.modele) === -1 && !S.modeleAutre) S.modele = ''; peindre(); }
    }

    async function surClic(e) {
      const t = e.target.closest('[data-a]'); if (!t) return;
      const a = t.getAttribute('data-a'), id = t.getAttribute('data-id');
      if (a === 'fermer') return fermer();
      if (a === 'site') return choisirSite(id);
      if (a === 'nature') { S.nature = id; return peindre(); }
      if (a === 'demande') { S.type_demande = id; return peindre(); }
      if (a === 'rep') { S.rep = id; return peindre(); }
      if (a === 'vo') {
        const v = S.voRes && S.voRes[Number(id)]; if (!v) return;
        S.vo = v;
        if (v.pilote && String(S.id_site) !== String(v.id_site)) return choisirSite(v.id_site);
        return peindre();
      }
      if (a === 'vo-changer') { S.vo = null; peindre(); const f = ov && ov.querySelector('[data-k="voq"]'); if (f) try { f.focus(); } catch (x) { } return; }
      if (a === 'vider') { const site = S.id_site, m = S.marque; S = vierge(); S.id_site = site; S.marque = m; return peindre(); }
      if (a === 'autre') { const site = S.id_site, m = S.marque; S = vierge(); S.id_site = site; S.marque = m; return peindre(); }
      if (a === 'fiche') {
        const obj = { IDVu: Number(id) };
        try { W.__odSelectedClient = obj; } catch (x) { }
        try { W.sessionStorage.setItem('od_selected_client', JSON.stringify(obj)); } catch (x) { }
        try { wwLib.wwVariable.updateValue(VAR_CLIENT, obj); } catch (x) { }
        try { W.dispatchEvent(new Event('oropra-client-selected')); } catch (x) { }
        fermer(); goPage('/fiche-client'); return;
      }
      if (a === 'envoyer') return envoyer(false);
      if (a === 'forcer') return envoyer(true);
    }

    function dateOk(v) { const d = v ? new Date(v) : null; return !!d && !isNaN(d) && d.getTime() > Date.now() - 60000; }
    function iso(v) { const d = v ? new Date(v) : null; return d && !isNaN(d) ? d.toISOString() : null; }
    function t(v) { v = String(v == null ? '' : v).trim(); return v || undefined; }
    function details(rappel) {
      const n = S.nature, dem = S.type_demande, d = { interet: n, demande: dem };
      if (n === 'VN' || n === 'Entreprise') d.vn = { marque: S.marque, modele: t(S.modele), energie: t(S.energie), finition: t(S.finition), delai: t(S.delai) };
      if (n === 'VO' && S.vo) {
        const v = S.vo;
        d.vo = { vin: v.vin, no_vo: v.no_vo, immat: v.immat, marque: v.marque, modele: v.modele, version: v.version, annee: v.annee, km: v.km,
                 prix: v.prix, energie: v.energie, boite: v.boite, couleur: v.couleur, site: v.site, lieu: v.lieu, annonce: v.annonce };
      } else if (n === 'VO') {
        d.vo_recherche = { modele: t(S.vr_modele), budget: t(S.vr_budget), km_max: t(S.vr_km), annee_min: t(S.vr_annee), energie: t(S.vr_energie), boite: t(S.vr_boite) };
      }
      if (n === 'Entreprise') d.entreprise = { raison: t(S.entreprise), siret: t(S.ent_siret), nb: t(S.ent_nb), type: t(S.ent_type), financement: t(S.ent_fin) };
      if (n === 'APV') d.apv = { motif: t(S.apv_motif), vehicule: t(S.apv_vehicule), immat: t(S.apv_immat), km: t(S.apv_km) };
      if (dem === 'Rendez-vous') d.rdv = { le: iso(S.rdv_le), objet: t(S.rdv_objet) };
      if (dem === 'Essai' && S.essai_le) d.essai = { le: iso(S.essai_le) };
      if (n !== 'APV') {
        if (dem === 'Reprise' || S.rep === 'oui') d.reprise = { oui: true, vehicule: t(S.rep_vehicule), annee: t(S.rep_annee), km: t(S.rep_km), immat: t(S.rep_immat), etat: t(S.rep_etat) };
        else if (S.rep === 'non') d.reprise = { oui: false };
        d.projet = { echeance: t(S.pj_echeance), financement: n === 'Entreprise' ? undefined : t(S.pj_fin), budget: t(S.pj_budget) };
      }
      d.contact = { rappel_le: rappel ? rappel.toISOString() : undefined, plage: t(S.plage), canal: t(S.canal) };
      return d;
    }

    async function envoyer(forcer) {
      if (S.envoi) return;
      S.err = null;
      const tel = String(S.telephone || '').replace(/[^0-9+]/g, '');
      let rappel = null;
      if (S.rappel) { const d = new Date(S.rappel); if (!isNaN(d)) rappel = d; }
      if (!String(S.nom || '').trim()) S.err = 'Le nom du client est obligatoire.';
      else if (!tel && !String(S.email || '').trim()) S.err = 'Renseignez au moins le portable ou l’e-mail du client.';
      else if (tel && tel.replace(/\D/g, '').length < 9) S.err = 'Téléphone incomplet.';
      else if (S.rappel && !rappel) S.err = 'Date de rappel invalide.';
      else if (rappel && rappel.getTime() < Date.now() - 60000) S.err = 'La date de rappel doit être dans le futur.';
      else if (S.type_demande === 'Rendez-vous' && !dateOk(S.rdv_le)) S.err = 'Indiquez la date et l’heure du rendez-vous souhaité (dans le futur).';
      else if (S.type_demande === 'Essai' && S.essai_le && !dateOk(S.essai_le)) S.err = 'La date d’essai doit être dans le futur.';
      else if (!S.id_site) S.err = 'Choisissez la concession.';
      if (S.err) { peindre(); const b = ov && ov.querySelector('.lap-b'); if (b) b.scrollTop = 0; return; }
      S.envoi = true; peindre();
      try {
        const r = await sb.rpc('lead_appel_creer', { p: {
          id_site: S.id_site, id_vendeur: S.id_vendeur ? Number(S.id_vendeur) : null,
          civilite: S.civilite, prenom: S.prenom, nom: S.nom, entreprise: S.entreprise, telephone: S.telephone, email: S.email,
          rappel_le: rappel ? rappel.toISOString() : null, commentaire: S.commentaire,
          details: details(rappel), id_client: S.id_client, forcer: !!forcer } });
        if (r.error) throw r.error;
        const d = r.data || {};
        if (d.ok === false && d.doublons) { S.doublons = d.doublons; }
        else { S.res = d.action ? d : Object.assign({ action: 'ingere' }, d); }
      } catch (e) {
        S.err = (e && e.message) || String(e);
      } finally {
        S.envoi = false; peindre();
        if (S.doublons || S.err) { const b = ov && ov.querySelector('.lap-b'); if (b) b.scrollTop = 0; }
      }
    }

    return { version: VER };
  }
});
