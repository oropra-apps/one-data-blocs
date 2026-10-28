// v13 (29/10/2026) : dictée vocale du corps du message (bouton micro à côté
// du trombone, comme les fenêtres SMS et WhatsApp). Le texte s'insère à
// l'endroit du curseur (sinon avant la signature), le texte provisoire
// s'affiche en grisé pendant que l'on parle. Commandes vocales : « virgule »,
// « point final », « point à la ligne », « point d'interrogation », « point
// d'exclamation », « deux points », « à la ligne », « nouveau paragraphe »
// (« point » seul n'est pas interprété : « faire le point » resterait intact). Majuscule automatique en
// début de phrase. La dictée s'arrête à l'envoi, à la fermeture et dès que
// l'on tape au clavier dans le message.
// v12 (28/10/2026) : bouton « Modèles » dans la barre d'outils — modèles
// gérés dans Administration › Modèles de messages (module `modeles`, chargé à
// la demande). Le modèle remplit l'objet (nouveau message) et le corps, la
// signature et un éventuel message cité restent en place. Les [données
// manquantes] laissées par le modèle bloquent l'envoi tant qu'elles restent.
// open({ mode, client, subject, body, idLead, trous }).
// v11 (28/10/2026) : sans boîte mail reliée, le panneau Signature l'explique
// (titre « Signature — » vide, boutons sans effet en v10). Le modèle de
// signature ne porte plus de mobile (consigne Team Colin) : le champ Mobile
// disparaît du panneau et n'est plus enregistré. La ligne directe vient du
// poste 3CX du vendeur, côté base.
// v10 (27/10/2026) : signatures — les icônes collées depuis Outlook ne
// s'affichaient pas chez le destinataire.
//  * Outlook bureau colle des images `file:///C:/.../msohtmlclip1/...` (fichier
//    temporaire du poste du vendeur, irrécupérable) et des blocs VML dans des
//    commentaires conditionnels, qu'Outlook bureau du DESTINATAIRE affiche à la
//    place de <img>. OWA / Gmail collent des images en base64, que Gmail
//    n'affiche pas et qui alourdissaient chaque mail jusqu'à 200 Ko.
//  * Au collage et à l'enregistrement : nettoyage (commentaires, balises
//    Office o:p / v:*, attributs on*, images inutilisables retirées avec un
//    avis) puis hébergement des images base64 par `email-signature-assets`
//    (adresse https publique, dédoublonnée par empreinte). Les liens autour des
//    icônes (Facebook, Instagram, LinkedIn, tel:, mailto:) sont conservés.
//  * « Appliquer le modèle » : signature générée par la base
//    (email_signature_modele_rendu) avec la fonction saisie. Le
//    bloc n'apparaît que si le locataire a un modèle.
//  * Retrait de la signature dans le corps fait sur le DOM : l'ancienne
//    expression régulière s'arrêtait au premier </div> d'une signature
//    contenant des <div>, et laissait des morceaux dans le message.
//  * Replis pour les locataires sans ces objets SQL : sans colonne
//    signature_champs, sans modèle, sans email-signature-assets (images envoyées
//    par email-attachment-upload dans email-assets, comme avant).
// v9 (27/10/2026) : open({ mode: 'new', client, subject, body }) pré-remplit
// l'objet et le corps (HTML) — modèles proposés par le lead management.
// v8 (27/10/2026) : champs (destinataires, objet, corps) en 16 px sur mobile.
// iPhone : un champ dont le texte fait moins de 16 px déclenche un ZOOM
// automatique de Safari au toucher. La page entière devient alors plus grande que
// l'écran : on peut la faire glisser « derrière » la fenêtre, des barres de
// défilement apparaissent, et les bords (avatar, croix, envoi) sont coupés.
// v7 (27/10/2026) : verrou de la page renforcé pour iPhone (body figé).
// v6 (27/10/2026) : sur mobile, la page ne défile plus derrière la fenêtre e-mail.
// v5 (27/10/2026) : le clavier mobile réduit la page au lieu de la recouvrir :
// la fenêtre e-mail reste entière à l'écran pendant la saisie.
// v4 (27/10/2026) : sur mobile, la fenêtre e-mail tient dans la partie visible
// de l'écran (100dvh) : le bouton d'envoi n'est plus caché par Chrome.
// EMAIL (canal) — module One Data (OD.define) v1 (Lot C) — overlay, ctx.tenant/ctx.supabase
OD.define('email', {
  mount(__anchor, ctx) {
  /* ==========================================================================
     OROPRA — Email UI  ·  window.__EMAIL_UI__ { open, close }
     + window.handleCompose(mode, emailId)  (appelé par les cartes email Contacts)
     - Modale centrée responsive, éditeur rich-text (contenteditable).
     - Expéditeur : email_accounts (par id_user), sélecteur, 1er par défaut.
     - Destinataires To / CC / BCC, objet, corps HTML, pièces jointes.
     - Envoi : RPC enqueue_email -> invoke edge email-send.
     - Répondre / Transférer : charge l'email d'origine (table emails).
     ========================================================================== */
  const SELECTED_CLIENT_VAR_ID = '55490583-c88b-4748-916e-4d203db07742';
  const SELECTED_SITE_VAR_ID = '39fecccf-9296-43b7-b5b6-eadaa928290d';
  const ROOT_ID = 'oropra-email-ui';
  const BUCKET = 'email-attachments';
  const SUPABASE_URL = ctx.tenant.supabase_url;

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
  function readVar(id) { try { return wwLib.wwVariable.getValue(id); } catch (e) { return null; } }
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
  function me() { return (win.oropraUser) || {}; }
  function esc(s) { if (s == null) return ''; return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;'); }
  function clientLabel(c) { if (!c) return ''; const soc = c.idmultivu === 1 || c.idmultivu === '1'; return (soc ? [c.CIVILITE, c.NOM] : [c.CIVILITE, c.PRENOM, c.NOM]).filter(Boolean).join(' ').trim(); }

  const state = window.__emailState || {};
  if (state.open === undefined) state.open = false;
  if (state.mode === undefined) state.mode = 'new';       // new | reply | forward
  if (state.accounts === undefined) state.accounts = [];
  if (state.fromId === undefined) state.fromId = null;
  if (state.toChips === undefined) state.toChips = [];   // {email,name,locked} — À
  if (state.ccChips === undefined) state.ccChips = [];   // {email,name}
  if (state.bccChips === undefined) state.bccChips = [];
  if (state.rcptInput === undefined) state.rcptInput = { field: null, text: '' };
  if (state.sugg === undefined) state.sugg = [];
  if (state.suggIdx === undefined) state.suggIdx = -1;
  if (state.showCc === undefined) state.showCc = false;
  if (state.subject === undefined) state.subject = '';
  if (state.bodyHtml === undefined) state.bodyHtml = '';
  if (state.attachments === undefined) state.attachments = []; // {filename,mime_type,size_bytes,storage_path,is_inline,_uploading}
  if (state.replyToId === undefined) state.replyToId = null;
  if (state.forwardOfId === undefined) state.forwardOfId = null;
  if (state.sending === undefined) state.sending = false;
  if (state.error === undefined) state.error = null;
  if (state.client === undefined) state.client = null;
  if (state.sigOn === undefined) state.sigOn = true;
  if (state.sigPanel === undefined) state.sigPanel = false;
  if (state.sigDraft === undefined) state.sigDraft = '';
  if (state.sigSaving === undefined) state.sigSaving = false;
  if (state.sigAvis === undefined) state.sigAvis = { t: '', g: '' };   // avis du panneau signature
  if (state.sigChamps === undefined) state.sigChamps = {};              // { fonction }
  if (state.sigModele === undefined) state.sigModele = null;            // null = pas encore vérifié
  if (state.sigTravail === undefined) state.sigTravail = 0;             // hébergements en cours
  window.__emailState = state;

  function currentAccount() { return state.accounts.find(a => a.id === state.fromId) || null; }
  function currentSignature() { const a = currentAccount(); return (a && a.signature_html) ? a.signature_html : ''; }
  // Nettoyée à l'injection : une signature enregistrée avant la v10 ne doit
  // pas envoyer d'images file:/cid: ni de blocs VML au destinataire.
  function buildSigBlock() { const sig = nettoyerSignature(currentSignature()).html; return sig ? '<div data-oropra-sig="1"><br>--<br>' + sig + '</div>' : ''; }
  // Retire le bloc signature sur le DOM (une signature contient des <div>).
  function sansSignature(html) {
    const t = doc.createElement('template'); t.innerHTML = html || '';
    t.content.querySelectorAll('[data-oropra-sig]').forEach(n => n.remove());
    return t.innerHTML;
  }
  // (Ré)injecte ou retire la signature selon le toggle, placée avant un éventuel
  // bloc cité (réponse/transfert).
  function applySignature() {
    const ed = getRoot() && getRoot().querySelector('.em-body');
    let html = ed ? ed.innerHTML : state.bodyHtml;
    html = sansSignature(html);
    if (state.sigOn) {
      const sig = buildSigBlock();
      if (sig) {
        const idx = html.indexOf('<blockquote');
        if (idx >= 0) { const cut = html.lastIndexOf('<br><br>', idx); const at = cut >= 0 ? cut : idx; html = html.slice(0, at) + sig + html.slice(at); }
        else { html = html + sig; }
      }
    }
    state.bodyHtml = html; if (ed) ed.innerHTML = html;
  }

  /* ---- signature : nettoyage et hébergement des images (v10) ---- */
  const SIG_FN = '/functions/v1/email-signature-assets';
  const SIG_IMG_MAX = 1500000; // 1,5 Mo par image (même limite que la fonction)
  function srcUtilisable(src) { return /^https?:\/\//i.test(src) || /^data:image\//i.test(src); }
  // Retire de la signature tout ce qui ne survivra pas chez le destinataire.
  // Rend { html, retirees } — retirees = images inutilisables enlevées.
  function nettoyerSignature(html) {
    const t = doc.createElement('template'); t.innerHTML = String(html || '');
    const racine = t.content; let retirees = 0;
    // 1. Commentaires, dont les blocs VML <!--[if gte vml 1]>…<![endif]-->
    const w = doc.createTreeWalker(racine, 128 /* NodeFilter.SHOW_COMMENT */);
    const coms = []; while (w.nextNode()) coms.push(w.currentNode);
    coms.forEach(c => c.remove());
    // 2. Balises sans place dans une signature
    racine.querySelectorAll('style,script,meta,link,title,xml,iframe,object,embed,form,input,button').forEach(n => n.remove());
    // 3. Balises Office à espace de noms (o:p déballée, v:* supprimée) et attributs
    Array.from(racine.querySelectorAll('*')).forEach(el => {
      if (!el.isConnected && !racine.contains(el)) return;
      const tn = el.tagName.toLowerCase();
      if (tn.indexOf(':') >= 0) {
        if (tn.indexOf('o:') === 0) el.replaceWith.apply(el, Array.from(el.childNodes)); else el.remove();
        return;
      }
      Array.from(el.attributes).forEach(at => {
        const n = at.name.toLowerCase();
        if (n.indexOf('on') === 0 || n === 'class' || n === 'lang' || n.indexOf(':') >= 0 || n.indexOf('data-') === 0) el.removeAttribute(at.name);
        else if ((n === 'href' || n === 'src') && /^\s*javascript:/i.test(at.value)) el.removeAttribute(at.name);
      });
    });
    // 4. Images : https et data:image seulement ; bordure nulle (icônes en lien)
    racine.querySelectorAll('img').forEach(img => {
      const src = (img.getAttribute('src') || '').trim();
      if (!srcUtilisable(src)) { img.remove(); retirees++; return; }
      ['width', 'height'].forEach(a => { if (img.getAttribute(a) === '0') img.removeAttribute(a); });
      img.setAttribute('border', '0');
      const st = img.getAttribute('style') || '';
      if (!/border\s*:/i.test(st)) img.setAttribute('style', (st.trim() ? st.trim().replace(/;?$/, ';') : '') + 'border:0');
    });
    // 5. Liens vidés par le retrait de leur image
    racine.querySelectorAll('a').forEach(a => {
      if (!a.querySelector('img') && !a.textContent.replace(/ /g, ' ').trim()) a.remove();
    });
    return { html: t.innerHTML.trim(), retirees: retirees };
  }
  function imagesSignature(html) {
    const t = doc.createElement('template'); t.innerHTML = String(html || '');
    let cassees = 0, incrustees = 0;
    t.content.querySelectorAll('img').forEach(i => {
      const s = (i.getAttribute('src') || '').trim();
      if (/^data:image\//i.test(s)) incrustees++; else if (!/^https?:\/\//i.test(s)) cassees++;
    });
    // Images VML d'Outlook (dans des commentaires) : invisibles au DOM, mais cassées
    if (/<v:imagedata[^>]+src="(?:file|cid):/i.test(String(html || ''))) cassees = Math.max(cassees, 1);
    return { cassees: cassees, incrustees: incrustees };
  }
  function msgOutlook(n) {
    return (n > 1 ? n + ' images n\'ont' : '1 image n\'a') + ' pas pu être copiée' + (n > 1 ? 's' : '') +
      ' depuis Outlook : elles n\'existent que sur votre ordinateur et ne s\'afficheraient pas chez vos destinataires. ' +
      (state.sigModele ? 'Utilisez le modèle de votre concession ci-dessus' : 'Réinsérez-les avec le bouton 🖼') + '.';
  }
  function sigEditeur() { return getRoot() && getRoot().querySelector('.em-sig-ed'); }
  // Avis du panneau signature, mis à jour en place (pas de render : l'éditeur garde le curseur)
  function majAvis(texte, genre) {
    state.sigAvis = { t: texte || '', g: genre || '' };
    const el = getRoot() && getRoot().querySelector('.em-sig-avis');
    if (!el) return;
    el.className = 'em-sig-avis' + (state.sigAvis.g ? ' ' + state.sigAvis.g : '');
    el.textContent = state.sigAvis.t;
    el.style.display = state.sigAvis.t ? '' : 'none';
  }
  function dataUrlVersBlob(u) {
    const m = /^data:([^;,]+)(;base64)?,([\s\S]*)$/i.exec(u || ''); if (!m) return null;
    const bin = m[2] ? atob(m[3].replace(/\s+/g, '')) : decodeURIComponent(m[3]);
    const a = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) a[i] = bin.charCodeAt(i);
    return new Blob([a], { type: m[1] });
  }
  // Héberge une liste d'images data: ; rend les adresses dans le même ordre (null = échec).
  async function hebergerListe(sources) {
    try {
      const r = await fetch(SUPABASE_URL + SIG_FN, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', apikey: anonKey(), Authorization: 'Bearer ' + (await authToken()) },
        body: JSON.stringify({ images: sources })
      });
      if (r.ok) { const j = await r.json(); if (j && Array.isArray(j.urls)) return j.urls; }
      throw new Error('HTTP ' + r.status);
    } catch (e) { console.warn('[email] email-signature-assets indisponible, repli', e); }
    // Repli : locataire sans email-signature-assets -> une image à la fois dans email-assets
    const urls = [];
    for (const s of sources) {
      try {
        const b = dataUrlVersBlob(s); if (!b) { urls.push(null); continue; }
        const fd = new FormData();
        fd.append('file', b, 'signature.' + ((b.type.split('/')[1] || 'png').replace('jpeg', 'jpg')));
        fd.append('bucket', 'email-assets'); fd.append('account_id', String(state.fromId || 'acc'));
        const r = await fetch(SUPABASE_URL + '/functions/v1/email-attachment-upload', { method: 'POST', headers: { apikey: anonKey(), Authorization: 'Bearer ' + (await authToken()) }, body: fd });
        const j = await r.json().catch(() => ({}));
        urls.push(r.ok && j.public_url ? j.public_url : null);
      } catch (e) { urls.push(null); }
    }
    return urls;
  }
  // Remplace, dans un conteneur, les images data: par leur adresse hébergée.
  // Une image qui n'a pas pu l'être est retirée. Rend le nombre d'échecs.
  function appliquerAdresses(conteneur, table) {
    let echecs = 0;
    conteneur.querySelectorAll('img').forEach(i => {
      const s = i.getAttribute('src') || '';
      if (!/^data:image\//i.test(s) || !(s in table)) return;
      if (table[s]) i.setAttribute('src', table[s]); else { i.remove(); echecs++; }
    });
    return echecs;
  }
  async function hebergerTable(sources) {
    const uniques = Array.from(new Set(sources)); const table = {};
    if (!uniques.length) return table;
    const urls = await hebergerListe(uniques);
    uniques.forEach((s, k) => { table[s] = urls[k] || null; });
    return table;
  }
  // Héberge les images data: présentes dans l'éditeur de signature. L'éditeur
  // peut être redessiné pendant l'envoi : on relit le nœud vivant à la fin.
  async function hebergerDansEditeur() {
    const ed0 = sigEditeur(); if (!ed0) return;
    const sources = Array.from(ed0.querySelectorAll('img')).map(i => i.getAttribute('src') || '').filter(s => /^data:image\//i.test(s));
    if (!sources.length) return;
    state.sigTravail++;
    if (state.sigAvis.g !== 'warn') majAvis('Préparation des images…', 'info');
    let table = {};
    try { table = await hebergerTable(sources); } finally { state.sigTravail--; }
    const ed = sigEditeur();
    let echecs;
    if (ed) { echecs = appliquerAdresses(ed, table); state.sigDraft = ed.innerHTML; }
    else { const t = doc.createElement('template'); t.innerHTML = state.sigDraft || ''; echecs = appliquerAdresses(t.content, table); state.sigDraft = t.innerHTML; }
    if (echecs) majAvis((echecs > 1 ? echecs + ' images n\'ont' : '1 image n\'a') + ' pas pu être hébergée' + (echecs > 1 ? 's' : '') + ' et a été retirée' + (echecs > 1 ? 's' : '') + ' (format accepté : PNG, JPEG, GIF, WebP, 1,5 Mo maximum).', 'warn');
    else if (state.sigAvis.g === 'info') majAvis('', '');
  }
  // Presse-papiers HTML d'Outlook / Word : le fragment utile est balisé.
  function extraireFragment(html) {
    const m = /<!--StartFragment-->([\s\S]*?)<!--EndFragment-->/i.exec(html);
    if (m) return m[1];
    const b = /<body[^>]*>([\s\S]*)<\/body>/i.exec(html);
    return b ? b[1] : html;
  }
  async function verifierModele() {
    if (state.sigModele !== null) return;
    try {
      const r = await sb().from('email_signature_modele').select('id').eq('actif', true).limit(1);
      state.sigModele = !r.error && (r.data || []).length > 0;
    } catch (e) { state.sigModele = false; }
  }
  function lireChamps() {
    const root = getRoot(); if (!root) return state.sigChamps;
    root.querySelectorAll('[data-sigchamp]').forEach(i => { state.sigChamps[i.getAttribute('data-sigchamp')] = i.value.trim(); });
    return state.sigChamps;
  }
  async function appliquerModele() {
    const a = currentAccount(); if (!a) return;
    const champs = lireChamps();
    majAvis('Génération de la signature…', 'info');
    try {
      const r = await sb().rpc('email_signature_modele_rendu', { p_account_id: a.id, p_champs: { fonction: champs.fonction || '' } });
      if (r.error) throw r.error;
      if (!r.data) { majAvis('Aucun modèle de signature n\'est défini pour votre concession.', 'warn'); return; }
      state.sigDraft = r.data;
      const ed = sigEditeur(); if (ed) ed.innerHTML = r.data;
      majAvis('Modèle appliqué. Vérifiez la signature puis enregistrez.', 'ok');
    } catch (e) { console.error('[email] modele', e); majAvis('Échec de la génération : ' + (e.message || e), 'err'); }
  }
  async function ouvrirPanneauSignature() {
    const a = currentAccount();
    state.sigChamps = Object.assign({}, (a && a.signature_champs) || {});
    const brut = currentSignature();
    const etat = imagesSignature(brut);
    const n = nettoyerSignature(brut);
    state.sigDraft = n.html;
    state.sigAvis = { t: '', g: '' };
    state.sigPanel = true;
    await verifierModele();
    if (n.retirees || etat.cassees) state.sigAvis = { t: msgOutlook(Math.max(n.retirees, etat.cassees)), g: 'warn' };
    render();
    // Anciennes signatures en base64 : hébergées tout de suite, à enregistrer
    if (etat.incrustees) { await hebergerDansEditeur(); if (state.sigAvis.g !== 'warn') majAvis('Les images de votre signature ont été mises en ligne. Enregistrez pour valider.', 'ok'); }
  }

  function parseArr(v) { try { if (Array.isArray(v)) return v; if (typeof v === 'string' && v.trim()) return JSON.parse(v); } catch (e) { } return []; }
  function isEmail(v) { return /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(String(v || '').trim()); }
  function chipsFor(field) { return field === 'to' ? state.toChips : field === 'cc' ? state.ccChips : state.bccChips; }
  function addChip(field, email, name, locked) {
    email = String(email || '').trim(); if (!isEmail(email)) return false;
    const arr = chipsFor(field);
    if (arr.some(c => c.email.toLowerCase() === email.toLowerCase())) return true; // déjà présent
    arr.push({ email: email, name: name || null, locked: !!locked });
    return true;
  }
  function removeChip(field, email) { const arr = chipsFor(field); const i = arr.findIndex(c => c.email === email && !c.locked); if (i >= 0) arr.splice(i, 1); }
  // recherche live USER (nom / prénom / email)
  let suggTimer = null;
  function searchUsers(field, q) {
    clearTimeout(suggTimer);
    suggTimer = setTimeout(async () => {
      const term = q.trim();
      if (term.length < 2) { state.sugg = []; state.suggIdx = -1; paintSugg(field); return; }
      try {
        const or = 'nomComplet.ilike.%' + term + '%,email.ilike.%' + term + '%,nom.ilike.%' + term + '%,prenom.ilike.%' + term + '%';
        const res = await sb().from('USER').select('email, nomComplet, prenom, nom, FONCTION, SITE').or(or).not('email', 'is', null).limit(6);
        const seen = {};
        state.sugg = (res.data || []).filter(u => u.email && !seen[u.email] && (seen[u.email] = 1));
        state.suggIdx = state.sugg.length ? 0 : -1;
      } catch (e) { state.sugg = []; state.suggIdx = -1; }
      paintSugg(field);
    }, 180);
  }
  function suggItemsHtml() {
    return state.sugg.map((u, i) => '<div class="em-sugg-i' + (i === state.suggIdx ? ' sel' : '') + '" data-sugg-email="' + esc(u.email) + '" data-sugg-name="' + esc(u.nomComplet || [u.prenom, u.nom].filter(Boolean).join(' ')) + '">' +
      '<span class="nm">' + esc(u.nomComplet || [u.prenom, u.nom].filter(Boolean).join(' ')) + '</span>' +
      '<span class="em">' + esc(u.email) + '</span>' +
      (u.FONCTION || u.SITE ? '<span class="mt">' + esc([u.FONCTION, u.SITE].filter(Boolean).join(' · ')) + '</span>' : '') +
      '</div>').join('');
  }
  // Met à jour la liste EN PLACE (sans re-render de la modale -> l'input garde le focus)
  function paintSugg(field) {
    const root = getRoot(); if (!root) return;
    const box = root.querySelector('[data-suggbox="' + field + '"]'); if (!box) return;
    if (!state.sugg.length) { box.innerHTML = ''; box.style.display = 'none'; return; }
    box.innerHTML = suggItemsHtml(); box.style.display = 'block';
    box.querySelectorAll('.em-sugg-i').forEach(el => {
      el.addEventListener('mousedown', (e) => {
        e.preventDefault();
        addChip(field, el.getAttribute('data-sugg-email'), el.getAttribute('data-sugg-name'));
        state.rcptInput.text = ''; state.sugg = []; state.suggIdx = -1; render();
      });
    });
  }
  function commitInput(field) {
    const t = state.rcptInput.text.trim();
    if (state.suggIdx >= 0 && state.sugg[state.suggIdx]) { const u = state.sugg[state.suggIdx]; addChip(field, u.email, u.nomComplet || [u.prenom, u.nom].filter(Boolean).join(' ')); }
    else if (isEmail(t)) { addChip(field, t); }
    else return false;
    state.rcptInput.text = ''; state.sugg = []; state.suggIdx = -1; return true;
  }
  function fmtDateFR(d) { const dt = new Date(d); if (isNaN(dt)) return ''; const p = n => String(n).padStart(2, '0'); return p(dt.getDate()) + '/' + p(dt.getMonth() + 1) + '/' + dt.getFullYear() + ' ' + p(dt.getHours()) + ':' + p(dt.getMinutes()); }
  function fmtSize(b) { if (!b) return ''; if (b < 1024) return b + ' o'; if (b < 1048576) return Math.round(b / 1024) + ' Ko'; return (b / 1048576).toFixed(1) + ' Mo'; }

  /* ---- chargement comptes expéditeurs ---- */
  async function loadAccounts() {
    try {
      const uid = me().ID_User;
      const COLS = 'id, email_address, display_name, status, id_site, signature_html';
      let res = await sb().from('email_accounts').select(COLS + ', signature_champs').eq('id_user', Number(uid));
      // Locataire sans la colonne signature_champs (avant la migration du 27/10)
      if (res.error) res = await sb().from('email_accounts').select(COLS).eq('id_user', Number(uid));
      let rows = res.data || [];
      // comptes connectés d'abord
      rows.sort((a, b) => (a.status === 'connected' ? 0 : 1) - (b.status === 'connected' ? 0 : 1));
      state.accounts = rows;
      if (!state.fromId && rows.length) state.fromId = rows[0].id;
    } catch (e) { console.warn('[email] accounts', e); state.accounts = []; }
  }

  /* ---- contexte CRM (client + site + cycle en cours) ---- */
  async function crmContext() {
    const client = state.client || readVar(SELECTED_CLIENT_VAR_ID) || {};
    const idvu = client.IDVu != null ? Number(client.IDVu) : null;
    const site = readVar(SELECTED_SITE_VAR_ID);
    let idCycle = null;
    if (idvu != null) {
      try {
        let q = sb().from('CYCLE_COM').select('id_cycle_com').eq('id_client', idvu).ilike('status', '%Ouvert%').order('id_cycle_com', { ascending: false }).limit(1);
        if (site != null && site !== '') q = q.eq('id_site', Number(site));
        const c = await q.maybeSingle();
        idCycle = c.data ? c.data.id_cycle_com : null;
      } catch (e) { }
    }
    return { id_client: idvu, id_site: site != null && site !== '' ? Number(site) : null, id_cycle_com: idCycle };
  }

  /* ---- reply / forward : charge l'email d'origine ---- */
  async function prefillFrom(emailId, mode) {
    try {
      const res = await sb().from('emails').select('*').eq('id', emailId).maybeSingle();
      const e = res.data; if (!e) return;
      const subj = e.subject || '';
      const quoted = '<br><br><blockquote style="margin:0;border-left:3px solid #d6e2f2;padding-left:12px;color:#5a7196">' +
        'Le ' + fmtDateFR(e.received_at || e.created_at) + ', ' + esc(e.from_name || e.from_email || '') + ' &lt;' + esc(e.from_email || '') + '&gt; a écrit&nbsp;:<br>' +
        (e.body_html || esc(e.body_text || '').replace(/\n/g, '<br>')) + '</blockquote>';
      state.bodyHtml = quoted;
      if (mode === 'reply') {
        state.subject = /^re\s*:/i.test(subj) ? subj : 'Re: ' + subj;
        // répondre : si mail entrant -> à l'expéditeur ; si sortant -> au 1er destinataire
        const rTo = e.direction === 'outbound' ? (parseArr(e.to_emails)[0] || '') : (e.from_email || '');
        if (rTo) addChip('to', rTo, e.from_name, true);
        state.replyToId = emailId; state.forwardOfId = null;
      } else {
        state.subject = /^fwd?\s*:/i.test(subj) ? subj : 'Fwd: ' + subj;
        state.to = ''; state.forwardOfId = emailId; state.replyToId = null;
      }
    } catch (e) { console.warn('[email] prefill', e); }
  }

  /* ---- pièces jointes ---- */
  function pickFiles() {
    const inp = doc.createElement('input'); inp.type = 'file'; inp.multiple = true;
    inp.onchange = () => { Array.from(inp.files || []).forEach(uploadFile); };
    inp.click();
  }
  const MAX_ATT_BYTES = 20 * 1024 * 1024; // 20 Mo par fichier
  async function uploadFile(file) {
    if (file.size > MAX_ATT_BYTES) {
      state.error = 'Fichier trop volumineux : ' + fmtSize(file.size) + ' (max 20 Mo). Privilégiez un lien de partage.';
      render(); return;
    }
    state.error = null; // fichier accepté -> on efface un éventuel warning précédent
    const entry = { filename: file.name, mime_type: file.type || 'application/octet-stream', size_bytes: file.size, storage_path: null, is_inline: false, _uploading: true, _key: Math.random().toString(36).slice(2) };
    state.attachments.push(entry); render();
    try {
      // Le bucket email-attachments est en RLS (service_role only) : on uploade
      // via l'edge function email-attachment-upload plutôt qu'en direct.
      const fd = new FormData();
      fd.append('file', file, file.name);
      fd.append('account_id', String(state.fromId || 'acc'));
      const r = await fetch(SUPABASE_URL + '/functions/v1/email-attachment-upload', {
        method: 'POST', headers: { apikey: anonKey(), Authorization: 'Bearer ' + (await authToken()) }, body: fd
      });
      const j = await r.json().catch(() => ({}));
      if (r.status === 413 || j.error === 'file_too_large') throw new Error('trop volumineux (max 20 Mo)');
      if (!r.ok || !j.ok || !j.storage_path) throw new Error(j.error || ('HTTP ' + r.status));
      entry.storage_path = j.storage_path;
      entry.filename = j.filename || entry.filename;
      entry.mime_type = j.mime_type || entry.mime_type;
      if (j.size_bytes != null) entry.size_bytes = j.size_bytes;
      entry._uploading = false; render();
    } catch (e) {
      console.error('[email] upload', e);
      state.attachments = state.attachments.filter(a => a._key !== entry._key);
      state.error = 'Échec upload ' + file.name + ' : ' + (e.message || e); render();
    }
  }
  function removeAtt(key) { state.attachments = state.attachments.filter(a => a._key !== key); render(); }

  /* ---- envoi ---- */
  async function send() {
    if (state.sending) return;
    stopDictation();
    // committe une saisie en cours éventuelle
    if (state.rcptInput.field && state.rcptInput.text.trim()) commitInput(state.rcptInput.field);
    if (!state.fromId) { state.error = 'Sélectionnez un compte expéditeur.'; render(); return; }
    if (!state.toChips.length) { state.error = 'Ajoutez au moins un destinataire.'; render(); return; }
    if (!state.subject.trim()) { state.error = "L'objet est obligatoire."; render(); return; }
    if (state.attachments.some(a => a._uploading)) { state.error = 'Pièces jointes en cours d\'envoi…'; render(); return; }
    {
      const edc = getRoot() && getRoot().querySelector('.em-body');
      const tr = trousRestants(state.subject + ' ' + (edc ? edc.innerText : ''));
      if (tr.length) { state.error = 'Complétez avant l’envoi : ' + tr.join(', ') + '.'; render(); return; }
    }
    // corps depuis l'éditeur
    const ed = getRoot() && getRoot().querySelector('.em-body'); if (ed) state.bodyHtml = ed.innerHTML;
    state.error = null; state.sending = true; render();
    try {
      const ctx = await crmContext();
      const attForRpc = state.attachments.filter(a => a.storage_path).map(a => ({ filename: a.filename, mime_type: a.mime_type, size_bytes: a.size_bytes, storage_path: a.storage_path, is_inline: false }));
      const { data: emailId, error: rpcErr } = await sb().rpc('enqueue_email', {
        p_account_id: state.fromId,
        p_to_emails: state.toChips.map(c => ({ email: c.email, name: c.name || null })),
        p_cc_emails: state.ccChips.map(c => ({ email: c.email, name: c.name || null })),
        p_bcc_emails: state.bccChips.map(c => ({ email: c.email, name: c.name || null })),
        p_subject: state.subject.trim(),
        p_body_html: state.bodyHtml,
        p_body_text: null,
        p_reply_to_email_id: state.replyToId,
        p_forward_of_email_id: state.forwardOfId,
        p_attachments: attForRpc,
        p_id_client: ctx.id_client,
        p_id_cycle_com: ctx.id_cycle_com,
        p_id_site: ctx.id_site
      });
      if (rpcErr) throw new Error(rpcErr.message);
      if (!emailId) throw new Error("enqueue_email n'a pas retourné d'id.");
      const { data: sendData, error: sendErr } = await sb().functions.invoke('email-send', { body: { email_id: emailId } });
      if (sendErr) throw new Error(sendErr.message);
      if (sendData && sendData.error) throw new Error(sendData.error);
      // succès
      state.sending = false; api.close();
      // rafraîchit Contacts (l'email va apparaître dans la timeline)
      // Invalider le cache SUFFIT : contacts.js s'en apercoit et recharge.
      // On ne vide plus le DOM ici — il restait blanc, personne ne le
      // redessinant tant que le client ne changeait pas (20/10/2026).
      try { if (window.__contactsState) { window.__contactsState.rows = null; } } catch (e) { }
    } catch (e) { console.error('[email] send', e); state.sending = false; state.error = e.message || String(e); render(); }
  }

  /* ---- styles (modale centrée responsive) ---- */
  const STYLE = '<style>' +
    '#' + ROOT_ID + '{font-family:"Nunito Sans",system-ui,sans-serif;color:#1F4A85}' +
    '#' + ROOT_ID + ' *{box-sizing:border-box}' +
    '.em-ov{position:fixed;inset:0;z-index:10001;display:flex;align-items:center;justify-content:center;padding:20px}' +
    '.em-bg{position:absolute;inset:0;background:rgba(20,40,80,.45)}' +
    '.em-box{position:relative;background:#fff;border-radius:16px;width:min(760px,100%);max-height:92vh;display:flex;flex-direction:column;box-shadow:0 24px 60px rgba(20,40,80,.35);overflow:hidden}' +
    '.em-hd{display:flex;align-items:center;justify-content:space-between;padding:14px 18px;background:#eef4fc;border-bottom:1px solid #dbe6f5}' +
    '.em-title{font-size:15px;font-weight:800;color:#1F4A85}' +
    '.em-x{border:none;background:none;font-size:24px;line-height:1;color:#5a7196;cursor:pointer;padding:0 4px}.em-x:hover{color:#1F4A85}' +
    '.em-fields{padding:6px 18px 0}' +
    '.em-row{display:flex;align-items:center;gap:8px;border-bottom:1px solid #eef2f8;padding:8px 0}' +
    '.em-lbl{font-size:12px;font-weight:700;color:#7a98c5;width:52px;flex:0 0 auto}' +
    '.em-in{flex:1;border:none;outline:none;font:inherit;font-size:14px;color:#1F4A85;background:none;min-width:0}' +
    '.em-sel{flex:1;border:none;outline:none;font:inherit;font-size:14px;color:#1F4A85;background:none}' +
    '.em-ccbtn{border:none;background:none;color:#2a5ea9;font:inherit;font-size:12px;font-weight:700;cursor:pointer;flex:0 0 auto;align-self:flex-start;margin-top:3px}' +
    '.em-rcpt{align-items:flex-start;position:relative}' +
    '.em-chips{display:flex;flex-wrap:wrap;gap:5px;flex:1;align-items:center;min-width:0;padding:1px 0}' +
    '.em-chip2{display:inline-flex;align-items:center;gap:5px;background:#eef4fc;border:1px solid #d6e2f2;color:#1F4A85;border-radius:8px;padding:3px 8px;font-size:12.5px;max-width:100%}' +
    '.em-chip2.lock{background:#1F4A85;border-color:#1F4A85;color:#fff}' +
    '.em-chip2 .rmc{border:none;background:none;color:#7a98c5;cursor:pointer;font-size:14px;line-height:1;padding:0}' +
    '.em-chip2 .rmc:hover{color:#e24b4a}' +
    '.em-rcpt-in{border:none;outline:none;flex:1;min-width:130px;font:inherit;font-size:14px;color:#1F4A85;background:none;padding:3px 0}' +
    '.em-sugg{position:absolute;top:100%;left:52px;right:0;background:#fff;border:1px solid #dbe6f5;border-radius:10px;box-shadow:0 12px 30px rgba(20,40,80,.18);z-index:5;margin-top:2px;overflow:hidden;max-height:260px;overflow-y:auto}' +
    '.em-sugg-i{display:flex;flex-direction:column;gap:1px;padding:7px 12px;cursor:pointer}' +
    '.em-sugg-i:hover,.em-sugg-i.sel{background:#eef4fc}' +
    '.em-sugg-i .nm{font-size:13px;font-weight:700;color:#1F4A85}' +
    '.em-sugg-i .em{font-size:12px;color:#5a7196}' +
    '.em-sugg-i .mt{font-size:11px;color:#adc0dd}' +
    '.em-tools{display:flex;flex-wrap:wrap;gap:2px;align-items:center;padding:8px 14px;border-bottom:1px solid #eef2f8;background:#fafcff}' +
    '.em-tb{width:32px;height:30px;border:none;background:none;border-radius:7px;color:#5a7196;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;font-size:15px}' +
    '.em-tb:hover{background:#e6eef8;color:#1F4A85}' +
    '.em-tpl{height:30px;border:1px solid #acc5e4;background:#fff;border-radius:7px;color:#2a5ea9;cursor:pointer;font-size:12.5px;font-weight:600;padding:0 10px;font-family:inherit}' +
    '.em-tpl:hover{background:#eaf0f9}' +
    '.em-tb b,.em-tb i,.em-tb u,.em-tb s{pointer-events:none}' +
    '.em-sep{width:1px;height:20px;background:#dbe6f5;margin:0 4px}' +
    '.em-color{width:22px;height:22px;border:1px solid #dbe6f5;border-radius:6px;padding:0;cursor:pointer;background:#1F4A85}' +
    '.em-body{flex:1;overflow-y:auto;padding:16px 18px;font-size:14px;line-height:1.6;color:#1F4A85;outline:none;min-height:180px}' +
    '.em-body:empty:before{content:attr(data-ph);color:#adc0dd}' +
    '.em-att{display:flex;flex-wrap:wrap;gap:8px;padding:0 18px 10px}' +
    '.em-chip{display:inline-flex;align-items:center;gap:7px;background:#f2f6fc;border:1px solid #dbe6f5;border-radius:9px;padding:6px 10px;font-size:12px;color:#1F4A85;max-width:240px}' +
    '.em-chip .nm{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}' +
    '.em-chip .sz{color:#7a98c5}' +
    '.em-chip .rm{border:none;background:none;color:#adc0dd;cursor:pointer;font-size:16px;line-height:1}.em-chip .rm:hover{color:#e24b4a}' +
    '.em-chip .sp{width:12px;height:12px;border:2px solid #c9dcf3;border-top-color:#2a5ea9;border-radius:50%;animation:em-spin .7s linear infinite}' +
    '@keyframes em-spin{to{transform:rotate(360deg)}}' +
    '.em-ft{display:flex;align-items:center;gap:10px;padding:12px 18px;border-top:1px solid #eef2f8;background:#fafcff;justify-content:space-between;flex-wrap:wrap}' +
    '.em-ft-l,.em-ft-r{display:flex;align-items:center;gap:8px}' +
    '.em-send{background:#1F4A85;color:#fff;border:none;border-radius:10px;padding:10px 20px;font:inherit;font-size:14px;font-weight:700;cursor:pointer;display:inline-flex;align-items:center;gap:8px}' +
    '.em-send:hover{background:#163a6b}.em-send:disabled{opacity:.6;cursor:default}' +
    '.em-dict.on{background:#e24b4a;border-color:#e24b4a;color:#fff;animation:em-pulse 1.1s ease-in-out infinite}' +
    '@keyframes em-pulse{0%,100%{box-shadow:0 0 0 0 rgba(226,75,74,.45)}50%{box-shadow:0 0 0 6px rgba(226,75,74,0)}}' +
    '.em-body .em-dict-tmp{color:#7a9cc4;font-style:italic}' +
    '.em-clip{width:38px;height:38px;border:1px solid #dbe6f5;background:#fff;border-radius:10px;color:#5a7196;cursor:pointer;display:inline-flex;align-items:center;justify-content:center}.em-clip:hover{background:#f2f6fc}' +
    '.em-err{color:#e24b4a;font-size:12.5px;flex:1;min-width:120px}' +
    '.em-cancel{border:none;background:none;color:#7a98c5;font:inherit;font-size:13px;font-weight:600;cursor:pointer}' +
    '.em-spin2{display:inline-block;width:14px;height:14px;border:2px solid rgba(255,255,255,.5);border-top-color:#fff;border-radius:50%;animation:em-spin .7s linear infinite}' +
    '.em-sig-toggle{display:inline-flex;align-items:center;gap:7px;border:none;background:none;font:inherit;font-size:12.5px;font-weight:700;color:#7a98c5;cursor:pointer;padding:4px 6px;border-radius:8px}' +
    '.em-sig-toggle.on{color:#1F4A85}' +
    '.em-sig-toggle .sw{width:30px;height:17px;border-radius:9px;background:#c9d3e3;position:relative;transition:background .15s;flex:0 0 auto}' +
    '.em-sig-toggle.on .sw{background:#2a5ea9}' +
    '.em-sig-toggle .kn{position:absolute;top:2px;left:2px;width:13px;height:13px;border-radius:50%;background:#fff;transition:left .15s}' +
    '.em-sig-toggle.on .kn{left:15px}' +
    '.em-sig-cfg{border:1px solid #dbe6f5;background:#fff;border-radius:8px;width:30px;height:30px;color:#5a7196;cursor:pointer;font-size:14px;display:inline-flex;align-items:center;justify-content:center;line-height:1;padding:0;flex:0 0 auto}.em-sig-cfg:hover{background:#f2f6fc;color:#1F4A85}' +
    '.em-sig-ov{position:fixed;inset:0;background:rgba(20,40,80,.45);display:flex;align-items:center;justify-content:center;padding:20px;z-index:10002}' +
    '.em-sig-box{background:#fff;border-radius:14px;width:min(560px,100%);max-height:80%;display:flex;flex-direction:column;box-shadow:0 18px 44px rgba(20,40,80,.3);overflow:hidden}' +
    '.em-sig-hd{display:flex;align-items:center;justify-content:space-between;padding:12px 16px;background:#eef4fc;border-bottom:1px solid #dbe6f5;font-weight:800;font-size:14px;color:#1F4A85}' +
    '.em-sig-tools{display:flex;flex-wrap:wrap;gap:2px;align-items:center;padding:6px 12px;border-bottom:1px solid #eef2f8;background:#fafcff}' +
    '.em-sig-tb{width:30px;height:28px;border:none;background:none;border-radius:6px;color:#5a7196;cursor:pointer;display:inline-flex;align-items:center;justify-content:center;font-size:14px}' +
    '.em-sig-tb:hover{background:#e6eef8;color:#1F4A85}' +
    '.em-sig-ed{flex:1;min-height:150px;overflow-y:auto;padding:14px 16px;font-size:14px;line-height:1.5;color:#1F4A85;outline:none}' +
    '.em-sig-ed img{max-width:100%}' +
    '.em-sig-ed:empty:before{content:attr(data-ph);color:#adc0dd}' +
    '.em-sig-ft{display:flex;align-items:center;gap:10px;padding:10px 16px;border-top:1px solid #eef2f8;background:#fafcff}' +
    '.em-sig-hint{flex:1;font-size:11.5px;color:#7a98c5}' +
    '.em-sig-mod{padding:10px 16px;border-bottom:1px solid #eef2f8;background:#f7faff}' +
    '.em-sig-mod-t{font-size:12.5px;font-weight:800;color:#1F4A85;margin-bottom:6px}' +
    '.em-sig-mod-t span{font-weight:600;color:#7a98c5;margin-left:6px}' +
    '.em-sig-mod-f{display:flex;flex-wrap:wrap;gap:8px;align-items:flex-end}' +
    '.em-sig-mod-f label{display:flex;flex-direction:column;gap:3px;font-size:11px;font-weight:700;color:#7a98c5;flex:1;min-width:140px}' +
    '.em-sig-mod-f input{border:1px solid #dbe6f5;border-radius:8px;padding:7px 9px;font:inherit;font-size:13px;color:#1F4A85;background:#fff;outline:none}' +
    '.em-sig-mod-f input:focus{border-color:#2a5ea9}' +
    '.em-sig-mod-b{border:1px solid #2a5ea9;background:#fff;color:#2a5ea9;border-radius:9px;padding:8px 12px;font:inherit;font-size:12.5px;font-weight:700;cursor:pointer;flex:0 0 auto}' +
    '.em-sig-mod-b:hover{background:#eef4fc}' +
    '.em-sig-avis{margin:8px 16px 0;padding:8px 11px;border-radius:9px;font-size:12px;line-height:1.45;border:1px solid #dbe6f5;background:#f2f6fc;color:#2a5ea9}' +
    '.em-sig-avis.warn{background:#fff7e8;border-color:#f3d9a8;color:#8a5300}' +
    '.em-sig-avis.ok{background:#eaf6ee;border-color:#bfe3cb;color:#1f6b3a}' +
    '.em-sig-avis.err{background:#fdeeee;border-color:#f3c2c1;color:#b8302f}' +
    '.em-sig-ed a img{border:0}' +
    '@media(max-width:640px){.em-in,.em-body,.em-ov textarea,.em-sig-ed,.em-sig-mod-f input{font-size:16px}.em-ov{padding:0;bottom:auto;height:100vh;height:100dvh}.em-box{width:100%;height:100%;max-height:100%;border-radius:0;padding-bottom:env(safe-area-inset-bottom,0px)}.em-lbl{width:42px}}' +
    '</style>';

  function cmd(c, v) { try { doc.execCommand(c, false, v || null); } catch (e) { } const ed = getRoot() && getRoot().querySelector('.em-body'); if (ed) { state.bodyHtml = ed.innerHTML; ed.focus(); } }

  function toolbar() {
    const tb = (c, label, title, arg) => '<button class="em-tb" title="' + title + '" data-cmd="' + c + '"' + (arg ? ' data-arg="' + arg + '"' : '') + '>' + label + '</button>';
    return '<div class="em-tools">' +
      tb('bold', '<b>B</b>', 'Gras') + tb('italic', '<i>I</i>', 'Italique') + tb('underline', '<u>U</u>', 'Souligné') + tb('strikeThrough', '<s>S</s>', 'Barré') +
      '<span class="em-sep"></span>' +
      tb('justifyLeft', '⯇', 'Aligner à gauche') + tb('justifyCenter', '≡', 'Centrer') + tb('justifyRight', '⯈', 'Aligner à droite') +
      '<span class="em-sep"></span>' +
      tb('insertUnorderedList', '•', 'Liste à puces') + tb('insertOrderedList', '1.', 'Liste numérotée') +
      tb('createLink', '🔗', 'Lien') +
      '<input type="color" class="em-color" title="Couleur du texte" value="#1F4A85">' +
      '<span class="em-sep"></span>' +
      tb('undo', '↶', 'Annuler') + tb('redo', '↷', 'Rétablir') +
      (modelesDispo() ? '<span class="em-sep"></span><button class="em-tpl" data-act="modeles" title="Insérer un modèle">Modèles</button>' : '') +
      '</div>';
  }

  function accountsHtml() {
    if (!state.accounts.length) return '<span class="em-in" style="color:#adc0dd">Aucun compte email connecté</span>';
    if (state.accounts.length === 1) { const a = state.accounts[0]; return '<span class="em-in">' + esc(a.display_name || a.email_address) + ' &lt;' + esc(a.email_address) + '&gt;</span>'; }
    return '<select class="em-sel" data-act="from">' + state.accounts.map(a => '<option value="' + esc(a.id) + '"' + (a.id === state.fromId ? ' selected' : '') + '>' + esc(a.display_name || a.email_address) + ' <' + esc(a.email_address) + '>' + (a.status !== 'connected' ? ' (déconnecté)' : '') + '</option>').join('') + '</select>';
  }

  function chipHtml(field, c) {
    return '<span class="em-chip2' + (c.locked ? ' lock' : '') + '" title="' + esc(c.email) + '">' +
      esc(c.name || c.email) + (c.locked ? '' : '<button class="rmc" data-rmchip="' + field + '|' + esc(c.email) + '">&times;</button>') + '</span>';
  }
  function rcptRow(field, label, extra) {
    const chips = chipsFor(field).map(c => chipHtml(field, c)).join('');
    const active = state.rcptInput.field === field;
    const val = active ? state.rcptInput.text : '';
    return '<div class="em-row em-rcpt"><span class="em-lbl">' + label + '</span>' +
      '<div class="em-chips">' + chips +
      '<input class="em-in em-rcpt-in" data-rcpt="' + field + '" placeholder="' + (chipsFor(field).length ? '' : 'Nom ou email…') + '" value="' + esc(val) + '">' +
      '</div>' + extra +
      '<div class="em-sugg" data-suggbox="' + field + '" style="display:none"></div></div>';
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
  function render() {
    const root = getRoot(); if (!root) return;
    verrouPage('email', !!state.open && (win.innerWidth || 1024) <= 640);
    if (!state.open) { root.innerHTML = ''; return; }
    const title = state.mode === 'reply' ? 'Répondre' : state.mode === 'forward' ? 'Transférer' : 'Nouveau message';
    const attHtml = state.attachments.length ? '<div class="em-att">' + state.attachments.map(a =>
      '<span class="em-chip"><span class="nm">' + esc(a.filename) + '</span>' + (a._uploading ? '<span class="sp"></span>' : '<span class="sz">' + fmtSize(a.size_bytes) + '</span><button class="rm" data-rm="' + a._key + '">&times;</button>') + '</span>'
    ).join('') + '</div>' : '';

    root.innerHTML = STYLE + '<div class="em-ov"><div class="em-bg" data-act="bg"></div><div class="em-box">' +
      '<div class="em-hd"><span class="em-title">' + title + '</span><button class="em-x" data-act="close">&times;</button></div>' +
      '<div class="em-fields">' +
      '<div class="em-row"><span class="em-lbl">De</span>' + accountsHtml() + '</div>' +
      rcptRow('to', 'À', (state.showCc ? '' : '<button class="em-ccbtn" data-act="togglecc">Cc/Cci</button>')) +
      (state.showCc ? rcptRow('cc', 'Cc', '') + rcptRow('bcc', 'Cci', '') : '') +
      '<div class="em-row"><span class="em-lbl">Objet</span><input class="em-in" data-act="subject" placeholder="Objet du message" value="' + esc(state.subject) + '"></div>' +
      '</div>' +
      toolbar() +
      '<div class="em-body" contenteditable="true" data-ph="Rédigez votre message…">' + state.bodyHtml + '</div>' +
      attHtml +
      '<div class="em-ft"><div class="em-ft-l"><button class="em-clip" data-act="attach" title="Joindre un fichier"><svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg></button>' +
      (dictSupported() ? '<button class="em-clip em-dict' + (dict.on ? ' on' : '') + '" data-act="dict" title="' + (dict.on ? 'Arrêter la dictée' : 'Dictée vocale') + '">' + IC_MIC + '</button>' : '') +
      '<button class="em-sig-toggle' + (state.sigOn ? ' on' : '') + '" data-act="sigtoggle" title="Signature automatique"><span class="sw"><span class="kn"></span></span>Signature</button>' +
      '<button class="em-sig-cfg" data-act="sigcfg" title="Paramétrer la signature">&#9998;</button>' +
      '</div>' +
      (state.error ? '<span class="em-err">' + esc(state.error) + '</span>' : '') +
      '<div class="em-ft-r">' +
      '<button class="em-cancel" data-act="close">Annuler</button>' +
      '<button class="em-send" data-act="send"' + (state.sending ? ' disabled' : '') + '>' + (state.sending ? '<span class="em-spin2"></span> Envoi…' : 'Envoyer') + '</button>' +
      '</div>' +
      '</div>' +
      '</div></div>' + sigPanelHtml();
    bind(root);
    if (state.rcptInput.field) {
      const inp = root.querySelector('[data-rcpt="' + state.rcptInput.field + '"]');
      if (inp) { inp.focus(); try { const v = inp.value; inp.value = ''; inp.value = v; } catch (e) { } }
    }
  }

  function sigPanelHtml() {
    if (!state.sigPanel) return '';
    const a = currentAccount(); const who = a ? (a.display_name || a.email_address) : '';
    // Pas de boîte mail reliée : la signature est rattachée à une boîte, il n'y
    // a donc rien à modifier. On le dit au lieu d'afficher un éditeur inerte.
    if (!a) return '<div class="em-sig-ov"><div class="em-sig-box">' +
      '<div class="em-sig-hd"><span>Signature</span><button class="em-x" data-act="sigclose">&times;</button></div>' +
      '<div class="em-sig-avis warn" style="margin:16px">Aucune boîte mail n\'est reliée à votre compte One Data. La signature appartient à une boîte mail : reliez d\'abord votre boîte Outlook ou Gmail, puis revenez ici.</div>' +
      '<div class="em-sig-ft"><span class="em-sig-hint"></span><button class="em-send" data-act="sigclose">Fermer</button></div>' +
      '</div></div>';
    return '<div class="em-sig-ov"><div class="em-sig-box">' +
      '<div class="em-sig-hd"><span>Signature — ' + esc(who) + '</span><button class="em-x" data-act="sigclose">&times;</button></div>' +
      (state.sigModele ? '<div class="em-sig-mod">' +
        '<div class="em-sig-mod-t">Signature de la concession<span>logo, adresse et icônes à jour</span></div>' +
        '<div class="em-sig-mod-f">' +
        '<label>Fonction<input data-sigchamp="fonction" value="' + esc(state.sigChamps.fonction || '') + '" placeholder="Conseiller commercial"></label>' +
        '<button class="em-sig-mod-b" data-act="sigmodele">Appliquer le modèle</button>' +
        '</div></div>' : '') +
      '<div class="em-sig-avis' + (state.sigAvis.g ? ' ' + state.sigAvis.g : '') + '"' + (state.sigAvis.t ? '' : ' style="display:none"') + '>' + esc(state.sigAvis.t) + '</div>' +
      sigToolbar() +
      '<div class="em-sig-ed" contenteditable="true" data-ph="Votre signature…">' + (state.sigDraft || '') + '</div>' +
      '<div class="em-sig-ft"><span class="em-sig-hint">Astuce : la signature s\'ajoute automatiquement si le bouton « Signature » est activé.</span>' +
      '<button class="em-cancel" data-act="sigclose">Annuler</button>' +
      '<button class="em-send" data-act="sigsave"' + (state.sigSaving ? ' disabled' : '') + '>' + (state.sigSaving ? 'Enregistrement…' : 'Enregistrer') + '</button></div>' +
      '</div></div>';
  }

  function sigToolbar() {
    const tb = (c, l, t) => '<button class="em-sig-tb" title="' + t + '" data-sigcmd="' + c + '">' + l + '</button>';
    return '<div class="em-sig-tools">' +
      tb('bold', '<b>B</b>', 'Gras') + tb('italic', '<i>I</i>', 'Italique') + tb('underline', '<u>U</u>', 'Souligné') + tb('strikeThrough', '<s>S</s>', 'Barré') +
      '<span class="em-sep"></span>' +
      tb('justifyLeft', '⯇', 'Aligner à gauche') + tb('justifyCenter', '≡', 'Centrer') + tb('justifyRight', '⯈', 'Aligner à droite') +
      '<span class="em-sep"></span>' +
      tb('insertUnorderedList', '•', 'Liste') + tb('createLink', '🔗', 'Lien') +
      '<input type="color" class="em-sig-color em-color" title="Couleur du texte" value="#1F4A85">' +
      '<span class="em-sep"></span>' +
      tb('image', '🖼', 'Insérer un logo / une image') +
      '</div>';
  }
  function sigCmd(c, v) { const ed = getRoot() && getRoot().querySelector('.em-sig-ed'); if (ed) ed.focus(); try { doc.execCommand(c, false, v || null); } catch (e) { } if (ed) state.sigDraft = ed.innerHTML; }
  function pickSigImage() {
    const inp = doc.createElement('input'); inp.type = 'file'; inp.accept = 'image/*';
    inp.onchange = () => { const f = inp.files && inp.files[0]; if (f) uploadSigImage(f); };
    inp.click();
  }
  // Image insérée (bouton 🖼 ou image seule collée) : posée en data: dans
  // l'éditeur pour un aperçu immédiat, puis hébergée par le même chemin que le
  // collage.
  function uploadSigImage(file) {
    if (!/^image\/(png|jpe?g|gif|webp)$/i.test(file.type || '')) { majAvis('Format non accepté : PNG, JPEG, GIF ou WebP.', 'warn'); return; }
    if (file.size > SIG_IMG_MAX) { majAvis('Image trop lourde (1,5 Mo maximum).', 'warn'); return; }
    const lecteur = new FileReader();
    lecteur.onload = () => {
      const ed = sigEditeur(); if (!ed) return;
      ed.focus();
      try { doc.execCommand('insertHTML', false, '<img src="' + lecteur.result + '" border="0" style="max-width:220px;height:auto;border:0">'); } catch (e) { }
      state.sigDraft = ed.innerHTML;
      hebergerDansEditeur();
    };
    lecteur.onerror = () => majAvis('Lecture de l\'image impossible.', 'err');
    lecteur.readAsDataURL(file);
  }

  async function saveSignature() {
    const a = currentAccount(); if (!a || state.sigSaving) return;
    if (state.sigTravail > 0) { majAvis('Les images sont en cours de mise en ligne, un instant…', 'info'); return; }
    const ed = sigEditeur(); const brut = ed ? ed.innerHTML : (state.sigDraft || '');
    const champs = lireChamps();
    state.sigDraft = brut; state.sigSaving = true; render();
    try {
      // Dernier nettoyage + hébergement (glisser-déposer, saisie manuelle…)
      const n = nettoyerSignature(brut);
      const t = doc.createElement('template'); t.innerHTML = n.html;
      const sources = Array.from(t.content.querySelectorAll('img')).map(i => i.getAttribute('src') || '').filter(s => /^data:image\//i.test(s));
      const echecs = sources.length ? appliquerAdresses(t.content, await hebergerTable(sources)) : 0;
      const html = t.innerHTML.trim();
      const champsPropres = { fonction: champs.fonction || '' };
      let r = await sb().from('email_accounts').update({ signature_html: html, signature_champs: champsPropres }).eq('id', a.id);
      // Locataire sans la colonne signature_champs
      if (r.error && /signature_champs/i.test(r.error.message || '')) r = await sb().from('email_accounts').update({ signature_html: html }).eq('id', a.id);
      if (r.error) throw r.error;
      a.signature_html = html; a.signature_champs = champsPropres;
      state.sigDraft = html; state.sigSaving = false;
      if (n.retirees || echecs) {
        // On garde le panneau ouvert : le vendeur doit savoir ce qui a été retiré
        state.sigAvis = { t: 'Signature enregistrée. ' + ((n.retirees + echecs) > 1 ? (n.retirees + echecs) + ' images inutilisables ont été retirées.' : '1 image inutilisable a été retirée.'), g: 'warn' };
      } else { state.sigPanel = false; state.sigAvis = { t: '', g: '' }; }
      applySignature(); render();
    } catch (e) { console.error('[email] saveSig', e); state.sigSaving = false; state.sigAvis = { t: 'Échec de l\'enregistrement : ' + (e.message || e), g: 'err' }; render(); }
  }

  function bind(root) {
    const on = (sel, ev, fn) => root.querySelectorAll(sel).forEach(el => el.addEventListener(ev, fn));
    on('[data-act="bg"]', 'click', () => { /* clic hors modale : ne ferme pas (évite perte de brouillon) */ });
    on('[data-act="close"]', 'click', () => api.close());
    on('[data-act="send"]', 'click', send);
    on('[data-act="attach"]', 'click', pickFiles);
    on('[data-act="dict"]', 'mousedown', (e) => { e.preventDefault(); memoCurseur(); });
    on('[data-act="dict"]', 'click', (e) => { e.preventDefault(); toggleDictation(); });
    on('[data-act="sigtoggle"]', 'click', () => { state.sigOn = !state.sigOn; applySignature(); render(); });
    on('[data-act="sigcfg"]', 'click', ouvrirPanneauSignature);
    on('[data-act="sigclose"]', 'click', () => { state.sigPanel = false; state.sigAvis = { t: '', g: '' }; render(); });
    on('[data-act="sigsave"]', 'click', saveSignature);
    on('[data-act="sigmodele"]', 'click', appliquerModele);
    on('[data-sigchamp]', 'input', (e) => { state.sigChamps[e.target.getAttribute('data-sigchamp')] = e.target.value; });
    const sed = root.querySelector('.em-sig-ed');
    if (sed) {
      // La saisie était perdue au moindre redessin du panneau
      sed.addEventListener('input', () => { state.sigDraft = sed.innerHTML; });
      sed.addEventListener('paste', (e) => {
        const cd = e.clipboardData; if (!cd) return;
        const html = cd.getData('text/html');
        if (!html) {
          // Image seule (capture d'écran…) ; le texte simple garde le collage natif
          const it = Array.from(cd.items || []).find(x => x.kind === 'file' && /^image\//.test(x.type));
          if (it) { e.preventDefault(); const f = it.getAsFile(); if (f) uploadSigImage(f); }
          return;
        }
        e.preventDefault();
        const n = nettoyerSignature(extraireFragment(html));
        try { doc.execCommand('insertHTML', false, n.html); } catch (er) { }
        state.sigDraft = sed.innerHTML;
        if (n.retirees) majAvis(msgOutlook(n.retirees), 'warn'); else majAvis('', '');
        hebergerDansEditeur();
      });
    }
    root.querySelectorAll('.em-sig-tb').forEach(el => {
      el.addEventListener('mousedown', e => e.preventDefault());
      el.addEventListener('click', () => {
        const c = el.getAttribute('data-sigcmd');
        if (c === 'image') { pickSigImage(); return; }
        if (c === 'createLink') { const u = win.prompt('URL du lien :', 'https://'); if (u) sigCmd('createLink', u); return; }
        sigCmd(c);
      });
    });
    root.querySelectorAll('.em-sig-color').forEach(el => { el.addEventListener('mousedown', e => e.stopPropagation()); el.addEventListener('input', e => sigCmd('foreColor', e.target.value)); });
    on('[data-act="togglecc"]', 'click', () => { state.showCc = true; render(); });
    on('[data-act="from"]', 'change', (e) => { state.fromId = e.target.value; applySignature(); });
    // --- destinataires (chips + autocomplétion) ---
    root.querySelectorAll('[data-rcpt]').forEach(inp => {
      const field = inp.getAttribute('data-rcpt');
      inp.addEventListener('focus', () => { state.rcptInput.field = field; });
      inp.addEventListener('input', (e) => { state.rcptInput = { field: field, text: e.target.value }; searchUsers(field, e.target.value); });
      inp.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowDown') { e.preventDefault(); if (state.sugg.length) { state.suggIdx = (state.suggIdx + 1) % state.sugg.length; paintSugg(field); } }
        else if (e.key === 'ArrowUp') { e.preventDefault(); if (state.sugg.length) { state.suggIdx = (state.suggIdx - 1 + state.sugg.length) % state.sugg.length; paintSugg(field); } }
        else if (e.key === 'Enter' || e.key === ',' || e.key === ';') { e.preventDefault(); if (commitInput(field)) render(); }
        else if (e.key === 'Backspace' && !e.target.value) { const arr = chipsFor(field); for (let i = arr.length - 1; i >= 0; i--) { if (!arr[i].locked) { arr.splice(i, 1); break; } } render(); }
        else if (e.key === 'Escape') { state.sugg = []; state.suggIdx = -1; paintSugg(field); }
      });
      // Le clic sur une suggestion (mousedown) se fait avant ce blur ; on masque
      // juste la liste. Pas d'ajout auto ici (évite les coupures d'adresse).
      inp.addEventListener('blur', () => { setTimeout(() => { const box = getRoot() && getRoot().querySelector('[data-suggbox="' + field + '"]'); if (box) box.style.display = 'none'; }, 200); });
    });
    root.querySelectorAll('[data-rmchip]').forEach(el => { el.addEventListener('click', () => { const parts = el.getAttribute('data-rmchip').split('|'); removeChip(parts[0], parts[1]); render(); }); });
    on('[data-act="subject"]', 'input', (e) => { state.subject = e.target.value; });
    on('[data-rm]', 'click', (e) => removeAtt(e.currentTarget.getAttribute('data-rm')));
    root.querySelectorAll('.em-tb').forEach(el => el.addEventListener('mousedown', e => e.preventDefault()));
    on('.em-tb', 'click', (e) => {
      const c = e.currentTarget.getAttribute('data-cmd');
      if (c === 'createLink') { const url = win.prompt('URL du lien :', 'https://'); if (url) cmd('createLink', url); return; }
      cmd(c);
    });
    on('.em-color', 'input', (e) => cmd('foreColor', e.target.value));
    on('[data-act="modeles"]', 'click', (e) => { e.preventDefault(); choisirModele(); });
    // sauvegarde du corps à la frappe
    const ed = root.querySelector('.em-body'); if (ed) {
      ed.addEventListener('input', () => { state.bodyHtml = ed.innerHTML; });
      ed.addEventListener('keydown', () => { if (dict.on) stopDictation(); });
      ed.addEventListener('mouseup', memoCurseur); ed.addEventListener('keyup', memoCurseur);
    }
  }

  /* ---- Dictée vocale (v13) ---- */
  const IC_MIC = '<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M6 11a6 6 0 0 0 12 0M12 17v3M9 20h6"/></svg>';
  const dict = { on: false, recog: null, range: null };
  function dictSupported() { return !!(win.SpeechRecognition || win.webkitSpeechRecognition); }
  function editeur() { return getRoot() && getRoot().querySelector('.em-body'); }
  // Position du curseur dans le message, gardée au moment où l'on clique le micro.
  function memoCurseur() {
    try {
      const ed = editeur(), sel = (doc.getSelection && doc.getSelection()) || win.getSelection();
      if (ed && sel && sel.rangeCount && ed.contains(sel.getRangeAt(0).startContainer)) dict.range = sel.getRangeAt(0).cloneRange();
    } catch (e) { }
  }
  // Marqueur d'insertion : le texte définitif se place devant, le texte
  // provisoire s'affiche dedans.
  function poserMarqueur(ed) {
    const m = doc.createElement('span'); m.className = 'em-dict-tmp'; m.setAttribute('data-dict', '1');
    let r = dict.range && ed.contains(dict.range.startContainer) ? dict.range : null;
    if (!r) {
      r = doc.createRange();
      const sig = ed.querySelector('[data-oropra-sig]'), cite = ed.querySelector('blockquote');
      const avant = sig || cite;
      if (avant) r.setStartBefore(avant); else { r.selectNodeContents(ed); r.collapse(false); }
    }
    r.collapse(false);
    r.insertNode(m);
    return m;
  }
  // Texte qui précède le marqueur ; un saut de ligne (<br>, début de bloc)
  // compte comme « \n » pour la majuscule et l'espace.
  function texteAvant(m) {
    let p = m.previousSibling;
    while (p && p.nodeType === 3 && !p.nodeValue.length) p = p.previousSibling;
    if (!p || (p.nodeType === 1 && /^(BR|DIV|P|UL|OL|LI|BLOCKQUOTE)$/.test(p.nodeName))) {
      const r0 = doc.createRange(); r0.selectNodeContents(editeur()); r0.setEndBefore(m);
      return r0.toString() ? r0.toString() + '\n' : '';
    }
    const r = doc.createRange(); r.selectNodeContents(editeur()); r.setEndBefore(m);
    return r.toString();
  }
  function ponctuer(t) {
    return (' ' + t + ' ')
      .replace(/\s+point d'interrogation\b/gi, ' ?').replace(/\s+point d'exclamation\b/gi, ' !')
      .replace(/\s+point à la ligne\b/gi, '.\n').replace(/\s+(à la ligne|nouvelle ligne)\b/gi, '\n')
      .replace(/\s+nouveau paragraphe\b/gi, '\n\n')
      .replace(/\s+deux[ -]points\b/gi, ' :').replace(/\s+virgule\b/gi, ',')
      .replace(/\s+point final\b/gi, '.')
      .replace(/[ \t]+\n/g, '\n').replace(/\n[ \t]+/g, '\n')
      .replace(/^ +/, '').replace(/ +$/, '');
  }
  function insererFinal(m, brut) {
    let t = ponctuer(brut);
    if (!t) return;
    const avant = texteAvant(m);
    const debutPhrase = !avant.trim() || /[.!?]\s*$/.test(avant) || /\n\s*$/.test(avant);
    if (debutPhrase) t = t.replace(/^([^\S\n]*)(\p{Ll})/u, (x, a, b) => a + b.toUpperCase());
    t = t.replace(/([.!?]\s+|\n)(\p{Ll})/gu, (x, a, b) => a + b.toUpperCase());
    if (avant && !/[\s\u00a0]$/.test(avant) && !/^[,.:!?\n]/.test(t)) t = ' ' + t;
    if (/^ ?[:!?]/.test(t)) t = '\u00a0' + t.replace(/^ /, '');
    const frag = doc.createDocumentFragment();
    t.split('\n').forEach((ligne, i) => { if (i) frag.appendChild(doc.createElement('br')); if (ligne) frag.appendChild(doc.createTextNode(ligne)); });
    m.parentNode.insertBefore(frag, m);
  }
  function majBoutonDict() {
    const b = getRoot() && getRoot().querySelector('[data-act="dict"]');
    if (b) { b.classList.toggle('on', dict.on); b.title = dict.on ? 'Arrêter la dictée' : 'Dictée vocale'; }
  }
  function nettoyerMarqueur() {
    const ed = editeur(); if (!ed) return;
    ed.querySelectorAll('[data-dict]').forEach(n => n.remove());
    state.bodyHtml = ed.innerHTML;
  }
  function stopDictation() {
    const r = dict.recog; dict.recog = null; dict.on = false;
    if (r) { try { r.onend = null; r.onresult = null; r.onerror = null; r.stop(); } catch (e) { } }
    nettoyerMarqueur(); majBoutonDict();
  }
  function toggleDictation() {
    if (dict.on) { stopDictation(); return; }
    const SR = win.SpeechRecognition || win.webkitSpeechRecognition;
    if (!SR) { state.error = "La dictée vocale n'est pas disponible sur ce navigateur (utilisez Chrome ou Edge)."; render(); return; }
    const ed = editeur(); if (!ed) return;
    ed.querySelectorAll('[data-dict]').forEach(n => n.remove());
    const r = new SR(); r.lang = 'fr-FR'; r.interimResults = true; r.continuous = true;
    r.onresult = (e) => {
      const ed2 = editeur(); if (!ed2) return;
      let m = ed2.querySelector('[data-dict]'); if (!m) m = poserMarqueur(ed2);
      let interim = '';
      for (let i = e.resultIndex; i < e.results.length; i++) {
        const tx = e.results[i][0].transcript;
        if (e.results[i].isFinal) insererFinal(m, tx); else interim += tx;
      }
      m.textContent = interim ? (/\S$/.test(texteAvant(m)) ? ' ' : '') + interim : '';
      state.bodyHtml = ed2.innerHTML;
    };
    r.onerror = (ev) => {
      if (ev && (ev.error === 'not-allowed' || ev.error === 'service-not-allowed')) state.error = 'Le micro est bloqué : autorisez-le pour ce site dans le navigateur.';
      stopDictation(); if (state.error) render();
    };
    r.onend = () => { if (dict.recog === r) stopDictation(); };
    poserMarqueur(ed);
    dict.recog = r; dict.on = true; state.error = null;
    try { r.start(); } catch (e) { stopDictation(); return; }
    majBoutonDict();
  }

  /* ---- Modèles de messages (v12) ---- */
  function odGlobal() { return win.OD || window.OD || null; }
  function modelesDispo() { const o = odGlobal(); return !!(win.__OD_MODELES__ || window.__OD_MODELES__ || (o && o.manifest && o.manifest.modeles && o.manifest.modeles.cdn_url)); }
  function chargerModeles() {
    const api = win.__OD_MODELES__ || window.__OD_MODELES__;
    if (api) return Promise.resolve(api);
    const o = odGlobal(), e = o && o.manifest && o.manifest.modeles;
    if (!e || !e.cdn_url) return Promise.resolve(null);
    if (!window.__odModelesP) window.__odModelesP = new Promise((res) => {
      const sc = document.createElement('script'); sc.src = e.cdn_url; sc.async = true;
      sc.onload = () => res(window.__OD_MODELES__ || win.__OD_MODELES__ || null);
      sc.onerror = () => { window.__odModelesP = null; res(null); };
      document.head.appendChild(sc);
    });
    return window.__odModelesP;
  }
  function trousRestants(t) { return (state.trous || []).filter((l) => String(t || '').indexOf('[' + l + ']') !== -1); }
  async function choisirModele() {
    const api = await chargerModeles();
    if (!api) { state.error = 'Les modèles de messages ne sont pas disponibles.'; render(); return; }
    const ed0 = getRoot() && getRoot().querySelector('.em-body'); if (ed0) state.bodyHtml = ed0.innerHTML;
    const c = state.client || {};
    const m = await api.choisir({ canal: 'email', idClient: c.IDVu, idLead: state.idLead, idSite: readVar(SELECTED_SITE_VAR_ID), contexte: state.idLead ? 'lead' : 'client', doc: doc });
    if (!m) return;
    // Le corps du modèle remplace la saisie ; un message cité (réponse,
    // transfert) reste en dessous, la signature est reposée par applySignature.
    let html = sansSignature(state.bodyHtml || '');
    const q = html.indexOf('<blockquote'), cite = q >= 0 ? html.slice(html.lastIndexOf('<br><br>', q) >= 0 ? html.lastIndexOf('<br><br>', q) : q) : '';
    state.bodyHtml = api.texteHtml(m.corps) + cite;
    if (m.objet && (state.mode === 'new' || !state.subject.trim())) state.subject = m.objet;
    state.trous = m.manquantes || []; state.error = null;
    render();
    applySignature();
  }

  /* ---- API ---- */
  const api = {
    open: async (opts) => {
      opts = opts || {};
      state.open = true; state.error = null; state.sending = false;
      state.mode = opts.mode || 'new';
      state.client = opts.client || readVar(SELECTED_CLIENT_VAR_ID) || null;
      // reset compose
      state.toChips = []; state.ccChips = []; state.bccChips = []; state.rcptInput = { field: null, text: '' }; state.sugg = []; state.suggIdx = -1; state.showCc = false; state.subject = ''; state.bodyHtml = ''; state.attachments = []; state.replyToId = null; state.forwardOfId = null;
      if (state.mode === 'new' && typeof opts.subject === 'string') state.subject = opts.subject;
      if (state.mode === 'new' && typeof opts.body === 'string') state.bodyHtml = opts.body;
      state.idLead = opts.idLead || opts.lead || null;
      state.trous = opts.trous || [];
      ensureRoot(); render();
      await loadAccounts();
      if ((state.mode === 'reply' || state.mode === 'forward') && opts.emailId) { await prefillFrom(opts.emailId, state.mode); }
      else if (state.mode === 'new' && state.client && state.client.EMAIL) { addChip('to', state.client.EMAIL, clientLabel(state.client), true); }
      if (state.sigOn) applySignature();
      render();
      const ed = getRoot() && getRoot().querySelector('.em-body'); if (ed && state.mode === 'reply') { ed.focus(); }
      else { const toi = getRoot() && getRoot().querySelector('[data-act="to"]'); if (toi && !state.to) toi.focus(); }
    },
    close: () => { stopDictation(); state.open = false; render(); }
  };
  window.__EMAIL_UI__ = api;
  // contrat attendu par les cartes email de Contacts
  window.handleCompose = (mode, emailId) => api.open({ mode: mode, emailId: emailId });
}
});
