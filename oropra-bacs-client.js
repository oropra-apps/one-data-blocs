/* =====================================================================
 * oropra-bacs-client.js — création d'un client SUIVIE dans BACS ET dans
 * One Data, partagée                                   v4 (03/11/2026)
 *
 * Publié sous l'étiquette oropra-bacs-client-v5 (l'étiquette v4 a été
 * posée par erreur sur l'ancien code v3) : le code est celui de la v4.
 *
 * v4 : DEMANDE DE CONSENTEMENT et EXTENSION À JOUR.
 *   · En fin de création, le panneau propose « Envoyer la demande de
 *     consentement » (Toyota ou Lexus selon le site) : comme le bouton de
 *     BACS, un SMS part au client, qui choisit lui-même. Il faut l'extension
 *     3.3.4 ; avec une plus ancienne, le panneau renvoie vers BACS. Si la
 *     preuve est déjà recueillie, il le dit. La réponse du client redescend
 *     dans One Data (relectures du compte à 15 min et 24 h).
 *   · consentement(supabase, idClient, idSite) ouvre ce même panneau seul,
 *     pour un client existant (fiche client, plus tard).
 *   · Extension BACS trop ancienne (avant 3.3.2) : le bouton « Enregistrer »
 *     est verrouillé avec « Extension BACS à mettre à jour » et la création
 *     explique quoi faire (fermer et rouvrir Chrome), au lieu d'une erreur
 *     obscure.
 *
 * v3 : BACS D'ABORD, ONE DATA ENSUITE. Constaté le 03/11 (client « Ztest »,
 * portable faux) : la fiche One Data était créée, puis BACS refusait le
 * compte (« N° de portable incohérent ») ; la fiche restait avec ses données
 * fausses. Désormais :
 *   1. un numéro de fiche est RÉSERVÉ (client_creer_bacs_preparer), sans
 *      créer la fiche ;
 *   2. BACS crée la demande, l'accepte, crée le compte et l'affaire : il
 *      vérifie au passage le portable et l'e-mail ;
 *   3. seulement si BACS accepte, la fiche One Data est créée avec le numéro
 *      réservé et reliée au compte (client_creer_apres_bacs). Si BACS a
 *      rattaché la saisie à un compte déjà connu de One Data, la fiche
 *      existante est rendue : pas de doublon.
 * Si BACS refuse : rien n'est créé dans One Data, le motif s'affiche en
 * clair, la fenêtre de création reste ouverte pour corriger. Le nouvel essai
 * reprend la même réservation et la demande déjà créée dans BACS (pas de
 * seconde demande). La base termine d'elle-même une création que BACS a
 * acceptée si la page s'est fermée entre-temps (toutes les 2 minutes).
 * La demande de consentement n'est PAS lancée par la création (elle ne
 * l'était pas non plus avant) : le panneau final le rappelle au vendeur.
 *
 * v2 : bouton « Enregistrer » VERROUILLÉ tant que BACS n'est pas ouvert sur
 * le poste — grisé, en rouge, libellé « Bacs doit être ouvert pour pouvoir
 * valider ». L'état est vérifié en continu tant que la fenêtre de création
 * est ouverte (toutes les 2,5 s quand BACS est fermé, 8 s quand il est
 * ouvert) : le bouton redevient normal dès que BACS répond.
 *
 * Expose window.oropraBacsClient :
 *   creer(supabase, { p_payload, p_id_site, p_id_user })
 *       -> même forme que supabase.rpc('client_creer') : { data, error }
 *   compte(supabase, idClient) -> { compte, url, nom, nb } | null
 *   ouvrir(url)                -> ouvre le compte BACS dans un nouvel onglet
 *   surveiller(supabase, modal, onChange, actif)
 *       -> suit l'état de BACS pour une fenêtre de création (modal.__bacs) ;
 *          s'arrête dès que actif() rend false
 *   appliquer(bouton, modal)   -> met le bouton d'enregistrement dans l'état
 *          voulu (verrouillé en rouge, ou normal)
 *
 * Sur un tenant sans écriture BACS, ou pour une société (parcours BACS pas
 * encore relevé), creer() se réduit à l'appel client_creer habituel.
 * Charte One Data : bleus #1F4A85 / #2a5ea9, vert #53bda7, rouge #e24b4a,
 * Nunito Sans — jamais de noir.
 * ===================================================================== */
