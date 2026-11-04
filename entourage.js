// ENTOURAGE — module One Data (OD.define) v3 (04/11/2026)
//
// v3 : le report dans BACS s'exécute VRAIMENT. Les gestes d'entourage sont
//   « directs » : la base les met en file sans jamais les relancer seule, c'est
//   la page qui doit demander à l'extension de les exécuter (geste_executer),
//   comme le fait le module partagé pour les interlocuteurs de société. La v2
//   ne le demandait pas : le lien restait « En cours » indéfiniment.
//   · Ajout, « Reporter dans BACS » et retrait : le geste part aussitôt dans
//     l'onglet BACS du vendeur ; le résultat (fait, refus BACS, BACS fermé)
//     s'affiche en clair.
//   · « En cours » sans envoi actif propose « Relancer » : la base rend le
//     geste déjà en attente (migration 20261104224500), jamais un doublon.
//
// v2 : le bandeau « Lecture de l'entourage BACS » suit la lecture réelle
//   (interrogée toutes les 20 s) et disparaît dès qu'elle est faite ; au-delà
//   de 10 minutes, il le dit sans tourner indéfiniment. Le téléphone d'un
//   proche appelle par le 3CX du vendeur.
//
// Onglet « Entourage » de la fiche d'un particulier : la rubrique Entourage
// de BACS (Relationship__c) — conjoint, enfants, parents, amis, collègues,
// parrain / filleul, financier.
//   · La liste montre chaque proche avec son rôle VU DEPUIS CETTE FICHE (sur la
//     fiche de l'épouse, son mari apparaît « Mari »), ses coordonnées, l'état
//     dans BACS ; un clic sur le nom ouvre la fiche du proche.
//   · « Ajouter un proche » : recherche dans toute la base des particuliers
//     (interlocuteur_rechercher, coordonnées masquées) ou création d'une fiche ;
//     rôle obligatoire, « contact principal » facultatif.
//   · Retrait après confirmation (fenêtre One Data, jamais la boîte native).
//   · À l'ouverture, la lecture de l'entourage BACS de ce client est demandée en
//     priorité à la récolte (entourage_relire) ; la liste se recharge seule.
//   · Écriture dans BACS : gestes entourage_lier / entourage_retirer (extension
//     3.5.0), sous l'interrupteur entourage_ecrire_bacs ; sinon le lien reste
//     dans One Data avec « Reporter dans BACS ».
//   Charte : bleus et vert One Data, orange pour les alertes, aucun rouge.
OD.define('entourage', {
  mount(__anchor, ctx) {
    const OROPRA_DOUBLONS_URL = 'https://cdn.jsdelivr.net/gh/oropra-apps/one-data-blocs@aa457b862a926340283e1b8e2e956cbff6357658/oropra-doublons.js';
    function chargerDoublons() {
      if (window.oropraDoublons) return Promise.resolve();
      if (window.__oropraDoublonsChargement) return window.__oropraDoublonsChargement;
      window.__oropraDoublonsChargement = new Promise((resolve) => {
        const sc = document.createElement('script'); sc.src = OROPRA_DOUBLONS_URL; sc.async = true;
        sc.onload = () => resolve(); sc.onerror = () => { resolve(); };
        document.head.appendChild(sc);
      }); return window.__oropraDoublonsChargement;
    }
    chargerDoublons().then(function () { try { if (window.oropraDoublons && !document.getElementById('od-css-eg')) { var e = document.createElement('style'); e.id = 'od-css-eg'; e.textContent = window.oropraDoublons.css('eg'); document.head.appendChild(e); } } catch (x) {} });
    __anchor.id = 'oropra-entourage';

    const SELECTED_CLIENT_VAR_ID = '55490583-c88b-4748-916e-4d203db07742';
    const LOOKUP_VAR_ID = 'cced74ab-5a0a-418d-9479-2366e05a8754';
    const ROLES = [
      ['Wife', 'Femme'], ['Husband', 'Mari'], ['Child', 'Enfant'], ['Parent', 'Parent'],
      ['Friend', 'Ami'], ['Colleague', 'Collègue'], ['Sponsor', 'Parrain'], ['Sponsored', 'Filleul'],
      ['Financer', 'Financier'], ['Other', 'Autre']
    ];
    const ROLE_CLS = { Wife: 'b-fam', Husband: 'b-fam', Child: 'b-fam', Parent: 'b-fam',
                       Sponsor: 'b-par', Sponsored: 'b-par', Financer: 'b-fin', Financed: 'b-fin' };

    const doc = __anchor.ownerDocument || document;
    const getRoot = () => __anchor;
    function esc(s) { if (s == null) return ''; return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
    function cleanDigits(s) { return s == null ? '' : String(s).replace(/\D/g, ''); }
    function readVar(id) { try { return wwLib.wwVariable.getValue(id); } catch (e) { return null; } }
    function supa() { return ctx.supabase; }
    function fw() { try { return (wwLib.getFrontWindow && wwLib.getFrontWindow()) || window; } catch (e) { return window; } }
    function siteCourant() { const s = window.oropraSite || null; return s && s.getSiteId ? s.getSiteId() : null; }
    function errMsg(e) { return (e && e.message) ? e.message : String(e); }
    const viewerId = (fw().oropraUser || {}).ID_User != null ? Number(fw().oropraUser.ID_User) : null;
    const lookup = Array.isArray(readVar(LOOKUP_VAR_ID)) ? readVar(LOOKUP_VAR_ID) : [];
    const civP = lookup.filter(x => x.multivu === 0).map(x => x.libelle_court).filter(Boolean);
    const CIVILITES = civP.length ? civP : ['M.', 'Mme'];
    function currentClient() { const c = readVar(SELECTED_CLIENT_VAR_ID); return c && typeof c === 'object' ? c : null; }
    function currentIdvu() { const c = currentClient(); return c && c.IDVu != null ? Number(c.IDVu) : null; }
    function nomPersonne(c) { return c ? [c.civilite || c.CIVILITE, c.prenom || c.PRENOM, c.nom || c.NOM].filter(Boolean).join(' ').trim() : ''; }
    function roleLib(v) { const r = ROLES.find(x => x[0] === v); return r ? r[1] : (v === 'Financed' ? 'Financé' : (v || 'Autre')); }

    const state = { id: null, list: null, loading: false, error: null, modal: null, notice: null,
                    bacsActif: false, lecture: null, nomClient: '', envoi: {} };

    // v3 : canal page -> extension -> onglet BACS, posé par le socle (OD.bacs) ;
    // repli autonome sur le même contrat de messages.
    const DELAI_BACS_MS = 250000;
    function demanderBacs(action, params, delaiMs) {
      const w = fw();
      const g = (w.OD && w.OD.bacs) || (window.OD && window.OD.bacs) || null;
      if (g && typeof g.demander === 'function') return g.demander(action, params, delaiMs);
      return new Promise((resolve) => {
        const id = 'oeg_' + Date.now() + '_' + Math.random().toString(16).slice(2);
        let t = null;
        function fin(r) { try { w.removeEventListener('message', ecoute); } catch (e) {} clearTimeout(t); resolve(r); }
        function ecoute(e) { const m = e.data; if (m && m.__od_bacs_result && m.id === id) fin(m); }
        w.addEventListener('message', ecoute);
        t = setTimeout(() => fin({ ok: false, erreur: 'delai_depasse' }), delaiMs || 25000);
        try { w.postMessage({ __od_bacs: true, id: id, action: action, params: params || {} }, '*'); }
        catch (e) { fin({ ok: false, erreur: 'extension_absente' }); }
      });
    }
    function messageBacs(err) {
      if (!err) return 'BACS n’a pas répondu.';
      if (err === 'extension_absente' || err === 'extension_indisponible') return 'L’extension One Data – BACS n’est pas active sur ce navigateur.';
      if (err === 'bacs_non_ouvert') return 'BACS n’est pas ouvert : ouvrez BACS dans un onglet de ce navigateur, connectez-vous, puis relancez.';
      if (err === 'bacs_non_pret') return 'L’onglet BACS ne répond pas encore : laissez-le finir de charger, puis relancez.';
      if (err === 'delai_depasse') return 'BACS n’a pas répondu à temps.';
      if (err === 'extension_perimee' || /^geste en_attente$/.test(err)) return 'Votre extension « One Data – BACS » n’est pas à jour : fermez complètement Chrome, rouvrez-le, puis relancez.';
      const t = String(err).replace(/^[^:]*refusée\s*:\s*/i, '').replace(/^[A-Za-z0-9_]+\.[A-Za-z0-9_]+\s*:\s*/, '').replace(/❌\s*/g, '').trim();
      return 'BACS a refusé : ' + (t || String(err));
    }
    async function executerGeste(gesteId, idLien, texteOk) {
      if (gesteId == null) return;
      state.envoi[idLien] = true;
      state.notice = { texte: 'Report dans BACS… ne fermez pas l’onglet BACS.', ton: 'info' }; render();
      let x = null;
      try { x = await demanderBacs('geste_executer', { geste_id: Number(gesteId) }, DELAI_BACS_MS); }
      catch (e) { x = { ok: false, erreur: errMsg(e) }; }
      delete state.envoi[idLien];
      if (x && x.ok) notifier(texteOk || 'Reporté dans BACS.', 'ok');
      else notifier(messageBacs(x && (x.erreur || x.refus)) + ' Le lien est gardé dans One Data.', 'alerte');
      await charger(true);
    }

    // ------------------------------------------------------------ données
    async function charger(silencieux) {
      const id = currentIdvu();
      state.id = id;
      if (id == null) { state.list = []; render(); return; }
      if (!silencieux) { state.loading = true; render(); }
      try {
        const r = await supa().rpc('get_entourage', { p_id_client: id });
        if (r.error) throw r.error;
        if (state.id !== id) return;
        state.list = r.data || []; state.error = null;
      } catch (e) { state.error = errMsg(e); state.list = state.list || []; }
      finally { state.loading = false; if (!state.modal) render(); }
    }
    async function chargerContexte() {
      const id = state.id; if (id == null) return;
      try { const r = await supa().rpc('bacs_entourage_actif'); state.bacsActif = !r.error && r.data === true; } catch (e) {}
      try {
        const c = await supa().from('CLIENT').select('NOM, PRENOM').eq('IDVu', id).maybeSingle();
        state.nomClient = (c && c.data && c.data.NOM) || '';
      } catch (e) {}
      // Lecture prioritaire de l'entourage BACS de ce client (au plus une fois par jour).
      try {
        const r = await supa().rpc('entourage_relire', { p_id_client: id });
        if (!r.error && r.data && r.data.demande) suivreLecture(id);
      } catch (e) {}
      if (!state.modal) render();
    }
    // La récolte lit l'entourage BACS de ce client : on suit la lecture (la base
    // répond « déjà lu » dès qu'elle est faite), puis la liste se recharge.
    let suivi = null;
    function suivreLecture(id) {
      if (suivi) clearInterval(suivi);
      state.lecture = { depuis: Date.now(), attente: false }; render();
      suivi = setInterval(async () => {
        if (state.id !== id || !__anchor.isConnected) { clearInterval(suivi); suivi = null; return; }
        let fini = false;
        try {
          const r = await supa().rpc('entourage_relire', { p_id_client: id });
          fini = !r.error && r.data && r.data.demande === false;
        } catch (e) {}
        if (fini) {
          clearInterval(suivi); suivi = null; state.lecture = null;
          await charger(true);
        } else if (Date.now() - state.lecture.depuis > 600000) {
          clearInterval(suivi); suivi = null;
          state.lecture = { depuis: state.lecture.depuis, attente: true }; render();
        }
      }, 20000);
    }
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
    function notifier(texte, ton) {
      state.notice = { texte: texte, ton: ton || 'info' }; render();
      clearTimeout(notifier.t); notifier.t = setTimeout(() => { state.notice = null; render(); }, 7000);
    }

    // Fiche du proche : la variable « client sélectionné » suffit, la fiche se redessine.
    function ouvrirFiche(id) {
      const n = Number(id); if (!(n > 0)) return;
      try { wwLib.wwVariable.updateValue(SELECTED_CLIENT_VAR_ID, { IDVu: n }); } catch (e) {}
      try { fw().__odFicheTab = 'fiche'; } catch (e) {}
      try { fw().scrollTo({ top: 0, behavior: 'smooth' }); } catch (e) {}
    }

    // ------------------------------------------------------------ actions
    function confirmer(texte, ok) {
      return new Promise((resolve) => {
        const root = getRoot(); if (!root) return resolve(false);
        const ov = doc.createElement('div'); ov.className = 'eg-overlay';
        ov.innerHTML = '<div class="eg-modal" style="max-width:440px"><div class="eg-modal-h"><div class="eg-modal-t">Confirmation</div></div>'
          + '<div class="eg-modal-b"><div style="font-size:13.5px;color:#1F4A85;line-height:1.5">' + esc(texte) + '</div></div>'
          + '<div class="eg-modal-f"><button class="eg-btn eg-btn-ghost" data-c="non">Annuler</button>'
          + '<button class="eg-btn eg-btn-primary" data-c="oui">' + esc(ok || 'Confirmer') + '</button></div></div>';
        const fin = (v) => { try { ov.remove(); } catch (e) {} resolve(v); };
        ov.addEventListener('click', (e) => { const b = e.target.closest('[data-c]'); if (b) return fin(b.getAttribute('data-c') === 'oui'); if (e.target === ov) fin(false); });
        root.appendChild(ov);
      });
    }
    async function retirer(id, nom) {
      if (!(await confirmer('Retirer ' + nom + ' de l’entourage ?', 'Retirer'))) return;
      try {
        const r = await supa().rpc('entourage_retirer', { p_id: Number(id) });
        if (r.error) throw r.error;
        if (r.data && r.data.bacs && r.data.geste) { await charger(true); await executerGeste(r.data.geste, id, 'Retiré de l’entourage, dans One Data et dans BACS.'); return; }
        notifier('Retiré de l’entourage.', 'ok');
        await charger(true);
      } catch (e) { notifier(errMsg(e), 'alerte'); }
    }
    async function renvoyer(id) {
      try {
        const r = await supa().rpc('entourage_renvoyer', { p_id: Number(id), p_id_site: siteCourant() });
        if (r.error) throw r.error;
        if (r.data && r.data.bacs === false) { notifier('Le report de l’entourage dans BACS n’est pas encore ouvert.', 'info'); await charger(true); return; }
        if (r.data && r.data.deja) { notifier('Ce lien est déjà dans BACS.', 'ok'); await charger(true); return; }
        await charger(true);
        if (r.data && r.data.geste) await executerGeste(r.data.geste, id, 'Reporté dans BACS.');
      } catch (e) { notifier(errMsg(e), 'alerte'); }
    }

    // ------------------------------------------------------------ modale
    function ouvrirModale() {
      state.modal = { q: '', results: [], searching: false, searched: false, selected: null,
                      role: 'Wife', principal: false, create: null, saving: false, error: null };
      render();
      setTimeout(() => { const i = getRoot().querySelector('[data-q]'); if (i) i.focus(); }, 30);
    }
    function fermerModale() { state.modal = null; render(); }
    let deb = null;
    function onQuery(q) {
      const m = state.modal; if (!m) return;
      m.q = q; if (deb) clearTimeout(deb);
      if (!q || q.trim().length < 2) { m.results = []; m.searched = false; render(); refocus(); return; }
      deb = setTimeout(() => chercher(q.trim()), 350);
    }
    function refocus() { setTimeout(() => { const i = getRoot().querySelector('[data-q]'); if (i) { i.focus(); const v = i.value; i.value = ''; i.value = v; } }, 0); }
    async function chercher(q) {
      const m = state.modal; if (!m) return;
      m.searching = true; render(); refocus();
      try {
        const r = await supa().rpc('interlocuteur_rechercher', { p_q: q, p_limite: 12 });
        if (r.error) throw r.error;
        if (state.modal !== m || m.q.trim() !== q) return;
        const deja = new Set((state.list || []).map(x => Number(x.id_proche)).concat([state.id]));
        m.results = (r.data || []).filter(x => !deja.has(Number(x.id_client)));
        m.searched = true; m.error = null;
      } catch (e) { m.results = []; m.error = errMsg(e); }
      finally { m.searching = false; render(); refocus(); }
    }
    function choisir(row) {
      const m = state.modal; if (!m) return;
      m.selected = { id: Number(row.id_client), nom: nomPersonne(row) || ('Particulier n° ' + row.id_client),
                     sub: [[row.cp, row.ville].filter(Boolean).join(' '), row.mobile_masque, row.email_masque].filter(Boolean).join(' · '),
                     dans_bacs: !!row.dans_bacs };
      m.results = []; m.create = null; render();
    }
    function ouvrirCreation() {
      const m = state.modal; if (!m) return;
      const mots = (m.q || '').trim().split(/\s+/).filter(Boolean);
      const chiffres = /\d/.test(m.q || '');
      const tape = chiffres ? cleanDigits(m.q) : '';
      m.create = { data: { CIVILITE: CIVILITES[CIVILITES.length > 1 ? 1 : 0],
                           NOM: !chiffres && mots.length ? mots[0].toUpperCase() : (state.nomClient || ''),
                           PRENOM: !chiffres && mots.length > 1 ? mots.slice(1).join(' ') : '',
                           TEl_MOB: /^0[67]/.test(tape) ? tape : '', TEL_FIXE: tape && !/^0[67]/.test(tape) ? tape : '', EMAIL: '' },
                   saving: false, error: null, duplicate: null, dupAck: false };
      m.results = []; render();
    }
    async function creerProche() {
      const m = state.modal, c = m && m.create; if (!c) return false;
      const d = c.data;
      const nom = String(d.NOM || '').trim(), mob = cleanDigits(d.TEl_MOB), fixe = cleanDigits(d.TEL_FIXE), email = String(d.EMAIL || '').trim().toLowerCase();
      const ko = (t) => { c.error = t; render(); return false; };
      if (!nom) return ko('Le nom est obligatoire.');
      if (mob && !/^0[67]\d{8}$/.test(mob)) return ko('Le portable doit comporter 10 chiffres et commencer par 06 ou 07.');
      if (fixe && !/^0\d{9}$/.test(fixe)) return ko('Le téléphone fixe doit comporter 10 chiffres.');
      if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) return ko("L'adresse e-mail n'est pas valide.");
      if (!c.dupAck) {
        await chargerDoublons();
        const od = window.oropraDoublons;
        if (od && (mob || email || d.PRENOM)) {
          const dup = await od.check(supa(), { NOM: nom, PRENOM: d.PRENOM, TEl_MOB: mob, EMAIL: email }, {});
          if (dup) { c.duplicate = dup; render(); return false; }
        }
      }
      const idSite = siteCourant();
      if (idSite == null) return ko('Aucun site sélectionné (choisissez un site en haut à droite).');
      c.saving = true; c.error = null; render();
      try {
        const now = new Date().toISOString();
        const payload = { idmultivu: 0, CIVILITE: d.CIVILITE || null, NOM: nom.toUpperCase(),
          PRENOM: String(d.PRENOM || '').trim().toUpperCase() || null, TEl_MOB: mob || null, TEL_FIXE: fixe || null,
          EMAIL: email || null, CreationDate: now, UpdateDate: now,
          ID_VENDEUR_CREATION: viewerId != null ? String(viewerId) : null, ID_VENDEUR_UPDATE: viewerId != null ? String(viewerId) : null };
        const r = await supa().rpc('client_creer', { p_payload: payload, p_id_site: idSite, p_id_user: viewerId });
        if (r.error) throw r.error;
        const ins = r.data && r.data.client;
        if (!ins) throw new Error('création : aucune fiche renvoyée');
        if (c.duplicate && c.duplicate.candidats && window.oropraDoublons) {
          const cc = c.duplicate.candidats.filter(x => x.id_client != null && Number(x.id_client) !== Number(ins.IDVu));
          if (cc.length) { try { await window.oropraDoublons.signaler(supa(), ins.IDVu, cc); } catch (e) {} }
        }
        m.selected = { id: Number(ins.IDVu), nom: nomPersonne(ins), sub: 'Nouvelle fiche n° ' + ins.IDVu, dans_bacs: false };
        m.create = null;
        return true;
      } catch (e) { c.saving = false; c.error = errMsg(e); render(); return false; }
    }
    async function enregistrer() {
      const m = state.modal; if (!m) return;
      if (!m.role) { m.error = 'Le rôle est obligatoire.'; render(); return; }
      if (m.create) { m.error = null; if (!(await creerProche())) return; if (state.modal !== m) return; }
      if (!m.selected) return;
      m.saving = true; m.error = null; render();
      try {
        const r = await supa().rpc('entourage_ajouter', { p_id_client: state.id, p_id_proche: m.selected.id, p_role: m.role,
                                                          p_principal: !!m.principal, p_id_site: siteCourant() });
        if (r.error) throw r.error;
        state.modal = null;
        await charger(true);
        if (r.data && r.data.bacs && r.data.geste) await executerGeste(r.data.geste, r.data.id, 'Ajouté à l’entourage, dans One Data et dans BACS.');
        else notifier('Ajouté à l’entourage.', 'ok');
      } catch (e) { m.saving = false; m.error = errMsg(e); render(); }
    }

    // ------------------------------------------------------------ rendu
    const I = {
      users: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.5 3-5.5 6.5-5.5s6.5 2 6.5 5.5"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14c2.6 0 4.5 1.5 4.5 4"/></svg>',
      user: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>',
      plus: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
      search: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
      x: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
      unlink: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 13l-2 2a3 3 0 0 1-4-4l2-2"/><path d="M15 11l2-2a3 3 0 0 0-4-4l-2 2"/><line x1="3" y1="3" x2="21" y2="21"/></svg>',
      link: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>',
      retry: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>',
      star: '<svg width="11" height="11" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2l3 6.9 7.5.7-5.7 5 1.7 7.4L12 18.3 5.5 22l1.7-7.4-5.7-5 7.5-.7z"/></svg>',
      spin: '<span class="eg-spin"></span>'
    };
    const R = '#oropra-entourage';
    const STYLE = `<style>
${R}{font-family:"Nunito Sans",system-ui,sans-serif;color:#2a5ea9}
${R} *{box-sizing:border-box}
${R} .eg-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;gap:12px}
${R} .eg-head-t{font-size:12px;text-transform:uppercase;letter-spacing:.4px;color:#7a98c5;font-weight:700;display:flex;align-items:center;gap:8px}
${R} .eg-count{background:#e6f1fb;color:#2a5ea9;border-radius:10px;padding:1px 8px;font-size:11px}
${R} .eg-btn{display:inline-flex;align-items:center;gap:6px;padding:9px 16px;border-radius:6px;font-size:12.5px;font-weight:600;cursor:pointer;border:1px solid transparent;font-family:inherit;white-space:nowrap}
${R} .eg-btn-primary{background:#53bda7;color:#fff;border-color:#53bda7}
${R} .eg-btn-primary:disabled{background:#a9d9cd;border-color:#a9d9cd;cursor:not-allowed}
${R} .eg-btn-ghost{background:transparent;color:#2a5ea9;border-color:#2a5ea9}
${R} .eg-btn-mini{padding:5px 10px;font-size:11.5px}
${R} .eg-list{display:flex;flex-direction:column;gap:8px}
${R} .eg-row{display:flex;align-items:center;gap:12px;padding:12px 14px;border:1px solid #eef3fb;border-radius:8px}
${R} .eg-row-ic{width:32px;height:32px;border-radius:7px;background:#f2f6fc;color:#2a5ea9;display:flex;align-items:center;justify-content:center;flex-shrink:0}
${R} .eg-row-main{flex:1;min-width:0}
${R} .eg-row-name{font-weight:700;font-size:13px;color:#1F4A85;background:none;border:0;padding:0;cursor:pointer;font-family:inherit;text-align:left;border-bottom:1px solid transparent}
${R} .eg-row-name:hover{border-bottom-color:currentColor}
${R} .eg-row-sub{font-size:11px;color:#7a98c5;margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
${R} .eg-row-sub a{color:#7a98c5;text-decoration:none}
${R} .eg-row-sub a:hover{color:#2a5ea9}
${R} .eg-badge{font-size:11px;font-weight:700;padding:3px 10px;border-radius:6px;white-space:nowrap;background:#f0f4fa;color:#4a6a96}
${R} .eg-badge.b-fam{background:#e1f5ee;color:#0f6e56}
${R} .eg-badge.b-par{background:#e6f1fb;color:#0c447c}
${R} .eg-badge.b-fin{background:#fdf3e2;color:#9a5b0b}
${R} .eg-prin{display:inline-flex;align-items:center;gap:4px;font-size:10.5px;font-weight:700;color:#53bda7;white-space:nowrap}
${R} .eg-sync{font-size:11px;font-weight:700;padding:3px 9px;border-radius:6px;white-space:nowrap;border:1px solid #d9e3f2;color:#7a98c5;display:inline-flex;align-items:center;gap:5px}
${R} .eg-sync.ok{border-color:#9ad9c5;color:#0f6e56}
${R} .eg-sync.att{border-color:#bcd2ee;color:#2a5ea9}
${R} .eg-sync.ko{border-color:#f0c48a;color:#a8620e}
${R} .eg-b{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:4px;background:#1F4A85;color:#fff;font-weight:900;font-size:10px}
${R} .eg-ic{width:30px;height:30px;border-radius:6px;border:none;background:transparent;color:#7a98c5;display:inline-flex;align-items:center;justify-content:center;cursor:pointer}
${R} .eg-ic:hover{background:#fdf3e2;color:#a8620e}
${R} .eg-empty{padding:30px 16px;text-align:center;color:#8aa3c3;font-size:13px;line-height:1.5}
${R} .eg-alert{display:flex;align-items:center;gap:12px;border:1px solid #f0c48a;border-left:3px solid #e6a817;border-radius:8px;padding:11px 14px;margin-bottom:12px;font-size:12.5px;color:#7a4b0c;background:#fff}
${R} .eg-info{display:flex;align-items:center;gap:10px;border:1px solid #d9e3f2;border-left:3px solid #2a5ea9;border-radius:8px;padding:10px 14px;margin-bottom:12px;font-size:12.5px;color:#2a5ea9;background:#fff}
${R} .eg-info.ok{border-left-color:#53bda7;color:#0f6e56;border-color:#bfe6da}
${R} .eg-overlay{position:fixed;inset:0;background:rgba(42,94,169,.35);z-index:1000;display:flex;align-items:flex-start;justify-content:center;padding:40px 16px;overflow-y:auto}
${R} .eg-modal{background:#fff;border-radius:12px;width:100%;max-width:560px;box-shadow:0 20px 60px rgba(31,74,133,.22);display:flex;flex-direction:column;max-height:calc(100vh - 80px)}
${R} .eg-modal-h{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #f0f4fa}
${R} .eg-modal-t{font-size:16px;font-weight:700}
${R} .eg-modal-b{padding:18px 20px;overflow-y:auto;display:flex;flex-direction:column;gap:10px}
${R} .eg-modal-f{display:flex;justify-content:flex-end;gap:8px;padding:14px 20px;border-top:1px solid #f0f4fa}
${R} .eg-step{font-size:11px;text-transform:uppercase;letter-spacing:.4px;color:#7a98c5;font-weight:700;margin-top:4px}
${R} .eg-hint{font-size:12px;color:#7a98c5;line-height:1.45}
${R} .eg-search{display:flex;align-items:center;gap:8px;border:1px solid #d9e3f2;border-radius:6px;padding:10px 12px;color:#7a98c5}
${R} .eg-search input{border:none;outline:none;flex:1;font-family:inherit;color:#2a5ea9;font-size:13px;background:transparent}
${R} .eg-drop{border:1px solid #d9e3f2;border-radius:6px;overflow:hidden}
${R} .eg-drop-item{padding:10px 12px;font-size:13px;color:#2a5ea9;border-bottom:1px solid #f0f4fa;cursor:pointer;display:flex;align-items:center;gap:10px}
${R} .eg-drop-item:last-child{border-bottom:none}
${R} .eg-drop-item:hover{box-shadow:inset 3px 0 0 #2a5ea9;background:#f7faff}
${R} .eg-drop-main{flex:1;min-width:0}
${R} .eg-drop-sub{font-size:11px;color:#7a98c5;margin-top:2px}
${R} .eg-drop-create{padding:10px 12px;font-size:12.5px;color:#2b9a83;font-weight:600;display:flex;align-items:center;gap:6px;cursor:pointer;background:#fff}
${R} .eg-drop-create:hover{box-shadow:inset 3px 0 0 #2a5ea9}
${R} .eg-chip{display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid #9ad9c5;border-radius:8px;padding:11px 14px}
${R} .eg-chip-name{font-weight:700;font-size:13px;color:#0f6e56}
${R} .eg-chip-sub{font-size:11px;color:#3a8a76;margin-top:1px}
${R} .eg-chip-x{background:none;border:none;color:#0f6e56;cursor:pointer;font-size:12px;font-weight:600;font-family:inherit}
${R} .eg-newcard{border:1px solid #9ad9c5;border-radius:8px;padding:12px 14px;display:flex;flex-direction:column;gap:12px}
${R} .eg-newcard-h{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
${R} .eg-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px 14px}
${R} .eg-f{display:flex;flex-direction:column;gap:4px}
${R} .eg-f label{font-size:11px;text-transform:uppercase;letter-spacing:.4px;color:#7a98c5;font-weight:600}
${R} .eg-req{color:#e6a817}
${R} .eg-input,${R} .eg-select{border:1px solid #d9e3f2;border-radius:6px;padding:10px 12px;font-size:13px;color:#2a5ea9;outline:none;font-family:inherit;width:100%;background:#fff}
${R} .eg-input:focus,${R} .eg-select:focus{border-color:#2a5ea9}
${R} .eg-roles{display:flex;flex-wrap:wrap;gap:6px}
${R} .eg-role{border:1px solid #d9e3f2;border-radius:16px;padding:6px 12px;font-size:12px;font-weight:600;color:#2a5ea9;background:#fff;cursor:pointer;font-family:inherit}
${R} .eg-role.on{background:#2a5ea9;border-color:#2a5ea9;color:#fff}
${R} .eg-check{display:flex;align-items:center;gap:8px;font-size:12.5px;color:#2a5ea9;cursor:pointer}
${R} .eg-check input{accent-color:#53bda7;width:16px;height:16px}
${R} .eg-err{color:#7a4b0c;font-size:12.5px;border:1px solid #f0c48a;border-left:3px solid #e6a817;border-radius:6px;padding:10px 12px;background:#fff}
${R} .eg-status{font-size:11px;color:#53bda7;display:inline-flex;align-items:center;gap:5px;margin-top:2px}
${R} .eg-spin{display:inline-block;width:12px;height:12px;border:2px solid #e3edf9;border-top-color:#53bda7;border-radius:50%;animation:eg-spin .8s linear infinite;vertical-align:-2px}
${R} .eg-tag{font-size:10.5px;font-weight:700;padding:2px 7px;border-radius:5px;border:1px solid #bcd2ee;color:#2a5ea9;white-space:nowrap}
${R} .eg-tag.non{border-color:#e3e9f2;color:#9fb3cf}
@keyframes eg-spin{to{transform:rotate(360deg)}}
@media (max-width:560px){
  ${R} .eg-grid{grid-template-columns:1fr}
  ${R} .eg-head{flex-wrap:wrap}
  ${R} .eg-head .eg-btn-primary{flex:1 1 100%;justify-content:center}
  ${R} .eg-row{flex-wrap:wrap}
  ${R} .eg-overlay{padding:16px 10px}
}
</style>`;

    function syncChip(r) {
      if (r.bacs_etat === 'echec') return `<span class="eg-sync ko" title="${esc(r.bacs_erreur || '')}"><span class="eg-b">B</span>Non reporté</span>
        <button class="eg-btn eg-btn-ghost eg-btn-mini" data-renvoyer="${r.id}">${I.retry} Réessayer</button>`;
      if (r.dans_bacs) return '<span class="eg-sync ok"><span class="eg-b">B</span>Dans BACS</span>';
      if (r.bacs_etat === 'a_envoyer') {
        if (state.envoi[r.id]) return '<span class="eg-sync att"><span class="eg-b">B</span>Envoi dans BACS…</span>';
        return '<span class="eg-sync att"><span class="eg-b">B</span>En attente</span>'
          + (state.bacsActif ? `<button class="eg-btn eg-btn-ghost eg-btn-mini" data-renvoyer="${r.id}">${I.retry} Relancer</button>` : '');
      }
      if (state.bacsActif) return `<button class="eg-btn eg-btn-ghost eg-btn-mini" data-renvoyer="${r.id}"><span class="eg-b">B</span> Reporter dans BACS</button>`;
      return '';
    }
    function listeHtml() {
      const n = state.list ? state.list.length : 0;
      let h = `<div class="eg-head"><div class="eg-head-t">Entourage${n ? ' <span class="eg-count">' + n + '</span>' : ''}</div>`
        + `<button class="eg-btn eg-btn-primary" data-ouvrir="1">${I.plus} Ajouter un proche</button></div>`;
      if (state.notice) h += `<div class="${state.notice.ton === 'alerte' ? 'eg-alert' : 'eg-info' + (state.notice.ton === 'ok' ? ' ok' : '')}">${esc(state.notice.texte)}</div>`;
      if (state.lecture && !state.lecture.attente) h += `<div class="eg-info">${I.spin}<span>Lecture de l’entourage enregistré dans BACS pour ce client : la liste se complète d’elle-même dans quelques minutes.</span></div>`;
      if (state.lecture && state.lecture.attente) h += '<div class="eg-info"><span>La lecture de l’entourage BACS de ce client n’a pas encore été faite (la récolte est occupée). Revenez sur cet onglet un peu plus tard.</span></div>';
      if (state.loading || state.list === null) return h + '<div class="eg-empty">Chargement…</div>';
      if (state.error) return h + `<div class="eg-empty">Erreur : ${esc(state.error)}</div>`;
      if (!n) return h + '<div class="eg-empty">Aucun proche enregistré.<br>Conjoint, enfants, parents, parrain… ajoutez-les avec « Ajouter un proche ».</div>';
      h += '<div class="eg-list">';
      for (const r of state.list) {
        const nom = nomPersonne(r) || ('Fiche n° ' + r.id_proche);
        const tel = r.tel ? `<a href="tel:${esc(String(r.tel).replace(/[^0-9+]/g, ''))}" data-tel="${esc(r.tel)}" data-nom="${esc(nom)}" data-id="${esc(r.id_proche)}" title="Appeler">${esc(r.tel)}</a>` : '';
        const sub = [tel, r.email ? esc(r.email) : '', r.ville ? esc(r.ville) : ''].filter(Boolean).join(' · ');
        h += `<div class="eg-row">
          <span class="eg-row-ic">${I.user}</span>
          <div class="eg-row-main">
            <button class="eg-row-name" data-fiche="${r.id_proche}" title="Ouvrir la fiche">${esc(nom)}</button>
            <div class="eg-row-sub">${sub || 'Fiche n° ' + esc(r.id_proche)}</div>
          </div>
          ${r.principal ? `<span class="eg-prin">${I.star} Principal</span>` : ''}
          <span class="eg-badge ${ROLE_CLS[r.role] || ''}">${esc(r.role_libelle || roleLib(r.role))}</span>
          ${syncChip(r)}
          <button class="eg-ic" data-retirer="${r.id}" data-nom="${esc(nom)}" title="Retirer" aria-label="Retirer">${I.unlink}</button>
        </div>`;
      }
      return h + '</div>';
    }
    function creationHtml(c) {
      let h = '';
      if (c.error) h += `<div class="eg-err">${esc(c.error)}</div>`;
      if (c.duplicate && window.oropraDoublons) h += window.oropraDoublons.html(c.duplicate, 'eg', { saving: c.saving, libelleForce: 'Créer quand même' });
      h += `<div class="eg-newcard"><div class="eg-newcard-h"><div><div class="eg-chip-name">Nouveau particulier</div>
        <div class="eg-chip-sub">Fiche créée dans One Data au moment de l’ajout</div></div>
        <button class="eg-chip-x" data-annuler-creation="1">Rechercher plutôt</button></div><div class="eg-grid">`;
      h += `<div class="eg-f"><label>Civilité</label><select class="eg-select" data-c="CIVILITE">${CIVILITES.map(t => `<option value="${esc(t)}"${c.data.CIVILITE === t ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select></div><div class="eg-f"></div>`;
      h += `<div class="eg-f"><label>Nom <span class="eg-req">*</span></label><input class="eg-input" data-c="NOM" value="${esc(c.data.NOM)}" autocomplete="off"></div>`;
      h += `<div class="eg-f"><label>Prénom</label><input class="eg-input" data-c="PRENOM" value="${esc(c.data.PRENOM)}" autocomplete="off"></div>`;
      h += `<div class="eg-f"><label>Portable</label><input class="eg-input" data-c="TEl_MOB" value="${esc(c.data.TEl_MOB)}" placeholder="06…" autocomplete="off"></div>`;
      h += `<div class="eg-f"><label>Fixe</label><input class="eg-input" data-c="TEL_FIXE" value="${esc(c.data.TEL_FIXE)}" placeholder="01…" autocomplete="off"></div>`;
      h += `<div class="eg-f" style="grid-column:1 / -1"><label>E-mail</label><input class="eg-input" data-c="EMAIL" value="${esc(c.data.EMAIL)}" autocomplete="off"></div>`;
      return h + '</div></div>';
    }
    function modaleHtml() {
      const m = state.modal; if (!m) return '';
      let b = '';
      if (m.error) b += `<div class="eg-err">${esc(m.error)}</div>`;
      b += '<div class="eg-step">1 · Le proche</div>';
      if (m.create) b += creationHtml(m.create);
      else if (m.selected) {
        b += `<div class="eg-chip"><div><div class="eg-chip-name">${esc(m.selected.nom)}</div><div class="eg-chip-sub">${esc(m.selected.sub || '')}${m.selected.dans_bacs ? ' · dans BACS' : ''}</div></div><button class="eg-chip-x" data-changer="1">Changer</button></div>`;
      } else {
        b += '<div class="eg-hint">Cherchez la personne dans la base des particuliers (nom, prénom, portable ou e-mail) : elle y est peut-être déjà.</div>';
        b += `<div class="eg-search">${I.search}<input data-q="1" value="${esc(m.q)}" placeholder="Ex. DUPONT Marie, 06 12 34 56 78, marie@…" autocomplete="off"></div>`;
        if (m.searching) b += '<div class="eg-status">' + I.spin + ' Recherche…</div>';
        if (m.searched && !m.searching) {
          b += '<div class="eg-drop">';
          m.results.forEach((r, i) => {
            const sub = [[r.cp, r.ville].filter(Boolean).join(' '), r.mobile_masque, r.email_masque].filter(Boolean).join(' · ');
            b += `<div class="eg-drop-item" data-pick="${i}"><span class="eg-row-ic">${I.user}</span><div class="eg-drop-main"><div style="font-weight:700">${esc(nomPersonne(r))}</div><div class="eg-drop-sub">${esc(sub || 'Fiche n° ' + r.id_client)}</div></div>${r.dans_bacs ? '<span class="eg-tag">BACS</span>' : '<span class="eg-tag non">Hors BACS</span>'}</div>`;
          });
          b += `<div class="eg-drop-create" data-creer="1">${I.plus} ${m.results.length ? 'Pas la bonne personne ? Créer un particulier' : 'Personne trouvée — créer un particulier'}</div></div>`;
        }
      }
      if (m.selected || m.create) {
        b += '<div class="eg-step">2 · Qui est-ce pour ce client ?</div>';
        b += '<div class="eg-roles">' + ROLES.map(r => `<button type="button" class="eg-role${m.role === r[0] ? ' on' : ''}" data-role="${r[0]}">${esc(r[1])}</button>`).join('') + '</div>';
        b += `<label class="eg-check"><input type="checkbox" data-principal="1"${m.principal ? ' checked' : ''}> Contact principal de la famille</label>`;
        if (state.bacsActif) b += '<div class="eg-hint"><span class="eg-b">B</span> Le proche sera aussi ajouté à l’Entourage dans BACS.</div>';
      }
      const occupe = m.saving || (m.create && m.create.saving);
      const peut = !!(m.selected || m.create);
      const f = `<button class="eg-btn eg-btn-ghost" data-fermer="1">Annuler</button>`
        + `<button class="eg-btn eg-btn-primary" data-enregistrer="1"${(!peut || occupe) ? ' disabled' : ''}>${occupe ? I.spin : (m.create ? I.plus : I.link)} <span>${m.create ? 'Créer et ajouter à l’entourage' : 'Ajouter à l’entourage'}</span></button>`;
      return `<div class="eg-overlay" data-overlay="1"><div class="eg-modal">
        <div class="eg-modal-h"><div class="eg-modal-t">Ajouter un proche</div><button class="eg-ic" data-fermer="1" aria-label="Fermer">${I.x}</button></div>
        <div class="eg-modal-b">${b}</div><div class="eg-modal-f">${f}</div></div></div>`;
    }

    function render() {
      const root = getRoot(); if (!root) return;
      root.innerHTML = STYLE + '<div class="eg-wrap">' + listeHtml() + '</div>' + modaleHtml();
      lier(root);
    }
    function lier(root) {
      const on = (sel, ev, fn) => root.querySelectorAll(sel).forEach(el => el.addEventListener(ev, fn));
      on('[data-ouvrir]', 'click', ouvrirModale);
      on('[data-fermer]', 'click', fermerModale);
      on('[data-overlay]', 'click', (e) => { if (e.target === e.currentTarget) fermerModale(); });
      on('a[data-tel]', 'click', (e) => { const a = e.currentTarget; if (appelerNumero(a.getAttribute('data-tel'), a.getAttribute('data-nom'), a.getAttribute('data-id'))) e.preventDefault(); });
      on('[data-fiche]', 'click', (e) => ouvrirFiche(e.currentTarget.getAttribute('data-fiche')));
      on('[data-retirer]', 'click', (e) => retirer(e.currentTarget.getAttribute('data-retirer'), e.currentTarget.getAttribute('data-nom')));
      on('[data-renvoyer]', 'click', (e) => renvoyer(e.currentTarget.getAttribute('data-renvoyer')));
      on('[data-changer]', 'click', () => { if (state.modal) { state.modal.selected = null; render(); refocus(); } });
      on('[data-creer]', 'click', ouvrirCreation);
      on('[data-annuler-creation]', 'click', () => { if (state.modal) { state.modal.create = null; render(); refocus(); } });
      on('[data-pick]', 'click', (e) => { const i = Number(e.currentTarget.getAttribute('data-pick')); if (state.modal && state.modal.results[i]) choisir(state.modal.results[i]); });
      on('[data-role]', 'click', (e) => { if (state.modal) { state.modal.role = e.currentTarget.getAttribute('data-role'); render(); } });
      on('[data-principal]', 'change', (e) => { if (state.modal) state.modal.principal = e.currentTarget.checked; });
      on('[data-enregistrer]', 'click', enregistrer);
      const q = root.querySelector('[data-q]');
      if (q) q.addEventListener('input', () => onQuery(q.value));
      root.querySelectorAll('[data-c]').forEach(el => el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', () => {
        if (state.modal && state.modal.create) state.modal.create.data[el.getAttribute('data-c')] = el.value;
      }));
      on('[data-od-action="dup-dismiss"]', 'click', () => { if (state.modal && state.modal.create) { state.modal.create.duplicate = null; render(); } });
      on('[data-od-action="dup-force"]', 'click', () => { if (state.modal && state.modal.create) { state.modal.create.dupAck = true; state.modal.create.duplicate = null; enregistrer(); } });
      on('[data-od-action="dup-open"]', 'click', (e) => {
        const id = Number(e.currentTarget.getAttribute('data-od-idvu')); const m = state.modal;
        if (m && m.create && id) {
          const c = (m.create.duplicate && m.create.duplicate.candidats || []).find(x => Number(x.id_client) === id) || {};
          const a = c.apercu || {};
          m.selected = { id: id, nom: [a.civilite, a.prenom, a.nom].filter(Boolean).join(' ') || ('Fiche n° ' + id),
                         sub: [a.code_postal, a.ville].filter(Boolean).join(' '), dans_bacs: false };
          m.create = null; render();
        }
      });
    }

    // ------------------------------------------------------------ démarrage
    render();
    charger().then(chargerContexte);
    let last = currentIdvu();
    const iv = setInterval(() => {
      if (!__anchor.isConnected) { clearInterval(iv); return; }
      const id = currentIdvu();
      if (id !== last) { last = id; state.list = null; state.modal = null; state.notice = null; state.lecture = null; if (suivi) { clearInterval(suivi); suivi = null; } charger().then(chargerContexte); }
    }, 600);
  }
});
