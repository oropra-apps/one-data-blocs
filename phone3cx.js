// ============================================================================
//  One Data — TELEPHONIE 3CX cote vendeur (module ambiant, sans ancre WeWeb)  v6
//  v6 (08/10/2026) : si la commande d'appel est refusee (pas de poste, pont
//  injoignable, session invalide), le bandeau le dit au lieu de rester sur
//  « Votre poste sonne » ; il se referme seul apres 8 s.
//  v5 (05/10/2026) : boot() lit l'identifiant dans la session en memoire
//  (getSession) au lieu d'appeler /auth/v1/user. Repli conserve.
//  Panneau d'appel : le vendeur reste dans One Data, le combine porte la voix.
//    - sonnerie  : fiche client + preconisation Delco AVANT le decroche
//    - en cours  : chronometre et contexte client
//    - sortant   : bouton « Appeler » de la fiche client. Composition directe
//                  par le client 3CX du vendeur ; repli sur makecall (le poste
//                  sonne d'abord) si aucun gabarit d'URL n'est configure.
//  Le vendeur decroche et raccroche TOUJOURS sur son combine ou son mobile :
//  le panneau ne pilote pas le poste, il accompagne l'appel.
// ============================================================================
OD.define('phone3cx', {
  mount(__anchor, ctx) {
    if (!window.wwLib) return;

    const SELECTED_CLIENT_VAR = '55490583-c88b-4748-916e-4d203db07742';
    const PAGE_FICHE = '/fiche-client';
    const sb  = ctx.supabase;
    const win = (wwLib.getFrontWindow && wwLib.getFrontWindow()) || window;
    const doc = (wwLib.getFrontDocument && wwLib.getFrontDocument()) || document;

    if (win.__od3cx) return;                 // un seul panneau par session
    const S = win.__od3cx = { appel: null, depuis: 0, tic: null, chien: null, poste: null };

    /* ------------------------------------------------------------ styles */
    function css() {
      if (doc.getElementById('od3cx-css')) return;
      const st = doc.createElement('style');
      st.id = 'od3cx-css';
      st.textContent = [
        '.od3cx{position:fixed;right:20px;bottom:20px;z-index:2147482000;width:300px;',
        'background:#fff;border:1px solid #dbe5f2;border-left:5px solid #53bda7;border-radius:16px;',
        'box-shadow:0 14px 38px rgba(23,43,77,.20);font-family:"Nunito Sans",system-ui,sans-serif;color:#1f2a37;',
        'transform:translateY(16px);opacity:0;transition:.25s;overflow:hidden}',
        '.od3cx.on{transform:none;opacity:1}',
        '.od3cx.encours{border-left-color:#2a5ea9}',
        '.od3cx-hd{display:flex;align-items:center;gap:9px;padding:13px 14px 4px}',
        '.od3cx-pt{width:9px;height:9px;border-radius:50%;background:#53bda7;animation:od3cx-p 1.1s infinite}',
        '.od3cx.encours .od3cx-pt{background:#2a5ea9;animation:none}',
        '@keyframes od3cx-p{50%{opacity:.25;transform:scale(.75)}}',
        '.od3cx-et{font-size:10px;font-weight:800;letter-spacing:.7px;text-transform:uppercase;color:#53bda7}',
        '.od3cx.encours .od3cx-et{color:#2a5ea9}',
        '.od3cx-x{margin-left:auto;border:0;background:transparent;font-size:19px;line-height:1;color:#93a3b8;cursor:pointer}',
        '.od3cx-nom{padding:0 14px;font-size:17px;font-weight:800;color:#1f4a85}',
        '.od3cx-num{padding:2px 14px 10px;font-size:12px;color:#6b7a90}',
        '.od3cx-chrono{font-variant-numeric:tabular-nums;font-weight:800;color:#2a5ea9}',
        '.od3cx-info{margin:0 14px 10px;font-size:12.5px;line-height:1.45;color:#1f2a37}',
        '.od3cx-delco{margin:0 14px 8px;background:#eaf7f4;border-radius:9px;padding:9px 10px;font-size:12.5px;line-height:1.45}',
        '.od3cx-delco b{color:#53bda7}',
        '.od3cx-reco{margin-bottom:12px;background:#fff6e8}',
        '.od3cx-reco b{color:#c98418}',
        '.od3cx-act{display:flex;gap:7px;padding:0 14px 14px;flex-wrap:wrap}',
        '.od3cx-b{flex:1;min-width:84px;border:1px solid #dbe5f2;background:#fff;color:#1f2a37;font:inherit;',
        'font-weight:700;font-size:12.5px;padding:8px 6px;border-radius:9px;cursor:pointer;transition:.15s}',
        '.od3cx-b:hover{border-color:#acc5e4}.od3cx-b[disabled]{opacity:.5;cursor:default}',
        '.od3cx-b.vert{background:#53bda7;border-color:#53bda7;color:#fff}',
        '.od3cx-b.rouge{background:#e24b4a;border-color:#e24b4a;color:#fff}',
        '.od3cx-pied{padding:0 14px 12px;font-size:11px;color:#93a3b8}',
        '.od3cx.mince{width:auto;max-width:380px;border-radius:12px}',
        '.od3cx-mince{display:flex;align-items:center;gap:9px;padding:11px 12px 11px 14px}',
        '.od3cx-mt{font-size:13px;font-weight:600;color:#1f2a37;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}',
        '.od3cx-mince .od3cx-x{margin-left:4px}',
        '.od3cx-mt.err{white-space:normal;color:#e24b4a;line-height:1.35}',
      ].join('');
      (doc.head || doc.documentElement).appendChild(st);
    }

    const esc = (s) => String(s == null ? '' : s)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
    const mmss = (ms) => {
      const t = Math.max(0, Math.floor(ms / 1000));
      return String(Math.floor(t / 60)).padStart(2,'0') + ':' + String(t % 60).padStart(2,'0');
    };

    /* ------------------------------------------------------------- rendu */
    function fermer() {
      const el = doc.getElementById('od3cx');
      if (el) { el.classList.remove('on'); setTimeout(() => el.remove(), 250); }
      if (S.tic) { clearInterval(S.tic); S.tic = null; }
      if (S.chien) { clearTimeout(S.chien); S.chien = null; }
      S.appel = null;
    }

    // Garde-fou : si l'evenement de fin n'arrive pas (perte du flux 3CX,
    // appel jamais decroche), le panneau se retire de lui-meme plutot que de
    // rester a l'ecran. 90 s en sonnerie, 2 h en communication.
    function armerChien(encours) {
      if (S.chien) clearTimeout(S.chien);
      S.chien = setTimeout(fermer, encours ? 7200000 : 90000);
    }

    function rendre() {
      const a = S.appel;
      if (!a) return fermer();
      css();
      let el = doc.getElementById('od3cx');
      if (!el) {
        el = doc.createElement('div');
        el.id = 'od3cx'; el.className = 'od3cx';
        (doc.body || doc.documentElement).appendChild(el);
        requestAnimationFrame(() => el.classList.add('on'));
      }
      const encours = a.etat === 'en_cours';
      el.classList.toggle('encours', encours);
      armerChien(encours);

      // Appel sortant : le vendeur est deja sur la fiche, il n'a besoin que de
      // savoir que son propre poste sonne d'abord. Bandeau d'une ligne.
      el.classList.toggle('mince', !!a.sortant);
      if (a.sortant) {
        el.innerHTML =
          '<div class="od3cx-mince">' +
          '<span class="od3cx-pt"></span>' +
          '<span class="od3cx-mt' + (a.erreur ? ' err' : '') + '">' +
            (a.erreur
              ? 'Appel impossible : ' + esc(a.erreur)
              : encours
              ? (a.direct ? 'Appel de ' : 'En ligne avec ') + esc(a.nom || a.numero || '') +
                ' · <span class="od3cx-chrono" id="od3cx-t">' + mmss(Date.now() - S.depuis) + '</span>'
              : 'Votre poste sonne — décrochez pour appeler ' + esc(a.nom || a.numero || '')) +
          '</span>' +
          '<button class="od3cx-x" title="Masquer">&times;</button>' +
          '</div>';
        el.querySelector('.od3cx-x').addEventListener('click', fermer);
        if (encours && !S.tic) {
          S.tic = setInterval(() => {
            const t = doc.getElementById('od3cx-t');
            if (t) t.textContent = mmss(Date.now() - S.depuis);
          }, 1000);
        }
        return;
      }

      const b = a.brief || {};
      // Deux choses distinctes, et on affichait une seule : le briefing dit QUI
      // appelle et OU en est le dossier, la suggestion dit QUOI FAIRE. Les
      // afficher toutes les deux, c'est tout l'interet du brief avant decroche.
      const dBrief = (b.ai && b.ai.brief) || '';
      const dReco  = (b.ai && b.ai.suggestion) || '';
      const sous = encours
        ? '<span class="od3cx-chrono" id="od3cx-t">' + mmss(Date.now() - S.depuis) + '</span>'
        : esc(a.numero || '');

      el.innerHTML =
        '<div class="od3cx-hd"><span class="od3cx-pt"></span>' +
        '<span class="od3cx-et">' + (encours ? 'En communication' : (a.sortant ? 'Appel en cours' : 'Appel entrant')) + '</span>' +
        '<button class="od3cx-x" title="Masquer">&times;</button></div>' +
        '<div class="od3cx-nom">' + esc(a.nom || a.numero || 'Inconnu') + '</div>' +
        '<div class="od3cx-num">' + sous + '</div>' +
        (b.vehicule ? '<div class="od3cx-info">' + esc(b.vehicule) + '</div>' : '') +
        (b.lastContact && b.lastContact.resume
          ? '<div class="od3cx-info">Dernier échange : ' + esc(b.lastContact.resume) + '</div>' : '') +
        (b.lastPropale && b.lastPropale.label
          ? '<div class="od3cx-info">Propale : ' + esc(b.lastPropale.label) + '</div>' : '') +
        (dBrief ? '<div class="od3cx-delco"><b>Delco</b> — ' + esc(dBrief) + '</div>' : '') +
        (dReco ? '<div class="od3cx-delco od3cx-reco"><b>À faire</b> — ' + esc(dReco) + '</div>' : '') +
        (a.idClient ? '' : '<div class="od3cx-info" style="color:#6b7a90">Numéro inconnu dans One Data</div>') +
        '<div class="od3cx-act">' +
          '<button class="od3cx-b" data-a="fiche">Voir la fiche</button>' +
        '</div>' +
        (encours ? '' : '<div class="od3cx-pied">' +
          (a.sortant ? 'Décrochez votre combiné : le client est appelé'
                     : 'Décrochez sur votre combiné ou votre mobile') + '</div>');

      el.querySelector('.od3cx-x').addEventListener('click', fermer);
      el.querySelectorAll('[data-a]').forEach(btn =>
        btn.addEventListener('click', () => ouvrirFiche(a.idClient)));

      if (encours && !S.tic) {
        S.tic = setInterval(() => {
          const t = doc.getElementById('od3cx-t');
          if (t) t.textContent = mmss(Date.now() - S.depuis);
        }, 1000);
      }
    }

    /* --------------------------------------------------------- actions */
    // Seule commande envoyee au PBX : « appeler » (click to call sortant).
    // Le decroche et le raccroche restent la main du vendeur, sur son poste.
    async function commande(action, extra) {
      if (typeof ctx.fn !== 'function') { console.warn('[3cx] OD.fn indisponible'); return { ok: false }; }
      const r = await ctx.fn('threecx-action', Object.assign({ action }, extra || {}));
      const j = await r.json().catch(() => ({}));
      if (!j.ok) console.warn('[3cx] commande refusée', action, r.status, j);
      return j;
    }

    function ouvrirFiche(idClient) {
      if (!idClient) return;
      try { wwLib.wwVariable.updateValue(SELECTED_CLIENT_VAR, { IDVu: Number(idClient) }); } catch (e) {}
      try {
        if ((win.location.pathname || '').indexOf(PAGE_FICHE) !== -1) return;
        if (wwLib.wwApp && wwLib.wwApp.goTo) return wwLib.wwApp.goTo(PAGE_FICHE);
        wwLib.goTo(PAGE_FICHE);
      } catch (e) {}
    }

    // Composition directe par le client 3CX du vendeur : le softphone emet
    // lui-meme, donc l'appel part tout de suite, sans rappel prealable du poste.
    // C'est le mode normal des que les vendeurs sont equipes. Sans gabarit
    // d'URL en base, on retombe sur makecall (le poste sonne d'abord).
    function composerParClient(numero) {
      const gabarit = S.poste && S.poste.url_appel;
      if (!gabarit) return false;
      const url = gabarit.replace('{num}', encodeURIComponent(numero));
      try {
        const f = win.open(url, 'od3cx-client');
        if (!f) return false;           // fenetre bloquee : on laisse le repli jouer
        try { f.focus(); } catch (e) {}
        return true;
      } catch (e) { return false; }
    }

    // Appel sortant depuis la fiche client : expose une API au reste du front
    win.OD3CX = {
      appeler(numero, client) {
        const direct = composerParClient(numero);
        S.appel = { etat: direct ? 'en_cours' : 'sonnerie', sortant: true, numero: numero,
                    nom: (client && client.nom) || numero, idClient: client && client.idvu,
                    direct: direct };
        if (direct) S.depuis = Date.now();
        rendre();
        if (direct) return Promise.resolve({ ok: true, via: 'client3cx' });
        return commande('appeler', { numero: numero }).catch((e) => ({ ok: false, error: (e && e.message) || 'erreur réseau' }))
          .then((j) => {
            if (!j || !j.ok) {
              if (S.appel && S.appel.sortant && S.appel.numero === numero) {
                S.appel = Object.assign({}, S.appel, { erreur: (j && j.error) || 'le poste n\u2019a pas pu être appelé' });
                rendre();
                setTimeout(() => { if (S.appel && S.appel.erreur) fermer(); }, 8000);
              }
            }
            return j;
          });
      },
      actif() { return !!S.appel; },
    };

    /* ------------------------------------------------------ abonnement */
    async function boot() {
      let uid = null;
      // La session en memoire porte deja l'identifiant : getUser() faisait un
      // aller-retour vers /auth/v1/user pour le meme resultat. Repli sur
      // getUser() uniquement si aucune session n'est encore posee.
      try { const { data } = await sb.auth.getSession(); uid = data && data.session && data.session.user && data.session.user.id; } catch (e) {}
      if (!uid) { try { const { data } = await sb.auth.getUser(); uid = data && data.user && data.user.id; } catch (e) {} }
      if (!uid) return;

      // Poste du vendeur et mode de composition. Cette RPC ne renvoie aucun
      // secret : la cle du pont reste cote serveur.
      try {
        const { data } = await sb.rpc('threecx_mon_poste_front');
        S.poste = Array.isArray(data) ? data[0] : data;
      } catch (e) { S.poste = null; }

      const canal = sb.channel('od:user:' + uid, { config: { private: true } });
      canal.on('broadcast', { event: 'appel' }, (msg) => {
        const p = (msg && msg.payload) || {};
        if (p.source !== '3cx') return;
        if (p.ts && Date.now() - p.ts > 60000) return;

        if (p.etat === 'termine') { fermer(); return; }
        const nouveau = !S.appel || S.appel.participant !== p.participant;
        if (p.etat === 'en_cours' && (nouveau || S.appel.etat !== 'en_cours')) S.depuis = Date.now();
        S.appel = Object.assign({}, S.appel, p);
        rendre();

        // La fiche s'ouvre des la sonnerie, avant meme le decroche.
        if (p.etat === 'sonnerie' && p.idClient) ouvrirFiche(p.idClient);
      });
      canal.subscribe((st) => { if (st === 'SUBSCRIBED') console.log('[3cx] téléphonie active'); });
      win.__od3cxCanal = canal;
    }

    boot();
  }
});
