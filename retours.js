// ============================================================================
//  RETOURS — avis des utilisateurs One Data (OD.define)  v1
//  Module AMBIANT : le socle (v25+) lui crée une ancre invisible, uniquement
//  chez les tenants à qui le registre sert 'retours'. Persistant.
//
//  Deux gestes suffisent : une tuile (Ça bug / Pas clair / Une idée / J'aime)
//  puis Envoyer. Tout le reste est facultatif : message, note vocale dictée,
//  désignation de l'endroit à l'écran. Page, écran, appareil, versions et
//  derniers gestes sont joints automatiquement (via OD.pulse).
//
//  Propose aussi, au bon moment et jamais en rafale :
//    - « Le signaler » juste après des clics répétés ou un écran en échec ;
//    - un micro-sondage d'un geste, servi par l'edge function pulse ;
//    - une notice unique d'information sur la mesure d'usage.
//  Onglet « Mes retours » : statut + réponse de l'équipe, pastille de non-lus.
//
//  Rendu dans un Shadow DOM : aucune fuite de style avec WeWeb.
// ============================================================================
OD.define('retours', {
  mount(__anchor, ctx) {
    const VERSION = 4;   // v4 : « Montrer l'endroit » nomme la zone désignée (titre du bloc, colonne, champ, type)
    const W = window;
    const prev = W.__OD_RETOURS__;
    if (prev && prev.v === VERSION && document.getElementById('od-retours')) return;
    if (prev && typeof prev.detruire === 'function') { try { prev.detruire(); } catch (e) {} }

    const tenant = ctx.tenant || OD.tenant;
    const sb = ctx.supabase || OD.supabase;
    const CP = (OD.cp && OD.cp.url) || 'https://lerofucjmfrrduohnwet.supabase.co';
    const LOG = (...a) => console.log('%c[retours]', 'color:#2f7d55;font-weight:bold', ...a);

    const nettoyages = [];
    const ecouter = (cible, type, fn, opts) => { cible.addEventListener(type, fn, opts); nettoyages.push(() => cible.removeEventListener(type, fn, opts)); };
    const minuter = (fn, ms) => { const id = setInterval(fn, ms); nettoyages.push(() => clearInterval(id)); return id; };
    const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    // Page de connexion (module 'auth' à l'écran) : ni languette, ni notice, ni sondage,
    // même si une session encore valide fait remonter un utilisateur.
    const surConnexion = () => !!document.querySelector('[data-od-module="auth"]');
    const utilisateur = () => { try { return !surConnexion() && OD.getUser ? OD.getUser() : null; } catch (e) { return null; } };
    const uidDe = (u) => (u ? String(u.auth_uid || u.ID_User) : null);

    /* ------------------------------------------------------------ lien avec pulse */
    let P = null;
    const SHIM = {
      v: 0,
      endpoint: CP.replace(/\/$/, '') + '/functions/v1/pulse',
      on: () => () => {},
      emettre: () => {},
      async jeton() { try { const { data } = await sb.auth.getSession(); return (data && data.session && data.session.access_token) || null; } catch (e) { return null; } },
      decrire(el) {
        const hote = el && el.closest && el.closest('[data-od-module]');
        const sel = el && el.tagName ? el.tagName.toLowerCase() : '?';
        let rect = null; try { const r = el.getBoundingClientRect(); rect = { x: Math.round(r.left), y: Math.round(r.top), l: Math.round(r.width), h: Math.round(r.height) }; } catch (e) {}
        return { module: hote ? hote.getAttribute('data-od-module') : null, libelle: null, selecteur: sel, cible: sel, rect };
      },
      contexte: () => ({ page: location.pathname, url_hote: location.host, modules_affiches: [...new Set([...document.querySelectorAll('[data-od-module][data-od-mounted]')].map(e => e.getAttribute('data-od-module')))] }),
      sessionId: () => null,
      sondageAffiche() {},
    };
    const Pz = () => P || SHIM;
    const abonnementsPulse = [];
    function brancherPulse(p) {
      if (!p || (P && P.v)) return;
      P = p;
      abonnementsPulse.push(
        P.on('non_lus', n => majBadge(n)),
        P.on('sondage', s => recevoirSondage(s)),
        P.on('rage', d => proposerSignalement('rage', d)),
        P.on('erreur', d => { if (d && d.genre === 'montage') proposerSignalement('erreur', d); }),
        P.on('page', () => { dernierePage = Date.now(); majVisibilite(); }),
        P.on('utilisateur', () => majVisibilite()),
      );
      LOG('branché sur pulse');
    }
    nettoyages.push(() => abonnementsPulse.splice(0).forEach(f => { try { f(); } catch (e) {} }));
    if (OD.pulse) brancherPulse(OD.pulse);
    else {
      ecouter(W, 'od-pulse-ready', () => brancherPulse(OD.pulse));
      const t = setTimeout(() => { if (!P) LOG('pulse absent : mode dégradé (contexte réduit)'); }, 8000);
      nettoyages.push(() => clearTimeout(t));
    }
    const endpoint = () => Pz().endpoint || SHIM.endpoint;

    /* ------------------------------------------------------------ vocabulaire */
    const MODULES = {
      dashboard: 'Accueil', kanban: 'Suivi des affaires', 'lead-mgmt': 'Leads', 'fiche-shell': 'Fiche client', 'cf-fiche': 'Fiche client',
      agenda: 'Agenda', 'vo-liste': 'Stock VO', bilaterales: 'Bilatérales', 'delco-chat': 'Delco', 'delco-page': 'Delco',
      admin: 'Administration', notifications: 'Notifications', performances: 'Performances', objectifs: 'Objectifs',
      'propale-vo': 'Proposition VO', 'propale-vn': 'Proposition VN', 'bdc-vn': 'Bon de commande VN', contacts: 'Contacts',
      entreprise: 'Entreprise', activite: 'Activité', annuaire: 'Annuaire', 'client-search': 'Recherche client',
      historique: 'Historique', pcom: 'Plan de communication', likes: 'Favoris', tours: 'Visites guidées', tutos: 'Tutoriels',
      onboarding: 'Onboarding',
    };
    const libelleModule = (k) => (k ? (MODULES[k] || k.replace(/-/g, ' ').replace(/^./, c => c.toUpperCase())) : null);
    const modulePrincipal = (liste) => {
      const pers = OD.persistent || new Set();
      return (liste || []).find(k => k && !pers.has(k) && k !== 'pulse' && k !== 'retours') || null;
    };

    const I = {
      bug: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 9h8v5a4 4 0 0 1-8 0z"/><path d="M9.5 9V7.5a2.5 2.5 0 0 1 5 0V9M3.5 13H8M16 13h4.5M5 7.5l3 2M19 7.5l-3 2M5 18.5l3-2M19 18.5l-3-2"/></svg>',
      flou: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M9.5 9.3a2.6 2.6 0 1 1 3.6 2.4c-.7.3-1.1.9-1.1 1.7v.4M12 17h.01"/></svg>',
      idee: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.6 10.8c.7.6 1.1 1.3 1.1 2.2h5c0-.9.4-1.6 1.1-2.2A6 6 0 0 0 12 3z"/></svg>',
      aime: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M12 20s-7.5-4.6-7.5-10.2A4.2 4.2 0 0 1 12 7.3a4.2 4.2 0 0 1 7.5 2.5C19.5 15.4 12 20 12 20z"/></svg>',
      o: '<svg viewBox="0 0 100 100" aria-hidden="true"><circle cx="50" cy="50" r="31" fill="none" stroke="#32AFA4" stroke-width="18"/><circle class="q" cx="50" cy="50" r="31" fill="none" stroke="#F8BA36" stroke-width="18" stroke-dasharray="48.695 194.779"/></svg>',
      bulle: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M4 5.5h16v10.5H10l-6 4.5z"/><path d="M8.5 10.5h7"/></svg>',
      x: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18"/></svg>',
      micro: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><rect x="9" y="3" width="6" height="11" rx="3"/><path d="M5.5 11a6.5 6.5 0 0 0 13 0M12 17.5V21"/></svg>',
      cible: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="7.5"/><circle cx="12" cy="12" r="2.5"/><path d="M12 1.5v3M12 19.5v3M1.5 12h3M19.5 12h3"/></svg>',
      lecture: '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z"/></svg>',
      pause: '<svg viewBox="0 0 24 24" width="14" height="14" fill="currentColor" aria-hidden="true"><path d="M7 5h3.5v14H7zM13.5 5H17v14h-3.5z"/></svg>',
      pouce: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M7 10.5V20H4v-9.5zM7 10.5l3.8-6.6a1.9 1.9 0 0 1 3.4 1.5L13.2 10h5.6a2 2 0 0 1 2 2.4l-1.3 5.9A2.2 2.2 0 0 1 17.4 20H7"/></svg>',
      coche: '<svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg>',
    };
    const HUMEURS = [
      { id: 'bug',  label: 'Ça bug',    c: '#B42318', f: '#FDECEA', aide: 'Qu\'est-ce qui ne marche pas ?' },
      { id: 'flou', label: 'Pas clair', c: '#8A5300', f: '#FFF1CC', aide: 'Qu\'est-ce qui n\'est pas clair ?' },
      { id: 'idee', label: 'Une idée',  c: '#1F4A85', f: '#E8EEF7', aide: 'Quelle est ton idée ?' },
      { id: 'aime', label: 'J\'aime',   c: '#2F7D55', f: '#E3F2EA', aide: 'Qu\'est-ce qui te plaît ?' },
    ];
    const HUM = Object.fromEntries(HUMEURS.map(h => [h.id, h]));
    const STATUTS = { nouveau: 'Envoyé', lu: 'Lu', en_cours: 'En cours', fait: 'Traité', ecarte: 'Pas retenu' };

    /* ------------------------------------------------------------ styles */
    const CSS = `
:host{all:initial}
*{box-sizing:border-box;font-family:'Nunito Sans',system-ui,-apple-system,'Segoe UI',Roboto,sans-serif}
button{font:inherit;cursor:pointer;border:0;background:none;color:inherit;padding:0;margin:0}
button:focus-visible,textarea:focus-visible{outline:2px solid #1F4A85;outline-offset:2px}
[hidden]{display:none!important}

.lg{position:fixed;right:10px;top:var(--y,62%);width:46px;height:46px;transform:translateY(-50%);border-radius:50%;touch-action:none;user-select:none;-webkit-tap-highlight-color:transparent}
.lg svg{display:block;width:100%;height:100%;filter:drop-shadow(0 3px 7px rgba(20,48,90,.30));transition:transform .18s ease}
.lg:hover svg,.lg:focus-visible svg{transform:scale(1.08)}
.lg:focus-visible{outline-offset:3px}
.lg.glisse{cursor:grabbing}
.lg.glisse svg{transition:none}
.lg.tour svg{animation:tour .9s cubic-bezier(.3,.7,.2,1)}
@keyframes tour{to{transform:rotate(360deg)}}
.etiq{position:absolute;right:calc(100% + 8px);top:50%;padding:5px 11px;border-radius:999px;background:#14305A;color:#fff;font-size:12.5px;font-weight:800;white-space:nowrap;pointer-events:none;opacity:0;transform:translate(6px,-50%);transition:opacity .15s ease,transform .15s ease}
.lg:hover .etiq,.lg:focus-visible .etiq{opacity:1;transform:translate(0,-50%)}
.lg.glisse .etiq{opacity:0}
.bd{position:absolute;top:-4px;left:-4px;min-width:19px;height:19px;padding:0 5px;border-radius:10px;background:#D92D20;color:#fff;font-size:11px;font-weight:800;line-height:19px;text-align:center;box-shadow:0 0 0 2px #fff}

.pn{position:fixed;right:0;top:50%;width:380px;max-height:min(680px,calc(100vh - 24px));display:flex;flex-direction:column;background:#fff;color:#14305A;border-radius:16px 0 0 16px;box-shadow:-12px 20px 54px rgba(20,48,90,.26);transform:translate(104%,-50%);visibility:hidden;transition:transform .24s cubic-bezier(.2,.8,.2,1),visibility 0s linear .24s}
.pn.ouvert{transform:translate(0,-50%);visibility:visible;transition:transform .24s cubic-bezier(.2,.8,.2,1)}
.hd{display:flex;align-items:flex-start;gap:10px;padding:18px 16px 12px 20px}
.hd h2{margin:0;font-size:19px;font-weight:800;line-height:1.2;color:#14305A}
.hd p{margin:3px 0 0;font-size:13px;color:#5A72A0}
.x{margin-left:auto;width:32px;height:32px;flex:none;border-radius:8px;display:grid;place-items:center;color:#5A72A0}
.x:hover{background:#F0F4FA;color:#14305A}
.tb{display:flex;gap:4px;margin:0 20px;padding:3px;background:#F0F4FA;border-radius:10px}
.tb button{flex:1;display:flex;align-items:center;justify-content:center;gap:6px;padding:7px 8px;border-radius:8px;font-size:13px;font-weight:700;color:#5A72A0}
.tb button[aria-selected="true"]{background:#fff;color:#1F4A85;box-shadow:0 1px 3px rgba(20,48,90,.14)}
.tb i{font-style:normal;min-width:18px;height:18px;line-height:18px;padding:0 5px;border-radius:9px;background:#D92D20;color:#fff;font-size:11px;font-weight:800}
.bo{padding:16px 20px 20px;overflow:auto;overscroll-behavior:contain}

.hm{display:grid;grid-template-columns:1fr 1fr;gap:8px}
.hm button{display:flex;align-items:center;gap:10px;min-height:54px;padding:12px;border-radius:12px;background:var(--f);color:var(--c);font-size:15px;font-weight:800;border:2px solid transparent;text-align:left;transition:opacity .15s ease,border-color .15s ease,transform .08s ease}
.hm button:active{transform:scale(.97)}
.hm button svg{width:24px;height:24px;flex:none}
.hm.choisi button{opacity:.45}
.hm.choisi button[aria-pressed="true"]{opacity:1;border-color:var(--c)}

.cp{margin-top:14px;display:flex;flex-direction:column;gap:10px}
textarea{display:block;width:100%;min-height:86px;max-height:220px;resize:none;border:1.5px solid #D5DFEE;border-radius:10px;padding:10px 12px;font-size:14px;line-height:1.45;color:#14305A;background:#fff}
textarea::placeholder{color:#9AAECB}
textarea:focus{border-color:#1F4A85;outline:none}
.ou{display:flex;gap:8px;flex-wrap:wrap}
.ou button{display:flex;align-items:center;gap:6px;padding:8px 12px;border-radius:9px;border:1.5px solid #D5DFEE;font-size:13px;font-weight:700;color:#1F4A85}
.ou button:hover{background:#F5F8FD;border-color:#9AAECB}
.ou svg{width:16px;height:16px}
.pj{display:flex;gap:6px;flex-wrap:wrap}
.pj:empty{display:none}
.chip{display:flex;align-items:center;gap:6px;max-width:100%;padding:4px 4px 4px 10px;border-radius:999px;background:#E8EEF7;color:#1F4A85;font-size:12.5px;font-weight:700}
.chip svg{width:14px;height:14px;flex:none}
.chip b{font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:210px}
.chip button{width:24px;height:24px;flex:none;border-radius:50%;display:grid;place-items:center}
.chip button:hover{background:rgba(31,74,133,.14)}
.chip button svg{width:13px;height:13px}
.rec{display:flex;align-items:center;gap:10px;padding:8px 8px 8px 12px;border-radius:10px;background:#FDECEA;color:#B42318}
.rec .pt{width:10px;height:10px;flex:none;border-radius:50%;background:#D92D20;animation:bat 1.1s ease-in-out infinite}
@keyframes bat{50%{opacity:.25}}
.rec canvas{flex:1;min-width:0;height:30px}
.rec time{font-variant-numeric:tabular-nums;font-weight:800;font-size:13px}
.rec button{padding:6px 10px;border-radius:8px;background:#B42318;color:#fff;font-weight:800;font-size:12.5px}
.rec button.an{background:none;color:#B42318;padding:6px 6px}
.pd{display:flex;align-items:center;gap:12px;margin-top:2px}
.pd small{font-size:11.5px;line-height:1.35;color:#7A98C5}
.env{margin-left:auto;flex:none;padding:10px 20px;border-radius:10px;background:#1F4A85;color:#fff;font-weight:800;font-size:14px}
.env:hover{background:#183d70}
.env:disabled{background:#B9C8DE;cursor:default}
.er{font-size:13px;line-height:1.4;color:#B42318;background:#FDECEA;padding:8px 10px;border-radius:8px}
.ok{text-align:center;padding:24px 8px 8px}
.ok .rd{width:58px;height:58px;margin:0 auto 14px;border-radius:50%;background:#E3F2EA;color:#2F7D55;display:grid;place-items:center;animation:pop .35s cubic-bezier(.2,1.4,.4,1)}
@keyframes pop{from{transform:scale(.4);opacity:0}}
.ok h3{margin:0 0 6px;font-size:17px;font-weight:800}
.ok p{margin:0 0 16px;font-size:13.5px;line-height:1.45;color:#5A72A0}

.li{display:flex;flex-direction:column;gap:6px}
.it{display:grid;grid-template-columns:30px 1fr;gap:10px;padding:10px 10px 10px 8px;border-radius:10px;border-left:3px solid transparent}
.it.nl{background:#F5F8FD;border-left-color:#1F4A85}
.it .ic{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;background:var(--f);color:var(--c)}
.it .ic svg{width:17px;height:17px}
.it p{margin:0;font-size:13.5px;line-height:1.4;color:#14305A;overflow-wrap:anywhere;display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}
.mt{display:flex;flex-wrap:wrap;align-items:center;gap:8px;margin-top:5px;font-size:12px;color:#7A98C5}
.st{padding:1px 8px;border-radius:999px;font-weight:700;font-size:11.5px;background:#EEF2F8;color:#5A72A0}
.st.en_cours{background:#FFF1CC;color:#8A5300}.st.fait{background:#E3F2EA;color:#2F7D55}.st.ecarte{background:#F1F2F4;color:#667085}
.rp{margin-top:8px;padding:8px 11px;border-radius:3px 12px 12px 12px;background:#1F4A85;color:#fff;font-size:13px;line-height:1.45;overflow-wrap:anywhere}
.rp em{display:block;font-style:normal;font-size:11px;font-weight:700;opacity:.72;margin-bottom:2px}
.vide{font-size:13.5px;line-height:1.5;color:#5A72A0;text-align:center;padding:26px 10px}

.cd{position:fixed;right:48px;bottom:22px;width:min(340px,calc(100vw - 64px));padding:15px 16px 14px;background:#fff;color:#14305A;border-radius:14px;border:1px solid #E3EAF4;box-shadow:0 14px 40px rgba(20,48,90,.22);transform:translateY(14px);opacity:0;visibility:hidden;transition:transform .22s ease,opacity .22s ease,visibility 0s linear .22s}
.cd.vu{transform:none;opacity:1;visibility:visible;transition:transform .22s ease,opacity .22s ease}
.cd h3{margin:0 28px 10px 0;font-size:14.5px;font-weight:800;line-height:1.35}
.cd p{margin:0 0 10px;font-size:13px;line-height:1.45;color:#5A72A0}
.cd > .x{position:absolute;top:8px;right:8px;width:28px;height:28px}
.cd textarea{min-height:70px;margin-bottom:2px}
.po{display:flex;gap:8px}
.po button{flex:1;display:flex;align-items:center;justify-content:center;gap:7px;padding:9px 6px;border-radius:10px;border:1.5px solid #D5DFEE;font-weight:800;font-size:13.5px;color:#1F4A85}
.po button:hover{border-color:#1F4A85;background:#F5F8FD}
.po svg{width:18px;height:18px}
.po .bas svg{transform:rotate(180deg)}
.n5 button{padding:9px 0;font-size:15px}
.l5{display:flex;justify-content:space-between;margin-top:5px;font-size:11px;color:#9AAECB}
.lk{margin-top:10px;font-size:12px;color:#7A98C5;text-decoration:underline;text-underline-offset:2px}
.lk:hover{color:#1F4A85}
.act{display:flex;gap:8px;align-items:center;margin-top:10px}
.bt{padding:8px 14px;border-radius:9px;background:#1F4A85;color:#fff;font-weight:800;font-size:13px}
.bt:hover{background:#183d70}
.bt.sec{background:#fff;color:#1F4A85;box-shadow:inset 0 0 0 1.5px #D5DFEE}
.bt.sec:hover{background:#F5F8FD}

.pk{position:fixed;inset:0;pointer-events:none}
.pkb{position:fixed;top:14px;left:50%;transform:translateX(-50%);display:flex;align-items:center;gap:12px;padding:8px 8px 8px 16px;border-radius:999px;background:#14305A;color:#fff;font-size:13.5px;font-weight:700;white-space:nowrap;box-shadow:0 10px 30px rgba(20,48,90,.38);pointer-events:auto}
.pkb button{padding:6px 13px;border-radius:999px;background:rgba(255,255,255,.16);font-weight:800;font-size:12.5px}
.pkb button:hover{background:rgba(255,255,255,.26)}
.pkz{position:fixed;border:2px solid #1F4A85;border-radius:7px;background:rgba(31,74,133,.07);box-shadow:0 0 0 100vmax rgba(20,48,90,.22);transition:left .07s ease,top .07s ease,width .07s ease,height .07s ease}
.pkl{position:absolute;left:-2px;bottom:calc(100% + 5px);max-width:280px;padding:3px 9px;border-radius:6px;background:#1F4A85;color:#fff;font-size:12px;font-weight:700;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.pkz.bas .pkl{bottom:auto;top:calc(100% + 5px)}

@media (max-width:640px){
  .pn{left:0;right:0;top:auto;bottom:0;width:auto;max-height:88vh;border-radius:18px 18px 0 0;transform:translateY(104%)}
  .pn.ouvert{transform:translateY(0)}
  .cd{right:12px;left:12px;bottom:12px;width:auto}
  .pkb{top:auto;bottom:18px}
}
@media (prefers-reduced-motion:reduce){*{transition:none!important;animation:none!important}}
@media print{.lg,.pn,.cd,.pk{display:none!important}}
`;

    /* ------------------------------------------------------------ squelette */
    if (!document.querySelector('link[href*="Nunito+Sans"]')) {
      const l = document.createElement('link');
      l.rel = 'stylesheet';
      l.href = 'https://fonts.googleapis.com/css2?family=Nunito+Sans:wght@400;600;700;800&display=swap';
      document.head.appendChild(l);
    }
    const hote = document.createElement('div');
    hote.id = 'od-retours';
    hote.style.cssText = 'position:fixed;top:0;left:0;width:0;height:0;z-index:2147482000;';
    const R = hote.attachShadow({ mode: 'open' });
    R.innerHTML = `<style>${CSS}</style>
<button class="lg" type="button" hidden aria-label="Donner un avis sur One Data">${I.o}<span class="etiq">Un avis ?</span><b class="bd" hidden></b></button>
<section class="pn" role="dialog" aria-labelledby="od-r-titre">
  <div class="hd"><div><h2 id="od-r-titre">Ton avis</h2><p class="ec"></p></div><button class="x" type="button" data-a="fermer" aria-label="Fermer">${I.x}</button></div>
  <div class="tb" role="tablist">
    <button type="button" role="tab" aria-selected="true" data-a="onglet" data-o="avis">Donner mon avis</button>
    <button type="button" role="tab" aria-selected="false" data-a="onglet" data-o="mes">Mes retours <i hidden></i></button>
  </div>
  <div class="bo" data-v="avis">
    <div class="hm" role="group" aria-label="De quoi s'agit-il ?">
      ${HUMEURS.map(h => `<button type="button" data-a="humeur" data-h="${h.id}" aria-pressed="false" style="--c:${h.c};--f:${h.f}">${I[h.id]}<span>${h.label}</span></button>`).join('')}
    </div>
    <div class="cp" hidden>
      <textarea rows="3" maxlength="4000" aria-label="Ton message (facultatif)"></textarea>
      <div class="rec" hidden><span class="pt"></span><canvas aria-hidden="true"></canvas><time>0:00</time><button type="button" data-a="rec-stop">Terminer</button><button type="button" class="an" data-a="rec-annuler">Annuler</button></div>
      <div class="ou"><button type="button" data-a="micro">${I.micro}Dicter</button><button type="button" data-a="montrer">${I.cible}Montrer l'endroit</button></div>
      <div class="pj"></div>
      <div class="er" role="alert" hidden></div>
      <div class="pd"><small>L'écran, la page et ton appareil sont joints automatiquement.</small><button type="button" class="env" data-a="envoyer">Envoyer</button></div>
    </div>
    <div class="ok" hidden><div class="rd">${I.coche}</div><h3>Merci, c'est transmis.</h3><p>La réponse arrivera dans « Mes retours ».</p><button type="button" class="bt sec" data-a="nouveau">Envoyer un autre avis</button></div>
  </div>
  <div class="bo" data-v="mes" hidden><div class="li"></div></div>
</section>
<div class="cd" role="status" aria-live="polite"></div>
<div class="pk" hidden><div class="pkb"><span>Clique sur l'endroit concerné</span><button type="button" data-a="pk-annuler">Annuler</button></div><div class="pkz" hidden><span class="pkl"></span></div></div>`;
    document.body.appendChild(hote);
    nettoyages.push(() => hote.remove());

    const $ = (s) => R.querySelector(s);
    const lanceur = $('.lg'), badgeLanceur = $('.bd'), panneauEl = $('.pn'), ecranEl = $('.ec');
    const vueAvis = $('[data-v="avis"]'), vueMes = $('[data-v="mes"]'), badgeOnglet = $('.tb i');
    const grille = $('.hm'), compo = $('.cp'), ta = $('textarea'), recEl = $('.rec'), outils = $('.ou');
    const pj = $('.pj'), errEl = $('.er'), btnEnv = $('.env'), okEl = $('.ok'), liste = $('.li');
    const carteEl = $('.cd'), pk = $('.pk'), pkz = $('.pkz'), pkl = $('.pkl');

    /* ------------------------------------------------------------ état */
    let ouvert = false;
    let onglet = 'avis';
    let nonLus = 0;
    let br = { humeur: null, audio: null, cible: null, declencheur: 'spontane', detail: null };
    let envoiEnCours = false;
    let focusAvant = null;
    let derniereActivite = Date.now();
    let dernierePage = Date.now();
    ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(t => ecouter(document, t, () => { derniereActivite = Date.now(); }, { capture: true, passive: true }));

    const cleUid = (prefixe) => prefixe + '_' + (uidDe(utilisateur()) || 'anon');
    const lireLS = (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } };
    const ecrireLS = (k, v) => { try { localStorage.setItem(k, v); } catch (e) {} };

    /* ------------------------------------------------------------ lanceur */
    const yStocke = parseFloat(lireLS('od_retours_y'));
    if (yStocke > 8 && yStocke < 92) lanceur.style.setProperty('--y', yStocke + '%');
    let glisse = null;
    let vientDeGlisser = false;
    lanceur.addEventListener('pointerdown', (e) => {
      glisse = { y0: e.clientY, actif: false, id: e.pointerId };
    });
    lanceur.addEventListener('pointermove', (e) => {
      if (!glisse) return;
      if (!glisse.actif && Math.abs(e.clientY - glisse.y0) > 6) {
        glisse.actif = true;
        lanceur.classList.add('glisse');
        try { lanceur.setPointerCapture(glisse.id); } catch (x) {}
      }
      if (glisse.actif) {
        const pct = Math.min(90, Math.max(10, (e.clientY / innerHeight) * 100));
        lanceur.style.setProperty('--y', pct.toFixed(1) + '%');
      }
    });
    const finGlisse = () => {
      if (glisse && glisse.actif) {
        vientDeGlisser = true;
        lanceur.classList.remove('glisse');
        ecrireLS('od_retours_y', parseFloat(lanceur.style.getPropertyValue('--y')) || 62);
        setTimeout(() => { vientDeGlisser = false; }, 0);
      }
      glisse = null;
    };
    lanceur.addEventListener('pointerup', finGlisse);
    lanceur.addEventListener('pointercancel', finGlisse);
    lanceur.addEventListener('click', () => {
      if (vientDeGlisser) return;
      ouvert ? fermer() : ouvrir(nonLus > 0 ? 'mes' : 'avis');
    });

    function majVisibilite() {
      const u = utilisateur();
      const visible = !!u && document.visibilityState !== 'prerender';
      lanceur.hidden = !visible;
      if (!visible) { if (ouvert) fermer(); masquerCarte(); }
      else planifierNotice();
    }
    minuter(majVisibilite, 700);

    function majBadge(n) {
      const avant = nonLus;
      nonLus = Math.max(0, Number(n) || 0);
      if (nonLus > avant) { lanceur.classList.remove('tour'); void lanceur.offsetWidth; lanceur.classList.add('tour'); }
      badgeLanceur.hidden = nonLus === 0;
      badgeLanceur.textContent = nonLus > 9 ? '9+' : String(nonLus);
      badgeOnglet.hidden = nonLus === 0;
      badgeOnglet.textContent = String(nonLus);
      lanceur.setAttribute('aria-label', nonLus ? `Donner un avis sur One Data (${nonLus} réponse${nonLus > 1 ? 's' : ''} non lue${nonLus > 1 ? 's' : ''})` : 'Donner un avis sur One Data');
    }

    /* ------------------------------------------------------------ panneau */
    function majEcran() {
      let c = {};
      try { c = Pz().contexte() || {}; } catch (e) {}
      const m = (br.cible && br.cible.module) || modulePrincipal(c.modules_affiches);
      ecranEl.textContent = m ? `Écran : ${libelleModule(m)}` : `Page : ${c.page || location.pathname}`;
    }
    function ouvrir(vue) {
      if (!utilisateur()) return;
      masquerCarte();
      focusAvant = document.activeElement;
      ouvert = true;
      majEcran();
      panneauEl.classList.add('ouvert');
      choisirOnglet(vue || onglet);
      setTimeout(() => {
        const f = onglet === 'avis' ? (br.humeur ? ta : grille.querySelector('button')) : R.querySelector('[data-o="mes"]');
        try { f && f.focus({ preventScroll: true }); } catch (e) {}
      }, 60);
    }
    function fermer(opts) {
      ouvert = false;
      panneauEl.classList.remove('ouvert');
      if (!(opts && opts.garder) && okEl && !okEl.hidden) reinitialiser();
      if (!(opts && opts.sansFocus)) { try { focusAvant && focusAvant.focus && focusAvant.focus({ preventScroll: true }); } catch (e) {} }
    }
    function choisirOnglet(o) {
      onglet = o;
      R.querySelectorAll('[data-a="onglet"]').forEach(b => b.setAttribute('aria-selected', String(b.dataset.o === o)));
      vueAvis.hidden = o !== 'avis';
      vueMes.hidden = o !== 'mes';
      if (o === 'mes') chargerMesRetours();
    }

    /* ------------------------------------------------------------ brouillon */
    function choisirHumeur(id) {
      br.humeur = id;
      grille.classList.add('choisi');
      grille.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', String(b.dataset.h === id)));
      ta.placeholder = HUM[id].aide + ' (facultatif)';
      compo.hidden = false;
      okEl.hidden = true;
      cacherErreur();
      setTimeout(() => { try { ta.focus({ preventScroll: true }); } catch (e) {} }, 30);
    }
    function reinitialiser() {
      if (br.audio && br.audio.url) URL.revokeObjectURL(br.audio.url);
      br = { humeur: null, audio: null, cible: null, declencheur: 'spontane', detail: null };
      ta.value = '';
      autoTaille();
      grille.classList.remove('choisi');
      grille.hidden = false;
      grille.querySelectorAll('button').forEach(b => b.setAttribute('aria-pressed', 'false'));
      compo.hidden = true;
      okEl.hidden = true;
      cacherErreur();
      rendrePJ();
    }
    function autoTaille() { ta.style.height = 'auto'; ta.style.height = Math.min(220, Math.max(86, ta.scrollHeight + 2)) + 'px'; }
    ta.addEventListener('input', autoTaille);
    ta.addEventListener('keydown', (e) => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); envoyer(); } });

    function montrerErreur(m) { errEl.textContent = m; errEl.hidden = false; }
    function cacherErreur() { errEl.hidden = true; errEl.textContent = ''; }

    let lecteur = null;
    function rendrePJ() {
      const morceaux = [];
      if (br.audio) {
        morceaux.push(`<span class="chip">${I.micro}<b>Note vocale ${fmtDuree(br.audio.duree)}</b>
          <button type="button" data-a="audio-lire" aria-label="${lecteur && !lecteur.paused ? 'Mettre en pause' : 'Écouter'}">${lecteur && !lecteur.paused ? I.pause : I.lecture}</button>
          <button type="button" data-a="audio-suppr" aria-label="Supprimer la note vocale">${I.x}</button></span>`);
      }
      if (br.cible) {
        const nom = br.cible.libelle || (br.cible.module ? `Zone ${libelleModule(br.cible.module)}` : 'Élément désigné');
        morceaux.push(`<span class="chip">${I.cible}<b>${esc(nom)}</b><button type="button" data-a="cible-suppr" aria-label="Retirer l'élément désigné">${I.x}</button></span>`);
      }
      pj.innerHTML = morceaux.join('');
      R.querySelector('[data-a="micro"]').hidden = !!br.audio || !!enr;
    }
    const fmtDuree = (s) => { s = Math.max(0, Math.round(s)); return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`; };

    /* ------------------------------------------------------------ note vocale */
    const MAX_S = 120;
    let enr = null;
    async function demarrerMicro() {
      cacherErreur();
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia || typeof W.MediaRecorder === 'undefined') {
        montrerErreur('La dictée n\'est pas disponible sur ce navigateur. Écris ton message, c\'est tout aussi utile.');
        return;
      }
      let flux;
      try {
        flux = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: true, noiseSuppression: true, autoGainControl: true } });
      } catch (e) {
        montrerErreur(e && e.name === 'NotAllowedError'
          ? 'Le micro est bloqué. Autorise-le dans les réglages du navigateur (icône à gauche de l\'adresse), ou écris ton message.'
          : 'Aucun micro utilisable n\'a été trouvé. Écris ton message à la place.');
        return;
      }
      const types = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus'];
      const type = types.find(t => { try { return W.MediaRecorder.isTypeSupported(t); } catch (e) { return false; } }) || '';
      let rec;
      try { rec = new W.MediaRecorder(flux, type ? { mimeType: type, audioBitsPerSecond: 32000 } : undefined); }
      catch (e) { flux.getTracks().forEach(t => t.stop()); montrerErreur('Impossible de démarrer l\'enregistrement sur cet appareil.'); return; }

      enr = { rec, flux, morceaux: [], debut: Date.now(), annule: false, ac: null, an: null, raf: 0, niveaux: new Array(44).fill(0.02), dernier: 0, type: type || rec.mimeType || 'audio/webm' };
      rec.ondataavailable = (e) => { if (e.data && e.data.size) enr && enr.morceaux.push(e.data); };
      const courant = enr;
      rec.onstop = () => {
        courant.flux.getTracks().forEach(t => t.stop());
        cancelAnimationFrame(courant.raf);
        try { courant.ac && courant.ac.close(); } catch (e) {}
        const duree = (Date.now() - courant.debut) / 1000;
        if (!courant.annule && courant.morceaux.length) {
          if (duree < 1) montrerErreur('Note trop courte : garde le bouton actif le temps de parler.');
          else {
            const blob = new Blob(courant.morceaux, { type: (courant.rec.mimeType || courant.type).split(';')[0] });
            br.audio = { blob, duree, url: URL.createObjectURL(blob) };
          }
        }
        if (enr === courant) enr = null;
        recEl.hidden = true;
        outils.hidden = false;
        rendrePJ();
        if (courant.resoudre) courant.resoudre();
      };
      rec.start(250);
      const AC = W.AudioContext || W.webkitAudioContext;
      if (AC) {
        try {
          enr.ac = new AC();
          const src = enr.ac.createMediaStreamSource(flux);
          enr.an = enr.ac.createAnalyser();
          enr.an.fftSize = 512;
          src.connect(enr.an);
        } catch (e) { enr.an = null; }
      }
      recEl.hidden = false;
      outils.hidden = true;
      dessinerOnde();
    }
    function dessinerOnde() {
      const e = enr;
      if (!e) return;
      e.raf = requestAnimationFrame(dessinerOnde);
      const now = performance.now();
      const ecoule = (Date.now() - e.debut) / 1000;
      recEl.querySelector('time').textContent = fmtDuree(ecoule);
      if (ecoule >= MAX_S) { arreterMicro(false); return; }
      if (now - e.dernier > 70) {
        e.dernier = now;
        let v = 0.05 + Math.random() * 0.05;
        if (e.an) {
          const buf = new Uint8Array(e.an.fftSize);
          e.an.getByteTimeDomainData(buf);
          let s = 0;
          for (let i = 0; i < buf.length; i++) { const x = (buf[i] - 128) / 128; s += x * x; }
          v = Math.min(1, Math.sqrt(s / buf.length) * 3.4);
        }
        e.niveaux.push(Math.max(0.04, v));
        e.niveaux.shift();
      }
      const c = recEl.querySelector('canvas');
      const dpr = W.devicePixelRatio || 1;
      const w = c.clientWidth || 150, h = c.clientHeight || 30;
      if (c.width !== Math.round(w * dpr)) { c.width = Math.round(w * dpr); c.height = Math.round(h * dpr); }
      const g = c.getContext && c.getContext('2d');
      if (!g) return;
      g.setTransform(dpr, 0, 0, dpr, 0, 0);
      g.clearRect(0, 0, w, h);
      g.fillStyle = '#B42318';
      const n = e.niveaux.length, pas = w / n;
      e.niveaux.forEach((v, i) => {
        const bh = Math.max(2, v * h);
        g.globalAlpha = 0.3 + 0.7 * (i / n);
        g.fillRect(i * pas + 0.5, (h - bh) / 2, Math.max(1.5, pas - 1.5), bh);
      });
    }
    function arreterMicro(annuler) {
      const e = enr;
      if (!e) return Promise.resolve();
      e.annule = !!annuler;
      return new Promise((resoudre) => {
        e.resoudre = resoudre;
        try { e.rec.state !== 'inactive' ? e.rec.stop() : e.rec.onstop(); } catch (x) { resoudre(); }
      });
    }
    nettoyages.push(() => { if (enr) arreterMicro(true); if (lecteur) lecteur.pause(); });

    function basculerLecture() {
      if (!br.audio) return;
      if (!lecteur || lecteur.__src !== br.audio.url) {
        if (lecteur) lecteur.pause();
        lecteur = new Audio(br.audio.url);
        lecteur.__src = br.audio.url;
        lecteur.onended = lecteur.onpause = lecteur.onplay = () => rendrePJ();
      }
      lecteur.paused ? lecteur.play().catch(() => {}) : lecteur.pause();
    }

    /* ------------------------------------------------------------ montrer l'endroit */
    const INTER = 'button, a[href], [role="button"], [role="tab"], [role="menuitem"], [role="option"], input, select, textarea, label, summary, [data-od-track]';
    // ---- nommer la zone désignée, sans jamais reprendre de nom de personne
    const texteDe = (n) => ((n && n.textContent) || '').replace(/\s+/g, ' ').trim();
    function libelleSur(t, max) {
      if (!t || t.length < 2 || t.length > max) return null;
      if (/@|\d{5,}|\b\d{2}[ .-]\d{2}[ .-]\d{2}\b|[A-Z]{2}-?\d{3}-?[A-Z]{2}/.test(t)) return null;   // email, n°, téléphone, immat
      const mots = t.split(' ').filter(m => m.length > 2);
      const capitales = mots.filter(m => /^[A-ZÀ-Ý][a-zà-ÿ'’-]/.test(m)).length;
      if (capitales >= 2 && capitales === mots.length) return null;                   // « Jean Dupont »
      if (/^[A-ZÀ-Ý\s'’-]+$/.test(t) && t.includes(' ')) return null;                 // « DUPONT JEAN »
      return t;
    }
    function libellePropre(el) {
      const track = el.closest('[data-od-track]');
      if (track) return track.getAttribute('data-od-track').slice(0, 60);
      for (const a of ['aria-label', 'title', 'placeholder', 'alt']) {
        const v = libelleSur((el.getAttribute(a) || '').trim(), 50);
        if (v) return v;
      }
      if (/^(INPUT|SELECT|TEXTAREA)$/.test(el.tagName)) {
        const lab = (el.labels && el.labels[0]) || el.closest('label');
        const v = lab && libelleSur(texteDe(lab), 50);
        if (v) return v;
      }
      if (el.matches('button, a[href], [role="button"], [role="tab"], [role="menuitem"], [role="option"], summary, label, option')) {
        return libelleSur(texteDe(el), 40);
      }
      return null;
    }
    const TITRES = [
      'h1, h2, h3, h4, h5, h6, [role="heading"], legend, caption',
      '[class*="title"], [class*="titre"], [class$="-t"], [class*="-t "]',
      '[class*="header"], [class*="entete"], [class$="-h"], [class*="-h "]',
    ];
    function titreContexte(el, stop) {
      let anc = el;
      for (let k = 0; anc && anc !== document.body && k < 12; k++) {
        for (const sel of TITRES) {
          let liste = [];
          try { liste = anc.querySelectorAll(sel); } catch (e) {}
          for (const m of liste) {
            if (m.closest('#od-retours')) continue;
            const avant = m.contains(el) || (m.compareDocumentPosition(el) & Node.DOCUMENT_POSITION_FOLLOWING);
            if (!avant) continue;
            // Le titre doit coiffer le bloc de l'élément : son premier ancêtre qui
            // contient l'élément est `anc`, à 3 niveaux au plus. Sinon c'est le titre
            // d'un bloc voisin (autre carte), qu'on ne doit pas emprunter.
            if (!m.contains(el)) {
              let prof = 0, b = m;
              while (b && b !== anc && !b.contains(el)) { b = b.parentElement; prof++; }
              if (b !== anc || prof > 3) continue;
            }
            const v = libelleSur(texteDe(m), 60);
            if (v) return v;
            return null;   // le titre du bloc est un nom de personne : on n'en cherche pas un autre plus haut
          }
        }
        if (anc === stop) break;
        anc = anc.parentElement;
      }
      return null;
    }
    function colonne(el) {
      const cell = el.closest('td, th');
      const table = cell && cell.closest('table');
      if (!table) return null;
      if (cell.tagName === 'TH') return libelleSur(texteDe(cell), 40);
      const tete = (table.tHead && table.tHead.rows[0]) || table.querySelector('tr');
      const th = tete && tete.cells[cell.cellIndex];
      return th && th !== cell ? libelleSur(texteDe(th), 40) : null;
    }
    function genre(el) {
      const t = el.tagName;
      if (el.closest('canvas, svg')) return 'graphique';
      if (t === 'IMG') return 'image';
      if (el.closest('td')) return 'cellule de tableau';
      if (el.closest('tr')) return 'ligne de tableau';
      if (t === 'TABLE') return 'tableau';
      if (t === 'INPUT' || t === 'TEXTAREA') return 'champ de saisie';
      if (t === 'SELECT') return 'liste déroulante';
      if (el.closest('button, [role="button"]')) return 'bouton';
      if (el.closest('a[href]')) return 'lien';
      if (el.closest('li')) return 'élément de liste';
      return null;
    }
    const cacheNoms = new WeakMap();
    function nommerZone(el) {
      if (!el || el.nodeType !== 1) return null;
      if (cacheNoms.has(el)) return cacheNoms.get(el);
      const hote = el.closest('[data-od-module]');
      const ecran = hote ? libelleModule(hote.getAttribute('data-od-module')) : null;
      let nom = null;
      try {
        const propre = libellePropre(el);
        const titre = titreContexte(el, hote);
        const col = colonne(el);
        const g = genre(el);
        const precision = (propre && propre !== titre) ? propre : col ? `colonne ${col}` : g;
        if (titre && precision) nom = `${titre} : ${precision}`;
        else if (titre) nom = titre;
        else if (propre) nom = ecran ? `${ecran} : ${propre}` : propre;
        else if (precision) nom = ecran ? `${ecran} : ${precision}` : precision.replace(/^./, c => c.toUpperCase());
      } catch (e) {}
      nom = (nom || (ecran ? `Zone ${ecran}` : 'Élément désigné')).slice(0, 90);
      cacheNoms.set(el, nom);
      return nom;
    }

    let pick = null;
    function cibleSous(x, y) {
      let el = document.elementFromPoint(x, y);
      if (!el || el === hote || el === document.documentElement || el === document.body) return null;
      const inter = el.closest && el.closest(INTER);
      if (inter && inter !== document.body) {
        const r = inter.getBoundingClientRect();
        if (r.width * r.height < innerWidth * innerHeight * 0.4) el = inter;
      }
      let r = el.getBoundingClientRect();
      let k = 0;
      while (r.width * r.height < 500 && el.parentElement && el.parentElement !== document.body && k++ < 3) {
        el = el.parentElement;
        r = el.getBoundingClientRect();
      }
      return el;
    }
    function demarrerPick() {
      if (pick) return;
      fermer({ garder: true, sansFocus: true });
      pk.hidden = false;
      pkz.hidden = true;
      const style = document.createElement('style');
      style.textContent = 'html.od-pick, html.od-pick *{cursor:crosshair!important}';
      document.head.appendChild(style);
      document.documentElement.classList.add('od-pick');
      let courant = null;
      const dansWidget = (e) => { try { return e.composedPath().includes(hote); } catch (x) { return false; } };
      const surligner = (el) => {
        courant = el;
        if (!el) { pkz.hidden = true; return; }
        const r = el.getBoundingClientRect();
        pkz.hidden = false;
        pkz.style.left = (r.left - 3) + 'px';
        pkz.style.top = (r.top - 3) + 'px';
        pkz.style.width = (r.width + 6) + 'px';
        pkz.style.height = (r.height + 6) + 'px';
        pkz.classList.toggle('bas', r.top < 34);
        pkl.textContent = nommerZone(el);
      };
      const surMouvement = (e) => { if (dansWidget(e)) return; surligner(cibleSous(e.clientX, e.clientY)); };
      const bloquer = (e) => { if (dansWidget(e)) return; e.preventDefault(); e.stopImmediatePropagation(); };
      const choisir = (el) => {
        if (!el) return;
        let d = null;
        try { d = Pz().decrire(el); } catch (x) {}
        const nom = nommerZone(el);
        if (d) br.cible = { module: d.module || null, libelle: nom, selecteur: d.selecteur || null, cible: d.selecteur ? `${nom} ‹${d.selecteur}›` : nom, rect: d.rect || null };
        finPick();
      };
      const surClic = (e) => { if (dansWidget(e)) return; bloquer(e); if (e.detail !== 0 || e.pointerType === 'mouse' || !e.pointerType) choisir(cibleSous(e.clientX, e.clientY) || courant); };
      const surRelache = (e) => {
        if (dansWidget(e)) return;
        bloquer(e);
        if (e.pointerType && e.pointerType !== 'mouse') {
          // Le clic synthétique du tactile arrive APRÈS la fin du mode : on l'avale.
          const avaler = (x) => { if (!dansWidget(x)) { x.preventDefault(); x.stopImmediatePropagation(); } };
          W.addEventListener('click', avaler, { capture: true, once: true });
          setTimeout(() => W.removeEventListener('click', avaler, { capture: true }), 700);
          choisir(cibleSous(e.clientX, e.clientY));
        }
      };
      const surTouche = (e) => { if (e.key === 'Escape') { e.preventDefault(); e.stopImmediatePropagation(); finPick(); } };
      const l = [
        ['pointermove', surMouvement], ['mousemove', surMouvement],
        ['pointerdown', bloquer], ['mousedown', bloquer], ['mouseup', bloquer], ['touchstart', bloquer], ['touchend', bloquer],
        ['dblclick', bloquer], ['contextmenu', bloquer], ['submit', bloquer],
        ['pointerup', surRelache], ['click', surClic], ['keydown', surTouche],
      ];
      l.forEach(([t, f]) => W.addEventListener(t, f, { capture: true, passive: false }));
      pick = () => {
        l.forEach(([t, f]) => W.removeEventListener(t, f, { capture: true, passive: false }));
        document.documentElement.classList.remove('od-pick');
        style.remove();
      };
    }
    function finPick() {
      if (!pick) return;
      const p = pick;
      pick = null;
      p();
      pk.hidden = true;
      pkz.hidden = true;
      rendrePJ();
      ouvrir('avis');
    }
    nettoyages.push(() => { if (pick) { const p = pick; pick = null; p(); } });

    /* ------------------------------------------------------------ envoi */
    async function envoyer() {
      if (envoiEnCours) return;
      if (!br.humeur) { montrerErreur('Choisis d\'abord de quoi il s\'agit.'); return; }
      const u = utilisateur();
      if (!u) return;
      if (enr) await arreterMicro(false);
      envoiEnCours = true;
      btnEnv.disabled = true;
      btnEnv.textContent = 'Envoi…';
      cacherErreur();
      let c = {};
      try { c = Pz().contexte() || {}; } catch (e) {}
      const principal = (br.cible && br.cible.module) || modulePrincipal(c.modules_affiches);
      const payload = {
        tenant_id: tenant.id,
        humeur: br.humeur,
        texte: ta.value.trim() || null,
        page: c.page || location.pathname,
        module: principal,
        cible: br.cible ? br.cible.cible : null,
        cible_libelle: br.cible ? br.cible.libelle : null,
        declencheur: br.declencheur || 'spontane',
        session_id: c.session_id || null,
        audio_duree_s: br.audio ? Math.round(br.audio.duree) : null,
        contexte: Object.assign({}, c, {
          ecran: principal ? libelleModule(principal) : null,
          cible_zone: br.cible ? { rect: br.cible.rect, selecteur: br.cible.selecteur, viewport: `${innerWidth}x${innerHeight}` } : null,
          declencheur_detail: br.detail || null,
        }),
      };
      const fd = new FormData();
      fd.append('payload', JSON.stringify(payload));
      if (br.audio) {
        const mime = br.audio.blob.type || 'audio/webm';
        const ext = /mp4|m4a|aac/.test(mime) ? 'm4a' : /ogg/.test(mime) ? 'ogg' : 'webm';
        fd.append('audio', br.audio.blob, `note.${ext}`);
      }
      try {
        const jeton = await Pz().jeton();
        if (!jeton) throw Object.assign(new Error('session'), { statut: 401 });
        const r = await fetch(endpoint() + '?a=retour', { method: 'POST', headers: { Authorization: 'Bearer ' + jeton }, body: fd });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw Object.assign(new Error(j.erreur || ('HTTP ' + r.status)), { statut: r.status });
        LOG('retour envoyé', j.id);
        grille.hidden = true;
        compo.hidden = true;
        okEl.hidden = false;
        if (lecteur) lecteur.pause();
        if (br.audio && br.audio.url) URL.revokeObjectURL(br.audio.url);
        br = { humeur: null, audio: null, cible: null, declencheur: 'spontane', detail: null };
        ta.value = '';
        setTimeout(() => { try { okEl.querySelector('button').focus({ preventScroll: true }); } catch (e) {} }, 40);
        const minut = setTimeout(() => { if (ouvert && !okEl.hidden && onglet === 'avis') fermer(); }, 4000);
        nettoyages.push(() => clearTimeout(minut));
      } catch (e) {
        const s = e && e.statut;
        montrerErreur(
          s === 401 ? 'Ta session a expiré. Recharge la page, puis renvoie ton avis.'
          : s === 403 ? 'Les avis ne sont pas encore ouverts pour ton groupe.'
          : s === 413 ? 'La note vocale est trop longue : 2 minutes au maximum.'
          : s >= 500 ? 'Le service d\'avis ne répond pas. Ton message est gardé : réessaie dans un instant.'
          : 'Envoi impossible, la connexion semble coupée. Ton message est gardé : réessaie dans un instant.'
        );
        console.warn('[retours] envoi KO', e && e.message);
      } finally {
        envoiEnCours = false;
        btnEnv.disabled = false;
        btnEnv.textContent = 'Envoyer';
      }
    }

    /* ------------------------------------------------------------ mes retours */
    const ilya = (ts) => {
      const d = (Date.now() - new Date(ts).getTime()) / 1000;
      if (d < 60) return 'à l\'instant';
      if (d < 3600) return `il y a ${Math.floor(d / 60)} min`;
      if (d < 86400) return `il y a ${Math.floor(d / 3600)} h`;
      if (d < 172800) return 'hier';
      if (d < 7 * 86400) return `il y a ${Math.floor(d / 86400)} jours`;
      return new Date(ts).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' });
    };
    let chargement = null;
    async function chargerMesRetours() {
      if (chargement) return chargement;
      if (!liste.children.length) liste.innerHTML = '<div class="vide">Chargement…</div>';
      chargement = (async () => {
        try {
          const jeton = await Pz().jeton();
          const r = await fetch(endpoint() + '?a=mes-retours', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + jeton },
            body: JSON.stringify({ tenant_id: tenant.id }),
          });
          const j = await r.json().catch(() => ({}));
          if (!r.ok) throw new Error(j.erreur || ('HTTP ' + r.status));
          const items = Array.isArray(j.retours) ? j.retours : [];
          if (!items.length) {
            liste.innerHTML = '<div class="vide">Aucun avis envoyé pour l\'instant.<br>Le premier se donne en deux clics, depuis l\'onglet d\'à côté.</div>';
          } else {
            liste.innerHTML = items.map(it => {
              const h = HUM[it.humeur] || HUM.idee;
              return `<div class="it${it.non_lu ? ' nl' : ''}">
                <span class="ic" style="--c:${h.c};--f:${h.f}" title="${esc(h.label)}">${I[h.id]}</span>
                <div>
                  <p>${esc(it.extrait || h.label)}</p>
                  <div class="mt"><span>${esc(ilya(it.cree_le))}</span>${it.module ? `<span>${esc(libelleModule(it.module))}</span>` : ''}<span class="st ${esc(it.statut)}">${esc(STATUTS[it.statut] || it.statut)}</span></div>
                  ${it.reponse ? `<div class="rp"><em>Réponse de l'équipe One Data, ${esc(ilya(it.reponse_le))}</em>${esc(it.reponse)}</div>` : ''}
                </div>
              </div>`;
            }).join('');
          }
          majBadge(0);
          try { Pz().emettre('non_lus', 0); } catch (e) {}
        } catch (e) {
          liste.innerHTML = '<div class="vide">Impossible de charger tes avis pour le moment. Réessaie dans un instant.</div>';
          console.warn('[retours] mes-retours KO', e && e.message);
        } finally { chargement = null; }
      })();
      return chargement;
    }

    /* ------------------------------------------------------------ cartes (notice, sondage, signalement) */
    let carte = null;           // { type, minut }
    function afficherCarte(type, html, duree) {
      masquerCarte();
      carteEl.innerHTML = html;
      carteEl.classList.add('vu');
      carte = { type, minut: duree ? setTimeout(() => { if (carte && carte.type === type) masquerCarte(); }, duree) : null };
      if (type === 'sondage') try { Pz().sondageAffiche(true); } catch (e) {}
    }
    function masquerCarte() {
      if (!carte) return;
      clearTimeout(carte.minut);
      if (carte.type === 'sondage') try { Pz().sondageAffiche(false); } catch (e) {}
      carte = null;
      carteEl.classList.remove('vu');
    }
    nettoyages.push(masquerCarte);

    // Notice d'information — une fois par utilisateur et par navigateur
    let noticePlanifiee = false;
    const noticeVue = () => lireLS(cleUid('od_retours_notice')) === '1';
    function planifierNotice() {
      if (noticePlanifiee || noticeVue() || !utilisateur()) return;
      noticePlanifiee = true;
      const t = setTimeout(() => {
        noticePlanifiee = false;
        if (noticeVue() || !utilisateur() || ouvert || carte) return;
        afficherCarte('notice', `<h3>One Data s'améliore avec toi</h3>
          <p>Un bug, un écran pas clair, une idée ? Ton avis fait directement évoluer l'outil que tu utilises chaque jour. Chaque retour est lu, et la réponse arrive ici même.</p>
          <p>Deux clics suffisent : touche le O Oropra au bord de l'écran, choisis, envoie.</p>
          <div class="act"><button type="button" class="bt" data-a="notice-ok">Compris</button></div>`);
      }, 3500);
      nettoyages.push(() => clearTimeout(t));
    }

    // Signalement contextuel après une friction
    let dernierSignalement = 0;
    let signalementsSession = 0;
    function proposerSignalement(genre, d) {
      if (!utilisateur() || ouvert || pick || carte || !noticeVue()) return;
      const now = Date.now();
      if (now - dernierSignalement < 10 * 60000 || signalementsSession >= 3) return;
      dernierSignalement = now;
      signalementsSession++;
      const titre = genre === 'rage' ? 'Ça ne réagit pas ?' : 'Cet écran a eu un souci d\'affichage.';
      const texte = genre === 'rage'
        ? 'On dirait que cet endroit ne répond pas comme prévu. Le signaler prend un clic, tout le contexte est joint.'
        : 'Le signaler prend un clic, les détails techniques sont joints automatiquement.';
      afficherCarte('signalement', `<button type="button" class="x" data-a="carte-fermer" aria-label="Fermer">${I.x}</button>
        <h3>${titre}</h3><p>${texte}</p>
        <div class="act"><button type="button" class="bt" data-a="signaler">Le signaler</button><button type="button" class="bt sec" data-a="carte-fermer">Tout va bien</button></div>`, 12000);
      carte.donnees = { genre, d };
    }
    function accepterSignalement() {
      const s = carte && carte.donnees;
      masquerCarte();
      if (!s) return;
      reinitialiser();
      choisirHumeur('bug');
      br.declencheur = s.genre === 'rage' ? 'friction' : 'erreur';
      br.detail = s.genre === 'rage' ? 'clics répétés sans effet' : String((s.d && s.d.msg) || 'échec d\'affichage').slice(0, 240);
      if (s.d && (s.d.cible || s.d.module)) {
        br.cible = { module: s.d.module || null, libelle: s.d.libelle || null, selecteur: s.d.selecteur || null, cible: s.d.cible || null, rect: s.d.rect || null };
      }
      rendrePJ();
      ouvrir('avis');
    }

    // Micro-sondages
    const SKEY_SD = 'od_retours_sondages_vus';
    const sondagesVus = () => { try { return JSON.parse(sessionStorage.getItem(SKEY_SD) || '[]'); } catch (e) { return []; } };
    let sondageAttente = null;
    function recevoirSondage(s) {
      if (!s || !s.id || sondagesVus().includes(s.id)) return;
      if (carte && carte.type === 'sondage') return;
      sondageAttente = { s, recu: Date.now() };
    }
    minuter(() => {
      const a = sondageAttente;
      if (!a) return;
      if (Date.now() - a.recu > 20 * 60000) { sondageAttente = null; return; }
      if (!utilisateur() || ouvert || pick || carte || !noticeVue() || document.visibilityState !== 'visible') return;
      if (Date.now() - derniereActivite < 3000 || Date.now() - dernierePage < 15000) return;
      if (a.s.module) {
        let c = {}; try { c = Pz().contexte() || {}; } catch (e) {}
        if (!(c.modules_affiches || []).includes(a.s.module)) return;
      }
      if (a.s.page && !location.pathname.startsWith(a.s.page)) return;
      sondageAttente = null;
      try { sessionStorage.setItem(SKEY_SD, JSON.stringify([...sondagesVus(), a.s.id].slice(-20))); } catch (e) {}
      afficherSondage(a.s);
    }, 2000);

    function afficherSondage(s) {
      const corps = s.format === 'note'
        ? `<div class="po n5">${[1, 2, 3, 4, 5].map(n => `<button type="button" data-a="sd-val" data-v="${n}" aria-label="${n} sur 5">${n}</button>`).join('')}</div>
           <div class="l5"><span>Pas du tout</span><span>Excellent</span></div>`
        : `<div class="po"><button type="button" data-a="sd-val" data-v="1">${I.pouce}Oui</button><button type="button" class="bas" data-a="sd-val" data-v="-1">${I.pouce}Non</button></div>`;
      afficherCarte('sondage', `<button type="button" class="x" data-a="sd-passer" aria-label="Passer cette question">${I.x}</button>
        <h3>${esc(s.question)}</h3>${corps}
        <button type="button" class="lk" data-a="sd-passer">Passer</button>`);
      carte.donnees = { s, valeur: null };
    }
    async function repondreSondage(corps) {
      try {
        const jeton = await Pz().jeton();
        const r = await fetch(endpoint() + '?a=sondage', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: 'Bearer ' + jeton },
          body: JSON.stringify(Object.assign({ tenant_id: tenant.id }, corps)),
        });
        if (!r.ok) throw new Error('HTTP ' + r.status);
        return true;
      } catch (e) { console.warn('[retours] sondage KO', e && e.message); return false; }
    }
    function sondageValeur(v) {
      const d = carte && carte.donnees;
      if (!d) return;
      d.valeur = v;
      repondreSondage({ sondage_id: d.s.id, valeur: v });
      const negatif = d.s.format === 'note' ? v <= 3 : v < 0;
      if (negatif) {
        carteEl.innerHTML = `<button type="button" class="x" data-a="carte-fermer" aria-label="Fermer">${I.x}</button>
          <h3>${esc(d.s.relance || 'Qu\'est-ce qui pourrait être mieux ?')}</h3>
          <textarea rows="3" maxlength="1000" aria-label="Ta réponse" placeholder="En quelques mots…"></textarea>
          <div class="act"><button type="button" class="bt" data-a="sd-com">Envoyer</button><button type="button" class="bt sec" data-a="carte-fermer">Non merci</button></div>`;
        setTimeout(() => { try { carteEl.querySelector('textarea').focus({ preventScroll: true }); } catch (e) {} }, 40);
      } else {
        remercier();
      }
    }
    function remercier() {
      carteEl.innerHTML = '<h3 style="margin:0">Merci, c\'est noté.</h3>';
      const c = carte;
      if (c) { clearTimeout(c.minut); c.minut = setTimeout(() => { if (carte === c) masquerCarte(); }, 1800); }
    }

    /* ------------------------------------------------------------ délégation des clics */
    R.addEventListener('click', (e) => {
      const b = e.target.closest && e.target.closest('[data-a]');
      if (!b) return;
      const a = b.dataset.a;
      if (a === 'fermer') fermer();
      else if (a === 'onglet') choisirOnglet(b.dataset.o);
      else if (a === 'humeur') choisirHumeur(b.dataset.h);
      else if (a === 'micro') demarrerMicro();
      else if (a === 'rec-stop') arreterMicro(false);
      else if (a === 'rec-annuler') arreterMicro(true);
      else if (a === 'audio-lire') basculerLecture();
      else if (a === 'audio-suppr') { if (lecteur) lecteur.pause(); if (br.audio) URL.revokeObjectURL(br.audio.url); br.audio = null; rendrePJ(); }
      else if (a === 'montrer') demarrerPick();
      else if (a === 'cible-suppr') { br.cible = null; rendrePJ(); majEcran(); }
      else if (a === 'pk-annuler') finPick();
      else if (a === 'envoyer') envoyer();
      else if (a === 'nouveau') { reinitialiser(); setTimeout(() => { try { grille.querySelector('button').focus(); } catch (x) {} }, 20); }
      else if (a === 'notice-ok') { ecrireLS(cleUid('od_retours_notice'), '1'); masquerCarte(); }
      else if (a === 'carte-fermer') masquerCarte();
      else if (a === 'signaler') accepterSignalement();
      else if (a === 'sd-val') sondageValeur(Number(b.dataset.v));
      else if (a === 'sd-passer') {
        const d = carte && carte.donnees;
        if (d) repondreSondage({ sondage_id: d.s.id, ignore: true });
        masquerCarte();
      } else if (a === 'sd-com') {
        const d = carte && carte.donnees;
        const t = carteEl.querySelector('textarea');
        const txt = t ? t.value.trim() : '';
        if (d && txt) repondreSondage({ sondage_id: d.s.id, valeur: d.valeur, commentaire: txt });
        remercier();
      }
    });
    R.addEventListener('keydown', (e) => {
      if (e.key !== 'Escape') return;
      if (enr) { arreterMicro(true); return; }
      if (ouvert) { e.stopPropagation(); fermer(); }
      else if (carte) masquerCarte();
    });
    ecouter(document, 'keydown', (e) => { if (e.key === 'Escape' && ouvert && !pick) fermer(); });
    ecouter(document, 'pointerdown', (e) => {
      if (!ouvert || pick || enr) return;
      let dedans = false; try { dedans = e.composedPath().includes(hote); } catch (x) {}
      if (!dedans && !ta.value.trim() && !br.audio && !br.cible && !br.humeur) fermer({ sansFocus: true });
    }, { capture: true, passive: true });

    /* ------------------------------------------------------------ API */
    const api = {
      v: VERSION,
      ouvrir: (humeur) => { reinitialiser(); if (humeur && HUM[humeur]) choisirHumeur(humeur); ouvrir('avis'); },
      fermer: () => fermer(),
      mesRetours: () => ouvrir('mes'),
      nommer: (el) => nommerZone(el),     // diagnostic console : OD.retours.nommer($0)
      detruire() { nettoyages.splice(0).forEach(f => { try { f(); } catch (e) {} }); },
    };
    OD.retours = api;
    W.__OD_RETOURS__ = api;
    majVisibilite();
    LOG('prêt');
  },
});
