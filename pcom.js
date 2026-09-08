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
      draft:   { txt: 'Simulation' },
      propale: { txt: 'Proposition' },
      bdc:     { txt: 'Commande' },
      win:     { txt: 'Vendu' },
      lose:    { txt: 'Abandonné' }
    };
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
        // Identifier l'affaire, plutôt que constater qu'elle est hétérogène.
        // Un libellé unique s'impose ; sinon une famille commune — cinq
        // finitions d'Aygo X restent une Aygo X ; sinon le véhicule le plus
        // représenté, avec le nombre des autres.
        const compte = function (cle) {
          const m = {};
          b.docs.forEach(function (d) { const v = d[cle]; if (v) m[v] = (m[v] || 0) + 1; });
          return m;
        };
        const parVeh = compte('vehicule'), noms = Object.keys(parVeh);
        if (noms.length === 1) {
          b.vehicule = noms[0];
        } else if (!noms.length) {
          b.vehicule = null;
        } else {
          const parFam = compte('famille'), fams = Object.keys(parFam);
          const marques = Object.keys(compte('marque'));
          if (fams.length === 1) {
            b.vehicule = (marques.length === 1 ? marques[0] + ' ' : '') + fams[0];
            b.versions = b.docs.length;
          } else {
            const majoritaire = noms.reduce(function (a, n) { return parVeh[n] > parVeh[a] ? n : a; }, noms[0]);
            b.vehicule = majoritaire;
            b.autres = b.docs.length - parVeh[majoritaire];
          }
        }
        b.site = b.docs[0] && b.docs[0].site;
        // Une affaire à document unique n'a rien à cacher : elle s'ouvre seule.
        if (b.docs.length === 1 && S.ouverts[b.affaire] === undefined) S.ouverts[b.affaire] = true;
        b.vendeur = b.docs[0] && b.docs[0].vendeur;
      });
      blocs.sort(function (x, y) { return String(y.maj || '').localeCompare(String(x.maj || '')); });
      return blocs;
    }

    // ─── Rendu ─────────────────────────────────────────────────────────────
    // La langue visuelle est celle du kanban : mêmes couleurs, mêmes rayons,
    // mêmes boutons ronds, même vignette véhicule. Deux écrans qui montrent les
    // mêmes objets doivent se ressembler.
    const I_PDF = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 18 15 15"/></svg>';
    const I_EDIT = '<svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>';
    const I_CHEV = '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>';

    function css() {
      return '<style>' +
'#pcom-root{font-family:inherit;color:#1f2b45}' +
'#pcom-root .pc-bar{display:flex;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:16px}' +
'#pcom-root .pc-chip{border:1.5px solid #e3edf9;background:#fff;color:#2a5ea9;border-radius:999px;padding:7px 16px;font:inherit;font-size:13px;font-weight:700;cursor:pointer;transition:.12s}' +
'#pcom-root .pc-chip:hover{border-color:#2a5ea9}' +
'#pcom-root .pc-chip.on{background:#2a5ea9;color:#fff;border-color:#2a5ea9}' +
'#pcom-root .pc-sect{font-size:11px;font-weight:800;letter-spacing:.07em;text-transform:uppercase;color:#888780;margin:0 0 10px}' +
'#pcom-root .pc-sec{margin:0 0 24px}' +
'#pcom-root .pc-bloc{background:#fff;border:0.5px solid #ece9e1;border-left:3px solid #cfcdc5;border-radius:10px;margin-bottom:10px;overflow:hidden;transition:box-shadow .12s}' +
'#pcom-root .pc-bloc:hover{box-shadow:0 4px 14px rgba(42,94,169,.10)}' +
'#pcom-root .pc-bloc.vt-vn{border-left-color:#53bda7}' +
'#pcom-root .pc-bloc.vt-vo{border-left-color:#fac055}' +
'#pcom-root .pc-bloc.hist{opacity:.68}' +
'#pcom-root .pc-tete{display:flex;align-items:center;gap:10px;padding:11px 14px;cursor:pointer;background:#fbfaf7;border:none;width:100%;text-align:left;font:inherit}' +
'#pcom-root .pc-tete:hover{background:#f7f6f2}' +
'#pcom-root .pc-tete .chev{color:#b4b2a9;display:inline-flex;transition:transform .15s}' +
'#pcom-root .pc-tete.ouv .chev{transform:rotate(90deg)}' +
'#pcom-root .pc-tete .ident{flex:1;min-width:0;display:flex;flex-direction:column;gap:2px}' +
'#pcom-root .pc-tete .veh{font-weight:800;font-size:14px;color:#1c2b45;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
'#pcom-root .pc-tete .veh .nuance{font-weight:700;font-size:11px;color:#888780;background:#f2f1ec;border-radius:5px;padding:1px 7px;margin-left:6px}' +
'#pcom-root .pc-tete .situe{font-size:11.5px;color:#b4b2a9;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
'#pcom-root .pc-tete .cpt{font-size:11px;font-weight:700;color:#888780;background:#f7f6f2;border-radius:6px;padding:3px 9px;white-space:nowrap}' +
'#pcom-root .pc-tete .mnt{font-size:14px;font-weight:800;color:#1c2b45;white-space:nowrap}' +
'#pcom-root .pc-list{display:flex;flex-direction:column;gap:8px;padding:10px 12px}' +
'#pcom-root .pc-row{display:flex;gap:8px;align-items:stretch}' +
'#pcom-root .pc-main{flex:1;display:flex;gap:14px;align-items:center;text-align:left;border:1px solid #e3edf9;background:#fff;border-radius:12px;padding:10px 14px;font:inherit;min-width:0}' +
'#pcom-root .pc-img{width:88px;height:54px;object-fit:contain;border-radius:8px;background:#eef2f7;flex:0 0 auto;display:inline-block}' +
'#pcom-root .pc-txt{flex:1;display:flex;flex-direction:column;gap:3px;min-width:0}' +
'#pcom-root .pc-txt b{font-weight:800;color:#1f2b45;font-size:14px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
'#pcom-root .pc-txt i{font-style:normal;color:#7a98c5;font-size:12.5px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}' +
'#pcom-root .pc-txt i.vide{color:#c3cfdd}' +
'#pcom-root .pc-meta{font-size:11px;color:#b4b2a9;display:flex;gap:7px;flex-wrap:wrap}' +
'#pcom-root .pc-prix{font-weight:800;color:#2a5ea9;white-space:nowrap;font-size:14px;align-self:center}' +
'#pcom-root .pc-act{flex:0 0 auto;align-self:center;width:38px;height:38px;border-radius:50%;border:1.5px solid #e3edf9;background:#fff;color:#2a5ea9;cursor:pointer;padding:0;display:inline-flex;align-items:center;justify-content:center;line-height:0;transition:.14s;text-decoration:none;font:inherit;font-weight:800;font-size:12px}' +
'#pcom-root .pc-act:hover{background:#2a5ea9;border-color:#2a5ea9;color:#fff;transform:scale(1.06)}' +
'#pcom-root .pc-act:disabled{opacity:.4;cursor:default;transform:none;background:#fff;color:#2a5ea9}' +
'#pcom-root .pc-st{font-size:10px;font-weight:800;border-radius:5px;padding:2px 8px;text-transform:uppercase;letter-spacing:.02em;align-self:center;white-space:nowrap}' +
'#pcom-root .pc-st.draft{background:#e7ebf0;color:#5a6b80}' +
'#pcom-root .pc-st.propale{background:rgba(250,192,85,.28);color:#8a6410}' +
'#pcom-root .pc-st.bdc{background:rgba(42,94,169,.14);color:#2a5ea9}' +
'#pcom-root .pc-st.win{background:rgba(83,189,167,.20);color:#2c7a68}' +
'#pcom-root .pc-st.lose{background:rgba(217,112,112,.16);color:#b23433}' +
'#pcom-root .pc-vide{padding:30px;text-align:center;color:#b4b2a9;font-size:13px;border:1px dashed #ece9e1;border-radius:10px}' +
'#pcom-root .pc-err{padding:12px 14px;border-radius:10px;background:rgba(217,112,112,.14);color:#b23433;font-size:13px}' +
'</style>';
    }

    function vignette(p) {
      return p.photo
        ? '<img class="pc-img" src="' + esc(p.photo) + '" alt="" ' +
          'onerror="this.removeAttribute(\'src\')">'
        : '<span class="pc-img"></span>';
    }

    function ligneDoc(p) {
      const meta = [fmtDate(p.created_at)];
      if (p.motorisation) meta.push(esc(p.motorisation));
      if (p.vin) meta.push(esc(p.vin));
      if (p.vendeur) meta.push(esc(p.vendeur));
      if (p.site) meta.push(esc(p.site));
      if (p.motif_abandon) meta.push('abandon : ' + esc(p.motif_abandon));

      let actions = '';
      if (p.peut_agir && p.status === 'propale' && p.vn_vo !== 'VN') {
        actions += '<button type="button" class="pc-act" data-pcmod="' + p.id_propale_bdc +
                   '" title="Modifier">' + I_EDIT + '</button>';
      }
      if (p.peut_agir) {
        actions += '<button type="button" class="pc-act" data-pcpdf="' + p.id_propale_bdc + ':' +
                   esc(p.status) + '" data-pcmaj="' + esc(p.updated_at || '') +
                   '" title="Document PDF">' + I_PDF + '</button>';
      }
      if (p.bacs_sf_id) {
        actions += '<a class="pc-act" href="' + PC_BACS_BASE + '/detail/' + esc(p.bacs_sf_id) +
                   '" target="_blank" rel="noopener" title="Ouvrir dans BACS">B</a>';
      }

      const l = LIB_STATUT[p.status] || { txt: p.status || '—', cls: 'draft' };
      return '<div class="pc-row">' +
        '<div class="pc-main">' + vignette(p) +
          '<span class="pc-txt">' +
            '<b>' + esc(libNature(p)) + (p.vehicule ? ' · ' + esc(p.vehicule) : '') + '</b>' +
            (p.couleur ? '<i>' + esc(p.couleur) + '</i>'
                       : '<i class="vide">couleur non renseignée</i>') +
            '<span class="pc-meta">' + meta.map(function (m) { return '<span>' + m + '</span>'; }).join('') + '</span>' +
          '</span>' +
          '<span class="pc-prix">' + eur(p.montant_affiche) + '</span>' +
        '</div>' +
        '<span class="pc-st ' + esc(p.status || 'draft') + '">' + esc(l.txt) + '</span>' +
        actions +
      '</div>';
    }

    function classeVt(docs) {
      const t = String((docs[0] && docs[0].vn_vo) || '').toUpperCase();
      return t === 'VN' ? ' vt-vn' : (t === 'VO' ? ' vt-vo' : '');
    }

    function blocHtml(b, sec) {
      const cls = 'pc-bloc' + classeVt(b.docs) + (sec === 'histoire' ? ' hist' : '');
      // Un document isolé se suffit : pas d'en-tête à déplier pour une ligne.
      if (b.seul) return '<div class="' + cls + '"><div class="pc-list">' + ligneDoc(b.docs[0]) + '</div></div>';

      const ouvert = !!S.ouverts[b.affaire];
      const cpt = [];
      if (b.nbSim) cpt.push(b.nbSim + ' simulation' + (b.nbSim > 1 ? 's' : ''));
      if (b.nbCmd) cpt.push(b.nbCmd + ' commande' + (b.nbCmd > 1 ? 's' : ''));

      // Le titre nomme le véhicule ; la ligne du dessous situe l'affaire —
      // qui l'a ouverte, où, et quand. C'est ce qui permet de la reconnaître.
      let titre = esc(b.vehicule || 'Affaire sans véhicule');
      if (b.versions) titre += ' <span class="nuance">' + b.versions + ' versions</span>';
      else if (b.autres) titre += ' <span class="nuance">+ ' + b.autres + ' autre' + (b.autres > 1 ? 's' : '') + '</span>';
      const situe = [b.vendeur, b.site, fmtDate(b.maj)].filter(Boolean).map(esc).join(' · ');

      return '<div class="' + cls + '">' +
        '<button type="button" class="pc-tete' + (ouvert ? ' ouv' : '') + '" data-pcaff="' + esc(b.affaire) + '">' +
          '<span class="chev">' + I_CHEV + '</span>' +
          '<span class="ident">' +
            '<span class="veh">' + titre + '</span>' +
            '<span class="situe">' + situe + '</span>' +
          '</span>' +
          '<span class="cpt">' + cpt.join(' · ') + '</span>' +
          (b.montant != null ? '<span class="mnt">' + eur(b.montant) + '</span>' : '') +
        '</button>' +
        (ouvert ? '<div class="pc-list">' + b.docs.map(ligneDoc).join('') + '</div>' : '') +
      '</div>';
    }

    function sectionHtml(titre, blocs, sec) {
      if (!blocs.length) return '';
      return '<div class="pc-sec"><p class="pc-sect">' + esc(titre) + ' — ' + blocs.length + '</p>' +
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
          return '<button type="button" class="pc-chip' + (S.fVnVo === v ? ' on' : '') +
                 '" data-pcvnvo="' + v + '">' + (v === 'tous' ? 'Tous' : v) + '</button>';
        }).join('') +
        '<span style="flex:1"></span>' +
        (parSec.histoire.length
          ? '<button type="button" class="pc-chip' + (S.histoire ? ' on' : '') + '" data-pchist>' +
            'Historique · ' + parSec.histoire.length + '</button>'
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
