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
    actions += ' <button onclick="cxpEditRow(\''+c.id+'\')" title="Editar factura" style="'+_emEditBtn+'" onmouseover="this.style.background=\'#0073ea\';this.style.color=\'#fff\'" onmouseout="this.style.background=\'rgba(0,115,234,.1)\';this.style.color=\'#0073ea\'">✏️</button>';
    actions += ' <button onclick="feDeleteCxp(\''+c.id+'\')" title="Eliminar factura" style="width:22px;height:22px;border-radius:50%;background:rgba(229,57,53,.12);border:1.5px solid #e53935;color:#e53935;cursor:pointer;font-size:.68rem;font-weight:900;display:inline-flex;align-items:center;justify-content:center;transition:all .15s;vertical-align:middle" onmouseover="this.style.background=\'#e53935\';this.style.color=\'#fff\'" onmouseout="this.style.background=\'rgba(229,57,53,.12)\';this.style.color=\'#e53935\'">✕</button>';
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
  ppRenderAll();
  recvRenderAll();
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
  ppRenderAll();
  recvRenderAll();
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
// EMITIDAS — Vista resumen + upload de facturas emitidas
// ══════════════════════════════════════════════════════════
var EMIT_VIEW_MAP = {Salem:'emit_salem',Endless:'emit_endless',Dynamo:'emit_dynamo',Wirebit:'emit_wirebit',Stellaris:'emit_stellaris'};
var RECV_VIEW_MAP = {Salem:'recv_salem',Endless:'recv_endless',Dynamo:'recv_dynamo',Wirebit:'recv_wirebit',Stellaris:'recv_stellaris'};
var PP_VIEW_MAP   = {Salem:'pp_salem',Endless:'pp_endless',Dynamo:'pp_dynamo',Wirebit:'pp_wirebit',Stellaris:'pp_stellaris'};
var CF_EMP_KEY    = {Salem:'salem_terminales',Endless:'endless',Dynamo:'dynamo',Wirebit:'wirebit',Stellaris:'stellaris'};
var CFDI_KEY      = 'gf_cfdi_facturas';

// State for emitidas
var _emitEmpresa = null;
var _emitPeriodo = 'mes';  // mes | trimestre | anual
var _emitPdfData = null;
var _emitPdfBase64 = null;

function _cfdiLoad(){
  try{ return DB.get(CFDI_KEY) || {uploads:[]}; }catch(e){ return {uploads:[]}; }
}
function _cfdiSave(d){ DB.set(CFDI_KEY, d); }

function _periodRange(periodo){
  var now = new Date();
  var y = now.getFullYear(), m = now.getMonth();
  var start, end;
  if(periodo === 'trimestre'){
    var qStart = m - (m % 3);
    start = new Date(y, qStart, 1);
    end = new Date(y, qStart + 3, 0);
  } else if(periodo === 'anual'){
    start = new Date(y, 0, 1);
    end = new Date(y, 11, 31);
  } else {
    start = new Date(y, m, 1);
    end = new Date(y, m + 1, 0);
  }
  return {
    from: start.toISOString().substring(0,10),
    to: end.toISOString().substring(0,10)
  };
}

function _inPeriod(dateStr, range){
  if(!dateStr) return false;
  var d = dateStr.substring(0,10);
  return d >= range.from && d <= range.to;
}

function rFactEmitidas(empresa){
  _emitEmpresa = empresa;
  _emitPeriodo = 'mes';
  _emitPdfData = null;
  _emitPdfBase64 = null;

  var viewId = EMIT_VIEW_MAP[empresa];
  if(!viewId) return;
  var el = document.getElementById('view-'+viewId);
  if(!el) return;

  var icon = ENT_ICONS[empresa] || '🧾';
  var color = ENT_COLORS[empresa] || '#666';

  var html = '';
  html += '<div style="font-family:\'Poppins\',sans-serif;font-size:.95rem;font-weight:700;margin-bottom:4px">'+icon+' Facturas Emitidas — '+_esc(empresa)+'</div>';
  html += '<div style="font-size:.72rem;color:var(--muted);margin-bottom:14px">Facturas expedidas por '+_esc(empresa)+' a sus clientes</div>';

  // Period buttons
  html += '<div style="display:flex;gap:6px;margin-bottom:14px">';
  html += '<button id="emit-p-mes" class="btn" style="font-size:.68rem;padding:4px 14px" onclick="emitSetPeriodo(\'mes\')">Mes</button>';
  html += '<button id="emit-p-trimestre" class="btn btn-out" style="font-size:.68rem;padding:4px 14px" onclick="emitSetPeriodo(\'trimestre\')">Trimestre</button>';
  html += '<button id="emit-p-anual" class="btn btn-out" style="font-size:.68rem;padding:4px 14px" onclick="emitSetPeriodo(\'anual\')">Año</button>';
  html += '</div>';

  // KPIs
  html += '<div id="emit-kpis"></div>';

  // Upload section
  html += '<div class="tw" style="margin-bottom:14px">';
  html += '<div class="tw-h"><div class="tw-ht">📤 Subir Factura Emitida</div>';
  html += '<button class="btn btn-out" style="font-size:.7rem" onclick="emitSetManual()">✏️ Registro Manual</button>';
  html += '</div>';
  html += '<div style="padding:16px">';

  // Drop zone
  html += '<div id="emit-dropzone" ondrop="emitHandleDrop(event)" ondragover="event.preventDefault();this.style.borderColor=\'var(--blue)\'" ondragleave="this.style.borderColor=\'var(--border2)\'" onclick="document.getElementById(\'emit-file-input\').click()" style="border:2px dashed var(--border2);border-radius:var(--r);padding:28px 20px;text-align:center;cursor:pointer;transition:border-color .2s">';
  html += '<div style="font-size:1.4rem;margin-bottom:4px">📎</div>';
  html += '<div style="font-size:.78rem;font-weight:600">Arrastra factura CFDI (PDF)</div>';
  html += '<div style="font-size:.68rem;color:var(--muted);margin-top:3px">Se extraerán datos automáticamente del XML embebido</div>';
  html += '<input type="file" id="emit-file-input" accept=".pdf" style="display:none" onchange="emitLoadFile(this.files[0])">';
  html += '</div>';

  // Status + preview
  html += '<div id="emit-status" style="display:none;font-size:.78rem;padding:10px 14px;border-radius:var(--r);margin-top:10px"></div>';
  html += '<div id="emit-form-area" style="display:none;margin-top:12px"></div>';

  html += '</div></div>';

  // History table
  html += '<div class="tw">';
  html += '<div class="tw-h"><div class="tw-ht">📋 Historial de Facturas Emitidas — '+_esc(empresa)+'</div>';
  html += '<input type="text" id="emit-search" placeholder="Buscar..." oninput="emitRenderAll()" style="padding:5px 10px;border-radius:var(--r);border:1px solid var(--border2);font-size:.72rem;width:160px;background:var(--white);color:var(--text)">';
  html += '</div>';
  html += '<div style="overflow-x:auto"><table class="bt"><thead><tr>';
  html += '<th>Fecha</th><th>Folio</th><th>Cliente</th><th>RFC</th><th class="r">Subtotal</th><th class="r">IVA</th><th class="r">Total</th><th>UUID</th><th style="width:60px"></th>';
  html += '</tr></thead><tbody id="emit-tbody"></tbody></table></div>';
  html += '</div>';

  el.innerHTML = html;
  emitRenderAll();
}

function emitSetPeriodo(p){
  _emitPeriodo = p;
  ['mes','trimestre','anual'].forEach(function(k){
    var btn = document.getElementById('emit-p-'+k);
    if(btn){
      btn.className = (k === p) ? 'btn' : 'btn btn-out';
    }
  });
  emitRenderAll();
}

function emitRenderAll(){
  _emitRenderKPIs();
  _emitRenderTable();
}

function _emitGetUploads(){
  var store = _cfdiLoad();
  var empKey = CF_EMP_KEY[_emitEmpresa];
  return (store.uploads || []).filter(function(u){ return u.empresa === empKey; });
}

