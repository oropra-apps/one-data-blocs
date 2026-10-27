// v12 (27/10/2026) : open({ client, text }) pré-remplit le message (modèles
// proposés par le lead management). Sans « text », comportement inchangé.
// v11 (27/10/2026) : champ de saisie en 16 px sur mobile ; la fermeture libère
// bien la page (en v9-v10, fermer la fenêtre laissait la fiche figée).
// iPhone : un champ dont le texte fait moins de 16 px déclenche un ZOOM
// automatique de Safari au toucher. La page entière devient alors plus grande que
// l'écran : on peut la faire glisser « derrière » la fenêtre, des barres de
// défilement apparaissent, et les bords (avatar, croix, envoi) sont coupés.
// v10 (27/10/2026) : verrou de la page renforcé pour iPhone (body figé) — la
// fiche client ne défile plus derrière la fenêtre SMS, plus de barres de défilement.
// v9 (27/10/2026) : sur mobile, faire défiler le fil SMS ne fait plus défiler
// la fiche client en arrière-plan (page verrouillée tant que la fenêtre est
// ouverte, défilement du fil contenu dans la fenêtre).
// v8 (27/10/2026) : sur mobile (iPhone surtout), la fenêtre prend la largeur de
// la zone visible : l'avatar et la croix ne sont plus coupés.
// v7 (27/10/2026) : sur mobile, toucher la zone de saisie ne fait plus sortir la
// fenêtre de l'écran : le clavier réduit la page (interactive-widget) et la
// fenêtre suit la partie visible, y compris si Chrome fait défiler la page.
// v6 (27/10/2026) : sur mobile, la fenêtre SMS tient dans la partie visible de
// l'écran (barres de Chrome et clavier compris) : saisie et micro accessibles.
// SMS (canal) — module One Data (OD.define) v1 (Lot C) — overlay, ctx.tenant/ctx.supabase
OD.define('sms', {
  mount(__anchor, ctx) {

  /* =========================================================================
     OROPRA — SMS UI  (design fidèle à la modale WhatsApp, en orange SMS)
     - Fenêtre flottante NON bloquante, DÉPLAÇABLE (drag en-tête), responsive
       (plein écran < 640px), réductible en barre. Root #oropra-sms-ui sur body.
     - Fil texturé type WhatsApp, bulles à coin coupé (orange sortant / blanc
       entrant), meta dans la bulle. Footer : dictée vocale + saisie + envoi.
     - Realtime, envoi (sms-send), suppression (sélection d'une bulle).
     - API : window.__SMS_UI__ { open, close, minimize, refresh }
     ========================================================================= */

  const SELECTED_CLIENT_VAR_ID = '55490583-c88b-4748-916e-4d203db07742';
  const SELECTED_SITE_VAR_ID = '39fecccf-9296-43b7-b5b6-eadaa928290d';
  const SMS_BODY_VAR_ID = '9fee26d2-65d3-4b66-8105-9ce1e528db9a';
  const SUPABASE_URL = ctx.tenant.supabase_url;
  const ROOT_ID = 'oropra-sms-ui';
  const ORANGE = '#e8ae28';   // header + bouton envoi
  const GREEN = '#d9fdd3';    // fond bulle sortante (identique WhatsApp)

  const doc = (__anchor.ownerDocument || document);

  // Clavier mobile (27/10/2026) : par défaut, Chrome Android ouvre le clavier
  // PAR-DESSUS la page et la fait défiler pour montrer le champ : les fenêtres
  // fixes (SMS, WhatsApp, e-mail, avis) partaient alors vers le haut, hors de
  // l'écran. « interactive-widget=resizes-content » demande au navigateur de
  // RÉDUIRE la page à la place du clavier : les fenêtres se rétrécissent et
  // restent entières à l'écran. Posé une fois pour toute l'application.
  (function clavierRedimensionne(d) {
    try {
      let m = d.querySelector('meta[name="viewport"]');
      if (!m) { m = d.createElement('meta'); m.name = 'viewport'; m.content = 'width=device-width, initial-scale=1'; d.head.appendChild(m); }
      const c = m.getAttribute('content') || '';
      if (!/interactive-widget/.test(c)) m.setAttribute('content', (c ? c + ', ' : '') + 'interactive-widget=resizes-content');
    } catch (e) { }
  })(doc);
  const win = (wwLib.getFrontWindow && wwLib.getFrontWindow()) || window;
  function getRoot() { return doc.getElementById(ROOT_ID); }
  function ensureRoot() { let r = getRoot(); if (!r) { r = doc.createElement('div'); r.id = ROOT_ID; doc.body.appendChild(r); } return r; }
  function sb() { return ctx.supabase; }
  function anonKey() { return ctx.tenant.supabase_anon_key; }
  // Jeton de SESSION pour appeler les edge functions : sans en-tete
  // Authorization la passerelle repond 401 UNAUTHORIZED_NO_AUTH_HEADER avant
  // meme d'executer la fonction. Repli sur la cle anon si pas de session.
  async function authToken() {
    try {
      const { data } = await sb().auth.getSession();
      return (data && data.session && data.session.access_token) || anonKey();
    } catch (e) { return anonKey(); }
  }
  function readVar(id) { try { return wwLib.wwVariable.getValue(id); } catch (e) { return null; } }

  /* ---- site courant -------------------------------------------------------
     UN FIL PAR CONCESSION, 13/10/2026. Un cycle commercial, c'est un client
     ET un site : les echanges d'Arcueil et de Sceaux n'appartiennent pas a la
     meme conversation, et ils partent de deux agents RCS distincts. Le fil est
     donc filtre sur le site retenu, et le site est FIGE A L'OUVERTURE dans
     `state.site` : la bulle affichee et l'envoi doivent designer la meme
     concession, meme si le bandeau change pendant que la modale est ouverte
     (dans ce cas on recharge, § onChange).
     Quand le perimetre est au-dessus du site (groupe, affaire), `siteCourant`
     rend null : on montre alors tout, chaque bulle portant son site.
     ------------------------------------------------------------------------- */
  function busSite() { try { return win.oropraSite || window.oropraSite || null; } catch (e) { return null; } }
  function siteCourant() {
    const bus = busSite();
    if (bus && typeof bus.getSiteId === 'function') {
      const v = bus.getSiteId();
      if (v != null && v !== '') return Number(v);
    }
    const v = readVar(SELECTED_SITE_VAR_ID);
    return (v != null && v !== '') ? Number(v) : null;
  }
  function nomSite(id) {
    if (id == null) return '';
    const bus = busSite();
    const liste = (bus && typeof bus.getSites === 'function') ? (bus.getSites() || []) : [];
    const s = liste.find(x => Number(x.id_site) === Number(id));
    return s ? (s.site || s.affaire || ('Site ' + id)) : ('Site ' + id);
  }

  const state = window.__smsState || {};
  if (state.open === undefined) state.open = false;
  if (state.minimized === undefined) state.minimized = false;
  if (state.messages === undefined) state.messages = [];
  if (state.loading === undefined) state.loading = false;
  if (state.error === undefined) state.error = null;
  if (state.input === undefined) state.input = '';
  if (state.sending === undefined) state.sending = false;
  if (state.channel === undefined) state.channel = null;
  if (state.selectedKey === undefined) state.selectedKey = null;
  if (state.client === undefined) state.client = null;
  if (state.site === undefined) state.site = null;
  if (state.unsubSite === undefined) state.unsubSite = null;
  if (state.pos === undefined) state.pos = null;
  if (state.dictating === undefined) state.dictating = false;
  if (state.dictFinal === undefined) state.dictFinal = null;
  window.__smsState = state;
  let recog = null;

  /* ---- helpers ------------------------------------------------------------ */
  function esc(s) { if (s == null) return ''; return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
  function keyOf(m) { return m.message_sid || m._tmp || ('row_' + m.id); }
  function toE164(tel) { const s = String(tel || '').trim(); if (!s) return null; if (s.startsWith('+')) return s.replace(/[^\d+]/g, ''); const d = s.replace(/\D/g, ''); if (!d) return null; return '+33' + d.replace(/^0/, ''); }
  function clientLabel(c) { if (!c) return ''; const soc = c.idmultivu === 1 || c.idmultivu === '1'; return soc ? [c.CIVILITE, c.NOM].filter(Boolean).join(' ') : [c.PRENOM, (c.NOM || '').toUpperCase()].filter(Boolean).join(' '); }
  function initials(c) { if (!c) return '?'; const soc = c.idmultivu === 1 || c.idmultivu === '1'; const a = soc ? (c.NOM || '') : (c.PRENOM || c.NOM || ''); const b = soc ? '' : (c.NOM || ''); return ((a[0] || '') + (b[0] || '')).toUpperCase() || '?'; }
  function fmtTime(iso) { try { return new Date(iso).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }); } catch (e) { return ''; } }
  function fmtDay(iso) { const d = new Date(iso); const now = new Date(); if (d.toDateString() === now.toDateString()) return "Aujourd'hui"; const y = new Date(now); y.setDate(now.getDate() - 1); if (d.toDateString() === y.toDateString()) return 'Hier'; return d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' }); }
  function dayKey(iso) { try { return new Date(iso).toDateString(); } catch (e) { return ''; } }

  /* ---- data --------------------------------------------------------------- */
  async function loadThread(idClient, idSite) {
    state.loading = true; state.error = null; render();
    try {
      let q = sb().from('sms_messages').select('*').eq('id_client', idClient);
      if (idSite != null) q = q.eq('id_site', Number(idSite));
      const { data, error } = await q.order('created_at', { ascending: true });
      if (error) throw error;
      state.messages = data || [];
    } catch (e) { console.error('[sms] loadThread', e); state.error = e.message || String(e); state.messages = []; }
    finally { state.loading = false; render(true); }
  }
  function upsertMessage(row, opts) {
    opts = opts || {};
    if (row.message_sid && state.messages.some(m => m.message_sid === row.message_sid)) { state.messages = state.messages.map(m => m.message_sid === row.message_sid ? Object.assign({}, m, row) : m); return; }
    if (opts.reconcileTemp && row.direction === 'outbound') { const idx = state.messages.findIndex(m => m._tmp && m.direction === 'outbound' && (m.body || '').trim() === (row.body || '').trim()); if (idx !== -1) { state.messages[idx] = row; return; } }
    state.messages.push(row);
    state.messages.sort((a, b) => new Date(a.created_at) - new Date(b.created_at));
  }
  function removeMessageByRow(row) { state.messages = state.messages.filter(m => !((row.message_sid && m.message_sid === row.message_sid) || (row.id != null && m.id === row.id))); }
  // `postgres_changes` n'accepte qu'UNE condition de filtre : on garde le
  // client cote serveur et on ecarte les lignes d'une autre concession ici.
  function subscribeRealtime(idClient, idSite) {
    if (state.channel) { try { sb().removeChannel(state.channel); } catch (e) {} state.channel = null; }
    try {
      state.channel = sb().channel('sms_thread_' + idClient + '_' + (idSite == null ? 'all' : idSite))
        .on('postgres_changes', { event: '*', schema: 'public', table: 'sms_messages', filter: 'id_client=eq.' + idClient },
          (payload) => {
            const row = payload.eventType === 'DELETE' ? (payload.old || {}) : (payload.new || {});
            if (idSite != null && row.id_site != null && Number(row.id_site) !== Number(idSite)) return;
            if (payload.eventType === 'DELETE') removeMessageByRow(row); else upsertMessage(row, { reconcileTemp: true });
            render(true);
          })
        .subscribe();
    } catch (e) { console.warn('[sms] realtime KO', e && e.message); }
  }

  /* ---- envoi -------------------------------------------------------------- */
  async function sendSms() {
    stopDictation();
    const text = (state.input || '').trim();
    if (!text || state.sending) return;
    const c = state.client || {};
    const toNumber = toE164(c.TEl_MOB);
    if (!toNumber) { state.error = 'Pas de numéro mobile pour ce client.'; render(); return; }
    const agentAuthUid = (window.oropraUser && (window.oropraUser.auth_uid || window.oropraUser.id)) || null;
    const idClient = c.IDVu != null ? c.IDVu : null;
    // Le site du FIL, fige a l'ouverture : on n'envoie jamais sous une autre
    // enseigne que celle qu'on a sous les yeux.
    const idSite = state.site != null ? state.site : null;
    let idCycleCom = null;
    // Cycle com du client : requête directe sur la vue v_contacts_client (source
    // de l'ex-collection WeWeb 097aa7fd, supprimée). On prend le contact le PLUS
    // RÉCENT — l'ancien code prenait la 1re ligne de la collection, dont l'ordre
    // dépendait de son tri ; « le cycle courant » est l'intention.
    if (idClient != null) {
      try {
        let qc = sb()
          .from('v_contacts_client')
          .select('id_cycle_com, date_contact')
          .eq('idvu', Number(idClient))
          .not('id_cycle_com', 'is', null);
        // Le cycle appartient au couple client + site : sans ce filtre on
        // remontait le cycle d'une autre concession.
        if (idSite != null) qc = qc.eq('id_site', Number(idSite));
        const { data: cc } = await qc
          .order('date_contact', { ascending: false })
          .limit(1)
          .maybeSingle();
        idCycleCom = cc && cc.id_cycle_com != null ? cc.id_cycle_com : null;
      } catch (e) { console.warn('[sms] cycle_com', e && e.message); }
    }
    const tmp = '_t' + Date.now();
    state.messages.push({ _tmp: tmp, direction: 'outbound', body: text, status: 'sending', created_at: new Date().toISOString() });
    state.input = ''; state.sending = true;
    try { wwLib.wwVariable.updateValue(SMS_BODY_VAR_ID, ''); } catch (e) {}
    render(true);
    try {
      const res = await fetch(SUPABASE_URL + '/functions/v1/sms-send', {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'apikey': anonKey(), 'Authorization': 'Bearer ' + (await authToken()) },
        body: JSON.stringify({ to: toNumber, body: text, agent_auth_uid: agentAuthUid, id_client: idClient, id_site: idSite, id_cycle_com: idCycleCom })
      });
      const data = await res.json();
      const m = state.messages.find(x => x._tmp === tmp);
      if (data && data.success) { if (m) { m.message_sid = data.sid; m.status = 'sent'; delete m._tmp; } }
      else { if (m) m.status = 'failed'; state.error = (data && (data.error && (data.error.message || data.error))) ? String(data.error.message || data.error) : "Échec de l'envoi"; console.error('[sms] send error', data && data.error); }
    } catch (e) { const m = state.messages.find(x => x._tmp === tmp); if (m) m.status = 'failed'; state.error = e.message || String(e); console.error('[sms] send exception', e); }
    finally { state.sending = false; render(true); }
  }

  /* ---- suppression -------------------------------------------------------- */
  async function deleteMsg(key) {
    const m = state.messages.find(x => keyOf(x) === key); if (!m) return;
    const backup = state.messages.slice();
    state.messages = state.messages.filter(x => keyOf(x) !== key);
    state.selectedKey = null; render();
    try {
      if (m._tmp && m.id == null && !m.message_sid) return;
      let q = sb().from('sms_messages').delete();
      if (m.id != null) q = q.eq('id', m.id); else if (m.message_sid) q = q.eq('message_sid', m.message_sid); else return;
      const { error } = await q; if (error) throw error;
    } catch (e) { console.error('[sms] delete', e); state.messages = backup; state.error = 'Suppression impossible : ' + (e.message || String(e)); render(); }
  }

  /* ---- dictée vocale (SMS = texte) --------------------------------------- */
  function dictSupported() { return !!(win.SpeechRecognition || win.webkitSpeechRecognition); }
  function stopDictation() { state.dictating = false; state.dictFinal = null; try { if (recog) { recog.onend = null; recog.stop(); } } catch (e) {} recog = null; }
  function toggleDictation() {
    if (state.dictating) { try { recog && recog.stop(); } catch (e) {} return; }
    const SR = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SR) { win.alert("La dictée vocale n'est pas disponible sur ce navigateur."); return; }
    recog = new SR(); recog.lang = 'fr-FR'; recog.interimResults = true; recog.continuous = true;
    const base = state.input ? (state.input.replace(/\s+$/, '') + ' ') : '';
    recog.onresult = (e) => {
      let finalTxt = '', interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) { const t = e.results[i][0].transcript; if (e.results[i].isFinal) finalTxt += t; else interim += t; }
      if (finalTxt) state.dictFinal = (state.dictFinal || base) + finalTxt + ' ';
      state.input = ((state.dictFinal || base) + interim).replace(/\s+/g, ' ');
      const el = getRoot() && getRoot().querySelector('.sms-inp');
      if (el) { el.value = state.input; el.style.height = 'auto'; el.style.height = Math.min(96, el.scrollHeight) + 'px'; }
      syncSendBtn();
    };
    recog.onerror = () => { state.dictating = false; state.dictFinal = null; recog = null; render(); };
    recog.onend = () => { state.dictating = false; state.dictFinal = null; recog = null; render(); };
    state.dictFinal = base; state.dictating = true;
    try { recog.start(); } catch (e) {}
    render();
  }
  function syncSendBtn() {
    const btn = getRoot() && getRoot().querySelector('[data-act="send"]');
    if (btn) btn.classList.toggle('on', (state.input || '').trim().length > 0 && !state.sending);
  }

  /* ---- icônes ------------------------------------------------------------- */
  const IC_SEND = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>';
  const IC_DICT = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v3M9 20h6"/></svg>';
  const IC_CLOSE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  const IC_MIN = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 12h14"/></svg>';
  const IC_EXPAND = '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="15 3 21 3 21 9"/><polyline points="9 21 3 21 3 15"/><line x1="21" y1="3" x2="14" y2="10"/><line x1="3" y1="21" x2="10" y2="14"/></svg>';
  const IC_TRASH = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';

  /* ---- styles (fidèles à WhatsApp, teinte orange SMS) -------------------- */
  const STYLE = '<style>' +
    '#' + ROOT_ID + '{font-family:-apple-system,"Segoe UI",Helvetica,Arial,sans-serif}' +
    '#' + ROOT_ID + ' *{box-sizing:border-box}' +
    '.sms-card{position:fixed;left:24px;bottom:24px;width:min(380px,calc(100vw - 32px));height:min(620px,86vh);background:#efeae2;border-radius:14px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 18px 52px rgba(0,0,0,.30);z-index:9990}' +
    '.sms-head{display:flex;align-items:center;gap:10px;padding:10px 12px;background:' + ORANGE + ';color:#fff;flex:0 0 auto;cursor:move;touch-action:none;user-select:none}' +
    '.sms-ava{width:38px;height:38px;border-radius:50%;background:#ffffff33;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex:0 0 auto}' +
    '.sms-hinfo{flex:1;min-width:0}' +
    '.sms-hname{font-size:15px;font-weight:600;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.sms-hsub{font-size:12px;color:#fff3df;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.sms-hbtn{background:none;border:none;color:#fff;cursor:pointer;padding:6px;display:flex;border-radius:8px}' +
    '.sms-hbtn:hover{background:#ffffff22}' +
    '.sms-body{flex:1;overflow-y:auto;overscroll-behavior:contain;-webkit-overflow-scrolling:touch;padding:14px 10px 8px;background-color:#efeae2;background-image:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'60\' height=\'60\' viewBox=\'0 0 60 60\'%3E%3Cg fill=\'%23d9d0c6\' fill-opacity=\'0.35\'%3E%3Ccircle cx=\'12\' cy=\'12\' r=\'1.5\'/%3E%3Ccircle cx=\'40\' cy=\'28\' r=\'1.5\'/%3E%3Ccircle cx=\'22\' cy=\'46\' r=\'1.5\'/%3E%3C/g%3E%3C/svg%3E");display:flex;flex-direction:column;gap:2px}' +
    '.sms-daysep{align-self:center;background:#ffffffdd;color:#54656f;font-size:11px;font-weight:600;padding:4px 12px;border-radius:8px;margin:10px 0 6px;box-shadow:0 1px 1px rgba(0,0,0,.06);text-transform:uppercase;letter-spacing:.3px}' +
    '.sms-row{display:flex;margin-top:2px;align-items:center;gap:6px}' +
    '.sms-row.out{justify-content:flex-end}' +
    '.sms-row.in{justify-content:flex-start}' +
    '.sms-bubble{position:relative;max-width:78%;padding:6px 9px 8px;border-radius:9px;font-size:14px;line-height:1.35;box-shadow:0 1px .5px rgba(0,0,0,.13);word-wrap:break-word;cursor:pointer}' +
    '.sms-row.out .sms-bubble{background:' + GREEN + ';color:#111b21;border-top-right-radius:2px}' +
    '.sms-row.in .sms-bubble{background:#fff;color:#111b21;border-top-left-radius:2px}' +
    '.sms-row.failed .sms-bubble{background:#e2493f;color:#fff}' +
    '.sms-txt{white-space:pre-wrap}' +
    '.sms-meta{float:right;font-size:10.5px;margin:6px 0 -3px 10px}' +
    '.sms-site{display:block;font-size:10px;font-weight:700;letter-spacing:.3px;text-transform:uppercase;color:#8a7a5c;margin-bottom:2px}' +
    '.sms-row.out .sms-meta{color:#667781}' +
    '.sms-row.in .sms-meta{color:#667781}' +
    '.sms-del{border:none;background:#fff;color:#e2493f;box-shadow:0 1px 5px rgba(0,0,0,.2);width:28px;height:28px;border-radius:50%;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;flex:0 0 auto;order:-1}' +
    '.sms-row.in .sms-del{order:1}' +
    '.sms-foot{flex:0 0 auto;display:flex;align-items:flex-end;gap:6px;padding:8px 8px;background:#f0f2f5}' +
    '.sms-inp{flex:1;border:none;border-radius:22px;padding:10px 14px;font-size:14px;color:#111b21;outline:none;resize:none;max-height:96px;font-family:inherit;line-height:1.35;background:#fff;box-shadow:0 1px 1px rgba(0,0,0,.06)}' +
    '.sms-fbtn{width:40px;height:40px;border-radius:50%;border:none;background:none;color:#54656f;cursor:pointer;display:flex;align-items:center;justify-content:center;flex:0 0 auto}' +
    '.sms-fbtn:hover{background:#00000010}' +
    '.sms-send{background:#cfd9e6;color:#fff}' +
    '.sms-send.on{background:' + ORANGE + ';color:#fff;cursor:pointer}' +
    '.sms-send.on:hover{background:#e6a817}' +
    '.sms-dict-on{background:#e2493f;color:#fff;animation:sms-pulse 1.1s ease-in-out infinite}' +
    '@keyframes sms-pulse{0%,100%{opacity:1}50%{opacity:.55}}' +
    '.sms-msg{margin:auto;text-align:center;color:#54656f;font-size:13px;padding:24px}' +
    '.sms-err{background:#fdecea;border-top:1px solid #f7c8c3;color:#b73a30;font-size:12px;padding:8px 12px;text-align:center}' +
    '.sms-spin{display:inline-block;width:15px;height:15px;border:2px solid rgba(255,255,255,.5);border-top-color:#fff;border-radius:50%;animation:sms-spin .7s linear infinite}' +
    '.sms-spin.dark{border-color:#e7d9c2;border-top-color:' + ORANGE + '}' +
    '@keyframes sms-spin{to{transform:rotate(360deg)}}' +
    '.sms-bar{position:fixed;left:24px;bottom:24px;width:min(300px,calc(100vw - 32px));background:' + ORANGE + ';color:#fff;border-radius:12px;box-shadow:0 12px 34px rgba(0,0,0,.24);z-index:9990;display:flex;align-items:center;gap:10px;padding:10px 12px;cursor:pointer}' +
    '@media(max-width:640px){.sms-head{position:relative;z-index:2}.sms-hbtn{padding:11px;min-width:44px;min-height:44px;justify-content:center;align-items:center}.sms-inp{font-size:16px}.sms-card{left:0;top:0;right:auto;bottom:auto!important;width:100%;max-width:100%;height:100vh;height:100dvh;border-radius:0}.sms-foot{padding-bottom:calc(8px + env(safe-area-inset-bottom,0px))}.sms-bar{left:0;right:0;bottom:0;width:100vw;border-radius:0;padding-bottom:env(safe-area-inset-bottom,0px)}}' +
    '</style>';

  /* ---- rendu -------------------------------------------------------------- */
  // Le sous-titre nomme la concession : c'est elle qui choisit l'agent RCS,
  // donc l'enseigne sous laquelle le client verra arriver le message.
  function sousTitre(c) {
    const tel = (c && c.TEl_MOB) || '';
    if (state.site != null) return [tel, nomSite(state.site)].filter(Boolean).join(' · ');
    return [tel, 'toutes concessions — envoi depuis votre site de rattachement'].filter(Boolean).join(' · ');
  }
  function renderBar() {
    const c = state.client || {};
    return STYLE + '<div class="sms-bar" data-act="restore">' +
      '<div class="sms-ava">' + esc(initials(c)) + '</div>' +
      '<div class="sms-hinfo"><div class="sms-hname">' + esc(clientLabel(c) || 'SMS') + '</div><div class="sms-hsub">SMS — cliquer pour rouvrir</div></div>' +
      '<button class="sms-hbtn" data-act="restore" title="Agrandir">' + IC_EXPAND + '</button>' +
      '<button class="sms-hbtn" data-act="close" title="Fermer">' + IC_CLOSE + '</button></div>';
  }
  function bubble(m) {
    const out = m.direction === 'outbound';
    const key = keyOf(m);
    const failed = m.status === 'failed';
    const selected = state.selectedKey === key;
    let meta;
    if (out && m.status === 'sending') meta = 'Envoi…'; else if (out && failed) meta = 'Échec'; else meta = fmtTime(m.created_at);
    return '<div class="sms-row ' + (out ? 'out' : 'in') + (failed ? ' failed' : '') + '">' +
      (selected ? '<button class="sms-del" data-act="del" data-key="' + esc(key) + '" title="Supprimer">' + IC_TRASH + '</button>' : '') +
      '<div class="sms-bubble" data-act="sel" data-key="' + esc(key) + '">' +
        (state.site == null && m.id_site != null ? '<span class="sms-site">' + esc(nomSite(m.id_site)) + '</span>' : '') +
        '<span class="sms-txt">' + esc(m.body || '') + '</span>' +
        '<span class="sms-meta">' + esc(meta) + '</span>' +
      '</div></div>';
  }
  function renderMessages() {
    if (state.loading) return '<div class="sms-msg"><span class="sms-spin dark"></span><div style="margin-top:8px">Chargement…</div></div>';
    if (!state.messages.length) return '<div class="sms-msg">Aucun message pour le moment.<br>Écris le premier ci-dessous.</div>';
    let h = ''; let lastDay = null;
    for (const m of state.messages) {
      const dk = dayKey(m.created_at);
      if (dk !== lastDay) { h += '<div class="sms-daysep">' + esc(fmtDay(m.created_at)) + '</div>'; lastDay = dk; }
      h += bubble(m);
    }
    return h;
  }

  // Verrou du défilement de la page (mobile) : tant qu'une fenêtre de
  // messagerie occupe l'écran, la fiche client derrière ne défile plus. Sans
  // cela, faire glisser le doigt dans un fil vide (ou arrivé en bout) faisait
  // défiler la page en arrière-plan. Verrou partagé entre SMS, WhatsApp et
  // e-mail : la page n'est rendue que lorsque plus aucune fenêtre ne le tient.
  function verrouPage(cle, actif) {
    try {
      const L = win.__odVerrous || (win.__odVerrous = { cles: {}, avant: null });
      if (actif) L.cles[cle] = true; else delete L.cles[cle];
      const h = doc.documentElement, b = doc.body;
      const tenu = Object.keys(L.cles).length > 0;
      if (tenu && !L.avant) {
        // iPhone : overflow:hidden ne suffit pas (Safari fait quand même
        // défiler la page sous le doigt et sous le clavier). On FIGE le body
        // à sa position courante, puis on la restitue à la fermeture.
        const x = win.scrollX || win.pageXOffset || 0, y = win.scrollY || win.pageYOffset || 0;
        L.avant = { x: x, y: y, h: h.style.overflow, b: b.style.overflow, hb: h.style.overscrollBehavior,
                    pos: b.style.position, top: b.style.top, left: b.style.left, w: b.style.width };
        h.style.overflow = 'hidden'; b.style.overflow = 'hidden'; h.style.overscrollBehavior = 'none';
        b.style.position = 'fixed'; b.style.top = (-y) + 'px'; b.style.left = (-x) + 'px'; b.style.width = '100%';
        h.classList.add('od-plein-ecran');
      } else if (!tenu && L.avant) {
        const a = L.avant;
        h.style.overflow = a.h; b.style.overflow = a.b; h.style.overscrollBehavior = a.hb;
        b.style.position = a.pos; b.style.top = a.top; b.style.left = a.left; b.style.width = a.w;
        h.classList.remove('od-plein-ecran');
        L.avant = null;
        try { win.scrollTo(a.x, a.y); } catch (e) { }
      }
    } catch (e) { }
  }
  function render(scrollBottom) {
    const root = ensureRoot();
    verrouPage('sms', !!state.open && !state.minimized && estMobile());
    if (!state.open) { root.innerHTML = ''; return; }
    if (state.minimized) { root.innerHTML = renderBar(); bindEvents(); return; }
    const c = state.client || {};
    const canSend = (state.input || '').trim().length > 0 && !state.sending;
    root.innerHTML = STYLE + '<div class="sms-card">' +
      '<div class="sms-head">' +
        '<div class="sms-ava">' + esc(initials(c)) + '</div>' +
        '<div class="sms-hinfo"><div class="sms-hname">' + esc(clientLabel(c) || 'Client') + '</div><div class="sms-hsub">' + esc(sousTitre(c)) + '</div></div>' +
        '<button class="sms-hbtn" data-act="min" title="Réduire">' + IC_MIN + '</button>' +
        '<button class="sms-hbtn" data-act="close" title="Fermer">' + IC_CLOSE + '</button>' +
      '</div>' +
      '<div class="sms-body" data-act="scroll">' + renderMessages() + '</div>' +
      (state.error ? '<div class="sms-err">' + esc(state.error) + '</div>' : '') +
      '<div class="sms-foot">' +
        (dictSupported() ? '<button class="sms-fbtn ' + (state.dictating ? 'sms-dict-on' : '') + '" data-act="dict" title="Dictée vocale">' + IC_DICT + '</button>' : '') +
        '<textarea class="sms-inp" data-act="input" rows="1" placeholder="' + (state.dictating ? 'Parlez…' : 'Saisir le texte') + '">' + esc(state.input || '') + '</textarea>' +
        '<button class="sms-fbtn sms-send' + (canSend ? ' on' : '') + '" data-act="send" title="Envoyer">' + (state.sending ? '<span class="sms-spin"></span>' : IC_SEND) + '</button>' +
      '</div>' +
    '</div>';
    bindEvents();
    applyPos(root); makeDraggable(root);
    const body = root.querySelector('.sms-body'); if (body && (scrollBottom || !state._scrolled)) { body.scrollTop = body.scrollHeight; state._scrolled = true; }
  }

  function autoGrow(el) { el.style.height = 'auto'; el.style.height = Math.min(el.scrollHeight, 96) + 'px'; }

  /* ---- déplaçable --------------------------------------------------------- */
  // Mobile (v6) : la fenêtre occupe exactement la partie VISIBLE de l'écran.
  // 100vh compte la zone cachée par la barre d'adresse et le bandeau du bas de
  // Chrome : le champ de saisie et le micro tombaient dessous. On suit
  // visualViewport, qui rétrécit aussi quand le clavier s'ouvre.
  function estMobile() { return (win.innerWidth || 1024) <= 640; }
  function ajusterMobile(root) {
    const card = root.querySelector('.sms-card'); if (!card) return;
    if (!estMobile()) { card.style.height = ''; card.style.width = ''; return; }
    const vv = win.visualViewport;
    // Largeur ET position prises sur la zone visible : sur iPhone, 100vw et
    // left:0/right:0 suivent la page entière, plus large que l'écran si un
    // contenu déborde — avatar et croix sortaient alors de chaque côté.
    card.style.left = (vv ? Math.round(vv.offsetLeft) : 0) + 'px'; card.style.top = (vv ? Math.round(vv.offsetTop) : 0) + 'px';
    card.style.right = 'auto'; card.style.bottom = 'auto';
    card.style.width = Math.round(vv ? vv.width : (doc.documentElement.clientWidth || win.innerWidth)) + 'px';
    card.style.height = Math.round(vv ? vv.height : win.innerHeight) + 'px';
  }
  if (!win.__smsVV) {
    win.__smsVV = true;
    const relancer = () => { const r = doc.getElementById && doc.getElementById('oropra-sms-ui'); if (r) ajusterMobile(r); };
    try { if (win.visualViewport) { win.visualViewport.addEventListener('resize', relancer); win.visualViewport.addEventListener('scroll', relancer); } } catch (e) { }
    win.addEventListener('resize', relancer);
  }
  function applyPos(root) {
    if (estMobile()) { ajusterMobile(root); return; }
    const card = root.querySelector('.sms-card'); if (!card || !state.pos) return;
    const w = card.offsetWidth || 360, h = card.offsetHeight || 600, vw = win.innerWidth, vh = win.innerHeight;
    card.style.left = Math.max(6, Math.min(state.pos.left, vw - w - 6)) + 'px';
    card.style.top = Math.max(6, Math.min(state.pos.top, vh - h - 6)) + 'px';
    card.style.right = 'auto'; card.style.bottom = 'auto';
  }
  function makeDraggable(root) {
    const card = root.querySelector('.sms-card'), head = root.querySelector('.sms-head');
    if (!card || !head) return;
    let sx = 0, sy = 0, sl = 0, st = 0, dragging = false;
    head.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.sms-hbtn')) return;
      dragging = true; try { head.setPointerCapture(e.pointerId); } catch (x) {}
      const r = card.getBoundingClientRect();
      card.style.left = r.left + 'px'; card.style.top = r.top + 'px'; card.style.right = 'auto'; card.style.bottom = 'auto';
      sx = e.clientX; sy = e.clientY; sl = r.left; st = r.top; e.preventDefault();
    });
    head.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const w = card.offsetWidth, h = card.offsetHeight, vw = win.innerWidth, vh = win.innerHeight;
      card.style.left = Math.max(6, Math.min(sl + (e.clientX - sx), vw - w - 6)) + 'px';
      card.style.top = Math.max(6, Math.min(st + (e.clientY - sy), vh - h - 6)) + 'px';
    });
    const end = (e) => { if (!dragging) return; dragging = false; try { head.releasePointerCapture(e.pointerId); } catch (x) {} state.pos = { left: parseInt(card.style.left, 10), top: parseInt(card.style.top, 10) }; };
    head.addEventListener('pointerup', end);
    head.addEventListener('pointercancel', end);
  }

  function bindEvents() {
    const root = getRoot(); if (!root) return;
    root.querySelectorAll('[data-act="close"]').forEach(el => el.addEventListener('click', (e) => { e.stopPropagation(); closeUi(); }));
    root.querySelectorAll('[data-act="min"]').forEach(el => el.addEventListener('click', (e) => { e.stopPropagation(); setMinimized(true); }));
    root.querySelectorAll('[data-act="restore"]').forEach(el => el.addEventListener('click', (e) => { e.stopPropagation(); setMinimized(false); }));
    root.querySelectorAll('[data-act="send"]').forEach(el => el.addEventListener('click', () => sendSms()));
    root.querySelectorAll('[data-act="dict"]').forEach(el => el.addEventListener('click', () => toggleDictation()));
    root.querySelectorAll('[data-act="sel"]').forEach(el => el.addEventListener('click', () => { const key = el.getAttribute('data-key'); state.selectedKey = state.selectedKey === key ? null : key; render(); }));
    root.querySelectorAll('[data-act="del"]').forEach(el => el.addEventListener('click', (e) => { e.stopPropagation(); deleteMsg(el.getAttribute('data-key')); }));
    const input = root.querySelector('[data-act="input"]');
    if (input) {
      autoGrow(input);
      input.addEventListener('input', () => { state.input = input.value; autoGrow(input); syncSendBtn(); });
      input.addEventListener('keydown', (e) => { if (state.dictating) stopDictation(); if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendSms(); } });
      if (!state.dictating) setTimeout(() => { try { input.focus(); } catch (e) {} }, 30);
    }
  }

  /* ---- API ---------------------------------------------------------------- */
  function setMinimized(v) { state.minimized = !!v; render(true); }
  function open(opts) {
    ensureRoot();
    const c = (opts && opts.client) || readVar(SELECTED_CLIENT_VAR_ID) || {};
    state.open = true; state.minimized = false; state.client = c; state.error = null; state.input = (opts && typeof opts.text === 'string') ? opts.text : ''; state.selectedKey = null; state._scrolled = false;
    state.site = siteCourant();
    render();
    if (c.IDVu != null) { loadThread(c.IDVu, state.site).then(() => subscribeRealtime(c.IDVu, state.site)); }
    else { state.error = 'Aucun client sélectionné.'; render(); }
    ecouteSite();
  }
  // Changer de concession dans le bandeau pendant que la modale est ouverte
  // change de conversation : on recharge le fil plutot que de laisser a l'ecran
  // celui d'une autre enseigne.
  function ecouteSite() {
    if (state.unsubSite) { try { state.unsubSite(); } catch (e) {} state.unsubSite = null; }
    const bus = busSite();
    if (!bus || typeof bus.onChange !== 'function') return;
    try {
      state.unsubSite = bus.onChange(() => {
        if (!state.open) return;
        const nouveau = siteCourant();
        if (Number(nouveau) === Number(state.site) || (nouveau == null && state.site == null)) return;
        state.site = nouveau; state.selectedKey = null; state._scrolled = false;
        const c = state.client || {};
        if (c.IDVu != null) loadThread(c.IDVu, state.site).then(() => subscribeRealtime(c.IDVu, state.site));
      });
    } catch (e) { console.warn('[sms] onChange site KO', e && e.message); }
  }
  function closeUi() {
    stopDictation();
    if (state.channel) { try { sb().removeChannel(state.channel); } catch (e) {} state.channel = null; }
    if (state.unsubSite) { try { state.unsubSite(); } catch (e) {} state.unsubSite = null; }
    state.open = false; state.minimized = false; state.input = ''; state.selectedKey = null;
    const root = getRoot(); if (root) root.innerHTML = '';
    verrouPage('sms', false);   // v11 : la page redevient défilable à la fermeture
    try { wwLib.wwVariable.updateValue(SMS_BODY_VAR_ID, ''); } catch (e) {}
    try { win.dispatchEvent(new CustomEvent('oropra-sms-close')); } catch (e) {}
  }

  window.__SMS_UI__ = {
    open: open, close: closeUi, minimize: setMinimized,
    refresh: () => { if (state.open && state.client && state.client.IDVu != null) loadThread(state.client.IDVu, state.site); }
  };
}
});
