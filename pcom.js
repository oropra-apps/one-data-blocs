// PCOM — module One Data (OD.define) v2
/* ============================================================================
   P.COMMERCIALES — documents commerciaux d'un client, dans sa fiche.

   Réécrit le 08/09/2026 pour accueillir ce qui vient de BACS. La version
   précédente listait les documents à plat, excluait les brouillons — donc
   TOUTES les simulations BACS — et n'affichait du véhicule que son VIN, qu'un
   VN n'a pas encore.

   Ce que le module montre désormais :
   - un bloc par OPPORTUNITÉ BACS, avec ses simulations et ses commandes ;
     un document sans opportunité (VO saisi dans One Data) garde sa ligne ;
   - trois sections : en cours, conclu, et l'historique des abandons, replié ;
   - le véhicule et sa couleur, le montant APRÈS remise, comme le kanban.

   RPC : get_propales_client(p_id_client, p_viewer_id_user)
   ============================================================================ */
OD.define('pcom', {
  mount(__anchor, ctx) {
    __anchor.id = 'pcom-root';
    const doc = __anchor.ownerDocument || document;

    // ─── Constantes ────────────────────────────────────────────────────────
    const PC_VAR_CLIENT          = '55490583-c88b-4748-916e-4d203db07742';
    const PC_PAGE_PROPALE_UPDATE = 'efb6187d-2330-4392-86ed-bc5ad2489fed';
    const PC_VAR_ID_PROPALE      = 'aac565e9-ad32-4f81-bf8d-adb611322e62';
    const PC_PDF_EDGE_FN         = 'generate-document';
    const PC_TPL_PROPOSITION     = 'a8a39792-b795-4a07-92a2-8bd307ec105b';
    const PC_TPL_BON_COMMANDE    = 'a440bca0-e10a-4549-a11b-f4ad512b010d';
    const PC_PDF_BUCKET          = 'commercial-documents';
    // Lien vers BACS : ouvre l'opportunité ou le document chez le constructeur.
    const PC_BACS_BASE           = 'https://toyota-france.my.site.com/bacs2/s';

    const S = {
      idClient: null, rows: null, loading: false, error: null,
      fVnVo: 'tous',          // tous | VN | VO
      histoire: false,        // l'historique est replié par défaut
      ouverts: {}             // opportunités dépliées
    };

    // ─── Helpers ───────────────────────────────────────────────────────────
    const esc = (s) => (s == null ? '' : String(s))
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
    function eur(n) {
      if (n == null || n === '') return '—';
      const v = Number(n); if (isNaN(v)) return '—';
      return new Intl.NumberFormat('fr-FR').format(Math.round(v)) + ' €';
    }
    function fmtDate(d) {
      if (!d) return '—';
      const dt = new Date(String(d).replace(' ', 'T'));
      if (isNaN(dt.getTime())) return '—';
      return String(dt.getDate()).padStart(2, '0') + '/' +
             String(dt.getMonth() + 1).padStart(2, '0') + '/' + dt.getFullYear();
    }
    function getViewerId() {
      try {
        const row = ((wwLib.getFrontWindow && wwLib.getFrontWindow()) || window).oropraUser;
        return row && (row.ID_User != null ? Number(row.ID_User) : null);
      } catch (e) { console.error('[pcom] viewer', e); return null; }
    }
    function getIdClient() {
      try {
        const v = wwLib.wwVariable.getValue(PC_VAR_CLIENT);
        if (v == null) return null;
        if (typeof v === 'object') return v.IDVu != null ? Number(v.IDVu) : null;
        return Number(v);
      } catch (e) { console.error('[pcom] client', e); return null; }
    }

    // ─── Vocabulaire d'affichage ───────────────────────────────────────────
    // Une simulation BACS est un « brouillon » côté base ; c'est le mot du
    // constructeur qui parle au vendeur, pas celui du schéma.
    const LIB_STATUT = {
      draft:   { txt: 'Simulation', cls: 'gris' },
      propale: { txt: 'Proposition', cls: 'bleu' },
      bdc:     { txt: 'Commande',    cls: 'indigo' },
      win:     { txt: 'Vendu',       cls: 'vert' },
      lose:    { txt: 'Abandonné',   cls: 'rouge' }
    };
    function badgeStatut(p) {
      const l = LIB_STATUT[p.status] || { txt: p.status || '—', cls: 'gris' };
      return '<span class="pc-b ' + l.cls + '">' + esc(l.txt) + '</span>';
    }
    function libNature(p) {
      if (p.nature === 'commande') return 'Commande';
      if (p.nature === 'simulation') return 'Simulation';
      return (p.vn_vo === 'VO') ? 'Proposition VO' : 'Proposition';
    }

    // ─── Répartition en sections ───────────────────────────────────────────
    // L'abandon prime sur le statut : un document archivé appartient à
    // l'historique, quel que soit l'état où il a été laissé.
    function section(p) {
      if (p.archived || p.status === 'lose') return 'histoire';
      if (p.status === 'win') return 'conclu';
      return 'cours';
    }

    // ─── Regroupement par opportunité ──────────────────────────────────────
    // Une opportunité BACS peut porter plusieurs simulations ET plusieurs
    // commandes. On la présente comme un bloc ; ce qui n'en vient pas — un VO
    // saisi dans One Data — reste une ligne à part entière.
    function grouper(rows) {
      const blocs = [], parAffaire = {};
      rows.forEach(function (p) {
        if (!p.id_affaire_bacs) { blocs.push({ seul: true, docs: [p] }); return; }
        let b = parAffaire[p.id_affaire_bacs];
        if (!b) {
          b = { seul: false, affaire: p.id_affaire_bacs, docs: [] };
          parAffaire[p.id_affaire_bacs] = b; blocs.push(b);
        }
        b.docs.push(p);
      });
      blocs.forEach(function (b) {
        b.docs.sort(function (x, y) { return String(y.created_at).localeCompare(String(x.created_at)); });
        b.maj = b.docs[0] && b.docs[0].created_at;
        b.nbSim = b.docs.filter(function (d) { return d.nature === 'simulation'; }).length;
        b.nbCmd = b.docs.filter(function (d) { return d.nature === 'commande'; }).length;
        // Le montant d'un bloc n'a de sens que pour des ventes réelles : on
        // somme les commandes, jamais des propositions alternatives.
        b.montant = b.nbCmd ? b.docs.filter(function (d) { return d.nature === 'commande'; })
                                    .reduce(function (t, d) { return t + (Number(d.montant_affiche) || 0); }, 0)
                            : null;
        const vehs = {};
        b.docs.forEach(function (d) { if (d.vehicule) vehs[d.vehicule] = 1; });
        const noms = Object.keys(vehs);
        b.vehicule = noms.length === 1 ? noms[0] : (noms.length ? 'Plusieurs modèles' : null);
        b.site = b.docs[0] && b.docs[0].site;
        b.vendeur = b.docs[0] && b.docs[0].vendeur;
      });
      blocs.sort(function (x, y) { return String(y.maj || '').localeCompare(String(x.maj || '')); });
      return blocs;
    }

    // ─── Rendu ─────────────────────────────────────────────────────────────
    function css() {
      return '<style>' +
'#pcom-root{font-family:inherit;color:#1f2b45}' +
'#pcom-root .pc-bar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:14px}' +
'#pcom-root .pc-chip{border:1.5px solid #e3edf9;background:#fff;color:#2a5ea9;border-radius:999px;padding:6px 14px;font:inherit;font-size:13px;font-weight:600;cursor:pointer}' +
'#pcom-root .pc-chip.on{background:#2a5ea9;color:#fff;border-color:#2a5ea9}' +
'#pcom-root .pc-sec{margin:0 0 22px}' +
'#pcom-root .pc-sect{font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;color:#7a98c5;margin:0 0 9px}' +
'#pcom-root .pc-bloc{border:1px solid #e8eef7;border-radius:13px;background:#fff;margin-bottom:10px;overflow:hidden}' +
'#pcom-root .pc-bloc.hist{opacity:.72}' +
'#pcom-root .pc-tete{display:flex;align-items:center;gap:12px;padding:12px 14px;cursor:pointer;background:#f7fafd}' +
'#pcom-root .pc-tete .veh{font-weight:700;flex:1;min-width:0}' +
'#pcom-root .pc-tete .cpt{font-size:12px;color:#7a98c5}' +
'#pcom-root .pc-tete .mnt{font-weight:800}' +
'#pcom-root .pc-doc{display:flex;align-items:center;gap:12px;padding:11px 14px;border-top:1px solid #f0f4fa}' +
'#pcom-root .pc-doc .col{min-width:0}' +
'#pcom-root .pc-doc .nat{font-weight:700;font-size:13px}' +
'#pcom-root .pc-doc .det{font-size:12px;color:#7a98c5;margin-top:2px}' +
'#pcom-root .pc-doc .grow{flex:1;min-width:0}' +
'#pcom-root .pc-doc .num{font-weight:800;white-space:nowrap}' +
'#pcom-root .pc-b{display:inline-block;font-size:11px;font-weight:800;padding:3px 9px;border-radius:999px;white-space:nowrap}' +
'#pcom-root .pc-b.gris{background:#eef2f7;color:#5a6b85}' +
'#pcom-root .pc-b.bleu{background:#e7f0fc;color:#2a5ea9}' +
'#pcom-root .pc-b.indigo{background:#e6e9fb;color:#3b45a8}' +
'#pcom-root .pc-b.vert{background:#e3f5ef;color:#1c8367}' +
'#pcom-root .pc-b.rouge{background:#fdeaea;color:#b3403f}' +
'#pcom-root .pc-ic{width:32px;height:32px;border:1.5px solid #e3edf9;border-radius:9px;background:#fff;color:#2a5ea9;cursor:pointer;font:inherit;font-size:13px;font-weight:700}' +
'#pcom-root .pc-ic:disabled{opacity:.45;cursor:default}' +
'#pcom-root .pc-vide{padding:26px;text-align:center;color:#7a98c5;border:1px dashed #e3edf9;border-radius:13px}' +
'#pcom-root .pc-err{padding:12px 14px;border-radius:10px;background:#fdeaea;color:#b3403f;font-size:13px}' +
'</style>';
    }

    function ligneDoc(p) {
      const det = [];
      if (p.couleur) det.push(esc(p.couleur));
      if (p.motorisation) det.push(esc(p.motorisation));
      if (p.vin) det.push(esc(p.vin));
      det.push(fmtDate(p.created_at));
      if (p.vendeur) det.push(esc(p.vendeur));
      if (p.site) det.push(esc(p.site));
      if (p.motif_abandon) det.push('abandon : ' + esc(p.motif_abandon));

      let actions = '';
      if (p.peut_agir) {
        if (p.status === 'propale' && p.vn_vo !== 'VN') {
          actions += '<button class="pc-ic" data-pcmod="' + p.id_propale_bdc + '" title="Modifier">✎</button>';
        }
        actions += '<button class="pc-ic" data-pcpdf="' + p.id_propale_bdc + ':' + esc(p.status) +
                   '" data-pcmaj="' + esc(p.updated_at || '') + '" title="Document PDF">PDF</button>';
      }
      if (p.bacs_sf_id) {
        actions += '<a class="pc-ic" style="display:inline-flex;align-items:center;justify-content:center;text-decoration:none" ' +
                   'href="' + PC_BACS_BASE + '/detail/' + esc(p.bacs_sf_id) + '" target="_blank" ' +
                   'title="Ouvrir dans BACS">B</a>';
      }

      return '<div class="pc-doc">' +
        '<div class="col grow">' +
          '<div class="nat">' + esc(libNature(p)) +
            (p.vehicule ? ' · ' + esc(p.vehicule) : '') + '</div>' +
          '<div class="det">' + det.join(' · ') + '</div>' +
        '</div>' +
        '<div class="num">' + eur(p.montant_affiche) + '</div>' +
        badgeStatut(p) +
        '<div style="display:flex;gap:6px">' + actions + '</div>' +
      '</div>';
    }

    function blocHtml(b, sec) {
      // Un document seul n'a pas d'en-tête : il se suffit.
      if (b.seul) {
        return '<div class="pc-bloc' + (sec === 'histoire' ? ' hist' : '') + '">' +
               ligneDoc(b.docs[0]) + '</div>';
      }
      const ouvert = !!S.ouverts[b.affaire] || b.docs.length === 1;
      const cpt = [];
      if (b.nbSim) cpt.push(b.nbSim + ' simulation' + (b.nbSim > 1 ? 's' : ''));
      if (b.nbCmd) cpt.push(b.nbCmd + ' commande' + (b.nbCmd > 1 ? 's' : ''));
      return '<div class="pc-bloc' + (sec === 'histoire' ? ' hist' : '') + '">' +
        '<div class="pc-tete" data-pcaff="' + esc(b.affaire) + '">' +
          '<span style="color:#7a98c5">' + (ouvert ? '▾' : '▸') + '</span>' +
          '<span class="veh">' + esc(b.vehicule || 'Affaire ' + b.affaire) + '</span>' +
          '<span class="cpt">' + cpt.join(' · ') + '</span>' +
          (b.montant != null ? '<span class="mnt">' + eur(b.montant) + '</span>' : '') +
        '</div>' +
        (ouvert ? b.docs.map(ligneDoc).join('') : '') +
      '</div>';
    }

    function sectionHtml(titre, blocs, sec) {
      if (!blocs.length) return '';
      return '<div class="pc-sec"><p class="pc-sect">' + esc(titre) +
             ' — ' + blocs.length + '</p>' +
             blocs.map(function (b) { return blocHtml(b, sec); }).join('') + '</div>';
    }

    function PC_render() {
      const root = doc.getElementById('pcom-root'); if (!root) return;
      if (S.loading && !S.rows) { root.innerHTML = css() + '<div class="pc-vide">Chargement…</div>'; return; }
      if (S.error) { root.innerHTML = css() + '<div class="pc-err">' + esc(S.error) + '</div>'; return; }
      const rows = (S.rows || []).filter(function (p) {
        return S.fVnVo === 'tous' || String(p.vn_vo || '').toUpperCase() === S.fVnVo;
      });

      const parSec = { cours: [], conclu: [], histoire: [] };
      rows.forEach(function (p) { parSec[section(p)].push(p); });

      const barre = '<div class="pc-bar">' +
        ['tous', 'VN', 'VO'].map(function (v) {
          return '<button class="pc-chip' + (S.fVnVo === v ? ' on' : '') + '" data-pcvnvo="' + v + '">' +
                 (v === 'tous' ? 'Tous' : v) + '</button>';
        }).join('') +
        '<span style="flex:1"></span>' +
        (parSec.histoire.length
          ? '<button class="pc-chip' + (S.histoire ? ' on' : '') + '" data-pchist>' +
            'Historique (' + parSec.histoire.length + ')</button>'
          : '') +
      '</div>';

      let corps = sectionHtml('En cours', grouper(parSec.cours), 'cours') +
                  sectionHtml('Conclu', grouper(parSec.conclu), 'conclu') +
                  (S.histoire ? sectionHtml('Historique', grouper(parSec.histoire), 'histoire') : '');
      if (!corps) corps = '<div class="pc-vide">Aucun document commercial pour ce client.</div>';

      root.innerHTML = css() + barre + corps;
    }

    // ─── Chargement ────────────────────────────────────────────────────────
    async function PC_load() {
      const id = getIdClient(); const viewer = getViewerId();
      if (id == null) { S.error = 'Client introuvable.'; PC_render(); return; }
      S.idClient = id; S.loading = true; S.error = null; PC_render();
      try {
        const { data, error } = await ctx.supabase
          .rpc('get_propales_client', { p_id_client: id, p_viewer_id_user: viewer });
        if (error) throw error;
        S.rows = Array.isArray(data) ? data : [];
      } catch (e) {
        console.error('[pcom] chargement', e);
        S.error = 'Chargement impossible : ' + ((e && e.message) ? e.message : e);
      } finally { S.loading = false; PC_render(); }
    }

    // ─── Actions ───────────────────────────────────────────────────────────
    function PC_modif(idPropale) {
      try { wwLib.wwVariable.updateValue(PC_VAR_ID_PROPALE, idPropale); }
      catch (e) { console.error('[pcom] updateValue', e); }
      try { wwLib.wwApp.goTo(PC_PAGE_PROPALE_UPDATE); }
      catch (e) { console.error('[pcom] goTo', e); }
    }

    // PDF : un document figé (commande, vendu) est servi depuis le cache tant
    // qu'il est plus récent que la dernière modification ; une proposition,
    // modifiable, est régénérée.
    async function PC_pdf(idPropale, status, majIso) {
      const supabase = ctx.supabase;
      const isPropale = (status === 'propale' || status === 'draft');
      const type = isPropale ? 'proposition_commerciale' : 'bon_de_commande';
      const templateId = isPropale ? PC_TPL_PROPOSITION : PC_TPL_BON_COMMANDE;
      const btn = doc.querySelector('[data-pcpdf="' + idPropale + ':' + status + '"]');
      if (btn) { btn.disabled = true; }
      const open = (url) => { try { wwLib.getFrontWindow().open(url, '_blank'); } catch (e) { window.open(url, '_blank'); } };
      const done = () => { if (btn) { btn.disabled = false; } };
      const generer = async () => {
        const { data: gen, error: gErr } = await supabase.functions.invoke(PC_PDF_EDGE_FN, {
          body: { id_propale_bdc: idPropale, template_id: templateId, type: type }
        });
        if (gErr) throw gErr;
        if (gen && gen.ok && gen.signed_url) open(gen.signed_url);
        else throw new Error(gen && gen.error ? gen.error : 'Génération PDF échouée');
      };
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
        await generer();
      } catch (e) {
        console.error('[pcom] pdf', e);
        alert('Impossible de générer le PDF : ' + ((e && e.message) ? e.message : e));
      } finally { done(); }
    }

    // ─── Routeur ───────────────────────────────────────────────────────────
    function PC_route(e) {
      if (!e.target.closest('#pcom-root')) return;
      const vnvo = e.target.closest('[data-pcvnvo]');
      if (vnvo) { S.fVnVo = vnvo.getAttribute('data-pcvnvo'); PC_render(); return; }
      const hist = e.target.closest('[data-pchist]');
      if (hist) { S.histoire = !S.histoire; PC_render(); return; }
      const aff = e.target.closest('[data-pcaff]');
      if (aff) { const k = aff.getAttribute('data-pcaff'); S.ouverts[k] = !S.ouverts[k]; PC_render(); return; }
      const mod = e.target.closest('[data-pcmod]');
      if (mod) { PC_modif(Number(mod.getAttribute('data-pcmod'))); return; }
      const pdf = e.target.closest('[data-pcpdf]');
      if (pdf) {
        const v = pdf.getAttribute('data-pcpdf'); const parts = v.split(':');
        PC_pdf(Number(parts[0]), parts[1], pdf.getAttribute('data-pcmaj') || null);
      }
    }

    // Anti-accumulation : un module remonté ne doit pas laisser derrière lui
    // l'écouteur de sa vie précédente.
    if (window.__pcomClickHandler) doc.removeEventListener('click', window.__pcomClickHandler, true);
    window.__pcomClickHandler = PC_route;
    doc.addEventListener('click', PC_route, true);

    // La variable WeWeb qui porte le client n'est pas toujours prête au
    // montage : on retente brièvement plutôt que d'afficher une erreur à un
    // vendeur dont la fiche est en train de s'ouvrir.
    let essais = 0;
    (function boot() {
      if (getIdClient() != null) { PC_load(); return; }
      if (essais++ < 30) { setTimeout(boot, 150); return; }   // ~4,5 s
      PC_load();                                              // affichera l'erreur
    })();

    // Rechargement manuel, appelé au retour de la page de modification.
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