function _emitRenderKPIs(){
  var el = document.getElementById('emit-kpis');
  if(!el) return;
  var all = _emitGetUploads();
  var range = _periodRange(_emitPeriodo);
  var periodUploads = all.filter(function(u){ return _inPeriod(u.fecha || u.created_at, range); });

  var totalAll = 0, totalPeriod = 0;
  all.forEach(function(u){ totalAll += Number(u.total || 0); });
  periodUploads.forEach(function(u){ totalPeriod += Number(u.total || 0); });

  el.innerHTML = UI.kpiRow([
    UI.kpiCard({label:'FACTURAS TOTALES',value:all.length,sub:'Todas las emitidas',icon:'📄',color:'blue',barPct:all.length?70:0}),
    UI.kpiCard({label:'DEL PERIODO',value:periodUploads.length,sub:_emitPeriodo==='mes'?'Este mes':_emitPeriodo==='trimestre'?'Este trimestre':'Este año',icon:'📅',color:'green',barPct:periodUploads.length?80:0}),
    UI.kpiCard({label:'MONTO TOTAL',value:_fmt(totalAll),sub:'Acumulado histórico',icon:'💰',color:'purple',barPct:totalAll?60:0}),
    UI.kpiCard({label:'MONTO PERIODO',value:_fmt(totalPeriod),sub:_emitPeriodo==='mes'?'Facturado este mes':_emitPeriodo==='trimestre'?'Facturado trimestre':'Facturado año',icon:'📊',color:'orange',barPct:totalPeriod?80:0})
  ],{style:'margin-bottom:14px'});
}

function _emitRenderTable(){
  var tb = document.getElementById('emit-tbody');
  if(!tb) return;
  var all = _emitGetUploads();
  var search = (document.getElementById('emit-search')||{}).value || '';
  if(search){
    var s = search.toLowerCase();
    all = all.filter(function(u){
      return (u.receptor_nombre||'').toLowerCase().indexOf(s) !== -1 ||
             (u.folio||'').toLowerCase().indexOf(s) !== -1 ||
             (u.uuid||'').toLowerCase().indexOf(s) !== -1;
    });
  }
  all.sort(function(a,b){ return (b.fecha||b.created_at||'') < (a.fecha||a.created_at||'') ? -1 : 1; });

  if(!all.length){
    tb.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:30px;font-size:.78rem">No hay facturas emitidas para '+_esc(_emitEmpresa)+'</td></tr>';
    return;
  }

  tb.innerHTML = all.map(function(u){
    return '<tr>'
      + '<td>'+_fmtD(u.fecha)+'</td>'
      + '<td style="font-weight:600">'+_esc(u.folio||'—')+'</td>'
      + '<td style="max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+_esc(u.receptor_nombre||u.cliente||'—')+'</td>'
      + '<td style="font-size:.7rem">'+_esc(u.receptor_rfc||'—')+'</td>'
      + '<td class="r mo">'+_fmt(u.subtotal||0)+'</td>'
      + '<td class="r mo">'+_fmt(u.iva||0)+'</td>'
      + '<td class="r mo" style="font-weight:700">'+_fmt(u.total||0)+'</td>'
      + '<td style="font-size:.62rem;max-width:120px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;color:var(--muted)">'+_esc(u.uuid||'—')+'</td>'
      + '<td style="text-align:center;white-space:nowrap">'
      + '<button onclick="emitEditRow(\''+u.id+'\')" title="Editar" style="'+_emEditBtn+'" onmouseover="this.style.background=\'#0073ea\';this.style.color=\'#fff\'" onmouseout="this.style.background=\'rgba(0,115,234,.1)\';this.style.color=\'#0073ea\'">✏️</button> '
      + '<button onclick="emitDelete(\''+u.id+'\')" title="Eliminar factura" style="width:22px;height:22px;border-radius:50%;background:rgba(229,57,53,.12);border:1.5px solid #e53935;color:#e53935;cursor:pointer;font-size:.68rem;font-weight:900;display:inline-flex;align-items:center;justify-content:center;transition:all .15s;flex-shrink:0" onmouseover="this.style.background=\'#e53935\';this.style.color=\'#fff\'" onmouseout="this.style.background=\'rgba(229,57,53,.12)\';this.style.color=\'#e53935\'">✕</button>'
      + '</td>'
      + '</tr>';
  }).join('');
}

// Upload handlers for emitidas
function emitHandleDrop(e){
  e.preventDefault();
  e.currentTarget.style.borderColor = 'var(--border2)';
  var file = e.dataTransfer.files[0];
  if(!file) return;
  if(!file.name.toLowerCase().endsWith('.pdf')){
    _emitStatus('error','Solo se aceptan archivos PDF');
    return;
  }
  emitLoadFile(file);
}

function emitLoadFile(file){
  if(!file) return;
  if(!file.name.toLowerCase().endsWith('.pdf')){
    _emitStatus('error','Solo se aceptan archivos PDF');
    return;
  }
  _emitStatus('loading','Analizando factura PDF...');
  var reader = new FileReader();
  reader.onload = function(ev){
    _emitPdfBase64 = ev.target.result;
    _emitAnalyzePDF(ev.target.result, file.name);
  };
  reader.onerror = function(){ _emitStatus('error','Error al leer el archivo'); };
  reader.readAsDataURL(file);
}

function _emitStatus(type, msg){
  var el = document.getElementById('emit-status');
  if(!el) return;
  el.style.display = 'block';
  if(type==='loading'){ el.style.background='var(--blue-bg,#e8f0fe)'; el.style.color='var(--blue,#0073ea)'; el.innerHTML='⏳ '+msg; }
  else if(type==='ok'){ el.style.background='var(--green-bg,#e6f7ee)'; el.style.color='var(--green,#00b875)'; el.innerHTML='✅ '+msg; }
  else{ el.style.background='var(--red-bg,#fce8e8)'; el.style.color='var(--red,#e53935)'; el.innerHTML='⚠️ '+msg; }
}

function _emitAnalyzePDF(base64, filename){
  try{
    var raw = atob(base64.split(',')[1]);
    var text = '';
    // Attempt to extract displayable text for cfParseCFDI
    for(var i=0;i<raw.length;i++) text += String.fromCharCode(raw.charCodeAt(i));
    if(typeof cfParseCFDI === 'function'){
      var parsed = cfParseCFDI(text);
      if(parsed){
        _emitPdfData = parsed;
        _emitPdfData.filename = filename;
        _emitShowPreview(parsed);
        _emitStatus('ok','Datos extraídos correctamente');
        return;
      }
    }
    // If parse fails, show manual form with filename
    _emitPdfData = {filename:filename};
    _emitStatus('ok','PDF cargado — completa los datos manualmente');
    emitSetManual();
  }catch(e){
    _emitStatus('error','No se pudieron extraer datos: '+e.message);
    emitSetManual();
  }
}

function _emitShowPreview(data){
  var fa = document.getElementById('emit-form-area');
  if(!fa) return;
  fa.style.display = 'block';
  var html = '<div style="border:1px solid var(--border2);border-radius:var(--r);padding:14px">';
  html += '<div style="font-size:.78rem;font-weight:700;margin-bottom:10px">📋 Datos Extraídos</div>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 14px;font-size:.75rem">';
  html += '<div><b>Emisor:</b> '+_esc(data.emisor_nombre||'—')+'</div>';
  html += '<div><b>RFC Emisor:</b> '+_esc(data.emisor_rfc||'—')+'</div>';
  html += '<div><b>Receptor:</b> '+_esc(data.receptor_nombre||'—')+'</div>';
  html += '<div><b>RFC Receptor:</b> '+_esc(data.receptor_rfc||'—')+'</div>';
  html += '<div><b>Folio:</b> '+_esc(data.folio||'—')+'</div>';
  html += '<div><b>Fecha:</b> '+_esc(data.fecha||'—')+'</div>';
  html += '<div><b>Subtotal:</b> '+_fmt(data.subtotal||0)+'</div>';
  html += '<div><b>IVA:</b> '+_fmt(data.iva||0)+'</div>';
  html += '<div><b>Total:</b> <span style="font-weight:700">'+_fmt(data.total||0)+'</span></div>';
  html += '<div><b>UUID:</b> <span style="font-size:.65rem;color:var(--muted)">'+_esc(data.uuid||'—')+'</span></div>';
  html += '</div>';
  html += '<div style="display:flex;gap:8px;margin-top:12px">';
  html += '<button class="btn" style="font-size:.72rem" onclick="emitSaveFromPreview()">💾 Guardar</button>';
  html += '<button class="btn btn-out" style="font-size:.72rem" onclick="emitClearForm()">Cancelar</button>';
  html += '</div></div>';
  fa.innerHTML = html;
}

