// GF — TPV: Comisiones
(function(window) {
  'use strict';

// ══════════════════════════════════════
// ═══  CONFIGURACIÓN DE COMISIONES  ═══
// ══════════════════════════════════════

let _comClientesCache = [];
let _comAgentesCache = [];
let _editingClientId = null;

const _RATE_FIELDS = [
  'rate_efevoo_tc','rate_efevoo_td','rate_efevoo_amex','rate_efevoo_ti',
  'rate_salem_tc','rate_salem_td','rate_salem_amex','rate_salem_ti',
  'rate_convenia_tc','rate_convenia_td','rate_convenia_amex','rate_convenia_ti',
  'rate_comisionista_tc','rate_comisionista_td','rate_comisionista_amex','rate_comisionista_ti'
];

const _MSI_PLAZOS = [3, 6, 9, 12, 18];
const _MSI_ENTITIES = ['efevoo','salem','convenia','comisionista'];
const _MSI_CARDS = ['TC','Amex'];

function _fmtRate(v) {
  const n = parseFloat(v) || 0;
  if (n === 0) return '<span style="color:var(--muted)">—</span>';
  return (n * 100).toFixed(4) + '%';
}

async function rTPVComisiones() {
  try {
    const [clients, agentes] = await Promise.all([TPV.getClients(), TPV.getAgentes()]);
    _comClientesCache = clients || [];
    _comAgentesCache = agentes || [];

    // KPIs
    const total = _comClientesCache.length;
    const conAgente = _comClientesCache.filter(c => c.agente_id).length;
    const conPromotor = _comClientesCache.filter(c => c.promotor && c.promotor !== 'Sin Promotor').length;
    const sinConfig = _comClientesCache.filter(c => {
      const hasRate = _RATE_FIELDS.some(f => parseFloat(c[f]) > 0);
      return !hasRate;
    }).length;

    const kT = document.getElementById('com-kpi-total');
    const kA = document.getElementById('com-kpi-agente');
    const kP = document.getElementById('com-kpi-promotor');
    const kS = document.getElementById('com-kpi-sinconfig');
    if (kT) { kT.textContent = total; document.getElementById('com-kpi-total-sub').textContent = 'En base de datos'; }
    if (kA) { kA.textContent = conAgente; document.getElementById('com-kpi-agente-sub').textContent = `${total - conAgente} sin agente`; }
    if (kP) { kP.textContent = conPromotor; document.getElementById('com-kpi-promotor-sub').textContent = `${total - conPromotor} sin promotor`; }
    if (kS) { kS.textContent = sinConfig; document.getElementById('com-kpi-sinconfig-sub').textContent = sinConfig > 0 ? 'Requieren configuración' : 'Todos configurados'; }

    // Agente filter dropdown
    const sel = document.getElementById('com-cfg-agente-filter');
    if (sel) {
      sel.innerHTML = '<option value="">Todos los agentes</option>';
      _comAgentesCache.forEach(a => {
        sel.innerHTML += `<option value="${a.id}">${escapeHtml(a.nombre)} (${escapeHtml(a.siglas || '')})</option>`;
      });
    }

    // Render table
    _renderComTable(_comClientesCache);

    // Clear search
    const s = document.getElementById('com-cfg-search');
    if (s) s.value = '';

  } catch (e) {
    console.error('[COM] rTPVComisiones error:', e);
    toast('Error cargando clientes: ' + e.message);
  }
}

// Get the best rate for a card type across all entities
function _getCardRate(c, cardType) {
  const entities = ['efevoo','salem','convenia','comisionista'];
  for (const ent of entities) {
    const v = parseFloat(c['rate_' + ent + '_' + cardType]);
    if (v > 0) return v;
  }
  return 0;
}

// Detect which entity has rates for a client
function _getClientEntity(c) {
  const entities = ['efevoo','salem','convenia','comisionista'];
  const labels = { efevoo:'Efevoo', salem:'Salem', convenia:'Convenia', comisionista:'Comisionista' };
  const colors = { efevoo:'#0073ea', salem:'var(--green)', convenia:'var(--purple)', comisionista:'var(--orange)' };
  for (const ent of entities) {
    if (['tc','td','amex','ti'].some(ct => parseFloat(c['rate_' + ent + '_' + ct]) > 0)) {
      return { name: labels[ent], color: colors[ent] };
    }
  }
  return c.entidad ? { name: c.entidad, color: 'var(--muted)' } : null;
}

function _renderComTable(clients) {
  const tbody = document.getElementById('com-cfg-tbody');
  if (!tbody) return;

  if (!clients.length) {
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:30px">No hay clientes registrados</td></tr>';
    const ct = document.getElementById('com-cfg-count');
    if (ct) ct.textContent = '0 clientes';
    return;
  }

  tbody.innerHTML = clients.map((c, i) => {
    const agSig = c.tpv_agentes ? c.tpv_agentes.siglas || c.tpv_agentes.nombre : '';
    const origIdx = _comClientesCache.indexOf(c);
    const ent = _getClientEntity(c);
    const entPill = ent ? `<span class="pill" style="font-size:.58rem;background:${ent.color}20;color:${ent.color};border:1px solid ${ent.color}40">${escapeHtml(ent.name)}</span>` : '<span style="color:var(--muted)">—</span>';
    return `<tr data-com-idx="${i}" data-com-nombre="${(c.nombre||'').toLowerCase()}" data-com-agente="${c.agente_id||''}">
      <td style="font-weight:600;font-size:.72rem;white-space:nowrap;cursor:pointer;color:var(--blue)" class="com-detail-link" data-idx="${origIdx}">${escapeHtml(c.nombre_display || c.nombre || '—')}</td>
      <td style="font-size:.72rem">${agSig ? `<span class="pill" style="font-size:.62rem">${escapeHtml(agSig)}</span>` : '<span style="color:var(--muted)">—</span>'}</td>
      <td style="font-size:.72rem">${entPill}</td>
      <td class="r" style="font-size:.72rem">${_fmtRate(_getCardRate(c, 'tc'))}</td>
      <td class="r" style="font-size:.72rem">${_fmtRate(_getCardRate(c, 'td'))}</td>
      <td class="r" style="font-size:.72rem">${_fmtRate(_getCardRate(c, 'amex'))}</td>
      <td class="r" style="font-size:.72rem">${_fmtRate(_getCardRate(c, 'ti'))}</td>
      <td class="r" style="font-size:.72rem">${c.factor_iva || 1.16}</td>
      <td style="text-align:center">${!isViewer() ? `<button class="com-edit-btn" data-idx="${origIdx}" style="background:none;border:none;cursor:pointer;font-size:.85rem" title="Editar">✏️</button>` : ''}</td>
    </tr>`;
  }).join('');

  const ct = document.getElementById('com-cfg-count');
  if (ct) ct.textContent = `${clients.length} cliente${clients.length !== 1 ? 's' : ''}`;

  // Event delegation for comisiones table
  if (!tbody._comBound) {
    tbody.addEventListener('click', function(e) {
      const detailLink = e.target.closest('.com-detail-link');
      if (detailLink) { openComDetail(_comClientesCache[parseInt(detailLink.dataset.idx)]); return; }
      const editBtn = e.target.closest('.com-edit-btn');
      if (editBtn) { openComEdit(_comClientesCache[parseInt(editBtn.dataset.idx)]); return; }
    });
    tbody._comBound = true;
  }
}

function filterComClientes() {
  const q = (document.getElementById('com-cfg-search')?.value || '').toLowerCase().trim();
  const agId = document.getElementById('com-cfg-agente-filter')?.value || '';
  const tbody = document.getElementById('com-cfg-tbody');
  if (!tbody) return;

  let visible = 0;
  tbody.querySelectorAll('tr[data-com-idx]').forEach(tr => {
    const nombre = tr.getAttribute('data-com-nombre') || '';
    const agente = tr.getAttribute('data-com-agente') || '';
    const matchQ = !q || nombre.includes(q);
    const matchA = !agId || agente === agId;
    const show = matchQ && matchA;
    tr.style.display = show ? '' : 'none';
    if (show) visible++;
  });

  const ct = document.getElementById('com-cfg-count');
  if (ct) ct.textContent = `${visible} de ${_comClientesCache.length} clientes`;
}

async function openComDetail(client) {
  if (!client) return;
  const ov = document.getElementById('com-detail-overlay');
  if (!ov) return;
  ov.style.display = 'flex';

  // Header
  const nm = document.getElementById('com-detail-name');
  if (nm) nm.textContent = client.nombre_display || client.nombre || '—';
  const sub = document.getElementById('com-detail-sub');
  const ent = _getClientEntity(client);
  if (sub) sub.textContent = ent ? ent.name + ' · ' + (client.promotor || 'Sin Promotor') : client.promotor || 'Sin Promotor';

  // Edit button
  const editBtn = document.getElementById('com-detail-edit-btn');
  if (editBtn) editBtn.onclick = () => { ov.style.display = 'none'; openComEdit(client); };

  // Info cards
  const info = document.getElementById('com-detail-info');
  if (info) {
    const agSig = client.tpv_agentes ? client.tpv_agentes.nombre + ' (' + (client.tpv_agentes.siglas||'') + ')' : 'Sin agente';
    info.innerHTML = `
      <div style="background:var(--bg);border-radius:8px;padding:10px">
        <div style="font-size:.6rem;color:var(--muted);margin-bottom:2px">Agente</div>
        <div style="font-size:.78rem;font-weight:600">${escapeHtml(agSig)}</div>
      </div>
      <div style="background:var(--bg);border-radius:8px;padding:10px">
        <div style="font-size:.6rem;color:var(--muted);margin-bottom:2px">Promotor</div>
        <div style="font-size:.78rem;font-weight:600">${escapeHtml(client.promotor || 'Sin Promotor')}</div>
      </div>
      <div style="background:var(--bg);border-radius:8px;padding:10px">
        <div style="font-size:.6rem;color:var(--muted);margin-bottom:2px">Factor IVA</div>
        <div style="font-size:.78rem;font-weight:600">${client.factor_iva || 1.16}</div>
      </div>`;
  }

  // Rates table
  const ratesEl = document.getElementById('com-detail-rates');
  if (ratesEl) {
    const entities = ['efevoo','salem','convenia','comisionista'];
    const labels = { efevoo:'Efevoo', salem:'Salem', convenia:'Convenia', comisionista:'Comisionista' };
    const cards = ['tc','td','amex','ti'];
    const cardLabels = { tc:'Crédito (TC)', td:'Débito (TD)', amex:'Amex', ti:'Internacional (TI)' };
    // Find which entities have data
    const activeEnts = entities.filter(ent => cards.some(ct => parseFloat(client['rate_' + ent + '_' + ct]) > 0));
    if (activeEnts.length === 0) {
      ratesEl.innerHTML = '<div style="color:var(--muted);font-size:.72rem;padding:10px">Sin comisiones configuradas</div>';
    } else {
      let html = '<table class="bt" style="font-size:.72rem;width:100%"><thead><tr><th>Tarjeta</th>';
      activeEnts.forEach(e => html += `<th class="r">${labels[e]}</th>`);
      html += '</tr></thead><tbody>';
      cards.forEach(ct => {
        const hasAny = activeEnts.some(e => parseFloat(client['rate_' + e + '_' + ct]) > 0);
        if (hasAny) {
          html += `<tr><td style="font-weight:600">${cardLabels[ct]}</td>`;
          activeEnts.forEach(e => html += `<td class="r">${_fmtRate(client['rate_' + e + '_' + ct])}</td>`);
          html += '</tr>';
        }
      });
      html += '</tbody></table>';
      ratesEl.innerHTML = html;
    }
  }

  // MSI rates
  const msiEl = document.getElementById('com-detail-msi');
  if (msiEl && client.id) {
    try {
      const msiData = await TPV.getClientMsiRates(client.id);
      if (!msiData || msiData.length === 0) {
        msiEl.innerHTML = '<div style="color:var(--muted);font-size:.72rem;padding:10px">Sin configuración MSI</div>';
      } else {
        const entitiesInMsi = [...new Set(msiData.map(r => r.entity))];
        const entLabels = { efevoo:'Efevoo', salem:'Salem', convenia:'Convenia', comisionista:'Comisionista' };
        let html = '<table class="bt" style="font-size:.72rem;width:100%"><thead><tr><th>Plazo</th><th>Tarjeta</th>';
        entitiesInMsi.forEach(e => html += `<th class="r">${entLabels[e] || e}</th>`);
        html += '</tr></thead><tbody>';
        _MSI_PLAZOS.forEach(plazo => {
          _MSI_CARDS.forEach((card, ci) => {
            const hasAny = entitiesInMsi.some(e => msiData.find(r => r.plazo === plazo && r.entity === e && r.card_type === card && r.rate > 0));
            if (hasAny) {
              html += `<tr>`;
              if (ci === 0) html += `<td rowspan="${_MSI_CARDS.filter((_,j) => entitiesInMsi.some(e => msiData.find(r => r.plazo === plazo && r.entity === e && r.card_type === _MSI_CARDS[j] && r.rate > 0))).length}" style="font-weight:600">${plazo} meses</td>`;
              html += `<td>${card}</td>`;
              entitiesInMsi.forEach(e => {
                const found = msiData.find(r => r.plazo === plazo && r.entity === e && r.card_type === card);
                html += `<td class="r">${found && found.rate > 0 ? (found.rate * 100).toFixed(4) + '%' : '<span style="color:var(--muted)">—</span>'}</td>`;
              });
              html += '</tr>';
            }
          });
        });
        html += '</tbody></table>';
        msiEl.innerHTML = html;
      }
    } catch (e) {
      msiEl.innerHTML = '<div style="color:var(--muted);font-size:.72rem;padding:10px">Error cargando MSI</div>';
    }
  } else if (msiEl) {
    msiEl.innerHTML = '<div style="color:var(--muted);font-size:.72rem;padding:10px">Sin configuración MSI</div>';
  }
}

async function openComEdit(client) {
  _editingClientId = client?.id || null;

  // Title
  const title = document.getElementById('com-edit-title');
  const sub = document.getElementById('com-edit-sub');
  if (title) title.textContent = client ? `Editar: ${client.nombre_display || client.nombre}` : 'Nuevo Cliente';
  if (sub) sub.textContent = client ? `ID: ${client.id} · Última actualización: ${client.updated_at ? new Date(client.updated_at).toLocaleDateString('es-MX') : '—'}` : 'Configura datos y tasas de comisión';

  // Agent dropdown
  const agSel = document.getElementById('com-edit-agente');
  if (agSel) {
    agSel.innerHTML = '<option value="">Sin agente</option>';
    _comAgentesCache.forEach(a => {
      agSel.innerHTML += `<option value="${a.id}">${escapeHtml(a.nombre)} (${escapeHtml(a.siglas || '')})</option>`;
    });
    agSel.value = client?.agente_id || '';
  }

  // Fill basic fields
  const _n = document.getElementById('com-edit-nombre');   if (_n) _n.value = client?.nombre || '';
  const _p = document.getElementById('com-edit-promotor'); if (_p) _p.value = client?.promotor || '';
  const _iv = document.getElementById('com-edit-iva');     if (_iv) _iv.value = client?.factor_iva ?? 1.16;
  const _d = document.getElementById('com-edit-display');  if (_d) _d.value = client?.nombre_display || '';

  // Fill rate fields
  _RATE_FIELDS.forEach(f => {
    const el = document.getElementById('com-edit-' + f);
    if (el) el.value = client ? (parseFloat(client[f]) || 0) : 0;
  });

  // Fill MSI rates
  const msiTbody = document.getElementById('com-edit-msi-tbody');
  if (msiTbody) {
    let msiData = [];
    if (client?.id) {
      try { msiData = await TPV.getClientMsiRates(client.id); } catch (e) { console.warn('MSI load error:', e); }
    }

    let msiHtml = '';
    _MSI_PLAZOS.forEach(plazo => {
      _MSI_CARDS.forEach((card, ci) => {
        msiHtml += `<tr${ci === 0 ? ' style="border-top:2px solid var(--border)"' : ''}>`;
        msiHtml += ci === 0 ? `<td rowspan="${_MSI_CARDS.length}" style="font-weight:600;font-size:.72rem;vertical-align:middle">${plazo} MSI</td>` : '';
        msiHtml += `<td style="font-size:.72rem">${card}</td>`;
        _MSI_ENTITIES.forEach(ent => {
          const existing = msiData.find(r => r.plazo === plazo && r.entity === ent && r.card_type === card);
          const val = existing ? existing.rate : 0;
          msiHtml += `<td><input data-msi-plazo="${plazo}" data-msi-entity="${ent}" data-msi-card="${card}" type="number" step="0.00000001" min="0" max="1" value="${val}" style="width:100%;padding:4px 6px;border:1px solid var(--border);border-radius:4px;font-size:.72rem;text-align:right;background:var(--bg);color:var(--text);box-sizing:border-box"></td>`;
        });
        msiHtml += '</tr>';
      });
    });
    msiTbody.innerHTML = msiHtml;
  }

  // Collapse MSI section
  const msiSection = document.getElementById('com-msi-section');
  if (msiSection) msiSection.style.display = 'none';

  // Show overlay
  const ov = document.getElementById('com-edit-overlay');
  if (ov) ov.style.display = 'flex';
}

function closeComEdit() {
  const ov = document.getElementById('com-edit-overlay');
  if (ov) ov.style.display = 'none';
  _editingClientId = null;
}

// ── RATE CHANGES HISTORY MODAL ──
function openRateChanges() {
  const ov = document.getElementById('rate-changes-overlay');
  if (!ov) return;
  ov.style.display = 'flex';

  const changes = TPV.getRateChanges();
  const tbody = document.getElementById('rate-changes-tbody');
  const info = document.getElementById('rate-changes-info');
  const sub = document.getElementById('rate-changes-subtitle');

  if (!changes.length) {
    if (sub) sub.textContent = 'No hay cambios de tasas registrados';
    if (info) info.innerHTML = '<div style="padding:12px;background:var(--blue-bg);border-radius:8px;font-size:.72rem;color:var(--blue)">ℹ️ Para registrar cambios de tasas, usa la hoja <b>Cambios_Comisiones</b> en la plantilla de configuración Excel y súbela desde la sección de Carga de Datos.</div>';
    if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;padding:30px;color:var(--muted);font-size:.8rem">Sin cambios de tasas registrados</td></tr>';
    return;
  }

  // Count unique clients
  const uniqueClients = new Set(changes.map(c => c.cliente)).size;
  if (sub) sub.textContent = `${changes.length} cambios registrados · ${uniqueClients} clientes afectados`;

  if (info) info.innerHTML = '<div style="padding:10px 12px;background:var(--purple-bg);border-radius:8px;font-size:.72rem;color:var(--purple);margin-bottom:4px">📊 Las comisiones se corrigen automáticamente: para transacciones anteriores al cambio se usa la tasa anterior, para las posteriores la tasa nueva.</div>';

  // Sort: most recent first (descending by fecha_cambio)
  const sorted = [...changes].sort((a, b) =>
    a.fecha_cambio < b.fecha_cambio ? 1 : a.fecha_cambio > b.fecha_cambio ? -1 : 0
  );

  if (tbody) {
    tbody.innerHTML = sorted.map(ch => {
      const delta = ch.tasa_nueva - ch.tasa_anterior;
      const deltaColor = delta > 0 ? 'var(--red)' : delta < 0 ? 'var(--green)' : 'var(--muted)';
      const deltaSign = delta > 0 ? '+' : '';
      return `<tr>
        <td class="bld" style="font-size:.73rem">${ch.cliente}</td>
        <td style="font-size:.72rem"><span style="background:var(--blue-bg);color:var(--blue);padding:1px 6px;border-radius:4px;font-weight:600">${ch.campo}</span></td>
        <td style="font-size:.73rem">${ch.fecha_cambio || '—'}</td>
        <td class="mo" style="text-align:right;font-size:.73rem">${(ch.tasa_anterior * 100).toFixed(4)}%</td>
        <td class="mo" style="text-align:right;font-size:.73rem;font-weight:700">${(ch.tasa_nueva * 100).toFixed(4)}%</td>
        <td class="mo" style="text-align:right;font-size:.73rem;color:${deltaColor};font-weight:700">${deltaSign}${(delta * 100).toFixed(4)}%</td>
        <td style="font-size:.7rem;color:var(--muted);max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">${ch.notas || '—'}</td>
      </tr>`;
    }).join('');
  }
}

function closeRateChanges() {
  const ov = document.getElementById('rate-changes-overlay');
  if (ov) ov.style.display = 'none';
}

async function saveComEdit() {
  const nombre = document.getElementById('com-edit-nombre').value.trim();
  if (!nombre) { toast('⚠️ El nombre del cliente es obligatorio'); return; }

  const client = { nombre };

  // Basic fields
  const display = document.getElementById('com-edit-display').value.trim();
  if (display) client.nombre_display = display;
  const agenteId = document.getElementById('com-edit-agente').value;
  client.agente_id = agenteId ? parseInt(agenteId) : null;
  client.promotor = document.getElementById('com-edit-promotor').value.trim() || 'Sin Promotor';
  client.factor_iva = parseFloat(document.getElementById('com-edit-iva').value) || 1.16;

  // Rate fields
  _RATE_FIELDS.forEach(f => {
    const el = document.getElementById('com-edit-' + f);
    client[f] = el ? parseFloat(el.value) || 0 : 0;
  });

  // If editing existing, pass id
  if (_editingClientId) client.id = _editingClientId;

  try {
    const result = await TPV.saveClient(client);
    const savedId = result?.[0]?.id || _editingClientId;

    // Save MSI rates
    if (savedId) {
      const msiInputs = document.querySelectorAll('#com-edit-msi-tbody input[data-msi-plazo]');
      if (msiInputs.length > 0) {
        const rates = [];
        msiInputs.forEach(inp => {
          const rate = parseFloat(inp.value) || 0;
          if (rate > 0) {
            rates.push({
              plazo: parseInt(inp.dataset.msiPlazo),
              entity: inp.dataset.msiEntity,
              card_type: inp.dataset.msiCard,
              rate
            });
          }
        });
        if (rates.length > 0) {
          await TPV.saveClientMsiRates(savedId, rates);
        }
      }
    }

    toast('✅ Cliente guardado correctamente');
    closeComEdit();
    rTPVComisiones();
  } catch (e) {
    console.error('[COM] saveComEdit error:', e);
    toast('❌ Error al guardar: ' + e.message);
  }
}

  // Expose on window
  window._comClientesCache = _comClientesCache;
  window._comAgentesCache = _comAgentesCache;
  window._editingClientId = _editingClientId;
  window._RATE_FIELDS = _RATE_FIELDS;
  window._MSI_PLAZOS = _MSI_PLAZOS;
  window._MSI_ENTITIES = _MSI_ENTITIES;
  window._MSI_CARDS = _MSI_CARDS;
  window._fmtRate = _fmtRate;
  window.rTPVComisiones = rTPVComisiones;
  window._getCardRate = _getCardRate;
  window._getClientEntity = _getClientEntity;
  window._renderComTable = _renderComTable;
  window.filterComClientes = filterComClientes;
  window.openComDetail = openComDetail;
  window.openComEdit = openComEdit;
  window.closeComEdit = closeComEdit;
  window.openRateChanges = openRateChanges;
  window.closeRateChanges = closeRateChanges;
  window.saveComEdit = saveComEdit;

  // Register views
  if(typeof registerView === 'function'){
    registerView('tpv_comisiones', function(){ return rTPVComisiones(); });
  }

})(window);
