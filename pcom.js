// PCOM — module One Data (OD.define) v3
/* ============================================================================
   P.COMMERCIALES — le suivi commercial d'un client.

   Refonte du 08/09/2026. Les versions précédentes listaient des DOCUMENTS ;
   celle-ci montre des AFFAIRES. C'est la seule unité qui ait un sens pour un
   vendeur : le client veut une voiture, pas sept papiers.

   Une affaire = une intention d'achat. Côté BACS, c'est l'opportunité avec ses
   simulations et ses commandes. Côté One Data, un document VO isolé forme une
   affaire à lui seul — même moule, aucun cas particulier.

   Ce que chaque carte raconte :
   - où on en est, et depuis combien de temps rien ne bouge ;
   - le montant qui ENGAGE : celui de la commande. Des propositions
     alternatives ne s'additionnent pas — sans commande, une affaire n'a pas
     un montant, elle a une fourchette ;
   - les versions explorées avec leur ÉCART DE PRIX, celle qui a été retenue,
     et celles que le client a refusées. C'est la mémoire de la négociation,
     qu'on perd aujourd'hui et qu'on redemande au client six mois plus tard.

   Au-delà de douze mois, les affaires closes passent dans une frise repliée :
   elles ne servent plus au suivi, seulement à l'historique. Une affaire encore
   en cours reste visible quel que soit son âge — c'est même le cas qui doit
   sauter aux yeux.

   RPC : get_propales_client(p_id_client, p_viewer_id_user)
   ============================================================================ */
