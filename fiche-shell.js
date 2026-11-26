// ============================================================================
//  FICHE CLIENT — SHELL — module One Data (OD.define)  v19
//  v19 (26/11/2026) : bouton « Passer la main » (vendeurs et chefs des ventes) :
//  inviter un collègue du site sur ce client avec une note, et lui confier le
//  suivi (ses leads ouverts sur ce client passent dans la file du collègue).
//  Demande de J. Faugeras (Team Colin). RPC passer_main_contexte / passer_main.
//  v18 (18/11/2026) : « Appeler » compose le fixe quand le client n'a pas de
//  mobile ; sans aucun numéro, un message le dit (le clic ne faisait rien).
//  v17 (04/11/2026) : onglet « Entourage » (module entourage v1) sur la fiche
//  d'un particulier : conjoint, enfants, parents, parrain… comme la rubrique
//  Entourage de BACS. Absent sur une société.
//  v16 (04/11/2026) : l'onglet Entreprise s'affiche aussi sur une société, sous
//  le nom « Interlocuteurs » : il liste les particuliers rattachés (module
//  entreprise v4) et permet d'en ajouter, comme dans BACS.
//  v15 (03/11/2026) : accès « Appels entrants » (rôle 13) — bouton
//  « Nouveau lead » en tête des actions : il ouvre la fenêtre du module
//  lead-appel (API window.__odLeadAppel, v3) PRÉ-REMPLIE avec ce client.
//  Pas de bouton BACS pour ce rôle (aucun lien BACS).
//  v14 (22/10/2026) : bouton « B » — ouvre le compte du client dans BACS
//  (client_compte_bacs), affiché dès que la fiche est reliée à un compte BACS.
//  v13 (22/10/2026) : le bouton « Appeler » n'apparait qu'aux licences Connect
//  et Full (OD.peut('appel'), socle v29).
//  v1 (Lot A)
//  Orchestrateur : rend le squelette (en-tête + boutons + onglets) dans __anchor
//  et fournit les divs de montage. client via ctx.supabase ; self-boot retiré ;
//  __fsWatch (changement de client) conservé. Onglets encore par id (les briques
//  Lot B/C basculeront chacune en ancre data-od-module).
// ============================================================================
// ============================================================================
//  FICHE CLIENT — SHELL (brique 1)  ·  root: <div id="oropra-fiche-shell"></div>
//  Remplace l'en-tête natif + les 5 boutons + la barre d'onglets (composant Tabs).
//  Le contenu de chaque onglet reste porté par les modules JS existants, qui se
//  montent dans les divs que ce shell fournit :
//     Fiche client  -> #oropra-client-fiche        (cfMain)
//     RDV           -> #rdv-root                    (module RDV)
//     P.Commerciales-> #pcom-root                   (module PCOM)
//     Entreprise    -> #oropra-entreprise-rattachement (entrMain)
//     Likes / Contacts / Véhicules / Historique -> divs prêtes (modules à venir)
//  Bouton Appeler = VoIP JS. Les 4 autres boutons : câblage dans les briques suivantes.
// ============================================================================
OD.define('fiche-shell', {
  mount(__anchor, ctx) {
    if (!window.wwLib) return;
    __anchor.id = 'oropra-fiche-shell';
    const ROOT_ID = 'oropra-fiche-shell';
  const SELECTED_CLIENT_VAR = '55490583-c88b-4748-916e-4d203db07742';
  const doc = __anchor.ownerDocument || document;
  const sb = ctx.supabase;

  // ---- onglets : libellé, icône, div de montage du module ----
  const TABS = [
    { key: 'fiche',      label: 'Fiche client',       icon: 'user',  mount: 'oropra-client-fiche' },
    { key: 'likes',      label: 'Likes',              icon: 'heart', mount: 'oropra-likes-root' },
    { key: 'contacts',   label: 'Contacts',           icon: 'card',  mount: 'oropra-contacts-root' },
    { key: 'rdv',        label: 'RDV',                icon: 'cal',   mount: 'rdv-root' },
    { key: 'vehicules',  label: 'Véhicules',          icon: 'car',   mount: 'oropra-vehicules-root' },
    { key: 'pcom',       label: 'P. Commerciales',    icon: 'doc',   mount: 'pcom-root' },
    { key: 'entreprise', label: 'Entreprise',         icon: 'build', mount: 'oropra-entreprise-rattachement' },
    { key: 'entourage',  label: 'Entourage',          icon: 'fam',   mount: 'oropra-entourage' },
    { key: 'historique', label: 'Historique client',  icon: 'hist',  mount: 'oropra-historique-root' }
  ];
  // modules déjà disponibles (les autres afficheront un placeholder pour l'instant)
  const READY = { fiche: true, likes: true, contacts: true, vehicules: true, rdv: true, pcom: true, entreprise: true, entourage: true, historique: true };

  const state = { tab: 'fiche', client: null, idvu: null };
    // Onglets migrés en module OD.define -> montés par le loader dans une ancre.
    // (les autres gardent leur div par id, remplie par l'ancien bloc on-page-load)
    const MOD = { fiche: 'cf-fiche', likes: 'likes', contacts: 'contacts', rdv: 'rdv', vehicules: 'vehicules', pcom: 'pcom', entreprise: 'entreprise', entourage: 'entourage', historique: 'historique' };

  // ---------------------------------------------------------------- helpers
  function esc(s) { if (s == null) return ''; return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;'); }
  function cap(s) { return (s || '').toString().toLowerCase().replace(/(^|[\s\-'])([a-zà-ÿ])/g, (m, sep, c) => sep + c.toUpperCase()); }
  function readVar(id) { try { return wwLib.wwVariable.getValue(id); } catch (e) { return null; } }
  function currentIdvu() { const c = readVar(SELECTED_CLIENT_VAR); return c && c.IDVu != null ? Number(c.IDVu) : null; }
  // Arrivee par lien externe (integration 3CX, e-mail, SMS...) : ?idvu=123
  // Les liens internes, eux, posent deja la variable avant de naviguer.
  function idvuFromUrl() {
    try {
      const w = (wwLib.getFrontWindow && wwLib.getFrontWindow()) || window;
      const q = new URLSearchParams(w.location.search || '');
      const raw = q.get('idvu') || q.get('client') || q.get('id');
      const n = raw != null ? Number(String(raw).replace(/[^0-9]/g, '')) : NaN;
      return Number.isFinite(n) && n > 0 ? n : null;
    } catch (e) { return null; }
  }
  function tabFromUrl() {
    try {
      const w = (wwLib.getFrontWindow && wwLib.getFrontWindow()) || window;
      const t = new URLSearchParams(w.location.search || '').get('tab');
      return t && TABS.some(x => x.key === t) ? t : null;
    } catch (e) { return null; }
  }
  // Nettoie l'URL une fois le client charge (evite de re-forcer au retour arriere)
  function cleanUrl() {
    try {
      const w = (wwLib.getFrontWindow && wwLib.getFrontWindow()) || window;
      const u = new URL(w.location.href);
      let touched = false;
      ['idvu', 'client', 'id', 'tab'].forEach(k => { if (u.searchParams.has(k)) { u.searchParams.delete(k); touched = true; } });
      if (touched) w.history.replaceState({}, '', u.pathname + (u.search || '') + (u.hash || ''));
    } catch (e) {}
  }
  function isSoc(c) { return c && (c.idmultivu === 1 || c.idmultivu === '1'); }
  function clientName(c) {
    if (!c) return '—';
    return isSoc(c) ? [c.CIVILITE, cap(c.NOM)].filter(Boolean).join(' ')
                    : [c.CIVILITE, cap(c.PRENOM), cap(c.NOM)].filter(Boolean).join(' ');
  }
  function normPhone(n) { const t = (n || '').replace(/\s+/g, ''); if (!t) return ''; if (t[0] === '+') return t; if (t[0] === '0') return '+33' + t.slice(1); return t; }

  // ---------------------------------------------------------------- data
  async function loadClient() {
    const idvu = currentIdvu();
    if (idvu == null) { state.client = null; return; }
    try {
      const { data, error } = await sb.from('CLIENT')
        .select('IDVu, CIVILITE, NOM, PRENOM, EMAIL, TEl_MOB, TEL_FIXE, idmultivu, code_postal, ville')
        .eq('IDVu', idvu).single();
      if (error) throw error;
      state.client = data; state.idvu = idvu;
      consulter(idvu);
      chargerCompteBacs(idvu);
    } catch (e) { console.error('[fiche-shell] CLIENT', e); state.client = null; }
  }

  // ---------------------------------------------------------------- compte BACS (v14)
  // Lu à part : l'en-tête s'affiche sans attendre, le bouton « B » apparaît
  // dès que la réponse arrive. Aucun compte = aucun bouton.
  async function chargerCompteBacs(idvu) {
    state.bacs = null;
    try {
      const { data, error } = await sb.rpc('client_compte_bacs', { p_id_client: Number(idvu) });
      if (error || !data || !data.url) return;
      if (state.idvu !== idvu) return;            // la fiche a changé entre-temps
      state.bacs = data;
      const holder = __anchor && __anchor.querySelector('#fs-header-holder');
      if (holder) { holder.innerHTML = headerHtml(); bindHeader(holder); }
    } catch (e) { /* tenant sans BACS : pas de bouton */ }
  }
  function ouvrirBacs() {
    const u = state.bacs && state.bacs.url; if (!u) return;
    try { ((wwLib.getFrontWindow && wwLib.getFrontWindow()) || window).open(u, '_blank', 'noopener'); }
    catch (e) { try { window.open(u, '_blank'); } catch (e2) {} }
  }

  // ---------------------------------------------------------------- cycle de consultation
  // RÈGLE (01/09/2026) : ouvrir une fiche client crée un cycle de
  // CONSULTATION sur le site sélectionné dans la barre du haut, s'il n'y a
  // pas déjà un cycle ouvert pour ce client sur ce site.
  //
  // ⚠️ v11 (05/10/2026) : la règle n'était appliquée que par la recherche
  // client et l'historique. Toute autre entrée — redirection après un
  // arbitrage, lien externe ?idvu=, lead management, kanban, agenda —
  // ouvrait la fiche SANS cycle. Constaté sur la fiche 16674 ouverte après
  // une fusion : aucun cycle, donc fiche non modifiable (la policy de mise
  // à jour de CLIENT passe par CYCLE_COM). Six cycles de consultation en
  // un mois sur tout le groupe.
  //
  // Appliquée ICI, au chargement de la fiche, elle vaut pour toutes les
  // entrées, présentes et futures. cycle_consulter ne fait rien si un cycle
  // ouvert ou de consultation existe déjà : les appels de la recherche et
  // de l'historique, conservés, ne créent pas de doublon.
  //
  // Non bloquant : la fiche s'affiche même si l'appel échoue. Sans site
  // sélectionné (« Tout mon périmètre »), rien n'est créé.
  function consulter(idvu) {
    try {
      const w = (wwLib.getFrontWindow && wwLib.getFrontWindow()) || window;
      const siteApi = w.oropraSite || window.oropraSite || null;
      const idSite = siteApi && siteApi.getSiteId ? siteApi.getSiteId() : null;
      if (idSite == null || idvu == null) return;
      const user = w.oropraUser || {};
      sb.rpc('cycle_consulter', {
        p_id_client: Number(idvu),
        p_id_site:   Number(idSite),
        p_id_user:   user.ID_User != null ? Number(user.ID_User) : null
      }).then(r => { if (r && r.error) console.warn('[fiche-shell] cycle_consulter:', r.error.message); },
              e => console.warn('[fiche-shell] cycle_consulter:', e && e.message));
    } catch (e) { console.warn('[fiche-shell] cycle_consulter:', e && e.message); }
  }

  // ---------------------------------------------------------------- VoIP (bouton Appeler)
  function pickVoipUI() {
    const cands = [];
    try { cands.push(wwLib.getFrontWindow && wwLib.getFrontWindow()); } catch (e) {}
    try { cands.push(typeof globalThis !== 'undefined' ? globalThis : null); } catch (e) {}
    cands.push(window);
    try { cands.push(window.parent); } catch (e) {}
    try { cands.push(window.top); } catch (e) {}
    for (let i = 0; i < cands.length; i++) { try { if (cands[i] && cands[i].__VOIP_UI__) return cands[i].__VOIP_UI__; } catch (e) {} }
    return null;
  }
  // Recherche du pilote 3CX expose par le module phone3cx (tenants equipes d'un PBX)
  function pick3cx() {
    const cands = [];
    try { cands.push(wwLib.getFrontWindow && wwLib.getFrontWindow()); } catch (e) {}
    try { cands.push(typeof globalThis !== 'undefined' ? globalThis : null); } catch (e) {}
    cands.push(window);
    try { cands.push(window.parent); } catch (e) {}
    try { cands.push(window.top); } catch (e) {}
    for (let i = 0; i < cands.length; i++) {
      try { if (cands[i] && cands[i].OD3CX && typeof cands[i].OD3CX.appeler === 'function') return cands[i].OD3CX; } catch (e) {}
    }
    return null;
  }

  // Téléphonie incluse dans les licences Connect et Full (socle v29 : OD.peut).
  function roleCourant() {
    try { const w = (wwLib.getFrontWindow && wwLib.getFrontWindow()) || window; const u = w.oropraUser || window.oropraUser || {}; return Number(u.ID_Role != null ? u.ID_Role : u.id_role); }
    catch (e) { return null; }
  }
  function appelsEntrants() { return roleCourant() === 13; }
  // v15 : ouvre « Nouveau lead » (module lead-appel) pré-rempli avec ce client.
  function ouvrirLeadAppel() {
    let api = null;
    try { const w = (wwLib.getFrontWindow && wwLib.getFrontWindow()) || window; api = w.__odLeadAppel || window.__odLeadAppel || null; } catch (e) { api = window.__odLeadAppel || null; }
    if (api && typeof api.ouvrir === 'function') { api.ouvrir(state.client); return; }
    try { alert('Le module « Nouveau lead » n\'est pas encore chargé : rechargez la page (F5).'); } catch (e) {}
  }
  function peutAppeler() { return (typeof OD === 'undefined' || typeof OD.peut !== 'function' || OD.peut('appel')); }

  function callClient() {
    if (!peutAppeler()) return;
    const c = state.client; if (!c) return;
    // v18 : mobile, sinon fixe ; sans aucun numéro, on le dit au lieu de ne rien faire.
    const brut = (c.TEl_MOB && String(c.TEl_MOB).trim()) ? c.TEl_MOB : c.TEL_FIXE;
    const to = normPhone(brut);
    if (!to) { try { alert('Aucun numéro de téléphone n\'est renseigné sur cette fiche : ajoutez un mobile ou un fixe pour pouvoir appeler ce client.'); } catch (e) {} return; }

    // 1) Tenant equipe 3CX : le PBX fait sonner le poste du vendeur, puis le client.
    const cx = pick3cx();
    if (cx) {
      cx.appeler(to, { nom: clientName(c), idvu: c.IDVu });
      return;
    }

    // 2) Tenant Twilio : appel porte par le navigateur.
    const device = (typeof globalThis !== 'undefined' && globalThis.__ONE_DATA__ && globalThis.__ONE_DATA__.device)
      || window._twilioDevice || (window.parent && window.parent._twilioDevice) || (window.top && window.top._twilioDevice);
    const UI = pickVoipUI();
    const w = (wwLib.getFrontWindow && wwLib.getFrontWindow()) || window;
    if (!device || typeof device.connect !== 'function') { try { w.location.href = 'tel:' + to; } catch (e) { window.location.href = 'tel:' + to; } return; }
    (async () => {
      try {
        const call = await device.connect({ params: { To: to } });
        globalThis.__ONE_DATA__ = globalThis.__ONE_DATA__ || {}; globalThis.__ONE_DATA__.call = call;
        try { window._twilioCall = call; window.parent._twilioCall = call; window.top._twilioCall = call; } catch (e) {}
        if (UI) UI.incall({ name: clientName(c), number: brut, idvu: c.IDVu, client: c });
        call.on('accept', () => { if (UI) { UI.answer(); UI.minimize(true); } });
        call.on('disconnect', () => { if (UI) UI.close(); try { window._twilioCall = null; window.parent._twilioCall = null; window.top._twilioCall = null; } catch (e) {} if (globalThis.__ONE_DATA__) globalThis.__ONE_DATA__.call = null; });
      } catch (e) { console.error('[fiche-shell] VoIP', e); }
    })();
  }

  // Recherche d'un global exposé par un autre embed (sandbox : front != global != top)
  function pickCtxProp(prop) {
    const cands = [];
    try { cands.push(wwLib.getFrontWindow && wwLib.getFrontWindow()); } catch (e) {}
    try { cands.push(typeof globalThis !== 'undefined' ? globalThis : null); } catch (e) {}
    cands.push(window);
    try { cands.push(window.parent); } catch (e) {}
    try { cands.push(window.top); } catch (e) {}
    for (let i = 0; i < cands.length; i++) { try { if (cands[i] && cands[i][prop]) return cands[i][prop]; } catch (e) {} }
    return null;
  }
  function openSms() {
    const c = state.client; if (!c) return;
    const UI = pickCtxProp('__SMS_UI__');
    if (UI && typeof UI.open === 'function') { UI.open({ client: c }); return; }
    // fallback : app SMS native du device
    const to = normPhone(c.TEl_MOB);
    if (to) { const w = (wwLib.getFrontWindow && wwLib.getFrontWindow()) || window; try { w.location.href = 'sms:' + to; } catch (e) { window.location.href = 'sms:' + to; } }
    else console.warn('[fiche-shell] SMS UI introuvable et pas de mobile');
  }
  function openWa() {
    const c = state.client; if (!c) return;
    const UI = pickCtxProp('__WA_UI__');
    if (UI && typeof UI.open === 'function') { UI.open({ client: c }); return; }
    console.warn('[fiche-shell] WhatsApp UI introuvable');
  }
  function openMail() {
    const c = state.client; if (!c) return;
    const UI = pickCtxProp('__EMAIL_UI__');
    if (UI && typeof UI.open === 'function') { UI.open({ mode: 'new', client: c }); return; }
    console.warn('[fiche-shell] Email UI introuvable');
  }

  // les boutons restants (WA / Email) : hooks à câbler dans les briques suivantes
  function todo(name) { console.log('[fiche-shell] bouton ' + name + ' — à câbler (brique dédiée)'); }

  // ---------------------------------------------------------------- icônes
  const IC = {
    plus: '<path d="M12 5v14M5 12h14"/>',
    user: '<path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    heart: '<path d="M12 21s-7-4.6-9.3-8.3C1 9.5 2.4 6 5.7 6c2 0 3.2 1.3 3.8 2.3l.5.9.5-.9C11.1 7.3 12.3 6 14.3 6 17.6 6 19 9.5 21.3 12.7 19 16.4 12 21 12 21z"/>',
    card: '<rect x="2.5" y="5" width="19" height="14" rx="2"/><path d="M2.5 9.5h19M6 13h5M6 16h3"/>',
    cal: '<rect x="3.5" y="4.5" width="17" height="16" rx="2"/><path d="M3.5 9h17M8 3v3M16 3v3"/>',
    car: '<path d="M5 16.5h14M6.5 16.5v2M17.5 16.5v2"/><path d="M4 16.5l1.5-5A2 2 0 0 1 7.4 10h9.2a2 2 0 0 1 1.9 1.5l1.5 5"/><circle cx="7.5" cy="16.5" r="1.6"/><circle cx="16.5" cy="16.5" r="1.6"/>',
    doc: '<path d="M6 2.5h8l4 4v15a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1v-18a1 1 0 0 1 1-1z"/><path d="M14 2.5v4h4M8.5 13h7M8.5 16.5h7"/>',
    fam: '<circle cx="9" cy="8" r="3.5"/><path d="M2.5 20c0-3.5 3-5.5 6.5-5.5s6.5 2 6.5 5.5"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14c2.6 0 4.5 1.5 4.5 4"/>',
    build: '<rect x="4" y="3" width="16" height="18" rx="1.5"/><path d="M9 8h.01M15 8h.01M9 12h.01M15 12h.01M9 16h6"/>',
    hist: '<path d="M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/><path d="M4 21a8 8 0 0 1 13-6.2"/><path d="M20 16v3h-3"/>',
    phone: '<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6 19.8 19.8 0 0 1-3.1-8.7A2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1 1 .4 1.9.7 2.8a2 2 0 0 1-.5 2.1L8.1 9.9a16 16 0 0 0 6 6l1.3-1.2a2 2 0 0 1 2.1-.5c.9.3 1.8.6 2.8.7a2 2 0 0 1 1.7 2z"/>',
    wa: '<path d="M12 3a9 9 0 0 0-7.7 13.6L3 21l4.5-1.3A9 9 0 1 0 12 3z"/><path d="M8.5 8.8c.2-.5.4-.5.6-.5h.5c.2 0 .4 0 .6.4l.7 1.6c0 .2.1.3 0 .5l-.4.5c-.1.2-.2.3 0 .5.6 1 1.4 1.6 2.3 2 .2.1.4.1.5 0l.5-.6c.1-.2.3-.2.5-.1l1.5.7c.2.1.3.2.3.4 0 .5-.7 1.3-1.2 1.4-1.3.2-2.9-.7-4-1.7-.8-.8-1.6-1.9-1.7-3 0-.4 0-.8.2-1z" fill="currentColor" stroke="none"/>',
    mail: '<rect x="2.5" y="4.5" width="19" height="15" rx="2"/><path d="m3 6 9 6.5L21 6"/>',
    sms: '<path d="M4 4.5h16a1 1 0 0 1 1 1v9a1 1 0 0 1-1 1H8l-4 3.5v-3.5H4a1 1 0 0 1-1-1v-9a1 1 0 0 1 1-1z"/>',
    rpv: '<path d="M10 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"/><path d="M2.5 21a7.5 7.5 0 0 1 13-5.1"/><path d="M17.5 15v6M20.5 18h-6"/>'
  };
  const svg = (p, cls) => '<svg class="' + (cls || '') + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round">' + p + '</svg>';

  // ---------------------------------------------------------------- styles
  const CSS = `
#${ROOT_ID}{--dk:#1F4A85;--md:#2a5ea9;--gr:#53bda7;--rd:#e24b4a;--am:#e6a817;--bd:#e8eef7;--bd2:#eef2f8;--mut:#7a98c5;--soft:#fbfcfe;--hov:#f2f6fc;
  font-family:"Nunito Sans",system-ui,sans-serif;color:var(--dk);display:block}
#${ROOT_ID} *{box-sizing:border-box}
.fs-card{background:#fff;border:1px solid var(--bd);border-radius:16px;box-shadow:0 6px 22px rgba(31,74,133,.05)}
/* en-tête */
.fs-head{padding:18px 22px;margin-bottom:14px}
.fs-name{font-size:21px;font-weight:800;letter-spacing:-.4px;margin:0 0 6px}
.fs-detail{display:flex;flex-wrap:wrap;gap:18px;font-size:13px;color:var(--mut);font-weight:600;margin-bottom:14px}
.fs-detail span{display:inline-flex;align-items:center;gap:6px}
.fs-detail svg{width:14px;height:14px;opacity:.8}
.fs-actions{display:flex;flex-wrap:wrap;gap:10px}
.fs-btn{display:inline-flex;align-items:center;gap:8px;border:1.5px solid var(--bd);background:#fff;border-radius:10px;padding:9px 16px;font:inherit;font-size:14px;font-weight:700;cursor:pointer;transition:.15s;color:var(--dk)}
.fs-btn svg{width:17px;height:17px}
.fs-btn:hover{background:var(--hov)}
.fs-btn:focus{outline:none}
.fs-btn:focus-visible{outline:2px solid var(--md);outline-offset:2px}
.fs-btn.call{color:var(--md);border-color:#c9d9ee}.fs-btn.call:hover{background:#eef4fc}
.fs-btn.wa{color:#1f9d63;border-color:#bfe6cf}.fs-btn.wa:hover{background:#eafaf1}
.fs-btn.mail{color:var(--dk);border-color:#d7dfe9}.fs-btn.mail:hover{background:#f2f5f9}
.fs-btn.sms{color:var(--am);border-color:#f0dca6}.fs-btn.sms:hover{background:#fdf7e8}
.fs-btn.rpv{color:var(--rd);border-color:#f2c4c4}.fs-btn.rpv:hover{background:#fdf1f1}
.fs-btn.passer{color:#5A72A0;border-color:#DCE4F0;border-style:dashed}.fs-btn.passer:hover{background:#F5F8FC}
.fs-toast{position:fixed;left:50%;bottom:24px;transform:translate(-50%,20px);background:#14305A;color:#fff;padding:11px 18px;border-radius:10px;font-size:14px;font-weight:700;opacity:0;transition:.25s;z-index:100001;max-width:calc(100vw - 32px);box-shadow:0 10px 30px rgba(20,48,90,.3)}
.fs-toast.on{opacity:1;transform:translate(-50%,0)}
.fs-btn.lead{background:var(--md);border-color:var(--md);color:#fff}.fs-btn.lead:hover{background:var(--dk);border-color:var(--dk)}
.fs-btn.bacs{color:var(--dk);border-color:#c9d9ee}.fs-btn.bacs:hover{background:#eef4fc}
.fs-btn .fs-b{display:inline-flex;align-items:center;justify-content:center;width:20px;height:20px;border-radius:6px;background:var(--dk);color:#fff;font-weight:900;font-size:12px;line-height:1}
/* onglets */
.fs-tabs-wrap{padding:14px 16px}
.fs-tabs{display:flex;flex-wrap:wrap;gap:8px;justify-content:center}
.fs-tab{display:inline-flex;align-items:center;gap:7px;border:1px solid var(--bd);background:#fff;border-radius:10px;padding:8px 14px;font:inherit;font-size:13px;font-weight:700;color:var(--dk);cursor:pointer;transition:.15s;position:relative}
.fs-tab svg{width:15px;height:15px;color:var(--md)}
.fs-tab:hover{background:var(--soft)}
.fs-tab.on{border-color:transparent;background:var(--soft)}
.fs-tab.on::after{content:"";position:absolute;left:14px;right:14px;bottom:-1px;height:2.5px;background:var(--md);border-radius:2px}
/* contenu */
.fs-content{margin-top:14px}
#${ROOT_ID} .fs-pane{display:none}
#${ROOT_ID} .fs-pane.on{display:block}
#${ROOT_ID} .fs-pane--mount{padding:16px}
.fs-ph{padding:60px 20px;text-align:center;color:var(--mut);font-size:14px}
#fs-rpv-overlay{position:fixed;inset:0;z-index:10000;display:flex;align-items:center;justify-content:center}
.fs-rpv-bg{position:absolute;inset:0;background:rgba(20,40,80,.45)}
.fs-rpv-box{position:relative;background:#fff;border-radius:18px;width:min(920px,94vw);max-height:96vh;overflow-y:auto;box-shadow:0 24px 60px rgba(20,40,80,.35);padding:30px 34px 26px}
.fs-rpv-x{position:absolute;top:12px;right:14px;z-index:3;width:30px;height:30px;border:none;background:#f2f6fc;border-radius:8px;font-size:22px;line-height:1;color:#5a7196;cursor:pointer;display:inline-flex;align-items:center;justify-content:center}
.fs-rpv-x:hover{color:#1F4A85;background:#e6eef8}
@media(max-width:680px){.fs-tabs{justify-content:flex-start}.fs-detail{gap:12px}.fs-rpv-box{padding:14px}}
`;

  // ---------------------------------------------------------------- render
  function ensureCss() {
    if (doc.getElementById('fs-css')) return;
    const head = doc.head || doc.getElementsByTagName('head')[0] || doc.documentElement;
    const st = doc.createElement('style'); st.id = 'fs-css'; st.textContent = CSS; head.appendChild(st);
  }
  // ── Passer la main (26/11/2026, demande de J. Faugeras) ───────────────────
  // Panneau commun à la fiche client et à la fiche d'un lead : le vendeur choisit
  // un collègue (l'équipe du site d'abord, les autres sites par filtres marque /
  // affaire / site / VN-VO et recherche), un motif et écrit une note de contexte.
  // Le collègue est notifié ; avec « Lui confier le suivi », les leads ouverts du
  // vendeur sur ce client (et ses relances de campagne en cours) passent chez
  // lui ; un lead va sur son site s'il travaille ailleurs, une relance reste sur
  // le sien (RPC passer_main_contexte / passer_main).
  var PM_MOTIFS = [['projet_vn', 'Projet VN'], ['projet_vo', 'Projet VO'], ['deja_suivi', 'Client déjà suivi par ce collègue'], ['absence', 'Absence'], ['autre', 'Autre']];
  var PM_CSS = ''
    + '.pm-ov{position:fixed;inset:0;z-index:100000;background:rgba(20,48,90,.38);display:flex;align-items:center;justify-content:center;padding:16px;font-family:inherit}'
    + '.pm{background:#fff;border-radius:14px;width:100%;max-width:540px;max-height:92vh;overflow:auto;box-shadow:0 18px 50px rgba(20,48,90,.28);color:#14305A}'
    + '.pm-h{display:flex;align-items:flex-start;justify-content:space-between;gap:12px;padding:18px 20px 10px;border-bottom:1px solid #E8EEF7}'
    + '.pm-h h3{margin:0;font-size:17px;font-weight:800}.pm-h p{margin:3px 0 0;font-size:13px;color:#5A72A0}'
    + '.pm-x{border:0;background:none;font-size:24px;line-height:1;color:#5A72A0;cursor:pointer;padding:2px 6px}'
    + '.pm-b{padding:14px 20px 4px;display:flex;flex-direction:column;gap:14px}'
    + '.pm-l{font-size:12.5px;font-weight:800;color:#5A72A0;margin:0 0 6px;display:block}'
    + '.pm select,.pm textarea,.pm input[type=search]{width:100%;box-sizing:border-box;border:1.5px solid #DCE4F0;border-radius:9px;padding:9px 11px;font:inherit;font-size:14px;color:#14305A;background:#fff;min-width:0}'
    + '.pm select:focus,.pm textarea:focus,.pm input[type=search]:focus{outline:none;border-color:#1F4A85}'
    + '.pm textarea{min-height:92px;resize:vertical;line-height:1.45}'
    + '.pm-chips{display:flex;flex-wrap:wrap;gap:6px}'
    + '.pm-chips button{border:1.5px solid #DCE4F0;background:#fff;border-radius:999px;padding:6px 12px;font:inherit;font-size:13px;font-weight:700;color:#5A72A0;cursor:pointer}'
    + '.pm-chips button[aria-pressed="true"]{border-color:#1F4A85;background:#E8EEF7;color:#1F4A85}'
    // Sélecteur de collègue
    + '.pm-onglets{display:flex;background:#F0F4FA;border-radius:10px;padding:3px;gap:3px;margin-bottom:8px}'
    + '.pm-onglets button{flex:1;border:0;background:none;border-radius:8px;padding:8px 10px;font:inherit;font-size:13px;font-weight:800;color:#5A72A0;cursor:pointer;line-height:1.25}'
    + '.pm-onglets button[aria-selected="true"]{background:#fff;color:#1F4A85;box-shadow:0 1px 3px rgba(20,48,90,.12)}'
    + '.pm-liste{border:1.5px solid #DCE4F0;border-radius:10px;max-height:260px;overflow:auto}'
    + '.pm-gr{position:sticky;top:0;background:#F5F8FC;padding:6px 12px;font-size:11.5px;font-weight:800;letter-spacing:.03em;text-transform:uppercase;color:#5A72A0;border-bottom:1px solid #E8EEF7}'
    + '.pm-p{display:flex;align-items:center;gap:10px;width:100%;border:0;border-bottom:1px solid #EEF2F8;background:#fff;padding:9px 12px;font:inherit;text-align:left;cursor:pointer;color:#14305A}'
    + '.pm-p:last-child{border-bottom:0}.pm-p:hover{background:#F5F8FC}'
    + '.pm-p[aria-checked="true"]{background:#E8EEF7}'
    + '.pm-rd{flex:none;width:16px;height:16px;border-radius:50%;border:2px solid #B7C5DB;box-sizing:border-box}'
    + '.pm-p[aria-checked="true"] .pm-rd{border:5px solid #1F4A85}'
    + '.pm-p span.t{flex:1;min-width:0}.pm-p b{display:block;font-size:14px;font-weight:700}'
    + '.pm-p small{display:block;font-size:12.5px;color:#5A72A0;margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}'
    + '.pm-bad{flex:none;font-size:11.5px;font-weight:800;color:#1F7A4D;background:#E6F4EC;border-radius:999px;padding:3px 8px}'
    + '.pm-filtres{display:flex;flex-wrap:wrap;gap:8px;margin-bottom:8px}'
    + '.pm-filtres .pm-q,.pm-filtres .pm-chips{flex:1 1 100%}'
    + '.pm-n{display:flex;align-items:center;gap:6px;width:100%;border:0;border-bottom:1px solid #EEF2F8;background:#fff;padding:9px 12px;font:inherit;font-size:14px;font-weight:800;color:#14305A;text-align:left;cursor:pointer}'
    + '.pm-n:hover{background:#F5F8FC}.pm-n .t{flex:1;min-width:0}.pm-n em{font-style:normal;font-size:12px;font-weight:600;color:#5A72A0;flex:none}'
    + '.pm-chev{width:14px;flex:none;color:#5A72A0;font-size:11px}'
    + '.pm-n.niv1{padding-left:28px;font-weight:700}.pm-n.niv2{padding-left:44px;font-weight:600}.pm-n.niv3{padding-left:60px;font-weight:600}'
    + '.pm-p.niv1{padding-left:30px}.pm-p.niv2{padding-left:48px}.pm-p.niv3{padding-left:66px}'
    + '.pm-vide{padding:14px 12px;font-size:13px;color:#5A72A0}'
    + '.pm-plus{padding:8px 12px;font-size:12.5px;color:#5A72A0;background:#F5F8FC}'
    + '.pm-choisi{display:flex;align-items:center;gap:10px;border:1.5px solid #1F4A85;background:#F5F8FC;border-radius:10px;padding:10px 12px}'
    + '.pm-choisi span.t{flex:1;min-width:0}.pm-choisi b{display:block;font-size:14.5px}.pm-choisi small{display:block;font-size:12.5px;color:#5A72A0;margin-top:1px}'
    + '.pm-chg{flex:none;border:1.5px solid #DCE4F0;background:#fff;border-radius:8px;padding:6px 10px;font:inherit;font-size:13px;font-weight:800;color:#1F4A85;cursor:pointer}'
    // Bas du panneau
    + '.pm-conf{display:flex;gap:10px;align-items:flex-start;background:#F5F8FC;border:1px solid #DCE4F0;border-radius:10px;padding:11px 12px;font-size:13.5px;line-height:1.45;cursor:pointer}'
    + '.pm-conf input{margin-top:3px;width:17px;height:17px;accent-color:#1F4A85}'
    + '.pm-conf b{display:block;color:#14305A}.pm-conf small{display:block;color:#5A72A0;margin-top:2px}'
    + '.pm-conf.off{opacity:.6;cursor:default}'
    + '.pm-hint{margin:0;font-size:12.5px;color:#5A72A0;line-height:1.45}'
    + '.pm-err{margin:0;padding:8px 11px;border-radius:8px;background:#FDECEA;color:#B42318;font-size:13px}'
    + '.pm-f{display:flex;justify-content:flex-end;gap:8px;padding:14px 20px 18px}'
    + '.pm-f button{border-radius:9px;padding:9px 16px;font:inherit;font-size:14px;font-weight:800;cursor:pointer}'
    + '.pm-annuler{border:1.5px solid #DCE4F0;background:#fff;color:#14305A}'
    + '.pm-ok{border:0;background:#1F4A85;color:#fff}.pm-ok[disabled]{opacity:.55;cursor:default}'
    + '@media (max-width:560px){.pm-ov{align-items:flex-end;padding:0}.pm{max-width:none;border-radius:14px 14px 0 0;max-height:94vh}.pm-f button{flex:1}'
    + '.pm select,.pm textarea,.pm input[type=search]{font-size:16px}.pm-liste{max-height:42vh}}';
  var PM_ICONE = '<path d="M7 7h11l-3-3M17 17H6l3 3"/><circle cx="4.5" cy="7" r="1.5"/><circle cx="19.5" cy="17" r="1.5"/>';

  // o : { doc, rpc(nom, args) → Promise, idClient, idLead, idRapport, nomClient, toast(msg, err), apres(resultat) }
  function pmOuvrir(o) {
    var d = o.doc || document;
    var echap = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
    var ancien = d.getElementById('od-pm'); if (ancien) ancien.remove();
    if (!d.getElementById('od-pm-css')) { var st = d.createElement('style'); st.id = 'od-pm-css'; st.textContent = PM_CSS; (d.head || d.body).appendChild(st); }
    var ov = d.createElement('div'); ov.id = 'od-pm'; ov.className = 'pm-ov';
    ov.innerHTML = '<div class="pm" role="dialog" aria-modal="true" aria-labelledby="pm-t"><div class="pm-h"><div><h3 id="pm-t">Passer la main</h3><p>' + echap(o.nomClient || '') + '</p></div>'
      + '<button type="button" class="pm-x" data-pm="fermer" aria-label="Fermer">×</button></div><div class="pm-b"><p class="pm-hint">Chargement des collègues…</p></div></div>';
    d.body.appendChild(ov);
    var etat = { ctx: null, vers: null, motif: null, confier: true, envoi: false, erreur: null, note: '',
                 choix: true, onglet: 'site', f: { univ: '', q: '' }, plis: {} };
    var fermer = function () { ov.remove(); d.removeEventListener('keydown', clavier); };
    var clavier = function (e) { if (e.key === 'Escape') fermer(); };
    d.addEventListener('keydown', clavier);

    var cmp = function (a, b) { return String(a).localeCompare(String(b), 'fr'); };
    var sansAccent = function (s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, ''); };
    var collegue = function () { var cs = (etat.ctx && etat.ctx.collegues) || []; for (var i = 0; i < cs.length; i++) if (String(cs[i].id_user) === String(etat.vers)) return cs[i]; return null; };
    var sitesDe = function (c) { return c.sites || []; };
    var surSiteRef = function (c) { return etat.ctx.site_ref != null && sitesDe(c).some(function (s) { return String(s.id) === String(etat.ctx.site_ref); }); };
    var univ = function (c) { var u = String(c.vn_vo || '').toUpperCase().replace(/[^A-Z]/g, ''); return u === 'VN' ? 'VN' : u === 'VO' ? 'VO' : (u === 'VNVO' || u === 'VOVN') ? 'VNVO' : ''; };
    // Fonction sur le site de référence pour l'équipe du site, sinon fonction principale.
    var estChef = function (c, ici) {
      var ss = sitesDe(c).filter(function (s) { return !ici || String(s.id) === String(etat.ctx.site_ref); });
      return ss.length ? ss.every(function (s) { return s.chef; }) || (ici && ss.some(function (s) { return s.chef; })) : c.role === 'Chef des ventes';
    };
    var fonction = function (c, ici) {
      if (estChef(c, ici)) return 'Chefs des ventes';
      var u = univ(c); return u === 'VN' ? 'Vendeurs VN' : u === 'VO' ? 'Vendeurs VO' : u === 'VNVO' ? 'Vendeurs VN et VO' : 'Vendeurs';
    };
    var fonctionCourte = function (c, ici) { var f = fonction(c, ici); return f === 'Chefs des ventes' ? 'chef des ventes' : f.replace('Vendeurs', 'vendeur'); };
    var ORDRE = ['Chefs des ventes', 'Vendeurs VN', 'Vendeurs VO', 'Vendeurs VN et VO', 'Vendeurs'];
    // Site où le lead atterrirait : celui de référence si le collègue y est vendeur, sinon un site
    // vendeur de la même affaire, sinon le premier (même règle que passer_main).
    var affaireRef = function () { var cs = etat.ctx.collegues; for (var i = 0; i < cs.length; i++) { var ss = sitesDe(cs[i]); for (var j = 0; j < ss.length; j++) if (String(ss[j].id) === String(etat.ctx.site_ref)) return ss[j].affaire; } return null; };
    var siteCible = function (c) {
      var vs = sitesDe(c).filter(function (s) { return !s.chef; }); if (!vs.length) return null;
      var af = affaireRef();
      vs.sort(function (a, b) { return ((String(b.id) === String(etat.ctx.site_ref)) - (String(a.id) === String(etat.ctx.site_ref))) || ((b.affaire === af) - (a.affaire === af)) || (Number(a.id) - Number(b.id)); });
      return vs[0];
    };
    // Ce qui peut être confié à ce collègue : les leads s'il est vendeur quelque part, les relances
    // de campagne s'il couvre leur site.
    var leadsConfiables = function (c) { return c && siteCible(c) ? etat.ctx.leads : []; };
    var relancesConfiables = function (c) { return !c ? [] : etat.ctx.relances.filter(function (r) { return sitesDe(c).some(function (s) { return String(s.id) === String(r.id_site); }); }); };
    var aConfier = function () { return etat.ctx.leads.length + etat.ctx.relances.length; };
    var peutConfier = function () { var c = collegue(); return !!(etat.ctx && c && (leadsConfiables(c).length || relancesConfiables(c).length)); };
    var nomsSites = function (c) { return sitesDe(c).map(function (s) { return s.nom; }).sort(cmp).join(', '); };

    var ligne = function (c, sousTitre, niv) {
      return '<button type="button" class="pm-p' + (niv ? ' niv' + Math.min(niv, 3) : '') + '" role="radio" data-pm="choisir" data-v="' + c.id_user + '" aria-checked="' + (String(c.id_user) === String(etat.vers)) + '">'
        + '<span class="pm-rd"></span><span class="t"><b>' + echap(c.nom) + '</b>' + (sousTitre ? '<small>' + echap(sousTitre) + '</small>' : '') + '</span>'
        + (c.suit ? '<span class="pm-bad">suit ce client</span>' : '') + '</button>';
    };

    // Équipe du site : groupée par fonction.
    function htmlEquipe() {
      var cs = etat.ctx.collegues.filter(surSiteRef);
      if (!cs.length) return '<div class="pm-liste"><div class="pm-vide">Personne d\'autre sur ce site : cherchez dans « Autre site ».</div></div>';
      return '<div class="pm-liste" role="radiogroup">' + ORDRE.map(function (g) {
        var gs = cs.filter(function (c) { return fonction(c, true) === g; }).sort(function (a, b) { return (b.suit - a.suit) || cmp(a.nom, b.nom); });
        return gs.length ? '<div class="pm-gr">' + g + '</div>' + gs.map(function (c) { return ligne(c, null); }).join('') : '';
      }).join('') + '</div>';
    }

    // Autres sites : arbre dépliable marque › affaire › site › collègues (comme le périmètre du
    // tableau de bord direction), filtre VN/VO, et recherche par nom qui aplatit la liste.
    var autres = function () { return etat.ctx.collegues.filter(function (c) { return !surSiteRef(c); }); };
    var passeUniv = function (c) { var f = etat.f.univ; if (!f) return true; var u = univ(c); return u === f || u === 'VNVO' || (u === '' && estChef(c, false)); };
    var nbC = function (n) { return n + (n > 1 ? ' collègues' : ' collègue'); };
    function arbreAutres() {
      var M = {};
      autres().filter(passeUniv).forEach(function (c) {
        sitesDe(c).forEach(function (s) {
          if (String(s.id) === String(etat.ctx.site_ref)) return;
          var mk = s.marque || 'Sans marque', ak = s.affaire || 'Sans affaire';
          var m = M[mk] || (M[mk] = { lab: mk, aff: {} });
          var af = m.aff[ak] || (m.aff[ak] = { lab: ak, sites: {} });
          var st = af.sites[s.id] || (af.sites[s.id] = { id: s.id, lab: s.nom, gens: [] });
          st.gens.push({ c: c, chef: !!s.chef });
        });
      });
      var trie = function (o) { return Object.keys(o).map(function (k) { return o[k]; }).sort(function (x, y) { return cmp(x.lab, y.lab); }); };
      return trie(M).map(function (m) {
        var affs = trie(m.aff).map(function (af) {
          var ss = trie(af.sites); ss.forEach(function (s) { s.n = s.gens.length; });
          return { lab: af.lab, sites: ss, n: ss.reduce(function (t, s) { return t + s.n; }, 0) };
        });
        return { lab: m.lab, aff: affs, n: affs.reduce(function (t, a) { return t + a.n; }, 0) };
      });
    }
    // Plis : marques ouvertes, affaires et sites fermés par défaut ; un échelon sans choix est sauté.
    var ouvert = function (k, defaut) { return etat.plis[k] == null ? defaut : etat.plis[k]; };
    var noeud = function (k, lab, n, niv, ouv) {
      return '<button type="button" class="pm-n niv' + niv + '" data-pm="pli" data-k="' + echap(k) + '" aria-expanded="' + ouv + '">'
        + '<span class="pm-chev">' + (ouv ? '▾' : '▸') + '</span><span class="t">' + echap(lab) + '</span><em>' + nbC(n) + '</em></button>';
    };
    function htmlArbre() {
      var arbre = arbreAutres();
      if (!arbre.length) return '<div class="pm-vide">Aucun collègue sur les autres sites' + (etat.f.univ ? ' pour ce filtre' : '') + '.</div>';
      var h = '', plusieursM = arbre.length > 1;
      arbre.forEach(function (m) {
        var niv = 0;
        if (plusieursM) { var km = 'm:' + m.lab, om = ouvert(km, true); h += noeud(km, m.lab, m.n, 0, om); if (!om) return; niv = 1; }
        var plusieursA = m.aff.length > 1;
        m.aff.forEach(function (af) {
          var niv2 = niv;
          if (plusieursA) { var ka = 'a:' + m.lab + '|' + af.lab, oa = ouvert(ka, false); h += noeud(ka, af.lab, af.n, niv, oa); if (!oa) return; niv2 = niv + 1; }
          af.sites.forEach(function (s) {
            var ks = 's:' + s.id, os = ouvert(ks, false);
            h += noeud(ks, s.lab, s.n, niv2, os);
            if (!os) return;
            s.gens.sort(function (x, y) { return (y.chef - x.chef) || (y.c.suit - x.c.suit) || cmp(x.c.nom, y.c.nom); }).forEach(function (g) {
              h += ligne(g.c, g.chef ? 'chef des ventes' : fonctionCourte(g.c, false), niv2 + 1);
            });
          });
        });
      });
      return h;
    }
    function htmlRecherche(q) {
      var cs = autres().filter(function (c) { return passeUniv(c) && sansAccent(c.nom).indexOf(q) >= 0; })
        .sort(function (a, b) { return (b.suit - a.suit) || cmp(a.nom, b.nom); });
      if (!cs.length) return '<div class="pm-vide">Aucun collègue ne porte ce nom sur les autres sites.</div>';
      var MAX = 40;
      return cs.slice(0, MAX).map(function (c) { return ligne(c, [fonctionCourte(c, false), nomsSites(c)].join(' · ')); }).join('')
        + (cs.length > MAX ? '<div class="pm-plus">' + (cs.length - MAX) + ' autres : précisez le nom.</div>' : '');
    }
    function htmlFiltres() {
      return '<div class="pm-filtres">'
        + '<input type="search" class="pm-q" data-pmf="q" placeholder="Rechercher un nom" value="' + echap(etat.f.q) + '" autocomplete="off">'
        + '<div class="pm-chips" role="group" aria-label="Univers">' + [['', 'VN et VO'], ['VN', 'VN'], ['VO', 'VO']].map(function (u) {
            return '<button type="button" data-pm="univ" data-v="' + u[0] + '" aria-pressed="' + (etat.f.univ === u[0]) + '">' + u[1] + '</button>'; }).join('') + '</div>'
        + '</div><div class="pm-liste pm-res" role="radiogroup"></div>';
    }
    function htmlResultats() { var q = sansAccent(etat.f.q).trim(); return q ? htmlRecherche(q) : htmlArbre(); }
    function rendreResultats() { var r = ov.querySelector('.pm-res'); if (r) r.innerHTML = htmlResultats(); }

    function dessiner() {
      var ctx = etat.ctx, b = ov.querySelector('.pm-b');
      var f = ov.querySelector('.pm-f'); if (f) f.remove();
      if (!ctx.collegues.length) { b.innerHTML = '<p class="pm-hint">Aucun collègue vendeur actif dans le groupe.</p>'; return; }
      var n = aConfier(), c = collegue(), ok = peutConfier();
      var nomSite = ctx.site_ref_nom ? String(ctx.site_ref_nom) : 'Ce site';
      var h = '<div><span class="pm-l">Collègue</span>';
      if (c && !etat.choix) {
        h += '<div class="pm-choisi"><span class="t"><b>' + echap(c.nom) + '</b><small>' + echap([fonctionCourte(c, surSiteRef(c)), nomsSites(c), c.suit ? 'suit déjà ce client' : null].filter(Boolean).join(' · ')) + '</small></span>'
          + '<button type="button" class="pm-chg" data-pm="changer">Changer</button></div>';
      } else {
        h += '<div class="pm-onglets" role="tablist">'
          + '<button type="button" role="tab" data-pm="onglet" data-v="site" aria-selected="' + (etat.onglet === 'site') + '">Équipe de ' + echap(nomSite) + '</button>'
          + '<button type="button" role="tab" data-pm="onglet" data-v="autre" aria-selected="' + (etat.onglet === 'autre') + '">Autre site</button></div>'
          + (etat.onglet === 'site' ? htmlEquipe() : htmlFiltres());
      }
      h += '</div>'
        + '<div><span class="pm-l">Motif</span><div class="pm-chips" role="group" aria-label="Motif">' + PM_MOTIFS.map(function (m) {
            return '<button type="button" data-pm="motif" data-v="' + m[0] + '" aria-pressed="' + (etat.motif === m[0]) + '">' + m[1] + '</button>'; }).join('') + '</div></div>'
        + '<div><label class="pm-l" for="pm-note">Note pour votre collègue</label><textarea id="pm-note" maxlength="600" placeholder="Ce qu\'il doit savoir : le besoin, le véhicule, ce qui a été dit, la prochaine étape…">' + echap(etat.note) + '</textarea></div>';
      if (n) {
        var ls = c ? leadsConfiables(c) : ctx.leads, rs = c ? relancesConfiables(c) : ctx.relances;
        var cible = c && ls.length ? siteCible(c) : null;
        var ailleurs = cible && String(cible.id) !== String(ctx.site_ref);
        var morceaux = [];
        if (ls.length) morceaux.push((ls.length > 1 ? 'Vos ' + ls.length + ' leads ouverts sur ce client passent dans sa file' : 'Votre lead passe dans sa file')
          + (ailleurs ? ', sur le site ' + echap(cible.nom) : '') + ' (' + echap(ls.slice(0, 3).map(function (l) { return [l.vehicule, l.source].filter(Boolean).join(' · ') || 'lead'; }).join(' ; ')) + ')');
        if (rs.length) morceaux.push((rs.length > 1 ? 'vos ' + rs.length + ' relances de campagne passent' : 'la relance' + (rs[0].campagne ? ' « ' + echap(rs[0].campagne) + ' »' : '') + ' passe')
          + ' dans ses relances, avec une heure pour la traiter');
        var pasTout = c && ok && (ls.length < ctx.leads.length || rs.length < ctx.relances.length);
        var txt = !c || ok ? (morceaux.join(' ; ').replace(/^./, function (x) { return x.toUpperCase(); }) + '. Vous n\'en serez plus responsable, ni crédité de la vente.'
                              + (pasTout ? ' Le reste ne peut pas lui être confié (site non couvert, ou lead réservé à un vendeur).' : ''))
          : (ctx.leads.length && !ctx.relances.length ? 'Un chef des ventes peut être prévenu, mais le lead ne peut être confié qu\'à un vendeur.'
             : 'Ce collègue ne couvre pas le site concerné : il peut être prévenu, pas recevoir le suivi.');
        h += '<label class="pm-conf' + (ok || !c ? '' : ' off') + '"><input type="checkbox" id="pm-confier"' + (ok && etat.confier ? ' checked' : '') + (ok || !c ? '' : ' disabled') + '>'
          + '<span><b>Lui confier le suivi</b><small>' + txt + '</small></span></label>';
      } else {
        h += '<p class="pm-hint">Rien d\'ouvert à votre nom sur ce client : votre collègue est prévenu sur la fiche, le suivi ne change pas.</p>';
      }
      if (etat.erreur) h += '<p class="pm-err">' + echap(etat.erreur) + '</p>';
      b.innerHTML = h;
      rendreResultats();
      var confie = n && ok && etat.confier;
      var lib = !c ? 'Passer la main' : (confie ? 'Confier à ' : 'Prévenir ') + c.nom.split(' ')[0];
      b.insertAdjacentHTML('afterend', '<div class="pm-f"><button type="button" class="pm-annuler" data-pm="fermer">Annuler</button><button type="button" class="pm-ok" data-pm="valider"' + (etat.envoi ? ' disabled' : '') + '>' + echap(etat.envoi ? 'Envoi…' : lib) + '</button></div>');
      var cb = ov.querySelector('#pm-confier'); if (cb) cb.addEventListener('change', function () { etat.confier = cb.checked; lireNote(); dessiner(); });
    }
    function lireNote() { var t = ov.querySelector('#pm-note'); if (t) etat.note = t.value; }

    // Filtres : la recherche ne redessine que la liste (le champ garde le focus) ; les listes
    // déroulantes redessinent tout pour la cascade marque → affaire → site.
    ov.addEventListener('input', function (e) {
      var k = e.target.getAttribute && e.target.getAttribute('data-pmf'); if (k !== 'q') return;
      etat.f.q = e.target.value; rendreResultats();
    });
    ov.addEventListener('click', function (e) {
      if (e.target === ov) return fermer();
      var x = e.target.closest('[data-pm]'); if (!x) return;
      var a = x.getAttribute('data-pm');
      if (a === 'fermer') return fermer();
      lireNote();
      if (a === 'motif') { etat.motif = x.getAttribute('data-v'); return dessiner(); }
      if (a === 'onglet') { etat.onglet = x.getAttribute('data-v'); return dessiner(); }
      if (a === 'pli') { var kp = x.getAttribute('data-k'); etat.plis[kp] = x.getAttribute('aria-expanded') !== 'true'; return rendreResultats(); }
      if (a === 'univ') { etat.f.univ = x.getAttribute('data-v'); return dessiner(); }
      if (a === 'changer') { etat.choix = true; var cc0 = collegue(); if (cc0) etat.onglet = surSiteRef(cc0) ? 'site' : 'autre'; return dessiner(); }
      if (a === 'choisir') {
        etat.vers = x.getAttribute('data-v'); etat.choix = false; etat.erreur = null;
        var cc = collegue(); if (cc && cc.suit && !etat.motif) etat.motif = 'deja_suivi';
        else if (cc && !cc.suit && etat.motif === 'deja_suivi') etat.motif = null;
        return dessiner();
      }
      if (a === 'valider') {
        etat.erreur = null;
        if (!collegue()) etat.erreur = 'Choisissez le collègue à prévenir.';
        else if (!etat.motif) etat.erreur = 'Choisissez un motif.';
        else if (etat.note.trim().length < 5) etat.erreur = 'Écrivez une note de contexte : votre collègue ne doit pas avoir à rappeler le client pour reposer les mêmes questions.';
        if (etat.erreur) return dessiner();
        var confier = !!(aConfier() && peutConfier() && etat.confier), cv = collegue();
        etat.envoi = true; dessiner();
        o.rpc('passer_main', { p_id_vers: Number(etat.vers), p_id_client: etat.ctx.client != null ? Number(etat.ctx.client) : (o.idClient != null ? Number(o.idClient) : null),
          p_id_leads: confier ? leadsConfiables(cv).map(function (l) { return Number(l.id_lead); }) : null,
          p_id_rapports: confier ? relancesConfiables(cv).map(function (r) { return Number(r.id_rapport); }) : null,
          p_confier: confier, p_motif: etat.motif, p_note: etat.note.trim() })
          .then(function (r) {
            if (!r || !r.ok) { etat.envoi = false; etat.erreur = (r && r.motif) || 'Échec, réessayez.'; return dessiner(); }
            fermer();
            if (o.toast) o.toast(r.confies ? 'Confié à ' + r.vers_nom + (r.site_change ? ' (' + r.site_change + ')' : '') + '.' : r.vers_nom + ' est prévenu.');
            if (o.apres) try { o.apres(r); } catch (e2) {}
          })
          .catch(function (e3) { etat.envoi = false; etat.erreur = String((e3 && e3.message) || e3).replace(/^\[lead\]\s*/, ''); dessiner(); });
      }
    });

    o.rpc('passer_main_contexte', { p_id_client: o.idClient != null ? Number(o.idClient) : null, p_id_lead: o.idLead != null ? Number(o.idLead) : null,
      p_id_rapport: o.idRapport != null ? Number(o.idRapport) : null })
      .then(function (ctx) {
        etat.ctx = ctx || { leads: [], relances: [], collegues: [] };
        etat.ctx.leads = etat.ctx.leads || []; etat.ctx.relances = etat.ctx.relances || []; etat.ctx.collegues = etat.ctx.collegues || [];
        // Quelqu'un suit déjà ce client : présélectionné (préférence à l'équipe du site).
        var suiveurs = etat.ctx.collegues.filter(function (c) { return c.suit; }).sort(function (a, b) { return surSiteRef(b) - surSiteRef(a); });
        if (suiveurs[0]) { etat.vers = suiveurs[0].id_user; etat.motif = 'deja_suivi'; etat.choix = false; }
        if (!etat.ctx.collegues.some(surSiteRef)) etat.onglet = 'autre';
        dessiner();
      })
      .catch(function (e) { ov.querySelector('.pm-b').innerHTML = '<p class="pm-err">' + echap(String((e && e.message) || e)) + '</p>'; });
  }

  // Seuls les vendeurs et les chefs des ventes passent la main (pas le plateau ni l'accueil).
  function peutPasser() { const r = roleCourant(); return r === 3 || r === 4; }
  function fsToast(msg) {
    const t = doc.createElement('div'); t.className = 'fs-toast'; t.setAttribute('role', 'status'); t.textContent = msg;
    doc.body.appendChild(t); setTimeout(() => t.classList.add('on'), 10); setTimeout(() => { t.classList.remove('on'); setTimeout(() => t.remove(), 300); }, 3800);
  }
  function passerMain() {
    const c = state.client; if (!c) return;
    pmOuvrir({ doc, idClient: c.IDVu, nomClient: clientName(c), toast: fsToast,
      rpc: (n, a) => sb.rpc(n, a).then(r => { if (r.error) throw new Error(r.error.message); return r.data; }) });
  }
  function headerHtml() {
    const c = state.client;
    if (!c) return '<div class="fs-card fs-head"><div class="fs-name">Aucun client sélectionné</div></div>';
    const type = (isSoc(c) ? 'Entreprise' : 'Particulier');
    const loc = [c.code_postal, c.ville].filter(Boolean).join(' ');
    return '<div class="fs-card fs-head">' +
      '<h2 class="fs-name">' + esc(clientName(c)) + '</h2>' +
      '<div class="fs-detail">' +
        (c.TEl_MOB ? '<span>' + svg(IC.phone) + esc(c.TEl_MOB) + '</span>' : '') +
        (c.EMAIL ? '<span>' + svg(IC.mail) + esc(c.EMAIL) + '</span>' : '') +
        '<span>' + svg(IC.user) + esc(type) + (loc ? ' (' + esc(loc) + ')' : '') + '</span>' +
        '<span>ID Client : ' + esc(c.IDVu) + '</span>' +
      '</div>' +
      '<div class="fs-actions">' +
        (appelsEntrants() ? '<button class="fs-btn lead" data-btn="lead">' + svg(IC.plus) + 'Nouveau lead</button>' : '') +
        (peutAppeler() ? '<button class="fs-btn call" data-btn="call">' + svg(IC.phone) + 'Appeler</button>' : '') +
        '<button class="fs-btn wa" data-btn="wa">' + svg(IC.wa) + 'WhatsApp</button>' +
        '<button class="fs-btn mail" data-btn="mail">' + svg(IC.mail) + 'Email</button>' +
        '<button class="fs-btn sms" data-btn="sms">' + svg(IC.sms) + 'SMS</button>' +
        '<button class="fs-btn rpv" data-btn="rpv">' + svg(IC.rpv) + 'RPV</button>' +
        (peutPasser() ? '<button class="fs-btn passer" data-btn="passer" title="Inviter un collègue sur ce client, ou lui confier le suivi">' + svg(PM_ICONE) + 'Passer la main</button>' : '') +
        (state.bacs && state.bacs.url && !appelsEntrants() ? '<button class="fs-btn bacs" data-btn="bacs" title="Ouvrir le compte client dans BACS"><span class="fs-b">B</span>BACS</button>' : '') +
      '</div></div>';
  }
  // Onglet Entreprise : sur une société, il devient « Interlocuteurs ».
  function visibleTabs() {
    return TABS.filter(t => !(t.key === 'entourage' && isSoc(state.client)))
      .map(t => (t.key === 'entreprise' && isSoc(state.client)) ? Object.assign({}, t, { label: 'Interlocuteurs' }) : t);
  }
  function tabsHtml() {
    return '<div class="fs-card fs-tabs-wrap"><div class="fs-tabs">' +
      visibleTabs().map(t => '<button class="fs-tab' + (state.tab === t.key ? ' on' : '') + '" data-tab="' + t.key + '">' + svg(IC[t.icon]) + esc(t.label) + '</button>').join('') +
      '</div></div>';
  }
  function contentHtml() {
    // Toutes les divs de montage sont présentes dès le chargement (masquées sauf
    // l'onglet actif) -> chaque module trouve sa div et se monte, même les onglets
    // non ouverts. Le changement d'onglet ne fait que basculer la visibilité.
    return '<div class="fs-content">' + visibleTabs().map(t => {
      const on = state.tab === t.key;
      const st = ' style="display:' + (on ? 'block' : 'none') + '"';
      if (READY[t.key]) if (MOD[t.key]) return '<div class="fs-pane fs-card fs-pane--mount' + (on ? ' on' : '') + '" data-pane="' + t.key + '"' + st + '><div data-od-module="' + MOD[t.key] + '"></div></div>';
      return '<div class="fs-pane fs-card fs-pane--mount' + (on ? ' on' : '') + '" data-pane="' + t.key + '"' + st + '><div id="' + t.mount + '"></div></div>';
      return '<div class="fs-pane fs-card' + (on ? ' on' : '') + '" data-pane="' + t.key + '"' + st + '><div class="fs-ph">Onglet « ' + esc(t.label) + ' » — module à venir (prochaine brique).</div></div>';
    }).join('') + '</div>';
  }

  function renderContent() {
    const root = __anchor; if (!root) return;
    root.querySelectorAll('.fs-pane').forEach(pn => {
      const on = pn.getAttribute('data-pane') === state.tab;
      pn.classList.toggle('on', on);
      pn.style.display = on ? 'block' : 'none';
    });
    root.querySelectorAll('.fs-tab').forEach(b => b.classList.toggle('on', b.getAttribute('data-tab') === state.tab));
  }
  // Ouvre le formulaire RPV (rpvBoot) dans une overlay JS. rpvBoot possède un
  // observateur persistant qui rend le formulaire dès que #rpv-root apparaît.
  function openRpv() {
    const ex = doc.getElementById('fs-rpv-overlay'); if (ex) ex.remove();
    const ov = doc.createElement('div'); ov.id = 'fs-rpv-overlay';
    ov.innerHTML = '<div class="fs-rpv-bg"></div><div class="fs-rpv-box"><button class="fs-rpv-x" aria-label="Fermer">&times;</button><div data-od-module="rpv"></div></div>';
    (doc.body || doc.documentElement).appendChild(ov);
    const close = () => { try { ov.remove(); } catch (e) {} };
    ov.querySelector('.fs-rpv-bg').addEventListener('click', close);
    ov.querySelector('.fs-rpv-x').addEventListener('click', close);
  }

  function bindHeader(root) {
    root.querySelectorAll('[data-btn]').forEach(b => b.addEventListener('click', () => {
      const k = b.getAttribute('data-btn');
      if (k === 'lead') ouvrirLeadAppel(); else if (k === 'passer') passerMain(); else if (k === 'bacs') ouvrirBacs(); else if (k === 'call') callClient(); else if (k === 'rpv') openRpv(); else if (k === 'sms') openSms(); else if (k === 'wa') openWa(); else if (k === 'mail') openMail(); else todo(k);
    }));
  }

  // Onglets qui reflètent les échanges (SMS, WA, appels, RPV) : on invalide leur
  // cache à l'ouverture pour afficher les nouveaux échanges sans recharger la page.
  function refreshLiveTab(key) {
    // Onglets "live" (contacts / historique) : on force un rechargement frais en
    // RECRÉANT l'ancre -> le loader remonte le module (les observers internes ont
    // été retirés, c'est le loader qui possède désormais le cycle de vie).
    const map = { contacts: ['__contactsState', 'contacts'], historique: ['__histoState', 'historique'] };
    const e = map[key]; if (!e) return;
    try {
      const st = window[e[0]]; if (st) { st.rows = null; st.loading = true; st.idvu = null; }
      const pane = __anchor.querySelector('.fs-pane[data-pane="' + key + '"]');
      if (pane) pane.innerHTML = '<div data-od-module="' + e[1] + '"></div>';
    } catch (x) {}
  }

  function render() {
    const root = __anchor; if (!root) return;
    if (!visibleTabs().some(t => t.key === state.tab)) state.tab = 'fiche';
    root.innerHTML = '<div id="fs-header-holder">' + headerHtml() + '</div>' + tabsHtml() + contentHtml();
    bindHeader(root);
    // onglets
    root.querySelectorAll('[data-tab]').forEach(b => b.addEventListener('click', () => {
      state.tab = b.getAttribute('data-tab');
      refreshLiveTab(state.tab);
      renderContent();
    }));
  }

  // ---------------------------------------------------------------- boot
  async function boot() {
    const root = __anchor; if (!root) return;
    // Lien externe : le client demande dans l'URL prime au demarrage.
    // On alimente la variable que lisent tous les modules de la fiche, puis on
    // nettoie l'URL. Sans client dans l'URL, comportement inchange.
    const urlIdvu = idvuFromUrl();
    if (urlIdvu != null && urlIdvu !== currentIdvu()) {
      try { wwLib.wwVariable.updateValue(SELECTED_CLIENT_VAR, { IDVu: urlIdvu }); } catch (e) {}
    }
    const urlTab = tabFromUrl();
    if (urlTab) state.tab = urlTab;
    // Onglet demandé par un autre module avant navigation (lead-mgmt, kanban…).
    // Passé par un global à usage unique — l'ancienne variable WeWeb (fb2cad2c)
    // n'existe plus dans le projet. Accepte une clé ('pcom') ou un index (5).
    try {
      const w = (wwLib.getFrontWindow && wwLib.getFrontWindow()) || window;
      let req = w.__odFicheTab;
      if (req != null) {
        try { delete w.__odFicheTab; } catch (e) { w.__odFicheTab = null; }
        if (typeof req === 'number') req = (TABS[req] || {}).key;
        if (req && TABS.some(t => t.key === req) && !tabFromUrl()) state.tab = req;
      }
    } catch (e) {}
    ensureCss();
    await loadClient();
    render();
    if (urlIdvu != null) cleanUrl();
    // surveille le changement de client (navigation via historique / recherche).
    // Re-rendu complet : en-tête + jeu d'onglets (Interlocuteurs si société) +
    // panneaux recréés -> chaque module d'onglet se re-monte via son observateur.
    if (window.__fsWatch) clearInterval(window.__fsWatch);
    window.__fsWatch = setInterval(async () => {
      const idvu = currentIdvu();
      if (idvu != null && idvu !== state.idvu) { await loadClient(); render(); }
    }, 500);
  }
  boot();   // le loader garantit __anchor
}
});
