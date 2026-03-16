// GF — TPV: Facturación + CFDI
(function(window) {
  'use strict';

// ══════════════════════════════════════
// ══════════ FACTURACIÓN TERMINALES ══════════
// ════════════════════════════════════════════

const FACTURAS_KEY = 'gf_tpv_facturas';

function facturasLoad(){
  try { return DB.get(FACTURAS_KEY) || { facturas:[] }; }
  catch(e){ return { facturas:[] }; }
}
function facturasSave(d){ DB.set(FACTURAS_KEY, d); }
function facturaExists(data, clientId, periodo){
  return data.facturas.some(f => String(f.client_id) === String(clientId) && f.periodo === periodo);
}
function facturaSubtotal(r){
  return (parseFloat(r.com_efevoo)||0) + (parseFloat(r.com_salem)||0) + (parseFloat(r.com_comisionista)||0);
}

// ── Period helpers ──
function _populateFactMeses(){
  const sel = document.getElementById('fact-mes-sel');
  if(!sel) return;
  const now = new Date();
  let opts = '';
  for(let i=0;i<12;i++){
    const d = new Date(now.getFullYear(), now.getMonth()-i, 1);
    const val = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
    const lbl = (typeof MO!=='undefined'?MO[d.getMonth()]:'') + ' ' + d.getFullYear();
    opts += `<option value="${val}">${lbl}</option>`;
  }
  sel.innerHTML = opts;
}

function setFactMes(which){
  const sel = document.getElementById('fact-mes-sel');
  if(!sel) return;
  const now = new Date();
  let d = which==='last_month' ? new Date(now.getFullYear(), now.getMonth()-1,1) : now;
  const val = d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0');
  sel.value = val;
  rFactTerminales();
}

function _periodoToRange(p){
  const [y,m] = p.split('-').map(Number);
  const from = `${y}-${String(m).padStart(2,'0')}-01`;
  const last = new Date(y, m, 0).getDate();
  const to = `${y}-${String(m).padStart(2,'0')}-${String(last).padStart(2,'0')}`;
  return {from, to};
}

// ── Cache for modal ──
let _factComCache = [];
let _factClientsCache = [];

// ── Main render ──
async function rFactTerminales(){
  // Populate months if empty
  const sel = document.getElementById('fact-mes-sel');
  if(!sel) return;
  if(sel.options.length===0) _populateFactMeses();

  const periodo = sel.value;
  if(!periodo) return;
  const {from, to} = _periodoToRange(periodo);

  // Fetch data in parallel
  const [comRows, clients] = await Promise.all([
    TPV.clientCommissions(from, to),
    TPV.getClients()
  ]);

  // Build promotor map
  const clientMap = {};
  clients.forEach(c => { clientMap[c.id] = c; });

  // Cache for modal
  _factComCache = comRows;
  _factClientsCache = clients;

  // Load saved invoices
  const data = facturasLoad();

  // Split regular vs Convenia
  const regulares = [];
  const conveniaRows = [];
  comRows.forEach(r => {
    const cl = clientMap[r.client_id];
    const prom = cl && cl.promotor ? cl.promotor.toLowerCase().trim() : '';
    const sub = facturaSubtotal(r);
    if(sub <= 0) return; // Skip 0 commission clients
    if(prom.includes('convenia')){
      conveniaRows.push(r);
    } else {
      regulares.push(r);
    }
  });

  // Calculate KPIs
  let totalPendiente = 0, totalFacturado = 0, totalComisiones = 0;
  regulares.forEach(r => {
    const sub = facturaSubtotal(r);
    totalComisiones += sub;
    if(facturaExists(data, r.client_id, periodo)){
      totalFacturado += sub;
    } else {
      totalPendiente += sub;
    }
  });

  let conveniaSubtotal = 0;
  conveniaRows.forEach(r => { conveniaSubtotal += facturaSubtotal(r); });
  totalComisiones += conveniaSubtotal;

  const conveniaFacturada = facturaExists(data, 'CONVENIA', periodo);
  if(conveniaFacturada){
    totalFacturado += conveniaSubtotal;
  } else {
    totalPendiente += conveniaSubtotal;
  }

  // Render KPIs
  const _f = n => fmtTPVFull(n,2);
  document.getElementById('fact-kpi-pendiente').textContent = _f(totalPendiente);
  document.getElementById('fact-kpi-facturado').textContent = _f(totalFacturado);
  document.getElementById('fact-kpi-total').textContent = _f(totalComisiones);

  // Render regular table
  const tbody = document.getElementById('fact-tbody');
  if(regulares.length === 0){
    tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:30px;font-size:.78rem">No hay clientes con comisiones en este periodo</td></tr>';
  } else {
    tbody.innerHTML = regulares.sort((a,b) => facturaSubtotal(b)-facturaSubtotal(a)).map(r => {
      const sub = facturaSubtotal(r);
      const iva = sub * 0.16;
      const total = sub + iva;
      const fact = data.facturas.find(f => String(f.client_id)===String(r.client_id) && f.periodo===periodo);
      if(fact){
        return `<tr data-name="${(r.cliente||'').toLowerCase()}">
          <td style="font-weight:600">${r.cliente}</td>
          <td class="r">${fmtTPVFull(sub,2)}</td>
          <td class="r">${fmtTPVFull(iva,2)}</td>
          <td class="r" style="font-weight:700">${fmtTPVFull(total,2)}</td>
          <td style="text-align:center"><span class="pill" style="background:var(--green-bg);color:var(--green)">Facturada</span></td>
          <td style="text-align:center;font-size:.75rem">${fact.numero_factura||'—'}</td>
          <td style="text-align:center;font-size:.75rem">${fact.fecha||'—'}</td>
          <td style="text-align:center"><button onclick="deleteFactura('${fact.id}')" style="background:none;border:none;cursor:pointer;font-size:.85rem" title="Eliminar factura">🗑</button></td>
        </tr>`;
      } else {
        return `<tr data-name="${(r.cliente||'').toLowerCase()}">
          <td style="font-weight:600">${r.cliente}</td>
          <td class="r">${fmtTPVFull(sub,2)}</td>
          <td class="r">${fmtTPVFull(iva,2)}</td>
          <td class="r" style="font-weight:700">${fmtTPVFull(total,2)}</td>
          <td style="text-align:center"><span class="pill" style="background:var(--red-bg);color:var(--red)">Pendiente</span></td>
          <td style="text-align:center">—</td><td style="text-align:center">—</td>
          <td style="text-align:center"><button onclick="openFacturaModal(${r.client_id},'${periodo}')" class="btn" style="font-size:.62rem;height:24px;padding:0 10px">+ Factura</button></td>
        </tr>`;
      }
    }).join('');
  }

  // Convenia section
  _renderFactConvenia(conveniaRows, data, periodo);

}

// ── Convenia Renderer ──
function _renderFactConvenia(rows, data, periodo){
  const section = document.getElementById('fact-convenia-section');
  if(rows.length === 0){ section.style.display='none'; return; }
  section.style.display = 'block';

  let subtotal = 0;
  rows.forEach(r => { subtotal += facturaSubtotal(r); });

  const ivaConv = subtotal * 0.16;
  document.getElementById('fact-conv-subtotal').textContent = fmtTPVFull(subtotal,2);
  document.getElementById('fact-conv-neto').textContent = fmtTPVFull(subtotal + ivaConv,2);

  const fact = data.facturas.find(f => f.client_id==='CONVENIA' && f.periodo===periodo);
  const icoEl = document.getElementById('fact-conv-ico');
  const estEl = document.getElementById('fact-conv-estado');
  const actEl = document.getElementById('fact-conv-action');

  if(fact){
    icoEl.style.background = 'var(--green-bg)'; icoEl.style.color = 'var(--green)'; icoEl.textContent = '✅';
    estEl.textContent = 'Facturada'; estEl.style.color = 'var(--green)';
    actEl.innerHTML = `<div style="font-size:.7rem;margin-top:4px">${fact.numero_factura||''} — ${fact.fecha||''} <button onclick="deleteFactura('${fact.id}')" style="background:none;border:none;cursor:pointer;font-size:.8rem" title="Eliminar">🗑</button></div>`;
  } else {
    icoEl.style.background = 'var(--red-bg)'; icoEl.style.color = 'var(--red)'; icoEl.textContent = '📋';
    estEl.textContent = 'Pendiente'; estEl.style.color = 'var(--red)';
    actEl.innerHTML = `<button onclick="openFacturaModal('CONVENIA','${periodo}')" class="btn" style="font-size:.66rem;height:26px;margin-top:6px">+ Factura Consolidada</button>`;
  }

  // Sub-clients table
  const tbody = document.getElementById('fact-conv-tbody');
  let totalEf=0, totalSa=0, totalCo=0, totalSub=0;
  tbody.innerHTML = rows.sort((a,b)=>facturaSubtotal(b)-facturaSubtotal(a)).map(r => {
    const ef = parseFloat(r.com_efevoo)||0;
    const sa = parseFloat(r.com_salem)||0;
    const co = parseFloat(r.com_comisionista)||0;
    const sub = ef+sa+co;
    totalEf+=ef; totalSa+=sa; totalCo+=co; totalSub+=sub;
    return `<tr>
      <td style="font-weight:600">${r.cliente}</td>
      <td class="r">${fmtTPVFull(ef,2)}</td>
      <td class="r">${fmtTPVFull(sa,2)}</td>
      <td class="r">${fmtTPVFull(co,2)}</td>
      <td class="r" style="font-weight:700">${fmtTPVFull(sub,2)}</td>
    </tr>`;
  }).join('');
  // Total row
  tbody.innerHTML += `<tr style="background:var(--bg);font-weight:700">
    <td>TOTAL</td>
    <td class="r">${fmtTPVFull(totalEf,2)}</td>
    <td class="r">${fmtTPVFull(totalSa,2)}</td>
    <td class="r">${fmtTPVFull(totalCo,2)}</td>
    <td class="r" style="color:var(--purple)">${fmtTPVFull(totalSub,2)}</td>
  </tr>`;
}

// ── Modal: Open ──
let _factModalClientId = null;
let _factModalPeriodo = null;

function openFacturaModal(clientId, periodo){
  _factModalClientId = clientId;
  const ov = document.getElementById('factura-overlay');
  ov.style.display = 'flex';

  // Set date
  document.getElementById('fact-modal-fecha').value = new Date().toISOString().split('T')[0];
  document.getElementById('fact-modal-numero').value = '';
  document.getElementById('fact-modal-notas').value = '';

  // Period
  const sel = document.getElementById('fact-mes-sel');
  const per = periodo || (sel ? sel.value : '');
  _factModalPeriodo = per;
  document.getElementById('fact-modal-periodo').value = per;

  // Client selector
  const cWrap = document.getElementById('fact-modal-cliente-wrap');
  const cSel = document.getElementById('fact-modal-cliente');
  const titleEl = document.getElementById('fact-modal-title');

  if(clientId === 'CONVENIA'){
    cWrap.style.display = 'none';
    titleEl.textContent = '🧾 Factura Consolidada — Convenia';
  } else {
    titleEl.textContent = '🧾 Registrar Factura';
    if(clientId){
      cWrap.style.display = 'none';
    } else {
      cWrap.style.display = 'block';
      // Populate selector with all clients that have commissions
      cSel.innerHTML = '<option value="">— Seleccionar —</option>' +
        _factComCache.filter(r => facturaSubtotal(r)>0).map(r =>
          `<option value="${r.client_id}">${r.cliente}</option>`
        ).join('');
    }
  }

  facturaUpdatePreview();
}

function closeFacturaModal(){
  document.getElementById('factura-overlay').style.display = 'none';
  _factModalClientId = null;
  _factModalPeriodo = null;
}

// ── Modal: Preview ──
function facturaUpdatePreview(){
  const preview = document.getElementById('fact-modal-preview');
  let sub = 0;

  if(_factModalClientId === 'CONVENIA'){
    // Sum all Convenia sub-clients
    const clientMap = {};
    _factClientsCache.forEach(c => { clientMap[c.id] = c; });
    _factComCache.forEach(r => {
      const cl = clientMap[r.client_id];
      const prom = cl && cl.promotor ? cl.promotor.toLowerCase().trim() : '';
      if(prom.includes('convenia')) sub += facturaSubtotal(r);
    });
  } else if(_factModalClientId){
    const row = _factComCache.find(r => String(r.client_id)===String(_factModalClientId));
    if(row) sub = facturaSubtotal(row);
  } else {
    // Check selector
    const cSel = document.getElementById('fact-modal-cliente');
    const cid = cSel ? cSel.value : '';
    if(cid){
      const row = _factComCache.find(r => String(r.client_id)===String(cid));
      if(row) sub = facturaSubtotal(row);
    }
  }

  if(sub <= 0){ preview.style.display='none'; return; }
  preview.style.display = 'block';

  const iva = sub * 0.16;
  const total = sub + iva;

  document.getElementById('fact-prev-subtotal').textContent = fmtTPVFull(sub,2);
  document.getElementById('fact-prev-iva').textContent = fmtTPVFull(iva,2);
  document.getElementById('fact-prev-total').textContent = fmtTPVFull(total,2);
}

// ── Modal: Submit ──
function submitFactura(){
  const periodo = document.getElementById('fact-modal-periodo').value;
  if(!periodo){ toast('⚠️ Selecciona un periodo'); return; }

  let clientId = _factModalClientId;
  let clienteName = '';

  if(!clientId){
    const cSel = document.getElementById('fact-modal-cliente');
    clientId = cSel ? cSel.value : '';
    if(!clientId){ toast('⚠️ Selecciona un cliente'); return; }
    const opt = cSel.options[cSel.selectedIndex];
    clienteName = opt ? opt.textContent : '';
  } else if(clientId === 'CONVENIA'){
    clienteName = 'CONVENIA (Consolidada)';
  } else {
    const row = _factComCache.find(r => String(r.client_id)===String(clientId));
    clienteName = row ? row.cliente : 'Cliente #'+clientId;
  }

  const data = facturasLoad();
  const perKey = periodo.substring(0,7); // YYYY-MM

  // Check duplicate
  if(facturaExists(data, clientId, perKey)){
    toast('⚠️ Ya existe una factura para este cliente en este periodo');
    return;
  }

  // Calculate amounts
  let sub = 0;
  if(clientId === 'CONVENIA'){
    const clientMap = {};
    _factClientsCache.forEach(c => { clientMap[c.id] = c; });
    _factComCache.forEach(r => {
      const cl = clientMap[r.client_id];
      const prom = cl && cl.promotor ? cl.promotor.toLowerCase().trim() : '';
      if(prom.includes('convenia')) sub += facturaSubtotal(r);
    });
  } else {
    const row = _factComCache.find(r => String(r.client_id)===String(clientId));
    if(row) sub = facturaSubtotal(row);
  }

  const iva = sub * 0.16;
  const total = sub + iva;

  const factura = {
    id: 'f_' + Date.now(),
    client_id: clientId === 'CONVENIA' ? 'CONVENIA' : Number(clientId),
    cliente: clienteName,
    periodo: perKey,
    subtotal: Math.round(sub*100)/100,
    iva: Math.round(iva*100)/100,
    total: Math.round(total*100)/100,
    numero_factura: document.getElementById('fact-modal-numero').value.trim(),
    fecha: document.getElementById('fact-modal-fecha').value,
    notas: document.getElementById('fact-modal-notas').value.trim(),
    registrado: new Date().toISOString()
  };

  data.facturas.push(factura);
  facturasSave(data);
  closeFacturaModal();
  toast('✅ Factura registrada correctamente');
  rFactTerminales();
}

// ── CRUD ──
function deleteFactura(id){
  if(!confirm('¿Eliminar esta factura?')) return;
  const data = facturasLoad();
  data.facturas = data.facturas.filter(f=>f.id!==id);
  facturasSave(data);
  toast('Factura eliminada');
  rFactTerminales();
}

// ── CSV Export ──
function exportFacturasCSV(){
  const sel = document.getElementById('fact-mes-sel');
  const periodo = sel ? sel.value : '';
  if(!periodo){ toast('⚠️ Selecciona un periodo'); return; }
  const data = facturasLoad();
  const rows = data.facturas.filter(f=>f.periodo===periodo);
  if(rows.length===0){ toast('No hay facturas para exportar en este periodo'); return; }

  let csv = 'Cliente,Periodo,Subtotal (sin IVA),IVA 16%,Total,No. Factura,Fecha,Notas\n';
  rows.forEach(f=>{
    csv += `"${f.cliente}","${f.periodo}",${f.subtotal},${f.iva},${f.total},"${f.numero_factura||''}","${f.fecha||''}","${(f.notas||'').replace(/"/g,'""')}"\n`;
  });

  const blob = new Blob([csv], {type:'text/csv'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url; a.download = `facturas_tpv_${periodo}.csv`; a.click();
  URL.revokeObjectURL(url);
  toast('📥 CSV descargado');
}

// ══════════════════════════════════════
// ══════════ CARGA FACTURAS CFDI ══════════
// ════════════════════════════════════════════

const CFDI_KEY = 'gf_cfdi_facturas';
let CF_PREVIEW = null;
let CF_PDF_BASE64 = null;
let CF_PDF_BLOB_URL = null;

const CF_EMPRESAS = {
  salem_terminales: { label:'Salem Terminales', rfc:'SIN2202283E4', nombre:'SALEM INTERNACIONAL' },
  salem_tarjetas:   { label:'Salem Tarjetas',   rfc:'SIN2202283E4', nombre:'SALEM INTERNACIONAL' },
  endless:          { label:'Endless Money',     rfc:'', nombre:'ENDLESS' },
  dynamo:           { label:'Dynamo Finance',    rfc:'', nombre:'DYNAMO' },
  wirebit:          { label:'Wirebit',           rfc:'', nombre:'WIREBIT' }
};

const CF_MESES = {
  ENERO:'01',FEBRERO:'02',MARZO:'03',ABRIL:'04',MAYO:'05',JUNIO:'06',
  JULIO:'07',AGOSTO:'08',SEPTIEMBRE:'09',OCTUBRE:'10',NOVIEMBRE:'11',DICIEMBRE:'12'
};

// ── Storage ──
function cfdiLoad(){
  try { return DB.get(CFDI_KEY) || { uploads:[] }; }
  catch(e){ return { uploads:[] }; }
}
function cfdiSave(d){ DB.set(CFDI_KEY, d); }

// ── Entry point ──
function rCargaFacturas(){
  CF_PREVIEW = null;
  CF_PDF_BASE64 = null;
  document.getElementById('cf-preview').style.display = 'none';
  const st = document.getElementById('cf-status');
  st.style.display = 'none';
  cfRenderHistory();
}

// ── Empresa/Cliente selectors ──
function cfOnEmpresaChange(){
  const emp = document.getElementById('cf-empresa').value;
  const cSel = document.getElementById('cf-cliente');
  cSel.innerHTML = '<option value="">— Se detectará automáticamente —</option>';
  if(!emp) return;

  if(emp === 'salem_terminales'){
    // Populate from TPV clients
    if(typeof TPV !== 'undefined' && TPV.getClients){
      TPV.getClients().then(clients => {
        clients.sort((a,b) => (a.name||'').localeCompare(b.name||''));
        clients.forEach(c => {
          cSel.innerHTML += `<option value="${c.id}">${c.name}</option>`;
        });
      }).catch(()=>{});
    }
  } else if(emp === 'endless'){
    if(typeof END_CREDITS !== 'undefined'){
      const names = [...new Set(END_CREDITS.map(c => c.cl))].sort();
      names.forEach(n => { cSel.innerHTML += `<option value="${n}">${n}</option>`; });
    }
  } else if(emp === 'dynamo'){
    if(typeof DYN_CREDITS !== 'undefined'){
      const names = [...new Set(DYN_CREDITS.map(c => c.cl))].sort();
      names.forEach(n => { cSel.innerHTML += `<option value="${n}">${n}</option>`; });
    }
  }
  // salem_tarjetas / wirebit: auto-detect only
}

// ── File handling ──
function cfHandleDrop(e){
  e.preventDefault();
  e.currentTarget.style.borderColor = 'var(--border2)';
  const file = e.dataTransfer.files[0];
  if(!file) return;
  if(!file.name.toLowerCase().endsWith('.pdf')){
    cfSetStatus('error', 'Solo se aceptan archivos PDF');
    return;
  }
  cfLoadFile(file);
}

function cfLoadFile(file){
  if(!file) return;
  if(!file.name.toLowerCase().endsWith('.pdf')){
    cfSetStatus('error', 'Solo se aceptan archivos PDF');
    return;
  }
  cfSetStatus('loading', 'Analizando factura PDF...');
  const reader = new FileReader();
  reader.onload = function(ev){
    CF_PDF_BASE64 = ev.target.result;
    cfAnalyzePDF(ev.target.result, file.name);
  };
  reader.onerror = function(){ cfSetStatus('error', 'Error al leer el archivo'); };
  reader.readAsDataURL(file);
}

// ── Status helper ──
function cfSetStatus(type, msg){
  const el = document.getElementById('cf-status');
  el.style.display = 'block';
  if(type === 'loading'){
    el.style.background = 'var(--blue-bg)'; el.style.color = 'var(--blue)';
    el.innerHTML = '⏳ ' + msg;
  } else if(type === 'ok'){
    el.style.background = 'var(--green-bg)'; el.style.color = 'var(--green)';
    el.innerHTML = '✅ ' + msg;
  } else {
    el.style.background = 'var(--red-bg)'; el.style.color = 'var(--red)';
    el.innerHTML = '⚠️ ' + msg;
  }
}

// ── PDF Analysis ──
async function cfAnalyzePDF(base64, filename){
  try {
    // Extract PDF bytes
    const raw = atob(base64.split(',')[1]);
    const bytes = new Uint8Array(raw.length);
    for(let i=0;i<raw.length;i++) bytes[i] = raw.charCodeAt(i);

    // Use PDF.js
    const pdf = await pdfjsLib.getDocument({data: bytes}).promise;
    let fullText = '';
    for(let i=1; i<=pdf.numPages; i++){
      const page = await pdf.getPage(i);
      const tc = await page.getTextContent();
      fullText += tc.items.map(it => it.str).join(' ') + '\n';
    }

    if(!fullText.trim()){
      cfSetStatus('error', 'No se pudo extraer texto del PDF');
      return;
    }

    // Parse CFDI
    const data = cfParseCFDI(fullText);
    data.filename = filename;

    // Auto-detect empresa
    const autoEmp = cfAutoDetectEmpresa(data.rfc_emisor);
    if(autoEmp){
      const empSel = document.getElementById('cf-empresa');
      if(!empSel.value) empSel.value = autoEmp;
    }

    // Check duplicate
    const store = cfdiLoad();
    if(data.folio_fiscal){
      const dup = store.uploads.find(u => u.folio_fiscal === data.folio_fiscal);
      if(dup){
        cfSetStatus('error', 'Esta factura ya fue cargada (folio fiscal duplicado)');
        return;
      }
    }

    CF_PREVIEW = data;
    cfSetStatus('ok', 'Datos extraídos correctamente');
    cfRenderPreview();

  } catch(err){
    cfSetStatus('error', 'Error al analizar el PDF: ' + err.message);
    console.error('[CFDI Parse]', err);
  }
}

// ── CFDI Parser ──
// Helper: extract value between a label and the next known label (PDF text has all fields inline)
function _cfExtract(text, label, stopLabels){
  const rx = new RegExp(label + '[:\\s]+(.*)', 'i');
  const m = text.match(rx);
  if(!m) return '';
  let val = m[1];
  // Cut at the first occurrence of any stop label
  for(const stop of stopLabels){
    const idx = val.search(new RegExp('\\s{2,}' + stop, 'i'));
    if(idx > 0) val = val.substring(0, idx);
  }
  return val.trim().replace(/\s+/g,' ');
}

function cfParseCFDI(text){
  const d = {
    rfc_emisor: '', nombre_emisor: '',
    rfc_receptor: '', nombre_receptor: '',
    folio_fiscal: '', fecha_emision: '',
    descripcion: '', periodo: '',
    subtotal: 0, iva_amount: 0, total: 0,
    moneda: '', forma_pago: '', metodo_pago: '',
    uso_cfdi: '', efecto: ''
  };

  // RFC emisor
  let m = text.match(/RFC\s*(?:del?\s*)?emisor[:\s]*([A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3})/i);
  if(m) d.rfc_emisor = m[1].toUpperCase();

  // RFC receptor
  m = text.match(/RFC\s*(?:del?\s*)?receptor[:\s]*([A-ZÑ&]{3,4}\d{6}[A-Z0-9]{3})/i);
  if(m) d.rfc_receptor = m[1].toUpperCase();

  // Nombre emisor — stop at "RFC receptor"
  d.nombre_emisor = _cfExtract(text, 'Nombre\\s*(?:del?\\s*)?emisor', ['RFC\\s*receptor', 'Código', 'Nombre\\s*receptor']).substring(0,80);

  // Nombre receptor — stop at "Código postal" or "Régimen"
  d.nombre_receptor = _cfExtract(text, 'Nombre\\s*(?:del?\\s*)?receptor', ['Código\\s*postal', 'Régimen', 'Uso\\s*CFDI']).substring(0,80);

  // Folio fiscal (UUID)
  m = text.match(/([A-F0-9]{8}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{4}-[A-F0-9]{12})/i);
  if(m) d.folio_fiscal = m[1].toUpperCase();

  // Fecha emisión — look in "fecha y hora de emisión:" or standalone date
  m = text.match(/fecha\s*(?:y\s*hora\s*)?(?:de\s*)?emisi[oó]n[:\s]*(?:\d{5}\s+)?(\d{4}-\d{2}-\d{2})\s*[T ]?\s*(\d{2}:\d{2}:\d{2})?/i);
  if(!m) m = text.match(/(\d{4}-\d{2}-\d{2})\s*[T ]?\s*(\d{2}:\d{2}:\d{2})?/);
  if(m) d.fecha_emision = m[1] + (m[2] ? ' ' + m[2] : '');

  // Subtotal — "Subtotal   $ 117,732.41"
  m = text.match(/Subtotal\s+\$\s*([\d,]+\.?\d*)/i);
  if(!m) m = text.match(/Sub\s*total[:\s]*\$?\s*([\d,]+\.?\d*)/i);
  if(m) d.subtotal = parseFloat(m[1].replace(/,/g,'')) || 0;

  // IVA — "Impuestos trasladados   IVA   16.00%   $ 18,837.19"
  m = text.match(/Impuestos\s+trasladados\s+IVA\s+[\d.]+%\s+\$\s*([\d,]+\.?\d*)/i);
  if(!m){
    // Fallback: "IVA   Traslado   base   Tasa   16.00%   amount"
    m = text.match(/IVA\s+Traslado\s+[\d,.]+\s+Tasa\s+[\d.]+%\s+([\d,]+\.?\d*)/i);
  }
  if(!m){
    // Fallback: just $ after 16.00%
    m = text.match(/16\.00%\s+\$\s*([\d,]+\.?\d*)/i);
  }
  if(m) d.iva_amount = parseFloat(m[1].replace(/,/g,'')) || 0;

  // Total — "Total   $ 136,569.60" but NOT "Subtotal"
  m = text.match(/(?:^|[^b])Total\s+\$\s*([\d,]+\.?\d*)/i);
  if(!m) m = text.match(/\bTotal\s+\$\s*([\d,]+\.?\d*)/i);
  if(m) d.total = parseFloat(m[1].replace(/,/g,'')) || 0;
  // If total matched subtotal, try finding the larger one
  if(d.total === d.subtotal && d.iva_amount > 0){
    const allTotals = [...text.matchAll(/Total\s+\$\s*([\d,]+\.?\d*)/gi)];
    if(allTotals.length >= 2){
      d.total = parseFloat(allTotals[allTotals.length-1][1].replace(/,/g,'')) || d.total;
    }
  }

  // Descripción — "Descripción   COMISION MERCANTIL FEBRERO 2026   Impuesto"
  d.descripcion = _cfExtract(text, 'Descripci[oó]n', ['Impuesto', 'Número\\s*de\\s*pedimento', 'Número\\s*de\\s*cuenta']).substring(0,200);

  // Periodo from description (e.g. "COMISION MERCANTIL FEBRERO 2026")
  for(const [mes, num] of Object.entries(CF_MESES)){
    const rx = new RegExp(mes + '\\s*(\\d{4})', 'i');
    const pm = d.descripcion.match(rx) || text.match(rx);
    if(pm){
      d.periodo = pm[1] + '-' + num;
      break;
    }
  }

  // Moneda — "Moneda:   Peso Mexicano  Forma de pago:"
  d.moneda = _cfExtract(text, 'Moneda', ['Forma\\s*de\\s*pago', 'Método']).substring(0,30);

  // Forma de pago — "Forma de pago:   Por definir  Método de pago:"
  d.forma_pago = _cfExtract(text, 'Forma\\s*de\\s*pago', ['Método\\s*de\\s*pago', 'Subtotal']).substring(0,50);

  // Método de pago — "Método de pago:   Pago en parcialidades...  Subtotal"
  d.metodo_pago = _cfExtract(text, 'M[eé]todo\\s*de\\s*pago', ['Subtotal', 'Total', 'Moneda']).substring(0,80);

  // Uso CFDI — "Uso CFDI:   Gastos en general.  No. de serie"
  d.uso_cfdi = _cfExtract(text, 'Uso\\s*(?:del?\\s*)?CFDI', ['No\\.\\s*de\\s*serie', 'Código\\s*postal', 'Efecto']).substring(0,50);

  // Efecto — "Efecto de comprobante:   Ingreso  Régimen fiscal:"
  d.efecto = _cfExtract(text, 'Efecto\\s*(?:del?\\s*)?comprobante', ['Régimen', 'Exportación', 'Conceptos']).substring(0,30);

  return d;
}

// ── Auto-detect empresa from RFC ──
function cfAutoDetectEmpresa(rfc){
  if(!rfc) return null;
  for(const [key, emp] of Object.entries(CF_EMPRESAS)){
    if(emp.rfc && emp.rfc === rfc) return key;
  }
  return null;
}

// ── Preview ──
function cfRenderPreview(){
  if(!CF_PREVIEW) return;
  const d = CF_PREVIEW;
  const prev = document.getElementById('cf-preview');
  prev.style.display = 'block';

  document.getElementById('cf-p-rfc-emisor').textContent = d.rfc_emisor || '—';
  document.getElementById('cf-p-nombre-emisor').textContent = d.nombre_emisor || '—';
  document.getElementById('cf-p-rfc-receptor').textContent = d.rfc_receptor || '—';
  document.getElementById('cf-p-nombre-receptor').textContent = d.nombre_receptor || '—';
  document.getElementById('cf-p-folio').textContent = d.folio_fiscal || '—';
  document.getElementById('cf-p-fecha').textContent = d.fecha_emision || '—';
  document.getElementById('cf-p-descripcion').textContent = d.descripcion || '—';
  document.getElementById('cf-p-periodo').textContent = d.periodo || '—';
  document.getElementById('cf-p-moneda').textContent = d.moneda || '—';
  document.getElementById('cf-p-subtotal').textContent = d.subtotal ? fmtTPVFull(d.subtotal,2) : '—';
  document.getElementById('cf-p-iva').textContent = d.iva_amount ? fmtTPVFull(d.iva_amount,2) : '—';
  document.getElementById('cf-p-total').textContent = d.total ? fmtTPVFull(d.total,2) : '—';
}

function cfClearPreview(){
  CF_PREVIEW = null;
  CF_PDF_BASE64 = null;
  document.getElementById('cf-preview').style.display = 'none';
  document.getElementById('cf-status').style.display = 'none';
  // Reset file input
  const fi = document.getElementById('cf-file-input');
  if(fi) fi.value = '';
}

// ── Import / Save ──
function cfImport(){
  if(!CF_PREVIEW || !CF_PDF_BASE64){
    toast('⚠️ No hay factura para guardar');
    return;
  }

  const empSel = document.getElementById('cf-empresa');
  const emp = empSel.value;
  if(!emp){
    toast('⚠️ Selecciona la empresa emisora');
    return;
  }

  const d = CF_PREVIEW;
  const store = cfdiLoad();

  // Check duplicate
  if(d.folio_fiscal){
    const dup = store.uploads.find(u => u.folio_fiscal === d.folio_fiscal);
    if(dup){
      toast('⚠️ Esta factura ya fue cargada (folio duplicado)');
      return;
    }
  }

  // Cap at 100
  if(store.uploads.length >= 100){
    toast('⚠️ Límite de 100 facturas alcanzado. Elimina alguna para continuar.');
    return;
  }

  const cliSel = document.getElementById('cf-cliente');
  const record = {
    id: 'cfdi_' + Date.now(),
    empresa: emp,
    empresa_label: CF_EMPRESAS[emp]?.label || emp,
    rfc_emisor: d.rfc_emisor,
    nombre_emisor: d.nombre_emisor,
    rfc_receptor: d.rfc_receptor,
    nombre_receptor: d.nombre_receptor,
    folio_fiscal: d.folio_fiscal,
    fecha_emision: d.fecha_emision,
    descripcion: d.descripcion,
    periodo: d.periodo,
    subtotal: d.subtotal,
    iva_amount: d.iva_amount,
    total: d.total,
    moneda: d.moneda,
    forma_pago: d.forma_pago,
    metodo_pago: d.metodo_pago,
    uso_cfdi: d.uso_cfdi,
    efecto: d.efecto,
    client_id: cliSel.value || null,
    factura_id: null,
    pdf_base64: CF_PDF_BASE64,
    filename: d.filename || 'factura.pdf',
    uploaded_at: new Date().toISOString()
  };

  // Try to link to existing factura
  cfLinkToFactura(record);

  store.uploads.push(record);
  cfdiSave(store);

  toast('✅ Factura CFDI guardada correctamente');
  cfClearPreview();
  cfRenderHistory();
}

// ── Link to existing factura record ──
function cfLinkToFactura(record){
  try {
    const factData = facturasLoad();
    if(!factData.facturas || !factData.facturas.length) return;
    const per = record.periodo;
    if(!per) return;

    // Try matching by client_id + periodo
    let match = null;
    if(record.client_id){
      match = factData.facturas.find(f => String(f.client_id)===String(record.client_id) && f.periodo===per);
    }
    // Or by receptor name containing client name
    if(!match && record.nombre_receptor){
      const recName = record.nombre_receptor.toUpperCase();
      match = factData.facturas.find(f => {
        if(f.periodo !== per) return false;
        return recName.includes((f.cliente||'').toUpperCase()) || (f.cliente||'').toUpperCase().includes(recName);
      });
    }

    if(match){
      record.factura_id = match.id;
      // Update factura with folio fiscal
      if(record.folio_fiscal){
        match.folio_fiscal = record.folio_fiscal;
        match.cfdi_id = record.id;
        facturasSave(factData);
      }
    }
  } catch(e){ console.warn('[cfLinkToFactura]', e); }
}

// ── History table ──
function cfRenderHistory(){
  const store = cfdiLoad();
  const tbody = document.getElementById('cf-tbody');
  if(!store.uploads || store.uploads.length === 0){
    tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:30px;font-size:.78rem">No hay facturas cargadas</td></tr>';
    return;
  }

  tbody.innerHTML = store.uploads.sort((a,b) => (b.uploaded_at||'').localeCompare(a.uploaded_at||'')).map((u,i) => {
    const fecha = u.uploaded_at ? u.uploaded_at.substring(0,10) : '—';
    const folio = u.folio_fiscal ? u.folio_fiscal.substring(0,13) + '...' : '—';
    const vinc = u.factura_id ? '<span class="pill" style="background:var(--green-bg);color:var(--green)">Sí</span>' : '<span class="pill" style="background:var(--bg);color:var(--muted)">No</span>';
    return `<tr data-name="${(u.nombre_receptor||'').toLowerCase()} ${(u.empresa_label||'').toLowerCase()}">
      <td style="text-align:center;font-size:.72rem">${fecha}</td>
      <td style="font-size:.75rem">${u.empresa_label||'—'}</td>
      <td style="font-weight:600;font-size:.75rem">${u.nombre_receptor||'—'}</td>
      <td style="text-align:center;font-size:.75rem">${u.periodo||'—'}</td>
      <td class="r">${u.subtotal ? fmtTPVFull(u.subtotal,2) : '—'}</td>
      <td class="r" style="font-weight:700">${u.total ? fmtTPVFull(u.total,2) : '—'}</td>
      <td style="text-align:center;font-size:.65rem" title="${u.folio_fiscal||''}">${folio}</td>
      <td style="text-align:center">${vinc}</td>
      <td style="text-align:center">
        <button onclick="cfViewPDF(${i})" style="background:none;border:none;cursor:pointer;font-size:.8rem" title="Ver PDF">📄</button>
        <button onclick="cfDeleteUpload(${i})" style="background:none;border:none;cursor:pointer;font-size:.8rem" title="Eliminar">🗑</button>
      </td>
    </tr>`;
  }).join('');
}

function cfFilterHistory(q){
  const rows = document.querySelectorAll('#cf-tbody tr');
  const term = (q||'').toLowerCase();
  rows.forEach(r => {
    const name = r.getAttribute('data-name') || '';
    r.style.display = name.includes(term) ? '' : 'none';
  });
}

// ── PDF Viewer ──
function cfViewPDF(index){
  const store = cfdiLoad();
  const u = store.uploads.sort((a,b) => (b.uploaded_at||'').localeCompare(a.uploaded_at||''))[index];
  if(!u || !u.pdf_base64) { toast('⚠️ PDF no disponible'); return; }

  // Convert base64 to blob URL
  const raw = atob(u.pdf_base64.split(',')[1]);
  const bytes = new Uint8Array(raw.length);
  for(let i=0;i<raw.length;i++) bytes[i] = raw.charCodeAt(i);
  const blob = new Blob([bytes], {type:'application/pdf'});
  CF_PDF_BLOB_URL = URL.createObjectURL(blob);

  document.getElementById('cf-pdf-title').textContent = u.filename || 'Factura PDF';
  document.getElementById('cf-pdf-iframe').src = CF_PDF_BLOB_URL;
  document.getElementById('cf-pdf-overlay').style.display = 'flex';
}

function cfClosePDFModal(){
  document.getElementById('cf-pdf-overlay').style.display = 'none';
  document.getElementById('cf-pdf-iframe').src = '';
  if(CF_PDF_BLOB_URL){ URL.revokeObjectURL(CF_PDF_BLOB_URL); CF_PDF_BLOB_URL = null; }
}

function cfDownloadPDF(){
  if(!CF_PDF_BLOB_URL) return;
  const title = document.getElementById('cf-pdf-title').textContent || 'factura.pdf';
  const a = document.createElement('a');
  a.href = CF_PDF_BLOB_URL;
  a.download = title;
  a.click();
}

function cfDeleteUpload(index){
  if(!confirm('¿Eliminar esta factura cargada?')) return;
  const store = cfdiLoad();
  const sorted = store.uploads.sort((a,b) => (b.uploaded_at||'').localeCompare(a.uploaded_at||''));
  sorted.splice(index, 1);
  store.uploads = sorted;
  cfdiSave(store);
  toast('Factura eliminada');
  cfRenderHistory();
}

  // Expose on window
  // Facturación
  window.FACTURAS_KEY = FACTURAS_KEY;
  window.facturasLoad = facturasLoad;
  window.facturasSave = facturasSave;
  window.facturaExists = facturaExists;
  window.facturaSubtotal = facturaSubtotal;
  window._populateFactMeses = _populateFactMeses;
  window.setFactMes = setFactMes;
  window._periodoToRange = _periodoToRange;
  window._factComCache = _factComCache;
  window._factClientsCache = _factClientsCache;
  window.rFactTerminales = rFactTerminales;
  window._renderFactConvenia = _renderFactConvenia;
  window._factModalClientId = _factModalClientId;
  window._factModalPeriodo = _factModalPeriodo;
  window.openFacturaModal = openFacturaModal;
  window.closeFacturaModal = closeFacturaModal;
  window.facturaUpdatePreview = facturaUpdatePreview;
  window.submitFactura = submitFactura;
  window.deleteFactura = deleteFactura;
  window.exportFacturasCSV = exportFacturasCSV;
  // CFDI / Carga Facturas
  window.CFDI_KEY = CFDI_KEY;
  window.CF_PREVIEW = CF_PREVIEW;
  window.CF_PDF_BASE64 = CF_PDF_BASE64;
  window.CF_PDF_BLOB_URL = CF_PDF_BLOB_URL;
  window.CF_EMPRESAS = CF_EMPRESAS;
  window.CF_MESES = CF_MESES;
  window.cfdiLoad = cfdiLoad;
  window.cfdiSave = cfdiSave;
  window.rCargaFacturas = rCargaFacturas;
  window.cfOnEmpresaChange = cfOnEmpresaChange;
  window.cfHandleDrop = cfHandleDrop;
  window.cfLoadFile = cfLoadFile;
  window.cfSetStatus = cfSetStatus;
  window.cfAnalyzePDF = cfAnalyzePDF;
  window._cfExtract = _cfExtract;
  window.cfParseCFDI = cfParseCFDI;
  window.cfAutoDetectEmpresa = cfAutoDetectEmpresa;
  window.cfRenderPreview = cfRenderPreview;
  window.cfClearPreview = cfClearPreview;
  window.cfImport = cfImport;
  window.cfLinkToFactura = cfLinkToFactura;
  window.cfRenderHistory = cfRenderHistory;
  window.cfFilterHistory = cfFilterHistory;
  window.cfViewPDF = cfViewPDF;
  window.cfClosePDFModal = cfClosePDFModal;
  window.cfDownloadPDF = cfDownloadPDF;
  window.cfDeleteUpload = cfDeleteUpload;

  // Register views
  if(typeof registerView === 'function'){
    registerView('fact_terminales', function(){ return rFactTerminales(); });
    registerView('carga_facturas', function(){ rCargaFacturas(); });
  }

})(window);