OD.define('pcom', {
  mount(__anchor, ctx) {
    __anchor.id = 'pcom-root';
    const doc = __anchor.ownerDocument || document;

    const PC_VAR_CLIENT          = '55490583-c88b-4748-916e-4d203db07742';
    const PC_PAGE_PROPALE_UPDATE = 'efb6187d-2330-4392-86ed-bc5ad2489fed';
    const PC_VAR_ID_PROPALE      = 'aac565e9-ad32-4f81-bf8d-adb611322e62';
    const PC_PDF_EDGE_FN         = 'generate-document';
    const PC_TPL_PROPOSITION     = 'a8a39792-b795-4a07-92a2-8bd307ec105b';
    const PC_TPL_BON_COMMANDE    = 'a440bca0-e10a-4549-a11b-f4ad512b010d';
    const PC_PDF_BUCKET          = 'commercial-documents';
    const PC_BACS_BASE           = 'https://toyota-france.my.site.com/bacs2/s';
    const PC_MOIS_RECENTS        = 12;

    const S = { idClient: null, rows: null, loading: false, error: null, frise: false, morts: {}, ouv: {}, fVnVo: 'tous', fEtat: 'tous' };

    // ─── Utilitaires ───────────────────────────────────────────────────────
    const esc = (s) => (s == null ? '' : String(s))
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    const num = (v) => { const n = Number(v); return isNaN(n) ? null : n; };
    function eur(n) {
      const v = num(n); if (v == null) return '—';
      return new Intl.NumberFormat('fr-FR').format(Math.round(v)) + ' €';
    }
    function ecart(v) {
      const n = Math.round(v);
      if (n === 0) return 'même prix';
      return (n > 0 ? '+ ' : '− ') + new Intl.NumberFormat('fr-FR').format(Math.abs(n)) + ' €';
    }
    const dt = (d) => { const x = new Date(String(d || '').replace(' ', 'T')); return isNaN(x.getTime()) ? null : x; };
    function jour(d) {
      const x = dt(d); if (!x) return '—';
      return x.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
    }
    function moisAn(d) {
      const x = dt(d); if (!x) return 'Sans date';
      const s = x.toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' });
      return s.charAt(0).toUpperCase() + s.slice(1);
    }
    function depuis(d) {
      const x = dt(d); if (!x) return null;
      const j = Math.floor((Date.now() - x.getTime()) / 86400000);
      if (j <= 0) return null;
      if (j === 1) return 'hier';
      if (j < 31) return j + ' j sans mouvement';
      return Math.round(j / 30.4) + ' mois sans mouvement';
    }
    function getViewerId() {
      try {
        const row = ((wwLib.getFrontWindow && wwLib.getFrontWindow()) || window).oropraUser;
        return row && (row.ID_User != null ? Number(row.ID_User) : null);
      } catch (e) { return null; }
    }
    function getIdClient() {
      try {
        const v = wwLib.wwVariable.getValue(PC_VAR_CLIENT);
        if (v == null) return null;
        if (typeof v === 'object') return v.IDVu != null ? Number(v.IDVu) : null;
        return Number(v);
      } catch (e) { return null; }
    }
    const peutAgir = (d) => !!d.peut_agir;
    const LIB_STATUT = { draft: 'Simulation', propale: 'Proposition', bdc: 'Commande',
                         win: 'Vendu', lose: 'Abandonné' };
    function libStatut(d) {
      if (d.archived && d.status !== 'lose') return 'Archivé';
      return LIB_STATUT[d.status] || d.status || '—';
    }
    const mort = (d) => !!d.archived || d.status === 'lose';

    const I_PDF = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 18 15 15"/></svg>';
    const I_EDIT = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
    const I_CART = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="20" r="1.4"/><circle cx="18" cy="20" r="1.4"/><path d="M2 3h2.2l2.4 11.4a2 2 0 0 0 2 1.6h7.9a2 2 0 0 0 2-1.55L21 8H6"/></svg>';
    const I_X = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
    const I_TRASH = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6"/><path d="M10 11v6M14 11v6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>';
    const I_CHEV = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';
    const I_BACS = '<svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/><polyline points="15 3 21 3 21 9"/><line x1="10" y1="14" x2="21" y2="3"/></svg>';

    // ─── Construction des affaires ─────────────────────────────────────────
    function batirAffaires(rows) {
      const parCle = {}, ordre = [];
      rows.forEach(function (p) {
        const cle = p.id_affaire_bacs || ('od:' + p.id_propale_bdc);
        if (!parCle[cle]) { parCle[cle] = { cle: cle, affaire: p.id_affaire_bacs || null, docs: [] }; ordre.push(cle); }
        parCle[cle].docs.push(p);
      });

      return ordre.map(function (cle) {
        const a = parCle[cle];
        a.docs.sort(function (x, y) { return String(x.created_at).localeCompare(String(y.created_at)); });

        a.commandes = a.docs.filter(function (d) { return d.nature === 'commande' && !mort(d); });
        a.vendus    = a.docs.filter(function (d) { return d.status === 'win'; });
        a.vivants   = a.docs.filter(function (d) { return !mort(d); });

        a.ouverte = a.docs[0] && a.docs[0].created_at;
        a.maj = a.docs.reduce(function (m, d) {
          const v = d.updated_at || d.created_at;
          return (!m || String(v) > String(m)) ? v : m;
        }, null);
        a.vendeur = a.docs[0] && a.docs[0].vendeur;
        a.site = a.docs[0] && a.docs[0].site;
        a.vn_vo = String((a.docs[0] && a.docs[0].vn_vo) || '').toUpperCase();

        // Nommer l'affaire : libellé unique, sinon famille commune — cinq
        // finitions d'Aygo X restent une Aygo X —, sinon le plus représenté.
        const compte = function (champ) {
          const m = {};
          a.docs.forEach(function (d) { if (d[champ]) m[d[champ]] = (m[d[champ]] || 0) + 1; });
          return m;
        };
        const pv = compte('vehicule'), noms = Object.keys(pv);
        if (noms.length === 1) a.vehicule = noms[0];
        else if (!noms.length) a.vehicule = null;
        else {
          const fams = Object.keys(compte('famille')), marques = Object.keys(compte('marque'));
          if (fams.length === 1) a.vehicule = (marques.length === 1 ? marques[0] + ' ' : '') + fams[0];
          else a.vehicule = noms.reduce(function (b, n) { return pv[n] > pv[b] ? n : b; }, noms[0]);
        }

        if (a.vendus.length) a.etat = { cle: 'win', txt: 'vendue' };
        else if (a.commandes.length) a.etat = { cle: 'bdc', txt: a.commandes.length > 1 ? a.commandes.length + ' commandes' : 'commandée' };
        else if (!a.vivants.length) a.etat = { cle: 'lose', txt: 'abandonnée' };
        else a.etat = { cle: 'cours', txt: 'en cours' };

        const refs = a.vendus.length ? a.vendus : a.commandes;
        a.montant = refs.length ? refs.reduce(function (t, d) { return t + (num(d.montant_affiche) || 0); }, 0) : null;
        a.retenu = refs.length ? refs[0] : null;

        const prix = a.docs.map(function (d) { return num(d.montant_affiche); }).filter(function (v) { return v != null; });
        a.min = prix.length ? Math.min.apply(null, prix) : null;
        a.max = prix.length ? Math.max.apply(null, prix) : null;

        // Référence des écarts : la version retenue si elle existe, sinon la
        // moins chère — c'est à l'une ou à l'autre que le vendeur compare.
        a.base = a.retenu ? num(a.retenu.montant_affiche) : a.min;
        return a;
      }).sort(function (x, y) { return String(y.maj || '').localeCompare(String(x.maj || '')); });
    }

    // Une affaire encore ouverte ne vieillit jamais assez pour être rangée :
    // c'est justement celle qu'il faut voir.
    function recente(a) {
      if (a.etat.cle === 'cours') return true;
      const x = dt(a.maj); if (!x) return true;
      const limite = new Date(); limite.setMonth(limite.getMonth() - PC_MOIS_RECENTS);
      return x >= limite;
    }

    // ─── Styles ────────────────────────────────────────────────────────────
    function css() {
      return '<style>' +
'#pcom-root{font-family:inherit;color:#1f4a87}' +
'#pcom-root *{box-sizing:border-box}' +
'#pcom-root .flt{display:flex;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:10px}' +
'#pcom-root .flt .sep{width:1px;height:20px;background:#e3edf9;margin:0 4px}' +
'#pcom-root .chip{border:1.5px solid #e3edf9;background:#fff;color:#2a5ea9;border-radius:999px;padding:5px 13px;font:inherit;font-size:12px;font-weight:700;cursor:pointer;transition:.12s;display:inline-flex;align-items:center;justify-content:center;text-align:center;line-height:1.2}' +
'#pcom-root .chip:hover{border-color:#2a5ea9}' +
'#pcom-root .chip.on{background:#2a5ea9;color:#fff;border-color:#2a5ea9}' +
'#pcom-root .chip .n{opacity:.65;font-weight:700;margin-left:5px}' +
'#pcom-root .res{display:flex;gap:18px;flex-wrap:wrap;align-items:baseline;padding:0 2px 12px;font-size:12.5px;color:#7a98c5}' +
'#pcom-root .res b{font-size:15px;font-weight:800;color:#1f4a87}' +
'#pcom-root .liste{border:0.5px solid #e3edf9;border-radius:12px;overflow:hidden;background:#fff}' +
'#pcom-root .li{border-top:0.5px solid #eef4fb}#pcom-root .li:first-child{border-top:none}' +
'#pcom-root .ln{display:flex;align-items:center;gap:12px;padding:9px 12px;cursor:pointer;background:none;border:none;width:100%;text-align:left;font:inherit;border-left:3px solid transparent;color:inherit}' +
'#pcom-root .ln:hover{background:#f7faff}' +
'#pcom-root .li.vn .ln{border-left-color:#53bda7}#pcom-root .li.vo .ln{border-left-color:#fac055}' +
'#pcom-root .li.close .ln{background:#f9fbff}' +
'#pcom-root .ln .ph{width:52px;height:36px;flex:0 0 auto;border-radius:6px;background:#eef4fb;object-fit:contain;display:block}' +
'#pcom-root .ln .id{flex:1 1 40%;min-width:0;display:flex;flex-direction:column;gap:2px}' +
'#pcom-root .ln .veh{font-size:13.5px;font-weight:800;color:#1f4a87;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
'#pcom-root .ln .qui{font-size:11.5px;color:#9fb0c4;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;margin-top:1px}' +
'#pcom-root .ln .ctx{flex:1 1 30%;min-width:0;font-size:11.5px;color:#7a98c5;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
'#pcom-root .ln .ctx .froid{color:#8a6410;font-weight:700}' +
'#pcom-root .ln .chf{flex:0 0 auto;text-align:right;min-width:96px;display:flex;flex-direction:column;align-items:flex-end;gap:3px}' +
'#pcom-root .ln .mnt{font-size:14px;font-weight:800;color:#1f4a87;white-space:nowrap;line-height:1.15}' +
'#pcom-root .ln .frch{font-size:11.5px;color:#9fb0c4;white-space:nowrap}' +
'#pcom-root .ln .chev{flex:0 0 auto;color:#b5c8e0;transition:transform .15s;display:inline-flex}' +
'#pcom-root .li.ouv .ln .chev{transform:rotate(90deg)}' +
'#pcom-root .et{font-size:10.5px;font-weight:800;border-radius:5px;padding:2px 7px;white-space:nowrap;display:inline-block}' +
'#pcom-root .et.cours{background:#eaf1fb;color:#5a7ba8}' +
'#pcom-root .et.bdc{background:rgba(42,94,169,.14);color:#2a5ea9}' +
'#pcom-root .et.win{background:rgba(83,189,167,.22);color:#2c7a68}' +
'#pcom-root .et.lose{background:rgba(217,112,112,.16);color:#b23433}' +
'#pcom-root .det{padding:2px 12px 12px 67px;background:#f7faff}' +
'#pcom-root .vers{display:grid;grid-template-columns:repeat(auto-fill,minmax(118px,1fr));gap:7px}' +
'#pcom-root .v{border:0.5px solid #e3edf9;border-radius:9px;padding:7px;display:flex;flex-direction:column;gap:3px;min-width:0;background:#fff}' +
'#pcom-root .v.pris{border:1.5px solid #53bda7;padding:6.5px}' +
'#pcom-root .v.mort{opacity:.52}' +
'#pcom-root .v .phw{position:relative;display:block}' +
'#pcom-root .v .ph{width:100%;height:42px;border-radius:6px;background:#eef4fb;object-fit:contain;display:block}' +
'#pcom-root .v .stt{position:absolute;top:3px;left:3px;font-size:9.5px;font-weight:800;padding:1px 6px;border-radius:5px;background:rgba(255,255,255,.92);color:#5a7ba8;box-shadow:0 0 0 0.5px rgba(31,43,69,.10)}' +
'#pcom-root .v .stt.bdc{color:#2a5ea9}#pcom-root .v .stt.win{color:#2c7a68}#pcom-root .v .stt.lose{color:#b23433}' +
'#pcom-root .v .stt.propale{color:#8a6410}' +
'#pcom-root .v .coul{font-size:11.5px;font-weight:700;color:#1f4a87;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
'#pcom-root .v .prix{font-size:13px;font-weight:800;color:#1f4a87;line-height:1.15}' +
'#pcom-root .v .note{font-size:10.5px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
'#pcom-root .v .note.pris{color:#2c7a68}#pcom-root .v .note.mort{color:#b23433}' +
'#pcom-root .v .note.plus{color:#8a6410}#pcom-root .v .note.moins{color:#2c7a68}' +
'#pcom-root .v .note.egal{color:#9fb0c4}' +
'#pcom-root .v .barre{display:flex;gap:4px;flex-wrap:wrap;margin-top:2px}' +
'#pcom-root .b{width:24px;height:24px;flex:0 0 auto;border-radius:50%;border:1.5px solid #e3edf9;background:#fff;color:#2a5ea9;cursor:pointer;padding:0;display:inline-flex;align-items:center;justify-content:center;line-height:0;transition:.14s;text-decoration:none}' +
'#pcom-root .b svg{display:block}' +
'#pcom-root .b:hover{background:#2a5ea9;border-color:#2a5ea9;color:#fff}' +
'#pcom-root .b:disabled{opacity:.4;cursor:default;background:#fff;color:#2a5ea9}' +
'#pcom-root .b.cmd{color:#53bda7;border-color:#cfe8e0}' +
'#pcom-root .b.cmd:hover{background:#53bda7;border-color:#53bda7;color:#fff}' +
'#pcom-root .b.del{color:#d97070;border-color:#f0d6d6}' +
'#pcom-root .b.del:hover{background:#e24b4a;border-color:#e24b4a;color:#fff}' +
'#pcom-root .outils{display:flex;align-items:center;gap:10px;margin-bottom:8px;font-size:11.5px;color:#7a98c5}' +
'#pcom-root .plier{background:none;border:none;font:inherit;font-size:11.5px;font-weight:700;color:#b23433;cursor:pointer;padding:0;text-decoration:underline}' +
'#pcom-root .plier:hover{color:#b23433}' +
'#pcom-root .frise{margin-top:10px}' +
'#pcom-root .fbtn{width:100%;border:0.5px dashed #cfe0f2;background:#f7faff;border-radius:10px;padding:10px;font:inherit;font-size:12.5px;font-weight:700;color:#7a98c5;cursor:pointer;display:flex;align-items:center;justify-content:center;text-align:center}' +
'#pcom-root .fbtn:hover{border-color:#9fb0c4;color:#2a5ea9}' +
'#pcom-root .mois{font-size:11px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#9fb0c4;margin:14px 0 5px}' +
'#pcom-root .fl{display:flex;align-items:center;gap:11px;padding:7px 12px;border-left:2px solid #e3edf9;margin-left:6px}' +
'#pcom-root .fl .fveh{flex:1;min-width:0;font-size:12.5px;font-weight:700;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
'#pcom-root .fl .fdet{font-size:11px;color:#9fb0c4;white-space:nowrap}' +
'#pcom-root .fl .fmnt{font-size:12.5px;font-weight:800;white-space:nowrap}' +
'#pcom-root .vide{padding:30px;text-align:center;color:#9fb0c4;font-size:13px;border:0.5px dashed #e3edf9;border-radius:12px}' +
'#pcom-root .err{padding:12px 14px;border-radius:10px;background:rgba(217,112,112,.14);color:#b23433;font-size:13px}' +
'</style>';
    }

    // ─── Une version ───────────────────────────────────────────────────────
    function versionHtml(d, a) {
      const prix = num(d.montant_affiche);
      const estMort = mort(d);
      const pris = !!(a.retenu && d.id_propale_bdc === a.retenu.id_propale_bdc);

      let note = '', cls = '';
      if (pris) { note = d.nature === 'commande' ? 'commandée' : 'retenue'; cls = 'pris'; }
      else if (estMort) { note = d.motif_abandon ? 'abandonnée · ' + d.motif_abandon : 'abandonnée'; cls = 'mort'; }
      else if (d.nature === 'commande') { note = 'commande'; cls = 'pris'; }
      else if (prix != null && a.base != null && a.docs.length > 1) {
        const e = prix - a.base;
        note = ecart(e); cls = e > 0 ? 'plus' : (e < 0 ? 'moins' : 'egal');
      }

      const lib = (d.vehicule || '') + (d.couleur ? ' · ' + d.couleur : '');
      let actions = '';
      if (peutAgir(d) && !estMort && d.status !== 'win') {
        if (d.nature === 'simulation' && d.bacs_sf_id) {
          actions += '<button type="button" class="b cmd" data-cmd="' + d.id_propale_bdc +
                     '" data-sf="' + esc(d.bacs_sf_id) + '" data-lib="' + esc(lib) +
                     '" title="Passer en commande">' + I_CART + '</button>';
        }
        if (d.bacs_sf_id) {
          actions += '<button type="button" class="b del" data-abd="' + d.id_propale_bdc +
                     '" data-sf="' + esc(d.bacs_sf_id) + '" data-lib="' + esc(lib) +
                     '" title="Abandonner">' + I_X + '</button>';
        }
        if (d.status === 'propale' && d.vn_vo !== 'VN') {
          actions += '<button type="button" class="b" data-mod="' + d.id_propale_bdc +
                     '" title="Modifier">' + I_EDIT + '</button>';
        }
      }
      // PDF et lien BACS n'ont d'intérêt que sur ce qui compte : la version
      // retenue, ou un document seul. Les mettre partout noyait la carte.
      const enVue = pris || a.docs.length === 1;
      if (peutAgir(d) && enVue) {
        actions += '<button type="button" class="b" data-pdf="' + d.id_propale_bdc + ':' + esc(d.status) +
                   '" data-maj="' + esc(d.updated_at || '') + '" title="Document PDF">' + I_PDF + '</button>';
      }
      if (d.bacs_sf_id && enVue) {
        actions += '<a class="b" href="' + PC_BACS_BASE + '/detail/' + esc(d.bacs_sf_id) +
                   '" target="_blank" rel="noopener" title="Ouvrir dans BACS">' + I_BACS + '</a>';
      }

      const img = '<span class="phw">' +
        (d.photo
          ? '<img class="ph" src="' + esc(d.photo) + '" alt="" onerror="this.style.visibility=\'hidden\'">'
          : '<span class="ph"></span>') +
        '<span class="stt ' + esc(d.status || '') + '">' + esc(libStatut(d)) + '</span>' +
      '</span>';

      return '<div class="v' + (pris ? ' pris' : '') + (estMort ? ' mort' : '') + '">' +
        img +
        '<span class="coul" title="' + esc(lib) + '">' + esc(d.couleur || d.vehicule || '—') + '</span>' +
        '<span class="prix">' + eur(prix) + '</span>' +
        (note ? '<span class="note ' + cls + '" title="' + esc(note) + '">' + esc(note) + '</span>' : '') +
        (actions ? '<span class="barre">' + actions + '</span>' : '') +
      '</div>';
    }

    // ─── Une affaire, en une ligne ─────────────────────────────────────────
    // Une ligne par affaire, dépliable. La ligne suffit au balayage : véhicule,
    // qui et où, ce qui reste à faire, combien, où on en est. Le comparateur de
    // versions — l'apport de cet écran — ne s'ouvre que si on le demande.
    function affaireHtml(a) {
      const abandonnees = a.docs.filter(function (d) {
        return mort(d) && !(a.retenu && d.id_propale_bdc === a.retenu.id_propale_bdc);
      });
      const deplie = !!S.morts[a.cle];
      const visibles = deplie ? a.docs : a.docs.filter(function (d) { return abandonnees.indexOf(d) === -1; });
      const ouvert = !!S.ouv[a.cle];

      const jetable = !!a.affaire && a.vivants.length > 0 && !a.commandes.length
        && !a.vendus.length && a.vivants.every(peutAgir);

      // La vignette de la ligne : la version retenue, sinon la plus récente
      // qui ait une photo.
      const vedette = a.retenu || a.docs.filter(function (d) { return d.photo; }).pop() || a.docs[a.docs.length - 1];
      const img = (vedette && vedette.photo)
        ? '<img class="ph" src="' + esc(vedette.photo) + '" alt="" onerror="this.style.visibility=\'hidden\'">'
        : '<span class="ph"></span>';

      // Le contexte : ce qui aide à décider, pas ce qui décrit.
      const ctx = [];
      const nSim = a.docs.filter(function (d) { return d.nature === 'simulation'; }).length;
      if (a.docs.length > 1) ctx.push(a.docs.length + ' documents');
      if (nSim > 1) ctx.push(nSim + ' versions');
      if (a.min != null && a.max != null && a.max > a.min) ctx.push(eur(a.min) + ' – ' + eur(a.max));
      const froid = (a.etat.cle === 'cours') ? depuis(a.maj) : null;

      return '<div class="li ' + (a.vn_vo === 'VN' ? 'vn' : (a.vn_vo === 'VO' ? 'vo' : '')) +
             ((a.etat.cle === 'lose' || a.etat.cle === 'win') ? ' close' : '') + (ouvert ? ' ouv' : '') + '">' +
        '<button type="button" class="ln" data-ouv="' + esc(a.cle) + '">' +
          img +
          '<span class="id">' +
            '<span class="veh">' + esc(a.vehicule || 'Affaire sans véhicule') + '</span>' +
            '<span class="qui">' + [a.vendeur, a.site, jour(a.ouverte)].filter(Boolean).map(esc).join(' · ') + '</span>' +
          '</span>' +
          '<span class="ctx">' + ctx.map(esc).join(' · ') +
            (froid ? (ctx.length ? ' · ' : '') + '<span class="froid">' + esc(froid) + '</span>' : '') +
          '</span>' +
          '<span class="chf">' +
            (a.montant != null
              ? '<span class="mnt">' + eur(a.montant) + '</span>'
              : (a.min != null ? '<span class="frch">dès ' + eur(a.min) + '</span>' : '')) +
            '<span class="et ' + a.etat.cle + '">' + esc(a.etat.txt) + '</span>' +
          '</span>' +
          '<span class="chev">' + I_CHEV + '</span>' +
        '</button>' +
        (ouvert
          ? '<div class="det">' +
              '<div class="outils">' +
                (abandonnees.length
                  ? '<button type="button" class="plier" data-morts="' + esc(a.cle) + '">' +
                    (deplie ? 'masquer les abandons' : abandonnees.length + ' abandonnée' + (abandonnees.length > 1 ? 's' : '')) +
                    '</button>'
                  : '') +
                '<span style="flex:1"></span>' +
                (jetable
                  ? '<button type="button" class="b del" data-abaff="' + esc(a.affaire) +
                    '" data-id="' + a.docs[0].id_propale_bdc + '" data-lib="' + esc(a.vehicule || '') +
                    '" title="Abandonner l\'affaire">' + I_TRASH + '</button>'
                  : '') +
              '</div>' +
              '<div class="vers">' + visibles.map(function (d) { return versionHtml(d, a); }).join('') + '</div>' +
            '</div>'
          : '') +
      '</div>';
    }

    // ─── La frise ──────────────────────────────────────────────────────────
    function friseHtml(anciennes) {
      if (!anciennes.length) return '';
      const titre = S.frise
        ? "Replier l'historique"
        : "Voir l'historique — " + anciennes.length + ' affaire' + (anciennes.length > 1 ? 's' : '') +
          ' de plus de ' + PC_MOIS_RECENTS + ' mois';
      let html = '<div class="frise"><button type="button" class="fbtn" data-frise>' + titre + '</button>';
      if (S.frise) {
        let mois = null;
        anciennes.forEach(function (a) {
          const m = moisAn(a.maj);
          if (m !== mois) { mois = m; html += '<p class="mois">' + esc(m) + '</p>'; }
          const det = [a.vehicule ? null : null, a.docs.length + ' doc' + (a.docs.length > 1 ? 's' : ''), a.vendeur]
            .filter(Boolean).join(' · ');
          html += '<div class="fl">' +
            '<span class="et ' + a.etat.cle + '">' + esc(a.etat.txt) + '</span>' +
            '<span class="fveh">' + esc(a.vehicule || '—') + '</span>' +
            '<span class="fdet">' + esc(det) + '</span>' +
            '<span class="fmnt">' + (a.montant != null ? eur(a.montant) : (a.min != null ? eur(a.min) : '—')) + '</span>' +
          '</div>';
        });
      }
      return html + '</div>';
    }

    function PC_render() {
      const root = doc.getElementById('pcom-root'); if (!root) return;
      if (S.loading && !S.rows) { root.innerHTML = css() + '<div class="vide">Chargement…</div>'; return; }
      if (S.error) { root.innerHTML = css() + '<div class="err">' + esc(S.error) + '</div>'; return; }

      const affaires = batirAffaires(S.rows || []);
      if (!affaires.length) {
        root.innerHTML = css() + '<div class="vide">Aucune affaire commerciale pour ce client.</div>';
        return;
      }
      // Filtres : la nature du véhicule et l'état de l'affaire. Ils portent sur
      // les affaires, pas sur les documents — c'est l'affaire qui est l'objet.
      const cadre = affaires.filter(function (a) {
        return (S.fVnVo === 'tous' || a.vn_vo === S.fVnVo)
            && (S.fEtat === 'tous' || a.etat.cle === S.fEtat);
      });
      const compteVnVo = function (v) {
        return affaires.filter(function (a) { return v === 'tous' || a.vn_vo === v; }).length;
      };
      const compteEtat = function (v) {
        return affaires.filter(function (a) {
          return (S.fVnVo === 'tous' || a.vn_vo === S.fVnVo) && (v === 'tous' || a.etat.cle === v);
        }).length;
      };
      const puce = function (attr, val, txt, n) {
        return '<button type="button" class="chip' + ((attr === 'vnvo' ? S.fVnVo : S.fEtat) === val ? ' on' : '') +
               '" data-f' + attr + '="' + val + '">' + esc(txt) +
               (n != null ? '<span class="n">' + n + '</span>' : '') + '</button>';
      };
      const filtres = '<div class="flt">' +
        puce('vnvo', 'tous', 'Tous') + puce('vnvo', 'VN', 'VN', compteVnVo('VN')) + puce('vnvo', 'VO', 'VO', compteVnVo('VO')) +
        '<span class="sep"></span>' +
        puce('etat', 'tous', 'Toutes') +
        puce('etat', 'cours', 'En cours', compteEtat('cours')) +
        puce('etat', 'bdc', 'Commandées', compteEtat('bdc')) +
        puce('etat', 'win', 'Vendues', compteEtat('win')) +
        puce('etat', 'lose', 'Abandonnées', compteEtat('lose')) +
      '</div>';

      const recentes = cadre.filter(recente);
      const anciennes = cadre.filter(function (a) { return !recente(a); });

      // Bandeau de synthèse : ce qu'un vendeur veut savoir avant de lire le
      // détail — combien d'affaires vivantes, combien elles engagent, et la
      // plus figée d'entre elles.
      const enCours = cadre.filter(function (a) { return a.etat.cle === 'cours'; });
      const engage = cadre.reduce(function (t, a) {
        return t + ((a.etat.cle === 'bdc' || a.etat.cle === 'win') ? (a.montant || 0) : 0);
      }, 0);
      const dormante = enCours.reduce(function (p, a) {
        return (!p || String(a.maj || '') < String(p.maj || '')) ? a : p;
      }, null);
      const res = '<div class="res">' +
        '<span><b>' + cadre.length + '</b> affaire' + (cadre.length > 1 ? 's' : '') + '</span>' +
        (enCours.length ? '<span><b>' + enCours.length + '</b> en cours</span>' : '') +
        (engage ? '<span><b>' + eur(engage) + '</b> engagés</span>' : '') +
        (dormante && depuis(dormante.maj)
          ? '<span>plus ancienne sans mouvement : <b>' + esc(dormante.vehicule || '—') + '</b>, ' +
            esc(depuis(dormante.maj)) + '</span>'
          : '') +
      '</div>';

      root.innerHTML = css() + filtres + res +
        (cadre.length ? '' : '<div class="vide">Aucune affaire ne correspond à ce filtre.</div>') +
        '<div class="liste">' + recentes.map(affaireHtml).join('') + '</div>' +
        friseHtml(anciennes);
    }

    // ─── Chargement ────────────────────────────────────────────────────────
    async function PC_load() {
      const id = getIdClient();
      if (id == null) { S.error = 'Client introuvable.'; PC_render(); return; }
      S.idClient = id; S.loading = true; S.error = null; PC_render();
      try {
        const { data, error } = await ctx.supabase
          .rpc('get_propales_client', { p_id_client: id, p_viewer_id_user: getViewerId() });
        if (error) throw error;
        S.rows = Array.isArray(data) ? data : [];
      } catch (e) {
        console.error('[pcom] chargement', e);
        S.error = 'Chargement impossible : ' + ((e && e.message) ? e.message : e);
      } finally { S.loading = false; PC_render(); }
    }

    function PC_modif(idPropale) {
      try { wwLib.wwVariable.updateValue(PC_VAR_ID_PROPALE, idPropale); } catch (e) {}
      try { wwLib.wwApp.goTo(PC_PAGE_PROPALE_UPDATE); } catch (e) {}
    }

    // PDF : un document figé est servi depuis le cache tant qu'il est plus
    // récent que la dernière modification ; une proposition est régénérée.
    async function PC_pdf(idPropale, status, majIso) {
      const supabase = ctx.supabase;
      const isPropale = (status === 'propale' || status === 'draft');
      const type = isPropale ? 'proposition_commerciale' : 'bon_de_commande';
      const templateId = isPropale ? PC_TPL_PROPOSITION : PC_TPL_BON_COMMANDE;
      const btn = doc.querySelector('[data-pdf="' + idPropale + ':' + status + '"]');
      if (btn) btn.disabled = true;
      const open = (url) => { try { wwLib.getFrontWindow().open(url, '_blank'); } catch (e) { window.open(url, '_blank'); } };
      try {
        const { data: docs, error: qErr } = await supabase
          .from('generated_documents').select('storage_path, ready_at')
          .eq('id_propale_bdc', idPropale).eq('type', type).eq('status', 'ready')
          .order('ready_at', { ascending: false }).limit(1);
        if (qErr) throw qErr;
        if (docs && docs.length && docs[0].storage_path) {
          const pdfTime = docs[0].ready_at ? new Date(docs[0].ready_at).getTime() : 0;
          const majTime = majIso ? new Date(String(majIso).replace(' ', 'T')).getTime() : 0;
          if (pdfTime >= majTime) {
            const { data: signed, error: sErr } = await supabase.storage
              .from(PC_PDF_BUCKET).createSignedUrl(docs[0].storage_path, 3600);
            if (!sErr && signed && signed.signedUrl) { open(signed.signedUrl); return; }
          }
        }
        const { data: gen, error: gErr } = await supabase.functions.invoke(PC_PDF_EDGE_FN, {
          body: { id_propale_bdc: idPropale, template_id: templateId, type: type }
        });
        if (gErr) throw gErr;
        if (gen && gen.ok && gen.signed_url) open(gen.signed_url);
        else throw new Error(gen && gen.error ? gen.error : 'Génération PDF échouée');
      } catch (e) {
        console.error('[pcom] pdf', e);
        toast('Impossible de générer le PDF : ' + ((e && e.message) ? e.message : e), true);
      } finally { if (btn) btn.disabled = false; }
    }

    // ─── Gestes BACS ───────────────────────────────────────────────────────
    // Ils vivent dans le socle (OD.bacs) : une seule implémentation pour le
    // kanban et pour cette page. Ce sont des écritures irréversibles chez le
    // constructeur ; les avoir en double, c'était accepter qu'un correctif
    // n'aille qu'à un endroit.
    function toast(msg, err) {
      const t = doc.createElement('div');
      t.style.cssText = 'position:fixed;left:50%;bottom:26px;transform:translateX(-50%);z-index:3000;' +
        'padding:12px 18px;border-radius:11px;font:inherit;font-size:13px;font-weight:600;color:#fff;' +
        'box-shadow:0 10px 30px rgba(31,74,133,.28);max-width:min(560px,92vw);' +
        'background:' + (err ? '#8d4a55' : '#2a5ea9');
      t.textContent = msg;
      doc.body.appendChild(t);
      setTimeout(function () { try { t.remove(); } catch (e) {} }, err ? 7000 : 3500);
    }

    function gestes() {
      const g = window.OD && window.OD.bacs;
      if (!g) { toast("Les gestes BACS ne sont pas disponibles : rechargez la page.", true); return null; }
      return g;
    }

    async function abandonnerAffaire(affaire, idPropale, libelle) {
      const g = gestes(); if (!g) return;
      const r = await g.abandonnerAffaire({ affaire: affaire, idPropale: idPropale, libelle: libelle, toast: toast });
      if (r && r.ok) await PC_load();
    }

    async function abandonnerDocument(idPropale, sfId, libelle) {
      const g = gestes(); if (!g) return;
      const r = await g.abandonnerDocument({ idPropale: idPropale, sfId: sfId, libelle: libelle, toast: toast });
      if (r && r.ok) await PC_load();
    }

    async function convertirEnCommande(idPropale, sfId, libelle) {
      const g = gestes(); if (!g) return;
      const r = await g.convertir({ idPropale: idPropale, sfId: sfId, libelle: libelle, toast: toast });
      if (r && r.ok) await PC_load();
    }

    // ─── Routeur ───────────────────────────────────────────────────────────
    function PC_route(e) {
      if (!e.target.closest('#pcom-root')) return;
      const f = e.target.closest('[data-frise]');
      if (f) { S.frise = !S.frise; PC_render(); return; }
      const fv = e.target.closest('[data-fvnvo]');
      if (fv) { S.fVnVo = fv.getAttribute('data-fvnvo'); PC_render(); return; }
      const fe = e.target.closest('[data-fetat]');
      if (fe) { S.fEtat = fe.getAttribute('data-fetat'); PC_render(); return; }
      const ou = e.target.closest('[data-ouv]');
      if (ou) { const k = ou.getAttribute('data-ouv'); S.ouv[k] = !S.ouv[k]; PC_render(); return; }
      const mo = e.target.closest('[data-morts]');
      if (mo) { const k = mo.getAttribute('data-morts'); S.morts[k] = !S.morts[k]; PC_render(); return; }
      const c = e.target.closest('[data-cmd]');
      if (c) { convertirEnCommande(Number(c.getAttribute('data-cmd')), c.getAttribute('data-sf'), c.getAttribute('data-lib') || ''); return; }
      const ad = e.target.closest('[data-abd]');
      if (ad) { abandonnerDocument(Number(ad.getAttribute('data-abd')), ad.getAttribute('data-sf'), ad.getAttribute('data-lib') || ''); return; }
      const aa = e.target.closest('[data-abaff]');
      if (aa) { abandonnerAffaire(aa.getAttribute('data-abaff'), Number(aa.getAttribute('data-id')), aa.getAttribute('data-lib') || ''); return; }
      const md = e.target.closest('[data-mod]');
      if (md) { PC_modif(Number(md.getAttribute('data-mod'))); return; }
      const pd = e.target.closest('[data-pdf]');
      if (pd) {
        const parts = pd.getAttribute('data-pdf').split(':');
        PC_pdf(Number(parts[0]), parts[1], pd.getAttribute('data-maj') || null);
      }
    }

    if (window.__pcomClickHandler) doc.removeEventListener('click', window.__pcomClickHandler, true);
    window.__pcomClickHandler = PC_route;
    doc.addEventListener('click', PC_route, true);

    // La variable WeWeb du client n'est pas toujours prête au montage.
    let essais = 0;
    (function boot() {
      if (getIdClient() != null) { PC_load(); return; }
      if (essais++ < 30) { setTimeout(boot, 150); return; }
      PC_load();
    })();

    window.__pcomReload = function () { PC_load(); };

    return {
      destroy() {
        try { doc.removeEventListener('click', PC_route, true); } catch (e) {}
        if (window.__pcomClickHandler === PC_route) window.__pcomClickHandler = null;
        if (window.__pcomReload) window.__pcomReload = null;
      }
    };
  }
});
