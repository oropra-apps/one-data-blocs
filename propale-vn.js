// ============================================================================
//  propale-vn.js — Éditeur de proposition VN (One Data)
//  Vue « reflet + enrichissement » : lit configuration_vn + PROPALE_BDC pour un
//  Quote et l'affiche. Aucune écriture, aucun recalcul de barème (BACS reste le
//  configurateur). Bouton « Ouvrir dans BACS » (lien profond) + retour kanban.
//  Coquille et style calqués sur propale-vo.js (mount/ctx, classes pv-*).
// ============================================================================
(function () {
  'use strict';
  window.oropraPropaleVN = {
  async mount(__anchor, ctx) {

  // ---- Contexte / helpers (identiques au VO) --------------------------------
  const BACS_DOMAIN = 'toyota-france.my.site.com'; // paramétrable via config tenant plus tard
  const VAR_ID_PROPALE      = 'aac565e9-ad32-4f81-bf8d-adb611322e62';
  const VAR_SELECTED_CLIENT = '55490583-c88b-4748-916e-4d203db07742';

  const supa   = () => ctx.supabase;
  const fdoc   = () => (__anchor.ownerDocument || document);
  const fwin   = () => { try { return wwLib.getFrontWindow(); } catch (e) { return window; } };
  const getVar = id => { try { return wwLib.wwVariable.getValue(id); } catch (e) { return null; } };
  const setVar = (id, v) => { try { wwLib.wwVariable.updateValue(id, v); } catch (e) {} };

  const num = v => { const n = parseFloat(v); return isNaN(n) ? 0 : n; };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const eur = v => (num(v)).toLocaleString('fr-FR', {minimumFractionDigits:2, maximumFractionDigits:2}) + ' €';
  const fmtDate = d => { if (!d) return ''; try { return new Date(d).toLocaleDateString('fr-FR'); } catch (e) { return ''; } };

  const ST = { P:null, C:null, client:null, site:null };

  // ---- Chargement -----------------------------------------------------------
  async function load() {
    const sb = supa();
    const idProp = num(getVar(VAR_ID_PROPALE));
    if (!idProp) throw new Error('Aucun id_propale_bdc dans la variable WeWeb ' + VAR_ID_PROPALE);

    const { data:P, error } = await sb.from('PROPALE_BDC').select('*').eq('id_propale_bdc', idProp).single();
    if (error) throw error;
    ST.P = P;

    if (P.id_configuration) {
      const { data:C } = await sb.from('configuration_vn').select('*').eq('id_configuration', P.id_configuration).maybeSingle();
      ST.C = C || {};
    } else ST.C = {};

    if (P.id_client_vu) {
      const { data:cl } = await sb.from('CLIENT').select('*').eq('IDVu', P.id_client_vu).limit(1);
      ST.client = (cl && cl[0]) || {};
    } else ST.client = {};

    if (P.id_site) {
      const { data:si } = await sb.from('SITE').select('*').eq('ID_SITE', P.id_site).limit(1);
      ST.site = (si && si[0]) || {};
    } else ST.site = {};
  }

  // ---- Style (palette du VO) ------------------------------------------------
  const CSS = `
  .pv-wrap{font-family:inherit;color:#1c2b45;max-width:1180px;margin:0 auto}
  .pv-top{background:#fff;border:1px solid #e3edf9;border-radius:12px;padding:13px 16px;display:flex;align-items:center;gap:16px;flex-wrap:wrap;margin-bottom:16px}
  .pv-tag{background:#E8963B;color:#fff;font-weight:800;border-radius:7px;padding:4px 9px;font-size:12px}
  .pv-title{font-size:16px;font-weight:800;color:#1f4a87}
  .pv-ctx{display:flex;align-items:center;gap:14px;flex-wrap:wrap}
  .pv-chip{display:flex;flex-direction:column;line-height:1.2}
  .pv-chip span{font-size:10px;color:#7a98c5;text-transform:uppercase;letter-spacing:.04em}
  .pv-chip b{font-weight:700}
  .pv-sep{width:1px;height:26px;background:#e3edf9}
  .pv-branch{display:inline-flex;align-items:center;gap:6px;background:#eef3fa;color:#2a5ea9;border:1px solid #cfe0f4;border-radius:20px;padding:4px 11px;font-weight:700;font-size:12px}
  .pv-ht{margin-left:auto;display:flex;align-items:center;gap:7px;font-size:12px;font-weight:700;color:#7a98c5}
  .pv-ht span.on{color:#3a9e8a}
  .pv-switch{width:46px;height:24px;border-radius:20px;background:#53bda7;position:relative}
  .pv-switch::after{content:"";position:absolute;top:3px;left:3px;width:18px;height:18px;border-radius:50%;background:#fff}
  .pv-switch.ht::after{left:25px}
  .pv-grid{display:grid;grid-template-columns:1fr 340px;gap:18px}
  @media(max-width:900px){.pv-grid{grid-template-columns:1fr}}
  .pv-card{background:#fff;border:1px solid #e3edf9;border-radius:12px;margin-bottom:14px;overflow:hidden}
  .pv-card-h{background:#eef3fa;color:#1f4a87;font-weight:800;padding:10px 14px;font-size:12.5px;letter-spacing:.02em;border-bottom:1px solid #e3edf9}
  .pv-card-b{padding:14px}
  .pv-cli{display:flex;gap:12px;align-items:center}
  .pv-cli-av{width:42px;height:42px;border-radius:50%;background:#2a5ea9;color:#fff;display:flex;align-items:center;justify-content:center;font-weight:800}
  .pv-cli-name{font-weight:800}
  .pv-cli-rows{display:flex;flex-wrap:wrap;gap:4px 16px;margin-top:3px;color:#5a7ba8;font-size:12.5px}
  .pv-veh{display:grid;grid-template-columns:170px 1fr;gap:16px}
  @media(max-width:560px){.pv-veh{grid-template-columns:1fr}}
  .pv-veh-ph{width:170px;height:104px;border:1px solid #e3edf9;border-radius:10px;background:#eef2f7;display:flex;align-items:center;justify-content:center;color:#9fb0c4;font-size:11px;overflow:hidden}
  .pv-veh-ph img{width:100%;height:100%;object-fit:contain}
  @media(max-width:560px){.pv-veh-ph{width:100%;height:170px}}
  .pv-attrs{display:grid;grid-template-columns:repeat(3,1fr);gap:10px 14px}
  @media(max-width:560px){.pv-attrs{grid-template-columns:repeat(2,1fr)}}
  .pv-attr .k{font-size:10px;color:#7a98c5;text-transform:uppercase;letter-spacing:.03em}
  .pv-attr .v{font-weight:700}
  .pv-sw{display:inline-block;width:12px;height:12px;border-radius:3px;border:1px solid #0002;vertical-align:-1px;margin-right:5px}
  .pv-lines{width:100%;border-collapse:collapse}
  .pv-lines td{padding:8px 0;border-bottom:1px solid #eef3fa;font-size:13px}
  .pv-lines tr:last-child td{border-bottom:none}
  .pv-lines .p{text-align:right;font-weight:700;white-space:nowrap}
  .pv-tagm{font-size:10px;color:#7a98c5;border:1px solid #e3edf9;border-radius:5px;padding:1px 6px;margin-left:8px}
  .pv-empty{color:#9fb0c4;font-style:italic;font-size:13px}
  .pv-sum{position:sticky;top:16px;background:#fff;border:1px solid #e3edf9;border-radius:14px;overflow:hidden;box-shadow:0 4px 14px rgba(28,43,69,.08)}
  .pv-sum-h{padding:12px 18px;background:#2a5ea9;color:#fff;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.5px}
  .pv-sum-b{padding:6px 18px 16px}
  .pv-sl{display:flex;justify-content:space-between;align-items:center;padding:8px 0;font-size:13px;border-bottom:1px solid #f5f8fc}
  .pv-sl span{color:#7a98c5;font-weight:600}.pv-sl b{font-weight:700}
  .pv-sl.minus b{color:#e24b4a}
  .pv-total{background:#53bda7;color:#fff;border-radius:11px;padding:13px 15px;display:flex;justify-content:space-between;align-items:center;gap:8px;margin-top:12px;box-shadow:0 3px 10px rgba(83,189,167,.35)}
  .pv-total span{font-size:11px;font-weight:800;text-transform:uppercase;letter-spacing:.3px}.pv-total b{font-size:19px;font-weight:800;white-space:nowrap}
  .pv-reste{background:#fbeaee;color:#e24b4a;border-radius:11px;padding:12px 15px;display:flex;justify-content:space-between;align-items:center;margin-top:9px;font-weight:800}
  .pv-reste b{font-size:17px}
  .pv-actions{display:flex;flex-direction:column;gap:8px;margin-top:14px}
  .pv-btn{padding:11px;border-radius:9px;font-size:13px;font-weight:700;border:1px solid transparent;cursor:pointer;font-family:inherit;display:inline-flex;align-items:center;justify-content:center;gap:6px;text-decoration:none;transition:all .12s}
  .pv-btn-blue{background:#2a5ea9;color:#fff}.pv-btn-blue:hover{background:#1f4a87}
  .pv-btn-ghost{background:#fff;color:#2a5ea9;border:1px solid #2a5ea9}.pv-btn-ghost:hover{background:#f2f6fc}
  .pv-note{font-size:11.5px;color:#7a98c5;margin-top:12px;line-height:1.5;border-top:1px solid #eef3fa;padding-top:10px}
  .pv-err{background:#fcebeb;color:#e24b4a;border:1px solid #f5a5a5;border-radius:8px;padding:12px 16px;font-size:13px;font-weight:600}
  `;

  // ---- Rendu ----------------------------------------------------------------
  function card(title, bodyHtml) {
    return `<div class="pv-card"><div class="pv-card-h">${title}</div><div class="pv-card-b">${bodyHtml}</div></div>`;
  }

  function render(root) {
    const P = ST.P, C = ST.C || {}, cl = ST.client || {}, si = ST.site || {};
    const enStock = !!(P.VIN && String(P.VIN).trim());

    const vehName  = [C.marque, C.famille, C.finition].filter(Boolean).join(' ') || (P.LABEL || '—');
    const siteName = si.NomSite || si.SITE || si.RaisonSociale || ('Site #' + (P.id_site || '—'));
    const cName    = [cl.CIVILITE, cl.NOM, cl.PRENOM].filter(Boolean).join(' ') || ('Client #' + (P.id_client_vu || '—'));
    const cInit    = ((cl.PRENOM || '?')[0] + (cl.NOM || '?')[0]).toUpperCase();

    // -- Client
    const cliRows = [
      cl.TEl_MOB ? '📱 ' + esc(cl.TEl_MOB) : '',
      cl.EMAIL ? '✉ ' + esc(cl.EMAIL) : '',
      (cl.ADRESSE || cl.ville) ? '📍 ' + esc([cl.ADRESSE, cl.code_postal, cl.ville].filter(Boolean).join(' ')) : '',
      cl.BIRTHDAY ? '🎂 ' + fmtDate(cl.BIRTHDAY) : ''
    ].filter(Boolean).map(x => `<span>${x}</span>`).join('');
    const clientCard = card('CLIENT',
      `<div class="pv-cli"><div class="pv-cli-av">${esc(cInit)}</div>
        <div><div class="pv-cli-name">${esc(cName)}</div><div class="pv-cli-rows">${cliRows}</div></div></div>`);

    // -- Véhicule (config ou stock)
    const photo = C.couleur_photo
      ? `<img src="${esc(C.couleur_photo)}" alt="Aperçu véhicule" onerror="this.parentNode.textContent='aperçu véhicule'">`
      : 'aperçu véhicule';
    const attr = (k, v) => `<div class="pv-attr"><div class="k">${k}</div><div class="v">${v}</div></div>`;
    const swatch = c => `<span class="pv-sw" style="background:${c}"></span>`;
    const vehAttrs = [
      attr('Marque', esc(C.marque || 'Toyota')),
      attr('Famille', esc(C.famille || '—')),
      attr('Finition', esc(C.finition || '—')),
      attr('Motorisation', esc(C.motorisation || '—')),
      attr('Carrosserie', esc(C.carrosserie || '—')),
      attr('Énergie', esc(C.energie || '—')),
      attr('CO₂', C.co2 != null ? esc(C.co2) + ' g/km' : '—'),
      attr('Couleur ext.', C.couleur_ext ? swatch('#8893a0') + esc(C.couleur_ext) : '<span class="pv-empty">non renseignée</span>'),
      attr('Intérieur', C.couleur_interieur ? swatch('#222') + esc(C.couleur_interieur) : '<span class="pv-empty">—</span>')
    ].join('');
    const vehTitle = enStock ? `VÉHICULE — EN STOCK · VIN ${esc(P.VIN)}` : 'VÉHICULE — CONFIGURATION';
    const vehCard = card(vehTitle,
      `<div class="pv-veh"><div class="pv-veh-ph">${photo}</div><div class="pv-attrs">${vehAttrs}</div></div>`);

    // -- Options
    let optTotal = 0;
    const opts = Array.isArray(C.options) ? C.options : [];
    const optRows = opts.length
      ? opts.map(o => { optTotal += num(o.prix); return `<tr><td>${esc(o.label || '—')}</td><td class="p">${eur(o.prix)}</td></tr>`; }).join('')
      : `<tr><td class="pv-empty" colspan="2">Aucune option</td></tr>`;
    const optCard = card('OPTIONS', `<table class="pv-lines">${optRows}</table>`);

    // -- Accessoires
    let accTotal = 0; const accRows = [];
    for (let i = 1; i <= 10; i++) {
      const t = P['Accessoire' + i + 'Text'], pr = P['Accessoire' + i + 'Tarif'];
      if (t) { accTotal += num(pr); accRows.push(`<tr><td>${esc(t)}</td><td class="p">${eur(pr)}</td></tr>`); }
    }
    const accCard = card('ACCESSOIRES', `<table class="pv-lines">${accRows.length ? accRows.join('') : '<tr><td class="pv-empty" colspan="2">Aucun accessoire</td></tr>'}</table>`);

    // -- Remises
    let remTotal = 0; const remRows = [];
    [['Remise1','Remise1Montant'],['Remise2','Remise2Montant'],['Remise3','Remise3Montant']].forEach(([l,m]) => {
      if (P[l] || num(P[m])) { remTotal += num(P[m]); remRows.push(`<tr><td>${esc(P[l] || 'Remise')}</td><td class="p">− ${eur(P[m])}</td></tr>`); }
    });
    if (num(P.ParComPourcent)) remRows.unshift(`<tr><td>Taux de remise</td><td class="p">${esc(P.ParComPourcent)} %</td></tr>`);
    const remCard = card('REMISES', `<table class="pv-lines">${remRows.length ? remRows.join('') : '<tr><td class="pv-empty" colspan="2">Aucune remise</td></tr>'}</table>`);

    // -- Reprise
    let repCard = '';
    if (P.RepriseVehicule || P.ValeurReprise || P.MarqueReprise) {
      repCard = card('VÉHICULE DE REPRISE',
        `<div class="pv-attrs" style="grid-template-columns:repeat(4,1fr)">
          ${attr('Marque', esc(P.MarqueReprise || '—'))}
          ${attr('Modèle', esc(P.ModeleReprise || '—'))}
          ${attr('Kilométrage', P.KmReprise != null ? num(P.KmReprise).toLocaleString('fr-FR') + ' km' : '—')}
          ${attr('Valeur reprise', `<span style="color:#e24b4a">${eur(P.ValeurReprise)}</span>`)}
        </div>`);
    }

    // -- Financement
    let finCard = '';
    if (P.TypeFinancement || P.OrganismeFinancement) {
      finCard = card('FINANCEMENT',
        `<div class="pv-attrs" style="grid-template-columns:repeat(3,1fr)">
          ${attr('Type', esc(P.TypeFinancement || '—'))}
          ${attr('Organisme', esc(P.OrganismeFinancement || '—'))}
          ${attr('Échéancier', '<span class="pv-empty">non transmis</span>')}
        </div>`);
    }

    // -- Récap (montants reflétés de BACS, pas de recalcul)
    const totalCmd = num(P.TotalProp) || num(P.MontantTTCEngagement);
    const prixVeh  = totalCmd - optTotal - accTotal + remTotal; // le véhicule = le reste (assure un récap cohérent)
    const reprise  = num(P.ValeurReprise);
    const reste    = totalCmd - reprise;
    const sumRows = `
      ${totalCmd ? `<div class="pv-sl"><span>Prix véhicule</span><b>${eur(prixVeh)}</b></div>` : ''}
      ${optTotal ? `<div class="pv-sl"><span>Options</span><b>+ ${eur(optTotal)}</b></div>` : ''}
      ${accTotal ? `<div class="pv-sl"><span>Accessoires</span><b>+ ${eur(accTotal)}</b></div>` : ''}
      ${remTotal ? `<div class="pv-sl minus"><span>Remises</span><b>− ${eur(remTotal)}</b></div>` : ''}
      <div class="pv-total"><span>Total commande TTC</span><b>${eur(totalCmd)}</b></div>
      ${reprise ? `<div class="pv-sl minus" style="margin-top:8px"><span>Reprise</span><b>− ${eur(reprise)}</b></div>` : ''}
      <div class="pv-reste"><span>RESTE À PAYER</span><b>${eur(reste)}</b></div>`;

    const bacsUrl = P.bacs_sf_id ? `https://${BACS_DOMAIN}/bacs2/s/quote/${esc(P.bacs_sf_id)}` : null;
    const actions = `
      ${bacsUrl ? `<a class="pv-btn pv-btn-blue" href="${bacsUrl}" target="_blank" rel="noopener">Ouvrir dans BACS ↗</a>` : ''}`;

    root.innerHTML = `<style>${CSS}</style><div class="pv-wrap">
      <div class="pv-top">
        <span class="pv-tag">VN</span><span class="pv-title">Proposition</span>
        <div class="pv-ctx">
          <div class="pv-chip"><span>Véhicule</span><b>${esc(vehName)}</b></div>
          <div class="pv-sep"></div>
          <div class="pv-chip"><span>Point de vente</span><b>${esc(siteName)}</b></div>
          <span class="pv-branch">${enStock ? '🚗 En stock' : '🔧 Configuration — à produire'}</span>
        </div>
        <div class="pv-ht"><span class="on">TTC</span><div class="pv-switch"></div><span>HT</span></div>
      </div>
      <div class="pv-grid">
        <div class="pv-col">
          ${clientCard}${vehCard}${optCard}${accCard}${remCard}${repCard}${finCard}
        </div>
        <div class="pv-rightcol">
          <div class="pv-sum"><div class="pv-sum-h">Récapitulatif</div><div class="pv-sum-b">
            ${sumRows}
            <div class="pv-actions">${actions}</div>
            <div class="pv-note">Configuration, prix, remises et reprise sont issus de BACS. Pour toute modification, ouvrir la propale dans BACS. One Data en donne la vue complète, à jour, sans ressaisie.</div>
          </div></div>
        </div>
      </div>
    </div>`;

  }

  // ---- Boot -----------------------------------------------------------------
  const root = __anchor;
  root.innerHTML = '<div style="padding:24px;color:#7a98c5">Chargement de la proposition…</div>';
  try {
    await load();
    render(root);
  } catch (e) {
    root.innerHTML = `<div class="pv-wrap"><div class="pv-err">Impossible de charger la proposition : ${esc(e && e.message || e)}</div></div><style>${CSS}</style>`;
  }

  }
  };
})();
