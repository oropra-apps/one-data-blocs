// ============================================================================
//  PULSE — télémétrie d'usage One Data (OD.define)  v1
//  Module AMBIANT : le socle (v25+) lui crée une ancre invisible, uniquement
//  chez les tenants à qui le registre sert 'pulse'. Persistant, sans rendu.
//
//  Ce qui est mesuré : écrans ouverts, temps ACTIF (onglet visible + geste dans
//  la dernière minute), clics sur les éléments interactifs, clics répétés de
//  frustration, temps de montage des modules, latence des appels Supabase,
//  erreurs JavaScript.
//  Ce qui ne l'est JAMAIS : le contenu des champs, les données clients, les
//  captures d'écran. Les libellés qui ressemblent à un nom propre sont écartés
//  ici, puis l'edge function neutralise emails, téléphones, immatriculations.
//
//  Expose OD.pulse : track(), on(), contexte(), decrire(), jeton(), endpoint…
//  consommé par le module 'retours'.
//  Débrayage local (tests) : localStorage.setItem('od_pulse_off', '1')
// ============================================================================
OD.define('pulse', {
  mount(__anchor, ctx) {
    const VERSION = 2;   // v2 : rien n'est mesuré sur la page de connexion (ancre 'auth')
    const W = window;
    const prev = W.__OD_PULSE__;
    if (prev && prev.v === VERSION) return;          // persistant : une instance par onglet
    if (prev && typeof prev.arreter === 'function') { try { prev.arreter(); } catch (e) {} }

    const LOG = (...a) => console.log('%c[pulse]', 'color:#2a5ea9;font-weight:bold', ...a);
    const CP = (W.OD && OD.cp && OD.cp.url) || 'https://lerofucjmfrrduohnwet.supabase.co';
    const ENDPOINT = CP.replace(/\/$/, '') + '/functions/v1/pulse';
    const tenant = ctx.tenant || OD.tenant;
    const sb = ctx.supabase || OD.supabase;
    const COUPE = (() => { try { return localStorage.getItem('od_pulse_off') === '1'; } catch (e) { return false; } })();

    const FLUSH_MS = 20000;
    const TICK_MS = 5000;
    const INACTIF_MS = 60000;
    const SESSION_IDLE_MS = 30 * 60000;
    const LENT_MS = 1500;
    const MODULES_MUETS = new Set(['pulse', 'retours']);

    const nettoyages = [];
    const ecouter = (cible, type, fn, opts) => { cible.addEventListener(type, fn, opts); nettoyages.push(() => cible.removeEventListener(type, fn, opts)); };

    /* ------------------------------------------------------------ bus local */
    const abonnes = {};
    const on = (evt, cb) => { (abonnes[evt] = abonnes[evt] || new Set()).add(cb); return () => abonnes[evt].delete(cb); };
    const emettre = (evt, d) => { (abonnes[evt] || []).forEach(cb => { try { cb(d); } catch (e) { console.error('[pulse] abonné', evt, e); } }); };

    /* ------------------------------------------------------------ identité */
    // Page de connexion (module 'auth' à l'écran) = hors application, même si une
    // session Supabase encore valide fait remonter un utilisateur : on ne mesure rien.
    const surConnexion = () => !!document.querySelector('[data-od-module="auth"]');
    const utilisateur = () => { try { return !surConnexion() && OD.getUser ? OD.getUser() : null; } catch (e) { return null; } };
    const uidDe = (u) => (u ? String(u.auth_uid || u.ID_User) : null);
    let dernierJeton = null;
    async function jeton() {
      try {
        const { data } = await sb.auth.getSession();
        const t = data && data.session && data.session.access_token;
        if (t) dernierJeton = t;
        return t || null;
      } catch (e) { return dernierJeton; }
    }

    /* ------------------------------------------------------------ session */
    const SKEY = 'od_pulse_session';
    let session = null;
    function uuid() {
      if (crypto.randomUUID) return crypto.randomUUID();
      const b = crypto.getRandomValues(new Uint8Array(16));
      b[6] = (b[6] & 0x0f) | 0x40; b[8] = (b[8] & 0x3f) | 0x80;
      const h = [...b].map(x => x.toString(16).padStart(2, '0')).join('');
      return `${h.slice(0, 8)}-${h.slice(8, 12)}-${h.slice(12, 16)}-${h.slice(16, 20)}-${h.slice(20)}`;
    }
    function sessionCourante(uid) {
      const now = Date.now();
      if (!session) { try { session = JSON.parse(sessionStorage.getItem(SKEY) || 'null'); } catch (e) { session = null; } }
      if (!session || session.uid !== uid || now - session.derniere > SESSION_IDLE_MS) {
        session = { id: uuid(), uid, debut: now, derniere: now };
      }
      session.derniere = now;
      try { sessionStorage.setItem(SKEY, JSON.stringify(session)); } catch (e) {}
      return session;
    }

    /* ------------------------------------------------------------ appareil */
    function appareil() {
      const ua = navigator.userAgent || '';
      const tactile = (navigator.maxTouchPoints || 0) > 0;
      const petit = Math.min(screen.width, screen.height);
      const ipadOS = /Macintosh/.test(ua) && tactile;
      const type = /iPhone|Android.+Mobile|Mobi/.test(ua) ? 'mobile'
        : (/iPad|Tablet|Android/.test(ua) || ipadOS || (tactile && petit >= 600 && petit < 1100)) ? 'tablette' : 'ordinateur';
      const os = /Windows/.test(ua) ? 'Windows' : (/iPhone|iPad/.test(ua) || ipadOS) ? 'iOS' : /Android/.test(ua) ? 'Android'
        : /Mac OS X/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'autre';
      const navigateur = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Firefox\//.test(ua) ? 'Firefox'
        : /Chrome\//.test(ua) ? 'Chrome' : /Safari\//.test(ua) ? 'Safari' : 'autre';
      let pwa = false; try { pwa = matchMedia('(display-mode: standalone)').matches || navigator.standalone === true; } catch (e) {}
      return {
        type, os, navigateur, pwa, ecran: `${innerWidth}x${innerHeight}`,
        reseau: (navigator.connection && navigator.connection.effectiveType) || null,
        langue: navigator.language || null,
      };
    }

    /* ------------------------------------------------------------ file d'attente */
    const file = [];
    const fil = [];            // fil d'Ariane lisible par les retours (40 derniers)
    const erreursRecentes = [];
    function pousser(e) {
      const ev = Object.assign({ ts: new Date().toISOString(), page: pageCourante }, e);
      if (!COUPE && !surConnexion()) {
        file.push(ev);
        if (file.length > 1200) file.splice(0, file.length - 1200);
        if (file.length >= 150) planifierEnvoi(0);
      }
      fil.push({ ts: ev.ts, type: ev.type, page: ev.page, module: ev.module || null, cible: ev.cible || null, duree_ms: ev.duree_ms || null });
      if (fil.length > 40) fil.shift();
    }

    /* ------------------------------------------------------------ pages & temps actif */
    const chemin = () => (location.pathname || '/')
      .replace(/\/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}/gi, '/:id')
      .replace(/\/\d{3,}/g, '/:n')
      .slice(0, 160);
    let pageCourante = chemin();
    let derniereVue = { page: null, ts: 0 };   // anti-doublon de vue de page
    let derniereActivite = Date.now();
    let actifAccumule = 0;

    function viderActif() {
      if (actifAccumule > 0) {
        pousser({ type: 'actif', page: pageCourante, duree_ms: actifAccumule });
        actifAccumule = 0;
      }
    }
    function surveillerPage() {
      const p = chemin();
      if (p === pageCourante) return;
      viderActif();
      const de = pageCourante;
      pageCourante = p;
      if (utilisateur()) { pousser({ type: 'page', page: p, props: { de } }); derniereVue = { page: p, ts: Date.now() }; }
      emettre('page', { page: p, de });
    }
    const marquerActivite = () => { derniereActivite = Date.now(); };
    ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(t => ecouter(document, t, marquerActivite, { capture: true, passive: true }));
    let dernierMouvement = 0;
    ecouter(document, 'mousemove', () => { const n = Date.now(); if (n - dernierMouvement > 2000) { dernierMouvement = n; derniereActivite = n; } }, { capture: true, passive: true });
    ecouter(document, 'scroll', marquerActivite, { capture: true, passive: true });

    const tick = setInterval(() => {
      surveillerPage();
      if (document.visibilityState === 'visible' && Date.now() - derniereActivite < INACTIF_MS && utilisateur()) {
        actifAccumule += TICK_MS;
      }
    }, TICK_MS);
    const tickPage = setInterval(surveillerPage, 700);
    nettoyages.push(() => { clearInterval(tick); clearInterval(tickPage); });

    /* ------------------------------------------------------------ description d'un élément */
    const INTERACTIF = 'button, a[href], [role="button"], [role="tab"], [role="menuitem"], [role="option"], [role="switch"], ' +
      'input[type="checkbox"], input[type="radio"], input[type="submit"], select, summary, label, [data-od-track], [onclick]';

    function libelleSur(el) {
      const track = el.closest && el.closest('[data-od-track]');
      if (track) return track.getAttribute('data-od-track').slice(0, 60);
      const aria = el.getAttribute && (el.getAttribute('aria-label') || el.getAttribute('title'));
      if (aria && aria.length <= 40 && !/\d{3,}|@/.test(aria)) return aria.trim();
      let t = '';
      try { t = (el.innerText || el.value || '').replace(/\s+/g, ' ').trim(); } catch (e) {}
      if (!t || t.length > 32 || /\d|@/.test(t)) return null;
      // Deux mots ou plus à majuscule initiale → probablement un nom de personne : écarté.
      const majuscules = t.split(' ').filter(m => /^[A-ZÀ-Ý]/.test(m)).length;
      if (majuscules >= 2 || /^[A-ZÀ-Ý\s'-]{4,}$/.test(t) && t.includes(' ')) return null;
      return t;
    }
    function selecteurSur(el) {
      let s = el.tagName ? el.tagName.toLowerCase() : '?';
      if (el.id && !/\d{3,}/.test(el.id) && el.id.length < 40) s += '#' + el.id;
      const cls = (typeof el.className === 'string' ? el.className : '').split(/\s+/)
        .filter(c => c && !/\d{2,}|^(is-|has-|active|hover|focus|selected|open|ww-)/.test(c)).slice(0, 2);
      if (cls.length) s += '.' + cls.join('.');
      return s.slice(0, 80);
    }
    function decrire(el) {
      if (!el || el.nodeType !== 1) return null;
      const cible = el.closest ? (el.closest(INTERACTIF) || el) : el;
      const hote = cible.closest && cible.closest('[data-od-module]');
      const libelle = libelleSur(cible);
      const sel = selecteurSur(cible);
      let rect = null;
      try { const r = cible.getBoundingClientRect(); rect = { x: Math.round(r.left), y: Math.round(r.top), l: Math.round(r.width), h: Math.round(r.height) }; } catch (e) {}
      return {
        module: hote ? hote.getAttribute('data-od-module') : null,
        libelle,
        selecteur: sel,
        cible: libelle ? `${libelle} ‹${sel}›` : sel,
        interactif: cible !== el || (el.matches && el.matches(INTERACTIF)),
        rect,
      };
    }

    /* ------------------------------------------------------------ clics & frustration */
    const rafale = [];
    let derniereRage = 0;
    ecouter(document, 'click', (e) => {
      if (!utilisateur()) return;
      const el = e.target;
      if (!el || el.nodeType !== 1) return;
      if (el.closest && el.closest('#od-retours')) return;       // le widget ne se mesure pas lui-même
      const d = decrire(el);
      if (!d || MODULES_MUETS.has(d.module)) return;
      const now = Date.now();
      if (d.interactif) pousser({ type: 'clic', module: d.module, cible: d.cible });

      rafale.push({ t: now, x: e.clientX, y: e.clientY });
      while (rafale.length && now - rafale[0].t > 800) rafale.shift();
      const proches = rafale.filter(c => Math.abs(c.x - e.clientX) < 30 && Math.abs(c.y - e.clientY) < 30);
      if (proches.length >= 3 && now - derniereRage > 2500) {
        derniereRage = now;
        rafale.length = 0;
        pousser({ type: 'rage', module: d.module, cible: d.cible, props: { interactif: !!d.interactif } });
        emettre('rage', { module: d.module, cible: d.cible, libelle: d.libelle, selecteur: d.selecteur, rect: d.rect });
      }
    }, { capture: true, passive: true });

    /* ------------------------------------------------------------ montage des modules */
    function envelopper(key, def) {
      if (!def || def.__pulse || typeof def.mount !== 'function' || MODULES_MUETS.has(key)) return;
      const monter = def.mount;
      def.mount = async function (el, c) {
        const t0 = performance.now();
        try {
          const r = await monter.apply(this, arguments);
          pousser({ type: 'montage', module: key, duree_ms: Math.round(performance.now() - t0), props: { ok: true } });
          emettre('montage', { module: key, ok: true });
          return r;
        } catch (err) {
          const msg = String((err && err.message) || err).slice(0, 240);
          pousser({ type: 'montage', module: key, duree_ms: Math.round(performance.now() - t0), props: { ok: false, err: msg } });
          erreursRecentes.push({ ts: new Date().toISOString(), module: key, msg }); if (erreursRecentes.length > 8) erreursRecentes.shift();
          emettre('erreur', { module: key, msg, genre: 'montage' });
          throw err;
        }
      };
      def.__pulse = true;
    }
    Object.keys(OD.modules || {}).forEach(k => envelopper(k, OD.modules[k]));
    const defineOrigine = OD.define;
    if (!defineOrigine.__pulse) {
      OD.define = function (key, def) { envelopper(key, def); return defineOrigine.call(this, key, def); };
      OD.define.__pulse = true;
      nettoyages.push(() => { OD.define = defineOrigine; });
    }

    /* ------------------------------------------------------------ latence Supabase */
    const hotes = new Set();
    try { hotes.add(new URL(tenant.supabase_url).host); } catch (e) {}
    const api = {};
    function pointDAcces(p) {
      let m;
      if ((m = p.match(/^\/rest\/v1\/rpc\/([^/?]+)/))) return 'rpc:' + m[1];
      if ((m = p.match(/^\/rest\/v1\/([^/?]+)/))) return 'table:' + decodeURIComponent(m[1]);
      if ((m = p.match(/^\/functions\/v1\/([^/?]+)/))) return 'fn:' + m[1];
      if ((m = p.match(/^\/storage\/v1\/object\/(?:public\/|sign\/|authenticated\/)?([^/?]+)/))) return 'storage:' + m[1];
      if ((m = p.match(/^\/auth\/v1\/([^/?]+)/))) return 'auth:' + m[1];
      return null;
    }
    let observateur = null;
    try {
      observateur = new PerformanceObserver((liste) => {
        for (const e of liste.getEntries()) {
          if (e.initiatorType !== 'fetch' && e.initiatorType !== 'xmlhttprequest') continue;
          let u; try { u = new URL(e.name); } catch (x) { continue; }
          if (!hotes.has(u.host)) continue;
          const ep = pointDAcces(u.pathname);
          if (!ep) continue;
          const a = api[ep] || (api[ep] = { n: 0, total: 0, max: 0, lents: 0, echecs: 0 });
          const d = Math.round(e.duration);
          a.n++; a.total += d; a.max = Math.max(a.max, d);
          if (d >= LENT_MS) a.lents++;
          if (typeof e.responseStatus === 'number' && e.responseStatus >= 400) a.echecs++;
        }
      });
      observateur.observe({ type: 'resource', buffered: false });
      nettoyages.push(() => observateur.disconnect());
      ecouter(performance, 'resourcetimingbufferfull', () => { try { performance.clearResourceTimings(); } catch (e) {} });
    } catch (e) { LOG('PerformanceObserver indisponible'); }

    function viderApi() {
      for (const ep of Object.keys(api)) {
        const a = api[ep];
        if (a.n) pousser({ type: 'api', cible: ep, valeur: a.n, duree_ms: a.total, props: { max: a.max, lents: a.lents, echecs: a.echecs } });
        delete api[ep];
      }
    }

    /* ------------------------------------------------------------ erreurs JS */
    const compteErreurs = new Map();
    function erreur(msg, source) {
      msg = String(msg || '').replace(/\s+/g, ' ').slice(0, 280);
      if (!msg || /ResizeObserver loop|Script error\.?$|chrome-extension:|moz-extension:/.test(msg + ' ' + (source || ''))) return;
      const cle = msg + '|' + (source || '');
      const n = (compteErreurs.get(cle) || 0) + 1;
      compteErreurs.set(cle, n);
      if (n > 20) return;
      const hote = document.activeElement && document.activeElement.closest && document.activeElement.closest('[data-od-module]');
      pousser({ type: 'erreur_js', module: hote ? hote.getAttribute('data-od-module') : null, props: { msg, source: source || null } });
      erreursRecentes.push({ ts: new Date().toISOString(), msg, source: source || null }); if (erreursRecentes.length > 8) erreursRecentes.shift();
    }
    ecouter(W, 'error', (e) => {
      const t = e.target;
      if (t && t !== W && (t.src || t.href)) {
        let u = ''; try { const x = new URL(t.src || t.href); u = x.host + x.pathname; } catch (z) {}
        erreur('ressource introuvable', (t.tagName || '').toLowerCase() + ' ' + u.slice(0, 120));
        return;
      }
      erreur(e.message, e.filename ? `${String(e.filename).split('/').pop()}:${e.lineno || 0}` : null);
    }, true);
    ecouter(W, 'unhandledrejection', (e) => {
      const r = e.reason;
      erreur(r && (r.message || r.error_description || r.msg) ? (r.message || r.error_description || r.msg) : String(r), 'promesse');
    });
    // Convention One Data : les modules journalisent « [module] … » — seules ces lignes sont retenues.
    const consoleErreur = console.error;
    if (!consoleErreur.__pulse) {
      const enveloppe = function () {
        try {
          const a0 = arguments[0];
          if (typeof a0 === 'string' && /^\[[\w-]+\]/.test(a0) && !/^\[(pulse|retours|loader)\]/.test(a0)) {
            const detail = [...arguments].slice(1).map(x => (x && x.message) || (typeof x === 'string' ? x : '')).filter(Boolean).join(' ');
            erreur((a0 + ' ' + detail).trim(), 'console');
          }
        } catch (e) {}
        return consoleErreur.apply(this, arguments);
      };
      enveloppe.__pulse = true;
      console.error = enveloppe;
      nettoyages.push(() => { console.error = consoleErreur; });
    }

    /* ------------------------------------------------------------ envoi */
    let minuterie = null;
    let enCours = false;
    let echecs = 0;
    let sondageEnCours = false;
    let uidPrecedent = null;

    function planifierEnvoi(delai) {
      clearTimeout(minuterie);
      minuterie = setTimeout(() => envoyer(false), delai == null ? FLUSH_MS : delai);
    }

    async function envoyer(final, uForce) {
      const u = uForce || utilisateur();
      if (!u || COUPE) { if (!final) planifierEnvoi(); return; }
      viderActif();
      viderApi();
      if (!file.length && !final) { planifierEnvoi(); return; }
      if (enCours && !final) { planifierEnvoi(2000); return; }

      const s = sessionCourante(uidDe(u));
      const lot = file.splice(0, 400);
      const corps = { tenant_id: tenant.id, session: { id: s.id, appareil: appareil() }, events: lot, sondage_ok: !sondageEnCours };

      if (final) {
        if (!dernierJeton || !lot.length) return;
        try {
          const blob = new Blob([JSON.stringify(Object.assign({ jeton: dernierJeton }, corps))], { type: 'text/plain' });
          if (!navigator.sendBeacon(ENDPOINT + '?a=lot', blob)) file.unshift(...lot);
        } catch (e) { file.unshift(...lot); }
        return;
      }

      enCours = true;
      try {
        const t = await jeton();
        if (!t) { file.unshift(...lot); return; }
        const r = await fetch(ENDPOINT + '?a=lot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + t },
          body: JSON.stringify(corps),
          keepalive: JSON.stringify(corps).length < 60000,
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) {
          if (r.status === 403) { LOG('tenant non éligible — collecte suspendue'); file.length = 0; arreter(); return; }
          throw new Error(j.erreur || ('HTTP ' + r.status));
        }
        echecs = 0;
        if (typeof j.non_lus === 'number') emettre('non_lus', j.non_lus);
        if (j.sondage) emettre('sondage', j.sondage);
      } catch (e) {
        echecs++;
        file.unshift(...lot);
        if (file.length > 1200) file.splice(1200);
        if (echecs === 1 || echecs % 10 === 0) console.warn('[pulse] envoi différé :', e.message || e);
      } finally {
        enCours = false;
        planifierEnvoi(echecs ? Math.min(FLUSH_MS * Math.pow(2, echecs), 5 * 60000) : (file.length ? 1000 : FLUSH_MS));
      }
    }

    ecouter(document, 'visibilitychange', () => { if (document.visibilityState === 'hidden') { viderActif(); viderApi(); envoyer(true); } });
    ecouter(W, 'pagehide', () => { viderActif(); viderApi(); envoyer(true); });

    // Changement d'utilisateur dans le même onglet (déconnexion / reconnexion)
    let uPrecedent = null;
    const veille = setInterval(() => {
      const u = utilisateur();
      const uid = uidDe(u);
      if (uid !== uidPrecedent) {
        // Les gestes en attente partent sous l'identité qui les a produits,
        // jamais sous celle de la personne suivante.
        if (uPrecedent) {
          if (dernierJeton) { viderActif(); viderApi(); envoyer(true, uPrecedent); }
          file.length = 0;
        }
        uidPrecedent = uid;
        uPrecedent = u;
        session = null;
        try { sessionStorage.removeItem(SKEY); } catch (e) {}
        if (uid) {
          jeton();
          surveillerPage();   // rattrape une navigation pas encore détectée
          if (!(derniereVue.page === pageCourante && Date.now() - derniereVue.ts < 5000)) {
            pousser({ type: 'page', page: pageCourante, props: { de: null } });
            derniereVue = { page: pageCourante, ts: Date.now() };
          }
          emettre('utilisateur', u);
          planifierEnvoi(3000);
        }
      }
    }, 1000);
    nettoyages.push(() => clearInterval(veille));

    function arreter() {
      clearTimeout(minuterie);
      nettoyages.splice(0).forEach(f => { try { f(); } catch (e) {} });
    }

    /* ------------------------------------------------------------ API publique */
    function contexte() {
      const versions = {};
      try { Object.keys(OD.manifest || {}).forEach(k => { versions[k] = OD.manifest[k].label; }); } catch (e) {}
      const u = utilisateur();
      const monte = [...document.querySelectorAll('[data-od-module][data-od-mounted]')]
        .map(el => el.getAttribute('data-od-module')).filter(k => !MODULES_MUETS.has(k));
      return {
        page: pageCourante,
        url_hote: location.host,
        modules_affiches: [...new Set(monte)],
        appareil: appareil(),
        versions,
        fil: fil.slice(-25),
        erreurs: erreursRecentes.slice(-5),
        session_id: u ? sessionCourante(uidDe(u)).id : null,
        horodatage: new Date().toISOString(),
      };
    }

    const api_publique = {
      v: VERSION,
      endpoint: ENDPOINT,
      coupe: COUPE,
      on,
      emettre,
      jeton,
      decrire,
      contexte,
      sessionId: () => { const u = utilisateur(); return u ? sessionCourante(uidDe(u)).id : null; },
      page: () => pageCourante,
      track(nom, props) {
        if (!nom) return;
        const p = {};
        if (props && typeof props === 'object') Object.keys(props).slice(0, 8).forEach(k => {
          const v = props[k]; if (['string', 'number', 'boolean'].includes(typeof v)) p[k] = v;
        });
        pousser({ type: 'metier', cible: String(nom).slice(0, 80), props: p });
      },
      sondageAffiche(oui) { sondageEnCours = !!oui; },
      envoyerMaintenant: () => envoyer(false),
      arreter,
    };
    OD.pulse = api_publique;
    W.__OD_PULSE__ = api_publique;
    emettre('pret', api_publique);
    try { W.dispatchEvent(new CustomEvent('od-pulse-ready')); } catch (e) {}

    planifierEnvoi(4000);
    LOG(COUPE ? 'prêt (collecte coupée localement)' : 'prêt');
  },
});
