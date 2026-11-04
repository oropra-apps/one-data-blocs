// ============================================================================
//  v12 (04/11/2026) : pas de bloc Consentements RGPD sur une société (les
//    consentements portent sur des personnes : ceux des interlocuteurs sont
//    sur leur propre fiche). Aucune relecture BACS lancée pour une société.
//  v11 (03/11/2026) : nouveau design de la fiche, bloc consentements refait.
//    · CONSENTEMENTS en bas de fiche, dépliés (sans survol ni clic), une carte PAR MARQUE (Toyota, Lexus) :
//      état global en couleur (consenti / en attente / refusé / partiel /
//      inconnu), date de la réponse ou de la dernière demande envoyée, les 8
//      canaux en pastilles ; bouton « Demander le consentement » (ou
//      « Relancer ») quand c'est possible — SMS envoyé par BACS via le module
//      partagé oropra-bacs-client (v5), sinon la raison (pas de portable, pas
//      de compte BACS, extension à mettre à jour). Bloctel, Stop com et NPAI
//      sur la même bande. Synthèse serveur : client_consentement_synthese.
//    · Une marque pas encore « consenti » : à l'ouverture, le compte BACS est
//      RELU (client_consentement_relire, au plus toutes les 30 min) pour que
//      la réponse du client — même donnée dans BACS — redescende ; la fiche
//      se met à jour d'elle-même (relecture exécutée par l'extension 3.3.4).
//    · FICHE en lecture : des valeurs lisibles (plus de cases grisées),
//      téléphone et e-mail cliquables, adresse sur une ligne, cartes en deux
//      colonnes ; une carte entièrement vide se réduit à « Non renseigné ».
//      « Modifier la fiche » en haut ; en modification, les champs reviennent.
//    · Fenêtre de détail refaite : une colonne par marque, date de chaque
//      réponse, Bloctel et dates RGPD, lien vers le compte BACS.
//    Logique d'enregistrement, doublons, adresse BAN et SIRENE : inchangées.
//  v10 (03/11/2026) : retour des séances de coaching. Le bouton
//  « Consentements » dit d'un coup d'œil où en est le client : VERT quand
//  toutes ses réponses sont connues (consenti ou refusé), ORANGE tant qu'une
//  demande d'opt-in est en attente (ou qu'aucun consentement n'est connu). Au
//  survol, le détail s'affiche sans clic ; le clic ouvre toujours la fenêtre.
//  v9 (05/10/2026) : filet d'affichage. Une valeur stockee hors referentiel
//  ("Other", une variante d'un import) ne retombe plus sur « Selectionner » :
//  elle est ajoutee comme option, avec son libelle propre quand on sait la
//  reconnaitre (casse, accents, point final), sinon telle quelle. Aucune
//  ecriture : la donnee reste visible et l'utilisateur corrige s'il le souhaite.
//  v8 (05/10/2026) : le select Civilite proposait `libelle` comme valeur
//  ("Monsieur") alors que la base stocke `libelle_court` ("M."), comme le fait
//  deja le select Type des societes. Aucune valeur ne correspondait donc jamais
//  et le champ retombait sur « Selectionner » : 145 fiches sur 60 181 affichaient
//  leur civilite. Le correctif en repare 45 708.
//  FICHE CLIENT (onglet) — module One Data (OD.define)  v1 (Lot A)
//  cfMain migré : rendu dans __anchor ; client via ctx.supabase ; self-boots
//  retirés ; edge sirène via functions.invoke (tenant). Vars WeWeb conservées.
// ============================================================================
OD.define('cf-fiche', {
  mount(__anchor, ctx) {
    __anchor.id = 'oropra-client-fiche';

const SELECTED_CLIENT_VAR_ID = '55490583-c88b-4748-916e-4d203db07742';
const LOOKUP_VAR_ID = 'cced74ab-5a0a-418d-9479-2366e05a8754';
const NPAI_VAR_ID = '7e24f595-e1fd-4257-99f4-76f179032788';
const GEOPF_ENDPOINT = 'https://data.geopf.fr/geocodage/search';
const EDGE_FN_SIRENE_SEARCH = 'sirene-search';
const EDGE_FN_SIRENE_UPSERT = 'sirene-upsert';

const doc = __anchor.ownerDocument || document;
function getRoot() { return __anchor; }

// Onglet "Fiche client" monté paresseusement par WeWeb : sa div n'existe pas au
// chargement si on arrive sur un autre onglet, et elle réapparaît vide au retour.
// Observateur PERSISTANT (sans timeout) -> on (re)rend dès qu'elle réapparaît vide.
// Le garde !querySelector('style') évite tout re-rendu intempestif (donc pas de
// perte de saisie en édition, pas de boucle) : on ne (re)boote que sur une div vide.
// __cfPersistBoot retiré (loader)

// self-boot retiré (loader)

const userConnected = ((wwLib.getFrontWindow && wwLib.getFrontWindow()) || window).oropraUser || {};
const viewerId = userConnected.ID_User;

function readVar(id) { try { return wwLib.wwVariable.getValue(id); } catch (e) { return null; } }
// La liste des civilités et des types de société vit désormais dans la base
// (ref_type_client) : la variable WeWeb qui la portait a été supprimée, et le
// module se retrouvait avec des listes déroulantes vides — création de client
// impossible, la civilité étant obligatoire. Chargement au montage ; ces listes
// ne servent qu'à l'ouverture d'un formulaire, bien après.
let civilitesP = [], typesS = [];
const chargementTypes = (async () => {
  try {
    const { data, error } = await ctx.supabase
      .from('ref_type_client')
      .select('code,libelle,libelle_court,multivu,ordre')
      .eq('actif', true)
      .order('multivu').order('ordre');
    if (error) { console.warn('[types] lecture impossible :', error.message); return; }
    civilitesP = (data || []).filter(x => x.multivu === 0);
    typesS     = (data || []).filter(x => x.multivu === 1);
    // L'onglet Fiche client est celui affiché par défaut : son formulaire est
    // déjà dessiné quand la réponse arrive, avec des listes vides. On le
    // redessine, sans quoi le type d'une société reste sur « Sélectionner »
    // alors que la fiche en porte un.
    try { if (typeof render === 'function') render(); } catch (e) {}
  } catch (e) { console.warn('[types] lecture impossible :', e && e.message); }
})();
const npaiOptionsRaw = readVar(NPAI_VAR_ID);
const npaiOptions = Array.isArray(npaiOptionsRaw) && npaiOptionsRaw.length ? npaiOptionsRaw : ['Aucun', 'NPAI', 'Décédé'];

const state = window.__cf || {};
if (state.mode === undefined)          state.mode = 'view';
if (state.client === undefined)        state.client = null;
if (state.original === undefined)      state.original = null;
if (state.saving === undefined)        state.saving = false;
if (state.error === undefined)         state.error = null;
if (state.duplicate === undefined)     state.duplicate = null;
if (state.dupAck === undefined)        state.dupAck = false;
if (state.addressQuery === undefined)  state.addressQuery = '';
if (state.addressSuggestions === undefined) state.addressSuggestions = [];
if (state.addressLoading === undefined) state.addressLoading = false;
if (state.siretQuery === undefined)    state.siretQuery = '';
if (state.siretSuggestions === undefined) state.siretSuggestions = [];
if (state.siretLoading === undefined)  state.siretLoading = false;
window.__cf = state;

function esc(s) {
  if (s == null) return '';
  return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;').replace(/'/g,'&#39;');
}
function cleanDigits(s) { return s == null ? '' : String(s).replace(/\D/g, ''); }
function cleanEmail(s) { return s == null ? '' : String(s).trim().toLowerCase(); }
function isValidEmail(s) { return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(s).trim()); }
function isValidMobile(s) { const d = cleanDigits(s); return /^(0[67]\d{8}|33[67]\d{8})$/.test(d); }
function isValidFixe(s) { const d = cleanDigits(s); return /^(0[1-589]\d{8}|33[1-589]\d{8})$/.test(d); }
function isSoc() { return state.client && (state.client.idmultivu === 1 || state.client.idmultivu === '1'); }
function clientFullName(c) {
  if (!c) return '';
  const soc = c.idmultivu === 1 || c.idmultivu === '1';
  return soc ? [c.CIVILITE, c.NOM].filter(Boolean).join(' ') : [c.CIVILITE, c.NOM, c.PRENOM].filter(Boolean).join(' ');
}

function _writeVar(varId, value) {
  try { wwLib.wwVariable.updateValue(varId, value); return; }
  catch (e) { console.warn('[cf]', varId, 'failed:', e && e.message); }
  try {
    const w = (wwLib.getFrontWindow && wwLib.getFrontWindow()) || window;
    if (w.variables && Object.prototype.hasOwnProperty.call(w.variables, varId + '-value')) {
      w.variables[varId + '-value'] = value;
    }
  } catch (e) {}
}

async function pushClientHistory(client) {
  if (!client || client.IDVu == null) return;
  if (viewerId == null) return;
  try {
    const supabase = ctx.supabase;
    const { error } = await supabase
      .from('client_view_history')
      .upsert(
        {
          user_id: String(viewerId),
          idvu: Number(client.IDVu),
          viewed_at: new Date().toISOString()
        },
        { onConflict: 'user_id,idvu' }
      );
    if (error) throw error;
    try { window.dispatchEvent(new CustomEvent('oropra-history-updated')); } catch (e) {}
  } catch (e) {
    console.warn('[cf] push history failed:', e && e.message);
  }
}

  async function refreshClientFromDB(idvu) {
    if (idvu == null) return;
    try {
      const supabase = ctx.supabase;
      const { data, error } = await supabase
        .from('CLIENT')
        .select('*')
        .eq('IDVu', idvu)
        .single();
      if (error) throw error;
      if (!data) return;
      if (state.mode === 'edit') return;
      if (!state.client || String(state.client.IDVu) !== String(idvu)) return;
      if (data.NPAI == null || data.NPAI === '') data.NPAI = 'Aucun';
      state.client = JSON.parse(JSON.stringify(data));
      state.original = JSON.parse(JSON.stringify(data));
      _writeVar(SELECTED_CLIENT_VAR_ID, Object.assign({}, data));
      render();
    } catch (e) {
      console.warn('[cf] refresh client failed:', e && e.message);
    }
  }

function loadClient() {
  const v = readVar(SELECTED_CLIENT_VAR_ID);
  if (v && typeof v === 'object' && v.IDVu != null) {
    const cloned = JSON.parse(JSON.stringify(v));
    delete cloned.full_count;
    if (cloned.NPAI == null || cloned.NPAI === '') cloned.NPAI = 'Aucun';
    state.client = cloned;
    state.original = JSON.parse(JSON.stringify(cloned));
    state.mode = 'view';
    state.error = null;
    state.duplicate = null;
    state.addressQuery = '';
    state.addressSuggestions = [];
    state.siretQuery = '';
    state.siretSuggestions = [];
    pushClientHistory(cloned);
    refreshClientFromDB(cloned.IDVu);
  } else {
    state.client = null;
    state.original = null;
  }
}

function enterEdit() {
  state.mode = 'edit';
  state.original = JSON.parse(JSON.stringify(state.client));
  state.error = null;
  state.duplicate = null;
  render();
}

function cancelEdit() {
  state.client = JSON.parse(JSON.stringify(state.original));
  state.mode = 'view';
  state.error = null;
  state.duplicate = null;
  state.addressSuggestions = [];
  state.siretSuggestions = [];
  render();
}

function updateClientField(field, value) {
  if (state.mode !== 'edit' || !state.client) return;
  state.client[field] = value;
}

function validate() {
  const d = state.client;
  const soc = isSoc();
  const errors = [];
  if (soc) {
    if (!cleanDigits(d.SIRET) || cleanDigits(d.SIRET).length !== 14) errors.push('Le SIRET doit comporter 14 chiffres.');
    if (!d.NOM || !String(d.NOM).trim()) errors.push('La raison sociale est obligatoire.');
  } else {
    if (!d.CIVILITE) errors.push('La civilité est obligatoire.');
    if (!d.NOM || !String(d.NOM).trim()) errors.push('Le nom est obligatoire.');
    if (!d.PRENOM || !String(d.PRENOM).trim()) errors.push('Le prénom est obligatoire.');
    if (!d.TEl_MOB) errors.push('Le téléphone portable est obligatoire.');
    else if (!isValidMobile(d.TEl_MOB)) errors.push('Le téléphone portable n\'est pas valide.');
    if (!d.EMAIL) errors.push('L\'email est obligatoire.');
    else if (!isValidEmail(d.EMAIL)) errors.push('L\'email n\'est pas valide.');
  }
  if (d.TEL_FIXE && !isValidFixe(d.TEL_FIXE)) errors.push('Le téléphone fixe n\'est pas valide.');
  if (soc && d.TEl_MOB && !isValidMobile(d.TEl_MOB)) errors.push('Le téléphone portable n\'est pas valide.');
  if (soc && d.EMAIL && !isValidEmail(d.EMAIL)) errors.push('L\'email n\'est pas valide.');
  return errors.length ? errors : null;
}

const DUP_SEUIL_AFFICHAGE = 40;   // en dessous, c'est un homonyme, pas un doublon

const DUP_LIBELLES = {
  siret_identique:      'même SIRET',
  mobile_identique:     'même portable',
  email_identique:      'même e-mail',
  fixe_identique:       'même fixe',
  nom_prenom_exact:     'même nom et prénom',
  nom_prenom_inverses:  'nom et prénom inversés',
  nom_trigram:          'nom très proche',
  naissance_identique:  'même date de naissance',
  naissance_differente: 'dates de naissance différentes',
  insee_identique:      'même commune',
  adresse_trigram:      'adresse très proche',
  email_different:      'e-mails différents',
  nature_differente:    'société contre particulier',
  vin_commun:           'même véhicule'
};
function libelleSignal(k) { return DUP_LIBELLES[k] || k; }

async function checkDuplicates() {
  const d = state.client;
  if (!d) return null;
  const payload = {
    id_client: d.IDVu != null ? String(d.IDVu) : null,
    nom:       d.NOM || null,
    prenom:    d.PRENOM || null,
    mobile:    d.TEl_MOB || null,
    fixe:      d.TEL_FIXE || null,
    email:     d.EMAIL || null,
    cp:        d.code_postal || d.CP_VILLE || null,
    insee:     d.code_insee || null,
    adresse:   d.ADRESSE || null,
    naissance: d.BIRTHDAY || null,
    siret:     d.SIRET != null && d.SIRET !== '' ? String(d.SIRET) : null,
    nature:    (d.idmultivu === 1 || d.idmultivu === '1') ? '1' : '0'
  };
  try {
    const { data, error } = await ctx.supabase.rpc('client_doublons', { p_payload: payload });
    if (error) { console.warn('[cf] client_doublons:', error.message); return null; }
    const retenus = (data && data.candidats ? data.candidats : [])
      .filter(c => (c.score || 0) >= DUP_SEUIL_AFFICHAGE);
    if (!retenus.length) return null;
    return { score: data.score, seuil: data.seuil, candidats: retenus };
  } catch (e) {
    // Une panne du contrôle de doublon ne doit jamais empêcher d'enregistrer.
    console.warn('[cf] doublons indisponibles:', e && e.message);
    return null;
  }
}

function dismissDuplicate() { state.duplicate = null; state.dupAck = false; render(); }

function viewDuplicate(ev) {
  const id = ev && ev.currentTarget && ev.currentTarget.getAttribute('data-cf-idvu');
  if (!id) return;
  _writeVar(SELECTED_CLIENT_VAR_ID, { IDVu: Number(id) });
  loadClient();
  render();
}

// Enregistre malgré l'alerte, et laisse une trace pour l'arbitrage.
async function saveAnyway() {
  const candidats = state.duplicate ? state.duplicate.candidats.slice() : [];
  state.dupAck = true;
  state.duplicate = null;
  await saveEdit();
  if (state.error) return;                       // l'enregistrement a échoué
  const idvu = state.client && state.client.IDVu;
  if (idvu == null) return;
  for (const c of candidats) {
    // Ne jamais se signaler soi-même : la RPC le rejetterait (400).
    if (c.id_client == null || Number(c.id_client) === Number(idvu)) continue;
    try {
      await ctx.supabase.rpc('client_signaler_doublon', {
        p_id_client_entrant:  idvu,
        p_id_client_candidat: c.id_client,
        p_score:  c.score,
        p_detail: c.detail || {}
      });
    } catch (e) { console.warn('[cf] signalement doublon:', e && e.message); }
  }
}

async function saveEdit() {
  const errs = validate();
  if (errs) { state.error = errs.join(' '); state.duplicate = null; render(); return; }
  state.saving = true;
  state.error = null;
  state.duplicate = null;
  render();
  try {
    if (!state.dupAck) {
      const dup = await checkDuplicates();
      if (dup) { state.duplicate = dup; state.saving = false; render(); return; }
    }
    const supabase = ctx.supabase;
    const now = new Date().toISOString();
    const soc = isSoc();
    const payload = Object.assign({}, state.client, {
      UpdateDate: now,
      ID_VENDEUR_UPDATE: viewerId != null ? String(viewerId) : null,
      adresse_checked_at: state.client.adresse_status === 'verified' ? now : state.client.adresse_checked_at,
      CP_VILLE: [state.client.code_postal, state.client.ville].filter(Boolean).join(' ')
    });
    if (payload.TEl_MOB)  payload.TEl_MOB  = cleanDigits(payload.TEl_MOB);
    if (payload.TEL_FIXE) payload.TEL_FIXE = cleanDigits(payload.TEL_FIXE);
    if (payload.EMAIL)    payload.EMAIL    = cleanEmail(payload.EMAIL);
    ['ANNEE_CLIENT_VEHICULE','KM_CLIENT_VEHICULE','KM_MOY','SIRET','adresse_score'].forEach(k => {
      if (payload[k] === '' || payload[k] == null) payload[k] = null;
      else if (k === 'adresse_score') payload[k] = Number(payload[k]);
      else payload[k] = Number(cleanDigits(payload[k])) || null;
    });
    if (payload.BIRTHDAY === '') payload.BIRTHDAY = null;
    delete payload.CreationDate;
    delete payload.ID_VENDEUR_CREATION;
    // Colonnes calculées par la base (normalisation RCU) et colonnes d'état
    // gérées par la fusion : la base refuse qu'on écrive dedans.
    ['nom_norm','prenom_norm','identite_norm','tel_mob_e164','tel_fixe_e164',
     'email_norm','cp5','siret_txt','adresse_norm','statut','merged_into']
      .forEach(k => { delete payload[k]; });
    const idvu = state.client.IDVu;
    delete payload.IDVu;
    const { data: updated, error } = await supabase.from('CLIENT').update(payload).eq('IDVu', idvu).select('*').single();
    if (error) throw error;
    if (soc && payload.SIRET) {
      try {
        await supabase.functions.invoke(EDGE_FN_SIRENE_UPSERT, {
          body: { siret: String(payload.SIRET), idvu: String(idvu), setPrimary: true }
        });
      } catch (eLink) { console.warn('[cf] sirene-upsert failed (non bloquant):', eLink && eLink.message); }
    }
    if (updated.NPAI == null || updated.NPAI === '') updated.NPAI = 'Aucun';
    state.client = JSON.parse(JSON.stringify(updated));
    state.original = JSON.parse(JSON.stringify(updated));
    _writeVar(SELECTED_CLIENT_VAR_ID, Object.assign({}, updated));
    state.mode = 'view';
    state.dupAck = false;
  } catch (e) {
    console.error('[cf] save', e);
    state.error = e.message || String(e);
  } finally {
    state.saving = false;
    render();
  }
}

async function searchAddress(query) {
  const url = `${GEOPF_ENDPOINT}?q=${encodeURIComponent(query)}&limit=8`;
  const r = await fetch(url);
  if (!r.ok) throw new Error('Geocoding failed: ' + r.status);
  const json = await r.json();
  return (json?.features || [])
    .map(f => ({ label: f?.properties?.label || '', value: f?.properties?.id || f?.properties?.banId || '', raw: f }))
    .filter(o => o.label && o.value);
}

let addressDebounce = null;
function onAddressInput(query) {
  state.addressQuery = query;
  state.client.ADRESSE = query;
  state.client.adresse_source = 'manual';
  state.client.adresse_status = null;
  if (!query || query.length < 4) { state.addressSuggestions = []; render(); return; }
  if (addressDebounce) clearTimeout(addressDebounce);
  addressDebounce = setTimeout(async () => {
    state.addressLoading = true;
    render();
    try { state.addressSuggestions = await searchAddress(query); }
    catch (e) { console.error('[cf] address', e); state.addressSuggestions = []; }
    finally { state.addressLoading = false; render(); }
  }, 350);
}

function applyAddressSuggestion(s) {
  const p = (s.raw && s.raw.properties) || {};
  const c = (s.raw && s.raw.geometry && s.raw.geometry.coordinates) || [];
  Object.assign(state.client, {
    ADRESSE: p.name || p.label || '',
    code_postal: p.postcode || '',
    ville: p.city || '',
    code_insee: p.citycode || '',
    lat: c[1] != null ? Number(c[1]) : null,
    lon: c[0] != null ? Number(c[0]) : null,
    adresse_label: p.label || '',
    adresse_source: 'ban',
    adresse_status: 'verified',
    adresse_score: p.score != null ? Number(p.score) : null,
    adresse_ban: s.raw || null
  });
  state.addressSuggestions = [];
  state.addressQuery = p.label || '';
  render();
}

async function searchSirene(query) {
  const supabase = ctx.supabase;
  const qs = new URLSearchParams({ query, limit: '8', activeOnly: 'false' }).toString();
  const { data, error } = await supabase.functions.invoke(`${EDGE_FN_SIRENE_SEARCH}?${qs}`, { method: 'GET' });
  if (error) throw error;
  return (data && data.items) || [];
}

let siretDebounce = null;
function onSiretInput(query) {
  state.siretQuery = query;
  const onlyDigits = cleanDigits(query);
  if (onlyDigits === query.replace(/\s/g, '')) state.client.SIRET = onlyDigits;
  if (!query || query.length < 2) { state.siretSuggestions = []; render(); return; }
  if (siretDebounce) clearTimeout(siretDebounce);
  siretDebounce = setTimeout(async () => {
    state.siretLoading = true;
    render();
    try { state.siretSuggestions = await searchSirene(query); }
    catch (e) { console.error('[cf] siret', e); state.siretSuggestions = []; state.error = e.message || String(e); }
    finally { state.siretLoading = false; render(); }
  }, 400);
}

function applySiretSuggestion(item) {
  const t = typesS.find(x => String(x.code) === String(item.categorie_juridique_code));
  Object.assign(state.client, {
    SIRET: cleanDigits(item.siret),
    NOM: item.raison_sociale || state.client.NOM,
    CIVILITE: t ? t.libelle_court : state.client.CIVILITE,
    ADRESSE: item.adresse_ligne1 || '',
    code_postal: item.code_postal || '',
    ville: item.commune || '',
    adresse_label: item.adresse || '',
    adresse_source: 'sirene',
    adresse_status: 'verified',
    adresse_score: null,
    code_insee: '',
    lat: null,
    lon: null
  });
  state.siretSuggestions = [];
  state.siretQuery = cleanDigits(item.siret);
  state.addressQuery = item.adresse || item.adresse_ligne1 || '';
  render();
}

const ICON_EDIT = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20h9"/><path d="M16.5 3.5a2.12 2.12 0 1 1 3 3L7 19l-4 1 1-4z"/></svg>';
const ICON_CHECK = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
const ICON_WARN = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12" y2="17"/></svg>';
const ICON_P = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/></svg>';

const ICON_CONS_OK = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
const ICON_CONS_ATT = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="9"/><polyline points="12 7 12 12 15 14"/></svg>';
const ICON_CONS_KO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="18" y1="6" x2="6" y2="18"/></svg>';
const ICON_CONS_NUL = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round"><line x1="7" y1="12" x2="17" y2="12"/></svg>';
const ICON_SMS = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>';

const STYLE = `<style>
#oropra-client-fiche{font-family:"Nunito Sans",system-ui,sans-serif;color:#1F4A85}
#oropra-client-fiche *{box-sizing:border-box}
/* barre d'actions */
#oropra-client-fiche .cf-bar{display:flex;justify-content:space-between;align-items:center;gap:12px;margin-bottom:14px;flex-wrap:wrap}
#oropra-client-fiche .cf-bar-meta{font-size:12px;color:#7a98c5}
#oropra-client-fiche .cf-bar-meta b{color:#5a7ba8;font-weight:700}
#oropra-client-fiche .cf-bar-actions{display:flex;gap:8px}
/* cartes */
#oropra-client-fiche .cf-cols{display:grid;grid-template-columns:1fr 1fr;gap:16px;align-items:start}
#oropra-client-fiche .cf-section{background:#fff;border:1px solid #e3edf9;border-radius:14px;padding:16px 18px}
#oropra-client-fiche .cf-section.full{grid-column:1 / -1}
#oropra-client-fiche .cf-section-title{display:flex;align-items:center;justify-content:space-between;gap:8px;font-size:11.5px;text-transform:uppercase;letter-spacing:.06em;color:#7a98c5;margin:0 0 12px;font-weight:800}
#oropra-client-fiche .cf-section.vide .cf-section-title{margin:0}
#oropra-client-fiche .cf-section-vide{font-size:12.5px;color:#9fb3d1;font-weight:600;text-transform:none;letter-spacing:0}
#oropra-client-fiche .cf-grid{display:grid;grid-template-columns:1fr 1fr;gap:12px 16px}
#oropra-client-fiche .cf-grid .full,#oropra-client-fiche .cf-grid .two{grid-column:1 / -1}
#oropra-client-fiche .cf-field{display:flex;flex-direction:column;min-width:0}
#oropra-client-fiche .cf-label{font-size:11px;color:#7a98c5;margin-bottom:3px;font-weight:700}
#oropra-client-fiche .cf-required{color:#e24b4a;margin-left:2px}
#oropra-client-fiche .cf-val{font-size:14px;font-weight:700;color:#1F4A85;line-height:1.35;overflow-wrap:anywhere;min-height:19px}
#oropra-client-fiche .cf-val a{color:#2a5ea9;text-decoration:none}
#oropra-client-fiche .cf-val a:hover{text-decoration:underline}
#oropra-client-fiche .cf-val.multi{white-space:pre-wrap;font-weight:600;font-size:13.5px}
#oropra-client-fiche .cf-vide{color:#c4d2e7;font-weight:600}
#oropra-client-fiche .cf-ok-mini{display:inline-block;font-size:11px;font-weight:800;color:#2f8f77;background:#e9f7f3;border-radius:6px;padding:1px 6px;margin-left:6px;vertical-align:1px}
#oropra-client-fiche .cf-input{border:1.5px solid #d9e3f2;border-radius:9px;padding:9px 11px;font-size:13.5px;font-weight:600;color:#1F4A85;outline:none;background:#fff;font-family:inherit;width:100%}
#oropra-client-fiche .cf-input:focus{border-color:#2a5ea9}
#oropra-client-fiche .cf-input::placeholder{color:#9fb3d1}
#oropra-client-fiche textarea.cf-input{resize:vertical;min-height:70px}
#oropra-client-fiche select.cf-input{cursor:pointer;background-image:url("data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='%237a98c5' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'><polyline points='6 9 12 15 18 9'/></svg>");background-repeat:no-repeat;background-position:right 10px center;background-size:14px;appearance:none;padding-right:32px}
#oropra-client-fiche .cf-checkbox{display:flex;align-items:center;gap:8px;font-size:13.5px;font-weight:700;color:#1F4A85;cursor:pointer;padding:9px 0}
#oropra-client-fiche .cf-checkbox input{accent-color:#e24b4a;width:16px;height:16px}
#oropra-client-fiche .cf-footer{display:flex;justify-content:flex-end;gap:8px;margin-top:16px}
#oropra-client-fiche .cf-btn{padding:9px 16px;border-radius:9px;font-size:13px;font-weight:800;cursor:pointer;border:1.5px solid transparent;outline:none;font-family:inherit;display:inline-flex;align-items:center;gap:6px}
#oropra-client-fiche .cf-btn-primary{background:#2a5ea9;color:#fff;border-color:#2a5ea9}
#oropra-client-fiche .cf-btn-primary:hover{background:#1F4A85;border-color:#1F4A85}
#oropra-client-fiche .cf-btn-primary:disabled{opacity:.6;cursor:wait}
#oropra-client-fiche .cf-btn-save{background:#53bda7;border-color:#53bda7}
#oropra-client-fiche .cf-btn-save:hover{background:#45a791;border-color:#45a791}
#oropra-client-fiche .cf-btn-ghost{background:#fff;color:#2a5ea9;border-color:#d9e3f2}
#oropra-client-fiche .cf-btn-ghost:hover{background:#f2f6fc}
#oropra-client-fiche .cf-error{color:#c43c3b;font-size:13px;font-weight:700;padding:11px 14px;background:#fdf1f1;border-radius:10px;margin-bottom:14px;border:1px solid #f5d0d0}
/* consentements */
#oropra-client-fiche .cs{background:#fff;border:1px solid #e3edf9;border-radius:14px;padding:16px 18px;margin-top:16px}
#oropra-client-fiche .cs-h{display:flex;justify-content:space-between;align-items:baseline;gap:10px;flex-wrap:wrap;margin-bottom:12px}
#oropra-client-fiche .cs-h h3{margin:0;font-size:15px;font-weight:800;color:#1F4A85}
#oropra-client-fiche .cs-h small{font-size:12px;color:#7a98c5;font-weight:600}
#oropra-client-fiche .cs-lien{border:none;background:none;color:#2a5ea9;font:800 12.5px "Nunito Sans",system-ui,sans-serif;cursor:pointer;padding:0}
#oropra-client-fiche .cs-marques{display:grid;grid-template-columns:1fr 1fr;gap:14px;align-items:start}
#oropra-client-fiche .cs-m{border:1.5px solid #e3edf9;border-radius:12px;overflow:hidden;display:flex;flex-direction:column}
#oropra-client-fiche .cs-m-h{display:flex;align-items:center;gap:12px;padding:12px 14px}
#oropra-client-fiche .cs-m-ic{flex:none;width:38px;height:38px;border-radius:50%;display:flex;align-items:center;justify-content:center;color:#fff}
#oropra-client-fiche .cs-m-ic svg{width:20px;height:20px}
#oropra-client-fiche .cs-m-nom{font-size:12px;font-weight:900;letter-spacing:.14em;text-transform:uppercase}
#oropra-client-fiche .cs-m-stat{font-size:15px;font-weight:800;line-height:1.25}
#oropra-client-fiche .cs-m-sub{font-size:12px;font-weight:600;color:#5a7ba8;margin-top:1px}
#oropra-client-fiche .cs-m.ok{border-color:#a9dfd2}
#oropra-client-fiche .cs-m.ok .cs-m-h{background:#eef9f6}
#oropra-client-fiche .cs-m.ok .cs-m-ic{background:#53bda7}
#oropra-client-fiche .cs-m.ok .cs-m-nom,#oropra-client-fiche .cs-m.ok .cs-m-stat{color:#2f8f77}
#oropra-client-fiche .cs-m.att{border-color:#f1d79b}
#oropra-client-fiche .cs-m.att .cs-m-h{background:#fdf6e4}
#oropra-client-fiche .cs-m.att .cs-m-ic{background:#e6a817}
#oropra-client-fiche .cs-m.att .cs-m-nom,#oropra-client-fiche .cs-m.att .cs-m-stat{color:#a8740a}
#oropra-client-fiche .cs-m.ko{border-color:#f2c4c4}
#oropra-client-fiche .cs-m.ko .cs-m-h{background:#fdf1f1}
#oropra-client-fiche .cs-m.ko .cs-m-ic{background:#e24b4a}
#oropra-client-fiche .cs-m.ko .cs-m-nom,#oropra-client-fiche .cs-m.ko .cs-m-stat{color:#c43c3b}
#oropra-client-fiche .cs-m.mix{border-color:#c9daf0}
#oropra-client-fiche .cs-m.mix .cs-m-h{background:#f2f6fc}
#oropra-client-fiche .cs-m.mix .cs-m-ic{background:#2a5ea9}
#oropra-client-fiche .cs-m.mix .cs-m-nom,#oropra-client-fiche .cs-m.mix .cs-m-stat{color:#1F4A85}
#oropra-client-fiche .cs-m.nul .cs-m-h{background:#f7faff}
#oropra-client-fiche .cs-m.nul .cs-m-ic{background:#c4d2e7}
#oropra-client-fiche .cs-m.nul .cs-m-nom,#oropra-client-fiche .cs-m.nul .cs-m-stat{color:#7a98c5}
#oropra-client-fiche .cs-canaux{display:grid;grid-template-columns:repeat(4,1fr);gap:6px;padding:10px 12px 12px}
#oropra-client-fiche .cs-c{display:flex;align-items:center;gap:6px;border-radius:8px;padding:6px 8px;font-size:12px;font-weight:700;min-width:0}
#oropra-client-fiche .cs-c span{overflow:hidden;text-overflow:ellipsis;white-space:nowrap}
#oropra-client-fiche .cs-c svg{flex:none;width:13px;height:13px}
#oropra-client-fiche .cs-c.consenti{background:#e9f7f3;color:#2f8f77}
#oropra-client-fiche .cs-c.attente{background:#fdf5e1;color:#a8740a}
#oropra-client-fiche .cs-c.refuse{background:#fdf1f1;color:#c43c3b}
#oropra-client-fiche .cs-c.inconnu{background:#f4f7fc;color:#9fb3d1}
#oropra-client-fiche .cs-act{display:flex;align-items:center;justify-content:space-between;gap:10px;flex-wrap:wrap;border-top:1px solid #eef3fa;padding:10px 12px;margin-top:auto}
#oropra-client-fiche .cs-act p{margin:0;font-size:12px;color:#7a98c5;font-weight:600;flex:1;min-width:160px}
#oropra-client-fiche .cs-act .cf-btn{padding:7px 12px;font-size:12.5px}
#oropra-client-fiche .cs-pied{display:flex;flex-wrap:wrap;gap:8px;margin-top:12px}
#oropra-client-fiche .cs-pill{display:inline-flex;align-items:center;gap:6px;border-radius:999px;padding:5px 11px;font-size:12px;font-weight:700;background:#f2f6fc;color:#5a7ba8}
#oropra-client-fiche .cs-pill b{font-weight:800;color:#1F4A85}
#oropra-client-fiche .cs-pill.rouge{background:#fdf1f1;color:#c43c3b}
#oropra-client-fiche .cs-pill.rouge b{color:#c43c3b}
#oropra-client-fiche .cs-pill.vert b{color:#2f8f77}
#oropra-client-fiche .cs-edit{display:grid;grid-template-columns:1fr 1fr;gap:12px 16px;margin-top:12px;padding-top:12px;border-top:1px solid #eef3fa}
#oropra-client-fiche .cs-charge{font-size:13px;color:#7a98c5;font-weight:600;padding:8px 0}
/* doublons */
#oropra-client-fiche .cf-duplicate{background:#fff8e8;border:1.5px solid #f3dca6;border-radius:12px;padding:16px;margin-bottom:16px;display:flex;flex-direction:column;gap:12px}
#oropra-client-fiche .cf-duplicate-head{display:flex;gap:10px;align-items:flex-start;color:#a8740a}
#oropra-client-fiche .cf-duplicate-title{font-size:14px;font-weight:800;margin-bottom:4px;color:#1F4A85}
#oropra-client-fiche .cf-duplicate-sub{font-size:12.5px;color:#a8740a}
#oropra-client-fiche .cf-dup-card{background:#fff;border:1px solid #f0d9b5;border-radius:10px;padding:10px 12px;display:flex;flex-direction:column;gap:6px}
#oropra-client-fiche .cf-dup-card-head{display:flex;justify-content:space-between;align-items:center;gap:10px}
#oropra-client-fiche .cf-dup-card-head strong{font-size:14px;color:#1F4A85}
#oropra-client-fiche .cf-dup-score{font-size:12px;font-weight:800;color:#a8740a;border:1px solid #e8b877;border-radius:6px;padding:1px 7px;white-space:nowrap}
#oropra-client-fiche .cf-dup-card-body{font-size:12.5px;color:#5a7ba8}
#oropra-client-fiche .cf-dup-veh{color:#2a5ea9;font-weight:700}
#oropra-client-fiche .cf-dup-tags{display:flex;flex-wrap:wrap;gap:5px}
#oropra-client-fiche .cf-dup-tag{font-size:11px;font-weight:700;background:#fdf3e3;color:#a8740a;border-radius:5px;padding:2px 7px}
#oropra-client-fiche .cf-dup-open{align-self:flex-start;font-size:12px;padding:5px 10px}
#oropra-client-fiche .cf-duplicate-actions{display:flex;gap:8px;justify-content:flex-end}
/* autocomplétion */
#oropra-client-fiche .cf-autocomplete-wrap{position:relative}
#oropra-client-fiche .cf-suggestions{position:absolute;top:calc(100% + 4px);left:0;right:0;background:#fff;border:1px solid #d9e3f2;border-radius:10px;box-shadow:0 10px 28px rgba(31,74,133,.16);z-index:10;max-height:280px;overflow-y:auto}
#oropra-client-fiche .cf-suggestion{padding:10px 12px;cursor:pointer;font-size:13px;color:#1F4A85;border-bottom:1px solid #f0f4fa}
#oropra-client-fiche .cf-suggestion:last-child{border-bottom:none}
#oropra-client-fiche .cf-suggestion:hover{background:#f2f6fc}
#oropra-client-fiche .cf-suggestion.is-inactive,#oropra-client-fiche .cf-suggestion.is-inactive .cf-suggestion-sub{font-style:italic;color:#c4d2e7}
#oropra-client-fiche .cf-suggestion-sub{font-size:11px;color:#7a98c5;margin-top:2px}
#oropra-client-fiche .cf-field-status{font-size:11.5px;font-weight:700;color:#2f8f77;margin-top:4px;display:inline-flex;align-items:center;gap:4px}
#oropra-client-fiche .cf-spinner{display:inline-block;width:12px;height:12px;border:2px solid #e3edf9;border-top-color:#53bda7;border-radius:50%;animation:cf-spin .8s linear infinite}
@keyframes cf-spin{to{transform:rotate(360deg)}}
#oropra-client-fiche .cf-empty{padding:48px 16px;text-align:center;color:#7a98c5;font-size:13px}
@media (max-width:900px){
  #oropra-client-fiche .cf-cols,#oropra-client-fiche .cs-marques{grid-template-columns:1fr}
}
@media (max-width:560px){
  #oropra-client-fiche .cf-grid,#oropra-client-fiche .cs-edit{grid-template-columns:1fr}
  #oropra-client-fiche .cs-canaux{grid-template-columns:1fr 1fr}
  #oropra-client-fiche .cf-section,#oropra-client-fiche .cs{padding:14px}
  #oropra-client-fiche .cf-footer .cf-btn,#oropra-client-fiche .cf-duplicate-actions .cf-btn{flex:1;justify-content:center}
}
</style>`;

// ---------------------------------------------------------------- affichage
function telLisible(t) {
  const d = cleanDigits(t);
  if (/^0\d{9}$/.test(d)) return d.replace(/(\d{2})(?=\d)/g, '$1 ');
  if (/^33\d{9}$/.test(d)) return '+33 ' + d.slice(2).replace(/(\d)(\d{2})(\d{2})(\d{2})(\d{2})/, '$1 $2 $3 $4 $5');
  return String(t);
}
function dateFr(v) {
  if (!v || String(v).slice(0, 4) === '1900') return '';
  const s = String(v);
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) { const p = s.split('-'); return p[2] + '/' + p[1] + '/' + p[0]; }
  const d = new Date(s); if (isNaN(d.getTime())) return s;
  return d.toLocaleDateString('fr-FR');
}
function dateHeureFr(v) {
  if (!v) return '';
  const d = new Date(v); if (isNaN(d.getTime())) return String(v);
  return d.toLocaleDateString('fr-FR') + ' à ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h');
}
function vide(v) { return v == null || String(v).trim() === ''; }
function valeurLue(field, type, opts, v) {
  if (type === 'checkbox') return v ? 'Oui' : 'Non';
  if (vide(v)) return '<span class="cf-vide">—</span>';
  if (type === 'select') {
    const o = (opts.options || []).find(x => String(x.value) === String(v));
    return esc(o ? o.label : v);
  }
  if (field === 'TEl_MOB' || field === 'TEL_FIXE') return `<a href="tel:${esc(cleanDigits(v))}">${esc(telLisible(v))}</a>`;
  if (field === 'EMAIL') return `<a href="mailto:${esc(v)}">${esc(v)}</a>`;
  if (type === 'date') return esc(dateFr(v));
  if (type === 'number' && /^\d+$/.test(String(v))) return esc(Number(v).toLocaleString('fr-FR'));
  return esc(v);
}

