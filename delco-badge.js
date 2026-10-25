// ============================================================================
//  DELCO BADGE (header) — module One Data (OD.define)  v5
//  Ex-bloc on-app-load n°4. Module app-level : ancre masquée dans le header,
//  PERSISTANT. Il peint le badge #delco-header-badge rendu par la top nav.
//
//  v5 (25/10/2026) — silence quand le badge ne peut rien dire.
//  Une coupure réseau de vingt minutes, deux onglets en arrière-plan : le
//  badge interrogeait le serveur toutes les cinq minutes, chaque échec partait
//  en console.error, Pulse comptait une « Erreur JS » par échec. Et chaque
//  échec en provoquait un second : l'erreur réseau était prise pour une
//  fonction absente, et le badge retentait l'ancien comptage.
//    - pas de rafraîchissement périodique onglet masqué ou hors ligne ;
//    - au retour (onglet visible, connexion rétablie), un seul rafraîchissement
//      si le dernier date de plus d'une minute ;
//    - repli sur agent_signals_count UNIQUEMENT si la fonction par site est
//      absente du tenant (PGRST202), jamais sur une panne réseau ;
//    - un échec réseau est un avertissement, plus une erreur.
//
//  v4 (13/10/2026) — le badge suit le site choisi dans la barre du haut.
//  Un chef des ventes sur deux sites voyait 11 sujets sur la page Delco à
//  Arcueil, 11 à L'Haÿ, et 12 sur le badge (les deux sites réunis). Le badge
//  appelle désormais agent_signals_count_site(site du bus) — le serveur
//  n'applique le filtre que pour les profils dont la page filtre aussi
//  (chefs des ventes, rôles 3 et 5) — et se recalcule à chaque changement de
//  site. Tenant pas encore à jour : retour automatique à agent_signals_count.
// ============================================================================
// ====================================================================
//  Delco · Badge header — Custom JS
//  À placer dans un workflow "On app load" ou "On layout mounted".
//  Le HTML + CSS du badge doit être présent dans un Embed du layout.
//  Ce script s'occupe juste de polller la RPC et mettre à jour le badge.
// ====================================================================

