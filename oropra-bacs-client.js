/* =====================================================================
 * oropra-bacs-client.js — création d'un client SUIVIE dans One Data ET
 * dans BACS, partagée                                  v1 (22/10/2026)
 *
 * Un particulier créé par un vendeur doit exister dans BACS (règle du
 * 22/10/2026). La création se faisait en deux temps invisibles : la fiche
 * One Data, puis un geste mis en file que l'extension appliquait quand elle
 * passait. Le vendeur ne savait ni si BACS avait suivi, ni où trouver le
 * compte.
 *
 * Désormais, au clic sur « Enregistrer » :
 *   1. BACS doit être OUVERT sur le poste du vendeur (vérifié en direct par
 *      l'extension, et par la base) — sinon, erreur, et rien n'est créé ;
 *   2. un panneau d'avancement affiche la création One Data, puis la
 *      création BACS (demande, acceptation, compte, affaire), chacune avec
 *      son indicateur ;
 *   3. en fin de parcours, le bouton « B » ouvre le compte dans BACS.
 * Si BACS échoue après la création One Data, la fiche est gardée et le geste
 * reste en file : l'extension le rejouera d'elle-même (3 minutes plus tard).
 *
 * Expose window.oropraBacsClient :
 *   creer(supabase, { p_payload, p_id_site, p_id_user })
 *       -> même forme que supabase.rpc('client_creer') : { data, error }
 *   compte(supabase, idClient) -> { compte, url, nom, nb } | null
 *   ouvrir(url)                -> ouvre le compte BACS dans un nouvel onglet
 *
 * Sur un tenant sans écriture BACS, ou pour une société (parcours BACS pas
 * encore relevé), creer() se réduit à l'appel client_creer habituel.
 * Charte One Data : bleus #1F4A85 / #2a5ea9, vert #53bda7, rouge #e24b4a,
 * Nunito Sans — jamais de noir.
 * ===================================================================== */
