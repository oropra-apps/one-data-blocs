// ============================================================================
//  NOUVEAU LEAD — APPELS ENTRANTS — module One Data (OD.define 'lead-appel')  v2
//
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
    const VER = 2;
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
    function clientCourant() {
      let c = null;
      try { c = wwLib.wwVariable.getValue(VAR_CLIENT); } catch (e) { }
      if (!c) { try { c = W.__odSelectedClient || null; } catch (e) { } }
      return c && c.IDVu != null ? c : null;
    }

    // ---------------------------------------------------------------- style
    const CSS =
      '#od-lead-appel{display:flex;align-items:center}' +
      '.lap-btn{display:inline-flex;align-items:center;gap:7px;height:36px;padding:0 14px;border:none;border-radius:10px;background:#2a5ea9;color:#fff;font:800 13px "Nunito Sans",system-ui,sans-serif;cursor:pointer;white-space:nowrap}' +
      '.lap-btn:hover{background:#1F4A85}' +
      '.lap-btn svg{width:16px;height:16px}' +
      '.lap-ov{position:fixed;inset:0;z-index:2147483000;display:flex;align-items:flex-start;justify-content:center;padding:28px 16px;background:rgba(31,74,133,.42);overflow-y:auto;font-family:"Nunito Sans",system-ui,sans-serif;color:#1F4A85}' +
      '.lap-box{background:#fff;border-radius:16px;width:100%;max-width:620px;box-shadow:0 30px 80px rgba(31,74,133,.35)}' +
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
      '@media (max-width:620px){.lap-g2,.lap-sites{grid-template-columns:1fr}.lap-btn span{display:none}}';
    if (!doc.getElementById('lap-css')) {
      const st = doc.createElement('style'); st.id = 'lap-css'; st.textContent = CSS;
      (doc.head || doc.documentElement).appendChild(st);
    }

    // ---------------------------------------------------------------- bouton
    __anchor.innerHTML = '<button type="button" class="lap-btn" title="Créer un lead pour une concession">' +
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><path d="M12 5v14M5 12h14"/></svg>' +
      '<span>Nouveau lead</span></button>';
    __anchor.querySelector('.lap-btn').addEventListener('click', ouvrir);

    // ---------------------------------------------------------------- fenêtre
    let ov = null, S = null, sites = null;
    const vendeursParSite = {};
    const NATURES = [['VN', 'Véhicule neuf'], ['VO', 'Occasion'], ['Entreprise', 'Entreprise'], ['APV', 'Après-vente']];
    const TYPES = ['Essai', 'Info', 'Offre', 'Rendez-vous'];

    function vierge() {
      return { id_site: null, id_vendeur: '', civilite: 'M.', prenom: '', nom: '', entreprise: '', telephone: '', email: '',
               nature: 'VN', type_demande: 'Essai', marque: 'Toyota', modele: '', rappel: '', commentaire: '',
               id_client: null, client: null, err: null, envoi: false, res: null, doublons: null };
    }
    function depuisClient(c) {
      S.id_client = c.IDVu; S.client = c;
      S.civilite = /^(mme|mlle|madame|mademoiselle)/i.test(String(c.CIVILITE || '')) ? 'Mme' : 'M.';
      S.prenom = c.PRENOM || ''; S.nom = c.NOM || '';
      if (Number(c.idmultivu) === 1) { S.entreprise = c.NOM || ''; S.nature = 'Entreprise'; }
      S.telephone = c.TEl_MOB || c.TEL_FIXE || ''; S.email = c.EMAIL || '';
    }
    function siteCourant() { return (sites || []).filter(function (s) { return String(s.id_site) === String(S.id_site); })[0] || null; }
    function nomSite(s) { return propre(String(s || '').replace(/\s+-\s+(TOYOTA|LEXUS)$/i, '')); }

    async function ouvrir() {
      if (ov) return;
      S = vierge();
      ov = doc.createElement('div'); ov.className = 'lap-ov';
      (doc.body || doc.documentElement).appendChild(ov);
      ov.addEventListener('mousedown', function (e) { if (e.target === ov) fermer(); });
      ov.addEventListener('click', surClic);
      ov.addEventListener('input', surSaisie);
      ov.addEventListener('change', surChange);
      doc.addEventListener('keydown', surTouche);
      // Client sélectionné dans la Base client (barre client) : formulaire pré-rempli.
      const cc = clientCourant();
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
        try { const r = await sb.rpc('lead_appel_concessions'); if (r.error) throw r.error; sites = r.data || []; }
        catch (e) { sites = []; S.err = (e && e.message) || 'Concessions indisponibles.'; }
      }
      if (sites.length === 1) choisirSite(sites[0].id_site); else peindre();
      setTimeout(function () { const f = ov && ov.querySelector(S.client ? '[data-k="modele"]' : '[data-k="prenom"]'); if (f) try { f.focus(); } catch (e) { } }, 30);
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
          if (S.rappel) lignes.push('Rappel demandé le ' + jourHeure(S.rappel) + '.');
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
          lignes.map(function (l) { return '<p>' + esc(l) + '</p>'; }).join('') + '</div>' +
          '<div class="lap-f">' +
          (r.id_client ? '<button type="button" class="lap-sec2" data-a="fiche" data-id="' + esc(r.id_client) + '">Ouvrir la fiche client</button>' : '') +
          '<button type="button" class="lap-sec2" data-a="autre">Nouveau lead</button>' +
          '<button type="button" class="lap-pri" data-a="fermer">Fermer</button></div></div>';
        ov.innerHTML = h; return;
      }

      h += '<div class="lap-b">';
      if (S.err) h += '<div class="lap-err">' + esc(S.err) + '</div>';
      if (S.client) {
        h += '<div class="lap-cli"><span>Client de la Base client : <b>' + esc([S.client.PRENOM, S.client.NOM].filter(Boolean).join(' ')) + '</b> — formulaire pré-rempli</span>' +
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
        '<div class="lap-g2" style="margin-bottom:10px">' + liste('civilite', 'Civilité *', [['M.', 'M.'], ['Mme', 'Mme']]) + champ('entreprise', 'Entreprise') + '</div>' +
        '<div class="lap-g2" style="margin-bottom:10px">' + champ('prenom', 'Prénom') + champ('nom', 'Nom *') + '</div>' +
        '<div class="lap-g2">' + champ('telephone', 'Portable', 'tel', '06 12 34 56 78') + champ('email', 'E-mail', 'email', 'nom@exemple.fr') + '</div>' +
        '<p class="lap-hint">Au moins l’un des deux : portable ou e-mail.</p></div>';

      h += '<div class="lap-sec"><h3>Demande</h3>' +
        '<div class="lap-seg" style="margin-bottom:10px">' + NATURES.map(function (n) {
          return '<button type="button" data-a="nature" data-id="' + n[0] + '" class="' + (S.nature === n[0] ? 'on' : '') + '">' + esc(n[1]) + '</button>';
        }).join('') + '</div>' +
        '<div class="lap-g2" style="margin-bottom:10px">' + liste('type_demande', 'Type de demande *', TYPES) + liste('marque', 'Marque *', ['Toyota', 'Lexus']) + '</div>' +
        '<div class="lap-g2" style="margin-bottom:10px">' + champ('modele', 'Modèle souhaité', 'text', 'Yaris Cross, C-HR, NX…') + champ('rappel', 'Rappel', 'datetime-local') + '</div>' +
        '<label class="lap-q">Qualification pour le vendeur<textarea data-k="commentaire" placeholder="Projet, échéance, reprise, financement, disponibilités du client">' + esc(S.commentaire) + '</textarea></label></div>';

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
      if (k === 'telephone' || k === 'email' || k === 'nom') { if (S.doublons) { S.doublons = null; peindre(); } }
    }
    function surChange(e) {
      const k = e.target.getAttribute && e.target.getAttribute('data-k');
      if (!k) return;
      S[k] = e.target.value;
      if (k === 'id_vendeur') peindre();   // libellé du bouton
    }

    async function surClic(e) {
      const t = e.target.closest('[data-a]'); if (!t) return;
      const a = t.getAttribute('data-a'), id = t.getAttribute('data-id');
      if (a === 'fermer') return fermer();
      if (a === 'site') return choisirSite(id);
      if (a === 'nature') { S.nature = id; return peindre(); }
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
      else if (!S.id_site) S.err = 'Choisissez la concession.';
      if (S.err) { peindre(); const b = ov && ov.querySelector('.lap-b'); if (b) b.scrollTop = 0; return; }
      S.envoi = true; peindre();
      try {
        const r = await sb.rpc('lead_appel_creer', { p: {
          id_site: S.id_site, id_vendeur: S.id_vendeur ? Number(S.id_vendeur) : null,
          civilite: S.civilite, prenom: S.prenom, nom: S.nom, entreprise: S.entreprise, telephone: S.telephone, email: S.email,
          nature: S.nature, type_demande: S.type_demande, marque: S.marque, modele: S.modele,
          rappel_le: rappel ? rappel.toISOString() : null, commentaire: S.commentaire,
          id_client: S.id_client, forcer: !!forcer } });
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