function emitSetManual(){
  var fa = document.getElementById('emit-form-area');
  if(!fa) return;
  fa.style.display = 'block';
  var html = '<div style="border:1px solid var(--border2);border-radius:var(--r);padding:14px">';
  html += '<div style="font-size:.78rem;font-weight:700;margin-bottom:10px">✏️ Registro Manual de Factura Emitida</div>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 14px;font-size:.78rem">';
  html += '<div><label style="font-size:.68rem;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">Cliente</label>';
  html += '<input type="text" id="emit-f-cliente" class="fi" placeholder="Nombre del cliente" style="width:100%;font-size:.78rem;padding:7px 10px"></div>';
  html += '<div><label style="font-size:.68rem;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">RFC Cliente</label>';
  html += '<input type="text" id="emit-f-rfc" class="fi" placeholder="RFC" style="width:100%;font-size:.78rem;padding:7px 10px"></div>';
  html += '<div><label style="font-size:.68rem;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">Folio</label>';
  html += '<input type="text" id="emit-f-folio" class="fi" placeholder="Folio factura" style="width:100%;font-size:.78rem;padding:7px 10px"></div>';
  html += '<div><label style="font-size:.68rem;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">Fecha</label>';
  html += '<input type="date" id="emit-f-fecha" class="fi" value="'+_today()+'" style="width:100%;font-size:.78rem;padding:7px 10px"></div>';
  html += '<div><label style="font-size:.68rem;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">Subtotal</label>';
  html += '<input type="text" id="emit-f-subtotal" class="fi" placeholder="$0.00" oninput="facSubInput(\'emit\')" onfocus="facFocus(this)" onblur="facBlur(this)" style="width:100%;font-size:.78rem;padding:7px 10px"></div>';
  html += '<div><label style="font-size:.68rem;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">IVA <span style="font-weight:400;color:var(--muted)">(auto 16%)</span></label>';
  html += '<input type="text" id="emit-f-iva" class="fi" placeholder="$0.00" oninput="facIvaInput(\'emit\')" onfocus="facFocus(this)" onblur="facBlur(this)" style="width:100%;font-size:.78rem;padding:7px 10px"></div>';
  html += '<div><label style="font-size:.68rem;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">Total</label>';
  html += '<input type="text" id="emit-f-total" class="fi" placeholder="$0.00" readonly style="width:100%;font-size:.78rem;padding:7px 10px;font-weight:700;background:var(--blue-bg);color:var(--blue);cursor:default"></div>';
  html += '<div><label style="font-size:.68rem;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">Concepto</label>';
  html += '<input type="text" id="emit-f-concepto" class="fi" placeholder="Descripción" style="width:100%;font-size:.78rem;padding:7px 10px"></div>';
  html += '</div>';
  html += '<div style="display:flex;gap:8px;margin-top:12px">';
  html += '<button class="btn" style="font-size:.72rem" onclick="emitSaveManual()">💾 Guardar</button>';
  html += '<button class="btn btn-out" style="font-size:.72rem" onclick="emitClearForm()">Cancelar</button>';
  html += '</div></div>';
  fa.innerHTML = html;
}

function emitSaveFromPreview(){
  if(!_emitPdfData) return;
  var empKey = CF_EMP_KEY[_emitEmpresa];
  var store = _cfdiLoad();
  store.uploads.push({
    id: 'emit_' + Date.now() + '_' + Math.random().toString(36).substring(2,7),
    empresa: empKey,
    fecha: _emitPdfData.fecha || _today(),
    folio: _emitPdfData.folio || '',
    receptor_nombre: _emitPdfData.receptor_nombre || '',
    receptor_rfc: _emitPdfData.receptor_rfc || '',
    emisor_nombre: _emitPdfData.emisor_nombre || '',
    emisor_rfc: _emitPdfData.emisor_rfc || '',
    subtotal: Number(_emitPdfData.subtotal || 0),
    iva: Number(_emitPdfData.iva || 0),
    total: Number(_emitPdfData.total || 0),
    uuid: _emitPdfData.uuid || '',
    concepto: _emitPdfData.concepto || '',
    pdf_base64: _emitPdfBase64 || null,
    pdf_filename: _emitPdfData.filename || '',
    created_at: _now()
  });
  _cfdiSave(store);
  if(typeof toast === 'function') toast('✅ Factura emitida guardada');
  emitClearForm();
  emitRenderAll();
}

function emitSaveManual(){
  var cliente = (document.getElementById('emit-f-cliente')||{}).value || '';
  var total = _facParse('emit-f-total');
  if(!cliente && !total){ if(typeof toast==='function') toast('⚠️ Completa al menos cliente y total'); return; }
  var empKey = CF_EMP_KEY[_emitEmpresa];
  var store = _cfdiLoad();
  store.uploads.push({
    id: 'emit_' + Date.now() + '_' + Math.random().toString(36).substring(2,7),
    empresa: empKey,
    fecha: (document.getElementById('emit-f-fecha')||{}).value || _today(),
    folio: (document.getElementById('emit-f-folio')||{}).value || '',
    receptor_nombre: cliente,
    receptor_rfc: (document.getElementById('emit-f-rfc')||{}).value || '',
    subtotal: _facParse('emit-f-subtotal'),
    iva: _facParse('emit-f-iva'),
    total: total,
    concepto: (document.getElementById('emit-f-concepto')||{}).value || '',
    created_at: _now()
  });
  _cfdiSave(store);
  if(typeof toast === 'function') toast('✅ Factura emitida guardada');
  emitClearForm();
  emitRenderAll();
}

function emitClearForm(){
  _emitPdfData = null;
  _emitPdfBase64 = null;
  var fa = document.getElementById('emit-form-area');
  if(fa){ fa.style.display = 'none'; fa.innerHTML = ''; }
  var st = document.getElementById('emit-status');
  if(st) st.style.display = 'none';
  // Reset file input
  var fi = document.getElementById('emit-file-input');
  if(fi) fi.value = '';
}

function emitDelete(id){
  if(!confirm('¿Eliminar esta factura emitida?')) return;
  var store = _cfdiLoad();
  store.uploads = store.uploads.filter(function(u){ return u.id !== id; });
  _cfdiSave(store);
  if(typeof toast === 'function') toast('🗑️ Factura eliminada');
  emitRenderAll();
}

// ══════════════════════════════════════════════════════════
// RECIBIDAS — Vista con upload PDF CFDI + registro manual + tabla CxP
// ══════════════════════════════════════════════════════════
var _recvEmpresa = null;
var _recvPeriodo = 'mes';
var _recvPdfData = null;
var _recvPdfBase64 = null;

function rFactRecibidas(empresa){
  _recvEmpresa = empresa;
  _recvPeriodo = 'mes';
  _recvPdfData = null;
  _recvPdfBase64 = null;

  var viewId = RECV_VIEW_MAP[empresa];
  if(!viewId) return;
  var el = document.getElementById('view-'+viewId);
  if(!el) return;

  var icon = ENT_ICONS[empresa] || '🧾';
  var color = ENT_COLORS[empresa] || '#666';

  var html = '';
  html += '<div style="font-family:\'Poppins\',sans-serif;font-size:.95rem;font-weight:700;margin-bottom:4px">'+icon+' Facturas Recibidas — '+_esc(empresa)+'</div>';
  html += '<div style="font-size:.72rem;color:var(--muted);margin-bottom:14px">Facturas de proveedores y cuentas por pagar de '+_esc(empresa)+'</div>';

  // Period buttons
  html += '<div style="display:flex;gap:6px;margin-bottom:14px">';
  html += '<button id="recv-p-mes" class="btn" style="font-size:.68rem;padding:4px 14px" onclick="recvSetPeriodo(\'mes\')">Mes</button>';
  html += '<button id="recv-p-trimestre" class="btn btn-out" style="font-size:.68rem;padding:4px 14px" onclick="recvSetPeriodo(\'trimestre\')">Trimestre</button>';
  html += '<button id="recv-p-anual" class="btn btn-out" style="font-size:.68rem;padding:4px 14px" onclick="recvSetPeriodo(\'anual\')">Año</button>';
  html += '</div>';

  // KPIs
  html += '<div id="recv-kpis"></div>';

  // Upload section — drop zone PDF CFDI
  html += '<div class="tw" style="margin-bottom:14px">';
  html += '<div class="tw-h"><div class="tw-ht">📥 Registrar Factura Recibida</div>';
  html += '<button class="btn btn-out" style="font-size:.7rem" onclick="recvSetManual()">✏️ Registro Manual</button>';
  html += '</div>';
  html += '<div style="padding:16px">';

  // Drop zone
  html += '<div id="recv-dropzone" ondrop="recvHandleDrop(event)" ondragover="event.preventDefault();this.style.borderColor=\'var(--blue)\'" ondragleave="this.style.borderColor=\'var(--border2)\'" onclick="document.getElementById(\'recv-file-input\').click()" style="border:2px dashed var(--border2);border-radius:var(--r);padding:28px 20px;text-align:center;cursor:pointer;transition:border-color .2s">';
  html += '<div style="font-size:1.4rem;margin-bottom:4px">📎</div>';
  html += '<div style="font-size:.78rem;font-weight:600">Arrastra factura CFDI de proveedor (PDF)</div>';
  html += '<div style="font-size:.68rem;color:var(--muted);margin-top:3px">Se extraerán datos automáticamente del XML embebido</div>';
  html += '<input type="file" id="recv-file-input" accept=".pdf" style="display:none" onchange="recvLoadFile(this.files[0])">';
  html += '</div>';

  // Status + preview
  html += '<div id="recv-status" style="display:none;font-size:.78rem;padding:10px 14px;border-radius:var(--r);margin-top:10px"></div>';
  html += '<div id="recv-form-area" style="display:none;margin-top:12px"></div>';

  html += '</div></div>';

  // CxP Table
  html += '<div class="tw">';
  html += '<div class="tw-h"><div class="tw-ht">📋 Facturas Recibidas — '+_esc(empresa)+'</div>';
  html += '<div style="display:flex;gap:8px;align-items:center">';
  html += '<select id="recv-f-status" onchange="recvRenderAll()" style="padding:5px 10px;border-radius:var(--r);border:1px solid var(--border2);font-size:.72rem;background:var(--white);color:var(--text)">';
  html += '<option value="">Todos</option><option value="pendiente">Pendientes</option><option value="parcial">Parciales</option><option value="pagada">Pagadas</option><option value="cancelada">Canceladas</option></select>';
  html += '<input type="text" id="recv-search" placeholder="Buscar..." oninput="recvRenderAll()" style="padding:5px 10px;border-radius:var(--r);border:1px solid var(--border2);font-size:.72rem;width:160px;background:var(--white);color:var(--text)">';
  html += '</div></div>';
  html += '<div style="overflow-x:auto"><table class="bt"><thead><tr>';
  html += '<th>Fecha</th><th>Proveedor</th><th>Categoría</th><th>Concepto</th><th class="r">Total</th><th class="r">Pagado</th><th class="r">Saldo</th><th>Vencimiento</th><th>Status</th><th>Origen</th>';
  html += '</tr></thead><tbody id="recv-tbody"></tbody></table></div>';
  html += '</div>';

  el.innerHTML = html;
  recvRenderAll();
}