OD.define('delco-badge', {
  async mount(__anchor, ctx) {
  const DELCO_PAGE_URL = "/fr/delco";       // À adapter à ta route Delco
  const REFRESH_MS = 5 * 60 * 1000;  // refresh toutes les 5 min
  const RETRY_MS = 2000;           // retry init toutes les 2s
  const RETOUR_MS = 60 * 1000;     // au retour, rafraîchir si le dernier a plus d'une minute

  // Hot reload : on nettoie les timers précédents s'il y en a
  if (window.__delcoBadge) {
    try { window.__delcoBadge.destroy && window.__delcoBadge.destroy(); } catch (_) { }
  }
  window.__delcoBadge = {};

  const doc = __anchor.ownerDocument || document;

  let intervalId = null;
  let authListener = null;
  let bootTimer = null;
  let isBooted = false;
  let clickBound = false;
  let dernierOk = 0;

  function horsLigne() {
    try { return (doc.defaultView && doc.defaultView.navigator.onLine === false) || navigator.onLine === false; }
    catch (_) { return false; }
  }
  function masque() { try { return doc.visibilityState === "hidden"; } catch (_) { return false; } }
  // La requête n'est jamais partie (Chrome / Firefox / Safari) : pas un défaut du code.
  function echecReseau(e) {
    const m = String((e && (e.message || e.details || e)) || "");
    return /Failed to fetch|NetworkError|Load failed|Network request failed|ERR_(INTERNET|NETWORK)/i.test(m);
  }
  // Fonction absente du tenant (ou signature différente) : seul cas qui
  // justifie le repli sur l'ancien comptage.
  function fonctionAbsente(e) {
    if (!e) return false;
    if (e.code === "PGRST202" || e.code === "42883") return true;
    return /Could not find the function|does not exist/i.test(String(e.message || ""));
  }

  function getSupabase() { return ctx.supabase; }   // client du tenant (socle)

  // v2 : site choisi dans la barre du haut (bus de site), null = tout le périmètre.
  function siteBus() {
    try { const w = window.wwLib && wwLib.getFrontWindow && wwLib.getFrontWindow(); if (w && w.oropraSite) return w.oropraSite; } catch (_) { }
    try { return (doc.defaultView && doc.defaultView.oropraSite) || window.oropraSite || null; } catch (_) { return null; }
  }
  function busSiteId() {
    try {
      const b = siteBus();
      const id = b && b.getSiteId ? b.getSiteId() : null;
      return id != null && !isNaN(Number(id)) ? Number(id) : null;
    } catch (_) { return null; }
  }
  // Un seul abonnement au bus, qui appelle toujours le fetch courant
  // (hot reload : pas de callback périmé).
  (function bindBus(tries) {
    const b = siteBus();
    if (!b || !b.onChange) { if (tries < 120) setTimeout(() => bindBus(tries + 1), 500); return; }
    if (window.__delcoBadgeBusBound) return;
    window.__delcoBadgeBusBound = true;
    try {
      b.onChange(() => {
        try { window.__delcoBadge && window.__delcoBadge.refresh && window.__delcoBadge.refresh(); } catch (_) { }
      });
    } catch (_) { }
  })(0);

  function getBadge() { return doc.getElementById("delco-header-badge"); }
  function getLink() { return doc.getElementById("delco-header-link"); }

  function applyState(totalUnread, hasUrgent) {
    const badge = getBadge();
    if (!badge) return;
    if (!totalUnread || totalUnread === 0) {
      badge.dataset.state = "idle";
      return;
    }
    badge.dataset.state = hasUrgent ? "urgent" : "warn";
    const numEl = badge.querySelector(".delco-header-badge-num");
    if (numEl) numEl.textContent = totalUnread > 99 ? "99+" : String(totalUnread);
  }

  function bindClickOnce() {
    if (clickBound) return;
    const link = getLink();
    if (!link) return;
    link.addEventListener("click", function (ev) {
      ev.preventDefault();
      if (typeof wwLib !== "undefined" && wwLib.goTo) {
        wwLib.goTo(DELCO_PAGE_URL);
      } else {
        doc.defaultView.location.href = DELCO_PAGE_URL;
      }
    });
    clickBound = true;
  }

  async function fetchAndApply() {
    // Si le DOM du badge n'est pas encore là, on attend
    if (!getBadge() || !getLink()) return false;
    bindClickOnce();

    const sb = getSupabase();
    if (!sb) return false;
    if (horsLigne()) return false;            // la requête ne partirait pas

    try {
      const { data: { session } } = await sb.auth.getSession();
      if (!session) return false;

      let { data, error } = await sb.rpc("agent_signals_count_site", { p_id_site: busSiteId() });
      if (error && fonctionAbsente(error)) {
        // Tenant sans agent_signals_count_site : ancien comptage, tous sites.
        ({ data, error } = await sb.rpc("agent_signals_count"));
      }
      if (error) {
        if (echecReseau(error)) console.warn("[delco-badge] réseau indisponible, badge inchangé");
        else console.error("[delco-badge] RPC:", error);
        return false;
      }
      const row = Array.isArray(data) ? data[0] : data;
      dernierOk = Date.now();
      if (!row) { applyState(0, false); return true; }
      applyState(Number(row.total_unread || 0), Boolean(row.has_urgent));
      return true;
    } catch (e) {
      if (echecReseau(e)) console.warn("[delco-badge] réseau indisponible, badge inchangé");
      else console.error("[delco-badge]", e);
      return false;
    }
  }

  // Tick périodique : rien quand personne ne regarde.
  function tick() {
    if (masque() || horsLigne()) return;
    fetchAndApply();
  }

  async function boot() {
    if (isBooted) return;
    const success = await fetchAndApply();
    if (success) {
      isBooted = true;
      console.log("[delco-badge] init OK");
      // Le boot a reussi : le filet n'a plus lieu d'etre.
      try { eteindreRelances(); } catch (_) { }
      if (bootTimer) { clearTimeout(bootTimer); bootTimer = null; }
      if (intervalId) clearInterval(intervalId);
      intervalId = setInterval(tick, REFRESH_MS);

      const sb = getSupabase();
      if (sb && !authListener) {
        const { data } = sb.auth.onAuthStateChange((event) => {
          if (event === "SIGNED_IN" || event === "TOKEN_REFRESHED") {
            fetchAndApply();
          } else if (event === "SIGNED_OUT") {
            applyState(0, false);
          }
        });
        authListener = data;
      }
      return;
    }
    // Retry indéfini toutes les 2s
    bootTimer = setTimeout(boot, RETRY_MS);
  }

  // Retour au premier plan ou connexion rétablie : un seul rafraîchissement,
  // et seulement si le dernier réussi a plus d'une minute.
  const auRetour = () => {
    if (masque() || horsLigne()) return;
    if (!isBooted) { if (!bootTimer) boot(); return; }
    if (Date.now() - dernierOk >= RETOUR_MS) fetchAndApply();
  };
  const onVisChange = auRetour;
  const win = doc.defaultView || window;
  doc.addEventListener("visibilitychange", onVisChange);
  win.addEventListener("online", auRetour);

  // Exposer un refresh public (utilisable par la page Delco après une action)
  window.__delcoBadge.refresh = function () {
    fetchAndApply();
  };

  // Cleanup pour hot reload
  window.__delcoBadge.destroy = function () {
    try {
      if (intervalId) clearInterval(intervalId);
      if (bootTimer) clearTimeout(bootTimer);
      if (kickTimers) kickTimers.forEach((t) => clearTimeout(t));
      doc.removeEventListener("visibilitychange", onVisChange);
      win.removeEventListener("online", auRetour);
    } catch (_) { }
  };

  // Filet de sécurité : on relance fetchAndApply à intervalles fixes sur les
  // 30 premières secondes, indépendamment du boot(). En prod, WeWeb met
  // parfois du temps à hydrater le DOM de l'Embed + la session Supabase ;
  // ces relances garantissent que le badge finit par s'afficher.
  const kickTimers = [];
  // Les huit relances s'arrêtent AU PREMIER SUCCÈS. Elles continuaient sinon
  // de requêter alors que le badge était déjà affiché : mesuré le 05/10/2026
  // sur un HAR de démarrage, neuf appels à agent_signals_count en quatorze
  // secondes, pour une fonction qui coûte 1 ms en base — tout était de
  // l'aller-retour, préflight CORS compris. Le filet garde son rôle (WeWeb met
  // parfois du temps à hydrater l'Embed et la session) ; il cesse simplement
  // de pêcher une fois le poisson pris.
  function eteindreRelances() {
    kickTimers.forEach((t) => { try { clearTimeout(t); } catch (_) { } });
    kickTimers.length = 0;
  }
  [500, 1500, 3000, 5000, 8000, 12000, 20000, 30000].forEach((delay) => {
    kickTimers.push(setTimeout(async () => {
      if (isBooted) return;                    // déjà servi : on ne redemande pas
      const ok = await fetchAndApply();
      if (ok) {
        isBooted = true;
        eteindreRelances();
        if (!intervalId) intervalId = setInterval(tick, REFRESH_MS);
      }
    }, delay));
  });

  // La pastille passe après l'affichage du tableau de bord et de l'agenda :

  // elle ne vaut pas une requête de plus pendant qu'ils chargent.

  if (typeof window.requestIdleCallback === 'function') {

    window.requestIdleCallback(function () { boot(); }, { timeout: 7000 });

  } else { setTimeout(boot, 4000); }
}
});