function fieldInput(label, field, type, opts) {
  opts = opts || {};
  const val = state.client[field];
  const v = val == null ? '' : val;
  const editable = state.mode === 'edit';
  const cls = opts.gridClass ? `cf-field ${opts.gridClass}` : 'cf-field';
  if (!editable) {
    return `<div class="${cls}"><span class="cf-label">${esc(label)}</span><div class="cf-val${type === 'textarea' ? ' multi' : ''}">${valeurLue(field, type, opts, val)}</div></div>`;
  }
  const reqMark = opts.required ? ' <span class="cf-required">*</span>' : '';
  let inputHtml;
  if (type === 'textarea') {
    inputHtml = `<textarea class="cf-input" data-cf-field="${esc(field)}" rows="3">${esc(v)}</textarea>`;
  } else if (type === 'select') {
    // Filet d'affichage (v9) : une valeur hors référentiel reste visible.
    let liste = (opts.options || []).slice();
    if (v != null && String(v) !== '' && !liste.some(o => String(o.value) === String(v))) {
      const cle = s => String(s == null ? '' : s).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');
      const proche = liste.filter(o => cle(o.value) === cle(v) || cle(o.label) === cle(v))[0];
      liste = liste.concat([{ value: v, label: proche ? proche.label : String(v) }]);
    }
    const options = liste.map(o => `<option value="${esc(o.value)}"${String(o.value) === String(v) ? ' selected' : ''}>${esc(o.label)}</option>`).join('');
    const ph = opts.noPlaceholder ? '' : '<option value="">— Sélectionner —</option>';
    inputHtml = `<select class="cf-input" data-cf-field="${esc(field)}">${ph}${options}</select>`;
  } else if (type === 'checkbox') {
    return `<div class="${cls}"><span class="cf-label">${esc(label)}</span><label class="cf-checkbox"><input type="checkbox" data-cf-field="${esc(field)}"${v ? ' checked' : ''}/> <span>${esc(opts.texte || label)}</span></label></div>`;
  } else {
    inputHtml = `<input class="cf-input" type="${type || 'text'}" data-cf-field="${esc(field)}" value="${esc(v)}"/>`;
  }
  return `<div class="${cls}"><label class="cf-label">${esc(label)}${reqMark}</label>${inputHtml}</div>`;
}