function recvSetPeriodo(p){
  _recvPeriodo = p;
  ['mes','trimestre','anual'].forEach(function(k){
    var btn = document.getElementById('recv-p-'+k);
    if(btn) btn.className = (k === p) ? 'btn' : 'btn btn-out';
  });
  recvRenderAll();
}

function recvRenderAll(){
  _recvRenderKPIs();
  _recvRenderTable();
}

function _recvGetCuentas(statusFilter, search){
  var store = _feLoad();
  return store.cuentas.filter(function(c){
    if(c.empresa !== _recvEmpresa) return false;
    if(statusFilter && c.status !== statusFilter) return false;
    if(search){
      var s = search.toLowerCase();
      if((c.proveedor||'').toLowerCase().indexOf(s)===-1 &&
         (c.concepto||'').toLowerCase().indexOf(s)===-1) return false;
    }
    return true;
  });
}

function _recvRenderKPIs(){
  var el = document.getElementById('recv-kpis');
  if(!el) return;
  var all = _recvGetCuentas();
  var range = _periodRange(_recvPeriodo);
  var periodCxp = all.filter(function(c){ return _inPeriod(c.fecha_factura || c.created_at, range); });

  var totalRecibidas = all.length;
  var montoTotal = 0, pendPago = 0, pagadasPeriodo = 0;
  all.forEach(function(c){ montoTotal += c.total_mxn||0; });
  all.forEach(function(c){
    if(c.status==='pendiente'||c.status==='parcial') pendPago += c.saldo_mxn||0;
  });
  periodCxp.forEach(function(c){ if(c.status==='pagada') pagadasPeriodo++; });

  el.innerHTML = UI.kpiRow([
    UI.kpiCard({label:'FACTURAS RECIBIDAS',value:totalRecibidas,sub:'Total histórico',icon:'📥',color:'blue',barPct:totalRecibidas?70:0}),
    UI.kpiCard({label:'MONTO TOTAL',value:_fmt(montoTotal),sub:'Acumulado',icon:'💰',color:'purple',barPct:montoTotal?60:0}),
    UI.kpiCard({label:'PENDIENTE DE PAGO',value:_fmt(pendPago),sub:'Saldo vivo',icon:'⚠️',color:'red',barPct:pendPago?80:0}),
    UI.kpiCard({label:'PAGADAS PERIODO',value:pagadasPeriodo,sub:_recvPeriodo==='mes'?'Este mes':_recvPeriodo==='trimestre'?'Este trimestre':'Este año',icon:'✅',color:'green',barPct:pagadasPeriodo?100:0})
  ],{style:'margin-bottom:14px'});
}

function _recvRenderTable(){
  var tb = document.getElementById('recv-tbody');
  if(!tb) return;
  var st = (document.getElementById('recv-f-status')||{}).value || '';
  var search = (document.getElementById('recv-search')||{}).value || '';
  var rows = _recvGetCuentas(st, search);

  rows.sort(function(a,b){
    var oa = (a.status==='pendiente'||a.status==='parcial') ? 0 : 1;
    var ob = (b.status==='pendiente'||b.status==='parcial') ? 0 : 1;
    if(oa !== ob) return oa - ob;
    return (b.fecha_factura||'') < (a.fecha_factura||'') ? -1 : 1;
  });

  if(!rows.length){
    tb.innerHTML = '<tr><td colspan="10" style="text-align:center;color:var(--muted);padding:30px;font-size:.78rem">No hay facturas recibidas para '+_esc(_recvEmpresa)+'</td></tr>';
    return;
  }

  tb.innerHTML = rows.map(function(c){
    var vencida = _isVencida(c);
    var vencStyle = vencida ? 'color:#b02020;font-weight:600' : '';
    var editBtn = '<button onclick="cxpEditRow(\''+c.id+'\')" title="Editar" style="'+_emEditBtn+'" onmouseover="this.style.background=\'#0073ea\';this.style.color=\'#fff\'" onmouseout="this.style.background=\'rgba(0,115,234,.1)\';this.style.color=\'#0073ea\'">✏️</button>';
    return '<tr>'
      + '<td>'+_fmtD(c.fecha_factura)+'</td>'
      + '<td style="font-weight:600;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+_esc(c.proveedor)+'</td>'
      + '<td style="font-size:.72rem">'+_esc(c.categoria||'—')+'</td>'
      + '<td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+_esc(c.concepto||'—')+'</td>'
      + '<td class="r mo">'+_fmt(c.total_mxn)+'</td>'
      + '<td class="r mo pos">'+_fmt(c.monto_pagado_mxn)+'</td>'
      + '<td class="r mo" style="font-weight:700;'+(c.saldo_mxn>0?'color:#b02020':'color:#007a48')+'">'+_fmt(c.saldo_mxn)+'</td>'
      + '<td style="'+vencStyle+'">'+(c.fecha_vencimiento ? _fmtD(c.fecha_vencimiento)+(vencida?' ⚠️':'') : '—')+'</td>'
      + '<td>'+_statusPill(c.status)+'</td>'
      + '<td>'+_origenPill(c.origen)+'</td>'
      + '<td style="text-align:center">'+editBtn+'</td>'
      + '</tr>';
  }).join('');
}

// ── Recibidas: Upload PDF CFDI + Manual entry ───────────

function recvHandleDrop(e){
  e.preventDefault();
  e.currentTarget.style.borderColor = 'var(--border2)';
  var file = e.dataTransfer.files[0];
  if(!file) return;
  if(!file.name.toLowerCase().endsWith('.pdf')){
    _recvStatus('error','Solo se aceptan archivos PDF');
    return;
  }
  recvLoadFile(file);
}

function recvLoadFile(file){
  if(!file) return;
  if(!file.name.toLowerCase().endsWith('.pdf')){
    _recvStatus('error','Solo se aceptan archivos PDF');
    return;
  }
  _recvStatus('loading','Analizando factura PDF...');
  var reader = new FileReader();
  reader.onload = function(ev){
    _recvPdfBase64 = ev.target.result;
    _recvAnalyzePDF(ev.target.result, file.name);
  };
  reader.onerror = function(){ _recvStatus('error','Error al leer el archivo'); };
  reader.readAsDataURL(file);
}

function _recvStatus(type, msg){
  var el = document.getElementById('recv-status');
  if(!el) return;
  el.style.display = 'block';
  if(type==='loading'){ el.style.background='var(--blue-bg,#e8f0fe)'; el.style.color='var(--blue,#0073ea)'; el.innerHTML='⏳ '+msg; }
  else if(type==='ok'){ el.style.background='var(--green-bg,#e6f7ee)'; el.style.color='var(--green,#00b875)'; el.innerHTML='✅ '+msg; }
  else{ el.style.background='var(--red-bg,#fce8e8)'; el.style.color='var(--red,#e53935)'; el.innerHTML='⚠️ '+msg; }
}

