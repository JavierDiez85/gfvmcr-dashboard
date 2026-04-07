// GF — Stellaris Casino: RRHH Module (Empleados + Documentos)
(function(window) {
  'use strict';

  const RRHH_KEY = 'gf_rrhh_stel';

  const PUESTOS = ['Cajero/a', 'Supervisor/a', 'Gerente', 'Seguridad', 'Mantenimiento', 'Limpieza', 'Restaurante', 'Recepcion', 'Administrativo', 'Otro'];
  const TURNOS = ['Matutino', 'Vespertino', 'Nocturno', 'Mixto', 'Rotativo'];
  const DOC_CATEGORIAS = ['Identificacion (INE)', 'CURP', 'RFC / CSF', 'Comprobante Domicilio', 'Contrato Laboral', 'Alta IMSS', 'Recibo de Nomina', 'Otro'];
  const BANCOS = ['BBVA', 'Banorte', 'Santander', 'HSBC', 'Scotiabank', 'Banamex', 'Banco Azteca', 'BanCoppel', 'Inbursa', 'Otro'];

  // ═══════════════════════════════════════
  // STORAGE
  // ═══════════════════════════════════════
  function rrhhLoad() {
    return (typeof DB !== 'undefined' && DB.get(RRHH_KEY)) || { empleados: [] };
  }
  function rrhhSave(data) {
    if (typeof DB !== 'undefined') DB.set(RRHH_KEY, data);
  }

  // ═══════════════════════════════════════
  // EMPLEADOS CRUD
  // ═══════════════════════════════════════
  function rrhhAddEmpleado(emp) {
    var data = rrhhLoad();
    data.empleados.push(emp);
    rrhhSave(data);
    return data;
  }
  function rrhhUpdateEmpleado(id, updates) {
    var data = rrhhLoad();
    var idx = data.empleados.findIndex(function(e) { return e.id === id; });
    if (idx >= 0) Object.assign(data.empleados[idx], updates, { updated_at: new Date().toISOString() });
    rrhhSave(data);
    return data;
  }
  function rrhhDeleteEmpleado(id) {
    var data = rrhhLoad();
    data.empleados = data.empleados.filter(function(e) { return e.id !== id; });
    rrhhSave(data);
    return data;
  }

  // ═══════════════════════════════════════
  // VISTA: EMPLEADOS
  // ═══════════════════════════════════════
  var _rrhhView = 'list'; // list | detail | form
  var _rrhhCurrentId = null;
  var _rrhhFilter = 'activos'; // activos | inactivos | todos

  function rRRHHEmpleados() {
    var el = document.getElementById('view-stel_rrhh_empleados');
    if (!el) return;
    if (_rrhhView === 'detail' && _rrhhCurrentId) return _rrhhRenderDetail(el);
    if (_rrhhView === 'form') return _rrhhRenderForm(el, _rrhhCurrentId);
    _rrhhRenderList(el);
  }

  function _rrhhRenderList(el) {
    var data = rrhhLoad();
    var emps = data.empleados || [];
    var filtered = emps;
    if (_rrhhFilter === 'activos') filtered = emps.filter(function(e) { return e.activo !== false; });
    if (_rrhhFilter === 'inactivos') filtered = emps.filter(function(e) { return e.activo === false; });

    var activos = emps.filter(function(e) { return e.activo !== false; }).length;
    var totalSalario = emps.filter(function(e) { return e.activo !== false; }).reduce(function(s, e) { return s + (e.salario_mensual || 0); }, 0);

    var html = '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:14px;flex-wrap:wrap;gap:8px">';
    html += '<div><div style="font-family:Poppins,sans-serif;font-size:.95rem;font-weight:700">👥 RRHH — Empleados Casino Stellaris</div>';
    html += '<div style="font-size:.68rem;color:var(--muted);margin-top:2px">' + activos + ' empleados activos · Nomina mensual: ' + (typeof fmt === 'function' ? fmt(totalSalario) : '$' + totalSalario.toLocaleString('es-MX')) + '</div></div>';
    html += '<button class="btn rrhh-add-btn" style="font-size:.72rem">➕ Agregar Empleado</button>';
    html += '</div>';

    // KPIs
    html += '<div class="kpi-row c3" style="margin-bottom:14px">';
    html += '<div class="kpi-card" style="--ac:var(--blue)"><div class="kpi-top"><div class="kpi-lbl">Total Empleados</div><div class="kpi-ico" style="background:var(--blue-bg);color:var(--blue)">👥</div></div><div class="kpi-val" style="color:var(--blue)">' + activos + '</div><div class="kpi-d dnu">activos de ' + emps.length + ' registrados</div></div>';
    html += '<div class="kpi-card" style="--ac:var(--green)"><div class="kpi-top"><div class="kpi-lbl">Nomina Mensual</div><div class="kpi-ico" style="background:var(--green-bg);color:var(--green)">💰</div></div><div class="kpi-val" style="color:var(--green)">' + (typeof fmt === 'function' ? fmt(totalSalario) : '$' + totalSalario.toLocaleString('es-MX')) + '</div><div class="kpi-d dnu">salario bruto total</div></div>';
    var avgAntig = activos > 0 ? Math.round(emps.filter(function(e) { return e.activo !== false && e.fecha_ingreso; }).reduce(function(s, e) { return s + ((Date.now() - new Date(e.fecha_ingreso).getTime()) / (1000 * 60 * 60 * 24 * 30)); }, 0) / activos) : 0;
    html += '<div class="kpi-card" style="--ac:var(--purple)"><div class="kpi-top"><div class="kpi-lbl">Antiguedad Promedio</div><div class="kpi-ico" style="background:var(--purple-bg);color:var(--purple)">📅</div></div><div class="kpi-val" style="color:var(--purple)">' + avgAntig + '<span style="font-size:.5em"> meses</span></div><div class="kpi-d dnu">promedio de empleados activos</div></div>';
    html += '</div>';

    // Filters
    html += '<div style="display:flex;gap:4px;margin-bottom:10px">';
    ['activos', 'inactivos', 'todos'].forEach(function(f) {
      var isActive = _rrhhFilter === f;
      html += '<button class="pbtn rrhh-filter-btn" data-filter="' + f + '" style="font-size:.68rem;padding:3px 10px;' + (isActive ? 'background:var(--blue);color:white;border-color:var(--blue)' : '') + '">' + f.charAt(0).toUpperCase() + f.slice(1) + '</button>';
    });
    html += '</div>';

    // Table
    html += '<div class="tw"><div style="overflow-x:auto"><table class="bt">';
    html += '<thead><tr><th>Nombre</th><th>Puesto</th><th>Turno</th><th>Celular</th><th class="r">Salario</th><th>Ingreso</th><th>Estado</th><th></th></tr></thead>';
    html += '<tbody>';
    if (filtered.length === 0) {
      html += '<tr><td colspan="8" style="text-align:center;color:var(--muted);padding:20px">Sin empleados. Agrega el primero.</td></tr>';
    } else {
      filtered.forEach(function(e) {
        var statusPill = e.activo !== false
          ? '<span class="pill" style="background:var(--green-bg);color:var(--green)">Activo</span>'
          : '<span class="pill" style="background:var(--red-bg);color:var(--red)">Baja</span>';
        html += '<tr class="rrhh-row" data-id="' + escapeHtml(e.id) + '" style="cursor:pointer">';
        html += '<td class="bld">' + escapeHtml(e.nombre || '') + '</td>';
        html += '<td style="font-size:.72rem">' + escapeHtml(e.puesto || '') + '</td>';
        html += '<td style="font-size:.72rem">' + escapeHtml(e.turno || '') + '</td>';
        html += '<td style="font-size:.72rem">' + escapeHtml(e.celular || '') + '</td>';
        html += '<td class="r mo" style="font-size:.72rem">' + (typeof fmt === 'function' ? fmt(e.salario_mensual || 0) : '$' + (e.salario_mensual || 0).toLocaleString('es-MX')) + '</td>';
        html += '<td style="font-size:.72rem">' + escapeHtml(e.fecha_ingreso || '') + '</td>';
        html += '<td>' + statusPill + '</td>';
        html += '<td><button class="btn btn-out rrhh-edit-btn" data-id="' + escapeHtml(e.id) + '" style="font-size:.6rem;padding:2px 8px">✏️</button></td>';
        html += '</tr>';
      });
    }
    html += '</tbody></table></div></div>';

    el.innerHTML = html;

    // Wire events
    el.querySelectorAll('.rrhh-add-btn').forEach(function(b) { b.onclick = function() { _rrhhView = 'form'; _rrhhCurrentId = null; rRRHHEmpleados(); }; });
    el.querySelectorAll('.rrhh-filter-btn').forEach(function(b) { b.onclick = function() { _rrhhFilter = b.dataset.filter; rRRHHEmpleados(); }; });
    el.querySelectorAll('.rrhh-row').forEach(function(r) { r.onclick = function(e) { if (e.target.closest('.rrhh-edit-btn')) return; _rrhhView = 'detail'; _rrhhCurrentId = r.dataset.id; rRRHHEmpleados(); }; });
    el.querySelectorAll('.rrhh-edit-btn').forEach(function(b) { b.onclick = function() { _rrhhView = 'form'; _rrhhCurrentId = b.dataset.id; rRRHHEmpleados(); }; });
  }

  // ═══════════════════════════════════════
  // VISTA: DETALLE EMPLEADO
  // ═══════════════════════════════════════
  function _rrhhRenderDetail(el) {
    var data = rrhhLoad();
    var e = data.empleados.find(function(emp) { return emp.id === _rrhhCurrentId; });
    if (!e) { _rrhhView = 'list'; return _rrhhRenderList(el); }

    var esc = escapeHtml;
    var html = '<div style="margin-bottom:14px">';
    html += '<button class="btn btn-out rrhh-back-btn" style="font-size:.7rem;margin-bottom:10px">← Volver a lista</button>';
    html += '<div style="font-family:Poppins,sans-serif;font-size:.95rem;font-weight:700">' + esc(e.nombre) + '</div>';
    html += '<div style="font-size:.72rem;color:var(--muted)">' + esc(e.puesto || '') + ' · ' + esc(e.turno || '') + ' · ' + (e.activo !== false ? '🟢 Activo' : '🔴 Baja') + '</div>';
    html += '</div>';

    // Info grid
    html += '<div class="tw" style="margin-bottom:14px"><div class="tw-h"><div class="tw-ht">📋 Informacion Personal</div></div>';
    html += '<div style="padding:14px;display:grid;grid-template-columns:repeat(auto-fill,minmax(200px,1fr));gap:10px;font-size:.75rem">';
    var fields = [
      ['Celular', e.celular], ['Email Personal', e.email_personal],
      ['RFC', e.rfc], ['CURP', e.curp], ['NSS (IMSS)', e.nss],
      ['Banco', e.banco], ['CLABE', e.clabe],
      ['Salario Mensual', typeof fmt === 'function' ? fmt(e.salario_mensual || 0) : '$' + (e.salario_mensual || 0).toLocaleString('es-MX')],
      ['Fecha Ingreso', e.fecha_ingreso], ['Fecha Baja', e.fecha_baja || '—'],
    ];
    fields.forEach(function(f) {
      html += '<div><div style="font-size:.62rem;font-weight:600;color:var(--muted);text-transform:uppercase;margin-bottom:2px">' + f[0] + '</div>';
      html += '<div style="font-weight:600">' + esc(f[1] || '—') + '</div></div>';
    });
    html += '</div></div>';

    // Contacto emergencia
    html += '<div class="tw" style="margin-bottom:14px"><div class="tw-h"><div class="tw-ht">🚨 Contacto de Emergencia</div></div>';
    html += '<div style="padding:14px;display:grid;grid-template-columns:1fr 1fr 1fr;gap:10px;font-size:.75rem">';
    html += '<div><div style="font-size:.62rem;font-weight:600;color:var(--muted)">NOMBRE</div><div style="font-weight:600">' + esc(e.emergencia_nombre || '—') + '</div></div>';
    html += '<div><div style="font-size:.62rem;font-weight:600;color:var(--muted)">TELEFONO</div><div style="font-weight:600">' + esc(e.emergencia_tel || '—') + '</div></div>';
    html += '<div><div style="font-size:.62rem;font-weight:600;color:var(--muted)">PARENTESCO</div><div style="font-weight:600">' + esc(e.emergencia_parentesco || '—') + '</div></div>';
    html += '</div></div>';

    // Documentos
    var docs = e.documentos || [];
    html += '<div class="tw" style="margin-bottom:14px"><div class="tw-h"><div class="tw-ht">📁 Expediente Digital (' + docs.length + ' documentos)</div></div>';
    html += '<div style="padding:14px">';

    // Upload area
    html += '<div style="margin-bottom:12px;display:flex;gap:8px;align-items:center;flex-wrap:wrap">';
    html += '<select id="rrhh-doc-cat" style="font-size:.72rem;padding:5px 8px;border:1px solid var(--border2);border-radius:var(--r)">';
    DOC_CATEGORIAS.forEach(function(c) { html += '<option value="' + esc(c) + '">' + esc(c) + '</option>'; });
    html += '</select>';
    html += '<input type="file" id="rrhh-doc-file" accept=".jpg,.jpeg,.png,.pdf,image/*" style="font-size:.68rem">';
    html += '<button class="btn rrhh-upload-doc-btn" style="font-size:.68rem;padding:4px 10px">📤 Subir</button>';
    html += '</div>';
    html += '<div id="rrhh-doc-status" style="display:none;font-size:.68rem;margin-bottom:8px"></div>';

    // Docs table
    if (docs.length) {
      html += '<table class="bt"><thead><tr><th>Categoria</th><th>Archivo</th><th>Fecha</th><th></th></tr></thead><tbody>';
      docs.forEach(function(d, i) {
        html += '<tr>';
        html += '<td style="font-size:.72rem;font-weight:600">' + esc(d.categoria) + '</td>';
        html += '<td style="font-size:.72rem">' + esc(d.filename) + '</td>';
        html += '<td style="font-size:.72rem">' + (d.uploaded_at ? new Date(d.uploaded_at).toLocaleDateString('es-MX') : '') + '</td>';
        html += '<td style="white-space:nowrap">';
        html += '<button class="btn btn-out rrhh-view-doc-btn" data-idx="' + i + '" style="font-size:.6rem;padding:2px 6px">👁️</button> ';
        html += '<button class="btn btn-out rrhh-del-doc-btn" data-idx="' + i + '" style="font-size:.6rem;padding:2px 6px;color:var(--red);border-color:var(--red)">🗑️</button>';
        html += '</td></tr>';
      });
      html += '</tbody></table>';
    } else {
      html += '<div style="text-align:center;color:var(--muted);font-size:.72rem;padding:10px">Sin documentos. Sube el primer archivo arriba.</div>';
    }
    html += '</div></div>';

    // Notas
    html += '<div class="tw"><div class="tw-h"><div class="tw-ht">📝 Notas</div></div>';
    html += '<div style="padding:14px"><textarea id="rrhh-notas" class="fi" rows="3" style="width:100%;font-size:.75rem;padding:8px">' + esc(e.notas || '') + '</textarea>';
    html += '<button class="btn btn-out rrhh-save-notas-btn" style="font-size:.68rem;margin-top:6px">💾 Guardar notas</button></div></div>';

    // Actions
    html += '<div style="display:flex;gap:10px;margin-top:14px">';
    html += '<button class="btn rrhh-edit-detail-btn" style="font-size:.72rem">✏️ Editar Datos</button>';
    if (e.activo !== false) {
      html += '<button class="btn btn-out rrhh-baja-btn" style="font-size:.72rem;color:var(--red);border-color:var(--red)">📤 Dar de Baja</button>';
    } else {
      html += '<button class="btn btn-out rrhh-alta-btn" style="font-size:.72rem;color:var(--green);border-color:var(--green)">✅ Reactivar</button>';
    }
    html += '</div>';

    el.innerHTML = html;

    // Wire events
    el.querySelector('.rrhh-back-btn').onclick = function() { _rrhhView = 'list'; _rrhhCurrentId = null; rRRHHEmpleados(); };
    el.querySelector('.rrhh-edit-detail-btn').onclick = function() { _rrhhView = 'form'; rRRHHEmpleados(); };

    var bajaBtn = el.querySelector('.rrhh-baja-btn');
    if (bajaBtn) bajaBtn.onclick = function() {
      if (!confirm('¿Dar de baja a ' + e.nombre + '?')) return;
      rrhhUpdateEmpleado(e.id, { activo: false, fecha_baja: new Date().toISOString().slice(0, 10) });
      rRRHHEmpleados();
      toast('📤 ' + e.nombre + ' dado de baja');
    };
    var altaBtn = el.querySelector('.rrhh-alta-btn');
    if (altaBtn) altaBtn.onclick = function() {
      rrhhUpdateEmpleado(e.id, { activo: true, fecha_baja: null });
      rRRHHEmpleados();
      toast('✅ ' + e.nombre + ' reactivado');
    };

    // Save notas
    var notasBtn = el.querySelector('.rrhh-save-notas-btn');
    if (notasBtn) notasBtn.onclick = function() {
      var notas = (document.getElementById('rrhh-notas') || {}).value || '';
      rrhhUpdateEmpleado(e.id, { notas: notas });
      toast('💾 Notas guardadas');
    };

    // Upload document
    var uploadBtn = el.querySelector('.rrhh-upload-doc-btn');
    if (uploadBtn) uploadBtn.onclick = async function() {
      var fileInput = document.getElementById('rrhh-doc-file');
      var catSel = document.getElementById('rrhh-doc-cat');
      var statusEl = document.getElementById('rrhh-doc-status');
      if (!fileInput || !fileInput.files[0]) { toast('Selecciona un archivo'); return; }

      var file = fileInput.files[0];
      var cat = catSel ? catSel.value : 'Otro';
      if (statusEl) { statusEl.style.display = 'block'; statusEl.textContent = '⏳ Subiendo...'; statusEl.style.color = 'var(--blue)'; }

      if (typeof GF_STORAGE === 'undefined') { toast('Storage no disponible'); return; }
      var path = GF_STORAGE.makePath('rrhh/stellaris/' + e.id + '/' + cat.replace(/[^a-zA-Z0-9]/g, '_'), file.name);
      var result = await GF_STORAGE.upload(file, path);
      if (!result.success) {
        if (statusEl) { statusEl.textContent = '❌ ' + result.error; statusEl.style.color = 'var(--red)'; }
        return;
      }

      var docEntry = { categoria: cat, filename: file.name, storage_path: path, uploaded_at: new Date().toISOString() };
      var updatedData = rrhhLoad();
      var emp = updatedData.empleados.find(function(x) { return x.id === e.id; });
      if (emp) {
        if (!emp.documentos) emp.documentos = [];
        emp.documentos.push(docEntry);
        rrhhSave(updatedData);
      }
      if (statusEl) { statusEl.textContent = '✅ Documento subido'; statusEl.style.color = 'var(--green)'; }
      toast('📁 Documento subido: ' + file.name);
      _rrhhRenderDetail(el);
    };

    // View/Delete docs
    el.querySelectorAll('.rrhh-view-doc-btn').forEach(function(b) {
      b.onclick = function() {
        var idx = parseInt(b.dataset.idx);
        var doc = (e.documentos || [])[idx];
        if (doc && doc.storage_path && typeof GF_STORAGE !== 'undefined') GF_STORAGE.viewFile(doc.storage_path);
      };
    });
    el.querySelectorAll('.rrhh-del-doc-btn').forEach(function(b) {
      b.onclick = async function() {
        var idx = parseInt(b.dataset.idx);
        var doc = (e.documentos || [])[idx];
        if (!doc || !confirm('¿Eliminar ' + doc.filename + '?')) return;
        if (doc.storage_path && typeof GF_STORAGE !== 'undefined') await GF_STORAGE.remove(doc.storage_path);
        var updatedData = rrhhLoad();
        var emp = updatedData.empleados.find(function(x) { return x.id === e.id; });
        if (emp && emp.documentos) { emp.documentos.splice(idx, 1); rrhhSave(updatedData); }
        toast('🗑️ Documento eliminado');
        _rrhhRenderDetail(el);
      };
    });
  }

  // ═══════════════════════════════════════
  // VISTA: FORMULARIO AGREGAR/EDITAR
  // ═══════════════════════════════════════
  function _rrhhRenderForm(el, editId) {
    var data = rrhhLoad();
    var e = editId ? data.empleados.find(function(emp) { return emp.id === editId; }) : null;
    var isEdit = !!e;
    var esc = escapeHtml;

    var html = '<div style="margin-bottom:14px">';
    html += '<button class="btn btn-out rrhh-back-btn" style="font-size:.7rem;margin-bottom:10px">← Cancelar</button>';
    html += '<div style="font-family:Poppins,sans-serif;font-size:.95rem;font-weight:700">' + (isEdit ? '✏️ Editar: ' + esc(e.nombre) : '➕ Nuevo Empleado') + '</div>';
    html += '</div>';

    html += '<div class="tw"><div style="padding:16px">';

    // Section: Datos personales
    html += '<div style="font-size:.78rem;font-weight:700;margin-bottom:8px">Datos Personales</div>';
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;font-size:.78rem;margin-bottom:14px">';
    html += _rrhhField('Nombre Completo *', e ? e.nombre : '', 'rrhh-f-nombre');
    html += _rrhhSelect('Puesto *', PUESTOS, e ? e.puesto : '', 'rrhh-f-puesto');
    html += _rrhhSelect('Turno', TURNOS, e ? e.turno : '', 'rrhh-f-turno');
    html += _rrhhField('Celular', e ? e.celular : '', 'rrhh-f-celular');
    html += _rrhhField('Email Personal', e ? e.email_personal : '', 'rrhh-f-email');
    html += _rrhhField('Fecha de Ingreso', e ? e.fecha_ingreso : new Date().toISOString().slice(0, 10), 'rrhh-f-ingreso', 'date');
    html += '</div>';

    // Section: Datos fiscales
    html += '<div style="font-size:.78rem;font-weight:700;margin-bottom:8px">Datos Fiscales y Laborales</div>';
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;font-size:.78rem;margin-bottom:14px">';
    html += _rrhhField('RFC', e ? e.rfc : '', 'rrhh-f-rfc');
    html += _rrhhField('CURP', e ? e.curp : '', 'rrhh-f-curp');
    html += _rrhhField('NSS (IMSS)', e ? e.nss : '', 'rrhh-f-nss');
    html += '</div>';

    // Section: Bancarios
    html += '<div style="font-size:.78rem;font-weight:700;margin-bottom:8px">Datos Bancarios</div>';
    html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:8px 16px;font-size:.78rem;margin-bottom:14px">';
    html += _rrhhSelect('Banco', BANCOS, e ? e.banco : '', 'rrhh-f-banco');
    html += _rrhhField('CLABE Interbancaria', e ? e.clabe : '', 'rrhh-f-clabe');
    html += _rrhhField('Salario Mensual (MXN)', e ? e.salario_mensual : '', 'rrhh-f-salario', 'number');
    html += '</div>';

    // Section: Emergencia
    html += '<div style="font-size:.78rem;font-weight:700;margin-bottom:8px">Contacto de Emergencia</div>';
    html += '<div style="display:grid;grid-template-columns:1fr 1fr 1fr;gap:8px 16px;font-size:.78rem;margin-bottom:14px">';
    html += _rrhhField('Nombre', e ? e.emergencia_nombre : '', 'rrhh-f-emer-nombre');
    html += _rrhhField('Telefono', e ? e.emergencia_tel : '', 'rrhh-f-emer-tel');
    html += _rrhhField('Parentesco', e ? e.emergencia_parentesco : '', 'rrhh-f-emer-par');
    html += '</div>';

    // Actions
    html += '<div style="display:flex;justify-content:flex-end;gap:10px;margin-top:16px">';
    html += '<button class="btn btn-out rrhh-back-btn" style="font-size:.72rem">Cancelar</button>';
    html += '<button class="btn rrhh-save-btn" style="font-size:.72rem">💾 ' + (isEdit ? 'Guardar Cambios' : 'Registrar Empleado') + '</button>';
    html += '</div>';

    html += '</div></div>';
    el.innerHTML = html;

    // Wire
    el.querySelectorAll('.rrhh-back-btn').forEach(function(b) { b.onclick = function() { _rrhhView = _rrhhCurrentId ? 'detail' : 'list'; rRRHHEmpleados(); }; });
    el.querySelector('.rrhh-save-btn').onclick = function() {
      var nombre = (document.getElementById('rrhh-f-nombre') || {}).value || '';
      var puesto = (document.getElementById('rrhh-f-puesto') || {}).value || '';
      if (!nombre.trim()) { toast('Ingresa el nombre del empleado'); return; }
      if (!puesto) { toast('Selecciona el puesto'); return; }

      var empData = {
        nombre: nombre.trim(),
        puesto: puesto,
        turno: (document.getElementById('rrhh-f-turno') || {}).value || '',
        celular: (document.getElementById('rrhh-f-celular') || {}).value || '',
        email_personal: (document.getElementById('rrhh-f-email') || {}).value || '',
        fecha_ingreso: (document.getElementById('rrhh-f-ingreso') || {}).value || '',
        rfc: (document.getElementById('rrhh-f-rfc') || {}).value || '',
        curp: (document.getElementById('rrhh-f-curp') || {}).value || '',
        nss: (document.getElementById('rrhh-f-nss') || {}).value || '',
        banco: (document.getElementById('rrhh-f-banco') || {}).value || '',
        clabe: (document.getElementById('rrhh-f-clabe') || {}).value || '',
        salario_mensual: parseFloat((document.getElementById('rrhh-f-salario') || {}).value) || 0,
        emergencia_nombre: (document.getElementById('rrhh-f-emer-nombre') || {}).value || '',
        emergencia_tel: (document.getElementById('rrhh-f-emer-tel') || {}).value || '',
        emergencia_parentesco: (document.getElementById('rrhh-f-emer-par') || {}).value || '',
      };

      if (isEdit) {
        rrhhUpdateEmpleado(editId, empData);
        toast('✅ ' + empData.nombre + ' actualizado');
        _rrhhView = 'detail';
      } else {
        empData.id = 'emp_' + Date.now();
        empData.activo = true;
        empData.fecha_baja = null;
        empData.documentos = [];
        empData.notas = '';
        empData.created_at = new Date().toISOString();
        empData.updated_at = new Date().toISOString();
        rrhhAddEmpleado(empData);
        toast('✅ ' + empData.nombre + ' registrado');
        _rrhhView = 'list';
      }
      rRRHHEmpleados();
    };
  }

  // Field helpers
  function _rrhhField(label, value, id, type) {
    return '<div><label style="font-size:.68rem;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">' + label + '</label>' +
      '<input type="' + (type || 'text') + '" id="' + id + '" class="fi" value="' + escapeHtml(String(value || '')) + '" style="width:100%;font-size:.78rem;padding:6px 10px"' + (type === 'number' ? ' min="0" step="100"' : '') + '></div>';
  }
  function _rrhhSelect(label, options, value, id) {
    var html = '<div><label style="font-size:.68rem;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">' + label + '</label>';
    html += '<select id="' + id + '" class="fi" style="width:100%;font-size:.78rem;padding:6px 10px">';
    html += '<option value="">— Seleccionar —</option>';
    options.forEach(function(o) { html += '<option value="' + escapeHtml(o) + '"' + (o === value ? ' selected' : '') + '>' + escapeHtml(o) + '</option>'; });
    html += '</select></div>';
    return html;
  }

  // ═══════════════════════════════════════
  // EXPOSE + REGISTER
  // ═══════════════════════════════════════
  window.rrhhLoad = rrhhLoad;
  window.rrhhSave = rrhhSave;
  window.rRRHHEmpleados = rRRHHEmpleados;

  if (typeof registerView === 'function') {
    registerView('stel_rrhh_empleados', rRRHHEmpleados);
  }

})(window);
