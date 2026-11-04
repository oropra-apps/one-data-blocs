// ENTREPRISE — module One Data (OD.define) v6 (04/11/2026)
//
// v6 : retours vendeurs.
//   · Création d'un interlocuteur depuis une société : portable, fixe et e-mail
//     repris par défaut de la fiche société (le vendeur vient souvent de les
//     saisir), modifiables ; le rôle (et fonction, commentaire) se choisit dans
//     la même fenêtre, comme pour une personne déjà connue ; un seul bouton
//     « Créer et désigner l'interlocuteur ».
//   · Bandeau « Société présente dans BACS » retiré (le bouton BACS de l'en-tête
//     ouvre déjà la fiche) ; l'alerte « Société absente de BACS » reste.
//
// v5 : la confirmation du retrait (« Retirer … des interlocuteurs ? ») ne passe
//   plus par la boîte native du navigateur, qui pouvait être bloquée sans rien
//   afficher (le clic ne faisait alors rien) : fenêtre One Data à la place.
//
// v4 : CLIENT ENTREPRISE COMME DANS BACS (recon du 03/11/2026).
//   Dans BACS, la société se crée d'abord, puis on lui désigne un
//   interlocuteur pris dans la base des particuliers (Company_Link__c) ;
//   sans interlocuteur actif, aucune affaire ne peut y être ouverte.
//   · FICHE SOCIÉTÉ (nouveau) : liste des interlocuteurs, avec leur état dans
//     BACS, et « Ajouter un interlocuteur » : recherche dans TOUTE la base des
//     particuliers du groupe (RPC interlocuteur_rechercher, coordonnées
//     masquées), ou création d'un particulier s'il n'existe pas. Le lien part
//     dans BACS (geste interlocuteur_lier) : société et particulier y sont
//     créés au passage s'ils n'y sont pas. Société absente de BACS : bouton
//     « Créer dans BACS ». Alerte tant qu'aucun interlocuteur n'est désigné.
//   · FICHE PARTICULIER : inchangée à l'écran ; le rattachement et le retrait
//     passent par les mêmes gestes BACS, et une société créée ici suit le
//     parcours BACS d'abord (module partagé oropra-bacs-client v6).
//   · Retrait = lien inactif dans One Data ET dans BACS (BACS ne supprime pas).
//   Charte : bleus et vert One Data, orange pour les alertes, aucun rouge.
OD.define('entreprise', {
  mount(__anchor, ctx) {
    const OROPRA_DOUBLONS_URL = 'https://cdn.jsdelivr.net/gh/oropra-apps/one-data-blocs@aa457b862a926340283e1b8e2e956cbff6357658/oropra-doublons.js';
    const OROPRA_BACS_CLIENT_URL = 'https://cdn.jsdelivr.net/gh/oropra-apps/one-data-blocs@oropra-bacs-client-v6/oropra-bacs-client.js';
    function chargerDoublons() {
      if (window.oropraDoublons) return Promise.resolve();
      if (window.__oropraDoublonsChargement) return window.__oropraDoublonsChargement;
      window.__oropraDoublonsChargement = new Promise((resolve) => {
        const sc = document.createElement('script'); sc.src = OROPRA_DOUBLONS_URL; sc.async = true;
        sc.onload = () => resolve(); sc.onerror = () => { resolve(); };
        document.head.appendChild(sc);
      }); return window.__oropraDoublonsChargement;
    }
    function chargerBacsClient() {
      if (window.oropraBacsClient && window.oropraBacsClient.version >= 6) return Promise.resolve(window.oropraBacsClient);
      if (window.__odBacsClientV6) return window.__odBacsClientV6;
      window.__odBacsClientV6 = new Promise((ok) => {
        const sc = document.createElement('script'); sc.src = OROPRA_BACS_CLIENT_URL; sc.async = true;
        sc.onload = () => ok(window.oropraBacsClient || null);
        sc.onerror = () => { window.__odBacsClientV6 = null; ok(null); };
        document.head.appendChild(sc);
      });
      return window.__odBacsClientV6;
    }
    chargerDoublons().then(function(){ try { if (window.oropraDoublons && !document.getElementById('od-css-er')) { var e=document.createElement('style'); e.id='od-css-er'; e.textContent=window.oropraDoublons.css('er'); document.head.appendChild(e); } } catch(x){} });
    __anchor.id = 'oropra-entreprise-rattachement';

const SELECTED_CLIENT_VAR_ID   = '55490583-c88b-4748-916e-4d203db07742';
const LOOKUP_VAR_ID            = 'cced74ab-5a0a-418d-9479-2366e05a8754';
const EDGE_FN_SIRENE_SEARCH    = 'sirene-search';
const EDGE_FN_SIRENE_UPSERT    = 'sirene-upsert';

const TYPES = ['Gérant', 'Dirigeant', 'Associé', 'Salarié', 'Conducteur', 'Autre'];
const TYPE_CLS = { 'Gérant': 'b-gerant', 'Dirigeant': 'b-gerant', 'Associé': 'b-assoc', 'Salarié': 'b-assoc', 'Conducteur': 'b-cond' };

const doc = __anchor.ownerDocument || document;
function getRoot() { return __anchor; }

// --- Helpers ----------------------------------------------------------------
function esc(s) {
  if (s == null) return '';
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}
function cleanDigits(s) { return s == null ? '' : String(s).replace(/\D/g, ''); }
function readVar(id) { try { return wwLib.wwVariable.getValue(id); } catch (e) { return null; } }
function supa() { return ctx.supabase; }
function fw() { try { return (wwLib.getFrontWindow && wwLib.getFrontWindow()) || window; } catch (e) { return window; } }
function siteCourant() { const s = window.oropraSite || null; return s && s.getSiteId ? s.getSiteId() : null; }

const userConnected = fw().oropraUser || {};
const viewerId = userConnected.ID_User != null ? Number(userConnected.ID_User) : null;
const lookup = Array.isArray(readVar(LOOKUP_VAR_ID)) ? readVar(LOOKUP_VAR_ID) : [];
const typesS = lookup.filter(x => x.multivu === 1);   // types juridiques société (CIVILITE)
const civP = lookup.filter(x => x.multivu === 0).map(x => x.libelle_court).filter(Boolean);
const CIVILITES_P = civP.length ? civP : ['M.', 'Mme'];

function currentClient() {
  const c = readVar(SELECTED_CLIENT_VAR_ID);
  return c && typeof c === 'object' ? c : null;
}
function currentIdvu() { const c = currentClient(); return c && c.IDVu != null ? Number(c.IDVu) : null; }
function isParticulier() { const c = currentClient(); return c ? (c.idmultivu === 0 || c.idmultivu === '0') : false; }
function isSociete() { const c = currentClient(); return c ? (c.idmultivu === 1 || c.idmultivu === '1') : false; }
function societeName(c) {
  if (!c) return '';
  return [c.CIVILITE, c.NOM, c.PRENOM].filter(Boolean).join(' ').trim();
}
function personneName(c) {
  if (!c) return '';
  return [c.civilite || c.CIVILITE, c.prenom || c.PRENOM, c.nom || c.NOM].filter(Boolean).join(' ').trim();
}
function errMsg(e) { return (e && e.message) ? e.message : String(e); }

// --- État -------------------------------------------------------------------
const state = window.__entr || {};
if (state.idClient === undefined)   state.idClient = null;
if (state.list === undefined)       state.list = null;   // null = pas chargé
if (state.loading === undefined)    state.loading = false;
if (state.error === undefined)      state.error = null;
if (state.modal === undefined)      state.modal = null;   // modale particulier → société
if (state.imodal === undefined)     state.imodal = null;  // modale société → interlocuteur
if (state.bacs === undefined)       state.bacs = null;    // { actif, compte, url }
if (state.notice === undefined)     state.notice = null;
window.__entr = state;

// --- Chargement -------------------------------------------------------------
async function loadList() {
  const id = currentIdvu();
  state.idClient = id;
  if (id == null) { state.list = []; render(); return; }
  state.loading = true; render();
  try {
    if (isSociete()) {
      const r = await supa().rpc('get_interlocuteurs_societe', { p_id_societe: id });
      if (r.error) throw r.error;
      state.list = (r.data || []).map(x => ({
        id_entreprise: Number(x.id_entreprise),
        id_particulier: x.id_particulier != null ? Number(x.id_particulier) : null,
        nom: personneName(x) || ('Particulier #' + x.id_particulier),
        tel: x.tel_mob || x.tel_fixe || '', email: x.email || '', ville: x.ville || '',
        type: x.type_rattachement || '', fonction: x.fonction || '', date_debut: x.date_debut || null,
        source: x.source || '', bacs_etat: x.bacs_etat || null, bacs_erreur: x.bacs_erreur || null,
        dans_bacs: !!x.dans_bacs
      }));
      chargerEtatBacs(id);
    } else {
      const r = await supa().rpc('get_rattachements_particulier', { p_id_particulier: id });
      if (r.error) throw r.error;
      state.list = (r.data || []).map(x => ({
        id_entreprise: Number(x.id_entreprise),
        id_societe: x.id_societe != null ? Number(x.id_societe) : null,
        nom: x.societe_nom || ('Société #' + x.id_societe),
        siret: x.societe_siret || '',
        type: x.type_rattachement || '',
        fonction: x.fonction || '',
        date_debut: x.date_debut || null,
        commentaire: x.commentaire || ''
      }));
    }
    state.error = null;
  } catch (e) {
    console.error('[entr] chargement', e);
    state.error = errMsg(e) || 'Erreur de chargement';
    state.list = [];
  } finally {
    state.loading = false; render();
  }
}

// Société : est-elle dans BACS, et One Data l'y écrit-il ?
async function chargerEtatBacs(id) {
  try {
    const sb = supa();
    const [pf, cpt] = await Promise.all([
      sb.rpc('bacs_client_preflight', { p_payload: { idmultivu: 1 } }),
      sb.rpc('client_compte_bacs', { p_id_client: Number(id) })
    ]);
    if (state.idClient !== id) return;
    const p = pf && !pf.error ? pf.data : null;
    const c = cpt && !cpt.error ? cpt.data : null;
    state.bacs = { actif: !!(p && p.ecrire && p.pro_bacs === true), compte: c && c.compte ? c.compte : null, url: c && c.url ? c.url : null };
  } catch (e) { state.bacs = null; }
  render();
}

function notifier(texte, ton) {
  state.notice = { texte: texte, ton: ton || 'info' };
  render();
  clearTimeout(notifier.t);
  notifier.t = setTimeout(() => { state.notice = null; render(); }, 7000);
}

// ============================================================================
//  FICHE PARTICULIER → rattacher à une société (inchangé à l'écran)
// ============================================================================
function openModal() {
  state.modal = {
    search: { NOM: '', SIRET: '', EMAIL: '', IDVu: '' },
    results: [], searching: false, searched: false, totalCount: 0,
    selected: null,
    form: { type: 'Gérant', fonction: '', date_debut: '', commentaire: '' },
    saving: false, error: null,
    create: null
  };
  render();
}
function closeModal() { state.modal = null; render(); }

function setSearchField(f, v) { if (state.modal) state.modal.search[f] = v; }
function clearSearch() {
  if (!state.modal) return;
  state.modal.search = { NOM: '', SIRET: '', EMAIL: '', IDVu: '' };
  state.modal.results = []; state.modal.searched = false; state.modal.totalCount = 0; state.modal.error = null;
  render();
}
async function runSearch() {
  if (!state.modal) return;
  const f = state.modal.search;
  state.modal.searching = true; state.modal.searched = true; state.modal.error = null; render();
  try {
    let q = supa().from('CLIENT').select('IDVu, CIVILITE, NOM, SIRET, EMAIL, code_postal, ville', { count: 'exact' }).eq('idmultivu', 1);
    if (f.SIRET) { const c = cleanDigits(f.SIRET); if (c) q = q.eq('SIRET', Number(c)); }
    if (f.NOM)   q = q.ilike('NOM', `%${f.NOM}%`);
    if (f.EMAIL) q = q.ilike('EMAIL', `%${f.EMAIL}%`);
    if (f.IDVu)  q = q.eq('IDVu', Number(f.IDVu));
    q = q.order('NOM', { ascending: true, nullsFirst: false }).range(0, 14);
    const { data, error, count } = await q;
    if (error) throw error;
    state.modal.results = data || [];
    state.modal.totalCount = count || 0;
  } catch (e) {
    console.error('[entr] recherche société', e);
    state.modal.results = []; state.modal.totalCount = 0;
    state.modal.error = errMsg(e);
  } finally {
    state.modal.searching = false; render();
  }
}
function selectCompany(row) {
  if (!state.modal) return;
  state.modal.selected = {
    IDVu: Number(row.IDVu),
    nom: societeName(row) || ('Société #' + row.IDVu),
    siret: row.SIRET ? String(row.SIRET) : ''
  };
  state.modal.results = [];
  state.modal.create = null;
  render();
}
function clearSelected() { if (state.modal) { state.modal.selected = null; render(); } }

// --- Création société (SIRENE), sans navigation — BACS d'abord (v4) --------
function openCreate() {
  if (!state.modal) return;
  const s = state.modal.search || {};
  state.modal.create = {
    sireneQ: s.SIRET || s.NOM || '', sireneResults: [], sireneLoading: false,
    data: { CIVILITE: '', NOM: s.NOM || '', SIRET: cleanDigits(s.SIRET || ''), ADRESSE: '', code_postal: '', ville: '', adresse_label: '', adresse_source: 'manual', adresse_status: null },
    saving: false, error: null
  };
  state.modal.results = [];
  render();
}
function cancelCreate() { if (state.modal) { state.modal.create = null; render(); } }

let sireneDebounce = null;
function onSireneInput(q) {
  if (!state.modal || !state.modal.create) return;
  state.modal.create.sireneQ = q;
  const digits = cleanDigits(q);
  if (digits === q.replace(/\s/g, '')) state.modal.create.data.SIRET = digits;
  if (sireneDebounce) clearTimeout(sireneDebounce);
  if (!q || q.trim().length < 2) { state.modal.create.sireneResults = []; render(); return; }
  sireneDebounce = setTimeout(() => runSireneSearch(q.trim()), 400);
}
async function runSireneSearch(term) {
  if (!state.modal || !state.modal.create) return;
  state.modal.create.sireneLoading = true; render();
  try {
    const qs = new URLSearchParams({ query: term, limit: '8', activeOnly: 'false' }).toString();
    const { data, error } = await supa().functions.invoke(`${EDGE_FN_SIRENE_SEARCH}?${qs}`, { method: 'GET' });
    if (error) throw error;
    state.modal.create.sireneResults = (data && data.items) || [];
  } catch (e) {
    console.error('[entr] sirene-search', e);
    state.modal.create.sireneResults = [];
    state.modal.create.error = errMsg(e);
  } finally {
    state.modal.create.sireneLoading = false; render();
  }
}
function pickSirene(item) {
  if (!state.modal || !state.modal.create) return;
  const t = typesS.find(x => String(x.code) === String(item.categorie_juridique_code));
  Object.assign(state.modal.create.data, {
    SIRET: cleanDigits(item.siret),
    NOM: item.raison_sociale || state.modal.create.data.NOM,
    CIVILITE: t ? t.libelle_court : state.modal.create.data.CIVILITE,
    ADRESSE: item.adresse_ligne1 || '',
    code_postal: item.code_postal || '',
    ville: item.commune || '',
    adresse_label: item.adresse || '',
    adresse_source: 'sirene',
    adresse_status: 'verified'
  });
  state.modal.create.sireneResults = [];
  state.modal.create.sireneQ = cleanDigits(item.siret);
  render();
}
async function saveCreate() {
  if (!state.modal || !state.modal.create) return;
  const c = state.modal.create;
  const d = c.data;
  const siret = cleanDigits(d.SIRET);
  if (!d.NOM || !String(d.NOM).trim()) { c.error = 'La raison sociale est obligatoire.'; render(); return; }
  if (siret && siret.length !== 14) { c.error = 'Le SIRET doit comporter 14 chiffres.'; render(); return; }
  if (!c.dupAck) {
    await chargerDoublons();
    const od = window.oropraDoublons;
    if (od) {
      const dup = await od.check(supa(), { NOM: d.NOM, SIRET: siret || null, ADRESSE: d.ADRESSE, code_postal: d.code_postal }, { societe: true });
      if (dup) { c.saving = false; c.duplicate = dup; render(); return; }
    }
  }
  c.saving = true; c.error = null; render();
  try {
    const sb = supa();
    const now = new Date().toISOString();
    const idSite = siteCourant();
    if (idSite == null) { c.saving = false; c.error = "Aucun site sélectionné (choisissez un site en haut à droite)."; render(); return; }
    const payload = {
      idmultivu: 1,
      CIVILITE: d.CIVILITE || null, NOM: String(d.NOM).trim(), SIRET: siret ? Number(siret) : null,
      ADRESSE: d.ADRESSE || null, code_postal: d.code_postal || null, ville: d.ville || null,
      CP_VILLE: [d.code_postal, d.ville].filter(Boolean).join(' ') || null,
      adresse_label: d.adresse_label || null, adresse_source: d.adresse_source || 'manual',
      adresse_status: d.adresse_status || null,
      CreationDate: now, UpdateDate: now,
      ID_VENDEUR_CREATION: viewerId != null ? String(viewerId) : null,
      ID_VENDEUR_UPDATE: viewerId != null ? String(viewerId) : null
    };
    // v4 : BACS d'abord, comme dans BACS (module partagé). Repli sur l'appel
    // direct si le module ne se charge pas : la base ne pousse alors rien.
    const bc = await chargerBacsClient();
    const args = { p_payload: payload, p_id_site: idSite, p_id_user: viewerId != null ? Number(viewerId) : null };
    const { data: creation, error } = bc ? await bc.creer(sb, args) : await sb.rpc('client_creer', args);
    if (error) throw error;
    const inserted = creation && creation.client ? creation.client : null;
    if (!inserted) throw new Error('création : aucune fiche renvoyée');
    if (c.duplicate && c.duplicate.candidats && window.oropraDoublons) {
      const cc = c.duplicate.candidats.filter(x => x.id_client != null && Number(x.id_client) !== Number(inserted.IDVu));
      if (cc.length) { try { await window.oropraDoublons.signaler(sb, inserted.IDVu, cc); } catch (e) {} }
    }
    if (siret) {
      try { await sb.functions.invoke(EDGE_FN_SIRENE_UPSERT, { body: { siret: String(siret), idvu: String(inserted.IDVu), setPrimary: true } }); }
      catch (eLink) { console.warn('[entr] sirene-upsert (non bloquant):', eLink && eLink.message); }
    }
    state.modal.selected = { IDVu: Number(inserted.IDVu), nom: societeName(inserted) || ('Société #' + inserted.IDVu), siret: inserted.SIRET ? String(inserted.SIRET) : '' };
    state.modal.create = null;
    render();
  } catch (e) {
    console.error('[entr] création société', e);
    c.saving = false; c.error = errMsg(e); render();
  }
}

// --- Rattacher / Retirer (gestes BACS) --------------------------------------
async function doAttach() {
  if (!state.modal || !state.modal.selected) return;
  const m = state.modal;
  if (!m.form.type) { m.error = 'Le type de rattachement est obligatoire.'; render(); return; }
  m.saving = true; m.error = null; render();
  try {
    const r = await lier(m.selected.IDVu, state.idClient, m.form);
    if (r.error) throw r.error;
    state.modal = null;
    if (r.data && r.data.bacs && r.data.bacs_ok === false) notifier('Rattaché dans One Data. BACS : ' + (r.data.bacs_erreur || 'non reporté') + ' — « Réessayer » depuis la fiche société.', 'alerte');
    await loadList();
  } catch (e) {
    console.error('[entr] rattachement', e);
    m.saving = false; m.error = errMsg(e); render();
  }
}

async function lier(idSociete, idParticulier, form) {
  const args = {
    p_id_societe: Number(idSociete), p_id_particulier: Number(idParticulier),
    p_type: form.type || null, p_fonction: form.fonction || null,
    p_date_debut: form.date_debut || new Date().toISOString().slice(0, 10),
    p_commentaire: form.commentaire || null, p_id_user: viewerId, p_id_site: siteCourant()
  };
  const bc = await chargerBacsClient();
  if (bc && bc.interlocuteur) return bc.interlocuteur(supa(), args);
  return supa().rpc('interlocuteur_lier', args);
}

// Confirmation dans la page (la boîte native confirm() peut être bloquée par le
// navigateur et renvoyer « non » sans rien afficher).
function confirmer(texte, ok) {
  return new Promise((resolve) => {
    const root = getRoot(); if (!root) return resolve(false);
    const ov = doc.createElement('div');
    ov.className = 'er-overlay';
    ov.innerHTML = '<div class="er-modal" style="max-width:440px">'
      + '<div class="er-modal-h"><div class="er-modal-t">Confirmation</div></div>'
      + '<div class="er-modal-b"><div style="font-size:13.5px;color:#1F4A85;line-height:1.5">' + esc(texte) + '</div></div>'
      + '<div class="er-modal-f"><button class="er-btn er-btn-ghost" data-c="non">Annuler</button>'
      + '<button class="er-btn er-btn-primary" data-c="oui">' + esc(ok || 'Confirmer') + '</button></div></div>';
    const fin = (v) => { try { ov.remove(); } catch (e) {} resolve(v); };
    ov.addEventListener('click', (e) => {
      const b = e.target.closest('[data-c]');
      if (b) return fin(b.getAttribute('data-c') === 'oui');
      if (e.target === ov) fin(false);
    });
    root.appendChild(ov);
  });
}

async function doDetach(idEntreprise, libelle) {
  if (!(await confirmer(libelle || 'Retirer ce rattachement ?', 'Retirer'))) return;
  try {
    const bc = await chargerBacsClient();
    const r = bc && bc.retirer ? await bc.retirer(supa(), idEntreprise)
                               : await supa().rpc('interlocuteur_retirer', { p_id_entreprise: Number(idEntreprise) });
    if (r.error) throw r.error;
    await loadList();
  } catch (e) {
    console.error('[entr] retrait', e);
    notifier(errMsg(e), 'alerte');
  }
}

async function doRenvoyer(idEntreprise) {
  try {
    const bc = await chargerBacsClient();
    if (!bc || !bc.renvoyer) throw new Error('Module BACS indisponible : rechargez la page.');
    const r = await bc.renvoyer(supa(), idEntreprise, siteCourant());
    if (r.error) throw r.error;
    await loadList();
  } catch (e) { notifier(errMsg(e), 'alerte'); }
}

async function doPousserSociete() {
  try {
    const bc = await chargerBacsClient();
    if (!bc || !bc.pousserSociete) throw new Error('Module BACS indisponible : rechargez la page.');
    const r = await bc.pousserSociete(supa(), state.idClient, siteCourant());
    if (r.error) throw r.error;
    if (r.data && r.data.bacs_ok === false) notifier('BACS : ' + (r.data.bacs_erreur || 'société non créée'), 'alerte');
    chargerEtatBacs(state.idClient);
  } catch (e) { notifier(errMsg(e), 'alerte'); }
}

// ============================================================================
//  FICHE SOCIÉTÉ → ajouter un interlocuteur (base des particuliers)
// ============================================================================
function openInterlocuteur() {
  state.imodal = {
    q: '', results: [], searching: false, searched: false,
    selected: null,                      // { id, nom, sub, dans_bacs }
    form: { type: 'Gérant', fonction: '', date_debut: '', commentaire: '' },
    create: null, saving: false, error: null
  };
  render();
  chargerCoordSociete();
}
// Coordonnées de la société : proposées par défaut à l'interlocuteur créé.
async function chargerCoordSociete() {
  if (state.socCoord && state.socCoord.id === state.idClient) return;
  try {
    const r = await supa().from('CLIENT').select('TEl_MOB, TEL_FIXE, EMAIL').eq('IDVu', state.idClient).maybeSingle();
    const d = (r && r.data) || {};
    state.socCoord = { id: state.idClient, mob: cleanDigits(d.TEl_MOB || ''), fixe: cleanDigits(d.TEL_FIXE || ''), email: String(d.EMAIL || '').trim().toLowerCase() };
  } catch (e) { state.socCoord = { id: state.idClient, mob: '', fixe: '', email: '' }; }
}
function closeInterlocuteur() { state.imodal = null; render(); }

let iDebounce = null;
function onIQuery(q) {
  if (!state.imodal) return;
  state.imodal.q = q;
  if (iDebounce) clearTimeout(iDebounce);
  if (!q || q.trim().length < 2) { state.imodal.results = []; state.imodal.searched = false; render(); return; }
  iDebounce = setTimeout(() => runISearch(q.trim()), 350);
}
async function runISearch(q) {
  const m = state.imodal; if (!m) return;
  m.searching = true; m.error = null; render();
  try {
    const r = await supa().rpc('interlocuteur_rechercher', { p_q: q, p_limite: 12 });
    if (r.error) throw r.error;
    if (state.imodal !== m || m.q.trim() !== q) return;
    const deja = new Set((state.list || []).map(x => x.id_particulier));
    m.results = (r.data || []).filter(x => !deja.has(Number(x.id_client)));
    m.searched = true;
  } catch (e) {
    m.results = []; m.error = errMsg(e);
  } finally {
    m.searching = false; render();
  }
}
function pickInterlocuteur(row) {
  const m = state.imodal; if (!m) return;
  m.selected = {
    id: Number(row.id_client),
    nom: personneName(row) || ('Particulier #' + row.id_client),
    sub: [[row.cp, row.ville].filter(Boolean).join(' '), row.mobile_masque, row.email_masque].filter(Boolean).join(' · '),
    dans_bacs: !!row.dans_bacs
  };
  m.results = []; m.create = null;
  render();
}
async function openICreate() {
  const m = state.imodal; if (!m) return;
  await chargerCoordSociete();
  const sc = (state.socCoord && state.socCoord.id === state.idClient) ? state.socCoord : { mob: '', fixe: '', email: '' };
  const estMob = (t) => /^0[67]\d{8}$/.test(t || '');
  // Numéro de la société : un 06/07 va en portable, un autre numéro en fixe.
  const socMob = estMob(sc.mob) ? sc.mob : (estMob(sc.fixe) ? sc.fixe : '');
  const socFixe = [sc.fixe, sc.mob].find(t => t && !estMob(t)) || '';
  const mots = (m.q || '').trim().split(/\s+/).filter(Boolean);
  const aDesChiffres = /\d/.test(m.q || '');
  const tape = aDesChiffres ? cleanDigits(m.q) : '';
  m.create = {
    data: { CIVILITE: CIVILITES_P[0], PRENOM: !aDesChiffres && mots.length > 1 ? mots.slice(1).join(' ') : '',
            NOM: !aDesChiffres && mots.length ? mots[0] : '',
            TEl_MOB: tape && estMob(tape) ? tape : socMob,
            TEL_FIXE: tape && !estMob(tape) ? tape : socFixe,
            EMAIL: sc.email || '' },
    reprisSociete: !!(socMob || socFixe || sc.email),
    saving: false, error: null, duplicate: null, dupAck: false
  };
  m.results = [];
  render();
}
function cancelICreate() { if (state.imodal) { state.imodal.create = null; render(); } }

// Le particulier est créé dans One Data seulement : c'est le lien qui le
// crée dans BACS (compte particulier, sans demande de contact ni affaire).
async function saveICreate() {
  const m = state.imodal; if (!m || !m.create) return;
  const c = m.create, d = c.data;
  const nom = String(d.NOM || '').trim(), mob = cleanDigits(d.TEl_MOB), fixe = cleanDigits(d.TEL_FIXE || ''), email = String(d.EMAIL || '').trim().toLowerCase();
  if (!nom) { c.error = 'Le nom est obligatoire.'; render(); return false; }
  if (mob && !/^0[67]\d{8}$/.test(mob)) { c.error = 'Le portable doit comporter 10 chiffres et commencer par 06 ou 07.'; render(); return false; }
  if (fixe && !/^0\d{9}$/.test(fixe)) { c.error = 'Le téléphone fixe doit comporter 10 chiffres.'; render(); return false; }
  if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) { c.error = "L'adresse e-mail n'est pas valide."; render(); return false; }
  if (!mob && !email && !fixe) { c.error = 'Un téléphone ou un e-mail est nécessaire pour joindre l’interlocuteur.'; render(); return false; }
  if (!c.dupAck) {
    await chargerDoublons();
    const od = window.oropraDoublons;
    if (od) {
      const dup = await od.check(supa(), { NOM: nom, PRENOM: d.PRENOM, TEl_MOB: mob, EMAIL: email }, {});
      if (dup) { c.duplicate = dup; render(); return false; }
    }
  }
  const idSite = siteCourant();
  if (idSite == null) { c.error = 'Aucun site sélectionné (choisissez un site en haut à droite).'; render(); return false; }
  c.saving = true; c.error = null; render();
  try {
    const now = new Date().toISOString();
    const payload = {
      idmultivu: 0, CIVILITE: d.CIVILITE || null, NOM: nom.toUpperCase(), PRENOM: String(d.PRENOM || '').trim().toUpperCase() || null,
      TEl_MOB: mob || null, TEL_FIXE: fixe || null, EMAIL: email || null, CreationDate: now, UpdateDate: now,
      ID_VENDEUR_CREATION: viewerId != null ? String(viewerId) : null,
      ID_VENDEUR_UPDATE: viewerId != null ? String(viewerId) : null
    };
    const r = await supa().rpc('client_creer', { p_payload: payload, p_id_site: idSite, p_id_user: viewerId != null ? Number(viewerId) : null });
    if (r.error) throw r.error;
    const ins = r.data && r.data.client ? r.data.client : null;
    if (!ins) throw new Error('création : aucune fiche renvoyée');
    if (c.duplicate && c.duplicate.candidats && window.oropraDoublons) {
      const cc = c.duplicate.candidats.filter(x => x.id_client != null && Number(x.id_client) !== Number(ins.IDVu));
      if (cc.length) { try { await window.oropraDoublons.signaler(supa(), ins.IDVu, cc); } catch (e) {} }
    }
    m.selected = { id: Number(ins.IDVu), nom: personneName(ins), sub: 'Nouvelle fiche n° ' + ins.IDVu, dans_bacs: false };
    m.create = null;
    render();
    return true;
  } catch (e) {
    c.saving = false; c.error = errMsg(e); render();
    return false;
  }
}

async function saveInterlocuteur() {
  const m = state.imodal; if (!m) return;
  if (!m.form.type) { m.error = 'Le rôle est obligatoire.'; render(); return; }
  if (m.create) {
    m.error = null;
    if (!(await saveICreate())) return;   // erreur ou doublon affiché : le vendeur décide
    if (state.imodal !== m) return;
  }
  if (!m.selected) return;
  m.saving = true; m.error = null; render();
  try {
    const r = await lier(state.idClient, m.selected.id, m.form);
    if (r.error) throw r.error;
    state.imodal = null;
    if (r.data && r.data.bacs && r.data.bacs_ok === false) notifier('Interlocuteur désigné dans One Data. BACS : ' + (r.data.bacs_erreur || 'non reporté') + ' — utilisez « Réessayer ».', 'alerte');
    else if (r.data && r.data.bacs) notifier('Interlocuteur désigné dans One Data et dans BACS.', 'ok');
    await loadList();
  } catch (e) {
    m.saving = false; m.error = errMsg(e); render();
  }
}

// --- Icônes (SVG inline) ----------------------------------------------------
const I = {
  building: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="4" y="3" width="16" height="18" rx="1"/><path d="M9 21V12h6v9"/></svg>',
  user: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c0-4 4-6 8-6s8 2 8 6"/></svg>',
  plus: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><line x1="12" y1="8" x2="12" y2="16"/><line x1="8" y1="12" x2="16" y2="12"/></svg>',
  search: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>',
  x: '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
  unlink: '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 13l-2 2a3 3 0 0 1-4-4l2-2"/><path d="M15 11l2-2a3 3 0 0 0-4-4l-2 2"/><line x1="3" y1="3" x2="21" y2="21"/></svg>',
  link: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7 0l3-3a5 5 0 0 0-7-7l-1 1"/><path d="M14 11a5 5 0 0 0-7 0l-3 3a5 5 0 0 0 7 7l1-1"/></svg>',
  back: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/></svg>',
  retry: '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="23 4 23 10 17 10"/><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"/></svg>',
  spin: '<span class="er-spin"></span>'
};

const R = '#oropra-entreprise-rattachement';
const STYLE = `<style>
${R}{font-family:"Nunito Sans",system-ui,sans-serif;color:#2a5ea9}
${R} *{box-sizing:border-box}
${R} .er-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;gap:12px}
${R} .er-head-t{font-size:12px;text-transform:uppercase;letter-spacing:.4px;color:#7a98c5;font-weight:700;display:flex;align-items:center;gap:8px}
${R} .er-count{background:#e6f1fb;color:#2a5ea9;border-radius:10px;padding:1px 8px;font-size:11px}
${R} .er-btn{display:inline-flex;align-items:center;gap:6px;padding:9px 16px;border-radius:6px;font-size:12.5px;font-weight:600;cursor:pointer;border:1px solid transparent;font-family:inherit;white-space:nowrap}
${R} .er-btn-primary{background:#53bda7;color:#fff;border-color:#53bda7}
${R} .er-btn-primary:disabled{background:#a9d9cd;border-color:#a9d9cd;cursor:not-allowed}
${R} .er-btn-ghost{background:transparent;color:#2a5ea9;border-color:#2a5ea9}
${R} .er-btn-mini{padding:5px 10px;font-size:11.5px}
${R} .er-list{display:flex;flex-direction:column;gap:8px}
${R} .er-row{display:flex;align-items:center;gap:12px;padding:12px 14px;border:1px solid #eef3fb;border-radius:8px}
${R} .er-row-ic{width:32px;height:32px;border-radius:7px;background:#f2f6fc;color:#2a5ea9;display:flex;align-items:center;justify-content:center;flex-shrink:0}
${R} .er-row-main{flex:1;min-width:0}
${R} .er-row-name{font-weight:700;font-size:13px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
${R} .er-row-sub{font-size:11px;color:#7a98c5;margin-top:1px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
${R} .er-badge{font-size:11px;font-weight:700;padding:3px 10px;border-radius:6px;white-space:nowrap;background:#f0f4fa;color:#4a6a96}
${R} .er-badge.b-gerant{background:#e1f5ee;color:#0f6e56}
${R} .er-badge.b-assoc{background:#e6f1fb;color:#0c447c}
${R} .er-badge.b-cond{background:#fdf3e2;color:#9a5b0b}
${R} .er-sync{font-size:11px;font-weight:700;padding:3px 9px;border-radius:6px;white-space:nowrap;border:1px solid #d9e3f2;color:#7a98c5;display:inline-flex;align-items:center;gap:5px}
${R} .er-sync.ok{border-color:#9ad9c5;color:#0f6e56}
${R} .er-sync.att{border-color:#bcd2ee;color:#2a5ea9}
${R} .er-sync.ko{border-color:#f0c48a;color:#a8620e}
${R} .er-b{display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border-radius:4px;background:#1F4A85;color:#fff;font-weight:900;font-size:10px}
${R} .er-row-date{font-size:11px;color:#8aa3c3;white-space:nowrap}
${R} .er-ic{width:30px;height:30px;border-radius:6px;border:none;background:transparent;color:#7a98c5;display:inline-flex;align-items:center;justify-content:center;cursor:pointer}
${R} .er-ic:hover{background:#fdf3e2;color:#a8620e}
${R} .er-empty{padding:34px 16px;text-align:center;color:#8aa3c3;font-size:13px}
${R} .er-alert{display:flex;align-items:center;gap:12px;border:1px solid #f0c48a;border-left:3px solid #e6a817;border-radius:8px;padding:11px 14px;margin-bottom:12px;font-size:12.5px;color:#7a4b0c;background:#fff}
${R} .er-alert b{color:#5f3a08}
${R} .er-alert .er-btn{margin-left:auto}
${R} .er-info{display:flex;align-items:center;gap:10px;border:1px solid #d9e3f2;border-left:3px solid #2a5ea9;border-radius:8px;padding:10px 14px;margin-bottom:12px;font-size:12.5px;color:#2a5ea9;background:#fff}
${R} .er-info.ok{border-left-color:#53bda7;color:#0f6e56;border-color:#bfe6da}
${R} .er-info .er-btn{margin-left:auto}
${R} .er-overlay{position:fixed;inset:0;background:rgba(42,94,169,.35);z-index:1000;display:flex;align-items:flex-start;justify-content:center;padding:40px 16px;overflow-y:auto}
${R} .er-modal{background:#fff;border-radius:12px;width:100%;max-width:560px;box-shadow:0 20px 60px rgba(31,74,133,.22);display:flex;flex-direction:column;max-height:calc(100vh - 80px)}
${R} .er-modal-h{display:flex;align-items:center;justify-content:space-between;padding:16px 20px;border-bottom:1px solid #f0f4fa}
${R} .er-modal-t{font-size:16px;font-weight:700}
${R} .er-modal-b{padding:18px 20px;overflow-y:auto;display:flex;flex-direction:column;gap:10px}
${R} .er-modal-f{display:flex;justify-content:flex-end;gap:8px;padding:14px 20px;border-top:1px solid #f0f4fa}
${R} .er-step{font-size:11px;text-transform:uppercase;letter-spacing:.4px;color:#7a98c5;font-weight:700;margin-top:4px}
${R} .er-hint{font-size:12px;color:#7a98c5;line-height:1.45}
${R} .er-search{display:flex;align-items:center;gap:8px;border:1px solid #d9e3f2;border-radius:6px;padding:10px 12px;color:#7a98c5}
${R} .er-search input{border:none;outline:none;flex:1;font-family:inherit;color:#2a5ea9;font-size:13px;background:transparent}
${R} .er-drop{border:1px solid #d9e3f2;border-radius:6px;overflow:hidden}
${R} .er-drop-item{padding:10px 12px;font-size:13px;color:#2a5ea9;border-bottom:1px solid #f0f4fa;cursor:pointer;display:flex;align-items:center;gap:10px;transition:box-shadow .12s}
${R} .er-drop-item:last-child{border-bottom:none}
${R} .er-drop-item:hover{box-shadow:inset 3px 0 0 #2a5ea9;background:#f7faff}
${R} .er-drop-main{flex:1;min-width:0}
${R} .er-drop-sub{font-size:11px;color:#7a98c5;margin-top:2px}
${R} .er-drop-create{padding:10px 12px;font-size:12.5px;color:#2b9a83;font-weight:600;display:flex;align-items:center;gap:6px;cursor:pointer;background:#fff}
${R} .er-drop-create:hover{box-shadow:inset 3px 0 0 #2a5ea9}
${R} .er-chip{display:flex;align-items:center;justify-content:space-between;gap:10px;border:1px solid #9ad9c5;border-radius:8px;padding:11px 14px}
${R} .er-chip-name{font-weight:700;font-size:13px;color:#0f6e56}
${R} .er-chip-sub{font-size:11px;color:#3a8a76;margin-top:1px}
${R} .er-chip-x{background:none;border:none;color:#0f6e56;cursor:pointer;font-size:12px;font-weight:600}
${R} .er-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px 14px}
${R} .er-newcard{border:1px solid #9ad9c5;border-radius:8px;padding:12px 14px;display:flex;flex-direction:column;gap:12px}
${R} .er-newcard-h{display:flex;align-items:flex-start;justify-content:space-between;gap:10px}
${R} .er-f{display:flex;flex-direction:column;gap:4px}
${R} .er-f-full{grid-column:1 / -1}
${R} .er-f label{font-size:11px;text-transform:uppercase;letter-spacing:.4px;color:#7a98c5;font-weight:600}
${R} .er-req{color:#e6a817}
${R} .er-input,${R} .er-select,${R} .er-ta{border:1px solid #d9e3f2;border-radius:6px;padding:10px 12px;font-size:13px;color:#2a5ea9;outline:none;font-family:inherit;width:100%;background:#fff}
${R} .er-input:focus,${R} .er-select:focus,${R} .er-ta:focus{border-color:#2a5ea9}
${R} .er-ta{resize:vertical;min-height:58px}
${R} .er-err{color:#7a4b0c;font-size:12.5px;border:1px solid #f0c48a;border-left:3px solid #e6a817;border-radius:6px;padding:10px 12px;background:#fff}
${R} .er-status{font-size:11px;color:#53bda7;display:inline-flex;align-items:center;gap:5px;margin-top:2px}
${R} .er-spin{display:inline-block;width:12px;height:12px;border:2px solid #e3edf9;border-top-color:#53bda7;border-radius:50%;animation:er-spin .8s linear infinite}
${R} .er-tag{font-size:10.5px;font-weight:700;padding:2px 7px;border-radius:5px;border:1px solid #bcd2ee;color:#2a5ea9;white-space:nowrap}
${R} .er-tag.non{border-color:#e3e9f2;color:#9fb3cf}
@keyframes er-spin{to{transform:rotate(360deg)}}
@media (max-width:560px){
  ${R} .er-grid{grid-template-columns:1fr}
  ${R} .er-head{flex-wrap:wrap}
  ${R} .er-head .er-btn-primary{flex:1 1 100%;justify-content:center}
  ${R} .er-row{flex-wrap:wrap}
  ${R} .er-row-main{flex:1 1 auto;min-width:140px}
  ${R} .er-overlay{padding:16px 10px}
  ${R} .er-modal{max-height:calc(100vh - 32px)}
  ${R} .er-modal-b{padding:16px}
  ${R} .er-alert,${R} .er-info{flex-wrap:wrap}
}
</style>`;

// --- Rendu ------------------------------------------------------------------
function badgeCls(type) { return TYPE_CLS[type] || ''; }
function fmtDate(d) {
  if (!d) return '';
  const dt = new Date(String(d).slice(0, 10) + 'T12:00:00');
  if (isNaN(dt.getTime())) return '';
  return dt.toLocaleDateString('fr-FR', { month: '2-digit', year: 'numeric' });
}
function syncChip(r) {
  if (!state.bacs || !state.bacs.actif) {
    return r.dans_bacs ? '<span class="er-sync ok"><span class="er-b">B</span>Dans BACS</span>' : '';
  }
  if (r.bacs_etat === 'echec') {
    return `<span class="er-sync ko" title="${esc(r.bacs_erreur || '')}"><span class="er-b">B</span>Non reporté</span>
            <button class="er-btn er-btn-ghost er-btn-mini" data-renvoyer="${r.id_entreprise}">${I.retry} Réessayer</button>`;
  }
  if (r.dans_bacs) return '<span class="er-sync ok"><span class="er-b">B</span>Dans BACS</span>';
  if (r.bacs_etat === 'a_envoyer') return `<span class="er-sync att"><span class="er-b">B</span>En cours</span>
            <button class="er-btn er-btn-ghost er-btn-mini" data-renvoyer="${r.id_entreprise}">${I.retry} Réessayer</button>`;
  return `<button class="er-btn er-btn-ghost er-btn-mini" data-renvoyer="${r.id_entreprise}"><span class="er-b">B</span> Reporter dans BACS</button>`;
}

function renderNotice() {
  if (!state.notice) return '';
  const cls = state.notice.ton === 'alerte' ? 'er-alert' : ('er-info' + (state.notice.ton === 'ok' ? ' ok' : ''));
  return `<div class="${cls}">${esc(state.notice.texte)}</div>`;
}

// ---------- société ----------
function renderSociete() {
  let h = '';
  const n = state.list ? state.list.length : 0;
  h += `<div class="er-head"><div class="er-head-t">Interlocuteurs${n ? ' <span class="er-count">' + n + '</span>' : ''}</div>`;
  h += `<button class="er-btn er-btn-primary" data-open-inter="1">${I.plus} Ajouter un interlocuteur</button></div>`;
  h += renderNotice();
  if (state.bacs && state.bacs.actif && !state.bacs.compte) {
    h += `<div class="er-alert"><span><b>Société absente de BACS.</b> Créez-la dans BACS pour y désigner ses interlocuteurs et y ouvrir des affaires.</span>
          <button class="er-btn er-btn-ghost er-btn-mini" data-pousser-societe="1"><span class="er-b">B</span> Créer dans BACS</button></div>`;
  }
  if (!state.loading && state.list && !state.list.length && !state.error) {
    h += `<div class="er-alert"><span><b>Aucun interlocuteur désigné.</b> Comme dans BACS, une affaire ne peut être ouverte pour une société qu'une fois son interlocuteur désigné.</span></div>`;
  }
  if (state.loading || state.list === null) return h + '<div class="er-empty">Chargement…</div>';
  if (state.error) return h + `<div class="er-empty">Erreur : ${esc(state.error)}</div>`;
  if (!state.list.length) return h;
  h += '<div class="er-list">';
  for (const r of state.list) {
    const sub = [r.fonction, r.tel, r.email, r.ville].filter(Boolean).join(' · ');
    h += `<div class="er-row">
      <span class="er-row-ic">${I.user}</span>
      <div class="er-row-main">
        <div class="er-row-name">${esc(r.nom)}</div>
        <div class="er-row-sub">${esc(sub || 'Fiche n° ' + r.id_particulier)}</div>
      </div>
      ${r.type ? `<span class="er-badge ${badgeCls(r.type)}">${esc(r.type)}</span>` : '<span class="er-badge">Interlocuteur</span>'}
      ${syncChip(r)}
      <button class="er-ic" data-detach="${r.id_entreprise}" data-detach-lib="Retirer ${esc(r.nom)} des interlocuteurs de la société ?" title="Retirer" aria-label="Retirer">${I.unlink}</button>
    </div>`;
  }
  return h + '</div>';
}

function renderIModal() {
  const m = state.imodal; if (!m) return '';
  let b = '';
  if (m.error) b += `<div class="er-err">${esc(m.error)}</div>`;
  b += '<div class="er-step">1 · Interlocuteur</div>';
  if (m.create) {
    b += renderICreate(m.create);
  } else if (m.selected) {
    b += `<div class="er-chip"><div><div class="er-chip-name">${esc(m.selected.nom)}</div><div class="er-chip-sub">${esc(m.selected.sub || '')}${m.selected.dans_bacs ? ' · dans BACS' : ' · sera créé dans BACS'}</div></div><button class="er-chip-x" data-i-clear="1">Changer</button></div>`;
  } else {
    b += `<div class="er-hint">Recherchez la personne dans la base des particuliers (nom, prénom, portable ou e-mail) : elle existe peut-être déjà.</div>`;
    b += `<div class="er-search">${I.search}<input data-iq="1" value="${esc(m.q)}" placeholder="Ex. DUPONT Jean, 06 12 34 56 78, jean@…" autocomplete="off"></div>`;
    if (m.searching) b += '<div class="er-status">' + I.spin + ' Recherche…</div>';
    if (m.searched && !m.searching) {
      b += '<div class="er-drop">';
      m.results.forEach((r, i) => {
        const sub = [[r.cp, r.ville].filter(Boolean).join(' '), r.mobile_masque, r.email_masque].filter(Boolean).join(' · ');
        b += `<div class="er-drop-item" data-i-pick="${i}"><span class="er-row-ic">${I.user}</span><div class="er-drop-main"><div style="font-weight:700">${esc(personneName(r))}</div><div class="er-drop-sub">${esc(sub || 'Fiche n° ' + r.id_client)}</div></div>${r.dans_bacs ? '<span class="er-tag">BACS</span>' : '<span class="er-tag non">Hors BACS</span>'}</div>`;
      });
      b += `<div class="er-drop-create" data-i-create="1">${I.plus} ${m.results.length ? 'Pas la bonne personne ? Créer un particulier' : 'Personne trouvée — créer un particulier'}</div>`;
      b += '</div>';
    }
  }
  if (m.selected || m.create) {
    b += '<div class="er-step">2 · Rôle dans la société</div>';
    b += '<div class="er-grid">';
    b += `<div class="er-f"><label>Rôle <span class="er-req">*</span></label><select class="er-select" data-if="type">${TYPES.map(t => `<option value="${esc(t)}"${m.form.type === t ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select></div>`;
    b += `<div class="er-f"><label>Fonction</label><input class="er-input" data-if="fonction" value="${esc(m.form.fonction)}" placeholder="ex. DAF, responsable flotte" autocomplete="off"></div>`;
    b += `<div class="er-f er-f-full"><label>Commentaire</label><textarea class="er-ta" data-if="commentaire" placeholder="Optionnel">${esc(m.form.commentaire)}</textarea></div>`;
    b += '</div>';
    if (state.bacs && state.bacs.actif) b += `<div class="er-hint"><span class="er-b">B</span> L'interlocuteur sera aussi désigné dans BACS${state.bacs.compte ? '' : ' (la société y sera créée au passage)'}.</div>`;
  }
  const can = !!(m.selected || m.create);
  const occupe = m.saving || (m.create && m.create.saving);
  let f = `<button class="er-btn er-btn-ghost" data-i-close="1">Annuler</button>`;
  f += `<button class="er-btn er-btn-primary" data-i-save="1"${(!can || occupe) ? ' disabled' : ''}>${occupe ? I.spin : (m.create ? I.plus : I.link)} <span>${m.create ? 'Créer et désigner l\'interlocuteur' : 'Désigner l\'interlocuteur'}</span></button>`;
  return `<div class="er-overlay" data-i-overlay="1"><div class="er-modal">
    <div class="er-modal-h"><div class="er-modal-t">Ajouter un interlocuteur</div><button class="er-ic" data-i-close="1" aria-label="Fermer">${I.x}</button></div>
    <div class="er-modal-b">${b}</div>
    <div class="er-modal-f">${f}</div>
  </div></div>`;
}

function renderICreate(c) {
  let h = '';
  if (c.error) h += `<div class="er-err">${esc(c.error)}</div>`;
  if (c.duplicate && window.oropraDoublons) h += window.oropraDoublons.html(c.duplicate, 'er', { saving: c.saving, libelleForce: 'Créer quand même' });
  h += `<div class="er-newcard"><div class="er-newcard-h"><div><div class="er-chip-name">Nouveau particulier</div>
    <div class="er-chip-sub">Créé dans One Data${state.bacs && state.bacs.actif ? ' et dans BACS' : ''} au moment de la désignation</div></div>
    <button class="er-chip-x" data-ic-cancel="1">Rechercher plutôt</button></div>`;
  h += '<div class="er-grid">';
  h += `<div class="er-f"><label>Civilité</label><select class="er-select" data-ic="CIVILITE">${CIVILITES_P.map(t => `<option value="${esc(t)}"${c.data.CIVILITE === t ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select></div>`;
  h += '<div class="er-f"></div>';
  h += `<div class="er-f"><label>Nom <span class="er-req">*</span></label><input class="er-input" data-ic="NOM" value="${esc(c.data.NOM)}" autocomplete="off"></div>`;
  h += `<div class="er-f"><label>Prénom</label><input class="er-input" data-ic="PRENOM" value="${esc(c.data.PRENOM)}" autocomplete="off"></div>`;
  h += `<div class="er-f"><label>Portable</label><input class="er-input" data-ic="TEl_MOB" value="${esc(c.data.TEl_MOB)}" placeholder="06…" autocomplete="off"></div>`;
  h += `<div class="er-f"><label>Fixe</label><input class="er-input" data-ic="TEL_FIXE" value="${esc(c.data.TEL_FIXE || '')}" placeholder="01…" autocomplete="off"></div>`;
  h += `<div class="er-f"><label>E-mail</label><input class="er-input" data-ic="EMAIL" value="${esc(c.data.EMAIL)}" autocomplete="off"></div>`;
  h += '</div>';
  if (c.reprisSociete) h += `<div class="er-hint" style="margin-top:8px">Téléphone et e-mail repris de la société : modifiez-les si l'interlocuteur a les siens.</div>`;
  h += '</div>';
  return h;
}

// ---------- particulier ----------
function renderParticulier() {
  let h = `<div class="er-head"><div class="er-head-t">Entreprises rattachées${state.list && state.list.length ? ' <span class="er-count">' + state.list.length + '</span>' : ''}</div>`;
  h += `<button class="er-btn er-btn-primary" data-open-modal="1">${I.plus} Rattacher à une entreprise</button></div>`;
  h += renderNotice();
  if (state.loading || state.list === null) return h + '<div class="er-empty">Chargement…</div>';
  if (state.error) return h + `<div class="er-empty">Erreur : ${esc(state.error)}</div>`;
  if (!state.list.length) return h + '<div class="er-empty">Aucune entreprise rattachée. Cliquez « Rattacher à une entreprise » pour en ajouter une.</div>';
  h += '<div class="er-list">';
  for (const r of state.list) {
    h += `<div class="er-row">
      <span class="er-row-ic">${I.building}</span>
      <div class="er-row-main">
        <div class="er-row-name">${esc(r.nom)}</div>
        <div class="er-row-sub">${r.siret ? 'SIRET ' + esc(r.siret) : 'SIRET —'}${r.fonction ? ' · ' + esc(r.fonction) : ''}</div>
      </div>
      ${r.type ? `<span class="er-badge ${badgeCls(r.type)}">${esc(r.type)}</span>` : ''}
      ${r.date_debut ? `<span class="er-row-date">depuis ${esc(fmtDate(r.date_debut))}</span>` : ''}
      <button class="er-ic" data-detach="${r.id_entreprise}" data-detach-lib="Détacher cette entreprise du client ?" title="Détacher" aria-label="Détacher">${I.unlink}</button>
    </div>`;
  }
  return h + '</div>';
}

function renderSearchForm(m) {
  const sf = (label, field, ph) => `<div class="er-f"><label>${esc(label)}</label><input class="er-input" data-sf="${field}" value="${esc(m.search[field])}" placeholder="${esc(ph || '')}" autocomplete="off"></div>`;
  let h = '<div class="er-grid">';
  h += sf('Raison sociale', 'NOM');
  h += sf('SIRET', 'SIRET');
  h += sf('Email', 'EMAIL');
  h += sf('ID client', 'IDVu');
  h += '</div>';
  h += `<div style="display:flex;justify-content:flex-end;gap:8px"><button class="er-btn er-btn-ghost" data-clear-search="1">Effacer</button><button class="er-btn er-btn-primary" data-run-search="1">${I.search} Rechercher</button></div>`;
  if (m.searching) { h += '<div class="er-status">' + I.spin + ' Recherche…</div>'; return h; }
  if (!m.searched) return h;
  if (m.results.length) {
    h += '<div class="er-drop">';
    for (let i = 0; i < m.results.length; i++) {
      const r = m.results[i];
      const nom = societeName(r) || ('Société #' + r.IDVu);
      const sub = [r.SIRET ? String(r.SIRET) : '', [r.code_postal, r.ville].filter(Boolean).join(' '), r.EMAIL || ''].filter(Boolean).join(' — ');
      h += `<div class="er-drop-item" data-pick="${i}"><div class="er-drop-main"><div style="font-weight:700">${esc(nom)}</div><div class="er-drop-sub">${esc(sub)}</div></div></div>`;
    }
    h += '</div>';
    if (m.totalCount > m.results.length) h += `<div class="er-status" style="color:#8aa3c3">${m.totalCount} résultats — affinez la recherche.</div>`;
    h += `<div class="er-drop-create" data-open-create="1" style="border:1px solid #d9e3f2;border-radius:6px">${I.plus} Pas la bonne ? Créer une entreprise</div>`;
  } else {
    h += `<div class="er-drop"><div class="er-drop-create" data-open-create="1">${I.plus} Aucune entreprise trouvée — créer une entreprise</div></div>`;
  }
  return h;
}

function renderModal() {
  if (!state.modal) return '';
  const m = state.modal;
  let body = '';
  if (m.error) body += `<div class="er-err">${esc(m.error)}</div>`;
  body += '<div class="er-step">1 · Entreprise</div>';
  if (m.create) body += renderCreate(m.create);
  else if (m.selected) body += `<div class="er-chip"><div><div class="er-chip-name">${esc(m.selected.nom)}</div><div class="er-chip-sub">${m.selected.siret ? 'SIRET ' + esc(m.selected.siret) : 'IDVu ' + m.selected.IDVu}</div></div><button class="er-chip-x" data-clear-selected="1">Changer</button></div>`;
  else body += renderSearchForm(m);
  if (m.selected && !m.create) {
    body += '<div class="er-step">2 · Rattachement</div>';
    body += '<div class="er-grid">';
    body += `<div class="er-f"><label>Type <span class="er-req">*</span></label><select class="er-select" data-ff="type">${TYPES.map(t => `<option value="${esc(t)}"${m.form.type === t ? ' selected' : ''}>${esc(t)}</option>`).join('')}</select></div>`;
    body += `<div class="er-f"><label>Fonction</label><input class="er-input" data-ff="fonction" value="${esc(m.form.fonction)}" placeholder="ex. DAF" autocomplete="off"></div>`;
    body += `<div class="er-f"><label>Date de début</label><input class="er-input" type="date" data-ff="date_debut" value="${esc(m.form.date_debut)}"></div>`;
    body += '<div class="er-f"></div>';
    body += `<div class="er-f er-f-full"><label>Commentaire</label><textarea class="er-ta" data-ff="commentaire" placeholder="Optionnel">${esc(m.form.commentaire)}</textarea></div>`;
    body += '</div>';
  }
  const canAttach = m.selected && !m.create;
  let footer = `<button class="er-btn er-btn-ghost" data-close-modal="1">Annuler</button>`;
  footer += `<button class="er-btn er-btn-primary" data-attach="1"${(!canAttach || m.saving) ? ' disabled' : ''}>${m.saving ? I.spin : I.link} <span>Rattacher</span></button>`;
  return `<div class="er-overlay" data-overlay="1"><div class="er-modal">
    <div class="er-modal-h"><div class="er-modal-t">Rattacher à une entreprise</div><button class="er-ic" data-close-modal="1" aria-label="Fermer">${I.x}</button></div>
    <div class="er-modal-b">${body}</div>
    <div class="er-modal-f">${footer}</div>
  </div></div>`;
}

function renderCreate(c) {
  let h = '';
  if (c.error) h += `<div class="er-err">${esc(c.error)}</div>`;
  if (c.duplicate && window.oropraDoublons) h += window.oropraDoublons.html(c.duplicate, 'er', { saving: c.saving, libelleForce: 'Créer quand même' });
  h += `<div class="er-search">${I.search}<input data-cf="sirene" value="${esc(c.sireneQ || '')}" placeholder="Rechercher dans SIRENE (SIRET, SIREN, raison sociale)…" autocomplete="off"></div>`;
  if (c.sireneLoading) h += '<div class="er-status">' + I.spin + ' Recherche SIRENE…</div>';
  if (c.sireneResults && c.sireneResults.length) {
    h += '<div class="er-drop">';
    for (let i = 0; i < c.sireneResults.length; i++) {
      const s = c.sireneResults[i];
      h += `<div class="er-drop-item" data-pick-sirene="${i}"><div class="er-drop-main"><div style="font-weight:700">${esc(s.raison_sociale || '(sans dénomination)')}</div><div class="er-drop-sub">${esc(s.siret || '')} — ${esc(s.commune || '')} — ${esc(s.statut || '')}</div></div></div>`;
    }
    h += '</div>';
  }
  h += '<div class="er-grid">';
  h += `<div class="er-f er-f-full"><label>Raison sociale <span class="er-req">*</span></label><input class="er-input" data-cf="NOM" value="${esc(c.data.NOM)}" autocomplete="off"></div>`;
  h += `<div class="er-f"><label>SIRET</label><input class="er-input" data-cf="SIRET" value="${esc(c.data.SIRET)}" placeholder="14 chiffres" autocomplete="off"></div>`;
  h += `<div class="er-f"><label>Ville</label><input class="er-input" data-cf="ville" value="${esc(c.data.ville)}" autocomplete="off"></div>`;
  if (c.data.adresse_status === 'verified') h += `<div class="er-f er-f-full"><div class="er-status">✓ Établissement SIRENE</div></div>`;
  h += '</div>';
  h += `<div style="display:flex;gap:8px;justify-content:flex-end;margin-top:4px">
    <button class="er-btn er-btn-ghost" data-cancel-create="1">${I.back} Retour</button>
    <button class="er-btn er-btn-primary" data-save-create="1"${c.saving ? ' disabled' : ''}>${c.saving ? I.spin : I.plus} <span>Créer et sélectionner</span></button>
  </div>`;
  return h;
}

function render() {
  const root = getRoot(); if (!root) return;
  const active = doc.activeElement;
  let focusAttr = null, focusKey = null;
  if (active && active.getAttribute) {
    for (const k of ['data-sf', 'data-cf', 'data-ff', 'data-iq', 'data-ic', 'data-if']) { const v = active.getAttribute(k); if (v != null) { focusAttr = k; focusKey = v; break; } }
  }
  const cursor = focusKey && active && typeof active.selectionStart === 'number' ? active.selectionStart : null;

  let h = STYLE;
  if (isSociete()) h += renderSociete() + renderIModal();
  else if (isParticulier() || state.modal) h += renderParticulier() + renderModal();
  else h += '<div class="er-empty">Aucune fiche sélectionnée.</div>';
  root.innerHTML = h;
  bindEvents();

  if (focusKey) {
    const el = root.querySelector(`[${focusAttr}="${focusKey}"]`);
    if (el) { el.focus(); if (cursor != null && el.setSelectionRange) { try { el.setSelectionRange(cursor, cursor); } catch (e) {} } }
  }
}

function bindEvents() {
  const root = getRoot(); if (!root) return;
  const on = (sel, ev, fn) => root.querySelectorAll(sel).forEach(el => el.addEventListener(ev, fn));

  // Retrait (les deux fiches)
  on('[data-detach]', 'click', (e) => doDetach(e.currentTarget.getAttribute('data-detach'), e.currentTarget.getAttribute('data-detach-lib')));

  // --- fiche société
  on('[data-open-inter]', 'click', openInterlocuteur);
  on('[data-i-close]', 'click', closeInterlocuteur);
  on('[data-i-overlay]', 'click', (e) => { if (e.target === e.currentTarget) closeInterlocuteur(); });
  on('[data-i-clear]', 'click', () => { if (state.imodal) { state.imodal.selected = null; render(); } });
  on('[data-i-create]', 'click', openICreate);
  on('[data-ic-cancel]', 'click', cancelICreate);
  on('[data-ic-save]', 'click', saveICreate);
  on('[data-i-save]', 'click', saveInterlocuteur);
  on('[data-renvoyer]', 'click', (e) => doRenvoyer(e.currentTarget.getAttribute('data-renvoyer')));
  on('[data-pousser-societe]', 'click', doPousserSociete);
  on('[data-ouvrir-bacs]', 'click', () => { if (state.bacs && state.bacs.url) { try { fw().open(state.bacs.url, '_blank', 'noopener'); } catch (e) {} } });
  on('[data-i-pick]', 'click', (e) => {
    const i = Number(e.currentTarget.getAttribute('data-i-pick'));
    if (state.imodal && state.imodal.results[i]) pickInterlocuteur(state.imodal.results[i]);
  });
  const iq = root.querySelector('[data-iq]');
  if (iq) iq.addEventListener('input', () => onIQuery(iq.value));
  root.querySelectorAll('[data-ic]').forEach(el => {
    const f = el.getAttribute('data-ic');
    el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', () => { if (state.imodal && state.imodal.create) state.imodal.create.data[f] = el.value; });
  });
  root.querySelectorAll('[data-if]').forEach(el => {
    const f = el.getAttribute('data-if');
    el.addEventListener(el.tagName === 'SELECT' ? 'change' : 'input', () => { if (state.imodal) state.imodal.form[f] = el.value; });
  });

  // --- doublons (création société OU particulier)
  on('[data-od-action="dup-dismiss"]', 'click', function () {
    if (state.imodal && state.imodal.create) { state.imodal.create.duplicate = null; render(); return; }
    if (state.modal && state.modal.create) { state.modal.create.duplicate = null; render(); }
  });
  on('[data-od-action="dup-force"]', 'click', function () {
    if (state.imodal && state.imodal.create) { state.imodal.create.dupAck = true; state.imodal.create.duplicate = null; saveInterlocuteur(); return; }
    if (state.modal && state.modal.create) { state.modal.create.dupAck = true; state.modal.create.duplicate = null; saveCreate(); }
  });
  on('[data-od-action="dup-open"]', 'click', function (e) {
    // Interlocuteur : la personne existe déjà, on la reprend au lieu de la recréer.
    const id = Number(e.currentTarget.getAttribute('data-od-idvu'));
    const m = state.imodal;
    if (m && m.create && id) {
      const c = (m.create.duplicate && m.create.duplicate.candidats || []).find(x => Number(x.id_client) === id) || {};
      const a = c.apercu || {};
      m.selected = { id: id, nom: [a.civilite, a.prenom, a.nom].filter(Boolean).join(' ') || ('Fiche n° ' + id),
                     sub: [a.code_postal, a.ville].filter(Boolean).join(' '), dans_bacs: false };
      m.create = null; render();
    }
  });

  // --- fiche particulier
  on('[data-open-modal]', 'click', openModal);
  on('[data-close-modal]', 'click', closeModal);
  on('[data-overlay]', 'click', (e) => { if (e.target === e.currentTarget) closeModal(); });
  on('[data-clear-selected]', 'click', clearSelected);
  on('[data-open-create]', 'click', openCreate);
  on('[data-cancel-create]', 'click', cancelCreate);
  on('[data-save-create]', 'click', saveCreate);
  on('[data-attach]', 'click', doAttach);
  on('[data-pick]', 'click', (e) => {
    const i = Number(e.currentTarget.getAttribute('data-pick'));
    if (state.modal && state.modal.results[i]) selectCompany(state.modal.results[i]);
  });
  on('[data-pick-sirene]', 'click', (e) => {
    const i = Number(e.currentTarget.getAttribute('data-pick-sirene'));
    if (state.modal && state.modal.create && state.modal.create.sireneResults[i]) pickSirene(state.modal.create.sireneResults[i]);
  });
  on('[data-run-search]', 'click', runSearch);
  on('[data-clear-search]', 'click', clearSearch);
  root.querySelectorAll('[data-sf]').forEach(el => {
    const f = el.getAttribute('data-sf');
    el.addEventListener('input', () => setSearchField(f, el.value));
    el.addEventListener('keydown', (e) => { if (e.key === 'Enter') runSearch(); });
  });
  const sirene = root.querySelector('[data-cf="sirene"]');
  if (sirene) sirene.addEventListener('input', () => onSireneInput(sirene.value));
  root.querySelectorAll('[data-cf]').forEach(el => {
    const f = el.getAttribute('data-cf');
    if (f === 'sirene') return;
    el.addEventListener('input', () => { if (state.modal && state.modal.create) state.modal.create.data[f] = el.value; });
  });
  root.querySelectorAll('[data-ff]').forEach(el => {
    const f = el.getAttribute('data-ff');
    const ev = el.tagName === 'SELECT' ? 'change' : 'input';
    el.addEventListener(ev, () => { if (state.modal) state.modal.form[f] = el.value; });
  });
}

// --- Go ---------------------------------------------------------------------
window.__renderEntr = render;
chargerBacsClient();
loadList();

(function ensureRenderedEntr() {
  // Recharge si la fiche change de client (sans remount).
  let last = currentIdvu();
  const iv = setInterval(() => {
    const id = currentIdvu();
    if (id !== last) { last = id; state.list = null; state.modal = null; state.imodal = null; state.bacs = null; state.notice = null; loadList(); }
    const root = getRoot();
    if (root && !root.querySelector('.er-head') && state.modal == null && state.imodal == null) render();
  }, 600);
  setTimeout(() => clearInterval(iv), 600000);
})();

}
});