function _recvAnalyzePDF(base64, filename){
  try{
    var raw = atob(base64.split(',')[1]);
    var text = '';
    for(var i=0;i<raw.length;i++) text += String.fromCharCode(raw.charCodeAt(i));
    if(typeof cfParseCFDI === 'function'){
      var parsed = cfParseCFDI(text);
      if(parsed){
        _recvPdfData = parsed;
        _recvPdfData.filename = filename;
        _recvShowPreview(parsed);
        _recvStatus('ok','Datos extraídos correctamente del CFDI');
        return;
      }
    }
    _recvPdfData = {filename:filename};
    _recvStatus('ok','PDF cargado — completa los datos manualmente');
    recvSetManual();
  }catch(e){
    _recvStatus('error','No se pudieron extraer datos: '+e.message);
    recvSetManual();
  }
}

function _recvShowPreview(data){
  var fa = document.getElementById('recv-form-area');
  if(!fa) return;
  fa.style.display = 'block';
  var html = '<div style="border:1px solid var(--border2);border-radius:var(--r);padding:14px">';
  html += '<div style="font-size:.78rem;font-weight:700;margin-bottom:10px">📋 Datos Extraídos del CFDI</div>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:6px 14px;font-size:.75rem">';
  html += '<div><b>Emisor (Proveedor):</b> '+_esc(data.emisor_nombre||'—')+'</div>';
  html += '<div><b>RFC Emisor:</b> '+_esc(data.emisor_rfc||'—')+'</div>';
  html += '<div><b>Receptor:</b> '+_esc(data.receptor_nombre||'—')+'</div>';
  html += '<div><b>RFC Receptor:</b> '+_esc(data.receptor_rfc||'—')+'</div>';
  html += '<div><b>Folio:</b> '+_esc(data.folio||'—')+'</div>';
  html += '<div><b>Fecha:</b> '+_esc(data.fecha||'—')+'</div>';
  html += '<div><b>Subtotal:</b> '+_fmt(data.subtotal||0)+'</div>';
  html += '<div><b>IVA:</b> '+_fmt(data.iva||0)+'</div>';
  html += '<div><b>Total:</b> <span style="font-weight:700">'+_fmt(data.total||0)+'</span></div>';
  html += '<div><b>UUID:</b> <span style="font-size:.65rem;color:var(--muted)">'+_esc(data.uuid||'—')+'</span></div>';
  html += '</div>';
  // Categoría y vencimiento editables
  html += '<div style="display:flex;gap:14px;margin-top:10px">';
  html += _selField('recv-prev-cat','Categoría','<option value="">Sin categoría</option>'+_catOptions());
  html += '<div style="flex:1;min-width:150px"><label style="font-size:.7rem;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">Fecha Vencimiento</label>';
  html += '<input type="date" id="recv-prev-venc" class="fi" style="width:100%;padding:7px 10px;font-size:.78rem"></div>';
  html += '</div>';
  html += '<div style="display:flex;gap:8px;margin-top:12px">';
  html += '<button class="btn" style="font-size:.72rem" onclick="recvSaveFromPreview()">💾 Guardar como CxP</button>';
  html += '<button class="btn btn-out" style="font-size:.72rem" onclick="recvClearForm()">Cancelar</button>';
  html += '</div></div>';
  fa.innerHTML = html;
}

function recvSetManual(){
  var fa = document.getElementById('recv-form-area');
  if(!fa) return;
  fa.style.display = 'block';
  var html = '<div style="border:1px solid var(--border2);border-radius:var(--r);padding:14px">';
  html += '<div style="font-size:.78rem;font-weight:700;margin-bottom:10px">✏️ Registro Manual de Factura Recibida</div>';
  html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 14px;font-size:.78rem">';
  html += '<div><label style="font-size:.68rem;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">Proveedor</label>';
  html += '<input type="text" id="recv-f-prov" class="fi" placeholder="Nombre del proveedor" style="width:100%;font-size:.78rem;padding:7px 10px"></div>';
  html += '<div><label style="font-size:.68rem;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">RFC Proveedor</label>';
  html += '<input type="text" id="recv-f-rfc" class="fi" placeholder="RFC" style="width:100%;font-size:.78rem;padding:7px 10px"></div>';
  html += '<div><label style="font-size:.68rem;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">Fecha Factura</label>';
  html += '<input type="date" id="recv-f-fecha" class="fi" value="'+_today()+'" style="width:100%;font-size:.78rem;padding:7px 10px"></div>';
  html += '<div><label style="font-size:.68rem;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">Folio</label>';
  html += '<input type="text" id="recv-f-folio" class="fi" placeholder="Folio factura" style="width:100%;font-size:.78rem;padding:7px 10px"></div>';
  html += '<div>'+_selField('recv-f-cat','Categoría','<option value="">Sin categoría</option>'+_catOptions())+'</div>';
  html += '<div><label style="font-size:.68rem;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">Concepto</label>';
  html += '<input type="text" id="recv-f-concepto" class="fi" placeholder="Descripción" style="width:100%;font-size:.78rem;padding:7px 10px"></div>';
  html += '<div><label style="font-size:.68rem;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">Subtotal</label>';
  html += '<input type="text" id="recv-f-subtotal" class="fi" placeholder="$0.00" oninput="facSubInput(\'recv\')" onfocus="facFocus(this)" onblur="facBlur(this)" style="width:100%;font-size:.78rem;padding:7px 10px"></div>';
  html += '<div><label style="font-size:.68rem;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">IVA <span style="font-weight:400;color:var(--muted)">(auto 16%)</span></label>';
  html += '<input type="text" id="recv-f-iva" class="fi" placeholder="$0.00" oninput="facIvaInput(\'recv\')" onfocus="facFocus(this)" onblur="facBlur(this)" style="width:100%;font-size:.78rem;padding:7px 10px"></div>';
  html += '<div><label style="font-size:.68rem;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">Total</label>';
  html += '<input type="text" id="recv-f-total" class="fi" placeholder="$0.00" readonly style="width:100%;font-size:.78rem;padding:7px 10px;font-weight:700;background:var(--blue-bg);color:var(--blue);cursor:default"></div>';
  html += '<div><label style="font-size:.68rem;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">Fecha Vencimiento</label>';
  html += '<input type="date" id="recv-f-venc" class="fi" style="width:100%;font-size:.78rem;padding:7px 10px"></div>';
  html += '</div>';
  html += '<div style="display:flex;gap:8px;margin-top:12px">';
  html += '<button class="btn" style="font-size:.72rem" onclick="recvSaveManual()">💾 Guardar como CxP</button>';
  html += '<button class="btn btn-out" style="font-size:.72rem" onclick="recvClearForm()">Cancelar</button>';
  html += '</div></div>';
  fa.innerHTML = html;
}

// ── Helpers de formato moneda para formularios ──────────────────────────────
function _facFmt(n){
  return '$'+(+n||0).toLocaleString('es-MX',{minimumFractionDigits:2,maximumFractionDigits:2});
}
function _facParse(id){
  var el=document.getElementById(id); if(!el) return 0;
  return parseFloat((el.value||'').toString().replace(/[$,\s]/g,''))||0;
}
function facFocus(el){
  var n=parseFloat((el.value||'').replace(/[$,\s]/g,''));
  el.value=(!isNaN(n)&&n!==0)?n.toString():'';
  el.select();
}
function facBlur(el){
  var n=parseFloat((el.value||'').replace(/[$,\s]/g,''))||0;
  el.value=n>0?_facFmt(n):'';
}
function facSubInput(pfx){
  var sub=parseFloat(((document.getElementById(pfx+'-f-subtotal')||{}).value||'').replace(/[$,]/g,''))||0;
  var ivaEl=document.getElementById(pfx+'-f-iva');
  if(ivaEl&&!ivaEl.dataset.manualIva){
    var autoIva=Math.round(sub*0.16*100)/100;
    ivaEl.value=autoIva>0?_facFmt(autoIva):'';
  }
  var iva=parseFloat(((ivaEl&&ivaEl.value)||'').replace(/[$,]/g,''))||0;
  var totEl=document.getElementById(pfx+'-f-total');
  if(totEl) totEl.value=_facFmt(sub+iva);
}
function facIvaInput(pfx){
  var ivaEl=document.getElementById(pfx+'-f-iva');
  if(ivaEl) ivaEl.dataset.manualIva='1';
  var sub=parseFloat(((document.getElementById(pfx+'-f-subtotal')||{}).value||'').replace(/[$,]/g,''))||0;
  var iva=parseFloat(((ivaEl&&ivaEl.value)||'').replace(/[$,]/g,''))||0;
  var totEl=document.getElementById(pfx+'-f-total');
  if(totEl) totEl.value=_facFmt(sub+iva);
}
// ── (alias legacy) ───────────────────────────────────────────────────────────
function recvCalcTotal(){ facSubInput('recv'); }

