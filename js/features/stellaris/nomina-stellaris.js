// GF — Stellaris Casino: Nómina Quincenas
(function(window) {
  'use strict';

  var NOM_KEY = 'gf_stel_nomina';

  // ── HELPERS ──────────────────────────────────────────────────
  function fmtN(n) {
    if (!n && n !== 0) return '—';
    return '$' + Math.abs(n).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function fmtNK(n) {
    if (!n) return '$0';
    if (Math.abs(n) >= 1000000) return '$' + (n/1000000).toFixed(2) + 'M';
    if (Math.abs(n) >= 1000)    return '$' + (n/1000).toFixed(1) + 'K';
    return '$' + n.toFixed(0);
  }
  function pill(txt, color) {
    return '<span style="display:inline-block;padding:2px 8px;border-radius:10px;font-size:.65rem;font-weight:700;background:' + color + 'BB;color:#fff">' + txt + '</span>';
  }

  // ── STORAGE ──────────────────────────────────────────────────
  function nomStelLoad() {
    return (typeof DB !== 'undefined' && DB.get(NOM_KEY)) || { quincenas: [] };
  }
  function nomStelSave(data) {
    if (typeof DB !== 'undefined') DB.set(NOM_KEY, data);
  }

  // ── PARSER Excel Dispersión ──────────────────────────────────
  function parseDispersion(wb) {
    // Buscar hoja DISPERSION
    var sheetName = wb.SheetNames.find(function(n) {
      return n.toUpperCase().includes('DISPER');
    }) || wb.SheetNames[0];
    var ws = wb.Sheets[sheetName];
    if (!ws) return null;

    var rows = XLSX.utils.sheet_to_json(ws, { header: 1, defval: null });
    if (!rows.length) return null;

    // Encontrar fila de encabezado (tiene NOMBRE o TRANSFERENCIA)
    var headerIdx = -1;
    for (var i = 0; i < Math.min(rows.length, 10); i++) {
      var r = rows[i];
      if (!r) continue;
      var joined = r.map(function(c){ return c ? String(c).toUpperCase() : ''; }).join('|');
      if (joined.includes('NOMBRE') && (joined.includes('TRANSFER') || joined.includes('NOMINA'))) {
        headerIdx = i; break;
      }
    }
    if (headerIdx < 0) headerIdx = 0;

    var headers = rows[headerIdx].map(function(h){ return h ? String(h).toUpperCase().trim() : ''; });

    // Detectar columnas
    var colNombre    = headers.findIndex(function(h){ return h.includes('NOMBRE'); });
    var colPuesto    = headers.findIndex(function(h){ return h.includes('PUESTO'); });
    var colTransfer  = headers.findIndex(function(h){ return h.includes('TRANSFER'); });
    var colBanco     = headers.findIndex(function(h){ return h.includes('BANCO'); });
    var colClabe     = headers.findIndex(function(h){ return h.includes('CLABE'); });
    var colNum       = 0; // col A = #

    // Fallback a posiciones fijas del Excel conocido: A=#, B=nombre, G=puesto, K=transfer, L=clabe, M=banco
    if (colNombre    < 0) colNombre    = 1;
    if (colPuesto    < 0) colPuesto    = 6;
    if (colTransfer  < 0) colTransfer  = 10;
    if (colBanco     < 0) colBanco     = 12;
    if (colClabe     < 0) colClabe     = 11;

    var n = function(v) { return parseFloat(v) || 0; };

    var empleados = [];
    var totalEmpleados = 0;

    for (var j = headerIdx + 1; j < rows.length; j++) {
      var row = rows[j];
      if (!row) continue;
      var nombre = row[colNombre] ? String(row[colNombre]).trim() : '';
      var transfer = n(row[colTransfer]);

      // Parar si llegamos a fila de totales/resumen (nombre vacío con monto, o fila de texto total)
      if (!nombre && transfer === 0) continue;
      if (!nombre && transfer > 0) break;  // fila de subtotales al final
      if (nombre.toUpperCase().includes('TOTAL') || nombre.toUpperCase().includes('NOMINA STELLARIS')) break;
      if (!nombre) continue;

      empleados.push({
        num:          n(row[colNum]) || (j - headerIdx),
        nombre:       nombre,
        puesto:       row[colPuesto] ? String(row[colPuesto]).trim() : '',
        transferencia: transfer,
        banco:        row[colBanco]  ? String(row[colBanco]).trim()  : '',
        clabe:        row[colClabe]  ? String(row[colClabe]).trim()  : ''
      });
      totalEmpleados += transfer;
    }

    return { empleados: empleados, totalEmpleados: totalEmpleados, nEmpleados: empleados.length };
  }

  // ── DETECTAR ALTAS / BAJAS vs quincena anterior ──────────────
  function _diffQuincenas(anterior, actual) {
    if (!anterior || !anterior.empleados) return { altas: [], bajas: [] };
    var nombresAnt = anterior.empleados.map(function(e){ return e.nombre.toUpperCase(); });
    var nombresAct = actual.empleados.map(function(e){ return e.nombre.toUpperCase(); });
    var altas = actual.empleados
      .filter(function(e){ return !nombresAnt.includes(e.nombre.toUpperCase()); })
      .map(function(e){ return e.nombre; });
    var bajas = anterior.empleados
      .filter(function(e){ return !nombresAct.includes(e.nombre.toUpperCase()); })
      .map(function(e){ return e.nombre; });
    return { altas: altas, bajas: bajas };
  }

  // ── VISTA: DASHBOARD NÓMINA ──────────────────────────────────
  var _nomTab = 'resumen'; // resumen | empleados | historial

  function rNominaStel() {
    var el = document.getElementById('view-stel_rrhh_nomina');
    if (!el) return;
    var data = nomStelLoad();
    var quincenas = data.quincenas || [];

    if (!quincenas.length) {
      el.innerHTML =
        '<div style="font-family:Poppins,sans-serif;font-size:.95rem;font-weight:700;margin-bottom:4px">💰 Nómina Quincenas — Stellaris</div>' +
        '<div style="text-align:center;padding:60px 20px;background:var(--white);border:2px dashed var(--border2);border-radius:var(--r);margin-top:14px">' +
          '<div style="font-size:2.5rem;margin-bottom:12px">📋</div>' +
          '<div style="font-weight:700;font-size:.9rem;margin-bottom:6px">Sin quincenas cargadas</div>' +
          '<div style="font-size:.75rem;color:var(--muted);margin-bottom:20px">Sube el Excel de Dispersión de la primera quincena para comenzar</div>' +
          '<button class="btn btn-blue" style="font-size:.78rem" onclick="navTo(\'stel_rrhh_nomina_upload\')">📤 Cargar Primera Quincena</button>' +
        '</div>';
      return;
    }

    // Quincena más reciente
    var ultima = quincenas[0];
    var anterior = quincenas[1] || null;

    var tabs = [
      { id: 'resumen',   lbl: '📊 Resumen' },
      { id: 'empleados', lbl: '👥 Empleados' },
      { id: 'historial', lbl: '📅 Historial' }
    ];
    var tabBtns = tabs.map(function(t) {
      var act = t.id === _nomTab;
      return '<button onclick="nomStelTab(\'' + t.id + '\')" style="padding:5px 14px;border-radius:6px;border:1px solid ' +
        (act ? 'var(--blue)' : 'var(--border)') + ';background:' +
        (act ? 'var(--blue)' : 'var(--white)') + ';color:' +
        (act ? '#fff' : 'var(--text)') + ';font-size:.72rem;font-family:Figtree,sans-serif;cursor:pointer">' + t.lbl + '</button>';
    }).join('');

    var html =
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:12px;flex-wrap:wrap;gap:8px">' +
        '<div>' +
          '<div style="font-family:Poppins,sans-serif;font-size:.95rem;font-weight:700">💰 Nómina Quincenas — Stellaris Casino</div>' +
          '<div style="font-size:.68rem;color:var(--muted);margin-top:2px">' + quincenas.length + ' quincena' + (quincenas.length !== 1 ? 's' : '') + ' · Última: ' + escapeHtml(ultima.label || '') + '</div>' +
        '</div>' +
        '<button class="btn btn-blue" style="font-size:.72rem" onclick="navTo(\'stel_rrhh_nomina_upload\')">📤 Cargar Quincena</button>' +
      '</div>' +

      '<div style="display:flex;gap:6px;margin-bottom:14px">' + tabBtns + '</div>';

    if (_nomTab === 'resumen')   html += _nomBuildResumen(ultima, anterior);
    if (_nomTab === 'empleados') html += _nomBuildEmpleados(ultima);
    if (_nomTab === 'historial') html += _nomBuildHistorial(quincenas);

    el.innerHTML = html;
  }

  function _nomBuildResumen(q, ant) {
    var totAnt = ant ? ant.total : null;
    var diff   = totAnt !== null ? q.total - totAnt : null;
    var diffPct = totAnt && totAnt > 0 ? diff / totAnt : null;

    function badge(d) {
      if (d === null) return '';
      var sign = d >= 0 ? '+' : '';
      var col  = d >= 0 ? 'var(--red)' : 'var(--green)';
      return ' <span style="font-size:.65rem;color:' + col + ';font-weight:700">' + sign + fmtNK(d) + '</span>';
    }

    // KPIs
    var html =
      '<div style="display:grid;grid-template-columns:repeat(4,1fr);gap:10px;margin-bottom:14px">' +
        _kpiN('Total Quincena',    fmtNK(q.total),          'Empleados + CEO + Impuestos', '#0073ea',      '💰', badge(diff)) +
        _kpiN('Empleados Activos', String(q.nEmpleados),    'En esta quincena',             '#00b875',      '👥', '') +
        _kpiN('CEO (Beto)',        fmtNK(q.ceo || 0),       'Fijo por quincena',           '#9b51e0',      '👤', '') +
        _kpiN('Impuestos Nómina',  fmtNK(q.impuestos || 0), 'IMSS + ISR aprox.',           'var(--orange)', '🏛', '') +
      '</div>';

    // Altas / Bajas
    var altas = q.altas || [];
    var bajas = q.bajas || [];
    if (altas.length || bajas.length) {
      html += '<div style="display:grid;grid-template-columns:1fr 1fr;gap:10px;margin-bottom:14px">';
      if (altas.length) {
        html += '<div style="background:var(--white);border:1px solid var(--border);border-radius:var(--r);padding:14px">' +
          '<div style="font-size:.72rem;font-weight:700;color:var(--green);margin-bottom:8px">✅ Altas (' + altas.length + ')</div>' +
          altas.map(function(n){ return '<div style="font-size:.72rem;padding:3px 0;border-bottom:1px solid var(--bg)">' + escapeHtml(n) + '</div>'; }).join('') +
          '</div>';
      }
      if (bajas.length) {
        html += '<div style="background:var(--white);border:1px solid var(--border);border-radius:var(--r);padding:14px">' +
          '<div style="font-size:.72rem;font-weight:700;color:var(--red);margin-bottom:8px">📤 Bajas (' + bajas.length + ')</div>' +
          bajas.map(function(n){ return '<div style="font-size:.72rem;padding:3px 0;border-bottom:1px solid var(--bg)">' + escapeHtml(n) + '</div>'; }).join('') +
          '</div>';
      }
      html += '</div>';
    }

    // Desglose del total
    html +=
      '<div style="background:var(--white);border:1px solid var(--border);border-radius:var(--r);padding:16px;margin-bottom:14px">' +
        '<div style="font-size:.78rem;font-weight:700;margin-bottom:12px">Desglose — ' + escapeHtml(q.label || '') + '</div>' +
        '<table style="width:100%;border-collapse:collapse;font-size:.78rem">' +
          '<thead><tr style="border-bottom:2px solid var(--border)">' +
            '<th style="text-align:left;padding:6px 8px;font-size:.65rem;text-transform:uppercase;color:var(--muted)">Concepto</th>' +
            '<th style="text-align:right;padding:6px 8px;font-size:.65rem;text-transform:uppercase;color:var(--muted)">Monto</th>' +
            '<th style="text-align:right;padding:6px 8px;font-size:.65rem;text-transform:uppercase;color:var(--muted)">%</th>' +
          '</tr></thead><tbody>' +
          _fila('👥 Empleados (' + q.nEmpleados + ')', q.totalEmpleados, q.total, 'var(--blue)') +
          _fila('👤 CEO (Beto)',                        q.ceo || 0,       q.total, '#9b51e0') +
          _fila('🏛 Impuestos Nómina',                  q.impuestos || 0, q.total, 'var(--orange)') +
          '<tr style="border-top:2px solid var(--border);font-weight:800">' +
            '<td style="padding:8px 8px">TOTAL QUINCENA</td>' +
            '<td style="text-align:right;padding:8px 8px;color:var(--blue)">' + fmtN(q.total) + '</td>' +
            '<td style="text-align:right;padding:8px 8px;color:var(--muted)">100%</td>' +
          '</tr>' +
          '<tr style="border-top:1px solid var(--border);color:var(--muted)">' +
            '<td style="padding:8px 8px;font-size:.72rem">✕ 2 quincenas → Mensual estimado</td>' +
            '<td style="text-align:right;padding:8px 8px;font-weight:700;color:var(--text)">' + fmtN(q.total * 2) + '</td>' +
            '<td></td>' +
          '</tr>' +
        '</tbody></table>' +
      '</div>';

    return html;
  }

  function _fila(label, monto, total, color) {
    var pct = total > 0 ? (monto / total * 100).toFixed(1) + '%' : '—';
    return '<tr style="border-bottom:1px solid var(--bg)">' +
      '<td style="padding:6px 8px">' + label + '</td>' +
      '<td style="text-align:right;padding:6px 8px;font-weight:700;color:' + color + '">' + fmtN(monto) + '</td>' +
      '<td style="text-align:right;padding:6px 8px;color:var(--muted);font-size:.72rem">' + pct + '</td>' +
    '</tr>';
  }

  function _nomBuildEmpleados(q) {
    var emps = q.empleados || [];
    // Agrupar por puesto
    var puestos = {};
    emps.forEach(function(e) {
      var p = e.puesto || 'Sin puesto';
      if (!puestos[p]) puestos[p] = { total: 0, count: 0 };
      puestos[p].total += e.transferencia;
      puestos[p].count++;
    });

    var rows = emps.map(function(e, i) {
      var hasCLABE = e.clabe && e.clabe.length >= 18;
      return '<tr>' +
        '<td style="font-size:.68rem;color:var(--muted)">' + (e.num || (i+1)) + '</td>' +
        '<td class="bld" style="font-size:.72rem">' + escapeHtml(e.nombre) + '</td>' +
        '<td style="font-size:.7rem">' + escapeHtml(e.puesto) + '</td>' +
        '<td class="r mo" style="font-size:.72rem;font-weight:700">' + fmtN(e.transferencia) + '</td>' +
        '<td style="font-size:.68rem">' + escapeHtml(e.banco || '—') + '</td>' +
        '<td style="font-size:.68rem;color:' + (hasCLABE ? 'var(--green)' : 'var(--red)') + '">' +
          (hasCLABE ? '✓ ' + e.clabe.slice(-4) : '⚠ Sin CLABE') +
        '</td>' +
      '</tr>';
    }).join('');

    return '<div class="tw">' +
      '<div class="tw-h"><div class="tw-ht">👥 Empleados — ' + escapeHtml(q.label || '') + '</div>' +
        '<div style="font-size:.68rem;color:var(--muted)">' + emps.length + ' empleados · Total: ' + fmtN(q.totalEmpleados) + '</div>' +
      '</div>' +
      '<div style="overflow-x:auto"><table class="bt" style="font-size:.72rem;white-space:nowrap">' +
        '<thead><tr>' +
          '<th>#</th><th>Nombre</th><th>Puesto</th><th class="r">Transferencia</th><th>Banco</th><th>CLABE</th>' +
        '</tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
        '<tfoot><tr style="font-weight:800;background:var(--blue-bg)">' +
          '<td colspan="3">TOTAL EMPLEADOS</td>' +
          '<td class="r mo">' + fmtN(q.totalEmpleados) + '</td>' +
          '<td colspan="2"></td>' +
        '</tr></tfoot>' +
      '</table></div></div>';
  }

  function _nomBuildHistorial(quincenas) {
    var rows = quincenas.map(function(q, i) {
      var ant = quincenas[i + 1];
      var diff = ant ? q.total - ant.total : null;
      var diffStr = diff !== null
        ? '<span style="color:' + (diff >= 0 ? 'var(--red)' : 'var(--green)') + ';font-size:.68rem">' +
          (diff >= 0 ? '+' : '') + fmtNK(diff) + '</span>'
        : '<span style="color:var(--muted);font-size:.68rem">—</span>';
      var altasBajas = '';
      if ((q.altas||[]).length) altasBajas += pill('+' + q.altas.length + ' altas', '#00b875');
      if ((q.bajas||[]).length) altasBajas += ' ' + pill('-' + q.bajas.length + ' bajas', '#e74c3c');

      return '<tr>' +
        '<td class="bld" style="white-space:nowrap">' + escapeHtml(q.label || '') + '</td>' +
        '<td class="r" style="font-size:.68rem;color:var(--muted)">' + escapeHtml(q.uploadedAt || '') + '</td>' +
        '<td class="r" style="font-size:.72rem">' + q.nEmpleados + '</td>' +
        '<td class="r mo" style="font-size:.72rem">' + fmtN(q.totalEmpleados) + '</td>' +
        '<td class="r mo" style="font-size:.72rem">' + fmtN(q.ceo || 0) + '</td>' +
        '<td class="r mo" style="font-size:.72rem">' + fmtN(q.impuestos || 0) + '</td>' +
        '<td class="r mo bld" style="color:var(--blue)">' + fmtN(q.total) + '</td>' +
        '<td class="r">' + diffStr + '</td>' +
        '<td>' + altasBajas + '</td>' +
        '<td><button onclick="nomStelDeleteQ(' + q.id + ')" style="background:none;border:none;color:var(--muted);cursor:pointer;font-size:.7rem" title="Eliminar">🗑️</button></td>' +
      '</tr>';
    }).join('');

    return '<div class="tw">' +
      '<div class="tw-h"><div class="tw-ht">📅 Historial de Quincenas</div></div>' +
      '<div style="overflow-x:auto"><table class="bt" style="font-size:.72rem;white-space:nowrap">' +
        '<thead><tr>' +
          '<th>Quincena</th><th class="r">Cargada</th><th class="r">Empleados</th>' +
          '<th class="r">Dispersión</th><th class="r">CEO</th><th class="r">Impuestos</th>' +
          '<th class="r">Total</th><th class="r">vs Ant.</th><th>Movimientos</th><th></th>' +
        '</tr></thead>' +
        '<tbody>' + rows + '</tbody>' +
      '</table></div></div>';
  }

  function _kpiN(lbl, val, sub, color, ico, badge) {
    return '<div style="background:var(--white);border:1px solid var(--border);border-radius:var(--r);padding:16px">' +
      '<div style="display:flex;align-items:center;justify-content:space-between;margin-bottom:6px">' +
        '<div style="font-size:.62rem;font-weight:700;text-transform:uppercase;letter-spacing:.06em;color:var(--muted)">' + lbl + '</div>' +
        '<div style="background:rgba(0,0,0,.04);color:' + color + ';border-radius:8px;padding:4px 8px;font-size:.85rem">' + ico + '</div>' +
      '</div>' +
      '<div style="font-size:1.6rem;font-weight:800;color:' + color + ';line-height:1">' + val + badge + '</div>' +
      '<div style="font-size:.65rem;color:var(--muted);margin-top:4px">' + sub + '</div>' +
    '</div>';
  }

  // ── VISTA: UPLOAD ────────────────────────────────────────────
  var _nomPreview = null; // datos parseados pendientes de confirmar

  function rNominaStelUpload() {
    var el = document.getElementById('view-stel_rrhh_nomina_upload');
    if (!el) return;
    _nomRenderUpload(el);
  }

  function _nomRenderUpload(el) {
    var data = nomStelLoad();
    var prev = data.quincenas[0] || null;

    el.innerHTML =
      '<div style="font-family:Poppins,sans-serif;font-size:.95rem;font-weight:700;margin-bottom:4px">📤 Cargar Quincena — Stellaris</div>' +
      '<div style="font-size:.68rem;color:var(--muted);margin-bottom:14px">Sube el Excel de Dispersión · Hoja: DISPERSION · Columna verde (K) = Transferencia</div>' +

      // Dropzone
      '<div id="nom-dropzone" style="border:2px dashed var(--blue);border-radius:var(--r);padding:40px 20px;text-align:center;cursor:pointer;background:var(--blue-bg);margin-bottom:14px;transition:.2s">' +
        '<div style="font-size:2.5rem;margin-bottom:10px">📋</div>' +
        '<div style="font-weight:700;font-size:.88rem;color:var(--blue);margin-bottom:4px">Arrastra el Excel de Dispersión aquí</div>' +
        '<div style="font-size:.72rem;color:var(--muted);margin-bottom:12px">o haz clic para buscar · Solo archivos .xlsx</div>' +
        '<button class="btn btn-blue" style="font-size:.75rem">📂 Seleccionar Archivo</button>' +
        '<input type="file" id="nom-file-input" accept=".xlsx,.xls" style="display:none">' +
      '</div>' +

      // Preview (inicialmente vacío)
      '<div id="nom-preview-area"></div>';

    // Wire dropzone
    var dz = el.querySelector('#nom-dropzone');
    var fi = el.querySelector('#nom-file-input');
    dz.onclick = function(e) { if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT') fi.click(); };
    dz.querySelector('button').onclick = function(e) { e.stopPropagation(); fi.click(); };
    dz.ondragover  = function(e) { e.preventDefault(); dz.style.background = 'rgba(0,115,234,.14)'; };
    dz.ondragleave = function()  { dz.style.background = 'var(--blue-bg)'; };
    dz.ondrop = function(e) {
      e.preventDefault(); dz.style.background = 'var(--blue-bg)';
      var files = e.dataTransfer.files;
      if (files[0]) _nomProcessFile(files[0], prev);
    };
    fi.onchange = function() { if (fi.files[0]) _nomProcessFile(fi.files[0], prev); };
  }

  function _nomProcessFile(file, prevQ) {
    var reader = new FileReader();
    reader.onload = function(e) {
      var wb = XLSX.read(e.target.result, { type: 'array' });
      var parsed = parseDispersion(wb);
      if (!parsed || !parsed.empleados.length) {
        toast('❌ No se encontraron datos en la hoja DISPERSION');
        return;
      }
      _nomPreview = parsed;
      _nomRenderPreview(file.name, parsed, prevQ);
    };
    reader.readAsArrayBuffer(file);
  }

  function _nomRenderPreview(filename, parsed, prevQ) {
    var previewEl = document.getElementById('nom-preview-area');
    if (!previewEl) return;

    // Detectar altas/bajas
    var diff = _diffQuincenas(prevQ, parsed);

    var rows = parsed.empleados.map(function(e, i) {
      var esAlta = diff.altas.some(function(n){ return n.toUpperCase() === e.nombre.toUpperCase(); });
      var hasCLABE = e.clabe && e.clabe.length >= 18;
      return '<tr' + (esAlta ? ' style="background:rgba(0,184,117,.06)"' : '') + '>' +
        '<td style="font-size:.68rem;color:var(--muted)">' + (e.num || (i+1)) + '</td>' +
        '<td class="bld" style="font-size:.72rem">' + escapeHtml(e.nombre) +
          (esAlta ? ' <span style="font-size:.6rem;color:var(--green);font-weight:700">ALTA</span>' : '') +
        '</td>' +
        '<td style="font-size:.7rem">' + escapeHtml(e.puesto) + '</td>' +
        '<td class="r" style="font-size:.72rem;font-weight:700">' + fmtN(e.transferencia) + '</td>' +
        '<td style="font-size:.68rem">' + escapeHtml(e.banco || '—') + '</td>' +
        '<td style="font-size:.65rem;color:' + (hasCLABE ? 'var(--green)' : 'var(--red)') + '">' +
          (hasCLABE ? '✓' : '⚠ Sin CLABE') +
        '</td>' +
      '</tr>';
    }).join('');

    var bajaRows = diff.bajas.map(function(n) {
      return '<tr style="background:rgba(231,76,60,.06)">' +
        '<td colspan="6" style="font-size:.72rem;color:var(--red);padding:6px 12px">📤 BAJA: ' + escapeHtml(n) + '</td>' +
      '</tr>';
    }).join('');

    previewEl.innerHTML =
      '<div style="background:var(--white);border:1px solid var(--green);border-radius:var(--r);padding:14px;margin-bottom:14px">' +
        '<div style="font-size:.75rem;font-weight:700;color:var(--green);margin-bottom:6px">✅ Archivo parseado correctamente — ' + escapeHtml(filename) + '</div>' +
        '<div style="display:flex;gap:20px;font-size:.72rem;flex-wrap:wrap">' +
          '<span><b>' + parsed.nEmpleados + '</b> empleados</span>' +
          '<span>Subtotal dispersión: <b>' + fmtN(parsed.totalEmpleados) + '</b></span>' +
          (diff.altas.length ? '<span style="color:var(--green)"><b>+' + diff.altas.length + '</b> altas</span>' : '') +
          (diff.bajas.length ? '<span style="color:var(--red)"><b>-' + diff.bajas.length + '</b> bajas</span>' : '') +
        '</div>' +
      '</div>' +

      // Campos de configuración
      '<div style="background:var(--white);border:1px solid var(--border);border-radius:var(--r);padding:16px;margin-bottom:14px">' +
        '<div style="font-size:.78rem;font-weight:700;margin-bottom:12px">⚙️ Configurar Quincena</div>' +
        '<div style="display:grid;grid-template-columns:repeat(3,1fr);gap:12px;font-size:.78rem">' +
          '<div><label style="font-size:.65rem;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">ETIQUETA (ej: 1ª Qna Abr 2026)</label>' +
            '<input id="nom-label" class="fi" style="width:100%;font-size:.78rem;padding:6px 10px" value="' + _guessLabel() + '"></div>' +
          '<div><label style="font-size:.65rem;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">CEO — BETO (fijo)</label>' +
            '<input id="nom-ceo" type="number" class="fi" style="width:100%;font-size:.78rem;padding:6px 10px" value="60000"></div>' +
          '<div><label style="font-size:.65rem;font-weight:600;color:var(--muted);display:block;margin-bottom:3px">IMPUESTOS NÓMINA (aprox)</label>' +
            '<input id="nom-imp" type="number" class="fi" style="width:100%;font-size:.78rem;padding:6px 10px" value="75000"></div>' +
        '</div>' +
        '<div style="margin-top:10px;padding:8px 12px;background:var(--blue-bg);border-radius:8px;font-size:.72rem;color:var(--blue)">' +
          'Total estimado quincena: <b id="nom-total-preview">' + fmtN(parsed.totalEmpleados + 60000 + 75000) + '</b>' +
        '</div>' +
      '</div>' +

      // Tabla preview
      '<div class="tw" style="margin-bottom:14px">' +
        '<div class="tw-h"><div class="tw-ht">Vista Previa · Empleados</div></div>' +
        '<div style="overflow-x:auto"><table class="bt" style="font-size:.72rem;white-space:nowrap">' +
          '<thead><tr><th>#</th><th>Nombre</th><th>Puesto</th><th class="r">Transferencia</th><th>Banco</th><th>CLABE</th></tr></thead>' +
          '<tbody>' + rows + bajaRows + '</tbody>' +
          '<tfoot><tr style="font-weight:800;background:var(--blue-bg)">' +
            '<td colspan="3">SUBTOTAL EMPLEADOS</td>' +
            '<td class="r">' + fmtN(parsed.totalEmpleados) + '</td>' +
            '<td colspan="2"></td>' +
          '</tr></tfoot>' +
        '</table></div>' +
      '</div>' +

      // Botones
      '<div style="display:flex;gap:10px">' +
        '<button class="btn btn-blue" style="font-size:.78rem" onclick="nomStelConfirmar()">💾 Confirmar y Guardar Quincena</button>' +
        '<button class="btn btn-out" style="font-size:.78rem" onclick="navTo(\'stel_rrhh_nomina\')">Cancelar</button>' +
      '</div>';

    // Actualizar preview total al cambiar CEO/impuestos
    ['nom-ceo','nom-imp'].forEach(function(id) {
      var el2 = document.getElementById(id);
      if (el2) el2.oninput = function() {
        var ceo = parseFloat((document.getElementById('nom-ceo')||{}).value) || 0;
        var imp = parseFloat((document.getElementById('nom-imp')||{}).value) || 0;
        var tot = document.getElementById('nom-total-preview');
        if (tot) tot.textContent = fmtN(parsed.totalEmpleados + ceo + imp);
      };
    });
  }

  function _guessLabel() {
    var now = new Date();
    var meses = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
    var mes = meses[now.getMonth()];
    var qna = now.getDate() <= 15 ? '1ª' : '2ª';
    return qna + ' Qna ' + mes + ' ' + now.getFullYear();
  }

  // ── CONFIRMAR Y GUARDAR ──────────────────────────────────────
  function nomStelConfirmar() {
    if (!_nomPreview) { toast('Sin datos para guardar'); return; }
    var label  = (document.getElementById('nom-label') || {}).value || _guessLabel();
    var ceo    = parseFloat((document.getElementById('nom-ceo') || {}).value) || 60000;
    var imp    = parseFloat((document.getElementById('nom-imp') || {}).value) || 75000;

    var data   = nomStelLoad();
    var prevQ  = data.quincenas[0] || null;
    var diff   = _diffQuincenas(prevQ, _nomPreview);

    var quincena = {
      id:             Date.now(),
      label:          label.trim(),
      uploadedAt:     new Date().toISOString().slice(0, 10),
      empleados:      _nomPreview.empleados,
      totalEmpleados: _nomPreview.totalEmpleados,
      nEmpleados:     _nomPreview.nEmpleados,
      ceo:            ceo,
      impuestos:      imp,
      total:          _nomPreview.totalEmpleados + ceo + imp,
      altas:          diff.altas,
      bajas:          diff.bajas
    };

    data.quincenas.unshift(quincena);
    if (data.quincenas.length > 24) data.quincenas = data.quincenas.slice(0, 24);
    nomStelSave(data);

    _nomPreview = null;
    _nomTab = 'resumen';
    toast('✅ Quincena "' + label + '" guardada · ' + quincena.nEmpleados + ' empleados');
    navTo('stel_rrhh_nomina');
  }

  function nomStelDeleteQ(id) {
    if (!confirm('¿Eliminar esta quincena? Esta acción no se puede deshacer.')) return;
    var data = nomStelLoad();
    data.quincenas = data.quincenas.filter(function(q) { return q.id !== id; });
    nomStelSave(data);
    toast('🗑️ Quincena eliminada');
    rNominaStel();
  }

  function nomStelTab(tab) {
    _nomTab = tab;
    rNominaStel();
  }

  // ── EXPOSE ───────────────────────────────────────────────────
  window.nomStelLoad     = nomStelLoad;
  window.nomStelSave     = nomStelSave;
  window.nomStelConfirmar = nomStelConfirmar;
  window.nomStelDeleteQ  = nomStelDeleteQ;
  window.nomStelTab      = nomStelTab;
  window.rNominaStel     = rNominaStel;
  window.rNominaStelUpload = rNominaStelUpload;

  if (typeof registerView === 'function') {
    registerView('stel_rrhh_nomina',        rNominaStel);
    registerView('stel_rrhh_nomina_upload', rNominaStelUpload);
  }

})(window);
