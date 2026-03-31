// GF — Facturacion Egresos: cuentas por pagar + pagos pendientes
// ═══════════════════════════════════════════════════════════════
(function(window){
'use strict';

// ── Storage ─────────────────────────────────────────────
var CXP_KEY = 'gf_cxp';
var _cxpStore = { cuentas:[], pagos:[] };

function cxpLoad(){
  try{ _cxpStore = DB.get(CXP_KEY) || { cuentas:[], pagos:[] }; }catch(e){ _cxpStore={cuentas:[],pagos:[]}; }
  if(!_cxpStore.cuentas) _cxpStore.cuentas = [];
  if(!_cxpStore.pagos) _cxpStore.pagos = [];
}
function cxpSave(){
  // Strip pdf_base64 from memory copy before calc (it stays in store)
  DB.set(CXP_KEY, _cxpStore);
}

// ── Helpers ─────────────────────────────────────────────
var _EMPRESAS = ['Salem','Endless','Dynamo','Wirebit','Stellaris'];
var _ENT_C = {Salem:'#0073ea',Endless:'#00b875',Dynamo:'#ff7043',Wirebit:'#9b51e0',Stellaris:'#e53935'};
var _METODOS_PAGO = ['Transferencia','Efectivo','Cheque','Tarjeta'];

function _fmt(n){ return typeof fmtMXN==='function' ? fmtMXN(n) : '$'+Number(n||0).toLocaleString('es-MX',{minimumFractionDigits:0}); }
function _fmtD(d){ if(!d) return '—'; var p=String(d).substring(0,10).split('-'); return p.length===3 ? p[2]+'/'+p[1]+'/'+p[0] : d; }
function _esc(s){ return String(s||'').replace(/</g,'&lt;').replace(/>/g,'&gt;'); }
function _today(){ return new Date().toISOString().substring(0,10); }
function _now(){ return new Date().toISOString(); }

function _statusPill(st){
  if(st==='pagada')    return '<span class="pill" style="background:var(--green-lt);color:#007a48">Pagada</span>';
  if(st==='parcial')   return '<span class="pill" style="background:var(--yellow-lt);color:#7a5000">Parcial</span>';
  if(st==='cancelada') return '<span class="pill" style="background:var(--bg);color:var(--muted)">Cancelada</span>';
  return '<span class="pill" style="background:var(--red-lt);color:#b02020">Pendiente</span>';
}
function _origenPill(o){
  if(o==='cfdi')     return '<span class="pill" style="background:var(--blue-lt);color:#003d7a">CFDI</span>';
  if(o==='efectivo') return '<span class="pill" style="background:var(--orange-lt);color:#7a3000">Efectivo</span>';
  return '<span class="pill" style="background:var(--purple-lt);color:#5a1e9e">Manual</span>';
}
function _empPill(e){
  var c = _ENT_C[e] || '#666';
  return '<span class="pill" style="background:'+c+'18;color:'+c+'">'+_esc(e)+'</span>';
}

function _isVencida(cxp){
  if(cxp.status==='pagada'||cxp.status==='cancelada') return false;
  if(!cxp.fecha_vencimiento) return false;
  return cxp.fecha_vencimiento < _today();
}

// Build category <option> list from CATS_GAS
function _catOptions(selected){
  var cats = (typeof CATS_GAS !== 'undefined') ? CATS_GAS : ['Administrativo','Renta','Operaciones','Varios'];
  return cats.map(function(c){ return '<option value="'+c+'"'+(c===selected?' selected':'')+'>'+c+'</option>'; }).join('');
}

// Auto-suggest P&L category from concept description
function ceSuggestCategory(desc){
  desc = (desc||'').toUpperCase();
  if(/COMISI[OÓ]N|TARJETA|MENSUALIDAD|DISPERSION|INTERCHANGE/.test(desc)) return 'Com. Bancarias';
  if(/SAAS|PLATAFORMA|SOFTWARE|SISTEMA|LICENCIA|HOSTING|SERVIDOR/.test(desc)) return 'Operaciones';
  if(/RENTA|ARRENDAMIENTO|ALQUILER/.test(desc)) return 'Renta';
  if(/N[OÓ]MINA|SUELDO|SALARIO|AGUINALDO/.test(desc)) return 'Nómina';
  if(/MARKETING|PUBLICIDAD|ANUNCIO|FACEBOOK|GOOGLE\s*ADS/.test(desc)) return 'Marketing';
  if(/NOTARI|LEGAL|ABOGAD|CONTAB|AUDIT/.test(desc)) return 'Regulatorio';
  if(/PAPELER[IÍ]A|OFICINA|LIMPIEZA|MATERIAL/.test(desc)) return 'Administrativo';
  return '';
}

// Build line-items table HTML (shared between CFDI preview and manual form)
function _ceLineasTableHTML(conceptos, editable){
  var html = '<div style="margin-top:6px;margin-bottom:14px">';
  html += '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px">';
  html += '<span style="font-size:.68rem;font-weight:600;color:var(--muted)">Conceptos de la Factura (' + conceptos.length + ' líneas)</span>';
  if(editable) html += '<button class="btn btn-out ce-add-linea-btn" style="font-size:.62rem;padding:2px 8px">+ Línea</button>';
  html += '</div>';
  html += '<table class="bt" style="font-size:.74rem"><thead><tr>';
  html += '<th>Descripción</th><th class="r" style="width:110px">Importe</th><th style="width:150px">Categoría P&L</th>';
  if(editable) html += '<th style="width:30px"></th>';
  html += '</tr></thead><tbody id="ce-lineas-tbody">';
  conceptos.forEach(function(c, i){
    var suggested = ceSuggestCategory(c.descripcion || c.concepto || '');
    html += '<tr class="ce-linea-row">';
    html += '<td><input type="text" class="fi ce-linea-desc" value="'+_esc(c.descripcion || c.concepto || '')+'" style="width:100%;font-size:.73rem;padding:4px 6px"></td>';
    html += '<td class="r"><input type="number" class="fi ce-linea-importe" value="'+(c.importe||0)+'" step="0.01" min="0" style="width:100%;font-size:.73rem;padding:4px 6px;text-align:right"></td>';
    html += '<td><select class="ce-linea-cat" style="width:100%;padding:5px 6px;border-radius:var(--r);border:1px solid var(--border2);font-size:.72rem;background:var(--white);color:var(--text)">';
    html += '<option value="">—</option>' + _catOptions(suggested);
    html += '</select></td>';
    if(editable) html += '<td>'+(i > 0 ? '<button class="btn btn-out ce-remove-linea-btn" style="font-size:.6rem;padding:2px 5px">✕</button>' : '')+'</td>';
    html += '</tr>';
  });
  html += '</tbody></table></div>';
  return html;
}

// Wire events on lineas table (call after innerHTML that includes lineas table)
function _ceWireLineasEvents(container){
  container.querySelectorAll('.ce-add-linea-btn').forEach(function(b){ b.onclick = ceAddManualLinea; });
  container.querySelectorAll('.ce-linea-importe').forEach(function(inp){ inp.oninput = ceRecalcFromLineas; });
  container.querySelectorAll('.ce-remove-linea-btn').forEach(function(b){ b.onclick = function(){ ceRemoveLinea(this); }; });
}

// Add a new blank line to the lineas table
function ceAddManualLinea(){
  var tbody = document.getElementById('ce-lineas-tbody');
  if(!tbody) return;
  var tr = document.createElement('tr');
  tr.className = 'ce-linea-row';
  tr.innerHTML = '<td><input type="text" class="fi ce-linea-desc" placeholder="Concepto..." style="width:100%;font-size:.73rem;padding:4px 6px"></td>'
    + '<td class="r"><input type="number" class="fi ce-linea-importe" step="0.01" min="0" placeholder="0" style="width:100%;font-size:.73rem;padding:4px 6px;text-align:right"></td>'
    + '<td><select class="ce-linea-cat" style="width:100%;padding:5px 6px;border-radius:var(--r);border:1px solid var(--border2);font-size:.72rem;background:var(--white);color:var(--text)"><option value="">—</option>' + _catOptions() + '</select></td>'
    + '<td><button class="btn btn-out ce-remove-linea-btn" style="font-size:.6rem;padding:2px 5px">✕</button></td>';
  tbody.appendChild(tr);
  // Wire events on the new row
  var imp = tr.querySelector('.ce-linea-importe');
  if(imp) imp.oninput = ceRecalcFromLineas;
  var rmBtn = tr.querySelector('.ce-remove-linea-btn');
  if(rmBtn) rmBtn.onclick = function(){ ceRemoveLinea(this); };
}

// Remove a line item row
function ceRemoveLinea(btn){
  var tr = btn.closest('tr');
  if(tr) tr.remove();
  ceRecalcFromLineas();
}

// Recalculate subtotal/IVA/total from line item importes
function ceRecalcFromLineas(){
  var importes = document.querySelectorAll('.ce-linea-importe');
  var sub = 0;
  importes.forEach(function(inp){ sub += parseFloat(inp.value) || 0; });
  var subField = document.getElementById('ce-f-subtotal');
  if(subField) subField.value = sub.toFixed(2);
  var ivaField = document.getElementById('ce-f-iva');
  var iva = Math.round(sub * 0.16 * 100) / 100;
  if(ivaField) ivaField.value = iva.toFixed(2);
  var totField = document.getElementById('ce-f-total');
  if(totField) totField.value = (sub + iva).toFixed(2);
}

// Gather line items from the DOM
function ceGatherLineas(){
  var rows = document.querySelectorAll('.ce-linea-row');
  if(!rows || rows.length <= 1) return null;
  var lineas = [];
  var totalIva = parseFloat((document.getElementById('ce-f-iva')||{}).value) || 0;
  rows.forEach(function(row){
    var desc    = row.querySelector('.ce-linea-desc');
    var importe = row.querySelector('.ce-linea-importe');
    var cat     = row.querySelector('.ce-linea-cat');
    if(desc && importe && cat){
      var imp = parseFloat(importe.value) || 0;
      if(imp > 0) lineas.push({ concepto: (desc.value||'').trim(), importe: imp, iva: 0, categoria: cat.value||'' });
    }
  });
  if(lineas.length <= 1) return null;
  // Distribute IVA proportionally
  var totalImporte = lineas.reduce(function(a,l){ return a + l.importe; }, 0);
  if(totalImporte > 0){
    lineas.forEach(function(l){ l.iva = Math.round(totalIva * (l.importe / totalImporte) * 100) / 100; });
  }
  return lineas;
}

// ══════════════════════════════════════════════════════════
//  VISTA: CARGA EGRESOS  (Facturas Recibidas)
// ══════════════════════════════════════════════════════════
var _cePreview = null; // parsed data from PDF
var _ceMode = 'idle'; // idle | cfdi | manual | efectivo
var _cePdfData = null; // {base64, filename}

function rCargaEgresos(){
  cxpLoad();
  var el = document.getElementById('view-carga_egresos');
  if(!el) return;

  var html = '';
  html += '<div style="font-family:\'Poppins\',sans-serif;font-size:.95rem;font-weight:700;margin-bottom:4px">📥 Facturas Recibidas de Proveedores</div>';
  html += '<div style="font-size:.72rem;color:var(--muted);margin-bottom:18px">Sube facturas de gasto (CFDI o manual) para crear cuentas por pagar</div>';

  // ── Upload + Form section ──
  html += '<div class="tw" style="margin-bottom:14px">';
  html += '<div class="tw-h"><div class="tw-ht">📄 Registrar Factura de Egreso</div>';
  html += '<div style="display:flex;gap:8px">';
  html += '<button class="btn btn-out ce-mode-btn" style="font-size:.7rem" data-mode="manual">✏️ Captura Manual</button>';
  html += '<button class="btn btn-out ce-mode-btn" style="font-size:.7rem" data-mode="efectivo">💵 Pago en Efectivo</button>';
  html += '</div></div>';

  html += '<div style="padding:16px;display:flex;flex-direction:column;gap:14px">';

  // Row 1: Empresa + Categoría + Moneda + TC
  html += '<div style="display:flex;gap:12px;flex-wrap:wrap">';
  html += _selField('ce-empresa','Empresa que paga','<option value="">— Seleccionar —</option>'+_EMPRESAS.map(function(e){ return '<option value="'+e+'">'+e+'</option>'; }).join(''));
  html += _selField('ce-categoria','Categoría P&L','<option value="">— Seleccionar —</option>'+_catOptions());
  html += _selField('ce-moneda','Moneda','<option value="MXN">MXN</option><option value="USD">USD</option>');
  html += '<div id="ce-tc-wrap" style="flex:0 0 100px;display:none">';
  html += '<label style="font-size:.7rem;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">Tipo de Cambio</label>';
  html += '<input type="number" id="ce-tc" class="fi" step="0.01" value="1" min="0" style="width:100%;font-size:.78rem;padding:7px 10px">';
  html += '</div>';
  html += '</div>';

  // Drop zone (for CFDI PDFs)
  html += '<div id="ce-dropzone-wrap">';
  html += '<div id="ce-dropzone" style="border:2px dashed var(--border2);border-radius:var(--r);padding:32px 20px;text-align:center;cursor:pointer;transition:border-color .2s">';
  html += '<div style="font-size:1.6rem;margin-bottom:6px">📎</div>';
  html += '<div style="font-size:.78rem;font-weight:600;color:var(--text)">Arrastra la factura PDF aquí</div>';
  html += '<div style="font-size:.68rem;color:var(--muted);margin-top:4px">CFDI mexicano — se extraerán datos automáticamente</div>';
  html += '<input type="file" id="ce-file-input" accept=".pdf" style="display:none">';
  html += '</div></div>';

  // Status
  html += '<div id="ce-status" style="display:none;font-size:.78rem;padding:10px 14px;border-radius:var(--r)"></div>';

  // Preview / Manual form (hidden initially)
  html += '<div id="ce-form-area" style="display:none"></div>';

  html += '</div></div>';

  // ── KPIs ──
  html += '<div id="ce-kpis"></div>';

  // ── Historial ──
  html += '<div class="tw">';
  html += '<div class="tw-h"><div class="tw-ht">📋 Facturas de Egreso Registradas</div>';
  html += '<div style="display:flex;gap:8px;align-items:center">';
  html += '<input type="text" id="ce-search" placeholder="Buscar..." style="padding:5px 10px;border-radius:var(--r);border:1px solid var(--border2);font-size:.72rem;width:160px;background:var(--white);color:var(--text)">';
  html += '</div></div>';
  html += '<div style="overflow-x:auto"><table class="bt"><thead><tr>';
  html += '<th>Fecha</th><th>Proveedor</th><th>Empresa</th><th>Categoría</th><th>Concepto</th><th class="r">Total</th><th>Status</th><th>Origen</th><th style="width:60px"></th>';
  html += '</tr></thead><tbody id="ce-tbody"></tbody></table></div>';
  html += '</div>';

  el.innerHTML = html;

  // ── Wire events ──
  el.querySelectorAll('.ce-mode-btn').forEach(function(b){ b.onclick = function(){ ceSetMode(b.dataset.mode); }; });
  var ceMoneda = document.getElementById('ce-moneda');
  if(ceMoneda) ceMoneda.onchange = ceOnMonedaChange;
  var ceDz = document.getElementById('ce-dropzone');
  if(ceDz){
    ceDz.ondrop = function(e){ ceHandleDrop(e); };
    ceDz.ondragover = function(e){ e.preventDefault(); this.style.borderColor='var(--blue)'; };
    ceDz.ondragleave = function(){ this.style.borderColor='var(--border2)'; };
    ceDz.onclick = function(){ document.getElementById('ce-file-input').click(); };
  }
  var ceFI = document.getElementById('ce-file-input');
  if(ceFI) ceFI.onchange = function(){ ceLoadFile(this.files[0]); };
  var ceSearch = document.getElementById('ce-search');
  if(ceSearch) ceSearch.oninput = function(){ ceFilterHistory(this.value); };

  _ceMode = 'idle';
  _cePreview = null;
  _cePdfData = null;
  ceRenderKPIs();
  ceRenderHistory();
}

function _selField(id,label,opts,extra){
  return '<div style="flex:1;min-width:150px">'
    + '<label style="font-size:.7rem;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">'+label+'</label>'
    + '<select id="'+id+'" '+(extra||'')+' style="width:100%;padding:7px 10px;border-radius:var(--r);border:1px solid var(--border2);font-size:.78rem;background:var(--white);color:var(--text)">'+opts+'</select>'
    + '</div>';
}

// ── Mode switching ──
function ceSetMode(mode){
  _ceMode = mode;
  _cePreview = null;
  _cePdfData = null;
  var dz = document.getElementById('ce-dropzone-wrap');
  var fa = document.getElementById('ce-form-area');
  var st = document.getElementById('ce-status');
  if(st) st.style.display = 'none';

  if(mode === 'manual' || mode === 'efectivo'){
    if(dz) dz.style.display = 'none';
    if(fa){ fa.style.display = 'block'; fa.innerHTML = _ceManualFormHTML(mode); _ceWireManualForm(fa); }
  } else {
    if(dz) dz.style.display = '';
    if(fa){ fa.style.display = 'none'; fa.innerHTML = ''; }
  }
}

function _ceWireManualForm(container){
  container.querySelectorAll('.ce-cancel-btn').forEach(function(b){ b.onclick = ceClearForm; });
  container.querySelectorAll('.ce-save-btn').forEach(function(b){ b.onclick = ceSave; });
  _ceWireLineasEvents(container);
  var mdz = document.getElementById('ce-manual-dropzone');
  if(mdz){
    mdz.ondrop = function(e){ ceManualDrop(e); };
    mdz.ondragover = function(e){ e.preventDefault(); this.style.borderColor='var(--blue)'; };
    mdz.ondragleave = function(){ this.style.borderColor='var(--border2)'; };
    mdz.onclick = function(){ document.getElementById('ce-manual-file').click(); };
  }
  var mf = document.getElementById('ce-manual-file');
  if(mf) mf.onchange = function(){ ceManualAttach(this.files[0]); };
}

function ceOnMonedaChange(){
  var m = document.getElementById('ce-moneda');
  var w = document.getElementById('ce-tc-wrap');
  if(w) w.style.display = (m && m.value === 'USD') ? '' : 'none';
}

// ── PDF Drop ──
function ceHandleDrop(e){
  e.preventDefault();
  e.stopPropagation();
  document.getElementById('ce-dropzone').style.borderColor = 'var(--border2)';
  var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
  if(f) ceLoadFile(f);
}

function ceLoadFile(file){
  if(!file) return;
  if(!file.name.toLowerCase().endsWith('.pdf')){
    ceSetStatus('error','Solo se aceptan archivos PDF');
    return;
  }
  ceSetStatus('loading','Analizando PDF: ' + _esc(file.name) + '...');
  var reader = new FileReader();
  reader.onload = function(ev){
    _cePdfData = { base64: ev.target.result, filename: file.name };
    ceAnalyzePDF(ev.target.result, file.name);
  };
  reader.readAsDataURL(file);
}

function ceAnalyzePDF(dataUrl, filename){
  try{
    var b64 = dataUrl.split(',')[1];
    var raw = atob(b64);
    var bytes = new Uint8Array(raw.length);
    for(var i=0;i<raw.length;i++) bytes[i] = raw.charCodeAt(i);

    pdfjsLib.getDocument({data:bytes}).promise.then(function(pdf){
      var pages = []; var total = pdf.numPages;
      function nextPage(n){
        if(n > total){
          var fullText = pages.join(' ');
          _cePreview = cfParseCFDI(fullText);
          _ceMode = 'cfdi';
          ceSetStatus('ok','PDF analizado correctamente — '+filename);
          ceRenderPreview();
          return;
        }
        pdf.getPage(n).then(function(page){
          page.getTextContent().then(function(tc){
            pages.push(tc.items.map(function(it){ return it.str; }).join(' '));
            nextPage(n+1);
          });
        });
      }
      nextPage(1);
    }).catch(function(err){
      ceSetStatus('error','Error leyendo PDF: ' + err.message);
      // Fallback: show manual form with PDF attached
      _ceMode = 'manual';
      var fa = document.getElementById('ce-form-area');
      if(fa){ fa.style.display='block'; fa.innerHTML = _ceManualFormHTML('manual'); }
    });
  }catch(err){
    ceSetStatus('error','Error al analizar: ' + err.message);
  }
}

function ceSetStatus(type, msg){
  var el = document.getElementById('ce-status');
  if(!el) return;
  el.style.display = 'block';
  if(type==='error'){
    el.style.background = 'var(--red-bg)'; el.style.color = '#b02020';
  } else if(type==='ok'){
    el.style.background = 'var(--green-bg)'; el.style.color = '#007a48';
  } else {
    el.style.background = 'var(--blue-bg)'; el.style.color = '#0073ea';
  }
  el.innerHTML = msg;
}

// ── CFDI Preview ──
function ceRenderPreview(){
  var fa = document.getElementById('ce-form-area');
  if(!fa || !_cePreview) return;
  var d = _cePreview;

  var html = '<div style="margin-bottom:14px">';
  html += '<div style="font-size:.78rem;font-weight:700;color:var(--text);margin-bottom:10px">🔍 Datos Extraídos del CFDI</div>';

  // Grid of extracted fields
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 20px;font-size:.78rem;margin-bottom:14px">';
  html += _pvField('Proveedor (Emisor)', d.nombre_emisor, 'ce-f-proveedor', true);
  html += _pvField('RFC Emisor', d.rfc_emisor, 'ce-f-rfc');
  html += _pvField('Receptor', d.nombre_receptor);
  html += _pvField('RFC Receptor', d.rfc_receptor);
  html += _pvField('Folio Fiscal', d.folio_fiscal);
  html += _pvField('Fecha Emisión', d.fecha_emision ? d.fecha_emision.substring(0,10) : '', 'ce-f-fecha-factura', true, 'date');
  // Single-line description (only if ≤1 conceptos)
  if(!d.conceptos || d.conceptos.length <= 1){
    html += '<div style="grid-column:1/-1">'+_pvField('Descripción / Concepto', d.descripcion, 'ce-f-concepto', true)+'</div>';
  }
  html += '</div>';

  // Multi-concepto line-items table
  if(d.conceptos && d.conceptos.length > 1){
    html += _ceLineasTableHTML(d.conceptos, false);
  }

  // Montos
  html += '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:14px">';
  html += _moBlock('Subtotal', d.subtotal, 'ce-f-subtotal');
  html += _moBlock('IVA', d.iva_amount, 'ce-f-iva');
  html += _moBlock('Total', d.total, 'ce-f-total', true);
  html += '</div>';

  // Fecha vencimiento
  html += '<div style="display:flex;gap:12px;margin-bottom:16px">';
  html += '<div style="flex:1;max-width:200px">';
  html += '<label style="font-size:.68rem;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">Fecha Vencimiento</label>';
  html += '<input type="date" id="ce-f-vencimiento" class="fi" style="width:100%;font-size:.78rem;padding:6px 10px">';
  html += '</div></div>';

  // Actions
  html += '<div style="display:flex;justify-content:flex-end;gap:10px">';
  html += '<button class="btn btn-out ce-cancel-btn" style="font-size:.72rem">Cancelar</button>';
  html += '<button class="btn ce-save-btn" style="font-size:.72rem">💾 Registrar Cuenta por Pagar</button>';
  html += '</div>';

  html += '</div>';
  fa.style.display = 'block';
  fa.innerHTML = html;
  fa.querySelectorAll('.ce-cancel-btn').forEach(function(b){ b.onclick = ceClearForm; });
  fa.querySelectorAll('.ce-save-btn').forEach(function(b){ b.onclick = ceSave; });
  _ceWireLineasEvents(fa);

  // Pre-fill date field
  if(d.fecha_emision){
    var fd = document.getElementById('ce-f-fecha-factura');
    if(fd && fd.type === 'date') fd.value = d.fecha_emision.substring(0,10);
  }

  // Hide global category dropdown when multi-concepto (each line has its own)
  if(d.conceptos && d.conceptos.length > 1){
    var globalCat = document.getElementById('ce-categoria');
    if(globalCat && globalCat.parentElement) globalCat.parentElement.style.display = 'none';
  }
}

function _pvField(label, value, inputId, editable, inputType){
  var h = '<div><span style="color:var(--muted);font-size:.66rem;display:block;margin-bottom:2px">'+label+'</span>';
  if(editable && inputId){
    h += '<input type="'+(inputType||'text')+'" id="'+inputId+'" class="fi" value="'+_esc(value)+'" style="width:100%;font-size:.76rem;padding:5px 8px">';
  } else {
    h += '<span style="font-weight:600;font-size:.76rem">'+_esc(value||'—')+'</span>';
  }
  h += '</div>';
  return h;
}

function _moBlock(label, value, inputId, highlight){
  var bg = highlight ? 'var(--blue-bg)' : 'var(--bg)';
  var col = highlight ? 'var(--blue)' : 'var(--text)';
  return '<div style="flex:1;min-width:110px;background:'+bg+';border-radius:var(--r);padding:10px 12px;text-align:center">'
    + '<div style="font-size:.63rem;color:'+(highlight?'var(--blue)':'var(--muted)')+';text-transform:uppercase;letter-spacing:.04em;margin-bottom:3px">'+label+'</div>'
    + '<input type="number" id="'+inputId+'" value="'+(value||0)+'" step="0.01" min="0" style="width:100%;border:none;background:transparent;font-size:.95rem;font-weight:700;text-align:center;color:'+col+';font-family:Poppins,sans-serif">'
    + '</div>';
}

// ── Manual Form (extranjeras / efectivo) ──
function _ceManualFormHTML(mode){
  var isEfectivo = mode === 'efectivo';
  var title = isEfectivo ? '💵 Registro de Pago en Efectivo' : '✏️ Captura Manual de Factura';

  var html = '<div style="margin-bottom:14px">';
  html += '<div style="font-size:.78rem;font-weight:700;color:var(--text);margin-bottom:10px">'+title+'</div>';

  // Row: Proveedor + RFC
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;font-size:.78rem;margin-bottom:14px">';
  html += _pvField('Proveedor', '', 'ce-f-proveedor', true);
  if(!isEfectivo) html += _pvField('RFC Proveedor (opcional)', '', 'ce-f-rfc', true);
  else html += '<div></div>';
  html += '</div>';

  // Line items table (start with 1 row, expandable)
  html += _ceLineasTableHTML([{descripcion:'', importe:0}], true);

  // Montos
  html += '<div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:14px">';
  html += _moBlock('Subtotal', 0, 'ce-f-subtotal');
  html += _moBlock('IVA', 0, 'ce-f-iva');
  html += _moBlock('Total', 0, 'ce-f-total', true);
  html += '</div>';

  // Fechas
  html += '<div style="display:flex;gap:12px;margin-bottom:16px">';
  html += '<div style="flex:1;max-width:200px">';
  html += '<label style="font-size:.68rem;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">Fecha Factura</label>';
  html += '<input type="date" id="ce-f-fecha-factura" class="fi" value="'+_today()+'" style="width:100%;font-size:.78rem;padding:6px 10px">';
  html += '</div>';
  html += '<div style="flex:1;max-width:200px">';
  html += '<label style="font-size:.68rem;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">Fecha Vencimiento</label>';
  html += '<input type="date" id="ce-f-vencimiento" class="fi" style="width:100%;font-size:.78rem;padding:6px 10px">';
  html += '</div>';
  html += '</div>';

  // Drop zone for foreign PDF (optional attachment)
  if(!isEfectivo){
    html += '<div style="margin-bottom:14px">';
    html += '<div id="ce-manual-dropzone" style="border:1px dashed var(--border2);border-radius:var(--r);padding:14px;text-align:center;cursor:pointer;font-size:.72rem;color:var(--muted)">';
    html += '📎 Adjuntar PDF como respaldo (opcional)';
    html += '<input type="file" id="ce-manual-file" accept=".pdf" style="display:none">';
    html += '</div>';
    html += '<div id="ce-manual-pdf-name" style="display:none;font-size:.7rem;color:var(--green);margin-top:4px"></div>';
    html += '</div>';
  }

  // Actions
  html += '<div style="display:flex;justify-content:flex-end;gap:10px">';
  html += '<button class="btn btn-out ce-cancel-btn" style="font-size:.72rem">Cancelar</button>';
  html += '<button class="btn ce-save-btn" style="font-size:.72rem">💾 Registrar Cuenta por Pagar</button>';
  html += '</div>';

  html += '</div>';
  return html;
}

// Manual PDF attachment
function ceManualDrop(e){
  e.preventDefault(); e.stopPropagation();
  var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
  if(f) ceManualAttach(f);
}
function ceManualAttach(file){
  if(!file || !file.name.toLowerCase().endsWith('.pdf')) return;
  var reader = new FileReader();
  reader.onload = function(ev){
    _cePdfData = { base64: ev.target.result, filename: file.name };
    var el = document.getElementById('ce-manual-pdf-name');
    if(el){ el.style.display = 'block'; el.textContent = '✅ '+file.name+' adjuntado'; }
  };
  reader.readAsDataURL(file);
}

// ── Clear form ──
function ceClearForm(){
  _cePreview = null;
  _ceMode = 'idle';
  _cePdfData = null;
  var fa = document.getElementById('ce-form-area');
  if(fa){ fa.style.display = 'none'; fa.innerHTML = ''; }
  var dz = document.getElementById('ce-dropzone-wrap');
  if(dz) dz.style.display = '';
  var st = document.getElementById('ce-status');
  if(st) st.style.display = 'none';
  // Reset file input
  var fi = document.getElementById('ce-file-input');
  if(fi) fi.value = '';
}

// ── Save CxP ──
function ceSave(){
  var empresa   = (document.getElementById('ce-empresa')||{}).value;
  var categoria = (document.getElementById('ce-categoria')||{}).value;
  var moneda    = (document.getElementById('ce-moneda')||{}).value || 'MXN';
  var tc        = parseFloat((document.getElementById('ce-tc')||{}).value) || 1;
  var proveedor = (document.getElementById('ce-f-proveedor')||{}).value || '';
  var rfc       = (document.getElementById('ce-f-rfc')||{}).value || '';
  var concepto  = (document.getElementById('ce-f-concepto')||{}).value || '';
  var subtotal  = parseFloat((document.getElementById('ce-f-subtotal')||{}).value) || 0;
  var iva       = parseFloat((document.getElementById('ce-f-iva')||{}).value) || 0;
  var total     = parseFloat((document.getElementById('ce-f-total')||{}).value) || 0;
  var fechaFact = (document.getElementById('ce-f-fecha-factura')||{}).value || _today();
  var vencim    = (document.getElementById('ce-f-vencimiento')||{}).value || '';

  // Gather multi-line items (returns null if ≤1 line)
  var lineItems = ceGatherLineas();

  // Validations
  if(!empresa){ toast('❌ Selecciona la empresa que paga'); return; }
  if(lineItems && lineItems.length > 1){
    var missingCat = lineItems.some(function(l){ return !l.categoria; });
    if(missingCat){ toast('❌ Selecciona la categoría para cada línea'); return; }
  } else {
    if(!categoria){ toast('❌ Selecciona la categoría P&L'); return; }
  }
  if(!proveedor.trim()){ toast('❌ Ingresa el nombre del proveedor'); return; }
  if(!total || total <= 0){ toast('❌ El total debe ser mayor a 0'); return; }

  // Detect folio_fiscal from CFDI preview
  var folio = (_cePreview && _cePreview.folio_fiscal) || '';

  // Check duplicate folio
  if(folio){
    var dup = _cxpStore.cuentas.find(function(c){ return c.folio_fiscal === folio; });
    if(dup){
      toast('⚠️ Ya existe una CxP con ese folio fiscal');
      return;
    }
  }

  if(moneda === 'MXN') tc = 1;
  var totalMXN = Math.round(total * tc);

  // For multi-line: use first line's categoria, build combined concepto
  if(lineItems && lineItems.length > 1){
    categoria = lineItems[0].categoria;
    concepto = lineItems.map(function(l){ return l.concepto; }).join(' | ');
  }

  var cxp = {
    id: 'cxp_' + Date.now(),
    proveedor: proveedor.trim(),
    rfc_proveedor: rfc.trim().toUpperCase(),
    empresa: empresa,
    categoria: categoria,
    concepto: concepto.trim(),
    lineas: lineItems || null,
    moneda: moneda,
    tipo_cambio: tc,
    subtotal: subtotal,
    iva: iva,
    total: total,
    total_mxn: totalMXN,
    folio_fiscal: folio,
    rfc_emisor: (_cePreview && _cePreview.rfc_emisor) || rfc.trim().toUpperCase(),
    fecha_emision: (_cePreview && _cePreview.fecha_emision) || '',
    fecha_factura: fechaFact,
    fecha_vencimiento: vencim,
    status: 'pendiente',
    monto_pagado_mxn: 0,
    saldo_mxn: totalMXN,
    origen: _ceMode === 'efectivo' ? 'efectivo' : (_ceMode === 'cfdi' ? 'cfdi' : 'manual'),
    pdf_filename: _cePdfData ? _cePdfData.filename : null,
    pdf_base64: _cePdfData ? _cePdfData.base64 : null,
    created_at: _now(),
    updated_at: _now()
  };

  _cxpStore.cuentas.push(cxp);
  cxpSave();
  toast('✅ Cuenta por Pagar registrada — '+proveedor);
  ceClearForm();
  ceRenderKPIs();
  ceRenderHistory();
}

// ── KPIs ──
function ceRenderKPIs(){
  var el = document.getElementById('ce-kpis');
  if(!el) return;
  var pend = 0, montoPend = 0, pagadas = 0;
  _cxpStore.cuentas.forEach(function(c){
    if(c.status === 'pendiente' || c.status === 'parcial'){ pend++; montoPend += c.saldo_mxn; }
    if(c.status === 'pagada') pagadas++;
  });

  el.innerHTML = UI.kpiRow([
    UI.kpiCard({label:'PENDIENTES',value:pend,sub:'Facturas por pagar',icon:'📋',color:'red',barPct:pend?100:0}),
    UI.kpiCard({label:'MONTO PENDIENTE',value:_fmt(montoPend),sub:'Saldo total',icon:'💰',color:'orange',barPct:montoPend?80:0}),
    UI.kpiCard({label:'PAGADAS',value:pagadas,sub:'Este periodo',icon:'✅',color:'green',barPct:pagadas?100:0})
  ],{cols:3,style:'margin-bottom:14px'});
}

// ── History table ──
function ceRenderHistory(filter){
  var tb = document.getElementById('ce-tbody');
  if(!tb) return;
  var rows = _cxpStore.cuentas.slice().reverse();
  if(filter){
    var f = filter.toLowerCase();
    rows = rows.filter(function(c){
      return (c.proveedor||'').toLowerCase().indexOf(f)!==-1 ||
             (c.empresa||'').toLowerCase().indexOf(f)!==-1 ||
             (c.concepto||'').toLowerCase().indexOf(f)!==-1;
    });
  }
  if(!rows.length){
    tb.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:30px;font-size:.78rem">No hay facturas de egreso registradas</td></tr>';
    return;
  }
  tb.innerHTML = rows.map(function(c){
    // Category display: show first cat + badge if multi-line
    var catDisplay;
    if(c.lineas && c.lineas.length > 1){
      catDisplay = '<span class="pill" style="background:var(--bg);color:var(--muted)">'+_esc(c.lineas[0].categoria)+'</span>'
        + '<span style="font-size:.58rem;color:var(--blue);margin-left:2px">+' + (c.lineas.length-1) + '</span>';
    } else {
      catDisplay = '<span class="pill" style="background:var(--bg);color:var(--muted)">'+_esc(c.categoria)+'</span>';
    }
    return '<tr>'
      + '<td>'+_fmtD(c.fecha_factura)+'</td>'
      + '<td style="font-weight:600">'+_esc(c.proveedor)+'</td>'
      + '<td>'+_empPill(c.empresa)+'</td>'
      + '<td>'+catDisplay+'</td>'
      + '<td style="max-width:180px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+_esc(c.lineas&&c.lineas.length>1 ? c.lineas.length+' conceptos' : c.concepto)+'</td>'
      + '<td class="r mo" style="font-weight:600">'+_fmt(c.total_mxn)+'</td>'
      + '<td>'+_statusPill(c.status)+'</td>'
      + '<td>'+_origenPill(c.origen)+'</td>'
      + '<td><button class="btn btn-out ce-delete-btn" style="font-size:.62rem;padding:3px 8px" data-id="'+_esc(c.id)+'">🗑️</button></td>'
      + '</tr>';
  }).join('');
  tb.querySelectorAll('.ce-delete-btn').forEach(function(b){ b.onclick = function(){ ceDeleteCxp(b.dataset.id); }; });
}

function ceFilterHistory(v){ ceRenderHistory(v); }

function ceDeleteCxp(id){
  if(!confirm('¿Eliminar esta cuenta por pagar?')) return;
  _cxpStore.cuentas = _cxpStore.cuentas.filter(function(c){ return c.id !== id; });
  // Also remove associated payments
  _cxpStore.pagos = _cxpStore.pagos.filter(function(p){ return p.cxp_id !== id; });
  cxpSave();
  ceRenderKPIs();
  ceRenderHistory();
  toast('🗑️ CxP eliminada');
}


// ══════════════════════════════════════════════════════════
//  VISTA: PAGOS PENDIENTES
// ══════════════════════════════════════════════════════════
var _ppFiltroEmp = '';
var _ppFiltroSt  = '';

function rPagosPendientes(){
  cxpLoad();
  var el = document.getElementById('view-pagos_pendientes');
  if(!el) return;

  var html = '';
  html += '<div style="font-family:\'Poppins\',sans-serif;font-size:.95rem;font-weight:700;margin-bottom:4px">💳 Pagos Pendientes</div>';
  html += '<div style="font-size:.72rem;color:var(--muted);margin-bottom:18px">Control consolidado de cuentas por pagar del grupo</div>';

  // Filters
  html += '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px;align-items:center">';
  html += '<select id="pp-f-empresa" style="padding:6px 10px;border-radius:var(--r);border:1px solid var(--border2);font-size:.75rem;background:var(--white);color:var(--text)">';
  html += '<option value="">Todas las empresas</option>';
  _EMPRESAS.forEach(function(e){ html += '<option value="'+e+'">'+e+'</option>'; });
  html += '</select>';
  html += '<select id="pp-f-status" style="padding:6px 10px;border-radius:var(--r);border:1px solid var(--border2);font-size:.75rem;background:var(--white);color:var(--text)">';
  html += '<option value="">Todos los status</option>';
  html += '<option value="pendiente">Pendiente</option><option value="parcial">Parcial</option><option value="pagada">Pagada</option><option value="cancelada">Cancelada</option>';
  html += '</select>';
  html += '<input type="text" id="pp-search" placeholder="Buscar proveedor..." style="padding:6px 10px;border-radius:var(--r);border:1px solid var(--border2);font-size:.75rem;width:180px;background:var(--white);color:var(--text)">';
  html += '</div>';

  // KPIs
  html += '<div id="pp-kpis"></div>';

  // Table
  html += '<div class="tw" style="margin-bottom:16px">';
  html += '<div class="tw-h"><div class="tw-ht">📋 Cuentas por Pagar</div></div>';
  html += '<div style="overflow-x:auto"><table class="bt"><thead><tr>';
  html += '<th>Proveedor</th><th>Empresa</th><th>Concepto</th><th class="r">Total</th><th class="r">Pagado</th><th class="r">Saldo</th><th>Vencimiento</th><th>Status</th><th style="width:120px"></th>';
  html += '</tr></thead><tbody id="pp-cxp-tbody"></tbody></table></div>';
  html += '</div>';

  // Chart
  html += UI.chartPanel({id:'c-pp-vencimientos',title:'Vencimientos por Mes',subtitle:'Saldo pendiente por mes de vencimiento',height:200,style:'margin-bottom:16px'});

  // Payment history
  html += '<div class="tw">';
  html += '<div class="tw-h"><div class="tw-ht">💸 Historial de Pagos Realizados</div></div>';
  html += '<div style="overflow-x:auto"><table class="bt"><thead><tr>';
  html += '<th>Fecha</th><th>Proveedor</th><th>Empresa</th><th class="r">Monto</th><th>Método</th><th>Referencia</th>';
  html += '</tr></thead><tbody id="pp-pagos-tbody"></tbody></table></div>';
  html += '</div>';

  el.innerHTML = html;

  // ── Wire pp events ──
  var ppFEmpresa = document.getElementById('pp-f-empresa');
  if(ppFEmpresa) ppFEmpresa.onchange = ppFilter;
  var ppFStatus = document.getElementById('pp-f-status');
  if(ppFStatus) ppFStatus.onchange = ppFilter;
  var ppSearch = document.getElementById('pp-search');
  if(ppSearch) ppSearch.oninput = ppFilter;

  _ppFiltroEmp = '';
  _ppFiltroSt = '';
  ppRenderAll();
}

function ppFilter(){
  _ppFiltroEmp = (document.getElementById('pp-f-empresa')||{}).value || '';
  _ppFiltroSt  = (document.getElementById('pp-f-status')||{}).value || '';
  var search   = (document.getElementById('pp-search')||{}).value || '';
  ppRenderAll(search);
}

function ppRenderAll(search){
  ppRenderKPIs();
  ppRenderCxpTable(search);
  ppRenderPagosTable();
  ppRenderChart();
}

function _ppFilterCuentas(search){
  return _cxpStore.cuentas.filter(function(c){
    if(_ppFiltroEmp && c.empresa !== _ppFiltroEmp) return false;
    if(_ppFiltroSt && c.status !== _ppFiltroSt) return false;
    if(search){
      var s = search.toLowerCase();
      if((c.proveedor||'').toLowerCase().indexOf(s)===-1 &&
         (c.concepto||'').toLowerCase().indexOf(s)===-1) return false;
    }
    return true;
  });
}

function ppRenderKPIs(){
  var el = document.getElementById('pp-kpis');
  if(!el) return;
  var cuentas = _ppFilterCuentas();
  var totalPend=0, vencidas=0, montoVencido=0, porVencer=0, pagadasMes=0;
  var hoy = _today();
  var mesCurrent = hoy.substring(0,7);

  cuentas.forEach(function(c){
    if(c.status==='pendiente'||c.status==='parcial'){
      totalPend += c.saldo_mxn;
      if(c.fecha_vencimiento && c.fecha_vencimiento < hoy){ vencidas++; montoVencido += c.saldo_mxn; }
      else porVencer++;
    }
    if(c.status==='pagada' && c.updated_at && c.updated_at.substring(0,7)===mesCurrent) pagadasMes++;
  });

  el.innerHTML = UI.kpiRow([
    UI.kpiCard({label:'TOTAL PENDIENTE',value:_fmt(totalPend),sub:'Saldo acumulado',icon:'💰',color:'red',barPct:totalPend?80:0}),
    UI.kpiCard({label:'VENCIDAS',value:vencidas,sub:_fmt(montoVencido),icon:'⚠️',color:'orange',barPct:vencidas?100:0}),
    UI.kpiCard({label:'POR VENCER',value:porVencer,sub:'Dentro de plazo',icon:'📅',color:'blue',barPct:porVencer?60:0}),
    UI.kpiCard({label:'PAGADAS ESTE MES',value:pagadasMes,sub:mesCurrent,icon:'✅',color:'green',barPct:pagadasMes?100:0})
  ],{style:'margin-bottom:14px'});
}

function ppRenderCxpTable(search){
  var tb = document.getElementById('pp-cxp-tbody');
  if(!tb) return;
  var rows = _ppFilterCuentas(search);
  // Sort: pendiente/parcial first, then by vencimiento asc
  rows.sort(function(a,b){
    var oa = (a.status==='pendiente'||a.status==='parcial') ? 0 : 1;
    var ob = (b.status==='pendiente'||b.status==='parcial') ? 0 : 1;
    if(oa !== ob) return oa - ob;
    return (a.fecha_vencimiento||'9999') < (b.fecha_vencimiento||'9999') ? -1 : 1;
  });

  if(!rows.length){
    tb.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:30px;font-size:.78rem">No hay cuentas por pagar</td></tr>';
    return;
  }

  var hoy = _today();
  tb.innerHTML = rows.map(function(c){
    var vencida = _isVencida(c);
    var vencStyle = vencida ? 'color:#b02020;font-weight:600' : '';
    var actions = '';
    if(c.status==='pendiente'||c.status==='parcial'){
      actions += '<button class="btn pp-pagar-btn" style="font-size:.62rem;padding:3px 8px" data-id="'+_esc(c.id)+'">💳 Pagar</button>';
    }
    if(c.pdf_base64){
      actions += ' <button class="btn btn-out pp-viewpdf-btn" style="font-size:.62rem;padding:3px 8px" data-id="'+_esc(c.id)+'">📄</button>';
    }
    return '<tr>'
      + '<td style="font-weight:600;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+_esc(c.proveedor)+'</td>'
      + '<td>'+_empPill(c.empresa)+'</td>'
      + '<td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+_esc(c.lineas&&c.lineas.length>1 ? c.lineas.length+' conceptos' : c.concepto)+'</td>'
      + '<td class="r mo">'+_fmt(c.total_mxn)+'</td>'
      + '<td class="r mo pos">'+_fmt(c.monto_pagado_mxn)+'</td>'
      + '<td class="r mo" style="font-weight:700;'+(c.saldo_mxn>0?'color:#b02020':'color:#007a48')+'">'+_fmt(c.saldo_mxn)+'</td>'
      + '<td style="'+vencStyle+'">'+(c.fecha_vencimiento ? _fmtD(c.fecha_vencimiento) + (vencida?' ⚠️':'') : '—')+'</td>'
      + '<td>'+_statusPill(c.status)+'</td>'
      + '<td style="white-space:nowrap">'+actions+'</td>'
      + '</tr>';
  }).join('');
  tb.querySelectorAll('.pp-pagar-btn').forEach(function(b){ b.onclick = function(){ ppOpenPago(b.dataset.id); }; });
  tb.querySelectorAll('.pp-viewpdf-btn').forEach(function(b){ b.onclick = function(){ ppViewPDF(b.dataset.id); }; });
}

// ── Register Payment Modal ──
function ppOpenPago(cxpId){
  var cxp = _cxpStore.cuentas.find(function(c){ return c.id === cxpId; });
  if(!cxp) return;

  var html = '<div style="padding:20px;max-width:420px">';
  html += '<div style="font-family:Poppins,sans-serif;font-size:.95rem;font-weight:700;margin-bottom:4px">💳 Registrar Pago</div>';
  html += '<div style="font-size:.72rem;color:var(--muted);margin-bottom:16px">'+_esc(cxp.proveedor)+' — '+_esc(cxp.concepto)+'</div>';

  // Summary
  html += '<div style="display:flex;gap:10px;margin-bottom:16px">';
  html += '<div style="flex:1;background:var(--bg);border-radius:var(--r);padding:10px;text-align:center">';
  html += '<div style="font-size:.62rem;color:var(--muted);text-transform:uppercase">Total</div>';
  html += '<div style="font-weight:700;font-size:.9rem">'+_fmt(cxp.total_mxn)+'</div></div>';
  html += '<div style="flex:1;background:var(--bg);border-radius:var(--r);padding:10px;text-align:center">';
  html += '<div style="font-size:.62rem;color:var(--muted);text-transform:uppercase">Pagado</div>';
  html += '<div style="font-weight:700;font-size:.9rem;color:#007a48">'+_fmt(cxp.monto_pagado_mxn)+'</div></div>';
  html += '<div style="flex:1;background:var(--red-bg);border-radius:var(--r);padding:10px;text-align:center">';
  html += '<div style="font-size:.62rem;color:#b02020;text-transform:uppercase">Saldo</div>';
  html += '<div style="font-weight:700;font-size:.9rem;color:#b02020">'+_fmt(cxp.saldo_mxn)+'</div></div>';
  html += '</div>';

  // Form
  html += '<div style="display:flex;flex-direction:column;gap:10px">';
  html += '<div><label style="font-size:.68rem;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">Monto del Pago (MXN)</label>';
  html += '<input type="number" id="pago-monto" class="fi" value="'+cxp.saldo_mxn+'" min="1" max="'+cxp.saldo_mxn+'" step="0.01" style="width:100%;font-size:.85rem;padding:8px 10px;font-weight:700"></div>';
  html += '<div><label style="font-size:.68rem;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">Fecha del Pago</label>';
  html += '<input type="date" id="pago-fecha" class="fi" value="'+_today()+'" style="width:100%;font-size:.78rem;padding:7px 10px"></div>';
  html += '<div><label style="font-size:.68rem;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">Método de Pago</label>';
  html += '<select id="pago-metodo" style="width:100%;padding:7px 10px;border-radius:var(--r);border:1px solid var(--border2);font-size:.78rem;background:var(--white);color:var(--text)">';
  _METODOS_PAGO.forEach(function(m){ html += '<option value="'+m+'">'+m+'</option>'; });
  html += '</select></div>';
  html += '<div><label style="font-size:.68rem;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">Referencia / Nota</label>';
  html += '<input type="text" id="pago-ref" class="fi" placeholder="REF-12345" style="width:100%;font-size:.78rem;padding:7px 10px"></div>';
  html += '</div>';

  // Actions
  html += '<div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px">';
  html += '<button class="btn btn-out pp-close-modal-btn">Cancelar</button>';
  html += '<button class="btn pp-save-pago-btn" data-id="'+_esc(cxp.id)+'">💾 Registrar Pago</button>';
  html += '</div>';

  html += '</div>';

  openModal('pago_modal', 'Registrar Pago', html);
  document.querySelectorAll('.pp-close-modal-btn').forEach(function(b){ b.onclick = closeModal; });
  document.querySelectorAll('.pp-save-pago-btn').forEach(function(b){ b.onclick = function(){ ppSavePago(b.dataset.id); }; });
}

function ppSavePago(cxpId){
  var cxp = _cxpStore.cuentas.find(function(c){ return c.id === cxpId; });
  if(!cxp) return;

  var monto  = parseFloat((document.getElementById('pago-monto')||{}).value) || 0;
  var fecha  = (document.getElementById('pago-fecha')||{}).value || _today();
  var metodo = (document.getElementById('pago-metodo')||{}).value || 'Transferencia';
  var ref    = (document.getElementById('pago-ref')||{}).value || '';

  if(monto <= 0){ toast('❌ El monto debe ser mayor a 0'); return; }
  if(monto > cxp.saldo_mxn + 0.01){ toast('❌ El monto excede el saldo pendiente'); return; }

  // Create payment record
  var pago = {
    id: 'pago_' + Date.now(),
    cxp_id: cxpId,
    monto_mxn: Math.round(monto * 100) / 100,
    fecha: fecha,
    metodo: metodo,
    referencia: ref.trim(),
    notas: '',
    created_at: _now()
  };
  _cxpStore.pagos.push(pago);

  // Update CxP
  cxp.monto_pagado_mxn = Math.round((cxp.monto_pagado_mxn + monto) * 100) / 100;
  cxp.saldo_mxn = Math.round((cxp.total_mxn - cxp.monto_pagado_mxn) * 100) / 100;
  if(cxp.saldo_mxn <= 0.01){
    cxp.saldo_mxn = 0;
    cxp.status = 'pagada';
  } else {
    cxp.status = 'parcial';
  }
  cxp.updated_at = _now();

  cxpSave();
  closeModal();

  // Re-inject gastos into P&L
  if(typeof ceInjectGastos === 'function') ceInjectGastos();
  if(typeof syncFlujoToRecs === 'function') syncFlujoToRecs();

  toast('✅ Pago registrado — '+_fmt(monto)+' a '+cxp.proveedor);
  ppRenderAll();
}

// ── View PDF ──
function ppViewPDF(cxpId){
  var cxp = _cxpStore.cuentas.find(function(c){ return c.id === cxpId; });
  if(!cxp || !cxp.pdf_base64) return;
  var blob;
  try{
    var b64 = cxp.pdf_base64.split(',')[1] || cxp.pdf_base64;
    var raw = atob(b64);
    var bytes = new Uint8Array(raw.length);
    for(var i=0;i<raw.length;i++) bytes[i] = raw.charCodeAt(i);
    blob = new Blob([bytes],{type:'application/pdf'});
  }catch(e){ toast('❌ Error abriendo PDF'); return; }
  var url = URL.createObjectURL(blob);
  var html = '<div style="padding:10px"><iframe src="'+url+'" style="width:100%;height:70vh;border:none;border-radius:var(--r)"></iframe></div>';
  openModal('pdf_viewer', 'Factura PDF', html);
}

// ── Payment history table ──
function ppRenderPagosTable(){
  var tb = document.getElementById('pp-pagos-tbody');
  if(!tb) return;
  var pagos = _cxpStore.pagos.slice().reverse().slice(0, 50); // Last 50
  if(!pagos.length){
    tb.innerHTML = '<tr><td colspan="6" style="text-align:center;color:var(--muted);padding:24px;font-size:.78rem">No hay pagos registrados</td></tr>';
    return;
  }
  tb.innerHTML = pagos.map(function(p){
    var cxp = _cxpStore.cuentas.find(function(c){ return c.id === p.cxp_id; });
    return '<tr>'
      + '<td>'+_fmtD(p.fecha)+'</td>'
      + '<td style="font-weight:600">'+_esc(cxp ? cxp.proveedor : '—')+'</td>'
      + '<td>'+(cxp ? _empPill(cxp.empresa) : '—')+'</td>'
      + '<td class="r mo pos" style="font-weight:700">'+_fmt(p.monto_mxn)+'</td>'
      + '<td>'+_esc(p.metodo)+'</td>'
      + '<td style="font-size:.72rem;color:var(--muted)">'+_esc(p.referencia)+'</td>'
      + '</tr>';
  }).join('');
}

// ── Vencimientos chart ──
function ppRenderChart(){
  var canvas = document.getElementById('c-pp-vencimientos');
  if(!canvas || typeof Chart === 'undefined') return;

  // Destroy previous
  if(typeof dc === 'function') dc('c-pp-vencimientos');

  var pendientes = _cxpStore.cuentas.filter(function(c){ return c.status==='pendiente'||c.status==='parcial'; });
  var months = {};
  var hoy = _today();

  pendientes.forEach(function(c){
    var key = c.fecha_vencimiento ? c.fecha_vencimiento.substring(0,7) : 'Sin fecha';
    if(!months[key]) months[key] = 0;
    months[key] += c.saldo_mxn;
  });

  var keys = Object.keys(months).sort();
  var labels = keys.map(function(k){ return k === 'Sin fecha' ? k : k; });
  var values = keys.map(function(k){ return months[k]; });
  var colors = keys.map(function(k){ return k < hoy.substring(0,7) ? '#e53935' : '#0073ea'; });

  if(typeof CH === 'undefined') window.CH = {};
  CH['c-pp-vencimientos'] = new Chart(canvas, {
    type: 'bar',
    data: {
      labels: labels,
      datasets: [{
        label: 'Saldo Pendiente',
        data: values,
        backgroundColor: colors,
        borderRadius: 4
      }]
    },
    options: {
      responsive: true,
      plugins: { legend:{ display:false } },
      scales: {
        y: { ticks: { callback: function(v){ return '$'+Math.round(v/1000)+'K'; } } }
      }
    }
  });
}


// ══════════════════════════════════════════════════════════
//  P&L INJECTION: ceInjectGastos()
// ══════════════════════════════════════════════════════════
function ceInjectGastos(){
  // 1. Remove previous auto-invoice rows
  if(typeof _ceCleanFGRows === 'function') _ceCleanFGRows();

  // 2. Load CxP data
  cxpLoad();
  var yr = String(typeof _year !== 'undefined' ? _year : new Date().getFullYear());

  // 3. Group payments by CxP and month
  var cxpPayments = {};
  _cxpStore.pagos.forEach(function(pago){
    if(!pago.fecha || !pago.fecha.startsWith(yr)) return;
    var cxp = _cxpStore.cuentas.find(function(c){ return c.id === pago.cxp_id; });
    if(!cxp) return;

    if(!cxpPayments[cxp.id]) cxpPayments[cxp.id] = { cxp:cxp, monthlyPayments:Array(12).fill(0) };
    var mes = parseInt(pago.fecha.substring(5,7)) - 1;
    if(mes >= 0 && mes < 12) cxpPayments[cxp.id].monthlyPayments[mes] += pago.monto_mxn;
  });

  // 4. Build entries: split per line item for multi-concepto CxPs
  var entries = [];
  Object.values(cxpPayments).forEach(function(item){
    var cxp = item.cxp;
    var payments = item.monthlyPayments;

    if(cxp.lineas && cxp.lineas.length > 1){
      // Multi-line: distribute payments proportionally per line
      var totalImporte = cxp.lineas.reduce(function(a,l){ return a + l.importe; }, 0);
      cxp.lineas.forEach(function(linea, idx){
        var ratio = totalImporte > 0 ? linea.importe / totalImporte : 0;
        var lineVals = payments.map(function(v){ return Math.round(v * ratio); });
        entries.push({
          cxp: {
            id: cxp.id + '_L' + idx,
            proveedor: cxp.proveedor,
            concepto: linea.concepto || cxp.concepto,
            empresa: cxp.empresa,
            categoria: linea.categoria,
            folio_fiscal: cxp.folio_fiscal
          },
          vals: lineVals
        });
      });
    } else {
      // Single-line (legacy): one entry with full payment
      entries.push({ cxp: cxp, vals: payments });
    }
  });

  // 5. Inject into FG_ROWS via the global helper
  if(typeof _ceInjectEntries === 'function') _ceInjectEntries(entries, yr);
}


// ══════════════════════════════════════════════════════════
//  EXPORTS
// ══════════════════════════════════════════════════════════
window.rCargaEgresos    = rCargaEgresos;
window.rPagosPendientes = rPagosPendientes;
window.ceSetMode        = ceSetMode;
window.ceOnMonedaChange = ceOnMonedaChange;
window.ceHandleDrop     = ceHandleDrop;
window.ceLoadFile       = ceLoadFile;
window.ceManualDrop     = ceManualDrop;
window.ceManualAttach   = ceManualAttach;
window.ceClearForm      = ceClearForm;
window.ceSave           = ceSave;
window.ceDeleteCxp      = ceDeleteCxp;
window.ceFilterHistory  = ceFilterHistory;
window.ppFilter         = ppFilter;
window.ppOpenPago       = ppOpenPago;
window.ppSavePago       = ppSavePago;
window.ppViewPDF        = ppViewPDF;
window.ceInjectGastos     = ceInjectGastos;
window.cxpLoad            = cxpLoad;
window.ceAddManualLinea   = ceAddManualLinea;
window.ceRemoveLinea      = ceRemoveLinea;
window.ceRecalcFromLineas = ceRecalcFromLineas;
window.ceSuggestCategory  = ceSuggestCategory;

// Register views
if(typeof registerView === 'function'){
  registerView('carga_egresos', function(){ rCargaEgresos(); });
  registerView('pagos_pendientes', function(){ rPagosPendientes(); });
}

})(window);