function recvSaveFromPreview(){
  if(!_recvPdfData) return;
  var cat = (document.getElementById('recv-prev-cat')||{}).value || '';
  var venc = (document.getElementById('recv-prev-venc')||{}).value || '';
  var total = Number(_recvPdfData.total || 0);
  var store = _feLoad();
  store.cuentas.push({
    id: 'cxp_' + Date.now() + '_' + Math.random().toString(36).substring(2,7),
    empresa: _recvEmpresa,
    proveedor: _recvPdfData.emisor_nombre || '',
    rfc_proveedor: _recvPdfData.emisor_rfc || '',
    folio: _recvPdfData.folio || '',
    concepto: _recvPdfData.concepto || '',
    categoria: cat,
    fecha_factura: _recvPdfData.fecha || _today(),
    fecha_vencimiento: venc || '',
    moneda: 'MXN',
    subtotal_mxn: Number(_recvPdfData.subtotal || 0),
    iva_mxn: Number(_recvPdfData.iva || 0),
    total_mxn: total,
    monto_pagado_mxn: 0,
    saldo_mxn: total,
    status: 'pendiente',
    origen: 'cfdi',
    uuid: _recvPdfData.uuid || '',
    pdf_base64: _recvPdfBase64 || null,
    pdf_filename: _recvPdfData.filename || '',
    created_at: _now()
  });
  _feSaveStore(store);
  if(typeof toast === 'function') toast('✅ Factura recibida guardada como CxP');
  recvClearForm();
  recvRenderAll();
}

function recvSaveManual(){
  var prov = (document.getElementById('recv-f-prov')||{}).value || '';
  var total = _facParse('recv-f-total');
  if(!prov && !total){ if(typeof toast==='function') toast('⚠️ Completa al menos proveedor y total'); return; }
  var store = _feLoad();
  store.cuentas.push({
    id: 'cxp_' + Date.now() + '_' + Math.random().toString(36).substring(2,7),
    empresa: _recvEmpresa,
    proveedor: prov,
    rfc_proveedor: (document.getElementById('recv-f-rfc')||{}).value || '',
    folio: (document.getElementById('recv-f-folio')||{}).value || '',
    concepto: (document.getElementById('recv-f-concepto')||{}).value || '',
    categoria: (document.getElementById('recv-f-cat')||{}).value || '',
    fecha_factura: (document.getElementById('recv-f-fecha')||{}).value || _today(),
    fecha_vencimiento: (document.getElementById('recv-f-venc')||{}).value || '',
    moneda: 'MXN',
    subtotal_mxn: _facParse('recv-f-subtotal'),
    iva_mxn: _facParse('recv-f-iva'),
    total_mxn: total,
    monto_pagado_mxn: 0,
    saldo_mxn: total,
    status: 'pendiente',
    origen: 'manual',
    pdf_base64: _recvPdfBase64 || null,
    pdf_filename: (_recvPdfData && _recvPdfData.filename) ? _recvPdfData.filename : '',
    created_at: _now()
  });
  _feSaveStore(store);
  if(typeof toast === 'function') toast('✅ Factura recibida guardada como CxP');
  recvClearForm();
  recvRenderAll();
}

function recvClearForm(){
  _recvPdfData = null;
  _recvPdfBase64 = null;
  var fa = document.getElementById('recv-form-area');
  if(fa){ fa.style.display = 'none'; fa.innerHTML = ''; }
  var st = document.getElementById('recv-status');
  if(st) st.style.display = 'none';
  var fi = document.getElementById('recv-file-input');
  if(fi) fi.value = '';
}

// ══════════════════════════════════════════════════════════
// PAGOS PENDIENTES POR EMPRESA
// ══════════════════════════════════════════════════════════
var _ppEmpresa = null;
var _ppPeriodo = 'mes';

function rPagosPendientesEmp(empresa){
  _ppEmpresa = empresa;
  _ppPeriodo = 'mes';

  var viewId = PP_VIEW_MAP[empresa];
  if(!viewId) return;
  var el = document.getElementById('view-'+viewId);
  if(!el) return;

  var icon = ENT_ICONS[empresa] || '🧾';
  var color = ENT_COLORS[empresa] || '#666';

  var html = '';
  html += '<div style="font-family:\'Poppins\',sans-serif;font-size:.95rem;font-weight:700;margin-bottom:4px">'+icon+' Pagos Pendientes — '+_esc(empresa)+'</div>';
  html += '<div style="font-size:.72rem;color:var(--muted);margin-bottom:14px">Control de cuentas por pagar pendientes de '+_esc(empresa)+'</div>';

  // Period buttons
  html += '<div style="display:flex;gap:6px;margin-bottom:14px">';
  html += '<button id="pp-p-mes" class="btn" style="font-size:.68rem;padding:4px 14px" onclick="ppSetPeriodo(\'mes\')">Mes</button>';
  html += '<button id="pp-p-trimestre" class="btn btn-out" style="font-size:.68rem;padding:4px 14px" onclick="ppSetPeriodo(\'trimestre\')">Trimestre</button>';
  html += '<button id="pp-p-anual" class="btn btn-out" style="font-size:.68rem;padding:4px 14px" onclick="ppSetPeriodo(\'anual\')">Año</button>';
  html += '</div>';

  // KPIs
  html += '<div id="pp-kpis"></div>';

  // CxP Table
  html += '<div class="tw" style="margin-bottom:16px">';
  html += '<div class="tw-h"><div class="tw-ht">💳 Cuentas por Pagar Pendientes — '+_esc(empresa)+'</div>';
  html += '<input type="text" id="pp-search" placeholder="Buscar..." oninput="ppRenderAll()" style="padding:5px 10px;border-radius:var(--r);border:1px solid var(--border2);font-size:.72rem;width:160px;background:var(--white);color:var(--text)">';
  html += '</div>';
  html += '<div style="overflow-x:auto"><table class="bt"><thead><tr>';
  html += '<th>Fecha</th><th>Proveedor</th><th>Concepto</th><th class="r">Total</th><th class="r">Pagado</th><th class="r">Saldo</th><th>Vencimiento</th><th>Status</th><th style="width:80px"></th>';
  html += '</tr></thead><tbody id="pp-tbody"></tbody></table></div>';
  html += '</div>';

  // Vencimientos chart
  html += UI.chartPanel({id:'c-pp-vencimientos',title:'Vencimientos por Mes',subtitle:'Saldo pendiente por mes de vencimiento',height:200,style:'margin-bottom:16px'});

  // Pagos realizados del periodo
  html += '<div class="tw">';
  html += '<div class="tw-h"><div class="tw-ht">💸 Pagos Realizados</div></div>';
  html += '<div style="overflow-x:auto"><table class="bt"><thead><tr>';
  html += '<th>Fecha</th><th>Proveedor</th><th class="r">Monto</th><th>Método</th><th>Referencia</th>';
  html += '</tr></thead><tbody id="pp-pagos-tbody"></tbody></table></div>';
  html += '</div>';

  el.innerHTML = html;
  ppRenderAll();
}

function ppSetPeriodo(p){
  _ppPeriodo = p;
  ['mes','trimestre','anual'].forEach(function(k){
    var btn = document.getElementById('pp-p-'+k);
    if(btn) btn.className = (k === p) ? 'btn' : 'btn btn-out';
  });
  ppRenderAll();
}

function ppRenderAll(){
  _ppRenderKPIs();
  _ppRenderTable();
  _ppRenderPagos();
  _ppRenderChart();
}

function _ppGetPendientes(search){
  var store = _feLoad();
  return store.cuentas.filter(function(c){
    if(c.empresa !== _ppEmpresa) return false;
    if(c.status !== 'pendiente' && c.status !== 'parcial') return false;
    if(search){
      var s = search.toLowerCase();
      if((c.proveedor||'').toLowerCase().indexOf(s)===-1 &&
         (c.concepto||'').toLowerCase().indexOf(s)===-1) return false;
    }
    return true;
  });
}

function _ppRenderKPIs(){
  var el = document.getElementById('pp-kpis');
  if(!el) return;
  var store = _feLoad();
  var pendientes = store.cuentas.filter(function(c){
    return c.empresa === _ppEmpresa && (c.status==='pendiente'||c.status==='parcial');
  });
  var range = _periodRange(_ppPeriodo);
  var hoy = _today();

  var totalPend = 0, vencidas = 0, montoVencido = 0, porVencer = 0;
  pendientes.forEach(function(c){
    totalPend += c.saldo_mxn || 0;
    if(c.fecha_vencimiento && c.fecha_vencimiento < hoy){ vencidas++; montoVencido += c.saldo_mxn||0; }
    else porVencer++;
  });

  // Pagos del periodo
  var myCxpIds = {};
  store.cuentas.forEach(function(c){ if(c.empresa === _ppEmpresa) myCxpIds[c.id] = true; });
  var pagosDelPeriodo = store.pagos.filter(function(p){
    return myCxpIds[p.cxp_id] && _inPeriod(p.fecha, range);
  });
  var montoPagado = 0;
  pagosDelPeriodo.forEach(function(p){ montoPagado += p.monto_mxn||0; });

  el.innerHTML = UI.kpiRow([
    UI.kpiCard({label:'TOTAL PENDIENTE',value:_fmt(totalPend),sub:pendientes.length+' cuentas',icon:'💰',color:'red',barPct:totalPend?80:0}),
    UI.kpiCard({label:'VENCIDAS',value:vencidas,sub:_fmt(montoVencido),icon:'⚠️',color:'orange',barPct:vencidas?100:0}),
    UI.kpiCard({label:'POR VENCER',value:porVencer,sub:'Dentro de plazo',icon:'📅',color:'blue',barPct:porVencer?60:0}),
    UI.kpiCard({label:'PAGADO PERIODO',value:_fmt(montoPagado),sub:pagosDelPeriodo.length+' pagos',icon:'✅',color:'green',barPct:montoPagado?100:0})
  ],{style:'margin-bottom:14px'});
}

