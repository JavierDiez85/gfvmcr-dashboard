// GF — Stellaris Casino: Upload UI (PDF + Excel)
(function(window) {
  'use strict';

  // ═══════════════════════════════════════
  // RENDER UPLOAD VIEW
  // ═══════════════════════════════════════
  function rCasinoUpload() {
    const el = document.getElementById('view-stel_casino_upload');
    if (!el) return;

    const data = casinoLoad();
    const cortes = data.cortes || [];

    el.innerHTML = `
      <div style="font-family:'Poppins',sans-serif;font-size:.95rem;font-weight:700;margin-bottom:4px">🎰 Carga de Datos — Casino Stellaris</div>
      <div style="font-size:.68rem;color:var(--muted);margin-bottom:14px">Sube los reportes PDF (Resumen de Caja) o Excel (Sesiones de Caja) del sistema Wigos</div>

      <div class="kpi-row c3" style="margin-bottom:14px">
        <div class="kpi-card" style="--ac:#e53935">
          <div class="kpi-top"><div class="kpi-lbl">Cortes Cargados</div><div class="kpi-ico" style="background:var(--red-bg);color:#e53935">📊</div></div>
          <div class="kpi-val" style="color:#e53935">${cortes.length}</div>
          <div class="kpi-d dnu">en el sistema</div>
        </div>
        <div class="kpi-card" style="--ac:var(--green)">
          <div class="kpi-top"><div class="kpi-lbl">Netwin Total</div><div class="kpi-ico" style="background:var(--green-bg);color:var(--green)">💰</div></div>
          <div class="kpi-val" style="color:var(--green)">${typeof fmt !== 'undefined' ? fmt(cortes.reduce((s,c) => s + (c.netwin||0), 0)) : '$0'}</div>
          <div class="kpi-d dnu">acumulado</div>
        </div>
        <div class="kpi-card" style="--ac:var(--blue)">
          <div class="kpi-top"><div class="kpi-lbl">Último Corte</div><div class="kpi-ico" style="background:var(--blue-bg);color:var(--blue)">📅</div></div>
          <div class="kpi-val" style="color:var(--blue);font-size:1rem">${cortes.length ? cortes[0].fecha + '<br><span style="font-size:.6rem;color:var(--muted)">' + (cortes[0].turno||'') + '</span>' : '—'}</div>
          <div class="kpi-d dnu">${cortes.length ? cortes[0].sala || '' : 'Sin datos'}</div>
        </div>
      </div>

      <!-- Upload zone -->
      <div class="tw" style="margin-bottom:14px">
        <div class="tw-h"><div class="tw-ht">📤 Subir Reporte</div></div>
        <div style="padding:16px">
          <div id="casino-dropzone" style="border:2px dashed var(--border2);border-radius:var(--r);padding:32px 20px;text-align:center;cursor:pointer;transition:border-color .2s">
            <div style="font-size:1.5rem;margin-bottom:8px">📄</div>
            <div style="font-size:.82rem;font-weight:600;color:var(--text)">Arrastra el PDF o Excel aquí</div>
            <div style="font-size:.68rem;color:var(--muted);margin-top:4px">Resumen de Caja (PDF) o Sesiones de Caja (Excel)</div>
            <input type="file" id="casino-file-input" accept=".pdf,.xlsx,.xls" style="display:none">
          </div>
          <div id="casino-upload-status" style="margin-top:10px;display:none"></div>
          <div id="casino-preview" style="margin-top:10px;display:none"></div>
        </div>
      </div>

      <!-- History table -->
      <div class="tw">
        <div class="tw-h">
          <div class="tw-ht">📋 Historial de Cortes (${cortes.length})</div>
        </div>
        <div style="overflow-x:auto">
          <table class="bt">
            <thead><tr>
              <th>Fecha</th><th>Turno</th><th class="r">Entradas</th><th class="r">Salidas</th>
              <th class="r">Resultado</th><th class="r">Jugado</th><th class="r" style="color:var(--green)">Netwin</th>
              <th class="r">Hold%</th><th class="r">Terminales</th><th class="r">Ocupación</th>
              <th>Proveedores</th><th>Acción</th>
            </tr></thead>
            <tbody id="casino-history-tbody">
              ${cortes.length === 0 ? '<tr><td colspan="12" style="text-align:center;color:var(--muted);padding:20px">Sin cortes cargados. Sube el primer PDF.</td></tr>' : ''}
              ${cortes.map(c => `<tr>
                <td class="bld">${escapeHtml(c.fecha)}</td>
                <td style="font-size:.65rem;color:var(--muted)">${escapeHtml(c.turno||'')}</td>
                <td class="mo">${fmt(c.entradas)}</td>
                <td class="mo neg">${fmt(c.salidas)}</td>
                <td class="mo pos bld">${fmt(c.resultado_caja)}</td>
                <td class="mo">${fmt(c.jugado)}</td>
                <td class="mo pos bld">${fmt(c.netwin)}</td>
                <td class="mo">${c.hold_pct ? c.hold_pct.toFixed(2)+'%' : '—'}</td>
                <td class="mo">${c.terminales||'—'}</td>
                <td class="mo">${c.ocupacion_actual ? c.ocupacion_actual.toFixed(1)+'%' : '—'}</td>
                <td style="font-size:.6rem;color:var(--muted)">${(c.proveedores||[]).length} prov.</td>
                <td><button class="casino-del-btn btn btn-out" data-id="${escapeHtml(c.id)}" style="font-size:.6rem;padding:2px 8px;color:var(--red);border-color:var(--red)">🗑</button></td>
              </tr>`).join('')}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Wire events
    const dropzone = document.getElementById('casino-dropzone');
    const fileInput = document.getElementById('casino-file-input');

    if (dropzone) {
      dropzone.addEventListener('click', () => fileInput && fileInput.click());
      dropzone.addEventListener('dragover', e => { e.preventDefault(); dropzone.style.borderColor = 'var(--blue)'; });
      dropzone.addEventListener('dragleave', () => { dropzone.style.borderColor = 'var(--border2)'; });
      dropzone.addEventListener('drop', e => {
        e.preventDefault();
        dropzone.style.borderColor = 'var(--border2)';
        const file = e.dataTransfer.files[0];
        if (file) _casinoProcessFile(file);
      });
    }
    if (fileInput) {
      fileInput.addEventListener('change', function() { if (this.files[0]) _casinoProcessFile(this.files[0]); });
    }

    // Delete buttons
    const tbody = document.getElementById('casino-history-tbody');
    if (tbody) {
      tbody.addEventListener('click', function(e) {
        const btn = e.target.closest('.casino-del-btn');
        if (!btn) return;
        const id = btn.dataset.id;
        if (typeof customConfirm === 'function') {
          customConfirm('¿Eliminar este corte?', 'Eliminar', function(ok) {
            if (!ok) return;
            casinoDeleteCorte(id);
            rCasinoUpload();
            toast('🗑 Corte eliminado');
          });
        } else {
          casinoDeleteCorte(id);
          rCasinoUpload();
        }
      });
    }
  }

  // ═══════════════════════════════════════
  // FILE PROCESSING
  // ═══════════════════════════════════════
  async function _casinoProcessFile(file) {
    const statusEl = document.getElementById('casino-upload-status');
    const previewEl = document.getElementById('casino-preview');
    if (!statusEl || !previewEl) return;

    statusEl.style.display = 'block';
    statusEl.innerHTML = '<div style="padding:8px;background:var(--blue-bg);border-radius:6px;font-size:.75rem;color:var(--blue)">⏳ Procesando ' + escapeHtml(file.name) + '...</div>';
    previewEl.style.display = 'none';

    const ext = file.name.split('.').pop().toLowerCase();

    try {
      if (ext === 'pdf') {
        // Read PDF as text (send to server for pdftotext, or use client-side)
        const text = await _readPDFAsText(file);
        if (!text || text.length < 50) throw new Error('No se pudo leer el PDF. Verifica que no esté protegido.');

        console.log('[Casino] PDF text extracted (' + text.length + ' chars):\n' + text.substring(0, 1000));
        const corte = parseCasinoPDF(text);
        console.log('[Casino] Parsed corte:', JSON.stringify(corte, null, 2));
        if (!corte.fecha) throw new Error('No se encontró la fecha en el PDF.');

        _showCasinoPreview(corte, file.name);

      } else if (ext === 'xlsx' || ext === 'xls') {
        // Parse Excel
        const ab = await file.arrayBuffer();
        const wb = XLSX.read(ab, { type: 'array' });
        const cajeros = parseCasinoExcel(wb);

        if (!cajeros.length) throw new Error('No se encontraron sesiones de caja en el Excel.');

        // Show cajeros preview and allow merge into existing corte
        _showCajerosPreview(cajeros, file.name);

      } else {
        throw new Error('Formato no soportado. Usa PDF o Excel.');
      }
    } catch (e) {
      statusEl.innerHTML = '<div style="padding:8px;background:var(--red-bg);border-radius:6px;font-size:.75rem;color:var(--red)">❌ ' + escapeHtml(e.message) + '</div>';
    }
  }

  // Read PDF text using PDF.js (already loaded via CDN)
  async function _readPDFAsText(file) {
    if (typeof pdfjsLib === 'undefined') {
      return await file.text();
    }
    try {
      const ab = await file.arrayBuffer();
      const pdf = await pdfjsLib.getDocument({ data: ab }).promise;
      let text = '';
      for (let i = 1; i <= pdf.numPages; i++) {
        const page = await pdf.getPage(i);
        const content = await page.getTextContent();
        // Reconstruct text with line breaks based on Y position
        let lastY = null;
        for (const item of content.items) {
          const y = Math.round(item.transform[5]);
          if (lastY !== null && Math.abs(y - lastY) > 5) text += '\n';
          else if (lastY !== null) text += ' ';
          text += item.str;
          lastY = y;
        }
        text += '\n\n';
      }
      return text;
    } catch (e) {
      console.warn('[Casino] PDF.js falló, intentando file.text():', e.message);
      return await file.text();
    }
  }

  function _showCasinoPreview(corte, filename) {
    const statusEl = document.getElementById('casino-upload-status');
    const previewEl = document.getElementById('casino-preview');

    statusEl.innerHTML = '<div style="padding:8px;background:var(--green-bg);border-radius:6px;font-size:.75rem;color:var(--green)">✅ PDF parseado correctamente — ' + escapeHtml(filename) + '</div>';

    previewEl.style.display = 'block';
    previewEl.innerHTML = `
      <div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:12px;margin-top:8px">
        <div style="font-weight:700;font-size:.8rem;margin-bottom:8px">📋 Preview del Corte</div>
        <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:6px;font-size:.7rem">
          <div><span style="color:var(--muted)">Fecha:</span> <b>${escapeHtml(corte.fecha)}</b></div>
          <div><span style="color:var(--muted)">Turno:</span> <b>${escapeHtml(corte.turno||'—')}</b></div>
          <div><span style="color:var(--muted)">Sala:</span> <b>${escapeHtml(corte.sala||'—')}</b></div>
          <div><span style="color:var(--muted)">Entradas:</span> <b style="color:var(--green)">${fmt(corte.entradas)}</b></div>
          <div><span style="color:var(--muted)">Salidas:</span> <b style="color:var(--red)">${fmt(corte.salidas)}</b></div>
          <div><span style="color:var(--muted)">Resultado:</span> <b>${fmt(corte.resultado_caja)}</b></div>
          <div><span style="color:var(--muted)">Jugado:</span> <b>${fmt(corte.jugado)}</b></div>
          <div><span style="color:var(--muted)">Netwin:</span> <b style="color:var(--green)">${fmt(corte.netwin)}</b></div>
          <div><span style="color:var(--muted)">Hold:</span> <b>${corte.hold_pct}%</b></div>
          <div><span style="color:var(--muted)">Terminales:</span> <b>${corte.terminales}</b></div>
          <div><span style="color:var(--muted)">Ocupación:</span> <b>${corte.ocupacion_actual}%</b></div>
          <div><span style="color:var(--muted)">Proveedores:</span> <b>${corte.proveedores.length}</b></div>
        </div>
        ${corte.proveedores.length ? `
          <div style="margin-top:8px;font-size:.65rem">
            <b>Proveedores:</b> ${corte.proveedores.map(p => escapeHtml(p.nombre) + ' (Hold ' + p.hold + '%)').join(' · ')}
          </div>
        ` : ''}
        <div style="margin-top:12px;display:flex;gap:8px">
          <button class="btn btn-blue casino-save-corte-btn" style="font-size:.72rem">💾 Guardar Corte</button>
          <button class="btn btn-out casino-cancel-btn" style="font-size:.72rem">Cancelar</button>
        </div>
      </div>
    `;

    // Wire save button
    previewEl.querySelector('.casino-save-corte-btn')?.addEventListener('click', function() {
      casinoAddCorte(corte);
      toast('✅ Corte guardado: ' + corte.fecha + ' ' + (corte.turno||''));
      rCasinoUpload();
    });
    previewEl.querySelector('.casino-cancel-btn')?.addEventListener('click', function() {
      previewEl.style.display = 'none';
      document.getElementById('casino-upload-status').style.display = 'none';
    });
  }

  function _showCajerosPreview(cajeros, filename) {
    const statusEl = document.getElementById('casino-upload-status');
    const previewEl = document.getElementById('casino-preview');

    const activos = cajeros.filter(c => c.entradas > 0 || c.salidas > 0);
    statusEl.innerHTML = '<div style="padding:8px;background:var(--green-bg);border-radius:6px;font-size:.75rem;color:var(--green)">✅ Excel parseado — ' + activos.length + ' cajeros con movimiento de ' + cajeros.length + ' sesiones — ' + escapeHtml(filename) + '</div>';

    previewEl.style.display = 'block';
    previewEl.innerHTML = `
      <div style="background:var(--bg);border:1px solid var(--border);border-radius:8px;padding:12px;margin-top:8px">
        <div style="font-weight:700;font-size:.8rem;margin-bottom:8px">👥 Cajeros (${activos.length} con movimiento)</div>
        <div style="overflow-x:auto">
          <table class="bt" style="min-width:400px">
            <thead><tr><th>Cajero</th><th class="r">Entradas</th><th class="r">Salidas</th><th class="r">Impuestos</th><th class="r">Resultado</th></tr></thead>
            <tbody>
              ${activos.map(c => `<tr>
                <td class="bld">${escapeHtml(c.nombre)}</td>
                <td class="mo">${fmt(c.entradas)}</td>
                <td class="mo neg">${fmt(c.salidas)}</td>
                <td class="mo">${fmt(c.impuestos)}</td>
                <td class="mo pos bld">${fmt(c.resultado)}</td>
              </tr>`).join('')}
              <tr style="font-weight:700;border-top:2px solid var(--border2)">
                <td>TOTAL</td>
                <td class="mo">${fmt(activos.reduce((s,c) => s + c.entradas, 0))}</td>
                <td class="mo neg">${fmt(activos.reduce((s,c) => s + c.salidas, 0))}</td>
                <td class="mo">${fmt(activos.reduce((s,c) => s + c.impuestos, 0))}</td>
                <td class="mo pos">${fmt(activos.reduce((s,c) => s + c.resultado, 0))}</td>
              </tr>
            </tbody>
          </table>
        </div>
        <div style="margin-top:8px;font-size:.65rem;color:var(--muted)">
          💡 Los datos de cajeros se adjuntan al último corte del día. Si no hay corte, sube primero el PDF.
        </div>
        <div style="margin-top:10px;display:flex;gap:8px">
          <button class="btn btn-blue casino-save-cajeros-btn" style="font-size:.72rem">💾 Adjuntar al Último Corte</button>
          <button class="btn btn-out casino-cancel-btn" style="font-size:.72rem">Cancelar</button>
        </div>
      </div>
    `;

    previewEl.querySelector('.casino-save-cajeros-btn')?.addEventListener('click', function() {
      const data = casinoLoad();
      if (!data.cortes.length) {
        toast('⚠️ No hay cortes cargados. Sube primero un PDF.');
        return;
      }
      // Attach to most recent corte
      data.cortes[0].cajeros = cajeros.filter(c => c.entradas > 0 || c.salidas > 0);
      casinoSave(data);
      toast('✅ Cajeros adjuntados al corte ' + data.cortes[0].fecha);
      rCasinoUpload();
    });
    previewEl.querySelector('.casino-cancel-btn')?.addEventListener('click', function() {
      previewEl.style.display = 'none';
      statusEl.style.display = 'none';
    });
  }

  // ═══════════════════════════════════════
  // EXPOSE + REGISTER
  // ═══════════════════════════════════════
  window.rCasinoUpload = rCasinoUpload;

  if (typeof registerView === 'function') {
    registerView('stel_casino_upload', rCasinoUpload);
  }

})(window);
