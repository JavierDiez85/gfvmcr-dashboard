// GF — Stellaris: Cierre Maquineros — Upload View
(function(window) {
  'use strict';

  function rCierreUpload() {
    var el = document.getElementById('view-stel_cierre_upload');
    if (!el) return;

    var data = cierreLoad();
    var nCortes = (data.cortes || []).length;
    var lastCorte = nCortes ? data.cortes[0] : null;

    el.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:4px">' +
        '<div style="font-family:Poppins,sans-serif;font-size:.95rem;font-weight:700">📤 Cargar Reporte de Máquinas</div>' +
        (nCortes ? '<button onclick="cierre_clearAll()" style="background:none;border:1px solid var(--red);color:var(--red);border-radius:6px;padding:4px 10px;font-size:.7rem;cursor:pointer;font-family:inherit">🗑 Limpiar todo</button>' : '') +
      '</div>' +
      '<div style="font-size:.68rem;color:var(--muted);margin-bottom:14px">Sube el Excel exportado del sistema de casino. Se detecta la hoja de datos y la hoja de Comisiones automáticamente.</div>' +

      // KPIs de estado
      '<div class="kpi-row c3" style="margin-bottom:14px">' +
        '<div class="kpi-card" style="--ac:var(--blue)"><div class="kpi-top"><div class="kpi-lbl">Cortes Cargados</div><div class="kpi-ico" style="background:var(--blue-bg);color:var(--blue)">📊</div></div><div class="kpi-val" style="color:var(--blue)">' + nCortes + '</div><div class="kpi-d dnu">' + (lastCorte ? 'Último: ' + lastCorte.hasta : 'Sin datos') + '</div></div>' +
        '<div class="kpi-card" style="--ac:var(--green)"><div class="kpi-top"><div class="kpi-lbl">Tasas Config.</div><div class="kpi-ico" style="background:var(--green-bg);color:var(--green)">⚙️</div></div><div class="kpi-val" style="color:var(--green)">' + (data.tasas || []).filter(function(t){ return !t.esOperadora; }).length + '</div><div class="kpi-d dnu">proveedores · ' + (data.tasas && data.tasas.length ? 'del Excel' : 'default') + '</div></div>' +
        '<div class="kpi-card" style="--ac:var(--orange)"><div class="kpi-top"><div class="kpi-lbl">Última Carga</div><div class="kpi-ico" style="background:var(--orange-bg);color:var(--orange)">📅</div></div><div class="kpi-val" style="font-size:1.1rem;color:var(--orange)">' + (lastCorte ? lastCorte.uploadedAt : '—') + '</div><div class="kpi-d dnu">' + (lastCorte ? escapeHtml(lastCorte.casino||'') : '') + '</div></div>' +
      '</div>' +

      // Dropzone
      '<div class="tw" style="margin-bottom:14px">' +
        '<div class="tw-h"><div class="tw-ht">📎 Subir Reporte Excel</div></div>' +
        '<div style="padding:16px">' +
          '<div id="cierre-dropzone" style="border:2px dashed var(--blue);border-radius:var(--r);padding:36px 20px;text-align:center;cursor:pointer;transition:all .2s;background:var(--blue-bg)">' +
            '<div style="font-size:2rem;margin-bottom:8px">📊</div>' +
            '<div style="font-size:.82rem;font-weight:700;color:var(--blue);margin-bottom:4px">Arrastra el Excel aquí o haz clic para seleccionar</div>' +
            '<div style="font-size:.7rem;color:var(--muted)">Formato: Reporte de Máquinas del sistema casino (.xlsx / .xls)</div>' +
            '<div style="font-size:.68rem;color:var(--muted);margin-top:4px">Hoja 1: Datos por máquina · Hoja 2 (opcional): Tabla de Comisiones</div>' +
            '<input type="file" id="cierre-file-input" accept=".xlsx,.xls" style="display:none">' +
          '</div>' +
          '<div id="cierre-status" style="display:none;margin-top:10px;padding:10px 14px;border-radius:var(--r);font-size:.78rem"></div>' +
          '<div id="cierre-preview" style="display:none;margin-top:10px"></div>' +
          '<button id="cierre-save-btn" style="display:none;margin-top:10px" class="btn btn-blue" onclick="cierre_confirmSave()">✅ Guardar Corte</button>' +
        '</div>' +
      '</div>' +

      // Formato esperado
      '<div class="tw" style="margin-bottom:14px">' +
        '<div class="tw-h"><div class="tw-ht">📋 Formato Esperado del Excel</div></div>' +
        '<div style="padding:14px 16px;font-size:.75rem;color:var(--text2)">' +
          '<div style="display:grid;grid-template-columns:1fr 1fr;gap:16px">' +
            '<div>' +
              '<div style="font-weight:700;margin-bottom:6px">📄 Hoja 1 — Reporte de Máquinas</div>' +
              '<div style="color:var(--muted)">• Filas 1-6: Encabezado del sistema</div>' +
              '<div style="color:var(--muted)">• Columna "Nombre": ID de máquina (F-EGT V55-057)</div>' +
              '<div style="color:var(--muted)">• Columna "Fabricante": AGS / EGT / Zitro / FBM / Merkur / Ortiz</div>' +
              '<div style="color:var(--muted)">• Columna "Netwin": ingreso neto de cada máquina por día</div>' +
              '<div style="color:var(--muted)">• Columna "Coin In": total apostado</div>' +
            '</div>' +
            '<div>' +
              '<div style="font-weight:700;margin-bottom:6px">📄 Hoja 2 — Comisiones (opcional)</div>' +
              '<div style="color:var(--muted)">• Proveedor | Tipo de Máquina | % sobre NetWin</div>' +
              '<div style="color:var(--muted)">• Columnas 4-9: Nombres de máquinas del tipo</div>' +
              '<div style="color:var(--muted)">• Fila Operadora: % sobre toda la operación</div>' +
              '<div style="color:var(--green);margin-top:6px">✓ Si no hay Hoja 2, se usan las tasas previamente cargadas</div>' +
            '</div>' +
          '</div>' +
        '</div>' +
      '</div>' +

      // Historial de cortes
      '<div class="tw">' +
        '<div class="tw-h"><div class="tw-ht">📋 Cortes Cargados</div></div>' +
        '<div style="overflow-x:auto"><table class="bt">' +
          '<thead><tr><th>Período</th><th class="r">Máquinas</th><th class="r">Netwin Total</th><th class="r">Total Comisiones</th><th>Casino</th><th>Subido</th><th></th></tr></thead>' +
          '<tbody>' + _cierreHistorialRows(data.cortes) + '</tbody>' +
        '</table></div>' +
      '</div>';

    // Wire events
    var dz = document.getElementById('cierre-dropzone');
    var fi = document.getElementById('cierre-file-input');
    if (dz) {
      dz.onclick = function() { if (fi) fi.click(); };
      dz.ondragover = function(e) { e.preventDefault(); dz.style.borderColor = 'var(--green)'; dz.style.background = 'var(--green-bg)'; };
      dz.ondragleave = function() { dz.style.borderColor = 'var(--blue)'; dz.style.background = 'var(--blue-bg)'; };
      dz.ondrop = function(e) {
        e.preventDefault();
        dz.style.borderColor = 'var(--blue)'; dz.style.background = 'var(--blue-bg)';
        var f = e.dataTransfer.files[0];
        if (f) cierre_handleFile(f);
      };
    }
    if (fi) fi.onchange = function() { if (fi.files[0]) cierre_handleFile(fi.files[0]); };
  }

  function _cierreHistorialRows(cortes) {
    if (!cortes || !cortes.length) {
      return '<tr><td colspan="7" style="text-align:center;padding:24px;color:var(--muted);font-size:.8rem">Sin cortes cargados</td></tr>';
    }
    return cortes.map(function(c) {
      var kpis = c.kpis || {};
      var totalPagos = (kpis.totalComMaquineros || 0) + ((kpis.comOperadora || {}).total || 0);
      return '<tr>' +
        '<td class="bld">' + escapeHtml(c.desde + ' → ' + c.hasta) + '</td>' +
        '<td class="r">' + (c.maquinas||[]).length + '</td>' +
        '<td class="r mo pos">' + (kpis.netwinTotal ? '$' + (kpis.netwinTotal).toLocaleString('es-MX',{minimumFractionDigits:2}) : '—') + '</td>' +
        '<td class="r mo" style="color:var(--orange)">' + (totalPagos ? '$' + totalPagos.toLocaleString('es-MX',{minimumFractionDigits:2}) : '—') + '</td>' +
        '<td style="font-size:.7rem">' + escapeHtml(c.casino||'') + '</td>' +
        '<td style="font-size:.68rem;color:var(--muted)">' + (c.uploadedAt||'') + '</td>' +
        '<td style="text-align:center"><button onclick="cierre_deleteCorte(' + c.id + ')" style="background:none;border:none;cursor:pointer;color:var(--muted);font-size:.75rem" title="Eliminar">🗑</button></td>' +
      '</tr>';
    }).join('');
  }

  // ── PARSED PREVIEW (temp storage) ────────────────────────────
  var _cierre_parsed = null;

  function cierre_handleFile(file) {
    var statusEl  = document.getElementById('cierre-status');
    var previewEl = document.getElementById('cierre-preview');
    var saveBtn   = document.getElementById('cierre-save-btn');

    if (!statusEl) return;
    statusEl.style.display = '';
    statusEl.style.background = 'var(--blue-bg)';
    statusEl.style.color = 'var(--blue)';
    statusEl.innerHTML = '⏳ Procesando <b>' + escapeHtml(file.name) + '</b>...';
    if (previewEl) previewEl.style.display = 'none';
    if (saveBtn)   saveBtn.style.display   = 'none';
    _cierre_parsed = null;

    if (typeof XLSX === 'undefined') {
      statusEl.style.background = 'var(--red-lt)'; statusEl.style.color = 'var(--red)';
      statusEl.innerHTML = '⚠ Librería XLSX no disponible. Recarga la página.'; return;
    }

    var reader = new FileReader();
    reader.onload = function(e) {
      try {
        var wb = XLSX.read(new Uint8Array(e.target.result), { type: 'array' });
        var parsed = parseCierreExcel(wb);
        if (!parsed || !parsed.maquinas || !parsed.maquinas.length) {
          var dbg = parsed && parsed._debug ? parsed._debug : {};
          statusEl.style.background = 'var(--red-lt)'; statusEl.style.color = 'var(--red)';
          statusEl.innerHTML = '⚠ No se encontraron datos de máquinas en el archivo.' +
            '<br><span style="font-size:.7rem">Hojas: ' + escapeHtml(wb.SheetNames.join(', ')) + '</span>' +
            '<br><span style="font-size:.7rem">Headers detectados en fila: ' + (dbg.headerRow >= 0 ? dbg.headerRow : 'ninguna') +
            ' · Col Nombre: ' + dbg.colNom + ' · Col Fabricante: ' + dbg.colFab +
            ' · Col Netwin: ' + dbg.colNetwin + ' · Total filas: ' + dbg.totalRows + '</span>' +
            '<br><span style="font-size:.7rem;color:var(--text2)">Verifica que el archivo sea el reporte de máquinas del sistema de casino (Wigos u otro).</span>';
          return;
        }
        _cierre_parsed = parsed;

        // Status OK
        statusEl.style.background = 'var(--green-bg)'; statusEl.style.color = 'var(--green)';
        statusEl.innerHTML = '✅ Archivo válido · ' + parsed.maquinas.length + ' máquinas · ' +
          (parsed.tasas && parsed.tasas.length ? parsed.tasas.length + ' tasas detectadas' : 'usando tasas previas');

        // Preview
        var data = cierreLoad();
        var tasas = (parsed.tasas && parsed.tasas.length) ? parsed.tasas : (data.tasas.length ? data.tasas : DEFAULT_TASAS);
        var kpis  = cierreCalcular(parsed.maquinas, tasas);
        if (previewEl) {
          previewEl.style.display = '';
          previewEl.innerHTML = _buildCierrePreview(parsed, kpis);
        }
        if (saveBtn) saveBtn.style.display = '';

      } catch(err) {
        statusEl.style.background = 'var(--red-lt)'; statusEl.style.color = 'var(--red)';
        statusEl.innerHTML = '⚠ Error al procesar el archivo: ' + escapeHtml(String(err.message || err));
        console.warn('[Cierre] parse error:', err);
      }
    };
    reader.onerror = function() {
      statusEl.style.background = 'var(--red-lt)'; statusEl.style.color = 'var(--red)';
      statusEl.innerHTML = '⚠ Error al leer el archivo.';
    };
    reader.readAsArrayBuffer(file);
  }

  function _buildCierrePreview(parsed, kpis) {
    var nt  = kpis.netwinTotal || 0;
    var cmt = kpis.totalComMaquineros || 0;
    var cop = kpis.comOperadora || {};
    var neo = kpis.netoStellaris || 0;
    function fC(n) { return '$' + Math.abs(n).toLocaleString('es-MX',{minimumFractionDigits:2}); }
    function fP(p) { return (p*100).toFixed(0) + '%'; }

    var provRows = (kpis.proveedorItems||[]).map(function(p) {
      return '<tr>' +
        '<td><b>' + escapeHtml(p.proveedor) + '</b></td>' +
        '<td class="r">' + p.nMaquinas + '</td>' +
        '<td class="r mo">' + fC(p.netwin) + '</td>' +
        '<td class="r" style="font-size:.7rem;color:var(--muted)">' + p.grupos.map(function(g){ return g.tipo + ' ' + fP(g.pct); }).join(', ') + '</td>' +
        '<td class="r mo">' + fC(p.comBase) + '</td>' +
        '<td class="r mo" style="color:var(--muted)">' + fC(p.iva) + '</td>' +
        '<td class="r mo bld">' + fC(p.total) + '</td>' +
      '</tr>';
    }).join('');

    return '<div style="background:var(--white);border:1px solid var(--border);border-radius:var(--r);padding:14px">' +
      '<div style="font-weight:700;font-size:.82rem;margin-bottom:10px">👁 Vista previa — ' + escapeHtml(parsed.desde||'') + ' → ' + escapeHtml(parsed.hasta||'') + '</div>' +
      '<div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:12px">' +
        '<div style="flex:1;min-width:120px;padding:8px 12px;background:var(--blue-bg);border-radius:8px;text-align:center">' +
          '<div style="font-size:.65rem;color:var(--muted)">NETWIN</div>' +
          '<div style="font-size:1rem;font-weight:800;color:var(--blue)">' + fC(nt) + '</div>' +
        '</div>' +
        '<div style="flex:1;min-width:120px;padding:8px 12px;background:var(--orange-bg);border-radius:8px;text-align:center">' +
          '<div style="font-size:.65rem;color:var(--muted)">COM. MAQUINEROS</div>' +
          '<div style="font-size:1rem;font-weight:800;color:var(--orange)">' + fC(cmt) + '</div>' +
        '</div>' +
        '<div style="flex:1;min-width:120px;padding:8px 12px;background:rgba(155,81,224,.08);border-radius:8px;text-align:center">' +
          '<div style="font-size:.65rem;color:var(--muted)">COM. OPERADORA</div>' +
          '<div style="font-size:1rem;font-weight:800;color:#9b51e0">' + fC(cop.total||0) + '</div>' +
        '</div>' +
        '<div style="flex:1;min-width:120px;padding:8px 12px;background:var(--green-bg);border-radius:8px;text-align:center">' +
          '<div style="font-size:.65rem;color:var(--muted)">NETO STELLARIS</div>' +
          '<div style="font-size:1rem;font-weight:800;color:var(--green)">' + fC(neo) + '</div>' +
        '</div>' +
      '</div>' +
      '<table class="bt" style="font-size:.72rem">' +
        '<thead><tr><th>Proveedor</th><th class="r">Máquinas</th><th class="r">Netwin</th><th class="r">Tasas</th><th class="r">Base</th><th class="r">IVA</th><th class="r">Total</th></tr></thead>' +
        '<tbody>' + provRows + '</tbody>' +
      '</table>' +
      (kpis.sinTasa&&kpis.sinTasa.length ? _sinTasaBlock(kpis.sinTasa) : '') +
    '</div>';
  }

  function _sinTasaBlock(sinTasa) {
    // Agrupa por nombre base (sin número terminal)
    var grupos = {};
    sinTasa.forEach(function(n) {
      var base = String(n).replace(/-\d+$/, '').trim();
      if (!grupos[base]) grupos[base] = 0;
      grupos[base]++;
    });
    var items = Object.keys(grupos).sort();
    var rows = items.map(function(b) {
      return '<tr><td style="font-family:monospace;font-size:.7rem">' + escapeHtml(b) + '</td>' +
             '<td style="text-align:right;color:var(--muted);font-size:.7rem">' + grupos[b] + ' terminal' + (grupos[b]>1?'es':'') + '</td></tr>';
    }).join('');
    return '<div style="margin-top:10px;border:1px solid var(--red);border-radius:8px;overflow:hidden">' +
      '<div style="background:var(--red-lt);padding:8px 12px;display:flex;justify-content:space-between;align-items:center;cursor:pointer" onclick="var b=document.getElementById(\'st-body\');b.style.display=b.style.display===\'none\'?\'block\':\'none\'">' +
        '<span style="font-size:.75rem;font-weight:700;color:var(--red)">⚠ ' + sinTasa.length + ' máquinas sin tasa asignada (' + items.length + ' modelos únicos)</span>' +
        '<span style="font-size:.68rem;color:var(--red)">▼ ver lista</span>' +
      '</div>' +
      '<div id="st-body" style="display:none;padding:8px 12px;background:var(--white)">' +
        '<div style="font-size:.68rem;color:var(--muted);margin-bottom:6px">Estas máquinas no tienen comisión asignada y no se incluyen en el cálculo. Comparte los nombres con el administrador para agregarlos.</div>' +
        '<table style="width:100%;border-collapse:collapse">' + rows + '</table>' +
      '</div>' +
    '</div>';
  }

  function cierre_confirmSave() {
    if (!_cierre_parsed) { toast('⚠ No hay datos para guardar'); return; }
    try {
      var corte = cierre_saveCorte(_cierre_parsed);
      toast('✅ Corte guardado: ' + corte.desde + ' → ' + corte.hasta + ' · ' + (corte.maquinas||[]).length + ' máquinas');
      _cierre_parsed = null;
      rCierreUpload(); // re-render upload view
    } catch(err) {
      toast('⚠ Error al guardar: ' + (err.message || err));
      console.warn('[Cierre] save error:', err);
    }
  }

  function cierre_clearAll() {
    if (!confirm('¿Eliminar TODOS los cortes cargados y empezar de cero?')) return;
    cierre_save({ tasas: [], cortes: [] });
    toast('🗑 Datos limpiados');
    rCierreUpload();
  }

  function cierre_deleteCorte(id) {
    if (!confirm('¿Eliminar este corte?')) return;
    var data = cierreLoad();
    data.cortes = data.cortes.filter(function(c){ return c.id !== id; });
    cierre_save(data);
    toast('🗑 Corte eliminado');
    rCierreUpload();
  }

  // ── EXPOSE ────────────────────────────────────────────────────
  window.rCierreUpload      = rCierreUpload;
  window.cierre_clearAll    = cierre_clearAll;
  window.cierre_handleFile  = cierre_handleFile;
  window.cierre_confirmSave = cierre_confirmSave;
  window.cierre_deleteCorte = cierre_deleteCorte;

  if (typeof registerView === 'function') {
    registerView('stel_cierre_upload', function(){ rCierreUpload(); });
  }

})(window);