function renderSiretField() {
  if (state.mode === 'view') return fieldInput('SIRET', 'SIRET', 'text', { gridClass: 'two' });
  let h = '<div class="cf-field two"><label class="cf-label">SIRET / SIREN / Raison sociale <span class="cf-required">*</span></label>';
  h += '<div class="cf-autocomplete-wrap">';
  h += `<input class="cf-input" type="text" data-cf-field="__siretQuery" value="${esc(state.siretQuery || state.client.SIRET || '')}" placeholder="Rechercher dans SIRENE" autocomplete="off"/>`;
  if (state.siretLoading) h += '<div class="cf-field-status"><span class="cf-spinner"></span> Recherche SIRENE…</div>';
  if (state.siretSuggestions && state.siretSuggestions.length) {
    h += '<div class="cf-suggestions">';
    state.siretSuggestions.forEach((s, i) => {
      const inactive = s.statut && s.statut !== 'ACTIF';
      h += `<div class="cf-suggestion${inactive ? ' is-inactive' : ''}" data-cf-action="pick-siret" data-idx="${i}">
        <div><strong>${esc(s.raison_sociale || '(sans dénomination)')}</strong></div>
        <div class="cf-suggestion-sub">${esc(s.siret || '')} — ${esc(s.commune || '')} — ${esc(s.statut || '')}</div>
      </div>`;
    });
    h += '</div>';
  }
  h += '</div></div>';
  return h;
}

