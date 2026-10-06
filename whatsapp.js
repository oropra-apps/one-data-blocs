// WHATSAPP (canal) — module One Data (OD.define) v1 (Lot C) — overlay, ctx.tenant/ctx.supabase
OD.define('whatsapp', {
  mount(__anchor, ctx) {
  /* ==========================================================================
     OROPRA — WhatsApp UI (façon smartphone)  ·  window.__WA_UI__
     - Se charge UNE fois au on-app-load (comme SMS_UI / VOIP_UI).
     - Crée son root #oropra-wa-ui sur <body> (fenêtre flottante persistante).
     - Fil v_wa_thread_items, temps réel (wa_messages), accusés (last_status).
     - Envoi : wa-send (texte/template), wa-send-attachment (PJ), wa-send-audio.
     - Fenêtre 24h : basée sur wa_conversations.last_inbound_at. Hors 24h ->
       templates (premier_contact / re_engagement_24h).
     - API : window.__WA_UI__ { open, close, minimize, refresh }
     ========================================================================== */

  const SELECTED_CLIENT_VAR_ID = '55490583-c88b-4748-916e-4d203db07742';
  const SELECTED_SITE_VAR_ID = '39fecccf-9296-43b7-b5b6-eadaa928290d';
  const SUPABASE_URL = ctx.tenant.supabase_url;
  const ROOT_ID = 'oropra-wa-ui';
  const WINDOW_MS = 24 * 60 * 60 * 1000;

  const doc = (__anchor.ownerDocument || document);
  const win = (wwLib.getFrontWindow && wwLib.getFrontWindow()) || window;
  function getRoot() { return doc.getElementById(ROOT_ID); }
  function ensureRoot() { let r = getRoot(); if (!r) { r = doc.createElement('div'); r.id = ROOT_ID; doc.body.appendChild(r); } return r; }
  function sb() { return ctx.supabase; }
  function anonKey() { return ctx.tenant.supabase_anon_key; }
  // Jeton de SESSION pour appeler les edge functions. La cle anon est un JWT
  // valide : la passerelle l'accepte, mais elle est PUBLIQUE (servie dans le
  // bundle a chaque visiteur). L'utiliser ici rendait ces fonctions d'envoi
  // appelables par n'importe qui. Repli sur la cle anon sans session.
  async function authToken() {
    try {
      const { data } = await sb().auth.getSession();
      return (data && data.session && data.session.access_token) || anonKey();
    } catch (e) { return anonKey(); }
  }
  function readVar(id) { try { return wwLib.wwVariable.getValue(id); } catch (e) { return null; } }
  function me() { return (win.oropraUser) || {}; }

  const state = window.__waState || {};
  if (state.open === undefined) state.open = false;
  if (state.minimized === undefined) state.minimized = false;
  if (state.items === undefined) state.items = [];
  if (state.loading === undefined) state.loading = false;
  if (state.error === undefined) state.error = null;
  if (state.input === undefined) state.input = '';
  if (state.sending === undefined) state.sending = false;
  if (state.channel === undefined) state.channel = null;
  if (state.client === undefined) state.client = null;
  if (state.contact === undefined) state.contact = null;
  if (state.conv === undefined) state.conv = null;
  if (state.recording === undefined) state.recording = false;
  if (state.pos === undefined) state.pos = null;
  window.__waState = state;

  /* ---- helpers ---- */
  function esc(s) { if (s == null) return ''; return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
  function toE164(tel) { const s = String(tel || '').trim(); if (!s) return ''; if (s.startsWith('+33')) return '33' + s.slice(3).replace(/\D/g, ''); if (s.startsWith('33')) return s.replace(/\D/g, ''); const d = s.replace(/\D/g, ''); if (!d) return ''; return '33' + d.replace(/^0/, ''); }
  function clientLabel(c) { if (!c) return 'Client'; const soc = c.idmultivu === 1 || c.idmultivu === '1'; return (soc ? [c.CIVILITE, c.NOM] : [c.CIVILITE, c.PRENOM, c.NOM]).filter(Boolean).join(' ').trim() || 'Client'; }
  function initials(name) { const p = String(name || '').trim().split(/\s+/).filter(Boolean); if (!p.length) return '?'; return ((p[0][0] || '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase(); }
  function fmtTime(d) { const dt = new Date(d); if (isNaN(dt)) return ''; return String(dt.getHours()).padStart(2, '0') + ':' + String(dt.getMinutes()).padStart(2, '0'); }
  function daySep(d) { const dt = new Date(d); const now = new Date(); const j = new Date(now); const diff = Math.floor((new Date(j.getFullYear(), j.getMonth(), j.getDate()) - new Date(dt.getFullYear(), dt.getMonth(), dt.getDate())) / 86400000); if (diff === 0) return "AUJOURD'HUI"; if (diff === 1) return 'HIER'; const MOIS = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.']; return dt.getDate() + ' ' + MOIS[dt.getMonth()] + ' ' + dt.getFullYear(); }
  function windowOpen() { const li = state.conv && state.conv.last_inbound_at; if (!li) return false; return (Date.now() - new Date(li).getTime()) < WINDOW_MS; }

  /* ---- résolution client -> contact -> conversation ---- */
  async function resolve(client) {
    state.contact = null; state.conv = null; state.waBusiness = null;
    const e164 = toE164(client && client.TEl_MOB);
    if (!e164) return;
    // Site SÉLECTIONNÉ dans la topnav (essentiel pour les users multisite) :
    // -> wa_business = SITE.Fax  et  concession = SITE.SITE (repli SITE.AFFAIRE).
    state.waBusiness = null; state.concession = '';
    try {
      const site = readVar(SELECTED_SITE_VAR_ID);
      if (site != null && site !== '') {
        const s = await sb().from('SITE').select('Fax, SITE, AFFAIRE').eq('ID_SITE', Number(site)).maybeSingle();
        if (s.data) {
          if (s.data.Fax != null) state.waBusiness = String(s.data.Fax).replace(/[^\d]/g, '');
          state.concession = s.data.SITE || s.data.AFFAIRE || '';
        }
      }
    } catch (e) { console.warn('[wa] site', e); }
    try {
      const ct = await sb().from('wa_contacts').select('id, wa_phone_e164, display_name').eq('wa_phone_e164', e164).maybeSingle();
      state.contact = ct.data || null;
    } catch (e) { console.warn('[wa] contact', e); }
    if (state.contact) {
      try {
        // (client + site) => conversation unique : contact_id + wa_business = SITE.Fax
        let q = sb().from('wa_conversations')
          .select('id, contact_id, wa_business, last_inbound_at, last_message_at, last_message_preview')
          .eq('contact_id', state.contact.id);
        if (state.waBusiness) q = q.eq('wa_business', Number(state.waBusiness));
        else q = q.not('wa_business', 'is', null);
        const cv = await q.order('last_message_at', { ascending: false, nullsFirst: false }).limit(1).maybeSingle();
        state.conv = cv.data || null;
      } catch (e) { console.warn('[wa] conv', e); }
    }
  }

  async function loadThread() {
    if (!state.conv) { state.items = []; return; }
    state.loading = true; render();
    try {
      const res = await sb().from('v_wa_thread_items').select('*').eq('conversation_id', state.conv.id).order('created_at', { ascending: true });
      if (res.error) throw res.error;
      state.items = res.data || [];
      state.error = null;
    } catch (e) { console.error('[wa] loadThread', e); state.error = e.message || String(e); }
    state.loading = false; render();
    markRead();
  }

  async function markRead() {
    if (!state.conv) return;
    try {
      await fetch(SUPABASE_URL + '/functions/v1/wa-mark-read', {
        method: 'POST', headers: { 'Content-Type': 'application/json', apikey: anonKey(), Authorization: 'Bearer ' + (await authToken()) },
        body: JSON.stringify({ conversation_id: state.conv.id })
      });
    } catch (e) { /* non bloquant */ }
  }

  function subscribe() {
    if (!state.conv) return;
    try { if (state.channel) sb().removeChannel(state.channel); } catch (e) { }
    let t = null; const reload = () => { clearTimeout(t); t = setTimeout(loadThread, 250); };
    state.channel = sb().channel('wa_thread_' + state.conv.id)
      // nouveaux messages (entrants/sortants) de la conversation
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wa_messages', filter: 'conversation_id=eq.' + state.conv.id }, reload)
      // accusés (sent -> delivered -> read) : ils arrivent dans wa_message_status
      .on('postgres_changes', { event: '*', schema: 'public', table: 'wa_message_status' }, reload)
      .subscribe();
  }

  /* ---- envoi ---- */
  async function sendText() {
    stopDictation();
    const text = (state.input || '').trim();
    if (!text || !state.conv || state.sending) return;
    state.sending = true; render();
    try {
      const r = await fetch(SUPABASE_URL + '/functions/v1/wa-send-text', {
        method: 'POST', headers: { 'Content-Type': 'application/json', apikey: anonKey(), Authorization: 'Bearer ' + (await authToken()) },
        body: JSON.stringify({ conversation_id: state.conv.id, to_phone_e164: toE164(state.client && state.client.TEl_MOB), text })
      });
      const j = await r.json().catch(() => ({}));
      if (r.status === 409 || j.error === 'needs_template') { state.sending = false; state.error = null; render(); return; }
      if (!r.ok) throw new Error(j.error || ('HTTP ' + r.status));
      state.input = ''; state.sending = false; render(); loadThread();
    } catch (e) { console.error('[wa] sendText', e); state.sending = false; state.error = e.message || String(e); render(); }
  }

  async function startFirstContact() {
    if (!state.waBusiness) { state.error = 'Numéro WhatsApp Business du site introuvable (SITE.Fax).'; render(); return; }
    const e164 = toE164(state.client && state.client.TEl_MOB);
    if (!e164) { state.error = 'Le client n\'a pas de numéro mobile.'; render(); return; }
    if (state.sending) return;
    state.sending = true; state.error = null; render();
    try {
      // 1) contact WhatsApp (upsert par téléphone)
      let contactId = state.contact && state.contact.id;
      if (!contactId) {
        const up = await sb().from('wa_contacts').upsert({ wa_phone_e164: e164, display_name: clientLabel(state.client), updated_at: new Date().toISOString() }, { onConflict: 'wa_phone_e164' }).select('id, wa_phone_e164, display_name').single();
        if (up.error) throw up.error;
        state.contact = up.data; contactId = up.data.id;
      }
      // 2) conversation (client + site) si absente
      const ins = await sb().from('wa_conversations').insert({ contact_id: contactId, wa_business: Number(state.waBusiness) }).select('id, contact_id, wa_business, last_inbound_at, last_message_at, last_message_preview').single();
      if (ins.error) throw ins.error;
      state.conv = ins.data;
      // 3) template premier contact
      state.sending = false;
      await sendTemplate('premier_contact');
      subscribe();
    } catch (e) { console.error('[wa] firstContact', e); state.sending = false; state.error = e.message || String(e); render(); }
  }

  async function sendTemplate(mode) {
    if (!state.conv || state.sending) return;
    const u = me();
    const p1 = ((state.client && (state.client.PRENOM || state.client.NOM)) || clientLabel(state.client) || 'Bonjour').toString().trim();
    const p2 = ((u.prenom || u.nomComplet || u.nom || 'votre conseiller').toString().split(' ')[0] || 'votre conseiller').trim();
    const p3 = (state.concession || 'notre concession').toString().trim();
    state.sending = true; render();
    try {
      const r = await fetch(SUPABASE_URL + '/functions/v1/wa-send-text', {
        method: 'POST', headers: { 'Content-Type': 'application/json', apikey: anonKey(), Authorization: 'Bearer ' + (await authToken()) },
        body: JSON.stringify({ conversation_id: state.conv.id, to_phone_e164: toE164(state.client && state.client.TEl_MOB), template_mode: mode, template_param_1: p1, template_param_2: p2, template_param_3: p3 })
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error((j.error || '') + ' ' + JSON.stringify(j.details || ''));
      state.sending = false; render(); loadThread();
    } catch (e) { console.error('[wa] sendTemplate', e); state.sending = false; state.error = e.message || String(e); render(); }
  }

  function pickFile() {
    const inp = doc.createElement('input'); inp.type = 'file'; inp.accept = 'image/*,video/*,audio/*,application/pdf,.doc,.docx,.xls,.xlsx';
    inp.onchange = () => { const f = inp.files && inp.files[0]; if (f) sendAttachment(f); };
    inp.click();
  }
  async function sendAttachment(file) {
    stopDictation();
    if (!state.conv || state.sending) return;
    state.sending = true; render();
    try {
      const fd = new FormData();
      fd.append('conversation_id', state.conv.id);
      fd.append('to_phone_e164', toE164(state.client && state.client.TEl_MOB));
      fd.append('file', file, file.name);
      const r = await fetch(SUPABASE_URL + '/functions/v1/wa-send-attachment', { method: 'POST', headers: { apikey: anonKey(), Authorization: 'Bearer ' + (await authToken()) }, body: fd });
      const j = await r.json().catch(() => ({}));
      if (r.status === 409 || j.error === 'needs_template') { state.sending = false; render(); return; }
      if (!r.ok) throw new Error(j.error || ('HTTP ' + r.status));
      state.sending = false; render(); loadThread();
    } catch (e) { console.error('[wa] sendAttachment', e); state.sending = false; state.error = e.message || String(e); render(); }
  }

  // ---- dictée vocale (Web Speech API, Chrome) ----
  let recog = null;
  function dictSupported() { return !!(win.SpeechRecognition || win.webkitSpeechRecognition); }
  function stopDictation() { state.dictating = false; state.dictFinal = null; try { if (recog) { recog.onend = null; recog.stop(); } } catch (e) { } recog = null; }
  function toggleDictation() {
    if (state.dictating) { try { recog && recog.stop(); } catch (e) { } return; }
    const SR = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SR) { alert('La dictée vocale n\'est pas disponible sur ce navigateur.'); return; }
    recog = new SR();
    recog.lang = 'fr-FR'; recog.interimResults = true; recog.continuous = true;
    const base = state.input ? (state.input.replace(/\s+$/, '') + ' ') : '';
    recog.onresult = (e) => {
      let finalTxt = '', interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const t = e.results[i][0].transcript;
        if (e.results[i].isFinal) finalTxt += t; else interim += t;
      }
      if (finalTxt) state.dictFinal = (state.dictFinal || base) + finalTxt + ' ';
      state.input = ((state.dictFinal || base) + interim).replace(/\s+/g, ' ');
      const el = getRoot() && getRoot().querySelector('.wa-inp');
      if (el) { el.value = state.input; el.style.height = 'auto'; el.style.height = Math.min(96, el.scrollHeight) + 'px'; }
      syncSendBtn(getRoot());
    };
    recog.onerror = () => { state.dictating = false; state.dictFinal = null; recog = null; render(); };
    recog.onend = () => { state.dictating = false; state.dictFinal = null; recog = null; render(); };
    state.dictFinal = base; state.dictating = true;
    try { recog.start(); } catch (e) { }
    render();
  }

  let mediaRec = null, mediaChunks = [];
  async function toggleRecord() {
    if (state.recording) { try { mediaRec && mediaRec.stop(); } catch (e) { } return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaChunks = []; mediaRec = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRec.ondataavailable = (e) => { if (e.data.size) mediaChunks.push(e.data); };
      mediaRec.onstop = () => { stream.getTracks().forEach(t => t.stop()); state.recording = false; render(); const blob = new Blob(mediaChunks, { type: 'audio/webm' }); if (blob.size > 1000) sendAudio(blob); };
      mediaRec.start(); state.recording = true; render();
    } catch (e) { console.warn('[wa] micro', e); alert('Micro indisponible'); }
  }
  async function sendAudio(blob) {
    stopDictation();
    if (!state.conv) return;
    state.sending = true; render();
    try {
      const fd = new FormData();
      fd.append('conversation_id', state.conv.id);
      fd.append('to_phone_e164', toE164(state.client && state.client.TEl_MOB));
      fd.append('file', blob, 'voice_' + Date.now() + '.webm');
      const r = await fetch(SUPABASE_URL + '/functions/v1/wa-send-audio', { method: 'POST', headers: { apikey: anonKey(), Authorization: 'Bearer ' + (await authToken()) }, body: fd });
      const j = await r.json().catch(() => ({}));
      if (r.status === 409) { state.sending = false; render(); return; }
      if (!r.ok) throw new Error(j.error || ('HTTP ' + r.status));
      state.sending = false; render(); loadThread();
    } catch (e) { console.error('[wa] sendAudio', e); state.sending = false; state.error = e.message || String(e); render(); }
  }

  /* ---- pieces jointes : URL signees ----
     Le bucket wa-attachments est PRIVE, et c'est voulu : il contient des
     documents de clients. Cote serveur, getPublicUrl() fabriquait pourtant une
     adresse /object/public/... sans jamais echouer ; cette adresse repond
     NoSuchBucket. Resultat : aucune piece jointe -- image, video, vocal ou
     document -- ne s'affichait dans One Data, alors que le client les recevait
     parfaitement. Constate le 06/10/2026.
     On demande donc une URL signee a l'affichage, et on la garde en cache. */
  const attCache = win.__waAttCache || (win.__waAttCache = new Map());
  async function attUrl(id) {
    if (!id) return '';
    const hit = attCache.get(id);
    if (hit && hit.exp > Date.now()) return hit.url;
    try {
      const r = await fetch(SUPABASE_URL + '/functions/v1/wa-attachment-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: anonKey(), Authorization: 'Bearer ' + (await authToken()) },
        body: JSON.stringify({ attachment_id: id })
      });
      const j = await r.json().catch(function () { return null; });
      if (!r.ok || !j || !j.url) return '';
      // On expire 5 min avant le serveur : une URL morte afficherait un lecteur vide.
      const ttl = Math.max(60, (j.expire_dans || 3600) - 300) * 1000;
      attCache.set(id, { url: j.url, exp: Date.now() + ttl });
      return j.url;
    } catch (e) { return ''; }
  }
  async function hydrateAtt(root) {
    const els = Array.prototype.slice.call(root.querySelectorAll('[data-wa-att]'));
    if (!els.length) return;
    const ids = [];
    els.forEach(function (e) { const i = e.getAttribute('data-wa-att'); if (i && ids.indexOf(i) < 0) ids.push(i); });
    const urls = {};
    await Promise.all(ids.map(async function (i) { urls[i] = await attUrl(i); }));
    els.forEach(function (el) {
      const u = urls[el.getAttribute('data-wa-att')];
      el.removeAttribute('data-wa-att');
      if (!u) { el.classList.add('wa-att-ko'); el.setAttribute('title', 'Pièce jointe indisponible'); return; }
      if (el.tagName === 'A') el.setAttribute('href', u); else el.setAttribute('src', u);
    });
  }

  /* ---- rendu d'un message ---- */
  function statusTicks(it) {
    if (it.direction !== 'out') return '';
    const st = (it.last_status || '').toLowerCase();
    const blue = st === 'read';
    const single = st === 'sent';
    const color = blue ? '#53BDEB' : '#8c9296';
    // coche simple (sent) / double-coche espacée (delivered/read)
    // coches type WhatsApp : 1 coche (sent) / 2 coches décalées (delivered/read)
    const single_svg = '<svg viewBox="0 0 12 10" width="15" height="12" fill="none" stroke="' + color + '" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M1 5.4l2.6 2.7L9.6 1.6"/></svg>';
    const double_svg = '<svg viewBox="0 0 16 10" width="19" height="12" fill="none" stroke="' + color + '" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"><path d="M1 5.4l2.6 2.7L9.6 1.6"/><path d="M5.2 5.4l2.6 2.7L13.8 1.6"/></svg>';
    return '<span class="wa-ticks">' + (single ? single_svg : double_svg) + '</span>';
  }
  /* Pastille de document : l'extension sur fond colore, plutot qu'un meme
     pictogramme pour tous les formats. Couleurs de la charte One Data. */
  /* Couleurs de la charte One Data, une par famille de format. */
  const DOC_COULEURS = {
    pdf: '#e24b4a',
    xls: '#3a8d7b', xlsx: '#3a8d7b', xlsm: '#3a8d7b', csv: '#3a8d7b', ods: '#3a8d7b',
    doc: '#2a5ea9', docx: '#2a5ea9', odt: '#2a5ea9', rtf: '#2a5ea9',
    ppt: '#d2941f', pptx: '#d2941f', odp: '#d2941f',
    zip: '#5a72a0', rar: '#5a72a0', '7z': '#5a72a0',
    txt: '#7a98c5', xml: '#7a98c5', json: '#7a98c5'
  };
  function docExt(a) {
    const n = String(a && a.filename || '');
    const m = n.match(/\.([a-z0-9]{1,5})$/i);
    if (m) return m[1].toLowerCase();
    const mt = String(a && a.mime_type || '').toLowerCase();
    if (mt.indexOf('pdf') >= 0) return 'pdf';
    if (mt.indexOf('spreadsheet') >= 0 || mt.indexOf('excel') >= 0) return 'xlsx';
    if (mt.indexOf('wordprocessing') >= 0 || mt.indexOf('msword') >= 0) return 'docx';
    if (mt.indexOf('presentation') >= 0 || mt.indexOf('powerpoint') >= 0) return 'pptx';
    return '';
  }
  /* Feuille avec coin replie, a la couleur du format, l'extension inscrite
     dessus. Volontairement GENERIQUE : les icones d'Acrobat, Word, Excel et
     PowerPoint sont des marques deposees ; One Data etant vendu a des tiers,
     on ne les embarque pas. Le trombone de email.js et contacts.js ne dit que
     \u00ab piece jointe \u00bb ; ici on veut lire le format d'un coup d'oeil. */
  function docBadge(ext) {
    const c = DOC_COULEURS[ext] || '#7a98c5';
    const t = ext ? ext.toUpperCase().slice(0, 4) : '';
    const taille = t.length >= 4 ? 8 : (t.length === 3 ? 9.5 : 11);
    return '<svg class="wa-doc-ex" viewBox="0 0 32 40" width="28" height="35" aria-hidden="true">' +
      '<path d="M4 3a2 2 0 0 1 2-2h12l10 10v26a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z" fill="' + c + '"/>' +
      '<path d="M18 1l10 10h-8a2 2 0 0 1-2-2z" fill="#ffffff" fill-opacity=".42"/>' +
      (t ? '<text x="16" y="29" text-anchor="middle" fill="#ffffff" font-size="' + taille +
           '" font-weight="700" font-family="-apple-system,Segoe UI,Helvetica,Arial,sans-serif" letter-spacing=".3">' +
           esc(t) + '</text>' : '') +
      '</svg>';
  }

  function poids(o) {
    const n = Number(o);
    if (!isFinite(n) || n <= 0) return '';
    if (n < 1024) return n + ' o';
    if (n < 1024 * 1024) return Math.round(n / 1024) + ' Ko';
    return (n / 1048576).toFixed(1).replace('.', ',') + ' Mo';
  }

  function attHtml(it) {
    let atts = it.attachments; try { if (typeof atts === 'string') atts = JSON.parse(atts); } catch (e) { }
    if (!Array.isArray(atts) || !atts.length) return '';
    const a = atts[0];
    const mt = (a.mime_type || a.msg_type || '').toLowerCase();
    const nom = esc(a.filename || 'Document');
    // Aucun src/href ici : hydrateAtt() les posera avec une URL signee.
    // a.public_url n'est volontairement plus lu -- il pointe sur un bucket prive.
    const ex = docExt(a), pds = poids(a.file_size_bytes);
    const corpsDoc = docBadge(ex) + '<span class="wa-doc-tx"><span class="wa-doc-nm">' + nom + '</span>' +
      (pds || ex ? '<span class="wa-doc-sz">' + [ex ? esc(ex.toUpperCase()) : '', pds].filter(Boolean).join(' · ') + '</span>' : '') + '</span>';
    if (!a.id) return '<span class="wa-doc wa-att-ko" title="Pièce jointe sans identifiant">' + corpsDoc + '</span>';
    const d = ' data-wa-att="' + esc(a.id) + '"';
    if (it.msg_type === 'image' || mt.startsWith('image')) return '<a' + d + ' target="_blank" rel="noopener"><img class="wa-media"' + d + ' loading="lazy" alt=""></a>';
    if (it.msg_type === 'video' || mt.startsWith('video')) return '<video class="wa-media"' + d + ' controls preload="metadata"></video>';
    if (it.msg_type === 'audio' || mt.startsWith('audio')) return '<audio class="wa-audio"' + d + ' controls preload="metadata"></audio>';
    return '<a class="wa-doc"' + d + ' target="_blank" rel="noopener">' + corpsDoc + '</a>';
  }
  function bubble(it) {
    const out = it.direction === 'out';
    const media = it.attachment_count > 0 || (it.msg_type && it.msg_type !== 'text') ? attHtml(it) : '';
    const isPlaceholder = /^\[(image|video|audio|document)\]$/i.test((it.body_text || '').trim());
    const text = (it.body_text && !isPlaceholder) ? '<div class="wa-txt">' + esc(it.body_text) + '</div>' : '';
    return '<div class="wa-row ' + (out ? 'out' : 'in') + '"><div class="wa-bubble">' + media + text +
      '<span class="wa-meta">' + fmtTime(it.created_at) + statusTicks(it) + '</span></div></div>';
  }

  /* ---- styles (WhatsApp smartphone) ---- */
  const STYLE = '<style>' +
    '#' + ROOT_ID + '{font-family:-apple-system,"Segoe UI",Helvetica,Arial,sans-serif}' +
    '#' + ROOT_ID + ' *{box-sizing:border-box}' +
    '.wa-att-ko{opacity:.45;filter:grayscale(1);cursor:not-allowed}' +
    '.wa-card{position:fixed;left:24px;bottom:24px;width:min(380px,calc(100vw - 32px));height:min(620px,86vh);background:#efeae2;border-radius:14px;display:flex;flex-direction:column;overflow:hidden;box-shadow:0 18px 52px rgba(0,0,0,.30);z-index:9990}' +
    '.wa-head{display:flex;align-items:center;gap:10px;padding:10px 12px;background:#075E54;color:#fff;flex:0 0 auto;cursor:move;touch-action:none;user-select:none}' +
    '.wa-ava{width:38px;height:38px;border-radius:50%;background:#ffffff2b;display:flex;align-items:center;justify-content:center;font-size:14px;font-weight:700;flex:0 0 auto}' +
    '.wa-hinfo{flex:1;min-width:0}' +
    '.wa-hname{font-size:15px;font-weight:600;line-height:1.2;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.wa-hsub{font-size:12px;color:#cfe9e3;margin-top:1px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.wa-hbtn{background:none;border:none;color:#fff;cursor:pointer;padding:6px;display:flex;border-radius:8px}' +
    '.wa-hbtn:hover{background:#ffffff22}' +
    '.wa-body{flex:1;overflow-y:auto;padding:14px 10px 8px;background-color:#efeae2;background-image:url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' width=\'60\' height=\'60\' viewBox=\'0 0 60 60\'%3E%3Cg fill=\'%23d9d0c6\' fill-opacity=\'0.35\'%3E%3Ccircle cx=\'12\' cy=\'12\' r=\'1.5\'/%3E%3Ccircle cx=\'40\' cy=\'28\' r=\'1.5\'/%3E%3Ccircle cx=\'22\' cy=\'46\' r=\'1.5\'/%3E%3C/g%3E%3C/svg%3E");display:flex;flex-direction:column;gap:2px}' +
    '.wa-daysep{align-self:center;background:#ffffffdd;color:#54656f;font-size:11px;font-weight:600;padding:4px 12px;border-radius:8px;margin:10px 0 6px;box-shadow:0 1px 1px rgba(0,0,0,.06);text-transform:uppercase;letter-spacing:.3px}' +
    '.wa-row{display:flex;margin-top:2px}' +
    '.wa-row.out{justify-content:flex-end}' +
    '.wa-row.in{justify-content:flex-start}' +
    '.wa-bubble{position:relative;max-width:78%;padding:6px 9px 8px;border-radius:9px;font-size:14px;line-height:1.35;color:#111b21;box-shadow:0 1px .5px rgba(0,0,0,.13);word-wrap:break-word}' +
    '.wa-row.out .wa-bubble{background:#d9fdd3;border-top-right-radius:2px}' +
    '.wa-row.in .wa-bubble{background:#fff;border-top-left-radius:2px}' +
    '.wa-txt{white-space:pre-wrap}' +
    '.wa-media{max-width:230px;width:100%;border-radius:7px;display:block;margin-bottom:3px}' +
    '.wa-audio{width:220px;height:38px;margin-bottom:2px}' +
    '.wa-doc{display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(76,175,125,.25);background:rgba(76,175,125,.06);border-radius:8px;padding:7px 12px;text-decoration:none;margin-bottom:3px;max-width:100%}' +
    '.wa-doc-ex{flex:0 0 auto;display:block}' +
    '.wa-doc-tx{display:flex;flex-direction:column;gap:1px;min-width:0}' +
    '.wa-doc-nm{font-size:12.5px;color:#374151;word-break:break-word;line-height:1.3}' +
    '.wa-doc-sz{font-size:11px;color:#9ca3af;letter-spacing:.2px}' +
    '.wa-meta{float:right;font-size:10.5px;color:#667781;margin:6px 0 -3px 8px;display:inline-flex;align-items:center;gap:2px}' +
    '.wa-ticks{display:inline-flex}' +
    '.wa-foot{flex:0 0 auto;display:flex;align-items:flex-end;gap:6px;padding:8px 8px;background:#f0f2f5}' +
    '.wa-inp{flex:1;border:none;border-radius:22px;padding:10px 14px;font-size:14px;color:#111b21;outline:none;resize:none;max-height:96px;font-family:inherit;line-height:1.35;background:#fff;box-shadow:0 1px 1px rgba(0,0,0,.06)}' +
    '.wa-fbtn{width:40px;height:40px;border-radius:50%;border:none;background:none;color:#54656f;cursor:pointer;display:flex;align-items:center;justify-content:center;flex:0 0 auto}' +
    '.wa-fbtn:hover{background:#00000010}' +
    '.wa-send{background:#00a884;color:#fff}' +
    '.wa-send:hover{background:#029b7a}' +
    '.wa-rec{background:#e2493f;color:#fff}' +
    '.wa-dict-on{background:#e2493f;color:#fff;animation:wa-pulse 1.1s ease-in-out infinite}' +
    '@keyframes wa-pulse{0%,100%{opacity:1}50%{opacity:.55}}' +
    '.wa-msg{margin:auto;text-align:center;color:#54656f;font-size:13px;padding:24px}' +
    '.wa-banner{background:#fff6d5;border-top:1px solid #f2e6a8;padding:9px 12px;font-size:12px;color:#7a6a1e;text-align:center}' +
    '.wa-tpl{padding:10px 12px;background:#f0f2f5}' +
    '.wa-tpl-t{font-size:12px;color:#54656f;margin-bottom:8px}' +
    '.wa-tpl-btn{width:100%;border:1px solid #c9d3d9;background:#fff;border-radius:10px;padding:9px 12px;font:inherit;font-size:13px;font-weight:600;color:#075E54;cursor:pointer;margin-bottom:7px;text-align:left}' +
    '.wa-tpl-btn:hover{background:#f6faf9}' +
    '.wa-bar{position:fixed;left:24px;bottom:24px;width:min(300px,calc(100vw - 32px));background:#075E54;color:#fff;border-radius:12px;box-shadow:0 12px 34px rgba(0,0,0,.24);z-index:9990;display:flex;align-items:center;gap:10px;padding:10px 12px;cursor:pointer}' +
    '.wa-spin{display:inline-block;width:15px;height:15px;border:2px solid rgba(255,255,255,.5);border-top-color:#fff;border-radius:50%;animation:wa-spin .7s linear infinite}' +
    '@keyframes wa-spin{to{transform:rotate(360deg)}}' +
    '</style>';

  const IC_CLOSE = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M6 6l12 12M18 6L6 18"/></svg>';
  const IC_MIN = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><path d="M5 12h14"/></svg>';
  const IC_CLIP = '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>';
  const IC_MIC = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3z"/><path fill="none" stroke="currentColor" stroke-width="2" d="M5 11a7 7 0 0 0 14 0M12 18v3"/></svg>';
  const IC_DICT = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v3M9 20h6"/></svg>';
  const IC_SEND = '<svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor"><path d="M2 21l21-9L2 3v7l15 2-15 2z"/></svg>';

  function render() {
    const root = getRoot(); if (!root) return;
    if (!state.open) { root.innerHTML = ''; return; }
    const c = state.client;
    const name = (state.contact && state.contact.display_name) || clientLabel(c);
    const phone = (c && c.TEl_MOB) || '';

    if (state.minimized) {
      root.innerHTML = STYLE + '<div class="wa-bar" data-act="restore"><div class="wa-ava">' + esc(initials(name)) + '</div><div class="wa-hinfo"><div class="wa-hname">' + esc(name) + '</div><div class="wa-hsub">WhatsApp</div></div></div>';
      bind(root); return;
    }

    let bodyHtml;
    if (state.loading) bodyHtml = '<div class="wa-msg">Chargement…</div>';
    else if (!state.conv) bodyHtml = '<div class="wa-msg">Aucune conversation WhatsApp pour ce client.<br><br>Démarre un premier contact via un template ci-dessous.</div>';
    else if (state.error) bodyHtml = '<div class="wa-msg" style="color:#c0392b">Erreur : ' + esc(state.error) + '</div>';
    else if (!state.items.length) bodyHtml = '<div class="wa-msg">Aucun message.</div>';
    else {
      let last = '';
      bodyHtml = state.items.map(it => {
        const d = daySep(it.created_at); let sep = '';
        if (d !== last) { sep = '<div class="wa-daysep">' + d + '</div>'; last = d; }
        return sep + bubble(it);
      }).join('');
    }

    const open24 = windowOpen();
    let footHtml;
    if (state.conv && open24) {
      footHtml = '<div class="wa-foot">' +
        '<button class="wa-fbtn" data-act="attach" title="Joindre">' + IC_CLIP + '</button>' +
        (dictSupported() ? '<button class="wa-fbtn ' + (state.dictating ? 'wa-dict-on' : '') + '" data-act="dict" title="Dictée vocale">' + IC_DICT + '</button>' : '') +
        '<textarea class="wa-inp" data-act="input" rows="1" placeholder="' + (state.dictating ? 'Parlez…' : 'Message') + '">' + esc(state.input) + '</textarea>' +
        (state.sending ? '<button class="wa-fbtn wa-send"><span class="wa-spin"></span></button>'
          : (state.input.trim() ? '<button class="wa-fbtn wa-send" data-act="send">' + IC_SEND + '</button>'
            : '<button class="wa-fbtn ' + (state.recording ? 'wa-rec' : '') + '" data-act="rec" title="Vocal">' + IC_MIC + '</button>')) +
        '</div>';
    } else if (!state.conv) {
      // aucune conversation -> premier contact (création + template premier_contact)
      footHtml = '<div class="wa-tpl"><div class="wa-tpl-t">' + (state.sending ? 'Démarrage…' : 'Aucune conversation. Démarrer par un message d\'accroche :') + '</div>' +
        '<button class="wa-tpl-btn" data-act="firstcontact">👋 Démarrer (premier contact)</button></div>';
    } else {
      // conversation existante mais fenêtre 24h fermée -> ré-engagement
      footHtml = '<div class="wa-banner">Fenêtre 24h fermée — seul un message template peut être envoyé.</div>' +
        '<div class="wa-tpl"><div class="wa-tpl-t">' + (state.sending ? 'Envoi…' : 'Réengager la conversation :') + '</div>' +
        '<button class="wa-tpl-btn" data-tpl="re_engagement_24h">🔄 Relance (ré-engagement)</button>' +
        '</div>';
    }

    const sub = open24 ? 'en ligne · WhatsApp' : (phone || 'WhatsApp');
    root.innerHTML = STYLE + '<div class="wa-card">' +
      '<div class="wa-head"><div class="wa-ava">' + esc(initials(name)) + '</div>' +
      '<div class="wa-hinfo"><div class="wa-hname">' + esc(name) + '</div><div class="wa-hsub">' + esc(sub) + '</div></div>' +
      '<button class="wa-hbtn" data-act="minimize" title="Réduire">' + IC_MIN + '</button>' +
      '<button class="wa-hbtn" data-act="close" title="Fermer">' + IC_CLOSE + '</button></div>' +
      '<div class="wa-body" data-act="scroll">' + bodyHtml + '</div>' + footHtml + '</div>';
    bind(root);
    applyPos(root); makeDraggable(root);
    const body = root.querySelector('.wa-body'); if (body) body.scrollTop = body.scrollHeight;
    hydrateAtt(root);
  }

  function applyPos(root) {
    const card = root.querySelector('.wa-card'); if (!card || !state.pos) return;
    const w = card.offsetWidth || 360, h = card.offsetHeight || 600, vw = win.innerWidth, vh = win.innerHeight;
    const l = Math.max(6, Math.min(state.pos.left, vw - w - 6));
    const t = Math.max(6, Math.min(state.pos.top, vh - h - 6));
    card.style.left = l + 'px'; card.style.top = t + 'px'; card.style.right = 'auto'; card.style.bottom = 'auto';
  }
  function makeDraggable(root) {
    const card = root.querySelector('.wa-card'), head = root.querySelector('.wa-head');
    if (!card || !head) return;
    let sx = 0, sy = 0, sl = 0, st = 0, dragging = false;
    head.addEventListener('pointerdown', (e) => {
      if (e.target.closest('.wa-hbtn')) return;   // pas sur les boutons réduire/fermer
      dragging = true; try { head.setPointerCapture(e.pointerId); } catch (x) { }
      const r = card.getBoundingClientRect();
      card.style.left = r.left + 'px'; card.style.top = r.top + 'px'; card.style.right = 'auto'; card.style.bottom = 'auto';
      sx = e.clientX; sy = e.clientY; sl = r.left; st = r.top; e.preventDefault();
    });
    head.addEventListener('pointermove', (e) => {
      if (!dragging) return;
      const w = card.offsetWidth, h = card.offsetHeight, vw = win.innerWidth, vh = win.innerHeight;
      let nl = Math.max(6, Math.min(sl + (e.clientX - sx), vw - w - 6));
      let nt = Math.max(6, Math.min(st + (e.clientY - sy), vh - h - 6));
      card.style.left = nl + 'px'; card.style.top = nt + 'px';
    });
    const end = (e) => { if (!dragging) return; dragging = false; try { head.releasePointerCapture(e.pointerId); } catch (x) { } state.pos = { left: parseInt(card.style.left, 10), top: parseInt(card.style.top, 10) }; };
    head.addEventListener('pointerup', end);
    head.addEventListener('pointercancel', end);
  }

  function syncSendBtn(root) {
    const holder = root.querySelector('.wa-foot'); if (!holder) return;
    const cur = holder.querySelector('[data-act="send"], [data-act="rec"]');
    const wantSend = !!state.input.trim();
    const isSend = cur && cur.getAttribute('data-act') === 'send';
    if (state.sending) return;
    if (wantSend === isSend) return;
    const btn = doc.createElement('button');
    btn.className = 'wa-fbtn ' + (wantSend ? 'wa-send' : '');
    btn.setAttribute('data-act', wantSend ? 'send' : 'rec');
    btn.title = wantSend ? 'Envoyer' : 'Vocal';
    btn.innerHTML = wantSend ? IC_SEND : IC_MIC;
    btn.onclick = wantSend ? sendText : toggleRecord;
    if (cur) cur.replaceWith(btn); else holder.appendChild(btn);
  }

  function bind(root) {
    root.querySelectorAll('[data-act]').forEach(el => {
      const a = el.getAttribute('data-act');
      if (a === 'close') el.onclick = () => api.close();
      else if (a === 'minimize') el.onclick = () => api.minimize();
      else if (a === 'restore') el.onclick = () => { state.minimized = false; render(); };
      else if (a === 'send') el.onclick = sendText;
      else if (a === 'attach') el.onclick = pickFile;
      else if (a === 'rec') el.onclick = toggleRecord;
      else if (a === 'dict') el.onclick = toggleDictation;
      else if (a === 'firstcontact') el.onclick = startFirstContact;
      else if (a === 'input') {
        el.oninput = (e) => {
          state.input = e.target.value;
          e.target.style.height = 'auto'; e.target.style.height = Math.min(96, e.target.scrollHeight) + 'px';
          // échange bouton micro <-> envoi SANS recréer le textarea (sinon perte de focus)
          syncSendBtn(root);
        };
        el.onkeydown = (e) => {
          if (state.dictating) { stopDictation(); render(); }
          if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendText(); }
        };
        el.onmousedown = () => { if (state.dictating) { stopDictation(); render(); } };
      }
    });
    root.querySelectorAll('[data-tpl]').forEach(el => { el.onclick = () => sendTemplate(el.getAttribute('data-tpl')); });
  }

  /* ---- API ---- */
  const api = {
    open: async (opts) => {
      const c = (opts && opts.client) || readVar(SELECTED_CLIENT_VAR_ID) || {};
      state.client = c; state.open = true; state.minimized = false; state.error = null; state.items = [];
      ensureRoot(); render();
      await resolve(c);
      render();
      if (state.conv) { await loadThread(); subscribe(); }
    },
    close: () => { state.open = false; try { if (state.channel) sb().removeChannel(state.channel); } catch (e) { } state.channel = null; render(); },
    minimize: () => { state.minimized = true; render(); },
    refresh: () => { if (state.open && state.conv) loadThread(); }
  };
  window.__WA_UI__ = api;
}
});
