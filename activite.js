// ============================================================================
//  SUIVI D'ACTIVITÉ v4 (28/10/2026) — un écran par rôle, une question par écran
//  v15 (02/11/2026) : plus aucun pavé beige ou orange pâle (encart Lecture,
//    tuile en alerte, pastilles, zones des graphiques) : fond bleu très pâle et
//    touche orange en liseré. Parcours : pas de rail derrière les barres (la
//    barre Commandes s'arrête où s'arrêtait Simulées). Leads web : la barre
//    reste le taux de RDV de chaque source ; le nombre de leads et de RDV
//    est écrit sous le nom de la source.
//  v14 (02/11/2026) : design One Data sur les quatre onglets, calqué sur
//    Performances. Textes en bleus (#1F4A85 / #2a5ea9 / #7a9cc4, jamais de
//    noir), cartes blanches à bordure fine sans ombre, titres de carte
//    précédés d'un trait de couleur, sélecteurs en boutons bleus. Aucun rouge :
//    l'orange #fac055 signale ce qui demande de l'attention, le vert ce qui va
//    bien. L'anneau devient une tuile « Commandes signées » (chiffre / objectif,
//    pastille %, jauge, projection). Onglet Site : tuiles chiffrées, parcours
//    en barres horizontales avec les chiffres dans les barres (ce qui passe
//    l'étape en plein, ce qui est perdu en orange pâle), « Pourquoi on perd »
//    et « Leads web » en barres simples.
//  v12 (02/11/2026) : « En direct » prend le sélecteur de dates de One Data
//    (le même bouton « 📅 du → au » que partout ailleurs ; le calendrier natif
//    du navigateur ne s'ouvrait pas) : un jour ou une période (act_direct
//    p_au), comparée à la même durée juste avant. Onglet « Site » : l'anneau
//    suit désormais la période choisie (act_site lisait toujours le mois entier
//    de la date de fin, d'où des chiffres différents des vendeurs et de
//    « Anatomie d'une vente ») ; objectif au prorata des jours ouvrés.
//  v11 (02/11/2026) : « En direct » reçoit un sélecteur de jour (Aujourd'hui,
//    Hier, ou un jour passé au calendrier) ; un jour passé est montré en entier
//    et comparé à la journée entière d'il y a 7 jours, sans Pool ni rafraîchissement.
//    act_direct(site, jour) — migration 20261102190000_act_direct_jour.
//    Écran Site : l'anneau (toutes les commandes de la période) et le parcours
//    (commandes issues des opportunités de la période) sont désormais nommés et
//    leur écart expliqué ; colonne « Cdes issues » dans le tableau des vendeurs.
//  v10 (02/11/2026) : écran « En direct » (demande de Julien Faugeras) — la
//    journée en cours d'une concession, pensée pour le téléphone : totaux du
//    jour comparés à la même heure il y a 7 jours (commandes VN transmises TFR,
//    VO validées ou en attente d'approbation ; simulations = devis BACS),
//    fil de la journée, équipe, Pool, rendez-vous à venir, âge des données
//    BACS. Rafraîchi toutes les minutes tant que l'écran est visible.
//    Données : act_direct(site) (migration 20261102020000_act_direct).
//  v8 (29/10/2026) : à côté des raccourcis (Aujourd'hui, 7 jours, Ce mois…), le
//    sélecteur de dates est celui de la gestion des ventes (bouton « 📅 du → au »,
//    calendrier d'un mois, deux clics), sur les écrans Chef, Site et Groupe. Il
//    remplace les deux champs date du point du matin.
//    Vocabulaire BACS : opportunités → simulations → commandes. Chaque écran a
//    un filtre Tous / VN / VO / Pro (paramètre p_univers des fonctions act_*,
//    migration 20261029010000_act_univers_vn_vo_pro) ; chaque opportunité porte
//    sa pastille VN, VO ou Pro.
//
//    Vendeur           « Que dois-je faire aujourd'hui ? »
//    Chef des ventes   « Avec qui, sur quoi, avec quel levier ? » (point du matin)
//    Directeur de site « Le mois se joue-t-il, et où ça fuit ? »
//    Direction         « Quel site, quel écart ? »
//
//  Remplace intégralement la v3 (arbre marque > affaire > site > vendeur,
//  grille jour par jour, comparateur) : elle montrait la même chose à tout le
//  monde sans dire quoi faire.
//
//  Données : fonctions SQL act_* (migration 20261028080000_suivi_activite_roles)
//    act_contexte()              rôle, écrans permis, sites du périmètre
//    act_vendeur(id?, univers?)  journée, opportunités, mois d'un vendeur
//    act_chef(site, deb, fin)    l'équipe d'un site sur une période
//    act_site(sites, deb, fin)   leads, motifs de perte, sources, mois
//    act_entonnoir(sites,d,f,u)  opportunités BACS -> simulations -> commandes
//    act_groupe(deb, fin)        les sites côte à côte
//  Actions : notif_alerter (note au vendeur), ouverture de la fiche client.
//
//  Charte One Data (celle de dashboard.js). Graphiques en SVG dessinés à la
//  largeur réelle de leur bloc : le texte garde sa taille sur tout écran.
//  Le site suit le bus de site (oropra-site-bus.js).
// ============================================================================
OD.define('activite', {
  async mount(__anchor, ctx) {
    __anchor.id = 'act-root';
    const doc = __anchor.ownerDocument || document;
    const FW = () => { try { return (wwLib.getFrontWindow && wwLib.getFrontWindow()) || window; } catch (e) { return window; } };
    const sb = () => ctx.supabase;
  // ==========================================================================
  //  SÉLECTEUR DE PÉRIODE — même dessin que la gestion des ventes (kanban) :
  //  un bouton « 📅 01 oct. → 28 oct. ▾ », un calendrier d'un mois, deux clics
  //  (début puis fin). Copie conforme dans chaque module (aucun chargement
  //  externe) : odPeriodeKit(doc, FW) rend { bouton, ouvrir, fermer, moisEnCours }.
  // ==========================================================================
  function odPeriodeKit(doc, FW) {
    var dehors = null;
    var e = function (s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); };
    var ymd = function (y, m, d) { return y + '-' + String(m + 1).padStart(2, '0') + '-' + String(d).padStart(2, '0'); };
    function style() {
      if (doc.getElementById('od-dp-style')) return;
      var st = doc.createElement('style'); st.id = 'od-dp-style';
      st.textContent = '.od-range{background:#fff;border:1px solid #ece9e1;border-radius:10px;padding:7px 12px;font-family:inherit;font-size:12px;font-weight:700;color:#2a5ea9;cursor:pointer;display:inline-flex;align-items:center;gap:6px;white-space:nowrap;line-height:1.2}'
        + '.od-range:hover{border-color:#2a5ea9}.od-range:disabled{opacity:.6;cursor:default}'
        + '.od-range .od-caret{font-size:10px;color:#888780}'
        + '#od-dp .kan-dp-box{background:#fff;border:1.5px solid #e8eef7;border-radius:12px;box-shadow:0 8px 30px rgba(42,94,169,.18);padding:13px;width:262px;font-family:"Nunito Sans",system-ui,sans-serif}'
        + '#od-dp .kan-dp-head{display:flex;align-items:center;justify-content:space-between;margin-bottom:8px}'
        + '#od-dp .kan-dp-head span{font-size:12px;font-weight:700;color:#2a5ea9;text-transform:capitalize}'
        + '#od-dp .kan-dp-head button{width:26px;height:26px;border:1.5px solid #e8eef7;background:#fff;border-radius:8px;cursor:pointer;color:#2a5ea9;font-size:13px;line-height:1;padding:0}'
        + '#od-dp .kan-dp-head button:hover{background:#f5f8fc}'
        + '#od-dp .kan-dp-grid{display:grid;grid-template-columns:repeat(7,33px);gap:2px}'
        + '#od-dp .kan-dp-dow{font-size:9px;color:#acc5e4;text-align:center;font-weight:800;padding-bottom:3px}'
        + '#od-dp .kan-dp-day{height:29px;line-height:29px;text-align:center;font-size:11px;color:#1F4A85;border-radius:7px;cursor:pointer}'
        + '#od-dp .kan-dp-day:hover{background:#eef4fc}'
        + '#od-dp .kan-dp-day.today{box-shadow:inset 0 0 0 1.5px #acc5e4}'
        + '#od-dp .kan-dp-day.sel{background:#2a5ea9;color:#fff;font-weight:800}'
        + '#od-dp .kan-dp-day.inr{background:#eef4fc}'
        + '#od-dp .kan-dp-day.off{color:#c9d6e8;cursor:default}#od-dp .kan-dp-day.off:hover{background:transparent}'
        + '#od-dp .kan-dp-foot{margin-top:8px;text-align:center;font-size:10px;color:#9bb3d1;font-style:italic}';
      doc.head.appendChild(st);
    }
    function fmt(du, au) {
      var f = function (s) { if (!s) return '?'; var d = new Date(String(s).slice(0, 10) + 'T12:00:00'); return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }); };
      return f(du) + ' → ' + f(au);
    }
    function bouton(du, au, attrs, titre) {
      style();
      return '<button type="button" class="od-range" ' + (attrs || '') + (titre ? ' title="' + e(titre) + '"' : '') + '>📅 <span class="od-range-t">' + e(fmt(du, au)) + '</span> <span class="od-caret">▾</span></button>';
    }
    function fermer() {
      var p = doc.getElementById('od-dp'); if (p) p.remove();
      if (dehors) { doc.removeEventListener('mousedown', dehors, true); dehors = null; }
    }
    // opts.simple : un seul jour (un clic) ; opts.max : dernier jour cliquable (AAAA-MM-JJ).
    function ouvrir(anchor, debut, surChoix, opts) {
      opts = opts || {};
      if (doc.getElementById('od-dp')) { fermer(); return; }
      style();
      var pk = { mois: null, deb: null, fin: null, survol: null };
      var m0 = new Date(String(debut || '').slice(0, 10) + 'T12:00:00'); if (isNaN(m0)) m0 = new Date();
      pk.mois = new Date(m0.getFullYear(), m0.getMonth(), 1);
      var pop = doc.createElement('div'); pop.id = 'od-dp';
      var r = anchor.getBoundingClientRect();
      var largeur = ((FW && FW.innerWidth) || (doc.defaultView && doc.defaultView.innerWidth) || 1200);
      pop.style.cssText = 'position:fixed;z-index:99999;top:' + (r.bottom + 6) + 'px;left:' + Math.max(8, Math.min(r.left, largeur - 280)) + 'px';
      doc.body.appendChild(pop);
      function cal() {
        var y = pk.mois.getFullYear(), m = pk.mois.getMonth(), p1 = new Date(y, m, 1), dec = (p1.getDay() + 6) % 7, nb = new Date(y, m + 1, 0).getDate();
        var auj = new Date(), today = ymd(auj.getFullYear(), auj.getMonth(), auj.getDate()), a = pk.deb, b = pk.fin || pk.survol;
        var lo = a && b ? (a < b ? a : b) : null, hi = a && b ? (a < b ? b : a) : null;
        var h = '<div class="kan-dp-box"><div class="kan-dp-head"><button type="button" data-nav="-1">‹</button><span>' + e(p1.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })) + '</span><button type="button" data-nav="1">›</button></div><div class="kan-dp-grid">';
        ['L', 'M', 'M', 'J', 'V', 'S', 'D'].forEach(function (x) { h += '<span class="kan-dp-dow">' + x + '</span>'; });
        for (var i = 0; i < dec; i++) h += '<span></span>';
        for (var d = 1; d <= nb; d++) {
          var ds = ymd(y, m, d), c = 'kan-dp-day';
          if (ds === today) c += ' today';
          if (opts.max && ds > opts.max) c += ' off';
          if (opts.simple && ds === String(debut || '').slice(0, 10)) c += ' sel';
          if (pk.deb === ds || pk.fin === ds) c += ' sel'; else if (lo && hi && ds > lo && ds < hi) c += ' inr';
          h += '<span class="' + c + '" data-d="' + ds + '">' + d + '</span>';
        }
        return h + '</div><div class="kan-dp-foot">' + (opts.simple ? 'Choisissez un jour' : pk.deb ? 'Cliquez la date de fin' : 'Cliquez la date de début') + '</div></div>';
      }
      function brancher() {
        pop.querySelectorAll('[data-nav]').forEach(function (b) { b.addEventListener('click', function (ev) { ev.stopPropagation(); pk.mois = new Date(pk.mois.getFullYear(), pk.mois.getMonth() + Number(b.getAttribute('data-nav')), 1); peindre(); }); });
        pop.querySelectorAll('.kan-dp-day').forEach(function (c) {
          c.addEventListener('click', function () {
            var ds = c.getAttribute('data-d');
            if (opts.max && ds > opts.max) return;
            if (opts.simple) { fermer(); surChoix(ds, ds); return; }
            if (!pk.deb || pk.fin) { pk.deb = ds; pk.fin = null; pk.survol = null; peindre(); return; }
            pk.fin = ds; var a = pk.deb, b = pk.fin; if (b < a) { var t = a; a = b; b = t; }
            fermer(); surChoix(a, b);
          });
          c.addEventListener('mouseenter', function () { if (opts.simple) return; if (pk.deb && !pk.fin && pk.survol !== c.getAttribute('data-d')) { pk.survol = c.getAttribute('data-d'); peindre(); } });
        });
      }
      function peindre() { pop.innerHTML = cal(); brancher(); }
      peindre();
      dehors = function (ev) { if (!pop.contains(ev.target) && ev.target !== anchor && !anchor.contains(ev.target)) fermer(); };
      setTimeout(function () { doc.addEventListener('mousedown', dehors, true); }, 0);
    }
    function moisEnCours() { var a = new Date(); return { du: ymd(a.getFullYear(), a.getMonth(), 1), au: ymd(a.getFullYear(), a.getMonth(), a.getDate()) }; }
    function boutonJour(libelle, attrs) { style(); return '<button type="button" class="od-range" ' + (attrs || '') + '>📅 <span class="od-range-t">' + e(libelle) + '</span> <span class="od-caret">▾</span></button>'; }
    return { bouton: bouton, boutonJour: boutonJour, ouvrir: ouvrir, fermer: fermer, fmt: fmt, moisEnCours: moisEnCours };
  }
    const DP = odPeriodeKit(doc, FW());
    const SUPABASE_URL = ctx.tenant.supabase_url;

    // L'utilisateur est chargé par le Shell ; en navigation SPA on patiente un peu.
    for (let i = 0; i < 40; i++) {
      let u = FW().oropraUser; if (Array.isArray(u)) u = u[0];
      if (u && u.ID_User != null) break;
      await new Promise(r => setTimeout(r, 250));
    }

    // ------------------------------------------------------------------ état
    const S = window.__act4 || {};
    window.__act4 = S;
    S.ctx = null; S.err = null;
    S.ecran = S.ecran || null;
    S.periode = S.periode || { chef: 'mois', site: 'mois', groupe: 'mois' };
    S.plage = S.plage || null;           // { deb, fin } quand dates libres (chef)
    S.plages = S.plages || {};           // v8 : { chef|site|groupe : { deb, fin } } choisies au calendrier
    S.vendeur = S.vendeur || null;       // vendeur sélectionné au point du matin
    S.univers = S.univers || null;       // 'VN' | 'VO' | 'PRO' | null (tous)
    S.data = {};                         // réponses par clé de chargement
    S.charge = {};

    // ------------------------------------------------------------------ utilitaires
    const esc = s => s == null ? '' : String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const nf = n => Math.round(Number(n) || 0).toLocaleString('fr-FR');
    const eur = n => n == null ? '—' : nf(n) + ' €';
    const keur = n => n == null ? '—' : (Math.abs(n) >= 1e6 ? (Math.round(n / 1e5) / 10).toLocaleString('fr-FR') + ' M€' : Math.abs(n) >= 10000 ? nf(n / 1000) + ' k€' : nf(n) + ' €');
    const pct = (a, b) => b ? Math.round(a / b * 100) : null;
    const pctTxt = (a, b) => { const p = pct(a, b); return p == null ? '—' : p + ' %'; };
    const ymd = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    const auj = () => new Date();
    const plus = (d, n) => { const x = new Date(d); x.setDate(x.getDate() + n); return x; };
    const MOIS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    const JOURS = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
    const prenom = p => (p && (p.prenom || '').split(' ').pop()) || '';
    const initiales = p => ((p.prenom || '').charAt(0) + (p.nom || '').charAt(0)).toUpperCase();
    const nomCourt = p => (prenom(p) + ' ' + (p.nom || '').charAt(0) + '.').trim();
    const plur = (n, s, p) => n + ' ' + (n > 1 ? (p || s + 's') : s);
    const heure = iso => { const d = new Date(iso); return isNaN(d) ? '' : String(d.getHours()).padStart(2, '0') + ':' + String(d.getMinutes()).padStart(2, '0'); };

    // v8 : la période est-elle le mois en cours (1er du mois → aujourd'hui) ?
    function libCourt(b) {
      if (estMois(b)) return MOIS[new Date(b.fin).getMonth()];
      const MC = ['janv.', 'févr.', 'mars', 'avr.', 'mai', 'juin', 'juil.', 'août', 'sept.', 'oct.', 'nov.', 'déc.'], f = x => { const d = new Date(x + 'T12:00:00'); return (d.getDate() === 1 ? '1er' : d.getDate()) + ' ' + MC[d.getMonth()]; };
      return b.deb === b.fin ? f(b.deb) : f(b.deb) + ' → ' + f(b.fin);
    }
    function estMois(b) { const m = bornes('mois'); return b.deb === m.deb && b.fin === m.fin; }
    function bornes(code) {
      const d = auj(), y = d.getFullYear(), m = d.getMonth();
      switch (code) {
        case 'jour': return { deb: ymd(d), fin: ymd(d), lib: "aujourd'hui" };
        case 'hier': { const h = plus(d, -1); return { deb: ymd(h), fin: ymd(h), lib: 'hier' }; }
        case '7j': return { deb: ymd(plus(d, -6)), fin: ymd(d), lib: '7 derniers jours' };
        case 'mois_prec': return { deb: ymd(new Date(y, m - 1, 1)), fin: ymd(new Date(y, m, 0)), lib: MOIS[(m + 11) % 12] };
        case '3mois': return { deb: ymd(new Date(y, m - 2, 1)), fin: ymd(d), lib: '3 derniers mois' };
        case 'annee': return { deb: ymd(new Date(y, 0, 1)), fin: ymd(d), lib: String(y) };
        case 'libre:chef': case 'libre:site': case 'libre:groupe': {
          const p = S.plages[code.slice(6)];
          return p ? { deb: p.deb, fin: p.fin, lib: 'du ' + p.deb.split('-').reverse().join('/') + ' au ' + p.fin.split('-').reverse().join('/') } : bornes('mois');
        }
        case 'libre': return S.plage ? { deb: S.plage.deb, fin: S.plage.fin, lib: 'du ' + S.plage.deb.split('-').reverse().join('/') + ' au ' + S.plage.fin.split('-').reverse().join('/') } : bornes('mois');
        default: return { deb: ymd(new Date(y, m, 1)), fin: ymd(d), lib: MOIS[m] };
      }
    }

    // ------------------------------------------------------------------ bus de site
    function bus() { try { return FW().oropraSite || window.oropraSite || null; } catch (e) { return null; } }
    function siteBus() { const b = bus(); try { return b && b.getSiteId ? b.getSiteId() : null; } catch (e) { return null; } }
    function siteUnique() {
      const c = S.ctx; if (!c) return null;
      const ids = (c.sites || []).map(s => Number(s.id));
      const b = siteBus();
      if (b != null && ids.indexOf(Number(b)) >= 0) return Number(b);
      if (c.site != null && ids.indexOf(Number(c.site)) >= 0) return Number(c.site);
      return ids[0] != null ? ids[0] : null;
    }
    function nomSite(id) { const s = ((S.ctx && S.ctx.sites) || []).find(x => Number(x.id) === Number(id)); return s ? s.nom : 'Site ' + id; }

    // ------------------------------------------------------------------ données
    async function rpc(nom, args) {
      const r = await sb().rpc(nom, args || {});
      if (r.error) throw new Error(r.error.message || nom);
      return r.data;
    }
    async function charger(cle, fn) {
      if (S.data[cle] !== undefined || S.charge[cle]) return;
      S.charge[cle] = true;
      try { S.data[cle] = await fn(); } catch (e) { console.error('[activite]', cle, e); S.data[cle] = { __err: e.message || String(e) }; }
      S.charge[cle] = false;
      rendre();
    }

    // ------------------------------------------------------------------ fiche client et note
    const SELECTED_CLIENT_VAR = '55490583-c88b-4748-916e-4d203db07742';
    const FICHE_WORKFLOW_ID = 'ec8bcc55-a733-4982-a946-13e10ba3b09b';
    const FICHE_PAGE_ID = '259f1951-a2d4-4b90-ac83-0b3febe1d4ec';
    async function ouvrirFiche(idvu) {
      if (idvu == null) return;
      const id = Number(idvu);
      let client = null;
      try { const r = await sb().from('CLIENT').select('*').eq('IDVu', id).limit(1); client = (r.data && r.data[0]) || null; } catch (e) { }
      const obj = client ? Object.assign({}, client) : { IDVu: id };
      try { wwLib.wwVariable.updateValue(SELECTED_CLIENT_VAR, obj); } catch (e) { }
      try {
        const w = FW(); w.__odSelectedClient = obj;
        try { sessionStorage.setItem('od_selected_client', JSON.stringify(obj)); } catch (e2) { }
        try { w.dispatchEvent(new CustomEvent('oropra-client-selected', { detail: obj })); } catch (e2) { }
      } catch (e) { }
      try { wwLib.wwWorkflow.executeGlobal(FICHE_WORKFLOW_ID, { IDVu: id }); } catch (e) { }
      let editeur = false; try { editeur = window.self !== window.top; } catch (e) { editeur = true; }
      if (editeur) { try { wwLib.wwApp.goTo(FICHE_PAGE_ID); return; } catch (e) { } return; }
      try { wwLib.goTo('/fr/fiche-client'); return; } catch (e) { }
      try { FW().location.href = '/fr/fiche-client'; } catch (e) { }
    }
    async function envoyerNote(idUser, idClient, message) {
      const r = await sb().rpc('notif_alerter', { p_id_user_cible: Number(idUser), p_id_client: idClient != null ? Number(idClient) : null, p_message: message });
      if (r.error) throw new Error(r.error.message);
      if (r.data && r.data.ok === false) throw new Error(r.data.erreur || 'refus');
    }

    // ------------------------------------------------------------------ styles (charte One Data)
    const CSS = `
#act-root{--bleu:#2a5ea9;--bleu-fonce:#1F4A85;--bleu-clair:#acc5e4;--vert:#53bda7;--orange:#fac055;--rouge:#fac055;
  --m-vert:#085041;--m-orange:#c7820a;--m-bleu:#2a5ea9;--m-rouge:#c7820a;
  --ground:#fafbfd;--card:#fff;--line:#eaf0f9;--line-2:#d6e2f2;--ink:#1F4A85;--ink-2:#4a6a8a;--ink-3:#7a9cc4;
  --ok-bg:#e1f5ee;--alerte-bg:#f5f8fc;--chaud-bg:#f5f8fc;--calme-bg:#eaf0f9;
  --ombre:none;
  --ui:"Nunito Sans",system-ui,-apple-system,"Segoe UI",Arial,sans-serif;
  display:block;width:100%;box-sizing:border-box;padding:18px 16px 48px;background:var(--ground);color:var(--ink);
  font-family:var(--ui);font-size:14px;line-height:1.5;font-variant-numeric:tabular-nums}
#act-root *{box-sizing:border-box}
#act-root [hidden]{display:none !important}
#act-root button,#act-root input,#act-root textarea{font-family:inherit}
#act-root .aw{max-width:1180px;margin:0 auto;display:flex;flex-direction:column;gap:16px}
#act-root .rail{display:flex;flex-wrap:wrap;align-items:center;gap:10px 14px}
#act-root .rail h1{margin:0;font-size:19px;font-weight:800;letter-spacing:-.015em}
#act-root .badge{font-size:11px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-3);background:var(--calme-bg);border-radius:20px;padding:5px 11px}
#act-root .droite{margin-left:auto;display:flex;gap:8px;flex-wrap:wrap;align-items:center}
#act-root .seg{display:inline-flex;gap:2px;background:var(--calme-bg);border-radius:9px;padding:2px;flex-wrap:wrap}
#act-root .seg button{background:none;border:0;font-size:12px;font-weight:700;color:var(--ink-3);padding:5px 11px;border-radius:7px;cursor:pointer}
#act-root .seg button:hover{color:var(--ink)}
#act-root .seg button[aria-pressed="true"]{background:var(--card);color:var(--ink);box-shadow:0 1px 2px rgba(28,43,69,.08)}
#act-root .ecrans button{font-size:12.5px;padding:6px 13px}
#act-root .plage{display:inline-flex;align-items:center;gap:6px;background:var(--calme-bg);border-radius:9px;padding:3px 10px;font-size:12px;font-weight:700;color:var(--ink-3)}
#act-root .plage input{border:0;background:transparent;font-size:12px;font-weight:700;color:var(--ink);width:122px}
#act-root .band{background:var(--card);border:1px solid var(--line);border-radius:14px;box-shadow:var(--ombre);padding:20px 22px;display:grid;grid-template-columns:minmax(0,1fr) auto;gap:18px 30px;align-items:center}
@media(max-width:760px){#act-root .band{grid-template-columns:minmax(0,1fr)}}
#act-root .q{font-size:10.5px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--ink-3)}
#act-root .band h2{margin:6px 0 0;font-size:20px;line-height:1.38;font-weight:600;max-width:56ch}
#act-root .band h2 b{font-weight:800}
#act-root .pouls{display:flex;gap:26px;flex-wrap:wrap;margin-top:16px}
#act-root .pouls .n{font-size:22px;font-weight:600;line-height:1}
#act-root .pouls .l{font-size:11px;color:var(--ink-3);margin-top:5px;line-height:1.25}
#act-root .baisse{color:var(--m-rouge)}#act-root .hausse{color:var(--m-vert)}
#act-root .chart.anneau{width:168px}
#act-root .cols{display:grid;grid-template-columns:minmax(0,1.5fr) minmax(0,1fr);gap:16px;align-items:start}
#act-root .cols.eq{grid-template-columns:minmax(0,1fr) minmax(0,1fr)}
@media(max-width:920px){#act-root .cols,#act-root .cols.eq{grid-template-columns:minmax(0,1fr)}}
#act-root .pile{display:flex;flex-direction:column;gap:16px;min-width:0}
#act-root .card{background:var(--card);border:1px solid var(--line);border-radius:14px;box-shadow:var(--ombre);padding:16px 18px 14px;min-width:0}
#act-root .ch{display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:12px}
#act-root .ch h3{margin:0;font-size:11px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:var(--ink-2)}
#act-root .ch span{font-size:11.5px;color:var(--ink-3);font-weight:600}
#act-root .lecture{margin-top:12px;background:var(--alerte-bg);border-radius:11px;padding:11px 14px;font-size:13px;line-height:1.5}
#act-root .lecture .t{font-size:10px;font-weight:700;letter-spacing:.09em;text-transform:uppercase;color:var(--ink-3);margin-bottom:3px}
#act-root .lecture b{font-weight:800}
#act-root .note{font-size:11.5px;color:var(--ink-3);margin-top:10px;line-height:1.5}
#act-root .vide{color:var(--ink-3);font-size:13px;padding:12px 0}
#act-root .pill{display:inline-flex;align-items:center;font-size:11px;font-weight:700;padding:3px 9px;border-radius:20px;white-space:nowrap}
#act-root .pill.rouge{background:var(--chaud-bg);color:var(--m-rouge)}
#act-root .pill.orange{background:var(--alerte-bg);color:var(--m-orange)}
#act-root .pill.vert{background:var(--ok-bg);color:var(--m-vert)}
#act-root .pill.bleu{background:var(--calme-bg);color:var(--m-bleu)}
#act-root .pill.u-VN{background:var(--calme-bg);color:var(--m-bleu)}
#act-root .pill.u-VO{background:var(--ok-bg);color:var(--m-vert)}
#act-root .pill.u-PRO{background:var(--alerte-bg);color:var(--m-orange)}
#act-root .deal h4 .pill{margin-left:8px;vertical-align:2px;font-size:10px;padding:2px 7px}
#act-root .pill.attente{border:1px dashed var(--line-2);color:var(--ink-3);background:transparent}
#act-root .chart{width:100%;min-height:24px}
#act-root svg{display:block;overflow:visible}
#act-root svg text{font-family:var(--ui)}
#act-root .tl{display:grid;grid-template-columns:48px 14px minmax(0,1fr) auto;gap:10px;align-items:start;padding:8px 0}
#act-root .tl time{font-size:12.5px;font-weight:700;color:var(--ink-2);text-align:right;padding-top:1px}
#act-root .tl .pin{position:relative;align-self:stretch}
#act-root .tl .pin::before{content:"";position:absolute;left:6px;top:0;bottom:-16px;width:2px;background:var(--line)}
#act-root .tl:last-child .pin::before{bottom:auto;height:10px}
#act-root .tl .pin i{position:absolute;left:1px;top:4px;width:12px;height:12px;border-radius:50%;background:var(--card);border:2.5px solid var(--bleu)}
#act-root .tl.retard .pin i{border-color:var(--m-rouge);background:var(--rouge)}
#act-root .tl.retard time{color:var(--m-rouge)}
#act-root .tl .tx{min-width:0}
#act-root .tl .tx b{font-weight:800;display:block;font-size:13.5px}
#act-root .tl .tx small{display:block;color:var(--ink-2);font-size:12.5px;margin-top:1px}
#act-root .tl .tx .lien{display:block}
#act-root .lien{background:none;border:0;padding:0;color:inherit;font:inherit;cursor:pointer;text-align:left}
#act-root .lien:hover b,#act-root .lien:hover{color:var(--bleu)}
#act-root .team{display:flex;gap:8px;flex-wrap:wrap}
#act-root .who{display:flex;align-items:center;gap:9px;border:1px solid var(--line);background:var(--card);border-radius:12px;padding:6px 12px 6px 6px;cursor:pointer;color:var(--ink);box-shadow:var(--ombre);text-align:left}
#act-root .who .av{width:30px;height:30px;border-radius:50%;display:grid;place-items:center;font-size:11px;font-weight:800;color:var(--bleu-fonce);background:var(--calme-bg);flex:0 0 auto}
#act-root .who b{font-weight:800;font-size:13px;display:block;line-height:1.2}
#act-root .who small{font-size:11px;color:var(--ink-3);font-weight:600}
#act-root .who small.r{color:var(--m-rouge)}
#act-root .who[aria-selected="true"]{border-color:var(--bleu);box-shadow:0 0 0 2px rgba(42,94,169,.22),var(--ombre)}
#act-root .who[aria-selected="true"] .av{background:var(--bleu);color:#fff}
#act-root .deal{display:grid;grid-template-columns:minmax(0,1fr) auto;gap:2px 14px;padding:14px 0;border-top:1px solid var(--line)}
#act-root .deal:first-child{border-top:0;padding-top:2px}
#act-root .deal h4{margin:0;font-size:14.5px;font-weight:800}
#act-root .deal .car{color:var(--ink-2);font-size:12.5px}
#act-root .deal .val{grid-row:1/3;grid-column:2;text-align:right;display:flex;flex-direction:column;align-items:flex-end;gap:4px}
#act-root .deal .val b{font-size:17px;font-weight:600}
#act-root .deal .jours{grid-column:1/-1;margin-top:8px}
#act-root .cases{display:flex;flex-wrap:wrap;gap:2px;max-width:100%}
#act-root .cases i{width:9px;height:9px;border-radius:2px}
#act-root .cases i.ok{background:var(--bleu-clair)}
#act-root .cases i.ko{background:var(--rouge)}
#act-root .jrow{display:flex;flex-wrap:wrap;align-items:center;gap:6px 12px}
#act-root .jl{font-size:12px;color:var(--ink-2)}
#act-root .jl b{font-weight:800;color:var(--ink)}
#act-root .jl b.r{color:var(--m-rouge)}
#act-root .levier{grid-column:1/-1;display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:10px;background:var(--calme-bg);border-radius:11px;padding:9px 12px}
#act-root .levier p{margin:0;flex:1 1 220px;font-size:12.5px;color:var(--ink-2)}
#act-root .levier p b{color:var(--ink)}
#act-root .btn{border:0;border-radius:9px;padding:7px 12px;font-weight:800;font-size:12.5px;cursor:pointer;background:var(--bleu);color:#fff}
#act-root .btn:hover{background:var(--bleu-fonce)}
#act-root .btn.sec{background:var(--card);color:var(--bleu);box-shadow:inset 0 0 0 1px var(--line-2)}
#act-root .btn:disabled{opacity:.55;cursor:default}
#act-root .notebox{grid-column:1/-1;display:flex;flex-direction:column;gap:8px;margin-top:8px}
#act-root .notebox textarea{width:100%;min-height:62px;border:1px solid var(--line-2);border-radius:10px;padding:9px 11px;font-size:13px;color:var(--ink);resize:vertical;outline:none}
#act-root .notebox textarea:focus{border-color:var(--bleu)}
#act-root .notebox .act{display:flex;gap:8px;align-items:center;flex-wrap:wrap}
#act-root .ok-msg{font-size:12.5px;font-weight:700;color:var(--m-vert)}
#act-root .ko-msg{font-size:12.5px;font-weight:700;color:var(--m-rouge)}
#act-root .plus{margin-top:10px;font-size:12.5px;color:var(--ink-2)}
#act-root .scroll{overflow-x:auto}
#act-root table{width:100%;border-collapse:collapse;font-size:12.5px}
#act-root th{font-size:9.5px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:var(--ink-3);text-align:right;padding:0 8px 6px;white-space:nowrap}
#act-root th:first-child{text-align:left;padding-left:0}
#act-root td{padding:7px 8px;border-top:1px solid var(--line);text-align:right;white-space:nowrap}
#act-root td:first-child{text-align:left;padding-left:0}
#act-root td:last-child,#act-root th:last-child{padding-right:0}
#act-root td b{font-weight:800}
#act-root .mini{display:inline-block;vertical-align:middle;width:64px;height:6px;border-radius:9px;background:var(--calme-bg);overflow:hidden;margin-left:8px}
#act-root .mini i{display:block;height:100%;background:var(--bleu);border-radius:9px}
#act-root .mosaic{display:flex;height:112px;gap:6px}
#act-root .mosaic div{min-width:84px;display:flex;flex-direction:column;justify-content:space-between;padding:9px 11px;min-width:0;border-radius:11px}
#act-root .mosaic b{font-size:22px;font-weight:600;line-height:1}
#act-root .mosaic span{font-size:11.5px;font-weight:700;line-height:1.25}
#act-root .dots{display:flex;flex-direction:column;gap:13px}
#act-root .dotrow{display:grid;grid-template-columns:150px minmax(0,1fr) 44px;gap:12px;align-items:center;font-size:12.5px;font-weight:600}
#act-root .dotrow .g{display:grid;grid-template-columns:repeat(25,minmax(0,1fr));gap:3px;max-width:300px}
#act-root .dotrow .g i{aspect-ratio:1;border-radius:50%;background:var(--calme-bg)}
#act-root .dotrow .g i.f{background:var(--bleu)}
#act-root .dotrow b{text-align:right;font-weight:800}
#act-root .dotrow small{display:block;color:var(--ink-3);font-weight:600;font-size:11px}
#act-root .kpis{display:grid;grid-template-columns:repeat(auto-fit,minmax(120px,1fr));gap:12px}
#act-root .kpis .n{font-size:20px;font-weight:600;line-height:1.1}
#act-root .kpis .l{font-size:11px;color:var(--ink-3);margin-top:3px}
#act-root .sites{display:grid;grid-template-columns:repeat(auto-fill,minmax(250px,1fr));gap:16px}
#act-root .site{display:flex;flex-direction:column;gap:10px;cursor:pointer}
#act-root .site:hover{border-color:var(--line-2)}
#act-root .site .top{display:flex;justify-content:space-between;align-items:center;gap:8px}
#act-root .site h4{margin:0;font-size:14px;font-weight:800}
#act-root .site dl{display:grid;grid-template-columns:repeat(3,1fr);gap:6px;margin:0}
#act-root .site dt{font-size:9.5px;color:var(--ink-3);font-weight:700;text-transform:uppercase;letter-spacing:.06em}
#act-root .site dd{margin:0;font-size:16px;font-weight:600}
#act-root .signal{display:grid;grid-template-columns:30px minmax(0,1fr);gap:12px;padding:11px 0;border-top:1px solid var(--line)}
#act-root .signal:first-child{border-top:0;padding-top:0}
#act-root .signal .lv{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;font-weight:800;font-size:13px}
#act-root .signal p{margin:0;font-weight:800;font-size:13.5px}
#act-root .signal small{display:block;color:var(--ink-2);font-weight:600;font-size:12.5px}
#act-root .charge{display:flex;align-items:center;gap:10px;color:var(--ink-3);font-size:13px;padding:28px 4px}
#act-root .charge i{width:16px;height:16px;border:2px solid var(--line-2);border-top-color:var(--bleu);border-radius:50%;animation:act-tourne .7s linear infinite}
@keyframes act-tourne{to{transform:rotate(360deg)}}
#act-root .erreur{background:var(--chaud-bg);color:var(--m-rouge);border-radius:11px;padding:12px 14px;font-weight:700}
#act-root :focus-visible{outline:2px solid var(--bleu);outline-offset:2px}
#act-root .djour{font:inherit;font-size:12.5px;font-weight:700;color:var(--bleu);border:none;box-shadow:inset 0 0 0 1px var(--line-2);border-radius:9px;padding:6px 9px;background:var(--card)}
#act-root .live{display:inline-flex;align-items:center;gap:6px;font-size:11.5px;font-weight:700;color:var(--ink-3)}
#act-root .live i{width:8px;height:8px;border-radius:50%;background:var(--vert);box-shadow:0 0 0 3px var(--ok-bg)}
#act-root .live.vieux i{background:var(--orange);box-shadow:0 0 0 3px var(--alerte-bg)}
#act-root .tuiles{display:grid;grid-template-columns:repeat(auto-fit,minmax(132px,1fr));gap:10px;margin-top:16px}
#act-root .tuile{background:var(--ground);border-radius:12px;padding:11px 13px;min-width:0}
#act-root .tuile .n{font-size:24px;font-weight:700;line-height:1;color:var(--bleu-fonce)}
#act-root .tuile .l{font-size:11.5px;font-weight:700;color:var(--ink-2);margin-top:5px;line-height:1.25}
#act-root .tuile .d{font-size:11px;font-weight:700;margin-top:4px;color:var(--ink-3)}
#act-root .tuile .d.h{color:var(--m-vert)}#act-root .tuile .d.b{color:var(--m-rouge)}
#act-root .tuile.alerte{background:var(--alerte-bg)}#act-root .tuile.alerte .n{color:var(--m-orange)}
#act-root .tl.g-commande .pin i{border-color:var(--m-vert);background:var(--vert)}
#act-root .tl.g-devis .pin i{border-color:var(--bleu)}
#act-root .tl.g-lead .pin i,#act-root .tl.g-lead_pris .pin i,#act-root .tl.g-lead_contacte .pin i{border-color:var(--m-orange)}
#act-root .tl.g-affaire .pin i,#act-root .tl.g-rdv .pin i,#act-root .tl.g-livraison .pin i{border-color:var(--bleu-clair)}
#act-root .eqd td:first-child{max-width:150px;overflow:hidden;text-overflow:ellipsis}
#act-root .eqd .pt{display:inline-block;width:8px;height:8px;border-radius:50%;margin-right:7px;background:var(--line-2);vertical-align:1px}
#act-root .eqd .pt.v{background:var(--vert)}#act-root .eqd .pt.o{background:var(--orange)}
#act-root .eqd td.z{color:var(--ink-3)}
@media(max-width:560px){
  #act-root .tl{grid-template-columns:42px 14px minmax(0,1fr)}
  #act-root .tl .pill{grid-column:3;justify-self:start}
  #act-root .dotrow{grid-template-columns:100px minmax(0,1fr) 38px}
  #act-root .mosaic{height:auto;flex-wrap:wrap}#act-root .mosaic div{flex:1 1 40% !important;min-height:76px}
  #act-root .chart.anneau{width:140px;justify-self:center}
  #act-root .band h2{font-size:18px}
}
/* v14 : design One Data (repris de Performances) */
#act-root .card,#act-root .band{border-radius:10px;box-shadow:none;border:1px solid var(--line)}
#act-root .card{padding:15px 16px}
#act-root .rail{background:#fff;border:1px solid var(--line);border-radius:10px;padding:10px 15px}
#act-root .rail h1{font-size:17px;color:var(--bleu-fonce)}
#act-root .badge{background:#fff;border:1px solid var(--line);color:var(--ink-3);font-size:10px}
#act-root .seg{background:#fff;border:1px solid var(--bleu-clair);border-radius:6px;padding:0;gap:0;overflow:hidden}
#act-root .seg button{border-radius:0;color:var(--ink-2);font-weight:600;font-size:11.5px;padding:6px 11px}
#act-root .seg button:hover{color:var(--bleu);background:#f5f8fc}
#act-root .seg button[aria-pressed="true"]{background:var(--bleu);color:#fff;box-shadow:none}
#act-root .ecrans{border-color:var(--line)}
#act-root .ecrans button{font-size:12.5px;padding:7px 14px}
#act-root .ch{margin-bottom:14px}
#act-root .ch h3{display:flex;align-items:center;gap:8px;font-size:13.5px;font-weight:700;letter-spacing:0;text-transform:none;color:var(--bleu)}
#act-root .ch h3::before{content:"";width:3px;height:17px;background:var(--bleu);flex:0 0 auto}
#act-root .ch span{font-size:10.5px;color:var(--ink-3)}
#act-root .band h2{font-size:17px;font-weight:600;color:var(--bleu-fonce)}
#act-root .pouls .n{color:var(--bleu)}
#act-root .tuile{background:#f5f8fc;border-radius:8px}
#act-root .tuile.alerte{background:#f5f8fc;box-shadow:inset 3px 0 0 var(--orange)}#act-root .tuile.alerte .n{color:var(--bleu-fonce)}
#act-root .lecture{background:#f5f8fc;border-radius:8px;box-shadow:inset 3px 0 0 var(--bleu-clair);color:var(--bleu-fonce)}
#act-root .lecture .t{color:var(--ink-3)}
#act-root .erreur{background:#f5f8fc;border-radius:8px;box-shadow:inset 3px 0 0 var(--orange);color:var(--bleu-fonce)}
#act-root .pill.rouge,#act-root .pill.orange,#act-root .pill.u-PRO{background:#fff;color:var(--bleu-fonce);box-shadow:inset 0 0 0 1px var(--orange)}
#act-root .pill.bleu,#act-root .pill.u-VN{background:var(--calme-bg);color:var(--bleu)}
#act-root .who{box-shadow:none}
#act-root .who[aria-selected="true"]{box-shadow:0 0 0 2px rgba(42,94,169,.22)}
#act-root .tl.retard .pin i{border-color:var(--orange);background:#fff}
#act-root .tl.retard time{color:var(--m-orange)}
#act-root th{color:var(--ink-3);font-weight:600}
#act-root td{border-top-color:var(--line);color:var(--bleu)}
#act-root .chart.anneau{width:250px}
/* tuiles chiffrées */
#act-root .kg{display:grid;grid-template-columns:repeat(auto-fit,minmax(170px,1fr));gap:10px}
#act-root .kg .chart.anneau{width:auto;min-height:0}
#act-root .k{background:#f5f8fc;border-radius:8px;padding:12px 13px;min-width:0;height:100%}
#act-root .kl{font-size:10px;color:var(--ink-3);text-transform:uppercase;letter-spacing:.4px;font-weight:600;margin-bottom:6px}
#act-root .kv{display:flex;align-items:baseline;justify-content:space-between;gap:8px;margin-bottom:7px}
#act-root .kv b{font-size:24px;font-weight:700;color:var(--bleu);line-height:1.1;white-space:nowrap}
#act-root .kv b small{font-size:12px;color:var(--ink-3);font-weight:600}
#act-root .kv b.t{font-size:15px}
#act-root .pct{font-size:11px;font-weight:700;padding:2px 7px;border-radius:4px}
#act-root .trk{height:4px;background:#e3edf9;border-radius:3px;overflow:hidden}
#act-root .trk i{display:block;height:4px;border-radius:3px}
#act-root .ks{font-size:10.5px;color:var(--ink-2);margin-top:6px}
/* parcours */
#act-root .fu{display:flex;flex-direction:column;gap:12px}
#act-root .fu-r{display:grid;grid-template-columns:120px minmax(0,1fr) 60px;gap:14px;align-items:center}
#act-root .fu-n{font-size:12.5px;font-weight:700;color:var(--bleu)}
#act-root .fu-b{position:relative;height:34px;border-radius:6px}
#act-root .fu-b i{position:absolute;left:0;top:0;bottom:0;border-radius:6px}
#act-root .fu-b i.p{border-radius:0 6px 6px 0;background:#fdf3de}
#act-root .fu-b span{position:absolute;top:50%;transform:translateY(-50%);padding-left:12px;font-size:17px;font-weight:800;white-space:nowrap}
#act-root .fu-v{text-align:right;font-size:13px;font-weight:700;color:var(--ink-3)}
#act-root .fu-leg{display:flex;gap:18px;margin-left:134px;font-size:11px;color:var(--ink-3);font-weight:600}
#act-root .fu-leg span{display:flex;align-items:center;gap:6px}
#act-root .fu-leg i{width:12px;height:12px;border-radius:3px;display:inline-block}
@media(max-width:560px){#act-root .fu-r{grid-template-columns:84px minmax(0,1fr) 44px;gap:8px}#act-root .fu-leg{margin-left:0}}
/* barres simples */
#act-root .hb{display:grid;grid-template-columns:minmax(0,170px) minmax(0,1fr) 46px;gap:10px;align-items:center;margin-bottom:10px;font-size:12px;font-weight:600;color:var(--bleu)}
#act-root .hb small{display:block;font-size:10.5px;color:var(--ink-3);font-weight:600}
#act-root .hb .t{height:8px;background:#f5f8fc;border-radius:4px;overflow:hidden}
#act-root .hb .t i{display:block;height:8px;border-radius:4px}
#act-root .hb b{text-align:right;font-weight:700}
`;
    function poserStyle() {
      let st = doc.getElementById('act4-style');
      if (!st) { st = doc.createElement('style'); st.id = 'act4-style'; (doc.head || doc.body).appendChild(st); }
      if (st.textContent !== CSS) st.textContent = CSS;
    }

    // ------------------------------------------------------------------ graphiques
    const C = { bleu: '#2a5ea9', fonce: '#1F4A85', clair: '#acc5e4', vert: '#53bda7', orange: '#fac055', rouge: '#fac055',
      mvert: '#085041', morange: '#c7820a', mbleu: '#2a5ea9', mrouge: '#c7820a', line: '#eaf0f9', line2: '#d6e2f2',
      ink: '#1F4A85', ink2: '#4a6a8a', ink3: '#7a9cc4', okbg: '#eef8f5', alerte: '#eef3fa', chaud: '#eef3fa', calme: '#eaf0f9', card: '#ffffff' };
    const NS = 'http://www.w3.org/2000/svg';
    function el(n, a, p) { const e = doc.createElementNS(NS, n); for (const k in a) e.setAttribute(k, a[k]); if (p) p.appendChild(e); return e; }
    function tx(p, x, y, s, o) { o = o || {}; const t = el('text', { x: x, y: y, fill: o.c || C.ink, 'text-anchor': o.a || 'start', 'font-size': o.s || 11.5, 'font-weight': o.w || 700 }, p); t.textContent = s; return t; }
    function svgIn(box, W, H, label) { box.innerHTML = ''; const s = el('svg', { width: W, height: H, viewBox: '0 0 ' + W + ' ' + H, role: 'img' }, box); if (label) s.setAttribute('aria-label', label); return s; }
    const G = {};   // dessinateurs ; la donnée est posée sur box.__d

    // v13 : l'anneau devient une tuile « Commandes signées » (même dessin que
    // les tuiles d'objectifs de Performances).
    G.anneau = function (box) {
      const d = box.__d, pc = d.cible > 0 ? Math.round(d.fait / d.cible * 100) : null;
      const col = pc == null ? C.clair : pc >= 100 ? C.vert : pc >= 80 ? C.orange : C.bleu;
      const pill = pc == null ? '' : '<span class="pct" style="background:' + (pc >= 100 ? '#e1f5ee;color:#085041' : '#eaf0f9;color:#2a5ea9') + '">' + pc + ' %</span>';
      const sous = d.cible > 0 ? (d.proj != null ? 'projection fin de période : ' + nf(d.proj) : esc(d.sous || '')) : esc(d.vide || 'pas d\'objectif saisi');
      box.innerHTML = '<div class="k"><div class="kl">' + esc(d.titre || 'Commandes signées') + '</div><div class="kv"><b>' + nf(d.fait) + (d.cible > 0 ? ' <small>/ ' + nf(d.cible) + '</small>' : '') + '</b>' + pill + '</div>' +
        '<div class="trk"><i style="width:' + Math.min(100, pc || 0) + '%;background:' + col + '"></i></div><div class="ks">' + sous + '</div></div>';
    };

    // Carte des affaires : stade x jours depuis la dernière activité.
    const STADES = [
      { cle: 'commande', lib: 'Commande', col: C.vert },
      { cle: 'devis', lib: 'Simulation', col: C.orange },
      { cle: 'affaire', lib: 'Sans simulation', col: C.mbleu }];
    G.carte = function (box) {
      const A = box.__d || [], W = box.clientWidth, H = 250, s = svgIn(box, W, H, 'Opportunités par stade et jours sans activité'),
        L = W < 460 ? 94 : 104, R = W - 6, T = 6, B = H - 34, maxD = 28, bh = (B - T) / STADES.length;
      const X = d => L + (R - L) * Math.min(d, maxD) / maxD;
      const delai = { commande: 3, devis: 3, affaire: 7 };
      STADES.forEach((b, i) => {
        const y = T + i * bh;
        el('rect', { x: L, y: y + 2, width: R - L, height: bh - 4, rx: 6, fill: '#f5f8fc' }, s);
        const dl = delai[b.cle];
        el('rect', { x: X(dl), y: y + 2, width: R - X(dl), height: bh - 4, rx: 6, fill: C.chaud }, s);
        el('line', { x1: X(dl), y1: y + 4, x2: X(dl), y2: y + bh - 4, stroke: C.orange, 'stroke-width': 1.5, 'stroke-dasharray': '3 3' }, s);
        el('circle', { cx: 8, cy: y + bh / 2, r: 5, fill: b.col }, s);
        tx(s, 19, y + bh / 2 + 4, b.lib, { s: 11.5, w: 800 });
        const n = A.filter(a => a.etape === b.cle).length;
        tx(s, 19, y + bh / 2 + 18, plur(n, 'opportunité'), { s: 10, c: C.ink3, w: 600 });
      });
      [0, 7, 14, 21, 28].forEach(d => tx(s, X(d), B + 16, d === 28 ? '28 j +' : d + ' j', { a: 'middle', s: 10.5, c: C.ink3 }));
      tx(s, R, B + 31, 'jours depuis la dernière activité', { a: 'end', s: 10.5, c: C.ink3 });
      const mx = Math.max(1, ...A.map(a => Number(a.montant) || 0));
      const lignes = {}, poses = []; const etiquetees = new Set(A.filter(a => a.etat === 'bloquee' && a.montant).sort((a, b) => b.montant - a.montant).slice(0, 3).map(a => a.id_affaire));
      A.slice().sort((a, b) => (Number(b.montant) || 0) - (Number(a.montant) || 0)).forEach((a, k) => {
        const i = STADES.findIndex(b => b.cle === a.etape); if (i < 0) return;
        const st = STADES[i], j = (lignes[i] = (lignes[i] || 0) + 1);
        const y = T + i * bh + bh / 2 + ((j % 3) - 1) * 7, x = X(Number(a.jours) || 0), r = a.montant ? 3.5 + 8 * Math.sqrt(a.montant / mx) : 4;
        const late = a.etat === 'bloquee', froid = a.etat === 'froide';
        const c = el('circle', { cx: x, cy: y, r, fill: st.col, 'fill-opacity': froid ? .3 : (late ? 1 : .75), stroke: late ? C.orange : C.card, 'stroke-width': late ? 2.5 : 1.2 }, s);
        const t = el('title', {}, c); t.textContent = a.client + (a.montant ? ' · ' + eur(a.montant) : '') + ' · ' + a.jours + ' j';
        if (etiquetees.has(a.id_affaire)) {
          const mot = (a.client || '').split(' ').slice(-1)[0], lx = Math.min(Math.max(x, L + 30), R - 34), lw = mot.length * 6.5 + 8;
          if (!poses.some(o => Math.abs(o.x - lx) < (o.w + lw) / 2 && Math.abs(o.y - (y - r)) < 14)) { poses.push({ x: lx, y: y - r, w: lw }); tx(s, lx, y - r - 4, mot, { a: 'middle', s: 10.5, w: 800, c: C.mrouge }); }
        }
      });
    };

    G.quad = function (box) {
      const P = box.__d || [], W = box.clientWidth, H = 240, s = svgIn(box, W, H, 'Équipe : objectif atteint et opportunités bloquées'), L = 30, R = W - 8, T = 8, B = H - 36;
      const maxB = Math.max(4, ...P.map(p => p.bloquees));
      const X = p => L + (R - L) * Math.min(p, 120) / 120, Y = n => B - (B - T) * Math.min(n, maxB) / maxB;
      el('rect', { x: L, y: T, width: X(80) - L, height: Y(maxB * .35) - T, rx: 8, fill: C.chaud }, s);
      el('rect', { x: X(80), y: Y(maxB * .35), width: R - X(80), height: B - Y(maxB * .35), rx: 8, fill: C.okbg }, s);
      el('line', { x1: X(100), y1: T, x2: X(100), y2: B, stroke: C.line2, 'stroke-dasharray': '3 4' }, s);
      el('line', { x1: L, y1: B, x2: R, y2: B, stroke: C.line2 }, s);
      tx(s, L + 8, T + 16, 'À accompagner', { s: 11, w: 800, c: C.mrouge });
      tx(s, R - 8, B - 8, 'En rythme', { a: 'end', s: 11, w: 800, c: C.mvert });
      [0, 50, 100].forEach(p => tx(s, X(p), B + 15, p + ' %', { a: 'middle', s: 10.5, c: C.ink3 }));
      tx(s, R, B + 30, 'objectif atteint', { a: 'end', s: 10.5, c: C.ink3 });
      [0, Math.round(maxB / 2), maxB].forEach(n => tx(s, L - 8, Y(n) + 4, n, { a: 'end', s: 10.5, c: C.ink3 }));
      P.forEach(p => {
        const g = el('g', { style: 'cursor:pointer' }, s);
        const sel = String(p.id) === String(S.vendeur);
        el('circle', { cx: X(p.x), cy: Y(p.bloquees), r: 15, fill: sel ? C.bleu : C.card, stroke: sel ? C.card : C.bleu, 'stroke-width': 2 }, g);
        tx(g, X(p.x), Y(p.bloquees) + 4, p.ini, { a: 'middle', s: 10.5, w: 800, c: sel ? '#ffffff' : C.bleu });
        const t = el('title', {}, g); t.textContent = p.nom + ' · ' + (p.objectif ? p.x + ' % de l\'objectif' : 'pas d\'objectif') + ' · ' + plur(p.bloquees, 'opportunité bloquée', 'opportunités bloquées');
        g.addEventListener('click', () => choisirVendeur(p.id));
      });
    };

    G.ecart = function (box) {
      const R = box.__d || [], W = box.clientWidth, H = R.length * 38 + 20, s = svgIn(box, W, H, 'Écart à la moyenne de l\'équipe'),
        lab = 104, val = 58, mid = lab + (W - lab - val) / 2, half = (W - lab - val) / 2 - 4;
      R.forEach((r, i) => {
        const y = i * 38, d = r.moy > 0 ? Math.max(-1, Math.min(1, r.v / r.moy - 1)) : 0, w = d * half;
        tx(s, 0, y + 18, r.lib, { s: 12, w: 700 });
        el('rect', { x: mid - half, y: y + 6, width: half * 2, height: 16, rx: 8, fill: C.calme }, s);
        if (r.moy > 0) el('rect', { x: w < 0 ? mid + w : mid, y: y + 6, width: Math.max(3, Math.abs(w)), height: 16, rx: 8, fill: w < 0 ? C.rouge : C.vert }, s);
        tx(s, W, y + 18, nf(r.v) + ' / ' + (Math.round(r.moy * 10) / 10).toLocaleString('fr-FR'), { a: 'end', s: 11.5, w: 800, c: C.ink2 });
      });
      el('line', { x1: mid, y1: 0, x2: mid, y2: R.length * 38 - 6, stroke: C.ink, 'stroke-width': 1.5 }, s);
      tx(s, mid, H - 4, 'moyenne équipe', { a: 'middle', s: 10.5, c: C.ink3 });
    };

    // Flux aligné en haut : la part qui avance continue, la perte tombe.
    G.flux = function (box) {
      const st = box.__d.etapes, loss = box.__d.pertes, W = box.clientWidth, n = st.length, nw = 10, step = (W - nw - 70) / (n - 1),
        y0 = 62, maxH = W < 640 ? 96 : 128, drop = y0 + maxH + 44, H = drop + 40, s = svgIn(box, W, H, 'Parcours des opportunités'), top = Math.max(1, st[0][1]);
      const hh = v => Math.max(4, maxH * v / top);
      st.forEach((p, i) => {
        const x = i * step, h = hh(p[1]);
        if (i < n - 1) {
          const nx = (i + 1) * step, hn = hh(st[i + 1][1]), lost = p[1] - st[i + 1][1], lw = h - hn;
          el('rect', { x: x + nw, y: y0 + .75, width: nx - x - nw, height: Math.max(1, hn - 1.5), fill: '#fff', stroke: C.bleu, 'stroke-width': 1.5 }, s);
          const sx = x + nw, sy = y0 + hn + lw / 2, dx = x + nw + Math.min(step * .42, 90);
          if (lost > 0) {
            const dd = 'M' + sx + ' ' + sy + ' C' + (dx - 10) + ' ' + sy + ' ' + dx + ' ' + (sy + 10) + ' ' + dx + ' ' + (drop - 8), ep = Math.max(3, lw);
            el('path', { d: dd, fill: 'none', stroke: C.orange, 'stroke-width': ep }, s);
            if (ep > 6) el('path', { d: dd, fill: 'none', stroke: '#fff', 'stroke-width': ep - 3 }, s);
            el('circle', { cx: dx, cy: drop - 4, r: 3.5, fill: C.orange }, s);
          }
          tx(s, dx, drop + 14, '−' + nf(lost), { a: 'middle', s: 13, w: 800, c: C.fonce });
          tx(s, dx, drop + 28, loss[i], { a: 'middle', s: 10.5, c: C.ink2 });
        }
        el('rect', { x, y: y0, width: nw, height: h, rx: 3, fill: i === n - 1 ? C.vert : C.fonce }, s);
        const fin = i === n - 1, ax = fin ? x + nw : x, an = fin ? 'end' : 'start';
        tx(s, ax, y0 - 36, p[0].toUpperCase(), { a: an, s: 9.5, w: 700, c: C.ink3 });
        if (!fin) { tx(s, x, y0 - 14, nf(p[1]), { s: 20, w: 600, c: C.fonce }); if (i > 0) tx(s, x + nf(p[1]).length * 11 + 8, y0 - 14, pctTxt(p[1], st[i - 1][1]), { s: 11.5, w: 800, c: C.ink3 }); }
        else { const pc = i > 0 ? pctTxt(p[1], st[i - 1][1]) : ''; tx(s, ax, y0 - 14, pc, { a: 'end', s: 11.5, w: 800, c: C.ink3 }); tx(s, ax - (pc ? pc.length * 6.5 + 8 : 0), y0 - 14, nf(p[1]), { a: 'end', s: 20, w: 600, c: C.fonce }); }
      });
    };

    G.constellation = function (box) {
      const P = box.__d.points, W = box.clientWidth, H = 320, s = svgIn(box, W, H, 'Sites : transformation et financement'), L = 44, R = W - 10, T = 10, B = H - 40;
      const xs = P.map(p => p.x), ys = P.map(p => p.y);
      const x0 = Math.max(0, Math.floor((Math.min(...xs) - 5) / 5) * 5), x1 = Math.min(100, Math.ceil((Math.max(...xs) + 5) / 5) * 5);
      const y0 = Math.max(0, Math.floor((Math.min(...ys) - 10) / 10) * 10), y1 = Math.min(100, Math.ceil((Math.max(...ys) + 10) / 10) * 10);
      const X = v => L + (R - L) * (v - x0) / Math.max(1, x1 - x0), Y = v => B - (B - T) * (v - y0) / Math.max(1, y1 - y0);
      const mx = box.__d.moyX, my = box.__d.moyY;
      el('rect', { x: X(mx), y: T, width: R - X(mx), height: Y(my) - T, rx: 8, fill: C.okbg }, s);
      tx(s, R - 10, T + 18, 'au-dessus des deux moyennes', { a: 'end', s: 10.5, w: 800, c: C.mvert });
      for (let v = y0; v <= y1; v += 10) { el('line', { x1: L, y1: Y(v), x2: R, y2: Y(v), stroke: C.line }, s); tx(s, L - 8, Y(v) + 4, v + ' %', { a: 'end', s: 10.5, c: C.ink3 }); }
      for (let v = x0; v <= x1; v += 5) tx(s, X(v), B + 16, v + ' %', { a: 'middle', s: 10.5, c: C.ink3 });
      el('line', { x1: X(mx), y1: T, x2: X(mx), y2: B, stroke: C.line2, 'stroke-dasharray': '4 4' }, s);
      el('line', { x1: L, y1: Y(my), x2: R, y2: Y(my), stroke: C.line2, 'stroke-dasharray': '4 4' }, s);
      tx(s, R, B + 32, 'opportunités transformées en commande', { a: 'end', s: 10.5, c: C.ink3 });
      tx(s, L, T - 0, 'part financée', { s: 10.5, c: C.ink3 });
      const mxV = Math.max(1, ...P.map(p => p.v)), poses = [];
      const libre = (x, y, w) => { const bx = { x1: x, x2: x + w, y1: y - 11, y2: y + 3 }; if (bx.x1 < 0 || bx.x2 > W) return false; if (poses.some(o => bx.x1 < o.x2 && bx.x2 > o.x1 && bx.y1 < o.y2 && bx.y2 > o.y1)) return false; poses.push(bx); return true; };
      P.forEach(p => { const r = 6 + 16 * Math.sqrt(p.v / mxV); poses.push({ x1: X(p.x) - r, x2: X(p.x) + r, y1: Y(p.y) - r, y2: Y(p.y) + r }); });
      P.slice().sort((a, b) => b.v - a.v).forEach(p => {
        const r = 6 + 16 * Math.sqrt(p.v / mxV), x = X(p.x), y = Y(p.y), left = x > W * .66;
        const g = el('g', { style: 'cursor:pointer' }, s);
        el('circle', { cx: x, cy: y, r: r + 5, fill: C.bleu, 'fill-opacity': .1 }, g);
        el('circle', { cx: x, cy: y, r, fill: C.bleu, 'fill-opacity': .9, stroke: C.card, 'stroke-width': 1.5 }, g);
        if (r > 11) tx(g, x, y + 4, p.v, { a: 'middle', s: 11, w: 800, c: '#ffffff' });
        const lw = p.nom.length * 6.6;
        if (libre(left ? x - r - 6 - lw : x + r + 6, y + 4, lw)) tx(g, left ? x - r - 6 : x + r + 6, y + 4, p.nom, { a: left ? 'end' : 'start', s: 11, w: 800 });
        else if (libre(left ? x + r + 6 : x - r - 6 - lw, y + 4, lw)) tx(g, left ? x + r + 6 : x - r - 6, y + 4, p.nom, { a: left ? 'start' : 'end', s: 11, w: 800 });
        const t = el('title', {}, g); t.textContent = p.nom + ' · ' + p.v + ' commandes · ' + p.x + ' % des opportunités transformées · ' + p.y + ' % financées';
        g.addEventListener('click', () => allerSite(p.id));
      });
    };

    G.spark = function (box) {
      const pts = box.__d || [], W = box.clientWidth, H = 46, s = svgIn(box, W, H, 'Commandes par semaine'), mx = Math.max(1, ...pts), st = (W - 8) / Math.max(1, pts.length - 1);
      let p = ''; pts.forEach((v, i) => { p += (i ? 'L' : 'M') + (i * st).toFixed(1) + ' ' + (H - 4 - (v / mx) * (H - 10)).toFixed(1); });
      el('path', { d: p + ' L' + ((pts.length - 1) * st) + ' ' + H + ' L0 ' + H + ' Z', fill: C.bleu, 'fill-opacity': .1 }, s);
      el('path', { d: p, fill: 'none', stroke: C.bleu, 'stroke-width': 2, 'stroke-linejoin': 'round' }, s);
      el('circle', { cx: (pts.length - 1) * st, cy: H - 4 - (pts[pts.length - 1] / mx) * (H - 10), r: 4, fill: C.bleu, stroke: C.card, 'stroke-width': 2 }, s);
    };

    G.aire = function (box) {
      const M = box.__d, W = box.clientWidth, H = 200, s = svgIn(box, W, H, 'Commandes du groupe par semaine'), L = 36, R = W - 60, T = 10, B = H - 26, st = (R - L) / Math.max(1, M.length - 1);
      const mx = Math.max(10, ...M.map(m => m.v)), top = Math.ceil(mx / 50) * 50, Y = v => B - (B - T) * v / top;
      [0, top / 2, top].forEach(v => { el('line', { x1: L, y1: Y(v), x2: W, y2: Y(v), stroke: C.line }, s); tx(s, L - 8, Y(v) + 4, nf(v), { a: 'end', s: 10.5, c: C.ink3 }); });
      let p = ''; M.forEach((m, i) => { p += (i ? 'L' : 'M') + (L + i * st) + ' ' + Y(m.v); if (W > 520 || i % 2 === 1) tx(s, L + i * st, B + 17, m.lib, { a: 'middle', s: 10.5, c: C.ink3 }); });
      const g = el('linearGradient', { id: 'act-ga', x1: 0, y1: 0, x2: 0, y2: 1 }, el('defs', {}, s));
      el('stop', { offset: '0', 'stop-color': C.bleu, 'stop-opacity': .22 }, g); el('stop', { offset: '1', 'stop-color': C.bleu, 'stop-opacity': 0 }, g);
      el('path', { d: p + ' L' + R + ' ' + B + ' L' + L + ' ' + B + ' Z', fill: 'url(#act-ga)' }, s);
      el('path', { d: p, fill: 'none', stroke: C.bleu, 'stroke-width': 2.5, 'stroke-linejoin': 'round' }, s);
      const last = M[M.length - 1];
      el('circle', { cx: R, cy: Y(last.v), r: 5.5, fill: C.bleu, stroke: C.card, 'stroke-width': 2.5 }, s);
      tx(s, R + 10, Y(last.v) + 4, nf(last.v), { s: 13, w: 800 });
      tx(s, R + 10, Y(last.v) + 18, 'en cours', { s: 10, c: C.ink3 });
    };

    function dessiner() {
      __anchor.querySelectorAll('[data-g]').forEach(b => { const f = G[b.getAttribute('data-g')]; if (f && b.clientWidth && b.__d !== undefined) { try { f(b); } catch (e) { console.error('[activite] graphique', e); } } });
    }
    let rt; const auRedim = () => { clearTimeout(rt); rt = setTimeout(dessiner, 120); };
    try { FW().addEventListener('resize', auRedim); } catch (e) { window.addEventListener('resize', auRedim); }

    // ------------------------------------------------------------------ blocs communs
    const charge = msg => '<div class="charge"><i></i>' + esc(msg || 'Chargement…') + '</div>';
    const erreur = d => '<div class="erreur">Les données n\'ont pas pu être chargées : ' + esc(d.__err) + '</div>';
    const graph = (nom, cls) => '<div class="chart' + (cls ? ' ' + cls : '') + '" data-g="' + nom + '"></div>';
    function lecture(html) { return '<div class="lecture"><div class="t">Lecture</div>' + html + '</div>'; }
    function seg(nom, options, actuel) {
      return '<div class="seg" role="group" data-seg="' + nom + '">' + options.map(o => '<button data-v="' + o[0] + '" aria-pressed="' + (o[0] === actuel) + '">' + esc(o[1]) + '</button>').join('') + '</div>';
    }
    // Filtre d'univers commun à tous les écrans.
    const U = () => S.univers || null;
    const UK = () => ':' + (S.univers || 'tout');
    const LIB_U = { VN: 'VN', VO: 'VO', PRO: 'Pro' };
    const univSeg = () => seg('univers', [['', 'Tous'], ['VN', 'VN'], ['VO', 'VO'], ['PRO', 'Pro']], S.univers || '');
    const pastille = u => u && LIB_U[u] ? '<span class="pill u-' + u + '">' + LIB_U[u] + '</span>' : '';
    const repartition = (o, champ) => { if (!o) return ''; const x = ['VN', 'VO', 'PRO'].filter(k => o[k] != null).map(k => LIB_U[k] + ' ' + nf(champ ? o[k][champ] : o[k])); return x.join(' · '); };
    function projection(m) {
      if (!m || !m.jours_ecoules) return null;
      return Math.round(m.cdes * m.jours_total / m.jours_ecoules);
    }
    function cases(a) {
      const d = Math.max(0, Number(a.jours) || 0), l = Number(a.delai) || 0;
      if (a.statut_commande === 'Refused') return '<div class="jrow"><span class="jl"><b class="r">Commande refusée</b> · dernière activité il y a ' + plur(d, 'jour') + '</span></div>';
      let c = ''; for (let i = 0; i < Math.min(d, 40); i++) c += '<i class="' + (i < l ? 'ok' : 'ko') + '"></i>';
      const quoi = { devis: 'depuis le dernier échange sur la simulation', affaire: 'sans contact', commande: a.statut_commande === 'Awaiting Approval' ? 'en attente de validation' : 'commande à finaliser' }[a.etape] || '';
      return '<div class="jrow"><div class="cases" aria-hidden="true">' + c + '</div><span class="jl"><b>' + plur(d, 'jour') + '</b> ' + quoi + ' · délai ' + l + ' j' + (d > l ? ' · <b class="r">' + (d - l) + ' j de retard</b>' : '') + '</span></div>';
    }
    const LEVIERS = {
      'Simulation sans suite': 'Relance à deux : <b>appel du chef des ventes</b> ou geste commercial sur la simulation.',
      'Sans contact': 'Reprendre la main : <b>invitation à l\'essai</b> ou nouvelle proposition.',
      'En attente de validation': 'C\'est à vous : <b>valider le bon de commande</b> dans BACS.',
      'Commande à finaliser': '<b>Finaliser le bon de commande</b> avec le vendeur.',
      'Commande refusée': 'Revoir <b>le financement ou les conditions</b> avant de relancer.' };
    const PILL = { 'Simulation sans suite': 'rouge', 'Sans contact': 'orange', 'En attente de validation': 'orange', 'Commande à finaliser': 'bleu', 'Commande refusée': 'rouge' };

    // ------------------------------------------------------------------ écran VENDEUR
    function ecranVendeur() {
      const d = S.data['v:moi' + UK()];
      const railV = '<div class="rail"><h1>Ma journée</h1><span class="badge">' + esc((d && d.user && d.user.site) || '') + '</span><div class="droite">' + univSeg() + '</div></div>';
      if (d === undefined) { charger('v:moi' + UK(), () => rpc('act_vendeur', { p_univers: U() })); return railV + charge('Votre journée se prépare…'); }
      if (d && d.__err) return railV + erreur(d);
      if (!d) return railV + '<div class="vide">Aucune donnée.</div>';
      const m = d.mois || {}, aff = d.affaires || [], bloq = aff.filter(a => a.etat === 'bloquee');
      const reste = Math.max(0, (Number(m.objectif) || 0) - (Number(m.cdes) || 0));
      const pj = projection(m), now = auj();
      let titre = prenom(d.user) + ', ';
      titre += bloq.length ? '<b>' + plur(bloq.length, 'opportunité attend', 'opportunités attendent') + '</b> une relance' : 'aucune opportunité ne vous attend en retard';
      titre += m.objectif > 0 ? (reste > 0 ? ' et vous êtes à <b>' + plur(reste, 'commande') + '</b> de votre objectif.' : ' et votre objectif du mois est <b>atteint</b>.') : '.';
      // Journée : RDV du jour, leads à contacter, relances en retard (les plus grosses)
      const items = [];
      (d.rdv || []).forEach(r => items.push({ t: heure(r.debut), tri: r.debut, retard: false, titre: (r.type || 'RDV') + (r.client ? ' · ' + r.client : ''), sous: r.traite ? 'Compte rendu fait' : (new Date(r.debut) < now ? 'Compte rendu à faire' : 'À venir'), pill: ['vert', 'RDV'], client: r.id_client }));
      (d.leads || []).slice(0, 4).forEach(l => items.push({ t: 'Lead', tri: '0', retard: true, titre: 'Contacter ' + l.client, sous: l.source + ' · reçu le ' + new Date(l.recu_le).toLocaleDateString('fr-FR'), pill: ['rouge', 'Jamais joint'], client: l.id_client }));
      bloq.slice().sort((a, b) => (Number(b.montant) || 0) - (Number(a.montant) || 0)).slice(0, 5).forEach(a => items.push({ t: 'Retard', tri: '1', retard: true, titre: 'Relancer ' + a.client, sous: (LIB_U[a.univers] ? LIB_U[a.univers] + ' · ' : '') + a.motif + (a.vehicule ? ' · ' + a.vehicule : '') + (a.montant ? ' · ' + eur(a.montant) : ''), pill: ['rouge', a.jours + ' j'], client: a.id_client }));
      const jour = JOURS[now.getDay()] + ' ' + now.getDate() + ' ' + MOIS[now.getMonth()];
      setTimeout(() => {
        const g1 = __anchor.querySelector('[data-g="anneau"]'); if (g1) g1.__d = { fait: Number(m.cdes) || 0, cible: Number(m.objectif) || 0, proj: pj, sous: 'commandes', label: m.cdes + ' commandes sur ' + m.objectif };
        const g2 = __anchor.querySelector('[data-g="carte"]'); if (g2) g2.__d = aff;
      });
      return railV +
        '<div class="band"><div><div class="q">' + esc(jour) + '</div><h2>' + titre + '</h2>' +
        '<div class="pouls">' +
        '<div><div class="n">' + nf(m.cdes) + (m.objectif > 0 ? ' / ' + nf(m.objectif) : '') + '</div><div class="l">commandes du mois' + (U() ? ' · ' + LIB_U[U()] : '') + '</div></div>' +
        '<div><div class="n' + (bloq.length ? ' baisse' : '') + '">' + bloq.length + '</div><div class="l">relances en retard</div></div>' +
        '<div><div class="n">' + aff.filter(a => a.etat !== 'froide').length + '</div><div class="l">opportunités actives</div></div>' +
        '<div><div class="n">' + nf(m.jours_restants) + '</div><div class="l">jours ouvrés restants</div></div>' +
        '</div></div>' + graph('anneau', 'anneau') + '</div>' +
        '<div class="cols"><div class="card"><div class="ch"><h3>La carte de mes opportunités</h3><span>Bulle = une opportunité · taille = montant</span></div>' +
        (aff.length ? graph('carte') + lecture('Dans la zone rouge, l\'opportunité a dépassé son délai de relance (simulation et commande 3 j, opportunité sans simulation 7 j). Les bulles pâles n\'ont plus bougé depuis plus de 21 jours.') : '<div class="vide">Aucune opportunité ouverte sur les 90 derniers jours.</div>') + '</div>' +
        '<div class="card"><div class="ch"><h3>Aujourd\'hui</h3><span>' + plur(items.length, 'action') + '</span></div>' +
        (items.length ? '<div>' + items.map(i => '<div class="tl' + (i.retard ? ' retard' : '') + '"><time>' + esc(i.t) + '</time><div class="pin"><i></i></div><div class="tx">' +
          (i.client ? '<button class="lien" data-fiche="' + esc(i.client) + '"><b>' + esc(i.titre) + '</b></button>' : '<b>' + esc(i.titre) + '</b>') +
          '<small>' + esc(i.sous) + '</small></div><span class="pill ' + i.pill[0] + '">' + esc(i.pill[1]) + '</span></div>').join('') + '</div>' : '<div class="vide">Rien d\'urgent aujourd\'hui.</div>') +
        (d.leads_n > 4 ? '<div class="plus">+ ' + plur(d.leads_n - 4, 'autre lead') + ' à contacter dans le lead management.</div>' : '') +
        '<div class="note">Cette semaine : ' + nf(d.semaine && d.semaine.appels) + ' appels, ' + nf(d.semaine && d.semaine.rdv) + ' RDV, ' + nf(d.semaine && d.semaine.devis) + ' simulations, ' + nf(d.semaine && d.semaine.cdes) + ' commandes.</div></div></div>';
    }

    // ------------------------------------------------------------------ écran CHEF DES VENTES
    function choisirVendeur(id) { S.vendeur = String(id); rendre(); }
    function ecranChef() {
      const site = siteUnique();
      if (site == null) return '<div class="vide">Aucun site dans votre périmètre.</div>';
      const per = S.periode.chef, b = bornes(per);
      const cle = 'c:' + site + ':' + b.deb + ':' + b.fin + UK();
      const d = S.data[cle];
      const rail = '<div class="rail"><h1>Point du matin</h1><span class="badge">' + esc(nomSite(site)) + '</span><div class="droite">' + univSeg() +
        seg('chef', [['jour', 'Aujourd\'hui'], ['hier', 'Hier'], ['7j', '7 jours'], ['mois', 'Ce mois']], per) +
        DP.bouton(b.deb, b.fin, 'data-dp="chef"', 'Choisir les dates') + '</div></div>';
      if (d === undefined) { charger(cle, () => rpc('act_chef', { p_id_site: site, p_deb: b.deb, p_fin: b.fin, p_univers: U() })); return rail + charge('Préparation du point du matin…'); }
      if (d && d.__err) return rail + erreur(d);
      const eq = (d.equipe || []).filter(p => p.role === 4 || p.cdes > 0 || p.ouvertes > 0);
      if (!eq.length) return rail + '<div class="card"><div class="vide">Personne à suivre sur ce site.</div></div>';
      if (!S.vendeur || !eq.some(p => String(p.id) === String(S.vendeur))) S.vendeur = String(eq[0].id);
      const v = eq.find(p => String(p.id) === String(S.vendeur));
      const cv = 'v:' + v.id + UK();
      const dv = S.data[cv];
      if (dv === undefined) charger(cv, () => rpc('act_vendeur', { p_id_user: Number(v.id), p_univers: U() }));
      // moyenne équipe (vendeurs seulement)
      const vend = eq.filter(p => p.role === 4);
      const moy = k => vend.length ? vend.reduce((a, p) => a + (Number(p[k]) || 0), 0) / vend.length : 0;
      const atteinte = p => p.objectif > 0 ? Math.round(p.cdes / p.objectif * 100) : 0;
      setTimeout(() => {
        const q = __anchor.querySelector('[data-g="quad"]'); if (q) q.__d = eq.map(p => ({ id: p.id, ini: initiales(p), nom: nomCourt(p), x: atteinte(p), objectif: p.objectif, bloquees: p.bloquees }));
        const e = __anchor.querySelector('[data-g="ecart"]'); if (e) e.__d = [['Appels', 'appels'], ['RDV tenus', 'rdv'], ['Simulations', 'devis'], ['Commandes', 'cdes'], ['Leads joints', 'leads_contactes']].map(x => ({ lib: x[0], v: Number(v[x[1]]) || 0, moy: moy(x[1]) }));
        const a = __anchor.querySelector('[data-g="anneau"]'); if (a) a.__d = { fait: v.cdes, cible: v.objectif, proj: estMois(b) && dv && dv.mois ? projection(dv.mois) : null, sous: prenom(v) + ' · ' + libCourt(b), label: v.cdes + ' commandes' };
      });
      const team = '<div class="team" role="tablist" aria-label="Vendeur">' + eq.map(p => '<button class="who" role="tab" data-vendeur="' + p.id + '" aria-selected="' + (String(p.id) === String(S.vendeur)) + '"><span class="av">' + esc(initiales(p)) + '</span><span><b>' + esc(nomCourt(p)) + '</b><small' + (p.bloquees ? ' class="r"' : '') + '>' + (p.bloquees ? plur(p.bloquees, 'bloquée', 'bloquées') : 'rien de bloqué') + '</small></span></button>').join('') + '</div>';
      const reste = Math.max(0, v.objectif - v.cdes);
      const band = '<div class="band"><div><div class="q">' + esc(prenom(v) + ' ' + v.nom) + ' · ' + esc(b.lib) + '</div><h2>' +
        (v.bloquees ? '<b>' + plur(v.bloquees, 'opportunité bloque', 'opportunités bloquent') + '</b>, <b>' + keur(v.valeur_bloquee) + '</b> en jeu.' : 'Aucune opportunité bloquée.') +
        (v.objectif > 0 ? (reste > 0 ? ' Il manque <b>' + plur(reste, 'commande') + '</b> pour l\'objectif.' : ' Objectif <b>atteint</b>.') : '') + '</h2>' +
        '<div class="pouls"><div><div class="n">' + nf(v.cdes) + (v.objectif > 0 ? ' / ' + nf(v.objectif) : '') + '</div><div class="l">commandes · équipe ' + nf(eq.reduce((a, p) => a + p.cdes, 0)) + '</div></div>' +
        '<div><div class="n">' + nf(v.devis_ouverts) + '</div><div class="l">simulations en cours</div></div>' +
        '<div><div class="n">' + pctTxt(v.leads_contactes, v.leads) + '</div><div class="l">leads joints (' + nf(v.leads_contactes) + ' / ' + nf(v.leads) + ')</div></div></div></div>' +
        graph('anneau', 'anneau') + '</div>';
      let liste;
      if (dv === undefined) liste = charge('Chargement des opportunités…');
      else if (dv && dv.__err) liste = erreur(dv);
      else {
        const bl = (dv.affaires || []).filter(a => a.etat === 'bloquee').sort((a, b2) => (Number(b2.montant) || 0) - (Number(a.montant) || 0));
        const vis = bl.slice(0, 6);
        liste = vis.length ? vis.map(a => '<div class="deal" data-aff="' + esc(a.id_affaire) + '">' +
          '<div><h4><button class="lien" data-fiche="' + esc(a.id_client) + '">' + esc(a.client) + '</button>' + pastille(a.univers) + '</h4><div class="car">' + esc([a.vehicule, a.etape === 'devis' ? 'simulation' : a.etape === 'commande' ? 'commande' : 'opportunité sans simulation', 'ouverte le ' + new Date(a.ouverte_le).toLocaleDateString('fr-FR')].filter(Boolean).join(' · ')) + '</div></div>' +
          '<div class="val"><b>' + (a.montant ? eur(a.montant) : '—') + '</b><span class="pill ' + (PILL[a.motif] || 'orange') + '">' + esc(a.motif) + '</span></div>' +
          '<div class="jours">' + cases(a) + '</div>' +
          '<div class="levier"><p>' + (LEVIERS[a.motif] || '') + '</p><button class="btn" data-fiche="' + esc(a.id_client) + '">Ouvrir la fiche</button><button class="btn sec" data-note="' + esc(a.id_affaire) + '">Note pour ' + esc(prenom(v)) + '</button></div>' +
          '<div class="notebox" data-notebox="' + esc(a.id_affaire) + '" hidden><textarea aria-label="Note pour ' + esc(prenom(v)) + '">' + esc(a.client + ' : ') + '</textarea><div class="act"><button class="btn" data-envoyer="' + esc(a.id_affaire) + '" data-client="' + esc(a.id_client) + '">Envoyer à ' + esc(prenom(v)) + '</button><button class="btn sec" data-annuler="' + esc(a.id_affaire) + '">Annuler</button><span class="etat"></span></div></div>' +
          '</div>').join('') + (bl.length > 6 ? '<div class="plus">+ ' + plur(bl.length - 6, 'autre opportunité bloquée', 'autres opportunités bloquées') + ', de plus petite valeur.</div>' : '')
          : '<div class="vide">Aucune opportunité bloquée pour ' + esc(prenom(v)) + '.</div>';
      }
      const mins = eq.filter(p => p.objectif > 0 && atteinte(p) < 80 && p.bloquees > 0).map(p => prenom(p));
      return rail + team + band +
        '<div class="cols"><div class="card"><div class="ch"><h3>Opportunités qui bloquent</h3><span>Par valeur en jeu · état actuel</span></div>' + liste +
        '<div class="note">Bloquée : délai de relance dépassé (simulation et commande 3 j, opportunité sans simulation 7 j, validation 2 j), commande refusée. Au-delà de 21 jours sans activité, l\'opportunité est considérée comme froide.</div></div>' +
        '<div class="pile"><div class="card"><div class="ch"><h3>L\'équipe en un regard</h3><span>Objectif × opportunités bloquées</span></div>' + graph('quad') +
        lecture(mins.length ? 'À accompagner en priorité : <b>' + esc(mins.join(', ')) + '</b>, en retard sur l\'objectif avec des opportunités qui coincent.' : 'Personne n\'est à la fois en retard sur l\'objectif et bloqué sur des opportunités.') + '</div>' +
        '<div class="card"><div class="ch"><h3>' + esc(prenom(v)) + ' sur la période</h3><span>Écart à la moyenne des vendeurs</span></div>' + graph('ecart') + '</div></div></div>';
    }

    // ------------------------------------------------------------------ écran SITE
    const MOSAIQUE = { 'Refus de financement': ['var(--orange)', 'var(--bleu-fonce)'], 'Hors budget': ['var(--orange)', 'var(--bleu-fonce)'], 'Acheté ailleurs': ['var(--bleu)', 'var(--bleu)'], 'Délai de livraison': ['var(--bleu-clair)', 'var(--ink-2)'], 'Produit indisponible': ['var(--bleu-clair)', 'var(--ink-2)'], 'Autre ou non précisé': ['var(--line-2)', 'var(--ink-3)'] };
    // v13 : tuile chiffrée, barre simple et parcours de l'onglet Site.
    const COUL_MOTIF = { 'Refus de financement': '#fac055', 'Hors budget': '#fac055', 'Acheté ailleurs': '#2a5ea9' };
    function tuileK(lib, val, jauge, col, sous, brut) {
      return '<div class="k"><div class="kl">' + esc(lib) + '</div><div class="kv">' + (brut ? val : '<b>' + val + '</b>') + '</div>' +
        '<div class="trk">' + (jauge != null ? '<i style="width:' + Math.max(0, Math.min(100, jauge)) + '%;background:' + col + '"></i>' : '') + '</div><div class="ks">' + esc(sous) + '</div></div>';
    }
    function barre(lib, sous, p, col) {
      return '<div class="hb"><span>' + esc(lib) + (sous ? '<small>' + esc(sous) + '</small>' : '') + '</span><div class="t"><i style="width:' + Math.max(0, Math.min(100, p)) + '%;background:' + col + '"></i></div><b>' + p + ' %</b></div>';
    }
    function parcours(t) {
      const top = Math.max(1, Number(t.affaires) || 0), w = v => Math.max(0, Math.min(100, (Number(v) || 0) / top * 100));
      const et = [['Opportunités', t.affaires, C.clair], ['Simulées', t.devis, C.bleu], ['Commandes', t.gagnees, C.vert]];
      return '<div class="fu">' + et.map((x, i) => {
        const v = Number(x[1]) || 0, av = i ? Number(et[i - 1][1]) || 0 : v, perte = Math.max(0, av - v), wv = w(v), wa = w(av);
        const dedans = wv >= 7, coulN = i === 0 || !dedans ? C.fonce : '#ffffff';
        return '<div class="fu-r"><div class="fu-n">' + x[0] + '</div><div class="fu-b">' +
          (perte ? '<i class="p" style="left:' + wv + '%;width:' + (wa - wv) + '%"></i>' : '') +
          (v ? '<i style="width:' + wv + '%;background:' + x[2] + '"></i>' : '') +
          '<span style="left:0;color:' + coulN + '">' + nf(v) + '</span>' +
          (perte ? '<span style="left:' + (dedans ? wv : Math.max(wv, 6)) + '%;color:' + C.fonce + '">−' + nf(perte) + '</span>' : '') +
          '</div><div class="fu-v">' + (i ? pctTxt(v, av) : '') + '</div></div>';
      }).join('') + '<div class="fu-leg"><span><i style="background:' + C.bleu + '"></i>passent l\'étape</span><span><i style="background:#fdf3de;box-shadow:inset 0 0 0 1px ' + C.orange + '"></i>perdues à l\'étape</span></div></div>';
    }
    function ecranSite() {
      const bus1 = siteBus(); const sites = bus1 != null && S.ctx.sites.some(s => Number(s.id) === Number(bus1)) ? [Number(bus1)] : null;
      const per = S.periode.site, b = bornes(per);
      const k1 = 's:' + (sites || 'tout') + ':' + b.deb + ':' + b.fin + UK(), k2 = 'e:' + (sites || 'tout') + ':' + b.deb + ':' + b.fin + UK();
      const titre = sites ? nomSite(sites[0]) : (S.ctx.sites.length === 1 ? S.ctx.sites[0].nom : 'Tout le périmètre');
      const rail = '<div class="rail"><h1>' + esc(titre) + '</h1><span class="badge">Directeur de site</span><div class="droite">' + univSeg() +
        seg('site', [['mois', 'Ce mois'], ['mois_prec', 'Mois dernier'], ['3mois', '3 mois'], ['annee', 'Année']], per) + DP.bouton(b.deb, b.fin, 'data-dp="site"', 'Choisir les dates') + '</div></div>';
      const d = S.data[k1], e = S.data[k2];
      if (d === undefined) charger(k1, () => rpc('act_site', { p_sites: sites, p_deb: b.deb, p_fin: b.fin, p_univers: U() }));
      if (e === undefined) charger(k2, () => rpc('act_entonnoir', { p_sites: sites, p_deb: b.deb, p_fin: b.fin, p_univers: U() }));
      if (d === undefined || e === undefined) return rail + charge('Calcul du mois…');
      if (d.__err) return rail + erreur(d);
      if (e.__err) return rail + erreur(e);
      const m = d.mois || {}, t = (e && e.total) || { affaires: 0, devis: 0, gagnees: 0 }, L = d.entonnoir || {}, P = d.precedent || {};
      const pj = projection(m), enCours = estMois(b);
      const tr = pct(t.gagnees, t.affaires);
      const fuite = (t.affaires - t.devis) >= (t.devis - t.gagnees) ? 'avant la simulation' : 'entre la simulation et la commande';
      setTimeout(() => {
        const a = __anchor.querySelector('[data-g="anneau"]'); if (a) a.__d = { fait: Number(m.cdes) || 0, cible: Number(m.objectif) || 0, proj: pj, sous: 'commandes · ' + libCourt(b), label: m.cdes + ' commandes', titre: 'Commandes signées' };
      });
      const h2 = enCours && m.objectif > 0
        ? 'Le mois finira à <b>' + plur(pj, 'commande') + ' sur ' + nf(m.objectif) + '</b> si le rythme se maintient. Les opportunités se perdent surtout <b>' + fuite + '</b>.'
        : '<b>' + plur(Number(d.cdes) || 0, 'commande') + '</b> sur la période. Les opportunités se perdent surtout <b>' + fuite + '</b>.';
      const motifs0 = d.motifs || [];
      const totM = motifs0.reduce((a, x) => a + x.n, 0);
      const autreN = motifs0.filter(x => x.motif === 'Autre' || x.n / totM < .025).reduce((a, x) => a + x.n, 0);
      const motifs = motifs0.filter(x => x.motif !== 'Autre' && x.n / totM >= .025).concat(autreN ? [{ motif: 'Autre ou non précisé', n: autreN }] : []);
      const precis = totM ? Math.round((totM - (motifs0.find(x => x.motif === 'Autre') || { n: 0 }).n) / totM * 100) : 0;
      const src0 = (d.sources || []).slice().sort((a, b) => b.n - a.n), totS = src0.reduce((a, x) => a + (Number(x.n) || 0), 0);
      const sources = src0.length > 7 ? src0.slice(0, 6).concat([src0.slice(6).reduce((a, x) => ({ source: 'Autres sources', n: a.n + (Number(x.n) || 0), rdv: a.rdv + (Number(x.rdv) || 0) }), { source: 'Autres sources', n: 0, rdv: 0 })]) : src0;
      // v12 : tout vendeur qui a signé une commande figure au tableau (avant : seuls
      // ceux qui avaient ouvert au moins 3 opportunités, d'où un total inférieur à l'anneau).
      const cdesV0 = {}; (d.vendeurs || []).forEach(x => { cdesV0[x.id] = x; });
      const ev = (e.par_vendeur || []).filter(x => x.affaires >= 3 || (cdesV0[x.id_user] && cdesV0[x.id_user].cdes > 0));
      (d.vendeurs || []).filter(x => x.cdes > 0 && !ev.some(y => Number(y.id_user) === Number(x.id)))
        .forEach(x => ev.push({ id_user: x.id, nom: x.nom, affaires: 0, devis: 0, gagnees: 0 }));
      ev.sort((a, b) => ((cdesV0[b.id_user] || {}).cdes || 0) - ((cdesV0[a.id_user] || {}).cdes || 0) || b.affaires - a.affaires);
      const sommeV = ev.reduce((a, x) => a + (Number((cdesV0[x.id_user] || {}).cdes) || 0), 0);
      const sansVendeur = Math.max(0, (Number(d.cdes) || 0) - sommeV);
      const cdesV = {}; (d.vendeurs || []).forEach(x => { cdesV[x.id] = x.cdes; });
      return rail +
        '<div class="card"><div class="ch"><h3>Commandes · ' + esc(b.lib) + '</h3><span>' + (t.affaires ? 'Les opportunités se perdent surtout ' + fuite : '') + '</span></div><div class="kg">' +
        graph('anneau', 'anneau') +
        tuileK('Opportunités transformées', tr == null ? '—' : tr + ' %', tr, C.bleu, nf(t.gagnees) + ' sur ' + plur(t.affaires, 'créée', 'créées')) +
        tuileK('Ventes financées', pctTxt(d.fi, d.cdes), pct(d.fi, d.cdes), C.bleu, nf(d.fi) + ' sur ' + plur(Number(d.cdes) || 0, 'commande')) +
        (!U() && d.cdes_univers ? tuileK('Par univers', '<b class="t">' + esc(repartition(d.cdes_univers)) + '</b>', null, null, 'commandes de la période', true) : '') +
        tuileK('Délai lead → commande', L.delai_cde != null ? L.delai_cde + ' j' : '—', null, null, L.delai_cde != null ? 'en moyenne' : 'aucune commande issue d\'un lead') +
        '</div></div>' +
        '<div class="card"><div class="ch"><h3>Parcours des ' + plur(t.affaires, 'opportunité créée', 'opportunités créées') + '</h3><span>Ce qui passe chaque étape, ce qui s\'y perd</span></div>' +
        (t.affaires ? parcours(t) : '<div class="vide">Aucune opportunité créée sur la période.</div>') +
        // v11 : la tuile compte TOUTES les commandes de la période, le parcours
        // seulement celles issues des opportunités créées sur la période.
        ((Number(d.cdes) || 0) !== (Number(t.gagnees) || 0)
          ? '<div class="note">' + plur(Number(d.cdes) || 0, 'commande signée', 'commandes signées') + ' sur la période, dont <b>' + nf(t.gagnees) + '</b> issue' + (t.gagnees > 1 ? 's' : '') + ' des opportunités créées sur la période ; les '
            + nf(Math.max(0, (Number(d.cdes) || 0) - (Number(t.gagnees) || 0))) + ' autres viennent d\'opportunités plus anciennes.</div>' : '') + '</div>' +
        '<div class="cols eq"><div class="card"><div class="ch"><h3>Pourquoi on perd</h3><span>Opportunités abandonnées · 90 jours</span></div>' +
        (totM ? motifs.slice(0, 6).map(x => { const p4 = Math.round(x.n / totM * 100); return barre(x.motif, '', p4, COUL_MOTIF[x.motif] || C.clair); }).join('') +
          '<div class="note">Motif d\'abandon saisi dans BACS sur ' + plur(totM, 'opportunité') + ' (doublons exclus). Seules ' + precis + ' % portent un motif précis : un levier de qualité de saisie.</div>' : '<div class="vide">Aucun motif d\'abandon saisi sur 90 jours.</div>') + '</div>' +
        '<div class="card"><div class="ch"><h3>Leads web : ce que donne chaque source</h3><span>Part des leads de la source ayant obtenu un RDV</span></div>' +
        (sources.length ? sources.map(s => barre(s.source, plur(s.n, 'lead') + ' · ' + plur(Number(s.rdv) || 0, 'RDV', 'RDV'), pct(s.rdv, s.n) || 0, C.vert)).join('') : '<div class="vide">Pas assez de leads sur la période.</div>') +
        '<div class="note">' + nf(L.recus) + ' leads reçus, ' + pctTxt(L.contactes, L.recus) + ' joints' + (P.recus ? ' (période précédente : ' + nf(P.recus) + ' reçus)' : '') + '.' + (U() === 'PRO' ? ' Un lead n\'indique pas s\'il vient d\'un professionnel : tous les leads sont comptés.' : '') + '</div></div></div>' +
        '<div class="cols"><div class="card"><div class="ch"><h3>Les vendeurs côte à côte</h3><span>' + esc(b.lib) + '</span></div>' +
        (ev.length ? '<div class="scroll"><table><thead><tr><th>Vendeur</th><th>Opportunités</th><th>Simulations</th><th title="Commandes issues des opportunités créées sur la période">Cdes issues</th><th>Transformation</th><th title="Toutes les commandes de la période, quelle que soit la date de l\'opportunité">Total cdes</th></tr></thead><tbody>' +
          ev.map(x => { const p3 = pct(x.gagnees, x.affaires) || 0; return '<tr><td><b>' + esc(x.nom) + '</b></td><td>' + nf(x.affaires) + '</td><td>' + nf(x.devis) + '</td><td>' + nf(x.gagnees) + '</td><td><b>' + p3 + ' %</b><span class="mini"><i style="width:' + Math.min(100, p3 * 2) + '%"></i></span></td><td>' + nf(cdesV[x.id_user] != null ? cdesV[x.id_user] : 0) + '</td></tr>'; }).join('') +
          (sansVendeur ? '<tr><td><b>Sans vendeur rattaché</b></td><td></td><td></td><td></td><td></td><td>' + nf(sansVendeur) + '</td></tr>' : '') +
          '<tr><td><b>Total du site</b></td><td>' + nf(t.affaires) + '</td><td>' + nf(t.devis) + '</td><td>' + nf(t.gagnees) + '</td><td><b>' + (pct(t.gagnees, t.affaires) || 0) + ' %</b></td><td><b>' + nf(d.cdes) + '</b></td></tr>' +
          '</tbody></table></div><div class="note">« Total cdes » : toutes les commandes signées sur la période, le même chiffre que la tuile « Commandes signées » et qu\'« Anatomie d\'une vente ». « Cdes issues » : seulement celles nées d\'opportunités créées sur la période. Vendeurs ayant signé une commande ou ouvert au moins 3 opportunités.</div>' : '<div class="vide">Pas d\'activité vendeur sur la période.</div>') + '</div>' +
        '<div class="card"><div class="ch"><h3>Anatomie d\'une vente</h3><span class="pill attente">À brancher · ventes DMS</span></div>' +
        '<div class="vide">La marge par vente (véhicule, financement, services, remise) s\'affichera ici dès que le flux des ventes du DMS sera validé.</div>' +
        '<div class="kpis"><div><div class="n">' + nf(d.cdes) + '</div><div class="l">commandes sur la période</div></div><div><div class="n">' + nf(d.fi) + '</div><div class="l">avec financement</div></div></div></div></div>';
    }
    function allerSite(id) {
      const b = bus(); try { if (b && b.setSiteId) b.setSiteId(Number(id)); } catch (e) { }
      S.ecran = 'site'; rendre();
    }

    // ------------------------------------------------------------------ écran GROUPE
    function ecranGroupe() {
      const per = S.periode.groupe, b = bornes(per);
      const k1 = 'g:' + b.deb + ':' + b.fin + UK(), k2 = 'e:tout:' + b.deb + ':' + b.fin + UK();
      const rail = '<div class="rail"><h1>' + esc(S.ctx.sites.length > 3 ? 'Groupe' : 'Mes sites') + '</h1><span class="badge">Direction</span><div class="droite">' + univSeg() +
        seg('groupe', [['mois', 'Ce mois'], ['mois_prec', 'Mois dernier'], ['3mois', '3 mois'], ['annee', 'Année']], per) + DP.bouton(b.deb, b.fin, 'data-dp="groupe"', 'Choisir les dates') + '</div></div>';
      const d = S.data[k1], e = S.data[k2];
      if (d === undefined) charger(k1, () => rpc('act_groupe', { p_deb: b.deb, p_fin: b.fin, p_univers: U() }));
      if (e === undefined) charger(k2, () => rpc('act_entonnoir', { p_sites: null, p_deb: b.deb, p_fin: b.fin, p_univers: U() }));
      if (d === undefined || e === undefined) return rail + charge('Consolidation des sites…');
      if (d.__err) return rail + erreur(d);
      if (e.__err) return rail + erreur(e);
      const es = {}; (e.par_site || []).forEach(x => { es[x.id_site] = x; });
      const S2 = (d.sites || []).filter(s => s.cdes > 0 || s.leads > 0 || (es[s.id] && es[s.id].affaires > 0)).map(s => {
        const x = es[s.id] || { affaires: 0, gagnees: 0 };
        return Object.assign({}, s, { aff: x.affaires, gag: x.gagnees, tr: pct(x.gagnees, x.affaires), fip: pct(s.fi, s.cdes) });
      });
      if (!S2.length) return rail + '<div class="card"><div class="vide">Aucune activité sur la période.</div></div>';
      const tot = S2.reduce((a, s) => ({ cdes: a.cdes + s.cdes, fi: a.fi + s.fi, obj: a.obj + Number(s.objectif_mois || 0), cm: a.cm + s.cdes_mois, bloq: a.bloq + s.bloquees, val: a.val + Number(s.valeur_bloquee || 0) }), { cdes: 0, fi: 0, obj: 0, cm: 0, bloq: 0, val: 0 });
      const T = (e.total) || { affaires: 0, gagnees: 0 };
      const moyX = pct(T.gagnees, T.affaires) || 0, moyY = pct(tot.fi, tot.cdes) || 0;
      const pts = S2.filter(s => s.aff >= 5 && s.cdes >= 3).map(s => ({ id: s.id, nom: s.nom, v: s.cdes, x: s.tr || 0, y: s.fip || 0 }));
      const avecObj = S2.filter(s => Number(s.objectif_mois) > 0), objComplet = avecObj.length === S2.length;
      const mois = d.mois || {}, pjG = mois.jours_ecoules ? Math.round(tot.cm * mois.jours_total / mois.jours_ecoules) : null;
      // Signaux
      const sig = [];
      const avecTr = pts.slice().sort((a, b2) => a.x - b2.x);
      if (avecTr.length >= 3) {
        const bas = avecTr[0], haut = avecTr[avecTr.length - 1];
        if (bas.x < moyX - 3) sig.push(['!', 'rouge', bas.nom + ' : ' + bas.x + ' % des opportunités transformées', 'Contre ' + moyX + ' % en moyenne sur le groupe.']);
        if (haut.x > moyX + 3) sig.push(['✓', 'vert', haut.nom + ' : ' + haut.x + ' % des opportunités transformées', 'Le meilleur taux du groupe : une méthode à regarder de près.']);
        const fiBas = pts.slice().sort((a, b2) => a.y - b2.y)[0];
        if (fiBas && fiBas.y < moyY - 8) sig.push(['€', 'orange', fiBas.nom + ' : ' + fiBas.y + ' % de ventes financées', 'Contre ' + moyY + ' % en moyenne.']);
      }
      const bq = S2.slice().sort((a, b2) => b2.valeur_bloquee - a.valeur_bloquee)[0];
      if (bq && bq.bloquees > 0) sig.push(['⏱', 'orange', bq.nom + ' : ' + plur(bq.bloquees, 'opportunité bloquée', 'opportunités bloquées'), keur(bq.valeur_bloquee) + ' en jeu, relances en retard.']);
      const sansObj = S2.filter(s => !(Number(s.objectif_mois) > 0)).length;
      // Série hebdomadaire du groupe
      const nbS = (S2[0].semaines || []).length, lundi = new Date(); lundi.setDate(lundi.getDate() - ((lundi.getDay() + 6) % 7));
      const serie = []; for (let i = 0; i < nbS; i++) { const dd = plus(lundi, -7 * (nbS - 1 - i)); serie.push({ lib: dd.getDate() + '/' + (dd.getMonth() + 1), v: S2.reduce((a, s) => a + (Number((s.semaines || [])[i]) || 0), 0) }); }
      setTimeout(() => {
        const a = __anchor.querySelector('[data-g="anneau"]'); if (a) a.__d = { fait: tot.cm, cible: objComplet ? tot.obj : 0, proj: objComplet ? pjG : null, sous: 'commandes du mois', label: tot.cm + ' commandes', vide: objComplet ? null : (avecObj.length ? 'objectif : ' + plur(avecObj.length, 'site') + ' sur ' + S2.length : null) };
        const c = __anchor.querySelector('[data-g="constellation"]'); if (c) c.__d = { points: pts, moyX, moyY };
        const r = __anchor.querySelector('[data-g="aire"]'); if (r) r.__d = serie;
        __anchor.querySelectorAll('[data-g="spark"]').forEach(x => { const s = S2.find(y => String(y.id) === x.getAttribute('data-site')); x.__d = s ? s.semaines : []; });
      });
      const meilleur = avecTr.length ? avecTr[avecTr.length - 1] : null, pire = avecTr.length ? avecTr[0] : null;
      return rail +
        '<div class="band"><div><div class="q">' + esc(b.lib) + ' · ' + plur(S2.length, 'site actif', 'sites actifs') + '</div><h2><b>' + plur(tot.cdes, 'commande') + '</b>, ' + (moyX ? '<b>' + moyX + ' %</b> des opportunités transformées' : '') +
        (meilleur && pire && meilleur !== pire ? ', de <b>' + pire.x + ' %</b> à ' + esc(pire.nom) + ' à <b>' + meilleur.x + ' %</b> à ' + esc(meilleur.nom) : '') + '.</h2>' +
        '<div class="pouls"><div><div class="n">' + pctTxt(tot.fi, tot.cdes) + '</div><div class="l">ventes financées par nos soins</div></div>' +
        '<div><div class="n">' + nf(tot.bloq) + '</div><div class="l">opportunités bloquées · ' + keur(tot.val) + '</div></div>' +
        (!U() && e.par_univers ? '<div><div class="n" style="font-size:15px;padding-top:5px">' + esc(repartition(e.par_univers, 'gagnees')) + '</div><div class="l">commandes issues des opportunités</div></div>' : '') +
        (pjG != null && estMois(b) ? '<div><div class="n">' + nf(pjG) + '</div><div class="l">commandes projetées fin de mois</div></div>' : '') + '</div></div>' +
        graph('anneau', 'anneau') + '</div>' +
        '<div class="cols"><div class="card"><div class="ch"><h3>Transformation et financement</h3><span>Bulle = commandes · clic pour ouvrir le site</span></div>' +
        (pts.length >= 2 ? graph('constellation') + lecture('En vert : les sites au-dessus de la moyenne du groupe sur les deux axes. Plus la bulle est à droite, plus les opportunités deviennent des commandes ; plus elle est haute, plus les ventes passent par notre financement.') : '<div class="vide">Pas assez de sites actifs pour les comparer.</div>') + '</div>' +
        '<div class="card"><div class="ch"><h3>Ce qui mérite une question</h3><span>Détecté automatiquement</span></div>' +
        (sig.length ? '<div>' + sig.map(x => '<div class="signal"><span class="lv" style="background:var(--' + (x[1] === 'vert' ? 'ok-bg' : x[1] === 'bleu' ? 'calme-bg' : 'alerte-bg') + ');color:var(--m-' + (x[1] === 'vert' ? 'vert' : x[1] === 'bleu' ? 'bleu' : 'orange') + ')">' + x[0] + '</span><p>' + esc(x[2]) + '<small>' + esc(x[3]) + '</small></p></div>').join('') + '</div>' : '<div class="vide">Aucun écart marquant.</div>') +
        (sansObj ? '<div class="note">' + plur(sansObj, 'site n\'a', 'sites n\'ont') + ' pas d\'objectif saisi ce mois-ci.</div>' : '') + '</div></div>' +
        '<div class="sites">' + S2.map(s => '<div class="card site" data-site-go="' + s.id + '"><div class="top"><h4>' + esc(s.nom) + '</h4>' +
          (s.objectif_mois > 0 ? '<span class="pill ' + (s.cdes_mois / s.objectif_mois >= (mois.jours_ecoules / mois.jours_total) * .95 ? 'vert">Dans l\'objectif' : 'orange">En retard') + '</span>' : '<span class="pill bleu">' + esc(s.reseau || '') + '</span>') + '</div>' +
          '<div class="chart" data-g="spark" data-site="' + s.id + '"></div><div class="note" style="margin-top:0">Commandes par semaine, 12 semaines</div>' +
          '<dl><div><dt>Commandes</dt><dd>' + nf(s.cdes) + (s.objectif > 0 ? ' / ' + nf(s.objectif) : '') + '</dd></div><div><dt>Transfo</dt><dd>' + (s.tr == null ? '—' : s.tr + ' %') + '</dd></div><div><dt>Bloquées</dt><dd>' + nf(s.bloquees) + '</dd></div></dl></div>').join('') + '</div>' +
        '<div class="card"><div class="ch"><h3>Commandes du groupe, 12 dernières semaines</h3><span>La marge s\'ajoutera avec le flux des ventes DMS</span></div>' + graph('aire') + '</div>';
    }

    // ------------------------------------------------------------------ écran EN DIRECT (v10)
    const GENRE = {
      commande: ['vert', 'Commande'], devis: ['bleu', 'Simulation'], affaire: ['bleu', 'Opportunité'],
      lead: ['orange', 'Lead reçu'], lead_pris: ['orange', 'Lead pris'], lead_contacte: ['vert', 'Lead joint'],
      rdv: ['bleu', 'RDV'], livraison: ['vert', 'Livraison'] };
    const hm = iso => { const d = new Date(iso); return isNaN(d) ? '' : d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit', timeZone: 'Europe/Paris' }); };
    const ilYa = iso => { const m = Math.round((Date.now() - new Date(iso).getTime()) / 60000); return isNaN(m) ? '' : m < 1 ? 'à l\'instant' : m < 60 ? 'il y a ' + m + ' min' : m < 1440 ? 'il y a ' + Math.floor(m / 60) + ' h ' + String(m % 60).padStart(2, '0') : 'le ' + new Date(iso).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }) + ' à ' + hm(iso); };
    // v11 : un jour choisi (S.directJour, AAAA-MM-JJ) ; vide = aujourd'hui, en direct.
    function jourParis(dt) { return new Date(dt || Date.now()).toLocaleDateString('sv-SE', { timeZone: 'Europe/Paris' }); }
    function dateLongue(iso) { const p = String(iso || '').split('-').map(Number); if (p.length < 3) return ''; const x = new Date(p[0], p[1] - 1, p[2]); return JOURS[x.getDay()] + ' ' + x.getDate() + ' ' + MOIS[x.getMonth()]; }
    // v12 : S.directAu = fin de période (vide = un seul jour).
    function directAu() { return S.directAu && S.directJour && S.directAu > S.directJour ? (S.directAu > jourParis() ? jourParis() : S.directAu) : null; }
    function directLive() { return !S.directJour || (S.directJour >= jourParis() && !directAu()); }
    function cleDirect() { const site = siteUnique(); return site == null ? null : 'd:' + site + ':' + (directLive() ? '' : S.directJour + ':' + (directAu() || '')); }
    async function rafraichirDirect(force) {
      const cle = cleDirect(); if (!cle || S.charge[cle]) return;
      if (!force && S.data[cle] !== undefined && S.data[cle].__le && Date.now() - S.data[cle].__le < 50000) return;
      S.charge[cle] = true;
      try {
        const site = Number(cle.split(':')[1]), jour = cle.split(':')[2] || null, au = cle.split(':')[3] || null;
        const r = await rpc('act_direct', jour ? (au ? { p_id_site: site, p_jour: jour, p_au: au } : { p_id_site: site, p_jour: jour }) : { p_id_site: site });
        if (r) r.__le = Date.now(); S.data[cle] = r;
      }
      catch (e) { console.error('[activite] direct', e); if (S.data[cle] === undefined) S.data[cle] = { __err: e.message || String(e) }; }
      S.charge[cle] = false;
      if (S.ecran === 'direct') rendre();
    }
    // Toutes les minutes, si l'écran « En direct » est affiché et la page visible.
    if (!window.__act4Direct) {
      window.__act4Direct = setInterval(() => {
        const st = window.__act4; let cache = false;
        try { cache = FW().document.hidden; } catch (e) { }
        if (st && st.ecran === 'direct' && !cache && window.__act4RafDirect && window.__act4DirectLive && window.__act4DirectLive()) window.__act4RafDirect();
      }, 60000);
    }
    function tuile(n, lib, avant, alerte) {
      let d = '';
      if (avant != null) {
        const e = (Number(n) || 0) - (Number(avant) || 0);
        d = '<div class="d' + (e > 0 ? ' h' : e < 0 ? ' b' : '') + '">' + (e > 0 ? '+' + e : e < 0 ? String(e) : '=') + ' ' + (S.cmpLib || 'vs il y a 7 j') + ' (' + nf(avant) + ')</div>';
      }
      return '<div class="tuile' + (alerte ? ' alerte' : '') + '"><div class="n">' + nf(n) + '</div><div class="l">' + lib + '</div>' + d + '</div>';
    }
    function ecranDirect() {
      const site = siteUnique();
      if (site == null) return '<div class="vide">Aucun site dans votre périmètre.</div>';
      const live = directLive(), cle = cleDirect(), d = S.data[cle];
      const bacsVieux = live && d && d.bacs_a_jour && (Date.now() - new Date(d.bacs_a_jour).getTime()) > 30 * 60000;
      const auj = jourParis(), choisi = live ? auj : S.directJour;
      const hier = jourParis(Date.now() - 86400000);
      // v11 : sélecteur de jour — aujourd'hui (en direct), hier, ou n'importe quel jour passé.
      const selJour = '<div class="seg"><button data-direct-jour="" aria-pressed="' + live + '">Aujourd\'hui</button>'
        + '<button data-direct-jour="' + hier + '" aria-pressed="' + (choisi === hier && !directAu()) + '">Hier</button></div>'
        + DP.bouton(choisi, directAu() || choisi, 'data-direct-cal="1"', 'Choisir un jour ou une période');
      const periode = !!directAu();
      const rail = '<div class="rail"><h1>' + (live ? 'En direct' : periode ? 'Du ' + esc(dateLongue(choisi)) + ' au ' + esc(dateLongue(directAu())) : 'Journée du ' + esc(dateLongue(choisi))) + '</h1><span class="badge">' + esc(nomSite(site)) + '</span><div class="droite">'
        + selJour
        + (live && d && d.__le ? '<span class="live' + (bacsVieux ? ' vieux' : '') + '"><i></i>Mis à jour à ' + hm(d.__le) + '</span>' : '')
        + (live ? '<button class="btn sec" data-direct-maj="1">Actualiser</button>' : '') + '</div></div>';
      if (d === undefined) { rafraichirDirect(true); return rail + charge('La journée se charge…'); }
      if (d && d.__err) return rail + erreur(d);
      if (!d) return rail + '<div class="vide">Aucune donnée.</div>';
      const t = d.totaux || {}, w = d.semaine_passee || {}, now = new Date();
      const jour = live ? JOURS[now.getDay()] + ' ' + now.getDate() + ' ' + MOIS[now.getMonth()] + ', ' + hm(now)
                        : periode ? plur(Number(d.jours) || 0, 'jour') + ', du ' + dateLongue(choisi) + ' au ' + dateLongue(directAu())
                        : dateLongue(choisi) + ', journée complète';
      S.cmpLib = periode ? 'vs les ' + nf(d.decalage_jours || 7) + ' j d\'avant' : 'vs il y a 7 j';
      let titre = '<b>' + plur(t.commandes || 0, 'commande') + '</b>';
      if (t.commandes) titre += ' (' + [t.commandes_vn ? t.commandes_vn + ' VN' : '', t.commandes_vo ? t.commandes_vo + ' VO' : ''].filter(Boolean).join(', ') + ')';
      titre += ', <b>' + plur(t.devis || 0, 'simulation') + '</b> et <b>' + plur(t.leads || 0, 'lead') + '</b>' + (live ? ' depuis ce matin.' : periode ? ' sur la période.' : ' ce jour-là.');
      if (live && t.pool) titre += ' <b>' + plur(t.pool, 'lead attend', 'leads attendent') + '</b> dans le Pool.';
      const band = '<div class="band" style="grid-template-columns:minmax(0,1fr)"><div><div class="q">' + esc(jour) + '</div><h2>' + titre + '</h2>'
        + '<div class="tuiles">'
        + tuile(t.commandes, 'commandes<br><small style="font-weight:600;color:var(--ink-3)">VN transmises · VO validées</small>', w.commandes)
        + tuile(t.devis, 'simulations', w.devis)
        + tuile(t.affaires, 'opportunités ouvertes', w.affaires)
        + tuile(t.leads, 'leads reçus · ' + nf(t.leads_pris) + ' pris · ' + nf(t.leads_contactes) + ' joints', w.leads)
        + (live ? tuile(t.pool, 'en attente dans le Pool', null, t.pool > 0) : '')
        + tuile(t.rdv_faits, (live ? 'RDV passés · ' + nf(t.rdv_a_venir) + ' à venir' : 'RDV') + (t.livraisons ? ' · ' + plur(t.livraisons, 'livraison') : ''), null)
        + tuile(t.appels_sortants, 'appels sortants · ' + nf(t.appels_entrants) + ' entrants', w.appels_sortants)
        + '</div></div></div>';
      const avert = bacsVieux ? lecture('Les commandes et simulations viennent de BACS : la dernière remontée date <b>' + esc(ilYa(d.bacs_a_jour)) + '</b>. Tant que la récolte BACS ne tourne pas, ces chiffres ne bougent pas.') : '';
      const fil = d.fil || [];
      const ligne = f => {
        const g = GENRE[f.genre] || ['bleu', f.genre];
        let titreL, sous;
        if (f.genre === 'lead') { titreL = f.libelle; sous = f.detail || ''; }
        else if (f.genre === 'lead_pris') { titreL = (f.qui || 'Un vendeur') + ' prend le lead de ' + f.libelle; sous = ''; }
        else if (f.genre === 'lead_contacte') { titreL = (f.qui || 'Le vendeur') + ' joint ' + f.libelle; sous = ''; }
        else if (f.genre === 'rdv' || f.genre === 'livraison') { titreL = (f.detail || 'RDV') + ' · ' + f.libelle; sous = f.qui || ''; }
        else { titreL = (f.detail || 'Client') + (f.montant ? ' · ' + eur(f.montant) : ''); sous = [f.qui, f.libelle].filter(Boolean).join(' · '); }
        return '<div class="tl g-' + esc(f.genre) + '"><time>' + esc(hm(f.quand)) + '</time><div class="pin"><i></i></div><div class="tx"><b>' + esc(titreL) + '</b>'
          + (sous ? '<small>' + esc(sous) + '</small>' : '') + '</div><span class="pill ' + g[0] + '">' + esc(g[1]) + (f.univers ? ' ' + esc(f.univers) : '') + '</span></div>';
      };
      const cFil = '<div class="card"><div class="ch"><h3>' + (periode ? 'Le fil de la période' : 'Le fil de la journée') + '</h3><span>' + plur(fil.length, 'événement') + ', le plus récent en haut</span></div>'
        + (fil.length ? '<div>' + fil.map(ligne).join('') + '</div>' : '<div class="vide">' + (live ? 'Rien encore aujourd\'hui.' : periode ? 'Rien sur la période.' : 'Rien ce jour-là.') + '</div>') + '</div>';
      const eq = d.equipe || [];
      const point = it => { if (!it || !live) return ''; const m = (Date.now() - new Date(it).getTime()) / 60000; return m < 90 ? 'v' : m < 180 ? 'o' : ''; };
      const z = n => '<td' + (Number(n) ? '' : ' class="z"') + '>' + nf(n) + '</td>';
      const cEq = '<div class="card"><div class="ch"><h3>' + (live ? 'L\'équipe aujourd\'hui' : periode ? 'L\'équipe sur la période' : 'L\'équipe ce jour-là') + '</h3><span>' + (live ? 'Point vert : actif depuis moins d\'1 h 30' : periode ? 'Vu : dernière action de la période' : 'Vu à : dernière action de la journée') + '</span></div>'
        + (eq.length ? '<div class="scroll"><table class="eqd"><thead><tr><th>Vendeur</th><th>Cdes</th><th>Simu</th><th>RDV</th><th>Appels</th><th>Leads</th><th>Vu à</th></tr></thead><tbody>'
          + eq.map(p => '<tr><td><span class="pt ' + point(p.derniere_action) + '"></span><b>' + esc(p.nom || '') + '</b></td>' + z(p.commandes) + z(p.devis) + z(p.rdv) + z(p.appels)
            + '<td' + (Number(p.leads_pris) ? '' : ' class="z"') + '>' + nf(p.leads_contactes) + '/' + nf(p.leads_pris) + '</td><td' + (p.derniere_action ? '' : ' class="z"') + '>' + (p.derniere_action ? esc(periode ? new Date(p.derniere_action).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) + ' ' + hm(p.derniere_action) : hm(p.derniere_action)) : '—') + '</td></tr>').join('')
          + '</tbody></table></div><div class="note">Leads : joints / pris ' + (live ? 'aujourd\'hui' : periode ? 'sur la période' : 'ce jour-là') + '. Appels : sortants passés par le 3CX.</div>' : '<div class="vide">Personne à suivre sur ce site.</div>') + '</div>';
      const av = d.a_venir || [];
      const cAv = '<div class="card"><div class="ch"><h3>Encore aujourd\'hui</h3><span>' + plur(av.length, 'rendez-vous', 'rendez-vous') + '</span></div>'
        + (av.length ? '<div>' + av.map(r => '<div class="tl"><time>' + esc(hm(r.quand)) + '</time><div class="pin"><i></i></div><div class="tx"><b>' + esc((r.type || 'RDV') + (r.client ? ' · ' + r.client : '')) + '</b><small>' + esc(r.qui || '') + '</small></div></div>').join('') + '</div>'
          : '<div class="vide">Plus de rendez-vous prévu aujourd\'hui.</div>') + '</div>';
      return rail + band + avert + '<div class="cols"><div class="pile">' + cFil + '</div><div class="pile">' + cEq + (live ? cAv : '') + '</div></div>'
        + '<div class="note">Commandes : VN au jour de la transmission au constructeur, VO validées ou en attente d\'approbation. Simulations : devis créés dans BACS. Hors grands comptes. '
        + (live ? 'Comparaison avec le même jour, à la même heure, il y a 7 jours. L\'écran se met à jour tout seul toutes les minutes.'
                : 'Comparaison avec la journée entière d\'il y a 7 jours.') + '</div>';
    }
    window.__act4RafDirect = () => rafraichirDirect(false);
    window.__act4DirectLive = directLive;

    // ------------------------------------------------------------------ rendu
    const LIB_ECRAN = { direct: 'En direct', vendeur: 'Ma journée', chef: 'Point du matin', site: 'Site', groupe: 'Groupe' };
    function rendre() {
      poserStyle();
      let corps;
      if (S.err) corps = '<div class="erreur">' + esc(S.err) + '</div>';
      else if (!S.ctx) corps = charge();
      else if (!(S.ctx.ecrans || []).length) corps = '<div class="card"><div class="vide">Le suivi d\'activité concerne les équipes commerciales. Votre poste de travail reste votre point d\'entrée.</div></div>';
      else {
        if (!S.ecran || S.ctx.ecrans.indexOf(S.ecran) < 0) S.ecran = S.ctx.ecrans[0];
        const onglets = S.ctx.ecrans.length > 1 ? '<div>' + seg('ecran', S.ctx.ecrans.map(e => [e, LIB_ECRAN[e]]), S.ecran).replace('class="seg"', 'class="seg ecrans"') + '</div>' : '';
        const f = { direct: ecranDirect, vendeur: ecranVendeur, chef: ecranChef, site: ecranSite, groupe: ecranGroupe }[S.ecran];
        corps = onglets + f();
      }
      __anchor.innerHTML = '<div class="aw">' + corps + '</div>';
      lier();
      setTimeout(dessiner, 0);
    }

    function lier() {
      __anchor.querySelectorAll('[data-seg]').forEach(g => g.addEventListener('click', ev => {
        const b = ev.target.closest('button'); if (!b) return;
        const nom = g.getAttribute('data-seg'), v = b.getAttribute('data-v');
        if (nom === 'ecran') S.ecran = v; else if (nom === 'univers') S.univers = v || null; else { S.periode[nom] = v; if (nom === 'chef') S.plage = null; }
        rendre();
      }));
      __anchor.querySelectorAll('[data-dp]').forEach(btn => btn.addEventListener('click', () => {
        const nom = btn.getAttribute('data-dp'), b = bornes(S.periode[nom]);
        DP.ouvrir(btn, b.deb, (deb, fin) => { S.plages[nom] = { deb, fin }; S.periode[nom] = 'libre:' + nom; rendre(); });
      }));
      __anchor.querySelectorAll('[data-plage]').forEach(inp => inp.addEventListener('change', () => {
        const deb = __anchor.querySelector('[data-plage="deb"]').value, fin = __anchor.querySelector('[data-plage="fin"]').value;
        if (!deb || !fin || deb > fin) return;
        S.plage = { deb, fin }; S.periode.chef = 'libre'; rendre();
      }));
      __anchor.querySelectorAll('[data-direct-jour]').forEach(b => b.addEventListener('click', () => { S.directJour = b.getAttribute('data-direct-jour') || null; S.directAu = null; rendre(); }));
      __anchor.querySelectorAll('[data-direct-cal]').forEach(btn => btn.addEventListener('click', (ev) => {
        ev.stopPropagation();
        const auj = jourParis();
        DP.ouvrir(btn, S.directJour || auj, (deb, fin) => {
          if (deb > auj) deb = auj; if (fin > auj) fin = auj;
          if (deb === fin) { S.directJour = deb >= auj ? null : deb; S.directAu = null; }
          else { S.directJour = deb; S.directAu = fin; }
          rendre();
        }, { max: auj });
      }));
      __anchor.querySelectorAll('[data-direct-maj]').forEach(b => b.addEventListener('click', () => { b.disabled = true; b.textContent = 'Actualisation…'; rafraichirDirect(true); }));
      __anchor.querySelectorAll('[data-vendeur]').forEach(b => b.addEventListener('click', () => choisirVendeur(b.getAttribute('data-vendeur'))));
      __anchor.querySelectorAll('[data-fiche]').forEach(b => b.addEventListener('click', () => ouvrirFiche(b.getAttribute('data-fiche'))));
      __anchor.querySelectorAll('[data-site-go]').forEach(c => c.addEventListener('click', () => allerSite(c.getAttribute('data-site-go'))));
      __anchor.querySelectorAll('[data-note]').forEach(b => b.addEventListener('click', () => {
        const box = __anchor.querySelector('[data-notebox="' + b.getAttribute('data-note') + '"]'); if (!box) return;
        box.hidden = !box.hidden; if (!box.hidden) { const t = box.querySelector('textarea'); t.focus(); t.setSelectionRange(t.value.length, t.value.length); }
      }));
      __anchor.querySelectorAll('[data-annuler]').forEach(b => b.addEventListener('click', () => { const box = __anchor.querySelector('[data-notebox="' + b.getAttribute('data-annuler') + '"]'); if (box) box.hidden = true; }));
      __anchor.querySelectorAll('[data-envoyer]').forEach(b => b.addEventListener('click', async () => {
        const box = b.closest('.notebox'), t = box.querySelector('textarea'), etat = box.querySelector('.etat');
        const msg = (t.value || '').trim(); if (!msg) return;
        b.disabled = true; etat.className = 'etat'; etat.textContent = 'Envoi…';
        try { await envoyerNote(S.vendeur, b.getAttribute('data-client'), msg); etat.className = 'etat ok-msg'; etat.textContent = 'Note envoyée'; t.disabled = true; }
        catch (e) { etat.className = 'etat ko-msg'; etat.textContent = 'Échec : ' + (e.message || e); b.disabled = false; }
      }));
    }

    // Changement de site dans la barre du haut : on recharge l'écran courant.
    (function lierBus(n) {
      const b = bus();
      if (!b || !b.onChange) { if ((n || 0) < 120) setTimeout(() => lierBus((n || 0) + 1), 250); return; }
      if (window.__act4Bus) return;
      window.__act4Bus = true;
      b.onChange(() => { const st = window.__act4; if (st && st.ctx && window.__act4Rendre) { st.vendeur = null; window.__act4Rendre(); } });
    })();
    window.__act4Rendre = rendre;

    // ------------------------------------------------------------------ démarrage
    rendre();
    try { S.ctx = await rpc('act_contexte', {}); }
    catch (e) { S.err = 'Le suivi d\'activité n\'a pas pu démarrer : ' + (e.message || e); }
    if (S.ctx && !S.ctx.sites) S.ctx.sites = [];
    // v10 : « En direct » pour qui pilote un site (chef, directeur, direction).
    if (S.ctx && Array.isArray(S.ctx.ecrans) && S.ctx.ecrans.some(e => e === 'chef' || e === 'site' || e === 'groupe') && S.ctx.ecrans.indexOf('direct') < 0) {
      S.ctx.ecrans.unshift('direct');
      // Sur téléphone, on arrive directement sur la journée en cours.
      try { if (!S.ecran && (FW().innerWidth || 1200) < 760) S.ecran = 'direct'; } catch (e) { }
    }
    rendre();
  }
});