function renderAddressField() {
  if (state.mode === 'view') {
    const c = state.client;
    const ligne = [c.ADRESSE, [c.code_postal, c.ville].filter(Boolean).join(' ')].filter(x => !vide(x)).join(', ');
    const ok = c.adresse_status === 'verified' ? '<span class="cf-ok-mini">✓ vérifiée</span>' : '';
    return `<div class="cf-field full"><span class="cf-label">Adresse</span><div class="cf-val">${ligne ? esc(ligne) + ok : '<span class="cf-vide">—</span>'}</div></div>`;
  }
  const verified = state.client.adresse_status === 'verified';
  let h = '<div class="cf-field full"><label class="cf-label">Adresse</label>';
  h += '<div class="cf-autocomplete-wrap">';
  h += `<input class="cf-input" type="text" data-cf-field="__addressQuery" value="${esc(state.addressQuery || state.client.ADRESSE || '')}" placeholder="Tapez une adresse" autocomplete="off"/>`;
  if (state.addressLoading) h += '<div class="cf-field-status"><span class="cf-spinner"></span> Recherche…</div>';
  else if (verified) h += `<div class="cf-field-status">✓ Adresse vérifiée${state.client.adresse_source ? ' (' + esc(state.client.adresse_source) + ')' : ''}</div>`;
  if (state.addressSuggestions && state.addressSuggestions.length) {
    h += '<div class="cf-suggestions">';
    state.addressSuggestions.forEach((s, i) => {
      h += `<div class="cf-suggestion" data-cf-action="pick-address" data-idx="${i}">${esc(s.label || '')}</div>`;
    });
    h += '</div>';
  }
  h += '</div></div>';
  return h;
}

