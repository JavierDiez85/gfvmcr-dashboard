// GF — Stellaris Casino: Bóveda Upload
(function(window) {
  'use strict';

  function rBovedaUpload() {
    var el = document.getElementById('view-stel_boveda_upload');
    if (!el) return;

    var data = bovedaLoad();
    var nArq = data.arqueos.length;
    var nFondos = data.fondos.length;
    var nIng = data.reportes.ingresos.length;
    var nGas = data.reportes.gastos.length;

    el.innerHTML = '<div style="font-family:Poppins,sans-serif;font-size:.95rem;font-weight:700;margin-bottom:4px">🏦 Carga de Datos — Boveda</div>' +
      '<div style="font-size:.68rem;color:var(--muted);margin-bottom:14px">Sube los reportes Excel de Boveda. Se detecta automaticamente el tipo.</div>' +

      // KPIs
      '<div class="kpi-row c3" style="margin-bottom:14px">' +
        '<div class="kpi-card" style="--ac:var(--blue)"><div class="kpi-top"><div class="kpi-lbl">Arqueos</div><div class="kpi-ico" style="background:var(--blue-bg);color:var(--blue)">📊</div></div><div class="kpi-val" style="color:var(--blue)">' + nArq + '</div><div class="kpi-d dnu">dias cargados</div></div>' +
        '<div class="kpi-card" style="--ac:var(--green)"><div class="kpi-top"><div class="kpi-lbl">Control Fondos</div><div class="kpi-ico" style="background:var(--green-bg);color:var(--green)">💰</div></div><div class="kpi-val" style="color:var(--green)">' + nFondos + '</div><div class="kpi-d dnu">fechas registradas</div></div>' +
        '<div class="kpi-card" style="--ac:var(--purple)"><div class="kpi-top"><div class="kpi-lbl">Reporte</div><div class="kpi-ico" style="background:var(--purple-bg);color:var(--purple)">📋</div></div><div class="kpi-val" style="color:var(--purple)">' + nIng + '/' + nGas + '</div><div class="kpi-d dnu">ingresos / gastos</div></div>' +
      '</div>' +

      // Upload zone
      '<div class="tw" style="margin-bottom:14px">' +
        '<div class="tw-h"><div class="tw-ht">📤 Subir Reporte de Boveda</div></div>' +
        '<div style="padding:16px">' +
          '<div id="boveda-dropzone" style="border:2px dashed var(--blue);border-radius:var(--r);padding:28px 20px;text-align:center;cursor:pointer;transition:border-color .2s;background:var(--blue-bg)">' +
            '<div style="font-size:1.4rem;margin-bottom:6px">📎</div>' +
            '<div style="font-size:.78rem;font-weight:600;color:var(--blue)">Arrastra el Excel aqui o haz clic para seleccionar</div>' +
            '<div style="font-size:.68rem;color:var(--muted);margin-top:3px">Se detecta automaticamente: Arqueo, Control de Fondo o Reporte</div>' +
            '<input type="file" id="boveda-file-input" accept=".xlsx,.xls" style="display:none">' +
          '</div>' +
          '<div id="boveda-status" style="display:none;font-size:.78rem;padding:10px 14px;border-radius:var(--r);margin-top:10px"></div>' +
          '<div id="boveda-preview" style="display:none;margin-top:10px"></div>' +
        '</div>' +
      '</div>' +

      // History
      '<div class="tw">' +
        '<div class="tw-h"><div class="tw-ht">📋 Datos Cargados</div></div>' +
        '<div style="overflow-x:auto"><table class="bt">' +
          '<thead><tr><th>Tipo</th><th>Periodo</th><th>Registros</th><th>Ultima Carga</th></tr></thead>' +
          '<tbody>' +
            '<tr><td class="bld">📊 Arqueo Boveda</td><td>' + (nArq ? data.arqueos[0].fecha + ' → ' + data.arqueos[nArq - 1].fecha : '—') + '</td><td class="r">' + nArq + ' dias</td><td style="font-size:.68rem;color:var(--muted)">' + (nArq ? data.arqueos[nArq - 1].uploaded_at?.slice(0, 10) || '' : '') + '</td></tr>' +
            '<tr><td class="bld">💰 Control de Fondo</td><td>' + (nFondos ? data.fondos[0].fecha + ' → ' + data.fondos[nFondos - 1].fecha : '—') + '</td><td class="r">' + nFondos + ' fechas</td><td style="font-size:.68rem;color:var(--muted)"></td></tr>' +
            '<tr><td class="bld">📋 Reporte Ingresos</td><td>Abril 2026</td><td class="r">' + nIng + ' dias</td><td style="font-size:.68rem;color:var(--muted)"></td></tr>' +
            '<tr><td class="bld">📋 Reporte Gastos</td><td>Abril 2026</td><td class="r">' + nGas + ' items</td><td style="font-size:.68rem;color:var(--muted)"></td></tr>' +
          '</tbody>' +
        '</table></div>' +
      '</div>';

    // Wire events
    var dz = document.getElementById('boveda-dropzone');
    var fi = document.getElementById('boveda-file-input');
    if (dz) {
      dz.onclick = function() { fi && fi.click(); };
      dz.ondragover = function(e) { e.preventDefault(); dz.style.borderColor = 'var(--green)'; };
      dz.ondragleave = function() { dz.style.borderColor = 'var(--blue)'; };
      dz.ondrop = function(e) { e.preventDefault(); dz.style.borderColor = 'var(--blue)'; if (e.dataTransfer.files[0]) _bovedaProcessFile(e.dataTransfer.files[0]); };
    }
    if (fi) fi.onchange = function() { if (fi.files[0]) _bovedaProcessFile(fi.files[0]); };
  }

  async function _bovedaProcessFile(file) {
    var statusEl = document.getElementById('boveda-status');
    var previewEl = document.getElementById('boveda-preview');
    if (!statusEl) return;
    statusEl.style.display = 'block';
    statusEl.style.background = 'var(--blue-bg)';
    statusEl.style.color = 'var(--blue)';
    statusEl.textContent = '⏳ Procesando ' + escapeHtml(file.name) + '...';
    if (previewEl) previewEl.style.display = 'none';

    try {
      var ab = await file.arrayBuffer();
      var wb = XLSX.read(ab, { type: 'array' });
      var tipo = detectBovedaExcelType(wb);

      if (tipo === 'arqueo') {
        var arqueos = parseArqueoExcel(wb);
        if (!arqueos.length) throw new Error('No se encontraron arqueos en el archivo.');
        statusEl.style.background = 'var(--green-bg)';
        statusEl.style.color = 'var(--green)';
        statusEl.textContent = '✅ Arqueo Boveda: ' + arqueos.length + ' dias detectados (' + arqueos[0].fecha + ' → ' + arqueos[arqueos.length - 1].fecha + ')';
        _bovedaShowPreview(previewEl, 'arqueo', arqueos, file.name);

      } else if (tipo === 'control_fondo') {
        var result = parseControlFondoExcel(wb);
        if (!result.fondos.length) throw new Error('No se encontraron datos de fondos.');
        statusEl.style.background = 'var(--green-bg)';
        statusEl.style.color = 'var(--green)';
        statusEl.textContent = '✅ Control de Fondo: ' + result.fondos.length + ' fechas detectadas';
        _bovedaShowPreview(previewEl, 'control_fondo', result, file.name);

      } else if (tipo === 'reporte') {
        var rep = parseReporteBovedaExcel(wb);
        statusEl.style.background = 'var(--green-bg)';
        statusEl.style.color = 'var(--green)';
        statusEl.textContent = '✅ Reporte Boveda: ' + rep.ingresos.length + ' dias de ingresos, ' + rep.gastos.length + ' gastos';
        _bovedaShowPreview(previewEl, 'reporte', rep, file.name);

      } else {
        throw new Error('Tipo de Excel no reconocido. Usa Arqueo, Control de Fondo o Reporte Boveda.');
      }
    } catch (e) {
      statusEl.style.background = 'var(--red-bg)';
      statusEl.style.color = 'var(--red)';
      statusEl.textContent = '❌ ' + escapeHtml(e.message);
    }
  }

  function _bovedaShowPreview(el, tipo, parsed, filename) {
    if (!el) return;
    el.style.display = 'block';
    var f = typeof fmt === 'function' ? fmt : function(v) { return '$' + Math.round(v).toLocaleString('es-MX'); };

    var html = '<div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:12px">';
    html += '<div style="font-weight:700;font-size:.8rem;margin-bottom:8px">Preview: ' + escapeHtml(filename) + '</div>';

    if (tipo === 'arqueo') {
      html += '<div style="font-size:.7rem;overflow-x:auto"><table class="bt"><thead><tr><th>Fecha</th><th class="r">Apertura</th><th class="r">T1</th><th class="r">T2</th><th class="r">SOB/FAL T1</th><th class="r">SOB/FAL T2</th></tr></thead><tbody>';
      parsed.forEach(function(a) {
        var sf1 = a.resumen_t1 ? a.resumen_t1.sob_fal : 0;
        var sf2 = a.resumen_t2 ? a.resumen_t2.sob_fal : 0;
        html += '<tr><td class="bld">' + escapeHtml(a.fecha) + '</td><td class="r mo">' + f(a.apertura.total) + '</td><td class="r mo">' + f(a.turno1.total) + '</td><td class="r mo">' + f(a.turno2.total) + '</td>';
        html += '<td class="r mo" style="color:' + (sf1 < 0 ? 'var(--red)' : sf1 > 0 ? 'var(--orange)' : 'var(--green)') + '">' + f(sf1) + '</td>';
        html += '<td class="r mo" style="color:' + (sf2 < 0 ? 'var(--red)' : sf2 > 0 ? 'var(--orange)' : 'var(--green)') + '">' + f(sf2) + '</td></tr>';
      });
      html += '</tbody></table></div>';
    } else if (tipo === 'control_fondo') {
      html += '<div style="font-size:.7rem">Fondos iniciales: ' + Object.keys(parsed.iniciales).map(function(k) { return escapeHtml(k) + ': ' + f(parsed.iniciales[k]); }).join(' · ') + '</div>';
      html += '<div style="font-size:.7rem;margin-top:4px">' + parsed.fondos.length + ' fechas de seguimiento</div>';
    } else if (tipo === 'reporte') {
      var totalIng = parsed.ingresos.reduce(function(s, r) { return s + r.importe_total; }, 0);
      var totalGas = parsed.gastos.reduce(function(s, r) { return s + r.importe_mn; }, 0);
      html += '<div style="font-size:.7rem">Ingresos totales: <b style="color:var(--green)">' + f(totalIng) + '</b> (' + parsed.ingresos.length + ' dias)</div>';
      html += '<div style="font-size:.7rem">Gastos totales: <b style="color:var(--red)">' + f(totalGas) + '</b> (' + parsed.gastos.length + ' items)</div>';
    }

    html += '<div style="margin-top:10px;display:flex;gap:8px">';
    html += '<button class="btn btn-blue boveda-save-btn" style="font-size:.72rem">💾 Guardar</button>';
    html += '<button class="btn btn-out boveda-cancel-btn" style="font-size:.72rem">Cancelar</button>';
    html += '</div></div>';

    el.innerHTML = html;

    el.querySelector('.boveda-save-btn').onclick = function() {
      var store = bovedaLoad();
      if (tipo === 'arqueo') {
        // Merge: replace existing dates, add new
        parsed.forEach(function(arq) {
          var idx = store.arqueos.findIndex(function(a) { return a.fecha === arq.fecha; });
          if (idx >= 0) store.arqueos[idx] = arq; else store.arqueos.push(arq);
        });
        store.arqueos.sort(function(a, b) { return a.fecha.localeCompare(b.fecha); });
      } else if (tipo === 'control_fondo') {
        // Replace all fondos
        store.fondos = parsed.fondos;
      } else if (tipo === 'reporte') {
        // Merge ingresos by fecha (replace existing)
        parsed.ingresos.forEach(function(ing) {
          var idx = store.reportes.ingresos.findIndex(function(r) { return r.fecha === ing.fecha; });
          if (idx >= 0) store.reportes.ingresos[idx] = ing; else store.reportes.ingresos.push(ing);
        });
        // Merge gastos by fecha+proveedor+concepto
        parsed.gastos.forEach(function(gas) {
          var idx = store.reportes.gastos.findIndex(function(r) { return r.fecha === gas.fecha && r.proveedor === gas.proveedor && r.concepto === gas.concepto; });
          if (idx >= 0) store.reportes.gastos[idx] = gas; else store.reportes.gastos.push(gas);
        });
      }
      bovedaSave(store);
      toast('✅ Datos de boveda guardados');
      rBovedaUpload();
    };

    el.querySelector('.boveda-cancel-btn').onclick = function() {
      el.style.display = 'none';
      document.getElementById('boveda-status').style.display = 'none';
    };
  }

  // ═══════════════════════════════════════
  // EXPOSE + REGISTER
  // ═══════════════════════════════════════
  window.rBovedaUpload = rBovedaUpload;

  if (typeof registerView === 'function') {
    registerView('stel_boveda_upload', rBovedaUpload);
  }

})(window);