function _ppRenderTable(){
  var tb = document.getElementById('pp-tbody');
  if(!tb) return;
  var search = (document.getElementById('pp-search')||{}).value || '';
  var rows = _ppGetPendientes(search);

  rows.sort(function(a,b){
    return (a.fecha_vencimiento||'9999') < (b.fecha_vencimiento||'9999') ? -1 : 1;
  });

  if(!rows.length){
    tb.innerHTML = '<tr><td colspan="9" style="text-align:center;color:var(--muted);padding:30px;font-size:.78rem">🎉 Sin cuentas pendientes para '+_esc(_ppEmpresa)+'</td></tr>';
    return;
  }

  var hoy = _today();
  tb.innerHTML = rows.map(function(c){
    var vencida = _isVencida(c);
    var vencStyle = vencida ? 'color:#b02020;font-weight:600' : '';
    return '<tr>'
      + '<td>'+_fmtD(c.fecha_factura)+'</td>'
      + '<td style="font-weight:600;max-width:150px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+_esc(c.proveedor)+'</td>'
      + '<td style="max-width:160px;overflow:hidden;text-overflow:ellipsis;white-space:nowrap">'+_esc(c.concepto||'—')+'</td>'
      + '<td class="r mo">'+_fmt(c.total_mxn)+'</td>'
      + '<td class="r mo pos">'+_fmt(c.monto_pagado_mxn)+'</td>'
      + '<td class="r mo" style="font-weight:700;color:#b02020">'+_fmt(c.saldo_mxn)+'</td>'
      + '<td style="'+vencStyle+'">'+(c.fecha_vencimiento ? _fmtD(c.fecha_vencimiento)+(vencida?' ⚠️':'') : '—')+'</td>'
      + '<td>'+_statusPill(c.status)+'</td>'
      + '<td><button class="btn" style="font-size:.62rem;padding:3px 8px" onclick="feOpenPago(\''+c.id+'\')">💳 Pagar</button></td>'
      + '</tr>';
  }).join('');
}