function renderDuplicateBlock() {
  if (!state.duplicate) return '';
  const cands = state.duplicate.candidats || [];
  if (!cands.length) return '';
  const pluriel = cands.length > 1;
  const cartes = cands.map(c => {
    const a = c.apercu || {};
    const nom = [a.civilite, a.nom, a.societe ? '' : a.prenom].filter(Boolean).join(' ');
    const signaux = Object.keys(c.detail || {})
      .filter(k => (c.detail[k] || 0) > 0)
      .map(k => `<span class="cf-dup-tag">${esc(libelleSignal(k))}</span>`)
      .join('');
    const lieu = [a.code_postal, a.ville].filter(Boolean).join(' ');
    const contact = [a.mobile, a.email].filter(Boolean).join(' · ');
    const veh = a.vehicules > 0 ? `<span class="cf-dup-veh">${esc(a.vehicules)} véhicule${a.vehicules > 1 ? 's' : ''}</span>` : '';
    return `<div class="cf-dup-card">
      <div class="cf-dup-card-head"><strong>${esc(nom)}</strong><span class="cf-dup-score">${esc(c.score)}/100</span></div>
      <div class="cf-dup-card-body">${esc(lieu)}${lieu && contact ? ' — ' : ''}${esc(contact)} ${veh}</div>
      <div class="cf-dup-tags">${signaux}</div>
      <button class="cf-btn cf-btn-ghost cf-dup-open" data-cf-action="view-duplicate" data-cf-idvu="${esc(c.id_client)}">${ICON_P}<span>Ouvrir cette fiche</span></button>
    </div>`;
  }).join('');
  return `<div class="cf-duplicate">
    <div class="cf-duplicate-head">${ICON_WARN}<div>
      <div class="cf-duplicate-title">${pluriel ? 'Ces clients existent' : 'Ce client existe'} peut-être déjà</div>
      <div class="cf-duplicate-sub">Vous pouvez enregistrer sans choisir : un administrateur vérifiera.</div>
    </div></div>
    ${cartes}
    <div class="cf-duplicate-actions">
      <button class="cf-btn cf-btn-ghost" data-cf-action="dismiss-duplicate">Modifier ma saisie</button>
      <button class="cf-btn cf-btn-primary cf-btn-save" data-cf-action="save-anyway"${state.saving ? ' disabled' : ''}>Enregistrer quand même</button>
    </div>
  </div>`;
}