(function () {
  'use strict';
  if (window.oropraBacsClient && window.oropraBacsClient.version >= 4) return;

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
  var MSG_EXT = "Votre extension « One Data – BACS » n'est pas à jour. Fermez complètement Chrome (toutes les fenêtres), rouvrez-le, attendez que BACS soit rechargé, puis recommencez.";
  function messageBacs(err) {
    if (!err) return 'BACS n’a pas répondu.';
    if (err === 'delai_depasse') return 'BACS n’a pas répondu à temps.';
    if (err === 'bacs_non_ouvert') return 'L’onglet BACS a été fermé pendant la création.';
    if (err === 'bacs_non_pret') return 'L’onglet BACS ne répond plus.';
    if (/déjà en cours/i.test(err)) return 'BACS termine encore la création précédente de ce client.';
    if (err === 'extension_perimee' || /^geste en_attente$/.test(err)) return MSG_EXT;
    // « création du compte refusée : CT006_AccountCreation.saveAccount : ❌ Exception: Le N° … »
    var t = String(err)
      .replace(/^[^:]*refusée\s*:\s*/i, '')
      .replace(/^[A-Za-z0-9_]+\.[A-Za-z0-9_]+\s*:\s*/, '')
      .replace(/❌\s*/g, '')
      .replace(/^(?:System\.)?[A-Za-z]*Exception\s*:\s*/i, '')
      .trim();
    return 'BACS a refusé : ' + (t || String(err));
  }
  // Refus portant sur la saisie (portable, e-mail, nom…) : à corriger.
  function refusSaisie(err) {
    return /refusée/i.test(String(err || '')) && !/bascule|récolte/i.test(String(err || ''));
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

  function panneau(seulConsent) {
    var d = fw().document || document;
    if (!d.getElementById('obc-css')) {
      var st = d.createElement('style'); st.id = 'obc-css'; st.textContent = CSS;
      (d.head || d.documentElement).appendChild(st);
    }
    var ov = d.createElement('div'); ov.className = 'obc-ov';
    ov.innerHTML =
      '<div class="obc-box" role="dialog" aria-live="polite">' +
        (seulConsent
          ? '<div class="obc-t">Consentement du client</div>' +
            '<div class="obc-s">Demande envoyée par BACS au client, qui répond lui-même par SMS.</div>'
          : '<div class="obc-t">Création du client</div>' +
            '<div class="obc-s">BACS d’abord (il vérifie le portable et l’e-mail), puis One Data — ne fermez pas l’onglet BACS.</div>' +
            '<div class="obc-step" data-e="bacs"><span class="obc-ic att"></span><div><div class="obc-l">Compte BACS</div><div class="obc-d">En attente</div></div></div>' +
            '<div class="obc-step" data-e="od"><span class="obc-ic att"></span><div><div class="obc-l">Fiche One Data</div><div class="obc-d">En attente</div></div></div>') +
        '<div class="obc-step" data-e="consent" hidden><span class="obc-ic att"></span><div><div class="obc-l">Consentement</div><div class="obc-d"></div></div></div>' +
        '<div class="obc-pied" hidden></div>' +
      '</div>';
    (d.body || d.documentElement).appendChild(ov);
    function etape(cle, etat, texte, ko, libelle) {
      var s = ov.querySelector('[data-e="' + cle + '"]'); if (!s) return;
      s.hidden = false;
      if (libelle) s.querySelector('.obc-l').textContent = libelle;
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
  // Réservation laissée par un essai refusé par BACS : le nouvel essai la
  // reprend (même numéro, même demande BACS). La base vérifie qu'elle
  // appartient au même vendeur et au même client (nom, prénom).
  var reservation = null;   // { id, user }

  async function creer(sb, args) {
    var a = Object.assign({}, args || {});
    var payload = Object.assign({}, a.p_payload || {});
    delete payload.__bacs_direct;

    // 1. Ce client part-il dans BACS ?
    var pf = null;
    try {
      var rp = await sb.rpc('bacs_client_preflight', { p_payload: payload });
      if (!rp.error) pf = rp.data;
    } catch (e) { pf = null; }
    if (!pf || !pf.ecrire || pf.pro || a.p_id_user == null) {
      return sb.rpc('client_creer', a);   // tenant sans BACS, société, ou création système
    }
    if (pf.extension_a_jour === false) {
      return { data: null, error: { message: MSG_EXT } };
    }
    if (pf.moi_bacs === false) {
      return { data: null, error: { message: "BACS : votre compte One Data n'est pas relié à votre compte BACS, ce client ne pourrait pas y être créé. Demandez à l'administrateur de renseigner votre identifiant BACS." } };
    }

    // 2. BACS ouvert CHEZ CE VENDEUR, vérifié en direct.
    var ping = await demander('ping', {}, 10000);
    if (!ping || !ping.ok) return { data: null, error: { message: messageFerme(ping && ping.erreur) } };
    if (ping.contexte === false) return { data: null, error: { message: messageFerme('bacs_non_pret') } };

    // 3. Réservation du numéro + geste BACS (rien n'est encore créé).
    var ui = panneau();
    ui.etape('bacs', 'en', 'Préparation…');
    var prepArgs = { p_payload: payload, p_id_site: a.p_id_site, p_id_user: a.p_id_user,
                     p_reservation: (reservation && reservation.user === a.p_id_user) ? reservation.id : null };
    var rp2 = await sb.rpc('client_creer_bacs_preparer', prepArgs);
    if (rp2.error || !rp2.data) {
      ui.fermer();
      return rp2.error ? rp2 : { data: null, error: { message: 'création : préparation sans réponse' } };
    }
    var prep = rp2.data;
    if (prep.bacs === false) {                 // configuration changée entre-temps
      ui.fermer();
      return sb.rpc('client_creer', a);
    }
    reservation = { id: prep.reservation, user: a.p_id_user };

    // 4. BACS : demande, acceptation, compte, affaire.
    var res = null;
    if (prep.deja_fait) {
      ui.etape('bacs', 'ok', 'Déjà créé dans BACS lors de l’essai précédent');
    } else {
      ui.etape('bacs', 'en', 'Demande de contact, acceptation, compte, affaire…');
      var x = await demander('geste_executer', { geste_id: prep.geste }, DELAI_BACS_MS);
      try { res = x && x.resultat ? JSON.parse(x.resultat) : null; } catch (e) { res = null; }
      if (!x || !x.ok) {
        var err = x && (x.erreur || x.refus);
        var msg = messageBacs(err);
        var conseil = err === 'delai_depasse'
          ? ' Si BACS termine malgré tout, la fiche sera créée d’elle-même dans les 2 minutes ; sinon, cliquez à nouveau sur Enregistrer.'
          : refusSaisie(err)
            ? ' Corrigez la saisie, puis cliquez à nouveau sur Enregistrer.'
            : ' Vérifiez l’onglet BACS, puis cliquez à nouveau sur Enregistrer.';
        ui.etape('bacs', 'ko', msg, true);
        ui.etape('od', 'info', 'Non créée : One Data attend l’accord de BACS.');
        await ui.pied([{ html: 'Corriger la saisie', pri: true, fin: true }]);
        ui.fermer();
        return { data: null, error: { message: msg + conseil } };
      }
      var acc0 = res && res.compte;
      ui.etape('bacs', 'ok', !acc0 ? 'Créé dans BACS'
        : (res.rapprochement === 'creation' ? 'Compte créé dans BACS' : 'Rattaché au compte BACS existant')
          + (res.affaire ? ' · affaire ouverte' : ''));
    }

    // 5. One Data, avec le numéro réservé.
    ui.etape('od', 'en', 'Création de la fiche…');
    var rf = await sb.rpc('client_creer_apres_bacs', { p_reservation: prep.reservation });
    if (rf.error || !rf.data) {
      var m2 = (rf.error && rf.error.message) || 'aucune fiche renvoyée';
      ui.etape('od', 'ko', m2 + ' Le client existe dans BACS : la fiche sera créée d’elle-même dans les 2 minutes, ou cliquez à nouveau sur Enregistrer.', true);
      await ui.pied([{ html: 'Fermer', pri: true, fin: true }]);
      ui.fermer();
      return rf.error ? rf : { data: null, error: { message: 'création : ' + m2 } };
    }
    reservation = null;
    var f = rf.data;
    ui.etape('od', 'ok', f.existant
      ? 'Ce compte BACS correspond déjà à la fiche n° ' + f.id_client + ' : elle est reprise, aucun doublon créé'
      : 'Fiche n° ' + f.id_client + ' créée');

    await etapeConsentement(ui, sb, f.id_client, a.p_id_site, urlCompte(f.compte || (res && res.compte)));
    ui.fermer();
    return { data: f, error: null };
  }

  // ── Demande de consentement (v4) ────────────────────────────────────
  function telLisible(t) {
    var d = String(t || '').replace(/[^0-9+]/g, '');
    if (/^0\d{9}$/.test(d)) return d.replace(/(\d{2})(?=\d)/g, '$1 ');
    return d;
  }
  function dateLisible(v) {
    if (!v) return '';
    var x = new Date(v); if (isNaN(x.getTime())) return String(v);
    return x.toLocaleDateString('fr-FR') + (String(v).length > 10 ? ' à ' + x.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : '');
  }

  // Affiche l'état du consentement dans le panneau et propose la demande.
  // Rend quand le vendeur clique sur « Continuer » (ou « Plus tard »).
  async function etapeConsentement(ui, sb, idClient, idSite, urlRepli) {
    var e = null;
    try {
      var r = await sb.rpc('client_consentement_etat', { p_id_client: Number(idClient), p_id_site: idSite != null ? Number(idSite) : null });
      if (!r.error) e = r.data;
    } catch (x) { e = null; }
    var url = (e && e.url) || urlRepli || null;
    var bOuvrir = url ? { html: '<span class="obc-b">B</span>Ouvrir dans BACS', action: function () { ouvrir(url); } } : null;
    var bContinuer = { html: 'Continuer', pri: true, fin: 'continuer' };
    var fin = function () { return ui.pied([bOuvrir, bContinuer].filter(Boolean)); };

    if (!e) {
      ui.etape('consent', 'info', 'État du consentement indisponible : vérifiez-le dans BACS.');
      return fin();
    }
    var lib = 'Consentement ' + e.libelle;
    var bouton = '« Demande du Consentement ' + e.libelle + ' »';
    if (e.preuve) {
      ui.etape('consent', 'ok', 'Déjà recueilli' + (e.date_preuve ? ' le ' + dateLisible(e.date_preuve) : '') + ' : rien à demander.', false, lib);
      return fin();
    }
    if (e.motif === 'compte_absent') {
      ui.etape('consent', 'info', 'Pas encore de compte dans BACS : la demande se fera une fois le compte créé.', false, lib);
      return fin();
    }
    if (e.motif === 'sans_portable') {
      ui.etape('consent', 'info', 'Pas de portable : la demande part par SMS. Ajoutez le portable du client, ou faites la demande dans BACS (bouton ' + bouton + ').', false, lib);
      return fin();
    }
    if (e.motif === 'extension') {
      ui.etape('consent', 'info', 'À demander dans BACS, sur le compte : bouton ' + bouton + '. (Avec l’extension BACS 3.3.4, One Data l’enverra lui-même : fermez et rouvrez Chrome pour la recevoir.)', false, lib);
      return fin();
    }

    ui.etape('consent', 'att', 'Le client va recevoir un SMS au ' + telLisible(e.mobile) +
      ' et choisira lui-même ce qu’il accepte.' + (e.demande_le ? ' Une demande lui a déjà été envoyée le ' + dateLisible(e.demande_le) + '.' : ''), false, lib);
    var choix = await ui.pied([
      { html: 'Plus tard', fin: 'plus_tard' },
      { html: 'Envoyer la demande', pri: true, fin: 'envoyer' }
    ]);
    if (choix !== 'envoyer') return choix;

    ui.etape('consent', 'en', 'Envoi de la demande par BACS…', false, lib);
    var d = await sb.rpc('client_consentement_demander', { p_id_client: Number(idClient), p_id_site: idSite != null ? Number(idSite) : null });
    if (d.error || !d.data || !d.data.geste) {
      ui.etape('consent', 'ko', ((d.error && d.error.message) || 'Demande impossible.') + ' Vous pouvez la faire dans BACS (bouton ' + bouton + ').', true, lib);
      return fin();
    }
    var x = await demander('geste_executer', { geste_id: d.data.geste }, 90000);
    if (x && x.ok) {
      ui.etape('consent', 'ok', 'Demande envoyée : le client a reçu un SMS. Sa réponse remontera dans One Data.', false, lib);
    } else {
      ui.etape('consent', 'ko', messageBacs(x && (x.erreur || x.refus)) + ' Vous pouvez la faire dans BACS (bouton ' + bouton + ').', true, lib);
    }
    return fin();
  }

  // Le même panneau, seul, pour un client existant.
  async function consentementSeul(sb, idClient, idSite) {
    if (!sb || idClient == null) return null;
    var ping = await demander('ping', {}, 10000);
    var ui = panneau(true);
    if (!ping || !ping.ok || ping.contexte === false) {
      ui.etape('consent', 'ko', messageFerme(ping && (ping.contexte === false ? 'bacs_non_pret' : ping.erreur)), true);
      await ui.pied([{ html: 'Fermer', pri: true, fin: true }]);
      ui.fermer();
      return null;
    }
    var r = await etapeConsentement(ui, sb, idClient, idSite, null);
    ui.fermer();
    return r;
  }

  // ── Verrou du bouton d'enregistrement (v2) ──────────────────────────
  var LIB_FERME = 'Bacs doit être ouvert pour pouvoir valider';
  var LIB_NON_RELIE = 'Compte BACS non relié : validation impossible';
  var LIB_EXT = 'Extension BACS à mettre à jour : fermez et rouvrez Chrome';

  function bloque(m) {
    var b = m && m.__bacs;
    return !!(b && b.requis && (!b.ouvert || b.moi_bacs === false || b.a_jour === false));
  }

  function appliquer(btn, m) {
    if (!btn || !m) return;
    if (m.saving) return;                              // l'écran gère son propre état « Enregistrement… »
    var b = m.__bacs;
    if (bloque(m)) {
      if (btn.dataset.obcHtml == null) btn.dataset.obcHtml = btn.innerHTML;
      btn.dataset.obcBloque = '1';
      btn.disabled = true;
      btn.innerHTML = '<span>' + esc(b.moi_bacs === false ? LIB_NON_RELIE : b.a_jour === false ? LIB_EXT : LIB_FERME) + '</span>';
      btn.style.setProperty('background', '#fdf1f1', 'important');
      btn.style.setProperty('border-color', '#f2c4c4', 'important');
      btn.style.setProperty('color', '#e24b4a', 'important');
      btn.style.setProperty('cursor', 'not-allowed', 'important');
      btn.style.setProperty('opacity', '1', 'important');
      btn.title = b.moi_bacs === false
        ? "Demandez à l'administrateur de renseigner votre identifiant BACS."
        : b.a_jour === false ? MSG_EXT
        : "Ouvrez BACS dans un onglet de ce navigateur et connectez-vous : le bouton se débloque tout seul.";
    } else if (btn.dataset.obcBloque === '1') {
      if (btn.dataset.obcHtml != null) btn.innerHTML = btn.dataset.obcHtml;
      delete btn.dataset.obcHtml;
      delete btn.dataset.obcBloque;
      btn.disabled = false;
      ['background', 'border-color', 'color', 'cursor', 'opacity'].forEach(function (k) { btn.style.removeProperty(k); });
      btn.removeAttribute('title');
    }
  }

  function surveiller(sb, m, onChange, actif) {
    if (!m || m.__bacsSuivi) return;
    m.__bacsSuivi = true;
    var estActif = function () { try { return !actif || actif(); } catch (e) { return false; } };
    (async function () {
      var pf = null;
      try { var r = await sb.rpc('bacs_client_preflight', { p_payload: {} }); if (!r.error) pf = r.data; } catch (e) { pf = null; }
      if (!estActif()) return;
      if (!pf || !pf.ecrire || m.isSoc) { m.__bacs = { requis: false }; if (onChange) onChange(m.__bacs); return; }
      var precedent = null;
      async function tour() {
        if (!estActif()) return;
        var p = await demander('ping', {}, 6000);
        if (!estActif()) return;
        // Extension périmée : on relit l'état après chaque battement (le
        // vendeur redémarre Chrome, la nouvelle version se déclare).
        if (pf.extension_a_jour === false && p && p.ok) {
          try { var r2 = await sb.rpc('bacs_client_preflight', { p_payload: {} }); if (!r2.error && r2.data) pf = r2.data; } catch (e) {}
          if (!estActif()) return;
        }
        var etat = { requis: true, ouvert: !!(p && p.ok && p.contexte !== false),
                     moi_bacs: pf.moi_bacs !== false, a_jour: pf.extension_a_jour !== false, raison: p && p.erreur };
        m.__bacs = etat;
        if (!precedent || precedent.ouvert !== etat.ouvert || precedent.moi_bacs !== etat.moi_bacs || precedent.a_jour !== etat.a_jour) {
          if (onChange) onChange(etat);
        }
        precedent = etat;
        setTimeout(tour, etat.ouvert ? 8000 : 2500);
      }
      tour();
    })();
  }

  window.oropraBacsClient = { version: 4, consentement: consentementSeul, creer: creer, compte: compte, ouvrir: ouvrir, urlCompte: urlCompte,
                              surveiller: surveiller, appliquer: appliquer, bloque: bloque };
})();
