// GF — Inversiones por Empresa (Capital invertido para ROI)
(function(window) {
  'use strict';

  var INV_KEY = 'gf_inversiones';

  var _EMPRESAS = ['Salem', 'Endless', 'Dynamo', 'Wirebit', 'Stellaris'];
  var _COLORS   = { Salem:'#0073ea', Endless:'#00b875', Dynamo:'#ff7043', Wirebit:'#9b51e0', Stellaris:'#e53935' };
  var _ICONS    = { Salem:'💙', Endless:'💚', Dynamo:'🔶', Wirebit:'💜', Stellaris:'🔴' };

  function _loadInv()  { try { var d = DB.get(INV_KEY); return Array.isArray(d) ? d : []; } catch(e) { return []; } }
  function _saveInv(d) { DB.set(INV_KEY, d); }

  function _fmt(n) {
    if (!n && n !== 0) return '—';
    return '$' + Math.abs(Math.round(n)).toLocaleString('es-MX');
  }

  function rInversiones() {
    var el = document.getElementById('view-carga_inversiones');
    if (!el) return;
    var inv = _loadInv();

    // Totals per empresa
    var totals = {};
    _EMPRESAS.forEach(function(e) { totals[e] = 0; });
    inv.forEach(function(i) { if (totals[i.empresa] !== undefined) totals[i.empresa] += (parseFloat(i.monto) || 0); });

    var h = '';
    h += '<div style="font-family:\'Poppins\',sans-serif;font-size:.95rem;font-weight:700;margin-bottom:4px">💰 Inversión por Empresa</div>';
    h += '<div style="font-size:.72rem;color:var(--muted);margin-bottom:18px">Registra el capital invertido por empresa para calcular el ROI en el Panel de Control</div>';

    // Totals row
    h += '<div style="display:flex;flex-wrap:wrap;gap:8px;margin-bottom:18px">';
    _EMPRESAS.forEach(function(e) {
      var c = _COLORS[e];
      var total = totals[e];
      h += '<div class="cc" style="padding:10px 14px;min-width:130px;border-top:3px solid '+c+';text-align:center">';
      h += '<div style="font-size:.68rem;font-weight:700;color:'+c+';margin-bottom:4px">'+_ICONS[e]+' '+e+'</div>';
      h += '<div style="font-size:.85rem;font-weight:700;color:var(--text)">'+(total > 0 ? _fmt(total) : '—')+'</div>';
      h += '<div style="font-size:.6rem;color:var(--muted)">Capital invertido</div>';
      h += '</div>';
    });
    h += '</div>';

    // Add form
    h += '<div class="tw" style="margin-bottom:18px">';
    h += '<div class="tw-h"><div class="tw-ht">➕ Registrar Inversión</div></div>';
    h += '<div style="padding:14px">';
    h += '<div style="display:grid;grid-template-columns:repeat(auto-fit,minmax(160px,1fr));gap:10px;margin-bottom:12px">';

    // Empresa select
    h += '<div><label style="font-size:.7rem;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">Empresa</label>';
    h += '<select id="inv-f-empresa" style="width:100%;padding:7px 10px;border-radius:var(--r);border:1px solid var(--border2);font-size:.78rem;background:var(--white);color:var(--text)">';
    h += _EMPRESAS.map(function(e){ return '<option value="'+e+'">'+e+'</option>'; }).join('');
    h += '</select></div>';

    // Fecha
    h += '<div><label style="font-size:.7rem;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">Fecha</label>';
    h += '<input type="date" id="inv-f-fecha" value="'+_today()+'" style="width:100%;padding:7px 10px;border-radius:var(--r);border:1px solid var(--border2);font-size:.78rem;background:var(--white);color:var(--text)"></div>';

    // Concepto
    h += '<div style="grid-column:span 2"><label style="font-size:.7rem;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">Concepto</label>';
    h += '<input type="text" id="inv-f-concepto" placeholder="Ej. Aportación inicial de capital" style="width:100%;padding:7px 10px;border-radius:var(--r);border:1px solid var(--border2);font-size:.78rem;background:var(--white);color:var(--text)"></div>';

    // Monto
    h += '<div><label style="font-size:.7rem;font-weight:600;color:var(--muted);display:block;margin-bottom:4px">Monto (MXN)</label>';
    h += '<input type="text" id="inv-f-monto" placeholder="$0.00" class="inv-monto-input" style="width:100%;padding:7px 10px;border-radius:var(--r);border:1px solid var(--border2);font-size:.78rem;background:var(--white);color:var(--text)"></div>';

    h += '</div>'; // grid
    h += '<button class="btn btn-blue inv-add-btn" style="font-size:.75rem">➕ Agregar Inversión</button>';
    h += '</div></div>'; // form + tw

    // Table
    if (inv.length > 0) {
      h += '<div class="tw">';
      h += '<div class="tw-h"><div class="tw-ht">📋 Historial de Inversiones</div><div class="tw-meta">'+inv.length+' registros</div></div>';
      h += '<div style="overflow-x:auto"><table class="bt">';
      h += '<thead><tr>'
         + '<th>Empresa</th><th>Fecha</th><th>Concepto</th>'
         + '<th style="text-align:right">Monto</th>'
         + '<th style="width:40px"></th>'
         + '</tr></thead><tbody>';
      inv.slice().reverse().forEach(function(i) {
        var c = _COLORS[i.empresa] || '#666';
        h += '<tr>'
           + '<td><span style="font-size:.68rem;font-weight:700;color:'+c+'">'+(_ICONS[i.empresa]||'')+'  '+i.empresa+'</span></td>'
           + '<td style="font-size:.72rem">'+_fmtDate(i.fecha)+'</td>'
           + '<td style="font-size:.72rem">'+_esc(i.concepto||'—')+'</td>'
           + '<td style="text-align:right;font-weight:700;font-size:.78rem;color:var(--blue)">'+_fmt(i.monto)+'</td>'
           + '<td style="text-align:center">'
           + '<button class="inv-del-btn" data-id="'+i.id+'" title="Eliminar" '
           + 'style="width:22px;height:22px;border-radius:50%;background:rgba(229,57,53,.12);border:1.5px solid #e53935;color:#e53935;cursor:pointer;font-size:.68rem;font-weight:900;display:inline-flex;align-items:center;justify-content:center">✕</button>'
           + '</td>'
           + '</tr>';
      });
      h += '</tbody></table></div></div>';
    } else {
      h += '<div style="text-align:center;padding:20px;color:var(--muted);font-size:.75rem">Sin registros de inversión. Usa el formulario de arriba para agregar.</div>';
    }

    el.innerHTML = h;
  }

  function _today() {
    return new Date().toISOString().substring(0, 10);
  }

  function _fmtDate(d) {
    if (!d) return '—';
    try {
      var p = d.split('-');
      return p[2] + '/' + p[1] + '/' + p[0];
    } catch(e) { return d; }
  }

  function _esc(s) {
    return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }

  function invFocus(el) {
    var n = parseFloat((el.value || '').replace(/[$,\s]/g, ''));
    el.value = (!isNaN(n) && n !== 0) ? n.toString() : '';
    el.select();
  }

  function invBlur(el) {
    var n = parseFloat((el.value || '').replace(/[$,\s]/g, '')) || 0;
    el.value = n > 0 ? '$' + n.toLocaleString('es-MX', { minimumFractionDigits: 2 }) : '';
  }

  function invAdd() {
    var empresa   = (document.getElementById('inv-f-empresa') || {}).value || '';
    var fecha     = (document.getElementById('inv-f-fecha')   || {}).value || '';
    var concepto  = ((document.getElementById('inv-f-concepto') || {}).value || '').trim();
    var montoRaw  = ((document.getElementById('inv-f-monto')    || {}).value || '').replace(/[$,\s]/g, '');
    var monto     = parseFloat(montoRaw) || 0;

    if (!empresa) { if (typeof toast === 'function') toast('Selecciona una empresa'); return; }
    if (!fecha)   { if (typeof toast === 'function') toast('Ingresa la fecha'); return; }
    if (!concepto){ if (typeof toast === 'function') toast('Ingresa el concepto'); return; }
    if (monto <= 0) { if (typeof toast === 'function') toast('El monto debe ser mayor a cero'); return; }

    var inv = _loadInv();
    inv.push({ id: Date.now(), empresa: empresa, fecha: fecha, concepto: concepto, monto: monto });
    _saveInv(inv);

    if (typeof toast === 'function') toast('✅ Inversión registrada');
    rInversiones();
  }

  function invDelete(id) {
    id = typeof id === 'string' ? parseInt(id, 10) : id;
    var inv = _loadInv().filter(function(i) { return i.id !== id; });
    _saveInv(inv);
    rInversiones();
  }

  // Expose globals
  window.rInversiones = rInversiones;
  window.invAdd       = invAdd;
  window.invDelete    = invDelete;
  window.invFocus     = invFocus;
  window.invBlur      = invBlur;

  // ── Event delegation for inversiones ──
  document.addEventListener('click', function(e){
    if(e.target.closest('.inv-add-btn')){ invAdd(); return; }
    var del = e.target.closest('.inv-del-btn');
    if(del){ invDelete(del.dataset.id); return; }
  });
  document.addEventListener('focus', function(e){
    if(e.target.matches('.inv-monto-input')){ invFocus(e.target); }
  }, true);
  document.addEventListener('blur', function(e){
    if(e.target.matches('.inv-monto-input')){ invBlur(e.target); }
  }, true);
  document.addEventListener('mouseover', function(e){
    var btn = e.target.closest('.inv-del-btn');
    if(btn){ btn.style.background='#e53935'; btn.style.color='#fff'; }
  });
  document.addEventListener('mouseout', function(e){
    var btn = e.target.closest('.inv-del-btn');
    if(btn){ btn.style.background='rgba(229,57,53,.12)'; btn.style.color='#e53935'; }
  });

  // Register view
  if (typeof registerView === 'function') {
    registerView('carga_inversiones', function() { rInversiones(); });
  }

})(window);