// Une carte : en lecture, si tous ses champs sont vides, elle se réduit à
// une ligne « Non renseigné » (le vendeur ne lit pas des cases vides).
function carte(titre, champs, html, opts) {
  opts = opts || {};
  const c = state.client;
  const toutVide = state.mode === 'view' && champs.length && champs.every(f => vide(c[f]));
  if (toutVide) return `<div class="cf-section vide${opts.full ? ' full' : ''}"><div class="cf-section-title">${esc(titre)}<span class="cf-section-vide">Non renseigné</span></div></div>`;
  return `<div class="cf-section${opts.full ? ' full' : ''}"><div class="cf-section-title">${esc(titre)}</div><div class="cf-grid">${html}</div></div>`;
}

function boutonsActions() {
  if (state.mode === 'view') return `<button class="cf-btn cf-btn-primary" data-cf-action="enter-edit">${ICON_EDIT}<span>Modifier la fiche</span></button>`;
  return `<button class="cf-btn cf-btn-ghost" data-cf-action="cancel-edit">Annuler</button>` +
    `<button class="cf-btn cf-btn-primary cf-btn-save" data-cf-action="save-edit"${state.saving ? ' disabled' : ''}>${state.saving ? '<span class="cf-spinner"></span>' : ICON_CHECK}<span>${state.saving ? 'Enregistrement…' : 'Enregistrer'}</span></button>`;
}

function render() {
  const root = getRoot();
  if (!root) return;
  if (!state.client) { root.innerHTML = STYLE + '<div class="cf-empty">Aucun client sélectionné.</div>'; return; }

  const active = doc.activeElement;
  const activeAttr = active && active.getAttribute ? active.getAttribute('data-cf-field') : null;
  const activeCursor = activeAttr && typeof active.selectionStart === 'number' ? active.selectionStart : null;

  const soc = isSoc();
  const c = state.client;
  let body = '';

  const meta = [];
  if (c.CreationDate) meta.push('Créée le <b>' + esc(dateFr(c.CreationDate)) + '</b>');
  if (c.UpdateDate) meta.push('modifiée le <b>' + esc(dateFr(c.UpdateDate)) + '</b>');
  body += `<div class="cf-bar"><div class="cf-bar-meta">${state.mode === 'edit' ? '<b>Modification de la fiche</b>' : meta.join(' · ')}</div><div class="cf-bar-actions">${boutonsActions()}</div></div>`;

  body += renderDuplicateBlock();
  if (state.error && !state.duplicate) body += `<div class="cf-error">${esc(state.error)}</div>`;

  body += '<div class="cf-cols">';
  if (soc) {
    body += carte('Identité', [], fieldInput('Type', 'CIVILITE', 'select', { options: typesS.map(t => ({ value: t.libelle_court, label: `${t.libelle_court} — ${t.libelle}` })) }) +
      renderSiretField() + fieldInput('Raison sociale', 'NOM', 'text', { gridClass: 'full', required: true }));
  } else {
    body += carte('Identité', [],
      fieldInput('Civilité', 'CIVILITE', 'select', { options: civilitesP.map(x => ({ value: x.libelle_court, label: x.libelle })), required: true }) +
      fieldInput('Date de naissance', 'BIRTHDAY', 'date') +
      fieldInput('Prénom', 'PRENOM', 'text', { required: true }) +
      fieldInput('Nom', 'NOM', 'text', { required: true }));
  }
  body += carte('Contact', [],
    fieldInput('Portable', 'TEl_MOB', 'text', { required: !soc }) +
    fieldInput('Fixe', 'TEL_FIXE') +
    fieldInput('E-mail', 'EMAIL', 'text', { required: !soc, gridClass: 'full' }));
  body += carte('Adresse', ['ADRESSE', 'code_postal', 'ville'],
    renderAddressField() + (state.mode === 'edit' ? fieldInput('Code postal', 'code_postal') + fieldInput('Ville', 'ville') : ''));
  if (!soc) {
    body += carte('Profil', ['CSP', 'PROFESSION', 'LOISIR'],
      fieldInput('CSP', 'CSP') + fieldInput('Profession', 'PROFESSION') + fieldInput('Loisir', 'LOISIR', 'text', { gridClass: 'full' }));
    body += carte('Véhicule actuel (déclaré)', ['MARQUE_CLIENT_VEHICULE', 'MODELE_CLIENT_VEHICULE', 'ANNEE_CLIENT_VEHICULE', 'KM_CLIENT_VEHICULE', 'KM_MOY'],
      fieldInput('Marque', 'MARQUE_CLIENT_VEHICULE') + fieldInput('Modèle', 'MODELE_CLIENT_VEHICULE') +
      fieldInput('Année', 'ANNEE_CLIENT_VEHICULE', 'number') + fieldInput('Kilométrage', 'KM_CLIENT_VEHICULE', 'number') +
      fieldInput('Km par an', 'KM_MOY', 'number'));
  }
  body += carte('Commentaires', ['COMMENTAIRE'], fieldInput('Commentaires', 'COMMENTAIRE', 'textarea', { gridClass: 'full' }), { full: soc });
  body += '</div>';

  // Consentements : en bas de fiche, toujours dépliés (rempli par peindreConsent).
  if (!soc) body += '<div class="cs" id="cf-consent"><div class="cs-charge">Chargement des consentements…</div></div>';

  if (state.mode === 'edit') body += `<div class="cf-footer">${boutonsActions()}</div>`;

  root.innerHTML = STYLE + body;
  bindEvents();
  if (!soc) peindreConsent();

  if (activeAttr) {
    const next = root.querySelector(`[data-cf-field="${activeAttr}"]`);
    if (next) { next.focus(); if (activeCursor != null && next.setSelectionRange) try { next.setSelectionRange(activeCursor, activeCursor); } catch (e) {} }
  }
}