function _ppRenderPagos(){
  var tb = document.getElementById('pp-pagos-tbody');
  if(!tb) return;
  var store = _feLoad();
  var myCxpIds = {};
  store.cuentas.forEach(function(c){ if(c.empresa === _ppEmpresa) myCxpIds[c.id] = c; });

  var pagos = store.pagos.filter(function(p){ return myCxpIds[p.cxp_id]; });
  pagos.sort(function(a,b){ return (b.fecha||'') < (a.fecha||'') ? -1 : 1; });

  if(!pagos.length){
    tb.innerHTML = '<tr><td colspan="5" style="text-align:center;color:var(--muted);padding:20px;font-size:.78rem">No hay pagos registrados</td></tr>';
    return;
  }

  tb.innerHTML = pagos.slice(0,50).map(function(p){
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

function _ppRenderChart(){
  var canvas = document.getElementById('c-pp-vencimientos');
  if(!canvas || typeof Chart === 'undefined') return;
  var pendientes = _ppGetPendientes();

  var meses = {};
  pendientes.forEach(function(c){
    var m = (c.fecha_vencimiento||'').substring(0,7);
    if(!m) m = 'Sin fecha';
    meses[m] = (meses[m]||0) + (c.saldo_mxn||0);
  });

  var labels = Object.keys(meses).sort();
  var data = labels.map(function(l){ return meses[l]; });
  var color = ENT_COLORS[_ppEmpresa] || '#6b7280';

  if(canvas._ppChart) canvas._ppChart.destroy();
  canvas._ppChart = new Chart(canvas,{
    type:'bar',
    data:{
      labels:labels,
      datasets:[{label:'Saldo pendiente',data:data,backgroundColor:color+'40',borderColor:color,borderWidth:1,borderRadius:4}]
    },
    options:{
      responsive:true,maintainAspectRatio:false,
      plugins:{legend:{display:false}},
      scales:{
        y:{beginAtZero:true,ticks:{callback:function(v){return _fmt(v);},font:{size:10}}},
        x:{ticks:{font:{size:10}}}
      }
    }
  });
}

// ══════════════════════════════════════════════════════════
// REGISTER VIEWS
// ══════════════════════════════════════════════════════════
if(typeof registerView === 'function'){
  // CxP Registration (existing)
  registerView('fact_tarjetas',  function(){ rFactEmpresa('Salem'); });
  registerView('fact_endless',   function(){ rFactEmpresa('Endless'); });
  registerView('fact_dynamo',    function(){ rFactEmpresa('Dynamo'); });
  registerView('fact_wirebit',   function(){ rFactEmpresa('Wirebit'); });
  registerView('fact_stellaris', function(){ rFactEmpresa('Stellaris'); });
  // Emitidas
  registerView('emit_salem',     function(){ rFactEmitidas('Salem'); });
  registerView('emit_endless',   function(){ rFactEmitidas('Endless'); });
  registerView('emit_dynamo',    function(){ rFactEmitidas('Dynamo'); });
  registerView('emit_wirebit',   function(){ rFactEmitidas('Wirebit'); });
  registerView('emit_stellaris', function(){ rFactEmitidas('Stellaris'); });
  // Recibidas (summary)
  registerView('recv_salem',     function(){ rFactRecibidas('Salem'); });
  registerView('recv_endless',   function(){ rFactRecibidas('Endless'); });
  registerView('recv_dynamo',    function(){ rFactRecibidas('Dynamo'); });
  registerView('recv_wirebit',   function(){ rFactRecibidas('Wirebit'); });
  registerView('recv_stellaris', function(){ rFactRecibidas('Stellaris'); });
  // Pagos Pendientes por empresa
  registerView('pp_salem',       function(){ rPagosPendientesEmp('Salem'); });
  registerView('pp_endless',     function(){ rPagosPendientesEmp('Endless'); });
  registerView('pp_dynamo',      function(){ rPagosPendientesEmp('Dynamo'); });
  registerView('pp_wirebit',     function(){ rPagosPendientesEmp('Wirebit'); });
  registerView('pp_stellaris',   function(){ rPagosPendientesEmp('Stellaris'); });
}

// ══════════════════════════════════════════════════════════
// EDIT MODAL — edición inline de facturas (emitidas y recibidas)
// ══════════════════════════════════════════════════════════

function _emClose(){
  var m=document.getElementById('gf-edit-modal');
  if(m){m.style.display='none';m.innerHTML='';}
}
function _emOpen(inner){
  var m=document.getElementById('gf-edit-modal');
  if(!m){m=document.createElement('div');m.id='gf-edit-modal';document.body.appendChild(m);}
  m.style.cssText='position:fixed;inset:0;z-index:9500;background:rgba(0,0,0,.5);display:flex;align-items:center;justify-content:center;padding:16px';
  m.innerHTML=inner;
  m.onclick=function(e){if(e.target===m)_emClose();};
}
function _emF(id,lbl,val,type,full){
  return '<div'+(full?' style="grid-column:1/-1"':'')+'><label style="font-size:.68rem;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">'+lbl+'</label>'
    +'<input type="'+(type||'text')+'" id="em-'+id+'" class="fi" value="'+_esc(val||'')+'" style="width:100%;font-size:.78rem;padding:7px 10px"></div>';
}
function _emC(id,lbl,val,ro){
  var fmtd=val>0?_facFmt(val):'';
  var xtra=ro?'readonly style="width:100%;font-size:.78rem;padding:7px 10px;font-weight:700;background:var(--blue-bg);color:var(--blue);cursor:default"'
              :'onfocus="facFocus(this)" onblur="facBlur(this)" oninput="_emCalc()" style="width:100%;font-size:.78rem;padding:7px 10px"';
  return '<div><label style="font-size:.68rem;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">'+lbl+'</label>'
    +'<input type="text" id="em-'+id+'" class="fi" value="'+fmtd+'" '+xtra+'></div>';
}
function _emCalc(){
  var sub=parseFloat(((document.getElementById('em-sub')||{}).value||'').replace(/[$,]/g,''))||0;
  var iva=parseFloat(((document.getElementById('em-iva')||{}).value||'').replace(/[$,]/g,''))||0;
  var t=document.getElementById('em-tot');if(t)t.value=_facFmt(sub+iva);
}
function _emParse(id){
  var el=document.getElementById(id);if(!el)return 0;
  return parseFloat((el.value||'').toString().replace(/[$,\s]/g,''))||0;
}
var _emEditBtn = 'width:22px;height:22px;border-radius:50%;background:rgba(0,115,234,.1);border:1.5px solid #0073ea;color:#0073ea;cursor:pointer;font-size:.7rem;display:inline-flex;align-items:center;justify-content:center;transition:all .15s;vertical-align:middle';

// ── Editar Factura Recibida (CxP) ────────────────────────────────────────────
function cxpEditRow(id){
  var c=(_feLoad().cuentas||[]).find(function(x){return x.id===id;});
  if(!c)return;
  _emOpen('<div style="background:var(--white);border-radius:var(--rlg);padding:20px;max-width:540px;width:100%;box-shadow:var(--shm);max-height:90vh;overflow-y:auto">'
    +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">'
    +'<div style="font-size:.85rem;font-weight:700">✏️ Editar Factura Recibida</div>'
    +'<button onclick="_emClose()" style="background:none;border:none;font-size:1.1rem;cursor:pointer;color:var(--muted);padding:2px 6px">✕</button></div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 14px">'
    +_emF('prov','Proveedor',c.proveedor)
    +_emF('rfc','RFC Proveedor',c.rfc_proveedor)
    +_emF('fecha','Fecha Factura',c.fecha_factura,'date')
    +_emF('folio','Folio',c.folio)
    +'<div style="grid-column:1/-1"><label style="font-size:.68rem;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">Categoría</label>'
    +'<select id="em-cat" class="fi" style="width:100%;font-size:.78rem;padding:7px 10px"><option value="">Sin categoría</option>'+_catOptions(c.categoria)+'</select></div>'
    +_emF('concepto','Concepto',c.concepto||'',null,true)
    +_emC('sub','Subtotal',c.subtotal_mxn||0)
    +_emC('iva','IVA',c.iva_mxn||0)
    +_emC('tot','Total',c.total_mxn||0,true)
    +_emF('venc','Fecha Vencimiento',c.fecha_vencimiento,'date')
    +'</div>'
    +'<div style="display:flex;gap:8px;margin-top:16px;justify-content:flex-end">'
    +'<button class="btn btn-out" style="font-size:.72rem" onclick="_emClose()">Cancelar</button>'
    +'<button class="btn" style="font-size:.72rem" onclick="cxpSaveEdit(\''+id+'\')">💾 Guardar cambios</button>'
    +'</div></div>');
}
function cxpSaveEdit(id){
  var store=_feLoad();
  var idx=(store.cuentas||[]).findIndex(function(x){return x.id===id;});
  if(idx<0)return;
  var c=store.cuentas[idx];
  var sub=_emParse('em-sub'),iva=_emParse('em-iva'),tot=_emParse('em-tot')||(sub+iva);
  c.proveedor       =(document.getElementById('em-prov')||{}).value||c.proveedor;
  c.rfc_proveedor   =(document.getElementById('em-rfc')||{}).value||'';
  c.fecha_factura   =(document.getElementById('em-fecha')||{}).value||c.fecha_factura;
  c.folio           =(document.getElementById('em-folio')||{}).value||'';
  c.categoria       =(document.getElementById('em-cat')||{}).value||'';
  c.concepto        =(document.getElementById('em-concepto')||{}).value||'';
  c.fecha_vencimiento=(document.getElementById('em-venc')||{}).value||'';
  if(sub){c.subtotal_mxn=sub;c.iva_mxn=iva;c.total_mxn=tot;c.saldo_mxn=tot-(c.monto_pagado_mxn||0);}
  store.cuentas[idx]=c;_feSaveStore(store);_emClose();
  if(typeof toast==='function')toast('✅ Factura recibida actualizada');
  if(typeof feRenderCxpTable==='function')feRenderCxpTable();
  if(typeof _recvRenderTable==='function')_recvRenderTable();
}

// ── Editar Factura Emitida ───────────────────────────────────────────────────
function emitEditRow(id){
  var u=(_cfdiLoad().uploads||[]).find(function(x){return x.id===id;});
  if(!u)return;
  _emOpen('<div style="background:var(--white);border-radius:var(--rlg);padding:20px;max-width:540px;width:100%;box-shadow:var(--shm);max-height:90vh;overflow-y:auto">'
    +'<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px">'
    +'<div style="font-size:.85rem;font-weight:700">✏️ Editar Factura Emitida</div>'
    +'<button onclick="_emClose()" style="background:none;border:none;font-size:1.1rem;cursor:pointer;color:var(--muted);padding:2px 6px">✕</button></div>'
    +'<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 14px">'
    +_emF('cliente','Cliente',u.receptor_nombre||u.cliente||'')
    +_emF('rfc','RFC Cliente',u.receptor_rfc||'')
    +_emF('folio','Folio',u.folio||'')
    +_emF('fecha','Fecha',u.fecha||'','date')
    +_emF('concepto','Concepto',u.concepto||'',null,true)
    +_emC('sub','Subtotal',u.subtotal||0)
    +_emC('iva','IVA',u.iva||0)
    +_emC('tot','Total',u.total||0,true)
    +'</div>'
    +'<div style="display:flex;gap:8px;margin-top:16px;justify-content:flex-end">'
    +'<button class="btn btn-out" style="font-size:.72rem" onclick="_emClose()">Cancelar</button>'
    +'<button class="btn" style="font-size:.72rem" onclick="emitSaveEdit(\''+id+'\')">💾 Guardar cambios</button>'
    +'</div></div>');
}
function emitSaveEdit(id){
  var store=_cfdiLoad();
  var idx=(store.uploads||[]).findIndex(function(x){return x.id===id;});
  if(idx<0)return;
  var u=store.uploads[idx];
  var sub=_emParse('em-sub'),iva=_emParse('em-iva'),tot=_emParse('em-tot')||(sub+iva);
  u.receptor_nombre=(document.getElementById('em-cliente')||{}).value||u.receptor_nombre;
  u.cliente=u.receptor_nombre;
  u.receptor_rfc   =(document.getElementById('em-rfc')||{}).value||'';
  u.folio          =(document.getElementById('em-folio')||{}).value||'';
  u.fecha          =(document.getElementById('em-fecha')||{}).value||u.fecha;
  u.concepto       =(document.getElementById('em-concepto')||{}).value||'';
  if(sub){u.subtotal=sub;u.iva=iva;u.total=tot;}
  store.uploads[idx]=u;_cfdiSave(store);_emClose();
  if(typeof toast==='function')toast('✅ Factura emitida actualizada');
  emitRenderAll();
}

// ══════════════════════════════════════════════════════════
// EXPOSE GLOBALS
// ══════════════════════════════════════════════════════════
window.rFactEmpresa   = rFactEmpresa;
window.rFactEmitidas  = rFactEmitidas;
window.rFactRecibidas = rFactRecibidas;
window.rPagosPendientesEmp = rPagosPendientesEmp;
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
window.cxpEditRow     = cxpEditRow;
window.cxpSaveEdit    = cxpSaveEdit;
window._emClose       = _emClose;
window._emCalc        = _emCalc;
window.feViewPDF      = feViewPDF;
// Emitidas globals
window.emitSetPeriodo = emitSetPeriodo;
window.emitRenderAll  = emitRenderAll;
window.emitHandleDrop = emitHandleDrop;
window.emitLoadFile   = emitLoadFile;
window.emitSetManual  = emitSetManual;
window.emitSaveFromPreview = emitSaveFromPreview;
window.emitSaveManual = emitSaveManual;
window.emitClearForm  = emitClearForm;
window.emitDelete     = emitDelete;
window.emitEditRow    = emitEditRow;
window.emitSaveEdit   = emitSaveEdit;
// Recibidas globals
window.recvSetPeriodo = recvSetPeriodo;
window.recvRenderAll  = recvRenderAll;
window.recvHandleDrop = recvHandleDrop;
window.recvLoadFile   = recvLoadFile;
window.recvSetManual  = recvSetManual;
window.recvSaveFromPreview = recvSaveFromPreview;
window.recvSaveManual = recvSaveManual;
window.recvClearForm  = recvClearForm;
window.recvCalcTotal  = recvCalcTotal;
window.facFocus       = facFocus;
window.facBlur        = facBlur;
window.facSubInput    = facSubInput;
window.facIvaInput    = facIvaInput;
// Pagos Pendientes globals
window.ppSetPeriodo   = ppSetPeriodo;
window.ppRenderAll    = ppRenderAll;

})(window);
