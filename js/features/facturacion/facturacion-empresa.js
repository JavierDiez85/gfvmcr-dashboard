// GF — Facturación por Empresa: vista pre-filtrada de egresos/CxP/pagos
// Reutiliza el mismo store gf_cxp que facturacion-egresos.js
// ═══════════════════════════════════════════════════════════════
(function(window){
'use strict';

// ── Config ─────────────────────────────────────────────
var CXP_KEY = 'gf_cxp';
var VIEW_MAP = {
  'Salem':'fact_tarjetas',
  'Endless':'fact_endless',
  'Dynamo':'fact_dynamo',
  'Wirebit':'fact_wirebit',
  'Stellaris':'fact_stellaris'
};
var ENT_ICONS = {Salem:'💙',Endless:'💚',Dynamo:'🔶',Wirebit:'💜',Stellaris:'🔴'};
var ENT_COLORS = {Salem:'#0073ea',Endless:'#00b875',Dynamo:'#ff7043',Wirebit:'#9b51e0',Stellaris:'#e53935'};
var METODOS_PAGO = ['Transferencia','Efectivo','Cheque','Tarjeta'];

// ── Module state ───────────────────────────────────────
var _feEmpresa = null;    // currently rendered company
var _feMode = 'idle';     // idle | cfdi | manual | efectivo
var _fePdfData = null;
var _fePreview = null;

// ── Store access (shared localStorage with facturacion-egresos) ──
function _feLoad(){
  try{ return DB.get(CXP_KEY) || {cuentas:[],pagos:[]}; }catch(e){ return {cuentas:[],pagos:[]}; }
}
function _feSaveStore(store){
  DB.set(CXP_KEY, store);
}

// ── Helpers ─────────────────────────────────────────────
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

function _isVencida(cxp){
  if(cxp.status==='pagada'||cxp.status==='cancelada') return false;
  if(!cxp.fecha_vencimiento) return false;
  return cxp.fecha_vencimiento < _today();
}

function _catOptions(selected){
  var cats = (typeof CATS_GAS !== 'undefined') ? CATS_GAS : ['Administrativo','Renta','Operaciones','Varios'];
  return cats.map(function(c){ return '<option value="'+c+'"'+(c===selected?' selected':'')+'>'+c+'</option>'; }).join('');
}

function _selField(id,label,opts,extra){
  return '<div style="flex:1;min-width:150px">'
    + '<label style="font-size:.7rem;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">'+label+'</label>'
    + '<select id="'+id+'" '+(extra||'')+' style="width:100%;padding:7px 10px;border-radius:var(--r);border:1px solid var(--border2);font-size:.78rem;background:var(--white);color:var(--text)">'+opts+'</select>'
    + '</div>';
}

// ══════════════════════════════════════════════════════════
// MAIN RENDER
// ══════════════════════════════════════════════════════════
function rFactEmpresa(empresa){
  _feEmpresa = empresa;
  _feMode = 'idle';
  _fePdfData = null;
  _fePreview = null;

  var viewId = VIEW_MAP[empresa];
  if(!viewId) return;
  var el = document.getElementById('view-'+viewId);
  if(!el) return;

  var icon = ENT_ICONS[empresa] || '🧾';
  var color = ENT_COLORS[empresa] || '#666';

  var html = '';
  html += '<div style="font-family:\'Poppins\',sans-serif;font-size:.95rem;font-weight:700;margin-bottom:4px">'+icon+' Facturación — '+_esc(empresa)+'</div>';
  html += '<div style="font-size:.72rem;color:var(--muted);margin-bottom:18px">Registro de gastos, facturas de proveedores y cuentas por pagar de '+_esc(empresa)+'</div>';

  // ── Register invoice section ──
  html += '<div class="tw" style="margin-bottom:14px">';
  html += '<div class="tw-h"><div class="tw-ht">📄 Registrar Factura de Egreso</div>';
  html += '<div style="display:flex;gap:8px">';
  html += '<button class="btn btn-out" style="font-size:.7rem" onclick="feSetMode(\'manual\')">✏️ Captura Manual</button>';
  html += '<button class="btn btn-out" style="font-size:.7rem" onclick="feSetMode(\'efectivo\')">💵 Pago en Efectivo</button>';
  html += '</div></div>';

  html += '<div style="padding:16px;display:flex;flex-direction:column;gap:14px">';

  // Row 1: Empresa (fixed) + Categoría + Moneda + TC
  html += '<div style="display:flex;gap:12px;flex-wrap:wrap">';
  html += '<div style="flex:1;min-width:150px">';
  html += '<label style="font-size:.7rem;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">Empresa</label>';
  html += '<div style="padding:7px 10px;border-radius:var(--r);border:1px solid var(--border2);font-size:.78rem;background:var(--bg);color:var(--text);font-weight:600">';
  html += '<span style="display:inline-block;width:8px;height:8px;border-radius:50%;background:'+color+';margin-right:6px"></span>'+_esc(empresa)+'</div>';
  html += '</div>';
  html += _selField('fe-categoria','Categoría P&L','<option value="">— Seleccionar —</option>'+_catOptions());
  html += _selField('fe-moneda','Moneda','<option value="MXN">MXN</option><option value="USD">USD</option>','onchange="feOnMonedaChange()"');
  html += '<div id="fe-tc-wrap" style="flex:0 0 100px;display:none">';
  html += '<label style="font-size:.7rem;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">Tipo de Cambio</label>';
  html += '<input type="number" id="fe-tc" class="fi" step="0.01" value="1" min="0" style="width:100%;font-size:.78rem;padding:7px 10px">';
  html += '</div>';
  html += '</div>';

  // Drop zone (for CFDI PDFs)
  html += '<div id="fe-dropzone-wrap">';
  html += '<div id="fe-dropzone" ondrop="feHandleDrop(event)" ondragover="event.preventDefault();this.style.borderColor=\'var(--blue)\'" ondragleave="this.style.borderColor=\'var(--border2)\'" onclick="document.getElementById(\'fe-file-input\').click()" style="border:2px dashed var(--border2);border-radius:var(--r);padding:32px 20px;text-align:center;cursor:pointer;transition:border-color .2s">';
  html += '<div style="font-size:1.6rem;margin-bottom:6px">📎</div>';
  html += '<div style="font-size:.78rem;font-weight:600;color:var(--text)">Arrastra la factura PDF aquí</div>';
  html += '<div style="font-size:.68rem;color:var(--muted);margin-top:4px">CFDI mexicano — se extraerán datos automáticamente</div>';
  html += '<input type="file" id="fe-file-input" accept=".pdf" style="display:none" onchange="feLoadFile(this.files[0])">';
  html += '</div></div>';

  // Status
  html += '<div id="fe-status" style="display:none;font-size:.78rem;padding:10px 14px;border-radius:var(--r)"></div>';

  // Preview / Manual form
  html += '<div id="fe-form-area" style="display:none"></div>';

  html += '</div></div>';

  // ── KPIs ──
  html += '<div id="fe-kpis"></div>';

  // ── CxP Table ──
  html += '<div class="tw" style="margin-bottom:16px">';
  html += '<div class="tw-h"><div class="tw-ht">📋 Cuentas por Pagar — '+_esc(empresa)+'</div>';
  html += '<div style="display:flex;gap:8px;align-items:center">';
  html += '<select id="fe-f-status" onchange="feFilter()" style="padding:5px 10px;border-radius:var(--r);border:1px solid var(--border2);font-size:.72rem;background:var(--white);color:var(--text)">';
  html += '<option value="">Todos</option><option value="pendiente">Pendientes</option><option value="parcial">Parciales</option><option value="pagada">Pagadas</option><option value="cancelada">Canceladas</option></select>';
  html += '<input type="text" id="fe-search" placeholder="Buscar..." oninput="feFilter()" style="padding:5px 10px;border-radius:var(--r);border:1px solid var(--border2);font-size:.72rem;width:160px;background:var(--white);color:var(--text)">';
  html += '</div></div>';
  html += '<div style="overflow-x:auto"><table class="bt"><thead><tr>';
  html += '<th>Fecha</th><th>Proveedor</th><th>Categoría</th><th>Concepto</th><th class="r">Total</th><th class="r">Pagado</th><th class="r">Saldo</th><th>Vencimiento</th><th>Status</th><th>Origen</th><th style="width:100px"></th>';
  html += '</tr></thead><tbody id="fe-cxp-tbody"></tbody></table></div>';
  html += '</div>';

  // ── Chart ──
  html += UI.chartPanel({id:'c-fe-vencimientos',title:'Vencimientos por Mes',subtitle:'Saldo pendiente por mes de vencimiento',height:200,style:'margin-bottom:16px'});

  // ── Payment history ──
  html += '<div class="tw">';
  html += '<div class="tw-h"><div class="tw-ht">💸 Historial de Pagos Realizados</div></div>';
  html += '<div style="overflow-x:auto"><table class="bt"><thead><tr>';
  html += '<th>Fecha</th><th>Proveedor</th><th class="r">Monto</th><th>Método</th><th>Referencia</th>';
  html += '</tr></thead><tbody id="fe-pagos-tbody"></tbody></table></div>';
  html += '</div>';

  el.innerHTML = html;
  feRenderAll();
}

// ══════════════════════════════════════════════════════════
// FILTERING & RENDERING
// ══════════════════════════════════════════════════════════
function _feFilterCuentas(store, search){
  var st = (document.getElementById('fe-f-status')||{}).value || '';
  return store.cuentas.filter(function(c){
    if(c.empresa !== _feEmpresa) return false;
    if(st && c.status !== st) return false;
    if(search){
      var s = search.toLowerCase();
      if((c.proveedor||'').toLowerCase().indexOf(s)===-1 &&
         (c.concepto||'').toLowerCase().indexOf(s)===-1) return false;
    }
    return true;
  });
}

function feFilter(){
  var search = (document.getElementById('fe-search')||{}).value || '';
  feRenderAll(search);
}

function feRenderAll(search){
  feRenderKPIs(search);
  feRenderCxpTable(search);
  feRenderPagosTable();
  feRenderChart();
}

function feRenderKPIs(search){
  var el = document.getElementById('fe-kpis');
  if(!el) return;
  var store = _feLoad();
  var cuentas = _feFilterCuentas(store, search);
  var totalPend=0, vencidas=0, montoVencido=0, porVencer=0, pagadasMes=0, totalRegs=0;
  var hoy = _today();
  var mesCurrent = hoy.substring(0,7);

  cuentas.forEach(function(c){
    totalRegs++;
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

function feRenderCxpTable(search){
  var tb = document.getElementById('fe-cxp-tbody');
  if(!tb) return;
  var store = _feLoad();
  var rows = _feFilterCuentas(store, search);

  rows.sort(function(a,b){
    var oa = (a.status==='pendiente'||a.status==='parcial') ? 0 : 1;
    var ob = (b.status==='pendiente'||b.status==='parcial') ? 0 : 1;
    if(oa !== ob) return oa - ob;
    return (a.fecha_vencimiento||'9999') < (b.fecha_vencimiento||'9999') ? -1 : 1;
  });

  if(!rows.length){
    tb.innerHTML = '<tr><td colspan="11" style="text-align:center;color:var(--muted);padding:30px;font-size:.78rem">No hay cuentas por pagar para '+_esc(_feEmpresa)+'</td></tr>';
    return;
  }

  var hoy = _today();
  tb.innerHTML = rows.map(function(c){
    var vencida = _isVencida(c);
    var vencStyle = vencida ? 'color:#b02020;font-weight:600' : '';
    var actions = '';
    if(c.status==='pendiente'||c.status==='parcial'){
      actions += '<button class="btn" style="font-size:.62rem;padding:3px 8px" onclick="feOpenPago(\''+c.id+'\')">💳 Pagar</button>';
    }
    if(c.pdf_base64){
      actions += ' <button class="btn btn-out" style="font-size:.62rem;padding:3px 8px" onclick="feViewPDF(\''+c.id+'\')">📄</button>';
    }
    actions += ' <button class="btn btn-out" style="font-size:.62rem;padding:3px 6px;color:#b02020" onclick="feDeleteCxp(\''+c.id+'\')">✕</button>';
    return '<tr>'
      + '<td>'+_fmtD(c.fecha_factura)+'</td>'
      + '<td style="font-weight:600;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+_esc(c.proveedor)+'</td>'
      + '<td style="font-size:.72rem">'+_esc(c.categoria||'—')+'</td>'
      + '<td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+_esc(c.lineas&&c.lineas.length>1 ? c.lineas.length+' conceptos' : c.concepto)+'</td>'
      + '<td class="r mo">'+_fmt(c.total_mxn)+'</td>'
      + '<td class="r mo pos">'+_fmt(c.monto_pagado_mxn)+'</td>'
      + '<td class="r mo" style="font-weight:700;'+(c.saldo_mxn>0?'color:#b02020':'color:#007a48')+'">'+_fmt(c.saldo_mxn)+'</td>'
      + '<td style="'+vencStyle+'">'+(c.fecha_vencimiento ? _fmtD(c.fecha_vencimiento) + (vencida?' ⚠️':'') : '—')+'</td>'
      + '<td>'+_statusPill(c.status)+'</td>'
      + '<td>'+_origenPill(c.origen)+'</td>'
      + '<td style="white-space:nowrap">'+actions+'</td>'
      + '</tr>';
  }).join('');
}

function feRenderPagosTable(){
  var tb = document.getElementById('fe-pagos-tbody');
  if(!tb) return;
  var store = _feLoad();
  // Build lookup of CxP ids for this empresa
  var myCxpIds = {};
  store.cuentas.forEach(function(c){ if(c.empresa === _feEmpresa) myCxpIds[c.id] = c; });

  var pagos = store.pagos.filter(function(p){ return myCxpIds[p.cxp_id]; });
  pagos.sort(function(a,b){ return (b.fecha||'') < (a.fecha||'') ? -1 : 1; });

  if(!pagos.length){
    tb.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:20px;font-size:.78rem">No hay pagos registrados</td></tr>';
    return;
  }

  tb.innerHTML = pagos.map(function(p){
    var cxp = myCxpIds[p.cxp_id];
    return '<tr>'
      + '<td>'+_fmtD(p.fecha)+'</td>'
      + '<td style="font-weight:600">'+_esc(cxp ? cxp.proveedor : '—')+'</td>'
      + '<td class="r mo pos">'+_fmt(p.monto_mxn)+'</td>'
      + '<td>'+_esc(p.metodo||'—')+'</td>'
      + '<td>'+_esc(p.referencia||'—')+'</td>'
      + '</tr>';
  }).join('');
}

function feRenderChart(){
  var canvas = document.getElementById('c-fe-vencimientos');
  if(!canvas || typeof Chart === 'undefined') return;
  var store = _feLoad();
  var cuentas = store.cuentas.filter(function(c){
    return c.empresa === _feEmpresa && (c.status==='pendiente'||c.status==='parcial');
  });

  // Group by month of vencimiento
  var meses = {};
  cuentas.forEach(function(c){
    var m = (c.fecha_vencimiento||'').substring(0,7);
    if(!m) m = 'Sin fecha';
    meses[m] = (meses[m]||0) + c.saldo_mxn;
  });

  var labels = Object.keys(meses).sort();
  var data = labels.map(function(l){ return meses[l]; });
  var color = ENT_COLORS[_feEmpresa] || '#6b7280';

  // Destroy previous chart
  if(canvas._feChart){ canvas._feChart.destroy(); }

  canvas._feChart = new Chart(canvas, {
    type:'bar',
    data:{
      labels:labels.map(function(l){ return l==='Sin fecha' ? l : l; }),
      datasets:[{
        label:'Saldo pendiente',
        data:data,
        backgroundColor:color+'40',
        borderColor:color,
        borderWidth:1,
        borderRadius:4
      }]
    },
    options:{
      responsive:true, maintainAspectRatio:false,
      plugins:{legend:{display:false}},
      scales:{
        y:{beginAtZero:true, ticks:{callback:function(v){return _fmt(v);},font:{size:10}}},
        x:{ticks:{font:{size:10}}}
      }
    }
  });
}

// ══════════════════════════════════════════════════════════
// FORM: MODE SWITCHING
// ══════════════════════════════════════════════════════════
function feSetMode(mode){
  _feMode = mode;
  _fePreview = null;
  _fePdfData = null;
  var dz = document.getElementById('fe-dropzone-wrap');
  var fa = document.getElementById('fe-form-area');
  var st = document.getElementById('fe-status');
  if(st) st.style.display = 'none';

  if(mode === 'manual' || mode === 'efectivo'){
    if(dz) dz.style.display = 'none';
    if(fa){ fa.style.display = 'block'; fa.innerHTML = _feManualFormHTML(mode); }
  } else {
    if(dz) dz.style.display = '';
    if(fa){ fa.style.display = 'none'; fa.innerHTML = ''; }
  }
}

function feOnMonedaChange(){
  var m = document.getElementById('fe-moneda');
  var w = document.getElementById('fe-tc-wrap');
  if(w) w.style.display = (m && m.value === 'USD') ? '' : 'none';
}

// ── Manual form HTML ──
function _feManualFormHTML(mode){
  var isEfectivo = (mode === 'efectivo');
  var html = '<div style="border:1px solid var(--border2);border-radius:var(--r);padding:16px">';
  html += '<div style="font-size:.78rem;font-weight:700;color:var(--text);margin-bottom:12px">'+(isEfectivo ? '💵 Registro de Pago en Efectivo' : '✏️ Captura Manual de Factura')+'</div>';

  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 14px;font-size:.78rem">';

  html += '<div><label style="font-size:.68rem;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">Proveedor</label>';
  html += '<input type="text" id="fe-f-proveedor" class="fi" placeholder="Nombre del proveedor" style="width:100%;font-size:.78rem;padding:7px 10px"></div>';

  html += '<div><label style="font-size:.68rem;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">RFC</label>';
  html += '<input type="text" id="fe-f-rfc" class="fi" placeholder="RFC del proveedor" style="width:100%;font-size:.78rem;padding:7px 10px"></div>';

  html += '<div style="grid-column:1/-1"><label style="font-size:.68rem;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">Concepto / Descripción</label>';
  html += '<input type="text" id="fe-f-concepto" class="fi" placeholder="Descripción del gasto" style="width:100%;font-size:.78rem;padding:7px 10px"></div>';

  html += '<div><label style="font-size:.68rem;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">Subtotal</label>';
  html += '<input type="number" id="fe-f-subtotal" class="fi" step="0.01" min="0" oninput="feCalcTotal()" style="width:100%;font-size:.78rem;padding:7px 10px"></div>';

  html += '<div><label style="font-size:.68rem;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">IVA</label>';
  html += '<input type="number" id="fe-f-iva" class="fi" step="0.01" min="0" oninput="feCalcTotal()" style="width:100%;font-size:.78rem;padding:7px 10px"></div>';

  html += '<div><label style="font-size:.68rem;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">Total</label>';
  html += '<input type="number" id="fe-f-total" class="fi" step="0.01" min="0" style="width:100%;font-size:.78rem;padding:7px 10px;font-weight:700"></div>';

  html += '<div><label style="font-size:.68rem;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">Fecha Factura</label>';
  html += '<input type="date" id="fe-f-fecha-factura" class="fi" value="'+_today()+'" style="width:100%;font-size:.78rem;padding:7px 10px"></div>';

  if(!isEfectivo){
    html += '<div><label style="font-size:.68rem;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">Fecha Vencimiento</label>';
    html += '<input type="date" id="fe-f-vencimiento" class="fi" style="width:100%;font-size:.78rem;padding:7px 10px"></div>';
  }

  // PDF attachment for manual
  html += '<div style="grid-column:1/-1">';
  html += '<label style="font-size:.68rem;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">Adjuntar PDF (opcional)</label>';
  html += '<div style="display:flex;gap:8px;align-items:center">';
  html += '<input type="file" id="fe-manual-file" accept=".pdf" onchange="feManualAttach(this.files[0])" style="font-size:.72rem">';
  html += '<div id="fe-manual-pdf-name" style="display:none;font-size:.72rem;color:#007a48"></div>';
  html += '</div></div>';

  html += '</div>';

  // Actions
  html += '<div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px">';
  html += '<button class="btn btn-out" onclick="feClearForm()">Cancelar</button>';
  html += '<button class="btn" onclick="feSave()">💾 Guardar</button>';
  html += '</div>';

  html += '</div>';
  return html;
}

// ── CFDI Preview HTML ──
function _feRenderPreview(){
  var fa = document.getElementById('fe-form-area');
  if(!fa || !_fePreview) return;
  var d = _fePreview;

  var html = '<div style="border:1px solid var(--border2);border-radius:var(--r);padding:16px">';
  html += '<div style="font-size:.78rem;font-weight:700;color:var(--text);margin-bottom:10px">🔍 Datos Extraídos del CFDI</div>';

  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 14px;font-size:.78rem;margin-bottom:14px">';

  // Editable fields
  html += _pvField('Proveedor (Emisor)', d.nombre_emisor, 'fe-f-proveedor', true);
  html += _pvField('RFC Emisor', d.rfc_emisor, 'fe-f-rfc');
  html += _pvField('Receptor', d.nombre_receptor);
  html += _pvField('RFC Receptor', d.rfc_receptor);
  html += _pvField('Folio Fiscal', d.folio_fiscal);
  html += _pvField('Fecha Emisión', d.fecha_emision ? d.fecha_emision.substring(0,10) : '', 'fe-f-fecha-factura', true, 'date');

  if(!d.conceptos || d.conceptos.length <= 1){
    html += '<div style="grid-column:1/-1">'+_pvField('Concepto', d.descripcion, 'fe-f-concepto', true)+'</div>';
  }

  html += _pvField('Subtotal', d.subtotal, 'fe-f-subtotal', true, 'number');
  html += _pvField('IVA', d.iva, 'fe-f-iva', true, 'number');
  html += _pvField('Total', d.total, 'fe-f-total', true, 'number');

  html += '</div>';

  // Multi-line conceptos
  if(d.conceptos && d.conceptos.length > 1){
    html += _feLineasTableHTML(d.conceptos);
  }

  // Vencimiento
  html += '<div style="margin-bottom:14px"><label style="font-size:.68rem;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">Fecha Vencimiento</label>';
  html += '<input type="date" id="fe-f-vencimiento" class="fi" style="width:200px;font-size:.78rem;padding:7px 10px"></div>';

  // Actions
  html += '<div style="display:flex;justify-content:flex-end;gap:10px">';
  html += '<button class="btn btn-out" onclick="feClearForm()">Cancelar</button>';
  html += '<button class="btn" onclick="feSave()">💾 Guardar CxP</button>';
  html += '</div>';

  html += '</div>';
  fa.style.display = 'block';
  fa.innerHTML = html;
}

function _pvField(label, value, inputId, editable, type){
  var v = _esc(value||'');
  if(editable && inputId){
    var t = type || 'text';
    return '<div><label style="font-size:.68rem;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">'+label+'</label>'
      + '<input type="'+t+'" id="'+inputId+'" class="fi" value="'+v+'" style="width:100%;font-size:.78rem;padding:7px 10px"></div>';
  }
  return '<div><label style="font-size:.68rem;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">'+label+'</label>'
    + '<div style="padding:7px 10px;font-size:.78rem;color:var(--text)">'+v+'</div></div>';
}

function _feLineasTableHTML(conceptos){
  var html = '<div style="margin-top:6px;margin-bottom:14px">';
  html += '<span style="font-size:.68rem;font-weight:600;color:var(--muted)">Conceptos de la Factura ('+conceptos.length+' líneas)</span>';
  html += '<table class="bt" style="font-size:.74rem;margin-top:6px"><thead><tr>';
  html += '<th>Descripción</th><th class="r" style="width:110px">Importe</th><th style="width:150px">Categoría P&L</th>';
  html += '</tr></thead><tbody id="fe-lineas-tbody">';
  conceptos.forEach(function(c){
    var suggested = (typeof ceSuggestCategory === 'function') ? ceSuggestCategory(c.descripcion||c.concepto||'') : '';
    html += '<tr class="fe-linea-row">';
    html += '<td><input type="text" class="fi fe-linea-desc" value="'+_esc(c.descripcion||c.concepto||'')+'" style="width:100%;font-size:.73rem;padding:4px 6px"></td>';
    html += '<td class="r"><input type="number" class="fi fe-linea-importe" value="'+(c.importe||0)+'" step="0.01" min="0" style="width:100%;font-size:.73rem;padding:4px 6px;text-align:right"></td>';
    html += '<td><select class="fe-linea-cat" style="width:100%;padding:5px 6px;border-radius:var(--r);border:1px solid var(--border2);font-size:.72rem;background:var(--white);color:var(--text)">';
    html += '<option value="">—</option>'+_catOptions(suggested);
    html += '</select></td>';
    html += '</tr>';
  });
  html += '</tbody></table></div>';
  return html;
}

// ══════════════════════════════════════════════════════════
// PDF HANDLING
// ══════════════════════════════════════════════════════════
function feHandleDrop(e){
  e.preventDefault();
  e.stopPropagation();
  var dz = document.getElementById('fe-dropzone');
  if(dz) dz.style.borderColor = 'var(--border2)';
  var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
  if(f) feLoadFile(f);
}

function feLoadFile(file){
  if(!file) return;
  if(!file.name.toLowerCase().endsWith('.pdf')){
    _feSetStatus('error','Solo se aceptan archivos PDF');
    return;
  }
  _feSetStatus('loading','Analizando PDF: '+_esc(file.name)+'...');
  var reader = new FileReader();
  reader.onload = function(ev){
    _fePdfData = { base64: ev.target.result, filename: file.name };
    _feAnalyzePDF(ev.target.result, file.name);
  };
  reader.readAsDataURL(file);
}

function _feAnalyzePDF(dataUrl, filename){
  try{
    var b64 = dataUrl.split(',')[1];
    var raw = atob(b64);
    var bytes = new Uint8Array(raw.length);
    for(var i=0;i<raw.length;i++) bytes[i] = raw.charCodeAt(i);

    pdfjsLib.getDocument({data:bytes}).promise.then(function(pdf){
      var pages=[]; var total=pdf.numPages;
      function nextPage(n){
        if(n > total){
          var fullText = pages.join(' ');
          _fePreview = (typeof cfParseCFDI === 'function') ? cfParseCFDI(fullText) : {descripcion:fullText};
          _feMode = 'cfdi';
          _feSetStatus('ok','PDF analizado correctamente — '+filename);
          _feRenderPreview();
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
      _feSetStatus('error','Error leyendo PDF: '+err.message);
      _feMode = 'manual';
      var fa = document.getElementById('fe-form-area');
      if(fa){ fa.style.display='block'; fa.innerHTML = _feManualFormHTML('manual'); }
    });
  }catch(err){
    _feSetStatus('error','Error al analizar: '+err.message);
  }
}

function _feSetStatus(type, msg){
  var el = document.getElementById('fe-status');
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

function feManualAttach(file){
  if(!file || !file.name.toLowerCase().endsWith('.pdf')) return;
  var reader = new FileReader();
  reader.onload = function(ev){
    _fePdfData = { base64: ev.target.result, filename: file.name };
    var el = document.getElementById('fe-manual-pdf-name');
    if(el){ el.style.display = 'block'; el.textContent = '✅ '+file.name+' adjuntado'; }
  };
  reader.readAsDataURL(file);
}

// ══════════════════════════════════════════════════════════
// SAVE CxP
// ══════════════════════════════════════════════════════════
function feSave(){
  var empresa   = _feEmpresa;
  var categoria = (document.getElementById('fe-categoria')||{}).value;
  var moneda    = (document.getElementById('fe-moneda')||{}).value || 'MXN';
  var tc        = parseFloat((document.getElementById('fe-tc')||{}).value) || 1;
  var proveedor = (document.getElementById('fe-f-proveedor')||{}).value || '';
  var rfc       = (document.getElementById('fe-f-rfc')||{}).value || '';
  var concepto  = (document.getElementById('fe-f-concepto')||{}).value || '';
  var subtotal  = parseFloat((document.getElementById('fe-f-subtotal')||{}).value) || 0;
  var iva       = parseFloat((document.getElementById('fe-f-iva')||{}).value) || 0;
  var total     = parseFloat((document.getElementById('fe-f-total')||{}).value) || 0;
  var fechaFact = (document.getElementById('fe-f-fecha-factura')||{}).value || _today();
  var vencim    = (document.getElementById('fe-f-vencimiento')||{}).value || '';

  // Gather multi-line items if present
  var lineItems = _feGatherLineas();

  // Validations
  if(!empresa){ toast('❌ Error: empresa no definida'); return; }
  if(lineItems && lineItems.length > 1){
    var missingCat = lineItems.some(function(l){ return !l.categoria; });
    if(missingCat){ toast('❌ Selecciona la categoría para cada línea'); return; }
  } else {
    if(!categoria){ toast('❌ Selecciona la categoría P&L'); return; }
  }
  if(!proveedor.trim()){ toast('❌ Ingresa el nombre del proveedor'); return; }
  if(!total || total <= 0){ toast('❌ El total debe ser mayor a 0'); return; }

  var folio = (_fePreview && _fePreview.folio_fiscal) || '';

  // Check duplicate
  var store = _feLoad();
  if(folio){
    var dup = store.cuentas.find(function(c){ return c.folio_fiscal === folio; });
    if(dup){ toast('⚠️ Ya existe una CxP con ese folio fiscal'); return; }
  }

  if(moneda === 'MXN') tc = 1;
  var totalMXN = Math.round(total * tc);

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
    rfc_emisor: (_fePreview && _fePreview.rfc_emisor) || rfc.trim().toUpperCase(),
    fecha_emision: (_fePreview && _fePreview.fecha_emision) || '',
    fecha_factura: fechaFact,
    fecha_vencimiento: vencim,
    status: 'pendiente',
    monto_pagado_mxn: 0,
    saldo_mxn: totalMXN,
    origen: _feMode === 'efectivo' ? 'efectivo' : (_feMode === 'cfdi' ? 'cfdi' : 'manual'),
    pdf_filename: _fePdfData ? _fePdfData.filename : null,
    pdf_base64: _fePdfData ? _fePdfData.base64 : null,
    created_at: _now(),
    updated_at: _now()
  };

  store.cuentas.push(cxp);
  _feSaveStore(store);

  toast('✅ Cuenta por Pagar registrada — '+proveedor.trim());
  feClearForm();
  feRenderAll();
}

function _feGatherLineas(){
  var rows = document.querySelectorAll('.fe-linea-row');
  if(!rows || rows.length <= 1) return null;
  var items = [];
  rows.forEach(function(row){
    var desc = (row.querySelector('.fe-linea-desc')||{}).value || '';
    var imp  = parseFloat((row.querySelector('.fe-linea-importe')||{}).value) || 0;
    var cat  = (row.querySelector('.fe-linea-cat')||{}).value || '';
    if(desc.trim() || imp > 0){
      items.push({concepto:desc.trim(), importe:imp, categoria:cat});
    }
  });
  return items.length > 1 ? items : null;
}

function feCalcTotal(){
  var sub = parseFloat((document.getElementById('fe-f-subtotal')||{}).value) || 0;
  var iva = parseFloat((document.getElementById('fe-f-iva')||{}).value) || 0;
  var totalEl = document.getElementById('fe-f-total');
  if(totalEl) totalEl.value = (sub + iva).toFixed(2);
}

function feClearForm(){
  _fePreview = null;
  _feMode = 'idle';
  _fePdfData = null;
  var fa = document.getElementById('fe-form-area');
  if(fa){ fa.style.display = 'none'; fa.innerHTML = ''; }
  var dz = document.getElementById('fe-dropzone-wrap');
  if(dz) dz.style.display = '';
  var st = document.getElementById('fe-status');
  if(st) st.style.display = 'none';
  var fi = document.getElementById('fe-file-input');
  if(fi) fi.value = '';
}

// ══════════════════════════════════════════════════════════
// PAYMENT MODAL
// ══════════════════════════════════════════════════════════
function feOpenPago(cxpId){
  var store = _feLoad();
  var cxp = store.cuentas.find(function(c){ return c.id === cxpId; });
  if(!cxp) return;

  var html = '<div style="padding:20px;max-width:420px">';
  html += '<div style="font-family:Poppins,sans-serif;font-size:.95rem;font-weight:700;margin-bottom:4px">💳 Registrar Pago</div>';
  html += '<div style="font-size:.72rem;color:var(--muted);margin-bottom:16px">'+_esc(cxp.proveedor)+' — '+_esc(cxp.concepto)+'</div>';

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

  html += '<div style="display:flex;flex-direction:column;gap:10px">';
  html += '<div><label style="font-size:.68rem;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">Monto del Pago (MXN)</label>';
  html += '<input type="number" id="fe-pago-monto" class="fi" value="'+cxp.saldo_mxn+'" min="1" max="'+cxp.saldo_mxn+'" step="0.01" style="width:100%;font-size:.85rem;padding:8px 10px;font-weight:700"></div>';
  html += '<div><label style="font-size:.68rem;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">Fecha del Pago</label>';
  html += '<input type="date" id="fe-pago-fecha" class="fi" value="'+_today()+'" style="width:100%;font-size:.78rem;padding:7px 10px"></div>';
  html += '<div><label style="font-size:.68rem;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">Método de Pago</label>';
  html += '<select id="fe-pago-metodo" style="width:100%;padding:7px 10px;border-radius:var(--r);border:1px solid var(--border2);font-size:.78rem;background:var(--white);color:var(--text)">';
  METODOS_PAGO.forEach(function(m){ html += '<option value="'+m+'">'+m+'</option>'; });
  html += '</select></div>';
  html += '<div><label style="font-size:.68rem;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">Referencia / Nota</label>';
  html += '<input type="text" id="fe-pago-ref" class="fi" placeholder="REF-12345" style="width:100%;font-size:.78rem;padding:7px 10px"></div>';
  html += '</div>';

  html += '<div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px">';
  html += '<button class="btn btn-out" onclick="closeModal()">Cancelar</button>';
  html += '<button class="btn" onclick="feSavePago(\''+cxp.id+'\')">💾 Registrar Pago</button>';
  html += '</div>';
  html += '</div>';

  openModal('fe_pago_modal', 'Registrar Pago', html);
}

function feSavePago(cxpId){
  var store = _feLoad();
  var cxp = store.cuentas.find(function(c){ return c.id === cxpId; });
  if(!cxp) return;

  var monto  = parseFloat((document.getElementById('fe-pago-monto')||{}).value) || 0;
  var fecha  = (document.getElementById('fe-pago-fecha')||{}).value || _today();
  var metodo = (document.getElementById('fe-pago-metodo')||{}).value || 'Transferencia';
  var ref    = (document.getElementById('fe-pago-ref')||{}).value || '';

  if(monto <= 0){ toast('❌ El monto debe ser mayor a 0'); return; }
  if(monto > cxp.saldo_mxn + 0.01){ toast('❌ El monto excede el saldo pendiente'); return; }

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
  store.pagos.push(pago);

  cxp.monto_pagado_mxn = Math.round((cxp.monto_pagado_mxn + monto) * 100) / 100;
  cxp.saldo_mxn = Math.round((cxp.total_mxn - cxp.monto_pagado_mxn) * 100) / 100;
  if(cxp.saldo_mxn <= 0.01){
    cxp.saldo_mxn = 0;
    cxp.status = 'pagada';
  } else {
    cxp.status = 'parcial';
  }
  cxp.updated_at = _now();

  _feSaveStore(store);
  closeModal();
  toast('✅ Pago registrado — '+_fmt(monto));
  feRenderAll();
}

// ══════════════════════════════════════════════════════════
// DELETE CxP
// ══════════════════════════════════════════════════════════
function feDeleteCxp(cxpId){
  if(!confirm('¿Eliminar esta cuenta por pagar?')) return;
  var store = _feLoad();
  store.cuentas = store.cuentas.filter(function(c){ return c.id !== cxpId; });
  store.pagos = store.pagos.filter(function(p){ return p.cxp_id !== cxpId; });
  _feSaveStore(store);
  toast('🗑️ CxP eliminada');
  feRenderAll();
}

// ══════════════════════════════════════════════════════════
// VIEW PDF
// ══════════════════════════════════════════════════════════
function feViewPDF(cxpId){
  var store = _feLoad();
  var cxp = store.cuentas.find(function(c){ return c.id === cxpId; });
  if(!cxp || !cxp.pdf_base64) return;
  var w = window.open('');
  w.document.write('<html><head><title>'+_esc(cxp.pdf_filename||'PDF')+'</title></head><body style="margin:0"><embed src="'+cxp.pdf_base64+'" type="application/pdf" width="100%" height="100%" style="position:fixed;top:0;left:0;width:100%;height:100%"></embed></body></html>');
}

// ══════════════════════════════════════════════════════════
// REGISTER VIEWS
// ══════════════════════════════════════════════════════════
if(typeof registerView === 'function'){
  registerView('fact_tarjetas',  function(){ rFactEmpresa('Salem'); });
  registerView('fact_endless',   function(){ rFactEmpresa('Endless'); });
  registerView('fact_dynamo',    function(){ rFactEmpresa('Dynamo'); });
  registerView('fact_wirebit',   function(){ rFactEmpresa('Wirebit'); });
  registerView('fact_stellaris', function(){ rFactEmpresa('Stellaris'); });
}

// ══════════════════════════════════════════════════════════
// EXPOSE GLOBALS
// ══════════════════════════════════════════════════════════
window.rFactEmpresa   = rFactEmpresa;
window.feSetMode      = feSetMode;
window.feOnMonedaChange = feOnMonedaChange;
window.feHandleDrop   = feHandleDrop;
window.feLoadFile     = feLoadFile;
window.feManualAttach = feManualAttach;
window.feClearForm    = feClearForm;
window.feSave         = feSave;
window.feCalcTotal    = feCalcTotal;
window.feFilter       = feFilter;
window.feOpenPago     = feOpenPago;
window.feSavePago     = feSavePago;
window.feDeleteCxp    = feDeleteCxp;
window.feViewPDF      = feViewPDF;

})(window);