// ---------------------------------------------------------------- consentements
// v11 : synthèse par marque (client_consentement_synthese) + détail ligne à
// ligne (client_consentement), chargés une fois par client.
const CONSENT_CACHE = {};
const CONSENT_EN_COURS = {};
function chargerConsent(idvu, forcer) {
  if (idvu == null) return Promise.resolve(null);
  if (!forcer && CONSENT_CACHE[idvu]) return Promise.resolve(CONSENT_CACHE[idvu]);
  if (!forcer && CONSENT_EN_COURS[idvu]) return CONSENT_EN_COURS[idvu];
  const p = lireConsent(idvu).finally(() => { if (CONSENT_EN_COURS[idvu] === p) delete CONSENT_EN_COURS[idvu]; });
  CONSENT_EN_COURS[idvu] = p;
  return p;
}
async function lireConsent(idvu) {
  const res = { synth: null, rows: [] };
  try {
    const [a, b] = await Promise.all([
      ctx.supabase.rpc('client_consentement_synthese', { p_id_client: Number(idvu) }),
      ctx.supabase.from('client_consentement').select('*').eq('id_client', Number(idvu))
    ]);
    res.synth = (a && !a.error && a.data) || null;
    res.rows = (b && b.data) || [];
  } catch (e) {}
  CONSENT_CACHE[idvu] = res;
  return res;
}
const CANAUX_CONSENT = [['emails', 'E-mails'], ['sms', 'SMS'], ['calls', 'Appels'], ['mailings', 'Courriers'], ['newsletters', 'Newsletters'], ['offers_events', 'Offres & évén.'], ['reminders', 'Rappels'], ['market_research', 'Études']];
const CANAUX_LONG = { offers_events: 'Offres & événements', market_research: 'Études de marché' };
function iconeEtat(e) { return e === 'consenti' ? ICON_CONS_OK : e === 'attente' ? ICON_CONS_ATT : e === 'refuse' ? ICON_CONS_KO : ICON_CONS_NUL; }
function libEtat(e) { return e === 'consenti' ? 'Consenti' : e === 'attente' ? 'En attente' : e === 'refuse' ? 'Refusé' : 'Inconnu'; }

function carteMarque(m, synth) {
  const cls = { consenti: 'ok', attente: 'att', refuse: 'ko', partiel: 'mix', aucun: 'nul' }[m.statut] || 'nul';
  const ic = { consenti: ICON_CONS_OK, attente: ICON_CONS_ATT, refuse: ICON_CONS_KO, partiel: ICON_CONS_OK, aucun: ICON_CONS_NUL }[m.statut] || ICON_CONS_NUL;
  let stat, sub;
  if (m.statut === 'consenti') { stat = 'Consenti sur les ' + m.total + ' canaux'; sub = m.date_decision ? 'Réponse du client le ' + dateFr(m.date_decision) : 'Réponse du client enregistrée'; }
  else if (m.statut === 'refuse') { stat = 'Refusé sur tous les canaux'; sub = m.date_decision ? 'Réponse du client le ' + dateFr(m.date_decision) : ''; }
  else if (m.statut === 'partiel') { stat = 'Consenti sur ' + m.consenti + ' canal' + (m.consenti > 1 ? 'aux' : '') + ' sur ' + m.total; sub = [m.refuse ? m.refuse + ' refusé' + (m.refuse > 1 ? 's' : '') : '', m.attente ? m.attente + ' sans réponse' : '', m.date_decision ? 'réponse du ' + dateFr(m.date_decision) : ''].filter(Boolean).join(' · '); }
  else if (m.statut === 'attente') { stat = 'En attente de réponse'; sub = m.demande_le ? 'Demande envoyée le ' + dateHeureFr(m.demande_le) : 'Aucune demande envoyée depuis One Data'; }
  else { stat = 'Aucun consentement connu'; sub = 'Rien dans BACS pour ' + m.libelle; }

  const canaux = CANAUX_CONSENT.map(c => {
    const e = (m.canaux || {})[c[0]] || 'inconnu';
    return `<div class="cs-c ${e}" title="${esc((CANAUX_LONG[c[0]] || c[1]) + ' : ' + libEtat(e))}">${iconeEtat(e)}<span>${esc(c[1])}</span></div>`;
  }).join('');

  let act = '';
  if (m.statut !== 'consenti' && !synth.sans_bacs) {
    let note = '';
    if (m.possible) note = m.demande_le ? 'Relancer : le client reçoit un nouveau SMS.' : 'Le client reçoit un SMS et choisit lui-même.';
    else if (m.motif === 'sans_portable') note = 'Pas de portable : la demande part par SMS.';
    else if (m.motif === 'compte_absent') note = 'Pas encore de compte BACS pour ce client.';
    else if (m.motif === 'extension') note = 'Demande depuis One Data : extension BACS 3.3.4 requise. Sinon, bouton « Demande du Consentement ' + m.libelle + ' » dans BACS.';
    act = `<div class="cs-act"><p>${esc(note)}</p>` +
      (m.possible ? `<button type="button" class="cf-btn cf-btn-primary" data-cs-demander="${esc(m.marque)}" data-cs-site="${esc(m.id_site)}">${ICON_SMS}<span>${m.demande_le ? 'Relancer la demande' : 'Demander le consentement'}</span></button>` : '') +
      `</div>`;
  }
  return `<div class="cs-m ${cls}">
    <div class="cs-m-h"><div class="cs-m-ic">${ic}</div><div><div class="cs-m-nom">${esc(m.libelle)}</div><div class="cs-m-stat">${esc(stat)}</div>${sub ? `<div class="cs-m-sub">${esc(sub)}</div>` : ''}</div></div>
    <div class="cs-canaux">${canaux}</div>${act}</div>`;
}

async function peindreConsent(forcer) {
  const root = getRoot(); if (!root) return;
  const idvu = state.client && state.client.IDVu;
  const data = (!forcer && CONSENT_CACHE[idvu]) || await chargerConsent(idvu, forcer);
  const z = root.querySelector('#cf-consent');
  if (!z || !state.client || String(state.client.IDVu) !== String(idvu)) return;
  const s = data && data.synth;
  const c = state.client;
  const relit = s && s.relecture && s.relecture.le && (Date.now() - new Date(s.relecture.le).getTime()) < 10 * 60000;
  let h = '<div class="cs-h"><h3>Consentements RGPD</h3><small>' +
    (relit ? '<span class="cf-spinner" style="vertical-align:-2px;margin-right:5px"></span>Relecture du compte BACS en cours · ' : '') +
    (s && s.maj ? 'Reflétés de BACS · à jour au ' + esc(dateHeureFr(s.maj)) : 'Reflétés de BACS') +
    ' · <button type="button" class="cs-lien" data-cs-detail>Voir le détail</button></small></div>';
  if (!s) h += '<div class="cs-charge">Consentements indisponibles pour le moment.</div>';
  else h += '<div class="cs-marques">' + (s.marques || []).map(m => carteMarque(m, s)).join('') + '</div>';

  // Autres freins à la prise de contact, sur la même ligne.
  const pills = [];
  if (s && s.bloctel) {
    pills.push(`<span class="cs-pill${s.bloctel.mobile ? ' rouge' : ' vert'}">Bloctel mobile <b>${s.bloctel.mobile ? 'inscrit' : 'libre'}</b></span>`);
    pills.push(`<span class="cs-pill${s.bloctel.fixe ? ' rouge' : ' vert'}">Bloctel fixe <b>${s.bloctel.fixe ? 'inscrit' : 'libre'}</b></span>`);
  }
  if (!isSoc()) {
    pills.push(`<span class="cs-pill${c.STOP_COM ? ' rouge' : ' vert'}">Stop com <b>${c.STOP_COM ? 'OUI — ne plus solliciter' : 'non'}</b></span>`);
    const npai = c.NPAI || 'Aucun';
    pills.push(`<span class="cs-pill${npai !== 'Aucun' ? ' rouge' : ' vert'}">NPAI <b>${esc(npai)}</b></span>`);
  }
  if (pills.length) h += '<div class="cs-pied">' + pills.join('') + '</div>';
  if (state.mode === 'edit' && !isSoc()) {
    h += '<div class="cs-edit">' +
      fieldInput('Stop com', 'STOP_COM', 'checkbox', { texte: 'Le client ne veut plus être sollicité' }) +
      fieldInput('NPAI', 'NPAI', 'select', { options: npaiOptions.map(o => ({ value: o, label: o })), noPlaceholder: true }) + '</div>';
  }
  z.innerHTML = h;
  z.querySelectorAll('[data-cf-field]').forEach(lierChamp);
  const det = z.querySelector('[data-cs-detail]'); if (det) det.addEventListener('click', openConsentModal);
  z.querySelectorAll('[data-cs-demander]').forEach(b => b.addEventListener('click', () => demanderConsent(b.getAttribute('data-cs-site'))));
  relireSiBesoin(idvu, s);
}

// v11 : une marque pas encore « consenti » -> le compte BACS est relu (geste
// compte_relire, extension 3.3.4), au plus une fois toutes les 30 min par
// client ; la fiche se met à jour quand la réponse redescend.
const RELU = {};
let suiviRelecture = null;
async function relireSiBesoin(idvu, s) {
  if (idvu == null || !s || s.sans_bacs || !s.compte || RELU[idvu]) return;
  if (!(s.marques || []).some(m => m.statut !== 'consenti')) return;
  RELU[idvu] = true;
  let r = null;
  try { const x = await ctx.supabase.rpc('client_consentement_relire', { p_id_client: Number(idvu) }); r = x && x.data; } catch (e) {}
  if (!r || !(r.programmee || r.motif === 'recente')) return;
  if (r.programmee) peindreConsent(true);
  suivreRelecture(idvu, s.maj);
}
function suivreRelecture(idvu, majAvant) {
  if (suiviRelecture) clearInterval(suiviRelecture);
  let tours = 0;
  suiviRelecture = setInterval(async () => {
    tours++;
    if (!state.client || String(state.client.IDVu) !== String(idvu) || tours > 12) { clearInterval(suiviRelecture); suiviRelecture = null; return; }
    const d = await chargerConsent(idvu, true);
    const s2 = d && d.synth;
    const fini = !s2 || !s2.relecture || (s2.maj && s2.maj !== majAvant);
    if (fini) { clearInterval(suiviRelecture); suiviRelecture = null; }
    if (fini || tours === 1) peindreConsent();
  }, 20000);
}