(function () {
  'use strict';
  if (window.oropraBacsClient && window.oropraBacsClient.version >= 1) return;

  var DELAI_BACS_MS = 250000;   // le pont laisse 4 min au geste (extension v2.4.33)

  function fw() {
    try { return (window.wwLib && window.wwLib.getFrontWindow && window.wwLib.getFrontWindow()) || window; }
    catch (e) { return window; }
  }
  function esc(t) {
    return t == null ? '' : String(t).replace(/&/g, '&amp;').replace(/</g, '&lt;')
      .replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  function od() { var w = fw(); return (w.OD && w.OD.bacs) || (window.OD && window.OD.bacs) || null; }

  // Le canal page -> extension -> onglet BACS, posé par le socle (OD.bacs).
  // Repli autonome si le socle ne l'expose pas : même contrat de messages.
  function demander(action, params, delaiMs) {
    var g = od();
    if (g && typeof g.demander === 'function') return g.demander(action, params, delaiMs);
    return new Promise(function (resolve) {
      var w = fw();
      var id = 'obc_' + Date.now() + '_' + Math.random().toString(16).slice(2);
      var t = null;
      function fin(r) { try { w.removeEventListener('message', ecoute); } catch (e) {} clearTimeout(t); resolve(r); }
      function ecoute(e) { var m = e.data; if (m && m.__od_bacs_result && m.id === id) fin(m); }
      w.addEventListener('message', ecoute);
      t = setTimeout(function () { fin({ ok: false, erreur: 'delai_depasse' }); }, delaiMs || 25000);
      try { w.postMessage({ __od_bacs: true, id: id, action: action, params: params || {} }, '*'); }
      catch (e) { fin({ ok: false, erreur: 'extension_absente' }); }
    });
  }

  function messageFerme(err) {
    if (err === 'extension_absente' || err === 'extension_indisponible')
      return "BACS : l'extension One Data n'est pas active sur ce navigateur. Ce client doit être créé aussi dans BACS : installez ou activez l'extension, ouvrez BACS, puis recommencez.";
    if (err === 'bacs_non_pret')
      return "BACS est ouvert mais ne répond pas encore. Laissez la page BACS finir de se charger (ou rechargez-la), puis recommencez.";
    return "BACS n'est pas ouvert sur votre poste. Ce client doit être créé aussi dans BACS : ouvrez BACS dans un onglet de ce navigateur, connectez-vous, puis recommencez.";
  }
  function messageBacs(err) {
    if (!err) return 'BACS n’a pas répondu.';
    if (err === 'delai_depasse') return 'BACS n’a pas répondu à temps.';
    if (err === 'bacs_non_ouvert') return 'L’onglet BACS a été fermé pendant la création.';
    if (err === 'bacs_non_pret') return 'L’onglet BACS ne répond plus.';
    return String(err).replace(/^création de la demande refusée : CT030_LocalContactCreation\.createLocalContact : /, 'Demande refusée par BACS : ');
  }

  // ── Panneau d'avancement ────────────────────────────────────────────
  var CSS =
    '.obc-ov{position:fixed;inset:0;z-index:2147483600;display:flex;align-items:center;justify-content:center;padding:20px;background:rgba(31,74,133,.42);font-family:"Nunito Sans",system-ui,sans-serif}' +
    '.obc-box{background:#fff;border-radius:16px;width:100%;max-width:460px;box-shadow:0 30px 80px rgba(31,74,133,.35);padding:22px 22px 18px;color:#1F4A85}' +
    '.obc-t{font-weight:800;font-size:16px;margin:0 0 2px}' +
    '.obc-s{color:#7a98c5;font-size:13px;margin:0 0 16px}' +
    '.obc-step{display:flex;gap:12px;align-items:flex-start;padding:11px 0;border-top:1px solid #eef2f8}' +
    '.obc-step:first-of-type{border-top:none}' +
    '.obc-ic{flex:0 0 26px;width:26px;height:26px;border-radius:50%;display:inline-flex;align-items:center;justify-content:center;font-weight:800;font-size:14px;margin-top:1px}' +
    '.obc-ic.att{border:2px solid #e3edf9;color:#acc5e4}' +
    '.obc-ic.en{border:3px solid #e3edf9;border-top-color:#2a5ea9;animation:obc-tourne .8s linear infinite}' +
    '.obc-ic.ok{background:#53bda7;color:#fff}' +
    '.obc-ic.ko{background:#e24b4a;color:#fff}' +
    '.obc-ic.info{background:#e6a817;color:#fff}' +
    '@keyframes obc-tourne{to{transform:rotate(360deg)}}' +
    '.obc-l{font-weight:700;font-size:14px;line-height:1.3}' +
    '.obc-d{font-size:12.5px;color:#7a98c5;margin-top:3px;line-height:1.45}' +
    '.obc-d.ko{color:#c43c3b}' +
    '.obc-pied{display:flex;gap:9px;margin-top:16px}' +
    '.obc-btn{flex:1;height:42px;border-radius:10px;font:inherit;font-weight:700;font-size:14px;cursor:pointer;display:inline-flex !important;align-items:center !important;justify-content:center !important;gap:8px;line-height:1.2;text-align:center}' +
    '.obc-btn.pri{border:none;background:#2a5ea9;color:#fff}' +
    '.obc-btn.sec{border:1.5px solid #e3edf9;background:#fff;color:#2a5ea9}' +
    '.obc-b{display:inline-flex;align-items:center;justify-content:center;width:22px;height:22px;border-radius:6px;background:#fff;color:#1F4A85;font-weight:900;font-size:13px}' +
    '.obc-btn.sec .obc-b{background:#1F4A85;color:#fff}';

  function panneau() {
    var d = fw().document || document;
    if (!d.getElementById('obc-css')) {
      var st = d.createElement('style'); st.id = 'obc-css'; st.textContent = CSS;
      (d.head || d.documentElement).appendChild(st);
    }
    var ov = d.createElement('div'); ov.className = 'obc-ov';
    ov.innerHTML =
      '<div class="obc-box" role="dialog" aria-live="polite">' +
        '<div class="obc-t">Création du client</div>' +
        '<div class="obc-s">One Data, puis BACS — ne fermez pas l’onglet BACS.</div>' +
        '<div class="obc-step" data-e="od"><span class="obc-ic att"></span><div><div class="obc-l">Fiche One Data</div><div class="obc-d">En attente</div></div></div>' +
        '<div class="obc-step" data-e="bacs"><span class="obc-ic att"></span><div><div class="obc-l">Compte BACS</div><div class="obc-d">En attente</div></div></div>' +
        '<div class="obc-pied" hidden></div>' +
      '</div>';
    (d.body || d.documentElement).appendChild(ov);
    function etape(cle, etat, texte, ko) {
      var s = ov.querySelector('[data-e="' + cle + '"]'); if (!s) return;
      var ic = s.querySelector('.obc-ic');
      ic.className = 'obc-ic ' + etat;
      ic.textContent = etat === 'ok' ? '✓' : etat === 'ko' ? '!' : etat === 'info' ? 'i' : '';
      var dd = s.querySelector('.obc-d'); dd.textContent = texte || ''; dd.classList.toggle('ko', !!ko);
    }
    function pied(boutons) {
      var p = ov.querySelector('.obc-pied'); p.hidden = false; p.innerHTML = '';
      return new Promise(function (resolve) {
        boutons.forEach(function (b) {
          var el = d.createElement('button'); el.type = 'button';
          el.className = 'obc-btn ' + (b.pri ? 'pri' : 'sec');
          el.innerHTML = b.html;
          el.addEventListener('click', function () { if (b.action) b.action(); if (b.fin) resolve(b.fin); });
          p.appendChild(el);
        });
      });
    }
    function fermer() { try { ov.remove(); } catch (e) {} }
    return { etape: etape, pied: pied, fermer: fermer };
  }

  function ouvrir(url) {
    if (!url) return;
    try { fw().open(url, '_blank', 'noopener'); } catch (e) { try { window.open(url, '_blank'); } catch (e2) {} }
  }
  function urlCompte(id) { return id ? 'https://toyota-france.my.site.com/bacs2/s/account/' + id + '/detail' : null; }

  async function compte(sb, idClient) {
    if (!sb || idClient == null) return null;
    try {
      var r = await sb.rpc('client_compte_bacs', { p_id_client: Number(idClient) });
      if (r.error || !r.data || !r.data.compte) return null;
      return r.data;
    } catch (e) { return null; }
  }

  // ── La création ─────────────────────────────────────────────────────
  async function creer(sb, args) {
    var a = Object.assign({}, args || {});
    var payload = Object.assign({}, a.p_payload || {});

    // 1. Ce client part-il dans BACS ?
    var pf = null;
    try {
      var rp = await sb.rpc('bacs_client_preflight', { p_payload: payload });
      if (!rp.error) pf = rp.data;
    } catch (e) { pf = null; }
    if (!pf || !pf.ecrire || pf.pro || a.p_id_user == null) {
      return sb.rpc('client_creer', a);   // tenant sans BACS, société, ou création système
    }
    if (pf.moi_bacs === false) {
      return { data: null, error: { message: "BACS : votre compte One Data n'est pas relié à votre compte BACS, ce client ne pourrait pas y être créé. Demandez à l'administrateur de renseigner votre identifiant BACS." } };
    }

    // 2. BACS ouvert CHEZ CE VENDEUR, vérifié en direct (l'extension bat aussi
    //    son cœur au passage : la base le contrôle à son tour).
    var ping = await demander('ping', {}, 10000);
    if (!ping || !ping.ok) return { data: null, error: { message: messageFerme(ping && ping.erreur) } };
    if (ping.contexte === false) return { data: null, error: { message: messageFerme('bacs_non_pret') } };

    // 3. Création One Data, puis BACS, sous les yeux du vendeur.
    var ui = panneau();
    ui.etape('od', 'en', 'Création de la fiche…');
    payload.__bacs_direct = true;
    a.p_payload = payload;
    var r = await sb.rpc('client_creer', a);
    if (r.error || !r.data) {
      ui.fermer();
      return r.error ? r : { data: null, error: { message: 'création : aucune fiche renvoyée' } };
    }
    var idClient = r.data.id_client;
    ui.etape('od', 'ok', 'Fiche n° ' + idClient + ' créée');

    var b = r.data.bacs || null;
    if (!b || !b.ok || !b.id) {
      var motif = (b && b.motif) || 'non demandée';
      if (/déjà présent/i.test(motif)) {
        var deja = await compte(sb, idClient);
        ui.etape('bacs', 'ok', 'Client déjà présent dans BACS');
        await ui.pied([
          deja ? { html: '<span class="obc-b">B</span>Ouvrir dans BACS', action: function () { ouvrir(deja.url); } } : null,
          { html: 'Continuer', pri: true, fin: true }
        ].filter(Boolean));
      } else {
        ui.etape('bacs', 'ko', 'Création BACS non lancée : ' + motif, true);
        await ui.pied([{ html: 'Continuer', pri: true, fin: true }]);
      }
      ui.fermer();
      return r;
    }

    ui.etape('bacs', 'en', 'Demande de contact, acceptation, compte, affaire…');
    var x = await demander('geste_executer', { geste_id: b.id }, DELAI_BACS_MS);
    if (x && x.ok) {
      var res = null; try { res = x.resultat ? JSON.parse(x.resultat) : null; } catch (e) { res = null; }
      var acc = res && res.compte;
      var txt = !acc ? 'Créé dans BACS'
        : (res.rapprochement === 'creation' ? 'Compte créé dans BACS' : 'Rattaché au compte BACS existant')
          + (res.affaire ? ' · affaire ouverte' : '');
      ui.etape('bacs', 'ok', txt);
      var url = urlCompte(acc);
      await ui.pied([
        url ? { html: '<span class="obc-b">B</span>Ouvrir dans BACS', action: function () { ouvrir(url); } } : null,
        { html: 'Continuer', pri: true, fin: true }
      ].filter(Boolean));
    } else {
      ui.etape('bacs', 'ko', messageBacs(x && (x.erreur || x.refus)) +
        ' La fiche One Data est créée ; la création dans BACS sera retentée automatiquement tant que BACS reste ouvert.', true);
      await ui.pied([{ html: 'Continuer', pri: true, fin: true }]);
    }
    ui.fermer();
    return r;
  }

  window.oropraBacsClient = { version: 1, creer: creer, compte: compte, ouvrir: ouvrir, urlCompte: urlCompte };
})();