function chargerBacsClient() {
  const W = (wwLib.getFrontWindow && wwLib.getFrontWindow()) || window;
  return new Promise(ok => {
    if (W.oropraBacsClient) return ok(W.oropraBacsClient);
    const d = W.document || doc;
    const sc = d.createElement('script');
    sc.src = 'https://cdn.jsdelivr.net/gh/oropra-apps/one-data-blocs@oropra-bacs-client-v5/oropra-bacs-client.js'; sc.async = true;
    sc.onload = () => ok(W.oropraBacsClient || null);
    sc.onerror = () => ok(null);
    (d.head || d.documentElement).appendChild(sc);
  });
}
async function demanderConsent(idSite) {
  const idvu = state.client && state.client.IDVu;
  if (idvu == null) return;
  const obc = await chargerBacsClient();
  if (!obc || !obc.consentement || (obc.version || 0) < 4) {
    alerteInline('Module BACS indisponible : rechargez la page (Ctrl+F5) et réessayez.');
    return;
  }
  try { await obc.consentement(ctx.supabase, idvu, idSite ? Number(idSite) : null); } catch (e) {}
  peindreConsent(true);
}
function alerteInline(msg) {
  const z = getRoot() && getRoot().querySelector('#cf-consent');
  if (!z) return;
  const d = doc.createElement('div'); d.className = 'cf-error'; d.style.margin = '10px 0 0'; d.textContent = msg;
  z.appendChild(d);
}

async function openConsentModal() {
  const idvu = state.client && state.client.IDVu;
  if (idvu == null) return;
  const cl = state.client || {};
  const ov = doc.createElement('div');
  ov.style.cssText = 'position:fixed;inset:0;z-index:3000;display:flex;align-items:flex-start;justify-content:center;padding:24px 16px;background:rgba(31,74,133,.45);overflow-y:auto;font-family:"Nunito Sans",system-ui,sans-serif';
  const modal = doc.createElement('div');
  modal.style.cssText = 'background:#fff;border-radius:16px;width:100%;max-width:720px;box-shadow:0 30px 80px rgba(31,74,133,.35);margin:auto;position:relative;padding:22px;color:#1F4A85';
  modal.innerHTML = '<div style="color:#7a98c5;padding:24px;text-align:center">Chargement des consentements…</div>';
  ov.appendChild(modal); doc.body.appendChild(ov);
  const fermer = () => { try { ov.remove(); } catch (e) {} doc.removeEventListener('keydown', echap); };
  const echap = e => { if (e.key === 'Escape') fermer(); };
  doc.addEventListener('keydown', echap);
  ov.addEventListener('mousedown', e => { if (e.target === ov) fermer(); });

  const data = await chargerConsent(idvu);
  const rows = (data && data.rows) || [];
  const s = (data && data.synth) || { marques: [] };
  const find = (marque, canal) => rows.find(x => (x.marque || null) === marque && x.canal === canal);
  const COUL = { consenti: '#2f8f77', attente: '#a8740a', refuse: '#c43c3b', inconnu: '#9fb3d1' };
  const etat = r => !r ? 'inconnu' : r.autorise ? 'consenti' : r.date_decision == null ? 'attente' : 'refuse';

  const blocMarque = m => {
    const lignes = CANAUX_CONSENT.map(c => {
      const r = find(m.marque, c[0]); const e = etat(r);
      return `<tr><td style="padding:6px 0;color:#5a7ba8;font-size:13px;font-weight:600">${esc(CANAUX_LONG[c[0]] || c[1])}</td>` +
        `<td style="padding:6px 8px;color:${COUL[e]};font-weight:800;font-size:12.5px;white-space:nowrap">${libEtat(e)}</td>` +
        `<td style="padding:6px 0;color:#7a98c5;font-size:12px;text-align:right;white-space:nowrap">${r && r.date_decision ? esc(dateFr(r.date_decision)) : ''}</td></tr>`;
    }).join('');
    return `<div style="border:1.5px solid #e3edf9;border-radius:12px;padding:12px 14px">
      <div style="font-size:12px;font-weight:900;letter-spacing:.14em;text-transform:uppercase;color:#1F4A85;margin-bottom:2px">${esc(m.libelle)}</div>
      <div style="font-size:12px;color:#7a98c5;font-weight:600;margin-bottom:8px">${m.demande_le ? 'Dernière demande envoyée le ' + esc(dateHeureFr(m.demande_le)) : 'Aucune demande envoyée depuis One Data'}</div>
      <table style="width:100%;border-collapse:collapse">${lignes}</table></div>`;
  };
  const champ = (lib, val) => `<div><div style="font-size:11px;font-weight:700;color:#7a98c5">${lib}</div><div style="font-weight:800;margin-top:2px;font-size:13px">${val || '—'}</div></div>`;
  const bl = r => r && r.autorise ? '<span style="color:#c43c3b">Inscrit</span>' : '<span style="color:#2f8f77">Libre</span>';

  modal.innerHTML =
    '<button type="button" data-consent-close aria-label="Fermer" style="position:absolute;top:14px;right:14px;width:34px;height:34px;border-radius:9px;border:none;background:#f2f6fc;cursor:pointer;color:#2a5ea9;font-size:18px;line-height:1">×</button>'
    + '<div style="font-weight:800;font-size:17px">Consentements RGPD — détail</div>'
    + '<div style="color:#7a98c5;font-size:12.5px;font-weight:600;margin:2px 0 16px">Reflétés de BACS' + (s.maj ? ' · à jour au ' + esc(dateHeureFr(s.maj)) : '') + '</div>'
    + '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(260px,1fr));gap:12px">' + (s.marques || []).map(blocMarque).join('') + '</div>'
    + '<div style="display:flex;flex-wrap:wrap;gap:22px;margin-top:16px;padding-top:14px;border-top:1px solid #eef3fa">'
    + champ('Bloctel mobile', bl(find(null, 'bloctel_cell'))) + champ('Bloctel fixe', bl(find(null, 'bloctel_phone')))
    + champ('Maj Bloctel', esc(dateFr(cl.bloctel_maj_date))) + champ('Rétention', esc(dateFr(cl.rgpd_retention_date))) + champ('Anonymisation', esc(dateFr(cl.rgpd_anonymisation_date)))
    + '</div>'
    + '<div style="font-size:12px;color:#7a98c5;margin-top:14px;line-height:1.5;font-weight:600">« En attente » : le client n’a pas encore répondu à la demande d’opt-in — ce n’est pas un refus. Les consentements Toyota et Lexus sont distincts : un accord donné à une marque ne vaut pas pour l’autre.</div>'
    + (s.url ? `<div style="margin-top:14px;text-align:right"><a href="${esc(s.url)}" target="_blank" rel="noopener" style="color:#2a5ea9;font-weight:800;font-size:13px;text-decoration:none">Ouvrir le compte dans BACS ↗</a></div>` : '');
  const cbtn = modal.querySelector('[data-consent-close]');
  if (cbtn) cbtn.addEventListener('click', fermer);
}

function lierChamp(el) {
  const field = el.getAttribute('data-cf-field');
  if (field === '__addressQuery') { el.addEventListener('input', () => onAddressInput(el.value)); return; }
  if (field === '__siretQuery')   { el.addEventListener('input', () => onSiretInput(el.value));   return; }
  if (el.tagName === 'SELECT') el.addEventListener('change', () => updateClientField(field, el.value));
  else if (el.type === 'checkbox') el.addEventListener('change', () => updateClientField(field, el.checked));
  else el.addEventListener('input', () => updateClientField(field, el.value));
}

function bindEvents() {
  const root = getRoot();
  if (!root) return;
  root.querySelectorAll('[data-cf-action="enter-edit"]').forEach(el => el.addEventListener('click', enterEdit));
  root.querySelectorAll('[data-cf-action="cancel-edit"]').forEach(el => el.addEventListener('click', cancelEdit));
  root.querySelectorAll('[data-cf-action="save-edit"]').forEach(el => el.addEventListener('click', saveEdit));
  root.querySelectorAll('[data-cf-action="dismiss-duplicate"]').forEach(el => el.addEventListener('click', dismissDuplicate));
  root.querySelectorAll('[data-cf-action="view-duplicate"]').forEach(el => el.addEventListener('click', viewDuplicate));
  root.querySelectorAll('[data-cf-action="save-anyway"]').forEach(el => el.addEventListener('click', saveAnyway));
  root.querySelectorAll('[data-cf-action="pick-address"]').forEach(el => el.addEventListener('click', () => {
    const idx = Number(el.getAttribute('data-idx'));
    if (state.addressSuggestions[idx]) applyAddressSuggestion(state.addressSuggestions[idx]);
  }));
  root.querySelectorAll('[data-cf-action="pick-siret"]').forEach(el => el.addEventListener('click', () => {
    const idx = Number(el.getAttribute('data-idx'));
    if (state.siretSuggestions[idx]) applySiretSuggestion(state.siretSuggestions[idx]);
  }));
  root.querySelectorAll('.cf-cols [data-cf-field]').forEach(lierChamp);
}

if (!window.__cfListenerBound) {
  window.addEventListener('oropra-client-selected', () => { Object.keys(CONSENT_CACHE).forEach(k => delete CONSENT_CACHE[k]); loadClient(); render(); });
  window.__cfListenerBound = true;
}

loadClient();
render();

}
});
